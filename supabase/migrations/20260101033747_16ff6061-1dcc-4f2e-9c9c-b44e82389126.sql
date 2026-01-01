-- Block ALL anonymous access to orders table (not just SELECT)
CREATE POLICY "Block anonymous insert on orders" 
ON public.orders 
AS RESTRICTIVE
FOR INSERT 
TO anon
WITH CHECK (false);

CREATE POLICY "Block anonymous update on orders" 
ON public.orders 
AS RESTRICTIVE
FOR UPDATE 
TO anon
USING (false)
WITH CHECK (false);

CREATE POLICY "Block anonymous delete on orders" 
ON public.orders 
AS RESTRICTIVE
FOR DELETE 
TO anon
USING (false);

-- Ensure staff_members is completely locked down with explicit policies for each operation
DROP POLICY IF EXISTS "Service role only for staff_members" ON public.staff_members;

CREATE POLICY "Block all select on staff_members" 
ON public.staff_members 
AS RESTRICTIVE
FOR SELECT 
USING (false);

CREATE POLICY "Block all insert on staff_members" 
ON public.staff_members 
AS RESTRICTIVE
FOR INSERT 
WITH CHECK (false);

CREATE POLICY "Block all update on staff_members" 
ON public.staff_members 
AS RESTRICTIVE
FOR UPDATE 
USING (false)
WITH CHECK (false);

CREATE POLICY "Block all delete on staff_members" 
ON public.staff_members 
AS RESTRICTIVE
FOR DELETE 
USING (false);

-- Ensure expenses table is properly locked down
DROP POLICY IF EXISTS "Service role can manage expenses" ON public.expenses;

CREATE POLICY "Block all select on expenses" 
ON public.expenses 
AS RESTRICTIVE
FOR SELECT 
USING (false);

CREATE POLICY "Block all insert on expenses" 
ON public.expenses 
AS RESTRICTIVE
FOR INSERT 
WITH CHECK (false);

CREATE POLICY "Block all update on expenses" 
ON public.expenses 
AS RESTRICTIVE
FOR UPDATE 
USING (false)
WITH CHECK (false);

CREATE POLICY "Block all delete on expenses" 
ON public.expenses 
AS RESTRICTIVE
FOR DELETE 
USING (false);