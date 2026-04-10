

## R2 Custom Domain Migration — COMPLETED

### Setup
- `smartincomeprogram.in` → Website (Lovable custom domain)
- `cdn.smartincomeprogram.in` → Video CDN (Cloudflare R2)

### Done
- [x] Updated `R2_PUBLIC_URL` secret to `https://cdn.smartincomeprogram.in`
- [x] Redeployed edge functions: `confirm-r2-upload`, `upload-testimonial-video`, `get-r2-upload-url`

### User manual steps
- [ ] Update Cloudflare DNS (delete R2 root record, add `cdn` CNAME, add `@` A record → `185.158.133.1`)
- [ ] Update R2 bucket custom domain to `cdn.smartincomeprogram.in`
- [ ] Apply CORS policy to R2 bucket
- [ ] Retry Lovable domain setup in Project Settings → Domains
