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
import httpx

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
PEXELS_API_KEY = os.getenv("PEXELS_API_KEY", "")

print(f"✅ Database client initialized")
print(f"   Supabase URL: {supabase_url}")
print(f"   Demo Profile: {DEMO_PROFILE_ID}")
print(f"   Pexels API: {'✓ Configured' if PEXELS_API_KEY else '✗ Not configured'}")


# In-memory cart storage (matches voice-chat/tools.ts voiceCart)
voice_cart: Optional[Dict[str, Any]] = None


def format_currency(amount: float) -> str:
    """Format number as USD currency"""
    return f"${amount:.2f}"


async def fetch_image_from_pexels(query: str) -> Optional[str]:
    """
    Fetch an image URL from Pexels API
    Mirrors: food-chat/tools.ts -> fetchImageFromPexels
    """
    if not PEXELS_API_KEY:
        return None
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.pexels.com/v1/search",
                params={
                    "query": query,
                    "per_page": "1",
                    "orientation": "landscape"
                },
                headers={"Authorization": PEXELS_API_KEY},
                timeout=10.0
            )
            
            if response.status_code != 200:
                print(f"⚠️ Pexels request failed: {response.status_code}")
                return None
            
            data = response.json()
            photos = data.get("photos", [])
            if not photos:
                return None
            
            photo = photos[0]
            src = photo.get("src", {})
            return src.get("large") or src.get("medium") or src.get("original")
    
    except Exception as e:
        print(f"⚠️ Pexels fetch error: {e}")
        return None


async def ensure_menu_item_image(
    item_id: Optional[str] = None,
    item_slug: Optional[str] = None,
    item_name: Optional[str] = None,
    restaurant_name: Optional[str] = None
) -> Optional[str]:
    """
    Ensure menu item has an image - fetch from Pexels if needed
    Mirrors: food-chat/tools.ts -> ensureMenuItemImage
    """
    slug = item_slug or (item_name.lower().replace(" ", "-") if item_name else None)
    
    if item_id or slug:
        # Check if image already exists in database
        try:
            query = supabase.table("fc_menu_items").select("id, image, name")
            if item_id:
                query = query.eq("id", item_id)
            else:
                query = query.eq("slug", slug)
            
            response = query.limit(1).execute()
            
            if response.data:
                existing = response.data[0]
                if existing.get("image"):
                    return existing["image"]
                
                # Fetch from Pexels and update database
                search_name = existing.get("name") or item_name or slug or "Food"
                search_query = f"{restaurant_name or ''} {search_name}".strip()
                fetched = await fetch_image_from_pexels(search_query)
                
                if fetched and existing.get("id"):
                    supabase.table("fc_menu_items").update({
                        "image": fetched
                    }).eq("id", existing["id"]).execute()
                
                return fetched
        
        except Exception as e:
            print(f"⚠️ ensure_menu_item_image error: {e}")
    
    # Fallback: just fetch from Pexels
    search_name = item_name or slug or "Food"
    search_query = f"{restaurant_name or ''} {search_name}".strip()
    return await fetch_image_from_pexels(search_query)


