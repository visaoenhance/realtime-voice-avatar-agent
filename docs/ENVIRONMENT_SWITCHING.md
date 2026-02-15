# Supabase Environment Management

## Overview

This project supports **dual Supabase environments** for flexible development and production workflows:

- **Local**: Docker-based Supabase (`127.0.0.1:54321`) for fast development, offline work, and schema experimentation
- **Remote**: Production Supabase Cloud (`ceeklugdyurvxonnhykt.supabase.co`) for demos, external access, and team collaboration

## Quick Start

### Switch Environments

```bash
# Switch to local (Docker)
./scripts/switch-env.sh local

# Switch to remote (Supabase Cloud)
./scripts/switch-env.sh remote

# Test active environment
node scripts/test-active-env.js
```

After switching, restart your dev server for changes to take effect.

## Configuration

### .env.local Structure

```bash
# Environment selector (determines which credentials to use)
SUPABASE_ENV=local

# Local Supabase (Docker)
LOCAL_SUPABASE_URL=http://127.0.0.1:54321
LOCAL_SUPABASE_ANON_KEY=eyJh...
LOCAL_SUPABASE_SERVICE_ROLE_KEY=eyJh...

# Remote Supabase (Production)
REMOTE_SUPABASE_URL=https://ceeklugdyurvxonnhykt.supabase.co
REMOTE_SUPABASE_ANON_KEY=eyJh...
REMOTE_SUPABASE_SERVICE_ROLE_KEY=eyJh...
```

### How It Works

1. **Environment Detection**: `lib/supabaseConfig.ts` reads `SUPABASE_ENV` from environment variables
2. **Credential Selection**: Based on `SUPABASE_ENV`, selects either `LOCAL_*` or `REMOTE_*` credentials
3. **Client Creation**: `lib/supabaseServer.ts` imports the config and creates the Supabase client with selected credentials
4. **Automatic Logging**: Server logs which environment is active on startup: `[supabase] Using local environment: http://127.0.0.1:54321`

## Database State

Both environments are currently **fully synced**:

| Environment | Restaurants | Menu Sections | Menu Items |
|-------------|-------------|---------------|------------|
| **Local**   | 7           | 20            | 42         |
| **Remote**  | 7           | 20            | 42         |

### Restaurants in Both Environments

✅ Bombay Spice House (`bombay-spice-house`)  
✅ Brick Oven Slice (`brick-oven-slice`)  
✅ Green Garden Bowls (`green-garden-bowls`)  
✅ Harvest & Hearth Kitchen (`harvest-hearth-kitchen`)  
✅ Island Breeze Caribbean (`island-breeze-caribbean`)  
✅ Noodle Express (`noodle-express`)  
✅ Sabor Latino Cantina (`sabor-latino-cantina`)

## Migration Scripts

### Exporting from Local

```bash
# Export specific restaurant
node scripts/export-bombay-spice.js

# Generate menu migration for remote
node scripts/generate-remote-menu-migration.js

# Audit what's in remote vs local
node scripts/audit-remote.js
```

### Importing to Remote

```bash
# Import via Supabase SQL Editor or CLI
supabase db reset --linked
psql -h ceeklug... -U postgres -d postgres -f supabase/exports/bombay_spice_house_fixed.sql
```

### Schema Comparison

```bash
# Check schema differences
node scripts/check-remote-schema.js
node scripts/check-menu-schema.js

# Compare restaurant IDs
node scripts/compare-restaurant-ids.js
```

## Use Cases

### Local Environment (Development)

✅ **When to use**:
- Daily development and feature testing
- Schema changes and migrations
- Offline work (no internet required)
- Fast iteration (no network latency)
- Experimenting with seed data

❌ **Limitations**:
- Not accessible outside your machine
- Requires Docker to be running
- Data doesn't persist if you reset containers

**Start local Supabase**:
```bash
supabase start
```

### Remote Environment (Production)

✅ **When to use**:
- Demos and presentations
- External access (team members, stakeholders)
- Production deployments
- Testing with persistent data
- Backup when local fails

❌ **Limitations**:
- Requires internet connection
- Slightly higher latency
- Changes affect live data

**Link remote project**:
```bash
supabase link --project-ref ceeklugdyurvxonnhykt
```

## Disaster Recovery

The dual environment setup provides instant disaster recovery:

