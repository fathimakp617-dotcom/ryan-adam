-- Allow users to update their own orders (for cancellation)
CREATE POLICY "Users can cancel their own orders"
ON public.orders
FOR UPDATE
USING (auth.uid() = user_id AND order_status = 'pending')
WITH CHECK (auth.uid() = user_id AND order_status IN ('pending', 'cancelled'));