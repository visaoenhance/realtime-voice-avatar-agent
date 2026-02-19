# Branch-Based Migration Workflow

**Strategy:** Clean and test in a new branch, then push to new repo  
**Advantage:** Test everything works BEFORE creating new repository  
**Date:** February 19, 2026

---

## 🎯 WORKFLOW OVERVIEW

```
Current Repo (main branch)
  └─ Create: public-release branch
      ├─ Delete old files
      ├─ Reorganize structure
      ├─ Sanitize code/docs
      ├─ Keep .env.local LOCALLY for testing (not committed)
      ├─ Test & verify everything works
      └─ Push ONLY this branch → New Private Repo
          └─ Final audit → Make Public
```

**Key Benefit:** You can test the cleaned codebase works perfectly BEFORE committing to the new repository structure.

---

## 📋 STEP-BY-STEP WORKFLOW

### Phase 1: Pre-Work (Backup Current Setup)

#### 1.1 Backup Your Working .env.local
```bash
# KEEP your current working keys for now
# Just backup in case something goes wrong
cp .env.local ~/Desktop/.env.local.working-backup

# DO NOT rotate keys yet - we'll test with current keys first
# This way if something breaks, we know it's the code, not the setup
```

- [ ] Backed up current working .env.local
- [ ] Verified .gitignore includes `.env.local`
- [ ] Current credentials still work

**Note:** We'll keep using your CURRENT working credentials through Phase 6 (testing). Only after confirming everything works will we test fresh setup with new keys.

---

### Phase 2: Create Clean Branch

#### 2.1 Create and Checkout Branch
```bash
cd /Users/ceo15/Documents/Visao/Development\ with\ AI/ubereats-ai-sdk-hitl

# Create new branch from current state
git checkout -b public-release

# Verify you're on new branch
git branch
# Should show: * public-release
```

#### 2.2 Verify .gitignore Protection
```bash
# Make sure these patterns are in .gitignore
cat .gitignore | grep -E "\.env|\.backup|bkups"

# Should show:
# .env*.local
# .env
# .env.local.cloud-backup
# bkups/
# *.backup

# If missing, add them now:
echo "" >> .gitignore
echo "# Ensure all env files ignored" >> .gitignore
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
echo ".env*.backup" >> .gitignore
echo "*.backup" >> .gitignore
echo "bkups/" >> .gitignore

git add .gitignore
git commit -m "Enhance .gitignore for public release"
```

---

### Phase 3: Delete Unwanted Files

#### 3.1 Delete Secret/Backup Files
```bash
# These should never be committed, but remove from tracking if they are
git rm --cached .env.local 2>/dev/null || true
git rm --cached .env.local.cloud-backup 2>/dev/null || true
git rm -r --cached bkups/ 2>/dev/null || true

# Commit the removal
git commit -m "Remove sensitive files from tracking" || echo "Nothing to remove"
```

#### 3.2 Delete Old/Temp Files from Root
```bash
# Remove temporary and old implementation files
rm -f complete_menu_data.sql
rm -f temp_menu_data.sql
rm -f check-db.js
rm -f test-livekit-connection.js
rm -f test-livekit-server.mjs
rm -f test-pattern-matching.js
rm -f simple-food-agent.mjs
rm -f working-food-agent.mjs
rm -f livekit-food-agent.mjs
rm -f env.local.example
rm -f env.remote.example

git add -A
git commit -m "Remove temporary and old implementation files"
```

#### 3.3 Delete Old Documentation (Root Level)
```bash
# Keep only README.md in root
# Move others to docs/ or delete if internal

# Internal docs to delete:
rm -f FOOD_DELIVERY_PLAN.md
rm -f INSTRUCTIONS.md
rm -f PROJECT_PLAN.md
rm -f SUPABASE_MIGRATION_PLAN.md

# These will be merged into new docs:
# (don't delete yet, we'll reference them)
# AGENT_DATA_ACTIONS.md → will inform docs/DATA_ACTIONS.md
# AGENT_FLOW.md → will inform docs/ARCHITECTURE.md
# REMOTE_SETUP.md → will merge into docs/DEPLOYMENT.md
# STARTUP.md → will merge into docs/SETUP.md

git add -A
git commit -m "Remove internal planning documents"
```

