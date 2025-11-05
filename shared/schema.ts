import { sql } from "drizzle-orm";
import { 
  pgTable, 
  varchar, 
  text, 
  timestamp, 
  decimal, 
  integer, 
  boolean, 
  jsonb,
  index,
  primaryKey,
  uniqueIndex,
  pgEnum
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ====================
// ENUMS
// ====================

export const userRoleEnum = pgEnum('user_role', ['driver', 'contractor', 'admin', 'dispatcher', 'fleet_manager']);
export const performanceTierEnum = pgEnum('performance_tier', ['bronze', 'silver', 'gold']);
export const fleetPricingTierEnum = pgEnum('fleet_pricing_tier', ['standard', 'silver', 'gold', 'platinum']);
export const jobTypeEnum = pgEnum('job_type', ['emergency', 'scheduled']);
export const jobStatusEnum = pgEnum('job_status', ['new', 'assigned', 'en_route', 'on_site', 'completed', 'cancelled']);
export const paymentMethodTypeEnum = pgEnum('payment_method_type', ['credit_card', 'efs_check', 'comdata_check', 'fleet_account', 'cash']);
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'processing', 'completed', 'failed', 'refunded']);
export const refundStatusEnum = pgEnum('refund_status', ['requested', 'approved', 'rejected', 'processed']);
export const documentTypeEnum = pgEnum('document_type', ['insurance', 'certification', 'license', 'tax_id', 'compliance']);
export const serviceAreaSurchargeTypeEnum = pgEnum('service_area_surcharge_type', ['distance', 'zone', 'time_based']);

// ====================
// USERS & AUTH
// ====================

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").unique(),
  phone: varchar("phone", { length: 20 }),
  role: userRoleEnum("role").notNull().default('driver'),
  firstName: text("first_name"),
  lastName: text("last_name"),
  password: text("password"),
  isActive: boolean("is_active").notNull().default(true),
  isGuest: boolean("is_guest").notNull().default(false),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at")
}, (table) => ({
  emailIdx: index("idx_users_email").on(table.email),
  phoneIdx: index("idx_users_phone").on(table.phone),
  roleIdx: index("idx_users_role").on(table.role)
}));

export const sessions = pgTable("sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow()
}, (table) => ({
  userIdx: index("idx_sessions_user").on(table.userId),
  tokenIdx: uniqueIndex("idx_sessions_token").on(table.token)
}));

export const driverProfiles = pgTable("driver_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  cdlNumber: varchar("cdl_number", { length: 50 }),
  cdlState: varchar("cdl_state", { length: 2 }),
  carrierName: text("carrier_name"),
  dotNumber: varchar("dot_number", { length: 20 }),
  fleetAccountId: varchar("fleet_account_id").references(() => fleetAccounts.id),
  preferredContactMethod: varchar("preferred_contact_method", { length: 20 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  userIdx: uniqueIndex("idx_driver_profiles_user").on(table.userId),
  fleetIdx: index("idx_driver_profiles_fleet").on(table.fleetAccountId)
}));

export const contractorProfiles = pgTable("contractor_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  companyName: text("company_name"),
  performanceTier: performanceTierEnum("performance_tier").notNull().default('bronze'),
  serviceRadius: integer("service_radius").notNull().default(50),
  averageResponseTime: integer("average_response_time"),
  totalJobsCompleted: integer("total_jobs_completed").notNull().default(0),
  averageRating: decimal("average_rating", { precision: 3, scale: 2 }),
  isFleetCapable: boolean("is_fleet_capable").notNull().default(false),
  hasMobileWaterSource: boolean("has_mobile_water_source").notNull().default(false),
  hasWastewaterRecovery: boolean("has_wastewater_recovery").notNull().default(false),
  isAvailable: boolean("is_available").notNull().default(true),
  currentLocation: jsonb("current_location"),
  lastLocationUpdate: timestamp("last_location_update"),
  stripeAccountId: varchar("stripe_account_id"),
  bankAccountInfo: jsonb("bank_account_info"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  userIdx: uniqueIndex("idx_contractor_profiles_user").on(table.userId),
  tierIdx: index("idx_contractor_profiles_tier").on(table.performanceTier),
  availableIdx: index("idx_contractor_profiles_available").on(table.isAvailable)
}));

// ====================
// FLEET MANAGEMENT
// ====================

