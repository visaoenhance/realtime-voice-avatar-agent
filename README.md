# Food Court Voice Concierge - LiveKit AgentServer

A real-time voice AI agent for food ordering, built with [LiveKit AgentServer](https://docs.livekit.io/agents/) framework. Users can browse restaurants, view menus, manage their cart, and place orders entirely through natural conversation.

## Features

- 🎤 **Voice-first interaction** - Natural spoken conversation powered by WebRTC
- � **Realistic voice avatar** (optional) - LemonSlice integration with automatic lip-sync
- �🍔 **9 function tools** - Search restaurants, browse menus, manage cart, checkout
- 🗄️ **Supabase backend** - PostgreSQL database for restaurants, menu items, carts, and orders
- 🔄 **Real-time streaming** - Low-latency audio with LiveKit infrastructure
- 🌐 **Multi-language support** - Automatic language detection and responses

## Architecture

### Tech Stack

- **Python AgentServer** - `agents/food_concierge_agentserver.py` (LiveKit AgentServer framework)
- **Next.js 14** - Frontend UI with App Router (`app/food/concierge-agentserver/`)
- **LiveKit Cloud** - WebRTC infrastructure for real-time audio streaming
- **LemonSlice** (optional) - Realistic voice avatar with automatic lip-sync
- **OpenAI** - GPT-4o-mini (LLM), Whisper (STT), TTS (voice synthesis)
- **Deepgram Nova-3** - Alternative STT with multichannel support
- **Supabase** - PostgreSQL database (local or cloud)

### Data Flow

```
User speaks → LiveKit WebRTC → AgentServer → STT (Deepgram/OpenAI)
                                    ↓
                              LLM (GPT-4o-mini)
                                    ↓
                         Function Tools (9 total)
                                    ↓
                              Supabase Database
                                    ↓
                              TTS (OpenAI)
                                    ↓
User hears ← LiveKit WebRTC ← AgentServer
```

## Function Tools

The agent has 9 capability tools:

1. **`get_user_profile`** - Fetch user preferences and order history
2. **`find_food_item`** - Search menu items by name/description
3. **`find_restaurants_by_type`** - Search restaurants by cuisine type
4. **`get_restaurant_menu`** - View full menu with sections
5. **`quick_view_cart`** - View current cart contents
6. **`quick_add_to_cart`** - Add items to cart
7. **`remove_from_cart`** - Remove items from cart
8. **`update_cart_quantity`** - Change item quantities
9. **`quick_checkout`** - Complete order and clear cart

## Quick Start

> **⚠️ Demo Mode:** This application uses a shared demo profile (`DEMO_PROFILE_ID`). All users see the same cart and orders. For production use with individual user accounts, implement authentication (see [Supabase Auth](https://supabase.com/docs/guides/auth) or [NextAuth.js](https://next-auth.js.org/)).

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.10+ with pip
- **Supabase** account (free tier works)
- **LiveKit** account (free tier works)
- **OpenAI** API key

### 1. Clone and Install

```bash
# Install Node.js dependencies
npm install

# Install Python dependencies
cd agents
pip install -r requirements.txt
cd ..
```

### 2. Configure Environment

Create `.env.local` from the example:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```bash
# LiveKit (from https://cloud.livekit.io)
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret

# OpenAI (from https://platform.openai.com)
OPENAI_API_KEY=sk-proj-...

# Supabase (from https://supabase.com)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Demo Profile ID (will be created during seed)
DEMO_PROFILE_ID=00000000-0000-0000-0000-0000000000fc
```

### 3. Set Up Database

See [docs/SETUP.md](docs/SETUP.md) for detailed Supabase setup instructions.

Quick version:

1. Create a Supabase project
2. Run the migration: `supabase/migrations/001_initial_schema.sql`
3. Seed sample data: `supabase/seed.sql`
4. Update `.env.local` with your Supabase credentials

### 4. Run the Application

**Option A: Quick Start (Recommended)**

Single command to start both frontend and backend:
```bash
./start-dev.sh
```

This automatically:
- Cleans up any zombie processes
- Starts Next.js dev server
- Starts Python AgentServer
- Opens your browser to the app

**Option B: Manual Start**

**Terminal 1** - Start Next.js frontend:
```bash
npm run dev
```

**Terminal 2** - Start Python AgentServer:
```bash
cd agents
python food_concierge_agentserver.py dev
```

**Terminal 3** (optional) - Watch logs:
```bash
tail -f agents/*.log
```

### 5. Test the Voice Agent

1. Open http://localhost:3000/food/concierge-agentserver
2. Click "🎙️ Start Conversation" to establish WebRTC connection
3. Allow microphone permissions
4. Start speaking! Try:
   - "Show me Mexican restaurants"
   - "What's on the menu at Sabor Latino?"
   - "Add two chicken tacos to my cart"
   - "What's in my cart?"
   - "Place my order"

### Optional: Enable Voice Avatar

For a more engaging visual experience, add a realistic voice avatar:

1. **Sign up at [LemonSlice](https://lemonslice.com)**
2. **Get API key** from https://lemonslice.com/agents/api
3. **Choose avatar method:**
   - **Option A**: Use a pre-built agent from https://lemonslice.com/agents
   - **Option B**: Use your own custom image (368×560px, publicly accessible URL)
4. **Configure `.env.local`:**
   ```bash
   LEMONSLICE_API_KEY=sk_lemon_xxxxx
   # Option A: Pre-built agent
   LEMONSLICE_AGENT_ID=agent_xxxxx
   # Option B: Custom image
   # LEMONSLICE_IMAGE_URL=https://yourdomain.com/avatar.jpg
   ```
5. **Install plugin:**
   ```bash
   cd agents
   pip install "livekit-agents[lemonslice]~=1.3"
   ```
6. **Restart agent:** `./start-dev.sh`
7. **Toggle avatar** during session using the 🎭 switch (perfect for demos!)

📖 **Full guide:** See [docs/LEMONSLICE.md](docs/LEMONSLICE.md) for detailed setup, troubleshooting, and image requirements.

**Note:** The avatar feature is completely optional. The voice concierge works perfectly without it!

## Project Structure

```
├── agents/
│   ├── food_concierge_agentserver.py  # Main Python AgentServer
│   ├── database.py                     # Supabase connection layer
│   ├── requirements.txt                # Python dependencies
│   └── README.md                       # Agent-specific documentation
├── app/
│   ├── food/concierge-agentserver/
│   │   └── page.tsx                    # Voice UI component
│   └── api/livekit-agentserver/token/
│       └── route.ts                    # Token generation endpoint
├── components/
│   ├── FoodCourtHeader.tsx             # Header component
│   ├── LemonsliceAvatar.tsx            # Voice avatar component (optional)
│   └── food-cards/                     # Restaurant/menu card components
├── lib/
│   ├── supabaseConfig.ts               # Supabase client config
│   └── supabaseServer.ts               # Server-side Supabase client
├── supabase/
│   ├── config.toml                     # Supabase local config
│   ├── migrations/
│   │   └── 001_initial_schema.sql      # Database schema
│   └── seed.sql                        # Sample data
├── docs/
│   ├── ARCHITECTURE.md                 # System architecture details
│   ├── SETUP.md                        # Detailed setup guide
│   ├── DEPLOYMENT.md                   # Production deployment
│   └── LEMONSLICE.md                   # Voice avatar integration guide
├── .env.example                        # Environment template
├── package.json                        # Node.js dependencies
└── README.md                           # This file
```

## Development

### Local Development Workflow

1. **Frontend changes** - Next.js hot-reloads automatically
2. **Agent changes** - Restart the Python AgentServer process
3. **Database changes** - Create new migration SQL files
4. **Function tools** - Update both `agents/database.py` and `agents/food_concierge_agentserver.py`

### Testing

```bash
# Test token generation
curl http://localhost:3000/api/livekit-agentserver/token

# Test Supabase connection
cd agents
python -c "from database import get_user_profile; print(get_user_profile('00000000-0000-0000-0000-0000000000fc'))"
```

### Environment Switching

This project supports both local (Docker) and remote (Cloud) Supabase:

- **Local**: Fast development, offline work
- **Remote**: Demos, production, team collaboration

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for environment switching details.

## Troubleshooting

### "Microphone not detected"

- Check browser permissions (allow microphone access)
- Ensure HTTPS or localhost (WebRTC requirement)
- Try a different browser (Chrome/Edge recommended)

### "Connection failed"

- Verify LiveKit credentials in `.env.local`
- Check AgentServer is running (`python food_concierge_agentserver.py dev`)
- Check network/firewall isn't blocking WebRTC

### "No restaurants found"

- Verify Supabase database is seeded
- Check Supabase credentials in `.env.local`
- Test database connection: `python -c "from database import search_restaurants_by_cuisine; print(search_restaurants_by_cuisine('Mexican'))"`

### "Agent not responding"

- Check OpenAI API key is valid and has credits
- View AgentServer logs for errors
- Verify STT/LLM/TTS providers are configured

## Security

- **Never commit `.env.local`** - It contains your real credentials and is gitignored
- **Rotate keys immediately** if you accidentally paste them into logs or public channels
- **Use least-privilege keys** - Use Supabase service role key only server-side, never in client code
- **Production safeguards** - Debug endpoints return 404 when `NODE_ENV=production`
- **Report vulnerabilities** - See [SECURITY.md](SECURITY.md) for responsible disclosure

## Documentation

- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** - Detailed system architecture and design decisions
- **[docs/SETUP.md](docs/SETUP.md)** - Comprehensive setup guide with troubleshooting
- **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** - Production deployment and environment management
- **[docs/LEMONSLICE.md](docs/LEMONSLICE.md)** - Voice avatar integration guide (optional feature)
- **[agents/README.md](agents/README.md)** - Python AgentServer implementation details

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT - See [LICENSE](LICENSE) for details.

## About the Author

Built by **Visao Enhance** - AI consulting and development services.

- 🌐 **Consulting**: [visaoenhance.com](https://www.visaoenhance.com)
- 📺 **YouTube Channel**: [@learn2enhance](https://www.youtube.com/@learn2enhance)
- 🎥 **Demo Video**: [Watch this project in action](https://youtu.be/phNKCT2dA_w)
- 📝 **Tech Blog**: [Medium](https://emiliotaylor.medium.com)

*Building AI-powered solutions and sharing knowledge through tutorials and demos.*

## Acknowledgments

Built with:
- [LiveKit AgentServer](https://docs.livekit.io/agents/) - Real-time voice infrastructure
- [LemonSlice](https://lemonslice.com) - Realistic voice avatars (optional)
- [OpenAI](https://openai.com) - LLM and TTS
- [Deepgram](https://deepgram.com) - Speech-to-text
- [Supabase](https://supabase.com) - PostgreSQL backend
- [Next.js](https://nextjs.org) - React framework
- [Vercel AI SDK](https://sdk.vercel.ai) - AI SDK components

## Support

- **LiveKit Docs**: https://docs.livekit.io
- **Supabase Docs**: https://supabase.com/docs
- **Project Issues**: Open an issue in this repository for questions or bug reports
