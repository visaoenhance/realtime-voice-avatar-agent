# File Migration Matrix

**Quick reference: What to keep, what to exclude, what to sanitize.**  
**✅ = Copy | ❌ = Exclude | 🔧 = Copy & Sanitize**

---

## ROOT LEVEL FILES

```
.env.example                                  ✅ (use new sanitized version)
.gitignore                                    ✅ (enhanced version from audit)
.env.local                                    ❌ CONTAINS SECRETS - DELETE
.env.local.cloud-backup                       ❌ CONTAINS SECRETS - DELETE
env.local.example                             ❌ (duplicate)
env.remote.example                            ❌ (duplicate)
next-env.d.ts                                 ✅
next.config.js                                ✅
package.json                                  🔧 (update name/description)
package-lock.json                             ✅
postcss.config.js                             ✅
tailwind.config.js                            ✅
tsconfig.json                                 ✅
start-dev.sh                                  ❌ (optional, not needed)

# Root .md files (move to /docs/ after sanitizing)
AGENT_DATA_ACTIONS.md                         → docs/DATA_ACTIONS.md (sanitized)
AGENT_FLOW.md                                 → docs/AGENT_FLOW.md (optional)
FOOD_DELIVERY_PLAN.md                         ❌ (internal planning)
INSTRUCTIONS.md                               ❌ (internal)
PROJECT_PLAN.md                               ❌ (internal)
README.md                                     ✅ (REWRITE for public)
REMOTE_SETUP.md                               → merge into docs/DEPLOYMENT.md
STARTUP.md                                    → merge into docs/SETUP.md
SUPABASE_MIGRATION_PLAN.md                    ❌ (internal)

# Root .sql files (move to /supabase/)
complete_menu_data.sql                        ❌ (old version)
temp_menu_data.sql                            ❌ (temporary)

# Root .js test files
check-db.js                                   ❌
test-livekit-connection.js                    ❌
test-livekit-server.mjs                       ❌
test-pattern-matching.js                      ❌
simple-food-agent.mjs                         ❌
working-food-agent.mjs                        ❌
livekit-food-agent.mjs                        ❌
```

---

## /agents/ DIRECTORY

```
agents/
  README.md                                   🔧 SANITIZE URLs & keys
  database.py                                 🔧 SANITIZE logging
  food_concierge_agentserver.py               ✅
  food_concierge_native.py                    ❌ (different approach)
  requirements.txt                            ✅
  test_cart_remove.py                         ❌
  test_database.py                            ❌
  __pycache__/                                ❌
  tools/                                      ❌ (if exists, likely old)
```

---

## /app/ DIRECTORY

```
app/
  layout.tsx                                  ✅
  page.tsx                                    ✅
  globals.css                                 ✅
  
  api/
    food-chat/                                ❌ AI SDK implementation
    voice-chat/                               ❌ AI SDK implementation
    openai/                                   ❌ AI SDK helpers
    
    livekit-agentserver/
      token/
        route.ts                              ✅ MAIN TOKEN ENDPOINT
    
    livekit-native/                           ❌ (Native API, not AgentServer)
  
  food/
    concierge-agentserver/
      page.tsx                                ✅ MAIN UI
    
    concierge/                                ❌ AI SDK version
    concierge-native/                         ❌ Native API version
    stores/                                   ❌ (if exists, separate UI)
  
  voice/                                      ❌ AI SDK voice UI
```

---

## /components/ DIRECTORY

```
components/
  FoodCourtHeader.tsx                         ✅
  DebugPanel.tsx                              ❌
  EnvironmentBadge.tsx                        ❌
  EnvironmentBadgeServer.tsx                  ❌
  MuxPreviewPlayer.tsx                        ❌
  
  food-cards/
    RestaurantCard.tsx                        ✅
    MenuItemCard.tsx                          ✅
    MenuItemSimpleCard.tsx                    ✅
    CartSummaryCard.tsx                       ✅
```

---

## /data/ DIRECTORY

```
data/
  foodCourtSamples.ts                         ✅ (if used for fallback)
  foodSampleMenu.ts                           ✅ (if used for fallback)
  muxTrailers.ts                              ❌ (different demo)
```

---

## /docs/ DIRECTORY

