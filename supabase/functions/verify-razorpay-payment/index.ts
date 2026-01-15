import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Product prices - server-side source of truth (all prices include taxes, must match create-order)
// TESTING: All prices set to ₹10
const PRODUCT_PRICES: Record<string, number> = {
  "elite": 10,
  "amber-crown": 10,
  "legacy": 10,
  "combo": 10,
};

const VALID_PRODUCT_IDS = Object.keys(PRODUCT_PRICES);

interface VerifyPaymentRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  is_shipping_only?: boolean; // For COD shipping prepayment
  order_data?: {
    user_id?: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    shipping_address: {
      address: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    items: Array<{
      productId: string;
      name: string;
      price: number;
      quantity: number;
    }>;
    coupon_code?: string;
    affiliate_code?: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");

    if (!RAZORPAY_KEY_SECRET) {
      return new Response(
        JSON.stringify({ error: "Payment gateway not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      is_shipping_only,
      order_data,
    }: VerifyPaymentRequest = await req.json();

    // Verify signature
    const generatedSignature = await generateSignature(
      `${razorpay_order_id}|${razorpay_payment_id}`,
      RAZORPAY_KEY_SECRET
    );

    if (generatedSignature !== razorpay_signature) {
      console.error("Signature verification failed");
      return new Response(
        JSON.stringify({ error: "Payment verification failed" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Payment verified successfully:", razorpay_payment_id);

    // If this is just shipping verification for COD, return success without creating order
    if (is_shipping_only) {
      console.log("COD shipping payment verified successfully");
      return new Response(
        JSON.stringify({
          success: true,
          message: "Shipping payment verified",
          payment_id: razorpay_payment_id,
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // For full payment, order_data is required
    if (!order_data) {
      return new Response(
        JSON.stringify({ error: "Order data is required for full payment verification" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate items and calculate totals using SERVER-SIDE prices
    let subtotal = 0;
    for (const item of order_data.items) {
      // Validate product exists
      if (!VALID_PRODUCT_IDS.includes(item.productId)) {
        console.error("Invalid product ID:", item.productId);
        return new Response(
          JSON.stringify({ error: `Invalid product: ${item.productId}` }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Validate quantity
      const quantity = Math.floor(Number(item.quantity));
      if (quantity < 1 || quantity > 10) {
        console.error("Invalid quantity for product:", item.productId, quantity);
        return new Response(
          JSON.stringify({ error: `Invalid quantity for ${item.productId}` }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Use SERVER-SIDE price, not client-provided price
      const serverPrice = PRODUCT_PRICES[item.productId];
      subtotal += serverPrice * quantity;
    }
    
    let discount = 0;
    // Free shipping for online payments
    const shipping = 0;
    let validCouponCode: string | null = null;
    let validAffiliateCode: string | null = null;

    // Apply coupon if provided
    if (order_data.coupon_code) {
      console.log("Validating coupon for online payment:", order_data.coupon_code);
      
      // First get the full coupon details to update usage
      const { data: couponRecord, error: couponError } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', order_data.coupon_code.toUpperCase())
        .eq('is_active', true)
        .single();
      
      if (!couponError && couponRecord) {
        // Check expiry
        if (!couponRecord.expires_at || new Date(couponRecord.expires_at) > new Date()) {
          // Check usage limit
          if (!couponRecord.max_uses || (couponRecord.current_uses || 0) < couponRecord.max_uses) {
            // Check minimum order
            if (!couponRecord.min_order_amount || subtotal >= couponRecord.min_order_amount) {
              // Apply discount
              if (couponRecord.discount_amount) {
                discount = couponRecord.discount_amount;
              } else if (couponRecord.discount_percent) {
                discount = Math.round(subtotal * (couponRecord.discount_percent / 100));
              }
              validCouponCode = couponRecord.code;
              console.log("Coupon applied successfully, discount:", discount);

              // Increment coupon usage
              await supabase
                .from('coupons')
                .update({ current_uses: (couponRecord.current_uses || 0) + 1 })
                .eq('id', couponRecord.id);
              
              console.log("Coupon usage incremented");
            } else {
              console.log("Coupon minimum order not met");
            }
          } else {
            console.log("Coupon usage limit reached");
          }
        } else {
          console.log("Coupon expired");
        }
      } else {
        console.log("Coupon not found or inactive:", couponError?.message);
      }
    }

    // Apply affiliate discount if provided (only if no coupon was applied)
    if (order_data.affiliate_code && !validCouponCode) {
      console.log("Validating affiliate code:", order_data.affiliate_code);
      
      const { data: affiliate, error: affiliateError } = await supabase
        .from('affiliates')
        .select('*')
        .eq('code', order_data.affiliate_code.toUpperCase())
        .eq('is_active', true)
        .single();
      
      if (!affiliateError && affiliate) {
        discount = Math.round(subtotal * ((affiliate.coupon_discount_percent || 10) / 100));
        validAffiliateCode = affiliate.code;
        console.log("Affiliate discount applied:", discount);

        // Update affiliate stats
        const commission = Math.round(subtotal * ((affiliate.commission_percent || 10) / 100));
        await supabase
          .from('affiliates')
          .update({
            total_referrals: (affiliate.total_referrals || 0) + 1,
            total_earnings: (affiliate.total_earnings || 0) + commission,
          })
          .eq('id', affiliate.id);
        
        console.log("Affiliate stats updated");
      }
    }

    const total = subtotal - discount + shipping;

    // Generate order number
    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Insert order into database
    const { data: insertedOrder, error: insertError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        user_id: order_data.user_id || null,
        customer_name: order_data.customer_name,
        customer_email: order_data.customer_email,
        customer_phone: order_data.customer_phone,
        shipping_address: order_data.shipping_address,
        items: order_data.items,
        subtotal,
        discount,
        shipping,
        total,
        payment_method: 'razorpay',
        payment_status: 'paid',
        order_status: 'confirmed',
        coupon_code: validCouponCode,
        affiliate_code: validAffiliateCode,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting order:", insertError);
      throw new Error("Failed to create order record");
    }

    // Use the actual order number from the database (trigger may have generated a different one)
    const actualOrderNumber = insertedOrder.order_number;
    console.log("Order created:", actualOrderNumber);

    // Trigger order confirmation email
    try {
      await supabase.functions.invoke('send-order-confirmation', {
        body: {
          order_number: actualOrderNumber,
          customer_name: order_data.customer_name,
          customer_email: order_data.customer_email,
          customer_phone: order_data.customer_phone,
          items: order_data.items,
          subtotal,
          discount,
          shipping,
          total,
          shipping_address: order_data.shipping_address,
          payment_method: 'razorpay',
          coupon_code: validCouponCode,
          affiliate_code: validAffiliateCode,
        },
      });
    } catch (emailError) {
      console.error("Failed to send confirmation email:", emailError);
    }

    // Generate loyalty coupon for the customer (fire and forget)
    if (order_data.user_id) {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
        fetch(`${supabaseUrl}/functions/v1/generate-loyalty-coupon`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify({
            user_id: order_data.user_id,
            customer_email: order_data.customer_email,
            customer_name: order_data.customer_name,
            order_number: actualOrderNumber,
          }),
        }).then(res => {
          console.log("Loyalty coupon generation triggered, status:", res.status);
        }).catch(err => {
          console.error("Failed to trigger loyalty coupon:", err);
        });
      } catch (loyaltyError) {
        console.error("Error initiating loyalty coupon generation:", loyaltyError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        order: {
          order_number: actualOrderNumber,
          total,
          payment_id: razorpay_payment_id,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error verifying payment:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

async function generateSignature(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(data);
  
  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const signature = await crypto.subtle.sign("HMAC", key, messageData);
  
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

serve(handler);