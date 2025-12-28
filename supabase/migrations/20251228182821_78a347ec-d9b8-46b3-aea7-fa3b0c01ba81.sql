-- Fix RLS for orders table to handle guest orders (null user_id)
-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Users can view their own orders by user_id" ON public.orders;
DROP POLICY IF EXISTS "Block anonymous access to orders" ON public.orders;

-- Create comprehensive RLS policies for orders

-- 1. Authenticated users can only view their own orders (where user_id matches)
CREATE POLICY "Users can view their own orders"
ON public.orders
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 2. Block all access from anonymous users
CREATE POLICY "Block anonymous access to orders"
ON public.orders
FOR SELECT
TO anon
USING (false);

-- 3. Service role can insert orders (for both authenticated and guest checkouts)
-- This is already handled by existing policy, but let's ensure it exists
DROP POLICY IF EXISTS "Service role can insert orders" ON public.orders;
CREATE POLICY "Service role can insert orders"
ON public.orders
FOR INSERT
TO service_role
WITH CHECK (true);

-- 4. Authenticated users can insert their own orders
DROP POLICY IF EXISTS "Authenticated users can create their own orders by user_id" ON public.orders;
CREATE POLICY "Authenticated users can create their own orders"
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);