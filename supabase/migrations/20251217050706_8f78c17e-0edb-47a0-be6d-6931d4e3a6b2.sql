-- Create storage bucket for story videos
INSERT INTO storage.buckets (id, name, public)
VALUES ('story-videos', 'story-videos', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for story videos
CREATE POLICY "Anyone can view story videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'story-videos');

CREATE POLICY "Authenticated users can upload story videos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'story-videos');

CREATE POLICY "Admins can delete story videos"
ON storage.objects FOR DELETE
USING (bucket_id = 'story-videos' AND has_role(auth.uid(), 'admin'::app_role));