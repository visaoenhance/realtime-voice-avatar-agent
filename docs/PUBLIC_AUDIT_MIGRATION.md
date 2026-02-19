# Public Repository Migration Plan

**Date:** February 19, 2026  
**Objective:** Create a clean, secure, public repository focused on LiveKit AgentServer implementation for food ordering voice assistant  
**Target Audience:** Developers learning LiveKit AgentServer with real-world e-commerce integration

---

## 🔒 SECURITY AUDIT SUMMARY

### Critical Issues Found (MUST FIX)
1. ✅ **Live API keys exposed** in `.env.local` and `.env.local.cloud-backup`
   - OpenAI API key
   - Supabase service_role keys (local & remote)
   - LiveKit API credentials
   - Pexels API key

2. ✅ **Production URLs exposed** in documentation
   - Supabase project: `ceeklugdyurvxonnhykt.supabase.co`
   - LiveKit project: `visao-w97d7sv9.livekit.cloud`

3. ✅ **Database backup with potential sensitive data**
   - `bkups/db_cluster-13-11-2025@04-07-29.backup`

### Actions Taken Before Migration
- [ ] Rotate ALL API keys (OpenAI, LiveKit, Supabase, Pexels)
- [ ] Remove `.env.local` and `.env.local.cloud-backup` permanently
- [ ] Remove database backups
- [ ] Clean git history (BFG Repo-Cleaner)

---

## 🎯 REPOSITORY FOCUS

### What This Demo Showcases
**LiveKit AgentServer Implementation for Voice-Based Food Ordering**

Core Features:
- Real-time voice conversation using WebRTC
- STT (Deepgram) → LLM (OpenAI GPT-4o-mini) → TTS (OpenAI) pipeline
- 9 function tools for restaurant search, menu browsing, cart management
- Python agent with Supabase integration
- React frontend with LiveKit components
- Data channel for structured data (restaurant/menu cards)

### What We're Removing
- AI SDK implementation (different use case, adds complexity)
- Development documentation (internal notes)
- Reference implementations (learning materials)
- Database migration history (keep only final schema)
- Backup files

---

## 📁 CURRENT vs. TARGET STRUCTURE

### Current Repository Structure (Messy)
```
ubereats-ai-sdk-hitl/
├── .env.local ❌ CONTAINS SECRETS
├── .env.local.cloud-backup ❌ CONTAINS SECRETS
├── AGENT_DATA_ACTIONS.md
├── AGENT_FLOW.md
├── FOOD_DELIVERY_PLAN.md
├── INSTRUCTIONS.md
├── PROJECT_PLAN.md
├── README.md
├── REMOTE_SETUP.md
├── STARTUP.md
├── SUPABASE_MIGRATION_PLAN.md
├── check-db.js
├── complete_menu_data.sql ❌ OLD VERSION
├── temp_menu_data.sql ❌ TEMP FILE
├── env.local.example
├── env.remote.example
├── start-dev.sh
├── agents/
│   ├── food_concierge_agentserver.py ✅ KEEP
│   ├── database.py ✅ KEEP
│   ├── requirements.txt ✅ KEEP
│   └── README.md ✅ KEEP (REVISE)
├── app/
│   ├── food/
│   │   ├── concierge-agentserver/ ✅ KEEP
│   │   └── concierge-native/ ❌ OLD IMPLEMENTATION
│   └── api/
│       ├── food-chat/ ❌ AI SDK
│       ├── voice-chat/ ❌ AI SDK
│       └── livekit-agentserver/ ✅ KEEP
├── bkups/ ❌ REMOVE ENTIRELY
├── docs/
│   ├── DIAGRAM_LIVEKIT.md ✅ KEEP (SANITIZE)
│   ├── DIAGRAM_AISDK.md ❌ REMOVE (DIFFERENT APPROACH)
│   ├── CRED_MGMT.md ❌ CONTAINS PROJECT IDS
│   ├── ENVIRONMENT_SWITCHING.md ❌ INTERNAL DOCS
│   └── [50+ other docs] ❌ MOSTLY INTERNAL
├── livekit-reference/ ❌ REMOVE (LEARNING MATERIALS)
├── scripts/
│   └── [100+ test scripts] ❌ MOSTLY DEV TOOLS
└── supabase/
    └── exports/latest/schema.sql ✅ KEEP (SANITIZE)
```

