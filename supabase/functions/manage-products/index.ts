import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOW_STOCK_THRESHOLD = 10;

const parseEmailList = (value: string | undefined | null): string[] => {
  if (!value) return [];
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
};

const sendLowStockAlert = async (params: {
  productId: string;
  productName?: string;
  newStock: number;
  recipients: string[];
  updatedBy: string;
  supabaseUrl: string;
  supabaseServiceKey: string;
}) => {
  const { productId, productName, newStock, recipients, updatedBy, supabaseUrl, supabaseServiceKey } = params;
  if (newStock >= LOW_STOCK_THRESHOLD) return;
  if (!recipients.length) return;

  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.warn('RESEND_API_KEY missing; skipping low stock email');
      return;
    }

    const resend = new Resend(resendApiKey);
    const subject = `⚠️ Low stock: ${productName ?? productId} (${newStock} left)`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
          <tr><td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #1a1a1a; border: 1px solid #333; border-radius: 8px; overflow: hidden;">
              <tr>
                <td style="background: linear-gradient(135deg, #1c1c1c 0%, #2d2d2d 100%); padding: 40px 30px; text-align: center; border-bottom: 2px solid #a87c39;">
                  <h1 style="margin: 0; font-size: 28px; letter-spacing: 4px; color: #c9a45c; font-weight: 300;">RAYN ADAM</h1>
                  <p style="margin: 8px 0 0; font-size: 11px; letter-spacing: 3px; color: #888; text-transform: uppercase;">Stock Alert</p>
                </td>
              </tr>
              <tr>
                <td style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 25px; text-align: center;">
                  <span style="font-size: 40px;">⚠️</span>
                  <h2 style="color: #ffffff; margin: 10px 0 0; font-size: 22px; font-weight: 500;">Low Stock Alert</h2>
                </td>
              </tr>
              <tr>
                <td style="padding: 35px 30px;">
                  <div style="background: #1c1c1c; border: 1px solid #3d3d3d; border-radius: 8px; padding: 20px;">
                    <p style="margin: 0 0 10px; color: #f5f5f0; font-size: 15px;"><strong style="color: #a87c39;">Product:</strong> ${productName ?? productId}</p>
                    <p style="margin: 0 0 10px; color: #f5f5f0; font-size: 15px;"><strong style="color: #a87c39;">Product ID:</strong> ${productId}</p>
                    <p style="margin: 0 0 10px; color: #ef4444; font-size: 18px; font-weight: 700;">Remaining stock: ${newStock}</p>
                    <p style="margin: 0; color: #888; font-size: 14px;"><strong style="color: #a87c39;">Updated by:</strong> ${updatedBy}</p>
                  </div>
                </td>
              </tr>
              <tr>
                <td style="background: linear-gradient(135deg, #1c1c1c 0%, #0f0f0f 100%); padding: 25px; text-align: center; border-top: 1px solid #3d3d3d;">
                  <p style="margin: 0; color: #666; font-size: 12px;">This is an automated alert from RAYN ADAM</p>
                  <p style="margin: 8px 0 0; color: #555; font-size: 11px;">© 2026 Rayn Adam Private Limited.</p>
                </td>
              </tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `;

    const emailRes = await resend.emails.send({
      from: 'Rayn Adam <notifications@raynadamperfume.com>',
      to: recipients,
      subject,
      html,
    });

    console.log('Low stock email sent (admin update):', { productId, newStock, emailRes });

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    await supabase.from('staff_notifications').insert({
      staff_email: 'system',
      notification_type: 'low_stock_alert',
      subject,
      recipients,
      sent_by: updatedBy,
      order_number: null,
      details: { product_id: productId, product_name: productName ?? null, stock_quantity: newStock, source: 'admin_update_stock' },
    });
  } catch (err) {
    console.error('Failed to send low stock alert (admin update):', err);
  }
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
        const { data: current, error: currentErr } = await supabaseClient
          .from('products')
          .select('stock_quantity, name')
          .eq('id', product.id)
          .single();

        if (currentErr) throw currentErr;

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

        // Low stock alert (only when crossing threshold)
        const before = Number(current.stock_quantity ?? 0);
        const after = Number(updatedProduct?.stock_quantity ?? product.stock_quantity ?? 0);
        if (before >= LOW_STOCK_THRESHOLD && after < LOW_STOCK_THRESHOLD) {
          const recipients = (() => {
            const adminOrderEmails = parseEmailList(Deno.env.get('ADMIN_ORDER_EMAIL'));
            const adminEmails = parseEmailList(Deno.env.get('ADMIN_EMAILS'));
            return [...new Set([...adminOrderEmails, ...adminEmails])];
          })();

          await sendLowStockAlert({
            productId: product.id,
            productName: current.name ?? undefined,
            newStock: after,
            recipients,
            updatedBy: session.email,
            supabaseUrl: Deno.env.get('SUPABASE_URL') ?? '',
            supabaseServiceKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
          });
        }

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
