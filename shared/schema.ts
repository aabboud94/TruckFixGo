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
export const driverApprovalStatusEnum = pgEnum('driver_approval_status', ['pending', 'approved', 'rejected']);
export const jobTypeEnum = pgEnum('job_type', ['emergency', 'scheduled']);
export const jobStatusEnum = pgEnum('job_status', ['new', 'assigned', 'en_route', 'on_site', 'completed', 'cancelled']);
export const jobAssignmentMethodEnum = pgEnum('job_assignment_method', ['round_robin', 'manual', 'ai_dispatch']);
export const paymentMethodTypeEnum = pgEnum('payment_method_type', ['credit_card', 'efs_check', 'comdata_check', 'fleet_account', 'cash']);
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'processing', 'completed', 'failed', 'refunded']);
export const refundStatusEnum = pgEnum('refund_status', ['requested', 'approved', 'rejected', 'processed']);
export const documentTypeEnum = pgEnum('document_type', ['insurance', 'certification', 'license', 'tax_id', 'compliance']);
export const serviceAreaSurchargeTypeEnum = pgEnum('service_area_surcharge_type', ['distance', 'zone', 'time_based']);
export const reminderTypeEnum = pgEnum('reminder_type', ['sms', 'email', 'both']);
export const reminderStatusEnum = pgEnum('reminder_status', ['pending', 'queued', 'sent', 'delivered', 'failed', 'cancelled']);
export const reminderTimingEnum = pgEnum('reminder_timing', ['24hr_before', '12hr_before', '1hr_before', 'on_completion', 'invoice_delivery', 'payment_reminder']);
export const communicationChannelEnum = pgEnum('communication_channel', ['sms', 'email', 'both', 'none']);
export const applicationStatusEnum = pgEnum('application_status', ['draft', 'pending', 'under_review', 'approved', 'rejected', 'withdrawn']);
export const documentVerificationStatusEnum = pgEnum('document_verification_status', ['pending', 'verified', 'rejected', 'expired']);
export const applicationDocumentTypeEnum = pgEnum('application_document_type', ['cdl', 'insurance', 'w9', 'vehicle_registration', 'dot_medical', 'ase_certification', 'other_certification', 'reference_letter', 'portfolio_photo']);
export const backgroundCheckStatusEnum = pgEnum('background_check_status', ['pending', 'in_progress', 'passed', 'failed', 'expired']);
export const backgroundCheckTypeEnum = pgEnum('background_check_type', ['criminal', 'driving_record', 'business_verification', 'insurance_validation']);
export const bidStatusEnum = pgEnum('bid_status', ['pending', 'accepted', 'rejected', 'expired', 'withdrawn', 'countered']);
export const biddingStrategyEnum = pgEnum('bidding_strategy', ['lowest_price', 'best_value', 'fastest_completion', 'manual']);
export const bidAutoAcceptEnum = pgEnum('bid_auto_accept', ['never', 'lowest', 'lowest_with_rating', 'best_value']);
export const checkProviderEnum = pgEnum('check_provider', ['efs', 'comdata']);
export const checkStatusEnum = pgEnum('check_status', ['pending', 'authorized', 'captured', 'declined', 'voided', 'expired', 'partially_captured']);
export const billingCycleEnum = pgEnum('billing_cycle', ['monthly', 'quarterly', 'annual']);
export const subscriptionStatusEnum = pgEnum('subscription_status', ['active', 'paused', 'cancelled', 'expired', 'pending_cancellation']);
export const billingHistoryStatusEnum = pgEnum('billing_history_status', ['success', 'failed', 'pending', 'processing', 'retrying']);
export const planTypeEnum = pgEnum('plan_type', ['basic', 'standard', 'enterprise', 'custom']);

// Invoice related enums
export const invoiceStatusEnum = pgEnum('invoice_status', ['draft', 'pending', 'sent', 'paid', 'overdue', 'cancelled']);
export const invoiceDefaultTypeEnum = pgEnum('invoice_default_type', ['fee', 'tax', 'surcharge']);
export const invoiceLineItemTypeEnum = pgEnum('invoice_line_item_type', ['part', 'labor', 'fee', 'tax', 'other']);

// Tracking related enums
export const trackingStatusEnum = pgEnum('tracking_status', ['active', 'paused', 'completed', 'disabled']);
export const geofenceEventTypeEnum = pgEnum('geofence_event_type', ['arrived', 'departed', 'entered_zone', 'exited_zone']);
export const trackingUpdateFrequencyEnum = pgEnum('tracking_update_frequency', ['high', 'normal', 'low', 'stationary']);

// PM Scheduling related enums
export const pmScheduleFrequencyEnum = pgEnum('pm_schedule_frequency', ['weekly', 'monthly', 'quarterly', 'annually']);
export const pmScheduleStatusEnum = pgEnum('pm_schedule_status', ['active', 'paused', 'cancelled']);

// Notification related enums
export const notificationTypeEnum = pgEnum('notification_type', ['job_update', 'payment', 'system', 'bid_received', 'fleet_update', 'maintenance', 'alert']);
export const notificationPriorityEnum = pgEnum('notification_priority', ['low', 'medium', 'high', 'urgent']);

// Route management related enums
export const routeOptimizationStrategyEnum = pgEnum('route_optimization_strategy', ['shortest', 'fastest', 'most_profitable']);
export const routeStatusEnum = pgEnum('route_status', ['planned', 'active', 'completed', 'cancelled']);
export const routeStopTypeEnum = pgEnum('route_stop_type', ['pickup', 'dropoff', 'service']);
export const routeStopStatusEnum = pgEnum('route_stop_status', ['pending', 'arrived', 'in_progress', 'completed', 'skipped']);

// Parts inventory related enums
export const partsTransactionTypeEnum = pgEnum('parts_transaction_type', ['used', 'returned', 'restocked', 'damaged', 'expired', 'adjustment', 'initial_stock']);
export const partsOrderStatusEnum = pgEnum('parts_order_status', ['pending', 'ordered', 'shipped', 'delivered', 'cancelled', 'returned']);
export const partsCategoryEnum = pgEnum('parts_category', ['engine', 'transmission', 'brakes', 'electrical', 'suspension', 'body', 'hvac', 'tires', 'fluids', 'filters', 'belts_hoses', 'lighting', 'exhaust', 'accessories', 'tools', 'safety', 'other']);

// Maintenance prediction related enums
export const maintenanceRiskLevelEnum = pgEnum('maintenance_risk_level', ['low', 'medium', 'high', 'critical']);
export const maintenanceAlertTypeEnum = pgEnum('maintenance_alert_type', ['predictive', 'scheduled', 'critical', 'overdue', 'safety', 'warranty']);
export const maintenanceSeverityEnum = pgEnum('maintenance_severity', ['info', 'warning', 'urgent', 'critical']);

// Weather related enums
export const weatherConditionsEnum = pgEnum('weather_conditions', ['clear', 'partly_cloudy', 'cloudy', 'overcast', 'light_rain', 'moderate_rain', 'heavy_rain', 'drizzle', 'thunderstorm', 'light_snow', 'moderate_snow', 'heavy_snow', 'sleet', 'hail', 'fog', 'mist', 'dust', 'smoke', 'tornado', 'hurricane']);
export const weatherAlertTypeEnum = pgEnum('weather_alert_type', ['wind', 'rain', 'snow', 'ice', 'thunderstorm', 'tornado', 'hurricane', 'flood', 'heat', 'cold', 'fog', 'dust_storm', 'air_quality']);
export const weatherAlertSeverityEnum = pgEnum('weather_alert_severity', ['advisory', 'watch', 'warning', 'emergency']);
export const weatherImpactLevelEnum = pgEnum('weather_impact_level', ['none', 'low', 'moderate', 'high', 'severe', 'extreme']);

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

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  token: text("token").notNull().unique(),
  email: text("email").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").notNull().defaultNow()
}, (table) => ({
  userIdx: index("idx_password_reset_tokens_user").on(table.userId),
  tokenIdx: uniqueIndex("idx_password_reset_tokens_token").on(table.token),
  emailIdx: index("idx_password_reset_tokens_email").on(table.email)
}));

export const driverProfiles = pgTable("driver_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  cdlNumber: varchar("cdl_number", { length: 50 }),
  cdlState: varchar("cdl_state", { length: 2 }),
  carrierName: text("carrier_name"),
  dotNumber: varchar("dot_number", { length: 20 }),
  fleetAccountId: varchar("fleet_account_id").references(() => fleetAccounts.id),
  managedByContractorId: varchar("managed_by_contractor_id").references(() => users.id), // Contractor who manages this driver
  preferredContactMethod: varchar("preferred_contact_method", { length: 20 }),
  
  // Driver approval fields
  approvalStatus: driverApprovalStatusEnum("approval_status").notNull().default('pending'),
  approvedAt: timestamp("approved_at"),
  rejectedAt: timestamp("rejected_at"),
  approvedBy: varchar("approved_by", { length: 255 }),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  userIdx: uniqueIndex("idx_driver_profiles_user").on(table.userId),
  fleetIdx: index("idx_driver_profiles_fleet").on(table.fleetAccountId),
  contractorIdx: index("idx_driver_profiles_contractor").on(table.managedByContractorId),
  approvalStatusIdx: index("idx_driver_profiles_approval_status").on(table.approvalStatus)
}));

export const contractorProfiles = pgTable("contractor_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  companyName: text("company_name"),
  performanceTier: performanceTierEnum("performance_tier").notNull().default('bronze'),
  serviceRadius: integer("service_radius").notNull().default(50),
  averageResponseTime: integer("average_response_time"),
  totalJobsCompleted: integer("total_jobs_completed").notNull().default(0),
  
  // Rating aggregates
  averageRating: decimal("average_rating", { precision: 3, scale: 2 }),
  totalReviews: integer("total_reviews").notNull().default(0),
  fiveStarCount: integer("five_star_count").notNull().default(0),
  fourStarCount: integer("four_star_count").notNull().default(0),
  threeStarCount: integer("three_star_count").notNull().default(0),
  twoStarCount: integer("two_star_count").notNull().default(0),
  oneStarCount: integer("one_star_count").notNull().default(0),
  
  // Category rating averages
  averageTimelinessRating: decimal("average_timeliness_rating", { precision: 3, scale: 2 }),
  averageProfessionalismRating: decimal("average_professionalism_rating", { precision: 3, scale: 2 }),
  averageQualityRating: decimal("average_quality_rating", { precision: 3, scale: 2 }),
  averageValueRating: decimal("average_value_rating", { precision: 3, scale: 2 }),
  
  // Performance metrics
  onTimeArrivalRate: decimal("on_time_arrival_rate", { precision: 5, scale: 2 }), // Percentage
  jobCompletionRate: decimal("job_completion_rate", { precision: 5, scale: 2 }), // Percentage
  responseRate: decimal("response_rate", { precision: 5, scale: 2 }), // Percentage of reviews responded to
  customerSatisfactionScore: decimal("customer_satisfaction_score", { precision: 5, scale: 2 }), // CSAT
  netPromoterScore: integer("net_promoter_score"), // NPS (-100 to 100)
  lastRatingUpdate: timestamp("last_rating_update"),
  
  // Badges and status
  isVerifiedContractor: boolean("is_verified_contractor").notNull().default(false),
  isFeaturedContractor: boolean("is_featured_contractor").notNull().default(false),
  profileCompleteness: integer("profile_completeness").notNull().default(0), // 0-100
  
  isFleetCapable: boolean("is_fleet_capable").notNull().default(false),
  hasMobileWaterSource: boolean("has_mobile_water_source").notNull().default(false),
  hasWastewaterRecovery: boolean("has_wastewater_recovery").notNull().default(false),
  isAvailable: boolean("is_available").notNull().default(true),
  currentLocation: jsonb("current_location"),
  lastLocationUpdate: timestamp("last_location_update"),
  stripeAccountId: varchar("stripe_account_id"),
  bankAccountInfo: jsonb("bank_account_info"),
  
  // Assignment tracking for round-robin
  lastAssignedAt: timestamp("last_assigned_at"),
  isOnline: boolean("is_online").notNull().default(false),
  lastHeartbeatAt: timestamp("last_heartbeat_at"),
  baseLocationLat: decimal("base_location_lat", { precision: 10, scale: 8 }),
  baseLocationLon: decimal("base_location_lon", { precision: 11, scale: 8 }),
  
  // AI-enhanced fields for intelligent dispatch
  specializations: text("specializations").array().default(sql`ARRAY[]::text[]`), // Array of specializations like ['engine_repair', 'transmission', 'electrical', 'brakes', 'tires', 'refrigeration']
  
  certificationScores: jsonb("certification_scores"), // {
    // ase_master: { score: 95, expiry: "2025-12-31" },
    // dot_inspector: { score: 88, expiry: "2024-06-30" },
    // epa_608: { score: 92, expiry: "2026-03-15" },
    // hazmat: { score: 85, expiry: "2024-11-30" }
  // }
  
  languageSkills: text("language_skills").array().default(sql`ARRAY['English']::text[]`), // ['English', 'Spanish', 'French']
  
  // Performance patterns for AI analysis
  timeOfDayPerformance: jsonb("time_of_day_performance"), // { morning: 0.95, afternoon: 0.88, evening: 0.92, night: 0.85 }
  weatherPerformance: jsonb("weather_performance"), // { clear: 0.92, rain: 0.88, snow: 0.75, extreme_heat: 0.85 }
  jobComplexityHandling: jsonb("job_complexity_handling"), // { simple: 0.98, moderate: 0.92, complex: 0.85, emergency: 0.90 }
  
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

// PM Schedule Table
export const pmSchedules = pgTable("pm_schedules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fleetAccountId: varchar("fleet_account_id").notNull().references(() => fleetAccounts.id),
  vehicleId: varchar("vehicle_id").notNull().references(() => fleetVehicles.id),
  serviceType: varchar("service_type", { length: 100 }).notNull(),
  frequency: pmScheduleFrequencyEnum("frequency").notNull(),
  nextServiceDate: timestamp("next_service_date").notNull(),
  lastServiceDate: timestamp("last_service_date"),
  isActive: boolean("is_active").notNull().default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  fleetIdx: index("idx_pm_schedules_fleet").on(table.fleetAccountId),
  vehicleIdx: index("idx_pm_schedules_vehicle").on(table.vehicleId),
  nextServiceIdx: index("idx_pm_schedules_next_service").on(table.nextServiceDate),
  activeIdx: index("idx_pm_schedules_active").on(table.isActive)
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

// Fleet Applications (for companies applying to become fleet accounts)
export const fleetApplications = pgTable("fleet_applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Status
  status: applicationStatusEnum("status").notNull().default('pending'),
  
  // Company Information
  companyName: text("company_name").notNull(),
  dotNumber: varchar("dot_number", { length: 20 }),
  mcNumber: varchar("mc_number", { length: 20 }),
  taxId: varchar("tax_id", { length: 20 }),
  businessType: varchar("business_type", { length: 50 }), // llc, corporation, partnership
  
  // Address
  address: text("address").notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  state: varchar("state", { length: 2 }).notNull(),
  zip: varchar("zip", { length: 10 }).notNull(),
  
  // Fleet Information  
  fleetSize: integer("fleet_size").notNull(),
  vehicleTypes: text("vehicle_types").array().default(sql`ARRAY[]::text[]`),
  averageMonthlyServices: integer("average_monthly_services"),
  primaryServiceNeeds: text("primary_service_needs").array().default(sql`ARRAY[]::text[]`),
  
  // Primary Contact
  primaryContactName: text("primary_contact_name").notNull(),
  primaryContactTitle: text("primary_contact_title"),
  primaryContactPhone: varchar("primary_contact_phone", { length: 20 }).notNull(),
  primaryContactEmail: text("primary_contact_email").notNull(),
  
  // Billing Contact
  billingContactName: text("billing_contact_name"),
  billingContactPhone: varchar("billing_contact_phone", { length: 20 }),
  billingContactEmail: text("billing_contact_email"),
  
  // Business Details
  yearsInBusiness: integer("years_in_business"),
  currentServiceProvider: text("current_service_provider"),
  reasonForSwitching: text("reason_for_switching"),
  
  // Financial Information
  requestedCreditLimit: decimal("requested_credit_limit", { precision: 10, scale: 2 }),
  paymentTerms: varchar("payment_terms", { length: 50 }), // net_30, net_60, prepaid
  preferredBillingCycle: varchar("preferred_billing_cycle", { length: 20 }), // weekly, biweekly, monthly
  
  // Insurance
  insuranceProvider: text("insurance_provider"),
  insurancePolicyNumber: varchar("insurance_policy_number", { length: 100 }),
  insuranceExpiryDate: timestamp("insurance_expiry_date"),
  
  // Service Requirements
  requires24HourService: boolean("requires_24_hour_service").default(false),
  requiresPriorityResponse: boolean("requires_priority_response").default(false),
  additionalRequirements: text("additional_requirements"),
  
  // Consents
  termsAccepted: boolean("terms_accepted").notNull().default(false),
  dataProcessingConsent: boolean("data_processing_consent").notNull().default(false),
  creditCheckConsent: boolean("credit_check_consent").default(false),
  
  // Review
  reviewNotes: text("review_notes"),
  rejectionReason: text("rejection_reason"),
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  
  // Timestamps
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  emailIdx: index("idx_fleet_applications_email").on(table.primaryContactEmail),
  statusIdx: index("idx_fleet_applications_status").on(table.status),
  companyIdx: index("idx_fleet_applications_company").on(table.companyName),
  dotIdx: index("idx_fleet_applications_dot").on(table.dotNumber),
  submittedIdx: index("idx_fleet_applications_submitted").on(table.submittedAt)
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

// Note: serviceAreas table is defined later in this file with city-focused structure

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
  
  // Guest customer info (when customerId is null)
  customerName: text("customer_name"),
  customerPhone: varchar("customer_phone", { length: 20 }),
  
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
  
  // Bidding fields
  allowBidding: boolean("allow_bidding").notNull().default(false),
  biddingDeadline: timestamp("bidding_deadline"),
  minimumBidCount: integer("minimum_bid_count").notNull().default(3),
  maximumBidAmount: decimal("maximum_bid_amount", { precision: 10, scale: 2 }),
  reservePrice: decimal("reserve_price", { precision: 10, scale: 2 }),
  winningBidId: varchar("winning_bid_id"),
  biddingStrategy: biddingStrategyEnum("bidding_strategy").default('manual'),
  autoAcceptBids: bidAutoAcceptEnum("auto_accept_bids").default('never'),
  biddingDuration: integer("bidding_duration").notNull().default(120), // Minutes
  bidCount: integer("bid_count").notNull().default(0),
  lowestBidAmount: decimal("lowest_bid_amount", { precision: 10, scale: 2 }),
  averageBidAmount: decimal("average_bid_amount", { precision: 10, scale: 2 }),
  
  // AI Analysis
  aiDamageAnalysis: jsonb("ai_damage_analysis"),
  aiChatHistory: jsonb("ai_chat_history"),
  
  // Completion
  completionNotes: text("completion_notes"),
  customerSignature: text("customer_signature"),
  rating: integer("rating"),
  reviewText: text("review_text"),
  
  // Assignment tracking
  assignmentAttempts: integer("assignment_attempts").notNull().default(0),
  lastAssignmentAttemptAt: timestamp("last_assignment_attempt_at"),
  assignmentMethod: jobAssignmentMethodEnum("assignment_method").default('manual'),
  
  // Assignment tracking - commented out until migration is run
  // assignmentAttemptedAt: timestamp("assignment_attempted_at"),
  // assignmentNotificationSent: boolean("assignment_notification_sent").notNull().default(false),
  
  // Notification tracking fields to prevent email spam
  lastAdminAlertAt: timestamp("last_admin_alert_at"),
  lastCustomerNotificationAt: timestamp("last_customer_notification_at"),
  
  // Customer email for notifications
  customerEmail: varchar("customer_email", { length: 255 }),
  
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

// Job Queue Management
export const queueStatusEnum = pgEnum('queue_status', ['current', 'queued', 'assigned', 'skipped', 'expired', 'completed', 'cancelled']);

// Vacation and time-off related enums
export const timeOffRequestTypeEnum = pgEnum('time_off_request_type', ['vacation', 'sick_leave', 'personal', 'training', 'other']);
export const timeOffStatusEnum = pgEnum('time_off_status', ['pending', 'approved', 'rejected', 'cancelled']);
export const coverageStatusEnum = pgEnum('coverage_status', ['pending', 'confirmed', 'declined', 'cancelled']);

export const contractorJobQueue = pgTable("contractor_job_queue", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractorId: varchar("contractor_id").notNull().references(() => users.id),
  jobId: varchar("job_id").notNull().references(() => jobs.id),
  queuePosition: integer("position").notNull(), // Queue position (1 = current/next, 2+ = queued)
  status: queueStatusEnum("status").notNull().default('queued'),
  queuedAt: timestamp("queued_at").notNull().defaultNow(),
  estimatedStartTime: timestamp("estimated_start_time"),
  actualStartTime: timestamp("actual_start_time"),
  completedAt: timestamp("completed_at"),
  skippedAt: timestamp("skipped_at"),
  expiredAt: timestamp("expired_at"),
  skipReason: text("skip_reason"),
  estimatedDuration: integer("estimated_duration"), // In minutes
  actualDuration: integer("actual_duration"), // In minutes
  priority: integer("priority").notNull().default(5), // 1-10 scale, 1 being highest priority
  autoAssigned: boolean("auto_assigned").notNull().default(false),
  distanceToJob: decimal("distance_to_job", { precision: 10, scale: 2 }), // In miles
  notificationsSent: jsonb("notifications_sent").default('[]'), // Array of notification timestamps
  lastNotificationAt: timestamp("last_notification_at"),
  notes: text("notes"),
  metadata: jsonb("metadata"), // Additional data like estimated cost, service type, etc
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  jobIdx: uniqueIndex("idx_queue_job").on(table.jobId), // Each job can only be in queue once
  contractorPositionIdx: index("idx_queue_contractor_position").on(table.contractorId, table.queuePosition),
  contractorStatusIdx: index("idx_queue_contractor_status").on(table.contractorId, table.status),
  statusIdx: index("idx_queue_status").on(table.status),
  estimatedStartIdx: index("idx_queue_estimated_start").on(table.estimatedStartTime)
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
  readAt: timestamp("read_at"), // Deprecated in favor of message_read_receipts table
  
  // Enhanced fields for real-time chat
  isEdited: boolean("is_edited").notNull().default(false),
  editedAt: timestamp("edited_at"),
  replyToId: varchar("reply_to_id").references(() => jobMessages.id),
  attachmentUrl: varchar("attachment_url", { length: 500 }),
  attachmentType: varchar("attachment_type", { length: 50 }), // image, document, etc.
  reactions: jsonb("reactions").default('{}'), // { emoji: [userId1, userId2] }
  isDeleted: boolean("is_deleted").notNull().default(false),
  deletedAt: timestamp("deleted_at"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  jobIdx: index("idx_job_messages_job").on(table.jobId),
  senderIdx: index("idx_job_messages_sender").on(table.senderId),
  createdIdx: index("idx_job_messages_created").on(table.createdAt),
  replyToIdx: index("idx_job_messages_reply_to").on(table.replyToId),
  deletedIdx: index("idx_job_messages_deleted").on(table.isDeleted)
}));

// Message read receipts table for tracking individual read statuses
export const messageReadReceipts = pgTable("message_read_receipts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  messageId: varchar("message_id").notNull().references(() => jobMessages.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id),
  readAt: timestamp("read_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow()
}, (table) => ({
  messageUserIdx: uniqueIndex("idx_message_read_receipts_unique").on(table.messageId, table.userId),
  userIdx: index("idx_message_read_receipts_user").on(table.userId),
  messageIdx: index("idx_message_read_receipts_message").on(table.messageId)
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

export const jobReassignmentHistory = pgTable("job_reassignment_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").notNull().references(() => jobs.id),
  fromContractorId: varchar("from_contractor_id").references(() => users.id),
  toContractorId: varchar("to_contractor_id").notNull().references(() => users.id),
  reassignedBy: varchar("reassigned_by").notNull().references(() => users.id),
  reason: text("reason"),
  reassignmentType: varchar("reassignment_type", { length: 50 }), // 'admin_reassign', 'contractor_to_driver', 'emergency_transfer'
  createdAt: timestamp("created_at").notNull().defaultNow()
}, (table) => ({
  jobIdx: index("idx_job_reassignment_job").on(table.jobId),
  fromIdx: index("idx_job_reassignment_from").on(table.fromContractorId),
  toIdx: index("idx_job_reassignment_to").on(table.toContractorId)
}));


// ====================
// LOCATION TRACKING
// ====================

export const locationTracking = pgTable("location_tracking", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractorId: varchar("contractor_id").notNull().references(() => users.id),
  jobId: varchar("job_id").references(() => jobs.id),
  
  // Current location data
  latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
  longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
  accuracy: decimal("accuracy", { precision: 10, scale: 2 }), // In meters
  altitude: decimal("altitude", { precision: 10, scale: 2 }), // In meters
  heading: decimal("heading", { precision: 5, scale: 2 }), // In degrees (0-360)
  speed: decimal("speed", { precision: 6, scale: 2 }), // In mph
  
  // Tracking metadata
  batteryLevel: integer("battery_level"), // 0-100
  isCharging: boolean("is_charging"),
  networkType: varchar("network_type", { length: 20 }), // wifi, cellular, unknown
  updateFrequency: trackingUpdateFrequencyEnum("update_frequency").notNull().default('normal'),
  
  // Tracking status
  trackingStatus: trackingStatusEnum("tracking_status").notNull().default('active'),
  lastMovementAt: timestamp("last_movement_at"),
  isStationary: boolean("is_stationary").notNull().default(false),
  stationaryDuration: integer("stationary_duration"), // In seconds
  
  // Privacy controls
  isPaused: boolean("is_paused").notNull().default(false),
  pausedAt: timestamp("paused_at"),
  pausedReason: text("paused_reason"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  contractorIdx: index("idx_location_tracking_contractor").on(table.contractorId),
  jobIdx: index("idx_location_tracking_job").on(table.jobId),
  statusIdx: index("idx_location_tracking_status").on(table.trackingStatus),
  locationIdx: index("idx_location_tracking_coords").on(table.latitude, table.longitude),
  updatedIdx: index("idx_location_tracking_updated").on(table.updatedAt)
}));

export const locationHistory = pgTable("location_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractorId: varchar("contractor_id").notNull().references(() => users.id),
  jobId: varchar("job_id").references(() => jobs.id),
  sessionId: varchar("session_id").references(() => trackingSessions.id),
  
  // Location data
  latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
  longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
  accuracy: decimal("accuracy", { precision: 10, scale: 2 }), // In meters
  altitude: decimal("altitude", { precision: 10, scale: 2 }), // In meters
  heading: decimal("heading", { precision: 5, scale: 2 }), // In degrees
  speed: decimal("speed", { precision: 6, scale: 2 }), // In mph
  
  // Additional data
  batteryLevel: integer("battery_level"),
  distanceFromPrevious: decimal("distance_from_previous", { precision: 10, scale: 2 }), // In miles
  timeFromPrevious: integer("time_from_previous"), // In seconds
  
  // Anonymization
  isAnonymized: boolean("is_anonymized").notNull().default(false),
  anonymizedAt: timestamp("anonymized_at"),
  
  recordedAt: timestamp("recorded_at").notNull().defaultNow()
}, (table) => ({
  contractorIdx: index("idx_location_history_contractor").on(table.contractorId),
  jobIdx: index("idx_location_history_job").on(table.jobId),
  sessionIdx: index("idx_location_history_session").on(table.sessionId),
  recordedIdx: index("idx_location_history_recorded").on(table.recordedAt),
  locationIdx: index("idx_location_history_coords").on(table.latitude, table.longitude)
}));

export const trackingSessions = pgTable("tracking_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractorId: varchar("contractor_id").notNull().references(() => users.id),
  jobId: varchar("job_id").references(() => jobs.id),
  
  // Session data
  startedAt: timestamp("started_at").notNull().defaultNow(),
  endedAt: timestamp("ended_at"),
  totalDistance: decimal("total_distance", { precision: 10, scale: 2 }), // In miles
  totalDuration: integer("total_duration"), // In seconds
  averageSpeed: decimal("average_speed", { precision: 6, scale: 2 }), // In mph
  maxSpeed: decimal("max_speed", { precision: 6, scale: 2 }), // In mph
  
  // Route data
  startLocation: jsonb("start_location"), // {lat, lng, address}
  endLocation: jsonb("end_location"), // {lat, lng, address}
  routePolyline: text("route_polyline"), // Encoded polyline for route display
  
  // Statistics
  totalPoints: integer("total_points").notNull().default(0),
  pauseCount: integer("pause_count").notNull().default(0),
  totalPauseDuration: integer("total_pause_duration").notNull().default(0), // In seconds
  
  // Session status
  isActive: boolean("is_active").notNull().default(true),
  endReason: varchar("end_reason", { length: 50 }), // completed, cancelled, battery_low, network_lost
  
  createdAt: timestamp("created_at").notNull().defaultNow()
}, (table) => ({
  contractorIdx: index("idx_tracking_sessions_contractor").on(table.contractorId),
  jobIdx: index("idx_tracking_sessions_job").on(table.jobId),
  activeIdx: index("idx_tracking_sessions_active").on(table.isActive),
  startedIdx: index("idx_tracking_sessions_started").on(table.startedAt)
}));

