-- Step 1: Fix fc_carts table (run this first)
ALTER TABLE public.fc_carts 
ADD COLUMN status text DEFAULT 'active',
ADD COLUMN subtotal numeric(10,2) DEFAULT 0;