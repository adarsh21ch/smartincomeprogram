

## Plan: Revert to Native Video Player + Preload Video for Instant Playback

### What the user wants
1. Go back to the **older/native HTML5 video player** interface (with browser controls) instead of the custom `PostSubmitVideoPlayer`
2. **Preload the video in the background** while the user is filling the registration form, so it plays instantly after submission
3. Video should **autoplay muted** on the post-submit screen, with a "Tap to unmute" hint

### Is preloading safe?
Yes -- completely safe. We will use a hidden `<link rel="preload">` tag or a hidden `<video preload="auto">` element while the form is visible. The browser will buffer the video in the background. When the user submits, the video is already cached and plays instantly. This costs no extra bandwidth since the user will watch the video anyway.

### Changes

**File: `src/pages/PublicLandingPage.tsx`**
- Add a hidden `<video>` element (invisible, muted, `preload="auto"`) that loads the video URL as soon as the page data is fetched -- while the user is filling the form
- On form submit, when `submitted` becomes `true`, replace the custom `PostSubmitVideoPlayer` with a native `<video>` element that uses `autoPlay`, `muted`, `playsInline`, and standard browser `controls`
- Add a small "Tap to unmute" floating pill overlay (same as current) since autoplay requires muted
- Remove the `PostSubmitVideoPlayer` import

**File: `src/components/landing/PostSubmitVideoPlayer.tsx`**
- No deletion needed, but it will no longer be used on this page

### Technical detail
- The preload hidden video: `<video src={videoUrl} preload="auto" muted className="hidden" />` rendered whenever `video?.public_url` is available (even before submission)
- The visible video post-submit: native `<video>` with `ref`, `autoPlay`, `muted`, `playsInline`, `controls`, plus a small unmute hint overlay that disappears on click or after 5 seconds
- Use a `useEffect` to call `.play()` on mount as fallback for browsers that don't honor `autoPlay` attribute

