-- Create the WELCOME10 coupon for new signups (10% off)
INSERT INTO public.coupons (
  code,
  discount_percent,
  discount_amount,
  coupon_type,
  is_active,
  free_shipping,
  min_order_amount,
  max_uses,
  current_uses
) VALUES (
  'WELCOME10',
  10,
  NULL,
  'welcome',
  true,
  false,
  0,
  NULL,
  0
) ON CONFLICT (code) DO UPDATE SET
  discount_percent = 10,
  is_active = true,
  coupon_type = 'welcome';