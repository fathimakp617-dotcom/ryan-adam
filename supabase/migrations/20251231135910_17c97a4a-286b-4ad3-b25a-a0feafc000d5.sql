-- Add cash_received column for COD orders
ALTER TABLE public.orders 
ADD COLUMN cash_received boolean DEFAULT false;

-- Add coupon_code column info to order confirmation emails
COMMENT ON COLUMN public.orders.cash_received IS 'Tracks whether cash payment has been received for COD orders';