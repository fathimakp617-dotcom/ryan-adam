import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Product, products as staticProducts } from "@/data/products";

// Create a lookup map from static data for enrichment
const staticEnrichmentMap = new Map<string, Product>();
staticProducts.forEach((p) => staticEnrichmentMap.set(p.id, p));

interface DbProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  original_price: number | null;
  discount_percent: number | null;
  stock_quantity: number;
  category: string | null;
  size: string | null;
  image_url: string | null;
  is_active: boolean | null;
  notes: { top?: string[]; middle?: string[]; base?: string[] } | null;
  created_at: string;
}

/**
 * Maps a database product to the frontend Product interface,
 * merging with static enrichment data when available.
 */
const mapDbToProduct = (db: DbProduct): Product => {
  const staticData = staticEnrichmentMap.get(db.id);

  return {
    id: db.id,
    name: db.name,
    tagline: staticData?.tagline || db.category || "Premium Fragrance",
    description: db.description || staticData?.description || "",
    story: staticData?.story || db.description || "",
    price: db.price,
    originalPrice: db.original_price || db.price * 2,
    discountPercent: db.discount_percent || 0,
    category: db.category || "Unisex",
    size: db.size || "100ml",
    image: db.image_url || staticData?.image || "",
    gallery: staticData?.gallery || (db.image_url ? [db.image_url] : []),
    notes: {
      top: db.notes?.top || staticData?.notes?.top || [],
      heart: db.notes?.middle || staticData?.notes?.heart || [],
      base: db.notes?.base || staticData?.notes?.base || [],
    },
    ingredients: staticData?.ingredients || [],
    concentration: staticData?.concentration || "Eau de Parfum",
    longevity: staticData?.longevity || "6-8 hours",
    sillage: staticData?.sillage || "Moderate",
    season: staticData?.season || ["All Seasons"],
    occasion: staticData?.occasion || ["Daily Wear"],
  };
};

/**
 * Fetches all active products from the database and enriches them
 * with static data (taglines, stories, galleries, etc.) where available.
 */
export const useDbProducts = () => {
  return useQuery({
    queryKey: ["db-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching products:", error);
        // Fallback to static data if DB fails
        return staticProducts;
      }

      if (!data || data.length === 0) {
        return staticProducts;
      }

      return (data as DbProduct[]).map(mapDbToProduct);
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
  });
};

/**
 * Gets a single product by ID from the database,
 * with static enrichment data merged in.
 */
export const useDbProduct = (id: string | undefined) => {
  return useQuery({
    queryKey: ["db-product", id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching product:", error);
        // Fallback to static data
        return staticEnrichmentMap.get(id) || null;
      }

      if (!data) {
        // Try static data as fallback
        return staticEnrichmentMap.get(id) || null;
      }

      return mapDbToProduct(data as DbProduct);
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
};
