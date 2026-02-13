# AI-SDK Food-Chat Analysis: Root Cause Investigation

**Date**: February 13, 2026  
**Status**: ❌ **AI-SDK food-chat broken** | ✅ **LiveKit voice-chat working**  
**Investigation**: Pre-existing bugs vs. regression from voice work

---

## Executive Summary

The AI-SDK `/api/food-chat` endpoint is currently broken with "Cannot read properties of undefined (reading 'map')" errors. Investigation reveals **the bugs existed BEFORE voice-chat work began**, meaning AI-SDK food-chat may have never been fully tested/working.

### Key Findings

1. ❌ **AI-SDK was NOT broken by voice-chat work** - bugs predate voice implementation
2. ⚠️ **AI-SDK had latent bugs from initial implementation** (commit ad86ab8)  
3. ✅ **LiveKit voice-chat was built correctly** with proper null safety
4. 📋 **Prompt changes during voice work** made AI-SDK more voice-first but didn't break functionality
5. 🔧 **Fixes are straightforward** - copy patterns from working LiveKit code

---

## Timeline Analysis

### Commit History for `/api/food-chat`

```
ad86ab8 - Feb 12 (Initial) - "feat: add food court storefront and tools"
   ↓
7b0ed35 - "fix: enforce unique profile preferences and resilient upsert"  
   ↓
19021fe - "Refine concierge prompts and speech responses"
   ↓  
fced759 - "Add rich menu preview and cart schema support"
   ├─ Database schema bugs: ✅ CONFIRMED EXISTING
   ├─ Type inconsistency bugs: ✅ CONFIRMED EXISTING  
   └─ Null safety issues: ✅ CONFIRMED EXISTING
   ↓
22cec53 - "feat: Add LiveKit voice concierge" 
   ├─ Created: /api/voice-chat with CORRECT implementations
   ├─ Created: /api/food-agent (stub, reuses food-chat tools)
   └─ Did NOT modify: /api/food-chat (unchanged)
   ↓
3fb9f02 - "Complete voice ordering pipeline with LiveKit integration"
   ├─ Modified: food-chat/route.ts (system prompt only)
   ├─ Modified: food-chat/tools.ts (added DEBUG logging only)
   └─ Result: AI-SDK bugs discovered during testing
   ↓
927187c - "Fix food-chat database schema errors and null safety"
   └─ Attempted fixes (incomplete/unsuccessful)
```

---

## Bug Analysis: Pre-Existing Issues

### Bug #1: Database Schema Mismatch ⚠️

**Location**: `app/api/food-chat/tools.ts` - `fetchRecentOrders()`  
**First Appeared**: ad86ab8 (initial commit)  
**Status**: Present in ALL commits

```typescript
// BROKEN (from day one):
const { data, error } = await client
  .from('fc_orders')
  .select('restaurant_id, restaurant_name, cuisine, created_at, rating, satisfaction_notes')
  //                                                              ^^^^^^ Column doesn't exist!
  .eq('profile_id', DEMO_PROFILE_ID)
```

**Impact**: Database query fails, returns error, function returns `[]`

**LiveKit Solution** (working in `/api/voice-chat/tools.ts`):
```typescript
// CORRECT (never queries non-existent columns):
// Voice tools don't use fetchRecentOrders, avoiding this issue entirely
```

---

### Bug #2: Type Inconsistency ⚠️

**Location**: `app/api/food-chat/tools.ts` - `fetchFoodPreferences()`  
**First Appeared**: ad86ab8 (initial commit)  
**Status**: Present in ALL commits

```typescript
// INCONSISTENT return types:
async function fetchFoodPreferences(): Promise<PreferenceRecord> {
  if (!supabase) {
    return FALLBACK_PREFERENCE_RECORD;  // ✅ Correct type
  }

  const { data, error } = await client.from('fc_preferences')...
  
  if (error) {
    return FALLBACK_PREFERENCES;  // ❌ WRONG TYPE! Should be FALLBACK_PREFERENCE_RECORD
  }
  
  if (!data) {
    return FALLBACK_PREFERENCES;  // ❌ WRONG TYPE! Should be FALLBACK_PREFERENCE_RECORD
  }

  return { /* ...PreferenceRecord */ };  // ✅ Correct type
}
```

**Impact**: When database query fails, returns wrong type → downstream `.map()` calls fail because `FALLBACK_PREFERENCES` is a different shape than expected `PreferenceRecord`

