-- Create events table
CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Everyone can view active events
CREATE POLICY "Anyone can view active events"
ON public.events
FOR SELECT
USING (is_active = true);

-- Admins can manage events
CREATE POLICY "Admins can manage events"
ON public.events
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add event_id to registrations table
ALTER TABLE public.registrations
ADD COLUMN event_id uuid REFERENCES public.events(id);

-- Add trigger for updated_at
CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample events
INSERT INTO public.events (name, description, is_active) VALUES
('Story Seed Summer 2025', 'Annual summer storytelling competition for young creators', true),
('Winter Tales 2025', 'Winter themed storytelling event', true),
('Spring Story Fest', 'Celebrate spring with creative stories', true);