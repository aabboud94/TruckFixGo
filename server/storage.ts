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
  reviews,
  reviewVotes,
  contractorDocuments,
  pricingRules,
  paymentMethods,
  transactions,
  invoices,
  refunds,
  fleetChecks,
  adminSettings,
  emailTemplates,
  smsTemplates,
  integrationsConfig,
  customerPreferences,
  reminders,
  reminderLog,
  reminderBlacklist,
  reminderMetrics,
  contractorApplications,
  applicationDocuments,
  backgroundChecks,
  jobBids,
  bidTemplates,
  biddingConfig,
  bidAnalytics,
  billingSubscriptions,
  billingHistory,
  billingUsageTracking,
  splitPayments,
  paymentSplits,
  splitPaymentTemplates,
  fleetContracts,
  contractSlaMetrics,
  contractPenalties,
  contractAmendments,
  contractPerformanceMetrics,
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
  type Review,
  type InsertReview,
  type ReviewVote,
  type InsertReviewVote,
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
  type FleetCheck,
  type InsertFleetCheck,
  type AdminSetting,
  type InsertAdminSetting,
  type EmailTemplate,
  type InsertEmailTemplate,
  type SmsTemplate,
  type InsertSmsTemplate,
  type IntegrationsConfig,
  type InsertIntegrationsConfig,
  type CustomerPreferences,
  type InsertCustomerPreferences,
  type Reminder,
  type InsertReminder,
  type ReminderLog,
  type InsertReminderLog,
  type ReminderBlacklist,
  type InsertReminderBlacklist,
  type ReminderMetrics,
  type InsertReminderMetrics,
  type ContractorApplication,
  type InsertContractorApplication,
  type ApplicationDocument,
  type InsertApplicationDocument,
  type BackgroundCheck,
  type InsertBackgroundCheck,
  type JobBid,
  type InsertJobBid,
  type BidTemplate,
  type InsertBidTemplate,
  type BiddingConfig,
  type InsertBiddingConfig,
  type BidAnalytics,
  type InsertBidAnalytics,
  type BillingSubscription,
  type InsertBillingSubscription,
  type BillingHistory,
  type InsertBillingHistory,
  type BillingUsageTracking,
  type InsertBillingUsageTracking,
  type SplitPayment,
  type InsertSplitPayment,
  type PaymentSplit,
  type InsertPaymentSplit,
  type SplitPaymentTemplate,
  type InsertSplitPaymentTemplate,
  vehicleAnalytics,
  breakdownPatterns,
  fleetAnalyticsAlerts,
  type VehicleAnalytics,
  type InsertVehicleAnalytics,
  type BreakdownPattern,
  type InsertBreakdownPattern,
  type FleetAnalyticsAlert,
  type InsertFleetAnalyticsAlert,
  type FleetContract,
  type InsertFleetContract,
  type ContractSlaMetric,
  type InsertContractSlaMetric,
  type ContractPenalty,
  type InsertContractPenalty,
  type ContractAmendment,
  type InsertContractAmendment,
  type ContractPerformanceMetric,
  type InsertContractPerformanceMetric,
  contractStatusEnum,
  slaMetricTypeEnum,
  penaltyStatusEnum,
  amendmentStatusEnum,
  contractTemplateEnum,
  performanceTierEnum,
  billingCycleEnum,
  subscriptionStatusEnum,
  billingHistoryStatusEnum,
  planTypeEnum,
  bidStatusEnum,
  biddingStrategyEnum,
  bidAutoAcceptEnum,
  reminderStatusEnum,
  reminderTypeEnum,
  reminderTimingEnum,
  fleetPricingTierEnum,
  jobTypeEnum,
  jobStatusEnum,
  paymentStatusEnum,
  refundStatusEnum,
  checkProviderEnum,
  checkStatusEnum
} from "@shared/schema";

import { db } from "./db";
import { eq, and, or, gte, lte, isNull, desc, asc, sql, inArray, ne, gt, lt, ilike } from "drizzle-orm";
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

export interface FleetCheckFilterOptions extends PaginationOptions {
  provider?: typeof checkProviderEnum.enumValues[number];
  status?: typeof checkStatusEnum.enumValues[number];
  jobId?: string;
  userId?: string;
  fleetAccountId?: string;
  checkNumber?: string;
  fromDate?: Date;
  toDate?: Date;
}

export interface ContractFilterOptions extends PaginationOptions {
  fleetAccountId?: string;
  status?: typeof contractStatusEnum.enumValues[number];
  templateType?: typeof contractTemplateEnum.enumValues[number];
  fromDate?: Date;
  toDate?: Date;
  expiringDays?: number;
  priorityLevel?: number;
}

export interface ContractMetricsFilterOptions extends PaginationOptions {
  contractId?: string;
  metricType?: typeof slaMetricTypeEnum.enumValues[number];
  breached?: boolean;
  periodStart?: Date;
  periodEnd?: Date;
}

// Analytics data types
export interface PlatformMetrics {
  activeJobs: number;
  averageResponseTime: number;
  completionRate: number;
  totalRevenue: number;
  totalContractors: number;
  totalFleets: number;
  onlineContractors: number;
  totalUsers: number;
  avgJobValue: number;
  platformFees: number;
}

export interface ContractorPerformanceMetrics {
  contractorId: string;
  contractorName: string;
  totalJobs: number;
  completedJobs: number;
  averageRating: number;
  totalEarnings: number;
  averageResponseTime: number;
  completionRate: number;
  acceptanceRate: number;
  onTimeArrivalRate: number;
  tier: string;
  lastActive: Date;
}

export interface RevenueReport {
  fromDate: Date;
  toDate: Date;
  totalRevenue: number;
  revenueByService: Record<string, number>;
  revenueByFleet: Record<string, number>;
  averageJobValue: number;
  transactionCount: number;
  platformFees: number;
  outstandingPayments: number;
  paymentMethodBreakdown: Record<string, number>;
  emergencyVsScheduled: { emergency: number; scheduled: number };
  surgePricingRevenue: number;
}

export interface FleetUsageStats {
  fleetId: string;
  fleetName: string;
  totalJobs: number;
  totalVehicles: number;
  totalSpent: number;
  averageJobsPerVehicle: number;
  mostUsedServices: Array<{serviceType: string, count: number}>;
  pmComplianceRate: number;
  breakdownFrequency: number;
  costPerMile: number;
  tier: string;
  savings: number;
}

export interface SLAMetrics {
  averageResponseTime: number;
  slaComplianceRate: number;
  breachedSLAs: Array<{
    jobId: string;
    reason: string;
    breachTime: number;
    serviceType: string;
  }>;
  responseTimeByService: Record<string, number>;
  responseTimeTrends: Array<{
    date: Date;
    avgTime: number;
    slaRate: number;
  }>;
  geographicPerformance: Record<string, { avgTime: number; slaRate: number }>;
  fleetSLATracking: Record<string, { avgTime: number; slaRate: number }>;
}

export interface ResponseTimeAnalytics {
  jobAcceptanceTime: number;
  travelTime: number;
  serviceTime: number;
  totalResolutionTime: number;
  comparedToTarget: {
    acceptance: { actual: number; target: number; variance: number };
    travel: { actual: number; target: number; variance: number };
    service: { actual: number; target: number; variance: number };
    total: { actual: number; target: number; variance: number };
  };
  byUrgencyLevel: Record<string, number>;
  hourlyPatterns: Array<{ hour: number; avgTime: number; jobs: number }>;
}

export interface JobAnalytics {
  totalJobs: number;
  byStatus: Record<string, number>;
  completionRate: number;
  cancellationReasons: Record<string, number>;
  jobTypeDistribution: Record<string, number>;
  peakHours: Array<{ hour: number; jobs: number }>;
  seasonalTrends: Array<{ month: string; jobs: number; revenue: number }>;
  repeatCustomerRate: number;
  averageJobDuration: number;
}

export interface CustomerAnalytics {
  totalCustomers: number;
  newCustomers: number;
  acquisitionTrend: Array<{ date: Date; new: number; total: number }>;
  customerLifetimeValue: number;
  retentionRate: number;
  guestVsRegistered: { guest: number; registered: number };
  satisfactionScore: number;
  referralPerformance: { referrals: number; conversionRate: number };
  churnRate: number;
  topCustomers: Array<{ id: string; name: string; jobs: number; spent: number }>;
}

export interface GeographicAnalytics {
  serviceRequestHeatmap: Array<{ lat: number; lng: number; intensity: number }>;
  coverageGaps: Array<{ area: string; demand: number; contractors: number; gap: number }>;
  contractorDensity: Array<{ area: string; contractors: number; radius: number }>;
  revenueByRegion: Record<string, number>;
  responseTimeByZone: Record<string, number>;
  popularLocations: Array<{ location: string; jobs: number; revenue: number }>;
  averageTravelDistance: number;
}

export interface OperationalEfficiency {
  contractorUtilization: number;
  averageIdleTime: number;
  routeOptimizationSavings: number;
  multiJobBatchingRate: number;
  platformUptime: number;
  apiResponseTime: number;
  errorRate: number;
  systemHealth: {
    database: boolean;
    api: boolean;
    websocket: boolean;
    payments: boolean;
  };
}

export interface PredictiveAnalytics {
  demandForecast: Array<{ date: Date; predicted: number; confidence: number }>;
  contractorAvailability: Array<{ hour: number; predicted: number; needed: number }>;
  maintenanceNeeds: Array<{ vehicleId: string; predictedDate: Date; service: string }>;
  revenueProjection: Array<{ month: string; projected: number; confidence: number }>;
  seasonalTrends: Array<{ period: string; trend: string; impact: number }>;
  growthTrajectory: { currentRate: number; projectedRate: number; target: number };
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
  hasAdminUsers(): Promise<boolean>;
  
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
  getAllServiceAreas(): Promise<ServiceArea[]>;
  getServiceArea(id: string): Promise<ServiceArea | undefined>;
  deleteServiceArea(id: string): Promise<boolean>;
  checkServiceAvailability(location: {lat: number, lng: number}): Promise<boolean>;
  
  createPricingRule(rule: InsertPricingRule): Promise<PricingRule>;
  updatePricingRule(id: string, updates: Partial<InsertPricingRule>): Promise<PricingRule | undefined>;
  getActivePricingRules(): Promise<PricingRule[]>;
  getAllPricingRules(): Promise<PricingRule[]>;
  deletePricingRule(id: string): Promise<boolean>;
  
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
  
  // Review Operations
  createReview(review: InsertReview): Promise<Review>;
  getReview(id: string): Promise<Review | undefined>;
  getReviewByJob(jobId: string): Promise<Review | undefined>;
  updateReview(id: string, updates: Partial<InsertReview>): Promise<Review | undefined>;
  getContractorReviews(contractorId: string, limit?: number, offset?: number, filters?: {
    minRating?: number;
    maxRating?: number;
    hasText?: boolean;
    sortBy?: 'recent' | 'highest' | 'lowest' | 'helpful';
  }): Promise<Review[]>;
  addContractorResponse(reviewId: string, response: string): Promise<Review | undefined>;
  flagReview(reviewId: string, reason: string, flaggedBy: string): Promise<Review | undefined>;
  moderateReview(reviewId: string, status: string, moderatedBy: string): Promise<Review | undefined>;
  voteReviewHelpful(reviewId: string, userId: string, isHelpful: boolean): Promise<boolean>;
  updateContractorRatingStats(contractorId: string): Promise<boolean>;
  getContractorRatingSummary(contractorId: string): Promise<{
    averageRating: number;
    totalReviews: number;
    ratingDistribution: Record<string, number>;
    categoryAverages: {
      timeliness: number;
      professionalism: number;
      quality: number;
      value: number;
    };
  }>;
  
  addContractorDocument(document: InsertContractorDocument): Promise<ContractorDocument>;
  updateContractorDocument(id: string, updates: Partial<InsertContractorDocument>): Promise<ContractorDocument | undefined>;
  getContractorDocuments(contractorId: string): Promise<ContractorDocument[]>;
  verifyContractorDocument(documentId: string, verifiedBy: string): Promise<boolean>;
  
  getContractorPerformanceMetrics(contractorId: string): Promise<ContractorPerformanceMetrics>;
  findAvailableContractors(serviceTypeId: string, location: {lat: number, lng: number}, radius?: number): Promise<ContractorProfile[]>;
  
