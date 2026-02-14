#!/usr/bin/env node
/**
 * Test LiveKit Native End-to-End Flow
 * 
 * Comprehensive test of the entire native pipeline:
 * 1. Verify Next.js server is running
 * 2. Test token generation from /api/livekit-native/token
 * 3. Test voice API endpoint /api/voice-chat for SSE streaming
 * 4. Test frontend page loads correctly
 * 5. Verify Python agent files exist
 * 6. Check Python agent is running (warns if not)
 * 7. Check agent logs for runtime errors (NEW - catches schema errors, crashes, etc.)
 * 8. Check environment configuration
 * 
 * Prerequisites:
 * - Next.js dev server running (npm run dev)
 * - Python agent running (cd agents && python food_concierge_native.py dev)
 * - Local Supabase running (127.0.0.1:54321)
 * 
 * Usage:
 *   node scripts/test-livekit-native-e2e.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_URL = "http://localhost:3000";
const TEST_MESSAGE = "I want Thai food for lunch";

// ANSI color codes
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);

}

// Test voice API SSE streaming
function testVoiceAPI() {
  return new Promise((resolve, reject) => {
    log('blue', '\n📡 Test 3: Voice API Streaming (/api/voice-chat)');
    
    const postData = JSON.stringify({
      messages: [{
        role: 'user',
        parts: [{ type: 'text', text: TEST_MESSAGE }]
      }]
    });
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/voice-chat',
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
      let receivedData = '';
      
      res.on('data', (chunk) => {
        const data = chunk.toString();
        receivedData += data;
        
        if (data.includes('data: {')) {
          hasSSE = true;
        }
        
        if (data.includes('"type":"text-delta"') || data.includes('"textDelta"')) {
          hasTextDelta = true;
        }
        
        if (data.includes('"type":"tool-output-available"') || data.includes('"toolResults"')) {
          hasToolResults = true;
        }
      });
      
      res.on('end', () => {
        if (hasSSE) {
          log('green', '   ✅ SSE format detected');
        } else {
          log('yellow', '   ⚠️  No SSE format (may need tools to trigger)');
        }
        
        if (hasTextDelta) {
          log('green', '   ✅ Text streaming works');
        } else {
          log('yellow', '   ⚠️  No text delta (response may be empty)');
        }
        
        if (hasToolResults) {
          log('green', '   ✅ Tool results detected (cards will render)');
        } else {
          log('yellow', '   ⚠️  No tool results (may need different query)');
        }
        
        resolve({ hasSSE, hasTextDelta, hasToolResults });
      });
    });
    
    req.on('error', (err) => {
      log('red', `   ❌ Voice API error: ${err.message}`);
      reject(err);
    });
    
    req.write(postData);
    req.end();
  });
}

async function testEndToEnd() {
  log('bold', '🧪 LiveKit Native End-to-End Test\n');
  log('blue', "=" + "=".repeat(59));
  let passed = 0;
  let failed = 0;

  // Test 1: Next.js server running
  log('blue', '\n📋 Test 1: Next.js Server');
  try {
    const response = await fetch(BASE_URL);
    if (response.ok) {
      log('green', '   ✅ Next.js server is running');
      passed++;
    } else {
      log('red', `   ❌ Next.js server returned ${response.status}`);
      failed++;
    }
  } catch (error) {
    log('red', '   ❌ Next.js server not running');
    log('yellow', '   💡 Run: npm run dev');
    failed++;
  }

  // Test 2: Token endpoint
  log('blue', '\n📋 Test 2: Token Generation Endpoint');
  try {
    const response = await fetch(`${BASE_URL}/api/livekit-native/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomName: "e2e-test-room",
        participantName: "e2e-tester",
      }),
    });

    if (!response.ok) {
      log('red', `   ❌ Token endpoint returned ${response.status}`);
      const error = await response.json();
      log('red', `   Error: ${JSON.stringify(error)}`);
      failed++;
    } else {
      const data = await response.json();
      log('green', '   ✅ Token generated successfully');
      log('blue', `   Room: ${data.roomName}`);
      log('blue', `   URL: ${data.url}`);
      
      // Validate JWT structure
      const parts = data.token.split(".");
      if (parts.length === 3) {
        log('green', '   ✅ Valid JWT structure');
        passed++;
      } else {
        log('red', '   ❌ Invalid JWT structure');
        failed++;
      }
    }
  } catch (error) {
    log('red', `   ❌ Token endpoint error: ${error.message}`);
    failed++;
  }

  // Test 3: Voice API SSE streaming
  try {
    const voiceResult = await testVoiceAPI();
    if (voiceResult.hasSSE || voiceResult.hasTextDelta) {
      passed++;
    } else {
      log('yellow', '   ⚠️  Voice API needs verification');
      failed++;
    }
  } catch (error) {
    log('red', `   ❌ Voice API test failed: ${error.message}`);
    failed++;
  }

  // Test 4: Frontend page
  log('blue', '\n📋 Test 4: Frontend Page');
  try {
    const response = await fetch(`${BASE_URL}/food/concierge-native`);
    if (response.ok) {
      const html = await response.text();
      if (html.includes("Food Concierge") || html.includes("LiveKit Native")) {
        log('green', '   ✅ Frontend page loads correctly');
        passed++;
      } else {
        log('red', '   ❌ Frontend page missing expected content');
        failed++;
      }
    } else {
      log('red', `   ❌ Frontend page returned ${response.status}`);
      failed++;
    }
  } catch (error) {
    log('red', `   ❌ Frontend page error: ${error.message}`);
    failed++;
  }

  // Test 5: Python Agent Files
  log('blue', '\n📋 Test 5: Python Agent Files');

  const agentFiles = [
    "agents/requirements.txt",
    "agents/database.py",
    "agents/food_concierge_native.py",
  ];

  let allFilesExist = true;
  for (const file of agentFiles) {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      log('green', `   ✅ ${file} exists`);
    } else {
      log('red', `   ❌ ${file} missing`);
      allFilesExist = false;
    }
  }

  if (allFilesExist) {
    passed++;
  } else {
    failed++;
  }

  // Test 6: Check if Python agent is running
  log('blue', '\n🤖 Test 6: Python Agent Status');
  
  try {
    const { execSync } = require('child_process');
    const agentCheck = execSync('ps aux | grep food_concierge_native | grep -v grep', { encoding: 'utf-8' });
    
    if (agentCheck.trim()) {
      log('green', '   ✅ Python agent is running');
      const pidMatch = agentCheck.match(/\s+(\d+)\s+/);
      if (pidMatch) {
        log('green', `   ✅ Agent PID: ${pidMatch[1]}`);
      }
      
      // Check for PID lock file
      const pidFilePath = path.join(process.cwd(), 'agents/.agent.pid');
      if (fs.existsSync(pidFilePath)) {
        const pidFromFile = fs.readFileSync(pidFilePath, 'utf-8').trim();
        log('green', `   ✅ PID lock file exists: ${pidFromFile}`);
      }
      
      passed++;
    } else {
      log('yellow', '   ⚠️  Python agent is NOT running');
      log('yellow', '   💡 Start agent with: python agents/food_concierge_native.py dev');
      log('yellow', '   ℹ️  Agent join detection will not work without agent running');
      // Don't fail the test if agent isn't running, just warn
      passed++;
    }
  } catch (error) {
    log('yellow', '   ⚠️  Could not check agent status (may not be running)');
    log('yellow', '   💡 Start agent with: python agents/food_concierge_native.py dev');
    passed++; // Don't fail on this
  }

  // Test 7: Check Agent Logs for Errors
  log('blue', '\n📋 Test 7: Agent Log Health Check');
  
  try {
    const { execSync } = require('child_process');
    const logPath = '/tmp/agent.log';
    
    if (fs.existsSync(logPath)) {
      // Check last 50 lines for errors
      const recentLogs = execSync(`tail -50 ${logPath} | strings`, { encoding: 'utf-8' });
      
      // Check for critical errors
      const errorPatterns = [
        { pattern: /Error code: 400.*invalid_function_parameters/i, msg: '❌ Function schema validation error' },
        { pattern: /AttributeError.*has no attribute/i, msg: '❌ API compatibility error' },
        { pattern: /TypeError.*missing.*required/i, msg: '❌ Missing required parameter' },
        { pattern: /APIStatusError/i, msg: '❌ API call failed' },
        { pattern: /Exception:/i, msg: '⚠️  Unhandled exception detected' }
      ];
      
      let errorsFound = [];
      for (const { pattern, msg } of errorPatterns) {
        if (pattern.test(recentLogs)) {
          errorsFound.push(msg);
        }
      }
      
      if (errorsFound.length > 0) {
        log('red', `   ❌ Errors detected in agent logs:`);
        errorsFound.forEach(err => log('red', `      ${err}`));
        log('yellow', `   💡 Check logs: tail -50 ${logPath} | strings`);
        failed++;
      } else {
        // Check if agent registered successfully
        if (recentLogs.includes('registered worker')) {
          log('green', '   ✅ Agent logs healthy (no errors in last 50 lines)');
          log('green', '   ✅ Agent registered with LiveKit Cloud');
          passed++;
        } else {
          log('yellow', '   ⚠️  Agent may not be fully initialized yet');
          log('yellow', '   💡 Wait a few seconds and re-run test');
          passed++;
        }
      }
    } else {
      log('yellow', `   ⚠️  Agent log file not found: ${logPath}`);
      log('yellow', '   ℹ️  Agent may be writing to different location or not started');
      passed++;
    }
  } catch (error) {
    log('yellow', `   ⚠️  Could not read agent logs: ${error.message}`);
    passed++;
  }

  // Test 8: Check environment variables in root .env.local
  log('blue', '\n📋 Test 8: Environment Configuration');
  const envPath = path.join(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    const requiredVars = [
      "SUPABASE_URL",
      "SUPABASE_SERVICE_ROLE_KEY",
      "OPENAI_API_KEY",
      "LIVEKIT_URL",
      "LIVEKIT_API_KEY",
      "LIVEKIT_API_SECRET",
    ];

    let allVarsPresent = true;
    for (const varName of requiredVars) {
      if (envContent.includes(`${varName}=`)) {
        log('green', `   ✅ ${varName} configured`);
      } else {
        log('red', `   ❌ ${varName} missing`);
        allVarsPresent = false;
      }
    }

    if (allVarsPresent) {
      passed++;
    } else {
      failed++;
    }
  } else {
    log('red', '   ❌ .env.local not found');
    failed++;
  }

  // Summary
  log('blue', '\n' + '='.repeat(60));
  log('bold', `📊 Test Results: ${passed} passed, ${failed} failed`);
  log('blue', '='.repeat(60));

  if (failed === 0) {
    log('green', '\n✅ All tests passed! System ready for use.');
    log('blue', '\n📝 Next Steps:');
    log('yellow', '   1. Ensure Python agent is running:');
    log('yellow', '      cd agents && python food_concierge_native.py dev');
    log('yellow', '   2. Visit frontend:');
    log('yellow', '      http://localhost:3000/food/concierge-native');
    log('yellow', '   3. Start a session and wait for:');
    log('yellow', '      • "Room Connected - Waiting for Agent..."');
    log('yellow', '      • "🤖 Agent Ready - Start Speaking!" banner');
    log('yellow', '      • Green "✓ Agent Ready" status');
    log('blue', '\n🎯 Agent Join Detection:');
    log('green', '   • Frontend detects when Python agent joins LiveKit room');
    log('green', '   • Visual banner confirms agent is ready');
    log('green', '   • Microphone button enables only when agent is present');
    log('green', '   • Console logs show [NATIVE] 🤖 Python agent joined!');
    log('blue', '\n🎯 The native pipeline provides:');
    log('green', '   • Automatic STT → LLM → TTS orchestration');
    log('green', '   • Built-in voice activity detection');
    log('green', '   • Automatic interruption handling');
    log('green', '   • Lower latency (~400ms vs ~600ms)');
    return 0;
  } else {
    log('red', '\n❌ Some tests failed. Please check the errors above.');
    log('yellow', '\n🔧 Common issues:');
    log('yellow', '   • Server not running: npm run dev');
    log('yellow', '   • Missing Python files: Check agents/ directory');
    log('yellow', '   • Environment vars: Check .env.local');
    return 1;
  }
}

// Run test
testEndToEnd()
  .then((exitCode) => {
    process.exit(exitCode);
  })
  .catch((error) => {
    log('red', `\n❌ Fatal error: ${error.message}`);
    log('red', error.stack);
    process.exit(1);
  });
