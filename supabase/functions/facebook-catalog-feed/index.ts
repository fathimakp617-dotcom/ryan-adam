import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = "https://ryanadamperfume.lovable.app";

const escapeCsv = (val: string): string => {
  if (val.includes(",") || val.includes('"') || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: products, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: true });

    if (error) throw error;

    // Facebook Commerce Manager CSV columns
    const headers = [
      "id",
      "title",
      "description",
      "availability",
      "condition",
      "price",
      "link",
      "image_link",
      "brand",
      "google_product_category",
      "sale_price",
    ];

    const rows = (products || []).map((p) => {
      const available = (p.stock_quantity ?? 0) > 0 ? "in stock" : "out of stock";
      const originalPrice = p.original_price ?? p.price * 2;
      return [
        p.id,
        p.name,
        (p.description || p.name).replace(/\n/g, " "),
        available,
        "new",
        `${originalPrice.toFixed(2)} INR`,
        `${SITE_URL}/product/${p.id}`,
        p.image_url || "",
        "Rayn Adam",
        "Health & Beauty > Personal Care > Cosmetics > Perfume & Cologne",
        `${p.price.toFixed(2)} INR`,
      ].map((v) => escapeCsv(String(v)));
    });

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    return new Response(csv, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="facebook-catalog.csv"',
      },
    });
  } catch (err) {
    console.error("Catalog feed error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