export const fleetAccounts = pgTable("fleet_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyName: text("company_name").notNull(),
  dotNumber: varchar("dot_number", { length: 20 }),
  mcNumber: varchar("mc_number", { length: 20 }),
  pricingTier: fleetPricingTierEnum("pricing_tier").notNull().default('standard'),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 2 }),
  zip: varchar("zip", { length: 10 }),
  primaryContactName: text("primary_contact_name"),
  primaryContactPhone: varchar("primary_contact_phone", { length: 20 }),
  primaryContactEmail: text("primary_contact_email"),
  billingEmail: text("billing_email"),
  creditLimit: decimal("credit_limit", { precision: 10, scale: 2 }),
  currentBalance: decimal("current_balance", { precision: 10, scale: 2 }).notNull().default('0'),
  isAutoAuthorized: boolean("is_auto_authorized").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at")
}, (table) => ({
  companyNameIdx: index("idx_fleet_accounts_company").on(table.companyName),
  dotNumberIdx: index("idx_fleet_accounts_dot").on(table.dotNumber),
  tierIdx: index("idx_fleet_accounts_tier").on(table.pricingTier)
}));

export const fleetVehicles = pgTable("fleet_vehicles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fleetAccountId: varchar("fleet_account_id").notNull().references(() => fleetAccounts.id),
  vin: varchar("vin", { length: 17 }),
  unitNumber: varchar("unit_number", { length: 50 }),
  year: integer("year"),
  make: varchar("make", { length: 50 }),
  model: varchar("model", { length: 50 }),
  vehicleType: varchar("vehicle_type", { length: 50 }),
  licensePlate: varchar("license_plate", { length: 20 }),
  currentOdometer: integer("current_odometer"),
  lastServiceDate: timestamp("last_service_date"),
  nextServiceDue: timestamp("next_service_due"),
  isActive: boolean("is_active").notNull().default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  fleetIdx: index("idx_fleet_vehicles_fleet").on(table.fleetAccountId),
  vinIdx: index("idx_fleet_vehicles_vin").on(table.vin),
  unitNumberIdx: index("idx_fleet_vehicles_unit").on(table.unitNumber)
}));

export const fleetContacts = pgTable("fleet_contacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fleetAccountId: varchar("fleet_account_id").notNull().references(() => fleetAccounts.id),
  userId: varchar("user_id").references(() => users.id),
  name: text("name").notNull(),
  title: text("title"),
  phone: varchar("phone", { length: 20 }),
  email: text("email"),
  isAuthorizedToBook: boolean("is_authorized_to_book").notNull().default(true),
  isPrimaryContact: boolean("is_primary_contact").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  fleetIdx: index("idx_fleet_contacts_fleet").on(table.fleetAccountId),
  userIdx: index("idx_fleet_contacts_user").on(table.userId)
}));

export const fleetPricingOverrides = pgTable("fleet_pricing_overrides", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fleetAccountId: varchar("fleet_account_id").notNull().references(() => fleetAccounts.id),
  serviceTypeId: varchar("service_type_id").references(() => serviceTypes.id),
  discountPercentage: decimal("discount_percentage", { precision: 5, scale: 2 }),
  flatRateOverride: decimal("flat_rate_override", { precision: 10, scale: 2 }),
  minimumCharge: decimal("minimum_charge", { precision: 10, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  fleetServiceIdx: index("idx_fleet_pricing_overrides").on(table.fleetAccountId, table.serviceTypeId)
}));

// ====================
// SERVICE CATALOG
// ====================

export const serviceTypes = pgTable("service_types", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: text("name").notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  description: text("description"),
  isEmergency: boolean("is_emergency").notNull().default(false),
  isSchedulable: boolean("is_schedulable").notNull().default(true),
  estimatedDuration: integer("estimated_duration"),
  iconName: varchar("icon_name", { length: 50 }),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  codeIdx: uniqueIndex("idx_service_types_code").on(table.code),
  categoryIdx: index("idx_service_types_category").on(table.category),
  emergencyIdx: index("idx_service_types_emergency").on(table.isEmergency)
}));

