#!/bin/bash
# Fixed development server startup - prevents Vite reconnection loop

echo "🚛 Starting Fixed TruckFixGo Dev Server..."
echo "================================"
echo "This version fixes the Vite WebSocket/HMR infinite reload bug"
echo ""

# Kill any existing servers
echo "Stopping any existing servers..."
pkill -f "tsx server" 2>/dev/null || true
pkill -f "node dist" 2>/dev/null || true
sleep 2

# Start the fixed dev server with HMR disabled
echo "Starting development server with fix applied..."
echo "================================"
NODE_ENV=development exec tsx server/dev-nohmr.ts