# Remote Supabase Setup Guide

This guide walks you through exporting your local database and migrating it to a remote Supabase project for production/demo use.

## Overview

We'll:
1. Export your current local database (schema + data)
2. Set up remote Supabase connection credentials
3. Run the migration on your remote project
4. Test the remote connection
5. Update your app to use remote database

## Prerequisites

- [x] Local Supabase running with data
- [ ] Remote Supabase project created (https://supabase.com)
- [ ] Remote project credentials (URL + Service Role Key)

## Step 1: Export Local Database

Run the export script to create a fresh snapshot of your local database:

```bash
./scripts/export-local-database.sh
```

This creates:
- `supabase/exports/[timestamp]/schema.sql` - Table definitions, indexes, constraints
- `supabase/exports/[timestamp]/data.sql` - All data (restaurants, menu items, etc.)
- `supabase/exports/[timestamp]/full_migration.sql` - Combined file ready to run
- `supabase/exports/latest/` - Symlink to most recent export

## Step 2: Create Remote Supabase Project

1. Go to https://supabase.com
2. Click "New Project"
3. Choose organization and set project details:
   - **Name**: `ubereats-food-court` (or your choice)
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free tier is fine for demo

4. Wait for project to initialize (~2 minutes)

## Step 3: Get Remote Credentials

Once your project is ready:

1. Go to **Project Settings** → **API**
2. Copy these values:
   - **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
   - **anon/public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **service_role key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (keep secret!)

## Step 4: Add Remote Credentials to .env.local

Add these lines to your `.env.local` file:

```bash
# Remote Supabase (Production)
REMOTE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
REMOTE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
REMOTE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Keep your local Supabase vars too
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
# ... etc
```

## Step 5: Run Migration on Remote

### Option A: SQL Editor (Recommended)

1. Go to your remote project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `supabase/exports/latest/full_migration.sql`
4. Paste into the SQL Editor
5. Click **RUN**
6. Wait for execution to complete

✅ This is the most reliable method for running DDL statements.

### Option B: Migration Script

```bash
node scripts/migrate-to-remote.js
```

This will:
- Test your remote connection
- Show you the migration file path
- Provide instructions for running it

## Step 6: Verify Remote Migration

Test your remote connection to ensure all data migrated successfully:

```bash
node scripts/test-remote-connection.js
```

This checks:
- ✅ Restaurant data exists
- ✅ Menu sections exist
- ✅ Menu items exist
- ✅ Sabor Latino Cantina image is correct (Pexels URL)

Expected output:
```
🔍 Testing Remote Supabase Connection
════════════════════════════════════════════════════════

📍 URL: https://xxxxxxxxxxxxx.supabase.co

1️⃣  Checking fc_restaurants table...
   ✅ Found 5 restaurants (showing first 5)
      - Island Breeze Caribbean (island-breeze-caribbean)
      - Sabor Latino Cantina (sabor-latino-cantina)
      ...

2️⃣  Checking fc_menu_sections table...
   ✅ Found 3 menu sections

3️⃣  Checking fc_menu_items table...
   ✅ Found 3 menu items

4️⃣  Checking Sabor Latino Cantina image...
   ✅ Sabor Latino Cantina
      Hero image: https://images.pexels.com/photos/14560045/pexels-photo-14...

════════════════════════════════════════════════════════
✅ Remote connection test complete!
```

## Step 7: Switch App to Remote Database

Update your `.env.local` to use remote Supabase:

```bash
# Change these to remote values:
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc... (remote anon key)

# Also update for server-side:
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... (remote service role key)
```

## Step 8: Restart and Test

1. Stop your dev servers: `Ctrl+C`
2. Restart: `./start-dev.sh` or `npm run dev:all`
3. Test the app:
   - Homepage: http://localhost:3000
   - Restaurant pages: http://localhost:3000/food/stores/sabor-latino-cantina
   - Voice Concierge: http://localhost:3000/food/concierge-agentserver
   - Check cart functionality

## Troubleshooting

### "Table fc_restaurants does not exist"

The migration hasn't run yet. Go back to Step 5 and run the migration SQL.

### "Permission denied for table..."

You may be using the anon key instead of service_role key. Check your `.env.local`.

### "Connection failed"

1. Check your remote URL is correct (no trailing slash)
2. Verify your service role key is correct
3. Check your network/firewall isn't blocking Supabase
4. Ensure your remote project is active (not paused)

### Images not loading

1. Check Supabase Storage settings (if using Storage for images)
2. Our current setup uses external URLs (Pexels, Unsplash) which should work
3. Verify with: `node scripts/check-images.js`

## Switching Back to Local

To switch back to local development:

```bash
# In .env.local, change back to:
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU

# Restart servers
./start-dev.sh
```

## Best Practices

### For Demo
- Use remote Supabase for stable, shareable demo
- Better performance (Supabase's infrastructure)
- Accessible from anywhere
- No need to keep local Supabase running

### For Development
- Use local Supabase for faster iteration
- No network latency
- Free to experiment and reset
- Easy to export changes when ready

## Scripts Reference

| Script | Purpose |
|--------|---------|
| `./scripts/export-local-database.sh` | Export local DB to SQL file |
| `node scripts/migrate-to-remote.js` | Helper for remote migration |
| `node scripts/test-remote-connection.js` | Verify remote DB is working |
| `node scripts/check-images.js` | Check restaurant hero images |
| `node scripts/update-sabor-image.js` | Update specific restaurant image |

## Security Notes

⚠️ **Never commit these to git:**
- Service role keys (local or remote)
- Database passwords
- `.env.local` file

✅ **Safe to commit:**
- `.env.local.example` (with placeholder values)
- Migration SQL files (no secrets)
- Public anon keys (not sensitive)

## Next Steps

Once your remote database is set up:

1. ✅ Test all features work with remote DB
2. ✅ Update any hardcoded local URLs
3. ✅ Consider setting up Supabase Auth if needed
4. ✅ Set up database backups (Supabase does this automatically)
5. ✅ Monitor usage in Supabase Dashboard

---

**Need help?** Check the Supabase docs: https://supabase.com/docs
