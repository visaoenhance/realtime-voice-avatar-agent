-- Step 5: Final updates (run this last)
UPDATE public.fc_cart_items 
SET total_price = base_price * quantity 
WHERE total_price IS NULL;

UPDATE public.fc_menu_items 
SET slug = LOWER(REGEXP_REPLACE(name, '[^A-Za-z0-9]+', '-', 'g'))
WHERE slug IS NULL OR slug = '';