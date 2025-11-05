import express, { type Express, type Request, type Response, type NextFunction } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import bcrypt from "bcrypt";
import { z } from "zod";
import { storage } from "./storage";
import aiService from "./ai-service";
import { 
  insertUserSchema,
  insertDriverProfileSchema,
  insertContractorProfileSchema,
  insertJobSchema,
  insertJobPhotoSchema,
  insertJobMessageSchema,
  insertContractorRatingSchema,
  insertContractorDocumentSchema,
  insertFleetAccountSchema,
  insertFleetVehicleSchema,
  insertFleetContactSchema,
  insertFleetPricingOverrideSchema,
  insertPaymentMethodSchema,
  insertTransactionSchema,
  insertRefundSchema,
  insertAdminSettingSchema,
  insertEmailTemplateSchema,
  insertIntegrationsConfigSchema,
  insertPricingRuleSchema,
  insertServiceTypeSchema,
  insertServicePricingSchema,
  insertServiceAreaSchema,
  insertContractorServiceSchema,
  insertContractorAvailabilitySchema,
  type User,
  type Job,
  type ContractorProfile,
  type FleetAccount,
  userRoleEnum,
  jobStatusEnum,
  jobTypeEnum,
  paymentStatusEnum,
  refundStatusEnum
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

  // Rate contractor after job completion
  app.post('/api/jobs/:id/rate',
    requireAuth,
    requireRole('driver', 'fleet_manager'),
    validateRequest(insertContractorRatingSchema.omit({ 
      contractorId: true, 
      jobId: true, 
      ratedBy: true 
    })),
    async (req: Request, res: Response) => {
      try {
        const job = await storage.getJob(req.params.id);
        
        if (!job) {
          return res.status(404).json({ message: 'Job not found' });
        }

        if (!job.contractorId) {
          return res.status(400).json({ message: 'No contractor assigned to this job' });
        }

        if (job.status !== 'completed') {
          return res.status(400).json({ message: 'Job must be completed before rating' });
        }

        const rating = await storage.addContractorRating({
          ...req.body,
          contractorId: job.contractorId,
          jobId: job.id,
          ratedBy: req.session.userId!
        });

        // Update contractor average rating
        const avgRating = await storage.calculateAverageRating(job.contractorId);
        await storage.updateContractorProfile(job.contractorId, {
          averageRating: avgRating.toString()
        });

        res.status(201).json({
          message: 'Rating submitted successfully',
          rating
        });
      } catch (error) {
        console.error('Rate contractor error:', error);
        res.status(500).json({ message: 'Failed to submit rating' });
      }
    }
  );

  // ==================== CONTRACTOR ROUTES ====================

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

  // ==================== WEBHOOK ROUTES ====================

  // Stripe payment webhook
  app.post('/api/webhooks/stripe',
    express.raw({ type: 'application/json' }),
    async (req: Request, res: Response) => {
      try {
        // Here you would verify Stripe webhook signature
        // and process the event
        
        const event = req.body;
        
        // Process different event types
        switch (event.type) {
          case 'payment_intent.succeeded':
            // Update transaction status
            break;
          case 'payment_intent.failed':
            // Handle failed payment
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