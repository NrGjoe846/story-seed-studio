import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper function to create HMAC SHA256 using Web Crypto API
async function createHmacSha256(key: string, message: string): Promise<string> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(key);
    const messageData = encoder.encode(message);

    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
    const hashArray = Array.from(new Uint8Array(signature));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Helper function to encode to base64
function base64Encode(str: string): string {
    return btoa(str);
}

// @ts-ignore - Deno.serve types are available at runtime
serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { action, amount, razorpay_payment_id, razorpay_order_id, razorpay_signature } = await req.json()

        // @ts-ignore - Deno.env is available at runtime in Supabase Edge Functions
        const key_id = Deno.env.get('RAZORPAY_KEY_ID')
        // @ts-ignore - Deno.env is available at runtime in Supabase Edge Functions
        const key_secret = Deno.env.get('RAZORPAY_KEY_SECRET')

        if (!key_id || !key_secret) {
            console.error('Razorpay keys not configured');
            return new Response(
                JSON.stringify({ error: 'Razorpay keys not configured on server' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Create Basic Auth header
        const authHeader = `Basic ${base64Encode(`${key_id}:${key_secret}`)}`;

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
            const expectedSignature = await createHmacSha256(key_secret, payload);

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

    } catch (error: unknown) {
        console.error('Edge Function Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Internal server error';
        return new Response(
            JSON.stringify({ error: errorMessage }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})

