// Debug script for checkout failure
const { createClient } = require('@supabase/supabase-js');

// You'll need to add your Supabase credentials here
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'your_supabase_url';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'your_service_key';
const DEMO_PROFILE_ID = 'bc6089e0-9c7c-4c6b-8f51-4b2b8c8c8c8c';

async function debugCheckout() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
  console.log('🔍 Debugging Checkout Failure...\n');
  
  // Step 1: Check if there's an active cart
  console.log('Step 1: Looking for active cart...');
  const { data: activeCart, error: cartError } = await supabase
    .from('fc_carts')
    .select('*')
    .eq('profile_id', DEMO_PROFILE_ID)
    .eq('status', 'active')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
    
  if (cartError) {
    console.log('❌ Cart lookup error:', cartError);
    return;
  }
  
  if (!activeCart) {
    console.log('❌ No active cart found');
    return;
  }
  
  console.log('✅ Active cart found:', activeCart.id);
  console.log(`   Restaurant ID: ${activeCart.restaurant_id}`);
  console.log(`   Subtotal: $${activeCart.subtotal}`);
  
  // Step 2: Check cart items
  console.log('\\nStep 2: Checking cart items...');
  const { data: cartItems, error: itemsError } = await supabase
    .from('fc_cart_items')
    .select('*')
    .eq('cart_id', activeCart.id);
    
  if (itemsError) {
    console.log('❌ Cart items error:', itemsError);
    return;
  }
  
  console.log(`✅ Found ${cartItems.length} cart items`);
  cartItems.forEach((item, i) => {
    console.log(`   ${i+1}. ${item.menu_item_id} - Qty: ${item.quantity}, Price: $${item.total_price}`);
  });
  
  // Step 3: Check if restaurant exists
  console.log('\\nStep 3: Checking restaurant...');
  const { data: restaurant, error: restaurantError } = await supabase
    .from('fc_restaurants')
    .select('id, name, cuisine')
    .eq('id', activeCart.restaurant_id)
    .maybeSingle();
    
  if (restaurantError) {
    console.log('❌ Restaurant lookup error:', restaurantError);
  } else if (!restaurant) {
    console.log('❌ Restaurant not found for ID:', activeCart.restaurant_id);
  } else {
    console.log('✅ Restaurant found:', restaurant.name);
  }
  
  // Step 4: Test order creation (without actually creating)
  console.log('\\nStep 4: Testing order schema...');
  
  const testOrderData = {
    profile_id: DEMO_PROFILE_ID,
    restaurant_id: activeCart.restaurant_id,
    restaurant_name: restaurant?.name ?? 'Test Restaurant',
    cuisine: restaurant?.cuisine ?? null,
    total: activeCart.subtotal,
  };
  
  console.log('Test order payload:', testOrderData);
  
  // Step 5: Check database constraints
  console.log('\\nStep 5: Checking fc_orders table structure...');
  const { error: tableError } = await supabase
    .from('fc_orders')
    .select('*')
    .limit(1);
    
  if (tableError) {
    console.log('❌ fc_orders table error:', tableError);
    console.log('This might indicate missing tables or insufficient permissions');
  } else {
    console.log('✅ fc_orders table accessible');
  }
  
  console.log('\\n🔧 Diagnosis complete!');
  console.log('\\nIf everything above looks good, the issue is likely:');
  console.log('1. Database constraints (foreign key violations)');
  console.log('2. Missing sequence/auto-increment on fc_orders.id');
  console.log('3. Row Level Security (RLS) blocking the insert');
}

// Run diagnosis
debugCheckout().catch(console.error);