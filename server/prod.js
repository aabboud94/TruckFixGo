const express = require('express');
const path = require('path');
const { registerRoutes } = require('./routes');

const app = express();
const PORT = 5000;

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false }));

// API routes
registerRoutes(app);

// Serve static files from the production build
const distPath = path.resolve(__dirname, '../dist/public');
app.use(express.static(distPath));

// Fallback to index.html for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.resolve(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Production server running on http://localhost:${PORT}`);
  console.log(`Frontend available at http://localhost:${PORT}`);
});