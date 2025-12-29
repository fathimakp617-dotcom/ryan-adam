-- Add unique constraint on phone in profiles table
ALTER TABLE public.profiles ADD CONSTRAINT profiles_phone_unique UNIQUE (phone);

-- Create a function to check if email or phone already exists (accessible without auth)
CREATE OR REPLACE FUNCTION public.check_account_exists(check_email text, check_phone text)
RETURNS TABLE(email_exists boolean, phone_exists boolean)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    EXISTS(SELECT 1 FROM auth.users WHERE email = check_email) as email_exists,
    EXISTS(SELECT 1 FROM public.profiles WHERE phone = check_phone) as phone_exists;
$$;