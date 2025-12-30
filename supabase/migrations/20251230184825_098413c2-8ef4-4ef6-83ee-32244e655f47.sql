-- Create staff_notifications table to track emails sent to staff
CREATE TABLE public.staff_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_email TEXT NOT NULL,
  notification_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  recipients TEXT[] NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sent_by TEXT,
  order_number TEXT,
  details JSONB
);

-- Enable RLS
ALTER TABLE public.staff_notifications ENABLE ROW LEVEL SECURITY;

-- Service role only policy
CREATE POLICY "Service role only for staff_notifications"
  ON public.staff_notifications
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- Create index for faster lookups
CREATE INDEX idx_staff_notifications_email ON public.staff_notifications(staff_email);
CREATE INDEX idx_staff_notifications_sent_at ON public.staff_notifications(sent_at DESC);