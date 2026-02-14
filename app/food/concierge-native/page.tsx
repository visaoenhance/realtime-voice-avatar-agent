'use client';

import Link from 'next/link';
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import "@livekit/components-styles";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useVoiceAssistant,
  BarVisualizer,
  VoiceAssistantControlBar,
  useConnectionState,
  useRoomContext,
  useTracks,
  useLocalParticipant,
  useTrackVolume,
} from "@livekit/components-react";
import { Track, ConnectionState } from 'livekit-client';
import { CustomerProfileCard, RestaurantSearchCard, RestaurantMenuCard, ShoppingCartCard, MenuItemSpotlightCard, FoodImagePreviewCard, RestaurantRecommendationCard, OrderConfirmationCard } from '@/components/food-cards';
import DebugPanel from '@/components/DebugPanel';

const LIVEKIT_TOKEN_ENDPOINT = "/api/livekit-native/token";

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

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  toolName?: string;
  toolResult?: any;
}

type CartOption = {
  id?: string;
  label: string;
  priceAdjustment?: number | null;
};

type CartItem = {
  id: string;
  menuItemId?: string;
  name: string;
  quantity: number;
  totalPrice: number;
  options: CartOption[];
  instructions?: string | null;
};

type CartSummary = {
  id: string;
  restaurantId?: string | null;
  restaurantSlug?: string | null;
  restaurantName?: string | null;
  status?: string | null;
  subtotal: number;
  items: CartItem[];
  updatedAt?: string | null;
};

type OrderItemSummary = {
  id: string;
  name: string;
  quantity: number;
  totalPrice?: number | null;
};

type OrderSummary = {
  id: string;
  restaurantName: string;
  cuisine?: string | null;
  total?: number | null;
  createdAt?: string | null;
  items?: OrderItemSummary[];
};

// Render tool output cards (matching other concierge pages)
function renderToolOutput(toolName: string, payload: any) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  switch (toolName) {
    case 'getUserContext':
    case 'getUserProfile':
    case 'get_user_profile':
      if (!payload || !payload.profile) {
        return <div className="text-xs text-red-500">Unable to load user profile.</div>;
      }
      return <CustomerProfileCard data={payload} />;
    
    case 'searchRestaurants':
    case 'find_restaurants_by_type':
      if (!payload || !Array.isArray(payload.restaurants)) {
        return <div className="text-xs text-red-500">Unable to load restaurant search results.</div>;
      }
      return <RestaurantSearchCard data={payload} />;
    
    case 'getRestaurantMenu':
      if (!payload || !payload.restaurant || !Array.isArray(payload.sections)) {
        return <div className="text-xs text-red-500">Unable to load restaurant menu.</div>;
      }
      return <RestaurantMenuCard data={payload} />;
    
    case 'searchMenuItems':
    case 'findFoodItem':
    case 'find_food_item':
      if (!payload || !Array.isArray(payload.results)) {
        return <div className="text-xs text-red-500">Unable to load menu item search results.</div>;
      }
      return <MenuItemSpotlightCard data={payload} />;
    
    case 'addItemToCart':
    case 'quickAddToCart':
    case 'quick_add_to_cart':
      if (!payload || payload.success === false) {
        return <div className="text-xs text-red-500">{payload?.message || 'Unable to add item to cart.'}</div>;
      }
      return <ShoppingCartCard data={payload} />;
    
    case 'viewCart':
    case 'quickViewCart':
    case 'quick_view_cart':
      if (!payload || !payload.cart) {
        return <div className="text-xs text-red-500">Unable to load cart.</div>;
      }
      return <ShoppingCartCard data={payload} />;
    
    case 'checkout':
    case 'quickCheckout':
    case 'quick_checkout':
      if (!payload || payload.success === false) {
        return <div className="text-xs text-red-500">{payload?.message || 'Checkout failed.'}</div>;
      }
      return <OrderConfirmationCard data={payload} />;
    
    default:
      return null;
  }
}

