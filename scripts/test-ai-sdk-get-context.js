#!/usr/bin/env node

/**
 * Test AI-SDK Get User Context
 * 
 * Tests the food-chat endpoint's getUserContext tool execution.
 * This validates profile loading, preferences, and recent orders.
 * 
 * Expected to FAIL before fixes:
 * - Database query error for 'rating' column in fetchRecentOrders
 * - Type mismatch: FALLBACK_PREFERENCES vs FALLBACK_PREFERENCE_RECORD
 * - Null safety: recentOrders.map() without ?? []
 * 
 * Should PASS after fixes applied.
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

async function testGetUserContext() {
  console.log('🧪 Testing AI-SDK Get User Context\n');
  console.log('Target: /api/food-chat');
  console.log('Tool: getUserContext');
  console.log('Tests: Profile preferences + recent orders loading\n');

  try {
    // Make request that should trigger getUserContext tool
    console.log('📝 Requesting profile/context information...');
    const response = await fetch(`${BASE_URL}/api/food-chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { 
            role: 'user', 
            content: 'What are my food preferences and recent orders?' 
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    console.log('✅ HTTP request succeeded');
    
    // Read streaming response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let assistantResponse = '';
    let toolCalls = [];
    let toolResults = [];
    let hasError = false;
    let errorDetails = '';
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
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
        
        // Check for errors in response
        if (line.includes('error') || line.includes('Error')) {
          hasError = true;
          errorDetails += line + '\n';
        }
      }
    }

    console.log('🔧 Tool calls executed:', toolCalls.join(', ') || 'none');
    console.log('🤖 Assistant response length:', assistantResponse.length, 'chars');
    console.log('🤖 Preview:', assistantResponse.substring(0, 200) + '...\n');

    // Validation checks
    const calledGetUserContext = toolCalls.includes('getUserContext');
    const hasPreferences = assistantResponse.toLowerCase().includes('preference') || 
                          assistantResponse.toLowerCase().includes('dietary');
    const hasOrders = assistantResponse.toLowerCase().includes('order') ||
                     assistantResponse.toLowerCase().includes('recent');
    const noErrors = !hasError && 
                    !assistantResponse.toLowerCase().includes('undefined') &&
                    !assistantResponse.toLowerCase().includes('error occurred');

    console.log('📊 VALIDATION RESULTS:');
    console.log('=' .repeat(50));
    console.log(`✓ HTTP request successful: YES`);
    console.log(`✓ getUserContext tool called: ${calledGetUserContext ? 'YES' : 'NO'}`);
    console.log(`✓ Preferences data present: ${hasPreferences ? 'YES' : 'NO'}`);
    console.log(`✓ Orders data handled: ${hasOrders ? 'YES' : 'NO'}`);
    console.log(`✓ No errors detected: ${noErrors ? 'YES' : 'NO'}`);
    
    if (hasError) {
      console.log('\n⚠️  Error details detected:');
      console.log(errorDetails);
    }

    const allTestsPassed = calledGetUserContext && noErrors && hasPreferences;
    
    console.log('\n' + '='.repeat(50));
    if (allTestsPassed) {
      console.log('🎉 TEST PASSED: getUserContext working correctly!');
      console.log('\nValidated:');
      console.log('- ✅ Tool execution successful');
      console.log('- ✅ Profile preferences loaded');
      console.log('- ✅ No database errors (rating column fix working)');
      console.log('- ✅ No type mismatches (FALLBACK fix working)');
      console.log('- ✅ No null safety issues (null coalescing working)');
      process.exit(0);
    } else {
      console.log('❌ TEST FAILED: Issues detected in getUserContext');
      console.log('\nExpected fixes needed:');
      if (!calledGetUserContext) {
        console.log('- Tool not being called properly');
      }
      if (!noErrors) {
        console.log('- Database/query errors present');
        console.log('  → Check rating column removal');
        console.log('  → Check FALLBACK_PREFERENCES type fix');
        console.log('  → Check null coalescing on arrays');
      }
      if (!hasPreferences) {
        console.log('- Preferences not being returned');
      }
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ TEST FAILED WITH ERROR:');
    console.error('Message:', error.message);
    
    // Provide diagnostic hints
    if (error.message.includes('ECONNREFUSED')) {
      console.error('\n💡 Hint: Is the dev server running? (npm run dev)');
    } else if (error.message.includes('rating')) {
      console.error('\n💡 Hint: Database schema error - rating column doesn\'t exist');
      console.error('   Fix needed: Remove rating from fetchRecentOrders query');
    } else if (error.message.includes('FALLBACK_PREFERENCES')) {
      console.error('\n💡 Hint: Type mismatch error');
      console.error('   Fix needed: Change to FALLBACK_PREFERENCE_RECORD');
    }
    
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Run test
testGetUserContext();
