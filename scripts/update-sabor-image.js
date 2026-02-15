const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY  // Use service role key for write operations
);

async function updateSaborImage() {
  const newImageUrl = 'https://images.pexels.com/photos/14560045/pexels-photo-14560045.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';

  console.log('\n🔧 Updating Sabor Latino Cantina hero image...\n');
  console.log(`Old (broken): https://images.unsplash.com/photo-1606755962773-0e7d4be90a77?auto=format&fit=crop&w=1600&q=80`);
  console.log(`New (Pexels): ${newImageUrl}\n`);

  const { data, error } = await supabase
    .from('fc_restaurants')
    .update({ hero_image: newImageUrl })
    .eq('slug', 'sabor-latino-cantina')
    .select('name, slug, hero_image');

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log('✅ Updated successfully!');
  console.log(data);
}

updateSaborImage();