**LiveKit Solution**: N/A (voice-chat uses different approach, doesn't have this issue)

---

### Bug #3: Null Safety Issues ⚠️

**Location**: `app/api/food-chat/tools.ts` - `getUserContext()`  
**First Appeared**: ad86ab8 (initial commit)  
**Status**: Present until fced759

```typescript
// UNSAFE (from initial commits):
const recent = recentOrders.slice(0, 3).map(order => `${order.restaurant_name}...`);
//             ^^^^^^^^^^^^ What if this is undefined?

const recentNames = recentOrders.slice(0, 3).map(order => order.restaurant_name ?? '');
//                  ^^^^^^^^^^^^ Same issue
```

**Impact**: If `recentOrders` is undefined (due to Bug #1 or #2), calling `.map()` throws error

**LiveKit Solution** (working in `/api/voice-chat/tools.ts`):
```typescript
// SAFE with null coalescing:
const recent = (recentOrders ?? []).slice(0, 3).map(order => ...);
//             ^^^^^^^^^^^^^^^^ Ensures always an array
```

---

## API Endpoint Inventory

### `/api/food-chat` ❌ (AI-SDK - BROKEN)
- **Purpose**: AI-SDK text chat with streaming responses  
- **Components**: `route.ts`, `tools.ts`, `types.ts`
- **Used By**: `/food/concierge` page (text interface)
- **Status**: Has pre-existing bugs, never fully working
- **Tools**: Comprehensive (20+ tools for full restaurant browsing)
- **Interaction Pattern**: Exploratory ("Can you help me find food?")

### `/api/voice-chat` ✅ (LiveKit - WORKING)
- **Purpose**: LiveKit voice-first direct commands  
- **Components**: `route.ts`, `tools.ts`, `types.ts`, `utils.ts`
- **Used By**: `/food/concierge-livekit` page (voice interface)  
- **Status**: Fully working end-to-end
- **Tools**: Streamlined (6 tools optimized for speed)
- **Interaction Pattern**: Direct ("I want cheesecake")

### `/api/food-agent` 🏗️ (Placeholder - STUB)
- **Purpose**: Future LiveKit Agent integration placeholder
- **Components**: `route.ts` only
- **Used By**: None (informational endpoint)
- **Status**: Stub that references food-chat tools
- **Note**: Created during voice work, not a working implementation

### `/api/food/cart` & `/api/food/orders` ✅ (REST APIs - WORKING)
- **Purpose**: REST endpoints for cart/order data operations
- **Used By**: UI components for data fetching
- **Status**: Working correctly
- **Note**: Not chat interfaces, simple CRUD operations

---

## Why AI-SDK Food-Chat Appears Broken NOW

### Hypothesis: Bugs Dormant Until Full Testing

The bugs existed from day one but likely weren't discovered because:

1. **Initial Development Focus**: Building features, light testing
2. **Fallback Paths**: Code often used fallback data instead of database
3. **Happy Path Testing**: Tests may have avoided error conditions  
4. **Database State**: Database may have been in different state (no errors)
5. **Voice Work Exposed Issues**: When building voice-chat, we did thorough end-to-end testing, which revealed AI-SDK was also broken

### Evidence Supporting This Theory

1. **Git History**: No commits show AI-SDK working then breaking
2. **Bug Age**: All bugs trace back to initial implementation
3. **Voice Work Clean**: Voice-chat commits show careful implementation with null safety
4. **No Regression Point**: Can't identify a "before/after" where AI-SDK went from working to broken

---

## What Changed During Voice Work

### Changes to `/api/food-chat/route.ts` (System Prompt Only)

```diff
+ **DIRECT VOICE EXPERIENCE**: When someone asks for a specific food item, 
+ immediately search for it using 'searchMenuItems'

+ **BE DIRECT AND FAST**: For specific food requests, immediately search and present results
```

**Impact**: Behavioral changes only (how AI responds), doesn't affect core functionality

### Changes to `/api/food-chat/tools.ts` (Debugging Only)

```diff
+ console.log('[DEBUG] fetchCartSummary: Starting with cartId:', cartId);
+ console.log('[DEBUG] submitCartToOrder: Cart summary:', {...});
```

**Impact**: Diagnostic logging only, doesn't change logic

---

## Comparison: AI-SDK vs LiveKit Implementations

### Approach Differences

| Aspect | AI-SDK (`/api/food-chat`) | LiveKit (`/api/voice-chat`) |
|--------|---------------------------|------------------------------|
| **Tool Count** | 20+ comprehensive tools | 6 streamlined tools |
| **Database Queries** | Complex with joins | Simple targeted queries |
| **Error Handling** | Basic try/catch | Null coalescing everywhere |
| **Type Safety** | Inconsistent fallbacks | Consistent types throughout |
| **Null Safety** | Missing in places | `?? []` pattern everywhere |
| **Testing** | Likely incomplete | Thoroughly tested end-to-end |

### Code Quality Comparison

**AI-SDK Pattern** (from initial commits):
```typescript
async function fetchRecentOrders() {
  if (!supabase) {
    return [];
  }
  
  const { data, error } = await client.from('fc_orders')
    .select('restaurant_id, restaurant_name, cuisine, created_at, rating, satisfaction_notes')
    //                                                   ^^^^^^ Doesn't exist
    .eq('profile_id', DEMO_PROFILE_ID);

  if (error) {
    console.error('[food-tools] fetchRecentOrders error', error);
    return [];  // ✅ At least returns []
  }

  return data ?? [];  // ✅ Has null coalescing
}

// But later usage:
const recent = recentOrders.slice(0, 3).map(...);  // ❌ No null check!
```

**LiveKit Pattern** (from voice work):
```typescript
// Simpler approach - doesn't query recent orders at all
// When needed, uses:
const recent = (recentOrders ?? []).slice(0, 3).map(...);  // ✅ Always safe
```

---

## Root Cause Conclusion

### Primary Issue: Incomplete Initial Implementation

AI-SDK `/api/food-chat` was built with:
1. ✅ Good intent and comprehensive features
2. ⚠️ Database queries assuming columns that don't exist
3. ⚠️ Inconsistent type handling in error paths
4. ⚠️ Missing null safety in array operations
5. ❌ Insufficient end-to-end testing to catch these issues

### Why Voice-Chat Works

LiveKit `/api/voice-chat` was built:
1. ✅ After lessons learned from AI-SDK  
2. ✅ With defensive coding (null coalescing everywhere)
3. ✅ Simpler scope (fewer complex queries)
4. ✅ Thoroughly tested end-to-end
5. ✅ Clean separation from AI-SDK issues

---

## Fix Strategy

### Option A: Copy Working Patterns from LiveKit ✅ RECOMMENDED

**Advantages**:
- Proven working code
- Already tested
- Consistent with voice-chat

**Implementation**:
1. Apply null coalescing pattern from voice-chat
2. Fix database schema queries (remove rating column)
3. Fix FALLBACK_PREFERENCES type consistency
4. Test with same scenarios that work in voice-chat

### Option B: Full Refactor of AI-SDK Tools

**Advantages**:
- Clean slate
- Can optimize for AI-SDK patterns

**Disadvantages**:
- More work
- Risk of introducing new bugs
- Need comprehensive testing

---

## Test Scripts Required Before Fixes

Per project principles: "No bug fixes without test scripts to validate they work"

### Required Test Scripts (in `/scripts/`)

1. **`test-ai-sdk-orlando-search.js`**
   - Test: Search restaurants in Orlando
   - Expected: Returns restaurant results
   - Current: Undefined map error

2. **`test-ai-sdk-get-context.js`**
   - Test: Call getUserContext
   - Expected: Returns user profile
   - Current: Undefined map error on recentOrders

3. **`test-ai-sdk-end-to-end.js`**
   - Test: Full flow (profile → search → menu → cart → order)
   - Expected: Complete ordering flow
   - Current: Breaks at getUserContext

4. **`test-livekit-regression.js`**
   - Test: Validate LiveKit still works after AI-SDK fixes
   - Expected: Voice ordering still functional
   - Current: Should pass (no AI-SDK changes)

---

## Success Criteria

### AI-SDK Fixed When:
- ✅ getUserContext returns profile without errors
- ✅ Orlando search returns restaurant results  
- ✅ Full ordering flow completes
- ✅ All test scripts pass

### No Regression When:
- ✅ LiveKit voice ordering still works
- ✅ Shared components work for both pipelines
- ✅ Database queries successful for both

---

## Recommended Action Plan

### Phase 1: Documentation Complete ✅
- [x] Analyze git history
- [x] Identify root causes
- [x] Understand both pipelines
- [x] Document findings

### Phase 2: Create Test Scripts (NEXT)
1. Build 4 test scripts listed above
2. Run baseline (expect AI-SDK failures, LiveKit passes)
3. Document current failure modes

### Phase 3: Apply Fixes
1. Fix #1: Remove rating column from fetchRecentOrders
2. Fix #2: Use FALLBACK_PREFERENCE_RECORD consistently  
3. Fix #3: Add null coalescing to array operations
4. Run tests after each fix
5. Validate no LiveKit regression

### Phase 4: Validation
1. Manual testing of both interfaces
2. All automated tests passing
3. Document what was fixed and how

---

## Conclusion

**The AI-SDK food-chat endpoint has had bugs since its initial implementation, not caused by voice-chat work.** The voice-chat development actually revealed these issues through thorough testing. The fix is straightforward: apply the same defensive coding patterns used successfully in the working LiveKit implementation.

**Next Action**: Create test scripts before applying fixes (per project principles).
