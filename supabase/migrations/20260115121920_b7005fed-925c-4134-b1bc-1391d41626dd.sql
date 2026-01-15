-- Create table for custom OTPs
CREATE TABLE public.custom_otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  otp_type TEXT NOT NULL CHECK (otp_type IN ('signup', 'login', 'password_reset')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for fast lookups
CREATE INDEX idx_custom_otps_email_type ON public.custom_otps(email, otp_type);
CREATE INDEX idx_custom_otps_expires_at ON public.custom_otps(expires_at);

-- Enable RLS
ALTER TABLE public.custom_otps ENABLE ROW LEVEL SECURITY;

-- No direct access policies - only edge functions with service role can access
-- This ensures OTPs are only validated server-side

-- Create cleanup function for expired OTPs
CREATE OR REPLACE FUNCTION public.cleanup_expired_custom_otps()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.custom_otps 
  WHERE expires_at < now() OR used_at IS NOT NULL;
$$;