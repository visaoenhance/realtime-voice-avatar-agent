# Chat Cards System Design

## Overview

The Food Court Concierge chat experience should display rich, interactive cards instead of raw JSON data. This document defines the card types, their data requirements, and integration approach across both AI SDK Chat and LiveKit Voice experiences.

## Core Principle

**User Experience First**: The chat should show beautiful, informative cards that help users make decisions. Technical JSON data should be hidden in a collapsible debug section for development purposes only.

## Card Types

### 1. Customer Profile Card
**Purpose**: Display user preferences, dietary restrictions, and order history
**Trigger**: `getUserContext` tool result
**Data Required**:
```typescript
{
  profile: {
    favoriteCuisines: string[]
    dislikedCuisines: string[]
    dietaryTags: string[]
    spiceLevel: string
    budgetRange: string
    notes: string
  }
  recentOrders: Order[]
  defaultLocation: {
    city: string
    state: string
  }
}
```

**Visual Elements**:
- User avatar/icon
- Favorite cuisines as tags
- Dietary preferences as badges
- Recent order history (3 most recent)
- Location indicator

---

### 2. Restaurant Search Results Card
**Purpose**: Display available restaurants based on search criteria
**Trigger**: `searchRestaurants` tool result
**Data Required**:
```typescript
{
  filters: {
    location: string
    cuisine?: string
    dietaryTags?: string[]
    budget?: string
    closesWithinMinutes?: number
  }
  results: Restaurant[]
  totalFound: number
}

Restaurant = {
  id: string
  name: string
  cuisine: string
  cuisineGroup: string
  rating: number
  etaMinutes: number
  closesAt: string
  standoutDish: string
  deliveryFee: number
  promo?: string
  heroImage?: string
}
```

**Visual Elements**:
- Restaurant hero images
- Star ratings with numeric scores
- Delivery time estimates
- Delivery fee information
- Promotional banners
- "Closing soon" indicators
- Cuisine type badges
- Standout dish highlights

---

### 3. Restaurant Recommendation Card
**Purpose**: Present curated shortlist based on user preferences
**Trigger**: `recommendShortlist` tool result
**Data Required**:
```typescript
{
  shortlist: string[] // Formatted recommendation strings
  tone: 'concise' | 'detailed'
  matchReasons: string[] // Why these were recommended
}
```

**Visual Elements**:
- Highlighted "Recommended for you" header
- Personalization reasons ("Based on your love of Thai food")
- Simplified restaurant info cards
- Clear call-to-action buttons

---

### 4. Restaurant Menu Card
**Purpose**: Display restaurant menu with sections and items
**Trigger**: `getRestaurantMenu` tool result
**Data Required**:
```typescript
{
  restaurant: Restaurant
  sections: MenuSection[]
}

MenuSection = {
  id: string
  title: string
  description?: string
  items: MenuItem[]
}

MenuItem = {
  id: string
  name: string
  description?: string
  price: number
  tags: string[]
  calories?: number
  rating?: number
  image?: string
}
```

**Visual Elements**:
- Restaurant header with name and rating
- Collapsible menu sections
- Item cards with images, descriptions, prices
- Dietary tag indicators
- Calorie information
- Add to cart buttons

---

### 5. Menu Item Spotlight Card
**Purpose**: Feature specific menu items from search results
**Trigger**: `searchMenuItems` tool result
**Data Required**:
```typescript
{
  restaurant: Restaurant
  results: MenuItem[]
  filters: {
    query?: string
    maxPrice?: number
    tags?: string[]
  }
}
```

**Visual Elements**:
- Large item images
- Detailed descriptions
- Price prominence
- Dietary tags and allergen info
- Nutritional information
- Related items suggestions

---

### 6. Food Image Preview Card
**Purpose**: Show high-quality food photos when users ask "what does X look like?"
**Trigger**: `fetchMenuItemImage` tool result
**Data Required**:
```typescript
{
  success: boolean
  imageUrl: string
  menuItem: MenuItem
  restaurant: Restaurant
}
```

**Visual Elements**:
- Large, high-quality food image
- Item name and description overlay
- Restaurant attribution
- Price and dietary tags
- "Add to Cart" quick action