export const servicePricing = pgTable("service_pricing", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serviceTypeId: varchar("service_type_id").notNull().references(() => serviceTypes.id),
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
  perMileRate: decimal("per_mile_rate", { precision: 6, scale: 2 }),
  perHourRate: decimal("per_hour_rate", { precision: 8, scale: 2 }),
  emergencySurcharge: decimal("emergency_surcharge", { precision: 8, scale: 2 }),
  nightSurcharge: decimal("night_surcharge", { precision: 8, scale: 2 }),
  weekendSurcharge: decimal("weekend_surcharge", { precision: 8, scale: 2 }),
  waterSourceSurcharge: decimal("water_source_surcharge", { precision: 8, scale: 2 }),
  minimumCharge: decimal("minimum_charge", { precision: 10, scale: 2 }),
  effectiveDate: timestamp("effective_date").notNull().defaultNow(),
  expiryDate: timestamp("expiry_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  serviceIdx: index("idx_service_pricing_service").on(table.serviceTypeId),
  dateIdx: index("idx_service_pricing_dates").on(table.effectiveDate, table.expiryDate)
}));

export const serviceAreas = pgTable("service_areas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: varchar("type", { length: 20 }).notNull(),
  coordinates: jsonb("coordinates").notNull(),
  surchargeType: serviceAreaSurchargeTypeEnum("surcharge_type"),
  surchargeAmount: decimal("surcharge_amount", { precision: 8, scale: 2 }),
  surchargePercentage: decimal("surcharge_percentage", { precision: 5, scale: 2 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  nameIdx: index("idx_service_areas_name").on(table.name),
  typeIdx: index("idx_service_areas_type").on(table.type)
}));

// ====================
// JOB MANAGEMENT
// ====================

export const jobs = pgTable("jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobNumber: varchar("job_number", { length: 20 }).notNull().unique(),
  jobType: jobTypeEnum("job_type").notNull(),
  status: jobStatusEnum("status").notNull().default('new'),
  customerId: varchar("customer_id").references(() => users.id),
  contractorId: varchar("contractor_id").references(() => users.id),
  fleetAccountId: varchar("fleet_account_id").references(() => fleetAccounts.id),
  vehicleId: varchar("vehicle_id").references(() => fleetVehicles.id),
  serviceTypeId: varchar("service_type_id").notNull().references(() => serviceTypes.id),
  
  // Location data
  location: jsonb("location").notNull(),
  locationAddress: text("location_address"),
  locationNotes: text("location_notes"),
  
  // Vehicle info for non-fleet jobs
  vin: varchar("vin", { length: 17 }),
  unitNumber: varchar("unit_number", { length: 50 }),
  vehicleMake: varchar("vehicle_make", { length: 50 }),
  vehicleModel: varchar("vehicle_model", { length: 50 }),
  vehicleYear: integer("vehicle_year"),
  
  // Scheduling
  scheduledAt: timestamp("scheduled_at"),
  assignedAt: timestamp("assigned_at"),
  enRouteAt: timestamp("en_route_at"),
  arrivedAt: timestamp("arrived_at"),
  completedAt: timestamp("completed_at"),
  cancelledAt: timestamp("cancelled_at"),
  
  // Tracking
  estimatedArrival: timestamp("estimated_arrival"),
  contractorLocation: jsonb("contractor_location"),
  contractorLocationUpdatedAt: timestamp("contractor_location_updated_at"),
  
  // Job details
  description: text("description"),
  urgencyLevel: integer("urgency_level").notNull().default(1),
  requiresWaterSource: boolean("requires_water_source").notNull().default(false),
  hasWaterSource: boolean("has_water_source"),
  
  // Pricing
  estimatedPrice: decimal("estimated_price", { precision: 10, scale: 2 }),
  finalPrice: decimal("final_price", { precision: 10, scale: 2 }),
  laborHours: decimal("labor_hours", { precision: 5, scale: 2 }),
  partsTotal: decimal("parts_total", { precision: 10, scale: 2 }),
  surchargeTotal: decimal("surcharge_total", { precision: 10, scale: 2 }),
  taxTotal: decimal("tax_total", { precision: 10, scale: 2 }),
  tipAmount: decimal("tip_amount", { precision: 8, scale: 2 }),
  
  // AI Analysis
  aiDamageAnalysis: jsonb("ai_damage_analysis"),
  aiChatHistory: jsonb("ai_chat_history"),
  
  // Completion
  completionNotes: text("completion_notes"),
  customerSignature: text("customer_signature"),
  rating: integer("rating"),
  reviewText: text("review_text"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  jobNumberIdx: uniqueIndex("idx_jobs_job_number").on(table.jobNumber),
  statusIdx: index("idx_jobs_status").on(table.status),
  customerIdx: index("idx_jobs_customer").on(table.customerId),
  contractorIdx: index("idx_jobs_contractor").on(table.contractorId),
  fleetIdx: index("idx_jobs_fleet").on(table.fleetAccountId),
  typeIdx: index("idx_jobs_type").on(table.jobType),
  createdIdx: index("idx_jobs_created").on(table.createdAt)
}));

