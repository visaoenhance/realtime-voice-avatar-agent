# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it privately to help us address it responsibly.

### How to Report

1. **Do NOT open a public issue** for security vulnerabilities
2. Email security details to: **info@visaoenhance.com**
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### What to Expect

- **Acknowledgment**: Within 48 hours
- **Assessment**: Within 7 days
- **Fix timeline**: Depends on severity (critical issues prioritized)
- **Credit**: We'll acknowledge your contribution (unless you prefer anonymity)

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Security Best Practices

### For Users

1. **Never commit `.env.local`** - This file contains your real API keys and credentials
2. **Rotate keys immediately** if they're exposed in logs, screenshots, or public channels
3. **Use environment-specific keys** - Separate keys for development vs. production
4. **Least-privilege access** - Use Supabase service role key only server-side
5. **Review `.gitignore`** - Ensure sensitive files are excluded before pushing
6. **LemonSlice API keys** - Treat as sensitive; monitor usage at https://lemonslice.com/dashboard

### For Contributors

1. **No hardcoded secrets** - Use environment variables for all credentials
2. **Validate user input** - Sanitize data before database queries
3. **Debug endpoints** - Must check `NODE_ENV === 'production'` and return 404
4. **Dependencies** - Keep `npm audit` clean, update regularly
5. **Code review** - All PRs reviewed for security concerns

## Known Security Considerations

### Demo Mode

This project uses a shared `DEMO_PROFILE_ID` for demonstrations. This is intentional for the demo, but **NOT production-ready**:

- All users share the same cart and orders
- No authentication or authorization
- Suitable for demos and learning only

