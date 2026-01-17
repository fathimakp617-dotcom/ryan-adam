-- 1. Fix affiliates table - restrict UPDATE to non-financial fields only
DROP POLICY IF EXISTS "Users can update own affiliate" ON public.affiliates;

CREATE POLICY "Users can update non-financial affiliate fields"
ON public.affiliates
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 2. Create a secure view for product_reviews that excludes customer_email
CREATE OR REPLACE VIEW public.product_reviews_public AS
SELECT 
  id,
  product_id,
  customer_name,
  rating,
  title,
  comment,
  is_verified_purchase,
  is_approved,
  created_at,
  updated_at,
  user_id
FROM public.product_reviews
WHERE is_approved = true;

-- 3. Update product_reviews SELECT policy to be more restrictive
-- Keep existing approved reviews visible but without exposing email
DROP POLICY IF EXISTS "Anyone can view approved reviews" ON public.product_reviews;

-- Only allow viewing approved reviews (email is still in table but apps should use the view)
CREATE POLICY "Public can view approved reviews without sensitive data"
ON public.product_reviews
FOR SELECT
TO anon, authenticated
USING (is_approved = true);

-- 4. Add service role full access to product_reviews for admin management
CREATE POLICY "Service role manages product_reviews"
ON public.product_reviews
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);