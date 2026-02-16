# Agent-Server Application Template

> **Purpose**: Blueprint for creating voice-enabled AI agents with real-time interaction, persistent storage, and rich UI feedback. Clone this architecture to build domain-specific agents (food ordering, travel planning, medical intake, etc.).

**Last Updated**: February 15, 2026  
**Based On**: UberEats AI Food Concierge (ubereats-ai-sdk-hitl)  
**Pattern**: LiveKit AgentServer v1.4.1+ with Supabase

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Project Structure](#project-structure)
4. [Prerequisites](#prerequisites)
5. [Core Components](#core-components)
6. [LiveKit Integration](#livekit-integration)
7. [Supabase Integration](#supabase-integration)
8. [Tool Creation Pattern](#tool-creation-pattern)
9. [Frontend Patterns](#frontend-patterns)
10. [Development Workflow](#development-workflow)
11. [Cloning Checklist](#cloning-checklist)

---

## Overview

This template provides a **production-ready** voice AI agent architecture with:

- ✅ **Real-time voice interaction** (LiveKit STT→LLM→TTS pipeline)
- ✅ **Persistent data storage** (Supabase PostgreSQL)
- ✅ **In-memory session state** (fast operations during conversation)
- ✅ **Rich UI feedback** (React card components)
- ✅ **Type-safe tool definitions** (Pydantic schemas + TypeScript types)
- ✅ **Real-time updates** (LiveKit data channel for instant UI sync)
- ✅ **Development tooling** (startup scripts, testing patterns)

### What You Can Build With This

- 🍔 **Food ordering** (restaurants, menus, cart management)
- ✈️ **Travel booking** (flights, hotels, itineraries)
- 🏥 **Medical intake** (symptoms, history, appointment scheduling)
- 🛒 **Shopping assistant** (product search, recommendations, checkout)
- 📚 **Education tutor** (Q&A, lesson plans, progress tracking)
- 💼 **Business consultant** (analysis, recommendations, reporting)

---

## Architecture

### System Design Principles

```
┌─────────────────────────────────────────────────────────────┐
│                        User Browser                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Next.js Frontend (React + LiveKit Components)         │ │
│  │  - Voice Assistant UI                                  │ │
│  │  - Card Components (dynamic tool result rendering)    │ │
│  │  - Real-time cart badge (from LiveKit data channel)   │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                           ↕ WebRTC + Data Channel
┌─────────────────────────────────────────────────────────────┐
│                    LiveKit Cloud Service                     │
│  - Voice routing (media plane)                              │
│  - Agent dispatch (control plane)                           │
│  - Data channel multiplexing                                │
└─────────────────────────────────────────────────────────────┘
                           ↕ gRPC
┌─────────────────────────────────────────────────────────────┐
│              Python Agent Server (Local/Cloud)               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  food_concierge_agentserver.py                         │ │
│  │  - AgentServer pattern (@server.rtc_session)           │ │
│  │  - inference.STT/LLM/TTS pipeline                      │ │
│  │  - 9 function tools (typed with Pydantic)              │ │
│  │  - In-memory session state (voice_cart global)         │ │
│  └────────────────────────────────────────────────────────┘ │
│                           ↕                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  database.py                                           │ │
│  │  - Supabase client wrapper                             │ │
│  │  - In-memory cart operations (session-only)            │ │
│  │  - Database queries (persistent data)                  │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                           ↕ HTTPS/PostgREST
┌─────────────────────────────────────────────────────────────┐
│                    Supabase (PostgreSQL)                     │
│  - User profiles                                            │
│  - Domain-specific tables (restaurants, menus, carts, etc.) │
│  - RLS policies (optional)                                  │
└─────────────────────────────────────────────────────────────┘
```

### Dual-State Architecture

**Why both in-memory AND database?**

| State Type | Where | When | Why |
|------------|-------|------|-----|
| **In-Memory** | Python `voice_cart` global | During active voice session | Speed (no DB latency), transient operations, real-time feedback |
| **Database** | Supabase tables | After checkout, cross-session | Persistence, history, analytics, multi-user coordination |

**Data Flow**:
1. User speaks → Agent hears (STT)
2. Agent decides action (LLM) → calls tool
3. Tool modifies in-memory state → publishes to LiveKit data channel
4. Frontend receives data → updates UI instantly
5. On checkout/completion → writes to database for persistence

**Benefits**:
- 🚀 Fast: In-memory operations complete in milliseconds
- 💾 Persistent: Database captures final state and history
- 🔄 Real-time: LiveKit data channel syncs UI without polling
- 🎯 Simple: Agent doesn't wait for DB writes during conversation

### Technology Stack

**Backend (Python)**:
- `livekit-agents` (v1.0.0+) - Agent framework, STT/LLM/TTS orchestration
- `livekit-plugins-openai` - GPT-4 integration
- `livekit-plugins-silero` - VAD (voice activity detection)
- `supabase` - Database client
- `python-dotenv` - Environment variables
- `pydantic` - Schema validation (built into livekit-agents)

**Frontend (TypeScript/React)**:
- `next` (v16+) - React framework
- `@livekit/components-react` - Voice UI components
- `livekit-client` - WebRTC client
- `@supabase/supabase-js` - Database client (for fallback queries)
- `tailwindcss` - Styling

**Infrastructure**:
- **LiveKit Cloud** or **Self-hosted** - Voice/video infrastructure
- **Supabase** - PostgreSQL database + Auth + Storage
- **OpenAI** - LLM API (GPT-4/GPT-4o)

---

## Project Structure

```
your-agent-project/
├── agents/                          # Python agent backend
│   ├── food_concierge_agentserver.py   # Main agent server
│   ├── database.py                     # Database + in-memory operations
│   ├── test_cart_remove.py             # Test script example
│   └── requirements.txt                # Python dependencies
│
├── app/                             # Next.js app directory
│   ├── api/
│   │   ├── livekit-agentserver/
│   │   │   └── token/
│   │   │       └── route.ts           # Token generation endpoint
│   │   └── food/
│   │       └── cart/
│   │           └── route.ts           # Database cart API (fallback)
│   │
│   └── food/
│       └── concierge-agentserver/
│           └── page.tsx               # Main voice UI page
│
├── components/
│   ├── food-cards/                  # Card components for tool results
│   │   ├── BaseCard.tsx                # Base card with consistent styling
│   │   ├── ShoppingCartCard.tsx        # Cart display
│   │   ├── RestaurantSearchCard.tsx    # Restaurant results
│   │   ├── MenuItemSpotlightCard.tsx   # Menu item details
│   │   ├── OrderConfirmationCard.tsx   # Checkout confirmation
│   │   ├── types.ts                    # TypeScript interfaces
│   │   └── index.ts                    # Barrel export
│   │
│   ├── FoodCourtHeader.tsx          # Header with cart badge
│   └── DebugPanel.tsx               # Development debug view
│
├── supabase/
│   ├── schema.sql                   # Database schema
│   ├── seed_data.sql                # Sample data
│   └── config.toml                  # Supabase config (optional)
│
├── scripts/
│   └── test-*.js                    # Testing scripts
│
├── .env.local                       # Environment variables (gitignored)
├── env.local.example                # Template for .env.local
├── start-dev.sh                     # Development startup script
├── package.json                     # Node.js dependencies
├── tsconfig.json                    # TypeScript config
└── README.md                        # Project documentation
```

---

## Prerequisites

### Accounts & API Keys

1. **LiveKit Account**
   - Sign up: https://cloud.livekit.io
   - Create project → get API key, secret, and WebSocket URL
   - Free tier: 10,000 participant minutes/month

2. **Supabase Account**
   - Sign up: https://supabase.com
   - Create project → get URL and service role key
   - Free tier: 500MB database, 2GB bandwidth/month

3. **OpenAI Account**
   - Sign up: https://platform.openai.com
   - Create API key → billing required for GPT-4
   - Cost: ~$0.01-0.03 per conversation (GPT-4)

### Local Development Environment

**Minimum Requirements**:
- Node.js 18+ (for Next.js)
- Python 3.10+ (for livekit-agents)
- npm or yarn (package manager)
- Git (version control)

**Recommended**:
- VS Code with extensions: Python, TypeScript, Tailwind CSS IntelliSense
- PostgreSQL client (TablePlus, Postico, or pgAdmin) for database inspection
- LiveKit CLI for debugging: `brew install livekit-cli` (macOS)

### Environment Variables

Create `.env.local` in project root (see `env.local.example`):

```bash
# OpenAI API
OPENAI_API_KEY=sk-your-openai-api-key

# Supabase (get from supabase.com project settings)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# LiveKit (get from cloud.livekit.io project settings)
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret

# Demo user (optional, for testing)
DEMO_PROFILE_ID=00000000-0000-0000-0000-0000000000fc

# Pexels (optional, for food images)
PEXELS_API_KEY=your-pexels-key
```

---

## Core Components

### 1. Agent Server (Python)

**File**: `agents/food_concierge_agentserver.py`

**Key Patterns**:

```python
# AgentServer pattern (v1.4.1+)
from livekit.agents import AgentServer, inference, function_tool

server = AgentServer()

@server.rtc_session
async def entrypoint(ctx: JobContext):
    # Setup STT/LLM/TTS pipeline
    agent = Agent(
        vad=silero.VAD.load(),
        stt=openai.STT(...),
        llm=openai.LLM(...),
        tts=openai.TTS(...),
    )
    
    # Initial instructions
    await agent.say("Welcome! How can I help you today?")
    
    # Start agent
    await agent.start(room=ctx.room)
```

**Tool Definition Pattern**:

```python
@function_tool
def search_restaurants_by_type(
    ctx: RunContext[UserState],
    cuisine: Annotated[str, "Cuisine type to search for"],
    max_results: Annotated[int, "Maximum results"] = 5,
) -> str:
    """Search for restaurants by cuisine type."""
    
    # 1. Call database function
    results = search_restaurants_by_cuisine(cuisine, max_results)
    
    # 2. Publish to LiveKit data channel (for UI)
    ctx.room.local_participant.publish_data(
        json.dumps({
            "type": "tool_call",
            "tool_name": "search_restaurants_by_type",
            "result": results
        })
    )
    
    # 3. Return text for LLM
    return f"Found {len(results['restaurants'])} restaurants."
```

**Session State Pattern**:

```python
from dataclasses import dataclass

@dataclass
class UserState:
    """Session-specific user data"""
    user_id: str | None = None
    cart_id: str | None = None
    profile: dict | None = None
    order_count: int = 0

async def new_userdata() -> UserState:
    return UserState()
```

### 2. Database Layer (Python)

**File**: `agents/database.py`

**Key Patterns**:

```python
from supabase import create_client, Client

# Initialize once at module level
supabase: Client = create_client(supabase_url, supabase_service_key)

# In-memory session state (fast, transient)
voice_cart: Optional[Dict[str, Any]] = None

def get_voice_cart() -> Dict[str, Any]:
    """Get current in-memory cart"""
    global voice_cart
    if not voice_cart:
        voice_cart = {
            "items": [],
            "subtotal": 0.0,
            "total": 0.0,
        }
    return {"success": True, "cart": voice_cart}

def add_to_voice_cart(
    restaurant_id: str,
    item_name: str,
    quantity: int,
    price: float
) -> Dict[str, Any]:
    """Add item to in-memory cart (merges duplicates)"""
    global voice_cart
    cart = get_voice_cart()["cart"]
    
    # Check for existing item (case-insensitive)
    existing = None
    for item in cart["items"]:
        if item["name"].lower() == item_name.lower():
            existing = item
            break
    
    if existing:
        # Merge quantities
        existing["quantity"] += quantity
        existing["totalPrice"] = existing["quantity"] * price
    else:
        # Add new item
        cart["items"].append({
            "id": str(uuid.uuid4()),
            "name": item_name,
            "quantity": quantity,
            "totalPrice": quantity * price,
            "options": []
        })
    
    # Recalculate totals
    cart["subtotal"] = sum(item["totalPrice"] for item in cart["items"])
    cart["total"] = cart["subtotal"]
    
    return {"success": True, "cart": cart, "item": {...}}

# Database queries (persistent)
def search_restaurants_by_cuisine(cuisine: str, limit: int = 10):
    """Query Supabase for restaurants"""
    response = supabase.table("fc_restaurants") \
        .select("*") \
        .ilike("cuisine", f"%{cuisine}%") \
        .limit(limit) \
        .execute()
    
    return {
        "success": True,
        "restaurants": response.data
    }
```

**When to use in-memory vs database**:
- In-memory: Cart operations, session state, temporary calculations
- Database: User profiles, menu data, order history, analytics

### 3. Frontend Voice UI (React/TypeScript)

**File**: `app/food/concierge-agentserver/page.tsx`

**Key Patterns**:

```tsx
import { LiveKitRoom, useVoiceAssistant, BarVisualizer } from '@livekit/components-react';

function VoiceAssistantPage() {
  const [token, setToken] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [livekitCartCount, setLivekitCartCount] = useState<number | null>(null);
  
  // Fetch token from your API
  useEffect(() => {
    fetch('/api/livekit-agentserver/token', { method: 'POST' })
      .then(res => res.json())
      .then(data => setToken(data.token));
  }, []);
  
  return (
    <LiveKitRoom
      token={token}
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
      connect={true}
      audio={true}
      video={false}
      onDataReceived={handleDataReceived}
    >
      <VoiceAssistantUI 
        messages={messages}
        cartCount={livekitCartCount}
      />
    </LiveKitRoom>
  );
}

// Handle LiveKit data channel messages
function handleDataReceived(payload: Uint8Array) {
  const text = new TextDecoder().decode(payload);
  const data = JSON.parse(text);
  
  if (data.type === 'tool_call') {
    // Add to message history
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: '',
      toolName: data.tool_name,
      toolResult: data.result
    }]);
    
    // Update cart count if cart tool
    const cartTools = ['quick_add_to_cart', 'quick_view_cart', 'remove_from_cart'];
    if (cartTools.includes(data.tool_name) && data.result?.cart?.items) {
      const count = data.result.cart.items.reduce(
        (sum, item) => sum + item.quantity, 
        0
      );
      setLivekitCartCount(count);
    }
  }
}
```

### 4. Card Components (React)

**File**: `components/food-cards/ShoppingCartCard.tsx`

**Pattern**: Consistent layout with BaseCard

```tsx
import BaseCard, { CardSection, CardBadge, CardButton } from './BaseCard';

const ShoppingCartCard: React.FC<{ data: CartData }> = ({ data }) => {
  const { cart, restaurant, speechSummary } = data;
  
  return (
    <BaseCard
      title="Shopping Cart"
      subtitle={speechSummary}
      accent="emerald"
      size="md"
    >
      {/* Restaurant Header */}
      <CardSection>
        <h4>{restaurant.name}</h4>
        <p>{restaurant.cuisine}</p>
      </CardSection>
      
      {/* Cart Items */}
      <CardSection title="Cart Items">
        {cart.items.map(item => (
          <div key={item.id}>
            {item.quantity}× {item.name} - ${item.totalPrice}
          </div>
        ))}
      </CardSection>
      
      {/* Totals */}
      <CardSection>
        <div>Subtotal: ${cart.subtotal}</div>
        <div>Total: ${cart.total}</div>
      </CardSection>
    </BaseCard>
  );
};
```

**BaseCard provides**:
- Consistent shadows, borders, spacing
- `CardSection` for logical grouping
- `CardBadge` for pills (e.g., "3×")
- `CardButton` for CTAs
- `CardMetric` for key-value pairs

### 5. API Routes (Next.js)

**Token Generation**: `app/api/livekit-agentserver/token/route.ts`

```typescript
import { AccessToken } from 'livekit-server-sdk';

export async function POST(request: NextRequest) {
  const { roomName, participantName } = await request.json();
  
  const token = new AccessToken(
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET,
    { identity: participantName, ttl: '1h' }
  );
  
  token.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canPublishData: true,
    canSubscribe: true,
  });
  
  return NextResponse.json({
    token: await token.toJwt(),
    url: process.env.LIVEKIT_URL,
  });
}
```

**Database API (Fallback)**: `app/api/food/cart/route.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  const { data, error } = await supabase
    .from('fc_carts')
    .select('*, fc_cart_items(*)')
    .single();
  
  return NextResponse.json({ data, error });
}
```

---

## LiveKit Integration

### Voice Pipeline (STT → LLM → TTS)

**Automatic by AgentServer**:
1. User speaks → LiveKit audio track
2. Agent receives audio → `silero.VAD` detects speech end
3. Audio chunk → `openai.STT` (Whisper) → text transcript
4. Text → `openai.LLM` (GPT-4) → tool decisions + response
5. Response → `openai.TTS` (OpenAI voices) → audio
6. Audio → LiveKit audio track → User hears

**You configure, LiveKit handles the rest**.

### Data Channel (Tool Results → Frontend)

**Agent publishes**:
```python
ctx.room.local_participant.publish_data(
    json.dumps({
        "type": "tool_call",
        "tool_name": "add_to_cart",
        "result": {"cart": {...}, "item": {...}}
    })
)
```

**Frontend receives**:
```tsx
<LiveKitRoom onDataReceived={handleDataReceived}>
  {/* ... */}
</LiveKitRoom>

function handleDataReceived(payload: Uint8Array) {
  const data = JSON.parse(new TextDecoder().decode(payload));
  // Update UI based on data.tool_name and data.result
}
```

**Benefits**:
- 🚀 Instant (WebRTC data channel, no HTTP polling)
- 🎯 Type-safe (structured JSON)
- 🔄 Bidirectional (agent ↔ frontend)

### Connection Flow

```
1. Frontend      → POST /api/livekit-agentserver/token
2. Backend       → Generates JWT with room permissions
3. Frontend      → Connects to LiveKit with token
4. LiveKit       → Dispatches agent to room (via AgentServer)
5. Agent         → Joins room, starts listening
6. User speaks   → STT → LLM → TTS → User hears
7. Tool called   → Publishes to data channel → Frontend updates
```

---

## Supabase Integration

### Schema Design

**Core Tables** (adapt for your domain):

```sql
-- User profiles
CREATE TABLE fc_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT UNIQUE NOT NULL,
  display_name TEXT,
  favorite_cuisines TEXT[],
  dietary_tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Domain entities (e.g., restaurants)
CREATE TABLE fc_restaurants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  cuisine TEXT NOT NULL,
  rating NUMERIC(3,2),
  closes_at TEXT,
  delivery_fee NUMERIC(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Menu items
CREATE TABLE fc_menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID REFERENCES fc_restaurants(id),
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Persistent carts (optional, for cross-session)
CREATE TABLE fc_carts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES fc_profiles(id),
  restaurant_id UUID REFERENCES fc_restaurants(id),
  status TEXT DEFAULT 'active',
  subtotal NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE fc_cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cart_id UUID REFERENCES fc_carts(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES fc_menu_items(id),
  quantity INTEGER NOT NULL,
  total_price NUMERIC(10,2) NOT NULL
);

-- Order history
CREATE TABLE fc_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES fc_profiles(id),
  restaurant_id UUID REFERENCES fc_restaurants(id),
  total NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Seed Data

**Always include test data** for development:

```sql
-- Demo profile
INSERT INTO fc_profiles (id, user_id, display_name, favorite_cuisines)
VALUES (
  '00000000-0000-0000-0000-0000000000fc',
  'demo-user',
  'Demo User',
  ARRAY['italian', 'thai', 'mexican']
);

-- Sample restaurants
INSERT INTO fc_restaurants (slug, name, cuisine, rating) VALUES
('joes-pizza', 'Joe''s Pizza', 'italian', 4.5),
('thai-palace', 'Thai Palace', 'thai', 4.7),
('taco-heaven', 'Taco Heaven', 'mexican', 4.3);

-- Sample menu items
INSERT INTO fc_menu_items (restaurant_id, slug, name, price, tags)
SELECT 
  r.id,
  'margherita-pizza',
  'Margherita Pizza',
  12.99,
  ARRAY['vegetarian']
FROM fc_restaurants r WHERE r.slug = 'joes-pizza';
```

### Database Queries

**Pattern**: Wrap Supabase client calls in functions

```python
def get_restaurant_menu(restaurant_id: str) -> Dict[str, Any]:
    """Get full menu for a restaurant"""
    try:
        # Query with join
        response = supabase.table("fc_menu_items") \
            .select("*, fc_restaurants(name, cuisine)") \
            .eq("restaurant_id", restaurant_id) \
            .order("section", ascending=True) \
            .execute()
        
        if not response.data:
            return {"success": False, "error": "Restaurant not found"}
        
        # Group by section
        menu_sections = {}
        for item in response.data:
            section = item.get("section", "Main Menu")
            if section not in menu_sections:
                menu_sections[section] = []
            menu_sections[section].append({
                "id": item["id"],
                "name": item["name"],
                "price": item["price"],
                "description": item.get("description"),
                "tags": item.get("tags", [])
            })
        
        return {
            "success": True,
            "restaurant": response.data[0]["fc_restaurants"],
            "sections": menu_sections
        }
    except Exception as e:
        return {"success": False, "error": str(e)}
```

---

## Tool Creation Pattern

### Step-by-Step: Adding a New Tool

**Example**: Add "apply_promo_code" tool

#### 1. Add Database Function (`agents/database.py`)

```python
def apply_promo_code(code: str) -> Dict[str, Any]:
    """
    Apply promo code to current cart
    Returns discount amount and updated totals
    """
    global voice_cart
    
    # Get cart
    cart_result = get_voice_cart()
    if not cart_result["success"]:
        return {"success": False, "error": "No cart found"}
    
    cart = cart_result["cart"]
    
    # Query promo code from database
    response = supabase.table("fc_promo_codes") \
        .select("*") \
        .eq("code", code.upper()) \
        .eq("active", True) \
        .single() \
        .execute()
    
    if not response.data:
        return {"success": False, "error": "Invalid promo code"}
    
    promo = response.data
    
    # Calculate discount
    discount = 0.0
    if promo["type"] == "percentage":
        discount = cart["subtotal"] * (promo["value"] / 100)
    elif promo["type"] == "fixed":
        discount = promo["value"]
    
    # Update cart
    cart["discount"] = discount
    cart["total"] = cart["subtotal"] - discount
    cart["promo_code"] = code.upper()
    
    return {
        "success": True,
        "cart": cart,
        "promo": {
            "code": code.upper(),
            "discount": discount,
            "description": promo.get("description")
        }
    }
```

#### 2. Import in Agent Server (`agents/food_concierge_agentserver.py`)

```python
from database import (
    # ... existing imports
    apply_promo_code,  # Add here
)
```

#### 3. Create Tool Function

```python
def build_apply_promo_code_tool() -> function_tool:
    """
    Tool: Apply promo code to cart
    
    Example:
      User: "Apply code SAVE10"
      Agent: apply_promo_code(code="SAVE10")
    """
    @function_tool
    def apply_promo_code_tool(
        ctx: RunContext[UserState],
        code: Annotated[
            str,
            "Promo code to apply (case-insensitive)"
        ],
    ) -> str:
        result = apply_promo_code(code)
        
        # Publish to frontend
        if ctx.room and ctx.room.local_participant:
            ctx.room.local_participant.publish_data(
                json.dumps({
                    "type": "tool_call",
                    "tool_name": "apply_promo_code",
                    "result": result
                })
            )
        
        # Return text for LLM
        if result["success"]:
            promo = result["promo"]
            return f"Applied promo code {promo['code']}. You saved ${promo['discount']:.2f}!"
        else:
            return f"Error: {result['error']}"
    
    return apply_promo_code_tool
```

#### 4. Register Tool in Agent

```python
@server.rtc_session
async def entrypoint(ctx: JobContext):
    # ... setup code
    
    # Build all tools
    tools = [
        # ... existing tools
        build_apply_promo_code_tool(),  # Add here
    ]
    
    # ... rest of setup
```

#### 5. Update SYSTEM_INSTRUCTIONS

```python
SYSTEM_INSTRUCTIONS = """You are a food concierge assistant.

Available tools:
... (existing tools)
- apply_promo_code: Apply a promo code to the cart for discounts

Example: "Apply code SAVE10" → apply_promo_code(code="SAVE10")
"""
```

#### 6. Add Frontend Card Component (`components/food-cards/PromoCodeCard.tsx`)

```tsx
export interface PromoCodeCardProps {
  data: {
    success: boolean;
    cart?: CartSummary;
    promo?: {
      code: string;
      discount: number;
      description?: string;
    };
    error?: string;
  };
}

const PromoCodeCard: React.FC<PromoCodeCardProps> = ({ data }) => {
  if (!data.success) {
    return (
      <BaseCard title="Promo Code Error" accent="red" size="sm">
        <p className="text-red-600">{data.error}</p>
      </BaseCard>
    );
  }
  
  const { promo, cart } = data;
  
  return (
    <BaseCard title="Promo Applied!" accent="green" size="md">
      <CardSection>
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎉</span>
          <div>
            <div className="font-bold text-green-700">
              {promo!.code}
            </div>
            <div className="text-sm text-gray-600">
              {promo!.description}
            </div>
          </div>
        </div>
      </CardSection>
      
      <CardSection title="Savings">
        <CardMetric label="Discount" value={`-$${promo!.discount.toFixed(2)}`} />
        <CardMetric label="New Total" value={`$${cart!.total.toFixed(2)}`} />
      </CardSection>
    </BaseCard>
  );
};
```

#### 7. Add to Frontend Tool Rendering (`app/food/concierge-agentserver/page.tsx`)

```tsx
function renderToolOutput(toolName: string, toolResult: any) {
  switch (toolName) {
    // ... existing cases
    
    case 'apply_promo_code':
    case 'applyPromoCode':
      return <PromoCodeCard data={toolResult} />;
    
    default:
      return <pre>{JSON.stringify(toolResult, null, 2)}</pre>;
  }
}
```

#### 8. Test

```bash
# Start agent
cd agents && source .venv/bin/activate
python food_concierge_agentserver.py dev

# In another terminal, start frontend
npm run dev

# Open browser, connect, say:
"Apply promo code SAVE10"
```

---

## Frontend Patterns

### Message State Management

```tsx
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;           // Text transcript
  toolName?: string;         // Tool that was called
  toolResult?: any;          // Structured result
}

const [messages, setMessages] = useState<ChatMessage[]>([]);

// On STT transcript
function handleTranscript(text: string) {
  setMessages(prev => [...prev, { role: 'user', content: text }]);
}

// On agent response
function handleAgentSpeech(text: string) {
  setMessages(prev => [...prev, { role: 'assistant', content: text }]);
}

// On tool call (from data channel)
function handleToolCall(toolName: string, result: any) {
  setMessages(prev => [...prev, {
    role: 'assistant',
    content: '',
    toolName,
    toolResult: result
  }]);
}
```

### Dynamic Card Rendering

```tsx
function renderMessage(msg: ChatMessage) {
  if (msg.toolName && msg.toolResult) {
    // Render card component
    return renderToolOutput(msg.toolName, msg.toolResult);
  } else {
    // Render text bubble
    return (
      <div className={`message ${msg.role}`}>
        {msg.content}
      </div>
    );
  }
}
```

### Real-Time Badge Updates

```tsx
// State for cart count (from LiveKit data)
const [livekitCartCount, setLivekitCartCount] = useState<number | null>(null);

// State for fallback (from database API)
const [dbCartCount, setDbCartCount] = useState<number>(0);

// Extract count from tool results
function handleDataReceived(payload: Uint8Array) {
  const data = JSON.parse(new TextDecoder().decode(payload));
  
  if (data.type === 'tool_call') {
    const cartTools = ['quick_add_to_cart', 'quick_view_cart', 'remove_from_cart'];
    
    if (cartTools.includes(data.tool_name) && data.result?.cart?.items) {
      const count = data.result.cart.items.reduce(
        (sum, item) => sum + item.quantity,
        0
      );
      setLivekitCartCount(count);
    }
    
    if (data.tool_name === 'quick_checkout') {
      setLivekitCartCount(0);  // Clear on checkout
    }
  }
}

// Use LiveKit count (instant) or fallback to DB
<Header cartCount={livekitCartCount ?? dbCartCount} />
```

### TypeScript Types for Tool Results

**Create matching interfaces** for tool results:

```tsx
// types.ts
export interface RestaurantSearchResult {
  success: boolean;
  restaurants: Restaurant[];
  count: number;
  speechSummary?: string;
}

export interface CartResult {
  success: boolean;
  cart?: {
    items: CartItem[];
    subtotal: number;
    total: number;
  };
  item?: CartItem;
  restaurant?: Restaurant;
  speechSummary?: string;
}

// Use in components
const RestaurantSearchCard: React.FC<{ data: RestaurantSearchResult }> = ({ data }) => {
  // TypeScript will enforce correct data structure
};
```

---

## Development Workflow

### Initial Setup

```bash
# 1. Clone template
git clone <your-template-repo>
cd your-agent-project

# 2. Install dependencies
npm install                     # Frontend
python3 -m venv .venv           # Create Python venv
source .venv/bin/activate       # Activate (macOS/Linux)
# .venv\Scripts\activate         # Windows
pip install -r agents/requirements.txt

# 3. Configure environment
cp env.local.example .env.local
# Edit .env.local with your API keys

# 4. Setup database
# - Go to supabase.com, create project
# - Run supabase/schema.sql in SQL editor
# - Run supabase/seed_data.sql

# 5. Verify setup
npm run dev                     # Should start Next.js on :3000
cd agents && source .venv/bin/activate
python food_concierge_agentserver.py dev  # Should connect to LiveKit
```

### Daily Development

**Option 1: Startup Script** (Recommended)
```bash
./start-dev.sh
# Starts both Next.js and Python agent
# Press Ctrl+C to stop both
```

**Option 2: Manual** (for debugging)
```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Agent
cd agents && source .venv/bin/activate
python food_concierge_agentserver.py dev
```

### Testing

**Voice Testing** (manual):
1. Open http://localhost:3000/food/concierge-agentserver
2. Click "Connect"
3. Click "Start Session"
4. Speak or use sample prompts

**Tool Testing** (scripted):
```bash
# Create test script
cd agents && source .venv/bin/activate
python test_my_tool.py
```

Example test script:
```python
# agents/test_promo_code.py
from database import apply_promo_code, get_voice_cart, add_to_voice_cart

# Setup test cart
add_to_voice_cart("rest-id", "Pizza", 2, 12.99)
add_to_voice_cart("rest-id", "Soda", 1, 2.99)

print("Before promo:")
print(get_voice_cart())

# Apply promo
result = apply_promo_code("SAVE10")
print("\nAfter promo:")
print(result)
```

### Debugging

**Agent Logs**:
```bash
# Verbose output
cd agents && source .venv/bin/activate
python -u food_concierge_agentserver.py dev 2>&1 | tee agent.log

# Check for errors
grep -i "error\|exception" agent.log
```

**Frontend Logs**:
- Open browser DevTools (F12)
- Check Console for errors
- Check Network tab for failed API calls

**LiveKit Dashboard**:
- Go to cloud.livekit.io
- Click your project → Rooms
- See active sessions, participant count, bandwidth usage

**Supabase Dashboard**:
- Go to supabase.com project
- Table Editor: View/edit data
- SQL Editor: Run queries
- Logs: See API requests

### Build & Deploy

**Frontend (Next.js)**:
```bash
npm run build        # Creates .next/ production build
npm start            # Runs production server

# Or deploy to Vercel (recommended)
# - Push to GitHub
# - Connect repo in vercel.com
# - Auto-deploys on push
```

**Agent (Python)**:
```bash
# Deploy to cloud VM (e.g., AWS EC2, GCP Compute Engine)
# 1. SSH into server
# 2. Clone repo
git clone <your-repo>
cd your-agent-projectsource .venv/bin/activate
pip install -r agents/requirements.txt

# 3. Create systemd service
sudo nano /etc/systemd/system/food-agent.service

# [Service]
# WorkingDirectory=/home/ubuntu/your-agent-project/agents
# ExecStart=/home/ubuntu/your-agent-project/.venv/bin/python food_concierge_agentserver.py dev
# Restart=always

sudo systemctl enable food-agent
sudo systemctl start food-agent
```

**Environment Variables**:
- Frontend: Set in Vercel dashboard (Environment Variables)
- Agent: Create `.env` on server (not `.env.local`)

---

## Cloning Checklist

### Phase 1: Project Setup

- [ ] Create new Next.js project: `npx create-next-app@latest`
- [ ] Copy folder structure from template
- [ ] Copy `package.json` dependencies (customize as needed)
- [ ] Copy `agents/requirements.txt`
- [ ] Create `.env.local` from `env.local.example`
- [ ] Setup Git repo: `git init && git add . && git commit -m "Initial commit"`

### Phase 2: Supabase Setup

- [ ] Create Supabase project
- [ ] Copy `supabase/schema.sql` → adapt table names (e.g., `fc_` → `yourdomain_`)
- [ ] Add domain-specific tables (e.g., flights, symptoms, products)
- [ ] Create seed data file
- [ ] Run schema in Supabase SQL editor
- [ ] Run seed data
- [ ] Copy Supabase URL/keys to `.env.local`

### Phase 3: LiveKit Setup

- [ ] Create LiveKit project at cloud.livekit.io
- [ ] Copy LiveKit URL/key/secret to `.env.local`
- [ ] Test token generation: `npm run dev` → visit `/api/livekit-agentserver/token`

### Phase 4: Agent Backend

- [ ] Copy `agents/food_concierge_agentserver.py` → rename (e.g., `travel_assistant_agentserver.py`)
- [ ] Copy `agents/database.py`
- [ ] Update `UserState` dataclass for your domain
- [ ] Update `SYSTEM_INSTRUCTIONS` with your domain knowledge
- [ ] Replace tool functions with your domain tools (see [Tool Creation Pattern](#tool-creation-pattern))
- [ ] Test: `python your_agent_agentserver.py dev`

### Phase 5: Database Layer

- [ ] In `database.py`, update Supabase queries for your tables
- [ ] Define in-memory state structure (e.g., `voice_booking` instead of `voice_cart`)
- [ ] Implement CRUD operations for in-memory state
- [ ] Test with standalone Python script

### Phase 6: Frontend

- [ ] Copy `app/food/concierge-agentserver/page.tsx` → rename folder (e.g., `travel/assistant/`)
- [ ] Update token endpoint path in `LIVEKIT_TOKEN_ENDPOINT`
- [ ] Copy `components/food-cards/` → rename (e.g., `travel-cards/`)
- [ ] Create card components for each tool result
- [ ] Update `renderToolOutput` switch statement with your tool names
- [ ] Copy `components/FoodCourtHeader.tsx` → rename and customize
- [ ] Test: `npm run dev` → visit your page

### Phase 7: TypeScript Types

- [ ] Copy `components/food-cards/types.ts` → rename
- [ ] Define interfaces for your domain entities
- [ ] Define interfaces for tool results (matching Python return values)
- [ ] Update components to use new types

### Phase 8: Styling

- [ ] Copy `app/globals.css` (Tailwind base styles)
- [ ] Copy `tailwind.config.js`
- [ ] Customize colors, fonts, spacing for your brand
- [ ] Update card accents (e.g., `emerald` → your brand color)

### Phase 9: Testing

- [ ] Create test scripts in `scripts/` folder
- [ ] Test database queries independently
- [ ] Test tool functions independently (Python)
- [ ] Test voice conversation end-to-end
- [ ] Test all card components render correctly
- [ ] Test real-time updates (cart badge pattern)

### Phase 10: Polish

- [ ] Update README.md with your project details
- [ ] Add sample prompts specific to your domain
- [ ] Add error handling for common failure cases
- [ ] Add loading states in frontend
- [ ] Add analytics tracking (optional)
- [ ] Create production build: `npm run build`

### Phase 11: Deployment

- [ ] Deploy frontend to Vercel
- [ ] Deploy agent to cloud VM or container
- [ ] Setup environment variables in production
- [ ] Test production deployment
- [ ] Setup monitoring (e.g., Sentry, LogRocket)

---

## Key Learnings from Food Concierge

### What Worked Well

✅ **In-memory + LiveKit data channel**: Instant UI updates without database latency  
✅ **Pydantic schemas on tools**: Eliminated schema validation errors  
✅ **BaseCard component**: Consistent UI across all tool results  
✅ **Duplicate merging in cart**: Better UX than separate entries for same item  
✅ **Snake_case/camelCase handling**: Frontend handles both naming conventions  
✅ **Startup script**: Single command to run everything  
✅ **Test scripts**: Validate tools without full voice session  

### Common Pitfalls

❌ **Missing tool in renderToolOutput**: Tool executes but shows raw JSON  
→ **Fix**: Always add switch case in `renderToolOutput`

❌ **Structure mismatch**: Python returns `{success, cart}`, frontend expects `{cart}`  
→ **Fix**: Use consistent wrapper structure, extract correctly

❌ **Tool name inconsistency**: Python uses `snake_case`, frontend uses `camelCase`  
→ **Fix**: Handle both in switch statement

❌ **Not publishing to data channel**: Tool works but UI doesn't update  
→ **Fix**: Always call `ctx.room.local_participant.publish_data()`

❌ **Cart badge queries database**: Voice agent uses in-memory, badge shows 0  
→ **Fix**: Extract counts from LiveKit data channel

❌ **Missing optional parameters**: Schema validation fails  
→ **Fix**: Use `Literal["null"]` pattern or provide defaults

### Performance Considerations

- **In-memory operations**: < 1ms (instant)
- **Database queries**: 50-200ms (noticeable)
- **STT (Whisper)**: 200-500ms (voice-to-text)
- **LLM (GPT-4)**: 1-3 seconds (thinking)
- **TTS (OpenAI voices)**: 500-1000ms (text-to-speech)
- **Data channel**: < 10ms (real-time)

**Optimization tips**:
1. Use in-memory state for real-time operations
2. Batch database writes (e.g., only on checkout)
3. Cache frequently accessed data (e.g., menu items)
4. Use GPT-4o-mini for faster, cheaper inference (if accuracy allows)
5. Prefetch user profile on session start

---

## Advanced Topics

### Multi-User Support

**Challenge**: Current implementation uses global `voice_cart` variable  
**Solution**: Use session-specific storage

```python
# Instead of global variable
voice_cart: Optional[Dict[str, Any]] = None

# Use session-specific dict
session_carts: Dict[str, Dict[str, Any]] = {}

def get_voice_cart(session_id: str) -> Dict[str, Any]:
    if session_id not in session_carts:
        session_carts[session_id] = {
            "items": [],
            "subtotal": 0.0,
            "total": 0.0
        }
    return {"success": True, "cart": session_carts[session_id]}

# In tool functions
def quick_add_to_cart_tool(ctx: RunContext[UserState], ...):
    session_id = ctx.room.name  # Use room name as session ID
    result = add_to_voice_cart(session_id, ...)
```

### Database Persistence

**When to persist** (choose based on use case):
- **On checkout**: Write in-memory cart to database
- **On session end**: Save session state for recovery
- **Incremental**: Write each tool call (slower, but safer)

```python
def checkout_cart(...) -> Dict[str, Any]:
    global voice_cart
    
    if not voice_cart or not voice_cart["items"]:
        return {"success": False, "error": "Cart is empty"}
    
    # Write to database
    cart_record = supabase.table("fc_carts").insert({
        "profile_id": profile_id,
        "restaurant_id": voice_cart["restaurant_id"],
        "subtotal": voice_cart["subtotal"],
        "total": voice_cart["total"],
        "status": "completed",
    }).execute()
    
    cart_id = cart_record.data[0]["id"]
    
    # Write cart items
    for item in voice_cart["items"]:
        supabase.table("fc_cart_items").insert({
            "cart_id": cart_id,
            "name": item["name"],
            "quantity": item["quantity"],
            "total_price": item["totalPrice"],
        }).execute()
    
    # Clear in-memory cart
    voice_cart = None
    
    return {"success": True, "order_id": cart_id}
```

### Custom STT/TTS Providers

Replace OpenAI with Deepgram, ElevenLabs, Cartesia, etc.:

```python
# agents/requirements.txt
livekit-plugins-deepgram>=0.6.0
livekit-plugins-elevenlabs>=0.1.0

# agents/food_concierge_agentserver.py
from livekit.plugins import deepgram, elevenlabs

agent = Agent(
    vad=silero.VAD.load(),
    stt=deepgram.STT(model="nova-2"),  # Faster STT
    llm=openai.LLM(...),               # Keep LLM
    tts=elevenlabs.TTS(voice="rachel"),  # Better voice quality
)
```

### Adding Authentication

**Supabase Auth** (recommended):

```typescript
// app/api/livekit-agentserver/token/route.ts
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  // Get user from session
  const supabase = createClient(...);
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Generate token with user identity
  const token = new AccessToken(..., { identity: user.id });
  // ...
}
```

### Analytics & Monitoring

**Track tool usage**:

```python
def build_search_tool():
    @function_tool
    def search_tool(ctx: RunContext[UserState], query: str):
        # Track tool call
        supabase.table("tool_usage_logs").insert({
            "user_id": ctx.userdata.user_id,
            "tool_name": "search",
            "query": query,
            "timestamp": datetime.utcnow().isoformat()
        }).execute()
        
        # ... rest of tool logic
```

**Track session metrics**:
- Session duration
- Tool call count
- Success/error rates
- User satisfaction (post-session survey)

---

## FAQ

### Q: Can I use this without LiveKit?
**A:** No. LiveKit provides the voice infrastructure (STT, TTS, real-time audio). You'd need to replace with another solution like Twilio, Agora, or custom WebRTC.

### Q: Can I use a different database instead of Supabase?
**A:** Yes. Replace Supabase client with any PostgreSQL, MySQL, MongoDB, etc. The pattern stays the same.

### Q: How much does it cost to run?
**A:**
- LiveKit: Free tier → 10k participant minutes/month, then ~$0.005/min
- Supabase: Free tier → 500MB DB, 2GB bandwidth, then $25/month
- OpenAI GPT-4: ~$0.01-0.03 per conversation
- **Total**: ~$0.01-0.05 per user session

### Q: Can I use GPT-3.5 instead of GPT-4?
**A:** Yes, but quality drops significantly. GPT-4 is much better at:
- Understanding complex, conversational queries
- Making correct tool decisions
- Following instructions precisely

### Q: Can I deploy the agent to Vercel?
**A:** No. Vercel has 10-second timeout for serverless functions. The agent needs to run continuously. Deploy to:
- AWS EC2, GCP Compute Engine, Azure VM
- Fly.io, Railway, Render (PaaS)
- Docker container on Kubernetes

### Q: How do I handle multiple languages?
**A:** OpenAI Whisper (STT) and GPT-4 (LLM) support 50+ languages automatically. Just update SYSTEM_INSTRUCTIONS:
```python
SYSTEM_INSTRUCTIONS = """You are a food concierge. Respond in the user's language."""
```

### Q: Can I use Anthropic Claude instead of OpenAI?
**A:** Not yet (as of Feb 2026). LiveKit agents SDK supports OpenAI, Groq, Together AI. Claude support is planned.

### Q: How do I prevent the agent from making incorrect tool calls?
**A:**
1. Write detailed tool docstrings
2. Provide examples in SYSTEM_INSTRUCTIONS
3. Use constrained parameters (Literal types)
4. Test edge cases and update instructions

### Q: Can I integrate with Stripe for payments?
**A:** Yes! Add checkout webhook:
```typescript
// app/api/checkout/route.ts
import Stripe from 'stripe';

export async function POST(request: Request) {
  const { cartId } = await request.json();
  
  // Get cart from Supabase
  const cart = await supabase.from('fc_carts').select('*').eq('id', cartId);
  
  // Create Stripe checkout session
  const session = await stripe.checkout.sessions.create({
    line_items: cart.items.map(item => ({ /* ... */ })),
    mode: 'payment',
    success_url: `${request.headers.get('origin')}/success`,
    cancel_url: `${request.headers.get('origin')}/cart`,
  });
  
  return NextResponse.json({ url: session.url });
}
```

---

## Support & Resources

### Official Documentation
- **LiveKit Agents**: https://docs.livekit.io/agents/
- **Supabase**: https://supabase.com/docs
- **Next.js**: https://nextjs.org/docs
- **OpenAI**: https://platform.openai.com/docs

### Community
- **LiveKit Discord**: https://livekit.io/discord
- **Supabase Discord**: https://discord.supabase.com
- **GitHub Discussions**: (your repo discussions)

### Example Projects
- **LiveKit Drive-Thru Example**: `/livekit-reference/agents/examples/drive-thru/`
- **Food Concierge (this project)**: Full implementation reference

---

## Version History

- **v1.0** (Feb 2026): Initial template based on Food Concierge project
  - AgentServer pattern (v1.4.1+)
  - In-memory + database dual state
  - LiveKit data channel for real-time UI
  - 9 tools with full CRUD cart operations
  - Card components with BaseCard pattern
  - Comprehensive documentation

---

## License

Template based on UberEats AI Food Concierge project.  
Adapt freely for your use case. Attribution appreciated but not required.

---

**Happy Building! 🚀**

Questions? Open an issue or discussion in the repo.
