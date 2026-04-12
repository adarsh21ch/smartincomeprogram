
-- Add funnel linking to course_cards
ALTER TABLE public.course_cards
  ADD COLUMN IF NOT EXISTS funnel_id uuid REFERENCES public.funnels(id),
  ADD COLUMN IF NOT EXISTS funnel_slug text;

-- Create training_card_access table
CREATE TABLE IF NOT EXISTS public.training_card_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  training_card_id uuid NOT NULL REFERENCES public.course_cards(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  granted_by uuid NOT NULL REFERENCES public.profiles(id),
  granted_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  revoked_at timestamptz,
  revoked_by uuid REFERENCES public.profiles(id),
  UNIQUE(training_card_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tca_user ON public.training_card_access(user_id);
CREATE INDEX IF NOT EXISTS idx_tca_card ON public.training_card_access(training_card_id);
CREATE INDEX IF NOT EXISTS idx_tca_active ON public.training_card_access(is_active);

-- RLS
ALTER TABLE public.training_card_access ENABLE ROW LEVEL SECURITY;

-- Admin: full access
CREATE POLICY "admin_full_tca" ON public.training_card_access
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Sub-admin: full access
CREATE POLICY "subadmin_manage_tca" ON public.training_card_access
  FOR ALL USING (public.has_role(auth.uid(), 'sub_admin'));

-- Members: read their own active access
CREATE POLICY "member_read_own_tca" ON public.training_card_access
  FOR SELECT USING (auth.uid() = user_id AND is_active = true);
