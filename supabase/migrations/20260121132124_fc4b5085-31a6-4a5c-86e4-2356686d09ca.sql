-- Create products table for stock management
CREATE TABLE public.products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  original_price NUMERIC,
  discount_percent INTEGER DEFAULT 0,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  image_url TEXT,
  category TEXT,
  size TEXT DEFAULT '100ml',
  notes JSONB DEFAULT '{"top": [], "middle": [], "base": []}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Public can view active products
CREATE POLICY "Anyone can view active products"
ON public.products
FOR SELECT
USING (is_active = true);

-- Service role manages products
CREATE POLICY "Service role manages products"
ON public.products
FOR ALL
USING (true)
WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert existing products with default stock
INSERT INTO public.products (id, name, description, price, original_price, discount_percent, stock_quantity, category, size)
VALUES 
  ('noir-intense', 'Noir Intense', 'A bold, mysterious fragrance with deep woody notes and subtle spice undertones.', 444, 888, 50, 100, 'woody', '100ml'),
  ('rouge-passion', 'Rouge Passion', 'An alluring blend of red fruits and floral notes that captivates the senses.', 444, 888, 50, 100, 'floral', '100ml'),
  ('blanc-elegance', 'Blanc Élégance', 'A refined, clean scent with fresh citrus and delicate white flowers.', 444, 888, 50, 100, 'fresh', '100ml'),
  ('amber-elixir', 'Amber Elixir', 'Warm amber notes intertwined with exotic spices for a captivating presence.', 444, 888, 50, 100, 'oriental', '100ml'),
  ('velvet-night', 'Velvet Night', 'A sensual evening fragrance with rich vanilla and sandalwood.', 444, 888, 50, 100, 'oriental', '100ml'),
  ('citrus-aura', 'Citrus Aura', 'An energizing burst of fresh citrus with herbal undertones.', 444, 888, 50, 100, 'fresh', '100ml'),
  ('divine-rose', 'Divine Rose', 'A luxurious rose-centered fragrance with oud and musk accords.', 444, 888, 50, 100, 'floral', '100ml'),
  ('oud-royal', 'Oud Royal', 'A majestic blend of rare oud, saffron, and precious woods.', 444, 888, 50, 100, 'woody', '100ml'),
  ('legacy-combo', 'Legacy Combo', 'Premium duo set featuring our signature fragrances.', 888, 1776, 50, 50, 'combo', 'Set of 2'),
  ('elite-trio', 'Elite Trio', 'Exclusive collection of three premium fragrances.', 1332, 2664, 50, 30, 'combo', 'Set of 3');