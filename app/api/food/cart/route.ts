import { NextResponse } from 'next/server';
import { DEMO_PROFILE_ID, supabase } from '@/lib/supabaseServer';

function ensureSupabase() {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to enable cart endpoints.',
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

export async function GET(req: Request) {
  if (!supabase) {
    return NextResponse.json(
      {
        success: false,
        message: 'Supabase is not configured for cart summaries.',
      },
      { status: 503 },
    );
  }

  try {
    const client = ensureSupabase();
    const url = new URL(req.url);
    const restaurantSlugParam = url.searchParams.get('restaurantSlug');
    const restaurantIdParam = url.searchParams.get('restaurantId');

    let restaurantIdFilter: string | null = restaurantIdParam;

    if (!restaurantIdFilter && restaurantSlugParam) {
      const { data: restaurant, error: restaurantError } = await client
        .from('fc_restaurants')
        .select('id')
        .ilike('slug', restaurantSlugParam)
        .maybeSingle();

      if (restaurantError) {
        console.error('[cart-api] restaurant lookup error', restaurantError);
      }

      restaurantIdFilter = restaurant?.id ?? null;
    }

    let cartQuery = client
      .from('fc_carts')
      .select('id, restaurant_id, status, subtotal, updated_at, restaurant:restaurant_id (slug, name)')
      .eq('profile_id', DEMO_PROFILE_ID)
      .eq('status', 'active')
      .order('updated_at', { ascending: false })
      .limit(1);

    if (restaurantIdFilter) {
      cartQuery = cartQuery.eq('restaurant_id', restaurantIdFilter);
    }

    const { data: cartRow, error: cartError } = await cartQuery.maybeSingle();

    if (cartError) {
      console.error('[cart-api] active cart query error', cartError);
      return NextResponse.json(
        {
          success: false,
          message: 'Unable to load cart right now.',
        },
        { status: 500 },
      );
    }

    if (!cartRow) {
      return NextResponse.json({
        success: true,
        cart: null,
      });
    }

    const { data: items, error: itemsError } = await client
      .from('fc_cart_items')
      .select(
        'id, cart_id, menu_item_id, quantity, base_price, total_price, instructions, menu_item:menu_item_id (slug, name)',
      )
      .eq('cart_id', cartRow.id);

    if (itemsError) {
      console.error('[cart-api] cart items error', itemsError);
      return NextResponse.json(
        {
          success: false,
          message: 'Unable to load cart items right now.',
        },
        { status: 500 },
      );
    }

    const cartItemIds = (items ?? []).map(item => item.id);
    let optionMap: Record<string, Array<{ id: string; label: string; priceAdjustment: number }>> = {};

    if (cartItemIds.length > 0) {
      const { data: options, error: optionsError } = await client
        .from('fc_cart_item_options')
        .select('id, cart_item_id, price_adjustment, choice:option_choice_id (label)')
        .in('cart_item_id', cartItemIds);

      if (optionsError) {
        console.error('[cart-api] cart item options error', optionsError);
        return NextResponse.json(
          {
            success: false,
            message: 'Unable to load cart options right now.',
          },
          { status: 500 },
        );
      }

      optionMap = (options ?? []).reduce<Record<string, Array<{ id: string; label: string; priceAdjustment: number }>>>(
        (acc, row) => {
          const choiceRelation = Array.isArray(row.choice) ? row.choice[0] : row.choice;
          const list = acc[row.cart_item_id] ?? [];
          list.push({
            id: row.id,
            label: choiceRelation?.label ?? 'Custom option',
            priceAdjustment: toNumber(row.price_adjustment),
          });
          acc[row.cart_item_id] = list;
          return acc;
        },
        {},
      );
    }

    const restaurantRelation = Array.isArray(cartRow.restaurant) ? cartRow.restaurant[0] : cartRow.restaurant;

    const cart = {
      id: cartRow.id,
      restaurantId: cartRow.restaurant_id,
      restaurantSlug: restaurantRelation?.slug ?? undefined,
      restaurantName: restaurantRelation?.name ?? undefined,
      status: cartRow.status,
      subtotal: toNumber(cartRow.subtotal),
      updatedAt: cartRow.updated_at ?? null,
      items: (items ?? []).map(item => {
        const menuItemRelation = Array.isArray(item.menu_item) ? item.menu_item[0] : item.menu_item;
        return {
          id: item.id,
          menuItemId: item.menu_item_id,
          menuItemSlug: menuItemRelation?.slug ?? undefined,
          name: menuItemRelation?.name ?? 'Menu item',
          quantity: item.quantity,
          basePrice: toNumber(item.base_price),
          totalPrice: toNumber(item.total_price),
          instructions: item.instructions ?? null,
          options: optionMap[item.id] ?? [],
        };
      }),
    };

    return NextResponse.json({
      success: true,
      cart,
    });
  } catch (error) {
    console.error('[cart-api] unexpected error', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Unexpected error while loading the cart.',
      },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  if (!supabase) {
    return NextResponse.json(
      {
        success: false,
        message: 'Supabase is not configured for cart actions.',
      },
      { status: 503 },
    );
  }

  try {
    const client = ensureSupabase();
    const { data: carts, error: cartsError } = await client
      .from('fc_carts')
      .select('id')
      .eq('profile_id', DEMO_PROFILE_ID)
      .eq('status', 'active');

    if (cartsError) {
      console.error('[cart-api] cart lookup error', cartsError);
      return NextResponse.json(
        {
          success: false,
          message: 'Unable to clear the cart right now.',
        },
        { status: 500 },
      );
    }

    if (!carts || carts.length === 0) {
      return NextResponse.json({
        success: true,
        cleared: false,
        message: 'No active cart to clear.',
      });
    }

    const cartIds = carts.map(cart => cart.id);

    const { error: deleteItemsError } = await client.from('fc_cart_items').delete().in('cart_id', cartIds);
    if (deleteItemsError) {
      console.error('[cart-api] delete cart items error', deleteItemsError);
      return NextResponse.json(
        {
          success: false,
          message: 'Unable to clear cart items right now.',
        },
        { status: 500 },
      );
    }

    const { error: resetCartError } = await client
      .from('fc_carts')
      .update({ subtotal: 0, updated_at: new Date().toISOString() })
      .in('id', cartIds);

    if (resetCartError) {
      console.error('[cart-api] reset cart error', resetCartError);
      return NextResponse.json(
        {
          success: false,
          message: 'Cart items removed but subtotal could not be updated.',
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      cleared: true,
    });
  } catch (error) {
    console.error('[cart-api] unexpected clear error', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Unexpected error while clearing the cart.',
      },
      { status: 500 },
    );
  }
}


