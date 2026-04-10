import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import {
  S3Client,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
} from "https://esm.sh/@aws-sdk/client-s3@3.600.0";
import { getSignedUrl } from "https://esm.sh/@aws-sdk/s3-request-presigner@3.600.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const R2_ENDPOINT = Deno.env.get("R2_ENDPOINT") || "";
const R2_ACCESS_KEY_ID = Deno.env.get("R2_ACCESS_KEY_ID") || "";
const R2_SECRET_ACCESS_KEY = Deno.env.get("R2_SECRET_ACCESS_KEY") || "";
const R2_BUCKET_NAME = Deno.env.get("R2_BUCKET_NAME") || "";

function normalizeR2Endpoint(endpoint: string, bucketName: string): string {
  const trimmed = endpoint.trim().replace(/\/+$/, "");
  if (!trimmed) return trimmed;
  try {
    const url = new URL(trimmed);
    const pathParts = url.pathname.split("/").filter(Boolean);
    if (pathParts[0] === bucketName) url.pathname = "/";
    return url.toString().replace(/\/+$/, "");
  } catch {
    return trimmed;
  }
}

function getS3Client() {
  return new S3Client({
    region: "auto",
    endpoint: normalizeR2Endpoint(R2_ENDPOINT, R2_BUCKET_NAME),
    forcePathStyle: true,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function authenticateUser(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return null;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

function sanitizeFilename(filename: string): string {
  const ext = filename.lastIndexOf(".") >= 0 ? filename.slice(filename.lastIndexOf(".")).toLowerCase() : "";
  const name = filename.slice(0, filename.length - ext.length);
  const safe = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return (safe || "video") + ext;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const user = await authenticateUser(req);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json();
    const { action } = body;

    const s3 = getS3Client();
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ── ACTION: initiate ──────────────────────────────────────────
    // Creates DB record + S3 multipart upload, returns uploadId + videoId
    if (action === "initiate") {
      const { filename, contentType, title, totalParts } = body;
      if (!filename || !contentType) return json({ error: "Missing filename/contentType" }, 400);

      const safeFilename = sanitizeFilename(filename);

      // Create video_assets record
      const { data: video, error: dbErr } = await serviceClient.from("video_assets").insert({
        owner_id: user.id,
        title: title || filename,
        original_filename: filename,
        status: "uploading",
        upload_percent: 0,
        is_shared: true,
      }).select("id").single();

      if (dbErr) throw dbErr;

      const r2Key = `videos/${video.id}/${safeFilename}`;

      // Update r2_key
      await serviceClient.from("video_assets").update({ r2_key: r2Key }).eq("id", video.id);

      // Create multipart upload
      const createCmd = new CreateMultipartUploadCommand({
        Bucket: R2_BUCKET_NAME,
        Key: r2Key,
        ContentType: contentType,
        CacheControl: "public, max-age=86400",
      });

      const mpResult = await s3.send(createCmd);
      const uploadId = mpResult.UploadId;

      if (!uploadId) throw new Error("Failed to initiate multipart upload");

      console.log("Multipart upload initiated", { videoId: video.id, r2Key, uploadId, totalParts });

      return json({
        videoId: video.id,
        r2Key,
        uploadId,
      });
    }

    // ── ACTION: get-part-urls ─────────────────────────────────────
    // Generates presigned URLs for a batch of part numbers
    if (action === "get-part-urls") {
      const { r2Key, uploadId, partNumbers } = body;
      if (!r2Key || !uploadId || !partNumbers?.length) {
        return json({ error: "Missing r2Key/uploadId/partNumbers" }, 400);
      }

      // Verify the video belongs to this user
      const videoId = r2Key.split("/")[1]; // videos/{videoId}/filename
      const { data: video } = await serviceClient
        .from("video_assets")
        .select("owner_id")
        .eq("id", videoId)
        .single();

      if (!video || video.owner_id !== user.id) {
        return json({ error: "Forbidden" }, 403);
      }

      const urls: Record<number, string> = {};

      for (const partNumber of partNumbers) {
        const cmd = new UploadPartCommand({
          Bucket: R2_BUCKET_NAME,
          Key: r2Key,
          UploadId: uploadId,
          PartNumber: partNumber,
        });
        urls[partNumber] = await getSignedUrl(s3, cmd, { expiresIn: 3600 });
      }

      return json({ urls });
    }

    // ── ACTION: complete ──────────────────────────────────────────
    // Completes the multipart upload with ETags from all parts
    if (action === "complete") {
      const { r2Key, uploadId, parts, videoId } = body;
      if (!r2Key || !uploadId || !parts?.length || !videoId) {
        return json({ error: "Missing required fields" }, 400);
      }

      // Verify ownership
      const { data: video } = await serviceClient
        .from("video_assets")
        .select("owner_id")
        .eq("id", videoId)
        .single();

      if (!video || video.owner_id !== user.id) {
        return json({ error: "Forbidden" }, 403);
      }

      const completeCmd = new CompleteMultipartUploadCommand({
        Bucket: R2_BUCKET_NAME,
        Key: r2Key,
        UploadId: uploadId,
        MultipartUpload: {
          Parts: parts
            .sort((a: any, b: any) => a.PartNumber - b.PartNumber)
            .map((p: any) => ({
              PartNumber: p.PartNumber,
              ETag: p.ETag,
            })),
        },
      });

      await s3.send(completeCmd);

      console.log("Multipart upload completed", { videoId, r2Key, partsCount: parts.length });

      return json({ success: true });
    }

    // ── ACTION: abort ─────────────────────────────────────────────
    if (action === "abort") {
      const { r2Key, uploadId, videoId } = body;

      if (r2Key && uploadId) {
        try {
          const abortCmd = new AbortMultipartUploadCommand({
            Bucket: R2_BUCKET_NAME,
            Key: r2Key,
            UploadId: uploadId,
          });
          await s3.send(abortCmd);
        } catch (e) {
          console.warn("Abort multipart failed (may already be cleaned up):", e);
        }
      }

      if (videoId) {
        await serviceClient.from("video_assets").update({
          status: "failed",
          error_message: body.errorMessage || "Upload aborted",
        }).eq("id", videoId);
      }

      return json({ success: true });
    }

    return json({ error: `Unknown action: ${action}` }, 400);
  } catch (err: any) {
    console.error("r2-multipart-upload error:", err);
    return json({ error: err.message }, 500);
  }
});
