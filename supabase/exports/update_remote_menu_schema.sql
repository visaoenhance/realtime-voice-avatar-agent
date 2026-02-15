-- Update remote fc_menu_items schema to match local
-- Add missing columns

-- First, check if columns exist, then add them if missing
DO $$ 
BEGIN
    -- Add slug column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fc_menu_items' AND column_name='slug') THEN
        ALTER TABLE "public"."fc_menu_items" ADD COLUMN "slug" text;
    END IF;

    -- Add image_url column  
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fc_menu_items' AND column_name='image_url') THEN
        ALTER TABLE "public"."fc_menu_items" ADD COLUMN "image_url" text;
    END IF;

    -- Add allergen_info column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fc_menu_items' AND column_name='allergen_info') THEN
        ALTER TABLE "public"."fc_menu_items" ADD COLUMN "allergen_info" text[];
    END IF;

    -- Add calories column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fc_menu_items' AND column_name='calories') THEN
        ALTER TABLE "public"."fc_menu_items" ADD COLUMN "calories" integer;
    END IF;

    -- Add prep_time_minutes column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fc_menu_items' AND column_name='prep_time_minutes') THEN
        ALTER TABLE "public"."fc_menu_items" ADD COLUMN "prep_time_minutes" integer;
    END IF;

    -- Add is_popular column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fc_menu_items' AND column_name='is_popular') THEN
        ALTER TABLE "public"."fc_menu_items" ADD COLUMN "is_popular" boolean DEFAULT false;
    END IF;

    -- Add display_order column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fc_menu_items' AND column_name='display_order') THEN
        ALTER TABLE "public"."fc_menu_items" ADD COLUMN "display_order" integer DEFAULT 0;
    END IF;

    -- Add image column (duplicate of image_url for backwards compat)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fc_menu_items' AND column_name='image') THEN
        ALTER TABLE "public"."fc_menu_items" ADD COLUMN "image" text;
    END IF;
END $$;

-- Make slug NOT NULL after adding it (update existing rows first if any)
-- UPDATE "public"."fc_menu_items" SET slug = lower(regexp_replace(name, '[^a-z0-9]+', '-', 'gi')) WHERE slug IS NULL;
-- ALTER TABLE "public"."fc_menu_items" ALTER COLUMN "slug" SET NOT NULL;

SELECT 'Schema update complete' as status;
