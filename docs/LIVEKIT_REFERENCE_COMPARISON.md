# LiveKit Reference Implementation Comparison

**Date:** February 14, 2026  
**Purpose:** Compare our implementation vs LiveKit's official working examples  
**Reference:** https://github.com/livekit/agents (cloned to `/livekit-reference/agents`)

---

## 🎯 Key Discovery

LiveKit has a **working drive-thru food ordering agent** at:
- Path: `examples/drive-thru/agent.py`
- Lines: 449 lines
- Functionality: Combo meals, happy meals, regular items, drinks, sauces
- **THIS IS THE REFERENCE WE NEED!**

---

## Side-by-Side Comparison: Drive-Thru (LiveKit) vs Food Concierge (Ours)

### Architecture Pattern

**LiveKit Drive-Thru (Official):**
```python
from livekit.agents import (
    Agent,
    AgentServer,
    AgentSession,
    JobContext,
    RunContext,
)

server = AgentServer()

@server.rtc_session(on_session_end=on_session_end)
async def drive_thru_agent(ctx: JobContext) -> None:
    userdata = await new_userdata()
    session = AgentSession[Userdata](
        userdata=userdata,
        stt=inference.STT("deepgram/nova-3", language="en"),
        llm=inference.LLM("openai/gpt-4.1"),
        tts=inference.TTS("cartesia/sonic-3", voice="..."),
        turn_detection=MultilingualModel(),
        vad=silero.VAD.load(),
        max_tool_steps=10,
    )
    
    await session.start(
        agent=DriveThruAgent(userdata=userdata), 
        room=ctx.room
    )

if __name__ == "__main__":
    cli.run_app(server)
```

**Our Food Concierge (Current):**
```python
from livekit.agents import (
    JobContext,
    WorkerOptions,
    cli,
    llm,
)
from livekit.plugins import openai, silero
from livekit.agents import voice

# Create session (NEW v1.4.1 pattern)
session = AgentSession(
    stt=openai.STT(),
    llm=openai.LLM(model="gpt-4"),
    tts=openai.TTS(),
    vad=silero.VAD.load(),
)

await session.start(
    room=ctx.room,
    agent=FoodConciergeAgent(),
)
```

### Key Differences

| Aspect | LiveKit Official | Our Implementation | Issue? |
|--------|------------------|-------------------|---------|
| **Server Pattern** | `AgentServer` + `@server.rtc_session` | Old `cli` pattern | ⚠️ Using old API |
| **Session Creation** | `AgentSession[Userdata]` with typed userdata | `AgentSession()` untyped | ⚠️ Missing type safety |
| **STT/LLM/TTS** | `inference.STT/LLM/TTS` (unified API) | Direct `openai.STT/LLM/TTS` | ⚠️ Not using inference layer |
| **Turn Detection** | `MultilingualModel()` | None | ⚠️ Missing turn detection |
| **Max Tool Steps** | `max_tool_steps=10` | Not set | ⚠️ Could loop infinitely |
| **Userdata Pattern** | Typed dataclass with `RunContext[Userdata]` | Global state | ⚠️ Not using context properly |
| **On Session End** | `on_session_end` callback | None | ⚠️ No cleanup |

---

## Function Tool Pattern Comparison

### LiveKit Drive-Thru (Working)

**Key Pattern: All parameters are REQUIRED, use enum constraints**

```python
@function_tool
async def order_combo_meal(
    ctx: RunContext[Userdata],
    meal_id: Annotated[
        str,
        Field(
            description="The ID of the combo meal the user requested.",
            json_schema_extra={"enum": list(available_combo_ids)},
        ),
    ],
    drink_id: Annotated[
        str,
        Field(
            description="The ID of the drink the user requested.",
            json_schema_extra={"enum": list(available_drink_ids)},
        ),
    ],
    drink_size: Literal["M", "L", "null"] | None,  # ⚠️ USE "null" string, not None default
    fries_size: Literal["M", "L"],  # REQUIRED
    sauce_id: Annotated[
        str,
        Field(
            description="The ID of the sauce the user requested.",
            json_schema_extra={"enum": [*available_sauce_ids, "null"]},
        ),
    ] | None,
):
    """Tool docstring with detailed instructions for LLM."""
    
    # Handle "null" string to mean None
    if drink_size == "null":
        drink_size = None
    if sauce_id == "null":
        sauce_id = None
    
    # Validation logic
    if not find_items_by_id(combo_items, meal_id):
        raise ToolError(f"error: the meal {meal_id} was not found")
    
    # Use RunContext userdata
    item = OrderedCombo(
        meal_id=meal_id,
        drink_id=drink_id,
        drink_size=drink_size,
        sauce_id=sauce_id,
        fries_size=fries_size,
    )
    await ctx.userdata.order.add(item)
    return f"The item was added: {item.model_dump_json()}"
```

