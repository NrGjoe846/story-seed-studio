-- Create table to store OTP codes
CREATE TABLE public.otp_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL,
  otp TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  verified BOOLEAN DEFAULT false
);

-- Enable RLS
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert/select/delete OTP codes (edge function handles validation)
CREATE POLICY "Anyone can insert OTP codes" ON public.otp_codes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view OTP codes" ON public.otp_codes FOR SELECT USING (true);
CREATE POLICY "Anyone can delete OTP codes" ON public.otp_codes FOR DELETE USING (true);
CREATE POLICY "Anyone can update OTP codes" ON public.otp_codes FOR UPDATE USING (true);

-- Create index for faster lookups
CREATE INDEX idx_otp_codes_phone ON public.otp_codes(phone);

-- Auto-cleanup expired OTPs (optional trigger)
CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.otp_codes WHERE expires_at < now();
  RETURN NEW;
END;
$$;