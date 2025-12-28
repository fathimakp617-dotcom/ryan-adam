-- Add user_id column to orders table
ALTER TABLE public.orders ADD COLUMN user_id uuid REFERENCES auth.users(id);

-- Update existing orders to link to users where possible (by email match)
-- This is done via profiles table lookup

-- Drop old email-based SELECT policy
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;

-- Drop old email-based INSERT policy  
DROP POLICY IF EXISTS "Authenticated users can create their own orders" ON public.orders;

-- Create new user_id-based SELECT policy
CREATE POLICY "Users can view their own orders by user_id"
ON public.orders
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create new user_id-based INSERT policy
CREATE POLICY "Authenticated users can create their own orders by user_id"
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);