export default function NativeConcierge() {
  const [roomName, setRoomName] = useState("");
  const [token, setToken] = useState("");
  const [livekitUrl, setLivekitUrl] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [debugExecutions, setDebugExecutions] = useState<Array<{
    toolName: string;
    payload: any;
    timestamp: number;
    executionTime?: number;
  }>>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [existingSession, setExistingSession] = useState<{roomName: string, timestamp: number} | null>(null);
  
  // Cart state
  const [cartSummary, setCartSummary] = useState<CartSummary | null>(null);
  const [cartModalOpen, setCartModalOpen] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [cartActionMessage, setCartActionMessage] = useState<string | null>(null);
  const cartFetchInFlightRef = useRef(false);
  const ordersFetchInFlightRef = useRef(false);
  
  // Check for existing session on mount
  useEffect(() => {
    const stored = localStorage.getItem('livekit-native-session');
    if (stored) {
      try {
        const session = JSON.parse(stored);
        const ageMinutes = (Date.now() - session.timestamp) / 1000 / 60;
        
        // If session is less than 30 minutes old, show warning
        if (ageMinutes < 30) {
          console.log('[NATIVE] ⚠️  Found existing session:', session.roomName, `(${Math.round(ageMinutes)}min ago)`);
          setExistingSession(session);
        } else {
          console.log('[NATIVE] 🧹 Clearing stale session (>30min old)');
          localStorage.removeItem('livekit-native-session');
        }
      } catch (e) {
        localStorage.removeItem('livekit-native-session');
      }
    }
  }, []);
  // Calculate total cart items
  const totalCartItems = useMemo(
    () => (cartSummary ? cartSummary.items.reduce((sum, item) => sum + item.quantity, 0) : 0),
    [cartSummary],
  );
  
  // Fetch cart from API
  const fetchCartFromApi = useCallback(async () => {
    if (cartFetchInFlightRef.current) {
      return;
    }
    cartFetchInFlightRef.current = true;
    setCartLoading(true);
    try {
      const response = await fetch('/api/food/cart');
      if (!response.ok) {
        throw new Error(`Cart request failed with status ${response.status}`);
      }
      const data = await response.json();
      if (data?.success && data.cart) {
        setCartSummary(data.cart);
      } else {
        setCartSummary(null);
      }
    } catch (error) {
      console.error('[native] fetchCart error', error);
    } finally {
      setCartLoading(false);
      cartFetchInFlightRef.current = false;
    }
  }, []);
  
  // Fetch orders from API
  const fetchOrdersFromApi = useCallback(async () => {
    if (ordersFetchInFlightRef.current) {
      return;
    }
    ordersFetchInFlightRef.current = true;
    setOrdersLoading(true);
    try {
      const response = await fetch('/api/food/orders');
      if (!response.ok) {
        throw new Error(`Orders request failed with status ${response.status}`);
      }
      const data = await response.json();
      if (data?.success && Array.isArray(data.orders)) {
        setOrders(data.orders);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error('[native] fetchOrders error', error);
    } finally {
      setOrdersLoading(false);
      ordersFetchInFlightRef.current = false;
    }
  }, []);
  
  // Cart modal handlers
  const openCartModal = useCallback(() => {
    void fetchCartFromApi();
    void fetchOrdersFromApi();
    setCartModalOpen(true);
    setCartActionMessage(null);
  }, [fetchCartFromApi, fetchOrdersFromApi]);

  const closeCartModal = useCallback(() => {
    setCartModalOpen(false);
  }, []);

  const handleClearCart = useCallback(async () => {
    try {
      const response = await fetch('/api/food/cart', { method: 'DELETE' });
      if (!response.ok) {
        throw new Error(`Failed to clear cart: ${response.status}`);
      }
      const data = await response.json();
      if (data?.success) {
        setCartActionMessage('Cart cleared.');
        await fetchCartFromApi();
      } else {
        setCartActionMessage(data?.message ?? 'Unable to clear cart.');
      }
    } catch (error) {
      console.error('[native] clear cart error', error);
      setCartActionMessage('Unexpected error clearing cart.');
    }
  }, [fetchCartFromApi]);

  const handleClearOrders = useCallback(async () => {
    try {
      const response = await fetch('/api/food/orders', { method: 'DELETE' });
      if (!response.ok) {
        throw new Error(`Failed to clear orders: ${response.status}`);
      }
      const data = await response.json();
      if (data?.success) {
        setCartActionMessage('Past orders cleared.');
        await fetchOrdersFromApi();
      } else {
        setCartActionMessage(data?.message ?? 'Unable to clear orders.');
      }
    } catch (error) {
      console.error('[native] clear orders error', error);
      setCartActionMessage('Unexpected error clearing orders.');
    }
  }, [fetchOrdersFromApi]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Generate token and connect
  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      setError("");

      const response = await fetch(LIVEKIT_TOKEN_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomName: `food-concierge-native-${Date.now()}`,
          participantName: `user-${Math.floor(Math.random() * 1000)}`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || "Failed to get token");
      }

      const data = await response.json();
      setToken(data.token);
      setLivekitUrl(data.url);
      setRoomName(data.roomName);

      // Store session in localStorage for duplicate detection
      const sessionInfo = {
        roomName: data.roomName,
        timestamp: Date.now()
      };
      localStorage.setItem('livekit-native-session', JSON.stringify(sessionInfo));
      console.log("[NATIVE] 💾 Session stored in localStorage:", data.roomName);
      setExistingSession(null); // Clear any warning

      console.log("✅ Token received, connecting to room:", data.roomName);
    } catch (err) {
      console.error("❌ Connection error:", err);
      setError(err instanceof Error ? err.message : "Connection failed");
      setIsConnecting(false);
    }
  };

  // Disconnect and reset
  const handleDisconnect = () => {
    // Clear session from localStorage
    localStorage.removeItem('livekit-native-session');
    console.log("[NATIVE] 🧹 Session cleared from localStorage");
    
    setToken("");
    setRoomName("");
    setLivekitUrl("");
    setIsConnecting(false);
    setMessages([]);
  };

  // Force clear existing session
  const handleClearExistingSession = () => {
    console.log("[NATIVE] 🗑️ Forcing clear of existing session");
    localStorage.removeItem('livekit-native-session');
    setExistingSession(null);
  };

  const handleSamplePrompt = (prompt: string) => {
    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: prompt }]);
    // Note: actual voice input would be handled by LiveKit
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-10">
            <Link href="/" className="font-display text-3xl tracking-[0.35em] text-emerald-600">
              Food Court
            </Link>
            <nav className="hidden gap-6 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 md:flex">
              <Link href="/food/concierge" className="transition hover:text-slate-900">Concierge (AI-SDK)</Link>
              <Link href="/food/concierge-livekit" className="transition hover:text-slate-900">Concierge (LiveKit)</Link>
              <span className="text-purple-600">Concierge (LiveKit-Native)</span>
              <button
                type="button"
                onClick={openCartModal}
                className="transition hover:text-slate-900"
              >
                Cart {totalCartItems > 0 && `(${totalCartItems})`}
              </button>
            </nav>
          </div>
          <div className="flex items-center gap-4 text-xs md:hidden">
            <button
              type="button"
              onClick={openCartModal}
              className="flex items-center gap-2 rounded-full border border-slate-300 px-3 py-1 uppercase tracking-[0.3em] text-slate-600 transition hover:border-purple-400 hover:text-purple-600"
            >
              <span role="img" aria-label="cart">
                🛒
              </span>
              Cart
              {totalCartItems > 0 ? (
                <span className="ml-1 inline-flex h-4 min-w-[1.25rem] items-center justify-center rounded-full bg-purple-500 px-1 text-[10px] font-semibold text-white">
                  {totalCartItems}
                </span>
              ) : null}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-6 grid gap-6 md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] md:items-start">
            <div className="space-y-3">
              <div className="text-xs uppercase tracking-[0.35em] text-slate-500">LiveKit Native Pipeline</div>
              <h1 className="text-3xl font-semibold text-slate-900 md:text-4xl">Python Voice Agent</h1>
              <p className="text-sm text-slate-600">
                Native LiveKit Agents SDK implementation with Python. Automatic STT→LLM→TTS pipeline with built-in voice activity detection, 
                interruption handling, and function calling.
              </p>
              
              {token && livekitUrl ? (
                <LiveKitRoom
                  serverUrl={livekitUrl}
                  token={token}
                  connect={true}
                  audio={true}
                  video={false}
                  onConnected={() => {
                    console.log("[NATIVE] ✅ Connected to LiveKit room");
                    console.log("[NATIVE] 🔗 Server URL:", livekitUrl);
                    console.log("[NATIVE] 🎯 Waiting for Python agent to join...");
                    setIsConnecting(false);
                  }}
                  onDisconnected={() => {
                    console.log("[NATIVE] 👋 Disconnected from LiveKit room");
                    handleDisconnect();
                  }}
                  onError={(error) => {
                    console.error("[NATIVE] ❌ LiveKit room error:", error);
                    setError(error.message);
                  }}
                >
                  <VoiceAssistantControls 
                    onDisconnect={handleDisconnect}
                    onMessage={(msg) => {
                      console.log('[NATIVE] 💬 New message:', msg);
                      setMessages(prev => [...prev, msg]);
                    }}
                  />
                  <RoomAudioRenderer />
                </LiveKitRoom>
              ) : (
                <div className="pt-2">
                  {/* Existing Session Warning */}
                  {existingSession && (
                    <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">⚠️</span>
                        <div className="flex-1">
                          <p className="text-amber-900 font-semibold text-sm mb-1">
                            Session Already Active
                          </p>
                          <p className="text-amber-700 text-xs mb-3">
                            A session was started {Math.round((Date.now() - existingSession.timestamp) / 1000 / 60)} minutes ago
                            {existingSession.roomName && (
                              <span className="block mt-1 font-mono text-[10px] opacity-75">
                                Room: {existingSession.roomName}
                              </span>
                            )}
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={handleClearExistingSession}
                              className="rounded-full bg-amber-600 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-white transition hover:bg-amber-700"
                            >
                              End & Start New
                            </button>
                            <button
                              onClick={() => setExistingSession(null)}
                              className="rounded-full border border-amber-400 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-amber-700 transition hover:bg-amber-100"
                            >
                              Continue Anyway
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <div className="w-3 h-3 rounded-full bg-slate-400" />
                    <span className="text-sm text-slate-600">Not connected</span>
                  </div>
                  
                  <button
                    onClick={handleConnect}
                    disabled={isConnecting}
                    className={`w-full rounded-full border border-emerald-400 bg-emerald-500 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white transition hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isConnecting ? 'Connecting...' : 'Start Voice Session'}
                  </button>

                  {error && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-700 text-sm">
                        <strong>Error:</strong> {error}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-purple-100 bg-purple-50/50 p-5 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-[0.3em] text-purple-600">Try saying</div>
              <div className="mt-4 flex flex-col gap-3">
                {SAMPLE_VOICE_PROMPTS.map(prompt => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => handleSamplePrompt(prompt)}
                    className="w-full rounded-full border border-purple-200 px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.3em] text-purple-600 transition hover:border-purple-400 hover:bg-purple-50"
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
          >
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center text-slate-400">
                <div className="text-5xl mb-4">🎙️</div>
                <p className="text-lg font-semibold text-slate-700 mb-2">Ready to Order!</p>
                <p className="text-sm text-slate-600 max-w-md">
                  Click "Start Voice Session" above, then click the microphone button to enable your mic.
                </p>
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200 max-w-md text-left">
                  <p className="text-xs font-semibold text-blue-900 mb-2">What will happen:</p>
                  <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
                    <li>Status box shows "🎤 Listening" when you can speak</li>
                    <li>Speak naturally: "I want Thai food" or "Show me the menu"</li>
                    <li>Agent processes (🤔 Processing...)</li>
                    <li>Agent responds with voice (🗣️ Agent speaking...)</li>
                    <li>Food cards appear automatically below</li>
                  </ol>
                </div>
                <p className="mt-4 text-xs text-slate-500">
                  Python Agent • Built-in VAD • Interruption Handling • ~400ms Latency
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((message, index) => (
                  <div key={index} className="space-y-2">
                    <div className={`text-xs uppercase tracking-[0.35em] ${
                      message.role === 'user' ? 'text-purple-600' : 'text-slate-500'
                    }`}>
                      {message.role === 'user' ? 'You' : 'Native Agent'}
                    </div>
                    <div className="text-sm leading-relaxed text-slate-700">
                      {message.content}
                    </div>
                    
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
        <section className="rounded-3xl border border-purple-100 bg-purple-50/50 p-6 shadow-sm">
          <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-purple-600 mb-3">Native vs Manual LiveKit</h2>
          <div className="grid md:grid-cols-2 gap-6 text-sm">
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Native Pipeline (This Page)</h3>
              <ul className="text-slate-600 space-y-1 text-xs">
                <li>• Python LiveKit Agents SDK</li>
                <li>• Automatic STT → LLM → TTS orchestration</li>
                <li>• Built-in voice activity detection (Silero)</li>
                <li>• Automatic interruption handling</li>
                <li>• Declarative function tools (@llm.function_tool)</li>
                <li>• ~380 lines of Python code</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Manual Implementation</h3>
              <ul className="text-slate-600 space-y-1 text-xs">
                <li>• TypeScript with LiveKit Client SDK</li>
                <li>• Manual OpenAI API orchestration</li>
                <li>• Manual VAD implementation</li>
                <li>• Manual interruption detection</li>
                <li>• SSE-based tool dispatch</li>
                <li>• ~590 lines of TypeScript code</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-purple-100 rounded-lg">
            <p className="text-xs text-purple-800">
              <strong>Native Benefits:</strong> Lower latency (~400ms vs ~600ms), simpler code, production-ready out of the box, automatic agent management
            </p>
          </div>
        </section>

        {/* Debug Panel */}
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <DebugPanel 
            toolExecutions={debugExecutions} 
            isProduction={process.env.NODE_ENV === 'production'}
          />
        </section>
      </main>
      
      {/* Cart Modal */}
      {cartModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            aria-hidden="true"
            onClick={closeCartModal}
          />
          <div className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex flex-col gap-6 p-8">
              <div className="flex items-center justify-between">
                <div className="text-xl font-semibold text-slate-900">Your Cart & Orders</div>
                <button
                  type="button"
                  onClick={closeCartModal}
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs uppercase tracking-[0.3em] text-slate-600 transition hover:border-purple-400 hover:text-purple-600"
                >
                  Close
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-xs uppercase tracking-[0.25em] text-slate-500">Current Cart</div>
                <button
                  type="button"
                  onClick={handleClearCart}
                  className="rounded-full border border-slate-200 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-slate-500 transition hover:border-red-400 hover:text-red-600"
                  disabled={cartLoading}
                >
                  Clear Cart
                </button>
              </div>
              {cartLoading ? (
                <div className="text-xs text-slate-500">Loading cart…</div>
              ) : cartSummary && cartSummary.items.length > 0 ? (
                <div className="space-y-3">
                  <ul className="space-y-3 text-xs">
                    {cartSummary.items.map(item => (
                      <li key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <div className="flex items-center justify-between text-sm text-slate-800">
                          <span>
                            {item.quantity} × {item.name}
                          </span>
                          <span className="font-semibold text-slate-900">{formatMoney(item.totalPrice)}</span>
                        </div>
                        {item.options && item.options.length > 0 ? (
                          <ul className="mt-1 ml-4 list-disc space-y-1 text-[11px] text-slate-500">
                            {item.options.map(option => (
                              <li key={option.id ?? `${item.id}-${option.label}`}>
                                {option.label}
                                {typeof option.priceAdjustment === 'number' && option.priceAdjustment !== 0
                                  ? ` (${formatMoney(option.priceAdjustment)})`
                                  : ''}
                              </li>
                            ))}
                          </ul>
                        ) : null}
                        {item.instructions ? (
                          <div className="mt-1 text-[11px] italic text-slate-500">"{item.instructions}"</div>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                  <div className="text-xs uppercase tracking-[0.25em] text-slate-500">
                    Subtotal {formatMoney(cartSummary.subtotal)}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 p-4 text-xs text-slate-500">
                  Your cart is empty.
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="text-xs uppercase tracking-[0.25em] text-slate-500">Past Orders</div>
                <button
                  type="button"
                  onClick={handleClearOrders}
                  className="rounded-full border border-slate-200 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-slate-500 transition hover:border-purple-400 hover:text-purple-600"
                  disabled={ordersLoading}
                >
                  Clear Orders
                </button>
              </div>
              {ordersLoading ? (
                <div className="text-xs text-slate-500">Loading orders…</div>
              ) : orders.length > 0 ? (
                <div className="space-y-3 text-xs">
                  {orders.map(order => (
                    <div key={order.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="flex items-center justify-between text-sm text-slate-800">
                        <span>{order.restaurantName}</span>
                        <span className="font-semibold text-slate-900">
                          {formatMoney(typeof order.total === 'number' ? order.total : Number(order.total ?? 0))}
                        </span>
                      </div>
                      <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
                        {order.createdAt ? new Date(order.createdAt).toLocaleString() : 'Recent order'}
                      </div>
                      {order.items && order.items.length > 0 ? (
                        <ul className="mt-2 space-y-1 text-[11px] text-slate-600">
                          {order.items.map(item => (
                            <li key={item.id}>
                              {item.quantity} × {item.name}
                              {typeof item.totalPrice === 'number'
                                ? ` (${formatMoney(item.totalPrice)})`
                                : ''}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 p-4 text-xs text-slate-500">
                  No past orders yet. As you place orders with the concierge, they'll appear here.
                </div>
              )}

              {cartActionMessage ? (
                <div className="rounded-lg border border-purple-200 bg-purple-50 px-3 py-2 text-[11px] uppercase tracking-[0.25em] text-purple-600">
                  {cartActionMessage}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Voice Assistant Controls - renders inside LiveKitRoom context
 */
function VoiceAssistantControls({ 
  onDisconnect, 
  onMessage 
}: { 
  onDisconnect: () => void;
  onMessage: (msg: ChatMessage) => void;
}) {
  const { state, audioTrack } = useVoiceAssistant();
  const connectionState = useConnectionState();
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const isConnected = connectionState === ConnectionState.Connected;
  const [agentTranscript, setAgentTranscript] = React.useState<string>('');
  const [userTranscript, setUserTranscript] = React.useState<string>('');
  const [isMicEnabled, setIsMicEnabled] = React.useState(false);
  const [agentJoined, setAgentJoined] = React.useState(false);
  const [showAgentJoinedBanner, setShowAgentJoinedBanner] = React.useState(false);

  // Get local microphone track for audio visualization
  const micTrack = localParticipant?.getTrackPublication(Track.Source.Microphone)?.track;

  // Toggle microphone
  const toggleMicrophone = React.useCallback(async () => {
    if (!room) return;
    
    try {
      if (isMicEnabled) {
        // Disable microphone
        console.log('[NATIVE] 🔇 Disabling microphone...');
        await room.localParticipant.setMicrophoneEnabled(false);
        setIsMicEnabled(false);
        console.log('[NATIVE] ✅ Microphone disabled');
      } else {
        // Enable microphone
        console.log('[NATIVE] 🎤 Enabling microphone...');
        await room.localParticipant.setMicrophoneEnabled(true);
        setIsMicEnabled(true);
        console.log('[NATIVE] ✅ Microphone enabled');
        console.log('[NATIVE] 👂 Agent should now be listening...');
      }
    } catch (error) {
      console.error('[NATIVE] ❌ Error toggling microphone:', error);
    }
  }, [room, isMicEnabled]);

  // Listen for agent data messages (transcriptions and responses)
  React.useEffect(() => {
    if (!room) return;

    console.log('[NATIVE] 📡 Setting up data message listener...');

    const handleData = (payload: Uint8Array, participant?: any) => {
      try {
        const text = new TextDecoder().decode(payload);
        console.log('[NATIVE] 📩 Received data message:', text);
        const data = JSON.parse(text);
        
        // Handle different message types from the Python agent
        if (data.type === 'user_transcript') {
          console.log('[NATIVE] 🎤 User transcript:', data.text, '(final:', data.is_final, ')');
          setUserTranscript(data.text);
          if (data.is_final) {
            onMessage({ role: 'user', content: data.text });
            setTimeout(() => setUserTranscript(''), 500);
          }
        } else if (data.type === 'agent_transcript' || data.type === 'agent_response') {
          console.log('[NATIVE] 🗣️ Agent response:', data.text, '(final:', data.is_final, ')');
          setAgentTranscript(data.text);
          if (data.is_final) {
            onMessage({ role: 'assistant', content: data.text });
            setTimeout(() => setAgentTranscript(''), 500);
          }
        } else if (data.type === 'tool_call') {
          console.log('[NATIVE] 🔧 Tool call:', data.tool_name);
          // Agent is executing a tool
          onMessage({ 
            role: 'assistant', 
            content: `Executing: ${data.tool_name}`,
            toolName: data.tool_name,
            toolResult: data.result 
          });
        }
      } catch (e) {
        // Ignore non-JSON data
        console.log('[NATIVE] ℹ️ Non-JSON data received (likely audio)');
      }
    };

    room.on('dataReceived', handleData);
    console.log('[NATIVE] ✅ Data listener registered');
    
    return () => {
      console.log('[NATIVE] 🧹 Cleaning up data listener');
      room.off('dataReceived', handleData);
    };
  }, [room, onMessage]);

  // Log state changes
  React.useEffect(() => {
    console.log('[NATIVE] 🔄 Voice assistant state changed:', state);
  }, [state]);

  // Detect when Python agent joins the room
  React.useEffect(() => {
    if (!room) return;

    console.log('[NATIVE] 🔍 Setting up agent join detector...');

    const handleParticipantConnected = (participant: any) => {
      console.log('[NATIVE] 👤 Participant connected:', participant.identity);
      
      // Check if it's the Python agent (agent identity typically contains 'agent')
      if (participant.identity && (participant.identity.includes('agent') || participant.identity.includes('food-concierge'))) {
        console.log('[NATIVE] 🤖 Python agent joined the room!');
        console.log('[NATIVE] ✅ Agent ready - you can now speak');
        setAgentJoined(true);
        setShowAgentJoinedBanner(true);
        
        // Auto-hide banner after 5 seconds
        setTimeout(() => {
          setShowAgentJoinedBanner(false);
        }, 5000);
      }
    };

    const handleParticipantDisconnected = (participant: any) => {
      console.log('[NATIVE] 👋 Participant disconnected:', participant.identity);
      if (participant.identity && (participant.identity.includes('agent') || participant.identity.includes('food-concierge'))) {
        console.log('[NATIVE] ⚠️ Python agent disconnected');
        setAgentJoined(false);
      }
    };

    room.on('participantConnected', handleParticipantConnected);
    room.on('participantDisconnected', handleParticipantDisconnected);
    console.log('[NATIVE] ✅ Agent join detector registered');
    
    return () => {
      console.log('[NATIVE] 🧹 Cleaning up agent join detector');
      room.off('participantConnected', handleParticipantConnected);
      room.off('participantDisconnected', handleParticipantDisconnected);
    };
  }, [room]);

  return (
    <div className="pt-2">
      {/* Agent Joined Banner */}
      {showAgentJoinedBanner && (
        <div className="mb-4 p-4 rounded-xl bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-400 animate-pulse">
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl">🤖</span>
            <span className="text-sm font-bold text-green-800">
              Agent Ready - Start Speaking!
            </span>
          </div>
        </div>
      )}

      {/* Connection Status */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <div className={`w-3 h-3 rounded-full ${agentJoined ? 'bg-green-500 animate-pulse' : isConnected ? 'bg-amber-400' : 'bg-slate-400'}`} />
        <span className="text-sm font-semibold text-slate-700">
          {agentJoined ? '✓ Agent Ready' : isConnected ? 'Room Connected - Waiting for Agent...' : 'Connecting to LiveKit...'}
        </span>
      </div>

      {/* Big Microphone Button */}
      <div className="mb-4">
        <button
          onClick={toggleMicrophone}
          disabled={!agentJoined}
          className={`w-full h-32 rounded-xl flex flex-col items-center justify-center transition-all duration-300 ${
            !agentJoined ? 'bg-slate-200 cursor-not-allowed' :
            isMicEnabled 
              ? 'bg-gradient-to-r from-green-400 to-green-500 hover:from-green-500 hover:to-green-600 shadow-lg' 
              : 'bg-gradient-to-r from-slate-300 to-slate-400 hover:from-slate-400 hover:to-slate-500'
          }`}
        >
          <div className="text-5xl mb-2">
            {isMicEnabled ? '🎤' : '🔇'}
          </div>
          <div className="text-lg font-bold text-white">
            {!agentJoined ? 'Waiting for Agent to Join...' :
             isMicEnabled ? 'Microphone ON - Speak Now!' : 'Click to Enable Microphone'}
          </div>
          {isMicEnabled && (
            <div className="text-sm text-white/90 mt-1">
              Agent is listening...
            </div>
          )}
        </button>
      </div>

      {/* Audio Level Visualization - Shows mic is capturing audio */}
      {isMicEnabled && micTrack && localParticipant && (
        <div className="mb-4 p-4 rounded-xl bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-300">
          <div className="text-xs uppercase tracking-wide font-semibold text-green-700 mb-2 text-center">
            🎙️ Audio Levels (Mic Active)
          </div>
          <div className="h-12 flex items-center justify-center">
            <BarVisualizer 
              state={state}
              barCount={20}
              trackRef={{ 
                publication: localParticipant.getTrackPublication(Track.Source.Microphone), 
                source: Track.Source.Microphone,
                participant: localParticipant
              }}
              options={{ 
                minHeight: 4,
                maxHeight: 48,
              }}
            />
          </div>
          <div className="text-xs text-center text-green-600 mt-2">
            {state === "listening" ? "✓ Capturing your voice..." : "Ready to listen"}
          </div>
        </div>
      )}

      {/* Voice State Indicator */}
      {isMicEnabled && (
        <div className={`mb-4 h-24 rounded-xl flex flex-col items-center justify-center transition-all duration-300 ${
          state === "listening" ? 'bg-gradient-to-r from-blue-200 to-blue-300' :
          state === "thinking" ? 'bg-gradient-to-r from-amber-200 to-amber-300 animate-pulse' :
          state === "speaking" ? 'bg-gradient-to-r from-purple-200 to-purple-300' :
          'bg-gradient-to-r from-slate-200 to-slate-300'
        }`}>
          <p className="text-3xl mb-2">
            {state === "listening" && "👂"}
            {state === "thinking" && "🤔"}
            {state === "speaking" && "🗣️"}
            {state === "idle" && "💤"}
          </p>
          <p className="text-lg font-bold text-slate-900">
            {state === "listening" && "Listening to you..."}
            {state === "thinking" && "Processing your request..."}
            {state === "speaking" && "Agent is responding..."}
            {state === "idle" && "Ready - Start talking"}
          </p>
          
          {/* Show real-time transcription */}
          {userTranscript && state === "listening" && (
            <p className="mt-2 text-sm italic text-slate-700 max-w-xs text-center">
              "{userTranscript}"
            </p>
          )}
          {agentTranscript && state === "speaking" && (
            <p className="mt-2 text-sm italic text-slate-700 max-w-xs text-center">
              "{agentTranscript}"
            </p>
          )}
        </div>
      )}

      {/* Instructions */}
      {!isMicEnabled && (
        <div className="mb-3 rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-800">
          <p className="font-semibold mb-1">🎯 Quick Start:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Click the big microphone button above</li>
            <li>Allow browser to access your microphone</li>
            <li>Speak naturally - say "I want Thai food"</li>
            <li>Watch the status change as agent responds</li>
          </ol>
        </div>
      )}

      {/* Control Bar - Hidden, using manual button instead */}
      <div className="hidden">
        <VoiceAssistantControlBar />
      </div>
      
      {/* Disconnect Button */}
      <button
        onClick={onDisconnect}
        className="w-full rounded-full border border-slate-300 px-4 py-2 text-xs uppercase tracking-[0.3em] text-slate-600 transition hover:border-red-400 hover:text-red-600"
      >
        End Session
      </button>

      <div className="mt-4 text-center text-xs text-slate-500">
        <p>Python agent • STT → LLM → TTS • ~400ms latency</p>
      </div>
    </div>
  );
}
