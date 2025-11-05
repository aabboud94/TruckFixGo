import { 
  users, 
  sessions,
  driverProfiles,
  contractorProfiles,
  fleetAccounts,
  fleetVehicles,
  fleetContacts,
  fleetPricingOverrides,
  serviceTypes,
  servicePricing,
  serviceAreas,
  jobs,
  jobPhotos,
  jobMessages,
  jobStatusHistory,
  contractorServices,
  contractorAvailability,
  contractorEarnings,
  contractorRatings,
  contractorDocuments,
  pricingRules,
  paymentMethods,
  transactions,
  invoices,
  refunds,
  adminSettings,
  emailTemplates,
  integrationsConfig,
  type User,
  type InsertUser,
  type Session,
  type InsertSession,
  type DriverProfile,
  type InsertDriverProfile,
  type ContractorProfile,
  type InsertContractorProfile,
  type FleetAccount,
  type InsertFleetAccount,
  type FleetVehicle,
  type InsertFleetVehicle,
  type FleetContact,
  type InsertFleetContact,
  type FleetPricingOverride,
  type InsertFleetPricingOverride,
  type ServiceType,
  type InsertServiceType,
  type ServicePricing,
  type InsertServicePricing,
  type ServiceArea,
  type InsertServiceArea,
  type Job,
  type InsertJob,
  type JobPhoto,
  type InsertJobPhoto,
  type JobMessage,
  type InsertJobMessage,
  type JobStatusHistory,
  type InsertJobStatusHistory,
  type ContractorService,
  type InsertContractorService,
  type ContractorAvailability,
  type InsertContractorAvailability,
  type ContractorEarning,
  type InsertContractorEarning,
  type ContractorRating,
  type InsertContractorRating,
  type ContractorDocument,
  type InsertContractorDocument,
  type PricingRule,
  type InsertPricingRule,
  type PaymentMethod,
  type InsertPaymentMethod,
  type Transaction,
  type InsertTransaction,
  type Invoice,
  type InsertInvoice,
  type Refund,
  type InsertRefund,
  type AdminSetting,
  type InsertAdminSetting,
  type EmailTemplate,
  type InsertEmailTemplate,
  type IntegrationsConfig,
  type InsertIntegrationsConfig,
  performanceTierEnum,
  fleetPricingTierEnum,
  jobTypeEnum,
  jobStatusEnum,
  paymentStatusEnum,
  refundStatusEnum
} from "@shared/schema";

import { db } from "./db";
import { eq, and, or, gte, lte, isNull, desc, asc, sql, inArray, ne, gt, lt } from "drizzle-orm";
import { randomUUID } from "crypto";
import memoize from "memoizee";

// Pagination options
export interface PaginationOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDir?: 'asc' | 'desc';
}

// Filter options for different entities
export interface JobFilterOptions extends PaginationOptions {
  status?: typeof jobStatusEnum.enumValues[number];
  jobType?: typeof jobTypeEnum.enumValues[number];
  contractorId?: string;
  customerId?: string;
  fleetAccountId?: string;
  fromDate?: Date;
  toDate?: Date;
}

export interface FleetFilterOptions extends PaginationOptions {
  pricingTier?: typeof fleetPricingTierEnum.enumValues[number];
  isActive?: boolean;
  companyName?: string;
}

export interface ContractorFilterOptions extends PaginationOptions {
  performanceTier?: typeof performanceTierEnum.enumValues[number];
  isAvailable?: boolean;
  isFleetCapable?: boolean;
  serviceRadius?: number;
}

export interface TransactionFilterOptions extends PaginationOptions {
  userId?: string;
  jobId?: string;
  status?: typeof paymentStatusEnum.enumValues[number];
  fromDate?: Date;
  toDate?: Date;
}

// Analytics data types
export interface PlatformMetrics {
  activeJobs: number;
  averageResponseTime: number;
  completionRate: number;
  totalRevenue: number;
  totalContractors: number;
  totalFleets: number;
}

export interface ContractorPerformanceMetrics {
  contractorId: string;
  totalJobs: number;
  completedJobs: number;
  averageRating: number;
  totalEarnings: number;
  averageResponseTime: number;
  completionRate: number;
}

export interface RevenueReport {
  fromDate: Date;
  toDate: Date;
  totalRevenue: number;
  revenueByService: Record<string, number>;
  revenueByFleet: Record<string, number>;
  averageJobValue: number;
  transactionCount: number;
}

export interface FleetUsageStats {
  fleetId: string;
  totalJobs: number;
  totalVehicles: number;
  totalSpent: number;
  averageJobsPerVehicle: number;
  mostUsedServices: Array<{serviceType: string, count: number}>;
}

// Main storage interface
export interface IStorage {
  // ==================== USER & AUTH OPERATIONS ====================
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  
  createSession(session: InsertSession): Promise<Session>;
  getSession(token: string): Promise<Session | undefined>;
  validateSession(token: string): Promise<boolean>;
  invalidateSession(token: string): Promise<boolean>;
  
  getDriverProfile(userId: string): Promise<DriverProfile | undefined>;
  createDriverProfile(profile: InsertDriverProfile): Promise<DriverProfile>;
  updateDriverProfile(userId: string, updates: Partial<InsertDriverProfile>): Promise<DriverProfile | undefined>;
  
  getContractorProfile(userId: string): Promise<ContractorProfile | undefined>;
  createContractorProfile(profile: InsertContractorProfile): Promise<ContractorProfile>;
  updateContractorProfile(userId: string, updates: Partial<InsertContractorProfile>): Promise<ContractorProfile | undefined>;
  updatePerformanceTier(userId: string, tier: typeof performanceTierEnum.enumValues[number]): Promise<boolean>;
  
  checkUserRole(userId: string, requiredRole: string): Promise<boolean>;
  
  // ==================== JOB OPERATIONS ====================
  createJob(job: InsertJob): Promise<Job>;
  getJob(id: string): Promise<Job | undefined>;
  updateJob(id: string, updates: Partial<InsertJob>): Promise<Job | undefined>;
  updateJobStatus(id: string, status: typeof jobStatusEnum.enumValues[number], changedBy?: string, reason?: string): Promise<Job | undefined>;
  findJobs(filters: JobFilterOptions): Promise<Job[]>;
  assignContractorToJob(jobId: string, contractorId: string): Promise<Job | undefined>;
  
  addJobPhoto(photo: InsertJobPhoto): Promise<JobPhoto>;
  getJobPhotos(jobId: string): Promise<JobPhoto[]>;
  
  addJobMessage(message: InsertJobMessage): Promise<JobMessage>;
  getJobMessages(jobId: string, limit?: number): Promise<JobMessage[]>;
  
  calculateJobPrice(jobId: string): Promise<number>;
  
  getJobStatusHistory(jobId: string): Promise<JobStatusHistory[]>;
  
