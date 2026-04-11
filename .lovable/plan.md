

## Plan: Add Inline Video Playback in Admin Testimonial Editor

### Problem
The testimonial video preview in the admin editor shows a static thumbnail with a play icon, but clicking it does nothing. You want to watch the video right there without leaving the editor.

### Change

**File: `src/components/funnel/TestimonialVideoUpload.tsx`**

- Add a `playing` state toggle
- When the play button overlay is clicked, set `playing = true` and render a `<video>` element with `controls`, `autoPlay`, and the video `src` — replacing the static thumbnail view
- Add a click handler on the play button (not the whole card) to start playback
- When the video ends or the user clicks outside, return to the thumbnail preview
- Keep all existing upload/replace/remove functionality untouched

This is a minimal, safe change — only the preview area gains interactivity.

