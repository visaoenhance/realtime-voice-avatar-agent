// Test actual connection to currently active environment
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const env = process.env.SUPABASE_ENV || 'local';

let url, serviceKey;
if (env === 'remote') {
  url = process.env.REMOTE_SUPABASE_URL;
  serviceKey = process.env.REMOTE_SUPABASE_SERVICE_ROLE_KEY;
} else {
  url = process.env.LOCAL_SUPABASE_URL;
  serviceKey = process.env.LOCAL_SUPABASE_SERVICE_ROLE_KEY;
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false }
});

async function test() {
  console.log(`🔍 Testing ${env.toUpperCase()} environment`);
  console.log(`🌐 URL: ${url}`);
  console.log('');

  try {
    // Count restaurants
    const { data: restaurants, error: rError } = await supabase
      .from('fc_restaurants')
      .select('id, name, slug')
      .order('name');

    if (rError) throw rError;

    console.log(`✅ Restaurants: ${restaurants.length}`);
    restaurants.forEach(r => console.log(`   - ${r.name} (${r.slug})`));
    console.log('');

    // Count menu sections
    const { count: sectionCount } = await supabase
      .from('fc_menu_sections')
      .select('*', { count: 'exact', head: true });

    console.log(`✅ Menu Sections: ${sectionCount}`);

    // Count menu items
    const { count: itemCount } = await supabase
      .from('fc_menu_items')
      .select('*', { count: 'exact', head: true });

    console.log(`✅ Menu Items: ${itemCount}`);
    console.log('');
    console.log(`🎉 Connection to ${env} successful!`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

test();