### Target Repository Structure (Clean)
```
livekit-agentserver-food-ordering/
├── .gitignore ✅ UPDATED
├── README.md ✅ REWRITTEN FOR PUBLIC
├── LICENSE ✅ ADD
├── .env.example ✅ CLEAN TEMPLATE
├── package.json ✅ KEEP
├── tsconfig.json ✅ KEEP
├── next.config.js ✅ KEEP
├── tailwind.config.js ✅ KEEP
├── postcss.config.js ✅ KEEP
├── agents/
│   ├── README.md ✅ AGENTSERVER QUICKSTART
│   ├── food_concierge_agentserver.py ✅ MAIN AGENT
│   ├── database.py ✅ SUPABASE LAYER
│   └── requirements.txt ✅ PYTHON DEPS
├── app/
│   ├── layout.tsx ✅
│   ├── page.tsx ✅ LANDING PAGE
│   ├── globals.css ✅
│   ├── food/
│   │   └── concierge-agentserver/
│   │       └── page.tsx ✅ VOICE UI
│   └── api/
│       └── livekit-agentserver/
│           └── token/
│               └── route.ts ✅ TOKEN ENDPOINT
├── components/
│   ├── FoodCourtHeader.tsx ✅
│   └── food-cards/
│       ├── RestaurantCard.tsx ✅
│       └── MenuItemCard.tsx ✅
├── hooks/
│   └── [livekit-specific only] ✅
├── lib/
│   ├── supabaseConfig.ts ✅ ENV SWITCHING
│   └── supabaseServer.ts ✅ SERVER CLIENT
├── supabase/
│   ├── config.toml ✅ LOCAL SETUP
│   ├── seed.sql ✅ SAMPLE DATA
│   └── migrations/
│       └── 001_initial_schema.sql ✅ FULL SCHEMA
└── docs/
    ├── ARCHITECTURE.md ✅ FROM DIAGRAM_LIVEKIT.md (SANITIZED)
    ├── SETUP.md ✅ GETTING STARTED
    ├── DEPLOYMENT.md ✅ PRODUCTION GUIDE
    └── API.md ✅ ENDPOINTS & TOOLS
```

---

## 🗑️ FILES TO EXCLUDE (DO NOT MIGRATE)

### 1. Secret Files (CRITICAL - Already in .gitignore)
```
.env.local
.env.local.cloud-backup
*.pem
*.key
```

### 2. Backup & Build Artifacts
```
bkups/
.next/
node_modules/
__pycache__/
.venv/
*.backup
*.log
```

### 3. Development Documentation (Internal Notes)
```
docs/AGENT_CLONE.md
docs/AGENT_STRATEGY.md
docs/AI_SDK_ANALYSIS.md
docs/CHAT_CARDS.md
docs/CHAT_EXP_FIXES.md
docs/CHAT_EXP.md
docs/CHAT_FLOW_DESIGN.md
docs/CHAT_FLOW_LOGS.md
docs/CRED_MGMT.md ❌ CONTAINS ceeklugdyurvxonnhykt
docs/DATA_MIGRATION.md
docs/DEBUGGING_IMPROVEMENTS.md
docs/DIAGRAM_AISDK.md ❌ AI SDK (not AgentServer)
docs/ENVIRONMENT_BADGE.md
docs/ENVIRONMENT_SWITCHING.md ❌ CONTAINS ceeklugdyurvxonnhykt
docs/LIVEKIT_NATIVE_DOCS.md
docs/LIVEKIT_NATIVE_IMPLEMENTATION.md
docs/LIVEKIT_NATIVE_INTEGRATION.md
docs/LIVEKIT_PHASE2.md
docs/LIVEKIT_REFERENCE_COMPARISON.md
docs/MIGRATION_NATIVE_TO_AGENTSERVER.md
docs/SDK_STRATEGY.md
docs/TEST_USE_CASES.md
docs/VISUAL_DIAGRAMS.md
docs/VOICE_AGENT_ARCHITECTURES.md
docs/YOUTUBE_VIDEO_SCRIPT.md
```

