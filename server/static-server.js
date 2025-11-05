const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Serve static files from the production build
const distPath = path.resolve(__dirname, '../dist/public');
app.use(express.static(distPath));

// Fallback to index.html for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.resolve(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Static server running on http://localhost:${PORT}`);
  console.log(`Serving files from ${distPath}`);
});