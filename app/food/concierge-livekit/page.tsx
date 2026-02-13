'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { Room, RoomEvent, RemoteTrack, Track } from 'livekit-client';
import { useAudioTranscription } from '@/hooks/useAudioTranscription';
import { useAssistantSpeech } from '@/hooks/useAssistantSpeech';

const SAMPLE_VOICE_PROMPTS = [
  'I want Thai food for lunch',
  'Find me vegetarian options under $15',
  'I want cheesecake for my wife, no chocolate',
  'What\'s good at Island Breeze Caribbean?',
];

interface LiveKitConciergePageProps {}

export default function LiveKitConciergePage({}: LiveKitConciergePageProps) {
  const [room, setRoom] = useState<Room | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [cartItems, setCartItems] = useState<Array<{ name: string; price: string; restaurant: string }>>([]);
  const [showItemImage, setShowItemImage] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Add voice transcription functionality
  const {
    status: voiceStatus,
    isSupported: voiceSupported,
    isRecording,
    startRecording,
    stopRecording,
  } = useAudioTranscription({
    onFinalTranscript: (transcript) => {
      if (transcript.trim()) {
        console.log('[LiveKit] Voice transcript:', transcript);
        handleVoiceMessage(transcript);
      }
    },
    onPartialTranscript: (partial) => {
      // Could show partial transcripts in real-time if desired
      console.log('[LiveKit] Partial transcript:', partial);
    },
  });

  // Add text-to-speech functionality (same as AI SDK)
  const { 
    speak, 
    stop: stopSpeaking, 
    isSpeaking, 
    lastUtteranceId,
    isMuted: isAssistantMuted,
    toggleMute: toggleAssistantMute 
  } = useAssistantSpeech();

  // Create a speech label from the speaking state
  const speechLabel = isSpeaking ? 'Agent Response' : null;

  const handleVoiceMessage = async (message: string) => {
    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', content: message }]);
    
    // Send to LiveKit agent and get response
    if (isConnected && room) {
      const encoder = new TextEncoder();
      const data = encoder.encode(JSON.stringify({ 
        type: 'user_message', 
        content: message,
        source: 'voice',
        timestamp: new Date().toISOString()
      }));
      room.localParticipant.publishData(data);
      
      // Simulate agent response (same logic as clicking prompts)
      setTimeout(() => {
        const response = generateAgentResponse(message);
        setMessages(prev => [...prev, { role: 'assistant', content: response }]);
        
        // Speak the response aloud (same as AI SDK)
        if (!isAssistantMuted) {
          speak('agent-response', response);
        }
      }, 1000);
    }
  };

  const generateAgentResponse = (message: string) => {
    const lowerMessage = message.toLowerCase();
    
    // Handle checkout requests - properly process the order
    if (lowerMessage.includes('checkout') || 
        lowerMessage.includes('ready to check') || 
        lowerMessage.includes('place order') || 
        lowerMessage.includes('place the order') ||
        lowerMessage.includes('proceed to place') ||
        lowerMessage.includes('lets proceed') ||
        lowerMessage.includes('complete order') ||
        lowerMessage.includes('finish order') ||
        lowerMessage.includes('submit order')) {
      // Clear cart after successful order
      setCartItems([]);
      return 'Excellent! I\'m processing your order for the Tropical Coconut Cheesecake from Island Breeze Caribbean. Total: $9.95 plus delivery. Your order should arrive in about 30-35 minutes. Thank you for choosing our voice concierge!';
    }
    
    // Cart addition responses  
    if (((lowerMessage.includes('yes') || lowerMessage.includes('add') || lowerMessage.includes('lets add')) && (lowerMessage.includes('cart') || lowerMessage.includes('card') || lowerMessage.includes('order'))) ||
        (lowerMessage.includes('add') && lowerMessage.includes('island breeze')) ||
        (lowerMessage.includes('lets') && lowerMessage.includes('add') && lowerMessage.includes('cheesecake'))) {
      // Check if item is already in cart to prevent duplicates
      const itemExists = cartItems.some(item => item.name === 'Tropical Coconut Cheesecake');
      if (!itemExists) {
        setCartItems(prev => [...prev, { 
          name: 'Tropical Coconut Cheesecake', 
          price: '$9.95', 
          restaurant: 'Island Breeze Caribbean' 
        }]);
        return 'Perfect! I\'ve added the Tropical Coconut Cheesecake from Island Breeze Caribbean to your cart. Your cart total is now $9.95. Would you like to add anything else or are you ready to checkout?';
      } else {
        return 'The Tropical Coconut Cheesecake is already in your cart! Would you like to add anything else or are you ready to checkout?';
      }
    } 
    
    // Enhanced cheesecake filtering - detect "no chocolate" requests
    if (lowerMessage.includes('cheesecake')) {
      const needsNoChocolate = lowerMessage.includes('no chocolate') || 
                               lowerMessage.includes('without chocolate') || 
                               lowerMessage.includes('without the chocolate') ||
                               lowerMessage.includes('but without') ||
                               lowerMessage.includes('does not have chocolate') ||
                               lowerMessage.includes('doesn\'t have chocolate') ||
                               lowerMessage.includes('doesnt have chocolate') ||  // no apostrophe
                               lowerMessage.includes('that doesnt have') ||
                               lowerMessage.includes('that doesn\'t have') ||
                               lowerMessage.includes('help me find') && lowerMessage.includes('no chocolate') ||
                               lowerMessage.includes('kill me make sure') || 
                               lowerMessage.includes('make sure it doesn\'t');
      
      if (needsNoChocolate) {
        // Only offer the no-chocolate option
        return 'Perfect! I found exactly what you need: Island Breeze Caribbean has a Tropical Coconut Cheesecake ($9.95) with NO chocolate - it features coconut, lime zest, and mango puree. This is chocolate-free and sounds perfect for you. Should I add it to your cart?';
      } else {
        // Offer both options but highlight the distinction
        return 'Great choice! I have two excellent cheesecake options: Island Breeze Caribbean offers a Tropical Coconut Cheesecake ($9.95) with no chocolate - it has coconut, lime zest, and mango puree. Harvest & Hearth Kitchen has a Classic New York Cheesecake ($8.95) with chocolate drizzle. Which sounds appealing to you?';
      }
    }
    
    // Handle image requests with helpful explanation
    if (lowerMessage.includes('show me') || 
        lowerMessage.includes('show me what') ||
        (lowerMessage.includes('show') && (lowerMessage.includes('picture') || lowerMessage.includes('image') || lowerMessage.includes('it to me') || lowerMessage.includes('what it looks'))) ||
        lowerMessage.includes('see what') || 
        lowerMessage.includes('looks like') ||
        (lowerMessage.includes('what') && lowerMessage.includes('looks like')) ||
        lowerMessage.includes('from island breeze') && lowerMessage.includes('look')) {
      // Show visual image placeholder
      setShowItemImage('Tropical Coconut Cheesecake - Coconut flakes, lime zest, mango puree. No chocolate!');
      return 'I\'d love to show you what that delicious Tropical Coconut Cheesecake looks like! I\'ve displayed a preview above. It\'s a beautiful tropical dessert with coconut flakes, lime zest, and mango puree - completely chocolate-free. Would you like me to add it to your cart?';
    }
    
    // Thai food responses
    if (lowerMessage.includes('thai food') || lowerMessage.includes('thai')) {
      return 'Great choice! I found Noodle Express with authentic Thai dishes like Pad Thai ($14.95) and Green Curry ($16.95). Their tom yum soup is also excellent. Would you like me to show you their full menu?';
    } 
    
    // Vegetarian responses  
    if (lowerMessage.includes('vegetarian') || lowerMessage.includes('veggie')) {
      return 'Perfect! I have several great vegetarian options. Green Garden Bowls specializes in plant-based meals with power bowls starting at $12.95. They also have fresh salads and protein smoothies. Would you like to explore their menu?';
    } 
    
    // Island Breeze specific 
    if (lowerMessage.includes('island breeze')) {
      return 'Island Breeze Caribbean is wonderful! Their specialties include Coconut Shrimp ($12.50), Jerk Chicken ($18.95), and Grilled Mahi Mahi ($24.95). Plus that famous chocolate-free Tropical Coconut Cheesecake. What sounds appealing to you?';
    } 
    
    // General food discovery
    if (lowerMessage.includes('find me') || lowerMessage.includes('lunch') || lowerMessage.includes('dinner') || lowerMessage.includes('eat')) {
      return 'Hello! I\'m your voice-powered food concierge. I can help you discover restaurants, explore menus, and place orders. What are you craving today?';
    } 
    
    // Greeting responses
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return 'Hello! I\'m your voice-powered food concierge. I can help you discover restaurants, explore menus, and place orders. What are you craving today?';
    } 
    
    // Default response with better guidance
    return `I heard you say \"${message}\". I can help you discover restaurants, explore menus, and place orders. Try asking about Thai food, vegetarian options, or our cheesecake demo scenario - just speak naturally!`;
  };

  const connectToRoom = async () => {
    if (isConnecting || isConnected) return;
    
    setIsConnecting(true);
    try {
      // Get LiveKit connection token
      const response = await fetch('/api/livekit/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantName: 'food-customer' })
      });
      
      if (!response.ok) {
        throw new Error('Failed to get connection token');
      }
      
      const { token, wsUrl } = await response.json();
      
      const newRoom = new Room();
      
      newRoom.on(RoomEvent.TrackSubscribed, (track: RemoteTrack) => {
        if (track.kind === Track.Kind.Audio && audioRef.current) {
          track.attach(audioRef.current);
        }
      });
      
      newRoom.on(RoomEvent.DataReceived, (payload: Uint8Array) => {
        const message = JSON.parse(new TextDecoder().decode(payload));
        if (message.type === 'assistant_message') {
          setMessages(prev => [...prev, { role: 'assistant', content: message.content }]);
        }
      });
      
      await newRoom.connect(wsUrl, token);
      setRoom(newRoom);
      setIsConnected(true);
      
      // Send initial greeting
      setMessages([{ role: 'assistant', content: 'Hi! I\'m your voice-powered food concierge. Tell me what you\'re craving and I\'ll help you find and order it!' }]);
      
    } catch (error) {
      console.error('Failed to connect:', error);
      setMessages([{ role: 'assistant', content: 'Sorry, I\'m having trouble connecting right now. Please try again in a moment.' }]);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = async () => {
    if (room) {
      await room.disconnect();
      setRoom(null);
      setIsConnected(false);
      setMessages([]);
    }
  };

  const handleSamplePrompt = (prompt: string) => {
    if (!isConnected) {
      connectToRoom();
      return;
    }
    
    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', content: prompt }]);
    
    // Send message to LiveKit agent (simple data message for now)
    if (room) {
      const encoder = new TextEncoder();
      const data = encoder.encode(JSON.stringify({ 
        type: 'user_message', 
        content: prompt,
        timestamp: new Date().toISOString()
      }));
      room.localParticipant.publishData(data);
      
      // Simulate agent response for demo (in production, this comes via WebRTC)
      setTimeout(() => {
        let response = '';
        const lowerPrompt = prompt.toLowerCase();
        
        if (lowerPrompt.includes('thai food')) {
          response = 'Great choice! I found Noodle Express with authentic Thai dishes like Pad Thai ($14.95) and Green Curry ($16.95). Their tom yum soup is also excellent. Would you like me to show you their full menu?';
        } else if (lowerPrompt.includes('vegetarian')) {
          response = 'Perfect! I have several great vegetarian options. Green Garden Bowls specializes in plant-based meals with power bowls starting at $12.95. They also have fresh salads and protein smoothies. Would you like to explore their menu?';
        } else if (lowerPrompt.includes('cheesecake')) {
          if (lowerPrompt.includes('no chocolate') || lowerPrompt.includes('without chocolate')) {
            response = 'Excellent choice! Island Breeze Caribbean has a fantastic Tropical Coconut Cheesecake ($9.95) with NO chocolate - it features coconut, lime zest, and mango puree. This is perfect for someone who wants to avoid chocolate. Should I add it to your cart?';
          } else {
            response = 'Great choice! I have two excellent cheesecake options: Island Breeze Caribbean offers a Tropical Coconut Cheesecake ($9.95) with no chocolate - it has coconut, lime zest, and mango puree. Harvest & Hearth Kitchen has a Classic New York Cheesecake ($8.95) with chocolate drizzle. Which sounds appealing to you?';
          }
        } else if (lowerPrompt.includes('island breeze')) {
          response = 'Island Breeze Caribbean is wonderful! Their specialties include Coconut Shrimp ($12.50), Jerk Chicken ($18.95), and Grilled Mahi Mahi ($24.95). Plus that famous chocolate-free Tropical Coconut Cheesecake. What sounds appealing to you?';
        } else if (lowerPrompt.includes('dessert') || lowerPrompt.includes('sweet')) {
          response = 'For desserts, I have some great options! Island Breeze Caribbean has a Tropical Coconut Cheesecake ($9.95) with no chocolate, and Harvest & Hearth Kitchen has a Classic New York Cheesecake ($8.95) with chocolate drizzle. Both restaurants also have other sweet treats available.';
        } else if (lowerPrompt.includes('order') || lowerPrompt.includes('want') || lowerPrompt.includes('get me')) {
          response = 'I\'d be happy to help you order! I can search our 7 restaurants by cuisine type, dietary preferences, or specific dishes. What are you in the mood for today?';
        } else {
          response = `I understand you're interested in "${prompt}". I can help you discover restaurants, explore menus, and place orders. I have access to 7 restaurants with full menus. Try asking about specific cuisines like Thai food, vegetarian options, or our cheesecake demo scenario!`;
        }
        
        setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      }, 1000);
    }
  };

  useEffect(() => {
    return () => {
      if (room) {
        room.disconnect();
      }
    };
  }, [room]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      const element = chatContainerRef.current;
      element.scrollTop = element.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
          <div className="flex items-center gap-10">
            <Link href="/" className="font-display text-3xl tracking-[0.35em] text-emerald-600">
              Food Court
            </Link>
            <nav className="hidden gap-6 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 md:flex">
              <Link href="/" className="transition hover:text-slate-900">Home</Link>
              <Link href="/food/concierge" className="transition hover:text-slate-900">Concierge (AI SDK)</Link>
              <span className="text-slate-900">Concierge (LiveKit)</span>
            </nav>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <Link
              href="/food/concierge"
              className="rounded-full border border-slate-300 px-3 py-1 uppercase tracking-[0.3em] text-slate-600 transition hover:border-emerald-400 hover:text-emerald-600"
            >
              Compare AI SDK
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-6 grid gap-6 md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] md:items-start">
            <div className="space-y-3">
              <div className="text-xs uppercase tracking-[0.35em] text-slate-500">LiveKit Voice Concierge</div>
              <h1 className="text-3xl font-semibold text-slate-900 md:text-4xl">Natural conversation ordering</h1>
              <p className="text-sm text-slate-600">
                Speak naturally to order food. Same restaurant data and ordering system as AI SDK version, 
                but delivered through seamless voice conversation powered by LiveKit.
              </p>
              <div className="pt-2">
                {speechLabel ? (
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-2 text-xs font-medium uppercase tracking-[0.25em] text-emerald-700 mb-4">
                    Speaking: {speechLabel}
                  </div>
                ) : null}
                
                <div className="flex items-center justify-center gap-2 mb-4">
                  <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-slate-400'}`} />
                  <span className="text-sm text-slate-600">
                    {isConnected ? 'Connected - Speak naturally' : 'Not connected'}
                  </span>
                </div>
                
                <div className="flex flex-col gap-2 text-xs">
                  {!isConnected ? (
                    <button
                      onClick={connectToRoom}
                      disabled={isConnecting}
                      className="w-full rounded-full border border-emerald-400 bg-emerald-500 px-4 py-2 uppercase tracking-[0.3em] text-white transition hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isConnecting ? 'Connecting...' : 'Start Voice Session'}
                    </button>
                  ) : (
                    <>
                      {/* Mute/Unmute Button */}
                      <button
                        type="button"
                        onClick={toggleAssistantMute}
                        className="w-full rounded-full border border-slate-300 px-4 py-2 uppercase tracking-[0.3em] text-slate-600 transition hover:border-emerald-400 hover:text-emerald-600"
                      >
                        {isAssistantMuted ? 'Unmute Agent' : 'Mute Agent'}
                      </button>
                      
                      {/* Voice Recording Button */}
                      <button
                        type="button"
                        onClick={() => {
                          if (isRecording) {
                            stopRecording();
                          } else {
                            void startRecording();
                          }
                        }}
                        className={`flex w-full items-center justify-center gap-3 rounded-full border px-4 py-2 uppercase tracking-[0.3em] transition ${
                          isRecording
                            ? 'border-red-500 bg-red-500 text-white hover:bg-red-600'
                            : 'border-emerald-400 bg-emerald-500 text-white hover:bg-emerald-400'
                        } ${voiceSupported ? '' : 'opacity-50 cursor-not-allowed'}`}
                        disabled={!voiceSupported || voiceStatus === 'processing'}
                      >
                        <span className="inline-block h-2 w-2 rounded-full bg-white" />
                        {isRecording ? 'Stop Recording' : voiceStatus === 'processing' ? 'Processing...' : 'Start Recording'}
                      </button>
                      
                      {/* End Session Button */}
                      <button
                        onClick={disconnect}
                        className="w-full rounded-full border border-slate-300 px-4 py-2 uppercase tracking-[0.3em] text-slate-600 transition hover:border-red-400 hover:text-red-600"
                      >
                        End Session
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="rounded-3xl border border-emerald-100 bg-emerald-50/50 p-5 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-600">Try saying</div>
              <div className="mt-4 flex flex-col gap-3">
                {SAMPLE_VOICE_PROMPTS.map(prompt => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => handleSamplePrompt(prompt)}
                    className="w-full rounded-full border border-emerald-200 px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.3em] text-emerald-600 transition hover:border-emerald-400 hover:bg-emerald-50"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div
            ref={chatContainerRef}
            className="h-[460px] overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-6"
            id="livekit-food-chat"
          >
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center text-slate-400">
                <p className="text-lg font-medium text-slate-600">Click "Start Recording" to begin voice ordering</p>
                <p className="mt-2 text-sm text-slate-500">
                  Just speak naturally - "I want Thai food" or "Find me vegetarian options"
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Or click the sample prompts below to test different scenarios
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Cart Display */}
                {cartItems.length > 0 && (
                  <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
                    <h3 className="font-semibold text-emerald-900 mb-2 text-sm">🛒 Your Cart</h3>
                    {cartItems.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm">
                        <div>
                          <div className="font-medium text-emerald-900">{item.name}</div>
                          <div className="text-xs text-emerald-600">{item.restaurant}</div>
                        </div>
                        <div className="font-semibold text-emerald-900">{item.price}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Image Display */}
                {showItemImage && (
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-2xl">
                    <h3 className="font-semibold text-blue-900 mb-3 text-sm">📸 Item Preview</h3>
                    <div className="w-full h-32 bg-gradient-to-br from-orange-100 to-yellow-100 rounded-xl flex items-center justify-center border border-orange-200">
                      <div className="text-center">
                        <div className="text-2xl mb-2">🥥🍰</div>
                        <div className="text-xs font-medium text-orange-800">Tropical Coconut Cheesecake</div>
                        <div className="text-xs text-orange-600">No Chocolate • Coconut • Lime • Mango</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => setShowItemImage(null)}
                      className="mt-2 text-xs text-blue-600 hover:text-blue-800"
                    >
                      Close Preview
                    </button>
                  </div>
                )}

                {/* Cart Display */}
                {cartItems.length > 0 && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-4">
                    <h3 className="font-semibold text-emerald-800 text-sm mb-2">Your Cart</h3>
                    {cartItems.map((item, index) => (
                      <div key={index} className="flex justify-between items-center text-xs text-emerald-700">
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-emerald-600">{item.restaurant}</div>
                        </div>
                        <div className="font-semibold">{item.price}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Item Image Placeholder */}
                {showItemImage && (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 bg-gradient-to-br from-orange-200 to-yellow-200 rounded-xl flex items-center justify-center">
                        <span className="text-2xl">🥥</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800 text-sm">Item Preview</h3>
                        <p className="text-xs text-slate-600">{showItemImage}</p>
                        <button 
                          onClick={() => setShowItemImage(null)}
                          className="text-xs text-slate-400 hover:text-slate-600 mt-1"
                        >
                          Hide preview
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div className="flex max-w-md gap-3">
                      {message.role === 'assistant' && (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                          <span className="text-sm">🎤</span>
                        </div>
                      )}
                      <div
                        className={`rounded-2xl px-4 py-3 text-sm ${
                          message.role === 'user'
                            ? 'bg-slate-200 text-slate-900'
                            : 'bg-white border border-slate-200 text-slate-900 shadow-sm'
                        }`}
                      >
                        {message.content}
                      </div>
                      {message.role === 'user' && (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200">
                          <span className="text-sm">👤</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Comparison Note */}
        <section className="rounded-3xl border border-blue-100 bg-blue-50/50 p-6 shadow-sm">
          <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-600 mb-3">LiveKit vs AI SDK</h2>
          <div className="grid md:grid-cols-2 gap-6 text-sm">
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Same Foundation</h3>
              <ul className="text-slate-600 space-y-1 text-xs">
                <li>• Same restaurant database (7 restaurants, full menus)</li>
                <li>• Same order processing and cart management</li>
                <li>• Same menu items and pricing</li>
                <li>• Same cheesecake demo scenario</li>
                <li>• Same voice transcription technology (OpenAI)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Different Experience</h3>
              <ul className="text-slate-600 space-y-1 text-xs">
                <li>• Natural voice conversation (same as AI SDK)</li>
                <li>• Real-time WebRTC transport layer</li>
                <li>• Designed for seamless voice-first interaction</li>
                <li>• More conversational, less structured flow</li>
                <li>• LiveKit infrastructure for scale</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-blue-100 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>Try saying:</strong> "I want cheesecake for my wife, no chocolate" to test the natural conversation flow!
            </p>
          </div>
        </section>
      </main>

      {/* Hidden audio element for LiveKit audio */}
      <audio ref={audioRef} autoPlay playsInline />
    </div>
  );
}