export const geofenceEvents = pgTable("geofence_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractorId: varchar("contractor_id").notNull().references(() => users.id),
  jobId: varchar("job_id").notNull().references(() => jobs.id),
  sessionId: varchar("session_id").references(() => trackingSessions.id),
  
  // Event data
  eventType: geofenceEventTypeEnum("event_type").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
  longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
  radius: integer("radius").notNull().default(100), // In meters
  
  // Job site info
  jobLatitude: decimal("job_latitude", { precision: 10, scale: 8 }).notNull(),
  jobLongitude: decimal("job_longitude", { precision: 11, scale: 8 }).notNull(),
  distanceFromSite: decimal("distance_from_site", { precision: 10, scale: 2 }), // In meters
  
  // Time tracking
  triggeredAt: timestamp("triggered_at").notNull().defaultNow(),
  dwellTime: integer("dwell_time"), // Time spent in geofence (seconds)
  
  // Notifications
  notificationSent: boolean("notification_sent").notNull().default(false),
  notificationSentAt: timestamp("notification_sent_at"),
  
  createdAt: timestamp("created_at").notNull().defaultNow()
}, (table) => ({
  contractorIdx: index("idx_geofence_events_contractor").on(table.contractorId),
  jobIdx: index("idx_geofence_events_job").on(table.jobId),
  sessionIdx: index("idx_geofence_events_session").on(table.sessionId),
  eventIdx: index("idx_geofence_events_type").on(table.eventType),
  triggeredIdx: index("idx_geofence_events_triggered").on(table.triggeredAt)
}));

// ====================
// ROUTE MANAGEMENT
// ====================

export const contractorRoutes = pgTable("contractor_routes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractorId: varchar("contractor_id").notNull().references(() => users.id),
  
  // Route information
  name: text("name").notNull(),
  description: text("description"),
  
  // Timing
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  plannedStartTime: timestamp("planned_start_time"),
  plannedEndTime: timestamp("planned_end_time"),
  
  // Distance and duration
  totalDistance: decimal("total_distance", { precision: 10, scale: 2 }), // In miles
  estimatedDuration: integer("estimated_duration"), // In minutes
  actualDuration: integer("actual_duration"), // In minutes
  
  // Optimization settings
  optimizationStrategy: routeOptimizationStrategyEnum("optimization_strategy").notNull().default('shortest'),
  
  // Route statistics
  totalStops: integer("total_stops").notNull().default(0),
  completedStops: integer("completed_stops").notNull().default(0),
  totalRevenue: decimal("total_revenue", { precision: 10, scale: 2 }).default('0'),
  
  // Current position
  currentStopId: varchar("current_stop_id"),
  currentLocation: jsonb("current_location"), // {lat, lng, timestamp}
  
  // Status
  status: routeStatusEnum("status").notNull().default('planned'),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  contractorIdx: index("idx_contractor_routes_contractor").on(table.contractorId),
  statusIdx: index("idx_contractor_routes_status").on(table.status),
  startTimeIdx: index("idx_contractor_routes_start_time").on(table.startTime)
}));

export const routeStops = pgTable("route_stops", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  routeId: varchar("route_id").notNull().references(() => contractorRoutes.id, { onDelete: 'cascade' }),
  jobId: varchar("job_id").references(() => jobs.id),
  
  // Stop information
  stopOrder: integer("stop_order").notNull(),
  stopType: routeStopTypeEnum("stop_type").notNull().default('service'),
  stopName: text("stop_name"),
  
  // Location
  location: jsonb("location").notNull(), // {lat, lng, address}
  
  // Timing - Planned
  plannedArrivalTime: timestamp("planned_arrival_time"),
  plannedDepartureTime: timestamp("planned_departure_time"),
  plannedDuration: integer("planned_duration"), // In minutes
  
  // Timing - Actual
  actualArrival: timestamp("actual_arrival"),
  actualDeparture: timestamp("actual_departure"),
  actualDuration: integer("actual_duration"), // In minutes
  
  // Distance from previous stop
  distanceFromPrevious: decimal("distance_from_previous", { precision: 10, scale: 2 }), // In miles
  timeFromPrevious: integer("time_from_previous"), // In minutes
  
  // Service details
  serviceNotes: text("service_notes"),
  customerContact: jsonb("customer_contact"), // {name, phone, email}
  
  // Status and tracking
  status: routeStopStatusEnum("status").notNull().default('pending'),
  completedAt: timestamp("completed_at"),
  skippedReason: text("skipped_reason"),
  
  // Notifications
  notificationsSent: jsonb("notifications_sent"), // Track which notifications have been sent
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  routeIdx: index("idx_route_stops_route").on(table.routeId),
  jobIdx: index("idx_route_stops_job").on(table.jobId),
  orderIdx: index("idx_route_stops_order").on(table.routeId, table.stopOrder),
  statusIdx: index("idx_route_stops_status").on(table.status)
}));

export const routeWaypoints = pgTable("route_waypoints", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  routeId: varchar("route_id").notNull().references(() => contractorRoutes.id, { onDelete: 'cascade' }),
  
  // Waypoint data
  sequenceNumber: integer("sequence_number").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
  longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
  
  // Navigation data
  heading: decimal("heading", { precision: 5, scale: 2 }), // In degrees (0-360)
  speed: decimal("speed", { precision: 6, scale: 2 }), // In mph
  altitude: decimal("altitude", { precision: 8, scale: 2 }), // In meters
  
  // Accuracy
  horizontalAccuracy: decimal("horizontal_accuracy", { precision: 6, scale: 2 }), // In meters
  verticalAccuracy: decimal("vertical_accuracy", { precision: 6, scale: 2 }), // In meters
  
  // Associated stop
  nearestStopId: varchar("nearest_stop_id").references(() => routeStops.id),
  distanceToNearestStop: decimal("distance_to_nearest_stop", { precision: 10, scale: 2 }), // In meters
  
  // Metadata
  batteryLevel: integer("battery_level"), // Percentage
  isCharging: boolean("is_charging"),
  networkType: varchar("network_type", { length: 20 }),
  
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  
  createdAt: timestamp("created_at").notNull().defaultNow()
}, (table) => ({
  routeIdx: index("idx_route_waypoints_route").on(table.routeId),
  sequenceIdx: index("idx_route_waypoints_sequence").on(table.routeId, table.sequenceNumber),
  timestampIdx: index("idx_route_waypoints_timestamp").on(table.timestamp),
  locationIdx: index("idx_route_waypoints_location").on(table.latitude, table.longitude)
}));

// ====================
// AI ASSIGNMENT SYSTEM
// ====================

// AI assignment scores table
export const aiAssignmentScores = pgTable("ai_assignment_scores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  contractorId: varchar("contractor_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // Scoring
  score: decimal("score", { precision: 5, scale: 2 }).notNull(), // 0-100 score
  
  // Scoring factors breakdown
  factors: jsonb("factors").notNull(), // {
    // skills_match: number (0-100),
    // distance: number (0-100),
    // response_time: number (0-100),
    // completion_rate: number (0-100),
    // customer_satisfaction: number (0-100),
    // workload_balance: number (0-100),
    // availability_score: number (0-100),
    // equipment_match: number (0-100),
    // price_competitiveness: number (0-100),
    // time_of_day_performance: number (0-100),
    // weather_suitability: number (0-100),
    // complexity_handling: number (0-100)
  // }
  
  // Metadata
  assignmentRecommendation: text("assignment_recommendation"), // AI-generated explanation
  confidenceLevel: decimal("confidence_level", { precision: 3, scale: 2 }), // 0-1 confidence
  
  calculatedAt: timestamp("calculated_at").notNull().defaultNow(),
  
  // Assignment outcome tracking
  wasAssigned: boolean("was_assigned").notNull().default(false),
  assignmentOutcome: varchar("assignment_outcome", { length: 50 }), // 'success', 'declined', 'no_response', 'failed'
  outcomeRecordedAt: timestamp("outcome_recorded_at"),
  performanceScore: decimal("performance_score", { precision: 5, scale: 2 }) // Actual performance if assigned
}, (table) => ({
  jobIdx: index("idx_ai_assignment_scores_job").on(table.jobId),
  contractorIdx: index("idx_ai_assignment_scores_contractor").on(table.contractorId),
  scoreIdx: index("idx_ai_assignment_scores_score").on(table.score),
  calculatedIdx: index("idx_ai_assignment_scores_calculated").on(table.calculatedAt),
  jobContractorIdx: uniqueIndex("idx_ai_assignment_scores_unique").on(table.jobId, table.contractorId, table.calculatedAt)
}));

// Assignment preferences table
export const assignmentPreferences = pgTable("assignment_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractorId: varchar("contractor_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // Service preferences
  preferredServiceTypes: text("preferred_service_types").array().default(sql`ARRAY[]::text[]`), // Array of service type IDs
  avoidServiceTypes: text("avoid_service_types").array().default(sql`ARRAY[]::text[]`), // Services to avoid
  
  // Geographic preferences
  preferredAreas: jsonb("preferred_areas"), // {
    // zones: [{lat, lng, radius}],
    // zipcodes: string[],
    // cities: string[],
    // highways: string[]
  // }
  
  // Workload preferences
  maxDailyJobs: integer("max_daily_jobs").notNull().default(10),
  maxWeeklyJobs: integer("max_weekly_jobs").notNull().default(50),
  maxDistance: integer("max_distance").notNull().default(100), // Miles from base
  minJobPrice: decimal("min_job_price", { precision: 8, scale: 2 }), // Minimum acceptable job price
  
  // Time preferences
  preferredTimeSlots: jsonb("preferred_time_slots"), // {
    // monday: [{start: "08:00", end: "17:00"}],
    // tuesday: [{start: "08:00", end: "17:00"}],
    // ...
  // }
  
  // Work preferences
  preferEmergencyJobs: boolean("prefer_emergency_jobs").notNull().default(true),
  preferScheduledJobs: boolean("prefer_scheduled_jobs").notNull().default(true),
  preferFleetJobs: boolean("prefer_fleet_jobs").notNull().default(true),
  preferRepeatCustomers: boolean("prefer_repeat_customers").notNull().default(true),
  
  // Assignment preferences
  autoAcceptHighScores: boolean("auto_accept_high_scores").notNull().default(false),
  autoAcceptThreshold: decimal("auto_accept_threshold", { precision: 5, scale: 2 }), // Score threshold for auto-accept
  
  // Notification preferences
  notifyForAllJobs: boolean("notify_for_all_jobs").notNull().default(false),
  notifyMinScore: decimal("notify_min_score", { precision: 5, scale: 2 }).default('70'), // Only notify if score > this
  
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  contractorIdx: uniqueIndex("idx_assignment_preferences_contractor").on(table.contractorId),
  activeIdx: index("idx_assignment_preferences_active").on(table.isActive)
}));

// ====================
// JOB BIDDING
// ====================

export const jobBids = pgTable("job_bids", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").notNull().references(() => jobs.id),
  contractorId: varchar("contractor_id").notNull().references(() => users.id),
  
  // Bid details
  bidAmount: decimal("bid_amount", { precision: 10, scale: 2 }).notNull(),
  estimatedCompletionTime: integer("estimated_completion_time").notNull(), // in minutes
  messageToCustomer: text("message_to_customer"),
  
  // Material breakdown
  laborCost: decimal("labor_cost", { precision: 10, scale: 2 }),
  materialsCost: decimal("materials_cost", { precision: 10, scale: 2 }),
  materialsDescription: text("materials_description"),
  
  // Status and timestamps
  status: bidStatusEnum("status").notNull().default('pending'),
  expiresAt: timestamp("expires_at").notNull(),
  acceptedAt: timestamp("accepted_at"),
  rejectedAt: timestamp("rejected_at"),
  withdrawnAt: timestamp("withdrawn_at"),
  
  // Counter offers
  isCounterOffer: boolean("is_counter_offer").notNull().default(false),
  originalBidId: varchar("original_bid_id").references(() => jobBids.id),
  counterOfferAmount: decimal("counter_offer_amount", { precision: 10, scale: 2 }),
  counterOfferMessage: text("counter_offer_message"),
  
  // Contractor info snapshot (for display)
  contractorName: text("contractor_name"),
  contractorRating: decimal("contractor_rating", { precision: 3, scale: 2 }),
  contractorCompletedJobs: integer("contractor_completed_jobs"),
  contractorResponseTime: integer("contractor_response_time"), // Average in minutes
  
  // Auto-bid settings
  isAutoBid: boolean("is_auto_bid").notNull().default(false),
  autoBidTemplateId: varchar("auto_bid_template_id"),
  
  // Ranking/scoring
  bidScore: decimal("bid_score", { precision: 5, scale: 2 }), // Calculated score for "best value"
  priceRank: integer("price_rank"), // 1 = lowest price
  timeRank: integer("time_rank"), // 1 = fastest completion
  qualityRank: integer("quality_rank"), // Based on contractor rating
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  jobIdx: index("idx_job_bids_job").on(table.jobId),
  contractorIdx: index("idx_job_bids_contractor").on(table.contractorId),
  statusIdx: index("idx_job_bids_status").on(table.status),
  expiryIdx: index("idx_job_bids_expiry").on(table.expiresAt),
  jobContractorIdx: uniqueIndex("idx_job_bids_unique").on(table.jobId, table.contractorId),
  createdIdx: index("idx_job_bids_created").on(table.createdAt)
}));

// Bid templates for contractors
export const bidTemplates = pgTable("bid_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractorId: varchar("contractor_id").notNull().references(() => users.id),
  serviceTypeId: varchar("service_type_id").references(() => serviceTypes.id),
  
  name: text("name").notNull(),
  description: text("description"),
  
  // Default values
  defaultMessage: text("default_message"),
  baseAmount: decimal("base_amount", { precision: 10, scale: 2 }),
  perMileRate: decimal("per_mile_rate", { precision: 6, scale: 2 }),
  estimatedTimeFormula: text("estimated_time_formula"), // e.g., "distance * 2 + 30"
  
  // Auto-bid settings
  enableAutoBid: boolean("enable_auto_bid").notNull().default(false),
  maxAutoBidAmount: decimal("max_auto_bid_amount", { precision: 10, scale: 2 }),
  minAutoBidAmount: decimal("min_auto_bid_amount", { precision: 10, scale: 2 }),
  autoBidRadius: integer("auto_bid_radius"), // Miles
  
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  contractorIdx: index("idx_bid_templates_contractor").on(table.contractorId),
  serviceIdx: index("idx_bid_templates_service").on(table.serviceTypeId)
}));

// Bidding configuration
export const biddingConfig = pgTable("bidding_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Global settings
  defaultBiddingDuration: integer("default_bidding_duration").notNull().default(120), // Minutes
  minimumBiddingDuration: integer("minimum_bidding_duration").notNull().default(30),
  maximumBiddingDuration: integer("maximum_bidding_duration").notNull().default(480),
  
  // Bid limits
  minimumBidIncrement: decimal("minimum_bid_increment", { precision: 6, scale: 2 }).notNull().default('5.00'),
  maximumBidsPerContractor: integer("maximum_bids_per_contractor").notNull().default(1),
  minimumContractorsToNotify: integer("minimum_contractors_to_notify").notNull().default(10),
  
  // Anti-sniping
  antiSnipingExtension: integer("anti_sniping_extension").notNull().default(5), // Minutes
  antiSnipingThreshold: integer("anti_sniping_threshold").notNull().default(5), // Minutes before deadline
  
  // Platform fees
  platformFeePercentage: decimal("platform_fee_percentage", { precision: 5, scale: 2 }).notNull().default('10.00'),
  minimumPlatformFee: decimal("minimum_platform_fee", { precision: 6, scale: 2 }).notNull().default('5.00'),
  
  // Penalties
  noShowPenaltyAmount: decimal("no_show_penalty_amount", { precision: 8, scale: 2 }).notNull().default('50.00'),
  bidRetractionPenaltyAmount: decimal("bid_retraction_penalty_amount", { precision: 8, scale: 2 }).notNull().default('25.00'),
  cooldownPeriodDays: integer("cooldown_period_days").notNull().default(7),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

// Bid analytics tracking
export const bidAnalytics = pgTable("bid_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Aggregated stats (updated periodically)
  serviceTypeId: varchar("service_type_id").references(() => serviceTypes.id),
  period: varchar("period", { length: 20 }).notNull(), // daily, weekly, monthly
  periodDate: timestamp("period_date").notNull(),
  
  totalBids: integer("total_bids").notNull().default(0),
  averageBidAmount: decimal("average_bid_amount", { precision: 10, scale: 2 }),
  lowestBidAmount: decimal("lowest_bid_amount", { precision: 10, scale: 2 }),
  highestBidAmount: decimal("highest_bid_amount", { precision: 10, scale: 2 }),
  
  winningBidsCount: integer("winning_bids_count").notNull().default(0),
  averageWinningBidAmount: decimal("average_winning_bid_amount", { precision: 10, scale: 2 }),
  
  averageTimeToFirstBid: integer("average_time_to_first_bid"), // Minutes
  averageBidsPerJob: decimal("average_bids_per_job", { precision: 5, scale: 2 }),
  bidAcceptanceRate: decimal("bid_acceptance_rate", { precision: 5, scale: 2 }), // Percentage
  
  createdAt: timestamp("created_at").notNull().defaultNow()
}, (table) => ({
  serviceIdx: index("idx_bid_analytics_service").on(table.serviceTypeId),
  periodIdx: index("idx_bid_analytics_period").on(table.period, table.periodDate)
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

// Vacation/time-off request table
export const vacationRequests = pgTable("vacation_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractorId: varchar("contractor_id").notNull().references(() => users.id),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  reason: text("reason"),
  requestType: timeOffRequestTypeEnum("request_type").notNull(),
  status: timeOffStatusEnum("status").notNull().default('pending'),
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  notes: text("notes"),
  coverageContractorId: varchar("coverage_contractor_id").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  contractorIdx: index("idx_vacation_requests_contractor").on(table.contractorId),
  statusIdx: index("idx_vacation_requests_status").on(table.status),
  dateIdx: index("idx_vacation_requests_dates").on(table.startDate, table.endDate),
  coverageIdx: index("idx_vacation_requests_coverage").on(table.coverageContractorId)
}));

// Availability overrides table (for specific date/time exceptions)
export const availabilityOverrides = pgTable("availability_overrides", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractorId: varchar("contractor_id").notNull().references(() => users.id),
  date: timestamp("date").notNull(),
  startTime: varchar("start_time", { length: 5 }), // null means entire day
  endTime: varchar("end_time", { length: 5 }), // null means entire day
  isAvailable: boolean("is_available").notNull(),
  reason: text("reason"),
  createdAt: timestamp("created_at").notNull().defaultNow()
}, (table) => ({
  contractorDateIdx: uniqueIndex("idx_availability_overrides_unique").on(table.contractorId, table.date),
  contractorIdx: index("idx_availability_overrides_contractor").on(table.contractorId),
  dateIdx: index("idx_availability_overrides_date").on(table.date)
}));

