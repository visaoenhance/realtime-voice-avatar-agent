#!/bin/bash

# Food Concierge Development Startup Script
# Starts both Next.js dev server and AgentServer Python backend

set -e  # Exit on error

echo "🚀 Starting Food Concierge Development Environment..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# ============================================
# 🧹 Clean up zombie processes before starting
# ============================================
echo -e "${BLUE}🧹 Cleaning up old processes...${NC}"

# Count existing zombie workers
ZOMBIE_COUNT=$(ps aux | grep "multiprocessing.spawn" | grep -v grep | wc -l | tr -d ' ')
AGENT_COUNT=$(ps aux | grep "food_concierge_agentserver.py" | grep -v grep | wc -l | tr -d ' ')

if [ "$AGENT_COUNT" -gt 0 ] || [ "$ZOMBIE_COUNT" -gt 0 ]; then
    echo -e "${YELLOW}   Found: $AGENT_COUNT agent process(es), $ZOMBIE_COUNT zombie worker(s)${NC}"
    
    # Kill existing agent processes
    if [ "$AGENT_COUNT" -gt 0 ]; then
        pkill -9 -f "food_concierge_agentserver.py" 2>/dev/null || true
        echo -e "${GREEN}   ✓ Killed old agent processes${NC}"
    fi
    
    # Kill zombie multiprocessing workers
    if [ "$ZOMBIE_COUNT" -gt 0 ]; then
        ps aux | grep "multiprocessing.spawn" | grep -v grep | awk '{print $2}' | xargs kill -9 2>/dev/null || true
        echo -e "${GREEN}   ✓ Killed $ZOMBIE_COUNT zombie worker(s)${NC}"
    fi
    
    # Wait for processes to fully terminate and unregister from LiveKit Cloud
    echo -e "${BLUE}   ⏳ Waiting 3 seconds for clean unregistration...${NC}"
    sleep 3
    echo -e "${GREEN}   ✓ Cleanup complete${NC}"
else
    echo -e "${GREEN}   ✓ No old processes found - starting fresh${NC}"
fi

echo ""

# Check if .venv exists
if [ ! -d ".venv" ]; then
    echo -e "${YELLOW}⚠️  Virtual environment not found!${NC}"
    echo "Creating Python virtual environment..."
    python3 -m venv .venv
    source .venv/bin/activate
    pip install -r requirements.txt
else
    source .venv/bin/activate
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  node_modules not found!${NC}"
    echo "Installing npm dependencies..."
    npm install
fi

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Shutting down servers...${NC}"
    
    # Kill Next.js
    pkill -f "next dev" 2>/dev/null || true
    
    # Kill agent process
    pkill -f "food_concierge_agentserver.py" 2>/dev/null || true
    
    # Kill any zombie workers that might have been spawned
    ZOMBIE_COUNT=$(ps aux | grep "multiprocessing.spawn" | grep -v grep | wc -l | tr -d ' ')
    if [ "$ZOMBIE_COUNT" -gt 0 ]; then
        echo -e "${YELLOW}   Cleaning up $ZOMBIE_COUNT worker process(es)...${NC}"
        ps aux | grep "multiprocessing.spawn" | grep -v grep | awk '{print $2}' | xargs kill -9 2>/dev/null || true
    fi
    
    echo -e "${GREEN}✅ Cleanup complete${NC}"
    exit 0
}

# Trap Ctrl+C and call cleanup
trap cleanup INT TERM

# Start Next.js dev server in background
echo -e "${BLUE}📦 Starting Next.js dev server...${NC}"
npm run dev > /tmp/nextjs-dev.log 2>&1 &
NEXT_PID=$!
echo -e "${GREEN}✅ Next.js started (PID: $NEXT_PID)${NC}"
echo "   Logs: tail -f /tmp/nextjs-dev.log"

# Wait a moment for Next.js to start
sleep 3

# Start AgentServer Python backend in background  
echo -e "${BLUE}🤖 Starting AgentServer Python backend...${NC}"
cd agents
python -u food_concierge_agentserver.py dev > /tmp/agentserver.log 2>&1 &
AGENT_PID=$!
cd ..
echo -e "${GREEN}✅ AgentServer started (PID: $AGENT_PID)${NC}"
echo "   Logs: tail -f /tmp/agentserver.log"

# Wait a moment for AgentServer to start
sleep 3

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ All services running!${NC}"
echo ""
echo -e "📱 ${BLUE}Next.js${NC}:     http://localhost:3000"
echo -e "🎙️  ${BLUE}Concierge${NC}:   http://localhost:3000/food/concierge-agentserver"
echo -e "📊 ${BLUE}Logs${NC}:        ${YELLOW}tail -f /tmp/nextjs-dev.log /tmp/agentserver.log${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all servers${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Wait for processes (this keeps the script running)
wait $NEXT_PID $AGENT_PID
