#!/bin/bash

# Environment switcher for Supabase
# Usage: ./scripts/switch-env.sh [local|remote]

ENV=${1:-local}

if [[ "$ENV" != "local" && "$ENV" != "remote" ]]; then
  echo "❌ Invalid environment. Use: local or remote"
  exit 1
fi

ENV_FILE=".env.local"

if [ ! -f "$ENV_FILE" ]; then
  echo "❌ .env.local file not found"
  exit 1
fi

# Update SUPABASE_ENV value
if grep -q "^SUPABASE_ENV=" "$ENV_FILE"; then
  # Update existing SUPABASE_ENV
  sed -i '' "s/^SUPABASE_ENV=.*/SUPABASE_ENV=$ENV/" "$ENV_FILE"
  echo "✅ Switched to $ENV environment"
else
  # Add SUPABASE_ENV if not present
  sed -i '' "1i\\
SUPABASE_ENV=$ENV\\
" "$ENV_FILE"
  echo "✅ Added SUPABASE_ENV=$ENV"
fi

# Show which URL will be used
if [ "$ENV" = "remote" ]; then
  ACTIVE_URL=$(grep "^REMOTE_SUPABASE_URL=" "$ENV_FILE" | cut -d'=' -f2)
else
  ACTIVE_URL=$(grep "^LOCAL_SUPABASE_URL=" "$ENV_FILE" | cut -d'=' -f2)
fi

echo "🌐 Active URL: $ACTIVE_URL"
echo ""
echo "💡 Restart your dev server to apply changes:"
echo "   ./start-dev.sh (or your usual start command)"
