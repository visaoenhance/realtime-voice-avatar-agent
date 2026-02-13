# Chat Experience Design

## The Vision: Best of Both Worlds

We should have TWO complementary interfaces that both provide excellent UX:

### AI SDK Chat Interface (`/food/concierge`)
- **Input**: Typing text messages
- **Output**: Streaming text responses + visual cards  
- **API**: `/api/food-chat` (streaming Server-Sent Events)
- **Tools**: Full restaurant search, menu browsing, cart management
- **Cards**: ProfileCard, RestaurantSearch, MenuDisplay, Cart, OrderConfirmation
- **Flow**: Type message → AI streams response → Tool cards appear → Continue typing

### LiveKit Voice Interface (`/food/concierge-livekit`) 
- **Input**: Natural voice conversation
- **Output**: AI speaks back + SAME visual cards appear
- **API**: Should use same `/api/food-chat` but handle streaming properly
- **Tools**: Same restaurant search, menu browsing, cart management  
- **Cards**: SAME components - ProfileCard, RestaurantSearch, MenuDisplay, Cart, OrderConfirmation
- **Flow**: Speak naturally → AI responds with voice + cards → Continue speaking

## Why This Makes Sense

### Voice + Visual = Enhanced UX
- **Voice**: Natural, hands-free, conversational
- **Visual**: Rich information display, menu photos, cart details
- **Combined**: Best of both modalities - speak naturally while seeing beautiful results

### Technical Feasibility
- Same backend tools and data
- Same card components  
- Only difference: input modality (voice vs typing) and response format handling

### User Scenarios

**Scenario 1: Thai Food Search**
```
User speaks: "I want Thai food"
AI responds: (voice) "Great! I found some excellent Thai restaurants for you"
Card appears: RestaurantSearchCard showing Thai restaurants with photos/ratings
User speaks: "Show me the menu for Noodle Express" 
AI responds: (voice) "Here's their full menu"
Card appears: RestaurantMenuCard with categorized items and prices
```

**Scenario 2: Cart Management**
```
User speaks: "Add the Pad Thai to my cart"
AI responds: (voice) "Added Pad Thai for $14.95 to your cart"
Card appears: ShoppingCartCard showing updated cart total
User speaks: "What's in my cart?"
AI responds: (voice) "You have 1 item totaling $16.94 with tax"
Card appears: Updated ShoppingCartCard with item details
```

## Current Technical Issue

The problem isn't conceptual - it's implementation:

**Problem**: `/api/food-chat` returns streaming SSE format:
```
data: {"textDelta": "Great choice!"}
data: {"toolResults": [...]}
```

**LiveKit expects**: Regular JSON response:
```json
{
  "textDelta": "Great choice!",
  "toolResults": [...]
}
```

## Solution Options

### Option A: Make LiveKit parse streaming SSE (Recommended)
- Keep `/api/food-chat` unchanged (AI SDK still works)  
- Update LiveKit to handle `fetch()` with streaming response
- Parse each `data: {...}` line and extract text + tool results
- Show cards when tool results arrive

### Option B: Create non-streaming endpoint
- Create `/api/food-chat-sync` that returns single JSON response
- LiveKit uses this simpler endpoint
- Maintains separation but requires duplicate logic

### Option C: Hybrid approach  
- `/api/food-chat` detects client type (header/parameter)
- Returns streaming for AI SDK, single JSON for LiveKit
- Single endpoint, dual response formats

## Desired End State

Both interfaces should feel natural and powerful:
- **AI SDK**: Rich typing experience with instant card updates
- **LiveKit**: Natural voice conversation with same rich cards
- **Same tool functionality**: Restaurant search, menus, cart, ordering
- **Same visual components**: Consistent card design and behavior
- **Different interaction paradigms**: Voice vs typing, both excellent

## Key Insight

This isn't voice-first vs visual-first - it's **multimodal UX**. Voice input with visual output creates a powerful combination that's more than the sum of its parts.