#!/usr/bin/env node

/**
 * Test script to validate LiveKit streaming SSE parsing
 * Tests that /api/food-chat returns streaming format that LiveKit can parse
 */

const http = require('http');

const API_BASE = 'http://localhost:3000';

// Test message that should trigger restaurant search
const TEST_MESSAGE = "I want Thai food";

async function testStreamingSSE() {
  console.log('🧪 Testing LiveKit SSE Streaming Parser...\n');
  
  try {
    const response = await fetch(`${API_BASE}/api/food-chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: TEST_MESSAGE }]
      })
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    console.log(`✅ API Response Status: ${response.status}`);
    console.log(`✅ Content-Type: ${response.headers.get('content-type')}`);
    
    let textAccumulated = '';
    let toolResultsFound = [];
    let streamChunks = 0;

    if (response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      console.log('\\n📖 Reading SSE Stream:');
      console.log('----------------------------------------');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        streamChunks++;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.textDelta) {
                textAccumulated += data.textDelta;
                console.log(`📝 Text Delta: "${data.textDelta}"`);
              }
              
              if (data.toolResults && Array.isArray(data.toolResults)) {
                console.log(`🔧 Tool Results (${data.toolResults.length} found):`);
                for (const toolResult of data.toolResults) {
                  console.log(`   - ${toolResult.toolName}: ${toolResult.result?.slice(0, 100)}...`);
                  toolResultsFound.push({
                    toolName: toolResult.toolName,
                    hasResult: !!toolResult.result
                  });
                }
              }
              
            } catch (parseError) {
              console.error(`❌ Parse Error: ${parseError.message}`);
              console.log(`   Line: ${line}`);
            }
          }
        }
      }
      
      console.log('----------------------------------------');
      console.log('\\n📊 Test Results:');
      console.log(`   Stream Chunks: ${streamChunks}`);
      console.log(`   Accumulated Text: ${textAccumulated.length} chars`);
      console.log(`   Tool Results Found: ${toolResultsFound.length}`);
      
      if (textAccumulated.length > 0) {
        console.log(`✅ Text Response: "${textAccumulated.slice(0, 200)}${textAccumulated.length > 200 ? '...' : ''}"`);
      }
      
      if (toolResultsFound.length > 0) {
        console.log('✅ Tool Results:');
        toolResultsFound.forEach(tool => {
          console.log(`   - ${tool.toolName}: ${tool.hasResult ? 'Has Data' : 'No Data'}`);
        });
      }
      
      // Validation checks
      let passed = 0;
      let total = 4;
      
      console.log('\\n🔍 Validation Checks:');
      
      if (streamChunks > 0) {
        console.log('✅ 1. Stream chunks received');
        passed++;
      } else {
        console.log('❌ 1. No stream chunks received');
      }
      
      if (textAccumulated.length > 0) {
        console.log('✅ 2. Text response accumulated');
        passed++;
      } else {
        console.log('❌ 2. No text response accumulated');
      }
      
      if (toolResultsFound.length > 0) {
        console.log('✅ 3. Tool results parsed');
        passed++;
      } else {
        console.log('❌ 3. No tool results found');
      }
      
      const expectedTools = ['searchRestaurants', 'getRestaurantMenu']; // Thai food should trigger these
      const foundToolNames = toolResultsFound.map(t => t.toolName);
      const hasExpectedTool = expectedTools.some(tool => foundToolNames.includes(tool));
      
      if (hasExpectedTool) {
        console.log('✅ 4. Expected tool results found');
        passed++;
      } else {
        console.log(`❌ 4. Expected tools not found (expected one of: ${expectedTools.join(', ')})`);
      }
      
      console.log(`\\n📈 Overall Result: ${passed}/${total} checks passed`);
      
      if (passed === total) {
        console.log('🎉 ALL TESTS PASSED! LiveKit SSE parsing should work correctly.');
        process.exit(0);
      } else {
        console.log('⚠️  Some tests failed. LiveKit may not parse streaming correctly.');
        process.exit(1);
      }
      
    } else {
      throw new Error('No response body received');
    }
    
  } catch (error) {
    console.error('❌ Test Failed:', error.message);
    console.log('\\n💡 Make sure the dev server is running: npm run dev');
    console.log('💡 Check that Supabase environment variables are set');
    process.exit(1);
  }
}

// Simple connectivity test first
async function testConnectivity() {
  console.log('🔍 Testing API connectivity...');
  
  try {
    const response = await fetch(`${API_BASE}/api/food-chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'hello' }]
      })
    });
    
    console.log(`✅ Server reachable: ${response.status}`);
    return true;
  } catch (error) {
    console.log(`❌ Server not reachable: ${error.message}`);
    return false;
  }
}

// Run tests
async function main() {
  console.log('🚀 LiveKit SSE Streaming Test\\n');
  
  const isConnected = await testConnectivity();
  if (!isConnected) {
    console.log('\\n❌ Cannot connect to server. Make sure to run: npm run dev');
    process.exit(1);
  }
  
  console.log('');
  await testStreamingSSE();
}

main().catch(console.error);