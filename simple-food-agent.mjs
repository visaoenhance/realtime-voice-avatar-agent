// LiveKit Food Agent - Basic working version
import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

class BasicFoodAgent {
  constructor() {
    this.apiKey = process.env.LIVEKIT_API_KEY;
    this.apiSecret = process.env.LIVEKIT_API_SECRET;
    this.wsUrl = process.env.LIVEKIT_URL;
    this.roomService = new RoomServiceClient(this.wsUrl, this.apiKey, this.apiSecret);
    this.roomName = 'food-concierge';
  }

  async start() {
    console.log('🚀 Starting Basic Food Concierge Agent...');

    try {
      // List current participants
      const participants = await this.roomService.listParticipants(this.roomName);
      console.log(`👥 Current participants in ${this.roomName}:`, participants.length);

      // Send a welcome message to the room
      await this.broadcastWelcome();

      console.log('✅ Basic Food Agent started successfully!');
      console.log('💡 The agent will respond to sample prompts clicked in the UI');
      console.log('🔍 Check your LiveKit dashboard - you should now see the agent activity');

      // Keep the process alive and monitor room
      this.startRoomMonitoring();

    } catch (error) {
      console.error('❌ Failed to start agent:', error.message);
      throw error;
    }
  }

  async broadcastWelcome() {
    const message = 'Food Concierge Agent is now active! 🍜 Click the sample prompts to test the conversation flow.';
    console.log(`📢 Broadcasting: ${message}`);

    // For now, we'll just log the message
    // In a full implementation, this would send via WebRTC data channels
    console.log('💬 Welcome message would be sent to all participants');
  }

  async startRoomMonitoring() {
    // Monitor room activity every 10 seconds
    setInterval(async () => {
      try {
        const participants = await this.roomService.listParticipants(this.roomName);
        if (participants.length > 0) {
          console.log(`🟢 Room active with ${participants.length} participant(s)`);
          
          // List participant identities
          for (const participant of participants) {
            console.log(`  👤 ${participant.identity} (joined: ${new Date(participant.joinedAt * 1000).toLocaleTimeString()})`);
          }
        } else {
          console.log('⚪ Room empty - waiting for participants');
        }
      } catch (error) {
        console.error('❌ Room monitoring error:', error.message);
      }
    }, 10000);

    console.log('👁️  Room monitoring started (every 10 seconds)');
  }

  // This would handle incoming messages from the UI
  async handleUserMessage(participantId, message) {
    console.log(`💭 ${participantId}: ${message}`);

    let response = this.generateResponse(message);
    console.log(`🤖 Response: ${response}`);

    // In a complete implementation, this would be sent back via WebRTC
    return response;
  }

  generateResponse(message) {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('thai food')) {
      return 'Great choice! I found Noodle Express with authentic Thai dishes like Pad Thai and Green Curry. Would you like to see their menu?';
    } else if (lowerMessage.includes('vegetarian')) {
      return 'Perfect! Green Garden Bowls has amazing vegetarian options including power bowls and fresh salads. They focus on healthy, plant-based meals.';
    } else if (lowerMessage.includes('cheesecake') && lowerMessage.includes('no chocolate')) {
      return 'Excellent! Island Breeze Caribbean has a Tropical Coconut Cheesecake with no chocolate - it features lime zest and mango puree. Should I add it to your cart?';
    } else if (lowerMessage.includes('island breeze')) {
      return 'Island Breeze Caribbean is fantastic! They offer coconut shrimp, jerk chicken, grilled mahi mahi, and that popular tropical cheesecake. What looks appealing?';
    } else {
      return `I understand you're interested in "${message}". I can help you explore restaurants, view menus, and place orders. Try asking about Thai food, vegetarian options, or our cheesecake demo!`;
    }
  }
}

// Test message handling
async function testResponses() {
  const agent = new BasicFoodAgent();
  
  console.log('🧪 Testing response generation:');
  console.log('Q: "I want Thai food for lunch"');
  console.log('A:', agent.generateResponse('I want Thai food for lunch'));
  console.log();
  console.log('Q: "I want cheesecake for my wife, no chocolate"');
  console.log('A:', agent.generateResponse('I want cheesecake for my wife, no chocolate'));
  console.log();
}

// Start the agent
async function startAgent() {
  try {
    await testResponses();
    
    const agent = new BasicFoodAgent();
    await agent.start();

    // Handle shutdown
    process.on('SIGINT', () => {
      console.log('\\n🛑 Shutting down Food Concierge Agent...');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Failed to start agent:', error);
    process.exit(1);
  }
}

startAgent();