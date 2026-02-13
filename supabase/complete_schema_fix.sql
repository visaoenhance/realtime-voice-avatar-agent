-- Complete Schema Fix for Local Database
-- Run this to fix all column mismatches
-- Generated: February 12, 2026

-- ============================================================================
-- FIX FC_CARTS TABLE
-- ============================================================================

-- Add missing columns
ALTER TABLE public.fc_carts 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active',
ADD COLUMN IF NOT EXISTS subtotal numeric(10,2) DEFAULT 0;

-- ============================================================================
-- FIX FC_CART_ITEMS TABLE  
-- ============================================================================

-- Rename unit_price to base_price (if it exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'fc_cart_items' AND column_name = 'unit_price') THEN
        ALTER TABLE public.fc_cart_items RENAME COLUMN unit_price TO base_price;
    END IF;
END $$;

-- Rename special_instructions to instructions (if it exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'fc_cart_items' AND column_name = 'special_instructions') THEN
        ALTER TABLE public.fc_cart_items RENAME COLUMN special_instructions TO instructions;
    END IF;
END $$;

-- Add missing total_price column
ALTER TABLE public.fc_cart_items 
ADD COLUMN IF NOT EXISTS total_price numeric(10,2);

-- Set total_price = base_price * quantity where null
UPDATE public.fc_cart_items 
SET total_price = base_price * quantity 
WHERE total_price IS NULL;

-- ============================================================================
-- FIX FC_CART_ITEM_OPTIONS TABLE
-- ============================================================================

-- Add price_adjustment column
ALTER TABLE public.fc_cart_item_options 
ADD COLUMN IF NOT EXISTS price_adjustment numeric(10,2) DEFAULT 0;

-- ============================================================================
-- FIX FC_MENU_ITEMS TABLE
-- ============================================================================

-- Add missing columns
ALTER TABLE public.fc_menu_items 
ADD COLUMN IF NOT EXISTS slug text,
ADD COLUMN IF NOT EXISTS image text;

-- Generate slug from name for existing items
UPDATE public.fc_menu_items 
SET slug = LOWER(REGEXP_REPLACE(COALESCE(name, 'item'), '[^A-Za-z0-9]+', '-', 'g'))
WHERE slug IS NULL OR slug = '';

-- ============================================================================
-- FIX FC_ORDERS TABLE
-- ============================================================================

-- Add missing columns for orders
ALTER TABLE public.fc_orders 
ADD COLUMN IF NOT EXISTS restaurant_name text,
ADD COLUMN IF NOT EXISTS cuisine text,
ADD COLUMN IF NOT EXISTS total numeric(10,2);

-- Copy total_amount to total
UPDATE public.fc_orders 
SET total = total_amount 
WHERE total IS NULL;

-- Add restaurant info to orders (from restaurant relationship)
UPDATE public.fc_orders 
SET restaurant_name = r.name, cuisine = r.cuisine
FROM public.fc_restaurants r 
WHERE public.fc_orders.restaurant_id = r.id 
AND (public.fc_orders.restaurant_name IS NULL OR public.fc_orders.cuisine IS NULL);

-- ============================================================================
-- FIX FC_ORDER_ITEMS TABLE
-- ============================================================================

-- Add missing columns
ALTER TABLE public.fc_order_items 
ADD COLUMN IF NOT EXISTS name text,
ADD COLUMN IF NOT EXISTS total_price numeric(10,2);

-- Set total_price = unit_price * quantity
UPDATE public.fc_order_items 
SET total_price = unit_price * quantity 
WHERE total_price IS NULL;

-- Add item names from menu items
UPDATE public.fc_order_items 
SET name = mi.name
FROM public.fc_menu_items mi 
WHERE public.fc_order_items.menu_item_id = mi.id 
AND public.fc_order_items.name IS NULL;

-- ============================================================================
-- FIX FC_MENU_ITEM_OPTION_CHOICES TABLE
-- ============================================================================

-- Rename name to label if needed
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'fc_menu_item_option_choices' AND column_name = 'name')
    AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'fc_menu_item_option_choices' AND column_name = 'label') THEN
        ALTER TABLE public.fc_menu_item_option_choices RENAME COLUMN name TO label;
    END IF;
END $$;

-- ============================================================================
-- ENSURE NOT NULL CONSTRAINTS
-- ============================================================================

-- Make critical columns NOT NULL where appropriate
ALTER TABLE public.fc_cart_items 
ALTER COLUMN total_price SET NOT NULL;

ALTER TABLE public.fc_menu_items 
ALTER COLUMN slug SET NOT NULL;

-- ============================================================================
-- CREATE MISSING VIEWS (if referenced by food-chat tools)
-- ============================================================================

-- Create fc_menu_sections_with_items view if it doesn't exist
CREATE OR REPLACE VIEW public.fc_menu_sections_with_items AS
SELECT 
    s.id as section_id,
    s.name as section_slug,
    s.name as section_title,
    s.description as section_description,
    s.display_order as section_position,
    s.restaurant_id,
    COALESCE(
        json_agg(
            json_build_object(
                'id', i.id,
                'slug', i.slug,
                'name', i.name,
                'description', i.description,
                'base_price', i.base_price,
                'image', i.image,
                'tags', i.dietary_tags,
                'calories', i.calories
            )
            ORDER BY i.display_order
        ) FILTER (WHERE i.id IS NOT NULL),
        '[]'::json
    ) as items
FROM public.fc_menu_sections s
LEFT JOIN public.fc_menu_items i ON s.id = i.section_id AND i.is_available = true
WHERE s.is_active = true
GROUP BY s.id, s.name, s.description, s.display_order, s.restaurant_id;

-- Success message
SELECT 'Complete schema fix applied successfully! All API endpoints should now work.' as message;