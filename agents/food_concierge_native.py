"""
LiveKit Native Food Concierge Agent [ARCHIVED - OLD PATTERN]

⚠️ DEPRECATED: This file uses the OLD LiveKit Agents API pattern (v0.x-1.2)
⚠️ USE INSTEAD: food_concierge_agentserver.py (follows v1.4.1+ AgentServer pattern)

WHY ARCHIVED:
- Uses old CLI worker pattern instead of AgentServer
- Uses direct plugin imports (openai.STT) instead of inference layer
- Function parameters with defaults break OpenAI schema validation
- No typed userdata with RunContext pattern
- Missing turn detection and max_tool_steps

This file is kept as reference for:
- Understanding what we tried first
- Learning from mistakes (schema validation errors)
- Comparison for YouTube demo content

For working implementation, see: food_concierge_agentserver.py
For reference patterns, see: /livekit-reference/agents/examples/drive-thru/agent.py

ORIGINAL DOCUMENTATION:
========================
EXACTLY mirrors voice-chat/tools.ts with 6 function tools

Architecture:
- LiveKit Agents SDK handles STT/TTS/VAD automatically
- OpenAI GPT-4 for LLM with function calling
- Supabase for database queries (local or remote)
- Native Python implementation, zero TypeScript dependency

Tools (matching TypeScript exactly):
1. get_user_profile - Get user preferences
2. find_food_item - Search menu items
3. find_restaurants_by_type - Search restaurants
4. quick_view_cart - View current cart
5. quick_add_to_cart - Add items to cart
6. quick_checkout - Complete order

Usage:
  python food_concierge_native.py dev

Then connect from frontend using LiveKit token generated at /api/livekit-native/token
"""

import asyncio
import logging
import os
import sys
import signal
import atexit
import json
import traceback
from typing import Annotated
from dotenv import load_dotenv
import os.path

# Load environment variables from root .env.local
env_path = os.path.join(os.path.dirname(__file__), '..', '.env.local')
load_dotenv(env_path)

from livekit import rtc
from livekit.agents import (
    AutoSubscribe,
    JobContext,
    JobProcess,
    WorkerOptions,
    cli,
    llm,
)
from livekit.agents import voice, AgentSession
from livekit.plugins import openai, silero

# Import database utilities
from database import (
    get_user_profile,
    search_menu_items,
    search_restaurants_by_cuisine,
    get_voice_cart,
    add_to_voice_cart,
    checkout_cart,
)

# Load environment
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("food-concierge-native")

# Validate environment
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
LIVEKIT_URL = os.getenv("LIVEKIT_URL")
LIVEKIT_API_KEY = os.getenv("LIVEKIT_API_KEY")
LIVEKIT_API_SECRET = os.getenv("LIVEKIT_API_SECRET")

if not all([OPENAI_API_KEY, LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET]):
    raise ValueError("Missing required environment variables. Check agents/.env")

# ============================================================================
# SINGLE INSTANCE LOCK
# ============================================================================

PID_FILE = os.path.join(os.path.dirname(__file__), '.agent.pid')

def check_and_create_lock():
    """Ensure only one agent instance runs at a time"""
    if os.path.exists(PID_FILE):
        # Check if the PID is still running
        try:
            with open(PID_FILE, 'r') as f:
                old_pid = int(f.read().strip())
            
            # Check if process exists (works on Unix-like systems)
            try:
                os.kill(old_pid, 0)  # Signal 0 checks if process exists
                logger.error(f"❌ Agent already running with PID {old_pid}")
                logger.error(f"   To force restart: kill {old_pid} or delete {PID_FILE}")
                sys.exit(1)
            except OSError:
                # Process doesn't exist, remove stale PID file
                logger.warning(f"⚠️  Removing stale PID file (process {old_pid} not found)")
                os.remove(PID_FILE)
        except (ValueError, FileNotFoundError):
            # Invalid PID file, remove it
            os.remove(PID_FILE)
    
    # Create PID file with current process ID
    with open(PID_FILE, 'w') as f:
        f.write(str(os.getpid()))
    logger.info(f"🔒 Lock created: PID {os.getpid()}")

def cleanup_lock():
    """Remove PID file on exit"""
    if os.path.exists(PID_FILE):
        os.remove(PID_FILE)
        logger.info("🔓 Lock removed")

def signal_handler(signum, frame):
    """Handle shutdown signals gracefully"""
    logger.info(f"\n⚠️  Received signal {signum}, shutting down...")
    cleanup_lock()
    sys.exit(0)

# Register cleanup handlers
atexit.register(cleanup_lock)
signal.signal(signal.SIGINT, signal_handler)   # Ctrl+C
signal.signal(signal.SIGTERM, signal_handler)  # kill command

# NOTE: Don't check lock here - it conflicts with dev mode file watcher
# Lock will be checked in __main__ block below

