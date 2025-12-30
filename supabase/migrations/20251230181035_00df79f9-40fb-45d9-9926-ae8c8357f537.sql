-- Create activity_logs table for tracking admin and shipping activities
CREATE TABLE public.activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_email TEXT NOT NULL,
  actor_role TEXT NOT NULL CHECK (actor_role IN ('admin', 'shipping')),
  action_type TEXT NOT NULL,
  action_details JSONB,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  order_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access only (via edge functions with service role key)
-- No direct client access needed - all logging done via edge functions

-- Create index for faster queries
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_actor_email ON public.activity_logs(actor_email);
CREATE INDEX idx_activity_logs_action_type ON public.activity_logs(action_type);