#!/bin/bash
echo "Starting TruckFixGo in production mode..."
pkill -f "tsx server/index.ts" 2>/dev/null
pkill -f "node.*tsx" 2>/dev/null
sleep 1
cd /home/runner/workspace
NODE_ENV=production node dist/index.js