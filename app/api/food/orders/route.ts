import { NextResponse } from 'next/server';
import { DEMO_PROFILE_ID, supabase } from '@/lib/supabaseServer';

function ensureSupabase() {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to enable order endpoints.',
    );
  }
  return supabase;
}

function toNumber(value: unknown, defaultValue = 0): number {
  if (value == null) {
    return defaultValue;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? defaultValue : parsed;
}

export async function GET() {
  if (!supabase) {
    return NextResponse.json(
      {
        success: false,
        message: 'Supabase is not configured for orders.',
      },
      { status: 503 },
    );
  }

  try {
    const client = ensureSupabase();
    const { data, error } = await client
      .from('fc_orders')
      .select(
        'id, restaurant_name, cuisine, total, created_at, order_items:fc_order_items(id, name, quantity, total_price)',
      )
      .eq('profile_id', DEMO_PROFILE_ID)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('[orders-api] fetch orders error', error);
      return NextResponse.json(
        {
          success: false,
          message: 'Unable to load past orders.',
        },
        { status: 500 },
      );
    }

    const orders = (data ?? []).map(order => ({
      id: order.id,
      restaurantName: order.restaurant_name,
      cuisine: order.cuisine,
      total: toNumber(order.total),
      createdAt: order.created_at ?? null,
      items: (order.order_items ?? []).map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        totalPrice: toNumber(item.total_price),
      })),
    }));

    return NextResponse.json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error('[orders-api] unexpected error', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Unexpected error while loading orders.',
      },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  if (!supabase) {
    return NextResponse.json(
      {
        success: false,
        message: 'Supabase is not configured for orders.',
      },
      { status: 503 },
    );
  }

  try {
    const client = ensureSupabase();
    const url = new URL(req.url);
    const orderId = url.searchParams.get('orderId');

    if (orderId) {
      const { error: deleteItemsError } = await client.from('fc_order_items').delete().eq('order_id', orderId);
      if (deleteItemsError) {
        console.error('[orders-api] delete order items error', deleteItemsError);
        return NextResponse.json(
          {
            success: false,
            message: 'Unable to clear that order right now.',
          },
          { status: 500 },
        );
      }

      const { error: deleteOrderError } = await client.from('fc_orders').delete().eq('id', orderId);
      if (deleteOrderError) {
        console.error('[orders-api] delete order error', deleteOrderError);
        return NextResponse.json(
          {
            success: false,
            message: 'Order items cleared but the order could not be removed.',
          },
          { status: 500 },
        );
      }

      return NextResponse.json({
        success: true,
        cleared: 1,
      });
    }

    const { data: orders, error: ordersError } = await client
      .from('fc_orders')
      .select('id')
      .eq('profile_id', DEMO_PROFILE_ID);

    if (ordersError) {
      console.error('[orders-api] order list error', ordersError);
      return NextResponse.json(
        {
          success: false,
          message: 'Unable to look up orders to clear.',
        },
        { status: 500 },
      );
    }

    if (!orders || orders.length === 0) {
      return NextResponse.json({
        success: true,
        cleared: 0,
        message: 'No past orders to clear.',
      });
    }

    const orderIds = orders.map(order => order.id);

    const { error: deleteItemsError } = await client.from('fc_order_items').delete().in('order_id', orderIds);
    if (deleteItemsError) {
      console.error('[orders-api] bulk delete order items error', deleteItemsError);
      return NextResponse.json(
        {
          success: false,
          message: 'Unable to clear order items.',
        },
        { status: 500 },
      );
    }

    const { error: deleteOrdersError } = await client.from('fc_orders').delete().in('id', orderIds);
    if (deleteOrdersError) {
      console.error('[orders-api] bulk delete orders error', deleteOrdersError);
      return NextResponse.json(
        {
          success: false,
          message: 'Order items removed but orders could not be deleted.',
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      cleared: orderIds.length,
    });
  } catch (error) {
    console.error('[orders-api] unexpected error', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Unexpected error while clearing orders.',
      },
      { status: 500 },
    );
  }
}


