import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { registerRoutes } from "./routes";
import { setupReminders } from "./reminder-service";
import { setupBillingScheduler } from "./billing-scheduler";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import pool from "./db-pool";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import { setupWebSocketServer } from "./websocket";
import { createServer } from "http";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === "production";

const app = express();
const server = createServer(app);

// Setup WebSocket server
setupWebSocketServer(server);

// Session setup
const pgSession = connectPgSimple(session);

app.use(
  session({
    store: new pgSession({
      pool,
      tableName: "sessions"
    }),
    secret: process.env.SESSION_SECRET || "truckfixgo-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false, // Don't save uninitialized sessions
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours (aligned with routes.ts)
      secure: isProduction, // Use HTTPS in production
      httpOnly: true,
      sameSite: isProduction ? 'strict' : 'lax' // Add CSRF protection
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
passport.serializeUser((user: any, done) => {
  done(null, { id: user.id, role: user.role || 'admin' });
});

passport.deserializeUser(async (data: any, done) => {
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
  console.log("Reminder scheduler started");
}).catch(err => {
  console.error("Failed to start reminder scheduler:", err);
});

// Start billing scheduler
setupBillingScheduler().then(() => {
  console.log("Billing scheduler initialized");
}).catch(err => {
  console.error("Failed to initialize billing scheduler:", err);
});

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false }));

// API routes
registerRoutes(app);

// Serve static files from the production build
const distPath = path.resolve(__dirname, "../dist/public");
app.use(express.static(distPath));

// Fallback to index.html for client-side routing
app.get("*", (req, res) => {
  res.sendFile(path.resolve(distPath, "index.html"));
});

const PORT = process.env.PORT || 5001; // Use port 5001 to avoid conflict
server.listen(PORT, () => {
  console.log(`Production server running on port ${PORT}`);
  console.log(`WebSocket server available at ws://localhost:${PORT}/ws/tracking`);
});