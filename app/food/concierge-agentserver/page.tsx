'use client';

/**
 * LiveKit AgentServer Food Concierge (v1.4.1+ Pattern)
 * 
 * Connects to food_concierge_agentserver.py which follows:
 * - AgentServer with @server.rtc_session
 * - inference.STT/LLM/TTS (not direct plugins)
 * - Typed userdata with RunContext
 * - Fixed function parameters (no schema errors)
 * 
 * This is the WORKING implementation following LiveKit's official patterns.
 */

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
import FoodCourtHeader from '@/components/FoodCourtHeader';

const LIVEKIT_TOKEN_ENDPOINT = "/api/livekit-agentserver/token";

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

// Render tool output cards
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
      // Transform AgentServer payload to match card expectations
      const restaurantResults = payload.restaurants || payload.results || [];
      if (!Array.isArray(restaurantResults) || restaurantResults.length === 0) {
        return <div className="text-xs text-red-500">Unable to load restaurant search results.</div>;
      }
      const restaurantData = {
        results: restaurantResults,
        filters: {
          cuisine: payload.cuisine || undefined,
          ...payload.filters
        },
        speechSummary: payload.speechSummary || `Found ${restaurantResults.length} restaurant${restaurantResults.length !== 1 ? 's' : ''}`
      };
      return <RestaurantSearchCard data={restaurantData} />;
    
    case 'getRestaurantMenu':
    case 'get_restaurant_menu':
      if (!payload || !payload.restaurant || !Array.isArray(payload.sections)) {
        return <div className="text-xs text-red-500">Unable to load restaurant menu.</div>;
      }
      return <RestaurantMenuCard data={payload} />;
    
    case 'fetchMenuItemImage':
    case 'fetch_menu_item_image':
      if (!payload || payload.success === false) {
        return <div className="text-xs text-red-500">{payload?.message || 'Unable to load image preview.'}</div>;
      }
      return <FoodImagePreviewCard data={payload} />;
    
    case 'searchMenuItems':
    case 'findFoodItem':
    case 'find_food_item':
      // Transform AgentServer payload to match card expectations
      const menuResults = payload.results || [];
      if (!Array.isArray(menuResults)) {
        return <div className="text-xs text-red-500">Unable to load menu item search results.</div>;
      }
      const menuItemData = {
        results: menuResults,
        filters: {
          query: payload.query || undefined,
          maxPrice: payload.maxPrice || undefined,
          tags: payload.tags || undefined,
          ...payload.filters
        },
        restaurant: payload.restaurant || undefined,
        speechSummary: payload.speechSummary || `Found ${menuResults.length} item${menuResults.length !== 1 ? 's' : ''}`
      };
      return <MenuItemSpotlightCard data={menuItemData} />;
    
    case 'addItemToCart':
    case 'quickAddToCart':
    case 'quick_add_to_cart':
      if (!payload || payload.success === false) {
        return <div className="text-xs text-red-500">{payload?.message || 'Unable to add item to cart.'}</div>;
      }
      // Ensure required fields are present for ShoppingCartCard
      const addToCartData = {
        success: payload.success !== false,
        cartId: payload.cartId || payload.cart?.id || 'cart-unknown',
        restaurant: payload.restaurant || payload.cart?.restaurant || {
          id: payload.cart?.restaurantId || 'unknown',
          name: payload.cart?.restaurantName || 'Restaurant',
          cuisine: 'american'
        },
        subtotal: payload.subtotal || payload.cart?.subtotal || 0,
        cart: payload.cart || {},
        speechSummary: payload.speechSummary || 'Item added to cart',
        ...payload
      };
      return <ShoppingCartCard data={addToCartData} />;
    
    case 'viewCart':
    case 'quickViewCart':
    case 'quick_view_cart':
      if (!payload || !payload.cart) {
        return <div className="text-xs text-red-500">Unable to load cart.</div>;
      }
      // Transform to full CartData structure
      const viewCartData = {
        success: true,
        cartId: payload.cart.id || payload.cartId || 'cart-unknown',
        restaurant: payload.restaurant || {
          id: payload.cart.restaurantId || 'unknown',
          name: payload.cart.restaurantName || 'Restaurant',
          cuisine: 'american'
        },
        subtotal: payload.cart.subtotal || 0,
        cart: payload.cart,
        speechSummary: payload.speechSummary || `Your cart has ${payload.cart.items?.length || 0} item${payload.cart.items?.length !== 1 ? 's' : ''}`,
        ...payload
      };
      return <ShoppingCartCard data={viewCartData} />;
    
    case 'checkout':
    case 'quickCheckout':
    case 'quick_checkout':
      if (!payload || payload.success === false) {
        return <div className="text-xs text-red-500">{payload?.message || 'Checkout failed.'}</div>;
      }
      // Ensure required fields for OrderConfirmationCard
      const checkoutData = {
        success: true,
        orderId: payload.orderId || payload.orderNumber || 'unknown',
        restaurant: payload.restaurant || {
          id: 'unknown',
          name: 'Restaurant',
          cuisine: 'american'
        },
        itemCount: payload.itemCount || 0,
        total: payload.total || 0,
        estimatedDeliveryTime: payload.estimatedDeliveryTime || '30-45 minutes',
        speechSummary: payload.speechSummary || 'Order confirmed!',
        ...payload
      };
      return <OrderConfirmationCard data={checkoutData} />;
    
    default:
      return null;
  }
}