// Contractor coverage table
export const contractorCoverage = pgTable("contractor_coverage", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requestingContractorId: varchar("requesting_contractor_id").notNull().references(() => users.id),
  coveringContractorId: varchar("covering_contractor_id").notNull().references(() => users.id),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  status: coverageStatusEnum("status").notNull().default('pending'),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  requestingIdx: index("idx_contractor_coverage_requesting").on(table.requestingContractorId),
  coveringIdx: index("idx_contractor_coverage_covering").on(table.coveringContractorId),
  statusIdx: index("idx_contractor_coverage_status").on(table.status),
  dateIdx: index("idx_contractor_coverage_dates").on(table.startDate, table.endDate)
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

// Enhanced reviews table replacing contractorRatings
export const reviews = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").notNull().references(() => jobs.id).unique(),
  customerId: varchar("customer_id").references(() => users.id),
  contractorId: varchar("contractor_id").notNull().references(() => users.id),
  
  // Overall rating
  overallRating: integer("overall_rating").notNull(), // 1-5 stars
  
  // Category ratings (1-5 each)
  timelinessRating: integer("timeliness_rating"), // Arrived on time
  professionalismRating: integer("professionalism_rating"), // Courteous, clean
  qualityRating: integer("quality_rating"), // Work performed well
  valueRating: integer("value_rating"), // Fair pricing
  
  // Review content
  reviewText: text("review_text"),
  reviewTitle: varchar("review_title", { length: 200 }),
  
  // Contractor response
  contractorResponse: text("contractor_response"),
  contractorResponseAt: timestamp("contractor_response_at"),
  
  // Review metadata
  isVerifiedPurchase: boolean("is_verified_purchase").notNull().default(true),
  isAnonymous: boolean("is_anonymous").notNull().default(false),
  customerName: varchar("customer_name", { length: 100 }), // Display name if not anonymous
  
  // Photos
  photoUrls: jsonb("photo_urls").default('[]'), // Array of photo URLs
  
  // Engagement
  helpfulVotes: integer("helpful_votes").notNull().default(0),
  unhelpfulVotes: integer("unhelpful_votes").notNull().default(0),
  
  // Moderation
  isFlagged: boolean("is_flagged").notNull().default(false),
  flagReason: text("flag_reason"),
  flaggedBy: varchar("flagged_by").references(() => users.id),
  flaggedAt: timestamp("flagged_at"),
  moderationStatus: varchar("moderation_status", { length: 20 }).default('approved'), // pending, approved, rejected
  moderatedBy: varchar("moderated_by").references(() => users.id),
  moderatedAt: timestamp("moderated_at"),
  
  // Edit history
  isEdited: boolean("is_edited").notNull().default(false),
  editedAt: timestamp("edited_at"),
  editHistory: jsonb("edit_history").default('[]'),
  
  // Incentives
  discountCodeOffered: varchar("discount_code_offered", { length: 50 }),
  incentiveType: varchar("incentive_type", { length: 50 }), // discount, points, etc.
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  contractorIdx: index("idx_reviews_contractor").on(table.contractorId),
  jobIdx: uniqueIndex("idx_reviews_job").on(table.jobId),
  customerIdx: index("idx_reviews_customer").on(table.customerId),
  overallRatingIdx: index("idx_reviews_overall_rating").on(table.overallRating),
  createdIdx: index("idx_reviews_created").on(table.createdAt),
  moderationIdx: index("idx_reviews_moderation").on(table.moderationStatus),
  verifiedIdx: index("idx_reviews_verified").on(table.isVerifiedPurchase)
}));

// Review helpful votes tracking
export const reviewVotes = pgTable("review_votes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reviewId: varchar("review_id").notNull().references(() => reviews.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  isHelpful: boolean("is_helpful").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow()
}, (table) => ({
  reviewUserIdx: uniqueIndex("idx_review_votes_unique").on(table.reviewId, table.userId)
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
// CONTRACTOR APPLICATIONS
// ====================

export const contractorApplications = pgTable("contractor_applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // User reference
  userId: varchar("user_id").references(() => users.id),
  
  // Status
  status: applicationStatusEnum("status").notNull().default('draft'),
  
  // Personal details
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  
  // CDL Information
  cdlNumber: varchar("cdl_number", { length: 50 }),
  cdlClass: varchar("cdl_class", { length: 10 }),
  yearsExperience: integer("years_experience"),
  
  // Business information  
  businessName: text("business_name"),
  businessType: varchar("business_type", { length: 50 }), // sole_proprietor, llc, corporation
  taxId: varchar("tax_id", { length: 20 }),
  
  // Insurance
  hasInsurance: boolean("has_insurance").default(false),
  insuranceProvider: text("insurance_provider"),
  insurancePolicyNumber: varchar("insurance_policy_number", { length: 100 }),
  insuranceExpiry: timestamp("insurance_expiry"),
  
  // Service capabilities
  serviceTypes: text("service_types").array().default(sql`ARRAY[]::text[]`), // Array of service types
  certifications: text("certifications").array().default(sql`ARRAY[]::text[]`), // Array of certifications
  serviceRadius: integer("service_radius").default(50),
  baseLocation: text("base_location"),
  additionalAreas: text("additional_areas").array().default(sql`ARRAY[]::text[]`), // Additional service areas
  
  // Equipment
  hasServiceTruck: boolean("has_service_truck").default(false),
  truckMake: varchar("truck_make", { length: 50 }),
  truckModel: varchar("truck_model", { length: 50 }),
  truckYear: integer("truck_year"),
  equipment: text("equipment").array().default(sql`ARRAY[]::text[]`),
  tools: text("tools").array().default(sql`ARRAY[]::text[]`),
  
  // Availability
  emergencyAvailable: boolean("emergency_available").default(false),
  scheduledAvailable: boolean("scheduled_available").default(false),
  nightShiftAvailable: boolean("night_shift_available").default(false),
  weekendAvailable: boolean("weekend_available").default(false),
  
  // Consents
  backgroundCheckConsent: boolean("background_check_consent").default(false),
  termsAccepted: boolean("terms_accepted").default(false),
  dataProcessingConsent: boolean("data_processing_consent").default(false),
  
  // Review
  reviewNotes: text("review_notes"),
  rejectionReason: text("rejection_reason"),
  submittedAt: timestamp("submitted_at"),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  
  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  emailIdx: index("idx_contractor_applications_email").on(table.email),
  statusIdx: index("idx_contractor_applications_status").on(table.status),
  submittedIdx: index("idx_contractor_applications_submitted").on(table.submittedAt),
  createdIdx: index("idx_contractor_applications_created").on(table.createdAt)
}));

export const applicationDocuments = pgTable("application_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  applicationId: varchar("application_id").notNull().references(() => contractorApplications.id, { onDelete: 'cascade' }),
  
  documentType: applicationDocumentTypeEnum("document_type").notNull(),
  documentName: text("document_name").notNull(),
  documentUrl: text("document_url").notNull(),
  fileSize: integer("file_size").notNull(), // in bytes
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  
  // Verification
  verificationStatus: documentVerificationStatusEnum("verification_status").notNull().default('pending'),
  verifiedBy: varchar("verified_by").references(() => users.id),
  verifiedAt: timestamp("verified_at"),
  verificationNotes: text("verification_notes"),
  rejectionReason: text("rejection_reason"),
  
  // Document metadata
  expirationDate: timestamp("expiration_date"),
  issueDate: timestamp("issue_date"),
  issuingAuthority: text("issuing_authority"),
  documentNumber: varchar("document_number", { length: 100 }), // License number, policy number, etc.
  
  // Version control
  version: integer("version").notNull().default(1),
  replacedBy: varchar("replaced_by").references(() => applicationDocuments.id),
  isActive: boolean("is_active").notNull().default(true),
  
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  applicationIdx: index("idx_application_documents_application").on(table.applicationId),
  typeIdx: index("idx_application_documents_type").on(table.documentType),
  statusIdx: index("idx_application_documents_status").on(table.verificationStatus),
  expirationIdx: index("idx_application_documents_expiration").on(table.expirationDate),
  activeIdx: index("idx_application_documents_active").on(table.isActive)
}));

// Background check records
export const backgroundChecks = pgTable("background_checks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  applicationId: varchar("application_id").notNull().references(() => contractorApplications.id),
  
  checkType: backgroundCheckTypeEnum("check_type").notNull(),
  status: backgroundCheckStatusEnum("status").notNull().default('pending'),
  provider: varchar("provider", { length: 50 }), // Checkr, Samba Safety, etc.
  providerRefId: varchar("provider_ref_id", { length: 100 }),
  
  // Results
  passed: boolean("passed"),
  score: integer("score"), // Provider-specific score
  riskLevel: varchar("risk_level", { length: 20 }), // low, medium, high
  report: jsonb("report"), // Full report from provider
  flaggedItems: jsonb("flagged_items").default('[]'), // Array of concerning items
  
  // Expiration
  validUntil: timestamp("valid_until"),
  expirationWarningDays: integer("expiration_warning_days").notNull().default(30),
  
  requestedBy: varchar("requested_by").references(() => users.id),
  requestedAt: timestamp("requested_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  applicationIdx: index("idx_background_checks_application").on(table.applicationId),
  typeIdx: index("idx_background_checks_type").on(table.checkType),
  statusIdx: index("idx_background_checks_status").on(table.status),
  validUntilIdx: index("idx_background_checks_valid_until").on(table.validUntil)
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
  
  // Financial details
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).notNull().default('0'),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }).notNull().default('0'),
  amountDue: decimal("amount_due", { precision: 10, scale: 2 }).notNull(),
  
  // Status and dates
  status: invoiceStatusEnum("status").notNull().default('draft'),
  issueDate: timestamp("issue_date").notNull().defaultNow(),
  dueDate: timestamp("due_date"),
  paidAt: timestamp("paid_at"),
  sentAt: timestamp("sent_at"),
  
  // Legacy field for backward compatibility
  lineItems: jsonb("line_items").notNull().default('[]'),
  
  // Completion details
  completionNotes: text("completion_notes"),
  completionPhotos: text("completion_photos").array(),
  completedAt: timestamp("completed_at"),
  contractorSignature: text("contractor_signature"), // base64 signature
  
  // Additional fields
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  invoiceNumberIdx: uniqueIndex("idx_invoices_number").on(table.invoiceNumber),
  jobIdx: index("idx_invoices_job").on(table.jobId),
  customerIdx: index("idx_invoices_customer").on(table.customerId),
  fleetIdx: index("idx_invoices_fleet").on(table.fleetAccountId),
  statusIdx: index("idx_invoices_status").on(table.status)
}));

// Invoice default charges configuration
export const invoiceDefaults = pgTable("invoice_defaults", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  type: invoiceDefaultTypeEnum("type").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  applyByDefault: boolean("apply_by_default").notNull().default(false),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  typeIdx: index("idx_invoice_defaults_type").on(table.type),
  activeIdx: index("idx_invoice_defaults_active").on(table.isActive)
}));

// Invoice line items for detailed billing
export const invoiceLineItems = pgTable("invoice_line_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceId: varchar("invoice_id").notNull().references(() => invoices.id, { onDelete: 'cascade' }),
  type: invoiceLineItemTypeEnum("type").notNull(),
  description: varchar("description", { length: 500 }).notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull().default('1'),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow()
}, (table) => ({
  invoiceIdx: index("idx_invoice_line_items_invoice").on(table.invoiceId),
  typeIdx: index("idx_invoice_line_items_type").on(table.type)
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

// Fleet check payments table for EFS/Comdata integration
export const fleetChecks = pgTable("fleet_checks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Check details
  provider: checkProviderEnum("provider").notNull(),
  checkNumber: varchar("check_number", { length: 20 }).notNull(),
  authorizationCode: varchar("authorization_code", { length: 20 }).notNull(),
  driverCode: varchar("driver_code", { length: 20 }),
  
  // Transaction reference
  jobId: varchar("job_id").references(() => jobs.id),
  userId: varchar("user_id").references(() => users.id),
  fleetAccountId: varchar("fleet_account_id").references(() => fleetAccounts.id),
  
  // Amounts
  authorizedAmount: decimal("authorized_amount", { precision: 10, scale: 2 }).notNull(),
  capturedAmount: decimal("captured_amount", { precision: 10, scale: 2 }).default('0'),
  availableBalance: decimal("available_balance", { precision: 10, scale: 2 }),
  
  // Status tracking
  status: checkStatusEnum("status").notNull().default('pending'),
  
  // Validation timestamps
  authorizedAt: timestamp("authorized_at"),
  capturedAt: timestamp("captured_at"),
  voidedAt: timestamp("voided_at"),
  expiresAt: timestamp("expires_at"),
  
  // Response data from provider
  authorizationResponse: jsonb("authorization_response"),
  captureResponse: jsonb("capture_response"),
  voidResponse: jsonb("void_response"),
  
  // Error tracking
  lastError: text("last_error"),
  failureReason: text("failure_reason"),
  retryCount: integer("retry_count").notNull().default(0),
  
  // Security and compliance
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  maskedCheckNumber: varchar("masked_check_number", { length: 20 }), // Last 4 digits only
  
  // Additional metadata
  metadata: jsonb("metadata"),
  notes: text("notes"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  checkNumberIdx: index("idx_fleet_checks_number").on(table.checkNumber),
  providerIdx: index("idx_fleet_checks_provider").on(table.provider),
  statusIdx: index("idx_fleet_checks_status").on(table.status),
  jobIdx: index("idx_fleet_checks_job").on(table.jobId),
  userIdx: index("idx_fleet_checks_user").on(table.userId),
  fleetIdx: index("idx_fleet_checks_fleet").on(table.fleetAccountId),
  createdIdx: index("idx_fleet_checks_created").on(table.createdAt)
}));

// ====================
// BILLING & SUBSCRIPTIONS
// ====================

export const billingSubscriptions = pgTable("billing_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Fleet association
  fleetAccountId: varchar("fleet_account_id").notNull().references(() => fleetAccounts.id),
  
  // Plan details
  planType: planTypeEnum("plan_type").notNull(),
  planName: text("plan_name").notNull(),
  planDescription: text("plan_description"),
  customPlanDetails: jsonb("custom_plan_details"), // For custom plans
  
  // Billing details
  billingCycle: billingCycleEnum("billing_cycle").notNull().default('monthly'),
  baseAmount: decimal("base_amount", { precision: 10, scale: 2 }).notNull(),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default('0'),
  discountPercentage: decimal("discount_percentage", { precision: 5, scale: 2 }),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).default('0'),
  currency: varchar("currency", { length: 3 }).notNull().default('USD'),
  
  // Plan limits
  maxVehicles: integer("max_vehicles"),
  maxUsersPerMonth: integer("max_users_per_month"),
  includedEmergencyRepairs: integer("included_emergency_repairs"),
  includedScheduledServices: integer("included_scheduled_services"),
  
  // Add-on services
  addOns: jsonb("add_ons"), // Array of add-on services
  prioritySupport: boolean("priority_support").notNull().default(false),
  dedicatedAccountManager: boolean("dedicated_account_manager").notNull().default(false),
  
  // Payment method
  paymentMethodId: varchar("payment_method_id").references(() => paymentMethods.id),
  stripeSubscriptionId: varchar("stripe_subscription_id").unique(),
  stripeCustomerId: varchar("stripe_customer_id"),
  
  // Status and dates (using actual database column names)
  status: subscriptionStatusEnum("status").notNull().default('active'),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  trialEndsAt: timestamp("trial_ends_at"), // Database column: trial_ends_at
  currentPeriodStart: timestamp("current_period_start"), // Database column: current_period_start 
  currentPeriodEnd: timestamp("current_period_end"), // Database column: current_period_end
  cancelledAt: timestamp("cancelled_at"), // Database column: cancelled_at
  // Note: The following columns are not mentioned in the task as existing:
  // nextBillingDate, lastBillingDate, pausedAt, cancellationReason
  
  // Contract details (these columns may not exist in the database)
  // contractTermMonths: integer("contract_term_months"), // Column doesn't exist
  // autoRenew: boolean("auto_renew").notNull().default(true), // May not exist
  // earlyTerminationFee: decimal("early_termination_fee", { precision: 10, scale: 2 }), // May not exist
  
  // Usage tracking
  // currentMonthUsage: jsonb("current_month_usage"), // Column doesn't exist
  
  // Metadata
  // metadata: jsonb("metadata"), // May not exist
  // notes: text("notes"), // May not exist
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  fleetIdx: index("idx_billing_subscriptions_fleet").on(table.fleetAccountId),
  statusIdx: index("idx_billing_subscriptions_status").on(table.status),
  // nextBillingIdx: index("idx_billing_subscriptions_next_billing").on(table.nextBillingDate), // Column doesn't exist
  currentPeriodEndIdx: index("idx_billing_subscriptions_period_end").on(table.currentPeriodEnd), // Use currentPeriodEnd instead
  stripeSubIdx: uniqueIndex("idx_billing_subscriptions_stripe").on(table.stripeSubscriptionId)
}));

export const billingHistory = pgTable("billing_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Subscription reference
  subscriptionId: varchar("subscription_id").notNull().references(() => billingSubscriptions.id),
  fleetAccountId: varchar("fleet_account_id").notNull().references(() => fleetAccounts.id),
  
  // Billing details
  billingPeriodStart: timestamp("billing_period_start").notNull(),
  billingPeriodEnd: timestamp("billing_period_end").notNull(),
  billingDate: timestamp("billing_date").notNull(),
  dueDate: timestamp("due_date"),
  
  // Amount details
  baseAmount: decimal("base_amount", { precision: 10, scale: 2 }).notNull(),
  addOnsAmount: decimal("add_ons_amount", { precision: 10, scale: 2 }).default('0'),
  overageAmount: decimal("overage_amount", { precision: 10, scale: 2 }).default('0'),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default('0'),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default('0'),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }).default('0'),
  balanceDue: decimal("balance_due", { precision: 10, scale: 2 }).default('0'),
  currency: varchar("currency", { length: 3 }).notNull().default('USD'),
  
  // Payment details
  paymentMethodId: varchar("payment_method_id").references(() => paymentMethods.id),
  stripeChargeId: varchar("stripe_charge_id"),
  stripeInvoiceId: varchar("stripe_invoice_id").unique(),
  stripePaymentIntentId: varchar("stripe_payment_intent_id"),
  
  // Invoice reference
  invoiceId: varchar("invoice_id").references(() => invoices.id),
  invoiceNumber: varchar("invoice_number", { length: 20 }),
  
  // Status tracking
  status: billingHistoryStatusEnum("status").notNull().default('pending'),
  paymentAttempts: integer("payment_attempts").notNull().default(0),
  lastPaymentAttempt: timestamp("last_payment_attempt"),
  nextRetryAt: timestamp("next_retry_at"),
  paidAt: timestamp("paid_at"),
  
  // Usage summary for the period
  usageSummary: jsonb("usage_summary"), // Detailed usage for the billing period
  vehiclesUsed: integer("vehicles_used"),
  emergencyRepairsUsed: integer("emergency_repairs_used"),
  scheduledServicesUsed: integer("scheduled_services_used"),
  
  // Line items
  lineItems: jsonb("line_items"), // Detailed breakdown of charges
  
  // Error tracking
  failureReason: text("failure_reason"),
  failureCode: varchar("failure_code", { length: 50 }),
  errorDetails: jsonb("error_details"),
  
  // Metadata
  metadata: jsonb("metadata"),
  notes: text("notes"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  subscriptionIdx: index("idx_billing_history_subscription").on(table.subscriptionId),
  fleetIdx: index("idx_billing_history_fleet").on(table.fleetAccountId),
  statusIdx: index("idx_billing_history_status").on(table.status),
  billingDateIdx: index("idx_billing_history_billing_date").on(table.billingDate),
  invoiceIdx: index("idx_billing_history_invoice").on(table.invoiceId),
  stripeInvoiceIdx: uniqueIndex("idx_billing_history_stripe_invoice").on(table.stripeInvoiceId)
}));

// Billing usage tracking for overage calculations
export const billingUsageTracking = pgTable("billing_usage_tracking", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  subscriptionId: varchar("subscription_id").notNull().references(() => billingSubscriptions.id),
  fleetAccountId: varchar("fleet_account_id").notNull().references(() => fleetAccounts.id),
  
  // Period for tracking
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  
  // Service usage counts
  emergencyRepairsCount: integer("emergency_repairs_count").notNull().default(0),
  scheduledServicesCount: integer("scheduled_services_count").notNull().default(0),
  activeVehiclesCount: integer("active_vehicles_count").notNull().default(0),
  
  // Usage alerts
  usageAlert80Sent: boolean("usage_alert_80_sent").notNull().default(false),
  usageAlert90Sent: boolean("usage_alert_90_sent").notNull().default(false),
  usageAlert100Sent: boolean("usage_alert_100_sent").notNull().default(false),
  
  // Overage details
  hasOverage: boolean("has_overage").notNull().default(false),
  overageCalculatedAt: timestamp("overage_calculated_at"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  subscriptionIdx: index("idx_billing_usage_subscription").on(table.subscriptionId),
  fleetIdx: index("idx_billing_usage_fleet").on(table.fleetAccountId),
  periodIdx: index("idx_billing_usage_period").on(table.periodStart, table.periodEnd)
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

// Booking Settings for scheduled services
export const bookingSettings = pgTable("booking_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  dayOfWeek: integer("day_of_week").notNull(), // 0-6 (Sun-Sat)
  startTime: varchar("start_time", { length: 5 }).notNull(), // HH:MM format
  endTime: varchar("end_time", { length: 5 }).notNull(), // HH:MM format
  slotDuration: integer("slot_duration").notNull().default(60), // in minutes
  maxBookingsPerSlot: integer("max_bookings_per_slot").notNull().default(1),
  bufferTime: integer("buffer_time").notNull().default(0), // minutes between bookings
  isActive: boolean("is_active").notNull().default(true),
  serviceTypeId: varchar("service_type_id").references(() => serviceTypes.id),
  advanceBookingDays: integer("advance_booking_days").notNull().default(30),
  minAdvanceHours: integer("min_advance_hours").notNull().default(24),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  dayServiceIdx: index("idx_booking_settings_day_service").on(table.dayOfWeek, table.serviceTypeId)
}));

// Blocked dates/times for scheduled services
export const bookingBlacklist = pgTable("booking_blacklist", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  startTime: varchar("start_time", { length: 5 }), // HH:MM, null = all day
  endTime: varchar("end_time", { length: 5 }), // HH:MM, null = all day
  reason: text("reason"),
  isRecurring: boolean("is_recurring").notNull().default(false),
  recurringPattern: varchar("recurring_pattern", { length: 50 }), // weekly, monthly, yearly
  serviceTypeId: varchar("service_type_id").references(() => serviceTypes.id), // null = all services
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  dateIdx: index("idx_booking_blacklist_date").on(table.date),
  serviceIdx: index("idx_booking_blacklist_service").on(table.serviceTypeId)
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
// REMINDER SYSTEM
// ====================

export const customerPreferences = pgTable("customer_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  communicationChannel: communicationChannelEnum("communication_channel").notNull().default('both'),
  reminderOptIn: boolean("reminder_opt_in").notNull().default(true),
  marketingOptIn: boolean("marketing_opt_in").notNull().default(true),
  pushNotifications: boolean("push_notifications").notNull().default(true),
  notificationCategories: jsonb("notification_categories").default({
    job_updates: true,
    messages: true,
    payments: true,
    marketing: false
  }),
  doNotDisturbStart: varchar("do_not_disturb_start", { length: 5 }),
  doNotDisturbEnd: varchar("do_not_disturb_end", { length: 5 }),
  language: varchar("language", { length: 5 }).notNull().default('en'),
  timezone: varchar("timezone", { length: 50 }).notNull().default('America/New_York'),
  maxDailyMessages: integer("max_daily_messages").notNull().default(10),
  unsubscribeToken: varchar("unsubscribe_token").unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  userIdx: uniqueIndex("idx_customer_preferences_user").on(table.userId),
  unsubscribeTokenIdx: index("idx_customer_preferences_unsubscribe").on(table.unsubscribeToken)
}));

