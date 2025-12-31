-- Add user_id and coupon_type to coupons table for loyalty coupons
ALTER TABLE public.coupons 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS coupon_type TEXT DEFAULT 'regular',
ADD COLUMN IF NOT EXISTS is_bogo BOOLEAN DEFAULT false;

-- Add index for user-specific coupon lookups
CREATE INDEX IF NOT EXISTS idx_coupons_user_id ON public.coupons(user_id);

-- Create loyalty_rewards table to track customer rewards
CREATE TABLE IF NOT EXISTS public.loyalty_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  order_count INTEGER NOT NULL DEFAULT 0,
  last_coupon_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on loyalty_rewards
ALTER TABLE public.loyalty_rewards ENABLE ROW LEVEL SECURITY;

-- RLS policies for loyalty_rewards
CREATE POLICY "Users can view their own loyalty rewards" 
ON public.loyalty_rewards 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage loyalty rewards" 
ON public.loyalty_rewards 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Update RLS on coupons to allow users to see their own loyalty coupons
CREATE POLICY "Users can view their own loyalty coupons" 
ON public.coupons 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_loyalty_rewards_updated_at
BEFORE UPDATE ON public.loyalty_rewards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();