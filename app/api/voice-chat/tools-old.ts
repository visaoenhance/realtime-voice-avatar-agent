import { tool } from 'ai';
import { z } from 'zod';
import { supabase } from '@/lib/supabaseServer';
import {
  FALLBACK_PREFERENCES,
  FALLBACK_RESTAURANTS,
} from '@/data/foodCourtSamples';
import {
  SAMPLE_MENU_BY_RESTAURANT,
} from '@/data/foodSampleMenu';

const DEMO_PROFILE_ID = 'demo-user-123';

// Types needed for Supabase queries
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

function ensureSupabase() {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to enable data-driven Food Court tools.',
    );
  }
  return supabase;
}

// Voice-optimized tools for direct, fast interactions
export const voiceTools = {
  // Quick profile load - same as getUserContext but optimized name
  getUserProfile: tool({
    description: 'Get user profile with preferences and delivery location for voice commands',
    inputSchema: z.object({}).strip(),
    outputSchema: z.string(),
    execute: async () => {
      try {
        // Get user profile and return as JSON string as expected by voice chat
        if (!supabase) {
          return JSON.stringify({ profile: FALLBACK_PREFERENCES });
        }

        const { data: preferences, error } = await supabase
          .from('fc_preferences')
          .select('*')
          .eq('id', DEMO_PROFILE_ID)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching preferences:', error);
        }

        const profile = preferences || FALLBACK_PREFERENCES;
        
        return JSON.stringify({
          profile: {
            favoriteCuisines: profile.favorite_cuisines || [],
            dietaryTags: profile.dietary_tags || [],
            dislikedCuisines: profile.disliked_cuisines || [],
            spiceLevel: profile.spice_level || 'medium',
            budgetRange: profile.budget_range || 'standard',
            defaultLocation: profile.default_location || {
              city: 'Orlando',
              state: 'FL',
            },
          },
        });
      } catch (error) {
        console.error('getUserProfile error:', error);
        const fallback = FALLBACK_PREFERENCES;
        return JSON.stringify({
          profile: {
            favoriteCuisines: fallback.favorite_cuisines || [],
            dietaryTags: fallback.dietary_tags || [],
            dislikedCuisines: fallback.disliked_cuisines || [],
            spiceLevel: fallback.spice_level || 'medium',
            budgetRange: fallback.budget_range || 'standard',
            defaultLocation: {
              city: 'Orlando',
              state: 'FL',
            },
          },
        });
      }
    },
  }),

  // Direct item search - "I want cheesecake" → immediate results
  findFoodItem: tool({
    description: 'Search for specific food items across all restaurants (voice-optimized for direct requests)',
    inputSchema: z.object({
      query: z.string().describe('The food item to search for (e.g., "cheesecake", "pad thai", "margherita pizza")'),
      maxResults: z.number().default(5).describe('Maximum results to return for voice'),
    }),
    outputSchema: z.string(),
    execute: async ({ query, maxResults = 5 }) => {
      try {
        let results: MenuItemSummary[] = [];

        // First try Supabase data (like AI-SDK does)
        if (supabase) {
          try {
            const client = ensureSupabase();
            const { data, error } = await client
              .from('fc_menu_items')
              .select(
                'id, slug, name, description, base_price, calories, rating, tags, image, section:section_id (id, title), restaurant:restaurant_id (id, slug, name)'
              )
              .eq('is_available', true)
              .order('position', { ascending: true });

            if (!error && data) {
              results = (data ?? []).map(item => {
                const sectionRelation = Array.isArray(item.section) ? item.section[0] : item.section;
                const restaurantRelation = Array.isArray(item.restaurant) ? item.restaurant[0] : item.restaurant;

                return {
                  id: item.id,
                  slug: item.slug,
                  name: item.name,
                  description: item.description,
                  price: item.base_price,
                  tags: item.tags ?? [],
                  calories: item.calories,
                  rating: item.rating,
                  sectionTitle: sectionRelation?.title ?? null,
                  restaurantId: restaurantRelation?.id ?? null,
                  restaurantSlug: restaurantRelation?.slug ?? null,
                  restaurantName: restaurantRelation?.name ?? null,
                  image: item.image ?? null,
                };
              });
            }
          } catch (supabaseError) {
            console.error('Supabase search error, falling back to local data:', supabaseError);
          }
        }

        // Filter results by query
        const normalizedQuery = query.trim().toLowerCase();
        if (results.length > 0) {
          results = results.filter(item => {
            const haystack = `${item.name} ${item.description ?? ''}`.toLowerCase();
            return haystack.includes(normalizedQuery);
          });
        }

        // Fallback to local data if no Supabase results
        if (results.length === 0) {
          const matchedItems: any[] = [];

          // Search across all restaurant menus
          FALLBACK_RESTAURANTS.forEach((restaurant) => {
            const menu = SAMPLE_MENU_BY_RESTAURANT[restaurant.id];
            if (!menu || !Array.isArray(menu)) return;

            menu.forEach((section) => {
              if (!section.items || !Array.isArray(section.items)) return;
              
              section.items.forEach((item) => {
                const searchableText = `${item.name} ${item.description || ''} ${section.title}`.toLowerCase();
                const queryLower = query.toLowerCase();
                
                // Simple relevance scoring
                let score = 0;
                if (item.name.toLowerCase().includes(queryLower)) score += 10;
                if (item.description?.toLowerCase().includes(queryLower)) score += 5;
                if (searchableText.includes(queryLower)) score += 1;
                
                if (score > 0) {
                  matchedItems.push({
                    restaurant,
                    item: {
                      ...item,
                      section: section.title,
                    },
                    distance_score: score,
                  });
                }
              });
            });
          });

          // Convert fallback results to MenuItemSummary format
          results = matchedItems
            .sort((a, b) => b.distance_score - a.distance_score)
            .slice(0, maxResults)
            .map(({ restaurant, item }) => ({
              id: item.id || `${restaurant.id}-${item.name.toLowerCase().replace(/\\s+/g, '-')}`,
              slug: item.slug || item.name.toLowerCase().replace(/\\s+/g, '-'),
              name: item.name,
              description: item.description,
              price: item.price,
              tags: item.dietary_tags || [],
              calories: item.calories,
              rating: item.rating,
              sectionTitle: item.section,
              restaurantId: restaurant.id,
              restaurantSlug: restaurant.name.toLowerCase().replace(/\\s+/g, '-'),
              restaurantName: restaurant.name,
              image: item.image_url,
            }));
        }

        // Limit and format results for MenuItemSpotlightCard
        const finalResults = results.slice(0, maxResults);
        
        return JSON.stringify({
          filters: {
            query: query,
            maxPrice: undefined,
            tags: []
          },
          results: finalResults.map(result => ({
            id: result.id,
            slug: result.slug,
            name: result.name,
            description: result.description,
            price: result.price,
            image: result.image,
            tags: result.tags,
            section: result.sectionTitle,
            restaurant: {
              id: result.restaurantId,
              name: result.restaurantName,
              cuisine: 'unknown',
              rating: undefined,
              etaMinutes: undefined
            }
          })),
          speechSummary: `Found ${Math.min(results.length, maxResults)} ${query} options${results.length > maxResults ? ` (showing top ${maxResults})` : ''}`,
          restaurant: undefined
        });
      } catch (error) {
        console.error('findFoodItem error:', error);
        return JSON.stringify({
          filters: {
            query: query,
            maxPrice: undefined,
            tags: []
          },
          results: [],
          speechSummary: `Unable to search for ${query} - please try again`,
          restaurant: undefined
        });
      }
    },
  }),

  // Quick restaurant search by type - "Find Thai food" → immediate options  
  findRestaurantsByType: tool({
    description: 'Find restaurants by cuisine type for voice commands (returns top matches immediately)',
    inputSchema: z.object({
      cuisine: z.string().describe('Cuisine type to search for (e.g., "Thai", "Italian", "Mexican")'),
      maxResults: z.number().default(3).describe('Maximum restaurants to return (voice-optimized)'),
    }),
    outputSchema: z.string(),
    execute: async ({ cuisine, maxResults = 3 }) => {
      try {
        const cuisineLower = cuisine.toLowerCase();
        
        const matches = FALLBACK_RESTAURANTS.filter((restaurant) => {
          return (
            restaurant.cuisine.toLowerCase().includes(cuisineLower) ||
            restaurant.cuisine_group.toLowerCase().includes(cuisineLower)
          );
        });

        const restaurants = matches.slice(0, maxResults).map(restaurant => ({
          id: restaurant.id,
          name: restaurant.name,
          cuisine: restaurant.cuisine,
          rating: restaurant.rating,
          eta_minutes: restaurant.eta_minutes,
          closes_at: restaurant.closes_at,
          standout_dish: restaurant.standout_dish,
          delivery_fee: restaurant.delivery_fee,
          promo: restaurant.promo,
          hero_image: restaurant.hero_image,
        }));

        return JSON.stringify({
          restaurants,
          total_found: matches.length,
          search_query: cuisine,
        });
      } catch (error) {
        console.error('findRestaurantsByType error:', error);
        return JSON.stringify({
          restaurants: [],
          total_found: 0,
          search_query: cuisine,
          error: 'Unable to search restaurants',
        });
      }
    },
  }),

  // Quick cart view for voice
  quickViewCart: tool({
    description: 'Show current cart contents optimized for voice interaction',
    inputSchema: z.object({}).strip(),
    outputSchema: z.string(),
    execute: async () => {
      try {
        if (!supabase) {
          return { success: false, message: 'Database not available' };
        }

        const { data: cartItems, error } = await supabase
          .from('fc_cart_items')
          .select('*')
          .eq('user_id', DEMO_PROFILE_ID)
          .order('created_at', { ascending: true });

        if (error) {
          return { success: false, message: 'Unable to load cart' };
        }

        const items = cartItems || [];
        const subtotal = items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
        const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
        
        // Group by restaurant for voice summary
        const byRestaurant = items.reduce((acc: Record<string, any>, item) => {
          const key = item.restaurant_id || 'unknown';
          if (!acc[key]) {
            acc[key] = {
              restaurant_name: item.restaurant_name || 'Unknown',
              items: [],
            };
          }
          acc[key].items.push(item);
          return acc;
        }, {});

        return JSON.stringify({
          success: true,
          cart: {
            items,
            restaurants: Object.values(byRestaurant),
            summary: {
              total_items: totalItems,
              subtotal,
              estimated_tax: Math.round(subtotal * 0.0875 * 100) / 100,
              estimated_delivery: totalItems > 0 ? 2.99 : 0,
              estimated_total: Math.round((subtotal * 1.0875 + (totalItems > 0 ? 2.99 : 0)) * 100) / 100,
            },
          },
        });
      } catch (error) {
        console.error('quickViewCart error:', error);
        return JSON.stringify({ success: false, message: 'Unable to load cart' });
      }
    },
  }),
};