### 4. Reference Implementations
```
livekit-reference/ (entire folder)
```

### 5. Root-Level Documentation (Move to /docs/)
```
AGENT_DATA_ACTIONS.md → docs/DATA_ACTIONS.md
AGENT_FLOW.md → docs/AGENT_FLOW.md
FOOD_DELIVERY_PLAN.md → EXCLUDE (internal planning)
INSTRUCTIONS.md → EXCLUDE (internal)
PROJECT_PLAN.md → EXCLUDE (internal)
REMOTE_SETUP.md → docs/DEPLOYMENT.md (merge & sanitize)
STARTUP.md → docs/SETUP.md (merge)
SUPABASE_MIGRATION_PLAN.md → EXCLUDE (internal)
```

### 6. Temporary & Old Files
```
check-db.js
complete_menu_data.sql (use supabase/seed.sql instead)
temp_menu_data.sql
test-livekit-connection.js
test-livekit-server.mjs
test-pattern-matching.js
simple-food-agent.mjs
working-food-agent.mjs
livekit-food-agent.mjs
```

### 7. Development Scripts (Keep Only Essential)
```
scripts/ (entire folder) → Keep only:
  - scripts/setup-local-supabase.sh
  - scripts/seed-database.sh
```

### 8. AI SDK Implementation Files
```
app/api/food-chat/ (AI SDK text chat)
app/api/voice-chat/ (AI SDK voice, not AgentServer)
app/api/openai/ (if exists)
app/food/concierge/ (old AI SDK UI)
app/food/concierge-native/ (Native API, not AgentServer)
hooks/useAssistantSpeech.ts (AI SDK)
hooks/useAudioTranscription.ts (AI SDK)
legacy/ (entire folder)
```

### 9. Old/Unused Components
```
components/DebugPanel.tsx (dev tool)
components/EnvironmentBadge.tsx (internal switching)
components/MuxPreviewPlayer.tsx (different demo)
data/muxTrailers.ts (different demo)
```

---

## 📦 FILES TO MIGRATE & SANITIZE

### Core Application Files

#### Python Agent (agents/)
```
✅ agents/food_concierge_agentserver.py
   - Remove any hardcoded URLs
   - Ensure all logging is sanitized
   
✅ agents/database.py
   - Remove console.log of full Supabase URL
   - Change to: print(f"Supabase: {'Cloud' if 'supabase.co' in url else 'Local'}")
   
✅ agents/requirements.txt
   - Keep as-is
   
✅ agents/README.md
   - Remove: LIVEKIT_URL=wss://visao-w97d7sv9.livekit.cloud
   - Replace: LIVEKIT_URL=wss://your-project.livekit.cloud
   - Remove: LIVEKIT_API_KEY=APIRAVmRfMkqdBh
   - Replace: LIVEKIT_API_KEY=your-api-key
```

#### Next.js Application (app/)
```
✅ app/layout.tsx - Keep as-is
✅ app/page.tsx - Keep as-is (landing page)
✅ app/globals.css - Keep as-is

✅ app/food/concierge-agentserver/page.tsx
   - Main voice UI for AgentServer
   - Verify no hardcoded credentials
   
✅ app/api/livekit-agentserver/token/route.ts
   - Token generation endpoint
   - Verify uses process.env correctly
```

#### Components (components/)
```
✅ components/FoodCourtHeader.tsx
✅ components/food-cards/RestaurantCard.tsx
✅ components/food-cards/MenuItemCard.tsx
✅ components/food-cards/MenuItemSimpleCard.tsx
✅ components/food-cards/CartSummaryCard.tsx
```

#### Library Files (lib/)
```
✅ lib/supabaseConfig.ts
   - Remove comment: "remote: Uses production Supabase (ceeklugdyurvxonnhykt.supabase.co)"
   - Replace: "remote: Uses production Supabase (your-project.supabase.co)"
   
✅ lib/supabaseServer.ts
   - Keep as-is (generic implementation)
```

