# SDK Strategy: Vercel AI SDK vs LiveKit

**Project**: ubereats-ai-sdk-hitl (Food Delivery Voice Concierge)  
**Date**: February 2026  
**Status**: Evaluation & Parallel Implementation Plan

---

## Executive Summary

This document compares **Vercel AI SDK** (current implementation) and **LiveKit** (proposed alternative) for building the voice-powered food delivery concierge. Both are production-ready frameworks, but they serve different architectural patterns:

- **Vercel AI SDK**: Client-driven, REST/streaming from Next.js API routes. Token-efficient, human-in-the-loop friendly, best for web-first + typed interactions.
- **LiveKit**: Server-driven agent framework with real-time media streams. Built for voice-first experiences, telephony, and carrier-grade media handling.

**Recommendation**: Deploy **both in parallel** using the same `OPENAI_API_KEY`. Each serves distinct user paths:
- **Typed/Chat path** → Vercel AI SDK (current `/api/chat`, `/api/food-chat`)
- **Voice-first path** → LiveKit Agents (new `/agents/food-agent.py`)

---

## Section 1: Architecture Comparison

### 1.1 Vercel AI SDK Overview

**Current Implementation Stack**:
```
User (Browser/App)
    ↓ (WebRTC or HTTP streaming)
Next.js API Layer (/api/chat, /api/food-chat)
    ↓ (HTTP/streaming)
OpenAI (via @ai-sdk/openai)
    ↓ (Tool calls)
Custom TTS/UI State Handlers
    ↓ (HITL Approval UI)
User Decision
```

**Key Characteristics**:
- **Transport**: HTTP streaming (Server-Sent Events) + optional WebRTC (via `useRealtimeVoice` hook)
- **Agent Location**: Runs in Next.js API route per request (stateless)
- **Tool Execution**: Client or server-side via `processToolCalls` utility
- **HITL Pattern**: Built-in via tools without `execute` property; client surfaces approval UI
- **Concurrency Model**: Per-message, no session persistence across requests
- **Media Handling**: Text-centric; audio transcription is external (`/api/openai/transcribe`)

**Strengths**:
✅ Human-in-the-loop UI integration (approval cards built into chat)  
✅ Token-efficient (stream responses, partial tool results)  
✅ Simple local development (just `npm run dev`)  
✅ Direct OpenAI integration without extra middleware  
✅ Reactive UI state management via React hooks  

**Limitations**:
❌ No voice turn detection (must use external VAD or manual recording)  
❌ No native telephony (would need Twilio/separate integration)  
❌ Media handling is ad-hoc (transcription separate from LLM orchestration)  
❌ Scaling requires horizontal API replication; no built-in load balancing  
❌ No native multi-agent handoff framework  

---

### 1.2 LiveKit Agents Overview

**Proposed Stack**:
```
User (Phone/App/Web)
    ↓ (WebRTC)
LiveKit Media Server (stateful room + participant tracking)
    ↓ (WebRTC)
Agent Process (Python or Node.js, long-running)
    ↓ (HTTP to OpenAI)
OpenAI (via inference gateway or direct keys)
    ↓ (Function calling)
Agent Responds via WebRTC
    ↓
User Hears/Sees Result
```

**Key Characteristics**:
- **Transport**: WebRTC (media) + Data Channel (messaging) + HTTP (external services)
- **Agent Location**: Long-running process on server; stateful session per room
- **Tool Execution**: Native function tool decorator; executed within agent process
- **HITL Pattern**: Via `function_tool` + return confirmation; can send to client via RPC
- **Concurrency Model**: Session-based; agent maintains state across turns
- **Media Handling**: First-class; STT/LLM/TTS all orchestrated in-process

**Strengths**:
✅ Native turn detection (semantic + VAD models built-in)  
✅ Stateful agent sessions (context persists, interruption handling)  
✅ Telephony-ready (SIP integration, call transfers)  
✅ Multi-modal (voice, video, text in same pipeline)  
✅ Production infrastructure (load balancing, Kubernetes-ready)  
✅ Multi-agent handoff built-in (agent.switch() pattern)  
✅ Native RPC for client↔agent communication  

