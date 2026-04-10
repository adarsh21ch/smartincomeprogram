

## Fix R2 Custom Domain + Lovable Domain Conflict

### Problem
The root domain `smartincomeprogram.in` currently has an R2 DNS record pointing to the R2 bucket. This prevents Lovable from setting up the custom domain (needs an A record to `185.158.133.1`), and video uploads fail with network errors due to CORS.

### Solution: Use a subdomain for R2 video CDN

Use `cdn.smartincomeprogram.in` for video delivery and keep `smartincomeprogram.in` for the website.

### Steps

#### Step 1: Update Cloudflare DNS
In your Cloudflare dashboard for `smartincomeprogram.in`:

1. **Delete** the existing R2 record on `smartincomeprogram.in` (the one pointing to `smart-income-funnel`)
2. **Add** a new **CNAME** record:
   - Name: `cdn`
   - Target: Your R2 bucket public URL (or re-add the R2 custom domain as `cdn.smartincomeprogram.in` in the R2 bucket settings)
3. **Add** an **A record** for the root domain:
   - Name: `@`
   - Value: `185.158.133.1`
   - Proxied: Yes
4. Keep the existing `www` CNAME as-is

#### Step 2: Update R2 bucket custom domain
In Cloudflare R2 bucket settings:
- Remove `smartincomeprogram.in` as custom domain
- Add `cdn.smartincomeprogram.in` as the new custom domain

#### Step 3: Update R2 CORS policy
In your R2 bucket CORS settings, ensure these origins are allowed:
```json
[
  {
    "AllowedOrigins": [
      "https://smartincomeprogram.in",
      "https://www.smartincomeprogram.in",
      "https://funnelspark-growth.lovable.app",
      "https://cb4e093e-0bcb-428f-b101-0f9ed06766a5.lovableproject.com",
      "https://id-preview--cb4e093e-0bcb-428f-b101-0f9ed06766a5.lovable.app"
    ],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag", "Content-Length"],
    "MaxAgeSeconds": 3600
  }
]
```

#### Step 4: Update R2_PUBLIC_URL secret
Change `R2_PUBLIC_URL` from `https://smartincomeprogram.in` to `https://cdn.smartincomeprogram.in`

#### Step 5: Redeploy edge functions
Redeploy `confirm-r2-upload` and `upload-testimonial-video` to use the new CDN URL.

#### Step 6: Retry Lovable domain setup
Once the root domain A record points to `185.158.133.1`, go to **Project Settings → Domains** and click **Try again** for `smartincomeprogram.in`.

### Summary
- `smartincomeprogram.in` → Your website (Lovable)
- `cdn.smartincomeprogram.in` → Video CDN (R2)
- This matches your existing architecture pattern with `cdn.nevorai.com`

