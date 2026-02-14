#!/bin/bash
# Quick Start Script for LiveKit Native Pipeline
# Run this to get everything set up and running quickly

set -e  # Exit on error

echo "🚀 LiveKit Native Pipeline - Quick Start"
echo "========================================"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Run this script from project root"
    exit 1
fi

# Step 1: Check Supabase
echo "📋 Step 1: Checking Supabase..."
if curl -s http://127.0.0.1:54321 > /dev/null; then
    echo "✅ Supabase is running"
else
    echo "❌ Supabase not running at 127.0.0.1:54321"
    echo "   Run: supabase start"
    exit 1
fi

# Step 2: Check .env.local exists
echo ""
echo "📋 Step 2: Checking environment file..."
if [ ! -f ".env.local" ]; then
    echo "❌ .env.local not found in root directory"
    echo "   This file is required and should contain:"
    echo "   - OPENAI_API_KEY"
    echo "   - SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY"
    echo "   - LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET"
    exit 1
else
    echo "✅ .env.local exists (Python agent will use this)"
fi

# Step 3: Install Python dependencies
echo ""
echo "📋 Step 3: Installing Python dependencies..."
cd agents

if command -v pip &> /dev/null; then
    echo "   Installing packages..."
    pip install -r requirements.txt > /dev/null 2>&1
    echo "✅ Python dependencies installed"
else
    echo "❌ pip not found. Install Python 3.8+ first"
    exit 1
fi

# Step 4: Test database connection
echo ""
echo "📋 Step 4: Testing database connection..."
if python test_database.py > /dev/null 2>&1; then
    echo "✅ Database connection works"
else
    echo "⚠️  Database test had issues (check logs)"
fi

cd ..

# Step 5: Check Node.js dependencies
echo ""
echo "📋 Step 5: Checking Node.js dependencies..."
if [ -d "node_modules" ]; then
    echo "✅ Node modules installed"
else
    echo "   Installing Node modules..."
    npm install > /dev/null 2>&1
    echo "✅ Node modules installed"
fi

# Summary
echo ""
echo "========================================"
echo "✅ Setup Complete!"
echo ""
echo "📝 Next Steps:"
echo ""
echo "1. Start Next.js dev server:"
echo "   $ npm run dev"
echo ""
echo "2. In another terminal, start Python agent:"
echo "   $ cd agents && python food_concierge_native.py dev"
echo ""
echo "3. Visit frontend:"
echo "   http://localhost:3000/food/concierge-native"
echo ""
echo "4. Click 'Start Voice Chat' and allow microphone"
echo ""
echo "📚 Documentation:"
echo "   - docs/LIVEKIT_NATIVE_IMPLEMENTATION.md (complete guide)"
echo "   - agents/README.md (Python agent docs)"
echo ""
