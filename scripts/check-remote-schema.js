#!/usr/bin/env node

/**
 * Check remote fc_restaurants schema to generate correct INSERT
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkSchema() {
  const remoteClient = createClient(
    process.env.REMOTE_SUPABASE_URL,
    process.env.REMOTE_SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('🔍 Checking remote schema...\n');

  // Get one restaurant to see actual columns
  const { data: sample } = await remoteClient
    .from('fc_restaurants')
    .select('*')
    .limit(1)
    .single();

  if (sample) {
    console.log('📊 Remote fc_restaurants columns:');
    console.log('==================================');
    Object.keys(sample).forEach(col => {
      console.log(`  - ${col}: ${typeof sample[col]} (${sample[col] === null ? 'NULL' : 'has value'})`);
    });
  }

  // Now check local schema
  const localClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: localSample } = await localClient
    .from('fc_restaurants')
    .select('*')
    .eq('slug', 'bombay-spice-house')
    .single();

  if (localSample) {
    console.log('\n📊 Local fc_restaurants columns:');
    console.log('=================================');
    Object.keys(localSample).forEach(col => {
      console.log(`  - ${col}: ${typeof localSample[col]} (${localSample[col] === null ? 'NULL' : 'has value'})`);
    });

    console.log('\n🔍 Column Comparison:');
    console.log('=====================');
    const remoteColumns = Object.keys(sample);
    const localColumns = Object.keys(localSample);
    
    const onlyInLocal = localColumns.filter(col => !remoteColumns.includes(col));
    const onlyInRemote = remoteColumns.filter(col => !localColumns.includes(col));
    const common = localColumns.filter(col => remoteColumns.includes(col));

    console.log(`✅ Common columns (${common.length}): ${common.join(', ')}`);
    if (onlyInLocal.length > 0) {
      console.log(`⚠️  Only in LOCAL: ${onlyInLocal.join(', ')}`);
    }
    if (onlyInRemote.length > 0) {
      console.log(`⚠️  Only in REMOTE: ${onlyInRemote.join(', ')}`);
    }

    // Generate correct SQL for Bombay
    console.log('\n📝 Generating corrected SQL...\n');
    
    const columns = remoteColumns.filter(col => col !== 'id' && col !== 'created_at' && col !== 'updated_at');
    const values = columns.map(col => {
      const val = localSample[col];
      if (val === null || val === undefined) return 'NULL';
      if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
      if (typeof val === 'number') return val;
      if (typeof val === 'boolean') return val;
      if (Array.isArray(val)) return `ARRAY[${val.map(v => `'${v.replace(/'/g, "''")}'`).join(', ')}]`;
      return `'${JSON.stringify(val)}'`;
    });

    const sql = `-- Import Bombay Spice House to Remote (Schema-Matched)
INSERT INTO "public"."fc_restaurants" 
  (id, created_at, updated_at, ${columns.join(', ')})
VALUES 
  (
    '${localSample.id}'::uuid,
    '${localSample.created_at}'::timestamptz,
    '${localSample.updated_at || localSample.created_at}'::timestamptz,
    ${values.join(',\n    ')}
  );
`;

    const fs = require('fs');
    fs.writeFileSync('supabase/exports/bombay_spice_house_fixed.sql', sql);
    console.log('💾 Fixed SQL saved to: supabase/exports/bombay_spice_house_fixed.sql');
  }
}

checkSchema().catch(console.error);
