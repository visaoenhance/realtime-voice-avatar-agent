export type SampleRestaurant = {
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

export type SampleFoodPreferences = {
  id: string;
  favorite_cuisines?: string[] | null;
  disliked_cuisines?: string[] | null;
  dietary_tags?: string[] | null;
  spice_level?: 'low' | 'medium' | 'high' | null;
  budget_range?: 'value' | 'standard' | 'premium' | null;
  notes?: string | null;
};

export const FALLBACK_RESTAURANTS: SampleRestaurant[] = [
  {
    id: 'sabor-colombiano-kitchen',
    name: 'Sabor Colombiano Kitchen',
    cuisine_group: 'latin',
    cuisine: 'colombian',
    rating: 4.6,
    eta_minutes: 34,
    closes_at: new Date(Date.now() + 150 * 60 * 1000).toISOString(),
    standout_dish: 'Grilled Salmon with Aji Verde',
    delivery_fee: 2.25,
    promo: 'Free arepa bites over $35',
    dietary_tags: ['high-protein', 'vegetarian-friendly'],
    price_tier: 'medium',
    hero_image: 'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1600&q=80',
    address: '299 Avenida de la Salsa, Orlando, FL',
    phone: '(407) 555-0199',
    highlights: ['House-made aji sauces', 'Grilled protein platters', 'Family-style bandeja paisa'],
  },
  {
    id: 'island-breeze-caribbean',
    name: 'Island Breeze Caribbean',
    cuisine_group: 'latin',
    cuisine: 'caribbean',
    rating: 4.7,
    eta_minutes: 32,
    closes_at: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
    standout_dish: 'Jerk Chicken with Pineapple Slaw',
    delivery_fee: 2.49,
    promo: 'Free delivery over $30',
    dietary_tags: ['gluten-free', 'spicy'],
    price_tier: 'medium',
    hero_image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1600&q=80',
    address: '135 Island Breeze Ave, Orlando, FL',
    phone: '(407) 555-0134',
    highlights: ['Closes in under an hour', 'Signature jerk marinades', 'Combo-friendly sides'],
  },
  {
    id: 'sabor-latino-cantina',
    name: 'Sabor Latino Cantina',
    cuisine_group: 'latin',
    cuisine: 'mexican',
    rating: 4.5,
    eta_minutes: 28,
    closes_at: new Date(Date.now() + 90 * 60 * 1000).toISOString(),
    standout_dish: 'Al Pastor Tacos',
    delivery_fee: 1.99,
    promo: '15% off tonight',
    dietary_tags: ['gluten-free'],
    price_tier: 'low',
    hero_image: 'https://images.unsplash.com/photo-1606755962773-0e7d4be90a77?auto=format&fit=crop&w=1600&q=80',
    address: '205 Fiesta Blvd, Orlando, FL',
    phone: '(407) 555-0142',
    highlights: ['House-made tortillas', 'Family bundle specials', 'Late-night bites'],
  },
  {
    id: 'green-garden-bowls',
    name: 'Green Garden Bowls',
    cuisine_group: 'healthy',
    cuisine: 'plant-forward',
    rating: 4.8,
    eta_minutes: 24,
    closes_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    standout_dish: 'Caribbean Quinoa Bowl',
    delivery_fee: 0,
    promo: 'BOGO 50% off bowls',
    dietary_tags: ['vegetarian', 'gluten-free'],
    price_tier: 'medium',
    hero_image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1600&q=80',
    address: '47 Fresh Market Way, Winter Park, FL',
    phone: '(407) 555-0110',
    highlights: ['Build-your-own bowl', 'Juice cleanse add-ons', 'Macro-friendly portions'],
  },
  {
    id: 'harvest-hearth-kitchen',
    name: 'Harvest & Hearth Kitchen',
    cuisine_group: 'healthy',
    cuisine: 'farm-to-table',
    rating: 4.6,
    eta_minutes: 38,
    closes_at: new Date(Date.now() + 70 * 60 * 1000).toISOString(),
    standout_dish: 'Roasted Squash Grain Bowl',
    delivery_fee: 4.5,
    promo: 'Free dessert with orders over $40',
    dietary_tags: ['vegetarian'],
    price_tier: 'high',
    hero_image: 'https://images.unsplash.com/photo-1528712306091-ed0763094c98?auto=format&fit=crop&w=1600&q=80',
    address: '892 Hearthstone Ave, Maitland, FL',
    phone: '(407) 555-0188',
    highlights: ['Seasonal produce', 'Chef-curated pairings', 'Craft mocktails'],
  },
  {
    id: 'noodle-express',
    name: 'Noodle Express',
    cuisine_group: 'asian',
    cuisine: 'thai',
    rating: 4.4,
    eta_minutes: 35,
    closes_at: new Date(Date.now() + 110 * 60 * 1000).toISOString(),
    standout_dish: 'Drunken Noodles',
    delivery_fee: 3.25,
    promo: '2 entrees for $20',
    dietary_tags: ['spicy'],
    price_tier: 'medium',
    hero_image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=1600&q=80',
    address: '512 Spice Lane, Altamonte Springs, FL',
    phone: '(407) 555-0165',
    highlights: ['Hand-pulled noodles', 'Late-night happy hour', 'Thai iced tea combos'],
  },
  {
    id: 'brick-oven-slice',
    name: 'Brick Oven Slice',
    cuisine_group: 'comfort',
    cuisine: 'pizza',
    rating: 4.2,
    eta_minutes: 29,
    closes_at: new Date(Date.now() + 120 * 60 * 1000).toISOString(),
    standout_dish: 'Grandma Square Pie',
    delivery_fee: 1.5,
    promo: 'Family meal $24.99',
    dietary_tags: ['vegetarian'],
    price_tier: 'low',
    hero_image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1600&q=80',
    address: '75 Brickstone Plaza, Orlando, FL',
    phone: '(407) 555-0177',
    highlights: ['Wood-fired crust', 'By-the-slice classics', 'Overnight dough ferment'],
  },
];

export const FALLBACK_PREFERENCES: SampleFoodPreferences = {
  id: '00000000-0000-0000-0000-0000000000fc',
  favorite_cuisines: ['thai', 'indian', 'caribbean'],
  disliked_cuisines: ['fried'],
  dietary_tags: ['healthy', 'high-protein'],
  spice_level: 'medium',
  budget_range: 'standard',
  notes: 'Prefers options that arrive under 40 minutes.',
};

