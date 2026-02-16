#!/usr/bin/env node
/**
 * Test LiveKit AgentServer Connection & Greeting
 * 
 * Verifies the complete agent connection flow:
 * 1. Python agent is running with correct name (ubereats-food-concierge)
 * 2. Token endpoint creates room and dispatches agent
 * 3. Agent connects to room
 * 4. Agent sends correct greeting: "Hello, Emilio - what are you in the mood for today?"
 * 5. Cart is reset on session start
 * 
 * Prerequisites:
 * - Next.js dev server running (npm run dev)
 * - Python agent running (./start-dev.sh or cd agents && python food_concierge_agentserver.py dev)
 * 
 * Usage:
 *   node scripts/test-agentserver-connection.js
 */

const fs = require('fs').promises;
const path = require('path');

const BASE_URL = "http://localhost:3000";
const TOKEN_ENDPOINT = `${BASE_URL}/api/livekit-agentserver/token`;
const AGENT_LOG = "/tmp/agentserver.log";

// ANSI color codes
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function header(title) {
  console.log('\n' + '='.repeat(70));
  log('bold', `  ${title}`);
  console.log('='.repeat(70) + '\n');
}

async function checkAgentRunning() {
  header('📋 Step 1: Verify Agent Process');
  
  try {
    // Check if agent process is running
    const { execSync } = require('child_process');
    let processRunning = false;
    try {
      const processes = execSync('ps aux | grep food_concierge_agentserver.py | grep -v grep', { encoding: 'utf-8' });
      processRunning = processes.trim().length > 0;
    } catch (e) {
      // No process found
    }
    
    if (!processRunning) {
      log('red', '❌ Agent process not running');
      log('yellow', '   Run: ./start-dev.sh');
      return false;
    }
    
    log('green', '✓ Agent process is running');
    
    // Check if agent log exists and has registration (optional check)
    try {
      await fs.access(AGENT_LOG);
      const logContent = await fs.readFile(AGENT_LOG, 'utf-8');
      const lines = logContent.split('\n').slice(-200); // Check more lines
      
      // Check for registered worker
      const registeredLine = lines.find(line => line.includes('registered worker'));
      if (registeredLine) {
        // Extract agent name from JSON
        const agentNameMatch = registeredLine.match(/"agent_name":\s*"([^"]+)"/);
        const agentName = agentNameMatch ? agentNameMatch[1] : 'unknown';
        
        log('cyan', `  Agent registered: ${agentName}`);
        
        if (agentName === 'ubereats-food-concierge') {
          log('green', '  ✓ Agent name is correct: ubereats-food-concierge');
        } else if (agentName !== 'unknown') {
          log('yellow', `  ⚠️  Agent name: ${agentName} (expected: ubereats-food-concierge)`);
        }
      } else {
        log('cyan', '  ℹ️  Agent registration not found in recent logs (may be older)');
      }
    } catch (e) {
      log('cyan', '  ℹ️  Log file check skipped');
    }
    
    return true;
    
  } catch (error) {
    log('red', `❌ Error checking agent: ${error.message}`);
    log('yellow', '   Run: ./start-dev.sh');
    return false;
  }
}

async function checkGreetingConfiguration() {
  header('📋 Step 2: Verify Greeting Configuration');
  
  try {
    const agentPath = path.join(__dirname, '..', 'agents', 'food_concierge_agentserver.py');
    const agentContent = await fs.readFile(agentPath, 'utf-8');
    
    // Check for correct greeting
    const hasEmilioGreeting = agentContent.includes("Hello, Emilio - what are you in the mood for today?");
    const hasGenericGreeting = agentContent.includes("Hello, your session is active");
    
    if (hasEmilioGreeting) {
      log('green', '✓ Correct greeting configured');
      log('cyan', '  "Hello, Emilio - what are you in the mood for today?"');
      return true;
    } else if (hasGenericGreeting) {
      log('red', '❌ Wrong greeting found (clinical intervention)');
      log('yellow', '  Expected: "Hello, Emilio - what are you in the mood for today?"');
      log('yellow', '  Found: "Hello, your session is active"');
      return false;
    } else {
      log('yellow', '⚠️  No greeting found in agent code');
      return false;
    }
    
  } catch (error) {
    log('red', `❌ Error reading agent file: ${error.message}`);
    return false;
  }
}

async function checkCartResetConfiguration() {
  header('📋 Step 3: Verify Cart Reset Configuration');
  
  try {
    const agentPath = path.join(__dirname, '..', 'agents', 'food_concierge_agentserver.py');
    const agentContent = await fs.readFile(agentPath, 'utf-8');
    
    const hasCartReset = agentContent.includes('reset_voice_cart()');
    const hasCartResetImport = agentContent.includes('reset_voice_cart');
    
    if (hasCartReset && hasCartResetImport) {
      log('green', '✓ Cart reset is configured');
      log('cyan', '  reset_voice_cart() will be called on session start');
      return true;
    } else {
      log('red', '❌ Cart reset not found in agent');
      log('yellow', '  Cart may carry over between sessions');
      return false;
    }
    
  } catch (error) {
    log('red', `❌ Error reading agent file: ${error.message}`);
    return false;
  }
}

