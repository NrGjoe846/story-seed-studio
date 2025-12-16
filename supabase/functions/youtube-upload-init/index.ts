import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, description, registrationId, fileName, fileSize, mimeType } = await req.json();

    console.log('YouTube Upload Init Request:', { title, description, registrationId, fileName, fileSize, mimeType });

    if (!title || !registrationId || !fileSize || !mimeType) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: title, registrationId, fileSize, mimeType' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const clientId = Deno.env.get('YOUTUBE_CLIENT_ID');
    const clientSecret = Deno.env.get('YOUTUBE_CLIENT_SECRET');
    const refreshToken = Deno.env.get('YOUTUBE_REFRESH_TOKEN');

    if (!clientId || !clientSecret || !refreshToken) {
      console.error('Missing YouTube API credentials');
      return new Response(
        JSON.stringify({ error: 'YouTube API credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 1: Exchange refresh token for access token
    console.log('Exchanging refresh token for access token...');
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    const tokenData = await tokenResponse.json();
    
    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error('Failed to get access token:', tokenData);
      return new Response(
        JSON.stringify({ error: 'Failed to authenticate with YouTube', details: tokenData }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const accessToken = tokenData.access_token;
    console.log('Access token obtained successfully');

    // Step 2: Initialize resumable upload session
    const videoMetadata = {
      snippet: {
        title: title,
        description: description || `Story submission for Story Seed Studio competition`,
        tags: ['Story Seed Studio', 'storytelling', 'competition'],
        categoryId: '22', // People & Blogs category
      },
      status: {
        privacyStatus: 'unlisted', // Upload as unlisted
        selfDeclaredMadeForKids: true,
      },
    };

    console.log('Initializing resumable upload session...');
    const uploadInitResponse = await fetch(
      `https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json; charset=UTF-8',
          'X-Upload-Content-Length': fileSize.toString(),
          'X-Upload-Content-Type': mimeType,
        },
        body: JSON.stringify(videoMetadata),
      }
    );

    if (!uploadInitResponse.ok) {
      const errorText = await uploadInitResponse.text();
      console.error('Failed to initialize upload:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to initialize YouTube upload', details: errorText }),
        { status: uploadInitResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const uploadUri = uploadInitResponse.headers.get('Location');
    
    if (!uploadUri) {
      console.error('No upload URI returned from YouTube');
      return new Response(
        JSON.stringify({ error: 'No upload URI returned from YouTube' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Upload session initialized successfully');

    return new Response(
      JSON.stringify({ 
        uploadUri,
        registrationId,
        message: 'Upload session initialized successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in youtube-upload-init:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
