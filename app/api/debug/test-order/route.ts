import { NextResponse, NextRequest } from 'next/server';
import { supabase, DEMO_PROFILE_ID } from '@/lib/supabaseServer';

// Helper: JSON error response
function jsonError(status: number, message: string, extra?: Record<string, any>) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

// Helper: Log only in development
function devLog(...args: any[]) {
  if (process.env.NODE_ENV !== 'production') {
    console.log(...args);
  }
}

export async function POST() {
  // Demo/debug-only endpoint - not accessible in production
  if (process.env.NODE_ENV === 'production') {
    return jsonError(404, 'Not found');
  }

  if (!supabase) {
    return jsonError(500, 'Supabase not configured');
  }

  try {
    // Get active cart
    const { data: activeCart, error: cartError } = await supabase
      .from('fc_carts')
      .select('id, restaurant_id, status, subtotal')
      .eq('profile_id', DEMO_PROFILE_ID)
      .eq('status', 'active')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (cartError) {
      return jsonError(500, 'Failed to fetch cart', { details: cartError.message });
    }
    if (!activeCart) {
      return jsonError(404, 'No active cart found');
    }

    devLog('Found active cart:', activeCart.id);

    // Get cart items
    const { data: cartItems, error: itemsError } = await supabase
      .from('fc_cart_items')
      .select('id, menu_item_id, quantity, base_price, total_price, instructions, menu_item:menu_item_id (name)')
      .eq('cart_id', activeCart.id);

    if (itemsError) {
      return jsonError(500, 'Failed to fetch cart items', { details: itemsError.message });
    }

    const items = cartItems || [];
    devLog('Found cart items:', items.length);

    // Create order
    const orderNumber = `FC-${Date.now()}`;
    const orderData = {
      profile_id: DEMO_PROFILE_ID,
      restaurant_id: activeCart.restaurant_id,
      restaurant_name: 'Test Restaurant',
      total: activeCart.subtotal,
      subtotal: activeCart.subtotal,
      total_amount: activeCart.subtotal,
      status: 'confirmed',
      order_number: orderNumber,
      delivery_address: 'Test Address'
    };

    devLog('Creating order:', orderNumber);

    const { data: order, error: orderError } = await supabase
      .from('fc_orders')
      .insert(orderData)
      .select('id')
      .single();

    if (orderError) {
      return jsonError(500, 'Failed to create order', { 
        details: orderError.message,
        orderData 
      });
    }

    devLog('Order created:', order.id);

    // Add order items (concurrent)
    const orderItemResults = await Promise.allSettled(
      items.map(async (item) => {
        if (!supabase) {
          throw new Error('Supabase is not configured');
        }

        const menuItem = item.menu_item as { name: string } | { name: string }[] | null;
        const itemName =
          Array.isArray(menuItem) ? menuItem[0]?.name : (menuItem as any)?.name || 'Unknown Item';

        const { data: orderItem, error: itemError } = await supabase
          .from('fc_order_items')
          .insert({
            order_id: order.id,
            menu_item_id: item.menu_item_id,
            name: itemName,
            quantity: item.quantity,
            base_price: item.base_price,
            total_price: item.total_price,
            notes: item.instructions,
          })
          .select('id')
          .single();

        if (itemError) {
          throw new Error(`menu_item_id=${item.menu_item_id}: ${itemError.message}`);
        }

        return orderItem;
      })
    );

    const createdOrderItems = orderItemResults
      .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
      .map((r) => r.value);

    const failedOrderItems = orderItemResults
      .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
      .map((r) => String(r.reason?.message || r.reason));

    devLog('Order items created:', createdOrderItems.length);
    if (failedOrderItems.length) devLog('Order item failures:', failedOrderItems);

    // Update cart status
    const { error: updateError } = await supabase
      .from('fc_carts')
      .update({ status: 'ordered' })
      .eq('id', activeCart.id);

    if (updateError) {
      devLog('Cart update error:', activeCart.id, updateError.message);
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      cartId: activeCart.id,
      itemCount: items.length,
      total: activeCart.subtotal,
      orderItems: createdOrderItems.length,
      orderItemFailures: failedOrderItems.length
    });

  } catch (error) {
    devLog('Test order error:', error instanceof Error ? error.message : String(error));
    return jsonError(500, 'Unexpected error', { 
      message: error instanceof Error ? error.message : String(error)
    });
  }
}