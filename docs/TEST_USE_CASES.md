# Food Ordering Test Use Cases & Bug Tracking

**Purpose**: Document expected behavior for both AI-SDK and LiveKit pipelines, track bugs discovered during testing, and validate fixes.

**Last Updated**: February 13, 2026

---

## Use Case 1: AI-SDK Exploratory Conversational Ordering

**Pipeline**: AI-SDK (Text Chat)  
**Endpoint**: `/api/food-chat`  
**Pattern**: Multi-turn conversational dialogue with profiles and context building  
**User Experience**: Exploratory, patient, asks questions, builds understanding

### Flow Steps

#### Step 1: Initial Request
**User Input**: "can you help me find something to eat"

**Expected Behavior**:
- Tool Called: `getUserContext`
- Card Displayed: `ProfilePreferencesCard` or text summary
- Response Should Include:
  - User's favorite cuisines
  - Dietary preferences
  - Recent orders
  - Request for location/city

**Validation**:
- [ ] getUserContext tool executes without errors
- [ ] Profile data loads from Supabase or fallback
- [ ] Recent orders query works (no rating column error)
- [ ] Response asks for city/location
- [ ] No undefined/null errors

**Known Bugs**:
- ❌ `Cannot read properties of undefined (reading 'map')` error
- ❌ Database query for non-existent `rating` column in fetchRecentOrders
- ❌ Type mismatch: FALLBACK_PREFERENCES vs FALLBACK_PREFERENCE_RECORD
- ❌ Missing null coalescing on array operations

**Status**: 🔴 BROKEN

---

#### Step 2: Location Specification
**User Input**: "I live in Orlando" or "I'm in Orlando"

**Expected Behavior**:
- Tool Called: `searchRestaurants` with location="Orlando"
- Card Displayed: `RestaurantSearchCard` with multiple restaurants
- Response Should Include:
  - List of restaurants in Orlando
  - Cuisine types available
  - Ratings, ETAs, delivery fees
  - Invitation to select a restaurant or browse menu

**Validation**:
- [ ] searchRestaurants executes with Orlando location
- [ ] Supabase query returns Orlando restaurants
- [ ] Restaurant data includes all required fields
- [ ] Card renders with multiple restaurant options
- [ ] No map/undefined errors

**Known Bugs**:
- ⚠️ To be tested after Step 1 fixes

**Status**: ⏳ PENDING STEP 1 FIX

---

#### Step 3: Menu Request
**User Input**: "Lets look at the menu for Island Breeze Caribbean" or "show me Island Breeze menu"

**Expected Behavior**:
- Tool Called: `getRestaurantMenu` with restaurant identifier
- Card Displayed: `RestaurantMenuCard` with sections and items
- Response Should Include:
  - Menu categories (appetizers, mains, desserts, etc.)
  - Item names, descriptions, prices
  - Standout dishes highlighted
  - Invitation to add items to cart

**Validation**:
- [ ] getRestaurantMenu executes with correct restaurant ID/slug
- [ ] Menu data loads from Supabase
- [ ] All menu sections render properly
- [ ] Prices formatted correctly
- [ ] Images load if available

**Known Bugs**:
- ⚠️ To be tested

**Status**: ⏳ PENDING

---

#### Step 4: Add to Cart
**User Input**: "I want to add coconut shrimp to my cart" or "add coconut shrimp and jerk chicken"

**Expected Behavior**:
- Tool Called: `addItemToCart` (possibly multiple times or with additionalItems)
- Card Displayed: `ShoppingCartCard` with cart contents
- Response Should Include:
  - Items added confirmation
  - Current cart contents
  - Item quantities
  - Subtotal/total
  - Ask if ready to checkout

**Validation**:
- [ ] addItemToCart executes successfully
- [ ] Cart created in Supabase if doesn't exist
- [ ] Cart items inserted correctly
- [ ] Quantities tracked properly
- [ ] Total calculated correctly
- [ ] Card shows all items with prices

**Known Bugs**:
- ⚠️ To be tested

**Status**: ⏳ PENDING

---

#### Step 5: Checkout
**User Input**: "Lets proceed to checkout" or "yes, place my order"