**Critical Insights:**
1. ✅ Use `Literal["M", "L", "null"]` instead of optional with default
2. ✅ Use `"null"` string and convert to None in function body
3. ✅ Use `json_schema_extra={"enum": [...]}` for constrained choices
4. ✅ Use `RunContext[Userdata]` for typed state access
5. ✅ Raise `ToolError` for validation failures
6. ✅ Return JSON response: `item.model_dump_json()`

### Our Food Concierge (Broken)

**Problem Pattern: Optional parameters with defaults**

```python
@llm.function_tool(description="...")
async def find_food_item_tool(
    query: str,
    max_results: int = 5  # ❌ BREAKS OpenAI schema validation
) -> str:
    result = await find_food_item(query, max_results)
    return json.dumps(result)

@llm.function_tool(description="...")
async def get_user_profile_tool(
    profile_id: str | None = None  # ❌ BREAKS schema validation
) -> str:
    result = await get_user_profile(profile_id)
    return json.dumps(result)

@llm.function_tool(description="...")
async def quick_add_to_cart_tool(
    item_name: str,
    quantity: int = 1,  # ✅ This one actually works
    restaurant_name: str | None = None,  # ❌ BREAKS
    additional_items: list | None = None  # ❌ BREAKS
) -> str:
    result = add_to_voice_cart(item_name, restaurant_name, quantity, additional_items)
    return json.dumps(result)
```

**Why It Breaks:**
1. ❌ `int = 5` - Default values break OpenAI function schema
2. ❌ `str | None = None` - Union with None breaks schema
3. ❌ `list | None = None` - Generic list with None breaks schema
4. ❌ No `Annotated` with Field constraints
5. ❌ No enum constraints for valid choices
6. ❌ Not using `RunContext` for state

---

## How to Fix Our Implementation

### 1. Switch to AgentServer Pattern

**Change from:**
```python
async def entrypoint(ctx: JobContext):
    session = AgentSession(...)
    await session.start(room=ctx.room, agent=FoodConciergeAgent())

if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))
```

**Change to:**
```python
server = AgentServer()

@server.rtc_session()
async def food_concierge_agent(ctx: JobContext) -> None:
    session = AgentSession[UserState](
        userdata=await new_userdata(),
        stt=inference.STT("deepgram/nova-3", language="en"),
        llm=inference.LLM("openai/gpt-4.1"),
        tts=inference.TTS("cartesia/sonic-3", voice="..."),
        turn_detection=MultilingualModel(),
        vad=silero.VAD.load(),
        max_tool_steps=10,
    )
    await session.start(agent=FoodConciergeAgent(userdata=userdata), room=ctx.room)

if __name__ == "__main__":
    cli.run_app(server)
```

### 2. Use inference.STT/LLM/TTS Instead of Direct Plugins

**Change from:**
```python
from livekit.plugins import openai

stt=openai.STT(),
llm=openai.LLM(model="gpt-4"),
tts=openai.TTS(),
```

**Change to:**
```python
from livekit.agents import inference

stt=inference.STT("deepgram/nova-3", language="en"),
llm=inference.LLM("openai/gpt-4.1"),
tts=inference.TTS("cartesia/sonic-3", voice="f786b574-daa5-4673-aa0c-cbe3e8534c02"),
```

**Why:** `inference` provides a unified API across providers and better schema handling.

### 3. Fix Function Parameters (CRITICAL)

**Change from:**
```python
@llm.function_tool(description="Find food items")
async def find_food_item_tool(
    query: str,
    max_results: int = 5  # ❌ BREAKS
) -> str:
```

**Change to (Option A - Remove Parameter):**
```python
@function_tool
async def find_food_item_tool(
    ctx: RunContext[UserState],
    query: str,
    # Remove max_results entirely, use hardcoded default
) -> str:
    max_results = 5  # Use inside function
    result = await find_food_item(query, max_results)
```

**Change to (Option B - Use Literal with "null"):**
```python
@function_tool
async def find_food_item_tool(
    ctx: RunContext[UserState],
    query: str,
    max_results: Literal["3", "5", "10", "null"]  # String literals
) -> str:
    # Convert string to int
    if max_results == "null":
        max_results_int = 5
    else:
        max_results_int = int(max_results)
    
    result = await find_food_item(query, max_results_int)
```

### 4. Use Typed Userdata with RunContext

