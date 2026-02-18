-- Migration: Convert existing yt_link full URLs to just the filename/path
-- Strips the Supabase storage public URL prefix, keeping only the file path
-- e.g. "https://<project>.supabase.co/storage/v1/object/public/story-videos/abc-123.mp4"
--   -> "abc-123.mp4"

UPDATE public.registrations
SET yt_link = regexp_replace(
  yt_link,
  '^.*/storage/v1/object/(?:public|sign)/story-videos/',
  ''
)
WHERE yt_link IS NOT NULL
  AND yt_link LIKE '%/storage/v1/object/%/story-videos/%';
