
-- Create invite_codes table
CREATE TABLE IF NOT EXISTS public.invite_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  created_by uuid REFERENCES public.profiles(id),
  max_uses integer DEFAULT 1,
  current_uses integer DEFAULT 0,
  is_active boolean DEFAULT true,
  expires_at timestamptz,
  label text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_invite_codes_code ON public.invite_codes(code);
CREATE INDEX idx_invite_codes_active ON public.invite_codes(is_active);

-- Enable RLS
ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "admin_manage_invite_codes" ON public.invite_codes
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Public can read active codes (for verification)
CREATE POLICY "public_verify_invite_code" ON public.invite_codes
  FOR SELECT USING (is_active = true);

-- Service role can update (for incrementing usage)
CREATE POLICY "service_role_update_invite_codes" ON public.invite_codes
  FOR UPDATE USING (auth.role() = 'service_role');

-- Create invite_code_uses table
CREATE TABLE IF NOT EXISTS public.invite_code_uses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_code_id uuid NOT NULL REFERENCES public.invite_codes(id),
  code text NOT NULL,
  user_id uuid REFERENCES public.profiles(id),
  user_email text,
  used_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.invite_code_uses ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "admin_read_code_uses" ON public.invite_code_uses
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Public can insert (during signup)
CREATE POLICY "public_insert_code_uses" ON public.invite_code_uses
  FOR INSERT WITH CHECK (true);
