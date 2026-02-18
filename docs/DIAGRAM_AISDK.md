# AI SDK Architecture Diagram - Food Court Concierge

## Overview

This document explains how the **AI SDK framework** powers the Food Court Concierge chat experience. It covers the complete flow from user requests to database operations, showing how AI SDK, OpenAI, and Supabase work together.

**Target Audience**: Beginner to Intermediate developers
**Implementation**: `/app/api/food-chat`

---

## High-Level Architecture

```
┌──────────────┐
│   User UI    │  (Chat Interface)
│  React App   │
└──────┬───────┘
       │ HTTP POST (messages)
       ▼
┌─────────────────────────────────────────────────────────┐
│  /app/api/food-chat/route.ts                            │
│  - AI SDK Entry Point                                   │
│  - Processes messages                                   │
│  - Streams responses                                    │
└──────┬──────────────────────────────────────────────────┘
       │
       ├──────► System Prompt (conversation context)
       │
       ├──────► OpenAI API (gpt-4o-mini)
       │        └─► AI SDK manages the connection
       │
       └──────► Food Tools (AI SDK tool definitions)
                └─► Supabase Database Operations
                    └─► Returns structured results
```

---

## Core Components

### 1. Request Flow

```
User Message "Show me Thai restaurants"
       │
       ▼
┌─────────────────────────────────────────────┐
│  POST /api/food-chat                        │
│                                             │
│  1. Receive messages array                  │
│  2. Create UI message stream                │
│  3. Process tool calls from history         │
│  4. Convert to model format                 │
│  5. Call streamText() with OpenAI           │
└─────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│  AI SDK streamText()                        │
│                                             │
│  • Model: openai('gpt-4o-mini')            │
│  • Messages: conversation history           │
│  • Tools: foodTools object                  │
│  • System Prompt: concierge instructions    │
└─────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│  OpenAI API                                 │
│                                             │
│  • Processes natural language               │
│  • Decides which tool to call               │
│  • Returns tool call requests OR text       │
└─────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│  Tool Execution (if needed)                 │
│                                             │
│  • AI SDK invokes the requested tool        │
│  • Tool interacts with Supabase             │
│  • Returns structured JSON result           │
└─────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│  Stream Response to User                    │
│                                             │
│  • AI SDK converts to UI stream             │
│  • Real-time updates to frontend            │
│  • Includes text + tool results             │
└─────────────────────────────────────────────┘
```

---

## AI SDK Tool System

### Tool Definition Pattern

Every tool follows this AI SDK pattern:

```typescript
tool({
  description: "What this tool does (AI uses this)",
  inputSchema: z.object({ /* Zod validation */ }),
  outputSchema: z.string(),
  async execute({ params }) {
    // 1. Validate inputs
    // 2. Query Supabase
    // 3. Process data
    // 4. Return JSON string with:
    //    - success status
    //    - data payload
    //    - speechSummary (for voice)
  }
})
```

---

## Food Ordering Flow - Detailed

### Action 1: Get Stores (Search Restaurants)

```
User: "Show me Thai restaurants nearby"
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│  AI SDK Flow                                             │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  1. OpenAI receives: "Show me Thai restaurants nearby"   │
│     └─► Analyzes intent                                  │
│     └─► Decides to call: searchRestaurants               │
│                                                          │
│  2. AI SDK extracts parameters:                          │
│     {                                                    │
│       cuisine: "thai",                                   │
│       limit: 5,                                          │
│       useDefaultLocation: true                           │
│     }                                                    │
│                                                          │
│  3. Tool Execution:                                      │
│     └─► searchRestaurants.execute()                      │
│         └─► Calls Supabase                               │
└──────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│  Supabase Query                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  SELECT * FROM fc_restaurants                            │
│  WHERE cuisine = 'Thai'                                  │
│    AND is_active = true                                  │
│  ORDER BY closes_at ASC                                  │
│  LIMIT 5;                                                │
│                                                          │
│  Returns: Array of restaurant records                    │
│  [                                                       │
│    {                                                     │
│      id: "uuid",                                         │
│      name: "Bangkok Express",                            │
│      cuisine: "Thai",                                    │
│      rating: 4.5,                                        │
│      eta_minutes: 25,                                    │
│      delivery_fee: 2.99                                  │
│    },                                                    │
│    ...                                                   │
│  ]                                                       │
└──────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│  Tool Returns JSON                                       │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  JSON.stringify({                                        │
│    filters: { cuisine: "thai", ... },                   │
│    results: [...5 restaurants...],                       │
│    speechSummary: "Found 5 Thai restaurants nearby."     │
│  })                                                      │
└──────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│  OpenAI generates natural response                       │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  "I found 5 great Thai restaurants for you:             │
│   1. Bangkok Express - 4.5★, 25 min, $2.99 delivery     │
│   2. Thai Orchid - 4.7★, 30 min, free delivery          │
│   ..."                                                   │
│                                                          │
│  AI SDK streams this to the user in real-time            │
└──────────────────────────────────────────────────────────┘
```

