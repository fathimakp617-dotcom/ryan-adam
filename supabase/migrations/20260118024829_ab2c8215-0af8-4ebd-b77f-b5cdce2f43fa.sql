-- Fix: Restrict public SELECT on product_reviews to only allow viewing own reviews
-- This forces public access through the secure product_reviews_public view that excludes customer_email

-- Drop the current overly permissive SELECT policy
DROP POLICY IF EXISTS "Public can view approved reviews without sensitive data" ON public.product_reviews;

-- Create a restrictive policy that only allows users to view their own reviews
-- Public read access should happen through the product_reviews_public view
CREATE POLICY "Users can view their own reviews"
ON public.product_reviews FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Block anonymous SELECT - they must use the view
CREATE POLICY "Block anonymous direct table access"
ON public.product_reviews FOR SELECT TO anon
USING (false);