-- Fix the security definer view issue by setting SECURITY INVOKER
ALTER VIEW public.product_reviews_public SET (security_invoker = on);