**Key Supabase Tables**:
- `fc_restaurants` - Main restaurant data
- `fc_preferences` - User location preferences

**AI SDK References**:
- `tool()` - Tool definition
- `z.object()` - Input validation (Zod)
- `streamText()` - Response streaming

**OpenAI Call**:
- Model: `gpt-4o-mini`
- Function calling to determine tool usage
- Natural language generation for responses

---

### Action 2: Get Store Menu

```
User selects: "Show me the Bangkok Express menu"
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│  AI SDK Flow                                             │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  1. OpenAI interprets: "Show Bangkok Express menu"       │
│     └─► Tool: getRestaurantMenu                          │
│     └─► Params: { restaurantSlug: "bangkok-express" }    │
│                                                          │
│  2. Tool execution queries Supabase                      │
└──────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│  Supabase Queries (Multi-step)                           │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Step 1: Resolve restaurant                              │
│  ──────────────────────────────────────────────          │
│  SELECT id, slug, name                                   │
│  FROM fc_restaurants                                     │
│  WHERE slug ILIKE 'bangkok-express'                      │
│  LIMIT 1;                                                │
│                                                          │
│  Returns: { id: "abc-123", name: "Bangkok Express" }     │
│                                                          │
│  Step 2: Fetch menu with items                           │
│  ──────────────────────────────────────────────          │
│  SELECT * FROM fc_menu_sections_with_items               │
│  WHERE restaurant_id = 'abc-123'                         │
│  ORDER BY section_position ASC;                          │
│                                                          │
│  Returns: Structured menu data                           │
│  [                                                       │
│    {                                                     │
│      section_id: "uuid",                                 │
│      section_title: "Appetizers",                        │
│      section_position: 0,                                │
│      items: [                                            │
│        {                                                 │
│          id: "uuid",                                     │
│          name: "Spring Rolls",                           │
│          base_price: 6.99,                               │
│          description: "Fresh vegetables...",             │
│          tags: ["vegetarian"],                           │
│          calories: 180                                   │
│        },                                                │
│        ...                                               │
│      ]                                                   │
│    },                                                    │
│    {                                                     │
│      section_title: "Main Courses",                      │
│      items: [...]                                        │
│    }                                                     │
│  ]                                                       │
└──────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│  Tool Response                                           │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  {                                                       │
│    restaurant: { id, slug, name },                       │
│    sections: [...menu sections with items...],           │
│    speechSummary: "Here are 4 menu sections at           │
│                    Bangkok Express. Spring Rolls         │
│                    available for $6.99."                 │
│  }                                                       │
└──────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│  OpenAI Response                                         │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  "Here's the Bangkok Express menu:                       │
│                                                          │
│   **Appetizers**                                         │
│   • Spring Rolls - $6.99 (vegetarian)                    │
│   • Tom Yum Soup - $8.99                                 │
│                                                          │
│   **Main Courses**                                       │
│   • Pad Thai - $14.99                                    │
│   • Green Curry - $15.99                                 │
│   ..."                                                   │
└──────────────────────────────────────────────────────────┘
```

**Key Supabase Tables**:
- `fc_restaurants` - Restaurant lookup
- `fc_menu_sections` - Menu organization
- `fc_menu_items` - Individual dishes
- `fc_menu_sections_with_items` - View joining sections + items

**AI SDK References**:
- `inputSchema` with `.refine()` - Complex validation
- `resolveRestaurantIdentifier()` - Helper function
- Async execution pattern

---

### Action 3: Get Menu Items (Search)

