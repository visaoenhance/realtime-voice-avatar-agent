# Chat Flow Design: AI-SDK vs LiveKit Pipeline Analysis

**Date**: February 13, 2026  
**Status**: Analysis Phase - AI-SDK Broken, LiveKit Working  
**Goal**: Understand what broke AI-SDK while LiveKit was being developed

---

## Executive Summary

### Timeline of Events
1. **Original State**: AI-SDK food chat was **working** (`/api/food-chat` + `/food/concierge`)
2. **Development Phase**: Created separate LiveKit voice pipeline for voice-first UX
3. **LiveKit Complete**: Voice ordering works end-to-end (`/api/voice-chat` + `/food/concierge-livekit`)
4. **Current Problem**: Returned to AI-SDK and it's **broken** - showing `undefined .map()` errors

### Current Status
| Pipeline | API Endpoint | UI Page | Status | Notes |
|----------|--------------|---------|--------|-------|
| **AI-SDK Text Chat** | `/api/food-chat` | `/food/concierge` | ❌ BROKEN | undefined map error on getUserContext |
| **LiveKit Voice** | `/api/voice-chat` | `/food/concierge-livekit` | ✅ WORKING | Complete ordering flow functional |

---

## Architecture Overview

### Design Principle: Separated Pipelines
Both pipelines are **intentionally separated** to serve different interaction patterns while sharing UI components:

```
┌─────────────────────────────────────────────────────────────┐
│                    SHARED COMPONENTS                         │
│  - Food Cards (components/food-cards/)                      │
│  - Supabase Client (lib/supabaseServer.ts)                 │
│  - Database Tables (fc_restaurants, fc_menu_items, etc.)   │
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │
              ┌───────────────┴───────────────┐
              │                               │
┌─────────────┴───────────┐   ┌───────────────┴─────────────┐
│    AI-SDK PIPELINE      │   │   LIVEKIT PIPELINE          │
├─────────────────────────┤   ├─────────────────────────────┤
│ UI: /food/concierge     │   │ UI: /food/concierge-livekit │
│ API: /api/food-chat     │   │ API: /api/voice-chat        │
│ Tools: foodTools        │   │ Tools: voiceTools           │
│ Pattern: Exploratory    │   │ Pattern: Direct Commands    │
└─────────────────────────┘   └─────────────────────────────┘
```

---

## Pipeline Comparison

### AI-SDK Pipeline (`/api/food-chat`)

**Purpose**: Text-based exploratory food discovery
**Interaction Style**: Conversational, guidance-driven, gradual narrowing

#### System Prompt Philosophy
```typescript
- "Wait for household to speak first"
- "On first request, call getUserContext"
- "Use profile preferences as SUGGESTIONS"
- "Start with BROAD restaurant search"
- "searchRestaurants filters by cuisine, dietary tags"
- "Present shortlist using recommendShortlist"
```

#### Tool Set (from `/api/food-chat/tools.ts`)
```typescript
export const foodTools = {
  getUserContext,         // Load profile, preferences, recent orders
  searchRestaurants,      // Filter by cuisine, location, dietary tags
  getRestaurantMenu,      // Browse full menu by sections
  searchMenuItems,        // Find specific dishes
  recommendShortlist,     // Curated restaurant recommendations
  addItemToCart,          // Add with modifiers, quantities
  viewCart,               // Review current cart
  submitCartOrder,        // Complete checkout
  fetchMenuItemImage,     // Show food photos
  updatePreferences,      // Modify user preferences
  updateHomepageLayout,   // Customize homepage
  logOrderIntent,         // Track user selections
  logFeedback,            // Session feedback
}
```

#### Current State
- **Status**: ❌ BROKEN
- **Error**: `Cannot read properties of undefined (reading 'map')`
- **Location**: Likely in `getUserContext` tool or `processToolCalls` utility
- **Impact**: Cannot initialize conversation, all requests fail

---

### LiveKit Pipeline (`/api/voice-chat`)

**Purpose**: Voice-first direct command execution  
**Interaction Style**: Immediate, action-oriented, minimal back-and-forth

#### System Prompt Philosophy
```typescript
- "FAST, DIRECT voice interactions"
- "IMMEDIATE ACTION when food item requested"
- "Skip profile loading for direct requests"
- "Use default delivery area automatically"
- "I want cheesecake → immediately findFoodItem"
- "Prioritize speed over comprehensive exploration"
```

