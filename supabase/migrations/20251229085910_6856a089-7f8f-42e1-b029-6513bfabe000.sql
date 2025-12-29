-- Add tracking_number column to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS tracking_number text;

-- Add tracking_url column for optional tracking link
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS tracking_url text;