-- Cart Schema Fix Patch
-- Run this in Supabase SQL Editor to fix cart table schema issues
-- Generated: February 12, 2026

-- Fix fc_carts table - add missing columns
ALTER TABLE public.fc_carts 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active',
ADD COLUMN IF NOT EXISTS subtotal numeric(10,2) DEFAULT 0;

-- Fix fc_cart_items table - rename and add columns
DO $$ 
BEGIN
    -- Check if unit_price exists and rename to base_price
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'fc_cart_items' AND column_name = 'unit_price') THEN
        ALTER TABLE public.fc_cart_items RENAME COLUMN unit_price TO base_price;
    END IF;
    
    -- Check if special_instructions exists and rename to instructions
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'fc_cart_items' AND column_name = 'special_instructions') THEN
        ALTER TABLE public.fc_cart_items RENAME COLUMN special_instructions TO instructions;
    END IF;
END $$;

-- Add missing columns to fc_cart_items
ALTER TABLE public.fc_cart_items 
ADD COLUMN IF NOT EXISTS total_price numeric(10,2);

-- Update total_price to equal base_price * quantity where null
UPDATE public.fc_cart_items 
SET total_price = base_price * quantity 
WHERE total_price IS NULL;

-- Make total_price NOT NULL
ALTER TABLE public.fc_cart_items 
ALTER COLUMN total_price SET NOT NULL;

-- Fix fc_cart_item_options table - add missing column
ALTER TABLE public.fc_cart_item_options 
ADD COLUMN IF NOT EXISTS price_adjustment numeric(10,2) DEFAULT 0;

-- Fix fc_menu_items table - add missing slug column
ALTER TABLE public.fc_menu_items 
ADD COLUMN IF NOT EXISTS slug text;

-- Generate slug from name for existing items (if any)
UPDATE public.fc_menu_items 
SET slug = LOWER(REGEXP_REPLACE(name, '[^A-Za-z0-9]+', '-', 'g'))
WHERE slug IS NULL;

-- Make slug NOT NULL and add unique constraint
ALTER TABLE public.fc_menu_items 
ALTER COLUMN slug SET NOT NULL;

-- Add unique constraint for menu item slug (ignore if already exists)
DO $$ 
BEGIN
    ALTER TABLE public.fc_menu_items 
    ADD CONSTRAINT fc_menu_items_slug_unique UNIQUE (slug);
EXCEPTION
    WHEN duplicate_table THEN 
        -- Constraint already exists, ignore
        NULL;
END $$;

-- Fix fc_menu_item_option_choices table - rename name to label
DO $$ 
BEGIN
    -- Check if name exists and label doesn't, then rename
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'fc_menu_item_option_choices' AND column_name = 'name')
    AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'fc_menu_item_option_choices' AND column_name = 'label') THEN
        ALTER TABLE public.fc_menu_item_option_choices RENAME COLUMN name TO label;
    END IF;
END $$;

-- Success message
SELECT 'Cart schema fix completed successfully!' as message;