export default function AgentServerConcierge() {
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
  const [agentLogs, setAgentLogs] = useState<Array<{
    type: 'user_said' | 'agent_saying' | 'tool_called' | 'tool_result' | 'info' | 'error';
    message: string;
    timestamp: number;
    details?: any;
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
    const stored = localStorage.getItem('livekit-agentserver-session');
    if (stored) {
      try {
        const session = JSON.parse(stored);
        const ageMinutes = (Date.now() - session.timestamp) / 1000 / 60;
        
        if (ageMinutes < 30) {
          console.log('[AGENTSERVER] ⚠️  Found existing session:', session.roomName, `(${Math.round(ageMinutes)}min ago)`);
          setExistingSession(session);
        } else {
          console.log('[AGENTSERVER] 🧹 Clearing stale session (>30min old)');
          localStorage.removeItem('livekit-agentserver-session');
        }
      } catch (e) {
        localStorage.removeItem('livekit-agentserver-session');
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
      console.error('[agentserver] fetchCart error', error);
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
      console.error('[agentserver] fetchOrders error', error);
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
      console.error('[agentserver] clear cart error', error);
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
      console.error('[agentserver] clear orders error', error);
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
          roomName: `food-concierge-agentserver-${Date.now()}`,
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
      localStorage.setItem('livekit-agentserver-session', JSON.stringify(sessionInfo));
      console.log("[AGENTSERVER] 💾 Session stored in localStorage:", data.roomName);
      setExistingSession(null);

      console.log("✅ Token received, connecting to room:", data.roomName);
    } catch (err) {
      console.error("❌ Connection error:", err);
      setError(err instanceof Error ? err.message : "Connection failed");
      setIsConnecting(false);
    }
  };

  // Disconnect and reset
  const handleDisconnect = () => {
    localStorage.removeItem('livekit-agentserver-session');
    console.log("[AGENTSERVER] 🧹 Session cleared from localStorage");
    
    setToken("");
    setRoomName("");
    setLivekitUrl("");
    setIsConnecting(false);
    setMessages([]);
  };

  // Force clear existing session
  const handleClearExistingSession = () => {
    console.log("[AGENTSERVER] 🗑️ Forcing clear of existing session");
    localStorage.removeItem('livekit-agentserver-session');
    setExistingSession(null);
  };

  const handleSamplePrompt = (prompt: string) => {
    setMessages(prev => [...prev, { role: 'user', content: prompt }]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <FoodCourtHeader 
        pageTitle="Voice Concierge (AgentServer)"
        totalCartItems={totalCartItems}
        onCartClick={openCartModal}
      />

      <main className="mx-auto max-w-6xl px-6 py-10 space-y-8">
        {/* Hero */}
        <section className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-3">
            🎙️ Voice Food Concierge (AgentServer Pattern)
          </h1>
          <p className="text-lg text-slate-600 max-w-xl mx-auto">
            Full-featured voice ordering with cards, cart, and checkout using the new AgentServer v1.4.1+ pattern
          </p>
        </section>

        {/* Existing Session Warning */}
        {existingSession && (
          <section className="rounded-3xl border-2 border-amber-400 bg-amber-50 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-amber-900 mb-2">⚠️ Existing Session Detected</h3>
            <p className="text-sm text-amber-800 mb-3">
              Found session: <code className="bg-amber-100 px-2 py-1 rounded">{existingSession.roomName}</code>
            </p>
            <button
              onClick={handleClearExistingSession}
              className="rounded-full border border-amber-400 px-4 py-1.5 text-xs uppercase tracking-[0.3em] text-amber-800 transition hover:bg-amber-100"
            >
              Clear & Continue
            </button>
          </section>
        )}

        {/* Connection Section */}
        {!token ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <h2 className="text-2xl font-semibold text-slate-900 mb-3">
                Connect to Food Concierge
              </h2>
              <p className="text-slate-600 mb-6 max-w-md">
                Start a voice conversation with your AI food assistant. Powered by AgentServer v1.4.1+ with full UI/UX parity.
              </p>

              {error && (
                <div className="w-full max-w-md mb-4 p-4 rounded-xl bg-red-50 border border-red-200">
                  <p className="text-sm text-red-800 font-semibold mb-1">Connection Error</p>
                  <p className="text-xs text-red-700">{error}</p>
                  <p className="text-xs text-red-600 mt-2">
                    Make sure the Python agent is running:
                    <code className="block bg-red-100 p-2 rounded mt-1">
                      python agents/food_concierge_agentserver.py dev
                    </code>
                  </p>
                </div>
              )}

              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-8 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white transition hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isConnecting ? "Connecting..." : "🎙️ Start Conversation"}
              </button>

              <div className="mt-8 w-full max-w-md">
                <h3 className="text-xs uppercase tracking-[0.25em] text-slate-500 mb-3">Try Saying:</h3>
                <div className="space-y-2">
                  {SAMPLE_VOICE_PROMPTS.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSamplePrompt(prompt)}
                      disabled={!token}
                      className="w-full text-left rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      💬 "{prompt}"
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-8 p-4 bg-emerald-50 border border-emerald-200 rounded-xl w-full max-w-md">
                <p className="text-xs font-semibold text-emerald-800 mb-2">✅ NEW: AgentServer Pattern</p>
                <ul className="text-xs text-emerald-700 space-y-1">
                  <li>• inference.STT/LLM/TTS unified API</li>
                  <li>• Typed userdata with RunContext</li>
                  <li>• No schema validation errors</li>
                  <li>• Turn detection + max_tool_steps</li>
                  <li>• Following drive-thru reference patterns</li>
                  <li>• Full card rendering for tool results</li>
                </ul>
              </div>
            </div>
          </section>
        ) : (
          <LiveKitRoom
            token={token}
            serverUrl={livekitUrl}
            connect={true}
            audio={true}
            video={false}
            onDisconnected={handleDisconnect}
            className="h-full"
          >
            <VoiceAssistantControls 
              onDisconnect={handleDisconnect}
              onMessage={(msg) => {
                setMessages(prev => [...prev, msg]);
                if (msg.toolName && msg.toolResult) {
                  setDebugExecutions(prev => [...prev, {
                    toolName: msg.toolName!,
                    payload: msg.toolResult,
                    timestamp: Date.now(),
                  }]);
                }
              }}
              onAgentLog={(log) => {
                setAgentLogs(prev => [...prev, log]);
              }}
              onCartUpdate={fetchCartFromApi}
            />
            <RoomAudioRenderer />
          </LiveKitRoom>
        )}

        {/* Chat History with Tool Output Cards */}
        {token && (
          <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-600 mb-4">
              Conversation History
            </h2>
            {messages.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <div className="text-4xl mb-3">💬</div>
                <p className="text-sm">Your conversation will appear here</p>
                <p className="text-xs mt-1">Voice transcripts and AI responses with visual cards</p>
              </div>
            ) : (
              <div 
                ref={chatContainerRef}
                className="space-y-4 max-h-[600px] overflow-y-auto"
              >
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`${msg.role === 'user' ? 'max-w-lg' : 'w-full'} rounded-xl p-4 ${
                      msg.role === 'user' 
                        ? 'bg-emerald-100 text-emerald-900' 
                        : 'bg-slate-100 text-slate-900'
                    }`}>
                      <p className="text-sm">{msg.content}</p>
                      {msg.toolName && msg.toolResult && (
                        <div className="mt-3">
                          {renderToolOutput(msg.toolName, msg.toolResult)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Comparison Note */}
        <section className="hidden rounded-3xl border border-emerald-100 bg-emerald-50/50 p-6 shadow-sm">
          <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-600 mb-3">AgentServer vs Native (Old)</h2>
          <div className="grid md:grid-cols-2 gap-6 text-sm">
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">AgentServer Pattern (This Page)</h3>
              <ul className="text-slate-600 space-y-1 text-xs">
                <li>• AgentServer with @server.rtc_session</li>
                <li>• inference.STT/LLM/TTS unified API</li>
                <li>• Typed userdata with RunContext</li>
                <li>• No parameter defaults (schema validation works)</li>
                <li>• Turn detection + max_tool_steps</li>
                <li>• ~461 lines of Python code</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Old Native Pattern (Broken)</h3>
              <ul className="text-slate-600 space-y-1 text-xs">
                <li>• Old CLI worker pattern</li>
                <li>• Direct plugin imports (openai.STT)</li>
                <li>• Global state, no typed context</li>
                <li>• Parameter defaults break schema</li>
                <li>• No turn detection</li>
                <li>• ~446 lines of Python code (archived)</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-emerald-100 rounded-lg">
            <p className="text-xs text-emerald-800">
              <strong>AgentServer Benefits:</strong> No schema errors, follows official patterns, production-ready, automatic tool result handling
            </p>
          </div>
        </section>

        {/* Debug Panel */}
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <DebugPanel 
            toolExecutions={debugExecutions}
            agentLogs={agentLogs}
            isProduction={process.env.NODE_ENV === 'production'}
          />
        </section>
      </main>
      
      {/* Cart Modal */}
      {cartModalOpen && (
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
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs uppercase tracking-[0.3em] text-slate-600 transition hover:border-emerald-400 hover:text-emerald-600"
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
                        {item.options && item.options.length > 0 && (
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
                        )}
                        {item.instructions && (
                          <div className="mt-1 text-[11px] italic text-slate-500">"{item.instructions}"</div>
                        )}
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
                  className="rounded-full border border-slate-200 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-slate-500 transition hover:border-emerald-400 hover:text-emerald-600"
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
                      {order.items && order.items.length > 0 && (
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
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 p-4 text-xs text-slate-500">
                  No past orders yet. As you place orders with the concierge, they'll appear here.
                </div>
              )}

              {cartActionMessage && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] uppercase tracking-[0.25em] text-emerald-600">
                  {cartActionMessage}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Voice Assistant Controls - renders inside LiveKitRoom context
 */
function VoiceAssistantControls({ 
  onDisconnect, 
  onMessage,
  onAgentLog,
  onCartUpdate
}: { 
  onDisconnect: () => void;
  onMessage: (msg: ChatMessage) => void;
  onAgentLog: (log: { type: 'user_said' | 'agent_saying' | 'tool_called' | 'tool_result' | 'info' | 'error'; message: string; timestamp: number; details?: any }) => void;
  onCartUpdate: () => void;
}) {
  const { state, audioTrack } = useVoiceAssistant();
  const connectionState = useConnectionState();
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const isConnected = connectionState === ConnectionState.Connected;
  const [agentTranscript, setAgentTranscript] = React.useState<string>('');
  const [userTranscript, setUserTranscript] = React.useState<string>('');
  const [isMicEnabled, setIsMicEnabled] = React.useState(true); // Start with mic enabled by default
  const [agentJoined, setAgentJoined] = React.useState(false);
  const [showAgentJoinedBanner, setShowAgentJoinedBanner] = React.useState(false);
  const [agentError, setAgentError] = React.useState<{type: string, message: string, timestamp: number} | null>(null);

  const micTrack = localParticipant?.getTrackPublication(Track.Source.Microphone)?.track;
  
  // Auto-enable microphone when connected
  React.useEffect(() => {
    if (isConnected && room && !isMicEnabled) {
      console.log('[AGENTSERVER] 🎤 Auto-enabling microphone on connection...');
      room.localParticipant.setMicrophoneEnabled(true).then(() => {
        setIsMicEnabled(true);
        console.log('[AGENTSERVER] ✅ Microphone auto-enabled');
      }).catch(err => {
        console.error('[AGENTSERVER] ❌ Failed to auto-enable mic:', err);
      });
    }
  }, [isConnected, room, isMicEnabled]);

  // Toggle microphone
  const toggleMicrophone = React.useCallback(async () => {
    if (!room) return;
    
    try {
      if (isMicEnabled) {
        console.log('[AGENTSERVER] 🔇 Disabling microphone...');
        await room.localParticipant.setMicrophoneEnabled(false);
        setIsMicEnabled(false);
        console.log('[AGENTSERVER] ✅ Microphone disabled');
      } else {
        console.log('[AGENTSERVER] 🎤 Enabling microphone...');
        await room.localParticipant.setMicrophoneEnabled(true);
        setIsMicEnabled(true);
        console.log('[AGENTSERVER] ✅ Microphone enabled');
        console.log('[AGENTSERVER] 👂 Agent should now be listening...');
      }
    } catch (error) {
      console.error('[AGENTSERVER] ❌ Error toggling microphone:', error);
    }
  }, [room, isMicEnabled]);

  // Listen for agent data messages (transcriptions and responses)
  React.useEffect(() => {
    if (!room) return;

    console.log('[AGENTSERVER] 📡 Setting up data message listener...');

    const handleData = (payload: Uint8Array, participant?: any) => {
      try {
        const text = new TextDecoder().decode(payload);
        console.log('[AGENTSERVER] 📩 Received data message:', text);
        const data = JSON.parse(text);
        
        // Handle different message types from the Python agent
        if (data.type === 'user_transcript') {
          console.log('[AGENTSERVER] 🎤 User transcript:', data.text, '(final:', data.is_final, ')');
          setUserTranscript(data.text);
          if (data.is_final) {
            onMessage({ role: 'user', content: data.text });
            setTimeout(() => setUserTranscript(''), 500);
          }
        } else if (data.type === 'agent_transcript' || data.type === 'agent_response') {
          console.log('[AGENTSERVER] 🗣️ Agent response:', data.text, '(final:', data.is_final, ')');
          setAgentTranscript(data.text);
          if (data.is_final) {
            onMessage({ role: 'assistant', content: data.text });
            setTimeout(() => setAgentTranscript(''), 500);
          }
        } else if (data.type === 'agent_error') {
          console.error('[AGENTSERVER] ❌ Agent error received:', data);
          setAgentError({
            type: data.error_type || 'Unknown Error',
            message: data.error_message || 'An unknown error occurred',
            timestamp: data.timestamp || Date.now()
          });
          
          onMessage({ 
            role: 'assistant', 
            content: `⚠️ Agent Error (${data.error_type || 'Unknown'}): ${data.error_message || 'The agent encountered an error. Please check logs.'}` 
          });
        } else if (data.type === 'tool_call') {
          console.log('[AGENTSERVER] 🔧 Tool call:', data.tool_name);
          onMessage({ 
            role: 'assistant', 
            content: `Executing: ${data.tool_name}`,
            toolName: data.tool_name,
            toolResult: data.result 
          });
          
          // Refresh cart when items are added
          if (data.tool_name === 'quick_add_to_cart' || data.tool_name === 'quickAddToCart' || data.tool_name === 'addItemToCart') {
            console.log('[AGENTSERVER] 🛒 Cart updated, refreshing count...');
            setTimeout(() => onCartUpdate(), 500); // Small delay to ensure backend has updated
          }
        } else if (data.type === 'agent_log') {
          // NEW: Handle agent logs for debug panel
          console.log('[AGENTSERVER] 📝 Agent log:', data);
          onAgentLog({
            type: data.log_type || 'info',
            message: data.message || '',
            timestamp: data.timestamp || Date.now(),
            details: data.details
          });
        }
      } catch (e) {
        console.log('[AGENTSERVER] ℹ️ Non-JSON data received (likely audio)');
      }
    };
    
    room.on('dataReceived', handleData);
    console.log('[AGENTSERVER] ✅ Data listener registered');
    
    return () => {
      console.log('[AGENTSERVER] 🧹 Cleaning up data listener');
      room.off('dataReceived', handleData);
    };
  }, [room, onMessage]);

  // Log state changes
  React.useEffect(() => {
    console.log('[AGENTSERVER] 🔄 Voice assistant state changed:', state);
  }, [state]);

  // Detect when Python agent joins the room
  React.useEffect(() => {
    if (!room) return;

    console.log('[AGENTSERVER] 🔍 Setting up agent join detector...');

    const handleParticipantConnected = (participant: any) => {
      console.log('[AGENTSERVER] 👤 Participant connected:', participant.identity);
      
      if (participant.identity && (participant.identity.includes('agent') || participant.identity.includes('food-concierge'))) {
        console.log('[AGENTSERVER] 🤖 Python agent joined the room!');
        console.log('[AGENTSERVER] ✅ Agent ready - you can now speak');
        setAgentJoined(true);
        setShowAgentJoinedBanner(true);
        
        setTimeout(() => {
          setShowAgentJoinedBanner(false);
        }, 5000);
      }
    };

    const handleParticipantDisconnected = (participant: any) => {
      console.log('[AGENTSERVER] 👋 Participant disconnected:', participant.identity);
      if (participant.identity && (participant.identity.includes('agent') || participant.identity.includes('food-concierge'))) {
        console.log('[AGENTSERVER] ⚠️ Python agent disconnected');
        setAgentJoined(false);
      }
    };

    room.on('participantConnected', handleParticipantConnected);
    room.on('participantDisconnected', handleParticipantDisconnected);
    console.log('[AGENTSERVER] ✅ Agent join detector registered');
    
    return () => {
      console.log('[AGENTSERVER] 🧹 Cleaning up agent join detector');
      room.off('participantConnected', handleParticipantConnected);
      room.off('participantDisconnected', handleParticipantDisconnected);
    };
  }, [room]);

  return (
    <div className="pt-2">
      {/* Agent Error Banner */}
      {agentError && (
        <div className="mb-4 p-4 rounded-xl bg-gradient-to-r from-red-100 to-rose-100 border-2 border-red-400">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">⚠️</span>
                <span className="text-sm font-bold text-red-800">
                  Agent Error: {agentError.type}
                </span>
              </div>
              <button
                onClick={() => setAgentError(null)}
                className="text-red-600 hover:text-red-800 font-bold"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-red-700 ml-9">
              {agentError.message}
            </p>
            <p className="text-xs text-red-600 ml-9 mt-1">
              💡 Check agent logs: <code className="bg-red-200 px-1 rounded">tail -50 /tmp/agent.log | strings</code>
            </p>
          </div>
        </div>
      )}
      
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

      {/* Audio Level Visualization */}
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
      {isMicEnabled ? (
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
      ) : (
        <div className="mb-4 h-24 rounded-xl flex flex-col items-center justify-center bg-gradient-to-r from-gray-200 to-gray-300">
          <p className="text-3xl mb-2">🔇</p>
          <p className="text-lg font-bold text-slate-900">Microphone Off</p>
          <p className="text-xs text-slate-600">Click button above to enable</p>
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
            <li>Food cards appear automatically below</li>
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
        <p>Python AgentServer • STT → LLM → TTS • v1.4.1+ Pattern</p>
      </div>
    </div>
  );
}
