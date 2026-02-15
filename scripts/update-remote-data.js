const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const REMOTE_URL = process.env.REMOTE_SUPABASE_URL;
const REMOTE_KEY = process.env.REMOTE_SUPABASE_SERVICE_ROLE_KEY;

if (!REMOTE_URL || !REMOTE_KEY) {
  console.error('❌ Remote credentials not found in .env.local');
  process.exit(1);
}

const supabase = createClient(REMOTE_URL, REMOTE_KEY);

async function updateRemoteData() {
  console.log('🔧 Updating Remote Supabase Data');
  console.log('════════════════════════════════════════════════════════');
  console.log('');
  console.log(`📍 Remote URL: ${REMOTE_URL}`);
  console.log('');

  const newImageUrl = 'https://images.pexels.com/photos/14560045/pexels-photo-14560045.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';

  // 1. Update Sabor Latino Cantina image
  console.log('1️⃣  Fixing Sabor Latino Cantina hero image...');
  console.log(`   Old: https://images.unsplash.com/photo-1606755962773-0e7d4be90a77...`);
  console.log(`   New: ${newImageUrl}`);

  const { data, error } = await supabase
    .from('fc_restaurants')
    .update({ hero_image: newImageUrl })
    .eq('slug', 'sabor-latino-cantina')
    .select('name, slug, hero_image');

  if (error) {
    console.error('   ❌ Error:', error.message);
    return;
  }

  if (data && data.length > 0) {
    console.log('   ✅ Updated successfully!');
    console.log(`   ${data[0].name}: ${data[0].hero_image.substring(0, 60)}...`);
  } else {
    console.log('   ⚠️  No records updated');
  }

  console.log('');
  console.log('✅ Remote data update complete!');
  console.log('');
  console.log('Verify with: node scripts/test-remote-connection.js');
}

updateRemoteData();
