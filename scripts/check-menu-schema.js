#!/usr/bin/env node

/**
 * Check remote fc_menu_items and fc_menu_sections schema
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkMenuSchema() {
  const remoteClient = createClient(
    process.env.REMOTE_SUPABASE_URL,
    process.env.REMOTE_SUPABASE_SERVICE_ROLE_KEY
  );

  const localClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('🔍 Checking menu table schemas...\n');

  // Check fc_menu_sections
  const { data: remoteSections } = await remoteClient
    .from('fc_menu_sections')
    .select('*')
    .limit(1);

  const { data: localSections } = await localClient
    .from('fc_menu_sections')
    .select('*')
    .limit(1);

  console.log('📋 fc_menu_sections columns:');
  console.log('============================');
  if (remoteSections && remoteSections[0]) {
    console.log('Remote:', Object.keys(remoteSections[0]).join(', '));
  }
  if (localSections && localSections[0]) {
    console.log('Local: ', Object.keys(localSections[0]).join(', '));
  }

  // Check fc_menu_items
  const { data: remoteItems } = await remoteClient
    .from('fc_menu_items')
    .select('*')
    .limit(1);

  const { data: localItems } = await localClient
    .from('fc_menu_items')
    .select('*')
    .limit(1);

  console.log('\n📋 fc_menu_items columns:');
  console.log('========================');
  if (remoteItems && remoteItems[0]) {
    console.log('Remote:', Object.keys(remoteItems[0]).join(', '));
  } else {
    // No items yet, try to insert empty to see schema error or check table definition
    console.log('Remote: (no items yet, checking via insert attempt...)');
    const { error } = await remoteClient
      .from('fc_menu_items')
      .insert({ name: '__test__' })
      .select();
    if (error) {
      console.log('Error hint:', error.message);
    }
  }
  
  if (localItems && localItems[0]) {
    console.log('Local: ', Object.keys(localItems[0]).join(', '));
  }

  console.log('\n🔍 Schema Comparison:');
  console.log('=====================');
  
  if (remoteSections && remoteSections[0] && localSections && localSections[0]) {
    const remoteSectionCols = Object.keys(remoteSections[0]);
    const localSectionCols = Object.keys(localSections[0]);
    const missingInRemote = localSectionCols.filter(c => !remoteSectionCols.includes(c));
    if (missingInRemote.length > 0) {
      console.log('⚠️  fc_menu_sections: Missing in remote:', missingInRemote.join(', '));
    } else {
      console.log('✅ fc_menu_sections: Schemas match');
    }
  }

  if (localItems && localItems[0]) {
    const localItemCols = Object.keys(localItems[0]);
    console.log('\n⚠️  fc_menu_items: Remote needs these columns:');
    console.log('   ', localItemCols.join(', '));
    console.log('\nLocal has slug:', localItemCols.includes('slug') ? 'YES' : 'NO');
  }
}

checkMenuSchema().catch(console.error);
