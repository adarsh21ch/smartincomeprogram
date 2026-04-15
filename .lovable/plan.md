

# Fix: Mute Icon Glitch + Toast Spam on Seek Block

## Bug 1 — Muted icon / "Tap to unmute" shows even when video has audio

**Root cause**: `isMuted` state is initialized to `autoPlayMuted` (line 58). When `autoPlayMuted` is true, the video starts muted. But when the browser actually plays with sound (or the user unmutes), the `volumechange` listener should sync. However, the `UnmutePill` visibility check is `isMuted && isPlaying` — if the browser autoplays with sound but `isMuted` state was never updated (race condition where `volumechange` fires before the listener is attached), the pill stays visible incorrectly.

**Fix**:
- In the `loadedmetadata` handler, after attempting autoplay, explicitly sync `isMuted` from `video.muted` (read actual state from the element).
- Also sync on the `playing` event — set `setIsMuted(video.muted)` so whenever the video actually starts playing, the icon reflects reality.

## Bug 2 — "Forward seeking is disabled" toast fires 5-6 times at once

**Root cause**: The current debounce logic (lines 68-72) doesn't actually prevent duplicate toasts — it clears a timeout but fires `toast()` every time. On mobile touch, the `seeking` event fires rapidly (multiple times per gesture), and each one calls `showSeekDisabledToast()` which fires a new toast each time.

**Fix**:
- Add a proper cooldown: track the last toast timestamp in a ref, and only show a new toast if at least 3 seconds have passed since the last one.
- Use `toast.dismiss()` + single `toast()` pattern, or simply gate on timestamp.

## Bug 3 — Toast message too technical

**Current**: "Forward seeking is disabled"
**New**: "You can't skip ahead in this video" — simple, human language.

---

## Changes (single file: `VideoPlayer.tsx`)

1. **`showSeekDisabledToast`** — replace with timestamp-based cooldown (3s) and change message to "You can't skip ahead in this video".

2. **`handleLoaded` / autoplay block** — after `video.play()` resolves, explicitly call `setIsMuted(video.muted)` to sync real state.

3. **`handlePlaying` callback** — add `setIsMuted(video.muted)` so every time the video enters playing state, the mute icon reflects the actual audio state.

4. **`seekToPosition`** and **`onSeekingEvent`** — both call the debounced toast function (already do), but the debounce will now actually work with the cooldown.

No database, edge function, or other file changes needed.

