# LiveKit Phase 2: Native Voice Pipeline Implementation

**Project**: ubereats-ai-sdk-hitl  
**Date**: February 13, 2026  
**Status**: Planning - Not Yet Implemented  
**Purpose**: Build LiveKit's native voice pipeline as a parallel, experimental system without touching existing code

**Strategy**: 🔵 **Add, Don't Replace** - Build native pipeline alongside existing systems for zero-risk experimentation

---

## Quick Reference

| Item | Keep (Untouched) ✅ | Build (New) 🆕 |
|------|---------------------|----------------|
| **Text Chat** | `/food/concierge` | - |
| **Voice Manual** | `/food/concierge-livekit` | - |
| **Voice Native** | - | `/food/concierge-native` |
| **API Routes** | `/api/food-chat`, `/api/voice-chat` | `/api/livekit-native/*` |
| **Agents** | - | `agents/food_concierge_native.py` |
| **Tests** | `scripts/test-ai-sdk-*.js`, `scripts/test-livekit-*.js` | `scripts/test-livekit-native-*.js` |
| **Database** | Existing Supabase schema | Same schema (no changes) |
| **Navigation** | Current header links | Add "Concierge (Native)" option |

### 📚 Key Documentation

- **[LIVEKIT_PHASE2.md](./LIVEKIT_PHASE2.md)** - This file (implementation plan)
- **[LIVEKIT_NATIVE_INTEGRATION.md](./LIVEKIT_NATIVE_INTEGRATION.md)** - 🆕 **READ THIS FIRST** - Complete TypeScript→Python tool migration guide
- **[SDK_STRATEGY.md](./SDK_STRATEGY.md)** - Original AI SDK vs LiveKit comparison
- **[CHAT_FLOW_DESIGN.md](./CHAT_FLOW_DESIGN.md)** - Current pipeline architecture

---

## Executive Summary

### The Plan: Build in Parallel, Don't Replace

**Zero-Risk Strategy**: Create a completely separate LiveKit-Native implementation alongside your existing systems.

**What We Keep (Untouched)**:
- ✅ AI SDK text chat (`/api/food-chat`, `/food/concierge`)
- ✅ LiveKit manual voice (`/api/voice-chat`, `/food/concierge-livekit`)
- ✅ All existing hooks and utilities
- ✅ All test scripts for current systems

**What We Build (New)**:
- 🆕 Native LiveKit agent (`agents/food_concierge_native.py`)
- 🆕 New frontend page (`/food/concierge-native`)
- 🆕 New test scripts (`scripts/test-livekit-native-*.js`)
- 🆕 Navigation option to access native version

**Result**: Three working systems you can compare and test side-by-side.

---

## Current State: Underutilizing LiveKit

### What We're Using Now (≈20% of LiveKit)

Currently in [livekit-food-agent.mjs](../livekit-food-agent.mjs) and [voice-chat/route.ts](../app/api/voice-chat/route.ts):

```
User speaks → Manual transcription via /api/openai/transcribe
           ↓
       AI SDK processes text via OpenAI
           ↓
       Manual TTS conversion
           ↓
       Send audio back to user
```