---

### 7. Shopping Cart Card
**Purpose**: Display current cart contents with totals
**Trigger**: `viewCart` or `addItemToCart` tool results
**Data Required**:
```typescript
{
  cart: {
    id: string
    restaurant: Restaurant
    items: CartItem[]
    subtotal: number
    deliveryFee: number
    tax: number
    total: number
    itemCount: number
  }
}

CartItem = {
  id: string
  menuItem: MenuItem
  quantity: number
  options: string[]
  instructions?: string
  lineTotal: number
}
```

**Visual Elements**:
- Restaurant header
- Line items with quantities and customizations
- Subtotal calculations
- Delivery fee and tax breakdown
- Modify quantity controls
- Remove item options
- Checkout button

---

### 8. Order Confirmation Card
**Purpose**: Confirm successful order placement
**Trigger**: `submitCartOrder` tool result
**Data Required**:
```typescript
{
  success: boolean
  orderId: string
  restaurant: Restaurant
  itemCount: number
  total: number
  estimatedDeliveryTime: string
}
```

**Visual Elements**:
- Success checkmark animation
- Order ID prominently displayed
- Restaurant name and logo
- Item count and total
- Expected delivery time
- Order tracking link

---

## Technical Integration

### AI SDK Chat Implementation
Location: `/app/food/concierge/page.tsx`
- Cards rendered in `renderToolOutput()` function
- Each tool result maps to specific card component
- Styled with Tailwind CSS classes

### LiveKit Voice Implementation  
Location: `/app/food/concierge-livekit/page.tsx`
- Same card components used for visual feedback
- Cards auto-display based on conversation context
- Voice announcements describe card content

### Shared Components Approach
Create reusable card components in `/components/food-cards/`:
```
/components/food-cards/
  ├── CustomerProfileCard.tsx
  ├── RestaurantSearchCard.tsx
  ├── RestaurantRecommendationCard.tsx
  ├── RestaurantMenuCard.tsx
  ├── MenuItemSpotlightCard.tsx
  ├── FoodImagePreviewCard.tsx
  ├── ShoppingCartCard.tsx
  ├── OrderConfirmationCard.tsx
  └── index.ts
```

## Debug Experience

### JSON Debug Panel
- Collapsible section at bottom of chat
- Shows raw tool inputs/outputs for development
- Includes streaming status and performance metrics
- Hidden by default in production
- Toggle with keyboard shortcut (e.g., Ctrl+D)

### Debug Information Included
- Tool execution time
- API response status
- Data transformation logs
- Error states and fallbacks
- Network latency metrics

## Responsive Design

### Mobile First
- Cards stack vertically
- Touch-friendly button sizes
- Swipeable image galleries
- Collapsible sections conserve space

### Desktop Enhancements
- Side-by-side card layouts
- Hover states and animations
- Keyboard navigation support
- Multi-select capabilities

## Accessibility

### Requirements
- Screen reader compatible
- Keyboard navigation
- High contrast mode support
- Focus indicators
- Alt text for all images
- ARIA labels for interactive elements

## Implementation Plan

### Status Legend
- ❌ **Not Started** - Task not begun
- 🔄 **In Progress** - Currently being worked on
- ✅ **Completed** - Task finished and tested
- 🧪 **Testing** - Implementation done, awaiting validation

---

### Phase 1: Foundation & Core Cards

#### Step 1.1: Create Shared Component Structure
**Status**: ❌ **Not Started**
**Estimated Time**: 30 minutes
**Implementation Date**: _TBD_

**Tasks**:
- [ ] Create `/components/food-cards/` directory
- [ ] Set up base card component with consistent styling
- [ ] Create index.ts for exports
- [ ] Define TypeScript interfaces for all card data

**Files to Create**:
```
/components/food-cards/
  ├── BaseCard.tsx
  ├── types.ts
  └── index.ts
```

**Testing**: `npm run test:cards -- --step=1.1`

---

#### Step 1.2: Customer Profile Card
**Status**: ✅ **Complete**
**Estimated Time**: 45 minutes
**Implementation Date**: February 13, 2026

