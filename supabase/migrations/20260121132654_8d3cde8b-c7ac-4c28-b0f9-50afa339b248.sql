-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to product images
CREATE POLICY "Public can view product images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'product-images');

-- Service role can manage product images (for admin uploads via edge function)
CREATE POLICY "Service role manages product images"
ON storage.objects
FOR ALL
USING (bucket_id = 'product-images')
WITH CHECK (bucket_id = 'product-images');

-- Clear existing products and insert correct ones from the website
DELETE FROM public.products;

INSERT INTO public.products (id, name, description, price, original_price, discount_percent, stock_quantity, category, size, notes, is_active)
VALUES 
  ('combo', 'COMBO', 'A burst of Mediterranean sunshine, Combo awakens the senses with its vibrant blend of Italian citrus and aromatic herbs. Pure energy in a bottle.', 444, 888, 50, 100, 'fresh', '3ml PER BOTTLE', '{"top": ["Bergamot", "Sicilian Lemon", "Grapefruit"], "middle": ["Neroli", "Lavender", "Rosemary"], "base": ["Vetiver", "White Musk", "Cedar"]}'::jsonb, true),
  ('elite', 'ELITE', 'Like the caress of midnight silk, Elite envelops you in an embrace of jasmine and patchouli. This sensuous fragrance is for those who live for the night.', 444, 888, 50, 100, 'oriental', '12ml', '{"top": ["Bergamot", "Black Currant", "Pink Pepper"], "middle": ["Jasmine Sambac", "Tuberose", "Iris"], "base": ["Patchouli", "Amber", "Vanilla"]}'::jsonb, true),
  ('amber-crown', 'AMBER CROWN', 'A celebration of the queen of flowers, Amber Crown is a romantic masterpiece that captures the essence of a thousand petals. Delicate yet unforgettable.', 444, 888, 50, 100, 'floral', '12ml', '{"top": ["Rose Petals", "Lychee", "Bergamot"], "middle": ["Damask Rose", "Peony", "Magnolia"], "base": ["White Musk", "Cedar", "Ambroxan"]}'::jsonb, true),
  ('legacy', 'LEGACY', 'A golden nectar of warmth and comfort, Legacy wraps you in a cocoon of precious resins and vanilla. This addictive scent is liquid gold for the soul.', 444, 888, 50, 100, 'oriental', '12ml', '{"top": ["Orange Blossom", "Cinnamon", "Cardamom"], "middle": ["Amber", "Benzoin", "Labdanum"], "base": ["Vanilla", "Tonka Bean", "Sandalwood"]}'::jsonb, true);