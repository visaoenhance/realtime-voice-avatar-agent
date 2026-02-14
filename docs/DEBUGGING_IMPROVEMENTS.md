# Debugging & Error Visibility Improvements

**Date:** February 14, 2026  
**Context:** Native voice agent was silently crashing due to function schema error, only discovered after user reported "no audio"

## The Problem

### What Happened
1. Agent process started successfully ✅
2. Agent registered with LiveKit Cloud ✅
3. User connected to room ✅
4. Agent joined room ✅
5. **Agent crashed during LLM inference** ❌ (invisible)
6. User heard nothing, had no error feedback ❌

### Why It Was Invisible

#### 1. **Test Script Only Checked Process Status**
- ✅ Checked if agent process was running
- ✅ Checked if PID file exists
- ❌ **Never checked logs for runtime errors**
- ❌ **Never validated function schemas**
- ❌ **Never tested actual conversation flow**

**Result:** Tests passed despite crash waiting to happen

#### 2. **Frontend Had No Visibility**
- ✅ Detected agent joining room
- ✅ Showed "Agent Ready" status
- ❌ **No access to agent-side Python errors**
- ❌ **Agent crashes silently from frontend perspective**
- ❌ **No health monitoring or error reporting**

**Result:** User sees "ready" but gets silence

#### 3. **Crash Timing After Connection**
```
Agent Lifecycle:
┌─────────────────────────────────────────────────────────────┐
│ START → Register → Wait for Connection → User Connects     │
│   ✅      ✅         ✅ Tests validate here     ✅          │
└─────────────────────────────────────────────────────────────┘
                                                      ↓
                    ┌──────────────────────────────────────────┐
                    │ User Speaks → LLM Inference → Crash     │
                    │                    ❌ First error here   │
                    └──────────────────────────────────────────┘
```

## Solutions Implemented

### ✅ 1. Enhanced Test Script with Log Monitoring

**File:** `scripts/test-livekit-native-e2e.js`

**New Test 7: Agent Log Health Check**
- Reads last 50 lines of `/tmp/agent.log`
- Detects common error patterns:
  - Function schema validation errors
  - API compatibility errors (AttributeError)
  - Missing required parameters (TypeError)
  - OpenAI API status errors
  - Unhandled exceptions
- **Fails test immediately** if errors detected
- Provides actionable guidance

**Example Output (with error):**
```
📋 Test 7: Agent Log Health Check
   ❌ Errors detected in agent logs:
      ❌ Function schema validation error
   💡 Check logs: tail -50 /tmp/agent.log | strings
```

**Example Output (healthy):**
```
📋 Test 7: Agent Log Health Check
   ✅ Agent logs healthy (no errors in last 50 lines)
   ✅ Agent registered with LiveKit Cloud
```

### 🔄 2. Catch Errors Earlier (Schema Validation)

**The Actual Error:**
```python
livekit.agents._exceptions.APIStatusError: Error code: 400 - 
{'error': {'message': "Invalid schema for function 'quick_add_to_cart_tool': 
In context=('properties', 'additional_items', 'type', '0', 'items'), 
schema must have a 'type' key."}}
```

**Root Cause:**
```python
additional_items: list | None = None  # ❌ OpenAI needs type details
```

**Fix:**
```python
# Removed problematic parameter (was optional anyway)
# For complex types, use Annotated with JSON schema
```

**Prevention:** This error would now be caught by Test 7 **before** a user connects.

## What Still Needs Work

### 🚧 TODO: Frontend Error Visibility

**Problem:** Frontend has zero insight into agent crashes

**Proposed Solutions:**

#### Option A: Health Check Endpoint
```python
# agents/food_concierge_native.py
@app.route('/health')
def health_check():
    return {
        'status': 'healthy',
        'last_error': None,
        'uptime': time.time() - start_time,
        'connections': active_connection_count
    }
```

Frontend polls: `GET http://localhost:8080/health`