#### 3.4 Delete Reference Folders
```bash
# Remove entire reference/learning folders
rm -rf livekit-reference/
rm -rf legacy/
rm -rf bkups/  # if still present

git add -A
git commit -m "Remove reference implementations and legacy code"
```

#### 3.5 Delete AI SDK Implementation Files
```bash
# Remove AI SDK routes (keeping only AgentServer)
rm -rf app/api/food-chat/
rm -rf app/api/voice-chat/
rm -rf app/api/openai/

# Remove AI SDK UI pages
rm -rf app/food/concierge/
rm -rf app/food/concierge-native/
rm -rf app/voice/

# Remove AI SDK hooks
rm -f hooks/useAssistantSpeech.ts
rm -f hooks/useAudioTranscription.ts
rm -f hooks/useRealtimeVoice.ts

git add -A
git commit -m "Remove AI SDK implementation (focusing on AgentServer)"
```

#### 3.6 Delete Development Components
```bash
# Remove dev-only components
rm -f components/DebugPanel.tsx
rm -f components/EnvironmentBadge.tsx
rm -f components/EnvironmentBadgeServer.tsx
rm -f components/MuxPreviewPlayer.tsx

# Remove non-food-ordering data
rm -f data/muxTrailers.ts

git add -A
git commit -m "Remove development and non-essential components"
```

#### 3.7 Clean Python Agent Folder
```bash
cd agents/

# Remove old implementations
rm -f food_concierge_native.py
rm -f test_cart_remove.py
rm -f test_database.py
rm -rf __pycache__/
rm -rf tools/  # if exists

cd ..

git add -A
git commit -m "Clean agents folder - keep only AgentServer implementation"
```

#### 3.8 Delete Test Scripts
```bash
# Keep scripts folder structure but remove all test scripts
rm -rf scripts/*

# Optionally keep setup scripts if they exist and are useful
# git restore scripts/setup-local-supabase.sh (if exists)

git add -A
git commit -m "Remove development test scripts"
```

#### 3.9 Clean Documentation Folder
```bash
cd docs/

# Keep only files we'll sanitize
# Delete all internal dev docs
rm -f AGENT_CLONE.md
rm -f AGENT_STRATEGY.md
rm -f AI_SDK_ANALYSIS.md
rm -f CHAT_*.md
rm -f CRED_MGMT.md
rm -f DATA_MIGRATION.md
rm -f DEBUGGING_IMPROVEMENTS.md
rm -f DIAGRAM_AISDK.md
rm -f ENVIRONMENT_*.md
rm -f LIVEKIT_NATIVE_*.md
rm -f LIVEKIT_PHASE2.md
rm -f LIVEKIT_REFERENCE_COMPARISON.md
rm -f MIGRATION_*.md
rm -f SDK_STRATEGY.md
rm -f TEST_USE_CASES.md
rm -f VISUAL_DIAGRAMS.md
rm -f VOICE_AGENT_ARCHITECTURES.md
rm -f YOUTUBE_VIDEO_SCRIPT.md

# Keep these for migration (will be removed after):
# - PUBLIC_AUDIT_MIGRATION.md (delete after done)
# - MIGRATION_CHECKLIST.md (delete after done)
# - FILE_MIGRATION_MATRIX.md (delete after done)
# - BRANCH_MIGRATION_WORKFLOW.md (delete after done)

# Files to keep and sanitize:
# - DIAGRAM_LIVEKIT.md → will rename to ARCHITECTURE.md
# - AGENTSERVER_QUICKSTART.md → will merge into SETUP.md

cd ..

git add -A
git commit -m "Remove internal development documentation"
```

---

### Phase 4: Reorganize Structure

