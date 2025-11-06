import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Configuration to disable HMR and stop infinite reload loop in Replit
export default defineConfig({
  plugins: [react()],
  server: {
    hmr: false,  // Disable WebSocket/HMR to prevent infinite reloads in Replit
    host: true,  // Bind to 0.0.0.0 for container environments
    port: 5000,  // Match the existing port configuration
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client/src"),
      "@shared": path.resolve(__dirname, "./shared"),
      "@lib": path.resolve(__dirname, "./client/src/lib"),
      "@assets": path.resolve(__dirname, "./attached_assets"),
    },
  },
  root: path.resolve(__dirname, "client"),
  publicDir: path.resolve(__dirname, "client/public"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: false,
    manifest: true,
    rollupOptions: {
      input: path.resolve(__dirname, "client/index.html"),
    },
  },
});