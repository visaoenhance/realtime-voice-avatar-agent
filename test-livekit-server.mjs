// Simple LiveKit connection test using server SDK
import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function testLiveKitServer() {
  try {
    console.log('🔍 Testing LiveKit server connection...');
    
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const wsUrl = process.env.LIVEKIT_URL;
    
    if (!apiKey || !apiSecret || !wsUrl) {
      throw new Error('Missing LiveKit credentials. Check .env.local file.');
    }
    
    console.log('✅ Credentials found');
    console.log('WebSocket URL:', wsUrl);
    
    // Test token generation
    const token = new AccessToken(apiKey, apiSecret, {
      identity: 'test-agent',
      ttl: '1h'
    });
    
    token.addGrant({
      room: 'food-concierge',
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true
    });
    
    const jwt = await token.toJwt();
    console.log('✅ Token generated successfully');
    
    // Test room service
    const roomService = new RoomServiceClient(wsUrl, apiKey, apiSecret);
    
    try {
      const rooms = await roomService.listRooms();
      console.log('✅ Connected to LiveKit server');
      console.log('Current rooms:', rooms.length);
      
      // Create or check food-concierge room
      try {
        const room = await roomService.createRoom({
          name: 'food-concierge',
          maxParticipants: 10,
          emptyTimeout: 600 // 10 minutes
        });
        console.log('✅ Created food-concierge room');
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log('✅ food-concierge room already exists');
        } else {
          throw error;
        }
      }
      
      console.log('\\n🎉 LiveKit server connection test successful!');
      console.log('Ready to start the food agent.');
      
    } catch (error) {
      throw new Error(`Room service error: ${error.message}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testLiveKitServer();