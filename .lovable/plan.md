

## Desktop Layout Restructure

Currently the desktop uses a 2-column grid: left content + right sticky form. The user wants a single flowing column layout instead.

### New Desktop Layout (top to bottom)

```text
┌─────────────────────────────────────────────┐
│  [Hero Image/Sections]  │  [Speaker Card]   │
│  (left, ~60%)           │  (right, ~40%)    │
├─────────────────────────────────────────────┤
│        What Our Members Say (full width)     │
│   [testimonial] [testimonial] [testimonial]  │
│              ← swipeable →                   │
├─────────────────────────────────────────────┤
│       Register for the Session (centered)    │
│         [Full Name] [Email] [Age]            │
│         [Register Now →]                     │
└─────────────────────────────────────────────┘
```

### Changes in `src/pages/PublicLandingPage.tsx`

**Desktop layout block (lines 448-546):**

1. Replace the current 5-column grid with a vertical stack (`space-y-8`)
2. **Row 1**: A 2-column grid — left column has hero/sections content, right column has speaker card (name, photo, role, bio)
3. **Row 2**: Full-width `TestimonialsViewer` 
4. **Row 3**: Centered registration form card (`max-w-lg mx-auto`) — no longer sticky since it's at the bottom

This removes the sticky behavior (form is now naturally at the bottom after scrolling through social proof) and creates a clean conversion funnel: content → trust → action.

