#!/bin/bash
# Start TruckFixGo in production mode (bypasses broken Vite HMR)

echo "🚛 Starting TruckFixGo Production Server..."
echo "================================"
echo ""

# Kill any existing servers
echo "Stopping any existing servers..."
pkill -f "tsx server/index.ts" 2>/dev/null || true
pkill -f "node dist/index.js" 2>/dev/null || true
pkill -f "node server/prod-server.js" 2>/dev/null || true
sleep 2

# Build the application
echo "Building production bundle..."
npm run build

# Start in production mode
echo ""
echo "Starting production server on port 5000..."
echo "================================"
export NODE_ENV=production
export PORT=5000
node dist/index.js