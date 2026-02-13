import { tool } from 'ai';
import { z } from 'zod';
import { DEMO_PROFILE_ID, supabase } from '@/lib/supabaseServer';
import {
  FALLBACK_PREFERENCES,
  FALLBACK_RESTAURANTS,
  SampleFoodPreferences,
  SampleRestaurant,
} from '@/data/foodCourtSamples';
import {
  SAMPLE_MENU_BY_RESTAURANT,
  MenuCategory,
  MenuItem,
} from '@/data/foodSampleMenu';

type RestaurantRecord = {
  id: string;
  name: string;
  cuisine_group: string;
  cuisine: string;
  rating?: number | null;
  eta_minutes?: number | null;
  closes_at?: string | null;
  standout_dish?: string | null;
  delivery_fee?: number | null;
  promo?: string | null;
  dietary_tags?: string[] | null;
  price_tier?: 'low' | 'medium' | 'high';
  hero_image?: string | null;
  address?: string | null;
  phone?: string | null;
  highlights?: string[] | null;
};

type PreferenceRecord = {
  id: string;
  favorite_cuisines?: string[] | null;
  disliked_cuisines?: string[] | null;
  dietary_tags?: string[] | null;
  spice_level?: 'low' | 'medium' | 'high' | null;
  budget_range?: 'value' | 'standard' | 'premium' | null;
  notes?: string | null;
  default_location?: {
    city?: string | null;
    state?: string | null;
    lat?: number | null;
    lng?: number | null;
  };
};

type HomepageLayoutRecord = {
  hero_restaurant_id?: string | null;
  focus_row?: string | null;
  demote_rows?: string[] | null;
  highlight_cuisine?: string | null;
  updated_at?: string | null;
};

type MenuSectionSummary = {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  position: number;
  items: MenuItemSummary[];
};

type MenuItemSummary = {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  price: number;
  tags: string[];
  calories?: number | null;
  rating?: number | null;
  sectionTitle?: string | null;
  restaurantId?: string | null;
  restaurantSlug?: string | null;
  restaurantName?: string | null;
  image?: string | null;
};

type CartSummary = {
  id: string;
  restaurantId: string;
  restaurantSlug?: string;
  restaurantName?: string;
  status: string;
  subtotal: number;
  items: CartItemSummary[];
  updatedAt?: string | null;
};

type CartItemSummary = {
  id: string;
  menuItemId: string;
  menuItemSlug?: string;
  name: string;
  quantity: number;
  basePrice: number;
  totalPrice: number;
  options: CartItemOptionSummary[];
  instructions?: string | null;
};

type CartItemOptionSummary = {
  id: string;
  label: string;
  priceAdjustment: number;
};

const FALLBACK_RESTAURANT_RECORDS: RestaurantRecord[] = FALLBACK_RESTAURANTS.map(
  (restaurant: SampleRestaurant): RestaurantRecord => ({
    id: restaurant.id,
    name: restaurant.name,
    cuisine_group: restaurant.cuisine_group,
    cuisine: restaurant.cuisine,
    rating: restaurant.rating,
    eta_minutes: restaurant.eta_minutes,
    closes_at: restaurant.closes_at,
    standout_dish: restaurant.standout_dish,
    delivery_fee: restaurant.delivery_fee,
    promo: restaurant.promo,
    dietary_tags: restaurant.dietary_tags,
    price_tier: restaurant.price_tier,
    hero_image: restaurant.hero_image ?? null,
    address: restaurant.address ?? null,
    phone: restaurant.phone ?? null,
    highlights: restaurant.highlights ?? null,
  }),
);

const FALLBACK_PREFERENCE_RECORD: PreferenceRecord = {
  id: DEMO_PROFILE_ID,
  favorite_cuisines: (FALLBACK_PREFERENCES as SampleFoodPreferences).favorite_cuisines ?? [],
  disliked_cuisines: FALLBACK_PREFERENCES.disliked_cuisines ?? [],
  dietary_tags: FALLBACK_PREFERENCES.dietary_tags ?? [],
  spice_level: FALLBACK_PREFERENCES.spice_level ?? 'medium',
  budget_range: FALLBACK_PREFERENCES.budget_range ?? 'standard',
  notes: FALLBACK_PREFERENCES.notes ?? null,
};

function formatList(values?: string[] | null): string {
  if (!values || values.length === 0) {
    return '';
  }
  if (values.length === 1) {
    return values[0];
  }
  if (values.length === 2) {
    return `${values[0]} and ${values[1]}`;
  }
  const leading = values.slice(0, -1).join(', ');
  const trailing = values[values.length - 1];
  return `${leading}, and ${trailing}`;
}

function toNumber(value: unknown, defaultValue = 0): number {
  if (value == null) {
    return defaultValue;
  }
  if (typeof value === 'number') {
    return Number.isNaN(value) ? defaultValue : value;
  }
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return Number.isNaN(parsed) ? defaultValue : parsed;
  }
  return defaultValue;
}

function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

const PEXELS_API_KEY = process.env.PEXELS_API_KEY ?? '';

async function fetchImageFromPexels(query: string): Promise<string | null> {
  if (!PEXELS_API_KEY) {
    return null;
  }

  try {
    const params = new URLSearchParams({
      query,
      per_page: '1',
      orientation: 'landscape',
    });
    const response = await fetch(`https://api.pexels.com/v1/search?${params.toString()}`, {
      headers: {
        Authorization: PEXELS_API_KEY,
      },
    });

    if (!response.ok) {
      console.warn('[food-tools] Pexels request failed', await response.text());
      return null;
    }

    const data = (await response.json()) as {
      photos?: Array<{ src?: { large?: string; medium?: string; original?: string } }>;
    };

    const photo = data.photos?.[0];
    return photo?.src?.large ?? photo?.src?.medium ?? photo?.src?.original ?? null;
  } catch (error) {
    console.error('[food-tools] Pexels fetch error', error);
    return null;
  }
}

async function ensureMenuItemImage({
  restaurant,
  itemId,
  itemSlug,
  itemName,
}: {
  restaurant?: { id?: string | null; slug?: string | null; name?: string | null };
  itemId?: string | null;
  itemSlug?: string | null;
  itemName?: string | null;
}): Promise<string | null> {
  const slug = itemSlug ?? itemName?.toLowerCase().replace(/\s+/g, '-');

  if (supabase && (itemId || slug)) {
    const client = ensureSupabase();

    const { data: existing, error: existingError } = await client
      .from('fc_menu_items')
      .select('id, image, name')
      .eq(itemId ? 'id' : 'slug', itemId ?? slug!)
      .maybeSingle();

    if (!existingError && existing?.image) {
      return existing.image;
    }

    const searchName = existing?.name ?? itemName ?? slug ?? 'Food';
    const fetched = await fetchImageFromPexels(`${restaurant?.name ?? ''} ${searchName}`.trim());

    if (fetched && existing?.id) {
      const { error: updateError } = await client
        .from('fc_menu_items')
        .update({ image: fetched, updated_at: new Date().toISOString() })
        .eq('id', existing.id);

      if (updateError) {
        console.error('[food-tools] ensureMenuItemImage update error', updateError);
      }
    }

    return fetched;
  }

  const searchName = itemName ?? slug ?? 'Food';
  return fetchImageFromPexels(`${restaurant?.name ?? ''} ${searchName}`.trim());
}

