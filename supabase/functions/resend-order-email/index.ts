import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting storage (in-memory, resets on function restart)
const resendAttempts: Map<string, { count: number; lastAttempt: number }> = new Map();

const isRateLimited = (orderNumber: string): boolean => {
  const now = Date.now();
  const hourAgo = now - 3600000; // 1 hour in milliseconds
  const attempts = resendAttempts.get(orderNumber);
  
  if (!attempts || attempts.lastAttempt < hourAgo) {
    resendAttempts.set(orderNumber, { count: 1, lastAttempt: now });
    return false;
  }
  
  if (attempts.count >= 3) {
    return true;
  }
  
  resendAttempts.set(orderNumber, { count: attempts.count + 1, lastAttempt: now });
  return false;
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { order_number } = await req.json();
    
    if (!order_number) {
      return new Response(
        JSON.stringify({ error: "Order number is required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check rate limiting
    if (isRateLimited(order_number)) {
      console.log("Rate limited resend attempt for:", order_number);
      return new Response(
        JSON.stringify({ error: "Too many resend attempts. Please try again in an hour." }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Resending order confirmation for:", order_number);

    // Initialize Supabase clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    // Create client with user's token to verify authentication
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get current user
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      console.error("Authentication failed:", userError);
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Authenticated user:", user.email);

    // Use service role for database query
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch order from database
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('order_number', order_number)
      .single();

    if (orderError || !order) {
      console.error("Order not found:", orderError);
      return new Response(
        JSON.stringify({ error: "Order not found" }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the user owns this order
    if (order.customer_email !== user.email && order.user_id !== user.id) {
      console.error("User does not own this order:", user.email, "vs", order.customer_email);
      return new Response(
        JSON.stringify({ error: "You don't have permission to resend this order's email" }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Found order:", order.order_number, "for", order.customer_email);

    // Prepare email payload
    const emailPayload = {
      order_number: order.order_number,
      customer_name: order.customer_name,
      customer_email: order.customer_email,
      customer_phone: order.customer_phone || 'N/A',
      items: order.items,
      subtotal: order.subtotal,
      discount: order.discount || 0,
      shipping: order.shipping || 0,
      total: order.total,
      shipping_address: order.shipping_address,
      payment_method: order.payment_method,
    };

    // Call send-order-confirmation function with service role key (internal call)
    const response = await fetch(`${supabaseUrl}/functions/v1/send-order-confirmation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify(emailPayload),
    });

    const result = await response.json();
    console.log("Email resend result:", result);

    if (!response.ok) {
      throw new Error(result.error || "Failed to resend email");
    }

    return new Response(
      JSON.stringify({ success: true, message: "Order confirmation email resent successfully" }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error("Error in resend-order-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
