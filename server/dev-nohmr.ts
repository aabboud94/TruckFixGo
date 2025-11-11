import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic, log } from "./vite";
import { trackingWSServer } from "./websocket";
import { reminderScheduler } from "./reminder-scheduler";
import billingScheduler from "./billing-scheduler";
import { jobReassignmentScheduler } from "./job-reassignment-scheduler";
import { createServer as createViteServer, createLogger } from "vite";
import path from "path";
import fs from "fs";
import type { Server } from "http";

const app = express();

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Custom Vite setup with HMR disabled
async function setupViteNoHMR(app: express.Express, server: Server) {
  const viteLogger = createLogger();
  
  const vite = await createViteServer({
    configFile: path.resolve(process.cwd(), 'vite.nohmr.config.ts'),
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: {
      middlewareMode: true,
      hmr: false, // Disable HMR completely
    },
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        process.cwd(),
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      // Don't add nanoid() - it causes constant reloads
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Setup Vite with HMR disabled to prevent infinite reload loop
  await setupViteNoHMR(app, server);

  const PORT = parseInt(process.env.PORT || "5000");
  
  // Initialize WebSocket server for real-time tracking
  await trackingWSServer.initialize(server);

  // Start the reminder scheduler
  reminderScheduler.start();
  log(`Reminder scheduler started`);

  // Start the billing scheduler
  billingScheduler.initialize();
  log(`Billing scheduler initialized`);

  // Start the job reassignment scheduler
  jobReassignmentScheduler.start();
  log(`Job reassignment scheduler started - checking for staled jobs every 5 minutes`);

  server.listen({
    port: PORT,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${PORT}`);
    log(`WebSocket tracking server available at ws://localhost:${PORT}/ws/tracking`);
  });
})();