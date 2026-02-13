// LiveKit Food Ordering Agent
// This agent connects to LiveKit and manages food concierge conversations

import { Agent } from 'livekit-server-sdk';
import OpenAI from 'openai';
import { foodTools } from '../app/api/food-chat/tools.js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

class FoodConciergeAgent {
  constructor() {
    this.agent = new Agent();
    this.conversationHistory = [];
    this.setupAgent();
  }

  setupAgent() {
    this.agent.on('participantConnected', (participant) => {
      console.log(`🎤 User joined: ${participant.identity}`);
      this.sendWelcomeMessage();
    });

    this.agent.on('trackSubscribed', (track, participant) => {
      if (track.kind === 'audio') {
        console.log(`🔊 Audio track from ${participant.identity}`);
        // Process audio input here
      }
    });

    this.agent.on('dataReceived', async (data, participant) => {
      try {
        const message = JSON.parse(data);
        if (message.type === 'user_message') {
          await this.handleUserMessage(message.content, participant);
        }
      } catch (error) {
        console.error('Error processing data:', error);
      }
    });
  }

  async sendWelcomeMessage() {
    const welcomeMessage = {
      role: 'assistant',
      content: 'Hi! I\\'m your voice-powered food concierge. I can help you find restaurants, browse menus, and place orders. What are you craving today?'
    };
    
    this.conversationHistory.push(welcomeMessage);
    await this.agent.publishData(JSON.stringify({
      type: 'assistant_message',
      content: welcomeMessage.content
    }));
  }

  async handleUserMessage(userMessage, participant) {
    console.log(`💬 User said: ${userMessage}`);
    
    this.conversationHistory.push({
      role: 'user',
      content: userMessage
    });

    try {
      // Use OpenAI to understand intent and generate response with tools
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a helpful food concierge that helps users find restaurants, browse menus, and place orders. You have access to food tools to search restaurants, view menus, add items to cart, and complete orders. 
            
            Be conversational and natural. When users make requests like "I want Thai food" or "Add coconut shrimp and jerk chicken", use the appropriate tools to fulfill their requests.
            
            The user is in a voice conversation, so keep responses concise but helpful.`
          },
          ...this.conversationHistory
        ],
        tools: this.convertFoodToolsToOpenAIFormat(),
        tool_choice: 'auto'
      });

      const assistantMessage = response.choices[0].message;
      
      if (assistantMessage.tool_calls) {
        // Execute tool calls
        for (const toolCall of assistantMessage.tool_calls) {
          await this.executeToolCall(toolCall);
        }
      }

      // Send response back to user
      if (assistantMessage.content) {
        const responseMessage = {
          role: 'assistant', 
          content: assistantMessage.content
        };
        
        this.conversationHistory.push(responseMessage);
        
        await this.agent.publishData(JSON.stringify({
          type: 'assistant_message',
          content: assistantMessage.content
        }));
      }

    } catch (error) {
      console.error('Error handling user message:', error);
      await this.agent.publishData(JSON.stringify({
        type: 'assistant_message',
        content: 'Sorry, I had trouble understanding that. Could you try again?'
      }));
    }
  }

  convertFoodToolsToOpenAIFormat() {
    // Convert our existing foodTools to OpenAI function format
    const openAITools = [];
    
    for (const [toolName, tool] of Object.entries(foodTools)) {
      openAITools.push({
        type: 'function',
        function: {
          name: toolName,
          description: tool.description,
          parameters: tool.inputSchema
        }
      });
    }
    
    return openAITools;
  }

  async executeToolCall(toolCall) {
    const toolName = toolCall.function.name;
    const args = JSON.parse(toolCall.function.arguments);
    
    console.log(`🔧 Executing tool: ${toolName}`, args);
    
    if (foodTools[toolName]) {
      try {
        const result = await foodTools[toolName].execute(args);
        console.log(`✅ Tool result: ${JSON.stringify(result).substring(0, 200)}...`);
        return result;
      } catch (error) {
        console.error(`❌ Tool execution error: ${error.message}`);
        return { error: error.message };
      }
    } else {
      console.error(`❌ Unknown tool: ${toolName}`);
      return { error: `Unknown tool: ${toolName}` };
    }
  }

  async connect() {
    const ws_url = process.env.LIVEKIT_URL;
    const api_key = process.env.LIVEKIT_API_KEY;
    const api_secret = process.env.LIVEKIT_API_SECRET;
    
    if (!ws_url || !api_key || !api_secret) {
      throw new Error('Missing LiveKit credentials in .env.local');
    }

    await this.agent.connect(ws_url, {
      apiKey: api_key,
      apiSecret: api_secret,
      roomName: 'food-concierge',
      identity: 'food-agent'
    });

    console.log('🚀 Food Concierge Agent connected to LiveKit');
  }
}

// Start the agent
async function startAgent() {
  try {
    const agent = new FoodConciergeAgent();
    await agent.connect();
    
    // Keep the process alive
    process.on('SIGINT', () => {
      console.log('\\n🛑 Shutting down Food Concierge Agent...');
      process.exit(0);
    });
    
    console.log('✅ Food Concierge Agent is running and ready for voice orders!');
    
  } catch (error) {
    console.error('❌ Failed to start agent:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  startAgent();
}

export default FoodConciergeAgent;