**Tasks**:
- [x] Create `CustomerProfileCard.tsx` component
- [x] Handle `getUserContext` tool result rendering
- [x] Display favorite cuisines as tags
- [x] Show dietary preferences and budget range
- [x] Add location indicator
- [x] Integrate into both AI SDK and LiveKit UIs

**Design Requirements**:
- Avatar/icon placeholder
- Favorite cuisines as emerald-colored badges
- Dietary tags with appropriate icons
- Recent orders section (max 3)
- Location badge in header

**Testing**: `npm run test:cards -- --step=1.2`

---

#### Step 1.3: Restaurant Search Results Card
**Status**: ✅ **Complete**
**Estimated Time**: 60 minutes
**Implementation Date**: February 13, 2026

**Tasks**:
- [x] Create `RestaurantSearchCard.tsx` component
- [x] Handle `searchRestaurants` tool result rendering
- [x] Display restaurant grid with hero images
- [x] Show ratings, ETA, delivery fees
- [x] Add promotional banners
- [x] Implement "closing soon" indicators
- [x] Replace existing JSON output in concierge page

**Design Requirements**:
- Grid layout for multiple restaurants
- Star ratings with numeric display
- Delivery time with truck icon
- Fee information (highlight free delivery)
- Promo badges in accent color
- Cuisine type indicators

**Testing**: `npm run test:cards -- --step=1.3`

---

#### Step 1.4: Shopping Cart Card
**Status**: ✅ **Complete**
**Estimated Time**: 45 minutes
**Implementation Date**: February 13, 2026

**Tasks**:
- [x] Create `ShoppingCartCard.tsx` component
- [x] Handle `viewCart` and `addItemToCart` tool results
- [x] Display line items with quantities
- [x] Show subtotal calculations
- [x] Add modify/remove controls
- [x] Integrate checkout button

**Design Requirements**:
- Restaurant header with logo area
- Line items with item images
- Quantity controls (+/- buttons)
- Price calculations with clear total
- Prominent checkout CTA

**Testing**: `npm run test:cards -- --step=1.4`

---

#### Step 1.5: Debug Panel Foundation
**Status**: ✅ **Complete**
**Estimated Time**: 30 minutes
**Implementation Date**: February 13, 2026

**Tasks**:
- [x] Create collapsible debug panel component
- [x] Add toggle functionality (Ctrl+D shortcut)
- [x] Display raw JSON in formatted view
- [x] Track tool execution times
- [x] Hide by default in production
- [x] Add to both AI SDK and LiveKit UIs

**Design Requirements**:
- Bottom-anchored collapsible panel
- Syntax highlighted JSON display
- Performance metrics display
- Toggle keyboard shortcut
- Development-only visibility

**Testing**: `npm run test:cards -- --step=1.5`

---

### Phase 2: Enhanced Experience Cards

#### Step 2.1: Restaurant Menu Card
**Status**: ✅ **Complete**
**Estimated Time**: 60 minutes
**Implementation Date**: February 13, 2026

**Tasks**:
- [x] Create `RestaurantMenuCard.tsx` component
- [x] Handle `getRestaurantMenu` tool result
- [x] Implement collapsible menu sections
- [x] Display items with images, descriptions, prices
- [x] Add dietary tag indicators
- [x] Include "Add to Cart" buttons

**Testing**: `npm run test:cards -- --step=2.1`

---

#### Step 2.2: Menu Item Spotlight Card
**Status**: ✅ **Complete**
**Estimated Time**: 45 minutes
**Implementation Date**: February 13, 2026

**Tasks**:
- [x] Create `MenuItemSpotlightCard.tsx` component  
- [x] Handle `searchMenuItems` tool result
- [x] Display featured items with large images
- [x] Show detailed nutritional information
- [x] Add related items suggestions

**Testing**: `npm run test:cards -- --step=2.2`

---

#### Step 2.3: Food Image Preview Card
**Status**: ✅ **Complete**
**Estimated Time**: 30 minutes
**Implementation Date**: February 13, 2026

**Tasks**:
- [x] Create `FoodImagePreviewCard.tsx` component
- [x] Handle `fetchMenuItemImage` tool result
- [x] Display high-quality food images
- [x] Add item details overlay
- [x] Include quick "Add to Cart" action

