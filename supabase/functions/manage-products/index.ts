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
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, product } = await req.json();

    switch (action) {
      case "list": {
        const { data: products, error } = await supabaseClient
          .from("products")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;

        return new Response(JSON.stringify({ products }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "create": {
        const { data: newProduct, error } = await supabaseClient
          .from("products")
          .insert({
            id: product.id,
            name: product.name,
            description: product.description,
            price: product.price,
            original_price: product.original_price,
            discount_percent: product.discount_percent || 0,
            stock_quantity: product.stock_quantity || 0,
            category: product.category,
            size: product.size || "100ml",
            image_url: product.image_url,
            is_active: product.is_active ?? true,
          })
          .select()
          .single();

        if (error) throw error;

        // Log activity
        await supabaseClient.from("activity_logs").insert({
          actor_email: session.email,
          actor_role: "admin",
          action_type: "product_created",
          action_details: { product_id: newProduct.id, product_name: newProduct.name },
        });

        return new Response(JSON.stringify({ product: newProduct }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "update": {
        const { data: updatedProduct, error } = await supabaseClient
          .from("products")
          .update({
            name: product.name,
            description: product.description,
            price: product.price,
            original_price: product.original_price,
            discount_percent: product.discount_percent,
            stock_quantity: product.stock_quantity,
            category: product.category,
            size: product.size,
            image_url: product.image_url,
            is_active: product.is_active,
          })
          .eq("id", product.id)
          .select()
          .single();

        if (error) throw error;

        // Log activity
        await supabaseClient.from("activity_logs").insert({
          actor_email: session.email,
          actor_role: "admin",
          action_type: "product_updated",
          action_details: { product_id: product.id, changes: product },
        });

        return new Response(JSON.stringify({ product: updatedProduct }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "delete": {
        const { error } = await supabaseClient
          .from("products")
          .delete()
          .eq("id", product.id);

        if (error) throw error;

        // Log activity
        await supabaseClient.from("activity_logs").insert({
          actor_email: session.email,
          actor_role: "admin",
          action_type: "product_deleted",
          action_details: { product_id: product.id },
        });

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "update_stock": {
        const { data: updatedProduct, error } = await supabaseClient
          .from("products")
          .update({ stock_quantity: product.stock_quantity })
          .eq("id", product.id)
          .select()
          .single();

        if (error) throw error;

        // Log activity
        await supabaseClient.from("activity_logs").insert({
          actor_email: session.email,
          actor_role: "admin",
          action_type: "stock_updated",
          action_details: { product_id: product.id, new_quantity: product.stock_quantity },
        });

        return new Response(JSON.stringify({ product: updatedProduct }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ error: "Invalid action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (error: any) {
    console.error("Error in manage-products:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
