-- Block anonymous access to orders table
CREATE POLICY "Block anonymous access to orders"
ON public.orders
FOR SELECT
TO anon
USING (false);

-- Block anonymous access to profiles table
CREATE POLICY "Block anonymous access to profiles"
ON public.profiles
FOR SELECT
TO anon
USING (false);

-- Block anonymous access to affiliates table
CREATE POLICY "Block anonymous access to affiliates"
ON public.affiliates
FOR SELECT
TO anon
USING (false);

-- Block anonymous access to coupons table (only service role should manage)
CREATE POLICY "Block anonymous access to coupons"
ON public.coupons
FOR SELECT
TO anon
USING (false);

-- Also block authenticated users from viewing all coupons (they should only validate via function)
CREATE POLICY "Block authenticated users from viewing all coupons"
ON public.coupons
FOR SELECT
TO authenticated
USING (false);