**Problems with current approach**:
- ❌ No automatic turn detection (user must press button)
- ❌ Manual pipeline stitching (STT, LLM, TTS all separate)
- ❌ No interruption handling (can't cut off agent mid-sentence)
- ❌ Higher latency (multiple round trips)
- ❌ No native voice activity detection (VAD)
- ❌ Missing LiveKit's built-in semantic understanding for turns
- ❌ Manually managing conversation state
- ❌ No telephony readiness
- ❌ No multi-agent handoff capabilities

### What LiveKit Can Do Natively (100% Capability)

```
User speaks → LiveKit VAD detects speech
           ↓
       Native STT (Deepgram/OpenAI Whisper)
           ↓
       LiveKit Agent orchestrates OpenAI
           ↓
       Native TTS (Cartesia/ElevenLabs/OpenAI)
           ↓
       WebRTC audio stream back
           
ALL IN ONE PIPELINE, ZERO MANUAL WIRING
```

**Benefits we're missing**:
- ✅ Automatic turn detection (semantic + VAD)
- ✅ Natural interruptions (user can cut off agent)
- ✅ Single-digit millisecond latency optimizations
- ✅ Stateful agent sessions (context persists)
- ✅ Built-in telephony support (SIP trunking)
- ✅ Multi-agent handoff (`agent.switch()`)
- ✅ Production-grade load balancing
- ✅ Native RPC for client↔agent communication
- ✅ Better error recovery and reconnection logic

---

## Phase 2: Native LiveKit Voice Pipeline (Parallel Implementation)

### Architecture Overview

#### Before (Current - Manual Pipeline)
```
┌─────────────┐
│   Browser   │
│             │
│ 🎤 Record   │
│   Button    │──┐
└─────────────┘  │
                 │ HTTP POST /api/openai/transcribe
                 ▼
          ┌──────────────┐
          │  Next.js API │
          │   (Manual)   │
          └──────────────┘
                 │
                 │ Call OpenAI Whisper
                 ▼
          ┌──────────────┐
          │   OpenAI     │
          │  Whisper STT │
          └──────────────┘
                 │
                 │ Text back
                 ▼
          ┌──────────────┐
          │  Next.js API │
          │ /voice-chat  │
          └──────────────┘
                 │
                 │ Call OpenAI GPT-4
                 ▼
          ┌──────────────┐
          │   OpenAI     │
          │  GPT-4 LLM   │
          └──────────────┘
                 │
                 │ Response text
                 ▼
          ┌──────────────┐
          │  Manual TTS  │
          │ (Browser API)│
          └──────────────┘
                 │
                 │ Audio back to user
                 ▼
          ┌──────────────┐
          │  🔊 Speaker  │
          └──────────────┘

Latency: 2-4 seconds total
Wiring: Manual at every step
Turn Detection: Button press only
```

#### After (Phase 2 - Native LiveKit)
```
┌─────────────┐
│   Browser   │
│             │
│ 🎤 Always   │
│   Listening │──────┐
└─────────────┘      │ WebRTC audio stream
                     ▼
              ┌──────────────┐
              │  LiveKit     │
              │ Media Server │
              └──────────────┘
                     │
                     │ Audio + participant tracking
                     ▼
              ┌──────────────────────────────┐
              │   LiveKit Agent Process      │
              │                              │
              │  ┌────────────────────────┐ │
              │  │ VAD (Silero)           │ │
              │  │ Detects speech start   │ │
              │  └────────────────────────┘ │
              │            ↓                 │
              │  ┌────────────────────────┐ │
              │  │ STT (Deepgram Nova-3)  │ │
              │  │ Real-time transcription│ │
              │  └────────────────────────┘ │
              │            ↓                 │
              │  ┌────────────────────────┐ │
              │  │ LLM (OpenAI GPT-4)     │ │
              │  │ + Function Tools       │ │
              │  └────────────────────────┘ │
              │            ↓                 │
              │  ┌────────────────────────┐ │
              │  │ TTS (Cartesia Sonic)   │ │
              │  │ Ultra-low latency      │ │
              │  └────────────────────────┘ │
              │                              │
              └──────────────────────────────┘
                     │
                     │ WebRTC audio stream back
                     ▼
              ┌──────────────┐
              │  🔊 Speaker  │
              └──────────────┘

Latency: 500-800ms total
Wiring: Zero - all handled by LiveKit SDK
Turn Detection: Automatic VAD + semantic
Interruptions: Native support
```

---

## Implementation Guide

### Step 1: Install LiveKit Agents SDK

#### Python Approach (Recommended)
```bash
# Create dedicated agent environment
cd ubereats-ai-sdk-hitl
mkdir -p agents
cd agents

# Install LiveKit Agents with all plugins
pip install "livekit-agents[openai,silero,deepgram,cartesia]>=1.0"

# Or use requirements.txt
cat > requirements.txt << EOF
livekit-agents>=1.0.0
livekit-plugins-openai>=0.6.0
livekit-plugins-deepgram>=0.6.0
livekit-plugins-silero>=0.6.0
livekit-plugins-cartesia>=0.2.0
livekit-plugins-turn-detector>=0.1.0
EOF

pip install -r requirements.txt
```

#### Node.js Approach (Alternative)
```bash
# If you prefer to stay in Node.js ecosystem
npm install @livekit/agents @livekit/agents-plugin-openai
```

**Recommendation**: Use Python for agents. The LiveKit Agents framework is most mature in Python with better documentation and more plugin support.

---

### Step 2: Environment Configuration

**Your Current `.env.local`** (verified working):

```bash
# ✅ EXISTING - Keep these (already configured)
SUPABASE_URL=http://127.0.0.1:54321                    # Local Docker Supabase
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...                  # Local service role key
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321        # Same for client
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...               # Local anon key
DEMO_PROFILE_ID=00000000-0000-0000-0000-0000000000fc   # Your demo profile
OPENAI_API_KEY=sk-proj-...                             # ← SHARED with AI SDK

# 🆕 ADD THESE for LiveKit Native Agent
LIVEKIT_URL=ws://localhost:7880                         # Local LiveKit server
LIVEKIT_API_KEY=devkey                                 # Local dev key (from livekit-server)
LIVEKIT_API_SECRET=secret                              # Local dev secret
LIVEKIT_AGENT_NAME=food-concierge-native
LIVEKIT_AGENT_ROOM=food-ordering

# 🔮 OPTIONAL - Advanced STT/TTS providers (can skip initially)
# DEEPGRAM_API_KEY=xxxxxx    # Faster STT (optional, default to OpenAI Whisper)
# CARTESIA_API_KEY=xxxxxx    # Faster TTS (optional, default to OpenAI TTS)
# ELEVENLABS_API_KEY=xxxxx   # Alternative TTS
```

**Python Agent Environment** (`agents/.env` - create this):

```bash
# Copy these from .env.local for Python agent to use
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...  # Same key as Next.js
DEMO_PROFILE_ID=00000000-0000-0000-0000-0000000000fc
OPENAI_API_KEY=sk-proj-...

LIVEKIT_URL=ws://localhost:7880
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=secret
```

**Why Two .env Files?**
- `.env.local` - Used by Next.js (TypeScript)
- `agents/.env` - Used by Python agent
- ✅ Same credentials, just duplicated for different runtimes

**Local Development Stack**:
```
┌─────────────────────────────────────────┐
│         Your Mac (localhost)            │
│                                         │
│  Next.js (3000) ←→ Supabase (54321)    │
│       ↓                    ↑            │
│  LiveKit Server (7880)     │            │
│       ↓                    │            │
│  Python Agent  ───────────┘             │
│  (connects to both)                     │
└─────────────────────────────────────────┘

All running locally, all using 127.0.0.1/localhost
```

**Key Points**:
- ✅ No remote services required for development
- ✅ Python agent connects to **same local Supabase** as TypeScript
- ✅ All components communicate via localhost
- ⚠️ For production deployment, update URLs to remote services

**Migration to Production** (when ready):
```bash
# Development (local)
SUPABASE_URL=http://127.0.0.1:54321
LIVEKIT_URL=ws://localhost:7880

# Production (remote)
SUPABASE_URL=https://your-project.supabase.co
LIVEKIT_URL=wss://your-project.livekit.cloud

# Same code works for both! 🎉
```

---

### Step 3: Create Native LiveKit Agent

Create `agents/food_concierge_agent.py`:

```python
#!/usr/bin/env python3
"""
LiveKit Food Concierge Agent - Native Voice Pipeline
Handles STT → LLM → TTS natively with zero manual wiring
"""

import os
import logging
from typing import Annotated
from livekit.agents import (
    Agent,
    AgentSession,
    JobContext,
    RunContext,
    function_tool,
    cli,
    WorkerOptions,
    WorkerType,
)
from livekit.plugins import openai, silero, deepgram, cartesia

# Configure logging
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

# System prompt (same as your current voice-chat)
SYSTEM_PROMPT = """You are the Food Court Voice Concierge for the Rivera household. You are designed for FAST, DIRECT voice interactions.

Core voice-first principles:
- Wait for the household to speak first
- **IMMEDIATE ACTION**: When someone asks for a specific food item, immediately call the appropriate tool
- Keep responses under 2 sentences unless asked for details
- Be conversational but efficient

You have access to these tools:
- get_user_profile: Load saved preferences and delivery area
- find_food_item: Search for specific dishes across all restaurants
- find_restaurants_by_type: Search by cuisine type
- quick_add_to_cart: Add items directly to cart
- quick_view_cart: Show current cart contents
- quick_checkout: Complete the order

Always prioritize speed and directness over comprehensive exploration."""


# Define function tools (mirror your current food-chat tools)
@function_tool
async def get_user_profile(user_id: Annotated[str, "The user ID, defaults to 'default-user'"]) -> str:
    """Load user's saved preferences, delivery address, and order history."""
    # TODO: Connect to your Supabase database
    # For now, return mock data matching your current API
    return """User Profile Loaded:
    Name: Rivera Household
    Delivery Address: Orlando, FL 32801
    Default Payment: •••• 4242
    Dietary Preferences: Loves cheesecake, seafood
    Recent Orders: Thai Palace (3 days ago)"""


@function_tool
async def find_food_item(
    item_name: Annotated[str, "Name of food item to search for"],
    location: Annotated[str, "Location for search"] = "Orlando, FL"
) -> str:
    """Search for a specific food item across all restaurants."""
    # TODO: Connect to your Supabase menu database
    # This should mirror app/api/voice-chat/tools.ts → findFoodItem
    logger.info(f"Searching for {item_name} in {location}")
    return f"Found 3 restaurants serving {item_name} in {location}"


@function_tool
async def find_restaurants_by_type(
    cuisine_type: Annotated[str, "Type of cuisine (Thai, Italian, Mexican, etc.)"],
    location: Annotated[str, "Location for search"] = "Orlando, FL"
) -> str:
    """Search for restaurants by cuisine type."""
    # TODO: Connect to your Supabase restaurants database
    logger.info(f"Searching for {cuisine_type} restaurants in {location}")
    return f"Found 5 {cuisine_type} restaurants in {location}"


@function_tool
async def quick_add_to_cart(
    item_name: Annotated[str, "Name of the item to add"],
    restaurant_name: Annotated[str, "Name of the restaurant"],
    quantity: Annotated[int, "Quantity to add"] = 1,
    additional_items: Annotated[list[str], "Additional items to add in same order"] = []
) -> str:
    """Add item(s) to cart. Can add multiple items from same restaurant in one call."""
    # TODO: Connect to your Supabase cart database
    items = [item_name] + additional_items
    logger.info(f"Adding to cart: {items} from {restaurant_name}")
    return f"Added {len(items)} item(s) to cart from {restaurant_name}"


@function_tool
async def quick_view_cart(user_id: Annotated[str, "User ID"] = "default-user") -> str:
    """View current cart contents and total."""
    # TODO: Connect to your Supabase cart database
    return "Your cart: 2 items, $24.50 total"


@function_tool
async def quick_checkout(
    user_id: Annotated[str, "User ID"] = "default-user",
    payment_method: Annotated[str, "Payment method"] = "default"
) -> str:
    """Complete the order and checkout."""
    # TODO: Connect to your Supabase orders database
    logger.info(f"Processing checkout for user {user_id}")
    return "Order confirmed! Estimated delivery: 30-45 minutes"


async def entrypoint(ctx: JobContext):
    """
    Main agent entrypoint - called when user connects to room.
    This is where LiveKit's native pipeline comes alive.
    """
    
    logger.info(f"🚀 Agent starting for room: {ctx.room.name}")
    
    # Create agent session with NATIVE pipeline components
    # No manual wiring - LiveKit handles everything
    session = AgentSession(
        # STT: Speech-to-Text (choose one)
        # Option A: Deepgram Nova-3 (fastest, most accurate for conversations)
        stt=deepgram.STT(
            model="nova-3",
            language="en-US",
            interim_results=True  # Real-time partial transcripts
        ),
        # Option B: OpenAI Whisper (uses your OPENAI_API_KEY)
        # stt=openai.STT(model="whisper-1"),
        
        # LLM: Language Model (same OpenAI you're using now)
        llm=openai.LLM(
            model="gpt-4o",  # or "gpt-4-turbo"
            temperature=0.7,
        ),
        
        # TTS: Text-to-Speech (choose one)
        # Option A: Cartesia Sonic-3 (ultra-low latency, most natural)
        tts=cartesia.TTS(
            model="sonic-english",
            voice="a0e99841-438c-4a64-b679-ae501e7d6091",  # Professional, warm voice
            speed=1.1,  # Slightly faster for efficiency
        ),
        # Option B: OpenAI TTS (uses your OPENAI_API_KEY)
        # tts=openai.TTS(model="tts-1", voice="alloy"),
        
        # VAD: Voice Activity Detection (automatic turn detection)
        vad=silero.VAD.load(
            min_speech_duration=0.3,  # Start listening after 300ms
            min_silence_duration=0.8,  # User done speaking after 800ms silence
        ),
        
        # Turn detection: Semantic understanding of conversation flow
        turn_detector=None,  # Use default (VAD-based)
    )
    
    # Create agent with your function tools
    agent = Agent(
        name="Food Concierge",
        instructions=SYSTEM_PROMPT,
        tools=[
            get_user_profile,
            find_food_item,
            find_restaurants_by_type,
            quick_add_to_cart,
            quick_view_cart,
            quick_checkout,
        ],
    )
    
    # Start agent in room - this is where magic happens
    await session.start(agent=agent, room=ctx.room)
    
    logger.info("✅ Agent session started - native pipeline active")
    
    # Optional: Send initial greeting (or wait for user to speak first)
    # await session.generate_reply(
    #     instructions="Greet the household warmly and ask what they'd like to order."
    # )
    
    # Agent now runs autonomously:
    # - Listens to audio via VAD
    # - Transcribes via STT
    # - Calls LLM with function tools
    # - Executes tools
    # - Responds via TTS
    # - All in real-time with interruption support


if __name__ == "__main__":
    # Start the agent worker
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            worker_type=WorkerType.ROOM,  # Room-based worker
            port=8080,  # Agent listens on this port
        )
    )
```

---

### Step 4: Update Frontend to Use Native LiveKit

Modify [app/food/concierge-livekit/page.tsx](../app/food/concierge-livekit/page.tsx):

**Current (Manual)**:
```typescript
// Manual recording button + transcription
const { isRecording, startRecording, stopRecording } = useAudioTranscription({
  onFinalTranscript: (transcript) => {
    // Manually send to /api/voice-chat
    handleVoiceMessage(transcript);
  }
});
```

**Phase 2 (Native LiveKit)**:
```typescript
'use client';
import { useEffect } from 'react';
import { Room, RoomEvent, Track } from 'livekit-client';
import { LiveKitRoom, AudioTrack, useVoiceAssistant } from '@livekit/components-react';

export default function LiveKitConciergePage() {
  return (
    <LiveKitRoom
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
      token={token} // Get from /api/livekit/token
      connect={true}
      audio={true} // Enable microphone
      video={false}
      onConnected={(room) => {
        console.log('✅ Connected to LiveKit room with native agent');
      }}
    >
      {/* Agent handles everything - just display state */}
      <VoiceAssistantUI />
    </LiveKitRoom>
  );
}

function VoiceAssistantUI() {
  const { state, audioTrack } = useVoiceAssistant();
  
  return (
    <div>
      {/* No recording button needed - always listening via VAD */}
      <div>Agent Status: {state}</div>
      
      {/* Audio automatically played by LiveKit */}
      {audioTrack && <AudioTrack track={audioTrack} />}
      
      {/* Display conversation state from agent via data channel */}
    </div>
  );
}
```

**Key Differences**:
1. ❌ Remove manual recording button
2. ❌ Remove `/api/openai/transcribe` calls
3. ❌ Remove `/api/voice-chat` HTTP calls
4. ✅ LiveKit agent handles everything via WebRTC
5. ✅ Always-listening with automatic turn detection
6. ✅ Natural interruption support

---

### Step 5: Run Native Pipeline

#### Terminal 1: Start LiveKit Media Server (Local Development)
```bash
# Download LiveKit server (one-time)
curl -sSL https://get.livekit.io | bash

# Start local server
livekit-server --dev
# Runs on ws://localhost:7880
```

#### Terminal 2: Start Food Concierge Agent
```bash
cd agents
python food_concierge_agent.py dev
# Agent connects to LiveKit server and waits for users
```

#### Terminal 3: Start Next.js App
```bash
npm run dev
# Visit http://localhost:3001/food/concierge-livekit
```

#### Flow:
1. User connects to LiveKit room via browser
2. Agent automatically joins same room
3. User speaks (no button needed)
4. VAD detects speech → STT transcribes → LLM processes → TTS responds
5. All in 500-800ms end-to-end

---

## Feature Comparison: Current vs Phase 2

| Feature | Current (Manual) | Phase 2 (Native) |
|---------|------------------|------------------|
| **Turn Detection** | Button press only | Automatic VAD + semantic |
| **Latency** | 2-4 seconds | 500-800ms |
| **Interruptions** | Not supported | Native - can cut off agent |
| **Pipeline Wiring** | Manual at every step | Zero - SDK handles it |
| **Conversation State** | Stateless (per request) | Stateful (persistent session) |
| **Error Recovery** | Manual retry logic | Built-in reconnection |
| **Telephony Ready** | Would need Twilio integration | Native SIP support |
| **Multi-Agent** | Not possible | Built-in handoff |
| **Production Scaling** | Horizontal Next.js API scaling | LiveKit Cloud auto-scaling |
| **Monitoring** | Custom logging | Built-in LiveKit analytics |
| **Development Complexity** | 3 separate systems to maintain | Single agent process |
| **Code to Maintain** | ~500 lines across multiple files | ~200 lines in one agent |

---

## Implementation Strategy: Parallel Native Pipeline

### Philosophy: Add, Don't Replace

**Zero-Risk Approach**: Build LiveKit-Native as a completely separate, parallel system without touching existing working code.

```
Current System (Keep Untouched)          New System (Build Separately)
═══════════════════════════              ════════════════════════════
✅ /api/food-chat                         🆕 /api/food-chat-native
✅ /api/voice-chat                        🆕 /api/voice-chat-native
✅ /food/concierge (AI SDK)               (Keep as-is)
✅ /food/concierge-livekit (Manual)       🆕 /food/concierge-native
✅ scripts/test-ai-sdk-*.js               🆕 scripts/test-livekit-native-*.js
✅ hooks/useAudioTranscription.ts         (Keep as-is)
✅ hooks/useRealtimeVoice.ts              (Keep as-is)
```

**Benefits**:
- ✅ Zero risk to existing users
- ✅ Working systems stay working
- ✅ Easy rollback (just remove new routes)
- ✅ Side-by-side comparison and A/B testing
- ✅ Learn LiveKit without breaking anything
- ✅ Progressive enhancement approach

---

## Pre-Implementation: Verifying Your Setup

### ✅ Your Current Environment (Confirmed)

**Local Supabase Status**:
```bash
# Run this to verify your tables:
node -r dotenv/config scripts/check-fc-tables.mjs dotenv_config_path=.env.local

# Expected result (YOUR CURRENT STATE):
✅ fc_profiles                         (1 records)
✅ fc_preferences                      (0 records)
✅ fc_restaurants                      (7 records)
✅ fc_layouts                          (0 records)
✅ fc_menu_sections                    (20 records)
✅ fc_menu_items                       (42 records)
✅ fc_menu_item_option_groups          (0 records)
✅ fc_menu_item_option_choices         (0 records)
✅ fc_carts                            (4 records)
✅ fc_cart_items                       (6 records)
✅ fc_cart_item_options                (0 records)
✅ fc_orders                           (1 records)
✅ fc_order_events                     (0 records)
✅ fc_feedback                         (0 records)

📊 All 14 Food Court tables are ready!
```

**Your Supabase Connection** (from `.env.local`):
```bash
SUPABASE_URL=http://127.0.0.1:54321              # Local Docker container
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...           # Local dev key
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321  # Same for client
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...        # Local anon key
```

### 🤔 Do You Need Remote Supabase for LiveKit?

**Short Answer: NO (for development), MAYBE (for production)**

**Development Mode** (✅ Your current setup works):
```
┌─────────────────────────────────────────────────────┐
│              Your Mac (localhost)                   │
│                                                     │
│  ┌──────────────┐    ┌──────────────┐            │
│  │   Next.js    │    │   Python     │            │
│  │   (port 3000)│    │   Agent      │            │
│  └──────┬───────┘    └──────┬───────┘            │
│         │                   │                     │
│         │    Both connect   │                     │
│         │    to localhost   │                     │
│         ▼                   ▼                     │
│  ┌─────────────────────────────────┐             │
│  │   Supabase Docker Container     │             │
│  │   (127.0.0.1:54321)            │             │
│  └─────────────────────────────────┘             │
│                                                     │
└─────────────────────────────────────────────────────┘

✅ Works perfectly for development!
✅ Python agent uses same 127.0.0.1:54321 URL
✅ Zero additional setup needed
```

**Production Deployment** (requires decision):

**Option A: Keep Local Supabase** (not recommended for production)
```
❌ Agent must run on same machine as Supabase
❌ Hard to scale agents independently
❌ Docker container needs production-grade setup
❌ No built-in backups/replication
```

**Option B: Switch to Remote Supabase** (recommended)
```
✅ Agents can run anywhere (LiveKit Cloud, AWS, etc.)
✅ Managed backups and replication
✅ Better performance and reliability
✅ Easy connection string change
✅ Can still develop locally with tunneling
```

**Recommended Path**:
1. **Phase 1 (Now)**: Develop with local Supabase (`127.0.0.1:54321`)
2. **Phase 2 (Testing)**: Test with remote Supabase (free tier)
3. **Phase 3 (Production)**: Deploy with remote Supabase

**Migration is Easy** (when ready):
```python
# Development (.env.local)
SUPABASE_URL=http://127.0.0.1:54321

# Production (.env.production)
SUPABASE_URL=https://your-project.supabase.co

# Same code, just different URL! 🎉
```

### 🔧 Local Development Network Configuration

**For Python Agent to Access Local Supabase**:

1. **Same machine** (✅ works by default):
   ```python
   # agents/.env
   SUPABASE_URL=http://127.0.0.1:54321  # or http://localhost:54321
   ```

2. **Docker network** (if agent also in Docker):
   ```python
   # Use Docker internal networking
   SUPABASE_URL=http://host.docker.internal:54321  # Mac/Windows
   # or
   SUPABASE_URL=http://172.17.0.1:54321  # Linux
   ```

3. **Different machine on network** (advanced):
   ```python
   # Find your Mac's IP: ifconfig | grep "inet "
   SUPABASE_URL=http://192.168.1.XXX:54321
   # Note: Ensure Supabase container exposes port to network
   ```

**For This Implementation**:
- ✅ Run Python agent on **same Mac** as Supabase
- ✅ Use `127.0.0.1:54321` as connection URL
- ✅ Works identically to TypeScript tools
- ⚠️ When deploying to production, update to remote URL

---

## Detailed Implementation Plan

### Step 1: Project Structure Setup

Create new directories for native LiveKit components:

```bash
ubereats-ai-sdk-hitl/
├── agents/                          # 🆕 NEW: Native LiveKit agents
│   ├── food_concierge_native.py     # Main native agent
│   ├── tools/                       # Agent function tools
│   │   ├── __init__.py
│   │   ├── profile.py              # get_user_profile
│   │   ├── search.py               # find_food_item, find_restaurants
│   │   ├── cart.py                 # cart operations
│   │   └── checkout.py             # order processing
│   ├── database.py                  # Supabase connection utilities
│   ├── requirements.txt             # Python dependencies
│   └── README.md                    # Agent setup instructions
│
├── app/
│   ├── api/
│   │   ├── food-chat/              # ✅ KEEP: Existing AI SDK
│   │   ├── voice-chat/             # ✅ KEEP: Existing manual LiveKit
│   │   └── livekit-native/         # 🆕 NEW: Native pipeline endpoints
│   │       ├── token/              # Generate LiveKit tokens for native
│   │       └── webhook/            # Handle agent events
│   │
│   └── food/
│       ├── concierge/              # ✅ KEEP: AI SDK version
│       ├── concierge-livekit/      # ✅ KEEP: Manual LiveKit version
│       └── concierge-native/       # 🆕 NEW: Native LiveKit version
│           ├── page.tsx            # Clone UI from concierge-livekit
│           └── components/         # Shared components
│
├── scripts/
│   ├── test-ai-sdk-*.js            # ✅ KEEP: Existing tests
│   ├── test-livekit-*.js           # ✅ KEEP: Existing tests
│   └── test-livekit-native-*.js    # 🆕 NEW: Native pipeline tests
│       ├── test-livekit-native-connection.js
│       ├── test-livekit-native-search.js
│       ├── test-livekit-native-cart.js
│       ├── test-livekit-native-checkout.js
│       └── test-livekit-native-end-to-end.js
│
└── docs/
    ├── SDK_STRATEGY.md             # ✅ KEEP: Original strategy
    ├── CHAT_FLOW_DESIGN.md         # ✅ KEEP: Current design
    └── LIVEKIT_PHASE2.md           # 📝 THIS FILE
```

---

### Step 2: Database Integration Mapping

**⚠️ CRITICAL: Read [LIVEKIT_NATIVE_INTEGRATION.md](./LIVEKIT_NATIVE_INTEGRATION.md) First!**

This document contains **complete tool-by-tool migration details** with:
- ✅ Exact TypeScript → Python query translations
- ✅ Side-by-side code comparisons for every tool
- ✅ Database connection setup
- ✅ Output format parity verification
- ✅ Testing strategies

**Your existing Supabase schema** (from [supabase/schema_merged_20251106.sql](../supabase/schema_merged_20251106.sql)):

```sql
-- Existing tables to use (NO CHANGES)
fc_profiles (id, household_name, default_location, ...)
fc_preferences (id, profile_id, favorite_cuisines, dietary_tags, ...)
fc_restaurants (id, slug, name, cuisine_group, cuisine, ...)
fc_menu_sections (id, restaurant_id, slug, title, ...)
fc_menu_items (id, restaurant_id, section_id, name, base_price, ...)
fc_carts (id, profile_id, restaurant_id, status, subtotal, ...)
fc_cart_items (id, cart_id, menu_item_id, quantity, total_price, ...)
fc_orders (id, profile_id, restaurant_id, restaurant_name, total, ...)
```

**TypeScript Tools to Migrate** (from [/app/api/voice-chat/tools.ts](../app/api/voice-chat/tools.ts)):

```typescript
export const voiceTools = {
  getUserProfile,      // → Python: get_user_profile()
  findFoodItem,        // → Python: find_food_item()
  findRestaurantsByType, // → Python: find_restaurants_by_type()
  quickViewCart,       // → Python: quick_view_cart()
  quickAddToCart,      // → Python: quick_add_to_cart()
  quickCheckout,       // → Python: quick_checkout()
};
```

**Python Agent Database Setup** (`agents/database.py`):

```python
"""
Database utilities for LiveKit Native Agent
Uses EXACT same Supabase connection as TypeScript tools
See LIVEKIT_NATIVE_INTEGRATION.md for complete implementation
"""

from supabase import create_client, Client
import os
from dotenv import load_dotenv

# Load same .env.local file as Next.js
load_dotenv('.env.local')

# Create client with SAME credentials as lib/supabaseServer.ts
supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")
)

DEMO_PROFILE_ID = os.getenv("DEMO_PROFILE_ID", "00000000-0000-0000-0000-000000000001")

print(f"✅ Supabase client initialized")
```

**Integration Summary**:
- 🔄 Python agent queries **exact same tables** as TypeScript
- 🔄 Uses **exact same environment variables**
- 🔄 Returns **exact same JSON formats**
- 🔄 Handles **exact same edge cases**
- ⚠️ **Zero database schema modifications required**

**See [LIVEKIT_NATIVE_INTEGRATION.md](./LIVEKIT_NATIVE_INTEGRATION.md) for**:
- Complete side-by-side code for all 6 tools
- Query pattern translations (joins, filters, ordering)
- Response format verification
- Error handling patterns
- Parity testing scripts

---

### Step 3: Native Agent Implementation

**File**: `agents/food_concierge_native.py`

```python
#!/usr/bin/env python3
"""
LiveKit Food Concierge Agent - Native Pipeline
Parallel implementation - does NOT replace existing manual pipeline
"""

import os
import logging
from typing import Annotated
from livekit.agents import (
    Agent,
    AgentSession,
    JobContext,
    function_tool,
    cli,
    WorkerOptions,
    WorkerType,
)
from livekit.plugins import openai, silero, deepgram, cartesia

# Import our database utilities (maps to existing Supabase schema)
from database import (
    get_user_profile,
    search_restaurants_by_cuisine,
    search_menu_items,
    get_or_create_cart,
    add_item_to_cart,
    get_cart_with_items,
    create_order_from_cart,
)

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

# Same system prompt as /api/voice-chat (for consistency)
SYSTEM_PROMPT = """You are the Food Court Voice Concierge for the Rivera household. You are designed for FAST, DIRECT voice interactions.

Core voice-first principles:
- Wait for the household to speak first
- **IMMEDIATE ACTION**: When someone asks for a specific food item, immediately call find_food_item
- Keep responses under 2 sentences unless asked for details
- Be conversational but efficient

Tools available:
- get_profile: Load user preferences
- find_food_item: Search for specific dishes
- find_restaurants: Search by cuisine type
- add_to_cart: Add items to cart
- view_cart: Show cart contents
- checkout: Complete order

Always prioritize speed and directness."""


# Function tools using existing database
@function_tool
async def get_profile(user_id: Annotated[str, "User ID"] = "default-user") -> str:
    """Load user profile, preferences, and delivery info"""
    profile = await get_user_profile(user_id)
    if not profile:
        return "No profile found. Using default settings."
    
    return f"""Profile loaded:
    Name: {profile.get('name', 'Rivera Household')}
    Address: {profile.get('default_address', 'Orlando, FL')}
    Phone: {profile.get('phone', 'Not set')}"""


@function_tool
async def find_food_item(
    item_name: Annotated[str, "Name of food item"],
    location: Annotated[str, "Delivery location"] = "Orlando, FL"
) -> str:
    """Search for specific food items across all restaurants"""
    items = await search_menu_items(item_name)
    
    if not items:
        return f"No items found matching '{item_name}'"
    
    results = []
    for item in items[:5]:
        restaurant = item.get('restaurants', {})
        results.append(
            f"- {item['name']} from {restaurant.get('name', 'Unknown')} (${item['price']})"
        )
    
    return f"Found {len(items)} options:\n" + "\n".join(results)


@function_tool
async def find_restaurants(
    cuisine_type: Annotated[str, "Type of cuisine"],
    location: Annotated[str, "Delivery location"] = "Orlando, FL"
) -> str:
    """Search for restaurants by cuisine type"""
    restaurants = await search_restaurants_by_cuisine(cuisine_type, location)
    
    if not restaurants:
        return f"No {cuisine_type} restaurants found in {location}"
    
    results = []
    for r in restaurants[:5]:
        results.append(
            f"- {r['name']} ({r['cuisine_type']}) - {r.get('delivery_time', '30-45')} min"
        )
    
    return f"Found {len(restaurants)} restaurants:\n" + "\n".join(results)


@function_tool
async def add_to_cart(
    item_name: Annotated[str, "Name of item to add"],
    restaurant_name: Annotated[str, "Restaurant name"],
    quantity: Annotated[int, "Quantity"] = 1,
    user_id: Annotated[str, "User ID"] = "default-user"
) -> str:
    """Add item to cart"""
    # Search for the item
    items = await search_menu_items(item_name)
    
    # Find matching item from specified restaurant
    matching_item = None
    for item in items:
        restaurant = item.get('restaurants', {})
        if restaurant.get('name', '').lower() in restaurant_name.lower():
            matching_item = item
            break
    
    if not matching_item:
        return f"Could not find {item_name} at {restaurant_name}"
    
    # Get or create cart
    cart_id = await get_or_create_cart(user_id)
    
    # Add to cart
    await add_item_to_cart(cart_id, matching_item['id'], quantity)
    
    return f"Added {quantity}x {matching_item['name']} to cart (${matching_item['price']} each)"


@function_tool
async def view_cart(user_id: Annotated[str, "User ID"] = "default-user") -> str:
    """View cart contents and total"""
    cart_id = await get_or_create_cart(user_id)
    cart_data = await get_cart_with_items(cart_id)
    
    if cart_data['item_count'] == 0:
        return "Your cart is empty"
    
    items_list = []
    for item in cart_data['items']:
        menu_item = item['menu_items']
        restaurant = menu_item.get('restaurants', {})
        items_list.append(
            f"- {item['quantity']}x {menu_item['name']} from {restaurant.get('name')} (${menu_item['price']} each)"
        )
    
    return f"Your cart ({cart_data['item_count']} items):\n" + "\n".join(items_list) + f"\n\nTotal: ${cart_data['total']:.2f}"


@function_tool
async def checkout(
    user_id: Annotated[str, "User ID"] = "default-user",
    confirm: Annotated[bool, "User confirmed order"] = False
) -> str:
    """Complete order and checkout"""
    if not confirm:
        return "Please confirm you want to complete this order by saying 'yes, checkout' or 'confirm order'"
    
    cart_id = await get_or_create_cart(user_id)
    cart_data = await get_cart_with_items(cart_id)
    
    if cart_data['item_count'] == 0:
        return "Cannot checkout with empty cart"
    
    # Create order
    order = await create_order_from_cart(cart_id, user_id)
    
    return f"Order confirmed! Order #{order['id']} placed. Total: ${order['total_amount']:.2f}. Estimated delivery: 30-45 minutes."


async def entrypoint(ctx: JobContext):
    """Main agent entrypoint - native pipeline"""
    
    logger.info(f"🚀 Native agent starting for room: {ctx.room.name}")
    
    # Native pipeline with automatic STT→LLM→TTS
    session = AgentSession(
        # Choose STT provider
        stt=deepgram.STT(model="nova-3", language="en-US"),
        # Or use OpenAI: stt=openai.STT(model="whisper-1"),
        
        # Same OpenAI LLM as existing APIs
        llm=openai.LLM(model="gpt-4o", temperature=0.7),
        
        # Choose TTS provider
        tts=cartesia.TTS(model="sonic-english", voice="a0e99841-438c-4a64-b679-ae501e7d6091"),
        # Or use OpenAI: tts=openai.TTS(model="tts-1", voice="alloy"),
        
        # Automatic turn detection
        vad=silero.VAD.load(
            min_speech_duration=0.3,
            min_silence_duration=0.8,
        ),
    )
    
    # Create agent with tools
    agent = Agent(
        name="Food Concierge Native",
        instructions=SYSTEM_PROMPT,
        tools=[
            get_profile,
            find_food_item,
            find_restaurants,
            add_to_cart,
            view_cart,
            checkout,
        ],
    )
    
    # Start session
    await session.start(agent=agent, room=ctx.room)
    
    logger.info("✅ Native agent session active")


if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))
```

---

### Step 4: Frontend UI (Clone Existing)

**File**: `app/food/concierge-native/page.tsx`

Clone your existing [concierge-livekit/page.tsx](../app/food/concierge-livekit/page.tsx) but update for native pipeline:

```tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { LiveKitRoom, useVoiceAssistant, AudioTrack } from '@livekit/components-react';
import '@livekit/components-styles';

// Reuse existing components (NO CHANGES to these)
import ProfileCard from '@/app/food/components/ProfileCard';
import RestaurantSearchResults from '@/app/food/components/RestaurantSearchResults';
import MenuItemsDisplay from '@/app/food/components/MenuItemsDisplay';
import CartSummary from '@/app/food/components/CartSummary';
import OrderConfirmation from '@/app/food/components/OrderConfirmation';
import DebugPanel from '@/components/DebugPanel';

export default function NativeLiveKitConciergePage() {
  const [token, setToken] = useState<string>('');
  const [messages, setMessages] = useState<any[]>([]);
  
  // Get connection token from NEW endpoint
  useEffect(() => {
    async function fetchToken() {
      const response = await fetch('/api/livekit-native/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantName: 'native-user' })
      });
      const data = await response.json();
      setToken(data.token);
    }
    fetchToken();
  }, []);

  if (!token) return <div>Connecting to native agent...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-rose-50">
      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-8">
        
        {/* Header */}
        <section className="text-center">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Food Concierge
            <span className="block text-lg font-normal text-orange-600 mt-1">
              LiveKit Native Pipeline
            </span>
          </h1>
          <p className="text-slate-600 text-sm">
            Automatic turn detection • Zero manual wiring • Always listening
          </p>
        </section>

        {/* LiveKit Room with Native Agent */}
        <LiveKitRoom
          serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
          token={token}
          connect={true}
          audio={true}
          video={false}
        >
          <NativeVoiceAssistantUI messages={messages} setMessages={setMessages} />
        </LiveKitRoom>

        {/* Comparison Badge */}
        <section className="rounded-3xl border border-green-200 bg-green-50/50 p-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-green-700 mb-3">
            Native Pipeline Advantages
          </h2>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-slate-700">
            <div>
              <h3 className="font-semibold mb-2">Automatic Features</h3>
              <ul className="space-y-1 text-xs">
                <li>✅ Always listening (no button needed)</li>
                <li>✅ Automatic turn detection via VAD</li>
                <li>✅ Natural interruption support</li>
                <li>✅ 500ms total latency</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Zero Manual Wiring</h3>
              <ul className="space-y-1 text-xs">
                <li>✅ STT → LLM → TTS automatic</li>
                <li>✅ No separate API calls</li>
                <li>✅ Stateful session management</li>
                <li>✅ Built-in error recovery</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Debug Panel (reuse existing component) */}
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <DebugPanel toolExecutions={[]} isProduction={false} />
        </section>
      </main>
    </div>
  );
}

function NativeVoiceAssistantUI({ messages, setMessages }: any) {
  const { state, audioTrack } = useVoiceAssistant();
  
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Voice Assistant
          </h2>
          <div className="text-sm">
            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${
              state === 'listening' ? 'bg-green-100 text-green-700' :
              state === 'thinking' ? 'bg-blue-100 text-blue-700' :
              state === 'speaking' ? 'bg-purple-100 text-purple-700' :
              'bg-slate-100 text-slate-700'
            }`}>
              {state === 'listening' && '🎤 Listening'}
              {state === 'thinking' && '🤔 Thinking'}
              {state === 'speaking' && '🗣️ Speaking'}
              {state === 'idle' && '⏸️ Idle'}
            </span>
          </div>
        </div>
      </div>
      
      {/* Audio track (handles playback automatically) */}
      {audioTrack && <AudioTrack track={audioTrack} />}
      
      {/* No recording button needed - always listening! */}
      <div className="text-center py-8 text-slate-500">
        <p className="text-sm">Just start speaking - the agent is always listening</p>
        <p className="text-xs mt-2">Try: "I want cheesecake for my wife"</p>
      </div>
    </div>
  );
}
```

**Key differences from manual version**:
- ❌ No recording button
- ❌ No `useAudioTranscription` hook
- ❌ No manual `/api/voice-chat` calls
- ✅ Uses `useVoiceAssistant` hook (native)
- ✅ Always listening via VAD
- ✅ Automatic state management

---

### Step 5: Test Scripts for Native Pipeline

#### Test 1: Connection Test
**File**: `scripts/test-livekit-native-connection.js`

```javascript
#!/usr/bin/env node
/**
 * Test LiveKit Native Pipeline - Connection
 * Verify agent can connect and respond
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

async function testConnection() {
  console.log('🧪 Testing LiveKit Native Connection\n');
  console.log('='.repeat(60));
  
  try {
    // Test 1: Get token for native pipeline
    console.log('\n📍 TEST 1: Get connection token');
    const tokenResponse = await fetch(`${BASE_URL}/api/livekit-native/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantName: 'test-user' })
    });
    
    if (!tokenResponse.ok) {
      throw new Error(`Token request failed: ${tokenResponse.status}`);
    }
    
    const { token, wsUrl } = await tokenResponse.json();
    console.log('✅ Token received');
    console.log(`   WebSocket URL: ${wsUrl}`);
    console.log(`   Token length: ${token.length} chars`);
    
    // Test 2: Verify agent is running
    console.log('\n📍 TEST 2: Verify agent availability');
    // TODO: Implement health check endpoint
    console.log('⏭️  Skipped (requires agent health endpoint)');
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ CONNECTION TEST PASSED');
    console.log('\nNext: Start agent with: cd agents && python food_concierge_native.py dev');
    
  } catch (error) {
    console.error('\n❌ CONNECTION TEST FAILED');
    console.error('Error:', error.message);
    process.exit(1);
  }
}

testConnection();
```

#### Test 2: Search Test
**File**: `scripts/test-livekit-native-search.js`

```javascript
#!/usr/bin/env node
/**
 * Test LiveKit Native Pipeline - Food Search
 * Verify agent can search menu items and restaurants
 */

