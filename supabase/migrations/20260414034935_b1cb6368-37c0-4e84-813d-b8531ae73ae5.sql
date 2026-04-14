-- Feature 1: Step-level access code fields
ALTER TABLE public.funnel_steps
  ADD COLUMN IF NOT EXISTS access_code_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS access_code_hash text,
  ADD COLUMN IF NOT EXISTS access_code_message text DEFAULT 'To unlock this step, contact your mentor and request the access code for this session.';

-- Feature 1: Viewer step access tracking table
CREATE TABLE public.funnel_step_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_id uuid NOT NULL REFERENCES public.funnels(id) ON DELETE CASCADE,
  step_id uuid NOT NULL REFERENCES public.funnel_steps(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  access_granted boolean NOT NULL DEFAULT true,
  granted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (funnel_id, step_id, session_id)
);

ALTER TABLE public.funnel_step_access ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read their own access (matched by session_id in app code, no auth needed for public funnels)
CREATE POLICY "Anyone can read step access"
  ON public.funnel_step_access FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert step access"
  ON public.funnel_step_access FOR INSERT
  WITH CHECK (true);

-- Feature 2: Landing page privacy fields
ALTER TABLE public.landing_pages
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'public',
  ADD COLUMN IF NOT EXISTS access_code_hash text;