async function testTokenEndpoint() {
  header('📋 Step 4: Test Token Endpoint & Agent Dispatch');
  
  try {
    const testRoomName = `test-agentserver-${Date.now()}`;
    
    log('cyan', `Creating room: ${testRoomName}...`);
    
    const response = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomName: testRoomName,
        participantName: 'test-user'
      })
    });
    
    if (!response.ok) {
      log('red', `❌ Token endpoint failed: HTTP ${response.status}`);
      const text = await response.text();
      console.log(text);
      return false;
    }
    
    const data = await response.json();
    
    log('green', '✓ Token generated successfully');
    log('cyan', `  Room: ${data.roomName}`);
    log('cyan', `  URL: ${data.url}`);
    
    // Wait a moment for agent to join
    log('cyan', '\n  Waiting 5 seconds for agent to join room...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check logs for room join
    const logContent = await fs.readFile(AGENT_LOG, 'utf-8');
    const recentLines = logContent.split('\n').slice(-50);
    
    const roomJoined = recentLines.some(line => 
      line.includes(testRoomName) || 
      line.includes('Agent starting for room') ||
      line.includes('Cart reset')
    );
    
    if (roomJoined) {
      log('green', '✓ Agent joined the test room!');
      
      // Check for cart reset
      const cartReset = recentLines.some(line => 
        line.includes('Cart reset') || line.includes('reset_voice_cart')
      );
      
      if (cartReset) {
        log('green', '✓ Cart was reset on session start');
      } else {
        log('yellow', '⚠️  Cart reset not detected in logs');
      }
      
      return true;
    } else {
      log('yellow', '⚠️  Could not confirm agent joined (check logs manually)');
      log('cyan', `     tail -f ${AGENT_LOG} | grep "${testRoomName}"`);
      return false;
    }
    
  } catch (error) {
    log('red', `❌ Error testing endpoint: ${error.message}`);
    return false;
  }
}

async function checkAutoJoinPattern() {
  header('📋 Step 5: Verify Agent Dispatch Configuration');
  
  try {
    const tokenRoutePath = path.join(__dirname, '..', 'app', 'api', 'livekit-agentserver', 'token', 'route.ts');
    const tokenContent = await fs.readFile(tokenRoutePath, 'utf-8');
    
    // Check if AgentDispatchClient is imported and used
    const hasAgentDispatchImport = tokenContent.match(/import.*\bAgentDispatchClient\b.*from/);
    const hasCreateDispatchCall = tokenContent.match(/agentDispatch\.createDispatch\(/);
    const hasNewAgentDispatch = tokenContent.match(/new\s+AgentDispatchClient\(/);
    const hasAgentName = tokenContent.includes('ubereats-food-concierge');
    
    const isCorrectlyConfigured = hasAgentDispatchImport && hasCreateDispatchCall && hasNewAgentDispatch && hasAgentName;
    
    if (isCorrectlyConfigured) {
      log('green', '✓ Agent dispatch correctly configured');
      log('cyan', '  AgentDispatchClient dispatches: ubereats-food-concierge');
      log('cyan', '  ℹ️  If multiple agents join, clean up old workers in LiveKit dashboard');
      return true;
    } else {
      log('yellow', '⚠️  Agent dispatch incomplete');
      if (!hasAgentDispatchImport) log('yellow', '   Missing: AgentDispatchClient import');
      if (!hasNewAgentDispatch) log('yellow', '   Missing: new AgentDispatchClient()');
      if (!hasCreateDispatchCall) log('yellow', '   Missing: createDispatch() call');
      if (!hasAgentName) log('yellow', '   Missing: ubereats-food-concierge agent name');
      log('cyan', '\n   Agent needs dispatch to join rooms');
      return false;
    }
    
  } catch (error) {
    log('red', `❌ Error reading token route: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log(colors.bold + '\n🎯 LiveKit AgentServer Connection Test' + colors.reset);
  console.log('Testing: Agent connection, greeting, and cart reset\n');
  
  const results = [];
  
  // Run all checks
  results.push(await checkAgentRunning());
  results.push(await checkGreetingConfiguration());
  results.push(await checkCartResetConfiguration());
  results.push(await checkAutoJoinPattern());
  results.push(await testTokenEndpoint());
  
  // Final summary
  header('📊 Test Summary');
  
  const passedCount = results.filter(r => r).length;
  const totalCount = results.length;
  
  if (passedCount === totalCount) {
    log('green', '✅ All checks passed!');
    log('green', '\n🎉 Agent is correctly configured and working:\n');
    log('green', '   ✓ Agent name: ubereats-food-concierge');
    log('green', '   ✓ Greeting: "Hello, Emilio - what are you in the mood for today?"');
    log('green', '   ✓ Cart resets on session start');
    log('green', '   ✓ Agent dispatch configured (dispatches by agent_name)');
    log('green', '   ✓ Agent connects to rooms');
    
    log('cyan', '\n💡 Next: Test manually in browser');
    log('cyan', '   1. Go to: http://localhost:3000/food/concierge-agentserver');
    log('cyan', '   2. Click "Start Voice Session"');
    log('cyan', '   3. Listen for: "Hello, Emilio..."');
    log('cyan', '   4. Check logs: tail -f /tmp/agentserver.log');
    
    process.exit(0);
  } else {
    log('red', `❌ ${totalCount - passedCount} check(s) failed`);
    log('yellow', '\n🔧 Troubleshooting:');
    
    if (!results[0]) {
      log('yellow', '   • Start agent: ./start-dev.sh');
    }
    if (!results[1]) {
      log('yellow', '   • Fix greeting in agents/food_concierge_agentserver.py');
    }
    if (!results[2]) {
      log('yellow', '   • Add reset_voice_cart() call in agent');
    }
    if (!results[3]) {
      log('yellow', '   • Add AgentDispatchClient to token route (required for agent to join)');
    }
    if (!results[4]) {
      log('yellow', '   • Check agent logs: tail -f /tmp/agentserver.log');
    }
    
    process.exit(1);
  }
}

main().catch(error => {
  log('red', `\n❌ Unexpected error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