**Create userdata class:**
```python
@dataclass
class UserState:
    user_id: str | None = None
    cart_id: str | None = None
    profile: dict | None = None
    
async def new_userdata() -> UserState:
    return UserState()
```

**Use in tools:**
```python
@function_tool
async def quick_add_to_cart_tool(
    ctx: RunContext[UserState],  # ✅ Access typed state
    item_name: str,
    quantity: Literal["1", "2", "3", "4", "5"],  # ✅ No default
) -> str:
    user_id = ctx.userdata.user_id
    cart_id = ctx.userdata.cart_id
    # ...
```

### 5. Add Missing Configuration

```python
session = AgentSession[UserState](
    userdata=userdata,
    stt=inference.STT("deepgram/nova-3", language="en"),
    llm=inference.LLM("openai/gpt-4.1"),
    tts=inference.TTS("cartesia/sonic-3", voice="..."),
    vad=silero.VAD.load(),
    turn_detection=MultilingualModel(),  # ✅ Add turn detection
    max_tool_steps=10,  # ✅ Prevent infinite loops
)
```

---

## Comparison: Bank IVR Example

The bank-ivr example shows even more advanced patterns:

1. **Multiple agents** - Navigator agent and System agent
2. **Session state** - `SessionState` dataclass with caching
3. **DTMF support** - `GetDtmfTask` for keypad input
4. **Metrics** - `MetricsCollectedEvent` tracking
5. **Agent handoff** - Transferring between agents
6. **Audit logging** - Session reports with `ctx.make_session_report()`

**Files:**
- `ivr_system_agent.py` (671 lines) - Main IVR logic
- `ivr_navigator_agent.py` (148 lines) - Menu navigation
- `mock_bank_service.py` (257 lines) - Database simulation
- `test_mock_bank_service.py` - Unit tests

---

## What We're Missing

### Critical Gaps

1. ❌ **AgentServer pattern** - Using old CLI pattern
2. ❌ **inference layer** - Direct plugin usage instead of unified API
3. ❌ **Typed userdata** - No RunContext[UserState] pattern
4. ❌ **Turn detection** - No MultilingualModel
5. ❌ **Max tool steps** - Could loop infinitely
6. ❌ **Session callbacks** - No on_session_end
7. ❌ **Proper parameter handling** - Using defaults/optionals that break
8. ❌ **Enum constraints** - No json_schema_extra validation

### Nice-to-Have Gaps

- ⚠️ Background audio player
- ⚠️ Session reports
- ⚠️ Metrics collection
- ⚠️ Unit tests for tools
- ⚠️ Agent handoff support

---

## Action Plan: Fix Our Implementation

### Option 1: Follow LiveKit Drive-Thru Pattern (RECOMMENDED)

**Time:** 4-6 hours  
**Risk:** Low (following working example)  
**Outcome:** Python Native agent that actually works

**Steps:**
1. Copy drive-thru folder to our project
2. Adapt their database layer to our Supabase
3. Adapt their menu structure to our restaurants
4. Use their exact patterns for:
   - AgentServer
   - inference.STT/LLM/TTS
   - Typed userdata with RunContext
   - Function parameters (no defaults, use "null" strings)
   - Enum constraints with json_schema_extra
5. Test with their exact approach
6. Gradually add our features

**Benefits:**
- ✅ Start from working code
- ✅ Learn correct patterns
- ✅ Lower risk than debugging blindly
- ✅ Can compare side-by-side

### Option 2: Enhance AI SDK Instead (STILL VALID)

If Python still doesn't work after following drive-thru pattern, fall back to AI SDK + Voice.

---

## Recommendation

**BEFORE giving up on Python:**

1. ✅ **Clone drive-thru example** (done - in `/livekit-reference/agents/examples/drive-thru`)
2. ✅ **Study their patterns** (this doc)
3. 🔜 **Copy their approach** to our `food_concierge_native.py`
4. 🔜 **Test with their exact patterns**
5. 🔜 **Add our Supabase integration**

**Time investment:** 4-6 hours to adapt drive-thru pattern

**Decision point:** If it works → Great! If still broken → AI SDK + Voice

This way we've given Python Native a fair shot with the correct reference implementation.

---

## Key Takeaway

**We weren't following LiveKit's actual patterns.** The drive-thru example shows:

1. Use `AgentServer` not old CLI
2. Use `inference` layer not direct plugins
3. Use typed `RunContext[Userdata]` not globals
4. Use `Literal` with `"null"` strings not optional defaults
5. Use `json_schema_extra={"enum": [...]}` for constraints
6. Add turn detection and max_tool_steps

