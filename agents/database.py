"""
Database utilities for LiveKit Native Food Concierge Agent
Uses EXACT same Supabase connection and queries as TypeScript tools
Mirrors: /app/api/voice-chat/tools.ts
"""

import os
import json
from typing import Dict, List, Any, Optional
from supabase import create_client, Client
from dotenv import load_dotenv
import os.path

# Load environment variables from root .env.local
env_path = os.path.join(os.path.dirname(__file__), '..', '.env.local')
load_dotenv(env_path)

# Initialize Supabase client (same as lib/supabaseServer.ts)
supabase_url = os.getenv("SUPABASE_URL")
supabase_service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not supabase_url or not supabase_service_key:
    raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env")

supabase: Client = create_client(supabase_url, supabase_service_key)
DEMO_PROFILE_ID = os.getenv("DEMO_PROFILE_ID", "00000000-0000-0000-0000-0000000000fc")

print(f"✅ Database client initialized")
print(f"   Supabase URL: {supabase_url}")
print(f"   Demo Profile: {DEMO_PROFILE_ID}")


# In-memory cart storage (matches voice-chat/tools.ts voiceCart)
voice_cart: Optional[Dict[str, Any]] = None


def format_currency(amount: float) -> str:
    """Format number as USD currency"""
    return f"${amount:.2f}"


async def get_user_profile(profile_id: str = None) -> Dict[str, Any]:
    """
    Get user profile and preferences from Supabase
    Mirrors: voice-chat/tools.ts -> getUserProfile
    """
    try:
        pid = profile_id or DEMO_PROFILE_ID
        
        # Query fc_preferences table (same as TypeScript)
        response = supabase.table("fc_preferences").select("*").eq("id", pid).single().execute()
        
        if response.data:
            prefs = response.data
            return {
                "profile": {
                    "favoriteCuisines": prefs.get("favorite_cuisines", []),
                    "dietaryTags": prefs.get("dietary_tags", []),
                    "dislikedCuisines": prefs.get("disliked_cuisines", []),
                    "spiceLevel": prefs.get("spice_level", "medium"),
                    "budgetRange": prefs.get("budget_range", "standard"),
                    "defaultLocation": {
                        "city": "Orlando",
                        "state": "FL"
                    }
                }
            }
        else:
            # Return fallback (matches TypeScript fallback)
            return {
                "profile": {
                    "favoriteCuisines": [],
                    "dietaryTags": [],
                    "disliked Cuisines": [],
                    "spiceLevel": "medium",
                    "budgetRange": "standard",
                    "defaultLocation": {
                        "city": "Orlando",
                        "state": "FL"
                    }
                }
            }
    except Exception as error:
        print(f"Error in get_user_profile: {error}")
        return {
            "profile": {
                "favoriteCuisines": [],
                "dietaryTags": [],
                "dislikedCuisines": [],
                "spiceLevel": "medium",
                "budgetRange": "standard",
                "defaultLocation": {
                    "city": "Orlando",
                    "state": "FL"
                }
            }
        }


async def search_menu_items(query: str, max_results: int = 5) -> List[Dict[str, Any]]:
    """
    Search for menu items across all restaurants
    Mirrors: voice-chat/tools.ts -> findFoodItem
    """
    try:
        # Query Supabase (same as TypeScript)
        response = supabase.table("fc_menu_items").select(
            "id, slug, name, description, base_price, calories, rating, tags, image, "
            "section:section_id(id, title), "
            "restaurant:restaurant_id(id, slug, name)"
        ).eq("is_available", True).ilike("name", f"%{query}%").order("name").limit(max_results * 2).execute()
        
        if not response.data:
            return []
        
        results = []
        for item in response.data:
            # Handle relations (same logic as TypeScript)
            section_rel = item.get("section")
            if isinstance(section_rel, list):
                section_rel = section_rel[0] if section_rel else None
            
            restaurant_rel = item.get("restaurant")
            if isinstance(restaurant_rel, list):
                restaurant_rel = restaurant_rel[0] if restaurant_rel else None
            
            results.append({
                "id": item["id"],
                "slug": item["slug"],
                "name": item["name"],
                "description": item.get("description"),
                "price": item.get("base_price", 0),
                "tags": item.get("tags", []),
                "calories": item.get("calories"),
                "rating": item.get("rating"),
                "sectionTitle": section_rel.get("title") if section_rel else None,
                "restaurantId": restaurant_rel.get("id") if restaurant_rel else None,
                "restaurantSlug": restaurant_rel.get("slug") if restaurant_rel else None,
                "restaurantName": restaurant_rel.get("name") if restaurant_rel else None,
                "image": item.get("image")
            })
        
        # Filter chocolate if requested (same as TypeScript)
        if "no chocolate" in query.lower() or "without chocolate" in query.lower():
            results = [r for r in results if "chocolate" not in f"{r['name']} {r.get('description', '')}".lower()]
        
        return results[:max_results]
        
    except Exception as error:
        print(f"Error in search_menu_items: {error}")
        return []


