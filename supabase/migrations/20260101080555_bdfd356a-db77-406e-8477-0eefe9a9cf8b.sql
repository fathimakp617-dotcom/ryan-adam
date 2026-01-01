-- Remove route_id foreign key from shop_orders
ALTER TABLE public.shop_orders DROP CONSTRAINT IF EXISTS shop_orders_route_id_fkey;
ALTER TABLE public.shop_orders DROP COLUMN IF EXISTS route_id;

-- Remove route_id foreign key from expenses
ALTER TABLE public.expenses DROP CONSTRAINT IF EXISTS expenses_route_id_fkey;
ALTER TABLE public.expenses DROP COLUMN IF EXISTS route_id;

-- Drop the routes table
DROP TABLE IF EXISTS public.routes;