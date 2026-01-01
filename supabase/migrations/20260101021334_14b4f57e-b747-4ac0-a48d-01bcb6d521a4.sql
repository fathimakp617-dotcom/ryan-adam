-- Fix 1: Create staff_sessions table for proper token validation
CREATE TABLE IF NOT EXISTS public.staff_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  session_token text NOT NULL UNIQUE,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on staff_sessions
ALTER TABLE public.staff_sessions ENABLE ROW LEVEL SECURITY;

-- Only service role can manage sessions
CREATE POLICY "Service role only for staff_sessions"
ON public.staff_sessions FOR ALL
USING (false) WITH CHECK (false);

-- Create index for fast token lookups
CREATE INDEX idx_staff_sessions_token ON public.staff_sessions(session_token);
CREATE INDEX idx_staff_sessions_email ON public.staff_sessions(email);
CREATE INDEX idx_staff_sessions_expires ON public.staff_sessions(expires_at);

-- Fix 2: Fix activity_logs RLS - block all direct access
DROP POLICY IF EXISTS "Service role can manage activity logs" ON public.activity_logs;

-- Block all direct access from anon/authenticated users
CREATE POLICY "Block all direct access to activity logs"
ON public.activity_logs FOR SELECT
USING (false);

-- Allow inserts only via service role (edge functions will still work with service key)
CREATE POLICY "Service role can insert activity logs"
ON public.activity_logs FOR INSERT
WITH CHECK (true);

-- Fix 3: Make return-images bucket private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'return-images';

-- Drop the public view policy
DROP POLICY IF EXISTS "Public can view return images" ON storage.objects;

-- Allow users to view their own return images
CREATE POLICY "Users can view their own return images"
ON storage.objects FOR SELECT 
USING (
  bucket_id = 'return-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Cleanup function for expired sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.staff_sessions WHERE expires_at < now();
$$;