export const jobPhotos = pgTable("job_photos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").notNull().references(() => jobs.id),
  uploadedBy: varchar("uploaded_by").notNull().references(() => users.id),
  photoUrl: text("photo_url").notNull(),
  photoType: varchar("photo_type", { length: 20 }).notNull(),
  description: text("description"),
  isBeforePhoto: boolean("is_before_photo").notNull().default(true),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow()
}, (table) => ({
  jobIdx: index("idx_job_photos_job").on(table.jobId)
}));

export const jobMessages = pgTable("job_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").notNull().references(() => jobs.id),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  message: text("message").notNull(),
  isSystemMessage: boolean("is_system_message").notNull().default(false),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").notNull().defaultNow()
}, (table) => ({
  jobIdx: index("idx_job_messages_job").on(table.jobId),
  senderIdx: index("idx_job_messages_sender").on(table.senderId),
  createdIdx: index("idx_job_messages_created").on(table.createdAt)
}));

export const jobStatusHistory = pgTable("job_status_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").notNull().references(() => jobs.id),
  fromStatus: jobStatusEnum("from_status"),
  toStatus: jobStatusEnum("to_status").notNull(),
  changedBy: varchar("changed_by").references(() => users.id),
  reason: text("reason"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow()
}, (table) => ({
  jobIdx: index("idx_job_status_history_job").on(table.jobId),
  createdIdx: index("idx_job_status_history_created").on(table.createdAt)
}));

// ====================
// CONTRACTOR MANAGEMENT
// ====================

export const contractorServices = pgTable("contractor_services", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractorId: varchar("contractor_id").notNull().references(() => users.id),
  serviceTypeId: varchar("service_type_id").notNull().references(() => serviceTypes.id),
  isAvailable: boolean("is_available").notNull().default(true),
  customRate: decimal("custom_rate", { precision: 10, scale: 2 }),
  experienceYears: integer("experience_years"),
  certificationInfo: text("certification_info"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  contractorServiceIdx: index("idx_contractor_services").on(table.contractorId, table.serviceTypeId)
}));

export const contractorAvailability = pgTable("contractor_availability", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractorId: varchar("contractor_id").notNull().references(() => users.id),
  dayOfWeek: integer("day_of_week").notNull(),
  startTime: varchar("start_time", { length: 5 }).notNull(),
  endTime: varchar("end_time", { length: 5 }).notNull(),
  isOnCall: boolean("is_on_call").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  contractorDayIdx: index("idx_contractor_availability").on(table.contractorId, table.dayOfWeek)
}));

export const contractorEarnings = pgTable("contractor_earnings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractorId: varchar("contractor_id").notNull().references(() => users.id),
  jobId: varchar("job_id").references(() => jobs.id),
  earningType: varchar("earning_type", { length: 20 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  isPaid: boolean("is_paid").notNull().default(false),
  paidAt: timestamp("paid_at"),
  payoutBatchId: varchar("payout_batch_id"),
  createdAt: timestamp("created_at").notNull().defaultNow()
}, (table) => ({
  contractorIdx: index("idx_contractor_earnings_contractor").on(table.contractorId),
  jobIdx: index("idx_contractor_earnings_job").on(table.jobId),
  paidIdx: index("idx_contractor_earnings_paid").on(table.isPaid)
}));

export const contractorRatings = pgTable("contractor_ratings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractorId: varchar("contractor_id").notNull().references(() => users.id),
  jobId: varchar("job_id").notNull().references(() => jobs.id),
  customerId: varchar("customer_id").notNull().references(() => users.id),
  rating: integer("rating").notNull(),
  review: text("review"),
  responseTime: integer("response_time"),
  professionalism: integer("professionalism"),
  qualityOfWork: integer("quality_of_work"),
  createdAt: timestamp("created_at").notNull().defaultNow()
}, (table) => ({
  contractorIdx: index("idx_contractor_ratings_contractor").on(table.contractorId),
  jobIdx: index("idx_contractor_ratings_job").on(table.jobId)
}));