**Limitations**:
❌ Server-side agent requires orchestration (not simple Next.js route)  
❌ Media server adds deployment complexity (or use LiveKit Cloud)  
❌ Steeper learning curve (new paradigm vs REST APIs)  
❌ Stateful agents consume more memory per session  
❌ HITL approval requires custom RPC or tool output routing  

---

## Section 2: Detailed Feature Comparison

| Feature | Vercel AI SDK | LiveKit Agents |
|---------|----------------|-----------------|
| **Language Support** | Any (via backend); TS/JS (SDK) | Python, Node.js, playground |
| **Turn Detection** | Manual (MediaRecorder) | Semantic + VAD (built-in) |
| **Tool Calling** | Via `tool()` descriptor | Via `@function_tool` decorator |
| **HITL Workflow** | Request approval, render UI buttons | Via RPC or tool output; agent awaits client response |
| **Voice Quality** | Depends on client capture + transcription | WebRTC codec negotiation (Opus, VP8/9, AV1) |
| **Scaling** | Horizontal (stateless API instances) | Room-based (scale media server; agent processes on compute) |
| **Latency** | ~500ms–2s (transcription + LLM + TTS round trip) | ~200–500ms (co-located agent + media server) |
| **Telephony** | Requires Twilio or custom SIP | Native SIP stack (LiveKit Ingress) |
| **Session State** | Per-request (thread-local or database) | In-memory across turns |
| **Multi-Agent Handoff** | Manual (return new instructions) | Native (agent.switch(), context carry-over) |
| **Development**  | `npm run dev` (just Node) | `python myagent.py dev` (requires media server or cloud) |
| **Observability** | Via API logs + client events | Built-in transcript, traces, analytics on LiveKit Cloud |
| **OpenAI Key Reuse** | Direct integration | Yes, via environment or inference gateway |

---

## Section 3: Your Current Architecture Mapped to LiveKit

### 3.1 Food Delivery Flow Comparison

**Today (Vercel AI SDK)**:

```typescript
// app/api/food-chat/route.ts
export async function POST(req: Request) {
  const { messages } = await req.json();

  // 1. Get user context (tool call)
  // 2. Search restaurants (tool call)
  // 3. Get menu (tool call)
  // 4. Build cart (tool call)
  // 5. Show HITL approval (tool without execute)
  // 6. Stream response + tool results back to client

  const stream = createUIMessageStream({
    originalMessages: messages,
    execute: async ({ writer }) => {
      // Tool handlers here
    },
  });
}
```

**Proposed (LiveKit Agents)**:

```python
# agents/food_agent.py
from livekit.agents import Agent, AgentSession, JobContext, function_tool

@function_tool
async def get_user_context(ctx: RunContext):
    """Fetch user preferences and recent orders."""
    # Same logic as Vercel tool
    pass

@function_tool
async def search_restaurants(ctx: RunContext, cuisine: str, budget: str):
    """Search for restaurants."""
    pass

server = AgentServer()

@server.rtc_session()
async def entrypoint(ctx: JobContext):
    session = AgentSession(
        stt=inference.STT("deepgram/nova-3"),
        llm=inference.LLM("openai/gpt-4.1-mini"),
        tts=inference.TTS("cartesia/sonic-3"),
    )

    agent = Agent(
        instructions=FOOD_CONCIERGE_PROMPT,  # Same system prompt as today
        tools=[
            get_user_context,
            search_restaurants,
            # ... other tools
        ],
    )

    await session.start(agent=agent, room=ctx.room)
```

### 3.2 HITL Approval Mapping

**Vercel AI SDK HITL** (today):
```typescript
// Tool without execute = requires approval
const initiateCheckout = tool({
  description: "Confirm order before checkout",
  parameters: z.object({ cartId: z.string() }),
  // NO execute property → client shows approve/decline buttons
});

// Client receives tool state: 'input-available'
// User clicks approve/decline
// Tool output sent back as APPROVAL.YES or APPROVAL.NO
```