logger.info("✅ Food Concierge Native Agent initialized")
logger.info(f"   LiveKit URL: {LIVEKIT_URL}")
logger.info(f"   OpenAI STT: whisper-1")
logger.info(f"   OpenAI LLM: gpt-4")
logger.info(f"   OpenAI TTS: tts-1")
logger.info(f"   VAD: Silero")


# ============================================================================
# FUNCTION TOOLS (Exactly match voice-chat/tools.ts)
# ============================================================================

@llm.function_tool(
    description="Get the user's food preferences including favorite cuisines, dietary restrictions, spice level, and budget range"
)
async def get_user_profile_tool() -> str:
    """Get user preferences from Supabase"""
    logger.info("🔍 Tool: get_user_profile()")
    result = await get_user_profile(None)  # Always use default demo profile
    logger.info(f"   ✅ Profile: {result}")
    return f"User preferences retrieved: {result}"


@llm.function_tool(
    description="Search for specific food items (dishes, meals, drinks) by name. Returns menu items with price and restaurant info"
)
async def find_food_item_tool(query: str, max_results: int = 5) -> str:
        """Search menu items across all restaurants"""
        logger.info(f"🔍 Tool: find_food_item(query='{query}', max_results={max_results})")
        results = await search_menu_items(query, max_results)
        logger.info(f"   ✅ Found {len(results)} items")
        
        if not results:
            return f"No menu items found matching '{query}'. Try a different search term."
        
        # Format for voice response
        response_parts = [f"Found {len(results)} items matching '{query}':"]
        for idx, item in enumerate(results, 1):
            price = f"${item['price']:.2f}"
            restaurant = item.get('restaurantName', 'Unknown')
            response_parts.append(
                f"{idx}. {item['name']} from {restaurant} - {price}"
            )
        
        return "\n".join(response_parts)


@llm.function_tool(
    description="Find restaurants by cuisine type (italian, chinese, mexican, american, etc.)"
)
async def find_restaurants_by_type_tool(cuisine_type: str, max_results: int = 3) -> str:
        """Search restaurants by cuisine"""
        logger.info(f"🔍 Tool: find_restaurants_by_type(cuisine_type='{cuisine_type}', max_results={max_results})")
        results = await search_restaurants_by_cuisine(cuisine_type, max_results)
        logger.info(f"   ✅ Found {len(results)} restaurants")
        
        if not results:
            return f"No {cuisine_type} restaurants found. Try a different cuisine type."
        
        response_parts = [f"Found {len(results)} {cuisine_type} restaurants:"]
        for idx, restaurant in enumerate(results, 1):
            response_parts.append(
                f"{idx}. {restaurant['name']} - Rating: {restaurant.get('rating', 'N/A')}"
            )
        
        return "\n".join(response_parts)


@llm.function_tool(
    description="View the current cart contents including items, quantities, prices, and total"
)
async def quick_view_cart_tool() -> str:
        """View current cart"""
        logger.info("🔍 Tool: quick_view_cart()")
        cart = get_voice_cart()
        logger.info(f"   ✅ Cart status: {cart['status']}")
        
        if cart["status"] == "empty":
            return "Your cart is empty. You can start by searching for food items."
        
        items = cart.get("items", [])
        response_parts = [
            f"Your cart from {cart['restaurantName']}:",
            f"Items: {len(items)}",
        ]
        
        for idx, item in enumerate(items, 1):
            response_parts.append(
                f"  {idx}. {item['name']} x{item['quantity']} - ${item['totalPrice']:.2f}"
            )
        
        response_parts.append(f"Subtotal: ${cart['subtotal']:.2f}")
        response_parts.append(f"Delivery Fee: ${cart['deliveryFee']:.2f}")
        response_parts.append(f"Total: ${cart['total']:.2f}")
        
        return "\n".join(response_parts)


@llm.function_tool(
    description="Add items to the cart. Specify item name and quantity. Agent will determine restaurant automatically."
)
async def quick_add_to_cart_tool(
    item_name: str,
    quantity: int = 1,
) -> str:
        """Add items to cart"""
        logger.info(f"🔍 Tool: quick_add_to_cart(item_name='{item_name}', quantity={quantity})")
        result = add_to_voice_cart(item_name, None, quantity, None)  # Restaurant determined automatically
        logger.info(f"   ✅ Cart updated: {result['itemCount']} items, total ${result['total']:.2f}")
        
        if result["success"]:
            return (
                f"Added {quantity}x {item_name} to your cart. "
                f"Cart total: ${result['total']:.2f} ({result['itemCount']} items). "
                f"Say 'checkout' when ready to complete your order."
            )
        else:
            return f"Failed to add {item_name} to cart. Please try again."
    


