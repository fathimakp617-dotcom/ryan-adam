-- Create rate limits table for tracking authentication attempts
CREATE TABLE public.auth_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL, -- email or IP
  attempt_type text NOT NULL, -- 'login', 'signup', 'password_reset'
  attempts integer NOT NULL DEFAULT 1,
  first_attempt_at timestamp with time zone NOT NULL DEFAULT now(),
  blocked_until timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(identifier, attempt_type)
);

-- Enable RLS
ALTER TABLE public.auth_rate_limits ENABLE ROW LEVEL SECURITY;

-- Only service role can access this table
CREATE POLICY "Service role only for rate limits"
ON public.auth_rate_limits
FOR ALL
USING (false)
WITH CHECK (false);

-- Index for fast lookups
CREATE INDEX idx_rate_limits_identifier ON public.auth_rate_limits(identifier, attempt_type);
CREATE INDEX idx_rate_limits_blocked ON public.auth_rate_limits(blocked_until) WHERE blocked_until IS NOT NULL;

-- Cleanup function for expired rate limit records
CREATE OR REPLACE FUNCTION public.cleanup_expired_rate_limits()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.auth_rate_limits 
  WHERE first_attempt_at < now() - interval '1 hour';
$$;