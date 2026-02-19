#!/bin/bash
# Archive files marked for deletion in FILE_MIGRATION_MATRIX.md
# This preserves all files for reference while cleaning the public release

set -e

echo "🗄️  Creating archive structure..."
mkdir -p archive

# Create INDEX.md header
cat > archive/INDEX.md << 'EOF'
# Archived Files Index

**Purpose**: Files archived during public release preparation.  
**Date**: February 19, 2026  
**Reason**: These files contain secrets, are internal documentation, or are not part of the AgentServer implementation.

---

## Table of Contents
- [Root Files](#root-files)
- [Secret Files](#secret-files)
- [Agents Directory](#agents-directory)
- [App Directory](#app-directory)
- [Components Directory](#components-directory)
- [Data Directory](#data-directory)
- [Docs Directory](#docs-directory)
- [Hooks Directory](#hooks-directory)
- [Scripts Directory](#scripts-directory)
- [Reference Folders](#reference-folders)

---

## Root Files

EOF

# Function to archive a file and log it
archive_file() {
    local src="$1"
    local desc="$2"
    local reason="$3"
    
    if [ -f "$src" ] || [ -d "$src" ]; then
        local dest="archive/$src"
        mkdir -p "$(dirname "$dest")"
        
        if [ -d "$src" ]; then
            cp -r "$src" "$dest"
            echo "📁 $src → archive/$src"
        else
            cp "$src" "$dest"
            echo "📄 $src → archive/$src"
        fi
        
        # Add to index
        echo "### \`$src\`" >> archive/INDEX.md
        echo "- **Description**: $desc" >> archive/INDEX.md
        echo "- **Reason**: $reason" >> archive/INDEX.md
        echo "- **Original Location**: \`$src\`" >> archive/INDEX.md
        echo "" >> archive/INDEX.md
    else
        echo "⚠️  Not found: $src (skipping)"
    fi
}

# ROOT LEVEL FILES
echo ""
echo "📦 Archiving root-level files..."

archive_file ".env.local" "Local environment variables with live secrets" "CONTAINS SENSITIVE API KEYS"
archive_file ".env.local.cloud-backup" "Backup of environment file" "CONTAINS SENSITIVE API KEYS"
archive_file "env.local.example" "Example environment file (duplicate)" "Duplicate of .env.example"
archive_file "env.remote.example" "Remote environment example" "Not needed"
archive_file "start-dev.sh" "Development startup script" "Optional, not needed for public release"
archive_file "FOOD_DELIVERY_PLAN.md" "Internal planning document" "Internal development planning"
archive_file "INSTRUCTIONS.md" "Internal instructions" "Internal development documentation"
archive_file "PROJECT_PLAN.md" "Internal project plan" "Internal development planning"
archive_file "SUPABASE_MIGRATION_PLAN.md" "Database migration planning" "Internal development documentation"
archive_file "complete_menu_data.sql" "Complete menu SQL data" "Old version, superseded by migrations"
archive_file "temp_menu_data.sql" "Temporary menu SQL data" "Temporary development file"
archive_file "check-db.js" "Database check script" "Development test script"
archive_file "test-livekit-connection.js" "LiveKit connection test" "Development test script"
archive_file "test-livekit-server.mjs" "LiveKit server test" "Development test script"
archive_file "test-pattern-matching.js" "Pattern matching test" "Development test script"
archive_file "simple-food-agent.mjs" "Simple food agent implementation" "Early prototype"
archive_file "working-food-agent.mjs" "Working food agent implementation" "Early prototype"
archive_file "livekit-food-agent.mjs" "LiveKit food agent implementation" "Early prototype"

# AGENTS DIRECTORY
echo ""
echo "📦 Archiving agents/ files..."
echo "" >> archive/INDEX.md
echo "## Agents Directory" >> archive/INDEX.md
echo "" >> archive/INDEX.md

archive_file "agents/food_concierge_native.py" "Native API implementation" "Different implementation approach (not AgentServer)"
archive_file "agents/test_cart_remove.py" "Cart removal test script" "Development test file"
archive_file "agents/test_database.py" "Database test script" "Development test file"
archive_file "agents/__pycache__" "Python cache directory" "Build artifacts"

# APP DIRECTORY
echo ""
echo "📦 Archiving app/ unused implementations..."
echo "" >> archive/INDEX.md
echo "## App Directory" >> archive/INDEX.md
echo "" >> archive/INDEX.md

archive_file "app/api/food-chat" "AI SDK food chat implementation" "Different implementation (AI SDK, not AgentServer)"
archive_file "app/api/voice-chat" "AI SDK voice chat implementation" "Different implementation (AI SDK, not AgentServer)"
archive_file "app/api/openai" "AI SDK OpenAI helpers" "Different implementation (AI SDK, not AgentServer)"
archive_file "app/api/livekit-native" "Native API implementation" "Different implementation (Native API, not AgentServer)"
archive_file "app/food/concierge" "AI SDK concierge UI" "Different implementation (AI SDK, not AgentServer)"
archive_file "app/food/concierge-native" "Native API concierge UI" "Different implementation (Native API, not AgentServer)"
archive_file "app/food/stores" "Food stores UI" "Separate UI implementation"
archive_file "app/voice" "AI SDK voice UI" "Different implementation (AI SDK, not AgentServer)"

# COMPONENTS DIRECTORY
echo ""
echo "📦 Archiving components/ unused files..."
echo "" >> archive/INDEX.md
echo "## Components Directory" >> archive/INDEX.md
echo "" >> archive/INDEX.md

archive_file "components/DebugPanel.tsx" "Debug panel component" "Development-only component"
archive_file "components/EnvironmentBadge.tsx" "Environment badge component" "Development-only component"
archive_file "components/EnvironmentBadgeServer.tsx" "Server environment badge" "Development-only component"
archive_file "components/MuxPreviewPlayer.tsx" "Mux video player" "Different demo feature"

# DATA DIRECTORY
echo ""
echo "📦 Archiving data/ unused files..."
echo "" >> archive/INDEX.md
echo "## Data Directory" >> archive/INDEX.md
echo "" >> archive/INDEX.md

archive_file "data/muxTrailers.ts" "Mux video trailer data" "Different demo feature"

# DOCS DIRECTORY
echo ""
echo "📦 Archiving docs/ internal documentation..."
echo "" >> archive/INDEX.md
echo "## Docs Directory" >> archive/INDEX.md
echo "" >> archive/INDEX.md

archive_file "docs/AGENT_CLONE.md" "Agent cloning documentation" "Internal development documentation"
archive_file "docs/AGENT_STRATEGY.md" "Agent strategy documentation" "Internal development documentation"
archive_file "docs/AI_SDK_ANALYSIS.md" "AI SDK analysis" "Internal development documentation"
archive_file "docs/CHAT_CARDS.md" "Chat cards documentation" "Internal development documentation"
archive_file "docs/CHAT_EXP_FIXES.md" "Chat fixes documentation" "Internal development documentation"
archive_file "docs/CHAT_EXP.md" "Chat experience documentation" "Internal development documentation"
archive_file "docs/CHAT_FLOW_DESIGN.md" "Chat flow design" "Internal development documentation"
archive_file "docs/CHAT_FLOW_LOGS.md" "Chat flow logs" "Internal development documentation"
archive_file "docs/CRED_MGMT.md" "Credentials management" "CONTAINS PROJECT IDS - Internal documentation"
archive_file "docs/DATA_MIGRATION.md" "Data migration documentation" "Internal development documentation"
archive_file "docs/DEBUGGING_IMPROVEMENTS.md" "Debugging improvements" "Internal development documentation"
archive_file "docs/DIAGRAM_AISDK.md" "AI SDK diagram" "Different implementation (AI SDK, not AgentServer)"
archive_file "docs/ENVIRONMENT_BADGE.md" "Environment badge documentation" "Internal development documentation"
archive_file "docs/ENVIRONMENT_SWITCHING.md" "Environment switching" "CONTAINS PROJECT IDS - Internal documentation"
archive_file "docs/LIVEKIT_NATIVE_DOCS.md" "LiveKit Native documentation" "Different implementation (Native API, not AgentServer)"
archive_file "docs/LIVEKIT_NATIVE_IMPLEMENTATION.md" "Native implementation docs" "Different implementation (Native API, not AgentServer)"
archive_file "docs/LIVEKIT_NATIVE_INTEGRATION.md" "Native integration docs" "Different implementation (Native API, not AgentServer)"
archive_file "docs/LIVEKIT_PHASE2.md" "LiveKit Phase 2 planning" "Internal development documentation"
archive_file "docs/LIVEKIT_REFERENCE_COMPARISON.md" "LiveKit reference comparison" "Internal development documentation"
archive_file "docs/MIGRATION_NATIVE_TO_AGENTSERVER.md" "Migration documentation" "Internal development documentation"
archive_file "docs/SDK_STRATEGY.md" "SDK strategy documentation" "Internal development documentation"
archive_file "docs/TEST_USE_CASES.md" "Test use cases" "Internal development documentation"
archive_file "docs/VISUAL_DIAGRAMS.md" "Visual diagrams documentation" "Internal development documentation"
archive_file "docs/VOICE_AGENT_ARCHITECTURES.md" "Voice agent architectures" "Internal development documentation"
archive_file "docs/YOUTUBE_VIDEO_SCRIPT.md" "YouTube video script" "Internal marketing material"
archive_file "docs/PUBLIC_AUDIT_MIGRATION.md" "Public audit migration plan" "Internal migration documentation"
archive_file "docs/MIGRATION_CHECKLIST.md" "Migration checklist" "Internal migration documentation"
archive_file "docs/FILE_MIGRATION_MATRIX.md" "File migration matrix" "Internal migration documentation"
archive_file "docs/BRANCH_MIGRATION_WORKFLOW.md" "Branch migration workflow" "Internal migration documentation"

# HOOKS DIRECTORY
echo ""
echo "📦 Archiving hooks/ AI SDK hooks..."
echo "" >> archive/INDEX.md
echo "## Hooks Directory" >> archive/INDEX.md
echo "" >> archive/INDEX.md

archive_file "hooks/useAssistantSpeech.ts" "AI SDK assistant speech hook" "Different implementation (AI SDK, not AgentServer)"
archive_file "hooks/useAudioTranscription.ts" "AI SDK audio transcription hook" "Different implementation (AI SDK, not AgentServer)"
archive_file "hooks/useRealtimeVoice.ts" "AI SDK realtime voice hook" "Different implementation (AI SDK, not AgentServer)"

# SCRIPTS DIRECTORY (archive entire directory except a few files)
echo ""
echo "📦 Archiving scripts/ directory..."
echo "" >> archive/INDEX.md
echo "## Scripts Directory" >> archive/INDEX.md
echo "" >> archive/INDEX.md

if [ -d "scripts" ]; then
    echo "### \`scripts/\` (entire directory)" >> archive/INDEX.md
    echo "- **Description**: Development and testing scripts (~100+ files)" >> archive/INDEX.md
    echo "- **Reason**: Development-only scripts not needed for public release" >> archive/INDEX.md
    echo "- **Original Location**: \`scripts/\`" >> archive/INDEX.md
    echo "- **Files**: audit-remote.js, check-*.js, test-*.js, debug-*.js, verify-*.js, and many more" >> archive/INDEX.md
    echo "" >> archive/INDEX.md
    
    mkdir -p archive/scripts
    cp -r scripts/* archive/scripts/
    echo "📁 scripts/ → archive/scripts/ (entire directory)"
fi

# REFERENCE FOLDERS
echo ""
echo "📦 Archiving reference folders..."
echo "" >> archive/INDEX.md
echo "## Reference Folders" >> archive/INDEX.md
echo "" >> archive/INDEX.md

archive_file "legacy" "Legacy implementations folder" "Old implementations and prototypes"
archive_file "livekit-reference" "LiveKit reference code" "Reference code from LiveKit examples"
archive_file "bkups" "Database backups" "DATABASE BACKUPS - CONTAINS USER DATA"

# Final summary in INDEX
cat >> archive/INDEX.md << 'EOF'

---

## Summary

This archive contains:
- **Secret files**: .env files with live API keys
- **Alternative implementations**: AI SDK and Native API versions (not AgentServer)
- **Internal documentation**: Planning docs, migration guides, development notes
- **Development tools**: Test scripts, debug tools, audit scripts
- **Reference code**: Examples and legacy implementations
- **Database backups**: Full database dumps with user data

**⚠️ SECURITY WARNING**: This archive contains sensitive data and should NEVER be committed to git or shared publicly.

**Retention**: Keep this archive locally for reference during development, but exclude from all public repositories.

EOF

echo ""
echo "✅ Archive complete! See archive/INDEX.md for details"
echo ""
echo "📊 Summary:"
find archive -type f | wc -l | xargs echo "Total files archived:"
du -h archive | tail -1 | awk '{print "Total size: " $1}'
