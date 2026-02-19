import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseServer';

export async function GET() {
  // Disable in production for security
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Debug endpoints disabled in production' }, { status: 403 });
  }

  if (!supabase) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 });
  }

  const results: Record<string, any> = {};

  // Test fc_restaurants table
  try {
    const { data: restaurants, error: restaurantError } = await supabase
      .from('fc_restaurants')
      .select('id, name')
      .limit(3);

    results.fc_restaurants = {
      working: !restaurantError,
      count: restaurants?.length || 0,
      error: restaurantError?.message,
      sample: restaurants?.[0]?.name
    };
  } catch (err) {
    results.fc_restaurants = { working: false, error: err instanceof Error ? err.message : String(err) };
  }

  // Test fc_carts table
  try {
    const { data: carts, error: cartError } = await supabase
      .from('fc_carts')
      .select('id')
      .limit(3);

    results.fc_carts = {
      working: !cartError,
      count: carts?.length || 0,
      error: cartError?.message
    };
  } catch (err) {
    results.fc_carts = { working: false, error: err instanceof Error ? err.message : String(err) };
  }

  // Test fc_orders table
  try {
    const { data: orders, error: orderError } = await supabase
      .from('fc_orders')
      .select('id')
      .limit(1);

    results.fc_orders = {
      working: !orderError,
      count: orders?.length || 0,
      error: orderError?.message,
      code: orderError?.code
    };
  } catch (err) {
    results.fc_orders = { working: false, error: err instanceof Error ? err.message : String(err) };
  }

  // Test fc_order_items table
  try {
    const { data: orderItems, error: orderItemsError } = await supabase
      .from('fc_order_items')
      .select('id')
      .limit(1);

    results.fc_order_items = {
      working: !orderItemsError,
      count: orderItems?.length || 0,
      error: orderItemsError?.message,
      code: orderItemsError?.code
    };
  } catch (err) {
    results.fc_order_items = { working: false, error: err instanceof Error ? err.message : String(err) };
  }

  // Test fc_order_item_options table
  try {
    const { data: orderOptions, error: orderOptionsError } = await supabase
      .from('fc_order_item_options')
      .select('id')
      .limit(1);

    results.fc_order_item_options = {
      working: !orderOptionsError,
      count: orderOptions?.length || 0,
      error: orderOptionsError?.message,
      code: orderOptionsError?.code
    };
  } catch (err) {
    results.fc_order_item_options = { working: false, error: err instanceof Error ? err.message : String(err) };
  }

  return NextResponse.json({
    supabaseConnected: true,
    tables: results
  });
}