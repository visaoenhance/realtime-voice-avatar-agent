const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const REMOTE_URL = process.env.REMOTE_SUPABASE_URL;
const REMOTE_KEY = process.env.REMOTE_SUPABASE_SERVICE_ROLE_KEY;

async function testRemoteConnection() {
  console.log('🔍 Testing Remote Supabase Connection');
  console.log('════════════════════════════════════════════════════════');
  console.log('');

  if (!REMOTE_URL || !REMOTE_KEY) {
    console.error('❌ Remote credentials not found in .env.local');
    console.error('');
    console.error('Required:');
    console.error('  REMOTE_SUPABASE_URL=https://xxx.supabase.co');
    console.error('  REMOTE_SUPABASE_SERVICE_ROLE_KEY=eyJ...');
    return;
  }

  console.log(`📍 URL: ${REMOTE_URL}`);
  console.log('');

  const supabase = createClient(REMOTE_URL, REMOTE_KEY);

  try {
    // Test 1: Check restaurants count
    console.log('1️⃣  Checking fc_restaurants table...');
    const { data: restaurants, error: restError } = await supabase
      .from('fc_restaurants')
      .select('id, name, slug')
      .limit(5);

    if (restError) {
      console.log('   ❌ Error:', restError.message);
    } else {
      console.log(`   ✅ Found ${restaurants?.length || 0} restaurants (showing first 5)`);
      restaurants?.forEach(r => console.log(`      - ${r.name} (${r.slug})`));
    }
    console.log('');

    // Test 2: Check menu sections
    console.log('2️⃣  Checking fc_menu_sections table...');
    const { data: sections, error: sectError } = await supabase
      .from('fc_menu_sections')
      .select('id, name')
      .limit(3);

    if (sectError) {
      console.log('   ❌ Error:', sectError.message);
    } else {
      console.log(`   ✅ Found ${sections?.length || 0} menu sections`);
    }
    console.log('');

    // Test 3: Check menu items
    console.log('3️⃣  Checking fc_menu_items table...');
    const { data: items, error: itemsError } = await supabase
      .from('fc_menu_items')
      .select('id, name, base_price')
      .limit(3);

    if (itemsError) {
      console.log('   ❌ Error:', itemsError.message);
    } else {
      console.log(`   ✅ Found ${items?.length || 0} menu items`);
    }
    console.log('');

    // Test 4: Check specific restaurant (Sabor Latino)
    console.log('4️⃣  Checking Sabor Latino Cantina image...');
    const { data: sabor, error: saborError } = await supabase
      .from('fc_restaurants')
      .select('name, hero_image')
      .eq('slug', 'sabor-latino-cantina')
      .single();

    if (saborError) {
      console.log('   ❌ Error:', saborError.message);
    } else {
      console.log(`   ✅ ${sabor.name}`);
      console.log(`      Hero image: ${sabor.hero_image?.substring(0, 60)}...`);
    }
    console.log('');

    console.log('════════════════════════════════════════════════════════');
    console.log('✅ Remote connection test complete!');

  } catch (err) {
    console.error('');
    console.error('════════════════════════════════════════════════════════');
    console.error('❌ Connection test failed!');
    console.error(`   Error: ${err.message}`);
  }
}

testRemoteConnection();
