'use client';

import { createPortal } from 'react-dom';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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

export default function HomeCartControls() {
  const [cartSummary, setCartSummary] = useState<CartSummary | null>(null);
  const [cartModalOpen, setCartModalOpen] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [cartActionMessage, setCartActionMessage] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const cartFetchInFlightRef = useRef(false);
  const ordersFetchInFlightRef = useRef(false);

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
      console.error('[home] fetchCart error', error);
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
      console.error('[home] fetchOrders error', error);
    } finally {
      setOrdersLoading(false);
      ordersFetchInFlightRef.current = false;
    }
  }, []);

  useEffect(() => {
    void fetchCartFromApi();
    void fetchOrdersFromApi();
  }, [fetchCartFromApi, fetchOrdersFromApi]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
      console.error('[home] clear cart error', error);
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
      console.error('[home] clear orders error', error);
      setCartActionMessage('Unexpected error clearing orders.');
    }
  }, [fetchOrdersFromApi]);

  const modal = cartModalOpen ? (
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
                          {formatMoney(
                            typeof order.total === 'number' ? order.total : Number(order.total ?? 0),
                          )}
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
  ) : null;

  return (
    <>
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

      {isMounted ? createPortal(modal, document.body) : null}
    </>
  );
}


