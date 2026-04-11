-- funnel_steps: per-step unlock rules, time delay, speaker, video topics
ALTER TABLE public.funnel_steps
  ADD COLUMN IF NOT EXISTS unlock_condition text DEFAULT 'full_watch',
  ADD COLUMN IF NOT EXISTS unlock_percentage integer DEFAULT 80,
  ADD COLUMN IF NOT EXISTS time_delay_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS time_delay_minutes integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS speaker_name_custom text,
  ADD COLUMN IF NOT EXISTS speaker_title text,
  ADD COLUMN IF NOT EXISTS speaker_bio text,
  ADD COLUMN IF NOT EXISTS speaker_photo_url_custom text,
  ADD COLUMN IF NOT EXISTS speaker_mode_step text DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS video_topics_step_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS video_topics_step jsonb DEFAULT '[]'::jsonb;

-- funnels: scope selectors for speaker and video topics
ALTER TABLE public.funnels
  ADD COLUMN IF NOT EXISTS speaker_scope text DEFAULT 'global',
  ADD COLUMN IF NOT EXISTS video_topics_scope text DEFAULT 'global';

-- funnel_step_progress: track when condition was met + time spent
ALTER TABLE public.funnel_step_progress
  ADD COLUMN IF NOT EXISTS condition_met_at timestamptz,
  ADD COLUMN IF NOT EXISTS time_spent_seconds integer DEFAULT 0;