**Expected Behavior**:
- Tool Called: `submitCartOrder` or `checkout`
- Card Displayed: `OrderConfirmationCard` with order details
- Response Should Include:
  - Order ID
  - Order total
  - Estimated delivery time
  - Items ordered
  - Restaurant name
  - Success confirmation

**Validation**:
- [ ] Checkout tool executes successfully
- [ ] Order created in Supabase fc_orders table
- [ ] Order items linked correctly
- [ ] Cart cleared after order
- [ ] Order ID generated
- [ ] All order details present in response

**Known Bugs**:
- ⚠️ To be tested

**Status**: ⏳ PENDING

---

## Use Case 2: LiveKit Direct Voice Ordering

**Pipeline**: LiveKit (Voice Chat)  
**Endpoint**: `/api/voice-chat`  
**Pattern**: Direct, immediate commands with minimal back-and-forth  
**User Experience**: Fast, action-oriented, voice-first

### Flow Steps

#### Step 1: Direct Food Request
**User Input**: "can you help me find a cheesecake with no chocolate"

**Expected Behavior**:
- Tool Called: `findFoodItem` with query="cheesecake" and dietary filter="no chocolate"
- Card Displayed: `MenuItemSpotlightCard` with cheesecake options
- Response Should Include:
  - Multiple cheesecake options from different restaurants
  - Restaurants that have matching items
  - Prices and descriptions
  - No chocolate options highlighted
  - Direct offer to add to cart

**Validation**:
- [ ] findFoodItem executes with correct search parameters
- [ ] Supabase query filters properly
- [ ] Multiple restaurants with cheesecakes returned
- [ ] No chocolate items excluded
- [ ] Card renders with food images if available
- [ ] Response is concise (1-2 sentences)

**Known Bugs**:
- ❌ `Cannot read properties of undefined (reading 'map')` error (same as AI-SDK)
- ⚠️ Tools not executing at all in current state
- ⚠️ No errors logged to console

**Status**: 🔴 BROKEN

---

#### Step 2: Add Multiple Items to Cart
**User Input**: "I want to add the lemon and strawberry cheesecake from Island Breeze to my cart"

**Expected Behavior**:
- Tool Called: `quickAddToCart` with multiple items in additionalItems array
- Card Displayed: `ShoppingCartCard` (voiceCart)
- Response Should Include:
  - Confirmation of both items added
  - Total quantity (2 items)
  - Total price
  - Brief cart summary
  - Automatic checkout offer

**Validation**:
- [ ] quickAddToCart executes with additionalItems
- [ ] Both items added in single tool call
- [ ] voiceCart persistent storage updated
- [ ] Cart totals calculated correctly
- [ ] Response mentions both items

**Known Bugs**:
- ⚠️ To be tested after Step 1 fixes

**Status**: ⏳ PENDING STEP 1 FIX

---

#### Step 3: Automatic Checkout
**User Input**: (implicit) Assistant proceeds with checkout

**Expected Behavior**:
- Tool Called: `quickCheckout` automatically or with minimal confirmation
- Card Displayed: `OrderConfirmationCard` with order details
- Response Should Include:
  - Order placed confirmation
  - Order ID
  - Estimated arrival time
  - Total amount
  - Restaurant name
  - Brief, voice-friendly summary

**Validation**:
- [ ] quickCheckout executes successfully
- [ ] Order created in Supabase
- [ ] voiceCart cleared after order
- [ ] Order details complete
- [ ] Response is concise and voice-optimized

**Known Bugs**:
- ⚠️ To be tested

**Status**: ⏳ PENDING

---

## Key Differences: AI-SDK vs LiveKit

| Aspect | AI-SDK (`/api/food-chat`) | LiveKit (`/api/voice-chat`) |
|--------|---------------------------|------------------------------|
| **Interaction Style** | Conversational, exploratory | Direct, action-oriented |
| **Profile Loading** | Explicit getUserContext call | Optional getUserProfile |
| **Search Pattern** | Location first, then browse | Direct item search |
| **Tools Available** | 20+ comprehensive tools | 6 streamlined voice tools |
| **Response Length** | Detailed, explanatory | Concise, 1-2 sentences |
| **Cart Management** | Multi-step (browse → add → confirm) | Quick (add → auto-checkout) |
| **User Guidance** | Asks clarifying questions | Assumes intent, acts fast |

