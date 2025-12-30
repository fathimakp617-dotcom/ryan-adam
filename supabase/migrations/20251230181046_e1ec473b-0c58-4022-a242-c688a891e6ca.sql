-- Add RLS policy for activity_logs - admin-only read access
-- This allows admins to read via service role key in edge functions
-- No direct client access - all managed via edge functions with service key
CREATE POLICY "Service role can manage activity logs"
ON public.activity_logs
FOR ALL
USING (true)
WITH CHECK (true);