export const reminders = pgTable("reminders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").notNull().references(() => jobs.id),
  recipientId: varchar("recipient_id").notNull().references(() => users.id),
  reminderType: reminderTypeEnum("reminder_type").notNull(),
  reminderTiming: reminderTimingEnum("reminder_timing").notNull(),
  scheduledSendTime: timestamp("scheduled_send_time").notNull(),
  actualSendTime: timestamp("actual_send_time"),
  status: reminderStatusEnum("status").notNull().default('pending'),
  recipientEmail: text("recipient_email"),
  recipientPhone: varchar("recipient_phone", { length: 20 }),
  messageSubject: text("message_subject"),
  messageContent: text("message_content"),
  messageHtml: text("message_html"),
  templateCode: varchar("template_code", { length: 50 }),
  retryCount: integer("retry_count").notNull().default(0),
  maxRetries: integer("max_retries").notNull().default(3),
  lastError: text("last_error"),
  deliveryInfo: jsonb("delivery_info"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  jobIdx: index("idx_reminders_job").on(table.jobId),
  recipientIdx: index("idx_reminders_recipient").on(table.recipientId),
  statusIdx: index("idx_reminders_status").on(table.status),
  scheduledTimeIdx: index("idx_reminders_scheduled_time").on(table.scheduledSendTime),
  typeTimingIdx: index("idx_reminders_type_timing").on(table.reminderType, table.reminderTiming)
}));

export const reminderLog = pgTable("reminder_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reminderId: varchar("reminder_id").references(() => reminders.id),
  jobId: varchar("job_id").references(() => jobs.id),
  recipientId: varchar("recipient_id").references(() => users.id),
  channel: communicationChannelEnum("channel").notNull(),
  recipient: text("recipient").notNull(),
  messageType: varchar("message_type", { length: 50 }).notNull(),
  subject: text("subject"),
  content: text("content"),
  status: varchar("status", { length: 20 }).notNull(),
  providerId: varchar("provider_id"),
  providerResponse: jsonb("provider_response"),
  cost: decimal("cost", { precision: 8, scale: 4 }),
  opened: boolean("opened").notNull().default(false),
  openedAt: timestamp("opened_at"),
  clicked: boolean("clicked").notNull().default(false),
  clickedAt: timestamp("clicked_at"),
  unsubscribed: boolean("unsubscribed").notNull().default(false),
  unsubscribedAt: timestamp("unsubscribed_at"),
  bounced: boolean("bounced").notNull().default(false),
  bouncedAt: timestamp("bounced_at"),
  errorCode: varchar("error_code", { length: 50 }),
  errorMessage: text("error_message"),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").notNull().defaultNow()
}, (table) => ({
  reminderIdx: index("idx_reminder_log_reminder").on(table.reminderId),
  jobIdx: index("idx_reminder_log_job").on(table.jobId),
  recipientIdx: index("idx_reminder_log_recipient").on(table.recipientId),
  statusIdx: index("idx_reminder_log_status").on(table.status),
  sentAtIdx: index("idx_reminder_log_sent_at").on(table.sentAt)
}));

export const reminderBlacklist = pgTable("reminder_blacklist", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  value: text("value").notNull().unique(),
  type: varchar("type", { length: 20 }).notNull(),
  reason: text("reason"),
  addedBy: varchar("added_by").references(() => users.id),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  valueIdx: uniqueIndex("idx_reminder_blacklist_value").on(table.value),
  typeIdx: index("idx_reminder_blacklist_type").on(table.type),
  activeIdx: index("idx_reminder_blacklist_active").on(table.isActive)
}));

export const reminderMetrics = pgTable("reminder_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: timestamp("date").notNull(),
  channel: communicationChannelEnum("channel").notNull(),
  messageType: varchar("message_type", { length: 50 }).notNull(),
  totalSent: integer("total_sent").notNull().default(0),
  totalDelivered: integer("total_delivered").notNull().default(0),
  totalFailed: integer("total_failed").notNull().default(0),
  totalOpened: integer("total_opened").notNull().default(0),
  totalClicked: integer("total_clicked").notNull().default(0),
  totalUnsubscribed: integer("total_unsubscribed").notNull().default(0),
  totalBounced: integer("total_bounced").notNull().default(0),
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }).notNull().default('0'),
  averageDeliveryTime: integer("average_delivery_time"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow()
}, (table) => ({
  dateChannelIdx: index("idx_reminder_metrics_date_channel").on(table.date, table.channel),
  messageTypeIdx: index("idx_reminder_metrics_type").on(table.messageType)
}));

// ====================
// PUSH NOTIFICATIONS
// ====================

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  endpoint: text("endpoint").notNull().unique(),
  p256dhKey: text("p256dh_key").notNull(),
  authKey: text("auth_key").notNull(),
  deviceType: varchar("device_type", { length: 20 }).notNull(), // browser, ios, android
  browserInfo: jsonb("browser_info"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastUsed: timestamp("last_used"),
  isActive: boolean("is_active").notNull().default(true)
}, (table) => ({
  userIdx: index("idx_push_subscriptions_user").on(table.userId),
  activeIdx: index("idx_push_subscriptions_active").on(table.isActive),
  deviceTypeIdx: index("idx_push_subscriptions_device_type").on(table.deviceType)
}));

export const pushNotifications = pgTable("push_notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  body: text("body").notNull(),
  icon: text("icon"),
  badge: text("badge"),
  tag: varchar("tag", { length: 100 }),
  data: jsonb("data"),
  requireInteraction: boolean("require_interaction").notNull().default(false),
  actions: jsonb("actions"),
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),
  clickedAt: timestamp("clicked_at"),
  failedAt: timestamp("failed_at"),
  failureReason: text("failure_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow()
}, (table) => ({
  userIdx: index("idx_push_notifications_user").on(table.userId),
  tagIdx: index("idx_push_notifications_tag").on(table.tag),
  sentAtIdx: index("idx_push_notifications_sent_at").on(table.sentAt)
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

export const insertPmScheduleSchema = createInsertSchema(pmSchedules).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export type InsertPmSchedule = z.infer<typeof insertPmScheduleSchema>;
export type PmSchedule = typeof pmSchedules.$inferSelect;

export const insertFleetPricingOverrideSchema = createInsertSchema(fleetPricingOverrides).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export type InsertFleetPricingOverride = z.infer<typeof insertFleetPricingOverrideSchema>;
export type FleetPricingOverride = typeof fleetPricingOverrides.$inferSelect;

export const insertFleetApplicationSchema = createInsertSchema(fleetApplications).omit({ 
  id: true, 
  status: true,
  reviewNotes: true,
  rejectionReason: true,
  approvedBy: true,
  approvedAt: true,
  submittedAt: true,
  createdAt: true, 
  updatedAt: true 
});
export type InsertFleetApplication = z.infer<typeof insertFleetApplicationSchema>;
export type FleetApplication = typeof fleetApplications.$inferSelect;

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

// Note: insertServiceAreaSchema is defined later in this file with city-focused structure

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

// Job Queue schemas
export const insertContractorJobQueueSchema = createInsertSchema(contractorJobQueue).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export type InsertContractorJobQueue = z.infer<typeof insertContractorJobQueueSchema>;
export type ContractorJobQueue = typeof contractorJobQueue.$inferSelect;

export const insertJobPhotoSchema = createInsertSchema(jobPhotos).omit({ 
  id: true, 
  createdAt: true 
});
export type InsertJobPhoto = z.infer<typeof insertJobPhotoSchema>;
export type JobPhoto = typeof jobPhotos.$inferSelect;

export const insertJobMessageSchema = createInsertSchema(jobMessages).omit({ 
  id: true, 
  createdAt: true,
  updatedAt: true 
});
export type InsertJobMessage = z.infer<typeof insertJobMessageSchema>;
export type JobMessage = typeof jobMessages.$inferSelect;

export const insertMessageReadReceiptSchema = createInsertSchema(messageReadReceipts).omit({ 
  id: true, 
  createdAt: true,
  readAt: true 
});
export type InsertMessageReadReceipt = z.infer<typeof insertMessageReadReceiptSchema>;
export type MessageReadReceipt = typeof messageReadReceipts.$inferSelect;

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

// Vacation and time-off schemas
export const insertVacationRequestSchema = createInsertSchema(vacationRequests).omit({
  id: true,
  status: true,
  approvedBy: true,
  approvedAt: true,
  createdAt: true,
  updatedAt: true
});
export type InsertVacationRequest = z.infer<typeof insertVacationRequestSchema>;
export type VacationRequest = typeof vacationRequests.$inferSelect;

export const insertAvailabilityOverrideSchema = createInsertSchema(availabilityOverrides).omit({
  id: true,
  createdAt: true
});
export type InsertAvailabilityOverride = z.infer<typeof insertAvailabilityOverrideSchema>;
export type AvailabilityOverride = typeof availabilityOverrides.$inferSelect;

export const insertContractorCoverageSchema = createInsertSchema(contractorCoverage).omit({
  id: true,
  status: true,
  createdAt: true,
  updatedAt: true
});
export type InsertContractorCoverage = z.infer<typeof insertContractorCoverageSchema>;
export type ContractorCoverage = typeof contractorCoverage.$inferSelect;

export const insertContractorEarningsSchema = createInsertSchema(contractorEarnings).omit({ 
  id: true, 
  createdAt: true 
});
export type InsertContractorEarnings = z.infer<typeof insertContractorEarningsSchema>;
export type ContractorEarnings = typeof contractorEarnings.$inferSelect;

// Bidding schemas
export const insertJobBidSchema = createInsertSchema(jobBids).omit({ 
  id: true,
  status: true,
  priceRank: true,
  timeRank: true,
  qualityRank: true,
  bidScore: true,
  contractorName: true,
  contractorRating: true,
  contractorCompletedJobs: true,
  contractorResponseTime: true,
  createdAt: true,
  updatedAt: true
});
export type InsertJobBid = z.infer<typeof insertJobBidSchema>;
export type JobBid = typeof jobBids.$inferSelect;

export const insertBidTemplateSchema = createInsertSchema(bidTemplates).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export type InsertBidTemplate = z.infer<typeof insertBidTemplateSchema>;
export type BidTemplate = typeof bidTemplates.$inferSelect;

export const insertBiddingConfigSchema = createInsertSchema(biddingConfig).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export type InsertBiddingConfig = z.infer<typeof insertBiddingConfigSchema>;
export type BiddingConfig = typeof biddingConfig.$inferSelect;

export const insertBidAnalyticsSchema = createInsertSchema(bidAnalytics).omit({ 
  id: true, 
  createdAt: true
});
export type InsertBidAnalytics = z.infer<typeof insertBidAnalyticsSchema>;
export type BidAnalytics = typeof bidAnalytics.$inferSelect;

// Reviews schemas
export const insertReviewSchema = createInsertSchema(reviews).omit({ 
  id: true,
  helpfulVotes: true,
  unhelpfulVotes: true,
  isEdited: true,
  editHistory: true,
  createdAt: true,
  updatedAt: true
});
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;

export const insertReviewVoteSchema = createInsertSchema(reviewVotes).omit({ 
  id: true, 
  createdAt: true 
});
export type InsertReviewVote = z.infer<typeof insertReviewVoteSchema>;
export type ReviewVote = typeof reviewVotes.$inferSelect;

export const insertContractorDocumentSchema = createInsertSchema(contractorDocuments).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export type InsertContractorDocument = z.infer<typeof insertContractorDocumentSchema>;
export type ContractorDocument = typeof contractorDocuments.$inferSelect;

// Application schemas
export const insertContractorApplicationSchema = createInsertSchema(contractorApplications).omit({ 
  id: true, 
  status: true,
  emailVerified: true,
  phoneVerified: true,
  dotNumberVerified: true,
  mcNumberVerified: true,
  insuranceVerified: true,
  referencesVerified: true,
  createdAt: true, 
  updatedAt: true 
});
export type InsertContractorApplication = z.infer<typeof insertContractorApplicationSchema>;
export type ContractorApplication = typeof contractorApplications.$inferSelect;

export const insertApplicationDocumentSchema = createInsertSchema(applicationDocuments).omit({ 
  id: true,
  verificationStatus: true,
  version: true,
  isActive: true,
  uploadedAt: true,
  createdAt: true, 
  updatedAt: true 
});
export type InsertApplicationDocument = z.infer<typeof insertApplicationDocumentSchema>;
export type ApplicationDocument = typeof applicationDocuments.$inferSelect;

export const insertBackgroundCheckSchema = createInsertSchema(backgroundChecks).omit({ 
  id: true,
  status: true,
  requestedAt: true,
  createdAt: true, 
  updatedAt: true 
});
export type InsertBackgroundCheck = z.infer<typeof insertBackgroundCheckSchema>;
export type BackgroundCheck = typeof backgroundChecks.$inferSelect;

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
  status: true,
  issueDate: true,
  sentAt: true,
  paidAt: true,
  lineItems: true,
  createdAt: true, 
  updatedAt: true 
});
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;

export const insertInvoiceDefaultSchema = createInsertSchema(invoiceDefaults).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertInvoiceDefault = z.infer<typeof insertInvoiceDefaultSchema>;
export type InvoiceDefault = typeof invoiceDefaults.$inferSelect;

export const insertInvoiceLineItemSchema = createInsertSchema(invoiceLineItems).omit({
  id: true,
  createdAt: true
});
export type InsertInvoiceLineItem = z.infer<typeof insertInvoiceLineItemSchema>;
export type InvoiceLineItem = typeof invoiceLineItems.$inferSelect;

export const insertRefundSchema = createInsertSchema(refunds).omit({ 
  id: true, 
  status: true,
  createdAt: true, 
  updatedAt: true 
});
export type InsertRefund = z.infer<typeof insertRefundSchema>;
export type Refund = typeof refunds.$inferSelect;

export const insertFleetCheckSchema = createInsertSchema(fleetChecks).omit({
  id: true,
  status: true,
  capturedAmount: true,
  authorizedAt: true,
  capturedAt: true,
  voidedAt: true,
  maskedCheckNumber: true,
  retryCount: true,
  createdAt: true,
  updatedAt: true
});
export type InsertFleetCheck = z.infer<typeof insertFleetCheckSchema>;
export type FleetCheck = typeof fleetChecks.$inferSelect;

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

// Reminder System
export const insertCustomerPreferencesSchema = createInsertSchema(customerPreferences).omit({
  id: true,
  unsubscribeToken: true,
  createdAt: true,
  updatedAt: true
});
export type InsertCustomerPreferences = z.infer<typeof insertCustomerPreferencesSchema>;
export type CustomerPreferences = typeof customerPreferences.$inferSelect;

export const insertReminderSchema = createInsertSchema(reminders).omit({
  id: true,
  status: true,
  actualSendTime: true,
  retryCount: true,
  createdAt: true,
  updatedAt: true
});
export type InsertReminder = z.infer<typeof insertReminderSchema>;
export type Reminder = typeof reminders.$inferSelect;

export const insertReminderLogSchema = createInsertSchema(reminderLog).omit({
  id: true,
  opened: true,
  openedAt: true,
  clicked: true,
  clickedAt: true,
  unsubscribed: true,
  unsubscribedAt: true,
  bounced: true,
  bouncedAt: true,
  createdAt: true
});
export type InsertReminderLog = z.infer<typeof insertReminderLogSchema>;
export type ReminderLog = typeof reminderLog.$inferSelect;

export const insertReminderBlacklistSchema = createInsertSchema(reminderBlacklist).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertReminderBlacklist = z.infer<typeof insertReminderBlacklistSchema>;
export type ReminderBlacklist = typeof reminderBlacklist.$inferSelect;

export const insertReminderMetricsSchema = createInsertSchema(reminderMetrics).omit({
  id: true,
  createdAt: true
});
export type InsertReminderMetrics = z.infer<typeof insertReminderMetricsSchema>;
export type ReminderMetrics = typeof reminderMetrics.$inferSelect;

// Push Notifications
export const insertPushSubscriptionSchema = createInsertSchema(pushSubscriptions).omit({
  id: true,
  createdAt: true,
  lastUsed: true
});
export type InsertPushSubscription = z.infer<typeof insertPushSubscriptionSchema>;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;

export const insertPushNotificationSchema = createInsertSchema(pushNotifications).omit({
  id: true,
  createdAt: true,
  sentAt: true,
  deliveredAt: true,
  clickedAt: true,
  failedAt: true
});
export type InsertPushNotification = z.infer<typeof insertPushNotificationSchema>;
export type PushNotification = typeof pushNotifications.$inferSelect;

// ====================
// CONTRACT MANAGEMENT
// ====================

export const contractStatusEnum = pgEnum('contract_status', ['draft', 'pending_approval', 'active', 'expired', 'cancelled', 'terminated']);
export const slaMetricTypeEnum = pgEnum('sla_metric_type', ['response_time', 'resolution_time', 'uptime', 'availability', 'first_fix_rate']);
export const penaltyStatusEnum = pgEnum('penalty_status', ['pending', 'applied', 'waived', 'disputed', 'resolved']);
export const amendmentStatusEnum = pgEnum('amendment_status', ['draft', 'pending_approval', 'approved', 'rejected', 'superseded']);
export const contractTemplateEnum = pgEnum('contract_template', ['basic_enterprise', 'premium_enterprise', 'custom']);

// Fleet contracts table
export const fleetContracts = pgTable("fleet_contracts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Fleet reference
  fleetAccountId: varchar("fleet_account_id").notNull().references(() => fleetAccounts.id),
  
  // Contract details
  contractNumber: varchar("contract_number", { length: 50 }).unique().notNull(),
  contractName: text("contract_name").notNull(),
  templateType: contractTemplateEnum("template_type"),
  
  // Contract duration
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  autoRenew: boolean("auto_renew").notNull().default(false),
  renewalNotificationDays: integer("renewal_notification_days").default(90),
  
  // Financial terms
  contractValue: decimal("contract_value", { precision: 12, scale: 2 }).notNull(),
  billingFrequency: varchar("billing_frequency", { length: 20 }).notNull().default('monthly'),
  paymentTerms: text("payment_terms"),
  
  // SLA configuration
  slaTerms: jsonb("sla_terms").notNull(), // Detailed SLA configuration
  guaranteedResponseTime: integer("guaranteed_response_time"), // In minutes
  guaranteedResolutionTime: integer("guaranteed_resolution_time"), // In hours
  uptimeCommitment: decimal("uptime_commitment", { precision: 5, scale: 2 }), // Percentage
  
  // Coverage
  coverageZones: jsonb("coverage_zones"), // Geographic zones covered
  serviceHours: jsonb("service_hours"), // 24/7 or business hours definition
  exclusions: jsonb("exclusions"), // Force majeure and exclusions
  
  // Penalties
  penaltyConfiguration: jsonb("penalty_configuration"), // Penalty rules and amounts
  maxMonthlyPenalty: decimal("max_monthly_penalty", { precision: 10, scale: 2 }),
  maxAnnualPenalty: decimal("max_annual_penalty", { precision: 10, scale: 2 }),
  
  // Priority and support
  priorityLevel: integer("priority_level").notNull().default(1), // 1 = standard, 2 = premium, 3 = VIP
  dedicatedAccountManager: boolean("dedicated_account_manager").notNull().default(false),
  accountManagerId: varchar("account_manager_id").references(() => users.id),
  
  // Status
  status: contractStatusEnum("status").notNull().default('draft'),
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  
  // Digital signature fields (ready for integration)
  signatureRequired: boolean("signature_required").notNull().default(true),
  fleetSignatureData: jsonb("fleet_signature_data"),
  fleetSignedAt: timestamp("fleet_signed_at"),
  companySignatureData: jsonb("company_signature_data"),
  companySignedAt: timestamp("company_signed_at"),
  
  // Metadata
  notes: text("notes"),
  metadata: jsonb("metadata"),
  
  // Audit
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at")
}, (table) => ({
  fleetIdx: index("idx_fleet_contracts_fleet").on(table.fleetAccountId),
  statusIdx: index("idx_fleet_contracts_status").on(table.status),
  contractNumberIdx: uniqueIndex("idx_fleet_contracts_number").on(table.contractNumber),
  datesIdx: index("idx_fleet_contracts_dates").on(table.startDate, table.endDate)
}));

// Contract SLA metrics table
export const contractSlaMetrics = pgTable("contract_sla_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Contract reference
  contractId: varchar("contract_id").notNull().references(() => fleetContracts.id),
  
  // Metric definition
  metricType: slaMetricTypeEnum("metric_type").notNull(),
  metricName: text("metric_name").notNull(),
  description: text("description"),
  
  // Target values
  targetValue: decimal("target_value", { precision: 10, scale: 2 }).notNull(),
  targetUnit: varchar("target_unit", { length: 20 }).notNull(), // minutes, hours, percentage
  measurementPeriod: varchar("measurement_period", { length: 20 }).notNull(), // daily, weekly, monthly
  
  // Penalty configuration
  penaltyEnabled: boolean("penalty_enabled").notNull().default(true),
  penaltyThreshold: decimal("penalty_threshold", { precision: 10, scale: 2 }), // Threshold before penalty applies
  penaltyAmount: decimal("penalty_amount", { precision: 10, scale: 2 }),
  penaltyType: varchar("penalty_type", { length: 20 }), // fixed, percentage, tiered
  penaltyTiers: jsonb("penalty_tiers"), // Tiered penalty structure
  
  // Grace periods
  graceValue: decimal("grace_value", { precision: 10, scale: 2 }),
  graceOccurrences: integer("grace_occurrences"), // Number of allowed breaches before penalties
  
  // Current performance
  currentValue: decimal("current_value", { precision: 10, scale: 2 }),
  lastMeasuredAt: timestamp("last_measured_at"),
  breachCount: integer("breach_count").notNull().default(0),
  
  // Status
  isActive: boolean("is_active").notNull().default(true),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  contractIdx: index("idx_contract_sla_metrics_contract").on(table.contractId),
  typeIdx: index("idx_contract_sla_metrics_type").on(table.metricType)
}));

// Contract penalties table
export const contractPenalties = pgTable("contract_penalties", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // References
  contractId: varchar("contract_id").notNull().references(() => fleetContracts.id),
  slaMetricId: varchar("sla_metric_id").references(() => contractSlaMetrics.id),
  jobId: varchar("job_id").references(() => jobs.id),
  
  // Penalty details
  penaltyDate: timestamp("penalty_date").notNull(),
  penaltyReason: text("penalty_reason").notNull(),
  breachDetails: jsonb("breach_details"), // Detailed breach information
  
  // Amount
  penaltyAmount: decimal("penalty_amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default('USD'),
  
  // Application
  status: penaltyStatusEnum("status").notNull().default('pending'),
  appliedToInvoiceId: varchar("applied_to_invoice_id").references(() => invoices.id),
  appliedAt: timestamp("applied_at"),
  
  // Waiver/Dispute
  waiverRequested: boolean("waiver_requested").notNull().default(false),
  waiverReason: text("waiver_reason"),
  waiverRequestedBy: varchar("waiver_requested_by").references(() => users.id),
  waiverRequestedAt: timestamp("waiver_requested_at"),
  waiverApprovedBy: varchar("waiver_approved_by").references(() => users.id),
  waiverApprovedAt: timestamp("waiver_approved_at"),
  
  // Dispute
  disputeRaised: boolean("dispute_raised").notNull().default(false),
  disputeReason: text("dispute_reason"),
  disputeRaisedBy: varchar("dispute_raised_by").references(() => users.id),
  disputeRaisedAt: timestamp("dispute_raised_at"),
  disputeResolution: text("dispute_resolution"),
  disputeResolvedBy: varchar("dispute_resolved_by").references(() => users.id),
  disputeResolvedAt: timestamp("dispute_resolved_at"),
  
  // Metadata
  notes: text("notes"),
  metadata: jsonb("metadata"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  contractIdx: index("idx_contract_penalties_contract").on(table.contractId),
  statusIdx: index("idx_contract_penalties_status").on(table.status),
  dateIdx: index("idx_contract_penalties_date").on(table.penaltyDate)
}));