async function testSearch() {
  console.log('🧪 Testing LiveKit Native - Food Search\n');
  console.log('This test requires the agent to be running');
  console.log('Start agent: cd agents && python food_concierge_native.py dev');
  console.log('='.repeat(60));
  
  // TODO: Implement using LiveKit client SDK to send messages
  console.log('\n📍 Manual Test Steps:');
  console.log('1. Visit http://localhost:3000/food/concierge-native');
  console.log('2. Say: "I want cheesecake"');
  console.log('3. Verify agent responds with cheesecake options');
  console.log('4. Say: "Find Thai restaurants"');
  console.log('5. Verify agent lists Thai restaurants');
  
  console.log('\n⏭️  Automated test pending (requires LiveKit client SDK integration)');
}

testSearch();
```

#### Test 3: Cart Test
**File**: `scripts/test-livekit-native-cart.js`

```javascript
#!/usr/bin/env node
/**
 * Test LiveKit Native Pipeline - Cart Operations
 */

async function testCart() {
  console.log('🧪 Testing LiveKit Native - Cart Operations\n');
  console.log('='.repeat(60));
  
  console.log('\n📍 Manual Test Steps:');
  console.log('1. Say: "I want strawberry cheesecake from Cheesecake Factory"');
  console.log('2. Say: "Add it to my cart"');
  console.log('3. Say: "Show my cart"');
  console.log('4. Verify cart contains strawberry cheesecake');
  
  console.log('\n⏭️  Automated test pending');
}

