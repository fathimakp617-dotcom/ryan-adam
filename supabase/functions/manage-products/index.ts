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

    const { action, product, imageData } = await req.json();

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

      case "upload_image": {
        // Handle image upload
        if (!imageData || !imageData.base64 || !imageData.fileName || !imageData.productId) {
          return new Response(JSON.stringify({ error: "Missing image data" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Decode base64 image
        const base64Data = imageData.base64.replace(/^data:image\/\w+;base64,/, "");
        const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
        
        // Generate unique filename
        const fileExt = imageData.fileName.split(".").pop() || "jpg";
        const uniqueFileName = `${imageData.productId}/${Date.now()}.${fileExt}`;

        // Upload to storage
        const { data: uploadData, error: uploadError } = await supabaseClient.storage
          .from("product-images")
          .upload(uniqueFileName, imageBytes, {
            contentType: imageData.contentType || "image/jpeg",
            upsert: true,
          });

        if (uploadError) {
          console.error("Upload error:", uploadError);
          throw uploadError;
        }

        // Get public URL
        const { data: urlData } = supabaseClient.storage
          .from("product-images")
          .getPublicUrl(uniqueFileName);

        const imageUrl = urlData.publicUrl;

        // Update product with new image URL
        const { error: updateError } = await supabaseClient
          .from("products")
          .update({ image_url: imageUrl })
          .eq("id", imageData.productId);

        if (updateError) throw updateError;

        // Log activity
        await supabaseClient.from("activity_logs").insert({
          actor_email: session.email,
          actor_role: "admin",
          action_type: "product_image_uploaded",
          action_details: { product_id: imageData.productId, image_url: imageUrl },
        });

        return new Response(JSON.stringify({ image_url: imageUrl }), {
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
            notes: product.notes || { top: [], middle: [], base: [] },
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
        const updateData: Record<string, unknown> = {};
        
        if (product.name !== undefined) updateData.name = product.name;
        if (product.description !== undefined) updateData.description = product.description;
        if (product.price !== undefined) updateData.price = product.price;
        if (product.original_price !== undefined) updateData.original_price = product.original_price;
        if (product.discount_percent !== undefined) updateData.discount_percent = product.discount_percent;
        if (product.stock_quantity !== undefined) updateData.stock_quantity = product.stock_quantity;
        if (product.category !== undefined) updateData.category = product.category;
        if (product.size !== undefined) updateData.size = product.size;
        if (product.image_url !== undefined) updateData.image_url = product.image_url;
        if (product.is_active !== undefined) updateData.is_active = product.is_active;
        if (product.notes !== undefined) updateData.notes = product.notes;

        const { data: updatedProduct, error } = await supabaseClient
          .from("products")
          .update(updateData)
          .eq("id", product.id)
          .select()
          .single();

        if (error) throw error;

        // Log activity
        await supabaseClient.from("activity_logs").insert({
          actor_email: session.email,
          actor_role: "admin",
          action_type: "product_updated",
          action_details: { product_id: product.id, changes: updateData },
        });

        return new Response(JSON.stringify({ product: updatedProduct }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "delete": {
        // Delete product images from storage first
        const { data: files } = await supabaseClient.storage
          .from("product-images")
          .list(product.id);

        if (files && files.length > 0) {
          const filePaths = files.map(f => `${product.id}/${f.name}`);
          await supabaseClient.storage.from("product-images").remove(filePaths);
        }

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
  } catch (error: unknown) {
    console.error("Error in manage-products:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