#### Option B: Agent Error Messages (Data Channel)
```python
# In agent entrypoint - send errors to frontend
try:
    await session.start(room=ctx.room, agent=agent)
except Exception as e:
    # Send error to frontend via data channel
    await ctx.room.local_participant.publish_data(
        json.dumps({
            'type': 'agent_error',
            'error': str(e),
            'fatal': True
        }).encode('utf-8')
    )
    raise
```

Frontend listens on data channel and shows toast/alert.

#### Option C: Frontend Health Monitoring
```typescript
// Check if agent is truly alive (not just connected)
useEffect(() => {
  const healthCheck = setInterval(() => {
    if (agentJoined && voiceAssistantState === 'listening') {
      // Agent should respond within 5s of speaking
      // If no response after 10s of user speech → show error
    }
  }, 5000);
  return () => clearInterval(healthCheck);
}, [agentJoined, voiceAssistantState]);
```

### 🚧 TODO: Schema Validation at Startup

**Problem:** Function schema errors only discovered when LLM tries to use them

**Solution:** Pre-flight validation
```python
# agents/food_concierge_native.py
def validate_tool_schemas():
    """Validate all function tool schemas before starting agent"""
    from openai import OpenAI
    client = OpenAI()
    
    try:
        # Test schema generation
        for tool in tools:
            schema = llm.generate_schema(tool)
            # Validate with OpenAI (dry run)
            client.chat.completions.create(
                model="gpt-4",
                messages=[{"role": "user", "content": "test"}],
                tools=[schema],
                max_tokens=1  # Don't actually run
            )
        logger.info("✅ All function schemas valid")
    except Exception as e:
        logger.error(f"❌ Schema validation failed: {e}")
        raise

# Call at startup BEFORE accepting connections
if __name__ == "__main__":
    validate_tool_schemas()
    cli.run_app(...)
```

### 🚧 TODO: Real-time Log Dashboard

**Problem:** Have to manually check logs after-the-fact

**Solution:** Dev mode dashboard
- Web UI showing agent logs in real-time
- Filterable by level (INFO/ERROR/DEBUG)
- Shows connection count, recent errors
- Health metrics (latency, success rate)

## Testing the Improvements

### Run Enhanced Tests
```bash
node scripts/test-livekit-native-e2e.js
```

**Before (old test):**
- ✅ Agent running → Passes
- ❌ Agent crashing on connection → Still passes (not detected)

**After (new test):**
- ✅ Agent running + no errors → Passes
- ❌ Agent has errors in logs → **FAILS with clear error message**

### Simulate Error
To verify error detection works:

1. Introduce intentional error in agent:
```python
# In entrypoint(), add:
raise ValueError("Test error detection")
```

2. Restart agent
3. Run test script:
```bash
node scripts/test-livekit-native-e2e.js
```

**Expected:** Test 7 fails, shows error, provides log command

## Lessons Learned

### 1. **Process ≠ Working**
- Agent process running doesn't mean agent works
- Need runtime validation, not just startup validation

### 2. **Test Real User Flows**
- Don't just check files/processes exist
- Actually simulate user interaction
- Test the full conversation lifecycle

### 3. **Surface Errors Immediately**
- Don't hide errors in logs
- Show them in UI when they happen
- Provide actionable guidance

### 4. **Fail Fast**
- Validate schemas at startup
- Don't wait for runtime to discover config errors
- Pre-flight checks prevent user-facing failures

### 5. **Multi-Layer Monitoring**
- Test suite checks logs automatically
- Frontend monitors agent health
- Developer has real-time visibility
- All three should catch errors independently

## Summary

| Issue | Before | After |
|-------|--------|-------|
| **Schema errors** | Silent crash | Caught by Test 7 ✅ |
| **Agent crashes** | User discovers | Test discovers ✅ |
| **Error visibility** | Check logs manually | Automatic in test output ✅ |
| **User feedback** | "No audio" (unclear) | Clear error message (TODO) |
| **Prevention** | Runtime failure | Startup validation (TODO) |

**Status:**
- ✅ Enhanced test script catches log errors
- 🚧 TODO: Frontend error visibility
- 🚧 TODO: Schema pre-validation
- 🚧 TODO: Real-time log dashboard
