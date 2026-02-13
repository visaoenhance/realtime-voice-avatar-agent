#!/usr/bin/env node

/**
 * Test AI-SDK End-to-End Conversational Flow
 * 
 * Tests the complete multi-turn conversation flow for AI-SDK food ordering.
 * This is the exploratory, conversational experience (vs LiveKit's direct commands).
 * 
 * Conversation Flow:
 * 1. User: "can you help me find something to eat"
 * 2. Assistant: shows profile, asks for city
 * 3. User: "I'm in Orlando"
 * 4. Assistant: shows nearby restaurants
 * 5. User: "lets look at the menu for Island Breeze"
 * 6. Assistant: shows Island Breeze menu
 * 7. User: "I'd like coconut shrimp and jerk chicken added to cart"
 * 8. Assistant: shows cart, asks to confirm order
 * 9. User: "yes, lets place order"
 * 10. Assistant: shows completed order confirmation
 * 
 * This should NOT affect LiveKit flow (isolated pipeline).
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

class ConversationTester {
  constructor() {
    this.messages = [];
    this.decoder = new TextDecoder();
  }

  async sendMessage(userMessage) {
    console.log(`\n👤 User: "${userMessage}"`);
    
    this.messages.push({
      role: 'user',
      content: userMessage
    });

    const response = await fetch(`${BASE_URL}/api/food-chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: this.messages
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const reader = response.body.getReader();
    let assistantResponse = '';
    let toolCalls = [];
    let hasError = false;
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = this.decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        // Text content
        if (line.startsWith('0:')) {
          const text = line.substring(3).replace(/^"|"$/g, '');
          assistantResponse += text;
        }
        
        // Tool calls
        if (line.startsWith('9:')) {
          try {
            const toolData = JSON.parse(line.substring(2));
            if (toolData.toolName) {
              toolCalls.push(toolData.toolName);
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
        
        // Check for errors
        if (line.toLowerCase().includes('error') || line.includes('undefined')) {
          hasError = true;
        }
      }
    }

    // Add assistant response to conversation history
    this.messages.push({
      role: 'assistant',
      content: assistantResponse
    });

    console.log(`🤖 Assistant: ${assistantResponse.substring(0, 150)}...`);
    if (toolCalls.length > 0) {
      console.log(`🔧 Tools used: ${toolCalls.join(', ')}`);
    }

    return {
      text: assistantResponse,
      toolCalls,
      hasError
    };
  }

  reset() {
    this.messages = [];
  }
}

async function testEndToEndFlow() {
  console.log('🧪 Testing AI-SDK End-to-End Conversational Flow\n');
  console.log('Target: /api/food-chat (AI-SDK text chat)');
  console.log('Mode: Multi-turn exploratory conversation');
  console.log('Isolation: Should NOT affect LiveKit voice-chat pipeline\n');
  console.log('='.repeat(60));

  const tester = new ConversationTester();
  const validationResults = {
    step1: false,
    step2: false,
    step3: false,
    step4: false,
    step5: false,
    noErrors: true
  };

  try {
    // Step 1: Initial request - find food
    console.log('\n📍 STEP 1: User asks for help finding food');
    const response1 = await tester.sendMessage('can you help me find something to eat');
    validationResults.step1 = response1.text.length > 0;
    validationResults.noErrors = validationResults.noErrors && !response1.hasError;

    // Step 2: Specify location - Orlando
    console.log('\n📍 STEP 2: User specifies Orlando as location');
    const response2 = await tester.sendMessage("I'm in Orlando");
    const hasRestaurants = response2.toolCalls.includes('searchRestaurants') ||
                          response2.text.toLowerCase().includes('restaurant') ||
                          response2.text.toLowerCase().includes('orlando');
    validationResults.step2 = hasRestaurants;
    validationResults.noErrors = validationResults.noErrors && !response2.hasError;

    // Step 3: Request specific restaurant menu
    console.log('\n📍 STEP 3: User asks for Island Breeze menu');
    const response3 = await tester.sendMessage("lets look at the menu for Island Breeze");
    const hasMenu = response3.toolCalls.includes('getRestaurantMenu') ||
                   response3.toolCalls.includes('searchMenuItems') ||
                   response3.text.toLowerCase().includes('menu') ||
                   response3.text.toLowerCase().includes('island breeze');
    validationResults.step3 = hasMenu;
    validationResults.noErrors = validationResults.noErrors && !response3.hasError;

    // Step 4: Add items to cart
    console.log('\n📍 STEP 4: User adds coconut shrimp and jerk chicken to cart');
    const response4 = await tester.sendMessage("I'd like the coconut shrimp and jerk chicken to be added to my cart");
    const hasCart = response4.toolCalls.includes('addToCart') ||
                   response4.toolCalls.includes('viewCart') ||
                   response4.text.toLowerCase().includes('cart') ||
                   response4.text.toLowerCase().includes('added');
    validationResults.step4 = hasCart;
    validationResults.noErrors = validationResults.noErrors && !response4.hasError;

    // Step 5: Place order
    console.log('\n📍 STEP 5: User confirms and places order');
    const response5 = await tester.sendMessage("yes, lets place the order");
    const hasOrder = response5.toolCalls.includes('checkout') ||
                    response5.toolCalls.includes('placeOrder') ||
                    response5.text.toLowerCase().includes('order') ||
                    response5.text.toLowerCase().includes('confirmed') ||
                    response5.text.toLowerCase().includes('placed');
    validationResults.step5 = hasOrder;
    validationResults.noErrors = validationResults.noErrors && !response5.hasError;

    // Final validation
    console.log('\n' + '='.repeat(60));
    console.log('📊 END-TO-END FLOW VALIDATION RESULTS:\n');
    console.log(`✓ Step 1 (Initial request): ${validationResults.step1 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`✓ Step 2 (Orlando search): ${validationResults.step2 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`✓ Step 3 (Menu request): ${validationResults.step3 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`✓ Step 4 (Add to cart): ${validationResults.step4 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`✓ Step 5 (Place order): ${validationResults.step5 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`✓ No errors throughout: ${validationResults.noErrors ? '✅ PASS' : '❌ FAIL'}`);

    const allPassed = Object.values(validationResults).every(v => v === true);

    console.log('\n' + '='.repeat(60));
    if (allPassed) {
      console.log('🎉 TEST PASSED: Complete AI-SDK conversational flow working!');
      console.log('\n✅ Validated:');
      console.log('   - Multi-turn conversation context maintained');
      console.log('   - Restaurant search in Orlando');
      console.log('   - Menu browsing for specific restaurant');
      console.log('   - Cart management');
      console.log('   - Order placement');
      console.log('   - No errors or undefined values');
      console.log('\n💡 This exploratory flow is isolated from LiveKit direct commands');
      process.exit(0);
    } else {
      console.log('❌ TEST FAILED: Issues detected in conversational flow');
      console.log('\n🔍 Debugging hints:');
      if (!validationResults.step1) {
        console.log('   - Step 1: Initial response failed');
      }
      if (!validationResults.step2) {
        console.log('   - Step 2: Restaurant search not working (check getUserContext + searchRestaurants)');
      }
      if (!validationResults.step3) {
        console.log('   - Step 3: Menu browsing not working (check getRestaurantMenu)');
      }
      if (!validationResults.step4) {
        console.log('   - Step 4: Cart functionality not working (check addToCart)');
      }
      if (!validationResults.step5) {
        console.log('   - Step 5: Order placement not working (check checkout)');
      }
      if (!validationResults.noErrors) {
        console.log('   - Errors detected: Check console logs for undefined/error messages');
        console.log('   - Common issues: rating column, type mismatches, null safety');
      }
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ TEST FAILED WITH ERROR:');
    console.error('Message:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.error('\n💡 Hint: Is the dev server running? (npm run dev)');
    } else if (error.message.includes('rating')) {
      console.error('\n💡 Hint: Database schema error - fix rating column issue');
    }
    
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Run test
testEndToEndFlow();