async function resolveRestaurantIdentifier({
  restaurantId,
  restaurantSlug,
}: {
  restaurantId?: string | null;
  restaurantSlug?: string | null;
}): Promise<{ id: string; slug: string; name: string } | null> {
  const slugCandidate = restaurantSlug?.toLowerCase();

  if (supabase) {
    const client = ensureSupabase();

    if (restaurantId) {
      const { data, error } = await client
        .from('fc_restaurants')
        .select('id, slug, name')
        .eq('id', restaurantId)
        .maybeSingle();

      if (!error && data) {
        return {
          id: data.id,
          slug: (data.slug ?? slugCandidate ?? data.id).toLowerCase(),
          name: data.name,
        };
      }
    }

    if (slugCandidate) {
      const { data, error } = await client
        .from('fc_restaurants')
        .select('id, slug, name')
        .ilike('slug', slugCandidate)
        .maybeSingle();

      if (!error && data) {
        return {
          id: data.id,
          slug: (data.slug ?? slugCandidate).toLowerCase(),
          name: data.name,
        };
      }
    }
  }

  const fallbackMatch = FALLBACK_RESTAURANTS.find(restaurant => {
    if (restaurantId && restaurant.id === restaurantId) {
      return true;
    }
    if (slugCandidate && restaurant.id.toLowerCase() === slugCandidate) {
      return true;
    }
    return false;
  });

  if (fallbackMatch) {
    return {
      id: fallbackMatch.id,
      slug: fallbackMatch.id,
      name: fallbackMatch.name,
    };
  }

  return null;
}

function buildFallbackMenuSections(restaurantSlug: string): MenuSectionSummary[] {
  const categories: MenuCategory[] = SAMPLE_MENU_BY_RESTAURANT[restaurantSlug] ?? [];

  return categories.map((category, sectionIndex) => ({
    id: `${restaurantSlug}-${category.slug}`,
    slug: category.slug,
    title: category.title,
    description: category.description ?? null,
    position: sectionIndex,
    items: (category.items ?? []).map((item: MenuItem, itemIndex) => ({
      id: `${restaurantSlug}-${item.slug ?? itemIndex}`,
      slug: item.slug,
      name: item.name,
      description: item.description ?? null,
      price: toNumber(item.price),
      tags: item.tags ?? [],
      calories: item.calories ?? null,
      rating: item.rating ?? null,
      sectionTitle: category.title,
      image: item.image ?? null,
    })),
  }));
}

async function fetchSupabaseMenuSections(restaurantId: string): Promise<MenuSectionSummary[]> {
  const client = ensureSupabase();
  const { data, error } = await client
    .from('fc_menu_sections_with_items')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('section_position', { ascending: true });

  if (error) {
    console.error('[food-tools] fetchSupabaseMenuSections error', error);
    return [];
  }

  return (data ?? []).map(section => ({
    id: section.section_id,
    slug: section.section_slug,
    title: section.section_title,
    description: section.section_description ?? null,
    position: section.section_position ?? 0,
    items: Array.isArray(section.items)
      ? section.items.map((item: any, index: number) => ({
          id: item.id ?? `${section.section_id}-item-${index}`,
          slug: item.slug ?? `item-${index}`,
          name: item.name,
          description: item.description ?? null,
          price: toNumber(item.base_price),
          tags: Array.isArray(item.tags) ? item.tags : [],
          calories: item.calories ?? null,
          rating: item.rating != null ? toNumber(item.rating) : null,
          sectionTitle: section.section_title,
          image: item.image ?? null,
        }))
      : [],
  }));
}

async function fetchSupabaseMenuItems(restaurantId?: string): Promise<MenuItemSummary[]> {
  const client = ensureSupabase();
  let query = client
    .from('fc_menu_items')
    .select(
      'id, slug, name, description, base_price, calories, rating, tags, image, section:section_id (id, title), restaurant:restaurant_id (id, slug, name)'
    )
    .eq('is_available', true)
    .order('position', { ascending: true });

  if (restaurantId) {
    query = query.eq('restaurant_id', restaurantId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[food-tools] fetchSupabaseMenuItems error', error);
    return [];
  }

  return (data ?? []).map(item => {
    const sectionRelation = Array.isArray(item.section) ? item.section[0] : item.section;
    const restaurantRelation = Array.isArray(item.restaurant) ? item.restaurant[0] : item.restaurant;

    return {
      id: item.id,
      slug: item.slug,
      name: item.name,
      description: item.description ?? null,
      price: toNumber(item.base_price),
      tags: Array.isArray(item.tags) ? item.tags : [],
      calories: item.calories ?? null,
      rating: item.rating != null ? toNumber(item.rating) : null,
      sectionTitle: sectionRelation?.title ?? null,
      restaurantId: restaurantRelation?.id ?? restaurantId ?? null,
      restaurantSlug: restaurantRelation?.slug ?? null,
      restaurantName: restaurantRelation?.name ?? null,
      image: item.image ?? null,
    };
  });
}

function searchFallbackMenuItems({
  restaurantSlug,
  query,
  maxPrice,
  tags,
}: {
  restaurantSlug?: string | null;
  query?: string | null;
  maxPrice?: number | null;
  tags?: string[] | null;
}): MenuItemSummary[] {
  const slugsToSearch = restaurantSlug
    ? [restaurantSlug]
    : Object.keys(SAMPLE_MENU_BY_RESTAURANT);

  const normalizedQuery = query?.trim().toLowerCase();
  const normalizedTags = (tags ?? []).map(tag => tag.toLowerCase());

  const results: MenuItemSummary[] = [];

  slugsToSearch.forEach(slug => {
    const sections = buildFallbackMenuSections(slug);
    sections.forEach(section => {
      section.items.forEach(item => {
        if (normalizedQuery) {
          const haystack = `${item.name} ${item.description ?? ''}`.toLowerCase();
          if (!haystack.includes(normalizedQuery)) {
            return;
          }
        }

        if (typeof maxPrice === 'number' && item.price > maxPrice) {
          return;
        }

        if (normalizedTags.length > 0) {
          const itemTags = (item.tags ?? []).map(tag => tag.toLowerCase());
          const allMatched = normalizedTags.every(tag => itemTags.includes(tag));
          if (!allMatched) {
            return;
          }
        }

        results.push({
          ...item,
          sectionTitle: section.title,
          image: item.image ?? null,
        });
      });
    });
  });

  return results;
}

async function ensureActiveCart(restaurantId: string): Promise<{ id: string; created: boolean }> {
  const client = ensureSupabase();
  const { data: existing, error: existingError } = await client
    .from('fc_carts')
    .select('id')
    .eq('profile_id', DEMO_PROFILE_ID)
    .eq('restaurant_id', restaurantId)
    .eq('status', 'active')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!existingError && existing?.id) {
    return { id: existing.id, created: false };
  }

  const { data, error } = await client
    .from('fc_carts')
    .insert({
      profile_id: DEMO_PROFILE_ID,
      restaurant_id: restaurantId,
      status: 'active',
      subtotal: 0,
    })
    .select('id')
    .single();

  if (error || !data?.id) {
    throw error ?? new Error('Failed to create cart');
  }

  return { id: data.id, created: true };
}

async function recalculateCartSubtotal(cartId: string): Promise<number> {
  const client = ensureSupabase();
  const { data, error } = await client
    .from('fc_cart_items')
    .select('total_price')
    .eq('cart_id', cartId);

  if (error) {
    console.error('[food-tools] recalculateCartSubtotal error', error);
    throw error;
  }

  const subtotal = (data ?? []).reduce((sum, row) => sum + toNumber(row.total_price), 0);

  const { error: updateError } = await client
    .from('fc_carts')
    .update({ subtotal, updated_at: new Date().toISOString() })
    .eq('id', cartId);

  if (updateError) {
    console.error('[food-tools] recalculateCartSubtotal update error', updateError);
    throw updateError;
  }

  return subtotal;
}

