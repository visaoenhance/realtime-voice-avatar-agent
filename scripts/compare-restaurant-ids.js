#!/usr/bin/env node

/**
 * Compare restaurant IDs between local and remote databases
 * This helps us create a proper migration mapping
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function compareRestaurants() {
  // Local DB
  const localClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Remote DB
  const remoteClient = createClient(
    process.env.REMOTE_SUPABASE_URL,
    process.env.REMOTE_SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('🔍 Comparing Restaurant IDs...\n');

  // Get local restaurants
  const { data: localRestaurants } = await localClient
    .from('fc_restaurants')
    .select('id, slug, name')
    .order('name');

  // Get remote restaurants
  const { data: remoteRestaurants } = await remoteClient
    .from('fc_restaurants')
    .select('id, slug, name')
    .order('name');

  console.log('📊 LOCAL Database:');
  console.log('==================');
  localRestaurants?.forEach(r => {
    console.log(`${r.name}`);
    console.log(`  Slug: ${r.slug}`);
    console.log(`  ID:   ${r.id}`);
    console.log('');
  });

  console.log('\n📊 REMOTE Database:');
  console.log('===================');
  remoteRestaurants?.forEach(r => {
    console.log(`${r.name}`);
    console.log(`  Slug: ${r.slug}`);
    console.log(`  ID:   ${r.id}`);
    console.log('');
  });

  // Create mapping
  console.log('\n🔗 ID Mapping (slug → local ID → remote ID):');
  console.log('=============================================');
  
  const mapping = {};
  localRestaurants?.forEach(local => {
    const remote = remoteRestaurants?.find(r => r.slug === local.slug);
    if (remote) {
      mapping[local.id] = remote.id;
      console.log(`${local.slug}:`);
      console.log(`  Local:  ${local.id}`);
      console.log(`  Remote: ${remote.id}`);
      console.log(`  Match: ${local.id === remote.id ? '✅ Same' : '❌ Different'}`);
      console.log('');
    }
  });

  // Check for menu data
  console.log('\n📋 Menu Data Status:');
  console.log('====================');
  
  const { data: localSections } = await localClient
    .from('fc_menu_sections')
    .select('id, restaurant_id, name')
    .limit(5);
  
  const { data: remoteSections } = await remoteClient
    .from('fc_menu_sections')
    .select('id, restaurant_id, name')
    .limit(5);

  console.log(`Local menu sections: ${localSections?.length || 0}`);
  console.log(`Remote menu sections: ${remoteSections?.length || 0}`);
  
  if (localSections?.length > 0) {
    console.log('\nLocal sections by restaurant_id:');
    localSections.forEach(s => {
      const local = localRestaurants?.find(r => r.id === s.restaurant_id);
      console.log(`  - ${s.name} (restaurant: ${local?.name || 'unknown'})`);
    });
  }

  // Save mapping to JSON
  const fs = require('fs');
  fs.writeFileSync(
    'supabase/exports/id_mapping.json',
    JSON.stringify({ restaurant_id_mapping: mapping }, null, 2)
  );
  console.log('\n💾 Saved ID mapping to: supabase/exports/id_mapping.json');
}

compareRestaurants().catch(console.error);