  // ==================== PAYMENT OPERATIONS ====================
  createPaymentMethod(method: InsertPaymentMethod): Promise<PaymentMethod>;
  updatePaymentMethod(id: string, updates: Partial<InsertPaymentMethod>): Promise<PaymentMethod | undefined>;
  deletePaymentMethod(id: string, userId: string): Promise<boolean>;
  getPaymentMethods(userId: string): Promise<PaymentMethod[]>;
  setDefaultPaymentMethod(paymentMethodId: string, userId: string): Promise<boolean>;
  
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: string, updates: Partial<InsertTransaction>): Promise<Transaction | undefined>;
  updateTransactionByExternalId(externalId: string, updates: Partial<InsertTransaction>): Promise<Transaction | undefined>;
  getTransaction(id: string): Promise<Transaction | undefined>;
  findTransactions(filters: TransactionFilterOptions): Promise<Transaction[]>;
  
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: string, updates: Partial<InsertInvoice>): Promise<Invoice | undefined>;
  getInvoice(id: string): Promise<Invoice | undefined>;
  getInvoices(filters: any): Promise<Invoice[]>;
  getInvoiceByJobId(jobId: string): Promise<Invoice | undefined>;
  getUnpaidInvoices(customerId: string): Promise<Invoice[]>;
  markInvoiceAsPaid(invoiceId: string, paidAt: Date): Promise<boolean>;
  
  createRefund(refund: InsertRefund): Promise<Refund>;
  updateRefundStatus(id: string, status: typeof refundStatusEnum.enumValues[number]): Promise<Refund | undefined>;
  getRefundsByTransaction(transactionId: string): Promise<Refund[]>;
  
  // ==================== FLEET CHECK OPERATIONS ====================
  createFleetCheck(check: InsertFleetCheck): Promise<FleetCheck>;
  getFleetCheck(id: string): Promise<FleetCheck | undefined>;
  getFleetCheckByCheckNumber(checkNumber: string): Promise<FleetCheck | undefined>;
  updateFleetCheck(id: string, updates: Partial<InsertFleetCheck>): Promise<FleetCheck | undefined>;
  updateFleetCheckStatus(id: string, status: typeof checkStatusEnum.enumValues[number], response?: any): Promise<FleetCheck | undefined>;
  findFleetChecks(filters: FleetCheckFilterOptions): Promise<FleetCheck[]>;
  captureFleetCheck(id: string, amount: number, captureResponse: any): Promise<FleetCheck | undefined>;
  voidFleetCheck(id: string, voidResponse: any): Promise<FleetCheck | undefined>;
  getActiveFleetCheckForJob(jobId: string): Promise<FleetCheck | undefined>;
  getTotalCapturedAmount(checkNumber: string): Promise<number>;
  getFleetChecksByUser(userId: string, limit?: number): Promise<FleetCheck[]>;
  getFleetChecksByFleet(fleetAccountId: string, filters?: FleetCheckFilterOptions): Promise<FleetCheck[]>;
  getPendingFleetChecksForCapture(): Promise<FleetCheck[]>;
  
  // ==================== BIDDING OPERATIONS ====================
  createJobBid(bid: InsertJobBid): Promise<JobBid>;
  getJobBid(id: string): Promise<JobBid | undefined>;
  updateJobBid(id: string, updates: Partial<InsertJobBid>): Promise<JobBid | undefined>;
  getJobBids(jobId: string): Promise<JobBid[]>;
  getContractorBids(contractorId: string, status?: typeof bidStatusEnum.enumValues[number]): Promise<JobBid[]>;
  acceptBid(bidId: string, jobId: string): Promise<JobBid | undefined>;
  rejectBid(bidId: string, reason?: string): Promise<JobBid | undefined>;
  counterBid(bidId: string, counterAmount: number, message: string): Promise<JobBid | undefined>;
  withdrawBid(bidId: string, contractorId: string): Promise<JobBid | undefined>;
  getAvailableBiddingJobs(contractorId: string, filters?: {
    serviceTypeId?: string;
    maxDistance?: number;
    minPrice?: number;
  }): Promise<Job[]>;
  updateBidRanks(jobId: string): Promise<void>;
  checkBidDeadline(jobId: string): Promise<boolean>;
  autoAcceptLowestBid(jobId: string): Promise<JobBid | undefined>;
  
  createBidTemplate(template: InsertBidTemplate): Promise<BidTemplate>;
  updateBidTemplate(id: string, updates: Partial<InsertBidTemplate>): Promise<BidTemplate | undefined>;
  deleteBidTemplate(id: string): Promise<boolean>;
  getContractorBidTemplates(contractorId: string): Promise<BidTemplate[]>;
  
  getBiddingConfig(): Promise<BiddingConfig | undefined>;
  updateBiddingConfig(updates: Partial<InsertBiddingConfig>): Promise<BiddingConfig>;
  
  createBidAnalytics(analytics: InsertBidAnalytics): Promise<BidAnalytics>;
  getBidAnalytics(filters: {
    serviceTypeId?: string;
    period?: string;
    fromDate?: Date;
    toDate?: Date;
  }): Promise<BidAnalytics[]>;

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
  
  // New comprehensive analytics methods
  getSLAMetrics(fromDate?: Date, toDate?: Date): Promise<SLAMetrics>;
  getResponseTimeAnalytics(fromDate?: Date, toDate?: Date): Promise<ResponseTimeAnalytics>;
  getContractorPerformanceDetail(contractorId?: string, fromDate?: Date, toDate?: Date): Promise<ContractorPerformanceMetrics[]>;
  getJobAnalytics(fromDate?: Date, toDate?: Date): Promise<JobAnalytics>;
  getCustomerAnalytics(fromDate?: Date, toDate?: Date): Promise<CustomerAnalytics>;
  getGeographicAnalytics(fromDate?: Date, toDate?: Date): Promise<GeographicAnalytics>;
  getOperationalEfficiency(): Promise<OperationalEfficiency>;
  getPredictiveAnalytics(fromDate?: Date, toDate?: Date): Promise<PredictiveAnalytics>;
  getAllFleetAnalytics(fromDate?: Date, toDate?: Date): Promise<FleetUsageStats[]>;
  
  // ==================== CONTRACTOR APPLICATION OPERATIONS ====================
  createContractorApplication(data: InsertContractorApplication): Promise<ContractorApplication>;
  getContractorApplication(id: string): Promise<ContractorApplication | undefined>;
  updateContractorApplication(id: string, updates: Partial<InsertContractorApplication>): Promise<ContractorApplication | undefined>;
  findContractorApplications(filters: {
    status?: string;
    email?: string;
    search?: string;
    fromDate?: Date;
    toDate?: Date;
  }): Promise<ContractorApplication[]>;
  
  createApplicationDocument(data: InsertApplicationDocument): Promise<ApplicationDocument>;
  updateApplicationDocument(id: string, updates: Partial<InsertApplicationDocument>): Promise<ApplicationDocument | undefined>;
  findApplicationDocuments(filters: {
    applicationId?: string;
    documentType?: string;
    verificationStatus?: string;
  }): Promise<ApplicationDocument[]>;
  
  createBackgroundCheck(data: InsertBackgroundCheck): Promise<BackgroundCheck>;
  updateBackgroundCheck(id: string, updates: Partial<InsertBackgroundCheck>): Promise<BackgroundCheck | undefined>;
  findBackgroundChecks(filters: {
    applicationId?: string;
    checkType?: string;
    status?: string;
  }): Promise<BackgroundCheck[]>;
  
  // ==================== ANALYTICS OPERATIONS ====================
  // Vehicle Analytics
  createVehicleAnalytics(data: InsertVehicleAnalytics): Promise<VehicleAnalytics>;
  getVehicleAnalytics(vehicleId: string): Promise<VehicleAnalytics | undefined>;
  updateVehicleAnalytics(id: string, updates: Partial<InsertVehicleAnalytics>): Promise<VehicleAnalytics | undefined>;
  updateVehicleMetrics(vehicleId: string, metrics: {
    milesDriven?: number;
    maintenanceCost?: number;
    fuelCost?: number;
    breakdownCount?: number;
    downtimeHours?: number;
  }): Promise<VehicleAnalytics | undefined>;
  getFleetAnalyticsSummary(fleetAccountId: string): Promise<{
    totalVehicles: number;
    fleetHealthScore: number;
    totalMaintenanceCost: number;
    avgCostPerMile: number;
    vehiclesAtRisk: number;
    upcomingMaintenance: Array<{ vehicleId: string; date: Date; service: string }>;
  }>;
  calculateVehicleHealthScore(vehicleId: string): Promise<number>;
  
  // Breakdown Patterns
  createBreakdownPattern(data: InsertBreakdownPattern): Promise<BreakdownPattern>;
  updateBreakdownPattern(id: string, updates: Partial<InsertBreakdownPattern>): Promise<BreakdownPattern | undefined>;
  getBreakdownPatterns(vehicleId: string): Promise<BreakdownPattern[]>;
  getFleetBreakdownPatterns(fleetAccountId: string, filters?: {
    issueCategory?: string;
    minFrequency?: number;
    fromDate?: Date;
    toDate?: Date;
  }): Promise<BreakdownPattern[]>;
  analyzeBreakdownPatterns(fleetAccountId: string): Promise<{
    topIssues: Array<{ issueType: string; frequency: number; avgCost: number }>;
    timePatterns: Record<string, number>;
    seasonalPatterns: Record<string, number>;
    locationClusters: Array<{ location: string; incidentCount: number }>;
  }>;
  
  // Fleet Analytics Alerts
  createFleetAnalyticsAlert(data: InsertFleetAnalyticsAlert): Promise<FleetAnalyticsAlert>;
  updateFleetAnalyticsAlert(id: string, updates: Partial<InsertFleetAnalyticsAlert>): Promise<FleetAnalyticsAlert | undefined>;
  acknowledgeAlert(alertId: string, userId: string): Promise<FleetAnalyticsAlert | undefined>;
  getActiveAlerts(fleetAccountId: string): Promise<FleetAnalyticsAlert[]>;
  getAlertHistory(fleetAccountId: string, limit?: number): Promise<FleetAnalyticsAlert[]>;
  triggerPredictiveAlerts(fleetAccountId: string): Promise<FleetAnalyticsAlert[]>;
  
  // Cost Analytics
  calculateCostPerMile(vehicleId: string, fromDate?: Date, toDate?: Date): Promise<{
    totalCost: number;
    totalMiles: number;
    costPerMile: number;
    maintenanceCPM: number;
    fuelCPM: number;
  }>;
  getFleetCostAnalysis(fleetAccountId: string, period: 'daily' | 'weekly' | 'monthly' | 'yearly'): Promise<Array<{
    date: Date;
    totalCost: number;
    maintenanceCost: number;
    fuelCost: number;
    avgCostPerMile: number;
  }>>;
  
  // Predictive Maintenance
  getPredictiveMaintenance(vehicleId: string): Promise<{
    nextMaintenanceDate: Date;
    predictedServices: Array<{ service: string; probability: number; estimatedCost: number }>;
    riskScore: number;
    recommendations: string[];
  }>;
  generateFleetMaintenanceSchedule(fleetAccountId: string): Promise<Array<{
    vehicleId: string;
    scheduledDate: Date;
    services: string[];
    estimatedCost: number;
    priority: 'low' | 'medium' | 'high' | 'critical';
  }>>;
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

  async hasAdminUsers(): Promise<boolean> {
    const result = await db.select().from(users).where(eq(users.role, 'admin')).limit(1);
    return result.length > 0;
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

  async getAllServiceAreas(): Promise<ServiceArea[]> {
    return await db.select().from(serviceAreas)
      .orderBy(asc(serviceAreas.name));
  }

  async getServiceArea(id: string): Promise<ServiceArea | undefined> {
    const result = await db.select().from(serviceAreas)
      .where(eq(serviceAreas.id, id))
      .limit(1);
    return result[0];
  }

  async deleteServiceArea(id: string): Promise<boolean> {
    const result = await db.delete(serviceAreas)
      .where(eq(serviceAreas.id, id))
      .returning();
    return result.length > 0;
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
  
  async getAllPricingRules(): Promise<PricingRule[]> {
    return await db.select().from(pricingRules)
      .orderBy(desc(pricingRules.priority), desc(pricingRules.createdAt));
  }
  
  async deletePricingRule(id: string): Promise<boolean> {
    const result = await db.delete(pricingRules)
      .where(eq(pricingRules.id, id))
      .returning();
    return result.length > 0;
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

  // Review Operations Implementation
  async createReview(review: InsertReview): Promise<Review> {
    const result = await db.insert(reviews).values(review).returning();
    
    // Update contractor rating statistics
    await this.updateContractorRatingStats(review.contractorId);
    
    return result[0];
  }

  async getReview(id: string): Promise<Review | undefined> {
    const result = await db.select().from(reviews)
      .where(eq(reviews.id, id))
      .limit(1);
    return result[0];
  }

  async getReviewByJob(jobId: string): Promise<Review | undefined> {
    const result = await db.select().from(reviews)
      .where(eq(reviews.jobId, jobId))
      .limit(1);
    return result[0];
  }

  async updateReview(id: string, updates: Partial<InsertReview>): Promise<Review | undefined> {
    const result = await db.update(reviews)
      .set({ 
        ...updates, 
        isEdited: true,
        editedAt: new Date(),
        updatedAt: new Date() 
      })
      .where(eq(reviews.id, id))
      .returning();
    
    if (result[0]) {
      // Update contractor rating statistics
      await this.updateContractorRatingStats(result[0].contractorId);
    }
    
    return result[0];
  }

  async getContractorReviews(
    contractorId: string, 
    limit = 50, 
    offset = 0,
    filters?: {
      minRating?: number;
      maxRating?: number;
      hasText?: boolean;
      sortBy?: 'recent' | 'highest' | 'lowest' | 'helpful';
    }
  ): Promise<Review[]> {
    let query = db.select().from(reviews)
      .where(eq(reviews.contractorId, contractorId));
    
    // Apply filters
    const conditions = [eq(reviews.contractorId, contractorId)];
    
    if (filters?.minRating) {
      conditions.push(gte(reviews.overallRating, filters.minRating));
    }
    if (filters?.maxRating) {
      conditions.push(lte(reviews.overallRating, filters.maxRating));
    }
    if (filters?.hasText) {
      conditions.push(sql`${reviews.reviewText} IS NOT NULL AND ${reviews.reviewText} != ''`);
    }
    
    query = db.select().from(reviews).where(and(...conditions));
    
    // Apply sorting
    switch (filters?.sortBy) {
      case 'highest':
        query = query.orderBy(desc(reviews.overallRating), desc(reviews.createdAt));
        break;
      case 'lowest':
        query = query.orderBy(asc(reviews.overallRating), desc(reviews.createdAt));
        break;
      case 'helpful':
        query = query.orderBy(desc(reviews.helpfulVotes), desc(reviews.createdAt));
        break;
      case 'recent':
      default:
        query = query.orderBy(desc(reviews.createdAt));
        break;
    }
    
    return await query.limit(limit).offset(offset);
  }

  async addContractorResponse(reviewId: string, response: string): Promise<Review | undefined> {
    const result = await db.update(reviews)
      .set({
        contractorResponse: response,
        contractorResponseAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(reviews.id, reviewId))
      .returning();
    return result[0];
  }

  async flagReview(reviewId: string, reason: string, flaggedBy: string): Promise<Review | undefined> {
    const result = await db.update(reviews)
      .set({
        isFlagged: true,
        flagReason: reason,
        flaggedBy,
        flaggedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(reviews.id, reviewId))
      .returning();
    return result[0];
  }

  async moderateReview(reviewId: string, status: string, moderatedBy: string): Promise<Review | undefined> {
    const result = await db.update(reviews)
      .set({
        moderationStatus: status,
        moderatedBy,
        moderatedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(reviews.id, reviewId))
      .returning();
    return result[0];
  }

  async voteReviewHelpful(reviewId: string, userId: string, isHelpful: boolean): Promise<boolean> {
    // Check if user has already voted
    const existingVote = await db.select().from(reviewVotes)
      .where(and(
        eq(reviewVotes.reviewId, reviewId),
        eq(reviewVotes.userId, userId)
      ))
      .limit(1);
    
    if (existingVote[0]) {
      // Update existing vote
      await db.update(reviewVotes)
        .set({ isHelpful })
        .where(and(
          eq(reviewVotes.reviewId, reviewId),
          eq(reviewVotes.userId, userId)
        ));
    } else {
      // Insert new vote
      await db.insert(reviewVotes).values({
        reviewId,
        userId,
        isHelpful
      });
    }
    
    // Update review vote counts
    const votes = await db.select({
      helpful: sql<number>`COUNT(CASE WHEN ${reviewVotes.isHelpful} = true THEN 1 END)`,
      unhelpful: sql<number>`COUNT(CASE WHEN ${reviewVotes.isHelpful} = false THEN 1 END)`
    })
    .from(reviewVotes)
    .where(eq(reviewVotes.reviewId, reviewId));
    
    await db.update(reviews)
      .set({
        helpfulVotes: votes[0]?.helpful || 0,
        unhelpfulVotes: votes[0]?.unhelpful || 0
      })
      .where(eq(reviews.id, reviewId));
    
    return true;
  }

  async updateContractorRatingStats(contractorId: string): Promise<boolean> {
    // Calculate all rating statistics
    const stats = await db.select({
      avgOverall: sql<number>`AVG(${reviews.overallRating})`,
      avgTimeliness: sql<number>`AVG(${reviews.timelinessRating})`,
      avgProfessionalism: sql<number>`AVG(${reviews.professionalismRating})`,
      avgQuality: sql<number>`AVG(${reviews.qualityRating})`,
      avgValue: sql<number>`AVG(${reviews.valueRating})`,
      totalReviews: sql<number>`COUNT(*)`,
      fiveStar: sql<number>`COUNT(CASE WHEN ${reviews.overallRating} = 5 THEN 1 END)`,
      fourStar: sql<number>`COUNT(CASE WHEN ${reviews.overallRating} = 4 THEN 1 END)`,
      threeStar: sql<number>`COUNT(CASE WHEN ${reviews.overallRating} = 3 THEN 1 END)`,
      twoStar: sql<number>`COUNT(CASE WHEN ${reviews.overallRating} = 2 THEN 1 END)`,
      oneStar: sql<number>`COUNT(CASE WHEN ${reviews.overallRating} = 1 THEN 1 END)`,
      withResponse: sql<number>`COUNT(CASE WHEN ${reviews.contractorResponse} IS NOT NULL THEN 1 END)`
    })
    .from(reviews)
    .where(and(
      eq(reviews.contractorId, contractorId),
      eq(reviews.moderationStatus, 'approved')
    ));
    
    const stat = stats[0];
    if (!stat) return false;
    
    // Calculate NPS (promoters - detractors)
    const nps = ((stat.fiveStar + stat.fourStar) - (stat.oneStar + stat.twoStar)) / 
                (stat.totalReviews || 1) * 100;
    
    // Update contractor profile
    await db.update(contractorProfiles)
      .set({ 
        averageRating: stat.avgOverall?.toString(),
        totalReviews: stat.totalReviews,
        fiveStarCount: stat.fiveStar,
        fourStarCount: stat.fourStar,
        threeStarCount: stat.threeStar,
        twoStarCount: stat.twoStar,
        oneStarCount: stat.oneStar,
        averageTimelinessRating: stat.avgTimeliness?.toString(),
        averageProfessionalismRating: stat.avgProfessionalism?.toString(),
        averageQualityRating: stat.avgQuality?.toString(),
        averageValueRating: stat.avgValue?.toString(),
        responseRate: stat.totalReviews > 0 ? 
          (stat.withResponse / stat.totalReviews * 100).toString() : '0',
        netPromoterScore: Math.round(nps),
        lastRatingUpdate: new Date(),
        updatedAt: new Date()
      })
      .where(eq(contractorProfiles.userId, contractorId));
    
    return true;
  }

  async getContractorRatingSummary(contractorId: string): Promise<{
    averageRating: number;
    totalReviews: number;
    ratingDistribution: Record<string, number>;
    categoryAverages: {
      timeliness: number;
      professionalism: number;
      quality: number;
      value: number;
    };
  }> {
    const profile = await db.select().from(contractorProfiles)
      .where(eq(contractorProfiles.userId, contractorId))
      .limit(1);
    
    if (!profile[0]) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 },
        categoryAverages: {
          timeliness: 0,
          professionalism: 0,
          quality: 0,
          value: 0
        }
      };
    }
    
    const p = profile[0];
    return {
      averageRating: parseFloat(p.averageRating || '0'),
      totalReviews: p.totalReviews,
      ratingDistribution: {
        '5': p.fiveStarCount,
        '4': p.fourStarCount,
        '3': p.threeStarCount,
        '2': p.twoStarCount,
        '1': p.oneStarCount
      },
      categoryAverages: {
        timeliness: parseFloat(p.averageTimelinessRating || '0'),
        professionalism: parseFloat(p.averageProfessionalismRating || '0'),
        quality: parseFloat(p.averageQualityRating || '0'),
        value: parseFloat(p.averageValueRating || '0')
      }
    };
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

  async getPaymentMethods(userId: string): Promise<PaymentMethod[]> {
    return await db.select().from(paymentMethods)
      .where(eq(paymentMethods.userId, userId))
      .orderBy(desc(paymentMethods.isDefault), desc(paymentMethods.createdAt));
  }

  async deletePaymentMethod(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(paymentMethods)
      .where(
        and(
          eq(paymentMethods.id, id),
          eq(paymentMethods.userId, userId)
        )
      )
      .returning();
    return result.length > 0;
  }

  async setDefaultPaymentMethod(paymentMethodId: string, userId: string): Promise<boolean> {
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

  async updateTransactionByExternalId(externalId: string, updates: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    const result = await db.update(transactions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(transactions.externalTransactionId, externalId))
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

  async getInvoices(filters: any): Promise<Invoice[]> {
    let query = db.select().from(invoices);
    const conditions = [];

    if (filters.userId) conditions.push(eq(invoices.userId, filters.userId));
    if (filters.fleetAccountId) conditions.push(eq(invoices.fleetAccountId, filters.fleetAccountId));
    if (filters.status) conditions.push(eq(invoices.status, filters.status));

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    // Apply ordering
    query = (filters.orderDir === 'asc' 
      ? query.orderBy(asc(invoices.createdAt)) 
      : query.orderBy(desc(invoices.createdAt))) as any;

    // Apply pagination
    if (filters.limit) query = query.limit(filters.limit) as any;
    if (filters.offset) query = query.offset(filters.offset) as any;

    return await query;
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

  // ==================== FLEET CHECK OPERATIONS ====================

  async createFleetCheck(check: InsertFleetCheck): Promise<FleetCheck> {
    // Mask the check number for storage
    const maskedCheckNumber = check.checkNumber.length > 4 
      ? '*'.repeat(check.checkNumber.length - 4) + check.checkNumber.slice(-4)
      : check.checkNumber;

    const result = await db.insert(fleetChecks).values({
      ...check,
      maskedCheckNumber,
      status: 'pending',
      retryCount: 0,
      capturedAmount: '0'
    }).returning();
    return result[0];
  }

  async getFleetCheck(id: string): Promise<FleetCheck | undefined> {
    const result = await db.select().from(fleetChecks).where(eq(fleetChecks.id, id)).limit(1);
    return result[0];
  }

  async getFleetCheckByCheckNumber(checkNumber: string): Promise<FleetCheck | undefined> {
    const result = await db.select().from(fleetChecks)
      .where(eq(fleetChecks.checkNumber, checkNumber))
      .orderBy(desc(fleetChecks.createdAt))
      .limit(1);
    return result[0];
  }

  async updateFleetCheck(id: string, updates: Partial<InsertFleetCheck>): Promise<FleetCheck | undefined> {
    const result = await db.update(fleetChecks)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(fleetChecks.id, id))
      .returning();
    return result[0];
  }

  async updateFleetCheckStatus(
    id: string, 
    status: typeof checkStatusEnum.enumValues[number], 
    response?: any
  ): Promise<FleetCheck | undefined> {
    const updates: any = { status, updatedAt: new Date() };
    
    if (status === 'authorized') {
      updates.authorizedAt = new Date();
      if (response) updates.authorizationResponse = response;
    } else if (status === 'captured' || status === 'partially_captured') {
      updates.capturedAt = new Date();
      if (response) updates.captureResponse = response;
    } else if (status === 'voided') {
      updates.voidedAt = new Date();
      if (response) updates.voidResponse = response;
    } else if (status === 'declined') {
      if (response) {
        updates.failureReason = response.errorCode || 'Declined';
        updates.lastError = response.message || 'Check declined';
      }
    }
    
    const result = await db.update(fleetChecks)
      .set(updates)
      .where(eq(fleetChecks.id, id))
      .returning();
    return result[0];
  }

  async findFleetChecks(filters: FleetCheckFilterOptions): Promise<FleetCheck[]> {
    const conditions: any[] = [];
    
    if (filters.provider) {
      conditions.push(eq(fleetChecks.provider, filters.provider));
    }
    if (filters.status) {
      conditions.push(eq(fleetChecks.status, filters.status));
    }
    if (filters.jobId) {
      conditions.push(eq(fleetChecks.jobId, filters.jobId));
    }
    if (filters.userId) {
      conditions.push(eq(fleetChecks.userId, filters.userId));
    }
    if (filters.fleetAccountId) {
      conditions.push(eq(fleetChecks.fleetAccountId, filters.fleetAccountId));
    }
    if (filters.checkNumber) {
      conditions.push(eq(fleetChecks.checkNumber, filters.checkNumber));
    }
    if (filters.fromDate) {
      conditions.push(gte(fleetChecks.createdAt, filters.fromDate));
    }
    if (filters.toDate) {
      conditions.push(lte(fleetChecks.createdAt, filters.toDate));
    }
    
    let query = db.select().from(fleetChecks);
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;
    const orderBy = filters.orderBy || 'createdAt';
    const orderDir = filters.orderDir || 'desc';
    
    if (orderDir === 'desc') {
      query = query.orderBy(desc(fleetChecks[orderBy]));
    } else {
      query = query.orderBy(asc(fleetChecks[orderBy]));
    }
    
    query = query.limit(limit).offset(offset);
    
    return await query;
  }

  async captureFleetCheck(id: string, amount: number, captureResponse: any): Promise<FleetCheck | undefined> {
    const check = await this.getFleetCheck(id);
    if (!check) return undefined;
    
    const currentCaptured = parseFloat(check.capturedAmount || '0');
    const newCaptured = currentCaptured + amount;
    const authorized = parseFloat(check.authorizedAmount);
    
    const status = newCaptured >= authorized ? 'captured' : 'partially_captured';
    
    const result = await db.update(fleetChecks)
      .set({
        capturedAmount: newCaptured.toString(),
        status,
        capturedAt: new Date(),
        captureResponse,
        updatedAt: new Date()
      })
      .where(eq(fleetChecks.id, id))
      .returning();
    
    return result[0];
  }

  async voidFleetCheck(id: string, voidResponse: any): Promise<FleetCheck | undefined> {
    const result = await db.update(fleetChecks)
      .set({
        status: 'voided',
        voidedAt: new Date(),
        voidResponse,
        updatedAt: new Date()
      })
      .where(eq(fleetChecks.id, id))
      .returning();
    
    return result[0];
  }

  async getActiveFleetCheckForJob(jobId: string): Promise<FleetCheck | undefined> {
    const result = await db.select().from(fleetChecks)
      .where(
        and(
          eq(fleetChecks.jobId, jobId),
          inArray(fleetChecks.status, ['authorized', 'partially_captured'])
        )
      )
      .orderBy(desc(fleetChecks.createdAt))
      .limit(1);
    
    return result[0];
  }

  async getTotalCapturedAmount(checkNumber: string): Promise<number> {
    const checks = await db.select().from(fleetChecks)
      .where(
        and(
          eq(fleetChecks.checkNumber, checkNumber),
          inArray(fleetChecks.status, ['captured', 'partially_captured'])
        )
      );
    
    return checks.reduce((total, check) => {
      return total + parseFloat(check.capturedAmount || '0');
    }, 0);
  }

  async getFleetChecksByUser(userId: string, limit: number = 10): Promise<FleetCheck[]> {
    return await db.select().from(fleetChecks)
      .where(eq(fleetChecks.userId, userId))
      .orderBy(desc(fleetChecks.createdAt))
      .limit(limit);
  }

  async getFleetChecksByFleet(
    fleetAccountId: string, 
    filters?: FleetCheckFilterOptions
  ): Promise<FleetCheck[]> {
    return await this.findFleetChecks({
      ...filters,
      fleetAccountId
    });
  }

  async getPendingFleetChecksForCapture(): Promise<FleetCheck[]> {
    // Get checks that are authorized but not fully captured and haven't expired
    const now = new Date();
    
    return await db.select().from(fleetChecks)
      .where(
        and(
          inArray(fleetChecks.status, ['authorized', 'partially_captured']),
          or(
            isNull(fleetChecks.expiresAt),
            gt(fleetChecks.expiresAt, now)
          )
        )
      )
      .orderBy(asc(fleetChecks.authorizedAt));
  }

  // ==================== BIDDING OPERATIONS ====================

  async createJobBid(bid: InsertJobBid): Promise<JobBid> {
    // Get contractor info for snapshot
    const contractor = await this.getContractorProfile(bid.contractorId);
    const user = await this.getUser(bid.contractorId);
    
    // Populate contractor info snapshot
    const bidWithContractorInfo = {
      ...bid,
      contractorName: user?.firstName ? `${user.firstName} ${user.lastName || ''}` : contractor?.companyName || 'Unknown',
      contractorRating: contractor?.averageRating ? Number(contractor.averageRating) : undefined,
      contractorCompletedJobs: contractor?.totalJobsCompleted || 0,
      contractorResponseTime: contractor?.averageResponseTime || undefined
    };
    
    const result = await db.insert(jobBids).values(bidWithContractorInfo).returning();
    
    // Update bid count on job
    await db.update(jobs)
      .set({ 
        bidCount: sql`bid_count + 1`,
        updatedAt: new Date()
      })
      .where(eq(jobs.id, bid.jobId));
    
    // Update bid ranks
    await this.updateBidRanks(bid.jobId);
    
    return result[0];
  }

  async getJobBid(id: string): Promise<JobBid | undefined> {
    const result = await db.select().from(jobBids).where(eq(jobBids.id, id)).limit(1);
    return result[0];
  }

  async updateJobBid(id: string, updates: Partial<InsertJobBid>): Promise<JobBid | undefined> {
    const result = await db.update(jobBids)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(jobBids.id, id))
      .returning();
    
    if (result[0]) {
      // Update bid ranks if amount changed
      if (updates.bidAmount) {
        const bid = result[0];
        await this.updateBidRanks(bid.jobId);
      }
    }
    
    return result[0];
  }

  async getJobBids(jobId: string): Promise<JobBid[]> {
    return await db.select().from(jobBids)
      .where(eq(jobBids.jobId, jobId))
      .orderBy(asc(jobBids.bidAmount), desc(jobBids.createdAt));
  }

  async getContractorBids(contractorId: string, status?: typeof bidStatusEnum.enumValues[number]): Promise<JobBid[]> {
    const conditions = [eq(jobBids.contractorId, contractorId)];
    if (status) {
      conditions.push(eq(jobBids.status, status));
    }
    
    return await db.select().from(jobBids)
      .where(and(...conditions))
      .orderBy(desc(jobBids.createdAt));
  }

  async acceptBid(bidId: string, jobId: string): Promise<JobBid | undefined> {
    // Start transaction
    const acceptedBid = await db.transaction(async (tx) => {
      // Accept the winning bid
      const [accepted] = await tx.update(jobBids)
        .set({ 
          status: 'accepted',
          acceptedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(jobBids.id, bidId))
        .returning();
      
      if (!accepted) return undefined;
      
      // Reject all other bids for this job
      await tx.update(jobBids)
        .set({ 
          status: 'rejected',
          rejectedAt: new Date(),
          updatedAt: new Date()
        })
        .where(and(
          eq(jobBids.jobId, jobId),
          ne(jobBids.id, bidId),
          eq(jobBids.status, 'pending')
        ));
      
      // Update the job with winning bid and assign contractor
      await tx.update(jobs)
        .set({
          winningBidId: bidId,
          contractorId: accepted.contractorId,
          finalPrice: accepted.bidAmount ? Number(accepted.bidAmount) : undefined,
          status: 'assigned',
          assignedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(jobs.id, jobId));
      
      return accepted;
    });
    
    return acceptedBid;
  }

  async rejectBid(bidId: string, reason?: string): Promise<JobBid | undefined> {
    const result = await db.update(jobBids)
      .set({ 
        status: 'rejected',
        rejectedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(jobBids.id, bidId))
      .returning();
    
    return result[0];
  }

  async counterBid(bidId: string, counterAmount: number, message: string): Promise<JobBid | undefined> {
    // Get original bid
    const originalBid = await this.getJobBid(bidId);
    if (!originalBid) return undefined;
    
    // Update original bid status
    await db.update(jobBids)
      .set({ 
        status: 'countered',
        updatedAt: new Date()
      })
      .where(eq(jobBids.id, bidId));
    
    // Create counter bid
    const counterBid = await this.createJobBid({
      jobId: originalBid.jobId,
      contractorId: originalBid.contractorId,
      bidAmount: counterAmount.toString(),
      estimatedCompletionTime: originalBid.estimatedCompletionTime,
      messageToCustomer: message,
      isCounterOffer: true,
      originalBidId: bidId,
      counterOfferAmount: counterAmount.toString(),
      counterOfferMessage: message,
      expiresAt: originalBid.expiresAt,
      laborCost: originalBid.laborCost,
      materialsCost: originalBid.materialsCost,
      materialsDescription: originalBid.materialsDescription
    });
    
    return counterBid;
  }

  async withdrawBid(bidId: string, contractorId: string): Promise<JobBid | undefined> {
    const result = await db.update(jobBids)
      .set({ 
        status: 'withdrawn',
        withdrawnAt: new Date(),
        updatedAt: new Date()
      })
      .where(and(
        eq(jobBids.id, bidId),
        eq(jobBids.contractorId, contractorId)
      ))
      .returning();
    
    if (result[0]) {
      // Update bid count on job
      await db.update(jobs)
        .set({ 
          bidCount: sql`GREATEST(bid_count - 1, 0)`,
          updatedAt: new Date()
        })
        .where(eq(jobs.id, result[0].jobId));
    }
    
    return result[0];
  }

  async getAvailableBiddingJobs(contractorId: string, filters?: {
    serviceTypeId?: string;
    maxDistance?: number;
    minPrice?: number;
  }): Promise<Job[]> {
    const conditions = [
      eq(jobs.allowBidding, true),
      eq(jobs.status, 'new'),
      gt(jobs.biddingDeadline, new Date()),
      or(
        isNull(jobs.contractorId),
        ne(jobs.contractorId, contractorId)
      )
    ];
    
    if (filters?.serviceTypeId) {
      conditions.push(eq(jobs.serviceTypeId, filters.serviceTypeId));
    }
    
    if (filters?.minPrice) {
      conditions.push(gte(jobs.estimatedPrice, filters.minPrice.toString()));
    }
    
    // Get contractor's existing bids to exclude jobs they've already bid on
    const existingBids = await db.select({ jobId: jobBids.jobId })
      .from(jobBids)
      .where(eq(jobBids.contractorId, contractorId));
    
    const bidJobIds = existingBids.map(b => b.jobId);
    
    if (bidJobIds.length > 0) {
      conditions.push(sql`${jobs.id} NOT IN (${sql.raw(bidJobIds.map(() => '?').join(','))})`, ...bidJobIds);
    }
    
    return await db.select().from(jobs)
      .where(and(...conditions))
      .orderBy(desc(jobs.createdAt))
      .limit(100);
  }

  async updateBidRanks(jobId: string): Promise<void> {
    // Get all pending bids for the job
    const bids = await db.select().from(jobBids)
      .where(and(
        eq(jobBids.jobId, jobId),
        eq(jobBids.status, 'pending')
      ))
      .orderBy(asc(jobBids.bidAmount));
    
    // Update price ranks
    for (let i = 0; i < bids.length; i++) {
      const bid = bids[i];
      await db.update(jobBids)
        .set({ priceRank: i + 1 })
        .where(eq(jobBids.id, bid.id));
    }
    
    // Update time ranks
    const bidsByTime = [...bids].sort((a, b) => 
      (a.estimatedCompletionTime || 999999) - (b.estimatedCompletionTime || 999999)
    );
    
    for (let i = 0; i < bidsByTime.length; i++) {
      const bid = bidsByTime[i];
      await db.update(jobBids)
        .set({ timeRank: i + 1 })
        .where(eq(jobBids.id, bid.id));
    }
    
    // Update quality ranks based on contractor rating
    const bidsByQuality = [...bids].sort((a, b) => 
      (Number(b.contractorRating) || 0) - (Number(a.contractorRating) || 0)
    );
    
    for (let i = 0; i < bidsByQuality.length; i++) {
      const bid = bidsByQuality[i];
      await db.update(jobBids)
        .set({ qualityRank: i + 1 })
        .where(eq(jobBids.id, bid.id));
    }
    
    // Calculate and update bid scores (weighted average)
    for (const bid of bids) {
      const priceScore = (bids.length - (bid.priceRank || bids.length) + 1) / bids.length * 40;
      const timeScore = (bidsByTime.length - (bid.timeRank || bidsByTime.length) + 1) / bidsByTime.length * 30;
      const qualityScore = (bidsByQuality.length - (bid.qualityRank || bidsByQuality.length) + 1) / bidsByQuality.length * 30;
      const totalScore = priceScore + timeScore + qualityScore;
      
      await db.update(jobBids)
        .set({ bidScore: totalScore.toString() })
        .where(eq(jobBids.id, bid.id));
    }
    
    // Update job's lowest and average bid amounts
    if (bids.length > 0) {
      const amounts = bids.map(b => Number(b.bidAmount) || 0).filter(a => a > 0);
      const lowestBid = Math.min(...amounts);
      const averageBid = amounts.reduce((a, b) => a + b, 0) / amounts.length;
      
      await db.update(jobs)
        .set({
          lowestBidAmount: lowestBid.toString(),
          averageBidAmount: averageBid.toString()
        })
        .where(eq(jobs.id, jobId));
    }
  }

  async checkBidDeadline(jobId: string): Promise<boolean> {
    const job = await this.getJob(jobId);
    if (!job || !job.biddingDeadline) return false;
    
    return new Date() < new Date(job.biddingDeadline);
  }

  async autoAcceptLowestBid(jobId: string): Promise<JobBid | undefined> {
    const job = await this.getJob(jobId);
    if (!job || job.autoAcceptBids !== 'lowest') return undefined;
    
    // Get the lowest bid
    const bids = await this.getJobBids(jobId);
    const pendingBids = bids.filter(b => b.status === 'pending');
    
    if (pendingBids.length === 0) return undefined;
    
    const lowestBid = pendingBids[0]; // Already sorted by amount
    
    // Check if reserve price is met
    if (job.reservePrice && Number(lowestBid.bidAmount) > Number(job.reservePrice)) {
      return undefined;
    }
    
    // Accept the lowest bid
    return await this.acceptBid(lowestBid.id, jobId);
  }

  async createBidTemplate(template: InsertBidTemplate): Promise<BidTemplate> {
    const result = await db.insert(bidTemplates).values(template).returning();
    return result[0];
  }

  async updateBidTemplate(id: string, updates: Partial<InsertBidTemplate>): Promise<BidTemplate | undefined> {
    const result = await db.update(bidTemplates)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(bidTemplates.id, id))
      .returning();
    return result[0];
  }

  async deleteBidTemplate(id: string): Promise<boolean> {
    const result = await db.delete(bidTemplates)
      .where(eq(bidTemplates.id, id))
      .returning();
    return result.length > 0;
  }

  async getContractorBidTemplates(contractorId: string): Promise<BidTemplate[]> {
    return await db.select().from(bidTemplates)
      .where(and(
        eq(bidTemplates.contractorId, contractorId),
        eq(bidTemplates.isActive, true)
      ))
      .orderBy(desc(bidTemplates.createdAt));
  }

  async getBiddingConfig(): Promise<BiddingConfig | undefined> {
    const result = await db.select().from(biddingConfig).limit(1);
    return result[0];
  }

  async updateBiddingConfig(updates: Partial<InsertBiddingConfig>): Promise<BiddingConfig> {
    const existing = await this.getBiddingConfig();
    
    if (existing) {
      const result = await db.update(biddingConfig)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(biddingConfig.id, existing.id))
        .returning();
      return result[0];
    } else {
      const result = await db.insert(biddingConfig)
        .values({ ...updates })
        .returning();
      return result[0];
    }
  }

  async createBidAnalytics(analytics: InsertBidAnalytics): Promise<BidAnalytics> {
    const result = await db.insert(bidAnalytics).values(analytics).returning();
    return result[0];
  }

  async getBidAnalytics(filters: {
    serviceTypeId?: string;
    period?: string;
    fromDate?: Date;
    toDate?: Date;
  }): Promise<BidAnalytics[]> {
    const conditions = [];
    
    if (filters.serviceTypeId) {
      conditions.push(eq(bidAnalytics.serviceTypeId, filters.serviceTypeId));
    }
    
    if (filters.period) {
      conditions.push(eq(bidAnalytics.period, filters.period));
    }
    
    if (filters.fromDate) {
      conditions.push(gte(bidAnalytics.periodDate, filters.fromDate));
    }
    
    if (filters.toDate) {
      conditions.push(lte(bidAnalytics.periodDate, filters.toDate));
    }
    
    return await db.select().from(bidAnalytics)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(bidAnalytics.periodDate));
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

    const [jobMetrics, contractorCount, fleetCount, revenueMetrics, responseMetrics, onlineContractorCount, userCount, jobValueMetrics, platformFeesMetrics] = await Promise.all([
      // Job metrics
      db.select({
        active: sql<number>`COUNT(*) FILTER (WHERE ${jobs.status} IN ('new', 'assigned', 'en_route', 'on_site'))`,
        completed: sql<number>`COUNT(*) FILTER (WHERE ${jobs.status} = 'completed')`,
        total: sql<number>`COUNT(*)`
      })
      .from(jobs)
      .where(dateConditions.length > 0 ? and(...dateConditions) : undefined),
      
      // Total contractor count
      db.select({
        count: sql<number>`COUNT(*)`
      })
      .from(contractorProfiles),
      
      // Fleet count
      db.select({
        count: sql<number>`COUNT(*)`
      })
      .from(fleetAccounts)
      .where(and(eq(fleetAccounts.isActive, true), isNull(fleetAccounts.deletedAt))),
      
      // Revenue
      db.select({
        total: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`
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
      ),
      
      // Online contractor count
      db.select({
        count: sql<number>`COUNT(*)`
      })
      .from(contractorProfiles)
      .where(eq(contractorProfiles.isAvailable, true)),
      
      // Total user count
      db.select({
        count: sql<number>`COUNT(*)`
      })
      .from(users)
      .where(eq(users.isActive, true)),
      
      // Average job value
      db.select({
        avgValue: sql<number>`COALESCE(AVG(${transactions.amount}), 0)`
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.status, 'completed'),
          ...(dateConditions.length > 0 ? dateConditions : [])
        )
      ),
      
      // Platform fees (calculated as percentage of revenue - assuming 10% fee)
      db.select({
        fees: sql<number>`COALESCE(SUM(${transactions.amount}) * 0.1, 0)`
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.status, 'completed'),
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
      totalFleets: fleetCount[0]?.count || 0,
      onlineContractors: onlineContractorCount[0]?.count || 0,
      totalUsers: userCount[0]?.count || 0,
      avgJobValue: jobValueMetrics[0]?.avgValue || 0,
      platformFees: platformFeesMetrics[0]?.fees || 0
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

  // ==================== REMINDER SYSTEM ====================

  async getIntegrationsConfig(type: 'email' | 'sms'): Promise<any | null> {
    // This method returns integration configurations for email/SMS services
    // In production, this would fetch from a secure configuration store
    
    if (type === 'email') {
      // Check for Office 365/Outlook configuration in environment variables
      const emailUser = process.env.OUTLOOK_EMAIL;
      const emailPass = process.env.OUTLOOK_PASSWORD;
      
      if (emailUser && emailPass) {
        return {
          provider: 'outlook',
          host: 'smtp-mail.outlook.com',
          port: 587,
          secure: false,
          auth: {
            user: emailUser,
            pass: emailPass
          },
          from: emailUser
        };
      }
    } else if (type === 'sms') {
      // Check for Twilio configuration in environment variables
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const phoneNumber = process.env.TWILIO_PHONE_NUMBER;
      
      if (accountSid && authToken && phoneNumber) {
        return {
          provider: 'twilio',
          accountSid,
          authToken,
          phoneNumber
        };
      }
    }
    
    return null;
  }

  async getCustomerPreferences(userId: string): Promise<CustomerPreferences | null> {
    const result = await db.select().from(customerPreferences)
      .where(eq(customerPreferences.userId, userId));
    return result[0] || null;
  }

  async createCustomerPreferences(data: InsertCustomerPreferences): Promise<CustomerPreferences> {
    const unsubscribeToken = randomUUID();
    const result = await db.insert(customerPreferences)
      .values({ ...data, unsubscribeToken })
      .returning();
    return result[0];
  }

  async updateCustomerPreferences(userId: string, data: Partial<InsertCustomerPreferences>): Promise<CustomerPreferences | null> {
    const result = await db.update(customerPreferences)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(customerPreferences.userId, userId))
      .returning();
    return result[0] || null;
  }

  async createReminder(data: InsertReminder): Promise<Reminder> {
    const result = await db.insert(reminders).values(data).returning();
    return result[0];
  }

  async getReminder(id: string): Promise<Reminder | null> {
    const result = await db.select().from(reminders)
      .where(eq(reminders.id, id));
    return result[0] || null;
  }

  async updateReminderStatus(id: string, status: typeof reminderStatusEnum.enumValues[number], error?: string): Promise<Reminder | null> {
    const updateData: any = {
      status,
      updatedAt: new Date()
    };
    
    if (status === 'sent') {
      updateData.actualSendTime = new Date();
    }
    
    if (error) {
      updateData.lastError = error;
      updateData.retryCount = sql`${reminders.retryCount} + 1`;
    }
    
    const result = await db.update(reminders)
      .set(updateData)
      .where(eq(reminders.id, id))
      .returning();
    return result[0] || null;
  }

  async getPendingReminders(limit: number = 100): Promise<Reminder[]> {
    const now = new Date();
    return await db.select().from(reminders)
      .where(
        and(
          inArray(reminders.status, ['pending', 'queued']),
          lte(reminders.scheduledSendTime, now),
          lt(reminders.retryCount, reminders.maxRetries)
        )
      )
      .orderBy(asc(reminders.scheduledSendTime))
      .limit(limit);
  }

  async getUpcomingReminders(jobId: string): Promise<Reminder[]> {
    return await db.select().from(reminders)
      .where(
        and(
          eq(reminders.jobId, jobId),
          inArray(reminders.status, ['pending', 'queued'])
        )
      )
      .orderBy(asc(reminders.scheduledSendTime));
  }

  async cancelJobReminders(jobId: string): Promise<void> {
    await db.update(reminders)
      .set({ 
        status: 'cancelled',
        updatedAt: new Date()
      })
      .where(
        and(
          eq(reminders.jobId, jobId),
          inArray(reminders.status, ['pending', 'queued'])
        )
      );
  }

  async createReminderLog(data: InsertReminderLog): Promise<ReminderLog> {
    const result = await db.insert(reminderLog).values(data).returning();
    return result[0];
  }

  async updateReminderLogTracking(id: string, event: 'opened' | 'clicked' | 'unsubscribed' | 'bounced'): Promise<void> {
    const updateData: any = {};
    
    switch (event) {
      case 'opened':
        updateData.opened = true;
        updateData.openedAt = new Date();
        break;
      case 'clicked':
        updateData.clicked = true;
        updateData.clickedAt = new Date();
        break;
      case 'unsubscribed':
        updateData.unsubscribed = true;
        updateData.unsubscribedAt = new Date();
        break;
      case 'bounced':
        updateData.bounced = true;
        updateData.bouncedAt = new Date();
        break;
    }
    
    await db.update(reminderLog)
      .set(updateData)
      .where(eq(reminderLog.id, id));
  }

  async isBlacklisted(value: string, type: 'email' | 'phone'): Promise<boolean> {
    const result = await db.select().from(reminderBlacklist)
      .where(
        and(
          eq(reminderBlacklist.value, value),
          eq(reminderBlacklist.type, type),
          eq(reminderBlacklist.isActive, true),
          or(
            isNull(reminderBlacklist.expiresAt),
            gt(reminderBlacklist.expiresAt, new Date())
          )
        )
      )
      .limit(1);
    return result.length > 0;
  }

  async addToBlacklist(data: InsertReminderBlacklist): Promise<ReminderBlacklist> {
    const result = await db.insert(reminderBlacklist).values(data).returning();
    return result[0];
  }

  async removeFromBlacklist(value: string): Promise<void> {
    await db.update(reminderBlacklist)
      .set({ 
        isActive: false,
        updatedAt: new Date()
      })
      .where(eq(reminderBlacklist.value, value));
  }

  async getBlacklist(type?: 'email' | 'phone'): Promise<ReminderBlacklist[]> {
    const conditions = [eq(reminderBlacklist.isActive, true)];
    if (type) {
      conditions.push(eq(reminderBlacklist.type, type));
    }
    
    return await db.select().from(reminderBlacklist)
      .where(and(...conditions))
      .orderBy(desc(reminderBlacklist.createdAt));
  }

  async recordReminderMetrics(date: Date, metrics: Partial<InsertReminderMetrics>): Promise<void> {
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);
    
    const existing = await db.select().from(reminderMetrics)
      .where(
        and(
          eq(reminderMetrics.date, dateOnly),
          eq(reminderMetrics.channel, metrics.channel!),
          eq(reminderMetrics.messageType, metrics.messageType!)
        )
      )
      .limit(1);
    
    if (existing.length > 0) {
      // Update existing metrics
      const current = existing[0];
      await db.update(reminderMetrics)
        .set({
          totalSent: (current.totalSent || 0) + (metrics.totalSent || 0),
          totalDelivered: (current.totalDelivered || 0) + (metrics.totalDelivered || 0),
          totalFailed: (current.totalFailed || 0) + (metrics.totalFailed || 0),
          totalOpened: (current.totalOpened || 0) + (metrics.totalOpened || 0),
          totalClicked: (current.totalClicked || 0) + (metrics.totalClicked || 0),
          totalUnsubscribed: (current.totalUnsubscribed || 0) + (metrics.totalUnsubscribed || 0),
          totalBounced: (current.totalBounced || 0) + (metrics.totalBounced || 0),
          totalCost: sql`${reminderMetrics.totalCost} + ${metrics.totalCost || 0}`
        })
        .where(eq(reminderMetrics.id, current.id));
    } else {
      // Create new metrics entry
      await db.insert(reminderMetrics).values({
        ...metrics,
        date: dateOnly
      } as InsertReminderMetrics);
    }
  }

  async getReminderMetrics(fromDate: Date, toDate: Date, channel?: typeof reminderTypeEnum.enumValues[number]): Promise<ReminderMetrics[]> {
    const conditions = [
      gte(reminderMetrics.date, fromDate),
      lte(reminderMetrics.date, toDate)
    ];
    
    if (channel) {
      conditions.push(eq(reminderMetrics.channel, channel as any));
    }
    
    return await db.select().from(reminderMetrics)
      .where(and(...conditions))
      .orderBy(desc(reminderMetrics.date));
  }

  async getSmsTemplate(code: string): Promise<SmsTemplate | null> {
    const result = await db.select().from(smsTemplates)
      .where(
        and(
          eq(smsTemplates.code, code),
          eq(smsTemplates.isActive, true)
        )
      );
    return result[0] || null;
  }

  async getAllSmsTemplates(): Promise<SmsTemplate[]> {
    return await db.select().from(smsTemplates)
      .where(eq(smsTemplates.isActive, true))
      .orderBy(asc(smsTemplates.name));
  }

  async createSmsTemplate(data: InsertSmsTemplate): Promise<SmsTemplate> {
    const result = await db.insert(smsTemplates).values(data).returning();
    return result[0];
  }

  async updateSmsTemplate(id: string, data: Partial<InsertSmsTemplate>): Promise<SmsTemplate | null> {
    const result = await db.update(smsTemplates)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(smsTemplates.id, id))
      .returning();
    return result[0] || null;
  }

  async getJobsScheduledBetween(startTime: Date, endTime: Date): Promise<Job[]> {
    return await db.select().from(jobs)
      .where(
        and(
          gte(jobs.scheduledAt, startTime),
          lte(jobs.scheduledAt, endTime),
          eq(jobs.status, 'assigned')
        )
      )
      .orderBy(asc(jobs.scheduledAt));
  }

  async getFailedReminders(limit: number = 20): Promise<Reminder[]> {
    return await db.select().from(reminders)
      .where(
        and(
          eq(reminders.status, 'failed'),
          lt(reminders.retryCount, reminders.maxRetries)
        )
      )
      .orderBy(asc(reminders.scheduledSendTime))
      .limit(limit);
  }

  async deleteOldReminderLogs(beforeDate: Date): Promise<number> {
    const result = await db.delete(reminderLog)
      .where(lt(reminderLog.createdAt, beforeDate));
    return result.count || 0;
  }

  async getReminderLogsByDate(startDate: Date, endDate: Date): Promise<ReminderLog[]> {
    return await db.select().from(reminderLog)
      .where(
        and(
          gte(reminderLog.createdAt, startDate),
          lt(reminderLog.createdAt, endDate)
        )
      )
      .orderBy(asc(reminderLog.createdAt));
  }
  
  // ==================== CONTRACTOR APPLICATION OPERATIONS ====================
  
  async createContractorApplication(data: InsertContractorApplication): Promise<ContractorApplication> {
    const result = await db.insert(contractorApplications).values(data).returning();
    return result[0];
  }

  async getContractorApplication(id: string): Promise<ContractorApplication | undefined> {
    const result = await db.select().from(contractorApplications)
      .where(eq(contractorApplications.id, id))
      .limit(1);
    return result[0];
  }

  async updateContractorApplication(id: string, updates: Partial<InsertContractorApplication>): Promise<ContractorApplication | undefined> {
    const result = await db.update(contractorApplications)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(contractorApplications.id, id))
      .returning();
    return result[0];
  }

  async findContractorApplications(filters: {
    status?: string;
    email?: string;
    search?: string;
    fromDate?: Date;
    toDate?: Date;
  }): Promise<ContractorApplication[]> {
    const conditions = [];
    
    if (filters.status) {
      conditions.push(eq(contractorApplications.status, filters.status as any));
    }
    
    if (filters.email) {
      conditions.push(eq(contractorApplications.email, filters.email));
    }
    
    if (filters.search) {
      conditions.push(
        or(
          ilike(contractorApplications.firstName, `%${filters.search}%`),
          ilike(contractorApplications.lastName, `%${filters.search}%`),
          ilike(contractorApplications.email, `%${filters.search}%`),
          ilike(contractorApplications.phone, `%${filters.search}%`),
          ilike(contractorApplications.companyName, `%${filters.search}%`)
        )
      );
    }
    
    if (filters.fromDate) {
      conditions.push(gte(contractorApplications.createdAt, filters.fromDate));
    }
    
    if (filters.toDate) {
      conditions.push(lte(contractorApplications.createdAt, filters.toDate));
    }
    
    return await db.select().from(contractorApplications)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(contractorApplications.createdAt));
  }
  
  async createApplicationDocument(data: InsertApplicationDocument): Promise<ApplicationDocument> {
    const result = await db.insert(applicationDocuments).values(data).returning();
    return result[0];
  }

  async updateApplicationDocument(id: string, updates: Partial<InsertApplicationDocument>): Promise<ApplicationDocument | undefined> {
    const result = await db.update(applicationDocuments)
      .set(updates)
      .where(eq(applicationDocuments.id, id))
      .returning();
    return result[0];
  }

  async findApplicationDocuments(filters: {
    applicationId?: string;
    documentType?: string;
    verificationStatus?: string;
  }): Promise<ApplicationDocument[]> {
    const conditions = [];
    
    if (filters.applicationId) {
      conditions.push(eq(applicationDocuments.applicationId, filters.applicationId));
    }
    
    if (filters.documentType) {
      conditions.push(eq(applicationDocuments.documentType, filters.documentType));
    }
    
    if (filters.verificationStatus) {
      conditions.push(eq(applicationDocuments.verificationStatus, filters.verificationStatus as any));
    }
    
    return await db.select().from(applicationDocuments)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(applicationDocuments.uploadedAt));
  }
  
  async createBackgroundCheck(data: InsertBackgroundCheck): Promise<BackgroundCheck> {
    const result = await db.insert(backgroundChecks).values(data).returning();
    return result[0];
  }

  async updateBackgroundCheck(id: string, updates: Partial<InsertBackgroundCheck>): Promise<BackgroundCheck | undefined> {
    const result = await db.update(backgroundChecks)
      .set(updates)
      .where(eq(backgroundChecks.id, id))
      .returning();
    return result[0];
  }

  async findBackgroundChecks(filters: {
    applicationId?: string;
    checkType?: string;
    status?: string;
  }): Promise<BackgroundCheck[]> {
    const conditions = [];
    
    if (filters.applicationId) {
      conditions.push(eq(backgroundChecks.applicationId, filters.applicationId));
    }
    
    if (filters.checkType) {
      conditions.push(eq(backgroundChecks.checkType, filters.checkType));
    }
    
    if (filters.status) {
      conditions.push(eq(backgroundChecks.status, filters.status as any));
    }
    
    return await db.select().from(backgroundChecks)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(backgroundChecks.requestedAt));
  }

  // ==================== BILLING SUBSCRIPTION OPERATIONS ====================

  async createBillingSubscription(data: InsertBillingSubscription): Promise<BillingSubscription> {
    const result = await db.insert(billingSubscriptions).values(data).returning();
    return result[0];
  }

  async getBillingSubscription(id: string): Promise<BillingSubscription | null> {
    const result = await db.select().from(billingSubscriptions)
      .where(eq(billingSubscriptions.id, id))
      .limit(1);
    return result[0] || null;
  }

  async getFleetActiveSubscription(fleetAccountId: string): Promise<BillingSubscription | null> {
    const result = await db.select().from(billingSubscriptions)
      .where(
        and(
          eq(billingSubscriptions.fleetAccountId, fleetAccountId),
          eq(billingSubscriptions.status, 'active')
        )
      )
      .limit(1);
    return result[0] || null;
  }

  async getFleetSubscriptions(fleetAccountId: string): Promise<BillingSubscription[]> {
    return await db.select().from(billingSubscriptions)
      .where(eq(billingSubscriptions.fleetAccountId, fleetAccountId))
      .orderBy(desc(billingSubscriptions.createdAt));
  }

  async updateBillingSubscription(id: string, data: Partial<InsertBillingSubscription>): Promise<BillingSubscription | null> {
    const result = await db.update(billingSubscriptions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(billingSubscriptions.id, id))
      .returning();
    return result[0] || null;
  }

  async updateSubscriptionByStripeId(stripeSubscriptionId: string, data: Partial<InsertBillingSubscription>): Promise<BillingSubscription | null> {
    const result = await db.update(billingSubscriptions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(billingSubscriptions.stripeSubscriptionId, stripeSubscriptionId))
      .returning();
    return result[0] || null;
  }

  async updateSubscriptionBillingDates(stripeSubscriptionId: string): Promise<void> {
    await db.update(billingSubscriptions)
      .set({ 
        lastBillingDate: new Date(),
        updatedAt: new Date() 
      })
      .where(eq(billingSubscriptions.stripeSubscriptionId, stripeSubscriptionId));
  }

  async getSubscriptionsDueForBilling(limit: number = 100): Promise<BillingSubscription[]> {
    const now = new Date();
    return await db.select().from(billingSubscriptions)
      .where(
        and(
          eq(billingSubscriptions.status, 'active'),
          lte(billingSubscriptions.nextBillingDate, now)
        )
      )
      .orderBy(asc(billingSubscriptions.nextBillingDate))
      .limit(limit);
  }

  async pauseSubscription(id: string): Promise<BillingSubscription | null> {
    const result = await db.update(billingSubscriptions)
      .set({ 
        status: 'paused',
        pausedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(billingSubscriptions.id, id))
      .returning();
    return result[0] || null;
  }

  async resumeSubscription(id: string): Promise<BillingSubscription | null> {
    const result = await db.update(billingSubscriptions)
      .set({ 
        status: 'active',
        pausedAt: null,
        updatedAt: new Date()
      })
      .where(eq(billingSubscriptions.id, id))
      .returning();
    return result[0] || null;
  }

  async cancelSubscription(id: string, reason?: string): Promise<BillingSubscription | null> {
    const result = await db.update(billingSubscriptions)
      .set({ 
        status: 'cancelled',
        cancelledAt: new Date(),
        cancellationReason: reason,
        updatedAt: new Date()
      })
      .where(eq(billingSubscriptions.id, id))
      .returning();
    return result[0] || null;
  }

  async getAllActiveSubscriptions(): Promise<BillingSubscription[]> {
    return await db.select().from(billingSubscriptions)
      .where(eq(billingSubscriptions.status, 'active'))
      .orderBy(desc(billingSubscriptions.createdAt));
  }

  // ==================== BILLING HISTORY OPERATIONS ====================

  async createBillingHistory(data: InsertBillingHistory): Promise<BillingHistory> {
    const result = await db.insert(billingHistory).values(data).returning();
    return result[0];
  }

  async getBillingHistory(id: string): Promise<BillingHistory | null> {
    const result = await db.select().from(billingHistory)
      .where(eq(billingHistory.id, id))
      .limit(1);
    return result[0] || null;
  }

  async getFleetBillingHistory(fleetAccountId: string, limit: number = 50): Promise<BillingHistory[]> {
    return await db.select().from(billingHistory)
      .where(eq(billingHistory.fleetAccountId, fleetAccountId))
      .orderBy(desc(billingHistory.billingDate))
      .limit(limit);
  }

  async getSubscriptionBillingHistory(subscriptionId: string): Promise<BillingHistory[]> {
    return await db.select().from(billingHistory)
      .where(eq(billingHistory.subscriptionId, subscriptionId))
      .orderBy(desc(billingHistory.billingDate));
  }

  async updateBillingHistory(id: string, data: Partial<InsertBillingHistory>): Promise<BillingHistory | null> {
    const result = await db.update(billingHistory)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(billingHistory.id, id))
      .returning();
    return result[0] || null;
  }

  async updateBillingHistoryByStripeInvoice(stripeInvoiceId: string, data: Partial<InsertBillingHistory>): Promise<BillingHistory | null> {
    const result = await db.update(billingHistory)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(billingHistory.stripeInvoiceId, stripeInvoiceId))
      .returning();
    return result[0] || null;
  }

  async getFailedPayments(limit: number = 50): Promise<BillingHistory[]> {
    return await db.select().from(billingHistory)
      .where(
        and(
          eq(billingHistory.status, 'failed'),
          lt(billingHistory.paymentAttempts, 3) // Max 3 retry attempts
        )
      )
      .orderBy(asc(billingHistory.lastPaymentAttempt))
      .limit(limit);
  }

  async getUnpaidInvoices(fleetAccountId?: string): Promise<BillingHistory[]> {
    const conditions = [
      inArray(billingHistory.status, ['pending', 'failed']),
      gt(billingHistory.balanceDue, '0')
    ];
    
    if (fleetAccountId) {
      conditions.push(eq(billingHistory.fleetAccountId, fleetAccountId));
    }
    
    return await db.select().from(billingHistory)
      .where(and(...conditions))
      .orderBy(asc(billingHistory.dueDate));
  }

  // ==================== BILLING USAGE TRACKING OPERATIONS ====================

  async createBillingUsageTracking(data: InsertBillingUsageTracking): Promise<BillingUsageTracking> {
    const result = await db.insert(billingUsageTracking).values(data).returning();
    return result[0];
  }

  async getCurrentBillingUsage(subscriptionId: string): Promise<BillingUsageTracking | null> {
    const now = new Date();
    const result = await db.select().from(billingUsageTracking)
      .where(
        and(
          eq(billingUsageTracking.subscriptionId, subscriptionId),
          lte(billingUsageTracking.periodStart, now),
          gte(billingUsageTracking.periodEnd, now)
        )
      )
      .limit(1);
    return result[0] || null;
  }

  async updateBillingUsage(id: string, data: Partial<InsertBillingUsageTracking>): Promise<BillingUsageTracking | null> {
    const result = await db.update(billingUsageTracking)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(billingUsageTracking.id, id))
      .returning();
    return result[0] || null;
  }

  async incrementUsageCount(
    subscriptionId: string,
    field: 'emergencyRepairsCount' | 'scheduledServicesCount' | 'activeVehiclesCount',
    increment: number = 1
  ): Promise<void> {
    const usage = await this.getCurrentBillingUsage(subscriptionId);
    if (usage) {
      await db.update(billingUsageTracking)
        .set({ 
          [field]: sql`${billingUsageTracking[field]} + ${increment}`,
          updatedAt: new Date()
        })
        .where(eq(billingUsageTracking.id, usage.id));
    }
  }

  async checkUsageAlerts(subscriptionId: string): Promise<{
    percentageUsed: number;
    alert80: boolean;
    alert90: boolean;
    alert100: boolean;
  } | null> {
    const subscription = await db.select().from(billingSubscriptions)
      .where(eq(billingSubscriptions.id, subscriptionId))
      .limit(1);
    
    if (!subscription[0]) return null;
    
    const usage = await this.getCurrentBillingUsage(subscriptionId);
    if (!usage) return null;
    
    const sub = subscription[0];
    let percentageUsed = 0;
    
    // Calculate percentage based on the most constrained resource
    const vehiclePercent = sub.maxVehicles ? (usage.activeVehiclesCount / sub.maxVehicles) * 100 : 0;
    const emergencyPercent = sub.includedEmergencyRepairs ? 
      (usage.emergencyRepairsCount / sub.includedEmergencyRepairs) * 100 : 0;
    const scheduledPercent = sub.includedScheduledServices ? 
      (usage.scheduledServicesCount / sub.includedScheduledServices) * 100 : 0;
    
    percentageUsed = Math.max(vehiclePercent, emergencyPercent, scheduledPercent);
    
    return {
      percentageUsed,
      alert80: percentageUsed >= 80 && !usage.usageAlert80Sent,
      alert90: percentageUsed >= 90 && !usage.usageAlert90Sent,
      alert100: percentageUsed >= 100 && !usage.usageAlert100Sent
    };
  }

  async markUsageAlertSent(id: string, alertLevel: '80' | '90' | '100'): Promise<void> {
    const field = `usageAlert${alertLevel}Sent` as const;
    await db.update(billingUsageTracking)
      .set({ 
        [field]: true,
        updatedAt: new Date()
      })
      .where(eq(billingUsageTracking.id, id));
  }

  async getBillingStatistics(fleetAccountId?: string): Promise<{
    activeSubscriptions: number;
    monthlyRevenue: number;
    annualRevenue: number;
    averageSubscriptionValue: number;
    churnRate: number;
  }> {
    const conditions = [eq(billingSubscriptions.status, 'active')];
    if (fleetAccountId) {
      conditions.push(eq(billingSubscriptions.fleetAccountId, fleetAccountId));
    }

    const active = await db.select({
      count: sql<number>`count(*)`,
      monthlySum: sql<number>`sum(CASE WHEN billing_cycle = 'monthly' THEN base_amount ELSE 0 END)`,
      quarterlySum: sql<number>`sum(CASE WHEN billing_cycle = 'quarterly' THEN base_amount / 3 ELSE 0 END)`,
      annualSum: sql<number>`sum(CASE WHEN billing_cycle = 'annual' THEN base_amount / 12 ELSE 0 END)`
    })
    .from(billingSubscriptions)
    .where(and(...conditions));

    const monthlyRevenue = Number(active[0]?.monthlySum || 0) + 
                          Number(active[0]?.quarterlySum || 0) + 
                          Number(active[0]?.annualSum || 0);
    
    const cancelled = await db.select({
      count: sql<number>`count(*)`
    })
    .from(billingSubscriptions)
    .where(
      and(
        eq(billingSubscriptions.status, 'cancelled'),
        gte(billingSubscriptions.cancelledAt, sql`NOW() - INTERVAL '30 days'`)
      )
    );

    const activeCount = Number(active[0]?.count || 0);
    const cancelledCount = Number(cancelled[0]?.count || 0);
    
    return {
      activeSubscriptions: activeCount,
      monthlyRevenue,
      annualRevenue: monthlyRevenue * 12,
      averageSubscriptionValue: activeCount > 0 ? monthlyRevenue / activeCount : 0,
      churnRate: activeCount > 0 ? (cancelledCount / (activeCount + cancelledCount)) * 100 : 0
    };
  }

  // ==================== SPLIT PAYMENT OPERATIONS ====================

  async createSplitPaymentTemplate(data: InsertSplitPaymentTemplate): Promise<SplitPaymentTemplate> {
    const result = await db.insert(splitPaymentTemplates).values(data).returning();
    return result[0];
  }

  async getSplitPaymentTemplates(activeOnly: boolean = true): Promise<SplitPaymentTemplate[]> {
    const conditions = activeOnly ? [eq(splitPaymentTemplates.isActive, true)] : [];
    return await db.select().from(splitPaymentTemplates)
      .where(and(...conditions))
      .orderBy(desc(splitPaymentTemplates.priority));
  }

  async getDefaultSplitPaymentTemplate(): Promise<SplitPaymentTemplate | null> {
    const result = await db.select().from(splitPaymentTemplates)
      .where(
        and(
          eq(splitPaymentTemplates.isActive, true),
          eq(splitPaymentTemplates.isDefault, true)
        )
      )
      .limit(1);
    return result[0] || null;
  }

  async createSplitPayment(data: InsertSplitPayment): Promise<SplitPayment> {
    const result = await db.insert(splitPayments).values(data).returning();
    return result[0];
  }

  async getSplitPayment(id: string): Promise<SplitPayment | null> {
    const result = await db.select().from(splitPayments)
      .where(eq(splitPayments.id, id))
      .limit(1);
    return result[0] || null;
  }

  async getSplitPaymentByJobId(jobId: string): Promise<SplitPayment | null> {
    const result = await db.select().from(splitPayments)
      .where(eq(splitPayments.jobId, jobId))
      .limit(1);
    return result[0] || null;
  }

  async updateSplitPayment(id: string, data: Partial<InsertSplitPayment>): Promise<SplitPayment | null> {
    const result = await db.update(splitPayments)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(splitPayments.id, id))
      .returning();
    return result[0] || null;
  }

  async createPaymentSplit(data: InsertPaymentSplit): Promise<PaymentSplit> {
    const result = await db.insert(paymentSplits).values(data).returning();
    return result[0];
  }

  async createPaymentSplits(data: InsertPaymentSplit[]): Promise<PaymentSplit[]> {
    const result = await db.insert(paymentSplits).values(data).returning();
    return result;
  }

  async getPaymentSplit(id: string): Promise<PaymentSplit | null> {
    const result = await db.select().from(paymentSplits)
      .where(eq(paymentSplits.id, id))
      .limit(1);
    return result[0] || null;
  }

  async getPaymentSplitByToken(token: string): Promise<PaymentSplit | null> {
    const result = await db.select().from(paymentSplits)
      .where(eq(paymentSplits.paymentToken, token))
      .limit(1);
    return result[0] || null;
  }

  async getPaymentSplitsBySplitPaymentId(splitPaymentId: string): Promise<PaymentSplit[]> {
    return await db.select().from(paymentSplits)
      .where(eq(paymentSplits.splitPaymentId, splitPaymentId))
      .orderBy(asc(paymentSplits.createdAt));
  }

  async getPaymentSplitsByJobId(jobId: string): Promise<PaymentSplit[]> {
    return await db.select().from(paymentSplits)
      .where(eq(paymentSplits.jobId, jobId))
      .orderBy(asc(paymentSplits.createdAt));
  }

  async updatePaymentSplit(id: string, data: Partial<InsertPaymentSplit>): Promise<PaymentSplit | null> {
    const result = await db.update(paymentSplits)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(paymentSplits.id, id))
      .returning();
    return result[0] || null;
  }

  async updatePaymentSplitByToken(token: string, data: Partial<InsertPaymentSplit>): Promise<PaymentSplit | null> {
    const result = await db.update(paymentSplits)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(paymentSplits.paymentToken, token))
      .returning();
    return result[0] || null;
  }

  async markPaymentSplitAsPaid(id: string, transactionId: string, amountPaid: number): Promise<PaymentSplit | null> {
    const result = await db.update(paymentSplits)
      .set({ 
        status: 'paid',
        amountPaid: amountPaid.toString(),
        transactionId,
        paidAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(paymentSplits.id, id))
      .returning();
    
    // Check if all splits for this job are paid
    if (result[0]) {
      await this.checkAndUpdateSplitPaymentStatus(result[0].splitPaymentId);
    }
    
    return result[0] || null;
  }

  async checkAndUpdateSplitPaymentStatus(splitPaymentId: string): Promise<void> {
    const splits = await this.getPaymentSplitsBySplitPaymentId(splitPaymentId);
    
    const allPaid = splits.every(split => split.status === 'paid');
    const anyPaid = splits.some(split => split.status === 'paid');
    const anyFailed = splits.some(split => split.status === 'failed');
    
    let status: 'pending' | 'partial' | 'completed' | 'failed' | 'cancelled' = 'pending';
    let completedAt = null;
    
    if (allPaid) {
      status = 'completed';
      completedAt = new Date();
    } else if (anyPaid) {
      status = 'partial';
    } else if (anyFailed && !anyPaid) {
      status = 'failed';
    }
    
    await db.update(splitPayments)
      .set({ 
        status,
        completedAt,
        updatedAt: new Date()
      })
      .where(eq(splitPayments.id, splitPaymentId));
  }

  async getExpiredPaymentSplits(): Promise<PaymentSplit[]> {
    const now = new Date();
    return await db.select().from(paymentSplits)
      .where(
        and(
          eq(paymentSplits.status, 'pending'),
          lte(paymentSplits.tokenExpiresAt, now)
        )
      )
      .orderBy(asc(paymentSplits.tokenExpiresAt));
  }

  async getPendingPaymentSplits(limit: number = 100): Promise<PaymentSplit[]> {
    return await db.select().from(paymentSplits)
      .where(eq(paymentSplits.status, 'pending'))
      .orderBy(asc(paymentSplits.createdAt))
      .limit(limit);
  }

  async getSplitPaymentStatistics(): Promise<{
    totalSplitPayments: number;
    completedSplitPayments: number;
    partialSplitPayments: number;
    pendingSplitPayments: number;
    averageCollectionTime: number;
    successRate: number;
  }> {
    const stats = await db.select({
      total: sql<number>`count(*)`,
      completed: sql<number>`count(*) filter (where status = 'completed')`,
      partial: sql<number>`count(*) filter (where status = 'partial')`,
      pending: sql<number>`count(*) filter (where status = 'pending')`,
      avgCollectionHours: sql<number>`avg(EXTRACT(EPOCH FROM (completed_at - created_at))/3600) filter (where status = 'completed')`
    })
    .from(splitPayments);

    const result = stats[0];
    const total = Number(result?.total || 0);
    const completed = Number(result?.completed || 0);
    
    return {
      totalSplitPayments: total,
      completedSplitPayments: completed,
      partialSplitPayments: Number(result?.partial || 0),
      pendingSplitPayments: Number(result?.pending || 0),
      averageCollectionTime: Number(result?.avgCollectionHours || 0),
      successRate: total > 0 ? (completed / total) * 100 : 0
    };
  }

  async getSplitPaymentRevenueByPayerType(fromDate: Date, toDate: Date): Promise<Record<string, number>> {
    const result = await db.select({
      payerType: paymentSplits.payerType,
      total: sql<number>`sum(amount_paid)`
    })
    .from(paymentSplits)
    .where(
      and(
        eq(paymentSplits.status, 'paid'),
        gte(paymentSplits.paidAt, fromDate),
        lte(paymentSplits.paidAt, toDate)
      )
    )
    .groupBy(paymentSplits.payerType);

    return result.reduce((acc, row) => {
      if (row.payerType) {
        acc[row.payerType] = Number(row.total || 0);
      }
      return acc;
    }, {} as Record<string, number>);
  }

  // ====================
  // CONTRACT MANAGEMENT
  // ====================

  async createFleetContract(contract: InsertFleetContract): Promise<FleetContract> {
    const contractNumber = `CNT-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    const result = await db.insert(fleetContracts)
      .values({
        ...contract,
        contractNumber,
        status: 'draft'
      })
      .returning();
    return result[0];
  }

  async getFleetContract(id: string): Promise<FleetContract | null> {
    const result = await db.select()
      .from(fleetContracts)
      .where(eq(fleetContracts.id, id))
      .limit(1);
    return result[0] || null;
  }

  async getFleetContracts(filters?: ContractFilterOptions): Promise<FleetContract[]> {
    let query = db.select().from(fleetContracts);

    if (filters) {
      const conditions = [];
      
      if (filters.fleetAccountId) {
        conditions.push(eq(fleetContracts.fleetAccountId, filters.fleetAccountId));
      }
      
      if (filters.status) {
        conditions.push(eq(fleetContracts.status, filters.status));
      }
      
      if (filters.templateType) {
        conditions.push(eq(fleetContracts.templateType, filters.templateType));
      }
      
      if (filters.fromDate) {
        conditions.push(gte(fleetContracts.startDate, filters.fromDate));
      }
      
      if (filters.toDate) {
        conditions.push(lte(fleetContracts.endDate, filters.toDate));
      }
      
      if (filters.expiringDays) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + filters.expiringDays);
        conditions.push(
          and(
            eq(fleetContracts.status, 'active'),
            lte(fleetContracts.endDate, futureDate)
          )
        );
      }
      
      if (filters.priorityLevel) {
        conditions.push(eq(fleetContracts.priorityLevel, filters.priorityLevel));
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
      
      // Apply ordering
      const orderDir = filters.orderDir === 'asc' ? asc : desc;
      if (filters.orderBy === 'startDate') {
        query = query.orderBy(orderDir(fleetContracts.startDate));
      } else if (filters.orderBy === 'endDate') {
        query = query.orderBy(orderDir(fleetContracts.endDate));
      } else if (filters.orderBy === 'contractValue') {
        query = query.orderBy(orderDir(fleetContracts.contractValue));
      } else {
        query = query.orderBy(orderDir(fleetContracts.createdAt));
      }
      
      // Apply pagination
      if (filters.limit) query = query.limit(filters.limit);
      if (filters.offset) query = query.offset(filters.offset);
    }

    return await query;
  }

  async updateFleetContract(id: string, updates: Partial<FleetContract>): Promise<FleetContract | null> {
    const result = await db.update(fleetContracts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(fleetContracts.id, id))
      .returning();
    return result[0] || null;
  }

  async activateContract(id: string, approvedBy: string): Promise<FleetContract | null> {
    const result = await db.update(fleetContracts)
      .set({
        status: 'active',
        approvedBy,
        approvedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(fleetContracts.id, id))
      .returning();
    return result[0] || null;
  }

  async createContractSlaMetric(metric: InsertContractSlaMetric): Promise<ContractSlaMetric> {
    const result = await db.insert(contractSlaMetrics)
      .values(metric)
      .returning();
    return result[0];
  }

  async getContractSlaMetrics(contractId: string): Promise<ContractSlaMetric[]> {
    return await db.select()
      .from(contractSlaMetrics)
      .where(eq(contractSlaMetrics.contractId, contractId))
      .orderBy(asc(contractSlaMetrics.metricType));
  }

  async updateSlaMetricPerformance(
    id: string, 
    currentValue: number, 
    breached: boolean
  ): Promise<ContractSlaMetric | null> {
    const updates: any = {
      currentValue: currentValue.toString(),
      lastMeasuredAt: new Date(),
      updatedAt: new Date()
    };
    
    if (breached) {
      updates.breachCount = sql`${contractSlaMetrics.breachCount} + 1`;
    }
    
    const result = await db.update(contractSlaMetrics)
      .set(updates)
      .where(eq(contractSlaMetrics.id, id))
      .returning();
    
    return result[0] || null;
  }

  async createContractPenalty(penalty: InsertContractPenalty): Promise<ContractPenalty> {
    const result = await db.insert(contractPenalties)
      .values(penalty)
      .returning();
    return result[0];
  }

  async getContractPenalties(contractId: string, filters?: { status?: typeof penaltyStatusEnum.enumValues[number] }): Promise<ContractPenalty[]> {
    let query = db.select()
      .from(contractPenalties)
      .where(eq(contractPenalties.contractId, contractId));
    
    if (filters?.status) {
      query = query.where(
        and(
          eq(contractPenalties.contractId, contractId),
          eq(contractPenalties.status, filters.status)
        )
      );
    }
    
    return await query.orderBy(desc(contractPenalties.penaltyDate));
  }

  async applyPenaltyToInvoice(penaltyId: string, invoiceId: string): Promise<ContractPenalty | null> {
    const result = await db.update(contractPenalties)
      .set({
        status: 'applied',
        appliedToInvoiceId: invoiceId,
        appliedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(contractPenalties.id, penaltyId))
      .returning();
    return result[0] || null;
  }

  async requestPenaltyWaiver(
    penaltyId: string,
    reason: string,
    requestedBy: string
  ): Promise<ContractPenalty | null> {
    const result = await db.update(contractPenalties)
      .set({
        waiverRequested: true,
        waiverReason: reason,
        waiverRequestedBy: requestedBy,
        waiverRequestedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(contractPenalties.id, penaltyId))
      .returning();
    return result[0] || null;
  }

  async createContractAmendment(amendment: InsertContractAmendment): Promise<ContractAmendment> {
    // Get the latest version number for this contract
    const latestAmendment = await db.select({ versionNumber: contractAmendments.versionNumber })
      .from(contractAmendments)
      .where(eq(contractAmendments.contractId, amendment.contractId))
      .orderBy(desc(contractAmendments.versionNumber))
      .limit(1);
    
    const versionNumber = (latestAmendment[0]?.versionNumber || 0) + 1;
    const amendmentNumber = `AMD-${amendment.contractId.substring(0, 8)}-V${versionNumber}`;
    
    const result = await db.insert(contractAmendments)
      .values({
        ...amendment,
        amendmentNumber,
        versionNumber
      })
      .returning();
    
    return result[0];
  }

  async getContractAmendments(contractId: string): Promise<ContractAmendment[]> {
    return await db.select()
      .from(contractAmendments)
      .where(eq(contractAmendments.contractId, contractId))
      .orderBy(desc(contractAmendments.versionNumber));
  }

  async approveAmendment(id: string, approvedBy: string): Promise<ContractAmendment | null> {
    const result = await db.update(contractAmendments)
      .set({
        status: 'approved',
        approvedBy,
        approvedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(contractAmendments.id, id))
      .returning();
    return result[0] || null;
  }

  async recordContractPerformanceMetric(metric: InsertContractPerformanceMetric): Promise<ContractPerformanceMetric> {
    const result = await db.insert(contractPerformanceMetrics)
      .values(metric)
      .returning();
    return result[0];
  }

  async getContractPerformanceMetrics(
    contractId: string,
    filters?: ContractMetricsFilterOptions
  ): Promise<ContractPerformanceMetric[]> {
    let query = db.select()
      .from(contractPerformanceMetrics)
      .where(eq(contractPerformanceMetrics.contractId, contractId));
    
    if (filters) {
      const conditions = [eq(contractPerformanceMetrics.contractId, contractId)];
      
      if (filters.metricType) {
        conditions.push(eq(contractPerformanceMetrics.metricType, filters.metricType));
      }
      
      if (filters.breached !== undefined) {
        conditions.push(eq(contractPerformanceMetrics.breachOccurred, filters.breached));
      }
      
      if (filters.periodStart) {
        conditions.push(gte(contractPerformanceMetrics.periodStart, filters.periodStart));
      }
      
      if (filters.periodEnd) {
        conditions.push(lte(contractPerformanceMetrics.periodEnd, filters.periodEnd));
      }
      
      query = query.where(and(...conditions));
      
      // Apply ordering
      query = query.orderBy(desc(contractPerformanceMetrics.periodStart));
      
      // Apply pagination
      if (filters.limit) query = query.limit(filters.limit);
      if (filters.offset) query = query.offset(filters.offset);
    }
    
    return await query;
  }

  async getContractComplianceRate(contractId: string, fromDate: Date, toDate: Date): Promise<number> {
    const metrics = await this.getContractPerformanceMetrics(contractId, {
      periodStart: fromDate,
      periodEnd: toDate
    });
    
    if (metrics.length === 0) return 100;
    
    const compliantMetrics = metrics.filter(m => !m.breachOccurred);
    return (compliantMetrics.length / metrics.length) * 100;
  }

  async getExpiringContracts(daysAhead: number = 30): Promise<FleetContract[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);
    
    return await db.select()
      .from(fleetContracts)
      .where(
        and(
          eq(fleetContracts.status, 'active'),
          lte(fleetContracts.endDate, futureDate),
          gte(fleetContracts.endDate, new Date())
        )
      )
      .orderBy(asc(fleetContracts.endDate));
  }

  async getContractValueByStatus(): Promise<Record<string, number>> {
    const result = await db.select({
      status: fleetContracts.status,
      total: sql<number>`sum(cast(contract_value as numeric))`
    })
    .from(fleetContracts)
    .groupBy(fleetContracts.status);
    
    return result.reduce((acc, row) => {
      if (row.status) {
        acc[row.status] = Number(row.total || 0);
      }
      return acc;
    }, {} as Record<string, number>);
  }

  async checkSlaBreachForJob(jobId: string): Promise<{
    breached: boolean;
    contractId?: string;
    metricId?: string;
    breachDetails?: any;
  }> {
    // Get the job details
    const job = await this.getJob(jobId);
    if (!job || !job.fleetAccountId) {
      return { breached: false };
    }
    
    // Get active contracts for this fleet
    const contracts = await this.getFleetContracts({
      fleetAccountId: job.fleetAccountId,
      status: 'active'
    });
    
    if (contracts.length === 0) {
      return { breached: false };
    }
    
    // Check each contract's SLA metrics
    for (const contract of contracts) {
      const metrics = await this.getContractSlaMetrics(contract.id);
      
      for (const metric of metrics) {
        if (!metric.isActive) continue;
        
        // Check response time metric
        if (metric.metricType === 'response_time' && job.acceptedAt && job.createdAt) {
          const responseTime = (job.acceptedAt.getTime() - job.createdAt.getTime()) / 60000; // in minutes
          const targetValue = Number(metric.targetValue);
          
          if (responseTime > targetValue) {
            return {
              breached: true,
              contractId: contract.id,
              metricId: metric.id,
              breachDetails: {
                metricType: 'response_time',
                targetValue,
                actualValue: responseTime,
                variance: responseTime - targetValue
              }
            };
          }
        }
        
        // Check resolution time metric
        if (metric.metricType === 'resolution_time' && job.completedAt && job.createdAt) {
          const resolutionTime = (job.completedAt.getTime() - job.createdAt.getTime()) / 3600000; // in hours
          const targetValue = Number(metric.targetValue);
          
          if (resolutionTime > targetValue) {
            return {
              breached: true,
              contractId: contract.id,
              metricId: metric.id,
              breachDetails: {
                metricType: 'resolution_time',
                targetValue,
                actualValue: resolutionTime,
                variance: resolutionTime - targetValue
              }
            };
          }
        }
      }
    }
    
    return { breached: false };
  }
}

// Export the PostgreSQL storage instance
export const storage = new PostgreSQLStorage();