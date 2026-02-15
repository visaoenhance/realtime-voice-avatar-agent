const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// Check if we're targeting remote
const REMOTE_URL = process.env.REMOTE_SUPABASE_URL;
const REMOTE_KEY = process.env.REMOTE_SUPABASE_SERVICE_ROLE_KEY;

if (!REMOTE_URL || !REMOTE_KEY) {
  console.error('❌ Error: Remote Supabase credentials not found!');
  console.error('');
  console.error('Please set the following in .env.local:');
  console.error('  REMOTE_SUPABASE_URL=https://your-project.supabase.co');
  console.error('  REMOTE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
  console.error('');
  console.error('See REMOTE_SETUP.md for instructions.');
  process.exit(1);
}

const supabase = createClient(REMOTE_URL, REMOTE_KEY);

async function testConnection() {
  console.log('🔌 Testing connection to remote Supabase...');
  console.log(`   URL: ${REMOTE_URL}`);
  console.log('');

  try {
    // Test connection
    const { data, error } = await supabase
      .from('fc_restaurants')
      .select('count')
      .limit(1);

    if (error) {
      console.log('⚠️  Tables may not exist yet (this is expected for first run)');
      console.log(`   Error: ${error.message}`);
      console.log('');
      console.log('✅ Connection successful - ready to run migration!');
      return true;
    }

    console.log('✅ Connection successful!');
    console.log('⚠️  Note: Remote database may already have data.');
    console.log('');
    
    return true;
  } catch (err) {
    console.error('❌ Connection failed!');
    console.error(`   Error: ${err.message}`);
    console.error('');
    console.error('Please check:');
    console.error('  1. REMOTE_SUPABASE_URL is correct');
    console.error('  2. REMOTE_SUPABASE_SERVICE_ROLE_KEY is correct');
    console.error('  3. Your network connection');
    console.error('  4. Supabase project is active');
    return false;
  }
}

async function getMigrationFile() {
  // Check for latest export
  const latestPath = path.join(__dirname, '../supabase/exports/latest/full_migration.sql');
  
  if (fs.existsSync(latestPath)) {
    return latestPath;
  }

  // Fall back to full_migration_0212.sql
  const fallbackPath = path.join(__dirname, '../supabase/full_migration_0212.sql');
  if (fs.existsSync(fallbackPath)) {
    console.log('⚠️  Using fallback migration file (may be outdated)');
    console.log('   Run: ./scripts/export-local-database.sh to create fresh export');
    console.log('');
    return fallbackPath;
  }

  return null;
}

async function migrate() {
  console.log('🚀 Remote Database Migration');
  console.log('════════════════════════════════════════════════════════');
  console.log('');

  // Test connection first
  const connected = await testConnection();
  if (!connected) {
    process.exit(1);
  }

  // Get migration file
  const migrationFile = await getMigrationFile();
  if (!migrationFile) {
    console.error('❌ No migration file found!');
    console.error('   Run: ./scripts/export-local-database.sh first');
    process.exit(1);
  }

  console.log('📋 Migration file:', migrationFile);
  console.log('');

  // Read SQL file
  const sql = fs.readFileSync(migrationFile, 'utf8');
  
  console.log('⚠️  IMPORTANT: This will execute SQL on your remote database!');
  console.log('');
  console.log('   The SQL file should be run manually in Supabase SQL Editor:');
  console.log(`   1. Go to: ${REMOTE_URL.replace('https://', 'https://supabase.com/dashboard/project/')}/sql`);
  console.log('   2. Copy the contents of:', migrationFile);
  console.log('   3. Paste into the SQL Editor');
  console.log('   4. Click "Run"');
  console.log('');
  console.log('   Alternatively, you can run this script with --execute flag (use with caution!)');
  console.log('');

  // Check if --execute flag is provided
  if (process.argv.includes('--execute')) {
    console.log('⚠️  Executing SQL directly via API...');
    console.log('   This may not work for all statements (DDL, etc.)');
    console.log('');
    
    // Note: Supabase client doesn't support raw SQL execution well
    // We'd need to use the pg library or REST API directly
    console.log('❌ Direct execution not supported yet.');
    console.log('   Please use the SQL Editor method above.');
    process.exit(1);
  }

  console.log('✅ Migration file ready!');
  console.log('');
  console.log('After running the migration, test with:');
  console.log('   node scripts/test-remote-connection.js');
}

migrate();
