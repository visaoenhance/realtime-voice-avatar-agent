'use client'

import React from 'react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DefaultChatTransport, getToolName, isToolUIPart } from 'ai';
import { useChat } from '@ai-sdk/react';
import type { UIMessage } from 'ai';
import { useAssistantSpeech } from '@/hooks/useAssistantSpeech';
import { useAudioTranscription } from '@/hooks/useAudioTranscription';
import type { FoodCourtUIMessage } from '../../api/food-chat/types';
import { CustomerProfileCard, RestaurantSearchCard, RestaurantMenuCard, ShoppingCartCard, MenuItemSpotlightCard, FoodImagePreviewCard, RestaurantRecommendationCard, OrderConfirmationCard } from '@/components/food-cards';
import DebugPanel from '@/components/DebugPanel';

const QUICK_PROMPTS = [
  'Help me pick a Caribbean dinner that is still open.',
  'Find something healthy that arrives within 30 minutes.',
  'What are my recent orders this week?',
  'Update my preferences to add vegetarian and medium spice.',
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

function normalizeNumeric(value: unknown): number | null {
  if (value == null) {
    return null;
  }
  if (typeof value === 'number') {
    return Number.isNaN(value) ? null : value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
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

type ImagePreview = {
  imageUrl: string;
  name?: string | null;
  description?: string | null;
  price?: number | null;
  tags?: string[];
  restaurantName?: string | null;
  sectionTitle?: string | null;
  calories?: number | null;
};

type MenuItemPreview = {
  name?: string | null;
  description?: string | null;
  price?: number | null;
  tags?: string[];
  image?: string | null;
  calories?: number | null;
  sectionTitle?: string | null;
  restaurantName?: string | null;
};

function renderToolOutput(toolName: string, payload: any, debugTracker?: (execution: any) => void) {
  // Debug logging to understand what's happening
  console.log('🔧 renderToolOutput called:', { toolName, payload });
  
  // Track debug execution with safe deduplication
  if (debugTracker) {
    // Use a simpler, more stable deduplication key
    const executionKey = `${toolName}-${typeof payload === 'object' ? JSON.stringify(payload).substring(0, 100) : payload}`;
    debugTracker({
      toolName,
      payload,
      executionKey, // Include key for deduplication
      timestamp: Date.now()
    });
  }
  
  if (!payload || typeof payload !== 'object') {
    console.log('❌ Invalid payload, returning null');
    return null;
  }

  switch (toolName) {
    case 'getRestaurantMenu': {
      console.log('✅ getRestaurantMenu case reached!', { payload });
      
      if (!payload || !payload.restaurant || !Array.isArray(payload.sections)) {
        return <div className="text-xs text-red-500">Unable to load restaurant menu.</div>;
      }

      return <RestaurantMenuCard data={payload} />;
    }
    case 'searchMenuItems': {
      console.log('✅ searchMenuItems case reached!', { payload });
      
      if (!payload || !Array.isArray(payload.results)) {
        return <div className="text-xs text-red-500">Unable to load menu item search results.</div>;
      }

      return <MenuItemSpotlightCard data={payload} />;
    }
    case 'addItemToCart': {
      console.log('✅ addItemToCart case reached!', { payload });
      
      if (!payload || payload.success === false) {
        return <div className="text-xs text-red-500">{payload?.message ?? 'Unable to add item to cart.'}</div>;
      }

      return <ShoppingCartCard data={payload} />;
    }
    case 'viewCart': {
      if (!payload || payload.success === false) {
        return <div className="text-xs text-red-500">{payload?.message ?? 'Could not load the cart.'}</div>;
      }

      const cart = payload.cart;
      if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
        return <div className="text-xs text-slate-500">Your cart is empty.</div>;
      }

      return (
        <div className="space-y-3 text-xs text-slate-600">
          <div className="text-sm font-semibold text-slate-800">
            Cart – {payload.restaurant?.name ?? 'Current selection'}
          </div>
          <ul className="space-y-2">
            {cart.items.map((item: any) => (
              <li key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between">
                  <span>
                    {item.quantity} × {item.name}
                  </span>
                  <span className="font-semibold text-slate-700">{formatMoney(typeof item.totalPrice === 'number' ? item.totalPrice : Number(item.totalPrice ?? 0))}</span>
                </div>
                {item.options && item.options.length > 0 ? (
                  <ul className="ml-4 list-disc space-y-1 text-[11px] text-slate-500">
                    {item.options.map((option: any) => (
                      <li key={option.id ?? option.label}>
                        {option.label}
                        {typeof option.priceAdjustment === 'number' && option.priceAdjustment !== 0
                          ? ` (${formatMoney(option.priceAdjustment)})`
                          : ''}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {item.instructions ? (
                  <div className="mt-1 text-[11px] italic text-slate-500">“{item.instructions}”</div>
                ) : null}
              </li>
            ))}
          </ul>
          <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
            Subtotal {formatMoney(typeof cart.subtotal === 'number' ? cart.subtotal : Number(cart.subtotal ?? 0))}
          </div>
        </div>
      );
    }
    case 'submitCartOrder': {
      console.log('✅ submitCartOrder case reached!', { payload });
      
      if (!payload) {
        return <div className="text-xs text-red-500">Unable to process order confirmation.</div>;
      }

      return <OrderConfirmationCard data={payload} />;
    }
    case 'fetchMenuItemImage': {
      console.log('✅ fetchMenuItemImage case reached!', { payload });
      
      if (!payload) {
        return <div className="text-xs text-red-500">Unable to load image preview.</div>;
      }

      return <FoodImagePreviewCard data={payload} />;
    }
    case 'getUserContext': {
      console.log('✅ getUserContext case reached!', { payload });
      
      if (!payload || !payload.profile) {
        return <div className="text-xs text-red-500">Unable to load user profile.</div>;
      }

      return <CustomerProfileCard data={payload} />;
    }
    case 'searchRestaurants': {
      console.log('✅ searchRestaurants case reached!', { payload });
      
      if (!payload || !Array.isArray(payload.results)) {
        return <div className="text-xs text-red-500">Unable to load restaurant search results.</div>;
      }

      return <RestaurantSearchCard data={payload} />;
    }
    case 'recommendShortlist': {
      console.log('✅ recommendShortlist case reached!', { payload });
      
      if (!payload || !Array.isArray(payload.shortlist)) {
        return <div className="text-xs text-red-500">Unable to load recommendations.</div>;
      }

      return <RestaurantRecommendationCard data={payload} />;
    }
    default:
      return null;
  }
}

function extractTextParts(message: UIMessage): string[] {
  if (!message.parts) {
    return [];
  }
  return message.parts
    .map(part => {
      if (part.type === 'text') {
        const candidate = (part as { text?: string }).text;
        if (typeof candidate === 'string') {
          const trimmed = candidate.trim();
          return trimmed.length > 0 ? trimmed : null;
        }
      }
      return null;
    })
    .filter((value): value is string => Boolean(value));
}

function formatTextPartForDisplay(text: string): string {
  let formatted = text;
  formatted = formatted.replace(/!\[[^\]]*\]\([^)]+\)/g, ' ').trim();
  formatted = formatted.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '$1');
  formatted = formatted.replace(/__(.*?)__/g, '$1');
  formatted = formatted.replace(/\*(.*?)\*/g, '$1');
  formatted = formatted.replace(/_(.*?)_/g, '$1');
  formatted = formatted.replace(/\s{2,}/g, ' ');
  return formatted.trim();
}

function shouldOpenVisualPreview(raw: string): boolean {
  const text = raw.toLowerCase();
  if (!text || text.includes('menu')) {
    return false;
  }
  return (
    text.includes('looks like') ||
    text.includes('look like') ||
    text.includes('show me what') ||
    text.includes('show what') ||
    text.includes('see what') ||
    text.includes('see the') ||
    text.includes('show the') ||
    text.includes('can i see') ||
    text.includes('picture') ||
    text.includes('photo') ||
    text.includes('image')
  );
}

type SpeechExtraction = {
  content: string;
  source: 'text' | 'summary';
};

function extractSpeechContent(message: UIMessage): SpeechExtraction | null {
  const textParts = extractTextParts(message);
  if (textParts.length > 0) {
    return {
      content: textParts.join(' '),
      source: 'text',
    };
  }

  if (!message.parts) {
    return null;
  }

  for (const part of message.parts) {
    if (!isToolUIPart(part)) {
      continue;
    }
    const raw = (part as any).output ?? (part as any).result;
    if (!raw) {
      continue;
    }

    let parsed: any = raw;
    if (typeof raw === 'string') {
      try {
        parsed = JSON.parse(raw);
      } catch (error) {
        parsed = null;
      }
    }

    if (parsed && typeof parsed === 'object' && typeof parsed.speechSummary === 'string') {
      const summary = parsed.speechSummary.trim();
      if (summary.length > 0) {
        return {
          content: summary,
          source: 'summary',
        };
      }
    }
  }

  return null;
}

export default function FoodCourtConcierge() {
  const { messages, sendMessage, status } = useChat<FoodCourtUIMessage>({
    transport: new DefaultChatTransport({ api: '/api/food-chat' }),
  });

  const [draft, setDraft] = useState('');
  const [transcript, setTranscript] = useState('');
  const [cartSummary, setCartSummary] = useState<CartSummary | null>(null);
  const [cartModalOpen, setCartModalOpen] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [cartActionMessage, setCartActionMessage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<ImagePreview | null>(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [lastMenuItems, setLastMenuItems] = useState<MenuItemPreview[]>([]);
  const [pendingVisualRequest, setPendingVisualRequest] = useState<string | null>(null);
  
  // Debug panel state
  const [debugExecutions, setDebugExecutions] = useState<Array<{
    toolName: string
    payload: any
    timestamp: number
    executionTime?: number
  }>>([]);
  
  // Track logged executions to prevent duplicates during re-renders
  const loggedExecutionsRef = useRef<Set<string>>(new Set());

  // Memoized debug tracker to prevent infinite re-renders
  const debugTracker = useCallback((execution: any) => {
    // Create ID based on tool name and payload content, NOT timestamp
    const executionId = `${execution.toolName}-${JSON.stringify(execution.payload)}`;
    
    if (!loggedExecutionsRef.current.has(executionId)) {
      loggedExecutionsRef.current.add(executionId);
      setDebugExecutions(prev => [...prev, { ...execution, timestamp: Date.now() }]);
    }
  }, []);

  const attemptOpenVisualPreview = useCallback(
    (items: MenuItemPreview[], fallbackRestaurantName?: string | null) => {
      if (!pendingVisualRequest || items.length === 0) {
        return false;
      }
      const normalizedQuery = pendingVisualRequest.toLowerCase();
      const target =
        items.find(item => {
          const name = (item.name ?? '').toLowerCase();
          if (!name) {
            return false;
          }
          return normalizedQuery.includes(name);
        }) ?? items[0];

      if (!target || !target.image) {
        return false;
      }

      const price = normalizeNumeric(target.price);
      const calories = normalizeNumeric(target.calories);

      setImagePreview({
        imageUrl: target.image,
        name: target.name ?? null,
        description: target.description ?? null,
        price,
        tags: Array.isArray(target.tags) ? target.tags : [],
        restaurantName: target.restaurantName ?? fallbackRestaurantName ?? null,
        sectionTitle: target.sectionTitle ?? null,
        calories,
      });
      setImageModalOpen(true);
      setPendingVisualRequest(null);
      return true;
    },
    [pendingVisualRequest, setImageModalOpen, setImagePreview, setPendingVisualRequest],
  );

  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const [hasSentInitialMessage, setHasSentInitialMessage] = useState(false);
  const processedToolCallsRef = useRef<Set<string>>(new Set());
  const cartFetchInFlightRef = useRef(false);
  const ordersFetchInFlightRef = useRef(false);

  const {
    speak: speakAssistant,
    toggleMute: toggleAssistantMute,
    isMuted: isAssistantMuted,
    stop: stopAssistantSpeech,
    lastUtteranceId,
  } = useAssistantSpeech({ defaultMuted: false, voice: 'alloy' });

  const lastAssistantMessageId = useRef<string | null>(null);
  const lastSpokenSignatureRef = useRef<string | null>(null);

  const {
    status: voiceStatus,
    error: voiceError,
    isSupported: voiceSupported,
    startRecording,
    stopRecording,
    isRecording,
  } = useAudioTranscription({
    onFinalTranscript: async (text, language) => {
      setTranscript('');
      if (!text.trim()) {
        return;
      }
      await sendMessage({
        text,
        metadata: language ? { language } : undefined,
      });
      setHasSentInitialMessage(true);
    },
    onPartialTranscript: partial => {
      setTranscript(partial);
    },
  });

  useEffect(() => {
    if (status === 'streaming') {
      return;
    }

    const lastMessage = [...messages].reverse().find(message => message.role === 'assistant');
    if (!lastMessage?.parts) {
      return;
    }

    const speech = extractSpeechContent(lastMessage);
    if (!speech) {
      return;
    }

    const messageId = lastMessage.id ?? `assistant-${messages.length}`;
    const signature = `${messageId}:${speech.source}:${speech.content}`;

    if (signature === lastSpokenSignatureRef.current) {
      return;
    }

    speakAssistant(messageId, speech.content);
    lastAssistantMessageId.current = messageId;
    lastSpokenSignatureRef.current = signature;
  }, [messages, status]); // Removed speakAssistant to prevent infinite loops

  useEffect(() => {
    if (messages.length === 0) {
      lastAssistantMessageId.current = null;
      lastSpokenSignatureRef.current = null;
    }
  }, [messages.length]);

  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) {
      return;
    }

    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    const isNearBottom = distanceFromBottom < 200;

    if (isNearBottom || status === 'streaming') {
      window.requestAnimationFrame(() => {
        container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
      });
    }
  }, [messages, status]);

  useEffect(() => {
    if (!imageModalOpen) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setImageModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [imageModalOpen]);

  useEffect(() => {
    if (messages.length === 0) {
      return;
    }
    const last = messages[messages.length - 1];
    if (last?.role !== 'user') {
      return;
    }
    const text = extractTextParts(last).join(' ').trim();
    if (!text) {
      return;
    }
    if (shouldOpenVisualPreview(text)) {
      setPendingVisualRequest(text);
    }
  }, [messages]);

  useEffect(() => {
    if (!pendingVisualRequest || imageModalOpen) {
      return;
    }
    if (lastMenuItems.length === 0) {
      return;
    }
    attemptOpenVisualPreview(lastMenuItems);
  }, [pendingVisualRequest, imageModalOpen, lastMenuItems]); // Removed attemptOpenVisualPreview to prevent infinite loops

  const handleQuickPrompt = (prompt: string) => {
    if (!prompt) {
      return;
    }
    void sendMessage({ text: prompt });
    setHasSentInitialMessage(true);
  };

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed) {
      return;
    }
    await sendMessage({ text: trimmed });
    setDraft('');
    setHasSentInitialMessage(true);
  };

  const activeToolSummaries = useMemo(() => {
    return messages
      .filter(message => message.role === 'assistant' && message.parts)
      .flatMap(message =>
        message.parts
          ?.filter(part => isToolUIPart(part))
          .map((part, index) => ({
            id: `${message.id ?? 'assistant'}-${getToolName(part)}-${index}`,
            name: getToolName(part),
            output: (() => {
              const raw = (part as any).output ?? (part as any).result;
              if (!raw) {
                return null;
              }
              try {
                return JSON.parse(raw);
              } catch (error) {
                return raw;
              }
            })(),
          })) ?? [],
      );
  }, [messages]);

  const latestSpeechLabel = useMemo(() => {
    if (!lastUtteranceId) {
      return null;
    }
    const match = messages.find(message => message.id === lastUtteranceId);
    if (!match) {
      return null;
    }
    const extraction = extractSpeechContent(match);
    const text = extraction ? extraction.content : '';
    return text.length > 120 ? `${text.slice(0, 120)}…` : text;
  }, [lastUtteranceId, messages]);

  const isStreaming = status === 'streaming';
  const totalCartItems = useMemo(
    () => (cartSummary ? cartSummary.items.reduce((sum, item) => sum + item.quantity, 0) : 0),
    [cartSummary],
  );

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
      console.error('[concierge] fetchCart error', error);
    } finally {
      setCartLoading(false);
      cartFetchInFlightRef.current = false;
    }
  }, []);

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
      console.error('[concierge] fetchOrders error', error);
    } finally {
      setOrdersLoading(false);
      ordersFetchInFlightRef.current = false;
    }
  }, []);

  useEffect(() => {
    void fetchCartFromApi();
    void fetchOrdersFromApi();
  }, []); // Removed function dependencies to prevent infinite loops - these are stable refs

  useEffect(() => {
    messages.forEach(message => {
      message.parts?.forEach(part => {
        if (!isToolUIPart(part)) {
          return;
        }
        const toolName = getToolName(part);
        if (
          toolName !== 'addItemToCart' &&
          toolName !== 'viewCart' &&
          toolName !== 'submitCartOrder' &&
          toolName !== 'searchMenuItems' &&
          toolName !== 'getRestaurantMenu' &&
          toolName !== 'fetchMenuItemImage'
        ) {
          return;
        }
        const toolCallId = part.toolCallId ?? `${message.id ?? 'assistant'}-${toolName}`;
        if (processedToolCallsRef.current.has(toolCallId)) {
          return;
        }
        processedToolCallsRef.current.add(toolCallId);
        const raw = (part as any).output ?? (part as any).result;
        let parsed: any = null;
        if (raw) {
          try {
            parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
          } catch (error) {
            parsed = null;
          }
        }

        if (!parsed || typeof parsed !== 'object') {
          return;
        }

        if (toolName === 'fetchMenuItemImage') {
          if (parsed.success && parsed.imageUrl) {
            const menuItem = parsed.menuItem ?? {};
            const price = normalizeNumeric(menuItem.price);
            const calories = normalizeNumeric(menuItem.calories);
            const preview: MenuItemPreview = {
              name: menuItem.name ?? null,
              description: menuItem.description ?? null,
              price,
              tags: Array.isArray(menuItem.tags) ? menuItem.tags : [],
              image: parsed.imageUrl,
              calories,
              sectionTitle: menuItem.sectionTitle ?? null,
              restaurantName: parsed.restaurant?.name ?? null,
            };
            setLastMenuItems([preview]);
            setImagePreview({
              imageUrl: parsed.imageUrl,
              name: preview.name,
              description: preview.description,
              price,
              tags: preview.tags,
              restaurantName: preview.restaurantName,
              sectionTitle: preview.sectionTitle,
              calories,
            });
            setImageModalOpen(true);
            setPendingVisualRequest(null);
          } else if (parsed.success === false) {
            setImagePreview(null);
          }
          return;
        }

        if (toolName === 'searchMenuItems') {
          const normalizedResults: MenuItemPreview[] = Array.isArray(parsed.results)
            ? parsed.results.map((item: any) => ({
                name: item.name ?? null,
                description: item.description ?? null,
                price: normalizeNumeric(item.price),
                tags: Array.isArray(item.tags) ? item.tags : [],
                image: item.image ?? null,
                calories: normalizeNumeric(item.calories),
                sectionTitle: item.sectionTitle ?? null,
                restaurantName: item.restaurantName ?? parsed.restaurant?.name ?? null,
              }))
            : [];
          if (normalizedResults.length > 0) {
            setLastMenuItems(normalizedResults);
            attemptOpenVisualPreview(normalizedResults, parsed.restaurant?.name ?? null);
          }
          return;
        }

        if (toolName === 'getRestaurantMenu') {
          const sections = Array.isArray(parsed.sections) ? parsed.sections : [];
          const normalizedItems: MenuItemPreview[] = [];
          sections.forEach((section: any) => {
            const sectionTitle = section?.title ?? null;
            if (Array.isArray(section?.items)) {
              section.items.forEach((item: any) => {
                normalizedItems.push({
                  name: item?.name ?? null,
                  description: item?.description ?? null,
                  price: normalizeNumeric(item?.price ?? item?.base_price),
                  tags: Array.isArray(item?.tags) ? item.tags : [],
                  image: item?.image ?? null,
                  calories: normalizeNumeric(item?.calories),
                  sectionTitle,
                  restaurantName: parsed.restaurant?.name ?? null,
                });
              });
            }
          });
          if (normalizedItems.length > 0) {
            setLastMenuItems(normalizedItems);
            attemptOpenVisualPreview(normalizedItems, parsed.restaurant?.name ?? null);
          }
        }

        if (parsed.cart) {
          setCartSummary(parsed.cart);
        }

        if (toolName === 'submitCartOrder' && parsed.success) {
          void fetchOrdersFromApi();
          void fetchCartFromApi();
        } else if (toolName === 'addItemToCart' || toolName === 'viewCart') {
          if (!parsed.cart) {
            void fetchCartFromApi();
          }
        }
      });
    });
  }, [messages]); // Removed function dependencies to prevent infinite loops

  const openCartModal = useCallback(() => {
    void fetchCartFromApi();
    void fetchOrdersFromApi();
    setCartModalOpen(true);
    setCartActionMessage(null);
  }, [fetchCartFromApi, fetchOrdersFromApi]);

  const closeCartModal = useCallback(() => {
    setCartModalOpen(false);
  }, []);

  const closeImageModal = useCallback(() => {
    setImageModalOpen(false);
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
      console.error('[concierge] clear cart error', error);
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
      console.error('[concierge] clear orders error', error);
      setCartActionMessage('Unexpected error clearing orders.');
    }
  }, [fetchOrdersFromApi]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
          <div className="flex items-center gap-10">
            <Link href="/" className="font-display text-3xl tracking-[0.35em] text-emerald-600">
              Food Court
            </Link>
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-600">
              <span className="text-slate-400">📍</span>
              <span>1234 Main Street, Orlando, FL</span>
            </div>
          </div>
          <button
            className="hidden md:flex rounded-full border border-slate-300 px-6 py-2 text-xs uppercase tracking-[0.3em] text-slate-600 transition hover:border-emerald-400 hover:text-emerald-600 items-center gap-2"
            onClick={openCartModal}
          >
            🛒 Cart{totalCartItems > 0 ? ` (${totalCartItems})` : ''}
          </button>
          <div className="flex items-center gap-4 text-xs md:hidden">
            <button
              type="button"
              onClick={openCartModal}
              className="flex items-center gap-2 rounded-full border border-slate-300 px-3 py-1 uppercase tracking-[0.3em] text-slate-600 transition hover:border-emerald-400 hover:text-emerald-600"
            >
              <span role="img" aria-label="cart">
                🛒
              </span>
              Cart
              {totalCartItems > 0 ? (
                <span className="ml-1 inline-flex h-4 min-w-[1.25rem] items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-semibold text-white">
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
              <div className="text-xs uppercase tracking-[0.35em] text-slate-500">Food Court Concierge</div>
              <h1 className="text-3xl font-semibold text-slate-900 md:text-4xl">Voice-led restaurant discovery</h1>
              <p className="text-sm text-slate-600">
                Ask for cuisine ideas, closing soon options, or preference updates. The agent will confirm each
                step and queue live restaurant data when Supabase credentials are connected.
              </p>
              <div className="pt-2">
                {latestSpeechLabel ? (
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-2 text-xs font-medium uppercase tracking-[0.25em] text-emerald-700">
                    Speaking: {latestSpeechLabel}
                  </div>
                ) : null}
                <div className="mt-3 flex flex-col gap-2 text-xs">
                  <button
                    type="button"
                    onClick={toggleAssistantMute}
                    className="w-full rounded-full border border-slate-300 px-4 py-2 uppercase tracking-[0.3em] text-slate-600 transition hover:border-emerald-400 hover:text-emerald-600"
                  >
                    {isAssistantMuted ? 'Unmute Agent' : 'Mute Agent'}
                  </button>
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
                    disabled={!voiceSupported}
                  >
                    <span className="inline-block h-2 w-2 rounded-full bg-white" />
                    {isRecording ? 'Stop' : 'Talk'}
                  </button>
                </div>
              </div>
            </div>
            <div className="rounded-3xl border border-emerald-100 bg-emerald-50/50 p-5 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-600">Sample actions</div>
              <div className="mt-4 flex flex-col gap-3">
                {QUICK_PROMPTS.map(prompt => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => handleQuickPrompt(prompt)}
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
            id="food-court-chat"
          >
            {messages.length === 0 && !hasSentInitialMessage ? (
              <div className="flex h-full flex-col items-center justify-center text-center text-slate-400">
                <p className="text-lg font-medium text-slate-600">Say “Hey Food Court” to get started.</p>
                <p className="mt-2 text-sm text-slate-500">Ask for dinner ideas, reorder favorites, or tweak your saved preferences.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map(message => {
                  const textParts = extractTextParts(message);
                  const displayParts = textParts
                    .map(formatTextPartForDisplay)
                    .map(part => part.trim())
                    .filter(Boolean);
                  return (
                    <div key={message.id ?? Math.random()} className="space-y-2">
                      <div className={`text-xs uppercase tracking-[0.35em] ${message.role === 'user' ? 'text-emerald-600' : 'text-slate-500'}`}>
                        {message.role === 'user' ? 'You' : 'Food Court Concierge'}
                      </div>
                      {displayParts.map((text, index) => (
                        <p key={index} className="text-sm leading-relaxed text-slate-700">
                          {text}
                        </p>
                      ))}
                      {message.parts
                        ?.filter(part => isToolUIPart(part))
                        .map((part, partIndex) => {
                          const toolName = getToolName(part);
                          const raw = (part as any).output ?? (part as any).result;
                          let parsed: any = null;
                          if (raw) {
                            try {
                              parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
                            } catch (error) {
                              parsed = raw;
                            }
                          }
                          const rendered = renderToolOutput(toolName, parsed, debugTracker);
                          return (
                            <div
                              key={`${message.id ?? 'assistant'}-${toolName}-${partIndex}`}
                              className="rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-600"
                            >
                              <div className="mb-1 font-semibold uppercase tracking-[0.3em] text-slate-500">{toolName}</div>
                              {rendered ?? (
                                <pre className="whitespace-pre-wrap break-all text-[11px] text-slate-700">
                                  {typeof parsed === 'string'
                                    ? parsed
                                    : JSON.stringify(parsed, null, 2)}
                                </pre>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <form onSubmit={handleFormSubmit} className="mt-6 flex flex-col gap-3 md:flex-row">
            <textarea
              name="input"
              value={draft}
              onChange={event => setDraft(event.target.value)}
              rows={2}
              placeholder="Ask for dinner ideas, e.g., “Find a Caribbean spot that closes soon.”"
              className="flex-1 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 shadow-inner placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none"
            />
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={isStreaming}
                className="rounded-full bg-emerald-500 px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isStreaming ? 'Thinking…' : 'Send'}
              </button>
              <button
                type="button"
                onClick={() => {
                  stopAssistantSpeech();
                }}
                className="rounded-full border border-slate-300 px-5 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-600 transition hover:border-emerald-400 hover:text-emerald-600"
              >
                Stop
              </button>
            </div>
          </form>
        </section>

        {activeToolSummaries.length > 0 ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
            <div className="text-xs uppercase tracking-[0.35em] text-slate-500">Latest tool activity</div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {activeToolSummaries.slice(-4).map((tool, index) => (
                <div key={`${tool.id}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs uppercase tracking-[0.3em] text-emerald-600">{tool.name}</div>
                  <pre className="mt-2 whitespace-pre-wrap break-all text-[11px] text-slate-700">
                    {typeof tool.output === 'string'
                      ? tool.output
                      : JSON.stringify(tool.output, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {(voiceStatus === 'recording' || voiceStatus === 'processing' || transcript || voiceError) && (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
            <div className="text-xs uppercase tracking-[0.35em] text-slate-500">Voice capture</div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] ${
                  voiceStatus === 'recording'
                    ? 'bg-red-50 text-red-600'
                    : voiceStatus === 'processing'
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {voiceStatus === 'recording' && 'Listening…'}
                {voiceStatus === 'processing' && 'Transcribing…'}
                {voiceStatus === 'idle' && transcript && 'Transcribed'}
              </span>
              {voiceError ? <span className="text-xs text-red-500">{voiceError}</span> : null}
            </div>
            {transcript ? (
              <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                “{transcript}”
              </div>
            ) : null}
          </section>
        )}
      </main>

      {cartModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            aria-hidden="true"
            onClick={closeCartModal}
          />
          <div className="relative z-10 w-full max-w-xl rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <div className="text-xs uppercase tracking-[0.35em] text-slate-500">Cart & Orders</div>
                <div className="text-lg font-semibold text-slate-900">
                  {cartSummary?.restaurantName ?? 'Current selections'}
                </div>
              </div>
              <button
                type="button"
                onClick={closeCartModal}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs uppercase tracking-[0.3em] text-slate-500 transition hover:border-emerald-400 hover:text-emerald-600"
              >
                Close
              </button>
            </div>
            <div className="max-h-[70vh] space-y-6 overflow-y-auto px-6 py-5 text-sm text-slate-700">
              <div className="flex items-center justify-between">
                <div className="text-xs uppercase tracking-[0.25em] text-slate-500">Active Cart</div>
                <button
                  type="button"
                  onClick={handleClearCart}
                  className="rounded-full border border-slate-200 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-slate-500 transition hover:border-emerald-400 hover:text-emerald-600"
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
                          <div className="mt-1 text-[11px] italic text-slate-500">“{item.instructions}”</div>
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
                  No past orders yet. As you place orders with the concierge, they’ll appear here.
                </div>
              )}

              {cartActionMessage ? (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] uppercase tracking-[0.25em] text-emerald-600">
                  {cartActionMessage}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
      {imageModalOpen && imagePreview ? (
        <div className="fixed inset-0 z-[55] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm"
            aria-hidden="true"
            onClick={closeImageModal}
          />
          <div className="relative z-10 w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <button
              type="button"
              onClick={closeImageModal}
              className="absolute right-4 top-4 z-10 rounded-full border border-white/60 bg-white/80 px-3 py-1 text-xs uppercase tracking-[0.3em] text-slate-600 shadow-sm transition hover:border-emerald-300 hover:text-emerald-600"
            >
              Close
            </button>
            <div className="grid gap-0 md:grid-cols-[3fr,2fr]">
              <div className="relative bg-slate-900">
                <img
                  src={imagePreview.imageUrl}
                  alt={imagePreview.name ?? 'Menu item'}
                  className="h-[70vh] w-full object-cover"
                />
              </div>
              <div className="flex flex-col justify-between gap-6 p-8">
                <div className="space-y-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-600">
                    {imagePreview.restaurantName ?? 'Featured dish'}
                  </div>
                  <div className="space-y-2">
                    <div className="text-2xl font-semibold text-slate-900">
                      {imagePreview.name ?? 'Menu item'}
                    </div>
                    {imagePreview.sectionTitle ? (
                      <div className="text-[11px] uppercase tracking-[0.25em] text-slate-500">
                        {imagePreview.sectionTitle}
                      </div>
                    ) : null}
                  </div>
                  {typeof imagePreview.price === 'number' ? (
                    <div className="text-xl font-semibold text-slate-900">{formatMoney(imagePreview.price)}</div>
                  ) : null}
                  {imagePreview.tags && imagePreview.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-2 text-[11px] text-emerald-700">
                      {imagePreview.tags.map(tag => (
                        <span key={tag} className="rounded-full bg-emerald-100 px-2 py-0.5 font-medium">
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  {typeof imagePreview.calories === 'number' ? (
                    <div className="text-[11px] uppercase tracking-[0.25em] text-slate-400">
                      {imagePreview.calories} calories
                    </div>
                  ) : null}
                  {imagePreview.description ? (
                    <p className="text-sm leading-relaxed text-slate-600">{imagePreview.description}</p>
                  ) : null}
                </div>
                <div className="space-y-3 text-sm text-slate-600">
                  <p>
                    Ask for modifiers, specify quantities, or tell the concierge to add this to your cart when you’re
                    ready.
                  </p>
                  <button
                    type="button"
                    onClick={closeImageModal}
                    className="w-full rounded-full border border-emerald-200 px-5 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-600 transition hover:border-emerald-400 hover:bg-emerald-50"
                  >
                    Back to conversation
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      
      {/* Debug Panel */}
      <DebugPanel toolExecutions={debugExecutions} isProduction={process.env.NODE_ENV === 'production'} />
    </div>
  );
}


