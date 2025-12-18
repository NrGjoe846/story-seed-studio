-- Add payment-related columns to events table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS is_payment_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS qr_code_url text;

-- Create storage bucket for payment QR codes
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-qr-codes', 'payment-qr-codes', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for payment-qr-codes bucket
CREATE POLICY "Anyone can view payment QR codes"
ON storage.objects FOR SELECT
USING (bucket_id = 'payment-qr-codes');

CREATE POLICY "Admins can upload payment QR codes"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'payment-qr-codes' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update payment QR codes"
ON storage.objects FOR UPDATE
USING (bucket_id = 'payment-qr-codes' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete payment QR codes"
ON storage.objects FOR DELETE
USING (bucket_id = 'payment-qr-codes' AND public.has_role(auth.uid(), 'admin'::app_role));