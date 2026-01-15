-- Drop and recreate validate_coupon_code function to include free_shipping
DROP FUNCTION IF EXISTS public.validate_coupon_code(text);

CREATE FUNCTION public.validate_coupon_code(coupon_code text)
 RETURNS TABLE(code text, discount_percent numeric, discount_amount numeric, min_order_amount numeric, is_valid boolean, free_shipping boolean)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    c.code,
    c.discount_percent,
    c.discount_amount,
    c.min_order_amount,
    (c.is_active = true 
      AND (c.expires_at IS NULL OR c.expires_at > now())
      AND (c.max_uses IS NULL OR c.current_uses < c.max_uses)) as is_valid,
    COALESCE(c.free_shipping, false) as free_shipping
  FROM public.coupons c
  WHERE c.code = coupon_code;
$function$;