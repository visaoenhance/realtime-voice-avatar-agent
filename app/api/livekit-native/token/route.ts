/**
 * LiveKit Native Token Generation Endpoint
 * 
 * Generates access tokens for clients to connect to LiveKit rooms
 * where the Python native agent (food_concierge_native.py) is running.
 * 
 * Flow:
 * 1. Frontend requests token from this endpoint
 * 2. Server generates token with permissions
 * 3. Frontend uses token to connect via @livekit/components-react
 * 4. Python agent joins same room and handles voice pipeline
 * 
 * Endpoint: POST /api/livekit-native/token
 * Body: { roomName?: string, participantName?: string }
 * Returns: { token: string, url: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const roomName = body.roomName || `food-concierge-${Date.now()}`;
    const participantName = body.participantName || `user-${Math.floor(Math.random() * 1000)}`;

    // Validate environment variables
    const livekitUrl = process.env.LIVEKIT_URL;
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!livekitUrl || !apiKey || !apiSecret) {
      console.error("❌ Missing LiveKit credentials in .env.local");
      return NextResponse.json(
        {
          error: "Server configuration error",
          details: "LiveKit credentials not configured",
        },
        { status: 500 }
      );
    }

    console.log("🎫 Generating LiveKit Native token");
    console.log(`   Room: ${roomName}`);
    console.log(`   Participant: ${participantName}`);

    // Create access token
    const token = new AccessToken(apiKey, apiSecret, {
      identity: participantName,
      // Token valid for 1 hour
      ttl: "1h",
    });

    // Grant permissions
    token.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    // Generate JWT
    const jwt = await token.toJwt();

    console.log("✅ Token generated successfully");

    return NextResponse.json({
      token: jwt,
      url: livekitUrl,
      roomName,
      participantName,
    });
  } catch (error) {
    console.error("❌ Error generating LiveKit native token:", error);
    return NextResponse.json(
      {
        error: "Failed to generate token",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Support GET requests for testing
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const roomName = searchParams.get("roomName") || `food-concierge-${Date.now()}`;
  const participantName = searchParams.get("participantName") || `user-${Math.floor(Math.random() * 1000)}`;

  // Reuse POST logic
  return POST(
    new NextRequest(request.url, {
      method: "POST",
      body: JSON.stringify({ roomName, participantName }),
    })
  );
}
