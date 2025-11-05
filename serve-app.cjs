const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 5000;

// Import backend modules using require
const { setupReminders } = require('./server/reminder-service');
const { setupBillingScheduler } = require('./server/billing-scheduler');
const { registerRoutes } = require('./server/routes');
const { setupWebSocketServer } = require('./server/websocket');
const { createServer } = require('http');
const session = require('express-session');
const connectPgSimple = require('connect-pg-simple');
const pool = require('./server/db-pool');
const passport = require('passport');
const { Strategy: LocalStrategy } = require('passport-local');
const { storage } = require('./server/storage');
const bcrypt = require('bcrypt');

// Create HTTP server
const server = createServer(app);

// Setup WebSocket server
setupWebSocketServer(server);

// Session setup
const pgSession = connectPgSimple(session);

app.use(
  session({
    store: new pgSession({
      pool,
      tableName: 'sessions'
    }),
    secret: process.env.SESSION_SECRET || 'dev-secret-key-change-in-production',
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      secure: false,
      httpOnly: true
    }
  })
);

// Passport setup
app.use(passport.initialize());
app.use(passport.session());

// Passport admin strategy
passport.use('admin-local', new LocalStrategy(
  { usernameField: 'username' },
  async (username, password, done) => {
    try {
      const admin = await storage.getAdminByUsername(username);
      if (!admin) {
        return done(null, false, { message: 'Invalid username or password' });
      }
      const isValid = await bcrypt.compare(password, admin.password);
      if (!isValid) {
        return done(null, false, { message: 'Invalid username or password' });
      }
      return done(null, { id: admin.id, username: admin.username, role: 'admin' });
    } catch (error) {
      return done(error);
    }
  }
));

// Passport serialization
passport.serializeUser((user, done) => {
  done(null, { id: user.id, role: user.role || 'admin' });
});

passport.deserializeUser(async (data, done) => {
  try {
    if (data.role === 'admin') {
      const admin = await storage.getAdminUser(data.id);
      done(null, admin);
    } else {
      done(null, null);
    }
  } catch (error) {
    done(error, null);
  }
});

// Start reminder scheduler
setupReminders().then(() => {
  console.log('Reminder scheduler started');
}).catch(err => {
  console.error('Failed to start reminder scheduler:', err);
});

// Start billing scheduler  
setupBillingScheduler().then(() => {
  console.log('Billing scheduler initialized');
}).catch(err => {
  console.error('Failed to initialize billing scheduler:', err);
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false }));

// API routes
registerRoutes(app);

// Serve static files from the production build
const distPath = path.resolve(__dirname, 'dist/public');

// Check if dist folder exists, if not use client folder for development
const staticPath = fs.existsSync(distPath) ? distPath : path.resolve(__dirname, 'client');

app.use(express.static(staticPath));

// Fallback to index.html for client-side routing
app.get('*', (req, res) => {
  const indexPath = fs.existsSync(distPath) 
    ? path.resolve(distPath, 'index.html')
    : path.resolve(__dirname, 'client', 'index.html');
  res.sendFile(indexPath);
});

server.listen(PORT, () => {
  console.log('==================================================');
  console.log(`✅ TruckFixGo Server Running on http://localhost:${PORT}`);
  console.log(`✅ Frontend Available at http://localhost:${PORT}`);
  console.log(`✅ API Endpoints at http://localhost:${PORT}/api/*`);
  console.log(`✅ WebSocket at ws://localhost:${PORT}/ws/tracking`);
  console.log('==================================================');
});