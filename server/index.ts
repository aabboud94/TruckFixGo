import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic, log } from "./vite";
import { trackingWSServer } from "./websocket";
import { reminderScheduler } from "./reminder-scheduler";
import billingScheduler from "./billing-scheduler";
import { jobReassignmentScheduler } from "./job-reassignment-scheduler";
import { jobReminderScheduler } from "./job-reminder-scheduler";
import { jobMonitor } from "./job-monitor";
import { storage } from "./storage";
import { QueueProcessingService } from "./queue-service";
import { emailService } from "./services/email-service";
import { createServer as createViteServer, createLogger } from "vite";
import path from "path";
import fs from "fs";
import type { Server } from "http";
import viteConfig from "../vite.config";

/**
 * =================================================================
 * EXTERNAL API CONFIGURATION (CURRENTLY DISABLED - STUBS ONLY)
 * =================================================================
 * 
 * The following services require API keys to provide real data.
 * Currently, these services return stub responses indicating that
 * API configuration is required.
 * 
 * To enable these services, set the following environment variables:
 * 
 * WEATHER SERVICE:
 * ----------------
 * # Required:
 * WEATHER_API_KEY=your-api-key-here
 * WEATHER_API_PROVIDER=openweathermap  # Options: openweathermap, weatherapi, accuweather
 * 
 * # Recommended Weather API Providers:
 * # - OpenWeatherMap: https://openweathermap.org/api (Free tier available)
 * # - WeatherAPI: https://www.weatherapi.com/ (Free tier available)
 * # - National Weather Service: https://www.weather.gov/documentation/services-web-api (Free, US only)
 * # - AccuWeather: https://developer.accuweather.com/ (Free tier limited)
 * 
 * FUEL PRICE SERVICE:
 * -------------------
 * # Required:
 * FUEL_API_KEY=your-api-key-here
 * FUEL_API_PROVIDER=gasbuddy  # Options: gasbuddy, opis, fuelapi, mygasfeed
 * 
 * # Optional:
 * FUEL_API_ENDPOINT=https://api.example.com  # Provider-specific endpoint
 * 
 * # Recommended Fuel Price API Providers:
 * # - GasBuddy: https://developers.gasbuddy.com/ (Enterprise pricing)
 * # - OPIS: https://www.opisnet.com/ (Enterprise pricing, most comprehensive)
 * # - FuelAPI: https://www.fuelapi.com/ (Starting at $99/month)
 * # - MyGasFeed: http://www.mygasfeed.com/ (Free tier available)
 * 
 * ADDITIONAL INTEGRATIONS (Future):
 * ----------------------------------
 * # Fleet Card Integration:
 * # EFS_API_KEY=your-efs-key
 * # COMDATA_API_KEY=your-comdata-key
 * 
 * # Traffic & Routing:
 * # GOOGLE_MAPS_API_KEY=your-google-maps-key
 * # MAPBOX_API_KEY=your-mapbox-key
 * 
 * # Vehicle Diagnostics:
 * # SAMSARA_API_KEY=your-samsara-key
 * # GEOTAB_API_KEY=your-geotab-key
 * 
 * =================================================================
 */

const app = express();

// Fixed Vite setup that doesn't use nanoid() to prevent constant reloads
async function setupViteFixed(app: express.Express, server: Server) {
  const viteLogger = createLogger();
  
  const serverOptions = {
    middlewareMode: true,
    hmr: false, // Disable HMR to prevent infinite reload loops
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      // Read the template without adding nanoid() - this was causing constant reloads
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

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

(async () => {
  // Initialize essential service types on startup
  async function initializeServiceTypes() {
    try {
      const essentialServices = [
        {
          id: 'emergency-repair',
          code: 'EMRG_REPAIR',
          name: 'Emergency Repair',
          category: 'emergency',
          description: 'Emergency roadside repair service',
          estimatedDuration: 60,
          isEmergency: true,
          isSchedulable: false,
          isActive: true
        },
        {
          id: 'flat-tire',
          code: 'FLAT_TIRE',
          name: 'Flat Tire Service',
          category: 'emergency',
          description: 'Flat tire repair or replacement',
          estimatedDuration: 30,
          isEmergency: true,
          isSchedulable: false,
          isActive: true
        },
        {
          id: 'fuel-delivery',
          code: 'FUEL_DELIV',
          name: 'Fuel Delivery',
          category: 'emergency',
          description: 'Emergency fuel delivery service',
          estimatedDuration: 20,
          isEmergency: true,
          isSchedulable: false,
          isActive: true
        },
        {
          id: 'jump-start',
          code: 'JUMP_START',
          name: 'Jump Start',
          category: 'emergency',
          description: 'Battery jump start service',
          estimatedDuration: 20,
          isEmergency: true,
          isSchedulable: false,
          isActive: true
        },
        {
          id: 'towing',
          code: 'TOWING',
          name: 'Towing Service',
          category: 'emergency',
          description: 'Emergency towing service',
          estimatedDuration: 90,
          isEmergency: true,
          isSchedulable: false,
          isActive: true
        }
      ];

      let created = 0;
      let existing = 0;

      for (const service of essentialServices) {
        try {
          const exists = await storage.getServiceType(service.id);
          if (!exists) {
            await storage.createServiceType(service);
            
            // Also create default pricing
            await storage.createServicePricing({
              serviceTypeId: service.id,
              basePrice: '150',
              perMileRate: '3',
              emergencySurcharge: '50',
              weekendSurcharge: '25',
              nightSurcharge: '35',
              effectiveDate: new Date()
            });
            created++;
            console.log(`✅ Created service type: ${service.name}`);
          } else {
            existing++;
          }
        } catch (error) {
          console.error(`Failed to initialize service type ${service.name}:`, error);
        }
      }

      if (created > 0) {
        console.log(`✅ Initialized ${created} service types`);
      }
      if (existing > 0) {
        console.log(`ℹ️ ${existing} service types already exist`);
      }
    } catch (error) {
      console.error('Service types initialization error:', error);
    }
  }

  // Initialize service types before starting the server
  await initializeServiceTypes();

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupViteFixed(app, server); // Use fixed version without nanoid() issue
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
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

  // Start the 3-minute job reminder scheduler  
  jobReminderScheduler.start();
  log(`Job reminder scheduler started - sending 3-minute reminders for unaccepted jobs`);

  // Start the job monitor for unassigned job alerts
  jobMonitor.start();
  log(`Job monitor started - checking for unassigned jobs`);

  // Start the maintenance alert scheduler
  const { maintenanceAlertScheduler } = await import('./services/maintenance-alert-scheduler');
  maintenanceAlertScheduler.start();
  log(`Maintenance alert scheduler started - monitoring fleet maintenance predictions`);

  // Initialize Queue Processing Service
  const queueService = new QueueProcessingService(storage);
  queueService.initialize();
  log(`Queue processing service initialized - managing contractor job queues`);

  // Export queue service for use in routes
  (global as any).queueService = queueService;

  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
    log(`WebSocket tracking server available at ws://localhost:${port}/ws/tracking`);
  });
})();
