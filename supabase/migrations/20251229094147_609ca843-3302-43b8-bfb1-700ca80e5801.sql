-- Enable REPLICA IDENTITY FULL for orders table to capture complete row data
ALTER TABLE public.orders REPLICA IDENTITY FULL;

-- Add orders table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;