async def search_restaurants_by_cuisine(cuisine_type: str, max_results: int = 3) -> List[Dict[str, Any]]:
    """
    Find restaurants by cuisine type
    Mirrors: voice-chat/tools.ts -> findRestaurantsByType
    """
    try:
        # For now, return local fallback (Supabase has fc_restaurants table)
        # In production, query: supabase.table("fc_restaurants").select...
        return []
    except Exception as error:
        print(f"Error in search_restaurants_by_cuisine: {error}")
        return []


def get_voice_cart() -> Dict[str, Any]:
    """Get current voice cart"""
    global voice_cart
    if not voice_cart or not voice_cart.get("items"):
        return {
            "id": "voice-cart-empty",
            "restaurantId": None,
            "restaurantName": None,
            "status": "empty",
            "subtotal": 0,
            "deliveryFee": 0,
            "total": 0,
            "items": []
        }
    return voice_cart


def add_to_voice_cart(item_name: str, restaurant_name: str = None, quantity: int = 1, additional_items: List[Dict] = None) -> Dict[str, Any]:
    """
    Add items to voice cart (in-memory)
    Mirrors: voice-chat/tools.ts -> quickAddToCart
    """
    global voice_cart
    
    # Combine main item with additional items
    all_items = [{"itemName": item_name, "quantity": quantity}]
    if additional_items:
        all_items.extend(additional_items)
    
    base_price = 8.99
    delivery_fee = 2.99
    
    total_quantity = 0
    subtotal = 0
    mock_items = []
    
    # Process all items
    for idx, item in enumerate(all_items):
        item_id = f"item-{idx}"
        line_price = base_price * item["quantity"]
        total_quantity += item["quantity"]
        subtotal += line_price
        
        mock_items.append({
            "id": item_id,
            "menuItemId": f"menu-{idx}",
            "name": item["itemName"],
            "quantity": item["quantity"],
            "basePrice": base_price,
            "totalPrice": line_price,
            "options": [],
            "restaurant": {
                "name": restaurant_name or "Restaurant"
            }
        })
    
    total = subtotal + delivery_fee
    
    # Create cart
    voice_cart = {
        "id": f"cart-voice",
        "restaurantId": "mock-restaurant-id",
        "restaurantSlug": "mock-restaurant",
        "restaurantName": restaurant_name or "Restaurant",
        "status": "active",
        "subtotal": subtotal,
        "deliveryFee": delivery_fee,
        "total": total,
        "items": mock_items
    }
    
    return {
        "success": True,
        "cart": voice_cart,
        "subtotal": subtotal,
        "total": total,
        "itemCount": total_quantity
    }


def checkout_cart() -> Dict[str, Any]:
    """
    Checkout current cart
    Mirrors: voice-chat/tools.ts -> quickCheckout
    """
    global voice_cart
    
    if not voice_cart or not voice_cart.get("items"):
        return {
            "success": False,
            "message": "Your cart is empty. Add some items first."
        }
    
    # Generate order number
    import time
    order_number = f"VO{str(int(time.time()))[-6:]}"
    
    # Create order summary
    order_summary = {
        "orderNumber": order_number,
        "success": True,
        "restaurant": {
            "id": voice_cart.get("restaurantId"),
            "name": voice_cart.get("restaurantName"),
            "cuisine": "american"
        },
        "items": voice_cart.get("items"),
        "subtotal": voice_cart.get("subtotal"),
        "deliveryFee": voice_cart.get("deliveryFee"),
        "total": voice_cart.get("total"),
        "itemCount": len(voice_cart.get("items", []))
    }
    
    # Clear cart after checkout
    voice_cart = None
    
    return {
        "success": True,
        "orderId": order_number,
        "restaurant": order_summary["restaurant"],
        "itemCount": order_summary["itemCount"],
        "total": order_summary["total"],
        "orderDetails": order_summary
    }
