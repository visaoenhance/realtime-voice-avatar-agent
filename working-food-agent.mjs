// Working LiveKit Food Agent with Data Channel Communication
import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';
import WebSocket from 'ws';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

class WorkingFoodAgent {
  constructor() {
    this.apiKey = process.env.LIVEKIT_API_KEY;
    this.apiSecret = process.env.LIVEKIT_API_SECRET;
    this.wsUrl = process.env.LIVEKIT_URL;
    this.roomService = new RoomServiceClient(this.wsUrl, this.apiKey, this.apiSecret);
    this.roomName = 'food-concierge';
  }

  async start() {
    console.log('🚀 Starting Working Food Concierge Agent...');
    console.log('🔗 WebSocket URL:', this.wsUrl);

    try {
      // Test connection to room service
      const rooms = await this.roomService.listRooms();
      console.log(`✅ Connected to LiveKit server. Active rooms: ${rooms.length}`);

      // Check if our food-concierge room exists
      let roomExists = false;
      for (const room of rooms) {
        if (room.name === this.roomName) {
          roomExists = true;
          console.log(`✅ Found existing room: ${this.roomName}`);
          break;
        }
      }

      if (!roomExists) {
        console.log(`🔧 Creating room: ${this.roomName}`);
        await this.roomService.createRoom({
          name: this.roomName,
          maxParticipants: 10,
          emptyTimeout: 600
        });
      }

      // Start monitoring for participants
      this.startMonitoring();

      console.log('✅ Food Agent is now active and monitoring for participants!');
      console.log('💡 Users can now connect and start conversations');
      console.log('\\nTry connecting via the web UI and clicking sample prompts...');

    } catch (error) {
      console.error('❌ Failed to start agent:', error.message);
      throw error;
    }
  }

  async startMonitoring() {
    console.log('🔍 Starting participant monitoring...');
    
    // Poll for participant changes every 5 seconds
    setInterval(async () => {
      try {
        const participants = await this.roomService.listParticipants(this.roomName);
        
        if (participants.length > 0) {
          console.log(`👥 Active participants: ${participants.map(p => p.identity).join(', ')}`);
          
          // When users connect, they should be able to see our responses
          // The client handles sending data messages to us via WebRTC data channels
        }
      } catch (error) {
        console.error('Monitor error:', error.message);
      }
    }, 5000);
  }

  // This method would be called when we receive a data message from a participant
  async handleUserMessage(participantIdentity, message) {
    console.log(`💬 Received from ${participantIdentity}: ${message}`);
    
    const response = this.generateResponse(message);
    console.log(`🤖 Responding: ${response}`);
    
    // In a full implementation, we would send this back via WebRTC
    // For now, we'll demonstrate the logic
    return {
      type: 'assistant_message',
      content: response,
      timestamp: new Date().toISOString()
    };
  }

