#!/usr/bin/env node

/**
 * Test AI-SDK Orlando Restaurant Search
 * 
 * Tests the food-chat endpoint's ability to search for restaurants in Orlando.
 * This validates the baseline broken state and will confirm when fixes work.
 * 
 * Expected to FAIL before fixes:
 * - Database query error for 'rating' column
 * - Null/undefined errors in getUserContext
 * - Type mismatches in preferences
 * 
 * Should PASS after fixes applied.
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

async function testOrlandoSearch() {
  console.log('🧪 Testing AI-SDK Orlando Restaurant Search\n');
  console.log('Target: /api/food-chat');
  console.log('Flow: User asks for food → Assistant requests city → User says Orlando\n');

  try {
    // Step 1: Initial request - "can you help me find something to eat"
    console.log('📝 Step 1: User asks for help finding food...');
    const response1 = await fetch(`${BASE_URL}/api/food-chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { 
            id: `msg-${Date.now()}-1`,
            role: 'user', 
            content: 'can you help me find something to eat?' 
          }
        ]
      })
    });

    if (!response1.ok) {
      throw new Error(`HTTP ${response1.status}: ${response1.statusText}`);
    }

    console.log('✅ Initial request succeeded');
    
    // Read streaming response
    const reader1 = response1.body.getReader();
    const decoder = new TextDecoder();
    let assistantResponse1 = '';
    
    while (true) {
      const { done, value } = await reader1.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.substring(6));
            if (data.type === 'text-delta' && data.textDelta) {
              assistantResponse1 += data.textDelta;
            } else if (data.type === 'text' && data.text) {
              assistantResponse1 += data.text;
            }
          } catch (e) { /* Ignore parse errors */ }
        }
      }
    }

    console.log('🤖 Assistant response preview:', assistantResponse1.substring(0, 150) + '...\n');

    // Step 2: Follow-up request - "I'm in Orlando"
    console.log('📝 Step 2: User specifies Orlando as location...');
    const response2 = await fetch(`${BASE_URL}/api/food-chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { 
            id: `msg-${Date.now()}-1`,
            role: 'user', 
            content: 'can you help me find something to eat?' 
          },
          {
            id: `msg-${Date.now()}-2`,
            role: 'assistant',
            content: assistantResponse1
          },
          {
            id: `msg-${Date.now()}-3`,
            role: 'user',
            content: "I'm in Orlando"
          }
        ]
      })
    });

    if (!response2.ok) {
      throw new Error(`HTTP ${response2.status}: ${response2.statusText}`);
    }

    const reader2 = response2.body.getReader();
    let assistantResponse2 = '';
    let toolCalls = [];
    
    while (true) {
      const { done, value } = await reader2.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.substring(6));
            if (data.type === 'text-delta' && data.textDelta) {
              assistantResponse2 += data.textDelta;
            } else if (data.type === 'text' && data.text) {
              assistantResponse2 += data.text;
            }
            if (data.type === 'tool-input-start' && data.toolName) {
              toolCalls.push(data.toolName);
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    }

    console.log('✅ Orlando search request succeeded');
    console.log('🔧 Tool calls detected:', toolCalls.join(', ') || 'none');
    console.log('🤖 Assistant response preview:', assistantResponse2.substring(0, 150) + '...\n');

    // Validation
    const hasRestaurants = assistantResponse2.toLowerCase().includes('restaurant') || 
                          assistantResponse2.toLowerCase().includes('orlando');
    const hasErrors = assistantResponse2.toLowerCase().includes('error') ||
                     assistantResponse2.toLowerCase().includes('undefined');

    console.log('\n📊 VALIDATION RESULTS:');
    console.log('=' .repeat(50));
    console.log(`✓ HTTP requests successful: YES`);
    console.log(`✓ Tool calls executed: ${toolCalls.length > 0 ? 'YES' : 'NO'}`);
    console.log(`✓ Restaurant data present: ${hasRestaurants ? 'YES' : 'NO'}`);
    console.log(`✓ No error messages: ${!hasErrors ? 'YES' : 'NO'}`);
    
    const allTestsPassed = toolCalls.length > 0 && hasRestaurants && !hasErrors;
    
    console.log('\n' + '='.repeat(50));
    if (allTestsPassed) {
      console.log('🎉 TEST PASSED: AI-SDK Orlando search working correctly!');
      process.exit(0);
    } else {
      console.log('❌ TEST FAILED: Issues detected in Orlando search');
      console.log('\nExpected behavior:');
      console.log('- Should call searchRestaurants tool');
      console.log('- Should return Orlando restaurant results');
      console.log('- Should not contain error messages');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ TEST FAILED WITH ERROR:');
    console.error('Message:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Run test
testOrlandoSearch();