```
User: "Show me vegetarian dishes under $12"
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│  AI SDK Flow                                             │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  1. OpenAI extracts search criteria:                     │
│     └─► Tool: searchMenuItems                            │
│     └─► Params: {                                        │
│           tags: ["vegetarian"],                          │
│           maxPrice: 12,                                  │
│           restaurantId: "abc-123",  // if context exists │
│           limit: 20                                      │
│         }                                                │
└──────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│  Supabase Query with Filters                             │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  SELECT                                                  │
│    mi.id,                                                │
│    mi.slug,                                              │
│    mi.name,                                              │
│    mi.description,                                       │
│    mi.base_price,                                        │
│    mi.tags,                                              │
│    mi.calories,                                          │
│    mi.rating,                                            │
│    mi.image,                                             │
│    s.title as section_title,                             │
│    r.id as restaurant_id,                                │
│    r.name as restaurant_name                             │
│  FROM fc_menu_items mi                                   │
│  LEFT JOIN fc_menu_sections s ON mi.section_id = s.id    │
│  LEFT JOIN fc_restaurants r ON mi.restaurant_id = r.id   │
│  WHERE mi.is_available = true                            │
│    AND mi.base_price <= 12                               │
│    AND mi.tags @> ARRAY['vegetarian']                    │
│    AND mi.restaurant_id = 'abc-123'                      │
│  ORDER BY mi.position ASC                                │
│  LIMIT 20;                                               │
│                                                          │
│  Returns: Filtered menu items                            │
└──────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│  Tool Response                                           │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  {                                                       │
│    restaurant: { id, name },                             │
│    filters: {                                            │
│      maxPrice: 12,                                       │
│      tags: ["vegetarian"]                                │
│    },                                                    │
│    results: [                                            │
│      {                                                   │
│        id: "uuid",                                       │
│        name: "Spring Rolls",                             │
│        price: 6.99,                                      │
│        tags: ["vegetarian", "appetizer"],                │
│        sectionTitle: "Appetizers"                        │
│      },                                                  │
│      {                                                   │
│        name: "Vegetable Pad Thai",                       │
│        price: 11.99,                                     │
│        tags: ["vegetarian", "main"],                     │
│        sectionTitle: "Main Courses"                      │
│      }                                                   │
│    ],                                                    │
│    speechSummary: "I found 2 vegetarian items            │
│                    under $12.00 at Bangkok Express."     │
│  }                                                       │
└──────────────────────────────────────────────────────────┘
```

**Key Supabase Tables**:
- `fc_menu_items` - All menu items with filters
- Uses PostgreSQL array operators for tag matching

**AI SDK References**:
- Array input validation with Zod
- Filter chaining in tool logic
- Fallback to sample data if DB unavailable

---

### Action 4: Add Item to Cart

```
User: "Add the Pad Thai to my cart"
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│  AI SDK Flow                                             │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  1. OpenAI identifies:                                   │
│     └─► Tool: addItemToCart                              │
│     └─► Params: {                                        │
│           restaurantSlug: "bangkok-express",             │
│           menuItemSlug: "pad-thai",                      │
│           quantity: 1                                    │
│         }                                                │
│                                                          │
│  2. Tool execution (multi-step):                         │
│     a) Resolve restaurant ID                             │
│     b) Resolve menu item ID                              │
│     c) Ensure active cart exists                         │
│     d) Add item to cart                                  │
│     e) Recalculate subtotal                              │
└──────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│  Supabase Operations (Transaction-like)                  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Step 1: Resolve menu item                               │
│  ──────────────────────────────────────────────          │
│  SELECT id, slug, name, base_price, restaurant_id        │
│  FROM fc_menu_items                                      │
│  WHERE slug ILIKE 'pad-thai'                             │
│    AND restaurant_id = 'abc-123'                         │
│  LIMIT 1;                                                │
│                                                          │
│  Returns: {                                              │
│    id: "item-456",                                       │
│    name: "Pad Thai",                                     │
│    base_price: 14.99                                     │
│  }                                                       │
│                                                          │
│  Step 2: Ensure active cart                              │
│  ──────────────────────────────────────────────          │
│  SELECT id FROM fc_carts                                 │
│  WHERE profile_id = 'demo-profile-id'                    │
│    AND restaurant_id = 'abc-123'                         │
│    AND status = 'active'                                 │
│  ORDER BY updated_at DESC                                │
│  LIMIT 1;                                                │
│                                                          │
│  If NOT EXISTS:                                          │
│    INSERT INTO fc_carts (                                │
│      profile_id,                                         │
│      restaurant_id,                                      │
│      status,                                             │
│      subtotal                                            │
│    ) VALUES (                                            │
│      'demo-profile-id',                                  │
│      'abc-123',                                          │
│      'active',                                           │
│      0                                                   │
│    )                                                     │
│    RETURNING id;                                         │
│                                                          │
│  Returns: { id: "cart-789", created: true }              │
│                                                          │
│  Step 3: Add item to cart                                │
│  ──────────────────────────────────────────────          │
│  INSERT INTO fc_cart_items (                             │
│    cart_id,                                              │
│    menu_item_id,                                         │
│    quantity,                                             │
│    base_price,                                           │
│    total_price,                                          │
│    instructions                                          │
│  ) VALUES (                                              │
│    'cart-789',                                           │
│    'item-456',                                           │
│    1,                                                    │
│    14.99,                                                │
│    14.99,                                                │
│    NULL                                                  │
│  )                                                       │
│  RETURNING id;                                           │
│                                                          │
│  Step 4: Update cart subtotal                            │
│  ──────────────────────────────────────────────          │
│  UPDATE fc_carts                                         │
│  SET subtotal = (                                        │
│    SELECT SUM(total_price)                               │
│    FROM fc_cart_items                                    │
│    WHERE cart_id = 'cart-789'                            │
│  ),                                                      │
│  updated_at = NOW()                                      │
│  WHERE id = 'cart-789';                                  │
└──────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│  Tool Response                                           │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  {                                                       │
│    success: true,                                        │
│    cartId: "cart-789",                                   │
│    createdCart: true,                                    │
│    itemId: "cart-item-101",                              │
│    restaurant: { id, slug, name },                       │
│    item: {                                               │
│      id: "item-456",                                     │
│      name: "Pad Thai",                                   │
│      quantity: 1,                                        │
│      linePrice: 14.99                                    │
│    },                                                    │
│    subtotal: 14.99,                                      │
│    cart: { /* full cart summary */ },                    │
│    speechSummary: "Added 1 Pad Thai to your cart.        │
│                    You now have 1 item totaling $14.99." │
│  }                                                       │
└──────────────────────────────────────────────────────────┘
```

