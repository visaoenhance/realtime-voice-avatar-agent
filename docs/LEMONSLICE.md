# LemonSlice Voice Avatar Integration

Add a realistic, lip-synced voice avatar to your Food Court Voice Concierge. The avatar automatically syncs with the agent's speech and displays natural mouth movements and expressions.

## Overview

LemonSlice provides real-time avatars for LiveKit Agents through a native plugin. The avatar joins your LiveKit room as a video participant and automatically syncs with your agent's TTS output.

**Key Benefits:**
- ✅ Native LiveKit integration (no separate WebSocket handling)
- ✅ Automatic audio sync with TTS
- ✅ Low latency (real-time streaming)
- ✅ Simple setup (2 lines of code in agent)
- ✅ Works with existing AgentServer pattern

## Prerequisites

### 1. LemonSlice Account

Sign up at [LemonSlice](https://lemonslice.com) and create an API key:
- Visit: https://lemonslice.com/agents/api
- Create API key
- Copy to `.env.local` as `LEMONSLICE_API_KEY`

### 2. Choose Avatar Method

**Option A: Custom Image URL** (Recommended)
- Use any publicly accessible image
- Dimensions: **368 × 560 pixels** (portrait, will auto-crop if different)
- Requirements: Clear face and visible mouth, anthropomorphic
- Format: JPG or PNG

**Option B: Pre-built Agent ID**
- Browse agents at: https://lemonslice.com/agents
- Click "Customize this agent" to create your own
- Copy the agent ID (e.g., `agent_xxxxx`)
- Note: Voice settings in LemonSlice UI are ignored (LiveKit controls voice)

## Installation

### 1. Install Python Plugin

```bash
cd agents
pip install "livekit-agents[lemonslice]~=1.3"
```

Or add to `requirements.txt`:
```
livekit-agents[lemonslice]~=1.3
```

### 2. Configure Environment Variables

Add to `.env.local`:

```bash
# LemonSlice API Key (required)
LEMONSLICE_API_KEY=sk_lemon_xxxxx

# Option A: Use pre-built agent (from https://lemonslice.com/agents)
LEMONSLICE_AGENT_ID=agent_xxxxx

# Option B: Use custom image URL (publicly accessible)
# LEMONSLICE_IMAGE_URL=https://yourdomain.com/avatar.jpg
```

**Note:** Choose ONE option (agent ID OR custom image URL), not both.

### 3. Agent Code (Already Integrated)

The avatar integration is already implemented in `agents/food_concierge_agentserver.py`. Here's the relevant code:

```python
from livekit.plugins import lemonslice

# In your @server.rtc_session function:
avatar_image_url = os.getenv("LEMONSLICE_IMAGE_URL")
avatar_agent_id = os.getenv("LEMONSLICE_AGENT_ID")
avatar_api_key = os.getenv("LEMONSLICE_API_KEY")

if (avatar_image_url or avatar_agent_id) and avatar_api_key:
    # Build avatar parameters
    avatar_params = {
        "agent_prompt": "You are a friendly and enthusiastic food ordering assistant...",
        "idle_timeout": 120
    }
    
    if avatar_agent_id:
        avatar_params["agent_id"] = avatar_agent_id
    else:
        avatar_params["agent_image_url"] = avatar_image_url
    
    avatar_session = lemonslice.AvatarSession(**avatar_params)
    await avatar_session.start(session, ctx.room)
```

### 4. Frontend Integration (Already Integrated)

The frontend already includes `components/LemonsliceAvatar.tsx` which:
- Automatically detects the avatar participant
- Displays the video track
- Shows loading/error states
- Provides toggle functionality for demos

## Custom Avatar Images

### Image Requirements

**Dimensions:**
- Target: 368 × 560 pixels (portrait)
- Auto-crops if different dimensions
- Minimum: 368px wide

**Content Requirements:**
- Clear, well-lit face
- Visible mouth for lip-sync
- Neutral or friendly expression
- Clean background
- Head and shoulders framing

**File Format:**
- JPG or PNG
- Under 5MB recommended

### Hosting Your Image

Your avatar image must be publicly accessible. Options:

**Option 1: Supabase Storage** (Recommended)
```bash
# 1. Upload to Supabase Storage bucket
# 2. Make file public
# 3. Get URL: https://[project].supabase.co/storage/v1/object/public/[bucket]/[file]
# 4. Add to .env.local: LEMONSLICE_IMAGE_URL=<url>
```

**Option 2: Next.js Public Directory**
```bash
# Place in: public/avatars/avatar.jpg
# URL: https://yourdomain.com/avatars/avatar.jpg
```

**Option 3: Image Hosting Services**
- [Imgur](https://imgur.com) - Right-click → Copy image address
- [ImgBB](https://imgbb.com) - Get direct link
- [Cloudinary](https://cloudinary.com) - Free tier

**❌ Won't Work:**
- Google Drive sharing links (returns HTML, not image)
- Localhost URLs (not publicly accessible)
- Private/authenticated URLs

### Test Your Image URL

```bash
# Should return image file, not HTML
curl -I https://your-image-url.jpg

# Or open directly in browser - should show ONLY the image
```

## Using the Avatar Toggle (Demo Feature)

The frontend includes a toggle switch to show/hide the avatar without breaking the session:

1. **Start session** - Avatar is hidden by default
2. **Toggle on** - Shows avatar in right column (50/50 split layout)
3. **Toggle off** - Hides avatar, controls go full width
4. **Session continues** - No interruption, avatar stays connected

Perfect for demonstrations where you want to:
- Start with voice-only experience
- Show the ordering flow at full width
- Toggle avatar on mid-demo to highlight the feature

## Parameters Reference

### `lemonslice.AvatarSession()`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `agent_image_url` | string | Either this or `agent_id` | URL to avatar image (368×560px) |
| `agent_id` | string | Either this or `agent_image_url` | LemonSlice Agent ID |
| `agent_prompt` | string | Optional | Guide avatar demeanor/personality |
| `idle_timeout` | int | Optional | Seconds before timeout (default: 60, -1 = never) |

**Notes:**
- Use `agent_prompt` for high-level guidance (emotions, demeanor)
- LiveKit controls the actual voice (TTS), not LemonSlice

## Troubleshooting

### Avatar doesn't appear

**Check environment variables:**
```bash
# Restart agent after adding/changing these
echo $LEMONSLICE_API_KEY  # Should show your key
```

**Check agent logs:**
```bash
tail -f agents/*.log
# Look for: "✅ LemonSlice avatar started successfully"
# Or: "⚠️ Avatar initialization failed"
```

**Common issues:**
- Image URL returns 403/404 (not publicly accessible)
- Image URL returns HTML instead of image file
- API key is incorrect or expired
- Agent ID belongs to someone else's account

### Audio sync is off

- Check network latency
- Ensure TTS is working correctly first
- Try different TTS provider (OpenAI vs Deepgram)
- Check browser console for LiveKit warnings

### Avatar appears but no lip-sync

- Verify image has clear, visible mouth
- Check that TTS audio is actually playing
- Look for errors in browser console
- Test with a different avatar image

### Session doesn't close properly

The agent automatically handles shutdown. If you see orphaned sessions:
- Check agent logs for exceptions
- Verify `ctx.room.disconnect()` is called
- Note: LemonSlice has idle timeout (default 120s) as safety

## Cost Considerations

LemonSlice charges per minute of avatar usage:
- Check current pricing at: https://lemonslice.com/pricing
- Monitor usage at: https://lemonslice.com/dashboard
- Avatar sessions auto-timeout after idle period (configurable)
- Use the toggle feature to hide avatar when not needed (demo tool)

## Examples

### Using Custom Image

```bash
# .env.local
LEMONSLICE_API_KEY=sk_lemon_xxxxx
LEMONSLICE_IMAGE_URL=https://ceeklugdyurvxonnhykt.supabase.co/storage/v1/object/public/lemonslice_avatars/avatar.png
```

### Using Pre-built Agent

```bash
# .env.local
LEMONSLICE_API_KEY=sk_lemon_xxxxx
LEMONSLICE_AGENT_ID=agent_3527663feea5610e
```

## Resources

### Official Documentation
- [LemonSlice Documentation](https://lemonslice.com/docs)
- [LemonSlice LiveKit Integration](https://lemonslice.com/docs/self-managed/livekit-agent-integration)
- [LiveKit Agents Overview](https://docs.livekit.io/agents/)

### Tools
- [Create API Key](https://lemonslice.com/agents/api)
- [Browse Pre-built Agents](https://lemonslice.com/agents)
- [Usage Dashboard](https://lemonslice.com/dashboard)

### Code Examples
- [LemonSlice Python Examples](https://github.com/lemonsliceai/lemonslice-examples)
- [LiveKit Agent Examples](https://github.com/livekit-examples/python-agents-examples)

## Next Steps

1. ✅ Sign up at LemonSlice and get API key
2. ✅ Choose avatar method (custom image or pre-built agent)
3. ✅ Add credentials to `.env.local`
4. ✅ Install Python plugin: `pip install "livekit-agents[lemonslice]~=1.3"`
5. ✅ Restart agent: `./start-dev.sh`
6. ✅ Connect to voice concierge and test
7. ✅ Use toggle to show/hide avatar during demos

## Optional: Make Avatar Feature Optional

The avatar feature is already optional - the system works without it:
- If `LEMONSLICE_API_KEY` is not set, avatar won't initialize
- Agent logs will show: "ℹ️ LemonSlice avatar not configured"
- Voice ordering works normally without avatar
- Frontend hides avatar component when not available

This makes it perfect for:
- Development without avatar costs
- Staging environments
- Partial feature rollout
