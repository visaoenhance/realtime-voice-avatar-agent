const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testSabor() {
  const { data, error } = await supabase
    .from('fc_restaurants')
    .select('slug, name, hero_image')
    .eq('slug', 'sabor-latino-cantina')
    .maybeSingle();

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('\n🌮 Sabor Latino Cantina:\n');
  console.log(`Name: ${data?.name}`);
  console.log(`Slug: ${data?.slug}`);
  console.log(`Hero Image: ${data?.hero_image || 'NULL'}`);
  console.log(`\nHero Image Type: ${typeof data?.hero_image}`);
  console.log(`Hero Image Length: ${data?.hero_image?.length || 0}`);
}

testSabor();
