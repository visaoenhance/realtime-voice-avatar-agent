#!/usr/bin/env node

/**
 * Query remote fc_menu_items schema from information_schema
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function getRemoteSchema() {
  const remoteClient = createClient(
    process.env.REMOTE_SUPABASE_URL,
    process.env.REMOTE_SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('🔍 Querying remote schema from information_schema...\n');

  // Query using raw SQL
  const { data, error } = await remoteClient.rpc('exec_sql', { 
    sql: `SELECT column_name, data_type, is_nullable 
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'fc_menu_items' 
          ORDER BY ordinal_position;`
  });

  if (error) {
    console.log('RPC not available, trying direct query...\n');
    
    // Alternative: try to create a test record and see what fields are accepted
    const { error: insertError } = await remoteClient
      .from('fc_menu_items')
      .insert({
        restaurant_id: '3bb63c3a-6fa9-42ad-8a2a-1b843745a4b4',
        section_id: 'test',
        name: 'test'
      });
    
    if (insertError) {
      console.log('Insert error:', insertError.message);
      console.log('Hint:', insertError.hint);
    }
  } else {
    console.log('Remote fc_menu_items columns:');
    console.log('============================');
    data?.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(required)' : '(optional)'}`);
    });
  }
}

getRemoteSchema().catch(console.error);