  // ==================== FLEET OPERATIONS ====================
  createFleetAccount(fleet: InsertFleetAccount): Promise<FleetAccount>;
  getFleetAccount(id: string): Promise<FleetAccount | undefined>;
  updateFleetAccount(id: string, updates: Partial<InsertFleetAccount>): Promise<FleetAccount | undefined>;
  deleteFleetAccount(id: string): Promise<boolean>;
  findFleetAccounts(filters: FleetFilterOptions): Promise<FleetAccount[]>;
  
  createFleetVehicle(vehicle: InsertFleetVehicle): Promise<FleetVehicle>;
  getFleetVehicle(id: string): Promise<FleetVehicle | undefined>;
  updateFleetVehicle(id: string, updates: Partial<InsertFleetVehicle>): Promise<FleetVehicle | undefined>;
  deleteFleetVehicle(id: string): Promise<boolean>;
  getFleetVehicles(fleetAccountId: string): Promise<FleetVehicle[]>;
  
  createFleetContact(contact: InsertFleetContact): Promise<FleetContact>;
  updateFleetContact(id: string, updates: Partial<InsertFleetContact>): Promise<FleetContact | undefined>;
  deleteFleetContact(id: string): Promise<boolean>;
  getFleetContacts(fleetAccountId: string): Promise<FleetContact[]>;
  
  createFleetPricingOverride(override: InsertFleetPricingOverride): Promise<FleetPricingOverride>;
  updateFleetPricingOverride(id: string, updates: Partial<InsertFleetPricingOverride>): Promise<FleetPricingOverride | undefined>;
  getFleetPricingOverrides(fleetAccountId: string): Promise<FleetPricingOverride[]>;
  
  createFleetJobBatch(fleetAccountId: string, jobs: InsertJob[]): Promise<Job[]>;
  
  // ==================== SERVICE OPERATIONS ====================
  createServiceType(service: InsertServiceType): Promise<ServiceType>;
  getServiceType(id: string): Promise<ServiceType | undefined>;
  updateServiceType(id: string, updates: Partial<InsertServiceType>): Promise<ServiceType | undefined>;
  getActiveServiceTypes(): Promise<ServiceType[]>;
  
  createServicePricing(pricing: InsertServicePricing): Promise<ServicePricing>;
  updateServicePricing(id: string, updates: Partial<InsertServicePricing>): Promise<ServicePricing | undefined>;
  getCurrentPricing(serviceTypeId: string): Promise<ServicePricing | undefined>;
  
  createServiceArea(area: InsertServiceArea): Promise<ServiceArea>;
  updateServiceArea(id: string, updates: Partial<InsertServiceArea>): Promise<ServiceArea | undefined>;
  getActiveServiceAreas(): Promise<ServiceArea[]>;
  checkServiceAvailability(location: {lat: number, lng: number}): Promise<boolean>;
  
  createPricingRule(rule: InsertPricingRule): Promise<PricingRule>;
  updatePricingRule(id: string, updates: Partial<InsertPricingRule>): Promise<PricingRule | undefined>;
  getActivePricingRules(): Promise<PricingRule[]>;
  
  // ==================== CONTRACTOR OPERATIONS ====================
  linkContractorService(service: InsertContractorService): Promise<ContractorService>;
  unlinkContractorService(contractorId: string, serviceTypeId: string): Promise<boolean>;
  getContractorServices(contractorId: string): Promise<ContractorService[]>;
  
  setContractorAvailability(availability: InsertContractorAvailability): Promise<ContractorAvailability>;
  getContractorAvailability(contractorId: string): Promise<ContractorAvailability[]>;
  updateContractorLocation(contractorId: string, location: {lat: number, lng: number}): Promise<boolean>;
  
  addContractorEarning(earning: InsertContractorEarning): Promise<ContractorEarning>;
  getContractorEarnings(contractorId: string, isPaid?: boolean): Promise<ContractorEarning[]>;
  calculateContractorEarnings(contractorId: string, fromDate: Date, toDate: Date): Promise<number>;
  markEarningsAsPaid(contractorId: string, earningIds: string[]): Promise<boolean>;
  
  addContractorRating(rating: InsertContractorRating): Promise<ContractorRating>;
  getContractorRatings(contractorId: string): Promise<ContractorRating[]>;
  calculateAverageRating(contractorId: string): Promise<number>;
  
  addContractorDocument(document: InsertContractorDocument): Promise<ContractorDocument>;
  updateContractorDocument(id: string, updates: Partial<InsertContractorDocument>): Promise<ContractorDocument | undefined>;
  getContractorDocuments(contractorId: string): Promise<ContractorDocument[]>;
  verifyContractorDocument(documentId: string, verifiedBy: string): Promise<boolean>;
  
  getContractorPerformanceMetrics(contractorId: string): Promise<ContractorPerformanceMetrics>;
  findAvailableContractors(serviceTypeId: string, location: {lat: number, lng: number}, radius?: number): Promise<ContractorProfile[]>;
  
  // ==================== PAYMENT OPERATIONS ====================
  createPaymentMethod(method: InsertPaymentMethod): Promise<PaymentMethod>;
  updatePaymentMethod(id: string, updates: Partial<InsertPaymentMethod>): Promise<PaymentMethod | undefined>;
  deletePaymentMethod(id: string): Promise<boolean>;
  getUserPaymentMethods(userId: string): Promise<PaymentMethod[]>;
  setDefaultPaymentMethod(userId: string, paymentMethodId: string): Promise<boolean>;
  
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: string, updates: Partial<InsertTransaction>): Promise<Transaction | undefined>;
  getTransaction(id: string): Promise<Transaction | undefined>;
  findTransactions(filters: TransactionFilterOptions): Promise<Transaction[]>;
  
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: string, updates: Partial<InsertInvoice>): Promise<Invoice | undefined>;
  getInvoice(id: string): Promise<Invoice | undefined>;
  getInvoiceByJobId(jobId: string): Promise<Invoice | undefined>;
  getUnpaidInvoices(customerId: string): Promise<Invoice[]>;
  markInvoiceAsPaid(invoiceId: string, paidAt: Date): Promise<boolean>;
  
  createRefund(refund: InsertRefund): Promise<Refund>;
  updateRefundStatus(id: string, status: typeof refundStatusEnum.enumValues[number]): Promise<Refund | undefined>;
  getRefundsByTransaction(transactionId: string): Promise<Refund[]>;
  
  // ==================== ADMIN OPERATIONS ====================
  getSetting(key: string): Promise<AdminSetting | undefined>;
  updateSetting(key: string, value: any): Promise<AdminSetting>;
  getAllSettings(): Promise<AdminSetting[]>;
  
  createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate>;
  updateEmailTemplate(id: string, updates: Partial<InsertEmailTemplate>): Promise<EmailTemplate | undefined>;
  getEmailTemplate(templateKey: string): Promise<EmailTemplate | undefined>;
  
  getIntegration(provider: string): Promise<IntegrationsConfig | undefined>;
  updateIntegration(provider: string, config: any): Promise<IntegrationsConfig>;
  
  // ==================== ANALYTICS OPERATIONS ====================
  getPlatformMetrics(fromDate?: Date, toDate?: Date): Promise<PlatformMetrics>;
  getContractorPerformanceByTier(tier: typeof performanceTierEnum.enumValues[number]): Promise<ContractorPerformanceMetrics[]>;
  generateRevenueReport(fromDate: Date, toDate: Date): Promise<RevenueReport>;
  getFleetUsageStatistics(fleetId: string, fromDate?: Date, toDate?: Date): Promise<FleetUsageStats>;
  getResponseTimeStats(): Promise<{average: number, median: number, percentile95: number}>;
}

