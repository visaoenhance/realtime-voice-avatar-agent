import { FALLBACK_RESTAURANTS, SampleRestaurant } from '@/data/foodCourtSamples';
import { supabase } from '@/lib/supabaseServer';
import type { MenuCategory } from '@/data/foodSampleMenu';
import { SAMPLE_MENU_BY_RESTAURANT } from '@/data/foodSampleMenu';

export async function fetchMenuByRestaurantSlug(slug: string): Promise<MenuCategory[]> {
  if (!supabase) {
    return SAMPLE_MENU_BY_RESTAURANT[slug] ?? [];
  }

  const { data: restaurant } = await supabase
    .from('fc_restaurants')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();

  if (!restaurant?.id) {
    return SAMPLE_MENU_BY_RESTAURANT[slug] ?? [];
  }

  const { data: sections, error } = await supabase
    .from('fc_menu_sections')
    .select(`
      id,
      name,
      description,
      display_order,
      fc_menu_items(
        id,
        slug,
        name,
        description,
        base_price,
        dietary_tags,
        image,
        is_available
      )
    `)
    .eq('restaurant_id', restaurant.id)
    .eq('fc_menu_items.is_available', true)
    .order('display_order', { ascending: true });

  if (error || !sections) {
    console.error('Error fetching menu sections:', error);
    return SAMPLE_MENU_BY_RESTAURANT[slug] ?? [];
  }

  return sections.map(section => ({
    slug: section.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    title: section.name,
    description: section.description,
    items: (section.fc_menu_items || []).map(item => ({
      slug: item.slug,
      name: item.name,
      description: item.description || undefined,
      price: parseFloat(item.base_price.toString()),
      tags: item.dietary_tags || [],
      image: item.image || undefined,
    })),
  }));
}

export async function fetchRestaurantBySlug(slug: string): Promise<SampleRestaurant | null> {
  if (!supabase) {
    return FALLBACK_RESTAURANTS.find(restaurant => restaurant.id === slug) ?? null;
  }

  const { data, error } = await supabase
    .from('fc_restaurants')
    .select(
      [
        'id',
        'slug',
        'name',
        'cuisine',
        'cuisine_group',
        'rating',
        'eta_minutes',
        'closes_at',
        'standout_dish',
        'delivery_fee',
        'promo',
        'hero_image',
        'address',
        'phone',
        'highlights',
        'dietary_tags',
        'price_tier',
      ].join(', '),
    )
    .eq('slug', slug)
    .maybeSingle();

  if (error || !data || typeof (data as { id?: string }).id !== 'string') {
    return FALLBACK_RESTAURANTS.find(restaurant => restaurant.id === slug) ?? null;
  }

  if (typeof data !== 'object' || data === null || !('name' in data)) {
    return FALLBACK_RESTAURANTS.find(restaurant => restaurant.id === slug) ?? null;
  }

  const record = data as {
    id?: string | null;
    slug?: string | null;
    name: string;
    cuisine_group?: string | null;
    cuisine?: string | null;
    rating?: number | null;
    eta_minutes?: number | null;
    closes_at?: string | null;
    standout_dish?: string | null;
    delivery_fee?: number | null;
    promo?: string | null;
    hero_image?: string | null;
    address?: string | null;
    phone?: string | null;
    highlights?: string[] | null;
    dietary_tags?: string[] | null;
    price_tier?: string | null;
  };

  return {
    id: record.slug ?? record.id ?? slug,
    name: record.name,
    cuisine_group: record.cuisine_group ?? 'general',
    cuisine: record.cuisine ?? 'restaurant',
    rating: record.rating,
    eta_minutes: record.eta_minutes,
    closes_at: record.closes_at,
    standout_dish: record.standout_dish,
    delivery_fee: record.delivery_fee,
    promo: record.promo,
    dietary_tags: record.dietary_tags ?? [],
    price_tier: record.price_tier === 'low' || record.price_tier === 'medium' || record.price_tier === 'high' ? record.price_tier : undefined,
    hero_image: record.hero_image,
    address: record.address,
    phone: record.phone,
    highlights: record.highlights,
  };
}

