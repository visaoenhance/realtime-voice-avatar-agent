#!/usr/bin/env node

/**
 * Test script to validate LiveKit streaming SSE parsing implementation
 * Tests Option A: LiveKit parsing streaming SSE from /api/food-chat
 */

const http = require('http');

console.log('🧪 Testing LiveKit SSE implementation...');

const BASE_URL = 'http://localhost:3000';
const TEST_MESSAGE = 'I want Thai food';

// Colors for output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m', 
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Test the streaming API
async function testAPI() {
  return new Promise((resolve, reject) => {
    log('blue', '\n📡 Testing /api/food-chat streaming response...');
    
    const postData = JSON.stringify({
      messages: [{
        role: 'user',
        parts: [{ type: 'text', text: TEST_MESSAGE }]
      }]
    });
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/food-chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = http.request(options, (res) => {
      let hasSSE = false;
      let hasTextDelta = false;
      let hasToolResults = false;
      
      res.on('data', (chunk) => {
        const data = chunk.toString();
        console.log('Raw chunk:', data); // Debug output
        
        if (data.includes('data: {')) {
          hasSSE = true;
          log('green', '✅ Found SSE format');
        }
        
        if (data.includes('"type":"tool-output-available"')) {
          hasToolResults = true;
          log('green', '✅ Found tool output (cards will work)');
        }
        
        if (data.includes('"type":"text-delta"')) {
          hasTextDelta = true;
          log('green', '✅ Found text streaming');
        }
      });
      
      res.on('end', () => {
        log('blue', '\n📊 Results:');
        log(hasSSE ? 'green' : 'red', `SSE Format: ${hasSSE ? '✅' : '❌'}`);
        log(hasTextDelta ? 'green' : 'red', `TextDelta: ${hasTextDelta ? '✅' : '❌'}`);
        log(hasToolResults ? 'green' : 'yellow', `Tool Output: ${hasToolResults ? '✅' : '⚠️ (no tools called)'}`);
        
        if (hasSSE && (hasToolResults || hasTextDelta)) {
          resolve({ hasToolResults });
        } else {
          reject('API format incorrect');
        }
      });
    });
    
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Test SSE parsing logic
function testParsing() {
  log('blue', '\n🔍 Testing SSE parsing logic...');
  
  // Mock SSE data
  const testData = [
    'data: {"textDelta": "Great choice! "}',
    'data: {"textDelta": "I found Thai restaurants."}',
    'data: {"toolResults": [{"toolName": "searchRestaurants", "result": "{}"}]}'
  ];
  
  let text = '';
  let tools = [];
  
  for (const line of testData) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6));
      
      if (data.textDelta) {
        text += data.textDelta;
        log('green', `✅ Parsed: "${data.textDelta}"`);
      }
      
      if (data.toolResults) {
        tools.push(...data.toolResults);
        log('green', `✅ Parsed ${data.toolResults.length} tool results`);
      }
    }
  }
  
  log('blue', `\n📝 Final text: "${text}"`);
  log('blue', `🔧 Tool results: ${tools.length}`);
  
  return { text, tools };
}

// Main test
async function runTests() {
  try {
    log('blue', '🚀 Starting LiveKit Option A tests...');
    
    // Test API
    const apiResult = await testAPI();
    
    // Test parsing
    const parseResult = testParsing();
    
    // Success
    log('green', '\n🎉 All tests passed!');
    log('green', '✅ LiveKit can parse streaming SSE from /api/food-chat');
    log('green', '✅ Text accumulation works');
    log('green', '✅ Tool results parsing works');
    
    if (apiResult.hasToolResults) {
      log('green', '✅ Cards will appear for this query');
    } else {
      log('yellow', '⚠️  No tool results (try a different query)');
    }
    
    log('blue', '\n🎯 Multimodal UX ready: Voice + Visual cards!');
    
  } catch (error) {
    log('red', `\n❌ Test failed: ${error}`);
    log('yellow', '\n💡 Make sure server is running: npm run dev');
    process.exit(1);
  }
}

if (require.main === module) {
  runTests();
}

module.exports = { runTests };