-- Add banner_image column to events table
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS banner_image TEXT;

-- Create storage bucket for event banners
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-banners', 'event-banners', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for event banners
CREATE POLICY "Anyone can view event banners"
ON storage.objects FOR SELECT
USING (bucket_id = 'event-banners');

CREATE POLICY "Admins can upload event banners"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'event-banners' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update event banners"
ON storage.objects FOR UPDATE
USING (bucket_id = 'event-banners' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete event banners"
ON storage.objects FOR DELETE
USING (bucket_id = 'event-banners' AND has_role(auth.uid(), 'admin'));

-- Create views table for tracking story views
CREATE TABLE public.views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  registration_id UUID NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
  user_id UUID,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on views
ALTER TABLE public.views ENABLE ROW LEVEL SECURITY;

-- Views RLS policies
CREATE POLICY "Anyone can view views count"
ON public.views FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert views"
ON public.views FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can manage views"
ON public.views FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Add index for efficient view counting
CREATE INDEX idx_views_registration_id ON public.views(registration_id);

-- Enable realtime for events table
ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.views;