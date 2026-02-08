import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Validate admin session
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sessionToken = authHeader.replace("Bearer ", "");
    const { data: session, error: sessionError } = await supabaseClient
      .from("staff_sessions")
      .select("email, expires_at")
      .eq("session_token", sessionToken)
      .single();

    if (sessionError || !session || new Date(session.expires_at) < new Date()) {
      console.error("Invalid session:", sessionError?.message);
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if admin
    const { data: staff } = await supabaseClient
      .from("staff_members")
      .select("role")
      .eq("email", session.email)
      .single();

    if (!staff || staff.role !== "admin") {
      console.error("Access denied for:", session.email);
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    console.log("Creating manual order:", body.order_number);

    // Validate required fields
    if (!body.customer_name || !body.order_number || !body.shipping_address || !body.items || body.items.length === 0) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Sanitize inputs
    const sanitize = (str: string, max: number) =>
      (str || "").trim().slice(0, max).replace(/[\x00-\x1f\x7f<>{}[\]\\`]/g, "").trim();

    const orderData = {
      order_number: sanitize(body.order_number, 20),
      customer_name: sanitize(body.customer_name, 100),
      customer_email: sanitize(body.customer_email || "manual-order@raynadamperfume.com", 255).toLowerCase(),
      customer_phone: sanitize(body.customer_phone || "", 20) || null,
      shipping_address: {
        address: sanitize(body.shipping_address.address || "", 200),
        city: sanitize(body.shipping_address.city || "", 100),
        state: sanitize(body.shipping_address.state || "", 100),
        zipCode: sanitize(body.shipping_address.zipCode || "", 10),
        country: sanitize(body.shipping_address.country || "India", 100),
      },
      items: (body.items as any[]).slice(0, 50).map((item: any) => ({
        name: sanitize(item.name || "", 100),
        price: Math.max(0, Number(item.price) || 0),
        quantity: Math.max(1, Math.floor(Number(item.quantity) || 1)),
        productId: sanitize(item.productId || "", 50),
      })),
      subtotal: Math.max(0, Number(body.subtotal) || 0),
      discount: Math.max(0, Number(body.discount) || 0),
      shipping: Math.max(0, Number(body.shipping) || 0),
      total: Math.max(0, Number(body.total) || 0),
      payment_method: sanitize(body.payment_method || "cod", 30),
      payment_status: sanitize(body.payment_status || "pending", 20),
      order_status: sanitize(body.order_status || "pending", 20),
      created_at: body.created_at || new Date().toISOString(),
      user_id: null, // Manual orders have no user
    };

    console.log("Inserting order:", orderData.order_number, "total:", orderData.total);

    const { data: order, error: insertError } = await supabaseClient
      .from("orders")
      .insert(orderData)
      .select("id, order_number")
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      // Handle duplicate order number
      if (insertError.message?.includes("duplicate") || insertError.code === "23505") {
        return new Response(JSON.stringify({ error: "Order number already exists. Please use a different one." }), {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw insertError;
    }

    console.log("Manual order created successfully:", order.order_number);

    // Log activity
    await supabaseClient.from("activity_logs").insert({
      actor_email: session.email,
      actor_role: "admin",
      action_type: "manual_order_created",
      order_id: order.id,
      order_number: order.order_number,
      action_details: {
        customer_name: orderData.customer_name,
        total: orderData.total,
        payment_method: orderData.payment_method,
        items_count: orderData.items.length,
      },
    });

    return new Response(JSON.stringify({ success: true, order }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in create-manual-order:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