export const contractorDocuments = pgTable("contractor_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractorId: varchar("contractor_id").notNull().references(() => users.id),
  documentType: documentTypeEnum("document_type").notNull(),
  documentName: text("document_name").notNull(),
  documentUrl: text("document_url").notNull(),
  expiryDate: timestamp("expiry_date"),
  isVerified: boolean("is_verified").notNull().default(false),
  verifiedBy: varchar("verified_by").references(() => users.id),
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  contractorIdx: index("idx_contractor_documents_contractor").on(table.contractorId),
  typeIdx: index("idx_contractor_documents_type").on(table.documentType),
  expiryIdx: index("idx_contractor_documents_expiry").on(table.expiryDate)
}));

// ====================
// PRICING & PAYMENTS
// ====================

export const pricingRules = pgTable("pricing_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  ruleType: varchar("rule_type", { length: 50 }).notNull(),
  conditions: jsonb("conditions").notNull(),
  multiplier: decimal("multiplier", { precision: 5, scale: 2 }),
  fixedAmount: decimal("fixed_amount", { precision: 10, scale: 2 }),
  priority: integer("priority").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  typeIdx: index("idx_pricing_rules_type").on(table.ruleType),
  activeIdx: index("idx_pricing_rules_active").on(table.isActive),
  priorityIdx: index("idx_pricing_rules_priority").on(table.priority)
}));

export const paymentMethods = pgTable("payment_methods", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: paymentMethodTypeEnum("type").notNull(),
  isDefault: boolean("is_default").notNull().default(false),
  stripePaymentMethodId: varchar("stripe_payment_method_id"),
  last4: varchar("last4", { length: 4 }),
  brand: varchar("brand", { length: 20 }),
  expiryMonth: integer("expiry_month"),
  expiryYear: integer("expiry_year"),
  billingDetails: jsonb("billing_details"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  userIdx: index("idx_payment_methods_user").on(table.userId),
  defaultIdx: index("idx_payment_methods_default").on(table.isDefault)
}));

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").references(() => jobs.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  paymentMethodId: varchar("payment_method_id").references(() => paymentMethods.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default('USD'),
  status: paymentStatusEnum("status").notNull().default('pending'),
  stripeChargeId: varchar("stripe_charge_id"),
  stripePaymentIntentId: varchar("stripe_payment_intent_id"),
  failureReason: text("failure_reason"),
  metadata: jsonb("metadata"),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  jobIdx: index("idx_transactions_job").on(table.jobId),
  userIdx: index("idx_transactions_user").on(table.userId),
  statusIdx: index("idx_transactions_status").on(table.status)
}));

export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceNumber: varchar("invoice_number", { length: 20 }).notNull().unique(),
  jobId: varchar("job_id").references(() => jobs.id),
  customerId: varchar("customer_id").notNull().references(() => users.id),
  fleetAccountId: varchar("fleet_account_id").references(() => fleetAccounts.id),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).notNull().default('0'),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }).notNull().default('0'),
  dueDate: timestamp("due_date"),
  paidAt: timestamp("paid_at"),
  lineItems: jsonb("line_items").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  invoiceNumberIdx: uniqueIndex("idx_invoices_number").on(table.invoiceNumber),
  jobIdx: index("idx_invoices_job").on(table.jobId),
  customerIdx: index("idx_invoices_customer").on(table.customerId),
  fleetIdx: index("idx_invoices_fleet").on(table.fleetAccountId)
}));

export const refunds = pgTable("refunds", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  transactionId: varchar("transaction_id").notNull().references(() => transactions.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  reason: text("reason").notNull(),
  status: refundStatusEnum("status").notNull().default('requested'),
  stripeRefundId: varchar("stripe_refund_id"),
  processedBy: varchar("processed_by").references(() => users.id),
  processedAt: timestamp("processed_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  transactionIdx: index("idx_refunds_transaction").on(table.transactionId),
  statusIdx: index("idx_refunds_status").on(table.status)
}));

// ====================
// ADMIN CONFIGURATION
// ====================

export const adminSettings = pgTable("admin_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: jsonb("value").notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  description: text("description"),
  isSecret: boolean("is_secret").notNull().default(false),
  updatedBy: varchar("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  keyIdx: uniqueIndex("idx_admin_settings_key").on(table.key),
  categoryIdx: index("idx_admin_settings_category").on(table.category)
}));

