import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    const { videoId, registrationId } = await req.json();

    console.log('YouTube Upload Complete Request:', { videoId, registrationId });

    if (!videoId || !registrationId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: videoId, registrationId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Construct YouTube URL
    const youtubeUrl = `https://youtu.be/${videoId}`;
    console.log('Constructed YouTube URL:', youtubeUrl);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Update the registration with the YouTube link
    const { data, error } = await supabase
      .from('registrations')
      .update({ yt_link: youtubeUrl })
      .eq('id', registrationId)
      .select()
      .single();

    if (error) {
      console.error('Failed to update registration:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to update registration with YouTube link', details: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Registration updated successfully:', data);

    return new Response(
      JSON.stringify({ 
        success: true,
        youtubeUrl,
        registrationId,
        message: 'YouTube link saved successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in youtube-upload-complete:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
