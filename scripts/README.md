# Pipeline Test Scripts

Test suite for validating AI-SDK and LiveKit pipeline isolation and functionality.

## Overview

These tests validate:
- **AI-SDK food-chat**: Exploratory conversational ordering flow
- **LiveKit voice-chat**: Direct voice command execution
- **Pipeline isolation**: Changes to one don't break the other
- **Shared components**: Both pipelines use the same UI cards

## Quick Start

```bash
# Run all tests (recommended)
npm run test:pipelines

# Or run individually:
npm run test:ai-sdk         # Full AI-SDK conversational flow
npm run test:ai-sdk:search  # Just Orlando restaurant search
npm run test:ai-sdk:context # Just getUserContext profile loading
npm run test:livekit        # LiveKit voice pipeline regression
```

## Test Scripts

### 1. `test-livekit-regression.js`
**Purpose**: Ensure LiveKit voice pipeline remains functional

**Tests**:
- Endpoint availability (`/api/voice-chat`)
- Voice-optimized tools (6 streamlined tools)
- Direct command pattern: "I want cheesecake"
- Quick cart operations
- Quick checkout

**Expected**: ✅ PASS before AND after AI-SDK fixes

**Why**: Validates pipeline isolation - AI-SDK changes shouldn't affect LiveKit

---

### 2. `test-ai-sdk-get-context.js`
**Purpose**: Test profile and preferences loading

**Tests**:
- `getUserContext` tool execution
- Profile preferences retrieval
- Recent orders loading
- No database errors (rating column)
- No type mismatches (FALLBACK types)
- Proper null safety (array operations)

**Expected**:
- ❌ FAIL before fixes (3 known bugs)
- ✅ PASS after fixes applied

**Bugs tested**:
1. Database query for non-existent `rating` column
2. Type mismatch: `FALLBACK_PREFERENCES` vs `FALLBACK_PREFERENCE_RECORD`
3. Null safety: `recentOrders.map()` without `?? []`

---

### 3. `test-ai-sdk-orlando-search.js`
**Purpose**: Test restaurant search in Orlando

**Tests**:
- Initial "help me find food" request
- Location specification: "I'm in Orlando"
- Restaurant results returned
- No undefined/error messages

**Expected**:
- ❌ FAIL before fixes
- ✅ PASS after fixes applied

**Flow**:
1. User: "can you help me find something to eat?"
2. Assistant: asks for location
3. User: "I'm in Orlando"
4. Assistant: shows Orlando restaurants

---

### 4. `test-ai-sdk-end-to-end.js`
**Purpose**: Test complete conversational ordering flow

**Tests**: Multi-turn conversation from search to order placement

**Flow**:
1. User: "can you help me find something to eat"
2. Assistant: shows profile, asks for city
3. User: "I'm in Orlando"
4. Assistant: shows nearby restaurants
5. User: "lets look at the menu for Island Breeze"
6. Assistant: shows Island Breeze menu
7. User: "I'd like coconut shrimp and jerk chicken added to cart"
8. Assistant: shows cart, asks to confirm
9. User: "yes, lets place the order"
10. Assistant: shows completed order confirmation

**Expected**:
- ❌ FAIL before fixes
- ✅ PASS after fixes applied