**LiveKit HITL** (proposed):
```python
@function_tool
async def confirm_order(ctx: RunContext, cart_id: str):
    """Confirm order before checkout."""
    # Send message to client via RPC
    response = await ctx.send_rpc(
        method="confirm_order_approval",
        payload={"cart_id": cart_id},
    )
    # Agent pauses here until client responds
    if response.approved:
        return {"status": "confirmed", "checkout_id": "..."}
    else:
        return {"status": "cancelled"}
```

---

## Section 4: Setup & Implementation Plan

### 4.1 LiveKit SDK Setup

#### Step 1: Environment & Dependencies

```bash
# Install LiveKit Python SDK
pip install "livekit-agents[openai,silero,deepgram,cartesia,turn-detector]~=1.0"

# Or with npm for Node.js
npm install livekit-agents livekit-plugins-openai livekit-plugins-deepgram
```

#### Step 2: Environment Variables

```bash
# .env.local (add to existing)

# Existing Vercel AI SDK keys
OPENAI_API_KEY=sk-proj-...  # ← SHARED with LiveKit

# LiveKit Server
LIVEKIT_URL=wss://your-livekit-cloud.livekit.cloud  # or ws://localhost:7880 (self-hosted)
LIVEKIT_API_KEY=<from LiveKit Cloud dashboard>
LIVEKIT_API_SECRET=<from LiveKit Cloud dashboard>

# Optional: Use LiveKit Inference (unified API through LiveKit Cloud)
# This lets you reuse OpenAI key without exposing it to client
LIVEKIT_INFERENCE_ENABLED=true
```

#### Step 3: LiveKit Cloud Account

