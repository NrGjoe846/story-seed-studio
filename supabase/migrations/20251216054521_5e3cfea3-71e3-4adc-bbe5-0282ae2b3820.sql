-- Add event_type column to events table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS event_type text DEFAULT 'both' CHECK (event_type IN ('school', 'college', 'both'));

-- Create storage bucket for college story PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('college-story-pdfs', 'college-story-pdfs', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for college-story-pdfs bucket
CREATE POLICY "Anyone can view college story PDFs"
ON storage.objects FOR SELECT
USING (bucket_id = 'college-story-pdfs');

CREATE POLICY "Authenticated users can upload college story PDFs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'college-story-pdfs' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own college story PDFs"
ON storage.objects FOR UPDATE
USING (bucket_id = 'college-story-pdfs' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own college story PDFs"
ON storage.objects FOR DELETE
USING (bucket_id = 'college-story-pdfs' AND auth.uid() IS NOT NULL);

-- Add pdf_url column to registrations table for college submissions
ALTER TABLE public.registrations
ADD COLUMN IF NOT EXISTS pdf_url text,
ADD COLUMN IF NOT EXISTS cover_page_url text;