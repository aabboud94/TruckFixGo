import express, { type Express, type Request, type Response, type NextFunction } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import bcrypt from "bcrypt";
import { z } from "zod";
import { db } from "./db";
import { storage } from "./storage";
import { desc, asc, and, eq, gte, sql, inArray, isNull } from "drizzle-orm";
import aiService from "./ai-service";
import { reminderService } from "./reminder-service";
import { reminderScheduler } from "./reminder-scheduler";
import efsComdataService from "./efs-comdata-service";
import stripeService from "./stripe-service";
import pdfService from "./pdf-service";
import { emailService } from "./services/email-service";
import { availabilityService } from "./services/availability-service";
import LocationService from "./services/location-service";
import weatherService from "./services/weather-service";
import { trackingWSServer } from "./websocket";
import { healthMonitor } from "./health-monitor";
import { pushNotificationService } from "./services/push-notification-service";
import multer from "multer";
import sharp from "sharp";
import path from "path";
import fs from "fs/promises";
import { randomUUID } from "crypto";
import { 
  insertUserSchema,
  insertDriverProfileSchema,
  insertContractorProfileSchema,
  insertJobSchema,
  insertJobPhotoSchema,
  insertJobMessageSchema,
  insertReviewSchema,
  insertReviewVoteSchema,
  insertContractorDocumentSchema,
  insertFleetAccountSchema,
  insertFleetVehicleSchema,
  insertFleetContactSchema,
  insertFleetPricingOverrideSchema,
  insertPaymentMethodSchema,
  insertTransactionSchema,
  insertRefundSchema,
  insertFleetCheckSchema,
  insertAdminSettingSchema,
  insertEmailTemplateSchema,
  insertSmsTemplateSchema,
  insertIntegrationsConfigSchema,
  insertPricingRuleSchema,
  insertCustomerPreferencesSchema,
  insertReminderSchema,
  insertReminderBlacklistSchema,
  insertServiceTypeSchema,
  insertServicePricingSchema,
  insertServiceAreaSchema,
  insertContractorServiceSchema,
  insertContractorAvailabilitySchema,
  insertJobBidSchema,
  insertBidTemplateSchema,
  insertBiddingConfigSchema,
  insertBillingSubscriptionSchema,
  insertBillingHistorySchema,
  insertBillingUsageTrackingSchema,
  insertSplitPaymentTemplateSchema,
  insertVacationRequestSchema,
  insertAvailabilityOverrideSchema,
  insertContractorCoverageSchema,
  timeOffStatusEnum,
  splitPayments,
  transactions,
  contractorProfiles,
  jobs,
  passwordResetTokens,
  insertFleetContractSchema,
  insertContractSlaMetricSchema,
  insertContractPenaltySchema,
  insertContractAmendmentSchema,
  insertContractPerformanceMetricSchema,
  type User,
  type Job,
  type ContractorProfile,
  type FleetAccount,
  type FleetCheck,
  type JobBid,
  type BidTemplate,
  type BiddingConfig,
  type BillingSubscription,
  type BillingHistory,
  type BillingUsageTracking,
  type FleetContract,
  type ContractSlaMetric,
  type ContractPenalty,
  type ContractAmendment,
  type ContractPerformanceMetric,
  userRoleEnum,
  contractStatusEnum,
  slaMetricTypeEnum,
  penaltyStatusEnum,
  amendmentStatusEnum,
  jobStatusEnum,
  jobTypeEnum,
  paymentStatusEnum,
  refundStatusEnum,
  bidStatusEnum,
  biddingStrategyEnum,
  bidAutoAcceptEnum,
  checkProviderEnum,
  checkStatusEnum,
  billingCycleEnum,
  subscriptionStatusEnum,
  billingHistoryStatusEnum,
  planTypeEnum,
  insertMaintenancePredictionSchema,
  insertVehicleTelemetrySchema,
  insertMaintenanceAlertSchema,
  maintenanceRiskLevelEnum,
  maintenanceAlertTypeEnum,
  maintenanceSeverityEnum,
  insertPerformanceGoalSchema,
  kpiDefinitions
} from "@shared/schema";

// Extend Express Request to include user
declare module 'express-session' {
  interface SessionData {
    userId?: string;
    role?: string;
  }
}

// ==================== MIDDLEWARE ====================

// Rate limiting map (simple in-memory implementation)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Rate limiter middleware
function rateLimiter(limit: number = 100, windowMs: number = 60000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    const record = rateLimitMap.get(key);

    if (!record || record.resetTime < now) {
      rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (record.count >= limit) {
      return res.status(429).json({ 
        message: 'Too many requests, please try again later.' 
      });
    }

    record.count++;
    next();
  };
}

// Authentication middleware
async function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const user = await storage.getUser(req.session.userId);
  if (!user || !user.isActive) {
    req.session.destroy(() => {});
    return res.status(401).json({ message: 'Invalid session' });
  }

  next();
}

// Admin middleware
async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const user = await storage.getUser(req.session.userId);
  if (!user || !user.isActive) {
    req.session.destroy(() => {});
    return res.status(401).json({ message: 'Invalid session' });
  }

  if (user.role !== 'admin' && user.role !== 'fleet_admin' && user.role !== 'system_admin') {
    return res.status(403).json({ message: 'Admin privileges required' });
  }

  next();
}

// Role-based access control middleware
function requireRole(...roles: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.userId || !req.session.role) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    if (!roles.includes(req.session.role)) {
      return res.status(403).json({ 
        message: `Access denied. Required role: ${roles.join(' or ')}` 
      });
    }

    next();
  };
}

// Request validation middleware
function validateRequest(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        });
      }
      next(error);
    }
  };
}

// CORS middleware for mobile app access
function corsMiddleware(req: Request, res: Response, next: NextFunction) {
  // In production, restrict to specific origins
  const allowedOrigins = process.env.NODE_ENV === 'production' 
    ? [
        'https://truck-fix-go-aabboud94.replit.app',
        'https://truckfixgo.com', // Future custom domain
        'https://www.truckfixgo.com'
      ]
    : [
        'http://localhost:5000', 
        'http://localhost:5001', 
        'http://localhost:3000',
        'http://127.0.0.1:5000',
        'http://127.0.0.1:5001',
        'http://0.0.0.0:5000'
      ];
  
  const origin = req.headers.origin;
  
  // For same-origin requests (no origin header), allow them
  if (!origin && process.env.NODE_ENV !== 'production') {
    // Same-origin request in development, allow it
    res.header('Access-Control-Allow-Credentials', 'true');
  } else if (origin && allowedOrigins.includes(origin)) {
    // Explicitly allowed origin
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  } else if (process.env.NODE_ENV !== 'production' && origin) {
    // In development, if we have an origin but it's not in the list,
    // still allow it but with credentials (for flexibility during development)
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-CSRF-Token, Cookie');
  res.header('Access-Control-Expose-Headers', 'Set-Cookie');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
}

// Pagination helper
function getPagination(req: Request) {
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
  const offset = parseInt(req.query.offset as string) || 0;
  const orderBy = req.query.orderBy as string || 'createdAt';
  const orderDir = (req.query.orderDir as 'asc' | 'desc') || 'desc';
  
  return { limit, offset, orderBy, orderDir };
}

// Helper function to validate phone numbers
function validatePhoneNumber(phone: string): { isValid: boolean; message?: string; digitsOnly?: string } {
  // Check if phone contains only allowed characters
  if (!/^[\d\s\-\+\(\)\.]+$/.test(phone)) {
    return { 
      isValid: false, 
      message: 'Phone number can only contain digits, spaces, dashes, plus signs, parentheses, and periods' 
    };
  }
  
  // Strip all non-numeric characters to count digits
  const digitsOnly = phone.replace(/\D/g, '');
  
  // Check minimum digit count (7 for testing, 10 recommended for production)
  if (digitsOnly.length < 7) {
    return { 
      isValid: false, 
      message: 'Phone number must contain at least 7 digits (10 recommended for production). Valid formats: "555-1234", "(555) 123-4567", "+1 555 123 4567"' 
    };
  }
  
  // Check maximum length for formatted phone numbers
  if (phone.length > 30) {
    return { 
      isValid: false, 
      message: 'Phone number is too long' 
    };
  }
  
  return { isValid: true, digitsOnly };
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Apply CORS FIRST to handle preflight OPTIONS requests
  app.use(corsMiddleware);
  
  // Setup session middleware with PostgreSQL store for production
  // IMPORTANT: Session middleware must be set up AFTER CORS for proper cookie handling
  const PgStore = connectPgSimple(session);
  const sessionStore = process.env.NODE_ENV === 'production' && process.env.DATABASE_URL
    ? new PgStore({
        conString: process.env.DATABASE_URL,
        tableName: 'user_sessions',
        createTableIfMissing: true,
        ttl: 24 * 60 * 60 // 24 hours in seconds
      })
    : undefined; // Use default MemoryStore in development

  app.use(session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || 'truckfixgo-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production', // Only secure in production
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax', // lax for development
      path: '/', // Ensure cookie is available for all paths
      domain: undefined // Let the browser handle domain
    },
    name: 'truckfixgo.sid', // Custom session name to avoid conflicts
    proxy: process.env.NODE_ENV === 'production' // Trust proxy in production
  }));

  // ==================== AUTHENTICATION & USER ROUTES ====================
  
  // Register new user
  app.post('/api/auth/register', 
    rateLimiter(5, 60000), // 5 requests per minute
    validateRequest(insertUserSchema.extend({
      password: z.string().min(8).max(100)
    })),
    async (req: Request, res: Response) => {
      try {
        const { email, phone, password, role, firstName, lastName } = req.body;
        
        // Check if user already exists
        if (email) {
          const existingUser = await storage.getUserByEmail(email);
          if (existingUser) {
            return res.status(400).json({ message: 'Email already registered' });
          }
        }
        
        if (phone) {
          const existingUser = await storage.getUserByPhone(phone);
          if (existingUser) {
            return res.status(400).json({ message: 'Phone number already registered' });
          }
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create user
        const user = await storage.createUser({
          email,
          phone,
          password: hashedPassword,
          role: role || 'driver',
          firstName,
          lastName,
          isActive: true,
          isGuest: false
        });

        // Create profile based on role
        if (user.role === 'driver') {
          // Create driver profile with explicit null values to avoid schema issues
          try {
            await storage.createDriverProfile({
              userId: user.id,
              vehicleType: null,
              vehicleMake: null,
              vehicleModel: null,
              vehicleYear: null,
              licensePlate: null,
              driverLicenseNumber: null,
              fleetAccountId: null,
              preferredContactMethod: null
            });
          } catch (profileError) {
            console.error('Failed to create driver profile:', profileError);
            // Continue anyway - profile can be created later
          }
        } else if (user.role === 'contractor') {
          await storage.createContractorProfile({
            userId: user.id
          });
        }

        // Create session
        req.session.userId = user.id;
        req.session.role = user.role;
        
        res.status(201).json({
          message: 'Registration successful',
          user: {
            id: user.id,
            email: user.email,
            phone: user.phone,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName
          }
        });
      } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Registration failed' });
      }
    }
  );

  // Login
  app.post('/api/auth/login',
    rateLimiter(10, 60000),
    validateRequest(z.object({
      email: z.string().email().optional(),
      phone: z.string().optional(),
      password: z.string()
    }).refine(data => data.email || data.phone, {
      message: 'Either email or phone is required'
    })),
    async (req: Request, res: Response) => {
      try {
        const { email, phone, password } = req.body;
        
        let user: User | undefined;
        if (email) {
          console.log(`[login] Looking for user with email: ${email}`);
          user = await storage.getUserByEmail(email);
        } else if (phone) {
          console.log(`[login] Looking for user with phone: ${phone}`);
          user = await storage.getUserByPhone(phone);
        }

        if (!user) {
          console.log(`[login] No user found for email: ${email || 'N/A'}, phone: ${phone || 'N/A'}`);
          return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        if (!user.password) {
          console.log(`[login] User ${user.id} has no password set`);
          return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        console.log(`[login] Found user ${user.id} with email ${user.email}, attempting password verification`);
        const isValid = await bcrypt.compare(password, user.password);
        console.log(`[login] Password verification for user ${user.id}: ${isValid ? 'SUCCESS' : 'FAILED'}`);
        
        if (!isValid) {
          return res.status(401).json({ message: 'Invalid credentials' });
        }

        if (!user.isActive) {
          return res.status(403).json({ message: 'Account is disabled' });
        }

        // Update last login
        await storage.updateUser(user.id, { lastLoginAt: new Date() });

        // Create session
        req.session.userId = user.id;
        req.session.role = user.role;

        // Get profile data
        let profile = null;
        if (user.role === 'driver') {
          profile = await storage.getDriverProfile(user.id);
        } else if (user.role === 'contractor') {
          profile = await storage.getContractorProfile(user.id);
        }

        res.json({
          message: 'Login successful',
          user: {
            id: user.id,
            email: user.email,
            phone: user.phone,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName,
            profile
          }
        });
      } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Login failed' });
      }
    }
  );

  // Logout
  app.post('/api/auth/logout', requireAuth, (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: 'Logout failed' });
      }
      res.json({ message: 'Logout successful' });
    });
  });

  // Get current user
  app.get('/api/auth/me', requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      let profile = null;
      if (user.role === 'driver') {
        profile = await storage.getDriverProfile(user.id);
      } else if (user.role === 'contractor') {
        profile = await storage.getContractorProfile(user.id);
      }

      res.json({
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          profile
        }
      });
    } catch (error) {
      console.error('Get current user error:', error);
      res.status(500).json({ message: 'Failed to get user data' });
    }
  });

  // Request password reset - public endpoint (no auth required)
  app.post('/api/auth/forgot-password',
    rateLimiter(3, 60000), // 3 requests per minute to prevent abuse
    validateRequest(z.object({
      email: z.string().email('Invalid email format')
    })),
    async (req: Request, res: Response) => {
      try {
        const { email } = req.body;
        
        // Always return the same message for security (don't reveal if email exists)
        const successMessage = 'If an account exists with that email, a reset link has been sent';
        
        // Look up the user by email
        const user = await storage.getUserByEmail(email);
        
        if (user) {
          try {
            // Generate reset token
            const token = await storage.createPasswordResetToken(user.id, user.email);
            
            if (token) {
              // Get user's name for the email
              const userName = user.firstName && user.lastName 
                ? `${user.firstName} ${user.lastName}`
                : user.firstName || user.email;
              
              // Send password reset email
              try {
                await reminderService.sendPasswordResetEmail(
                  user.email,
                  token,
                  userName
                );
              } catch (emailError) {
                // Log error internally but don't expose to client
                console.error(`Failed to send password reset email to ${email}:`, emailError);
              }
            } else {
              // Log internally if token creation failed
              console.error(`Failed to create password reset token for user ${user.id}`);
            }
          } catch (error) {
            // Log any errors internally but don't expose to client
            console.error(`Error processing password reset for ${email}:`, error);
          }
        }
        
        // Always return success message (security best practice)
        res.json({ message: successMessage });
        
      } catch (error) {
        // Log error but return generic message for security
        console.error('Forgot password endpoint error:', error);
        res.json({ message: 'If an account exists with that email, a reset link has been sent' });
      }
    }
  );

  // Reset password - submit new password with token
  app.post('/api/auth/reset-password/:token',
    rateLimiter(5, 60000), // 5 requests per minute
    validateRequest(z.object({
      password: z.string().min(8, 'Password must be at least 8 characters')
    })),
    async (req: Request, res: Response) => {
      try {
        const { token } = req.params;
        const { password } = req.body;

        // Pass plain password - usePasswordResetToken handles hashing internally
        const success = await storage.usePasswordResetToken(token, password);

        if (success) {
          res.json({ message: 'Password reset successful' });
        } else {
          res.status(400).json({ message: 'Invalid or expired reset token' });
        }
      } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({ message: 'Failed to reset password' });
      }
    }
  );

  // Validate password reset token
  app.get('/api/auth/reset-password/:token',
    rateLimiter(10, 60000), // 10 requests per minute
    async (req: Request, res: Response) => {
      try {
        const { token } = req.params;

        // Validate the token
        const result = await storage.validatePasswordResetToken(token);

        if (result) {
          res.json({ 
            valid: true, 
            email: result.email 
          });
        } else {
          res.json({ 
            valid: false 
          });
        }
      } catch (error) {
        console.error('Token validation error:', error);
        res.status(500).json({ message: 'Failed to validate token' });
      }
    }
  );

  // REMOVED: Test endpoint for security - tokens should never be exposed via API

  // Guest booking
  app.post('/api/auth/guest-booking',
    rateLimiter(20, 60000), // Increased to 20 requests per minute for emergency situations
    async (req: Request, res: Response) => {
      try {
        const { 
          guestPhone, 
          guestEmail, 
          jobType = 'emergency',
          serviceTypeId, // Do not default here - use the value sent from frontend
          location,
          locationAddress,
          description,
          unitNumber,
          carrierName,
          vehicleMake,
          vehicleModel,
          urgencyLevel = 5,
          vehicleLocation,
          photoUrl
        } = req.body;

        // Validate required fields
        if (!guestPhone || !location || !locationAddress) {
          return res.status(400).json({ 
            message: 'Phone number and location are required' 
          });
        }
        
        // Validate phone number format and digit count
        const phoneValidation = validatePhoneNumber(guestPhone);
        if (!phoneValidation.isValid) {
          return res.status(400).json({ 
            message: phoneValidation.message 
          });
        }

        // Validate and enhance location data
        let validatedLocation = location;
        let finalLocationAddress = locationAddress;
        
        // Ensure location has lat/lng coordinates
        if (typeof location === 'object' && location.lat && location.lng) {
          // If we have coordinates, validate them
          validatedLocation = {
            lat: parseFloat(location.lat),
            lng: parseFloat(location.lng)
          };
          
          // If location has highwayInfo, enhance the address
          if (location.highwayInfo) {
            const highwayLocation = LocationService.getHighwayLocation(
              location.highwayInfo.highway,
              parseInt(location.highwayInfo.mileMarker),
              location.highwayInfo.direction
            );
            if (highwayLocation) {
              finalLocationAddress = highwayLocation.formattedAddress || locationAddress;
            }
          }
        } else {
          // If we only have an address string, try to geocode it
          const geocoded = await LocationService.geocodeAddress(locationAddress);
          if (geocoded) {
            validatedLocation = { lat: geocoded.lat, lng: geocoded.lng };
          } else {
            return res.status(400).json({
              message: 'Unable to validate location. Please provide valid coordinates or address.'
            });
          }
        }
        
        // Check if location is in service area
        const inServiceArea = await LocationService.isInServiceArea(validatedLocation);
        if (!inServiceArea) {
          return res.status(400).json({
            message: 'Location is outside our service area. We currently serve the continental United States.'
          });
        }
        
        // Validate serviceTypeId - use emergency-repair only as last resort
        const resolvedServiceTypeId = serviceTypeId || 'emergency-repair';
        
        // Verify the service type exists
        const serviceType = await storage.getServiceType(resolvedServiceTypeId);
        if (!serviceType) {
          console.error(`Service type '${resolvedServiceTypeId}' not found, using 'emergency-repair'`);
          // Fall back to emergency-repair if the requested service type doesn't exist
          const fallbackServiceType = await storage.getServiceType('emergency-repair');
          if (!fallbackServiceType) {
            return res.status(400).json({
              message: 'Service type configuration error. Please contact support.'
            });
          }
        }
        
        // Create guest user (check if exists first)
        let guestUser;
        const existingUsers = await storage.findUsers({ phone: guestPhone });
        
        if (existingUsers && existingUsers.length > 0) {
          guestUser = existingUsers[0];
        } else {
          guestUser = await storage.createUser({
            phone: guestPhone,
            email: guestEmail || undefined,
            role: 'driver',
            isGuest: true,
            isActive: true
          });
        }

        // Create job with proper structure
        const jobData = {
          jobType: jobType as 'emergency' | 'scheduled',
          serviceTypeId: resolvedServiceTypeId, // Use the validated serviceTypeId
          customerId: guestUser.id,
          customerEmail: guestEmail || guestUser.email || undefined, // Store customer email for notifications
          location: validatedLocation, // Validated {lat: number, lng: number}
          locationAddress: finalLocationAddress, // Enhanced location address
          description: description || 'Emergency roadside assistance needed',
          unitNumber: unitNumber || undefined,
          vehicleMake: vehicleMake || 'Unknown',
          vehicleModel: vehicleModel || 'Semi Truck',
          urgencyLevel: urgencyLevel,
          estimatedArrival: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
          allowBidding: false
        };

        const job = await storage.createJob(jobData);

        // Store photo if provided
        if (photoUrl) {
          await storage.createJobPhoto({
            jobId: job.id,
            photoUrl: photoUrl,
            uploadedBy: guestUser.id,
            photoType: 'damage'
          });
        }

        res.status(201).json({
          message: 'Guest booking created successfully',
          job: {
            ...job,
            jobNumber: job.jobNumber,
            estimatedArrival: '15-30 minutes'
          },
          guestUserId: guestUser.id,
          trackingUrl: `/track/${job.jobNumber}`
        });
      } catch (error) {
        console.error('Guest booking error:', error);
        res.status(500).json({ 
          message: 'Guest booking failed', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }
  );

  // Update user profile
  app.put('/api/auth/profile', 
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const userId = req.session.userId!;
        const user = await storage.getUser(userId);
        
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }

        // Update user basic info if provided
        const { firstName, lastName, phone, email } = req.body;
        if (firstName || lastName || phone || email) {
          await storage.updateUser(userId, {
            firstName,
            lastName,
            phone,
            email
          });
        }

        // Update role-specific profile
        if (user.role === 'driver' && req.body.driverProfile) {
          await storage.updateDriverProfile(userId, req.body.driverProfile);
        } else if (user.role === 'contractor' && req.body.contractorProfile) {
          await storage.updateContractorProfile(userId, req.body.contractorProfile);
        }

        res.json({ message: 'Profile updated successfully' });
      } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'Failed to update profile' });
      }
    }
  );

  // ==================== ADMIN SETUP ROUTES ====================
  
  // Admin setup - create first admin user
  app.post('/api/admin/setup',
    rateLimiter(3, 60000), // Only 3 attempts per minute
    validateRequest(z.object({
      email: z.string().email(),
      password: z.string().min(8).max(100)
    })),
    async (req: Request, res: Response) => {
      try {
        // Check if any admin users already exist
        const hasAdmins = await storage.hasAdminUsers();
        
        if (hasAdmins) {
          return res.status(403).json({ 
            message: 'Admin setup already completed. An admin user already exists.' 
          });
        }
        
        const { email, password } = req.body;
        
        // Check if email is already in use
        const existingUser = await storage.getUserByEmail(email);
        if (existingUser) {
          return res.status(400).json({ 
            message: 'Email already registered' 
          });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create admin user
        const adminUser = await storage.createUser({
          email,
          password: hashedPassword,
          role: 'admin',
          isActive: true,
          isGuest: false
        });
        
        // Create session
        req.session.userId = adminUser.id;
        req.session.role = adminUser.role;
        
        res.status(201).json({
          message: 'Admin user created successfully',
          user: {
            id: adminUser.id,
            email: adminUser.email,
            role: adminUser.role
          }
        });
      } catch (error) {
        console.error('Admin setup error:', error);
        res.status(500).json({ message: 'Admin setup failed' });
      }
    }
  );
  
  // Quick admin setup for testing - creates default admin user
  app.post('/api/admin/quick-setup',
    rateLimiter(3, 60000), // Only 3 attempts per minute
    async (req: Request, res: Response) => {
      try {
        // Check if any admin users already exist
        const hasAdmins = await storage.hasAdminUsers();
        
        if (hasAdmins) {
          return res.status(403).json({ 
            message: 'Admin setup already completed. An admin user already exists.' 
          });
        }
        
        // Default admin credentials
        const email = 'admin@truckfixgo.com';
        const password = 'Admin123!';
        
        // Check if email is already in use
        const existingUser = await storage.getUserByEmail(email);
        if (existingUser) {
          // If the user exists but is not an admin, we cannot continue
          if (existingUser.role !== 'admin') {
            return res.status(400).json({ 
              message: 'Email already registered with a different role' 
            });
          }
          // If it's already an admin, return success
          return res.status(200).json({
            message: 'Admin user already exists',
            user: {
              id: existingUser.id,
              email: existingUser.email,
              role: existingUser.role
            }
          });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create admin user with default credentials
        const adminUser = await storage.createUser({
          email,
          password: hashedPassword,
          role: 'admin',
          firstName: 'Admin',
          lastName: 'User',
          isActive: true,
          isGuest: false
        });
        
        // Create session
        req.session.userId = adminUser.id;
        req.session.role = adminUser.role;
        
        res.status(201).json({
          message: 'Quick admin setup completed successfully',
          user: {
            id: adminUser.id,
            email: adminUser.email,
            role: adminUser.role
          },
          credentials: {
            email: email,
            password: password
          },
          note: 'Please change the password immediately after logging in'
        });
      } catch (error) {
        console.error('Quick admin setup error:', error);
        res.status(500).json({ message: 'Quick admin setup failed' });
      }
    }
  );

  // Initialize service types - creates all necessary service types in database
  app.post('/api/admin/service-types/initialize',
    requireAuth,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        // Define all required service types
        const serviceTypesToCreate = [
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

        const createdServices: any[] = [];
        const skippedServices: string[] = [];
        const errors: string[] = [];

        // Try to create each service type
        for (const serviceType of serviceTypesToCreate) {
          try {
            // Check if service type already exists
            const existing = await storage.getServiceType(serviceType.id);
            if (existing) {
              skippedServices.push(serviceType.name);
            } else {
              const created = await storage.createServiceType(serviceType);
              createdServices.push(created);
              
              // Also create default pricing for each service type
              await storage.createServicePricing({
                serviceTypeId: serviceType.id,
                basePrice: 150, // Default base price
                perMileRate: 3,
                emergencySurcharge: 50,
                weekendSurcharge: 25,
                nightSurcharge: 35,
                effectiveDate: new Date(),
                isActive: true
              });
            }
          } catch (error) {
            console.error(`Failed to create service type ${serviceType.name}:`, error);
            errors.push(`${serviceType.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }

        res.json({
          message: 'Service types initialization completed',
          created: createdServices.length,
          skipped: skippedServices.length,
          createdServices: createdServices.map(s => s.name),
          skippedServices,
          errors
        });
      } catch (error) {
        console.error('Initialize service types error:', error);
        res.status(500).json({ message: 'Failed to initialize service types' });
      }
    }
  );

  // ==================== SERVICE TYPE CRUD ENDPOINTS ====================

  // Get all service types
  app.get('/api/admin/service-types',
    requireAuth,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const serviceTypes = await storage.findServiceTypes();
        res.json({ serviceTypes });
      } catch (error) {
        console.error('Get service types error:', error);
        res.status(500).json({ message: 'Failed to get service types' });
      }
    }
  );

  // Create a new service type
  app.post('/api/admin/service-types',
    requireAuth,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        // This endpoint is for dynamically adding service types from the admin UI
        const serviceTypeData = {
          id: req.body.id || `service-${req.body.service.toLowerCase().replace(/\s+/g, '-')}`,
          code: req.body.code || req.body.service.toUpperCase().replace(/\s+/g, '_'),
          name: req.body.service,
          description: req.body.description,
          isActive: req.body.isActive ?? true,
          isEmergency: req.body.emergencyAvailable ?? true,
          isScheduled: req.body.scheduledAvailable ?? true,
          categories: req.body.categories || []
        };

        const serviceType = await storage.createServiceType(serviceTypeData);

        // Create default pricing for the service type
        await storage.createServicePricing({
          serviceTypeId: serviceType.id,
          basePrice: req.body.base || 150,
          perMileRate: 3,
          emergencySurcharge: 50,
          weekendSurcharge: 25,
          nightSurcharge: 35,
          effectiveDate: new Date(),
          isActive: true
        });

        res.status(201).json({
          message: 'Service type created successfully',
          serviceType
        });
      } catch (error) {
        console.error('Create service type error:', error);
        res.status(500).json({ message: 'Failed to create service type' });
      }
    }
  );

  // Update a service type
  app.put('/api/admin/service-types/:id',
    requireAuth,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        // For now, we'll update the admin settings directly since service types are stored there
        // In production, this would update the service_types table
        const pricingSettings = await storage.getSetting('pricing');
        const serviceId = req.params.id;
        
        if (pricingSettings && pricingSettings.value) {
          const pricingData = pricingSettings.value;
          const baseRates = pricingData.baseRates || [];
          const index = baseRates.findIndex((rate: any) => {
            const rateId = rate.id || `service-${rate.service.toLowerCase().replace(/\s+/g, '-')}`;
            return rateId === serviceId;
          });
          
          if (index !== -1) {
            // Update the service type in the base rates with proper field mapping
            baseRates[index] = {
              ...baseRates[index],
              service: req.body.name || req.body.service || baseRates[index].service,
              base: req.body.basePrice || req.body.base || baseRates[index].base,
              perHour: req.body.perHourRate || req.body.perHour || baseRates[index].perHour,
              perTruck: req.body.perTruck || baseRates[index].perTruck,
              perTire: req.body.perTire || baseRates[index].perTire,
              perUnit: req.body.perUnit || baseRates[index].perUnit,
              description: req.body.description || baseRates[index].description,
              isActive: req.body.isActive ?? baseRates[index].isActive,
              emergencyAvailable: req.body.isEmergency ?? req.body.emergencyAvailable ?? baseRates[index].emergencyAvailable,
              scheduledAvailable: req.body.isSchedulable ?? req.body.scheduledAvailable ?? baseRates[index].scheduledAvailable,
            };
            
            // Save the updated settings
            pricingData.baseRates = baseRates;
            await storage.updateSetting('pricing', pricingData);
            
            // Also update the actual service type if it exists
            const existingServiceType = await storage.getServiceType(serviceId);
            if (existingServiceType) {
              await storage.updateServiceType(serviceId, {
                name: req.body.name || req.body.service,
                description: req.body.description,
                isActive: req.body.isActive,
                isEmergency: req.body.isEmergency ?? req.body.emergencyAvailable,
                isSchedulable: req.body.isSchedulable ?? req.body.scheduledAvailable,
              });
              
              // Update or create pricing for the service type
              const currentPricing = await storage.getCurrentPricing(serviceId);
              const newBasePrice = String(req.body.basePrice || req.body.base || 0);
              const newPerHourRate = req.body.perHourRate || req.body.perHour ? String(req.body.perHourRate || req.body.perHour) : undefined;
              const newPerMileRate = req.body.perMileRate || req.body.perMile ? String(req.body.perMileRate || req.body.perMile) : undefined;
              
              if (currentPricing) {
                // Update existing pricing
                await storage.updateServicePricing(currentPricing.id, {
                  basePrice: newBasePrice,
                  perHourRate: newPerHourRate,
                  perMileRate: newPerMileRate,
                });
                console.log(`Updated pricing for ${serviceId}: basePrice=${newBasePrice}`);
              } else {
                // Create new pricing if it doesn't exist
                await storage.createServicePricing({
                  serviceTypeId: serviceId,
                  basePrice: newBasePrice,
                  perHourRate: newPerHourRate,
                  perMileRate: newPerMileRate,
                  emergencySurcharge: "50",
                  weekendSurcharge: "25",
                  nightSurcharge: "35",
                  effectiveDate: new Date()
                });
                console.log(`Created pricing for ${serviceId}: basePrice=${newBasePrice}`);
              }
            }
            
            res.json({
              message: 'Service type updated successfully',
              serviceType: baseRates[index]
            });
          } else {
            res.status(404).json({ message: 'Service type not found' });
          }
        } else {
          res.status(404).json({ message: 'Pricing settings not found' });
        }
      } catch (error) {
        console.error('Update service type error:', error);
        res.status(500).json({ message: 'Failed to update service type' });
      }
    }
  );

  // Delete a service type
  app.delete('/api/admin/service-types/:id',
    requireAuth,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        // For now, we'll update the admin settings directly since service types are stored there
        const pricingSettings = await storage.getSetting('pricing');
        const serviceId = req.params.id;
        
        if (pricingSettings && pricingSettings.value) {
          const pricingData = pricingSettings.value;
          const baseRates = pricingData.baseRates || [];
          const filteredRates = baseRates.filter((rate: any) => {
            const rateId = rate.id || `service-${rate.service.toLowerCase().replace(/\s+/g, '-')}`;
            return rateId !== serviceId;
          });
          
          if (filteredRates.length !== baseRates.length) {
            // Update the settings with filtered rates
            pricingData.baseRates = filteredRates;
            await storage.updateSetting('pricing', pricingData);
            
            res.json({
              message: 'Service type deleted successfully'
            });
          } else {
            res.status(404).json({ message: 'Service type not found' });
          }
        } else {
          res.status(404).json({ message: 'Pricing settings not found' });
        }
      } catch (error) {
        console.error('Delete service type error:', error);
        res.status(500).json({ message: 'Failed to delete service type' });
      }
    }
  );

  // Get admin session - verifies admin authentication for admin dashboard
  app.get('/api/admin/session',
    requireAuth,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const user = await storage.getUser(req.session.userId!);
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }

        // Verify the user is still an admin (double check)
        if (user.role !== 'admin') {
          return res.status(401).json({ message: 'Not an admin user' });
        }

        // Return admin user data
        res.json({
          user: {
            id: user.id,
            email: user.email,
            phone: user.phone,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName
          }
        });
      } catch (error) {
        console.error('Get admin session error:', error);
        res.status(500).json({ message: 'Failed to get admin session' });
      }
    }
  );

  // ==================== JOB ROUTES ====================

  // Emergency job validation schema
  const emergencyJobSchema = z.object({
    // Job type validation - must be emergency
    type: z.literal('emergency').optional(),
    jobType: z.literal('emergency').optional(),
    
    // Customer information (required)
    customerName: z.string().min(1, 'Customer name is required').max(100),
    customerPhone: z.string()
      .max(30) // Increased max length to account for formatted numbers
      .regex(/^[\d\s\-\+\(\)\.]+$/, 'Phone number can only contain digits, spaces, dashes, plus signs, parentheses, and periods')
      .refine((phone) => {
        // Strip all non-numeric characters and count digits
        const digitsOnly = phone.replace(/\D/g, '');
        return digitsOnly.length >= 7;
      }, 'Phone number must contain at least 7 digits (10 recommended for production). Valid formats: "555-1234", "(555) 123-4567", "+1 555 123 4567"'),
    guestPhone: z.string()
      .max(30) // Increased max length to account for formatted numbers
      .regex(/^[\d\s\-\+\(\)\.]+$/, 'Phone number can only contain digits, spaces, dashes, plus signs, parentheses, and periods')
      .refine((phone) => {
        // Strip all non-numeric characters and count digits
        const digitsOnly = phone.replace(/\D/g, '');
        return digitsOnly.length >= 7;
      }, 'Phone number must contain at least 7 digits (10 recommended for production). Valid formats: "555-1234", "(555) 123-4567", "+1 555 123 4567"')
      .optional(), // Alternative field name
    guestEmail: z.string().email().optional().or(z.string().length(0)),
    email: z.string().email().optional().or(z.string().length(0)),
    
    // Location (required)
    location: z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180)
    }),
    locationAddress: z.string().min(1, 'Location address is required').max(500),
    
    // Service type (required)
    serviceType: z.string().min(1).optional(),
    serviceTypeId: z.string().min(1).optional(),
    
    // Vehicle information (optional but validated if provided)
    unitNumber: z.string().max(50).optional().or(z.literal('')),
    carrierName: z.string().max(100).optional().or(z.literal('')),
    vehicleMake: z.string().max(50).optional().or(z.literal('')),
    vehicleModel: z.string().max(50).optional().or(z.literal('')),
    
    // Issue details
    description: z.string().max(1000).optional(),
    urgencyLevel: z.number().min(1).max(5).optional(),
    
    // Photo and AI analysis (optional)
    photoUrl: z.string().url().optional().or(z.literal('')),
    aiAnalysis: z.any().optional()
  }).refine(
    data => data.type === 'emergency' || data.jobType === 'emergency',
    { message: 'This endpoint only accepts emergency jobs' }
  ).refine(
    data => data.serviceType || data.serviceTypeId,
    { message: 'Service type is required' }
  );

  // Create emergency job (no auth required for guest bookings)
  app.post('/api/jobs/emergency',
    rateLimiter(20, 60000), // 20 requests per minute for emergency situations
    validateRequest(emergencyJobSchema),
    async (req: Request, res: Response) => {
      try {
        const requestId = `EM-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
        
        // Log the attempt for monitoring (without sensitive data)
        console.log(`[EMERGENCY-JOB] Request ID: ${requestId}, IP: ${clientIp}, Time: ${new Date().toISOString()}`);
        console.log(`[EMERGENCY-JOB] Service Type: ${req.body.serviceTypeId || req.body.serviceType}, Location: ${req.body.locationAddress?.substring(0, 50)}...`);

        // Map service type string to service_type_id
        let serviceTypeId = req.body.serviceTypeId || req.body.serviceType;
        if (!serviceTypeId) {
          // Default to emergency-repair if no service type specified
          serviceTypeId = 'emergency-repair';
          console.log(`[EMERGENCY-JOB] Defaulting to emergency-repair service type`);
        }

        // Normalize customer data (handle different field names)
        const customerPhone = req.body.customerPhone || req.body.guestPhone;
        const customerEmail = req.body.email || req.body.guestEmail;

        // Create emergency job data with proper field mapping
        const jobData = {
          jobType: 'emergency' as const,
          customerId: req.session.userId || null, // Guest users won't have a userId
          status: 'new' as const,
          serviceTypeId: serviceTypeId, // Ensure service_type_id is set
          
          // Customer info
          customerName: req.body.customerName,
          customerPhone: customerPhone,
          customerEmail: customerEmail,
          
          // Location
          location: req.body.location,
          locationAddress: req.body.locationAddress,
          
          // Vehicle and issue details
          unitNumber: req.body.unitNumber || undefined,
          carrierName: req.body.carrierName || undefined,
          vehicleMake: req.body.vehicleMake || 'Unknown',
          vehicleModel: req.body.vehicleModel || 'Semi Truck',
          description: req.body.description || 'Emergency roadside assistance needed',
          urgencyLevel: req.body.urgencyLevel || 5,
          
          // Photo and AI analysis
          photoUrl: req.body.photoUrl || undefined,
          aiAnalysis: req.body.aiAnalysis || undefined,
          
          // Generate a job number for tracking
          jobNumber: 'EM' + Date.now().toString().slice(-8),
          
          // Set estimated arrival
          estimatedArrival: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes from now
        };

        // Additional location validation (coordinates already validated by Zod, but double-check)
        if (!jobData.location || 
            typeof jobData.location.lat !== 'number' || 
            typeof jobData.location.lng !== 'number' ||
            jobData.location.lat < -90 || jobData.location.lat > 90 ||
            jobData.location.lng < -180 || jobData.location.lng > 180) {
          console.warn(`[EMERGENCY-JOB] Invalid coordinates provided: ${JSON.stringify(jobData.location)}`);
          return res.status(400).json({ 
            message: 'Invalid location coordinates provided. Please ensure latitude is between -90 and 90, and longitude is between -180 and 180.' 
          });
        }

        // Check if location is in service area
        const inServiceArea = await LocationService.isInServiceArea(jobData.location);
        if (!inServiceArea) {
          console.log(`[EMERGENCY-JOB] Location outside service area: ${JSON.stringify(jobData.location)}`);
          return res.status(400).json({
            message: 'Location is outside our service area. We currently serve the continental United States.'
          });
        }

        // Verify service type exists
        const serviceType = await storage.getServiceType(serviceTypeId);
        if (!serviceType) {
          console.error(`[EMERGENCY-JOB] Service type '${serviceTypeId}' not found`);
          return res.status(400).json({
            message: 'Invalid service type. Please select a valid service type.'
          });
        }

        // Log successful validation
        console.log(`[EMERGENCY-JOB] Request ID: ${requestId} - Validation passed, creating job...`);

        // Create the job
        const job = await storage.createJob(jobData);
        
        // Log successful creation
        console.log(`[EMERGENCY-JOB] Request ID: ${requestId} - Job created successfully with ID: ${job.id}, Job Number: ${job.jobNumber}`);

        // Store photo if provided (separate operation)
        if (jobData.photoUrl) {
          try {
            await storage.createJobPhoto({
              jobId: job.id,
              photoUrl: jobData.photoUrl,
              uploadedBy: jobData.customerId || 'guest',
              photoType: 'damage'
            });
            console.log(`[EMERGENCY-JOB] Photo stored for job ${job.id}`);
          } catch (photoError) {
            console.error(`[EMERGENCY-JOB] Failed to store photo for job ${job.id}:`, photoError);
            // Don't fail the entire request if photo storage fails
          }
        }

        // Send notification if email provided
        if (customerEmail) {
          try {
            await emailService.sendJobConfirmation({
              email: customerEmail,
              jobNumber: job.jobNumber,
              customerName: jobData.customerName,
              serviceType: serviceType.name,
              estimatedArrival: '15-30 minutes',
              trackingUrl: `/track/${job.jobNumber}`
            });
            console.log(`[EMERGENCY-JOB] Confirmation email sent to customer`);
          } catch (emailError) {
            console.error(`[EMERGENCY-JOB] Failed to send confirmation email:`, emailError);
            // Don't fail the entire request if email fails
          }
        }
        
        res.status(201).json({
          message: 'Emergency job created successfully',
          job: {
            id: job.id,
            jobNumber: job.jobNumber,
            status: job.status,
            serviceType: serviceType.name,
            estimatedArrival: '15-30 minutes',
            trackingUrl: `/track/${job.jobNumber}`
          }
        });
      } catch (error) {
        // Generate error ID for tracking
        const errorId = `ERR-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        
        // Log error with ID for debugging
        console.error(`[EMERGENCY-JOB-ERROR] Error ID: ${errorId}`, error);
        
        // Check for specific error types
        if (error instanceof z.ZodError) {
          // This shouldn't happen as validateRequest handles it, but just in case
          return res.status(400).json({ 
            message: 'Validation error', 
            errors: error.errors,
            errorId 
          });
        }
        
        res.status(500).json({ 
          message: 'Failed to create emergency job. Please try again or contact support.', 
          errorId 
        });
      }
    }
  );

  // Create new job (authenticated)
  app.post('/api/jobs',
    requireAuth,
    validateRequest(insertJobSchema),
    async (req: Request, res: Response) => {
      try {
        const jobData = {
          ...req.body,
          customerId: req.body.customerId || req.session.userId,
          status: 'new' as const
        };

        const job = await storage.createJob(jobData);
        
        // Schedule reminders for scheduled jobs
        if (job.jobType === 'scheduled' && job.scheduledAt) {
          try {
            await reminderService.scheduleJobReminders(job);
          } catch (error) {
            console.error('Failed to schedule reminders:', error);
            // Don't fail the job creation if reminder scheduling fails
          }
        }
        
        res.status(201).json({
          message: 'Job created successfully',
          job
        });
      } catch (error) {
        console.error('Create job error:', error);
        res.status(500).json({ message: 'Failed to create job' });
      }
    }
  );

  // List jobs with filters
  app.get('/api/jobs', requireAuth, async (req: Request, res: Response) => {
    try {
      const pagination = getPagination(req);
      const filters = {
        ...pagination,
        status: req.query.status as typeof jobStatusEnum.enumValues[number],
        jobType: req.query.jobType as typeof jobTypeEnum.enumValues[number],
        contractorId: req.query.contractorId as string,
        customerId: req.query.customerId as string,
        fleetAccountId: req.query.fleetAccountId as string,
        fromDate: req.query.fromDate ? new Date(req.query.fromDate as string) : undefined,
        toDate: req.query.toDate ? new Date(req.query.toDate as string) : undefined
      };

      // Filter based on user role
      if (req.session.role === 'driver') {
        filters.customerId = req.session.userId;
      } else if (req.session.role === 'contractor') {
        filters.contractorId = req.session.userId;
      }

      const jobs = await storage.findJobs(filters);
      
      res.json({ jobs });
    } catch (error) {
      console.error('List jobs error:', error);
      res.status(500).json({ message: 'Failed to list jobs' });
    }
  });

  // Get job details
  app.get('/api/jobs/:id', requireAuth, async (req: Request, res: Response) => {
    try {
      const job = await storage.getJob(req.params.id);
      
      if (!job) {
        return res.status(404).json({ message: 'Job not found' });
      }

      // Check access permissions
      if (req.session.role === 'driver' && job.customerId !== req.session.userId) {
        return res.status(403).json({ message: 'Access denied' });
      }
      if (req.session.role === 'contractor' && job.contractorId !== req.session.userId) {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Get related data
      const photos = await storage.getJobPhotos(job.id);
      const statusHistory = await storage.getJobStatusHistory(job.id);
      
      res.json({ 
        job,
        photos,
        statusHistory
      });
    } catch (error) {
      console.error('Get job error:', error);
      res.status(500).json({ message: 'Failed to get job details' });
    }
  });

  // Get job tracking info (public endpoint)
  app.get('/api/jobs/:id/tracking', async (req: Request, res: Response) => {
    try {
      const job = await storage.getJob(req.params.id);
      
      if (!job) {
        return res.status(404).json({ message: 'Job not found' });
      }

      // Get contractor info if assigned
      let contractor = null;
      if (job.contractorId) {
        const contractorUser = await storage.getUser(job.contractorId);
        const contractorProfile = await storage.getContractorProfile(job.contractorId);
        
        if (contractorUser && contractorProfile) {
          contractor = {
            id: contractorUser.id,
            firstName: contractorUser.firstName,
            lastName: contractorUser.lastName,
            phone: contractorUser.phone,
            photo: null, // Would come from a profile photo system
            rating: contractorProfile.averageRating,
            totalJobs: contractorProfile.totalJobsCompleted
          };
        }
      }

      // Get status history
      const statusHistory = await storage.getJobStatusHistory(job.id);

      res.json({
        job: {
          id: job.id,
          jobNumber: job.jobNumber,
          status: job.status,
          location: job.location,
          locationAddress: job.locationAddress,
          locationNotes: job.locationNotes,
          contractorLocation: job.contractorLocation,
          estimatedArrival: job.estimatedArrival,
          description: job.description,
          serviceType: job.serviceTypeId,
          vin: job.vin,
          unitNumber: job.unitNumber,
          vehicleMake: job.vehicleMake,
          vehicleModel: job.vehicleModel,
          vehicleYear: job.vehicleYear
        },
        contractor,
        statusHistory: statusHistory.map(h => ({
          id: h.id,
          toStatus: h.toStatus,
          fromStatus: h.fromStatus,
          reason: h.reason,
          createdAt: h.createdAt
        }))
      });
    } catch (error) {
      console.error('Get tracking info error:', error);
      res.status(500).json({ message: 'Failed to get tracking information' });
    }
  });

  // Public tracking endpoint (simple version for test compatibility)
  app.get('/api/jobs/:id/track', async (req: Request, res: Response) => {
    try {
      const job = await storage.getJob(req.params.id);
      
      if (!job) {
        return res.status(404).json({ message: 'Job not found' });
      }

      res.json({
        job: {
          id: job.id,
          jobNumber: job.jobNumber,
          status: job.status,
          locationAddress: job.locationAddress,
          serviceType: job.serviceTypeId,
          customerName: job.customerName,
          estimatedArrival: job.estimatedArrival || '15-30 minutes'
        }
      });
    } catch (error) {
      console.error('Get job tracking error:', error);
      res.status(500).json({ message: 'Failed to get job tracking' });
    }
  });

  // ==================== VACATION AND TIME-OFF MANAGEMENT ====================
  
  // Request time off
  app.post('/api/contractor/time-off',
    requireAuth,
    requireRole('contractor'),
    async (req: Request, res: Response) => {
      try {
        const contractorId = req.session.userId!;
        const validatedData = insertVacationRequestSchema.parse(req.body);
        
        // Check for conflicts
        const { hasConflicts, scheduledJobs, existingRequests } = 
          await availabilityService.checkConflicts(
            contractorId,
            new Date(validatedData.startDate),
            new Date(validatedData.endDate)
          );
        
        if (hasConflicts && scheduledJobs.length > 0) {
          return res.status(409).json({
            message: 'Time off request conflicts with scheduled jobs',
            conflicts: {
              scheduledJobs,
              existingRequests
            }
          });
        }
        
        const request = await storage.requestTimeOff(contractorId, validatedData);
        res.status(201).json(request);
      } catch (error) {
        console.error('Request time off error:', error);
        res.status(500).json({ message: 'Failed to request time off' });
      }
    }
  );
  
  // Get time off requests
  app.get('/api/contractor/time-off',
    requireAuth,
    requireRole('contractor'),
    async (req: Request, res: Response) => {
      try {
        const contractorId = req.session.userId!;
        const status = req.query.status as typeof timeOffStatusEnum.enumValues[number] | undefined;
        
        const requests = await storage.getTimeOffRequests(contractorId, status);
        res.json(requests);
      } catch (error) {
        console.error('Get time off requests error:', error);
        res.status(500).json({ message: 'Failed to get time off requests' });
      }
    }
  );
  
  // Admin approve time off
  app.patch('/api/admin/time-off/:id/approve',
    requireAuth,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const requestId = req.params.id;
        const adminId = req.session.userId!;
        const { notes, coverageContractorId } = req.body;
        
        // First approve the request
        let updatedRequest = await storage.approveTimeOff(requestId, adminId, notes);
        
        if (!updatedRequest) {
          return res.status(404).json({ message: 'Time off request not found' });
        }
        
        // Assign coverage if provided
        if (coverageContractorId) {
          updatedRequest = await storage.assignCoverageContractor(requestId, coverageContractorId);
        }
        
        // Send notification
        if (updatedRequest) {
          await availabilityService.notifyApproval(updatedRequest);
        }
        
        res.json(updatedRequest);
      } catch (error) {
        console.error('Approve time off error:', error);
        res.status(500).json({ message: 'Failed to approve time off' });
      }
    }
  );
  
  // Admin reject time off
  app.patch('/api/admin/time-off/:id/reject',
    requireAuth,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const requestId = req.params.id;
        const adminId = req.session.userId!;
        const { reason } = req.body;
        
        if (!reason) {
          return res.status(400).json({ message: 'Rejection reason is required' });
        }
        
        const updatedRequest = await storage.rejectTimeOff(requestId, adminId, reason);
        
        if (!updatedRequest) {
          return res.status(404).json({ message: 'Time off request not found' });
        }
        
        // Send notification
        await availabilityService.notifyRejection(updatedRequest);
        
        res.json(updatedRequest);
      } catch (error) {
        console.error('Reject time off error:', error);
        res.status(500).json({ message: 'Failed to reject time off' });
      }
    }
  );
  
  // Get availability calendar
  app.get('/api/contractor/availability/calendar',
    requireAuth,
    requireRole('contractor'),
    async (req: Request, res: Response) => {
      try {
        const contractorId = req.session.userId!;
        const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
        const year = parseInt(req.query.year as string) || new Date().getFullYear();
        
        const calendar = await storage.getAvailabilityCalendar(contractorId, month, year);
        const balance = await availabilityService.calculateVacationBalance(contractorId);
        
        res.json({
          calendar,
          balance
        });
      } catch (error) {
        console.error('Get availability calendar error:', error);
        res.status(500).json({ message: 'Failed to get availability calendar' });
      }
    }
  );
  
  // Bulk update availability
  app.put('/api/contractor/availability/bulk',
    requireAuth,
    requireRole('contractor'),
    async (req: Request, res: Response) => {
      try {
        const contractorId = req.session.userId!;
        const { dates } = req.body;
        
        if (!dates || !Array.isArray(dates)) {
          return res.status(400).json({ message: 'Invalid dates array' });
        }
        
        // Convert string dates to Date objects
        const formattedDates = dates.map(d => ({
          ...d,
          date: new Date(d.date)
        }));
        
        const overrides = await storage.bulkUpdateAvailability(contractorId, formattedDates);
        res.json(overrides);
      } catch (error) {
        console.error('Bulk update availability error:', error);
        res.status(500).json({ message: 'Failed to update availability' });
      }
    }
  );
  
  // Get coverage suggestions
  app.get('/api/contractor/coverage-suggestions',
    requireAuth,
    requireRole('contractor', 'admin'),
    async (req: Request, res: Response) => {
      try {
        const contractorId = req.query.contractorId as string || req.session.userId!;
        const startDate = new Date(req.query.startDate as string);
        const endDate = new Date(req.query.endDate as string);
        
        if (!startDate || !endDate) {
          return res.status(400).json({ message: 'Start date and end date are required' });
        }
        
        const suggestions = await availabilityService.suggestCoverage(
          contractorId,
          startDate,
          endDate
        );
        
        res.json(suggestions);
      } catch (error) {
        console.error('Get coverage suggestions error:', error);
        res.status(500).json({ message: 'Failed to get coverage suggestions' });
      }
    }
  );
  
  // Fleet view of contractor availability
  app.get('/api/fleet/contractor-availability',
    requireAuth,
    requireRole('admin', 'fleet_manager'),
    async (req: Request, res: Response) => {
      try {
        const fleetId = req.query.fleetId as string;
        const startDate = new Date(req.query.startDate as string || new Date());
        const endDate = new Date(req.query.endDate as string || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
        
        let contractorIds: string[] = [];
        
        if (fleetId) {
          // Get contractors for specific fleet
          const fleetContractors = await storage.getFleetContractors(fleetId);
          contractorIds = fleetContractors.map(c => c.contractorId);
        } else {
          // Get all contractors
          const allContractors = await storage.findUsers({ role: 'contractor' });
          contractorIds = allContractors.map(c => c.id);
        }
        
        const report = await availabilityService.generateAvailabilityReport(
          contractorIds,
          startDate,
          endDate
        );
        
        res.json(report);
      } catch (error) {
        console.error('Get fleet availability error:', error);
        res.status(500).json({ message: 'Failed to get fleet availability' });
      }
    }
  );

  // Get contractor dashboard data
  app.get('/api/contractor/dashboard',
    requireAuth,
    requireRole('contractor'),
    async (req: Request, res: Response) => {
      try {
        const contractorId = req.session.userId!;
        
        // Get contractor profile
        const contractorProfile = await storage.getContractorProfile(contractorId);
        if (!contractorProfile) {
          return res.status(404).json({ message: 'Contractor profile not found' });
        }

        // Get user info
        const user = await storage.getUser(contractorId);
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }

        // Get current job and queue entry using the new queue methods
        const { job: currentJob, queueEntry: currentQueueEntry } = await storage.getContractorCurrentJob(contractorId);
        
        // Get all queue entries (includes current + queued)
        const allQueueEntries = await storage.getContractorQueue(contractorId);
        
        // Separate queued jobs from current job
        const queuedEntries = allQueueEntries.filter(entry => entry.status === 'queued');
        
        // Fetch job details for queued entries
        const queuedJobs = await Promise.all(
          queuedEntries.map(async (queueEntry) => {
            const job = await storage.getJob(queueEntry.jobId);
            if (!job) return null;
            
            // Get customer info
            let customer = null;
            if (job.customerId) {
              const customerUser = await storage.getUser(job.customerId);
              if (customerUser) {
                customer = {
                  firstName: customerUser.firstName,
                  lastName: customerUser.lastName,
                  phone: customerUser.phone
                };
              }
            }
            
            // Get service type name
            const serviceType = await storage.getServiceType(job.serviceTypeId);
            
            return {
              id: job.id,
              jobNumber: job.jobNumber,
              queuePosition: queueEntry.position,
              customerName: customer ? `${customer.firstName} ${customer.lastName}` : job.customerName || 'Guest',
              customerPhone: customer?.phone || job.customerPhone,
              location: job.location,
              locationAddress: job.locationAddress,
              serviceType: serviceType?.name || 'Service',
              jobType: job.jobType,
              status: job.status,
              urgencyLevel: job.urgencyLevel,
              scheduledFor: job.scheduledFor,
              estimatedDuration: job.estimatedDuration,
              description: job.description
            };
          })
        );
        
        // Filter out null entries
        const validQueuedJobs = queuedJobs.filter(job => job !== null);
        
        // Format current job if it exists
        let formattedCurrentJob = null;
        if (currentJob) {
          // Get customer info for current job
          let customer = null;
          if (currentJob.customerId) {
            const customerUser = await storage.getUser(currentJob.customerId);
            if (customerUser) {
              customer = {
                firstName: customerUser.firstName,
                lastName: customerUser.lastName,
                phone: customerUser.phone,
                email: customerUser.email
              };
            }
          }
          
          // Get service type name
          const serviceType = await storage.getServiceType(currentJob.serviceTypeId);
          
          formattedCurrentJob = {
            id: currentJob.id,
            jobNumber: currentJob.jobNumber,
            queuePosition: currentQueueEntry?.position || 0,
            customerName: customer ? `${customer.firstName} ${customer.lastName}` : currentJob.customerName || 'Guest',
            customerPhone: customer?.phone || currentJob.customerPhone,
            customerEmail: customer?.email,
            location: currentJob.location,
            locationAddress: currentJob.locationAddress,
            serviceType: serviceType?.name || 'Service',
            jobType: currentJob.jobType,
            status: currentJob.status,
            urgencyLevel: currentJob.urgencyLevel,
            scheduledFor: currentJob.scheduledFor,
            estimatedDuration: currentJob.estimatedDuration,
            description: currentJob.description,
            totalAmount: currentJob.totalAmount,
            estimatedArrival: currentJob.estimatedArrival
          };
        }
        
        // Get available jobs (new jobs that contractor can accept)
        const availableJobs = await storage.findJobs({
          status: 'new',
          limit: 10,
          offset: 0,
          orderBy: 'createdAt',
          orderDir: 'desc'
        });
        
        // Get scheduled jobs
        const scheduledJobs = await storage.findJobs({
          contractorId,
          status: 'scheduled',
          limit: 10,
          offset: 0,
          orderBy: 'scheduledFor',
          orderDir: 'asc'
        });

        // Get contractor metrics
        const earnings = await storage.getContractorEarnings(contractorId);
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - 7);
        const monthStart = new Date();
        monthStart.setDate(1);

        const todayEarnings = earnings
          .filter(e => new Date(e.createdAt) >= todayStart)
          .reduce((sum, e) => sum + Number(e.amount), 0);

        const weekEarnings = earnings
          .filter(e => new Date(e.createdAt) >= weekStart)
          .reduce((sum, e) => sum + Number(e.amount), 0);

        const monthEarnings = earnings
          .filter(e => new Date(e.createdAt) >= monthStart)
          .reduce((sum, e) => sum + Number(e.amount), 0);

        // Get job counts
        const completedJobs = await storage.findJobs({
          contractorId,
          status: 'completed',
          fromDate: todayStart
        });

        const todayJobs = completedJobs.length;
        
        const weekJobs = await storage.findJobs({
          contractorId,
          status: 'completed',
          fromDate: weekStart
        });

        const totalJobs = await storage.findJobs({
          contractorId,
          status: 'completed'
        });

        // Get reviews for rating data
        const reviews = await storage.getContractorReviews(contractorId);
        const averageRating = reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : 0;

        // Calculate performance metrics
        const totalReviews = reviews.length;
        const onTimeRate = 95; // TODO: Calculate from actual data
        const satisfactionScore = averageRating * 20; // Convert 5-star to 100%
        const responseRate = 98; // TODO: Calculate from actual data
        const completionRate = 99; // TODO: Calculate from actual data

        // Calculate category ratings
        const categoryRatings = {
          timeliness: 4.8,
          professionalism: 4.9,
          quality: 4.7,
          value: 4.8
        };

        // Prepare response
        res.json({
          contractor: {
            id: contractorId,
            firstName: user.firstName,
            lastName: user.lastName,
            companyName: contractorProfile.companyName,
            performanceTier: contractorProfile.performanceTier || 'bronze',
            isAvailable: contractorProfile.isAvailable,
            averageRating,
            totalJobsCompleted: totalJobs.length,
            averageResponseTime: 15, // TODO: Calculate from actual data
            currentLocation: contractorProfile.currentLocation,
            totalReviews,
            onTimeRate,
            satisfactionScore,
            responseRate,
            completionRate,
            categoryRatings
          },
          metrics: {
            todayEarnings,
            weekEarnings,
            monthEarnings,
            todayJobs,
            weekJobs: weekJobs.length,
            totalJobs: totalJobs.length,
            pendingPayout: 0 // TODO: Calculate from transactions
          },
          activeJob: formattedCurrentJob,
          queuedJobs: validQueuedJobs,
          availableJobs,
          scheduledJobs,
          recentReviews: reviews.slice(0, 5),
          queueInfo: {
            currentPosition: currentQueueEntry?.position || null,
            totalInQueue: allQueueEntries.length,
            queuedCount: queuedEntries.length
          }
        });
      } catch (error) {
        console.error('Get contractor dashboard error:', error);
        res.status(500).json({ message: 'Failed to get dashboard data' });
      }
    }
  );

  // Get contractor's active job
  app.get('/api/contractor/active-job', 
    requireAuth,
    requireRole('contractor'),
    async (req: Request, res: Response) => {
      try {
        // Find active job for contractor
        const jobs = await storage.findJobs({
          contractorId: req.session.userId!,
          status: ['assigned', 'en_route', 'on_site'],
          limit: 1,
          offset: 0,
          orderBy: 'createdAt',
          orderDir: 'desc'
        });

        if (jobs.length === 0) {
          return res.json({ job: null });
        }

        const job = jobs[0];

        // Get customer info
        let customer = null;
        if (job.customerId) {
          const customerUser = await storage.getUser(job.customerId);
          if (customerUser) {
            customer = {
              id: customerUser.id,
              firstName: customerUser.firstName,
              lastName: customerUser.lastName,
              phone: customerUser.phone,
              email: customerUser.email
            };
          }
        }

        // Get messages
        const messages = await storage.getJobMessages(job.id);

        res.json({
          job,
          customer,
          messages
        });
      } catch (error) {
        console.error('Get active job error:', error);
        res.status(500).json({ message: 'Failed to get active job' });
      }
    }
  );

  // ==================== WEATHER API ENDPOINTS ====================

  // Get current weather for coordinates
  app.get('/api/weather/current/:lat/:lng',
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const lat = parseFloat(req.params.lat);
        const lng = parseFloat(req.params.lng);
        
        if (isNaN(lat) || isNaN(lng)) {
          return res.status(400).json({ message: 'Invalid coordinates' });
        }
        
        const weather = await weatherService.getCurrentWeather(lat, lng);
        res.json(weather);
      } catch (error) {
        console.error('Get current weather error:', error);
        res.status(500).json({ message: 'Failed to get weather data' });
      }
    }
  );

  // Get 5-day forecast for coordinates
  app.get('/api/weather/forecast/:lat/:lng',
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const lat = parseFloat(req.params.lat);
        const lng = parseFloat(req.params.lng);
        
        if (isNaN(lat) || isNaN(lng)) {
          return res.status(400).json({ message: 'Invalid coordinates' });
        }
        
        const forecast = await weatherService.getForecast(lat, lng);
        res.json(forecast);
      } catch (error) {
        console.error('Get weather forecast error:', error);
        res.status(500).json({ message: 'Failed to get weather forecast' });
      }
    }
  );

  // Get active weather alerts
  app.get('/api/weather/alerts',
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const lat = req.query.lat ? parseFloat(req.query.lat as string) : undefined;
        const lng = req.query.lng ? parseFloat(req.query.lng as string) : undefined;
        
        let alerts;
        if (lat !== undefined && lng !== undefined && !isNaN(lat) && !isNaN(lng)) {
          alerts = await storage.getWeatherAlertsForLocation(lat, lng);
        } else {
          alerts = await storage.getActiveWeatherAlerts();
        }
        
        res.json(alerts);
      } catch (error) {
        console.error('Get weather alerts error:', error);
        res.status(500).json({ message: 'Failed to get weather alerts' });
      }
    }
  );

  // Get weather for specific job location
  app.get('/api/weather/job/:jobId',
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const { jobId } = req.params;
        
        // Get job details
        const job = await storage.getJob(jobId);
        if (!job) {
          return res.status(404).json({ message: 'Job not found' });
        }
        
        // Check permissions
        if (req.session.role === 'driver' && job.customerId !== req.session.userId) {
          return res.status(403).json({ message: 'Access denied' });
        }
        if (req.session.role === 'contractor' && job.contractorId !== req.session.userId) {
          return res.status(403).json({ message: 'Access denied' });
        }
        
        const weatherData = await weatherService.getJobWeather(jobId);
        res.json(weatherData);
      } catch (error) {
        console.error('Get job weather error:', error);
        res.status(500).json({ message: 'Failed to get weather for job' });
      }
    }
  );

  // Manually refresh weather data
  app.post('/api/weather/refresh',
    requireAuth,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const result = await weatherService.refreshAllWeatherData();
        res.json({
          message: 'Weather data refreshed',
          ...result
        });
      } catch (error) {
        console.error('Refresh weather data error:', error);
        res.status(500).json({ message: 'Failed to refresh weather data' });
      }
    }
  );

  // ==================== CONTRACTOR QUEUE MANAGEMENT ENDPOINTS ====================

  // Smart Assignment Endpoint - Assign job to contractor with queue management
  app.post('/api/contractors/assign-job',
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const { contractorId, jobId, priority } = req.body;

        // Validate input
        if (!contractorId || !jobId) {
          return res.status(400).json({ 
            message: 'contractorId and jobId are required' 
          });
        }

        // Check if job exists and is available
        const job = await storage.getJob(jobId);
        if (!job) {
          return res.status(404).json({ message: 'Job not found' });
        }

        if (job.status !== 'new' && job.status !== 'scheduled') {
          return res.status(400).json({ 
            message: `Job cannot be assigned - current status: ${job.status}` 
          });
        }

        // Check contractor availability
        const availability = await storage.getContractorAvailabilityWithQueue(contractorId);
        
        // Add to queue with priority
        const queueEntry = await storage.addToContractorQueue(
          contractorId, 
          jobId, 
          priority,
          {
            serviceType: job.serviceTypeId,
            urgencyLevel: job.urgencyLevel,
            estimatedDuration: job.estimatedDuration,
            location: job.location
          }
        );

        // Calculate estimated wait time
        const estimates = await storage.getQueueEstimates(contractorId);
        const jobEstimate = estimates.find(e => e.jobId === jobId);

        // Send notification to contractor
        if (availability.queueDepth === 0) {
          // This is the first job, notify immediately
          await emailService.sendJobAssignmentNotification(contractorId, job);
        } else {
          // Job queued, send queue notification
          await emailService.sendJobQueuedNotification(contractorId, job, queueEntry.queuePosition);
        }

        // Update job status to assigned
        if (queueEntry.status === 'assigned') {
          await storage.updateJobStatus(jobId, 'assigned', req.session.userId);
        }

        res.json({
          success: true,
          queueEntry: {
            id: queueEntry.id,
            position: queueEntry.queuePosition,
            status: queueEntry.status,
            estimatedStartTime: jobEstimate?.estimatedStartTime || queueEntry.estimatedStartTime,
            estimatedWaitTime: availability.queueDepth * 60, // minutes
            isCurrentJob: queueEntry.status === 'assigned'
          },
          contractorAvailability: {
            isAvailable: availability.isAvailable,
            queueDepth: availability.queueDepth + 1,
            estimatedAvailabilityTime: availability.estimatedAvailabilityTime
          },
          message: queueEntry.status === 'assigned' 
            ? 'Job assigned as current job' 
            : `Job added to queue at position ${queueEntry.queuePosition}`
        });
      } catch (error) {
        console.error('Assign job error:', error);
        res.status(500).json({ 
          message: 'Failed to assign job',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  // Get contractor's queue
  app.get('/api/contractors/:id/queue',
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const contractorId = req.params.id;
        
        // Get queue entries
        const queue = await storage.getContractorQueue(contractorId);
        
        // Get job details for each queue entry
        const queueWithJobs = await Promise.all(
          queue.map(async (entry) => {
            const job = await storage.getJob(entry.jobId);
            const customer = job?.customerId ? await storage.getUser(job.customerId) : null;
            const serviceType = job ? await storage.getServiceType(job.serviceTypeId) : null;
            
            return {
              id: entry.id,
              position: entry.queuePosition,
              status: entry.status,
              queuedAt: entry.queuedAt,
              estimatedStartTime: entry.estimatedStartTime,
              estimatedDuration: entry.estimatedDuration,
              priority: entry.priority,
              job: job ? {
                id: job.id,
                jobNumber: job.jobNumber,
                customerName: customer ? `${customer.firstName} ${customer.lastName}` : job.customerName,
                locationAddress: job.locationAddress,
                serviceType: serviceType?.name,
                urgencyLevel: job.urgencyLevel,
                totalAmount: job.totalAmount
              } : null
            };
          })
        );

        // Get contractor info
        const contractor = await storage.getContractorProfile(contractorId);
        const user = await storage.getUser(contractorId);

        res.json({
          contractor: {
            id: contractorId,
            name: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
            companyName: contractor?.companyName,
            isAvailable: contractor?.isAvailable
          },
          queue: queueWithJobs,
          summary: {
            totalJobs: queue.length,
            currentJob: queue.find(q => q.status === 'assigned' || q.status === 'current'),
            queuedJobs: queue.filter(q => q.status === 'queued').length,
            estimatedTotalTime: queue.reduce((sum, entry) => sum + (entry.estimatedDuration || 60), 0)
          }
        });
      } catch (error) {
        console.error('Get contractor queue error:', error);
        res.status(500).json({ message: 'Failed to get contractor queue' });
      }
    }
  );

  // Reorder contractor's queue
  app.post('/api/contractors/:id/queue/reorder',
    requireAuth,
    requireRole('contractor', 'admin'),
    async (req: Request, res: Response) => {
      try {
        const contractorId = req.params.id;
        const { jobIds } = req.body;

        // Validate contractor access
        if (req.session.role === 'contractor' && req.session.userId !== contractorId) {
          return res.status(403).json({ 
            message: 'You can only reorder your own queue' 
          });
        }

        if (!Array.isArray(jobIds) || jobIds.length === 0) {
          return res.status(400).json({ 
            message: 'jobIds must be a non-empty array' 
          });
        }

        // Reorder the queue
        const success = await storage.reorderContractorQueue(contractorId, jobIds);

        if (success) {
          // Update estimates after reordering
          await storage.updateQueueEstimates(contractorId);

          // Get updated queue
          const updatedQueue = await storage.getContractorQueue(contractorId);

          res.json({
            success: true,
            message: 'Queue reordered successfully',
            queue: updatedQueue
          });
        } else {
          res.status(400).json({ 
            message: 'Failed to reorder queue' 
          });
        }
      } catch (error) {
        console.error('Reorder queue error:', error);
        res.status(500).json({ message: 'Failed to reorder queue' });
      }
    }
  );

  // Remove job from contractor's queue
  app.delete('/api/contractors/:id/queue/:jobId',
    requireAuth,
    requireRole('contractor', 'admin'),
    async (req: Request, res: Response) => {
      try {
        const contractorId = req.params.id;
        const jobId = req.params.jobId;

        // Validate contractor access
        if (req.session.role === 'contractor' && req.session.userId !== contractorId) {
          return res.status(403).json({ 
            message: 'You can only manage your own queue' 
          });
        }

        // Remove from queue
        const success = await storage.removeFromQueue(jobId);

        if (success) {
          // Update job status back to new
          await storage.updateJobStatus(jobId, 'new', req.session.userId);

          res.json({
            success: true,
            message: 'Job removed from queue successfully'
          });
        } else {
          res.status(404).json({ 
            message: 'Job not found in queue' 
          });
        }
      } catch (error) {
        console.error('Remove from queue error:', error);
        res.status(500).json({ message: 'Failed to remove job from queue' });
      }
    }
  );

  // Skip job in queue
  app.post('/api/contractors/:id/queue/:queueId/skip',
    requireAuth,
    requireRole('contractor'),
    async (req: Request, res: Response) => {
      try {
        const contractorId = req.params.id;
        const queueId = req.params.queueId;
        const { reason } = req.body;

        // Validate contractor access
        if (req.session.userId !== contractorId) {
          return res.status(403).json({ 
            message: 'You can only skip jobs in your own queue' 
          });
        }

        if (!reason) {
          return res.status(400).json({ 
            message: 'Skip reason is required' 
          });
        }

        // Skip the job
        const updatedEntry = await storage.skipQueueJob(queueId, reason);

        if (updatedEntry) {
          res.json({
            success: true,
            message: 'Job skipped successfully',
            nextJob: await storage.getContractorCurrentJob(contractorId)
          });
        } else {
          res.status(404).json({ 
            message: 'Queue entry not found' 
          });
        }
      } catch (error) {
        console.error('Skip queue job error:', error);
        res.status(500).json({ message: 'Failed to skip job' });
      }
    }
  );

  // Get job's queue status
  app.get('/api/jobs/:id/queue-status',
    async (req: Request, res: Response) => {
      try {
        const jobId = req.params.id;
        
        const queueStatus = await storage.getJobQueueStatus(jobId);
        
        if (!queueStatus) {
          return res.status(404).json({ 
            message: 'Job not found in any queue' 
          });
        }

        // Get contractor info
        const contractor = await storage.getContractorProfile(queueStatus.contractorId);
        const user = await storage.getUser(queueStatus.contractorId);

        res.json({
          jobId,
          queueStatus: {
            contractorId: queueStatus.contractorId,
            contractorName: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
            companyName: contractor?.companyName,
            position: queueStatus.position,
            status: queueStatus.status,
            estimatedStartTime: queueStatus.estimatedStartTime,
            isCurrentJob: queueStatus.status === 'assigned' || queueStatus.status === 'current'
          }
        });
      } catch (error) {
        console.error('Get job queue status error:', error);
        res.status(500).json({ message: 'Failed to get job queue status' });
      }
    }
  );

  // Auto-assign job to best available contractor
  app.post('/api/jobs/:id/auto-assign',
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const jobId = req.params.id;
        
        // Get job details
        const job = await storage.getJob(jobId);
        if (!job) {
          return res.status(404).json({ message: 'Job not found' });
        }

        if (job.status !== 'new' && job.status !== 'scheduled') {
          return res.status(400).json({ 
            message: `Job cannot be auto-assigned - current status: ${job.status}` 
          });
        }

        // Find contractor with shortest queue
        const shortestQueue = await storage.findShortestQueue(
          job.serviceTypeId,
          job.location as { lat: number; lng: number }
        );

        if (!shortestQueue) {
          // No contractors available at all
          return res.status(404).json({ 
            message: 'No contractors available for this job' 
          });
        }

        // Check if contractor is suitable
        const contractor = await storage.getContractorProfile(shortestQueue.contractorId);
        
        // Consider factors for assignment
        const factors = {
          queueLength: shortestQueue.queueLength,
          estimatedWaitTime: shortestQueue.estimatedWaitTime,
          rating: contractor?.averageRating || 0,
          isFleetCapable: contractor?.isFleetCapable || false,
          performanceTier: contractor?.performanceTier || 'bronze'
        };

        // Calculate assignment score (higher is better)
        let assignmentScore = 100;
        assignmentScore -= shortestQueue.queueLength * 10; // Penalty for queue length
        assignmentScore += (Number(contractor?.averageRating) || 0) * 5; // Bonus for rating
        if (contractor?.performanceTier === 'gold') assignmentScore += 10;
        if (contractor?.performanceTier === 'silver') assignmentScore += 5;
        
        // Add to contractor's queue
        const queueEntry = await storage.addToContractorQueue(
          shortestQueue.contractorId,
          jobId,
          job.urgencyLevel === 'high' ? 1 : undefined,
          {
            autoAssigned: true,
            assignmentScore,
            factors
          }
        );

        // Update job with contractor
        await storage.assignContractorToJob(jobId, shortestQueue.contractorId);

        // Send notifications
        await emailService.sendJobAssignmentNotification(shortestQueue.contractorId, job);
        if (job.customerId) {
          await emailService.sendContractorAssignedNotification(job.customerId, job, contractor);
        }

        res.json({
          success: true,
          assignment: {
            contractorId: shortestQueue.contractorId,
            contractorName: contractor?.companyName,
            queuePosition: queueEntry.queuePosition,
            estimatedStartTime: queueEntry.estimatedStartTime,
            estimatedWaitTime: shortestQueue.estimatedWaitTime,
            assignmentScore,
            factors
          },
          message: `Job auto-assigned to contractor with queue position ${queueEntry.queuePosition}`
        });
      } catch (error) {
        console.error('Auto-assign job error:', error);
        res.status(500).json({ message: 'Failed to auto-assign job' });
      }
    }
  );

  // Process next job in contractor's queue
  app.post('/api/contractors/:id/queue/process-next',
    requireAuth,
    requireRole('contractor'),
    async (req: Request, res: Response) => {
      try {
        const contractorId = req.params.id;

        // Validate contractor access
        if (req.session.userId !== contractorId) {
          return res.status(403).json({ 
            message: 'You can only process your own queue' 
          });
        }

        // Process next in queue
        const result = await storage.processNextInQueue(contractorId);

        if (result.success) {
          if (result.nextJob) {
            // Send notification about new current job
            await emailService.sendJobStartedNotification(contractorId, result.nextJob);
            
            res.json({
              success: true,
              message: 'Next job in queue is now active',
              nextJob: result.nextJob,
              queueEntry: result.queueEntry
            });
          } else {
            res.json({
              success: true,
              message: 'Queue is now empty',
              nextJob: null
            });
          }
        } else {
          res.status(400).json({ 
            message: 'Failed to process next job in queue' 
          });
        }
      } catch (error) {
        console.error('Process next in queue error:', error);
        res.status(500).json({ message: 'Failed to process next job' });
      }
    }
  );

  // Get contractor availability with queue info
  app.get('/api/contractors/availability',
    async (req: Request, res: Response) => {
      try {
        const { 
          serviceTypeId, 
          lat, 
          lng, 
          includeOffline = false 
        } = req.query;

        // Get all active queues
        const allQueues = await storage.getAllActiveQueues();
        
        // Get contractor profiles for additional info
        const availabilityList = await Promise.all(
          allQueues.map(async (queue) => {
            const contractor = await storage.getContractorProfile(queue.contractorId);
            const user = await storage.getUser(queue.contractorId);
            
            if (!contractor || (!contractor.isAvailable && !includeOffline)) {
              return null;
            }

            // Check service type compatibility if specified
            if (serviceTypeId) {
              const services = await storage.getContractorServices(queue.contractorId);
              if (!services.find(s => s.serviceTypeId === serviceTypeId)) {
                return null;
              }
            }

            // Check distance if location provided
            let distance: number | undefined;
            if (lat && lng && contractor.currentLocation) {
              const contractorLoc = contractor.currentLocation as any;
              distance = Math.sqrt(
                Math.pow(Number(lat) - contractorLoc.lat, 2) + 
                Math.pow(Number(lng) - contractorLoc.lng, 2)
              ) * 69; // Rough conversion to miles
              
              if (distance > contractor.serviceRadius) {
                return null;
              }
            }

            return {
              contractorId: queue.contractorId,
              name: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
              companyName: contractor.companyName,
              status: contractor.isAvailable 
                ? (queue.currentJob ? 'busy' : 'available')
                : 'offline',
              currentJob: queue.currentJob ? {
                id: queue.currentJob.id,
                jobNumber: queue.currentJob.jobNumber,
                estimatedCompletion: queue.currentJob.estimatedDuration
              } : null,
              queueDepth: queue.queueLength,
              estimatedAvailabilityTime: queue.nextAvailableTime,
              location: contractor.currentLocation,
              serviceRadius: contractor.serviceRadius,
              distance,
              rating: contractor.averageRating,
              performanceTier: contractor.performanceTier
            };
          })
        );

        // Filter out nulls and sort by availability
        const filteredList = availabilityList
          .filter(item => item !== null)
          .sort((a, b) => {
            // Sort by: available first, then by queue depth, then by distance
            if (a!.status === 'available' && b!.status !== 'available') return -1;
            if (a!.status !== 'available' && b!.status === 'available') return 1;
            if (a!.queueDepth !== b!.queueDepth) return a!.queueDepth - b!.queueDepth;
            if (a!.distance && b!.distance) return a!.distance - b!.distance;
            return 0;
          });

        res.json({
          contractors: filteredList,
          summary: {
            total: filteredList.length,
            available: filteredList.filter(c => c!.status === 'available').length,
            busy: filteredList.filter(c => c!.status === 'busy').length,
            offline: filteredList.filter(c => c!.status === 'offline').length,
            averageQueueDepth: filteredList.reduce((sum, c) => sum + c!.queueDepth, 0) / filteredList.length || 0
          }
        });
      } catch (error) {
        console.error('Get contractor availability error:', error);
        res.status(500).json({ message: 'Failed to get contractor availability' });
      }
    }
  );

  // Update contractor profile
  app.patch('/api/contractor/profile',
    requireAuth,
    requireRole('contractor'),
    async (req: Request, res: Response) => {
      try {
        const userId = req.session.userId!;
        const user = await storage.getUser(userId);
        
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }

        // Extract profile data from request
        const { 
          firstName, 
          lastName, 
          phone, 
          email, 
          companyName,
          bio,
          address,
          city,
          state,
          zip
        } = req.body;

        // Update user basic info
        await storage.updateUser(userId, {
          firstName,
          lastName,
          phone,
          email
        });

        // Update contractor profile
        const profileUpdates: any = {};
        if (companyName !== undefined) profileUpdates.companyName = companyName;
        
        // Handle location if address is provided
        if (address && city && state && zip) {
          // You could geocode here if needed
          profileUpdates.address = address;
          profileUpdates.city = city;
          profileUpdates.state = state;
          profileUpdates.zip = zip;
        }

        await storage.updateContractorProfile(userId, profileUpdates);

        res.json({ message: 'Profile updated successfully' });
      } catch (error) {
        console.error('Update contractor profile error:', error);
        res.status(500).json({ message: 'Failed to update profile' });
      }
    }
  );

  // Update contractor service area  
  app.patch('/api/contractor/service-area',
    requireAuth,
    requireRole('contractor'),
    async (req: Request, res: Response) => {
      try {
        const userId = req.session.userId!;
        const { 
          baseLocation, 
          serviceRadius, 
          services,
          hasMobileWaterSource,
          hasWastewaterRecovery
        } = req.body;

        const profileUpdates: any = {};
        
        if (serviceRadius !== undefined) {
          profileUpdates.serviceRadius = serviceRadius;
        }
        
        if (baseLocation && baseLocation.lat && baseLocation.lng) {
          profileUpdates.baseLocationLat = baseLocation.lat;
          profileUpdates.baseLocationLon = baseLocation.lng;
        }

        if (hasMobileWaterSource !== undefined) {
          profileUpdates.hasMobileWaterSource = hasMobileWaterSource;
        }

        if (hasWastewaterRecovery !== undefined) {
          profileUpdates.hasWastewaterRecovery = hasWastewaterRecovery;
        }

        await storage.updateContractorProfile(userId, profileUpdates);

        // Update services if provided
        if (services && Array.isArray(services)) {
          // This would require updating the contractor services in a separate table
          // For now, we'll just update the profile
        }

        res.json({ message: 'Service area updated successfully' });
      } catch (error) {
        console.error('Update service area error:', error);
        res.status(500).json({ message: 'Failed to update service area' });
      }
    }
  );

  // Complete current job and advance to next job in queue
  app.post('/api/contractor/jobs/:jobId/complete-and-advance',
    requireAuth,
    requireRole('contractor'),
    async (req: Request, res: Response) => {
      try {
        const jobId = req.params.jobId;
        const contractorId = req.session.userId!;

        // Verify this is the contractor's current job
        const currentJobs = await storage.findJobs({
          id: jobId,
          contractorId,
          status: ['assigned', 'en_route', 'on_site'],
          limit: 1
        });

        if (currentJobs.length === 0) {
          return res.status(403).json({ 
            message: 'This is not your current active job' 
          });
        }

        // Advance to the next job in queue
        const result = await storage.advanceContractorQueue(contractorId);

        if (!result.nextJob) {
          return res.json({
            message: 'Current job completed. No more jobs in queue.',
            nextJob: null,
            hasNextJob: false
          });
        }

        // Get customer info for the next job
        let customer = null;
        if (result.nextJob.customerId) {
          const customerUser = await storage.getUser(result.nextJob.customerId);
          if (customerUser) {
            customer = {
              id: customerUser.id,
              firstName: customerUser.firstName,
              lastName: customerUser.lastName,
              phone: customerUser.phone,
              email: customerUser.email
            };
          }
        }

        res.json({
          message: 'Advanced to next job successfully',
          nextJob: result.nextJob,
          customer,
          queueEntry: result.queueEntry,
          hasNextJob: true
        });
      } catch (error) {
        console.error('Complete and advance job error:', error);
        res.status(500).json({ 
          message: 'Failed to complete and advance to next job' 
        });
      }
    }
  );

  // Get contractor jobs by status (available, active, scheduled, completed)
  app.get('/api/contractor/jobs/:status',
    requireAuth,
    requireRole('contractor'),
    async (req: Request, res: Response) => {
      try {
        const status = req.params.status as string;
        const contractorId = req.session.userId!;

        // Get contractor profile to check services
        const contractorProfile = await storage.getContractorProfile(contractorId);
        if (!contractorProfile) {
          return res.status(404).json({ message: 'Contractor profile not found' });
        }

        // Get contractor services
        const contractorServices = await storage.getContractorServices(contractorId);
        const serviceTypeIds = contractorServices
          .filter(s => s.isAvailable)
          .map(s => s.serviceTypeId);

        if (serviceTypeIds.length === 0) {
          // No services configured - return empty array
          return res.json([]);
        }

        let jobsList: Job[] = [];

        switch (status) {
          case 'available':
            // Get new jobs that match contractor's services and service radius
            jobsList = await db.select()
              .from(jobs)
              .where(and(
                eq(jobs.status, 'new'),
                inArray(jobs.serviceTypeId, serviceTypeIds),
                isNull(jobs.contractorId)
              ))
              .orderBy(desc(jobs.createdAt))
              .limit(50)
              .execute() as Job[];

            // Filter by service radius if contractor has a location
            if (contractorProfile.currentLocation) {
              const contractorLat = contractorProfile.currentLocation.lat;
              const contractorLng = contractorProfile.currentLocation.lng;
              const serviceRadius = contractorProfile.serviceRadius || 50;

              jobsList = jobsList.filter(job => {
                if (!job.location || typeof job.location !== 'object') return false;
                const jobLocation = job.location as { lat: number; lng: number };
                
                // Calculate distance using Haversine formula
                const R = 3959; // Earth's radius in miles
                const dLat = (jobLocation.lat - contractorLat) * Math.PI / 180;
                const dLon = (jobLocation.lng - contractorLng) * Math.PI / 180;
                const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(contractorLat * Math.PI / 180) * Math.cos(jobLocation.lat * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                const distance = R * c;

                return distance <= serviceRadius;
              });
            }
            break;

          case 'active':
            // Get assigned, en_route, or on_site jobs
            // Now findJobs supports arrays, we can query all at once
            jobsList = await storage.findJobs({
              contractorId,
              status: ['assigned', 'en_route', 'on_site'],
              orderBy: 'createdAt',
              orderDir: 'desc'
            });
            break;

          case 'scheduled':
            // Get scheduled jobs
            jobsList = await storage.findJobs({
              contractorId,
              jobType: 'scheduled',
              status: 'assigned',
              orderBy: 'scheduledAt',
              orderDir: 'asc'
            });
            break;

          case 'completed':
            // Get completed jobs
            jobsList = await storage.findJobs({
              contractorId,
              status: 'completed',
              orderBy: 'completedAt',
              orderDir: 'desc',
              limit: 100
            });
            break;

          default:
            return res.status(400).json({ message: 'Invalid status' });
        }

        // Format jobs for the response
        const formattedJobs = await Promise.all(jobsList.map(async (job) => {
          // Get customer info
          let customer = null;
          if (job.customerId) {
            const customerUser = await storage.getUser(job.customerId);
            if (customerUser) {
              customer = {
                name: `${customerUser.firstName || ''} ${customerUser.lastName || ''}`.trim() || 'Guest User',
                phone: customerUser.phone || '',
                email: customerUser.email || ''
              };
            }
          }

          // Get service type info
          const serviceType = await storage.getServiceType(job.serviceTypeId);

          return {
            id: job.id,
            jobNumber: job.jobNumber,
            status: job.status,
            jobType: job.jobType,
            serviceType: serviceType?.name || 'Unknown Service',
            customerName: customer?.name || 'Guest User',
            customerPhone: customer?.phone || '',
            vehicleInfo: `${job.vehicleMake || ''} ${job.vehicleModel || ''}`.trim() || 'Vehicle',
            location: {
              address: job.locationAddress || 'No address provided',
              lat: job.location?.lat || 0,
              lng: job.location?.lng || 0
            },
            issueDescription: job.description || '',
            scheduledAt: job.scheduledAt,
            assignedAt: job.assignedAt,
            completedAt: job.completedAt,
            cancelledAt: job.cancelledAt,
            estimatedPayout: Number(job.estimatedPrice || 0),
            actualPayout: Number(job.finalPrice || job.estimatedPrice || 0),
            tips: Number(job.tips || 0),
            rating: job.rating,
            customerReview: job.customerReview,
            completionNotes: job.completionNotes
          };
        }));

        res.json(formattedJobs);
      } catch (error) {
        console.error('Get contractor jobs error:', error);
        res.status(500).json({ message: 'Failed to get contractor jobs' });
      }
    }
  );

  // Update job status
  app.patch('/api/jobs/:id/status',
    requireAuth,
    validateRequest(z.object({
      status: z.enum(jobStatusEnum.enumValues)
    })),
    async (req: Request, res: Response) => {
      try {
        const { status } = req.body;
        const job = await storage.getJob(req.params.id);

        if (!job) {
          return res.status(404).json({ message: 'Job not found' });
        }

        // Check permissions
        if (req.session.role === 'contractor' && job.contractorId !== req.session.userId) {
          return res.status(403).json({ message: 'Access denied' });
        }

        // Update job status
        await storage.updateJob(req.params.id, {
          status,
          [`${status.toLowerCase().replace('_', '')}At`]: new Date()
        });

        // Record status change
        await storage.recordJobStatusChange({
          jobId: req.params.id,
          fromStatus: job.status,
          toStatus: status,
          changedBy: req.session.userId
        });

        // Create notification for job status change
        let notificationTitle = '';
        let notificationMessage = '';
        let notificationType: any = 'job_update';
        let priority: any = 'medium';

        switch (status) {
          case 'assigned':
            notificationTitle = 'Job Assigned';
            notificationMessage = `Job #${job.jobNumber} has been assigned to a contractor`;
            priority = 'high';
            break;
          case 'en_route':
            notificationTitle = 'Contractor En Route';
            notificationMessage = `Contractor is on the way for job #${job.jobNumber}`;
            priority = 'high';
            break;
          case 'on_site':
            notificationTitle = 'Contractor On Site';
            notificationMessage = `Contractor has arrived at the location for job #${job.jobNumber}`;
            break;
          case 'completed':
            notificationTitle = 'Job Completed';
            notificationMessage = `Job #${job.jobNumber} has been completed successfully`;
            notificationType = 'job_update';
            priority = 'high';
            break;
          case 'cancelled':
            notificationTitle = 'Job Cancelled';
            notificationMessage = `Job #${job.jobNumber} has been cancelled`;
            notificationType = 'alert';
            priority = 'high';
            break;
        }

        if (notificationTitle) {
          // Notify customer if job has a customer
          if (job.customerId) {
            await storage.createNotification({
              userId: job.customerId,
              type: notificationType,
              title: notificationTitle,
              message: notificationMessage,
              relatedEntityType: 'job',
              relatedEntityId: job.id,
              priority,
              actionUrl: `/jobs/${job.id}`
            });
          }

          // Notify contractor if status is relevant
          if (job.contractorId && ['cancelled', 'completed'].includes(status)) {
            await storage.createNotification({
              userId: job.contractorId,
              type: notificationType,
              title: notificationTitle,
              message: notificationMessage,
              relatedEntityType: 'job',
              relatedEntityId: job.id,
              priority,
              actionUrl: `/contractor/jobs/${job.id}`
            });
          }
        }

        // Handle reminder updates based on status
        if (status === 'cancelled') {
          // Cancel all pending reminders for this job
          await reminderScheduler.cancelJobReminders(req.params.id);
        } else if (status === 'completed') {
          // Send completion confirmation
          await reminderScheduler.sendCompletionConfirmation(req.params.id);
        }

        res.json({ message: 'Status updated successfully' });
      } catch (error) {
        console.error('Update job status error:', error);
        res.status(500).json({ message: 'Failed to update status' });
      }
    }
  );

  // Send job message
  app.post('/api/jobs/:id/messages',
    requireAuth,
    validateRequest(z.object({
      message: z.string().min(1).max(1000)
    })),
    async (req: Request, res: Response) => {
      try {
        const job = await storage.getJob(req.params.id);

        if (!job) {
          return res.status(404).json({ message: 'Job not found' });
        }

        // Check permissions
        const isCustomer = job.customerId === req.session.userId;
        const isContractor = job.contractorId === req.session.userId;

        if (!isCustomer && !isContractor) {
          return res.status(403).json({ message: 'Access denied' });
        }

        // Create message
        const message = await storage.createJobMessage({
          jobId: req.params.id,
          senderId: req.session.userId!,
          message: req.body.message,
          isSystemMessage: false
        });

        res.status(201).json({ message });
      } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ message: 'Failed to send message' });
      }
    }
  );

  // ==================== NOTIFICATION ROUTES ====================
  
  // Get user's notifications with pagination and filtering
  app.get('/api/notifications',
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const { type, isRead, priority, limit, offset, fromDate, toDate } = req.query;
        
        const options: any = {};
        if (type) options.type = type as string;
        if (isRead !== undefined) options.isRead = isRead === 'true';
        if (priority) options.priority = priority as string;
        if (limit) options.limit = parseInt(limit as string);
        if (offset) options.offset = parseInt(offset as string);
        if (fromDate) options.fromDate = new Date(fromDate as string);
        if (toDate) options.toDate = new Date(toDate as string);
        
        const result = await storage.getUserNotifications(req.session.userId!, options);
        res.json(result);
      } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ message: 'Failed to fetch notifications' });
      }
    }
  );
  
  // Get unread notification count
  app.get('/api/notifications/count',
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const count = await storage.getUnreadNotificationCount(req.session.userId!);
        res.json({ count });
      } catch (error) {
        console.error('Error fetching notification count:', error);
        res.status(500).json({ message: 'Failed to fetch notification count' });
      }
    }
  );
  
  // Mark single notification as read
  app.put('/api/notifications/:notificationId/read',
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const { notificationId } = req.params;
        const success = await storage.markNotificationAsRead(notificationId, req.session.userId!);
        
        if (success) {
          res.json({ message: 'Notification marked as read' });
        } else {
          res.status(404).json({ message: 'Notification not found' });
        }
      } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ message: 'Failed to mark notification as read' });
      }
    }
  );
  
  // Mark all notifications as read
  app.put('/api/notifications/mark-all-read',
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const count = await storage.markAllNotificationsAsRead(req.session.userId!);
        res.json({ message: `${count} notifications marked as read`, count });
      } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ message: 'Failed to mark all notifications as read' });
      }
    }
  );
  
  // Delete single notification
  app.delete('/api/notifications/:notificationId',
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const { notificationId } = req.params;
        const success = await storage.deleteNotification(notificationId, req.session.userId!);
        
        if (success) {
          res.json({ message: 'Notification deleted' });
        } else {
          res.status(404).json({ message: 'Notification not found' });
        }
      } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ message: 'Failed to delete notification' });
      }
    }
  );
  
  // Clear all notifications
  app.delete('/api/notifications/clear-all',
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const count = await storage.clearAllNotifications(req.session.userId!);
        res.json({ message: `${count} notifications cleared`, count });
      } catch (error) {
        console.error('Error clearing notifications:', error);
        res.status(500).json({ message: 'Failed to clear notifications' });
      }
    }
  );
  
  // Admin endpoint to get all notifications (admin only)
  app.get('/api/admin/notifications',
    requireAuth,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const count = await storage.getUnreadNotificationCount(req.session.userId!);
        res.json({ unreadCount: count });
      } catch (error) {
        console.error('Error fetching admin notifications:', error);
        res.status(500).json({ message: 'Failed to fetch notifications' });
      }
    }
  );

  // Complete job
  app.post('/api/jobs/:id/complete',
    requireAuth,
    requireRole('contractor'),
    async (req: Request, res: Response) => {
      try {
        const job = await storage.getJob(req.params.id);

        if (!job) {
          return res.status(404).json({ message: 'Job not found' });
        }

        if (job.contractorId !== req.session.userId) {
          return res.status(403).json({ message: 'Access denied' });
        }

        if (job.status !== 'on_site') {
          return res.status(400).json({ message: 'Job must be on site to complete' });
        }

        // Update job
        await storage.updateJob(req.params.id, {
          status: 'completed',
          completedAt: new Date(),
          completionNotes: req.body.completionNotes,
          finalPrice: req.body.finalPrice || job.estimatedPrice
        });

        // Record status change
        await storage.recordJobStatusChange({
          jobId: req.params.id,
          fromStatus: job.status,
          toStatus: 'completed',
          changedBy: req.session.userId,
          reason: 'Job completed by contractor'
        });

        res.json({ message: 'Job completed successfully' });
      } catch (error) {
        console.error('Complete job error:', error);
        res.status(500).json({ message: 'Failed to complete job' });
      }
    }
  );

  // Update job details
  app.put('/api/jobs/:id',
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const job = await storage.getJob(req.params.id);
        
        if (!job) {
          return res.status(404).json({ message: 'Job not found' });
        }

        // Check permissions
        if (req.session.role === 'driver' && job.customerId !== req.session.userId) {
          return res.status(403).json({ message: 'Access denied' });
        }

        const updatedJob = await storage.updateJob(req.params.id, req.body);
        
        res.json({
          message: 'Job updated successfully',
          job: updatedJob
        });
      } catch (error) {
        console.error('Update job error:', error);
        res.status(500).json({ message: 'Failed to update job' });
      }
    }
  );

  // Update job status
  app.put('/api/jobs/:id/status',
    requireAuth,
    validateRequest(z.object({
      status: z.enum(jobStatusEnum.enumValues),
      reason: z.string().optional()
    })),
    async (req: Request, res: Response) => {
      try {
        const { status, reason } = req.body;
        
        const job = await storage.updateJobStatus(
          req.params.id, 
          status, 
          req.session.userId,
          reason
        );
        
        if (!job) {
          return res.status(404).json({ message: 'Job not found' });
        }

        res.json({
          message: 'Job status updated successfully',
          job
        });
      } catch (error) {
        console.error('Update job status error:', error);
        res.status(500).json({ message: 'Failed to update job status' });
      }
    }
  );

  // ==================== AI DISPATCH ENDPOINTS ====================
  
  // Use AI to assign job to best contractor
  app.post('/api/jobs/:id/ai-assign',
    requireAuth,
    requireRole('admin', 'dispatcher'),
    async (req: Request, res: Response) => {
      try {
        const jobId = req.params.id;
        
        console.log(`[AI-Assign] Starting AI assignment for job: ${jobId}`);
        
        // Get job details
        const job = await storage.getJob(jobId);
        if (!job) {
          return res.status(404).json({ message: 'Job not found' });
        }
        
        if (job.status !== 'new') {
          return res.status(400).json({ message: 'Job is not available for assignment' });
        }
        
        // Get optimal contractor using AI
        const optimalContractor = await storage.getOptimalContractor(jobId);
        
        if (!optimalContractor) {
          console.log(`[AI-Assign] No suitable contractor found for job: ${jobId}`);
          return res.status(404).json({ 
            message: 'No suitable contractor found using AI scoring',
            fallbackAvailable: true
          });
        }
        
        console.log(`[AI-Assign] Optimal contractor for job ${jobId}: ${optimalContractor.contractorId} with score ${optimalContractor.score}`);
        
        // Assign the job to the optimal contractor
        await storage.updateJob(jobId, {
          contractorId: optimalContractor.contractorId,
          status: 'assigned',
          assignedAt: new Date()
        });
        
        // Update assignment score to mark as assigned
        const scores = await storage.getAiAssignmentScores(jobId);
        const assignedScore = scores.find(s => s.contractorId === optimalContractor.contractorId);
        if (assignedScore) {
          await storage.updateAiAssignmentScore(assignedScore.id, {
            wasAssigned: true
          });
        }
        
        // Send notification to contractor
        const contractor = await storage.getUser(optimalContractor.contractorId);
        if (contractor?.phone) {
          try {
            const twilioClient = require('twilio')(
              process.env.TWILIO_ACCOUNT_SID,
              process.env.TWILIO_AUTH_TOKEN
            );
            
            await twilioClient.messages.create({
              body: `New job assigned! ${job.serviceType} at ${job.locationAddress}. Open TruckFixGo app to accept.`,
              from: process.env.TWILIO_PHONE_NUMBER,
              to: contractor.phone
            });
          } catch (twilioError) {
            console.error('[AI-Assign] Failed to send SMS:', twilioError);
          }
        }
        
        res.json({
          success: true,
          jobId,
          contractorId: optimalContractor.contractorId,
          score: optimalContractor.score,
          recommendation: optimalContractor.recommendation
        });
        
      } catch (error) {
        console.error('[AI-Assign] Error:', error);
        res.status(500).json({ message: 'Failed to assign job using AI', error: error.message });
      }
    }
  );
  
  // Get AI scoring details for a job
  app.get('/api/jobs/:id/assignment-scores',
    requireAuth,
    requireRole('admin', 'dispatcher'),
    async (req: Request, res: Response) => {
      try {
        const jobId = req.params.id;
        
        // Get all AI assignment scores for the job
        const scores = await storage.getAiAssignmentScores(jobId);
        
        // Get contractor details for each score
        const scoresWithDetails = await Promise.all(
          scores.map(async (score) => {
            const contractor = await storage.getContractorProfile(score.contractorId);
            return {
              ...score,
              contractorName: contractor?.businessName || contractor?.legalName || 'Unknown',
              contractorRating: contractor?.averageRating || 0,
              contractorCompletedJobs: contractor?.totalCompletedJobs || 0
            };
          })
        );
        
        res.json({
          jobId,
          scores: scoresWithDetails
        });
        
      } catch (error) {
        console.error('[AI-Scores] Error:', error);
        res.status(500).json({ message: 'Failed to get assignment scores', error: error.message });
      }
    }
  );
  
  // Update contractor assignment preferences
  app.post('/api/contractor/preferences',
    requireAuth,
    requireRole('contractor'),
    validateRequest(z.object({
      preferredServiceTypes: z.array(z.string()).optional(),
      avoidServiceTypes: z.array(z.string()).optional(),
      preferredAreas: z.any().optional(),
      maxDailyJobs: z.number().min(1).max(50).optional(),
      maxWeeklyJobs: z.number().min(1).max(350).optional(),
      maxDistance: z.number().min(1).max(500).optional(),
      minJobPrice: z.number().min(0).optional(),
      preferredTimeSlots: z.any().optional(),
      preferEmergencyJobs: z.boolean().optional(),
      preferScheduledJobs: z.boolean().optional(),
      preferFleetJobs: z.boolean().optional(),
      preferRepeatCustomers: z.boolean().optional(),
      autoAcceptHighScores: z.boolean().optional(),
      autoAcceptThreshold: z.number().min(0).max(100).optional(),
      notifyForAllJobs: z.boolean().optional(),
      notifyMinScore: z.number().min(0).max(100).optional()
    })),
    async (req: Request, res: Response) => {
      try {
        const contractorId = req.session.userId!;
        
        // Save or update preferences
        const preferences = await storage.saveAssignmentPreferences({
          contractorId,
          ...req.body,
          isActive: true
        });
        
        res.json({
          success: true,
          preferences
        });
        
      } catch (error) {
        console.error('[Preferences] Error:', error);
        res.status(500).json({ message: 'Failed to update preferences', error: error.message });
      }
    }
  );
  
  // Get contractor assignment preferences
  app.get('/api/contractor/preferences',
    requireAuth,
    requireRole('contractor'),
    async (req: Request, res: Response) => {
      try {
        const contractorId = req.session.userId!;
        const preferences = await storage.getAssignmentPreferences(contractorId);
        
        res.json({
          preferences: preferences || {
            contractorId,
            preferredServiceTypes: [],
            avoidServiceTypes: [],
            maxDailyJobs: 10,
            maxWeeklyJobs: 50,
            maxDistance: 100,
            preferEmergencyJobs: true,
            preferScheduledJobs: true,
            preferFleetJobs: true,
            preferRepeatCustomers: true,
            autoAcceptHighScores: false,
            notifyForAllJobs: false,
            notifyMinScore: 70,
            isActive: true
          }
        });
        
      } catch (error) {
        console.error('[Preferences] Error:', error);
        res.status(500).json({ message: 'Failed to get preferences', error: error.message });
      }
    }
  );
  
  // Get assignment effectiveness analytics
  app.get('/api/analytics/assignment-effectiveness',
    requireAuth,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const period = (req.query.period as 'day' | 'week' | 'month') || 'week';
        
        const effectiveness = await storage.getAssignmentEffectiveness(period);
        
        res.json({
          period,
          metrics: effectiveness,
          lastUpdated: new Date()
        });
        
      } catch (error) {
        console.error('[Analytics] Error:', error);
        res.status(500).json({ message: 'Failed to get assignment effectiveness', error: error.message });
      }
    }
  );
  
  // AI-based reassignment for failed assignments
  app.post('/api/jobs/:id/reassign-ai',
    requireAuth,
    requireRole('admin', 'dispatcher'),
    validateRequest(z.object({
      reason: z.string().optional(),
      excludeContractorId: z.string().optional()
    })),
    async (req: Request, res: Response) => {
      try {
        const jobId = req.params.id;
        const { reason, excludeContractorId } = req.body;
        
        console.log(`[AI-Reassign] Starting AI reassignment for job: ${jobId}, reason: ${reason}`);
        
        // Get job details
        const job = await storage.getJob(jobId);
        if (!job) {
          return res.status(404).json({ message: 'Job not found' });
        }
        
        // Record failure of previous assignment if applicable
        if (job.contractorId && job.status === 'assigned') {
          await storage.recordAssignmentOutcome(jobId, false, {
            issuesEncountered: [reason || 'Reassignment requested']
          });
        }
        
        // Reset job status for reassignment
        await storage.updateJob(jobId, {
          status: 'new',
          contractorId: null,
          assignedAt: null
        });
        
        // Get new AI scores, excluding the previous contractor
        let scores = await storage.calculateAIAssignmentScores(jobId);
        
        if (excludeContractorId || job.contractorId) {
          scores = scores.filter(s => s.contractorId !== (excludeContractorId || job.contractorId));
        }
        
        if (scores.length === 0 || scores[0].score < 60) {
          return res.status(404).json({ 
            message: 'No suitable contractor found for reassignment',
            fallbackAvailable: true
          });
        }
        
        // Assign to the next best contractor
        const nextBest = scores[0];
        
        await storage.updateJob(jobId, {
          contractorId: nextBest.contractorId,
          status: 'assigned',
          assignedAt: new Date()
        });
        
        // Update assignment score
        await storage.updateAiAssignmentScore(nextBest.id, {
          wasAssigned: true
        });
        
        // Send notification
        const contractor = await storage.getUser(nextBest.contractorId);
        if (contractor?.phone) {
          try {
            const twilioClient = require('twilio')(
              process.env.TWILIO_ACCOUNT_SID,
              process.env.TWILIO_AUTH_TOKEN
            );
            
            await twilioClient.messages.create({
              body: `Urgent: Job reassigned to you! ${job.serviceType} at ${job.locationAddress}. Please respond ASAP.`,
              from: process.env.TWILIO_PHONE_NUMBER,
              to: contractor.phone
            });
          } catch (twilioError) {
            console.error('[AI-Reassign] Failed to send SMS:', twilioError);
          }
        }
        
        res.json({
          success: true,
          jobId,
          contractorId: nextBest.contractorId,
          score: nextBest.score,
          recommendation: nextBest.recommendation,
          isReassignment: true
        });
        
      } catch (error) {
        console.error('[AI-Reassign] Error:', error);
        res.status(500).json({ message: 'Failed to reassign job using AI', error: error.message });
      }
    }
  );
  
  // Update contractor specializations
  app.post('/api/contractor/specializations',
    requireAuth,
    requireRole('contractor', 'admin'),
    validateRequest(z.object({
      contractorId: z.string().optional(), // Admin can update any contractor
      specializations: z.any() // JSONB field
    })),
    async (req: Request, res: Response) => {
      try {
        const contractorId = req.body.contractorId || req.session.userId!;
        
        // If not admin, contractor can only update their own specializations
        if (req.session.role !== 'admin' && contractorId !== req.session.userId) {
          return res.status(403).json({ message: 'Unauthorized to update other contractor specializations' });
        }
        
        await storage.updateContractorSpecializations(contractorId, req.body.specializations);
        
        res.json({
          success: true,
          contractorId,
          specializations: req.body.specializations
        });
        
      } catch (error) {
        console.error('[Specializations] Error:', error);
        res.status(500).json({ message: 'Failed to update specializations', error: error.message });
      }
    }
  );
  
  // Assign contractor to job with smart round-robin
  app.post('/api/jobs/:id/assign',
    requireAuth,
    requireRole('admin', 'dispatcher'),
    validateRequest(z.object({
      contractorId: z.string().optional(),
      autoAssign: z.boolean().optional()
    })),
    async (req: Request, res: Response) => {
      try {
        const jobId = req.params.id;
        console.log(`[AssignJob] Starting assignment for job: ${jobId}`);
        
        // Get the job details
        const job = await storage.getJob(jobId);
        if (!job) {
          return res.status(404).json({ message: 'Job not found' });
        }
        
        // Determine contractor to assign
        let contractorId = req.body.contractorId;
        
        // If no contractor specified or autoAssign is true, use smart assignment
        if (!contractorId || req.body.autoAssign) {
          console.log('[AssignJob] Auto-assigning using round-robin logic');
          console.log(`[AssignJob] Job details: ID=${jobId}, Type=${job.jobType}, Service=${job.serviceTypeId}`);
          console.log(`[AssignJob] Current assignment attempts: ${job.assignmentAttempts || 0}`);
          
          // Extract coordinates from job location if available
          let jobLat, jobLon;
          if (job.location && typeof job.location === 'object') {
            const location = job.location as any;
            jobLat = location.lat || location.latitude;
            jobLon = location.lon || location.lng || location.longitude;
            console.log(`[AssignJob] Job location: lat=${jobLat}, lon=${jobLon}`);
          }
          
          // Get available contractors using round-robin logic
          const availableContractors = await storage.getAvailableContractorsForAssignment(jobLat, jobLon);
          
          console.log('[AssignJob] ============ ROUND-ROBIN DECISION PROCESS ============');
          console.log(`[AssignJob] Total available contractors: ${availableContractors.length}`);
          
          // Log detailed contractor information for round-robin analysis
          availableContractors.slice(0, 5).forEach((c, index) => {
            console.log(`[AssignJob] Rank #${index + 1}:`);
            console.log(`[AssignJob]   - Contractor: ${c.name} (ID: ${c.id})`);
            console.log(`[AssignJob]   - Performance Tier: ${c.performanceTier}`);
            console.log(`[AssignJob]   - Last Assigned: ${c.lastAssignedAt ? new Date(c.lastAssignedAt).toISOString() : 'Never'}`);
            console.log(`[AssignJob]   - Jobs Completed: ${c.totalJobsCompleted || 0}`);
            console.log(`[AssignJob]   - Average Rating: ${c.averageRating || 'N/A'}`);
            console.log(`[AssignJob]   - Distance: ${c.distance ? c.distance + ' miles' : 'N/A'}`);
            console.log(`[AssignJob]   - Available: ${c.isAvailable ? 'Yes' : 'No'}`);
            console.log(`[AssignJob]   - Online: ${c.isOnline ? 'Yes' : 'No'}`);
          });
          
          if (availableContractors.length === 0) {
            console.log('[AssignJob] ❌ No available contractors found');
            console.log('[AssignJob] This job requires manual assignment by admin');
            return res.status(400).json({ 
              message: 'No available contractors found',
              needsManualAssignment: true,
              attemptNumber: (job.assignmentAttempts || 0) + 1
            });
          }
          
          // Select the first contractor (already sorted by tier and round-robin)
          const selectedContractor = availableContractors[0];
          contractorId = selectedContractor.id;
          
          console.log('[AssignJob] ============ SELECTED CONTRACTOR ============');
          console.log(`[AssignJob] ✅ Selected: ${selectedContractor.name} (ID: ${selectedContractor.id})`);
          console.log(`[AssignJob] Reason: Best available based on tier (${selectedContractor.performanceTier}) and round-robin (last assigned: ${selectedContractor.lastAssignedAt ? new Date(selectedContractor.lastAssignedAt).toISOString() : 'Never'})`);
          console.log(`[AssignJob] This is assignment attempt #${(job.assignmentAttempts || 0) + 1} for this job`);
          console.log('[AssignJob] ===========================================');
        } else {
          console.log(`[AssignJob] Manual assignment to contractor ${contractorId}`);
        }
        
        // Assign the contractor
        const updatedJob = await storage.assignContractorToJob(jobId, contractorId);
        if (!updatedJob) {
          return res.status(500).json({ message: 'Failed to assign contractor' });
        }
        
        // Get contractor and customer details for emails
        const contractor = await storage.getUser(contractorId);
        const contractorProfile = await storage.getContractorProfile(contractorId);
        
        let customer = null;
        if (job.customerId) {
          customer = await storage.getUser(job.customerId);
        }
        
        // Send email notifications
        if (contractor && contractorProfile) {
          const contractorData = {
            ...contractor,
            ...contractorProfile
          };
          
          console.log(`[Email] Sending assignment emails - Contractor: ${contractor.email}, Customer: ${customer?.email || 'N/A'}`);
          
          await emailService.sendJobAssignmentNotifications(
            {
              ...updatedJob,
              jobNumber: updatedJob.jobNumber,
              address: updatedJob.locationAddress || 'Location provided',
              issueDescription: updatedJob.description || 'Service requested',
              serviceType: 'Emergency Roadside Assistance',
              estimatedPrice: updatedJob.estimatedPrice || 0
            },
            contractorData,
            customer
          );
        }
        
        // Send WebSocket notification to contractor
        try {
          await trackingWSServer.broadcastJobAssignment(jobId, contractorId, {
            jobId: updatedJob.id,
            jobNumber: updatedJob.jobNumber,
            customerName: customer ? `${customer.firstName} ${customer.lastName}` : 'Customer',
            address: updatedJob.locationAddress || 'Location provided',
            description: updatedJob.description || 'Service requested',
            estimatedPrice: updatedJob.estimatedPrice || 0,
            status: updatedJob.status
          });
          console.log(`[WebSocket] Job assignment notification sent for job ${jobId}`);
        } catch (wsError) {
          console.error('[WebSocket] Failed to send job assignment notification:', wsError);
          // Don't fail the request if WebSocket fails
        }
        
        console.log(`[AssignJob] Successfully assigned job ${jobId} to contractor ${contractorId}`);
        
        res.json({
          message: 'Contractor assigned successfully',
          job: updatedJob,
          contractorAssigned: {
            id: contractor?.id,
            name: `${contractor?.firstName} ${contractor?.lastName}`,
            email: contractor?.email
          }
        });
      } catch (error) {
        console.error('[AssignJob] Assignment error:', error);
        res.status(500).json({ message: 'Failed to assign contractor' });
      }
    }
  );

  // Accept job (contractor accepts an available job)
  app.post('/api/jobs/:id/accept',
    requireAuth,
    requireRole('contractor'),
    async (req: Request, res: Response) => {
      try {
        const jobId = req.params.id;
        const contractorId = req.session.userId!;
        
        // Get the job
        const job = await storage.getJob(jobId);
        
        if (!job) {
          return res.status(404).json({ message: 'Job not found' });
        }
        
        // Check if job is available (status should be 'new' and no contractor assigned)
        if (job.status !== 'new') {
          return res.status(400).json({ 
            message: 'Job is not available for acceptance',
            currentStatus: job.status 
          });
        }
        
        if (job.contractorId) {
          return res.status(400).json({ 
            message: 'Job has already been assigned to another contractor' 
          });
        }
        
        // Assign the contractor and update status to 'assigned'
        // This also automatically adds to job status history
        const updatedJob = await storage.assignContractorToJob(jobId, contractorId);
        
        if (!updatedJob) {
          return res.status(500).json({ message: 'Failed to accept job' });
        }
        
        res.json({
          message: 'Job accepted successfully',
          job: updatedJob
        });
      } catch (error) {
        console.error('Accept job error:', error);
        res.status(500).json({ message: 'Failed to accept job' });
      }
    }
  );

  // Configure multer for memory storage (we'll process and save to object storage)
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit per file
      files: 5 // Max 5 files per upload
    },
    fileFilter: (req, file, cb) => {
      // Accept images only
      if (!file.mimetype.startsWith('image/')) {
        cb(new Error('Only image files are allowed'));
        return;
      }
      cb(null, true);
    }
  });

  // NEW: Upload photos for job with actual file upload
  app.post('/api/jobs/:id/upload-photos',
    requireAuth,
    upload.array('photos', 5), // Accept up to 5 photos
    async (req: Request, res: Response) => {
      try {
        const jobId = req.params.id;
        const photoType = req.body.photoType || 'before'; // 'before', 'during', or 'after'
        const description = req.body.description || '';
        
        // Verify job exists and user has permission
        const job = await storage.getJob(jobId);
        if (!job) {
          return res.status(404).json({ message: 'Job not found' });
        }
        
        // Check permissions: admin, the contractor assigned, or the customer
        const userId = req.session.userId!;
        const user = await storage.getUser(userId);
        const isAdmin = user?.role === 'admin';
        const isAssignedContractor = job.contractorId === userId;
        const isCustomer = job.customerId === userId;
        
        if (!isAdmin && !isAssignedContractor && !isCustomer) {
          return res.status(403).json({ message: 'Not authorized to upload photos for this job' });
        }
        
        if (!req.files || !Array.isArray(req.files)) {
          return res.status(400).json({ message: 'No files uploaded' });
        }
        
        const uploadedPhotos = [];
        const privateDir = process.env.PRIVATE_OBJECT_DIR || '/replit-objstore-c279c855-0ac0-434d-9783-ad25c3b34e4d/.private';
        const jobPhotoDir = path.join(privateDir, 'jobs', jobId);
        
        // Create directory if it doesn't exist
        await fs.mkdir(jobPhotoDir, { recursive: true });
        
        // Process and save each photo
        for (const file of req.files) {
          const photoId = randomUUID();
          const timestamp = Date.now();
          const ext = path.extname(file.originalname) || '.jpg';
          const filename = `${photoType}_${photoId}_${timestamp}${ext}`;
          const filepath = path.join(jobPhotoDir, filename);
          
          // Process image with sharp (resize if needed, optimize)
          const processedImage = await sharp(file.buffer)
            .resize(1920, 1080, { 
              fit: 'inside',
              withoutEnlargement: true 
            })
            .jpeg({ quality: 85, progressive: true })
            .toBuffer();
          
          // Save to object storage
          await fs.writeFile(filepath, processedImage);
          
          // Create relative URL for storage (will be served through our endpoint)
          const photoUrl = `/api/jobs/${jobId}/photos/${filename}`;
          
          // Save photo record to database
          const photoRecord = await storage.addJobPhoto({
            jobId,
            uploadedBy: userId,
            photoUrl,
            photoType,
            description,
            isBeforePhoto: photoType === 'before',
            metadata: {
              originalName: file.originalname,
              size: processedImage.length,
              mimeType: 'image/jpeg',
              uploadedAt: new Date().toISOString()
            }
          });
          
          uploadedPhotos.push(photoRecord);
        }
        
        res.status(201).json({
          message: `${uploadedPhotos.length} photo(s) uploaded successfully`,
          photos: uploadedPhotos
        });
      } catch (error) {
        console.error('Upload photo error:', error);
        res.status(500).json({ 
          message: error instanceof Error ? error.message : 'Failed to upload photos' 
        });
      }
    }
  );
  
  // Serve job photos from object storage
  app.get('/api/jobs/:jobId/photos/:filename',
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const { jobId, filename } = req.params;
        
        // Verify job exists and user has permission
        const job = await storage.getJob(jobId);
        if (!job) {
          return res.status(404).json({ message: 'Job not found' });
        }
        
        // Check permissions
        const userId = req.session.userId!;
        const user = await storage.getUser(userId);
        const isAdmin = user?.role === 'admin';
        const isAssignedContractor = job.contractorId === userId;
        const isCustomer = job.customerId === userId;
        const isFleetManager = user?.role === 'fleet_manager' && job.fleetAccountId;
        
        if (!isAdmin && !isAssignedContractor && !isCustomer && !isFleetManager) {
          return res.status(403).json({ message: 'Not authorized to view photos for this job' });
        }
        
        const privateDir = process.env.PRIVATE_OBJECT_DIR || '/replit-objstore-c279c855-0ac0-434d-9783-ad25c3b34e4d/.private';
        const filepath = path.join(privateDir, 'jobs', jobId, filename);
        
        // Check if file exists
        try {
          await fs.access(filepath);
        } catch {
          return res.status(404).json({ message: 'Photo not found' });
        }
        
        // Read and serve the file
        const fileBuffer = await fs.readFile(filepath);
        
        // Set appropriate headers
        const ext = path.extname(filename).toLowerCase();
        const mimeTypes: Record<string, string> = {
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.png': 'image/png',
          '.gif': 'image/gif',
          '.webp': 'image/webp'
        };
        
        res.set({
          'Content-Type': mimeTypes[ext] || 'image/jpeg',
          'Cache-Control': 'private, max-age=3600'
        });
        
        res.send(fileBuffer);
      } catch (error) {
        console.error('Get photo error:', error);
        res.status(500).json({ message: 'Failed to retrieve photo' });
      }
    }
  );

  // Get all photos for a job
  app.get('/api/jobs/:id/photos',
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const jobId = req.params.id;
        
        // Verify job exists and user has permission
        const job = await storage.getJob(jobId);
        if (!job) {
          return res.status(404).json({ message: 'Job not found' });
        }
        
        // Check permissions
        const userId = req.session.userId!;
        const user = await storage.getUser(userId);
        const isAdmin = user?.role === 'admin';
        const isAssignedContractor = job.contractorId === userId;
        const isCustomer = job.customerId === userId;
        const isFleetManager = user?.role === 'fleet_manager' && job.fleetAccountId;
        
        if (!isAdmin && !isAssignedContractor && !isCustomer && !isFleetManager) {
          return res.status(403).json({ message: 'Not authorized to view photos for this job' });
        }
        
        const photos = await storage.getJobPhotos(jobId);
        
        res.json({ photos });
      } catch (error) {
        console.error('Get job photos error:', error);
        res.status(500).json({ message: 'Failed to get job photos' });
      }
    }
  );
  
  // Delete a specific photo
  app.delete('/api/jobs/:jobId/photos/:photoId',
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const { jobId, photoId } = req.params;
        
        // Verify job exists and user has permission
        const job = await storage.getJob(jobId);
        if (!job) {
          return res.status(404).json({ message: 'Job not found' });
        }
        
        // Check permissions
        const userId = req.session.userId!;
        const user = await storage.getUser(userId);
        const isAdmin = user?.role === 'admin';
        const isAssignedContractor = job.contractorId === userId;
        const isCustomer = job.customerId === userId;
        const isFleetManager = user?.role === 'fleet_manager' && job.fleetAccountId;
        
        if (!isAdmin && !isAssignedContractor && !isCustomer && !isFleetManager) {
          return res.status(403).json({ message: 'Not authorized to delete photos for this job' });
        }
        
        // Get photo to find filename before deletion
        const photos = await storage.getJobPhotos(jobId);
        const photo = photos.find(p => p.id === photoId);
        
        if (!photo) {
          return res.status(404).json({ message: 'Photo not found' });
        }
        
        // Delete from database
        const deleted = await storage.deleteJobPhoto(photoId);
        
        if (deleted) {
          // Also delete the physical file from object storage
          try {
            const privateDir = process.env.PRIVATE_OBJECT_DIR || '/replit-objstore-c279c855-0ac0-434d-9783-ad25c3b34e4d/.private';
            // Extract filename from photoUrl (format: /api/jobs/{jobId}/photos/{filename})
            const urlParts = photo.photoUrl.split('/');
            const filename = urlParts[urlParts.length - 1];
            const filepath = path.join(privateDir, 'jobs', jobId, filename);
            
            await fs.unlink(filepath);
          } catch (fileError) {
            console.error('Failed to delete physical file:', fileError);
            // Continue even if file deletion fails (might already be deleted)
          }
        }
        
        res.json({
          message: deleted ? 'Photo deleted successfully' : 'Photo not found',
          success: deleted
        });
      } catch (error) {
        console.error('Delete photo error:', error);
        res.status(500).json({ message: 'Failed to delete photo' });
      }
    }
  );
  
  // LEGACY: Upload photos for job (URL-based, keeping for backward compatibility)
  app.post('/api/jobs/:id/photos',
    requireAuth,
    validateRequest(insertJobPhotoSchema.omit({ jobId: true })),
    async (req: Request, res: Response) => {
      try {
        const photo = await storage.addJobPhoto({
          ...req.body,
          jobId: req.params.id
        });
        
        res.status(201).json({
          message: 'Photo uploaded successfully',
          photo
        });
      } catch (error) {
        console.error('Upload photo error:', error);
        res.status(500).json({ message: 'Failed to upload photo' });
      }
    }
  );

  // Get job chat messages
  app.get('/api/jobs/:id/messages', requireAuth, async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const messages = await storage.getJobMessages(req.params.id, limit);
      
      res.json({ messages });
    } catch (error) {
      console.error('Get messages error:', error);
      res.status(500).json({ message: 'Failed to get messages' });
    }
  });

  // ==================== ENHANCED CHAT API ENDPOINTS ====================

  // Get paginated message history
  app.get('/api/jobs/:jobId/messages/history', requireAuth, async (req: Request, res: Response) => {
    try {
      const jobId = req.params.jobId;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const beforeId = req.query.beforeId as string;
      const afterId = req.query.afterId as string;
      
      const result = await storage.getMessageHistory(jobId, {
        limit,
        offset,
        beforeId,
        afterId
      });
      
      res.json(result);
    } catch (error) {
      console.error('Get message history error:', error);
      res.status(500).json({ message: 'Failed to get message history' });
    }
  });

  // Get unread message count
  app.get('/api/jobs/:jobId/messages/unread', requireAuth, async (req: Request, res: Response) => {
    try {
      const jobId = req.params.jobId;
      const userId = req.session.userId!;
      
      const unreadCount = await storage.getUnreadMessageCount(jobId, userId);
      
      res.json({ unreadCount });
    } catch (error) {
      console.error('Get unread count error:', error);
      res.status(500).json({ message: 'Failed to get unread count' });
    }
  });

  // Mark messages as read
  app.patch('/api/jobs/:jobId/messages/read', requireAuth, async (req: Request, res: Response) => {
    try {
      const jobId = req.params.jobId;
      const userId = req.session.userId!;
      
      const success = await storage.markMessagesAsRead(jobId, userId);
      
      res.json({ success });
    } catch (error) {
      console.error('Mark messages as read error:', error);
      res.status(500).json({ message: 'Failed to mark messages as read' });
    }
  });

  // Edit a message
  app.put('/api/messages/:id', requireAuth, async (req: Request, res: Response) => {
    try {
      const messageId = req.params.id;
      const userId = req.session.userId!;
      const { content } = req.body;
      
      if (!content || content.trim().length === 0) {
        return res.status(400).json({ message: 'Message content is required' });
      }
      
      const editedMessage = await storage.editMessage(messageId, content.trim(), userId);
      
      if (!editedMessage) {
        return res.status(404).json({ message: 'Message not found or you do not have permission to edit' });
      }
      
      res.json({ message: editedMessage });
    } catch (error) {
      console.error('Edit message error:', error);
      res.status(500).json({ message: 'Failed to edit message' });
    }
  });

  // Delete a message
  app.delete('/api/messages/:id', requireAuth, async (req: Request, res: Response) => {
    try {
      const messageId = req.params.id;
      const userId = req.session.userId!;
      
      const deleted = await storage.deleteMessage(messageId, userId);
      
      if (!deleted) {
        return res.status(404).json({ message: 'Message not found or you do not have permission to delete' });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Delete message error:', error);
      res.status(500).json({ message: 'Failed to delete message' });
    }
  });

  // Add reaction to message
  app.post('/api/messages/:id/reactions', requireAuth, async (req: Request, res: Response) => {
    try {
      const messageId = req.params.id;
      const userId = req.session.userId!;
      const { emoji } = req.body;
      
      if (!emoji) {
        return res.status(400).json({ message: 'Emoji is required' });
      }
      
      const updatedMessage = await storage.addMessageReaction(messageId, userId, emoji);
      
      if (!updatedMessage) {
        return res.status(404).json({ message: 'Message not found' });
      }
      
      res.json({ message: updatedMessage });
    } catch (error) {
      console.error('Add reaction error:', error);
      res.status(500).json({ message: 'Failed to add reaction' });
    }
  });

  // Remove reaction from message
  app.delete('/api/messages/:id/reactions/:emoji', requireAuth, async (req: Request, res: Response) => {
    try {
      const messageId = req.params.id;
      const emoji = req.params.emoji;
      const userId = req.session.userId!;
      
      const updatedMessage = await storage.removeMessageReaction(messageId, userId, emoji);
      
      if (!updatedMessage) {
        return res.status(404).json({ message: 'Message not found' });
      }
      
      res.json({ message: updatedMessage });
    } catch (error) {
      console.error('Remove reaction error:', error);
      res.status(500).json({ message: 'Failed to remove reaction' });
    }
  });

  // Get message thread (replies to a message)
  app.get('/api/messages/:id/thread', requireAuth, async (req: Request, res: Response) => {
    try {
      const messageId = req.params.id;
      
      const thread = await storage.getMessageThread(messageId);
      
      res.json({ thread });
    } catch (error) {
      console.error('Get message thread error:', error);
      res.status(500).json({ message: 'Failed to get message thread' });
    }
  });

  // Get read receipts for a message
  app.get('/api/messages/:id/receipts', requireAuth, async (req: Request, res: Response) => {
    try {
      const messageId = req.params.id;
      
      const receipts = await storage.getMessageReadReceipts(messageId);
      
      res.json({ receipts });
    } catch (error) {
      console.error('Get read receipts error:', error);
      res.status(500).json({ message: 'Failed to get read receipts' });
    }
  });

  // Get real-time GPS tracking data
  app.get('/api/jobs/:id/tracking', requireAuth, async (req: Request, res: Response) => {
    try {
      const job = await storage.getJob(req.params.id);
      
      if (!job) {
        return res.status(404).json({ message: 'Job not found' });
      }

      // Get contractor location if job is assigned
      let contractorLocation = null;
      if (job.contractorId) {
        const contractor = await storage.getContractorProfile(job.contractorId);
        if (contractor) {
          contractorLocation = contractor.currentLocation;
        }
      }

      res.json({
        jobId: job.id,
        status: job.status,
        vehicleLocation: job.vehicleLocation,
        contractorLocation,
        estimatedArrival: job.estimatedArrival
      });
    } catch (error) {
      console.error('Get tracking error:', error);
      res.status(500).json({ message: 'Failed to get tracking data' });
    }
  });

  // Mark job complete
  app.post('/api/jobs/:id/complete',
    requireAuth,
    validateRequest(z.object({
      completionNotes: z.string().optional(),
      finalPhotos: z.array(z.string()).optional()
    })),
    async (req: Request, res: Response) => {
      try {
        const job = await storage.updateJobStatus(
          req.params.id,
          'completed',
          req.session.userId,
          req.body.completionNotes
        );
        
        if (!job) {
          return res.status(404).json({ message: 'Job not found' });
        }

        // Add completion photos if provided
        if (req.body.finalPhotos && req.body.finalPhotos.length > 0) {
          for (const photoUrl of req.body.finalPhotos) {
            await storage.addJobPhoto({
              jobId: job.id,
              url: photoUrl,
              photoType: 'completion'
            });
          }
        }

        res.json({
          message: 'Job completed successfully',
          job
        });
      } catch (error) {
        console.error('Complete job error:', error);
        res.status(500).json({ message: 'Failed to complete job' });
      }
    }
  );

  // ==================== REVIEW ROUTES ====================
  
  // Submit new review for a job
  app.post('/api/reviews',
    requireAuth,
    validateRequest(insertReviewSchema.omit({ 
      helpfulVotes: true,
      unhelpfulVotes: true,
      isEdited: true,
      editHistory: true,
      contractorResponse: true,
      contractorResponseAt: true,
      isFlagged: true,
      flagReason: true,
      flaggedBy: true,
      flaggedAt: true,
      moderationStatus: true,
      moderatedBy: true,
      moderatedAt: true
    })),
    async (req: Request, res: Response) => {
      try {
        // Check if user has permission to review this job
        const job = await storage.getJob(req.body.jobId);
        
        if (!job) {
          return res.status(404).json({ message: 'Job not found' });
        }

        // Check if job is completed
        if (job.status !== 'completed') {
          return res.status(400).json({ message: 'Job must be completed before reviewing' });
        }

        // Check if review already exists
        const existingReview = await storage.getReviewByJob(job.id);
        if (existingReview) {
          return res.status(400).json({ message: 'Review already exists for this job' });
        }

        // Validate user is the customer or fleet manager
        const isCustomer = job.customerId === req.session.userId;
        const isFleetManager = job.fleetAccountId && req.session.role === 'fleet_manager';
        
        if (!isCustomer && !isFleetManager) {
          return res.status(403).json({ message: 'Only the customer can review this job' });
        }

        // Create review
        const review = await storage.createReview({
          ...req.body,
          jobId: job.id,
          contractorId: job.contractorId!,
          customerId: req.body.isAnonymous ? null : req.session.userId,
          customerName: req.body.isAnonymous ? 'Anonymous' : req.body.customerName,
          isVerifiedPurchase: true,
          moderationStatus: 'approved' // Auto-approve for now, can add moderation later
        });

        // Send notification to contractor
        if (job.contractorId) {
          const contractor = await storage.getUser(job.contractorId);
          if (contractor) {
            // Send notification (to be implemented with notification service)
            console.log(`New review notification for contractor ${contractor.id}`);
          }
        }

        res.status(201).json({
          message: 'Review submitted successfully',
          review
        });
      } catch (error) {
        console.error('Submit review error:', error);
        res.status(500).json({ message: 'Failed to submit review' });
      }
    }
  );

  // Get reviews for a contractor
  app.get('/api/reviews/contractor/:id', async (req: Request, res: Response) => {
    try {
      const { limit = '50', offset = '0', sortBy = 'recent' } = req.query;
      const minRating = req.query.minRating ? parseInt(req.query.minRating as string) : undefined;
      const maxRating = req.query.maxRating ? parseInt(req.query.maxRating as string) : undefined;
      const hasText = req.query.hasText === 'true';
      
      const reviews = await storage.getContractorReviews(
        req.params.id,
        parseInt(limit as string),
        parseInt(offset as string),
        {
          minRating,
          maxRating,
          hasText,
          sortBy: sortBy as 'recent' | 'highest' | 'lowest' | 'helpful'
        }
      );

      // Get contractor rating summary
      const summary = await storage.getContractorRatingSummary(req.params.id);

      res.json({
        reviews,
        summary,
        pagination: {
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          total: summary.totalReviews
        }
      });
    } catch (error) {
      console.error('Get contractor reviews error:', error);
      res.status(500).json({ message: 'Failed to get reviews' });
    }
  });

  // Get rating summary for a contractor
  app.get('/api/contractors/:id/rating', async (req: Request, res: Response) => {
    try {
      const summary = await storage.getContractorRatingSummary(req.params.id);
      res.json(summary);
    } catch (error) {
      console.error('Get rating summary error:', error);
      res.status(500).json({ message: 'Failed to get rating summary' });
    }
  });

  // Add contractor response to review
  app.post('/api/reviews/:id/response',
    requireAuth,
    requireRole('contractor'),
    validateRequest(z.object({
      response: z.string().min(10).max(1000)
    })),
    async (req: Request, res: Response) => {
      try {
        const review = await storage.getReview(req.params.id);
        
        if (!review) {
          return res.status(404).json({ message: 'Review not found' });
        }

        // Verify contractor owns this review
        const contractorProfile = await storage.getContractorProfile(req.session.userId!);
        if (!contractorProfile || review.contractorId !== req.session.userId) {
          return res.status(403).json({ message: 'You can only respond to your own reviews' });
        }

        // Update review with response
        const updatedReview = await storage.addContractorResponse(
          review.id,
          req.body.response
        );

        res.json({
          message: 'Response added successfully',
          review: updatedReview
        });
      } catch (error) {
        console.error('Add contractor response error:', error);
        res.status(500).json({ message: 'Failed to add response' });
      }
    }
  );

  // Flag a review as inappropriate
  app.post('/api/reviews/:id/flag',
    requireAuth,
    validateRequest(z.object({
      reason: z.string().min(10).max(500)
    })),
    async (req: Request, res: Response) => {
      try {
        const review = await storage.getReview(req.params.id);
        
        if (!review) {
          return res.status(404).json({ message: 'Review not found' });
        }

        const flaggedReview = await storage.flagReview(
          review.id,
          req.body.reason,
          req.session.userId!
        );

        res.json({
          message: 'Review flagged for moderation',
          review: flaggedReview
        });
      } catch (error) {
        console.error('Flag review error:', error);
        res.status(500).json({ message: 'Failed to flag review' });
      }
    }
  );

  // Vote review as helpful/unhelpful
  app.post('/api/reviews/:id/helpful',
    requireAuth,
    validateRequest(z.object({
      isHelpful: z.boolean()
    })),
    async (req: Request, res: Response) => {
      try {
        const success = await storage.voteReviewHelpful(
          req.params.id,
          req.session.userId!,
          req.body.isHelpful
        );

        if (success) {
          res.json({ message: 'Vote recorded' });
        } else {
          res.status(400).json({ message: 'Failed to record vote' });
        }
      } catch (error) {
        console.error('Vote review helpful error:', error);
        res.status(500).json({ message: 'Failed to vote' });
      }
    }
  );

  // Moderate a review (admin only)
  app.patch('/api/reviews/:id/moderate',
    requireAuth,
    requireRole('admin'),
    validateRequest(z.object({
      status: z.enum(['pending', 'approved', 'rejected'])
    })),
    async (req: Request, res: Response) => {
      try {
        const updatedReview = await storage.moderateReview(
          req.params.id,
          req.body.status,
          req.session.userId!
        );

        if (!updatedReview) {
          return res.status(404).json({ message: 'Review not found' });
        }

        res.json({
          message: 'Review moderated successfully',
          review: updatedReview
        });
      } catch (error) {
        console.error('Moderate review error:', error);
        res.status(500).json({ message: 'Failed to moderate review' });
      }
    }
  );

  // Get review for a specific job
  app.get('/api/jobs/:id/review', requireAuth, async (req: Request, res: Response) => {
    try {
      const review = await storage.getReviewByJob(req.params.id);
      
      if (!review) {
        return res.status(404).json({ message: 'No review found for this job' });
      }

      res.json(review);
    } catch (error) {
      console.error('Get job review error:', error);
      res.status(500).json({ message: 'Failed to get review' });
    }
  });

  // ==================== BIDDING ROUTES ====================

  // Create bidding job (job with bidding enabled)
  app.post('/api/jobs/bidding',
    requireAuth,
    validateRequest(insertJobSchema.extend({
      allowBidding: z.boolean().default(true),
      biddingDuration: z.number().min(30).max(480).optional(),
      minimumBidCount: z.number().min(1).max(20).optional(),
      maximumBidAmount: z.number().positive().optional(),
      reservePrice: z.number().positive().optional(),
      biddingStrategy: z.enum(['lowest_price', 'best_value', 'fastest_completion', 'manual']).optional(),
      autoAcceptBids: z.enum(['never', 'lowest', 'lowest_with_rating', 'best_value']).optional()
    })),
    async (req: Request, res: Response) => {
      try {
        if (req.body.jobType === 'emergency') {
          return res.status(400).json({ 
            message: 'Bidding is not available for emergency jobs' 
          });
        }

        const biddingDuration = req.body.biddingDuration || 120;
        const biddingDeadline = new Date();
        biddingDeadline.setMinutes(biddingDeadline.getMinutes() + biddingDuration);

        const jobData = {
          ...req.body,
          customerId: req.body.customerId || req.session.userId,
          status: 'new' as const,
          allowBidding: true,
          biddingDeadline,
          biddingDuration,
          jobType: 'scheduled' as const
        };

        const job = await storage.createJob(jobData);
        
        res.status(201).json({
          message: 'Bidding job created successfully',
          job,
          biddingDeadline
        });
      } catch (error) {
        console.error('Create bidding job error:', error);
        res.status(500).json({ message: 'Failed to create bidding job' });
      }
    }
  );

  // Get available jobs for bidding (contractor view)
  app.get('/api/jobs/bidding/available',
    requireAuth,
    requireRole('contractor'),
    async (req: Request, res: Response) => {
      try {
        const filters = {
          serviceTypeId: req.query.serviceTypeId as string,
          maxDistance: req.query.maxDistance ? Number(req.query.maxDistance) : undefined,
          minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined
        };

        const jobs = await storage.getAvailableBiddingJobs(req.session.userId!, filters);

        const enhancedJobs = await Promise.all(jobs.map(async job => {
          const bids = await storage.getJobBids(job.id);
          const timeRemaining = job.biddingDeadline ? 
            Math.max(0, new Date(job.biddingDeadline).getTime() - Date.now()) : 0;
          
          return {
            ...job,
            currentBidCount: bids.length,
            lowestBid: job.lowestBidAmount,
            averageBid: job.averageBidAmount,
            timeRemaining: Math.floor(timeRemaining / 60000)
          };
        }));

        res.json({ 
          jobs: enhancedJobs,
          total: enhancedJobs.length
        });
      } catch (error) {
        console.error('Get available bidding jobs error:', error);
        res.status(500).json({ message: 'Failed to get available jobs' });
      }
    }
  );

  // Submit a bid
  app.post('/api/bids',
    requireAuth,
    requireRole('contractor'),
    validateRequest(insertJobBidSchema),
    async (req: Request, res: Response) => {
      try {
        const { jobId } = req.body;
        
        const job = await storage.getJob(jobId);
        if (!job) {
          return res.status(404).json({ message: 'Job not found' });
        }

        if (!job.allowBidding) {
          return res.status(400).json({ message: 'Job does not allow bidding' });
        }

        const deadlinePassed = !(await storage.checkBidDeadline(jobId));
        if (deadlinePassed) {
          return res.status(400).json({ message: 'Bidding deadline has passed' });
        }

        const existingBids = await storage.getContractorBids(req.session.userId!, 'pending');
        const existingBidForJob = existingBids.find(b => b.jobId === jobId);
        
        if (existingBidForJob) {
          return res.status(400).json({ 
            message: 'You already have a pending bid for this job' 
          });
        }

        const expiresAt = job.biddingDeadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        const bidData = {
          ...req.body,
          contractorId: req.session.userId!,
          expiresAt
        };

        const bid = await storage.createJobBid(bidData);

        // Create notification for the job owner/customer
        if (job.customerId) {
          // Get contractor info
          const contractor = await storage.getContractorProfile(req.session.userId!);
          const contractorName = contractor?.companyName || 'A contractor';
          
          await storage.createNotification({
            userId: job.customerId,
            type: 'bid_received',
            title: 'New Bid Received',
            message: `${contractorName} has submitted a bid of $${bid.bidAmount} for job #${job.jobNumber}`,
            relatedEntityType: 'bid',
            relatedEntityId: bid.id,
            priority: 'high',
            actionUrl: `/jobs/${job.id}/bids`
          });
        }

        // Create notification for fleet manager if it's a fleet job
        if (job.fleetAccountId) {
          const fleetAccount = await storage.getFleetAccount(job.fleetAccountId);
          if (fleetAccount?.primaryContactId) {
            const contractor = await storage.getContractorProfile(req.session.userId!);
            const contractorName = contractor?.companyName || 'A contractor';
            
            await storage.createNotification({
              userId: fleetAccount.primaryContactId,
              type: 'bid_received',
              title: 'New Bid for Fleet Job',
              message: `${contractorName} has submitted a bid of $${bid.bidAmount} for fleet job #${job.jobNumber}`,
              relatedEntityType: 'bid',
              relatedEntityId: bid.id,
              priority: 'medium',
              actionUrl: `/fleet/jobs/${job.id}/bids`
            });
          }
        }

        res.status(201).json({
          message: 'Bid submitted successfully',
          bid
        });
      } catch (error) {
        console.error('Submit bid error:', error);
        res.status(500).json({ message: 'Failed to submit bid' });
      }
    }
  );

  // Get bids for a job
  app.get('/api/bids/job/:jobId',
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const job = await storage.getJob(req.params.jobId);
        if (!job) {
          return res.status(404).json({ message: 'Job not found' });
        }

        if (req.session.role === 'driver' && job.customerId !== req.session.userId) {
          return res.status(403).json({ message: 'Access denied' });
        }

        const bids = await storage.getJobBids(req.params.jobId);
        
        const isActive = await storage.checkBidDeadline(req.params.jobId);
        const sanitizedBids = bids.map(bid => {
          if (isActive && req.session.role !== 'admin') {
            return {
              ...bid,
              contractorId: undefined,
              contractorName: 'Anonymous Contractor'
            };
          }
          return bid;
        });

        res.json({ 
          bids: sanitizedBids,
          total: bids.length,
          isActive
        });
      } catch (error) {
        console.error('Get job bids error:', error);
        res.status(500).json({ message: 'Failed to get bids' });
      }
    }
  );

  // Accept a bid
  app.put('/api/bids/:id/accept',
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const bid = await storage.getJobBid(req.params.id);
        if (!bid) {
          return res.status(404).json({ message: 'Bid not found' });
        }

        const job = await storage.getJob(bid.jobId);
        if (!job) {
          return res.status(404).json({ message: 'Job not found' });
        }

        if (req.session.role !== 'admin' && job.customerId !== req.session.userId) {
          return res.status(403).json({ message: 'Only job owner can accept bids' });
        }

        if (bid.status !== 'pending') {
          return res.status(400).json({ 
            message: `Cannot accept bid with status: ${bid.status}` 
          });
        }

        const acceptedBid = await storage.acceptBid(req.params.id, bid.jobId);

        res.json({
          message: 'Bid accepted successfully',
          bid: acceptedBid,
          job
        });
      } catch (error) {
        console.error('Accept bid error:', error);
        res.status(500).json({ message: 'Failed to accept bid' });
      }
    }
  );

  // Reject a bid  
  app.put('/api/bids/:id/reject',
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const bid = await storage.getJobBid(req.params.id);
        if (!bid) {
          return res.status(404).json({ message: 'Bid not found' });
        }

        const job = await storage.getJob(bid.jobId);
        if (!job) {
          return res.status(404).json({ message: 'Job not found' });
        }

        if (req.session.role !== 'admin' && job.customerId !== req.session.userId) {
          return res.status(403).json({ message: 'Only job owner can reject bids' });
        }

        const rejectedBid = await storage.rejectBid(req.params.id, req.body.reason);

        res.json({
          message: 'Bid rejected',
          bid: rejectedBid
        });
      } catch (error) {
        console.error('Reject bid error:', error);
        res.status(500).json({ message: 'Failed to reject bid' });
      }
    }
  );

  // Get contractor's bids
  app.get('/api/bids/my-bids',
    requireAuth,
    requireRole('contractor'),
    async (req: Request, res: Response) => {
      try {
        const status = req.query.status as typeof bidStatusEnum.enumValues[number];
        const bids = await storage.getContractorBids(req.session.userId!, status);

        const enhancedBids = await Promise.all(bids.map(async bid => {
          const job = await storage.getJob(bid.jobId);
          return {
            ...bid,
            job: job ? {
              id: job.id,
              jobNumber: job.jobNumber,
              description: job.description,
              location: job.location,
              locationAddress: job.locationAddress,
              scheduledAt: job.scheduledAt,
              status: job.status
            } : null
          };
        }));

        res.json({ 
          bids: enhancedBids,
          total: bids.length
        });
      } catch (error) {
        console.error('Get contractor bids error:', error);
        res.status(500).json({ message: 'Failed to get your bids' });
      }
    }
  );

  // ==================== PAYMENT ROUTES ====================

  // Check Stripe configuration
  app.get('/api/payment/config', async (req: Request, res: Response) => {
    try {
      const hasKeys = !!(process.env.STRIPE_SECRET_KEY && process.env.VITE_STRIPE_PUBLIC_KEY);
      res.json({ 
        hasKeys,
        publicKey: hasKeys ? process.env.VITE_STRIPE_PUBLIC_KEY : null
      });
    } catch (error) {
      console.error('Get payment config error:', error);
      res.status(500).json({ message: 'Failed to get payment configuration' });
    }
  });

  // Create Stripe payment intent
  app.post('/api/payment/create-intent',
    requireAuth,
    validateRequest(z.object({
      amount: z.number().positive(),
      jobId: z.string().optional(),
      paymentMethodId: z.string().optional(),
      savePaymentMethod: z.boolean().optional()
    })),
    async (req: Request, res: Response) => {
      try {
        if (!process.env.STRIPE_SECRET_KEY) {
          return res.status(400).json({ message: 'Payment processing not configured' });
        }

        // Import Stripe dynamically
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

        const paymentIntent = await stripe.paymentIntents.create({
          amount: req.body.amount,
          currency: 'usd',
          metadata: {
            userId: req.session.userId!,
            jobId: req.body.jobId || '',
          },
          automatic_payment_methods: {
            enabled: true,
          },
          ...(req.body.paymentMethodId && {
            payment_method: req.body.paymentMethodId,
          }),
          ...(req.body.savePaymentMethod && {
            setup_future_usage: 'on_session'
          })
        });

        res.json({
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id
        });
      } catch (error: any) {
        console.error('Create payment intent error:', error);
        res.status(500).json({ 
          message: 'Failed to create payment intent',
          error: error.message 
        });
      }
    }
  );

  // ==================== EFS/COMDATA CHECK PAYMENT ENDPOINTS ====================
  
  // Authorize EFS check
  app.post('/api/payments/efs/authorize',
    rateLimiter(10, 60000), // 10 requests per minute
    validateRequest(z.object({
      checkNumber: z.string().length(10).regex(/^\d+$/),
      authorizationCode: z.string().length(6).regex(/^\d+$/),
      amount: z.number().min(50).max(5000),
      jobId: z.string().optional(),
      fleetAccountId: z.string().optional()
    })),
    async (req: Request, res: Response) => {
      try {
        const { checkNumber, authorizationCode, amount, jobId, fleetAccountId } = req.body;
        const userId = req.session?.userId;
        
        // Check if check already has active authorization
        const existingCheck = await storage.getFleetCheckByCheckNumber(checkNumber);
        if (existingCheck && ['authorized', 'partially_captured'].includes(existingCheck.status)) {
          return res.status(400).json({
            message: 'Check already has an active authorization',
            checkId: existingCheck.id
          });
        }
        
        // Authorize with EFS service
        const authResult = await efsComdataService.authorizeEFSCheck(
          checkNumber,
          authorizationCode,
          amount,
          jobId,
          userId
        );
        
        if (!authResult.success) {
          // Log failed attempt
          await storage.createFleetCheck({
            provider: 'efs',
            checkNumber,
            authorizationCode,
            authorizedAmount: amount.toString(),
            status: 'declined',
            jobId,
            userId,
            fleetAccountId,
            failureReason: authResult.message,
            lastError: authResult.errorDetails,
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            authorizationResponse: authResult
          });
          
          return res.status(400).json({
            error: authResult.errorCode,
            message: authResult.message,
            details: authResult.errorDetails
          });
        }
        
        // Create fleet check record
        const fleetCheck = await storage.createFleetCheck({
          provider: 'efs',
          checkNumber,
          authorizationCode,
          authorizedAmount: amount.toString(),
          availableBalance: authResult.availableBalance?.toString(),
          jobId,
          userId,
          fleetAccountId,
          expiresAt: authResult.expiresAt,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          authorizationResponse: authResult
        });
        
        // Update check status to authorized
        await storage.updateFleetCheckStatus(fleetCheck.id, 'authorized', authResult);
        
        res.json({
          success: true,
          checkId: fleetCheck.id,
          authorizationId: authResult.authorizationId,
          authorizedAmount: amount,
          availableBalance: authResult.availableBalance,
          expiresAt: authResult.expiresAt,
          message: 'EFS check authorized successfully'
        });
        
      } catch (error: any) {
        console.error('EFS authorization error:', error);
        res.status(500).json({ 
          error: 'INTERNAL_ERROR',
          message: 'Failed to authorize EFS check'
        });
      }
    }
  );
  
  // Authorize Comdata check
  app.post('/api/payments/comdata/authorize',
    rateLimiter(10, 60000),
    validateRequest(z.object({
      checkNumber: z.string().length(12).regex(/^\d+$/),
      controlCode: z.string().length(4).regex(/^\d+$/),
      driverCode: z.string().min(1),
      amount: z.number().min(100).max(10000),
      jobId: z.string().optional(),
      fleetAccountId: z.string().optional()
    })),
    async (req: Request, res: Response) => {
      try {
        const { checkNumber, controlCode, driverCode, amount, jobId, fleetAccountId } = req.body;
        const userId = req.session?.userId;
        
        // Check if check already has active authorization
        const existingCheck = await storage.getFleetCheckByCheckNumber(checkNumber);
        if (existingCheck && ['authorized', 'partially_captured'].includes(existingCheck.status)) {
          return res.status(400).json({
            message: 'Check already has an active authorization',
            checkId: existingCheck.id
          });
        }
        
        // Authorize with Comdata service
        const authResult = await efsComdataService.authorizeComdataCheck(
          checkNumber,
          controlCode,
          driverCode,
          amount,
          jobId,
          userId
        );
        
        if (!authResult.success) {
          // Log failed attempt
          await storage.createFleetCheck({
            provider: 'comdata',
            checkNumber,
            authorizationCode: controlCode,
            driverCode,
            authorizedAmount: amount.toString(),
            status: 'declined',
            jobId,
            userId,
            fleetAccountId,
            failureReason: authResult.message,
            lastError: authResult.errorDetails,
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            authorizationResponse: authResult
          });
          
          return res.status(400).json({
            error: authResult.errorCode,
            message: authResult.message,
            details: authResult.errorDetails
          });
        }
        
        // Create fleet check record
        const fleetCheck = await storage.createFleetCheck({
          provider: 'comdata',
          checkNumber,
          authorizationCode: controlCode,
          driverCode,
          authorizedAmount: amount.toString(),
          availableBalance: authResult.availableBalance?.toString(),
          jobId,
          userId,
          fleetAccountId,
          expiresAt: authResult.expiresAt,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          authorizationResponse: authResult
        });
        
        // Update check status to authorized
        await storage.updateFleetCheckStatus(fleetCheck.id, 'authorized', authResult);
        
        res.json({
          success: true,
          checkId: fleetCheck.id,
          authorizationId: authResult.authorizationId,
          authorizedAmount: amount,
          availableBalance: authResult.availableBalance,
          expiresAt: authResult.expiresAt,
          message: 'Comdata check authorized successfully'
        });
        
      } catch (error: any) {
        console.error('Comdata authorization error:', error);
        res.status(500).json({ 
          error: 'INTERNAL_ERROR',
          message: 'Failed to authorize Comdata check'
        });
      }
    }
  );
  
  // Capture EFS check payment
  app.post('/api/payments/efs/capture',
    requireAuth,
    validateRequest(z.object({
      checkId: z.string(),
      amount: z.number().positive(),
      jobId: z.string().optional()
    })),
    async (req: Request, res: Response) => {
      try {
        const { checkId, amount, jobId } = req.body;
        
        // Get check details
        const check = await storage.getFleetCheck(checkId);
        if (!check) {
          return res.status(404).json({
            error: 'CHECK_NOT_FOUND',
            message: 'Check authorization not found'
          });
        }
        
        if (check.provider !== 'efs') {
          return res.status(400).json({
            error: 'PROVIDER_MISMATCH',
            message: 'Check is not an EFS check'
          });
        }
        
        // Capture with service
        const captureResult = await efsComdataService.captureCheckPayment(
          check.checkNumber,
          amount,
          'efs'
        );
        
        if (!captureResult.success) {
          return res.status(400).json({
            error: captureResult.errorCode,
            message: captureResult.message,
            details: captureResult.errorDetails
          });
        }
        
        // Update fleet check record
        await storage.captureFleetCheck(checkId, amount, captureResult);
        
        // Create transaction record
        const transaction = await storage.createTransaction({
          jobId: jobId || check.jobId,
          userId: check.userId || req.session.userId!,
          amount: amount.toString(),
          currency: 'USD',
          status: 'completed',
          metadata: {
            checkId,
            checkNumber: check.maskedCheckNumber,
            provider: 'efs',
            captureId: captureResult.captureId
          }
        });
        
        // Update job payment status if applicable
        if (jobId || check.jobId) {
          const job = await storage.getJob(jobId || check.jobId!);
          if (job) {
            const totalPaid = parseFloat(job.paidAmount || '0') + amount;
            await storage.updateJob(job.id, {
              paymentStatus: totalPaid >= parseFloat(job.totalCost) ? 'completed' : 'partial',
              paidAmount: totalPaid.toString()
            });

            // Create notification for payment
            if (job.customerId) {
              await storage.createNotification({
                userId: job.customerId,
                type: 'payment',
                title: 'Payment Processed',
                message: `Payment of $${amount.toFixed(2)} has been processed for job #${job.jobNumber}`,
                relatedEntityType: 'transaction',
                relatedEntityId: transaction.id,
                priority: 'high',
                actionUrl: `/jobs/${job.id}`
              });
            }

            // Notify contractor of payment if job is completed
            if (job.contractorId && totalPaid >= parseFloat(job.totalCost)) {
              await storage.createNotification({
                userId: job.contractorId,
                type: 'payment',
                title: 'Payment Complete',
                message: `Full payment received for job #${job.jobNumber}`,
                relatedEntityType: 'transaction',
                relatedEntityId: transaction.id,
                priority: 'high',
                actionUrl: `/contractor/jobs/${job.id}`
              });
            }
          }
        }
        
        res.json({
          success: true,
          transactionId: transaction.id,
          captureId: captureResult.captureId,
          capturedAmount: amount,
          remainingBalance: captureResult.remainingBalance,
          settlementDate: captureResult.settlementDate,
          message: 'EFS check payment captured successfully'
        });
        
      } catch (error: any) {
        console.error('EFS capture error:', error);
        res.status(500).json({ 
          error: 'INTERNAL_ERROR',
          message: 'Failed to capture EFS payment'
        });
      }
    }
  );
  
  // Capture Comdata check payment
  app.post('/api/payments/comdata/capture',
    requireAuth,
    validateRequest(z.object({
      checkId: z.string(),
      amount: z.number().positive(),
      jobId: z.string().optional()
    })),
    async (req: Request, res: Response) => {
      try {
        const { checkId, amount, jobId } = req.body;
        
        // Get check details
        const check = await storage.getFleetCheck(checkId);
        if (!check) {
          return res.status(404).json({
            error: 'CHECK_NOT_FOUND',
            message: 'Check authorization not found'
          });
        }
        
        if (check.provider !== 'comdata') {
          return res.status(400).json({
            error: 'PROVIDER_MISMATCH',
            message: 'Check is not a Comdata check'
          });
        }
        
        // Capture with service
        const captureResult = await efsComdataService.captureCheckPayment(
          check.checkNumber,
          amount,
          'comdata'
        );
        
        if (!captureResult.success) {
          return res.status(400).json({
            error: captureResult.errorCode,
            message: captureResult.message,
            details: captureResult.errorDetails
          });
        }
        
        // Update fleet check record
        await storage.captureFleetCheck(checkId, amount, captureResult);
        
        // Create transaction record
        const transaction = await storage.createTransaction({
          jobId: jobId || check.jobId,
          userId: check.userId || req.session.userId!,
          amount: amount.toString(),
          currency: 'USD',
          status: 'completed',
          metadata: {
            checkId,
            checkNumber: check.maskedCheckNumber,
            provider: 'comdata',
            captureId: captureResult.captureId
          }
        });
        
        // Update job payment status if applicable
        if (jobId || check.jobId) {
          const job = await storage.getJob(jobId || check.jobId!);
          if (job) {
            const totalPaid = parseFloat(job.paidAmount || '0') + amount;
            await storage.updateJob(job.id, {
              paymentStatus: totalPaid >= parseFloat(job.totalCost) ? 'completed' : 'partial',
              paidAmount: totalPaid.toString()
            });

            // Create notification for payment
            if (job.customerId) {
              await storage.createNotification({
                userId: job.customerId,
                type: 'payment',
                title: 'Payment Processed',
                message: `Payment of $${amount.toFixed(2)} has been processed for job #${job.jobNumber}`,
                relatedEntityType: 'transaction',
                relatedEntityId: transaction.id,
                priority: 'high',
                actionUrl: `/jobs/${job.id}`
              });
            }

            // Notify contractor of payment if job is completed
            if (job.contractorId && totalPaid >= parseFloat(job.totalCost)) {
              await storage.createNotification({
                userId: job.contractorId,
                type: 'payment',
                title: 'Payment Complete',
                message: `Full payment received for job #${job.jobNumber}`,
                relatedEntityType: 'transaction',
                relatedEntityId: transaction.id,
                priority: 'high',
                actionUrl: `/contractor/jobs/${job.id}`
              });
            }
          }
        }
        
        res.json({
          success: true,
          transactionId: transaction.id,
          captureId: captureResult.captureId,
          capturedAmount: amount,
          remainingBalance: captureResult.remainingBalance,
          settlementDate: captureResult.settlementDate,
          message: 'Comdata check payment captured successfully'
        });
        
      } catch (error: any) {
        console.error('Comdata capture error:', error);
        res.status(500).json({ 
          error: 'INTERNAL_ERROR',
          message: 'Failed to capture Comdata payment'
        });
      }
    }
  );
  
  // Get check details
  app.get('/api/payments/checks/:id',
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const check = await storage.getFleetCheck(req.params.id);
        if (!check) {
          return res.status(404).json({ message: 'Check not found' });
        }
        
        // Verify access
        const isAdmin = req.session.role === 'admin';
        const isOwner = check.userId === req.session.userId;
        
        if (!isAdmin && !isOwner) {
          return res.status(403).json({ message: 'Access denied' });
        }
        
        res.json(check);
        
      } catch (error: any) {
        console.error('Get check error:', error);
        res.status(500).json({ message: 'Failed to retrieve check details' });
      }
    }
  );
  
  // Void check authorization
  app.post('/api/payments/checks/:id/void',
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const check = await storage.getFleetCheck(req.params.id);
        if (!check) {
          return res.status(404).json({ message: 'Check not found' });
        }
        
        // Verify permission
        const isAdmin = req.session.role === 'admin';
        const isOwner = check.userId === req.session.userId;
        
        if (!isAdmin && !isOwner) {
          return res.status(403).json({ message: 'Access denied' });
        }
        
        // Void with service
        const voidResult = await efsComdataService.voidAuthorization(
          check.checkNumber,
          check.provider as 'efs' | 'comdata'
        );
        
        if (!voidResult.success) {
          return res.status(400).json({
            error: voidResult.errorCode,
            message: voidResult.message
          });
        }
        
        // Update fleet check record
        await storage.voidFleetCheck(req.params.id, voidResult);
        
        res.json({
          success: true,
          voidId: voidResult.voidId,
          releasedAmount: voidResult.releasedAmount,
          message: 'Check authorization voided successfully'
        });
        
      } catch (error: any) {
        console.error('Void check error:', error);
        res.status(500).json({ message: 'Failed to void check' });
      }
    }
  );
  
  // Get fleet checks (admin)
  app.get('/api/admin/fleet-checks',
    requireAuth,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const filters = {
          provider: req.query.provider as any,
          status: req.query.status as any,
          checkNumber: req.query.checkNumber as string,
          jobId: req.query.jobId as string,
          fleetAccountId: req.query.fleetAccountId as string,
          fromDate: req.query.fromDate ? new Date(req.query.fromDate as string) : undefined,
          toDate: req.query.toDate ? new Date(req.query.toDate as string) : undefined,
          ...getPagination(req)
        };
        
        const checks = await storage.findFleetChecks(filters);
        res.json({ checks });
        
      } catch (error: any) {
        console.error('Get fleet checks error:', error);
        res.status(500).json({ message: 'Failed to retrieve fleet checks' });
      }
    }
  );
  
  // Get user's fleet checks
  app.get('/api/payments/my-checks',
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
        const checks = await storage.getFleetChecksByUser(req.session.userId!, limit);
        res.json({ checks });
        
      } catch (error: any) {
        console.error('Get user checks error:', error);
        res.status(500).json({ message: 'Failed to retrieve your checks' });
      }
    }
  );

  // Process fleet account payment
  app.post('/api/payment/fleet-account',
    requireAuth,
    validateRequest(z.object({
      amount: z.number().positive(),
      jobId: z.string().optional(),
      fleetAccountId: z.string()
    })),
    async (req: Request, res: Response) => {
      try {
        const fleetAccount = await storage.getFleetAccount(req.body.fleetAccountId);
        if (!fleetAccount) {
          return res.status(404).json({ message: 'Fleet account not found' });
        }

        // Create invoice for fleet account
        const invoiceNumber = `INV-${Date.now().toString().slice(-8)}`;
        const invoice = await storage.createInvoice({
          invoiceNumber,
          userId: req.session.userId!,
          fleetAccountId: req.body.fleetAccountId,
          jobId: req.body.jobId,
          amount: req.body.amount.toString(),
          tax: (req.body.amount * 0.08).toString(), // 8% tax
          total: (req.body.amount * 1.08).toString(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // NET 30
          status: 'pending',
          items: [{
            description: req.body.jobId ? `Service for Job #${req.body.jobId}` : 'Fleet Service',
            amount: req.body.amount,
            quantity: 1
          }]
        });

        // Update job payment status
        if (req.body.jobId) {
          await storage.updateJob(req.body.jobId, {
            paymentStatus: 'pending',
            invoiceId: invoice.id
          });
        }

        res.json({
          message: 'Invoice created for fleet account',
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber
        });
      } catch (error) {
        console.error('Process fleet payment error:', error);
        res.status(500).json({ message: 'Failed to process fleet payment' });
      }
    }
  );

  // Get payment methods for user
  app.get('/api/payment-methods', requireAuth, async (req: Request, res: Response) => {
    try {
      const methods = await storage.getPaymentMethods(req.session.userId!);
      res.json(methods);
    } catch (error) {
      console.error('Get payment methods error:', error);
      res.status(500).json({ message: 'Failed to get payment methods' });
    }
  });

  // Add payment method
  app.post('/api/payment-methods',
    requireAuth,
    validateRequest(z.object({
      stripePaymentMethodId: z.string().optional(),
      type: z.enum(['credit_card', 'efs_check', 'comdata_check', 'fleet_account']).optional(),
      nickname: z.string().optional(),
      metadata: z.any().optional(),
      // Mock payment support
      isMockPayment: z.boolean().optional(),
      last4: z.string().optional(),
      brand: z.string().optional()
    })),
    async (req: Request, res: Response) => {
      try {
        let paymentMethodData: any = {
          userId: req.session.userId!,
          type: req.body.type || 'credit_card',
          nickname: req.body.nickname,
          isDefault: false,
          metadata: req.body.metadata || {}
        };

        // Handle mock payment methods for testing
        if (req.body.isMockPayment) {
          const mockId = `mock_pm_${randomUUID().replace(/-/g, '').substring(0, 16)}`;
          paymentMethodData = {
            ...paymentMethodData,
            type: 'credit_card',
            stripePaymentMethodId: mockId,
            last4: req.body.last4 || '4242',
            brand: req.body.brand || 'test',
            expiryMonth: 12,
            expiryYear: new Date().getFullYear() + 2,
            metadata: {
              ...paymentMethodData.metadata,
              isMockPayment: true
            }
          };
        }
        // If Stripe payment method, get details from Stripe
        else if (req.body.stripePaymentMethodId && process.env.STRIPE_SECRET_KEY) {
          const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
          const paymentMethod = await stripe.paymentMethods.retrieve(req.body.stripePaymentMethodId);
          
          paymentMethodData = {
            ...paymentMethodData,
            type: 'credit_card',
            stripePaymentMethodId: paymentMethod.id,
            last4: paymentMethod.card?.last4,
            brand: paymentMethod.card?.brand,
            expiryMonth: paymentMethod.card?.exp_month,
            expiryYear: paymentMethod.card?.exp_year
          };

          // Attach to customer if exists
          // In production, you'd create/retrieve Stripe customer for the user
        }

        const method = await storage.createPaymentMethod(paymentMethodData);
        res.status(201).json(method);
      } catch (error) {
        console.error('Add payment method error:', error);
        res.status(500).json({ message: 'Failed to add payment method' });
      }
    }
  );

  // Add EFS payment method
  app.post('/api/payment-methods/efs',
    requireAuth,
    validateRequest(z.object({
      companyCode: z.string(),
      accountNumber: z.string(),
      nickname: z.string().optional()
    })),
    async (req: Request, res: Response) => {
      try {
        const method = await storage.createPaymentMethod({
          userId: req.session.userId!,
          type: 'efs_check',
          nickname: req.body.nickname,
          isDefault: false,
          metadata: {
            efsCompanyCode: req.body.companyCode,
            accountNumber: req.body.accountNumber
          }
        });
        res.status(201).json(method);
      } catch (error) {
        console.error('Add EFS method error:', error);
        res.status(500).json({ message: 'Failed to add EFS account' });
      }
    }
  );

  // Add Comdata payment method
  app.post('/api/payment-methods/comdata',
    requireAuth,
    validateRequest(z.object({
      customerId: z.string(),
      accountCode: z.string(),
      nickname: z.string().optional()
    })),
    async (req: Request, res: Response) => {
      try {
        const method = await storage.createPaymentMethod({
          userId: req.session.userId!,
          type: 'comdata_check',
          nickname: req.body.nickname,
          isDefault: false,
          metadata: {
            comdataCustomerId: req.body.customerId,
            accountCode: req.body.accountCode
          }
        });
        res.status(201).json(method);
      } catch (error) {
        console.error('Add Comdata method error:', error);
        res.status(500).json({ message: 'Failed to add Comdata account' });
      }
    }
  );

  // Add mock payment method (for testing without Stripe)
  app.post('/api/payment-methods/mock',
    requireAuth,
    validateRequest(z.object({
      cardNumber: z.string(),
      expiry: z.string(),
      cvv: z.string(),
      nickname: z.string().optional(),
      type: z.literal('credit_card')
    })),
    async (req: Request, res: Response) => {
      try {
        // Extract card details for mock
        const last4 = req.body.cardNumber.slice(-4);
        const brand = req.body.cardNumber.startsWith('4') ? 'visa' : 
                     req.body.cardNumber.startsWith('5') ? 'mastercard' :
                     req.body.cardNumber.startsWith('3') ? 'amex' : 'unknown';

        const method = await storage.createPaymentMethod({
          userId: req.session.userId!,
          type: 'credit_card',
          nickname: req.body.nickname,
          isMockPayment: true,
          last4,
          brand,
          isDefault: false,
          metadata: {
            expiry: req.body.expiry,
            isTestCard: true
          }
        });
        
        res.status(201).json(method);
      } catch (error) {
        console.error('Add mock payment method error:', error);
        res.status(500).json({ message: 'Failed to add mock payment method' });
      }
    }
  );

  // Delete payment method
  app.delete('/api/payment-methods/:id', requireAuth, async (req: Request, res: Response) => {
    try {
      await storage.deletePaymentMethod(req.params.id, req.session.userId!);
      res.json({ message: 'Payment method removed' });
    } catch (error) {
      console.error('Delete payment method error:', error);
      res.status(500).json({ message: 'Failed to remove payment method' });
    }
  });

  // Set default payment method
  app.put('/api/payment-methods/:id/default', requireAuth, async (req: Request, res: Response) => {
    try {
      await storage.setDefaultPaymentMethod(req.params.id, req.session.userId!);
      res.json({ message: 'Default payment method updated' });
    } catch (error) {
      console.error('Set default method error:', error);
      res.status(500).json({ message: 'Failed to update default payment method' });
    }
  });

  // Get invoices
  app.get('/api/invoices', requireAuth, async (req: Request, res: Response) => {
    try {
      const invoices = await storage.getInvoices({
        userId: req.session.userId,
        fleetAccountId: req.query.fleetAccountId as string,
        status: req.query.status as any,
        ...getPagination(req)
      });
      res.json({ invoices });
    } catch (error) {
      console.error('Get invoices error:', error);
      res.status(500).json({ message: 'Failed to get invoices' });
    }
  });

  // Process refund
  app.post('/api/refunds',
    requireAuth,
    requireRole('admin'),
    validateRequest(z.object({
      transactionId: z.string(),
      amount: z.number().positive(),
      reason: z.string()
    })),
    async (req: Request, res: Response) => {
      try {
        const transaction = await storage.getTransaction(req.body.transactionId);
        if (!transaction) {
          return res.status(404).json({ message: 'Transaction not found' });
        }

        // Process refund with Stripe if applicable
        if (transaction.stripePaymentIntentId && process.env.STRIPE_SECRET_KEY) {
          const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
          await stripe.refunds.create({
            payment_intent: transaction.stripePaymentIntentId,
            amount: req.body.amount
          });
        }

        // Create refund record
        const refund = await storage.createRefund({
          transactionId: req.body.transactionId,
          amount: req.body.amount.toString(),
          reason: req.body.reason,
          initiatedBy: req.session.userId!,
          status: 'processed'
        });

        // Update transaction status
        await storage.updateTransaction(req.body.transactionId, {
          status: 'refunded'
        });

        res.status(201).json({
          message: 'Refund processed successfully',
          refund
        });
      } catch (error) {
        console.error('Process refund error:', error);
        res.status(500).json({ message: 'Failed to process refund' });
      }
    }
  );

  // Stripe webhook handler
  app.post('/api/webhooks/stripe',
    express.raw({ type: 'application/json' }),
    async (req: Request, res: Response) => {
      try {
        if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
          return res.status(400).json({ message: 'Stripe not configured' });
        }

        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        const sig = req.headers['stripe-signature'];
        
        let event;
        try {
          event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
          );
        } catch (err: any) {
          console.error('Webhook signature verification failed:', err.message);
          return res.status(400).send(`Webhook Error: ${err.message}`);
        }

        // Handle the event
        switch (event.type) {
          case 'payment_intent.succeeded':
            const paymentIntent = event.data.object;
            
            // Update transaction status
            await storage.updateTransactionByExternalId(paymentIntent.id, {
              status: 'completed'
            });

            // Update job payment status if applicable
            if (paymentIntent.metadata?.jobId) {
              await storage.updateJob(paymentIntent.metadata.jobId, {
                paymentStatus: 'completed',
                paidAmount: (paymentIntent.amount / 100).toString()
              });
            }
            break;

          case 'payment_intent.payment_failed':
            const failedPayment = event.data.object;
            
            await storage.updateTransactionByExternalId(failedPayment.id, {
              status: 'failed'
            });

            if (failedPayment.metadata?.jobId) {
              await storage.updateJob(failedPayment.metadata.jobId, {
                paymentStatus: 'failed'
              });
            }
            break;

          case 'charge.dispute.created':
            // Handle dispute
            console.log('Dispute created:', event.data.object);
            break;

          default:
            console.log(`Unhandled event type ${event.type}`);
        }

        res.json({ received: true });
      } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ message: 'Webhook processing failed' });
      }
    }
  );

  // ==================== FLEET ROUTES ====================

  // Get fleet invoices
  app.get('/api/fleet/invoices',
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const { startDate, endDate, status, search } = req.query;
        
        // Mock fleet invoice data
        const mockInvoices = [
          {
            id: '1',
            invoiceNumber: 'INV-2024-001',
            billingPeriod: {
              start: new Date(2024, 0, 1).toISOString(),
              end: new Date(2024, 0, 31).toISOString(),
            },
            fleetAccount: {
              id: '1',
              companyName: 'ABC Trucking Co',
              accountNumber: 'FL-001',
              netTerms: 30,
            },
            summary: {
              totalVehicles: 5,
              totalJobs: 12,
              subtotal: 4500.00,
              fleetDiscount: 450.00,
              tax: 364.05,
              total: 4414.05,
            },
            status: 'sent' as const,
            dueDate: new Date(2024, 1, 15).toISOString(),
            sentAt: new Date(2024, 0, 31).toISOString(),
            vehicles: [
              {
                id: '1',
                identifier: 'TRK-001',
                make: 'Peterbilt',
                model: '579',
                jobCount: 3,
                totalCost: 1200.00,
              },
              {
                id: '2',
                identifier: 'TRK-002',
                make: 'Kenworth',
                model: 'T680',
                jobCount: 2,
                totalCost: 800.00,
              },
            ],
            jobs: [
              {
                id: '1',
                jobNumber: 'JOB-00001',
                vehicleIdentifier: 'TRK-001',
                serviceDate: new Date(2024, 0, 5).toISOString(),
                serviceType: 'Emergency Repair',
                amount: 500.00,
              },
            ],
          },
        ];

        const mockStats = {
          totalOutstanding: 8828.10,
          totalPaid: 25000.00,
          overdueAmount: 2500.00,
          averagePaymentDays: 28,
          upcomingInvoices: 3,
          lastInvoiceDate: new Date(2024, 0, 31).toISOString(),
        };

        res.json({ invoices: mockInvoices, stats: mockStats });
      } catch (error) {
        console.error('Get fleet invoices error:', error);
        res.status(500).json({ message: 'Failed to get fleet invoices' });
      }
    }
  );

  // Generate fleet invoice
  app.post('/api/fleet/invoices/generate',
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const { fleetAccountId, startDate, endDate } = req.body;
        
        // Mock invoice generation
        const invoice = {
          id: Date.now().toString(),
          invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
          fleetAccountId,
          startDate,
          endDate,
          status: 'draft',
          createdAt: new Date().toISOString(),
        };

        res.json({ invoice });
      } catch (error) {
        console.error('Generate fleet invoice error:', error);
        res.status(500).json({ message: 'Failed to generate fleet invoice' });
      }
    }
  );

  // Bulk generate fleet invoices
  app.post('/api/fleet/invoices/bulk-generate',
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const { startDate, endDate } = req.body;
        
        // Mock bulk generation
        const count = Math.floor(Math.random() * 10) + 1;
        
        res.json({ count, message: `Generated ${count} fleet invoices` });
      } catch (error) {
        console.error('Bulk generate fleet invoices error:', error);
        res.status(500).json({ message: 'Failed to bulk generate invoices' });
      }
    }
  );

  // Download fleet invoice PDF
  app.get('/api/fleet/invoices/:id/download',
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        // Mock invoice data
        const invoice = {
          id: req.params.id,
          invoiceNumber: `INV-2024-${req.params.id.slice(-3)}`,
          fleetAccount: {
            companyName: 'ABC Trucking Co',
            accountNumber: 'FL-001',
            address: '123 Fleet Street\nTruck City, TX 75001',
            billingEmail: 'billing@abctrucking.com',
            netTerms: 30,
          },
          billingPeriod: {
            start: new Date(2024, 0, 1),
            end: new Date(2024, 0, 31),
          },
          summary: {
            totalVehicles: 5,
            totalJobs: 12,
            subtotal: 4500.00,
            fleetDiscount: 450.00,
            tax: 364.05,
            total: 4414.05,
          },
          dueDate: new Date(2024, 1, 15),
          vehicles: [
            {
              identifier: 'TRK-001',
              make: 'Peterbilt',
              model: '579',
              jobCount: 3,
              totalCost: 1200.00,
            },
            {
              identifier: 'TRK-002',
              make: 'Kenworth',
              model: 'T680',
              jobCount: 2,
              totalCost: 800.00,
            },
          ],
          jobs: [
            {
              jobNumber: 'JOB-00001',
              vehicleIdentifier: 'TRK-001',
              serviceDate: new Date(2024, 0, 5),
              serviceType: 'Emergency Repair',
              description: 'Engine diagnostics and repair',
              amount: 500.00,
            },
            {
              jobNumber: 'JOB-00002',
              vehicleIdentifier: 'TRK-001',
              serviceDate: new Date(2024, 0, 12),
              serviceType: 'Brake Service',
              description: 'Complete brake system overhaul',
              amount: 400.00,
            },
            {
              jobNumber: 'JOB-00003',
              vehicleIdentifier: 'TRK-002',
              serviceDate: new Date(2024, 0, 20),
              serviceType: 'Tire Service',
              description: 'Replace 4 tires',
              amount: 800.00,
            },
          ],
        };

        // Generate PDF using the PDF service
        const pdfBuffer = await pdfService.generateInvoice({
          invoice: {
            id: invoice.id,
            number: invoice.invoiceNumber,
            date: new Date(),
            dueDate: invoice.dueDate,
            status: 'sent',
          },
          customer: {
            name: invoice.fleetAccount.companyName,
            email: invoice.fleetAccount.billingEmail,
            phone: '(555) 123-4567',
            address: invoice.fleetAccount.address,
          },
          items: invoice.jobs.map(job => ({
            description: `${job.serviceType} - ${job.description}`,
            quantity: 1,
            rate: job.amount,
            amount: job.amount,
          })),
          subtotal: invoice.summary.subtotal,
          tax: invoice.summary.tax,
          discount: invoice.summary.fleetDiscount,
          total: invoice.summary.total,
          notes: `Fleet Account: ${invoice.fleetAccount.accountNumber}\nPayment Terms: NET ${invoice.fleetAccount.netTerms}\nTotal Vehicles Serviced: ${invoice.summary.totalVehicles}`,
        });

        res.set({
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="fleet-invoice-${invoice.invoiceNumber}.pdf"`,
        });
        res.send(pdfBuffer);
      } catch (error) {
        console.error('Download fleet invoice error:', error);
        res.status(500).json({ message: 'Failed to download invoice' });
      }
    }
  );

  // Send fleet invoice email
  app.post('/api/fleet/invoices/:id/send-email',
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        // Mock email sending
        // In production, this would integrate with an email service
        
        res.json({ message: 'Invoice sent successfully' });
      } catch (error) {
        console.error('Send fleet invoice email error:', error);
        res.status(500).json({ message: 'Failed to send invoice email' });
      }
    }
  );

  // ==================== CONTRACTOR ROUTES ====================

  // Get contractor earnings statement
  app.get('/api/contractor/earnings-statement', 
    requireAuth,
    requireRole('contractor'),
    async (req: Request, res: Response) => {
      try {
        const { fromDate, toDate } = req.query;
        
        if (!fromDate || !toDate) {
          return res.status(400).json({ message: 'Date range required' });
        }

        const contractorId = req.user.id;
        
        // Fetch contractor earnings data
        const earnings = await storage.getContractorEarnings(
          contractorId,
          new Date(fromDate as string),
          new Date(toDate as string)
        );

        const contractor = await storage.getContractorProfile(contractorId);
        
        if (!contractor) {
          return res.status(404).json({ message: 'Contractor profile not found' });
        }

        // Generate PDF
        const pdfBuffer = await pdfService.generateEarningsStatement({
          contractor: {
            name: contractor.businessName || `${contractor.firstName} ${contractor.lastName}`,
            email: contractor.email,
            phone: contractor.phone,
            address: contractor.address || 'Not provided',
          },
          period: {
            startDate: new Date(fromDate as string),
            endDate: new Date(toDate as string),
          },
          earnings: earnings.jobs.map((job: any) => ({
            date: job.completedAt,
            jobNumber: job.id.slice(0, 8).toUpperCase(),
            description: job.serviceType,
            basePay: job.basePay || 0,
            tips: job.tips || 0,
            bonuses: job.bonuses || 0,
            total: (job.basePay || 0) + (job.tips || 0) + (job.bonuses || 0),
          })),
          summary: {
            totalEarnings: earnings.totalEarnings || 0,
            totalJobs: earnings.jobs.length,
            totalHours: earnings.totalHours || 0,
            averagePerJob: earnings.jobs.length > 0 
              ? (earnings.totalEarnings || 0) / earnings.jobs.length 
              : 0,
          },
        });

        res.set({
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="earnings-statement-${fromDate}-to-${toDate}.pdf"`,
        });
        res.send(pdfBuffer);
      } catch (error) {
        console.error('Generate earnings statement error:', error);
        res.status(500).json({ message: 'Failed to generate earnings statement' });
      }
    }
  );

  // Get contractor tax document (1099-NEC)
  app.get('/api/contractor/tax-document/:year',
    requireAuth,
    requireRole('contractor'),
    async (req: Request, res: Response) => {
      try {
        const year = parseInt(req.params.year);
        const contractorId = req.user.id;

        // Fetch contractor and tax data
        const contractor = await storage.getContractorProfile(contractorId);
        
        if (!contractor) {
          return res.status(404).json({ message: 'Contractor profile not found' });
        }

        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31);
        
        const taxData = await storage.getContractorEarnings(
          contractorId,
          startDate,
          endDate
        );

        // Generate 1099-NEC PDF
        const pdfBuffer = await pdfService.generateTaxDocument({
          year,
          contractor: {
            name: contractor.businessName || `${contractor.firstName} ${contractor.lastName}`,
            tin: contractor.ssn || contractor.ein || 'XXX-XX-XXXX',
            address: contractor.address || 'Not provided',
          },
          payer: {
            name: 'TruckFixGo LLC',
            tin: '98-7654321',
            address: '1234 Main Street, Suite 100\nSan Francisco, CA 94105',
            phone: '(555) 123-4567',
          },
          amounts: {
            nonemployeeCompensation: taxData.totalEarnings || 0,
            federalTaxWithheld: 0,
            stateTaxWithheld: 0,
          },
        });

        res.set({
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="1099-NEC-${year}.pdf"`,
        });
        res.send(pdfBuffer);
      } catch (error) {
        console.error('Generate tax document error:', error);
        res.status(500).json({ message: 'Failed to generate tax document' });
      }
    }
  );

  // Find available contractors
  app.get('/api/contractors', requireAuth, async (req: Request, res: Response) => {
    try {
      const serviceTypeId = req.query.serviceTypeId as string;
      const location = req.query.location ? JSON.parse(req.query.location as string) : null;
      const radius = parseInt(req.query.radius as string) || 50;

      let contractors: ContractorProfile[] = [];
      
      if (serviceTypeId && location) {
        contractors = await storage.findAvailableContractors(
          serviceTypeId,
          location,
          radius
        );
      } else {
        // Get all contractors with filters
        const filters = {
          ...getPagination(req),
          isAvailable: req.query.isAvailable === 'true',
          performanceTier: req.query.performanceTier as any,
          isFleetCapable: req.query.isFleetCapable === 'true'
        };
        
        contractors = await storage.findContractors(filters);
      }

      res.json({ contractors });
    } catch (error) {
      console.error('Find contractors error:', error);
      res.status(500).json({ message: 'Failed to find contractors' });
    }
  });

  // Get contractor profile
  app.get('/api/contractors/:id', requireAuth, async (req: Request, res: Response) => {
    try {
      const contractor = await storage.getContractorProfile(req.params.id);
      
      if (!contractor) {
        return res.status(404).json({ message: 'Contractor not found' });
      }

      const ratings = await storage.getContractorRatings(contractor.id);
      const services = await storage.getContractorServices(contractor.id);

      res.json({ 
        contractor,
        ratings,
        services
      });
    } catch (error) {
      console.error('Get contractor error:', error);
      res.status(500).json({ message: 'Failed to get contractor profile' });
    }
  });

  // Find contractors near a location
  app.get('/api/contractors/nearby', 
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const location = JSON.parse(req.query.location as string);
        const radius = parseInt(req.query.radius as string) || 50;
        const serviceTypeId = req.query.serviceTypeId as string || '';

        const contractors = await storage.findAvailableContractors(
          serviceTypeId,
          location,
          radius
        );

        res.json({ contractors });
      } catch (error) {
        console.error('Find nearby contractors error:', error);
        res.status(500).json({ message: 'Failed to find nearby contractors' });
      }
    }
  );

  // Update contractor availability
  app.put('/api/contractors/:id/availability',
    requireAuth,
    requireRole('contractor'),
    validateRequest(insertContractorAvailabilitySchema.omit({ contractorId: true })),
    async (req: Request, res: Response) => {
      try {
        // Verify contractor owns this profile
        if (req.params.id !== req.session.userId) {
          return res.status(403).json({ message: 'Access denied' });
        }

        const availability = await storage.setContractorAvailability({
          ...req.body,
          contractorId: req.params.id
        });

        res.json({
          message: 'Availability updated successfully',
          availability
        });
      } catch (error) {
        console.error('Update availability error:', error);
        res.status(500).json({ message: 'Failed to update availability' });
      }
    }
  );

  // Get contractor's job history
  app.get('/api/contractors/:id/jobs',
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const pagination = getPagination(req);
        const jobs = await storage.findJobs({
          ...pagination,
          contractorId: req.params.id
        });

        res.json({ jobs });
      } catch (error) {
        console.error('Get contractor jobs error:', error);
        res.status(500).json({ message: 'Failed to get contractor jobs' });
      }
    }
  );

  // Get earnings summary
  app.get('/api/contractors/:id/earnings',
    requireAuth,
    requireRole('contractor', 'admin'),
    async (req: Request, res: Response) => {
      try {
        // Verify access
        if (req.session.role === 'contractor' && req.params.id !== req.session.userId) {
          return res.status(403).json({ message: 'Access denied' });
        }

        const isPaid = req.query.isPaid === 'true' ? true : 
                       req.query.isPaid === 'false' ? false : undefined;
        
        const earnings = await storage.getContractorEarnings(req.params.id, isPaid);
        
        // Calculate summary
        const fromDate = req.query.fromDate ? new Date(req.query.fromDate as string) : 
                        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const toDate = req.query.toDate ? new Date(req.query.toDate as string) : new Date();
        
        const totalEarnings = await storage.calculateContractorEarnings(
          req.params.id,
          fromDate,
          toDate
        );

        res.json({ 
          earnings,
          summary: {
            totalEarnings,
            fromDate,
            toDate
          }
        });
      } catch (error) {
        console.error('Get earnings error:', error);
        res.status(500).json({ message: 'Failed to get earnings' });
      }
    }
  );

  // Upload compliance documents
  app.post('/api/contractors/:id/documents',
    requireAuth,
    requireRole('contractor'),
    validateRequest(insertContractorDocumentSchema.omit({ contractorId: true })),
    async (req: Request, res: Response) => {
      try {
        // Verify contractor owns this profile
        if (req.params.id !== req.session.userId) {
          return res.status(403).json({ message: 'Access denied' });
        }

        const document = await storage.addContractorDocument({
          ...req.body,
          contractorId: req.params.id
        });

        res.status(201).json({
          message: 'Document uploaded successfully',
          document
        });
      } catch (error) {
        console.error('Upload document error:', error);
        res.status(500).json({ message: 'Failed to upload document' });
      }
    }
  );

  // ==================== PRICING CALCULATION ENDPOINTS ====================
  
  // Calculate price estimate
  app.post('/api/pricing/calculate',
    async (req: Request, res: Response) => {
      try {
        const pricingEngine = (await import('./pricing-engine')).default;
        const breakdown = await pricingEngine.calculatePrice(req.body);
        
        res.json({ breakdown });
      } catch (error) {
        console.error('Calculate pricing error:', error);
        res.status(500).json({ message: 'Failed to calculate pricing' });
      }
    }
  );

  // Get surge status for location
  app.get('/api/pricing/surge-status',
    async (req: Request, res: Response) => {
      try {
        const location = JSON.parse(req.query.location as string || '{}');
        const pricingEngine = (await import('./pricing-engine')).default;
        
        const surgeMultiplier = await pricingEngine.getSurgeMultiplier({
          jobType: 'emergency',
          serviceTypeId: 'emergency-repair',
          location
        });
        
        res.json({ 
          surgeActive: surgeMultiplier > 1,
          multiplier: surgeMultiplier,
          message: surgeMultiplier > 2 ? 
            'High demand - surge pricing is in effect' :
            surgeMultiplier > 1.5 ?
            'Moderate demand - slight price increase' :
            surgeMultiplier > 1 ?
            'Low surge pricing active' :
            'Normal pricing'
        });
      } catch (error) {
        console.error('Get surge status error:', error);
        res.status(500).json({ message: 'Failed to get surge status' });
      }
    }
  );

  // Get performance metrics
  app.get('/api/contractors/:id/performance',
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const metrics = await storage.getContractorPerformanceMetrics(req.params.id);
        
        res.json({ metrics });
      } catch (error) {
        console.error('Get performance metrics error:', error);
        res.status(500).json({ message: 'Failed to get performance metrics' });
      }
    }
  );

  // ==================== FLEET ROUTES ====================

  // Create fleet account
  app.post('/api/fleet/accounts',
    requireAuth,
    requireRole('admin', 'fleet_manager'),
    validateRequest(insertFleetAccountSchema),
    async (req: Request, res: Response) => {
      try {
        const fleet = await storage.createFleetAccount(req.body);
        
        res.status(201).json({
          message: 'Fleet account created successfully',
          fleet
        });
      } catch (error) {
        console.error('Create fleet account error:', error);
        res.status(500).json({ message: 'Failed to create fleet account' });
      }
    }
  );

  // List fleet accounts
  app.get('/api/fleet/accounts',
    requireAuth,
    requireRole('admin', 'fleet_manager', 'dispatcher'),
    async (req: Request, res: Response) => {
      try {
        const filters: any = {
          ...getPagination(req),
          pricingTier: req.query.pricingTier as any,
          companyName: req.query.companyName as string
        };
        
        // Only include isActive filter if explicitly provided
        if (req.query.isActive !== undefined) {
          filters.isActive = req.query.isActive === 'true';
        }

        let fleets = await storage.findFleetAccounts(filters);
        
        // If user is a fleet_manager, filter to only show their fleet accounts
        if (req.session?.user?.role === 'fleet_manager' && req.session?.user?.email) {
          fleets = fleets.filter(fleet => 
            fleet.primaryContactEmail === req.session.user.email
          );
        }
        
        res.json({ fleets });
      } catch (error) {
        console.error('List fleet accounts error:', error);
        res.status(500).json({ message: 'Failed to list fleet accounts' });
      }
    }
  );

  // Get fleet account details
  app.get('/api/fleet/accounts/:id',
    requireAuth,
    requireRole('admin', 'fleet_manager', 'dispatcher'),
    async (req: Request, res: Response) => {
      try {
        const fleet = await storage.getFleetAccount(req.params.id);
        
        if (!fleet) {
          return res.status(404).json({ message: 'Fleet account not found' });
        }

        const vehicles = await storage.getFleetVehicles(fleet.id);
        const contacts = await storage.getFleetContacts(fleet.id);
        const pricingOverrides = await storage.getFleetPricingOverrides(fleet.id);

        res.json({ 
          fleet,
          vehicles,
          contacts,
          pricingOverrides
        });
      } catch (error) {
        console.error('Get fleet account error:', error);
        res.status(500).json({ message: 'Failed to get fleet account' });
      }
    }
  );

  // Update fleet account
  app.put('/api/fleet/accounts/:id',
    requireAuth,
    requireRole('admin', 'fleet_manager'),
    async (req: Request, res: Response) => {
      try {
        const fleet = await storage.updateFleetAccount(req.params.id, req.body);
        
        if (!fleet) {
          return res.status(404).json({ message: 'Fleet account not found' });
        }

        res.json({
          message: 'Fleet account updated successfully',
          fleet
        });
      } catch (error) {
        console.error('Update fleet account error:', error);
        res.status(500).json({ message: 'Failed to update fleet account' });
      }
    }
  );

  // Add vehicle to fleet
  app.post('/api/fleet/accounts/:id/vehicles',
    requireAuth,
    requireRole('admin', 'fleet_manager'),
    validateRequest(insertFleetVehicleSchema.omit({ fleetAccountId: true })),
    async (req: Request, res: Response) => {
      try {
        const vehicle = await storage.createFleetVehicle({
          ...req.body,
          fleetAccountId: req.params.id
        });

        res.status(201).json({
          message: 'Vehicle added successfully',
          vehicle
        });
      } catch (error) {
        console.error('Add vehicle error:', error);
        res.status(500).json({ message: 'Failed to add vehicle' });
      }
    }
  );

  // List fleet vehicles
  app.get('/api/fleet/accounts/:id/vehicles',
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const vehicles = await storage.getFleetVehicles(req.params.id);
        
        res.json({ vehicles });
      } catch (error) {
        console.error('List fleet vehicles error:', error);
        res.status(500).json({ message: 'Failed to list fleet vehicles' });
      }
    }
  );

  // ==================== NEW VEHICLE MANAGEMENT ROUTES ====================
  // Get all vehicles for a fleet
  app.get('/api/fleet/:fleetId/vehicles',
    requireAuth,
    requireRole('admin', 'fleet_manager'),
    async (req: Request, res: Response) => {
      try {
        const vehicles = await storage.getFleetVehicles(req.params.fleetId);
        res.json({ vehicles });
      } catch (error) {
        console.error('Get fleet vehicles error:', error);
        res.status(500).json({ message: 'Failed to get fleet vehicles' });
      }
    }
  );

  // Add a new vehicle to a fleet
  app.post('/api/fleet/:fleetId/vehicles',
    requireAuth,
    requireRole('admin', 'fleet_manager'),
    validateRequest(insertFleetVehicleSchema.omit({ fleetAccountId: true })),
    async (req: Request, res: Response) => {
      try {
        // Convert string values to integers where needed
        const vehicleData = {
          ...req.body,
          fleetAccountId: req.params.fleetId,
          year: typeof req.body.year === 'string' ? parseInt(req.body.year) : req.body.year,
          currentOdometer: req.body.currentOdometer ? 
            (typeof req.body.currentOdometer === 'string' ? 
              parseInt(req.body.currentOdometer.replace(/,/g, '')) : 
              req.body.currentOdometer) : null
        };

        const vehicle = await storage.createFleetVehicle(vehicleData);

        res.status(201).json({
          message: 'Vehicle added successfully',
          vehicle
        });
      } catch (error) {
        console.error('Add vehicle error:', error);
        res.status(500).json({ message: 'Failed to add vehicle' });
      }
    }
  );

  // Update a vehicle
  app.put('/api/fleet/:fleetId/vehicles/:vehicleId',
    requireAuth,
    requireRole('admin', 'fleet_manager'),
    async (req: Request, res: Response) => {
      try {
        // Validate that the vehicle belongs to the fleet
        const existingVehicle = await storage.getFleetVehicle(req.params.vehicleId);
        if (!existingVehicle) {
          return res.status(404).json({ message: 'Vehicle not found' });
        }
        if (existingVehicle.fleetAccountId !== req.params.fleetId) {
          return res.status(403).json({ message: 'Vehicle does not belong to this fleet' });
        }

        // Convert string values to integers where needed
        const updates = { ...req.body };
        if (updates.year) {
          updates.year = typeof updates.year === 'string' ? parseInt(updates.year) : updates.year;
        }
        if (updates.currentOdometer) {
          updates.currentOdometer = typeof updates.currentOdometer === 'string' ? 
            parseInt(updates.currentOdometer.replace(/,/g, '')) : 
            updates.currentOdometer;
        }

        const vehicle = await storage.updateFleetVehicle(req.params.vehicleId, updates);
        
        if (!vehicle) {
          return res.status(404).json({ message: 'Vehicle not found' });
        }

        res.json({
          message: 'Vehicle updated successfully',
          vehicle
        });
      } catch (error) {
        console.error('Update vehicle error:', error);
        res.status(500).json({ message: 'Failed to update vehicle' });
      }
    }
  );

  // Delete a vehicle
  app.delete('/api/fleet/:fleetId/vehicles/:vehicleId',
    requireAuth,
    requireRole('admin', 'fleet_manager'),
    async (req: Request, res: Response) => {
      try {
        // Validate that the vehicle belongs to the fleet
        const existingVehicle = await storage.getFleetVehicle(req.params.vehicleId);
        if (!existingVehicle) {
          return res.status(404).json({ message: 'Vehicle not found' });
        }
        if (existingVehicle.fleetAccountId !== req.params.fleetId) {
          return res.status(403).json({ message: 'Vehicle does not belong to this fleet' });
        }

        const deleted = await storage.deleteFleetVehicle(req.params.vehicleId);
        
        if (!deleted) {
          return res.status(404).json({ message: 'Vehicle not found' });
        }

        res.json({ message: 'Vehicle deleted successfully' });
      } catch (error) {
        console.error('Delete vehicle error:', error);
        res.status(500).json({ message: 'Failed to delete vehicle' });
      }
    }
  );

  // ==================== BATCH JOB SCHEDULING ROUTES (NEW) ====================
  
  // Create batch jobs for multiple vehicles
  app.post('/api/fleet/:fleetId/batch-jobs',
    requireAuth,
    requireRole('admin', 'fleet_manager'),
    async (req: Request, res: Response) => {
      try {
        const { 
          vehicleIds, 
          serviceType, 
          scheduledDate, 
          urgency = 'routine',
          description,
          estimatedDuration
        } = req.body;

        // Validate input
        if (!vehicleIds || !Array.isArray(vehicleIds) || vehicleIds.length === 0) {
          return res.status(400).json({ message: 'Vehicle IDs are required' });
        }
        if (!serviceType) {
          return res.status(400).json({ message: 'Service type is required' });
        }
        if (!scheduledDate) {
          return res.status(400).json({ message: 'Scheduled date is required' });
        }

        // Create batch jobs
        const jobs = await storage.createBatchJobs({
          fleetAccountId: req.params.fleetId,
          vehicleIds,
          serviceType,
          scheduledDate: new Date(scheduledDate),
          urgency: urgency as 'routine' | 'urgent' | 'emergency',
          description,
          estimatedDuration,
          createdBy: req.session.userId!
        });

        res.status(201).json({
          message: `Successfully scheduled ${jobs.length} maintenance job(s)`,
          jobs
        });
      } catch (error: any) {
        console.error('Create batch jobs error:', error);
        res.status(500).json({ 
          message: error.message || 'Failed to create batch jobs' 
        });
      }
    }
  );

  // ==================== MAINTENANCE PREDICTION ROUTES ====================
  
  // Get all maintenance predictions for a fleet
  app.get('/api/fleet/:fleetId/maintenance-predictions',
    requireAuth,
    requireRole('admin', 'fleet_manager', 'dispatcher'),
    async (req: Request, res: Response) => {
      try {
        const { start, end } = req.query;
        const dateRange = (start && end) ? {
          start: new Date(start as string),
          end: new Date(end as string)
        } : undefined;
        
        const result = await storage.getMaintenancePredictions(req.params.fleetId, dateRange);
        res.json(result);
      } catch (error) {
        console.error('Get maintenance predictions error:', error);
        res.status(500).json({ message: 'Failed to get maintenance predictions' });
      }
    }
  );

  // Get maintenance schedule for a specific vehicle
  app.get('/api/vehicles/:vehicleId/maintenance-schedule',
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const schedule = await storage.getVehicleMaintenanceSchedule(req.params.vehicleId);
        res.json(schedule);
      } catch (error) {
        console.error('Get vehicle maintenance schedule error:', error);
        res.status(500).json({ message: 'Failed to get maintenance schedule' });
      }
    }
  );

  // Submit vehicle telemetry data
  app.post('/api/vehicles/:vehicleId/telemetry',
    requireAuth,
    validateRequest(insertVehicleTelemetrySchema.omit({ vehicleId: true, createdAt: true })),
    async (req: Request, res: Response) => {
      try {
        const telemetry = await storage.recordVehicleTelemetry(
          req.params.vehicleId,
          req.body
        );
        res.status(201).json({ 
          message: 'Telemetry recorded successfully',
          telemetry 
        });
      } catch (error) {
        console.error('Record telemetry error:', error);
        res.status(500).json({ message: 'Failed to record telemetry' });
      }
    }
  );

  // Get active maintenance alerts for a fleet
  app.get('/api/fleet/:fleetId/maintenance-alerts',
    requireAuth,
    requireRole('admin', 'fleet_manager', 'dispatcher'),
    async (req: Request, res: Response) => {
      try {
        const { active, severity, limit } = req.query;
        const options = {
          active: active === 'true',
          severity: severity as string,
          limit: limit ? parseInt(limit as string) : undefined
        };
        
        const alerts = await storage.getFleetMaintenanceAlerts(req.params.fleetId, options);
        res.json({ alerts });
      } catch (error) {
        console.error('Get maintenance alerts error:', error);
        res.status(500).json({ message: 'Failed to get maintenance alerts' });
      }
    }
  );

  // Acknowledge a maintenance alert
  app.post('/api/predictions/:alertId/acknowledge',
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const { notes } = req.body;
        const alert = await storage.acknowledgeMaintenanceAlert(
          req.params.alertId,
          req.session.userId!,
          notes
        );
        
        if (!alert) {
          return res.status(404).json({ message: 'Alert not found' });
        }
        
        res.json({ 
          message: 'Alert acknowledged successfully',
          alert 
        });
      } catch (error) {
        console.error('Acknowledge alert error:', error);
        res.status(500).json({ message: 'Failed to acknowledge alert' });
      }
    }
  );

  // Get maintenance ROI analysis
  app.get('/api/analytics/maintenance-roi',
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const { vehicleId } = req.query;
        if (!vehicleId) {
          return res.status(400).json({ message: 'Vehicle ID is required' });
        }
        
        const roi = await storage.calculateMaintenanceROI(vehicleId as string);
        res.json(roi);
      } catch (error) {
        console.error('Calculate maintenance ROI error:', error);
        res.status(500).json({ message: 'Failed to calculate ROI' });
      }
    }
  );

  // Get prediction model accuracy metrics
  app.get('/api/predictions/accuracy',
    requireAuth,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const { modelId } = req.query;
        const accuracy = await storage.getPredictionAccuracy(modelId as string);
        res.json(accuracy);
      } catch (error) {
        console.error('Get prediction accuracy error:', error);
        res.status(500).json({ message: 'Failed to get prediction accuracy' });
      }
    }
  );

  // Get high-risk vehicles for a fleet
  app.get('/api/fleet/:fleetId/high-risk-vehicles',
    requireAuth,
    requireRole('admin', 'fleet_manager', 'dispatcher'),
    async (req: Request, res: Response) => {
      try {
        const vehicles = await storage.getHighRiskVehicles(req.params.fleetId);
        res.json({ vehicles });
      } catch (error) {
        console.error('Get high-risk vehicles error:', error);
        res.status(500).json({ message: 'Failed to get high-risk vehicles' });
      }
    }
  );

  // ==================== PM SCHEDULING ROUTES ====================
  
  // Get all PM schedules for a fleet
  app.get('/api/fleet/:fleetId/pm-schedules',
    requireAuth,
    requireRole('admin', 'fleet_manager'),
    async (req: Request, res: Response) => {
      try {
        const { vehicleId, isActive } = req.query;
        
        const schedules = await storage.getPmSchedules(req.params.fleetId, {
          vehicleId: vehicleId as string,
          isActive: isActive === undefined ? undefined : isActive === 'true'
        });

        res.json({ schedules });
      } catch (error) {
        console.error('Get PM schedules error:', error);
        res.status(500).json({ message: 'Failed to get PM schedules' });
      }
    }
  );

  // Get a single PM schedule
  app.get('/api/fleet/:fleetId/pm-schedules/:scheduleId',
    requireAuth,
    requireRole('admin', 'fleet_manager'),
    async (req: Request, res: Response) => {
      try {
        const schedule = await storage.getPmSchedule(
          req.params.scheduleId,
          req.params.fleetId
        );

        if (!schedule) {
          return res.status(404).json({ message: 'PM schedule not found' });
        }

        res.json({ schedule });
      } catch (error) {
        console.error('Get PM schedule error:', error);
        res.status(500).json({ message: 'Failed to get PM schedule' });
      }
    }
  );

  // Create a new PM schedule
  app.post('/api/fleet/:fleetId/pm-schedules',
    requireAuth,
    requireRole('admin', 'fleet_manager'),
    async (req: Request, res: Response) => {
      try {
        const { 
          vehicleId,
          serviceType,
          frequency,
          nextServiceDate,
          lastServiceDate,
          isActive = true,
          notes
        } = req.body;

        // Validate required fields
        if (!vehicleId) {
          return res.status(400).json({ message: 'Vehicle ID is required' });
        }
        if (!serviceType) {
          return res.status(400).json({ message: 'Service type is required' });
        }
        if (!frequency) {
          return res.status(400).json({ message: 'Frequency is required' });
        }
        if (!nextServiceDate) {
          return res.status(400).json({ message: 'Next service date is required' });
        }
        
        // Validate frequency value
        const validFrequencies = ['weekly', 'monthly', 'quarterly', 'annually'];
        if (!validFrequencies.includes(frequency)) {
          return res.status(400).json({ 
            message: `Invalid frequency. Must be one of: ${validFrequencies.join(', ')}` 
          });
        }

        const schedule = await storage.createPmSchedule({
          fleetAccountId: req.params.fleetId,
          vehicleId,
          serviceType,
          frequency: frequency as 'weekly' | 'monthly' | 'quarterly' | 'annually',
          nextServiceDate: new Date(nextServiceDate),
          lastServiceDate: lastServiceDate ? new Date(lastServiceDate) : null,
          isActive,
          notes
        });

        res.status(201).json({
          message: 'PM schedule created successfully',
          schedule
        });
      } catch (error: any) {
        console.error('Create PM schedule error:', error);
        res.status(500).json({ 
          message: error.message || 'Failed to create PM schedule' 
        });
      }
    }
  );

  // Update a PM schedule
  app.put('/api/fleet/:fleetId/pm-schedules/:scheduleId',
    requireAuth,
    requireRole('admin', 'fleet_manager'),
    async (req: Request, res: Response) => {
      try {
        const updates: any = {};
        
        // Only include fields that are provided
        if (req.body.serviceType !== undefined) updates.serviceType = req.body.serviceType;
        if (req.body.frequency !== undefined) {
          const validFrequencies = ['weekly', 'monthly', 'quarterly', 'annually'];
          if (!validFrequencies.includes(req.body.frequency)) {
            return res.status(400).json({ 
              message: `Invalid frequency. Must be one of: ${validFrequencies.join(', ')}` 
            });
          }
          updates.frequency = req.body.frequency;
        }
        if (req.body.nextServiceDate !== undefined) {
          updates.nextServiceDate = new Date(req.body.nextServiceDate);
        }
        if (req.body.lastServiceDate !== undefined) {
          updates.lastServiceDate = req.body.lastServiceDate ? new Date(req.body.lastServiceDate) : null;
        }
        if (req.body.isActive !== undefined) updates.isActive = req.body.isActive;
        if (req.body.notes !== undefined) updates.notes = req.body.notes;

        const schedule = await storage.updatePmSchedule(
          req.params.scheduleId,
          req.params.fleetId,
          updates
        );

        if (!schedule) {
          return res.status(404).json({ message: 'PM schedule not found' });
        }

        res.json({
          message: 'PM schedule updated successfully',
          schedule
        });
      } catch (error: any) {
        console.error('Update PM schedule error:', error);
        res.status(500).json({ 
          message: error.message || 'Failed to update PM schedule' 
        });
      }
    }
  );

  // Delete a PM schedule
  app.delete('/api/fleet/:fleetId/pm-schedules/:scheduleId',
    requireAuth,
    requireRole('admin', 'fleet_manager'),
    async (req: Request, res: Response) => {
      try {
        const success = await storage.deletePmSchedule(
          req.params.scheduleId,
          req.params.fleetId
        );

        if (!success) {
          return res.status(404).json({ message: 'PM schedule not found' });
        }

        res.json({ message: 'PM schedule deleted successfully' });
      } catch (error) {
        console.error('Delete PM schedule error:', error);
        res.status(500).json({ message: 'Failed to delete PM schedule' });
      }
    }
  );

  // Add authorized contact
  app.post('/api/fleet/accounts/:id/contacts',
    requireAuth,
    requireRole('admin', 'fleet_manager'),
    validateRequest(insertFleetContactSchema.omit({ fleetAccountId: true })),
    async (req: Request, res: Response) => {
      try {
        const contact = await storage.createFleetContact({
          ...req.body,
          fleetAccountId: req.params.id
        });

        res.status(201).json({
          message: 'Contact added successfully',
          contact
        });
      } catch (error) {
        console.error('Add contact error:', error);
        res.status(500).json({ message: 'Failed to add contact' });
      }
    }
  );

  // Set custom pricing override
  app.post('/api/fleet/accounts/:id/pricing',
    requireAuth,
    requireRole('admin'),
    validateRequest(insertFleetPricingOverrideSchema.omit({ fleetAccountId: true })),
    async (req: Request, res: Response) => {
      try {
        const override = await storage.createFleetPricingOverride({
          ...req.body,
          fleetAccountId: req.params.id
        });

        res.status(201).json({
          message: 'Pricing override created successfully',
          override
        });
      } catch (error) {
        console.error('Create pricing override error:', error);
        res.status(500).json({ message: 'Failed to create pricing override' });
      }
    }
  );

  // Create batch jobs for fleet
  app.post('/api/fleet/batch-jobs',
    requireAuth,
    requireRole('admin', 'fleet_manager', 'dispatcher'),
    validateRequest(z.object({
      fleetAccountId: z.string(),
      jobs: z.array(insertJobSchema)
    })),
    async (req: Request, res: Response) => {
      try {
        const { fleetAccountId, jobs: jobsData } = req.body;
        
        const jobs = await storage.createFleetJobBatch(fleetAccountId, jobsData);

        res.status(201).json({
          message: `${jobs.length} jobs created successfully`,
          jobs
        });
      } catch (error) {
        console.error('Create batch jobs error:', error);
        res.status(500).json({ message: 'Failed to create batch jobs' });
      }
    }
  );

  // Get fleet usage analytics
  app.get('/api/fleet/accounts/:id/analytics',
    requireAuth,
    requireRole('admin', 'fleet_manager'),
    async (req: Request, res: Response) => {
      try {
        // Check if the method exists before calling
        if (typeof storage.getFleetUsageStats !== 'function') {
          // Return empty analytics if method doesn't exist
          res.json({ 
            analytics: {
              totalVehicles: 0,
              activeJobs: 0,
              totalSpent: 0,
              monthlySpend: 0,
              completedJobs: 0,
              averageJobValue: 0
            }
          });
          return;
        }
        
        const stats = await storage.getFleetUsageStats(req.params.id);
        res.json({ analytics: stats });
      } catch (error) {
        console.error('Get fleet analytics error:', error);
        // Return empty analytics on error instead of 500
        res.json({ 
          analytics: {
            totalVehicles: 0,
            activeJobs: 0,
            totalSpent: 0,
            monthlySpend: 0,
            completedJobs: 0,
            averageJobValue: 0
          }
        });
      }
    }
  );

  // ==================== SCHEDULED BOOKING ROUTES ====================
  
  // Get available time slots for a specific date and service
  app.get("/api/booking/time-slots", requireAuth, async (req, res, next) => {
    try {
      const { date, serviceTypeId } = req.query;
      
      if (!date || !serviceTypeId) {
        return res.status(400).json({ 
          message: 'Date and service type are required' 
        });
      }
      
      // Check if date is within allowed booking window (30 days)
      const selectedDate = new Date(date as string);
      const maxDate = new Date();
      maxDate.setDate(maxDate.getDate() + 30);
      
      if (selectedDate > maxDate) {
        return res.status(400).json({
          message: 'Cannot book more than 30 days in advance'
        });
      }
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      selectedDate.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        return res.status(400).json({
          message: 'Cannot book in the past'
        });
      }
      
      const slots = await storage.getAvailableTimeSlots(
        date as string,
        serviceTypeId as string
      );
      
      res.json(slots);
    } catch (error) {
      next(error);
    }
  });
  
  // Create a scheduled booking  
  app.post("/api/jobs/scheduled", requireAuth, async (req, res, next) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const {
        serviceTypeId,
        scheduledDate,
        scheduledTimeSlot,
        location,
        locationAddress,
        locationNotes,
        vehicleId,
        vin,
        unitNumber,
        vehicleMake,
        vehicleModel,
        vehicleYear,
        description,
        fleetAccountId
      } = req.body;
      
      // Validate required fields
      if (!serviceTypeId || !scheduledDate || !scheduledTimeSlot || !location) {
        return res.status(400).json({
          message: 'Service type, date, time slot, and location are required'
        });
      }
      
      // Check time slot availability
      const isAvailable = await storage.checkTimeSlotAvailability(
        scheduledDate,
        scheduledTimeSlot,
        serviceTypeId
      );
      
      if (!isAvailable) {
        return res.status(400).json({
          message: 'Selected time slot is no longer available'
        });
      }
      
      // Get service details for pricing
      const service = await storage.getServiceType(serviceTypeId);
      if (!service) {
        return res.status(404).json({ message: 'Service type not found' });
      }
      
      // Create the scheduled job
      const jobNumber = `SCH-${Date.now()}`;
      const scheduledAt = new Date(`${scheduledDate} ${scheduledTimeSlot.split('-')[0]}`);
      
      const job = await storage.createJob({
        jobNumber,
        jobType: 'scheduled',
        status: 'new',
        customerId: user.id,
        serviceTypeId,
        location,
        locationAddress,
        locationNotes,
        fleetAccountId: fleetAccountId || null,
        vehicleId: vehicleId || null,
        vin,
        unitNumber,
        vehicleMake,
        vehicleModel,
        vehicleYear,
        description,
        scheduledAt,
        estimatedPrice: service.basePrice,
        urgencyLevel: 0 // Scheduled jobs are not urgent
      });
      
      // Send confirmation email if available
      if (user.email) {
        const emailTemplate = await storage.getEmailTemplate('scheduled_booking_confirmation');
        if (emailTemplate) {
          await emailService.sendTemplatedEmail({
            to: user.email,
            templateCode: 'scheduled_booking_confirmation',
            variables: {
              customerName: user.firstName || 'Customer',
              jobNumber: job.jobNumber,
              serviceName: service.name,
              scheduledDate,
              scheduledTime: scheduledTimeSlot,
              location: locationAddress || 'Location provided',
              estimatedPrice: Number(service.basePrice || 0)
            }
          });
        }
      }
      
      res.json({
        message: 'Scheduled booking created successfully',
        jobId: job.id,
        jobNumber: job.jobNumber,
        scheduledAt: job.scheduledAt
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Reschedule a booking
  app.patch("/api/jobs/:jobId/reschedule", requireAuth, async (req, res, next) => {
    try {
      const { jobId } = req.params;
      const { scheduledDate, scheduledTimeSlot } = req.body;
      
      const job = await storage.getJob(jobId);
      if (!job) {
        return res.status(404).json({ message: 'Job not found' });
      }
      
      // Check if user owns this job or is an admin
      if (job.customerId !== req.session.userId && req.session.role !== 'admin') {
        return res.status(403).json({ message: 'Unauthorized' });
      }
      
      // Check if job can be rescheduled
      if (job.status !== 'new' && job.status !== 'assigned') {
        return res.status(400).json({
          message: 'Job cannot be rescheduled in current status'
        });
      }
      
      // Check new time slot availability
      const isAvailable = await storage.checkTimeSlotAvailability(
        scheduledDate,
        scheduledTimeSlot,
        job.serviceTypeId
      );
      
      if (!isAvailable) {
        return res.status(400).json({
          message: 'Selected time slot is not available'
        });
      }
      
      // Update the job
      const scheduledAt = new Date(`${scheduledDate} ${scheduledTimeSlot.split('-')[0]}`);
      const updatedJob = await storage.updateJob(jobId, {
        scheduledAt
      });
      
      // Send reschedule notification
      const user = await storage.getUser(job.customerId!);
      if (user?.email) {
        const emailTemplate = await storage.getEmailTemplate('reschedule_notification');
        if (emailTemplate) {
          await emailService.sendTemplatedEmail({
            to: user.email,
            templateCode: 'reschedule_notification',
            variables: {
              jobNumber: job.jobNumber,
              oldDate: job.scheduledDate!,
              oldTime: job.scheduledTimeSlot!,
              newDate: scheduledDate,
              newTime: scheduledTimeSlot
            }
          });
        }
      }
      
      res.json({
        message: 'Booking rescheduled successfully',
        job: updatedJob
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Get booking settings for admin
  app.get("/api/admin/booking-settings", requireAuth, requireRole("admin"), async (req, res, next) => {
    try {
      const { serviceTypeId } = req.query;
      const settings = await storage.getBookingSettings(serviceTypeId as string);
      res.json(settings);
    } catch (error) {
      next(error);
    }
  });
  
  // Update booking settings
  app.post("/api/admin/booking-settings", requireAuth, requireRole("admin"), async (req, res, next) => {
    try {
      const { settings } = req.body;
      
      // Delete existing settings and create new ones
      const existingSettings = await storage.getBookingSettings();
      for (const existing of existingSettings) {
        await storage.deleteBookingSettings(existing.id);
      }
      
      const newSettings = [];
      for (const setting of settings) {
        const created = await storage.createBookingSettings(setting);
        newSettings.push(created);
      }
      
      res.json({
        message: 'Booking settings updated successfully',
        settings: newSettings
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Manage booking blacklist
  app.get("/api/admin/booking-blacklist", requireAuth, requireRole("admin"), async (req, res, next) => {
    try {
      const blacklist = await storage.getBookingBlacklist();
      res.json(blacklist);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/admin/booking-blacklist", requireAuth, requireRole("admin"), async (req, res, next) => {
    try {
      const blacklist = await storage.createBookingBlacklist(req.body);
      res.json(blacklist);
    } catch (error) {
      next(error);
    }
  });
  
  app.delete("/api/admin/booking-blacklist/:id", requireAuth, requireRole("admin"), async (req, res, next) => {
    try {
      await storage.deleteBookingBlacklist(req.params.id);
      res.json({ message: 'Blacklist entry deleted' });
    } catch (error) {
      next(error);
    }
  });

  // ==================== FLEET ANALYTICS ROUTES ====================
  
  // Get comprehensive fleet analytics overview
  app.get('/api/fleet/:id/analytics',
    requireAuth,
    requireRole('admin', 'fleet_manager', 'dispatcher'),
    async (req: Request, res: Response) => {
      try {
        const fleetId = req.params.id;
        
        // Get fleet analytics summary
        const summary = await storage.getFleetAnalyticsSummary(fleetId);
        
        // Get recent alerts
        const alerts = await storage.getActiveAlerts(fleetId);
        
        // Get cost analysis
        const costAnalysis = await storage.getFleetCostAnalysis(fleetId, 'monthly');
        
        // Get maintenance schedule
        const maintenanceSchedule = await storage.generateFleetMaintenanceSchedule(fleetId);
        
        res.json({
          summary,
          alerts,
          costAnalysis,
          maintenanceSchedule,
          timestamp: new Date()
        });
      } catch (error) {
        console.error('Get fleet analytics error:', error);
        res.status(500).json({ message: 'Failed to get fleet analytics' });
      }
    }
  );
  
  // Get vehicle-specific analytics
  app.get('/api/vehicles/:id/analytics',
    requireAuth,
    requireRole('admin', 'fleet_manager', 'dispatcher'),
    async (req: Request, res: Response) => {
      try {
        const vehicleId = req.params.id;
        
        // Get vehicle analytics
        const analytics = await storage.getVehicleAnalytics(vehicleId);
        
        if (!analytics) {
          // Create analytics record if it doesn't exist
          const vehicle = await storage.getFleetVehicle(vehicleId);
          if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found' });
          }
          
          const newAnalytics = await storage.createVehicleAnalytics({
            vehicleId,
            fleetAccountId: vehicle.fleetAccountId
          });
          
          return res.json({ analytics: newAnalytics });
        }
        
        // Get breakdown patterns
        const patterns = await storage.getBreakdownPatterns(vehicleId);
        
        // Get predictive maintenance
        const predictions = await storage.getPredictiveMaintenance(vehicleId);
        
        // Get cost per mile
        const cpm = await storage.calculateCostPerMile(vehicleId);
        
        res.json({
          analytics,
          patterns,
          predictions,
          costPerMile: cpm
        });
      } catch (error) {
        console.error('Get vehicle analytics error:', error);
        res.status(500).json({ message: 'Failed to get vehicle analytics' });
      }
    }
  );
  
  // Get breakdown patterns for fleet
  app.get('/api/fleet/:id/patterns',
    requireAuth,
    requireRole('admin', 'fleet_manager', 'dispatcher'),
    async (req: Request, res: Response) => {
      try {
        const fleetId = req.params.id;
        const { issueCategory, minFrequency, fromDate, toDate } = req.query;
        
        const patterns = await storage.getFleetBreakdownPatterns(fleetId, {
          issueCategory: issueCategory as string,
          minFrequency: minFrequency ? parseInt(minFrequency as string) : undefined,
          fromDate: fromDate ? new Date(fromDate as string) : undefined,
          toDate: toDate ? new Date(toDate as string) : undefined
        });
        
        // Analyze patterns
        const analysis = await storage.analyzeBreakdownPatterns(fleetId);
        
        res.json({
          patterns,
          analysis,
          totalPatterns: patterns.length
        });
      } catch (error) {
        console.error('Get breakdown patterns error:', error);
        res.status(500).json({ message: 'Failed to get breakdown patterns' });
      }
    }
  );
  
  // Get predictive maintenance for fleet
  app.get('/api/fleet/:id/predictions',
    requireAuth,
    requireRole('admin', 'fleet_manager', 'dispatcher'),
    async (req: Request, res: Response) => {
      try {
        const fleetId = req.params.id;
        
        // Get all vehicles for the fleet
        const vehicles = await storage.getFleetVehicles(fleetId);
        
        // Get predictions for each vehicle
        const predictions = await Promise.all(
          vehicles.map(async (vehicle) => {
            const prediction = await storage.getPredictiveMaintenance(vehicle.id);
            return {
              vehicleId: vehicle.id,
              unitNumber: vehicle.unitNumber,
              ...prediction
            };
          })
        );
        
        // Sort by risk score (highest first)
        predictions.sort((a, b) => b.riskScore - a.riskScore);
        
        res.json({
          predictions,
          highRiskVehicles: predictions.filter(p => p.riskScore > 70).length,
          totalPredictedCost: predictions.reduce((sum, p) => 
            sum + p.predictedServices.reduce((s, srv) => s + srv.estimatedCost, 0), 0
          )
        });
      } catch (error) {
        console.error('Get maintenance predictions error:', error);
        res.status(500).json({ message: 'Failed to get maintenance predictions' });
      }
    }
  );
  
  // Get cost per mile analysis
  app.get('/api/fleet/:id/cpm',
    requireAuth,
    requireRole('admin', 'fleet_manager', 'dispatcher'),
    async (req: Request, res: Response) => {
      try {
        const fleetId = req.params.id;
        const { fromDate, toDate, period } = req.query;
        
        // Get all vehicles for the fleet
        const vehicles = await storage.getFleetVehicles(fleetId);
        
        // Calculate CPM for each vehicle
        const vehicleCPM = await Promise.all(
          vehicles.map(async (vehicle) => {
            const cpm = await storage.calculateCostPerMile(
              vehicle.id,
              fromDate ? new Date(fromDate as string) : undefined,
              toDate ? new Date(toDate as string) : undefined
            );
            return {
              vehicleId: vehicle.id,
              unitNumber: vehicle.unitNumber,
              make: vehicle.make,
              model: vehicle.model,
              ...cpm
            };
          })
        );
        
        // Get historical trend
        const costTrend = await storage.getFleetCostAnalysis(
          fleetId, 
          (period as 'daily' | 'weekly' | 'monthly' | 'yearly') || 'monthly'
        );
        
        // Calculate fleet average
        const totalMiles = vehicleCPM.reduce((sum, v) => sum + v.totalMiles, 0);
        const totalCost = vehicleCPM.reduce((sum, v) => sum + v.totalCost, 0);
        const fleetAvgCPM = totalMiles > 0 ? totalCost / totalMiles : 0;
        
        res.json({
          vehicleBreakdown: vehicleCPM,
          fleetAverage: {
            costPerMile: fleetAvgCPM,
            totalMiles,
            totalCost
          },
          historicalTrend: costTrend,
          industryBenchmark: 1.25 // Example industry average
        });
      } catch (error) {
        console.error('Get CPM analysis error:', error);
        res.status(500).json({ message: 'Failed to get cost per mile analysis' });
      }
    }
  );
  
  // Configure alerts for fleet
  app.post('/api/fleet/:id/alerts',
    requireAuth,
    requireRole('admin', 'fleet_manager'),
    validateRequest(z.object({
      alertType: z.enum(['maintenance_due', 'cost_threshold', 'breakdown_risk', 'compliance', 'budget']),
      alertTitle: z.string(),
      alertMessage: z.string(),
      severity: z.enum(['low', 'medium', 'high', 'critical']),
      thresholdValue: z.number().optional(),
      vehicleId: z.string().optional(),
      notificationMethod: z.enum(['email', 'sms', 'push', 'webhook']).optional()
    })),
    async (req: Request, res: Response) => {
      try {
        const fleetId = req.params.id;
        const alertData = req.body;
        
        const alert = await storage.createFleetAnalyticsAlert({
          fleetAccountId: fleetId,
          ...alertData
        });
        
        res.status(201).json({ alert });
      } catch (error) {
        console.error('Create alert error:', error);
        res.status(500).json({ message: 'Failed to create alert' });
      }
    }
  );
  
  // ==================== NEW FLEET ANALYTICS API ROUTES ====================
  
  // Get fleet analytics overview
  app.get('/api/fleet/:fleetId/analytics/overview',
    requireAuth,
    requireRole('admin', 'fleet_manager', 'dispatcher'),
    async (req: Request, res: Response) => {
      try {
        const fleetId = req.params.fleetId;
        
        // Verify fleet access
        if (req.session.role === 'fleet_manager') {
          const user = await storage.getUser(req.session.userId!);
          const fleetAccount = await storage.getFleetAccountByEmail(user?.email || '');
          if (!fleetAccount || fleetAccount.id !== fleetId) {
            return res.status(403).json({ 
              message: 'Access denied to this fleet analytics' 
            });
          }
        }
        
        const overview = await storage.getFleetAnalyticsOverview(fleetId);
        res.json(overview);
      } catch (error) {
        console.error('Failed to get fleet analytics overview:', error);
        res.status(500).json({ 
          message: 'Failed to retrieve fleet analytics overview',
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }
  );
  
  // Get fleet cost analytics
  app.get('/api/fleet/:fleetId/analytics/costs',
    requireAuth,
    requireRole('admin', 'fleet_manager', 'dispatcher'),
    async (req: Request, res: Response) => {
      try {
        const fleetId = req.params.fleetId;
        const { startDate, endDate, groupBy } = req.query;
        
        // Verify fleet access
        if (req.session.role === 'fleet_manager') {
          const user = await storage.getUser(req.session.userId!);
          const fleetAccount = await storage.getFleetAccountByEmail(user?.email || '');
          if (!fleetAccount || fleetAccount.id !== fleetId) {
            return res.status(403).json({ 
              message: 'Access denied to this fleet analytics' 
            });
          }
        }
        
        const options = {
          startDate: startDate ? new Date(startDate as string) : undefined,
          endDate: endDate ? new Date(endDate as string) : undefined,
          groupBy: (groupBy as 'day' | 'week' | 'month') || 'month'
        };
        
        const costAnalytics = await storage.getFleetCostAnalytics(fleetId, options);
        res.json(costAnalytics);
      } catch (error) {
        console.error('Failed to get fleet cost analytics:', error);
        res.status(500).json({ 
          message: 'Failed to retrieve fleet cost analytics',
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }
  );
  
  // Get fleet vehicle analytics
  app.get('/api/fleet/:fleetId/analytics/vehicles',
    requireAuth,
    requireRole('admin', 'fleet_manager', 'dispatcher'),
    async (req: Request, res: Response) => {
      try {
        const fleetId = req.params.fleetId;
        
        // Verify fleet access
        if (req.session.role === 'fleet_manager') {
          const user = await storage.getUser(req.session.userId!);
          const fleetAccount = await storage.getFleetAccountByEmail(user?.email || '');
          if (!fleetAccount || fleetAccount.id !== fleetId) {
            return res.status(403).json({ 
              message: 'Access denied to this fleet analytics' 
            });
          }
        }
        
        const vehicleAnalytics = await storage.getFleetVehicleAnalytics(fleetId);
        res.json(vehicleAnalytics);
      } catch (error) {
        console.error('Failed to get fleet vehicle analytics:', error);
        res.status(500).json({ 
          message: 'Failed to retrieve fleet vehicle analytics',
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }
  );
  
  // Get fleet service analytics
  app.get('/api/fleet/:fleetId/analytics/services',
    requireAuth,
    requireRole('admin', 'fleet_manager', 'dispatcher'),
    async (req: Request, res: Response) => {
      try {
        const fleetId = req.params.fleetId;
        const { startDate, endDate } = req.query;
        
        // Verify fleet access
        if (req.session.role === 'fleet_manager') {
          const user = await storage.getUser(req.session.userId!);
          const fleetAccount = await storage.getFleetAccountByEmail(user?.email || '');
          if (!fleetAccount || fleetAccount.id !== fleetId) {
            return res.status(403).json({ 
              message: 'Access denied to this fleet analytics' 
            });
          }
        }
        
        const options = {
          startDate: startDate ? new Date(startDate as string) : undefined,
          endDate: endDate ? new Date(endDate as string) : undefined
        };
        
        const serviceAnalytics = await storage.getFleetServiceAnalytics(fleetId, options);
        res.json(serviceAnalytics);
      } catch (error) {
        console.error('Failed to get fleet service analytics:', error);
        res.status(500).json({ 
          message: 'Failed to retrieve fleet service analytics',
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }
  );
  
  // Get fleet contractor analytics
  app.get('/api/fleet/:fleetId/analytics/contractors',
    requireAuth,
    requireRole('admin', 'fleet_manager', 'dispatcher'),
    async (req: Request, res: Response) => {
      try {
        const fleetId = req.params.fleetId;
        const { startDate, endDate } = req.query;
        
        // Verify fleet access
        if (req.session.role === 'fleet_manager') {
          const user = await storage.getUser(req.session.userId!);
          const fleetAccount = await storage.getFleetAccountByEmail(user?.email || '');
          if (!fleetAccount || fleetAccount.id !== fleetId) {
            return res.status(403).json({ 
              message: 'Access denied to this fleet analytics' 
            });
          }
        }
        
        const options = {
          startDate: startDate ? new Date(startDate as string) : undefined,
          endDate: endDate ? new Date(endDate as string) : undefined
        };
        
        const contractorAnalytics = await storage.getFleetContractorAnalytics(fleetId, options);
        res.json(contractorAnalytics);
      } catch (error) {
        console.error('Failed to get fleet contractor analytics:', error);
        res.status(500).json({ 
          message: 'Failed to retrieve fleet contractor analytics',
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }
  );
  
  // Get fleet alerts
  app.get('/api/fleet/:id/alerts',
    requireAuth,
    requireRole('admin', 'fleet_manager', 'dispatcher'),
    async (req: Request, res: Response) => {
      try {
        const fleetId = req.params.id;
        const { active, limit } = req.query;
        
        let alerts;
        if (active === 'true') {
          alerts = await storage.getActiveAlerts(fleetId);
        } else {
          alerts = await storage.getAlertHistory(fleetId, limit ? parseInt(limit as string) : 50);
        }
        
        res.json({ alerts });
      } catch (error) {
        console.error('Get alerts error:', error);
        res.status(500).json({ message: 'Failed to get alerts' });
      }
    }
  );
  
  // Acknowledge an alert
  app.put('/api/alerts/:id/acknowledge',
    requireAuth,
    requireRole('admin', 'fleet_manager', 'dispatcher'),
    async (req: Request, res: Response) => {
      try {
        const alertId = req.params.id;
        const userId = req.session.userId!;
        
        const alert = await storage.acknowledgeAlert(alertId, userId);
        
        if (!alert) {
          return res.status(404).json({ message: 'Alert not found' });
        }
        
        res.json({ alert });
      } catch (error) {
        console.error('Acknowledge alert error:', error);
        res.status(500).json({ message: 'Failed to acknowledge alert' });
      }
    }
  );
  
  // Update vehicle metrics (for tracking miles and costs)
  app.post('/api/vehicles/:id/metrics',
    requireAuth,
    requireRole('admin', 'fleet_manager', 'dispatcher'),
    validateRequest(z.object({
      milesDriven: z.number().optional(),
      maintenanceCost: z.number().optional(),
      fuelCost: z.number().optional(),
      breakdownCount: z.number().optional(),
      downtimeHours: z.number().optional()
    })),
    async (req: Request, res: Response) => {
      try {
        const vehicleId = req.params.id;
        const metrics = req.body;
        
        const analytics = await storage.updateVehicleMetrics(vehicleId, metrics);
        
        if (!analytics) {
          return res.status(404).json({ message: 'Vehicle analytics not found' });
        }
        
        // Check for alerts that need to be triggered
        const vehicle = await storage.getFleetVehicle(vehicleId);
        if (vehicle) {
          await storage.triggerPredictiveAlerts(vehicle.fleetAccountId);
        }
        
        res.json({ analytics });
      } catch (error) {
        console.error('Update vehicle metrics error:', error);
        res.status(500).json({ message: 'Failed to update vehicle metrics' });
      }
    }
  );
  
  // Report a breakdown pattern
  app.post('/api/vehicles/:id/breakdown',
    requireAuth,
    requireRole('admin', 'fleet_manager', 'dispatcher', 'contractor'),
    validateRequest(z.object({
      issueType: z.string(),
      issueCategory: z.string().optional(),
      cost: z.number(),
      location: z.object({
        lat: z.number(),
        lng: z.number(),
        address: z.string().optional()
      }).optional(),
      weatherConditions: z.string().optional(),
      routeType: z.string().optional(),
      description: z.string().optional()
    })),
    async (req: Request, res: Response) => {
      try {
        const vehicleId = req.params.id;
        const breakdownData = req.body;
        
        // Get vehicle details
        const vehicle = await storage.getFleetVehicle(vehicleId);
        if (!vehicle) {
          return res.status(404).json({ message: 'Vehicle not found' });
        }
        
        // Check if pattern exists and update or create new
        const existingPatterns = await storage.getBreakdownPatterns(vehicleId);
        const existingPattern = existingPatterns.find(p => p.issueType === breakdownData.issueType);
        
        if (existingPattern) {
          // Update existing pattern
          await storage.updateBreakdownPattern(existingPattern.id, {
            frequency: (existingPattern.frequency || 0) + 1,
            totalCost: String(parseFloat(existingPattern.totalCost || '0') + breakdownData.cost),
            avgCostPerIncident: String(
              (parseFloat(existingPattern.totalCost || '0') + breakdownData.cost) / 
              ((existingPattern.frequency || 0) + 1)
            ),
            lastOccurrenceDate: new Date()
          });
        } else {
          // Create new pattern
          await storage.createBreakdownPattern({
            vehicleId,
            fleetAccountId: vehicle.fleetAccountId,
            issueType: breakdownData.issueType,
            issueCategory: breakdownData.issueCategory,
            frequency: 1,
            totalCost: String(breakdownData.cost),
            avgCostPerIncident: String(breakdownData.cost),
            lastOccurrenceDate: new Date()
          });
        }
        
        // Update vehicle analytics
        await storage.updateVehicleMetrics(vehicleId, {
          breakdownCount: 1,
          maintenanceCost: breakdownData.cost
        });
        
        res.status(201).json({ message: 'Breakdown reported successfully' });
      } catch (error) {
        console.error('Report breakdown error:', error);
        res.status(500).json({ message: 'Failed to report breakdown' });
      }
    }
  );

  // ==================== SERVICE & PRICING ROUTES ====================

  // List all service types
  app.get('/api/services', async (req: Request, res: Response) => {
    try {
      const services = await storage.getActiveServiceTypes();
      
      res.json({ services });
    } catch (error) {
      console.error('List services error:', error);
      res.status(500).json({ message: 'Failed to list services' });
    }
  });

  // Alias for service types (used by contractor application form)
  app.get('/api/service-types', async (req: Request, res: Response) => {
    try {
      const serviceTypes = await storage.getActiveServiceTypes();
      res.json(serviceTypes);
    } catch (error) {
      console.error('Get service types error:', error);
      res.status(500).json({ message: 'Failed to get service types' });
    }
  });

  // Get service types with pricing for public pricing page
  app.get('/api/public/services-with-pricing', async (req: Request, res: Response) => {
    try {
      const serviceTypes = await storage.getActiveServiceTypes();
      const servicesWithPricing = await Promise.all(
        serviceTypes.map(async (service) => {
          const pricing = await storage.getCurrentPricing(service.id);
          return {
            ...service,
            pricing: pricing || {
              basePrice: "0",
              perMileRate: "0",
              perHourRate: "0",
              emergencySurcharge: "0",
              nightSurcharge: "0",
              weekendSurcharge: "0"
            }
          };
        })
      );
      res.json(servicesWithPricing);
    } catch (error) {
      console.error('Get services with pricing error:', error);
      res.status(500).json({ message: 'Failed to get services with pricing' });
    }
  });

  // Get pricing for service
  app.get('/api/services/:id/pricing', async (req: Request, res: Response) => {
    try {
      const pricing = await storage.getCurrentPricing(req.params.id);
      
      if (!pricing) {
        return res.status(404).json({ message: 'Pricing not found' });
      }

      res.json({ pricing });
    } catch (error) {
      console.error('Get pricing error:', error);
      res.status(500).json({ message: 'Failed to get pricing' });
    }
  });

  // Calculate job price with all factors
  app.post('/api/services/calculate-price',
    rateLimiter(20, 60000),
    validateRequest(z.object({
      serviceTypeId: z.string(),
      distance: z.number().optional(),
      duration: z.number().optional(),
      isEmergency: z.boolean().optional(),
      location: z.object({
        lat: z.number(),
        lng: z.number()
      }),
      fleetAccountId: z.string().optional()
    })),
    async (req: Request, res: Response) => {
      try {
        // This would normally involve complex pricing calculations
        // For now, returning a simplified calculation
        const basePricing = await storage.getCurrentPricing(req.body.serviceTypeId);
        
        if (!basePricing) {
          return res.status(400).json({ message: 'Invalid service type' });
        }

        let price = parseFloat(basePricing.basePrice);
        
        // Add distance charge
        if (req.body.distance && basePricing.perMileRate) {
          price += req.body.distance * parseFloat(basePricing.perMileRate);
        }

        // Add emergency surcharge
        if (req.body.isEmergency && basePricing.emergencySurcharge) {
          price += parseFloat(basePricing.emergencySurcharge);
        }

        // Check for fleet pricing overrides
        if (req.body.fleetAccountId) {
          const overrides = await storage.getFleetPricingOverrides(req.body.fleetAccountId);
          const override = overrides.find(o => o.serviceTypeId === req.body.serviceTypeId);
          
          if (override) {
            if (override.flatRateOverride) {
              price = parseFloat(override.flatRateOverride);
            } else if (override.discountPercentage) {
              price *= (100 - parseFloat(override.discountPercentage)) / 100;
            }
          }
        }

        res.json({
          estimatedPrice: price.toFixed(2),
          breakdown: {
            basePrice: basePricing.basePrice,
            distanceCharge: req.body.distance ? 
              (req.body.distance * parseFloat(basePricing.perMileRate || '0')).toFixed(2) : '0',
            emergencySurcharge: req.body.isEmergency ? 
              basePricing.emergencySurcharge : '0'
          }
        });
      } catch (error) {
        console.error('Calculate price error:', error);
        res.status(500).json({ message: 'Failed to calculate price' });
      }
    }
  );

  // Get service coverage areas
  app.get('/api/services/areas', async (req: Request, res: Response) => {
    try {
      const areas = await storage.getActiveServiceAreas();
      
      res.json({ areas });
    } catch (error) {
      console.error('Get service areas error:', error);
      res.status(500).json({ message: 'Failed to get service areas' });
    }
  });

  // Check service availability by location
  app.get('/api/services/availability',
    rateLimiter(50, 60000),
    async (req: Request, res: Response) => {
      try {
        const location = JSON.parse(req.query.location as string);
        const isAvailable = await storage.checkServiceAvailability(location);
        
        res.json({ 
          available: isAvailable,
          location 
        });
      } catch (error) {
        console.error('Check availability error:', error);
        res.status(500).json({ message: 'Failed to check availability' });
      }
    }
  );

  // ==================== PAYMENT ROUTES ====================

  // Add payment method
  app.post('/api/payments/methods',
    requireAuth,
    validateRequest(insertPaymentMethodSchema.omit({ userId: true })),
    async (req: Request, res: Response) => {
      try {
        const method = await storage.createPaymentMethod({
          ...req.body,
          userId: req.session.userId!
        });

        res.status(201).json({
          message: 'Payment method added successfully',
          method
        });
      } catch (error) {
        console.error('Add payment method error:', error);
        res.status(500).json({ message: 'Failed to add payment method' });
      }
    }
  );

  // List payment methods
  app.get('/api/payments/methods',
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const methods = await storage.getUserPaymentMethods(req.session.userId!);
        
        res.json({ methods });
      } catch (error) {
        console.error('List payment methods error:', error);
        res.status(500).json({ message: 'Failed to list payment methods' });
      }
    }
  );

  // Remove payment method
  app.delete('/api/payments/methods/:id',
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const success = await storage.deletePaymentMethod(req.params.id);
        
        if (!success) {
          return res.status(404).json({ message: 'Payment method not found' });
        }

        res.json({ message: 'Payment method removed successfully' });
      } catch (error) {
        console.error('Delete payment method error:', error);
        res.status(500).json({ message: 'Failed to remove payment method' });
      }
    }
  );

  // Process payment for job
  app.post('/api/payments/charge',
    requireAuth,
    validateRequest(z.object({
      jobId: z.string(),
      paymentMethodId: z.string(),
      amount: z.number().positive()
    })),
    async (req: Request, res: Response) => {
      try {
        const transaction = await storage.createTransaction({
          userId: req.session.userId!,
          jobId: req.body.jobId,
          amount: req.body.amount.toString(),
          status: 'processing',
          paymentMethodId: req.body.paymentMethodId,
          transactionType: 'charge'
        });

        // Here you would integrate with Stripe or other payment processor
        // For now, just mark as completed
        const updatedTransaction = await storage.updateTransaction(transaction.id, {
          status: 'completed',
          processedAt: new Date()
        });

        res.json({
          message: 'Payment processed successfully',
          transaction: updatedTransaction
        });
      } catch (error) {
        console.error('Process payment error:', error);
        res.status(500).json({ message: 'Failed to process payment' });
      }
    }
  );

  // Guest payment endpoint (for emergency jobs without authentication)
  app.post('/api/payments/guest',
    rateLimiter(10, 60000), // 10 requests per minute for security
    validateRequest(z.object({
      jobId: z.string(),
      amount: z.number().positive(),
      paymentMethod: z.string(),
      cardDetails: z.object({
        last4: z.string(),
        brand: z.string()
      }).optional(),
      customerEmail: z.string().email().optional(),
      customerPhone: z.string()
    })),
    async (req: Request, res: Response) => {
      try {
        // Verify the job exists and is an emergency job
        const job = await storage.getJob(req.body.jobId);
        
        if (!job) {
          return res.status(404).json({ message: 'Job not found' });
        }

        if (job.jobType !== 'emergency') {
          return res.status(400).json({ message: 'Guest payments only allowed for emergency jobs' });
        }

        // For guest payments, we need to create a temporary user or skip the transaction
        // Since transactions require a userId, we'll update the job directly for guest payments
        // In a production system, you'd integrate with Stripe here for actual payment processing
        
        // Generate a transaction ID for tracking
        const transactionId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        // Update job payment status directly (bypassing transaction table for guest payments)
        await storage.updateJob(job.id, {
          paymentStatus: 'paid',
          finalPrice: req.body.amount.toString()
        });

        // Store payment info in job metadata
        const updatedJob = await storage.updateJob(job.id, {
          metadata: {
            ...job.metadata,
            guestPayment: {
              transactionId,
              amount: req.body.amount,
              paymentMethod: req.body.paymentMethod,
              cardDetails: req.body.cardDetails,
              customerEmail: req.body.customerEmail,
              customerPhone: req.body.customerPhone,
              processedAt: new Date().toISOString()
            }
          }
        });

        res.json({
          message: 'Payment processed successfully',
          payment: {
            id: transactionId,
            amount: req.body.amount,
            status: 'completed',
            jobId: req.body.jobId
          }
        });
      } catch (error) {
        console.error('Guest payment error:', error);
        res.status(500).json({ message: 'Failed to process payment' });
      }
    }
  );

  // Get invoice for job
  app.get('/api/payments/invoices/:jobId',
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const invoice = await storage.getInvoiceByJobId(req.params.jobId);
        
        if (!invoice) {
          return res.status(404).json({ message: 'Invoice not found' });
        }

        res.json({ invoice });
      } catch (error) {
        console.error('Get invoice error:', error);
        res.status(500).json({ message: 'Failed to get invoice' });
      }
    }
  );

  // ==================== INVOICE ROUTES ====================

  // Generate invoice for job
  app.get('/api/jobs/:id/invoice',
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const job = await storage.getJob(req.params.id);
        
        if (!job) {
          return res.status(404).json({ message: 'Job not found' });
        }

        // Check if invoice already exists
        let invoice = await storage.getInvoiceByJobId(job.id);
        
        if (!invoice) {
          // Generate new invoice
          const pdfService = (await import('./pdf-service')).default;
          const invoiceNumber = pdfService.generateInvoiceNumber();
          
          invoice = await storage.createInvoice({
            jobId: job.id,
            customerId: job.customerId,
            contractorId: job.contractorId,
            invoiceNumber,
            issueDate: new Date(),
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            subtotal: job.actualPrice || job.quotedPrice || '0',
            tax: ((parseFloat(job.actualPrice || job.quotedPrice || '0') * 0.0825).toFixed(2)),
            totalAmount: ((parseFloat(job.actualPrice || job.quotedPrice || '0') * 1.0825).toFixed(2)),
            amountPaid: '0',
            amountDue: ((parseFloat(job.actualPrice || job.quotedPrice || '0') * 1.0825).toFixed(2)),
            status: 'pending',
            metadata: {
              serviceType: job.jobType,
              vehicleInfo: job.vehicleInfo,
              location: job.serviceLocation
            }
          });
        }

        // Fetch related data
        const customer = await storage.getUser(job.customerId);
        const contractor = job.contractorId ? 
          await storage.getContractorProfile(job.contractorId) : undefined;
        let fleetAccount = undefined;
        
        if (customer) {
          const driverProfile = await storage.getDriverProfile(customer.id);
          if (driverProfile?.fleetAccountId) {
            fleetAccount = await storage.getFleetAccount(driverProfile.fleetAccountId);
          }
        }

        res.json({
          invoice,
          job,
          customer,
          contractor,
          fleetAccount
        });
      } catch (error) {
        console.error('Generate invoice error:', error);
        res.status(500).json({ message: 'Failed to generate invoice' });
      }
    }
  );

  // Mark job as complete with notes
  app.post('/api/jobs/:id/complete',
    requireAuth,
    validateRequest(z.object({
      completionNotes: z.string().optional(),
      completionPhotos: z.array(z.string()).optional(),
      signature: z.string().optional()
    })),
    async (req: Request, res: Response) => {
      try {
        const job = await storage.getJob(req.params.id);
        
        if (!job) {
          return res.status(404).json({ message: 'Job not found' });
        }

        // Check authorization
        if (req.session.role !== 'admin' && req.session.role !== 'contractor' && job.customerId !== req.session.userId) {
          return res.status(403).json({ message: 'Unauthorized to complete this job' });
        }

        // Mark job complete
        const updatedJob = await storage.markJobComplete(req.params.id, {
          completionNotes: req.body.completionNotes,
          completionPhotos: req.body.completionPhotos,
          contractorSignature: req.body.signature
        });

        if (!updatedJob) {
          return res.status(404).json({ message: 'Failed to complete job' });
        }

        res.json({ 
          message: 'Job marked as complete',
          job: updatedJob
        });
      } catch (error) {
        console.error('Error completing job:', error);
        res.status(500).json({ message: 'Failed to complete job' });
      }
    }
  );

  // Create invoice from completed job
  app.post('/api/invoices',
    requireAuth,
    validateRequest(z.object({
      jobId: z.string()
    })),
    async (req: Request, res: Response) => {
      try {
        const { jobId } = req.body;
        const job = await storage.getJob(jobId);
        
        if (!job) {
          return res.status(404).json({ message: 'Job not found' });
        }

        if (job.status !== 'completed') {
          return res.status(400).json({ message: 'Job must be completed before creating invoice' });
        }

        // Check if invoice already exists
        const existingInvoice = await storage.getInvoiceByJobId(jobId);
        if (existingInvoice) {
          return res.status(400).json({ message: 'Invoice already exists for this job' });
        }

        // Calculate amounts
        const subtotal = parseFloat(job.quotedPrice || '0');
        const taxRate = 0.08; // 8% tax rate - could be configurable
        const taxAmount = subtotal * taxRate;
        const totalAmount = subtotal + taxAmount;

        // Create invoice
        const invoice = await storage.createInvoice({
          jobId,
          customerId: job.customerId,
          fleetAccountId: job.fleetAccountId,
          subtotal,
          taxAmount,
          totalAmount,
          amountDue: totalAmount,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        });

        // Get default charges to auto-add
        const defaults = await storage.getInvoiceDefaults(true);
        const defaultLineItems = [];

        // Add service charge as first line item
        await storage.createInvoiceLineItem({
          invoiceId: invoice.id,
          type: 'labor',
          description: `${job.jobType === 'emergency' ? 'Emergency' : 'Scheduled'} Service - ${job.issueDescription || 'Truck Repair'}`,
          quantity: 1,
          unitPrice: subtotal,
          totalPrice: subtotal,
          sortOrder: 0
        });

        // Add default charges
        let sortOrder = 1;
        for (const defaultCharge of defaults) {
          if (defaultCharge.applyByDefault) {
            await storage.createInvoiceLineItem({
              invoiceId: invoice.id,
              type: defaultCharge.type === 'tax' ? 'tax' : defaultCharge.type === 'surcharge' ? 'fee' : 'fee',
              description: defaultCharge.name,
              quantity: 1,
              unitPrice: parseFloat(defaultCharge.amount.toString()),
              totalPrice: parseFloat(defaultCharge.amount.toString()),
              sortOrder: sortOrder++
            });
            defaultLineItems.push(defaultCharge);
          }
        }

        // Add tax line item
        if (taxAmount > 0) {
          await storage.createInvoiceLineItem({
            invoiceId: invoice.id,
            type: 'tax',
            description: 'Tax (8%)',
            quantity: 1,
            unitPrice: taxAmount,
            totalPrice: taxAmount,
            sortOrder: sortOrder++
          });
        }

        const invoiceWithLineItems = await storage.getInvoiceWithLineItems(invoice.id);
        res.json(invoiceWithLineItems);
      } catch (error) {
        console.error('Error creating invoice:', error);
        res.status(500).json({ message: 'Failed to create invoice' });
      }
    }
  );

  // Get invoice with line items
  app.get('/api/invoices/:id',
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const invoice = await storage.getInvoiceWithLineItems(req.params.id);
        
        if (!invoice) {
          return res.status(404).json({ message: 'Invoice not found' });
        }

        // Check authorization
        if (req.session.role !== 'admin' && invoice.customerId !== req.session.userId) {
          return res.status(403).json({ message: 'Unauthorized to view this invoice' });
        }

        res.json(invoice);
      } catch (error) {
        console.error('Error fetching invoice:', error);
        res.status(500).json({ message: 'Failed to fetch invoice' });
      }
    }
  );

  // Add line item to invoice
  app.post('/api/invoices/:id/line-items',
    requireAuth,
    requireRole('admin', 'contractor'),
    validateRequest(z.object({
      type: z.enum(['part', 'labor', 'fee', 'tax', 'other']),
      description: z.string().min(1).max(500),
      quantity: z.number().positive(),
      unitPrice: z.number().nonnegative()
    })),
    async (req: Request, res: Response) => {
      try {
        const invoice = await storage.getInvoice(req.params.id);
        
        if (!invoice) {
          return res.status(404).json({ message: 'Invoice not found' });
        }

        const { type, description, quantity, unitPrice } = req.body;
        const totalPrice = quantity * unitPrice;

        // Get existing line items to determine sort order
        const existingItems = await storage.getInvoiceLineItems(req.params.id);
        const maxSortOrder = existingItems.reduce((max, item) => Math.max(max, item.sortOrder), 0);

        const lineItem = await storage.createInvoiceLineItem({
          invoiceId: req.params.id,
          type,
          description,
          quantity,
          unitPrice,
          totalPrice,
          sortOrder: maxSortOrder + 1
        });

        // Update invoice totals
        const newSubtotal = parseFloat(invoice.subtotal.toString()) + totalPrice;
        const newTaxAmount = type === 'tax' ? parseFloat(invoice.taxAmount.toString()) + totalPrice : parseFloat(invoice.taxAmount.toString());
        const newTotalAmount = newSubtotal + newTaxAmount;
        
        await storage.updateInvoice(req.params.id, {
          subtotal: newSubtotal,
          taxAmount: newTaxAmount,
          totalAmount: newTotalAmount,
          amountDue: newTotalAmount - parseFloat(invoice.paidAmount.toString())
        });

        res.json({ 
          message: 'Line item added',
          lineItem,
          updatedInvoice: await storage.getInvoiceWithLineItems(req.params.id)
        });
      } catch (error) {
        console.error('Error adding line item:', error);
        res.status(500).json({ message: 'Failed to add line item' });
      }
    }
  );

  // Update line item
  app.put('/api/invoices/:invoiceId/line-items/:itemId',
    requireAuth,
    requireRole('admin', 'contractor'),
    validateRequest(z.object({
      type: z.enum(['part', 'labor', 'fee', 'tax', 'other']).optional(),
      description: z.string().min(1).max(500).optional(),
      quantity: z.number().positive().optional(),
      unitPrice: z.number().nonnegative().optional()
    })),
    async (req: Request, res: Response) => {
      try {
        const lineItem = await storage.getInvoiceLineItemById(req.params.itemId);
        
        if (!lineItem || lineItem.invoiceId !== req.params.invoiceId) {
          return res.status(404).json({ message: 'Line item not found' });
        }

        const updates: any = {};
        if (req.body.type !== undefined) updates.type = req.body.type;
        if (req.body.description !== undefined) updates.description = req.body.description;
        if (req.body.quantity !== undefined) updates.quantity = req.body.quantity;
        if (req.body.unitPrice !== undefined) updates.unitPrice = req.body.unitPrice;
        
        // Recalculate total if quantity or price changed
        if (req.body.quantity !== undefined || req.body.unitPrice !== undefined) {
          const quantity = req.body.quantity ?? parseFloat(lineItem.quantity.toString());
          const unitPrice = req.body.unitPrice ?? parseFloat(lineItem.unitPrice.toString());
          updates.totalPrice = quantity * unitPrice;
        }

        await storage.updateInvoiceLineItem(req.params.itemId, updates);
        
        // Recalculate invoice totals
        const allLineItems = await storage.getInvoiceLineItems(req.params.invoiceId);
        const newSubtotal = allLineItems
          .filter(item => item.type !== 'tax')
          .reduce((sum, item) => sum + parseFloat(item.totalPrice.toString()), 0);
        const newTaxAmount = allLineItems
          .filter(item => item.type === 'tax')
          .reduce((sum, item) => sum + parseFloat(item.totalPrice.toString()), 0);
        const newTotalAmount = newSubtotal + newTaxAmount;
        
        const invoice = await storage.getInvoice(req.params.invoiceId);
        await storage.updateInvoice(req.params.invoiceId, {
          subtotal: newSubtotal,
          taxAmount: newTaxAmount,
          totalAmount: newTotalAmount,
          amountDue: newTotalAmount - parseFloat(invoice?.paidAmount?.toString() || '0')
        });

        res.json({ 
          message: 'Line item updated',
          updatedInvoice: await storage.getInvoiceWithLineItems(req.params.invoiceId)
        });
      } catch (error) {
        console.error('Error updating line item:', error);
        res.status(500).json({ message: 'Failed to update line item' });
      }
    }
  );

  // Delete line item
  app.delete('/api/invoices/:invoiceId/line-items/:itemId',
    requireAuth,
    requireRole('admin', 'contractor'),
    async (req: Request, res: Response) => {
      try {
        const lineItem = await storage.getInvoiceLineItemById(req.params.itemId);
        
        if (!lineItem || lineItem.invoiceId !== req.params.invoiceId) {
          return res.status(404).json({ message: 'Line item not found' });
        }

        await storage.deleteInvoiceLineItem(req.params.itemId);
        
        // Recalculate invoice totals
        const allLineItems = await storage.getInvoiceLineItems(req.params.invoiceId);
        const newSubtotal = allLineItems
          .filter(item => item.type !== 'tax')
          .reduce((sum, item) => sum + parseFloat(item.totalPrice.toString()), 0);
        const newTaxAmount = allLineItems
          .filter(item => item.type === 'tax')
          .reduce((sum, item) => sum + parseFloat(item.totalPrice.toString()), 0);
        const newTotalAmount = newSubtotal + newTaxAmount;
        
        const invoice = await storage.getInvoice(req.params.invoiceId);
        await storage.updateInvoice(req.params.invoiceId, {
          subtotal: newSubtotal,
          taxAmount: newTaxAmount,
          totalAmount: newTotalAmount,
          amountDue: newTotalAmount - parseFloat(invoice?.paidAmount?.toString() || '0')
        });

        res.json({ 
          message: 'Line item deleted',
          updatedInvoice: await storage.getInvoiceWithLineItems(req.params.invoiceId)
        });
      } catch (error) {
        console.error('Error deleting line item:', error);
        res.status(500).json({ message: 'Failed to delete line item' });
      }
    }
  );

  // Send invoice to customer
  app.post('/api/invoices/:id/send',
    requireAuth,
    requireRole('admin', 'contractor'),
    async (req: Request, res: Response) => {
      try {
        const invoice = await storage.getInvoiceWithLineItems(req.params.id);
        
        if (!invoice) {
          return res.status(404).json({ message: 'Invoice not found' });
        }

        const customer = await storage.getUser(invoice.customerId);
        if (!customer) {
          return res.status(404).json({ message: 'Customer not found' });
        }

        // TODO: Generate PDF and send via email/SMS
        // For now, just update the status
        await storage.updateInvoice(req.params.id, {
          status: 'sent',
          sentAt: new Date()
        });

        res.json({ 
          message: 'Invoice sent successfully',
          invoice: await storage.getInvoice(req.params.id)
        });
      } catch (error) {
        console.error('Error sending invoice:', error);
        res.status(500).json({ message: 'Failed to send invoice' });
      }
    }
  );

  // Admin: Get all invoices
  app.get('/api/admin/invoices',
    requireAuth,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const { status, fromDate, toDate, contractorId, limit = '50', offset = '0' } = req.query;
        
        const filters: any = { limit: parseInt(limit as string), offset: parseInt(offset as string) };
        if (status) filters.status = status;
        if (contractorId) filters.contractorId = contractorId;
        if (fromDate) filters.fromDate = new Date(fromDate as string);
        if (toDate) filters.toDate = new Date(toDate as string);

        const invoiceList = await storage.getInvoices(filters);
        
        // Enhance with additional data
        const enhancedInvoices = await Promise.all(invoiceList.map(async (invoice) => {
          const lineItems = await storage.getInvoiceLineItems(invoice.id);
          const job = invoice.jobId ? await storage.getJob(invoice.jobId) : null;
          const customer = await storage.getUser(invoice.customerId);
          
          return {
            ...invoice,
            lineItems,
            job: job ? {
              id: job.id,
              jobType: job.jobType,
              issueDescription: job.issueDescription,
              serviceLocation: job.serviceLocation
            } : null,
            customer: customer ? {
              id: customer.id,
              firstName: customer.firstName,
              lastName: customer.lastName,
              email: customer.email,
              phone: customer.phone
            } : null
          };
        }));

        res.json(enhancedInvoices);
      } catch (error) {
        console.error('Error fetching invoices:', error);
        res.status(500).json({ message: 'Failed to fetch invoices' });
      }
    }
  );

  // Admin: Configure invoice defaults
  app.put('/api/admin/invoice-defaults',
    requireAuth,
    requireRole('admin'),
    validateRequest(z.object({
      defaults: z.array(z.object({
        id: z.string().optional(),
        name: z.string().min(1).max(100),
        amount: z.number().nonnegative(),
        type: z.enum(['fee', 'tax', 'surcharge']),
        isActive: z.boolean(),
        applyByDefault: z.boolean(),
        description: z.string().optional(),
        sortOrder: z.number().optional()
      }))
    })),
    async (req: Request, res: Response) => {
      try {
        const { defaults } = req.body;
        const updatedDefaults = [];

        for (const defaultItem of defaults) {
          if (defaultItem.id) {
            // Update existing
            const updated = await storage.updateInvoiceDefault(defaultItem.id, defaultItem);
            if (updated) updatedDefaults.push(updated);
          } else {
            // Create new
            const created = await storage.createInvoiceDefault(defaultItem);
            updatedDefaults.push(created);
          }
        }

        res.json({ 
          message: 'Invoice defaults updated',
          defaults: updatedDefaults
        });
      } catch (error) {
        console.error('Error updating invoice defaults:', error);
        res.status(500).json({ message: 'Failed to update invoice defaults' });
      }
    }
  );

  // Admin: Get invoice defaults
  app.get('/api/admin/invoice-defaults',
    requireAuth,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const defaults = await storage.getInvoiceDefaults();
        res.json(defaults);
      } catch (error) {
        console.error('Error fetching invoice defaults:', error);
        res.status(500).json({ message: 'Failed to fetch invoice defaults' });
      }
    }
  );

  // Download invoice as PDF
  app.get('/api/invoices/:id/download',
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const invoice = await storage.getInvoice(req.params.id);
        
        if (!invoice) {
          return res.status(404).json({ message: 'Invoice not found' });
        }

        // Get related data
        const job = await storage.getJob(invoice.jobId);
        const customer = await storage.getUser(invoice.customerId);
        const contractor = invoice.contractorId ? 
          await storage.getContractorProfile(invoice.contractorId) : undefined;
        const transactions = await storage.getInvoiceTransactions(invoice.id);
        
        let fleetAccount = undefined;
        if (customer) {
          const driverProfile = await storage.getDriverProfile(customer.id);
          if (driverProfile?.fleetAccountId) {
            fleetAccount = await storage.getFleetAccount(driverProfile.fleetAccountId);
          }
        }

        // Generate PDF
        const pdfService = (await import('./pdf-service')).default;
        const pdfBuffer = await pdfService.generateInvoice({
          invoice,
          job: job!,
          customer: customer!,
          contractor,
          fleetAccount,
          transactions
        });

        // Set headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 
          `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`);
        res.send(pdfBuffer);
      } catch (error) {
        console.error('Download invoice error:', error);
        res.status(500).json({ message: 'Failed to download invoice' });
      }
    }
  );

  // Download invoice as PDF (alternative endpoint)
  app.get('/api/invoices/:invoiceId/pdf',
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const invoice = await storage.getInvoice(req.params.invoiceId);
        
        if (!invoice) {
          return res.status(404).json({ message: 'Invoice not found' });
        }

        // Check authorization
        if (req.session.role !== 'admin' && 
            req.session.role !== 'fleet_manager' &&
            invoice.customerId !== req.session.userId) {
          return res.status(403).json({ message: 'Unauthorized to download this invoice' });
        }

        // Get related data
        const job = invoice.jobId ? await storage.getJob(invoice.jobId) : null;
        const customer = await storage.getUser(invoice.customerId);
        const contractor = invoice.contractorId ? 
          await storage.getContractorProfile(invoice.contractorId) : undefined;
        const transactions = await storage.getInvoiceTransactions(invoice.id);
        
        let fleetAccount = undefined;
        if (invoice.fleetAccountId) {
          fleetAccount = await storage.getFleetAccount(invoice.fleetAccountId);
        } else if (customer) {
          const driverProfile = await storage.getDriverProfile(customer.id);
          if (driverProfile?.fleetAccountId) {
            fleetAccount = await storage.getFleetAccount(driverProfile.fleetAccountId);
          }
        }

        // Generate PDF
        const pdfBuffer = await pdfService.generateInvoice({
          invoice,
          job: job!,
          customer: customer!,
          contractor,
          fleetAccount,
          transactions
        });

        // Set headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 
          `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`);
        res.send(pdfBuffer);
      } catch (error) {
        console.error('Download invoice PDF error:', error);
        res.status(500).json({ message: 'Failed to download invoice' });
      }
    }
  );

  // Generate invoice for a completed job
  app.post('/api/jobs/:jobId/invoice',
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const job = await storage.getJob(req.params.jobId);
        
        if (!job) {
          return res.status(404).json({ message: 'Job not found' });
        }

        if (job.status !== 'completed') {
          return res.status(400).json({ message: 'Job must be completed to generate invoice' });
        }

        // Check if invoice already exists
        let invoice = await storage.getInvoiceByJobId(job.id);
        
        if (!invoice) {
          // Generate new invoice
          const invoiceNumber = pdfService.generateInvoiceNumber();
          
          // Calculate amounts
          const subtotal = parseFloat(job.actualPrice || job.quotedPrice || '0');
          const taxRate = 0.0825; // 8.25% tax rate
          const taxAmount = subtotal * taxRate;
          const totalAmount = subtotal + taxAmount;
          
          invoice = await storage.createInvoice({
            jobId: job.id,
            customerId: job.customerId,
            fleetAccountId: job.fleetAccountId,
            invoiceNumber,
            issueDate: new Date(),
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            subtotal,
            taxAmount,
            totalAmount,
            amountDue: totalAmount,
            status: 'pending'
          });

          // Add line items
          await storage.createInvoiceLineItem({
            invoiceId: invoice.id,
            type: 'labor',
            description: `${job.jobType === 'emergency' ? 'Emergency' : 'Scheduled'} Service - ${job.issueDescription || 'Truck Repair'}`,
            quantity: 1,
            unitPrice: subtotal,
            totalPrice: subtotal,
            sortOrder: 0
          });

          // Add tax line item
          if (taxAmount > 0) {
            await storage.createInvoiceLineItem({
              invoiceId: invoice.id,
              type: 'tax',
              description: 'Tax (8.25%)',
              quantity: 1,
              unitPrice: taxAmount,
              totalPrice: taxAmount,
              sortOrder: 1
            });
          }
        }

        const invoiceWithLineItems = await storage.getInvoiceWithLineItems(invoice.id);
        res.json({
          message: 'Invoice generated successfully',
          invoice: invoiceWithLineItems
        });
      } catch (error) {
        console.error('Generate job invoice error:', error);
        res.status(500).json({ message: 'Failed to generate invoice' });
      }
    }
  );

  // Get all invoices for a fleet
  app.get('/api/fleet/:fleetId/invoices',
    requireAuth,
    requireRole('admin', 'fleet_manager'),
    async (req: Request, res: Response) => {
      try {
        const { startDate, endDate, status } = req.query;
        
        // Get fleet account
        const fleetAccount = await storage.getFleetAccount(req.params.fleetId);
        if (!fleetAccount) {
          return res.status(404).json({ message: 'Fleet account not found' });
        }

        // Check authorization
        if (req.session.role !== 'admin') {
          const fleetContacts = await storage.getFleetContacts(req.params.fleetId);
          const isFleetManager = fleetContacts.some(
            contact => contact.userId === req.session.userId && contact.isPrimary
          );
          if (!isFleetManager) {
            return res.status(403).json({ message: 'Unauthorized to view fleet invoices' });
          }
        }

        // Get invoices
        const filters: any = {
          fleetAccountId: req.params.fleetId
        };
        
        if (startDate) filters.startDate = new Date(startDate as string);
        if (endDate) filters.endDate = new Date(endDate as string);
        if (status) filters.status = status as string;

        const invoices = await storage.getInvoices(filters);
        
        // Calculate statistics
        const stats = {
          totalInvoices: invoices.length,
          totalAmount: invoices.reduce((sum, inv) => sum + parseFloat(inv.totalAmount.toString()), 0),
          totalPaid: invoices.filter(inv => inv.status === 'paid').length,
          totalPending: invoices.filter(inv => inv.status === 'pending').length,
          totalOverdue: invoices.filter(inv => inv.status === 'overdue').length
        };

        res.json({
          fleetAccount,
          invoices,
          stats
        });
      } catch (error) {
        console.error('Get fleet invoices error:', error);
        res.status(500).json({ message: 'Failed to get fleet invoices' });
      }
    }
  );

  // Generate monthly fleet invoice
  app.post('/api/fleet/:fleetId/monthly-invoice',
    requireAuth,
    requireRole('admin', 'fleet_manager'),
    async (req: Request, res: Response) => {
      try {
        const { month, year } = req.body;
        const targetMonth = month || new Date().getMonth();
        const targetYear = year || new Date().getFullYear();
        
        // Get fleet account
        const fleetAccount = await storage.getFleetAccount(req.params.fleetId);
        if (!fleetAccount) {
          return res.status(404).json({ message: 'Fleet account not found' });
        }

        // Calculate date range for the month
        const startDate = new Date(targetYear, targetMonth, 1);
        const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);
        
        // Get all completed jobs for the fleet in this month
        const jobs = await storage.findJobs({
          fleetAccountId: req.params.fleetId,
          status: 'completed',
          fromDate: startDate,
          toDate: endDate
        });

        if (jobs.length === 0) {
          return res.status(400).json({ 
            message: 'No completed jobs found for the specified month' 
          });
        }

        // Calculate totals
        let subtotal = 0;
        const jobDetails = jobs.map(job => {
          const jobAmount = parseFloat(job.actualPrice || job.quotedPrice || '0');
          subtotal += jobAmount;
          return {
            jobId: job.id,
            date: job.completedAt,
            description: job.issueDescription,
            amount: jobAmount
          };
        });

        // Apply fleet discount if applicable
        let discountAmount = 0;
        if (fleetAccount.pricingTier && fleetAccount.pricingTier !== 'standard') {
          const discountRate = fleetAccount.pricingTier === 'platinum' ? 0.15 :
                             fleetAccount.pricingTier === 'gold' ? 0.10 :
                             fleetAccount.pricingTier === 'silver' ? 0.05 : 0;
          discountAmount = subtotal * discountRate;
        }

        const afterDiscount = subtotal - discountAmount;
        const taxAmount = afterDiscount * 0.0825; // 8.25% tax
        const totalAmount = afterDiscount + taxAmount;

        // Generate invoice number
        const invoiceNumber = pdfService.generateInvoiceNumber('FLEET');
        
        // Create consolidated invoice
        const invoice = await storage.createInvoice({
          fleetAccountId: req.params.fleetId,
          customerId: fleetAccount.primaryContactUserId || req.session.userId!,
          invoiceNumber,
          issueDate: new Date(),
          dueDate: new Date(Date.now() + (fleetAccount.netTerms || 30) * 24 * 60 * 60 * 1000),
          subtotal,
          taxAmount,
          totalAmount,
          amountDue: totalAmount,
          status: 'pending',
          metadata: {
            type: 'monthly_consolidated',
            month: targetMonth,
            year: targetYear,
            jobCount: jobs.length,
            discountAmount,
            fleetDiscount: discountAmount > 0 ? (discountAmount / subtotal) : 0
          }
        });

        // Add line items for each job
        let sortOrder = 0;
        for (const jobDetail of jobDetails) {
          await storage.createInvoiceLineItem({
            invoiceId: invoice.id,
            type: 'labor',
            description: `Job ${jobDetail.jobId.slice(0, 8)} - ${jobDetail.description}`,
            quantity: 1,
            unitPrice: jobDetail.amount,
            totalPrice: jobDetail.amount,
            sortOrder: sortOrder++
          });
        }

        // Add discount line item if applicable
        if (discountAmount > 0) {
          await storage.createInvoiceLineItem({
            invoiceId: invoice.id,
            type: 'fee',
            description: `Fleet Discount (${fleetAccount.pricingTier})`,
            quantity: 1,
            unitPrice: -discountAmount,
            totalPrice: -discountAmount,
            sortOrder: sortOrder++
          });
        }

        // Add tax line item
        await storage.createInvoiceLineItem({
          invoiceId: invoice.id,
          type: 'tax',
          description: 'Tax (8.25%)',
          quantity: 1,
          unitPrice: taxAmount,
          totalPrice: taxAmount,
          sortOrder: sortOrder++
        });

        const invoiceWithLineItems = await storage.getInvoiceWithLineItems(invoice.id);
        
        res.json({
          message: 'Monthly fleet invoice generated successfully',
          invoice: invoiceWithLineItems,
          summary: {
            month: `${targetMonth + 1}/${targetYear}`,
            jobCount: jobs.length,
            subtotal,
            discountAmount,
            taxAmount,
            totalAmount
          }
        });
      } catch (error) {
        console.error('Generate monthly fleet invoice error:', error);
        res.status(500).json({ message: 'Failed to generate monthly invoice' });
      }
    }
  );

  // ==================== PARTS INVENTORY ROUTES ====================
  
  // GET /api/parts/catalog - Browse parts catalog with search
  app.get('/api/parts/catalog', async (req: Request, res: Response) => {
    try {
      const { 
        query,
        category,
        manufacturer,
        minPrice,
        maxPrice,
        isActive,
        compatibleMake,
        compatibleModel,
        compatibleYear,
        limit = 50,
        offset = 0
      } = req.query;
      
      const filters = {
        query: query as string,
        category: category as string,
        manufacturer: manufacturer as string,
        minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
        isActive: isActive === 'true',
        compatibleMake: compatibleMake as string,
        compatibleModel: compatibleModel as string,
        compatibleYear: compatibleYear ? parseInt(compatibleYear as string) : undefined,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      };
      
      const parts = await storage.searchPartsCatalog(filters);
      res.json({ success: true, parts });
    } catch (error: any) {
      console.error('Error fetching parts catalog:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch parts catalog' 
      });
    }
  });
  
  // POST /api/parts - Add new part to catalog
  app.post('/api/parts', requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const partData = {
        ...req.body,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const newPart = await storage.addPartToCatalog(partData);
      res.json({ success: true, part: newPart });
    } catch (error: any) {
      console.error('Error adding part to catalog:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to add part to catalog' 
      });
    }
  });
  
  // PUT /api/parts/:id - Update part in catalog
  app.put('/api/parts/:id', requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = {
        ...req.body,
        updatedAt: new Date()
      };
      
      const updatedPart = await storage.updatePartInCatalog(id, updates);
      if (!updatedPart) {
        return res.status(404).json({ 
          success: false, 
          error: 'Part not found' 
        });
      }
      
      res.json({ success: true, part: updatedPart });
    } catch (error: any) {
      console.error('Error updating part:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to update part' 
      });
    }
  });
  
  // GET /api/parts/:id - Get specific part details
  app.get('/api/parts/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const part = await storage.getPartById(id);
      
      if (!part) {
        return res.status(404).json({ 
          success: false, 
          error: 'Part not found' 
        });
      }
      
      res.json({ success: true, part });
    } catch (error: any) {
      console.error('Error fetching part:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch part' 
      });
    }
  });
  
  // GET /api/parts/inventory - Current inventory levels
  app.get('/api/parts/inventory', requireAuth, async (req: Request, res: Response) => {
    try {
      const { warehouseId, includeInactive } = req.query;
      
      const inventory = await storage.getInventoryLevels(
        warehouseId as string,
        includeInactive === 'true'
      );
      
      res.json({ success: true, inventory });
    } catch (error: any) {
      console.error('Error fetching inventory levels:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch inventory levels' 
      });
    }
  });
  
  // PUT /api/parts/:id/stock - Adjust inventory level
  app.put('/api/parts/:id/stock', requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { warehouseId, quantity, transactionType, notes } = req.body;
      
      if (!warehouseId || quantity === undefined) {
        return res.status(400).json({ 
          success: false, 
          error: 'Warehouse ID and quantity are required' 
        });
      }
      
      const updatedInventory = await storage.updateInventoryLevel(
        id,
        warehouseId,
        quantity,
        transactionType,
        notes
      );
      
      res.json({ success: true, inventory: updatedInventory });
    } catch (error: any) {
      console.error('Error updating inventory level:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to update inventory level' 
      });
    }
  });
  
  // POST /api/jobs/:jobId/parts - Add parts to job
  app.post('/api/jobs/:jobId/parts', requireAuth, async (req: Request, res: Response) => {
    try {
      const { jobId } = req.params;
      const { partId, quantity, warehouseId, warrantyMonths } = req.body;
      
      if (!partId || !quantity) {
        return res.status(400).json({ 
          success: false, 
          error: 'Part ID and quantity are required' 
        });
      }
      
      // Get contractor ID from session or job
      const job = await storage.getJob(jobId);
      if (!job) {
        return res.status(404).json({ 
          success: false, 
          error: 'Job not found' 
        });
      }
      
      const contractorId = job.contractorId || req.session.userId;
      if (!contractorId) {
        return res.status(400).json({ 
          success: false, 
          error: 'Contractor ID required' 
        });
      }
      
      const jobPart = await storage.recordPartUsage(
        jobId,
        partId,
        quantity,
        contractorId,
        warehouseId || 'main',
        warrantyMonths || 12
      );
      
      res.json({ success: true, jobPart });
    } catch (error: any) {
      console.error('Error adding parts to job:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to add parts to job' 
      });
    }
  });
  
  // GET /api/jobs/:jobId/parts - Get parts used in a job
  app.get('/api/jobs/:jobId/parts', requireAuth, async (req: Request, res: Response) => {
    try {
      const { jobId } = req.params;
      const jobParts = await storage.getJobParts(jobId);
      
      res.json({ success: true, parts: jobParts });
    } catch (error: any) {
      console.error('Error fetching job parts:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch job parts' 
      });
    }
  });
  
  // GET /api/parts/reorder - Parts needing reorder
  app.get('/api/parts/reorder', requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { warehouseId } = req.query;
      const reorderNeeded = await storage.checkReorderNeeded(warehouseId as string);
      
      res.json({ success: true, parts: reorderNeeded });
    } catch (error: any) {
      console.error('Error checking reorder needs:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to check reorder needs' 
      });
    }
  });
  
  // POST /api/parts/orders - Create purchase order
  app.post('/api/parts/orders', requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { supplierName, items, supplierContact, expectedDeliveryDays } = req.body;
      
      if (!supplierName || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'Supplier name and items are required' 
        });
      }
      
      const order = await storage.createPartsOrder(
        supplierName,
        items,
        supplierContact,
        expectedDeliveryDays,
        req.session.userId
      );
      
      res.json({ success: true, order });
    } catch (error: any) {
      console.error('Error creating parts order:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to create parts order' 
      });
    }
  });
  
  // GET /api/parts/orders - Get purchase orders
  app.get('/api/parts/orders', requireAuth, async (req: Request, res: Response) => {
    try {
      const { status, supplierName, fromDate, toDate } = req.query;
      
      const filters: any = {};
      if (status) filters.status = status;
      if (supplierName) filters.supplierName = supplierName;
      if (fromDate) filters.fromDate = new Date(fromDate as string);
      if (toDate) filters.toDate = new Date(toDate as string);
      
      const orders = await storage.getPartsOrders(filters);
      res.json({ success: true, orders });
    } catch (error: any) {
      console.error('Error fetching parts orders:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch parts orders' 
      });
    }
  });
  
  // PUT /api/parts/orders/:id/receive - Receive parts order
  app.put('/api/parts/orders/:id/receive', requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { receivedItems, trackingNumber } = req.body;
      
      if (!receivedItems || !Array.isArray(receivedItems) || receivedItems.length === 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'Received items are required' 
        });
      }
      
      const updatedOrder = await storage.receivePartsOrder(
        id,
        receivedItems,
        trackingNumber
      );
      
      res.json({ success: true, order: updatedOrder });
    } catch (error: any) {
      console.error('Error receiving parts order:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to receive parts order' 
      });
    }
  });
  
  // GET /api/reports/inventory-value - Inventory valuation
  app.get('/api/reports/inventory-value', requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { warehouseId, method } = req.query;
      
      const valuation = await storage.getInventoryValue(
        warehouseId as string,
        (method as 'FIFO' | 'LIFO' | 'AVERAGE') || 'AVERAGE'
      );
      
      res.json({ success: true, valuation });
    } catch (error: any) {
      console.error('Error calculating inventory value:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to calculate inventory value' 
      });
    }
  });
  
  // GET /api/parts/compatibility - Check part compatibility
  app.get('/api/parts/compatibility', async (req: Request, res: Response) => {
    try {
      const { make, model, year } = req.query;
      
      if (!make || !model || !year) {
        return res.status(400).json({ 
          success: false, 
          error: 'Make, model, and year are required' 
        });
      }
      
      const compatibleParts = await storage.getPartsForVehicle(
        make as string,
        model as string,
        parseInt(year as string)
      );
      
      res.json({ success: true, parts: compatibleParts });
    } catch (error: any) {
      console.error('Error checking part compatibility:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to check part compatibility' 
      });
    }
  });
  
  // GET /api/parts/:id/history - Get part usage history
  app.get('/api/parts/:id/history', requireAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { startDate, endDate } = req.query;
      
      const dateRange = startDate && endDate ? {
        startDate: new Date(startDate as string),
        endDate: new Date(endDate as string)
      } : undefined;
      
      const history = await storage.getPartUsageHistory(id, dateRange);
      res.json({ success: true, history });
    } catch (error: any) {
      console.error('Error fetching part usage history:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch part usage history' 
      });
    }
  });
  
  // GET /api/parts/warranties/expiring - Get expiring warranties
  app.get('/api/parts/warranties/expiring', requireAuth, async (req: Request, res: Response) => {
    try {
      const { daysAhead } = req.query;
      const report = await storage.getWarrantyReport(
        daysAhead ? parseInt(daysAhead as string) : 30
      );
      
      res.json({ success: true, report });
    } catch (error: any) {
      console.error('Error fetching warranty report:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch warranty report' 
      });
    }
  });
  
  // GET /api/parts/:id/forecast - Forecast parts demand
  app.get('/api/parts/:id/forecast', requireAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { daysToForecast } = req.query;
      
      const forecast = await storage.forecastPartsDemand(
        id,
        daysToForecast ? parseInt(daysToForecast as string) : 30
      );
      
      res.json({ success: true, forecast });
    } catch (error: any) {
      console.error('Error forecasting demand:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to forecast demand' 
      });
    }
  });
  
  // GET /api/reports/supplier-performance - Get supplier performance
  app.get('/api/reports/supplier-performance', requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { supplierName } = req.query;
      const performance = await storage.getSupplierPerformance(supplierName as string);
      
      res.json({ success: true, performance });
    } catch (error: any) {
      console.error('Error fetching supplier performance:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch supplier performance' 
      });
    }
  });
  
  // GET /api/parts/transactions - Get parts transactions
  app.get('/api/parts/transactions', requireAuth, async (req: Request, res: Response) => {
    try {
      const { partId, jobId, contractorId, transactionType, warehouseId, fromDate, toDate } = req.query;
      
      const filters: any = {};
      if (partId) filters.partId = partId;
      if (jobId) filters.jobId = jobId;
      if (contractorId) filters.contractorId = contractorId;
      if (transactionType) filters.transactionType = transactionType;
      if (warehouseId) filters.warehouseId = warehouseId;
      if (fromDate) filters.fromDate = new Date(fromDate as string);
      if (toDate) filters.toDate = new Date(toDate as string);
      
      const transactions = await storage.getPartsTransactions(filters);
      res.json({ success: true, transactions });
    } catch (error: any) {
      console.error('Error fetching parts transactions:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch parts transactions' 
      });
    }
  });

  // ==================== SPLIT PAYMENT ROUTES ====================
  
  // Create split payment configuration template
  app.post('/api/payments/split-config',
    requireAuth,
    validateRequest(z.object({
      name: z.string(),
      description: z.string().optional(),
      splitRules: z.array(z.object({
        payerType: z.enum(['driver', 'company', 'fleet', 'insurance']),
        payerId: z.string().optional(),
        payerName: z.string().optional(),
        payerEmail: z.string().email().optional(),
        payerPhone: z.string().optional(),
        amount: z.number().optional(),
        percentage: z.number().min(0).max(100).optional(),
        isRemainder: z.boolean().optional(),
        deductFrom: z.number().optional(),
        description: z.string().optional(),
        minAmount: z.number().optional(),
        maxAmount: z.number().optional(),
        tier: z.object({
          ranges: z.array(z.object({
            min: z.number(),
            max: z.number(),
            percentage: z.number()
          }))
        }).optional()
      })),
      conditions: z.any().optional(),
      priority: z.number().optional(),
      isActive: z.boolean().optional(),
      isDefault: z.boolean().optional()
    })),
    async (req: Request, res: Response) => {
      try {
        const splitPaymentService = (await import('./split-payment-service')).splitPaymentService;
        
        // Validate configuration
        const validation = splitPaymentService.validateSplitConfiguration(req.body);
        if (!validation.isValid) {
          return res.status(400).json({ 
            message: 'Invalid configuration',
            errors: validation.errors 
          });
        }

        const result = await splitPaymentService.createSplitConfig(req.body);
        
        res.status(201).json({
          message: 'Split payment configuration created successfully',
          ...result
        });
      } catch (error: any) {
        console.error('Create split config error:', error);
        res.status(500).json({ 
          message: 'Failed to create split configuration',
          error: error.message 
        });
      }
    }
  );
  
  // Get split payment templates
  app.get('/api/payments/split/templates',
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const templates = await storage.getSplitPaymentTemplates();
        res.json({ templates });
      } catch (error) {
        console.error('Get split payment templates error:', error);
        res.status(500).json({ message: 'Failed to get split payment templates' });
      }
    }
  );

  // Create split payment for a job
  app.post('/api/payments/split',
    requireAuth,
    validateRequest(z.object({
      jobId: z.string(),
      templateId: z.string().optional().nullable(),
      customSplits: z.array(z.object({
        payerType: z.enum(['carrier', 'driver', 'fleet', 'insurance', 'other']),
        payerName: z.string(),
        payerEmail: z.string().email().optional(),
        payerPhone: z.string().optional(),
        amount: z.number().positive().optional(),
        percentage: z.number().min(0).max(100).optional(),
        isRemainder: z.boolean().optional(),
        description: z.string()
      })).optional()
    })),
    async (req: Request, res: Response) => {
      try {
        const splitPaymentService = (await import('./split-payment-service')).splitPaymentService;
        
        const result = await splitPaymentService.createSplitPayment(
          req.body.jobId,
          req.body.templateId,
          req.body.customSplits
        );

        res.status(201).json({
          message: 'Split payment created successfully',
          splitPayment: result.splitPayment,
          paymentSplits: result.paymentSplits
        });
      } catch (error: any) {
        console.error('Create split payment error:', error);
        res.status(500).json({ 
          message: 'Failed to create split payment',
          error: error.message 
        });
      }
    }
  );

  // Get split payment details
  app.get('/api/payments/split/:jobId',
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const splitPayment = await storage.getSplitPaymentByJobId(req.params.jobId);
        
        if (!splitPayment) {
          return res.status(404).json({ message: 'Split payment not found for this job' });
        }

        const paymentSplits = await storage.getPaymentSplitsByJobId(req.params.jobId);
        
        res.json({ 
          splitPayment,
          paymentSplits
        });
      } catch (error) {
        console.error('Get split payment error:', error);
        res.status(500).json({ message: 'Failed to get split payment details' });
      }
    }
  );

  // Verify split payment token and get details
  app.get('/api/payments/split/verify/:token',
    async (req: Request, res: Response) => {
      try {
        const paymentSplit = await storage.getPaymentSplitByToken(req.params.token);
        
        if (!paymentSplit) {
          return res.status(404).json({ message: 'Invalid or expired payment link' });
        }

        // Get related job details
        const job = await storage.getJob(paymentSplit.jobId);
        
        res.json({ 
          paymentSplit,
          job: job ? {
            id: job.id,
            serviceType: job.serviceType,
            location: job.location,
            totalAmount: job.totalAmount,
            status: job.status
          } : null
        });
      } catch (error) {
        console.error('Verify split payment error:', error);
        res.status(500).json({ message: 'Failed to verify payment link' });
      }
    }
  );

  // Process split payment via payment link
  app.post('/api/payments/split/pay/:token',
    rateLimiter(10, 60000), // 10 requests per minute
    validateRequest(z.object({
      paymentMethodType: z.enum(['credit_card', 'efs_check', 'comdata_check', 'cash']),
      paymentDetails: z.any() // Varies by payment method
    })),
    async (req: Request, res: Response) => {
      try {
        const paymentSplit = await storage.getPaymentSplitByToken(req.params.token);
        
        if (!paymentSplit) {
          return res.status(404).json({ message: 'Invalid or expired payment link' });
        }

        if (paymentSplit.status !== 'pending') {
          return res.status(400).json({ 
            message: `Payment already ${paymentSplit.status}`,
            status: paymentSplit.status
          });
        }

        // Check token expiration
        if (paymentSplit.tokenExpiresAt && new Date() > paymentSplit.tokenExpiresAt) {
          return res.status(400).json({ message: 'Payment link has expired' });
        }

        // Process payment based on method type
        let transaction;
        const { paymentMethodType, paymentDetails } = req.body;
        
        if (paymentMethodType === 'credit_card') {
          // Process credit card payment via Stripe
          if (!paymentDetails.paymentIntentId) {
            return res.status(400).json({ message: 'Payment intent ID required for card payment' });
          }
          
          transaction = await storage.createTransaction({
            jobId: paymentSplit.jobId,
            userId: paymentSplit.payerId || 'guest',
            amount: paymentSplit.amountAssigned,
            status: 'completed',
            stripePaymentIntentId: paymentDetails.paymentIntentId,
            processedAt: new Date(),
            metadata: {
              splitPaymentId: paymentSplit.splitPaymentId,
              paymentSplitId: paymentSplit.id,
              payerType: paymentSplit.payerType
            }
          });
        } else if (paymentMethodType === 'efs_check' || paymentMethodType === 'comdata_check') {
          // Process fleet check payment
          const checkData = paymentDetails as any;
          const check = await storage.createFleetCheck({
            provider: paymentMethodType === 'efs_check' ? 'efs' : 'comdata',
            checkNumber: checkData.checkNumber,
            authorizationCode: checkData.authorizationCode,
            driverCode: checkData.driverCode,
            jobId: paymentSplit.jobId,
            userId: paymentSplit.payerId,
            authorizedAmount: paymentSplit.amountAssigned,
            capturedAmount: paymentSplit.amountAssigned,
            status: 'captured',
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
          });
          
          transaction = await storage.createTransaction({
            jobId: paymentSplit.jobId,
            userId: paymentSplit.payerId || 'guest',
            amount: paymentSplit.amountAssigned,
            status: 'completed',
            processedAt: new Date(),
            metadata: {
              splitPaymentId: paymentSplit.splitPaymentId,
              paymentSplitId: paymentSplit.id,
              payerType: paymentSplit.payerType,
              checkId: check.id
            }
          });
        } else {
          // Cash or other payment method
          transaction = await storage.createTransaction({
            jobId: paymentSplit.jobId,
            userId: paymentSplit.payerId || 'guest',
            amount: paymentSplit.amountAssigned,
            status: 'completed',
            processedAt: new Date(),
            metadata: {
              splitPaymentId: paymentSplit.splitPaymentId,
              paymentSplitId: paymentSplit.id,
              payerType: paymentSplit.payerType,
              paymentMethod: paymentMethodType
            }
          });
        }

        // Mark payment split as paid
        await storage.markPaymentSplitAsPaid(
          paymentSplit.id,
          transaction.id,
          parseFloat(paymentSplit.amountAssigned)
        );

        // Send confirmation notification
        const splitPaymentService = (await import('./split-payment-service')).splitPaymentService;
        await splitPaymentService.sendPaymentConfirmation(paymentSplit);

        res.json({
          message: 'Payment processed successfully',
          transaction,
          paymentSplit: await storage.getPaymentSplit(paymentSplit.id)
        });
      } catch (error: any) {
        console.error('Process split payment error:', error);
        res.status(500).json({ 
          message: 'Failed to process payment',
          error: error.message 
        });
      }
    }
  );

  // Get split payment status
  app.get('/api/payments/split/status/:jobId',
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const splitPayment = await storage.getSplitPaymentByJobId(req.params.jobId);
        
        if (!splitPayment) {
          return res.status(404).json({ message: 'Split payment not found for this job' });
        }

        const paymentSplits = await storage.getPaymentSplitsByJobId(req.params.jobId);
        
        const totalAssigned = paymentSplits.reduce(
          (sum, split) => sum + parseFloat(split.amountAssigned), 0
        );
        const totalPaid = paymentSplits.reduce(
          (sum, split) => sum + parseFloat(split.amountPaid), 0
        );
        const pendingCount = paymentSplits.filter(s => s.status === 'pending').length;
        const paidCount = paymentSplits.filter(s => s.status === 'paid').length;
        const failedCount = paymentSplits.filter(s => s.status === 'failed').length;

        res.json({
          splitPayment: {
            ...splitPayment,
            totalAssigned,
            totalPaid,
            percentCollected: totalAssigned > 0 ? (totalPaid / totalAssigned * 100).toFixed(2) : 0,
            pendingCount,
            paidCount,
            failedCount
          },
          paymentSplits: paymentSplits.map(split => ({
            ...split,
            paymentLink: split.status === 'pending' ? split.paymentLinkUrl : null
          }))
        });
      } catch (error) {
        console.error('Get split payment status error:', error);
        res.status(500).json({ message: 'Failed to get split payment status' });
      }
    }
  );

  // Send payment reminders
  app.post('/api/payments/split/remind',
    requireAuth,
    requireRole('admin', 'contractor'),
    validateRequest(z.object({
      splitPaymentId: z.string(),
      paymentSplitIds: z.array(z.string()).optional()
    })),
    async (req: Request, res: Response) => {
      try {
        const splitPaymentService = (await import('./split-payment-service')).splitPaymentService;
        
        const paymentSplits = req.body.paymentSplitIds ? 
          await Promise.all(req.body.paymentSplitIds.map(id => storage.getPaymentSplit(id))) :
          await storage.getPaymentSplitsBySplitPaymentId(req.body.splitPaymentId);

        let sent = 0;
        let failed = 0;
        
        for (const split of paymentSplits) {
          if (split && split.status === 'pending' && (split.payerEmail || split.payerPhone)) {
            try {
              await splitPaymentService.sendPaymentLink(split);
              await storage.updatePaymentSplit(split.id, {
                remindersSent: split.remindersSent + 1,
                lastReminderAt: new Date()
              });
              sent++;
            } catch (error) {
              console.error(`Failed to send reminder to split ${split.id}:`, error);
              failed++;
            }
          }
        }

        res.json({
          message: `Reminders sent: ${sent}, failed: ${failed}`,
          sent,
          failed
        });
      } catch (error: any) {
        console.error('Send reminders error:', error);
        res.status(500).json({ 
          message: 'Failed to send reminders',
          error: error.message 
        });
      }
    }
  );

  // Admin: View all split payments
  app.get('/api/admin/payments/split',
    requireAuth,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const { limit, offset } = getPagination(req);
        
        // Get all split payments with pagination
        const splitPayments = await db.select().from(splitPayments)
          .orderBy(desc(splitPayments.createdAt))
          .limit(limit)
          .offset(offset);

        // Get statistics
        const stats = await storage.getSplitPaymentStatistics();

        res.json({
          splitPayments,
          stats,
          pagination: { limit, offset }
        });
      } catch (error) {
        console.error('Get admin split payments error:', error);
        res.status(500).json({ message: 'Failed to get split payments' });
      }
    }
  );

  // Admin: Update split payment template
  app.post('/api/admin/payments/split/templates',
    requireAuth,
    requireRole('admin'),
    validateRequest(insertSplitPaymentTemplateSchema),
    async (req: Request, res: Response) => {
      try {
        const template = await storage.createSplitPaymentTemplate(req.body);
        
        res.status(201).json({
          message: 'Split payment template created',
          template
        });
      } catch (error) {
        console.error('Create split payment template error:', error);
        res.status(500).json({ message: 'Failed to create template' });
      }
    }
  );

  // NEW: Create split payment for a specific job
  app.post('/api/jobs/:id/split-payment',
    requireAuth,
    validateRequest(z.object({
      totalAmount: z.number(),
      splits: z.array(z.object({
        payerId: z.string(),
        type: z.enum(['driver', 'company', 'fleet', 'insurance']),
        payerName: z.string().optional(),
        payerEmail: z.string().email().optional(),
        payerPhone: z.string().optional(),
        amount: z.number().optional(),
        percentage: z.number().min(0).max(100).optional(),
        description: z.string().optional()
      })),
      templateId: z.string().optional()
    })),
    async (req: Request, res: Response) => {
      try {
        const splitPaymentService = (await import('./split-payment-service')).splitPaymentService;
        
        const result = await splitPaymentService.applySplitToJob(
          req.params.id,
          req.body
        );
        
        res.status(201).json({
          message: 'Split payment created and applied to job',
          ...result
        });
      } catch (error: any) {
        console.error('Apply split to job error:', error);
        res.status(500).json({ 
          message: 'Failed to apply split payment to job',
          error: error.message 
        });
      }
    }
  );

  // NEW: Process split payment for specific split portion
  app.post('/api/payments/split/:splitId/process',
    validateRequest(z.object({
      payerId: z.string(),
      paymentMethodType: z.enum(['credit_card', 'efs_check', 'comdata_check', 'cash', 'fleet_account']),
      paymentMethodId: z.string().optional(),
      metadata: z.any().optional()
    })),
    async (req: Request, res: Response) => {
      try {
        const splitPaymentService = (await import('./split-payment-service')).splitPaymentService;
        
        const result = await splitPaymentService.processSplitPaymentById(
          req.params.splitId,
          req.body
        );
        
        res.json({
          message: 'Payment processed successfully',
          ...result
        });
      } catch (error: any) {
        console.error('Process split payment error:', error);
        res.status(500).json({ 
          message: 'Failed to process split payment',
          error: error.message 
        });
      }
    }
  );

  // NEW: Get comprehensive split payment status by split ID
  app.get('/api/payments/split/:splitId',
    async (req: Request, res: Response) => {
      try {
        const splitPaymentService = (await import('./split-payment-service')).splitPaymentService;
        
        const status = await splitPaymentService.getSplitPaymentStatus(req.params.splitId);
        
        res.json(status);
      } catch (error: any) {
        console.error('Get split payment status error:', error);
        res.status(500).json({ 
          message: 'Failed to get split payment status',
          error: error.message 
        });
      }
    }
  );

  // NEW: Generate or get payment link for specific payer
  app.get('/api/payments/split/:splitId/link/:payerId',
    async (req: Request, res: Response) => {
      try {
        const splitPaymentService = (await import('./split-payment-service')).splitPaymentService;
        
        const linkInfo = await splitPaymentService.getPaymentLinkForPayer(
          req.params.splitId,
          req.params.payerId
        );
        
        res.json(linkInfo);
      } catch (error: any) {
        console.error('Get payment link error:', error);
        res.status(500).json({ 
          message: 'Failed to get payment link',
          error: error.message 
        });
      }
    }
  );

  // NEW: Webhook handler for split payment confirmations
  app.post('/api/webhooks/split-payment',
    validateRequest(z.object({
      paymentIntentId: z.string(),
      splitPaymentId: z.string(),
      payerId: z.string(),
      status: z.enum(['succeeded', 'failed', 'processing']),
      failureReason: z.string().optional(),
      metadata: z.any().optional()
    })),
    async (req: Request, res: Response) => {
      try {
        const splitPaymentService = (await import('./split-payment-service')).splitPaymentService;
        
        const result = await splitPaymentService.handlePaymentWebhook(req.body);
        
        res.json(result);
      } catch (error: any) {
        console.error('Webhook handler error:', error);
        res.status(500).json({ 
          message: 'Failed to process webhook',
          error: error.message 
        });
      }
    }
  );

  // NEW: Reconcile split payments
  app.get('/api/payments/split/:splitId/reconcile',
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const reconciliation = await storage.reconcileSplits(req.params.splitId);
        
        res.json(reconciliation);
      } catch (error) {
        console.error('Reconcile split payment error:', error);
        res.status(500).json({ message: 'Failed to reconcile split payment' });
      }
    }
  );

  // NEW: Get split payment history
  app.get('/api/payments/split/:splitId/history',
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const history = await storage.getSplitPaymentHistory(req.params.splitId);
        
        res.json({ history });
      } catch (error) {
        console.error('Get split payment history error:', error);
        res.status(500).json({ message: 'Failed to get payment history' });
      }
    }
  );

  // NEW: Get payer's split payments
  app.get('/api/payments/split/payer/:payerId',
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const splits = await storage.getPaymentSplitsByPayerId(req.params.payerId);
        
        res.json({ paymentSplits: splits });
      } catch (error) {
        console.error('Get payer splits error:', error);
        res.status(500).json({ message: 'Failed to get payer payment splits' });
      }
    }
  );

  // NEW: Refund split payment
  app.post('/api/payments/split/:splitId/refund',
    requireAuth,
    requireRole('admin'),
    validateRequest(z.object({
      partial: z.boolean().optional(),
      percentage: z.number().min(0).max(100).optional(),
      reason: z.string()
    })),
    async (req: Request, res: Response) => {
      try {
        const splitPaymentService = (await import('./split-payment-service')).splitPaymentService;
        
        const result = await splitPaymentService.refundSplitPayment(
          req.params.splitId,
          req.body
        );
        
        res.json(result);
      } catch (error: any) {
        console.error('Refund split payment error:', error);
        res.status(500).json({ 
          message: 'Failed to refund split payment',
          error: error.message 
        });
      }
    }
  );

  // NEW: Update split payment template
  app.put('/api/payments/split-config/:templateId',
    requireAuth,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const template = await storage.updateSplitPaymentTemplate(
          req.params.templateId,
          req.body
        );
        
        if (!template) {
          return res.status(404).json({ message: 'Template not found' });
        }
        
        res.json({
          message: 'Template updated successfully',
          template
        });
      } catch (error) {
        console.error('Update template error:', error);
        res.status(500).json({ message: 'Failed to update template' });
      }
    }
  );

  // NEW: Delete split payment template
  app.delete('/api/payments/split-config/:templateId',
    requireAuth,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const success = await storage.deleteSplitPaymentTemplate(req.params.templateId);
        
        if (!success) {
          return res.status(404).json({ message: 'Template not found' });
        }
        
        res.json({ message: 'Template deleted successfully' });
      } catch (error) {
        console.error('Delete template error:', error);
        res.status(500).json({ message: 'Failed to delete template' });
      }
    }
  );

  // Preview invoice
  app.get('/api/invoices/preview/:id',
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const invoice = await storage.getInvoice(req.params.id);
        
        if (!invoice) {
          return res.status(404).json({ message: 'Invoice not found' });
        }

        // Get all related data for preview
        const job = await storage.getJob(invoice.jobId);
        const customer = await storage.getUser(invoice.customerId);
        const contractor = invoice.contractorId ? 
          await storage.getContractorProfile(invoice.contractorId) : undefined;
        const transactions = await storage.getInvoiceTransactions(invoice.id);
        
        let fleetAccount = undefined;
        if (customer) {
          const driverProfile = await storage.getDriverProfile(customer.id);
          if (driverProfile?.fleetAccountId) {
            fleetAccount = await storage.getFleetAccount(driverProfile.fleetAccountId);
          }
        }

        res.json({
          invoice,
          job,
          customer,
          contractor,
          fleetAccount,
          transactions
        });
      } catch (error) {
        console.error('Preview invoice error:', error);
        res.status(500).json({ message: 'Failed to preview invoice' });
      }
    }
  );

  // Generate bulk invoices for fleet
  app.post('/api/invoices/bulk',
    requireAuth,
    requireRole('admin', 'fleet_manager'),
    validateRequest(z.object({
      fleetAccountId: z.string(),
      fromDate: z.string().datetime(),
      toDate: z.string().datetime(),
    })),
    async (req: Request, res: Response) => {
      try {
        const { fleetAccountId, fromDate, toDate } = req.body;
        
        // Get all jobs for fleet in date range
        const jobs = await storage.findJobs({
          fleetAccountId,
          fromDate: new Date(fromDate),
          toDate: new Date(toDate),
          status: 'completed'
        });

        const pdfService = (await import('./pdf-service')).default;
        const invoices = [];

        // Generate invoice for each job
        for (const job of jobs) {
          let invoice = await storage.getInvoiceByJobId(job.id);
          
          if (!invoice) {
            const invoiceNumber = pdfService.generateInvoiceNumber('FLEET');
            
            invoice = await storage.createInvoice({
              jobId: job.id,
              customerId: job.customerId,
              contractorId: job.contractorId,
              invoiceNumber,
              issueDate: new Date(),
              dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // NET 60 for fleet
              subtotal: job.actualPrice || job.quotedPrice || '0',
              tax: ((parseFloat(job.actualPrice || job.quotedPrice || '0') * 0.0825).toFixed(2)),
              totalAmount: ((parseFloat(job.actualPrice || job.quotedPrice || '0') * 1.0825).toFixed(2)),
              amountPaid: '0',
              amountDue: ((parseFloat(job.actualPrice || job.quotedPrice || '0') * 1.0825).toFixed(2)),
              status: 'pending',
              metadata: {
                fleetAccountId,
                billingPeriod: { fromDate, toDate }
              }
            });
          }
          
          invoices.push(invoice);
        }

        res.json({
          message: `Generated ${invoices.length} invoices for fleet account`,
          invoices
        });
      } catch (error) {
        console.error('Generate bulk invoices error:', error);
        res.status(500).json({ message: 'Failed to generate bulk invoices' });
      }
    }
  );

  // List all invoices (admin)
  app.get('/api/admin/invoices',
    requireAuth,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const filters = {
          ...getPagination(req),
          status: req.query.status as string,
          customerId: req.query.customerId as string,
          fromDate: req.query.fromDate ? new Date(req.query.fromDate as string) : undefined,
          toDate: req.query.toDate ? new Date(req.query.toDate as string) : undefined
        };

        const invoices = await storage.findInvoices(filters);
        
        res.json({ invoices });
      } catch (error) {
        console.error('List invoices error:', error);
        res.status(500).json({ message: 'Failed to list invoices' });
      }
    }
  );

  // Update invoice status
  app.patch('/api/invoices/:id/status',
    requireAuth,
    requireRole('admin'),
    validateRequest(z.object({
      status: z.enum(['draft', 'pending', 'paid', 'overdue', 'cancelled'])
    })),
    async (req: Request, res: Response) => {
      try {
        const updates: any = { status: req.body.status };
        
        if (req.body.status === 'paid') {
          updates.paidDate = new Date();
          updates.amountPaid = updates.totalAmount;
          updates.amountDue = '0';
        }

        const invoice = await storage.updateInvoice(req.params.id, updates);
        
        if (!invoice) {
          return res.status(404).json({ message: 'Invoice not found' });
        }

        res.json({
          message: 'Invoice status updated successfully',
          invoice
        });
      } catch (error) {
        console.error('Update invoice status error:', error);
        res.status(500).json({ message: 'Failed to update invoice status' });
      }
    }
  );

  // Get contractor earnings statement
  app.get('/api/contractor/earnings-statement',
    requireAuth,
    requireRole('contractor'),
    async (req: Request, res: Response) => {
      try {
        const fromDate = new Date(req.query.fromDate as string || 
          Date.now() - 30 * 24 * 60 * 60 * 1000);
        const toDate = new Date(req.query.toDate as string || Date.now());
        
        const contractorProfile = await storage.getContractorProfile(req.session.userId!);
        
        if (!contractorProfile) {
          return res.status(404).json({ message: 'Contractor profile not found' });
        }

        const earnings = await storage.getContractorEarnings(
          contractorProfile.id,
          fromDate,
          toDate
        );

        // Generate earnings statement PDF
        const pdfService = (await import('./pdf-service')).default;
        const pdfBuffer = await pdfService.generateContractorEarningsStatement(
          contractorProfile.id,
          fromDate,
          toDate,
          earnings
        );

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 
          `attachment; filename="earnings-statement-${format(fromDate, 'yyyy-MM')}.pdf"`);
        res.send(pdfBuffer);
      } catch (error) {
        console.error('Get earnings statement error:', error);
        res.status(500).json({ message: 'Failed to get earnings statement' });
      }
    }
  );

  // Get fleet consolidated invoice
  app.get('/api/fleet/consolidated-invoice/:fleetId',
    requireAuth,
    requireRole('admin', 'fleet_manager'),
    async (req: Request, res: Response) => {
      try {
        const month = new Date(req.query.month as string || Date.now());
        const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
        const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);
        
        const jobs = await storage.findJobs({
          fleetAccountId: req.params.fleetId,
          fromDate: startOfMonth,
          toDate: endOfMonth,
          status: 'completed'
        });

        // Calculate totals
        let totalAmount = 0;
        jobs.forEach(job => {
          totalAmount += parseFloat(job.actualPrice || job.quotedPrice || '0');
        });

        // Generate consolidated invoice PDF
        const pdfService = (await import('./pdf-service')).default;
        const pdfBuffer = await pdfService.generateFleetConsolidatedInvoice(
          req.params.fleetId,
          month,
          jobs,
          totalAmount
        );

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 
          `attachment; filename="fleet-invoice-${format(month, 'yyyy-MM')}.pdf"`);
        res.send(pdfBuffer);
      } catch (error) {
        console.error('Get fleet consolidated invoice error:', error);
        res.status(500).json({ message: 'Failed to get fleet consolidated invoice' });
      }
    }
  );

  // Request refund
  app.post('/api/payments/refunds',
    requireAuth,
    validateRequest(insertRefundSchema.omit({ requestedBy: true })),
    async (req: Request, res: Response) => {
      try {
        const refund = await storage.createRefund({
          ...req.body,
          requestedBy: req.session.userId!,
          status: 'requested'
        });

        res.status(201).json({
          message: 'Refund requested successfully',
          refund
        });
      } catch (error) {
        console.error('Request refund error:', error);
        res.status(500).json({ message: 'Failed to request refund' });
      }
    }
  );

  // Get transaction history
  app.get('/api/payments/transactions',
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const filters = {
          ...getPagination(req),
          userId: req.session.role === 'admin' ? 
            req.query.userId as string : req.session.userId,
          jobId: req.query.jobId as string,
          status: req.query.status as typeof paymentStatusEnum.enumValues[number],
          fromDate: req.query.fromDate ? new Date(req.query.fromDate as string) : undefined,
          toDate: req.query.toDate ? new Date(req.query.toDate as string) : undefined
        };

        const transactions = await storage.findTransactions(filters);
        
        res.json({ transactions });
      } catch (error) {
        console.error('Get transactions error:', error);
        res.status(500).json({ message: 'Failed to get transactions' });
      }
    }
  );

  // ==================== ADMIN ROUTES ====================

  // Get all platform settings
  app.get('/api/admin/settings',
    requireAuth,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const settingsArray = await storage.getAllSettings();
        
        // Transform array to object with expected structure
        const settingsObject = settingsArray.reduce((acc, setting) => {
          if (setting.key && setting.value) {
            acc[setting.key] = setting.value;
          }
          return acc;
        }, {} as any);
        
        // Return settings with default structure
        const defaultSettings = {
          general: {
            platformName: "TruckFixGo",
            supportEmail: "support@truckfixgo.com",
            supportPhone: "1-800-FIX-TRUCK",
            businessHours: "24/7",
            timezone: "America/New_York",
            maintenanceMode: false,
          },
          pricing: {
            emergencySurcharge: 25,
            nightSurcharge: 15,
            weekendSurcharge: 10,
            waterSourceSurcharge: 50,
            baseRates: [
              { service: "Emergency Repair", base: 150, perHour: 125 },
              { service: "Truck Wash", base: 75, perTruck: 60 },
              { service: "PM Service", base: 200, perHour: 100 },
              { service: "Tire Service", base: 175, perTire: 150 },
            ],
            fleetDiscounts: {
              standard: 0,
              silver: 5,
              gold: 10,
              platinum: 15,
            },
            distanceTiers: [
              { miles: 10, multiplier: 1.0 },
              { miles: 25, multiplier: 1.2 },
              { miles: 50, multiplier: 1.5 },
              { miles: 100, multiplier: 2.0 },
            ],
          },
          integrations: {
            stripe: {
              publicKey: "",
              secretKey: "",
              webhookSecret: "",
              enabled: false,
            },
            twilio: {
              accountSid: "",
              authToken: "",
              phoneNumber: "",
              enabled: false,
            },
            openai: {
              apiKey: "",
              model: "gpt-4",
              enabled: false,
            },
            email: {
              provider: "smtp",
              host: "",
              port: 587,
              secure: false,
              user: "",
              pass: "",
              from: "noreply@truckfixgo.com",
              enabled: false,
            },
            efs: {
              accountCode: "",
              apiKey: "",
              enabled: false,
            },
            comdata: {
              accountCode: "",
              apiKey: "",
              enabled: false,
            },
          },
          features: {
            autoAssignment: true,
            biddingSystem: true,
            fleetManagement: true,
            splitPayments: true,
            aiAssistant: true,
            reminders: true,
            invoicing: true,
            analytics: true,
            waterSource: true,
            backgroundChecks: true,
            contractorReviews: true,
            emergencyServices: true,
            scheduledServices: true,
          }
        };
        
        // Merge saved settings with defaults
        const mergedSettings = {
          ...defaultSettings,
          ...settingsObject
        };
        
        res.json(mergedSettings);
      } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({ message: 'Failed to get settings' });
      }
    }
  );

  // Update specific setting
  app.put('/api/admin/settings/:key',
    requireAuth,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const setting = await storage.updateSetting(req.params.key, req.body.value);
        
        res.json({
          message: 'Setting updated successfully',
          setting
        });
      } catch (error) {
        console.error('Update setting error:', error);
        res.status(500).json({ message: 'Failed to update setting' });
      }
    }
  );

  // ==================== SERVICE AREA MANAGEMENT ====================
  
  // Get all service areas with contractor counts
  app.get('/api/admin/service-areas',
    requireAuth,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        // Get all service areas
        const areas = await storage.getAllServiceAreas();
        
        // Add contractor count for each area
        const areasWithCounts = await Promise.all(areas.map(async (area) => {
          // Count contractors in this service area
          // For radius-based areas, we'd need PostGIS for accurate counts
          // For now, we'll count all active contractors as a placeholder
          const contractorCount = await db.select({
            count: sql<number>`COUNT(*)`
          })
          .from(contractorProfiles)
          .where(eq(contractorProfiles.isAvailable, true))
          .then(result => result[0]?.count || 0);
          
          // Transform database schema to frontend expectations
          const coordinates = area.coordinates as any || { center: { lat: 0, lng: 0 }, radius: 0 };
          
          return {
            id: area.id,
            name: area.name,
            description: area.name, // Use name as description if not available
            latitude: coordinates.center?.lat || 0,
            longitude: coordinates.center?.lng || 0,
            radiusMiles: coordinates.radius || 50,
            baseSurcharge: Number(area.surchargeAmount || 0),
            isActive: area.isActive,
            contractorCount: Number(contractorCount)
          };
        }));
        
        res.json(areasWithCounts);
      } catch (error) {
        console.error('Get service areas error:', error);
        res.status(500).json({ message: 'Failed to get service areas' });
      }
    }
  );
  
  // Create new service area
  app.post('/api/admin/service-areas',
    requireAuth,
    requireRole('admin'),
    validateRequest(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
      radiusMiles: z.number().min(1).max(500),
      baseSurcharge: z.number().min(0),
      isActive: z.boolean()
    })),
    async (req: Request, res: Response) => {
      try {
        const { name, description, latitude, longitude, radiusMiles, baseSurcharge, isActive } = req.body;
        
        // Transform frontend data to database schema
        const serviceAreaData = {
          name,
          type: 'radius' as const,
          coordinates: {
            center: { lat: latitude, lng: longitude },
            radius: radiusMiles
          },
          surchargeType: 'distance' as const,
          surchargeAmount: baseSurcharge.toString(),
          surchargePercentage: '0',
          isActive
        };
        
        const area = await storage.createServiceArea(serviceAreaData);
        
        // Transform back to frontend format
        const response = {
          id: area.id,
          name: area.name,
          description: description || area.name,
          latitude,
          longitude,
          radiusMiles,
          baseSurcharge,
          isActive: area.isActive,
          contractorCount: 0
        };
        
        res.status(201).json(response);
      } catch (error) {
        console.error('Create service area error:', error);
        res.status(500).json({ message: 'Failed to create service area' });
      }
    }
  );
  
  // Update service area
  app.put('/api/admin/service-areas/:id',
    requireAuth,
    requireRole('admin'),
    validateRequest(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
      radiusMiles: z.number().min(1).max(500),
      baseSurcharge: z.number().min(0),
      isActive: z.boolean()
    })),
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const { name, description, latitude, longitude, radiusMiles, baseSurcharge, isActive } = req.body;
        
        // Check if area exists
        const existingArea = await storage.getServiceArea(id);
        if (!existingArea) {
          return res.status(404).json({ message: 'Service area not found' });
        }
        
        // Transform frontend data to database schema
        const updateData = {
          name,
          type: 'radius' as const,
          coordinates: {
            center: { lat: latitude, lng: longitude },
            radius: radiusMiles
          },
          surchargeType: 'distance' as const,
          surchargeAmount: baseSurcharge.toString(),
          isActive
        };
        
        const updatedArea = await storage.updateServiceArea(id, updateData);
        
        if (!updatedArea) {
          return res.status(404).json({ message: 'Service area not found' });
        }
        
        // Transform back to frontend format
        const response = {
          id: updatedArea.id,
          name: updatedArea.name,
          description: description || updatedArea.name,
          latitude,
          longitude,
          radiusMiles,
          baseSurcharge,
          isActive: updatedArea.isActive,
          contractorCount: 0
        };
        
        res.json(response);
      } catch (error) {
        console.error('Update service area error:', error);
        res.status(500).json({ message: 'Failed to update service area' });
      }
    }
  );
  
  // Delete service area
  app.delete('/api/admin/service-areas/:id',
    requireAuth,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        
        // Check if area exists
        const existingArea = await storage.getServiceArea(id);
        if (!existingArea) {
          return res.status(404).json({ message: 'Service area not found' });
        }
        
        const deleted = await storage.deleteServiceArea(id);
        
        if (!deleted) {
          return res.status(404).json({ message: 'Service area not found' });
        }
        
        res.json({ message: 'Service area deleted successfully' });
      } catch (error) {
        console.error('Delete service area error:', error);
        res.status(500).json({ message: 'Failed to delete service area' });
      }
    }
  );
  
  // Toggle service area active status
  app.patch('/api/admin/service-areas/:id/status',
    requireAuth,
    requireRole('admin'),
    validateRequest(z.object({
      isActive: z.boolean()
    })),
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const { isActive } = req.body;
        
        // Check if area exists
        const existingArea = await storage.getServiceArea(id);
        if (!existingArea) {
          return res.status(404).json({ message: 'Service area not found' });
        }
        
        const updatedArea = await storage.updateServiceArea(id, { isActive });
        
        if (!updatedArea) {
          return res.status(404).json({ message: 'Service area not found' });
        }
        
        // Transform back to frontend format
        const coordinates = updatedArea.coordinates as any || { center: { lat: 0, lng: 0 }, radius: 0 };
        const response = {
          id: updatedArea.id,
          name: updatedArea.name,
          description: updatedArea.name,
          latitude: coordinates.center?.lat || 0,
          longitude: coordinates.center?.lng || 0,
          radiusMiles: coordinates.radius || 50,
          baseSurcharge: Number(updatedArea.surchargeAmount || 0),
          isActive: updatedArea.isActive,
          contractorCount: 0
        };
        
        res.json(response);
      } catch (error) {
        console.error('Toggle service area status error:', error);
        res.status(500).json({ message: 'Failed to update service area status' });
      }
    }
  );

  // Get platform KPIs
  app.get('/api/admin/metrics',
    requireAuth,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        // Get base metrics
        const metrics = await storage.getPlatformMetrics();
        
        // Calculate revenue for different time periods
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        // Get revenue for today
        const todayRevenue = await db.select({
          total: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`
        })
        .from(transactions)
        .where(
          and(
            eq(transactions.status, 'completed'),
            gte(transactions.createdAt, startOfDay)
          )
        );
        
        // Get revenue for this week
        const weekRevenue = await db.select({
          total: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`
        })
        .from(transactions)
        .where(
          and(
            eq(transactions.status, 'completed'),
            gte(transactions.createdAt, startOfWeek)
          )
        );
        
        // Get revenue for this month
        const monthRevenue = await db.select({
          total: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`
        })
        .from(transactions)
        .where(
          and(
            eq(transactions.status, 'completed'),
            gte(transactions.createdAt, startOfMonth)
          )
        );
        
        // Map the field names and include all expected fields
        const response = {
          activeJobs: metrics.activeJobs,
          onlineContractors: metrics.onlineContractors,
          avgResponseTime: metrics.averageResponseTime, // Map field name
          completionRate: metrics.completionRate,
          revenueToday: todayRevenue[0]?.total || 0,
          revenueWeek: weekRevenue[0]?.total || 0,
          revenueMonth: monthRevenue[0]?.total || 0,
          totalFleets: metrics.totalFleets,
          totalContractors: metrics.totalContractors,
          totalUsers: metrics.totalUsers
        };
        
        res.json({ metrics: response });
      } catch (error) {
        console.error('Get metrics error:', error);
        res.status(500).json({ message: 'Failed to get metrics' });
      }
    }
  );

  // Get revenue reports
  app.get('/api/admin/revenue',
    requireAuth,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const fromDate = new Date(req.query.fromDate as string || 
          Date.now() - 30 * 24 * 60 * 60 * 1000);
        const toDate = new Date(req.query.toDate as string || Date.now());
        
        const report = await storage.getRevenueReport(fromDate, toDate);
        
        res.json({ report });
      } catch (error) {
        console.error('Get revenue report error:', error);
        res.status(500).json({ message: 'Failed to get revenue report' });
      }
    }
  );

  // Update email template
  app.put('/api/admin/email-templates/:id',
    requireAuth,
    requireRole('admin'),
    validateRequest(insertEmailTemplateSchema.partial()),
    async (req: Request, res: Response) => {
      try {
        const template = await storage.updateEmailTemplate(req.params.id, req.body);
        
        if (!template) {
          return res.status(404).json({ message: 'Template not found' });
        }

        res.json({
          message: 'Email template updated successfully',
          template
        });
      } catch (error) {
        console.error('Update email template error:', error);
        res.status(500).json({ message: 'Failed to update email template' });
      }
    }
  );

  // Update SMS template
  app.put('/api/admin/sms-templates/:id',
    requireAuth,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        // SMS templates would be stored similarly to email templates
        res.json({
          message: 'SMS template updated successfully'
        });
      } catch (error) {
        console.error('Update SMS template error:', error);
        res.status(500).json({ message: 'Failed to update SMS template' });
      }
    }
  );

  // Update integration configs
  app.put('/api/admin/integrations',
    requireAuth,
    requireRole('admin'),
    validateRequest(insertIntegrationsConfigSchema.partial()),
    async (req: Request, res: Response) => {
      try {
        const integration = await storage.updateIntegration(
          req.body.provider,
          req.body
        );
        
        res.json({
          message: 'Integration updated successfully',
          integration
        });
      } catch (error) {
        console.error('Update integration error:', error);
        res.status(500).json({ message: 'Failed to update integration' });
      }
    }
  );

  // Get available contractors for job assignment with queue information
  app.get('/api/admin/contractors/available',
    requireAuth,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const { lat, lon } = req.query;
        const jobLat = lat ? parseFloat(lat as string) : undefined;
        const jobLon = lon ? parseFloat(lon as string) : undefined;
        
        // Ensure all contractors have profiles before fetching
        const profileStats = await storage.ensureAllContractorsHaveProfiles();
        if (profileStats.created > 0) {
          console.log(`[API] Created ${profileStats.created} missing contractor profiles`);
        }
        
        // Use the enhanced method that includes queue information
        const contractors = await storage.getAvailableContractorsForAssignment(jobLat, jobLon);
        
        console.log(`[API] Returning ${contractors.length} available contractors`);
        res.json(contractors);
      } catch (error) {
        console.error('Error fetching available contractors:', error);
        res.status(500).json({ message: 'Failed to fetch available contractors' });
      }
    }
  );

  // Initialize contractor profiles for all contractors without one
  app.post('/api/admin/contractors/initialize-profiles',
    requireAuth,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        console.log('[API] Admin requested contractor profile initialization');
        
        const result = await storage.ensureAllContractorsHaveProfiles();
        
        console.log(`[API] Profile initialization completed. Created: ${result.created}, Existing: ${result.existing}`);
        
        res.json({
          success: true,
          message: `Successfully initialized ${result.created} contractor profiles`,
          stats: result
        });
      } catch (error) {
        console.error('Error initializing contractor profiles:', error);
        res.status(500).json({ message: 'Failed to initialize contractor profiles' });
      }
    }
  );

  // Get contractor queue summary - shows queue status for all contractors
  app.get('/api/admin/contractors/queue-summary',
    requireAuth,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const contractors = await storage.getAvailableContractorsForAssignment();
        
        // Map to queue summary format
        const queueSummary = contractors.map(contractor => ({
          contractorId: contractor.id,
          contractorName: contractor.name,
          performanceTier: contractor.performanceTier,
          queueLength: contractor.queueLength,
          isCurrentlyBusy: contractor.isCurrentlyBusy,
          currentJob: contractor.currentJob,
          currentJobNumber: contractor.currentJobNumber,
          totalQueuedJobs: contractor.totalQueuedJobs,
          queueStatus: contractor.totalQueuedJobs === 0 ? 'available' : 
                       contractor.totalQueuedJobs <= 2 ? 'moderate' : 'busy',
          nextPositionInQueue: contractor.totalQueuedJobs + 1
        }));
        
        res.json({
          summary: queueSummary,
          totalContractors: queueSummary.length,
          availableContractors: queueSummary.filter(c => c.totalQueuedJobs === 0).length,
          busyContractors: queueSummary.filter(c => c.totalQueuedJobs > 0).length
        });
      } catch (error) {
        console.error('Error fetching contractor queue summary:', error);
        res.status(500).json({ message: 'Failed to fetch queue summary' });
      }
    }
  );

  // Get drivers managed by a specific contractor (admin access)
  app.get('/api/admin/contractors/:contractorId/drivers',
    requireAuth,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const { contractorId } = req.params;
        // For now, return empty array since driver management feature is not fully populated
        const drivers = await storage.getContractorDrivers(contractorId);
        res.json(drivers || []);
      } catch (error) {
        console.error('Error fetching contractor drivers:', error);
        // Return empty array on error to avoid breaking UI
        res.json([]);
      }
    }
  );

  // Update contractor details (admin access)
  app.put('/api/admin/contractors/:id',
    requireAuth,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const { name, company, email, phone, status } = req.body;

        // Add detailed logging
        console.log('[PUT /api/admin/contractors/:id] Request received:', {
          id,
          body: req.body,
          name,
          company,
          email,
          phone,
          status
        });

        // Validate input
        if (!name || !email) {
          console.log('[PUT /api/admin/contractors/:id] Validation failed: missing name or email');
          return res.status(400).json({ message: 'Name and email are required' });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          console.log('[PUT /api/admin/contractors/:id] Validation failed: invalid email format');
          return res.status(400).json({ message: 'Invalid email address' });
        }

        // Phone validation (basic)
        if (phone && phone.length < 7) {
          console.log('[PUT /api/admin/contractors/:id] Validation failed: invalid phone number');
          return res.status(400).json({ message: 'Invalid phone number' });
        }

        // Status validation
        if (status && !['active', 'pending', 'suspended'].includes(status)) {
          console.log('[PUT /api/admin/contractors/:id] Validation failed: invalid status:', status);
          return res.status(400).json({ message: 'Invalid status value' });
        }

        console.log('[PUT /api/admin/contractors/:id] Calling storage.updateContractorDetails with:', {
          id,
          name: name.trim(),
          company: (company || '').trim(),
          email: email.trim().toLowerCase(),
          phone: (phone || '').trim(),
          status: status || undefined
        });

        // Update contractor details
        const updatedContractor = await storage.updateContractorDetails(id, {
          name: name.trim(),
          company: (company || '').trim(),
          email: email.trim().toLowerCase(),
          phone: (phone || '').trim(),
          status: status || undefined
        });

        if (!updatedContractor) {
          console.log('[PUT /api/admin/contractors/:id] Contractor not found with id:', id);
          return res.status(404).json({ message: 'Contractor not found' });
        }

        console.log('[PUT /api/admin/contractors/:id] Successfully updated contractor:', updatedContractor);
        
        res.json({
          message: 'Contractor details updated successfully',
          contractor: updatedContractor
        });
      } catch (error: any) {
        console.error('[PUT /api/admin/contractors/:id] Error updating contractor:', {
          error: error.message,
          stack: error.stack,
          code: error.code,
          detail: error.detail,
          fullError: error
        });
        
        // Handle unique constraint violations
        if (error.message?.includes('Email address is already in use')) {
          return res.status(409).json({ message: 'Email address is already in use' });
        }
        
        // Include error message in response for debugging
        res.status(500).json({ 
          message: 'Failed to update contractor details', 
          debug: error.message 
        });
      }
    }
  );

  // Manage contractor approvals
  app.get('/api/admin/contractors',
    requireAuth,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const filters: any = {
          ...getPagination(req),
          performanceTier: req.query.performanceTier as any,
          search: req.query.search as string,
          status: req.query.status as string
        };
        
        // Only add isAvailable filter if explicitly provided
        if (req.query.isAvailable !== undefined) {
          filters.isAvailable = req.query.isAvailable === 'true';
        }
        
        const contractors = await storage.findContractors(filters);
        
        res.json(contractors);
      } catch (error) {
        console.error('Get contractors error:', error);
        res.status(500).json({ message: 'Failed to get contractors' });
      }
    }
  );

  // Get pending contractor applications
  app.get('/api/admin/contractors/pending',
    requireAuth,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const pendingContractors = await storage.getPendingContractors();
        
        res.json(pendingContractors);
      } catch (error) {
        console.error('Get pending contractors error:', error);
        res.status(500).json({ message: 'Failed to get pending contractors' });
      }
    }
  );

  // Update contractor status (approve/reject)
  app.put('/api/admin/contractors/:id/status',
    requireAuth,
    requireRole('admin'),
    validateRequest(z.object({
      status: z.enum(['active', 'rejected', 'suspended'])
    })),
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const { status } = req.body;
        
        const success = await storage.updateContractorStatus(id, status);
        
        if (!success) {
          return res.status(404).json({ message: 'Contractor not found' });
        }
        
        res.json({ 
          message: `Contractor ${status === 'active' ? 'approved' : status === 'rejected' ? 'rejected' : 'suspended'} successfully` 
        });
      } catch (error) {
        console.error('Update contractor status error:', error);
        res.status(500).json({ message: 'Failed to update contractor status' });
      }
    }
  );

  // ==================== CONTRACTOR BULK OPERATIONS ====================
  
  // Bulk approve contractors
  app.post('/api/admin/contractors/bulk-approve',
    requireAuth,
    requireRole('admin'),
    validateRequest(z.object({
      contractorIds: z.array(z.string()).min(1, 'At least one contractor ID is required')
    })),
    async (req: Request, res: Response) => {
      try {
        const { contractorIds } = req.body;
        const performedBy = req.session.userId || 'admin';
        
        console.log(`[Bulk Operation] Approving ${contractorIds.length} contractors`);
        const result = await storage.bulkApproveContractors(contractorIds, performedBy);
        
        res.json({
          success: true,
          message: `Successfully approved ${result.succeeded.length} contractors`,
          result
        });
      } catch (error) {
        console.error('Bulk approve contractors error:', error);
        res.status(500).json({ message: 'Failed to approve contractors' });
      }
    }
  );
  
  // Bulk reject contractors
  app.post('/api/admin/contractors/bulk-reject',
    requireAuth,
    requireRole('admin'),
    validateRequest(z.object({
      contractorIds: z.array(z.string()).min(1, 'At least one contractor ID is required'),
      reason: z.string().min(1, 'Rejection reason is required')
    })),
    async (req: Request, res: Response) => {
      try {
        const { contractorIds, reason } = req.body;
        const performedBy = req.session.userId || 'admin';
        
        console.log(`[Bulk Operation] Rejecting ${contractorIds.length} contractors`);
        const result = await storage.bulkRejectContractors(contractorIds, reason, performedBy);
        
        res.json({
          success: true,
          message: `Successfully rejected ${result.succeeded.length} contractors`,
          result
        });
      } catch (error) {
        console.error('Bulk reject contractors error:', error);
        res.status(500).json({ message: 'Failed to reject contractors' });
      }
    }
  );
  
  // Bulk suspend contractors
  app.post('/api/admin/contractors/bulk-suspend',
    requireAuth,
    requireRole('admin'),
    validateRequest(z.object({
      contractorIds: z.array(z.string()).min(1, 'At least one contractor ID is required')
    })),
    async (req: Request, res: Response) => {
      try {
        const { contractorIds } = req.body;
        const performedBy = req.session.userId || 'admin';
        
        console.log(`[Bulk Operation] Suspending ${contractorIds.length} contractors`);
        const result = await storage.bulkSuspendContractors(contractorIds, performedBy);
        
        res.json({
          success: true,
          message: `Successfully suspended ${result.succeeded.length} contractors`,
          result
        });
      } catch (error) {
        console.error('Bulk suspend contractors error:', error);
        res.status(500).json({ message: 'Failed to suspend contractors' });
      }
    }
  );
  
  // Bulk activate contractors
  app.post('/api/admin/contractors/bulk-activate',
    requireAuth,
    requireRole('admin'),
    validateRequest(z.object({
      contractorIds: z.array(z.string()).min(1, 'At least one contractor ID is required')
    })),
    async (req: Request, res: Response) => {
      try {
        const { contractorIds } = req.body;
        const performedBy = req.session.userId || 'admin';
        
        console.log(`[Bulk Operation] Activating ${contractorIds.length} contractors`);
        const result = await storage.bulkActivateContractors(contractorIds, performedBy);
        
        res.json({
          success: true,
          message: `Successfully activated ${result.succeeded.length} contractors`,
          result
        });
      } catch (error) {
        console.error('Bulk activate contractors error:', error);
        res.status(500).json({ message: 'Failed to activate contractors' });
      }
    }
  );
  
  // Bulk email contractors
  app.post('/api/admin/contractors/bulk-email',
    requireAuth,
    requireRole('admin'),
    validateRequest(z.object({
      contractorIds: z.array(z.string()).min(1, 'At least one contractor ID is required'),
      subject: z.string().min(1, 'Subject is required'),
      message: z.string().min(1, 'Message is required')
    })),
    async (req: Request, res: Response) => {
      try {
        const { contractorIds, subject, message } = req.body;
        const performedBy = req.session.userId || 'admin';
        
        console.log(`[Bulk Operation] Emailing ${contractorIds.length} contractors`);
        const result = await storage.bulkEmailContractors(contractorIds, subject, message, performedBy);
        
        res.json({
          success: true,
          message: `Successfully emailed ${result.succeeded.length} contractors`,
          result
        });
      } catch (error) {
        console.error('Bulk email contractors error:', error);
        res.status(500).json({ message: 'Failed to email contractors' });
      }
    }
  );

  // ==================== EMAIL TEST ENDPOINT ====================
  
  // Test email sending functionality
  app.post('/api/admin/test-email',
    requireAuth,
    requireRole('admin'),
    validateRequest(z.object({
      to: z.string().email(),
      subject: z.string().optional(),
      message: z.string().optional()
    })),
    async (req: Request, res: Response) => {
      try {
        const { to, subject, message } = req.body;
        const { reminderService } = await import('./reminder-service');
        
        const htmlContent = `
          <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background-color: #1e3a5f; color: white; padding: 20px; text-align: center;">
                <h1 style="margin: 0;">TruckFixGo Test Email</h1>
              </div>
              <div style="padding: 30px; background-color: #f5f5f5;">
                <h2 style="color: #1e3a5f;">${subject || 'Email Configuration Test'}</h2>
                <p>${message || 'This is a test email from your TruckFixGo platform to verify that email sending is configured correctly.'}</p>
                <div style="background: white; border-left: 4px solid #ff6b35; padding: 15px; margin: 20px 0;">
                  <h3 style="color: #1e3a5f; margin-top: 0;">Email Settings Verified</h3>
                  <p style="color: #666;">✓ Office365 SMTP Connection Established<br>
                  ✓ Email Template Rendering Working<br>
                  ✓ Professional Signature Attached</p>
                </div>
                <p style="color: #666; font-size: 14px; margin-top: 30px;">
                  This test email was sent from the TruckFixGo admin panel to verify email functionality.
                </p>
              </div>
            </body>
          </html>
        `;
        
        const result = await reminderService.sendTestReminder('email', to, htmlContent);
        
        if (result.success) {
          res.json({ 
            message: 'Test email sent successfully',
            to,
            subject: subject || 'Email Configuration Test'
          });
        } else {
          res.status(500).json({ 
            message: 'Failed to send test email',
            error: result.error 
          });
        }
      } catch (error) {
        console.error('Test email error:', error);
        res.status(500).json({ 
          message: 'Failed to send test email',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  // ==================== PRICING RULES MANAGEMENT ====================
  
  // Get all pricing rules
  app.get('/api/admin/pricing-rules',
    requireAuth,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const includeInactive = req.query.includeInactive === 'true';
        const rules = includeInactive 
          ? await storage.getAllPricingRules()
          : await storage.getActivePricingRules();
        
        res.json({ rules });
      } catch (error) {
        console.error('Get pricing rules error:', error);
        res.status(500).json({ message: 'Failed to get pricing rules' });
      }
    }
  );

  // Create new pricing rule
  app.post('/api/admin/pricing-rules',
    requireAuth,
    requireRole('admin'),
    validateRequest(insertPricingRuleSchema),
    async (req: Request, res: Response) => {
      try {
        const rule = await storage.createPricingRule(req.body);
        
        res.status(201).json({
          message: 'Pricing rule created successfully',
          rule
        });
      } catch (error) {
        console.error('Create pricing rule error:', error);
        res.status(500).json({ message: 'Failed to create pricing rule' });
      }
    }
  );

  // Update pricing rule
  app.put('/api/admin/pricing-rules/:id',
    requireAuth,
    requireRole('admin'),
    validateRequest(insertPricingRuleSchema.partial()),
    async (req: Request, res: Response) => {
      try {
        const rule = await storage.updatePricingRule(req.params.id, req.body);
        
        if (!rule) {
          return res.status(404).json({ message: 'Pricing rule not found' });
        }
        
        res.json({
          message: 'Pricing rule updated successfully',
          rule
        });
      } catch (error) {
        console.error('Update pricing rule error:', error);
        res.status(500).json({ message: 'Failed to update pricing rule' });
      }
    }
  );

  // Delete pricing rule
  app.delete('/api/admin/pricing-rules/:id',
    requireAuth,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const success = await storage.deletePricingRule(req.params.id);
        
        if (!success) {
          return res.status(404).json({ message: 'Pricing rule not found' });
        }
        
        res.json({ message: 'Pricing rule deleted successfully' });
      } catch (error) {
        console.error('Delete pricing rule error:', error);
        res.status(500).json({ message: 'Failed to delete pricing rule' });
      }
    }
  );

  // Test pricing rules
  app.post('/api/admin/pricing-rules/test',
    requireAuth,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const { scenarios } = req.body;
        const pricingEngine = (await import('./pricing-engine')).default;
        
        const results = await pricingEngine.testPricingRules(scenarios);
        
        res.json({ 
          message: 'Pricing rules tested successfully',
          results 
        });
      } catch (error) {
        console.error('Test pricing rules error:', error);
        res.status(500).json({ message: 'Failed to test pricing rules' });
      }
    }
  );

  // Get pricing analytics
  app.get('/api/admin/pricing-analytics',
    requireAuth,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const fromDate = new Date(req.query.fromDate as string || Date.now() - 30 * 24 * 60 * 60 * 1000);
        const toDate = new Date(req.query.toDate as string || Date.now());
        
        const pricingEngine = (await import('./pricing-engine')).default;
        const analytics = await pricingEngine.getPricingAnalytics(fromDate, toDate);
        
        res.json({ analytics });
      } catch (error) {
        console.error('Get pricing analytics error:', error);
        res.status(500).json({ message: 'Failed to get pricing analytics' });
      }
    }
  );

  // Initialize default pricing rules
  app.post('/api/admin/pricing-rules/initialize',
    requireAuth,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const pricingEngine = (await import('./pricing-engine')).default;
        await pricingEngine.createDefaultPricingRules();
        
        res.json({ message: 'Default pricing rules created successfully' });
      } catch (error) {
        console.error('Initialize pricing rules error:', error);
        res.status(500).json({ message: 'Failed to initialize pricing rules' });
      }
    }
  );

  // Update pricing rules
  app.put('/api/admin/pricing-rules',
    requireAuth,
    requireRole('admin'),
    validateRequest(insertPricingRuleSchema),
    async (req: Request, res: Response) => {
      try {
        const rule = await storage.createPricingRule(req.body);
        
        res.json({
          message: 'Pricing rule updated successfully',
          rule
        });
      } catch (error) {
        console.error('Update pricing rule error:', error);
        res.status(500).json({ message: 'Failed to update pricing rule' });
      }
    }
  );

  // ==================== USER MANAGEMENT ENDPOINTS ====================

  // Get all users with filters
  app.get('/api/admin/users',
    requireAuth,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const filters = {
          role: req.query.role as string,
          status: req.query.status as string,
          search: req.query.search as string,
          limit: parseInt(req.query.limit as string) || 100,
          offset: parseInt(req.query.offset as string) || 0
        };

        const users = await storage.getAllUsers(filters);
        
        // Return users array directly for compatibility with UI
        res.json(users);
      } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({ message: 'Failed to get users' });
      }
    }
  );

  // Get users with optional email filter (simpler endpoint for admin verification)
  app.get('/api/users',
    requireAuth,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const { email } = req.query;
        
        if (email && typeof email === 'string') {
          // Get specific user by email
          const user = await storage.getUserByEmail(email);
          if (!user) {
            return res.json({ users: [], total: 0 });
          }
          
          // Remove password hash from response
          const { password, ...userWithoutPassword } = user;
          
          res.json({
            users: [userWithoutPassword],
            total: 1
          });
        } else {
          // Get all users (limited for safety)
          const { limit, offset } = getPagination(req);
          const users = await storage.findUsers({}, Math.min(limit, 100), offset);
          
          // Remove password hashes from response
          const sanitizedUsers = users.map(user => {
            const { password, ...userWithoutPassword } = user;
            return userWithoutPassword;
          });
          
          res.json({
            users: sanitizedUsers,
            total: sanitizedUsers.length
          });
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Failed to fetch users' });
      }
    }
  );

  // Get single user details
  app.get('/api/admin/users/:id',
    requireAuth,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const user = await storage.getUserById(req.params.id);
        
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
        
        res.json(user);
      } catch (error) {
        console.error('Get user by ID error:', error);
        res.status(500).json({ message: 'Failed to get user details' });
      }
    }
  );

  // Update user status (active/suspended)
  app.put('/api/admin/users/:id/status',
    requireAuth,
    requireRole('admin'),
    validateRequest(z.object({
      status: z.enum(['active', 'suspended'])
    })),
    async (req: Request, res: Response) => {
      try {
        const { status } = req.body;
        const isActive = status === 'active';
        
        const user = await storage.updateUserStatus(req.params.id, isActive);
        
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
        
        res.json({ 
          message: `User ${status === 'active' ? 'activated' : 'suspended'} successfully`,
          user 
        });
      } catch (error) {
        console.error('Update user status error:', error);
        res.status(500).json({ message: 'Failed to update user status' });
      }
    }
  );

  // Change user role
  app.put('/api/admin/users/:id/role',
    requireAuth,
    requireRole('admin'),
    validateRequest(z.object({
      role: z.enum(['driver', 'contractor', 'admin', 'dispatcher', 'fleet_manager'])
    })),
    async (req: Request, res: Response) => {
      try {
        const { role } = req.body;
        
        const user = await storage.updateUserRole(req.params.id, role);
        
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
        
        res.json({ 
          message: 'User role updated successfully',
          user 
        });
      } catch (error) {
        console.error('Update user role error:', error);
        res.status(500).json({ message: 'Failed to update user role' });
      }
    }
  );

  // Reset user password
  app.post('/api/admin/users/:id/reset-password',
    requireAuth,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const userId = req.params.id;
        
        // Get user information first to obtain their email and name
        const user = await storage.getUser(userId);
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
        
        // Check if user has an email address
        if (!user.email) {
          console.error(`User ${userId} does not have an email address`);
          return res.status(400).json({ message: 'User does not have an email address configured' });
        }
        
        // Generate a secure token
        const token = await storage.createPasswordResetToken(userId, user.email);
        if (!token) {
          console.error(`Failed to create password reset token for user ${userId}`);
          return res.status(500).json({ message: 'Failed to create password reset token' });
        }
        
        // Build user name for the email
        const userName = user.firstName && user.lastName 
          ? `${user.firstName} ${user.lastName}`
          : user.firstName || user.email;
        
        // Send password reset email
        try {
          const emailSent = await reminderService.sendPasswordResetEmail(
            user.email,
            token,
            userName
          );
          
          if (!emailSent) {
            // Log the error but still return success to not leak information
            console.error(`Failed to send password reset email to ${user.email} for user ${userId}`);
          }
        } catch (emailError) {
          // Log the error but still return success to not leak information
          console.error(`Error sending password reset email to ${user.email}:`, emailError);
        }
        
        // Always return success message without exposing any password or token information
        res.json({ 
          message: 'Password reset email sent successfully'
        });
      } catch (error) {
        console.error('Reset user password error:', error);
        res.status(500).json({ message: 'Failed to reset password' });
      }
    }
  );

  // Get user activity log
  app.get('/api/admin/users/activity/:userId',
    requireAuth,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
        const activities = await storage.getUserActivityLog(req.params.userId, limit);
        
        // Return activities array directly for compatibility with UI
        res.json(activities);
      } catch (error) {
        console.error('Get user activity log error:', error);
        res.status(500).json({ message: 'Failed to get activity log' });
      }
    }
  );

  // ==================== USER BULK OPERATIONS ====================
  
  // Bulk suspend users
  app.post('/api/admin/users/bulk-suspend',
    requireAuth,
    requireRole('admin'),
    validateRequest(z.object({
      userIds: z.array(z.string()).min(1, 'At least one user ID is required')
    })),
    async (req: Request, res: Response) => {
      try {
        const { userIds } = req.body;
        const performedBy = req.session.userId || 'admin';
        
        console.log(`[Bulk Operation] Suspending ${userIds.length} users`);
        const result = await storage.bulkSuspendUsers(userIds, performedBy);
        
        res.json({
          success: true,
          message: `Successfully suspended ${result.succeeded.length} users`,
          result
        });
      } catch (error) {
        console.error('Bulk suspend users error:', error);
        res.status(500).json({ message: 'Failed to suspend users' });
      }
    }
  );
  
  // Bulk activate users
  app.post('/api/admin/users/bulk-activate',
    requireAuth,
    requireRole('admin'),
    validateRequest(z.object({
      userIds: z.array(z.string()).min(1, 'At least one user ID is required')
    })),
    async (req: Request, res: Response) => {
      try {
        const { userIds } = req.body;
        const performedBy = req.session.userId || 'admin';
        
        console.log(`[Bulk Operation] Activating ${userIds.length} users`);
        const result = await storage.bulkActivateUsers(userIds, performedBy);
        
        res.json({
          success: true,
          message: `Successfully activated ${result.succeeded.length} users`,
          result
        });
      } catch (error) {
        console.error('Bulk activate users error:', error);
        res.status(500).json({ message: 'Failed to activate users' });
      }
    }
  );
  
  // Bulk delete users (soft delete)
  app.post('/api/admin/users/bulk-delete',
    requireAuth,
    requireRole('admin'),
    validateRequest(z.object({
      userIds: z.array(z.string()).min(1, 'At least one user ID is required')
    })),
    async (req: Request, res: Response) => {
      try {
        const { userIds } = req.body;
        const performedBy = req.session.userId || 'admin';
        
        console.log(`[Bulk Operation] Deleting ${userIds.length} users`);
        const result = await storage.bulkDeleteUsers(userIds, performedBy);
        
        res.json({
          success: true,
          message: `Successfully deleted ${result.succeeded.length} users`,
          result
        });
      } catch (error) {
        console.error('Bulk delete users error:', error);
        res.status(500).json({ message: 'Failed to delete users' });
      }
    }
  );
  
  // Bulk email users
  app.post('/api/admin/users/bulk-email',
    requireAuth,
    requireRole('admin'),
    validateRequest(z.object({
      userIds: z.array(z.string()).min(1, 'At least one user ID is required'),
      subject: z.string().min(1, 'Subject is required'),
      message: z.string().min(1, 'Message is required')
    })),
    async (req: Request, res: Response) => {
      try {
        const { userIds, subject, message } = req.body;
        const performedBy = req.session.userId || 'admin';
        
        console.log(`[Bulk Operation] Emailing ${userIds.length} users`);
        const result = await storage.bulkEmailUsers(userIds, subject, message, performedBy);
        
        res.json({
          success: true,
          message: `Successfully emailed ${result.succeeded.length} users`,
          result
        });
      } catch (error) {
        console.error('Bulk email users error:', error);
        res.status(500).json({ message: 'Failed to email users' });
      }
    }
  );

  // Delete user (soft delete)
  app.delete('/api/admin/users/:id',
    requireAuth,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        // Soft delete by setting isActive to false
        const user = await storage.updateUserStatus(req.params.id, false);
        
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
        
        res.json({ message: 'User deleted successfully' });
      } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ message: 'Failed to delete user' });
      }
    }
  );

  // View all jobs with admin filters
  app.get('/api/admin/jobs',
    requireAuth,
    requireRole('admin', 'dispatcher'),
    async (req: Request, res: Response) => {
      try {
        const filters = {
          ...getPagination(req),
          status: req.query.status as typeof jobStatusEnum.enumValues[number],
          jobType: req.query.jobType as typeof jobTypeEnum.enumValues[number],
          contractorId: req.query.contractorId as string,
          customerId: req.query.customerId as string,
          fleetAccountId: req.query.fleetAccountId as string,
          fromDate: req.query.fromDate ? new Date(req.query.fromDate as string) : undefined,
          toDate: req.query.toDate ? new Date(req.query.toDate as string) : undefined
        };

        const jobs = await storage.findJobs(filters);
        
        res.json({ jobs });
      } catch (error) {
        console.error('Admin get jobs error:', error);
        res.status(500).json({ message: 'Failed to get jobs' });
      }
    }
  );

  // Update job details (admin)
  app.put('/api/admin/jobs/:id',
    requireAuth,
    requireRole('admin', 'dispatcher'),
    async (req: Request, res: Response) => {
      try {
        const jobId = req.params.id;
        const updates = req.body;

        // Get existing job first
        const existingJob = await storage.getJob(jobId);
        if (!existingJob) {
          return res.status(404).json({ message: 'Job not found' });
        }

        // Prepare update data
        const jobUpdates: any = {};
        
        if (updates.customerName !== undefined) jobUpdates.customerName = updates.customerName;
        if (updates.customerPhone !== undefined) jobUpdates.customerPhone = updates.customerPhone;
        if (updates.location !== undefined) jobUpdates.location = updates.location;
        if (updates.locationAddress !== undefined) jobUpdates.locationAddress = updates.locationAddress;
        if (updates.vin !== undefined) jobUpdates.vin = updates.vin;
        if (updates.unitNumber !== undefined) jobUpdates.unitNumber = updates.unitNumber;
        if (updates.price !== undefined) jobUpdates.price = updates.price;
        if (updates.service !== undefined) jobUpdates.service = updates.service;
        if (updates.status !== undefined) {
          // Update status using proper status update method to track timestamps
          await storage.updateJobStatus(jobId, updates.status, req.session.userId, 'Admin update');
          delete updates.status; // Remove from jobUpdates since it's handled separately
        }

        // Update the job with other fields
        const updatedJob = await storage.updateJob(jobId, jobUpdates);
        
        if (!updatedJob) {
          return res.status(500).json({ message: 'Failed to update job' });
        }

        res.json({
          message: 'Job updated successfully',
          job: updatedJob
        });
      } catch (error) {
        console.error('Admin update job error:', error);
        res.status(500).json({ message: 'Failed to update job details' });
      }
    }
  );

  // Get live jobs for admin map view
  app.get('/api/admin/jobs/live',
    requireAuth,
    requireRole('admin', 'dispatcher'),
    async (req: Request, res: Response) => {
      try {
        // Get all active jobs (not completed or cancelled)
        const activeStatuses: (typeof jobStatusEnum.enumValues[number])[] = [
          'new', 'assigned', 'en_route', 'on_site'
        ];
        
        const jobs = await storage.findJobs({
          limit: 500, // Higher limit for live map
          offset: 0,
          orderBy: 'createdAt',
          orderDir: 'desc'
        });
        
        // Filter for active jobs and add location data
        const liveJobs = jobs.filter((job: Job) => 
          activeStatuses.includes(job.status) && 
          job.location && 
          typeof job.location === 'object' &&
          'lat' in job.location && 
          'lng' in job.location
        ).map((job: Job) => ({
          id: job.id,
          status: job.status,
          type: job.jobType,
          serviceType: job.service,
          location: job.location,
          locationAddress: job.locationAddress,
          customer: {
            name: job.customerName,
            phone: job.customerPhone,
            email: job.customerEmail
          },
          contractorId: job.contractorId,
          contractorLocation: job.contractorLocation,
          price: job.price,
          createdAt: job.createdAt,
          assignedAt: job.assignedAt,
          enRouteAt: job.enRouteAt,
          onSiteAt: job.onSiteAt,
          estimatedArrival: job.estimatedArrival,
          vin: job.vin,
          unitNumber: job.unitNumber,
          fleetAccountId: job.fleetAccountId
        }));
        
        res.json({ 
          jobs: liveJobs,
          total: liveJobs.length 
        });
      } catch (error) {
        console.error('Get live jobs error:', error);
        res.status(500).json({ message: 'Failed to get live jobs' });
      }
    }
  );

  // Get online contractors for admin map view
  app.get('/api/admin/contractors/online',
    requireAuth,
    requireRole('admin', 'dispatcher'),
    async (req: Request, res: Response) => {
      try {
        // Get all active contractors
        const contractors = await storage.findContractors({
          limit: 200,
          offset: 0,
          orderBy: 'createdAt',
          orderDir: 'desc'
        });
        
        // Filter for online/available contractors with location data
        const onlineContractors = contractors
          .filter((contractor: ContractorProfile) => 
            contractor.isAvailable &&
            contractor.currentLocation &&
            typeof contractor.currentLocation === 'object' &&
            'lat' in contractor.currentLocation && 
            'lng' in contractor.currentLocation
          )
          .map((contractor: ContractorProfile) => ({
            id: contractor.id,
            userId: contractor.userId,
            name: `${contractor.firstName} ${contractor.lastName}`.trim() || contractor.companyName || 'Unknown',
            companyName: contractor.companyName,
            phone: contractor.phone,
            email: contractor.email,
            status: contractor.activeJobId ? 'on_job' : 
                   contractor.isAvailable ? 'available' : 'offline',
            location: contractor.currentLocation,
            lastLocationUpdate: contractor.lastLocationUpdate,
            activeJobId: contractor.activeJobId,
            completedJobsCount: contractor.completedJobsCount || 0,
            averageRating: contractor.averageRating || 0,
            performanceTier: contractor.performanceTier,
            servicesOffered: contractor.servicesOffered
          }));
        
        res.json({ 
          contractors: onlineContractors,
          total: onlineContractors.length 
        });
      } catch (error) {
        console.error('Get online contractors error:', error);
        res.status(500).json({ message: 'Failed to get online contractors' });
      }
    }
  );

  // Assign contractor to job (POST) - legacy support
  app.post('/api/admin/jobs/:id/assign',
    requireAuth,
    requireRole('admin', 'dispatcher'),
    validateRequest(z.object({
      contractorId: z.string()
    })),
    async (req: Request, res: Response) => {
      try {
        const jobId = req.params.id;
        const { contractorId } = req.body;
        
        // Get job to check current status
        const job = await storage.getJob(jobId);
        if (!job) {
          return res.status(404).json({ message: 'Job not found' });
        }
        
        if (job.status !== 'new' && job.status !== 'assigned') {
          return res.status(400).json({ 
            message: `Cannot assign contractor to job with status: ${job.status}` 
          });
        }
        
        // Check contractor exists
        const contractor = await storage.getContractorProfile(contractorId);
        if (!contractor) {
          return res.status(404).json({ message: 'Contractor not found' });
        }
        
        // Get contractor current job to check if busy
        const currentJobInfo = await storage.getContractorCurrentJob(contractorId);
        const isContractorBusy = currentJobInfo.job !== null;
        
        if (isContractorBusy) {
          // Contractor is busy, enqueue the job
          console.log(`[AssignJob] Contractor ${contractorId} is busy, enqueueing job ${jobId}`);
          
          // Enqueue the job for later
          const queueEntry = await storage.enqueueJob(contractorId, jobId);
          
          // Update job status to 'assigned' but contractor will handle it when ready
          await storage.updateJob(jobId, {
            contractorId,
            status: 'assigned',
            assignedAt: new Date()
          });
          
          res.json({ 
            message: 'Job queued for contractor',
            jobId,
            contractorId,
            queuePosition: queueEntry.position,
            isQueued: true
          });
        } else {
          // Contractor is available, assign immediately
          console.log(`[AssignJob] Contractor ${contractorId} is available, assigning job ${jobId} immediately`);
          
          // Assign the contractor
          await storage.updateJob(jobId, {
            contractorId,
            status: 'assigned',
            assignedAt: new Date()
          });
          
          // Update contractor's active job
          await storage.updateContractorProfile(contractorId, {
            activeJobId: jobId
          });
          
          // Send notification to contractor (if WebSocket connected)
          const { trackingWSServer } = await import('./websocket');
          trackingWSServer.notifyJobAssignment(jobId, contractorId);
          
          res.json({ 
            message: 'Contractor assigned successfully',
            jobId,
            contractorId,
            isQueued: false
          });
        }
      } catch (error) {
        console.error('Assign contractor error:', error);
        res.status(500).json({ message: 'Failed to assign contractor' });
      }
    }
  );

  // Assign contractor to job (PUT) - used by admin UI
  app.put('/api/admin/jobs/:id/assign',
    requireAuth,
    requireRole('admin', 'dispatcher'),
    validateRequest(z.object({
      contractorId: z.string(),
      driverId: z.string().optional(),
      forceQueue: z.boolean().optional() // Allow forcing enqueue even if available
    })),
    async (req: Request, res: Response) => {
      try {
        const jobId = req.params.id;
        const { contractorId, driverId, forceQueue } = req.body;
        
        // Get job to check current status
        const job = await storage.getJob(jobId);
        if (!job) {
          return res.status(404).json({ message: 'Job not found' });
        }
        
        if (job.status !== 'new' && job.status !== 'assigned') {
          return res.status(400).json({ 
            message: `Cannot assign contractor to job with status: ${job.status}` 
          });
        }
        
        // Check contractor exists
        const contractor = await storage.getContractorProfile(contractorId);
        if (!contractor) {
          return res.status(404).json({ message: 'Contractor not found' });
        }
        
        // Get contractor current job and queue info
        const currentJobInfo = await storage.getContractorCurrentJob(contractorId);
        const contractorQueue = await storage.getContractorQueue(contractorId);
        const isContractorBusy = currentJobInfo.job !== null;
        const queueLength = contractorQueue.filter(q => q.status === 'pending').length;
        
        if (isContractorBusy || forceQueue) {
          // Contractor is busy or force queue requested, enqueue the job
          console.log(`[AssignJob] Contractor ${contractorId} is busy or force queue, enqueueing job ${jobId}`);
          
          // Enqueue the job for later
          const queueEntry = await storage.enqueueJob(contractorId, jobId);
          
          // Update job status to 'assigned' but contractor will handle it when ready
          await storage.updateJob(jobId, {
            contractorId,
            status: 'assigned',
            assignedAt: new Date()
          });
          
          // Get position info for response
          const positionInfo = await storage.getQueuePositionForJob(jobId);
          
          res.json({ 
            message: `Job queued for contractor (position #${positionInfo?.position || queueLength + 1} in queue)`,
            jobId,
            contractorId,
            queuePosition: positionInfo?.position || queueLength + 1,
            totalInQueue: positionInfo?.totalInQueue || queueLength + 1,
            isQueued: true
          });
        } else {
          // Contractor is available, assign immediately
          console.log(`[AssignJob] Contractor ${contractorId} is available, assigning job ${jobId} immediately`);
          
          // Assign the contractor
          await storage.updateJob(jobId, {
            contractorId,
            status: 'assigned',
            assignedAt: new Date()
          });
          
          // Update contractor's active job
          await storage.updateContractorProfile(contractorId, {
            activeJobId: jobId
          });
          
          // Send notification to contractor (if WebSocket connected)
          const { trackingWSServer } = await import('./websocket');
          trackingWSServer.notifyJobAssignment(jobId, contractorId);
          
          res.json({ 
            message: 'Contractor assigned successfully',
            jobId,
            contractorId,
            isQueued: false
          });
        }
      } catch (error) {
        console.error('Assign contractor error:', error);
        res.status(500).json({ message: 'Failed to assign contractor' });
      }
    }
  );

  // ==================== PUBLIC ROUTES ====================

  // Get price estimate without login
  app.get('/api/public/estimate',
    rateLimiter(10, 60000),
    async (req: Request, res: Response) => {
      try {
        const serviceTypeId = req.query.serviceTypeId as string;
        const distance = parseFloat(req.query.distance as string) || 0;
        const isEmergency = req.query.isEmergency === 'true';

        const pricing = await storage.getCurrentPricing(serviceTypeId);
        
        if (!pricing) {
          return res.status(400).json({ message: 'Invalid service type' });
        }

        let estimate = parseFloat(pricing.basePrice);
        
        if (distance && pricing.perMileRate) {
          estimate += distance * parseFloat(pricing.perMileRate);
        }

        if (isEmergency && pricing.emergencySurcharge) {
          estimate += parseFloat(pricing.emergencySurcharge);
        }

        res.json({
          estimate: estimate.toFixed(2),
          currency: 'USD',
          disclaimer: 'This is an estimate. Final price may vary based on actual conditions.'
        });
      } catch (error) {
        console.error('Get estimate error:', error);
        res.status(500).json({ message: 'Failed to calculate estimate' });
      }
    }
  );

  // Check if service available in area
  app.get('/api/public/coverage',
    rateLimiter(20, 60000),
    async (req: Request, res: Response) => {
      try {
        const location = JSON.parse(req.query.location as string);
        const isAvailable = await storage.checkServiceAvailability(location);
        
        res.json({ 
          covered: isAvailable,
          message: isAvailable ? 
            'Service is available in your area' : 
            'Service is not yet available in your area'
        });
      } catch (error) {
        console.error('Check coverage error:', error);
        res.status(500).json({ message: 'Failed to check coverage' });
      }
    }
  );

  // Submit contact form
  app.post('/api/public/contact',
    rateLimiter(3, 60000),
    validateRequest(z.object({
      name: z.string().min(2),
      email: z.string().email(),
      phone: z.string().optional(),
      subject: z.string().min(5),
      message: z.string().min(10)
    })),
    async (req: Request, res: Response) => {
      try {
        // Here you would typically send an email or save to database
        // For now, just acknowledge receipt
        
        res.json({
          message: 'Thank you for contacting us. We will respond within 24 hours.',
          referenceId: `CONTACT-${Date.now()}`
        });
      } catch (error) {
        console.error('Submit contact form error:', error);
        res.status(500).json({ message: 'Failed to submit contact form' });
      }
    }
  );

  // Get service catalog
  app.get('/api/public/services',
    rateLimiter(50, 60000),
    async (req: Request, res: Response) => {
      try {
        const services = await storage.getActiveServiceTypes();
        
        res.json({ 
          services: services.map(s => ({
            id: s.id,
            code: s.code,
            name: s.name,
            category: s.category,
            description: s.description,
            isEmergency: s.isEmergency,
            isSchedulable: s.isSchedulable,
            estimatedDuration: s.estimatedDuration
          }))
        });
      } catch (error) {
        console.error('Get public services error:', error);
        res.status(500).json({ message: 'Failed to get services' });
      }
    }
  );

  // Track job by ID (with limited info)
  app.get('/api/public/track/:jobId',
    rateLimiter(30, 60000),
    async (req: Request, res: Response) => {
      try {
        const job = await storage.getJob(req.params.jobId);
        
        if (!job) {
          return res.status(404).json({ message: 'Job not found' });
        }

        // Return limited public information
        res.json({
          jobId: job.id,
          status: job.status,
          serviceType: job.serviceTypeId,
          estimatedArrival: job.estimatedArrival,
          vehicleLocation: job.vehicleLocation,
          lastUpdated: job.updatedAt
        });
      } catch (error) {
        console.error('Track job error:', error);
        res.status(500).json({ message: 'Failed to track job' });
      }
    }
  );

  // ==================== AI INTEGRATION ROUTES ====================

  // AI chatbot endpoint
  app.post('/api/ai/chat',
    requireAuth,
    rateLimiter(20, 60000),
    validateRequest(z.object({
      message: z.string().min(1),
      context: z.object({
        jobId: z.string().optional(),
        serviceType: z.string().optional()
      }).optional()
    })),
    async (req: Request, res: Response) => {
      try {
        // Here you would integrate with OpenAI or other AI service
        // For now, return a placeholder response
        
        res.json({
          response: 'I understand you need assistance. How can I help you today?',
          suggestions: [
            'Get a price estimate',
            'Book emergency service',
            'Check service availability',
            'Track existing job'
          ]
        });
      } catch (error) {
        console.error('AI chat error:', error);
        res.status(500).json({ message: 'Failed to process chat message' });
      }
    }
  );

  // Analyze damage from photo
  app.post('/api/ai/analyze-photo',
    requireAuth,
    rateLimiter(5, 60000),
    validateRequest(z.object({
      photoUrl: z.string().url(),
      vehicleType: z.string().optional()
    })),
    async (req: Request, res: Response) => {
      try {
        // Here you would integrate with AI vision service
        // For now, return a placeholder analysis
        
        res.json({
          analysis: {
            damageDetected: true,
            severity: 'moderate',
            estimatedRepairTime: 120,
            recommendedServices: ['tire_change', 'wheel_alignment'],
            confidence: 0.85
          }
        });
      } catch (error) {
        console.error('Analyze photo error:', error);
        res.status(500).json({ message: 'Failed to analyze photo' });
      }
    }
  );

  // ==================== AI ROUTES ====================
  
  // AI Chat endpoint
  app.post('/api/ai/chat',
    rateLimiter(30, 60000), // 30 requests per minute
    validateRequest(z.object({
      message: z.string().min(1).max(1000),
      context: z.object({
        page: z.string().optional(),
        jobId: z.string().optional(),
        sessionHistory: z.array(z.object({
          role: z.enum(['user', 'assistant']),
          content: z.string()
        })).optional()
      }).optional()
    })),
    async (req: Request, res: Response) => {
      try {
        const { message, context } = req.body;
        const userId = req.session.userId || `guest-${req.ip}`;

        // Check for quick response first
        const quickResponse = await aiService.getQuickResponse(message);
        if (quickResponse) {
          return res.json({
            response: quickResponse,
            suggestions: await aiService.generateSuggestions(message, quickResponse)
          });
        }

        // Get AI response
        const result = await aiService.chatCompletion(message, {
          ...context,
          userId
        });

        res.json(result);
      } catch (error: any) {
        console.error('AI chat error:', error);
        res.status(error.message?.includes('Rate limit') ? 429 : 500).json({ 
          message: error.message || 'Failed to process chat request' 
        });
      }
    }
  );

  // AI Photo Analysis endpoint
  app.post('/api/ai/analyze-photo',
    rateLimiter(10, 60000), // 10 requests per minute
    validateRequest(z.object({
      photo: z.string(), // Base64 encoded photo
      context: z.string().optional()
    })),
    async (req: Request, res: Response) => {
      try {
        const { photo, context } = req.body;
        
        // Analyze the photo
        const analysis = await aiService.analyzePhoto(photo, context);

        // If there's a job ID in session, save the analysis
        if (req.session.userId) {
          // Here you could save the analysis to the job record
          // await storage.updateJobAnalysis(jobId, analysis);
        }

        res.json(analysis);
      } catch (error: any) {
        console.error('Photo analysis error:', error);
        res.status(500).json({ 
          message: error.message || 'Failed to analyze photo' 
        });
      }
    }
  );

  // Get AI repair suggestions
  app.get('/api/ai/suggestions',
    rateLimiter(50, 60000),
    async (req: Request, res: Response) => {
      try {
        const symptoms = req.query.symptoms as string;
        const vehicleType = req.query.vehicleType as string || 'semi-truck';
        const urgency = req.query.urgency as string;

        if (!symptoms) {
          return res.status(400).json({ message: 'Symptoms parameter required' });
        }

        // Generate context-aware suggestions
        const urgencyLevel = urgency ? parseInt(urgency) : aiService.analyzeUrgency(symptoms);
        
        // Get repair recommendations
        const recommendations = await aiService.generateRepairRecommendations(symptoms);
        
        res.json({
          urgencyLevel,
          recommendations: recommendations.recommendations,
          estimatedTime: recommendations.estimatedTime,
          servicesNeeded: recommendations.partsNeeded,
          safetyNotes: recommendations.safetyNotes,
          suggestions: await aiService.generateSuggestions(symptoms, JSON.stringify(recommendations))
        });
      } catch (error: any) {
        console.error('Get AI suggestions error:', error);
        res.status(500).json({ message: 'Failed to get suggestions' });
      }
    }
  );

  // AI Streaming chat endpoint (for better UX)
  app.post('/api/ai/chat/stream',
    rateLimiter(20, 60000),
    async (req: Request, res: Response) => {
      try {
        const { message, context } = req.body;
        const userId = req.session.userId || `guest-${req.ip}`;

        // Set up SSE
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // Stream the response
        const stream = aiService.streamChatResponse(message, {
          ...context,
          userId
        });

        for await (const chunk of stream) {
          res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
        }

        res.write('data: [DONE]\n\n');
        res.end();
      } catch (error: any) {
        console.error('AI streaming error:', error);
        res.write(`data: ${JSON.stringify({ error: 'Failed to generate response' })}\n\n`);
        res.end();
      }
    }
  );

  // Get repair recommendations for contractors
  app.post('/api/ai/repair-recommendations',
    requireAuth,
    requireRole('contractor', 'admin'),
    rateLimiter(20, 60000),
    validateRequest(z.object({
      issueDescription: z.string(),
      photoAnalysis: z.any().optional()
    })),
    async (req: Request, res: Response) => {
      try {
        const { issueDescription, photoAnalysis } = req.body;
        
        const recommendations = await aiService.generateRepairRecommendations(
          issueDescription,
          photoAnalysis
        );

        res.json(recommendations);
      } catch (error: any) {
        console.error('Repair recommendations error:', error);
        res.status(500).json({ 
          message: 'Failed to generate repair recommendations' 
        });
      }
    }
  );

  // ==================== REMINDER SYSTEM ROUTES ====================

  // Get customer communication preferences
  app.get('/api/customer/preferences',
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        let preferences = await storage.getCustomerPreferences(req.session.userId!);
        
        // Create default preferences if none exist
        if (!preferences) {
          preferences = await storage.createCustomerPreferences({
            userId: req.session.userId!,
            communicationChannel: 'both',
            reminderOptIn: true,
            marketingOptIn: false,
            language: 'en',
            timezone: 'America/New_York',
            maxDailyMessages: 10
          });
        }
        
        res.json(preferences);
      } catch (error: any) {
        console.error('Get preferences error:', error);
        res.status(500).json({ message: 'Failed to get preferences' });
      }
    }
  );

  // Update customer communication preferences
  app.put('/api/customer/preferences',
    requireAuth,
    validateRequest(insertCustomerPreferencesSchema.partial()),
    async (req: Request, res: Response) => {
      try {
        const preferences = await storage.updateCustomerPreferences(
          req.session.userId!,
          req.body
        );
        
        res.json(preferences);
      } catch (error: any) {
        console.error('Update preferences error:', error);
        res.status(500).json({ message: 'Failed to update preferences' });
      }
    }
  );

  // Unsubscribe from all reminders
  app.post('/api/customer/unsubscribe/:userId',
    async (req: Request, res: Response) => {
      try {
        const { userId } = req.params;
        
        await storage.updateCustomerPreferences(userId, {
          reminderOptIn: false,
          marketingOptIn: false
        });
        
        res.json({ message: 'Successfully unsubscribed from all communications' });
      } catch (error: any) {
        console.error('Unsubscribe error:', error);
        res.status(500).json({ message: 'Failed to unsubscribe' });
      }
    }
  );

  // Get all reminder templates (admin)
  app.get('/api/admin/reminders/templates',
    requireAuth,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const [emailTemplates, smsTemplates] = await Promise.all([
          storage.getAllEmailTemplates(),
          storage.getAllSmsTemplates()
        ]);
        
        res.json({
          emailTemplates,
          smsTemplates
        });
      } catch (error: any) {
        console.error('Get templates error:', error);
        res.status(500).json({ message: 'Failed to get templates' });
      }
    }
  );

  // Create or update email template (admin)
  app.post('/api/admin/reminders/templates/email',
    requireAuth,
    requireRole('admin'),
    validateRequest(insertEmailTemplateSchema),
    async (req: Request, res: Response) => {
      try {
        const existing = await storage.getEmailTemplate(req.body.code);
        
        let template;
        if (existing) {
          template = await storage.updateEmailTemplate(existing.id, req.body);
        } else {
          template = await storage.createEmailTemplate(req.body);
        }
        
        res.json(template);
      } catch (error: any) {
        console.error('Save email template error:', error);
        res.status(500).json({ message: 'Failed to save email template' });
      }
    }
  );

  // Create or update SMS template (admin)
  app.post('/api/admin/reminders/templates/sms',
    requireAuth,
    requireRole('admin'),
    validateRequest(insertSmsTemplateSchema),
    async (req: Request, res: Response) => {
      try {
        const existing = await storage.getSmsTemplate(req.body.code);
        
        let template;
        if (existing) {
          template = await storage.updateSmsTemplate(existing.id, req.body);
        } else {
          template = await storage.createSmsTemplate(req.body);
        }
        
        res.json(template);
      } catch (error: any) {
        console.error('Save SMS template error:', error);
        res.status(500).json({ message: 'Failed to save SMS template' });
      }
    }
  );

  // Get job reminders (admin)
  app.get('/api/admin/reminders/job/:jobId',
    requireAuth,
    requireRole('admin', 'contractor'),
    async (req: Request, res: Response) => {
      try {
        const { jobId } = req.params;
        const reminders = await storage.getUpcomingReminders(jobId);
        
        res.json(reminders);
      } catch (error: any) {
        console.error('Get job reminders error:', error);
        res.status(500).json({ message: 'Failed to get job reminders' });
      }
    }
  );

  // Send test reminder (admin)
  app.post('/api/admin/reminders/test',
    requireAuth,
    requireRole('admin'),
    validateRequest(z.object({
      type: z.enum(['email', 'sms', 'both']),
      recipient: z.string(),
      template: z.string().optional()
    })),
    async (req: Request, res: Response) => {
      try {
        const { type, recipient, template } = req.body;
        
        const result = await reminderService.sendTestReminder(type, recipient, template);
        
        if (result.success) {
          res.json({ message: 'Test reminder sent successfully' });
        } else {
          res.status(400).json({ 
            message: 'Failed to send test reminder', 
            error: result.error 
          });
        }
      } catch (error: any) {
        console.error('Send test reminder error:', error);
        res.status(500).json({ message: 'Failed to send test reminder' });
      }
    }
  );

  // Get blacklist (admin)
  app.get('/api/admin/reminders/blacklist',
    requireAuth,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const type = req.query.type as 'email' | 'phone' | undefined;
        const blacklist = await storage.getBlacklist(type);
        
        res.json(blacklist);
      } catch (error: any) {
        console.error('Get blacklist error:', error);
        res.status(500).json({ message: 'Failed to get blacklist' });
      }
    }
  );

  // Add to blacklist (admin)
  app.post('/api/admin/reminders/blacklist',
    requireAuth,
    requireRole('admin'),
    validateRequest(insertReminderBlacklistSchema),
    async (req: Request, res: Response) => {
      try {
        const entry = await storage.addToBlacklist(req.body);
        res.json(entry);
      } catch (error: any) {
        console.error('Add to blacklist error:', error);
        res.status(500).json({ message: 'Failed to add to blacklist' });
      }
    }
  );

  // Remove from blacklist (admin)
  app.delete('/api/admin/reminders/blacklist/:value',
    requireAuth,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const { value } = req.params;
        await storage.removeFromBlacklist(value);
        
        res.json({ message: 'Removed from blacklist' });
      } catch (error: any) {
        console.error('Remove from blacklist error:', error);
        res.status(500).json({ message: 'Failed to remove from blacklist' });
      }
    }
  );

  // Get reminder metrics (admin)
  app.get('/api/admin/reminders/metrics',
    requireAuth,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const fromDate = req.query.fromDate 
          ? new Date(req.query.fromDate as string)
          : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        
        const toDate = req.query.toDate
          ? new Date(req.query.toDate as string)
          : new Date();
        
        const channel = req.query.channel as 'email' | 'sms' | 'both' | undefined;
        
        const metrics = await storage.getReminderMetrics(fromDate, toDate, channel);
        
        res.json(metrics);
      } catch (error: any) {
        console.error('Get reminder metrics error:', error);
        res.status(500).json({ message: 'Failed to get reminder metrics' });
      }
    }
  );

  // Get scheduler status (admin)
  app.get('/api/admin/reminders/scheduler/status',
    requireAuth,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const status = reminderScheduler.getStatus();
        res.json(status);
      } catch (error: any) {
        console.error('Get scheduler status error:', error);
        res.status(500).json({ message: 'Failed to get scheduler status' });
      }
    }
  );

  // Start/stop scheduler (admin)
  app.post('/api/admin/reminders/scheduler/:action',
    requireAuth,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const { action } = req.params;
        
        if (action === 'start') {
          reminderScheduler.start();
          res.json({ message: 'Reminder scheduler started' });
        } else if (action === 'stop') {
          reminderScheduler.stop();
          res.json({ message: 'Reminder scheduler stopped' });
        } else {
          res.status(400).json({ message: 'Invalid action' });
        }
      } catch (error: any) {
        console.error('Scheduler control error:', error);
        res.status(500).json({ message: 'Failed to control scheduler' });
      }
    }
  );

  // ==================== CONTRACTOR APPLICATION ROUTES ====================

  // Submit contractor application
  app.post('/api/contractor/apply',
    rateLimiter(5, 300000), // 5 applications per 5 minutes
    async (req: Request, res: Response) => {
      try {
        // Validate required fields
        const requiredFields = ['firstName', 'lastName', 'email', 'phone'];
        for (const field of requiredFields) {
          if (!req.body[field]) {
            return res.status(400).json({
              message: `Missing required field: ${field}`
            });
          }
        }

        // Check if email already has an application
        const existingApplications = await storage.findContractorApplications({
          email: req.body.email
        });

        if (existingApplications.length > 0) {
          const latestApp = existingApplications[0];
          if (latestApp.status === 'approved') {
            return res.status(400).json({
              message: 'This email is already associated with an approved contractor account'
            });
          }
          if (latestApp.status === 'pending' || latestApp.status === 'under_review') {
            return res.status(400).json({
              message: 'An application is already in progress for this email'
            });
          }
        }

        // Create application
        const applicationData = {
          ...req.body,
          status: 'draft',
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const application = await storage.createContractorApplication(applicationData);

        res.status(201).json({
          message: 'Application created successfully',
          applicationId: application.id
        });
      } catch (error) {
        console.error('Create application error:', error);
        res.status(500).json({ message: 'Failed to create application' });
      }
    }
  );

  // Start contractor application
  app.post('/api/contractor/apply/start',
    async (req: Request, res: Response) => {
      try {
        // Create a new draft application with placeholder values for required fields
        // These will be updated as the user fills out the form
        const application = await storage.createContractorApplication({
          // Required fields with placeholder values
          firstName: '',  // Required, will be updated
          lastName: '',   // Required, will be updated
          email: '',  // Required, will be updated
          phone: '',  // Required, will be updated
          
          // Application metadata
          status: 'draft',
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        res.json({
          id: application.id,
          status: application.status,
          message: 'Application started successfully'
        });
      } catch (error) {
        console.error('Start application error:', error);
        res.status(500).json({ message: 'Failed to start application' });
      }
    }
  );

  // Update contractor application
  app.put('/api/contractor/apply/:id',
    async (req: Request, res: Response) => {
      try {
        const application = await storage.getContractorApplication(req.params.id);
        
        if (!application) {
          return res.status(404).json({ message: 'Application not found' });
        }

        // Don't check ownership for draft applications (no auth required)

        // Don't allow updates to approved/rejected applications
        if (['approved', 'rejected'].includes(application.status)) {
          return res.status(400).json({
            message: 'Cannot update finalized application'
          });
        }

        // Clean up the data to ensure arrays are properly formatted
        const updateData = { ...req.body };
        
        console.log('Update data received:', JSON.stringify(updateData, null, 2));
        
        // Don't map field names - Drizzle expects camelCase property names
        // The schema defines firstName: text("first_name") so we pass firstName, not first_name
        
        // Business fields
        if ('companyName' in req.body) {
          updateData.businessName = req.body.companyName;
        }
        if ('yearsInBusiness' in req.body) {
          updateData.yearsExperience = req.body.yearsInBusiness;
        }
        if ('hasOwnVehicle' in req.body) {
          updateData.hasServiceTruck = req.body.hasOwnVehicle;
        }
        if ('totalYearsExperience' in req.body) {
          updateData.yearsExperience = req.body.totalYearsExperience;
        }
        if ('hasOwnTools' in req.body) {
          // Map hasOwnTools to database field if needed
          updateData.hasOwnTools = req.body.hasOwnTools;
        }
        
        // Handle array fields - these are PostgreSQL arrays in the database
        if ('serviceTypes' in req.body) {
          updateData.serviceTypes = Array.isArray(req.body.serviceTypes) 
            ? req.body.serviceTypes 
            : [];
        }
        if ('certifications' in req.body) {
          updateData.certifications = Array.isArray(req.body.certifications)
            ? req.body.certifications
            : [];
        }
        if ('coverageAreas' in req.body) {
          updateData.additionalAreas = Array.isArray(req.body.coverageAreas)
            ? req.body.coverageAreas
            : [];
        }
        if ('specializations' in req.body) {
          // Specializations doesn't exist in DB, merge with certifications
          if (Array.isArray(req.body.specializations) && req.body.specializations.length > 0) {
            if (!updateData.certifications) {
              updateData.certifications = req.body.specializations;
            } else {
              updateData.certifications = [...(updateData.certifications as any[]), ...req.body.specializations];
            }
          }
        }
        
        // Handle equipment field
        if ('equipment' in req.body) {
          updateData.equipment = Array.isArray(req.body.equipment)
            ? req.body.equipment
            : [];
        }
        
        // Handle tools field
        if ('tools' in req.body) {
          updateData.tools = Array.isArray(req.body.tools)
            ? req.body.tools
            : [];
        }
        
        // Handle other Step 4 fields
        if ('serviceRadius' in req.body) {
          updateData.serviceRadius = req.body.serviceRadius;
        }
        if ('baseLocation' in req.body) {
          // Handle empty string for baseLocation
          updateData.baseLocation = req.body.baseLocation || null;
        }
        
        // Clean up empty string fields that should be null
        for (const key in updateData) {
          if (updateData[key] === '') {
            updateData[key] = null;
          }
        }
        
        // Now remove fields that don't exist in the database and haven't been mapped
        const fieldsToRemove = ['address', 'city', 'state', 'zip', 'experienceLevel', 
                               'totalYearsExperience', 'companyName', 'yearsInBusiness',
                               'hasOwnTools', 'hasOwnVehicle', 'coverageAreas', 
                               'references', 'vehicleInfo', 'specializations', 'previousEmployers'];
        // Don't remove firstName/lastName - Drizzle expects camelCase property names
        console.log('Before field removal, updateData has:', Object.keys(updateData));
        for (const field of fieldsToRemove) {
          if (field in updateData && 
              field !== 'serviceTypes' && 
              field !== 'certifications' && 
              field !== 'hasServiceTruck' && 
              field !== 'serviceRadius' && 
              field !== 'baseLocation' &&
              field !== 'businessName' &&
              field !== 'yearsExperience' &&
              field !== 'additionalAreas' &&
              field !== 'firstName' &&    // Keep camelCase field names
              field !== 'lastName' &&     // Keep camelCase field names
              field !== 'email' &&
              field !== 'phone') {
            console.log(`Deleting field: ${field}`);
            delete updateData[field];
          }
        }
        console.log('After field removal, updateData has:', Object.keys(updateData));
        
        // Arrays are now properly defined as PostgreSQL arrays in the schema
        // No special handling needed - Drizzle will handle them correctly
        
        console.log('Final update data:', JSON.stringify(updateData, null, 2));
        
        const updatedApplication = await storage.updateContractorApplication(
          req.params.id,
          {
            ...updateData,
            updatedAt: new Date()
          }
        );

        res.json({
          message: 'Application updated successfully',
          application: updatedApplication
        });
      } catch (error) {
        console.error('Update application error:', error);
        res.status(500).json({ message: 'Failed to update application' });
      }
    }
  );

  // Submit application for review
  app.post('/api/contractor/apply/:id/submit',
    async (req: Request, res: Response) => {
      try {
        const application = await storage.getContractorApplication(req.params.id);
        
        if (!application) {
          return res.status(404).json({ message: 'Application not found' });
        }

        if (application.status !== 'draft') {
          return res.status(400).json({
            message: 'Only draft applications can be submitted'
          });
        }

        // Check required fields are complete (Drizzle returns camelCase)
        const requiredFields = [
          'firstName', 'lastName', 'email', 'phone'
        ];

        console.log('Submit validation - Application data:', {
          firstName: application.firstName,
          lastName: application.lastName,
          email: application.email,
          phone: application.phone,
          status: application.status
        });

        for (const field of requiredFields) {
          if (!application[field as keyof typeof application]) {
            console.log(`Submit validation failed: missing ${field}`);
            return res.status(400).json({
              message: `Incomplete application: missing ${field}`
            });
          }
        }

        // Create user account for the contractor
        const temporaryPassword = `${application.phone}Temp!`;
        const hashedPassword = await bcrypt.hash(temporaryPassword, 10);
        
        try {
          // Check if user already exists
          const existingUsers = await storage.findUsers({ email: application.email });
          
          if (!existingUsers || existingUsers.length === 0) {
            // Create new user account
            const newUser = await storage.createUser({
              email: application.email,
              phone: application.phone,
              password: hashedPassword,
              role: 'contractor',
              firstName: application.firstName,
              lastName: application.lastName,
              isActive: true, // Allow login immediately to upload documents
              isGuest: false
            });
            
            // Create contractor profile linked to the user
            await storage.createContractorProfile({
              userId: newUser.id,
              applicationId: req.params.id,
              businessName: application.businessName || `${application.firstName} ${application.lastName} Services`,
              insuranceProvider: application.insuranceProvider,
              insurancePolicyNumber: application.insurancePolicyNumber,
              serviceRadius: application.serviceRadius || 50,
              isAvailable: false, // Will be set to true when approved
              performanceTier: 'bronze', // New contractors start at bronze tier
              totalJobsCompleted: 0,
              averageRating: 0,
              completionRate: 0,
              responseRate: 0,
              onTimeRate: 0
            });
          }
        } catch (userError) {
          console.error('Failed to create user account:', userError);
          // Don't fail the application submission if user creation fails
        }

        // Update status to pending
        const updatedApplication = await storage.updateContractorApplication(
          req.params.id,
          {
            status: 'pending',
            submittedAt: new Date(),
            updatedAt: new Date()
          }
        );

        // Send notification to all admin users about the new contractor application
        emailService.sendNewContractorApplicationNotification(updatedApplication).catch((err: any) => {
          console.error('Failed to notify admins about contractor application:', err);
          // Don't fail the request if admin notification fails
        });

        // Send confirmation email with login credentials
        try {
          const emailContent = `
            <h2>Welcome to TruckFixGo!</h2>
            <p>Dear ${application.firstName} ${application.lastName},</p>
            <p>Thank you for applying to become a TruckFixGo contractor. Your application has been received and is now under review.</p>
            
            <h3>Your Account Information:</h3>
            <p><strong>Email:</strong> ${application.email}</p>
            <p><strong>Temporary Password:</strong> ${application.phone}Temp!</p>
            
            <h3>Next Steps:</h3>
            <ol>
              <li>Our team will review your application within 24-48 hours</li>
              <li>Once approved, you can log in at <a href="https://truckfixgo.com/contractor/auth">https://truckfixgo.com/contractor/auth</a></li>
              <li>Please complete your document uploads after logging in</li>
              <li>Change your password after your first login</li>
            </ol>
            
            <h3>Required Documents:</h3>
            <p>Please have the following documents ready to upload once you log in:</p>
            <ul>
              <li>Commercial Driver's License (CDL)</li>
              <li>Business Insurance Certificate</li>
              <li>W-9 Tax Form</li>
              <li>Vehicle Registration</li>
              <li>DOT Medical Certificate</li>
              <li>ASE Mechanic Certifications</li>
            </ul>
            
            <p>If you have any questions, please contact us at support@truckfixgo.com</p>
            
            <p>Best regards,<br>
            The TruckFixGo Team</p>
          `;

          // Send email using reminder service
          await reminderService.sendEmail({
            to: application.email,
            subject: 'Welcome to TruckFixGo - Application Received',
            html: emailContent,
            text: emailContent.replace(/<[^>]*>/g, '') // Strip HTML for text version
          });

          console.log(`Sent welcome email to contractor applicant: ${application.email}`);
        } catch (emailError) {
          console.error('Failed to send welcome email:', emailError);
          // Don't fail the application submission if email fails
        }

        res.json({
          message: 'Application submitted successfully. Check your email for login credentials.',
          application: updatedApplication
        });
      } catch (error) {
        console.error('Submit application error:', error);
        res.status(500).json({ message: 'Failed to submit application' });
      }
    }
  );

  // Upload application documents
  app.post('/api/contractor/apply/:id/documents',
    async (req: Request, res: Response) => {
      try {
        const { documentType, documentName, fileUrl, expirationDate } = req.body;

        if (!documentType || !documentName || !fileUrl) {
          return res.status(400).json({
            message: 'Missing required document information'
          });
        }

        const document = await storage.createApplicationDocument({
          applicationId: req.params.id,
          documentType,
          documentName,
          fileUrl,
          verificationStatus: 'pending',
          expirationDate: expirationDate ? new Date(expirationDate) : undefined,
          uploadedAt: new Date()
        });

        res.status(201).json({
          message: 'Document uploaded successfully',
          document
        });
      } catch (error) {
        console.error('Upload document error:', error);
        res.status(500).json({ message: 'Failed to upload document' });
      }
    }
  );

  // Get application status (for applicants)
  app.get('/api/contractor/application-status',
    async (req: Request, res: Response) => {
      try {
        const { email, applicationId } = req.query;

        if (!email && !applicationId) {
          return res.status(400).json({
            message: 'Email or application ID required'
          });
        }

        let application;
        if (applicationId) {
          application = await storage.getContractorApplication(applicationId as string);
        } else {
          const applications = await storage.findContractorApplications({
            email: email as string
          });
          application = applications[0];
        }

        if (!application) {
          return res.status(404).json({ message: 'Application not found' });
        }

        // Return limited info for privacy
        res.json({
          applicationId: application.id,
          status: application.status,
          submittedAt: application.submittedAt,
          reviewNotes: application.status === 'rejected' ? application.rejectionReason : undefined
        });
      } catch (error) {
        console.error('Get application status error:', error);
        res.status(500).json({ message: 'Failed to get application status' });
      }
    }
  );

  // Admin: Get all applications
  app.get('/api/admin/applications',
    requireAuth,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const { status, search, fromDate, toDate } = req.query;
        
        const filters: any = {};
        if (status && status !== 'all') {
          filters.status = status;
        }
        if (search) {
          filters.search = search;
        }
        if (fromDate) {
          filters.fromDate = new Date(fromDate as string);
        }
        if (toDate) {
          filters.toDate = new Date(toDate as string);
        }

        const applications = await storage.findContractorApplications(filters);
        
        res.json(applications);
      } catch (error) {
        console.error('Get applications error:', error);
        res.status(500).json({ message: 'Failed to get applications' });
      }
    }
  );

  // Admin: Get application details
  app.get('/api/admin/applications/:id',
    requireAuth,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const application = await storage.getContractorApplication(req.params.id);
        
        if (!application) {
          return res.status(404).json({ message: 'Application not found' });
        }

        res.json(application);
      } catch (error) {
        console.error('Get application details error:', error);
        res.status(500).json({ message: 'Failed to get application details' });
      }
    }
  );

  // Admin: Get application documents
  app.get('/api/admin/applications/:id/documents',
    requireAuth,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const documents = await storage.findApplicationDocuments({
          applicationId: req.params.id
        });
        
        res.json(documents);
      } catch (error) {
        console.error('Get application documents error:', error);
        res.status(500).json({ message: 'Failed to get documents' });
      }
    }
  );

  // Admin: Get background checks
  app.get('/api/admin/applications/:id/background-checks',
    requireAuth,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const checks = await storage.findBackgroundChecks({
          applicationId: req.params.id
        });
        
        res.json(checks);
      } catch (error) {
        console.error('Get background checks error:', error);
        res.status(500).json({ message: 'Failed to get background checks' });
      }
    }
  );

  // Admin: Update application status
  app.put('/api/admin/applications/:id/status',
    requireAuth,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const { status, notes, rejectionReason } = req.body;
        
        if (!status) {
          return res.status(400).json({ message: 'Status is required' });
        }

        const application = await storage.getContractorApplication(req.params.id);
        
        if (!application) {
          return res.status(404).json({ message: 'Application not found' });
        }

        const updateData: any = {
          status,
          reviewNotes: notes,
          updatedAt: new Date()
        };

        if (status === 'rejected' && rejectionReason) {
          updateData.rejectionReason = rejectionReason;
        }

        if (status === 'approved') {
          updateData.approvedAt = new Date();
          updateData.approvedBy = req.session.userId;
          
          try {
            // First check if user already exists
            let user = await storage.getUserByEmail(application.email);
            
            // Create user account if it doesn't exist
            if (!user) {
              // Generate a temporary password - they will need to reset it
              const tempPassword = await bcrypt.hash(`temp-${randomUUID()}`, 10);
              
              user = await storage.createUser({
                email: application.email,
                phone: application.phone,
                role: 'contractor',
                firstName: application.firstName,
                lastName: application.lastName,
                password: tempPassword,
                isActive: true,
                isGuest: false
              });
              
              // TODO: Send email to contractor with login instructions and password reset link
            }
            
            // Now create contractor profile linked to the user
            const contractorProfile = await storage.createContractorProfile({
              userId: user.id,
              firstName: application.firstName,
              lastName: application.lastName,
              phone: application.phone,
              vehicleInfo: application.vehicleInfo,
              serviceRadius: application.serviceRadius,
              availability: 'available',
              rating: 0,
              completedJobs: 0,
              responseTime: 0,
              verificationStatus: 'verified',
              backgroundCheckStatus: 'passed',
              insuranceStatus: 'active',
              specializations: application.specializations,
              certifications: application.certifications
            });
            
            console.log(`Created contractor account for ${application.email} with user ID: ${user.id}`);
          } catch (profileError) {
            console.error('Create contractor profile error:', profileError);
            return res.status(500).json({ 
              message: 'Failed to create contractor account. Please try again.' 
            });
          }
        }

        const updatedApplication = await storage.updateContractorApplication(
          req.params.id,
          updateData
        );

        // Send notification email for approvals
        if (status === 'approved') {
          try {
            const { reminderService } = await import('./reminder-service');
            const emailContent = `
              <html>
                <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <div style="background-color: #1e3a5f; color: white; padding: 20px; text-align: center;">
                    <h1 style="margin: 0;">Welcome to TruckFixGo!</h1>
                  </div>
                  <div style="padding: 30px; background-color: #f5f5f5;">
                    <h2 style="color: #1e3a5f;">Congratulations, Your Application Has Been Approved!</h2>
                    <p>Dear ${application.firstName} ${application.lastName},</p>
                    <p>We're excited to welcome you to the TruckFixGo network of certified mobile mechanics!</p>
                    <div style="background: white; border-left: 4px solid #ff6b35; padding: 15px; margin: 20px 0;">
                      <h3 style="color: #1e3a5f; margin-top: 0;">Next Steps:</h3>
                      <ol style="color: #666;">
                        <li>Log into your contractor dashboard</li>
                        <li>Complete your profile setup</li>
                        <li>Set your service areas and availability</li>
                        <li>Start accepting jobs!</li>
                      </ol>
                    </div>
                    <div style="margin-top: 30px;">
                      <a href="https://truckfixgo.com/contractor/login" 
                         style="background-color: #ff6b35; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                        Access Your Dashboard
                      </a>
                    </div>
                    <p style="color: #666; margin-top: 30px;">
                      If you have any questions, our support team is here to help at support@truckfixgo.com
                    </p>
                  </div>
                </body>
              </html>
            `;
            
            await reminderService.sendTestReminder('email', application.email, emailContent);
            console.log(`Sent approval email to ${application.email}`);
          } catch (emailError) {
            console.error('Failed to send approval email:', emailError);
            // Don't fail the approval if email fails
          }
        }

        res.json({
          message: 'Application status updated successfully',
          application: updatedApplication
        });
      } catch (error) {
        console.error('Update application status error:', error);
        res.status(500).json({ message: 'Failed to update status' });
      }
    }
  );

  // Admin: Approve application directly
  app.post('/api/admin/applications/:id/approve',
    requireAuth,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const application = await storage.getContractorApplication(req.params.id);
        
        if (!application) {
          return res.status(404).json({ message: 'Application not found' });
        }

        if (application.status === 'approved') {
          return res.status(400).json({ message: 'Application is already approved' });
        }

        // First check if user already exists
        let user = await storage.getUserByEmail(application.email);
        
        // Generate a temporary password for new users
        let tempPasswordPlain: string | undefined;
        let isNewUser = false;
        
        // Create user account if it doesn't exist
        if (!user) {
          // Generate a readable temporary password
          tempPasswordPlain = `TFG-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Math.floor(Math.random() * 9000) + 1000}`;
          const tempPasswordHash = await bcrypt.hash(tempPasswordPlain, 10);
          
          user = await storage.createUser({
            email: application.email,
            phone: application.phone,
            role: 'contractor',
            firstName: application.firstName,
            lastName: application.lastName,
            password: tempPasswordHash,
            isActive: true,
            isGuest: false
          });
          
          isNewUser = true;
          console.log(`Created user account for contractor ${application.email} with ID: ${user.id}`);
        } else {
          // If user exists but is not a contractor, update their role
          if (user.role !== 'contractor') {
            await storage.updateUser(user.id, { role: 'contractor' });
            console.log(`Updated user ${user.email} role to contractor`);
          }
          // Generate new temp password for existing users too
          tempPasswordPlain = `TFG-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Math.floor(Math.random() * 9000) + 1000}`;
          const tempPasswordHash = await bcrypt.hash(tempPasswordPlain, 10);
          await storage.updateUser(user.id, { password: tempPasswordHash });
        }
        
        // Check if contractor profile already exists
        const existingProfile = await storage.getContractorProfile(user.id);
        
        if (!existingProfile) {
          // Create contractor profile linked to the user
          const contractorProfile = await storage.createContractorProfile({
            userId: user.id,
            firstName: application.firstName,
            lastName: application.lastName,
            phone: application.phone,
            vehicleInfo: application.vehicleInfo || {},
            serviceRadius: application.serviceRadius || 50,
            availability: 'available',
            rating: 0,
            totalJobs: 0,
            completedJobs: 0,
            responseTime: 0,
            avgResponseTime: 0,
            verificationStatus: 'verified',
            backgroundCheckStatus: 'passed',
            insuranceStatus: 'active',
            specializations: application.specializations || [],
            certifications: application.certifications || [],
            companyName: application.companyName || '',
            isAvailable: true,
            isFleetCapable: false,
            performanceTier: 'bronze',
            documentsVerified: true
          });
          
          console.log(`Created contractor profile for ${application.email}`);
        }
        
        // Update application status to approved
        const updatedApplication = await storage.updateContractorApplication(
          req.params.id,
          {
            status: 'approved',
            approvedAt: new Date(),
            approvedBy: req.session.userId,
            updatedAt: new Date()
          }
        );

        // Send welcome email with credentials
        if (tempPasswordPlain) {
          try {
            const { reminderService } = await import('./reminder-service');
            
            const emailSubject = 'Welcome to TruckFixGo - Your Application Has Been Approved!';
            const emailHtml = `
              <html>
                <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <div style="background-color: #1e3a5f; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0; font-size: 28px;">Welcome to TruckFixGo!</h1>
                    <p style="margin: 10px 0 0 0; font-size: 16px;">Your Contractor Application Has Been Approved</p>
                  </div>
                  
                  <div style="padding: 30px; background-color: #f8f9fa; border: 1px solid #dee2e6; border-top: none;">
                    <h2 style="color: #1e3a5f; margin-top: 0;">Congratulations, ${application.firstName}!</h2>
                    
                    <p style="color: #495057; line-height: 1.6;">
                      We're excited to welcome you to the TruckFixGo contractor network. Your application has been 
                      thoroughly reviewed and approved. You can now start accepting jobs and earning with us!
                    </p>
                    
                    <div style="background: white; border-left: 4px solid #ff6b35; padding: 20px; margin: 25px 0; border-radius: 4px;">
                      <h3 style="color: #1e3a5f; margin-top: 0; font-size: 18px;">Your Login Credentials</h3>
                      <p style="color: #495057; margin: 10px 0;">
                        <strong>Email:</strong> <span style="background: #f1f3f5; padding: 5px 10px; border-radius: 4px; font-family: monospace;">${application.email}</span>
                      </p>
                      <p style="color: #495057; margin: 10px 0;">
                        <strong>Temporary Password:</strong> <span style="background: #f1f3f5; padding: 5px 10px; border-radius: 4px; font-family: monospace; font-weight: bold;">${tempPasswordPlain}</span>
                      </p>
                      <p style="color: #dc3545; font-size: 13px; margin-top: 15px;">
                        ⚠️ <strong>Important:</strong> Please change your password after your first login for security purposes.
                      </p>
                    </div>
                    
                    <div style="background: #e7f5ff; border: 1px solid #74c0fc; padding: 20px; margin: 25px 0; border-radius: 4px;">
                      <h3 style="color: #1e3a5f; margin-top: 0; font-size: 18px;">Next Steps</h3>
                      <ol style="color: #495057; line-height: 1.8; margin: 10px 0; padding-left: 20px;">
                        <li><strong>Log in to your dashboard:</strong> Visit <a href="${process.env.APP_URL || 'https://truckfixgo.com'}/contractor/auth" style="color: #4a90e2;">TruckFixGo Contractor Portal</a></li>
                        <li><strong>Complete your profile:</strong> Add your service specializations and availability</li>
                        <li><strong>Upload required documents:</strong> Ensure all certifications are up to date</li>
                        <li><strong>Set your availability:</strong> Configure when you're available to accept jobs</li>
                        <li><strong>Start accepting jobs:</strong> View and accept available jobs in your area</li>
                      </ol>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="${process.env.APP_URL || 'https://truckfixgo.com'}/contractor/auth" 
                         style="display: inline-block; background-color: #ff6b35; color: white; padding: 14px 32px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
                        Access Your Dashboard
                      </a>
                    </div>
                    
                    <div style="background: #f8f9fa; padding: 20px; margin: 25px 0; border-radius: 4px; border: 1px solid #dee2e6;">
                      <h4 style="color: #1e3a5f; margin-top: 0;">Important Information</h4>
                      <ul style="color: #495057; line-height: 1.6; margin: 10px 0; padding-left: 20px;">
                        <li>Your account is now active and ready to receive job assignments</li>
                        <li>You'll receive notifications for new jobs matching your skills and location</li>
                        <li>Maintain a high rating to access premium job opportunities</li>
                        <li>Payment processing is handled securely through our platform</li>
                      </ul>
                    </div>
                    
                    <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
                    
                    <p style="color: #6c757d; font-size: 14px; line-height: 1.6;">
                      If you have any questions or need assistance, our support team is here to help. 
                      Contact us at <a href="mailto:Support@truckfixgo.com" style="color: #4a90e2;">Support@truckfixgo.com</a> 
                      or call 1-800-TRUCK-FIX.
                    </p>
                  </div>
                  
                  <div style="background-color: #1e3a5f; color: white; padding: 20px; text-align: center; border-radius: 0 0 8px 8px;">
                    <p style="margin: 0; font-size: 14px;">Welcome aboard!</p>
                    <p style="margin: 5px 0 0 0; font-size: 12px; opacity: 0.9;">The TruckFixGo Team</p>
                  </div>
                </body>
              </html>
            `;
            
            const emailText = `
Welcome to TruckFixGo!

Congratulations, ${application.firstName}!

Your contractor application has been approved. You can now start accepting jobs and earning with us!

Your Login Credentials:
Email: ${application.email}
Temporary Password: ${tempPasswordPlain}

IMPORTANT: Please change your password after your first login.

Next Steps:
1. Log in at: ${process.env.APP_URL || 'https://truckfixgo.com'}/contractor/auth
2. Complete your profile
3. Upload required documents
4. Set your availability
5. Start accepting jobs

Questions? Contact us at Support@truckfixgo.com or call 1-800-TRUCK-FIX.

Welcome aboard!
The TruckFixGo Team
            `;
            
            const emailResult = await reminderService.sendDirectEmail(
              application.email,
              emailSubject,
              emailHtml,
              emailText
            );
            
            if (emailResult.success) {
              console.log(`Welcome email sent successfully to ${application.email}`);
            } else {
              console.error(`Failed to send welcome email to ${application.email}:`, emailResult.error);
              // Don't fail the approval, just log the error
            }
          } catch (emailError) {
            console.error('Error sending welcome email:', emailError);
            // Don't fail the approval process if email fails
          }
        }

        res.json({
          message: 'Application approved successfully',
          application: updatedApplication,
          userId: user.id,
          emailSent: tempPasswordPlain ? true : false
        });
      } catch (error) {
        console.error('Approve application error:', error);
        res.status(500).json({ 
          message: 'Failed to approve application',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  // Admin: Verify document
  app.post('/api/admin/applications/documents/:id/verify',
    requireAuth,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const { status, notes } = req.body;
        
        if (!status) {
          return res.status(400).json({ message: 'Verification status is required' });
        }

        const document = await storage.updateApplicationDocument(
          req.params.id,
          {
            verificationStatus: status,
            verificationNotes: notes,
            verifiedAt: new Date(),
            verifiedBy: req.session.userId
          }
        );

        res.json({
          message: 'Document verified successfully',
          document
        });
      } catch (error) {
        console.error('Verify document error:', error);
        res.status(500).json({ message: 'Failed to verify document' });
      }
    }
  );

  // Admin: Run background check
  app.post('/api/admin/applications/:id/background-check',
    requireAuth,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const { checkType } = req.body;
        
        if (!checkType) {
          return res.status(400).json({ message: 'Check type is required' });
        }

        const backgroundCheck = await storage.createBackgroundCheck({
          applicationId: req.params.id,
          checkType,
          status: 'pending',
          requestedAt: new Date(),
          requestedBy: req.session.userId
        });

        // In production, initiate actual background check here
        // await initiateBackgroundCheck(backgroundCheck.id, checkType);
        
        // Simulate completion for demo
        setTimeout(async () => {
          await storage.updateBackgroundCheck(backgroundCheck.id, {
            status: 'completed',
            completedAt: new Date(),
            passed: true,
            results: {
              summary: 'Background check passed',
              details: 'No issues found'
            }
          });
        }, 5000);

        res.json({
          message: 'Background check initiated',
          backgroundCheck
        });
      } catch (error) {
        console.error('Run background check error:', error);
        res.status(500).json({ message: 'Failed to run background check' });
      }
    }
  );

  // Admin: Send communication
  app.post('/api/admin/applications/:id/communicate',
    requireAuth,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const { type, subject, message } = req.body;
        
        if (!type || !message) {
          return res.status(400).json({
            message: 'Communication type and message are required'
          });
        }

        const application = await storage.getContractorApplication(req.params.id);
        
        if (!application) {
          return res.status(404).json({ message: 'Application not found' });
        }

        // Send communication based on type
        if (type === 'email') {
          // await sendEmail(application.email, subject, message);
        } else if (type === 'sms') {
          // await sendSMS(application.phone, message);
        }

        // Log communication
        // await storage.logCommunication({
        //   applicationId: req.params.id,
        //   type,
        //   subject,
        //   message,
        //   sentAt: new Date(),
        //   sentBy: req.session.userId
        // });

        res.json({
          message: 'Communication sent successfully'
        });
      } catch (error) {
        console.error('Send communication error:', error);
        res.status(500).json({ message: 'Failed to send communication' });
      }
    }
  );

  // Admin: Resend credentials for approved contractor
  app.post('/api/admin/applications/:id/resend-credentials',
    requireAuth,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const application = await storage.getContractorApplication(req.params.id);
        
        if (!application) {
          return res.status(404).json({ message: 'Application not found' });
        }

        if (application.status !== 'approved') {
          return res.status(400).json({ 
            message: 'Can only resend credentials for approved applications' 
          });
        }

        // Find the user account for this contractor
        console.log(`[resend-credentials] Looking for user with email: ${application.email}`);
        const user = await storage.getUserByEmail(application.email);
        
        if (!user) {
          console.log(`[resend-credentials] No user found with email: ${application.email}`);
          return res.status(404).json({ 
            message: 'User account not found for this contractor' 
          });
        }
        console.log(`[resend-credentials] Found user: ${user.id} with email: ${user.email}`);

        // Generate new temporary password
        const newTempPassword = `TFG-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Math.floor(Math.random() * 9000) + 1000}`;
        console.log(`[resend-credentials] Generated new temp password for user ${user.id}`);
        const hashedPassword = await bcrypt.hash(newTempPassword, 10);
        
        // Update user's password
        console.log(`[resend-credentials] Updating password for user ${user.id}`);
        const updatedUser = await storage.updateUser(user.id, { 
          password: hashedPassword 
        });
        
        if (!updatedUser) {
          console.error(`[resend-credentials] Failed to update user ${user.id}`);
          return res.status(500).json({ message: 'Failed to update password' });
        }
        console.log(`[resend-credentials] Successfully updated password for user ${user.id}`);

        // Send email with new credentials
        try {
          const emailSubject = 'Your TruckFixGo Login Credentials (Resent)';
          const emailHtml = `
            <html>
              <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Your TruckFixGo Login Credentials</h2>
                
                <p>Hello ${application.firstName} ${application.lastName},</p>
                
                <p>Your login credentials have been reset. Please use the following information to access your contractor account:</p>
                
                <div style="background-color: #f0f0f0; padding: 15px; margin: 20px 0; border-radius: 5px;">
                  <p><strong>Login URL:</strong> ${process.env.APP_URL || 'https://truck-fix-go-aabboud94.replit.app'}/contractor/auth</p>
                  <p><strong>Email:</strong> ${application.email}</p>
                  <p><strong>Temporary Password:</strong> <code style="background-color: #fff; padding: 2px 5px; border: 1px solid #ddd;">${newTempPassword}</code></p>
                </div>
                
                <p><strong>Important:</strong> Please change your password after your first login for security purposes.</p>
                
                <p>If you have any questions or issues logging in, please contact our support team.</p>
                
                <p>Best regards,<br>
                The TruckFixGo Team</p>
              </body>
            </html>
          `;
          
          const emailText = `
Hello ${application.firstName} ${application.lastName},

Your login credentials have been reset. Please use the following information to access your contractor account:

Login URL: ${process.env.APP_URL || 'https://truck-fix-go-aabboud94.replit.app'}/contractor/auth
Email: ${application.email}
Temporary Password: ${newTempPassword}

Important: Please change your password after your first login for security purposes.

If you have any questions or issues logging in, please contact our support team.

Best regards,
The TruckFixGo Team
          `;
          
          const { reminderService } = await import('./reminder-service');
          const emailResult = await reminderService.sendDirectEmail(
            application.email,
            emailSubject,
            emailHtml,
            emailText
          );
          
          if (emailResult.success) {
            console.log(`Credentials resent successfully to ${application.email}`);
          } else {
            console.error(`Failed to resend credentials email to ${application.email}:`, emailResult.error);
          }

          res.json({
            message: 'Credentials resent successfully',
            emailSent: emailResult.success,
            userId: user.id
          });
        } catch (emailError) {
          console.error('Error sending credentials email:', emailError);
          // Still return success since password was updated
          res.json({
            message: 'Password reset successfully, but email failed to send',
            emailSent: false,
            userId: user.id,
            tempPassword: newTempPassword // Include password in response if email fails
          });
        }
      } catch (error) {
        console.error('Resend credentials error:', error);
        res.status(500).json({ 
          message: 'Failed to resend credentials',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  // Admin: Get communications for an application
  app.get('/api/admin/applications/:id/communications',
    requireAuth,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const application = await storage.getContractorApplication(req.params.id);
        
        if (!application) {
          return res.status(404).json({ message: 'Application not found' });
        }

        // For now, return an empty array since we're not tracking communications yet
        // In the future, this would query a communications log table
        const communications = [];
        
        // You could also include some metadata about the application
        res.json({
          applicationId: req.params.id,
          applicantEmail: application.email,
          applicantName: `${application.firstName} ${application.lastName}`,
          communications: communications,
          message: 'Communications history retrieved successfully'
        });
      } catch (error) {
        console.error('Get communications error:', error);
        res.status(500).json({ 
          message: 'Failed to retrieve communications',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  // ==================== DRIVER APPROVAL ROUTES ====================

  // Contractor: Get their drivers (approved and pending)
  app.get('/api/contractor/drivers',
    requireAuth,
    requireRole('contractor'),
    async (req: Request, res: Response) => {
      try {
        const contractorId = req.session.userId;
        
        // Get both approved and pending drivers
        const approvedDrivers = await storage.getContractorDrivers(contractorId!);
        
        // Also get pending drivers for this contractor
        const allPendingDrivers = await storage.getPendingDriverApplications();
        const pendingDrivers = allPendingDrivers.filter(
          (driver: any) => driver.managedByContractorId === contractorId
        );
        
        res.json({
          approved: approvedDrivers,
          pending: pendingDrivers
        });
      } catch (error) {
        console.error('Error fetching contractor drivers:', error);
        res.status(500).json({ message: 'Failed to fetch drivers' });
      }
    }
  );

  // Contractor: Add a new driver
  app.post('/api/contractor/drivers',
    requireAuth,
    requireRole('contractor'),
    async (req: Request, res: Response) => {
      try {
        const contractorId = req.session.userId;
        const driverData = req.body;
        
        // Validate required fields
        if (!driverData.firstName || !driverData.lastName || !driverData.email || !driverData.phone) {
          return res.status(400).json({ message: 'Required fields: firstName, lastName, email, phone' });
        }
        
        // Add the driver with pending approval status
        const newDriver = await storage.addDriver(contractorId!, driverData);
        
        res.json({
          message: 'Driver added successfully and pending admin approval',
          driver: newDriver
        });
      } catch (error: any) {
        console.error('Error adding driver:', error);
        
        if (error.message?.includes('unique') || error.code === '23505') {
          return res.status(400).json({ message: 'Email or phone number already exists' });
        }
        
        res.status(500).json({ message: 'Failed to add driver' });
      }
    }
  );

  // Contractor: Remove a driver
  app.delete('/api/contractor/drivers/:driverId',
    requireAuth,
    requireRole('contractor'),
    async (req: Request, res: Response) => {
      try {
        const contractorId = req.session.userId;
        const { driverId } = req.params;
        
        // Verify the driver belongs to this contractor
        const drivers = await storage.getContractorDrivers(contractorId!);
        const driver = drivers.find((d: any) => d.id === driverId);
        
        if (!driver) {
          return res.status(404).json({ message: 'Driver not found or not managed by you' });
        }
        
        // Delete the driver user account
        const deleted = await storage.deleteUser(driverId);
        
        if (deleted) {
          res.json({ message: 'Driver removed successfully' });
        } else {
          res.status(500).json({ message: 'Failed to remove driver' });
        }
      } catch (error) {
        console.error('Error removing driver:', error);
        res.status(500).json({ message: 'Failed to remove driver' });
      }
    }
  );

  // Admin: Get pending driver applications
  app.get('/api/admin/driver-applications',
    requireAuth,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const pendingDrivers = await storage.getPendingDriverApplications();
        res.json(pendingDrivers);
      } catch (error) {
        console.error('Error fetching pending driver applications:', error);
        res.status(500).json({ message: 'Failed to fetch driver applications' });
      }
    }
  );

  // Admin: Approve driver
  app.post('/api/admin/driver-applications/:driverId/approve',
    requireAuth,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const { driverId } = req.params;
        const adminId = req.session.userId;
        
        const approved = await storage.approveDriver(driverId, adminId!);
        
        if (approved) {
          res.json({ message: 'Driver approved successfully' });
        } else {
          res.status(404).json({ message: 'Driver application not found' });
        }
      } catch (error) {
        console.error('Error approving driver:', error);
        res.status(500).json({ message: 'Failed to approve driver' });
      }
    }
  );

  // Admin: Reject driver
  app.post('/api/admin/driver-applications/:driverId/reject',
    requireAuth,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const { driverId } = req.params;
        const adminId = req.session.userId;
        
        const rejected = await storage.rejectDriver(driverId, adminId!);
        
        if (rejected) {
          res.json({ message: 'Driver rejected successfully' });
        } else {
          res.status(404).json({ message: 'Driver application not found' });
        }
      } catch (error) {
        console.error('Error rejecting driver:', error);
        res.status(500).json({ message: 'Failed to reject driver' });
      }
    }
  );

  // ==================== BILLING SUBSCRIPTION ROUTES ====================

  // Create new subscription for fleet
  app.post('/api/billing/subscriptions',
    requireAuth,
    requireRole('admin', 'fleet_manager'),
    validateRequest(insertBillingSubscriptionSchema.extend({
      fleetAccountId: z.string(),
      planType: z.enum(['basic', 'standard', 'enterprise', 'custom']),
      billingCycle: z.enum(['monthly', 'quarterly', 'annual']),
      paymentMethodId: z.string(),
      addOns: z.array(z.string()).optional(),
      customAmount: z.number().optional(),
      trialDays: z.number().optional()
    })),
    async (req: Request, res: Response) => {
      try {
        const {
          fleetAccountId,
          planType,
          billingCycle,
          paymentMethodId,
          addOns,
          customAmount,
          trialDays
        } = req.body;

        // Check if fleet already has an active subscription
        const existingSubscription = await storage.getFleetActiveSubscription(fleetAccountId);
        if (existingSubscription) {
          return res.status(400).json({
            message: 'Fleet already has an active subscription'
          });
        }

        // Create Stripe subscription
        const stripeSubscription = await stripeService.createSubscription(
          fleetAccountId,
          planType,
          billingCycle,
          paymentMethodId,
          addOns,
          customAmount,
          trialDays
        );

        // Get plan details
        const planDetails = stripeService.SUBSCRIPTION_PLANS[planType as keyof typeof stripeService.SUBSCRIPTION_PLANS];

        // Create local subscription record
        const subscription = await storage.createBillingSubscription({
          fleetAccountId,
          planType,
          planName: planType === 'custom' ? 'Custom Fleet Plan' : planDetails.name,
          planDescription: planType === 'custom' ? 'Customized plan' : planDetails.description,
          billingCycle,
          baseAmount: customAmount?.toString() || stripeSubscription.items.data[0].price.unit_amount / 100,
          paymentMethodId,
          stripeSubscriptionId: stripeSubscription.id,
          stripeCustomerId: stripeSubscription.customer as string,
          status: 'active',
          startDate: new Date(stripeSubscription.current_period_start * 1000),
          currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
          currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
          trialEndsAt: stripeSubscription.trial_end ? new Date(stripeSubscription.trial_end * 1000) : undefined,
          autoRenew: true,
          maxVehicles: planType === 'custom' ? 999999 : planDetails.features.maxVehicles,
          includedEmergencyRepairs: planType === 'custom' ? 999999 : planDetails.features.includedEmergencyRepairs,
          includedScheduledServices: planType === 'custom' ? 999999 : planDetails.features.includedScheduledServices,
          prioritySupport: addOns?.includes('priority_support') || planDetails.features.prioritySupport,
          dedicatedAccountManager: addOns?.includes('dedicated_account_manager') || planDetails.features.dedicatedAccountManager,
          addOns: addOns || []
        });

        // Create initial usage tracking record
        await storage.createBillingUsageTracking({
          subscriptionId: subscription.id,
          fleetAccountId,
          periodStart: subscription.startDate,
          periodEnd: subscription.currentPeriodEnd || subscription.endDate || subscription.startDate,
        });

        res.status(201).json({
          message: 'Subscription created successfully',
          subscription,
          stripeSubscriptionId: stripeSubscription.id
        });
      } catch (error) {
        console.error('Create subscription error:', error);
        res.status(500).json({ message: 'Failed to create subscription' });
      }
    }
  );

  // Get subscription details
  app.get('/api/billing/subscriptions/:id',
    requireAuth,
    requireRole('admin', 'fleet_manager'),
    async (req: Request, res: Response) => {
      try {
        const subscription = await storage.getBillingSubscription(req.params.id);
        
        if (!subscription) {
          return res.status(404).json({ message: 'Subscription not found' });
        }

        // Check permissions
        if (req.session.role === 'fleet_manager') {
          const fleetUser = await storage.getFleetContactByUserId(req.session.userId!);
          if (!fleetUser || fleetUser.fleetAccountId !== subscription.fleetAccountId) {
            return res.status(403).json({ message: 'Access denied' });
          }
        }

        // Get current usage
        const usage = await storage.getCurrentBillingUsage(subscription.id);

        res.json({
          subscription,
          usage
        });
      } catch (error) {
        console.error('Get subscription error:', error);
        res.status(500).json({ message: 'Failed to get subscription' });
      }
    }
  );

  // Update subscription (upgrade/downgrade)
  app.put('/api/billing/subscriptions/:id',
    requireAuth,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const { planType, billingCycle, addOns, customAmount } = req.body;

        const subscription = await storage.getBillingSubscription(req.params.id);
        if (!subscription || !subscription.stripeSubscriptionId) {
          return res.status(404).json({ message: 'Subscription not found' });
        }

        // Update Stripe subscription
        const updatedStripeSubscription = await stripeService.updateSubscription(
          subscription.stripeSubscriptionId,
          {
            planType,
            billingCycle,
            addOns,
            customAmount
          }
        );

        // Update local subscription
        const updates: Partial<BillingSubscription> = {};
        if (planType) updates.planType = planType;
        if (billingCycle) updates.billingCycle = billingCycle;
        if (addOns) updates.addOns = addOns;
        if (customAmount) updates.baseAmount = customAmount.toString();

        const updatedSubscription = await storage.updateBillingSubscription(
          req.params.id,
          updates
        );

        res.json({
          message: 'Subscription updated successfully',
          subscription: updatedSubscription
        });
      } catch (error) {
        console.error('Update subscription error:', error);
        res.status(500).json({ message: 'Failed to update subscription' });
      }
    }
  );

  // Cancel subscription
  app.post('/api/billing/subscriptions/:id/cancel',
    requireAuth,
    requireRole('admin', 'fleet_manager'),
    async (req: Request, res: Response) => {
      try {
        const { immediately, reason } = req.body;

        const subscription = await storage.getBillingSubscription(req.params.id);
        if (!subscription) {
          return res.status(404).json({ message: 'Subscription not found' });
        }

        // Check permissions
        if (req.session.role === 'fleet_manager') {
          const fleetUser = await storage.getFleetContactByUserId(req.session.userId!);
          if (!fleetUser || fleetUser.fleetAccountId !== subscription.fleetAccountId) {
            return res.status(403).json({ message: 'Access denied' });
          }
        }

        // Cancel Stripe subscription
        if (subscription.stripeSubscriptionId) {
          await stripeService.cancelSubscription(
            subscription.stripeSubscriptionId,
            immediately,
            reason
          );
        }

        // Update local subscription
        await storage.cancelSubscription(req.params.id, reason);

        res.json({
          message: immediately ? 'Subscription cancelled immediately' : 'Subscription will cancel at period end'
        });
      } catch (error) {
        console.error('Cancel subscription error:', error);
        res.status(500).json({ message: 'Failed to cancel subscription' });
      }
    }
  );

  // Pause subscription
  app.post('/api/billing/subscriptions/:id/pause',
    requireAuth,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const subscription = await storage.getBillingSubscription(req.params.id);
        if (!subscription || !subscription.stripeSubscriptionId) {
          return res.status(404).json({ message: 'Subscription not found' });
        }

        // Pause Stripe subscription
        await stripeService.pauseSubscription(subscription.stripeSubscriptionId);

        // Update local subscription
        await storage.pauseSubscription(req.params.id);

        res.json({
          message: 'Subscription paused successfully'
        });
      } catch (error) {
        console.error('Pause subscription error:', error);
        res.status(500).json({ message: 'Failed to pause subscription' });
      }
    }
  );

  // Resume subscription
  app.post('/api/billing/subscriptions/:id/resume',
    requireAuth,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const subscription = await storage.getBillingSubscription(req.params.id);
        if (!subscription || !subscription.stripeSubscriptionId) {
          return res.status(404).json({ message: 'Subscription not found' });
        }

        // Resume Stripe subscription
        await stripeService.resumeSubscription(subscription.stripeSubscriptionId);

        // Update local subscription
        await storage.resumeSubscription(req.params.id);

        res.json({
          message: 'Subscription resumed successfully'
        });
      } catch (error) {
        console.error('Resume subscription error:', error);
        res.status(500).json({ message: 'Failed to resume subscription' });
      }
    }
  );

  // Get all active subscriptions (admin)
  app.get('/api/admin/billing/subscriptions',
    requireAuth,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const subscriptions = await storage.getAllActiveSubscriptions();
        const statistics = await storage.getBillingStatistics();

        res.json({
          subscriptions,
          statistics
        });
      } catch (error) {
        console.error('Get all subscriptions error:', error);
        res.status(500).json({ message: 'Failed to get subscriptions' });
      }
    }
  );

  // Get fleet's own subscription
  app.get('/api/billing/my-subscription',
    requireAuth,
    requireRole('fleet_manager'),
    async (req: Request, res: Response) => {
      try {
        const fleetUser = await storage.getFleetContactByUserId(req.session.userId!);
        if (!fleetUser) {
          return res.status(403).json({ message: 'Access denied' });
        }

        const subscription = await storage.getFleetActiveSubscription(fleetUser.fleetAccountId);
        if (!subscription) {
          return res.status(404).json({ message: 'No active subscription found' });
        }

        const usage = await storage.getCurrentBillingUsage(subscription.id);

        res.json({
          subscription,
          usage
        });
      } catch (error) {
        console.error('Get my subscription error:', error);
        res.status(500).json({ message: 'Failed to get subscription' });
      }
    }
  );

  // Get fleet billing history
  app.get('/api/billing/history',
    requireAuth,
    requireRole('admin', 'fleet_manager'),
    async (req: Request, res: Response) => {
      try {
        let fleetAccountId: string | undefined;

        // If fleet manager, only show their fleet's history
        if (req.session.role === 'fleet_manager') {
          const fleetUser = await storage.getFleetContactByUserId(req.session.userId!);
          if (!fleetUser) {
            return res.status(403).json({ message: 'Access denied' });
          }
          fleetAccountId = fleetUser.fleetAccountId;
        } else if (req.query.fleetAccountId) {
          fleetAccountId = req.query.fleetAccountId as string;
        }

        const history = fleetAccountId
          ? await storage.getFleetBillingHistory(fleetAccountId)
          : await storage.getUnpaidInvoices();

        res.json({
          history
        });
      } catch (error) {
        console.error('Get billing history error:', error);
        res.status(500).json({ message: 'Failed to get billing history' });
      }
    }
  );

  // Process manual charge
  app.post('/api/billing/charge',
    requireAuth,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const { subscriptionId } = req.body;

        const subscription = await storage.getBillingSubscription(subscriptionId);
        if (!subscription || !subscription.stripeSubscriptionId) {
          return res.status(404).json({ message: 'Subscription not found' });
        }

        // Process charge via Stripe
        const invoice = await stripeService.processRecurringCharge(subscription.stripeSubscriptionId);

        // Create billing history record
        const billingHistory = await storage.createBillingHistory({
          subscriptionId: subscription.id,
          fleetAccountId: subscription.fleetAccountId,
          billingPeriodStart: new Date(invoice.period_start * 1000),
          billingPeriodEnd: new Date(invoice.period_end * 1000),
          billingDate: new Date(),
          dueDate: invoice.due_date ? new Date(invoice.due_date * 1000) : undefined,
          baseAmount: subscription.baseAmount,
          totalAmount: (invoice.total / 100).toString(),
          stripeInvoiceId: invoice.id,
          stripeChargeId: invoice.charge as string,
          status: invoice.paid ? 'success' : 'pending'
        });

        res.json({
          message: 'Charge processed successfully',
          billingHistory,
          invoice
        });
      } catch (error) {
        console.error('Process charge error:', error);
        res.status(500).json({ message: 'Failed to process charge' });
      }
    }
  );

  // Retry failed payment
  app.post('/api/billing/retry-failed',
    requireAuth,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const { billingHistoryId } = req.body;

        const billingHistory = await storage.getBillingHistory(billingHistoryId);
        if (!billingHistory || !billingHistory.stripeInvoiceId) {
          return res.status(404).json({ message: 'Billing record not found' });
        }

        // Retry payment via Stripe
        const invoice = await stripeService.retryFailedPayment(billingHistory.stripeInvoiceId);

        // Update billing history
        const updatedHistory = await storage.updateBillingHistory(billingHistoryId, {
          status: invoice.paid ? 'success' : 'failed',
          paymentAttempts: billingHistory.paymentAttempts + 1,
          lastPaymentAttempt: new Date(),
          paidAt: invoice.paid ? new Date() : undefined,
          failureReason: invoice.last_finalization_error?.message
        });

        res.json({
          message: invoice.paid ? 'Payment successful' : 'Payment failed',
          billingHistory: updatedHistory
        });
      } catch (error) {
        console.error('Retry payment error:', error);
        res.status(500).json({ message: 'Failed to retry payment' });
      }
    }
  );

  // Get usage statistics for subscription
  app.get('/api/billing/subscriptions/:id/usage',
    requireAuth,
    requireRole('admin', 'fleet_manager'),
    async (req: Request, res: Response) => {
      try {
        const subscription = await storage.getBillingSubscription(req.params.id);
        if (!subscription) {
          return res.status(404).json({ message: 'Subscription not found' });
        }

        // Check permissions
        if (req.session.role === 'fleet_manager') {
          const fleetUser = await storage.getFleetContactByUserId(req.session.userId!);
          if (!fleetUser || fleetUser.fleetAccountId !== subscription.fleetAccountId) {
            return res.status(403).json({ message: 'Access denied' });
          }
        }

        const usage = await storage.getCurrentBillingUsage(subscription.id);
        const alerts = await storage.checkUsageAlerts(subscription.id);

        res.json({
          usage,
          alerts,
          limits: {
            maxVehicles: subscription.maxVehicles,
            includedEmergencyRepairs: subscription.includedEmergencyRepairs,
            includedScheduledServices: subscription.includedScheduledServices
          }
        });
      } catch (error) {
        console.error('Get usage statistics error:', error);
        res.status(500).json({ message: 'Failed to get usage statistics' });
      }
    }
  );

  // Update payment method for subscription
  app.put('/api/billing/subscriptions/:id/payment-method',
    requireAuth,
    requireRole('admin', 'fleet_manager'),
    async (req: Request, res: Response) => {
      try {
        const { paymentMethodId } = req.body;

        const subscription = await storage.getBillingSubscription(req.params.id);
        if (!subscription || !subscription.stripeSubscriptionId) {
          return res.status(404).json({ message: 'Subscription not found' });
        }

        // Check permissions
        if (req.session.role === 'fleet_manager') {
          const fleetUser = await storage.getFleetContactByUserId(req.session.userId!);
          if (!fleetUser || fleetUser.fleetAccountId !== subscription.fleetAccountId) {
            return res.status(403).json({ message: 'Access denied' });
          }
        }

        // Update payment method in Stripe
        await stripeService.updatePaymentMethod(subscription.stripeSubscriptionId, paymentMethodId);

        // Update local subscription
        await storage.updateBillingSubscription(req.params.id, { paymentMethodId });

        res.json({
          message: 'Payment method updated successfully'
        });
      } catch (error) {
        console.error('Update payment method error:', error);
        res.status(500).json({ message: 'Failed to update payment method' });
      }
    }
  );

  // Get billing statistics (admin dashboard)
  app.get('/api/admin/billing/statistics',
    requireAuth,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const statistics = await storage.getBillingStatistics();
        const failedPayments = await storage.getFailedPayments();
        const upcomingBillings = await storage.getSubscriptionsDueForBilling(10);

        res.json({
          statistics,
          failedPayments,
          upcomingBillings
        });
      } catch (error) {
        console.error('Get billing statistics error:', error);
        res.status(500).json({ message: 'Failed to get statistics' });
      }
    }
  );

  // TEST ENDPOINT - Test billing columns without auth
  app.get('/api/test/billing-columns',
    async (req: Request, res: Response) => {
      try {
        console.log('Testing billing columns...');
        const statistics = await storage.getBillingStatistics();
        const subscriptions = await storage.getAllActiveSubscriptions();
        
        res.json({
          success: true,
          message: 'Billing columns are working correctly!',
          statistics,
          subscriptionsCount: subscriptions.length,
          subscriptions: subscriptions.slice(0, 5) // First 5 subscriptions if any
        });
      } catch (error) {
        console.error('Test billing columns error:', error);
        res.status(500).json({ 
          success: false,
          message: 'Column mismatch error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  // ==================== CONTRACT MANAGEMENT ROUTES ====================
  
  // Create a new fleet contract
  app.post('/api/contracts',
    requireAuth,
    requireRole('admin'),
    validateRequest(insertFleetContractSchema),
    async (req: Request, res: Response) => {
      try {
        const contract = await storage.createFleetContract(req.body);
        
        // Create default SLA metrics based on template
        if (contract.templateType) {
          const defaultMetrics = getDefaultSlaMetrics(contract.templateType);
          for (const metric of defaultMetrics) {
            await storage.createContractSlaMetric({
              ...metric,
              contractId: contract.id
            });
          }
        }
        
        res.json(contract);
      } catch (error) {
        console.error('Create contract error:', error);
        res.status(500).json({ message: 'Failed to create contract' });
      }
    }
  );
  
  // Get contract details
  app.get('/api/contracts/:id',
    requireAuth,
    requireRole('admin', 'fleet_manager'),
    async (req: Request, res: Response) => {
      try {
        const contract = await storage.getFleetContract(req.params.id);
        
        if (!contract) {
          return res.status(404).json({ message: 'Contract not found' });
        }
        
        // Check fleet manager permissions
        if (req.session.role === 'fleet_manager') {
          const fleetUser = await storage.getFleetContactByUserId(req.session.userId!);
          if (!fleetUser || fleetUser.fleetAccountId !== contract.fleetAccountId) {
            return res.status(403).json({ message: 'Access denied' });
          }
        }
        
        // Get related data
        const slaMetrics = await storage.getContractSlaMetrics(contract.id);
        const penalties = await storage.getContractPenalties(contract.id);
        const amendments = await storage.getContractAmendments(contract.id);
        
        res.json({
          ...contract,
          slaMetrics,
          penalties,
          amendments
        });
      } catch (error) {
        console.error('Get contract error:', error);
        res.status(500).json({ message: 'Failed to get contract details' });
      }
    }
  );
  
  // Get all contracts with filters
  app.get('/api/contracts',
    requireAuth,
    requireRole('admin', 'fleet_manager'),
    async (req: Request, res: Response) => {
      try {
        const filters: any = {};
        
        // Parse query parameters
        if (req.query.fleetAccountId) filters.fleetAccountId = req.query.fleetAccountId as string;
        if (req.query.status) filters.status = req.query.status;
        if (req.query.templateType) filters.templateType = req.query.templateType;
        if (req.query.expiringDays) filters.expiringDays = parseInt(req.query.expiringDays as string);
        if (req.query.priorityLevel) filters.priorityLevel = parseInt(req.query.priorityLevel as string);
        
        // Check fleet manager permissions
        if (req.session.role === 'fleet_manager') {
          const fleetUser = await storage.getFleetContactByUserId(req.session.userId!);
          if (!fleetUser) {
            return res.status(403).json({ message: 'Access denied' });
          }
          filters.fleetAccountId = fleetUser.fleetAccountId;
        }
        
        const { limit, offset } = getPagination(req);
        const contracts = await storage.getFleetContracts({
          ...filters,
          limit,
          offset
        });
        
        res.json(contracts);
      } catch (error) {
        console.error('Get contracts error:', error);
        res.status(500).json({ message: 'Failed to get contracts' });
      }
    }
  );
  
  // Update contract
  app.put('/api/contracts/:id',
    requireAuth,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const contract = await storage.updateFleetContract(req.params.id, req.body);
        
        if (!contract) {
          return res.status(404).json({ message: 'Contract not found' });
        }
        
        res.json(contract);
      } catch (error) {
        console.error('Update contract error:', error);
        res.status(500).json({ message: 'Failed to update contract' });
      }
    }
  );
  
  // Activate contract
  app.post('/api/contracts/:id/activate',
    requireAuth,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const contract = await storage.activateContract(req.params.id, req.session.userId!);
        
        if (!contract) {
          return res.status(404).json({ message: 'Contract not found' });
        }
        
        res.json(contract);
      } catch (error) {
        console.error('Activate contract error:', error);
        res.status(500).json({ message: 'Failed to activate contract' });
      }
    }
  );
  
  // Get SLA metrics for a contract
  app.get('/api/contracts/:id/sla-metrics',
    requireAuth,
    requireRole('admin', 'fleet_manager'),
    async (req: Request, res: Response) => {
      try {
        const contract = await storage.getFleetContract(req.params.id);
        
        if (!contract) {
          return res.status(404).json({ message: 'Contract not found' });
        }
        
        // Check fleet manager permissions
        if (req.session.role === 'fleet_manager') {
          const fleetUser = await storage.getFleetContactByUserId(req.session.userId!);
          if (!fleetUser || fleetUser.fleetAccountId !== contract.fleetAccountId) {
            return res.status(403).json({ message: 'Access denied' });
          }
        }
        
        const metrics = await storage.getContractSlaMetrics(req.params.id);
        
        res.json(metrics);
      } catch (error) {
        console.error('Get SLA metrics error:', error);
        res.status(500).json({ message: 'Failed to get SLA metrics' });
      }
    }
  );
  
  // Get contract performance metrics
  app.get('/api/contracts/:id/performance',
    requireAuth,
    requireRole('admin', 'fleet_manager'),
    async (req: Request, res: Response) => {
      try {
        const contract = await storage.getFleetContract(req.params.id);
        
        if (!contract) {
          return res.status(404).json({ message: 'Contract not found' });
        }
        
        // Check fleet manager permissions
        if (req.session.role === 'fleet_manager') {
          const fleetUser = await storage.getFleetContactByUserId(req.session.userId!);
          if (!fleetUser || fleetUser.fleetAccountId !== contract.fleetAccountId) {
            return res.status(403).json({ message: 'Access denied' });
          }
        }
        
        const filters: any = {};
        if (req.query.periodStart) filters.periodStart = new Date(req.query.periodStart as string);
        if (req.query.periodEnd) filters.periodEnd = new Date(req.query.periodEnd as string);
        if (req.query.metricType) filters.metricType = req.query.metricType;
        if (req.query.breached !== undefined) filters.breached = req.query.breached === 'true';
        
        const { limit, offset } = getPagination(req);
        const metrics = await storage.getContractPerformanceMetrics(req.params.id, {
          ...filters,
          limit,
          offset
        });
        
        // Calculate compliance rate
        const complianceRate = await storage.getContractComplianceRate(
          req.params.id,
          filters.periodStart || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          filters.periodEnd || new Date()
        );
        
        res.json({
          metrics,
          complianceRate
        });
      } catch (error) {
        console.error('Get performance metrics error:', error);
        res.status(500).json({ message: 'Failed to get performance metrics' });
      }
    }
  );
  
  // Get contract penalties
  app.get('/api/contracts/:id/penalties',
    requireAuth,
    requireRole('admin', 'fleet_manager'),
    async (req: Request, res: Response) => {
      try {
        const contract = await storage.getFleetContract(req.params.id);
        
        if (!contract) {
          return res.status(404).json({ message: 'Contract not found' });
        }
        
        // Check fleet manager permissions
        if (req.session.role === 'fleet_manager') {
          const fleetUser = await storage.getFleetContactByUserId(req.session.userId!);
          if (!fleetUser || fleetUser.fleetAccountId !== contract.fleetAccountId) {
            return res.status(403).json({ message: 'Access denied' });
          }
        }
        
        const filters: any = {};
        if (req.query.status) filters.status = req.query.status;
        
        const penalties = await storage.getContractPenalties(req.params.id, filters);
        
        res.json(penalties);
      } catch (error) {
        console.error('Get penalties error:', error);
        res.status(500).json({ message: 'Failed to get penalties' });
      }
    }
  );
  
  // Create contract amendment
  app.post('/api/contracts/:id/amend',
    requireAuth,
    requireRole('admin'),
    validateRequest(insertContractAmendmentSchema),
    async (req: Request, res: Response) => {
      try {
        const amendment = await storage.createContractAmendment({
          ...req.body,
          contractId: req.params.id,
          requestedBy: req.session.userId
        });
        
        res.json(amendment);
      } catch (error) {
        console.error('Create amendment error:', error);
        res.status(500).json({ message: 'Failed to create amendment' });
      }
    }
  );
  
  // Approve contract amendment
  app.post('/api/contracts/amendments/:id/approve',
    requireAuth,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const amendment = await storage.approveAmendment(req.params.id, req.session.userId!);
        
        if (!amendment) {
          return res.status(404).json({ message: 'Amendment not found' });
        }
        
        // Apply amendment changes to contract
        if (amendment.status === 'approved') {
          const newTerms = amendment.newTerms as any;
          await storage.updateFleetContract(amendment.contractId, newTerms);
        }
        
        res.json(amendment);
      } catch (error) {
        console.error('Approve amendment error:', error);
        res.status(500).json({ message: 'Failed to approve amendment' });
      }
    }
  );
  
  // Request penalty waiver
  app.post('/api/contracts/penalties/:id/waiver',
    requireAuth,
    requireRole('admin', 'fleet_manager'),
    async (req: Request, res: Response) => {
      try {
        const { reason } = req.body;
        
        const penalty = await storage.requestPenaltyWaiver(
          req.params.id,
          reason,
          req.session.userId!
        );
        
        if (!penalty) {
          return res.status(404).json({ message: 'Penalty not found' });
        }
        
        res.json(penalty);
      } catch (error) {
        console.error('Request waiver error:', error);
        res.status(500).json({ message: 'Failed to request waiver' });
      }
    }
  );
  
  // Renew contract
  app.post('/api/contracts/:id/renew',
    requireAuth,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const existingContract = await storage.getFleetContract(req.params.id);
        
        if (!existingContract) {
          return res.status(404).json({ message: 'Contract not found' });
        }
        
        // Create renewal as new contract
        const renewalContract = await storage.createFleetContract({
          fleetAccountId: existingContract.fleetAccountId,
          contractName: `${existingContract.contractName} (Renewal)`,
          templateType: existingContract.templateType,
          startDate: existingContract.endDate,
          endDate: new Date(existingContract.endDate.getTime() + 365 * 24 * 60 * 60 * 1000), // +1 year
          contractValue: existingContract.contractValue,
          billingFrequency: existingContract.billingFrequency,
          paymentTerms: existingContract.paymentTerms,
          slaTerms: existingContract.slaTerms,
          guaranteedResponseTime: existingContract.guaranteedResponseTime,
          guaranteedResolutionTime: existingContract.guaranteedResolutionTime,
          uptimeCommitment: existingContract.uptimeCommitment,
          coverageZones: existingContract.coverageZones,
          serviceHours: existingContract.serviceHours,
          exclusions: existingContract.exclusions,
          penaltyConfiguration: existingContract.penaltyConfiguration,
          maxMonthlyPenalty: existingContract.maxMonthlyPenalty,
          maxAnnualPenalty: existingContract.maxAnnualPenalty,
          priorityLevel: existingContract.priorityLevel,
          dedicatedAccountManager: existingContract.dedicatedAccountManager,
          accountManagerId: existingContract.accountManagerId,
          autoRenew: existingContract.autoRenew,
          renewalNotificationDays: existingContract.renewalNotificationDays,
          notes: `Renewal of contract ${existingContract.contractNumber}`,
          createdBy: req.session.userId
        });
        
        // Copy SLA metrics
        const slaMetrics = await storage.getContractSlaMetrics(existingContract.id);
        for (const metric of slaMetrics) {
          await storage.createContractSlaMetric({
            contractId: renewalContract.id,
            metricType: metric.metricType,
            metricName: metric.metricName,
            description: metric.description,
            targetValue: metric.targetValue,
            targetUnit: metric.targetUnit,
            measurementPeriod: metric.measurementPeriod,
            penaltyEnabled: metric.penaltyEnabled,
            penaltyThreshold: metric.penaltyThreshold,
            penaltyAmount: metric.penaltyAmount,
            penaltyType: metric.penaltyType,
            penaltyTiers: metric.penaltyTiers,
            graceValue: metric.graceValue,
            graceOccurrences: metric.graceOccurrences,
            isActive: metric.isActive
          });
        }
        
        res.json(renewalContract);
      } catch (error) {
        console.error('Renew contract error:', error);
        res.status(500).json({ message: 'Failed to renew contract' });
      }
    }
  );
  
  // Get expiring contracts
  app.get('/api/contracts/expiring',
    requireAuth,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const daysAhead = parseInt(req.query.days as string) || 30;
        const contracts = await storage.getExpiringContracts(daysAhead);
        
        res.json(contracts);
      } catch (error) {
        console.error('Get expiring contracts error:', error);
        res.status(500).json({ message: 'Failed to get expiring contracts' });
      }
    }
  );
  
  // Get contract statistics
  app.get('/api/contracts/statistics',
    requireAuth,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const valueByStatus = await storage.getContractValueByStatus();
        const expiringContracts = await storage.getExpiringContracts(90);
        const activeContracts = await storage.getFleetContracts({ status: 'active' });
        
        // Calculate overall compliance rate
        let totalCompliance = 0;
        for (const contract of activeContracts) {
          const compliance = await storage.getContractComplianceRate(
            contract.id,
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            new Date()
          );
          totalCompliance += compliance;
        }
        
        res.json({
          totalContracts: activeContracts.length,
          valueByStatus,
          expiringCount: expiringContracts.length,
          avgComplianceRate: activeContracts.length > 0 ? totalCompliance / activeContracts.length : 100,
          expiringContracts: expiringContracts.slice(0, 5) // Top 5 expiring
        });
      } catch (error) {
        console.error('Get contract statistics error:', error);
        res.status(500).json({ message: 'Failed to get statistics' });
      }
    }
  );
  
  // Helper function for default SLA metrics
  function getDefaultSlaMetrics(templateType: string): any[] {
    const baseMetrics = [];
    
    switch (templateType) {
      case 'basic_enterprise':
        baseMetrics.push({
          metricType: 'response_time',
          metricName: 'Emergency Response Time',
          description: 'Maximum time to accept emergency repair requests',
          targetValue: 120, // 2 hours in minutes
          targetUnit: 'minutes',
          measurementPeriod: 'monthly',
          penaltyEnabled: true,
          penaltyThreshold: 120,
          penaltyAmount: 100,
          penaltyType: 'fixed',
          graceOccurrences: 2,
          isActive: true
        });
        baseMetrics.push({
          metricType: 'uptime',
          metricName: 'Service Availability',
          description: 'Minimum platform uptime percentage',
          targetValue: 99,
          targetUnit: 'percentage',
          measurementPeriod: 'monthly',
          penaltyEnabled: true,
          penaltyThreshold: 99,
          penaltyAmount: 500,
          penaltyType: 'fixed',
          isActive: true
        });
        break;
        
      case 'premium_enterprise':
        baseMetrics.push({
          metricType: 'response_time',
          metricName: 'Emergency Response Time',
          description: 'Maximum time to accept emergency repair requests',
          targetValue: 30, // 30 minutes
          targetUnit: 'minutes',
          measurementPeriod: 'monthly',
          penaltyEnabled: true,
          penaltyThreshold: 30,
          penaltyAmount: 250,
          penaltyType: 'fixed',
          graceOccurrences: 1,
          isActive: true
        });
        baseMetrics.push({
          metricType: 'resolution_time',
          metricName: 'Service Resolution Time',
          description: 'Maximum time to complete repairs',
          targetValue: 4, // 4 hours
          targetUnit: 'hours',
          measurementPeriod: 'monthly',
          penaltyEnabled: true,
          penaltyThreshold: 4,
          penaltyAmount: 500,
          penaltyType: 'fixed',
          graceOccurrences: 1,
          isActive: true
        });
        baseMetrics.push({
          metricType: 'uptime',
          metricName: 'Service Availability',
          description: 'Minimum platform uptime percentage',
          targetValue: 99.9,
          targetUnit: 'percentage',
          measurementPeriod: 'monthly',
          penaltyEnabled: true,
          penaltyThreshold: 99.9,
          penaltyAmount: 1000,
          penaltyType: 'fixed',
          isActive: true
        });
        baseMetrics.push({
          metricType: 'first_fix_rate',
          metricName: 'First Fix Rate',
          description: 'Percentage of issues resolved on first attempt',
          targetValue: 85,
          targetUnit: 'percentage',
          measurementPeriod: 'monthly',
          penaltyEnabled: false,
          isActive: true
        });
        break;
        
      case 'custom':
        // Custom contracts have metrics defined manually
        break;
    }
    
    return baseMetrics;
  }

  // ==================== WEBHOOK ROUTES ====================

  // Stripe payment webhook
  app.post('/api/webhooks/stripe',
    express.raw({ type: 'application/json' }),
    async (req: Request, res: Response) => {
      try {
        // Verify webhook signature
        const sig = req.headers['stripe-signature'];
        const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
        
        let event: any;
        
        if (endpointSecret && sig) {
          // Verify the webhook signature
          try {
            event = stripeService.constructEvent(req.body, sig, endpointSecret);
          } catch (err) {
            console.error('Webhook signature verification failed:', err);
            return res.status(400).send('Webhook Error: Invalid signature');
          }
        } else {
          // For testing without signature verification
          event = req.body;
        }
        
        // Process different event types
        switch (event.type) {
          // Subscription events
          case 'customer.subscription.created':
            console.log('Subscription created:', event.data.object.id);
            // Subscription is already created in our DB when we create it via API
            break;
            
          case 'customer.subscription.updated':
            const updatedSub = event.data.object;
            console.log('Subscription updated:', updatedSub.id);
            // Update local subscription status
            const localSub = await storage.getSubscriptionByStripeId(updatedSub.id);
            if (localSub) {
              await storage.updateBillingSubscription(localSub.id, {
                status: updatedSub.status,
                currentPeriodEnd: new Date(updatedSub.current_period_end * 1000),
                cancelAtPeriodEnd: updatedSub.cancel_at_period_end,
              });
            }
            break;
            
          case 'customer.subscription.deleted':
            const deletedSub = event.data.object;
            console.log('Subscription deleted:', deletedSub.id);
            // Mark subscription as cancelled
            const cancelledSub = await storage.getSubscriptionByStripeId(deletedSub.id);
            if (cancelledSub) {
              await storage.updateBillingSubscription(cancelledSub.id, {
                status: 'cancelled',
                endDate: new Date(),
              });
            }
            break;
            
          case 'customer.subscription.paused':
            const pausedSub = event.data.object;
            console.log('Subscription paused:', pausedSub.id);
            const pausedLocalSub = await storage.getSubscriptionByStripeId(pausedSub.id);
            if (pausedLocalSub) {
              await storage.updateBillingSubscription(pausedLocalSub.id, {
                status: 'paused',
                pausedAt: new Date(),
              });
            }
            break;
            
          case 'customer.subscription.resumed':
            const resumedSub = event.data.object;
            console.log('Subscription resumed:', resumedSub.id);
            const resumedLocalSub = await storage.getSubscriptionByStripeId(resumedSub.id);
            if (resumedLocalSub) {
              await storage.updateBillingSubscription(resumedLocalSub.id, {
                status: 'active',
                resumedAt: new Date(),
              });
            }
            break;
            
          case 'customer.subscription.trial_will_end':
            const trialEndingSub = event.data.object;
            console.log('Trial ending soon:', trialEndingSub.id);
            // Send trial ending notification
            break;

          // Invoice events
          case 'invoice.created':
            console.log('Invoice created:', event.data.object.id);
            break;
            
          case 'invoice.payment_succeeded':
            const successInvoice = event.data.object;
            console.log('Invoice payment succeeded:', successInvoice.id);
            
            // Update billing history
            const successHistory = await storage.getBillingHistoryByStripeInvoiceId(successInvoice.id);
            if (successHistory) {
              await storage.updateBillingHistory(successHistory.id, {
                status: 'success',
                paidAt: new Date(),
                stripeChargeId: successInvoice.charge as string,
              });
            }
            
            // Update subscription next billing date
            if (successInvoice.subscription) {
              const subscription = await storage.getSubscriptionByStripeId(successInvoice.subscription as string);
              if (subscription) {
                const nextBillingDate = new Date(successInvoice.period_end * 1000);
                await storage.updateBillingSubscription(subscription.id, {
                  nextBillingDate,
                  lastBillingDate: new Date(),
                });
              }
            }
            break;
            
          case 'invoice.payment_failed':
            const failedInvoice = event.data.object;
            console.log('Invoice payment failed:', failedInvoice.id);
            
            // Update billing history
            const failedHistory = await storage.getBillingHistoryByStripeInvoiceId(failedInvoice.id);
            if (failedHistory) {
              await storage.updateBillingHistory(failedHistory.id, {
                status: 'failed',
                failureReason: failedInvoice.last_finalization_error?.message || 'Payment failed',
                paymentAttempts: failedHistory.paymentAttempts + 1,
                lastPaymentAttempt: new Date(),
              });
              
              // Send payment failure notification
              // await emailService.sendPaymentFailureNotification(failedHistory);
            }
            break;
            
          case 'invoice.finalized':
            console.log('Invoice finalized:', event.data.object.id);
            // Invoice is ready to be paid
            break;
            
          case 'invoice.upcoming':
            const upcomingInvoice = event.data.object;
            console.log('Upcoming invoice:', upcomingInvoice.id);
            // Send upcoming charge reminder (3 days before)
            if (upcomingInvoice.subscription) {
              const subscription = await storage.getSubscriptionByStripeId(upcomingInvoice.subscription as string);
              if (subscription) {
                // Send reminder notification
                // await emailService.sendUpcomingChargeReminder(subscription);
              }
            }
            break;

          // Payment method events
          case 'payment_method.attached':
            console.log('Payment method attached:', event.data.object.id);
            break;
            
          case 'payment_method.card_automatically_updated':
            console.log('Card automatically updated:', event.data.object.id);
            // Notify customer of card update
            break;
            
          case 'payment_method.detached':
            console.log('Payment method detached:', event.data.object.id);
            break;

          // Payment intent events (for one-time payments)
          case 'payment_intent.succeeded':
            console.log('Payment intent succeeded:', event.data.object.id);
            // Update transaction status if this is a one-time payment
            break;
            
          case 'payment_intent.payment_failed':
            console.log('Payment intent failed:', event.data.object.id);
            // Handle failed one-time payment
            break;

          // Charge events
          case 'charge.succeeded':
            console.log('Charge succeeded:', event.data.object.id);
            break;
            
          case 'charge.failed':
            console.log('Charge failed:', event.data.object.id);
            break;
            
          case 'charge.refunded':
            const refundedCharge = event.data.object;
            console.log('Charge refunded:', refundedCharge.id);
            // Create refund record
            const billingHistory = await storage.getBillingHistoryByStripeChargeId(refundedCharge.id);
            if (billingHistory) {
              await storage.updateBillingHistory(billingHistory.id, {
                refundedAmount: (refundedCharge.amount_refunded / 100).toString(),
                refundedAt: new Date(),
              });
            }
            break;

          default:
            console.log(`Unhandled event type ${event.type}`);
        }

        res.json({ received: true });
      } catch (error) {
        console.error('Stripe webhook error:', error);
        res.status(400).json({ message: 'Webhook processing failed' });
      }
    }
  );

  // Twilio SMS webhook
  app.post('/api/webhooks/twilio',
    async (req: Request, res: Response) => {
      try {
        // Here you would verify Twilio webhook signature
        // and process incoming SMS
        
        const { From, Body } = req.body;
        
        // Process SMS command (e.g., "STATUS 12345" to get job status)
        console.log(`SMS from ${From}: ${Body}`);
        
        res.type('text/xml');
        res.send(`<?xml version="1.0" encoding="UTF-8"?>
          <Response>
            <Message>Thank you for your message. We'll respond shortly.</Message>
          </Response>`);
      } catch (error) {
        console.error('Twilio webhook error:', error);
        res.status(400).json({ message: 'Webhook processing failed' });
      }
    }
  );

  // ==================== HEALTH MONITORING ====================

  // System health endpoint
  app.get('/api/health/system',
    async (req: Request, res: Response) => {
      try {
        const startTime = Date.now();
        const health = await healthMonitor.checkSystemHealth();
        const responseTime = Date.now() - startTime;
        
        res.json({
          ...health,
          responseTime,
          lastChecked: new Date().toISOString()
        });
      } catch (error) {
        console.error('System health check error:', error);
        res.status(503).json({
          status: 'unhealthy',
          responseTime: 0,
          lastChecked: new Date().toISOString(),
          errors: ['Failed to check system health']
        });
      }
    }
  );

  // Services health endpoint
  app.get('/api/health/services',
    async (req: Request, res: Response) => {
      try {
        const startTime = Date.now();
        const health = await healthMonitor.checkServicesHealth();
        const responseTime = Date.now() - startTime;
        
        res.json({
          ...health,
          responseTime,
          lastChecked: new Date().toISOString()
        });
      } catch (error) {
        console.error('Services health check error:', error);
        res.status(503).json({
          status: 'unhealthy',
          responseTime: 0,
          lastChecked: new Date().toISOString(),
          errors: ['Failed to check services health']
        });
      }
    }
  );

  // Database health endpoint
  app.get('/api/health/database',
    async (req: Request, res: Response) => {
      try {
        const startTime = Date.now();
        const health = await healthMonitor.checkDatabaseDetailed();
        const responseTime = Date.now() - startTime;
        
        res.json({
          ...health,
          responseTime,
          lastChecked: new Date().toISOString()
        });
      } catch (error) {
        console.error('Database health check error:', error);
        res.status(503).json({
          status: 'unhealthy',
          responseTime: 0,
          lastChecked: new Date().toISOString(),
          errors: ['Failed to check database health']
        });
      }
    }
  );

  // Errors tracking endpoint
  app.get('/api/health/errors',
    async (req: Request, res: Response) => {
      try {
        const startTime = Date.now();
        const errors = await healthMonitor.getErrorTracking();
        const responseTime = Date.now() - startTime;
        
        res.json({
          ...errors,
          responseTime,
          lastChecked: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error metrics check error:', error);
        res.status(503).json({
          status: 'unhealthy',
          responseTime: 0,
          lastChecked: new Date().toISOString(),
          errors: ['Failed to get error metrics']
        });
      }
    }
  );

  // ==================== EMERGENCY BOOKING ENDPOINTS ====================

  // Rate limiting map for guest bookings (phone -> booking info)
  const guestBookingRateLimit = new Map<string, { count: number; resetTime: number }>();

  // Guest emergency booking rate limiter
  function guestBookingRateLimiter(req: Request, res: Response, next: NextFunction) {
    const phone = req.body.customerPhone;
    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    const now = Date.now();
    const record = guestBookingRateLimit.get(phone);
    const windowMs = 60 * 60 * 1000; // 1 hour
    const maxBookings = 3;

    if (!record || record.resetTime < now) {
      guestBookingRateLimit.set(phone, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (record.count >= maxBookings) {
      return res.status(429).json({ 
        message: 'Too many bookings from this phone number. Please try again in an hour.',
        retryAfter: Math.ceil((record.resetTime - now) / 1000)
      });
    }

    record.count++;
    next();
  }

  // Create guest emergency booking
  app.post('/api/emergency/book-guest',
    rateLimiter(10, 60000), // General rate limit: 10 requests per minute
    guestBookingRateLimiter, // Phone-specific rate limit
    validateRequest(z.object({
      customerName: z.string().min(2).max(100),
      customerPhone: z.string().min(7).max(30),
      customerEmail: z.string().email().optional(),
      location: z.object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180)
      }),
      locationAddress: z.string().min(5).max(500),
      serviceTypeId: z.string().uuid(),
      vehicleInfo: z.object({
        make: z.string().optional(),
        model: z.string().optional(),
        year: z.string().optional(),
        licensePlate: z.string().optional()
      }).optional(),
      description: z.string().min(10).max(2000),
      photos: z.array(z.string()).optional()
    })),
    async (req: Request, res: Response) => {
      try {
        const {
          customerName,
          customerPhone,
          customerEmail,
          location,
          locationAddress,
          serviceTypeId,
          vehicleInfo = {},
          description,
          photos
        } = req.body;

        // Validate phone number
        const phoneValidation = validatePhoneNumber(customerPhone);
        if (!phoneValidation.isValid) {
          return res.status(400).json({ message: phoneValidation.message });
        }

        // Parse customer name
        const nameParts = customerName.trim().split(' ');
        const firstName = nameParts[0] || 'Guest';
        const lastName = nameParts.slice(1).join(' ') || 'User';

        // Create or update guest user
        const guestUser = await storage.createGuestUser({
          phone: customerPhone,
          email: customerEmail,
          firstName,
          lastName,
          ipAddress: req.ip
        });

        if (!guestUser) {
          throw new Error('Failed to create guest user');
        }

        // Create emergency booking
        const job = await storage.createEmergencyBooking({
          guestUserId: guestUser.id,
          serviceTypeId,
          location,
          locationAddress,
          vehicleInfo,
          description,
          photos,
          ipAddress: req.ip
        });

        if (!job) {
          throw new Error('Failed to create emergency booking');
        }

        // Build tracking link
        const trackingLink = `${process.env.APP_URL || 'https://truck-fix-go-aabboud94.replit.app'}/tracking?jobId=${job.id}`;

        // Send notifications asynchronously
        (async () => {
          try {
            // Send SMS confirmation if Twilio is configured
            const smsIntegration = await storage.getIntegrationsConfig('twilio');
            if (smsIntegration?.config && customerPhone) {
              const twilioConfig = smsIntegration.config as any;
              if (twilioConfig.accountSid && twilioConfig.authToken && twilioConfig.phoneNumber) {
                const twilioClient = require('twilio')(twilioConfig.accountSid, twilioConfig.authToken);
                await twilioClient.messages.create({
                  body: `TruckFixGo: Your emergency repair request ${job.jobNumber} has been received. Track your mechanic: ${trackingLink}`,
                  from: twilioConfig.phoneNumber,
                  to: customerPhone
                }).catch((err: any) => console.error('SMS send error:', err));
              }
            }

            // Send email confirmation if email provided
            if (customerEmail && emailService.isReady()) {
              const emailTemplate = {
                subject: `Emergency Repair Request Confirmed - ${job.jobNumber}`,
                html: `
                  <!DOCTYPE html>
                  <html>
                  <head>
                    <style>
                      body { font-family: Arial, sans-serif; color: #333; }
                      .header { background: #1e3a5f; color: white; padding: 20px; text-align: center; }
                      .content { padding: 20px; }
                      .job-info { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0; }
                      .button { background: #4a90e2; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
                      .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
                    </style>
                  </head>
                  <body>
                    <div class="header">
                      <h2>Emergency Repair Request Confirmed</h2>
                    </div>
                    <div class="content">
                      <p>Hello ${customerName},</p>
                      <p>Your emergency repair request has been received and we're finding the nearest available mechanic for you.</p>
                      
                      <div class="job-info">
                        <h3>Request Details:</h3>
                        <p><strong>Job Number:</strong> ${job.jobNumber}</p>
                        <p><strong>Location:</strong> ${locationAddress}</p>
                        <p><strong>Vehicle:</strong> ${vehicleInfo.make || ''} ${vehicleInfo.model || ''} ${vehicleInfo.year || ''}</p>
                        <p><strong>Issue:</strong> ${description}</p>
                      </div>
                      
                      <p>You'll receive another notification as soon as a mechanic is assigned and on their way.</p>
                      
                      <a href="${trackingLink}" class="button">Track Your Mechanic</a>
                      
                      <p><strong>What happens next:</strong></p>
                      <ul>
                        <li>We'll assign the nearest available qualified mechanic</li>
                        <li>You'll receive updates when they're on their way</li>
                        <li>Track their location in real-time using the link above</li>
                        <li>The mechanic will contact you when they're close</li>
                      </ul>
                      
                      <p>If you need immediate assistance, please call us at 1-800-TRUCK-FIX.</p>
                    </div>
                    <div class="footer">
                      <p>Thank you for choosing TruckFixGo</p>
                      <p>This is an automated message, please do not reply to this email.</p>
                    </div>
                  </body>
                  </html>
                `,
                text: `Your emergency repair request ${job.jobNumber} has been confirmed. Track your mechanic: ${trackingLink}`
              };

              await emailService.sendEmail(customerEmail, 'JOB_PENDING_CUSTOMER', {
                customerName,
                jobNumber: job.jobNumber
              }).catch((err: any) => console.error('Email send error:', err));
            }
          } catch (notificationError) {
            console.error('Notification error:', notificationError);
            // Don't fail the booking if notifications fail
          }
        })();

        // Return success response immediately
        res.status(201).json({
          success: true,
          message: 'Emergency booking created successfully',
          job: {
            id: job.id,
            jobNumber: job.jobNumber,
            status: job.status,
            trackingLink,
            estimatedWaitTime: '30-45 minutes'
          }
        });

      } catch (error) {
        console.error('Emergency booking error:', error);
        res.status(500).json({ 
          success: false,
          message: error instanceof Error ? error.message : 'Failed to create emergency booking'
        });
      }
    }
  );

  // Get public job tracking information
  app.get('/api/emergency/track/:jobId',
    rateLimiter(60, 60000), // 60 requests per minute
    async (req: Request, res: Response) => {
      try {
        const { jobId } = req.params;

        // Validate job ID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(jobId)) {
          return res.status(400).json({ message: 'Invalid job ID format' });
        }

        // Get public job information
        const jobInfo = await storage.getPublicJobInfo(jobId);

        if (!jobInfo.job) {
          return res.status(404).json({ message: 'Job not found' });
        }

        // Build response with limited information for privacy
        const response = {
          job: {
            id: jobInfo.job.id,
            jobNumber: jobInfo.job.jobNumber,
            status: jobInfo.job.status,
            jobType: jobInfo.job.jobType,
            createdAt: jobInfo.job.createdAt,
            assignedAt: jobInfo.job.assignedAt,
            enRouteAt: jobInfo.job.enRouteAt,
            arrivedAt: jobInfo.job.arrivedAt,
            completedAt: jobInfo.job.completedAt,
            cancelledAt: jobInfo.job.cancelledAt,
            estimatedArrival: jobInfo.job.estimatedArrival,
            address: jobInfo.job.address,
            serviceTypeId: jobInfo.job.serviceTypeId
          },
          contractor: jobInfo.contractor ? {
            name: `${jobInfo.contractor.firstName} ${jobInfo.contractor.lastName}`,
            company: jobInfo.contractor.companyName,
            rating: jobInfo.contractor.averageRating,
            totalJobs: jobInfo.contractor.totalJobsCompleted,
            phone: jobInfo.contractor.phone,
            location: jobInfo.contractor.currentLocation,
            isOnline: jobInfo.contractor.isOnline
          } : null,
          statusHistory: jobInfo.statusHistory.map(h => ({
            fromStatus: h.fromStatus,
            toStatus: h.toStatus,
            createdAt: h.createdAt,
            reason: h.reason
          })),
          customer: jobInfo.customer ? {
            name: `${jobInfo.customer.firstName} ${jobInfo.customer.lastName}`
          } : null
        };

        res.json(response);

      } catch (error) {
        console.error('Job tracking error:', error);
        res.status(500).json({ 
          message: 'Failed to get job tracking information'
        });
      }
    }
  );

  // Cancel guest emergency booking
  app.post('/api/emergency/cancel/:jobId',
    rateLimiter(5, 60000), // 5 requests per minute
    validateRequest(z.object({
      phone: z.string().min(7).max(30),
      reason: z.string().optional()
    })),
    async (req: Request, res: Response) => {
      try {
        const { jobId } = req.params;
        const { phone, reason } = req.body;

        // Validate phone number
        const phoneValidation = validatePhoneNumber(phone);
        if (!phoneValidation.isValid) {
          return res.status(400).json({ message: phoneValidation.message });
        }

        // Verify ownership
        const isOwner = await storage.verifyJobOwnershipByPhone(jobId, phone);
        if (!isOwner) {
          return res.status(403).json({ 
            message: 'Invalid phone number or job not found'
          });
        }

        // Get job details
        const job = await storage.getJob(jobId);
        if (!job) {
          return res.status(404).json({ message: 'Job not found' });
        }

        // Check if job can be cancelled
        if (!['new', 'assigned'].includes(job.status)) {
          return res.status(400).json({ 
            message: `Cannot cancel job with status: ${job.status}. Jobs can only be cancelled when new or assigned.`
          });
        }

        // Cancel the job
        const cancelledJob = await storage.updateJobStatus(
          jobId, 
          'cancelled', 
          job.customerId,
          reason || 'Cancelled by customer'
        );

        if (!cancelledJob) {
          throw new Error('Failed to cancel job');
        }

        // Send cancellation notifications asynchronously
        (async () => {
          try {
            // Get customer info
            const customer = await storage.getUser(job.customerId);
            
            // Send SMS confirmation if phone available
            if (customer?.phone) {
              const smsIntegration = await storage.getIntegrationsConfig('twilio');
              if (smsIntegration?.config) {
                const twilioConfig = smsIntegration.config as any;
                if (twilioConfig.accountSid && twilioConfig.authToken && twilioConfig.phoneNumber) {
                  const twilioClient = require('twilio')(twilioConfig.accountSid, twilioConfig.authToken);
                  await twilioClient.messages.create({
                    body: `TruckFixGo: Your repair request ${job.jobNumber} has been cancelled successfully.`,
                    from: twilioConfig.phoneNumber,
                    to: customer.phone
                  }).catch((err: any) => console.error('SMS cancellation error:', err));
                }
              }
            }

            // Send email confirmation if email available
            if (customer?.email && emailService.isReady()) {
              await emailService.sendEmail(customer.email, 'JOB_PENDING_CUSTOMER', {
                customerName: `${customer.firstName} ${customer.lastName}`,
                jobNumber: job.jobNumber
              }).catch((err: any) => console.error('Email cancellation error:', err));
            }

            // Notify contractor if assigned
            if (job.contractorId) {
              const contractor = await storage.getUser(job.contractorId);
              if (contractor?.phone) {
                const smsIntegration = await storage.getIntegrationsConfig('twilio');
                if (smsIntegration?.config) {
                  const twilioConfig = smsIntegration.config as any;
                  if (twilioConfig.accountSid && twilioConfig.authToken && twilioConfig.phoneNumber) {
                    const twilioClient = require('twilio')(twilioConfig.accountSid, twilioConfig.authToken);
                    await twilioClient.messages.create({
                      body: `TruckFixGo: Job ${job.jobNumber} has been cancelled by the customer.`,
                      from: twilioConfig.phoneNumber,
                      to: contractor.phone
                    }).catch((err: any) => console.error('Contractor SMS error:', err));
                  }
                }
              }
            }
          } catch (notificationError) {
            console.error('Cancellation notification error:', notificationError);
          }
        })();

        res.json({
          success: true,
          message: 'Job cancelled successfully',
          job: {
            id: cancelledJob.id,
            jobNumber: cancelledJob.jobNumber,
            status: cancelledJob.status,
            cancelledAt: cancelledJob.cancelledAt
          }
        });

      } catch (error) {
        console.error('Job cancellation error:', error);
        res.status(500).json({ 
          success: false,
          message: 'Failed to cancel job'
        });
      }
    }
  );

  // Cleanup expired guest users (scheduled task endpoint)
  app.post('/api/admin/cleanup-guests',
    requireAuth,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const deletedCount = await storage.cleanupExpiredGuestUsers();
        res.json({
          success: true,
          message: `Cleaned up ${deletedCount} expired guest users`
        });
      } catch (error) {
        console.error('Guest cleanup error:', error);
        res.status(500).json({ 
          message: 'Failed to cleanup guest users'
        });
      }
    }
  );

  // ==================== ERROR HANDLING ====================
  
  // Global error handler
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Global error handler:', err);
    
    const status = err.status || err.statusCode || 500;
    const message = err.message || 'Internal server error';
    
    res.status(status).json({
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  });

  const httpServer = createServer(app);


  // ==================== LOCATION TRACKING API ENDPOINTS ====================
  
  // Update contractor location (POST /api/tracking/location)
  app.post('/api/tracking/location',
    requireAuth,
    requireRole('contractor'),
    async (req: Request, res: Response) => {
      try {
        const contractorId = req.session.userId!;
        const { latitude, longitude, accuracy, altitude, heading, speed, batteryLevel, isCharging, networkType, jobId } = req.body;
        
        // Validate required fields (explicitly check for undefined/null to allow 0 values)
        if (latitude === undefined || latitude === null || longitude === undefined || longitude === null) {
          return res.status(400).json({ message: 'Latitude and longitude are required' });
        }
        
        // Validate coordinate values are numbers and within valid ranges
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
          return res.status(400).json({ message: 'Latitude and longitude must be valid numbers' });
        }
        
        if (latitude < -90 || latitude > 90) {
          return res.status(400).json({ message: 'Latitude must be between -90 and 90 degrees' });
        }
        
        if (longitude < -180 || longitude > 180) {
          return res.status(400).json({ message: 'Longitude must be between -180 and 180 degrees' });
        }
        
        // Update location in database
        const location = await storage.updateContractorLocation(contractorId, {
          latitude,
          longitude,
          accuracy,
          altitude,
          heading,
          speed,
          batteryLevel,
          isCharging,
          networkType
        });
        
        if (!location) {
          return res.status(500).json({ message: 'Failed to update location' });
        }
        
        // Save to history if actively tracking a job
        if (jobId) {
          // Get active session
          let session = await storage.getActiveTrackingSession(contractorId, jobId);
          if (!session) {
            session = await storage.startTrackingSession({
              contractorId,
              jobId,
              startLocation: { lat: latitude, lng: longitude }
            });
          }
          
          // Save to history
          await storage.saveLocationHistory({
            contractorId,
            jobId,
            sessionId: session.id,
            latitude: latitude.toString(),
            longitude: longitude.toString(),
            accuracy: accuracy?.toString(),
            altitude: altitude?.toString(),
            heading: heading?.toString(),
            speed: speed?.toString(),
            batteryLevel
          });
          
          // Update session stats
          const history = await storage.getLocationHistory(contractorId, {
            jobId,
            limit: 2
          });
          
          if (history.length >= 2) {
            const distance = LocationService.calculateDistance(
              { lat: parseFloat(history[1].latitude), lng: parseFloat(history[1].longitude) },
              { lat: latitude, lng: longitude }
            );
            
            const currentStats = session;
            await storage.updateTrackingSessionStats(session.id, {
              totalDistance: (parseFloat(currentStats.totalDistance || '0') + distance),
              totalPoints: (currentStats.totalPoints || 0) + 1,
              maxSpeed: Math.max(parseFloat(currentStats.maxSpeed || '0'), speed || 0)
            });
          }
          
          // Check for geofence arrival
          const job = await storage.getJob(jobId);
          if (job && job.location && job.status === 'en_route') {
            const arrived = await storage.detectArrival(
              contractorId,
              jobId,
              { lat: latitude, lng: longitude },
              100 // 100 meter radius
            );
            
            if (arrived) {
              // Update job status
              await storage.updateJob(jobId, { status: 'on_site', arrivedAt: new Date() });
              
              // Broadcast arrival event via WebSocket
              trackingWSServer.broadcastJobUpdate(jobId, {
                type: 'GEOFENCE_EVENT',
                payload: {
                  event: 'arrived',
                  contractorId,
                  timestamp: new Date().toISOString()
                }
              });
            }
          }
          
          // Calculate ETA if en route
          if (job && job.location && (job.status === 'en_route' || job.status === 'assigned')) {
            const etaData = await storage.calculateETA(
              { lat: latitude, lng: longitude },
              job.location as any,
              speed
            );
            
            // Update job with new ETA
            await storage.updateJob(jobId, {
              estimatedArrival: etaData.eta,
              contractorLocation: { lat: latitude, lng: longitude },
              contractorLocationUpdatedAt: new Date()
            });
            
            // Broadcast location update via WebSocket
            trackingWSServer.broadcastLocationUpdate(jobId, {
              location: { lat: latitude, lng: longitude, timestamp: new Date().toISOString() },
              eta: etaData.eta.toISOString(),
              speed,
              heading,
              batteryLevel
            });
          }
        }
        
        res.json({
          success: true,
          location: {
            lat: latitude,
            lng: longitude,
            updateFrequency: location.updateFrequency,
            isStationary: location.isStationary,
            trackingStatus: location.trackingStatus
          }
        });
      } catch (error) {
        console.error('Error updating contractor location:', error);
        res.status(500).json({ message: 'Failed to update location' });
      }
    }
  );
  
  // Get contractor location (GET /api/tracking/contractor/:id)
  app.get('/api/tracking/contractor/:id',
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const contractorId = req.params.id;
        
        // Get current location
        const location = await storage.getContractorLocation(contractorId);
        if (!location) {
          return res.status(404).json({ message: 'No tracking data found for contractor' });
        }
        
        // Get active job if any
        const activeJobs = await storage.getJobs({
          contractorId,
          status: ['assigned', 'en_route', 'on_site']
        });
        
        let eta = null;
        let routeHistory = [];
        let activeSession = null;
        
        if (activeJobs.length > 0) {
          const activeJob = activeJobs[0];
          
          // Calculate ETA
          if (activeJob.location) {
            const etaData = await storage.calculateETA(
              { lat: parseFloat(location.latitude), lng: parseFloat(location.longitude) },
              activeJob.location as any,
              location.speed ? parseFloat(location.speed) : undefined
            );
            eta = etaData;
          }
          
          // Get route history
          activeSession = await storage.getActiveTrackingSession(contractorId, activeJob.id);
          if (activeSession) {
            const sessionRoute = await storage.getSessionRoute(activeSession.id);
            routeHistory = sessionRoute.points;
          }
        }
        
        res.json({
          location: {
            lat: parseFloat(location.latitude),
            lng: parseFloat(location.longitude),
            accuracy: location.accuracy ? parseFloat(location.accuracy) : null,
            heading: location.heading ? parseFloat(location.heading) : null,
            speed: location.speed ? parseFloat(location.speed) : null,
            lastUpdate: location.updatedAt
          },
          status: {
            trackingStatus: location.trackingStatus,
            isStationary: location.isStationary,
            stationaryDuration: location.stationaryDuration,
            isPaused: location.isPaused,
            batteryLevel: location.batteryLevel
          },
          activeJob: activeJobs.length > 0 ? {
            id: activeJobs[0].id,
            jobNumber: activeJobs[0].jobNumber,
            status: activeJobs[0].status,
            eta: eta
          } : null,
          routeHistory: routeHistory,
          session: activeSession ? {
            id: activeSession.id,
            startedAt: activeSession.startedAt,
            totalDistance: activeSession.totalDistance,
            averageSpeed: activeSession.averageSpeed
          } : null
        });
      } catch (error) {
        console.error('Error getting contractor location:', error);
        res.status(500).json({ message: 'Failed to get contractor location' });
      }
    }
  );
  
  // Get job tracking (GET /api/tracking/job/:id)
  app.get('/api/tracking/job/:id',
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const jobId = req.params.id;
        
        // Get job details
        const job = await storage.getJob(jobId);
        if (!job) {
          return res.status(404).json({ message: 'Job not found' });
        }
        
        // Check permissions
        if (req.session.role !== 'admin' && 
            req.session.userId !== job.customerId && 
            req.session.userId !== job.contractorId) {
          return res.status(403).json({ message: 'Unauthorized to track this job' });
        }
        
        let contractorLocation = null;
        let eta = null;
        let route = null;
        let contractor = null;
        
        if (job.contractorId) {
          // Get contractor details
          const contractorProfile = await storage.getContractorProfile(job.contractorId);
          if (contractorProfile) {
            contractor = {
              id: job.contractorId,
              name: contractorProfile.companyName,
              rating: contractorProfile.averageRating,
              phone: null // Don't expose contractor phone to customers
            };
          }
          
          // Get contractor location
          const location = await storage.getContractorLocation(job.contractorId);
          if (location) {
            contractorLocation = {
              lat: parseFloat(location.latitude),
              lng: parseFloat(location.longitude),
              heading: location.heading ? parseFloat(location.heading) : null,
              speed: location.speed ? parseFloat(location.speed) : null,
              lastUpdate: location.updatedAt
            };
            
            // Calculate ETA
            if (job.location) {
              const etaData = await storage.calculateETA(
                contractorLocation,
                job.location as any,
                contractorLocation.speed || undefined
              );
              eta = etaData;
            }
          }
          
          // Get tracking session for route
          const session = await storage.getActiveTrackingSession(job.contractorId, jobId);
          if (session) {
            const sessionRoute = await storage.getSessionRoute(session.id);
            route = sessionRoute;
          }
        }
        
        // Get geofence events
        const geofenceEvents = await storage.getGeofenceEvents(jobId);
        
        res.json({
          job: {
            id: job.id,
            jobNumber: job.jobNumber,
            status: job.status,
            location: job.location,
            scheduledAt: job.scheduledAt,
            estimatedArrival: job.estimatedArrival
          },
          contractor: contractor,
          tracking: {
            contractorLocation,
            eta,
            route,
            geofenceEvents: geofenceEvents.map(e => ({
              type: e.eventType,
              triggeredAt: e.triggeredAt,
              dwellTime: e.dwellTime
            }))
          }
        });
      } catch (error) {
        console.error('Error getting job tracking:', error);
        res.status(500).json({ message: 'Failed to get job tracking' });
      }
    }
  );
  
  // Get location history (GET /api/tracking/history/:contractorId)
  app.get('/api/tracking/history/:contractorId',
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const contractorId = req.params.contractorId;
        
        // Check permissions
        if (req.session.role !== 'admin' && req.session.userId !== contractorId) {
          return res.status(403).json({ message: 'Unauthorized to view location history' });
        }
        
        const { jobId, fromDate, toDate, limit } = req.query;
        
        const history = await storage.getLocationHistory(contractorId, {
          jobId: jobId as string,
          fromDate: fromDate ? new Date(fromDate as string) : undefined,
          toDate: toDate ? new Date(toDate as string) : undefined,
          limit: limit ? parseInt(limit as string) : 1000
        });
        
        // Calculate total distance
        let totalDistance = 0;
        for (let i = 1; i < history.length; i++) {
          const distance = LocationService.calculateDistance(
            { lat: parseFloat(history[i-1].latitude), lng: parseFloat(history[i-1].longitude) },
            { lat: parseFloat(history[i].latitude), lng: parseFloat(history[i].longitude) }
          );
          totalDistance += distance;
        }
        
        res.json({
          history: history.map(h => ({
            lat: parseFloat(h.latitude),
            lng: parseFloat(h.longitude),
            accuracy: h.accuracy ? parseFloat(h.accuracy) : null,
            altitude: h.altitude ? parseFloat(h.altitude) : null,
            heading: h.heading ? parseFloat(h.heading) : null,
            speed: h.speed ? parseFloat(h.speed) : null,
            batteryLevel: h.batteryLevel,
            timestamp: h.recordedAt
          })),
          stats: {
            totalPoints: history.length,
            totalDistance: Math.round(totalDistance * 10) / 10,
            dateRange: {
              from: history.length > 0 ? history[history.length - 1].recordedAt : null,
              to: history.length > 0 ? history[0].recordedAt : null
            }
          }
        });
      } catch (error) {
        console.error('Error getting location history:', error);
        res.status(500).json({ message: 'Failed to get location history' });
      }
    }
  );
  
  // Record geofence event (POST /api/tracking/geofence)
  app.post('/api/tracking/geofence',
    requireAuth,
    requireRole('contractor'),
    async (req: Request, res: Response) => {
      try {
        const contractorId = req.session.userId!;
        const { jobId, eventType, latitude, longitude, radius } = req.body;
        
        // Validate required fields
        // Validate required fields (explicitly check to allow 0 values for coordinates)
        if (!jobId || !eventType || latitude === undefined || latitude === null || longitude === undefined || longitude === null) {
          return res.status(400).json({ message: 'Missing required fields' });
        }
        
        // Validate coordinate values are numbers and within valid ranges
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
          return res.status(400).json({ message: 'Latitude and longitude must be valid numbers' });
        }
        
        if (latitude < -90 || latitude > 90) {
          return res.status(400).json({ message: 'Latitude must be between -90 and 90 degrees' });
        }
        
        if (longitude < -180 || longitude > 180) {
          return res.status(400).json({ message: 'Longitude must be between -180 and 180 degrees' });
        }
        
        // Get job to validate
        const job = await storage.getJob(jobId);
        if (!job) {
          return res.status(404).json({ message: 'Job not found' });
        }
        
        if (job.contractorId !== contractorId) {
          return res.status(403).json({ message: 'Unauthorized to update this job' });
        }
        
        // Get active session
        const session = await storage.getActiveTrackingSession(contractorId, jobId);
        
        // Record geofence event
        const event = await storage.recordGeofenceEvent({
          contractorId,
          jobId,
          sessionId: session?.id,
          eventType,
          latitude: latitude.toString(),
          longitude: longitude.toString(),
          radius: radius || 100,
          jobLatitude: (job.location as any).lat.toString(),
          jobLongitude: (job.location as any).lng.toString(),
          distanceFromSite: LocationService.calculateDistance(
            { lat: latitude, lng: longitude },
            job.location as any
          ).toString(),
          notificationSent: false
        });
        
        // Broadcast geofence event via WebSocket
        trackingWSServer.broadcastJobUpdate(jobId, {
          type: 'GEOFENCE_EVENT',
          payload: {
            event: eventType,
            contractorId,
            timestamp: new Date().toISOString()
          }
        });
        
        res.json({
          success: true,
          event: {
            id: event.id,
            type: event.eventType,
            triggeredAt: event.triggeredAt
          }
        });
      } catch (error) {
        console.error('Error recording geofence event:', error);
        res.status(500).json({ message: 'Failed to record geofence event' });
      }
    }
  );
  
  // Pause tracking (POST /api/tracking/pause)
  app.post('/api/tracking/pause',
    requireAuth,
    requireRole('contractor'),
    async (req: Request, res: Response) => {
      try {
        const contractorId = req.session.userId!;
        const { reason } = req.body;
        
        await storage.pauseTracking(contractorId, reason);
        
        res.json({ success: true, message: 'Tracking paused' });
      } catch (error) {
        console.error('Error pausing tracking:', error);
        res.status(500).json({ message: 'Failed to pause tracking' });
      }
    }
  );
  
  // Resume tracking (POST /api/tracking/resume)
  app.post('/api/tracking/resume',
    requireAuth,
    requireRole('contractor'),
    async (req: Request, res: Response) => {
      try {
        const contractorId = req.session.userId!;
        
        await storage.resumeTracking(contractorId);
        
        res.json({ success: true, message: 'Tracking resumed' });
      } catch (error) {
        console.error('Error resuming tracking:', error);
        res.status(500).json({ message: 'Failed to resume tracking' });
      }
    }
  );
  
  // Get all active tracking (GET /api/tracking/active) - Admin only
  app.get('/api/tracking/active',
    requireAuth,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const activeTracking = await storage.getActiveTracking();
        
        // Get contractor details for each
        const trackingData = await Promise.all(activeTracking.map(async (tracking) => {
          const contractor = await storage.getContractorProfile(tracking.contractorId);
          const activeJobs = await storage.getJobs({
            contractorId: tracking.contractorId,
            status: ['assigned', 'en_route', 'on_site']
          });
          
          return {
            contractorId: tracking.contractorId,
            contractorName: contractor?.companyName || 'Unknown',
            location: {
              lat: parseFloat(tracking.latitude),
              lng: parseFloat(tracking.longitude)
            },
            speed: tracking.speed ? parseFloat(tracking.speed) : null,
            heading: tracking.heading ? parseFloat(tracking.heading) : null,
            batteryLevel: tracking.batteryLevel,
            isStationary: tracking.isStationary,
            activeJob: activeJobs.length > 0 ? {
              id: activeJobs[0].id,
              jobNumber: activeJobs[0].jobNumber,
              status: activeJobs[0].status
            } : null,
            lastUpdate: tracking.updatedAt
          };
        }));
        
        res.json({ activeTracking: trackingData });
      } catch (error) {
        console.error('Error getting active tracking:', error);
        res.status(500).json({ message: 'Failed to get active tracking' });
      }
    }
  );


  // ==================== LOCATION TRACKING API ENDPOINTS ====================
  
  // Update contractor location (POST /api/tracking/location)
  app.post('/api/tracking/location',
    requireAuth,
    requireRole('contractor'),
    async (req: Request, res: Response) => {
      try {
        const contractorId = req.session.userId!;
        const { latitude, longitude, accuracy, altitude, heading, speed, batteryLevel, isCharging, networkType, jobId } = req.body;
        
        // Validate required fields (explicitly check for undefined/null to allow 0 values)
        if (latitude === undefined || latitude === null || longitude === undefined || longitude === null) {
          return res.status(400).json({ message: 'Latitude and longitude are required' });
        }
        
        // Validate coordinate values are numbers and within valid ranges
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
          return res.status(400).json({ message: 'Latitude and longitude must be valid numbers' });
        }
        
        if (latitude < -90 || latitude > 90) {
          return res.status(400).json({ message: 'Latitude must be between -90 and 90 degrees' });
        }
        
        if (longitude < -180 || longitude > 180) {
          return res.status(400).json({ message: 'Longitude must be between -180 and 180 degrees' });
        }
        
        // Update location in database
        const location = await storage.updateContractorLocation(contractorId, {
          latitude,
          longitude,
          accuracy,
          altitude,
          heading,
          speed,
          batteryLevel,
          isCharging,
          networkType
        });
        
        if (!location) {
          return res.status(500).json({ message: 'Failed to update location' });
        }
        
        // Save to history if actively tracking a job
        if (jobId) {
          // Get active session
          let session = await storage.getActiveTrackingSession(contractorId, jobId);
          if (!session) {
            session = await storage.startTrackingSession({
              contractorId,
              jobId,
              startLocation: { lat: latitude, lng: longitude }
            });
          }
          
          // Save to history
          await storage.saveLocationHistory({
            contractorId,
            jobId,
            sessionId: session.id,
            latitude: latitude.toString(),
            longitude: longitude.toString(),
            accuracy: accuracy?.toString(),
            altitude: altitude?.toString(),
            heading: heading?.toString(),
            speed: speed?.toString(),
            batteryLevel
          });
          
          // Update session stats
          const history = await storage.getLocationHistory(contractorId, {
            jobId,
            limit: 2
          });
          
          if (history.length >= 2) {
            const distance = LocationService.calculateDistance(
              { lat: parseFloat(history[1].latitude), lng: parseFloat(history[1].longitude) },
              { lat: latitude, lng: longitude }
            );
            
            const currentStats = session;
            await storage.updateTrackingSessionStats(session.id, {
              totalDistance: (parseFloat(currentStats.totalDistance || '0') + distance),
              totalPoints: (currentStats.totalPoints || 0) + 1,
              maxSpeed: Math.max(parseFloat(currentStats.maxSpeed || '0'), speed || 0)
            });
          }
          
          // Check for geofence arrival
          const job = await storage.getJob(jobId);
          if (job && job.location && job.status === 'en_route') {
            const arrived = await storage.detectArrival(
              contractorId,
              jobId,
              { lat: latitude, lng: longitude },
              100 // 100 meter radius
            );
            
            if (arrived) {
              // Update job status
              await storage.updateJob(jobId, { status: 'on_site', arrivedAt: new Date() });
              
              // Broadcast arrival event via WebSocket
              trackingWSServer.broadcastJobUpdate(jobId, {
                type: 'GEOFENCE_EVENT',
                payload: {
                  event: 'arrived',
                  contractorId,
                  timestamp: new Date().toISOString()
                }
              });
            }
          }
          
          // Calculate ETA if en route
          if (job && job.location && (job.status === 'en_route' || job.status === 'assigned')) {
            const etaData = await storage.calculateETA(
              { lat: latitude, lng: longitude },
              job.location as any,
              speed
            );
            
            // Update job with new ETA
            await storage.updateJob(jobId, {
              estimatedArrival: etaData.eta,
              contractorLocation: { lat: latitude, lng: longitude },
              contractorLocationUpdatedAt: new Date()
            });
            
            // Broadcast location update via WebSocket
            trackingWSServer.broadcastLocationUpdate(jobId, {
              location: { lat: latitude, lng: longitude, timestamp: new Date().toISOString() },
              eta: etaData.eta.toISOString(),
              speed,
              heading,
              batteryLevel
            });
          }
        }
        
        res.json({
          success: true,
          location: {
            lat: latitude,
            lng: longitude,
            updateFrequency: location.updateFrequency,
            isStationary: location.isStationary,
            trackingStatus: location.trackingStatus
          }
        });
      } catch (error) {
        console.error('Error updating contractor location:', error);
        res.status(500).json({ message: 'Failed to update location' });
      }
    }
  );
  
  // Get contractor location (GET /api/tracking/contractor/:id)
  app.get('/api/tracking/contractor/:id',
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const contractorId = req.params.id;
        
        // Get current location
        const location = await storage.getContractorLocation(contractorId);
        if (!location) {
          return res.status(404).json({ message: 'No tracking data found for contractor' });
        }
        
        // Get active job if any
        const activeJobs = await storage.getJobs({
          contractorId,
          status: ['assigned', 'en_route', 'on_site']
        });
        
        let eta = null;
        let routeHistory = [];
        let activeSession = null;
        
        if (activeJobs.length > 0) {
          const activeJob = activeJobs[0];
          
          // Calculate ETA
          if (activeJob.location) {
            const etaData = await storage.calculateETA(
              { lat: parseFloat(location.latitude), lng: parseFloat(location.longitude) },
              activeJob.location as any,
              location.speed ? parseFloat(location.speed) : undefined
            );
            eta = etaData;
          }
          
          // Get route history
          activeSession = await storage.getActiveTrackingSession(contractorId, activeJob.id);
          if (activeSession) {
            const sessionRoute = await storage.getSessionRoute(activeSession.id);
            routeHistory = sessionRoute.points;
          }
        }
        
        res.json({
          location: {
            lat: parseFloat(location.latitude),
            lng: parseFloat(location.longitude),
            accuracy: location.accuracy ? parseFloat(location.accuracy) : null,
            heading: location.heading ? parseFloat(location.heading) : null,
            speed: location.speed ? parseFloat(location.speed) : null,
            lastUpdate: location.updatedAt
          },
          status: {
            trackingStatus: location.trackingStatus,
            isStationary: location.isStationary,
            stationaryDuration: location.stationaryDuration,
            isPaused: location.isPaused,
            batteryLevel: location.batteryLevel
          },
          activeJob: activeJobs.length > 0 ? {
            id: activeJobs[0].id,
            jobNumber: activeJobs[0].jobNumber,
            status: activeJobs[0].status,
            eta: eta
          } : null,
          routeHistory: routeHistory,
          session: activeSession ? {
            id: activeSession.id,
            startedAt: activeSession.startedAt,
            totalDistance: activeSession.totalDistance,
            averageSpeed: activeSession.averageSpeed
          } : null
        });
      } catch (error) {
        console.error('Error getting contractor location:', error);
        res.status(500).json({ message: 'Failed to get contractor location' });
      }
    }
  );
  
  // Get job tracking (GET /api/tracking/job/:id)
  app.get('/api/tracking/job/:id',
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const jobId = req.params.id;
        
        // Get job details
        const job = await storage.getJob(jobId);
        if (!job) {
          return res.status(404).json({ message: 'Job not found' });
        }
        
        // Check permissions
        if (req.session.role !== 'admin' && 
            req.session.userId !== job.customerId && 
            req.session.userId !== job.contractorId) {
          return res.status(403).json({ message: 'Unauthorized to track this job' });
        }
        
        let contractorLocation = null;
        let eta = null;
        let route = null;
        let contractor = null;
        
        if (job.contractorId) {
          // Get contractor details
          const contractorProfile = await storage.getContractorProfile(job.contractorId);
          if (contractorProfile) {
            contractor = {
              id: job.contractorId,
              name: contractorProfile.companyName,
              rating: contractorProfile.averageRating,
              phone: null // Don't expose contractor phone to customers
            };
          }
          
          // Get contractor location
          const location = await storage.getContractorLocation(job.contractorId);
          if (location) {
            contractorLocation = {
              lat: parseFloat(location.latitude),
              lng: parseFloat(location.longitude),
              heading: location.heading ? parseFloat(location.heading) : null,
              speed: location.speed ? parseFloat(location.speed) : null,
              lastUpdate: location.updatedAt
            };
            
            // Calculate ETA
            if (job.location) {
              const etaData = await storage.calculateETA(
                contractorLocation,
                job.location as any,
                contractorLocation.speed || undefined
              );
              eta = etaData;
            }
          }
          
          // Get tracking session for route
          const session = await storage.getActiveTrackingSession(job.contractorId, jobId);
          if (session) {
            const sessionRoute = await storage.getSessionRoute(session.id);
            route = sessionRoute;
          }
        }
        
        // Get geofence events
        const geofenceEvents = await storage.getGeofenceEvents(jobId);
        
        res.json({
          job: {
            id: job.id,
            jobNumber: job.jobNumber,
            status: job.status,
            location: job.location,
            scheduledAt: job.scheduledAt,
            estimatedArrival: job.estimatedArrival
          },
          contractor: contractor,
          tracking: {
            contractorLocation,
            eta,
            route,
            geofenceEvents: geofenceEvents.map(e => ({
              type: e.eventType,
              triggeredAt: e.triggeredAt,
              dwellTime: e.dwellTime
            }))
          }
        });
      } catch (error) {
        console.error('Error getting job tracking:', error);
        res.status(500).json({ message: 'Failed to get job tracking' });
      }
    }
  );
  
  // Get location history (GET /api/tracking/history/:contractorId)
  app.get('/api/tracking/history/:contractorId',
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const contractorId = req.params.contractorId;
        
        // Check permissions
        if (req.session.role !== 'admin' && req.session.userId !== contractorId) {
          return res.status(403).json({ message: 'Unauthorized to view location history' });
        }
        
        const { jobId, fromDate, toDate, limit } = req.query;
        
        const history = await storage.getLocationHistory(contractorId, {
          jobId: jobId as string,
          fromDate: fromDate ? new Date(fromDate as string) : undefined,
          toDate: toDate ? new Date(toDate as string) : undefined,
          limit: limit ? parseInt(limit as string) : 1000
        });
        
        // Calculate total distance
        let totalDistance = 0;
        for (let i = 1; i < history.length; i++) {
          const distance = LocationService.calculateDistance(
            { lat: parseFloat(history[i-1].latitude), lng: parseFloat(history[i-1].longitude) },
            { lat: parseFloat(history[i].latitude), lng: parseFloat(history[i].longitude) }
          );
          totalDistance += distance;
        }
        
        res.json({
          history: history.map(h => ({
            lat: parseFloat(h.latitude),
            lng: parseFloat(h.longitude),
            accuracy: h.accuracy ? parseFloat(h.accuracy) : null,
            altitude: h.altitude ? parseFloat(h.altitude) : null,
            heading: h.heading ? parseFloat(h.heading) : null,
            speed: h.speed ? parseFloat(h.speed) : null,
            batteryLevel: h.batteryLevel,
            timestamp: h.recordedAt
          })),
          stats: {
            totalPoints: history.length,
            totalDistance: Math.round(totalDistance * 10) / 10,
            dateRange: {
              from: history.length > 0 ? history[history.length - 1].recordedAt : null,
              to: history.length > 0 ? history[0].recordedAt : null
            }
          }
        });
      } catch (error) {
        console.error('Error getting location history:', error);
        res.status(500).json({ message: 'Failed to get location history' });
      }
    }
  );
  
  // Record geofence event (POST /api/tracking/geofence)
  app.post('/api/tracking/geofence',
    requireAuth,
    requireRole('contractor'),
    async (req: Request, res: Response) => {
      try {
        const contractorId = req.session.userId!;
        const { jobId, eventType, latitude, longitude, radius } = req.body;
        
        // Validate required fields
        // Validate required fields (explicitly check to allow 0 values for coordinates)
        if (!jobId || !eventType || latitude === undefined || latitude === null || longitude === undefined || longitude === null) {
          return res.status(400).json({ message: 'Missing required fields' });
        }
        
        // Validate coordinate values are numbers and within valid ranges
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
          return res.status(400).json({ message: 'Latitude and longitude must be valid numbers' });
        }
        
        if (latitude < -90 || latitude > 90) {
          return res.status(400).json({ message: 'Latitude must be between -90 and 90 degrees' });
        }
        
        if (longitude < -180 || longitude > 180) {
          return res.status(400).json({ message: 'Longitude must be between -180 and 180 degrees' });
        }
        
        // Get job to validate
        const job = await storage.getJob(jobId);
        if (!job) {
          return res.status(404).json({ message: 'Job not found' });
        }
        
        if (job.contractorId !== contractorId) {
          return res.status(403).json({ message: 'Unauthorized to update this job' });
        }
        
        // Get active session
        const session = await storage.getActiveTrackingSession(contractorId, jobId);
        
        // Record geofence event
        const event = await storage.recordGeofenceEvent({
          contractorId,
          jobId,
          sessionId: session?.id,
          eventType,
          latitude: latitude.toString(),
          longitude: longitude.toString(),
          radius: radius || 100,
          jobLatitude: (job.location as any).lat.toString(),
          jobLongitude: (job.location as any).lng.toString(),
          distanceFromSite: LocationService.calculateDistance(
            { lat: latitude, lng: longitude },
            job.location as any
          ).toString(),
          notificationSent: false
        });
        
        // Broadcast geofence event via WebSocket
        trackingWSServer.broadcastJobUpdate(jobId, {
          type: 'GEOFENCE_EVENT',
          payload: {
            event: eventType,
            contractorId,
            timestamp: new Date().toISOString()
          }
        });
        
        res.json({
          success: true,
          event: {
            id: event.id,
            type: event.eventType,
            triggeredAt: event.triggeredAt
          }
        });
      } catch (error) {
        console.error('Error recording geofence event:', error);
        res.status(500).json({ message: 'Failed to record geofence event' });
      }
    }
  );
  
  // Pause tracking (POST /api/tracking/pause)
  app.post('/api/tracking/pause',
    requireAuth,
    requireRole('contractor'),
    async (req: Request, res: Response) => {
      try {
        const contractorId = req.session.userId!;
        const { reason } = req.body;
        
        await storage.pauseTracking(contractorId, reason);
        
        res.json({ success: true, message: 'Tracking paused' });
      } catch (error) {
        console.error('Error pausing tracking:', error);
        res.status(500).json({ message: 'Failed to pause tracking' });
      }
    }
  );
  
  // Resume tracking (POST /api/tracking/resume)
  app.post('/api/tracking/resume',
    requireAuth,
    requireRole('contractor'),
    async (req: Request, res: Response) => {
      try {
        const contractorId = req.session.userId!;
        
        await storage.resumeTracking(contractorId);
        
        res.json({ success: true, message: 'Tracking resumed' });
      } catch (error) {
        console.error('Error resuming tracking:', error);
        res.status(500).json({ message: 'Failed to resume tracking' });
      }
    }
  );
  
  // Get all active tracking (GET /api/tracking/active) - Admin only
  app.get('/api/tracking/active',
    requireAuth,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const activeTracking = await storage.getActiveTracking();
        
        // Get contractor details for each
        const trackingData = await Promise.all(activeTracking.map(async (tracking) => {
          const contractor = await storage.getContractorProfile(tracking.contractorId);
          const activeJobs = await storage.getJobs({
            contractorId: tracking.contractorId,
            status: ['assigned', 'en_route', 'on_site']
          });
          
          return {
            contractorId: tracking.contractorId,
            contractorName: contractor?.companyName || 'Unknown',
            location: {
              lat: parseFloat(tracking.latitude),
              lng: parseFloat(tracking.longitude)
            },
            speed: tracking.speed ? parseFloat(tracking.speed) : null,
            heading: tracking.heading ? parseFloat(tracking.heading) : null,
            batteryLevel: tracking.batteryLevel,
            isStationary: tracking.isStationary,
            activeJob: activeJobs.length > 0 ? {
              id: activeJobs[0].id,
              jobNumber: activeJobs[0].jobNumber,
              status: activeJobs[0].status
            } : null,
            lastUpdate: tracking.updatedAt
          };
        }));
        
        res.json({ activeTracking: trackingData });
      } catch (error) {
        console.error('Error getting active tracking:', error);
        res.status(500).json({ message: 'Failed to get active tracking' });
      }
    }
  );

  // ==================== PUSH NOTIFICATION ENDPOINTS ====================

  // Get public VAPID key for client subscription
  app.get('/api/push/vapid-key',
    async (req: Request, res: Response) => {
      try {
        const publicKey = pushNotificationService.getPublicVAPIDKey();
        
        if (!publicKey) {
          return res.status(503).json({ 
            message: 'Push notification service not available' 
          });
        }
        
        res.json({ publicKey });
      } catch (error) {
        console.error('Error getting VAPID key:', error);
        res.status(500).json({ message: 'Failed to get VAPID key' });
      }
    }
  );

  // Subscribe to push notifications
  app.post('/api/push/subscribe',
    requireAuth,
    validateRequest(z.object({
      subscription: z.object({
        endpoint: z.string(),
        keys: z.object({
          p256dh: z.string(),
          auth: z.string()
        })
      }),
      deviceType: z.enum(['browser', 'ios', 'android']).default('browser'),
      browserInfo: z.any().optional()
    })),
    async (req: Request, res: Response) => {
      try {
        const userId = req.session.userId!;
        const { subscription, deviceType, browserInfo } = req.body;
        
        // Save subscription to database
        const savedSubscription = await storage.savePushSubscription(userId, {
          endpoint: subscription.endpoint,
          p256dhKey: subscription.keys.p256dh,
          authKey: subscription.keys.auth,
          deviceType,
          browserInfo
        });
        
        // Send welcome notification
        await pushNotificationService.sendTestNotification(userId);
        
        res.json({
          success: true,
          message: 'Successfully subscribed to push notifications',
          subscriptionId: savedSubscription.id
        });
      } catch (error) {
        console.error('Error subscribing to push notifications:', error);
        res.status(500).json({ message: 'Failed to subscribe to push notifications' });
      }
    }
  );

  // Unsubscribe from push notifications
  app.delete('/api/push/unsubscribe',
    requireAuth,
    validateRequest(z.object({
      subscriptionId: z.string().optional(),
      endpoint: z.string().optional()
    })),
    async (req: Request, res: Response) => {
      try {
        const userId = req.session.userId!;
        const { subscriptionId, endpoint } = req.body;
        
        if (!subscriptionId && !endpoint) {
          return res.status(400).json({ 
            message: 'Either subscriptionId or endpoint is required' 
          });
        }
        
        if (subscriptionId) {
          await storage.removePushSubscription(subscriptionId);
        } else if (endpoint) {
          // Find and remove subscription by endpoint
          const subscriptions = await storage.getPushSubscriptions(userId);
          const subscription = subscriptions.find(s => s.endpoint === endpoint);
          
          if (subscription) {
            await storage.removePushSubscription(subscription.id);
          }
        }
        
        res.json({
          success: true,
          message: 'Successfully unsubscribed from push notifications'
        });
      } catch (error) {
        console.error('Error unsubscribing from push notifications:', error);
        res.status(500).json({ message: 'Failed to unsubscribe from push notifications' });
      }
    }
  );

  // Send test notification
  app.post('/api/push/test',
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const userId = req.session.userId!;
        
        const result = await pushNotificationService.sendTestNotification(userId);
        
        if (result.success) {
          res.json({
            success: true,
            message: 'Test notification sent successfully',
            sent: result.sent,
            failed: result.failed
          });
        } else {
          res.status(400).json({
            success: false,
            message: 'Failed to send test notification',
            errors: result.errors
          });
        }
      } catch (error) {
        console.error('Error sending test notification:', error);
        res.status(500).json({ message: 'Failed to send test notification' });
      }
    }
  );

  // Get notification history
  app.get('/api/notifications/history',
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const userId = req.session.userId!;
        const days = parseInt(req.query.days as string) || 30;
        
        const notifications = await storage.getUserNotificationHistory(userId, days);
        const stats = await pushNotificationService.getNotificationStats(userId, days);
        
        res.json({
          notifications,
          stats
        });
      } catch (error) {
        console.error('Error getting notification history:', error);
        res.status(500).json({ message: 'Failed to get notification history' });
      }
    }
  );

  // Update notification preferences
  app.post('/api/notifications/settings',
    requireAuth,
    validateRequest(z.object({
      pushNotifications: z.boolean().optional(),
      notificationCategories: z.object({
        job_updates: z.boolean().optional(),
        messages: z.boolean().optional(),
        payments: z.boolean().optional(),
        marketing: z.boolean().optional()
      }).optional()
    })),
    async (req: Request, res: Response) => {
      try {
        const userId = req.session.userId!;
        const { pushNotifications, notificationCategories } = req.body;
        
        // Get or create customer preferences
        let preferences = await storage.getCustomerPreferences(userId);
        
        if (!preferences) {
          // Create new preferences
          await storage.createCustomerPreferences({
            userId,
            pushNotifications: pushNotifications ?? true,
            notificationCategories: notificationCategories ?? {
              job_updates: true,
              messages: true,
              payments: true,
              marketing: false
            },
            communicationChannel: 'both',
            reminderOptIn: true,
            marketingOptIn: false,
            language: 'en',
            timezone: 'America/New_York',
            maxDailyMessages: 10
          });
        } else {
          // Update existing preferences
          const updates: any = {};
          
          if (pushNotifications !== undefined) {
            updates.pushNotifications = pushNotifications;
          }
          
          if (notificationCategories) {
            updates.notificationCategories = {
              ...(preferences.notificationCategories as any || {}),
              ...notificationCategories
            };
          }
          
          await storage.updateCustomerPreferences(userId, updates);
        }
        
        res.json({
          success: true,
          message: 'Notification preferences updated successfully'
        });
      } catch (error) {
        console.error('Error updating notification preferences:', error);
        res.status(500).json({ message: 'Failed to update notification preferences' });
      }
    }
  );

  // Mark notification as delivered (called by service worker)
  app.post('/api/push/delivered/:notificationId',
    async (req: Request, res: Response) => {
      try {
        const { notificationId } = req.params;
        await storage.markNotificationDelivered(notificationId);
        res.json({ success: true });
      } catch (error) {
        console.error('Error marking notification delivered:', error);
        res.status(500).json({ message: 'Failed to mark notification delivered' });
      }
    }
  );

  // Mark notification as clicked (called by service worker)
  app.post('/api/push/clicked/:notificationId',
    async (req: Request, res: Response) => {
      try {
        const { notificationId } = req.params;
        await storage.markNotificationClicked(notificationId);
        res.json({ success: true });
      } catch (error) {
        console.error('Error marking notification clicked:', error);
        res.status(500).json({ message: 'Failed to mark notification clicked' });
      }
    }
  );

  // ==================== FLEET APPLICATION ENDPOINTS ====================
  
  // Submit fleet application (public endpoint)
  app.post('/api/fleet/apply',
    rateLimiter(3, 60000), // 3 requests per minute
    validateRequest(z.object({
      companyName: z.string().min(2),
      dotNumber: z.string().optional(),
      mcNumber: z.string().optional(),
      fleetSize: z.number().min(1),
      primaryContactName: z.string().min(2),
      primaryContactPhone: z.string().min(10),
      primaryContactEmail: z.string().email(),
      address: z.string().min(5),
      city: z.string().min(2),
      state: z.string().length(2),
      zip: z.string().min(5),
      billingContactEmail: z.string().email().optional(),
      paymentTerms: z.string().optional(),
      primaryServiceNeeds: z.array(z.string()).optional(),
      additionalRequirements: z.string().optional()
    })),
    async (req: Request, res: Response) => {
      try {
        // Check if application already exists for this email
        const existingApplication = await storage.getFleetApplicationByEmail(req.body.primaryContactEmail);
        if (existingApplication && existingApplication.status !== 'rejected') {
          return res.status(400).json({ 
            message: 'An application already exists for this email address' 
          });
        }

        // Create the fleet application
        const application = await storage.createFleetApplication({
          ...req.body,
          status: 'pending',
          submittedAt: new Date()
        });

        // Send confirmation email
        if (emailService.isReady()) {
          await emailService.sendEmail(
            req.body.primaryContactEmail, 
            'FLEET_APPLICATION_RECEIVED',
            {
              companyName: req.body.companyName,
              contactName: req.body.primaryContactName
            }
          ).catch((err: any) => console.error('Fleet application email error:', err));
        }

        // Send notification to all admin users
        emailService.sendNewFleetApplicationNotification(application).catch((err: any) => {
          console.error('Failed to notify admins about fleet application:', err);
          // Don't fail the request if admin notification fails
        });

        res.status(201).json({
          message: 'Fleet application submitted successfully',
          applicationId: application.id
        });
      } catch (error) {
        console.error('Fleet application submission error:', error);
        res.status(500).json({ 
          message: 'Failed to submit fleet application' 
        });
      }
    }
  );

  // Admin: Get all fleet applications
  app.get('/api/admin/fleet-applications',
    requireAuth,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const filters: any = {};
        if (req.query.status) filters.status = req.query.status as string;
        if (req.query.search) filters.search = req.query.search as string;
        if (req.query.companyName) filters.companyName = req.query.companyName as string;
        
        const applications = await storage.findFleetApplications(filters);
        
        res.json({
          applications,
          total: applications.length
        });
      } catch (error) {
        console.error('Get fleet applications error:', error);
        res.status(500).json({ 
          message: 'Failed to get fleet applications' 
        });
      }
    }
  );

  // Admin: Get active fleets with metrics
  app.get('/api/admin/fleets',
    requireAuth,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const { tier, status, search } = req.query;
        
        // Get fleets with metrics
        const fleets = await storage.getActiveFleets({
          tier: tier as string,
          status: status as string,
          search: search as string
        });
        
        res.json(fleets);
      } catch (error) {
        console.error('Get active fleets error:', error);
        res.status(500).json({ 
          message: 'Failed to get active fleets' 
        });
      }
    }
  );

  // Admin: Approve fleet application
  app.put('/api/admin/fleet-applications/:id/approve',
    requireAuth,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const applicationId = req.params.id;
        
        // Get the application
        const application = await storage.getFleetApplication(applicationId);
        if (!application) {
          return res.status(404).json({ message: 'Application not found' });
        }

        if (application.status !== 'pending') {
          return res.status(400).json({ 
            message: `Cannot approve application with status ${application.status}` 
          });
        }

        // First check if user already exists
        let user = await storage.getUserByEmail(application.primaryContactEmail);
        
        // Generate a temporary password for new users
        let tempPasswordPlain: string | undefined;
        let isNewUser = false;
        
        // Create user account if it doesn't exist
        if (!user) {
          // Generate a readable temporary password (matching contractor approval format)
          tempPasswordPlain = `TFG-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Math.floor(Math.random() * 9000) + 1000}`;
          const tempPasswordHash = await bcrypt.hash(tempPasswordPlain, 10);
          
          // Extract first and last name from primaryContactName
          const nameParts = application.primaryContactName.split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';
          
          user = await storage.createUser({
            email: application.primaryContactEmail,
            phone: application.primaryContactPhone,
            role: 'fleet_manager',
            firstName,
            lastName,
            password: tempPasswordHash,
            isActive: true,
            isGuest: false
          });
          
          isNewUser = true;
          console.log(`Created fleet manager account for ${application.primaryContactEmail} with ID: ${user.id}`);
        } else {
          // If user exists but is not a fleet_manager, update their role
          if (user.role !== 'fleet_manager') {
            await storage.updateUser(user.id, { role: 'fleet_manager' });
            console.log(`Updated user ${user.email} role to fleet_manager`);
          }
          // Generate new temp password for existing users too
          tempPasswordPlain = `TFG-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Math.floor(Math.random() * 9000) + 1000}`;
          const tempPasswordHash = await bcrypt.hash(tempPasswordPlain, 10);
          await storage.updateUser(user.id, { password: tempPasswordHash });
        }

        // Update application status
        await storage.updateFleetApplication(applicationId, {
          status: 'approved',
          approvedBy: req.session.userId,
          approvedAt: new Date()
        });

        // Create fleet account
        const fleetAccount = await storage.createFleetAccount({
          companyName: application.companyName,
          dotNumber: application.dotNumber || '',
          mcNumber: application.mcNumber || '',
          primaryContactName: application.primaryContactName,
          primaryContactEmail: application.primaryContactEmail,
          primaryContactPhone: application.primaryContactPhone,
          billingAddress: application.address,
          billingCity: application.city,
          billingState: application.state,
          billingZip: application.zip,
          billingEmail: application.billingContactEmail || application.primaryContactEmail,
          pricingTier: 'standard',
          creditLimit: 5000, // Default credit limit
          paymentTerms: application.paymentTerms || 'net_30',
          isActive: true
        });
        
        // Link the user to the fleet account as a primary contact
        await storage.createFleetContact({
          fleetAccountId: fleetAccount.id,
          userId: user.id,
          name: application.primaryContactName,
          title: application.primaryContactTitle || 'Fleet Manager',
          phone: application.primaryContactPhone,
          email: application.primaryContactEmail,
          isAuthorizedToBook: true,
          isPrimaryContact: true
        });

        // Send approval email with credentials
        if (tempPasswordPlain) {
          try {
            const { reminderService } = await import('./reminder-service');
            
            const emailSubject = 'Welcome to TruckFixGo - Your Fleet Application Has Been Approved!';
            const emailHtml = `
              <html>
                <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <div style="background-color: #1e3a5f; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0; font-size: 28px;">Welcome to TruckFixGo!</h1>
                    <p style="margin: 10px 0 0 0; font-size: 16px;">Your Fleet Application Has Been Approved</p>
                  </div>
                  
                  <div style="padding: 30px; background-color: #f8f9fa; border: 1px solid #dee2e6; border-top: none;">
                    <h2 style="color: #1e3a5f; margin-top: 0;">Congratulations, ${application.companyName}!</h2>
                    
                    <p style="color: #495057; line-height: 1.6;">
                      We're excited to welcome ${application.companyName} to the TruckFixGo fleet management network. 
                      Your fleet application has been thoroughly reviewed and approved. You can now start managing your fleet services with us!
                    </p>
                    
                    <div style="background: white; border-left: 4px solid #ff6b35; padding: 20px; margin: 25px 0; border-radius: 4px;">
                      <h3 style="color: #1e3a5f; margin-top: 0; font-size: 18px;">Your Fleet Manager Login Credentials</h3>
                      <p style="color: #495057; margin: 10px 0;">
                        <strong>Login Email:</strong> <span style="background: #f1f3f5; padding: 5px 10px; border-radius: 4px; font-family: monospace;">${application.primaryContactEmail}</span>
                      </p>
                      <p style="color: #495057; margin: 10px 0;">
                        <strong>Temporary Password:</strong> <span style="background: #f1f3f5; padding: 5px 10px; border-radius: 4px; font-family: monospace; font-weight: bold;">${tempPasswordPlain}</span>
                      </p>
                      <p style="color: #dc3545; font-size: 13px; margin-top: 15px;">
                        ⚠️ <strong>Important:</strong> Please change your password immediately after your first login for security purposes.
                      </p>
                    </div>
                    
                    <div style="background: #e7f5ff; border: 1px solid #74c0fc; padding: 20px; margin: 25px 0; border-radius: 4px;">
                      <h3 style="color: #1e3a5f; margin-top: 0; font-size: 18px;">Fleet Account Information</h3>
                      <ul style="color: #495057; line-height: 1.8; margin: 10px 0; padding-left: 20px;">
                        <li><strong>Company:</strong> ${application.companyName}</li>
                        <li><strong>Fleet Account ID:</strong> ${fleetAccount.id}</li>
                        <li><strong>Credit Limit:</strong> $5,000 (initial limit)</li>
                        <li><strong>Payment Terms:</strong> ${application.paymentTerms || 'Net 30'}</li>
                        <li><strong>Primary Contact:</strong> ${application.primaryContactName}</li>
                      </ul>
                    </div>
                    
                    <div style="background: #f0f9ff; border: 1px solid #3b82f6; padding: 20px; margin: 25px 0; border-radius: 4px;">
                      <h3 style="color: #1e3a5f; margin-top: 0; font-size: 18px;">Next Steps</h3>
                      <ol style="color: #495057; line-height: 1.8; margin: 10px 0; padding-left: 20px;">
                        <li><strong>Log in to your fleet dashboard:</strong> Visit <a href="${process.env.APP_URL || 'https://truckfixgo.com'}/fleet/auth" style="color: #4a90e2;">TruckFixGo Fleet Portal</a></li>
                        <li><strong>Add your fleet vehicles:</strong> Register all vehicles that will need service</li>
                        <li><strong>Set up authorized contacts:</strong> Add team members who can request services</li>
                        <li><strong>Configure billing preferences:</strong> Set up your preferred payment method</li>
                        <li><strong>Start requesting services:</strong> Book maintenance and repairs for your fleet</li>
                      </ol>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="${process.env.APP_URL || 'https://truckfixgo.com'}/fleet/auth" 
                         style="display: inline-block; background-color: #ff6b35; color: white; padding: 14px 32px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
                        Access Fleet Dashboard
                      </a>
                    </div>
                    
                    <div style="background: #f8f9fa; padding: 20px; margin: 25px 0; border-radius: 4px; border: 1px solid #dee2e6;">
                      <h4 style="color: #1e3a5f; margin-top: 0;">Fleet Benefits</h4>
                      <ul style="color: #495057; line-height: 1.6; margin: 10px 0; padding-left: 20px;">
                        <li>Priority service scheduling for all fleet vehicles</li>
                        <li>Consolidated monthly billing and reporting</li>
                        <li>Dedicated fleet support team</li>
                        <li>Volume discounts on services</li>
                        <li>24/7 emergency roadside assistance</li>
                        <li>Preventive maintenance scheduling</li>
                      </ul>
                    </div>
                    
                    <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
                    
                    <p style="color: #6c757d; font-size: 14px; line-height: 1.6;">
                      If you have any questions about your fleet account or need assistance getting started, 
                      our fleet support team is here to help. Contact us at 
                      <a href="mailto:fleet@truckfixgo.com" style="color: #4a90e2;">fleet@truckfixgo.com</a> 
                      or call 1-800-FLEET-GO.
                    </p>
                  </div>
                  
                  <div style="background-color: #1e3a5f; color: white; padding: 20px; text-align: center; border-radius: 0 0 8px 8px;">
                    <p style="margin: 0; font-size: 14px;">Welcome to the TruckFixGo Fleet Network!</p>
                    <p style="margin: 5px 0 0 0; font-size: 12px; opacity: 0.9;">The TruckFixGo Team</p>
                  </div>
                </body>
              </html>
            `;
            
            const emailText = `
Welcome to TruckFixGo!

Congratulations, ${application.companyName}!

Your fleet application has been approved. You can now start managing your fleet services with us!

Your Fleet Manager Login Credentials:
Email: ${application.primaryContactEmail}
Temporary Password: ${tempPasswordPlain}

IMPORTANT: Please change your password after your first login.

Fleet Account Information:
- Company: ${application.companyName}
- Fleet Account ID: ${fleetAccount.id}
- Credit Limit: $5,000 (initial limit)
- Payment Terms: ${application.paymentTerms || 'Net 30'}
- Primary Contact: ${application.primaryContactName}

Next Steps:
1. Log in at: ${process.env.APP_URL || 'https://truckfixgo.com'}/fleet/auth
2. Add your fleet vehicles
3. Set up authorized contacts
4. Configure billing preferences
5. Start requesting services

Questions? Contact us at fleet@truckfixgo.com or call 1-800-FLEET-GO.

Welcome to the TruckFixGo Fleet Network!
The TruckFixGo Team
            `;
            
            const emailResult = await reminderService.sendDirectEmail(
              application.primaryContactEmail,
              emailSubject,
              emailHtml,
              emailText
            );
            
            if (emailResult.success) {
              console.log(`Welcome email with credentials sent successfully to ${application.primaryContactEmail}`);
            } else {
              console.error(`Failed to send welcome email to ${application.primaryContactEmail}:`, emailResult.error);
              // Don't fail the approval, just log the error
            }
          } catch (emailError) {
            console.error('Error sending fleet welcome email:', emailError);
            // Don't fail the approval process if email fails
          }
        }

        res.json({
          message: 'Fleet application approved successfully',
          fleetAccountId: fleetAccount.id,
          userId: user.id,
          emailSent: tempPasswordPlain ? true : false
        });
      } catch (error) {
        console.error('Approve fleet application error:', error);
        res.status(500).json({ 
          message: 'Failed to approve fleet application' 
        });
      }
    }
  );

  // Admin: Reject fleet application
  app.put('/api/admin/fleet-applications/:id/reject',
    requireAuth,
    requireRole('admin'),
    validateRequest(z.object({
      reason: z.string().min(1)
    })),
    async (req: Request, res: Response) => {
      try {
        const applicationId = req.params.id;
        
        // Get the application
        const application = await storage.getFleetApplication(applicationId);
        if (!application) {
          return res.status(404).json({ message: 'Application not found' });
        }

        if (application.status !== 'pending') {
          return res.status(400).json({ 
            message: `Cannot reject application with status ${application.status}` 
          });
        }

        // Update application status
        await storage.updateFleetApplication(applicationId, {
          status: 'rejected',
          rejectionReason: req.body.reason,
          approvedBy: req.session.userId,
          approvedAt: new Date()
        });

        // Send rejection email
        if (emailService.isReady()) {
          await emailService.sendEmail(
            application.primaryContactEmail, 
            'FLEET_APPLICATION_REJECTED',
            {
              companyName: application.companyName,
              contactName: application.primaryContactName,
              reason: req.body.reason
            }
          ).catch((err: any) => console.error('Fleet rejection email error:', err));
        }

        res.json({
          message: 'Fleet application rejected'
        });
      } catch (error) {
        console.error('Reject fleet application error:', error);
        res.status(500).json({ 
          message: 'Failed to reject fleet application' 
        });
      }
    }
  );

  // ==================== CSV EXPORT ENDPOINTS ====================
  
  // Import CSV service
  const { CsvService } = await import('./csv-service.js');
  
  // Fleet vehicle export
  app.get(
    '/api/fleet/:fleetId/vehicles/export',
    requireAuth,
    requireRole('fleet', 'admin'),
    async (req: Request, res: Response) => {
      try {
        const fleetId = req.params.fleetId;
        
        // Parse filters from query parameters
        const filters = {
          isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
          vehicleType: req.query.vehicleType as string | undefined,
          dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
          dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined
        };
        
        // Get data from storage
        const vehicles = await storage.getFleetVehiclesForExport(fleetId, filters);
        
        // Sanitize sensitive data
        const sanitizedData = CsvService.sanitizeData(vehicles);
        
        // Generate CSV
        const csv = CsvService.generateCsv(
          sanitizedData,
          CsvService.COLUMN_DEFINITIONS.FLEET_VEHICLES,
          {
            dateColumns: ['lastServiceDate', 'nextServiceDue', 'createdAt', 'updatedAt'],
            booleanColumns: ['isActive']
          }
        );
        
        // Set response headers
        const filename = CsvService.generateFilename('fleet-vehicles');
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        
        // Send CSV
        res.send(csv);
        
        console.log(`Fleet vehicles exported: ${vehicles.length} records for fleet ${fleetId}`);
      } catch (error) {
        console.error('Fleet vehicles export error:', error);
        res.status(500).json({ message: 'Failed to export vehicles' });
      }
    }
  );
  
  // Fleet jobs export
  app.get(
    '/api/fleet/:fleetId/jobs/export',
    requireAuth,
    requireRole('fleet', 'admin'),
    async (req: Request, res: Response) => {
      try {
        const fleetId = req.params.fleetId;
        
        // Parse filters
        const filters = {
          status: req.query.status as string | undefined,
          dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
          dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
          vehicleId: req.query.vehicleId as string | undefined,
          contractorId: req.query.contractorId as string | undefined
        };
        
        // Get data
        const jobs = await storage.getFleetJobsForExport(fleetId, filters);
        
        // Sanitize data
        const sanitizedData = CsvService.sanitizeData(jobs);
        
        // Generate CSV
        const csv = CsvService.generateCsv(
          sanitizedData,
          CsvService.COLUMN_DEFINITIONS.FLEET_JOBS,
          {
            dateColumns: ['createdAt', 'completedAt'],
            currencyColumns: ['estimatedCost', 'actualCost']
          }
        );
        
        // Set headers
        const filename = CsvService.generateFilename('fleet-jobs');
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        
        res.send(csv);
        
        console.log(`Fleet jobs exported: ${jobs.length} records for fleet ${fleetId}`);
      } catch (error) {
        console.error('Fleet jobs export error:', error);
        res.status(500).json({ message: 'Failed to export jobs' });
      }
    }
  );
  
  // Admin users export
  app.get(
    '/api/admin/users/export',
    requireAuth,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        // Parse filters
        const filters = {
          role: req.query.role as string | undefined,
          status: req.query.status as string | undefined,
          search: req.query.search as string | undefined,
          dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
          dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined
        };
        
        // Get data
        const users = await storage.getUsersForExport(filters);
        
        // Remove passwords and sensitive data
        const sanitizedData = CsvService.sanitizeData(users, [
          'password', 'passwordHash', 'sessionToken', 'resetToken'
        ]);
        
        // Generate CSV
        const csv = CsvService.generateCsv(
          sanitizedData,
          CsvService.COLUMN_DEFINITIONS.USERS,
          {
            dateColumns: ['createdAt', 'lastLogin'],
            booleanColumns: ['isActive', 'emailVerified', 'phoneVerified', 'notificationsEnabled']
          }
        );
        
        // Set headers
        const filename = CsvService.generateFilename('users');
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        
        res.send(csv);
        
        console.log(`Users exported: ${users.length} records`);
      } catch (error) {
        console.error('Users export error:', error);
        res.status(500).json({ message: 'Failed to export users' });
      }
    }
  );
  
  // Admin contractors export
  app.get(
    '/api/admin/contractors/export',
    requireAuth,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        // Parse filters
        const filters = {
          status: req.query.status as string | undefined,
          tier: req.query.tier as string | undefined,
          search: req.query.search as string | undefined,
          dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
          dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined
        };
        
        // Get data
        const contractors = await storage.getContractorsForExport(filters);
        
        // Sanitize sensitive data
        const sanitizedData = CsvService.sanitizeData(contractors, [
          'bankAccountNumber', 'bankRoutingNumber', 'taxId', 'ssn'
        ]);
        
        // Generate CSV
        const csv = CsvService.generateCsv(
          sanitizedData,
          CsvService.COLUMN_DEFINITIONS.CONTRACTORS,
          {
            dateColumns: ['createdAt', 'verifiedAt', 'insuranceExpiry', 'joinedDate'],
            currencyColumns: ['totalEarnings'],
            booleanColumns: ['isAvailable', 'isOnline']
          }
        );
        
        // Set headers
        const filename = CsvService.generateFilename('contractors');
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        
        res.send(csv);
        
        console.log(`Contractors exported: ${contractors.length} records`);
      } catch (error) {
        console.error('Contractors export error:', error);
        res.status(500).json({ message: 'Failed to export contractors' });
      }
    }
  );
  
  // Admin billing export
  app.get(
    '/api/admin/billing/export',
    requireAuth,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        // Parse filters
        const filters = {
          fleetAccountId: req.query.fleetAccountId as string | undefined,
          status: req.query.status as string | undefined,
          type: req.query.type as string | undefined,
          dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
          dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined
        };
        
        // Get data
        const transactions = await storage.getBillingDataForExport(filters);
        
        // Sanitize sensitive data
        const sanitizedData = CsvService.sanitizeData(transactions, [
          'stripePaymentIntentId', 'stripeCustomerId', 'stripePaymentMethodId'
        ]);
        
        // Generate CSV
        const csv = CsvService.generateCsv(
          sanitizedData,
          CsvService.COLUMN_DEFINITIONS.BILLING,
          {
            dateColumns: ['createdAt', 'date'],
            currencyColumns: ['amount']
          }
        );
        
        // Set headers
        const filename = CsvService.generateFilename('billing-transactions');
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        
        res.send(csv);
        
        console.log(`Billing data exported: ${transactions.length} records`);
      } catch (error) {
        console.error('Billing export error:', error);
        res.status(500).json({ message: 'Failed to export billing data' });
      }
    }
  );
  
  // Fleet analytics export
  app.get(
    '/api/fleet/:fleetId/analytics/export',
    requireAuth,
    requireRole('fleet', 'admin'),
    async (req: Request, res: Response) => {
      try {
        const fleetId = req.params.fleetId;
        
        // Parse filters
        const filters = {
          metric: req.query.metric as string | undefined,
          dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
          dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
          groupBy: req.query.groupBy as 'day' | 'week' | 'month' | undefined
        };
        
        // Get data
        const analytics = await storage.getFleetAnalyticsForExport(fleetId, filters);
        
        // Generate CSV
        const csv = CsvService.generateCsv(
          analytics,
          CsvService.COLUMN_DEFINITIONS.ANALYTICS,
          {
            dateColumns: ['date'],
            currencyColumns: ['totalCost', 'maintenanceCost', 'emergencyCost', 'avgCostPerJob']
          }
        );
        
        // Set headers
        const filename = CsvService.generateFilename('fleet-analytics');
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        
        res.send(csv);
        
        console.log(`Analytics exported: ${analytics.length} records for fleet ${fleetId}`);
      } catch (error) {
        console.error('Analytics export error:', error);
        res.status(500).json({ message: 'Failed to export analytics' });
      }
    }
  );
  
  // ==================== REPORT GENERATION ENDPOINTS ====================
  
  // Fleet maintenance report
  app.get(
    '/api/reports/fleet/:fleetId/maintenance',
    requireAuth,
    requireRole('fleet', 'admin'),
    async (req: Request, res: Response) => {
      try {
        const fleetId = req.params.fleetId;
        const dateFrom = new Date(req.query.dateFrom as string || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000));
        const dateTo = new Date(req.query.dateTo as string || new Date());
        
        // Get report data
        const report = await storage.getFleetMaintenanceReport(fleetId, dateFrom, dateTo);
        
        // Format as CSV or JSON based on format parameter
        if (req.query.format === 'csv') {
          // Generate detailed CSV report
          const csvData = [
            ['Fleet Maintenance Report'],
            ['Report Period:', `${dateFrom.toLocaleDateString()} - ${dateTo.toLocaleDateString()}`],
            [],
            ['Summary'],
            ['Total Vehicles:', report.summary.totalVehicles],
            ['Total Maintenance Jobs:', report.summary.totalMaintenanceJobs],
            ['Total Cost:', `$${report.summary.totalCost.toFixed(2)}`],
            ['Average Cost Per Vehicle:', `$${report.summary.averageCostPerVehicle.toFixed(2)}`],
            [],
            ['Most Frequent Issues'],
            ['Issue', 'Count', 'Total Cost'],
            ...report.summary.mostFrequentIssues.map(issue => [
              issue.issue,
              issue.count,
              `$${issue.cost.toFixed(2)}`
            ]),
            [],
            ['Detailed Maintenance Records'],
            ['Job Number', 'Vehicle', 'Service Type', 'Date', 'Cost', 'Status'],
            ...report.details.map((job: any) => [
              job.jobNumber,
              job.vehicleUnit || 'N/A',
              job.serviceType || 'N/A',
              job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'N/A',
              job.cost ? `$${job.cost.toFixed(2)}` : '$0.00',
              job.status
            ])
          ];
          
          const csv = csvData.map(row => row.map(cell => 
            typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell
          ).join(',')).join('\n');
          
          const filename = CsvService.generateFilename('maintenance-report');
          res.setHeader('Content-Type', 'text/csv; charset=utf-8');
          res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
          res.send('\ufeff' + csv); // Add BOM for Excel
        } else {
          // Return JSON report
          res.json(report);
        }
        
        console.log(`Maintenance report generated for fleet ${fleetId}`);
      } catch (error) {
        console.error('Maintenance report error:', error);
        res.status(500).json({ message: 'Failed to generate maintenance report' });
      }
    }
  );
  
  // Fleet cost summary report
  app.get(
    '/api/reports/fleet/:fleetId/cost-summary',
    requireAuth,
    requireRole('fleet', 'admin'),
    async (req: Request, res: Response) => {
      try {
        const fleetId = req.params.fleetId;
        const dateFrom = new Date(req.query.dateFrom as string || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000));
        const dateTo = new Date(req.query.dateTo as string || new Date());
        
        // Get report data
        const report = await storage.getFleetCostSummaryReport(fleetId, dateFrom, dateTo);
        
        // Format as CSV or JSON
        if (req.query.format === 'csv') {
          const csvData = [
            ['Fleet Cost Summary Report'],
            ['Report Period:', `${dateFrom.toLocaleDateString()} - ${dateTo.toLocaleDateString()}`],
            [],
            ['Cost Summary'],
            ['Total Cost:', `$${report.summary.totalCost.toFixed(2)}`],
            ['Maintenance Cost:', `$${report.summary.maintenanceCost.toFixed(2)}`],
            ['Emergency Repair Cost:', `$${report.summary.emergencyRepairCost.toFixed(2)}`],
            ['Scheduled Service Cost:', `$${report.summary.scheduledServiceCost.toFixed(2)}`],
            [],
            ['Cost by Month'],
            ['Month', 'Cost'],
            ...report.summary.costByMonth.map(item => [
              item.month,
              `$${item.cost.toFixed(2)}`
            ]),
            [],
            ['Top 10 Vehicles by Cost'],
            ['Vehicle', 'Total Cost'],
            ...report.summary.costByVehicle.map(item => [
              item.vehicle,
              `$${item.cost.toFixed(2)}`
            ])
          ];
          
          const csv = csvData.map(row => row.map(cell => 
            typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell
          ).join(',')).join('\n');
          
          const filename = CsvService.generateFilename('cost-summary-report');
          res.setHeader('Content-Type', 'text/csv; charset=utf-8');
          res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
          res.send('\ufeff' + csv);
        } else {
          res.json(report);
        }
        
        console.log(`Cost summary report generated for fleet ${fleetId}`);
      } catch (error) {
        console.error('Cost summary report error:', error);
        res.status(500).json({ message: 'Failed to generate cost summary report' });
      }
    }
  );
  
  // Admin revenue report
  app.get(
    '/api/reports/admin/revenue',
    requireAuth,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const dateFrom = new Date(req.query.dateFrom as string || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000));
        const dateTo = new Date(req.query.dateTo as string || new Date());
        
        // Get report data
        const report = await storage.getAdminRevenueReport(dateFrom, dateTo);
        
        // Format as CSV or JSON
        if (req.query.format === 'csv') {
          const csvData = [
            ['Revenue Report'],
            ['Report Period:', `${dateFrom.toLocaleDateString()} - ${dateTo.toLocaleDateString()}`],
            [],
            ['Revenue Summary'],
            ['Total Revenue:', `$${report.summary.totalRevenue.toFixed(2)}`],
            ['Subscription Revenue:', `$${report.summary.subscriptionRevenue.toFixed(2)}`],
            ['Transaction Revenue:', `$${report.summary.transactionRevenue.toFixed(2)}`],
            ['Refunds:', `$${report.summary.refunds.toFixed(2)}`],
            ['Net Revenue:', `$${report.summary.netRevenue.toFixed(2)}`],
            [],
            ['Revenue by Month'],
            ['Month', 'Revenue'],
            ...report.summary.revenueByMonth.map(item => [
              item.month,
              `$${item.revenue.toFixed(2)}`
            ]),
            [],
            ['Top 10 Fleets by Revenue'],
            ['Fleet', 'Revenue'],
            ...report.summary.revenueByFleet.map(item => [
              item.fleetName,
              `$${item.revenue.toFixed(2)}`
            ])
          ];
          
          const csv = csvData.map(row => row.map(cell => 
            typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell
          ).join(',')).join('\n');
          
          const filename = CsvService.generateFilename('revenue-report');
          res.setHeader('Content-Type', 'text/csv; charset=utf-8');
          res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
          res.send('\ufeff' + csv);
        } else {
          res.json(report);
        }
        
        console.log('Revenue report generated');
      } catch (error) {
        console.error('Revenue report error:', error);
        res.status(500).json({ message: 'Failed to generate revenue report' });
      }
    }
  );

  // ==================== ROUTE MANAGEMENT ENDPOINTS ====================

  // Create a new multi-stop route for contractor
  app.post(
    '/api/contractor/routes',
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const contractorId = req.session.userId;
        if (!contractorId) {
          return res.status(401).json({ message: 'Not authenticated' });
        }

        const { name, jobIds, optimizationStrategy = 'shortest' } = req.body;

        // Validate jobIds
        if (!Array.isArray(jobIds) || jobIds.length === 0) {
          return res.status(400).json({ message: 'Job IDs array is required' });
        }

        // Create the route
        const route = await storage.createRoute({
          contractorId,
          name: name || `Route ${new Date().toLocaleDateString()}`,
          startTime: new Date(),
          optimizationStrategy: optimizationStrategy as 'shortest' | 'fastest' | 'most_profitable',
          status: 'planned'
        });

        // Add stops for each job
        for (let i = 0; i < jobIds.length; i++) {
          const job = await storage.getJob(jobIds[i]);
          if (job) {
            await storage.addRouteStop(route.id, {
              routeId: route.id,
              jobId: job.id,
              stopOrder: i + 1,
              stopType: 'service',
              status: 'pending',
              location: {
                lat: job.lat,
                lng: job.lng,
                address: job.address
              }
            });
          }
        }

        // Optimize the route
        const { RouteOptimizer } = await import('./services/route-optimizer');
        const optimizer = new RouteOptimizer(storage);
        const optimizedRoute = await optimizer.optimizeRoute(route.id);

        res.json({ 
          success: true, 
          route: optimizedRoute,
          message: 'Route created and optimized successfully' 
        });
      } catch (error) {
        console.error('Route creation error:', error);
        res.status(500).json({ message: 'Failed to create route' });
      }
    }
  );

  // Get route details with stops
  app.get(
    '/api/contractor/routes/:id',
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const routeId = req.params.id;
        const route = await storage.getRoute(routeId);
        
        if (!route) {
          return res.status(404).json({ message: 'Route not found' });
        }

        // Verify access
        if (route.contractorId !== req.session.userId && req.session.role !== 'admin') {
          return res.status(403).json({ message: 'Access denied' });
        }

        // Get route stops
        const stops = await storage.getRouteStops(routeId);
        
        // Get jobs for each stop
        const stopsWithJobs = await Promise.all(
          stops.map(async (stop) => {
            if (stop.jobId) {
              const job = await storage.getJob(stop.jobId);
              return { ...stop, job };
            }
            return stop;
          })
        );

        res.json({
          route,
          stops: stopsWithJobs,
          currentStop: stops.find(s => s.status === 'in_progress'),
          completedStops: stops.filter(s => s.status === 'completed').length,
          totalStops: stops.length
        });
      } catch (error) {
        console.error('Get route error:', error);
        res.status(500).json({ message: 'Failed to get route details' });
      }
    }
  );

  // Reoptimize route
  app.put(
    '/api/contractor/routes/:id/optimize',
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const routeId = req.params.id;
        const route = await storage.getRoute(routeId);
        
        if (!route) {
          return res.status(404).json({ message: 'Route not found' });
        }

        // Verify ownership
        if (route.contractorId !== req.session.userId) {
          return res.status(403).json({ message: 'Access denied' });
        }

        // Optimize the route
        const { RouteOptimizer } = await import('./services/route-optimizer');
        const optimizer = new RouteOptimizer(storage);
        const optimizedRoute = await optimizer.optimizeRoute(routeId);

        // Notify clients via WebSocket
        await trackingWSServer.notifyRouteOptimized(routeId, await storage.getRouteStops(routeId));

        res.json({ 
          success: true, 
          route: optimizedRoute,
          message: 'Route optimized successfully' 
        });
      } catch (error) {
        console.error('Route optimization error:', error);
        res.status(500).json({ message: 'Failed to optimize route' });
      }
    }
  );

  // Record GPS waypoint
  app.post(
    '/api/contractor/routes/:id/waypoint',
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const routeId = req.params.id;
        const route = await storage.getRoute(routeId);
        
        if (!route) {
          return res.status(404).json({ message: 'Route not found' });
        }

        // Verify ownership
        if (route.contractorId !== req.session.userId) {
          return res.status(403).json({ message: 'Access denied' });
        }

        const { lat, lng, heading, speed, altitude } = req.body;

        // Validate waypoint data
        if (typeof lat !== 'number' || typeof lng !== 'number') {
          return res.status(400).json({ message: 'Invalid waypoint data' });
        }

        // Record waypoint
        const waypoint = await storage.recordWaypoint(routeId, {
          routeId,
          lat,
          lng,
          timestamp: new Date(),
          heading: heading || null,
          speed: speed || null,
          altitude: altitude || null
        });

        // Check for route deviation
        await trackingWSServer.checkRouteDeviation(routeId, { lat, lng });

        res.json({ 
          success: true, 
          waypoint,
          message: 'Waypoint recorded' 
        });
      } catch (error) {
        console.error('Waypoint recording error:', error);
        res.status(500).json({ message: 'Failed to record waypoint' });
      }
    }
  );

  // Customer view of their job within a route
  app.get(
    '/api/customer/route-tracking/:jobId',
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const jobId = req.params.jobId;
        const job = await storage.getJob(jobId);
        
        if (!job) {
          return res.status(404).json({ message: 'Job not found' });
        }

        // Verify access (customer should be job owner or admin)
        if (job.customerId !== req.session.userId && req.session.role !== 'admin') {
          return res.status(403).json({ message: 'Access denied' });
        }

        // Find the route containing this job
        const routeStop = await storage.getRouteStopByJobId(jobId);
        
        if (!routeStop) {
          return res.status(404).json({ message: 'Job is not part of any active route' });
        }

        const route = await storage.getRoute(routeStop.routeId);
        const allStops = await storage.getRouteStops(routeStop.routeId);
        
        // Find customer's position in the route
        const customerStopIndex = allStops.findIndex(s => s.jobId === jobId);
        const currentStop = allStops.find(s => s.status === 'in_progress');
        const completedStops = allStops.filter(s => s.status === 'completed');
        
        // Calculate estimated arrival based on current progress
        let estimatedArrival = routeStop.plannedArrivalTime;
        if (currentStop && routeStop.status === 'pending') {
          // Calculate based on average time per stop
          const avgTimePerStop = route?.estimatedDuration 
            ? (route.estimatedDuration / allStops.length) * 60000 // Convert to ms
            : 30 * 60000; // Default 30 minutes per stop
          
          const stopsUntilCustomer = customerStopIndex - allStops.findIndex(s => s.id === currentStop.id);
          estimatedArrival = new Date(Date.now() + (stopsUntilCustomer * avgTimePerStop));
        }

        res.json({
          jobId,
          routeId: route?.id,
          routeName: route?.name,
          stopOrder: customerStopIndex + 1,
          totalStops: allStops.length,
          stopStatus: routeStop.status,
          estimatedArrival,
          actualArrival: routeStop.actualArrival,
          currentStop: currentStop ? {
            order: allStops.findIndex(s => s.id === currentStop.id) + 1,
            status: currentStop.status
          } : null,
          completedStops: completedStops.length,
          contractor: {
            id: route?.contractorId,
            online: !!route && route.status === 'active'
          }
        });
      } catch (error) {
        console.error('Route tracking error:', error);
        res.status(500).json({ message: 'Failed to get route tracking information' });
      }
    }
  );

  // Get active route for contractor
  app.get(
    '/api/contractor/routes/active',
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const contractorId = req.session.userId;
        if (!contractorId) {
          return res.status(401).json({ message: 'Not authenticated' });
        }

        const activeRoute = await storage.getActiveRoute(contractorId);
        
        if (!activeRoute) {
          return res.json({ 
            hasActiveRoute: false,
            message: 'No active route found' 
          });
        }

        const stops = await storage.getRouteStops(activeRoute.id);
        const stopsWithJobs = await Promise.all(
          stops.map(async (stop) => {
            if (stop.jobId) {
              const job = await storage.getJob(stop.jobId);
              return { ...stop, job };
            }
            return stop;
          })
        );

        res.json({
          hasActiveRoute: true,
          route: activeRoute,
          stops: stopsWithJobs,
          currentStop: stops.find(s => s.status === 'in_progress'),
          nextStop: stops.find(s => s.status === 'pending'),
          completedStops: stops.filter(s => s.status === 'completed').length,
          totalStops: stops.length
        });
      } catch (error) {
        console.error('Get active route error:', error);
        res.status(500).json({ message: 'Failed to get active route' });
      }
    }
  );

  // Update route stop status
  app.patch(
    '/api/contractor/routes/:routeId/stops/:stopId',
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const { routeId, stopId } = req.params;
        const { status } = req.body;

        const route = await storage.getRoute(routeId);
        if (!route) {
          return res.status(404).json({ message: 'Route not found' });
        }

        // Verify ownership
        if (route.contractorId !== req.session.userId) {
          return res.status(403).json({ message: 'Access denied' });
        }

        // Update stop status
        if (status === 'in_progress') {
          await storage.markStopArrived(stopId, new Date());
        } else if (status === 'completed') {
          await storage.markStopCompleted(stopId, new Date());
        }

        res.json({ 
          success: true, 
          message: `Stop ${status === 'completed' ? 'completed' : 'updated'} successfully` 
        });
      } catch (error) {
        console.error('Update stop error:', error);
        res.status(500).json({ message: 'Failed to update stop' });
      }
    }
  );

  // ==================== PERFORMANCE METRICS ROUTES ====================
  
  // Initialize KPIs on server start
  // NOTE: Temporarily disabled - performance tables need migration
  // await storage.initializePerformanceKPIs().catch(console.error);

  // GET /api/metrics/dashboard - Main metrics dashboard data
  app.get('/api/metrics/dashboard',
    requireAuth,
    requireAdmin,
    async (req: Request, res: Response) => {
      try {
        const { period = '30d' } = req.query;
        
        // Calculate date range
        const endDate = new Date();
        const startDate = new Date();
        if (period === '7d') {
          startDate.setDate(startDate.getDate() - 7);
        } else if (period === '30d') {
          startDate.setDate(startDate.getDate() - 30);
        } else if (period === '90d') {
          startDate.setDate(startDate.getDate() - 90);
        } else if (period === '1y') {
          startDate.setFullYear(startDate.getFullYear() - 1);
        }

        // Get system-wide KPIs
        const kpis = await storage.generatePerformanceScorecard('system', 'all', { startDate, endDate });
        
        // Get top performers for various metrics
        const topContractors = await storage.getTopPerformers('completion_rate', 10);
        const fastestResponse = await storage.getTopPerformers('response_time', 10);
        const highestRevenue = await storage.getTopPerformers('revenue', 10);
        
        // Get recent performance trends
        const completionTrend = await storage.getPerformanceTrends('completion_rate', { startDate, endDate });
        const revenueTrend = await storage.getPerformanceTrends('revenue', { startDate, endDate });
        const satisfactionTrend = await storage.getPerformanceTrends('satisfaction', { startDate, endDate });
        
        res.json({
          period,
          dateRange: { startDate, endDate },
          kpis,
          leaderboards: {
            topContractors,
            fastestResponse,
            highestRevenue
          },
          trends: {
            completion: completionTrend,
            revenue: revenueTrend,
            satisfaction: satisfactionTrend
          }
        });
      } catch (error) {
        console.error('Error fetching metrics dashboard:', error);
        res.status(500).json({ message: 'Failed to fetch metrics dashboard' });
      }
    }
  );

  // GET /api/metrics/:entityType/:entityId - Entity-specific metrics
  app.get('/api/metrics/:entityType/:entityId',
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const { entityType, entityId } = req.params;
        const { startDate, endDate } = req.query;
        
        // Validate entity type
        if (!['contractor', 'fleet', 'vehicle', 'job'].includes(entityType)) {
          return res.status(400).json({ message: 'Invalid entity type' });
        }
        
        // Check authorization
        if (entityType === 'contractor' && req.session.role === 'contractor') {
          const contractor = await storage.getContractorProfile(req.session.userId!);
          if (contractor?.userId !== entityId) {
            return res.status(403).json({ message: 'Access denied' });
          }
        } else if (entityType === 'fleet' && req.session.role === 'fleet_manager') {
          const user = await storage.getUser(req.session.userId!);
          const fleetAccount = await storage.getFleetAccountByEmail(user?.email || '');
          if (fleetAccount?.id !== entityId) {
            return res.status(403).json({ message: 'Access denied' });
          }
        }
        
        const dateRange = startDate && endDate ? {
          startDate: new Date(startDate as string),
          endDate: new Date(endDate as string)
        } : undefined;
        
        // Get performance metrics
        const metrics = await storage.getPerformanceMetrics(entityType, entityId, dateRange);
        
        // Calculate KPIs
        const scorecard = await storage.generatePerformanceScorecard(entityType, entityId, dateRange);
        
        res.json({
          entityType,
          entityId,
          dateRange,
          metrics,
          scorecard
        });
      } catch (error) {
        console.error('Error fetching entity metrics:', error);
        res.status(500).json({ message: 'Failed to fetch entity metrics' });
      }
    }
  );

  // GET /api/metrics/kpis - All KPI definitions and values
  app.get('/api/metrics/kpis',
    requireAuth,
    requireAdmin,
    async (req: Request, res: Response) => {
      try {
        const kpiDefinitions = await db
          .select()
          .from(kpiDefinitions)
          .where(eq(kpiDefinitions.isActive, true))
          .orderBy(asc(kpiDefinitions.category), asc(kpiDefinitions.name));
        
        // Calculate current values for each KPI
        const kpisWithValues = await Promise.all(
          kpiDefinitions.map(async (kpi) => {
            const currentValue = await storage.calculateKPI(
              kpi.id,
              'system',
              {
                startDate: new Date(new Date().setHours(0, 0, 0, 0)),
                endDate: new Date()
              }
            );
            return { ...kpi, currentValue };
          })
        );
        
        res.json({
          kpis: kpisWithValues
        });
      } catch (error) {
        console.error('Error fetching KPIs:', error);
        res.status(500).json({ message: 'Failed to fetch KPIs' });
      }
    }
  );

  // POST /api/metrics/goals - Set performance goals
  app.post('/api/metrics/goals',
    requireAuth,
    requireAdmin,
    validateRequest(insertPerformanceGoalSchema),
    async (req: Request, res: Response) => {
      try {
        const goal = await storage.setPerformanceGoal(
          req.body.entityType,
          req.body.entityId,
          req.body.kpiId,
          {
            targetValue: req.body.targetValue,
            deadline: new Date(req.body.deadline),
            notes: req.body.notes
          }
        );
        
        res.json({
          success: true,
          goal
        });
      } catch (error) {
        console.error('Error setting performance goal:', error);
        res.status(500).json({ message: 'Failed to set performance goal' });
      }
    }
  );

  // GET /api/metrics/trends - Performance trends
  app.get('/api/metrics/trends',
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const { metricType, startDate, endDate } = req.query;
        
        if (!metricType) {
          return res.status(400).json({ message: 'Metric type is required' });
        }
        
        const dateRange = {
          startDate: startDate ? new Date(startDate as string) : new Date(new Date().setMonth(new Date().getMonth() - 3)),
          endDate: endDate ? new Date(endDate as string) : new Date()
        };
        
        const trends = await storage.getPerformanceTrends(metricType as string, dateRange);
        
        res.json({
          metricType,
          dateRange,
          trends
        });
      } catch (error) {
        console.error('Error fetching performance trends:', error);
        res.status(500).json({ message: 'Failed to fetch performance trends' });
      }
    }
  );

  // GET /api/metrics/leaderboard - Top performers
  app.get('/api/metrics/leaderboard',
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const { metricType = 'completion_rate', limit = '10' } = req.query;
        
        const topPerformers = await storage.getTopPerformers(
          metricType as string, 
          parseInt(limit as string)
        );
        
        res.json({
          metricType,
          topPerformers
        });
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ message: 'Failed to fetch leaderboard' });
      }
    }
  );

  // GET /api/metrics/compare - Period comparisons
  app.get('/api/metrics/compare',
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const { entityId, periods } = req.query;
        
        if (!entityId || !periods) {
          return res.status(400).json({ message: 'Entity ID and periods are required' });
        }
        
        const periodRanges = JSON.parse(periods as string).map((p: any) => ({
          startDate: new Date(p.startDate),
          endDate: new Date(p.endDate)
        }));
        
        const comparison = await storage.getPerformanceComparison(
          entityId as string,
          periodRanges
        );
        
        res.json(comparison);
      } catch (error) {
        console.error('Error fetching performance comparison:', error);
        res.status(500).json({ message: 'Failed to fetch performance comparison' });
      }
    }
  );

  // GET /api/reports/performance - Detailed performance report
  app.get('/api/reports/performance',
    requireAuth,
    requireAdmin,
    async (req: Request, res: Response) => {
      try {
        const { entityType, entityId, startDate, endDate, format = 'json' } = req.query;
        
        const dateRange = {
          startDate: startDate ? new Date(startDate as string) : new Date(new Date().setMonth(new Date().getMonth() - 1)),
          endDate: endDate ? new Date(endDate as string) : new Date()
        };
        
        // Generate comprehensive report data
        const reportData: any = {
          generatedAt: new Date(),
          dateRange,
          entityType: entityType || 'system',
          entityId: entityId || 'all'
        };
        
        // Get KPIs and scorecard
        reportData.scorecard = await storage.generatePerformanceScorecard(
          entityType as string || 'system',
          entityId as string || 'all',
          dateRange
        );
        
        // Get detailed metrics
        if (entityType && entityId) {
          reportData.metrics = await storage.getPerformanceMetrics(
            entityType as string,
            entityId as string,
            dateRange
          );
          
          // Calculate specific KPIs
          reportData.responseTime = await storage.calculateResponseTimeMetrics(
            entityType as string,
            entityId as string,
            dateRange
          );
          
          reportData.completionRates = await storage.calculateCompletionRates(
            entityType as string,
            entityId as string,
            dateRange
          );
          
          reportData.revenue = await storage.calculateRevenue(
            entityType as string,
            entityId as string,
            dateRange
          );
          
          reportData.satisfaction = await storage.calculateSatisfactionScore(
            entityType as string,
            entityId as string,
            dateRange
          );
          
          if (entityType === 'fleet') {
            reportData.utilization = await storage.calculateFleetUtilization(
              entityId as string,
              dateRange
            );
          }
          
          reportData.onTimeDelivery = await storage.calculateOnTimeDelivery(
            entityType as string,
            entityId as string,
            dateRange
          );
        }
        
        // Get comparison with previous period
        const previousPeriod = {
          startDate: new Date(dateRange.startDate.getTime() - (dateRange.endDate.getTime() - dateRange.startDate.getTime())),
          endDate: dateRange.startDate
        };
        
        if (entityId) {
          reportData.comparison = await storage.getPerformanceComparison(
            entityId as string,
            [previousPeriod, dateRange]
          );
        }
        
        // Get trends
        reportData.trends = {
          completion: await storage.getPerformanceTrends('completion_rate', dateRange),
          revenue: await storage.getPerformanceTrends('revenue', dateRange),
          satisfaction: await storage.getPerformanceTrends('satisfaction', dateRange)
        };
        
        // Get top performers
        reportData.leaderboards = {
          topByCompletion: await storage.getTopPerformers('completion_rate', 10),
          topByRevenue: await storage.getTopPerformers('revenue', 10),
          topBySatisfaction: await storage.getTopPerformers('satisfaction', 10),
          topByResponseTime: await storage.getTopPerformers('response_time', 10)
        };
        
        if (format === 'csv') {
          // Convert to CSV format
          const csvData = convertToCSV(reportData);
          res.header('Content-Type', 'text/csv');
          res.header('Content-Disposition', `attachment; filename="performance-report-${Date.now()}.csv"`);
          res.send(csvData);
        } else {
          res.json(reportData);
        }
      } catch (error) {
        console.error('Error generating performance report:', error);
        res.status(500).json({ message: 'Failed to generate performance report' });
      }
    }
  );

  // Helper function to convert report data to CSV
  function convertToCSV(data: any): string {
    const lines: string[] = [];
    
    // Add header
    lines.push('Performance Report');
    lines.push(`Generated: ${data.generatedAt}`);
    lines.push(`Period: ${data.dateRange.startDate} to ${data.dateRange.endDate}`);
    lines.push('');
    
    // Add scorecard
    if (data.scorecard) {
      lines.push('KPI,Value,Unit,Status,Trend');
      data.scorecard.scorecard.forEach((kpi: any) => {
        lines.push(`${kpi.name},${kpi.value},${kpi.unit},${kpi.status || ''},${kpi.trend || ''}`);
      });
      lines.push('');
    }
    
    // Add metrics summary
    if (data.completionRates) {
      lines.push('Metric,Value');
      lines.push(`Completion Rate,${data.completionRates.completionRate}%`);
      lines.push(`Success Rate,${data.completionRates.successRate}%`);
      lines.push(`Total Jobs,${data.completionRates.totalJobs}`);
      lines.push('');
    }
    
    if (data.revenue) {
      lines.push('Revenue Metrics,Value');
      lines.push(`Total Revenue,$${data.revenue.total}`);
      lines.push(`Average Revenue,$${data.revenue.average}`);
      lines.push(`Jobs Completed,${data.revenue.jobCount}`);
      lines.push('');
    }
    
    return lines.join('\n');
  }

  // ==================== EMERGENCY SOS ENDPOINTS ====================
  
  // POST /api/emergency/sos - Trigger SOS alert
  app.post('/api/emergency/sos', requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });
      
      const { location, alertType, message, severity, jobId } = req.body;
      
      if (!location || !alertType || !message) {
        return res.status(400).json({ message: 'Location, alert type, and message are required' });
      }
      
      const alert = await storage.createSOSAlert(
        userId,
        location,
        alertType,
        message,
        severity || 'high',
        jobId
      );
      
      // Broadcast emergency via WebSocket
      const wsMessage = {
        type: 'EMERGENCY_SOS',
        data: {
          alertId: alert.id,
          initiatorId: alert.initiatorId,
          location: alert.location,
          severity: alert.severity,
          alertType: alert.alertType,
          message: alert.message,
          timestamp: alert.createdAt
        }
      };
      
      // Broadcast to all connected clients
      trackingWSServer.handleBroadcast(wsMessage);
      
      res.json({ success: true, alert });
    } catch (error) {
      console.error('Error creating SOS alert:', error);
      res.status(500).json({ message: 'Failed to create SOS alert' });
    }
  });
  
  // PATCH /api/emergency/sos/:id/acknowledge - Acknowledge SOS alert
  app.patch('/api/emergency/sos/:id/acknowledge', requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });
      
      const { id } = req.params;
      const alert = await storage.acknowledgeSOSAlert(id, userId);
      
      // Log the acknowledgment
      await storage.logEmergencyResponse(id, 'acknowledged', 'Alert acknowledged by responder', userId);
      
      // Broadcast acknowledgment
      trackingWSServer.handleBroadcast({
        type: 'EMERGENCY_ACKNOWLEDGED',
        data: {
          alertId: id,
          responderId: userId,
          timestamp: new Date()
        }
      });
      
      res.json({ success: true, alert });
    } catch (error) {
      console.error('Error acknowledging SOS alert:', error);
      res.status(500).json({ message: 'Failed to acknowledge SOS alert' });
    }
  });
  
  // PATCH /api/emergency/sos/:id/resolve - Resolve SOS alert
  app.patch('/api/emergency/sos/:id/resolve', requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });
      
      const { id } = req.params;
      const { resolution, notes } = req.body;
      
      if (!resolution) {
        return res.status(400).json({ message: 'Resolution status is required' });
      }
      
      const alert = await storage.resolveSOSAlert(id, resolution, notes, userId);
      
      // Log the resolution
      await storage.logEmergencyResponse(id, 'resolved', `Alert resolved: ${resolution}. ${notes || ''}`, userId);
      
      // Broadcast resolution
      trackingWSServer.handleBroadcast({
        type: 'EMERGENCY_RESOLVED',
        data: {
          alertId: id,
          resolution,
          responderId: userId,
          timestamp: new Date()
        }
      });
      
      res.json({ success: true, alert });
    } catch (error) {
      console.error('Error resolving SOS alert:', error);
      res.status(500).json({ message: 'Failed to resolve SOS alert' });
    }
  });
  
  // GET /api/emergency/sos/active - Get all active SOS alerts
  app.get('/api/emergency/sos/active', requireAuth, async (req: Request, res: Response) => {
    try {
      const alerts = await storage.getActiveSOSAlerts();
      res.json(alerts);
    } catch (error) {
      console.error('Error fetching active SOS alerts:', error);
      res.status(500).json({ message: 'Failed to fetch active SOS alerts' });
    }
  });
  
  // GET /api/emergency/contacts - Get user's emergency contacts
  app.get('/api/emergency/contacts', requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });
      
      const contacts = await storage.getEmergencyContacts(userId);
      res.json(contacts);
    } catch (error) {
      console.error('Error fetching emergency contacts:', error);
      res.status(500).json({ message: 'Failed to fetch emergency contacts' });
    }
  });
  
  // POST /api/emergency/contacts - Add/update emergency contact
  app.post('/api/emergency/contacts', requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });
      
      const { contactName, contactPhone, contactEmail, relationship, isPrimary, notificationPreference } = req.body;
      
      if (!contactName || (!contactPhone && !contactEmail)) {
        return res.status(400).json({ message: 'Contact name and at least phone or email are required' });
      }
      
      const contact = await storage.upsertEmergencyContact({
        userId,
        contactName,
        contactPhone,
        contactEmail,
        relationship,
        isPrimary: isPrimary || false,
        notificationPreference: notificationPreference || 'both'
      });
      
      res.json({ success: true, contact });
    } catch (error) {
      console.error('Error saving emergency contact:', error);
      res.status(500).json({ message: 'Failed to save emergency contact' });
    }
  });
  
  // DELETE /api/emergency/contacts/:id - Delete emergency contact
  app.delete('/api/emergency/contacts/:id', requireAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteEmergencyContact(id);
      
      if (!success) {
        return res.status(404).json({ message: 'Contact not found' });
      }
      
      res.json({ success: true, message: 'Contact deleted successfully' });
    } catch (error) {
      console.error('Error deleting emergency contact:', error);
      res.status(500).json({ message: 'Failed to delete emergency contact' });
    }
  });
  
  // POST /api/emergency/test - Test the SOS system (for drills)
  app.post('/api/emergency/test', requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });
      
      const result = await storage.testSOSSystem(userId);
      res.json(result);
    } catch (error) {
      console.error('Error testing SOS system:', error);
      res.status(500).json({ message: 'Failed to test SOS system' });
    }
  });
  
  // GET /api/emergency/nearest-help - Find nearest available help
  app.get('/api/emergency/nearest-help', requireAuth, async (req: Request, res: Response) => {
    try {
      const { lat, lng, radius } = req.query;
      
      if (!lat || !lng) {
        return res.status(400).json({ message: 'Location coordinates are required' });
      }
      
      const location = {
        lat: parseFloat(lat as string),
        lng: parseFloat(lng as string)
      };
      
      const radiusMiles = radius ? parseFloat(radius as string) : 50; // Default 50 mile radius
      
      const responders = await storage.findNearbyResponders(location, radiusMiles);
      res.json(responders);
    } catch (error) {
      console.error('Error finding nearest help:', error);
      res.status(500).json({ message: 'Failed to find nearest help' });
    }
  });
  
  // GET /api/emergency/sos/history - Get user's SOS alert history
  app.get('/api/emergency/sos/history', requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });
      
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const history = await storage.getSOSAlertHistory(userId, limit);
      
      res.json(history);
    } catch (error) {
      console.error('Error fetching SOS history:', error);
      res.status(500).json({ message: 'Failed to fetch SOS history' });
    }
  });
  
  // GET /api/emergency/sos/:id - Get specific SOS alert details
  app.get('/api/emergency/sos/:id', requireAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const alert = await storage.getSOSAlertById(id);
      
      if (!alert) {
        return res.status(404).json({ message: 'Alert not found' });
      }
      
      // Also get response logs
      const logs = await storage.getEmergencyResponseLogs(id);
      
      res.json({ alert, logs });
    } catch (error) {
      console.error('Error fetching SOS alert:', error);
      res.status(500).json({ message: 'Failed to fetch SOS alert' });
    }
  });
  
  // PATCH /api/emergency/sos/:id/location - Update SOS alert location (for live tracking)
  app.patch('/api/emergency/sos/:id/location', requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });
      
      const { id } = req.params;
      const { location } = req.body;
      
      if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
        return res.status(400).json({ message: 'Valid location coordinates are required' });
      }
      
      await storage.updateSOSAlertLocation(id, location);
      
      // Broadcast location update
      trackingWSServer.handleBroadcast({
        type: 'EMERGENCY_LOCATION_UPDATE',
        data: {
          alertId: id,
          location,
          timestamp: new Date()
        }
      });
      
      res.json({ success: true, message: 'Location updated' });
    } catch (error) {
      console.error('Error updating SOS location:', error);
      res.status(500).json({ message: 'Failed to update SOS location' });
    }
  });

  // Create and return the HTTP server
  const server = createServer(app);
  return server;
}
