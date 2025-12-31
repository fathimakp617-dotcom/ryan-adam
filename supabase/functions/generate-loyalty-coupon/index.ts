import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LoyaltyCouponRequest {
  user_id: string;
  customer_email: string;
  customer_name: string;
  order_number: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, customer_email, customer_name, order_number }: LoyaltyCouponRequest = await req.json();

    if (!user_id) {
      console.log("No user_id provided, skipping loyalty coupon generation");
      return new Response(
        JSON.stringify({ success: false, message: "No user_id provided" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Generating loyalty coupon for user:", user_id);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get or create loyalty rewards record
    let { data: loyaltyRecord, error: loyaltyError } = await supabase
      .from("loyalty_rewards")
      .select("*")
      .eq("user_id", user_id)
      .single();

    if (loyaltyError && loyaltyError.code === "PGRST116") {
      // Record doesn't exist, create it
      const { data: newRecord, error: createError } = await supabase
        .from("loyalty_rewards")
        .insert({ user_id, order_count: 1, last_coupon_order: 0 })
        .select()
        .single();

      if (createError) {
        console.error("Error creating loyalty record:", createError);
        throw createError;
      }
      loyaltyRecord = newRecord;
    } else if (loyaltyError) {
      console.error("Error fetching loyalty record:", loyaltyError);
      throw loyaltyError;
    } else {
      // Increment order count
      const { data: updatedRecord, error: updateError } = await supabase
        .from("loyalty_rewards")
        .update({ order_count: loyaltyRecord.order_count + 1 })
        .eq("user_id", user_id)
        .select()
        .single();

      if (updateError) {
        console.error("Error updating loyalty record:", updateError);
        throw updateError;
      }
      loyaltyRecord = updatedRecord;
    }

    const orderCount = loyaltyRecord.order_count;
    console.log("Customer order count:", orderCount);

    // Determine which coupon to generate based on order count
    let couponType: string | null = null;
    let discountPercent = 0;
    let isBogo = false;
    let couponDescription = "";

    if (orderCount === 1) {
      // After 1st order: 20% discount for 2nd order
      couponType = "loyalty_20";
      discountPercent = 20;
      couponDescription = "20% off your next order!";
    } else if (orderCount >= 2 && orderCount <= 8) {
      // After 2nd-8th order: 10% discount
      couponType = "loyalty_10";
      discountPercent = 10;
      couponDescription = "10% off your next order!";
    } else if (orderCount === 9) {
      // After 9th order: BOGO for 10th order
      couponType = "loyalty_bogo";
      discountPercent = 50; // Effectively buy 1 get 1 (50% off for 2 items)
      isBogo = true;
      couponDescription = "Buy 1 Get 1 FREE on your 10th order!";
    }

    if (!couponType) {
      console.log("No loyalty coupon needed for order count:", orderCount);
      return new Response(
        JSON.stringify({ success: true, message: "No coupon generated for this order count" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Generate unique coupon code
    const couponCode = `LOYAL${orderCount + 1}-${user_id.substring(0, 4).toUpperCase()}${Date.now().toString(36).toUpperCase().slice(-4)}`;

    // Set expiry to 30 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Create the coupon
    const { data: coupon, error: couponError } = await supabase
      .from("coupons")
      .insert({
        code: couponCode,
        discount_percent: discountPercent,
        is_active: true,
        max_uses: 1,
        current_uses: 0,
        expires_at: expiresAt.toISOString(),
        user_id: user_id,
        coupon_type: couponType,
        is_bogo: isBogo,
      })
      .select()
      .single();

    if (couponError) {
      console.error("Error creating coupon:", couponError);
      throw couponError;
    }

    console.log("Loyalty coupon created:", couponCode);

    // Update last coupon order
    await supabase
      .from("loyalty_rewards")
      .update({ last_coupon_order: orderCount })
      .eq("user_id", user_id);

    // Send email notification about the loyalty coupon
    try {
      const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
      if (RESEND_API_KEY) {
        const resend = new Resend(RESEND_API_KEY);

        const bogoText = isBogo 
          ? `<p style="font-size: 14px; color: #fbbf24; margin-top: 8px;">🎁 This is a special <strong>Buy 1 Get 1 FREE</strong> coupon for your 10th order!</p>`
          : "";

        await resend.emails.send({
          from: "Rayn Adam <onboarding@resend.dev>",
          to: [customer_email],
          subject: `🎁 ${couponDescription} - Thank you for your order!`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; background-color: #1a1a1a; font-family: 'Georgia', serif;">
              <div style="max-width: 600px; margin: 0 auto; background-color: #0d0d0d;">
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 40px 30px; text-align: center; border-bottom: 2px solid #c9a962;">
                  <h1 style="color: #c9a962; margin: 0; font-size: 28px; font-weight: normal; letter-spacing: 3px;">RAYN ADAM</h1>
                  <p style="color: #888; margin: 8px 0 0 0; font-size: 12px; letter-spacing: 2px;">LUXURY PERFUMES</p>
                </div>
                
                <!-- Content -->
                <div style="padding: 40px 30px; text-align: center;">
                  <h2 style="color: #c9a962; font-size: 24px; margin: 0 0 20px 0; font-weight: normal;">
                    Thank You, ${customer_name}!
                  </h2>
                  
                  <p style="color: #f5f5dc; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                    We appreciate your loyalty! As a thank you for order #${order_number}, here's a special reward for you:
                  </p>
                  
                  <!-- Coupon Box -->
                  <div style="background: linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%); border: 2px solid #c9a962; border-radius: 12px; padding: 30px; margin: 30px 0;">
                    <p style="color: #888; font-size: 12px; letter-spacing: 2px; margin: 0 0 10px 0;">YOUR LOYALTY REWARD</p>
                    <p style="color: #c9a962; font-size: 32px; font-weight: bold; margin: 0 0 15px 0;">
                      ${isBogo ? "BUY 1 GET 1 FREE" : `${discountPercent}% OFF`}
                    </p>
                    <div style="background-color: #1a1a1a; border: 1px dashed #c9a962; border-radius: 8px; padding: 15px; margin: 20px 0;">
                      <p style="color: #888; font-size: 10px; margin: 0 0 5px 0;">USE CODE</p>
                      <p style="color: #fff; font-size: 24px; font-weight: bold; margin: 0; letter-spacing: 2px;">${couponCode}</p>
                    </div>
                    ${bogoText}
                    <p style="color: #888; font-size: 12px; margin: 15px 0 0 0;">
                      Valid for 30 days • Single use only
                    </p>
                  </div>
                  
                  <p style="color: #f5f5dc; font-size: 14px; line-height: 1.6; margin: 30px 0;">
                    Use this code on your next purchase to enjoy your exclusive discount!
                  </p>
                  
                  <a href="https://raynadam.com/shop" style="display: inline-block; background: linear-gradient(135deg, #c9a962 0%, #a88a4a 100%); color: #1a1a1a; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: bold; letter-spacing: 1px; margin-top: 20px;">
                    SHOP NOW
                  </a>
                </div>
                
                <!-- Footer -->
                <div style="background-color: #1a1a1a; padding: 30px; text-align: center; border-top: 1px solid #333;">
                  <p style="color: #888; font-size: 12px; margin: 0;">
                    © 2026 Rayn Adam Luxury Perfumes. All rights reserved.
                  </p>
                </div>
              </div>
            </body>
            </html>
          `,
        });
        console.log("Loyalty coupon email sent to:", customer_email);
      }
    } catch (emailError) {
      console.error("Failed to send loyalty coupon email:", emailError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        coupon: {
          code: couponCode,
          discount_percent: discountPercent,
          is_bogo: isBogo,
          description: couponDescription,
          expires_at: expiresAt.toISOString(),
        },
        order_count: orderCount,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    console.error("Error generating loyalty coupon:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
