#!/bin/bash
# Start TruckFixGo with HMR disabled (fixes Replit WebSocket issues)

echo "🚛 Starting TruckFixGo Dev Server (HMR Disabled)..."
echo "================================"
echo "This bypasses the Replit WebSocket/HMR infinite reload bug"
echo ""

# Kill any existing servers
echo "Stopping any existing servers..."
pkill -f "tsx server/index.ts" 2>/dev/null || true
pkill -f "tsx server/dev-nohmr.ts" 2>/dev/null || true
pkill -f "node dist/index.js" 2>/dev/null || true
sleep 2

# Start the dev server with HMR disabled
echo "Starting development server without HMR..."
echo "================================"
NODE_ENV=development tsx server/dev-nohmr.ts