**Key Supabase Tables**:
- `fc_carts` - Shopping cart records
- `fc_cart_items` - Items within carts
- `fc_menu_items` - Reference for pricing
- `fc_cart_item_options` - For customizations (optional)

**AI SDK References**:
- Complex `.refine()` validation (requires either ID or slug)
- Multi-step async operations
- Error handling and fallback messages
- Cart creation on-the-fly

**OpenAI Integration**:
- Context awareness (remembers previous restaurant)
- Natural language item matching
- Quantity inference from phrasing

---

### Action 5: Process Order from Cart

```
User: "Place my order" or "Check out"
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│  AI SDK Flow                                             │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  1. OpenAI recognizes checkout intent:                   │
│     └─► Tool: submitCartOrder                            │
│     └─► Params: {                                        │
│           cartId: "cart-789",  // or inferred            │
│           restaurantId: "abc-123"                        │
│         }                                                │
│                                                          │
│  2. Tool converts cart to order                          │
└──────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│  Supabase Order Processing                               │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Step 1: Find active cart                                │
│  ──────────────────────────────────────────────          │
│  SELECT id, restaurant_id, subtotal                      │
│  FROM fc_carts                                           │
│  WHERE profile_id = 'demo-profile-id'                    │
│    AND status = 'active'                                 │
│    AND restaurant_id = 'abc-123'                         │
│  ORDER BY updated_at DESC                                │
│  LIMIT 1;                                                │
│                                                          │
│  Step 2: Fetch cart items                                │
│  ──────────────────────────────────────────────          │
│  SELECT                                                  │
│    ci.id,                                                │
│    ci.quantity,                                          │
│    ci.total_price,                                       │
│    mi.name,                                              │
│    mi.base_price                                         │
│  FROM fc_cart_items ci                                   │
│  JOIN fc_menu_items mi ON ci.menu_item_id = mi.id        │
│  WHERE ci.cart_id = 'cart-789';                          │
│                                                          │
│  Step 3: Create order record                             │
│  ──────────────────────────────────────────────          │
│  INSERT INTO fc_orders (                                 │
│    profile_id,                                           │
│    restaurant_id,                                        │
│    cart_id,                                              │
│    subtotal,                                             │
│    delivery_fee,                                         │
│    tax,                                                  │
│    total,                                                │
│    status,                                               │
│    payment_status                                        │
│  )                                                       │
│  SELECT                                                  │
│    'demo-profile-id',                                    │
│    restaurant_id,                                        │
│    id,                                                   │
│    subtotal,                                             │
│    2.99,                    -- delivery_fee              │
│    subtotal * 0.08,         -- tax (8%)                  │
│    subtotal + 2.99 + (subtotal * 0.08),  -- total        │
│    'pending',                                            │
│    'unpaid'                                              │
│  FROM fc_carts                                           │
│  WHERE id = 'cart-789'                                   │
│  RETURNING id;                                           │
│                                                          │
│  Step 4: Copy cart items to order items                  │
│  ──────────────────────────────────────────────          │
│  INSERT INTO fc_order_items (                            │
│    order_id,                                             │
│    menu_item_id,                                         │
│    quantity,                                             │
│    base_price,                                           │
│    total_price                                           │
│  )                                                       │
│  SELECT                                                  │
│    'order-999',              -- new order_id             │
│    menu_item_id,                                         │
│    quantity,                                             │
│    base_price,                                           │
│    total_price                                           │
│  FROM fc_cart_items                                      │
│  WHERE cart_id = 'cart-789';                             │
│                                                          │
│  Step 5: Mark cart as submitted                          │
│  ──────────────────────────────────────────────          │
│  UPDATE fc_carts                                         │
│  SET status = 'submitted',                               │
│      updated_at = NOW()                                  │
│  WHERE id = 'cart-789';                                  │
└──────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│  Tool Response                                           │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  {                                                       │
│    success: true,                                        │
│    orderId: "order-999",                                 │
│    restaurant: {                                         │
│      id: "abc-123",                                      │
│      name: "Bangkok Express",                            │
│      cuisine: "Thai",                                    │
│      rating: 4.5,                                        │
│      etaMinutes: 25,                                     │
│      deliveryFee: 2.99                                   │
│    },                                                    │
│    total: 17.98,          // subtotal + delivery + tax   │
│    itemCount: 1,                                         │
│    estimatedDeliveryTime: "7:45 PM",                     │
│    speechSummary: "Great, I locked in 1 item for         │
│                    $14.99. Your order has been           │
│                    confirmed!"                           │
│  }                                                       │
└──────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│  OpenAI Final Response                                   │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  "Perfect! Your order is confirmed. 🎉                   │
│                                                          │
│   **Order #999**                                         │
│   Bangkok Express                                        │
│   • Pad Thai x1 - $14.99                                 │
│                                                          │
│   Subtotal: $14.99                                       │
│   Delivery: $2.99                                        │
│   Tax: $1.20                                             │
│   **Total: $17.98**                                      │
│                                                          │
│   Estimated delivery: 7:45 PM (25 minutes)"              │
└──────────────────────────────────────────────────────────┘
```

