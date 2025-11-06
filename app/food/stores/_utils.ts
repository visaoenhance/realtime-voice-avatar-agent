import { FALLBACK_RESTAURANTS, SampleRestaurant } from '@/data/foodCourtSamples';
import { supabase } from '@/lib/supabaseServer';

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