testCart();
```

#### Test 4: Checkout Test
**File**: `scripts/test-livekit-native-checkout.js`

```javascript
#!/usr/bin/env node
/**
 * Test LiveKit Native Pipeline - Order Checkout
 */

async function testCheckout() {
  console.log('🧪 Testing LiveKit Native - Checkout\n');
  console.log('='.repeat(60));
  
  console.log('\n📍 Manual Test Steps:');
  console.log('1. Say: "Add vanilla cheesecake to cart"');
  console.log('2. Say: "Checkout"');
  console.log('3. Agent should ask for confirmation');
  console.log('4. Say: "Yes, confirm"');
  console.log('5. Verify order is created in Supabase orders table');
  
  console.log('\n⏭️  Automated test pending');
}

testCheckout();
```

#### Test 5: End-to-End Test
**File**: `scripts/test-livekit-native-end-to-end.js`

```javascript
#!/usr/bin/env node
/**
 * Test LiveKit Native Pipeline - Full End-to-End Flow
 * Complete order from search to checkout
 */

async function testEndToEnd() {
  console.log('🧪 Testing LiveKit Native - End-to-End Order Flow\n');
  console.log('='.repeat(60));
  
  console.log('\n📍 Complete Order Scenario:');
  console.log('1. Start: "I want cheesecake for my wife"');
  console.log('2. Agent: Shows cheesecake options');
  console.log('3. User: "Add the strawberry one to cart"');
  console.log('4. Agent: Confirms addition');
  console.log('5. User: "Show my cart"');
  console.log('6. Agent: Displays cart with total');
  console.log('7. User: "Let\'s checkout"');
  console.log('8. Agent: Requests confirmation');
  console.log('9. User: "Yes, confirm order"');
  console.log('10. Agent: Order confirmed with estimated delivery');
  
  console.log('\n✅ Test this manually at /food/concierge-native');
  console.log('\n⏭️  Automated test pending (requires voice simulation)');
}