1. Go to [https://cloud.livekit.io/](https://cloud.livekit.io/)
2. Create a free account (1000 free agent session minutes/month)
3. Create a project and copy:
   - `LIVEKIT_URL`
   - `LIVEKIT_API_KEY`
   - `LIVEKIT_API_SECRET`

#### Step 4: Project Structure

```
agents/
├── food_agent.py          # Main agent entry point
├── tools/
│   ├── __init__.py
│   ├── restaurants.py     # searchRestaurants, getRestaurantMenu
│   ├── cart.py            # addItemToCart, viewCart, submitOrder
│   └── preferences.py     # getUserContext, updatePreferences
├── prompts.py             # System instructions (same as Vercel version)
└── requirements.txt       # pip dependencies
```

---

### 4.2 Implementation: Food Delivery Agent

#### File: `agents/food_agent.py`

```python
import os
import logging
from livekit.agents import (
    Agent,
    AgentSession,
    JobContext,
    RunContext,
    function_tool,
    cli,
    inference,
)
from livekit.plugins import silero
import asyncio

# Configure logging
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

# System instructions (same as Vercel API version)
SYSTEM_PROMPT = """You are the Food Court Voice Concierge for the Rivera household. Stay warm, fast, and confirm every step before placing or modifying an order.

Core experience reminders:
- Wait for the household to speak first. If there is no user content yet, do not start the conversation.
- On the very first request, call 'getUserContext' to ground the conversation in their saved preferences and recent orders.
- Use the household's saved delivery area by default. Only ask for a new location if the profile is missing it or the household explicitly requests a different city or neighborhood.
- Use 'searchRestaurants' to filter by cuisine, dietary tags, delivery window, and preferred budget. Highlight options that are open and closing soon when relevant.
- When narrowing by cuisine families (e.g., Latin → Caribbean), ask clarifying follow-ups until you have enough detail to call 'searchRestaurants'.
- After every 'searchRestaurants' call, acknowledge how many matches are available and reference the closest closing times before presenting details.
- Present a shortlist of up to five restaurants using 'recommendShortlist'. Summaries must include cuisine, standout dish, rating, delivery ETA, and closing time cues when available.
- Once the household picks a restaurant, call 'getRestaurantMenu' to surface sections and standout items before answering menu-specific questions.
- Use 'searchMenuItems' to filter by price, dietary tags, or keywords when the household asks for a specific dish or budget.
- Manage carts with 'addItemToCart' (which creates the cart if needed), 'viewCart', and 'submitCartOrder'. Confirm quantities, modifiers, and subtotal before advancing to checkout.
- Always ask which restaurant to proceed with. After a selection, call 'logOrderIntent' with the choice and confirm next steps (checkout vs continue browsing).
- Offer to update preferences via 'updatePreferences' when the household states new likes/dislikes or dietary needs. Confirm the change before applying it.
- When the household asks to refresh the homepage rows, clarify their intent, then call 'updateHomepageLayout'. Describe what changed and offer to show the refreshed view.
- Reserve 'logFeedback' for session wrap-up or when the household explicitly shares satisfaction notes.
- If live availability cannot be confirmed or no exact matches are found, be transparent about the limitation and suggest the closest alternatives or a next best action.

Voice-first guidelines:
- Keep responses under three concise sentences unless the household requests more detail.
- Use natural language confirmations while tools run, but do not assume an action succeeded until the tool completes.
- Restate cuisine or dietary filters as you apply them so the household knows you heard correctly.
- Mention when a photo is displayed so the household knows an image appeared on screen."""

# ============================================================================
# TOOL DEFINITIONS (same logic as Vercel /api/food-chat/tools.ts)
# ============================================================================

@function_tool
async def get_user_context(ctx: RunContext):
    """Fetch user preferences, saved location, and recent orders."""
    # Mock implementation; in production, call Supabase
    return {
        "user_id": "demo-user-001",
        "name": "Rivera Family",
        "saved_location": {"city": "San Francisco", "area": "Mission District"},
        "favorite_cuisines": ["Mexican", "Italian", "Indian"],
        "dietary_preferences": ["vegetarian-friendly", "nut-allergy"],
        "recent_orders": [
            {"id": "order-001", "restaurant": "El Conquistador", "date": "2025-02-10"},
            {"id": "order-002", "restaurant": "Pasta Primo", "date": "2025-02-05"},
        ],
    }

@function_tool
async def search_restaurants(
    ctx: RunContext,
    cuisine: str,
    budget: str = "standard",
    dietary_tags: list[str] | None = None,
):
    """Search restaurants by cuisine, budget, and dietary preferences."""
    # Mock implementation; in production, query Supabase
    return {
        "count": 12,
        "restaurants": [
            {
                "id": "rest-001",
                "name": "Taco Fiesta",
                "cuisine": "Mexican",
                "rating": 4.7,
                "eta_minutes": 25,
                "closes_at": "23:00",
                "standout_dish": "Carnitas Tacos",
                "price_tier": budget,
            },
            {
                "id": "rest-002",
                "name": "Curry House",
                "cuisine": "Indian",
                "rating": 4.5,
                "eta_minutes": 30,
                "closes_at": "22:00",
                "standout_dish": "Tikka Masala",
                "price_tier": "premium",
            },
        ],
    }

@function_tool
async def get_restaurant_menu(ctx: RunContext, restaurant_id: str):
    """Fetch menu sections and popular items for a restaurant."""
    # Mock implementation
    return {
        "restaurant_id": restaurant_id,
        "sections": [
            {
                "title": "Appetizers",
                "items": [
                    {"id": "item-001", "name": "Chips & Salsa", "price": 5.99},
                    {"id": "item-002", "name": "Guacamole", "price": 7.99},
                ],
            },
            {
                "title": "Entrees",
                "items": [
                    {"id": "item-003", "name": "Carnitas Tacos (3)", "price": 12.99},
                ],
            },
        ],
    }

@function_tool
async def add_item_to_cart(
    ctx: RunContext,
    restaurant_id: str,
    item_id: str,
    quantity: int = 1,
    modifiers: dict | None = None,
):
    """Add an item to the cart."""
    return {
        "cart_id": "cart-temp-001",
        "item": {"id": item_id, "name": "Carnitas Tacos", "quantity": quantity},
        "subtotal": 12.99 * quantity,
    }

@function_tool
async def view_cart(ctx: RunContext, cart_id: str):
    """Get current cart contents and totals."""
    return {
        "cart_id": cart_id,
        "restaurant": "Taco Fiesta",
        "items": [
            {"id": "line-001", "name": "Carnitas Tacos (3)", "quantity": 2, "price": 25.98},
        ],
        "subtotal": 25.98,
        "tax": 2.08,
        "delivery_fee": 4.99,
        "total": 33.05,
    }

@function_tool
async def submit_cart_order(
    ctx: RunContext,
    cart_id: str,
    user_confirmation: bool = True,
):
    """Submit cart for checkout (with HITL confirmation)."""
    if not user_confirmation:
        return {"status": "cancelled", "reason": "User declined"}
    
    # In LiveKit, we'd use RPC for approval instead:
    # response = await ctx.send_rpc(
    #     method="confirm_order_approval",
    #     payload={"cart_id": cart_id, "total": 33.05}
    # )
    # if not response.get("confirmed"):
    #     return {"status": "cancelled"}
    
    return {
        "status": "order_placed",
        "order_id": "ord-20250212-001",
        "estimated_delivery": "25 minutes",
        "tracking_url": "https://example.com/track/ord-20250212-001",
    }

@function_tool
async def update_preferences(
    ctx: RunContext,
    new_cuisines: list[str] | None = None,
    dietary_tags: list[str] | None = None,
):
    """Update user preferences."""
    return {
        "saved": True,
        "preferences": {
            "favorite_cuisines": new_cuisines or [],
            "dietary_tags": dietary_tags or [],
        },
    }

# ============================================================================
# AGENT & SESSION SETUP
# ============================================================================

server = cli.AppRunner(
    description="Food Delivery Voice Concierge powered by LiveKit",
)

@server.entrypoint
async def entrypoint(ctx: JobContext):
    """Main agent entrypoint; joins LiveKit room and starts concierge."""
    
    logger.info(f"Starting agent for room: {ctx.room.name}, participant: {ctx.participant.identity}")

    # Create agent session with STT, LLM, TTS
    session = AgentSession(
        # Use LiveKit Inference for unified API (shares OPENAI_API_KEY)
        # OR use direct providers: stt=deepgram.STT(...), llm=openai.LLM(...)
        stt=inference.STT("deepgram/nova-3", language="en"),
        llm=inference.LLM("openai/gpt-4.1-mini"),
        tts=inference.TTS("cartesia/sonic-3", voice="9626c31c-bec5-4cca-baa8-f8ba9e84c8bc"),
        vad=silero.VAD.load(),
    )

    # Create agent with tools
    agent = Agent(
        name="Food Concierge",
        instructions=SYSTEM_PROMPT,
        tools=[
            get_user_context,
            search_restaurants,
            get_restaurant_menu,
            add_item_to_cart,
            view_cart,
            submit_cart_order,
            update_preferences,
        ],
    )

    # Start agent in room
    await session.start(agent=agent, room=ctx.room)

    # Generate initial greeting
    await session.generate_reply(
        instructions="Greet the household warmly and ask what they'd like to order today."
    )

if __name__ == "__main__":
    cli.run_app(server)
```

#### File: `agents/requirements.txt`

```txt
livekit-agents[openai,silero,deepgram,cartesia,turn-detector]>=1.0
python-dotenv>=1.0.0
```

---

### 4.3 Running the Agent

```bash
# Option 1: Local development (with LiveKit Cloud backend)
python agents/food_agent.py dev

# Option 2: Terminal test (no external dependencies)
python agents/food_agent.py console

# Option 3: Production deployment
python agents/food_agent.py start
```

---

## Section 5: Parallel Implementation Strategy

### 5.1 Deploy Both SDKs Simultaneously

Your food delivery concierge can serve two user entry points:

**Path A: Web Chat (Vercel AI SDK)** ← Current implementation  
```
User → Browser (React/UI) → /api/food-chat → OpenAI → Tools → HITL Approval Cards
```
**Use when**: Typed interactions, low-bandwidth, desktop/tablet users, workflow review needed.

**Path B: Voice Call (LiveKit Agents)** ← New implementation  
```
User → Phone/Browser (WebRTC) → LiveKit Media Server → Agent → OpenAI → Tools via RPC
```
**Use when**: Mobile users, voice-first preference, real-time turn detection needed, telephony integration desired.

---

### 5.2 Routing Strategy

**Option 1: Separate Entry Points**
```typescript
// pages/voice.tsx → connects to LiveKit room
// pages/chat.tsx  → uses useChat() to Vercel API

// On LiveKit Cloud dashboard, set webhook:
// POST /api/livekit/webhooks → route agent dispatch
```

**Option 2: Unified Concierge**
- Both paths call the **same Supabase schema** for user context, cart, preferences
- Both use **identical system prompt** (version control in `docs/PROMPTS.md`)
- Divergence only in media transport (HTTP streaming vs WebRTC)

---

### 5.3 Feature Parity Checklist

| Feature | Vercel SDK | LiveKit | Priority |
|---------|-----------|---------|----------|
| getUserContext | ✅ Tool | ✅ Tool | P0 |
| searchRestaurants | ✅ Tool | ✅ Tool | P0 |
| getRestaurantMenu | ✅ Tool | ✅ Tool | P0 |
| addItemToCart | ✅ Tool | ✅ Tool | P0 |
| viewCart | ✅ Tool | ✅ Tool | P0 |
| submitCartOrder (HITL) | ✅ Tool without execute | ⚠️ Via RPC (new) | P1 |
| updatePreferences | ✅ Tool | ✅ Tool | P2 |
| Turn Detection | ❌ Manual VAD | ✅ Built-in | P1 |
| Telephony | ❌ Need Twilio | ✅ Native SIP | P2 |
| Multi-language | ✅ System prompt | ✅ STT auto-detect | P2 |

---

## Section 6: OpenAI Key Reuse Across Both SDKs

### 6.1 Can I Use the Same Key?

**YES**, with caveats:

#### Scenario A: Direct Integration (Today)
```bash
# .env.local
OPENAI_API_KEY=sk-proj-ABC123xyz

# Vercel AI SDK
import { openai } from '@ai-sdk/openai';
const model = openai('gpt-4.1-mini');  // Uses OPENAI_API_KEY from env

# LiveKit (direct)
from livekit.plugins import openai
llm = openai.LLM(model='gpt-4.1-mini', api_key=os.getenv('OPENAI_API_KEY'))
```

✅ **Same key works for both**  
✅ No waterfall or proxy layer  
❌ Key exposed in both processes; harder to audit usage per endpoint  

---

#### Scenario B: LiveKit Inference Gateway (Recommended)
```bash
# .env.local
OPENAI_API_KEY=sk-proj-ABC123xyz                    # For Vercel SDK
LIVEKIT_URL=wss://your-livekit-cloud.livekit.cloud
LIVEKIT_API_KEY=<LiveKit Key>
LIVEKIT_API_SECRET=<LiveKit Secret>

# LiveKit (via inference gateway)
from livekit.agents import inference
llm = inference.LLM("openai/gpt-4.1-mini")  # Uses OPENAI_API_KEY, sent to LiveKit Cloud
```

✅ **Centralized authentication through LiveKit Cloud**  
✅ Single point of API key management  
✅ LiveKit tallies usage for billing transparency  
✅ Can swap models without changing agent code  
❌ ~5–10ms extra latency (LK Cloud → OpenAI)  
❌ Requires LiveKit Cloud account  

---

### 6.2 Usage & Costs

**Assumption**: Same concierge prompt, same tools, ~200 tokens per turn  

| Scenario | Monthly Calls | Est. Input Tokens | Est. Output Tokens | Cost (approx) |
|----------|---------------|-------------------|-------------------|----------------|
| Vercel Only (1K chats/mo) | 1,000 | 200K | 150K | ~$1.50 |
| LiveKit Only (500 voice calls/mo × 5 min avg) | 500 | 100K | 75K | ~$0.75 |
| Both Parallel (1K typed + 500 voice) | 1,500 | 300K | 225K | ~$2.25 |

OpenAI key consumption is **identical regardless of SDK**; the SDK is just the transport layer.

---

## Section 7: Migration & Risk Mitigation

### 7.1 Phase 1: Parallel Development (Week 1–2)

1. **Set up LiveKit environment**
   - Create LiveKit Cloud account
   - Copy LIVEKIT_URL, API_KEY, API_SECRET to `.env.local`

2. **Create food_agent.py**
   - Copy tool logic from `/app/api/food-chat/tools.ts`
   - Implement in Python with `@function_tool` decorator
   - Test locally: `python agents/food_agent.py console`

3. **Create test client** (minimal WebRTC client to connect)
   - Use LiveKit's [React example](https://github.com/livekit/examples/tree/main/react-agents)
   - Connect to food_agent and run through same flow

4. **Create /api/livekit/webhooks** (optional)
   - LiveKit sends room lifecycle events
   - Log for observability

---

### 7.2 Phase 2: Feature Parity Testing (Week 2–3)

| Test Case | Vercel SDK (Expected) | LiveKit (Target) | Status |
|-----------|----------------------|------------------|--------|
| TC-1: First user request → getUserContext | ✅ Tool called | ✅ Tool called | ? |
| TC-2: Search restaurants by cuisine | ✅ Result shown | ✅ Result spoken | ? |
| TC-3: Select restaurant → getMenu | ✅ Items listed | ✅ Items listed | ? |
| TC-4: Add item to cart | ✅ Quantity confirmed | ✅ Quantity confirmed | ? |
| TC-5: View cart summary | ✅ HTML card | ✅ Spoken summary | ? |
| TC-6: Confirm order (HITL) | ✅ Approve button | ⚠️ Require RPC response | ? |
| TC-7: Order placed confirmation | ✅ Text displayed | ✅ Text + spoken | ? |

---

### 7.3 Phase 3: Production Cutover (Week 3–4)

1. **Announce voice option in UI**
   - Add "Try our voice concierge" link on `/food/concierge`
   - Route to LiveKit WebRTC client

2. **Monitor both endpoints**
   - Vercel SDK: `/api/food-chat` (existing)
   - LiveKit: Agent process (new)
   - Track errors, latency, tool call counts

3. **Phased traffic split** (optional)
   - Start 10% of new users on LiveKit
   - Ramp up to 50% after 1 week
   - Full production when stable

---

## Section 8: HITL Approval in LiveKit

### 8.1 Handling User Approval via RPC

LiveKit's **RPC (Remote Procedure Call)** system lets the agent send a message to the client and wait for response.

**Pattern: Agent pauses until client confirms**

```python
# agents/food_agent.py

@function_tool
async def submit_cart_order(
    ctx: RunContext,
    cart_id: str,
    items_summary: str,
):
    """Submit cart for checkout (with user confirmation)."""
    
    # Pause agent and ask client for approval
    approval = await ctx.send_rpc(
        method="request_order_confirmation",
        payload={
            "cart_id": cart_id,
            "items": items_summary,
            "total": 33.05,
        },
    )
    
    # Wait for client response (timeout 30s)
    if approval.get("confirmed"):
        # Proceed with order
        return {"status": "order_placed", "order_id": "ord-001"}
    else:
        # User declined
        return {"status": "cancelled", "reason": "User declined"}
```

**Frontend (React)** to handle RPC:

```typescript
// hooks/useAgentRPC.ts

const { room } = useRoom();

// Listen for RPC calls from agent
room?.onReceivedData((data) => {
  if (data.method === "request_order_confirmation") {
    // Show approval UI
    showApprovalModal({
      items: data.payload.items,
      total: data.payload.total,
      onConfirm: () => sendRpcResponse(true),
      onDecline: () => sendRpcResponse(false),
    });
  }
});

async function sendRpcResponse(confirmed: boolean) {
  await room?.sendRpc(
    method_response_id,
    { confirmed },
  );
}
```

---

## Section 9: Advantages of Running Both in Parallel

| Benefit | Why It Matters |
|---------|----------------|
| **User Choice** | Some prefer typed; others prefer voice. Serve both. |
| **Fallback** | If voice agent stalls, user can switch to chat. |
| **Feature Validation** | Test new workflows in Vercel SDK first (faster iteration); roll to LiveKit once stable. |
| **Billing Optionality** | Use Vercel for light workloads; scale voice to LiveKit when volume justifies. |
| **Team Familiarity** | Devs stay proficient with TS/React (Vercel); ops team learns Python/LiveKit in parallel. |
| **Market Differentiation** | Offer "chat concierge" + "voice concierge"; users pick their vibe. |

---

## Section 10: Quick Decision Tree

```
┌─ Do you need voice + phone integration?
│  ├─ YES → LiveKit (go to Section 4)
│  └─ NO  → Stick with Vercel AI SDK
│
├─ Do you have a Python infrastructure team?
│  ├─ YES → LiveKit is native
│  └─ NO  → Vercel SDK stays in Node.js
│
├─ Do you need sub-200ms latency for real-time interactions?
│  ├─ YES → LiveKit (media co-located)
│  └─ NO  → Either (Vercel is fine for chat)
│
├─ Do you need stateful agent sessions (context across 30+ min calls)?
│  ├─ YES → LiveKit session model
│  └─ NO  → Vercel request-per-message is simpler
│
└─ Do you want to start small and scale fast?
   ├─ YES → Deploy BOTH in parallel (Vercel for chat, LiveKit for voice)
   └─ NO  → Commit to one today; migrate later if needed
```

---

## Section 11: Summary & Next Steps

### 11.1 Immediate Actions

1. **Create LiveKit Cloud account** (free, 1K agent-session minutes/month)
2. **Copy `/app/api/food-chat/tools.ts` logic to `agents/food_agent.py`**
3. **Test locally**: `python agents/food_agent.py console` (no external deps)
4. **Create test WebRTC client** to join room and validate flow

### 11.2 Within 1 Week

- [ ] LiveKit agent runs same concierge logic as Vercel endpoint
- [ ] HITL approval works via RPC
- [ ] Telephony integration optional (Phase 2)
- [ ] OpenAI key reuse confirmed

### 11.3 Key Takeaways

✅ **LiveKit is NOT a replacement**—it's a complement for voice-first use cases  
✅ **OpenAI key works for both**: Use the same `OPENAI_API_KEY` in Vercel SDK and LiveKit  
✅ **Recommend parallel deployment**: Vercel SDK for typed chat (current), LiveKit for voice calls (new)  
✅ **HITL approval** in LiveKit uses RPC instead of approval UI buttons—still achievable  
✅ **Setup is straightforward**: Python agent code provided, runs in ~50 lines per tool  

---

## Appendix: References

### Official Documentation
- [Vercel AI SDK](https://sdk.vercel.ai/)
- [LiveKit Agents Docs](https://docs.livekit.io/agents/)
- [LiveKit Python SDK](https://github.com/livekit/agents)
- [LiveKit Cloud](https://cloud.livekit.io/)

### Examples
- [LiveKit Food Agent](https://github.com/livekit/agents/blob/main/examples/voice_agents/restaurant_agent.py)
- [LiveKit Multi-Agent](https://github.com/livekit/agents/blob/main/examples/voice_agents/multi_agent.py)
- [Vercel Food Chat (Your Code)](/app/api/food-chat/route.ts)

### Related Reading
- [WebRTC Media Server Comparison](https://devpost.com/software/webrtc-sfu-comparison)
- [OpenAI Function Calling Best Practices](https://cookbook.openai.com/examples/function_calling_cookbook)
- [Live Streaming Architectures](https://blog.livekit.io/)

---

**End of Document**

---

## Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-12 | AI Assistant | Initial comparison & parallel implementation strategy |