async function fetchCartSummary(cartId: string): Promise<CartSummary | null> {
  if (!supabase) {
    console.log('[DEBUG] fetchCartSummary: No Supabase client');
    return null;
  }

  console.log('[DEBUG] fetchCartSummary: Starting with cartId:', cartId);

  const client = ensureSupabase();

  const { data: cart, error: cartError } = await client
    .from('fc_carts')
    .select('id, restaurant_id, status, subtotal, updated_at, restaurant:restaurant_id (slug, name)')
    .eq('id', cartId)
    .maybeSingle();

  if (cartError || !cart) {
    if (cartError) {
      console.error('[DEBUG] fetchCartSummary cart error:', cartError);
    } else {
      console.log('[DEBUG] fetchCartSummary: No cart found for ID:', cartId);
    }
    return null;
  }

  console.log('[DEBUG] fetchCartSummary: Cart found:', {
    id: cart.id,
    restaurant_id: cart.restaurant_id,
    status: cart.status,
    subtotal: cart.subtotal
  });

  const { data: items, error: itemsError } = await client
    .from('fc_cart_items')
    .select('id, cart_id, menu_item_id, quantity, base_price, total_price, instructions, menu_item:menu_item_id (slug, name)')
    .eq('cart_id', cartId);

  if (itemsError) {
    console.error('[DEBUG] fetchCartSummary items error:', itemsError);
    return null;
  }

  console.log('[DEBUG] fetchCartSummary: Found', items?.length || 0, 'cart items');

  const cartItemIds = (items ?? []).map(item => item.id);

  let optionMap: Record<string, CartItemOptionSummary[]> = {};

  if (cartItemIds.length > 0) {
    const { data: options, error: optionsError } = await client
      .from('fc_cart_item_options')
      .select('id, cart_item_id, price_adjustment, choice:option_choice_id (label)')
      .in('cart_item_id', cartItemIds);

    if (optionsError) {
      console.error('[DEBUG] fetchCartSummary options error:', optionsError);
      return null;
    }

    console.log('[DEBUG] fetchCartSummary: Found', options?.length || 0, 'cart item options');

    optionMap = (options ?? []).reduce<Record<string, CartItemOptionSummary[]>>((acc, row) => {
      const choiceRelation = Array.isArray(row.choice) ? row.choice[0] : row.choice;
      const list = acc[row.cart_item_id] ?? [];
      list.push({
        id: row.id,
        label: choiceRelation?.label ?? 'Custom option',
        priceAdjustment: toNumber(row.price_adjustment),
      });
      acc[row.cart_item_id] = list;
      return acc;
    }, {});
  }

  const cartItems: CartItemSummary[] = (items ?? []).map(item => {
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
  });

  const restaurantRelation = Array.isArray(cart.restaurant) ? cart.restaurant[0] : cart.restaurant;

  return {
    id: cart.id,
    restaurantId: cart.restaurant_id,
    restaurantSlug: restaurantRelation?.slug ?? undefined,
    restaurantName: restaurantRelation?.name ?? undefined,
    status: cart.status,
    subtotal: toNumber(cart.subtotal),
    items: cartItems,
    updatedAt: cart.updated_at ?? null,
  };
}

async function submitCartToOrder(cartId: string): Promise<{ orderId: string; subtotal: number; itemCount: number } | null> {
  if (!supabase) {
    console.log('[DEBUG] submitCartToOrder: No Supabase client');
    return null;
  }

  console.log('[DEBUG] submitCartToOrder: Starting with cartId:', cartId);
  
  const client = ensureSupabase();
  const summary = await fetchCartSummary(cartId);
  if (!summary) {
    console.log('[DEBUG] submitCartToOrder: fetchCartSummary returned null');
    return null;
  }

  console.log('[DEBUG] submitCartToOrder: Cart summary:', {
    restaurantId: summary.restaurantId,
    subtotal: summary.subtotal,
    itemCount: summary.items.length
  });

  const { data: restaurant, error: restaurantError } = await client
    .from('fc_restaurants')
    .select('id, name, cuisine')
    .eq('id', summary.restaurantId)
    .maybeSingle();

  if (restaurantError) {
    console.error('[DEBUG] submitCartToOrder restaurant error:', restaurantError);
  } else {
    console.log('[DEBUG] submitCartToOrder: Restaurant found:', restaurant);
  }

  console.log('[DEBUG] submitCartToOrder: Creating order with data:', {
    profile_id: DEMO_PROFILE_ID,
    restaurant_id: summary.restaurantId,
    restaurant_name: restaurant?.name ?? summary.restaurantName ?? 'Food Court restaurant',
    order_number: `FC-${Date.now()}`,
    total: summary.subtotal,
    subtotal: summary.subtotal,
    total_amount: summary.subtotal,
    status: 'confirmed',
    delivery_address: '123 Demo Street, Demo City, DC 12345'
  });

  const { data: order, error: orderError } = await client
    .from('fc_orders')
    .insert({
      profile_id: DEMO_PROFILE_ID,
      restaurant_id: summary.restaurantId,
      restaurant_name: restaurant?.name ?? summary.restaurantName ?? 'Food Court restaurant',
      order_number: `FC-${Date.now()}`,
      total: summary.subtotal,
      subtotal: summary.subtotal,
      total_amount: summary.subtotal,
      status: 'confirmed',
      delivery_address: '123 Demo Street, Demo City, DC 12345'
    })
    .select('id')
    .single();

  if (orderError || !order?.id) {
    console.error('[DEBUG] submitCartToOrder order creation failed:', orderError);
    return null;
  }

  console.log('[DEBUG] submitCartToOrder: Order created with ID:', order.id);

  for (const item of summary.items) {
    console.log('[DEBUG] submitCartToOrder: Processing item:', item.name);
    
    const { data: insertedItem, error: insertItemError } = await client
      .from('fc_order_items')
      .insert({
        order_id: order.id,
        menu_item_id: item.menuItemId,
        name: item.name,
        quantity: item.quantity,
        base_price: item.basePrice,
        total_price: item.totalPrice,
        notes: item.instructions ?? null,
      })
      .select('id')
      .single();

    if (insertItemError || !insertedItem?.id) {
      console.error('[DEBUG] submitCartToOrder order item error:', insertItemError);
      continue;
    }

    if (item.options.length > 0) {
      const optionPayload = item.options.map(option => ({
        order_item_id: insertedItem.id,
        label: option.label,
        price_adjustment: option.priceAdjustment,
      }));

      const { error: optionInsertError } = await client
        .from('fc_order_item_options')
        .insert(optionPayload);

      if (optionInsertError) {
        console.error('[DEBUG] submitCartToOrder option insert error:', optionInsertError);
      }
    }
  }

  const { error: cartUpdateError } = await client
    .from('fc_carts')
    .update({ status: 'ordered', updated_at: new Date().toISOString() })
    .eq('id', cartId);

  if (cartUpdateError) {
    console.error('[DEBUG] submitCartToOrder cart update error:', cartUpdateError);
  }

  console.log('[DEBUG] submitCartToOrder: Success! Returning:', {
    orderId: order.id,
    subtotal: summary.subtotal,
    itemCount: summary.items.length,
  });

  return {
    orderId: order.id,
    subtotal: summary.subtotal,
    itemCount: summary.items.length,
  };
}

function ensureSupabase() {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to enable data-driven Food Court tools.',
    );
  }
  return supabase;
}

function normalizeRestaurants(records: RestaurantRecord[]) {
  return records.map(record => ({
    id: record.id,
    name: record.name,
    cuisine: record.cuisine,
    cuisineGroup: record.cuisine_group,
    rating: record.rating ?? null,
    etaMinutes: record.eta_minutes ?? null,
    closesAt: record.closes_at ?? null,
    standoutDish: record.standout_dish ?? null,
    deliveryFee: record.delivery_fee ?? null,
    promo: record.promo ?? null,
  }));
}