#### Tool Set (from `/api/voice-chat/tools.ts`)
```typescript
export const voiceTools = {
  getUserProfile,        // Quick profile load (only when needed)
  findFoodItem,          // Direct item search across all restaurants
  quickAddToCart,        // Skip browsing, straight to cart (supports multiple items)
  quickViewCart,         // Show cart with total
  quickCheckout,         // Streamlined checkout
}
```

#### Current State
- **Status**: ✅ WORKING
- **Test Results**: Complete ordering flow from "I want cheesecake" → search → cart → checkout → confirmation
- **Data**: Properly connected to Supabase, returns real restaurant/menu data
- **Cards**: MenuItemSpotlightCard, ShoppingCartCard, OrderConfirmationCard all working

---

## Shared Infrastructure

### Database (Supabase)
Both pipelines query the same tables:
- `fc_restaurants` - Restaurant listings
- `fc_menu_items` - Menu items
- `fc_carts` - Shopping carts
- `fc_orders` - Order history
- `fc_preferences` - User preferences
- `fc_profiles` - User profiles

### UI Components (`/components/food-cards/`)
Both pipelines render the same visual cards:
- `CustomerProfileCard` - User preferences display
- `RestaurantSearchCard` - Restaurant search results
- `RestaurantRecommendationCard` - Curated recommendations
- `RestaurantMenuCard` - Full menu display
- `MenuItemSpotlightCard` - Item search results with restaurant grouping
- `ShoppingCartCard` - Cart contents and totals
- `OrderConfirmationCard` - Order confirmation details
- `FoodImagePreviewCard` - Food photos

### Tool Output Format
Both pipelines return JSON strings that get parsed and displayed as cards:
```typescript
// Example: MenuItemSpotlightCard data
{
  searchCriteria: string,
  totalFound: number,
  items: MenuItem[],      // With restaurantName, restaurantId
  speechSummary: string   // Voice-friendly summary
}
```

---

## Root Cause Analysis

### What Changed During LiveKit Development?

#### 1. **Database Schema Fixes**
While building LiveKit tools, we fixed queries:
- Removed non-existent columns (`fc_orders.rating`, `fc_orders.satisfaction_notes`)
- Fixed menu section queries
- But these fixes may not have been applied to AI-SDK tools

#### 2. **Tool Return Structure Evolution**
LiveKit tools have specific return formats:
```typescript
// Voice tool pattern
return JSON.stringify({
  items: [...],
  restaurantName: "...",
  speechSummary: "..."
});
```

AI-SDK tools may have different return structures that broke compatibility.

#### 3. **Data Type Mismatches**
```typescript
// Potential issue in foodTools.ts
const recent = recentOrders.slice(0, 3).map(...) 
// If recentOrders is undefined instead of []

// We fixed this in voice tools:
const recent = (recentOrders ?? []).slice(0, 3).map(...)
```

#### 4. **Shared Utilities Divergence**
```typescript
// AI-SDK uses: /api/chat/utils.ts -> processToolCalls()
// LiveKit uses: /api/voice-chat/utils.ts -> processVoiceToolCalls()
```

If `processToolCalls` has a bug with undefined arrays, it affects AI-SDK.

---

## Known Issues

### AI-SDK Issues Identified

#### Issue #1: getUserContext undefined map error
**Location**: `/api/food-chat/tools.ts` line ~1096-1108  
**Error**: `Cannot read properties of undefined (reading 'map')`

**Potential Causes**:
1. `fetchRecentOrders()` returns `undefined` instead of `[]` on error
2. `preferences.favorite_cuisines` is undefined (wrong fallback data)
3. `FALLBACK_PREFERENCES` vs `FALLBACK_PREFERENCE_RECORD` type mismatch
4. Database query errors not handled properly

**Evidence from Logs**:
```
[food-tools] fetchRecentOrders error {
  code: '42703',
  message: 'column fc_orders.rating does not exist'
}
```

#### Issue #2: processToolCalls expecting parts array
**Location**: `/api/chat/utils.ts` line 67  
**Code**:
```typescript
lastMessage.parts.map(async part => {
  // If parts is undefined, this crashes
})
```

