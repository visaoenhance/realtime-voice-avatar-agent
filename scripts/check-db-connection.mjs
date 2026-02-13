#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

// Check environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Environment check:');
console.log(`SUPABASE_URL: ${supabaseUrl ? '✅ Set' : '❌ Not set'}`);
console.log(`SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceRoleKey ? '✅ Set' : '❌ Not set'}`);

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.log('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
  },
});

console.log('\n🔍 Testing database connection...');

// Test 1: Check fc_restaurants table (which should work according to user)
console.log('\n1. Testing fc_restaurants table...');
try {
  const { data: restaurants, error: restaurantError } = await supabase
    .from('fc_restaurants')
    .select('id, name, cuisine')
    .limit(3);

  if (restaurantError) {
    console.log('❌ fc_restaurants query failed:', restaurantError.message);
  } else {
    console.log(`✅ fc_restaurants working - found ${restaurants.length} restaurants`);
    if (restaurants.length > 0) {
      console.log('   Sample:', restaurants[0].name);
    }
  }
} catch (err) {
  console.log('❌ fc_restaurants error:', err.message);
}

// Test 2: Check fc_carts table (which should work according to user)
console.log('\n2. Testing fc_carts table...');
try {
  const { data: carts, error: cartError } = await supabase
    .from('fc_carts')
    .select('id, status')
    .limit(3);

  if (cartError) {
    console.log('❌ fc_carts query failed:', cartError.message);
  } else {
    console.log(`✅ fc_carts working - found ${carts.length} carts`);
  }
} catch (err) {
  console.log('❌ fc_carts error:', err.message);
}

// Test 3: Check fc_orders table (this is probably missing)
console.log('\n3. Testing fc_orders table...');
try {
  const { data: orders, error: orderError } = await supabase
    .from('fc_orders')
    .select('id')
    .limit(1);

  if (orderError) {
    console.log('❌ fc_orders query failed:', orderError.message);
    if (orderError.code === 'PGRST116') {
      console.log('   → Table fc_orders does not exist');
    }
  } else {
    console.log(`✅ fc_orders working - found ${orders.length} orders`);
  }
} catch (err) {
  console.log('❌ fc_orders error:', err.message);
}

// Test 4: Check fc_order_items table
console.log('\n4. Testing fc_order_items table...');
try {
  const { data: orderItems, error: orderItemsError } = await supabase
    .from('fc_order_items')
    .select('id')
    .limit(1);

  if (orderItemsError) {
    console.log('❌ fc_order_items query failed:', orderItemsError.message);
    if (orderItemsError.code === 'PGRST116') {
      console.log('   → Table fc_order_items does not exist');
    }
  } else {
    console.log(`✅ fc_order_items working - found ${orderItems.length} items`);
  }
} catch (err) {
  console.log('❌ fc_order_items error:', err.message);
}

// Test 5: Check fc_order_item_options table
console.log('\n5. Testing fc_order_item_options table...');
try {
  const { data: orderOptions, error: orderOptionsError } = await supabase
    .from('fc_order_item_options')
    .select('id')
    .limit(1);

  if (orderOptionsError) {
    console.log('❌ fc_order_item_options query failed:', orderOptionsError.message);
    if (orderOptionsError.code === 'PGRST116') {
      console.log('   → Table fc_order_item_options does not exist');
    }
  } else {
    console.log(`✅ fc_order_item_options working - found ${orderOptions.length} options`);
  }
} catch (err) {
  console.log('❌ fc_order_item_options error:', err.message);
}

console.log('\n📋 Summary:');
console.log('If fc_restaurants and fc_carts work but fc_orders tables fail,');
console.log('then we need to run migrations to add the missing order tables.');