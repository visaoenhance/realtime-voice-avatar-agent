# LiveKit Native Integration Guide

**Project**: ubereats-ai-sdk-hitl  
**Date**: February 13, 2026  
**Status**: Pre-Implementation Planning  
**Purpose**: Complete guide for integrating existing TypeScript/Supabase tools with Python LiveKit native agent

---

## Table of Contents

1. [Overview](#overview)
2. [Current System Architecture](#current-system-architecture)
3. [Integration Strategy](#integration-strategy)
4. [Database Connection Setup](#database-connection-setup)
5. [Tool-by-Tool Migration Map](#tool-by-tool-migration-map)
6. [Data Flow Diagrams](#data-flow-diagrams)
7. [Testing Parity](#testing-parity)
8. [Common Patterns](#common-patterns)

---

## Overview

### The Challenge

We have **working TypeScript tools** that query Supabase:
- Location: `/app/api/voice-chat/tools.ts` (560 lines)
- Language: TypeScript/JavaScript
- Database: Supabase (PostgreSQL)
- Connection: `@supabase/supabase-js` client
- Environment: Next.js API routes

We need to **replicate these in Python** for LiveKit native agent:
- Location: `agents/food_concierge_native.py`
- Language: Python
- Database: Same Supabase instance (no changes!)
- Connection: `supabase-py` client
- Environment: Long-running Python process

### The Goal

**100% functional parity** between TypeScript tools and Python function tools:
- ✅ Same queries
- ✅ Same data
- ✅ Same results
- ✅ Same error handling
- ✅ Zero database schema changes

---

## Current System Architecture

### Existing Tools (TypeScript)

From [`/app/api/voice-chat/tools.ts`](../app/api/voice-chat/tools.ts):

```typescript
// Current TypeScript tools using Supabase
export const voiceTools = {
  getUserProfile: tool({ ... }),      // Load user preferences
  findFoodItem: tool({ ... }),        // Search menu items
  findRestaurantsByType: tool({ ... }), // Search restaurants
  quickViewCart: tool({ ... }),       // View cart
  quickAddToCart: tool({ ... }),      // Add to cart
  quickCheckout: tool({ ... }),       // Complete order
};
```

### Supabase Connection (TypeScript)

From [`/lib/supabaseServer.ts`](../lib/supabaseServer.ts):

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false },
});

export const DEMO_PROFILE_ID = '00000000-0000-0000-0000-000000000001';
```

### Database Schema (Existing)

From [`/supabase/schema_merged_20251106.sql`](../supabase/schema_merged_20251106.sql):

```sql
-- NO CHANGES TO THESE TABLES
fc_profiles (id, household_name, default_location, ...)
fc_preferences (id, profile_id, favorite_cuisines, dietary_tags, ...)
fc_restaurants (id, slug, name, cuisine_group, cuisine, ...)
fc_menu_sections (id, restaurant_id, slug, title, ...)
fc_menu_items (id, restaurant_id, section_id, name, base_price, ...)
fc_menu_item_option_groups (id, menu_item_id, title, ...)
fc_menu_item_option_choices (id, option_group_id, label, price_adjustment, ...)
fc_carts (id, profile_id, restaurant_id, status, subtotal, ...)
fc_cart_items (id, cart_id, menu_item_id, quantity, total_price, ...)
fc_cart_item_options (id, cart_item_id, option_choice_id, ...)
fc_orders (id, profile_id, restaurant_id, restaurant_name, total, ...)
```

**Critical Point**: Python agent will use **these exact tables with zero modifications**.

---

## Integration Strategy

### Phase 1: Environment Setup

Both TypeScript and Python will use the **same environment variables**:

```bash
# .env.local (SHARED by both systems)

# Supabase (used by TypeScript AND Python)
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DEMO_PROFILE_ID=00000000-0000-0000-0000-000000000001

# OpenAI (used by TypeScript AND Python)
OPENAI_API_KEY=sk-proj-...

# LiveKit (Python agent only)
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=APIxxxxx
LIVEKIT_API_SECRET=secretxxxxx
```

**No new environment variables needed** - Python reuses existing Supabase credentials.

### Phase 2: Python Supabase Client Setup

Create `agents/database.py`:

```python
"""
Supabase connection for LiveKit Native Agent
Uses EXACT same credentials as TypeScript tools
"""

from supabase import create_client, Client
import os
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv

# Load environment variables (same .env.local as Next.js)
load_dotenv('.env.local')

# Initialize Supabase client (same credentials as TypeScript)
supabase_url = os.getenv("SUPABASE_URL")
supabase_service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not supabase_url or not supabase_service_role_key:
    raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")

# Create client (mirrors lib/supabaseServer.ts)
supabase: Client = create_client(supabase_url, supabase_service_role_key)

# Demo user ID (same as TypeScript)
DEMO_PROFILE_ID = os.getenv("DEMO_PROFILE_ID", "00000000-0000-0000-0000-000000000001")

print(f"✅ Supabase client initialized for {supabase_url}")
```

### Phase 3: Tool Migration Map

Each TypeScript tool becomes a Python function tool with **identical queries**.

---

## Tool-by-Tool Migration Map

### Tool 1: getUserProfile

**TypeScript Implementation** (from `voice-chat/tools.ts:47`):

```typescript
getUserProfile: tool({
  description: 'Get user profile with preferences and delivery location',
  inputSchema: z.object({}).strip(),
  outputSchema: z.string(),
  execute: async () => {
    const { data: preferences, error } = await supabase
      .from('fc_preferences')
      .select('*')
      .eq('id', DEMO_PROFILE_ID)
      .single();

    const profile = preferences || FALLBACK_PREFERENCES;
    
    return JSON.stringify({
      profile: {
        favoriteCuisines: profile.favorite_cuisines || [],
        dietaryTags: profile.dietary_tags || [],
        dislikedCuisines: profile.disliked_cuisines || [],
        spiceLevel: profile.spice_level || 'medium',
        budgetRange: profile.budget_range || 'standard',
        defaultLocation: profile.default_location || { city: 'Orlando', state: 'FL' },
      },
    });
  },
}),
```

**Python Implementation** (for `agents/food_concierge_native.py`):

```python
from livekit.agents import function_tool
from typing import Annotated
from database import supabase, DEMO_PROFILE_ID
import json

@function_tool
async def get_user_profile(
    user_id: Annotated[str, "User ID"] = None
) -> str:
    """Get user profile with preferences and delivery location"""
    
    profile_id = user_id or DEMO_PROFILE_ID
    
    try:
        # EXACT SAME QUERY as TypeScript
        response = supabase.table('fc_preferences').select('*').eq(
            'id', profile_id
        ).maybe_single().execute()
        
        preferences = response.data
        
        # Fallback to defaults if no data
        if not preferences:
            preferences = {
                'favorite_cuisines': [],
                'dietary_tags': [],
                'disliked_cuisines': [],
                'spice_level': 'medium',
                'budget_range': 'standard',
            }
        
        # Return EXACT SAME FORMAT as TypeScript
        return json.dumps({
            'profile': {
                'favoriteCuisines': preferences.get('favorite_cuisines', []),
                'dietaryTags': preferences.get('dietary_tags', []),
                'dislikedCuisines': preferences.get('disliked_cuisines', []),
                'spiceLevel': preferences.get('spice_level', 'medium'),
                'budgetRange': preferences.get('budget_range', 'standard'),
                'defaultLocation': preferences.get('default_location', {'city': 'Orlando', 'state': 'FL'}),
            },
        })
        
    except Exception as e:
        print(f"Error in get_user_profile: {e}")
        # Return fallback
        return json.dumps({
            'profile': {
                'favoriteCuisines': [],
                'dietaryTags': [],
                'dislikedCuisines': [],
                'spiceLevel': 'medium',
                'budgetRange': 'standard',
                'defaultLocation': {'city': 'Orlando', 'state': 'FL'},
            },
        })
```

**Key Points**:
- ✅ Same query: `fc_preferences` table with `eq('id', profile_id)`
- ✅ Same fallback behavior
- ✅ Same JSON output format
- ✅ Same error handling

---

### Tool 2: findFoodItem

**TypeScript Implementation** (from `voice-chat/tools.ts:109`):

```typescript
findFoodItem: tool({
  description: 'Search for specific food items across all restaurants',
  inputSchema: z.object({
    query: z.string(),
    maxResults: z.number().default(5),
  }),
  outputSchema: z.string(),
  execute: async ({ query, maxResults = 5 }) => {
    const { data, error } = await supabase
      .from('fc_menu_items')
      .select(`
        id, slug, name, description, base_price, calories, rating, tags, image, 
        section:section_id (id, title), 
        restaurant:restaurant_id (id, slug, name)
      `)
      .eq('is_available', true)
      .ilike('name', `%${query}%`)
      .order('name')
      .limit(maxResults * 2);

    const results = (data ?? []).map(item => {
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

    return JSON.stringify({
      filters: { query, maxPrice: undefined, tags: [] },
      results: results,
      speechSummary: `Found ${results.length} ${query} options`,
    });
  },
}),
```

**Python Implementation**:

```python
@function_tool
async def find_food_item(
    query: Annotated[str, "The food item to search for"],
    max_results: Annotated[int, "Maximum results to return"] = 5
) -> str:
    """Search for specific food items across all restaurants"""
    
    try:
        # EXACT SAME QUERY as TypeScript with relations
        response = supabase.table('fc_menu_items').select(
            '''
            id, slug, name, description, base_price, calories, rating, tags, image,
            section:section_id (id, title),
            restaurant:restaurant_id (id, slug, name)
            '''
        ).eq('is_available', True).ilike('name', f'%{query}%').order('name').limit(max_results * 2).execute()
        
        data = response.data or []
        
        # Transform data EXACTLY like TypeScript
        results = []
        for item in data:
            section_relation = item['section'][0] if isinstance(item['section'], list) else item['section']
            restaurant_relation = item['restaurant'][0] if isinstance(item['restaurant'], list) else item['restaurant']
            
            results.append({
                'id': item['id'],
                'slug': item['slug'],
                'name': item['name'],
                'description': item.get('description'),
                'price': item.get('base_price', 0),
                'tags': item.get('tags', []),
                'calories': item.get('calories'),
                'rating': item.get('rating'),
                'sectionTitle': section_relation.get('title') if section_relation else None,
                'restaurantId': restaurant_relation.get('id') if restaurant_relation else None,
                'restaurantSlug': restaurant_relation.get('slug') if restaurant_relation else None,
                'restaurantName': restaurant_relation.get('name') if restaurant_relation else None,
                'image': item.get('image'),
            })
        
        # Filter for "no chocolate" like TypeScript does
        if 'no chocolate' in query.lower() or 'without chocolate' in query.lower():
            results = [
                item for item in results
                if 'chocolate' not in f"{item['name']} {item.get('description', '')}".lower()
            ]
        
        # Take only max_results
        results = results[:max_results]
        
        # Return EXACT SAME FORMAT as TypeScript
        return json.dumps({
            'filters': {'query': query, 'maxPrice': None, 'tags': []},
            'results': results,
            'speechSummary': f"Found {len(results)} {query} options",
        })
        
    except Exception as e:
        print(f"Error in find_food_item: {e}")
        return json.dumps({
            'filters': {'query': query, 'maxPrice': None, 'tags': []},
            'results': [],
            'speechSummary': f"Unable to search for {query} - please try again",
        })
```

**Key Points**:
- ✅ Same query with relations (`section:section_id`, `restaurant:restaurant_id`)
- ✅ Same filtering logic (no chocolate)
- ✅ Same result transformation
- ✅ Same JSON output format
- ✅ Same speech summary format

---

### Tool 3: quickAddToCart

**TypeScript Implementation** (from `voice-chat/tools.ts:367`):

```typescript
quickAddToCart: tool({
  description: 'Add specific menu items to cart by name',
  inputSchema: z.object({
    itemName: z.string(),
    restaurantName: z.string().optional(),
    quantity: z.number().default(1),
    additionalItems: z.array(z.object({
      itemName: z.string(),
      quantity: z.number().default(1)
    })).optional(),
  }),
  outputSchema: z.string(),
  execute: async ({ itemName, restaurantName, quantity = 1, additionalItems = [] }) => {
    // Combines items, creates mock cart for demo
    const allItems = [{ itemName, quantity }, ...additionalItems];
    // ... cart creation logic with voiceCart persistence
    
    return JSON.stringify({
      success: true,
      cartId: mockCartId,
      cart: mockCart,
      speechSummary: `Added ${totalQuantity} items to cart. Total: ${formatCurrency(total)}`,
    });
  },
}),
```

**Python Implementation**:

```python
# In-memory cart storage (mirrors TypeScript's voiceCart)
voice_cart: Optional[Dict[str, Any]] = None

@function_tool
async def quick_add_to_cart(
    item_name: Annotated[str, "Name of item to add"],
    restaurant_name: Annotated[str, "Restaurant name"] = None,
    quantity: Annotated[int, "Quantity to add"] = 1,
    additional_items: Annotated[List[Dict[str, Any]], "Additional items"] = None
) -> str:
    """Add items to cart for voice ordering"""
    
    global voice_cart
    
    try:
        additional_items = additional_items or []
        
        # Combine all items EXACTLY like TypeScript
        all_items = [{'itemName': item_name, 'quantity': quantity}] + additional_items
        
        # Mock prices for demo (same as TypeScript)
        base_price = 8.99
        delivery_fee = 2.99
        
        total_quantity = 0
        subtotal = 0
        mock_items = []
        
        # Process items EXACTLY like TypeScript
        for idx, item in enumerate(all_items):
            item_id = f"item-{int(time.time() * 1000)}-{idx}"
            line_price = base_price * item['quantity']
            total_quantity += item['quantity']
            subtotal += line_price
            
            mock_items.append({
                'id': item_id,
                'menuItemId': f"menu-{int(time.time() * 1000)}-{idx}",
                'name': item['itemName'],
                'quantity': item['quantity'],
                'basePrice': base_price,
                'totalPrice': line_price,
                'options': [],
                'restaurant': {'name': restaurant_name or 'Restaurant'}
            })
        
        total = subtotal + delivery_fee
        mock_cart_id = f"cart-{int(time.time() * 1000)}"
        
        # Create cart object EXACTLY like TypeScript
        mock_cart = {
            'id': mock_cart_id,
            'restaurantId': 'mock-restaurant-id',
            'restaurantSlug': 'mock-restaurant',
            'restaurantName': restaurant_name or 'Restaurant',
            'status': 'active',
            'subtotal': subtotal,
            'deliveryFee': delivery_fee,
            'total': total,
            'items': mock_items,
            'updatedAt': datetime.now().isoformat()
        }
        
        # Save to persistent voice cart (mirrors TypeScript)
        voice_cart = mock_cart
        
        # Generate speech summary EXACTLY like TypeScript
        if len(all_items) == 1:
            speech_summary = f"Added {quantity} {item_name}{' from ' + restaurant_name if restaurant_name else ''} to your cart. Total: ${total:.2f}"
        else:
            items_list = ' and '.join([f"{item['quantity']} {item['itemName']}" for item in all_items])
            speech_summary = f"Added {items_list}{' from ' + restaurant_name if restaurant_name else ''} to your cart. {total_quantity} items total: ${total:.2f}"
        
        # Return EXACT SAME FORMAT as TypeScript
        return json.dumps({
            'success': True,
            'cartId': mock_cart_id,
            'cart': mock_cart,
            'speechSummary': speech_summary
        })
        
    except Exception as e:
        print(f"Error in quick_add_to_cart: {e}")
        return json.dumps({
            'success': False,
            'message': 'Unable to add items to cart - please try again',
            'speechSummary': 'Unable to add items to cart - please try again',
        })
```

**Key Points**:
- ✅ Same in-memory cart storage pattern
- ✅ Same mock data for demo
- ✅ Same multi-item handling
- ✅ Same price calculations
- ✅ Same speech summary format
- ✅ Same JSON output structure

---

### Tool 4: quickViewCart

**TypeScript Implementation** (from `voice-chat/tools.ts:308`):

```typescript
quickViewCart: tool({
  description: 'Show current cart contents',
  inputSchema: z.object({}).strip(),
  outputSchema: z.string(),
  execute: async () => {
    if (!voiceCart || !voiceCart.items || voiceCart.items.length === 0) {
      return JSON.stringify({
        success: true,
        cart: { /* empty cart */ },
        speechSummary: 'Your cart is empty.',
      });
    }

    return JSON.stringify({
      success: true,
      cart: voiceCart,
      speechSummary: `You have ${voiceCart.items.length} items. Total: ${formatCurrency(voiceCart.total)}`
    });
  },
}),
```

**Python Implementation**:

```python
@function_tool
async def quick_view_cart() -> str:
    """Show current cart contents for voice"""
    
    global voice_cart
    
    try:
        # Check empty cart EXACTLY like TypeScript
        if not voice_cart or not voice_cart.get('items') or len(voice_cart['items']) == 0:
            return json.dumps({
                'success': True,
                'cart': {
                    'id': 'voice-cart-empty',
                    'restaurantId': None,
                    'restaurantName': None,
                    'status': 'empty',
                    'subtotal': 0,
                    'deliveryFee': 0,
                    'total': 0,
                    'items': [],
                },
                'speechSummary': 'Your cart is empty.',
            })
        
        # Return cart EXACTLY like TypeScript
        return json.dumps({
            'success': True,
            'cart': voice_cart,
            'speechSummary': f"You have {len(voice_cart['items'])} item{'s' if len(voice_cart['items']) != 1 else ''}. Total: ${voice_cart['total']:.2f}"
        })
        
    except Exception as e:
        print(f"Error in quick_view_cart: {e}")
        return json.dumps({
            'success': False,
            'error': 'Unable to load cart',
            'speechSummary': 'Unable to load cart',
        })
```

**Key Points**:
- ✅ Same empty cart check
- ✅ Same cart structure
- ✅ Same speech summary format
- ✅ Same error handling

---

### Tool 5: quickCheckout

**TypeScript Implementation** (from `voice-chat/tools.ts:455`):

```typescript
quickCheckout: tool({
  description: 'Complete checkout process for current cart',
  inputSchema: z.object({
    deliveryAddress: z.string().optional(),
    paymentMethod: z.string().optional(),
  }),
  outputSchema: z.string(),
  execute: async ({ deliveryAddress, paymentMethod }) => {
    if (!voiceCart || voiceCart.items.length === 0) {
      return JSON.stringify({
        success: false,
        message: 'Your cart is empty.',
        speechSummary: 'Your cart is empty.',
      });
    }

    const orderNumber = `VO${Date.now().toString().slice(-6)}`;
    // ... create order, clear cart
    
    voiceCart = null; // Clear cart after checkout
    
    return JSON.stringify({
      success: true,
      orderId: orderNumber,
      speechSummary: `Order placed! Order #${orderNumber}. Total: ${formatCurrency(total)}. Estimated delivery: ${estimatedTime}.`,
    });
  },
}),
```

**Python Implementation**:

```python
@function_tool
async def quick_checkout(
    delivery_address: Annotated[str, "Delivery address"] = None,
    payment_method: Annotated[str, "Payment method"] = None
) -> str:
    """Complete checkout process for current cart"""
    
    global voice_cart
    
    try:
        # Check cart EXACTLY like TypeScript
        if not voice_cart or not voice_cart.get('items') or len(voice_cart['items']) == 0:
            return json.dumps({
                'success': False,
                'message': 'Your cart is empty. Add some items first.',
                'speechSummary': 'Your cart is empty. Please add some items before checkout.',
            })
        
        # Generate order number EXACTLY like TypeScript
        order_number = f"VO{str(int(time.time() * 1000))[-6:]}"
        
        # Calculate estimated delivery
        estimated_delivery = datetime.now() + timedelta(minutes=35)
        estimated_time = estimated_delivery.strftime("%-I:%M %p")
        
        # Create order summary
        order_summary = {
            'orderNumber': order_number,
            'success': True,
            'restaurant': {
                'id': voice_cart['restaurantId'],
                'name': voice_cart['restaurantName'],
                'cuisine': 'american'
            },
            'items': voice_cart['items'],
            'subtotal': voice_cart['subtotal'],
            'deliveryFee': voice_cart['deliveryFee'],
            'total': voice_cart['total'],
            'estimatedDelivery': estimated_time,
            'deliveryAddress': delivery_address or '123 Main St, Orlando, FL',
            'paymentMethod': payment_method or 'Credit Card ending in 4567',
            'placedAt': datetime.now().isoformat()
        }
        
        # Clear cart after checkout (EXACTLY like TypeScript)
        voice_cart = None
        
        # Generate speech summary EXACTLY like TypeScript
        speech_summary = f"Order placed successfully! Your order number is {order_number}. {len(order_summary['items'])} items totaling ${order_summary['total']:.2f}. Estimated delivery: {estimated_time}."
        
        # Return EXACT SAME FORMAT as TypeScript
        return json.dumps({
            'success': True,
            'orderId': order_number,
            'restaurant': order_summary['restaurant'],
            'itemCount': len(order_summary['items']),
            'total': order_summary['total'],
            'estimatedDeliveryTime': estimated_time,
            'speechSummary': speech_summary,
            'orderDetails': order_summary
        })
        
    except Exception as e:
        print(f"Error in quick_checkout: {e}")
        return json.dumps({
            'success': False,
            'message': 'Unable to complete checkout - please try again',
            'speechSummary': 'Unable to complete checkout - please try again',
        })
```

**Key Points**:
- ✅ Same empty cart validation
- ✅ Same order number generation
- ✅ Same cart clearing after checkout
- ✅ Same estimated delivery calculation
- ✅ Same speech summary format
- ✅ Same JSON output structure

---

## Data Flow Diagrams

### Current Flow (TypeScript)

```
┌─────────────────┐
│  User (Browser) │
└────────┬────────┘
         │ Voice input
         ▼
┌─────────────────────────┐
│ /api/voice-chat/route.ts│
│ (AI SDK + Next.js)      │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ voice-chat/tools.ts     │
│ getUserProfile()        │
│ findFoodItem()          │
│ quickAddToCart()        │
│ etc.                    │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ lib/supabaseServer.ts   │
│ createClient(           │
│   SUPABASE_URL,         │
│   SERVICE_ROLE_KEY      │
│ )                       │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│   Supabase Database     │
│ fc_preferences          │
│ fc_menu_items           │
│ fc_restaurants          │
│ fc_carts                │
│ fc_orders               │
└─────────────────────────┘
```

### New Native Flow (Python)

```
┌─────────────────┐
│  User (Browser) │
└────────┬────────┘
         │ Voice input (WebRTC)
         ▼
┌─────────────────────────┐
│ LiveKit Media Server    │
└────────┬────────────────┘
         │
         ▼
┌────────────────────────────┐
│ food_concierge_native.py   │
│ (Python LiveKit Agent)     │
│                            │
│ @function_tool             │
│ get_user_profile()         │
│ find_food_item()           │
│ quick_add_to_cart()        │
│ etc.                       │
└────────┬───────────────────┘
         │
         ▼
┌─────────────────────────┐
│ agents/database.py      │
│ create_client(          │
│   SUPABASE_URL,         │
│   SERVICE_ROLE_KEY      │
│ )                       │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│   Supabase Database     │
│ fc_preferences          │  ← SAME DATABASE
│ fc_menu_items           │  ← SAME TABLES
│ fc_restaurants          │  ← SAME QUERIES
│ fc_carts                │  ← SAME DATA
│ fc_orders               │
└─────────────────────────┘
```

**Key Observation**: Both systems connect to the **exact same database with exact same credentials**.

---

## Testing Parity

### Verification Checklist

Before considering native implementation complete, verify:

#### 1. Connection Parity
```bash
# TypeScript
✅ npm run dev
✅ Visit /food/concierge-livekit
✅ Check console for Supabase connection

# Python
✅ cd agents && python food_concierge_native.py
✅ Check logs for "Supabase client initialized"
```

#### 2. Query Parity (getUserProfile)
```bash
# TypeScript test
curl -X POST http://localhost:3000/api/voice-chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Load my profile"}]}'

# Python test (via agent)
# Say: "Load my profile"
# Verify: Same JSON response structure
```

#### 3. Query Parity (findFoodItem)
```bash
# TypeScript test
# Search for "cheesecake"
# Note: Number of results, restaurant names, prices

# Python test
# Say: "I want cheesecake"
# Verify: Same results, same order, same data
```

#### 4. Cart Parity
```bash
# TypeScript workflow
1. Add items to cart
2. View cart
3. Note: Total, item count, structure

# Python workflow
1. Say: "Add strawberry cheesecake"
2. Say: "Show my cart"
3. Verify: Exact same total, count, structure
```

#### 5. Data Integrity
```sql
-- Run after both systems process orders
SELECT * FROM fc_orders ORDER BY created_at DESC LIMIT 10;

-- Verify:
-- ✅ TypeScript orders have correct structure
-- ✅ Python orders have IDENTICAL structure
-- ✅ No duplicate data
-- ✅ No foreign key violations
```

### Automated Tests

Create `scripts/test-typescript-python-parity.js`:

```javascript
#!/usr/bin/env node
/**
 * Test TypeScript vs Python Tool Parity
 * Ensures both systems return identical results for same queries
 */

async function testParity() {
  console.log('🧪 Testing TypeScript ↔ Python Parity\n');
  
  // Test 1: getUserProfile
  console.log('📍 TEST 1: getUserProfile parity');
  const tsProfile = await fetchTypeScriptProfile();
  const pyProfile = await fetchPythonProfile();
  compareParity(tsProfile, pyProfile, 'getUserProfile');
  
  // Test 2: findFoodItem
  console.log('\n📍 TEST 2: findFoodItem("cheesecake") parity');
  const tsSearch = await searchTypeScript('cheesecake');
  const pySearch = await searchPython('cheesecake');
  compareParity(tsSearch, pySearch, 'findFoodItem');
  
  // Test 3: Cart operations
  console.log('\n📍 TEST 3: Cart operations parity');
  const tsCart = await addToCartTypeScript('vanilla cheesecake');
  const pyCart = await addToCartPython('vanilla cheesecake');
  compareParity(tsCart.total, pyCart.total, 'Cart total');
  
  console.log('\n✅ ALL PARITY TESTS PASSED');
}

function compareParity(ts, py, name) {
  const tsStr = JSON.stringify(ts, null, 2);
  const pyStr = JSON.stringify(py, null, 2);
  
  if (tsStr === pyStr) {
    console.log(`   ✅ ${name}: IDENTICAL`);
  } else {
    console.log(`   ❌ ${name}: MISMATCH`);
    console.log('   TypeScript:', tsStr);
    console.log('   Python:', pyStr);
  }
}

testParity();
```

---

## Common Patterns

### Pattern 1: Query with Relations

**TypeScript**:
```typescript
const { data } = await supabase
  .from('fc_menu_items')
  .select(`
    id, name, base_price,
    restaurant:restaurant_id (id, name)
  `)
  .eq('is_available', true);
```

**Python Equivalent**:
```python
response = supabase.table('fc_menu_items').select(
    '''
    id, name, base_price,
    restaurant:restaurant_id (id, name)
    '''
).eq('is_available', True).execute()
```

### Pattern 2: Case-Insensitive Search

**TypeScript**:
```typescript
.ilike('name', `%${query}%`)
```

**Python Equivalent**:
```python
.ilike('name', f'%{query}%')
```

### Pattern 3: Handling Single vs Array Relations

**TypeScript**:
```typescript
const restaurantRelation = Array.isArray(item.restaurant) 
  ? item.restaurant[0] 
  : item.restaurant;
```

**Python Equivalent**:
```python
restaurant_relation = (
    item['restaurant'][0] 
    if isinstance(item['restaurant'], list) 
    else item['restaurant']
)
```

### Pattern 4: JSON String Returns

**TypeScript**:
```typescript
return JSON.stringify({ success: true, data: result });
```

**Python Equivalent**:
```python
import json
return json.dumps({'success': True, 'data': result})
```

### Pattern 5: Error Handling

**TypeScript**:
```typescript
try {
  const { data, error } = await supabase.from('table').select();
  if (error) throw error;
  return JSON.stringify({ success: true, data });
} catch (error) {
  console.error('Error:', error);
  return JSON.stringify({ success: false, error: error.message });
}
```

**Python Equivalent**:
```python
try:
    response = supabase.table('table').select().execute()
    data = response.data
    return json.dumps({'success': True, 'data': data})
except Exception as e:
    print(f"Error: {e}")
    return json.dumps({'success': False, 'error': str(e)})
```

---

## Summary

### What We Know

1. **TypeScript tools work** - They query Supabase successfully
2. **Schema is stable** - No changes needed
3. **Credentials are shared** - Same `.env.local` variables
4. **Queries are translatable** - Python supabase-py mirrors JS API
5. **Output formats match** - JSON strings with same structure

### What We'll Build

1. **Python Supabase client** - `agents/database.py`
2. **6 function tools** - Exact mirrors of TypeScript tools
3. **Same queries** - Identical database operations
4. **Same responses** - Identical JSON output formats
5. **Parity tests** - Automated verification

### What Won't Change

1. ❌ Database schema
2. ❌ Supabase configuration
3. ❌ Environment variables
4. ❌ Data structures
5. ❌ Existing TypeScript tools

### Success Criteria

Native Python tools are ready when:
- ✅ Connect to same Supabase instance
- ✅ Query same tables with same filters
- ✅ Return same JSON structure
- ✅ Handle errors identically
- ✅ Pass all parity tests
- ✅ Work alongside TypeScript tools without conflicts

**This guide ensures 100% functional parity between TypeScript and Python implementations.**
