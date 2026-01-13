-- Drop existing insert policy
DROP POLICY IF EXISTS "Authenticated users can create reviews" ON public.product_reviews;

-- Allow anyone to create reviews (temporarily for testing)
CREATE POLICY "Anyone can create reviews" 
ON public.product_reviews 
FOR INSERT 
WITH CHECK (true);