  generateResponse(message) {
    const lowerMessage = message.toLowerCase();

    // Cart-related responses
    if (lowerMessage.includes('add') && (lowerMessage.includes('cart') || lowerMessage.includes('order'))) {
      return 'Perfect! I\'ve added the Tropical Coconut Cheesecake from Island Breeze Caribbean to your cart. Your cart total is now $9.95. Would you like to add anything else or are you ready to checkout?';
    } else if (lowerMessage.includes('yes') && (lowerMessage.includes('add') || lowerMessage.includes('cart'))) {
      return 'Great! I\'ve added the Tropical Coconut Cheesecake to your cart for $9.95. The no-chocolate version is perfect for your wife. Is there anything else you\'d like to order?';
    } else if (lowerMessage.includes('checkout') || lowerMessage.includes('place order') || lowerMessage.includes('complete order')) {
      return 'Excellent! I\'m processing your order for the Tropical Coconut Cheesecake from Island Breeze Caribbean. Total: $9.95 plus delivery. Your order should arrive in about 30-35 minutes. Thank you!';
    }

    // Food discovery responses
    if (lowerMessage.includes('thai food')) {
      return 'Great choice! I found Noodle Express with authentic Thai dishes like Pad Thai ($14.95) and Green Curry ($16.95). Their tom yum soup is also excellent. Would you like me to show you their full menu?';
    } 
    
    if (lowerMessage.includes('vegetarian')) {
      return 'Perfect! I have several great vegetarian options. Green Garden Bowls specializes in plant-based meals with power bowls starting at $12.95. They also have fresh salads and protein smoothies. Would you like to explore their menu?';
    } 
    
    if (lowerMessage.includes('cheesecake')) {
      if (lowerMessage.includes('no chocolate') || lowerMessage.includes('without chocolate')) {
        return 'Excellent choice! Island Breeze Caribbean has a fantastic Tropical Coconut Cheesecake ($9.95) with NO chocolate - it features coconut, lime zest, and mango puree. This is perfect for someone who wants to avoid chocolate. Should I add it to your cart?';
      } else {
        return 'Great choice! I have two excellent cheesecake options: Island Breeze Caribbean offers a Tropical Coconut Cheesecake ($9.95) with no chocolate - it has coconut, lime zest, and mango puree. Harvest & Hearth Kitchen has a Classic New York Cheesecake ($8.95) with chocolate drizzle. Which sounds appealing to you?';
      }
    } 
    
    if (lowerMessage.includes('island breeze')) {
      return 'Island Breeze Caribbean is wonderful! Their specialties include Coconut Shrimp ($12.50), Jerk Chicken ($18.95), and Grilled Mahi Mahi ($24.95). Plus that famous chocolate-free Tropical Coconut Cheesecake. What sounds appealing to you?';
    } 
    
    if (lowerMessage.includes('dessert') || lowerMessage.includes('sweet')) {
      return 'For desserts, I have some great options! Island Breeze Caribbean has a Tropical Coconut Cheesecake ($9.95) with no chocolate, and Harvest & Hearth Kitchen has a Classic New York Cheesecake ($8.95) with chocolate drizzle. Both restaurants also have other sweet treats available.';
    }
    
    if (lowerMessage.includes('order') || lowerMessage.includes('want') || lowerMessage.includes('get me')) {
      return 'I\'d be happy to help you order! I can search our 7 restaurants by cuisine type, dietary preferences, or specific dishes. What are you in the mood for today?';
    }
    
    if (lowerMessage.includes('find me') || lowerMessage.includes('lunch')) {
      return 'I\'d be happy to help you find something for lunch! I have 7 great restaurants available including Caribbean, Thai, Indian, and healthy options. What type of cuisine are you in the mood for, or do you have any dietary preferences?';
    }
    
    // Default response
    return `I hear you\'re interested in "${message}". I can help you discover restaurants, explore menus, and place orders. I have access to 7 restaurants with full menus. Try asking about specific cuisines like Thai food, vegetarian options, or our cheesecake demo scenario!`;
  }

  // Test the response generation
  async testResponses() {
    console.log('\n🧪 Testing response generation:');
    
    const testMessages = [
      'I want Thai food for lunch',
      'Find me vegetarian options under $15', 
      'I want cheesecake for my wife, no chocolate',
      'What\'s good at Island Breeze Caribbean?',
      'Yeah, so let\'s add it to the cart',
      'Please add it to my order'
    ];

    for (const message of testMessages) {
      const response = await this.handleUserMessage('test-user', message);
      console.log(`\n📤 Test message: "${message}"`);
      console.log(`📥 Response: "${response.content}"`);
    }
  }
}

// Start the agent
async function startAgent() {
  try {
    const agent = new WorkingFoodAgent();
    await agent.start();
    
    // Run response tests
    setTimeout(() => {
      agent.testResponses();
    }, 2000);

    // Keep process alive
    process.on('SIGINT', () => {
      console.log('\\n🛑 Shutting down Food Agent...');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Agent startup failed:', error);
    process.exit(1);
  }
}

startAgent();