testEndToEnd();
```

---

### Step 6: Navigation Header Update

Update your site header to include the new native option:

**File**: `app/components/Navigation.tsx` (or wherever your nav is)

```tsx
const navigationLinks = [
  {
    href: '/food/concierge',
    label: 'Concierge (AI SDK)',
    badge: 'Text Chat',
    color: 'blue'
  },
  {
    href: '/food/concierge-livekit',
    label: 'Concierge (LiveKit Manual)',
    badge: 'Voice Manual',
    color: 'purple'
  },
  {
    href: '/food/concierge-native',
    label: 'Concierge (LiveKit Native)', // 🆕 NEW
    badge: 'Voice Native',
    color: 'green'
  },
];
```

---

### Step 7: Testing Checklist

Create comprehensive test plan before implementation:

```markdown
## Native Pipeline Testing Checklist

### Pre-Implementation
- [ ] Read LIVEKIT_PHASE2.md completely
- [ ] Review existing Supabase schema
- [ ] Confirm no schema changes needed
- [ ] Map all existing API tools to agent functions

### Infrastructure Setup
- [ ] Create `agents/` directory structure
- [ ] Install Python dependencies (`pip install livekit-agents`)
- [ ] Set up environment variables
- [ ] Start local LiveKit server (`livekit-server --dev`)