---

## Shared Components (Should Work for Both)

### Cards
- `ProfilePreferencesCard` - User profile display
- `RestaurantSearchCard` - Restaurant list with filters
- `RestaurantMenuCard` - Full menu display
- `MenuItemSpotlightCard` - Individual food items
- `ShoppingCartCard` - Cart contents
- `OrderConfirmationCard` - Order summary

### Database Tables (Supabase)
- `fc_preferences` - User preferences
- `fc_restaurants` - Restaurant data
- `fc_menu_items` - Menu items
- `fc_cart` - Shopping carts
- `fc_cart_items` - Cart contents
- `fc_orders` - Completed orders

---

## Test Execution Checklist

### Phase 1: Current State Analysis (BEFORE FIXES)
- [x] Run: `npm run test:ai-sdk` - Expected: FAIL ❌
- [x] Run: `npm run test:livekit` - Expected: FAIL ❌
- [ ] Document all error messages
- [ ] Identify which steps fail
- [ ] Map errors to specific tool calls
- [ ] Understand root cause of each error

### Phase 2: Bug Documentation
- [ ] List all bugs discovered with evidence
- [ ] Categorize bugs by severity (critical, high, medium, low)
- [ ] Identify if bugs affect one or both pipelines
- [ ] Document expected vs actual behavior for each bug

### Phase 3: Fix Application
- [ ] Fix #1: Remove `rating` column from fetchRecentOrders
- [ ] Fix #2: Correct FALLBACK_PREFERENCES type consistency
- [ ] Fix #3: Add null coalescing to all array operations
- [ ] Test after each fix incrementally

