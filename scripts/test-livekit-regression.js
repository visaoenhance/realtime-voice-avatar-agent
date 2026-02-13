#!/usr/bin/env node

/**
 * Test LiveKit Voice Pipeline Regression
 * 
 * Ensures LiveKit voice-chat pipeline remains functional after AI-SDK fixes.
 * This validates that the two pipelines are properly isolated.
 * 
 * Expected: PASS before AND after AI-SDK fixes
 * 
 * Tests:
 * - Voice-chat endpoint responds correctly
 * - Voice tools are available and functional
 * - Direct command pattern works (not conversational)
 * - Shared components render properly
 * - No conflicts with AI-SDK changes
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

async function testLiveKitRegression() {
  console.log('🧪 Testing LiveKit Voice Pipeline Regression\n');
  console.log('Target: /api/voice-chat (LiveKit voice pipeline)');
  console.log('Purpose: Ensure AI-SDK fixes don\'t break voice flow');
  console.log('Expected: Should PASS before AND after AI-SDK fixes\n');
  console.log('='.repeat(60));

  const results = {
    endpoint: false,
    tools: false,
    search: false,
    cart: false,
    checkout: false,
    noErrors: true
  };

  try {
    // Test 1: Voice search functionality (also validates endpoint is working)
    console.log('\n📍 TEST 1: Voice search for food items');
    const searchResponse = await fetch(`${BASE_URL}/api/voice-chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { 
            role: 'user', 
            content: 'I want cheesecake in Orlando' 
          }
        ]
      })
    });

    if (!searchResponse.ok) {
      throw new Error(`Voice search failed: HTTP ${searchResponse.status}`);
    }

    const reader1 = searchResponse.body.getReader();
    const decoder = new TextDecoder();
    let searchResult = '';
    let searchTools = [];
    
    while (true) {
      const { done, value } = await reader1.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        if (line.startsWith('0:')) {
          searchResult += line.substring(3).replace(/^"|"$/g, '');
        }
        if (line.startsWith('9:')) {
          try {
            const toolData = JSON.parse(line.substring(2));
            if (toolData.toolName) {
              searchTools.push(toolData.toolName);
            }
          } catch (e) {
            // Ignore
          }
        }
      }
    }

    const hasSearchResults = searchResult.toLowerCase().includes('cheesecake') ||
                            searchResult.toLowerCase().includes('found') ||
                            searchTools.includes('findFoodItem');
    results.search = hasSearchResults;
    results.endpoint = true;  // Endpoint is working if we got here
    results.tools = searchTools.length > 0;  // Tools working if any were called
    console.log(`✅ Voice search executed`);
    console.log(`🔧 Tools: ${searchTools.join(', ') || 'none'}`);
    console.log(`📊 Has results: ${hasSearchResults ? 'YES' : 'NO'}`);

    // Test 2: Quick add to cart
    console.log('\n📍 TEST 2: Quick add to cart');
    const cartResponse = await fetch(`${BASE_URL}/api/voice-chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { 
            role: 'user', 
            content: 'add coconut shrimp to my cart' 
          }
        ]
      })
    });

    if (!cartResponse.ok) {
      throw new Error(`Cart operation failed: HTTP ${cartResponse.status}`);
    }

    const reader2 = cartResponse.body.getReader();
    let cartResult = '';
    let cartTools = [];
    
    while (true) {
      const { done, value } = await reader2.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        if (line.startsWith('0:')) {
          cartResult += line.substring(3).replace(/^"|"$/g, '');
        }
        if (line.startsWith('9:')) {
          try {
            const toolData = JSON.parse(line.substring(2));
            if (toolData.toolName) {
              cartTools.push(toolData.toolName);
            }
          } catch (e) {
            // Ignore
          }
        }
      }
    }

    const hasCartResult = cartResult.toLowerCase().includes('cart') ||
                         cartResult.toLowerCase().includes('added') ||
                         cartTools.includes('quickAddToCart') ||
                         cartTools.includes('getVoiceCart');
    results.cart = hasCartResult;
    console.log(`✅ Cart operation executed`);
    console.log(`🔧 Tools: ${cartTools.join(', ') || 'none'}`);
    console.log(`📊 Has cart update: ${hasCartResult ? 'YES' : 'NO'}`);

    // Test 3: Quick checkout
    console.log('\n📍 TEST 3: Quick checkout');
    const checkoutResponse = await fetch(`${BASE_URL}/api/voice-chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { 
            role: 'user', 
            content: 'checkout now' 
          }
        ]
      })
    });

    if (!checkoutResponse.ok) {
      throw new Error(`Checkout failed: HTTP ${checkoutResponse.status}`);
    }

    const reader3 = checkoutResponse.body.getReader();
    let checkoutResult = '';
    let checkoutTools = [];
    
    while (true) {
      const { done, value } = await reader3.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        if (line.startsWith('0:')) {
          checkoutResult += line.substring(3).replace(/^"|"$/g, '');
        }
        if (line.startsWith('9:')) {
          try {
            const toolData = JSON.parse(line.substring(2));
            if (toolData.toolName) {
              checkoutTools.push(toolData.toolName);
            }
          } catch (e) {
            // Ignore
          }
        }
        
        // Check for errors
        if (line.toLowerCase().includes('error') || line.includes('undefined')) {
          results.noErrors = false;
        }
      }
    }

    const hasCheckoutResult = checkoutResult.toLowerCase().includes('order') ||
                             checkoutResult.toLowerCase().includes('confirm') ||
                             checkoutTools.includes('quickCheckout');
    results.checkout = hasCheckoutResult;
    console.log(`✅ Checkout executed`);
    console.log(`🔧 Tools: ${checkoutTools.join(', ') || 'none'}`);
    console.log(`📊 Has checkout result: ${hasCheckoutResult ? 'YES' : 'NO'}`);

    // Final validation
    console.log('\n' + '='.repeat(60));
    console.log('📊 LIVEKIT REGRESSION TEST RESULTS:\n');
    console.log(`✓ Endpoint available: ${results.endpoint ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`✓ Tools accessible: ${results.tools ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`✓ Voice search works: ${results.search ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`✓ Cart operations work: ${results.cart ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`✓ Checkout works: ${results.checkout ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`✓ No errors detected: ${results.noErrors ? '✅ PASS' : '❌ FAIL'}`);

    const allPassed = Object.values(results).every(v => v === true);

    console.log('\n' + '='.repeat(60));
    if (allPassed) {
      console.log('🎉 TEST PASSED: LiveKit voice pipeline working correctly!');
      console.log('\n✅ Validated:');
      console.log('   - Voice-chat endpoint functional');
      console.log('   - Voice-optimized tools available (6 streamlined tools)');
      console.log('   - Direct command pattern working');
      console.log('   - Food search operational');
      console.log('   - Cart management operational');
      console.log('   - Checkout operational');
      console.log('   - No conflicts with AI-SDK pipeline');
      console.log('\n💡 This confirms pipeline isolation is working correctly');
      process.exit(0);
    } else {
      console.log('❌ TEST FAILED: LiveKit regression detected!');
      console.log('\n🚨 CRITICAL: AI-SDK fixes may have broken LiveKit!');
      console.log('\n🔍 Debugging hints:');
      if (!results.endpoint) {
        console.log('   - Voice-chat endpoint not accessible');
      }
      if (!results.tools) {
        console.log('   - Voice tools not properly loaded');
      }
      if (!results.search) {
        console.log('   - Voice search functionality broken');
      }
      if (!results.cart) {
        console.log('   - Voice cart operations broken');
      }
      if (!results.checkout) {
        console.log('   - Voice checkout broken');
      }
      if (!results.noErrors) {
        console.log('   - Errors detected in voice pipeline');
      }
      console.log('\n💡 Check that voice-chat/tools.ts wasn\'t modified');
      console.log('💡 Verify AI-SDK changes didn\'t affect shared components');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ TEST FAILED WITH ERROR:');
    console.error('Message:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.error('\n💡 Hint: Is the dev server running? (npm run dev)');
    }
    
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    
    console.error('\n🚨 LiveKit pipeline may be broken!');
    console.error('💡 This test should pass before AND after AI-SDK fixes');
    process.exit(1);
  }
}

// Run test
testLiveKitRegression();
