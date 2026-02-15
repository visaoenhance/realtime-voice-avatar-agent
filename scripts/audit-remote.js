#!/usr/bin/env node

/**
 * Check detailed remote state and regenerate proper menu migration
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function auditRemote() {
  const remoteClient = createClient(
    process.env.REMOTE_SUPABASE_URL,
    process.env.REMOTE_SUPABASE_SERVICE_ROLE_KEY
  );

  const localClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('🔍 Remote Database Audit\n');

  // Check restaurants
  const { data: remoteRestaurants } = await remoteClient
    .from('fc_restaurants')
    .select('id, slug, name')
    .order('name');

  console.log('📊 Restaurants in remote:');
  console.log('=========================');
  remoteRestaurants?.forEach(r => console.log(`  ✅ ${r.name} (${r.slug})`));
  console.log(`  Total: ${remoteRestaurants?.length || 0}\n`);

  // Check sections
  const { data: remoteSections } = await remoteClient
    .from('fc_menu_sections')
    .select('id, restaurant_id, name');

  console.log('📋 Menu sections in remote:');
  console.log('===========================');
  if (remoteSections && remoteSections.length > 0) {
    remoteSections.forEach(s => {
      const restaurant = remoteRestaurants?.find(r => r.id === s.restaurant_id);
      console.log(`  ✅ ${s.name} (${restaurant?.name || 'unknown'})`);
    });
  } else {
    console.log('  ❌ None');
  }
  console.log(`  Total: ${remoteSections?.length || 0}\n`);

  // Check items
  const { data: remoteItems } = await remoteClient
    .from('fc_menu_items')
    .select('id, name');

  console.log('🍽️  Menu items in remote:');
  console.log('========================');
  console.log(`  Total: ${remoteItems?.length || 0}\n`);

  // Check local
  const { data: localRestaurants } = await localClient
    .from('fc_restaurants')
    .select('id, slug, name')
    .order('name');

  const { data: localSections } = await localClient
    .from('fc_menu_sections')
    .select('id, restaurant_id, name');

  const { data: localItems } = await localClient
    .from('fc_menu_items')
    .select('id, restaurant_id, section_id, name');

  console.log('📊 Local Database (target):');
  console.log('===========================');
  console.log(`  Restaurants: ${localRestaurants?.length || 0}`);
  console.log(`  Sections: ${localSections?.length || 0}`);
  console.log(`  Items: ${localItems?.length || 0}\n`);

  // Find missing
  const missingRestaurants = localRestaurants?.filter(
    local => !remoteRestaurants?.find(r => r.slug === local.slug)
  );

  console.log('🔴 Missing in remote:');
  console.log('=====================');
  console.log(`  Restaurants: ${missingRestaurants?.length || 0}`);
  missingRestaurants?.forEach(r => console.log(`    - ${r.name} (${r.slug})`));
  
  console.log(`  Sections: ${(localSections?.length || 0) - (remoteSections?.length || 0)}`);
  console.log(`  Items: ${(localItems?.length || 0) - (remoteItems?.length || 0)}`);
}

auditRemote().catch(console.error);
