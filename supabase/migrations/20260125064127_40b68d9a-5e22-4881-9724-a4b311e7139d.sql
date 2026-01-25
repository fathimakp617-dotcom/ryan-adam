-- Create withdrawal_requests table
CREATE TABLE public.withdrawal_requests (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    affiliate_id UUID NOT NULL,
    user_id UUID NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    -- Payment details
    payment_method TEXT NOT NULL,
    bank_name TEXT,
    account_number TEXT,
    ifsc_code TEXT,
    account_holder_name TEXT,
    upi_id TEXT,
    -- Contact info
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    -- Processing info
    processed_by TEXT,
    processed_at TIMESTAMP WITH TIME ZONE,
    transaction_id TEXT,
    admin_notes TEXT,
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own withdrawal requests"
ON public.withdrawal_requests
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own withdrawal requests"
ON public.withdrawal_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Block anonymous access to withdrawal_requests"
ON public.withdrawal_requests
FOR SELECT
USING (false);

CREATE POLICY "Block anonymous insert on withdrawal_requests"
ON public.withdrawal_requests
FOR INSERT
WITH CHECK (false);

CREATE POLICY "Block anonymous update on withdrawal_requests"
ON public.withdrawal_requests
FOR UPDATE
USING (false)
WITH CHECK (false);

CREATE POLICY "Block anonymous delete on withdrawal_requests"
ON public.withdrawal_requests
FOR DELETE
USING (false);

CREATE POLICY "Service role manages withdrawal_requests"
ON public.withdrawal_requests
FOR ALL
USING (true)
WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_withdrawal_requests_updated_at
    BEFORE UPDATE ON public.withdrawal_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();