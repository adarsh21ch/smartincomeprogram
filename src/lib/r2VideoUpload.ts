import { supabase } from "@/integrations/supabase/client";

interface UploadVideoToR2Options {
  file: File;
  title?: string;
  timeoutMs?: number;
  onProgress?: (progress: number) => void;
  onStage?: (stage: string) => void;
}

interface UploadVideoToR2Result {
  publicUrl: string;
  videoId: string;
}

export const uploadVideoToR2 = async ({
  file, title, timeoutMs = 30 * 60 * 1000, onProgress, onStage,
}: UploadVideoToR2Options): Promise<UploadVideoToR2Result> => {
  let videoId: string | null = null;

  try {
    onStage?.("Preparing upload…");
    const { data, error } = await supabase.functions.invoke("get-r2-upload-url", {
      body: { filename: file.name, contentType: file.type || "video/mp4", title: title || file.name },
    });
    if (error || !data?.uploadUrl || !data?.videoId)
      throw new Error(data?.error || error?.message || "Failed to start upload");

    videoId = data.videoId;

    onStage?.("Uploading…");
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", data.uploadUrl);
      xhr.timeout = timeoutMs;
      xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100));
      });
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) { onProgress?.(100); resolve(); }
        else reject(new Error(`Upload failed (HTTP ${xhr.status})`));
      };
      xhr.onerror = () => reject(new Error("Network error while uploading video"));
      xhr.ontimeout = () => reject(new Error("Upload timed out"));
      xhr.send(file);
    });

    onStage?.("Finalizing…");

    // Extract duration from file if possible
    let durationSeconds: number | null = null;
    try {
      durationSeconds = await new Promise<number | null>((resolve) => {
        const tempVideo = document.createElement("video");
        tempVideo.preload = "metadata";
        tempVideo.muted = true;
        const objectUrl = URL.createObjectURL(file);
        const cleanup = () => { URL.revokeObjectURL(objectUrl); tempVideo.remove(); };
        const timeout = setTimeout(() => { cleanup(); resolve(null); }, 5000);
        tempVideo.onloadedmetadata = () => {
          clearTimeout(timeout);
          const dur = isFinite(tempVideo.duration) && tempVideo.duration > 0 ? Math.round(tempVideo.duration) : null;
          cleanup();
          resolve(dur);
        };
        tempVideo.onerror = () => { clearTimeout(timeout); cleanup(); resolve(null); };
        tempVideo.src = objectUrl;
      });
    } catch {
      // duration extraction is best-effort
    }

    const { data: confirmData, error: confirmError } = await supabase.functions.invoke("confirm-r2-upload", {
      body: { videoId, fileSizeBytes: file.size, durationSeconds },
    });
    if (confirmError || !confirmData?.publicUrl)
      throw new Error(confirmData?.error || confirmError?.message || "Confirmation failed");

    return { videoId, publicUrl: confirmData.publicUrl };
  } catch (error) {
    if (videoId) {
      try {
        await supabase.functions.invoke("confirm-r2-upload", {
          body: { videoId, failed: true, errorMessage: error instanceof Error ? error.message : "Upload failed" },
        });
      } catch { /* best effort */ }
    }
    throw error;
  }
};
