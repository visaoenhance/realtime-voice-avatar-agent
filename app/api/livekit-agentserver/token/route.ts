/**
 * LiveKit AgentServer Token Generation Endpoint
 * 
 * Generates access tokens for clients to connect to LiveKit rooms
 * where the Python AgentServer (food_concierge_agentserver.py) is running.
 * 
 * This endpoint supports the NEW AgentServer pattern (v1.4.1+):
 * - Uses @server.rtc_session decorator
 * - Follows inference.STT/LLM/TTS pattern
 * - Typed userdata with RunContext
 * - No schema validation issues
 * 
 * Flow:
 * 1. Frontend requests token from this endpoint
 * 2. Server generates token with permissions
 * 3. Frontend uses token to connect via @livekit/components-react
 * 4. Python agent auto-joins room via AgentServer dispatch
 * 5. Agent handles STT→LLM→TTS pipeline automatically
 * 
 * Endpoint: POST /api/livekit-agentserver/token
 * Body: { roomName?: string, participantName?: string }
 * Returns: { token: string, url: string, roomName: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { AccessToken, RoomServiceClient, AgentDispatchClient } from "livekit-server-sdk";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const roomName = body.roomName || `food-concierge-agentserver-${Date.now()}`;
    const participantName = body.participantName || `user-${Math.floor(Math.random() * 10000)}`;

    // Validate environment variables
    const livekitUrl = process.env.LIVEKIT_URL;
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!livekitUrl || !apiKey || !apiSecret) {
      console.error("❌ Missing LiveKit credentials in .env.local");
      return NextResponse.json(
        {
          error: "Server configuration error",
          details: "LiveKit credentials not configured. Check LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET in .env.local",
        },
        { status: 500 }
      );
    }

    console.log("🎫 Generating LiveKit AgentServer token");
    console.log(`   Room: ${roomName}`);
    console.log(`   Participant: ${participantName}`);
    console.log(`   Pattern: AgentServer (v1.4.1+)`);
    console.log(`   Agent: ubereats-food-concierge`);

    // Create room - agent will be dispatched below
    try {
      const roomService = new RoomServiceClient(livekitUrl, apiKey, apiSecret);
      await roomService.createRoom({
        name: roomName,
        emptyTimeout: 300, // 5 minutes
        maxParticipants: 10,
      });
      console.log(`   ✅ Room created`);
    } catch (error: any) {
      // Room might already exist, that's ok
      if (!error?.message?.includes('already exists')) {
        console.warn(`   ⚠️ Room creation warning:`, error?.message);
      }
    }

    // Dispatch ONLY the specified agent by name
    // This ensures only ONE worker with matching agent_name joins
    // If you see multiple agents joining:
    // 1. Check LiveKit dashboard - delete old/unused agent workers
    // 2. Ensure agent name is unique across all your projects
    // 3. Make sure only ONE agent process is running locally
    try {
      const agentDispatch = new AgentDispatchClient(livekitUrl, apiKey, apiSecret);
      await agentDispatch.createDispatch(roomName, "ubereats-food-concierge");
      console.log(`   ✅ Agent dispatched: ubereats-food-concierge`);
    } catch (error: any) {
      console.error(`   ❌ Agent dispatch failed:`, error?.message);
      // Continue anyway - agent might auto-join
    }

    // Create access token
    const token = new AccessToken(apiKey, apiSecret, {
      identity: participantName,
      // Token valid for 1 hour
      ttl: "1h",
    });

    // Grant permissions for voice interaction
    token.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,        // Can publish audio/video
      canPublishData: true,    // Can send data messages
      canSubscribe: true,      // Can receive audio/video from agent
      canUpdateOwnMetadata: true,
    });

    // Generate JWT token
    const jwt = await token.toJwt();

    console.log("✅ Token generated successfully");

    return NextResponse.json({
      token: jwt,
      url: livekitUrl,
      roomName: roomName,
      participantName: participantName,
      agentType: "agentserver",
      pattern: "AgentServer v1.4.1+",
    });
  } catch (error) {
    console.error("❌ Error generating token:", error);
    return NextResponse.json(
      {
        error: "Failed to generate token",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for debugging - shows configuration status
 */
export async function GET() {
  const livekitUrl = process.env.LIVEKIT_URL;
  const hasApiKey = !!process.env.LIVEKIT_API_KEY;
  const hasApiSecret = !!process.env.LIVEKIT_API_SECRET;

  return NextResponse.json({
    configured: hasApiKey && hasApiSecret && !!livekitUrl,
    livekitUrl: livekitUrl || "NOT_CONFIGURED",
    hasApiKey,
    hasApiSecret,
    agentType: "agentserver",
    pattern: "AgentServer v1.4.1+",
    endpoint: "/api/livekit-agentserver/token",
    usage: "POST with { roomName?, participantName? }",
  });
}
