

## Video Streaming Fix — Refined Plan

### Root Cause
The 288MB video uploaded to R2 almost certainly has its **moov atom at the end of the file**. This means browsers must download the entire file before they can start playing, causing the 1-second play/pause stutter loop as the browser repeatedly tries and fails to parse incomplete data.

### Critical Constraint
**ffmpeg cannot run inside Supabase Edge Functions.** Edge functions run on Deno Deploy with ~150MB memory limits and short execution windows. Processing a 288MB video there is not possible.

### Practical Solution (3 parts)

---

#### Part 1: Client-Side Faststart Processing (Immediate Fix)
Use **mp4box.js** (a pure-JavaScript MP4 muxer/demuxer) in the browser to move the moov atom to the front **before uploading**. This is lightweight and works on files up to ~500MB in modern browsers.

- Install `mp4box` npm package
- In `r2VideoUpload.ts`, before uploading, run a faststart pass using mp4box.js to relocate the moov atom
- Extract `duration_seconds` from the parsed MP4 metadata
- Pass `durationSeconds` to `confirm-r2-upload` so it gets saved to the database
- Show a "Optimizing video..." step in the upload progress UI
- This fixes the core streaming issue without any server-side processing

#### Part 2: Upload Pipeline Hardening
- In `get-r2-upload-url`, add `CacheControl: "public, max-age=86400"` to the PutObjectCommand so R2 objects have proper cache headers
- In `confirm-r2-upload`, ensure `duration_seconds` from the client is saved
- Ensure the CDN URL (`cdn.nevorai.com`) is always used, never the raw R2 URL

#### Part 3: Player Stability
- In `StreamingVideo.tsx`, prevent re-mounting when parent re-renders by using a stable `srcRef` pattern (already partially done — verify no regressions)
- In `VideoPlayer.tsx` (member area), ensure the `<source>` element src is never changed while playing — use the ref pattern from StreamingVideo
- Remove `crossOrigin="anonymous"` if the CDN doesn't send proper CORS headers for credentialed requests (this can cause silent failures)

---

### Files to Change

| File | Change |
|------|--------|
| `package.json` | Add `mp4box` dependency |
| `src/lib/r2VideoUpload.ts` | Add faststart optimization step before upload |
| `src/pages/AdminVideosPage.tsx` | Show "Optimizing..." state during processing |
| `supabase/functions/get-r2-upload-url/index.ts` | Add CacheControl to PutObjectCommand |
| `supabase/functions/confirm-r2-upload/index.ts` | Save duration_seconds properly |
| `src/components/StreamingVideo.tsx` | Remove `crossOrigin="anonymous"`, minor stability fixes |
| `src/components/member/VideoPlayer.tsx` | Remove `crossOrigin="anonymous"`, use stable src pattern |

### Backfill Existing Videos
- Create a small utility (admin button or one-time script) that downloads the existing video, runs faststart via mp4box.js, and re-uploads. Or simply re-upload the video through the fixed pipeline.

### What This Fixes
- Videos will have moov atom at the start = instant playback start
- Browser can seek without downloading the whole file  
- Duration metadata saved to database
- Cache headers enable CDN edge caching
- No more stutter/pause loop