// PostgreSQL implementation using Drizzle ORM
export class PostgreSQLStorage implements IStorage {
  // Cache for frequently accessed settings
  private settingsCache = memoize(
    async (key: string) => {
      const setting = await db.select().from(adminSettings).where(eq(adminSettings.key, key)).limit(1);
      return setting[0];
    },
    { maxAge: 60000, preFetch: true } // Cache for 1 minute
  );

  // ==================== USER & AUTH OPERATIONS ====================
  
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    const result = await db.update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.update(users)
      .set({ deletedAt: new Date(), isActive: false })
      .where(eq(users.id, id))
      .returning();
    return result.length > 0;
  }

  async createSession(session: InsertSession): Promise<Session> {
    const result = await db.insert(sessions).values(session).returning();
    return result[0];
  }

  async getSession(token: string): Promise<Session | undefined> {
    const result = await db.select().from(sessions).where(eq(sessions.token, token)).limit(1);
    return result[0];
  }

  async validateSession(token: string): Promise<boolean> {
    const session = await this.getSession(token);
    if (!session) return false;
    return new Date() < new Date(session.expiresAt);
  }

  async invalidateSession(token: string): Promise<boolean> {
    const result = await db.delete(sessions).where(eq(sessions.token, token)).returning();
    return result.length > 0;
  }

  async getDriverProfile(userId: string): Promise<DriverProfile | undefined> {
    const result = await db.select().from(driverProfiles).where(eq(driverProfiles.userId, userId)).limit(1);
    return result[0];
  }

  async createDriverProfile(profile: InsertDriverProfile): Promise<DriverProfile> {
    const result = await db.insert(driverProfiles).values(profile).returning();
    return result[0];
  }

  async updateDriverProfile(userId: string, updates: Partial<InsertDriverProfile>): Promise<DriverProfile | undefined> {
    const result = await db.update(driverProfiles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(driverProfiles.userId, userId))
      .returning();
    return result[0];
  }

  async getContractorProfile(userId: string): Promise<ContractorProfile | undefined> {
    const result = await db.select().from(contractorProfiles).where(eq(contractorProfiles.userId, userId)).limit(1);
    return result[0];
  }

  async createContractorProfile(profile: InsertContractorProfile): Promise<ContractorProfile> {
    const result = await db.insert(contractorProfiles).values(profile).returning();
    return result[0];
  }

  async updateContractorProfile(userId: string, updates: Partial<InsertContractorProfile>): Promise<ContractorProfile | undefined> {
    const result = await db.update(contractorProfiles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(contractorProfiles.userId, userId))
      .returning();
    return result[0];
  }

  async updatePerformanceTier(userId: string, tier: typeof performanceTierEnum.enumValues[number]): Promise<boolean> {
    const result = await db.update(contractorProfiles)
      .set({ performanceTier: tier, updatedAt: new Date() })
      .where(eq(contractorProfiles.userId, userId))
      .returning();
    return result.length > 0;
  }

  async checkUserRole(userId: string, requiredRole: string): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) return false;
    return user.role === requiredRole;
  }

  // ==================== JOB OPERATIONS ====================
  
  async createJob(job: InsertJob): Promise<Job> {
    const jobNumber = `JOB-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const result = await db.insert(jobs).values({ ...job, jobNumber }).returning();
    
    // Create initial status history
    await db.insert(jobStatusHistory).values({
      jobId: result[0].id,
      toStatus: result[0].status,
      changedBy: job.customerId
    });
    
    return result[0];
  }

  async getJob(id: string): Promise<Job | undefined> {
    const result = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
    return result[0];
  }

  async updateJob(id: string, updates: Partial<InsertJob>): Promise<Job | undefined> {
    const result = await db.update(jobs)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(jobs.id, id))
      .returning();
    return result[0];
  }

  async updateJobStatus(id: string, status: typeof jobStatusEnum.enumValues[number], changedBy?: string, reason?: string): Promise<Job | undefined> {
    const currentJob = await this.getJob(id);
    if (!currentJob) return undefined;

    // Update job status
    const statusUpdate: any = { status, updatedAt: new Date() };
    if (status === 'assigned') statusUpdate.assignedAt = new Date();
    if (status === 'en_route') statusUpdate.enRouteAt = new Date();
    if (status === 'on_site') statusUpdate.arrivedAt = new Date();
    if (status === 'completed') statusUpdate.completedAt = new Date();
    if (status === 'cancelled') statusUpdate.cancelledAt = new Date();

    const result = await db.update(jobs)
      .set(statusUpdate)
      .where(eq(jobs.id, id))
      .returning();

    // Add to status history
    await db.insert(jobStatusHistory).values({
      jobId: id,
      fromStatus: currentJob.status,
      toStatus: status,
      changedBy,
      reason
    });

    return result[0];
  }

  async findJobs(filters: JobFilterOptions): Promise<Job[]> {
    let query = db.select().from(jobs);
    const conditions = [];

    if (filters.status) conditions.push(eq(jobs.status, filters.status));
    if (filters.jobType) conditions.push(eq(jobs.jobType, filters.jobType));
    if (filters.contractorId) conditions.push(eq(jobs.contractorId, filters.contractorId));
    if (filters.customerId) conditions.push(eq(jobs.customerId, filters.customerId));
    if (filters.fleetAccountId) conditions.push(eq(jobs.fleetAccountId, filters.fleetAccountId));
    if (filters.fromDate) conditions.push(gte(jobs.createdAt, filters.fromDate));
    if (filters.toDate) conditions.push(lte(jobs.createdAt, filters.toDate));

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    // Apply ordering
    const orderColumn = filters.orderBy === 'createdAt' ? jobs.createdAt : jobs.createdAt;
    query = (filters.orderDir === 'asc' ? query.orderBy(asc(orderColumn)) : query.orderBy(desc(orderColumn))) as any;

    // Apply pagination
    if (filters.limit) query = query.limit(filters.limit) as any;
    if (filters.offset) query = query.offset(filters.offset) as any;

    return await query;
  }

  async assignContractorToJob(jobId: string, contractorId: string): Promise<Job | undefined> {
    const result = await db.update(jobs)
      .set({ 
        contractorId, 
        status: 'assigned',
        assignedAt: new Date(),
        updatedAt: new Date() 
      })
      .where(eq(jobs.id, jobId))
      .returning();
    
    if (result.length > 0) {
      await db.insert(jobStatusHistory).values({
        jobId,
        fromStatus: 'new',
        toStatus: 'assigned',
        changedBy: contractorId
      });
    }
    
    return result[0];
  }

  async addJobPhoto(photo: InsertJobPhoto): Promise<JobPhoto> {
    const result = await db.insert(jobPhotos).values(photo).returning();
    return result[0];
  }

  async getJobPhotos(jobId: string): Promise<JobPhoto[]> {
    return await db.select().from(jobPhotos)
      .where(eq(jobPhotos.jobId, jobId))
      .orderBy(desc(jobPhotos.createdAt));
  }

  async addJobMessage(message: InsertJobMessage): Promise<JobMessage> {
    const result = await db.insert(jobMessages).values(message).returning();
    return result[0];
  }

  async getJobMessages(jobId: string, limit: number = 50): Promise<JobMessage[]> {
    return await db.select().from(jobMessages)
      .where(eq(jobMessages.jobId, jobId))
      .orderBy(desc(jobMessages.createdAt))
      .limit(limit);
  }

  async calculateJobPrice(jobId: string): Promise<number> {
    const job = await this.getJob(jobId);
    if (!job) return 0;

    const pricing = await this.getCurrentPricing(job.serviceTypeId);
    if (!pricing) return 0;

    let total = Number(pricing.basePrice);

    // Add surcharges
    if (job.jobType === 'emergency' && pricing.emergencySurcharge) {
      total += Number(pricing.emergencySurcharge);
    }

    // Check for fleet pricing overrides
    if (job.fleetAccountId) {
      const overrides = await this.getFleetPricingOverrides(job.fleetAccountId);
      const override = overrides.find(o => o.serviceTypeId === job.serviceTypeId);
      if (override) {
        if (override.flatRateOverride) {
          return Number(override.flatRateOverride);
        }
        if (override.discountPercentage) {
          total *= (1 - Number(override.discountPercentage) / 100);
        }
      }
    }

    // Add labor and parts
    if (job.laborHours && pricing.perHourRate) {
      total += Number(job.laborHours) * Number(pricing.perHourRate);
    }
    if (job.partsTotal) {
      total += Number(job.partsTotal);
    }
    if (job.surchargeTotal) {
      total += Number(job.surchargeTotal);
    }

    return total;
  }

  async getJobStatusHistory(jobId: string): Promise<JobStatusHistory[]> {
    return await db.select().from(jobStatusHistory)
      .where(eq(jobStatusHistory.jobId, jobId))
      .orderBy(desc(jobStatusHistory.createdAt));
  }

  // ==================== FLEET OPERATIONS ====================
  
  async createFleetAccount(fleet: InsertFleetAccount): Promise<FleetAccount> {
    const result = await db.insert(fleetAccounts).values(fleet).returning();
    return result[0];
  }

  async getFleetAccount(id: string): Promise<FleetAccount | undefined> {
    const result = await db.select().from(fleetAccounts)
      .where(and(eq(fleetAccounts.id, id), isNull(fleetAccounts.deletedAt)))
      .limit(1);
    return result[0];
  }

  async updateFleetAccount(id: string, updates: Partial<InsertFleetAccount>): Promise<FleetAccount | undefined> {
    const result = await db.update(fleetAccounts)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(fleetAccounts.id, id), isNull(fleetAccounts.deletedAt)))
      .returning();
    return result[0];
  }

  async deleteFleetAccount(id: string): Promise<boolean> {
    const result = await db.update(fleetAccounts)
      .set({ deletedAt: new Date(), isActive: false })
      .where(eq(fleetAccounts.id, id))
      .returning();
    return result.length > 0;
  }

  async findFleetAccounts(filters: FleetFilterOptions): Promise<FleetAccount[]> {
    let query = db.select().from(fleetAccounts);
    const conditions = [isNull(fleetAccounts.deletedAt)];

    if (filters.pricingTier) conditions.push(eq(fleetAccounts.pricingTier, filters.pricingTier));
    if (filters.isActive !== undefined) conditions.push(eq(fleetAccounts.isActive, filters.isActive));
    if (filters.companyName) conditions.push(sql`${fleetAccounts.companyName} ILIKE ${`%${filters.companyName}%`}`);

    query = query.where(and(...conditions)) as any;

    // Apply ordering
    const orderColumn = filters.orderBy === 'companyName' ? fleetAccounts.companyName : fleetAccounts.createdAt;
    query = (filters.orderDir === 'asc' ? query.orderBy(asc(orderColumn)) : query.orderBy(desc(orderColumn))) as any;

    // Apply pagination
    if (filters.limit) query = query.limit(filters.limit) as any;
    if (filters.offset) query = query.offset(filters.offset) as any;

    return await query;
  }

  async createFleetVehicle(vehicle: InsertFleetVehicle): Promise<FleetVehicle> {
    const result = await db.insert(fleetVehicles).values(vehicle).returning();
    return result[0];
  }

  async getFleetVehicle(id: string): Promise<FleetVehicle | undefined> {
    const result = await db.select().from(fleetVehicles).where(eq(fleetVehicles.id, id)).limit(1);
    return result[0];
  }

  async updateFleetVehicle(id: string, updates: Partial<InsertFleetVehicle>): Promise<FleetVehicle | undefined> {
    const result = await db.update(fleetVehicles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(fleetVehicles.id, id))
      .returning();
    return result[0];
  }

  async deleteFleetVehicle(id: string): Promise<boolean> {
    const result = await db.update(fleetVehicles)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(fleetVehicles.id, id))
      .returning();
    return result.length > 0;
  }

  async getFleetVehicles(fleetAccountId: string): Promise<FleetVehicle[]> {
    return await db.select().from(fleetVehicles)
      .where(and(eq(fleetVehicles.fleetAccountId, fleetAccountId), eq(fleetVehicles.isActive, true)))
      .orderBy(asc(fleetVehicles.unitNumber));
  }

  async createFleetContact(contact: InsertFleetContact): Promise<FleetContact> {
    const result = await db.insert(fleetContacts).values(contact).returning();
    return result[0];
  }

  async updateFleetContact(id: string, updates: Partial<InsertFleetContact>): Promise<FleetContact | undefined> {
    const result = await db.update(fleetContacts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(fleetContacts.id, id))
      .returning();
    return result[0];
  }

  async deleteFleetContact(id: string): Promise<boolean> {
    const result = await db.delete(fleetContacts).where(eq(fleetContacts.id, id)).returning();
    return result.length > 0;
  }

  async getFleetContacts(fleetAccountId: string): Promise<FleetContact[]> {
    return await db.select().from(fleetContacts)
      .where(eq(fleetContacts.fleetAccountId, fleetAccountId))
      .orderBy(desc(fleetContacts.isPrimaryContact));
  }

  async createFleetPricingOverride(override: InsertFleetPricingOverride): Promise<FleetPricingOverride> {
    const result = await db.insert(fleetPricingOverrides).values(override).returning();
    return result[0];
  }

  async updateFleetPricingOverride(id: string, updates: Partial<InsertFleetPricingOverride>): Promise<FleetPricingOverride | undefined> {
    const result = await db.update(fleetPricingOverrides)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(fleetPricingOverrides.id, id))
      .returning();
    return result[0];
  }

  async getFleetPricingOverrides(fleetAccountId: string): Promise<FleetPricingOverride[]> {
    return await db.select().from(fleetPricingOverrides)
      .where(eq(fleetPricingOverrides.fleetAccountId, fleetAccountId));
  }

  async createFleetJobBatch(fleetAccountId: string, jobsData: InsertJob[]): Promise<Job[]> {
    const results: Job[] = [];
    
    // Use a transaction to ensure all jobs are created or none
    await db.transaction(async (tx) => {
      for (const jobData of jobsData) {
        const jobNumber = `JOB-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        const result = await tx.insert(jobs).values({ 
          ...jobData, 
          fleetAccountId, 
          jobNumber 
        }).returning();
        
        // Create initial status history
        await tx.insert(jobStatusHistory).values({
          jobId: result[0].id,
          toStatus: result[0].status
        });
        
        results.push(result[0]);
      }
    });
    
    return results;
  }

  // ==================== SERVICE OPERATIONS ====================
  
  async createServiceType(service: InsertServiceType): Promise<ServiceType> {
    const result = await db.insert(serviceTypes).values(service).returning();
    return result[0];
  }

  async getServiceType(id: string): Promise<ServiceType | undefined> {
    const result = await db.select().from(serviceTypes).where(eq(serviceTypes.id, id)).limit(1);
    return result[0];
  }

  async updateServiceType(id: string, updates: Partial<InsertServiceType>): Promise<ServiceType | undefined> {
    const result = await db.update(serviceTypes)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(serviceTypes.id, id))
      .returning();
    return result[0];
  }

  async getActiveServiceTypes(): Promise<ServiceType[]> {
    return await db.select().from(serviceTypes)
      .where(eq(serviceTypes.isActive, true))
      .orderBy(asc(serviceTypes.sortOrder), asc(serviceTypes.name));
  }

  async createServicePricing(pricing: InsertServicePricing): Promise<ServicePricing> {
    const result = await db.insert(servicePricing).values(pricing).returning();
    return result[0];
  }

  async updateServicePricing(id: string, updates: Partial<InsertServicePricing>): Promise<ServicePricing | undefined> {
    const result = await db.update(servicePricing)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(servicePricing.id, id))
      .returning();
    return result[0];
  }

  async getCurrentPricing(serviceTypeId: string): Promise<ServicePricing | undefined> {
    const now = new Date();
    const result = await db.select().from(servicePricing)
      .where(
        and(
          eq(servicePricing.serviceTypeId, serviceTypeId),
          lte(servicePricing.effectiveDate, now),
          or(
            isNull(servicePricing.expiryDate),
            gte(servicePricing.expiryDate, now)
          )
        )
      )
      .orderBy(desc(servicePricing.effectiveDate))
      .limit(1);
    return result[0];
  }

  async createServiceArea(area: InsertServiceArea): Promise<ServiceArea> {
    const result = await db.insert(serviceAreas).values(area).returning();
    return result[0];
  }

  async updateServiceArea(id: string, updates: Partial<InsertServiceArea>): Promise<ServiceArea | undefined> {
    const result = await db.update(serviceAreas)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(serviceAreas.id, id))
      .returning();
    return result[0];
  }

  async getActiveServiceAreas(): Promise<ServiceArea[]> {
    return await db.select().from(serviceAreas)
      .where(eq(serviceAreas.isActive, true))
      .orderBy(asc(serviceAreas.name));
  }

  async checkServiceAvailability(location: {lat: number, lng: number}): Promise<boolean> {
    // This would need PostGIS or similar for proper geographic queries
    // For now, return true as a placeholder
    // In production, you'd check if the location falls within any active service area polygons
    return true;
  }

  async createPricingRule(rule: InsertPricingRule): Promise<PricingRule> {
    const result = await db.insert(pricingRules).values(rule).returning();
    return result[0];
  }

  async updatePricingRule(id: string, updates: Partial<InsertPricingRule>): Promise<PricingRule | undefined> {
    const result = await db.update(pricingRules)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(pricingRules.id, id))
      .returning();
    return result[0];
  }

  async getActivePricingRules(): Promise<PricingRule[]> {
    const now = new Date();
    return await db.select().from(pricingRules)
      .where(
        and(
          eq(pricingRules.isActive, true),
          or(
            isNull(pricingRules.startDate),
            lte(pricingRules.startDate, now)
          ),
          or(
            isNull(pricingRules.endDate),
            gte(pricingRules.endDate, now)
          )
        )
      )
      .orderBy(desc(pricingRules.priority));
  }

  // ==================== CONTRACTOR OPERATIONS ====================
  
  async linkContractorService(service: InsertContractorService): Promise<ContractorService> {
    const result = await db.insert(contractorServices).values(service).returning();
    return result[0];
  }

  async unlinkContractorService(contractorId: string, serviceTypeId: string): Promise<boolean> {
    const result = await db.delete(contractorServices)
      .where(
        and(
          eq(contractorServices.contractorId, contractorId),
          eq(contractorServices.serviceTypeId, serviceTypeId)
        )
      )
      .returning();
    return result.length > 0;
  }

  async getContractorServices(contractorId: string): Promise<ContractorService[]> {
    return await db.select().from(contractorServices)
      .where(eq(contractorServices.contractorId, contractorId));
  }

  async setContractorAvailability(availability: InsertContractorAvailability): Promise<ContractorAvailability> {
    // Upsert - delete existing and insert new
    await db.delete(contractorAvailability)
      .where(
        and(
          eq(contractorAvailability.contractorId, availability.contractorId),
          eq(contractorAvailability.dayOfWeek, availability.dayOfWeek)
        )
      );
    
    const result = await db.insert(contractorAvailability).values(availability).returning();
    return result[0];
  }

  async getContractorAvailability(contractorId: string): Promise<ContractorAvailability[]> {
    return await db.select().from(contractorAvailability)
      .where(eq(contractorAvailability.contractorId, contractorId))
      .orderBy(asc(contractorAvailability.dayOfWeek));
  }

  async updateContractorLocation(contractorId: string, location: {lat: number, lng: number}): Promise<boolean> {
    const result = await db.update(contractorProfiles)
      .set({ 
        currentLocation: location,
        lastLocationUpdate: new Date(),
        updatedAt: new Date()
      })
      .where(eq(contractorProfiles.userId, contractorId))
      .returning();
    return result.length > 0;
  }

  async addContractorEarning(earning: InsertContractorEarning): Promise<ContractorEarning> {
    const result = await db.insert(contractorEarnings).values(earning).returning();
    return result[0];
  }

  async getContractorEarnings(contractorId: string, isPaid?: boolean): Promise<ContractorEarning[]> {
    let query = db.select().from(contractorEarnings)
      .where(eq(contractorEarnings.contractorId, contractorId));
    
    if (isPaid !== undefined) {
      query = query.where(eq(contractorEarnings.isPaid, isPaid)) as any;
    }
    
    return await query.orderBy(desc(contractorEarnings.createdAt));
  }

  async calculateContractorEarnings(contractorId: string, fromDate: Date, toDate: Date): Promise<number> {
    const result = await db.select({
      total: sql<number>`SUM(${contractorEarnings.amount})`
    })
    .from(contractorEarnings)
    .where(
      and(
        eq(contractorEarnings.contractorId, contractorId),
        gte(contractorEarnings.createdAt, fromDate),
        lte(contractorEarnings.createdAt, toDate)
      )
    );
    
    return result[0]?.total || 0;
  }

  async markEarningsAsPaid(contractorId: string, earningIds: string[]): Promise<boolean> {
    const result = await db.update(contractorEarnings)
      .set({ isPaid: true, paidAt: new Date() })
      .where(
        and(
          eq(contractorEarnings.contractorId, contractorId),
          inArray(contractorEarnings.id, earningIds)
        )
      )
      .returning();
    return result.length > 0;
  }

  async addContractorRating(rating: InsertContractorRating): Promise<ContractorRating> {
    const result = await db.insert(contractorRatings).values(rating).returning();
    
    // Update average rating in contractor profile
    await this.calculateAverageRating(rating.contractorId);
    
    return result[0];
  }

  async getContractorRatings(contractorId: string): Promise<ContractorRating[]> {
    return await db.select().from(contractorRatings)
      .where(eq(contractorRatings.contractorId, contractorId))
      .orderBy(desc(contractorRatings.createdAt));
  }

  async calculateAverageRating(contractorId: string): Promise<number> {
    const result = await db.select({
      avg: sql<number>`AVG(${contractorRatings.rating})`
    })
    .from(contractorRatings)
    .where(eq(contractorRatings.contractorId, contractorId));
    
    const avgRating = result[0]?.avg || 0;
    
    // Update contractor profile
    await db.update(contractorProfiles)
      .set({ averageRating: avgRating.toString() })
      .where(eq(contractorProfiles.userId, contractorId));
    
    return avgRating;
  }

  async addContractorDocument(document: InsertContractorDocument): Promise<ContractorDocument> {
    const result = await db.insert(contractorDocuments).values(document).returning();
    return result[0];
  }

  async updateContractorDocument(id: string, updates: Partial<InsertContractorDocument>): Promise<ContractorDocument | undefined> {
    const result = await db.update(contractorDocuments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(contractorDocuments.id, id))
      .returning();
    return result[0];
  }

  async getContractorDocuments(contractorId: string): Promise<ContractorDocument[]> {
    return await db.select().from(contractorDocuments)
      .where(eq(contractorDocuments.contractorId, contractorId))
      .orderBy(desc(contractorDocuments.createdAt));
  }

  async verifyContractorDocument(documentId: string, verifiedBy: string): Promise<boolean> {
    const result = await db.update(contractorDocuments)
      .set({ 
        isVerified: true, 
        verifiedBy, 
        verifiedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(contractorDocuments.id, documentId))
      .returning();
    return result.length > 0;
  }

  async getContractorPerformanceMetrics(contractorId: string): Promise<ContractorPerformanceMetrics> {
    const [jobStats, earningsStats, ratingStats, responseStats] = await Promise.all([
      // Job statistics
      db.select({
        total: sql<number>`COUNT(*)`,
        completed: sql<number>`COUNT(*) FILTER (WHERE ${jobs.status} = 'completed')`
      })
      .from(jobs)
      .where(eq(jobs.contractorId, contractorId)),
      
      // Earnings
      db.select({
        total: sql<number>`SUM(${contractorEarnings.amount})`
      })
      .from(contractorEarnings)
      .where(eq(contractorEarnings.contractorId, contractorId)),
      
      // Ratings
      db.select({
        avg: sql<number>`AVG(${contractorRatings.rating})`
      })
      .from(contractorRatings)
      .where(eq(contractorRatings.contractorId, contractorId)),
      
      // Response time
      db.select({
        avg: sql<number>`AVG(EXTRACT(EPOCH FROM (${jobs.assignedAt} - ${jobs.createdAt})) / 60)`
      })
      .from(jobs)
      .where(
        and(
          eq(jobs.contractorId, contractorId),
          sql`${jobs.assignedAt} IS NOT NULL`
        )
      )
    ]);
    
    const totalJobs = jobStats[0]?.total || 0;
    const completedJobs = jobStats[0]?.completed || 0;
    
    return {
      contractorId,
      totalJobs,
      completedJobs,
      averageRating: ratingStats[0]?.avg || 0,
      totalEarnings: earningsStats[0]?.total || 0,
      averageResponseTime: responseStats[0]?.avg || 0,
      completionRate: totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0
    };
  }

  async findAvailableContractors(serviceTypeId: string, location: {lat: number, lng: number}, radius: number = 50): Promise<ContractorProfile[]> {
    // Get contractors who offer this service
    const contractorsWithService = await db.select({
      contractorId: contractorServices.contractorId
    })
    .from(contractorServices)
    .where(
      and(
        eq(contractorServices.serviceTypeId, serviceTypeId),
        eq(contractorServices.isAvailable, true)
      )
    );
    
    const contractorIds = contractorsWithService.map(c => c.contractorId);
    if (contractorIds.length === 0) return [];
    
    // Get available contractor profiles
    // In production, you'd use PostGIS for proper distance calculations
    const profiles = await db.select().from(contractorProfiles)
      .where(
        and(
          inArray(contractorProfiles.userId, contractorIds),
          eq(contractorProfiles.isAvailable, true),
          gte(contractorProfiles.serviceRadius, radius)
        )
      )
      .orderBy(desc(contractorProfiles.averageRating));
    
    return profiles;
  }

  // ==================== PAYMENT OPERATIONS ====================
  
  async createPaymentMethod(method: InsertPaymentMethod): Promise<PaymentMethod> {
    // If this is set as default, unset other defaults for this user
    if (method.isDefault) {
      await db.update(paymentMethods)
        .set({ isDefault: false })
        .where(eq(paymentMethods.userId, method.userId));
    }
    
    const result = await db.insert(paymentMethods).values(method).returning();
    return result[0];
  }

  async updatePaymentMethod(id: string, updates: Partial<InsertPaymentMethod>): Promise<PaymentMethod | undefined> {
    const result = await db.update(paymentMethods)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(paymentMethods.id, id))
      .returning();
    return result[0];
  }

  async deletePaymentMethod(id: string): Promise<boolean> {
    const result = await db.delete(paymentMethods).where(eq(paymentMethods.id, id)).returning();
    return result.length > 0;
  }

  async getUserPaymentMethods(userId: string): Promise<PaymentMethod[]> {
    return await db.select().from(paymentMethods)
      .where(eq(paymentMethods.userId, userId))
      .orderBy(desc(paymentMethods.isDefault), desc(paymentMethods.createdAt));
  }

  async setDefaultPaymentMethod(userId: string, paymentMethodId: string): Promise<boolean> {
    // Unset all defaults for user
    await db.update(paymentMethods)
      .set({ isDefault: false })
      .where(eq(paymentMethods.userId, userId));
    
    // Set new default
    const result = await db.update(paymentMethods)
      .set({ isDefault: true })
      .where(
        and(
          eq(paymentMethods.id, paymentMethodId),
          eq(paymentMethods.userId, userId)
        )
      )
      .returning();
    
    return result.length > 0;
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const result = await db.insert(transactions).values(transaction).returning();
    return result[0];
  }

  async updateTransaction(id: string, updates: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    const result = await db.update(transactions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(transactions.id, id))
      .returning();
    return result[0];
  }

  async getTransaction(id: string): Promise<Transaction | undefined> {
    const result = await db.select().from(transactions).where(eq(transactions.id, id)).limit(1);
    return result[0];
  }

  async findTransactions(filters: TransactionFilterOptions): Promise<Transaction[]> {
    let query = db.select().from(transactions);
    const conditions = [];

    if (filters.userId) conditions.push(eq(transactions.userId, filters.userId));
    if (filters.jobId) conditions.push(eq(transactions.jobId, filters.jobId));
    if (filters.status) conditions.push(eq(transactions.status, filters.status));
    if (filters.fromDate) conditions.push(gte(transactions.createdAt, filters.fromDate));
    if (filters.toDate) conditions.push(lte(transactions.createdAt, filters.toDate));

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    // Apply ordering
    query = (filters.orderDir === 'asc' 
      ? query.orderBy(asc(transactions.createdAt)) 
      : query.orderBy(desc(transactions.createdAt))) as any;

    // Apply pagination
    if (filters.limit) query = query.limit(filters.limit) as any;
    if (filters.offset) query = query.offset(filters.offset) as any;

    return await query;
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const result = await db.insert(invoices).values({ ...invoice, invoiceNumber }).returning();
    return result[0];
  }

  async updateInvoice(id: string, updates: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    const result = await db.update(invoices)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(invoices.id, id))
      .returning();
    return result[0];
  }

  async getInvoice(id: string): Promise<Invoice | undefined> {
    const result = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1);
    return result[0];
  }

  async getInvoiceByJobId(jobId: string): Promise<Invoice | undefined> {
    const result = await db.select().from(invoices).where(eq(invoices.jobId, jobId)).limit(1);
    return result[0];
  }

  async getUnpaidInvoices(customerId: string): Promise<Invoice[]> {
    return await db.select().from(invoices)
      .where(
        and(
          eq(invoices.customerId, customerId),
          isNull(invoices.paidAt)
        )
      )
      .orderBy(asc(invoices.dueDate));
  }

  async markInvoiceAsPaid(invoiceId: string, paidAt: Date): Promise<boolean> {
    const invoice = await this.getInvoice(invoiceId);
    if (!invoice) return false;
    
    const result = await db.update(invoices)
      .set({ 
        paidAt,
        paidAmount: invoice.totalAmount,
        updatedAt: new Date()
      })
      .where(eq(invoices.id, invoiceId))
      .returning();
    
    return result.length > 0;
  }

  async createRefund(refund: InsertRefund): Promise<Refund> {
    const result = await db.insert(refunds).values(refund).returning();
    return result[0];
  }

  async updateRefundStatus(id: string, status: typeof refundStatusEnum.enumValues[number]): Promise<Refund | undefined> {
    const result = await db.update(refunds)
      .set({ 
        status,
        processedAt: status === 'processed' ? new Date() : undefined,
        updatedAt: new Date()
      })
      .where(eq(refunds.id, id))
      .returning();
    return result[0];
  }

  async getRefundsByTransaction(transactionId: string): Promise<Refund[]> {
    return await db.select().from(refunds)
      .where(eq(refunds.transactionId, transactionId))
      .orderBy(desc(refunds.createdAt));
  }

  // ==================== ADMIN OPERATIONS ====================
  
  async getSetting(key: string): Promise<AdminSetting | undefined> {
    return await this.settingsCache(key);
  }

  async updateSetting(key: string, value: any): Promise<AdminSetting> {
    const existing = await this.getSetting(key);
    
    if (existing) {
      const result = await db.update(adminSettings)
        .set({ value, updatedAt: new Date() })
        .where(eq(adminSettings.key, key))
        .returning();
      this.settingsCache.delete(key);
      return result[0];
    } else {
      const result = await db.insert(adminSettings)
        .values({ key, value })
        .returning();
      this.settingsCache.delete(key);
      return result[0];
    }
  }

  async getAllSettings(): Promise<AdminSetting[]> {
    return await db.select().from(adminSettings).orderBy(asc(adminSettings.key));
  }

  async createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate> {
    const result = await db.insert(emailTemplates).values(template).returning();
    return result[0];
  }

  async updateEmailTemplate(id: string, updates: Partial<InsertEmailTemplate>): Promise<EmailTemplate | undefined> {
    const result = await db.update(emailTemplates)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(emailTemplates.id, id))
      .returning();
    return result[0];
  }

  async getEmailTemplate(templateKey: string): Promise<EmailTemplate | undefined> {
    const result = await db.select().from(emailTemplates)
      .where(eq(emailTemplates.templateKey, templateKey))
      .limit(1);
    return result[0];
  }

  async getIntegration(provider: string): Promise<IntegrationsConfig | undefined> {
    const result = await db.select().from(integrationsConfig)
      .where(eq(integrationsConfig.provider, provider))
      .limit(1);
    return result[0];
  }

  async updateIntegration(provider: string, config: any): Promise<IntegrationsConfig> {
    const existing = await this.getIntegration(provider);
    
    if (existing) {
      const result = await db.update(integrationsConfig)
        .set({ config, updatedAt: new Date() })
        .where(eq(integrationsConfig.provider, provider))
        .returning();
      return result[0];
    } else {
      const result = await db.insert(integrationsConfig)
        .values({ provider, config })
        .returning();
      return result[0];
    }
  }

  // ==================== ANALYTICS OPERATIONS ====================
  
  async getPlatformMetrics(fromDate?: Date, toDate?: Date): Promise<PlatformMetrics> {
    const dateConditions = [];
    if (fromDate) dateConditions.push(gte(jobs.createdAt, fromDate));
    if (toDate) dateConditions.push(lte(jobs.createdAt, toDate));

    const [jobMetrics, contractorCount, fleetCount, revenueMetrics, responseMetrics] = await Promise.all([
      // Job metrics
      db.select({
        active: sql<number>`COUNT(*) FILTER (WHERE ${jobs.status} IN ('new', 'assigned', 'en_route', 'on_site'))`,
        completed: sql<number>`COUNT(*) FILTER (WHERE ${jobs.status} = 'completed')`,
        total: sql<number>`COUNT(*)`
      })
      .from(jobs)
      .where(dateConditions.length > 0 ? and(...dateConditions) : undefined),
      
      // Contractor count
      db.select({
        count: sql<number>`COUNT(*)`
      })
      .from(contractorProfiles)
      .where(eq(contractorProfiles.isAvailable, true)),
      
      // Fleet count
      db.select({
        count: sql<number>`COUNT(*)`
      })
      .from(fleetAccounts)
      .where(and(eq(fleetAccounts.isActive, true), isNull(fleetAccounts.deletedAt))),
      
      // Revenue
      db.select({
        total: sql<number>`SUM(${transactions.amount})`
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.status, 'completed'),
          ...(dateConditions.length > 0 ? dateConditions : [])
        )
      ),
      
      // Response time
      db.select({
        avg: sql<number>`AVG(EXTRACT(EPOCH FROM (${jobs.assignedAt} - ${jobs.createdAt})) / 60)`
      })
      .from(jobs)
      .where(
        and(
          sql`${jobs.assignedAt} IS NOT NULL`,
          ...(dateConditions.length > 0 ? dateConditions : [])
        )
      )
    ]);

    const totalJobs = jobMetrics[0]?.total || 0;
    const completedJobs = jobMetrics[0]?.completed || 0;

    return {
      activeJobs: jobMetrics[0]?.active || 0,
      averageResponseTime: responseMetrics[0]?.avg || 0,
      completionRate: totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0,
      totalRevenue: revenueMetrics[0]?.total || 0,
      totalContractors: contractorCount[0]?.count || 0,
      totalFleets: fleetCount[0]?.count || 0
    };
  }

  async getContractorPerformanceByTier(tier: typeof performanceTierEnum.enumValues[number]): Promise<ContractorPerformanceMetrics[]> {
    const contractors = await db.select({
      userId: contractorProfiles.userId
    })
    .from(contractorProfiles)
    .where(eq(contractorProfiles.performanceTier, tier));
    
    const metrics: ContractorPerformanceMetrics[] = [];
    
    for (const contractor of contractors) {
      const metric = await this.getContractorPerformanceMetrics(contractor.userId);
      metrics.push(metric);
    }
    
    return metrics;
  }

  async generateRevenueReport(fromDate: Date, toDate: Date): Promise<RevenueReport> {
    const [totalRevenue, serviceRevenue, fleetRevenue, transactionMetrics] = await Promise.all([
      // Total revenue
      db.select({
        total: sql<number>`SUM(${transactions.amount})`
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.status, 'completed'),
          gte(transactions.createdAt, fromDate),
          lte(transactions.createdAt, toDate)
        )
      ),
      
      // Revenue by service
      db.select({
        serviceTypeId: jobs.serviceTypeId,
        revenue: sql<number>`SUM(${transactions.amount})`
      })
      .from(transactions)
      .innerJoin(jobs, eq(transactions.jobId, jobs.id))
      .where(
        and(
          eq(transactions.status, 'completed'),
          gte(transactions.createdAt, fromDate),
          lte(transactions.createdAt, toDate)
        )
      )
      .groupBy(jobs.serviceTypeId),
      
      // Revenue by fleet
      db.select({
        fleetAccountId: jobs.fleetAccountId,
        revenue: sql<number>`SUM(${transactions.amount})`
      })
      .from(transactions)
      .innerJoin(jobs, eq(transactions.jobId, jobs.id))
      .where(
        and(
          eq(transactions.status, 'completed'),
          sql`${jobs.fleetAccountId} IS NOT NULL`,
          gte(transactions.createdAt, fromDate),
          lte(transactions.createdAt, toDate)
        )
      )
      .groupBy(jobs.fleetAccountId),
      
      // Transaction metrics
      db.select({
        count: sql<number>`COUNT(*)`,
        avgAmount: sql<number>`AVG(${transactions.amount})`
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.status, 'completed'),
          gte(transactions.createdAt, fromDate),
          lte(transactions.createdAt, toDate)
        )
      )
    ]);

    const revenueByService: Record<string, number> = {};
    for (const item of serviceRevenue) {
      revenueByService[item.serviceTypeId] = item.revenue;
    }

    const revenueByFleet: Record<string, number> = {};
    for (const item of fleetRevenue) {
      if (item.fleetAccountId) {
        revenueByFleet[item.fleetAccountId] = item.revenue;
      }
    }

    return {
      fromDate,
      toDate,
      totalRevenue: totalRevenue[0]?.total || 0,
      revenueByService,
      revenueByFleet,
      averageJobValue: transactionMetrics[0]?.avgAmount || 0,
      transactionCount: transactionMetrics[0]?.count || 0
    };
  }

  async getFleetUsageStatistics(fleetId: string, fromDate?: Date, toDate?: Date): Promise<FleetUsageStats> {
    const dateConditions = [eq(jobs.fleetAccountId, fleetId)];
    if (fromDate) dateConditions.push(gte(jobs.createdAt, fromDate));
    if (toDate) dateConditions.push(lte(jobs.createdAt, toDate));

    const [jobStats, vehicleCount, spendingStats, serviceStats] = await Promise.all([
      // Job statistics
      db.select({
        total: sql<number>`COUNT(*)`
      })
      .from(jobs)
      .where(and(...dateConditions)),
      
      // Vehicle count
      db.select({
        count: sql<number>`COUNT(*)`
      })
      .from(fleetVehicles)
      .where(
        and(
          eq(fleetVehicles.fleetAccountId, fleetId),
          eq(fleetVehicles.isActive, true)
        )
      ),
      
      // Total spending
      db.select({
        total: sql<number>`SUM(${transactions.amount})`
      })
      .from(transactions)
      .innerJoin(jobs, eq(transactions.jobId, jobs.id))
      .where(
        and(
          eq(jobs.fleetAccountId, fleetId),
          eq(transactions.status, 'completed'),
          ...(fromDate ? [gte(transactions.createdAt, fromDate)] : []),
          ...(toDate ? [lte(transactions.createdAt, toDate)] : [])
        )
      ),
      
      // Service usage
      db.select({
        serviceTypeId: jobs.serviceTypeId,
        count: sql<number>`COUNT(*)`
      })
      .from(jobs)
      .where(and(...dateConditions))
      .groupBy(jobs.serviceTypeId)
      .orderBy(desc(sql`COUNT(*)`))
      .limit(5)
    ]);

    const totalJobs = jobStats[0]?.total || 0;
    const totalVehicles = vehicleCount[0]?.count || 0;

    const mostUsedServices = await Promise.all(
      serviceStats.map(async (stat) => {
        const service = await this.getServiceType(stat.serviceTypeId);
        return {
          serviceType: service?.name || 'Unknown',
          count: stat.count
        };
      })
    );

    return {
      fleetId,
      totalJobs,
      totalVehicles,
      totalSpent: spendingStats[0]?.total || 0,
      averageJobsPerVehicle: totalVehicles > 0 ? totalJobs / totalVehicles : 0,
      mostUsedServices
    };
  }

  async getResponseTimeStats(): Promise<{average: number, median: number, percentile95: number}> {
    const result = await db.select({
      average: sql<number>`AVG(EXTRACT(EPOCH FROM (${jobs.assignedAt} - ${jobs.createdAt})) / 60)`,
      median: sql<number>`PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (${jobs.assignedAt} - ${jobs.createdAt})) / 60)`,
      percentile95: sql<number>`PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (${jobs.assignedAt} - ${jobs.createdAt})) / 60)`
    })
    .from(jobs)
    .where(sql`${jobs.assignedAt} IS NOT NULL`);

    return {
      average: result[0]?.average || 0,
      median: result[0]?.median || 0,
      percentile95: result[0]?.percentile95 || 0
    };
  }
}

// Export the PostgreSQL storage instance
export const storage = new PostgreSQLStorage();