// Contract amendments table
export const contractAmendments = pgTable("contract_amendments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Contract reference
  contractId: varchar("contract_id").notNull().references(() => fleetContracts.id),
  amendmentNumber: varchar("amendment_number", { length: 50 }).notNull(),
  
  // Amendment details
  amendmentType: varchar("amendment_type", { length: 50 }).notNull(), // sla_change, term_extension, value_change
  effectiveDate: timestamp("effective_date").notNull(),
  
  // Changes
  changesSummary: text("changes_summary").notNull(),
  previousTerms: jsonb("previous_terms").notNull(),
  newTerms: jsonb("new_terms").notNull(),
  
  // Approval workflow
  status: amendmentStatusEnum("status").notNull().default('draft'),
  requestedBy: varchar("requested_by").references(() => users.id),
  requestedAt: timestamp("requested_at"),
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"),
  
  // Version control
  versionNumber: integer("version_number").notNull(),
  parentAmendmentId: varchar("parent_amendment_id").references(() => contractAmendments.id),
  
  // Digital signature (ready for integration)
  signatureRequired: boolean("signature_required").notNull().default(true),
  fleetSignatureData: jsonb("fleet_signature_data"),
  fleetSignedAt: timestamp("fleet_signed_at"),
  companySignatureData: jsonb("company_signature_data"),
  companySignedAt: timestamp("company_signed_at"),
  
  // Metadata
  notes: text("notes"),
  attachments: jsonb("attachments"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  contractIdx: index("idx_contract_amendments_contract").on(table.contractId),
  statusIdx: index("idx_contract_amendments_status").on(table.status),
  versionIdx: index("idx_contract_amendments_version").on(table.contractId, table.versionNumber)
}));

// Contract performance metrics table (for tracking and reporting)
export const contractPerformanceMetrics = pgTable("contract_performance_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // References
  contractId: varchar("contract_id").notNull().references(() => fleetContracts.id),
  slaMetricId: varchar("sla_metric_id").references(() => contractSlaMetrics.id),
  
  // Period
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  periodType: varchar("period_type", { length: 20 }).notNull(), // hourly, daily, weekly, monthly
  
  // Performance data
  metricType: slaMetricTypeEnum("metric_type").notNull(),
  targetValue: decimal("target_value", { precision: 10, scale: 2 }).notNull(),
  actualValue: decimal("actual_value", { precision: 10, scale: 2 }).notNull(),
  compliancePercentage: decimal("compliance_percentage", { precision: 5, scale: 2 }),
  
  // Breach information
  breachOccurred: boolean("breach_occurred").notNull().default(false),
  breachSeverity: varchar("breach_severity", { length: 20 }), // minor, major, critical
  breachDuration: integer("breach_duration"), // In minutes
  
  // Job metrics
  totalJobs: integer("total_jobs").notNull().default(0),
  compliantJobs: integer("compliant_jobs").notNull().default(0),
  breachedJobs: integer("breached_jobs").notNull().default(0),
  
  // Response times (for response_time metric)
  avgResponseTime: integer("avg_response_time"), // In minutes
  minResponseTime: integer("min_response_time"),
  maxResponseTime: integer("max_response_time"),
  p95ResponseTime: integer("p95_response_time"), // 95th percentile
  
  // Resolution times (for resolution_time metric)
  avgResolutionTime: integer("avg_resolution_time"), // In hours
  minResolutionTime: integer("min_resolution_time"),
  maxResolutionTime: integer("max_resolution_time"),
  
  // Uptime (for uptime metric)
  totalMinutes: integer("total_minutes"),
  uptimeMinutes: integer("uptime_minutes"),
  downtimeMinutes: integer("downtime_minutes"),
  downtimeIncidents: integer("downtime_incidents"),
  
  // Penalties
  penaltyApplied: boolean("penalty_applied").notNull().default(false),
  penaltyAmount: decimal("penalty_amount", { precision: 10, scale: 2 }),
  
  createdAt: timestamp("created_at").notNull().defaultNow()
}, (table) => ({
  contractIdx: index("idx_contract_performance_contract").on(table.contractId),
  periodIdx: index("idx_contract_performance_period").on(table.periodStart, table.periodEnd),
  metricIdx: index("idx_contract_performance_metric").on(table.slaMetricId),
  breachIdx: index("idx_contract_performance_breach").on(table.breachOccurred)
}));

// ====================
// SPLIT PAYMENTS
// ====================

export const payerTypeEnum = pgEnum('payer_type', ['carrier', 'driver', 'fleet', 'insurance', 'other']);
export const splitPaymentStatusEnum = pgEnum('split_payment_status', ['pending', 'partial', 'completed', 'failed', 'cancelled']);
export const paymentSplitStatusEnum = pgEnum('payment_split_status', ['pending', 'paid', 'failed', 'refunded', 'cancelled']);

// Split payments master table
export const splitPayments = pgTable("split_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Job reference
  jobId: varchar("job_id").notNull().references(() => jobs.id),
  
  // Payment details
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default('USD'),
  
  // Split configuration (JSON)
  splitConfiguration: jsonb("split_configuration").notNull(), // Template or custom split rules
  
  // Status tracking
  status: splitPaymentStatusEnum("status").notNull().default('pending'),
  completedAt: timestamp("completed_at"),
  
  // Template reference (if using a template)
  templateId: varchar("template_id").references(() => splitPaymentTemplates.id),
  
  // Metadata
  notes: text("notes"),
  metadata: jsonb("metadata"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  jobIdx: index("idx_split_payments_job").on(table.jobId),
  statusIdx: index("idx_split_payments_status").on(table.status),
  createdIdx: index("idx_split_payments_created").on(table.createdAt)
}));

// Individual payment splits
export const paymentSplits = pgTable("payment_splits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Split payment reference
  splitPaymentId: varchar("split_payment_id").notNull().references(() => splitPayments.id),
  jobId: varchar("job_id").notNull().references(() => jobs.id),
  
  // Payer information
  payerId: varchar("payer_id"), // User ID if registered
  payerType: payerTypeEnum("payer_type").notNull(),
  payerName: text("payer_name").notNull(),
  payerEmail: text("payer_email"),
  payerPhone: varchar("payer_phone", { length: 20 }),
  
  // Amount details
  amountAssigned: decimal("amount_assigned", { precision: 10, scale: 2 }).notNull(),
  amountPaid: decimal("amount_paid", { precision: 10, scale: 2 }).notNull().default('0'),
  currency: varchar("currency", { length: 3 }).notNull().default('USD'),
  
  // Payment method
  paymentMethod: paymentMethodTypeEnum("payment_method"),
  paymentMethodId: varchar("payment_method_id").references(() => paymentMethods.id),
  
  // Transaction reference
  transactionId: varchar("transaction_id").references(() => transactions.id),
  
  // Payment link details
  paymentToken: varchar("payment_token", { length: 64 }).unique(),
  paymentLinkUrl: text("payment_link_url"),
  tokenExpiresAt: timestamp("token_expires_at"),
  
  // Status tracking
  status: paymentSplitStatusEnum("status").notNull().default('pending'),
  paidAt: timestamp("paid_at"),
  failedAt: timestamp("failed_at"),
  failureReason: text("failure_reason"),
  
  // Reminders
  remindersSent: integer("reminders_sent").notNull().default(0),
  lastReminderAt: timestamp("last_reminder_at"),
  nextReminderAt: timestamp("next_reminder_at"),
  
  // Metadata
  description: text("description"), // What this payment covers (e.g., "Callout Fee", "Labor + Parts")
  metadata: jsonb("metadata"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  splitPaymentIdx: index("idx_payment_splits_split_payment").on(table.splitPaymentId),
  jobIdx: index("idx_payment_splits_job").on(table.jobId),
  payerIdx: index("idx_payment_splits_payer").on(table.payerId),
  statusIdx: index("idx_payment_splits_status").on(table.status),
  tokenIdx: uniqueIndex("idx_payment_splits_token").on(table.paymentToken),
  createdIdx: index("idx_payment_splits_created").on(table.createdAt)
}));

// Split payment templates
export const splitPaymentTemplates = pgTable("split_payment_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Template details
  name: text("name").notNull(),
  description: text("description"),
  
  // Split configuration
  splitRules: jsonb("split_rules").notNull(), // Array of split rules
  /* Example split_rules structure:
  [
    {
      payerType: "carrier",
      description: "Callout Fee",
      amount: 150, // Fixed amount
      percentage: null
    },
    {
      payerType: "driver",
      description: "Labor + Parts",
      amount: null,
      percentage: null, // Remaining balance
      isRemainder: true
    }
  ]
  */
  
  // Applicable service types
  serviceTypeIds: text("service_type_ids").array(), // Array of service type IDs this template applies to
  
  // Conditions
  conditions: jsonb("conditions"), // When this template should be suggested
  
  // Priority for auto-selection
  priority: integer("priority").notNull().default(0),
  
  // Status
  isActive: boolean("is_active").notNull().default(true),
  isDefault: boolean("is_default").notNull().default(false),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  activeIdx: index("idx_split_payment_templates_active").on(table.isActive),
  defaultIdx: index("idx_split_payment_templates_default").on(table.isDefault),
  priorityIdx: index("idx_split_payment_templates_priority").on(table.priority)
}));

// ====================
// ANALYTICS TABLES
// ====================

export const vehicleAnalytics = pgTable("vehicle_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vehicleId: varchar("vehicle_id").references(() => fleetVehicles.id).notNull(),
  fleetAccountId: varchar("fleet_account_id").references(() => fleetAccounts.id).notNull(),
  totalMilesDriven: decimal("total_miles_driven", { precision: 10, scale: 2 }).notNull().default('0'),
  totalMaintenanceCost: decimal("total_maintenance_cost", { precision: 10, scale: 2 }).notNull().default('0'),
  totalFuelCost: decimal("total_fuel_cost", { precision: 10, scale: 2 }).notNull().default('0'),
  costPerMile: decimal("cost_per_mile", { precision: 6, scale: 4 }).notNull().default('0'),
  fuelCostPerMile: decimal("fuel_cost_per_mile", { precision: 6, scale: 4 }).notNull().default('0'),
  maintenanceCostPerMile: decimal("maintenance_cost_per_mile", { precision: 6, scale: 4 }).notNull().default('0'),
  breakdownCount: integer("breakdown_count").notNull().default(0),
  avgTimeBetweenBreakdowns: integer("avg_time_between_breakdowns"), // in hours
  nextPredictedMaintenance: timestamp("next_predicted_maintenance"),
  healthScore: integer("health_score").notNull().default(100), // 0-100
  riskLevel: varchar("risk_level", { length: 20 }).notNull().default('low'), // low, medium, high
  lastServiceDate: timestamp("last_service_date"),
  lastBreakdownDate: timestamp("last_breakdown_date"),
  totalDowntimeHours: decimal("total_downtime_hours", { precision: 8, scale: 2 }).notNull().default('0'),
  avgRepairTime: decimal("avg_repair_time", { precision: 6, scale: 2 }), // in hours
  utilizationRate: decimal("utilization_rate", { precision: 5, scale: 2 }), // percentage
  complianceScore: integer("compliance_score").notNull().default(100), // 0-100
  performanceMetrics: jsonb("performance_metrics"), // detailed metrics
  predictiveInsights: jsonb("predictive_insights"), // ML predictions
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  vehicleIdx: index("idx_vehicle_analytics_vehicle").on(table.vehicleId),
  fleetIdx: index("idx_vehicle_analytics_fleet").on(table.fleetAccountId),
  healthScoreIdx: index("idx_vehicle_analytics_health").on(table.healthScore),
  riskLevelIdx: index("idx_vehicle_analytics_risk").on(table.riskLevel)
}));

export const breakdownPatterns = pgTable("breakdown_patterns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vehicleId: varchar("vehicle_id").references(() => fleetVehicles.id).notNull(),
  fleetAccountId: varchar("fleet_account_id").references(() => fleetAccounts.id).notNull(),
  issueType: varchar("issue_type", { length: 100 }).notNull(),
  issueCategory: varchar("issue_category", { length: 50 }), // engine, brakes, electrical, etc.
  frequency: integer("frequency").notNull().default(1),
  avgCostPerIncident: decimal("avg_cost_per_incident", { precision: 10, scale: 2 }),
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }),
  commonLocations: text("common_locations").array(), 
  timeOfDayPattern: jsonb("time_of_day_pattern"), // { morning: 5, afternoon: 2, evening: 3, night: 1 }
  seasonalPattern: jsonb("seasonal_pattern"), // { spring: 2, summer: 5, fall: 3, winter: 8 }
  weatherCorrelation: jsonb("weather_correlation"), // { hot: 3, cold: 8, rain: 5, snow: 2 }
  routeTypeCorrelation: jsonb("route_type_correlation"), // { highway: 5, city: 3, mountain: 8 }
  mileageAtFirstOccurrence: decimal("mileage_at_first_occurrence", { precision: 10, scale: 2 }),
  avgMileageBetweenOccurrences: decimal("avg_mileage_between_occurrences", { precision: 10, scale: 2 }),
  lastOccurrenceDate: timestamp("last_occurrence_date"),
  predictedNextOccurrence: timestamp("predicted_next_occurrence"),
  preventiveActions: text("preventive_actions").array(),
  rootCauseAnalysis: text("root_cause_analysis"),
  confidenceScore: decimal("confidence_score", { precision: 3, scale: 2 }), // 0.00 to 1.00
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  vehicleIdx: index("idx_breakdown_patterns_vehicle").on(table.vehicleId),
  fleetIdx: index("idx_breakdown_patterns_fleet").on(table.fleetAccountId),
  issueTypeIdx: index("idx_breakdown_patterns_issue").on(table.issueType),
  frequencyIdx: index("idx_breakdown_patterns_frequency").on(table.frequency)
}));

export const fleetAnalyticsAlerts = pgTable("fleet_analytics_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fleetAccountId: varchar("fleet_account_id").references(() => fleetAccounts.id).notNull(),
  vehicleId: varchar("vehicle_id").references(() => fleetVehicles.id),
  alertType: varchar("alert_type", { length: 50 }).notNull(), // maintenance_due, cost_threshold, breakdown_risk, compliance, budget
  alertTitle: varchar("alert_title", { length: 200 }).notNull(),
  alertMessage: text("alert_message").notNull(),
  severity: varchar("severity", { length: 20 }).notNull(), // low, medium, high, critical
  triggerValue: decimal("trigger_value", { precision: 10, scale: 2 }),
  thresholdValue: decimal("threshold_value", { precision: 10, scale: 2 }),
  isActive: boolean("is_active").notNull().default(true),
  isAcknowledged: boolean("is_acknowledged").notNull().default(false),
  acknowledgedBy: varchar("acknowledged_by").references(() => users.id),
  acknowledgedAt: timestamp("acknowledged_at"),
  notificationSent: boolean("notification_sent").notNull().default(false),
  notificationMethod: varchar("notification_method", { length: 20 }), // email, sms, push, webhook
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at")
}, (table) => ({
  fleetIdx: index("idx_fleet_alerts_fleet").on(table.fleetAccountId),
  vehicleIdx: index("idx_fleet_alerts_vehicle").on(table.vehicleId),
  typeIdx: index("idx_fleet_alerts_type").on(table.alertType),
  activeIdx: index("idx_fleet_alerts_active").on(table.isActive)
}));

// Billing subscription schemas and types
export const insertBillingSubscriptionSchema = createInsertSchema(billingSubscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertBillingSubscription = z.infer<typeof insertBillingSubscriptionSchema>;
export type BillingSubscription = typeof billingSubscriptions.$inferSelect;

export const insertBillingHistorySchema = createInsertSchema(billingHistory).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertBillingHistory = z.infer<typeof insertBillingHistorySchema>;
export type BillingHistory = typeof billingHistory.$inferSelect;

export const insertBillingUsageTrackingSchema = createInsertSchema(billingUsageTracking).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertBillingUsageTracking = z.infer<typeof insertBillingUsageTrackingSchema>;
export type BillingUsageTracking = typeof billingUsageTracking.$inferSelect;

// Split payment schemas and types
export const insertSplitPaymentSchema = createInsertSchema(splitPayments).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertSplitPayment = z.infer<typeof insertSplitPaymentSchema>;
export type SplitPayment = typeof splitPayments.$inferSelect;

export const insertPaymentSplitSchema = createInsertSchema(paymentSplits).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertPaymentSplit = z.infer<typeof insertPaymentSplitSchema>;
export type PaymentSplit = typeof paymentSplits.$inferSelect;

export const insertSplitPaymentTemplateSchema = createInsertSchema(splitPaymentTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertSplitPaymentTemplate = z.infer<typeof insertSplitPaymentTemplateSchema>;
export type SplitPaymentTemplate = typeof splitPaymentTemplates.$inferSelect;

// Analytics schemas and types
export const insertVehicleAnalyticsSchema = createInsertSchema(vehicleAnalytics).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertVehicleAnalytics = z.infer<typeof insertVehicleAnalyticsSchema>;
export type VehicleAnalytics = typeof vehicleAnalytics.$inferSelect;

export const insertBreakdownPatternSchema = createInsertSchema(breakdownPatterns).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertBreakdownPattern = z.infer<typeof insertBreakdownPatternSchema>;
export type BreakdownPattern = typeof breakdownPatterns.$inferSelect;

export const insertFleetAnalyticsAlertSchema = createInsertSchema(fleetAnalyticsAlerts).omit({
  id: true,
  createdAt: true,
  resolvedAt: true
});
export type InsertFleetAnalyticsAlert = z.infer<typeof insertFleetAnalyticsAlertSchema>;
export type FleetAnalyticsAlert = typeof fleetAnalyticsAlerts.$inferSelect;

// Contract management schemas and types
export const insertFleetContractSchema = createInsertSchema(fleetContracts).omit({
  id: true,
  contractNumber: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true
});
export type InsertFleetContract = z.infer<typeof insertFleetContractSchema>;
export type FleetContract = typeof fleetContracts.$inferSelect;

export const insertContractSlaMetricSchema = createInsertSchema(contractSlaMetrics).omit({
  id: true,
  currentValue: true,
  lastMeasuredAt: true,
  breachCount: true,
  createdAt: true,
  updatedAt: true
});
export type InsertContractSlaMetric = z.infer<typeof insertContractSlaMetricSchema>;
export type ContractSlaMetric = typeof contractSlaMetrics.$inferSelect;

export const insertContractPenaltySchema = createInsertSchema(contractPenalties).omit({
  id: true,
  status: true,
  createdAt: true,
  updatedAt: true
});
export type InsertContractPenalty = z.infer<typeof insertContractPenaltySchema>;
export type ContractPenalty = typeof contractPenalties.$inferSelect;

export const insertContractAmendmentSchema = createInsertSchema(contractAmendments).omit({
  id: true,
  status: true,
  createdAt: true,
  updatedAt: true
});
export type InsertContractAmendment = z.infer<typeof insertContractAmendmentSchema>;
export type ContractAmendment = typeof contractAmendments.$inferSelect;

export const insertContractPerformanceMetricSchema = createInsertSchema(contractPerformanceMetrics).omit({
  id: true,
  createdAt: true
});
export type InsertContractPerformanceMetric = z.infer<typeof insertContractPerformanceMetricSchema>;
export type ContractPerformanceMetric = typeof contractPerformanceMetrics.$inferSelect;

// Booking Settings schemas and types
export const insertBookingSettingsSchema = createInsertSchema(bookingSettings).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export type InsertBookingSettings = z.infer<typeof insertBookingSettingsSchema>;
export type BookingSettings = typeof bookingSettings.$inferSelect;

export const insertBookingBlacklistSchema = createInsertSchema(bookingBlacklist).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export type InsertBookingBlacklist = z.infer<typeof insertBookingBlacklistSchema>;
export type BookingBlacklist = typeof bookingBlacklist.$inferSelect;


// ====================
// PARTS INVENTORY
// ====================

export const partsCatalog = pgTable("parts_catalog", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  partNumber: varchar("part_number", { length: 100 }).notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  category: partsCategoryEnum("category").notNull().default('other'),
  manufacturer: varchar("manufacturer", { length: 100 }),
  unitCost: decimal("unit_cost", { precision: 10, scale: 2 }).notNull(),
  sellingPrice: decimal("selling_price", { precision: 10, scale: 2 }).notNull(),
  markup: decimal("markup", { precision: 5, scale: 2 }),
  imageUrl: text("image_url"),
  specifications: jsonb("specifications"), // { weight: "5lbs", dimensions: "10x5x3", material: "steel", etc }
  compatibleModels: jsonb("compatible_models"), // { makes: ["Freightliner", "Peterbilt"], models: ["Cascadia", "579"], years: [2018, 2019, 2020] }
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  partNumberIdx: uniqueIndex("idx_parts_catalog_part_number").on(table.partNumber),
  categoryIdx: index("idx_parts_catalog_category").on(table.category),
  manufacturerIdx: index("idx_parts_catalog_manufacturer").on(table.manufacturer),
  activeIdx: index("idx_parts_catalog_active").on(table.isActive)
}));

export const partsInventory = pgTable("parts_inventory", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  partId: varchar("part_id").notNull().references(() => partsCatalog.id),
  warehouseId: varchar("warehouse_id", { length: 50 }).notNull(), // Can be location code, contractor id, or main warehouse
  quantity: integer("quantity").notNull().default(0),
  reorderLevel: integer("reorder_level").notNull().default(5),
  reorderQuantity: integer("reorder_quantity").notNull().default(10),
  location: varchar("location", { length: 100 }), // Shelf/bin location
  lastRestocked: timestamp("last_restocked"),
  expirationDate: timestamp("expiration_date"),
  averageCost: decimal("average_cost", { precision: 10, scale: 2 }), // For FIFO/LIFO tracking
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  partWarehouseIdx: uniqueIndex("idx_parts_inventory_part_warehouse").on(table.partId, table.warehouseId),
  warehouseIdx: index("idx_parts_inventory_warehouse").on(table.warehouseId),
  reorderIdx: index("idx_parts_inventory_reorder").on(table.quantity, table.reorderLevel),
  expirationIdx: index("idx_parts_inventory_expiration").on(table.expirationDate)
}));

export const partsTransactions = pgTable("parts_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  partId: varchar("part_id").notNull().references(() => partsCatalog.id),
  jobId: varchar("job_id").references(() => jobs.id),
  contractorId: varchar("contractor_id").references(() => users.id),
  orderId: varchar("order_id").references(() => partsOrders.id),
  transactionType: partsTransactionTypeEnum("transaction_type").notNull(),
  quantity: integer("quantity").notNull(),
  unitCost: decimal("unit_cost", { precision: 10, scale: 2 }).notNull(),
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }).notNull(),
  warehouseId: varchar("warehouse_id", { length: 50 }).notNull(),
  notes: text("notes"),
  metadata: jsonb("metadata"), // Additional transaction-specific data
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: varchar("created_by").references(() => users.id)
}, (table) => ({
  partIdx: index("idx_parts_transactions_part").on(table.partId),
  jobIdx: index("idx_parts_transactions_job").on(table.jobId),
  contractorIdx: index("idx_parts_transactions_contractor").on(table.contractorId),
  orderIdx: index("idx_parts_transactions_order").on(table.orderId),
  typeIdx: index("idx_parts_transactions_type").on(table.transactionType),
  createdIdx: index("idx_parts_transactions_created").on(table.createdAt),
  warehouseIdx: index("idx_parts_transactions_warehouse").on(table.warehouseId)
}));

export const partsOrders = pgTable("parts_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  supplierName: text("supplier_name").notNull(),
  supplierContact: text("supplier_contact"),
  orderNumber: varchar("order_number", { length: 50 }).unique(),
  status: partsOrderStatusEnum("status").notNull().default('pending'),
  items: jsonb("items").notNull(), // [{partId, partNumber, name, quantity, unitCost, totalCost}]
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 10, scale: 2 }).default('0'),
  shipping: decimal("shipping", { precision: 10, scale: 2 }).default('0'),
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }).notNull(),
  orderedAt: timestamp("ordered_at"),
  expectedDelivery: timestamp("expected_delivery"),
  receivedAt: timestamp("received_at"),
  trackingNumber: varchar("tracking_number", { length: 100 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  createdBy: varchar("created_by").references(() => users.id)
}, (table) => ({
  orderNumberIdx: uniqueIndex("idx_parts_orders_order_number").on(table.orderNumber),
  statusIdx: index("idx_parts_orders_status").on(table.status),
  supplierIdx: index("idx_parts_orders_supplier").on(table.supplierName),
  orderedIdx: index("idx_parts_orders_ordered").on(table.orderedAt),
  expectedIdx: index("idx_parts_orders_expected").on(table.expectedDelivery)
}));