**Key Supabase Tables**:
- `fc_carts` - Active cart (marked as 'submitted')
- `fc_cart_items` - Cart line items
- `fc_orders` - New order record created
- `fc_order_items` - Copy of cart items for order history

**AI SDK References**:
- Complex transaction-like flow
- Error handling at each step
- Order calculations (tax, fees, total)
- Status transitions (cart → order)

---

## Complete System Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER INTERACTION                            │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│  /app/api/food-chat/route.ts                                        │
│  ═══════════════════════════                                        │
│                                                                     │
│  export async function POST(req: Request) {                         │
│    const { messages } = await req.json();                           │
│    const stream = createUIMessageStream({                           │
│      originalMessages: messages,                                    │
│      execute: async ({ writer }) => {                               │
│        // Process tool calls                                        │
│        const processedMessages = await processToolCalls({           │
│          messages, writer, tools: foodTools                         │
│        });                                                           │
│                                                                     │
│        // Add system prompt                                         │
│        modelMessages.unshift({                                      │
│          role: 'system',                                            │
│          content: systemPrompt                                      │
│        });                                                           │
│                                                                     │
│        // Stream response from OpenAI                               │
│        const result = streamText({                                  │
│          model: openai('gpt-4o-mini'),      ◄─── OpenAI API         │
│          messages: modelMessages,                                   │
│          tools: foodTools                   ◄─── Tool definitions   │
│        });                                                           │
│                                                                     │
│        writer.merge(result.toUIMessageStream());                    │
│      }                                                               │
│    });                                                               │
│    return createUIMessageStreamResponse({ stream });                │
│  }                                                                   │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│  OpenAI API                                                         │
│  ═══════════                                                        │
│                                                                     │
│  Input:                                                             │
│  • Model: gpt-4o-mini                                               │
│  • Messages: Conversation history + system prompt                   │
│  • Functions: Tool definitions from foodTools                       │
│                                                                     │
│  Processing:                                                        │
│  1. Analyze user intent                                             │
│  2. Decide: Text response OR Tool call                              │
│  3. If tool call:                                                   │
│     - Select appropriate tool                                       │
│     - Extract parameters from natural language                      │
│     - Return tool call request                                      │
│                                                                     │
│  Output:                                                            │
│  • Tool call request, OR                                            │
│  • Natural language text response                                   │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
                    ▼                 ▼
          ┌─────────────────┐  ┌──────────────┐
          │  Text Response  │  │  Tool Call   │
          └─────────────────┘  └──────┬───────┘
                    │                 │
                    │                 ▼
                    │    ┌────────────────────────────────────┐
                    │    │  /app/api/food-chat/tools.ts       │
                    │    │  ══════════════════════════════     │
                    │    │                                    │
                    │    │  export const foodTools = {        │
                    │    │    getUserContext: tool({...}),    │
                    │    │    searchRestaurants: tool({...}), │
                    │    │    getRestaurantMenu: tool({...}), │
                    │    │    searchMenuItems: tool({...}),   │
                    │    │    addItemToCart: tool({...}),     │
                    │    │    viewCart: tool({...}),          │
                    │    │    submitCartOrder: tool({...}),   │
                    │    │    ...                             │
                    │    │  }                                 │
                    │    └────────────┬───────────────────────┘
                    │                 │
                    │                 ▼
                    │    ┌────────────────────────────────────┐
                    │    │  Tool Execution                    │
                    │    │  ══════════════                    │
                    │    │                                    │
                    │    │  1. Validate input (Zod schema)    │
                    │    │  2. Query Supabase database        │
                    │    │  3. Process & format results       │
                    │    │  4. Return JSON string with:       │
                    │    │     - success status               │
                    │    │     - data payload                 │
                    │    │     - speechSummary (voice)        │
                    │    └────────────┬───────────────────────┘
                    │                 │
                    │                 ▼
                    │    ┌────────────────────────────────────┐
                    │    │  Supabase Database                 │
                    │    │  ═════════════════                 │
                    │    │                                    │
                    │    │  Tables:                           │
                    │    │  • fc_restaurants                  │
                    │    │  • fc_menu_sections                │
                    │    │  • fc_menu_items                   │
                    │    │  • fc_carts                        │
                    │    │  • fc_cart_items                   │
                    │    │  • fc_orders                       │
                    │    │  • fc_order_items                  │
                    │    │  • fc_preferences                  │
                    │    │                                    │
                    │    │  Returns: Structured data          │
                    │    └────────────┬───────────────────────┘
                    │                 │
                    │                 │ Tool Result (JSON)
                    │                 │
                    └─────────────────┴─────────────────┐
                                      │                 │
                                      ▼                 │
                    ┌─────────────────────────────────────────┐
                    │  Back to OpenAI                         │
                    │  ══════════════                         │
                    │                                         │
                    │  • Receives tool result                 │
                    │  • Generates natural language response  │
                    │  • Incorporates data into conversation  │
                    └─────────────────┬───────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│  AI SDK Stream Response                                             │
