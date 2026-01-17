-- 1. Fix custom_otps table - add proper RLS policy for service role only
CREATE POLICY "Service role only for custom_otps" 
ON public.custom_otps 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Block all user access to custom_otps
CREATE POLICY "Block all user access to custom_otps"
ON public.custom_otps
FOR ALL
TO authenticated, anon
USING (false)
WITH CHECK (false);

-- 2. Fix loyalty_rewards table - remove permissive policies and add proper ones
DROP POLICY IF EXISTS "Service role can manage loyalty rewards" ON public.loyalty_rewards;

-- Replace with service role specific policy
CREATE POLICY "Service role manages loyalty rewards"
ON public.loyalty_rewards
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 3. Fix whatsapp_logs table - make it service role only
DROP POLICY IF EXISTS "Service role can manage whatsapp_logs" ON public.whatsapp_logs;

CREATE POLICY "Service role manages whatsapp_logs"
ON public.whatsapp_logs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Block all user access to whatsapp_logs
CREATE POLICY "Block user access to whatsapp_logs"
ON public.whatsapp_logs
FOR ALL
TO authenticated, anon
USING (false)
WITH CHECK (false);

-- 4. Fix coupons table - make service role policy specific
DROP POLICY IF EXISTS "Service role manages coupons" ON public.coupons;

CREATE POLICY "Service role manages coupons"
ON public.coupons
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 5. Fix product_reviews table - remove customer_email from public visibility
-- We can't change the column visibility directly, but we can update policies
-- The issue is the insert policy allowing anyone to insert - this should require auth
DROP POLICY IF EXISTS "Anyone can create reviews" ON public.product_reviews;

CREATE POLICY "Authenticated users can create reviews"
ON public.product_reviews
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 6. Fix orders table - make service role insert policy specific
DROP POLICY IF EXISTS "Service role can insert orders" ON public.orders;

CREATE POLICY "Service role can insert orders"
ON public.orders
FOR INSERT
TO service_role
WITH CHECK (true);