@llm.function_tool(
    description="Complete checkout and place the order. Returns order confirmation with order number and total"
)
async def quick_checkout_tool() -> str:
    """Checkout and place order"""
    logger.info("🔍 Tool: quick_checkout()")
    result = checkout_cart()
    logger.info(f"   ✅ Checkout: {result}")
    
    if result["success"]:
        order = result["orderDetails"]
        return (
            f"Order placed successfully! "
            f"Order #{result['orderId']} from {order['restaurant']['name']}. "
            f"Total: ${order['total']:.2f} for {order['itemCount']} items. "
            f"Estimated delivery: 30-45 minutes. "
            f"Thank you for your order!"
        )
    else:
        return result.get("message", "Checkout failed. Please try again.")


# ============================================================================
# AGENT ENTRYPOINT
# ============================================================================

async def entrypoint(ctx: JobContext):
    """
    Main entrypoint for LiveKit agent
    Called when room is created and agent joins
    """
    logger.info("🚀 Agent entrypoint called")
    logger.info(f"   Room: {ctx.room.name}")
    
    # Wait for first participant
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
    logger.info("✅ Connected to room")
    
    participant = await ctx.wait_for_participant()
    logger.info(f"✅ Participant joined: {participant.identity}")
    
    # Create function tools list
    tools = [
        get_user_profile_tool,
        find_food_item_tool,
        find_restaurants_by_type_tool,
        quick_view_cart_tool,
        quick_add_to_cart_tool,
        quick_checkout_tool,
    ]
    
    # System instructions (matches voice-chat persona)
    system_instructions = """
You are a friendly and helpful AI food concierge assistant for a food delivery service.

Your personality:
- Conversational and warm
- Natural and casual tone (not robotic)
- Enthusiastic about helping users find great food
- Proactive in suggesting items based on user preferences

Your capabilities:
- Get user food preferences and dietary restrictions
- Search for specific dishes and menu items
- Find restaurants by cuisine type
- Add items to cart (single or multiple)
- Show cart contents
- Complete checkout and place orders

Guidelines:
- Start by greeting the user and asking how you can help
- Use get_user_profile early to personalize recommendations
- When searching, acknowledge what you found and offer details
- Before adding to cart, confirm the user wants that specific item
- After adding items, remind user they can checkout when ready
- Keep responses concise but friendly
- If you don't find what they want, suggest alternatives

Example flow:
1. User: "Hi" -> Greet and ask how to help
2. User: "I want pizza" -> find_food_item("pizza") and offer options
3. User: "I'll take the margherita" -> quick_add_to_cart("Margherita Pizza")
4. User: "What's in my cart?" -> quick_view_cart()
5. User: "Checkout" -> quick_checkout()

Remember: Be natural, helpful, and conversational!
"""
    
    # Create Voice Agent subclass with system instructions
    class FoodConciergeAgent(voice.Agent):
        def __init__(self):
            super().__init__(
                instructions=system_instructions,
                tools=tools,
            )
    
    # Create session with models (new v1.4.1 pattern)
    session = AgentSession(
        stt=openai.STT(),           # Speech-to-Text (Whisper)
        llm=openai.LLM(model="gpt-4"),  # Language Model  
        tts=openai.TTS(),           # Text-to-Speech
        vad=silero.VAD.load(),      # Voice Activity Detection
    )
    
    # Start the agent session with error handling
    try:
        await session.start(
            room=ctx.room,
            agent=FoodConciergeAgent(),
        )
        
        # Generate initial greeting
        await session.generate_reply(
            instructions="Greet the user warmly and ask how you can help with their food order today."
        )
        
        logger.info("✅ Voice Agent Session started")
        
    except Exception as e:
        error_type = type(e).__name__
        error_msg = str(e)
        error_trace = traceback.format_exc()
        
        logger.error(f"❌ Agent session failed: {error_type}: {error_msg}")
        logger.error(f"   Full traceback:\n{error_trace}")
        
        # Send error to frontend via data channel
        try:
            error_payload = json.dumps({
                'type': 'agent_error',
                'error_type': error_type,
                'error_message': error_msg,
                'fatal': True,
                'timestamp': asyncio.get_event_loop().time()
            }).encode('utf-8')
            
            await ctx.room.local_participant.publish_data(
                error_payload,
                reliable=True,
                destination_identities=[participant.identity] if participant else None
            )
            logger.info("📤 Error message sent to frontend")
        except Exception as send_error:
            logger.error(f"❌ Failed to send error to frontend: {send_error}")
        
        # Re-raise to ensure agent process handles it
        raise


# ============================================================================
# MAIN
# ============================================================================

if __name__ == "__main__":
    """
    Run agent with LiveKit CLI
    
    Development:
      python food_concierge_native.py dev
    
    Production:
      python food_concierge_native.py start
    """
    # Check for existing instance (only when running directly, not on reload)
    check_and_create_lock()
    
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            prewarm_fnc=None,  # Optional: function to prewarm models
        )
    )
