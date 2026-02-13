#!/usr/bin/env node

/**
 * Migration Verification Script
 * Verifies that Supabase migration was successful and all systems are working
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY  // Use service role to bypass RLS
);

async function verifyMigration() {
  console.log('🔍 Verifying Supabase Migration...\n');
  
  try {
    // Test 1: Database Connection
    console.log('1️⃣ Testing database connection...');
    const { data: connection, error: connError } = await supabase
      .from('fc_restaurants')
      .select('count', { count: 'exact', head: true });
    
    if (connError) {
      console.log('❌ Connection failed:', connError.message);
      return false;
    }
    console.log('✅ Database connection successful');

    // Test 2: Verify Table Structure
    console.log('\n2️⃣ Verifying table structure...');
    
    const tables = [
      'fc_profiles',
      'fc_restaurants', 
      'fc_menu_sections',
      'fc_menu_items',
      'fc_carts',
      'fc_orders',
      'mvnte_profiles',
      'mvnte_titles'
    ];
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ Table ${table} missing or inaccessible:`, error.message);
        return false;
      }
      console.log(`✅ Table ${table} exists`);
    }

    // Test 3: Verify Sample Data
    console.log('\n3️⃣ Verifying sample data...');
    
    const { data: profiles, error: profileError } = await supabase
      .from('fc_profiles')
      .select('*');
    
    if (profileError || !profiles || profiles.length === 0) {
      console.log('❌ No profiles found:', profileError?.message);
      return false;
    }
    console.log(`✅ Found ${profiles.length} profile(s)`);
    console.log(`   Profile: ${profiles[0].household_name}`);
    
    const { data: restaurants, error: restError } = await supabase
      .from('fc_restaurants')
      .select('name, cuisine_group')
      .limit(5);
    
    if (restError || !restaurants || restaurants.length === 0) {
      console.log('❌ No restaurants found:', restError?.message);
      return false;
    }
    console.log(`✅ Found ${restaurants.length} restaurants:`);
    restaurants.forEach(r => console.log(`   - ${r.name} (${r.cuisine_group})`));

    // Test 4: Verify Environment Variables
    console.log('\n4️⃣ Verifying environment variables...');
    
    const requiredVars = [
      'SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY', 
      'SUPABASE_SERVICE_ROLE_KEY',
      'OPENAI_API_KEY',
      'DEMO_PROFILE_ID'
    ];
    
    for (const envVar of requiredVars) {
      if (!process.env[envVar]) {
        console.log(`❌ Missing environment variable: ${envVar}`);
        return false;
      }
      const value = process.env[envVar];
      const masked = envVar.includes('KEY') || envVar.includes('URL') 
        ? `${value.substring(0, 8)}...${value.substring(value.length - 4)}`
        : value;
      console.log(`✅ ${envVar}: ${masked}`);
    }

    // Test 5: Verify Demo Profile Access
    console.log('\n5️⃣ Verifying demo profile access...');
    
    const { data: demoProfile, error: demoError } = await supabase
      .from('fc_profiles')
      .select('*')
      .eq('id', process.env.DEMO_PROFILE_ID)
      .single();
    
    if (demoError || !demoProfile) {
      console.log('❌ Demo profile not found:', demoError?.message);
      console.log('   Make sure DEMO_PROFILE_ID matches a profile in fc_profiles');
      return false;
    }
    console.log(`✅ Demo profile found: ${demoProfile.household_name}`);

    console.log('\n🎉 All verification checks passed!');
    console.log('\nNext steps:');
    console.log('   1. Run: npm run dev');
    console.log('   2. Visit: http://localhost:3000/food/concierge');
    console.log('   3. Test a query: "I want Caribbean food"');
    
    return true;

  } catch (error) {
    console.log('❌ Verification failed:', error.message);
    return false;
  }
}

// Run verification
verifyMigration()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Script error:', error);
    process.exit(1);
  });