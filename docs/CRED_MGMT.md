# Credentials & Environment Management

## Current Setup (February 2026)

### Supabase Configuration
**Active:** Local Docker instance
- Requires Docker Desktop running
- URL: `http://localhost:54321`
- Service role key from local Supabase CLI

**Cloud Project Available:**
- URL: `https://ceeklugdyurvxonnhykt.supabase.co`
- Dashboard: https://supabase.com/dashboard/project/ceeklugdyurvxonnhykt
- Not currently configured in `.env.local`

### Environment Variables
Located in `.env.local` (not committed to git):

```bash
# OpenAI for voice/chat
OPENAI_API_KEY=sk-...

# LiveKit for voice agents
LIVEKIT_API_KEY=...
LIVEKIT_API_SECRET=...
LIVEKIT_URL=wss://...

# Supabase (local Docker)
SUPABASE_URL=http://localhost:54321
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Demo user profile
DEMO_PROFILE_ID=00000000-0000-0000-0000-0000000000fc
```

## Switching to Cloud Supabase

When ready to use cloud (for demos, production, or when Docker unavailable):

1. Get credentials from [Supabase Dashboard](https://supabase.com/dashboard/project/ceeklugdyurvxonnhykt/settings/api)
2. Update `.env.local`:
   ```bash
   SUPABASE_URL=https://ceeklugdyurvxonnhykt.supabase.co
   NEXT_PUBLIC_SUPABASE_URL=https://ceeklugdyurvxonnhykt.supabase.co
   # Update keys from dashboard
   ```
3. Restart Next.js dev server: `npm run dev`

## Future Enhancement: Automatic Fallback

### Implementation Idea
Modify `lib/supabaseServer.ts` to try cloud first, fall back to local:

```typescript
// Priority: Cloud → Local
const CLOUD_URL = process.env.SUPABASE_CLOUD_URL;
const CLOUD_KEY = process.env.SUPABASE_CLOUD_SERVICE_ROLE_KEY;
const LOCAL_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
const LOCAL_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseUrl = CLOUD_URL || LOCAL_URL;
const supabaseKey = CLOUD_KEY || LOCAL_KEY;

console.log(`[Supabase] Using: ${supabaseUrl?.includes('supabase.co') ? 'CLOUD' : 'LOCAL'}`);
```

### Limitations
- Only handles missing env vars, not connection failures
- True connection-based fallback requires health checks (adds latency)
- Need to keep schemas synced between local/cloud

### When to Implement
- If frequently switching between environments
- If multiple developers with different setups
- If deploying to Vercel (would use cloud by default)

## Troubleshooting

### "Orders request failed with status 500"
**Cause:** Docker not running (local Supabase unavailable)

**Fix:**
```bash
# Start Docker Desktop (GUI) or
open -a Docker

# Verify Supabase containers running
docker ps | grep supabase

# If needed, restart Supabase
cd /path/to/project
supabase start
```

### Schema Sync Between Local and Cloud
Current state: Local has all tables (`fc_orders`, `fc_cart`, etc.)

To push local schema to cloud:
```bash
supabase db push --linked  # If project linked
# OR export/import manually
```

To pull cloud schema to local:
```bash
supabase db pull
```

## YouTube Demo Recommendations

For video recording:
- **Option A:** Use local Docker (current setup)
  - Pros: Free, predictable
  - Cons: Must show "Docker must be running" disclaimer
  
- **Option B:** Switch to cloud before recording
  - Pros: More production-like, no Docker dependency
  - Cons: Uses quota, need to sync data first

**Recommendation:** Stay with local for now, mention in video that "this runs on local Supabase via Docker, but can easily point to cloud for production."

## Security Notes

- `.env.local` is in `.gitignore` (credentials never committed)
- Service role keys have full database access (never expose to client)
- `NEXT_PUBLIC_*` vars are exposed to browser (use anon key only)
- Cloud project credentials available in Supabase dashboard (team access required)

---

**Last Updated:** February 14, 2026
**Current Mode:** Local Docker Supabase