async def ensure_restaurant_image(
    restaurant_id: Optional[str] = None,
    restaurant_slug: Optional[str] = None,
    restaurant_name: Optional[str] = None
) -> Optional[str]:
    """
    Ensure restaurant has a hero image - fetch from Pexels if needed
    """
    if restaurant_id or restaurant_slug:
        try:
            query = supabase.table("fc_restaurants").select("id, hero_image, name")
            if restaurant_id:
                query = query.eq("id", restaurant_id)
            else:
                query = query.eq("slug", restaurant_slug)
            
            response = query.limit(1).execute()
            
            if response.data:
                existing = response.data[0]
                if existing.get("hero_image"):
                    return existing["hero_image"]
                
                # Fetch from Pexels and update database
                search_name = existing.get("name") or restaurant_name or "Restaurant"
                search_query = f"{search_name} food restaurant"
                fetched = await fetch_image_from_pexels(search_query)
                
                if fetched and existing.get("id"):
                    supabase.table("fc_restaurants").update({
                        "hero_image": fetched
                    }).eq("id", existing["id"]).execute()
                
                return fetched
        
        except Exception as e:
            print(f"⚠️ ensure_restaurant_image error: {e}")
    
    # Fallback: just fetch from Pexels
    search_name = restaurant_name or "Restaurant"
    search_query = f"{search_name} food restaurant"
    return await fetch_image_from_pexels(search_query)


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
        # Query Supabase
        response = supabase.table("fc_menu_items").select(
            "id, slug, name, description, base_price, calories, dietary_tags, image, "
            "section:section_id(id, name), "
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
            
            # Fetch image from Pexels if not in database
            image_url = item.get("image")
            if not image_url:
                image_url = await ensure_menu_item_image(
                    item_id=item["id"],
                    item_slug=item["slug"],
                    item_name=item["name"],
                    restaurant_name=restaurant_rel.get("name") if restaurant_rel else None
                )
            
            results.append({
                "id": item["id"],
                "slug": item["slug"],
                "name": item["name"],
                "description": item.get("description"),
                "price": item.get("base_price", 0),
                "tags": item.get("dietary_tags", []),
                "calories": item.get("calories"),
                "sectionTitle": section_rel.get("name") if section_rel else None,
                "restaurantId": restaurant_rel.get("id") if restaurant_rel else None,
                "restaurantSlug": restaurant_rel.get("slug") if restaurant_rel else None,
                "restaurantName": restaurant_rel.get("name") if restaurant_rel else None,
                "image": image_url
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
    Find restaurants by cuisine type OR name
    Mirrors: voice-chat/tools.ts -> findRestaurantsByType
    Enhanced to search by restaurant name as fallback
    """
    try:
        # Query Supabase fc_restaurants table - search cuisine, cuisine_group, AND name
        response = supabase.table("fc_restaurants").select(
            "id, slug, name, cuisine, cuisine_group, dietary_tags, price_tier, "
            "rating, eta_minutes, delivery_fee, standout_dish, promo, hero_image"
        ).eq("is_active", True).or_(f"cuisine.ilike.%{cuisine_type}%,cuisine_group.ilike.%{cuisine_type}%,name.ilike.%{cuisine_type}%").order("name").limit(5).execute()
        
        if not response.data:
            return []
        
        results = []
        for restaurant in response.data:
            # Fetch image from Pexels if not in database
            hero_image = restaurant.get("hero_image")
            if not hero_image:
                hero_image = await ensure_restaurant_image(
                    restaurant_id=restaurant["id"],
                    restaurant_slug=restaurant["slug"],
                    restaurant_name=restaurant["name"]
                )
            
            results.append({
                "id": restaurant["id"],
                "slug": restaurant["slug"],
                "name": restaurant["name"],
                "cuisine": restaurant.get("cuisine"),
                "cuisineGroup": restaurant.get("cuisine_group"),
                "dietaryTags": restaurant.get("dietary_tags", []),
                "priceTier": restaurant.get("price_tier"),
                "rating": restaurant.get("rating"),
                "etaMinutes": restaurant.get("eta_minutes"),
                "deliveryFee": restaurant.get("delivery_fee"),
                "standoutDish": restaurant.get("standout_dish"),
                "promo": restaurant.get("promo"),
                "heroImage": hero_image
            })
        
        return results
        
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
    Appends to existing cart if present, otherwise creates new cart
    Mirrors: voice-chat/tools.ts -> quickAddToCart
    """
    global voice_cart
    
    # Combine main item with additional items
    new_items_to_add = [{"itemName": item_name, "quantity": quantity}]
    if additional_items:
        new_items_to_add.extend(additional_items)
    
    base_price = 8.99
    delivery_fee = 2.99
    
    # Check if we have an existing cart with items
    existing_items = []
    if voice_cart and voice_cart.get("items"):
        # Extract existing items 
        existing_items = voice_cart["items"].copy()
    
    # Calculate the starting index for new items
    starting_idx = len(existing_items)
    
    # Process new items and append to cart
    for idx, item in enumerate(new_items_to_add):
        item_id = f"item-{starting_idx + idx}"
        line_price = base_price * item["quantity"]
        
        existing_items.append({
            "id": item_id,
            "menuItemId": f"menu-{starting_idx + idx}",
            "name": item["itemName"],
            "quantity": item["quantity"],
            "basePrice": base_price,
            "totalPrice": line_price,
            "options": [],
            "restaurant": {
                "name": restaurant_name or (voice_cart.get("restaurantName") if voice_cart else "Restaurant")
            }
        })
    
    # Recalculate totals for all items
    subtotal = sum(item["totalPrice"] for item in existing_items)
    total = subtotal + delivery_fee
    total_quantity = sum(item["quantity"] for item in existing_items)
    
    # Update or create cart with all items
    voice_cart = {
        "id": "cart-voice",
        "restaurantId": "mock-restaurant-id",
        "restaurantSlug": "mock-restaurant",
        "restaurantName": restaurant_name or (voice_cart.get("restaurantName") if voice_cart else "Restaurant"),
        "status": "active",
        "subtotal": subtotal,
        "deliveryFee": delivery_fee,
        "total": total,
        "items": existing_items
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
