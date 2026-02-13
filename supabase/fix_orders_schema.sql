-- Schema fix for Orders API
-- Run this in local Supabase to fix column issues

-- Fix fc_orders table - add missing columns
ALTER TABLE public.fc_orders 
ADD COLUMN restaurant_name text,
ADD COLUMN cuisine text,
ADD COLUMN total numeric(10,2);

-- Update existing orders with restaurant data
UPDATE public.fc_orders 
SET restaurant_name = r.name,
    cuisine = r.cuisine,
    total = total_amount
FROM public.fc_restaurants r 
WHERE fc_orders.restaurant_id = r.id;

-- Fix fc_order_items table - add missing columns  
ALTER TABLE public.fc_order_items 
ADD COLUMN name text,
ADD COLUMN total_price numeric(10,2);

-- Update existing order items with menu item data
UPDATE public.fc_order_items 
SET name = m.name,
    total_price = unit_price * quantity
FROM public.fc_menu_items m 
WHERE fc_order_items.menu_item_id = m.id;

-- Success message
SELECT 'Orders API schema fix completed!' as message;