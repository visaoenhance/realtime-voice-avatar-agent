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

  if (error || !data) {
    return FALLBACK_RESTAURANTS.find(restaurant => restaurant.id === slug) ?? null;
  }

  return {
    id: data.slug ?? data.id,
    name: data.name,
    cuisine_group: data.cuisine_group,
    cuisine: data.cuisine,
    rating: data.rating,
    eta_minutes: data.eta_minutes,
    closes_at: data.closes_at,
    standout_dish: data.standout_dish,
    delivery_fee: data.delivery_fee,
    promo: data.promo,
    dietary_tags: data.dietary_tags ?? [],
    price_tier: data.price_tier,
    hero_image: data.hero_image,
    address: data.address,
    phone: data.phone,
    highlights: data.highlights,
  };
}

