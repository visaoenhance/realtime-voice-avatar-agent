const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const REMOTE_URL = process.env.REMOTE_SUPABASE_URL;
const REMOTE_KEY = process.env.REMOTE_SUPABASE_SERVICE_ROLE_KEY;

if (!REMOTE_URL || !REMOTE_KEY) {
  console.error('❌ Remote credentials not found');
  process.exit(1);
}

const supabase = createClient(REMOTE_URL, REMOTE_KEY);

async function importMenuData() {
  console.log('📥 Importing Menu Data to Remote Database');
  console.log('════════════════════════════════════════════════════════');
  console.log('');
  console.log(`📍 Remote: ${REMOTE_URL}`);
  console.log('');

  // Read the data export file
  const dataFile = 'supabase/exports/latest/data.sql';
  
  if (!fs.existsSync(dataFile)) {
    console.error('❌ Export file not found:', dataFile);
    process.exit(1);
  }

  console.log('📖 Reading export file...');
  console.log(`   File: ${dataFile}`);
  console.log('');

  const sqlContent = fs.readFileSync(dataFile, 'utf8');

  // Extract menu section and item inserts
  const menuSectionMatches = sqlContent.match(/INSERT INTO "public"\."fc_menu_sections"[^;]+;/g);
  const menuItemMatches = sqlContent.match(/INSERT INTO "public"\."fc_menu_items"[^;]+;/g);

  console.log(`Found in export:`);
  console.log(`  - Menu sections: ${menuSectionMatches ? menuSectionMatches.length : 0} INSERT statements`);
  console.log(`  - Menu items: ${menuItemMatches ? menuItemMatches.length : 0} INSERT statements`);
  console.log('');

  console.log('⚠️  To import this data to remote:');
  console.log('');
  console.log('1. Go to Supabase SQL Editor:');
  console.log(`   https://supabase.com/dashboard/project/${REMOTE_URL.split('//')[1].split('.')[0]}/sql`);
  console.log('');
  console.log('2. Copy and paste these SQL statements (from the export file):');
  console.log('   - All fc_menu_sections INSERT statements');
  console.log('   - All fc_menu_items INSERT statements');
  console.log('');
  console.log('3. Or run the full migration file:');
  console.log(`   ${dataFile}`);
  console.log('');
  console.log('✅ After importing, menu data will be available from the database!');
}

importMenuData();