**With these patterns, Python Native might actually work.**

---

---

## 📋 Implementation Tracking

### Phase 1: Core Architecture Migration (Est: 2-3 hours)

- [ ] **1.1 Switch to AgentServer Pattern**
  - [ ] Import `AgentServer` from `livekit.agents`
  - [ ] Replace `entrypoint` function with `@server.rtc_session` decorator
  - [ ] Update `if __name__ == "__main__"` to use `cli.run_app(server)`
  - [ ] Test: Agent starts without errors
  - [ ] Test Script: `test-livekit-server-pattern.js`

- [ ] **1.2 Migrate to inference Layer**
  - [ ] Change from `openai.STT()` to `inference.STT("deepgram/nova-3")`
  - [ ] Change from `openai.LLM()` to `inference.LLM("openai/gpt-4.1")`
  - [ ] Change from `openai.TTS()` to `inference.TTS("cartesia/sonic-3")`
  - [ ] Add voice parameter to TTS
  - [ ] Test: Models initialize correctly
  - [ ] Test Script: `test-livekit-inference.js`

- [ ] **1.3 Add Typed Userdata**
  - [ ] Create `@dataclass UserState` with user_id, cart_id, profile fields
  - [ ] Create `async def new_userdata() -> UserState` factory
  - [ ] Update `AgentSession` to `AgentSession[UserState](userdata=...)`
  - [ ] Test: Userdata initializes and persists
  - [ ] Test Script: `test-livekit-userdata.js`

- [ ] **1.4 Add Configuration**
  - [ ] Import `MultilingualModel` from `livekit.plugins.turn_detector.multilingual`
  - [ ] Add `turn_detection=MultilingualModel()` to session
  - [ ] Add `max_tool_steps=10` to session
  - [ ] Add `on_session_end` callback for cleanup
  - [ ] Test: Session manages properly
  - [ ] Test Script: `test-livekit-session-config.js`

### Phase 2: Function Tool Refactoring (Est: 2-3 hours)

- [ ] **2.1 Fix get_user_profile_tool**
  - [ ] Remove `profile_id: str | None = None` parameter
  - [ ] Use `ctx: RunContext[UserState]` to access state
  - [ ] Hardcode default behavior (always use default profile)
  - [ ] Test: Tool executes without schema errors
  - [ ] Test Script: `test-tool-get-profile.js`

- [ ] **2.2 Fix find_food_item_tool**
  - [ ] Remove `max_results: int = 5` parameter
  - [ ] Hardcode `max_results = 5` inside function
  - [ ] Update to use `ctx: RunContext[UserState]`
  - [ ] Test: Tool executes without schema errors
  - [ ] Test Script: `test-tool-find-food.js`

- [ ] **2.3 Fix quick_add_to_cart_tool**
  - [ ] Remove `restaurant_name: str | None = None` parameter
  - [ ] Remove `additional_items: list | None = None` parameter
  - [ ] Keep only: `item_name: str, quantity: Literal["1", "2", "3", "4", "5"]`
  - [ ] Use `ctx.userdata` for cart_id access
  - [ ] Test: Tool executes without schema errors
  - [ ] Test Script: `test-tool-add-cart.js`

- [ ] **2.4 Add Enum Constraints to Remaining Tools**
  - [ ] Update `get_restaurant_menu_tool` with constraints
  - [ ] Update `quick_view_cart_tool` with `RunContext`
  - [ ] Update `quick_checkout_tool` with `RunContext`
  - [ ] Test: All tools validate properly
  - [ ] Test Script: `test-all-tools-schema.js`

### Phase 3: Integration & Testing (Est: 1-2 hours)

- [ ] **3.1 End-to-End Testing**
  - [ ] Test: Agent joins room successfully
  - [ ] Test: User can speak and agent responds
  - [ ] Test: find_food_item_tool executes correctly
  - [ ] Test: quick_add_to_cart_tool updates cart
  - [ ] Test: quick_checkout_tool completes order
  - [ ] Test Script: `test-livekit-native-e2e-v2.js`

- [ ] **3.2 Error Handling**
  - [ ] Test: Schema validation passes for all tools
  - [ ] Test: Agent handles ToolError correctly
  - [ ] Test: Session cleanup on disconnect
  - [ ] Test Script: `test-livekit-error-handling.js`

- [ ] **3.3 Performance Testing**
  - [ ] Measure: STT latency
  - [ ] Measure: LLM response time
  - [ ] Measure: TTS synthesis time
  - [ ] Measure: End-to-end conversation latency
  - [ ] Compare: vs Manual LiveKit vs AI SDK
  - [ ] Test Script: `test-livekit-performance.js`

