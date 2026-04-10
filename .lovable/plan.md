

# Re-configure R2 Secrets for This Project

## Problem
The current R2 secrets (endpoint, keys, bucket, public URL) may point to a different Cloudflare account, causing uploaded videos to return 404 on playback.

## Plan
I'll ask you to re-submit all 5 R2 secrets with the correct values for this project's Cloudflare account:

1. **R2_ENDPOINT** — `https://<your-account-id>.r2.cloudflarestorage.com`
2. **R2_ACCESS_KEY_ID** — R2 API token access key
3. **R2_SECRET_ACCESS_KEY** — R2 API token secret key
4. **R2_BUCKET_NAME** — The bucket name (e.g. `my-videos`)
5. **R2_PUBLIC_URL** — The public URL for serving files (either `https://pub-xxx.r2.dev` or a custom domain like `https://cdn.yourdomain.com`)

After you provide these, I'll update all 5 secrets and then test the upload + playback flow end-to-end to confirm videos work.

## Where to find these in Cloudflare
1. Log in to **dash.cloudflare.com** → select the correct account
2. Go to **R2 Object Storage** → your bucket → **Settings** → copy the **S3 API endpoint** (that's `R2_ENDPOINT`)
3. The bucket name is shown at the top
4. For public URL: in bucket Settings → **Public access** → copy the public URL domain
5. For keys: **R2 Object Storage** → **Manage R2 API Tokens** → create or copy an existing token's Access Key ID and Secret Access Key

No code changes needed — just secret updates.

