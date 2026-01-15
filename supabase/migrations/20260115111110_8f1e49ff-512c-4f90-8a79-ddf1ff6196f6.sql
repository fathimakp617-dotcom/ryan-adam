-- Add free_shipping column to coupons table
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS free_shipping boolean DEFAULT false;

-- Update TEST10 coupon to include free shipping
UPDATE public.coupons SET free_shipping = true WHERE code = 'TEST10';