export const emailTemplates = pgTable("email_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  bodyHtml: text("body_html").notNull(),
  bodyText: text("body_text"),
  variables: jsonb("variables"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  codeIdx: uniqueIndex("idx_email_templates_code").on(table.code)
}));

export const smsTemplates = pgTable("sms_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: text("name").notNull(),
  message: text("message").notNull(),
  variables: jsonb("variables"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  codeIdx: uniqueIndex("idx_sms_templates_code").on(table.code)
}));

export const integrationsConfig = pgTable("integrations_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  service: varchar("service", { length: 50 }).notNull().unique(),
  config: jsonb("config").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  testMode: boolean("test_mode").notNull().default(false),
  lastTestAt: timestamp("last_test_at"),
  lastTestResult: jsonb("last_test_result"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  serviceIdx: uniqueIndex("idx_integrations_config_service").on(table.service)
}));

export const referralPrograms = pgTable("referral_programs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  referrerReward: decimal("referrer_reward", { precision: 10, scale: 2 }),
  referredReward: decimal("referred_reward", { precision: 10, scale: 2 }),
  referrerRewardType: varchar("referrer_reward_type", { length: 20 }),
  referredRewardType: varchar("referred_reward_type", { length: 20 }),
  maxUses: integer("max_uses"),
  usedCount: integer("used_count").notNull().default(0),
  validFrom: timestamp("valid_from"),
  validUntil: timestamp("valid_until"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  codeIdx: uniqueIndex("idx_referral_programs_code").on(table.code),
  activeIdx: index("idx_referral_programs_active").on(table.isActive)
}));

export const surgePricing = pgTable("surge_pricing", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  multiplier: decimal("multiplier", { precision: 5, scale: 2 }).notNull(),
  conditions: jsonb("conditions").notNull(),
  triggerType: varchar("trigger_type", { length: 50 }).notNull(),
  isActive: boolean("is_active").notNull().default(false),
  activatedAt: timestamp("activated_at"),
  deactivatedAt: timestamp("deactivated_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  activeIdx: index("idx_surge_pricing_active").on(table.isActive),
  typeIdx: index("idx_surge_pricing_type").on(table.triggerType)
}));

// ====================
// ANALYTICS
// ====================

export const platformMetrics = pgTable("platform_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  metricDate: timestamp("metric_date").notNull(),
  metricType: varchar("metric_type", { length: 50 }).notNull(),
  metricValue: decimal("metric_value", { precision: 15, scale: 2 }).notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow()
}, (table) => ({
  dateTypeIdx: index("idx_platform_metrics").on(table.metricDate, table.metricType)
}));

export const contractorPerformance = pgTable("contractor_performance", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractorId: varchar("contractor_id").notNull().references(() => users.id),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  totalJobs: integer("total_jobs").notNull().default(0),
  completedJobs: integer("completed_jobs").notNull().default(0),
  cancelledJobs: integer("cancelled_jobs").notNull().default(0),
  averageResponseTime: integer("average_response_time"),
  averageCompletionTime: integer("average_completion_time"),
  averageRating: decimal("average_rating", { precision: 3, scale: 2 }),
  totalRevenue: decimal("total_revenue", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").notNull().defaultNow()
}, (table) => ({
  contractorPeriodIdx: index("idx_contractor_performance").on(table.contractorId, table.periodStart)
}));

export const revenueReports = pgTable("revenue_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reportDate: timestamp("report_date").notNull(),
  reportType: varchar("report_type", { length: 50 }).notNull(),
  grossRevenue: decimal("gross_revenue", { precision: 12, scale: 2 }).notNull(),
  netRevenue: decimal("net_revenue", { precision: 12, scale: 2 }).notNull(),
  transactionFees: decimal("transaction_fees", { precision: 10, scale: 2 }).notNull(),
  refundTotal: decimal("refund_total", { precision: 10, scale: 2 }).notNull(),
  contractorPayouts: decimal("contractor_payouts", { precision: 12, scale: 2 }).notNull(),
  breakdown: jsonb("breakdown"),
  createdAt: timestamp("created_at").notNull().defaultNow()
}, (table) => ({
  dateTypeIdx: index("idx_revenue_reports").on(table.reportDate, table.reportType)
}));