#### 4.1 Move Root Documentation to /docs/
```bash
# Move remaining root .md files to docs/
mv AGENT_DATA_ACTIONS.md docs/DATA_ACTIONS.md
mv AGENT_FLOW.md docs/FLOW.md

# We'll create new docs from these, then can delete originals:
# REMOTE_SETUP.md → merge into new docs/DEPLOYMENT.md
# STARTUP.md → merge into new docs/SETUP.md

git add -A
git commit -m "Move documentation to /docs folder"
```

#### 4.2 Organize Supabase Files
```bash
# Create clean supabase structure
mkdir -p supabase/migrations

# We'll create new files here:
# supabase/migrations/001_initial_schema.sql
# supabase/seed.sql

# Keep:
# supabase/config.toml

git add -A
git commit -m "Organize supabase folder structure"
```

---

### Phase 5: Sanitize Files

#### 5.1 Sanitize agents/database.py
```bash
# Edit agents/database.py
# Change logging of Supabase URL
```

Open `agents/database.py` and change:
```python
# BEFORE (line ~31):
print(f"   Supabase URL: {supabase_url}")

# AFTER:
supabase_type = 'Cloud' if 'supabase.co' in supabase_url else 'Local'
print(f"   Supabase: {supabase_type}")
```

```bash
git add agents/database.py
git commit -m "Sanitize database.py - remove URL logging"
```

#### 5.2 Sanitize agents/README.md
```bash
# Edit agents/README.md
# Replace real credentials with placeholders
```

Search and replace in `agents/README.md`:
- `wss://visao-w97d7sv9.livekit.cloud` → `wss://your-project.livekit.cloud`
- `APIRAVmRfMkqdBh` → `your-api-key`
- Any other real credentials → placeholders

```bash
git add agents/README.md
git commit -m "Sanitize agents/README.md - use placeholder credentials"
```

#### 5.3 Sanitize lib/supabaseConfig.ts
```bash
# Edit lib/supabaseConfig.ts
# Replace real project ID in comment
```

Open `lib/supabaseConfig.ts` and change:
```typescript
// BEFORE:
// - remote: Uses production Supabase (ceeklugdyurvxonnhykt.supabase.co)

// AFTER:
// - remote: Uses production Supabase (your-project.supabase.co)
```

```bash
git add lib/supabaseConfig.ts
git commit -m "Sanitize supabaseConfig.ts - remove real project ID"
```

#### 5.4 Update package.json
```bash
# Edit package.json
```

Update these fields:
```json
{
  "name": "livekit-agentserver-food-ordering",
  "version": "1.0.0",
  "description": "Voice-based food ordering with LiveKit AgentServer, Python, Next.js, and Supabase",
  "private": true
}
```

Remove unnecessary test scripts, keep only:
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  }
}
```

```bash
git add package.json
git commit -m "Update package.json for public release"
```

#### 5.5 Sanitize docs/DIAGRAM_LIVEKIT.md → ARCHITECTURE.md
```bash
# This is the most important doc to sanitize
# Will rename to ARCHITECTURE.md
```

Global search and replace in `docs/DIAGRAM_LIVEKIT.md`:
- `ceeklugdyurvxonnhykt` → `your-project`
- `visao-w97d7sv9` → `your-project`
- `sk-proj-xxxxxx` → `sk-your-openai-key`
- `APIRAVmRfMkqdBh` → `your-api-key`
- `DaXXgQnevvPmoxZy5mzyekWsaZqXAi7Y51bFmI10gfaA` → `your-api-secret`

```bash
# Rename the file
mv docs/DIAGRAM_LIVEKIT.md docs/ARCHITECTURE.md

