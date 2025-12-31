-- Add return-related columns to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS return_status text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS return_reason text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS return_details text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS return_requested_at timestamp with time zone DEFAULT NULL;

-- Create index for return status queries
CREATE INDEX IF NOT EXISTS idx_orders_return_status ON public.orders(return_status) WHERE return_status IS NOT NULL;