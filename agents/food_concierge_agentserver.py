"""
LiveKit Food Concierge Agent - AgentServer Pattern (v1.4.1+)

Following LiveKit's official drive-thru example patterns:
- AgentServer with @server.rtc_session decorator
- inference.STT/LLM/TTS unified API (not direct plugin imports)
- Typed userdata with RunContext[UserState]
- No optional parameters or defaults (use Literal["null"] pattern)
- Enum constraints with json_schema_extra
- Turn detection and max_tool_steps
- Session cleanup callbacks

Reference: /livekit-reference/agents/examples/drive-thru/agent.py
Comparison: See /docs/LIVEKIT_REFERENCE_COMPARISON.md

Tools (6 total, matching TypeScript):
1. get_user_profile - Get user preferences  
2. find_food_item - Search menu items
3. find_restaurants_by_type - Search restaurants
4. quick_view_cart - View current cart
5. quick_add_to_cart - Add items to cart
6. quick_checkout - Complete order

Usage:
  python food_concierge_agentserver.py dev

Then connect from frontend at /food/concierge-agentserver
Token endpoint: /api/livekit-agentserver/token
"""

import asyncio
import json
import logging
import os
from dataclasses import dataclass
from typing import Annotated, Literal

from dotenv import load_dotenv
from pydantic import Field

from livekit.agents import (
    Agent,
    AgentServer,
    AgentSession,
    JobContext,
    RunContext,
    ToolError,
    cli,
    function_tool,
    inference,
)
from livekit.plugins import openai, silero
# from livekit.plugins.turn_detector.multilingual import MultilingualModel  # Not available in current env

# Import our database functions
from database import (
    get_user_profile,
    search_menu_items,
    search_restaurants_by_cuisine,
    add_to_voice_cart,
    get_voice_cart,
    checkout_cart,  # Note: it's checkout_cart, not checkout_voice_cart
    # get_restaurant_menu,  # Not available in database.py
)

# Load environment variables
env_path = os.path.join(os.path.dirname(__file__), '..', '.env.local')
load_dotenv(env_path)

logger = logging.getLogger("food-concierge-agentserver")
logger.setLevel(logging.INFO)


# ============================================================================
# TYPED USERDATA (following drive-thru pattern)
# ============================================================================

@dataclass
class UserState:
    """User session state with cart and profile info"""
    user_id: str | None = None
    cart_id: str | None = None
    profile: dict | None = None
    order_count: int = 0
    local_participant: any = None  # Store room participant for data channel publishing


async def new_userdata() -> UserState:
    """Factory function to create new user state"""
    return UserState()


# ============================================================================
# SYSTEM INSTRUCTIONS
# ============================================================================

SYSTEM_INSTRUCTIONS = """You are the Food Concierge Assistant for the Rivera household.

You help with:
- Finding restaurants and menu items
- Adding items to cart
- Completing checkout

Core Principles:
1. Be conversational and natural
2. Ask clarifying questions when needed
3. Confirm actions before executing
4. Keep responses concise (2-3 sentences max)

Available Tools:
- get_user_profile: Load user preferences and delivery info
- find_food_item: Search menu items by name/keyword (e.g., "jerk chicken", "cheesecake")
- find_restaurants_by_type: Search restaurants by cuisine type OR restaurant name (e.g., "caribbean", "Island Breeze")
- quick_view_cart: Show current cart contents
- quick_add_to_cart: Add items to cart
- quick_checkout: Complete the order

Examples:
- User: "I want Thai food" → find_food_item(query="Thai")
- User: "Find Island Breeze" → find_restaurants_by_type(cuisine_type="Island Breeze")
- User: "I want jerk chicken" → find_food_item(query="jerk chicken")
- User: "Add pad thai to cart" → quick_add_to_cart(item_name="pad thai", quantity="1")
- User: "What's in my cart?" → quick_view_cart()
- User: "Checkout" → quick_checkout()

Always be helpful and efficient!
"""


# ============================================================================
# AGENT CLASS (following drive-thru pattern)
# ============================================================================

