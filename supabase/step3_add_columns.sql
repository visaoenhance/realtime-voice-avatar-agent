-- Step 3: Add missing columns (run this third)
ALTER TABLE public.fc_cart_items 
RENAME COLUMN special_instructions TO instructions;

ALTER TABLE public.fc_cart_items 
ADD COLUMN total_price numeric(10,2);