#!/usr/bin/env node
// Production server starter that bypasses the broken Vite dev server

const { spawn } = require('child_process');
const path = require('path');

console.log('Starting TruckFixGo Production Server...');

// Kill any existing processes on port 5000
try {
  require('child_process').execSync('pkill -f "tsx server/index.ts"', { stdio: 'ignore' });
  require('child_process').execSync('pkill -f "node.*tsx"', { stdio: 'ignore' });
} catch (e) {
  // Ignore errors if no processes to kill
}

// Wait for ports to be freed
setTimeout(() => {
  // Start production server
  const prodServer = spawn('node', ['dist/index.js'], {
    cwd: process.cwd(),
    env: { ...process.env, NODE_ENV: 'production' },
    stdio: 'inherit'
  });

  prodServer.on('error', (err) => {
    console.error('Failed to start production server:', err);
    process.exit(1);
  });

  prodServer.on('exit', (code) => {
    if (code !== 0) {
      console.error(`Production server exited with code ${code}`);
    }
    process.exit(code);
  });

  // Handle termination signals
  process.on('SIGINT', () => {
    prodServer.kill('SIGINT');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    prodServer.kill('SIGTERM');
    process.exit(0);
  });
}, 1000);