// ====================
// INSERT SCHEMAS & TYPES
// ====================

// Users & Auth
export const insertUserSchema = createInsertSchema(users).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true, 
  deletedAt: true 
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const insertSessionSchema = createInsertSchema(sessions).omit({ 
  id: true, 
  createdAt: true 
});
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessions.$inferSelect;

export const insertDriverProfileSchema = createInsertSchema(driverProfiles).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export type InsertDriverProfile = z.infer<typeof insertDriverProfileSchema>;
export type DriverProfile = typeof driverProfiles.$inferSelect;

export const insertContractorProfileSchema = createInsertSchema(contractorProfiles).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export type InsertContractorProfile = z.infer<typeof insertContractorProfileSchema>;
export type ContractorProfile = typeof contractorProfiles.$inferSelect;

// Fleet Management
export const insertFleetAccountSchema = createInsertSchema(fleetAccounts).omit({ 
  id: true, 
  currentBalance: true,
  createdAt: true, 
  updatedAt: true, 
  deletedAt: true 
});
export type InsertFleetAccount = z.infer<typeof insertFleetAccountSchema>;
export type FleetAccount = typeof fleetAccounts.$inferSelect;

export const insertFleetVehicleSchema = createInsertSchema(fleetVehicles).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export type InsertFleetVehicle = z.infer<typeof insertFleetVehicleSchema>;
export type FleetVehicle = typeof fleetVehicles.$inferSelect;

export const insertFleetContactSchema = createInsertSchema(fleetContacts).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export type InsertFleetContact = z.infer<typeof insertFleetContactSchema>;
export type FleetContact = typeof fleetContacts.$inferSelect;

export const insertFleetPricingOverrideSchema = createInsertSchema(fleetPricingOverrides).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export type InsertFleetPricingOverride = z.infer<typeof insertFleetPricingOverrideSchema>;
export type FleetPricingOverride = typeof fleetPricingOverrides.$inferSelect;

// Service Catalog
export const insertServiceTypeSchema = createInsertSchema(serviceTypes).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export type InsertServiceType = z.infer<typeof insertServiceTypeSchema>;
export type ServiceType = typeof serviceTypes.$inferSelect;

export const insertServicePricingSchema = createInsertSchema(servicePricing).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export type InsertServicePricing = z.infer<typeof insertServicePricingSchema>;
export type ServicePricing = typeof servicePricing.$inferSelect;

export const insertServiceAreaSchema = createInsertSchema(serviceAreas).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export type InsertServiceArea = z.infer<typeof insertServiceAreaSchema>;
export type ServiceArea = typeof serviceAreas.$inferSelect;

// Job Management
export const insertJobSchema = createInsertSchema(jobs).omit({ 
  id: true, 
  jobNumber: true,
  status: true,
  createdAt: true, 
  updatedAt: true 
});
export type InsertJob = z.infer<typeof insertJobSchema>;
export type Job = typeof jobs.$inferSelect;

export const insertJobPhotoSchema = createInsertSchema(jobPhotos).omit({ 
  id: true, 
  createdAt: true 
});
export type InsertJobPhoto = z.infer<typeof insertJobPhotoSchema>;
export type JobPhoto = typeof jobPhotos.$inferSelect;

export const insertJobMessageSchema = createInsertSchema(jobMessages).omit({ 
  id: true, 
  createdAt: true 
});
export type InsertJobMessage = z.infer<typeof insertJobMessageSchema>;
export type JobMessage = typeof jobMessages.$inferSelect;

export const insertJobStatusHistorySchema = createInsertSchema(jobStatusHistory).omit({ 
  id: true, 
  createdAt: true 
});
export type InsertJobStatusHistory = z.infer<typeof insertJobStatusHistorySchema>;
export type JobStatusHistory = typeof jobStatusHistory.$inferSelect;

// Contractor Management
export const insertContractorServiceSchema = createInsertSchema(contractorServices).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export type InsertContractorService = z.infer<typeof insertContractorServiceSchema>;
export type ContractorService = typeof contractorServices.$inferSelect;

export const insertContractorAvailabilitySchema = createInsertSchema(contractorAvailability).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export type InsertContractorAvailability = z.infer<typeof insertContractorAvailabilitySchema>;
export type ContractorAvailability = typeof contractorAvailability.$inferSelect;