class FoodConciergeAgent(Agent):
    """Food ordering agent with function tools"""
    
    def __init__(self, *, userdata: UserState) -> None:
        super().__init__(
            instructions=SYSTEM_INSTRUCTIONS,
            tools=[
                self.build_get_profile_tool(),
                self.build_find_food_tool(),
                self.build_find_restaurants_tool(),
                self.build_fetch_image_tool(),
                self.build_view_cart_tool(),
                self.build_add_to_cart_tool(),
                self.build_checkout_tool(),
            ],
        )
    
    # ========================================================================
    # TOOL BUILDERS (following drive-thru pattern - no defaults, use Literal)
    # ========================================================================
    
    def build_get_profile_tool(self):
        """Get user profile - no parameters (always use default)"""
        
        @function_tool
        async def get_user_profile_tool(
            ctx: RunContext[UserState],
        ) -> str:
            """
            Get user's saved preferences, delivery address, and order history.
            Call this when:
            - User asks about their preferences
            - Need delivery information
            - Want to personalize recommendations
            """
            logger.info("🔧 Tool: get_user_profile()")
            
            try:
                result = await get_user_profile(None)  # Always use demo profile
                
                # Store in context for future use
                ctx.userdata.profile = result
                
                logger.info(f"   ✅ Profile retrieved")
                return f"User preferences: {json.dumps(result)}"
            except Exception as e:
                logger.error(f"   ❌ Error: {e}")
                raise ToolError(f"Failed to get profile: {str(e)}")
        
        return get_user_profile_tool
    
    def build_find_food_tool(self):
        """Search for food items - query required, max_results hardcoded"""
        
        @function_tool
        async def find_food_item_tool(
            ctx: RunContext[UserState],
            query: Annotated[
                str,
                Field(description="Search term for food items (e.g., 'cheesecake', 'Thai pad thai', 'vegetarian pizza')"),
            ],
        ) -> str:
            """
            Search for specific food items by name or description.
            Returns menu items with prices and restaurant names.
            
            Examples:
            - query="cheesecake" → Find all cheesecake items
            - query="Thai" → Find Thai dishes
            - query="vegetarian" → Find vegetarian options
            """
            max_results = 5  # Hardcoded instead of parameter
            logger.info(f"🔧 Tool: find_food_item(query='{query}')")
            
            try:
                results = await search_menu_items(query, max_results)
                logger.info(f"   ✅ Found {len(results)} items")
                
                # Send results to frontend for card rendering
                if ctx.userdata.local_participant:
                    try:
                        import json
                        tool_data = {
                            "type": "tool_call",
                            "tool_name": "find_food_item",
                            "result": {
                                "results": results,
                                "query": query
                            }
                        }
                        await ctx.userdata.local_participant.publish_data(
                            json.dumps(tool_data).encode(),
                            reliable=True
                        )
                        logger.info(f"   📤 Sent {len(results)} results to frontend")
                    except Exception as e:
                        logger.error(f"   ⚠️ Failed to send to frontend: {e}")
                else:
                    logger.warning(f"   ⚠️ No local_participant, skipping data publish")
                
                if not results:
                    return f"No menu items found matching '{query}'. Try a different search term."
                
                # Format for voice response
                response_parts = [f"Found {len(results)} items:"]
                for idx, item in enumerate(results, 1):
                    price = f"${item['price']:.2f}"
                    restaurant = item.get('restaurantName', 'Unknown')
                    response_parts.append(
                        f"{idx}. {item['name']} from {restaurant} - {price}"
                    )
                
                return "\n".join(response_parts)
            except Exception as e:
                logger.error(f"   ❌ Error: {e}")
                raise ToolError(f"Failed to search items: {str(e)}")
        
        return find_food_item_tool
    
    def build_find_restaurants_tool(self):
        """Search restaurants by cuisine type or name"""
        
        @function_tool
        async def find_restaurants_by_type_tool(
            ctx: RunContext[UserState],
            cuisine_type: Annotated[
                str,
                Field(description="Cuisine type OR restaurant name (e.g., 'italian', 'Island Breeze', 'thai', 'Papa John')"),
            ],
        ) -> str:
            """
            Find restaurants by cuisine type or restaurant name.
            Returns restaurant names with ratings.
            
            Examples:
            - cuisine_type="italian" → Find Italian restaurants
            - cuisine_type="Island Breeze" → Find Island Breeze restaurant
            - cuisine_type="caribbean" → Find Caribbean restaurants
            """
            max_results = 3  # Hardcoded
            logger.info(f"🔧 Tool: find_restaurants_by_type(cuisine_type='{cuisine_type}')")
            
            try:
                results = await search_restaurants_by_cuisine(cuisine_type, max_results)
                logger.info(f"   ✅ Found {len(results)} restaurants")
                
                # Send results to frontend for card rendering
                if ctx.userdata.local_participant:
                    try:
                        import json
                        tool_data = {
                            "type": "tool_call",
                            "tool_name": "find_restaurants_by_type",
                            "result": {
                                "restaurants": results,
                                "cuisine": cuisine_type
                            }
                        }
                        await ctx.userdata.local_participant.publish_data(
                            json.dumps(tool_data).encode(),
                            reliable=True
                        )
                        logger.info(f"   📤 Sent {len(results)} restaurants to frontend")
                    except Exception as e:
                        logger.error(f"   ⚠️ Failed to send to frontend: {e}")
                else:
                    logger.warning(f"   ⚠️ No local_participant, skipping data publish")
                
                if not results:
                    return f"No {cuisine_type} restaurants found."
                
                response_parts = [f"Found {len(results)} {cuisine_type} restaurants:"]
                for idx, restaurant in enumerate(results, 1):
                    response_parts.append(
                        f"{idx}. {restaurant['name']} - Rating: {restaurant.get('rating', 'N/A')}"
                    )
                
                return "\n".join(response_parts)
            except Exception as e:
                logger.error(f"   ❌ Error: {e}")
                raise ToolError(f"Failed to search restaurants: {str(e)}")
        
        return find_restaurants_by_type_tool
    
    def build_fetch_image_tool(self):
        """Fetch a photo of a menu item"""
        
        @function_tool
        async def fetch_menu_item_image_tool(
            ctx: RunContext[UserState],
            item_name: Annotated[
                str,
                Field(description="Name of the menu item to show an image for"),
            ],
        ) -> str:
            """
            Retrieve a photo of a menu item to help visualize what it looks like.
            Use this when the user asks:
            - "What does [item] look like?"
            - "Show me a picture of [item]"
            - "Can I see [item]?"
            
            Example: item_name="Jerk Chicken"
            """
            logger.info(f"🔧 Tool: fetch_menu_item_image(item_name='{item_name}')")
            
            try:
                # Search for the menu item first
                results = await search_menu_items(item_name, max_results=1)
                
                if not results:
                    logger.info(f"   ❌ Item not found")
                    return "I couldn't find that menu item. Could you try a different name?"
                
                item = results[0]
                image_url = item.get('image')
                
                if not image_url:
                    logger.info(f"   ❌ No image available")
                    return f"I found {item['name']} but couldn't get a photo of it right now."
                
                # Build result for frontend card
                result = {
                    "success": True,
                    "imageUrl": image_url,
                    "menuItem": {
                        "id": item.get('id'),
                        "slug": item.get('slug'),
                        "name": item['name'],
                        "description": item.get('description'),
                        "price": item.get('price')
                    },
                    "restaurant": {
                        "id": item.get('restaurantId'),
                        "slug": item.get('restaurantSlug'),
                        "name": item.get('restaurantName')
                    },
                    "speechSummary": f"Here's what {item['name']} looks like."
                }
                
                # Send to frontend for card rendering
                if ctx.userdata.local_participant:
                    try:
                        import json
                        tool_data = {
                            "type": "tool_call",
                            "tool_name": "fetch_menu_item_image",
                            "result": result
                        }
                        await ctx.userdata.local_participant.publish_data(
                            json.dumps(tool_data).encode(),
                            reliable=True
                        )
                        logger.info(f"   📤 Sent image to frontend")
                    except Exception as e:
                        logger.error(f"   ⚠️ Failed to send to frontend: {e}")
                else:
                    logger.warning(f"   ⚠️ No local_participant, skipping data publish")
                
                logger.info(f"   ✅ Image found: {item['name']}")
                return f"Here's what {item['name']} looks like from {item.get('restaurantName', 'the restaurant')}."
                
            except Exception as e:
                logger.error(f"   ❌ Error: {e}")
                raise ToolError(f"Failed to fetch image: {str(e)}")
        
        return fetch_menu_item_image_tool
    
    def build_view_cart_tool(self):
        """View current cart contents"""
        
        @function_tool
        async def quick_view_cart_tool(
            ctx: RunContext[UserState],
        ) -> str:
            """
            View the current cart contents with item count and total.
            Call this when user asks:
            - "What's in my cart?"
            - "Show my cart"
            - "How much is my order?"
            """
            logger.info("🔧 Tool: quick_view_cart()")
            
            try:
                cart = get_voice_cart()  # Sync function, no await
                
                if not cart or not cart.get('items'):
                    return "Your cart is empty."
                
                items = cart['items']
                subtotal = cart.get('subtotal', 0)
                
                response_parts = [f"Your cart has {len(items)} items:"]
                for idx, item in enumerate(items, 1):
                    quantity = item.get('quantity', 1)
                    price = item.get('totalPrice', 0)
                    response_parts.append(
                        f"{idx}. {quantity}x {item['name']} - ${price:.2f}"
                    )
                
                response_parts.append(f"\nSubtotal: ${subtotal:.2f}")
                
                # Send to frontend for card rendering
                if ctx.userdata.local_participant:
                    try:
                        import json
                        tool_data = {
                            "type": "tool_call",
                            "tool_name": "quick_view_cart",
                            "result": {"cart": cart}
                        }
                        await ctx.userdata.local_participant.publish_data(
                            json.dumps(tool_data).encode(),
                            reliable=True
                        )
                        logger.info(f"   📤 Sent cart view to frontend")
                    except Exception as e:
                        logger.error(f"   ⚠️ Failed to send to frontend: {e}")
                else:
                    logger.warning(f"   ⚠️ No local_participant, skipping data publish")
                
                logger.info(f"   ✅ Cart: {len(items)} items, ${subtotal:.2f}")
                return "\n".join(response_parts)
            except Exception as e:
                logger.error(f"   ❌ Error: {e}")
                raise ToolError(f"Failed to view cart: {str(e)}")
        
        return quick_view_cart_tool
    
    def build_add_to_cart_tool(self):
        """Add items to cart - use Literal for quantity, no optional params"""
        
        @function_tool
        async def quick_add_to_cart_tool(
            ctx: RunContext[UserState],
            item_name: Annotated[
                str,
                Field(description="Name of the food item to add"),
            ],
            quantity: Annotated[
                Literal["1", "2", "3", "4", "5"],
                Field(description="Quantity to add (1-5)"),
            ] = "1",
        ) -> str:
            """
            Add an item to the cart by name.
            System will automatically find the item and add it.
            
            Examples:
            - item_name="Pad Thai", quantity="1"
            - item_name="Margherita Pizza", quantity="2"
            
            Note: If multiple items match, the first one is added.
            """
            quantity_int = int(quantity)  # Convert Literal string to int
            logger.info(f"🔧 Tool: quick_add_to_cart(item_name='{item_name}', quantity={quantity_int})")
            
            try:
                result = add_to_voice_cart(item_name, None, quantity_int, None)  # Sync function, no await
                logger.info(f"   ✅ Added to cart")
                
                # Send result to frontend for card rendering
                if ctx.userdata.local_participant:
                    try:
                        import json
                        tool_data = {
                            "type": "tool_call",
                            "tool_name": "quick_add_to_cart",
                            "result": result
                        }
                        await ctx.userdata.local_participant.publish_data(
                            json.dumps(tool_data).encode(),
                            reliable=True
                        )
                        logger.info(f"   📤 Sent cart update to frontend")
                    except Exception as e:
                        logger.error(f"   ⚠️ Failed to send to frontend: {e}")
                else:
                    logger.warning(f"   ⚠️ No local_participant available, skipping data publish")
                
                return f"Added {quantity_int}x {item_name} to cart. {result.get('message', '')}"
            except Exception as e:
                logger.error(f"   ❌ Error: {e}")
                raise ToolError(f"Failed to add to cart: {str(e)}")
        
        return quick_add_to_cart_tool
    
    def build_checkout_tool(self):
        """Complete the order"""
        
        @function_tool
        async def quick_checkout_tool(
            ctx: RunContext[UserState],
        ) -> str:
            """
            Complete the checkout and place the order.
            Call this when user says:
            - "Checkout"
            - "Place my order"
            - "Complete order"
            
            This will create the order and clear the cart.
            """
            logger.info("🔧 Tool: quick_checkout()")
            
            try:
                result = checkout_cart()  # Sync function, not async
                
                # Send result to frontend for card rendering
                if ctx.userdata.local_participant:
                    try:
                        import json
                        tool_data = {
                            "type": "tool_call",
                            "tool_name": "quick_checkout",
                            "result": result
                        }
                        await ctx.userdata.local_participant.publish_data(
                            json.dumps(tool_data).encode(),
                            reliable=True
                        )
                        logger.info(f"   📤 Sent checkout result to frontend")
                    except Exception as e:
                        logger.error(f"   ⚠️ Failed to send to frontend: {e}")
                else:
                    logger.warning(f"   ⚠️ No local_participant, skipping data publish")
                
                if result.get('success'):
                    order_id = result.get('orderId', 'unknown')
                    total = result.get('total', 0)
                    
                    # Track in userdata
                    ctx.userdata.order_count += 1
                    
                    logger.info(f"   ✅ Order placed: {order_id}")
                    return f"Order confirmed! Order ID: {order_id}. Total: ${total:.2f}. Estimated delivery: 30-45 minutes."
                else:
                    return f"Checkout failed: {result.get('message', 'Unknown error')}"
            except Exception as e:
                logger.error(f"   ❌ Error: {e}")
                raise ToolError(f"Failed to checkout: {str(e)}")
        
        return quick_checkout_tool


