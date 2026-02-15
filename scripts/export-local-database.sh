#!/bin/bash
set -e

# Export Local Supabase Database
# This script exports the current local database schema and data
# for migration to a remote Supabase instance

echo "🗄️  Exporting local Supabase database..."
echo ""

# Create export directory with timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
EXPORT_DIR="supabase/exports/${TIMESTAMP}"
mkdir -p "${EXPORT_DIR}"

echo "📁 Export directory: ${EXPORT_DIR}"
echo ""

# Export schema only
echo "📋 Exporting schema..."
supabase db dump --local --schema public > "${EXPORT_DIR}/schema.sql"
echo "   ✅ Schema exported to ${EXPORT_DIR}/schema.sql"

# Export data only
echo "📊 Exporting data..."
supabase db dump --local --data-only --schema public > "${EXPORT_DIR}/data.sql"
echo "   ✅ Data exported to ${EXPORT_DIR}/data.sql"

# Create combined migration file
echo "🔗 Creating combined migration file..."
MIGRATION_FILE="${EXPORT_DIR}/full_migration.sql"

cat > "${MIGRATION_FILE}" << 'EOF'
-- ============================================================================
-- FULL DATABASE MIGRATION
-- ============================================================================
-- Generated: $(date +"%Y-%m-%d %H:%M:%S")
-- Export directory: ${EXPORT_DIR}
--
-- This file contains the complete schema and data from local development
-- Run this in your remote Supabase SQL Editor to recreate the database
--
-- IMPORTANT: This will create tables and insert data
-- Make sure your remote database is ready (empty or backed up)
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- SCHEMA
-- ============================================================================

EOF

cat "${EXPORT_DIR}/schema.sql" >> "${MIGRATION_FILE}"

cat >> "${MIGRATION_FILE}" << 'EOF'

-- ============================================================================
-- DATA
-- ============================================================================

EOF

cat "${EXPORT_DIR}/data.sql" >> "${MIGRATION_FILE}"

echo "   ✅ Combined migration file: ${MIGRATION_FILE}"
echo ""

# Create a "latest" symlink
rm -f supabase/exports/latest
ln -s "${TIMESTAMP}" supabase/exports/latest

echo "✅ Export complete!"
echo ""
echo "📦 Files created:"
echo "   - ${EXPORT_DIR}/schema.sql (schema only)"
echo "   - ${EXPORT_DIR}/data.sql (data only)"
echo "   - ${EXPORT_DIR}/full_migration.sql (combined)"
echo ""
echo "🔗 Latest export: supabase/exports/latest/ (symlink)"
echo ""
echo "📋 Next steps:"
echo "   1. Review the migration file: ${MIGRATION_FILE}"
echo "   2. Set up remote Supabase connection (see REMOTE_SETUP.md)"
echo "   3. Run: node scripts/migrate-to-remote.js"