**Why**: This is the complete AI-SDK experience - exploratory, conversational, multi-turn dialogue (contrasts with LiveKit's direct commands)

---

### 5. `run-all-tests.js`
**Purpose**: Master test runner for comprehensive validation

**Runs tests in order**:
1. LiveKit baseline (should pass)
2. AI-SDK Get Context
3. AI-SDK Orlando Search
4. AI-SDK End-to-End Flow
5. LiveKit final (should still pass)

**Features**:
- Comprehensive summary report
- Pipeline isolation analysis
- Detailed failure diagnostics
- Recommended next steps
- Stops on critical test failures

## Current State

### Before Fixes
```
✅ LiveKit: Working (voice commands fully functional)
❌ AI-SDK: Broken (3 bugs in food-chat/tools.ts)
```

Expected test results:
- ✅ `test-livekit-regression.js` - PASS
- ❌ `test-ai-sdk-get-context.js` - FAIL
- ❌ `test-ai-sdk-orlando-search.js` - FAIL
- ❌ `test-ai-sdk-end-to-end.js` - FAIL

### After Fixes
```
✅ LiveKit: Still working (isolation verified)
✅ AI-SDK: Fixed (conversational flow operational)
```

Expected test results:
- ✅ All tests PASS
- ✅ Pipeline isolation confirmed

## Fixing AI-SDK

### Root Cause Analysis
See [docs/AI_SDK_ANALYSIS.md](../docs/AI_SDK_ANALYSIS.md) for comprehensive investigation.

**Summary**: Bugs existed from initial commit (ad86ab8), not caused by voice work.

### The 3 Fixes

Apply these fixes to `/app/api/food-chat/tools.ts`:

#### Fix #1: Remove rating column
```typescript
// BEFORE (broken)
const { data: orders } = await supabase
  .from('fc_orders')
  .select('*, rating')  // ❌ rating column doesn't exist

// AFTER (fixed)
const { data: orders } = await supabase
  .from('fc_orders')
  .select('*')  // ✅ Remove rating column
```

#### Fix #2: Fix type mismatch
```typescript
// BEFORE (broken)
return FALLBACK_PREFERENCES;  // ❌ Wrong type

// AFTER (fixed)
return FALLBACK_PREFERENCE_RECORD;  // ✅ Correct type
```

#### Fix #3: Add null coalescing
```typescript
// BEFORE (broken)
recentOrders.slice(0, 3).map()  // ❌ Can be null/undefined

// AFTER (fixed)
(recentOrders ?? []).slice(0, 3).map()  // ✅ Null safe
```

### Fix Application Process

1. **Baseline test** (before fixes):
   ```bash
   npm run test:pipelines
   ```
   Expected: AI-SDK tests fail, LiveKit passes

2. **Apply Fix #1** (rating column)
   ```bash
   # Edit app/api/food-chat/tools.ts
   npm run test:ai-sdk:context
   ```

3. **Apply Fix #2** (type mismatch)
   ```bash
   # Edit app/api/food-chat/tools.ts
   npm run test:ai-sdk:context
   ```

4. **Apply Fix #3** (null coalescing)
   ```bash
   # Edit app/api/food-chat/tools.ts
   npm run test:ai-sdk:context
   ```

5. **Full validation**:
   ```bash
   npm run test:pipelines
   ```
   Expected: All tests pass, including LiveKit regression

## Pipeline Architecture

### AI-SDK Flow (Conversational)
- **Endpoint**: `/api/food-chat`
- **Tools**: 20+ comprehensive tools
- **Pattern**: Multi-turn exploratory dialogue
- **Example**: "I'm hungry" → "What city?" → "Orlando" → "Here are restaurants..."

### LiveKit Flow (Direct Commands)
- **Endpoint**: `/api/voice-chat`
- **Tools**: 6 streamlined voice-optimized tools
- **Pattern**: Single-turn direct actions
- **Example**: "I want cheesecake in Orlando" → immediate results

### Isolation Principles
- Separate endpoints: `/api/food-chat` vs `/api/voice-chat`
- Separate tool files: `food-chat/tools.ts` vs `voice-chat/tools.ts`
- Shared components: Both use `/components/food-cards/`
- Shared database: Both use Supabase with same schema
- Independent conversations: Changes to one don't affect the other

## Troubleshooting

### Dev server not running
```bash
npm run dev
```

### Tests timing out
Make sure dev server is running on `http://localhost:3000`

### LiveKit regression detected
```bash
# Check voice-chat endpoint directly
curl http://localhost:3000/api/voice-chat

# Rollback AI-SDK changes if LiveKit broken
git checkout app/api/food-chat/tools.ts
```

### AI-SDK still failing after fixes
```bash
# Check syntax errors
npm run lint

# Verify all 3 fixes applied
git diff app/api/food-chat/tools.ts

# Check database connection
node scripts/test-supabase.js
```

## Documentation

- [CHAT_FLOW_DESIGN.md](../docs/CHAT_FLOW_DESIGN.md) - Pipeline architecture overview
- [AI_SDK_ANALYSIS.md](../docs/AI_SDK_ANALYSIS.md) - Root cause investigation
- [PROJECT_PLAN.md](../docs/PROJECT_PLAN.md) - Overall project goals

## Success Criteria

✅ **Pipeline Isolation**: AI-SDK fixes don't break LiveKit  
✅ **Conversational Flow**: Full multi-turn dialogue works  
✅ **Voice Flow**: Direct commands still functional  
✅ **Shared Components**: Both pipelines render same UI  
✅ **Test Coverage**: All 5 tests passing  

---

**Last Updated**: February 13, 2026  
**Status**: Test suite ready, awaiting AI-SDK fixes