async function fetchMenuItemDetail({
  restaurant,
  menuItemId,
  menuItemSlug,
  menuItemName,
}: {
  restaurant?: { id?: string | null; slug?: string | null; name?: string | null };
  menuItemId?: string | null;
  menuItemSlug?: string | null;
  menuItemName?: string | null;
}): Promise<MenuItemSummary | null> {
  const normalizedSlug = menuItemSlug?.toLowerCase() ?? null;
  const normalizedName = menuItemName?.toLowerCase() ?? null;

  if (supabase) {
    const client = ensureSupabase();
    try {
      let detailQuery = client
        .from('fc_menu_items')
        .select(
          'id, slug, name, description, base_price, calories, rating, tags, image, section_id, restaurant_id',
        )
        .eq('is_available', true)
        .limit(1);

      if (restaurant?.id) {
        detailQuery = detailQuery.eq('restaurant_id', restaurant.id);
      }

      if (menuItemId) {
        detailQuery = detailQuery.eq('id', menuItemId);
      } else if (normalizedSlug) {
        detailQuery = detailQuery.ilike('slug', normalizedSlug);
      } else if (normalizedName) {
        detailQuery = detailQuery.ilike('name', normalizedName);
      }

      const { data, error } = await detailQuery.maybeSingle();

      if (!error && data) {
        let sectionTitle: string | null = null;

        if (data.section_id) {
          const { data: sectionRow } = await client
            .from('fc_menu_sections')
            .select('title')
            .eq('id', data.section_id)
            .maybeSingle();
          sectionTitle = sectionRow?.title ?? null;
        }

        return {
          id: data.id,
          slug: data.slug,
          name: data.name,
          description: data.description ?? null,
          price: toNumber(data.base_price),
          tags: Array.isArray(data.tags) ? data.tags : [],
          calories: data.calories ?? null,
          rating: data.rating != null ? toNumber(data.rating) : null,
          sectionTitle,
          restaurantId: data.restaurant_id ?? restaurant?.id ?? null,
          restaurantSlug: restaurant?.slug ?? null,
          restaurantName: restaurant?.name ?? null,
          image: data.image ?? null,
        };
      }
    } catch (error) {
      console.error('[food-tools] fetchMenuItemDetail supabase error', error);
    }
  }

  const fallbackSlug =
    restaurant?.slug ??
    restaurant?.name?.toLowerCase().replace(/\s+/g, '-') ??
    null;

  const fallbackCategories = fallbackSlug
    ? SAMPLE_MENU_BY_RESTAURANT[fallbackSlug] ?? []
    : Object.values(SAMPLE_MENU_BY_RESTAURANT).flat();

  for (const category of fallbackCategories) {
    const items = category?.items ?? [];
    for (const item of items) {
      const itemIdValue = (item as { id?: string | null }).id ?? null;
      const itemSlug = item.slug ?? item.name?.toLowerCase().replace(/\s+/g, '-');
      const slugMatches = normalizedSlug && itemSlug
        ? itemSlug.toLowerCase() === normalizedSlug
        : false;
      const nameMatches = normalizedName && item.name
        ? item.name.toLowerCase() === normalizedName
        : false;
      const idMatches = menuItemId && itemIdValue ? itemIdValue === menuItemId : false;

      if (slugMatches || nameMatches || idMatches) {
        return {
          id: itemIdValue ?? menuItemId ?? '',
          slug: item.slug ?? itemSlug ?? '',
          name: item.name,
          description: item.description ?? null,
          price: toNumber(item.price),
          tags: Array.isArray(item.tags) ? item.tags : [],
          calories: item.calories ?? null,
          rating: item.rating ?? null,
          sectionTitle: category.title ?? null,
          restaurantId: restaurant?.id ?? null,
          restaurantSlug: restaurant?.slug ?? fallbackSlug ?? null,
          restaurantName: restaurant?.name ?? null,
          image: item.image ?? null,
        };
      }
    }
  }

  return null;
}

async function fetchFoodPreferences(): Promise<PreferenceRecord> {
  if (!supabase) {
    return FALLBACK_PREFERENCE_RECORD;
  }

  const client = ensureSupabase();
  const { data, error } = await client
    .from('fc_preferences')
    .select('*, profile:fc_profiles(default_location)')
    .eq('profile_id', DEMO_PROFILE_ID)
    .maybeSingle();

  if (error) {
    console.error('[food-tools] fetchFoodPreferences error', error);
    return FALLBACK_PREFERENCE_RECORD;
  }

  if (!data) {
    return FALLBACK_PREFERENCE_RECORD;
  }

  return {
    id: DEMO_PROFILE_ID,
    favorite_cuisines: data.favorite_cuisines ?? [],
    disliked_cuisines: data.disliked_cuisines ?? [],
    dietary_tags: data.dietary_tags ?? [],
    spice_level: data.spice_level ?? 'medium',
    budget_range: data.budget_range ?? 'standard',
    notes: data.notes ?? null,
    default_location: data.profile?.default_location ?? null,
  };
}

async function fetchRecentOrders() {
  if (!supabase) {
    return [];
  }

  const client = ensureSupabase();
  const { data, error } = await client
    .from('fc_orders')
    .select('restaurant_id, restaurant_name, cuisine, created_at')
    .eq('profile_id', DEMO_PROFILE_ID)
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('[food-tools] fetchRecentOrders error', error);
    return [];
  }

  return data ?? [];
}

async function fetchRestaurantRecords(filters: {
  cuisine?: string;
  subCuisine?: string;
  dietaryTags?: string[];
  closesWithinMinutes?: number;
  budget?: 'low' | 'medium' | 'high';
  limit?: number;
  currentLocation?: {
    city?: string | null;
    state?: string | null;
    lat?: number | null;
    lng?: number | null;
  };
  useDefaultLocation?: boolean;
}): Promise<RestaurantRecord[]> {
  if (!supabase) {
    // Fallback data filtering
    let filtered = FALLBACK_RESTAURANT_RECORDS;
    if (filters.cuisine) {
      const target = filters.cuisine.toLowerCase();
      filtered = filtered.filter(r => {
        const group = (r.cuisine_group ?? '').toLowerCase();
        const cuisine = (r.cuisine ?? '').toLowerCase();
        return group === target || cuisine === target;
      });
    }
    if (filters.subCuisine) {
      const target = filters.subCuisine.toLowerCase();
      filtered = filtered.filter(r => (r.cuisine ?? '').toLowerCase() === target);
    }
    if (filters.dietaryTags && filters.dietaryTags.length > 0) {
      const lowerTags = filters.dietaryTags.map(tag => tag.toLowerCase());
      filtered = filtered.filter(r => {
        const restaurantTags = (r.dietary_tags ?? []).map(tag => tag.toLowerCase());
        return lowerTags.some(tag => restaurantTags.includes(tag));
      });
    }
    if (filters.budget) {
      filtered = filtered.filter(r => r.price_tier === filters.budget);
    }
    return filtered.slice(0, filters.limit ?? 5);
  }

  const client = ensureSupabase();
  let query = client.from('fc_restaurants').select('*').eq('is_active', true);

  // Get default location if needed
  let locationToUse = filters.currentLocation;
  if (filters.useDefaultLocation && !locationToUse) {
    const { data: profileData } = await client
      .from('fc_preferences')
      .select('*, profile:fc_profiles(default_location)')
      .eq('profile_id', DEMO_PROFILE_ID)
      .single();
    locationToUse = profileData?.profile?.default_location as any;
  }

  // Filter by location (Orlando metro area)
  if (locationToUse?.city?.toLowerCase() === 'orlando') {
    // Include Orlando metro area cities
    query = query.or('address.ilike.%Orlando%,address.ilike.%Winter Park%,address.ilike.%Maitland%,address.ilike.%Altamonte Springs%');
  } else if (locationToUse?.city) {
    query = query.ilike('address', `%${locationToUse.city}%`);
  }
  if (locationToUse?.state) {
    query = query.ilike('address', `%${locationToUse.state}%`);
  }

  if (filters.cuisine) {
    const lowerCuisine = filters.cuisine.toLowerCase();
    query = query.or(`cuisine_group.ilike.${lowerCuisine},cuisine.ilike.${lowerCuisine}`);
  }
  if (filters.subCuisine) {
    query = query.ilike('cuisine', filters.subCuisine);
  }
  if (filters.dietaryTags && filters.dietaryTags.length > 0) {
    // Use OR logic - restaurant needs ANY of the dietary tags, not ALL
    query = query.overlaps('dietary_tags', filters.dietaryTags);
  }
  if (filters.budget) {
    query = query.eq('price_tier', filters.budget);
  }
  if (filters.closesWithinMinutes) {
    const closingThreshold = new Date(Date.now() + filters.closesWithinMinutes * 60 * 1000).toISOString();
    query = query.lte('closes_at', closingThreshold);
  }

  const limit = Math.min(filters.limit ?? 5, 10);
  query = query.order('closes_at', { ascending: true }).limit(limit * 2);

  const { data, error } = await query;
  if (error) {
    console.error('[food-tools] fetchRestaurantRecords error', error);
    return [];
  }

  return (data as RestaurantRecord[])?.slice(0, limit) ?? [];
}