export const jobParts = pgTable("job_parts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").notNull().references(() => jobs.id),
  partId: varchar("part_id").notNull().references(() => partsCatalog.id),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  warrantyMonths: integer("warranty_months").default(0),
  warrantyExpiresAt: timestamp("warranty_expires_at"),
  installedAt: timestamp("installed_at"),
  installedBy: varchar("installed_by").references(() => users.id),
  serialNumber: varchar("serial_number", { length: 100 }),
  notes: text("notes"),
  isWarrantyClaim: boolean("is_warranty_claim").notNull().default(false),
  originalInstallJobId: varchar("original_install_job_id").references(() => jobs.id), // For warranty replacements
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  jobPartIdx: uniqueIndex("idx_job_parts_job_part").on(table.jobId, table.partId),
  jobIdx: index("idx_job_parts_job").on(table.jobId),
  partIdx: index("idx_job_parts_part").on(table.partId),
  warrantyIdx: index("idx_job_parts_warranty").on(table.warrantyExpiresAt),
  installedByIdx: index("idx_job_parts_installed_by").on(table.installedBy)
}));

// ====================
// MAINTENANCE PREDICTIONS
// ====================

export const maintenancePredictions = pgTable("maintenance_predictions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vehicleId: varchar("vehicle_id").notNull().references(() => fleetVehicles.id),
  predictedDate: timestamp("predicted_date").notNull(),
  serviceType: varchar("service_type", { length: 100 }).notNull(),
  confidence: decimal("confidence", { precision: 5, scale: 2 }).notNull(), // 0-100%
  riskLevel: maintenanceRiskLevelEnum("risk_level").notNull(),
  estimatedCost: decimal("estimated_cost", { precision: 10, scale: 2 }).notNull(),
  reasoning: text("reasoning").notNull(),
  modelVersion: varchar("model_version", { length: 50 }).notNull(),
  recommendations: jsonb("recommendations"), // Detailed recommendations array
  historicalAccuracy: decimal("historical_accuracy", { precision: 5, scale: 2 }), // Model's past accuracy for this type
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  vehicleIdx: index("idx_maintenance_predictions_vehicle").on(table.vehicleId),
  predictedDateIdx: index("idx_maintenance_predictions_date").on(table.predictedDate),
  riskLevelIdx: index("idx_maintenance_predictions_risk").on(table.riskLevel),
  serviceTypeIdx: index("idx_maintenance_predictions_service").on(table.serviceType),
  createdIdx: index("idx_maintenance_predictions_created").on(table.createdAt)
}));

export const vehicleTelemetry = pgTable("vehicle_telemetry", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vehicleId: varchar("vehicle_id").notNull().references(() => fleetVehicles.id),
  timestamp: timestamp("timestamp").notNull(),
  mileage: integer("mileage").notNull(),
  engineHours: decimal("engine_hours", { precision: 10, scale: 2 }),
  faultCodes: jsonb("fault_codes"), // Array of diagnostic trouble codes
  sensorReadings: jsonb("sensor_readings"), // {
    // oilPressure: 45,
    // coolantTemp: 195,
    // brakeWear: 65,
    // tirePressure: { FL: 100, FR: 100, RL: 100, RR: 100 },
    // batteryVoltage: 13.8,
    // engineRpm: 1500,
    // fuelLevel: 75,
    // defLevel: 50
  // }
  location: jsonb("location"), // { lat, lng, speed, heading }
  driverBehavior: jsonb("driver_behavior"), // { hardBrakes, hardAccel, idleTime, speeding }
  createdAt: timestamp("created_at").notNull().defaultNow()
}, (table) => ({
  vehicleIdx: index("idx_vehicle_telemetry_vehicle").on(table.vehicleId),
  timestampIdx: index("idx_vehicle_telemetry_timestamp").on(table.timestamp),
  createdIdx: index("idx_vehicle_telemetry_created").on(table.createdAt)
}));

export const maintenanceModels = pgTable("maintenance_models", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  modelName: varchar("model_name", { length: 100 }).notNull(),
  version: varchar("version", { length: 20 }).notNull(),
  accuracy: decimal("accuracy", { precision: 5, scale: 2 }).notNull(), // Overall model accuracy percentage
  trainedAt: timestamp("trained_at").notNull(),
  parameters: jsonb("parameters"), // Model configuration and hyperparameters
  performanceMetrics: jsonb("performance_metrics"), // {
    // precision: 0.85,
    // recall: 0.82,
    // f1Score: 0.835,
    // confusionMatrix: {...},
    // featureImportance: {...}
  // }
  trainingData: jsonb("training_data"), // Summary of training dataset
  isActive: boolean("is_active").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  modelNameIdx: index("idx_maintenance_models_name").on(table.modelName),
  versionIdx: index("idx_maintenance_models_version").on(table.version),
  activeIdx: index("idx_maintenance_models_active").on(table.isActive),
  trainedIdx: index("idx_maintenance_models_trained").on(table.trainedAt)
}));

export const maintenanceAlerts = pgTable("maintenance_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vehicleId: varchar("vehicle_id").notNull().references(() => fleetVehicles.id),
  predictionId: varchar("prediction_id").references(() => maintenancePredictions.id),
  alertType: maintenanceAlertTypeEnum("alert_type").notNull(),
  severity: maintenanceSeverityEnum("severity").notNull(),
  message: text("message").notNull(),
  triggerValue: decimal("trigger_value", { precision: 10, scale: 2 }), // The value that triggered the alert
  threshold: decimal("threshold", { precision: 10, scale: 2 }), // The threshold that was exceeded
  actionRequired: text("action_required"), // Recommended action
  acknowledgedBy: varchar("acknowledged_by").references(() => users.id),
  acknowledgedAt: timestamp("acknowledged_at"),
  resolvedAt: timestamp("resolved_at"),
  notes: text("notes"),
  notificationSent: boolean("notification_sent").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow()
}, (table) => ({
  vehicleIdx: index("idx_maintenance_alerts_vehicle").on(table.vehicleId),
  predictionIdx: index("idx_maintenance_alerts_prediction").on(table.predictionId),
  alertTypeIdx: index("idx_maintenance_alerts_type").on(table.alertType),
  severityIdx: index("idx_maintenance_alerts_severity").on(table.severity),
  acknowledgedIdx: index("idx_maintenance_alerts_acknowledged").on(table.acknowledgedBy),
  createdIdx: index("idx_maintenance_alerts_created").on(table.createdAt)
}));

// ====================
// NOTIFICATIONS
// ====================

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // User reference
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // Notification content
  type: notificationTypeEnum("type").notNull().default('system'),
  title: text("title").notNull(),
  message: text("message").notNull(),
  
  // Related entity references (polymorphic)
  relatedEntityType: varchar("related_entity_type", { length: 50 }), // 'job', 'invoice', 'payment', 'bid', etc.
  relatedEntityId: varchar("related_entity_id"),
  
  // Priority and status
  priority: notificationPriorityEnum("priority").notNull().default('medium'),
  isRead: boolean("is_read").notNull().default(false),
  readAt: timestamp("read_at"),
  
  // Action URL (optional)
  actionUrl: text("action_url"), // URL to navigate when notification is clicked
  
  // Additional data
  metadata: jsonb("metadata"), // Additional context-specific data
  
  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at"), // Optional expiration for time-sensitive notifications
  
  // Soft delete
  deletedAt: timestamp("deleted_at")
}, (table) => ({
  userIdx: index("idx_notifications_user").on(table.userId),
  typeIdx: index("idx_notifications_type").on(table.type),
  readIdx: index("idx_notifications_read").on(table.isRead),
  priorityIdx: index("idx_notifications_priority").on(table.priority),
  createdIdx: index("idx_notifications_created").on(table.createdAt),
  entityIdx: index("idx_notifications_entity").on(table.relatedEntityType, table.relatedEntityId)
}));

// Location tracking types
export type LocationTracking = typeof locationTracking.$inferSelect;
export type InsertLocationTracking = typeof locationTracking.$inferInsert;

export type LocationHistory = typeof locationHistory.$inferSelect;
export type InsertLocationHistory = typeof locationHistory.$inferInsert;

export type TrackingSession = typeof trackingSessions.$inferSelect;
export type InsertTrackingSession = typeof trackingSessions.$inferInsert;

export type GeofenceEvent = typeof geofenceEvents.$inferSelect;
export type InsertGeofenceEvent = typeof geofenceEvents.$inferInsert;

// Location tracking schemas
export const insertLocationTrackingSchema = createInsertSchema(locationTracking);
export const insertLocationHistorySchema = createInsertSchema(locationHistory);
export const insertTrackingSessionSchema = createInsertSchema(trackingSessions);
export const insertGeofenceEventSchema = createInsertSchema(geofenceEvents);

// Notification schemas and types
export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  isRead: true,
  readAt: true,
  createdAt: true,
  deletedAt: true
});
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

// Route management schemas and types
export const insertContractorRouteSchema = createInsertSchema(contractorRoutes).omit({
  id: true,
  totalStops: true,
  completedStops: true,
  totalRevenue: true,
  createdAt: true,
  updatedAt: true
});
export type InsertContractorRoute = z.infer<typeof insertContractorRouteSchema>;
export type ContractorRoute = typeof contractorRoutes.$inferSelect;

export const insertRouteStopSchema = createInsertSchema(routeStops).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertRouteStop = z.infer<typeof insertRouteStopSchema>;
export type RouteStop = typeof routeStops.$inferSelect;

export const insertRouteWaypointSchema = createInsertSchema(routeWaypoints).omit({
  id: true,
  createdAt: true
});
export type InsertRouteWaypoint = z.infer<typeof insertRouteWaypointSchema>;
export type RouteWaypoint = typeof routeWaypoints.$inferSelect;

// AI Assignment schemas and types
export const insertAiAssignmentScoreSchema = createInsertSchema(aiAssignmentScores).omit({
  id: true,
  calculatedAt: true,
  wasAssigned: true,
  assignmentOutcome: true,
  outcomeRecordedAt: true,
  performanceScore: true
});
export type InsertAiAssignmentScore = z.infer<typeof insertAiAssignmentScoreSchema>;
export type AiAssignmentScore = typeof aiAssignmentScores.$inferSelect;

export const insertAssignmentPreferencesSchema = createInsertSchema(assignmentPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertAssignmentPreferences = z.infer<typeof insertAssignmentPreferencesSchema>;
export type AssignmentPreferences = typeof assignmentPreferences.$inferSelect;

// Parts Inventory schemas and types
export const insertPartsCatalogSchema = createInsertSchema(partsCatalog).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertPartsCatalog = z.infer<typeof insertPartsCatalogSchema>;
export type PartsCatalog = typeof partsCatalog.$inferSelect;

export const insertPartsInventorySchema = createInsertSchema(partsInventory).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertPartsInventory = z.infer<typeof insertPartsInventorySchema>;
export type PartsInventory = typeof partsInventory.$inferSelect;

export const insertPartsTransactionSchema = createInsertSchema(partsTransactions).omit({
  id: true,
  createdAt: true
});
export type InsertPartsTransaction = z.infer<typeof insertPartsTransactionSchema>;
export type PartsTransaction = typeof partsTransactions.$inferSelect;

export const insertPartsOrderSchema = createInsertSchema(partsOrders).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertPartsOrder = z.infer<typeof insertPartsOrderSchema>;
export type PartsOrder = typeof partsOrders.$inferSelect;

export const insertJobPartSchema = createInsertSchema(jobParts).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertJobPart = z.infer<typeof insertJobPartSchema>;
export type JobPart = typeof jobParts.$inferSelect;

// Maintenance Prediction schemas and types
export const insertMaintenancePredictionSchema = createInsertSchema(maintenancePredictions).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertMaintenancePrediction = z.infer<typeof insertMaintenancePredictionSchema>;
export type MaintenancePrediction = typeof maintenancePredictions.$inferSelect;

export const insertVehicleTelemetrySchema = createInsertSchema(vehicleTelemetry).omit({
  id: true,
  createdAt: true
});
export type InsertVehicleTelemetry = z.infer<typeof insertVehicleTelemetrySchema>;
export type VehicleTelemetry = typeof vehicleTelemetry.$inferSelect;

export const insertMaintenanceModelSchema = createInsertSchema(maintenanceModels).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertMaintenanceModel = z.infer<typeof insertMaintenanceModelSchema>;
export type MaintenanceModel = typeof maintenanceModels.$inferSelect;

export const insertMaintenanceAlertSchema = createInsertSchema(maintenanceAlerts).omit({
  id: true,
  createdAt: true
});
export type InsertMaintenanceAlert = z.infer<typeof insertMaintenanceAlertSchema>;
export type MaintenanceAlert = typeof maintenanceAlerts.$inferSelect;

// ====================
// PERFORMANCE METRICS
// ====================

// Performance metrics enums
export const entityTypeEnum = pgEnum('entity_type', ['contractor', 'fleet', 'vehicle', 'job']);
export const metricTypeEnum = pgEnum('metric_type', ['response_time', 'completion_rate', 'revenue', 'satisfaction', 'utilization', 'cost', 'on_time', 'quality', 'efficiency']);
export const performanceStatusEnum = pgEnum('performance_status', ['pending', 'in_progress', 'achieved', 'failed', 'expired']);
export const kpiCategoryEnum = pgEnum('kpi_category', ['operational', 'financial', 'quality', 'customer', 'compliance']);

// Performance metrics table
export const performanceMetrics = pgTable("performance_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  entityType: entityTypeEnum("entity_type").notNull(),
  entityId: varchar("entity_id").notNull(),
  metricType: metricTypeEnum("metric_type").notNull(),
  metricName: varchar("metric_name", { length: 100 }).notNull(),
  value: decimal("value", { precision: 15, scale: 4 }).notNull(),
  unit: varchar("unit", { length: 50 }), // e.g., "percentage", "dollars", "minutes", "count"
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  periodStart: timestamp("period_start"),
  periodEnd: timestamp("period_end"),
  metadata: jsonb("metadata").default('{}'), // Additional context (e.g., { sample_size: 100, confidence: 0.95 })
  createdAt: timestamp("created_at").notNull().defaultNow()
}, (table) => ({
  entityIdx: index("idx_performance_metrics_entity").on(table.entityType, table.entityId),
  metricTypeIdx: index("idx_performance_metrics_type").on(table.metricType),
  timestampIdx: index("idx_performance_metrics_timestamp").on(table.timestamp),
  periodIdx: index("idx_performance_metrics_period").on(table.periodStart, table.periodEnd)
}));

// KPI definitions table
export const kpiDefinitions = pgTable("kpi_definitions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  formula: text("formula"), // SQL or calculation formula
  unit: varchar("unit", { length: 50 }).notNull(), // e.g., "percentage", "dollars", "minutes"
  category: kpiCategoryEnum("category").notNull(),
  targetValue: decimal("target_value", { precision: 15, scale: 4 }),
  thresholdGreen: decimal("threshold_green", { precision: 15, scale: 4 }),
  thresholdYellow: decimal("threshold_yellow", { precision: 15, scale: 4 }),
  thresholdRed: decimal("threshold_red", { precision: 15, scale: 4 }),
  isActive: boolean("is_active").notNull().default(true),
  refreshInterval: integer("refresh_interval").default(3600), // seconds
  aggregationType: varchar("aggregation_type", { length: 20 }).default('average'), // average, sum, count, max, min
  metadata: jsonb("metadata").default('{}'), // Additional configuration
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  categoryIdx: index("idx_kpi_definitions_category").on(table.category),
  activeIdx: index("idx_kpi_definitions_active").on(table.isActive),
  nameIdx: uniqueIndex("idx_kpi_definitions_name").on(table.name)
}));

// Metric snapshots table
export const metricSnapshots = pgTable("metric_snapshots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  snapshotDate: timestamp("snapshot_date").notNull(),
  entityType: entityTypeEnum("entity_type"),
  entityId: varchar("entity_id"),
  metrics: jsonb("metrics").notNull().default('{}'), // { kpi_name: value, ... }
  summary: jsonb("summary").default('{}'), // Aggregated summary stats
  createdAt: timestamp("created_at").notNull().defaultNow()
}, (table) => ({
  dateIdx: index("idx_metric_snapshots_date").on(table.snapshotDate),
  entityIdx: index("idx_metric_snapshots_entity").on(table.entityType, table.entityId),
  dateEntityIdx: index("idx_metric_snapshots_date_entity").on(table.snapshotDate, table.entityType, table.entityId)
}));

// Performance goals table
export const performanceGoals = pgTable("performance_goals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  entityType: entityTypeEnum("entity_type").notNull(),
  entityId: varchar("entity_id").notNull(),
  kpiId: varchar("kpi_id").notNull().references(() => kpiDefinitions.id),
  targetValue: decimal("target_value", { precision: 15, scale: 4 }).notNull(),
  currentValue: decimal("current_value", { precision: 15, scale: 4 }),
  startDate: timestamp("start_date").notNull().defaultNow(),
  deadline: timestamp("deadline").notNull(),
  status: performanceStatusEnum("status").notNull().default('pending'),
  achievedAt: timestamp("achieved_at"),
  notes: text("notes"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  entityIdx: index("idx_performance_goals_entity").on(table.entityType, table.entityId),
  kpiIdx: index("idx_performance_goals_kpi").on(table.kpiId),
  statusIdx: index("idx_performance_goals_status").on(table.status),
  deadlineIdx: index("idx_performance_goals_deadline").on(table.deadline)
}));

// Performance metric schemas and types
export const insertPerformanceMetricSchema = createInsertSchema(performanceMetrics).omit({
  id: true,
  timestamp: true,
  createdAt: true
});
export type InsertPerformanceMetric = z.infer<typeof insertPerformanceMetricSchema>;
export type PerformanceMetric = typeof performanceMetrics.$inferSelect;

export const insertKpiDefinitionSchema = createInsertSchema(kpiDefinitions).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertKpiDefinition = z.infer<typeof insertKpiDefinitionSchema>;
export type KpiDefinition = typeof kpiDefinitions.$inferSelect;

export const insertMetricSnapshotSchema = createInsertSchema(metricSnapshots).omit({
  id: true,
  createdAt: true
});
export type InsertMetricSnapshot = z.infer<typeof insertMetricSnapshotSchema>;
export type MetricSnapshot = typeof metricSnapshots.$inferSelect;

export const insertPerformanceGoalSchema = createInsertSchema(performanceGoals).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertPerformanceGoal = z.infer<typeof insertPerformanceGoalSchema>;
export type PerformanceGoal = typeof performanceGoals.$inferSelect;

// ====================
// WEATHER SYSTEM
// ====================

// Weather data table for storing weather information for locations
export const weatherData = pgTable("weather_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Location information
  latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
  longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
  locationName: text("location_name"),
  
  // Current weather conditions
  temperature: decimal("temperature", { precision: 5, scale: 2 }).notNull(), // in Fahrenheit
  feelsLike: decimal("feels_like", { precision: 5, scale: 2 }),
  conditions: weatherConditionsEnum("conditions").notNull(),
  description: text("description"),
  
  // Wind information
  windSpeed: decimal("wind_speed", { precision: 5, scale: 2 }).notNull(), // in mph
  windDirection: integer("wind_direction"), // degrees
  windGust: decimal("wind_gust", { precision: 5, scale: 2 }),
  
  // Precipitation
  precipitation: decimal("precipitation", { precision: 5, scale: 2 }).default('0'), // in inches
  precipitationProbability: integer("precipitation_probability"), // percentage
  precipitationType: varchar("precipitation_type", { length: 20 }), // rain, snow, sleet
  
  // Atmospheric conditions
  humidity: integer("humidity").notNull(), // percentage
  pressure: decimal("pressure", { precision: 6, scale: 2 }), // in inHg
  visibility: decimal("visibility", { precision: 5, scale: 2 }), // in miles
  uvIndex: integer("uv_index"),
  cloudCover: integer("cloud_cover"), // percentage
  
  // Additional data
  sunrise: timestamp("sunrise"),
  sunset: timestamp("sunset"),
  moonPhase: decimal("moon_phase", { precision: 3, scale: 2 }),
  
  // Source and timestamps
  source: varchar("source", { length: 50 }).default('mock'), // 'mock', 'api', 'manual'
  isForecast: boolean("is_forecast").notNull().default(false),
  forecastFor: timestamp("forecast_for"), // if this is forecast data, when it's for
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  expiresAt: timestamp("expires_at"), // when this data should be refreshed
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  locationIdx: index("idx_weather_data_location").on(table.latitude, table.longitude),
  timestampIdx: index("idx_weather_data_timestamp").on(table.timestamp),
  forecastIdx: index("idx_weather_data_forecast").on(table.isForecast, table.forecastFor),
  expiresIdx: index("idx_weather_data_expires").on(table.expiresAt)
}));

// Weather alerts table
export const weatherAlerts = pgTable("weather_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Alert details
  alertType: weatherAlertTypeEnum("alert_type").notNull(),
  severity: weatherAlertSeverityEnum("severity").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  
  // Location coverage
  affectedAreas: jsonb("affected_areas").notNull().default('[]'), // Array of { lat, lng, radius } or polygon coordinates
  stateCode: varchar("state_code", { length: 2 }),
  countyName: varchar("county_name", { length: 100 }),
  cityName: varchar("city_name", { length: 100 }),
  
  // Time range
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  
  // Status
  isActive: boolean("is_active").notNull().default(true),
  
  // Additional information
  instructions: text("instructions"),
  urgency: varchar("urgency", { length: 20 }), // immediate, expected, future, past
  certainty: varchar("certainty", { length: 20 }), // observed, likely, possible, unlikely
  
  // Source
  source: varchar("source", { length: 50 }).default('mock'),
  externalId: varchar("external_id", { length: 100 }), // ID from external weather service
  
  // Impact metrics
  estimatedImpactRadius: decimal("estimated_impact_radius", { precision: 6, scale: 2 }), // in miles
  affectedJobCount: integer("affected_job_count").default(0),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  activeIdx: index("idx_weather_alerts_active").on(table.isActive),
  severityIdx: index("idx_weather_alerts_severity").on(table.severity),
  timeRangeIdx: index("idx_weather_alerts_time").on(table.startTime, table.endTime),
  alertTypeIdx: index("idx_weather_alerts_type").on(table.alertType)
}));

// Job weather impacts table
export const jobWeatherImpacts = pgTable("job_weather_impacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // References
  jobId: varchar("job_id").notNull().references(() => jobs.id),
  weatherDataId: varchar("weather_data_id").references(() => weatherData.id),
  weatherAlertId: varchar("weather_alert_id").references(() => weatherAlerts.id),
  
  // Impact assessment
  impactLevel: weatherImpactLevelEnum("impact_level").notNull(),
  impactScore: decimal("impact_score", { precision: 5, scale: 2 }).notNull(), // 0-100
  
  // Specific impacts
  safetyRisk: boolean("safety_risk").notNull().default(false),
  delayRisk: boolean("delay_risk").notNull().default(false),
  equipmentRisk: boolean("equipment_risk").notNull().default(false),
  visibilityIssue: boolean("visibility_issue").notNull().default(false),
  
  // Impact details
  impactFactors: jsonb("impact_factors").default('[]'), // Array of { factor, severity, description }
  recommendedActions: text("recommended_actions").array().default(sql`ARRAY[]::text[]`),
  
  // Contractor notification
  contractorNotified: boolean("contractor_notified").notNull().default(false),
  contractorNotifiedAt: timestamp("contractor_notified_at"),
  contractorAcknowledged: boolean("contractor_acknowledged").notNull().default(false),
  contractorAcknowledgedAt: timestamp("contractor_acknowledged_at"),
  
  // Customer notification
  customerNotified: boolean("customer_notified").notNull().default(false),
  customerNotifiedAt: timestamp("customer_notified_at"),
  
  // Notes
  notes: text("notes"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  jobIdx: index("idx_job_weather_impacts_job").on(table.jobId),
  weatherDataIdx: index("idx_job_weather_impacts_weather").on(table.weatherDataId),
  alertIdx: index("idx_job_weather_impacts_alert").on(table.weatherAlertId),
  impactLevelIdx: index("idx_job_weather_impacts_level").on(table.impactLevel),
  safetyIdx: index("idx_job_weather_impacts_safety").on(table.safetyRisk)
}));

// Weather schemas and types
export const insertWeatherDataSchema = createInsertSchema(weatherData).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertWeatherData = z.infer<typeof insertWeatherDataSchema>;
export type WeatherData = typeof weatherData.$inferSelect;
export type SelectWeatherData = typeof weatherData.$inferSelect;

