'use client';

import Link from 'next/link';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Room, RoomEvent, RemoteTrack, Track } from 'livekit-client';
import { useAudioTranscription } from '@/hooks/useAudioTranscription';
import { useAssistantSpeech } from '@/hooks/useAssistantSpeech';
import { CustomerProfileCard, RestaurantSearchCard, RestaurantMenuCard, ShoppingCartCard, MenuItemSpotlightCard, FoodImagePreviewCard, RestaurantRecommendationCard, OrderConfirmationCard } from '@/components/food-cards';
import DebugPanel from '@/components/DebugPanel';

const SAMPLE_VOICE_PROMPTS = [
  'I want Thai food for lunch',
  'Find me vegetarian options under $15',
  'I want cheesecake for my wife, no chocolate',
  'What\'s good at Island Breeze Caribbean?',
];

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

function formatMoney(value?: number | null): string {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '$0.00';
  }
  return currencyFormatter.format(value);
}

interface LiveKitConciergePageProps {}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  toolName?: string;
  toolResult?: any;
}

export default function LiveKitConciergePage({}: LiveKitConciergePageProps) {
  const [room, setRoom] = useState<Room | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [showItemImage, setShowItemImage] = useState<{ url: string; description: string } | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // Debug panel state
  const [debugExecutions, setDebugExecutions] = useState<Array<{
    toolName: string
    payload: any
    timestamp: number
    executionTime?: number
  }>>([]);
  
  // Card rendering function (restored for multimodal UX)
  function renderToolOutput(toolName: string, payload: any) {
    console.log('🔧 renderToolOutput called:', { toolName, payload });
    
    if (!payload || typeof payload !== 'object') {
      console.log('❌ Invalid payload, returning null');
      return null;
    }

    switch (toolName) {
      case 'getUserContext':
      case 'getUserProfile': {
        if (!payload || !payload.profile) {
          return <div className="text-xs text-red-500">Unable to load user profile.</div>;
        }
        return <CustomerProfileCard data={payload} />;
      }
      case 'searchRestaurants': {
        if (!payload || !Array.isArray(payload.restaurants)) {
          return <div className="text-xs text-red-500">Unable to load restaurant search results.</div>;
        }
        return <RestaurantSearchCard data={payload} />;
      }
      case 'getRestaurantMenu': {
        if (!payload || !payload.restaurant || !Array.isArray(payload.sections)) {
          return <div className="text-xs text-red-500">Unable to load restaurant menu.</div>;
        }
        return <RestaurantMenuCard data={payload} />;
      }
      case 'searchMenuItems':
      case 'findFoodItem': {
        if (!payload || !Array.isArray(payload.results)) {
          return <div className="text-xs text-red-500">Unable to load menu item search results.</div>;
        }
        return <MenuItemSpotlightCard data={payload} />;
      }
      case 'findRestaurantsByType': {
        if (!payload || !Array.isArray(payload.restaurants)) {
          return <div className="text-xs text-red-500">Unable to load restaurant search results.</div>;
        }
        return <RestaurantSearchCard data={payload} />;
      }
      case 'addItemToCart':
      case 'quickAddToCart': {
        if (!payload || payload.success === false) {
          return <div className="text-xs text-red-500">{payload?.message ?? 'Unable to add item to cart.'}</div>;
        }
        return <ShoppingCartCard data={payload} />;
      }
      case 'viewCart':
      case 'quickViewCart': {
        if (!payload || payload.success === false) {
          return <div className="text-xs text-red-500">{payload?.message ?? 'Could not load the cart.'}</div>;
        }
        const cart = payload.cart;
        if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
          return <div className="text-xs text-slate-500">Your cart is empty.</div>;
        }
        return <ShoppingCartCard data={payload} />;
      }
      case 'submitCartOrder':
      case 'quickCheckout': {
        if (!payload || payload.success === false) {
          return <div className="text-xs text-red-500">{payload?.message ?? 'Unable to submit order.'}</div>;
        }
        return <OrderConfirmationCard data={payload} />;
      }
      case 'fetchMenuItemImage':
      case 'fetchItemImage': {
        if (!payload || payload.success === false) {
          return <div className="text-xs text-red-500">{payload?.message ?? 'Unable to load image.'}</div>;
        }
        return <FoodImagePreviewCard data={payload} />;
      }
      default:
        console.log('❓ Unknown tool:', toolName);
        return null;
    }
  }

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
    }
    
    // Option A: Parse streaming SSE from /api/voice-chat for multimodal UX
    try {
      const response = await fetch('/api/voice-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            parts: [{ type: 'text', text: message }]
          }]
        })
      });
      
      if (response.ok && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulatedText = '';
        let toolCalls = new Map(); // Track tool names by callId
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ') && !line.includes('[DONE]')) {
              try {
                const data = JSON.parse(line.slice(6));
                console.log('LiveKit SSE data:', data.type, data); // Debug log
                
                // Track tool names from tool-input-available
                if (data.type === 'tool-input-available') {
                  toolCalls.set(data.toolCallId, {
                    toolName: data.toolName,
                    input: data.input
                  });
                }
                
                // Handle text streaming
                if (data.type === 'text-delta') {
                  accumulatedText += data.textDelta;
                  // Update current message with accumulated text
                  setMessages(prev => {
                    const newMessages = [...prev];
                    const lastMessage = newMessages[newMessages.length - 1];
                    if (lastMessage && lastMessage.role === 'assistant' && !lastMessage.toolName) {
                      lastMessage.content = accumulatedText;
                    } else if (accumulatedText.trim()) {
                      newMessages.push({ role: 'assistant', content: accumulatedText });
                    }
                    return newMessages;
                  });
                }
                
                // Handle tool results - match with stored tool names
                if (data.type === 'tool-output-available') {
                  const toolInfo = toolCalls.get(data.toolCallId);
                  if (toolInfo) {
                    const toolResult = data.output;
                    let parsedResult;
                    try {
                      parsedResult = JSON.parse(toolResult);
                    } catch (e) {
                      console.error('Error parsing tool result:', e);
                      continue;
                    }
                    
                    console.log('Adding tool result card:', toolInfo.toolName, parsedResult);
                    const speechText = parsedResult.speechSummary || parsedResult.message || 'Here are your results:';
                    
                    // Add to accumulated text for speech synthesis
                    if (speechText) {
                      accumulatedText += (accumulatedText ? ' ' : '') + speechText;
                    }
                    
                    setMessages(prev => [...prev, {
                      role: 'assistant',
                      content: speechText,
                      toolName: toolInfo.toolName,
                      toolResult: parsedResult
                    }]);
                  }
                }
              } catch (parseError) {
                console.error('Error parsing SSE line:', parseError, line);
              }
            }
          }
        }
        
        // Speak the final accumulated text
        if (accumulatedText && !isAssistantMuted) {
          speak('agent-response', accumulatedText);
        }
      }
    } catch (error) {
      console.error('Error calling voice-chat API:', error);
      const fallbackResponse = generateFallbackResponse(message);
      setMessages(prev => [...prev, { role: 'assistant', content: fallbackResponse }]);
      
      if (!isAssistantMuted) {
        speak('agent-response', fallbackResponse);
      }
    }
  };

  const generateFallbackResponse = (message: string) => {
    return 'I\'m having trouble connecting to the restaurant system right now. Please try again in a moment!';
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

  const handleSamplePrompt = async (prompt: string) => {
    if (!isConnected) {
      await connectToRoom();
      // Give connection time to establish before creating the chat experience
      setTimeout(() => handleVoiceMessage(prompt), 1000);
      return;
    }
    
    // Handle the voice message using same method as voice input
    await handleVoiceMessage(prompt);
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
                {messages.map((message, index) => (
                  <div key={index} className="space-y-2">
                    <div className={`text-xs uppercase tracking-[0.35em] ${
                      message.role === 'user' ? 'text-emerald-600' : 'text-slate-500'
                    }`}>
                      {message.role === 'user' ? 'You' : 'Voice Concierge'}
                    </div>
                    <div className="text-sm leading-relaxed text-slate-700">
                      {message.content}
                    </div>
                    
                    {/* Render tool card if this message has a tool result */}
                    {message.toolName && message.toolResult && (
                      <div className="mt-4">
                        {renderToolOutput(message.toolName, message.toolResult)}
                      </div>
                    )}
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

        {/* Debug Panel - positioned like AI SDK */}
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <DebugPanel 
            toolExecutions={debugExecutions} 
            isProduction={process.env.NODE_ENV === 'production'}
          />
        </section>
      </main>

      {/* Hidden audio element for LiveKit audio */}
      <audio ref={audioRef} autoPlay playsInline />
    </div>
  );
}