#### Configuration Files (root)
```
✅ package.json
   - Update: "name": "livekit-agentserver-food-ordering"
   - Update: "description": "Voice-based food ordering with LiveKit AgentServer"
   - Remove: All test scripts except essential ones
   
✅ tsconfig.json - Keep as-is
✅ next.config.js - Keep as-is
✅ tailwind.config.js - Keep as-is
✅ postcss.config.js - Keep as-is
✅ .gitignore - Enhanced version from audit
```

#### Environment Templates
```
✅ .env.example
   - Use enhanced template from audit report
   - All placeholders, no real values
   
❌ env.local.example - REMOVE (duplicate)
❌ env.remote.example - REMOVE (duplicate)
```

### Documentation Files

#### Keep & Sanitize
```
✅ docs/DIAGRAM_LIVEKIT.md → docs/ARCHITECTURE.md
   - Remove: OPENAI_API_KEY=sk-proj-xxxxxx (real pattern)
   - Remove: wss://visao-w97d7sv9.livekit.cloud
   - Remove: https://ceeklugdyurvxonnhykt.supabase.co
   - Replace all with: your-project placeholders
   
✅ docs/AGENTSERVER_QUICKSTART.md → docs/SETUP.md
   - Sanitize URLs
   - Add prerequisites section
   
✅ Create docs/DEPLOYMENT.md
   - Based on REMOTE_SETUP.md but sanitized
   - Add Vercel/cloud deployment steps
   
✅ Create docs/API.md
   - Document all 9 function tools
   - Document token endpoint
   - Document data channel structure
```

### Supabase Files

#### Database Schema & Seeds
```
✅ supabase/config.toml
   - Keep as-is (local development config)
   
✅ supabase/migrations/001_initial_schema.sql
   - Combine from: supabase/exports/latest/schema.sql
   - Remove: GRANT statements with hardcoded project info
   - Keep: All CREATE TABLE, CREATE INDEX, CREATE VIEW
   
✅ supabase/seed.sql
   - Sample restaurants (3-5)
   - Sample menu items (10-15 per restaurant)
   - Sample user profiles (demo profile)
   - NO real customer data
   
❌ complete_menu_data.sql - REMOVE
❌ temp_menu_data.sql - REMOVE
```

---

## 🔧 SANITIZATION CHECKLIST

### Global Search & Replace
```bash
# In ALL files:
ceeklugdyurvxonnhykt → your-project
visao-w97d7sv9 → your-project

# In documentation only:
sk-proj-xxxxxx → sk-your-openai-key
APIRAVmRfMkqdBh → your-api-key
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... → your-jwt-token

# Remove specific URLs:
https://ceeklugdyurvxonnhykt.supabase.co → https://your-project.supabase.co
wss://visao-w97d7sv9.livekit.cloud → wss://your-project.livekit.cloud
```

### Code-Level Changes

#### agents/database.py
```diff
- print(f"   Supabase URL: {supabase_url}")
+ supabase_type = 'Cloud' if 'supabase.co' in supabase_url else 'Local'
+ print(f"   Supabase: {supabase_type}")
```

#### lib/supabaseConfig.ts
```diff
- // - remote: Uses production Supabase (ceeklugdyurvxonnhykt.supabase.co)
+ // - remote: Uses production Supabase (your-project.supabase.co)
```

#### docs/ARCHITECTURE.md (from DIAGRAM_LIVEKIT.md)
```diff
- │  • WebRTC Media Server (wss://visao-w97d7sv9.livekit.cloud)
+ │  • WebRTC Media Server (wss://your-project.livekit.cloud)

- LIVEKIT_URL=wss://visao-w97d7sv9.livekit.cloud
+ LIVEKIT_URL=wss://your-project.livekit.cloud

- SUPABASE_URL=https://ceeklugdyurvxonnhykt.supabase.co
+ SUPABASE_URL=https://your-project.supabase.co

- OPENAI_API_KEY=sk-proj-xxxxxx
+ OPENAI_API_KEY=sk-your-openai-api-key
```

---

## 📝 NEW DOCUMENTATION TO CREATE

