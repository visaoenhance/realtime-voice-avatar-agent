const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkMenuData() {
  console.log('\n📊 Checking Menu Data in Database\n');
  
  // Check menu sections
  const { data: sections, error: sectError } = await supabase
    .from('fc_menu_sections')
    .select('id, name, restaurant_id')
    .limit(5);
  
  if (sectError) {
    console.log('❌ Menu sections error:', sectError.message);
  } else {
    console.log(`Menu Sections: ${sections?.length || 0} found`);
    if (sections && sections.length > 0) {
      sections.forEach(s => console.log(`  - ${s.name} (restaurant: ${s.restaurant_id.substring(0, 8)}...)`));
    }
  }
  
  console.log('');
  
  // Check menu items
  const { data: items, error: itemError } = await supabase
    .from('fc_menu_items')
    .select('id, name, slug')
    .limit(5);
  
  if (itemError) {
    console.log('❌ Menu items error:', itemError.message);
  } else {
    console.log(`Menu Items: ${items?.length || 0} found`);
    if (items && items.length > 0) {
      items.forEach(i => console.log(`  - ${i.name} (${i.slug})`));
    }
  }
  
  console.log('');
  console.log('🔍 Database URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
}

checkMenuData();
