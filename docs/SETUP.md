# Setup Guide

Complete setup guide for the Food Court Voice Concierge application.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Environment Configuration](#environment-configuration)
4. [Database Setup](#database-setup)
5. [Running the Application](#running-the-application)
6. [Verification](#verification)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Accounts

- **LiveKit Cloud** (free tier available)
  - Sign up: https://cloud.livekit.io
  - Create a new project
  - Get API credentials (URL, API Key, API Secret)

- **OpenAI** (pay-as-you-go)
  - Sign up: https://platform.openai.com
  - Create API key
  - Ensure credits are available

- **LemonSlice** (optional - for voice avatar feature)
  - Sign up: https://lemonslice.com
  - Get API key from: https://lemonslice.com/agents/api
  - Either create a custom agent or prepare a custom image URL (368×560px)
  - See [LEMONSLICE.md](LEMONSLICE.md) for detailed setup

- **Supabase** (free tier available)
  - Sign up: https://supabase.com
  - Create a new project
  - Get API credentials (URL, Anon Key, Service Role Key)

### Software Requirements

- **Node.js** 18+ and npm
  ```bash
  node --version  # Should be 18+
  npm --version
  ```

- **Python** 3.10+  and pip
  ```bash
  python3 --version  # Should be 3.10+
  pip3 --version
  ```

## Installation

### 1. Clone Repository

```bash
git clone https://github.com/your-org/food-court-voice-concierge.git
cd food-court-voice-concierge
```

### 2. Install Node.js Dependencies

```bash
npm install
```

Expected packages:
- Next.js 16
- LiveKit client SDK
- Supabase JS client
- React and related libraries

### 3. Install Python Dependencies

```bash
cd agents
pip install -r requirements.txt
cd ..
```

Expected packages:
- livekit-agents
- livekit-plugins-openai
- livekit-plugins-deepgram
- livekit-plugins-silero
- supabase-py
- python-dotenv

## Environment Configuration

### 1. Create Environment File

```bash
cp .env.example .env.local
```

### 2. Fill in Credentials

Edit `.env.local` with your actual credentials:

```bash
# ============================================
# LiveKit Configuration
# ============================================
# From https://cloud.livekit.io → Your Project → Settings
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=APIxxxxxxxxxxxx
LIVEKIT_API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ============================================
# OpenAI Configuration
# ============================================
# From https://platform.openai.com → API Keys
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ============================================
# Supabase Configuration
# ============================================
# From https://supabase.com → Your Project → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ============================================
# Demo Configuration
# ============================================
# This UUID will be created when you seed the database
DEMO_PROFILE_ID=00000000-0000-0000-0000-0000000000fc
```

### 3. Verify Environment File

```bash
# Check that .env.local exists and is not tracked by git
ls -la .env.local
git status  # Should NOT show .env.local
```

## Database Setup

### Option A: Supabase Cloud (Recommended for beginners)

#### 1. Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Click **"New Project"**
3. Fill in details:
   - **Name**: `food-court-voice`
   - **Database Password**: Generate strong password (save it!)
   - **Region**: Choose closest to you
   - **Plan**: Free tier
4. Wait 2-3 minutes for project to initialize

#### 2. Get Credentials

1. Go to **Project Settings** → **API**
2. Copy these values to your `.env.local`:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

#### 3. Run Database Migration

1. Go to **SQL Editor** in Supabase dashboard
2. Open `supabase/migrations/001_initial_schema.sql` from your project
3. Copy the entire SQL content
4. Paste into SQL Editor
5. Click **"RUN"**
6. Wait for completion (should see "Success")

#### 4. Seed Sample Data

1. Still in **SQL Editor**
2. Open `supabase/seed.sql` from your project
3. Copy the entire SQL content
4. Paste into SQL Editor
5. Click **"RUN"**
6. Verify data was inserted

#### 5. Verify Database

Go to **Table Editor** and check these tables exist:
- `fc_profiles` (1 row - demo profile)
- `fc_restaurants` (5+ rows)
- `fc_menu_sections` (10+ rows)
- `fc_menu_items` (30+ rows)
- `fc_carts` (empty initially)
- `fc_orders` (empty initially)

### Option B: Local Supabase (Docker)

For advanced users who want offline development:

#### 1. Install Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase

# Other platforms
npm install -g supabase
```

#### 2. Initialize Local Supabase

```bash
supabase init
supabase start
```

This will:
- Start PostgreSQL in Docker
- Create local database at `http://127.0.0.1:54321`
- Display credentials (copy these to `.env.local`)

#### 3. Run Migrations

```bash
supabase db reset
```

This automatically runs migrations from `supabase/migrations/`.

#### 4. Seed Data

```bash
psql -h 127.0.0.1 -p 54321 -U postgres -d postgres -f supabase/seed.sql
```

Default password: `postgres`

## Running the Application

## Running the Application

### Method 1: Quick Start Script (Recommended)

The easiest way to start both servers:

```bash
./start-dev.sh
```

This script:
- Cleans up any zombie processes from previous runs
- Starts Next.js dev server in background
- Starts Python AgentServer in background
- Waits for both to be ready
- Opens browser to the app
- Shows helpful status messages

To stop:
```bash
# Press Ctrl+C in the terminal where you ran start-dev.sh
# Or manually:
pkill -f "food_concierge_agentserver.py"
pkill -f "next dev"
```

### Method 2: Two Terminal Windows

**Terminal 1** - Frontend (Next.js):
```bash
npm run dev
```

Output should show:
```
▲ Next.js 16.0.1
- Local:        http://localhost:3000
- Ready in 2.5s
```

**Terminal 2** - Backend (Python AgentServer):
```bash
cd agents
python food_concierge_agentserver.py dev
```

Output should show:
```
INFO     Starting Food Concierge AgentServer...
INFO     Connected to Supabase
INFO     LiveKit AgentServer listening
```

### Method 3: Background Processes

For development, you can run both in background:

```bash
# Start frontend in background
npm run dev &

# Start agent in background
cd agents && python food_concierge_agentserver.py dev &
cd ..
```

To stop:
```bash
killall node
killall python
```

## Verification

### 1. Test Frontend

Open browser to http://localhost:3000/food/concierge-agentserver

You should see:
- "Food Court Voice Concierge" header
- "Connect" button
- Status showing "Disconnected"

### 2. Test Token Generation

```bash
curl http://localhost:3000/api/livekit-agentserver/token
```

Expected response (JSON):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### 3. Test Database Connection

```bash
cd agents
python -c "from database import get_user_profile; print(get_user_profile('00000000-0000-0000-0000-0000000000fc'))"
```

Expected output:
```python
{
  'id': '00000000-0000-0000-0000-0000000000fc',
  'name': 'Demo User',
  'favorite_cuisines': ['Mexican', 'Italian'],
  ...
}
```

### 4. Test Voice Connection

1. Open http://localhost:3000/food/concierge-agentserver
2. Click **"Connect"**
3. Allow microphone permissions when prompted
4. Status should change to "Connected"
5. Try speaking: "Show me Mexican restaurants"
6. You should hear a voice response listing restaurants

## Troubleshooting

### Frontend Issues

#### "Module not found" errors

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json .next
npm install
```

#### "Port 3000 already in use"

```bash
# Find and kill the process
lsof -i :3000
kill -9 <PID>

# Or use a different port
PORT=3001 npm run dev
```

### Backend (Agent) Issues

#### "No module named 'livekit'"

```bash
cd agents
pip install -r requirements.txt --force-reinstall
```

#### "LiveKit connection failed"

Check your `.env.local`:
- `LIVEKIT_URL` starts with `wss://`
- `LIVEKIT_API_KEY` and `LIVEKIT_API_SECRET` are correct
- No trailing spaces in credentials

Test credentials:
```bash
cd agents
python -c "import os; from dotenv import load_dotenv; load_dotenv('../.env.local'); print('URL:', os.getenv('LIVEKIT_URL')); print('Key:', os.getenv('LIVEKIT_API_KEY'))"
```

#### "Supabase connection failed"

Test Supabase connection:
```bash
cd agents
python -c "from database import get_supabase_client; client = get_supabase_client(); print('Connected:', client.table('fc_restaurants').select('count').execute())"
```

### Database Issues

#### "Table does not exist"

You need to run the migration:
1. Go to Supabase dashboard
2. SQL Editor
3. Run `supabase/migrations/001_initial_schema.sql`

#### "No restaurants found"

You need to seed the database:
1. Go to Supabase dashboard
2. SQL Editor
3. Run `supabase/seed.sql`

Verify:
```bash
cd agents
python -c "from database import search_restaurants_by_cuisine; print(search_restaurants_by_cuisine('Mexican'))"
```

### Voice/Microphone Issues

#### "Microphone not detected"

1. Check browser permissions (allow microphone)
2. Ensure you're on https:// or localhost
3. Try a different browser (Chrome/Edge recommended)
4. Check system microphone settings

#### "No audio response"

1. Check OpenAI API key has available credits
2. Check browser audio is not muted
3. Check AgentServer logs for TTS errors
4. Try refreshing the page and reconnecting

### Common Error Messages

#### "OPENAI_API_KEY not found"

Make sure `.env.local` exists in project root and contains:
```bash
OPENAI_API_KEY=sk-proj-...
```

Restart both frontend and backend after adding.

#### "Invalid JWT token"

Your Supabase keys are incorrect. Re-copy from:
Supabase Dashboard → Settings → API

#### "WebRTC connection failed"

1. Check firewall isn't blocking WebRTC
2. Try disabling VPN temporarily
3. Check browser console for detailed errors
4. Verify LiveKit credentials are correct

## Next Steps

Once everything is running:

1. 📖 Read [ARCHITECTURE.md](ARCHITECTURE.md) to understand the system
2. 🚀 See [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment
3. 🛠 Check [agents/README.md](../agents/README.md) for agent development

## Getting Help

- **Supabase**: https://supabase.com/docs
- **LiveKit**: https://docs.livekit.io
- **OpenAI**: https://platform.openai.com/docs
- **Issues**: GitHub Issues on this repository