### 1. README.md (Complete Rewrite)
```markdown
# LiveKit AgentServer - Food Ordering Voice Assistant

Real-time voice-based food ordering system using LiveKit AgentServer framework.

## Features
- 🎙️ Natural voice conversations
- 🍕 Restaurant search by cuisine
- 📋 Menu browsing
- 🛒 Cart management
- ✅ Order placement
- 🎨 Visual cards via data channel

## Tech Stack
- LiveKit AgentServer (Python)
- Next.js 14 (App Router)
- Supabase (PostgreSQL)
- OpenAI GPT-4o-mini (LLM)
- Deepgram Nova-3 (STT)
- OpenAI TTS (Text-to-Speech)

## Quick Start
[Link to docs/SETUP.md]

## Architecture
[Link to docs/ARCHITECTURE.md]

## License
MIT
```

### 2. docs/SETUP.md
```markdown
# Setup Guide

## Prerequisites
- Node.js 18+
- Python 3.11+
- Docker Desktop (for local Supabase)
- LiveKit Cloud account
- OpenAI API key

## Installation Steps
1. Clone repository
2. Install dependencies
3. Setup Supabase
4. Configure environment variables
5. Start Python agent
6. Run Next.js dev server

[Detailed steps...]
```

### 3. docs/DEPLOYMENT.md
```markdown
# Deployment Guide

## Supabase Cloud Setup
## LiveKit Cloud Setup
## Vercel Deployment
## Environment Variables for Production
## Health Checks
```

### 4. docs/API.md
```markdown
# API Reference

## Token Endpoint
POST /api/livekit-agentserver/token

## Function Tools (9 tools)
1. get_user_profile
2. find_food_item
3. find_restaurants_by_type
...

## Data Channel Messages
[JSON schemas for each tool result]
```

### 5. LICENSE
```
MIT License

Copyright (c) 2026

Permission is hereby granted, free of charge...
```

---

## 🚀 MIGRATION WORKFLOW

### Phase 1: Preparation (Current Repo)
1. ✅ Complete security audit
2. ✅ Document migration plan (this file)
3. ⏳ Rotate all API keys
4. ⏳ Create clean .env.example
5. ⏳ Test application with new keys

### Phase 2: New Repository Setup
1. Create new private GitHub repo: `livekit-agentserver-food-ordering`
2. Initialize with:
   - Empty README.md
   - .gitignore (enhanced version)
   - LICENSE (MIT)

### Phase 3: Selective File Copy
```bash
# Root configuration
cp package.json new-repo/
cp package-lock.json new-repo/
cp tsconfig.json new-repo/
cp next.config.js new-repo/
cp tailwind.config.js new-repo/
cp postcss.config.js new-repo/
cp .env.example new-repo/

# Python agent
cp -r agents/ new-repo/agents/
# (manually sanitize database.py and README.md)

# Next.js app (selective)
mkdir -p new-repo/app
cp app/layout.tsx new-repo/app/
cp app/page.tsx new-repo/app/
cp app/globals.css new-repo/app/
cp -r app/food/concierge-agentserver new-repo/app/food/
cp -r app/api/livekit-agentserver new-repo/app/api/

# Components (selective)
mkdir -p new-repo/components/food-cards
cp components/FoodCourtHeader.tsx new-repo/components/
cp components/food-cards/*.tsx new-repo/components/food-cards/

# Library files
cp -r lib/ new-repo/lib/
# (manually sanitize supabaseConfig.ts)

# Supabase
mkdir -p new-repo/supabase/migrations
cp supabase/config.toml new-repo/supabase/
# (create new schema.sql and seed.sql)

# Documentation
mkdir -p new-repo/docs
# (create new documentation from templates above)
```

### Phase 4: Sanitization
1. Run global search & replace for project IDs
2. Manually edit files listed in Sanitization Checklist
3. Remove all console.log statements that log env vars
4. Verify no secrets in any file

### Phase 5: Testing in New Repo
1. Clone new repo to fresh directory
2. Copy `.env.example` to `.env.local` with real (NEW) credentials
3. Start Supabase: `supabase start`
4. Run migrations: `supabase db reset`
5. Install Python deps: `cd agents && pip install -r requirements.txt`
6. Install Node deps: `npm install`
7. Start agent: `python agents/food_concierge_agentserver.py dev`
8. Start Next.js: `npm run dev`
9. Test voice conversation end-to-end

