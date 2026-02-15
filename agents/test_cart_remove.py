"""
Test script for cart remove/update functionality
"""
import sys
from database import add_to_voice_cart, get_voice_cart, remove_from_cart, update_cart_item_quantity

def print_cart(label):
    """Print cart contents"""
    cart = get_voice_cart()
    print(f"\n{label}")
    print("=" * 60)
    if cart.get('success') and cart.get('cart'):
        items = cart['cart'].get('items', [])
        print(f"Items in cart: {len(items)}")
        for item in items:
            print(f"  - {item['name']}: {item['quantity']}x @ ${item['basePrice']:.2f} = ${item['totalPrice']:.2f}")
        print(f"Subtotal: ${cart['cart']['subtotal']:.2f}")
        print(f"Total: ${cart['cart']['total']:.2f}")
    else:
        print("Cart is empty")
    print("=" * 60)

def main():
    print("\n🧪 Testing Cart Remove/Update Functionality\n")
    
    # 1. Add items to cart
    print("\n1️⃣ Adding items to cart...")
    result = add_to_voice_cart("Tropical Cheesecake", "Island Breeze", quantity=3)
    print(f"   Added 3x Tropical Cheesecake: {result.get('success')}")
    
    result = add_to_voice_cart("Butter Chicken", "Island Breeze", quantity=1)
    print(f"   Added 1x Butter Chicken: {result.get('success')}")
    
    print_cart("📦 Cart after adding items")
    
    # 2. Try to remove 2 cheesecakes (user's scenario)
    print("\n2️⃣ Removing 2 Tropical Cheesecakes...")
    result = remove_from_cart("Tropical Cheesecake", quantity_to_remove=2)
    print(f"   Result: {result.get('message')}")
    print(f"   Success: {result.get('success')}")
    
    print_cart("📦 Cart after removing 2 cheesecakes")
    
    # 3. Try to remove all butter chicken
    print("\n3️⃣ Removing all Butter Chicken...")
    result = remove_from_cart("Butter Chicken")
    print(f"   Result: {result.get('message')}")
    print(f"   Success: {result.get('success')}")
    
    print_cart("📦 Cart after removing butter chicken")
    
    # 4. Try update_cart_item_quantity to set to specific value
    print("\n4️⃣ Adding 3 cheesecakes back and updating to 1...")
    add_to_voice_cart("Tropical Cheesecake", "Island Breeze", quantity=3)
    print_cart("📦 Cart after adding 3 cheesecakes")
    
    result = update_cart_item_quantity("Tropical Cheesecake", new_quantity=1)
    print(f"   Result: {result.get('message')}")
    print(f"   Success: {result.get('success')}")
    
    print_cart("📦 Cart after updating to 1 cheesecake")
    
    # 5. Test removing non-existent item
    print("\n5️⃣ Testing error handling - removing non-existent item...")
    result = remove_from_cart("Pizza")
    print(f"   Result: {result.get('message')}")
    print(f"   Success: {result.get('success')}")
    
    print("\n✅ All tests completed!\n")

if __name__ == "__main__":
    main()