1. **Remote outage** (like the us-east-2 incident that triggered this setup):
   ```bash
   ./scripts/switch-env.sh local
   # Restart dev server - now using local Docker
   ```

2. **Local issues** (Docker problems, machine crash):
   ```bash
   ./scripts/switch-env.sh remote
   # Restart dev server - now using remote Supabase
   ```

3. **Keep both synced**: After making changes in one environment, export and import to the other

## Testing

### Test Current Environment

```bash
# Show which environment is active
node scripts/test-env-config.js

# Connect and query active database
node scripts/test-active-env.js
```

### Expected Output

```
🔍 Testing LOCAL environment
🌐 URL: http://127.0.0.1:54321

✅ Restaurants: 7
   - Bombay Spice House (bombay-spice-house)
   - Brick Oven Slice (brick-oven-slice)
   ...

✅ Menu Sections: 20
✅ Menu Items: 42

🎉 Connection to local successful!
```

## Implementation Details

### Files Created/Modified

1. **lib/supabaseConfig.ts** (NEW)
   - Reads `SUPABASE_ENV` and exports appropriate credentials
   - Logs active environment on server startup

2. **lib/supabaseServer.ts** (MODIFIED)
   - Now imports from `supabaseConfig.ts` instead of reading env vars directly
   - Automatic environment detection

3. **scripts/switch-env.sh** (NEW)
   - Shell script to update `SUPABASE_ENV` in `.env.local`
   - Shows confirmation and next steps

4. **scripts/test-env-config.js** (NEW)
   - Displays current environment and credentials (truncated)

5. **scripts/test-active-env.js** (NEW)
   - Connects to active environment and queries database
   - Shows restaurant count and names

6. **scripts/supabase-config.mjs** (NEW)
   - Shared config helper for Node.js scripts
   - Can be imported by other scripts for consistent environment handling

7. **.env.local** (MODIFIED)
   - Added `SUPABASE_ENV=local` at top
   - Reorganized with clear local/remote sections

## Best Practices

### Development Workflow

1. **Start with local** for day-to-day work:
   ```bash
   SUPABASE_ENV=local  # in .env.local
   npm run dev
   ```

2. **Test changes locally first** before pushing to remote

3. **Switch to remote for demos**:
   ```bash
   ./scripts/switch-env.sh remote
   npm run dev
   ```

4. **Keep both synced** using export/import scripts

### Schema Changes

1. Make changes in **local** first
2. Test thoroughly
3. Export schema: `supabase db dump -f supabase/migrations/new_migration.sql`
4. Apply to remote: `supabase db push --linked`

### Data Changes

1. Add data in **local** first
2. Export: `node scripts/export-data.js`
3. Import to remote: `psql -h ... -f supabase/exports/data.sql`
4. Verify with: `node scripts/audit-remote.js`

## Troubleshooting

### "Connection refused" on local

```bash
# Check Docker is running
docker ps | grep supabase

# Restart Supabase
supabase stop
supabase start
```

### "Invalid API key" on remote

```bash
# Verify credentials in .env.local
grep REMOTE_ .env.local

# Test manually
node scripts/test-active-env.js
```

### Wrong environment being used

```bash
# Check SUPABASE_ENV value
grep SUPABASE_ENV .env.local

# Force switch
./scripts/switch-env.sh local  # or remote

# Restart dev server
```

### Data out of sync

```bash
# Check both environments
./scripts/switch-env.sh local && node scripts/test-active-env.js
./scripts/switch-env.sh remote && node scripts/test-active-env.js

# Export from source
node scripts/generate-remote-menu-migration.js

# Import to target
psql -h ... -f supabase/exports/remote_menu_*.sql
```

## Migration History

This dual environment setup was created after:

1. **us-east-2 outage** forced migration from remote to local
2. User made extensive changes locally (added Bombay Spice House, menu items, etc.)
3. Remote came back online, but local had newer data
4. Needed to sync remote with local changes
5. Decided to keep both environments for flexibility

See `SUPABASE_MIGRATION_PLAN.md` for detailed migration steps.

## Future Enhancements

- [ ] Automated sync script (`scripts/sync-environments.sh`)
- [ ] Pre-commit hook to warn if environments diverge
- [ ] GitHub Actions workflow to sync on push
- [ ] Environment-specific seed data for testing
- [ ] Migration rollback support

---

**Questions?** Check existing scripts in `scripts/` directory or ask the team.
