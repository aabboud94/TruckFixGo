import express, { type Express, type Request, type Response, type NextFunction } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import bcrypt from "bcrypt";
import { z } from "zod";
import { db } from "./db";
import { storage } from "./storage";
import { desc, asc } from "drizzle-orm";
import aiService from "./ai-service";
import { reminderService } from "./reminder-service";
import { reminderScheduler } from "./reminder-scheduler";
import efsComdataService from "./efs-comdata-service";
import stripeService from "./stripe-service";
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
  splitPayments,
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
  planTypeEnum
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
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
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

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Setup session middleware
  app.use(session({
    secret: process.env.SESSION_SECRET || 'truckfixgo-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Apply CORS to all routes
  app.use(corsMiddleware);

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
          await storage.createDriverProfile({
            userId: user.id
          });
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
          user = await storage.getUserByEmail(email);
        } else if (phone) {
          user = await storage.getUserByPhone(phone);
        }

        if (!user || !user.password) {
          return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isValid = await bcrypt.compare(password, user.password);
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

  // Guest booking
  app.post('/api/auth/guest-booking',
    rateLimiter(3, 60000),
    validateRequest(insertJobSchema.extend({
      guestPhone: z.string(),
      guestEmail: z.string().email().optional()
    })),
    async (req: Request, res: Response) => {
      try {
        const { guestPhone, guestEmail, ...jobData } = req.body;
        
        // Create guest user
        const guestUser = await storage.createUser({
          phone: guestPhone,
          email: guestEmail,
          role: 'driver',
          isGuest: true,
          isActive: true
        });

        // Create job
        const job = await storage.createJob({
          ...jobData,
          customerId: guestUser.id
        });

        res.status(201).json({
          message: 'Guest booking created successfully',
          job,
          guestUserId: guestUser.id,
          trackingUrl: `/api/public/track/${job.id}`
        });
      } catch (error) {
        console.error('Guest booking error:', error);
        res.status(500).json({ message: 'Guest booking failed' });
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

  // ==================== JOB ROUTES ====================

  // Create new job
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

  // Get contractor's active job
  app.get('/api/contractor/active-job', 
    requireAuth,
    requireRole('contractor'),
    async (req: Request, res: Response) => {
      try {
        // Find active job for contractor
        const jobs = await storage.findJobs({
          contractorId: req.session.userId!,
          status: ['assigned', 'en_route', 'on_site'] as any,
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

  // Assign contractor to job
  app.post('/api/jobs/:id/assign',
    requireAuth,
    requireRole('admin', 'dispatcher'),
    validateRequest(z.object({
      contractorId: z.string()
    })),
    async (req: Request, res: Response) => {
      try {
        const job = await storage.assignContractorToJob(
          req.params.id,
          req.body.contractorId
        );
        
        if (!job) {
          return res.status(404).json({ message: 'Job not found' });
        }

        res.json({
          message: 'Contractor assigned successfully',
          job
        });
      } catch (error) {
        console.error('Assign contractor error:', error);
        res.status(500).json({ message: 'Failed to assign contractor' });
      }
    }
  );

  // Upload photos for job
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

  // Send message in job chat
  app.post('/api/jobs/:id/messages',
    requireAuth,
    validateRequest(insertJobMessageSchema.omit({ jobId: true, senderId: true })),
    async (req: Request, res: Response) => {
      try {
        const message = await storage.addJobMessage({
          ...req.body,
          jobId: req.params.id,
          senderId: req.session.userId!
        });
        
        res.status(201).json({
          message: 'Message sent successfully',
          data: message
        });
      } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ message: 'Failed to send message' });
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
      metadata: z.any().optional()
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

        // If Stripe payment method, get details from Stripe
        if (req.body.stripePaymentMethodId && process.env.STRIPE_SECRET_KEY) {
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
        const pdfBuffer = await PDFService.generateInvoice({
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
        const pdfBuffer = await PDFService.generateEarningsStatement({
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
        const pdfBuffer = await PDFService.generateTaxDocument({
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
        const filters = {
          ...getPagination(req),
          pricingTier: req.query.pricingTier as any,
          isActive: req.query.isActive === 'true',
          companyName: req.query.companyName as string
        };

        const fleets = await storage.findFleetAccounts(filters);
        
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
        const stats = await storage.getFleetUsageStats(req.params.id);
        
        res.json({ analytics: stats });
      } catch (error) {
        console.error('Get fleet analytics error:', error);
        res.status(500).json({ message: 'Failed to get fleet analytics' });
      }
    }
  );

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

  // ==================== SPLIT PAYMENT ROUTES ====================
  
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
        const settings = await storage.getAllSettings();
        
        res.json({ settings });
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

  // Get platform KPIs
  app.get('/api/admin/metrics',
    requireAuth,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const metrics = await storage.getPlatformMetrics();
        
        res.json({ metrics });
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

  // Manage contractor approvals
  app.get('/api/admin/contractors',
    requireAuth,
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const filters = {
          ...getPagination(req),
          performanceTier: req.query.performanceTier as any,
          isAvailable: req.query.isAvailable === 'true'
        };
        
        const contractors = await storage.findContractors(filters);
        
        res.json({ contractors });
      } catch (error) {
        console.error('Get contractors for approval error:', error);
        res.status(500).json({ message: 'Failed to get contractors' });
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

  // Update contractor application
  app.put('/api/contractor/apply/:id',
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const application = await storage.getContractorApplication(req.params.id);
        
        if (!application) {
          return res.status(404).json({ message: 'Application not found' });
        }

        // Check ownership if not admin
        if (req.session.role !== 'admin' && application.email !== req.body.email) {
          return res.status(403).json({ message: 'Access denied' });
        }

        // Don't allow updates to approved/rejected applications
        if (['approved', 'rejected'].includes(application.status)) {
          return res.status(400).json({
            message: 'Cannot update finalized application'
          });
        }

        const updatedApplication = await storage.updateContractorApplication(
          req.params.id,
          {
            ...req.body,
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

        // Check required fields are complete
        const requiredFields = [
          'firstName', 'lastName', 'email', 'phone', 'address',
          'city', 'state', 'zip', 'experienceLevel'
        ];

        for (const field of requiredFields) {
          if (!application[field as keyof typeof application]) {
            return res.status(400).json({
              message: `Incomplete application: missing ${field}`
            });
          }
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

        // Send confirmation email
        // await sendEmail(application.email, 'Application Received', ...);

        res.json({
          message: 'Application submitted successfully',
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
          
          // Create contractor profile from approved application
          try {
            const contractorProfile = await storage.createContractorProfile({
              userId: '', // This would be created after user registration
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
          } catch (profileError) {
            console.error('Create contractor profile error:', profileError);
          }
        }

        const updatedApplication = await storage.updateContractorApplication(
          req.params.id,
          updateData
        );

        // Send notification email
        // await sendStatusUpdateEmail(application.email, status);

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
          nextBillingDate: new Date(stripeSubscription.current_period_end * 1000),
          trialEndDate: stripeSubscription.trial_end ? new Date(stripeSubscription.trial_end * 1000) : undefined,
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
          periodEnd: subscription.nextBillingDate,
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

  return httpServer;
}