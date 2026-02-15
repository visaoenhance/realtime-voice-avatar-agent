#!/usr/bin/env node

/**
 * Generate menu migration SQL that only includes restaurants existing in remote
 */

const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function generateRemoteMenuMigration() {
  // Get remote restaurants
  const remoteClient = createClient(
    process.env.REMOTE_SUPABASE_URL,
    process.env.REMOTE_SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: remoteRestaurants } = await remoteClient
    .from('fc_restaurants')
    .select('id, slug, name');

  console.log('📊 Remote restaurants found:');
  remoteRestaurants?.forEach(r => console.log(`  - ${r.name} (${r.id})`));

  const remoteRestaurantIds = new Set(remoteRestaurants?.map(r => r.id) || []);

  // Get local menu sections for those restaurants
  const localClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: sections } = await localClient
    .from('fc_menu_sections')
    .select('*')
    .in('restaurant_id', Array.from(remoteRestaurantIds));

  const { data: items } = await localClient
    .from('fc_menu_items')
    .select('*')
    .in('section_id', sections?.map(s => s.id) || []);

  console.log(`\n📋 Found ${sections?.length || 0} menu sections for remote restaurants`);
  console.log(`📋 Found ${items?.length || 0} menu items`);

  // Generate SQL
  let sectionsSql = `-- Menu Sections for Remote Restaurants\n-- Generated: ${new Date().toISOString()}\n\n`;
  
  if (sections && sections.length > 0) {
    sectionsSql += `INSERT INTO "public"."fc_menu_sections" ("id", "restaurant_id", "name", "description", "display_order", "created_at", "updated_at") VALUES\n`;
    
    sections.forEach((section, idx) => {
      const restaurant = remoteRestaurants?.find(r => r.id === section.restaurant_id);
      sectionsSql += `    ('${section.id}', '${section.restaurant_id}', '${section.name.replace(/'/g, "''")}', ${section.description ? `'${section.description.replace(/'/g, "''")}'` : 'NULL'}, ${section.display_order}, '${section.created_at}', '${section.updated_at}')`;
      sectionsSql += idx < sections.length - 1 ? ',\n' : ';\n';
      console.log(`  ✅ ${section.name} (${restaurant?.name})`);
    });
  }

  let itemsSql = `-- Menu Items for Remote Restaurants\n-- Generated: ${new Date().toISOString()}\n\n`;
  
  if (items && items.length > 0) {
    itemsSql += `INSERT INTO "public"."fc_menu_items" ("id", "restaurant_id", "section_id", "slug", "name", "description", "base_price", "dietary_tags", "image", "is_available", "created_at", "updated_at") VALUES\n`;
    
    items.forEach((item, idx) => {
      itemsSql += `    ('${item.id}', '${item.restaurant_id}', '${item.section_id}', '${item.slug}', '${item.name.replace(/'/g, "''")}', `;
      itemsSql += item.description ? `'${item.description.replace(/'/g, "''")}'` : 'NULL';
      itemsSql += `, ${item.base_price}, `;
      itemsSql += item.dietary_tags ? `ARRAY[${item.dietary_tags.map(t => `'${t}'`).join(', ')}]::text[]` : 'NULL';
      itemsSql += `, ${item.image ? `'${item.image}'` : 'NULL'}, ${item.is_available}, '${item.created_at}', '${item.updated_at}')`;
      itemsSql += idx < items.length - 1 ? ',\n' : ';\n';
    });
    
    console.log(`  ✅ ${items.length} menu items`);
  }

  // Save files
  const outputDir = 'supabase/exports';
  fs.writeFileSync(`${outputDir}/remote_menu_sections.sql`, sectionsSql);
  fs.writeFileSync(`${outputDir}/remote_menu_items.sql`, itemsSql);

  console.log(`\n💾 Generated migration files:`);
  console.log(`   ${outputDir}/remote_menu_sections.sql`);
  console.log(`   ${outputDir}/remote_menu_items.sql`);
  console.log(`\n✅ Ready to import to remote!`);
}

generateRemoteMenuMigration().catch(console.error);