git add docs/ARCHITECTURE.md
git commit -m "Sanitize and rename DIAGRAM_LIVEKIT.md to ARCHITECTURE.md"
```

#### 5.6 Create New Documentation
```bash
# Create docs/SETUP.md (getting started guide)
# Create docs/DEPLOYMENT.md (production deployment)
# Create docs/API.md (tool documentation)
```

Use content from:
- STARTUP.md + REMOTE_SETUP.md → docs/SETUP.md
- REMOTE_SETUP.md + new content → docs/DEPLOYMENT.md
- DIAGRAM_LIVEKIT.md tool sections → docs/API.md

```bash
git add docs/SETUP.md docs/DEPLOYMENT.md docs/API.md
git commit -m "Add public documentation: SETUP, DEPLOYMENT, API"
```

#### 5.7 Create New README.md
```bash
# Rewrite README.md for public audience
```

Create a new beginner-friendly README.md (template in PUBLIC_AUDIT_MIGRATION.md)

```bash
git add README.md
git commit -m "Rewrite README.md for public release"
```

#### 5.8 Add LICENSE
```bash
# Create MIT License
cat > LICENSE << 'EOF'
MIT License

Copyright (c) 2026

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
EOF

git add LICENSE
git commit -m "Add MIT License"
```

#### 5.9 Create Supabase Schema and Seed
```bash
# Create supabase/migrations/001_initial_schema.sql
# Based on supabase/exports/latest/schema.sql but cleaned

# Create supabase/seed.sql
# Sample data only (3-5 restaurants, 10-15 menu items)

git add supabase/migrations/001_initial_schema.sql supabase/seed.sql
git commit -m "Add clean Supabase schema and seed data"
```

#### 5.10 Update .env.example
```bash
# Create comprehensive .env.example
# Use template from PUBLIC_AUDIT_MIGRATION.md
```

```bash
git add .env.example
git commit -m "Update .env.example with complete template"
```

---

### Phase 6: Build & Test Everything

#### 6.1 Install Dependencies
```bash
# Node dependencies
npm install

# Python dependencies
cd agents
python -m pip install -r requirements.txt
cd ..
```

- [ ] npm install completed successfully
- [ ] Python packages installed successfully

#### 6.2 Start Supabase
```bash
# Start local Supabase
supabase start

# Apply schema
supabase db reset

# Verify tables created
supabase db list
```

- [ ] Supabase started successfully
- [ ] Schema applied correctly
- [ ] Tables exist: fc_restaurants, fc_menu_items, fc_carts, etc.

#### 6.3 Build Next.js
```bash
# Test build
npm run build

# Should complete without errors
```

- [ ] Next.js build succeeds with no errors
- [ ] No TypeScript errors
- [ ] No missing imports

#### 6.4 Start Python Agent
```bash
# In terminal 1
cd agents
python food_concierge_agentserver.py dev

# Should show:
# ✅ Database client initialized
# ✅ Supabase: Local (or Cloud)
# 🚀 Agent worker started...
```

- [ ] Agent starts without errors
- [ ] Database connection successful
- [ ] No credential errors

#### 6.5 Start Next.js Dev Server
```bash
# In terminal 2
npm run dev

# Should start on http://localhost:3000
```

- [ ] Next.js starts on port 3000
- [ ] No runtime errors
- [ ] Pages load correctly

#### 6.6 Test Voice Conversation End-to-End
```bash
# Open browser: http://localhost:3000/food/concierge-agentserver
```

Test these interactions:
1. Click "Start Voice"
2. Say: "Show me Thai restaurants"
   - [ ] Agent responds with voice
   - [ ] Restaurant cards appear
3. Say: "What's on the menu at [restaurant name]"
   - [ ] Menu items displayed
4. Say: "Add [item] to my cart"
   - [ ] Cart updated
5. Say: "Show me my cart"
   - [ ] Cart summary appears
6. Say: "Place my order"
   - [ ] Order confirmed

- [ ] All voice interactions work
- [ ] Data channel cards display correctly
- [ ] No console errors
- [ ] Agent logs show tool calls

---

### Phase 7: Final Branch Cleanup

#### 7.1 Remove Migration Docs
```bash
# Now that migration is complete, remove the helper docs
rm docs/PUBLIC_AUDIT_MIGRATION.md
rm docs/MIGRATION_CHECKLIST.md
rm docs/FILE_MIGRATION_MATRIX.md
rm docs/BRANCH_MIGRATION_WORKFLOW.md