```
docs/
  # Keep & Sanitize
  DIAGRAM_LIVEKIT.md                          → ARCHITECTURE.md 🔧 SANITIZE
  AGENTSERVER_QUICKSTART.md                   → merge into SETUP.md
  
  # Create New
  SETUP.md                                    ✅ CREATE NEW
  DEPLOYMENT.md                               ✅ CREATE NEW  
  API.md                                      ✅ CREATE NEW
  
  # Exclude (Internal Development Docs)
  AGENT_CLONE.md                              ❌
  AGENT_STRATEGY.md                           ❌
  AI_SDK_ANALYSIS.md                          ❌
  CHAT_CARDS.md                               ❌
  CHAT_EXP_FIXES.md                           ❌
  CHAT_EXP.md                                 ❌
  CHAT_FLOW_DESIGN.md                         ❌
  CHAT_FLOW_LOGS.md                           ❌
  CRED_MGMT.md                                ❌ CONTAINS PROJECT IDS
  DATA_MIGRATION.md                           ❌
  DEBUGGING_IMPROVEMENTS.md                   ❌
  DIAGRAM_AISDK.md                            ❌ AI SDK (not AgentServer)
  ENVIRONMENT_BADGE.md                        ❌
  ENVIRONMENT_SWITCHING.md                    ❌ CONTAINS PROJECT IDS
  LIVEKIT_NATIVE_DOCS.md                      ❌
  LIVEKIT_NATIVE_IMPLEMENTATION.md            ❌
  LIVEKIT_NATIVE_INTEGRATION.md               ❌
  LIVEKIT_PHASE2.md                           ❌
  LIVEKIT_REFERENCE_COMPARISON.md             ❌
  MIGRATION_NATIVE_TO_AGENTSERVER.md          ❌
  SDK_STRATEGY.md                             ❌
  TEST_USE_CASES.md                           ❌
  VISUAL_DIAGRAMS.md                          ❌
  VOICE_AGENT_ARCHITECTURES.md                ❌
  YOUTUBE_VIDEO_SCRIPT.md                     ❌
  PUBLIC_AUDIT_MIGRATION.md                   ❌ (internal, keep in old repo)
  MIGRATION_CHECKLIST.md                      ❌ (internal, keep in old repo)
```

---

## /hooks/ DIRECTORY

```
hooks/
  useAssistantSpeech.ts                       ❌ AI SDK
  useAudioTranscription.ts                    ❌ AI SDK
  useRealtimeVoice.ts                         ❌ AI SDK
  
  # Only keep if used by AgentServer UI
  # (check imports in app/food/concierge-agentserver/page.tsx)
```

---

## /lib/ DIRECTORY

```
lib/
  supabaseConfig.ts                           🔧 SANITIZE comment
  supabaseServer.ts                           ✅
```

---

## /scripts/ DIRECTORY

```
scripts/
  # Keep only essential setup scripts
  setup-local-supabase.sh                     ✅ (create if needed)
  seed-database.sh                            ✅ (create if needed)
  
  # Exclude all test/dev scripts (~100 files)
  audit-remote.js                             ❌
  check-*.js                                  ❌
  test-*.js                                   ❌
  debug-*.js                                  ❌
  verify-*.js                                 ❌
  # ... all other ~95 scripts                 ❌
```

---

## /supabase/ DIRECTORY

```
supabase/
  config.toml                                 ✅
  
  # Create new organized structure
  migrations/
    001_initial_schema.sql                    ✅ CREATE (from exports/latest/schema.sql)
  
  seed.sql                                    ✅ CREATE (sample data only)
  
  # Exclude
  exports/                                    ❌ (reference material)
```

---

## FOLDERS TO EXCLUDE ENTIRELY

```
.next/                                        ❌ Build output
.venv/                                        ❌ Python virtual env
__pycache__/                                  ❌ Python cache
bkups/                                        ❌ DATABASE BACKUPS - CONTAINS DATA
legacy/                                       ❌ Old implementations
livekit-reference/                            ❌ Reference code
node_modules/                                 ❌ Dependencies
```

---

## NEW FILES TO CREATE

```
# Root
LICENSE                                       ✅ CREATE (MIT)
README.md                                     ✅ CREATE (complete rewrite)

# Documentation
docs/SETUP.md                                 ✅ CREATE
docs/DEPLOYMENT.md                            ✅ CREATE
docs/API.md                                   ✅ CREATE
docs/ARCHITECTURE.md                          ✅ CREATE (from DIAGRAM_LIVEKIT.md)

# Scripts (optional)
scripts/setup-local-supabase.sh               ✅ CREATE (if needed)
scripts/seed-database.sh                      ✅ CREATE (if needed)

# Supabase
supabase/migrations/001_initial_schema.sql    ✅ CREATE
supabase/seed.sql                             ✅ CREATE
```

---

## SANITIZATION TARGETS

### Files Requiring URL/Key Removal

#### High Priority (MUST Sanitize)
```
agents/README.md
  - LIVEKIT_URL=wss://visao-w97d7sv9.livekit.cloud
  - LIVEKIT_API_KEY=APIRAVmRfMkqdBh

agents/database.py
  - print(f"Supabase URL: {supabase_url}")

lib/supabaseConfig.ts
  - Comment: "ceeklugdyurvxonnhykt.supabase.co"

docs/ARCHITECTURE.md (from DIAGRAM_LIVEKIT.md)
  - wss://visao-w97d7sv9.livekit.cloud
  - https://ceeklugdyurvxonnhykt.supabase.co
  - OPENAI_API_KEY=sk-proj-xxxxxx
  - All real credentials in examples
```

