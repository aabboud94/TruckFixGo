#!/bin/bash

echo "Building the application..."
npm run build

echo "Starting production server..."
NODE_ENV=production node dist/index.js