### Phase 6: Documentation Review
1. Write new README.md
2. Create SETUP.md with step-by-step guide
3. Create DEPLOYMENT.md for production
4. Create API.md with tool documentation
5. Sanitize ARCHITECTURE.md (from DIAGRAM_LIVEKIT.md)
6. Add code comments for clarity

### Phase 7: Pre-Public Checklist
- [ ] No secrets in any committed file
- [ ] No real project IDs or URLs
- [ ] .gitignore covers all sensitive files
- [ ] README is beginner-friendly
- [ ] Setup guide is complete and tested
- [ ] All npm scripts work
- [ ] Python agent starts successfully
- [ ] Voice conversation works end-to-end
- [ ] Code is well-commented
- [ ] License file present (MIT recommended)

### Phase 8: Make Public
1. Review repository settings
2. Add topics/tags: `livekit`, `voice-assistant`, `food-ordering`, `python`, `nextjs`
3. Set repository to public
4. Add repository description
5. Enable issues and discussions
6. Create initial release (v1.0.0)

---

## 📊 FILE COUNT COMPARISON

### Current Repository
```
Total files: ~200+
- Root .md files: 12
- /docs/: ~50 files
- /scripts/: ~100 files
- /agents/: 5 files
- /app/: ~30 files
- /components/: ~10 files
```

### Target Repository
```
Total files: ~40-50
- Root: 8 config files + README + LICENSE
- /docs/: 5 core docs
- /agents/: 4 files (agent + database + deps + readme)
- /app/: 10 files (focused on AgentServer UI)
- /components/: 5-6 files (food cards only)
- /lib/: 2 files
- /supabase/: 3 files (config + schema + seed)
```

**Reduction: ~75% fewer files, 100% focused content**

---

## 🎯 SUCCESS CRITERIA

A successful migration means:

1. ✅ **Security**: No secrets, no real project IDs, clean git history
2. ✅ **Simplicity**: Single clear purpose (AgentServer voice ordering)
3. ✅ **Completeness**: Works out-of-box with proper setup
4. ✅ **Documentation**: Clear README, setup guide, architecture docs
5. ✅ **Maintainability**: Well-organized, commented code
6. ✅ **Beginner-Friendly**: Easy for others to learn and extend

---

## 📚 ADDITIONAL RESOURCES TO CREATE

### Example .env.local (for SETUP.md)
```bash
# Copy from .env.example and fill in:
OPENAI_API_KEY=sk-proj-...
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=APIxxxxx
LIVEKIT_API_SECRET=xxxxxxxx
SUPABASE_URL=http://127.0.0.1:54321  # local
SUPABASE_SERVICE_ROLE_KEY=eyJh...  # from supabase start
```

### Screenshots to Add
1. Voice UI in action
2. Restaurant cards displayed
3. Cart summary
4. Terminal output showing agent logs

### Video Walkthrough Ideas
1. Setup from scratch (5 min)
2. Code walkthrough (10 min)
3. Adding a new tool (15 min)

---

## 🔄 MAINTENANCE AFTER PUBLIC RELEASE

### Ongoing Tasks
- Monitor GitHub issues
- Update dependencies quarterly
- Keep LiveKit SDK up-to-date
- Respond to pull requests
- Add new features based on community feedback

### Potential Enhancements
- [ ] TypeScript version of Python agent
- [ ] Support for more LLM providers
- [ ] Multi-language support
- [ ] Order history tracking
- [ ] Real payment integration
- [ ] Mobile app example

---

## 📞 SUPPORT & CONTRIBUTION

After going public, add these sections to README:

### Getting Help
- GitHub Issues for bugs
- Discussions for questions
- Twitter: @yourhandle

### Contributing
- Fork the repository
- Create feature branch
- Submit pull request
- Follow code style guidelines

---

**Next Steps:**
1. Review this plan thoroughly
2. Rotate all API keys
3. Create new private GitHub repo
4. Follow Phase 3-7 workflow
5. Test extensively before making public

**Estimated Time:** 4-6 hours for complete migration

---

*This document serves as the master plan for creating a clean, secure, educational public repository focused on LiveKit AgentServer implementation.*
