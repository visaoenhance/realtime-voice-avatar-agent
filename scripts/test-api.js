#!/usr/bin/env node

/**
 * API Endpoint Test Script
 * Tests the food chat API endpoints to verify they're working with the new database
 */

require('dotenv').config({ path: '.env.local' });

async function testFoodChatAPI() {
  console.log('🍕 Testing Food Chat API Endpoints...\n');
  
  const baseUrl = 'http://localhost:3000';
  
  try {
    // Test 1: Homepage data endpoint
    console.log('1️⃣ Testing homepage data endpoint...');
    const homepageResponse = await fetch(`${baseUrl}/api/data/homepage`);
    
    if (!homepageResponse.ok) {
      console.log(`❌ Homepage API failed: ${homepageResponse.status} ${homepageResponse.statusText}`);
      return false;
    }
    
    const homepageData = await homepageResponse.json();
    console.log(`✅ Homepage data loaded successfully`);
    console.log(`   Profile: ${homepageData.profile?.household_name}`);
    console.log(`   Restaurants: ${homepageData.restaurants?.length || 0} found`);

    // Test 2: Food chat endpoint
    console.log('\n2️⃣ Testing food chat endpoint...');
    const chatPayload = {
      messages: [{
        role: 'user',
        content: 'I want something healthy for dinner'
      }]
    };
    
    const chatResponse = await fetch(`${baseUrl}/api/food-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(chatPayload)
    });
    
    if (!chatResponse.ok) {
      console.log(`❌ Food chat API failed: ${chatResponse.status} ${chatResponse.statusText}`);
      const errorText = await chatResponse.text();
      console.log(`   Error details: ${errorText}`);
      return false;
    }
    
    console.log('✅ Food chat API responding');
    
    // Read the streaming response
    const reader = chatResponse.body?.getReader();
    if (reader) {
      let chunks = [];
      let done = false;
      
      while (!done) {
        const { value, done: streamDone } = await reader.read();
        done = streamDone;
        if (value) {
          chunks.push(new TextDecoder().decode(value));
        }
      }
      
      const fullResponse = chunks.join('');
      const hasToolCalls = fullResponse.includes('get_restaurants') || fullResponse.includes('search_menu_items');
      
      if (hasToolCalls) {
        console.log('✅ AI tools are being called correctly');
      } else {
        console.log('⚠️  No tool calls detected in response (this might be normal)');
      }
    }

    // Test 3: Cart endpoint  
    console.log('\n3️⃣ Testing cart endpoint...');
    const cartResponse = await fetch(`${baseUrl}/api/food/cart`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!cartResponse.ok) {
      console.log(`❌ Cart API failed: ${cartResponse.status} ${cartResponse.statusText}`);
      return false;
    }
    
    const cartData = await cartResponse.json();
    console.log(`✅ Cart API responding`);
    console.log(`   Cart items: ${cartData.items?.length || 0}`);

    console.log('\n🎉 All API tests passed!');
    console.log('\nYour food delivery concierge is ready to use!');
    console.log('Try asking: "What healthy options are available right now?"');
    
    return true;

  } catch (error) {
    console.log('❌ API test failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure your development server is running:');
      console.log('   Run: npm run dev');
      console.log('   Then try this script again');
    }
    
    return false;
  }
}

// Run API tests
testFoodChatAPI()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Script error:', error);
    process.exit(1);
  });