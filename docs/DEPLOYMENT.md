# Deployment Guide

Production deployment guide for the Food Court Voice Concierge application.

## Table of Contents

1. [Deployment Overview](#deployment-overview)
2. [Environment Strategy](#environment-strategy)
3. [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
4. [Backend Deployment (Python Agent)](#backend-deployment-python-agent)
5. [Database Migration](#database-migration)
6. [Security Checklist](#security-checklist)
7. [Monitoring](#monitoring)

## Deployment Overview

The application consists of three main components:

1. **Frontend (Next.js)** - Static/SSR pages, API routes, WebRTC client
2. **Python AgentServer** - Long-running process for voice agent
3. **Database (Supabase)** - PostgreSQL for data persistence

### Architecture

```
            Internet
               │
    ┌──────────┴──────────┐
    │                     │
 Frontend            AgentServer
 (Vercel)         (Cloud VM/Docker)
    │                     │
    └──────────┬──────────┘
               │
          Supabase
        (Cloud DB)
```

## Environment Strategy

### Development vs Production

| Component | Development | Production |
|-----------|------------|------------|
| Frontend | `localhost:3000` | `your-app.vercel.app` |
| AgentServer | `localhost` (manual) | Cloud VM (systemd/Docker) |
| Supabase | Local Docker | Supabase Cloud |
| LiveKit | LiveKit Cloud | LiveKit Cloud |
| OpenAI | OpenAI API | OpenAI API |

### Environment Variables

Create separate environment files:

**`.env.local`** (development)
```bash
LIVEKIT_URL=wss://your-dev-project.livekit.cloud
LIVEKIT_API_KEY=...
LIVEKIT_API_SECRET=...
OPENAI_API_KEY=sk-proj-...
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

**`.env.production`** (production)
```bash
LIVEKIT_URL=wss://your-prod-project.livekit.cloud
LIVEKIT_API_KEY=...
LIVEKIT_API_SECRET=...
OPENAI_API_KEY=sk-proj-...
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

**⚠️ Never commit these files to git!**

## Frontend Deployment (Vercel)

### Option 1: Vercel Dashboard (Recommended)

1. **Connect Repository**
   ```
   - Go to https://vercel.com
   - Click "Add New" → "Project"
   - Import your Git repository
   - Vercel auto-detects Next.js
   ```

2. **Configure Environment Variables**
   ```
   Project Settings → Environment Variables
   
   Add each variable from .env.production:
   - LIVEKIT_URL
   - LIVEKIT_API_KEY
   - LIVEKIT_API_SECRET
   - OPENAI_API_KEY
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY
   - DEMO_PROFILE_ID
   ```

3. **Deploy**
   ```
   - Click "Deploy"  
   - Wait for build to complete (~2-3 min)
   - Vercel provides URL: https://your-app.vercel.app
   ```

4. **Verify**
   ```bash
   # Test token endpoint
   curl https://your-app.vercel.app/api/livekit-agentserver/token
   
   # Visit frontend
   open https://your-app.vercel.app/food/concierge-agentserver
   ```

### Option 2: Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod

# Set environment variables
vercel env add LIVEKIT_URL production
vercel env add LIVEKIT_API_KEY production
# ... add all other variables
```

### Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your domain: `voice.yourdomain.com`
3. Add DNS record (Vercel provides instructions)
4. Wait for SSL certificate (automatic)

## Backend Deployment (Python Agent)

The Python AgentServer must run as a long-lived process with internet connectivity.

### Option 1: Cloud VM (DigitalOcean, AWS, GCP)

#### 1. Provision VM

```bash
# Recommended specs:
- 1 vCPU, 2GB RAM (small workload)
- 2 vCPU, 4GB RAM (production)
- Ubuntu 22.04 LTS
- Open ports: 22 (SSH), 80, 443
```

#### 2. SSH and Install Dependencies

```bash
ssh user@your-vm-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Python
sudo apt install python3.10 python3-pip python3-venv -y

# Install git
sudo apt install git -y
```

#### 3. Clone Repository

```bash
cd /opt
sudo git clone https://github.com/your-org/food-court-voice-concierge.git
cd food-court-voice-concierge
sudo chown -R $USER:$USER .
```

#### 4. Setup Python Environment

```bash
cd agents
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

#### 5. Create Environment File

```bash
# Create .env.local in /opt/food-court-voice-concierge/
nano .env.local

# Paste production credentials
# Save and exit (Ctrl+X, Y, Enter)
```

#### 6. Create Systemd Service

```bash
sudo nano /etc/systemd/system/food-agent.service
```

Paste:
```ini
[Unit]
Description=Food Court Voice Agent
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/opt/food-court-voice-concierge/agents
Environment="PATH=/opt/food-court-voice-concierge/agents/venv/bin"
ExecStart=/opt/food-court-voice-concierge/agents/venv/bin/python food_concierge_agentserver.py dev
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable food-agent
sudo systemctl start food-agent
sudo systemctl status food-agent
```

#### 7. Check Logs

```bash
sudo journalctl -u food-agent -f
```

### Option 2: Docker Container

#### 1. Create Dockerfile

```dockerfile
# agents/Dockerfile
FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["python", "food_concierge_agentserver.py", "dev"]
```

#### 2. Build and Run

```bash
cd agents

# Build image
docker build -t food-agent .

# Run container
docker run -d \
  --name food-agent \
  --restart unless-stopped \
  --env-file ../.env.local \
  -p 8080:8080 \
  food-agent

# View logs
docker logs -f food-agent
```

#### 3. Docker Compose (Optional)

```yaml
# docker-compose.yml
version: '3.8'

services:
  agent:
    build: ./agents
    env_file: .env.local
    restart: unless-stopped
    ports:
      - "8080:8080"
```

Run:
```bash
docker-compose up -d
```

## Database Migration

### Production Supabase Setup

#### 1. Create Production Database

1. Go to https://supabase.com
2. Create new project (choose production region)
3. Save credentials

#### 2. Run Migrations

```bash
# Option A: SQL Editor (Recommended)
1. Open Supabase Dashboard → SQL Editor
2. Run supabase/migrations/001_initial_schema.sql
3. Run supabase/seed.sql

# Option B: Supabase CLI
supabase link --project-ref your-project-ref
supabase db push
```

#### 3. Verify Schema

```bash
# Connect to production database
psql "postgresql://postgres:[password]@db.your-project.supabase.co:5432/postgres"

# List tables
\dt

# Check data
SELECT COUNT(*) FROM fc_restaurants;
SELECT COUNT(*) FROM fc_menu_items;
```

### Data Backup Strategy

```bash
# Automated daily backups (Supabase provides this)
# Settings → Database → Backups

# Manual backup
pg_dump "postgresql://postgres:[password]@db.your-project.supabase.co:5432/postgres" > backup.sql

# Restore backup
psql "postgresql://postgres:[password]@db.your-project.supabase.co:5432/postgres" < backup.sql
```

## Security Checklist

### Before Going Live

- [ ] All API keys in environment variables (not code)
- [ ] `.env.local` added to `.gitignore`
- [ ] Supabase Row Level Security (RLS) enabled
- [ ] OpenAI API key has spending limits set
- [ ] LiveKit room creation requires authentication
- [ ] HTTPS enabled (Vercel provides this automatically)
- [ ] CORS configured correctly for production domain
- [ ] Database backups enabled
- [ ] Error monitoring set up
- [ ] Rate limiting on API routes

### Supabase Row Level Security (RLS)

Enable RLS policies for production:

```sql
-- Enable RLS on tables
ALTER TABLE fc_restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE fc_menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE fc_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE fc_orders ENABLE ROW LEVEL SECURITY;

-- Create policies (examples)
CREATE POLICY "Public read for restaurants"
  ON fc_restaurants FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage own carts"
  ON fc_carts FOR ALL
  USING (user_id = auth.uid());
```

### API Rate Limiting

Add rate limiting to prevent abuse:

```typescript
// middleware.ts
import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
})

export async function middleware(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const { success } = await ratelimit.limit(ip)
  
  if (!success) {
    return new Response('Too many requests', { status: 429 })
  }
}
```

## Monitoring

### Application Monitoring

#### Vercel Analytics
```bash
# Automatically enabled for Vercel deployments
# View at: Vercel Dashboard → Your Project → Analytics
```

#### Sentry (Error Tracking)

```bash
npm install @sentry/nextjs

# next.config.js
const { withSentryConfig } = require('@sentry/nextjs')

module.exports = withSentryConfig(
  nextConfig,
  { silent: true },
  { hideSourceMaps: true }
)
```

#### AgentServer Logs

```bash
# Systemd logs
sudo journalctl -u food-agent -f --since "1 hour ago"

# Docker logs
docker logs -f food-agent --tail 100
```

### Database Monitoring

Supabase Dashboard provides:
- Active connections
- Query performance
- Table sizes
- Slow queries
- API requests

### Health Checks

Create health endpoints:

```typescript
// app/api/health/route.ts
export async function GET() {
  const checks = {
    database: await checkDatabase(),
    livekit: await checkLiveKit(),
    openai: await checkOpenAI(),
  }
  
  const healthy = Object.values(checks).every(c => c === true)
  
  return Response.json(
    { status: healthy ? 'healthy' : 'degraded', checks },
    { status: healthy ? 200 : 503 }
  )
}
```

Monitor with:
```bash
# Uptime monitoring service (UptimeRobot, Pingdom)
curl https://your-app.vercel.app/api/health
```

## Scaling Considerations

### Horizontal Scaling

**Frontend (Vercel)**
- Automatic scaling (Vercel handles this)
- Edge functions for low latency worldwide

**AgentServer**
- Run multiple instances behind load balancer
- Each instance handles N concurrent voice sessions
- LiveKit automatically routes to available agents

**Database (Supabase)**
- Vertical scaling (upgrade plan)
- Read replicas for high read traffic
- Connection pooling (PgBouncer included)

### Performance Optimization

- Use CDN for static assets (Vercel provides this)
- Cache restaurant/menu data (Redis)
- Optimize database queries (indexes)
- Monitor OpenAI API latency
- Use connection pooling for database

## Rollback Strategy

### Frontend Rollback

```bash
# Vercel keeps all deployments
# Dashboard → Deployments → Select previous → Promote to Production
```

### Agent Rollback

```bash
# Git rollback
cd /opt/food-court-voice-concierge
git log --oneline
git reset --hard <previous-commit>

# Restart service
sudo systemctl restart food-agent
```

### Database Rollback

```bash
# Restore from backup
psql "postgresql://..." < backup_YYYY-MM-DD.sql
```

## Cost Estimation

Typical production costs (monthly):

| Service | Free Tier | Small Scale | Medium Scale |
|---------|-----------|-------------|--------------|
| Vercel | $0 (hobby) | $20 (Pro) | $20 |
| DigitalOcean VM | - | $12 (2GB) | $24 (4GB) |
| Supabase | $0 (<500MB, <2GB bandwidth) | $25 (Pro) | $25-100 |
| LiveKit | $0 (<5K mins) | $99 | $99-500 |
| OpenAI API | Pay-per-use | $50-200 | $200-1000 |
| **Total** | **~$50** | **~$200-400** | **~$400-1600** |

## Support

- **Vercel**: https://vercel.com/docs
- **DigitalOcean**: https://docs.digitalocean.com
- **Supabase**: https://supabase.com/docs
- **LiveKit**: https://docs.livekit.io
- **Issues**: GitHub Issues on this repository