│  ══════════════════════════                                         │
│                                                                     │
│  • toUIMessageStream() converts to UI format                        │
│  • Real-time streaming to frontend                                  │
│  • Includes both text and tool result data                          │
│  • User sees progressive updates                                    │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│  USER SEES RESPONSE                                                 │
│  • Natural language message                                         │
│  • Structured data (restaurant cards, menu items, cart)             │
│  • Real-time updates as AI processes                                │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Key AI SDK Concepts

### 1. **Tool Definition**

```typescript
import { tool } from 'ai';
import { z } from 'zod';

export const myTool = tool({
  description: 'What this tool does - AI reads this to decide when to use it',
  
  inputSchema: z.object({
    param1: z.string(),
    param2: z.number().optional()
  }),
  
  outputSchema: z.string(), // Always return JSON string
  
  async execute({ param1, param2 }) {
    // Your logic here
    const result = await queryDatabase(param1);
    
    return JSON.stringify({
      success: true,
      data: result,
      speechSummary: 'Human-friendly summary for voice'
    });
  }
});
```

**How it works:**
- AI SDK automatically exposes tools to OpenAI as "functions"
- OpenAI decides when to call each tool based on `description`
- AI SDK validates inputs against `inputSchema` (Zod)
- Your `execute` function runs and returns JSON
- Result goes back to OpenAI for natural response generation

### 2. **Stream Text**