# Remove original docs that were merged into new ones
rm -f REMOTE_SETUP.md
rm -f STARTUP.md

git add -A
git commit -m "Remove migration helper documentation"
```

#### 7.2 Remove Unused Supabase Exports
```bash
# Remove reference exports folder if it exists
rm -rf supabase/exports/

git add -A
git commit -m "Remove supabase exports (reference material)" || echo "Already clean"
```

#### 7.3 Final Security Scan
```bash
# Search for any remaining secrets
echo "Scanning for potential secrets..."

# Should return ZERO results:
grep -r "sk-proj-YBzgg1Cjl7" . --exclude-dir=node_modules --exclude-dir=.git
grep -r "APIRAVmRfMkqdBh" . --exclude-dir=node_modules --exclude-dir=.git
grep -r "ceeklugdyurvxonnhykt" . --exclude-dir=node_modules --exclude-dir=.git
grep -r "visao-w97d7sv9" . --exclude-dir=node_modules --exclude-dir=.git

# Check git history for sensitive files
git log --all --full-history -- .env.local
git log --all --full-history -- .env.local.cloud-backup

echo "If all searches return empty, you're good!"
```

- [ ] No live credentials found in codebase
- [ ] Project IDs replaced with placeholders
- [ ] Git history shows no .env.local commits in this branch

#### 7.4 Count Files (Verification)
```bash
# Count tracked files
git ls-files | wc -l

# Should show approximately 40-50 files
```

- [ ] File count is ~40-50 (down from ~293)

---

### Phase 8: Test Fresh Setup with New Credentials

**NOW we test the "from scratch" experience with new instances**

#### 8.1 Create New Supabase Instance
```bash
# On supabase.com:
# 1. Create new project
# 2. Note project URL and keys
# 3. Run migrations:
```

In Supabase SQL Editor:
```sql
-- Copy contents of supabase/migrations/001_initial_schema.sql
-- Run it

-- Then copy contents of supabase/seed.sql
-- Run it
```

- [ ] New Supabase project created
- [ ] Schema migration run successfully
- [ ] Seed data imported
- [ ] Tables verified: fc_restaurants, fc_menu_items, etc.

#### 8.2 Get New API Keys
```bash
# Get fresh credentials from:
# - OpenAI: https://platform.openai.com/api-keys
# - LiveKit: Create new project or use existing with new keys
# - Supabase: From new project (service_role key)
# - Pexels: Create new API key
```

- [ ] New OpenAI API key
- [ ] New LiveKit credentials (URL, API key, API secret)
- [ ] New Supabase credentials (URL, service_role key)
- [ ] New Pexels API key (optional)

#### 8.3 Test with New Credentials
```bash
# Create fresh .env.local with NEW credentials
rm .env.local
cp .env.example .env.local
# Edit and fill in NEW keys

# Clear all caches
rm -rf .next/ node_modules/.cache/

# Reinstall (ensures clean state)
npm install

# Test with new credentials
npm run build
python agents/food_concierge_agentserver.py dev &
npm run dev

# Open: http://localhost:3000/food/concierge-agentserver
# Test voice conversation with NEW instances
```

- [ ] .env.local created with new credentials
- [ ] Build succeeds
- [ ] Python agent connects to new Supabase
- [ ] Voice conversation works with new LiveKit
- [ ] Can query new database successfully

#### 8.4 Update Setup Documentation
```bash
# If any issues found during fresh setup, update:
# - docs/SETUP.md
# - docs/DEPLOYMENT.md
# - .env.example
# - supabase/migrations/001_initial_schema.sql
# - supabase/seed.sql

# Make sure documentation is accurate for "from scratch" setup
```

- [ ] Setup docs tested and accurate
- [ ] All steps in SETUP.md work
- [ ] Schema migration is complete
- [ ] Seed data is sufficient

#### 8.5 Rotate Original Keys (Security)
```bash
# NOW rotate your original keys since they were exposed in old repo
# This ensures if someone finds them, they're dead

# Rotate on these platforms:
# - OpenAI dashboard
# - LiveKit dashboard  
# - Supabase dashboard (old project)
# - Pexels dashboard