export const insertWeatherAlertSchema = createInsertSchema(weatherAlerts).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertWeatherAlert = z.infer<typeof insertWeatherAlertSchema>;
export type WeatherAlert = typeof weatherAlerts.$inferSelect;
export type SelectWeatherAlert = typeof weatherAlerts.$inferSelect;

export const insertJobWeatherImpactSchema = createInsertSchema(jobWeatherImpacts).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertJobWeatherImpact = z.infer<typeof insertJobWeatherImpactSchema>;
export type JobWeatherImpact = typeof jobWeatherImpacts.$inferSelect;
export type SelectJobWeatherImpact = typeof jobWeatherImpacts.$inferSelect;

// ====================
// EMERGENCY SOS SYSTEM
// ====================

// Emergency SOS enums
export const sosAlertTypeEnum = pgEnum('sos_alert_type', ['medical', 'accident', 'threat', 'mechanical', 'other']);
export const sosSeverityEnum = pgEnum('sos_severity', ['critical', 'high', 'medium', 'low']);
export const sosStatusEnum = pgEnum('sos_status', ['active', 'acknowledged', 'resolved', 'false_alarm', 'cancelled']);
export const sosInitiatorTypeEnum = pgEnum('sos_initiator_type', ['driver', 'contractor', 'fleet_manager', 'dispatcher']);
export const sosResponseActionEnum = pgEnum('sos_response_action', ['acknowledged', 'dispatched', 'arrived', 'assisting', 'escalated', 'resolved', 'cancelled']);
export const emergencyContactPreferenceEnum = pgEnum('emergency_contact_preference', ['sms', 'call', 'email', 'all']);

// Emergency SOS alerts table
export const emergencySosAlerts = pgTable("emergency_sos_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Initiator information
  initiatorId: varchar("initiator_id").notNull().references(() => users.id),
  initiatorType: sosInitiatorTypeEnum("initiator_type").notNull(),
  jobId: varchar("job_id").references(() => jobs.id), // Associated job if any
  
  // Location information
  location: jsonb("location").notNull(), // { lat, lng, accuracy, address }
  locationHistory: jsonb("location_history").default('[]'), // Array of location updates
  
  // Alert details
  alertType: sosAlertTypeEnum("alert_type").notNull(),
  severity: sosSeverityEnum("severity").notNull(),
  message: text("message"),
  
  // Response tracking
  status: sosStatusEnum("status").notNull().default('active'),
  responderId: varchar("responder_id").references(() => users.id),
  responseTime: timestamp("response_time"),
  resolvedAt: timestamp("resolved_at"),
  resolutionNotes: text("resolution_notes"),
  
  // Escalation tracking
  escalationLevel: integer("escalation_level").notNull().default(0),
  escalatedAt: timestamp("escalated_at"),
  autoEscalationEnabled: boolean("auto_escalation_enabled").notNull().default(true),
  
  // Emergency services integration
  emergencyServicesNotified: boolean("emergency_services_notified").notNull().default(false),
  emergencyServicesNotifiedAt: timestamp("emergency_services_notified_at"),
  emergencyServiceReferenceId: varchar("emergency_service_reference_id", { length: 100 }),
  
  // Notification tracking
  notificationsSent: jsonb("notifications_sent").default('[]'), // Array of notification records
  acknowledgments: jsonb("acknowledgments").default('[]'), // Array of acknowledgment records
  
  // False alarm handling
  falseAlarmReason: text("false_alarm_reason"),
  falseAlarmMarkedBy: varchar("false_alarm_marked_by").references(() => users.id),
  
  // Metadata
  deviceInfo: jsonb("device_info"), // Device and app version info
  metadata: jsonb("metadata").default('{}'),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  initiatorIdx: index("idx_emergency_sos_alerts_initiator").on(table.initiatorId),
  statusIdx: index("idx_emergency_sos_alerts_status").on(table.status),
  severityIdx: index("idx_emergency_sos_alerts_severity").on(table.severity),
  jobIdx: index("idx_emergency_sos_alerts_job").on(table.jobId),
  createdAtIdx: index("idx_emergency_sos_alerts_created").on(table.createdAt),
  activeAlertsIdx: index("idx_emergency_sos_alerts_active").on(table.status, table.severity)
}));

// Emergency contacts table
export const emergencyContacts = pgTable("emergency_contacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // User reference
  userId: varchar("user_id").notNull().references(() => users.id),
  
  // Contact information
  contactName: varchar("contact_name", { length: 100 }).notNull(),
  contactPhone: varchar("contact_phone", { length: 20 }).notNull(),
  contactEmail: varchar("contact_email", { length: 100 }),
  relationship: varchar("relationship", { length: 50 }), // e.g., "spouse", "parent", "friend"
  
  // Notification preferences
  isPrimary: boolean("is_primary").notNull().default(false),
  notificationPreference: emergencyContactPreferenceEnum("notification_preference").notNull().default('all'),
  
  // Auto-notification settings
  autoNotifyOnSos: boolean("auto_notify_on_sos").notNull().default(true),
  autoNotifyDelay: integer("auto_notify_delay").default(0), // Delay in seconds before notifying
  
  // Additional info
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  userIdx: index("idx_emergency_contacts_user").on(table.userId),
  primaryIdx: index("idx_emergency_contacts_primary").on(table.userId, table.isPrimary),
  activeIdx: index("idx_emergency_contacts_active").on(table.isActive)
}));

// Emergency response log table
export const emergencyResponseLog = pgTable("emergency_response_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Alert reference
  sosAlertId: varchar("sos_alert_id").notNull().references(() => emergencySosAlerts.id),
  
  // Responder information
  responderId: varchar("responder_id").references(() => users.id),
  responderType: varchar("responder_type", { length: 50 }), // e.g., "contractor", "fleet_manager", "emergency_service"
  
  // Action taken
  action: sosResponseActionEnum("action").notNull(),
  actionDetails: text("action_details"),
  notes: text("notes"),
  
  // Location at time of action
  location: jsonb("location"), // { lat, lng, accuracy }
  
  // Communication record
  communicationMethod: varchar("communication_method", { length: 50 }), // e.g., "sms", "call", "in_app"
  communicationDetails: jsonb("communication_details"),
  
  // Timestamp
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  
  // Metadata
  metadata: jsonb("metadata").default('{}')
}, (table) => ({
  alertIdx: index("idx_emergency_response_log_alert").on(table.sosAlertId),
  responderIdx: index("idx_emergency_response_log_responder").on(table.responderId),
  timestampIdx: index("idx_emergency_response_log_timestamp").on(table.timestamp),
  actionIdx: index("idx_emergency_response_log_action").on(table.action)
}));

// Emergency SOS schemas and types
export const insertEmergencySosAlertSchema = createInsertSchema(emergencySosAlerts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  responseTime: true,
  resolvedAt: true,
  escalatedAt: true,
  emergencyServicesNotifiedAt: true
});
export type InsertEmergencySosAlert = z.infer<typeof insertEmergencySosAlertSchema>;
export type EmergencySosAlert = typeof emergencySosAlerts.$inferSelect;

export const insertEmergencyContactSchema = createInsertSchema(emergencyContacts).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertEmergencyContact = z.infer<typeof insertEmergencyContactSchema>;
export type EmergencyContact = typeof emergencyContacts.$inferSelect;

export const insertEmergencyResponseLogSchema = createInsertSchema(emergencyResponseLog).omit({
  id: true,
  timestamp: true
});
export type InsertEmergencyResponseLog = z.infer<typeof insertEmergencyResponseLogSchema>;
export type EmergencyResponseLog = typeof emergencyResponseLog.$inferSelect;

// ====================
// FUEL TRACKING SYSTEM
// ====================

// Fuel tracking enums
export const fuelTypeEnum = pgEnum('fuel_type', ['diesel', 'regular', 'premium', 'def']);
export const fuelBrandEnum = pgEnum('fuel_brand', ['pilot', 'flying_j', 'loves', 'ta_travel', 'petro', 'speedway', 'shell', 'chevron', 'exxon', 'bp', 'other']);
export const fuelPriceSourceEnum = pgEnum('fuel_price_source', ['manual', 'api', 'crowdsourced', 'mock']);
export const fuelAlertTypeEnum = pgEnum('fuel_alert_type', ['price_drop', 'price_surge', 'low_price_nearby', 'route_savings']);
export const fuelAlertSeverityEnum = pgEnum('fuel_alert_severity', ['info', 'warning', 'critical']);

// Fuel stations table
export const fuelStations = pgTable("fuel_stations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Station information
  name: varchar("name", { length: 200 }).notNull(),
  brand: fuelBrandEnum("brand").notNull(),
  stationCode: varchar("station_code", { length: 50 }).unique(),
  
  // Location
  address: text("address").notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  state: varchar("state", { length: 2 }).notNull(),
  zipCode: varchar("zip_code", { length: 10 }).notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
  longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
  
  // Services available
  hasDiesel: boolean("has_diesel").notNull().default(true),
  hasRegular: boolean("has_regular").notNull().default(true),
  hasPremium: boolean("has_premium").notNull().default(false),
  hasDef: boolean("has_def").notNull().default(true),
  hasTruckParking: boolean("has_truck_parking").notNull().default(false),
  hasShowers: boolean("has_showers").notNull().default(false),
  hasRestaurant: boolean("has_restaurant").notNull().default(false),
  hasScales: boolean("has_scales").notNull().default(false),
  hasRepairShop: boolean("has_repair_shop").notNull().default(false),
  
  // Operating hours
  is24Hours: boolean("is_24_hours").notNull().default(true),
  openingTime: varchar("opening_time", { length: 5 }), // HH:MM format
  closingTime: varchar("closing_time", { length: 5 }), // HH:MM format
  
  // Contact
  phone: varchar("phone", { length: 20 }),
  
  // Status
  isActive: boolean("is_active").notNull().default(true),
  
  // Metadata
  amenities: jsonb("amenities").default('[]'), // Array of available amenities
  metadata: jsonb("metadata").default('{}'),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  locationIdx: index("idx_fuel_stations_location").on(table.latitude, table.longitude),
  brandIdx: index("idx_fuel_stations_brand").on(table.brand),
  stateIdx: index("idx_fuel_stations_state").on(table.state),
  cityIdx: index("idx_fuel_stations_city").on(table.city),
  activeIdx: index("idx_fuel_stations_active").on(table.isActive)
}));

// Fuel prices table
export const fuelPrices = pgTable("fuel_prices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Station reference
  stationId: varchar("station_id").notNull().references(() => fuelStations.id),
  
  // Price information
  fuelType: fuelTypeEnum("fuel_type").notNull(),
  pricePerGallon: decimal("price_per_gallon", { precision: 6, scale: 3 }).notNull(),
  
  // Source and validity
  source: fuelPriceSourceEnum("source").notNull().default('mock'),
  reportedBy: varchar("reported_by").references(() => users.id),
  validFrom: timestamp("valid_from").notNull().defaultNow(),
  validTo: timestamp("valid_to"),
  
  // Price changes
  previousPrice: decimal("previous_price", { precision: 6, scale: 3 }),
  priceChange: decimal("price_change", { precision: 6, scale: 3 }),
  priceChangePercent: decimal("price_change_percent", { precision: 5, scale: 2 }),
  
  // Status
  isCurrent: boolean("is_current").notNull().default(true),
  isVerified: boolean("is_verified").notNull().default(false),
  
  createdAt: timestamp("created_at").notNull().defaultNow()
}, (table) => ({
  stationFuelIdx: uniqueIndex("idx_fuel_prices_station_fuel_current").on(
    table.stationId, 
    table.fuelType, 
    table.isCurrent
  ).where(sql`is_current = true`),
  stationIdx: index("idx_fuel_prices_station").on(table.stationId),
  fuelTypeIdx: index("idx_fuel_prices_fuel_type").on(table.fuelType),
  validFromIdx: index("idx_fuel_prices_valid_from").on(table.validFrom)
}));

// Fuel price history table for tracking historical prices
export const fuelPriceHistory = pgTable("fuel_price_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Station and fuel info
  stationId: varchar("station_id").notNull().references(() => fuelStations.id),
  fuelType: fuelTypeEnum("fuel_type").notNull(),
  
  // Price at specific time
  pricePerGallon: decimal("price_per_gallon", { precision: 6, scale: 3 }).notNull(),
  timestamp: timestamp("timestamp").notNull(),
  
  // Aggregated stats for the period
  hourlyAvg: decimal("hourly_avg", { precision: 6, scale: 3 }),
  dailyAvg: decimal("daily_avg", { precision: 6, scale: 3 }),
  dailyMin: decimal("daily_min", { precision: 6, scale: 3 }),
  dailyMax: decimal("daily_max", { precision: 6, scale: 3 }),
  
  // Source
  source: fuelPriceSourceEnum("source").notNull().default('mock'),
  
  createdAt: timestamp("created_at").notNull().defaultNow()
}, (table) => ({
  stationFuelTimestampIdx: index("idx_fuel_price_history_station_fuel_time").on(
    table.stationId,
    table.fuelType,
    table.timestamp
  ),
  timestampIdx: index("idx_fuel_price_history_timestamp").on(table.timestamp)
}));

// Route fuel stops table for recommended fuel stops along routes
export const routeFuelStops = pgTable("route_fuel_stops", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Route information
  routeId: varchar("route_id").references(() => contractorRoutes.id),
  jobId: varchar("job_id").references(() => jobs.id),
  
  // Station info
  stationId: varchar("station_id").notNull().references(() => fuelStations.id),
  sequenceNumber: integer("sequence_number").notNull(), // Order in route
  
  // Distance and timing
  distanceFromStart: decimal("distance_from_start", { precision: 8, scale: 2 }), // miles
  distanceFromPrevious: decimal("distance_from_previous", { precision: 8, scale: 2 }), // miles
  estimatedArrivalTime: timestamp("estimated_arrival_time"),
  
  // Fuel requirements
  recommendedFuelType: fuelTypeEnum("recommended_fuel_type").notNull(),
  estimatedGallonsNeeded: decimal("estimated_gallons_needed", { precision: 8, scale: 2 }),
  
  // Cost analysis
  estimatedCost: decimal("estimated_cost", { precision: 10, scale: 2 }),
  savingsVsAverage: decimal("savings_vs_average", { precision: 10, scale: 2 }),
  savingsVsNearby: decimal("savings_vs_nearby", { precision: 10, scale: 2 }),
  
  // Optimization score
  optimizationScore: decimal("optimization_score", { precision: 5, scale: 2 }), // 0-100
  scoreFactors: jsonb("score_factors").default('{}'), // { price: 85, detour: 10, amenities: 5 }
  
  // Stop details
  isRecommended: boolean("is_recommended").notNull().default(true),
  isMandatory: boolean("is_mandatory").notNull().default(false),
  skipReason: text("skip_reason"),
  
  // User interaction
  wasSelected: boolean("was_selected").notNull().default(false),
  selectedAt: timestamp("selected_at"),
  selectedBy: varchar("selected_by").references(() => users.id),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  routeIdx: index("idx_route_fuel_stops_route").on(table.routeId),
  jobIdx: index("idx_route_fuel_stops_job").on(table.jobId),
  stationIdx: index("idx_route_fuel_stops_station").on(table.stationId),
  sequenceIdx: index("idx_route_fuel_stops_sequence").on(table.routeId, table.sequenceNumber)
}));

// Fuel price alerts table
export const fuelPriceAlerts = pgTable("fuel_price_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Alert configuration
  userId: varchar("user_id").references(() => users.id),
  fleetAccountId: varchar("fleet_account_id").references(() => fleetAccounts.id),
  
  // Alert type and criteria
  alertType: fuelAlertTypeEnum("alert_type").notNull(),
  fuelType: fuelTypeEnum("fuel_type").notNull(),
  
  // Location criteria
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  radius: decimal("radius", { precision: 6, scale: 2 }), // miles
  state: varchar("state", { length: 2 }),
  
  // Price thresholds
  priceThreshold: decimal("price_threshold", { precision: 6, scale: 3 }),
  percentChangeThreshold: decimal("percent_change_threshold", { precision: 5, scale: 2 }),
  
  // Alert details
  severity: fuelAlertSeverityEnum("severity").notNull().default('info'),
  message: text("message"),
  
  // Trigger information
  triggeredAt: timestamp("triggered_at"),
  triggeredByStationId: varchar("triggered_by_station_id").references(() => fuelStations.id),
  triggeredPrice: decimal("triggered_price", { precision: 6, scale: 3 }),
  
  // Notification status
  notificationSent: boolean("notification_sent").notNull().default(false),
  notificationSentAt: timestamp("notification_sent_at"),
  acknowledged: boolean("acknowledged").notNull().default(false),
  acknowledgedAt: timestamp("acknowledged_at"),
  
  // Alert settings
  isActive: boolean("is_active").notNull().default(true),
  expiresAt: timestamp("expires_at"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  userIdx: index("idx_fuel_price_alerts_user").on(table.userId),
  fleetIdx: index("idx_fuel_price_alerts_fleet").on(table.fleetAccountId),
  activeIdx: index("idx_fuel_price_alerts_active").on(table.isActive),
  alertTypeIdx: index("idx_fuel_price_alerts_type").on(table.alertType),
  locationIdx: index("idx_fuel_price_alerts_location").on(table.latitude, table.longitude)
}));

// Regional fuel price aggregates for trend analysis
export const fuelPriceAggregates = pgTable("fuel_price_aggregates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Region information
  state: varchar("state", { length: 2 }).notNull(),
  city: varchar("city", { length: 100 }),
  zipCode: varchar("zip_code", { length: 10 }),
  
  // Time period
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  periodType: varchar("period_type", { length: 20 }).notNull(), // hourly, daily, weekly, monthly
  
  // Fuel type
  fuelType: fuelTypeEnum("fuel_type").notNull(),
  
  // Aggregated prices
  avgPrice: decimal("avg_price", { precision: 6, scale: 3 }).notNull(),
  minPrice: decimal("min_price", { precision: 6, scale: 3 }).notNull(),
  maxPrice: decimal("max_price", { precision: 6, scale: 3 }).notNull(),
  medianPrice: decimal("median_price", { precision: 6, scale: 3 }),
  
  // Statistics
  priceStdDev: decimal("price_std_dev", { precision: 6, scale: 3 }),
  sampleSize: integer("sample_size").notNull(),
  stationCount: integer("station_count").notNull(),
  
  // Trends
  priceChange: decimal("price_change", { precision: 6, scale: 3 }),
  priceChangePercent: decimal("price_change_percent", { precision: 5, scale: 2 }),
  trend: varchar("trend", { length: 20 }), // rising, falling, stable
  
  createdAt: timestamp("created_at").notNull().defaultNow()
}, (table) => ({
  regionPeriodIdx: uniqueIndex("idx_fuel_price_aggregates_unique").on(
    table.state,
    table.city,
    table.periodStart,
    table.periodType,
    table.fuelType
  ),
  stateIdx: index("idx_fuel_price_aggregates_state").on(table.state),
  periodIdx: index("idx_fuel_price_aggregates_period").on(table.periodStart, table.periodEnd),
  fuelTypeIdx: index("idx_fuel_price_aggregates_fuel_type").on(table.fuelType)
}));

// Fuel schemas and types
export const insertFuelStationSchema = createInsertSchema(fuelStations).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertFuelStation = z.infer<typeof insertFuelStationSchema>;
export type FuelStation = typeof fuelStations.$inferSelect;

export const insertFuelPriceSchema = createInsertSchema(fuelPrices).omit({
  id: true,
  createdAt: true,
  validFrom: true
});
export type InsertFuelPrice = z.infer<typeof insertFuelPriceSchema>;
export type FuelPrice = typeof fuelPrices.$inferSelect;

export const insertFuelPriceHistorySchema = createInsertSchema(fuelPriceHistory).omit({
  id: true,
  createdAt: true
});
export type InsertFuelPriceHistory = z.infer<typeof insertFuelPriceHistorySchema>;
export type FuelPriceHistory = typeof fuelPriceHistory.$inferSelect;

export const insertRouteFuelStopSchema = createInsertSchema(routeFuelStops).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertRouteFuelStop = z.infer<typeof insertRouteFuelStopSchema>;
export type RouteFuelStop = typeof routeFuelStops.$inferSelect;

export const insertFuelPriceAlertSchema = createInsertSchema(fuelPriceAlerts).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertFuelPriceAlert = z.infer<typeof insertFuelPriceAlertSchema>;
export type FuelPriceAlert = typeof fuelPriceAlerts.$inferSelect;

export const insertFuelPriceAggregateSchema = createInsertSchema(fuelPriceAggregates).omit({
  id: true,
  createdAt: true
});
export type InsertFuelPriceAggregate = z.infer<typeof insertFuelPriceAggregateSchema>;
export type FuelPriceAggregate = typeof fuelPriceAggregates.$inferSelect;

// ====================
// PAYMENT RECONCILIATION & COMMISSIONS
// ====================

// Enums for commission and reconciliation
export const commissionUserTypeEnum = pgEnum('commission_user_type', ['contractor', 'fleet', 'admin', 'platform']);
export const commissionStatusEnum = pgEnum('commission_status', ['pending', 'calculated', 'approved', 'paid', 'disputed', 'adjusted']);
export const reconciliationStatusEnum = pgEnum('reconciliation_status', ['pending', 'processing', 'completed', 'failed', 'disputed']);
export const reconciliationPeriodEnum = pgEnum('reconciliation_period', ['daily', 'weekly', 'monthly', 'quarterly']);
export const payoutBatchStatusEnum = pgEnum('payout_batch_status', ['pending', 'processing', 'sent', 'completed', 'failed', 'cancelled']);

// Commission rules for different user types and tiers
export const commissionRules = pgTable("commission_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Rule configuration
  userType: commissionUserTypeEnum("user_type").notNull(),
  ruleName: varchar("rule_name", { length: 100 }).notNull(),
  description: text("description"),
  
  // Commission percentages and fees
  commissionPercentage: decimal("commission_percentage", { precision: 5, scale: 2 }).notNull(), // e.g., 15.00 for 15%
  flatFee: decimal("flat_fee", { precision: 10, scale: 2 }).default('0'),
  
  // Tiered commission based on volume
  minAmount: decimal("min_amount", { precision: 10, scale: 2 }).default('0'),
  maxAmount: decimal("max_amount", { precision: 10, scale: 2 }),
  
  // Volume-based tier thresholds (monthly volume)
  minMonthlyVolume: decimal("min_monthly_volume", { precision: 12, scale: 2 }),
  maxMonthlyVolume: decimal("max_monthly_volume", { precision: 12, scale: 2 }),
  
  // Surge pricing adjustments
  surgeMultiplier: decimal("surge_multiplier", { precision: 4, scale: 2 }).default('1.00'),
  surgeCap: decimal("surge_cap", { precision: 10, scale: 2 }), // Maximum commission during surge
  
  // Priority and status
  priority: integer("priority").notNull().default(0), // Higher priority rules apply first
  isActive: boolean("is_active").notNull().default(true),
  
  // Applicable date range
  effectiveFrom: timestamp("effective_from").notNull().defaultNow(),
  effectiveTo: timestamp("effective_to"),
  
  // Metadata
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  createdBy: varchar("created_by").references(() => users.id)
}, (table) => ({
  userTypeIdx: index("idx_commission_rules_user_type").on(table.userType),
  activeIdx: index("idx_commission_rules_active").on(table.isActive),
  priorityIdx: index("idx_commission_rules_priority").on(table.priority),
  effectiveIdx: index("idx_commission_rules_effective").on(table.effectiveFrom, table.effectiveTo),
  volumeIdx: index("idx_commission_rules_volume").on(table.minMonthlyVolume, table.maxMonthlyVolume)
}));

