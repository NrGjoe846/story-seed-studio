import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Razorpay from "https://esm.sh/razorpay@2.9.2"
import { createHmac } from "https://deno.land/std@0.177.0/node/crypto.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { action, amount, razorpay_payment_id, razorpay_order_id, razorpay_signature } = await req.json()

        // Initialize Razorpay
        const key_id = Deno.env.get('RAZORPAY_KEY_ID')
        const key_secret = Deno.env.get('RAZORPAY_KEY_SECRET')

        if (!key_id || !key_secret) {
            throw new Error('Razorpay keys not configured')
        }

        const instance = new Razorpay({
            key_id: key_id,
            key_secret: key_secret,
        });

        if (action === 'create-order') {
            const options = {
                amount: amount, // amount in the smallest currency unit (paisa)
                currency: "INR",
                receipt: "order_rcptid_" + Date.now(),
            };

            try {
                const order = await instance.orders.create(options);
                return new Response(
                    JSON.stringify(order),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            } catch (err) {
                console.error("Razorpay Order Creation Error:", err);
                throw err;
            }
        }

        if (action === 'verify-signature') {
            const generated_signature = createHmac('sha256', key_secret)
                .update(razorpay_order_id + "|" + razorpay_payment_id)
                .digest('hex');

            if (generated_signature === razorpay_signature) {
                return new Response(
                    JSON.stringify({ success: true, message: 'Payment verified successfully' }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            } else {
                return new Response(
                    JSON.stringify({ success: false, message: 'Invalid signature' }),
                    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }
        }

        throw new Error('Invalid action')

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