# You don't need the old keys anymore - new project uses new keys
```

- [ ] Original OpenAI key rotated/deleted
- [ ] Original LiveKit keys rotated
- [ ] Original Supabase service_role key rotated
- [ ] Original Pexels key rotated

---

### Phase 9: Push to New Repository

#### 9.1 Create New Private GitHub Repository
```bash
# On GitHub.com:
# 1. Click "New Repository"
# 2. Name: livekit-agentserver-food-ordering
# 3. Description: "Voice-based food ordering with LiveKit AgentServer"
# 4. Visibility: Private (for now)
# 5. DO NOT initialize with README (we have one)
# 6. Create repository
```

- [ ] New private repo created on GitHub
- [ ] Repository name: livekit-agentserver-food-ordering
- [ ] Set to Private

#### 9.2 Add New Remote and Push Branch
```bash
# Add new repo as a remote
git remote add new-repo git@github.com:YOUR_USERNAME/livekit-agentserver-food-ordering.git

# Push ONLY the public-release branch
git push new-repo public-release:main

# This pushes your clean branch as the main branch in new repo
```

#### 9.3 Clone New Repo and Verify Clean State
```bash
# Clone the new repo to a completely fresh location
cd ~/Desktop
git clone git@github.com:YOUR_USERNAME/livekit-agentserver-food-ordering.git
cd livekit-agentserver-food-ordering

# Verify file count
git ls-files | wc -l
# Should be ~40-50

# Verify no secrets
grep -r "sk-proj-" . --exclude-dir=node_modules --exclude-dir=.git
grep -r "ceeklugdyurvxonnhykt" . --exclude-dir=node_modules --exclude-dir=.git
# Both should return 0 results (except placeholders in .env.example)

# You've already tested with new credentials in Phase 8
# This is just to verify the git repo itself is clean
```

- [ ] New repo cloned successfully
- [ ] File count is ~40-50
- [ ] No secrets found in codebase
- [ ] Git history is clean
- [ ] Ready for final audit

---

### Phase 10: Final Audit Before Public

#### 10.1 Security Audit Checklist
- [ ] No `.env.local` file in repository
- [ ] No real API keys anywhere
- [ ] No real project IDs (`ceeklugdyurvxonnhykt`, `visao-w97d7sv9`)
- [ ] `.gitignore` comprehensive
- [ ] Git history clean (no secret commits)
- [ ] All placeholders use "your-project" or similar

#### 10.2 Documentation Review
- [ ] README.md is beginner-friendly
- [ ] SETUP.md has complete getting-started guide
- [ ] ARCHITECTURE.md explains the system clearly
- [ ] DEPLOYMENT.md covers production deployment
- [ ] API.md documents all tools
- [ ] LICENSE file present

#### 10.3 Code Quality Check
- [ ] No console.log of environment variables
- [ ] All imports resolve
- [ ] TypeScript compiles cleanly
- [ ] Python has type hints
- [ ] Code is well-commented
- [ ] No TODO/FIXME in production code

#### 10.4 Repository Settings
- [ ] Repository description added
- [ ] Topics/tags added: `livekit`, `voice-assistant`, `food-ordering`, `python`, `nextjs`, `supabase`, `openai`
- [ ] Website URL added (if applicable)
- [ ] Issues enabled
- [ ] Discussions enabled (optional)

---

### Phase 11: Make Public

#### 11.1 Final Decision Point
```
✅ All tests pass
✅ Documentation complete
✅ No secrets exposed
✅ Fresh clone works perfectly
```

#### 11.2 Make Repository Public
```bash
# On GitHub.com:
# Repository Settings → Danger Zone → Change visibility → Make public
```

#### 11.3 Create Initial Release
```bash
# On GitHub.com:
# Releases → Create new release
# Tag: v1.0.0
# Title: "Initial Public Release"
# Description: Brief overview of project
```

#### 11.4 Announce (Optional)
- [ ] Tweet about the release
- [ ] Share on Reddit (r/livekit, r/webdev, r/python)
- [ ] Share on Discord servers
- [ ] Write blog post

---

## 📊 VERIFICATION CHECKLIST

### Before Pushing to New Repo
- [ ] All deletions committed on public-release branch
- [ ] All file moves/renames committed
- [ ] All sanitization edits committed
- [ ] New documentation created
- [ ] LICENSE added
- [ ] .env.example comprehensive
- [ ] Build succeeds (`npm run build`)
- [ ] Tests pass (manual voice conversation)
- [ ] No secrets in codebase
- [ ] File count ~40-50
- [ ] Git log clean on this branch

### After Pushing to New Repo
- [ ] Fresh clone succeeds
- [ ] Setup from scratch works (<15 minutes)
- [ ] Documentation is complete
- [ ] Application runs correctly
- [ ] Voice conversation works
- [ ] No errors in console

---

## 🎯 SUCCESS CRITERIA

You're ready to make the repository public when:

1. ✅ Fresh clone + setup takes < 15 minutes
2. ✅ Voice conversation works end-to-end
3. ✅ Zero secrets in repository or git history
4. ✅ Documentation is beginner-friendly
5. ✅ File count reduced by ~85%
6. ✅ Build succeeds with no errors
7. ✅ Code is well-organized and focused

---

## 💡 TIPS

### Keep Your Work Safe
```bash
# Before starting, backup your current .env.local
cp .env.local ~/Desktop/.env.local.safe-backup

