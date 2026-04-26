
# Plan: Stronger Duplicate-Registration Protection + Fix Build Errors

## Part 1 — Answer to your question (no code, just clarity)

**The "already registered" message you saw is NOT a bug.** It's the system correctly remembering that your normal browser already submitted once. Incognito = fresh browser ID = treated as new user. So registration itself works perfectly.

**Safety comparison:**

| Approach | Stops same person? | Blocks innocent users? |
|---|---|---|
| Old (IP + UA) | Weak — same person on diff WiFi gets through | ❌ Blocks family/office on shared WiFi |
| Current (client_id only) | Weak — incognito / cleared cookies bypass | ✅ Doesn't block innocents |
| **Hybrid (proposed)** | **Strong — email/phone always identifies them** | ✅ Doesn't block innocents |

→ **Hybrid is the safest and most production-ready.**

---

## Part 2 — What I'll change

### A. Strengthen duplicate detection in `submit-landing-page-registration` edge function

Block a new submission if **ANY** of these match a prior registration for the same landing page:

1. **Same email** (case-insensitive, trimmed) — strongest signal
2. **Same phone** (digits-only normalized) — if phone field is enabled
3. **Same `client_id` fingerprint** — catches same browser even without email match

Logic:
- Run 3 parallel checks against `landing_page_registrations` for the given `landing_page_id`
- If any match exists AND `max_submissions_per_user` is reached, return the friendly `limit_reached` message (200 OK, `success:false`) — same UX you have today
- Cooldown logic stays the same but now keyed on whichever match was found

This means:
- ✅ Family on same WiFi with different emails → all can register
- ✅ Same person trying incognito with same email → blocked
- ✅ Same person clearing cookies + new browser, same phone → blocked
- ⚠️ Only bypass = use a completely new email AND phone (acceptable friction; this is industry standard)

### B. Frontend toast clarity (`PublicLandingPage.tsx`)

The current "You have already registered for this session" message is good. I'll keep it but make sure it shows clearly when duplicate is detected by email/phone too (not just by client_id).

### C. Fix the build errors in `supabase/functions/process-email-queue/index.ts`

These are TypeScript strict-typing errors from the Supabase SDK (unrelated to DOB work, but blocking deploys). Two small fixes:

1. **Line 81** — `supabase.from('email_send_log').insert(...)` needs the payload typed as `any` (the table isn't in the generated types for edge functions).
2. **Line 88** — `supabase.rpc('move_to_dlq', {...})` needs `as any` cast on the args object (custom RPC not in generated types).
3. **Lines 210, 216, 276** — `moveToDlq(supabase, ...)` — the `supabase` parameter type signature in the helper is too strict; widen it to `any` or `SupabaseClient<any, any, any>`.

These are pure type-cast fixes — no runtime behavior changes.

---

## Files to edit

1. `supabase/functions/submit-landing-page-registration/index.ts` — hybrid duplicate check
2. `supabase/functions/process-email-queue/index.ts` — fix 5 TS errors (type casts only)
3. `src/pages/PublicLandingPage.tsx` — minor: ensure toast shows server's specific reason for email/phone duplicates

## What stays the same

- DOB validation, age gating, calendar checks — untouched
- Honeypot, rate limiting (10/hr per IP), confirmation email — untouched
- `max_submissions_per_user` and `submission_cooldown_hours` settings — untouched, just better enforced

## Verification after deploy

- Submit with email A in normal browser → success
- Submit again same browser → blocked ("already registered") ✅
- Open incognito, submit with **same email A** → blocked (NEW behavior) ✅
- Open incognito, submit with **different email B** → success ✅
- Build passes (no more TS errors in edge functions) ✅
