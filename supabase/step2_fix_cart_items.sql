-- Step 2: Fix fc_cart_items table (run this second)
ALTER TABLE public.fc_cart_items 
RENAME COLUMN unit_price TO base_price;