# Never commit this, but keep it safe
```

### Test in Fresh Directory
```bash
# Always test final version in completely fresh clone
# This ensures setup documentation is accurate
```

### Use Commits as Checkpoints
```bash
# Commit after each major step
# Makes it easy to revert if something goes wrong
git log --oneline  # see all your checkpoints
```

---

## ⏱️ TIME ESTIMATES

| Phase | Task | Time |
|-------|------|------|
| 1 | Pre-work (backup) | 5 min |
| 2 | Create branch | 5 min |
| 3 | Delete unwanted files | 30 min |
| 4 | Reorganize structure | 15 min |
| 5 | Sanitize files | 1 hour |
| 6 | Build & test (current keys) | 45 min |
| 7 | Final cleanup | 15 min |
| 8 | Test fresh setup (NEW keys) | 1.5 hours |
| 9 | Push to new repo | 15 min |
| 10 | Final audit | 30 min |
| 11 | Make public | 15 min |
| **TOTAL** | | **~5 hours** |

---

## 🚀 QUICK START COMMANDS

```bash
# Start here:
cd /Users/ceo15/Documents/Visao/Development\ with\ AI/ubereats-ai-sdk-hitl

# Backup your working .env.local
cp .env.local ~/Desktop/.env.local.working-backup

# Create branch
git checkout -b public-release
git branch  # verify you're on public-release

# Then follow Phase 3-11 above

# Key commands:
git add -A               # stage all changes
git commit -m "message"  # commit changes
git status               # check what changed
git log --oneline        # see commit history
```

---

**This workflow lets you test everything works BEFORE committing to the new repository structure. Much safer!**

## 🎯 TWO-PHASE TESTING STRATEGY

### Phase 1: Test Sanitized Code (Phases 1-7)
**Use CURRENT working credentials**
- Verify code changes didn't break anything
- Test with your existing Supabase instance
- Confirm voice conversation still works
- **Goal:** Isolate code issues from setup issues

### Phase 2: Test Fresh Setup (Phase 8)
**Use NEW credentials and NEW instances**
- Create new Supabase project
- Run migration scripts from scratch
- Test with fresh API keys
- Verify setup documentation is accurate
- **Goal:** Ensure "from scratch" experience works

### Why This Order?
If something breaks in Phase 1 → **Code problem** (fix sanitization)  
If Phase 1 works but Phase 2 breaks → **Documentation problem** (fix setup guide)

This isolates issues and makes debugging much easier! 🎯

**Next:** Start with Phase 1 (backup .env.local), then work through phases sequentially.
