#!/usr/bin/env node
/**
 * Check all fc_ tables in local Supabase
 * Usage: node -r dotenv/config scripts/check-fc-tables.mjs dotenv_config_path=.env.local
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const tables = [
  'fc_profiles',
  'fc_preferences',
  'fc_restaurants',
  'fc_layouts',
  'fc_menu_sections',
  'fc_menu_items',
  'fc_menu_item_option_groups',
  'fc_menu_item_option_choices',
  'fc_carts',
  'fc_cart_items',
  'fc_cart_item_options',
  'fc_orders',
  'fc_order_events',
  'fc_feedback'
];

console.log('\n🔍 Checking Food Court Tables in Local Supabase...\n');
console.log(`Connected to: ${process.env.SUPABASE_URL}\n`);

const results = await Promise.all(
  tables.map(async (table) => {
    try {
      const { error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      return { table, status: '✅', count: count || 0 };
    } catch (err) {
      return { table, status: '❌', error: err.message };
    }
  })
);

// Display results
let successCount = 0;
let failCount = 0;

results.forEach(r => {
  if (r.status === '✅') {
    console.log(`${r.status} ${r.table.padEnd(35)} (${r.count} records)`);
    successCount++;
  } else {
    console.log(`${r.status} ${r.table.padEnd(35)} Error: ${r.error}`);
    failCount++;
  }
});

console.log(`\n📊 Summary: ${successCount} tables available, ${failCount} missing/errors\n`);

if (failCount > 0) {
  console.log('⚠️  Some tables are missing. You may need to run migrations.');
  process.exit(1);
}

console.log('✅ All Food Court tables are ready!\n');