### Agent Development
- [ ] Create `agents/database.py` with Supabase utilities
- [ ] Implement `get_user_profile` function tool
- [ ] Implement `find_food_item` function tool
- [ ] Implement `find_restaurants` function tool
- [ ] Implement `add_to_cart` function tool
- [ ] Implement `view_cart` function tool
- [ ] Implement `checkout` function tool
- [ ] Test each tool in isolation

### Agent Testing
- [ ] Start agent: `python food_concierge_native.py dev`
- [ ] Verify agent connects to LiveKit server
- [ ] Test agent joins room when user connects
- [ ] Manually trigger each tool via voice
- [ ] Verify tools query correct Supabase tables
- [ ] Check logs for errors

### Frontend Development
- [ ] Create `/api/livekit-native/token` endpoint
- [ ] Create `/app/food/concierge-native/page.tsx`
- [ ] Clone UI components from existing LiveKit page
- [ ] Integrate `@livekit/components-react`
- [ ] Remove recording button (always listening)
- [ ] Test WebRTC connection

### Integration Testing
- [ ] Run `scripts/test-livekit-native-connection.js`
- [ ] Run `scripts/test-livekit-native-search.js`
- [ ] Run `scripts/test-livekit-native-cart.js`
- [ ] Run `scripts/test-livekit-native-checkout.js`
- [ ] Run `scripts/test-livekit-native-end-to-end.js`

### Voice Testing
- [ ] Test: "I want cheesecake" → Should show options
- [ ] Test: "Add strawberry cheesecake to cart" → Should add item
- [ ] Test: "Show my cart" → Should display cart
- [ ] Test: "Checkout" → Should request confirmation
- [ ] Test: "Yes, confirm" → Should create order
- [ ] Test interrupting agent mid-sentence
- [ ] Test background noise handling
- [ ] Test multiple concurrent users

### Database Verification
- [ ] Check `profiles` table after profile query
- [ ] Check `menu_items` search results are correct
- [ ] Check `carts` table after adding items
- [ ] Check `cart_items` table has correct quantities
- [ ] Check `orders` table after checkout
- [ ] Check `order_items` table after checkout
- [ ] Verify no duplicate carts created

### Performance Testing
- [ ] Measure end-to-end latency (target: <1 second)
- [ ] Test with slow network conditions
- [ ] Test with multiple users (2-5 concurrent)
- [ ] Monitor CPU/memory usage
- [ ] Check WebRTC bandwidth usage

### Comparison Testing
- [ ] Same query in AI SDK vs Native (compare results)
- [ ] Same query in Manual LiveKit vs Native (compare speed)
- [ ] Verify all three systems use same database
- [ ] Confirm all three systems still work independently

### Documentation
- [ ] Document API endpoint differences
- [ ] Document new environment variables needed
- [ ] Create troubleshooting guide
- [ ] Update README.md with native setup instructions
- [ ] Add architecture diagram showing all three systems

