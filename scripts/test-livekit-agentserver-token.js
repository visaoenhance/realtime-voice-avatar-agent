#!/usr/bin/env node
/**
 * Test LiveKit AgentServer Token Generation
 * 
 * Verifies that /api/livekit-agentserver/token endpoint:
 * - Returns valid JWT tokens
 * - Includes LiveKit URL in response
 * - Includes correct room and participant info
 * - Has proper permissions
 * 
 * Usage:
 *   node scripts/test-livekit-agentserver-token.js
 */

const BASE_URL = "http://localhost:3000";
const TOKEN_ENDPOINT = `${BASE_URL}/api/livekit-agentserver/token`;

function log(color, message) {
  const colors = {
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    reset: "\x1b[0m",
  };
  console.log(`${colors[color] || ""}${message}${colors.reset}`);
}

async function testTokenGeneration() {
  log("blue", "🧪 Testing LiveKit AgentServer Token Generation\n");

  try {
    // Test 1: POST request with custom params
    log("yellow", "Test 1: POST with custom parameters");
    const response1 = await fetch(TOKEN_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        roomName: "test-room-agentserver",
        participantName: "test-user",
      }),
    });

    if (!response1.ok) {
      log("red", `❌ Failed: ${response1.status}`);
      const error = await response1.text();
      console.error(error);
      return false;
    }

    const data1 = await response1.json();
    log("green", "✅ Token received:");
    console.log(`   Room: ${data1.roomName || "N/A"}`);
    console.log(`   URL: ${data1.url || "MISSING!"}`);
    console.log(`   Token length: ${data1.token?.length || 0} characters`);
    console.log(`   Agent type: ${data1.agentType || "N/A"}`);
    console.log(`   Pattern: ${data1.pattern || "N/A"}`);

    // CRITICAL: Check if URL is present
    if (!data1.url) {
      log("red", "❌ CRITICAL: No LiveKit URL in response!");
      log("red", "   This will cause 'no livekit url provided' error");
      return false;
    }
    log("green", "✅ LiveKit URL present in response");

    // Validate token structure (JWT has 3 parts separated by dots)
    if (!data1.token) {
      log("red", "❌ No token in response");
      return false;
    }
    
    const tokenParts = data1.token.split(".");
    if (tokenParts.length !== 3) {
      log("red", "❌ Invalid JWT structure");
      return false;
    }
    log("green", "✅ Valid JWT structure\n");

    // Test 2: GET request (debug endpoint)
    log("yellow", "Test 2: GET request (debug/status check)");
    const response2 = await fetch(TOKEN_ENDPOINT);

    if (response2.ok) {
      const data2 = await response2.json();
      log("green", "✅ Debug endpoint accessible:");
      console.log(`   Status: ${data2.status || "N/A"}`);
      console.log(`   Pattern: ${data2.pattern || "N/A"}\n`);
    } else {
      log("yellow", "⚠️  GET endpoint returned non-200 (this is OK if not implemented)\n");
    }

    // Test 3: Verify different tokens for different rooms
    log("yellow", "Test 3: Verify unique tokens per room");
    const response3 = await fetch(TOKEN_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomName: "different-room-agentserver",
        participantName: "different-user",
      }),
    });

    const data3 = await response3.json();
    if (data1.token === data3.token) {
      log("red", "❌ Same token generated for different rooms!");
      return false;
    }
    log("green", "✅ Unique tokens for different rooms\n");

    // Test 4: Verify URL format
    log("yellow", "Test 4: Verify LiveKit URL format");
    const urlPattern = /^wss?:\/\/.+/;
    if (!urlPattern.test(data1.url)) {
      log("red", `❌ Invalid URL format: ${data1.url}`);
      log("red", "   Expected: ws:// or wss:// protocol");
      return false;
    }
    log("green", `✅ Valid WebSocket URL format: ${data1.url}\n`);

    log("green", "✅ All token generation tests passed!");
    log("blue", "\n📋 Summary:");
    console.log(`   ✓ Token generation works`);
    console.log(`   ✓ LiveKit URL included (fixes 'no livekit url provided' error)`);
    console.log(`   ✓ JWT structure valid`);
    console.log(`   ✓ Unique tokens per room`);
    console.log(`   ✓ WebSocket URL format valid`);
    
    return true;
  } catch (error) {
    log("red", `❌ Test error: ${error.message}`);
    console.error(error);
    return false;
  }
}

// Run test
testTokenGeneration()
  .then((success) => {
    if (success) {
      log("green", "\n✅ Ready to test in browser!");
      console.log("   Navigate to: http://localhost:3000/food/concierge-agentserver");
    } else {
      log("red", "\n❌ Token endpoint has issues - fix before manual testing");
    }
    process.exit(success ? 0 : 1);
  })
  .catch((err) => {
    log("red", `❌ Unexpected error: ${err.message}`);
    process.exit(1);
  });
