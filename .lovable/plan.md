

## Update R2 Public URL to Custom Domain

### What
Replace the current `R2_PUBLIC_URL` secret (which likely points to the rate-limited `pub-*.r2.dev` URL) with your custom domain `https://smartincomeprogram.in`.

### Why
- Custom domain removes rate limiting
- Enables Cloudflare caching and CDN features
- Professional branded URLs for all video assets (e.g., `https://smartincomeprogram.in/videos/abc/video.mp4`)

### Steps

1. **Update the `R2_PUBLIC_URL` secret** to `https://smartincomeprogram.in` (no trailing slash)

2. **Redeploy affected edge functions** that reference `R2_PUBLIC_URL`:
   - `confirm-r2-upload` — sets `public_url` when confirming uploads
   - `upload-testimonial-video` — sets `public_url` for testimonial videos

3. **Verify** by testing the upload flow end-to-end

### Technical Details
- The edge functions construct URLs as `${R2_PUBLIC_URL}/${r2_key}`, so the secret must not have a trailing slash
- Existing videos in the database will still have old URLs — they'll continue working if the old public dev URL stays enabled, or we can run a migration to update them

