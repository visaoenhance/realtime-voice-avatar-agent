# Migration Checklist - Quick Reference

**Use this checklist when executing the migration plan.**  
**See PUBLIC_AUDIT_MIGRATION.md for detailed explanations.**

---

## ⚠️ BEFORE YOU START

### Security (CRITICAL - Do First)
- [ ] Rotate OpenAI API key at https://platform.openai.com/api-keys
- [ ] Rotate LiveKit credentials at LiveKit dashboard
- [ ] Rotate Supabase service_role key at Supabase dashboard
- [ ] Rotate Pexels API key at https://www.pexels.com/api/
- [ ] Delete `.env.local` from this repo
- [ ] Delete `.env.local.cloud-backup` from this repo
- [ ] Clear git history with BFG Repo-Cleaner (if already committed)

---

## 📦 REPOSITORY SETUP

### New Repository Creation
- [ ] Create new GitHub repo: `livekit-agentserver-food-ordering`
- [ ] Set to **Private** initially
- [ ] Add `.gitignore` (use enhanced version from audit)
- [ ] Add LICENSE file (MIT recommended)
- [ ] Add empty README.md (will fill later)

---

## 📁 FILE MIGRATION

### Root Configuration Files (✅ = Copy, ❌ = Skip)
- [ ] ✅ `package.json` (update name field)
- [ ] ✅ `package-lock.json`
- [ ] ✅ `tsconfig.json`
- [ ] ✅ `next.config.js`
- [ ] ✅ `tailwind.config.js`
- [ ] ✅ `postcss.config.js`
- [ ] ✅ `.env.example` (use new sanitized version)
- [ ] ✅ `.gitignore` (enhanced version)
- [ ] ❌ `env.local.example` (duplicate)
- [ ] ❌ `env.remote.example` (duplicate)
- [ ] ❌ All `.md` files in root (moving to /docs/)
- [ ] ❌ All `.sql` files in root (moving to /supabase/)
- [ ] ❌ All `.js` test files in root

### Python Agent (/agents/)
- [ ] ✅ `food_concierge_agentserver.py`
- [ ] ✅ `database.py` (SANITIZE: remove URL logging)
- [ ] ✅ `requirements.txt`
- [ ] ✅ `README.md` (SANITIZE: remove real URLs/keys)
- [ ] ❌ `food_concierge_native.py` (different approach)
- [ ] ❌ `test_*.py` files

### Next.js App (/app/)
- [ ] ✅ `layout.tsx`
- [ ] ✅ `page.tsx`
- [ ] ✅ `globals.css`
- [ ] ✅ `food/concierge-agentserver/page.tsx`
- [ ] ✅ `api/livekit-agentserver/token/route.ts`
- [ ] ❌ `food/concierge/` (AI SDK version)
- [ ] ❌ `food/concierge-native/` (Native API version)
- [ ] ❌ `api/food-chat/` (AI SDK)
- [ ] ❌ `api/voice-chat/` (AI SDK)

### Components (/components/)
- [ ] ✅ `FoodCourtHeader.tsx`
- [ ] ✅ `food-cards/RestaurantCard.tsx`
- [ ] ✅ `food-cards/MenuItemCard.tsx`
- [ ] ✅ `food-cards/MenuItemSimpleCard.tsx`
- [ ] ✅ `food-cards/CartSummaryCard.tsx`
- [ ] ❌ `DebugPanel.tsx`
- [ ] ❌ `EnvironmentBadge.tsx`
- [ ] ❌ `MuxPreviewPlayer.tsx`

### Hooks (/hooks/)
- [ ] ✅ Only LiveKit-specific hooks
- [ ] ❌ `useAssistantSpeech.ts` (AI SDK)
- [ ] ❌ `useAudioTranscription.ts` (AI SDK)

### Library (/lib/)
- [ ] ✅ `supabaseConfig.ts` (SANITIZE: remove real project ID from comment)
- [ ] ✅ `supabaseServer.ts`

