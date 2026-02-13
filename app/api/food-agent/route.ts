import { NextRequest, NextResponse } from 'next/server';
import { foodTools } from '../food-chat/tools';

// LiveKit Agent entry point - reuses existing food tools
// This would be the HTTP endpoint that connects to LiveKit Agent process
// The actual LiveKit Agent would run as a separate process and connect via WebRTC

export async function GET() {
  return NextResponse.json({
    status: 'ready',
    message: 'Food LiveKit Agent endpoint ready',
    availableTools: Object.keys(foodTools),
    transport: 'webrtc-livekit',
    features: [
      'voice-first-interaction',
      'natural-conversation',
      'same-business-logic-as-ai-sdk',
      'full-order-management'
    ]
  });
}

export async function POST(req: NextRequest) {
  try {
    // This would handle LiveKit Agent webhooks/callbacks
    // For now, return info about available tools
    return NextResponse.json({
      success: true,
      tools: foodTools,
      message: 'LiveKit Agent tools available - same as AI SDK implementation'
    });
  } catch (error) {
    console.error('Food Agent error:', error);
    return NextResponse.json(
      { error: 'Agent processing failed' },
      { status: 500 }
    );
  }
}