// Simple diagnostic to check if order tables exist
// Run this to see what's missing

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.log('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkOrderTables() {
  console.log('🔍 Checking Food Court Database Tables...\n');
  
  const tables = ['fc_orders', 'fc_order_items', 'fc_order_item_options', 'fc_carts', 'fc_cart_items', 'fc_restaurants'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
        
      if (error) {
        console.log(`❌ Table '${table}': ${error.message}`);
      } else {
        console.log(`✅ Table '${table}': EXISTS (${data.length} sample records)`);
      }
    } catch (err) {
      console.log(`❌ Table '${table}': ${err.message}`);
    }
  }
  
  console.log('\n🔍 Checking specific demo profile...');
  
  try {
    const { data: profile, error: profileError } = await supabase
      .from('fc_profiles')
      .select('*')
      .eq('id', 'bc6089e0-9c7c-4c6b-8f51-4b2b8c8c8c8c')
      .maybeSingle();
      
    if (profileError) {
      console.log('❌ Demo profile lookup error:', profileError.message);
    } else if (!profile) {
      console.log('❌ Demo profile does not exist');
    } else {
      console.log('✅ Demo profile exists:', profile.household_name);
    }
  } catch (err) {
    console.log('❌ Profile check failed:', err.message);
  }
}

checkOrderTables().catch(console.error);