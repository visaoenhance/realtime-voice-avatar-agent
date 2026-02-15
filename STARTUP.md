# Development Startup Guide

## Quick Start

Start both Next.js and AgentServer with one command:

```bash
npm run dev:all
```

Or directly:

```bash
./start-dev.sh
```

This will start:
- 📦 Next.js dev server on http://localhost:3000
- 🤖 AgentServer Python backend

Press `Ctrl+C` to stop all servers.

## View Logs

```bash
# Next.js logs
tail -f /tmp/nextjs-dev.log

# AgentServer logs
tail -f /tmp/agentserver.log

# Both together
tail -f /tmp/nextjs-dev.log /tmp/agentserver.log
```

## Manual Startup (if needed)

### Terminal 1: Next.js
```bash
npm run dev
```

### Terminal 2: AgentServer
```bash
cd agents
source ../.venv/bin/activate
python food_concierge_agentserver.py dev
```

## What's New

### Cart Count Updates
- Cart icon in header now updates automatically when items are added
- No need to refresh or open cart modal to see count

### Personalized Greeting
- Agent greets with: "Hello, Emilio - what are you in the mood for today?"
- Concise and natural conversation flow