### Phase 4: Polish & Documentation (Est: 1 hour)

- [ ] **4.1 Code Cleanup**
  - [ ] Remove old patterns (commented code)
  - [ ] Add type hints everywhere
  - [ ] Add docstrings to all tools
  - [ ] Format with black/ruff

- [ ] **4.2 Documentation**
  - [ ] Update README.md with new patterns
  - [ ] Document migration from old→new API
  - [ ] Add troubleshooting section
  - [ ] Document performance benchmarks

- [ ] **4.3 Deployment Prep**
  - [ ] Test: Agent runs in production mode
  - [ ] Test: Multiple concurrent sessions
  - [ ] Add health check endpoint
  - [ ] Add metrics collection

---

## 🧪 Test Plan

### Test Scripts to Create

**Location:** `/scripts/livekit-native/`

1. **test-livekit-server-pattern.js**
   - Verify AgentServer starts
   - Verify @server.rtc_session decorator works
   - Verify agent can be dispatched to room

2. **test-livekit-inference.js**
   - Verify inference.STT initializes
   - Verify inference.LLM initializes
   - Verify inference.TTS initializes
   - Test audio transcription
   - Test LLM response
   - Test TTS synthesis

3. **test-livekit-userdata.js**
   - Verify UserState dataclass creation
   - Verify userdata persists across tool calls
   - Verify RunContext[UserState] typing

4. **test-livekit-session-config.js**
   - Verify turn detection works
   - Verify max_tool_steps enforced
   - Verify on_session_end callback fires

5. **test-tool-get-profile.js**
   - Call get_user_profile_tool via LLM
   - Verify no schema errors
   - Verify returns valid profile data

6. **test-tool-find-food.js**
   - Call find_food_item_tool via LLM
   - Verify no schema errors
   - Verify returns food items

7. **test-tool-add-cart.js**
   - Call quick_add_to_cart_tool via LLM
   - Verify no schema errors
   - Verify cart updates in Supabase

8. **test-all-tools-schema.js**
   - Validate OpenAI function schemas for all tools
   - Ensure no `type` key errors
   - Ensure all enums properly defined

9. **test-livekit-native-e2e-v2.js**
   - Enhanced version of existing test
   - Test full conversation flow
   - Test tool execution chain
   - Test cart → checkout flow
   - Test audio quality

10. **test-livekit-error-handling.js**
    - Test invalid tool parameters
    - Test network failures
    - Test session timeouts
    - Test graceful degradation

11. **test-livekit-performance.js**
    - Benchmark STT latency
    - Benchmark LLM latency
    - Benchmark TTS latency
    - Compare: Native vs Manual vs AI SDK
    - Generate performance report

### Test Execution Strategy

**During Development:**
```bash
# Run individual test after each change
npm run test:livekit-server-pattern
npm run test:livekit-inference
# etc...
```

**Before Commit:**
```bash
# Run all tests
npm run test:livekit-all
```

**Continuous Integration:**
```bash
# Run on every PR
npm run test:livekit-ci
```

### Success Criteria

**Phase 1 Complete:**
- ✅ Agent starts without errors
- ✅ No import errors
- ✅ Session initializes properly

**Phase 2 Complete:**
- ✅ All tools execute without schema errors
- ✅ No OpenAI 400 errors
- ✅ Tools return valid data

**Phase 3 Complete:**
- ✅ User can have full voice conversation
- ✅ Can search food, add to cart, checkout
- ✅ Latency < 600ms average
- ✅ No crashes in logs

**Phase 4 Complete:**
- ✅ Code formatted and documented
- ✅ All tests passing
- ✅ Ready for YouTube demo

---

## 📊 Progress Tracking

**Started:** February 14, 2026  
**Target Completion:** February 14-15, 2026 (6-8 hours)  
**Current Phase:** Phase 0 - Planning ✅

**Completion Status:**
- Phase 1: 0/4 tasks (0%)
- Phase 2: 0/4 tasks (0%)
- Phase 3: 0/3 tasks (0%)
- Phase 4: 0/3 tasks (0%)

**Overall:** 0/14 tasks complete (0%)

---

## Next Steps

**Immediate Actions:**

1. ✅ **Clean up livekit-reference** - Remove .git/.github conflicts
2. ✅ **Add implementation tracking** - This section
3. ✅ **Plan test scripts** - Test plan above
4. 🔜 **Start Phase 1.1** - Switch to AgentServer pattern

**User Decision:**

Ready to start Phase 1.1 (AgentServer pattern)?  
Or would you like to review/adjust the plan first?
