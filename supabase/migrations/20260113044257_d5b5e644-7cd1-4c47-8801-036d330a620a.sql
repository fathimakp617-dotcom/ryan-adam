-- Drop existing RLS policies on product_reviews
DROP POLICY IF EXISTS "Service role can manage all reviews" ON public.product_reviews;
DROP POLICY IF EXISTS "Anyone can view approved reviews" ON public.product_reviews;
DROP POLICY IF EXISTS "Authenticated users can create reviews" ON public.product_reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON public.product_reviews;
DROP POLICY IF EXISTS "Users can delete their own reviews" ON public.product_reviews;

-- Create PERMISSIVE policies (default behavior)
-- Anyone can view approved reviews
CREATE POLICY "Anyone can view approved reviews" 
ON public.product_reviews 
FOR SELECT 
USING (is_approved = true);

-- Authenticated users can create reviews
CREATE POLICY "Authenticated users can create reviews" 
ON public.product_reviews 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own reviews
CREATE POLICY "Users can update their own reviews" 
ON public.product_reviews 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own reviews
CREATE POLICY "Users can delete their own reviews" 
ON public.product_reviews 
FOR DELETE 
USING (auth.uid() = user_id);