import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.86.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendSMS = async (phone: string, message: string): Promise<boolean> => {
  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  const twilioPhone = Deno.env.get('TWILIO_PHONE_NUMBER');

  if (!accountSid || !authToken || !twilioPhone) {
    console.error('Twilio credentials not configured');
    return false;
  }

  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: phone.startsWith('+') ? phone : `+91${phone}`,
          From: twilioPhone,
          Body: message,
        }),
      }
    );

    const data = await response.json();
    console.log('Twilio response:', data);
    
    if (data.error_code) {
      console.error('Twilio error:', data.error_message);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error sending SMS:', error);
    return false;
  }
};

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Initialize Supabase client with service role key
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    const { action, phone, otp } = await req.json();
    
    // Normalize phone number (last 10 digits)
    const normalizedPhone = phone.replace(/\D/g, '').slice(-10);
    
    console.log('Action:', action, 'Normalized phone:', normalizedPhone);
    
    if (!normalizedPhone || normalizedPhone.length !== 10) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid phone number' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'send') {
      // Generate OTP
      const generatedOTP = generateOTP();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes expiry
      
      // Delete any existing OTPs for this phone
      const { error: deleteError } = await supabase
        .from('otp_codes')
        .delete()
        .eq('phone', normalizedPhone);
      
      if (deleteError) {
        console.log('Delete existing OTPs result:', deleteError);
      }
      
      // Store OTP in database
      console.log('Inserting OTP for phone:', normalizedPhone, 'OTP:', generatedOTP);
      const { data: insertData, error: insertError } = await supabase
        .from('otp_codes')
        .insert({
          phone: normalizedPhone,
          otp: generatedOTP,
          expires_at: expiresAt,
          verified: false,
        })
        .select();
      
      if (insertError) {
        console.error('Error storing OTP:', JSON.stringify(insertError));
        throw new Error('Failed to store OTP: ' + insertError.message);
      }
      
      console.log('OTP stored successfully:', JSON.stringify(insertData));
      
      // Verify the OTP was stored by reading it back
      const { data: verifyData, error: verifyError } = await supabase
        .from('otp_codes')
        .select('*')
        .eq('phone', normalizedPhone)
        .order('created_at', { ascending: false })
        .limit(1);
      
      console.log('Verification read:', JSON.stringify(verifyData), 'Error:', verifyError);
      
      // Send SMS
      const message = `Your Story Seed Studio verification code is: ${generatedOTP}. Valid for 5 minutes.`;
      const sent = await sendSMS(normalizedPhone, message);
      
      if (!sent) {
        console.log(`OTP for ${normalizedPhone}: ${generatedOTP}`);
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'OTP generated (SMS delivery may have failed)',
            devOtp: generatedOTP 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ success: true, message: 'OTP sent successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
      
    } else if (action === 'verify') {
      console.log('Verifying OTP for phone:', normalizedPhone, 'Provided OTP:', otp);
      
      // First, check all OTPs in database for debugging
      const { data: allOtps, error: allError } = await supabase
        .from('otp_codes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      console.log('All OTPs in DB:', JSON.stringify(allOtps), 'Error:', allError);
      
      // Fetch OTP from database using maybeSingle() to avoid error when no rows
      const { data: otpRecord, error: fetchError } = await supabase
        .from('otp_codes')
        .select('*')
        .eq('phone', normalizedPhone)
        .eq('verified', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      console.log('OTP record for phone:', JSON.stringify(otpRecord), 'Error:', fetchError);
      
      if (fetchError) {
        console.error('Fetch error:', fetchError);
        return new Response(
          JSON.stringify({ success: false, error: 'Error fetching OTP. Please try again.' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (!otpRecord) {
        console.log('No OTP found for phone:', normalizedPhone);
        return new Response(
          JSON.stringify({ success: false, error: 'No OTP found. Please request a new one.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Check if expired
      if (new Date() > new Date(otpRecord.expires_at)) {
        // Delete expired OTP
        await supabase.from('otp_codes').delete().eq('id', otpRecord.id);
        return new Response(
          JSON.stringify({ success: false, error: 'OTP has expired. Please request a new one.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Check if OTP matches
      if (otpRecord.otp !== otp) {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid OTP. Please try again.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // OTP verified, mark as used and delete
      await supabase.from('otp_codes').delete().eq('id', otpRecord.id);
      
      return new Response(
        JSON.stringify({ success: true, message: 'OTP verified successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
      
    } else {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
  } catch (error: unknown) {
    console.error('Error in send-otp function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
