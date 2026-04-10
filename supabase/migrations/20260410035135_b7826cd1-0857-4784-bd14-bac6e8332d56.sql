
-- Add is_active to profiles for member deactivation
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Add courses funnel and about content to program_settings
ALTER TABLE public.program_settings
  ADD COLUMN IF NOT EXISTS active_courses_funnel_id uuid,
  ADD COLUMN IF NOT EXISTS about_title text DEFAULT 'About the Program',
  ADD COLUMN IF NOT EXISTS about_content text DEFAULT '';

-- Add foreign key for courses funnel
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'program_settings_active_courses_funnel_id_fkey'
  ) THEN
    ALTER TABLE public.program_settings
      ADD CONSTRAINT program_settings_active_courses_funnel_id_fkey
      FOREIGN KEY (active_courses_funnel_id) REFERENCES public.funnels(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Insert invite_code_required setting
INSERT INTO public.platform_settings (key, value)
VALUES ('invite_code_required', 'false')
ON CONFLICT (key) DO NOTHING;