### Phase 4: Validation (AFTER FIXES)
- [ ] Run: `npm run test:ai-sdk` - Expected: PASS ✅
- [ ] Run: `npm run test:livekit` - Expected: PASS ✅
- [ ] Run: `npm run test:pipelines` - Expected: ALL PASS ✅
- [ ] Manual UI testing for both pipelines
- [ ] Verify cards display correctly
- [ ] Confirm isolation (AI-SDK changes don't affect LiveKit)

---

## Bug Tracking

### Critical Bugs (Blocking All Flows)
**BUG-001**: `Cannot read properties of undefined (reading 'map')` error
- **Severity**: 🔴 CRITICAL
- **Affects**: Both AI-SDK and LiveKit
- **Description**: All API calls return streaming error, no tools execute
- **First Seen**: Commit 927187c (attempted incomplete fix)
- **Root Cause**: TBD - need deeper investigation
- **Tools Affected**: All tools (none execute)
- **Status**: 🔴 UNRESOLVED
- **Next Steps**: 
  1. Add better error logging to catch actual error location
  2. Check if AI SDK version compatibility issue
  3. Verify tools export correctly
  4. Test with minimal tool set

### Database Schema Errors
**BUG-002**: Rating column query error
- **Severity**: 🟠 HIGH
- **Affects**: AI-SDK (food-chat)
- **Description**: fetchRecentOrders queries non-existent `rating` column
- **Location**: `app/api/food-chat/tools.ts` - fetchRecentOrders function
- **Root Cause**: Database schema doesn't include rating column in fc_orders
- **Status**: ⚠️ FIX ATTEMPTED (commit 927187c) - NEEDS VALIDATION
- **Fix**: Remove rating column from SELECT query

### Type Safety Errors  
**BUG-003**: FALLBACK type mismatch
- **Severity**: 🟡 MEDIUM
- **Affects**: AI-SDK (food-chat)
- **Description**: fetchFoodPreferences returns wrong type on error
- **Location**: `app/api/food-chat/tools.ts` - fetchFoodPreferences function
- **Root Cause**: Returns FALLBACK_PREFERENCES instead of FALLBACK_PREFERENCE_RECORD
- **Status**: ⚠️ FIX ATTEMPTED (commit 927187c) - NEEDS VALIDATION
- **Fix**: Ensure consistent return type

### Null Safety Errors
**BUG-004**: Missing null coalescing on arrays
- **Severity**: 🟡 MEDIUM  
- **Affects**: AI-SDK (food-chat)
- **Description**: Array operations without null coalescing cause crashes
- **Location**: `app/api/food-chat/tools.ts` - getUserContext function
- **Root Cause**: `recentOrders.map()` called without checking if array exists
- **Status**: ⚠️ FIX ATTEMPTED (commit 927187c) - NEEDS VALIDATION
- **Fix**: Add `?? []` before all `.map()`, `.slice()`, `.filter()` operations

---

## Test Scripts Alignment

### Current Test Scripts
1. `test-ai-sdk-orlando-search.js` - Tests Steps 1-2 of AI-SDK flow ✅
2. `test-ai-sdk-get-context.js` - Tests Step 1 profile loading ✅
3. `test-ai-sdk-end-to-end.js` - Tests complete AI-SDK flow (Steps 1-5) ✅
4. `test-livekit-regression.js` - Tests LiveKit flow (Steps 1-3) ✅
5. `run-all-tests.js` - Runs all tests with comprehensive reporting ✅

### Test Coverage Analysis
- ✅ AI-SDK Step 1 (Initial Request) - Covered
- ✅ AI-SDK Step 2 (Location) - Covered
- ⚠️ AI-SDK Step 3 (Menu) - Partially covered in end-to-end
- ⚠️ AI-SDK Step 4 (Add to Cart) - Partially covered in end-to-end
- ⚠️ AI-SDK Step 5 (Checkout) - Partially covered in end-to-end
- ✅ LiveKit Step 1 (Direct Search) - Covered
- ⚠️ LiveKit Step 2 (Multi-item Cart) - Partially covered
- ⚠️ LiveKit Step 3 (Auto Checkout) - Partially covered

### Recommended Additional Tests
- [ ] `test-ai-sdk-menu-browsing.js` - Isolated menu browsing test
- [ ] `test-ai-sdk-cart-operations.js` - Isolated cart management test
- [ ] `test-livekit-multi-item.js` - Test multiple items in single command
- [ ] `test-shared-components.js` - Verify cards render for both pipelines

---

## Success Criteria

### AI-SDK Pipeline Success
- ✅ getUserContext loads profile without errors
- ✅ searchRestaurants returns Orlando restaurants
- ✅ getRestaurantMenu displays Island Breeze menu
- ✅ addItemToCart adds coconut shrimp successfully
- ✅ submitCartOrder creates order with confirmation
- ✅ All cards render correctly
- ✅ Database queries execute without errors
- ✅ No undefined/null safety issues

### LiveKit Pipeline Success
- ✅ findFoodItem searches cheesecake without chocolate
- ✅ quickAddToCart adds multiple items in one call
- ✅ quickCheckout completes order automatically
- ✅ All cards render correctly
- ✅ Responses are concise (voice-optimized)
- ✅ No undefined/null safety issues

### Isolation Success
- ✅ Changes to AI-SDK don't break LiveKit
- ✅ Changes to LiveKit don't break AI-SDK
- ✅ Both pipelines can run simultaneously
- ✅ Shared components work for both
- ✅ Database operations don't conflict

---

## Next Steps

1. **Immediate**: Investigate BUG-001 (critical blocking error)
2. **Then**: Run current test suite to document all failures
3. **Document**: Update this file with all discovered bugs
4. **Strategize**: Plan fix order based on dependencies
5. **Execute**: Apply fixes incrementally with validation
6. **Verify**: Re-run all tests to confirm resolution
7. **Validate**: Manual UI testing for both pipelines

---

## Notes

- **Test Environment**: Local development server on `localhost:3000`
- **Test Data**: Uses Supabase database with seed data
- **Fallback Data**: Uses sample data from `/data/foodCourtSamples.ts` if Supabase unavailable
- **API Keys Required**: OpenAI API key in `.env.local`
- **Database Required**: Supabase connection configured in `.env.local`

---

**Maintained by**: Development Team  
**Reference Documents**:
- [AI_SDK_ANALYSIS.md](./AI_SDK_ANALYSIS.md) - Root cause analysis
- [CHAT_FLOW_DESIGN.md](./CHAT_FLOW_DESIGN.md) - Architecture overview
- [Test Scripts](../scripts/) - Automated test implementations