```typescript
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

const result = streamText({
  model: openai('gpt-4o-mini'),  // Which OpenAI model
  messages: conversationHistory,  // Array of messages
  tools: foodTools,               // Available tools
  temperature: 0.7,               // Optional: creativity
  maxTokens: 2000                 // Optional: response length
});
```

**Stream benefits:**
- Real-time responses (text appears as it's generated)
- Better UX for long responses
- Tool calls happen inline during streaming
- Can cancel mid-stream if needed

### 3. **UI Message Stream**

```typescript
import { createUIMessageStream, createUIMessageStreamResponse } from 'ai';

const stream = createUIMessageStream({
  originalMessages: messages,
  execute: async ({ writer }) => {
    // Your logic
    const result = streamText({ ... });
    writer.merge(result.toUIMessageStream());
  }
});

return createUIMessageStreamResponse({ stream });
```

**Purpose:**
- Converts AI responses to UI-friendly format
- Handles tool results display
- Manages message state
- Works seamlessly with Vercel's `useChat()` hook

---

## Supabase Database Schema

### Core Tables

```sql
-- Restaurants
fc_restaurants
  - id (uuid, primary key)
  - name (text)
  - slug (text, unique)
  - cuisine (text)
  - cuisine_group (text)
  - rating (numeric)
  - eta_minutes (integer)
  - closes_at (timestamptz)
  - delivery_fee (numeric)
  - dietary_tags (text[])
  - is_active (boolean)

-- Menu Sections
fc_menu_sections
  - id (uuid, primary key)
  - restaurant_id (uuid, foreign key)
  - slug (text)
  - title (text)
  - description (text)
  - position (integer)

-- Menu Items
fc_menu_items
  - id (uuid, primary key)
  - restaurant_id (uuid, foreign key)
  - section_id (uuid, foreign key)
  - slug (text)
  - name (text)
  - description (text)
  - base_price (numeric)
  - tags (text[])
  - calories (integer)
  - is_available (boolean)
  - image (text)

-- Carts
fc_carts
  - id (uuid, primary key)
  - profile_id (uuid, foreign key)
  - restaurant_id (uuid, foreign key)
  - status (text: 'active', 'submitted', 'abandoned')
  - subtotal (numeric)
  - created_at (timestamptz)
  - updated_at (timestamptz)

-- Cart Items
fc_cart_items
  - id (uuid, primary key)
  - cart_id (uuid, foreign key)
  - menu_item_id (uuid, foreign key)
  - quantity (integer)
  - base_price (numeric)
  - total_price (numeric)
  - instructions (text)

-- Orders
fc_orders
  - id (uuid, primary key)
  - profile_id (uuid, foreign key)
  - restaurant_id (uuid, foreign key)
  - cart_id (uuid, foreign key)
  - subtotal (numeric)
  - delivery_fee (numeric)
  - tax (numeric)
  - total (numeric)
  - status (text: 'pending', 'confirmed', 'preparing', 'delivered')
  - payment_status (text: 'unpaid', 'paid', 'refunded')
  - created_at (timestamptz)

-- User Preferences
fc_preferences
  - id (uuid, primary key)
  - profile_id (uuid, foreign key)
  - favorite_cuisines (text[])
  - disliked_cuisines (text[])
  - dietary_tags (text[])
  - spice_level (text)
  - budget_range (text)
  - default_location (jsonb)
```

---

## OpenAI Integration Details

### Function Calling Flow

1. **Tool Registration**
   - AI SDK converts `tool()` definitions to OpenAI function schemas
   - Each tool becomes a "function" OpenAI can call
   - `description` field is critical for AI decision-making

2. **Decision Process**
   ```
   User: "Show me Thai restaurants"
   
   OpenAI thinks:
   - "Thai restaurants" → needs restaurant search
   - Check available functions
   - Find: searchRestaurants
   - Extract params: { cuisine: "thai" }
   - Return function call request
   ```

3. **Execution**
   - AI SDK intercepts function call
   - Validates params against Zod schema
   - Runs `execute()` function
   - Returns result to OpenAI

4. **Response Generation**
   - OpenAI receives tool result
   - Generates natural language incorporating data
   - Streams response to user

### Model Configuration

```typescript
model: openai('gpt-4o-mini')
```

**Why gpt-4o-mini:**
- Fast responses (good for chat)
- Cost-effective
- Strong function calling support
- Good at structured data extraction

**Alternatives:**
- `gpt-4o` - More capable, slower, costlier
- `gpt-4-turbo` - Balanced option
- `gpt-3.5-turbo` - Faster, less capable

---

## Error Handling Patterns

### Tool-Level Error Handling

```typescript
async execute({ param }) {
  try {
    if (!supabase) {
      return JSON.stringify({
        success: false,
        message: 'Database not configured',
        speechSummary: 'I need database access to do that.'
      });
    }
    
    const data = await supabase.from('table').select();
    
    if (data.error) {
      throw data.error;
    }
    
    return JSON.stringify({
      success: true,
      data: data.data,
      speechSummary: 'Found results!'
    });
    
  } catch (error) {
    console.error('[tool-name] error:', error);
    return JSON.stringify({
      success: false,
      message: 'Something went wrong',
      speechSummary: 'I had trouble with that request.'
    });
  }
}
```

### Route-Level Error Handling

```typescript
export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    // ... processing
    return createUIMessageStreamResponse({ stream });
    
  } catch (error) {
    console.error('[food-chat] Route error:', error);
    return new Response(
      JSON.stringify({ error: String(error) }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
```

---

## Performance Considerations

### Database Optimization

1. **Use Views for Complex Joins**
   ```sql
   CREATE VIEW fc_menu_sections_with_items AS
   SELECT 
     s.*,
     jsonb_agg(i.*) as items
   FROM fc_menu_sections s
   LEFT JOIN fc_menu_items i ON i.section_id = s.id
   GROUP BY s.id;
   ```

2. **Index Common Queries**
   ```sql
   CREATE INDEX idx_restaurants_cuisine ON fc_restaurants(cuisine);
   CREATE INDEX idx_menu_items_restaurant ON fc_menu_items(restaurant_id);
   CREATE INDEX idx_carts_profile_status ON fc_carts(profile_id, status);
   ```

3. **Limit Results**
   ```typescript
   .limit(10)  // Always limit queries
   ```

### AI SDK Optimization

1. **Streaming** - Use `streamText()` for real-time responses
2. **Context Management** - Keep conversation history reasonable
3. **Tool Descriptions** - Clear, concise descriptions help AI decide faster
4. **Fallback Data** - Sample data when Supabase unavailable

---

## Testing the Flow

### Manual Testing Sequence

1. **Search Restaurants**
   ```
   User: "Show me Thai restaurants nearby"
   Expected: searchRestaurants tool called
   ```

2. **Get Menu**
   ```
   User: "Show Bangkok Express menu"
   Expected: getRestaurantMenu tool called
   ```

3. **Search Items**
   ```
   User: "Show vegetarian options under $12"
   Expected: searchMenuItems tool called
   ```

4. **Add to Cart**
   ```
   User: "Add Pad Thai to my cart"
   Expected: addItemToCart tool called
   Expected: Cart created if doesn't exist
   ```

5. **View Cart**
   ```
   User: "What's in my cart?"
   Expected: viewCart tool called
   ```

6. **Submit Order**
   ```
   User: "Check out" or "Place order"
   Expected: submitCartOrder tool called
   Expected: Order created, cart marked submitted
   ```

### Debug Logging

The implementation includes console.log statements:
```typescript
console.log('[food-chat] Received messages:', messages);
console.log('[food-tools] searchRestaurants called:', params);
console.error('[food-tools] Error:', error);
```

Check terminal for these logs during testing.

---

## Summary

### The AI SDK Powers:
- ✅ Natural language understanding (via OpenAI)
- ✅ Function calling (tool system)
- ✅ Streaming responses (real-time UX)  
- ✅ Type-safe inputs (Zod validation)
- ✅ Error handling
- ✅ Conversation state management

### OpenAI Provides:
- ✅ Natural language processing
- ✅ Intent recognition
- ✅ Parameter extraction from conversation
- ✅ Response generation
- ✅ Context awareness

### Supabase Handles:
- ✅ Restaurant data storage
- ✅ Menu management
- ✅ Cart operations
- ✅ Order processing
- ✅ User preferences

### The Flow:
```
User Input → AI SDK → OpenAI → Tool Selection → 
Supabase Query → Data Processing → OpenAI Response → 
Stream to User
```

---

## Next Steps

- Review the LiveKit implementation (coming next)
- Study individual tool implementations in detail
- Explore system prompt engineering
- Understand conversation state management
- Learn about voice-specific optimizations

**Files to Explore:**
- `/app/api/food-chat/route.ts` - Main route
- `/app/api/food-chat/tools.ts` - All tool implementations
- `/app/api/food-chat/types.ts` - TypeScript types
- `/lib/supabaseServer.ts` - Database configuration