# ============================================================================
# AGENT SERVER SETUP (following drive-thru pattern)
# ============================================================================

server = AgentServer()


async def on_session_end(ctx: JobContext) -> None:
    """Cleanup callback when session ends"""
    logger.info("🏁 Session ended, generating report...")
    try:
        report = ctx.make_session_report()
        if report:
            logger.info(f"   Session duration: {report.duration:.2f}s")
        else:
            logger.info("   No session report available")
    except Exception as e:
        logger.error(f"   Failed to generate session report: {e}")


@server.rtc_session(on_session_end=on_session_end)
async def food_concierge_agent(ctx: JobContext) -> None:
    """
    Main agent entry point - called when user connects to room.
    
    Following drive-thru pattern:
    1. Create userdata
    2. Create AgentSession with inference layer
    3. Start agent with typed userdata
    """
    logger.info(f"🚀 Agent starting for room: {ctx.room.name}")
    
    # Create user state
    userdata = await new_userdata()
    
    # Create agent session with NATIVE pipeline components
    # Following drive-thru pattern: use inference.STT/LLM/TTS
    session = AgentSession[UserState](
        userdata=userdata,
        
        # STT: Speech-to-Text using Deepgram Nova-3
        stt=inference.STT(
            "deepgram/nova-3",
            language="en",
        ),
        
        # LLM: OpenAI GPT-4o-mini (faster, cheaper)
        llm=inference.LLM("openai/gpt-4o-mini"),
        
        # TTS: OpenAI TTS plugin (inference API doesn't support OpenAI)
        tts=openai.TTS(),
        
        # Turn detection: Disabled (module not available)
        # turn_detection=MultilingualModel(),
        
        # VAD: Voice Activity Detection
        vad=silero.VAD.load(),
        
        # Max tool steps: Prevent infinite loops
        max_tool_steps=10,
    )
    
    # ========================================================================
    # EVENT CALLBACKS FOR DEBUGGING/VISIBILITY
    # ========================================================================
    
    @session.on("user_speech_committed")
    def on_user_speech(transcript: str):
        """Log what user said (STT output) and send to frontend"""
        logger.info(f"🎤 USER SAID: '{transcript}'")
        
        # Send to frontend for display in conversation history
        try:
            import json
            import asyncio
            data = {
                "type": "user_transcript",
                "text": transcript,
                "is_final": True
            }
            
            async def send_data():
                await ctx.room.local_participant.publish_data(
                    json.dumps(data).encode(),
                    reliable=True
                )
            
            asyncio.create_task(send_data())
            logger.info(f"   📤 Sent user transcript to frontend")
        except Exception as e:
            logger.error(f"   ⚠️ Failed to send transcript: {e}")
    
    @session.on("agent_speech_committed")
    def on_agent_speech(transcript: str):
        """Log what agent is saying (TTS input) and send to frontend"""
        logger.info(f"🤖 AGENT SAYING: '{transcript}'")
        
        # Send to frontend for display in conversation history
        try:
            import json
            import asyncio
            data = {
                "type": "agent_response",
                "text": transcript,
                "is_final": True
            }
            
            async def send_data():
                await ctx.room.local_participant.publish_data(
                    json.dumps(data).encode(),
                    reliable=True
                )
            
            asyncio.create_task(send_data())
            logger.info(f"   📤 Sent agent response to frontend")
        except Exception as e:
            logger.error(f"   ⚠️ Failed to send response: {e}")
    
    @session.on("function_calls_collected")
    def on_function_calls(calls: list):
        """Log tool calls requested by LLM"""
        for call in calls:
            logger.info(f"🔧 TOOL CALLED: {call.function_call.name}({call.function_call.arguments})")
    
    @session.on("function_calls_finished")
    def on_function_results(results: list):
        """Log tool execution results"""
        for result in results:
            result_preview = str(result.result)[:200] if result.result else "None"
            logger.info(f"✅ TOOL RESULT: {result.tool_call_id} -> {result_preview}...")
    
    # Start the agent
    await session.start(
        agent=FoodConciergeAgent(userdata=userdata),
        room=ctx.room
    )
    
    # Now that we're connected, store local participant for data publishing
    userdata.local_participant = ctx.room.local_participant
    logger.info("✅ Agent connected, local participant stored")
    
    # Generate initial greeting (like native agent)
    logger.info("🎙️ Generating greeting...")
    await session.generate_reply(
        instructions="Greet the user warmly and ask how you can help with their food order today."
    )
    
    logger.info("✅ Agent session started with greeting")


# ============================================================================
# ENTRY POINT
# ============================================================================

if __name__ == "__main__":
    cli.run_app(server)