export const insertContractorEarningsSchema = createInsertSchema(contractorEarnings).omit({ 
  id: true, 
  createdAt: true 
});
export type InsertContractorEarnings = z.infer<typeof insertContractorEarningsSchema>;
export type ContractorEarnings = typeof contractorEarnings.$inferSelect;

export const insertContractorRatingSchema = createInsertSchema(contractorRatings).omit({ 
  id: true, 
  createdAt: true 
});
export type InsertContractorRating = z.infer<typeof insertContractorRatingSchema>;
export type ContractorRating = typeof contractorRatings.$inferSelect;

export const insertContractorDocumentSchema = createInsertSchema(contractorDocuments).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export type InsertContractorDocument = z.infer<typeof insertContractorDocumentSchema>;
export type ContractorDocument = typeof contractorDocuments.$inferSelect;

// Pricing & Payments
export const insertPricingRuleSchema = createInsertSchema(pricingRules).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export type InsertPricingRule = z.infer<typeof insertPricingRuleSchema>;
export type PricingRule = typeof pricingRules.$inferSelect;

export const insertPaymentMethodSchema = createInsertSchema(paymentMethods).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export type InsertPaymentMethod = z.infer<typeof insertPaymentMethodSchema>;
export type PaymentMethod = typeof paymentMethods.$inferSelect;

export const insertTransactionSchema = createInsertSchema(transactions).omit({ 
  id: true, 
  status: true,
  currency: true,
  createdAt: true, 
  updatedAt: true 
});
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

export const insertInvoiceSchema = createInsertSchema(invoices).omit({ 
  id: true, 
  invoiceNumber: true,
  paidAmount: true,
  taxAmount: true,
  createdAt: true, 
  updatedAt: true 
});
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;

export const insertRefundSchema = createInsertSchema(refunds).omit({ 
  id: true, 
  status: true,
  createdAt: true, 
  updatedAt: true 
});
export type InsertRefund = z.infer<typeof insertRefundSchema>;
export type Refund = typeof refunds.$inferSelect;

// Admin Configuration
export const insertAdminSettingSchema = createInsertSchema(adminSettings).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export type InsertAdminSetting = z.infer<typeof insertAdminSettingSchema>;
export type AdminSetting = typeof adminSettings.$inferSelect;

export const insertEmailTemplateSchema = createInsertSchema(emailTemplates).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;
export type EmailTemplate = typeof emailTemplates.$inferSelect;

export const insertSmsTemplateSchema = createInsertSchema(smsTemplates).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export type InsertSmsTemplate = z.infer<typeof insertSmsTemplateSchema>;
export type SmsTemplate = typeof smsTemplates.$inferSelect;

export const insertIntegrationsConfigSchema = createInsertSchema(integrationsConfig).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export type InsertIntegrationsConfig = z.infer<typeof insertIntegrationsConfigSchema>;
export type IntegrationsConfig = typeof integrationsConfig.$inferSelect;

export const insertReferralProgramSchema = createInsertSchema(referralPrograms).omit({ 
  id: true, 
  usedCount: true,
  createdAt: true, 
  updatedAt: true 
});
export type InsertReferralProgram = z.infer<typeof insertReferralProgramSchema>;
export type ReferralProgram = typeof referralPrograms.$inferSelect;

export const insertSurgePricingSchema = createInsertSchema(surgePricing).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export type InsertSurgePricing = z.infer<typeof insertSurgePricingSchema>;
export type SurgePricing = typeof surgePricing.$inferSelect;

// Analytics
export const insertPlatformMetricSchema = createInsertSchema(platformMetrics).omit({ 
  id: true, 
  createdAt: true 
});
export type InsertPlatformMetric = z.infer<typeof insertPlatformMetricSchema>;
export type PlatformMetric = typeof platformMetrics.$inferSelect;

export const insertContractorPerformanceSchema = createInsertSchema(contractorPerformance).omit({ 
  id: true, 
  createdAt: true 
});
export type InsertContractorPerformance = z.infer<typeof insertContractorPerformanceSchema>;
export type ContractorPerformance = typeof contractorPerformance.$inferSelect;

export const insertRevenueReportSchema = createInsertSchema(revenueReports).omit({ 
  id: true, 
  createdAt: true 
});
export type InsertRevenueReport = z.infer<typeof insertRevenueReportSchema>;
export type RevenueReport = typeof revenueReports.$inferSelect;