**Guard exists but might not cover all cases**:
```typescript
if (!lastMessage?.parts) {
  return messages;
}
```

#### Issue #3: Inconsistent Error Returns
**Pattern**:
```typescript
// Inconsistent:
return FALLBACK_PREFERENCES;  // Wrong type
return FALLBACK_PREFERENCE_RECORD; // Correct type

// Some functions return undefined on error
// Others return []
```

---

## Testing Strategy

### Current Gap
**Problem**: We've been making fixes without validation

### Required Test Scripts (`/scripts/`)

#### 1. `test-ai-sdk-orlando-search.js`
```javascript
// Test: "I am in Orlando, find thai restaurants"
// Validates: 
// - getUserContext loads properly
// - searchRestaurants returns results
// - Cards render correctly
```

#### 2. `test-livekit-orlando-search.js`
```javascript
// Test: "I want cheesecake"
// Validates:
// - findFoodItem returns results
// - quickAddToCart works
// - quickCheckout completes
```

#### 3. `test-shared-components.js`
```javascript
// Test: Both pipelines render same cards with different data
// Validates:
// - MenuItemSpotlightCard works for both
// - ShoppingCartCard works for both
// - No prop mismatches
```

#### 4. `test-supabase-queries.js`
```javascript
// Test: Database queries work identically
// Validates:
// - fc_restaurants queries
// - fc_menu_items queries
// - Schema compatibility
```

---

## Isolation Principles

### Do NOT Touch While Fixing AI-SDK
1. ✅ **LiveKit Pipeline**
   - `/api/voice-chat/route.ts`
   - `/api/voice-chat/tools.ts`
   - `/api/voice-chat/utils.ts`
   - `/food/concierge-livekit/page.tsx`

2. ✅ **Shared Components**
   - `/components/food-cards/*` (unless bug affects BOTH)
   - `/lib/supabaseServer.ts`
   - Database tables

### Safe to Fix
1. ❌ **AI-SDK Specific**
   - `/api/food-chat/route.ts` (system prompt, flow)
   - `/api/food-chat/tools.ts` (tool functions, error handling)
   - `/api/food-chat/types.ts` (type definitions)
   - `/food/concierge/page.tsx` (UI logic)

2. ⚠️ **Shared Utilities** (if fixing, test BOTH pipelines)
   - `/api/chat/utils.ts` (processToolCalls)

---

## Next Steps

### Phase 1: Analysis Complete ✅
- [x] Document both pipelines
- [x] Identify separation points
- [x] List known issues
- [x] Define testing strategy

### Phase 2: Create Test Scripts
- [ ] `test-ai-sdk-orlando-search.js`
- [ ] `test-livekit-orlando-search.js`
- [ ] `test-shared-components.js`
- [ ] `test-supabase-queries.js`

### Phase 3: Fix AI-SDK With Validation
- [ ] Fix getUserContext undefined map error
- [ ] Fix database query schema mismatches
- [ ] Fix type inconsistencies in fallback data
- [ ] Validate each fix with test script

### Phase 4: Regression Testing
- [ ] Run all test scripts
- [ ] Verify LiveKit still works
- [ ] Verify shared components work for both
- [ ] Manual UI testing for both interfaces

### Phase 5: Documentation
- [ ] Update this document with fixes applied
- [ ] Document any shared component changes
- [ ] Add test results to validation log

---

## Success Criteria

### AI-SDK Must:
- ✅ Handle "I am in Orlando, find thai restaurants" without errors
- ✅ Load getUserContext successfully
- ✅ Return restaurant search results with proper data
- ✅ Render all card components correctly
- ✅ Complete full ordering flow from search → cart → checkout

### LiveKit Must:
- ✅ Continue working without regression
- ✅ All existing tests pass
- ✅ Voice ordering flow remains functional

### Shared Infrastructure Must:
- ✅ Components work for both pipelines
- ✅ Supabase queries work for both
- ✅ No breaking changes introduced

---

## References

- [CHAT_EXP.md](./CHAT_EXP.md) - Original vision for both interfaces
- [CHAT_EXP_FIXES.md](./CHAT_EXP_FIXES.md) - Regression analysis
- [CHAT_CARDS.md](./CHAT_CARDS.md) - Card component specifications
- [SDK_STRATEGY.md](./SDK_STRATEGY.md) - AI-SDK vs LiveKit comparison
