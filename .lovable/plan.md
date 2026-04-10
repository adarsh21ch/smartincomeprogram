

# Video Playback Optimization — Aligned with Reference Project

## What I found

After comparing the reference code you shared with this project's current implementation, **the upload pipeline is already nearly identical**. The edge functions (`get-r2-upload-url`, `confirm-r2-upload`), the client upload utility, and the DB schema all match.

The differences causing playback issues are:

1. **`get-r2-upload-url` has extra `normalizeR2Endpoint` logic and `forcePathStyle: true`** — the reference project does NOT use `forcePathStyle` or endpoint normalization. This can cause presigned URL mismatches.
2. **`get-r2-upload-url` adds `CacheControl` header** to the PutObjectCommand — the reference does not. This changes the presigned URL signature and can cause CORS/signing failures on some R2 configurations.
3. **`r2VideoUpload.ts` has complex multipart upload logic** that the reference project doesn't use — the reference keeps it simple with a single XHR PUT for all files. The multipart path introduces extra round-trips and failure points.
4. **`mp4Faststart.ts` tries to read the entire file into memory** for moov relocation — for 200MB+ files this can crash the browser tab or cause long freezes before upload even starts.
5. **Video players use `preload="auto"`** which tells the browser to download the entire file eagerly — for large raw MP4s this overwhelms bandwidth.

## Plan

### Step 1: Simplify `get-r2-upload-url` to match reference
- Remove `normalizeR2Endpoint` function
- Remove `forcePathStyle: true` from S3Client
- Remove `CacheControl` from PutObjectCommand
- Use the raw `R2_ENDPOINT` directly (as the reference does)

### Step 2: Simplify `r2VideoUpload.ts` to match reference
- Remove multipart upload path entirely (the reference uses single XHR PUT for all sizes)
- Keep: XHR with progress, 30min timeout, error cleanup
- Remove: `ensureFaststart` call — skip client-side moov relocation (it causes browser freezes on large files and the moov issue should be handled at encoding time, not upload time)
- Keep duration extraction only (lightweight, doesn't read whole file)

### Step 3: Simplify `mp4Faststart.ts`
- Remove the moov relocation logic (memory-intensive, unreliable for large files)
- Keep only the `extractDuration` function for metadata

### Step 4: Fix video playback across all players
- Change `preload="auto"` to `preload="metadata"` everywhere (StreamingVideo, VideoPlayer, PublicFunnel) — this is the single biggest improvement. `preload="auto"` tells the browser to download the entire 200MB file immediately, which is why playback stalls.
- Ensure `playsInline` is set everywhere
- Add `poster` attribute where thumbnails are available

### Step 5: Redeploy edge functions
- Deploy updated `get-r2-upload-url`
- `confirm-r2-upload` stays as-is (already matches reference)

## Files changed

| File | Change |
|------|--------|
| `supabase/functions/get-r2-upload-url/index.ts` | Remove normalizeR2Endpoint, forcePathStyle, CacheControl |
| `src/lib/r2VideoUpload.ts` | Remove multipart logic, remove faststart call, simple XHR PUT |
| `src/lib/mp4Faststart.ts` | Keep only extractDuration, remove moov relocation |
| `src/components/StreamingVideo.tsx` | `preload="metadata"` instead of `preload="auto"` |
| `src/components/member/VideoPlayer.tsx` | `preload="metadata"` instead of `preload="auto"` |
| `src/pages/PublicFunnel.tsx` | `preload="metadata"` instead of `preload="auto"` |

## No new secrets needed
All R2 secrets are already configured and match the reference project's requirements.

## Expected result
- Uploads work reliably (simple single PUT, no multipart complexity)
- Videos start playing immediately (browser only fetches metadata first, then streams on demand)
- Seeking works without re-downloading the entire file
- No browser tab freezes from moov relocation on large files

