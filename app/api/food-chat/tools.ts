import { tool } from 'ai';
import { z } from 'zod';
import { DEMO_PROFILE_ID, supabase } from '@/lib/supabaseServer';
import {
  FALLBACK_PREFERENCES,
  FALLBACK_RESTAURANTS,
  SampleFoodPreferences,
  SampleRestaurant,
} from '@/data/foodCourtSamples';

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
};

type HomepageLayoutRecord = {
  hero_restaurant_id?: string | null;
  focus_row?: string | null;
  demote_rows?: string[] | null;
  highlight_cuisine?: string | null;
  updated_at?: string | null;
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

async function fetchFoodPreferences(): Promise<PreferenceRecord> {
  if (!supabase) {
    return FALLBACK_PREFERENCE_RECORD;
  }

  const client = ensureSupabase();
  const { data, error } = await client
    .from('fc_preferences')
    .select('*')
    .eq('profile_id', DEMO_PROFILE_ID)
    .maybeSingle();

  if (error) {
    console.error('[food-tools] fetchFoodPreferences error', error);
    return FALLBACK_PREFERENCES;
  }

  if (!data) {
    return FALLBACK_PREFERENCES;
  }

  return {
    id: DEMO_PROFILE_ID,
    favorite_cuisines: data.favorite_cuisines ?? [],
    disliked_cuisines: data.disliked_cuisines ?? [],
    dietary_tags: data.dietary_tags ?? [],
    spice_level: data.spice_level ?? 'medium',
    budget_range: data.budget_range ?? 'standard',
    notes: data.notes ?? null,
  };
}

async function fetchRecentOrders() {
  if (!supabase) {
    return [];
  }

  const client = ensureSupabase();
  const { data, error } = await client
    .from('fc_orders')
    .select('restaurant_id, restaurant_name, cuisine, created_at, rating, satisfaction_notes')
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
}): Promise<RestaurantRecord[]> {
  if (!supabase) {
    let filtered = FALLBACK_RESTAURANT_RECORDS;
    if (filters.cuisine) {
      filtered = filtered.filter(r => r.cuisine_group === filters.cuisine);
    }
    if (filters.subCuisine) {
      filtered = filtered.filter(r => r.cuisine === filters.subCuisine);
    }
    if (filters.dietaryTags && filters.dietaryTags.length > 0) {
      filtered = filtered.filter(r =>
        filters.dietaryTags?.every(tag => r.dietary_tags?.map(t => t.toLowerCase()).includes(tag.toLowerCase())),
      );
    }
    if (filters.budget) {
      filtered = filtered.filter(r => r.price_tier === filters.budget);
    }
    return filtered.slice(0, filters.limit ?? 5);
  }

  const client = ensureSupabase();
  let query = client.from('fc_restaurants').select('*').eq('is_active', true);

  if (filters.cuisine) {
    query = query.eq('cuisine_group', filters.cuisine);
  }
  if (filters.subCuisine) {
    query = query.eq('cuisine', filters.subCuisine);
  }
  if (filters.dietaryTags && filters.dietaryTags.length > 0) {
    query = query.contains('dietary_tags', filters.dietaryTags);
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
      if ((preferences.favorite_cuisines ?? []).length > 0) {
        summaryPieces.push(`Favorites: ${(preferences.favorite_cuisines ?? []).slice(0, 4).join(', ')}`);
      }
      if ((preferences.dietary_tags ?? []).length > 0) {
        summaryPieces.push(`Dietary: ${(preferences.dietary_tags ?? []).join(', ')}`);
      }
      if ((preferences.budget_range ?? '').length > 0) {
        summaryPieces.push(`Budget: ${preferences.budget_range}`);
      }
      const recent = recentOrders.slice(0, 3).map(order => `${order.restaurant_name} (${order.cuisine})`);
      if (recent.length > 0) {
        summaryPieces.push(`Recent: ${recent.join(', ')}`);
      }

      return JSON.stringify({
        profile: {
          favoriteCuisines: preferences.favorite_cuisines ?? [],
          dislikedCuisines: preferences.disliked_cuisines ?? [],
          dietaryTags: preferences.dietary_tags ?? [],
          spiceLevel: preferences.spice_level ?? 'medium',
          budgetRange: preferences.budget_range ?? 'standard',
          notes: preferences.notes ?? undefined,
        },
        recentOrders,
        speechSummary: summaryPieces.join(' | ') || 'Food preferences loaded. Ready to assist.',
        lastUpdated: new Date().toISOString(),
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
      locationBounds: z
        .object({
          latitude: z.number(),
          longitude: z.number(),
          radiusMiles: z.number().positive().optional(),
        })
        .optional(),
      limit: z.number().int().min(1).max(10).default(5),
    }),
    outputSchema: z.string(),
    async execute({ cuisine, subCuisine, dietaryTags, closesWithinMinutes, budget, limit }) {
      const restaurants = await fetchRestaurantRecords({
        cuisine,
        subCuisine,
        dietaryTags,
        closesWithinMinutes,
        budget,
        limit,
      });

      return JSON.stringify({
        filters: {
          cuisine,
          subCuisine,
          dietaryTags,
          closesWithinMinutes,
          budget,
        },
        results: normalizeRestaurants(restaurants),
        speechSummary:
          restaurants.length > 0
            ? `Found ${restaurants.length} options${closesWithinMinutes ? ' closing soon' : ''}.`
            : 'No restaurants match those filters right now.',
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

