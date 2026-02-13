const { Room } = require('livekit-client');

async function testConnection() {
  try {
    console.log('Testing LiveKit connection...');
    
    // Get token (Node.js 18+ has built-in fetch)
    const response = await fetch('http://localhost:3001/api/livekit/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantName: 'test-connection' })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Token request failed: ${response.status} - ${errorText}`);
    }
    
    const { token, wsUrl } = await response.json();
    console.log('✅ Token received');
    console.log('WebSocket URL:', wsUrl);
    
    const room = new Room();
    await room.connect(wsUrl, token);
    console.log('✅ Connected to LiveKit room:', room.name);
    console.log('Number of participants:', room.remoteParticipants.size);
    
    // Keep connection alive briefly to show in dashboard
    console.log('Keeping connection alive for 3 seconds...');
    setTimeout(async () => {
      await room.disconnect();
      console.log('✅ Connection test completed successfully');
      process.exit(0);
    }, 3000);
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    process.exit(1);
  }
}

testConnection();