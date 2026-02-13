-- Step 4: Fix menu items (run this fourth)
ALTER TABLE public.fc_menu_items 
ADD COLUMN slug text;

ALTER TABLE public.fc_menu_item_option_choices 
RENAME COLUMN name TO label;

ALTER TABLE public.fc_cart_item_options 
ADD COLUMN price_adjustment numeric(10,2) DEFAULT 0;