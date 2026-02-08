
-- Fix withdrawal_requests: Change the permissive USING(true) service role policy to check for actual service role
DROP POLICY IF EXISTS "Service role manages withdrawal_requests" ON public.withdrawal_requests;

CREATE POLICY "Service role manages withdrawal_requests"
ON public.withdrawal_requests
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');
