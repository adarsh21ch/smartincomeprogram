-- Add group admin flag to training_card_access
ALTER TABLE public.training_card_access
  ADD COLUMN IF NOT EXISTS is_group_admin boolean DEFAULT false;

-- Drop existing policies to recreate with group admin support
DROP POLICY IF EXISTS "admin_full_tca" ON public.training_card_access;
DROP POLICY IF EXISTS "subadmin_manage_tca" ON public.training_card_access;
DROP POLICY IF EXISTS "member_read_own_tca" ON public.training_card_access;

-- Admin: full access
CREATE POLICY "admin_full_tca" ON public.training_card_access
  FOR ALL USING (
    public.has_role(auth.uid(), 'admin'::app_role)
  );

-- Sub-admin: full access
CREATE POLICY "subadmin_manage_tca" ON public.training_card_access
  FOR ALL USING (
    public.has_role(auth.uid(), 'sub_admin'::app_role)
  );

-- Group admin: can manage access for cards where they are group admin
CREATE POLICY "group_admin_manage_tca" ON public.training_card_access
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.training_card_access ga
      WHERE ga.training_card_id = training_card_access.training_card_id
        AND ga.user_id = auth.uid()
        AND ga.is_active = true
        AND ga.is_group_admin = true
    )
  );

-- Members: read their own access
CREATE POLICY "member_read_own_tca" ON public.training_card_access
  FOR SELECT USING (auth.uid() = user_id AND is_active = true);