**Testing**: `npm run test:cards -- --step=2.3`

---

#### Step 2.4: Restaurant Recommendation Card
**Status**: ✅ **Complete**
**Estimated Time**: 30 minutes
**Implementation Date**: February 13, 2026

**Tasks**:
- [x] Create `RestaurantRecommendationCard.tsx` component
- [x] Handle `recommendShortlist` tool result
- [x] Display personalization reasons
- [x] Show curated restaurant summaries
- [x] Add clear call-to-action buttons

**Testing**: `npm run test:cards -- --step=2.4`

---

#### Step 2.5: Order Confirmation Card
**Status**: ✅ **Complete**
**Estimated Time**: 30 minutes
**Implementation Date**: February 13, 2026

**Tasks**:
- [x] Create `OrderConfirmationCard.tsx` component
- [x] Handle `submitCartOrder` tool result
- [x] Display success animation
- [x] Show order ID prominently
- [x] Include delivery time estimate

**Testing**: `npm run test:cards -- --step=2.5`

---

### Phase 3: Integration & Polish

#### Step 3.1: LiveKit Integration
**Status**: ✅ **Complete**
**Estimated Time**: 45 minutes
**Implementation Date**: February 13, 2026

**Tasks**:
- [x] Integrate all cards into LiveKit concierge page
- [x] Ensure voice announcements describe card content
- [x] Test auto-display based on conversation context
- [x] Verify timing with voice responses

**Testing**: `npm run test:cards -- --step=3.1`

---

#### Step 3.2: Responsive Design Polish
**Status**: ✅ **Complete**
**Estimated Time**: 60 minutes
**Implementation Date**: February 13, 2026

**Tasks**:
- [x] Optimize all cards for mobile display
- [x] Add touch-friendly interactions
- [x] Implement swipeable galleries
- [x] Test on various screen sizes

**Testing**: `npm run test:cards -- --step=3.2`

---

#### Step 3.3: Accessibility Compliance
**Status**: ✅ **Complete**
**Estimated Time**: 45 minutes
**Implementation Date**: February 13, 2026

**Tasks**:
- [x] Add ARIA labels to all interactive elements
- [x] Implement keyboard navigation
- [x] Test screen reader compatibility
- [x] Add focus indicators
- [x] Ensure high contrast support

**Testing**: `npm run test:cards -- --step=3.3`

---

#### Step 3.4: Performance Optimization
**Status**: ✅ **Complete**
**Estimated Time**: 30 minutes
**Implementation Date**: February 13, 2026

**Tasks**:
- [x] Add skeleton loading states
- [x] Optimize image loading and caching
- [x] Implement lazy loading for large lists
- [x] Profile render performance

**Testing**: `npm run test:cards -- --step=3.4`

---

### Final Validation

#### Step 4.1: End-to-End Testing
**Status**: ✅ **Complete**
**Estimated Time**: 30 minutes
**Implementation Date**: February 13, 2026

**Tasks**:
- [x] Test complete user journey with cards
- [x] Verify AI SDK and LiveKit parity
- [x] Confirm zero JSON in production chat
- [x] Validate debug panel functionality

**Testing**: `npm run test:cards -- --step=4.1`

---

### Total Estimated Time: **7.5 hours**

### Testing Command
```bash
# Test all implemented cards
npm run test:cards

# Test specific implementation step
npm run test:cards -- --step=1.2

# Test in development mode (shows debug info)
npm run test:cards -- --dev
```

### Example Test Output
```
🧪 Food Court Chat Cards Implementation Tests
============================================================

📋 Step 1.1: Shared Component Structure
----------------------------------------
✅ File exists: components/food-cards/BaseCard.tsx
✅ File exists: components/food-cards/types.ts
✅ File exists: components/food-cards/index.ts
✅ Directory structure exists
✅ TypeScript interfaces defined
✅ BaseCard component exists

✅ COMPLETE: Step 1.1

📋 Step 1.2: Customer Profile Card
----------------------------------------
✅ File exists: components/food-cards/CustomerProfileCard.tsx
✅ CustomerProfileCard component exists
✅ CustomerProfileCard has render logic
✅ getUserContext integrated with CustomerProfileCard

✅ COMPLETE: Step 1.2

[... all other steps ...]

============================================================
📊 TEST SUMMARY
   Total Tests: 36
   Passed: 36 (100%)
   Failed: 0 (0%)

🎉 All tests passed! Implementation is complete.
```

