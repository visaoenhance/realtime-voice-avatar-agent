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

// Persistent voice cart storage (in-memory for demo)
let voiceCart: any = null;

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

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
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

  // Direct item search - "I want cheesecake" → immediate results from Supabase
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

        // Try Supabase first - this is where the real data is!
        if (supabase) {
          try {
            const client = ensureSupabase();
            const { data, error } = await client
              .from('fc_menu_items')
              .select(`
                id, slug, name, description, base_price, calories, rating, tags, image, 
                section:section_id (id, title), 
                restaurant:restaurant_id (id, slug, name)
              `)
              .eq('is_available', true)
              .ilike('name', `%${query}%`)
              .order('name')
              .limit(maxResults * 2); // Get more to filter better

            if (error) {
              console.error('Supabase search error:', error);
            } else if (data && data.length > 0) {
              results = (data ?? []).map(item => {
                const sectionRelation = Array.isArray(item.section) ? item.section[0] : item.section;
                const restaurantRelation = Array.isArray(item.restaurant) ? item.restaurant[0] : item.restaurant;

                return {
                  id: item.id,
                  slug: item.slug,
                  name: item.name,
                  description: item.description,
                  price: item.base_price ?? 0,
                  tags: item.tags ?? [],
                  calories: item.calories,
                  rating: item.rating,
                  sectionTitle: sectionRelation?.title ?? null,
                  restaurantId: restaurantRelation?.id ?? null,
                  restaurantSlug: restaurantRelation?.slug ?? null,
                  restaurantName: restaurantRelation?.name ?? null,
                  image: item.image,
                };
              });

              // Filter for "no chocolate" request
              if (query.toLowerCase().includes('no chocolate') || query.toLowerCase().includes('without chocolate')) {
                results = results.filter(item => {
                  const text = `${item.name} ${item.description || ''}`.toLowerCase();
                  return !text.includes('chocolate');
                });
              }

              // Take only maxResults
              results = results.slice(0, maxResults);
            }
          } catch (supabaseError) {
            console.error('Supabase connection failed:', supabaseError);
          }
        }

        // Fallback to local SAMPLE_MENU_BY_RESTAURANT if no Supabase results
        if (results.length === 0) {
          const matchedItems: any[] = [];

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
                if (item.name.toLowerCase().includes(queryLower.replace(/\s+(no|without)\s+chocolate/g, ''))) score += 10;
                if (item.description?.toLowerCase().includes(queryLower.replace(/\s+(no|without)\s+chocolate/g, ''))) score += 5;
                if (searchableText.includes(queryLower.replace(/\s+(no|without)\s+chocolate/g, ''))) score += 1;
                
                if (score > 0) {
                  // Filter out chocolate if requested
                  if (queryLower.includes('no chocolate') || queryLower.includes('without chocolate')) {
                    const text = `${item.name} ${item.description || ''}`.toLowerCase();
                    if (text.includes('chocolate')) {
                      return; // Skip chocolate items
                    }
                  }

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
            .map(match => ({
              id: match.item.slug || `${match.restaurant.id}-${match.item.name.toLowerCase().replace(/\s+/g, '-')}`,
              slug: match.item.slug || match.item.name.toLowerCase().replace(/\s+/g, '-'),
              name: match.item.name,
              description: match.item.description,
              price: match.item.price,
              tags: match.item.tags || [],
              calories: match.item.calories,
              rating: match.item.rating,
              sectionTitle: match.item.section,
              restaurantId: match.restaurant.id,
              restaurantSlug: match.restaurant.id,
              restaurantName: match.restaurant.name,
              image: match.item.image,
            }));
        }

        // Group results by restaurant if multiple restaurants
        const restaurantGroups = new Map<string, MenuItemSummary[]>();
        results.forEach(result => {
          const restaurantKey = result.restaurantId || 'unknown';
          if (!restaurantGroups.has(restaurantKey)) {
            restaurantGroups.set(restaurantKey, []);
          }
          restaurantGroups.get(restaurantKey)!.push(result);
        });

        const multipleRestaurants = restaurantGroups.size > 1;
        
        return JSON.stringify({
          filters: {
            query: query,
            maxPrice: undefined,
            tags: []
          },
          results: results.map(result => ({
            id: result.id,
            slug: result.slug,
            name: result.name,
            description: result.description,
            price: result.price,
            image: result.image,
            tags: result.tags,
            section: result.sectionTitle,
            // Make restaurant info more prominent
            restaurantName: result.restaurantName,
            restaurant: {
              id: result.restaurantId,
              name: result.restaurantName,
              slug: result.restaurantSlug
            }
          })),
          speechSummary: multipleRestaurants 
            ? `Found ${results.length} ${query} options from ${restaurantGroups.size} restaurants: ${Array.from(restaurantGroups.entries()).map(([_, items]) => `${items[0].restaurantName} (${items.length})`).join(', ')}`
            : `Found ${results.length} ${query} options${results.length === maxResults ? ` (showing top ${maxResults})` : ''}`,
          restaurant: undefined,
          // Add grouping info for the UI
          groupedByRestaurant: multipleRestaurants,
          restaurantGroups: multipleRestaurants ? Array.from(restaurantGroups.entries()).map(([restaurantId, items]) => ({
            restaurantId,
            restaurantName: items[0].restaurantName,
            itemCount: items.length,
            items: items.map(item => item.id)
          })) : undefined
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

  // Restaurant type search - "I want Thai food" → show restaurants
  findRestaurantsByType: tool({
    description: 'Find restaurants by cuisine type or category for voice commands',
    inputSchema: z.object({
      cuisineType: z.string().describe('The cuisine type to search for (e.g., "thai", "pizza", "mexican")'),
      maxResults: z.number().default(3).describe('Maximum restaurants to return for voice'),
    }),
    outputSchema: z.string(),
    execute: async ({ cuisineType, maxResults = 3 }) => {
      try {
        const restaurants = FALLBACK_RESTAURANTS
          .filter(r => r.cuisine.toLowerCase().includes(cuisineType.toLowerCase()) || 
                      r.cuisine_group.toLowerCase().includes(cuisineType.toLowerCase()))
          .slice(0, maxResults);

        return JSON.stringify({
          query: cuisineType,
          restaurants,
          total_found: restaurants.length,
        });
      } catch (error) {
        console.error('findRestaurantsByType error:', error);
        return JSON.stringify({
          query: cuisineType,
          restaurants: [],
          total_found: 0,
        });
      }
    },
  }),

  // Quick cart view for voice
  quickViewCart: tool({
    description: 'Show current cart contents for voice interaction',
    inputSchema: z.object({}).strip(),
    outputSchema: z.string(),
    execute: async () => {
      try {
        // Return persistent voice cart or empty cart
        if (!voiceCart || !voiceCart.items || voiceCart.items.length === 0) {
          return JSON.stringify({
            success: true,
            cart: {
              id: 'voice-cart-empty',
              restaurantId: null,
              restaurantName: null,
              status: 'empty',
              subtotal: 0,
              deliveryFee: 0,
              total: 0,
              items: [],
            },
            speechSummary: 'Your cart is empty.',
          });
        }

        return JSON.stringify({
          success: true,
          cart: voiceCart,
          speechSummary: `You have ${voiceCart.items.length} item${voiceCart.items.length !== 1 ? 's' : ''} in your cart. Total: ${formatCurrency(voiceCart.total)}`
        });
      } catch (error) {
        console.error('quickViewCart error:', error);
        return JSON.stringify({
          success: false,
          error: 'Unable to load cart',
          speechSummary: 'Unable to load cart',
        });
      }
    },
  }),

  // Quick add to cart for voice ordering  
  quickAddToCart: tool({
    description: 'Add specific menu items to cart by name for voice ordering commands like "order the strawberry cheesecake" or "add vanilla and strawberry cheesecake"',
    inputSchema: z.object({
      itemName: z.string().describe('The menu item name to add to cart'),
      restaurantName: z.string().optional().describe('The restaurant name if specified'),
      quantity: z.number().default(1).describe('Quantity to add'),
      additionalItems: z.array(z.object({
        itemName: z.string(),
        quantity: z.number().default(1)
      })).optional().describe('Additional items to add in the same order'),
    }),
    outputSchema: z.string(),
    execute: async ({ itemName, restaurantName, quantity = 1, additionalItems = [] }) => {
      try {
        // Combine main item with additional items
        const allItems = [
          { itemName, quantity },
          ...additionalItems
        ];

        const basePrice = 8.99;
        const deliveryFee = 2.99;
        
        let totalQuantity = 0;
        let subtotal = 0;
        const mockItems: any[] = [];

        // Process all items
        allItems.forEach((item, index) => {
          const itemId = `item-${Date.now()}-${index}`;
          const linePrice = basePrice * item.quantity;
          totalQuantity += item.quantity;
          subtotal += linePrice;
          
          mockItems.push({
            id: itemId,
            menuItemId: `menu-${Date.now()}-${index}`,
            name: item.itemName,
            quantity: item.quantity,
            basePrice: basePrice,
            totalPrice: linePrice,
            options: [],
            restaurant: {
              name: restaurantName || 'Restaurant'
            }
          });
        });

        const total = subtotal + deliveryFee;
        const mockCartId = `cart-${Date.now()}`;

        const mockCart = {
          id: mockCartId,
          restaurantId: 'mock-restaurant-id',
          restaurantSlug: 'mock-restaurant',
          restaurantName: restaurantName || 'Restaurant',
          status: 'active',
          subtotal: subtotal,
          deliveryFee: deliveryFee,
          total: total,
          items: mockItems,
          updatedAt: new Date().toISOString()
        };

        // Save to persistent voice cart
        voiceCart = mockCart;

        const mockRestaurant = {
          id: 'mock-restaurant-id',
          name: restaurantName || 'Restaurant',
          slug: 'mock-restaurant',
          cuisine: 'american'
        };

        // Create speech summary for multiple items
        let speechSummary: string;
        if (allItems.length === 1) {
          speechSummary = `Added ${quantity} ${itemName}${restaurantName ? ` from ${restaurantName}` : ''} to your cart. Total: ${formatCurrency(total)}`;
        } else {
          const itemsList = allItems.map(item => `${item.quantity} ${item.itemName}`).join(' and ');
          speechSummary = `Added ${itemsList}${restaurantName ? ` from ${restaurantName}` : ''} to your cart. ${totalQuantity} items total: ${formatCurrency(total)}`;
        }

        return JSON.stringify({
          success: true,
          cartId: mockCartId,
          createdCart: false,
          itemId: mockItems[0].id,
          restaurant: mockRestaurant,
          item: mockItems[0], // Primary item for compatibility
          subtotal: subtotal,
          cart: mockCart,
          speechSummary: speechSummary
        });
      } catch (error) {
        console.error('quickAddToCart error:', error);
        return JSON.stringify({
          success: false,
          message: `Unable to add items to cart - please try again`,
          speechSummary: `Unable to add items to cart - please try again`,
        });
      }
    },
  }),

  // Quick checkout for voice ordering
  quickCheckout: tool({
    description: 'Complete checkout process for current cart items in voice interface',
    inputSchema: z.object({
      deliveryAddress: z.string().optional().describe('Delivery address if different from default'),
      paymentMethod: z.string().optional().describe('Payment method if specified'),
    }),
    outputSchema: z.string(),
    execute: async ({ deliveryAddress, paymentMethod }) => {
      try {
        // Check if cart has items
        if (!voiceCart || !voiceCart.items || voiceCart.items.length === 0) {
          return JSON.stringify({
            success: false,
            message: 'Your cart is empty. Add some items first.',
            speechSummary: 'Your cart is empty. Please add some items before checkout.',
          });
        }

        // Mock successful checkout
        const orderNumber = `VO${Date.now().toString().slice(-6)}`;
        const estimatedDelivery = new Date();
        estimatedDelivery.setMinutes(estimatedDelivery.getMinutes() + 35);

        const orderSummary = {
          orderNumber: orderNumber,
          success: true,
          restaurant: {
            id: voiceCart.restaurantId,
            name: voiceCart.restaurantName,
            cuisine: 'american'
          },
          items: voiceCart.items,
          subtotal: voiceCart.subtotal,
          deliveryFee: voiceCart.deliveryFee,
          total: voiceCart.total,
          estimatedDelivery: estimatedDelivery.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit' 
          }),
          deliveryAddress: deliveryAddress || '123 Main St, Orlando, FL',
          paymentMethod: paymentMethod || 'Credit Card ending in 4567',
          placedAt: new Date().toISOString()
        };

        // Clear the cart after successful checkout
        voiceCart = null;

        const speechSummary = `Order placed successfully! Your order number is ${orderNumber}. ${orderSummary.items.length} items totaling ${formatCurrency(orderSummary.total)}. Estimated delivery: ${orderSummary.estimatedDelivery}.`;

        // Return data structure expected by OrderConfirmationCard
        return JSON.stringify({
          success: true,
          orderId: orderNumber,
          restaurant: {
            id: orderSummary.restaurant.id,
            name: orderSummary.restaurant.name,
            cuisine: orderSummary.restaurant.cuisine,
            cuisineGroup: orderSummary.restaurant.cuisine
          },
          itemCount: orderSummary.items.length,
          total: orderSummary.total,
          estimatedDeliveryTime: orderSummary.estimatedDelivery,
          speechSummary: speechSummary,
          // Include full order details for any card that might need them
          orderDetails: orderSummary
        });
      } catch (error) {
        console.error('quickCheckout error:', error);
        return JSON.stringify({
          success: false,
          message: 'Unable to complete checkout - please try again',
          speechSummary: 'Unable to complete checkout - please try again',
        });
      }
    },
  }),
};