### Deployment Readiness
- [ ] All tests passing
- [ ] No errors in agent logs
- [ ] No errors in browser console
- [ ] Supabase queries optimized
- [ ] Ready to add to production navigation
```

---

## Implementation Timeline

### Week 1: Foundation
- **Day 1-2**: Infrastructure setup
  - Install Python dependencies
  - Set up local LiveKit server
  - Create project structure
  - Configure environment variables

- **Day 3-4**: Database layer
  - Create `agents/database.py`
  - Implement and test all database functions
  - Verify queries match existing APIs
  - Test with existing Supabase data

- **Day 5**: Agent skeleton
  - Create basic agent with one tool
  - Test connection to LiveKit
  - Verify tool execution works
  - Check logs and debugging

### Week 2: Core Implementation
- **Day 1-2**: Complete agent tools
  - Implement all 6 function tools
  - Test each tool individually
  - Verify Supabase integration
  - Handle edge cases

- **Day 3-4**: Frontend development
  - Create `/api/livekit-native/token` endpoint
  - Build `concierge-native/page.tsx`
  - Integrate LiveKit React components
  - Test WebRTC connection

- **Day 5**: Integration
  - Connect frontend to agent
  - Test full voice pipeline
  - Debug issues
  - Tune VAD parameters

### Week 3: Testing & Polish
- **Day 1-2**: Comprehensive testing
  - Run all test scripts
  - Manual voice testing
  - Multi-user testing
  - Performance optimization

- **Day 3-4**: Documentation & refinement
  - Complete testing checklist
  - Document issues found
  - Implement fixes
  - Update documentation

- **Day 5**: Launch preparation
  - Final end-to-end tests
  - Add to navigation
  - Deploy to staging
  - Team demo

---

## Success Criteria

Native pipeline is ready for production when:

1. ✅ All test scripts pass
2. ✅ Agent responds within 1 second of speech end
3. ✅ Cart operations match existing API behavior exactly
4. ✅ Orders appear in Supabase identically to existing systems
5. ✅ Can handle 5 concurrent users without issues
6. ✅ Interruptions work naturally
7. ✅ No errors in logs for common scenarios
8. ✅ UI matches existing LiveKit page
9. ✅ All existing systems still work (no regressions)
10. ✅ Team members successfully complete test order

---

## Risk Mitigation

### What Could Go Wrong?

**Risk 1: Agent doesn't connect to LiveKit**
- *Prevention*: Test connection immediately after setup
- *Mitigation*: Detailed logging, health check endpoint

**Risk 2: Database queries don't match existing behavior**
- *Prevention*: Mirror existing API queries exactly
- *Mitigation*: Side-by-side testing with existing APIs

**Risk 3: Voice pipeline has high latency**
- *Prevention*: Use Deepgram STT + Cartesia TTS (fastest options)
- *Mitigation*: Profile and optimize, tune VAD parameters

**Risk 4: Concurrent users interfere with each other**
- *Prevention*: Each user gets separate room
- *Mitigation*: Test with multiple users early

**Risk 5: HITL approval breaks in native pipeline**
- *Prevention*: Implement RPC-based approval from day 1
- *Mitigation*: Fall back to voice confirmation

### Rollback Plan

If native pipeline has issues:
1. Remove from navigation (1 line change)
2. Existing systems continue unchanged
3. Fix issues in native pipeline without pressure
4. Re-test completely before re-launch
5. Zero impact to current users

---

## Comparison: All Three Systems

| Feature | AI SDK (Text) | LiveKit Manual | LiveKit Native |
|---------|---------------|----------------|----------------|
| **Route** | /food/concierge | /food/concierge-livekit | /food/concierge-native |
| **API** | /api/food-chat | /api/voice-chat | Agent (no API route) |
| **Input** | Typing | Voice (button) | Voice (always on) |
| **Output** | Text + cards | Text + cards + voice | Voice + cards |
| **Transcription** | N/A | Manual (/api/openai/transcribe) | Automatic (Deepgram/Whisper) |
| **Turn Detection** | Enter key | Button press | Automatic VAD |
| **Latency** | Instant | 2-4 seconds | <1 second |
| **Interruptions** | N/A | Not supported | Native support |
| **Code to Maintain** | 200 lines | 500 lines | 200 lines |
| **Complexity** | Low | High | Low |
| **Best For** | Text chat, browsing | Initial voice testing | Production voice |

---

## Summary

### The Plan

1. **Keep everything working** - No changes to existing code
2. **Build parallel system** - New routes, new agent, new UI
3. **Test thoroughly** - Comprehensive test scripts
4. **Compare side-by-side** - Verify same database, same results
5. **Launch when ready** - Add to nav only when all tests pass
6. **Learn and iterate** - No pressure, no risk

### Benefits of This Approach

- ✅ Zero risk to existing users
- ✅ Easy rollback (just remove from nav)
- ✅ Side-by-side comparison
- ✅ Learn LiveKit gradually
- ✅ Independent testing and iteration
- ✅ Progressive enhancement

### Next Steps

1. Review this document with team
2. Confirm approach and timeline
3. Set up development environment
4. Begin Week 1 implementation
5. Daily check-ins on progress

**Remember**: This is an experiment and learning opportunity. Take time to understand LiveKit's native capabilities without pressure to replace working systems.

---

## Cost Analysis: Adding Native Pipeline

### Current System Costs (Unchanged)

**OpenAI API Usage** (per 100 voice interactions):
- Whisper STT: 100 mins × $0.006/min = $0.60
- GPT-4 LLM: ~200K tokens × $5/1M = $1.00
- TTS: 100 responses × 20s avg × $0.015/min = $0.50
- **Total: ~$2.10 per 100 interactions**

**Infrastructure**:
- Next.js hosting (Vercel): $0 (hobby tier)
- No additional infrastructure

### Native Pipeline Costs (Incremental)

**OpenAI API Usage** (if users migrate to native):
- Still $2.10 per 100 interactions
- Same OPENAI_API_KEY shared
- **No increase if same users just use different interface**

**Optional Plugin Upgrades** (can reduce costs):
- Deepgram STT: $0.0043/min (28% cheaper than Whisper)
- Cartesia TTS: $0.00002/char (~40% cheaper + faster)
- **Potential savings: $0.50 per 100 interactions = 24% reduction**

**LiveKit Infrastructure** (only new cost):
- LiveKit Cloud: Free tier (50GB/mo bandwidth, ~500 sessions)
- Paid tier: $99/mo (500GB bandwidth, ~5000 voice sessions)
- Or self-hosted: $0 (use your own servers)

**Cost Impact**:
- ✅ Potentially 24% API cost savings with Deepgram + Cartesia
- ✅ Much better UX (faster, natural conversations)
- ✅ Free tier works for testing and low volume
- ❌ $0-99/mo infrastructure cost for high volume (vs $0 current)

**ROI Calculation**:
- If <500 sessions/month: Free LiveKit tier covers it = **$0 additional cost**
- If >5000 sessions/month: API savings ($500/mo) > LiveKit cost ($99/mo) = **Net savings**
- Sweet spot: Native pipeline pays for itself with volume

**Parallel Implementation Cost**:
During parallel phase, you'll run all three systems:
- AI SDK text: Uses OpenAI tokens
- LiveKit manual: Uses OpenAI tokens
- LiveKit native: Uses OpenAI tokens (or cheaper alternatives)

**Total cost = sum of what users actually use**. Three systems available doesn't mean 3x cost - only usage matters.

---

## Database Integration

Your agent tools need Supabase access. Add this to `food_concierge_agent.py`:

```python
from supabase import create_client, Client
import os

# Initialize Supabase (same as your Next.js app)
supabase: Client = create_client(
    os.getenv("NEXT_PUBLIC_SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")  # Use service role for server-side
)

@function_tool
async def find_food_item(
    item_name: Annotated[str, "Name of food item to search for"],
    location: Annotated[str, "Location for search"] = "Orlando, FL"
) -> str:
    """Search for a specific food item across all restaurants."""
    
    # Query Supabase menu_items table (same as your API)
    response = supabase.table("menu_items").select(
        "*, restaurants(name, cuisine_type)"
    ).ilike("name", f"%{item_name}%").execute()
    
    items = response.data
    
    if not items:
        return f"No items found matching '{item_name}' in {location}"
    
    # Format results (same as your voice-chat API)
    results = []
    for item in items[:5]:  # Top 5 results
        results.append(
            f"- {item['name']} at {item['restaurants']['name']} (${item['price']})"
        )
    
    return f"Found {len(items)} items:\n" + "\n".join(results)
```

This gives your LiveKit agent the **exact same database access** as your current Next.js API.

---

## Human-in-the-Loop (HITL) with Native LiveKit

Your current HITL pattern (approval before checkout) can be preserved:

```python
from livekit.agents import rpc

@function_tool
async def quick_checkout(
    user_id: Annotated[str, "User ID"] = "default-user",
    payment_method: Annotated[str, "Payment method"] = "default"
) -> str:
    """Complete the order - requires user approval."""
    
    # 1. Fetch cart contents
    cart_data = await get_cart_contents(user_id)
    
    # 2. Send approval request to frontend via RPC
    approval_response = await rpc.call_remote(
        "request_checkout_approval",
        cart=cart_data,
        total=cart_data['total']
    )
    
    # 3. Wait for user to approve/deny in UI
    if not approval_response.get("approved"):
        return "Checkout cancelled by user"
    
    # 4. Process order
    order_id = await process_order(user_id, cart_data)
    
    return f"Order confirmed! Order ID: {order_id}. Estimated delivery: 30-45 minutes"
```

Frontend receives RPC call and shows approval card (same as current UI).

---

## Advanced Features You're Missing

### 1. Multi-Agent Handoff

```python
# In your food agent
from livekit.agents import Agent

async def transfer_to_support():
    """Transfer user to customer support agent"""
    support_agent = Agent.load("customer_support")
    await session.transfer_to(support_agent)
    # User seamlessly moves to support agent, context preserved
```

**Use cases**:
- Order issues → transfer to support
- Complex dietary restrictions → transfer to nutrition specialist
- Billing questions → transfer to billing agent

### 2. Proactive Notifications

```python
# Agent can initiate conversations
async def send_order_update(user_id: str, order_id: str):
    """Proactively notify user about order status"""
    room = await get_user_room(user_id)
    await room.local_participant.publish_data(
        json.dumps({
            "type": "order_update",
            "message": "Your order is 5 minutes away!",
            "order_id": order_id
        })
    )
    # Agent speaks: "Your food is almost here!"
```

### 3. Telephony Integration

```python
# agents/sip_integration.py
from livekit.plugins import sip

async def handle_phone_call(ctx: JobContext):
    """Handle incoming phone orders"""
    # Connect to SIP trunk
    # User calls 1-800-RIVERA-FOOD
    # Agent answers and handles order via phone
    # Same agent, same tools, zero code changes
```

### 4. Real-Time Sentiment Analysis

```python
async def monitor_conversation_sentiment(transcript: str):
    """Detect frustrated users and adapt"""
    sentiment = await analyze_sentiment(transcript)
    if sentiment < 0.3:  # User frustrated
        # Switch to more empathetic tone
        agent.update_instructions(
            "User seems frustrated. Be extra patient and helpful."
        )
        # Or transfer to human support
        await transfer_to_support()
