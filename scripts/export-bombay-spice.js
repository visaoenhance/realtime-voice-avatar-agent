#!/usr/bin/env node

/**
 * Export Bombay Spice House restaurant data for remote import
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

async function exportBombaySpice() {
  const localClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('📤 Exporting Bombay Spice House...\n');

  const { data: restaurant, error } = await localClient
    .from('fc_restaurants')
    .select('*')
    .eq('slug', 'bombay-spice-house')
    .single();

  if (error || !restaurant) {
    console.error('❌ Error:', error);
    return;
  }

  console.log('✅ Found:', restaurant.name);
  console.log('   ID:', restaurant.id);
  console.log('   Slug:', restaurant.slug);
  console.log('');

  // Generate SQL INSERT
  const sql = `-- Import Bombay Spice House to Remote
INSERT INTO "public"."fc_restaurants" 
  (id, created_at, updated_at, name, slug, description, cuisine_type, rating, delivery_time, delivery_fee, min_order, is_open, address, phone, hero_image, promo, closes_at, highlights, standout_dish)
VALUES 
  (
    '${restaurant.id}',
    '${restaurant.created_at}',
    '${restaurant.updated_at || restaurant.created_at}',
    '${restaurant.name.replace(/'/g, "''")}',
    '${restaurant.slug}',
    ${restaurant.description ? `'${restaurant.description.replace(/'/g, "''")}'` : 'NULL'},
    ${restaurant.cuisine_type ? `'${restaurant.cuisine_type.replace(/'/g, "''")}'` : 'NULL'},
    ${restaurant.rating || 'NULL'},
    ${restaurant.delivery_time ? `'${restaurant.delivery_time}'` : 'NULL'},
    ${restaurant.delivery_fee || 'NULL'},
    ${restaurant.min_order || 'NULL'},
    ${restaurant.is_open !== null ? restaurant.is_open : 'true'},
    ${restaurant.address ? `'${restaurant.address.replace(/'/g, "''")}'` : 'NULL'},
    ${restaurant.phone ? `'${restaurant.phone}'` : 'NULL'},
    ${restaurant.hero_image ? `'${restaurant.hero_image}'` : 'NULL'},
    ${restaurant.promo ? `'${restaurant.promo.replace(/'/g, "''")}'` : 'NULL'},
    ${restaurant.closes_at ? `'${restaurant.closes_at}'` : 'NULL'},
    ${restaurant.highlights ? `'${JSON.stringify(restaurant.highlights)}'` : 'NULL'},
    ${restaurant.standout_dish ? `'${restaurant.standout_dish.replace(/'/g, "''")}'` : 'NULL'}
  );
`;

  // Save to file
  const outputPath = 'supabase/exports/bombay_spice_house.sql';
  fs.writeFileSync(outputPath, sql);

  console.log('💾 SQL saved to:', outputPath);
  console.log('');
  console.log('📋 To import to remote:');
  console.log('   1. Open: https://supabase.com/dashboard/project/ceeklugdyurvxonnhykt/sql');
  console.log('   2. Copy/paste the SQL from bombay_spice_house.sql');
  console.log('   3. Run it');
  console.log('');
  console.log('Or view it now:');
  console.log('   cat supabase/exports/bombay_spice_house.sql');
}

exportBombaySpice().catch(console.error);
