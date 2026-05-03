
ALTER TABLE public.live_session_registrations
  ADD COLUMN IF NOT EXISTS confirmation_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS reminder_slot timestamptz;

ALTER TABLE public.live_sessions
  ADD COLUMN IF NOT EXISTS send_confirmation_email boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS send_reminder_email boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS reminder_minutes_before integer NOT NULL DEFAULT 15,
  ADD COLUMN IF NOT EXISTS email_subject text,
  ADD COLUMN IF NOT EXISTS email_body text;

CREATE INDEX IF NOT EXISTS idx_live_reg_session_email
  ON public.live_session_registrations(session_id, email)
  WHERE email IS NOT NULL;
