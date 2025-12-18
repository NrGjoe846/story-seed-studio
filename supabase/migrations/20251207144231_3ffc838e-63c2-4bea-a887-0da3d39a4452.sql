-- Update registrations with null yt_link for testing
UPDATE registrations 
SET yt_link = 'https://youtu.be/d7zKpe1Eg1s' 
WHERE event_id = '4f871d06-c93e-4c2f-82ce-bfca9a88d7cc' 
AND yt_link IS NULL;