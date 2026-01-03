-- Fix account enumeration vulnerability by requiring authentication
-- and returning generic response to prevent account discovery

DROP FUNCTION IF EXISTS public.check_account_exists(text, text);

CREATE OR REPLACE FUNCTION public.check_account_exists(check_email text, check_phone text)
RETURNS TABLE(email_exists boolean, phone_exists boolean)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    -- Only return real results if the caller is authenticated
    CASE 
      WHEN auth.uid() IS NOT NULL THEN EXISTS(SELECT 1 FROM auth.users WHERE email = check_email)
      ELSE false
    END as email_exists,
    CASE 
      WHEN auth.uid() IS NOT NULL THEN EXISTS(SELECT 1 FROM public.profiles WHERE phone = check_phone)
      ELSE false
    END as phone_exists;
$$;