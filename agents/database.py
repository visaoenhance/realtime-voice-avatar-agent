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


def reset_voice_cart() -> None:
    """Reset the voice cart to None - useful for debugging and between sessions"""
    global voice_cart
    old_cart_items = len(voice_cart.get("items", [])) if voice_cart else 0
    old_cart_total = voice_cart.get("total", 0) if voice_cart else 0
    voice_cart = None
    if old_cart_items > 0:
        print(f"🔄 Voice cart reset: cleared {old_cart_items} items (${old_cart_total:.2f})")
    else:
        print("🔄 Voice cart reset: was already empty")


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
    Search for menu items across all restaurants using improved multi-word matching.
    - Searches in both name and description fields
    - Handles multi-word queries by searching for ANY word match
    - Example: "New York style cheesecake" will find "Classic New York Cheesecake"
    
    Mirrors: voice-chat/tools.ts -> findFoodItem
    """
    try:
        # Split query into individual words for better matching
        # "New York style cheesecake" → ["New", "York", "style", "cheesecake"]
        words = query.strip().split()
        
        # Build OR conditions for each word (search in both name and description)
        # This allows finding items that contain ANY of the query words
        search_filters = []
        for word in words:
            if len(word) >= 3:  # Skip very short words like "a", "of", etc.
                # Escape single quotes for SQL
                safe_word = word.replace("'", "''")
                search_filters.append(f"name.ilike.%{safe_word}%,description.ilike.%{safe_word}%")
        
        if not search_filters:
            # Fallback to original simple search if no valid words
            response = supabase.table("fc_menu_items").select(
                "id, slug, name, description, base_price, calories, dietary_tags, image, "
                "section:section_id(id, name), "
                "restaurant:restaurant_id(id, slug, name)"
            ).eq("is_available", True).ilike("name", f"%{query}%").order("name").limit(max_results * 2).execute()
        else:
            # Use first word as primary filter, then rank results by how many words match
            primary_word = words[0].replace("'", "''")
            response = supabase.table("fc_menu_items").select(
                "id, slug, name, description, base_price, calories, dietary_tags, image, "
                "section:section_id(id, name), "
                "restaurant:restaurant_id(id, slug, name)"
            ).eq("is_available", True).or_(f"name.ilike.%{primary_word}%,description.ilike.%{primary_word}%").order("name").limit(max_results * 5).execute()
            
            # Rank results by how many query words they contain
            if response.data:
                def score_item(item):
                    text = f"{item.get('name', '')} {item.get('description', '')}".lower()
                    return sum(1 for word in words if word.lower() in text)
                
                # Sort by score (descending) and take top results
                response.data.sort(key=score_item, reverse=True)
                response.data = response.data[:max_results * 2]
        
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


async def get_restaurant_menu(restaurant_slug: str, limitSections: int = None, limitItemsPerSection: int = None) -> Dict[str, Any]:
    """
    Get full menu (sections and items) for a restaurant
    Mirrors: food-chat/tools.ts -> getRestaurantMenu
    """
    try:
        # First get restaurant details
        restaurant_response = supabase.table("fc_restaurants").select(
            "id, slug, name, cuisine, hero_image"
        ).eq("slug", restaurant_slug).eq("is_active", True).limit(1).execute()
        
        if not restaurant_response.data:
            return {
                "success": False,
                "message": f"Could not find restaurant: {restaurant_slug}",
                "sections": []
            }
        
        restaurant = restaurant_response.data[0]
        restaurant_id = restaurant["id"]
        
        # Query menu sections with items (using the view if available, or manual join)
        try:
            # Try using the view first
            menu_response = supabase.table("fc_menu_sections_with_items").select(
                "*"
            ).eq("restaurant_id", restaurant_id).order("section_position").execute()
            
            sections = []
            for section_data in (menu_response.data or []):
                items = []
                if section_data.get("items"):
                    for item in section_data["items"]:
                        items.append({
                            "id": item["id"],
                            "slug": item.get("slug"),
                            "name": item["name"],
                            "description": item.get("description"),
                            "price": float(item["base_price"]) if item.get("base_price") else 0,
                            "tags": item.get("tags", []) if isinstance(item.get("tags"), list) else [],
                            "calories": item.get("calories"),
                            "rating": float(item["rating"]) if item.get("rating") else None,
                            "image": item.get("image"),
                            "sectionTitle": section_data["section_title"]
                        })
                
                # Apply item limit if specified
                if limitItemsPerSection:
                    items = items[:limitItemsPerSection]
                
                sections.append({
                    "id": section_data["section_id"],
                    "slug": section_data.get("section_slug"),
                    "title": section_data["section_title"],
                    "description": section_data.get("section_description"),
                    "position": section_data.get("section_position", 0),
                    "items": items
                })
        
        except Exception as view_error:
            # Fallback: manual join if view doesn't exist
            print(f"View query failed, using manual join: {view_error}")
            sections_response = supabase.table("fc_menu_sections").select(
                "id, slug, title, description, position"
            ).eq("restaurant_id", restaurant_id).order("position").execute()
            
            sections = []
            for section in (sections_response.data or []):
                items_response = supabase.table("fc_menu_items").select(
                    "id, slug, name, description, base_price, tags, calories, rating, image"
                ).eq("section_id", section["id"]).eq("is_available", True).order("position").execute()
                
                items = []
                for item in (items_response.data or []):
                    items.append({
                        "id": item["id"],
                        "slug": item.get("slug"),
                        "name": item["name"],
                        "description": item.get("description"),
                        "price": float(item["base_price"]) if item.get("base_price") else 0,
                        "tags": item.get("tags", []) if isinstance(item.get("tags"), list) else [],
                        "calories": item.get("calories"),
                        "rating": float(item["rating"]) if item.get("rating") else None,
                        "image": item.get("image"),
                        "sectionTitle": section["title"]
                    })
                
                # Apply item limit if specified
                if limitItemsPerSection:
                    items = items[:limitItemsPerSection]
                
                sections.append({
                    "id": section["id"],
                    "slug": section.get("slug"),
                    "title": section["title"],
                    "description": section.get("description"),
                    "position": section.get("position", 0),
                    "items": items
                })
        
        # Apply section limit if specified
        if limitSections:
            sections = sections[:limitSections]
        
        # Generate speech summary
        if sections and sections[0].get("items"):
            lead_item = sections[0]["items"][0]
            speech_summary = f"Here are {len(sections)} menu section{'s' if len(sections) != 1 else ''} at {restaurant['name']}. {lead_item['name']} is available for {format_currency(lead_item['price'])}."
        else:
            speech_summary = f"I could not find menu details for {restaurant['name']} right now."
        
        return {
            "success": True,
            "restaurant": {
                "id": restaurant["id"],
                "slug": restaurant["slug"],
                "name": restaurant["name"],
                "cuisine": restaurant.get("cuisine"),
                "heroImage": restaurant.get("hero_image")
            },
            "sections": sections,
            "speechSummary": speech_summary
        }
        
    except Exception as error:
        print(f"Error in get_restaurant_menu: {error}")
        return {
            "success": False,
            "message": f"Error fetching menu: {str(error)}",
            "sections": []
        }


def get_voice_cart() -> Dict[str, Any]:
    """Get current voice cart"""
    global voice_cart
    if not voice_cart or not voice_cart.get("items"):
        return {
            "success": True,
            "cart": {
                "id": "voice-cart-empty",
                "restaurantId": None,
                "restaurantName": None,
                "status": "empty",
                "subtotal": 0,
                "deliveryFee": 0,
                "total": 0,
                "items": []
            }
        }
    return {
        "success": True,
        "cart": voice_cart
    }


def add_to_voice_cart(item_name: str, restaurant_name: str = None, quantity: int = 1, additional_items: List[Dict] = None) -> Dict[str, Any]:
    """
    Add items to voice cart (in-memory)
    Merges items with the same name, otherwise appends
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
    
    # Process new items - merge if same name exists
    for new_item in new_items_to_add:
        item_name_to_add = new_item["itemName"]
        qty_to_add = new_item["quantity"]
        
        # Look for existing item with same name (case-insensitive)
        found = False
        for existing_item in existing_items:
            if existing_item["name"].lower() == item_name_to_add.lower():
                # Merge quantities
                existing_item["quantity"] += qty_to_add
                existing_item["totalPrice"] = existing_item["basePrice"] * existing_item["quantity"]
                found = True
                break
        
        # If not found, add as new item
        if not found:
            item_id = f"item-{len(existing_items)}"
            line_price = base_price * qty_to_add
            
            existing_items.append({
                "id": item_id,
                "menuItemId": f"menu-{len(existing_items)}",
                "name": item_name_to_add,
                "quantity": qty_to_add,
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
    
    # DEBUG: Log cart calculation
    print(f"\n🔍 DEBUG add_to_voice_cart():")
    print(f"   Items in cart: {len(existing_items)}")
    for item in existing_items:
        print(f"     - {item['name']}: qty={item['quantity']}, basePrice=${item['basePrice']}, totalPrice=${item['totalPrice']}")
    print(f"   Subtotal: ${subtotal:.2f}")
    print(f"   Delivery Fee: ${delivery_fee:.2f}")
    print(f"   TOTAL: ${total:.2f}\n")
    
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
    
    # DEBUG: Log cart state before checkout
    print(f"\n🔍 DEBUG checkout_cart():")
    print(f"   Cart subtotal: ${voice_cart.get('subtotal')}")
    print(f"   Cart deliveryFee: ${voice_cart.get('deliveryFee')}")
    print(f"   Cart total: ${voice_cart.get('total')}")
    print(f"   Cart items: {len(voice_cart.get('items', []))}")
    for item in voice_cart.get('items', []):
        print(f"     - {item['name']}: qty={item['quantity']}, basePrice=${item['basePrice']}, totalPrice=${item['totalPrice']}")
    
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
    
    print(f"   Order summary total: ${order_summary['total']}\n")
    
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


def update_cart_item_quantity(item_name: str, new_quantity: int) -> Dict[str, Any]:
    """
    Update the quantity of an item in the cart by name.
    If new_quantity is 0, removes the item.
    If item doesn't exist, returns error.
    """
    global voice_cart
    
    if not voice_cart or not voice_cart.get("items"):
        return {
            "success": False,
            "message": "Your cart is empty."
        }
    
    # Find the item by name (case-insensitive)
    item_name_lower = item_name.lower()
    item_found = False
    updated_items = []
    
    for item in voice_cart["items"]:
        if item["name"].lower() == item_name_lower:
            item_found = True
            if new_quantity > 0:
                # Update quantity
                item["quantity"] = new_quantity
                item["totalPrice"] = item["basePrice"] * new_quantity
                updated_items.append(item)
            # If new_quantity is 0, don't add to updated_items (remove it)
        else:
            updated_items.append(item)
    
    if not item_found:
        return {
            "success": False,
            "message": f"Item '{item_name}' not found in cart."
        }
    
    # Update cart with new items list
    voice_cart["items"] = updated_items
    
    # Recalculate totals
    if updated_items:
        subtotal = sum(item["totalPrice"] for item in updated_items)
        total = subtotal + voice_cart["deliveryFee"]
        total_quantity = sum(item["quantity"] for item in updated_items)
        
        voice_cart["subtotal"] = subtotal
        voice_cart["total"] = total
        
        action = "updated" if new_quantity > 0 else "removed"
        return {
            "success": True,
            "message": f"{item_name} {action} successfully.",
            "cart": voice_cart,
            "subtotal": subtotal,
            "total": total,
            "itemCount": total_quantity
        }
    else:
        # Cart is now empty
        voice_cart = None
        return {
            "success": True,
            "message": f"{item_name} removed. Your cart is now empty.",
            "cart": None,
            "subtotal": 0,
            "total": 0,
            "itemCount": 0
        }


def remove_from_cart(item_name: str, quantity_to_remove: int = None) -> Dict[str, Any]:
    """
    Remove items from cart by name.
    If quantity_to_remove is specified, reduces quantity by that amount.
    If quantity_to_remove is None or >= current quantity, removes item entirely.
    """
    global voice_cart
    
    if not voice_cart or not voice_cart.get("items"):
        return {
            "success": False,
            "message": "Your cart is empty."
        }
    
    # Find the item by name (case-insensitive)
    item_name_lower = item_name.lower()
    item_found = False
    updated_items = []
    removed_count = 0
    
    for item in voice_cart["items"]:
        if item["name"].lower() == item_name_lower:
            item_found = True
            current_qty = item["quantity"]
            
            if quantity_to_remove is None or quantity_to_remove >= current_qty:
                # Remove entire item
                removed_count = current_qty
                # Don't add to updated_items
            else:
                # Reduce quantity
                new_qty = current_qty - quantity_to_remove
                removed_count = quantity_to_remove
                item["quantity"] = new_qty
                item["totalPrice"] = item["basePrice"] * new_qty
                updated_items.append(item)
        else:
            updated_items.append(item)
    
    if not item_found:
        return {
            "success": False,
            "message": f"Item '{item_name}' not found in cart."
        }
    
    # Update cart with new items list
    voice_cart["items"] = updated_items
    
    # Recalculate totals
    if updated_items:
        subtotal = sum(item["totalPrice"] for item in updated_items)
        total = subtotal + voice_cart["deliveryFee"]
        total_quantity = sum(item["quantity"] for item in updated_items)
        
        voice_cart["subtotal"] = subtotal
        voice_cart["total"] = total
        
        qty_msg = f"{removed_count} " if removed_count > 1 else ""
        return {
            "success": True,
            "message": f"Removed {qty_msg}{item_name} from cart.",
            "cart": voice_cart,
            "subtotal": subtotal,
            "total": total,
            "itemCount": total_quantity
        }
    else:
        # Cart is now empty
        voice_cart = None
        return {
            "success": True,
            "message": f"Removed {item_name}. Your cart is now empty.",
            "cart": None,
            "subtotal": 0,
            "total": 0,
            "itemCount": 0
        }
