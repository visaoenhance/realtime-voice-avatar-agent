# LiveKit Native Food Concierge Agent

Python-based voice agent using LiveKit Agents SDK for real-time voice interaction with food ordering.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                        │
│          /app/food/concierge-native/page.tsx                │
│         @livekit/components-react (Voice UI)                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ WebRTC + Token
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                 LiveKit Cloud Infrastructure                 │
│          wss://visao-w97d7sv9.livekit.cloud                 │
│     Audio routing, VAD, session management (WebRTC)         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ LiveKit Agents Protocol
                     ↓
┌─────────────────────────────────────────────────────────────┐
│           Python Agent (food_concierge_native.py)           │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  STT (OpenAI Whisper-1)  →  Voice to Text            │  │
│  └─────────────────┬─────────────────────────────────────┘  │
│                    ↓                                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  LLM (OpenAI GPT-4) with Function Calling            │  │
│  │  - get_user_profile                                   │  │
│  │  - find_food_item                                     │  │
│  │  - find_restaurants_by_type                           │  │
│  │  - quick_view_cart                                    │  │
│  │  - quick_add_to_cart                                  │  │
│  │  - quick_checkout                                     │  │
│  └─────────────────┬─────────────────────────────────────┘  │
│                    ↓                                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  TTS (OpenAI TTS-1)  →  Text to Voice                │  │
│  └───────────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ SQL Queries
                     ↓
┌─────────────────────────────────────────────────────────────┐
│              Supabase Local (PostgreSQL)                     │
│                  127.0.0.1:54321                            │
│   fc_profiles, fc_restaurants, fc_menu_items, etc.          │
└─────────────────────────────────────────────────────────────┘
```

## 📁 File Structure

```
agents/
├── .env                        # Environment variables (COPIED from root)
├── .env.example                # Template for environment setup
├── requirements.txt            # Python dependencies
├── database.py                 # Supabase utilities for fc_* tables
├── food_concierge_native.py    # Main LiveKit agent entrypoint
├── test_database.py            # Test database connectivity
└── tools/                      # (Reserved for future tool modules)
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd agents
pip install -r requirements.txt
```

**Dependencies:**
- `livekit-agents>=1.0.0` - Core agent framework
- `livekit-plugins-openai>=0.6.0` - OpenAI STT/LLM/TTS
- `livekit-plugins-silero>=0.6.0` - VAD (Voice Activity Detection)
- `supabase>=2.0.0` - Database client
- `python-dotenv>=1.0.0` - Environment variables

### 2. Configure Environment

The Python agent reads directly from the root `.env.local` file - no duplicate configuration needed!

**Required variables in root `.env.local`:**
```bash
# Supabase (Local Development)
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_SERVICE_ROLE_KEY=your-key-here
DEMO_PROFILE_ID=00000000-0000-0000-0000-0000000000fc

# OpenAI
OPENAI_API_KEY=sk-...

# LiveKit Cloud
LIVEKIT_URL=wss://visao-w97d7sv9.livekit.cloud
LIVEKIT_API_KEY=APIRAVmRfMkqdBh
LIVEKIT_API_SECRET=your-secret-here
```

These credentials are already in your `.env.local` file ✅

### 3. Test Database Connection

```bash
python test_database.py
```

This validates:
- ✅ Supabase connection works
- ✅ All 6 function tools execute
- ✅ Menu search returns results
- ✅ Cart operations work

### 4. Run the Agent

**Development mode:**
```bash
python food_concierge_native.py dev
```

**Production mode:**
```bash
python food_concierge_native.py start
```

Expected output:
```
✅ Database client initialized
   Supabase URL: http://127.0.0.1:54321
   Demo Profile: 00000000-0000-0000-0000-0000000000fc
✅ Food Concierge Native Agent initialized
   LiveKit URL: wss://visao-w97d7sv9.livekit.cloud
   OpenAI STT: whisper-1
   OpenAI LLM: gpt-4
   OpenAI TTS: tts-1
   VAD: Silero
