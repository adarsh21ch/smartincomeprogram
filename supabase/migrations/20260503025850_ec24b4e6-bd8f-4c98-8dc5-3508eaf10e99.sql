
-- 1. Extend live_sessions (additive only)
ALTER TABLE public.live_sessions
  ADD COLUMN IF NOT EXISTS funnel_id uuid REFERENCES public.funnels(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS video_asset_id uuid REFERENCES public.video_assets(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS video_duration_seconds integer,
  ADD COLUMN IF NOT EXISTS scheduled_times jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'Asia/Kolkata',
  ADD COLUMN IF NOT EXISTS repeat_type text NOT NULL DEFAULT 'once',
  ADD COLUMN IF NOT EXISTS repeat_interval_hours integer,
  ADD COLUMN IF NOT EXISTS repeat_end_date date,
  ADD COLUMN IF NOT EXISTS replay_delay_minutes integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS replay_expires_hours integer,
  ADD COLUMN IF NOT EXISTS replay_per_slot boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS registration_required boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS registration_fields jsonb NOT NULL DEFAULT '{"name":true,"phone":false,"email":true}'::jsonb,
  ADD COLUMN IF NOT EXISTS registered_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_views integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS peak_concurrent integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reminder_sent boolean NOT NULL DEFAULT false;

-- Backfill scheduled_times for existing rows from legacy scheduled_at
UPDATE public.live_sessions
SET scheduled_times = jsonb_build_array(to_jsonb(scheduled_at))
WHERE scheduled_at IS NOT NULL AND scheduled_times = '[]'::jsonb;

-- 2. live_session_registrations
CREATE TABLE IF NOT EXISTS public.live_session_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.live_sessions(id) ON DELETE CASCADE,
  name text,
  email text,
  phone text,
  registered_at timestamptz NOT NULL DEFAULT now(),
  reminder_sent_at timestamptz,
  watched_duration_seconds integer NOT NULL DEFAULT 0,
  joined_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_lsr_session ON public.live_session_registrations(session_id);

ALTER TABLE public.live_session_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_register_published" ON public.live_session_registrations;
CREATE POLICY "public_register_published" ON public.live_session_registrations
  FOR INSERT TO public
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.live_sessions s
    WHERE s.id = session_id AND s.is_published = true
  ));

DROP POLICY IF EXISTS "owner_read_registrations" ON public.live_session_registrations;
CREATE POLICY "owner_read_registrations" ON public.live_session_registrations
  FOR SELECT TO public
  USING (EXISTS (
    SELECT 1 FROM public.live_sessions s
    WHERE s.id = session_id AND s.owner_id = auth.uid()
  ));

DROP POLICY IF EXISTS "owner_manage_registrations" ON public.live_session_registrations;
CREATE POLICY "owner_manage_registrations" ON public.live_session_registrations
  FOR ALL TO public
  USING (EXISTS (
    SELECT 1 FROM public.live_sessions s
    WHERE s.id = session_id AND s.owner_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.live_sessions s
    WHERE s.id = session_id AND s.owner_id = auth.uid()
  ));

DROP POLICY IF EXISTS "admin_full_registrations_v2" ON public.live_session_registrations;
CREATE POLICY "admin_full_registrations_v2" ON public.live_session_registrations
  FOR ALL TO public
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 3. live_session_analytics
CREATE TABLE IF NOT EXISTS public.live_session_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.live_sessions(id) ON DELETE CASCADE,
  session_slot timestamptz,
  unique_viewers integer NOT NULL DEFAULT 0,
  peak_concurrent integer NOT NULL DEFAULT 0,
  total_watch_seconds integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_lsa_session ON public.live_session_analytics(session_id);

ALTER TABLE public.live_session_analytics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_insert_analytics" ON public.live_session_analytics;
CREATE POLICY "public_insert_analytics" ON public.live_session_analytics
  FOR INSERT TO public
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.live_sessions s
    WHERE s.id = session_id AND s.is_published = true
  ));

DROP POLICY IF EXISTS "owner_read_analytics" ON public.live_session_analytics;
CREATE POLICY "owner_read_analytics" ON public.live_session_analytics
  FOR SELECT TO public
  USING (EXISTS (
    SELECT 1 FROM public.live_sessions s
    WHERE s.id = session_id AND s.owner_id = auth.uid()
  ));

DROP POLICY IF EXISTS "admin_full_analytics" ON public.live_session_analytics;
CREATE POLICY "admin_full_analytics" ON public.live_session_analytics
  FOR ALL TO public
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 4. Realtime for live_sessions (so public viewer auto-transitions)
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_sessions;