```

---

## Troubleshooting

### Common Issues

**1. "Agent not joining room"**
- Check `LIVEKIT_URL` matches server (ws:// vs wss://)
- Verify API key/secret are correct
- Check firewall rules for WebRTC ports

**2. "No audio heard from agent"**
- Check TTS plugin API key (if using Cartesia/ElevenLabs)
- Verify browser audio permissions
- Check LiveKit Cloud dashboard for audio track

**3. "High latency (>2 seconds)"**
- Switch to Cartesia TTS (faster than OpenAI)
- Use Deepgram STT (faster than Whisper)
- Check network: LiveKit Cloud has edge servers worldwide

**4. "Agent not detecting turn end"**
- Tune VAD parameters:
  ```python
  vad=silero.VAD.load(
      min_silence_duration=0.5,  # Reduce for faster detection
      threshold=0.3,  # Lower = more sensitive
  )
  ```

**5. "Tool calls not executing"**
- Check function tool decorators are correct
- Verify async/await syntax
- Check agent logs for errors

---

## Next Steps

### Immediate (This Week)
1. ✅ Read this document (done!)
2. ⬜ Set up LiveKit Cloud account (free tier)
3. ⬜ Install Python agents SDK
4. ⬜ Create basic agent (copy code above)
5. ⬜ Test with one tool (e.g., get_user_profile)

### Short Term (This Month)
1. ⬜ Migrate all food tools to Python
2. ⬜ Connect agent to Supabase
3. ⬜ Deploy test environment
4. ⬜ Internal testing with team
5. ⬜ Performance benchmarking vs current system

### Long Term (Next Quarter)
1. ⬜ Production deployment
2. ⬜ A/B testing with real users
3. ⬜ Implement multi-agent features
4. ⬜ Add telephony for phone orders
5. ⬜ Scale to handle peak traffic

---

## Resources

### Internal Documentation

**🔥 Start Here**:
1. **[LIVEKIT_NATIVE_INTEGRATION.md](./LIVEKIT_NATIVE_INTEGRATION.md)** - Complete TypeScript→Python integration guide with side-by-side code
2. **[LIVEKIT_PHASE2.md](./LIVEKIT_PHASE2.md)** - This file (overall implementation plan)

**Background Context**:
- [SDK_STRATEGY.md](./SDK_STRATEGY.md) - Original comparison and planning
- [CHAT_FLOW_DESIGN.md](./CHAT_FLOW_DESIGN.md) - Current pipeline architecture
- [CHAT_FLOW_LOGS.md](./CHAT_FLOW_LOGS.md) - Testing logs

### External Documentation
- [LiveKit Agents Docs](https://docs.livekit.io/agents/)
- [Python Agents Quickstart](https://docs.livekit.io/agents/quickstart/)
- [Function Tools Guide](https://docs.livekit.io/agents/tools/)
- [Supabase Python Client](https://supabase.com/docs/reference/python/introduction)

### Code Examples
- [LiveKit Agents Examples](https://github.com/livekit/agents/tree/main/examples)
- [Voice Assistant Example](https://github.com/livekit/agents/tree/main/examples/voice-assistant)

### Community
- [LiveKit Discord](https://livekit.io/discord)
- [LiveKit GitHub Discussions](https://github.com/livekit/livekit/discussions)

---

## Summary

### The Plan: Risk-Free Parallel Implementation

**What We're Doing**:
1. **Keep everything working** - Zero changes to existing code
2. **Build parallel system** - New agent, new routes, new UI page
3. **Test thoroughly** - Comprehensive test scripts for native pipeline
4. **Compare side-by-side** - Verify same database, same results, better UX
5. **Launch when ready** - Add to navigation only when all tests pass
6. **Learn and iterate** - No pressure, no migration deadline, no risk

### Three Systems Running Independently

```
┌─────────────────────────────────────────────────────────────┐
│                     User Navigation                         │
└─────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
   ┌──────────┐        ┌──────────┐        ┌──────────┐
   │ Concierge│        │ Concierge│        │ Concierge│
   │ (AI SDK) │        │ (Manual) │        │ (Native) │
   └──────────┘        └──────────┘        └──────────┘
         │                    │                    │
         ▼                    ▼                    ▼
   ┌──────────┐        ┌──────────┐        ┌──────────┐
   │  /api/   │        │  /api/   │        │ Python   │
   │food-chat │        │voice-chat│        │  Agent   │
   └──────────┘        └──────────┘        └──────────┘
         │                    │                    │
         └────────────────────┴────────────────────┘
                             │
                             ▼
                   ┌──────────────────┐
                   │ Same Supabase DB │
                   │ Same OpenAI Key  │
                   └──────────────────┘
```

### Current Capabilities (What We Use)

**You're currently using ~20% of LiveKit** - just WebRTC transport for manual voice pipeline.

### Native Capabilities (What We're Building)

**LiveKit can natively handle**:
- ✅ Voice Activity Detection (VAD) - no button needed
- ✅ Speech-to-Text (STT) - automatic transcription
- ✅ LLM orchestration - same OpenAI integration
- ✅ Function tools - same database queries
- ✅ Text-to-Speech (TTS) - automatic voice response
- ✅ Conversation state - persistent across turns
- ✅ Interruption handling - natural conversations
- ✅ Multi-agent handoff - future enhancement
- ✅ Telephony integration - phone orders ready
- ✅ Production scaling - built-in load balancing

### What This Means in Code

**Current manual pipeline**: ~500 lines across multiple files
- `/api/voice-chat/route.ts` (102 lines)
- `/api/openai/transcribe/route.ts` (30 lines)
- `hooks/useAudioTranscription.ts` (150 lines)
- `hooks/useRealtimeVoice.ts` (300 lines)
- `app/food/concierge-livekit/page.tsx` (200 lines)
- **Total: ~780 lines + complex state management**

**New native pipeline**: ~200 lines in one file
- `agents/food_concierge_native.py` (~200 lines)
- Frontend just displays state (minimal code)
- **Total: ~200 lines + LiveKit handles everything**

### Benefits

**Technical**:
- 🚀 500-800ms latency (vs 2-4 seconds current)
- 🎯 Automatic turn detection (vs button press)
- 💬 Natural interruptions (vs none)
- 🔧 Less code to maintain (200 vs 780 lines)
- 📊 Better monitoring (LiveKit analytics)

**Business**:
- ✅ Zero risk (parallel deployment)
- ✅ Better UX (faster, natural voice)
- ✅ Same costs (or lower with optimizations)
- ✅ Future-ready (telephony, multi-agent)
- ✅ Easy comparison (A/B test ready)

**Team**:
- 🎓 Learn LiveKit capabilities
- 🧪 Experiment without pressure
- 📈 Measure improvements
- 🎯 Choose best tool for each use case
- 🔄 Easy rollback if needed

### Next Steps

### ✅ Pre-Flight Checklist (Verified for Your Setup)

**Your Environment Status**:
- ✅ **Supabase Local**: Running on `127.0.0.1:54321` (Docker)
- ✅ **All 14 fc_ tables**: Verified with `scripts/check-fc-tables.mjs`
  - fc_profiles (1 record), fc_restaurants (7), fc_menu_items (42), etc.
- ✅ **Environment Variables**: Configured in `.env.local`
- ✅ **No Custom Query Patterns**: Standard Supabase queries work
- ✅ **No Remote Migration Needed**: Local Supabase works fine for development

**Confirmed Answers to Your Questions**:

1. **Do all fc_ tables exist?**
   ```bash
   ✅ YES - Run to verify anytime:
   node -r dotenv/config scripts/check-fc-tables.mjs dotenv_config_path=.env.local
   
   Result: All 14 tables exist with data ready
   ```

2. **Environment variables configured?**
   ```bash
   ✅ YES - Already in .env.local:
   SUPABASE_URL=http://127.0.0.1:54321
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
   OPENAI_API_KEY=sk-proj-...
   ```

3. **Need remote Supabase for LiveKit?**
   ```bash
   ✅ NO (for development)
   Python agent runs on same Mac → connects to 127.0.0.1:54321
   Same connection as TypeScript tools - works perfectly!
   
   ⚠️ YES (for production deployment later)
   When deploying agent to server/cloud, use remote Supabase URL
   ```

4. **Custom query patterns?**
   ```bash
   ✅ NONE - Standard Supabase queries
   All TypeScript queries translate directly to Python
   No special handling needed
   ```

### Implementation Roadmap

**Week 1: Foundation & Database** (5 days)
1. ✅ Verify tables (DONE - used `check-fc-tables.mjs`)
2. ⬜ Install Python dependencies: `pip install livekit-agents supabase`
3. ⬜ Set up `agents/.env` with same credentials as `.env.local`
4. ⬜ Test Python→Supabase connection locally
5. ⬜ Create `agents/database.py` with Supabase queries
6. ⬜ Test each database function matches TypeScript output

**Week 2: Agent & Tools** (5 days)
1. ⬜ Install local LiveKit server: `livekit-server --dev`
2. ⬜ Create basic Python agent skeleton
3. ⬜ Implement all 6 function tools from voice-chat
4. ⬜ Test agent connects to local LiveKit
5. ⬜ Verify tools return same data as TypeScript versions

**Week 3: Frontend & Testing** (5 days)
1. ⬜ Create `/api/livekit-native/token` endpoint
2. ⬜ Build `/food/concierge-native/page.tsx` 
3. ⬜ Test browser→LiveKit→Agent→Supabase flow
4. ⬜ Run parity tests (native vs manual pipeline)
5. ⬜ Add to navigation when all tests pass

**Ready to Start?**
1. **Review this document** (✅ Done!)
2. **Read [LIVEKIT_NATIVE_INTEGRATION.md](./LIVEKIT_NATIVE_INTEGRATION.md)** for tool migration details
3. **Begin Week 1, Day 1**: Install Python dependencies
4. **Ask questions**: Use existing test scripts as reference

**Timeline**: 3 weeks to production-ready native pipeline

**Remember**: This is an experiment. Your local Supabase works perfectly for development. No pressure to migrate existing users. Learn, compare, and decide based on real data.

---

## Bottom Line

**Question**: "What does LiveKit do if AI SDK also calls OpenAI?"

**Answer**: LiveKit provides the **real-time media infrastructure** that AI SDK doesn't:
- WebRTC transport layer
- Voice activity detection  
- Turn management
- Stateful agent sessions
- STT/LLM/TTS pipeline orchestration
- Production scaling

Think of it as:
- **AI SDK** = "Great restaurant (OpenAI) with takeout only"
- **LiveKit** = "Same restaurant + dining room service + sommelier + full experience"

Both use OpenAI, but LiveKit wraps it in infrastructure that makes voice conversations natural, fast, and production-ready.

**This document**: Shows you how to build the full LiveKit experience alongside your existing systems, with zero risk and complete flexibility.
