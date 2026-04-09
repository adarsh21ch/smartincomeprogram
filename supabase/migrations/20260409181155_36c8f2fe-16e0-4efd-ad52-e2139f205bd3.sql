
-- Add 'member' to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'member';

-- Create program_settings table
CREATE TABLE public.program_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_name text NOT NULL DEFAULT 'Smart Income Program',
  program_tagline text DEFAULT 'Build Your Income. Build Your Future.',
  logo_url text,
  favicon_url text,
  hero_headline_line1 text DEFAULT 'Build Your Income.',
  hero_headline_line2 text DEFAULT 'Build Your Future.',
  hero_subtext text DEFAULT 'A structured learning and growth platform for driven individuals ready to build a secondary income through proven systems.',
  hero_pill_text text DEFAULT 'PRIVATE MEMBERS COMMUNITY',
  intro_video_url text,
  show_intro_video_button boolean DEFAULT true,
  feature_badges jsonb DEFAULT '[{"icon":"🔒","text":"Private Community"},{"icon":"📚","text":"Structured Learning"},{"icon":"🏆","text":"Proven System"}]'::jsonb,
  about_section_title text DEFAULT 'What is Smart Income Program?',
  about_paragraphs jsonb DEFAULT '[]'::jsonb,
  feature_cards jsonb DEFAULT '[]'::jsonb,
  active_register_landing_page_id uuid REFERENCES public.landing_pages(id) ON DELETE SET NULL,
  active_member_funnel_id uuid REFERENCES public.funnels(id) ON DELETE SET NULL,
  primary_color text DEFAULT '#D4AF37',
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.program_settings ENABLE ROW LEVEL SECURITY;

-- Public can read (needed for landing page render)
CREATE POLICY "Public read program settings"
  ON public.program_settings FOR SELECT
  USING (true);

-- Only admin can update
CREATE POLICY "Admin can update program settings"
  ON public.program_settings FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Only admin can insert (for safety)
CREATE POLICY "Admin can insert program settings"
  ON public.program_settings FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed default row
INSERT INTO public.program_settings (id) VALUES (gen_random_uuid());

-- Trigger for updated_at
CREATE TRIGGER update_program_settings_updated_at
  BEFORE UPDATE ON public.program_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
