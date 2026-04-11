
CREATE TABLE public.gmail_oauth_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  token_expiry timestamptz NOT NULL,
  gmail_email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.gmail_oauth_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view gmail tokens"
  ON public.gmail_oauth_tokens FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can insert gmail tokens"
  ON public.gmail_oauth_tokens FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update gmail tokens"
  ON public.gmail_oauth_tokens FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete gmail tokens"
  ON public.gmail_oauth_tokens FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_gmail_oauth_tokens_updated_at
  BEFORE UPDATE ON public.gmail_oauth_tokens
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
