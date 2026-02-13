import { NextResponse, NextRequest } from 'next/server';
import { supabase, DEMO_PROFILE_ID } from '@/lib/supabaseServer';

export async function POST(request: NextRequest) {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  try {
    // Get an active cart first
    const { data: activeCart, error: cartError } = await supabase
      .from('fc_carts')
      .select('id, restaurant_id, status, subtotal')
      .eq('profile_id', DEMO_PROFILE_ID)
      .eq('status', 'active')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (cartError || !activeCart) {
      return NextResponse.json({ 
        error: 'No active cart found',
        cartError: cartError?.message
      }, { status: 404 });
    }

    console.log('Found active cart:', activeCart);

    // Get cart items
    const { data: cartItems, error: itemsError } = await supabase
      .from('fc_cart_items')
      .select('id, menu_item_id, quantity, base_price, total_price, instructions, menu_item:menu_item_id (name)')
      .eq('cart_id', activeCart.id);

    if (itemsError) {
      return NextResponse.json({ 
        error: 'Failed to fetch cart items',
        itemsError: itemsError?.message
      }, { status: 500 });
    }

    console.log('Found cart items:', cartItems?.length || 0);

    // Try to create an order - minimal required fields
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

    console.log('Creating order with data:', orderData);

    const { data: order, error: orderError } = await supabase
      .from('fc_orders')
      .insert(orderData)
      .select('id')
      .single();

    if (orderError) {
      return NextResponse.json({ 
        error: 'Failed to create order',
        orderError: orderError.message,
        orderData
      }, { status: 500 });
    }

    console.log('Order created:', order);

    // Add order items
    const orderItems = [];
    for (const item of cartItems) {
      const menuItem = item.menu_item as { name: string } | { name: string }[] | null;
      const itemName = Array.isArray(menuItem) ? menuItem[0]?.name : (menuItem as any)?.name || 'Unknown Item';
      const itemData = {
        order_id: order.id,
        menu_item_id: item.menu_item_id,
        name: itemName,
        quantity: item.quantity,
        base_price: item.base_price,
        total_price: item.total_price,
        notes: item.instructions
      };

      const { data: orderItem, error: itemError } = await supabase
        .from('fc_order_items')
        .insert(itemData)
        .select('id')
        .single();

      if (itemError) {
        console.error('Order item error:', itemError);
        continue;
      }

      orderItems.push(orderItem);
    }

    // Update cart status
    const { error: updateError } = await supabase
      .from('fc_carts')
      .update({ status: 'ordered' })
      .eq('id', activeCart.id);

    if (updateError) {
      console.error('Cart update error:', updateError);
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      cartId: activeCart.id,
      itemCount: cartItems.length,
      total: activeCart.subtotal,
      orderItems: orderItems.length
    });

  } catch (error) {
    console.error('Test order error:', error);
    return NextResponse.json({ 
      error: 'Unexpected error',
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}