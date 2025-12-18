-- Add event_images column to store additional activity images as an array
ALTER TABLE public.gallery_images 
ADD COLUMN event_images text[] DEFAULT '{}';

-- Create storage bucket for event activity images
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-activity-images', 'event-activity-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for event-activity-images bucket
CREATE POLICY "Anyone can view event activity images"
ON storage.objects FOR SELECT
USING (bucket_id = 'event-activity-images');

CREATE POLICY "Admins can upload event activity images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'event-activity-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update event activity images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'event-activity-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete event activity images"
ON storage.objects FOR DELETE
USING (bucket_id = 'event-activity-images' AND has_role(auth.uid(), 'admin'::app_role));