**For production use:**
- Implement proper authentication (e.g., [Supabase Auth](https://supabase.com/docs/guides/auth))
- Use user-specific profile IDs
- Add row-level security policies in Supabase

### Debug Endpoints

Debug endpoints (`/api/debug/*`) are protected:
- Return 404 when `NODE_ENV=production`
- Should only be enabled in development environments
- Do not expose sensitive data in logs

### LemonSlice Voice Avatar (Optional Feature)

If you enable the optional LemonSlice voice avatar:

**API Key Security:**
- Store `LEMONSLICE_API_KEY` in `.env.local` (never commit to version control)
- API keys are account-specific and billable per minute of use
- Rotate immediately if exposed in logs, screenshots, or public channels
- Monitor usage at https://lemonslice.com/dashboard to detect unauthorized use

**Image Privacy:**
- Avatar image URLs must be publicly accessible (required by LemonSlice)
- Consider privacy if using images of real people
- Use generic/AI-generated avatars for public demos
- Custom images from your domain are recommended over third-party URLs

**Agent IDs:**
- Pre-built agent IDs from https://lemonslice.com/agents are tied to your API key
- Agent IDs themselves are not sensitive
- Only agents you create in your account will work with your API key

**Cost Management:**
- Avatar sessions bill per minute of usage
- Set `idle_timeout` parameter to auto-disconnect (default: 60 seconds)
- Use the frontend toggle to hide avatar when not needed (saves costs during demos)
- Monitor and set usage alerts in LemonSlice dashboard

**Session Management:**
- Avatar sessions auto-terminate after idle timeout or max duration (30 min)
- Always call `ctx.room.disconnect()` in agent shutdown to prevent orphaned sessions

---

## Production Hardening Checklist

This section covers essential security measures for public deployment.

### 1. Environment Variables / Secrets

**Never commit real credentials:**
- `.env.local` should NEVER be committed to version control
- Use `.env.example` as a template with placeholder values only
- Rotate all keys immediately if they were exposed in:
  - Git history
  - Screenshots or screen recordings
  - Log files or terminal outputs
  - Slack/Discord messages
  - Public repositories

**Verification commands:**
```bash
# Check if .env.local is properly ignored
git check-ignore .env.local  # Should output: .env.local

# Scan git history for .env.local
git log --all --full-history -- .env.local  # Should be empty

# Search tracked files for secrets
git grep -nE "(sk-[A-Za-z0-9]{20,}|service_role|LIVEKIT_API_SECRET)"
# Should only find placeholder values in .env.example and docs
```

**Key rotation resources:**
- OpenAI: https://platform.openai.com/api-keys
- LiveKit: https://cloud.livekit.io/ → Project Settings → Keys
- LemonSlice: https://lemonslice.com/dashboard → API Keys
- Supabase: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api

### 2. Rate Limiting

**Current State:** ⚠️ No rate limiting implemented (demo only)

**Risk:** Public API endpoints can be abused:
- `/api/livekit-agentserver/token` - Unlimited token generation → LiveKit costs
- `/api/food/orders` - Spam order creation
- `/api/food/cart` - Cart manipulation

**Recommended Solution - Option A: Upstash Rate Limit**

Install:
```bash
npm install @upstash/ratelimit @upstash/redis
```

Add to `/app/api/livekit-agentserver/token/route.ts`:
```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Initialize rate limiter
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "60 s"), // 10 requests per minute
  analytics: true,
});

export async function GET(req: Request) {
  // Rate limit by IP
  const ip = req.headers.get("x-forwarded-for") ?? "anonymous";
  const { success, limit, remaining, reset } = await ratelimit.limit(ip);
  
  if (!success) {
    return new Response("Too many requests. Please try again later.", {
      status: 429,
      headers: {
        "X-RateLimit-Limit": limit.toString(),
        "X-RateLimit-Remaining": remaining.toString(),
        "X-RateLimit-Reset": reset.toString(),
      },
    });
  }
  
  // ... existing token generation code
}
```

Environment variables needed:
```bash
# .env.local
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
```

**Recommended Solution - Option B: Vercel Rate Limiting**

If deploying to Vercel, use native rate limiting:
```typescript
import { NextRequest } from "next/server";
import { ratelimit } from "@vercel/edge-rate-limit";

export async function GET(req: NextRequest) {
  const { success } = await ratelimit(req, {
    limit: 10,
    duration: "60s",
  });
  
  if (!success) {
    return new Response("Rate limit exceeded", { status: 429 });
  }
  
  // ... existing code
}
```

**Recommended Solution - Option C: Nginx/Cloudflare**

Use infrastructure-level rate limiting:
- **Cloudflare**: Enable rate limiting rules (free tier: 1 rule)
- **Nginx**: Use `limit_req_zone` and `limit_req` directives
- **AWS API Gateway**: Configure throttling limits

### 3. CORS Configuration

**Current State:** ⚠️ Default Next.js CORS (no restrictions)

**Risk:** APIs can be called from any website, enabling:
- Credential theft via malicious sites
- API abuse from unauthorized domains
- CSRF attacks

**Recommended Solution:**

Add to `/next.config.js`:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  async headers() {
    // Get allowed origins from environment
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',')
      || ['http://localhost:3000'];
    
    return [
      {
        // Apply CORS headers to all API routes
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true',
          },
          {
            key: 'Access-Control-Allow-Origin',
            // In production, use specific domains
            value: process.env.NODE_ENV === 'production'
              ? allowedOrigins[0]
              : '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,POST,PUT,DELETE,OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'X-Requested-With,Content-Type,Authorization',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

Add to `.env.example`:
```bash
# CORS Configuration (comma-separated domains for production)
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

**For dynamic origin validation** (multiple allowed domains):
```typescript
// app/api/middleware.ts (example)
export function corsMiddleware(req: Request) {
  const origin = req.headers.get('origin');
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
  
  const headers = new Headers();
  
  if (origin && allowedOrigins.includes(origin)) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Access-Control-Allow-Credentials', 'true');
  }
  
  return headers;
}
```

### 4. Authentication & Authorization

**Current State:** ⚠️ No authentication (shared `DEMO_PROFILE_ID`)

**Required for Production:**

**Option A: Supabase Auth** (Recommended)
```typescript
// lib/supabaseClient.ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export const supabase = createClientComponentClient();

// Protect API routes
// app/api/food/cart/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  
  // Verify authentication
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  const profileId = session.user.id; // Use real user ID
  // ... rest of logic
}
```

**Option B: NextAuth.js**
```bash
npm install next-auth
```

See: https://next-auth.js.org/getting-started/example

### 5. Dependency Security

**Regular Audits:**
```bash
# Check for vulnerabilities
npm audit
npm audit fix  # Auto-fix where possible

# Python dependencies
cd agents
pip check
pip install --upgrade -r requirements.txt
```

**Automated Monitoring:**
- Enable GitHub Dependabot alerts
- Use Snyk or similar security scanning
- Set up automated dependency updates

### 6. Environment-Specific Configuration

**Development vs Production:**
```bash
# .env.local (development)
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
DEBUG_ENABLED=true

# .env.production (production - Vercel/hosting)
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://yourdomain.com
DEBUG_ENABLED=false
```

**Vercel Environment Variables:**
```bash
# Set production secrets via Vercel CLI or dashboard
vercel env add OPENAI_API_KEY
vercel env add LIVEKIT_API_SECRET
vercel env add SUPABASE_SERVICE_ROLE_KEY
```

---

## Quick Security Checklist

Before deploying to production:

- [ ] `.env.local` is git-ignored and not committed
- [ ] All API keys rotated (not using dev/demo keys)
- [ ] Rate limiting enabled on public endpoints
- [ ] CORS configured with domain allowlist
- [ ] Authentication implemented (no shared `DEMO_PROFILE_ID`)
- [ ] Debug endpoints return 404 in production
- [ ] `npm audit` shows no critical vulnerabilities
- [ ] Environment variables set in hosting platform (Vercel/AWS/etc)
- [ ] Logging does not expose secrets or tokens
- [ ] Supabase RLS policies enabled for all tables
- [ ] SSL/TLS enforced (HTTPS only)
- [ ] Error messages don't leak system information

---

## Additional Resources

- **Next.js Security**: https://nextjs.org/docs/app/building-your-application/deploying/production-checklist
- **OWASP Top 10**: https://owasp.org/www-project-top-ten/
- **Supabase Security Best Practices**: https://supabase.com/docs/guides/platform/going-into-prod
- **LiveKit Security**: https://docs.livekit.io/realtime/guides/security/
- Frontend toggle hides avatar visually but maintains session (by design)

## Security Updates

We take security seriously. Critical security updates will be:
- Released as soon as possible
- Documented in release notes
- Announced via GitHub releases

## Questions?

For general security questions (not vulnerability reports), open a GitHub Discussion.

For vulnerability reports, email: **info@visaoenhance.com**
