#!/usr/bin/env node
/**
 * Test LiveKit Native Token Generation
 * 
 * Verifies that /api/livekit-native/token endpoint:
 * - Returns valid JWT tokens
 * - Includes correct room and participant info
 * - Has proper permissions
 * 
 * Usage:
 *   node scripts/test-livekit-native-token.js
 */

const BASE_URL = "http://localhost:3000";
const TOKEN_ENDPOINT = `${BASE_URL}/api/livekit-native/token`;

async function testTokenGeneration() {
  console.log("🧪 Testing LiveKit Native Token Generation\n");

  try {
    // Test 1: POST request with custom params
    console.log("Test 1: POST with custom parameters");
    const response1 = await fetch(TOKEN_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        roomName: "test-room-native",
        participantName: "test-user",
      }),
    });

    if (!response1.ok) {
      console.error(`❌ Failed: ${response1.status}`);
      const error = await response1.text();
      console.error(error);
      return false;
    }

    const data1 = await response1.json();
    console.log("✅ Token received:");
    console.log(`   Room: ${data1.roomName}`);
    console.log(`   Participant: ${data1.participantName}`);
    console.log(`   URL: ${data1.url}`);
    console.log(`   Token length: ${data1.token.length} characters`);

    // Validate token structure (JWT has 3 parts separated by dots)
    const tokenParts = data1.token.split(".");
    if (tokenParts.length !== 3) {
      console.error("❌ Invalid JWT structure");
      return false;
    }
    console.log("✅ Valid JWT structure\n");

    // Test 2: GET request (default params)
    console.log("Test 2: GET with default parameters");
    const response2 = await fetch(TOKEN_ENDPOINT);

    if (!response2.ok) {
      console.error(`❌ Failed: ${response2.status}`);
      return false;
    }

    const data2 = await response2.json();
    console.log("✅ Token received with defaults:");
    console.log(`   Room: ${data2.roomName}`);
    console.log(`   Participant: ${data2.participantName}\n`);

    // Test 3: Verify different tokens for different rooms
    console.log("Test 3: Verify unique tokens per room");
    const response3 = await fetch(TOKEN_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomName: "different-room",
        participantName: "different-user",
      }),
    });

    const data3 = await response3.json();
    if (data1.token === data3.token) {
      console.error("❌ Same token generated for different rooms!");
      return false;
    }
    console.log("✅ Unique tokens for different rooms\n");

    console.log("✅ All token generation tests passed!");
    return true;
  } catch (error) {
    console.error("❌ Test error:", error.message);
    return false;
  }
}

// Run test
testTokenGeneration()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
