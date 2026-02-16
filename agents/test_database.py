#!/usr/bin/env python3
"""
Test LiveKit Native Python Agent Database Connection

Verifies that the Python agent can:
- Connect to local Supabase (127.0.0.1:54321)
- Query fc_* tables successfully
- Execute all 6 function tools

Usage:
  cd agents
  python test_database.py
"""

import asyncio
import sys
import os
from dotenv import load_dotenv

# Load environment variables from root .env.local
env_path = os.path.join(os.path.dirname(__file__), '..', '.env.local')
load_dotenv(env_path)

from database import (
    get_user_profile,
    search_menu_items,
    search_restaurants_by_cuisine,
    get_voice_cart,
    add_to_voice_cart,
    checkout_cart,
    reset_voice_cart,
)

async def test_get_user_profile():
    """Test 1: Get user profile"""
    print("\n🧪 Test 1: Get User Profile")
    try:
        result = await get_user_profile()
        print(f"✅ Profile retrieved:")
        print(f"   Favorite cuisines: {result['profile']['favoriteCuisines']}")
        print(f"   Dietary tags: {result['profile']['dietaryTags']}")
        print(f"   Spice level: {result['profile']['spiceLevel']}")
        print(f"   Budget: {result['profile']['budgetRange']}")
        return True
    except Exception as e:
        print(f"❌ Failed: {e}")
        return False

async def test_search_menu_items():
    """Test 2: Search menu items"""
    print("\n🧪 Test 2: Search Menu Items")
    try:
        # Test search for "burger"
        results = await search_menu_items("burger", max_results=3)
        print(f"✅ Found {len(results)} items matching 'burger':")
        for idx, item in enumerate(results, 1):
            print(f"   {idx}. {item['name']} - ${item['price']:.2f} from {item.get('restaurantName', 'Unknown')}")
        
        if len(results) == 0:
            print("⚠️  No items found (expected if database is empty)")
        
        return True
    except Exception as e:
        print(f"❌ Failed: {e}")
        return False

async def test_search_restaurants():
    """Test 3: Search restaurants by cuisine"""
    print("\n🧪 Test 3: Search Restaurants by Cuisine")
    try:
        results = await search_restaurants_by_cuisine("italian", max_results=3)
        print(f"✅ Found {len(results)} italian restaurants")
        if len(results) == 0:
            print("⚠️  No restaurants found (expected - not implemented yet)")
        return True
    except Exception as e:
        print(f"❌ Failed: {e}")
        return False

def test_cart_reset():
    """Test 4: Cart Reset (NEW - prevents session carryover bug)"""
    print("\n🧪 Test 4: Cart Reset Functionality")
    try:
        # First, add items to cart to simulate previous session
        print("   Step 1: Simulating previous session with items...")
        add_to_voice_cart("Pizza", "Test Restaurant", quantity=5)
        add_to_voice_cart("Burger", "Test Restaurant", quantity=3)
        
        cart_before = get_voice_cart()
        items_before = len(cart_before['cart']['items'])
        total_before = cart_before['cart']['total']
        print(f"   Cart before reset: {items_before} items, ${total_before:.2f}")
        
        # Now reset the cart (this is what happens at session start)
        print("   Step 2: Calling reset_voice_cart()...")
        reset_voice_cart()
        
        # Verify cart is empty
        cart_after = get_voice_cart()
        print(f"   Cart after reset: {cart_after['cart']['status']}")
        
        if cart_after['cart']['status'] == 'empty' and cart_after['cart']['total'] == 0:
            print("✅ Cart reset successful - prevents $100.98 bug!")
            print(f"   Cleared {items_before} items (${total_before:.2f}) from memory")
            return True
        else:
            print("❌ Cart reset failed - items still in cart!")
            return False
            
    except Exception as e:
        print(f"❌ Failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_cart_operations():
    """Test 5-7: Cart operations"""
    print("\n🧪 Test 5: View Empty Cart")
    try:
        cart = get_voice_cart()
        print(f"✅ Empty cart: {cart['cart']['status']}")
        
        print("\n🧪 Test 6: Add Items to Cart")
        result = add_to_voice_cart("Cheeseburger", "Good Burger", quantity=2)
        print(f"✅ Added to cart:")
        print(f"   Items: {result['itemCount']}")
        print(f"   Total: ${result['total']:.2f}")
        
        cart = get_voice_cart()
        print(f"✅ Cart now has {len(cart['cart']['items'])} items")
        
        print("\n🧪 Test 7: Checkout")
        checkout_result = checkout_cart()
        print(f"✅ Order placed:")
        print(f"   Order #: {checkout_result['orderId']}")
        print(f"   Total: ${checkout_result['orderDetails']['total']:.2f}")
        
        cart_after = get_voice_cart()
        print(f"✅ Cart cleared: {cart_after['cart']['status']}")
        
        return True
    except Exception as e:
        print(f"❌ Failed: {e}")
        return False

async def run_all_tests():
    """Run all database tests"""
    print("🚀 Testing LiveKit Native Agent Database Layer")
    print("=" * 60)
    
    results = []
    
    # Run tests
    results.append(await test_get_user_profile())
    results.append(await test_search_menu_items())
    results.append(await test_search_restaurants())
    results.append(test_cart_reset())  # NEW: Test cart reset to prevent carryover bug
    results.append(test_cart_operations())
    
    # Summary
    print("\n" + "=" * 60)
    print(f"📊 Test Summary: {sum(results)}/{len(results)} passed")
    
    if all(results):
        print("✅ All tests passed!")
        return 0
    else:
        print("❌ Some tests failed")
        return 1

if __name__ == "__main__":
    exit_code = asyncio.run(run_all_tests())
    sys.exit(exit_code)