// Individual commission transactions
export const commissionTransactions = pgTable("commission_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Related entities
  jobId: varchar("job_id").notNull().references(() => jobs.id),
  contractorId: varchar("contractor_id").notNull().references(() => users.id),
  ruleId: varchar("rule_id").references(() => commissionRules.id),
  
  // Transaction amounts
  baseAmount: decimal("base_amount", { precision: 10, scale: 2 }).notNull(), // Job total before commission
  commissionAmount: decimal("commission_amount", { precision: 10, scale: 2 }).notNull(),
  platformFeeAmount: decimal("platform_fee_amount", { precision: 10, scale: 2 }).notNull(),
  netPayoutAmount: decimal("net_payout_amount", { precision: 10, scale: 2 }).notNull(), // Amount contractor receives
  
  // Commission details
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).notNull(), // Percentage applied
  flatFeeApplied: decimal("flat_fee_applied", { precision: 10, scale: 2 }).default('0'),
  surgeMultiplierApplied: decimal("surge_multiplier_applied", { precision: 4, scale: 2 }).default('1.00'),
  
  // Status tracking
  status: commissionStatusEnum("status").notNull().default('pending'),
  calculatedAt: timestamp("calculated_at"),
  approvedAt: timestamp("approved_at"),
  paidAt: timestamp("paid_at"),
  
  // Reconciliation reference
  reconciliationId: varchar("reconciliation_id").references(() => paymentReconciliation.id),
  payoutBatchId: varchar("payout_batch_id").references(() => payoutBatches.id),
  
  // Dispute/adjustment tracking
  isDisputed: boolean("is_disputed").notNull().default(false),
  disputeReason: text("dispute_reason"),
  adjustmentAmount: decimal("adjustment_amount", { precision: 10, scale: 2 }).default('0'),
  adjustmentReason: text("adjustment_reason"),
  
  // Metadata
  metadata: jsonb("metadata"), // Additional transaction details
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  processedAt: timestamp("processed_at")
}, (table) => ({
  jobIdx: uniqueIndex("idx_commission_transactions_job").on(table.jobId),
  contractorIdx: index("idx_commission_transactions_contractor").on(table.contractorId),
  statusIdx: index("idx_commission_transactions_status").on(table.status),
  reconciliationIdx: index("idx_commission_transactions_reconciliation").on(table.reconciliationId),
  batchIdx: index("idx_commission_transactions_batch").on(table.payoutBatchId),
  createdIdx: index("idx_commission_transactions_created").on(table.createdAt),
  disputedIdx: index("idx_commission_transactions_disputed").on(table.isDisputed)
}));

// Payment reconciliation periods
export const paymentReconciliation = pgTable("payment_reconciliation", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Period information
  periodType: reconciliationPeriodEnum("period_type").notNull(),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  
  // Financial totals
  totalRevenue: decimal("total_revenue", { precision: 12, scale: 2 }).notNull(),
  totalCommissions: decimal("total_commissions", { precision: 12, scale: 2 }).notNull(),
  totalPlatformFees: decimal("total_platform_fees", { precision: 12, scale: 2 }).notNull(),
  totalPayouts: decimal("total_payouts", { precision: 12, scale: 2 }).notNull(),
  totalAdjustments: decimal("total_adjustments", { precision: 12, scale: 2 }).default('0'),
  totalRefunds: decimal("total_refunds", { precision: 12, scale: 2 }).default('0'),
  
  // Job and transaction counts
  jobCount: integer("job_count").notNull().default(0),
  transactionCount: integer("transaction_count").notNull().default(0),
  contractorCount: integer("contractor_count").notNull().default(0),
  
  // Status
  status: reconciliationStatusEnum("status").notNull().default('pending'),
  
  // Processing timestamps
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  reconciledAt: timestamp("reconciled_at"),
  
  // Report generation
  reportUrl: text("report_url"),
  reportGeneratedAt: timestamp("report_generated_at"),
  csvExportUrl: text("csv_export_url"),
  
  // Error tracking
  errorMessage: text("error_message"),
  retryCount: integer("retry_count").default(0),
  
  // Metadata
  notes: text("notes"),
  metadata: jsonb("metadata"), // Additional reconciliation data
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  createdBy: varchar("created_by").references(() => users.id)
}, (table) => ({
  periodIdx: uniqueIndex("idx_payment_reconciliation_period").on(table.periodType, table.periodStart, table.periodEnd),
  statusIdx: index("idx_payment_reconciliation_status").on(table.status),
  periodStartIdx: index("idx_payment_reconciliation_start").on(table.periodStart),
  periodEndIdx: index("idx_payment_reconciliation_end").on(table.periodEnd)
}));

// Payout batches for contractors
export const payoutBatches = pgTable("payout_batches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Batch information
  batchNumber: varchar("batch_number", { length: 50 }).unique(),
  contractorId: varchar("contractor_id").notNull().references(() => users.id),
  reconciliationId: varchar("reconciliation_id").references(() => paymentReconciliation.id),
  
  // Period
  periodType: reconciliationPeriodEnum("period_type").notNull(),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  
  // Financial details
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  commissionAmount: decimal("commission_amount", { precision: 10, scale: 2 }).notNull(),
  adjustmentAmount: decimal("adjustment_amount", { precision: 10, scale: 2 }).default('0'),
  netPayoutAmount: decimal("net_payout_amount", { precision: 10, scale: 2 }).notNull(),
  
  // Job details
  jobCount: integer("job_count").notNull().default(0),
  jobIds: jsonb("job_ids"), // Array of job IDs included in this batch
  
  // Payment method
  paymentMethod: varchar("payment_method", { length: 50 }), // 'bank_transfer', 'check', 'stripe', etc.
  paymentReference: varchar("payment_reference", { length: 100 }), // Transaction ID, check number, etc.
  
  // Status
  status: payoutBatchStatusEnum("status").notNull().default('pending'),
  
  // Processing timestamps
  processedAt: timestamp("processed_at"),
  paidAt: timestamp("paid_at"),
  failedAt: timestamp("failed_at"),
  cancelledAt: timestamp("cancelled_at"),
  
  // Error handling
  failureReason: text("failure_reason"),
  retryCount: integer("retry_count").default(0),
  lastRetryAt: timestamp("last_retry_at"),
  
  // Metadata
  notes: text("notes"),
  metadata: jsonb("metadata"), // Additional batch data
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  createdBy: varchar("created_by").references(() => users.id)
}, (table) => ({
  batchNumberIdx: uniqueIndex("idx_payout_batches_batch_number").on(table.batchNumber),
  contractorIdx: index("idx_payout_batches_contractor").on(table.contractorId),
  reconciliationIdx: index("idx_payout_batches_reconciliation").on(table.reconciliationId),
  statusIdx: index("idx_payout_batches_status").on(table.status),
  periodIdx: index("idx_payout_batches_period").on(table.periodStart, table.periodEnd),
  createdIdx: index("idx_payout_batches_created").on(table.createdAt)
}));

// ====================
// SERVICE HISTORY TABLES
// ====================

// Service history related enums
export const serviceHistoryTypeEnum = pgEnum('service_history_type', [
  'oil_change',
  'tire_rotation',
  'brake_service', 
  'transmission_service',
  'coolant_flush',
  'air_filter',
  'fuel_filter',
  'inspection',
  'major_repair',
  'battery_replacement',
  'alignment',
  'differential_service',
  'power_steering_flush',
  'spark_plug_replacement',
  'belt_replacement',
  'wiper_replacement',
  'other'
]);

export const servicePriorityEnum = pgEnum('service_priority', ['low', 'medium', 'high', 'critical']);
export const maintenanceLogTypeEnum = pgEnum('maintenance_log_type', ['service', 'inspection', 'repair', 'note', 'warranty']);

// Service History table - tracks all completed maintenance and repairs
export const serviceHistory = pgTable("service_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // References
  jobId: varchar("job_id").references(() => jobs.id),
  vehicleId: varchar("vehicle_id").notNull().references(() => fleetVehicles.id),
  contractorId: varchar("contractor_id").references(() => users.id),
  fleetAccountId: varchar("fleet_account_id").references(() => fleetAccounts.id),
  
  // Service details
  serviceType: serviceHistoryTypeEnum("service_type").notNull(),
  serviceDate: timestamp("service_date").notNull(),
  description: text("description"),
  mileage: integer("mileage"),
  
  // Parts and labor
  partsUsed: jsonb("parts_used"), // Array of {partName, partNumber, quantity, unitCost}
  laborHours: decimal("labor_hours", { precision: 5, scale: 2 }),
  
  // Costs
  partsCost: decimal("parts_cost", { precision: 10, scale: 2 }),
  laborCost: decimal("labor_cost", { precision: 10, scale: 2 }),
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }),
  
  // Warranty
  warrantyInfo: jsonb("warranty_info"), // {provider, duration, expirationDate, terms}
  warrantyExpiresAt: timestamp("warranty_expires_at"),
  
  // Additional info
  invoiceId: varchar("invoice_id").references(() => invoices.id),
  notes: text("notes"),
  attachments: jsonb("attachments"), // Array of file URLs
  metadata: jsonb("metadata"),
  
  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  performedBy: varchar("performed_by", { length: 255 })
}, (table) => ({
  vehicleIdx: index("idx_service_history_vehicle").on(table.vehicleId),
  jobIdx: index("idx_service_history_job").on(table.jobId),
  contractorIdx: index("idx_service_history_contractor").on(table.contractorId),
  serviceDateIdx: index("idx_service_history_date").on(table.serviceDate),
  serviceTypeIdx: index("idx_service_history_type").on(table.serviceType)
}));

// Service Schedules table - tracks maintenance intervals
export const serviceSchedules = pgTable("service_schedules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // References
  vehicleId: varchar("vehicle_id").notNull().references(() => fleetVehicles.id),
  fleetAccountId: varchar("fleet_account_id").references(() => fleetAccounts.id),
  
  // Service type and intervals
  serviceType: serviceHistoryTypeEnum("service_type").notNull(),
  intervalMiles: integer("interval_miles"),
  intervalMonths: integer("interval_months"),
  
  // Tracking
  lastServiceDate: timestamp("last_service_date"),
  lastServiceMileage: integer("last_service_mileage"),
  nextDueDate: timestamp("next_due_date"),
  nextDueMileage: integer("next_due_mileage"),
  
  // Status and alerts
  isOverdue: boolean("is_overdue").notNull().default(false),
  overdueBy: integer("overdue_by"), // Days or miles overdue
  alertSentAt: timestamp("alert_sent_at"),
  
  // Configuration
  isActive: boolean("is_active").notNull().default(true),
  customNotes: text("custom_notes"),
  metadata: jsonb("metadata"),
  
  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  vehicleServiceIdx: uniqueIndex("idx_service_schedules_vehicle_service").on(table.vehicleId, table.serviceType),
  vehicleIdx: index("idx_service_schedules_vehicle").on(table.vehicleId),
  nextDueDateIdx: index("idx_service_schedules_next_due_date").on(table.nextDueDate),
  overdueIdx: index("idx_service_schedules_overdue").on(table.isOverdue)
}));

// Service Recommendations table - AI-generated or manual recommendations
export const serviceRecommendations = pgTable("service_recommendations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // References
  vehicleId: varchar("vehicle_id").notNull().references(() => fleetVehicles.id),
  fleetAccountId: varchar("fleet_account_id").references(() => fleetAccounts.id),
  
  // Recommendation details
  serviceType: serviceHistoryTypeEnum("service_type").notNull(),
  priority: servicePriorityEnum("priority").notNull().default('medium'),
  recommendedDate: timestamp("recommended_date"),
  reason: text("reason").notNull(),
  estimatedCost: decimal("estimated_cost", { precision: 10, scale: 2 }),
  
  // Source and status
  generatedBy: varchar("generated_by", { length: 50 }), // 'system', 'ai', 'manual'
  isCompleted: boolean("is_completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  completedJobId: varchar("completed_job_id").references(() => jobs.id),
  
  // Dismissal
  isDismissed: boolean("is_dismissed").notNull().default(false),
  dismissedAt: timestamp("dismissed_at"),
  dismissedBy: varchar("dismissed_by").references(() => users.id),
  dismissalReason: text("dismissal_reason"),
  
  // Additional data
  confidence: decimal("confidence", { precision: 3, scale: 2 }), // AI confidence 0-1
  supportingData: jsonb("supporting_data"), // Telemetry, patterns, etc.
  metadata: jsonb("metadata"),
  
  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  vehicleIdx: index("idx_service_recommendations_vehicle").on(table.vehicleId),
  priorityIdx: index("idx_service_recommendations_priority").on(table.priority),
  completedIdx: index("idx_service_recommendations_completed").on(table.isCompleted),
  recommendedDateIdx: index("idx_service_recommendations_date").on(table.recommendedDate)
}));

// Vehicle Maintenance Log table - general maintenance notes and records
export const vehicleMaintenanceLogs = pgTable("vehicle_maintenance_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // References
  vehicleId: varchar("vehicle_id").notNull().references(() => fleetVehicles.id),
  fleetAccountId: varchar("fleet_account_id").references(() => fleetAccounts.id),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  
  // Log details
  logType: maintenanceLogTypeEnum("log_type").notNull(),
  entryDate: timestamp("entry_date").notNull(),
  notes: text("notes").notNull(),
  attachments: jsonb("attachments"), // Array of file URLs
  
  // Additional references
  relatedJobId: varchar("related_job_id").references(() => jobs.id),
  relatedServiceId: varchar("related_service_id").references(() => serviceHistory.id),
  
  // Metadata
  mileageAtEntry: integer("mileage_at_entry"),
  metadata: jsonb("metadata"),
  
  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  vehicleIdx: index("idx_vehicle_maintenance_logs_vehicle").on(table.vehicleId),
  entryDateIdx: index("idx_vehicle_maintenance_logs_date").on(table.entryDate),
  logTypeIdx: index("idx_vehicle_maintenance_logs_type").on(table.logType),
  createdByIdx: index("idx_vehicle_maintenance_logs_created_by").on(table.createdBy)
}));

// ====================
// SERVICE AREAS AND COMMISSION
// ====================

// Commission type enum
export const commissionTypeEnum = pgEnum('commission_type', ['percentage', 'flat']);

// Service Areas table - manages cities/regions where services are offered
export const serviceAreas = pgTable("service_areas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Area details
  name: text("name").notNull(),
  type: varchar("type", { length: 20 }).notNull(),
  coordinates: jsonb("coordinates").notNull(),
  
  // Surcharge settings
  surchargeType: serviceAreaSurchargeTypeEnum("surcharge_type"),
  surchargeAmount: decimal("surcharge_amount", { precision: 8, scale: 2 }),
  surchargePercentage: decimal("surcharge_percentage", { precision: 5, scale: 2 }),
  
  // Status
  isActive: boolean("is_active").notNull().default(true),
  
  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  nameIdx: index("idx_service_areas_name").on(table.name),
  activeIdx: index("idx_service_areas_active").on(table.isActive),
  typeIdx: index("idx_service_areas_type").on(table.type)
}));

// Commission Settings table - global commission configuration
export const commissionSettings = pgTable("commission_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Commission configuration
  commissionType: commissionTypeEnum("commission_type").notNull(),
  commissionValue: decimal("commission_value", { precision: 10, scale: 2 }).notNull(), // Percentage (0-100) or flat amount
  
  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

// Contractor Pricing table - individual contractor pricing settings
export const contractorPricing = pgTable("contractor_pricing", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // References
  contractorId: varchar("contractor_id").notNull().references(() => users.id).unique(),
  
  // Pricing settings
  baseHourlyRate: decimal("base_hourly_rate", { precision: 10, scale: 2 }).notNull(),
  partsMarkupPercent: decimal("parts_markup_percent", { precision: 5, scale: 2 }).notNull().default('0'),
  
  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  contractorIdx: uniqueIndex("idx_contractor_pricing_contractor").on(table.contractorId)
}));

// Contractor Service Areas junction table - links contractors to service areas
export const contractorServiceAreas = pgTable("contractor_service_areas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // References
  contractorId: varchar("contractor_id").notNull().references(() => users.id),
  serviceAreaId: varchar("service_area_id").notNull().references(() => serviceAreas.id),
  
  // Settings
  isActive: boolean("is_active").notNull().default(true),
  maxDistanceMiles: decimal("max_distance_miles", { precision: 6, scale: 2 }), // Optional override for contractor's max distance in this area
  customRateMultiplier: decimal("custom_rate_multiplier", { precision: 4, scale: 2 }), // Optional area-specific rate adjustment for this contractor
  
  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  contractorAreaIdx: uniqueIndex("idx_contractor_service_areas_unique").on(table.contractorId, table.serviceAreaId),
  contractorIdx: index("idx_contractor_service_areas_contractor").on(table.contractorId),
  areaIdx: index("idx_contractor_service_areas_area").on(table.serviceAreaId),
  activeIdx: index("idx_contractor_service_areas_active").on(table.isActive)
}));

// ====================
// BOOKING PREFERENCES
// ====================

export const bookingPreferences = pgTable("booking_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  
  // Preferred contractors and services
  preferredContractorIds: text("preferred_contractor_ids").array(),
  preferredServiceTimes: jsonb("preferred_service_times"), // { mornings: boolean, afternoons: boolean, evenings: boolean, weekends: boolean, preferredHours: string[] }
  preferredPaymentMethods: text("preferred_payment_methods").array(), // array of payment method types
  
  // Auto-accept settings
  autoAcceptBids: boolean("auto_accept_bids").notNull().default(false),
  maxAutoAcceptPrice: decimal("max_auto_accept_price", { precision: 10, scale: 2 }),
  minContractorRating: decimal("min_contractor_rating", { precision: 3, scale: 2 }),
  maxResponseTimeMinutes: integer("max_response_time_minutes"),
  
  // Notification preferences
  notificationPreferences: jsonb("notification_preferences"), // { email: boolean, sms: boolean, push: boolean, frequency: string, types: string[] }
  notificationEmail: text("notification_email"),
  notificationPhone: varchar("notification_phone", { length: 20 }),
  
  // Location preferences
  defaultLocationLat: decimal("default_location_lat", { precision: 9, scale: 6 }),
  defaultLocationLng: decimal("default_location_lng", { precision: 9, scale: 6 }),
  defaultLocationAddress: text("default_location_address"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  userIdx: uniqueIndex("idx_booking_preferences_user").on(table.userId)
}));

export const contractorBlacklist = pgTable("contractor_blacklist", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  contractorId: varchar("contractor_id").notNull().references(() => users.id),
  reason: text("reason"),
  blockedAt: timestamp("blocked_at").notNull().defaultNow(),
  unblockedAt: timestamp("unblocked_at")
}, (table) => ({
  userContractorIdx: uniqueIndex("idx_contractor_blacklist_user_contractor").on(table.userId, table.contractorId),
  contractorIdx: index("idx_contractor_blacklist_contractor").on(table.contractorId)
}));

export const favoriteContractors = pgTable("favorite_contractors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  contractorId: varchar("contractor_id").notNull().references(() => users.id),
  notes: text("notes"),
  priority: integer("priority").notNull().default(0), // Higher number = higher priority
  favoritedAt: timestamp("favorited_at").notNull().defaultNow()
}, (table) => ({
  userContractorIdx: uniqueIndex("idx_favorite_contractors_user_contractor").on(table.userId, table.contractorId),
  userPriorityIdx: index("idx_favorite_contractors_user_priority").on(table.userId, table.priority)
}));

export const bookingTemplates = pgTable("booking_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  templateName: text("template_name").notNull(),
  serviceType: varchar("service_type").references(() => serviceTypes.id),
  vehicleId: varchar("vehicle_id").references(() => fleetVehicles.id),
  
  // Location preferences
  locationPreferences: jsonb("location_preferences"), // { lat, lng, address, landmark }
  
  // Service details
  specialInstructions: text("special_instructions"),
  urgencyLevel: varchar("urgency_level", { length: 20 }), // 'low', 'normal', 'high', 'urgent'
  preferredTimeSlots: jsonb("preferred_time_slots"), // Array of preferred time windows
  
  // Payment preferences
  preferredPaymentMethod: varchar("preferred_payment_method", { length: 50 }),
  maxBudget: decimal("max_budget", { precision: 10, scale: 2 }),
  
  // Contractor preferences
  preferredContractorIds: text("preferred_contractor_ids").array(),
  autoSelectContractor: boolean("auto_select_contractor").notNull().default(false),
  
  isDefault: boolean("is_default").notNull().default(false),
  usageCount: integer("usage_count").notNull().default(0),
  lastUsedAt: timestamp("last_used_at"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  userIdx: index("idx_booking_templates_user").on(table.userId),
  userDefaultIdx: index("idx_booking_templates_user_default").on(table.userId, table.isDefault)
}));

// Service History schemas and types
export const insertServiceHistorySchema = createInsertSchema(serviceHistory).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertServiceHistory = z.infer<typeof insertServiceHistorySchema>;
export type ServiceHistory = typeof serviceHistory.$inferSelect;

export const insertServiceScheduleSchema = createInsertSchema(serviceSchedules).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertServiceSchedule = z.infer<typeof insertServiceScheduleSchema>;
export type ServiceSchedule = typeof serviceSchedules.$inferSelect;

export const insertServiceRecommendationSchema = createInsertSchema(serviceRecommendations).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertServiceRecommendation = z.infer<typeof insertServiceRecommendationSchema>;
export type ServiceRecommendation = typeof serviceRecommendations.$inferSelect;

export const insertVehicleMaintenanceLogSchema = createInsertSchema(vehicleMaintenanceLogs).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertVehicleMaintenanceLog = z.infer<typeof insertVehicleMaintenanceLogSchema>;
export type VehicleMaintenanceLog = typeof vehicleMaintenanceLogs.$inferSelect;

// Commission and reconciliation schemas and types
export const insertCommissionRuleSchema = createInsertSchema(commissionRules).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertCommissionRule = z.infer<typeof insertCommissionRuleSchema>;
export type CommissionRule = typeof commissionRules.$inferSelect;

export const insertCommissionTransactionSchema = createInsertSchema(commissionTransactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  processedAt: true
});
export type InsertCommissionTransaction = z.infer<typeof insertCommissionTransactionSchema>;
export type CommissionTransaction = typeof commissionTransactions.$inferSelect;

export const insertPaymentReconciliationSchema = createInsertSchema(paymentReconciliation).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertPaymentReconciliation = z.infer<typeof insertPaymentReconciliationSchema>;
export type PaymentReconciliation = typeof paymentReconciliation.$inferSelect;

export const insertPayoutBatchSchema = createInsertSchema(payoutBatches).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertPayoutBatch = z.infer<typeof insertPayoutBatchSchema>;
export type PayoutBatch = typeof payoutBatches.$inferSelect;

// Booking Preferences schemas and types
export const insertBookingPreferencesSchema = createInsertSchema(bookingPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertBookingPreferences = z.infer<typeof insertBookingPreferencesSchema>;
export type BookingPreferences = typeof bookingPreferences.$inferSelect;

export const insertContractorBlacklistSchema = createInsertSchema(contractorBlacklist).omit({
  id: true,
  blockedAt: true
});
export type InsertContractorBlacklist = z.infer<typeof insertContractorBlacklistSchema>;
export type ContractorBlacklist = typeof contractorBlacklist.$inferSelect;

export const insertFavoriteContractorsSchema = createInsertSchema(favoriteContractors).omit({
  id: true,
  favoritedAt: true
});
export type InsertFavoriteContractor = z.infer<typeof insertFavoriteContractorsSchema>;
export type FavoriteContractor = typeof favoriteContractors.$inferSelect;

export const insertBookingTemplateSchema = createInsertSchema(bookingTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  usageCount: true,
  lastUsedAt: true
});
export type InsertBookingTemplate = z.infer<typeof insertBookingTemplateSchema>;
export type BookingTemplate = typeof bookingTemplates.$inferSelect;

// Service Areas and Commission schemas and types
export const insertServiceAreaSchema = createInsertSchema(serviceAreas, {
  // Override decimal fields to accept numbers instead of strings
  surchargeAmount: z.number().min(0).max(999999.99).optional(),
  surchargePercentage: z.number().min(0).max(999.99).optional(),
  coordinates: z.any() // jsonb field
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertServiceArea = z.infer<typeof insertServiceAreaSchema>;
export type ServiceArea = typeof serviceAreas.$inferSelect;

export const insertCommissionSettingsSchema = createInsertSchema(commissionSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertCommissionSettings = z.infer<typeof insertCommissionSettingsSchema>;
export type CommissionSettings = typeof commissionSettings.$inferSelect;

export const insertContractorPricingSchema = createInsertSchema(contractorPricing).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertContractorPricing = z.infer<typeof insertContractorPricingSchema>;
export type ContractorPricing = typeof contractorPricing.$inferSelect;

export const insertContractorServiceAreasSchema = createInsertSchema(contractorServiceAreas).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertContractorServiceAreas = z.infer<typeof insertContractorServiceAreasSchema>;
export type ContractorServiceAreas = typeof contractorServiceAreas.$inferSelect;

