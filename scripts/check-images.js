const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkImages() {
  const { data, error } = await supabase
    .from('fc_restaurants')
    .select('name, slug, hero_image')
    .in('slug', ['sabor-latino-cantina', 'island-breeze-caribbean', 'green-garden-bowls'])
    .order('name');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('\n🖼️  Restaurant Images:\n');
  data.forEach(r => {
    console.log(`${r.name} (${r.slug})`);
    console.log(`  Hero Image: ${r.hero_image || 'NULL'}`);
    console.log('');
  });
}

checkImages();