export const foodTools = {
  getUserContext: tool({
    description: 'Fetch household food preferences, dietary tags, and recent orders for the Food Court concierge.',
    inputSchema: z.object({}).strip(),
    outputSchema: z.string(),
    async execute() {
      const [preferences, recentOrders] = await Promise.all([
        fetchFoodPreferences(),
        fetchRecentOrders(),
      ]);

      const summaryPieces: string[] = [];
      const spokenSegments: string[] = [];
      try {
        if ((preferences.favorite_cuisines ?? []).length > 0) {
          summaryPieces.push(`Favorites: ${(preferences.favorite_cuisines ?? []).slice(0, 4).join(', ')}`);
          spokenSegments.push(`favorites include ${formatList(preferences.favorite_cuisines ?? [])}`);
        }
        if ((preferences.dietary_tags ?? []).length > 0) {
          summaryPieces.push(`Dietary: ${(preferences.dietary_tags ?? []).join(', ')}`);
          spokenSegments.push(`dietary focus on ${formatList(preferences.dietary_tags ?? [])}`);
        }
        if ((preferences.budget_range ?? '').length > 0) {
          summaryPieces.push(`Budget: ${preferences.budget_range}`);
          spokenSegments.push(`budget set to ${preferences.budget_range}`);
        }
        const recent = (recentOrders ?? []).slice(0, 3).map(order => `${order.restaurant_name} (${order.cuisine})`);
        if (recent.length > 0) {
          summaryPieces.push(`Recent: ${recent.join(', ')}`);
          const recentNames = (recentOrders ?? []).slice(0, 3).map(order => order.restaurant_name ?? '');
          const filteredNames = recentNames.filter(name => name.trim().length > 0);
          if (filteredNames.length > 0) {
            spokenSegments.push(`recent orders like ${formatList(filteredNames.slice(0, 2))}`);
          }
        }
        
        if ((preferences.spice_level ?? '').length > 0) {
          spokenSegments.push(`spice level at ${preferences.spice_level}`);
        }
      } catch (arrayError) {
        console.error('[food-tools] getUserContext array processing error:', arrayError);
        // Fallback data
        summaryPieces.push('Favorites: thai, indian, caribbean');
        summaryPieces.push('Dietary: healthy, high-protein');
        summaryPieces.push('Budget: standard');
      }

      const preferenceSnapshot =
        spokenSegments.length > 0
          ? `Profile loaded with ${spokenSegments.join(', ')}.`
          : 'Profile loaded and ready to help.';

      const spokenSummary = preferences.default_location?.city
        ? `${preferenceSnapshot} I’ll use ${preferences.default_location.city} unless you prefer another area.`
        : `${preferenceSnapshot} Could you share your delivery city or neighborhood so I can check what’s nearby?`;

      return JSON.stringify({
        profile: {
          favoriteCuisines: preferences.favorite_cuisines ?? [],
          dislikedCuisines: preferences.disliked_cuisines ?? [],
          dietaryTags: preferences.dietary_tags ?? [],
          spiceLevel: preferences.spice_level ?? 'medium',
          budgetRange: preferences.budget_range ?? 'standard',
          notes: preferences.notes ?? undefined,
          defaultLocation: preferences.default_location ?? undefined,
        },
        recentOrders,
        speechSummary: spokenSummary,
        lastUpdated: new Date().toISOString(),
        summary: summaryPieces.join(' | ') || 'Food preferences loaded. Ready to assist.',
      });
    },
  }),
  searchRestaurants: tool({
    description:
      'Search Food Court restaurants by cuisine, sub-cuisine, dietary tags, closing window, and budget. Returns records sorted by closing time.',
    inputSchema: z.object({
      cuisine: z.string().optional(),
      subCuisine: z.string().optional(),
      dietaryTags: z.array(z.string()).optional(),
      closesWithinMinutes: z.number().int().positive().max(240).optional(),
      budget: z.enum(['low', 'medium', 'high']).optional(),
      limit: z.number().int().min(1).max(10).default(5),
      currentLocation: z
        .object({
          city: z.string().optional(),
          state: z.string().optional(),
          lat: z.number().optional(),
          lng: z.number().optional(),
        })
        .optional(),
      useDefaultLocation: z.boolean().default(true).optional(),
    }),
    outputSchema: z.string(),
    async execute({
      cuisine,
      subCuisine,
      dietaryTags,
      closesWithinMinutes,
      budget,
      limit,
      currentLocation,
      useDefaultLocation,
    }) {
      const restaurants = await fetchRestaurantRecords({
        cuisine,
        subCuisine,
        dietaryTags,
        closesWithinMinutes,
        budget,
        limit,
        currentLocation,
        useDefaultLocation,
      });

      return JSON.stringify({
        filters: {
          cuisine,
          subCuisine,
          dietaryTags,
          closesWithinMinutes,
          budget,
          currentLocation,
          useDefaultLocation,
        },
        results: normalizeRestaurants(restaurants),
        speechSummary:
          restaurants.length > 0
            ? `Found ${restaurants.length} options${closesWithinMinutes ? ' closing soon' : ''}.`
            : 'No restaurants match those filters right now.',
      });
    },
  }),
  getRestaurantMenu: tool({
    description:
      'Fetch menu sections and items for a restaurant so you can describe dishes and prices.',
    inputSchema: z
      .object({
        restaurantId: z.string().uuid().optional(),
        restaurantSlug: z.string().optional(),
        limitSections: z.number().int().min(1).max(10).optional(),
        limitItemsPerSection: z.number().int().min(1).max(20).optional(),
      })
      .refine(
        value => Boolean(value.restaurantId || value.restaurantSlug),
        { message: 'Provide either restaurantId or restaurantSlug.' },
      ),
    outputSchema: z.string(),
    async execute({ restaurantId, restaurantSlug, limitSections, limitItemsPerSection }) {
      const restaurant = await resolveRestaurantIdentifier({ restaurantId, restaurantSlug });

      if (!restaurant) {
        const message = 'I could not find that restaurant right now.';
        return JSON.stringify({
          success: false,
          message,
          speechSummary: message,
        });
      }

      let sections: MenuSectionSummary[] = [];

      if (supabase) {
        sections = await fetchSupabaseMenuSections(restaurant.id);
      }

      if (sections.length === 0) {
        sections = buildFallbackMenuSections(restaurant.slug);
      }

      if (limitSections) {
        sections = sections.slice(0, limitSections);
      }

      if (limitItemsPerSection) {
        sections = sections.map(section => ({
          ...section,
          items: section.items.slice(0, limitItemsPerSection),
        }));
      }

      const leadItem = sections[0]?.items?.[0];
      const speechSummary =
        sections.length > 0 && leadItem
          ? `Here are ${sections.length} menu section${sections.length === 1 ? '' : 's'} at ${restaurant.name}. ${leadItem.name} is available for ${formatCurrency(leadItem.price)}.`
          : `I could not find menu details for ${restaurant.name} right now.`;

      return JSON.stringify({
        restaurant,
        sections,
        speechSummary,
      });
    },
  }),
  searchMenuItems: tool({
    description:
      'Search menu items by price, keywords, or dietary tags. Works best after a restaurant is selected.',
    inputSchema: z.object({
      restaurantId: z.string().uuid().optional(),
      restaurantSlug: z.string().optional(),
      query: z.string().optional(),
      maxPrice: z.number().positive().optional(),
      tags: z.array(z.string()).optional(),
      limit: z.number().int().min(1).max(20).optional(),
    }),
    outputSchema: z.string(),
    async execute({ restaurantId, restaurantSlug, query, maxPrice, tags, limit }) {
      const restaurant = await resolveRestaurantIdentifier({ restaurantId, restaurantSlug });

      let results: MenuItemSummary[] = [];

      if (supabase) {
        results = await fetchSupabaseMenuItems(restaurant?.id ?? undefined);
      }

      const normalizedQuery = query?.trim().toLowerCase();
      const normalizedTags = (tags ?? []).map(tag => tag.toLowerCase());
      const priceFilter = typeof maxPrice === 'number' ? maxPrice : null;

      if (results.length > 0) {
        results = results.filter(item => {
          if (restaurant?.id && item.restaurantId && item.restaurantId !== restaurant.id) {
            return false;
          }

          if (restaurant?.slug && item.restaurantSlug && item.restaurantSlug !== restaurant.slug) {
            return false;
          }

          if (normalizedQuery) {
            const haystack = `${item.name} ${item.description ?? ''}`.toLowerCase();
            if (!haystack.includes(normalizedQuery)) {
              return false;
            }
          }

          if (priceFilter != null && item.price > priceFilter) {
            return false;
          }

          if (normalizedTags.length > 0) {
            const itemTags = (item.tags ?? []).map(tag => tag.toLowerCase());
            return normalizedTags.every(tagValue => itemTags.includes(tagValue));
          }

          return true;
        });
      }

      if (results.length === 0) {
        results = searchFallbackMenuItems({
          restaurantSlug: restaurant?.slug ?? restaurantSlug?.toLowerCase() ?? null,
          query,
          maxPrice: priceFilter,
          tags,
        });
      }

      if (limit) {
        results = results.slice(0, limit);
      }

      const speechSummary =
        results.length > 0
          ? `I found ${results.length} item${results.length === 1 ? '' : 's'}${priceFilter != null ? ` under ${formatCurrency(priceFilter)}` : ''}${restaurant ? ` at ${restaurant.name}` : ''}.`
          : `I did not see menu items matching those filters${restaurant ? ` at ${restaurant.name}` : ''}.`;

      return JSON.stringify({
        restaurant,
        filters: { query, maxPrice: priceFilter, tags },
        results,
        speechSummary,
      });
    },
  }),
  recommendShortlist: tool({
    description: 'Format a shortlist of restaurants into conversational bullet points with delivery details.',
    inputSchema: z.object({
      restaurants: z
        .array(
          z.object({
            id: z.string(),
            name: z.string(),
            cuisine: z.string(),
            subCuisine: z.string().optional(),
            rating: z.number().min(0).max(5).nullable().optional(),
            etaMinutes: z.number().int().positive().nullable().optional(),
            closesAt: z.string().datetime().nullable().optional(),
            standoutDish: z.string().nullable().optional(),
            deliveryFee: z.number().nullable().optional(),
            promo: z.string().nullable().optional(),
          }),
        )
        .max(5),
      tone: z.enum(['concise', 'detailed']).default('concise'),
    }),
    outputSchema: z.string(),
    async execute({ restaurants, tone }) {
      const now = new Date();
      const formatted = restaurants.map(restaurant => {
        const pieces: string[] = [];
        const cuisineText = restaurant.subCuisine
          ? `${restaurant.subCuisine.replace(/\b\w/g, c => c.toUpperCase())} (${restaurant.cuisine})`
          : restaurant.cuisine.replace(/\b\w/g, c => c.toUpperCase());
        pieces.push(`${restaurant.name} — ${cuisineText}`);
        if (restaurant.rating) {
          pieces.push(`${restaurant.rating.toFixed(1)} stars`);
        }
        if (restaurant.etaMinutes) {
          pieces.push(`${restaurant.etaMinutes} min ETA`);
        }
        if (restaurant.closesAt) {
          const closes = new Date(restaurant.closesAt);
          const minutesUntilClose = Math.round((closes.getTime() - now.getTime()) / 60000);
          if (minutesUntilClose > 0) {
            pieces.push(`closes in ${minutesUntilClose} min`);
          }
        }
        if (restaurant.deliveryFee != null) {
          pieces.push(restaurant.deliveryFee === 0 ? 'free delivery' : `$${restaurant.deliveryFee.toFixed(2)} delivery`);
        }
        if (restaurant.promo) {
          pieces.push(restaurant.promo);
        }
        if (restaurant.standoutDish && tone === 'detailed') {
          pieces.push(`Try the ${restaurant.standoutDish}`);
        }
        return pieces.join(' • ');
      });

      return JSON.stringify({
        shortlist: formatted,
        speechSummary:
          formatted.length > 0
            ? `Here ${formatted.length === 1 ? 'is' : 'are'} ${formatted.length} option${formatted.length === 1 ? '' : 's'} I recommend.`
            : 'I could not build a shortlist from those selections.',
      });
    },
  }),
  addItemToCart: tool({
    description:
      'Add a menu item to the active cart for the demo household. Creates a cart if none exists yet.',
    inputSchema: z
      .object({
        restaurantId: z.string().uuid().optional(),
        restaurantSlug: z.string().optional(),
        menuItemId: z.string().uuid().optional(),
        menuItemSlug: z.string().optional(),
        quantity: z.number().int().min(1).max(20).default(1),
        optionChoiceIds: z.array(z.string().uuid()).optional(),
        notes: z.string().max(400).optional(),
      })
      .refine(
        value => Boolean(value.restaurantId || value.restaurantSlug),
        { message: 'Provide restaurantId or restaurantSlug.' },
      )
      .refine(
        value => Boolean(value.menuItemId || value.menuItemSlug),
        { message: 'Provide menuItemId or menuItemSlug.' },
      ),
    outputSchema: z.string(),
    async execute({
      restaurantId,
      restaurantSlug,
      menuItemId,
      menuItemSlug,
      quantity,
      optionChoiceIds,
      notes,
    }) {
      if (!supabase) {
        const message = 'Cart actions require Supabase to be configured. Please add Supabase credentials first.';
        return JSON.stringify({
          success: false,
          message,
          speechSummary: message,
        });
      }

      try {
        const restaurant = await resolveRestaurantIdentifier({ restaurantId, restaurantSlug });

        if (!restaurant) {
          const message = 'I could not find that restaurant to add the item.';
          return JSON.stringify({ success: false, message, speechSummary: message });
        }

        const client = ensureSupabase();

        let menuItemQuery = client
          .from('fc_menu_items')
          .select('id, slug, name, base_price, restaurant_id')
          .eq('restaurant_id', restaurant.id)
          .limit(1);

        if (menuItemId) {
          menuItemQuery = menuItemQuery.eq('id', menuItemId);
        } else if (menuItemSlug) {
          menuItemQuery = menuItemQuery.ilike('slug', menuItemSlug);
        }

        const { data: menuItem, error: menuItemError } = await menuItemQuery.maybeSingle();

        if (menuItemError || !menuItem) {
          const message = 'I could not find that menu item. Try another dish or ask for the menu first.';
          return JSON.stringify({ success: false, message, speechSummary: message });
        }

        const basePrice = toNumber(menuItem.base_price);

        let optionChoices: { id: string; label: string; price_adjustment: number }[] = [];
        if (optionChoiceIds && optionChoiceIds.length > 0) {
          const { data: choices, error: choicesError } = await client
            .from('fc_menu_item_option_choices')
            .select('id, price_adjustment, option_group:option_group_id (menu_item_id), label')
            .in('id', optionChoiceIds);

          if (choicesError) {
            throw choicesError;
          }

          optionChoices = (choices ?? [])
            .filter(choice => {
              const groupRelation = Array.isArray(choice.option_group) ? choice.option_group[0] : choice.option_group;
              return groupRelation?.menu_item_id === menuItem.id;
            })
            .map(choice => ({
              id: choice.id,
              label: choice.label ?? 'Custom option',
              price_adjustment: toNumber(choice.price_adjustment),
            }));
        }

        const optionTotal = optionChoices.reduce((sum, choice) => sum + choice.price_adjustment, 0);
        const linePrice = (basePrice + optionTotal) * quantity;

        const cart = await ensureActiveCart(restaurant.id);

        const { data: insertedItem, error: insertItemError } = await client
          .from('fc_cart_items')
          .insert({
            cart_id: cart.id,
            menu_item_id: menuItem.id,
            quantity,
            base_price: basePrice,
            total_price: linePrice,
            instructions: notes ?? null,
          })
          .select('id')
          .single();

        if (insertItemError || !insertedItem?.id) {
          throw insertItemError ?? new Error('Failed to add item to cart.');
        }

        if (optionChoices.length > 0) {
          const payload = optionChoices.map(choice => ({
            cart_item_id: insertedItem.id,
            option_choice_id: choice.id,
            price_adjustment: choice.price_adjustment,
          }));

          const { error: optionInsertError } = await client
            .from('fc_cart_item_options')
            .insert(payload);

          if (optionInsertError) {
            throw optionInsertError;
          }
        }

        const subtotal = await recalculateCartSubtotal(cart.id);
        const summary = await fetchCartSummary(cart.id);

        const totalItems = summary?.items.reduce((total, item) => total + item.quantity, 0) || quantity;
        const speechSummary = `Added ${quantity} ${menuItem.name}${quantity > 1 ? 's' : ''} to your cart. You now have ${totalItems} item${totalItems === 1 ? '' : 's'} totaling ${formatCurrency(subtotal)}.`;

        return JSON.stringify({
          success: true,
          cartId: cart.id,
          createdCart: cart.created,
          itemId: insertedItem.id,
          restaurant,
          item: {
            id: menuItem.id,
            slug: menuItem.slug,
            name: menuItem.name,
            quantity,
            linePrice,
            options: optionChoices.map(choice => ({
              id: choice.id,
              label: choice.label,
              priceAdjustment: choice.price_adjustment,
            })),
          },
          subtotal,
          cart: summary,
          speechSummary,
        });
      } catch (error) {
        console.error('[food-tools] addItemToCart error', error);
        const message = 'I ran into an issue adding that item to the cart. Try again in a moment.';
        return JSON.stringify({ success: false, message, speechSummary: message });
      }
    },
  }),
  viewCart: tool({
    description: 'Show the current cart, including items, options, and subtotal.',
    inputSchema: z.object({
      cartId: z.string().uuid().optional(),
      restaurantId: z.string().uuid().optional(),
      restaurantSlug: z.string().optional(),
      includeEmpty: z.boolean().default(false).optional(),
    }),
    outputSchema: z.string(),
    async execute({ cartId, restaurantId, restaurantSlug, includeEmpty }) {
      if (!supabase) {
        const message = 'Cart summaries require Supabase to be configured. Please add Supabase keys first.';
        return JSON.stringify({ success: false, message, speechSummary: message });
      }

      try {
        const client = ensureSupabase();
        let targetCartId = cartId ?? null;
        let restaurant = await resolveRestaurantIdentifier({ restaurantId, restaurantSlug });

        if (!targetCartId) {
          let cartQuery = client
            .from('fc_carts')
            .select('id')
            .eq('profile_id', DEMO_PROFILE_ID)
            .eq('status', 'active')
            .order('updated_at', { ascending: false })
            .limit(1);

          if (restaurant?.id) {
            cartQuery = cartQuery.eq('restaurant_id', restaurant.id);
          }

          const { data: cartRow, error: cartError } = await cartQuery.maybeSingle();

          if (!cartError && cartRow?.id) {
            targetCartId = cartRow.id;
          }
        }

        if (!targetCartId) {
          const message = includeEmpty
            ? 'You do not have an active cart yet.'
            : 'I did not find an active cart to show.';
          return JSON.stringify({ success: includeEmpty, message, speechSummary: message });
        }

        const summary = await fetchCartSummary(targetCartId);

        if (!summary || (!includeEmpty && summary.items.length === 0)) {
          const message = 'Your cart is empty right now.';
          return JSON.stringify({ success: true, cart: summary, speechSummary: message });
        }

        if (!restaurant) {
          restaurant = await resolveRestaurantIdentifier({ restaurantId: summary?.restaurantId, restaurantSlug: summary?.restaurantSlug });
        }

        const itemCount = summary.items.reduce((sum, item) => sum + item.quantity, 0);
        const speechSummary = `You have ${itemCount} item${itemCount === 1 ? '' : 's'} in your cart${restaurant ? ` at ${restaurant.name}` : ''}, totaling ${formatCurrency(summary.subtotal)}.`;

        return JSON.stringify({
          success: true,
          cart: summary,
          restaurant,
          speechSummary,
        });
      } catch (error) {
        console.error('[food-tools] viewCart error', error);
        const message = 'I had trouble loading your cart just now.';
        return JSON.stringify({ success: false, message, speechSummary: message });
      }
    },
  }),
  fetchMenuItemImage: tool({
    description: 'Retrieve a representative photo for a menu item to help the household visualize it.',
    inputSchema: z
      .object({
        restaurantId: z.string().uuid().optional(),
        restaurantSlug: z.string().optional(),
        menuItemId: z.string().uuid().optional(),
        menuItemSlug: z.string().optional(),
        menuItemName: z.string().optional(),
      })
      .refine(
        value => Boolean(value.menuItemId || value.menuItemSlug || value.menuItemName),
        { message: 'Provide menuItemId, menuItemSlug, or menuItemName.' },
      ),
    outputSchema: z.string(),
    async execute({ restaurantId, restaurantSlug, menuItemId, menuItemSlug, menuItemName }) {
      try {
        const restaurant = await resolveRestaurantIdentifier({ restaurantId, restaurantSlug });
        const detail = await fetchMenuItemDetail({
          restaurant: restaurant ?? undefined,
          menuItemId,
          menuItemSlug,
          menuItemName,
        });
        const imageUrl = await ensureMenuItemImage({
          restaurant: restaurant ?? undefined,
          itemId: detail?.id ?? menuItemId,
          itemSlug: detail?.slug ?? menuItemSlug,
          itemName: detail?.name ?? menuItemName,
        });

        if (!imageUrl) {
          const message =
            'I could not find a good photo of that dish just yet, but I can keep looking if you like.';
          return JSON.stringify({
            success: false,
            message,
            speechSummary: message,
          });
        }

        const speechSummary = `Here’s what ${detail?.name ?? menuItemName ?? 'that item'} looks like.`;
        return JSON.stringify({
          success: true,
          imageUrl,
          restaurant,
          menuItem: detail ?? {
            id: menuItemId ?? null,
            slug: menuItemSlug ?? null,
            name: menuItemName ?? null,
          },
          speechSummary,
        });
      } catch (error) {
        console.error('[food-tools] fetchMenuItemImage error', error);
        const message = 'I had trouble finding an image for that dish.';
        return JSON.stringify({
          success: false,
          message,
          speechSummary: message,
        });
      }
    },
  }),
  submitCartOrder: tool({
    description: 'Convert the active cart into an order record for handoff to checkout.',
    inputSchema: z.object({
      cartId: z.string().uuid().optional(),
      restaurantId: z.string().uuid().optional(),
      restaurantSlug: z.string().optional(),
    }),
    outputSchema: z.string(),
    async execute({ cartId, restaurantId, restaurantSlug }) {
      try {
        const client = ensureSupabase();
        let targetCartId = cartId ?? null;
        const restaurantIdentifier = await resolveRestaurantIdentifier({ restaurantId, restaurantSlug });

        if (!targetCartId) {
          let cartQuery = client
            .from('fc_carts')
            .select('id')
            .eq('profile_id', DEMO_PROFILE_ID)
            .eq('status', 'active')
            .order('updated_at', { ascending: false })
            .limit(1);

          if (restaurantIdentifier?.id) {
            cartQuery = cartQuery.eq('restaurant_id', restaurantIdentifier.id);
          }

          const { data: cartRow, error: cartError } = await cartQuery.maybeSingle();

          if (!cartError && cartRow?.id) {
            targetCartId = cartRow.id;
          }
        }

        if (!targetCartId) {
          const message = 'There is no active cart to submit right now.';
          return JSON.stringify({ success: false, message, speechSummary: message });
        }

        const submission = await submitCartToOrder(targetCartId);

        if (!submission) {
          const message = 'I could not finalize that cart just yet. Please try again in a moment.';
          return JSON.stringify({ success: false, message, speechSummary: message });
        }

        // Fetch full restaurant record for additional details
        let restaurantRecord: RestaurantRecord | null = null;
        if (supabase && restaurantIdentifier?.id) {
          const { data } = await client
            .from('fc_restaurants')
            .select('*')
            .eq('id', restaurantIdentifier.id)
            .maybeSingle();
          restaurantRecord = data as RestaurantRecord | null;
        }

        const speechSummary = `Great, I locked in ${submission.itemCount} item${submission.itemCount === 1 ? '' : 's'} for ${formatCurrency(submission.subtotal)}. Your order has been confirmed!`;

        return JSON.stringify({
          success: true,
          orderId: submission.orderId,
          restaurant: {
            id: restaurantIdentifier?.id || 'unknown',
            name: restaurantIdentifier?.name || 'Unknown Restaurant',
            cuisine: restaurantRecord?.cuisine || 'Mixed',
            rating: restaurantRecord?.rating || null,
            etaMinutes: restaurantRecord?.eta_minutes || 30,
            deliveryFee: restaurantRecord?.delivery_fee || 2.99
          },
          total: submission.subtotal + (restaurantRecord?.delivery_fee || 2.99),
          itemCount: submission.itemCount,
          estimatedDeliveryTime: new Date(Date.now() + 30 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          speechSummary,
        });
      } catch (error) {
        console.error('[food-tools] submitCartOrder error', error);
        const message = 'I ran into an issue submitting that cart. Please try again shortly.';
        return JSON.stringify({ success: false, message, speechSummary: message });
      }
    },
  }),
  updatePreferences: tool({
    description: 'Persist updated cuisine preferences, dietary tags, and spice/budget notes for the household.',
    inputSchema: z.object({
      favoriteCuisines: z.array(z.string()).optional(),
      dislikedCuisines: z.array(z.string()).optional(),
      dietaryTags: z.array(z.string()).optional(),
      spiceLevel: z.enum(['low', 'medium', 'high']).optional(),
      budgetRange: z.enum(['value', 'standard', 'premium']).optional(),
      notes: z.string().optional(),
    }),
    outputSchema: z.string(),
    async execute({ favoriteCuisines, dislikedCuisines, dietaryTags, spiceLevel, budgetRange, notes }) {
      if (!supabase) {
        return JSON.stringify({
          success: false,
          message: 'Preferences saved locally. Configure Supabase to persist them.',
          speechSummary: 'Got it. I will remember that for the rest of this session.',
        });
      }

      const client = ensureSupabase();
      const payload = {
        id: DEMO_PROFILE_ID,
        profile_id: DEMO_PROFILE_ID,
        favorite_cuisines: favoriteCuisines ?? null,
        disliked_cuisines: dislikedCuisines ?? null,
        dietary_tags: dietaryTags ?? null,
        spice_level: spiceLevel ?? null,
        budget_range: budgetRange ?? null,
        notes: notes ?? null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await client
        .from('fc_preferences')
        .upsert(payload, { onConflict: 'profile_id' });

      if (error) {
        console.error('[food-tools] updatePreferences error', error);
        return JSON.stringify({
          success: false,
          message: 'Preference update failed. Ask the team to inspect Supabase logs.',
          speechSummary: 'I hit a snag updating preferences. Let me know if you want me to try again.',
        });
      }

      return JSON.stringify({
        success: true,
        message: 'Preferences updated.',
        speechSummary: 'All set. I updated your Food Court preferences.',
      });
    },
  }),
  updateHomepageLayout: tool({
    description: 'Reorder homepage rows and hero placement for Food Court based on cuisine focus.',
    inputSchema: z.object({
      focusRow: z.string().optional(),
      demoteRows: z.array(z.string()).optional(),
      highlightCuisine: z.string().optional(),
      heroRestaurantId: z.string().optional(),
    }),
    outputSchema: z.string(),
    async execute({ focusRow, demoteRows, highlightCuisine, heroRestaurantId }) {
      if (!supabase) {
        return JSON.stringify({
          success: false,
          message: 'Homepage changes require Supabase configuration to persist.',
          speechSummary: 'I need Supabase connected before I can refresh the homepage layout.',
        });
      }

      const client = ensureSupabase();
      const payload: HomepageLayoutRecord = {
        focus_row: focusRow ?? null,
        demote_rows: demoteRows ?? null,
        highlight_cuisine: highlightCuisine ?? null,
        hero_restaurant_id: heroRestaurantId ?? null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await client
        .from('fc_layouts')
        .upsert({
          profile_id: DEMO_PROFILE_ID,
          ...payload,
        }, { onConflict: 'profile_id' });

      if (error) {
        console.error('[food-tools] updateHomepageLayout error', error);
        return JSON.stringify({
          success: false,
          message: 'Failed to update homepage layout.',
          speechSummary: 'I could not refresh the homepage layout just yet.',
        });
      }

      const summaryParts: string[] = [];
      if (highlightCuisine) {
        summaryParts.push(`spotlighting ${highlightCuisine}`);
      }
      if (focusRow) {
        summaryParts.push(`moving ${focusRow} to the top`);
      }
      const summary = summaryParts.length > 0 ? summaryParts.join(' and ') : 'refreshing your homepage tiles';

      return JSON.stringify({
        success: true,
        message: 'Homepage layout updated.',
        speechSummary: `Done. I finished ${summary}.`,
      });
    },
  }),
  logOrderIntent: tool({
    description: 'Log a restaurant selection and intended next step (browse, checkout, save, or handoff).',
    inputSchema: z.object({
      restaurantId: z.string(),
      restaurantName: z.string(),
      intent: z.enum(['browse', 'checkout', 'save', 'handoff']),
      notes: z.string().optional(),
    }),
    outputSchema: z.string(),
    async execute({ restaurantId, restaurantName, intent, notes }) {
      if (!supabase) {
        return JSON.stringify({
          success: true,
          message: 'Intent noted locally.',
          speechSummary: `Sounds good. I noted ${restaurantName} for ${intent}.`,
        });
      }

      const client = ensureSupabase();
      const { error } = await client.from('fc_order_events').insert({
        profile_id: DEMO_PROFILE_ID,
        restaurant_id: restaurantId,
        restaurant_name: restaurantName,
        intent,
        notes: notes ?? null,
        created_at: new Date().toISOString(),
      });

      if (error) {
        console.error('[food-tools] logOrderIntent error', error);
        return JSON.stringify({
          success: false,
          message: 'Failed to log order intent.',
          speechSummary: `I had trouble logging that choice for ${restaurantName}.`,
        });
      }

      return JSON.stringify({
        success: true,
        message: 'Order intent logged.',
        speechSummary: `Great. I logged ${restaurantName} so we can pick up where you left off.`,
      });
    },
  }),
  logFeedback: tool({
    description: 'Capture feedback about the Food Court concierge flow to improve future sessions.',
    inputSchema: z.object({
      sentiment: z.enum(['positive', 'neutral', 'negative']),
      notes: z.string().optional(),
    }),
    outputSchema: z.string(),
    async execute({ sentiment, notes }) {
      if (supabase) {
        const client = ensureSupabase();
        const { error } = await client.from('fc_feedback').insert({
          profile_id: DEMO_PROFILE_ID,
          sentiment,
          notes: notes ?? null,
          created_at: new Date().toISOString(),
        });

        if (error) {
          console.error('[food-tools] logFeedback error', error);
        }
      }

      return JSON.stringify({
        status: 'logged',
        sentiment,
        notes: notes ?? null,
        speechSummary: 'Thanks for sharing. I logged that for the Food Court team.',
      });
    },
  }),
};