#### Medium Priority (Good to Clean)
```
package.json
  - Update "name" field
  - Update "description" field
  - Remove unnecessary test scripts

Any component files
  - Check for console.log of env vars
  - Check for hardcoded URLs
```

---

## FILE COUNT SUMMARY

### Current Repository
```
Root level:        ~25 files
/agents/:          ~10 files
/app/:             ~30 files
/components/:      ~10 files
/data/:            ~5 files
/docs/:            ~50 files
/hooks/:           ~5 files
/lib/:             ~3 files
/scripts/:         ~100 files
/supabase/:        ~20 files
/legacy/:          ~10 files
/livekit-reference/: ~20 files
/bkups/:           ~5 files

TOTAL:             ~293 tracked files
```

### Target Repository
```
Root level:        ~10 files (configs + README + LICENSE)
/agents/:          ~4 files
/app/:             ~8 files (focused on AgentServer)
/components/:      ~5 files (food cards only)
/data/:            ~2 files (optional fallbacks)
/docs/:            ~5 files (essential documentation)
/hooks/:           ~0-2 files (only if used by AgentServer UI)
/lib/:             ~2 files
/scripts/:         ~0-2 files (setup only)
/supabase/:        ~3 files (config + schema + seed)

TOTAL:             ~40-45 files
```

**Reduction: 85% fewer files**

---

## COPY COMMAND EXAMPLES

### Safe Copy Commands (from old to new repo)

```bash
# Configuration files
cp package.json new-repo/
cp package-lock.json new-repo/
cp tsconfig.json new-repo/
cp next*.js new-repo/
cp postcss.config.js new-repo/
cp tailwind.config.js new-repo/

# Python agent (selective)
mkdir -p new-repo/agents
cp agents/food_concierge_agentserver.py new-repo/agents/
cp agents/database.py new-repo/agents/
cp agents/requirements.txt new-repo/agents/
cp agents/README.md new-repo/agents/
# THEN manually sanitize database.py and README.md

# Next.js app (selective)
mkdir -p new-repo/app/{food/concierge-agentserver,api/livekit-agentserver/token}
cp app/layout.tsx new-repo/app/
cp app/page.tsx new-repo/app/
cp app/globals.css new-repo/app/
cp app/food/concierge-agentserver/page.tsx new-repo/app/food/concierge-agentserver/
cp app/api/livekit-agentserver/token/route.ts new-repo/app/api/livekit-agentserver/token/

# Components
mkdir -p new-repo/components/food-cards
cp components/FoodCourtHeader.tsx new-repo/components/
cp components/food-cards/*.tsx new-repo/components/food-cards/

# Library
mkdir -p new-repo/lib
cp lib/supabaseConfig.ts new-repo/lib/
cp lib/supabaseServer.ts new-repo/lib/
# THEN manually sanitize supabaseConfig.ts

# Supabase
mkdir -p new-repo/supabase/migrations
cp supabase/config.toml new-repo/supabase/
# THEN create new migrations/001_initial_schema.sql
# THEN create new seed.sql
```

---

## VERIFICATION COMMANDS

### Security Checks (run in new repo)
```bash
# Check for secrets
git log --all --full-history -- .env.local
git log --all --full-history -- .env.local.cloud-backup

# Search for live keys
grep -r "sk-proj-YBzgg1Cjl7" .
grep -r "APIRAVmRfMkqdBh" .
grep -r "DaXXgQnevvPmoxZy5mzyekWsaZqXAi7Y51bFmI10gfaA" .

# Search for project IDs
grep -r "ceeklugdyurvxonnhykt" .
grep -r "visao-w97d7sv9" .

# Should return ZERO results for all above
```

### File Count Check
```bash
# In new repo root
find . -type f -not -path "./node_modules/*" -not -path "./.next/*" -not -path "./.git/*" | wc -l

# Should show ~40-50 files
```

---

## FINAL MIGRATION COMMAND SEQUENCE

```bash
# 1. Create and enter new repo directory
cd /path/to/repos
mkdir livekit-agentserver-food-ordering
cd livekit-agentserver-food-ordering
git init

# 2. Create initial files
touch README.md LICENSE .gitignore
# (populate these)

# 3. Copy files (use commands from "Copy Command Examples" section above)

# 4. Install and test
npm install
cd agents && pip install -r requirements.txt
supabase start
npm run dev

# 5. Run security verification (commands above)

# 6. Commit and push
git add .
git commit -m "Initial commit: LiveKit AgentServer food ordering"
git remote add origin git@github.com:username/livekit-agentserver-food-ordering.git
git push -u origin main
```

---

*Use this matrix alongside PUBLIC_AUDIT_MIGRATION.md and MIGRATION_CHECKLIST.md*
