# LiveKit Native Agents Python SDK - Official Documentation Review

**Date:** February 14, 2026  
**Purpose:** Document the ACTUAL current LiveKit Agents Python API to fix our implementation  
**Current SDK Version:** Check with `pip show livekit-agents`

---

## 🔍 Current Issues - ✅ RESOLVED

Our code was failing with:
1. ~~`TypeError: Agent.__init__() missing 1 required keyword-only argument: 'instructions'`~~ ✅ Fixed
2. ~~`AttributeError: module 'livekit.agents.llm' has no attribute 'FunctionContext'`~~ ✅ Fixed
3. ~~`AttributeError: 'Agent' object has no attribute 'start'`~~ ✅ **SOLUTION FOUND**

**Root Cause:** Our code was written for an older API version. SDK v1.4.1 uses `AgentSession` pattern.

**Solution:** Use `AgentSession.start(room, agent)` instead of `agent.start()`

---

## 📚 Official Documentation Sources

### Primary References:
- **Overview:** https://docs.livekit.io/intro/overview/
- **Python API Reference:** https://docs.livekit.io/reference/python/livekit/agents/
- **Agents Guide:** https://docs.livekit.io/agents/overview/

### Key Documentation Pages to Review:
1. **Voice Agent API:** https://docs.livekit.io/reference/python/livekit/agents/voice/
2. **Function Tools:** https://docs.livekit.io/agents/function-calling/
3. **Job Context:** https://docs.livekit.io/reference/python/livekit/agents/job/
4. **Worker Options:** https://docs.livekit.io/reference/python/livekit/agents/worker/

---

## 🏗️ Current LiveKit Agents Python API (v1.4.1+)

### 1. Agent Initialization

```python
from livekit.agents import voice

agent = voice.Agent(
    instructions: str,              # REQUIRED: System prompt
    tools: list[llm.Tool] | None,   # Function tools
    vad: vad.VAD | None,            # Voice Activity Detection
    stt: stt.STT | str | None,      # Speech-to-Text
    llm: llm.LLM | str | None,      # Language Model
    tts: tts.TTS | str | None,      # Text-to-Speech
    allow_interruptions: bool,      # Allow user to interrupt
    # ... other optional params
)
```

**Key Changes from Old API:**
- ✅ `instructions` is now **required** (not passed via AssistantLLM)
- ✅ `tools` is passed directly (not via FunctionContext)
- ❌ No `agent.start()` method - agent is **automatically started** by the framework

### 2. Entry Point Pattern - ✅ CORRECTED

**CORRECT Pattern (v1.4.1 from Official Docs):**

```python
from livekit.agents import AgentSession, Agent
from livekit import agents

class MyAssistant(Agent):
    def __init__(self) -> None:
        super().__init__(
            instructions="Your system prompt here"
        )

@server.rtc_session(agent_name="my-agent")
async def entrypoint(ctx: agents.JobContext):
    # Create session with models
    session = AgentSession(
        stt="deepgram/nova-3:multi",          # Or openai.STT()
        llm="openai/gpt-4.1-mini",             # Or openai.LLM()
        tts="cartesia/sonic-3:...",            # Or openai.TTS()
        vad=silero.VAD.load(),
    )
    
    # Start session with room and agent
    await session.start(
        room=ctx.room,
        agent=MyAssistant(),
    )
    
    # Optional: generate initial greeting
    await session.generate_reply(
        instructions="Greet the user and offer your assistance."
    )
```

**Key Changes:**
- ✅ Use `AgentSession` to configure STT/LLM/TTS models
- ✅ Call `session.start(room, agent)` instead of `agent.start()`
- ✅ Agent class only holds `instructions` and tools
- ✅ Use `session.generate_reply()` for greetings

Source: https://docs.livekit.io/agents/start/voice-ai-quickstart/