### Supabase (/supabase/)
- [ ] ✅ `config.toml`
- [ ] ✅ Create `migrations/001_initial_schema.sql` (from exports/latest/schema.sql)
- [ ] ✅ Create `seed.sql` (sample data only, no real customer data)
- [ ] ❌ `exports/` folder (reference only)

### Data (/data/)
- [ ] ✅ `foodCourtSamples.ts` (if used by AgentServer UI)
- [ ] ❌ `foodSampleMenu.ts` (if AI SDK only)
- [ ] ❌ `muxTrailers.ts` (different demo)

### Documentation (/docs/)
- [ ] ✅ Create `ARCHITECTURE.md` (from DIAGRAM_LIVEKIT.md, sanitized)
- [ ] ✅ Create `SETUP.md` (getting started guide)
- [ ] ✅ Create `DEPLOYMENT.md` (production deployment)
- [ ] ✅ Create `API.md` (tool documentation)
- [ ] ❌ All other docs/ files (internal notes)

### Exclude Entirely
- [ ] ❌ `bkups/` folder
- [ ] ❌ `livekit-reference/` folder
- [ ] ❌ `legacy/` folder
- [ ] ❌ `scripts/` folder (except setup scripts)
- [ ] ❌ `.next/` folder
- [ ] ❌ `node_modules/` folder
- [ ] ❌ `.venv/` folder

---

## 🔧 SANITIZATION TASKS

### Global Search & Replace (in ALL copied files)
- [ ] Find: `ceeklugdyurvxonnhykt` → Replace: `your-project`
- [ ] Find: `visao-w97d7sv9` → Replace: `your-project`
- [ ] Find: `sk-proj-YBzgg1Cjl7` (or similar) → Replace: `sk-your-openai-key`
- [ ] Find: `APIRAVmRfMkqdBh` → Replace: `your-api-key`
- [ ] Find: `DaXXgQnevvPmoxZy5mzyekWsaZqXAi7Y51bFmI10gfaA` → Replace: `your-api-secret`
- [ ] Find: `0WnwXubYYjaBX1wHXq6acFBUFPh1YSwxi2YHswW0Lnpjv9IO8uO1nUHO` → Replace: `your-pexels-key`

### Specific File Edits

#### agents/database.py
```python
# BEFORE:
print(f"   Supabase URL: {supabase_url}")

# AFTER:
supabase_type = 'Cloud' if 'supabase.co' in supabase_url else 'Local'
print(f"   Supabase: {supabase_type}")
```
- [ ] Applied

#### agents/README.md
- [ ] Remove real LiveKit URL
- [ ] Remove real API keys
- [ ] Use placeholders

#### lib/supabaseConfig.ts
```typescript
// BEFORE:
// - remote: Uses production Supabase (ceeklugdyurvxonnhykt.supabase.co)

// AFTER:
// - remote: Uses production Supabase (your-project.supabase.co)
```
- [ ] Applied

#### package.json
```json
{
  "name": "livekit-agentserver-food-ordering",
  "description": "Voice-based food ordering with LiveKit AgentServer"
}
```
- [ ] Name updated
- [ ] Description updated
- [ ] Removed unnecessary test scripts

---

## 📝 NEW DOCUMENTATION

### README.md (root)
- [ ] Project title & description
- [ ] Features list
- [ ] Tech stack
- [ ] Quick start link
- [ ] Architecture link
- [ ] License
- [ ] Screenshots (optional)

### docs/SETUP.md
- [ ] Prerequisites
- [ ] Installation steps
- [ ] Local Supabase setup
- [ ] Environment configuration
- [ ] Starting the agent
- [ ] Starting Next.js
- [ ] Testing the voice UI
- [ ] Troubleshooting

### docs/DEPLOYMENT.md
- [ ] Supabase Cloud setup
- [ ] LiveKit Cloud setup
- [ ] Environment variables for production
- [ ] Vercel deployment
- [ ] Health checks