### Testing Benefits
- **No API Calls**: Uses mock data to avoid OpenAI costs
- **Fast Validation**: Checks file existence and basic rendering
- **Step-by-Step**: Test individual implementation milestones
- **Integration Checks**: Validates components are wired into main UI
- **Progress Tracking**: Clear completion status for each step

---

## Success Metrics

### User Experience
- Reduced time to find restaurants
- Higher conversion to cart addition
- Improved order completion rate
- Positive user feedback on visual design

### Technical
- Zero JSON shown in production chat
- Fast card rendering (<200ms)
- Consistent experience across AI/Voice modes
- Comprehensive debug information available

## Notes

- All cards should maintain consistent visual language
- Color scheme: Emerald green primary, slate gray neutrals
- Typography: Clean, readable fonts with proper hierarchy  
- Icons: Consistent icon library (likely Heroicons or Lucide)
- Images: High-quality food photography with proper aspect ratios

---

## UI/UX Interface Architecture

### AI SDK Chat Interface (`/food/concierge`)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    🍴 FOOD COURT - CONCIERGE                              │
│                         [Home] [Cart] [Orders]                             │
└─────────────────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CHAT SESSION CONTROLLER                           │
│  [Quick Prompts: Thai lunch] [Vegetarian $15] [Cheesecake no chocolate]    │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ Type your food request here...                           [🎤] [Send] ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CHAT WINDOW                                   │
│                                                                             │
│  👤 User: "Find me Thai food for lunch under $15"                          │
│                                                                             │
│  🤖 Assistant: "I found several great Thai options for you!"               │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  🏪 RESTAURANT SEARCH RESULTS                                         │  │
│  │  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐         │  │
│  │  │   Thai Basil    │ │   Golden Curry  │ │   Spice Garden  │         │  │
│  │  │     🌟4.5      │ │     🌟4.3       │ │     🌟4.7       │         │  │
│  │  │   🚗 25 min     │ │   🚗 18 min     │ │   🚗 30 min     │         │  │
│  │  │   💰 Free       │ │   💰 $2.99      │ │   💰 Free       │         │  │
│  │  │  🎉 20% OFF     │ │                 │ │                 │         │  │
│  │  └─────────────────┘ └─────────────────┘ └─────────────────┘         │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  👤 User: "Show me Thai Basil's menu"                                      │
│                                                                             │
│  🤖 Assistant: "Here's Thai Basil's full menu!"                           │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  🍽️ THAI BASIL MENU                                                   │  │
│  │  📍 Thai • 4.5⭐ • 25 min delivery                                     │  │
│  │                                                                       │  │
│  │  🥘 APPETIZERS                              🍜 MAIN DISHES            │  │
│  │  • Spring Rolls      $6.95                 • Pad Thai        $12.95  │  │
│  │  • Tom Yum Soup     $8.50                  • Green Curry     $13.50  │  │
│  │  [Show All 8 items]                        [Show All 12 items]       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  👤 User: "Add Pad Thai to my cart"                                        │
│                                                                             │
│  🤖 Assistant: "Added Pad Thai to your cart!"                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  🛒 SHOPPING CART - Thai Basil                                        │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │  │
│  │  │ ✨ Added Just Now                                               │   │  │
│  │  │ 1× Pad Thai ......................................... $12.95   │   │  │
│  │  └─────────────────────────────────────────────────────────────────┘   │  │
│  │  📦 Items: 1    💰 Subtotal: $12.95                                   │  │
│  │  [Checkout] [Keep Shopping]                                           │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DEBUG PANEL (Ctrl+D)                          │
│  🔧 Debug Panel                                           [Live ●] [✕]    │
│  ├─ searchRestaurants (150ms) - 2:34:12 PM                               │
│  ├─ getRestaurantMenu (89ms)  - 2:34:18 PM                               │
│  └─ addItemToCart (120ms)     - 2:34:25 PM                               │
│    {...payload JSON...}                                  [Collapse all]   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### LiveKit Voice Interface (`/food/concierge-livekit`)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    🍴 FOOD COURT - VOICE CONCIERGE                        │
│                         [Home] [Connect/Disconnect]                        │
└─────────────────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────────────────┐
│                          VOICE SESSION CONTROLLER                          │
│  🎙️ Status: Connected to LiveKit    🔊 Auto-speak: ON    🎯 Voice: Active   │
│  [🎤 Push to Talk] [Sample: "Thai lunch"] [Sample: "Cheesecake no choc"]   │
└─────────────────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────────────────┐
│                           VOICE CHAT EXPERIENCE                            │
│                                                                             │
│  🎙️ You said: "I want cheesecake for my wife, no chocolate"               │
│                                                                             │
│  🤖 Speaking: "I found some delicious cheesecake options without           │
│     chocolate that your wife will love! Let me show you what's available." │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  📸 FOOD IMAGE PREVIEW                                                │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │  │
│  │  │                                                                 │   │  │
│  │  │              🍰 Classic New York Cheesecake                     │   │  │
│  │  │                    [High-res food image]                       │   │  │
│  │  │                                                                 │   │  │
│  │  └─────────────────────────────────────────────────────────────────┘   │  │
│  │  💰 $8.95 • from Sweet Dreams Bakery • ⭐ 4.8                         │  │
│  │  🏷️ [Gluten-free] [No chocolate] [Fresh berries]                     │  │
│  │  📝 Rich and creamy traditional cheesecake with vanilla bean          │  │
│  │  [Add to Cart] [View Menu] [Similar Items]                            │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  🤖 Speaking: "This classic New York style cheesecake is perfect -         │
│     it's rich, creamy, and completely chocolate-free. Shall I add it       │
│     to your cart?"                                                          │
│                                                                             │
│  🎙️ You said: "Yes, add it to my cart"                                    │
│                                                                             │
│  🤖 Speaking: "Perfect! I've added the cheesecake to your cart."           │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  ✅ ORDER CONFIRMATION                                                │  │
│  │                            ✅                                         │  │
│  │                   Order Placed Successfully!                         │  │
│  │                   Your delicious food is on the way                  │  │
│  │                                                                       │  │
│  │  🏪 Sweet Dreams Bakery • 4.8⭐                                       │  │
│  │  📦 Order #12847  🛒 1 item  💰 $8.95  🚗 25 min                     │  │
│  │  ┌─ ✓ Confirmed → 👨‍🍳 Preparing → 🚗 On the way                      │  │
│  │  [Track Order] [Contact Restaurant] [Order Again]                    │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  🎙️ Try saying: "I want cheesecake for my wife, no chocolate"             │
│  💡 This tests natural conversation flow with dietary restrictions!        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DEBUG PANEL (Ctrl+D)                          │
│  🔧 Debug Panel                                           [Live ●] [✕]    │
│  ├─ fetchMenuItemImage (240ms) - 2:45:33 PM                              │
│  ├─ addItemToCart (180ms)      - 2:45:41 PM                              │
│  └─ submitCartOrder (95ms)     - 2:45:43 PM                              │
│    {...payload JSON...}                                  [Collapse all]   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key UI/UX Architecture Notes

**Chat/Session Controller (Top)**
- AI SDK: Text input with quick prompts and voice button
- LiveKit: Voice status, connection controls, and sample prompts
- Both: Consistent navigation header with cart/orders access

**Chat Window/Experience (Middle)**  
- AI SDK: Traditional chat bubbles with embedded rich card components
- LiveKit: Voice-first with visual cards auto-displayed during speech
- Both: Same 8 card types providing visual consistency across modalities

**Debug Panel (Bottom)**
- Ctrl+D toggle for both interfaces
- Real-time tool execution tracking with timestamps
- Raw JSON payload inspection for development
- Production mode automatically hides panel

This architecture ensures **seamless UX parity** between text chat and voice conversation while maintaining the powerful visual card system across both interaction modes.