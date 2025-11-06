import { UIMessage } from 'ai';

export type FoodCourtUIMessage = UIMessage;

export type FoodCourtTools = {
  getUserContext: {
    input: Record<string, never>;
    output: string;
  };
  searchRestaurants: {
    input: {
      cuisine?: string;
      subCuisine?: string;
      dietaryTags?: string[];
      closesWithinMinutes?: number;
      budget?: 'low' | 'medium' | 'high';
      locationBounds?: {
        latitude: number;
        longitude: number;
        radiusMiles?: number;
      };
      limit?: number;
    };
    output: string;
  };
  getRestaurantMenu: {
    input: {
      restaurantId?: string;
      restaurantSlug?: string;
      limitSections?: number;
      limitItemsPerSection?: number;
    };
    output: string;
  };
  searchMenuItems: {
    input: {
      restaurantId?: string;
      restaurantSlug?: string;
      query?: string;
      maxPrice?: number;
      tags?: string[];
      limit?: number;
    };
    output: string;
  };
  recommendShortlist: {
    input: {
      restaurants: Array<{
        id: string;
        name: string;
        cuisine: string;
        subCuisine?: string;
        rating?: number | null;
        etaMinutes?: number | null;
        closesAt?: string | null;
        standoutDish?: string | null;
        deliveryFee?: number | null;
        promo?: string | null;
      }>;
      tone?: 'concise' | 'detailed';
    };
    output: string;
  };
  addItemToCart: {
    input: {
      restaurantId?: string;
      restaurantSlug?: string;
      menuItemId?: string;
      menuItemSlug?: string;
      quantity?: number;
      optionChoiceIds?: string[];
      notes?: string;
    };
    output: string;
  };
  viewCart: {
    input: {
      cartId?: string;
      restaurantId?: string;
      restaurantSlug?: string;
      includeEmpty?: boolean;
    };
    output: string;
  };
  submitCartOrder: {
    input: {
      cartId?: string;
      restaurantId?: string;
      restaurantSlug?: string;
    };
    output: string;
  };
  fetchMenuItemImage: {
    input: {
      restaurantId?: string;
      restaurantSlug?: string;
      menuItemId?: string;
      menuItemSlug?: string;
      menuItemName?: string;
    };
    output: string;
  };
  updatePreferences: {
    input: {
      favoriteCuisines?: string[];
      dislikedCuisines?: string[];
      dietaryTags?: string[];
      spiceLevel?: 'low' | 'medium' | 'high';
      budgetRange?: 'value' | 'standard' | 'premium';
      notes?: string;
    };
    output: string;
  };
  updateHomepageLayout: {
    input: {
      focusRow?: string;
      demoteRows?: string[];
      highlightCuisine?: string;
      heroRestaurantId?: string;
    };
    output: string;
  };
  logOrderIntent: {
    input: {
      restaurantId: string;
      restaurantName: string;
      intent: 'browse' | 'checkout' | 'save' | 'handoff';
      notes?: string;
    };
    output: string;
  };
  logFeedback: {
    input: {
      sentiment: 'positive' | 'neutral' | 'negative';
      notes?: string;
    };
    output: string;
  };
};