### docs/ARCHITECTURE.md
- [ ] Based on DIAGRAM_LIVEKIT.md
- [ ] Remove all real credentials
- [ ] Update diagrams with placeholders
- [ ] Explain voice flow
- [ ] Explain tool system
- [ ] Explain data channel

### docs/API.md
- [ ] Token endpoint documentation
- [ ] All 9 function tools with schemas
- [ ] Data channel message formats
- [ ] Error responses

### LICENSE
- [ ] MIT License text
- [ ] Copyright year and holder

---

## ✅ TESTING IN NEW REPO

### Fresh Environment Test
- [ ] Clone new repo to completely fresh directory
- [ ] Copy `.env.example` to `.env.local`
- [ ] Fill in NEW (rotated) credentials
- [ ] Run `supabase start`
- [ ] Run `supabase db reset`
- [ ] Run `npm install`
- [ ] Run `cd agents && pip install -r requirements.txt`
- [ ] Start agent: `python agents/food_concierge_agentserver.py dev`
- [ ] Start Next.js: `npm run dev`
- [ ] Open http://localhost:3000
- [ ] Test voice conversation:
  - [ ] "Show me Thai restaurants"
  - [ ] "What's on the menu at [restaurant]"
  - [ ] "Add [item] to my cart"
  - [ ] "Show me my cart"
  - [ ] "Place my order"

### Code Quality Checks
- [ ] No `console.log` of environment variables
- [ ] No hardcoded URLs in code (only .env)
- [ ] All imports resolve correctly
- [ ] TypeScript compiles without errors
- [ ] Python code has type hints
- [ ] Functions are documented with docstrings

### Security Verification
- [ ] Run: `git log --all --full-history -- .env.local` (should be empty)
- [ ] Run: `git log --all --full-history -- .env.local.cloud-backup` (should be empty)
- [ ] Search codebase for `sk-proj-` (should only be in .env.example as placeholder)
- [ ] Search codebase for `ceeklugdyurvxonnhykt` (should be 0 results)
- [ ] Search codebase for `visao-w97d7sv9` (should be 0 results)
- [ ] Check `.gitignore` includes all sensitive patterns

---

## 🚀 PRE-PUBLIC CHECKLIST

### Final Review
- [ ] README.md is complete and beginner-friendly
- [ ] All documentation links work
- [ ] Code is well-commented
- [ ] No TODOs or FIXMEs in code
- [ ] Package.json scripts are documented
- [ ] License file is present
- [ ] .gitignore is comprehensive
- [ ] No secrets anywhere in repository
- [ ] Git history is clean (no secret commits)

### Repository Settings
- [ ] Repository description added
- [ ] Topics added: `livekit`, `voice-assistant`, `food-ordering`, `python`, `nextjs`, `supabase`
- [ ] Website URL added (if applicable)
- [ ] Enable Issues
- [ ] Enable Discussions
- [ ] Set default branch to `main`

### Optional Enhancements
- [ ] Add CONTRIBUTING.md
- [ ] Add CODE_OF_CONDUCT.md
- [ ] Add screenshots to README
- [ ] Record demo video
- [ ] Create initial GitHub release (v1.0.0)

---

## 🎯 GO PUBLIC

### Final Steps
- [ ] One more full security scan
- [ ] One more test from fresh clone
- [ ] Set repository visibility to **Public**
- [ ] Tweet/announce (optional)
- [ ] Share on Discord/Reddit (optional)
- [ ] Monitor initial issues

---

## 📊 SUCCESS METRICS

After migration, verify:
- [ ] File count reduced by ~75% (from ~200 to ~50 files)
- [ ] All secrets removed and rotated
- [ ] App works from fresh clone in <15 minutes
- [ ] Documentation is clear and complete
- [ ] Code is focused on single purpose (AgentServer)

---

**Total Estimated Time:** 4-6 hours

**Breakdown:**
- Security prep: 30 min
- File copying: 1 hour
- Sanitization: 1 hour
- Documentation: 2 hours
- Testing: 1 hour
- Final review: 30 min

---

*Last Updated: February 19, 2026*
