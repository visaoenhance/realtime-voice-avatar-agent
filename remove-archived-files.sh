#!/bin/bash
# Remove archived files from the working directory
# This completes the archival process by deleting originals that are safely archived

set -e

echo "🗑️  Removing archived files from working directory..."
echo "⚠️  All files have been backed up to archive/"
echo ""

# Function to safely remove a file/directory
remove_archived() {
    local path="$1"
    
    if [ -f "$path" ] || [ -d "$path" ]; then
        # Verify it exists in archive
        if [ -e "archive/$path" ]; then
            rm -rf "$path"
            echo "✓ Removed: $path"
        else
            echo "⚠️  Skipping $path (not found in archive)"
        fi
    fi
}

# ROOT LEVEL FILES
echo "📦 Removing root-level archived files..."
remove_archived ".env.local"
remove_archived ".env.local.cloud-backup"
remove_archived "env.local.example"
remove_archived "env.remote.example"
remove_archived "start-dev.sh"
remove_archived "FOOD_DELIVERY_PLAN.md"
remove_archived "INSTRUCTIONS.md"
remove_archived "PROJECT_PLAN.md"
remove_archived "SUPABASE_MIGRATION_PLAN.md"
remove_archived "complete_menu_data.sql"
remove_archived "temp_menu_data.sql"
remove_archived "check-db.js"
remove_archived "test-livekit-connection.js"
remove_archived "test-livekit-server.mjs"
remove_archived "test-pattern-matching.js"
remove_archived "simple-food-agent.mjs"
remove_archived "working-food-agent.mjs"
remove_archived "livekit-food-agent.mjs"

# AGENTS DIRECTORY
echo ""
echo "📦 Removing agents/ archived files..."
remove_archived "agents/food_concierge_native.py"
remove_archived "agents/test_cart_remove.py"
remove_archived "agents/test_database.py"
remove_archived "agents/__pycache__"

# APP DIRECTORY
echo ""
echo "📦 Removing app/ unused implementations..."
remove_archived "app/api/food-chat"
remove_archived "app/api/voice-chat"
remove_archived "app/api/openai"
remove_archived "app/api/livekit-native"
remove_archived "app/food/concierge"
remove_archived "app/food/concierge-native"
remove_archived "app/food/stores"
remove_archived "app/voice"

# COMPONENTS DIRECTORY
echo ""
echo "📦 Removing components/ unused files..."
remove_archived "components/DebugPanel.tsx"
remove_archived "components/EnvironmentBadge.tsx"
remove_archived "components/EnvironmentBadgeServer.tsx"
remove_archived "components/MuxPreviewPlayer.tsx"

# DATA DIRECTORY
echo ""
echo "📦 Removing data/ unused files..."
remove_archived "data/muxTrailers.ts"

# DOCS DIRECTORY
echo ""
echo "📦 Removing docs/ internal documentation..."
remove_archived "docs/AGENT_CLONE.md"
remove_archived "docs/AGENT_STRATEGY.md"
remove_archived "docs/AI_SDK_ANALYSIS.md"
remove_archived "docs/CHAT_CARDS.md"
remove_archived "docs/CHAT_EXP_FIXES.md"
remove_archived "docs/CHAT_EXP.md"
remove_archived "docs/CHAT_FLOW_DESIGN.md"
remove_archived "docs/CHAT_FLOW_LOGS.md"
remove_archived "docs/CRED_MGMT.md"
remove_archived "docs/DATA_MIGRATION.md"
remove_archived "docs/DEBUGGING_IMPROVEMENTS.md"
remove_archived "docs/DIAGRAM_AISDK.md"
remove_archived "docs/ENVIRONMENT_BADGE.md"
remove_archived "docs/ENVIRONMENT_SWITCHING.md"
remove_archived "docs/LIVEKIT_NATIVE_DOCS.md"
remove_archived "docs/LIVEKIT_NATIVE_IMPLEMENTATION.md"
remove_archived "docs/LIVEKIT_NATIVE_INTEGRATION.md"
remove_archived "docs/LIVEKIT_PHASE2.md"
remove_archived "docs/LIVEKIT_REFERENCE_COMPARISON.md"
remove_archived "docs/MIGRATION_NATIVE_TO_AGENTSERVER.md"
remove_archived "docs/SDK_STRATEGY.md"
remove_archived "docs/TEST_USE_CASES.md"
remove_archived "docs/VISUAL_DIAGRAMS.md"
remove_archived "docs/VOICE_AGENT_ARCHITECTURES.md"
remove_archived "docs/YOUTUBE_VIDEO_SCRIPT.md"
remove_archived "docs/PUBLIC_AUDIT_MIGRATION.md"
remove_archived "docs/MIGRATION_CHECKLIST.md"
remove_archived "docs/FILE_MIGRATION_MATRIX.md"
remove_archived "docs/BRANCH_MIGRATION_WORKFLOW.md"

# HOOKS DIRECTORY
echo ""
echo "📦 Removing hooks/ AI SDK hooks..."
remove_archived "hooks/useAssistantSpeech.ts"
remove_archived "hooks/useAudioTranscription.ts"
remove_archived "hooks/useRealtimeVoice.ts"

# SCRIPTS DIRECTORY
echo ""
echo "📦 Removing scripts/ directory..."
if [ -d "archive/scripts" ]; then
    rm -rf scripts
    echo "✓ Removed: scripts/"
fi

# REFERENCE FOLDERS
echo ""
echo "📦 Removing reference folders..."
remove_archived "legacy"
remove_archived "livekit-reference"
remove_archived "bkups"

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "📊 Summary:"
echo "All archived files have been removed from the working directory."
echo "They remain safely stored in archive/ (excluded from git)"
echo ""
echo "Next steps:"
echo "1. Run 'git status' to see removed files"
echo "2. Run 'git add -u' to stage deletions"
echo "3. Commit with 'git commit -m \"chore: remove archived files from working directory\"'"
