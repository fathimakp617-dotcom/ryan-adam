-- Add saved shipping address to profiles for express checkout
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS saved_address jsonb DEFAULT NULL;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);