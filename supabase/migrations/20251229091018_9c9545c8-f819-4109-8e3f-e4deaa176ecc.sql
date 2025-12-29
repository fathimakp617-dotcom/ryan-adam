-- Create admin OTP sessions table
CREATE TABLE public.admin_otps (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  otp_hash text NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  verified boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_otps ENABLE ROW LEVEL SECURITY;

-- Only service role can access this table
CREATE POLICY "Service role only" ON public.admin_otps
FOR ALL USING (false) WITH CHECK (false);

-- Create index for faster lookups
CREATE INDEX idx_admin_otps_email ON public.admin_otps(email);

-- Auto-cleanup expired OTPs (function)
CREATE OR REPLACE FUNCTION public.cleanup_expired_admin_otps()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.admin_otps WHERE expires_at < now();
$$;