**OLD Pattern (WRONG - Don't Use):**

```python
from livekit.agents import JobContext, JobProcess, WorkerOptions, cli
from livekit.agents import voice

async def entrypoint(ctx: JobContext):
    """Called when a participant joins a room"""
    
    # 1. Connect to room
    await ctx.connect()
    
    # 2. Wait for participant (optional, auto-handles if skipped)
    participant = await ctx.wait_for_participant()
    
    # 3. Create agent (automatically connects and starts)
    agent = voice.Agent(
        instructions="Your system prompt here",
        tools=[tool1, tool2, tool3],
        vad=silero.VAD.load(),
        stt=openai.STT(),
        llm=openai.LLM(model="gpt-4"),
        tts=openai.TTS(),
    )
    
    # 4. Start the agent session
    session = await agent.start_session(ctx.room, participant)
    
    # Agent now handles conversation automatically
    # No need to call agent.say() - it responds to user input

if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
        )
    )
```

**Key Points:**
- `agent.start()` → **DOES NOT EXIST** (old API)
- Use `agent.start_session(room, participant)` instead
- Agent automatically listens and responds
- Initial greeting is **optional** - agent will respond when user speaks

### 3. Function Tools Definition

**CORRECT Pattern:**

```python
from livekit.agents import llm

@llm.ai_callable(description="Search for food items")
async def find_food_item(query: str) -> str:
    """Search menu items"""
    results = await search_menu_items(query)
    return f"Found {len(results)} items"

# Collect tools
tools = [
    find_food_item,
    get_user_profile,
    quick_add_to_cart,
    # ... more tools
]
```

**Key Changes:**
- Use `@llm.ai_callable` decorator (not `@llm.function_tool`)
- OR use `llm.FunctionTool()` wrapper if needed
- Pass list directly to `voice.Agent(tools=[...])`

### 4. Job Context Connection

```python
async def entrypoint(ctx: JobContext):
    # Connect to room (required)
    await ctx.connect(
        auto_subscribe=AutoSubscribe.SUBSCRIBE_ALL  # Default
    )
    
    # Room is now available
    room = ctx.room
    
    # Wait for participant (optional - framework can auto-handle)
    participant = await ctx.wait_for_participant()
```

**Key Points:**
- `ctx.connect()` must be called before accessing `ctx.room`
- `auto_subscribe` controls track subscription behavior
- Framework automatically handles room lifecycle

---

## 🔧 What We Need to Fix in Our Code

### File: `/agents/food_concierge_native.py`

#### Current Issues:

1. **Line ~341-352:** ❌ Using `agent.start(ctx.room, participant)` - **DOES NOT EXIST**
   ```python
   # WRONG (Old API):
   agent = voice.Agent(...)
   agent.start(ctx.room, participant)
   ```

2. **Tool Decorators:** ❓ Need to verify we're using correct decorator
   ```python
   # Current: @llm.function_tool
   # Should be: @llm.ai_callable (or check which is current)
   ```

3. **Initial Greeting:** ❓ Removed `agent.say()` - need to confirm if framework handles this

#### Fixes Needed:

```python
async def entrypoint(ctx: JobContext):
    """Entry point for LiveKit Agent"""
    logger.info(f"🎬 Agent entry point triggered")
    logger.info(f"   Room: {ctx.room.name}")
    
    # Connect to room
    await ctx.connect()
    logger.info("✅ Connected to room")
    
    # Wait for participant
    participant = await ctx.wait_for_participant()
    logger.info(f"✅ Participant joined: {participant.identity}")
    
    # Create agent with tools
    agent = voice.Agent(
        instructions=system_instructions,
        tools=tools,
        vad=silero.VAD.load(),
        stt=openai.STT(),
        llm=openai.LLM(model="gpt-4"),
        tts=openai.TTS(),
        allow_interruptions=True,
    )
    
    # Start agent session (NEW API)
    session = await agent.start_session(ctx.room, participant)
    logger.info("✅ Voice agent session started")
    
    # OPTIONAL: Send initial greeting
    # await session.say("Hi! I'm your food concierge assistant...")
```

---

## 📖 Documentation Gaps to Research

### Need to Verify:

1. **Agent Session API:**
   - ✅ Confirm `agent.start_session(room, participant)` is correct method
   - ❓ What does it return? (`AgentSession` object?)
   - ❓ Do we need to `await session` or keep reference?

2. **Tool Decorator:**
   - ❓ Is `@llm.function_tool` still valid?
   - ❓ Or should we use `@llm.ai_callable`?
   - ❓ Do we need to wrap tools in `llm.FunctionTool()`?

3. **Initial Greeting:**
   - ❓ Can we send initial greeting via `session.say()`?
   - ❓ Or does agent auto-greet when it starts?
   - ❓ Is greeting even necessary in voice-first apps?

4. **Audio Playback:**
   - ✅ Frontend has `<RoomAudioRenderer />` (correct)
   - ❓ Does agent TTS automatically publish to room audio track?
   - ❓ Any additional setup needed for audio?

5. **Function Tool Response Format:**
   - ❓ Do tools return strings directly?
   - ❓ Or need to return structured data?
   - ❓ How does agent convert tool results to speech?

---

## 🎯 Action Plan

### Phase 1: Research (Before Any Code Changes)

1. **Check Installed SDK Version:**
   ```bash
   pip show livekit-agents
   pip show livekit
   ```

2. **Review Python API Reference:**
   - Read `voice.Agent` class documentation
   - Read `AgentSession` documentation (if exists)
   - Check function tool examples

3. **Find Working Example:**
   - Look for official example code in SDK
   - Check if SDK has `examples/` directory
   - Review any quickstart guides

4. **Test Minimal Example:**
   - Create minimal working agent
   - Verify it can speak
   - Then add our tools

### Phase 2: Fix Our Implementation

1. **Update Entry Point:**
   - Fix `agent.start_session()` call
   - Add proper session management
   - Handle session lifecycle

2. **Verify Tool Decorators:**
   - Ensure tools use correct decorator
   - Test tool execution
   - Verify tool responses are spoken

3. **Test Audio Flow:**
   - Verify agent TTS is heard
   - Verify mic captures user voice
   - Verify STT transcribes correctly

4. **Add Error Handling:**
   - Try/catch around agent creation
   - Log all errors properly
   - Graceful degradation

### Phase 3: Validate

1. **Run End-to-End Test:**
   - User speaks → Agent hears → Agent responds
   - Function tool called → Result spoken
   - Cart updates → Cards render

2. **Document Final Working Code:**
   - Update LIVEKIT_NATIVE_IMPLEMENTATION.md
   - Add troubleshooting section
   - Document known issues

---

## 🔗 Quick Reference Links

### Official Examples to Review:
- **Simple Voice Agent:** https://docs.livekit.io/agents/quickstart/
- **Function Calling:** https://docs.livekit.io/agents/function-calling/
- **Custom Agents:** https://docs.livekit.io/agents/custom-agents/

### SDK Source Code:
- **GitHub:** https://github.com/livekit/agents
- **Python Package:** https://github.com/livekit/agents/tree/main/livekit-agents
- **Examples Directory:** https://github.com/livekit/agents/tree/main/examples

### Community Resources:
- **Discord:** https://discord.gg/livekit
- **Discussions:** https://github.com/livekit/agents/discussions

---

## 📝 Notes

**Important Realizations:**

1. The LiveKit Agents SDK has undergone **significant API changes** between versions
2. Our code was likely written for SDK v0.x or v1.0-1.2, but we're running v1.4.1+
3. The new `voice.Agent` class is a **higher-level abstraction** that handles more automatically
4. We should NOT manually call methods like `.start()` - the framework handles this

**Migration Strategy:**

Instead of patching our code incrementally, we should:
1. ✅ Create this documentation file (current step)
2. 🔜 Check actual SDK version and API reference
3. 🔜 Find official working example
4. 🔜 Rewrite our entrypoint function from scratch based on current API
5. 🔜 Test minimal example before adding complexity

**Why This Matters:**

- Saves time fighting API changes
- Ensures we follow current best practices
- Makes code maintainable for future SDK updates
- Reduces frustration from cryptic errors

---

**Next Steps:** 
1. Check installed SDK version: `pip show livekit-agents`
2. Find official Python agent example in documentation
3. Review `voice.Agent` API reference carefully
4. Test minimal working example
5. Then update our code once with correct API

**Status:** 📖 Documentation phase - DO NOT write code until we verify API
