import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { encode as base64Encode } from "https://deno.land/std@0.177.0/encoding/base64.ts";
import { hmac } from "https://deno.land/x/hmac@v2.0.1/mod.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { action, amount, razorpay_payment_id, razorpay_order_id, razorpay_signature } = await req.json()

        const key_id = Deno.env.get('RAZORPAY_KEY_ID')
        const key_secret = Deno.env.get('RAZORPAY_KEY_SECRET')

        if (!key_id || !key_secret) {
            console.error('Razorpay keys not configured');
            return new Response(
                JSON.stringify({ error: 'Razorpay keys not configured on server' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Create Basic Auth header
        const authString = `${key_id}:${key_secret}`;
        const authHeader = `Basic ${base64Encode(new TextEncoder().encode(authString))}`;

        if (action === 'create-order') {
            if (!amount || amount <= 0) {
                return new Response(
                    JSON.stringify({ error: 'Invalid amount' }),
                    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
            }

            const orderPayload = {
                amount: amount,
                currency: "INR",
                receipt: "order_rcpt_" + Date.now(),
            };

            console.log('Creating Razorpay order with amount:', amount);

            const response = await fetch('https://api.razorpay.com/v1/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authHeader,
                },
                body: JSON.stringify(orderPayload),
            });

            const orderData = await response.json();

            if (!response.ok) {
                console.error('Razorpay API Error:', orderData);
                return new Response(
                    JSON.stringify({ error: orderData.error?.description || 'Failed to create order' }),
                    { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
            }

            console.log('Order created successfully:', orderData.id);
            return new Response(
                JSON.stringify(orderData),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        if (action === 'verify-signature') {
            if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
                return new Response(
                    JSON.stringify({ error: 'Missing verification parameters' }),
                    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
            }

            const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
            const expectedSignature = hmac("sha256", key_secret, payload, "utf8", "hex");

            if (expectedSignature === razorpay_signature) {
                console.log('Payment verified successfully:', razorpay_payment_id);
                return new Response(
                    JSON.stringify({ success: true, message: 'Payment verified successfully' }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            } else {
                console.error('Signature mismatch');
                return new Response(
                    JSON.stringify({ success: false, message: 'Invalid signature' }),
                    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }
        }

        return new Response(
            JSON.stringify({ error: 'Invalid action' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('Edge Function Error:', error);
        return new Response(
            JSON.stringify({ error: error.message || 'Internal server error' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