```

### 5. Connect from Frontend

1. Ensure Next.js dev server is running:
   ```bash
   npm run dev
   ```

2. Visit: http://localhost:3000/food/concierge-native

3. Click **"Start Voice Chat"** and allow microphone access

4. The agent will greet you automatically and respond to voice commands

## 🎤 Voice Commands

The agent understands natural language. Try:

**Search:**
- "Find me sushi"
- "Show me italian restaurants"
- "What desserts do you have?"
- "Search for burgers without pickles"

**Cart:**
- "Add a cheeseburger to my cart"
- "What's in my cart?"
- "Show my order"

**Checkout:**
- "Checkout"
- "Place my order"
- "Complete the order"

## 🔧 Function Tools

The agent has 6 callable functions matching the TypeScript tools exactly:

### 1. `get_user_profile(profile_id=None)`
Get user preferences from `fc_preferences` table.
- **Usage:** Called automatically at conversation start
- **Returns:** Favorite cuisines, dietary tags, spice level, budget

### 2. `find_food_item(query, max_results=5)`
Search menu items in `fc_menu_items` table.
- **Usage:** "Find pizza", "Show me desserts"
- **Returns:** Item name, price, restaurant, calories, rating

### 3. `find_restaurants_by_type(cuisine_type, max_results=3)`
Find restaurants by cuisine (not yet implemented - returns empty).
- **Usage:** "Show italian restaurants"
- **Returns:** Restaurant name, cuisine, rating

### 4. `quick_view_cart()`
View current cart contents.
- **Usage:** "What's in my cart?"
- **Returns:** Items, quantities, subtotal, delivery fee, total

### 5. `quick_add_to_cart(item_name, restaurant_name=None, quantity=1, additional_items=None)`
Add items to in-memory cart.
- **Usage:** "Add 2 burgers to my cart"
- **Returns:** Updated cart with new items

### 6. `quick_checkout()`
Place order and generate order number.
- **Usage:** "Checkout"
- **Returns:** Order confirmation with order ID and total

## 🧪 Testing

### Test Token Generation
```bash
node scripts/test-livekit-native-token.js
```

### Test Database Layer
```bash
cd agents
python test_database.py
```

### Test End-to-End
```bash
node scripts/test-livekit-native-e2e.js
```

## 📊 Comparison: Native vs Manual LiveKit

| Feature | **Native Pipeline** (this) | Manual Pipeline |
|---------|---------------------------|-----------------|
| **Implementation** | Python agent | TypeScript API routes |
| **STT → LLM → TTS** | Automatic (LiveKit SDK) | Manual orchestration |
| **VAD** | Built-in Silero | Manual implementation |
| **Interruptions** | Automatic | Manual listener |
| **State Management** | Built-in | Manual session storage |
| **Function Calling** | Declarative (`@llm.ai_callable`) | Manual tool dispatch |
| **Code Complexity** | Low (single file) | High (multiple routes) |
| **Production Ready** | Yes | Requires tuning |

## 🐛 Troubleshooting

### Agent won't start
```bash
# Check environment variables in root .env.local
cat ../.env.local

# Verify Python version (3.8+)
python --version

# Reinstall dependencies
pip install --upgrade -r requirements.txt
```

### Database connection fails
```bash
# Check Supabase is running
curl http://127.0.0.1:54321

# Test connection
python test_database.py
```

### No audio in frontend
1. Check browser microphone permissions
2. Verify LiveKit token endpoint: `curl http://localhost:3000/api/livekit-native/token`
3. Check browser console for WebRTC errors
4. Ensure Python agent is running (`python food_concierge_native.py dev`)

### Function tools not called
1. Check GPT-4 function calling works (verify API key)
2. Look at agent logs for function invocations
3. Ensure `@llm.ai_callable` decorators are correct

## 📚 Documentation

- [LiveKit Agents SDK](https://docs.livekit.io/agents/)
- [LIVEKIT_PHASE2.md](/docs/LIVEKIT_PHASE2.md) - Full implementation plan
- [OpenAI Function Calling](https://platform.openai.com/docs/guides/function-calling)
- [Supabase Python](https://supabase.com/docs/reference/python/introduction)

## 🔄 Migration from TypeScript Tools

This Python agent exactly mirrors `/app/api/voice-chat/tools.ts`:

| TypeScript | Python | Status |
|------------|--------|--------|
| `getUserProfile` | `get_user_profile` | ✅ Implemented |
| `findFoodItem` | `find_food_item` | ✅ Implemented |
| `findRestaurantsByType` | `find_restaurants_by_type` | ⚠️ Placeholder |
| `quickViewCart` | `quick_view_cart` | ✅ Implemented |
| `quickAddToCart` | `quick_add_to_cart` | ✅ Implemented |
| `quickCheckout` | `quick_checkout` | ✅ Implemented |

## 📈 Next Steps

1. **Complete restaurant search** - Implement `find_restaurants_by_type` with Supabase query
2. **Add persistent cart** - Store cart in Supabase `fc_carts` table instead of in-memory
3. **Add order history** - Query `fc_orders` and `fc_order_items` tables
4. **Add real-time updates** - Use Supabase Realtime for order status
5. **Deploy to production** - Change `SUPABASE_URL` to remote instance

## ✅ Features Implemented

- ✅ LiveKit Agents SDK integration
- ✅ OpenAI Whisper STT (speech-to-text)
- ✅ OpenAI GPT-4 LLM (with function calling)
- ✅ OpenAI TTS (text-to-speech)
- ✅ Silero VAD (voice activity detection)
- ✅ 6 function tools matching TypeScript parity
- ✅ Supabase local connection (fc_* tables)
- ✅ In-memory cart management
- ✅ Order generation with unique IDs
- ✅ Voice-first conversational UI
- ✅ Automatic interruption handling
- ✅ Test suite (database, token, e2e)

## 🎯 Production Checklist

Before deploying to production:

- [ ] Install Python dependencies on server
- [ ] Configure remote Supabase URL
- [ ] Set up Supabase connection pooling
- [ ] Implement persistent cart storage
- [ ] Add authentication/user sessions
- [ ] Add logging and monitoring
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Load test with concurrent users
- [ ] Add rate limiting
- [ ] Enable HTTPS for all connections

---

**Built with:** LiveKit Agents SDK, OpenAI, Supabase, Python 3.8+
