import { 
  users, 
  sessions,
  passwordResetTokens,
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
  messageReadReceipts,
  jobStatusHistory,
  contractorServices,
  contractorAvailability,
  vacationRequests,
  availabilityOverrides,
  contractorCoverage,
  contractorEarnings,
  reviews,
  reviewVotes,
  contractorDocuments,
  pricingRules,
  paymentMethods,
  transactions,
  invoices,
  invoiceDefaults,
  invoiceLineItems,
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
  pushSubscriptions,
  pushNotifications,
  contractorApplications,
  fleetApplications,
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
  bookingSettings,
  bookingBlacklist,
  contractorRoutes,
  routeStops,
  routeWaypoints,
  weatherData,
  weatherAlerts,
  jobWeatherImpacts,
  commissionRules,
  commissionTransactions,
  paymentReconciliation,
  payoutBatches,
  serviceHistory,
  serviceSchedules,
  serviceRecommendations,
  vehicleMaintenanceLogs,
  type ServiceHistory,
  type InsertServiceHistory,
  type ServiceSchedule,
  type InsertServiceSchedule,
  type ServiceRecommendation,
  type InsertServiceRecommendation,
  type VehicleMaintenanceLog,
  type InsertVehicleMaintenanceLog,
  type CommissionRule,
  type InsertCommissionRule,
  type CommissionTransaction,
  type InsertCommissionTransaction,
  type PaymentReconciliation,
  type InsertPaymentReconciliation,
  type PayoutBatch,
  type InsertPayoutBatch,
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
  type PmSchedule,
  type InsertPmSchedule,
  pmSchedules,
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
  type MessageReadReceipt,
  type InsertMessageReadReceipt,
  type JobStatusHistory,
  type InsertJobStatusHistory,
  type ContractorService,
  type InsertContractorService,
  type ContractorAvailability,
  type InsertContractorAvailability,
  type VacationRequest,
  type InsertVacationRequest,
  type AvailabilityOverride,
  type InsertAvailabilityOverride,
  type ContractorCoverage,
  type InsertContractorCoverage,
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
  type InvoiceDefault,
  type InsertInvoiceDefault,
  type InvoiceLineItem,
  type InsertInvoiceLineItem,
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
  type PushSubscription,
  type InsertPushSubscription,
  type PushNotification,
  type InsertPushNotification,
  type ContractorApplication,
  type InsertContractorApplication,
  type FleetApplication,
  type InsertFleetApplication,
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
  contractorJobQueue,
  locationTracking,
  locationHistory,
  trackingSessions,
  geofenceEvents,
  type LocationTracking,
  type InsertLocationTracking,
  type LocationHistory,
  type InsertLocationHistory,
  type TrackingSession,
  type InsertTrackingSession,
  type GeofenceEvent,
  type InsertGeofenceEvent,
  type VehicleAnalytics,
  type InsertVehicleAnalytics,
  type BreakdownPattern,
  type InsertBreakdownPattern,
  type FleetAnalyticsAlert,
  type InsertFleetAnalyticsAlert,
  type FleetContract,
  type InsertFleetContract,
  type ContractorJobQueue,
  type InsertContractorJobQueue,
  type ContractSlaMetric,
  type InsertContractSlaMetric,
  type ContractPenalty,
  type InsertContractPenalty,
  type ContractAmendment,
  type InsertContractAmendment,
  type ContractPerformanceMetric,
  type InsertContractPerformanceMetric,
  type BookingSettings,
  type InsertBookingSettings,
  type BookingBlacklist,
  type InsertBookingBlacklist,
  type ContractorRoute,
  type InsertContractorRoute,
  type RouteStop,
  type InsertRouteStop,
  type RouteWaypoint,
  type InsertRouteWaypoint,
  notifications,
  type Notification,
  type InsertNotification,
  aiAssignmentScores,
  assignmentPreferences,
  type AiAssignmentScore,
  type InsertAiAssignmentScore,
  type AssignmentPreferences,
  type InsertAssignmentPreferences,
  notificationTypeEnum,
  notificationPriorityEnum,
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
  checkStatusEnum,
  queueStatusEnum,
  timeOffRequestTypeEnum,
  timeOffStatusEnum,
  coverageStatusEnum,
  partsCatalog,
  partsInventory,
  partsTransactions,
  partsOrders,
  jobParts,
  type PartsCatalog,
  type InsertPartsCatalog,
  type PartsInventory,
  type InsertPartsInventory,
  type PartsTransaction,
  type InsertPartsTransaction,
  type PartsOrder,
  type InsertPartsOrder,
  type JobPart,
  type InsertJobPart,
  partsTransactionTypeEnum,
  partsOrderStatusEnum,
  partsCategoryEnum,
  maintenancePredictions,
  vehicleTelemetry,
  maintenanceModels,
  maintenanceAlerts,
  type MaintenancePrediction,
  type InsertMaintenancePrediction,
  type VehicleTelemetry,
  type InsertVehicleTelemetry,
  type MaintenanceModel,
  type InsertMaintenanceModel,
  type MaintenanceAlert,
  type InsertMaintenanceAlert,
  maintenanceRiskLevelEnum,
  maintenanceAlertTypeEnum,
  maintenanceSeverityEnum,
  performanceMetrics,
  kpiDefinitions,
  metricSnapshots,
  performanceGoals,
  type PerformanceMetric,
  type InsertPerformanceMetric,
  type KpiDefinition,
  type InsertKpiDefinition,
  type MetricSnapshot,
  type InsertMetricSnapshot,
  type PerformanceGoal,
  type InsertPerformanceGoal,
  emergencySosAlerts,
  emergencyContacts,
  emergencyResponseLog,
  type EmergencySosAlert,
  type InsertEmergencySosAlert,
  type EmergencyContact,
  type InsertEmergencyContact,
  type EmergencyResponseLog,
  type InsertEmergencyResponseLog,
  sosStatusEnum,
  sosSeverityEnum,
  sosAlertTypeEnum,
  sosInitiatorTypeEnum,
  sosResponseActionEnum,
  fuelStations,
  fuelPrices,
  fuelPriceHistory,
  routeFuelStops,
  fuelPriceAlerts,
  fuelPriceAggregates,
  type FuelStation,
  type InsertFuelStation,
  type FuelPrice,
  type InsertFuelPrice,
  type FuelPriceHistory,
  type InsertFuelPriceHistory,
  type RouteFuelStop,
  type InsertRouteFuelStop,
  type FuelPriceAlert,
  type InsertFuelPriceAlert,
  type FuelPriceAggregate,
  type InsertFuelPriceAggregate,
  fuelTypeEnum,
  fuelBrandEnum,
  fuelPriceSourceEnum,
  fuelAlertTypeEnum,
  fuelAlertSeverityEnum,
  type WeatherData,
  type InsertWeatherData,
  type WeatherAlert,
  type InsertWeatherAlert,
  type JobWeatherImpact,
  type InsertJobWeatherImpact,
  bookingPreferences,
  contractorBlacklist,
  favoriteContractors,
  bookingTemplates,
  type BookingPreferences,
  type InsertBookingPreferences,
  type ContractorBlacklist,
  type InsertContractorBlacklist,
  type FavoriteContractor,
  type InsertFavoriteContractor,
  type BookingTemplate,
  type InsertBookingTemplate
} from "@shared/schema";
import { partsInventoryService } from "./services/parts-inventory-service";

export interface IStorage {
  // ==================== PARTS INVENTORY ====================
  
  // Add new part to catalog
  addPartToCatalog(part: InsertPartsCatalog): Promise<PartsCatalog>;
  
  // Update part in catalog
  updatePartInCatalog(partId: string, updates: Partial<InsertPartsCatalog>): Promise<PartsCatalog | null>;
  
  // Get part by ID
  getPartById(partId: string): Promise<PartsCatalog | null>;
  
  // Search parts catalog
  searchPartsCatalog(filters: {
    query?: string;
    category?: string;
    manufacturer?: string;
    minPrice?: number;
    maxPrice?: number;
    isActive?: boolean;
    compatibleMake?: string;
    compatibleModel?: string;
    compatibleYear?: number;
    limit?: number;
    offset?: number;
  }): Promise<PartsCatalog[]>;
  
  // Get parts for specific vehicle
  getPartsForVehicle(make: string, model: string, year: number): Promise<PartsCatalog[]>;
  
  // Update inventory level
  updateInventoryLevel(
    partId: string,
    warehouseId: string,
    quantity: number,
    transactionType?: string,
    notes?: string
  ): Promise<PartsInventory>;
  
  // Record part usage on job
  recordPartUsage(
    jobId: string,
    partId: string,
    quantity: number,
    contractorId: string,
    warehouseId?: string,
    warrantyMonths?: number
  ): Promise<JobPart>;
  
  // Get job parts
  getJobParts(jobId: string): Promise<Array<{
    jobPart: JobPart;
    part: PartsCatalog;
  }>>;
  
  // Check parts needing reorder
  checkReorderNeeded(warehouseId?: string): Promise<Array<{
    inventory: PartsInventory;
    part: PartsCatalog;
    quantityToOrder: number;
    currentStock: number;
    estimatedCost: number;
    urgency: string;
  }>>;
  
  // Create parts order
  createPartsOrder(
    supplierName: string,
    items: Array<{
      partId: string;
      quantity: number;
      unitCost?: number;
    }>,
    supplierContact?: string,
    expectedDeliveryDays?: number,
    createdBy?: string
  ): Promise<PartsOrder>;
  
  // Receive parts order
  receivePartsOrder(
    orderId: string,
    receivedItems: Array<{
      partId: string;
      quantityReceived: number;
      warehouseId?: string;
    }>,
    trackingNumber?: string
  ): Promise<PartsOrder>;
  
  // Get parts orders
  getPartsOrders(filters?: {
    status?: string;
    supplierName?: string;
    fromDate?: Date;
    toDate?: Date;
  }): Promise<PartsOrder[]>;
  
  // Get inventory value
  getInventoryValue(warehouseId?: string, method?: 'FIFO' | 'LIFO' | 'AVERAGE'): Promise<{
    method: string;
    totalValue: string;
    totalRetailValue: string;
    potentialProfit: string;
    profitMargin: string;
    itemCount: number;
    breakdown: any[];
  }>;
  
  // Get part usage history
  getPartUsageHistory(
    partId: string,
    dateRange?: { startDate: Date; endDate: Date }
  ): Promise<{
    partId: string;
    totalUsed: number;
    totalCost: string;
    transactionCount: number;
    avgMonthlyUsage: string;
    avgMonthlyCost: string;
    monthlyBreakdown: any[];
    recentTransactions: PartsTransaction[];
  }>;
  
  // Get current inventory levels
  getInventoryLevels(warehouseId?: string, includeInactive?: boolean): Promise<Array<{
    inventory: PartsInventory;
    part: PartsCatalog;
    stockStatus: string;
    needsReorder: boolean;
    isExpired: boolean;
    daysUntilExpiration: number | null;
  }>>;
  
  // Get warranty report
  getWarrantyReport(daysAhead?: number): Promise<{
    expiringCount: number;
    warranties: Array<{
      jobPart: JobPart;
      part: PartsCatalog;
      daysUntilExpiration: number;
    }>;
  }>;
  
  // Forecast parts demand
  forecastPartsDemand(partId: string, daysToForecast?: number): Promise<{
    partId: string;
    historicalDailyAverage: string;
    forecastedUsage: number;
    currentStock: number;
    daysOfStockRemaining: number;
    willNeedReorderBy: string | null;
    recommendedOrderQuantity: number;
  }>;
  
  // Get supplier performance
  getSupplierPerformance(supplierName?: string): Promise<Array<{
    supplier: string;
    orderCount: number;
    totalValue: string;
    onTimeCount: number;
    delayedCount: number;
    avgDeliveryDays: string;
    onTimeRate: string;
  }>>;
  
  // Create parts transaction
  createPartsTransaction(transaction: InsertPartsTransaction): Promise<PartsTransaction>;
  
  // Get parts transactions
  getPartsTransactions(filters?: {
    partId?: string;
    jobId?: string;
    contractorId?: string;
    transactionType?: string;
    warehouseId?: string;
    fromDate?: Date;
    toDate?: Date;
  }): Promise<PartsTransaction[]>;
  
  // ==================== JOB REASSIGNMENT ====================
  
  // Check and reassign staled jobs that haven't been accepted
  checkAndReassignStaledJobs(): Promise<Array<{
    jobId: string;
    oldContractorId: string;
    newContractorId: string;
    attemptNumber: number;
  }>>;
  
  // ==================== LOCATION TRACKING ====================
  
  // Update contractor's current location
  updateContractorLocation(contractorId: string, location: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    altitude?: number;
    heading?: number;
    speed?: number;
    batteryLevel?: number;
    isCharging?: boolean;
    networkType?: string;
  }): Promise<LocationTracking | null>;
  
  // Save location to history
  saveLocationHistory(data: InsertLocationHistory): Promise<LocationHistory>;
  
  // Get location history for contractor
  getLocationHistory(contractorId: string, options?: {
    jobId?: string;
    fromDate?: Date;
    toDate?: Date;
    limit?: number;
    includeAnonymized?: boolean;
  }): Promise<LocationHistory[]>;
  
  // Get active tracking session
  getActiveTrackingSession(contractorId: string, jobId?: string): Promise<TrackingSession | null>;
  
  // Start new tracking session
  startTrackingSession(data: {
    contractorId: string;
    jobId?: string;
    startLocation?: any;
  }): Promise<TrackingSession>;
  
  // End tracking session
  endTrackingSession(sessionId: string, endReason: string): Promise<TrackingSession>;
  
  // Update tracking session stats
  updateTrackingSessionStats(sessionId: string, stats: {
    totalDistance?: number;
    totalDuration?: number;
    averageSpeed?: number;
    maxSpeed?: number;
    totalPoints?: number;
  }): Promise<void>;
  
  // Record geofence event
  recordGeofenceEvent(data: InsertGeofenceEvent): Promise<GeofenceEvent>;
  
  // Get geofence events for job
  getGeofenceEvents(jobId: string): Promise<GeofenceEvent[]>;
  
  // Get all actively tracked contractors
  getActiveTracking(): Promise<LocationTracking[]>;
  
  // Pause/resume tracking
  pauseTracking(contractorId: string, reason?: string): Promise<void>;
  resumeTracking(contractorId: string): Promise<void>;
  
  // Calculate ETA based on current location
  calculateETA(contractorLocation: { lat: number; lng: number }, jobLocation: { lat: number; lng: number }, averageSpeed?: number): Promise<{
    eta: Date;
    distanceMiles: number;
    estimatedMinutes: number;
  }>;
  
  // Detect arrival at job site (geofencing)
  detectArrival(contractorId: string, jobId: string, currentLocation: { lat: number; lng: number }, radiusMeters?: number): Promise<boolean>;
  
  // Anonymize old location data (GDPR compliance)
  anonymizeOldLocationData(daysOld: number): Promise<number>;
  
  // Get contractor's current location
  getContractorLocation(contractorId: string): Promise<LocationTracking | null>;
  
  // Get route polyline for session
  getSessionRoute(sessionId: string): Promise<{
    polyline: string;
    points: Array<{ lat: number; lng: number; timestamp: Date }>;
  }>;
  
  // ==================== PUSH NOTIFICATIONS ====================
  
  // Save push subscription
  savePushSubscription(userId: string, subscription: {
    endpoint: string;
    p256dhKey: string;
    authKey: string;
    deviceType: string;
    browserInfo?: any;
  }): Promise<PushSubscription>;
  
  // Remove push subscription
  removePushSubscription(subscriptionId: string): Promise<void>;
  
  // Get user's active push subscriptions
  getPushSubscriptions(userId: string): Promise<PushSubscription[]>;
  
  // Update subscription last used timestamp
  updatePushSubscriptionLastUsed(subscriptionId: string): Promise<void>;
  
  // Deactivate push subscription
  deactivatePushSubscription(subscriptionId: string): Promise<void>;
  
  // Log push notification
  logPushNotification(notification: InsertPushNotification): Promise<PushNotification>;
  
  // Mark notification as sent
  markNotificationSent(notificationId: string): Promise<void>;
  
  // Mark notification as delivered
  markNotificationDelivered(notificationId: string): Promise<void>;
  
  // Mark notification as clicked
  markNotificationClicked(notificationId: string): Promise<void>;
  
  // Mark notification as failed
  markNotificationFailed(notificationId: string, reason: string): Promise<void>;
  
  // Get user notification history
  getUserNotificationHistory(userId: string, days: number): Promise<PushNotification[]>;
  
  // Delete old push notifications
  deleteOldPushNotifications(daysToKeep: number): Promise<number>;
  
  // ==================== ROUTE MANAGEMENT ====================
  
  // Create a new multi-stop route
  createRoute(route: InsertContractorRoute): Promise<ContractorRoute>;
  
  // Get route by ID
  getRoute(routeId: string): Promise<ContractorRoute | null>;
  
  // Update route
  updateRoute(routeId: string, updates: Partial<InsertContractorRoute>): Promise<ContractorRoute | null>;
  
  // Delete route
  deleteRoute(routeId: string): Promise<boolean>;
  
  // Get active route for contractor
  getActiveRoute(contractorId: string): Promise<ContractorRoute | null>;
  
  // Get all routes for contractor
  getContractorRoutes(contractorId: string, options?: {
    status?: string;
    fromDate?: Date;
    toDate?: Date;
    limit?: number;
  }): Promise<ContractorRoute[]>;
  
  // Add stop to route
  addRouteStop(routeId: string, stop: InsertRouteStop): Promise<RouteStop>;
  
  // Update route stop
  updateRouteStop(stopId: string, updates: Partial<InsertRouteStop>): Promise<RouteStop | null>;
  
  // Remove stop from route
  removeRouteStop(stopId: string): Promise<boolean>;
  
  // Get route stops
  getRouteStops(routeId: string): Promise<RouteStop[]>;
  
  // Update route progress (current position and stop)
  updateRouteProgress(routeId: string, currentStopId: string, location: {
    lat: number;
    lng: number;
    timestamp: string;
  }): Promise<ContractorRoute | null>;
  
  // Optimize route (reorder stops)
  optimizeRoute(routeId: string, strategy?: 'shortest' | 'fastest' | 'most_profitable'): Promise<{
    optimized: boolean;
    newOrder: RouteStop[];
    estimatedSavings: {
      distance: number;
      time: number;
    };
  }>;
  
  // Record waypoint for route tracking
  recordWaypoint(routeId: string, waypoint: InsertRouteWaypoint): Promise<RouteWaypoint>;
  
  // Get waypoints for route
  getRouteWaypoints(routeId: string, options?: {
    fromTimestamp?: Date;
    toTimestamp?: Date;
    limit?: number;
  }): Promise<RouteWaypoint[]>;
  
  // Mark stop as arrived
  markStopArrived(stopId: string, arrivalTime: Date): Promise<RouteStop | null>;
  
  // Mark stop as completed
  markStopCompleted(stopId: string, departureTime: Date): Promise<RouteStop | null>;
  
  // Skip a stop
  skipStop(stopId: string, reason: string): Promise<RouteStop | null>;
  
  // Reorder stops in a route
  reorderStops(routeId: string, stopIds: string[]): Promise<boolean>;
  
  // Calculate route metrics
  calculateRouteMetrics(routeId: string): Promise<{
    totalDistance: number;
    estimatedDuration: number;
    totalStops: number;
    completedStops: number;
    remainingDistance: number;
    remainingDuration: number;
  }>;
  
  // Get customer's job position in route
  getJobRoutePosition(jobId: string): Promise<{
    routeId: string;
    stopOrder: number;
    totalStops: number;
    currentStopOrder: number;
    estimatedArrival: Date;
    contractorLocation?: { lat: number; lng: number };
  } | null>;
  
  // Get all active routes (for monitoring)
  getActiveRoutes(): Promise<Array<{
    route: ContractorRoute;
    currentStop: RouteStop | null;
    progress: number;
  }>>;
  
  // Handle route deviation
  handleRouteDeviation(routeId: string, currentLocation: { lat: number; lng: number }): Promise<{
    isDeviated: boolean;
    deviationDistance: number;
    recommendedAction?: string;
  }>;
  
  // ==================== BULK OPERATIONS ====================
  
  // User Bulk Operations
  bulkSuspendUsers(userIds: string[], performedBy: string): Promise<{ succeeded: string[]; failed: string[]; errorMessages: { [key: string]: string } }>;
  bulkActivateUsers(userIds: string[], performedBy: string): Promise<{ succeeded: string[]; failed: string[]; errorMessages: { [key: string]: string } }>;
  bulkDeleteUsers(userIds: string[], performedBy: string): Promise<{ succeeded: string[]; failed: string[]; errorMessages: { [key: string]: string } }>;
  bulkEmailUsers(userIds: string[], subject: string, message: string, performedBy: string): Promise<{ succeeded: string[]; failed: string[]; errorMessages: { [key: string]: string } }>;
  
  // Contractor Bulk Operations
  bulkApproveContractors(contractorIds: string[], performedBy: string): Promise<{ succeeded: string[]; failed: string[]; errorMessages: { [key: string]: string } }>;
  bulkRejectContractors(contractorIds: string[], reason: string, performedBy: string): Promise<{ succeeded: string[]; failed: string[]; errorMessages: { [key: string]: string } }>;
  bulkSuspendContractors(contractorIds: string[], performedBy: string): Promise<{ succeeded: string[]; failed: string[]; errorMessages: { [key: string]: string } }>;
  bulkActivateContractors(contractorIds: string[], performedBy: string): Promise<{ succeeded: string[]; failed: string[]; errorMessages: { [key: string]: string } }>;
  bulkEmailContractors(contractorIds: string[], subject: string, message: string, performedBy: string): Promise<{ succeeded: string[]; failed: string[]; errorMessages: { [key: string]: string } }>;
  
  // Helper method to get user emails
  getUserEmails(userIds: string[]): Promise<{ userId: string; email: string; name: string }[]>;
  
  // Helper method to get contractor emails
  getContractorEmails(contractorIds: string[]): Promise<{ contractorId: string; email: string; name: string }[]>;
  
  // ==================== DATA EXPORT OPERATIONS ====================
  
  // Export fleet vehicles to CSV format
  getFleetVehiclesForExport(fleetId: string, filters?: {
    isActive?: boolean;
    vehicleType?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<any[]>;
  
  // Export fleet jobs to CSV format
  getFleetJobsForExport(fleetId: string, filters?: {
    status?: string;
    dateFrom?: Date;
    dateTo?: Date;
    vehicleId?: string;
    contractorId?: string;
  }): Promise<any[]>;
  
  // Export users list to CSV format
  getUsersForExport(filters?: {
    role?: string;
    status?: string;
    search?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<any[]>;
  
  // Export contractors list to CSV format
  getContractorsForExport(filters?: {
    status?: string;
    tier?: string;
    search?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<any[]>;
  
  // Export billing/transaction data to CSV format
  getBillingDataForExport(filters?: {
    fleetAccountId?: string;
    status?: string;
    type?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<any[]>;
  
  // Export fleet analytics data to CSV format
  getFleetAnalyticsForExport(fleetId: string, filters?: {
    metric?: string;
    dateFrom?: Date;
    dateTo?: Date;
    groupBy?: 'day' | 'week' | 'month';
  }): Promise<any[]>;
  
  // ==================== REPORT GENERATION ====================
  
  // Generate fleet maintenance report
  getFleetMaintenanceReport(fleetId: string, dateFrom: Date, dateTo: Date): Promise<{
    summary: {
      totalVehicles: number;
      totalMaintenanceJobs: number;
      totalCost: number;
      averageCostPerVehicle: number;
      mostFrequentIssues: Array<{ issue: string; count: number; cost: number }>;
    };
    details: any[];
  }>;
  
  // Generate fleet cost summary report
  getFleetCostSummaryReport(fleetId: string, dateFrom: Date, dateTo: Date): Promise<{
    summary: {
      totalCost: number;
      maintenanceCost: number;
      emergencyRepairCost: number;
      scheduledServiceCost: number;
      costByMonth: Array<{ month: string; cost: number }>;
      costByVehicle: Array<{ vehicle: string; cost: number }>;
    };
    details: any[];
  }>;
  
  // Generate admin revenue report
  getAdminRevenueReport(dateFrom: Date, dateTo: Date): Promise<{
    summary: {
      totalRevenue: number;
      subscriptionRevenue: number;
      transactionRevenue: number;
      refunds: number;
      netRevenue: number;
      revenueByFleet: Array<{ fleetName: string; revenue: number }>;
      revenueByMonth: Array<{ month: string; revenue: number }>;
    };
    details: any[];
  }>;

  // ==================== AI DISPATCH SYSTEM ====================
  
  // Calculate AI assignment scores for all eligible contractors for a job
  calculateAIAssignmentScores(jobId: string): Promise<AiAssignmentScore[]>;
  
  // Get the optimal contractor for a job using AI scoring
  getOptimalContractor(jobId: string): Promise<{ contractorId: string; score: number; recommendation: string } | null>;
  
  // Save AI assignment score
  saveAiAssignmentScore(data: InsertAiAssignmentScore): Promise<AiAssignmentScore>;
  
  // Get AI assignment scores for a job
  getAiAssignmentScores(jobId: string): Promise<AiAssignmentScore[]>;
  
  // Update AI assignment score
  updateAiAssignmentScore(scoreId: string, updates: Partial<AiAssignmentScore>): Promise<void>;
  
  // Get AI assignment scores in a time period
  getAiAssignmentScoresInPeriod(fromDate: Date, toDate: Date): Promise<AiAssignmentScore[]>;
  
  // Update contractor specializations
  updateContractorSpecializations(contractorId: string, specializations: any): Promise<void>;
  
  // Get contractor performance pattern
  getContractorPerformancePattern(contractorId: string): Promise<{
    timeOfDayPerformance: any;
    weatherPerformance: any;
    jobComplexityHandling: any;
  }>;
  
  // Record assignment outcome for learning
  recordAssignmentOutcome(jobId: string, success: boolean, metrics: {
    responseTime?: number;
    completionTime?: number;
    customerRating?: number;
    issuesEncountered?: string[];
  }): Promise<void>;
  
  // Get assignment preferences for a contractor
  getAssignmentPreferences(contractorId: string): Promise<AssignmentPreferences | null>;
  
  // Save or update assignment preferences
  saveAssignmentPreferences(data: InsertAssignmentPreferences): Promise<AssignmentPreferences>;
  
  // Update assignment preferences
  updateAssignmentPreferences(contractorId: string, updates: Partial<AssignmentPreferences>): Promise<void>;
  
  // Get available contractors (for AI dispatch)
  getAvailableContractors(): Promise<ContractorProfile[]>;
  
  // Update contractor profile with AI-enhanced fields
  updateContractorProfile(contractorId: string, updates: Partial<ContractorProfile>): Promise<void>;
  
  // Get assignment effectiveness metrics
  getAssignmentEffectiveness(period: 'day' | 'week' | 'month'): Promise<{
    totalAssignments: number;
    successfulAssignments: number;
    failedAssignments: number;
    successRate: number;
    averageScore: number;
  }>;

  // ==================== SERVICE HISTORY ====================

  // Record service history from job completion
  recordServiceHistory(data: InsertServiceHistory): Promise<ServiceHistory>;

  // Get vehicle service history
  getVehicleServiceHistory(vehicleId: string, options?: {
    limit?: number;
    offset?: number;
    orderBy?: string;
    orderDir?: 'asc' | 'desc';
    startDate?: Date;
    endDate?: Date;
    serviceType?: string;
    hasWarranty?: boolean;
  }): Promise<ServiceHistory[]>;

  // Update or create service schedule
  updateServiceSchedule(vehicleId: string, serviceType: string, data: InsertServiceSchedule): Promise<ServiceSchedule | null>;

  // Get upcoming services for a vehicle
  getUpcomingServices(vehicleId: string): Promise<ServiceSchedule[]>;

  // Create service recommendation
  createServiceRecommendation(data: InsertServiceRecommendation): Promise<ServiceRecommendation>;

  // Get service recommendations for a vehicle
  getServiceRecommendations(vehicleId: string, filters?: {
    priority?: string;
    isCompleted?: boolean;
    isDismissed?: boolean;
  }): Promise<ServiceRecommendation[]>;

  // Mark service recommendation as completed
  markRecommendationCompleted(recommendationId: string, jobId: string): Promise<ServiceRecommendation | null>;

  // Dismiss service recommendation
  dismissRecommendation(recommendationId: string, userId: string, reason?: string): Promise<ServiceRecommendation | null>;

  // Get maintenance report for a vehicle
  getMaintenanceReport(vehicleId: string, dateRange?: { startDate: Date; endDate: Date }): Promise<{
    vehicle: FleetVehicle;
    serviceHistory: ServiceHistory[];
    upcomingServices: ServiceSchedule[];
    recommendations: ServiceRecommendation[];
    statistics: {
      totalServices: number;
      totalCost: string;
      avgCostPerService: string;
      mostFrequentService: string;
    };
  }>;

  // Get service schedule for a vehicle
  getServiceSchedule(vehicleId: string, serviceType: string): Promise<ServiceSchedule | null>;

  // Update service schedules alert time
  updateServiceSchedulesAlertTime(vehicleId: string): Promise<void>;

  // Create vehicle maintenance log
  createMaintenanceLog(data: InsertVehicleMaintenanceLog): Promise<VehicleMaintenanceLog>;

  // Get vehicle maintenance logs
  getVehicleMaintenanceLogs(vehicleId: string, options?: {
    limit?: number;
    offset?: number;
    startDate?: Date;
    endDate?: Date;
    logType?: string;
  }): Promise<VehicleMaintenanceLog[]>;

  // Get fleet vehicle by ID
  getFleetVehicle(vehicleId: string): Promise<FleetVehicle | null>;

  // Get fleet contacts for notifications
  getFleetContacts(fleetAccountId: string): Promise<FleetContact[]>;

  // Check if service history exists for job
  serviceHistoryExistsForJob(jobId: string): Promise<boolean>;
  
  // ==================== NOTIFICATION/REMINDER MANAGEMENT ====================
  
  // Get reminders for a user with pagination
  getUserReminders(userId: string, options?: {
    status?: string;
    reminderType?: string;
    limit?: number;
    offset?: number;
    orderBy?: string;
    orderDir?: 'asc' | 'desc';
  }): Promise<{ reminders: Reminder[]; total: number }>;
  
  // Get reminder logs for a user
  getUserReminderLogs(userId: string, options?: {
    status?: string;
    channel?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ logs: ReminderLog[]; total: number }>;
  
  // Get blacklist entries for a user
  getUserReminderBlacklist(userId?: string, options?: {
    type?: 'email' | 'phone';
    isActive?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ entries: ReminderBlacklist[]; total: number }>;
  
  // Add entry to reminder blacklist
  addToReminderBlacklist(data: InsertReminderBlacklist): Promise<ReminderBlacklist>;
  
  // Remove from reminder blacklist by ID
  removeFromReminderBlacklist(id: string, userId?: string): Promise<boolean>;
  
  // Get push notification history with pagination
  getPushNotificationHistoryPaginated(userId: string, options?: {
    days?: number;
    limit?: number;
    offset?: number;
  }): Promise<{ notifications: PushNotification[]; total: number }>;
  
  // Get notification performance metrics
  getNotificationMetrics(options?: {
    startDate?: Date;
    endDate?: Date;
    channel?: string;
    messageType?: string;
  }): Promise<ReminderMetrics[]>;
  
  // ==================== BOOKING PREFERENCES ====================
  
  // Save or update booking preferences
  saveBookingPreferences(userId: string, preferences: InsertBookingPreferences): Promise<BookingPreferences>;
  
  // Get booking preferences for a user
  getBookingPreferences(userId: string): Promise<BookingPreferences | null>;
  
  // Add a contractor to favorites
  addFavoriteContractor(userId: string, contractorId: string, notes?: string): Promise<FavoriteContractor>;
  
  // Remove a contractor from favorites
  removeFavoriteContractor(userId: string, contractorId: string): Promise<boolean>;
  
  // Get favorite contractors for a user
  getFavoriteContractors(userId: string): Promise<FavoriteContractor[]>;
  
  // Blacklist a contractor
  blacklistContractor(userId: string, contractorId: string, reason?: string): Promise<ContractorBlacklist>;
  
  // Remove contractor from blacklist
  unblacklistContractor(userId: string, contractorId: string): Promise<boolean>;
  
  // Get blacklisted contractors for a user
  getBlacklistedContractors(userId: string): Promise<ContractorBlacklist[]>;
  
  // Check if contractor is blacklisted
  isContractorBlacklisted(userId: string, contractorId: string): Promise<boolean>;
  
  // Create booking template
  createBookingTemplate(template: InsertBookingTemplate): Promise<BookingTemplate>;
  
  // Update booking template
  updateBookingTemplate(templateId: string, updates: Partial<InsertBookingTemplate>): Promise<BookingTemplate | null>;
  
  // Delete booking template
  deleteBookingTemplate(templateId: string): Promise<boolean>;
  
  // Get booking templates for a user
  getBookingTemplates(userId: string): Promise<BookingTemplate[]>;
  
  // Get specific booking template
  getBookingTemplate(templateId: string): Promise<BookingTemplate | null>;
  
  // Apply booking template to job
  applyBookingTemplate(templateId: string): Promise<Partial<Job>>;
  
  // Record template usage
  recordTemplateUsage(templateId: string): Promise<void>;
}

import { db } from "./db";
import { eq, and, or, gte, lte, isNull, isNotNull, desc, asc, sql, inArray, ne, gt, lt, ilike } from "drizzle-orm";
import { randomUUID, randomBytes } from "crypto";
import bcrypt from "bcrypt";
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
  status?: typeof jobStatusEnum.enumValues[number] | typeof jobStatusEnum.enumValues[number][];
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
  findUsers(filters: { phone?: string; email?: string; role?: string }): Promise<User[]>;
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
  
  // Driver approval methods
  addDriver(contractorId: string, driverData: any): Promise<DriverProfile>;
  getContractorDrivers(contractorId: string): Promise<any[]>;
  getPendingDriverApplications(): Promise<any[]>;
  approveDriver(driverId: string, approvedBy: string): Promise<boolean>;
  rejectDriver(driverId: string, rejectedBy: string): Promise<boolean>;
  
  getContractorProfile(userId: string): Promise<ContractorProfile | undefined>;
  createContractorProfile(profile: InsertContractorProfile): Promise<ContractorProfile>;
  updateContractorProfile(userId: string, updates: Partial<InsertContractorProfile>): Promise<ContractorProfile | undefined>;
  updatePerformanceTier(userId: string, tier: typeof performanceTierEnum.enumValues[number]): Promise<boolean>;
  findContractors(filters: { 
    status?: string;
    performanceTier?: string;
    isAvailable?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<any[]>;
  updateContractorStatus(contractorId: string, status: string): Promise<boolean>;
  getPendingContractors(): Promise<any[]>;
  
  checkUserRole(userId: string, requiredRole: string): Promise<boolean>;
  hasAdminUsers(): Promise<boolean>;
  
  // Password Reset Operations
  createPasswordResetToken(userId: string, email: string): Promise<string | null>;
  validatePasswordResetToken(token: string): Promise<{ userId: string; email: string } | null>;
  usePasswordResetToken(token: string, newPassword: string): Promise<boolean>;
  revokePasswordResetToken(token: string): Promise<boolean>;
  
  // User Management Operations
  getAllUsers(filters?: {
    role?: string;
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<any[]>;
  getAdminUsers(): Promise<User[]>;
  getUserById(id: string): Promise<any>;
  updateUserStatus(userId: string, isActive: boolean): Promise<User | undefined>;
  updateUserRole(userId: string, newRole: typeof userRoleEnum.enumValues[number]): Promise<User | undefined>;
  resetUserPassword(userId: string, newPassword: string): Promise<boolean>;
  getUserActivityLog(userId: string, limit?: number): Promise<any[]>;
  
  // ==================== JOB OPERATIONS ====================
  createJob(job: InsertJob): Promise<Job>;
  getJob(id: string): Promise<Job | undefined>;
  updateJob(id: string, updates: Partial<InsertJob>): Promise<Job | undefined>;
  updateJobStatus(id: string, status: typeof jobStatusEnum.enumValues[number], changedBy?: string, reason?: string): Promise<Job | undefined>;
  findJobs(filters: JobFilterOptions): Promise<Job[]>;
  assignContractorToJob(jobId: string, contractorId: string): Promise<Job | undefined>;
  
  addJobPhoto(photo: InsertJobPhoto): Promise<JobPhoto>;
  getJobPhotos(jobId: string): Promise<JobPhoto[]>;
  deleteJobPhoto(photoId: string): Promise<boolean>;
  
  // Enhanced messaging methods
  addJobMessage(message: InsertJobMessage): Promise<JobMessage>;
  getJobMessages(jobId: string, limit?: number): Promise<JobMessage[]>;
  getUnreadMessageCount(jobId: string, userId: string): Promise<number>;
  markMessagesAsRead(jobId: string, userId: string): Promise<boolean>;
  editMessage(messageId: string, newContent: string, userId: string): Promise<JobMessage | null>;
  deleteMessage(messageId: string, userId: string): Promise<boolean>;
  addMessageReaction(messageId: string, userId: string, emoji: string): Promise<JobMessage | null>;
  removeMessageReaction(messageId: string, userId: string, emoji: string): Promise<JobMessage | null>;
  getMessageThread(messageId: string): Promise<JobMessage[]>;
  getMessageHistory(jobId: string, options?: {
    limit?: number;
    offset?: number;
    beforeId?: string;
    afterId?: string;
  }): Promise<{
    messages: JobMessage[];
    hasMore: boolean;
    total: number;
  }>;
  markMessageAsRead(messageId: string, userId: string): Promise<MessageReadReceipt | null>;
  getMessageReadReceipts(messageId: string): Promise<MessageReadReceipt[]>;
  
  calculateJobPrice(jobId: string): Promise<number>;
  
  getJobStatusHistory(jobId: string): Promise<JobStatusHistory[]>;
  addJobStatusHistory(history: InsertJobStatusHistory): Promise<JobStatusHistory>;
  recordJobStatusChange(data: { jobId: string; fromStatus: string; toStatus: string; changedBy?: string; reason?: string }): Promise<void>;
  
  // ==================== JOB QUEUE OPERATIONS ====================
  enqueueJob(contractorId: string, jobId: string, priority?: number): Promise<ContractorJobQueue>;
  getContractorQueue(contractorId: string): Promise<ContractorJobQueue[]>;
  getContractorCurrentJob(contractorId: string): Promise<{ job: Job | null; queueEntry: ContractorJobQueue | null }>;
  advanceContractorQueue(contractorId: string): Promise<{ nextJob: Job | null; queueEntry: ContractorJobQueue | null }>;
  removeFromQueue(jobId: string): Promise<boolean>;
  getQueuePositionForJob(jobId: string): Promise<{ position: number; totalInQueue: number } | null>;
  updateQueueStatus(queueId: string, status: typeof queueStatusEnum.enumValues[number]): Promise<ContractorJobQueue | null>;
  
  // Enhanced queue management methods
  addToContractorQueue(contractorId: string, jobId: string, priority?: number, metadata?: any): Promise<ContractorJobQueue>;
  processNextInQueue(contractorId: string): Promise<{ success: boolean; nextJob?: Job; queueEntry?: ContractorJobQueue }>;
  updateQueuePosition(queueId: string, newPosition: number): Promise<ContractorJobQueue | null>;
  reorderContractorQueue(contractorId: string, jobIds: string[]): Promise<boolean>;
  skipQueueJob(queueId: string, reason: string): Promise<ContractorJobQueue | null>;
  expireQueueEntry(queueId: string): Promise<ContractorJobQueue | null>;
  getQueueEstimates(contractorId: string): Promise<Array<{ jobId: string; position: number; estimatedStartTime: Date }>>;
  updateQueueEstimates(contractorId: string): Promise<boolean>;
  getJobQueueStatus(jobId: string): Promise<{ contractorId: string; position: number; estimatedStartTime?: Date; status: string } | null>;
  getAllActiveQueues(): Promise<Array<{ contractorId: string; queueLength: number; currentJob?: Job; nextAvailableTime?: Date }>>;
  findShortestQueue(serviceTypeId?: string, location?: { lat: number; lng: number }): Promise<{ contractorId: string; queueLength: number; estimatedWaitTime: number } | null>;
  handleQueueTimeout(queueId: string): Promise<{ reassigned: boolean; newContractorId?: string }>;
  sendQueueNotification(queueId: string, notificationType: string): Promise<boolean>;
  getContractorAvailabilityWithQueue(contractorId: string): Promise<{ 
    isAvailable: boolean;
    currentJob?: Job;
    queueDepth: number;
    estimatedAvailabilityTime?: Date;
    nextJobId?: string;
  }>;
  
  // ==================== FLEET OPERATIONS ====================
  createFleetAccount(fleet: InsertFleetAccount): Promise<FleetAccount>;
  getFleetAccount(id: string): Promise<FleetAccount | undefined>;
  updateFleetAccount(id: string, updates: Partial<InsertFleetAccount>): Promise<FleetAccount | undefined>;
  deleteFleetAccount(id: string): Promise<boolean>;
  findFleetAccounts(filters: FleetFilterOptions): Promise<FleetAccount[]>;
  getActiveFleets(filters?: {
    tier?: string;
    status?: string;
    search?: string;
  }): Promise<Array<{
    id: string;
    companyName: string;
    contactName: string;
    contactEmail: string;
    contactPhone: string;
    tier: string;
    creditLimit: number;
    status: string;
    vehicleCount: number;
    activeJobs: number;
    totalSpent: number;
    memberSince: Date;
    customPricing: boolean;
  }>>;
  getFleetMetrics(fleetId: string): Promise<{
    totalVehicles: number;
    activeJobs: number;
    completedJobs: number;
    totalSpent: number;
    averageJobValue: number;
  }>;
  
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
  
  // ==================== VACATION AND TIME-OFF MANAGEMENT ====================
  requestTimeOff(contractorId: string, request: InsertVacationRequest): Promise<VacationRequest>;
  approveTimeOff(requestId: string, adminId: string, notes?: string): Promise<VacationRequest | null>;
  rejectTimeOff(requestId: string, adminId: string, reason: string): Promise<VacationRequest | null>;
  getTimeOffRequests(contractorId?: string, status?: typeof timeOffStatusEnum.enumValues[number]): Promise<VacationRequest[]>;
  checkAvailabilityConflicts(contractorId: string, startDate: Date, endDate: Date): Promise<Job[]>;
  assignCoverageContractor(requestId: string, coveringContractorId: string): Promise<VacationRequest | null>;
  getAvailabilityCalendar(contractorId: string, month: number, year: number): Promise<{
    regularAvailability: ContractorAvailability[];
    vacationRequests: VacationRequest[];
    availabilityOverrides: AvailabilityOverride[];
    scheduledJobs: Job[];
  }>;
  bulkUpdateAvailability(contractorId: string, dates: {
    date: Date;
    isAvailable: boolean;
    startTime?: string;
    endTime?: string;
    reason?: string;
  }[]): Promise<AvailabilityOverride[]>;
  createAvailabilityOverride(override: InsertAvailabilityOverride): Promise<AvailabilityOverride>;
  getAvailabilityOverrides(contractorId: string, fromDate?: Date, toDate?: Date): Promise<AvailabilityOverride[]>;
  createContractorCoverage(coverage: InsertContractorCoverage): Promise<ContractorCoverage>;
  updateContractorCoverage(coverageId: string, updates: Partial<InsertContractorCoverage>): Promise<ContractorCoverage | null>;
  getContractorCoverage(contractorId: string, role: 'requesting' | 'covering' | 'both'): Promise<ContractorCoverage[]>;
  suggestCoverageContractors(requestingContractorId: string, startDate: Date, endDate: Date): Promise<{
    contractorId: string;
    name: string;
    availability: number; // percentage of availability during the period
    skills: ServiceType[];
    distance?: number;
    rating?: number;
  }[]>;
  
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
  
  // Invoice management
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: string, updates: Partial<InsertInvoice>): Promise<Invoice | undefined>;
  getInvoice(id: string): Promise<Invoice | undefined>;
  getInvoices(filters: any): Promise<Invoice[]>;
  getInvoiceByJobId(jobId: string): Promise<Invoice | undefined>;
  getUnpaidInvoices(customerId: string): Promise<Invoice[]>;
  markInvoiceAsPaid(invoiceId: string, paidAt: Date): Promise<boolean>;
  getInvoiceTransactions(invoiceId: string): Promise<Transaction[]>;
  
  // Invoice defaults management
  createInvoiceDefault(data: InsertInvoiceDefault): Promise<InvoiceDefault>;
  updateInvoiceDefault(id: string, updates: Partial<InsertInvoiceDefault>): Promise<InvoiceDefault | undefined>;
  deleteInvoiceDefault(id: string): Promise<boolean>;
  getInvoiceDefaults(onlyActive?: boolean): Promise<InvoiceDefault[]>;
  getInvoiceDefaultById(id: string): Promise<InvoiceDefault | undefined>;
  
  // Invoice line items management
  createInvoiceLineItem(data: InsertInvoiceLineItem): Promise<InvoiceLineItem>;
  updateInvoiceLineItem(id: string, updates: Partial<InsertInvoiceLineItem>): Promise<InvoiceLineItem | undefined>;
  deleteInvoiceLineItem(id: string): Promise<boolean>;
  getInvoiceLineItems(invoiceId: string): Promise<InvoiceLineItem[]>;
  getInvoiceLineItemById(id: string): Promise<InvoiceLineItem | undefined>;
  getInvoiceWithLineItems(invoiceId: string): Promise<Invoice & { lineItems: InvoiceLineItem[] } | undefined>;
  
  // Job completion with invoice support
  markJobComplete(jobId: string, data: {
    completionNotes?: string;
    completionPhotos?: string[];
    contractorSignature?: string;
  }): Promise<Job | undefined>;
  
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

  // ==================== BOOKING OPERATIONS ====================
  getBookingSettings(serviceTypeId?: string): Promise<BookingSettings[]>;
  createBookingSettings(settings: InsertBookingSettings): Promise<BookingSettings>;
  updateBookingSettings(id: string, updates: Partial<InsertBookingSettings>): Promise<BookingSettings | undefined>;
  deleteBookingSettings(id: string): Promise<boolean>;
  
  getBookingBlacklist(date?: string, serviceTypeId?: string): Promise<BookingBlacklist[]>;
  createBookingBlacklist(blacklist: InsertBookingBlacklist): Promise<BookingBlacklist>;
  deleteBookingBlacklist(id: string): Promise<boolean>;
  
  getAvailableTimeSlots(date: string, serviceTypeId: string): Promise<Array<{
    time: string;
    available: boolean;
    maxCapacity: number;
    currentBookings: number;
  }>>;
  
  checkTimeSlotAvailability(date: string, timeSlot: string, serviceTypeId: string): Promise<boolean>;

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
  
  // ==================== FLEET APPLICATION OPERATIONS ====================
  createFleetApplication(data: InsertFleetApplication): Promise<FleetApplication>;
  getFleetApplication(id: string): Promise<FleetApplication | undefined>;
  updateFleetApplication(id: string, updates: Partial<InsertFleetApplication>): Promise<FleetApplication | undefined>;
  findFleetApplications(filters: {
    status?: string;
    email?: string;
    companyName?: string;
    search?: string;
    fromDate?: Date;
    toDate?: Date;
  }): Promise<FleetApplication[]>;
  getFleetApplicationByEmail(email: string): Promise<FleetApplication | undefined>;
  
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

  // ==================== BATCH JOB SCHEDULING ====================
  
  // Create batch jobs for multiple vehicles
  createBatchJobs(data: {
    fleetAccountId: string;
    vehicleIds: string[];
    serviceType: string;
    scheduledDate: Date;
    urgency: 'routine' | 'urgent' | 'emergency';
    description?: string;
    estimatedDuration?: number;
    createdBy: string;
  }): Promise<Job[]>;
  
  // ==================== PM SCHEDULING ====================
  
  // Get all PM schedules for a fleet
  getPmSchedules(fleetAccountId: string, options?: {
    vehicleId?: string;
    isActive?: boolean;
  }): Promise<PmSchedule[]>;
  
  // Get a single PM schedule
  getPmSchedule(scheduleId: string, fleetAccountId: string): Promise<PmSchedule | null>;
  
  // Create a new PM schedule
  createPmSchedule(data: InsertPmSchedule): Promise<PmSchedule>;
  
  // Update a PM schedule
  updatePmSchedule(scheduleId: string, fleetAccountId: string, data: Partial<InsertPmSchedule>): Promise<PmSchedule | null>;
  
  // Delete a PM schedule
  deletePmSchedule(scheduleId: string, fleetAccountId: string): Promise<boolean>;
  
  // Check and create jobs for due PM schedules
  processDuePmSchedules(): Promise<{
    processedCount: number;
    createdJobs: Job[];
  }>;

  // ==================== NOTIFICATIONS ====================
  
  // Create a new notification
  createNotification(notification: InsertNotification): Promise<Notification>;
  
  // Get user's notifications with filters
  getUserNotifications(userId: string, options?: {
    type?: string;
    isRead?: boolean;
    priority?: string;
    limit?: number;
    offset?: number;
    fromDate?: Date;
    toDate?: Date;
  }): Promise<{ notifications: Notification[]; total: number }>;
  
  // Get notification by ID
  getNotification(notificationId: string, userId: string): Promise<Notification | null>;
  
  // Mark notification as read
  markNotificationAsRead(notificationId: string, userId: string): Promise<boolean>;
  
  // Mark all user notifications as read
  markAllNotificationsAsRead(userId: string): Promise<number>;
  
  // Delete a notification
  deleteNotification(notificationId: string, userId: string): Promise<boolean>;
  
  // Clear all notifications for user
  clearAllNotifications(userId: string): Promise<number>;

  // ==================== MAINTENANCE PREDICTIONS ====================
  
  // Create maintenance prediction
  createMaintenancePrediction(vehicleId: string, prediction: InsertMaintenancePrediction): Promise<MaintenancePrediction>;
  
  // Get maintenance predictions for fleet
  getMaintenancePredictions(fleetId: string, dateRange?: { start: Date; end: Date }): Promise<{
    predictions: MaintenancePrediction[];
    vehicles: FleetVehicle[];
  }>;
  
  // Record vehicle telemetry
  recordVehicleTelemetry(vehicleId: string, data: InsertVehicleTelemetry): Promise<VehicleTelemetry>;
  
  // Update prediction model
  updatePredictionModel(modelId: string, metrics: {
    accuracy?: number;
    performanceMetrics?: any;
  }): Promise<MaintenanceModel | null>;
  
  // Create maintenance alert
  createMaintenanceAlert(vehicleId: string, alert: InsertMaintenanceAlert): Promise<MaintenanceAlert>;
  
  // Get high risk vehicles
  getHighRiskVehicles(fleetId: string): Promise<{
    vehicle: FleetVehicle;
    criticalCount: number;
    highCount: number;
    totalEstimatedCost: number;
  }[]>;
  
  // Calculate maintenance ROI
  calculateMaintenanceROI(vehicleId: string): Promise<{
    preventiveCost: number;
    potentialReactiveCost: number;
    potentialDowntimeSaved: number;
    totalSavings: number;
    roi: number;
  }>;
  
  // Get prediction accuracy
  getPredictionAccuracy(modelId?: string): Promise<{
    modelName: string;
    accuracy: number;
    performanceMetrics: any;
  }>;
  
  // Get vehicle maintenance schedule
  getVehicleMaintenanceSchedule(vehicleId: string): Promise<{
    predictions: MaintenancePrediction[];
    alerts: MaintenanceAlert[];
    nextServiceDue: Date | null;
  }>;
  
  // Acknowledge maintenance alert
  acknowledgeMaintenanceAlert(alertId: string, userId: string, notes?: string): Promise<MaintenanceAlert | null>;
  
  // Get fleet maintenance alerts
  getFleetMaintenanceAlerts(fleetId: string, options?: {
    active?: boolean;
    severity?: string;
    limit?: number;
  }): Promise<MaintenanceAlert[]>;
  
  // Get unread notification count
  getUnreadNotificationCount(userId: string): Promise<number>;
  
  // Batch create notifications for multiple users
  createBatchNotifications(notifications: InsertNotification[]): Promise<Notification[]>;
  
  // Get notifications by related entity
  getNotificationsByEntity(entityType: string, entityId: string): Promise<Notification[]>;
  
  // ==================== FLEET ANALYTICS API ====================
  
  // Get fleet overview statistics
  getFleetAnalyticsOverview(fleetAccountId: string): Promise<{
    totalVehicles: number;
    activeJobs: number;
    completedJobsThisMonth: number;
    totalSpentThisMonth: number;
    avgResponseTime: number;
    satisfactionRating: number;
  }>;
  
  // Get cost analytics with time series data
  getFleetCostAnalytics(
    fleetAccountId: string,
    options: {
      startDate?: Date;
      endDate?: Date;
      groupBy?: 'day' | 'week' | 'month';
    }
  ): Promise<Array<{
    date: string;
    maintenanceCost: number;
    fuelCost: number;
    totalCost: number;
    serviceTypeBreakdown?: Record<string, number>;
  }>>;
  
  // Get vehicle-specific analytics with maintenance history
  getFleetVehicleAnalytics(fleetAccountId: string): Promise<Array<{
    vehicleId: string;
    unitNumber: string;
    make: string;
    model: string;
    year: number;
    healthScore: number;
    maintenanceHistory: Array<{
      date: Date;
      service: string;
      cost: number;
    }>;
    totalCost: number;
    upcomingPM: Array<{
      date: Date;
      service: string;
      estimatedCost: number;
    }>;
    breakdownFrequency: number;
  }>>;
  
  // Get service type breakdown analytics
  getFleetServiceAnalytics(
    fleetAccountId: string,
    options?: { 
      startDate?: Date; 
      endDate?: Date; 
    }
  ): Promise<Array<{
    serviceType: string;
    serviceTypeId: string;
    jobCount: number;
    totalCost: number;
    avgCost: number;
    percentOfTotal: number;
    trend: 'up' | 'down' | 'stable';
  }>>;
  
  // Get contractor performance analytics
  getFleetContractorAnalytics(
    fleetAccountId: string,
    options?: { 
      startDate?: Date; 
      endDate?: Date; 
    }
  ): Promise<Array<{
    contractorId: string;
    contractorName: string;
    jobCount: number;
    avgRating: number;
    avgResponseTime: number;
    avgCost: number;
    totalCost: number;
    completionRate: number;
    onTimeRate: number;
  }>>;
  
  // ==================== WEATHER SYSTEM ====================
  
  // Save weather data
  saveWeatherData(data: InsertWeatherData): Promise<WeatherData>;
  
  // Get weather for a specific location
  getWeatherForLocation(lat: number, lng: number, isForecast?: boolean): Promise<WeatherData | null>;
  
  // Save weather alert
  saveWeatherAlert(alert: InsertWeatherAlert): Promise<WeatherAlert>;
  
  // Get active weather alerts
  getActiveWeatherAlerts(): Promise<WeatherAlert[]>;
  
  // Record job weather impact
  recordJobWeatherImpact(impact: InsertJobWeatherImpact): Promise<JobWeatherImpact>;
  
  // Get job weather impact
  getJobWeatherImpact(jobId: string): Promise<JobWeatherImpact | null>;
  
  // Update weather data expiration
  updateWeatherDataExpiration(id: string, expiresAt: Date): Promise<void>;
  
  // Get weather alerts for location
  getWeatherAlertsForLocation(lat: number, lng: number): Promise<WeatherAlert[]>;
  
  // Get active jobs (for weather refresh)
  getActiveJobs(): Promise<Job[]>;

  // ==================== EMERGENCY SOS ====================
  
  // Create a new emergency SOS alert
  createSOSAlert(
    userId: string,
    location: { lat: number; lng: number; accuracy?: number; address?: string },
    alertType: 'medical' | 'accident' | 'threat' | 'mechanical' | 'other',
    message: string,
    severity?: 'critical' | 'high' | 'medium' | 'low',
    jobId?: string
  ): Promise<EmergencySosAlert>;
  
  // Acknowledge an SOS alert
  acknowledgeSOSAlert(alertId: string, responderId: string): Promise<EmergencySosAlert>;
  
  // Resolve an SOS alert
  resolveSOSAlert(
    alertId: string,
    resolution: 'resolved' | 'false_alarm' | 'cancelled',
    notes?: string,
    responderId?: string
  ): Promise<EmergencySosAlert>;
  
  // Get all active SOS alerts
  getActiveSOSAlerts(): Promise<EmergencySosAlert[]>;
  
  // Get emergency contacts for a user
  getEmergencyContacts(userId: string): Promise<EmergencyContact[]>;
  
  // Add or update emergency contact
  upsertEmergencyContact(contact: InsertEmergencyContact): Promise<EmergencyContact>;
  
  // Delete emergency contact
  deleteEmergencyContact(contactId: string): Promise<boolean>;
  
  // Find nearby responders to an emergency location
  findNearbyResponders(
    location: { lat: number; lng: number },
    radiusMiles: number
  ): Promise<Array<{
    id: string;
    name: string;
    distance: number;
    estimatedArrival: number;
    location: { lat: number; lng: number };
    phone?: string;
    type: 'contractor' | 'emergency_service' | 'fleet_manager';
    isAvailable: boolean;
  }>>;
  
  // Log emergency response action
  logEmergencyResponse(
    alertId: string,
    action: typeof sosResponseActionEnum.enumValues[number],
    notes?: string,
    responderId?: string
  ): Promise<EmergencyResponseLog>;
  
  // Get SOS alert history for a user
  getSOSAlertHistory(userId: string, limit?: number): Promise<EmergencySosAlert[]>;
  
  // Get response logs for an alert
  getEmergencyResponseLogs(alertId: string): Promise<EmergencyResponseLog[]>;
  
  // Update alert location (for live tracking)
  updateSOSAlertLocation(
    alertId: string,
    location: { lat: number; lng: number; accuracy?: number }
  ): Promise<void>;
  
  // Get SOS alert by ID
  getSOSAlertById(alertId: string): Promise<EmergencySosAlert | null>;
  
  // Get alerts within time range
  getSOSAlertsByTimeRange(startDate: Date, endDate: Date): Promise<EmergencySosAlert[]>;
  
  // Test the SOS system (for drills)
  testSOSSystem(userId: string): Promise<{ success: boolean; message: string }>;

  // ==================== FUEL TRACKING ====================
  
  // Fuel station management
  saveFuelStation(station: InsertFuelStation): Promise<FuelStation>;
  updateFuelStation(stationId: string, updates: Partial<InsertFuelStation>): Promise<FuelStation | null>;
  getAllFuelStations(): Promise<FuelStation[]>;
  getFuelStationById(stationId: string): Promise<FuelStation | null>;
  getFuelStationsNearLocation(lat: number, lng: number, radius: number): Promise<FuelStation[]>;
  getFuelStationsByState(state: string): Promise<FuelStation[]>;
  
  // Fuel price management
  saveFuelPrice(price: InsertFuelPrice): Promise<FuelPrice>;
  updateFuelPriceStatus(priceId: string, isCurrent: boolean): Promise<void>;
  getCurrentFuelPrice(stationId: string, fuelType: string): Promise<FuelPrice | null>;
  getStationCurrentPrices(stationId: string): Promise<FuelPrice[]>;
  getRecentPriceChanges(fuelType?: string): Promise<FuelPrice[]>;
  
  // Fuel price history
  saveFuelPriceHistory(history: InsertFuelPriceHistory): Promise<FuelPriceHistory>;
  getFuelPriceHistory(stationId: string, fuelType?: string, days?: number): Promise<FuelPriceHistory[]>;
  
  // Route fuel stops
  saveRouteFuelStop(stop: InsertRouteFuelStop): Promise<RouteFuelStop>;
  getRouteFuelStops(routeId?: string, jobId?: string): Promise<RouteFuelStop[]>;
  updateRouteFuelStop(stopId: string, updates: Partial<InsertRouteFuelStop>): Promise<RouteFuelStop | null>;
  
  // Fuel price alerts
  saveFuelPriceAlert(alert: InsertFuelPriceAlert): Promise<FuelPriceAlert>;
  getActiveFuelAlerts(): Promise<FuelPriceAlert[]>;
  triggerFuelAlert(alertId: string, updates: Partial<InsertFuelPriceAlert>): Promise<FuelPriceAlert | null>;
  getUserFuelAlerts(userId?: string, fleetAccountId?: string): Promise<FuelPriceAlert[]>;
  
  // Fuel price aggregates
  saveFuelPriceAggregate(aggregate: InsertFuelPriceAggregate): Promise<FuelPriceAggregate>;
  getRegionalPriceTrends(state: string, fuelType?: string): Promise<FuelPriceAggregate[]>;
  getLowestFuelPrices(lat: number, lng: number, radius: number, fuelType?: string, limit?: number): Promise<Array<{
    station: FuelStation;
    price: FuelPrice;
    distance: number;
  }>>;
  
  // ==================== PAYMENT RECONCILIATION & COMMISSIONS ====================
  
  // Commission rule management
  saveCommissionRule(rule: InsertCommissionRule): Promise<CommissionRule>;
  updateCommissionRule(ruleId: string, updates: Partial<InsertCommissionRule>): Promise<CommissionRule | null>;
  getCommissionRules(userType?: 'contractor' | 'fleet', isActive?: boolean): Promise<CommissionRule[]>;
  getCommissionRuleById(ruleId: string): Promise<CommissionRule | null>;
  deleteCommissionRule(ruleId: string): Promise<boolean>;
  
  // Commission calculation and transactions
  calculateCommission(jobId: string, contractorId: string, baseAmount: number, surgeMultiplier?: number): Promise<InsertCommissionTransaction>;
  saveCommissionTransaction(transaction: InsertCommissionTransaction): Promise<CommissionTransaction>;
  getCommissionTransactionByJobId(jobId: string): Promise<CommissionTransaction | null>;
  getCommissionTransactions(contractorId?: string, status?: string, limit?: number): Promise<CommissionTransaction[]>;
  updateCommissionTransaction(transactionId: string, updates: Partial<InsertCommissionTransaction>): Promise<CommissionTransaction | null>;
  
  // Payment reconciliation
  processReconciliation(
    periodType: 'daily' | 'weekly' | 'monthly' | 'quarterly',
    periodStart: Date,
    periodEnd: Date,
    createdBy?: string
  ): Promise<PaymentReconciliation>;
  getReconciliationReport(
    periodType?: 'daily' | 'weekly' | 'monthly' | 'quarterly',
    startDate?: Date,
    endDate?: Date,
    status?: string
  ): Promise<PaymentReconciliation[]>;
  getReconciliationById(reconciliationId: string): Promise<PaymentReconciliation | null>;
  updateReconciliationStatus(reconciliationId: string, status: string, notes?: string): Promise<PaymentReconciliation | null>;
  
  // Payout batch management
  createPayoutBatch(
    contractorId: string,
    periodStart: Date,
    periodEnd: Date,
    reconciliationId?: string,
    createdBy?: string
  ): Promise<PayoutBatch>;
  processPayoutBatch(batchId: string, paymentMethod: string, paymentReference?: string): Promise<PayoutBatch>;
  getPendingPayouts(contractorId?: string): Promise<PayoutBatch[]>;
  getPayoutBatchById(batchId: string): Promise<PayoutBatch | null>;
  updatePayoutBatchStatus(batchId: string, status: string, failureReason?: string): Promise<PayoutBatch | null>;
  
  // Contractor earnings
  getContractorEarnings(
    contractorId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalEarnings: number;
    totalCommissions: number;
    netPayout: number;
    pendingPayouts: number;
    completedPayouts: number;
    transactions: CommissionTransaction[];
  }>;
  getContractorMonthlyVolume(contractorId: string, month?: Date): Promise<number>;
  
  // Commission disputes and adjustments
  handleCommissionDispute(
    transactionId: string,
    disputeReason: string,
    adjustmentAmount?: number
  ): Promise<CommissionTransaction>;
  getDisputedCommissions(contractorId?: string): Promise<CommissionTransaction[]>;
  resolveCommissionDispute(transactionId: string, resolution: string): Promise<CommissionTransaction>;
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

  async findUsers(filters: { phone?: string; email?: string; role?: string }): Promise<User[]> {
    const conditions: any[] = [];
    
    if (filters.phone) {
      conditions.push(eq(users.phone, filters.phone));
    }
    if (filters.email) {
      conditions.push(eq(users.email, filters.email));
    }
    if (filters.role) {
      conditions.push(eq(users.role, filters.role as typeof userRoleEnum.enumValues[number]));
    }
    
    if (conditions.length === 0) {
      return await db.select().from(users).limit(100);
    }
    
    return await db.select()
      .from(users)
      .where(and(...conditions))
      .limit(100);
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    // Debug: Log the update details
    console.log(`[updateUser] Updating user ${id} with:`, {
      ...updates,
      password: updates.password ? '[REDACTED]' : undefined
    });
    
    const result = await db.update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    
    // Debug: Log the result
    console.log(`[updateUser] Update result for user ${id}:`, result.length > 0 ? 'Success' : 'Failed');
    if (result.length > 0) {
      console.log(`[updateUser] Updated user data:`, {
        id: result[0].id,
        email: result[0].email,
        hasPassword: !!result[0].password,
        updatedAt: result[0].updatedAt
      });
    }
    
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

  // Initialize profiles for all contractors that don't have one
  async ensureAllContractorsHaveProfiles(): Promise<{created: number, existing: number}> {
    try {
      console.log('[InitProfiles] Starting to ensure all contractors have profiles...');
      
      // Get all users with contractor role
      const contractors = await db
        .select()
        .from(users)
        .where(eq(users.role, 'contractor'));
      
      console.log(`[InitProfiles] Found ${contractors.length} total contractors`);
      
      // Get existing contractor profiles
      const existingProfiles = await db
        .select({ userId: contractorProfiles.userId })
        .from(contractorProfiles);
      
      const existingProfileUserIds = new Set(existingProfiles.map(p => p.userId));
      console.log(`[InitProfiles] Found ${existingProfiles.length} existing profiles`);
      
      // Find contractors without profiles
      const contractorsWithoutProfiles = contractors.filter(c => !existingProfileUserIds.has(c.id));
      console.log(`[InitProfiles] Found ${contractorsWithoutProfiles.length} contractors without profiles`);
      
      // Create profiles for contractors that don't have one
      let created = 0;
      for (const contractor of contractorsWithoutProfiles) {
        try {
          const companyName = contractor.firstName && contractor.lastName 
            ? `${contractor.firstName} ${contractor.lastName} Services`
            : contractor.email?.split('@')[0] + ' Services' || 'Contractor Services';
          
          await db.insert(contractorProfiles).values({
            userId: contractor.id,
            companyName,
            performanceTier: 'bronze',  // Default to bronze tier
            serviceRadius: 50,           // Default 50 mile radius
            averageResponseTime: null,
            totalJobsCompleted: 0,
            averageRating: null,
            totalReviews: 0,
            fiveStarCount: 0,
            fourStarCount: 0,
            threeStarCount: 0,
            twoStarCount: 0,
            oneStarCount: 0,
            isVerifiedContractor: false,
            isFeaturedContractor: false,
            profileCompleteness: 20,    // Basic profile only
            isFleetCapable: false,
            hasMobileWaterSource: false,
            hasWastewaterRecovery: false,
            isAvailable: true,           // Default to available
            isOnline: false,
            lastAssignedAt: null,
            lastHeartbeatAt: null,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          
          created++;
          console.log(`[InitProfiles] Created profile for contractor: ${contractor.email || contractor.id}`);
        } catch (error) {
          console.error(`[InitProfiles] Error creating profile for contractor ${contractor.id}:`, error);
          // Continue with other contractors even if one fails
        }
      }
      
      console.log(`[InitProfiles] Profile initialization complete. Created: ${created}, Existing: ${existingProfiles.length}`);
      
      return {
        created,
        existing: existingProfiles.length
      };
    } catch (error) {
      console.error('[InitProfiles] Error ensuring contractor profiles:', error);
      throw error;
    }
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

  async findContractors(filters: { 
    status?: string;
    performanceTier?: string;
    isAvailable?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    console.log('findContractors called with filters:', filters);
    
    const query = db
      .select({
        id: users.id,
        name: sql<string>`COALESCE(${users.firstName} || ' ' || ${users.lastName}, ${users.firstName}, ${users.email})`,
        email: users.email,
        phone: users.phone,
        company: contractorProfiles.companyName,
        status: sql<string>`CASE WHEN ${users.isActive} = true THEN 'active' ELSE 'suspended' END`,
        tier: contractorProfiles.performanceTier,
        rating: contractorProfiles.averageRating,
        totalJobs: contractorProfiles.totalJobsCompleted,
        completedJobs: contractorProfiles.totalJobsCompleted,
        avgResponseTime: contractorProfiles.averageResponseTime,
        totalEarnings: sql<number>`0`,  // Simplified to avoid join issue
        currentBalance: sql<number>`0`, // Simplified to avoid join issue
        documentsVerified: contractorProfiles.isVerifiedContractor,
        isAvailable: contractorProfiles.isAvailable,
        joinedAt: users.createdAt
      })
      .from(users)
      .leftJoin(contractorProfiles, eq(users.id, contractorProfiles.userId))
      .where(eq(users.role, 'contractor'));

    const conditions = [];
    
    if (filters.performanceTier) {
      conditions.push(eq(contractorProfiles.performanceTier, filters.performanceTier as any));
    }
    
    if (filters.isAvailable !== undefined) {
      conditions.push(eq(contractorProfiles.isAvailable, filters.isAvailable));
    }
    
    if (filters.search) {
      conditions.push(
        or(
          ilike(users.firstName, `%${filters.search}%`),
          ilike(users.lastName, `%${filters.search}%`),
          ilike(users.email, `%${filters.search}%`),
          ilike(users.phone, `%${filters.search}%`),
          ilike(contractorProfiles.companyName, `%${filters.search}%`)
        )
      );
    }

    let finalQuery = query;
    if (conditions.length > 0) {
      finalQuery = query.where(and(...conditions)) as any;
    }

    if (filters.limit) {
      finalQuery = finalQuery.limit(filters.limit) as any;
    }
    if (filters.offset) {
      finalQuery = finalQuery.offset(filters.offset) as any;
    }

    return await finalQuery;
  }

  async updateContractorStatus(contractorId: string, status: string): Promise<boolean> {
    const result = await db.update(users)
      .set({ role: status === 'active' ? 'contractor' : 'driver', updatedAt: new Date() })
      .where(eq(users.id, contractorId))
      .returning();
    
    // Also update the contractor application status if it exists
    if (status === 'active' || status === 'rejected') {
      await db.update(contractorApplications)
        .set({ status: status as any, updatedAt: new Date() })
        .where(eq(contractorApplications.userId, contractorId));
    }
    
    return result.length > 0;
  }

  async getPendingContractors(): Promise<any[]> {
    return await db
      .select({
        id: contractorApplications.userId,
        applicationId: contractorApplications.id,
        name: sql<string>`${contractorApplications.firstName} || ' ' || ${contractorApplications.lastName}`,
        firstName: contractorApplications.firstName,
        lastName: contractorApplications.lastName,
        email: contractorApplications.email,
        phone: contractorApplications.phone,
        company: contractorApplications.companyName,
        status: contractorApplications.status,
        experience: contractorApplications.yearsExperience,
        hasInsurance: contractorApplications.hasInsurance,
        insuranceProvider: contractorApplications.insuranceProvider,
        policyNumber: contractorApplications.policyNumber,
        documentsSubmitted: contractorApplications.documentsSubmitted,
        documentsRequired: contractorApplications.documentsRequired,
        createdAt: contractorApplications.createdAt
      })
      .from(contractorApplications)
      .where(eq(contractorApplications.status, 'pending'))
      .orderBy(desc(contractorApplications.createdAt));
  }

  async checkUserRole(userId: string, requiredRole: string): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) return false;
    return user.role === requiredRole;
  }

  async updateContractorDetails(contractorId: string, details: {
    name: string;
    company: string;
    email: string;
    phone: string;
    status?: string;
  }): Promise<any> {
    console.log('[updateContractorDetails] Called with:', { contractorId, details });
    
    try {
      // Parse name into first and last name
      const nameParts = details.name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      console.log('[updateContractorDetails] Parsed name:', { firstName, lastName });

      // Start a transaction to update both tables
      const result = await db.transaction(async (tx) => {
        // Update users table
        const userUpdates: any = {
          firstName,
          lastName,
          email: details.email,
          phone: details.phone
        };
        
        // Map status to isActive boolean
        if (details.status) {
          userUpdates.isActive = details.status === 'active';
        }
        
        await tx.update(users)
          .set(userUpdates)
          .where(eq(users.id, contractorId));

        // Update contractor_profiles table
        const profileUpdates: any = {
          companyName: details.company
        };
        
        // Only update if there are actual profile updates
        if (Object.keys(profileUpdates).length > 0) {
          await tx.update(contractorProfiles)
            .set(profileUpdates)
            .where(eq(contractorProfiles.userId, contractorId));
        }

        // Fetch and return updated contractor
        // Directly query with raw SQL to avoid Drizzle query builder issues
        const result = await tx.execute<any>(sql`
          SELECT 
            u.id,
            u.first_name as "firstName",
            u.last_name as "lastName",
            u.email,
            u.phone,
            u.is_active as "userIsActive",
            cp.company_name as "companyName",
            cp.performance_tier as "performanceTier",
            cp.average_rating as "averageRating"
          FROM users u
          LEFT JOIN contractor_profiles cp ON u.id = cp.user_id
          WHERE u.id = ${contractorId}
          LIMIT 1
        `);

        if (!result || result.rows.length === 0) {
          console.log('[updateContractorDetails] User not found after update');
          return null;
        }

        const row = result.rows[0];
        // Map isActive boolean to status string
        const statusValue = row.userIsActive ? 'active' : 'suspended';
        
        const combinedResult = {
          id: row.id,
          firstName: row.firstName,
          lastName: row.lastName,
          name: `${row.firstName || ''} ${row.lastName || ''}`.trim(),
          email: row.email,
          phone: row.phone,
          status: statusValue,
          companyName: row.companyName || '',
          company: row.companyName || '',
          performanceTier: row.performanceTier || 'bronze',
          averageRating: parseFloat(row.averageRating) || 0,
          isActive: row.userIsActive || false
        };

        console.log('[updateContractorDetails] Returning updated contractor:', combinedResult);
        return combinedResult;
      });

      return result;
    } catch (error: any) {
      console.error('[updateContractorDetails] Database error:', {
        message: error.message,
        code: error.code,
        detail: error.detail,
        constraint: error.constraint,
        table: error.table,
        column: error.column,
        fullError: error
      });
      
      // Check for unique constraint violations
      if (error.message?.includes('unique') || error.code === '23505') {
        throw new Error('Email address is already in use');
      }
      
      throw error;
    }
  }

  async getContractorDrivers(contractorId: string): Promise<any[]> {
    try {
      // Get only approved drivers managed by this contractor
      const drivers = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          phone: users.phone,
          cdlNumber: driverProfiles.cdlNumber,
          cdlState: driverProfiles.cdlState,
          carrierName: driverProfiles.carrierName,
          approvalStatus: driverProfiles.approvalStatus,
          isActive: users.isActive,
          createdAt: driverProfiles.createdAt
        })
        .from(users)
        .leftJoin(driverProfiles, eq(users.id, driverProfiles.userId))
        .where(
          and(
            eq(users.role, 'driver'),
            eq(driverProfiles.managedByContractorId, contractorId),
            eq(driverProfiles.approvalStatus, 'approved') // Only return approved drivers
          )
        );
      
      // Return formatted driver data
      return drivers.map(driver => ({
        ...driver,
        activeJobs: 0, // TODO: Calculate from jobs table
        completedJobs: 0 // TODO: Calculate from jobs table
      }));
    } catch (error) {
      console.error('Error fetching contractor drivers:', error);
      return [];
    }
  }

  async addDriver(contractorId: string, driverData: any): Promise<DriverProfile> {
    try {
      // First create the user account for the driver
      const user = await db.insert(users).values({
        email: driverData.email,
        phone: driverData.phone,
        firstName: driverData.firstName,
        lastName: driverData.lastName,
        role: 'driver',
        password: await bcrypt.hash(driverData.phone, 10), // Temporary password using phone
        isActive: true
      }).returning();

      // Then create the driver profile with pending approval status
      const driverProfile = await db.insert(driverProfiles).values({
        userId: user[0].id,
        cdlNumber: driverData.cdlNumber,
        cdlState: driverData.cdlState,
        carrierName: driverData.carrierName,
        dotNumber: driverData.dotNumber,
        managedByContractorId: contractorId,
        approvalStatus: 'pending' // Always set to pending for admin approval
      }).returning();

      return driverProfile[0];
    } catch (error) {
      console.error('Error adding driver:', error);
      throw error;
    }
  }

  async getPendingDriverApplications(): Promise<any[]> {
    try {
      const pendingDrivers = await db
        .select({
          id: driverProfiles.id,
          userId: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          phone: users.phone,
          cdlNumber: driverProfiles.cdlNumber,
          cdlState: driverProfiles.cdlState,
          carrierName: driverProfiles.carrierName,
          dotNumber: driverProfiles.dotNumber,
          managedByContractorId: driverProfiles.managedByContractorId,
          contractorName: contractorProfiles.companyName,
          approvalStatus: driverProfiles.approvalStatus,
          createdAt: driverProfiles.createdAt
        })
        .from(driverProfiles)
        .innerJoin(users, eq(users.id, driverProfiles.userId))
        .leftJoin(contractorProfiles, eq(contractorProfiles.userId, driverProfiles.managedByContractorId))
        .where(eq(driverProfiles.approvalStatus, 'pending'))
        .orderBy(desc(driverProfiles.createdAt));

      return pendingDrivers;
    } catch (error) {
      console.error('Error fetching pending driver applications:', error);
      return [];
    }
  }

  async approveDriver(driverId: string, approvedBy: string): Promise<boolean> {
    try {
      const result = await db
        .update(driverProfiles)
        .set({
          approvalStatus: 'approved',
          approvedAt: new Date(),
          approvedBy: approvedBy,
          updatedAt: new Date()
        })
        .where(eq(driverProfiles.id, driverId))
        .returning();

      return result.length > 0;
    } catch (error) {
      console.error('Error approving driver:', error);
      return false;
    }
  }

  async rejectDriver(driverId: string, rejectedBy: string): Promise<boolean> {
    try {
      const result = await db
        .update(driverProfiles)
        .set({
          approvalStatus: 'rejected',
          rejectedAt: new Date(),
          approvedBy: rejectedBy, // Store who rejected it in approvedBy field
          updatedAt: new Date()
        })
        .where(eq(driverProfiles.id, driverId))
        .returning();

      return result.length > 0;
    } catch (error) {
      console.error('Error rejecting driver:', error);
      return false;
    }
  }

  async getAvailableContractors(jobLat?: number, jobLon?: number): Promise<any[]> {
    try {
      console.log('[getAvailableContractors] Fetching contractors for assignment, jobLat:', jobLat, 'jobLon:', jobLon);
      
      // Get all contractors - be less strict about availability
      // We'll include all contractors with a profile, regardless of isAvailable status
      const contractors = await db
        .select()
        .from(users)
        .leftJoin(contractorProfiles, eq(users.id, contractorProfiles.userId))
        .where(
          eq(users.role, 'contractor')
        );
      
      console.log(`[getAvailableContractors] Found ${contractors.length} total contractors`);

      // Calculate distance if job coordinates provided and format response
      return contractors.map(row => {
        const fullName = `${row.users.firstName || ''} ${row.users.lastName || ''}`.trim() || row.users.email;
        let distance = 0;
        
        // Calculate distance if coordinates available
        if (jobLat && jobLon && row.contractor_profiles?.baseLocationLat && row.contractor_profiles?.baseLocationLon) {
          const contractorLat = row.contractor_profiles.baseLocationLat;
          const contractorLon = row.contractor_profiles.baseLocationLon;
          
          // Haversine formula for distance calculation
          const R = 3959; // miles
          const dLat = (contractorLat - jobLat) * Math.PI / 180;
          const dLon = (contractorLon - jobLon) * Math.PI / 180;
          const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(jobLat * Math.PI / 180) * Math.cos(contractorLat * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          distance = Math.round(R * c * 10) / 10;
        }

        return {
          id: row.users.id,
          name: fullName,
          distance,
          rating: row.contractor_profiles?.averageRating || 0,
          tier: row.contractor_profiles?.performanceTier || 'bronze',
          isAvailable: row.contractor_profiles?.isAvailable || false
        };
      });
    } catch (error) {
      console.error('Error in getAvailableContractors:', error);
      throw error;
    }
  }

  async getAvailableContractorsForAssignment(jobLat?: number, jobLon?: number): Promise<any[]> {
    try {
      console.log('[AssignJob] Getting available contractors for assignment with queue info');
      
      // Get ALL contractors with their profiles (LEFT JOIN ensures we get all contractors)
      // Even if they don't have a profile entry
      const contractors = await db
        .select()
        .from(users)
        .leftJoin(contractorProfiles, eq(users.id, contractorProfiles.userId))
        .where(
          eq(users.role, 'contractor')  // Only filter by role
        );

      console.log(`[AssignJob] Found ${contractors.length} contractors (including those without profiles)`);

      // Process and calculate distance for each contractor
      const processedContractors = await Promise.all(contractors.map(async row => {
        // Log contractor details for debugging
        console.log(`[AssignJob] Processing contractor: ID=${row.users.id}, Email=${row.users.email}, HasProfile=${!!row.contractor_profiles}`);
        
        // Check if contractor is on vacation
        const today = new Date();
        const contractorVacations = await db.select()
          .from(vacationRequests)
          .where(
            and(
              eq(vacationRequests.contractorId, row.users.id),
              eq(vacationRequests.status, 'approved'),
              sql`${vacationRequests.startDate} <= ${today}`,
              sql`${vacationRequests.endDate} >= ${today}`
            )
          )
          .limit(1);
        
        if (contractorVacations.length > 0) {
          console.log(`[AssignJob] Contractor ${row.users.id} is on vacation, skipping`);
          return null; // Skip contractors on vacation
        }
        
        // Check availability overrides for today
        const todayOverrides = await db.select()
          .from(availabilityOverrides)
          .where(
            and(
              eq(availabilityOverrides.contractorId, row.users.id),
              eq(availabilityOverrides.date, today),
              eq(availabilityOverrides.isAvailable, false)
            )
          )
          .limit(1);
        
        if (todayOverrides.length > 0) {
          console.log(`[AssignJob] Contractor ${row.users.id} is unavailable today, skipping`);
          return null; // Skip unavailable contractors
        }
        
        const fullName = `${row.users.firstName || ''} ${row.users.lastName || ''}`.trim() || row.users.email || 'Unknown';
        let distance = 0;
        
        // Calculate distance if coordinates available
        if (jobLat && jobLon && row.contractor_profiles?.baseLocationLat && row.contractor_profiles?.baseLocationLon) {
          const contractorLat = row.contractor_profiles.baseLocationLat;
          const contractorLon = row.contractor_profiles.baseLocationLon;
          
          // Haversine formula for distance calculation
          const R = 3959; // Earth radius in miles
          const lat1 = jobLat * Math.PI / 180;
          const lat2 = Number(contractorLat) * Math.PI / 180;
          const deltaLat = (Number(contractorLat) - jobLat) * Math.PI / 180;
          const deltaLon = (Number(contractorLon) - jobLon) * Math.PI / 180;
          
          const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
                   Math.cos(lat1) * Math.cos(lat2) *
                   Math.sin(deltaLon/2) * Math.sin(deltaLon/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          distance = R * c;
        }

        // Get queue information for this contractor
        const queue = await this.getContractorQueue(row.users.id);
        const currentJobInfo = await this.getContractorCurrentJob(row.users.id);
        
        // Count jobs in different statuses in the queue
        const queueLength = queue.filter(q => q.status === 'pending').length;
        const activeJobCount = queue.filter(q => q.status === 'active').length;
        
        // Get current job details if the contractor is busy
        let currentJob = null;
        let currentJobNumber = null;
        if (currentJobInfo.job) {
          currentJob = {
            id: currentJobInfo.job.id,
            jobNumber: currentJobInfo.job.jobNumber,
            serviceType: currentJobInfo.job.serviceTypeId || 'Service',
            customerName: currentJobInfo.job.customerName || 'Customer',
            status: currentJobInfo.job.status
          };
          currentJobNumber = `#${activeJobCount + 1} of ${activeJobCount + queueLength + 1}`;
        }

        const isCurrentlyBusy = activeJobCount > 0;

        // Default values for contractors without profiles
        const defaultServiceRadius = 50;
        const defaultPerformanceTier = 'bronze';
        const defaultIsAvailable = true;  // Assume available if no profile

        const contractor = {
          id: row.users.id,
          email: row.users.email,
          firstName: row.users.firstName,
          lastName: row.users.lastName,
          phone: row.users.phone,
          name: fullName,
          // Use defaults if no profile exists
          performanceTier: row.contractor_profiles?.performanceTier || defaultPerformanceTier,
          averageRating: row.contractor_profiles?.averageRating ? Number(row.contractor_profiles.averageRating) : 0,
          totalJobsCompleted: row.contractor_profiles?.totalJobsCompleted || 0,
          serviceRadius: row.contractor_profiles?.serviceRadius || defaultServiceRadius,
          isOnline: row.contractor_profiles?.isOnline || false,
          isAvailable: row.contractor_profiles?.isAvailable !== undefined ? row.contractor_profiles.isAvailable : defaultIsAvailable,
          lastAssignedAt: row.contractor_profiles?.lastAssignedAt || null,
          lastHeartbeatAt: row.contractor_profiles?.lastHeartbeatAt || null,
          distance: Math.round(distance * 10) / 10,
          withinServiceRadius: !jobLat || !jobLon || distance <= (row.contractor_profiles?.serviceRadius || defaultServiceRadius),
          // Add queue information
          queueLength,
          isCurrentlyBusy,
          currentJob,
          currentJobNumber,
          totalQueuedJobs: activeJobCount + queueLength,
          // Debug field to track contractors without profiles
          hasProfile: !!row.contractor_profiles
        };
        
        console.log(`[AssignJob] Contractor: ${contractor.name}, Tier: ${contractor.performanceTier}, Queue: ${contractor.queueLength}, Busy: ${contractor.isCurrentlyBusy}, HasProfile: ${contractor.hasProfile}`);
        
        return contractor;
      }));

      // Filter out null values (contractors on vacation or unavailable)
      const availableContractors = processedContractors.filter(c => c !== null);

      // Filter contractors within service radius if location provided
      const eligibleContractors = jobLat && jobLon 
        ? availableContractors.filter(c => c.withinServiceRadius)
        : availableContractors;

      console.log(`[AssignJob] ${eligibleContractors.length} contractors within service radius`);

      // Sort contractors: first by queue length (less busy first), then by tier and round-robin
      const sortedContractors = eligibleContractors.sort((a, b) => {
        // First priority: Available contractors (no queue) come first
        if (a.totalQueuedJobs === 0 && b.totalQueuedJobs > 0) return -1;
        if (b.totalQueuedJobs === 0 && a.totalQueuedJobs > 0) return 1;
        
        // Second priority: Tier (gold > silver > bronze)
        const tierOrder = { gold: 3, silver: 2, bronze: 1 };
        const tierA = tierOrder[a.performanceTier as keyof typeof tierOrder] || 1;
        const tierB = tierOrder[b.performanceTier as keyof typeof tierOrder] || 1;
        if (tierA !== tierB) return tierB - tierA;
        
        // Third priority: Less queued jobs
        if (a.totalQueuedJobs !== b.totalQueuedJobs) {
          return a.totalQueuedJobs - b.totalQueuedJobs;
        }
        
        // Fourth priority: Round-robin (least recently assigned)
        if (!a.lastAssignedAt && b.lastAssignedAt) return -1;
        if (a.lastAssignedAt && !b.lastAssignedAt) return 1;
        if (a.lastAssignedAt && b.lastAssignedAt) {
          return new Date(a.lastAssignedAt).getTime() - new Date(b.lastAssignedAt).getTime();
        }
        
        return 0;
      });

      return sortedContractors;
    } catch (error) {
      console.error('[AssignJob] Error in getAvailableContractorsForAssignment:', error);
      throw error;
    }
  }

  async hasAdminUsers(): Promise<boolean> {
    const result = await db.select().from(users).where(eq(users.role, 'admin')).limit(1);
    return result.length > 0;
  }

  async createPasswordResetToken(userId: string, email: string): Promise<string> {
    // Generate a secure random token
    const token = randomBytes(32).toString('hex');
    
    // Calculate expiration time (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    
    // Insert into passwordResetTokens table
    await db.insert(passwordResetTokens).values({
      userId,
      token,
      email,
      expiresAt
    });
    
    // Return the token
    return token;
  }

  async validatePasswordResetToken(token: string): Promise<{ userId: string; email: string } | null> {
    // Query passwordResetTokens table by token
    const results = await db
      .select({
        userId: passwordResetTokens.userId,
        email: passwordResetTokens.email,
        expiresAt: passwordResetTokens.expiresAt,
        usedAt: passwordResetTokens.usedAt
      })
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token))
      .limit(1);
    
    if (results.length === 0) {
      return null;
    }
    
    const resetToken = results[0];
    
    // Check if token hasn't expired
    if (new Date() > new Date(resetToken.expiresAt)) {
      return null;
    }
    
    // Check if token hasn't been used (usedAt is null)
    if (resetToken.usedAt !== null) {
      return null;
    }
    
    // Return userId and email if valid
    return {
      userId: resetToken.userId,
      email: resetToken.email
    };
  }

  async usePasswordResetToken(token: string, newPassword: string): Promise<boolean> {
    // First validate the token
    const tokenData = await this.validatePasswordResetToken(token);
    
    if (!tokenData) {
      return false;
    }
    
    try {
      // Hash the new password using bcrypt
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Start a database transaction
      await db.transaction(async (tx) => {
        // Update the user's password in users table
        await tx
          .update(users)
          .set({ 
            password: hashedPassword,
            updatedAt: new Date()
          })
          .where(eq(users.id, tokenData.userId));
        
        // Mark the token as used (set usedAt to current timestamp)
        await tx
          .update(passwordResetTokens)
          .set({ 
            usedAt: new Date()
          })
          .where(eq(passwordResetTokens.token, token));
      });
      
      // Return true if successful
      return true;
    } catch (error) {
      console.error('Error using password reset token:', error);
      return false;
    }
  }

  async revokePasswordResetToken(token: string): Promise<boolean> {
    // Update passwordResetTokens to set usedAt to current timestamp
    const result = await db
      .update(passwordResetTokens)
      .set({ 
        usedAt: new Date()
      })
      .where(eq(passwordResetTokens.token, token));
    
    // Return true if a row was updated
    // Drizzle ORM returns an object with rowCount property
    return (result as any).rowCount > 0;
  }

  // ==================== USER MANAGEMENT OPERATIONS ====================
  
  async getAllUsers(filters?: {
    role?: string;
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    try {
      // Build base query with joins
      const query = db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          name: sql<string>`COALESCE(${users.firstName} || ' ' || ${users.lastName}, ${users.firstName}, ${users.lastName}, ${users.email})`,
          email: users.email,
          phone: users.phone,
          role: users.role,
          status: sql<string>`CASE WHEN ${users.isActive} = true THEN 'active' ELSE 'suspended' END`,
          isActive: users.isActive,
          createdAt: users.createdAt,
          lastLoginAt: users.lastLoginAt,
          emailVerified: sql<boolean>`${users.email} IS NOT NULL`,
          twoFactorEnabled: sql<boolean>`false`,
          // Contractor specific fields
          companyName: contractorProfiles.companyName,
          performanceTier: contractorProfiles.performanceTier,
          averageRating: contractorProfiles.averageRating,
          totalJobsCompleted: contractorProfiles.totalJobsCompleted,
          // Driver specific fields
          cdlNumber: driverProfiles.cdlNumber,
          cdlState: driverProfiles.cdlState,
          carrierName: driverProfiles.carrierName,
          approvalStatus: driverProfiles.approvalStatus
        })
        .from(users)
        .leftJoin(contractorProfiles, eq(users.id, contractorProfiles.userId))
        .leftJoin(driverProfiles, eq(users.id, driverProfiles.userId));

      const conditions = [];
      
      // Filter by role
      if (filters?.role && filters.role !== 'all') {
        conditions.push(eq(users.role, filters.role as typeof userRoleEnum.enumValues[number]));
      }
      
      // Filter by status
      if (filters?.status && filters.status !== 'all') {
        conditions.push(eq(users.isActive, filters.status === 'active'));
      }
      
      // Search filter
      if (filters?.search) {
        conditions.push(
          or(
            ilike(users.firstName, `%${filters.search}%`),
            ilike(users.lastName, `%${filters.search}%`),
            ilike(users.email, `%${filters.search}%`),
            ilike(users.phone, `%${filters.search}%`)
          )
        );
      }

      // Apply conditions
      let finalQuery = query;
      if (conditions.length > 0) {
        finalQuery = query.where(and(...conditions)) as any;
      }

      // Apply ordering
      finalQuery = finalQuery.orderBy(desc(users.createdAt)) as any;

      // Apply pagination
      if (filters?.limit) {
        finalQuery = finalQuery.limit(filters.limit) as any;
      }
      if (filters?.offset) {
        finalQuery = finalQuery.offset(filters.offset) as any;
      }

      const result = await finalQuery;
      
      // Format the result to match UI expectations
      return result.map(user => ({
        id: user.id,
        name: user.name || 'Unknown',
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        isActive: user.isActive,
        createdAt: user.createdAt,
        lastLogin: user.lastLoginAt,
        totalJobs: user.totalJobsCompleted || 0,
        emailVerified: user.emailVerified,
        twoFactorEnabled: user.twoFactorEnabled,
        company: user.companyName,
        tier: user.performanceTier,
        rating: user.averageRating,
        cdlNumber: user.cdlNumber,
        cdlState: user.cdlState,
        carrierName: user.carrierName,
        approvalStatus: user.approvalStatus
      }));
    } catch (error) {
      console.error('Error in getAllUsers:', error);
      return [];
    }
  }

  async getAdminUsers(): Promise<User[]> {
    try {
      const adminUsers = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.role, 'admin'),
            eq(users.isActive, true)
          )
        );
      return adminUsers;
    } catch (error) {
      console.error('Error in getAdminUsers:', error);
      return [];
    }
  }

  async getUserById(id: string): Promise<any> {
    try {
      const result = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          name: sql<string>`COALESCE(${users.firstName} || ' ' || ${users.lastName}, ${users.firstName}, ${users.lastName}, ${users.email})`,
          email: users.email,
          phone: users.phone,
          role: users.role,
          status: sql<string>`CASE WHEN ${users.isActive} = true THEN 'active' ELSE 'suspended' END`,
          isActive: users.isActive,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
          lastLoginAt: users.lastLoginAt,
          emailVerified: sql<boolean>`${users.email} IS NOT NULL`,
          twoFactorEnabled: sql<boolean>`false`,
          // Contractor specific fields
          companyName: contractorProfiles.companyName,
          performanceTier: contractorProfiles.performanceTier,
          averageRating: contractorProfiles.averageRating,
          totalJobsCompleted: contractorProfiles.totalJobsCompleted,
          serviceRadius: contractorProfiles.serviceRadius,
          isAvailable: contractorProfiles.isAvailable,
          // Driver specific fields
          cdlNumber: driverProfiles.cdlNumber,
          cdlState: driverProfiles.cdlState,
          carrierName: driverProfiles.carrierName,
          dotNumber: driverProfiles.dotNumber,
          approvalStatus: driverProfiles.approvalStatus,
          managedByContractorId: driverProfiles.managedByContractorId
        })
        .from(users)
        .leftJoin(contractorProfiles, eq(users.id, contractorProfiles.userId))
        .leftJoin(driverProfiles, eq(users.id, driverProfiles.userId))
        .where(eq(users.id, id))
        .limit(1);

      if (result.length === 0) {
        return undefined;
      }

      const user = result[0];
      
      return {
        id: user.id,
        name: user.name || 'Unknown',
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLogin: user.lastLoginAt,
        emailVerified: user.emailVerified,
        twoFactorEnabled: user.twoFactorEnabled,
        // Additional details based on role
        ...(user.role === 'contractor' && {
          company: user.companyName,
          tier: user.performanceTier,
          rating: user.averageRating,
          totalJobs: user.totalJobsCompleted || 0,
          serviceRadius: user.serviceRadius,
          isAvailable: user.isAvailable
        }),
        ...(user.role === 'driver' && {
          cdlNumber: user.cdlNumber,
          cdlState: user.cdlState,
          carrierName: user.carrierName,
          dotNumber: user.dotNumber,
          approvalStatus: user.approvalStatus,
          managedByContractorId: user.managedByContractorId
        })
      };
    } catch (error) {
      console.error('Error in getUserById:', error);
      return undefined;
    }
  }

  async updateUserStatus(userId: string, isActive: boolean): Promise<User | undefined> {
    try {
      const result = await db.update(users)
        .set({ 
          isActive, 
          updatedAt: new Date() 
        })
        .where(eq(users.id, userId))
        .returning();
      
      return result[0];
    } catch (error) {
      console.error('Error in updateUserStatus:', error);
      return undefined;
    }
  }

  async updateUserRole(userId: string, newRole: typeof userRoleEnum.enumValues[number]): Promise<User | undefined> {
    try {
      const result = await db.update(users)
        .set({ 
          role: newRole, 
          updatedAt: new Date() 
        })
        .where(eq(users.id, userId))
        .returning();
      
      return result[0];
    } catch (error) {
      console.error('Error in updateUserRole:', error);
      return undefined;
    }
  }

  async resetUserPassword(userId: string, newPassword: string): Promise<boolean> {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      const result = await db.update(users)
        .set({ 
          password: hashedPassword, 
          updatedAt: new Date() 
        })
        .where(eq(users.id, userId))
        .returning();
      
      return result.length > 0;
    } catch (error) {
      console.error('Error in resetUserPassword:', error);
      return false;
    }
  }

  async createPasswordResetToken(userId: string, email: string): Promise<string | null> {
    try {
      // Generate a secure random token
      const token = randomBytes(32).toString('hex');
      
      // Mark any existing tokens for this user as used
      await db.update(passwordResetTokens)
        .set({ usedAt: new Date() })
        .where(
          and(
            eq(passwordResetTokens.userId, userId),
            isNull(passwordResetTokens.usedAt)
          )
        );
      
      // Create new token that expires in 24 hours
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);
      
      const result = await db.insert(passwordResetTokens)
        .values({
          userId,
          token,
          email,
          expiresAt
        })
        .returning();
      
      if (result.length > 0) {
        return token;
      }
      
      return null;
    } catch (error) {
      console.error('Error in createPasswordResetToken:', error);
      return null;
    }
  }

  async getUserActivityLog(userId: string, limit: number = 50): Promise<any[]> {
    try {
      // Since we don't have an activity log table, return mock data
      // In production, you would query an actual activity_logs table
      const user = await this.getUser(userId);
      if (!user) return [];

      // Generate mock activity log data
      const activities = [];
      const now = Date.now();
      const actions = ['login', 'logout', 'job_create', 'job_complete', 'profile_update', 'password_change'];
      
      for (let i = 0; i < Math.min(limit, 10); i++) {
        const hoursAgo = Math.floor(Math.random() * 168); // Random time within last week
        activities.push({
          id: `LOG-${userId}-${i}`,
          userId,
          action: actions[Math.floor(Math.random() * actions.length)],
          details: this.generateActivityDetails(actions[i % actions.length]),
          timestamp: new Date(now - hoursAgo * 60 * 60 * 1000),
          ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
          userAgent: ['Chrome 120.0.0', 'Firefox 119.0', 'Safari 17.0', 'Edge 120.0'][Math.floor(Math.random() * 4)]
        });
      }

      // Sort by timestamp descending
      activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      
      return activities;
    } catch (error) {
      console.error('Error in getUserActivityLog:', error);
      return [];
    }
  }

  private generateActivityDetails(action: string): string {
    switch (action) {
      case 'login':
        return 'Successful login from web application';
      case 'logout':
        return 'User logged out';
      case 'job_create':
        return `Created emergency repair job #JOB-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
      case 'job_complete':
        return `Completed job #JOB-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
      case 'profile_update':
        return 'Updated profile information';
      case 'password_change':
        return 'Changed password';
      default:
        return 'Performed action';
    }
  }

  // ==================== JOB OPERATIONS ====================
  
  async createJob(job: InsertJob): Promise<Job> {
    // Generate a shorter job number (max 20 chars for VARCHAR(20))
    const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
    const random = Math.random().toString(36).substr(2, 4).toUpperCase(); // 4 random chars
    const jobNumber = `JOB-${timestamp}-${random}`; // e.g., JOB-123456-A1B2 (15 chars max)
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

    // Handle status as either single value or array
    if (filters.status) {
      if (Array.isArray(filters.status)) {
        conditions.push(inArray(jobs.status, filters.status));
      } else {
        conditions.push(eq(jobs.status, filters.status));
      }
    }
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
    console.log(`[AssignJob] Assigning job ${jobId} to contractor ${contractorId}`);
    
    // Get current job to retrieve assignment attempts
    const currentJob = await this.getJob(jobId);
    const currentAttempts = currentJob?.assignmentAttempts || 0;
    
    const result = await db.update(jobs)
      .set({ 
        contractorId, 
        status: 'assigned',
        assignedAt: new Date(),
        assignmentAttempts: currentAttempts + 1,
        lastAssignmentAttemptAt: new Date(),
        updatedAt: new Date() 
      })
      .where(eq(jobs.id, jobId))
      .returning();
    
    if (result.length > 0) {
      // Update contractor's last assigned timestamp for round-robin tracking
      await db.update(contractorProfiles)
        .set({ 
          lastAssignedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(contractorProfiles.userId, contractorId));
      
      console.log(`[AssignJob] Updated lastAssignedAt for contractor ${contractorId}, attempt #${currentAttempts + 1}`);
      
      // Add to job status history
      await db.insert(jobStatusHistory).values({
        jobId,
        fromStatus: currentJob?.status || 'new',
        toStatus: 'assigned',
        changedBy: contractorId,
        notes: `Assignment attempt #${currentAttempts + 1}`
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

  async deleteJobPhoto(photoId: string): Promise<boolean> {
    const result = await db.delete(jobPhotos)
      .where(eq(jobPhotos.id, photoId))
      .returning();
    return result.length > 0;
  }

  async addJobMessage(message: InsertJobMessage): Promise<JobMessage> {
    const result = await db.insert(jobMessages).values(message).returning();
    return result[0];
  }

  async getJobMessages(jobId: string, limit: number = 50): Promise<JobMessage[]> {
    return await db.select().from(jobMessages)
      .where(and(
        eq(jobMessages.jobId, jobId),
        eq(jobMessages.isDeleted, false)
      ))
      .orderBy(desc(jobMessages.createdAt))
      .limit(limit);
  }

  async getUnreadMessageCount(jobId: string, userId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(jobMessages)
      .leftJoin(
        messageReadReceipts,
        and(
          eq(jobMessages.id, messageReadReceipts.messageId),
          eq(messageReadReceipts.userId, userId)
        )
      )
      .where(and(
        eq(jobMessages.jobId, jobId),
        eq(jobMessages.isDeleted, false),
        ne(jobMessages.senderId, userId),
        isNull(messageReadReceipts.id)
      ));
    
    return Number(result[0]?.count || 0);
  }

  async markMessagesAsRead(jobId: string, userId: string): Promise<boolean> {
    try {
      // Get all unread messages for this job
      const unreadMessages = await db
        .select({ id: jobMessages.id })
        .from(jobMessages)
        .leftJoin(
          messageReadReceipts,
          and(
            eq(jobMessages.id, messageReadReceipts.messageId),
            eq(messageReadReceipts.userId, userId)
          )
        )
        .where(and(
          eq(jobMessages.jobId, jobId),
          eq(jobMessages.isDeleted, false),
          ne(jobMessages.senderId, userId),
          isNull(messageReadReceipts.id)
        ));

      // Batch insert read receipts
      if (unreadMessages.length > 0) {
        const receipts = unreadMessages.map(msg => ({
          messageId: msg.id,
          userId: userId
        }));
        
        await db.insert(messageReadReceipts)
          .values(receipts)
          .onConflictDoNothing();
      }
      
      return true;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      return false;
    }
  }

  async editMessage(messageId: string, newContent: string, userId: string): Promise<JobMessage | null> {
    try {
      const result = await db
        .update(jobMessages)
        .set({
          message: newContent,
          isEdited: true,
          editedAt: new Date(),
          updatedAt: new Date()
        })
        .where(and(
          eq(jobMessages.id, messageId),
          eq(jobMessages.senderId, userId),
          eq(jobMessages.isDeleted, false)
        ))
        .returning();
      
      return result[0] || null;
    } catch (error) {
      console.error('Error editing message:', error);
      return null;
    }
  }

  async deleteMessage(messageId: string, userId: string): Promise<boolean> {
    try {
      const result = await db
        .update(jobMessages)
        .set({
          isDeleted: true,
          deletedAt: new Date(),
          updatedAt: new Date()
        })
        .where(and(
          eq(jobMessages.id, messageId),
          eq(jobMessages.senderId, userId)
        ))
        .returning();
      
      return result.length > 0;
    } catch (error) {
      console.error('Error deleting message:', error);
      return false;
    }
  }

  async addMessageReaction(messageId: string, userId: string, emoji: string): Promise<JobMessage | null> {
    try {
      // Get current message
      const messages = await db
        .select()
        .from(jobMessages)
        .where(eq(jobMessages.id, messageId))
        .limit(1);
      
      if (messages.length === 0) return null;
      
      const message = messages[0];
      const reactions = message.reactions as any || {};
      
      // Add user to emoji reaction array
      if (!reactions[emoji]) {
        reactions[emoji] = [];
      }
      if (!reactions[emoji].includes(userId)) {
        reactions[emoji].push(userId);
      }
      
      // Update message with new reactions
      const result = await db
        .update(jobMessages)
        .set({
          reactions: reactions,
          updatedAt: new Date()
        })
        .where(eq(jobMessages.id, messageId))
        .returning();
      
      return result[0] || null;
    } catch (error) {
      console.error('Error adding reaction:', error);
      return null;
    }
  }

  async removeMessageReaction(messageId: string, userId: string, emoji: string): Promise<JobMessage | null> {
    try {
      // Get current message
      const messages = await db
        .select()
        .from(jobMessages)
        .where(eq(jobMessages.id, messageId))
        .limit(1);
      
      if (messages.length === 0) return null;
      
      const message = messages[0];
      const reactions = message.reactions as any || {};
      
      // Remove user from emoji reaction array
      if (reactions[emoji]) {
        reactions[emoji] = reactions[emoji].filter((id: string) => id !== userId);
        if (reactions[emoji].length === 0) {
          delete reactions[emoji];
        }
      }
      
      // Update message with new reactions
      const result = await db
        .update(jobMessages)
        .set({
          reactions: reactions,
          updatedAt: new Date()
        })
        .where(eq(jobMessages.id, messageId))
        .returning();
      
      return result[0] || null;
    } catch (error) {
      console.error('Error removing reaction:', error);
      return null;
    }
  }

  async getMessageThread(messageId: string): Promise<JobMessage[]> {
    return await db
      .select()
      .from(jobMessages)
      .where(and(
        eq(jobMessages.replyToId, messageId),
        eq(jobMessages.isDeleted, false)
      ))
      .orderBy(asc(jobMessages.createdAt));
  }

  async getMessageHistory(jobId: string, options?: {
    limit?: number;
    offset?: number;
    beforeId?: string;
    afterId?: string;
  }): Promise<{
    messages: JobMessage[];
    hasMore: boolean;
    total: number;
  }> {
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;
    
    // Build query conditions
    let conditions = and(
      eq(jobMessages.jobId, jobId),
      eq(jobMessages.isDeleted, false)
    );
    
    // Get total count
    const countResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(jobMessages)
      .where(conditions);
    
    const total = Number(countResult[0]?.count || 0);
    
    // Get messages with pagination
    const messages = await db
      .select()
      .from(jobMessages)
      .where(conditions)
      .orderBy(desc(jobMessages.createdAt))
      .limit(limit)
      .offset(offset);
    
    return {
      messages,
      hasMore: offset + messages.length < total,
      total
    };
  }

  async markMessageAsRead(messageId: string, userId: string): Promise<MessageReadReceipt | null> {
    try {
      const result = await db
        .insert(messageReadReceipts)
        .values({
          messageId,
          userId
        })
        .onConflictDoNothing()
        .returning();
      
      return result[0] || null;
    } catch (error) {
      console.error('Error marking message as read:', error);
      return null;
    }
  }

  async getMessageReadReceipts(messageId: string): Promise<MessageReadReceipt[]> {
    return await db
      .select()
      .from(messageReadReceipts)
      .where(eq(messageReadReceipts.messageId, messageId))
      .orderBy(desc(messageReadReceipts.readAt));
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

  async addJobStatusHistory(history: InsertJobStatusHistory): Promise<JobStatusHistory> {
    const result = await db.insert(jobStatusHistory).values(history).returning();
    return result[0];
  }

  async recordJobStatusChange(data: { jobId: string; fromStatus: string; toStatus: string; changedBy?: string; reason?: string }): Promise<void> {
    await this.addJobStatusHistory({
      jobId: data.jobId,
      fromStatus: data.fromStatus as typeof jobStatusEnum.enumValues[number],
      toStatus: data.toStatus as typeof jobStatusEnum.enumValues[number],
      changedBy: data.changedBy,
      reason: data.reason
    });
  }

  // ==================== JOB QUEUE OPERATIONS ====================

  async enqueueJob(contractorId: string, jobId: string, priority?: number): Promise<ContractorJobQueue> {
    return await db.transaction(async (tx) => {
      // Check if contractor has any current jobs
      const currentJobs = await tx.select()
        .from(contractorJobQueue)
        .where(and(
          eq(contractorJobQueue.contractorId, contractorId),
          eq(contractorJobQueue.status, 'current')
        ))
        .limit(1);

      let position: number;
      let status: typeof queueStatusEnum.enumValues[number];

      if (currentJobs.length === 0) {
        // No current job, this becomes the current job
        position = 1;
        status = 'current';
      } else {
        // Get the highest position in the queue for this contractor
        const maxPositionResult = await tx.select({
          maxPosition: sql<number>`COALESCE(MAX(${contractorJobQueue.queuePosition}), 0)`
        })
        .from(contractorJobQueue)
        .where(and(
          eq(contractorJobQueue.contractorId, contractorId),
          or(
            eq(contractorJobQueue.status, 'current'),
            eq(contractorJobQueue.status, 'queued')
          )
        ));

        const maxPosition = maxPositionResult[0]?.maxPosition || 0;
        
        // Handle priority insertion properly
        if (priority !== undefined && priority > 0) {
          // If priority is within the existing queue range, shift existing entries
          if (priority <= maxPosition) {
            // Shift all existing queue entries with position >= priority
            // Increment their positions by 1 to make room for the new entry
            await tx.update(contractorJobQueue)
              .set({
                queuePosition: sql`${contractorJobQueue.queuePosition} + 1`,
                updatedAt: new Date()
              })
              .where(and(
                eq(contractorJobQueue.contractorId, contractorId),
                gte(contractorJobQueue.queuePosition, priority),
                or(
                  eq(contractorJobQueue.status, 'current'),
                  eq(contractorJobQueue.status, 'queued')
                )
              ));
          }
          // Use the priority as the position
          position = priority;
        } else {
          // If no priority or priority is 0/undefined, append to the end
          position = maxPosition + 1;
        }
        
        status = 'queued';
      }

      // Insert the new queue entry
      const queueEntry: InsertContractorJobQueue = {
        contractorId,
        jobId,
        position,
        status,
        startedAt: status === 'current' ? new Date() : undefined
      };

      const result = await tx.insert(contractorJobQueue).values(queueEntry).returning();

      // If this is now the current job, update the job assignment
      if (status === 'current') {
        await tx.update(jobs)
          .set({
            contractorId,
            status: 'assigned',
            assignedAt: new Date(),
            updatedAt: new Date()
          })
          .where(eq(jobs.id, jobId));
      }

      return result[0];
    });
  }

  async getContractorQueue(contractorId: string): Promise<ContractorJobQueue[]> {
    return await db.select()
      .from(contractorJobQueue)
      .where(and(
        eq(contractorJobQueue.contractorId, contractorId),
        or(
          eq(contractorJobQueue.status, 'current'),
          eq(contractorJobQueue.status, 'queued')
        )
      ))
      .orderBy(asc(contractorJobQueue.queuePosition));
  }

  async getContractorCurrentJob(contractorId: string): Promise<{ job: Job | null; queueEntry: ContractorJobQueue | null }> {
    // Get the current queue entry
    const currentQueueEntry = await db.select()
      .from(contractorJobQueue)
      .where(and(
        eq(contractorJobQueue.contractorId, contractorId),
        eq(contractorJobQueue.status, 'current')
      ))
      .limit(1);

    if (currentQueueEntry.length === 0) {
      return { job: null, queueEntry: null };
    }

    // Get the associated job
    const job = await db.select()
      .from(jobs)
      .where(eq(jobs.id, currentQueueEntry[0].jobId))
      .limit(1);

    return {
      job: job[0] || null,
      queueEntry: currentQueueEntry[0]
    };
  }

  async advanceContractorQueue(contractorId: string): Promise<{ nextJob: Job | null; queueEntry: ContractorJobQueue | null }> {
    return await db.transaction(async (tx) => {
      // Get current job
      const currentQueueEntries = await tx.select()
        .from(contractorJobQueue)
        .where(and(
          eq(contractorJobQueue.contractorId, contractorId),
          eq(contractorJobQueue.status, 'current')
        ))
        .limit(1);

      if (currentQueueEntries.length > 0) {
        // Mark current job as completed
        await tx.update(contractorJobQueue)
          .set({
            status: 'completed',
            completedAt: new Date(),
            updatedAt: new Date()
          })
          .where(eq(contractorJobQueue.id, currentQueueEntries[0].id));

        // Update the associated job status
        await tx.update(jobs)
          .set({
            status: 'completed',
            completedAt: new Date(),
            updatedAt: new Date()
          })
          .where(eq(jobs.id, currentQueueEntries[0].jobId));
      }

      // Get the next queued job
      const nextQueueEntries = await tx.select()
        .from(contractorJobQueue)
        .where(and(
          eq(contractorJobQueue.contractorId, contractorId),
          eq(contractorJobQueue.status, 'queued')
        ))
        .orderBy(asc(contractorJobQueue.position))
        .limit(1);

      if (nextQueueEntries.length === 0) {
        return { nextJob: null, queueEntry: null };
      }

      // Promote the next job to current
      await tx.update(contractorJobQueue)
        .set({
          status: 'current',
          startedAt: new Date(),
          position: 1,
          updatedAt: new Date()
        })
        .where(eq(contractorJobQueue.id, nextQueueEntries[0].id));

      // Update all remaining queued jobs' positions
      await tx.execute(sql`
        UPDATE ${contractorJobQueue}
        SET position = position - 1,
            updated_at = NOW()
        WHERE contractor_id = ${contractorId}
          AND status = 'queued'
          AND position > ${nextQueueEntries[0].position}
      `);

      // Update the job assignment
      await tx.update(jobs)
        .set({
          contractorId,
          status: 'assigned',
          assignedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(jobs.id, nextQueueEntries[0].jobId));

      // Get the job details
      const nextJob = await tx.select()
        .from(jobs)
        .where(eq(jobs.id, nextQueueEntries[0].jobId))
        .limit(1);

      return {
        nextJob: nextJob[0] || null,
        queueEntry: { ...nextQueueEntries[0], status: 'current' as typeof queueStatusEnum.enumValues[number], position: 1 }
      };
    });
  }

  async removeFromQueue(jobId: string): Promise<boolean> {
    return await db.transaction(async (tx) => {
      // Get the queue entry
      const queueEntries = await tx.select()
        .from(contractorJobQueue)
        .where(eq(contractorJobQueue.jobId, jobId))
        .limit(1);

      if (queueEntries.length === 0) {
        return false;
      }

      const queueEntry = queueEntries[0];

      // Delete the queue entry
      await tx.delete(contractorJobQueue)
        .where(eq(contractorJobQueue.id, queueEntry.id));

      // If this was a queued job, update positions of jobs after it
      if (queueEntry.status === 'queued') {
        await tx.execute(sql`
          UPDATE ${contractorJobQueue}
          SET position = position - 1,
              updated_at = NOW()
          WHERE contractor_id = ${queueEntry.contractorId}
            AND status = 'queued'
            AND position > ${queueEntry.position}
        `);
      }

      // If this was the current job, promote the next one
      if (queueEntry.status === 'current') {
        const nextEntries = await tx.select()
          .from(contractorJobQueue)
          .where(and(
            eq(contractorJobQueue.contractorId, queueEntry.contractorId),
            eq(contractorJobQueue.status, 'queued')
          ))
          .orderBy(asc(contractorJobQueue.position))
          .limit(1);

        if (nextEntries.length > 0) {
          // Promote next job to current
          await tx.update(contractorJobQueue)
            .set({
              status: 'current',
              startedAt: new Date(),
              position: 1,
              updatedAt: new Date()
            })
            .where(eq(contractorJobQueue.id, nextEntries[0].id));

          // Update job assignment
          await tx.update(jobs)
            .set({
              contractorId: queueEntry.contractorId,
              status: 'assigned',
              assignedAt: new Date(),
              updatedAt: new Date()
            })
            .where(eq(jobs.id, nextEntries[0].jobId));

          // Update remaining queue positions
          await tx.execute(sql`
            UPDATE ${contractorJobQueue}
            SET position = position - 1,
                updated_at = NOW()
            WHERE contractor_id = ${queueEntry.contractorId}
              AND status = 'queued'
              AND position > ${nextEntries[0].position}
          `);
        }
      }

      return true;
    });
  }

  async getQueuePositionForJob(jobId: string): Promise<{ position: number; totalInQueue: number } | null> {
    // Get the queue entry for this job
    const queueEntry = await db.select()
      .from(contractorJobQueue)
      .where(eq(contractorJobQueue.jobId, jobId))
      .limit(1);

    if (queueEntry.length === 0) {
      return null;
    }

    const entry = queueEntry[0];

    // Count total jobs in queue for this contractor (including current)
    const totalResult = await db.select({
      count: sql<number>`COUNT(*)`
    })
    .from(contractorJobQueue)
    .where(and(
      eq(contractorJobQueue.contractorId, entry.contractorId),
      or(
        eq(contractorJobQueue.status, 'current'),
        eq(contractorJobQueue.status, 'queued')
      )
    ));

    return {
      position: entry.position,
      totalInQueue: totalResult[0]?.count || 0
    };
  }

  async updateQueueStatus(queueId: string, status: typeof queueStatusEnum.enumValues[number]): Promise<ContractorJobQueue | null> {
    const updateData: any = {
      status,
      updatedAt: new Date()
    };

    // Set appropriate timestamps based on status
    if (status === 'current') {
      updateData.startedAt = new Date();
    } else if (status === 'completed') {
      updateData.completedAt = new Date();
    }

    const result = await db.update(contractorJobQueue)
      .set(updateData)
      .where(eq(contractorJobQueue.id, queueId))
      .returning();

    return result[0] || null;
  }

  // Enhanced queue management methods
  async addToContractorQueue(contractorId: string, jobId: string, priority?: number, metadata?: any): Promise<ContractorJobQueue> {
    return await db.transaction(async (tx) => {
      // Check if job is already in any queue
      const existingQueue = await tx.select()
        .from(contractorJobQueue)
        .where(eq(contractorJobQueue.jobId, jobId))
        .limit(1);

      if (existingQueue.length > 0) {
        throw new Error('Job is already in a queue');
      }

      // Get contractor's current queue
      const currentQueue = await tx.select()
        .from(contractorJobQueue)
        .where(and(
          eq(contractorJobQueue.contractorId, contractorId),
          inArray(contractorJobQueue.status, ['current', 'queued'])
        ))
        .orderBy(asc(contractorJobQueue.queuePosition));

      let queuePosition = 1;
      let estimatedStartTime = new Date();
      let status: typeof queueStatusEnum.enumValues[number] = 'queued';

      if (currentQueue.length === 0) {
        // No jobs in queue, this becomes current
        status = 'assigned';
        queuePosition = 1;
      } else {
        // Calculate position and estimated start time
        const lastJob = currentQueue[currentQueue.length - 1];
        queuePosition = priority || (lastJob.queuePosition + 1);
        
        // Estimate based on average job duration (default 60 minutes)
        const avgDuration = 60; // minutes
        estimatedStartTime = new Date(Date.now() + (currentQueue.length * avgDuration * 60000));
      }

      // Get job details for distance calculation
      const [job] = await tx.select().from(jobs).where(eq(jobs.id, jobId));
      let distanceToJob = null;
      
      if (job && job.location) {
        const [contractor] = await tx.select().from(contractorProfiles)
          .where(eq(contractorProfiles.userId, contractorId));
        
        if (contractor && contractor.currentLocation) {
          // Calculate distance (simplified)
          const jobLoc = job.location as any;
          const contractorLoc = contractor.currentLocation as any;
          distanceToJob = Math.sqrt(
            Math.pow(jobLoc.lat - contractorLoc.lat, 2) + 
            Math.pow(jobLoc.lng - contractorLoc.lng, 2)
          ) * 69; // Rough conversion to miles
        }
      }

      const queueEntry: InsertContractorJobQueue = {
        contractorId,
        jobId,
        queuePosition,
        status,
        estimatedStartTime,
        priority: priority || 5,
        autoAssigned: true,
        distanceToJob,
        metadata,
        notificationsSent: []
      };

      const result = await tx.insert(contractorJobQueue).values(queueEntry).returning();

      // Update job status if this is the current job
      if (status === 'assigned') {
        await tx.update(jobs)
          .set({
            contractorId,
            status: 'assigned',
            assignedAt: new Date()
          })
          .where(eq(jobs.id, jobId));
      }

      return result[0];
    });
  }

  async processNextInQueue(contractorId: string): Promise<{ success: boolean; nextJob?: Job; queueEntry?: ContractorJobQueue }> {
    return await db.transaction(async (tx) => {
      // Mark current job as completed
      const currentQueue = await tx.select()
        .from(contractorJobQueue)
        .where(and(
          eq(contractorJobQueue.contractorId, contractorId),
          eq(contractorJobQueue.status, 'assigned')
        ))
        .limit(1);

      if (currentQueue.length > 0) {
        await tx.update(contractorJobQueue)
          .set({
            status: 'completed',
            completedAt: new Date(),
            actualDuration: sql`EXTRACT(EPOCH FROM NOW() - ${currentQueue[0].actualStartTime}) / 60`
          })
          .where(eq(contractorJobQueue.id, currentQueue[0].id));
      }

      // Get next in queue
      const nextQueue = await tx.select()
        .from(contractorJobQueue)
        .where(and(
          eq(contractorJobQueue.contractorId, contractorId),
          eq(contractorJobQueue.status, 'queued')
        ))
        .orderBy(asc(contractorJobQueue.queuePosition))
        .limit(1);

      if (nextQueue.length === 0) {
        return { success: true };
      }

      // Promote next to current
      await tx.update(contractorJobQueue)
        .set({
          status: 'assigned',
          actualStartTime: new Date(),
          queuePosition: 1
        })
        .where(eq(contractorJobQueue.id, nextQueue[0].id));

      // Update all other positions
      await tx.update(contractorJobQueue)
        .set({
          queuePosition: sql`${contractorJobQueue.queuePosition} - 1`
        })
        .where(and(
          eq(contractorJobQueue.contractorId, contractorId),
          eq(contractorJobQueue.status, 'queued'),
          gt(contractorJobQueue.queuePosition, nextQueue[0].queuePosition)
        ));

      // Get job details
      const [nextJob] = await tx.select().from(jobs).where(eq(jobs.id, nextQueue[0].jobId));

      // Update job assignment
      await tx.update(jobs)
        .set({
          contractorId,
          status: 'assigned',
          assignedAt: new Date()
        })
        .where(eq(jobs.id, nextQueue[0].jobId));

      return {
        success: true,
        nextJob,
        queueEntry: { ...nextQueue[0], status: 'assigned' as typeof queueStatusEnum.enumValues[number] }
      };
    });
  }

  async updateQueuePosition(queueId: string, newPosition: number): Promise<ContractorJobQueue | null> {
    return await db.transaction(async (tx) => {
      const [queueEntry] = await tx.select()
        .from(contractorJobQueue)
        .where(eq(contractorJobQueue.id, queueId));

      if (!queueEntry || queueEntry.status !== 'queued') {
        return null;
      }

      const oldPosition = queueEntry.queuePosition;

      // Shift other queue entries
      if (newPosition < oldPosition) {
        // Moving up - shift others down
        await tx.update(contractorJobQueue)
          .set({
            queuePosition: sql`${contractorJobQueue.queuePosition} + 1`
          })
          .where(and(
            eq(contractorJobQueue.contractorId, queueEntry.contractorId),
            eq(contractorJobQueue.status, 'queued'),
            gte(contractorJobQueue.queuePosition, newPosition),
            lt(contractorJobQueue.queuePosition, oldPosition)
          ));
      } else if (newPosition > oldPosition) {
        // Moving down - shift others up
        await tx.update(contractorJobQueue)
          .set({
            queuePosition: sql`${contractorJobQueue.queuePosition} - 1`
          })
          .where(and(
            eq(contractorJobQueue.contractorId, queueEntry.contractorId),
            eq(contractorJobQueue.status, 'queued'),
            gt(contractorJobQueue.queuePosition, oldPosition),
            lte(contractorJobQueue.queuePosition, newPosition)
          ));
      }

      // Update the entry's position
      const result = await tx.update(contractorJobQueue)
        .set({
          queuePosition: newPosition,
          updatedAt: new Date()
        })
        .where(eq(contractorJobQueue.id, queueId))
        .returning();

      return result[0];
    });
  }

  async reorderContractorQueue(contractorId: string, jobIds: string[]): Promise<boolean> {
    return await db.transaction(async (tx) => {
      // Update positions based on the new order
      for (let i = 0; i < jobIds.length; i++) {
        await tx.update(contractorJobQueue)
          .set({
            queuePosition: i + 2, // Start at 2 (1 is reserved for current)
            updatedAt: new Date()
          })
          .where(and(
            eq(contractorJobQueue.contractorId, contractorId),
            eq(contractorJobQueue.jobId, jobIds[i]),
            eq(contractorJobQueue.status, 'queued')
          ));
      }
      return true;
    });
  }

  async skipQueueJob(queueId: string, reason: string): Promise<ContractorJobQueue | null> {
    const result = await db.update(contractorJobQueue)
      .set({
        status: 'skipped',
        skipReason: reason,
        skippedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(contractorJobQueue.id, queueId))
      .returning();

    if (result.length > 0) {
      // Process next in queue
      await this.processNextInQueue(result[0].contractorId);
    }

    return result[0] || null;
  }

  async expireQueueEntry(queueId: string): Promise<ContractorJobQueue | null> {
    const result = await db.update(contractorJobQueue)
      .set({
        status: 'expired',
        expiredAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(contractorJobQueue.id, queueId))
      .returning();

    return result[0] || null;
  }

  async getQueueEstimates(contractorId: string): Promise<Array<{ jobId: string; position: number; estimatedStartTime: Date }>> {
    const queue = await db.select()
      .from(contractorJobQueue)
      .where(and(
        eq(contractorJobQueue.contractorId, contractorId),
        inArray(contractorJobQueue.status, ['current', 'queued', 'assigned'])
      ))
      .orderBy(asc(contractorJobQueue.queuePosition));

    const avgDuration = 60; // Default 60 minutes per job
    let currentTime = new Date();
    
    return queue.map((entry, index) => {
      const estimatedStart = new Date(currentTime.getTime() + (index * avgDuration * 60000));
      return {
        jobId: entry.jobId,
        position: entry.queuePosition,
        estimatedStartTime: entry.estimatedStartTime || estimatedStart
      };
    });
  }

  async updateQueueEstimates(contractorId: string): Promise<boolean> {
    const queue = await db.select()
      .from(contractorJobQueue)
      .where(and(
        eq(contractorJobQueue.contractorId, contractorId),
        inArray(contractorJobQueue.status, ['current', 'queued', 'assigned'])
      ))
      .orderBy(asc(contractorJobQueue.queuePosition));

    const avgDuration = 60; // minutes
    let currentTime = new Date();

    for (let i = 0; i < queue.length; i++) {
      const estimatedStart = new Date(currentTime.getTime() + (i * avgDuration * 60000));
      await db.update(contractorJobQueue)
        .set({
          estimatedStartTime: estimatedStart,
          updatedAt: new Date()
        })
        .where(eq(contractorJobQueue.id, queue[i].id));
    }

    return true;
  }

  async getJobQueueStatus(jobId: string): Promise<{ contractorId: string; position: number; estimatedStartTime?: Date; status: string } | null> {
    const [entry] = await db.select()
      .from(contractorJobQueue)
      .where(eq(contractorJobQueue.jobId, jobId))
      .limit(1);

    if (!entry) return null;

    return {
      contractorId: entry.contractorId,
      position: entry.queuePosition,
      estimatedStartTime: entry.estimatedStartTime || undefined,
      status: entry.status
    };
  }

  async getAllActiveQueues(): Promise<Array<{ contractorId: string; queueLength: number; currentJob?: Job; nextAvailableTime?: Date }>> {
    const contractors = await db.select()
      .from(contractorProfiles)
      .where(eq(contractorProfiles.isAvailable, true));

    const result = [];
    
    for (const contractor of contractors) {
      const queue = await db.select()
        .from(contractorJobQueue)
        .where(and(
          eq(contractorJobQueue.contractorId, contractor.userId),
          inArray(contractorJobQueue.status, ['current', 'queued', 'assigned'])
        ));

      let currentJob: Job | undefined;
      const currentQueue = queue.find(q => q.status === 'assigned' || q.status === 'current');
      
      if (currentQueue) {
        const [job] = await db.select().from(jobs).where(eq(jobs.id, currentQueue.jobId));
        currentJob = job;
      }

      const avgDuration = 60; // minutes
      const nextAvailableTime = queue.length > 0 
        ? new Date(Date.now() + (queue.length * avgDuration * 60000))
        : new Date();

      result.push({
        contractorId: contractor.userId,
        queueLength: queue.length,
        currentJob,
        nextAvailableTime
      });
    }

    return result;
  }

  async findShortestQueue(serviceTypeId?: string, location?: { lat: number; lng: number }): Promise<{ contractorId: string; queueLength: number; estimatedWaitTime: number } | null> {
    const contractors = await db.select()
      .from(contractorProfiles)
      .where(eq(contractorProfiles.isAvailable, true));

    let shortestQueue = null;
    let minQueueLength = Infinity;

    for (const contractor of contractors) {
      // Check if contractor provides this service type
      if (serviceTypeId) {
        const [service] = await db.select()
          .from(contractorServices)
          .where(and(
            eq(contractorServices.contractorId, contractor.userId),
            eq(contractorServices.serviceTypeId, serviceTypeId)
          ));
        
        if (!service) continue;
      }

      // Check distance if location provided
      if (location && contractor.currentLocation) {
        const contractorLoc = contractor.currentLocation as any;
        const distance = Math.sqrt(
          Math.pow(location.lat - contractorLoc.lat, 2) + 
          Math.pow(location.lng - contractorLoc.lng, 2)
        ) * 69; // Rough conversion to miles
        
        if (distance > contractor.serviceRadius) continue;
      }

      const queue = await db.select()
        .from(contractorJobQueue)
        .where(and(
          eq(contractorJobQueue.contractorId, contractor.userId),
          inArray(contractorJobQueue.status, ['current', 'queued', 'assigned'])
        ));

      if (queue.length < minQueueLength) {
        minQueueLength = queue.length;
        const avgDuration = 60; // minutes
        shortestQueue = {
          contractorId: contractor.userId,
          queueLength: queue.length,
          estimatedWaitTime: queue.length * avgDuration
        };
      }
    }

    return shortestQueue;
  }

  async handleQueueTimeout(queueId: string): Promise<{ reassigned: boolean; newContractorId?: string }> {
    return await db.transaction(async (tx) => {
      const [entry] = await tx.select()
        .from(contractorJobQueue)
        .where(eq(contractorJobQueue.id, queueId));

      if (!entry) {
        return { reassigned: false };
      }

      // Mark as expired
      await tx.update(contractorJobQueue)
        .set({
          status: 'expired',
          expiredAt: new Date()
        })
        .where(eq(contractorJobQueue.id, queueId));

      // Find alternative contractor
      const shortest = await this.findShortestQueue();
      
      if (shortest && shortest.contractorId !== entry.contractorId) {
        // Add to new contractor's queue
        await this.addToContractorQueue(shortest.contractorId, entry.jobId);
        return { reassigned: true, newContractorId: shortest.contractorId };
      }

      return { reassigned: false };
    });
  }

  async sendQueueNotification(queueId: string, notificationType: string): Promise<boolean> {
    const [entry] = await db.select()
      .from(contractorJobQueue)
      .where(eq(contractorJobQueue.id, queueId));

    if (!entry) return false;

    const notifications = (entry.notificationsSent as any[]) || [];
    notifications.push({
      type: notificationType,
      sentAt: new Date()
    });

    await db.update(contractorJobQueue)
      .set({
        notificationsSent: notifications,
        lastNotificationAt: new Date()
      })
      .where(eq(contractorJobQueue.id, queueId));

    return true;
  }

  async getContractorAvailabilityWithQueue(contractorId: string): Promise<{ 
    isAvailable: boolean;
    currentJob?: Job;
    queueDepth: number;
    estimatedAvailabilityTime?: Date;
    nextJobId?: string;
  }> {
    const [contractor] = await db.select()
      .from(contractorProfiles)
      .where(eq(contractorProfiles.userId, contractorId));

    const queue = await db.select()
      .from(contractorJobQueue)
      .where(and(
        eq(contractorJobQueue.contractorId, contractorId),
        inArray(contractorJobQueue.status, ['current', 'queued', 'assigned'])
      ))
      .orderBy(asc(contractorJobQueue.queuePosition));

    let currentJob: Job | undefined;
    const currentQueue = queue.find(q => q.status === 'assigned' || q.status === 'current');
    
    if (currentQueue) {
      const [job] = await db.select().from(jobs).where(eq(jobs.id, currentQueue.jobId));
      currentJob = job;
    }

    const nextQueue = queue.find(q => q.status === 'queued');
    const avgDuration = 60; // minutes
    const estimatedAvailabilityTime = queue.length > 0
      ? new Date(Date.now() + (queue.length * avgDuration * 60000))
      : undefined;

    return {
      isAvailable: contractor?.isAvailable || false,
      currentJob,
      queueDepth: queue.length,
      estimatedAvailabilityTime,
      nextJobId: nextQueue?.jobId
    };
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

  async getActiveFleets(filters?: {
    tier?: string;
    status?: string;
    search?: string;
  }): Promise<Array<{
    id: string;
    companyName: string;
    contactName: string;
    contactEmail: string;
    contactPhone: string;
    tier: string;
    creditLimit: number;
    status: string;
    vehicleCount: number;
    activeJobs: number;
    totalSpent: number;
    memberSince: Date;
    customPricing: boolean;
  }>> {
    try {
      // Build query conditions
      const conditions = [isNull(fleetAccounts.deletedAt)];
      
      // Filter by tier if provided
      if (filters?.tier && filters.tier !== 'all') {
        conditions.push(eq(fleetAccounts.pricingTier, filters.tier as typeof fleetPricingTierEnum.enumValues[number]));
      }
      
      // Filter by status if provided
      if (filters?.status && filters.status !== 'all') {
        conditions.push(eq(fleetAccounts.isActive, filters.status === 'active'));
      }
      
      // Search filter
      if (filters?.search) {
        conditions.push(
          or(
            ilike(fleetAccounts.companyName, `%${filters.search}%`),
            ilike(fleetAccounts.primaryContactName, `%${filters.search}%`),
            ilike(fleetAccounts.primaryContactEmail, `%${filters.search}%`),
            ilike(fleetAccounts.primaryContactPhone, `%${filters.search}%`)
          )
        );
      }
      
      // Get fleet accounts
      const fleets = await db.select()
        .from(fleetAccounts)
        .where(and(...conditions))
        .orderBy(desc(fleetAccounts.createdAt));
      
      // Get metrics for each fleet in parallel
      const fleetsWithMetrics = await Promise.all(
        fleets.map(async (fleet) => {
          const metrics = await this.getFleetMetrics(fleet.id);
          
          return {
            id: fleet.id,
            companyName: fleet.companyName,
            contactName: fleet.primaryContactName || '',
            contactEmail: fleet.primaryContactEmail || '',
            contactPhone: fleet.primaryContactPhone || '',
            tier: fleet.pricingTier || 'standard',
            creditLimit: Number(fleet.creditLimit) || 0,
            status: fleet.isActive ? 'active' : 'suspended',
            vehicleCount: metrics.totalVehicles,
            activeJobs: metrics.activeJobs,
            totalSpent: metrics.totalSpent,
            memberSince: fleet.createdAt,
            customPricing: false // hasCustomPricing column doesn't exist
          };
        })
      );
      
      return fleetsWithMetrics;
    } catch (error) {
      console.error('Error in getActiveFleets:', error);
      return [];
    }
  }

  async getFleetMetrics(fleetId: string): Promise<{
    totalVehicles: number;
    activeJobs: number;
    completedJobs: number;
    totalSpent: number;
    averageJobValue: number;
  }> {
    try {
      const [vehicleCount, activeJobsCount, completedJobsData, totalSpentData] = await Promise.all([
        // Count active vehicles
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
        
        // Count active jobs (new, assigned, en_route, on_site)
        db.select({
          count: sql<number>`COUNT(*)`
        })
        .from(jobs)
        .where(
          and(
            eq(jobs.fleetAccountId, fleetId),
            inArray(jobs.status, ['new', 'assigned', 'en_route', 'on_site'])
          )
        ),
        
        // Count completed jobs
        db.select({
          count: sql<number>`COUNT(*)`
        })
        .from(jobs)
        .where(
          and(
            eq(jobs.fleetAccountId, fleetId),
            eq(jobs.status, 'completed')
          )
        ),
        
        // Calculate total spent from completed transactions
        db.select({
          total: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`
        })
        .from(transactions)
        .innerJoin(jobs, eq(transactions.jobId, jobs.id))
        .where(
          and(
            eq(jobs.fleetAccountId, fleetId),
            eq(transactions.status, 'completed')
          )
        )
      ]);
      
      const totalVehicles = vehicleCount[0]?.count || 0;
      const activeJobs = activeJobsCount[0]?.count || 0;
      const completedJobs = completedJobsData[0]?.count || 0;
      const totalSpent = Number(totalSpentData[0]?.total) || 0;
      const averageJobValue = completedJobs > 0 ? totalSpent / completedJobs : 0;
      
      return {
        totalVehicles,
        activeJobs,
        completedJobs,
        totalSpent,
        averageJobValue
      };
    } catch (error) {
      console.error('Error in getFleetMetrics:', error);
      return {
        totalVehicles: 0,
        activeJobs: 0,
        completedJobs: 0,
        totalSpent: 0,
        averageJobValue: 0
      };
    }
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
  
  // ==================== VACATION AND TIME-OFF MANAGEMENT ====================
  
  async requestTimeOff(contractorId: string, request: InsertVacationRequest): Promise<VacationRequest> {
    const result = await db.insert(vacationRequests).values({
      ...request,
      contractorId
    }).returning();
    return result[0];
  }
  
  async approveTimeOff(requestId: string, adminId: string, notes?: string): Promise<VacationRequest | null> {
    const result = await db.update(vacationRequests)
      .set({
        status: 'approved',
        approvedBy: adminId,
        approvedAt: new Date(),
        notes,
        updatedAt: new Date()
      })
      .where(eq(vacationRequests.id, requestId))
      .returning();
    return result[0] || null;
  }
  
  async rejectTimeOff(requestId: string, adminId: string, reason: string): Promise<VacationRequest | null> {
    const result = await db.update(vacationRequests)
      .set({
        status: 'rejected',
        approvedBy: adminId,
        approvedAt: new Date(),
        notes: reason,
        updatedAt: new Date()
      })
      .where(eq(vacationRequests.id, requestId))
      .returning();
    return result[0] || null;
  }
  
  async getTimeOffRequests(contractorId?: string, status?: typeof timeOffStatusEnum.enumValues[number]): Promise<VacationRequest[]> {
    const conditions = [];
    if (contractorId) {
      conditions.push(eq(vacationRequests.contractorId, contractorId));
    }
    if (status) {
      conditions.push(eq(vacationRequests.status, status));
    }
    
    return await db.select().from(vacationRequests)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(vacationRequests.createdAt));
  }
  
  async checkAvailabilityConflicts(contractorId: string, startDate: Date, endDate: Date): Promise<Job[]> {
    // Check for scheduled jobs that conflict with the requested time off
    return await db.select().from(jobs)
      .where(
        and(
          eq(jobs.contractorId, contractorId),
          eq(jobs.jobType, 'scheduled'),
          gte(jobs.scheduledDate, startDate),
          sql`${jobs.scheduledDate} <= ${endDate}`
        )
      )
      .orderBy(asc(jobs.scheduledDate));
  }
  
  async assignCoverageContractor(requestId: string, coveringContractorId: string): Promise<VacationRequest | null> {
    const result = await db.update(vacationRequests)
      .set({
        coverageContractorId: coveringContractorId,
        updatedAt: new Date()
      })
      .where(eq(vacationRequests.id, requestId))
      .returning();
    return result[0] || null;
  }
  
  async getAvailabilityCalendar(contractorId: string, month: number, year: number): Promise<{
    regularAvailability: ContractorAvailability[];
    vacationRequests: VacationRequest[];
    availabilityOverrides: AvailabilityOverride[];
    scheduledJobs: Job[];
  }> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    const [regular, vacations, overrides, jobsList] = await Promise.all([
      this.getContractorAvailability(contractorId),
      db.select().from(vacationRequests)
        .where(
          and(
            eq(vacationRequests.contractorId, contractorId),
            eq(vacationRequests.status, 'approved'),
            sql`${vacationRequests.startDate} <= ${endDate}`,
            sql`${vacationRequests.endDate} >= ${startDate}`
          )
        ),
      db.select().from(availabilityOverrides)
        .where(
          and(
            eq(availabilityOverrides.contractorId, contractorId),
            sql`${availabilityOverrides.date} >= ${startDate}`,
            sql`${availabilityOverrides.date} <= ${endDate}`
          )
        ),
      db.select().from(jobs)
        .where(
          and(
            eq(jobs.contractorId, contractorId),
            eq(jobs.jobType, 'scheduled'),
            sql`${jobs.scheduledDate} >= ${startDate}`,
            sql`${jobs.scheduledDate} <= ${endDate}`
          )
        )
    ]);
    
    return {
      regularAvailability: regular,
      vacationRequests: vacations,
      availabilityOverrides: overrides,
      scheduledJobs: jobsList
    };
  }
  
  async bulkUpdateAvailability(contractorId: string, dates: {
    date: Date;
    isAvailable: boolean;
    startTime?: string;
    endTime?: string;
    reason?: string;
  }[]): Promise<AvailabilityOverride[]> {
    const results: AvailabilityOverride[] = [];
    
    for (const dateEntry of dates) {
      // Delete existing override for this date
      await db.delete(availabilityOverrides)
        .where(
          and(
            eq(availabilityOverrides.contractorId, contractorId),
            eq(availabilityOverrides.date, dateEntry.date)
          )
        );
      
      // Insert new override
      const result = await db.insert(availabilityOverrides)
        .values({
          contractorId,
          date: dateEntry.date,
          startTime: dateEntry.startTime,
          endTime: dateEntry.endTime,
          isAvailable: dateEntry.isAvailable,
          reason: dateEntry.reason
        })
        .returning();
      
      results.push(result[0]);
    }
    
    return results;
  }
  
  async createAvailabilityOverride(override: InsertAvailabilityOverride): Promise<AvailabilityOverride> {
    const result = await db.insert(availabilityOverrides).values(override).returning();
    return result[0];
  }
  
  async getAvailabilityOverrides(contractorId: string, fromDate?: Date, toDate?: Date): Promise<AvailabilityOverride[]> {
    const conditions = [eq(availabilityOverrides.contractorId, contractorId)];
    
    if (fromDate) {
      conditions.push(sql`${availabilityOverrides.date} >= ${fromDate}`);
    }
    if (toDate) {
      conditions.push(sql`${availabilityOverrides.date} <= ${toDate}`);
    }
    
    return await db.select().from(availabilityOverrides)
      .where(and(...conditions))
      .orderBy(asc(availabilityOverrides.date));
  }
  
  async createContractorCoverage(coverage: InsertContractorCoverage): Promise<ContractorCoverage> {
    const result = await db.insert(contractorCoverage).values(coverage).returning();
    return result[0];
  }
  
  async updateContractorCoverage(coverageId: string, updates: Partial<InsertContractorCoverage>): Promise<ContractorCoverage | null> {
    const result = await db.update(contractorCoverage)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(contractorCoverage.id, coverageId))
      .returning();
    return result[0] || null;
  }
  
  async getContractorCoverage(contractorId: string, role: 'requesting' | 'covering' | 'both'): Promise<ContractorCoverage[]> {
    const conditions = [];
    
    if (role === 'requesting' || role === 'both') {
      conditions.push(eq(contractorCoverage.requestingContractorId, contractorId));
    }
    if (role === 'covering' || role === 'both') {
      conditions.push(eq(contractorCoverage.coveringContractorId, contractorId));
    }
    
    return await db.select().from(contractorCoverage)
      .where(conditions.length > 0 ? or(...conditions) : undefined)
      .orderBy(desc(contractorCoverage.createdAt));
  }
  
  async suggestCoverageContractors(requestingContractorId: string, startDate: Date, endDate: Date): Promise<{
    contractorId: string;
    name: string;
    availability: number;
    skills: ServiceType[];
    distance?: number;
    rating?: number;
  }[]> {
    // Get the requesting contractor's services and location
    const requestingProfile = await this.getContractorProfile(requestingContractorId);
    const requestingServices = await this.getContractorServices(requestingContractorId);
    const requestingServiceIds = requestingServices.map(s => s.serviceTypeId);
    
    // Get all contractors with matching services
    const potentialContractors = await db
      .selectDistinct({
        contractorId: contractorServices.contractorId
      })
      .from(contractorServices)
      .innerJoin(contractorProfiles, eq(contractorServices.contractorId, contractorProfiles.userId))
      .where(
        and(
          inArray(contractorServices.serviceTypeId, requestingServiceIds),
          eq(contractorServices.isAvailable, true),
          eq(contractorProfiles.isActive, true),
          sql`${contractorServices.contractorId} != ${requestingContractorId}`
        )
      );
    
    const suggestions = [];
    
    for (const contractor of potentialContractors) {
      // Check if contractor has approved time off during this period
      const timeOffConflicts = await db.select().from(vacationRequests)
        .where(
          and(
            eq(vacationRequests.contractorId, contractor.contractorId),
            eq(vacationRequests.status, 'approved'),
            sql`${vacationRequests.startDate} <= ${endDate}`,
            sql`${vacationRequests.endDate} >= ${startDate}`
          )
        )
        .limit(1);
      
      if (timeOffConflicts.length > 0) continue; // Skip if contractor has time off
      
      // Get contractor details
      const profile = await this.getContractorProfile(contractor.contractorId);
      const user = await this.getUser(contractor.contractorId);
      const services = await this.getContractorServices(contractor.contractorId);
      
      // Calculate availability percentage (simplified)
      const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const availableDays = totalDays - timeOffConflicts.length;
      const availabilityPercentage = (availableDays / totalDays) * 100;
      
      // Get average rating
      const contractorReviews = await db.select({
        avgRating: sql<number>`AVG(overall_rating)`
      })
      .from(reviews)
      .where(eq(reviews.contractorId, contractor.contractorId));
      
      suggestions.push({
        contractorId: contractor.contractorId,
        name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Unknown',
        availability: availabilityPercentage,
        skills: await Promise.all(
          services.map(async s => {
            const serviceType = await db.select().from(serviceTypes)
              .where(eq(serviceTypes.id, s.serviceTypeId))
              .limit(1);
            return serviceType[0];
          })
        ),
        distance: requestingProfile?.baseLocation && profile?.baseLocation 
          ? this.calculateDistance(requestingProfile.baseLocation, profile.baseLocation)
          : undefined,
        rating: contractorReviews[0]?.avgRating || undefined
      });
    }
    
    // Sort by availability, rating, and distance
    suggestions.sort((a, b) => {
      // Primary sort by availability
      if (a.availability !== b.availability) {
        return b.availability - a.availability;
      }
      // Secondary sort by rating
      if (a.rating && b.rating) {
        return b.rating - a.rating;
      }
      // Tertiary sort by distance
      if (a.distance && b.distance) {
        return a.distance - b.distance;
      }
      return 0;
    });
    
    return suggestions.slice(0, 10); // Return top 10 suggestions
  }
  
  private calculateDistance(loc1: any, loc2: any): number {
    // Simple distance calculation (you might want to use a proper geolocation library)
    const lat1 = loc1.lat || loc1.latitude;
    const lon1 = loc1.lng || loc1.longitude;
    const lat2 = loc2.lat || loc2.latitude;
    const lon2 = loc2.lng || loc2.longitude;
    
    if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
    
    const R = 3959; // Radius of the Earth in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
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

  async getInvoiceTransactions(invoiceId: string): Promise<Transaction[]> {
    return await db.select().from(transactions)
      .where(eq(transactions.invoiceId, invoiceId))
      .orderBy(desc(transactions.createdAt));
  }

  async markInvoiceAsPaid(invoiceId: string, paidAt: Date): Promise<boolean> {
    const invoice = await this.getInvoice(invoiceId);
    if (!invoice) return false;
    
    const result = await db.update(invoices)
      .set({ 
        paidAt,
        paidAmount: invoice.totalAmount,
        status: 'paid',
        updatedAt: new Date()
      })
      .where(eq(invoices.id, invoiceId))
      .returning();
    
    return result.length > 0;
  }
  
  // Invoice defaults management
  async createInvoiceDefault(data: InsertInvoiceDefault): Promise<InvoiceDefault> {
    const result = await db.insert(invoiceDefaults).values(data).returning();
    return result[0];
  }

  async updateInvoiceDefault(id: string, updates: Partial<InsertInvoiceDefault>): Promise<InvoiceDefault | undefined> {
    const result = await db.update(invoiceDefaults)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(invoiceDefaults.id, id))
      .returning();
    return result[0];
  }

  async deleteInvoiceDefault(id: string): Promise<boolean> {
    const result = await db.delete(invoiceDefaults)
      .where(eq(invoiceDefaults.id, id))
      .returning();
    return result.length > 0;
  }

  async getInvoiceDefaults(onlyActive: boolean = false): Promise<InvoiceDefault[]> {
    let query = db.select().from(invoiceDefaults);
    
    if (onlyActive) {
      query = query.where(eq(invoiceDefaults.isActive, true)) as any;
    }
    
    return await query.orderBy(asc(invoiceDefaults.sortOrder));
  }

  async getInvoiceDefaultById(id: string): Promise<InvoiceDefault | undefined> {
    const result = await db.select().from(invoiceDefaults)
      .where(eq(invoiceDefaults.id, id))
      .limit(1);
    return result[0];
  }
  
  // Invoice line items management
  async createInvoiceLineItem(data: InsertInvoiceLineItem): Promise<InvoiceLineItem> {
    const result = await db.insert(invoiceLineItems).values(data).returning();
    return result[0];
  }

  async updateInvoiceLineItem(id: string, updates: Partial<InsertInvoiceLineItem>): Promise<InvoiceLineItem | undefined> {
    const result = await db.update(invoiceLineItems)
      .set(updates)
      .where(eq(invoiceLineItems.id, id))
      .returning();
    return result[0];
  }

  async deleteInvoiceLineItem(id: string): Promise<boolean> {
    const result = await db.delete(invoiceLineItems)
      .where(eq(invoiceLineItems.id, id))
      .returning();
    return result.length > 0;
  }

  async getInvoiceLineItems(invoiceId: string): Promise<InvoiceLineItem[]> {
    return await db.select().from(invoiceLineItems)
      .where(eq(invoiceLineItems.invoiceId, invoiceId))
      .orderBy(asc(invoiceLineItems.sortOrder));
  }

  async getInvoiceLineItemById(id: string): Promise<InvoiceLineItem | undefined> {
    const result = await db.select().from(invoiceLineItems)
      .where(eq(invoiceLineItems.id, id))
      .limit(1);
    return result[0];
  }

  async getInvoiceWithLineItems(invoiceId: string): Promise<Invoice & { lineItems: InvoiceLineItem[] } | undefined> {
    const invoice = await this.getInvoice(invoiceId);
    if (!invoice) return undefined;
    
    const lineItems = await this.getInvoiceLineItems(invoiceId);
    return { ...invoice, lineItems };
  }
  
  // Job completion with invoice support
  async markJobComplete(jobId: string, data: {
    completionNotes?: string;
    completionPhotos?: string[];
    contractorSignature?: string;
  }): Promise<Job | undefined> {
    // Update job status to completed
    const result = await db.update(jobs)
      .set({
        status: 'completed',
        completedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(jobs.id, jobId))
      .returning();
    
    if (result.length === 0) return undefined;
    
    // Update invoice if exists with completion details
    const invoice = await this.getInvoiceByJobId(jobId);
    if (invoice) {
      await db.update(invoices)
        .set({
          completionNotes: data.completionNotes,
          completionPhotos: data.completionPhotos,
          contractorSignature: data.contractorSignature,
          completedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(invoices.id, invoice.id));
    }
    
    return result[0];
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

  // ==================== BOOKING OPERATIONS ====================
  
  async getBookingSettings(serviceTypeId?: string): Promise<BookingSettings[]> {
    const conditions = [];
    if (serviceTypeId) {
      conditions.push(eq(bookingSettings.serviceTypeId, serviceTypeId));
    }
    conditions.push(eq(bookingSettings.isActive, true));
    
    const result = await db.select()
      .from(bookingSettings)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(bookingSettings.dayOfWeek);
    
    return result;
  }
  
  async createBookingSettings(settings: InsertBookingSettings): Promise<BookingSettings> {
    const [result] = await db.insert(bookingSettings).values(settings).returning();
    return result;
  }
  
  async updateBookingSettings(id: string, updates: Partial<InsertBookingSettings>): Promise<BookingSettings | undefined> {
    const [result] = await db.update(bookingSettings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(bookingSettings.id, id))
      .returning();
    return result;
  }
  
  async deleteBookingSettings(id: string): Promise<boolean> {
    const result = await db.delete(bookingSettings).where(eq(bookingSettings.id, id));
    return true;
  }
  
  async getBookingBlacklist(date?: string, serviceTypeId?: string): Promise<BookingBlacklist[]> {
    const conditions = [];
    if (date) {
      conditions.push(eq(bookingBlacklist.date, date));
    }
    if (serviceTypeId) {
      conditions.push(eq(bookingBlacklist.serviceTypeId, serviceTypeId));
    }
    
    const result = await db.select()
      .from(bookingBlacklist)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(bookingBlacklist.date);
    
    return result;
  }
  
  async createBookingBlacklist(blacklist: InsertBookingBlacklist): Promise<BookingBlacklist> {
    const [result] = await db.insert(bookingBlacklist).values(blacklist).returning();
    return result;
  }
  
  async deleteBookingBlacklist(id: string): Promise<boolean> {
    const result = await db.delete(bookingBlacklist).where(eq(bookingBlacklist.id, id));
    return true;
  }
  
  async getAvailableTimeSlots(date: string, serviceTypeId: string): Promise<Array<{
    time: string;
    available: boolean;
    maxCapacity: number;
    currentBookings: number;
  }>> {
    // Get day of week from date
    const dayOfWeek = new Date(date).getDay();
    
    // Get booking settings for this service and day
    const settings = await this.getBookingSettings(serviceTypeId);
    const daySettings = settings.find(s => s.dayOfWeek === dayOfWeek);
    
    if (!daySettings || !daySettings.isActive) {
      return [];
    }
    
    // Check for blacklisted dates
    const blacklisted = await this.getBookingBlacklist(date, serviceTypeId);
    if (blacklisted.some(b => !b.startTime && !b.endTime)) {
      // Entire day is blocked
      return [];
    }
    
    // Generate time slots
    const slots = [];
    const start = new Date(`${date} ${daySettings.startTime}`);
    const end = new Date(`${date} ${daySettings.endTime}`);
    const slotDuration = daySettings.slotDuration;
    const bufferTime = daySettings.bufferTime || 0;
    
    while (start < end) {
      const timeSlot = `${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')}`;
      const endSlot = new Date(start.getTime() + slotDuration * 60000);
      const endTimeSlot = `${endSlot.getHours().toString().padStart(2, '0')}:${endSlot.getMinutes().toString().padStart(2, '0')}`;
      
      // Check if this slot is blacklisted
      const isBlacklisted = blacklisted.some(b => {
        if (!b.startTime || !b.endTime) return false;
        return timeSlot >= b.startTime && timeSlot < b.endTime;
      });
      
      if (!isBlacklisted) {
        // Count current bookings for this slot
        const currentBookings = await db.select({
          count: sql<number>`COUNT(*)`
        })
        .from(jobs)
        .where(and(
          sql`DATE(${jobs.scheduledAt}) = ${date}`,
          sql`TO_CHAR(${jobs.scheduledAt}, 'HH24:MI') >= ${timeSlot}`,
          sql`TO_CHAR(${jobs.scheduledAt}, 'HH24:MI') < ${endTimeSlot}`,
          eq(jobs.serviceTypeId, serviceTypeId),
          ne(jobs.status, 'cancelled')
        ));
        
        slots.push({
          time: `${timeSlot}-${endTimeSlot}`,
          available: currentBookings[0]?.count < daySettings.maxBookingsPerSlot,
          maxCapacity: daySettings.maxBookingsPerSlot,
          currentBookings: currentBookings[0]?.count || 0
        });
      }
      
      // Move to next slot
      start.setMinutes(start.getMinutes() + slotDuration + bufferTime);
    }
    
    return slots;
  }
  
  async checkTimeSlotAvailability(date: string, timeSlot: string, serviceTypeId: string): Promise<boolean> {
    const slots = await this.getAvailableTimeSlots(date, serviceTypeId);
    const slot = slots.find(s => s.time === timeSlot);
    return slot ? slot.available : false;
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

  async getUserReminders(userId: string, options?: {
    status?: string;
    reminderType?: string;
    limit?: number;
    offset?: number;
    orderBy?: string;
    orderDir?: 'asc' | 'desc';
  }): Promise<{ reminders: Reminder[]; total: number }> {
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;
    
    const conditions = [eq(reminders.recipientId, userId)];
    
    if (options?.status) {
      conditions.push(eq(reminders.status, options.status as any));
    }
    
    if (options?.reminderType) {
      conditions.push(eq(reminders.reminderType, options.reminderType as any));
    }
    
    // Get total count
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(reminders)
      .where(and(...conditions));
    const total = Number(totalResult[0]?.count || 0);
    
    // Get paginated results
    const query = db
      .select()
      .from(reminders)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset);
    
    // Apply ordering
    if (options?.orderDir === 'asc') {
      query.orderBy(asc(reminders.scheduledSendTime));
    } else {
      query.orderBy(desc(reminders.scheduledSendTime));
    }
    
    const result = await query;
    
    return { reminders: result, total };
  }

  async getUserReminderLogs(userId: string, options?: {
    status?: string;
    channel?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ logs: ReminderLog[]; total: number }> {
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;
    
    const conditions = [eq(reminderLog.recipientId, userId)];
    
    if (options?.status) {
      conditions.push(eq(reminderLog.status, options.status));
    }
    
    if (options?.channel) {
      conditions.push(eq(reminderLog.channel, options.channel as any));
    }
    
    if (options?.startDate) {
      conditions.push(gte(reminderLog.createdAt, options.startDate));
    }
    
    if (options?.endDate) {
      conditions.push(lte(reminderLog.createdAt, options.endDate));
    }
    
    // Get total count
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(reminderLog)
      .where(and(...conditions));
    const total = Number(totalResult[0]?.count || 0);
    
    // Get paginated results
    const logs = await db
      .select()
      .from(reminderLog)
      .where(and(...conditions))
      .orderBy(desc(reminderLog.createdAt))
      .limit(limit)
      .offset(offset);
    
    return { logs, total };
  }

  async getUserReminderBlacklist(userId?: string, options?: {
    type?: 'email' | 'phone';
    isActive?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ entries: ReminderBlacklist[]; total: number }> {
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;
    
    const conditions = [];
    
    // If userId provided, filter by user who added the entry
    if (userId) {
      conditions.push(eq(reminderBlacklist.addedBy, userId));
    }
    
    if (options?.type) {
      conditions.push(eq(reminderBlacklist.type, options.type));
    }
    
    if (options?.isActive !== undefined) {
      conditions.push(eq(reminderBlacklist.isActive, options.isActive));
    }
    
    // Get total count
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(reminderBlacklist)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
    const total = Number(totalResult[0]?.count || 0);
    
    // Get paginated results
    const entries = await db
      .select()
      .from(reminderBlacklist)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(reminderBlacklist.createdAt))
      .limit(limit)
      .offset(offset);
    
    return { entries, total };
  }

  async addToReminderBlacklist(data: InsertReminderBlacklist): Promise<ReminderBlacklist> {
    const result = await db.insert(reminderBlacklist).values(data).returning();
    return result[0];
  }

  async removeFromReminderBlacklist(id: string, userId?: string): Promise<boolean> {
    const conditions = [eq(reminderBlacklist.id, id)];
    
    // If userId provided, ensure only the user who added can remove
    if (userId) {
      conditions.push(eq(reminderBlacklist.addedBy, userId));
    }
    
    const result = await db
      .update(reminderBlacklist)
      .set({ 
        isActive: false,
        updatedAt: new Date()
      })
      .where(and(...conditions))
      .returning();
    
    return result.length > 0;
  }

  async getPushNotificationHistoryPaginated(userId: string, options?: {
    days?: number;
    limit?: number;
    offset?: number;
  }): Promise<{ notifications: PushNotification[]; total: number }> {
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;
    const days = options?.days || 30;
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const conditions = [
      eq(pushNotifications.userId, userId),
      gte(pushNotifications.createdAt, cutoffDate)
    ];
    
    // Get total count
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(pushNotifications)
      .where(and(...conditions));
    const total = Number(totalResult[0]?.count || 0);
    
    // Get paginated results
    const notifications = await db
      .select()
      .from(pushNotifications)
      .where(and(...conditions))
      .orderBy(desc(pushNotifications.createdAt))
      .limit(limit)
      .offset(offset);
    
    return { notifications, total };
  }

  async getNotificationMetrics(options?: {
    startDate?: Date;
    endDate?: Date;
    channel?: string;
    messageType?: string;
  }): Promise<ReminderMetrics[]> {
    const conditions = [];
    
    if (options?.startDate) {
      conditions.push(gte(reminderMetrics.date, options.startDate));
    }
    
    if (options?.endDate) {
      conditions.push(lte(reminderMetrics.date, options.endDate));
    }
    
    if (options?.channel) {
      conditions.push(eq(reminderMetrics.channel, options.channel as any));
    }
    
    if (options?.messageType) {
      conditions.push(eq(reminderMetrics.messageType, options.messageType));
    }
    
    return await db
      .select()
      .from(reminderMetrics)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(reminderMetrics.date));
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
          ilike(contractorApplications.businessName, `%${filters.search}%`)
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
  
  // ==================== FLEET APPLICATION OPERATIONS ====================
  
  async createFleetApplication(data: InsertFleetApplication): Promise<FleetApplication> {
    const result = await db.insert(fleetApplications).values(data).returning();
    return result[0];
  }

  async getFleetApplication(id: string): Promise<FleetApplication | undefined> {
    const result = await db.select().from(fleetApplications).where(eq(fleetApplications.id, id)).limit(1);
    return result[0];
  }

  async updateFleetApplication(id: string, updates: Partial<InsertFleetApplication>): Promise<FleetApplication | undefined> {
    const result = await db.update(fleetApplications)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(fleetApplications.id, id))
      .returning();
    return result[0];
  }

  async findFleetApplications(filters: {
    status?: string;
    email?: string;
    companyName?: string;
    search?: string;
    fromDate?: Date;
    toDate?: Date;
  }): Promise<FleetApplication[]> {
    const conditions = [];
    
    if (filters.status) {
      conditions.push(eq(fleetApplications.status, filters.status as any));
    }
    
    if (filters.email) {
      conditions.push(eq(fleetApplications.primaryContactEmail, filters.email));
    }
    
    if (filters.companyName) {
      conditions.push(eq(fleetApplications.companyName, filters.companyName));
    }
    
    if (filters.search) {
      conditions.push(
        or(
          ilike(fleetApplications.companyName, `%${filters.search}%`),
          ilike(fleetApplications.primaryContactName, `%${filters.search}%`),
          ilike(fleetApplications.primaryContactEmail, `%${filters.search}%`),
          ilike(fleetApplications.primaryContactPhone, `%${filters.search}%`),
          ilike(fleetApplications.city, `%${filters.search}%`)
        )
      );
    }
    
    if (filters.fromDate) {
      conditions.push(gte(fleetApplications.createdAt, filters.fromDate));
    }
    
    if (filters.toDate) {
      conditions.push(lte(fleetApplications.createdAt, filters.toDate));
    }
    
    return await db.select().from(fleetApplications)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(fleetApplications.createdAt));
  }
  
  async getFleetApplicationByEmail(email: string): Promise<FleetApplication | undefined> {
    const result = await db.select().from(fleetApplications)
      .where(eq(fleetApplications.primaryContactEmail, email))
      .limit(1);
    return result[0];
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

  async getSubscriptionByStripeId(stripeSubscriptionId: string): Promise<BillingSubscription | null> {
    const result = await db.select().from(billingSubscriptions)
      .where(eq(billingSubscriptions.stripeSubscriptionId, stripeSubscriptionId))
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
        // lastBillingDate: new Date(), // Column doesn't exist
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
          lte(billingSubscriptions.currentPeriodEnd, now) // Use currentPeriodEnd instead of nextBillingDate
        )
      )
      .orderBy(asc(billingSubscriptions.currentPeriodEnd)) // Use currentPeriodEnd for ordering
      .limit(limit);
  }

  async pauseSubscription(id: string): Promise<BillingSubscription | null> {
    const result = await db.update(billingSubscriptions)
      .set({ 
        status: 'paused',
        // pausedAt: new Date(), // Column doesn't exist
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
        // pausedAt: null, // Column doesn't exist
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

  // Additional split payment methods for comprehensive API
  async applySplitToJob(jobId: string, splitPaymentId: string): Promise<boolean> {
    try {
      // Update job with split payment reference
      await db.update(jobs)
        .set({ 
          paymentStatus: 'pending',
          splitPaymentId,
          updatedAt: new Date()
        })
        .where(eq(jobs.id, jobId));
      
      return true;
    } catch (error) {
      console.error('Error applying split to job:', error);
      return false;
    }
  }

  async processSplitPayment(splitId: string, paymentDetails: any): Promise<SplitPayment | null> {
    try {
      const split = await this.getSplitPayment(splitId);
      if (!split) return null;

      // Update split payment with processing details
      const result = await db.update(splitPayments)
        .set({
          status: paymentDetails.status || 'processing',
          processingDetails: paymentDetails,
          updatedAt: new Date()
        })
        .where(eq(splitPayments.id, splitId))
        .returning();
      
      return result[0] || null;
    } catch (error) {
      console.error('Error processing split payment:', error);
      return null;
    }
  }

  async getSplitStatus(splitId: string): Promise<any> {
    const split = await this.getSplitPayment(splitId);
    if (!split) return null;

    const paymentSplitsList = await this.getPaymentSplitsBySplitPaymentId(splitId);
    
    const totalAmount = parseFloat(split.totalAmount);
    const totalPaid = paymentSplitsList.reduce((sum, ps) => 
      sum + parseFloat(ps.amountPaid || '0'), 0
    );
    const totalPending = paymentSplitsList.reduce((sum, ps) => 
      ps.status === 'pending' ? sum + parseFloat(ps.amountAssigned) : sum, 0
    );

    return {
      splitPayment: split,
      paymentSplits: paymentSplitsList,
      totalAmount,
      totalPaid,
      totalPending,
      remainingBalance: totalAmount - totalPaid,
      completionPercentage: totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 0,
      allPaid: split.status === 'completed'
    };
  }

  async generatePaymentLink(splitId: string, payerId: string): Promise<string | null> {
    try {
      const splits = await this.getPaymentSplitsBySplitPaymentId(splitId);
      const payerSplit = splits.find(s => s.payerId === payerId);
      
      if (!payerSplit) return null;
      
      // Return existing link if not expired
      if (payerSplit.paymentLinkUrl && payerSplit.tokenExpiresAt && 
          new Date() < payerSplit.tokenExpiresAt) {
        return payerSplit.paymentLinkUrl;
      }
      
      // Generate new token and link
      const newToken = randomBytes(32).toString('hex');
      const baseUrl = process.env.PUBLIC_URL || `http://localhost:${process.env.PORT || 5000}`;
      const newLink = `${baseUrl}/payment/split/${newToken}`;
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 48); // 48 hours expiration
      
      await db.update(paymentSplits)
        .set({
          paymentToken: newToken,
          paymentLinkUrl: newLink,
          tokenExpiresAt: expiresAt,
          updatedAt: new Date()
        })
        .where(eq(paymentSplits.id, payerSplit.id));
      
      return newLink;
    } catch (error) {
      console.error('Error generating payment link:', error);
      return null;
    }
  }

  async reconcileSplits(splitId: string): Promise<{
    isReconciled: boolean;
    discrepancies: any[];
    summary: any;
  }> {
    const splitStatus = await this.getSplitStatus(splitId);
    if (!splitStatus) {
      return { isReconciled: false, discrepancies: ['Split payment not found'], summary: null };
    }

    const discrepancies: any[] = [];
    const { splitPayment, paymentSplits, totalAmount, totalPaid } = splitStatus;

    // Check if all splits are accounted for
    const totalAssigned = paymentSplits.reduce((sum: number, ps: any) => 
      sum + parseFloat(ps.amountAssigned), 0
    );

    if (Math.abs(totalAmount - totalAssigned) > 0.01) {
      discrepancies.push({
        type: 'amount_mismatch',
        message: `Total amount ($${totalAmount}) doesn't match assigned amount ($${totalAssigned})`,
        difference: totalAmount - totalAssigned
      });
    }

    // Check for overpayments
    paymentSplits.forEach((ps: any) => {
      const assigned = parseFloat(ps.amountAssigned);
      const paid = parseFloat(ps.amountPaid || '0');
      
      if (paid > assigned) {
        discrepancies.push({
          type: 'overpayment',
          payerId: ps.payerId,
          message: `Payer ${ps.payerName} paid $${paid} but was assigned $${assigned}`,
          overpayment: paid - assigned
        });
      }
    });

    // Check for expired unpaid links
    const now = new Date();
    paymentSplits.forEach((ps: any) => {
      if (ps.status === 'pending' && ps.tokenExpiresAt && new Date(ps.tokenExpiresAt) < now) {
        discrepancies.push({
          type: 'expired_link',
          payerId: ps.payerId,
          message: `Payment link for ${ps.payerName} has expired`,
          expiredAt: ps.tokenExpiresAt
        });
      }
    });

    const isReconciled = discrepancies.length === 0 && splitPayment.status === 'completed';

    return {
      isReconciled,
      discrepancies,
      summary: {
        totalAmount,
        totalAssigned,
        totalPaid,
        totalPending: totalAmount - totalPaid,
        completedSplits: paymentSplits.filter((ps: any) => ps.status === 'paid').length,
        pendingSplits: paymentSplits.filter((ps: any) => ps.status === 'pending').length,
        failedSplits: paymentSplits.filter((ps: any) => ps.status === 'failed').length
      }
    };
  }

  async updateSplitPaymentTemplate(id: string, data: Partial<InsertSplitPaymentTemplate>): Promise<SplitPaymentTemplate | null> {
    const result = await db.update(splitPaymentTemplates)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(splitPaymentTemplates.id, id))
      .returning();
    return result[0] || null;
  }

  async deleteSplitPaymentTemplate(id: string): Promise<boolean> {
    try {
      await db.update(splitPaymentTemplates)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(splitPaymentTemplates.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting split payment template:', error);
      return false;
    }
  }

  async getPaymentSplitsByPayerId(payerId: string): Promise<PaymentSplit[]> {
    return await db.select().from(paymentSplits)
      .where(eq(paymentSplits.payerId, payerId))
      .orderBy(desc(paymentSplits.createdAt));
  }

  async getSplitPaymentHistory(splitId: string): Promise<any[]> {
    // Get all transactions related to this split payment
    const splits = await this.getPaymentSplitsBySplitPaymentId(splitId);
    const transactionIds = splits
      .filter(s => s.transactionId)
      .map(s => s.transactionId as string);
    
    if (transactionIds.length === 0) return [];
    
    const transactionHistory = await db.select()
      .from(transactions)
      .where(inArray(transactions.id, transactionIds))
      .orderBy(desc(transactions.createdAt));
    
    return transactionHistory.map(t => ({
      ...t,
      payerInfo: splits.find(s => s.transactionId === t.id)
    }));
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

  // Health monitoring methods
  async getUserCount(): Promise<number> {
    const result = await db.select({ count: sql`count(*)` }).from(users);
    return parseInt(result[0]?.count as string || '0');
  }

  async getJobCount(): Promise<number> {
    const result = await db.select({ count: sql`count(*)` }).from(jobs);
    return parseInt(result[0]?.count as string || '0');
  }

  async getActiveSessionCount(): Promise<number> {
    const result = await db.select({ count: sql`count(*)` })
      .from(sessions)
      .where(gte(sessions.expiresAt, new Date()));
    return parseInt(result[0]?.count as string || '0');
  }

  async getPendingPasswordResetCount(): Promise<number> {
    const result = await db.select({ count: sql`count(*)` })
      .from(passwordResetTokens)
      .where(and(
        gte(passwordResetTokens.expiresAt, new Date()),
        isNull(passwordResetTokens.usedAt)
      ));
    return parseInt(result[0]?.count as string || '0');
  }

  async getJobStatistics() {
    const stats = await db.select({
      status: jobs.status,
      count: sql<number>`count(*)`
    })
    .from(jobs)
    .groupBy(jobs.status);

    const total = stats.reduce((sum, s) => sum + Number(s.count), 0);
    const byStatus: Record<string, number> = {};
    stats.forEach(s => {
      byStatus[s.status] = Number(s.count);
    });

    return {
      total,
      byStatus,
      completionRate: total > 0 ? (byStatus['completed'] || 0) / total : 0
    };
  }

  async getStuckJobs(): Promise<number> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const result = await db.select({ count: sql`count(*)` })
      .from(jobs)
      .where(and(
        inArray(jobs.status, ['assigned', 'en_route', 'on_site']),
        lte(jobs.updatedAt, oneHourAgo)
      ));
    return parseInt(result[0]?.count as string || '0');
  }

  async getPaymentStatistics() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const stats = await db.select({
      status: transactions.status,
      count: sql<number>`count(*)`,
      total: sql<number>`sum(cast(amount as numeric))`
    })
    .from(transactions)
    .where(gte(transactions.createdAt, thirtyDaysAgo))
    .groupBy(transactions.status);

    const totalTransactions = stats.reduce((sum, s) => sum + Number(s.count), 0);
    const totalAmount = stats.reduce((sum, s) => sum + Number(s.total || 0), 0);
    const failedCount = stats.find(s => s.status === 'failed')?.count || 0;

    return {
      totalTransactions,
      totalAmount,
      failedCount: Number(failedCount),
      failureRate: totalTransactions > 0 ? Number(failedCount) / totalTransactions : 0
    };
  }

  async getNotificationStatistics() {
    const result = await db.select({
      totalSent: sql<number>`count(*)`,
      delivered: sql<number>`sum(case when status = 'delivered' then 1 else 0 end)`,
      failed: sql<number>`sum(case when status = 'failed' then 1 else 0 end)`
    })
    .from(reminderLog)
    .where(gte(reminderLog.sentAt, new Date(Date.now() - 24 * 60 * 60 * 1000)));

    return {
      totalSent: Number(result[0]?.totalSent || 0),
      delivered: Number(result[0]?.delivered || 0),
      failed: Number(result[0]?.failed || 0)
    };
  }

  async getSchedulerLastRunTimes() {
    // This would need a dedicated table to track scheduler runs
    // For now, return mock data
    return {
      'reminder-processor': new Date(Date.now() - 60 * 1000).toISOString(),
      'upcoming-services-checker': new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      'reminder-retry': new Date(Date.now() - 30 * 60 * 1000).toISOString()
    };
  }

  async getInvoiceStatistics() {
    const stats = await db.select({
      status: invoices.status,
      count: sql<number>`count(*)`,
      total: sql<number>`sum(cast(total_amount as numeric))`
    })
    .from(invoices)
    .groupBy(invoices.status);

    return {
      total: stats.reduce((sum, s) => sum + Number(s.count), 0),
      byStatus: Object.fromEntries(stats.map(s => [s.status, Number(s.count)])),
      totalAmount: stats.reduce((sum, s) => sum + Number(s.total || 0), 0)
    };
  }

  async getOverdueInvoiceCount(): Promise<number> {
    const result = await db.select({ count: sql`count(*)` })
      .from(invoices)
      .where(and(
        eq(invoices.status, 'overdue'),
        lte(invoices.dueDate, new Date())
      ));
    return parseInt(result[0]?.count as string || '0');
  }

  async getFleetStatistics() {
    const fleets = await db.select({
      totalFleets: sql<number>`count(distinct ${fleetAccounts.id})`,
      totalVehicles: sql<number>`count(distinct ${fleetVehicles.id})`
    })
    .from(fleetAccounts)
    .leftJoin(fleetVehicles, eq(fleetVehicles.fleetAccountId, fleetAccounts.id));

    return {
      totalFleets: Number(fleets[0]?.totalFleets || 0),
      totalVehicles: Number(fleets[0]?.totalVehicles || 0)
    };
  }

  async getFleetVehicleCount(): Promise<number> {
    const result = await db.select({ count: sql`count(*)` }).from(fleetVehicles);
    return parseInt(result[0]?.count as string || '0');
  }

  async getActiveFleetCount(): Promise<number> {
    const result = await db.select({ count: sql`count(*)` })
      .from(fleetAccounts)
      .where(eq(fleetAccounts.isActive, true));
    return parseInt(result[0]?.count as string || '0');
  }

  // ==================== GUEST USER & EMERGENCY BOOKING OPERATIONS ====================

  async createGuestUser(data: {
    phone: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    ipAddress?: string;
  }): Promise<User> {
    try {
      // Check if a guest user with this phone already exists
      const existingGuest = await db.select()
        .from(users)
        .where(and(
          eq(users.phone, data.phone),
          eq(users.isGuest, true)
        ))
        .limit(1);

      if (existingGuest.length > 0) {
        // Update existing guest user with new info if provided
        const updates: any = { updatedAt: new Date() };
        if (data.email) updates.email = data.email;
        if (data.firstName) updates.firstName = data.firstName;
        if (data.lastName) updates.lastName = data.lastName;
        
        const updated = await db.update(users)
          .set(updates)
          .where(eq(users.id, existingGuest[0].id))
          .returning();
        return updated[0];
      }

      // For guest users, don't use email (to avoid unique constraint issues)
      // Guest users are identified by phone number only
      const guestUser = await db.insert(users)
        .values({
          phone: data.phone,
          email: null, // Don't store email for guest users to avoid unique constraint
          firstName: data.firstName || 'Guest',
          lastName: data.lastName || 'User',
          role: 'driver', // Guest users default to driver role
          isGuest: true,
          isActive: true,
          password: null // No password for guest users
        })
        .returning();

      return guestUser[0];
    } catch (error) {
      console.error('Error creating guest user:', error);
      
      // If there's still a phone conflict, try to find and return the existing user
      if (error instanceof Error && error.message.includes('unique')) {
        const existingUser = await db.select()
          .from(users)
          .where(eq(users.phone, data.phone))
          .limit(1);
        
        if (existingUser.length > 0) {
          // Update to mark as guest if not already
          if (!existingUser[0].isGuest) {
            const updated = await db.update(users)
              .set({ isGuest: true, updatedAt: new Date() })
              .where(eq(users.id, existingUser[0].id))
              .returning();
            return updated[0];
          }
          return existingUser[0];
        }
      }
      
      throw error;
    }
  }

  async createEmergencyBooking(data: {
    guestUserId: string;
    serviceTypeId: string;
    location: { lat: number; lng: number };
    locationAddress: string;
    vehicleInfo: {
      make?: string;
      model?: string;
      year?: string;
      licensePlate?: string;
    };
    description: string;
    photos?: string[];
    ipAddress?: string;
  }): Promise<Job> {
    try {
      // Generate a shorter job number for emergency
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.random().toString(36).substr(2, 4).toUpperCase();
      const jobNumber = `EM-${timestamp}-${random}`;

      // Create the emergency job
      const job = await db.insert(jobs)
        .values({
          jobNumber,
          customerId: data.guestUserId,
          serviceTypeId: data.serviceTypeId,
          jobType: 'emergency',
          status: 'new',
          location: data.location,
          address: data.locationAddress,
          vehicleMake: data.vehicleInfo.make,
          vehicleModel: data.vehicleInfo.model,
          vehicleYear: data.vehicleInfo.year,
          vehicleLicensePlate: data.vehicleInfo.licensePlate,
          issueDescription: data.description,
          photos: data.photos || [],
          isEmergency: true,
          priority: 'high',
          notes: `Guest booking from IP: ${data.ipAddress || 'Unknown'}`
        })
        .returning();

      // Add to job status history
      await db.insert(jobStatusHistory)
        .values({
          jobId: job[0].id,
          toStatus: 'new',
          changedBy: data.guestUserId,
          reason: 'Emergency guest booking'
        });

      return job[0];
    } catch (error) {
      console.error('Error creating emergency booking:', error);
      throw error;
    }
  }

  async getPublicJobInfo(jobId: string): Promise<{
    job: Job | null;
    contractor: any | null;
    customer: any | null;
    statusHistory: JobStatusHistory[];
  }> {
    try {
      // Get job details
      const job = await db.select()
        .from(jobs)
        .where(eq(jobs.id, jobId))
        .limit(1);

      if (job.length === 0) {
        return { job: null, contractor: null, customer: null, statusHistory: [] };
      }

      // Get contractor info if assigned
      let contractor = null;
      if (job[0].contractorId) {
        const contractorResult = await db.select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          phone: users.phone,
          companyName: contractorProfiles.companyName,
          averageRating: contractorProfiles.averageRating,
          totalJobsCompleted: contractorProfiles.totalJobsCompleted,
          currentLocation: contractorProfiles.currentLocation,
          isOnline: contractorProfiles.isOnline
        })
        .from(users)
        .leftJoin(contractorProfiles, eq(users.id, contractorProfiles.userId))
        .where(eq(users.id, job[0].contractorId))
        .limit(1);
        
        if (contractorResult.length > 0) {
          contractor = contractorResult[0];
        }
      }

      // Get limited customer info (for display purposes)
      let customer = null;
      if (job[0].customerId) {
        const customerResult = await db.select({
          firstName: users.firstName,
          lastName: users.lastName
        })
        .from(users)
        .where(eq(users.id, job[0].customerId))
        .limit(1);
        
        if (customerResult.length > 0) {
          customer = customerResult[0];
        }
      }

      // Get status history
      const statusHistory = await db.select()
        .from(jobStatusHistory)
        .where(eq(jobStatusHistory.jobId, jobId))
        .orderBy(desc(jobStatusHistory.createdAt));

      return {
        job: job[0],
        contractor,
        customer,
        statusHistory
      };
    } catch (error) {
      console.error('Error getting public job info:', error);
      return { job: null, contractor: null, customer: null, statusHistory: [] };
    }
  }

  async getGuestBookingsByPhone(phone: string, hoursAgo: number = 1): Promise<Job[]> {
    try {
      const timeLimit = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
      
      // First get guest users with this phone
      const guestUsers = await db.select()
        .from(users)
        .where(and(
          eq(users.phone, phone),
          eq(users.isGuest, true)
        ));

      if (guestUsers.length === 0) {
        return [];
      }

      const guestUserIds = guestUsers.map(u => u.id);

      // Get jobs created by these guest users within the time limit
      const recentJobs = await db.select()
        .from(jobs)
        .where(and(
          inArray(jobs.customerId, guestUserIds),
          gte(jobs.createdAt, timeLimit)
        ))
        .orderBy(desc(jobs.createdAt));

      return recentJobs;
    } catch (error) {
      console.error('Error getting guest bookings by phone:', error);
      return [];
    }
  }

  async verifyJobOwnershipByPhone(jobId: string, phone: string): Promise<boolean> {
    try {
      const job = await db.select()
        .from(jobs)
        .where(eq(jobs.id, jobId))
        .limit(1);

      if (job.length === 0) {
        return false;
      }

      const user = await db.select()
        .from(users)
        .where(and(
          eq(users.id, job[0].customerId),
          eq(users.phone, phone)
        ))
        .limit(1);

      return user.length > 0;
    } catch (error) {
      console.error('Error verifying job ownership:', error);
      return false;
    }
  }

  async cleanupExpiredGuestUsers(): Promise<number> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      // Soft delete expired guest users
      const result = await db.update(users)
        .set({ 
          deletedAt: new Date(),
          isActive: false 
        })
        .where(and(
          eq(users.isGuest, true),
          lte(users.createdAt, thirtyDaysAgo),
          isNull(users.deletedAt)
        ))
        .returning();

      return result.length;
    } catch (error) {
      console.error('Error cleaning up expired guest users:', error);
      return 0;
    }
  }

  // ==================== LOCATION TRACKING IMPLEMENTATION ====================
  
  async updateContractorLocation(contractorId: string, location: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    altitude?: number;
    heading?: number;
    speed?: number;
    batteryLevel?: number;
    isCharging?: boolean;
    networkType?: string;
  }): Promise<LocationTracking | null> {
    try {
      // Check if tracking record exists
      const existing = await db.select()
        .from(locationTracking)
        .where(eq(locationTracking.contractorId, contractorId))
        .limit(1);
      
      const now = new Date();
      
      // Determine if stationary
      let isStationary = false;
      let stationaryDuration = 0;
      let updateFrequency: 'high' | 'normal' | 'low' | 'stationary' = 'normal';
      
      if (existing[0]) {
        const prevLat = parseFloat(existing[0].latitude);
        const prevLng = parseFloat(existing[0].longitude);
        const distance = this.calculateDistance(
          { lat: prevLat, lng: prevLng },
          { lat: location.latitude, lng: location.longitude }
        );
        
        // If moved less than 50 meters, consider stationary
        if (distance < 0.031) { // ~50 meters in miles
          isStationary = true;
          const lastMovement = existing[0].lastMovementAt || existing[0].createdAt;
          stationaryDuration = Math.floor((now.getTime() - lastMovement.getTime()) / 1000);
          updateFrequency = 'stationary';
        } else if (location.speed && location.speed > 50) {
          updateFrequency = 'high';
        } else if (location.speed && location.speed < 5) {
          updateFrequency = 'low';
        }
      }
      
      const trackingData = {
        contractorId,
        latitude: location.latitude.toString(),
        longitude: location.longitude.toString(),
        accuracy: location.accuracy?.toString(),
        altitude: location.altitude?.toString(),
        heading: location.heading?.toString(),
        speed: location.speed?.toString(),
        batteryLevel: location.batteryLevel,
        isCharging: location.isCharging,
        networkType: location.networkType,
        updateFrequency,
        isStationary,
        stationaryDuration,
        lastMovementAt: isStationary ? (existing[0]?.lastMovementAt || now) : now,
        updatedAt: now
      };
      
      let result;
      if (existing[0]) {
        // Update existing record
        result = await db.update(locationTracking)
          .set(trackingData)
          .where(eq(locationTracking.contractorId, contractorId))
          .returning();
      } else {
        // Create new record
        result = await db.insert(locationTracking)
          .values({ ...trackingData, trackingStatus: 'active', isPaused: false })
          .returning();
      }
      
      // Update contractor profile current location
      await db.update(contractorProfiles)
        .set({
          currentLocation: { lat: location.latitude, lng: location.longitude },
          lastLocationUpdate: now
        })
        .where(eq(contractorProfiles.userId, contractorId));
      
      return result[0];
    } catch (error) {
      console.error('Error updating contractor location:', error);
      return null;
    }
  }
  
  async saveLocationHistory(data: InsertLocationHistory): Promise<LocationHistory> {
    const result = await db.insert(locationHistory).values(data).returning();
    return result[0];
  }
  
  async getLocationHistory(contractorId: string, options?: {
    jobId?: string;
    fromDate?: Date;
    toDate?: Date;
    limit?: number;
    includeAnonymized?: boolean;
  }): Promise<LocationHistory[]> {
    const conditions: any[] = [eq(locationHistory.contractorId, contractorId)];
    
    if (options?.jobId) {
      conditions.push(eq(locationHistory.jobId, options.jobId));
    }
    
    if (!options?.includeAnonymized) {
      conditions.push(eq(locationHistory.isAnonymized, false));
    }
    
    if (options?.fromDate) {
      conditions.push(gte(locationHistory.recordedAt, options.fromDate));
    }
    
    if (options?.toDate) {
      conditions.push(lte(locationHistory.recordedAt, options.toDate));
    }
    
    const query = db.select()
      .from(locationHistory)
      .where(and(...conditions))
      .orderBy(desc(locationHistory.recordedAt));
    
    if (options?.limit) {
      query.limit(options.limit);
    }
    
    return await query;
  }
  
  async getActiveTrackingSession(contractorId: string, jobId?: string): Promise<TrackingSession | null> {
    const conditions: any[] = [
      eq(trackingSessions.contractorId, contractorId),
      eq(trackingSessions.isActive, true)
    ];
    
    if (jobId) {
      conditions.push(eq(trackingSessions.jobId, jobId));
    }
    
    const result = await db.select()
      .from(trackingSessions)
      .where(and(...conditions))
      .limit(1);
    
    return result[0] || null;
  }
  
  async startTrackingSession(data: {
    contractorId: string;
    jobId?: string;
    startLocation?: any;
  }): Promise<TrackingSession> {
    // End any existing active sessions
    await db.update(trackingSessions)
      .set({ isActive: false, endedAt: new Date(), endReason: 'new_session' })
      .where(and(
        eq(trackingSessions.contractorId, data.contractorId),
        eq(trackingSessions.isActive, true)
      ));
    
    const result = await db.insert(trackingSessions)
      .values({
        contractorId: data.contractorId,
        jobId: data.jobId,
        startLocation: data.startLocation,
        isActive: true
      })
      .returning();
    
    return result[0];
  }
  
  async endTrackingSession(sessionId: string, endReason: string): Promise<TrackingSession> {
    const result = await db.update(trackingSessions)
      .set({
        isActive: false,
        endedAt: new Date(),
        endReason
      })
      .where(eq(trackingSessions.id, sessionId))
      .returning();
    
    return result[0];
  }
  
  async updateTrackingSessionStats(sessionId: string, stats: {
    totalDistance?: number;
    totalDuration?: number;
    averageSpeed?: number;
    maxSpeed?: number;
    totalPoints?: number;
  }): Promise<void> {
    const updateData: any = {};
    
    if (stats.totalDistance !== undefined) {
      updateData.totalDistance = stats.totalDistance.toString();
    }
    if (stats.totalDuration !== undefined) {
      updateData.totalDuration = stats.totalDuration;
    }
    if (stats.averageSpeed !== undefined) {
      updateData.averageSpeed = stats.averageSpeed.toString();
    }
    if (stats.maxSpeed !== undefined) {
      updateData.maxSpeed = stats.maxSpeed.toString();
    }
    if (stats.totalPoints !== undefined) {
      updateData.totalPoints = stats.totalPoints;
    }
    
    await db.update(trackingSessions)
      .set(updateData)
      .where(eq(trackingSessions.id, sessionId));
  }
  
  async recordGeofenceEvent(data: InsertGeofenceEvent): Promise<GeofenceEvent> {
    const result = await db.insert(geofenceEvents).values(data).returning();
    
    // Auto-update job status if arrival event
    if (data.eventType === 'arrived' && data.jobId) {
      await db.update(jobs)
        .set({
          status: 'on_site',
          arrivedAt: new Date()
        })
        .where(eq(jobs.id, data.jobId));
    }
    
    return result[0];
  }
  
  async getGeofenceEvents(jobId: string): Promise<GeofenceEvent[]> {
    return await db.select()
      .from(geofenceEvents)
      .where(eq(geofenceEvents.jobId, jobId))
      .orderBy(desc(geofenceEvents.triggeredAt));
  }
  
  async getActiveTracking(): Promise<LocationTracking[]> {
    return await db.select()
      .from(locationTracking)
      .where(and(
        eq(locationTracking.trackingStatus, 'active'),
        eq(locationTracking.isPaused, false)
      ));
  }
  
  async pauseTracking(contractorId: string, reason?: string): Promise<void> {
    await db.update(locationTracking)
      .set({
        isPaused: true,
        pausedAt: new Date(),
        pausedReason: reason
      })
      .where(eq(locationTracking.contractorId, contractorId));
  }
  
  async resumeTracking(contractorId: string): Promise<void> {
    await db.update(locationTracking)
      .set({
        isPaused: false,
        pausedAt: null,
        pausedReason: null
      })
      .where(eq(locationTracking.contractorId, contractorId));
  }
  
  async calculateETA(contractorLocation: { lat: number; lng: number }, jobLocation: { lat: number; lng: number }, averageSpeed?: number): Promise<{
    eta: Date;
    distanceMiles: number;
    estimatedMinutes: number;
  }> {
    const distance = this.calculateDistance(contractorLocation, jobLocation);
    
    // Determine average speed based on distance (highway vs city)
    let speed = averageSpeed;
    if (!speed) {
      speed = distance > 20 ? 45 : 25; // Highway vs city speed
    }
    
    const estimatedMinutes = Math.round((distance / speed) * 60);
    const eta = new Date();
    eta.setMinutes(eta.getMinutes() + estimatedMinutes);
    
    return {
      eta,
      distanceMiles: distance,
      estimatedMinutes
    };
  }
  
  async detectArrival(contractorId: string, jobId: string, currentLocation: { lat: number; lng: number }, radiusMeters: number = 100): Promise<boolean> {
    // Get job location
    const job = await db.select()
      .from(jobs)
      .where(eq(jobs.id, jobId))
      .limit(1);
    
    if (!job[0] || !job[0].location) {
      return false;
    }
    
    const jobLocation = job[0].location as any;
    const distance = this.calculateDistance(currentLocation, jobLocation) * 1609.34; // Convert miles to meters
    
    if (distance <= radiusMeters) {
      // Check if we already recorded an arrival event
      const existingEvent = await db.select()
        .from(geofenceEvents)
        .where(and(
          eq(geofenceEvents.jobId, jobId),
          eq(geofenceEvents.contractorId, contractorId),
          eq(geofenceEvents.eventType, 'arrived')
        ))
        .limit(1);
      
      if (!existingEvent[0]) {
        // Record arrival event
        await this.recordGeofenceEvent({
          contractorId,
          jobId,
          eventType: 'arrived',
          latitude: currentLocation.lat.toString(),
          longitude: currentLocation.lng.toString(),
          radius: radiusMeters,
          jobLatitude: jobLocation.lat.toString(),
          jobLongitude: jobLocation.lng.toString(),
          distanceFromSite: distance.toString(),
          notificationSent: false
        });
      }
      
      return true;
    }
    
    return false;
  }
  
  async anonymizeOldLocationData(daysOld: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const result = await db.update(locationHistory)
      .set({
        isAnonymized: true,
        anonymizedAt: new Date()
      })
      .where(and(
        lte(locationHistory.recordedAt, cutoffDate),
        eq(locationHistory.isAnonymized, false)
      ));
    
    return result.rowCount || 0;
  }
  
  async getContractorLocation(contractorId: string): Promise<LocationTracking | null> {
    const result = await db.select()
      .from(locationTracking)
      .where(eq(locationTracking.contractorId, contractorId))
      .limit(1);
    
    return result[0] || null;
  }
  
  async getSessionRoute(sessionId: string): Promise<{
    polyline: string;
    points: Array<{ lat: number; lng: number; timestamp: Date }>;
  }> {
    const points = await db.select()
      .from(locationHistory)
      .where(eq(locationHistory.sessionId, sessionId))
      .orderBy(asc(locationHistory.recordedAt));
    
    const routePoints = points.map(p => ({
      lat: parseFloat(p.latitude),
      lng: parseFloat(p.longitude),
      timestamp: p.recordedAt
    }));
    
    // Simple polyline encoding (in production, use Google's polyline encoder)
    const polyline = routePoints
      .map(p => `${p.lat.toFixed(6)},${p.lng.toFixed(6)}`)
      .join('|');
    
    return {
      polyline,
      points: routePoints
    };
  }
  
  // ==================== PUSH NOTIFICATIONS ====================
  
  async savePushSubscription(userId: string, subscription: {
    endpoint: string;
    p256dhKey: string;
    authKey: string;
    deviceType: string;
    browserInfo?: any;
  }): Promise<PushSubscription> {
    // First check if this subscription already exists
    const existing = await db.select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.endpoint, subscription.endpoint))
      .limit(1);
    
    if (existing.length > 0) {
      // Update existing subscription
      const [updated] = await db.update(pushSubscriptions)
        .set({
          p256dhKey: subscription.p256dhKey,
          authKey: subscription.authKey,
          deviceType: subscription.deviceType,
          browserInfo: subscription.browserInfo,
          isActive: true,
          lastUsed: new Date()
        })
        .where(eq(pushSubscriptions.id, existing[0].id))
        .returning();
      return updated;
    }
    
    // Create new subscription
    const [created] = await db.insert(pushSubscriptions)
      .values({
        userId,
        endpoint: subscription.endpoint,
        p256dhKey: subscription.p256dhKey,
        authKey: subscription.authKey,
        deviceType: subscription.deviceType,
        browserInfo: subscription.browserInfo,
        isActive: true
      })
      .returning();
    
    return created;
  }
  
  async removePushSubscription(subscriptionId: string): Promise<void> {
    await db.delete(pushSubscriptions)
      .where(eq(pushSubscriptions.id, subscriptionId));
  }
  
  async getPushSubscriptions(userId: string): Promise<PushSubscription[]> {
    return await db.select()
      .from(pushSubscriptions)
      .where(
        and(
          eq(pushSubscriptions.userId, userId),
          eq(pushSubscriptions.isActive, true)
        )
      );
  }
  
  async updatePushSubscriptionLastUsed(subscriptionId: string): Promise<void> {
    await db.update(pushSubscriptions)
      .set({ lastUsed: new Date() })
      .where(eq(pushSubscriptions.id, subscriptionId));
  }
  
  async deactivatePushSubscription(subscriptionId: string): Promise<void> {
    await db.update(pushSubscriptions)
      .set({ isActive: false })
      .where(eq(pushSubscriptions.id, subscriptionId));
  }
  
  async logPushNotification(notification: InsertPushNotification): Promise<PushNotification> {
    const [created] = await db.insert(pushNotifications)
      .values(notification)
      .returning();
    return created;
  }
  
  async markNotificationSent(notificationId: string): Promise<void> {
    await db.update(pushNotifications)
      .set({ sentAt: new Date() })
      .where(eq(pushNotifications.id, notificationId));
  }
  
  async markNotificationDelivered(notificationId: string): Promise<void> {
    await db.update(pushNotifications)
      .set({ deliveredAt: new Date() })
      .where(eq(pushNotifications.id, notificationId));
  }
  
  async markNotificationClicked(notificationId: string): Promise<void> {
    await db.update(pushNotifications)
      .set({ clickedAt: new Date() })
      .where(eq(pushNotifications.id, notificationId));
  }
  
  async markNotificationFailed(notificationId: string, reason: string): Promise<void> {
    await db.update(pushNotifications)
      .set({ 
        failedAt: new Date(),
        failureReason: reason
      })
      .where(eq(pushNotifications.id, notificationId));
  }
  
  async getUserNotificationHistory(userId: string, days: number): Promise<PushNotification[]> {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);
    
    return await db.select()
      .from(pushNotifications)
      .where(
        and(
          eq(pushNotifications.userId, userId),
          gte(pushNotifications.createdAt, sinceDate)
        )
      )
      .orderBy(desc(pushNotifications.createdAt));
  }
  
  async deleteOldPushNotifications(daysToKeep: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    const result = await db.delete(pushNotifications)
      .where(lt(pushNotifications.createdAt, cutoffDate));
    
    return result.count || 0;
  }
  
  // Check and reassign staled jobs that haven't been accepted
  async checkAndReassignStaledJobs(): Promise<Array<{
    jobId: string;
    oldContractorId: string;
    newContractorId: string;
    attemptNumber: number;
  }>> {
    const reassignments: Array<{
      jobId: string;
      oldContractorId: string;
      newContractorId: string;
      attemptNumber: number;
    }> = [];

    try {
      // Find jobs that:
      // 1. Are in 'assigned' status
      // 2. Were last assigned more than 15 minutes ago
      // 3. Haven't exceeded max attempts (3)
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
      
      const staledJobs = await db.select()
        .from(jobs)
        .where(
          and(
            eq(jobs.status, 'assigned'),
            lte(jobs.lastAssignmentAttemptAt, fifteenMinutesAgo),
            lt(jobs.assignmentAttempts, 3)
          )
        )
        .limit(20); // Process up to 20 jobs at a time to avoid overload

      console.log(`[Reassignment] Found ${staledJobs.length} staled jobs to reassign`);

      for (const job of staledJobs) {
        if (!job.contractorId) continue;

        try {
          console.log(`[Reassignment] Processing job ${job.id}, attempt #${job.assignmentAttempts + 1}/3`);
          
          // Get job location for finding available contractors
          let jobLat, jobLon;
          if (job.location && typeof job.location === 'object') {
            const location = job.location as any;
            jobLat = location.lat || location.latitude;
            jobLon = location.lon || location.lng || location.longitude;
          }

          // Get available contractors, excluding the current one
          const availableContractors = await this.getAvailableContractorsForAssignment(jobLat, jobLon);
          
          // Filter out the current contractor
          const alternativeContractors = availableContractors.filter(
            c => c.id !== job.contractorId
          );

          console.log(`[Reassignment] Found ${alternativeContractors.length} alternative contractors for job ${job.id}`);

          if (alternativeContractors.length === 0) {
            // No alternative contractors available
            console.log(`[Reassignment] No alternative contractors available for job ${job.id}`);
            
            // If this is the 3rd attempt, cancel the job
            if (job.assignmentAttempts >= 2) {
              console.log(`[Reassignment] Job ${job.id} exceeded max attempts, cancelling`);
              await db.update(jobs)
                .set({
                  status: 'cancelled',
                  cancelledAt: new Date(),
                  completionNotes: 'Cancelled: No contractor accepted after 3 assignment attempts',
                  updatedAt: new Date()
                })
                .where(eq(jobs.id, job.id));
              
              // Add to job status history
              await db.insert(jobStatusHistory).values({
                jobId: job.id,
                fromStatus: 'assigned',
                toStatus: 'cancelled',
                notes: 'Auto-cancelled after 3 failed assignment attempts'
              });
            }
            continue;
          }

          // Select the next contractor (already sorted by round-robin logic)
          const newContractor = alternativeContractors[0];
          const oldContractorId = job.contractorId;

          console.log(`[Reassignment] Reassigning job ${job.id} from contractor ${oldContractorId} to ${newContractor.id}`);
          console.log(`[Reassignment] New contractor: ${newContractor.name}, Tier: ${newContractor.performanceTier}, Last assigned: ${newContractor.lastAssignedAt}`);

          // First, record in job status history that we're unassigning
          await db.insert(jobStatusHistory).values({
            jobId: job.id,
            fromStatus: 'assigned',
            toStatus: 'new',
            notes: `Unassigned from contractor ${oldContractorId} due to non-response (attempt #${job.assignmentAttempts})`
          });

          // Reset job status temporarily
          await db.update(jobs)
            .set({
              status: 'new',
              contractorId: null,
              updatedAt: new Date()
            })
            .where(eq(jobs.id, job.id));

          // Reassign to new contractor using the existing function
          const updatedJob = await this.assignContractorToJob(job.id, newContractor.id);

          if (updatedJob) {
            reassignments.push({
              jobId: job.id,
              oldContractorId: oldContractorId,
              newContractorId: newContractor.id,
              attemptNumber: job.assignmentAttempts + 1
            });

            // Log successful reassignment
            console.log(`[Reassignment] Successfully reassigned job ${job.id} to contractor ${newContractor.id}`);
          }
        } catch (error) {
          console.error(`[Reassignment] Error processing job ${job.id}:`, error);
        }
      }

      if (reassignments.length > 0) {
        console.log(`[Reassignment] Completed ${reassignments.length} reassignments`);
      }

    } catch (error) {
      console.error('[Reassignment] Error in checkAndReassignStaledJobs:', error);
    }

    return reassignments;
  }
  
  // Helper function for distance calculation
  private calculateDistance(loc1: { lat: number; lng: number }, loc2: { lat: number; lng: number }): number {
    const R = 3959; // Earth's radius in miles
    const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
    const dLng = (loc2.lng - loc1.lng) * Math.PI / 180;
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return Math.round(distance * 10) / 10; // Round to 1 decimal place
  }

  // ==================== BATCH JOB SCHEDULING ====================
  
  async createBatchJobs(data: {
    fleetAccountId: string;
    vehicleIds: string[];
    serviceType: string;
    scheduledDate: Date;
    urgency: 'routine' | 'urgent' | 'emergency';
    description?: string;
    estimatedDuration?: number;
    createdBy: string;
  }): Promise<Job[]> {
    const createdJobs: Job[] = [];
    
    // Get fleet vehicles to ensure they belong to the fleet
    const vehicles = await db.select()
      .from(fleetVehicles)
      .where(
        and(
          eq(fleetVehicles.fleetAccountId, data.fleetAccountId),
          inArray(fleetVehicles.id, data.vehicleIds),
          eq(fleetVehicles.isActive, true)
        )
      );
    
    if (vehicles.length === 0) {
      throw new Error('No valid vehicles found for batch scheduling');
    }
    
    // Create a job for each vehicle
    for (const vehicle of vehicles) {
      const jobData: InsertJob = {
        driverId: data.createdBy,
        vehicleType: vehicle.vehicleType || 'truck',
        serviceType: data.serviceType,
        description: data.description || `Scheduled maintenance for ${vehicle.unitNumber}`,
        urgency: data.urgency,
        status: 'new',
        fleetAccountId: data.fleetAccountId,
        vehicleId: vehicle.id,
        scheduledAt: data.scheduledDate,
        estimatedDuration: data.estimatedDuration || 120, // Default 2 hours
        location: null, // Will be set by fleet location
        jobType: 'scheduled'
      };
      
      const [job] = await db.insert(jobs).values(jobData).returning();
      
      // Add to job status history
      await db.insert(jobStatusHistory).values({
        jobId: job.id,
        fromStatus: 'new',
        toStatus: 'new',
        notes: `Batch scheduled for vehicle ${vehicle.unitNumber}`
      });
      
      createdJobs.push(job);
    }
    
    return createdJobs;
  }
  
  // ==================== PM SCHEDULING ====================
  
  async getPmSchedules(fleetAccountId: string, options?: {
    vehicleId?: string;
    isActive?: boolean;
  }): Promise<PmSchedule[]> {
    const conditions: any[] = [eq(pmSchedules.fleetAccountId, fleetAccountId)];
    
    if (options?.vehicleId) {
      conditions.push(eq(pmSchedules.vehicleId, options.vehicleId));
    }
    
    if (options?.isActive !== undefined) {
      conditions.push(eq(pmSchedules.isActive, options.isActive));
    }
    
    return await db.select()
      .from(pmSchedules)
      .where(and(...conditions))
      .orderBy(asc(pmSchedules.nextServiceDate));
  }
  
  async getPmSchedule(scheduleId: string, fleetAccountId: string): Promise<PmSchedule | null> {
    const [schedule] = await db.select()
      .from(pmSchedules)
      .where(
        and(
          eq(pmSchedules.id, scheduleId),
          eq(pmSchedules.fleetAccountId, fleetAccountId)
        )
      )
      .limit(1);
    
    return schedule || null;
  }
  
  async createPmSchedule(data: InsertPmSchedule): Promise<PmSchedule> {
    // Validate vehicle belongs to the fleet
    const [vehicle] = await db.select()
      .from(fleetVehicles)
      .where(
        and(
          eq(fleetVehicles.id, data.vehicleId),
          eq(fleetVehicles.fleetAccountId, data.fleetAccountId),
          eq(fleetVehicles.isActive, true)
        )
      )
      .limit(1);
    
    if (!vehicle) {
      throw new Error('Vehicle not found or does not belong to this fleet');
    }
    
    const [schedule] = await db.insert(pmSchedules).values(data).returning();
    return schedule;
  }
  
  async updatePmSchedule(scheduleId: string, fleetAccountId: string, data: Partial<InsertPmSchedule>): Promise<PmSchedule | null> {
    const [updated] = await db.update(pmSchedules)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(pmSchedules.id, scheduleId),
          eq(pmSchedules.fleetAccountId, fleetAccountId)
        )
      )
      .returning();
    
    return updated || null;
  }
  
  async deletePmSchedule(scheduleId: string, fleetAccountId: string): Promise<boolean> {
    const result = await db.delete(pmSchedules)
      .where(
        and(
          eq(pmSchedules.id, scheduleId),
          eq(pmSchedules.fleetAccountId, fleetAccountId)
        )
      )
      .returning();
    
    return result.length > 0;
  }
  
  async processDuePmSchedules(): Promise<{
    processedCount: number;
    createdJobs: Job[];
  }> {
    const createdJobs: Job[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Find all active PM schedules that are due
    const dueSchedules = await db.select()
      .from(pmSchedules)
      .where(
        and(
          eq(pmSchedules.isActive, true),
          lte(pmSchedules.nextServiceDate, today)
        )
      );
    
    for (const schedule of dueSchedules) {
      // Get the vehicle details
      const [vehicle] = await db.select()
        .from(fleetVehicles)
        .where(eq(fleetVehicles.id, schedule.vehicleId))
        .limit(1);
      
      if (!vehicle || !vehicle.isActive) continue;
      
      // Create a scheduled job
      const jobData: InsertJob = {
        vehicleType: vehicle.vehicleType || 'truck',
        serviceType: schedule.serviceType,
        description: `PM Service: ${schedule.serviceType} for ${vehicle.unitNumber}`,
        urgency: 'routine',
        status: 'new',
        fleetAccountId: schedule.fleetAccountId,
        vehicleId: vehicle.id,
        scheduledAt: schedule.nextServiceDate,
        estimatedDuration: 120, // Default 2 hours
        location: null,
        jobType: 'scheduled'
      };
      
      const [job] = await db.insert(jobs).values(jobData).returning();
      createdJobs.push(job);
      
      // Calculate next service date based on frequency
      let nextDate = new Date(schedule.nextServiceDate);
      switch (schedule.frequency) {
        case 'weekly':
          nextDate.setDate(nextDate.getDate() + 7);
          break;
        case 'monthly':
          nextDate.setMonth(nextDate.getMonth() + 1);
          break;
        case 'quarterly':
          nextDate.setMonth(nextDate.getMonth() + 3);
          break;
        case 'annually':
          nextDate.setFullYear(nextDate.getFullYear() + 1);
          break;
      }
      
      // Update the PM schedule with new dates
      await db.update(pmSchedules)
        .set({
          lastServiceDate: schedule.nextServiceDate,
          nextServiceDate: nextDate,
          updatedAt: new Date()
        })
        .where(eq(pmSchedules.id, schedule.id));
    }
    
    return {
      processedCount: dueSchedules.length,
      createdJobs
    };
  }
  
  // Stub implementation for generateFleetMaintenanceSchedule
  async generateFleetMaintenanceSchedule(fleetAccountId: string): Promise<Array<{
    vehicleId: string;
    scheduledDate: Date;
    services: string[];
    estimatedCost: number;
    priority: 'low' | 'medium' | 'high' | 'critical';
  }>> {
    // This would use AI/ML or business logic to generate maintenance schedules
    // For now, return empty array as a placeholder
    return [];
  }
  
  // ==================== BULK OPERATIONS ====================
  
  // User Bulk Operations
  async bulkSuspendUsers(userIds: string[], performedBy: string): Promise<{ succeeded: string[]; failed: string[]; errorMessages: { [key: string]: string } }> {
    const succeeded: string[] = [];
    const failed: string[] = [];
    const errorMessages: { [key: string]: string } = {};
    
    for (const userId of userIds) {
      try {
        // Don't allow suspension of admin users unless there are other admins
        const user = await this.getUser(userId);
        if (!user) {
          failed.push(userId);
          errorMessages[userId] = 'User not found';
          continue;
        }
        
        if (user.role === 'admin') {
          const adminCount = await db.select({ count: sql`count(*)::int` })
            .from(users)
            .where(and(eq(users.role, 'admin'), eq(users.isActive, true)));
          
          if (adminCount[0].count <= 1) {
            failed.push(userId);
            errorMessages[userId] = 'Cannot suspend the last active admin';
            continue;
          }
        }
        
        await db.update(users)
          .set({ isActive: false, updatedAt: new Date() })
          .where(eq(users.id, userId));
        
        succeeded.push(userId);
        
        // Log the action
        console.log(`[Bulk Action] User ${userId} suspended by ${performedBy}`);
      } catch (error) {
        failed.push(userId);
        errorMessages[userId] = error instanceof Error ? error.message : 'Unknown error';
      }
    }
    
    return { succeeded, failed, errorMessages };
  }
  
  async bulkActivateUsers(userIds: string[], performedBy: string): Promise<{ succeeded: string[]; failed: string[]; errorMessages: { [key: string]: string } }> {
    const succeeded: string[] = [];
    const failed: string[] = [];
    const errorMessages: { [key: string]: string } = {};
    
    for (const userId of userIds) {
      try {
        const user = await this.getUser(userId);
        if (!user) {
          failed.push(userId);
          errorMessages[userId] = 'User not found';
          continue;
        }
        
        await db.update(users)
          .set({ isActive: true, updatedAt: new Date() })
          .where(eq(users.id, userId));
        
        succeeded.push(userId);
        
        // Log the action
        console.log(`[Bulk Action] User ${userId} activated by ${performedBy}`);
      } catch (error) {
        failed.push(userId);
        errorMessages[userId] = error instanceof Error ? error.message : 'Unknown error';
      }
    }
    
    return { succeeded, failed, errorMessages };
  }
  
  async bulkDeleteUsers(userIds: string[], performedBy: string): Promise<{ succeeded: string[]; failed: string[]; errorMessages: { [key: string]: string } }> {
    const succeeded: string[] = [];
    const failed: string[] = [];
    const errorMessages: { [key: string]: string } = {};
    
    for (const userId of userIds) {
      try {
        const user = await this.getUser(userId);
        if (!user) {
          failed.push(userId);
          errorMessages[userId] = 'User not found';
          continue;
        }
        
        // Prevent deletion of admin users
        if (user.role === 'admin') {
          failed.push(userId);
          errorMessages[userId] = 'Cannot delete admin users';
          continue;
        }
        
        // Soft delete by marking as inactive and adding deleted timestamp
        await db.update(users)
          .set({ 
            isActive: false, 
            updatedAt: new Date(),
            email: `deleted_${Date.now()}_${user.email}` // Prefix email to allow re-registration
          })
          .where(eq(users.id, userId));
        
        succeeded.push(userId);
        
        // Log the action
        console.log(`[Bulk Action] User ${userId} soft-deleted by ${performedBy}`);
      } catch (error) {
        failed.push(userId);
        errorMessages[userId] = error instanceof Error ? error.message : 'Unknown error';
      }
    }
    
    return { succeeded, failed, errorMessages };
  }
  
  async bulkEmailUsers(userIds: string[], subject: string, message: string, performedBy: string): Promise<{ succeeded: string[]; failed: string[]; errorMessages: { [key: string]: string } }> {
    const succeeded: string[] = [];
    const failed: string[] = [];
    const errorMessages: { [key: string]: string } = {};
    
    // Get email service
    const { emailService } = await import('./services/email-service');
    
    for (const userId of userIds) {
      try {
        const user = await this.getUser(userId);
        if (!user) {
          failed.push(userId);
          errorMessages[userId] = 'User not found';
          continue;
        }
        
        if (!user.email) {
          failed.push(userId);
          errorMessages[userId] = 'User has no email address';
          continue;
        }
        
        // Send custom email
        const emailSent = await emailService.sendCustomEmail(
          user.email,
          subject,
          message,
          {
            userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User',
            performedBy
          }
        );
        
        if (emailSent) {
          succeeded.push(userId);
        } else {
          failed.push(userId);
          errorMessages[userId] = 'Failed to send email';
        }
        
        // Log the action
        console.log(`[Bulk Action] Email sent to user ${userId} by ${performedBy}`);
      } catch (error) {
        failed.push(userId);
        errorMessages[userId] = error instanceof Error ? error.message : 'Unknown error';
      }
    }
    
    return { succeeded, failed, errorMessages };
  }
  
  // Contractor Bulk Operations
  async bulkApproveContractors(contractorIds: string[], performedBy: string): Promise<{ succeeded: string[]; failed: string[]; errorMessages: { [key: string]: string } }> {
    const succeeded: string[] = [];
    const failed: string[] = [];
    const errorMessages: { [key: string]: string } = {};
    
    for (const contractorId of contractorIds) {
      try {
        const contractor = await this.getContractorProfile(contractorId);
        if (!contractor) {
          failed.push(contractorId);
          errorMessages[contractorId] = 'Contractor not found';
          continue;
        }
        
        if (contractor.status === 'active') {
          failed.push(contractorId);
          errorMessages[contractorId] = 'Contractor is already active';
          continue;
        }
        
        await db.update(contractorProfiles)
          .set({ 
            status: 'active',
            isActive: true,
            approvedAt: new Date(),
            approvedBy: performedBy,
            updatedAt: new Date()
          })
          .where(eq(contractorProfiles.userId, contractorId));
        
        succeeded.push(contractorId);
        
        // Log the action
        console.log(`[Bulk Action] Contractor ${contractorId} approved by ${performedBy}`);
      } catch (error) {
        failed.push(contractorId);
        errorMessages[contractorId] = error instanceof Error ? error.message : 'Unknown error';
      }
    }
    
    return { succeeded, failed, errorMessages };
  }
  
  async bulkRejectContractors(contractorIds: string[], reason: string, performedBy: string): Promise<{ succeeded: string[]; failed: string[]; errorMessages: { [key: string]: string } }> {
    const succeeded: string[] = [];
    const failed: string[] = [];
    const errorMessages: { [key: string]: string } = {};
    
    for (const contractorId of contractorIds) {
      try {
        const contractor = await this.getContractorProfile(contractorId);
        if (!contractor) {
          failed.push(contractorId);
          errorMessages[contractorId] = 'Contractor not found';
          continue;
        }
        
        if (contractor.status === 'rejected') {
          failed.push(contractorId);
          errorMessages[contractorId] = 'Contractor is already rejected';
          continue;
        }
        
        await db.update(contractorProfiles)
          .set({ 
            status: 'rejected',
            isActive: false,
            rejectionReason: reason,
            updatedAt: new Date()
          })
          .where(eq(contractorProfiles.userId, contractorId));
        
        succeeded.push(contractorId);
        
        // Log the action
        console.log(`[Bulk Action] Contractor ${contractorId} rejected by ${performedBy}: ${reason}`);
      } catch (error) {
        failed.push(contractorId);
        errorMessages[contractorId] = error instanceof Error ? error.message : 'Unknown error';
      }
    }
    
    return { succeeded, failed, errorMessages };
  }
  
  async bulkSuspendContractors(contractorIds: string[], performedBy: string): Promise<{ succeeded: string[]; failed: string[]; errorMessages: { [key: string]: string } }> {
    const succeeded: string[] = [];
    const failed: string[] = [];
    const errorMessages: { [key: string]: string } = {};
    
    for (const contractorId of contractorIds) {
      try {
        const contractor = await this.getContractorProfile(contractorId);
        if (!contractor) {
          failed.push(contractorId);
          errorMessages[contractorId] = 'Contractor not found';
          continue;
        }
        
        if (contractor.status === 'suspended') {
          failed.push(contractorId);
          errorMessages[contractorId] = 'Contractor is already suspended';
          continue;
        }
        
        await db.update(contractorProfiles)
          .set({ 
            status: 'suspended',
            isActive: false,
            isAvailable: false,
            suspendedAt: new Date(),
            suspendedBy: performedBy,
            updatedAt: new Date()
          })
          .where(eq(contractorProfiles.userId, contractorId));
        
        succeeded.push(contractorId);
        
        // Log the action
        console.log(`[Bulk Action] Contractor ${contractorId} suspended by ${performedBy}`);
      } catch (error) {
        failed.push(contractorId);
        errorMessages[contractorId] = error instanceof Error ? error.message : 'Unknown error';
      }
    }
    
    return { succeeded, failed, errorMessages };
  }
  
  async bulkActivateContractors(contractorIds: string[], performedBy: string): Promise<{ succeeded: string[]; failed: string[]; errorMessages: { [key: string]: string } }> {
    const succeeded: string[] = [];
    const failed: string[] = [];
    const errorMessages: { [key: string]: string } = {};
    
    for (const contractorId of contractorIds) {
      try {
        const contractor = await this.getContractorProfile(contractorId);
        if (!contractor) {
          failed.push(contractorId);
          errorMessages[contractorId] = 'Contractor not found';
          continue;
        }
        
        if (contractor.status === 'active') {
          failed.push(contractorId);
          errorMessages[contractorId] = 'Contractor is already active';
          continue;
        }
        
        await db.update(contractorProfiles)
          .set({ 
            status: 'active',
            isActive: true,
            suspendedAt: null,
            suspendedBy: null,
            updatedAt: new Date()
          })
          .where(eq(contractorProfiles.userId, contractorId));
        
        succeeded.push(contractorId);
        
        // Log the action
        console.log(`[Bulk Action] Contractor ${contractorId} activated by ${performedBy}`);
      } catch (error) {
        failed.push(contractorId);
        errorMessages[contractorId] = error instanceof Error ? error.message : 'Unknown error';
      }
    }
    
    return { succeeded, failed, errorMessages };
  }
  
  async bulkEmailContractors(contractorIds: string[], subject: string, message: string, performedBy: string): Promise<{ succeeded: string[]; failed: string[]; errorMessages: { [key: string]: string } }> {
    const succeeded: string[] = [];
    const failed: string[] = [];
    const errorMessages: { [key: string]: string } = {};
    
    // Get email service
    const { emailService } = await import('./services/email-service');
    
    for (const contractorId of contractorIds) {
      try {
        const contractor = await this.getContractorProfile(contractorId);
        if (!contractor) {
          failed.push(contractorId);
          errorMessages[contractorId] = 'Contractor not found';
          continue;
        }
        
        const user = await this.getUser(contractorId);
        if (!user || !user.email) {
          failed.push(contractorId);
          errorMessages[contractorId] = 'Contractor has no email address';
          continue;
        }
        
        // Send custom email
        const emailSent = await emailService.sendCustomEmail(
          user.email,
          subject,
          message,
          {
            contractorName: `${contractor.firstName || ''} ${contractor.lastName || ''}`.trim() || 'Contractor',
            companyName: contractor.company || '',
            performedBy
          }
        );
        
        if (emailSent) {
          succeeded.push(contractorId);
        } else {
          failed.push(contractorId);
          errorMessages[contractorId] = 'Failed to send email';
        }
        
        // Log the action
        console.log(`[Bulk Action] Email sent to contractor ${contractorId} by ${performedBy}`);
      } catch (error) {
        failed.push(contractorId);
        errorMessages[contractorId] = error instanceof Error ? error.message : 'Unknown error';
      }
    }
    
    return { succeeded, failed, errorMessages };
  }
  
  // Helper methods
  async getUserEmails(userIds: string[]): Promise<{ userId: string; email: string; name: string }[]> {
    if (userIds.length === 0) return [];
    
    const result = await db.select({
      userId: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName
    })
    .from(users)
    .where(inArray(users.id, userIds));
    
    return result.map(r => ({
      userId: r.userId,
      email: r.email,
      name: `${r.firstName || ''} ${r.lastName || ''}`.trim() || 'User'
    }));
  }
  
  async getContractorEmails(contractorIds: string[]): Promise<{ contractorId: string; email: string; name: string }[]> {
    if (contractorIds.length === 0) return [];
    
    const result = await db.select({
      contractorId: contractorProfiles.userId,
      email: users.email,
      firstName: contractorProfiles.firstName,
      lastName: contractorProfiles.lastName,
      company: contractorProfiles.company
    })
    .from(contractorProfiles)
    .innerJoin(users, eq(contractorProfiles.userId, users.id))
    .where(inArray(contractorProfiles.userId, contractorIds));
    
    return result.map(r => ({
      contractorId: r.contractorId,
      email: r.email,
      name: `${r.firstName || ''} ${r.lastName || ''}`.trim() || r.company || 'Contractor'
    }));
  }

  // ==================== FLEET ANALYTICS API IMPLEMENTATION ====================
  
  async getFleetAnalyticsOverview(fleetAccountId: string): Promise<{
    totalVehicles: number;
    activeJobs: number;
    completedJobsThisMonth: number;
    totalSpentThisMonth: number;
    avgResponseTime: number;
    satisfactionRating: number;
  }> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Get total vehicles
    const vehiclesCount = await db.select({ count: sql<number>`count(*)` })
      .from(fleetVehicles)
      .where(
        and(
          eq(fleetVehicles.fleetAccountId, fleetAccountId),
          eq(fleetVehicles.isActive, true)
        )
      );
    
    // Get active jobs
    const activeJobsCount = await db.select({ count: sql<number>`count(*)` })
      .from(jobs)
      .where(
        and(
          eq(jobs.fleetAccountId, fleetAccountId),
          inArray(jobs.status, ['assigned', 'en_route', 'on_site'])
        )
      );
    
    // Get completed jobs this month
    const completedJobsCount = await db.select({ count: sql<number>`count(*)` })
      .from(jobs)
      .where(
        and(
          eq(jobs.fleetAccountId, fleetAccountId),
          eq(jobs.status, 'completed'),
          gte(jobs.completedAt, startOfMonth)
        )
      );
    
    // Get total spent this month
    const totalSpent = await db.select({ 
      total: sql<number>`COALESCE(SUM(${transactions.amount}), 0)` 
    })
      .from(transactions)
      .innerJoin(jobs, eq(transactions.jobId, jobs.id))
      .where(
        and(
          eq(jobs.fleetAccountId, fleetAccountId),
          eq(transactions.status, 'completed'),
          gte(transactions.createdAt, startOfMonth)
        )
      );
    
    // Get average response time (in minutes)
    const avgResponse = await db.select({ 
      avgTime: sql<number>`AVG(EXTRACT(EPOCH FROM (${jobs.assignedAt} - ${jobs.createdAt})) / 60)` 
    })
      .from(jobs)
      .where(
        and(
          eq(jobs.fleetAccountId, fleetAccountId),
          sql`${jobs.assignedAt} IS NOT NULL`
        )
      );
    
    // Get satisfaction rating
    const avgRating = await db.select({ 
      rating: sql<number>`COALESCE(AVG(${reviews.rating}), 0)` 
    })
      .from(reviews)
      .innerJoin(jobs, eq(reviews.jobId, jobs.id))
      .where(eq(jobs.fleetAccountId, fleetAccountId));
    
    return {
      totalVehicles: Number(vehiclesCount[0]?.count) || 0,
      activeJobs: Number(activeJobsCount[0]?.count) || 0,
      completedJobsThisMonth: Number(completedJobsCount[0]?.count) || 0,
      totalSpentThisMonth: Number(totalSpent[0]?.total) || 0,
      avgResponseTime: Math.round(Number(avgResponse[0]?.avgTime) || 0),
      satisfactionRating: Number(avgRating[0]?.rating) || 0
    };
  }
  
  async getFleetCostAnalytics(
    fleetAccountId: string,
    options: {
      startDate?: Date;
      endDate?: Date;
      groupBy?: 'day' | 'week' | 'month';
    }
  ): Promise<Array<{
    date: string;
    maintenanceCost: number;
    fuelCost: number;
    totalCost: number;
    serviceTypeBreakdown?: Record<string, number>;
  }>> {
    const startDate = options.startDate || new Date(new Date().setMonth(new Date().getMonth() - 6));
    const endDate = options.endDate || new Date();
    const groupBy = options.groupBy || 'month';
    
    let dateFormat: string;
    switch (groupBy) {
      case 'day':
        dateFormat = 'YYYY-MM-DD';
        break;
      case 'week':
        dateFormat = 'YYYY-IW';
        break;
      case 'month':
      default:
        dateFormat = 'YYYY-MM';
        break;
    }
    
    const costData = await db.select({
      date: sql<string>`TO_CHAR(${transactions.createdAt}, ${dateFormat})`,
      serviceType: serviceTypes.name,
      totalCost: sql<number>`SUM(${transactions.amount})`
    })
      .from(transactions)
      .innerJoin(jobs, eq(transactions.jobId, jobs.id))
      .leftJoin(serviceTypes, eq(jobs.serviceTypeId, serviceTypes.id))
      .where(
        and(
          eq(jobs.fleetAccountId, fleetAccountId),
          eq(transactions.status, 'completed'),
          gte(transactions.createdAt, startDate),
          sql`${transactions.createdAt} <= ${endDate}`
        )
      )
      .groupBy(sql`TO_CHAR(${transactions.createdAt}, ${dateFormat})`, serviceTypes.name)
      .orderBy(sql`TO_CHAR(${transactions.createdAt}, ${dateFormat})`);
    
    // Group data by date and aggregate service types
    const groupedData = new Map<string, any>();
    
    for (const row of costData) {
      if (!groupedData.has(row.date)) {
        groupedData.set(row.date, {
          date: row.date,
          maintenanceCost: 0,
          fuelCost: 0,
          totalCost: 0,
          serviceTypeBreakdown: {}
        });
      }
      
      const data = groupedData.get(row.date);
      const cost = Number(row.totalCost);
      
      // Categorize costs
      if (row.serviceType?.toLowerCase().includes('fuel')) {
        data.fuelCost += cost;
      } else {
        data.maintenanceCost += cost;
      }
      
      data.totalCost += cost;
      
      if (row.serviceType) {
        data.serviceTypeBreakdown[row.serviceType] = 
          (data.serviceTypeBreakdown[row.serviceType] || 0) + cost;
      }
    }
    
    return Array.from(groupedData.values());
  }
  
  async getFleetVehicleAnalytics(fleetAccountId: string): Promise<Array<{
    vehicleId: string;
    unitNumber: string;
    make: string;
    model: string;
    year: number;
    healthScore: number;
    maintenanceHistory: Array<{
      date: Date;
      service: string;
      cost: number;
    }>;
    totalCost: number;
    upcomingPM: Array<{
      date: Date;
      service: string;
      estimatedCost: number;
    }>;
    breakdownFrequency: number;
  }>> {
    // Get fleet vehicles
    const vehicles = await db.select()
      .from(fleetVehicles)
      .where(
        and(
          eq(fleetVehicles.fleetAccountId, fleetAccountId),
          eq(fleetVehicles.isActive, true)
        )
      );
    
    const results = [];
    
    for (const vehicle of vehicles) {
      // Get maintenance history
      const history = await db.select({
        date: jobs.completedAt,
        service: serviceTypes.name,
        cost: transactions.amount
      })
        .from(jobs)
        .innerJoin(transactions, eq(jobs.id, transactions.jobId))
        .leftJoin(serviceTypes, eq(jobs.serviceTypeId, serviceTypes.id))
        .where(
          and(
            eq(jobs.vehicleId, vehicle.id),
            eq(jobs.status, 'completed'),
            eq(transactions.status, 'completed')
          )
        )
        .orderBy(desc(jobs.completedAt))
        .limit(10);
      
      // Get upcoming PM schedules
      const upcomingPM = await db.select({
        date: pmSchedules.nextServiceDate,
        service: pmSchedules.serviceType,
        estimatedCost: pmSchedules.estimatedCost
      })
        .from(pmSchedules)
        .where(
          and(
            eq(pmSchedules.vehicleId, vehicle.id),
            eq(pmSchedules.isActive, true)
          )
        )
        .orderBy(asc(pmSchedules.nextServiceDate))
        .limit(5);
      
      // Calculate total cost
      const totalCostResult = await db.select({
        total: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`
      })
        .from(transactions)
        .innerJoin(jobs, eq(transactions.jobId, jobs.id))
        .where(
          and(
            eq(jobs.vehicleId, vehicle.id),
            eq(transactions.status, 'completed')
          )
        );
      
      // Get breakdown frequency (count of emergency jobs)
      const breakdownCount = await db.select({
        count: sql<number>`count(*)`
      })
        .from(jobs)
        .where(
          and(
            eq(jobs.vehicleId, vehicle.id),
            eq(jobs.jobType, 'emergency')
          )
        );
      
      // Get health score from vehicle analytics if available
      const vehicleAnalyticsData = await db.select()
        .from(vehicleAnalytics)
        .where(eq(vehicleAnalytics.vehicleId, vehicle.id))
        .limit(1);
      
      const healthScore = vehicleAnalyticsData[0]?.healthScore || 
        Math.max(0, 100 - (Number(breakdownCount[0]?.count) || 0) * 10);
      
      results.push({
        vehicleId: vehicle.id,
        unitNumber: vehicle.unitNumber,
        make: vehicle.make || 'Unknown',
        model: vehicle.model || 'Unknown',
        year: vehicle.year || 0,
        healthScore,
        maintenanceHistory: history.map(h => ({
          date: h.date || new Date(),
          service: h.service || 'Service',
          cost: Number(h.cost) || 0
        })),
        totalCost: Number(totalCostResult[0]?.total) || 0,
        upcomingPM: upcomingPM.map(pm => ({
          date: pm.date,
          service: pm.service,
          estimatedCost: Number(pm.estimatedCost) || 0
        })),
        breakdownFrequency: Number(breakdownCount[0]?.count) || 0
      });
    }
    
    return results;
  }
  
  async getFleetServiceAnalytics(
    fleetAccountId: string,
    options?: { 
      startDate?: Date; 
      endDate?: Date; 
    }
  ): Promise<Array<{
    serviceType: string;
    serviceTypeId: string;
    jobCount: number;
    totalCost: number;
    avgCost: number;
    percentOfTotal: number;
    trend: 'up' | 'down' | 'stable';
  }>> {
    const startDate = options?.startDate || new Date(new Date().setMonth(new Date().getMonth() - 3));
    const endDate = options?.endDate || new Date();
    
    // Get service analytics
    const serviceData = await db.select({
      serviceTypeId: serviceTypes.id,
      serviceType: serviceTypes.name,
      jobCount: sql<number>`count(distinct ${jobs.id})`,
      totalCost: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`,
      avgCost: sql<number>`COALESCE(AVG(${transactions.amount}), 0)`
    })
      .from(jobs)
      .innerJoin(serviceTypes, eq(jobs.serviceTypeId, serviceTypes.id))
      .leftJoin(transactions, and(
        eq(jobs.id, transactions.jobId),
        eq(transactions.status, 'completed')
      ))
      .where(
        and(
          eq(jobs.fleetAccountId, fleetAccountId),
          gte(jobs.createdAt, startDate),
          sql`${jobs.createdAt} <= ${endDate}`
        )
      )
      .groupBy(serviceTypes.id, serviceTypes.name)
      .orderBy(desc(sql`count(distinct ${jobs.id})`));
    
    // Calculate total for percentage
    const total = serviceData.reduce((sum, item) => sum + Number(item.totalCost), 0);
    
    // Calculate trends (simplified - comparing to previous period)
    const results = await Promise.all(serviceData.map(async (service) => {
      // Get previous period count
      const previousPeriodStart = new Date(startDate);
      previousPeriodStart.setMonth(previousPeriodStart.getMonth() - 3);
      
      const previousCount = await db.select({
        count: sql<number>`count(*)`
      })
        .from(jobs)
        .where(
          and(
            eq(jobs.fleetAccountId, fleetAccountId),
            eq(jobs.serviceTypeId, service.serviceTypeId),
            gte(jobs.createdAt, previousPeriodStart),
            sql`${jobs.createdAt} < ${startDate}`
          )
        );
      
      const prevCount = Number(previousCount[0]?.count) || 0;
      const currCount = Number(service.jobCount);
      
      let trend: 'up' | 'down' | 'stable';
      if (currCount > prevCount * 1.1) trend = 'up';
      else if (currCount < prevCount * 0.9) trend = 'down';
      else trend = 'stable';
      
      return {
        serviceType: service.serviceType || 'Unknown',
        serviceTypeId: service.serviceTypeId,
        jobCount: Number(service.jobCount),
        totalCost: Number(service.totalCost),
        avgCost: Number(service.avgCost),
        percentOfTotal: total > 0 ? (Number(service.totalCost) / total) * 100 : 0,
        trend
      };
    }));
    
    return results;
  }
  
  async getFleetContractorAnalytics(
    fleetAccountId: string,
    options?: { 
      startDate?: Date; 
      endDate?: Date; 
    }
  ): Promise<Array<{
    contractorId: string;
    contractorName: string;
    jobCount: number;
    avgRating: number;
    avgResponseTime: number;
    avgCost: number;
    totalCost: number;
    completionRate: number;
    onTimeRate: number;
  }>> {
    const startDate = options?.startDate || new Date(new Date().setMonth(new Date().getMonth() - 3));
    const endDate = options?.endDate || new Date();
    
    // Get contractor performance data
    const contractorData = await db.select({
      contractorId: jobs.contractorId,
      contractorName: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
      jobCount: sql<number>`count(distinct ${jobs.id})`,
      totalCost: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`,
      avgCost: sql<number>`COALESCE(AVG(${transactions.amount}), 0)`,
      completedCount: sql<number>`count(distinct case when ${jobs.status} = 'completed' then ${jobs.id} end)`,
      avgResponseTime: sql<number>`AVG(EXTRACT(EPOCH FROM (${jobs.assignedAt} - ${jobs.createdAt})) / 60)`,
      avgRating: sql<number>`AVG(${reviews.rating})`
    })
      .from(jobs)
      .innerJoin(contractorProfiles, eq(jobs.contractorId, contractorProfiles.id))
      .innerJoin(users, eq(contractorProfiles.userId, users.id))
      .leftJoin(transactions, and(
        eq(jobs.id, transactions.jobId),
        eq(transactions.status, 'completed')
      ))
      .leftJoin(reviews, eq(jobs.id, reviews.jobId))
      .where(
        and(
          eq(jobs.fleetAccountId, fleetAccountId),
          gte(jobs.createdAt, startDate),
          sql`${jobs.createdAt} <= ${endDate}`,
          sql`${jobs.contractorId} IS NOT NULL`
        )
      )
      .groupBy(jobs.contractorId, users.firstName, users.lastName)
      .orderBy(desc(sql`count(distinct ${jobs.id})`));
    
    // Calculate on-time rate
    const results = await Promise.all(contractorData.map(async (contractor) => {
      // Get on-time completion rate
      const onTimeJobs = await db.select({
        count: sql<number>`count(*)`
      })
        .from(jobs)
        .where(
          and(
            eq(jobs.contractorId, contractor.contractorId),
            eq(jobs.fleetAccountId, fleetAccountId),
            eq(jobs.status, 'completed'),
            sql`${jobs.completedAt} <= ${jobs.estimatedCompletionTime}`,
            gte(jobs.createdAt, startDate),
            sql`${jobs.createdAt} <= ${endDate}`
          )
        );
      
      const jobCount = Number(contractor.jobCount);
      const completedCount = Number(contractor.completedCount);
      const onTimeCount = Number(onTimeJobs[0]?.count) || 0;
      
      return {
        contractorId: contractor.contractorId || '',
        contractorName: contractor.contractorName || 'Unknown',
        jobCount,
        avgRating: Number(contractor.avgRating) || 0,
        avgResponseTime: Math.round(Number(contractor.avgResponseTime) || 0),
        avgCost: Number(contractor.avgCost) || 0,
        totalCost: Number(contractor.totalCost) || 0,
        completionRate: jobCount > 0 ? (completedCount / jobCount) * 100 : 0,
        onTimeRate: completedCount > 0 ? (onTimeCount / completedCount) * 100 : 0
      };
    }));
    
    return results;
  }

  // ==================== DATA EXPORT OPERATIONS ====================
  
  async getFleetVehiclesForExport(fleetId: string, filters?: {
    isActive?: boolean;
    vehicleType?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<any[]> {
    let query = db
      .select({
        id: fleetVehicles.id,
        unitNumber: fleetVehicles.unitNumber,
        vin: fleetVehicles.vin,
        year: fleetVehicles.year,
        make: fleetVehicles.make,
        model: fleetVehicles.model,
        vehicleType: fleetVehicles.vehicleType,
        licensePlate: fleetVehicles.licensePlate,
        currentOdometer: fleetVehicles.currentOdometer,
        lastServiceDate: fleetVehicles.lastServiceDate,
        nextServiceDue: fleetVehicles.nextServiceDue,
        isActive: fleetVehicles.isActive,
        notes: fleetVehicles.notes,
        createdAt: fleetVehicles.createdAt,
        updatedAt: fleetVehicles.updatedAt
      })
      .from(fleetVehicles)
      .where(eq(fleetVehicles.fleetAccountId, fleetId));

    const conditions: any[] = [eq(fleetVehicles.fleetAccountId, fleetId)];
    
    if (filters?.isActive !== undefined) {
      conditions.push(eq(fleetVehicles.isActive, filters.isActive));
    }
    if (filters?.vehicleType) {
      conditions.push(eq(fleetVehicles.vehicleType, filters.vehicleType));
    }
    if (filters?.dateFrom) {
      conditions.push(gte(fleetVehicles.createdAt, filters.dateFrom));
    }
    if (filters?.dateTo) {
      conditions.push(lte(fleetVehicles.createdAt, filters.dateTo));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query.orderBy(asc(fleetVehicles.unitNumber));
  }

  async getFleetJobsForExport(fleetId: string, filters?: {
    status?: string;
    dateFrom?: Date;
    dateTo?: Date;
    vehicleId?: string;
    contractorId?: string;
  }): Promise<any[]> {
    let query = db
      .select({
        id: jobs.id,
        jobNumber: jobs.jobNumber,
        createdAt: jobs.createdAt,
        serviceType: serviceTypes.name,
        vehicleId: jobs.vehicleId,
        vehicleUnit: fleetVehicles.unitNumber,
        description: jobs.description,
        status: jobs.status,
        estimatedCost: jobs.estimatedCost,
        actualCost: transactions.amount,
        contractorName: sql<string>`COALESCE(CONCAT(${users.firstName}, ' ', ${users.lastName}), 'Unassigned')`,
        completedAt: jobs.completedAt,
        customerName: jobs.customerName,
        location: jobs.location,
        notes: jobs.notes
      })
      .from(jobs)
      .leftJoin(serviceTypes, eq(jobs.serviceTypeId, serviceTypes.id))
      .leftJoin(fleetVehicles, eq(jobs.vehicleId, fleetVehicles.id))
      .leftJoin(contractorProfiles, eq(jobs.contractorId, contractorProfiles.id))
      .leftJoin(users, eq(contractorProfiles.userId, users.id))
      .leftJoin(transactions, and(
        eq(jobs.id, transactions.jobId),
        eq(transactions.status, 'completed')
      ));

    const conditions: any[] = [eq(jobs.fleetAccountId, fleetId)];
    
    if (filters?.status) {
      conditions.push(eq(jobs.status, filters.status));
    }
    if (filters?.dateFrom) {
      conditions.push(gte(jobs.createdAt, filters.dateFrom));
    }
    if (filters?.dateTo) {
      conditions.push(lte(jobs.createdAt, filters.dateTo));
    }
    if (filters?.vehicleId) {
      conditions.push(eq(jobs.vehicleId, filters.vehicleId));
    }
    if (filters?.contractorId) {
      conditions.push(eq(jobs.contractorId, filters.contractorId));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query.orderBy(desc(jobs.createdAt));
  }

  async getUsersForExport(filters?: {
    role?: string;
    status?: string;
    search?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<any[]> {
    let query = db
      .select({
        id: users.id,
        email: users.email,
        phone: users.phone,
        firstName: users.firstName,
        lastName: users.lastName,
        name: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
        role: users.role,
        isActive: users.isActive,
        emailVerified: users.emailVerified,
        phoneVerified: users.phoneVerified,
        createdAt: users.createdAt,
        lastLogin: users.lastLogin,
        notificationsEnabled: users.notificationsEnabled
      })
      .from(users);

    const conditions: any[] = [];
    
    if (filters?.role) {
      conditions.push(eq(users.role, filters.role));
    }
    if (filters?.status === 'active') {
      conditions.push(eq(users.isActive, true));
    } else if (filters?.status === 'inactive') {
      conditions.push(eq(users.isActive, false));
    }
    if (filters?.search) {
      conditions.push(
        or(
          ilike(users.email, `%${filters.search}%`),
          ilike(users.firstName, `%${filters.search}%`),
          ilike(users.lastName, `%${filters.search}%`),
          ilike(users.phone, `%${filters.search}%`)
        )
      );
    }
    if (filters?.dateFrom) {
      conditions.push(gte(users.createdAt, filters.dateFrom));
    }
    if (filters?.dateTo) {
      conditions.push(lte(users.createdAt, filters.dateTo));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query.orderBy(desc(users.createdAt));
  }

  async getContractorsForExport(filters?: {
    status?: string;
    tier?: string;
    search?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<any[]> {
    let query = db
      .select({
        id: contractorProfiles.id,
        userId: contractorProfiles.userId,
        businessName: contractorProfiles.businessName,
        email: users.email,
        phone: users.phone,
        status: contractorProfiles.status,
        performanceTier: contractorProfiles.performanceTier,
        averageRating: contractorProfiles.averageRating,
        totalJobsCompleted: contractorProfiles.totalJobsCompleted,
        totalEarnings: contractorProfiles.totalEarnings,
        serviceRadius: contractorProfiles.serviceRadius,
        baseLocationLat: contractorProfiles.baseLocationLat,
        baseLocationLon: contractorProfiles.baseLocationLon,
        isAvailable: contractorProfiles.isAvailable,
        isOnline: contractorProfiles.isOnline,
        createdAt: contractorProfiles.createdAt,
        verifiedAt: contractorProfiles.verifiedAt,
        licenseNumber: contractorProfiles.licenseNumber,
        insuranceProvider: contractorProfiles.insuranceProvider,
        insurancePolicyNumber: contractorProfiles.insurancePolicyNumber,
        insuranceExpiry: contractorProfiles.insuranceExpiry
      })
      .from(contractorProfiles)
      .innerJoin(users, eq(contractorProfiles.userId, users.id));

    const conditions: any[] = [];
    
    if (filters?.status) {
      conditions.push(eq(contractorProfiles.status, filters.status));
    }
    if (filters?.tier) {
      conditions.push(eq(contractorProfiles.performanceTier, filters.tier));
    }
    if (filters?.search) {
      conditions.push(
        or(
          ilike(contractorProfiles.businessName, `%${filters.search}%`),
          ilike(users.email, `%${filters.search}%`),
          ilike(users.phone, `%${filters.search}%`)
        )
      );
    }
    if (filters?.dateFrom) {
      conditions.push(gte(contractorProfiles.createdAt, filters.dateFrom));
    }
    if (filters?.dateTo) {
      conditions.push(lte(contractorProfiles.createdAt, filters.dateTo));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query.orderBy(desc(contractorProfiles.createdAt));
  }

  async getBillingDataForExport(filters?: {
    fleetAccountId?: string;
    status?: string;
    type?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<any[]> {
    let query = db
      .select({
        id: transactions.id,
        createdAt: transactions.createdAt,
        type: transactions.type,
        fleetAccountName: fleetAccounts.name,
        fleetAccountId: transactions.fleetAccountId,
        jobId: transactions.jobId,
        jobNumber: jobs.jobNumber,
        description: transactions.description,
        amount: transactions.amount,
        status: transactions.status,
        paymentMethod: transactions.paymentMethod,
        invoiceId: transactions.invoiceId,
        invoiceNumber: invoices.invoiceNumber,
        stripePaymentIntentId: transactions.stripePaymentIntentId,
        failureReason: transactions.failureReason,
        metadata: transactions.metadata
      })
      .from(transactions)
      .leftJoin(fleetAccounts, eq(transactions.fleetAccountId, fleetAccounts.id))
      .leftJoin(jobs, eq(transactions.jobId, jobs.id))
      .leftJoin(invoices, eq(transactions.invoiceId, invoices.id));

    const conditions: any[] = [];
    
    if (filters?.fleetAccountId) {
      conditions.push(eq(transactions.fleetAccountId, filters.fleetAccountId));
    }
    if (filters?.status) {
      conditions.push(eq(transactions.status, filters.status));
    }
    if (filters?.type) {
      conditions.push(eq(transactions.type, filters.type));
    }
    if (filters?.dateFrom) {
      conditions.push(gte(transactions.createdAt, filters.dateFrom));
    }
    if (filters?.dateTo) {
      conditions.push(lte(transactions.createdAt, filters.dateTo));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query.orderBy(desc(transactions.createdAt));
  }

  async getFleetAnalyticsForExport(fleetId: string, filters?: {
    metric?: string;
    dateFrom?: Date;
    dateTo?: Date;
    groupBy?: 'day' | 'week' | 'month';
  }): Promise<any[]> {
    const startDate = filters?.dateFrom || new Date(new Date().setMonth(new Date().getMonth() - 3));
    const endDate = filters?.dateTo || new Date();
    const groupBy = filters?.groupBy || 'month';

    // Get job and cost metrics
    const query = db
      .select({
        date: sql<Date>`DATE_TRUNC('${groupBy}', ${jobs.createdAt})`,
        totalJobs: sql<number>`COUNT(DISTINCT ${jobs.id})`,
        completedJobs: sql<number>`COUNT(DISTINCT CASE WHEN ${jobs.status} = 'completed' THEN ${jobs.id} END)`,
        maintenanceJobs: sql<number>`COUNT(DISTINCT CASE WHEN ${jobs.jobType} = 'maintenance' THEN ${jobs.id} END)`,
        emergencyJobs: sql<number>`COUNT(DISTINCT CASE WHEN ${jobs.jobType} = 'emergency' THEN ${jobs.id} END)`,
        totalCost: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`,
        maintenanceCost: sql<number>`COALESCE(SUM(CASE WHEN ${jobs.jobType} = 'maintenance' THEN ${transactions.amount} END), 0)`,
        emergencyCost: sql<number>`COALESCE(SUM(CASE WHEN ${jobs.jobType} = 'emergency' THEN ${transactions.amount} END), 0)`,
        avgCostPerJob: sql<number>`COALESCE(AVG(${transactions.amount}), 0)`,
        avgCompletionTime: sql<number>`AVG(EXTRACT(EPOCH FROM (${jobs.completedAt} - ${jobs.createdAt})) / 3600)`
      })
      .from(jobs)
      .leftJoin(transactions, and(
        eq(jobs.id, transactions.jobId),
        eq(transactions.status, 'completed')
      ))
      .where(
        and(
          eq(jobs.fleetAccountId, fleetId),
          gte(jobs.createdAt, startDate),
          lte(jobs.createdAt, endDate)
        )
      )
      .groupBy(sql`DATE_TRUNC('${groupBy}', ${jobs.createdAt})`)
      .orderBy(sql`DATE_TRUNC('${groupBy}', ${jobs.createdAt})`);

    return await query;
  }

  // ==================== REPORT GENERATION ====================

  async getFleetMaintenanceReport(fleetId: string, dateFrom: Date, dateTo: Date): Promise<{
    summary: {
      totalVehicles: number;
      totalMaintenanceJobs: number;
      totalCost: number;
      averageCostPerVehicle: number;
      mostFrequentIssues: Array<{ issue: string; count: number; cost: number }>;
    };
    details: any[];
  }> {
    // Get maintenance jobs
    const maintenanceJobs = await db
      .select({
        id: jobs.id,
        jobNumber: jobs.jobNumber,
        vehicleId: jobs.vehicleId,
        vehicleUnit: fleetVehicles.unitNumber,
        serviceType: serviceTypes.name,
        description: jobs.description,
        createdAt: jobs.createdAt,
        completedAt: jobs.completedAt,
        status: jobs.status,
        cost: transactions.amount,
        contractorName: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`
      })
      .from(jobs)
      .leftJoin(fleetVehicles, eq(jobs.vehicleId, fleetVehicles.id))
      .leftJoin(serviceTypes, eq(jobs.serviceTypeId, serviceTypes.id))
      .leftJoin(contractorProfiles, eq(jobs.contractorId, contractorProfiles.id))
      .leftJoin(users, eq(contractorProfiles.userId, users.id))
      .leftJoin(transactions, and(
        eq(jobs.id, transactions.jobId),
        eq(transactions.status, 'completed')
      ))
      .where(
        and(
          eq(jobs.fleetAccountId, fleetId),
          eq(jobs.jobType, 'maintenance'),
          gte(jobs.createdAt, dateFrom),
          lte(jobs.createdAt, dateTo)
        )
      )
      .orderBy(desc(jobs.createdAt));

    // Get vehicle count
    const vehicleCount = await db
      .select({ count: sql<number>`COUNT(DISTINCT ${fleetVehicles.id})` })
      .from(fleetVehicles)
      .where(eq(fleetVehicles.fleetAccountId, fleetId));

    // Get issue frequency
    const issueFrequency = await db
      .select({
        serviceType: serviceTypes.name,
        count: sql<number>`COUNT(${jobs.id})`,
        totalCost: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`
      })
      .from(jobs)
      .leftJoin(serviceTypes, eq(jobs.serviceTypeId, serviceTypes.id))
      .leftJoin(transactions, and(
        eq(jobs.id, transactions.jobId),
        eq(transactions.status, 'completed')
      ))
      .where(
        and(
          eq(jobs.fleetAccountId, fleetId),
          eq(jobs.jobType, 'maintenance'),
          gte(jobs.createdAt, dateFrom),
          lte(jobs.createdAt, dateTo)
        )
      )
      .groupBy(serviceTypes.name)
      .orderBy(desc(sql`COUNT(${jobs.id})`))
      .limit(5);

    const totalCost = maintenanceJobs.reduce((sum, job) => sum + (job.cost || 0), 0);
    const totalVehicles = vehicleCount[0]?.count || 0;

    return {
      summary: {
        totalVehicles,
        totalMaintenanceJobs: maintenanceJobs.length,
        totalCost,
        averageCostPerVehicle: totalVehicles > 0 ? totalCost / totalVehicles : 0,
        mostFrequentIssues: issueFrequency.map(item => ({
          issue: item.serviceType || 'Unknown',
          count: Number(item.count),
          cost: Number(item.totalCost)
        }))
      },
      details: maintenanceJobs
    };
  }

  async getFleetCostSummaryReport(fleetId: string, dateFrom: Date, dateTo: Date): Promise<{
    summary: {
      totalCost: number;
      maintenanceCost: number;
      emergencyRepairCost: number;
      scheduledServiceCost: number;
      costByMonth: Array<{ month: string; cost: number }>;
      costByVehicle: Array<{ vehicle: string; cost: number }>;
    };
    details: any[];
  }> {
    // Get costs by job type
    const costsByType = await db
      .select({
        jobType: jobs.jobType,
        totalCost: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`
      })
      .from(jobs)
      .leftJoin(transactions, and(
        eq(jobs.id, transactions.jobId),
        eq(transactions.status, 'completed')
      ))
      .where(
        and(
          eq(jobs.fleetAccountId, fleetId),
          gte(jobs.createdAt, dateFrom),
          lte(jobs.createdAt, dateTo)
        )
      )
      .groupBy(jobs.jobType);

    // Get costs by month
    const costsByMonth = await db
      .select({
        month: sql<string>`TO_CHAR(DATE_TRUNC('month', ${jobs.createdAt}), 'YYYY-MM')`,
        totalCost: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`
      })
      .from(jobs)
      .leftJoin(transactions, and(
        eq(jobs.id, transactions.jobId),
        eq(transactions.status, 'completed')
      ))
      .where(
        and(
          eq(jobs.fleetAccountId, fleetId),
          gte(jobs.createdAt, dateFrom),
          lte(jobs.createdAt, dateTo)
        )
      )
      .groupBy(sql`DATE_TRUNC('month', ${jobs.createdAt})`)
      .orderBy(sql`DATE_TRUNC('month', ${jobs.createdAt})`);

    // Get costs by vehicle
    const costsByVehicle = await db
      .select({
        vehicleUnit: fleetVehicles.unitNumber,
        totalCost: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`
      })
      .from(jobs)
      .leftJoin(fleetVehicles, eq(jobs.vehicleId, fleetVehicles.id))
      .leftJoin(transactions, and(
        eq(jobs.id, transactions.jobId),
        eq(transactions.status, 'completed')
      ))
      .where(
        and(
          eq(jobs.fleetAccountId, fleetId),
          gte(jobs.createdAt, dateFrom),
          lte(jobs.createdAt, dateTo)
        )
      )
      .groupBy(fleetVehicles.unitNumber)
      .orderBy(desc(sql`COALESCE(SUM(${transactions.amount}), 0)`))
      .limit(10);

    // Get detailed transactions
    const details = await db
      .select({
        date: jobs.createdAt,
        jobNumber: jobs.jobNumber,
        jobType: jobs.jobType,
        vehicleUnit: fleetVehicles.unitNumber,
        serviceType: serviceTypes.name,
        description: jobs.description,
        amount: transactions.amount,
        status: transactions.status
      })
      .from(jobs)
      .leftJoin(fleetVehicles, eq(jobs.vehicleId, fleetVehicles.id))
      .leftJoin(serviceTypes, eq(jobs.serviceTypeId, serviceTypes.id))
      .leftJoin(transactions, and(
        eq(jobs.id, transactions.jobId),
        eq(transactions.status, 'completed')
      ))
      .where(
        and(
          eq(jobs.fleetAccountId, fleetId),
          gte(jobs.createdAt, dateFrom),
          lte(jobs.createdAt, dateTo)
        )
      )
      .orderBy(desc(jobs.createdAt));

    const costByType = costsByType.reduce((acc, item) => {
      acc[item.jobType || 'other'] = Number(item.totalCost);
      return acc;
    }, {} as Record<string, number>);

    return {
      summary: {
        totalCost: Object.values(costByType).reduce((sum, cost) => sum + cost, 0),
        maintenanceCost: costByType['maintenance'] || 0,
        emergencyRepairCost: costByType['emergency'] || 0,
        scheduledServiceCost: costByType['scheduled'] || 0,
        costByMonth: costsByMonth.map(item => ({
          month: item.month,
          cost: Number(item.totalCost)
        })),
        costByVehicle: costsByVehicle.map(item => ({
          vehicle: item.vehicleUnit || 'Unknown',
          cost: Number(item.totalCost)
        }))
      },
      details
    };
  }

  // ==================== NOTIFICATION OPERATIONS ====================
  
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const result = await db.insert(notifications).values(notification).returning();
    return result[0];
  }
  
  async getUserNotifications(userId: string, options?: {
    type?: string;
    isRead?: boolean;
    priority?: string;
    limit?: number;
    offset?: number;
    fromDate?: Date;
    toDate?: Date;
  }): Promise<{ notifications: Notification[]; total: number }> {
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;
    
    // Build conditions
    const conditions = [
      eq(notifications.userId, userId),
      isNull(notifications.deletedAt)
    ];
    
    if (options?.type) {
      conditions.push(eq(notifications.type, options.type as any));
    }
    
    if (options?.isRead !== undefined) {
      conditions.push(eq(notifications.isRead, options.isRead));
    }
    
    if (options?.priority) {
      conditions.push(eq(notifications.priority, options.priority as any));
    }
    
    if (options?.fromDate) {
      conditions.push(gte(notifications.createdAt, options.fromDate));
    }
    
    if (options?.toDate) {
      conditions.push(lte(notifications.createdAt, options.toDate));
    }
    
    // Get notifications
    const result = await db
      .select()
      .from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);
    
    // Get total count
    const countResult = await db
      .select({ count: sql<number>`COUNT(*)::integer` })
      .from(notifications)
      .where(and(...conditions));
    
    return {
      notifications: result,
      total: countResult[0]?.count || 0
    };
  }
  
  async getNotification(notificationId: string, userId: string): Promise<Notification | null> {
    const result = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId),
          isNull(notifications.deletedAt)
        )
      )
      .limit(1);
    
    return result[0] || null;
  }
  
  async markNotificationAsRead(notificationId: string, userId: string): Promise<boolean> {
    const result = await db
      .update(notifications)
      .set({
        isRead: true,
        readAt: new Date()
      })
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        )
      )
      .returning();
    
    return result.length > 0;
  }
  
  async markAllNotificationsAsRead(userId: string): Promise<number> {
    const result = await db
      .update(notifications)
      .set({
        isRead: true,
        readAt: new Date()
      })
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false),
          isNull(notifications.deletedAt)
        )
      )
      .returning();
    
    return result.length;
  }
  
  async deleteNotification(notificationId: string, userId: string): Promise<boolean> {
    const result = await db
      .update(notifications)
      .set({
        deletedAt: new Date()
      })
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId),
          isNull(notifications.deletedAt)
        )
      )
      .returning();
    
    return result.length > 0;
  }
  
  async clearAllNotifications(userId: string): Promise<number> {
    const result = await db
      .update(notifications)
      .set({
        deletedAt: new Date()
      })
      .where(
        and(
          eq(notifications.userId, userId),
          isNull(notifications.deletedAt)
        )
      )
      .returning();
    
    return result.length;
  }
  
  async getUnreadNotificationCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`COUNT(*)::integer` })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false),
          isNull(notifications.deletedAt)
        )
      );
    
    return result[0]?.count || 0;
  }
  
  async createBatchNotifications(notificationList: InsertNotification[]): Promise<Notification[]> {
    if (notificationList.length === 0) return [];
    
    const result = await db.insert(notifications).values(notificationList).returning();
    return result;
  }
  
  async getNotificationsByEntity(entityType: string, entityId: string): Promise<Notification[]> {
    const result = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.relatedEntityType, entityType),
          eq(notifications.relatedEntityId, entityId),
          isNull(notifications.deletedAt)
        )
      )
      .orderBy(desc(notifications.createdAt));
    
    return result;
  }

  async getAdminRevenueReport(dateFrom: Date, dateTo: Date): Promise<{
    summary: {
      totalRevenue: number;
      subscriptionRevenue: number;
      transactionRevenue: number;
      refunds: number;
      netRevenue: number;
      revenueByFleet: Array<{ fleetName: string; revenue: number }>;
      revenueByMonth: Array<{ month: string; revenue: number }>;
    };
    details: any[];
  }> {
    // Get all revenue transactions
    const revenueTransactions = await db
      .select({
        id: transactions.id,
        createdAt: transactions.createdAt,
        type: transactions.type,
        fleetAccountId: transactions.fleetAccountId,
        fleetName: fleetAccounts.name,
        amount: transactions.amount,
        status: transactions.status,
        description: transactions.description
      })
      .from(transactions)
      .leftJoin(fleetAccounts, eq(transactions.fleetAccountId, fleetAccounts.id))
      .where(
        and(
          eq(transactions.status, 'completed'),
          gte(transactions.createdAt, dateFrom),
          lte(transactions.createdAt, dateTo)
        )
      )
      .orderBy(desc(transactions.createdAt));

    // Get subscription revenue
    const subscriptionRevenue = await db
      .select({
        totalRevenue: sql<number>`COALESCE(SUM(${billingHistory.amount}), 0)`
      })
      .from(billingHistory)
      .where(
        and(
          eq(billingHistory.status, 'paid'),
          gte(billingHistory.createdAt, dateFrom),
          lte(billingHistory.createdAt, dateTo)
        )
      );

    // Get refunds
    const refundAmount = await db
      .select({
        totalRefunds: sql<number>`COALESCE(SUM(${refunds.amount}), 0)`
      })
      .from(refunds)
      .where(
        and(
          eq(refunds.status, 'completed'),
          gte(refunds.createdAt, dateFrom),
          lte(refunds.createdAt, dateTo)
        )
      );

    // Get revenue by fleet
    const revenueByFleet = await db
      .select({
        fleetName: fleetAccounts.name,
        totalRevenue: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`
      })
      .from(transactions)
      .leftJoin(fleetAccounts, eq(transactions.fleetAccountId, fleetAccounts.id))
      .where(
        and(
          eq(transactions.status, 'completed'),
          gte(transactions.createdAt, dateFrom),
          lte(transactions.createdAt, dateTo)
        )
      )
      .groupBy(fleetAccounts.name)
      .orderBy(desc(sql`COALESCE(SUM(${transactions.amount}), 0)`))
      .limit(10);

    // Get revenue by month
    const revenueByMonth = await db
      .select({
        month: sql<string>`TO_CHAR(DATE_TRUNC('month', ${transactions.createdAt}), 'YYYY-MM')`,
        totalRevenue: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.status, 'completed'),
          gte(transactions.createdAt, dateFrom),
          lte(transactions.createdAt, dateTo)
        )
      )
      .groupBy(sql`DATE_TRUNC('month', ${transactions.createdAt})`)
      .orderBy(sql`DATE_TRUNC('month', ${transactions.createdAt})`);

    const transactionRevenue = revenueTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    const subscriptionTotal = Number(subscriptionRevenue[0]?.totalRevenue) || 0;
    const refundTotal = Number(refundAmount[0]?.totalRefunds) || 0;
    const totalRevenue = transactionRevenue + subscriptionTotal;

    return {
      summary: {
        totalRevenue,
        subscriptionRevenue: subscriptionTotal,
        transactionRevenue,
        refunds: refundTotal,
        netRevenue: totalRevenue - refundTotal,
        revenueByFleet: revenueByFleet.map(item => ({
          fleetName: item.fleetName || 'Unknown',
          revenue: Number(item.totalRevenue)
        })),
        revenueByMonth: revenueByMonth.map(item => ({
          month: item.month,
          revenue: Number(item.totalRevenue)
        }))
      },
      details: revenueTransactions
    };
  }

  // ==================== PARTS INVENTORY ====================
  
  async addPartToCatalog(part: InsertPartsCatalog): Promise<PartsCatalog> {
    return await partsInventoryService.addPartToCatalog(part);
  }
  
  async updatePartInCatalog(partId: string, updates: Partial<InsertPartsCatalog>): Promise<PartsCatalog | null> {
    return await partsInventoryService.updatePartInCatalog(partId, updates);
  }
  
  async getPartById(partId: string): Promise<PartsCatalog | null> {
    const [result] = await db
      .select()
      .from(partsCatalog)
      .where(eq(partsCatalog.id, partId))
      .limit(1);
    return result || null;
  }
  
  async searchPartsCatalog(filters: {
    query?: string;
    category?: string;
    manufacturer?: string;
    minPrice?: number;
    maxPrice?: number;
    isActive?: boolean;
    compatibleMake?: string;
    compatibleModel?: string;
    compatibleYear?: number;
    limit?: number;
    offset?: number;
  }): Promise<PartsCatalog[]> {
    return await partsInventoryService.searchPartsCatalog(filters);
  }
  
  async getPartsForVehicle(make: string, model: string, year: number): Promise<PartsCatalog[]> {
    return await partsInventoryService.searchPartsCatalog({
      compatibleMake: make,
      compatibleModel: model,
      compatibleYear: year,
      isActive: true
    });
  }
  
  async updateInventoryLevel(
    partId: string,
    warehouseId: string,
    quantity: number,
    transactionType?: string,
    notes?: string
  ): Promise<PartsInventory> {
    return await partsInventoryService.updateInventoryLevel(
      partId,
      warehouseId,
      quantity,
      transactionType || 'adjustment',
      undefined,
      undefined,
      notes
    );
  }
  
  async recordPartUsage(
    jobId: string,
    partId: string,
    quantity: number,
    contractorId: string,
    warehouseId = 'main',
    warrantyMonths = 12
  ): Promise<JobPart> {
    return await partsInventoryService.recordPartUsage(
      jobId,
      partId,
      quantity,
      contractorId,
      warehouseId,
      warrantyMonths
    );
  }
  
  async getJobParts(jobId: string): Promise<Array<{
    jobPart: JobPart;
    part: PartsCatalog;
  }>> {
    const result = await db
      .select({
        jobPart: jobParts,
        part: partsCatalog
      })
      .from(jobParts)
      .innerJoin(partsCatalog, eq(jobParts.partId, partsCatalog.id))
      .where(eq(jobParts.jobId, jobId));
    
    return result;
  }
  
  async checkReorderNeeded(warehouseId?: string): Promise<Array<{
    inventory: PartsInventory;
    part: PartsCatalog;
    quantityToOrder: number;
    currentStock: number;
    estimatedCost: number;
    urgency: string;
  }>> {
    return await partsInventoryService.checkReorderNeeded(warehouseId);
  }
  
  async createPartsOrder(
    supplierName: string,
    items: Array<{
      partId: string;
      quantity: number;
      unitCost?: number;
    }>,
    supplierContact?: string,
    expectedDeliveryDays = 7,
    createdBy?: string
  ): Promise<PartsOrder> {
    return await partsInventoryService.createPartsOrder(
      supplierName,
      items,
      supplierContact,
      expectedDeliveryDays,
      createdBy
    );
  }
  
  async receivePartsOrder(
    orderId: string,
    receivedItems: Array<{
      partId: string;
      quantityReceived: number;
      warehouseId?: string;
    }>,
    trackingNumber?: string
  ): Promise<PartsOrder> {
    return await partsInventoryService.receivePartsOrder(
      orderId,
      receivedItems,
      trackingNumber
    );
  }
  
  async getPartsOrders(filters?: {
    status?: string;
    supplierName?: string;
    fromDate?: Date;
    toDate?: Date;
  }): Promise<PartsOrder[]> {
    let conditions = [];
    
    if (filters?.status) {
      conditions.push(eq(partsOrders.status, filters.status as any));
    }
    
    if (filters?.supplierName) {
      conditions.push(eq(partsOrders.supplierName, filters.supplierName));
    }
    
    if (filters?.fromDate) {
      conditions.push(gte(partsOrders.createdAt, filters.fromDate));
    }
    
    if (filters?.toDate) {
      conditions.push(lte(partsOrders.createdAt, filters.toDate));
    }
    
    return await db
      .select()
      .from(partsOrders)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(partsOrders.createdAt));
  }
  
  async getInventoryValue(warehouseId?: string, method: 'FIFO' | 'LIFO' | 'AVERAGE' = 'AVERAGE'): Promise<{
    method: string;
    totalValue: string;
    totalRetailValue: string;
    potentialProfit: string;
    profitMargin: string;
    itemCount: number;
    breakdown: any[];
  }> {
    return await partsInventoryService.getInventoryValue(warehouseId, method);
  }
  
  async getPartUsageHistory(
    partId: string,
    dateRange?: { startDate: Date; endDate: Date }
  ): Promise<{
    partId: string;
    totalUsed: number;
    totalCost: string;
    transactionCount: number;
    avgMonthlyUsage: string;
    avgMonthlyCost: string;
    monthlyBreakdown: any[];
    recentTransactions: PartsTransaction[];
  }> {
    return await partsInventoryService.getPartUsageHistory(partId, dateRange);
  }
  
  async getInventoryLevels(warehouseId?: string, includeInactive = false): Promise<Array<{
    inventory: PartsInventory;
    part: PartsCatalog;
    stockStatus: string;
    needsReorder: boolean;
    isExpired: boolean;
    daysUntilExpiration: number | null;
  }>> {
    return await partsInventoryService.getInventoryLevels(warehouseId, includeInactive);
  }
  
  async getWarrantyReport(daysAhead = 30): Promise<{
    expiringCount: number;
    warranties: Array<{
      jobPart: JobPart;
      part: PartsCatalog;
      daysUntilExpiration: number;
    }>;
  }> {
    return await partsInventoryService.getWarrantyReport(daysAhead);
  }
  
  async forecastPartsDemand(partId: string, daysToForecast = 30): Promise<{
    partId: string;
    historicalDailyAverage: string;
    forecastedUsage: number;
    currentStock: number;
    daysOfStockRemaining: number;
    willNeedReorderBy: string | null;
    recommendedOrderQuantity: number;
  }> {
    return await partsInventoryService.forecastDemand(partId, daysToForecast);
  }
  
  async getSupplierPerformance(supplierName?: string): Promise<Array<{
    supplier: string;
    orderCount: number;
    totalValue: string;
    onTimeCount: number;
    delayedCount: number;
    avgDeliveryDays: string;
    onTimeRate: string;
  }>> {
    return await partsInventoryService.getSupplierPerformance(supplierName);
  }
  
  async createPartsTransaction(transaction: InsertPartsTransaction): Promise<PartsTransaction> {
    const [result] = await db.insert(partsTransactions).values(transaction).returning();
    return result;
  }
  
  async getPartsTransactions(filters?: {
    partId?: string;
    jobId?: string;
    contractorId?: string;
    transactionType?: string;
    warehouseId?: string;
    fromDate?: Date;
    toDate?: Date;
  }): Promise<PartsTransaction[]> {
    let conditions = [];
    
    if (filters?.partId) {
      conditions.push(eq(partsTransactions.partId, filters.partId));
    }
    
    if (filters?.jobId) {
      conditions.push(eq(partsTransactions.jobId, filters.jobId));
    }
    
    if (filters?.contractorId) {
      conditions.push(eq(partsTransactions.contractorId, filters.contractorId));
    }
    
    if (filters?.transactionType) {
      conditions.push(eq(partsTransactions.transactionType, filters.transactionType as any));
    }
    
    if (filters?.warehouseId) {
      conditions.push(eq(partsTransactions.warehouseId, filters.warehouseId));
    }
    
    if (filters?.fromDate) {
      conditions.push(gte(partsTransactions.createdAt, filters.fromDate));
    }
    
    if (filters?.toDate) {
      conditions.push(lte(partsTransactions.createdAt, filters.toDate));
    }
    
    return await db
      .select()
      .from(partsTransactions)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(partsTransactions.createdAt));
  }

  // ==================== AI DISPATCH SYSTEM ====================

  async calculateAIAssignmentScores(jobId: string): Promise<AiAssignmentScore[]> {
    // This is implemented in ai-dispatch-service.ts
    // Storage just provides data persistence
    const { aiDispatchService } = await import('./services/ai-dispatch-service');
    await aiDispatchService.calculateAIAssignmentScores(jobId);
    return this.getAiAssignmentScores(jobId);
  }

  async getOptimalContractor(jobId: string): Promise<{ contractorId: string; score: number; recommendation: string } | null> {
    const { aiDispatchService } = await import('./services/ai-dispatch-service');
    const result = await aiDispatchService.getOptimalContractor(jobId);
    if (result) {
      return {
        contractorId: result.contractorId,
        score: result.score,
        recommendation: result.recommendation
      };
    }
    return null;
  }

  async saveAiAssignmentScore(data: InsertAiAssignmentScore): Promise<AiAssignmentScore> {
    const [result] = await db.insert(aiAssignmentScores).values(data).returning();
    return result;
  }

  async getAiAssignmentScores(jobId: string): Promise<AiAssignmentScore[]> {
    return await db
      .select()
      .from(aiAssignmentScores)
      .where(eq(aiAssignmentScores.jobId, jobId))
      .orderBy(desc(aiAssignmentScores.score));
  }

  async updateAiAssignmentScore(scoreId: string, updates: Partial<AiAssignmentScore>): Promise<void> {
    await db
      .update(aiAssignmentScores)
      .set(updates)
      .where(eq(aiAssignmentScores.id, scoreId));
  }

  async getAiAssignmentScoresInPeriod(fromDate: Date, toDate: Date): Promise<AiAssignmentScore[]> {
    return await db
      .select()
      .from(aiAssignmentScores)
      .where(
        and(
          gte(aiAssignmentScores.calculatedAt, fromDate),
          lte(aiAssignmentScores.calculatedAt, toDate)
        )
      )
      .orderBy(desc(aiAssignmentScores.calculatedAt));
  }

  async updateContractorSpecializations(contractorId: string, specializations: any): Promise<void> {
    await db
      .update(contractorProfiles)
      .set({ specializations })
      .where(eq(contractorProfiles.userId, contractorId));
  }

  async getContractorPerformancePattern(contractorId: string): Promise<{
    timeOfDayPerformance: any;
    weatherPerformance: any;
    jobComplexityHandling: any;
  }> {
    const profile = await this.getContractorProfile(contractorId);
    return {
      timeOfDayPerformance: profile?.timeOfDayPerformance || {},
      weatherPerformance: profile?.weatherPerformance || {},
      jobComplexityHandling: profile?.jobComplexityHandling || {}
    };
  }

  async recordAssignmentOutcome(
    jobId: string,
    success: boolean,
    metrics: {
      responseTime?: number;
      completionTime?: number;
      customerRating?: number;
      issuesEncountered?: string[];
    }
  ): Promise<void> {
    const { aiDispatchService } = await import('./services/ai-dispatch-service');
    await aiDispatchService.recordAssignmentOutcome(jobId, success, metrics);
  }

  async getAssignmentPreferences(contractorId: string): Promise<AssignmentPreferences | null> {
    const result = await db
      .select()
      .from(assignmentPreferences)
      .where(eq(assignmentPreferences.contractorId, contractorId))
      .limit(1);
    return result[0] || null;
  }

  async saveAssignmentPreferences(data: InsertAssignmentPreferences): Promise<AssignmentPreferences> {
    // Check if preferences already exist
    const existing = await this.getAssignmentPreferences(data.contractorId);
    
    if (existing) {
      // Update existing preferences
      const [result] = await db
        .update(assignmentPreferences)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(assignmentPreferences.contractorId, data.contractorId))
        .returning();
      return result;
    } else {
      // Insert new preferences
      const [result] = await db.insert(assignmentPreferences).values(data).returning();
      return result;
    }
  }

  async updateAssignmentPreferences(contractorId: string, updates: Partial<AssignmentPreferences>): Promise<void> {
    await db
      .update(assignmentPreferences)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(assignmentPreferences.contractorId, contractorId));
  }

  async getAvailableContractors(): Promise<ContractorProfile[]> {
    return await db
      .select()
      .from(contractorProfiles)
      .where(
        and(
          eq(contractorProfiles.isAvailable, true),
          eq(contractorProfiles.isOnline, true)
        )
      );
  }

  async updateContractorProfile(contractorId: string, updates: Partial<ContractorProfile>): Promise<void> {
    await db
      .update(contractorProfiles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(contractorProfiles.userId, contractorId));
  }

  async getAssignmentEffectiveness(period: 'day' | 'week' | 'month'): Promise<{
    totalAssignments: number;
    successfulAssignments: number;
    failedAssignments: number;
    successRate: number;
    averageScore: number;
  }> {
    const { aiDispatchService } = await import('./services/ai-dispatch-service');
    const effectiveness = await aiDispatchService.getAssignmentEffectiveness(period);
    
    return {
      totalAssignments: effectiveness.totalAssignments,
      successfulAssignments: effectiveness.successfulAssignments,
      failedAssignments: effectiveness.failedAssignments,
      successRate: effectiveness.successRate,
      averageScore: effectiveness.averageAssignedScore
    };
  }

  // ==================== MAINTENANCE PREDICTIONS ====================
  
  async createMaintenancePrediction(vehicleId: string, prediction: InsertMaintenancePrediction): Promise<MaintenancePrediction> {
    const [result] = await db.insert(maintenancePredictions).values({
      ...prediction,
      vehicleId
    }).returning();
    return result;
  }

  async getMaintenancePredictions(fleetId: string, dateRange?: { start: Date; end: Date }): Promise<{
    predictions: MaintenancePrediction[];
    vehicles: FleetVehicle[];
  }> {
    let query = db
      .select()
      .from(maintenancePredictions)
      .innerJoin(fleetVehicles, eq(maintenancePredictions.vehicleId, fleetVehicles.id))
      .where(eq(fleetVehicles.fleetAccountId, fleetId));

    if (dateRange) {
      query = query.where(
        and(
          gte(maintenancePredictions.predictedDate, dateRange.start),
          lte(maintenancePredictions.predictedDate, dateRange.end)
        )
      );
    }

    const results = await query;
    
    const predictions = results.map(r => r.maintenance_predictions);
    const vehicles = [...new Map(results.map(r => [r.fleet_vehicles.id, r.fleet_vehicles])).values()];
    
    return { predictions, vehicles };
  }

  async recordVehicleTelemetry(vehicleId: string, data: InsertVehicleTelemetry): Promise<VehicleTelemetry> {
    const [result] = await db.insert(vehicleTelemetry).values({
      ...data,
      vehicleId
    }).returning();
    
    // Trigger analysis in background
    const { maintenancePredictionService } = await import('./services/maintenance-prediction-service');
    maintenancePredictionService.analyzeTelemetry(vehicleId, data).catch(console.error);
    
    return result;
  }

  async updatePredictionModel(modelId: string, metrics: {
    accuracy?: number;
    performanceMetrics?: any;
  }): Promise<MaintenanceModel | null> {
    const [result] = await db
      .update(maintenanceModels)
      .set({
        ...metrics,
        updatedAt: new Date()
      })
      .where(eq(maintenanceModels.id, modelId))
      .returning();
    
    return result || null;
  }

  async createMaintenanceAlert(vehicleId: string, alert: InsertMaintenanceAlert): Promise<MaintenanceAlert> {
    const [result] = await db.insert(maintenanceAlerts).values({
      ...alert,
      vehicleId
    }).returning();
    
    // Send notification
    const vehicle = await this.getFleetVehicle(vehicleId);
    if (vehicle) {
      await this.createNotification({
        userId: vehicle.fleetAccountId,
        type: 'maintenance',
        title: `Maintenance Alert: ${vehicle.unitNumber}`,
        message: alert.message,
        relatedEntityType: 'maintenance_alert',
        relatedEntityId: result.id,
        priority: alert.severity === 'critical' ? 'urgent' : 'high',
        actionUrl: `/fleet/maintenance-predictor?alertId=${result.id}`,
        metadata: {
          vehicleId,
          alertType: alert.alertType,
          severity: alert.severity
        }
      });
    }
    
    return result;
  }

  async getHighRiskVehicles(fleetId: string): Promise<{
    vehicle: FleetVehicle;
    criticalCount: number;
    highCount: number;
    totalEstimatedCost: number;
  }[]> {
    const results = await db
      .select({
        vehicle: fleetVehicles,
        criticalCount: sql<number>`COUNT(CASE WHEN ${maintenancePredictions.riskLevel} = 'critical' THEN 1 END)`,
        highCount: sql<number>`COUNT(CASE WHEN ${maintenancePredictions.riskLevel} = 'high' THEN 1 END)`,
        totalEstimatedCost: sql<number>`COALESCE(SUM(${maintenancePredictions.estimatedCost}), 0)`
      })
      .from(fleetVehicles)
      .leftJoin(maintenancePredictions, eq(fleetVehicles.id, maintenancePredictions.vehicleId))
      .where(
        and(
          eq(fleetVehicles.fleetAccountId, fleetId),
          gte(maintenancePredictions.predictedDate, new Date()),
          lte(maintenancePredictions.predictedDate, new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
        )
      )
      .groupBy(fleetVehicles.id)
      .having(sql`COUNT(CASE WHEN ${maintenancePredictions.riskLevel} IN ('critical', 'high') THEN 1 END) > 0`);
    
    return results;
  }

  async calculateMaintenanceROI(vehicleId: string): Promise<{
    preventiveCost: number;
    potentialReactiveCost: number;
    potentialDowntimeSaved: number;
    totalSavings: number;
    roi: number;
  }> {
    const { maintenancePredictionService } = await import('./services/maintenance-prediction-service');
    return maintenancePredictionService.calculateMaintenanceROI(vehicleId);
  }

  async getPredictionAccuracy(modelId?: string): Promise<{
    modelName: string;
    accuracy: number;
    performanceMetrics: any;
  }> {
    const whereClause = modelId ? eq(maintenanceModels.id, modelId) : eq(maintenanceModels.isActive, true);
    
    const model = await db
      .select()
      .from(maintenanceModels)
      .where(whereClause)
      .orderBy(desc(maintenanceModels.trainedAt))
      .limit(1)
      .then(rows => rows[0]);

    if (!model) {
      return {
        modelName: 'v1.0.0',
        accuracy: 85,
        performanceMetrics: {
          precision: 0.85,
          recall: 0.82,
          f1Score: 0.835
        }
      };
    }

    return {
      modelName: model.modelName,
      accuracy: Number(model.accuracy),
      performanceMetrics: model.performanceMetrics
    };
  }

  async getVehicleMaintenanceSchedule(vehicleId: string): Promise<{
    predictions: MaintenancePrediction[];
    alerts: MaintenanceAlert[];
    nextServiceDue: Date | null;
  }> {
    const predictions = await db
      .select()
      .from(maintenancePredictions)
      .where(
        and(
          eq(maintenancePredictions.vehicleId, vehicleId),
          gte(maintenancePredictions.predictedDate, new Date())
        )
      )
      .orderBy(asc(maintenancePredictions.predictedDate));

    const alerts = await db
      .select()
      .from(maintenanceAlerts)
      .where(
        and(
          eq(maintenanceAlerts.vehicleId, vehicleId),
          isNull(maintenanceAlerts.acknowledgedAt)
        )
      )
      .orderBy(desc(maintenanceAlerts.severity));

    return {
      predictions,
      alerts,
      nextServiceDue: predictions[0]?.predictedDate || null
    };
  }

  async acknowledgeMaintenanceAlert(alertId: string, userId: string, notes?: string): Promise<MaintenanceAlert | null> {
    const [result] = await db
      .update(maintenanceAlerts)
      .set({
        acknowledgedBy: userId,
        acknowledgedAt: new Date(),
        notes
      })
      .where(eq(maintenanceAlerts.id, alertId))
      .returning();
    
    return result || null;
  }

  async getFleetMaintenanceAlerts(fleetId: string, options?: {
    active?: boolean;
    severity?: string;
    limit?: number;
  }): Promise<MaintenanceAlert[]> {
    let query = db
      .select()
      .from(maintenanceAlerts)
      .innerJoin(fleetVehicles, eq(maintenanceAlerts.vehicleId, fleetVehicles.id))
      .where(eq(fleetVehicles.fleetAccountId, fleetId));

    if (options?.active) {
      query = query.where(isNull(maintenanceAlerts.acknowledgedAt));
    }

    if (options?.severity) {
      query = query.where(eq(maintenanceAlerts.severity, options.severity as any));
    }

    query = query.orderBy(
      desc(maintenanceAlerts.severity),
      desc(maintenanceAlerts.createdAt)
    );

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const results = await query;
    return results.map(r => r.maintenance_alerts);
  }

  // =============================================
  // PERFORMANCE METRICS METHODS
  // =============================================

  async recordPerformanceMetric(metric: InsertPerformanceMetric): Promise<PerformanceMetric> {
    const { performanceMetricsService } = await import('./services/performance-metrics-service');
    return performanceMetricsService.recordMetric(metric);
  }

  async getPerformanceMetrics(
    entityType: string, 
    entityId: string, 
    dateRange?: { startDate: Date; endDate: Date }
  ): Promise<PerformanceMetric[]> {
    const { performanceMetricsService } = await import('./services/performance-metrics-service');
    return performanceMetricsService.getPerformanceMetrics(entityType, entityId, dateRange);
  }

  async calculateKPI(
    kpiId: string, 
    entityId: string, 
    period: { startDate: Date; endDate: Date }
  ) {
    const { performanceMetricsService } = await import('./services/performance-metrics-service');
    return performanceMetricsService.calculateKPI(kpiId, entityId, period);
  }

  async createPerformanceSnapshot() {
    const { performanceMetricsService } = await import('./services/performance-metrics-service');
    return performanceMetricsService.createPerformanceSnapshot();
  }

  async setPerformanceGoal(
    entityType: string, 
    entityId: string, 
    kpiId: string, 
    target: {
      targetValue: number;
      deadline: Date;
      notes?: string;
    }
  ): Promise<PerformanceGoal> {
    const { performanceMetricsService } = await import('./services/performance-metrics-service');
    return performanceMetricsService.setPerformanceGoal({
      entityType: entityType as any,
      entityId,
      kpiId,
      targetValue: String(target.targetValue),
      deadline: target.deadline,
      notes: target.notes
    });
  }

  async getPerformanceComparison(
    entityId: string, 
    periods: Array<{ startDate: Date; endDate: Date }>
  ) {
    const { performanceMetricsService } = await import('./services/performance-metrics-service');
    return performanceMetricsService.getPerformanceComparison(entityId, periods);
  }

  async getTopPerformers(metricType: string, limit?: number) {
    const { performanceMetricsService } = await import('./services/performance-metrics-service');
    return performanceMetricsService.getTopPerformers(metricType, limit);
  }

  async getPerformanceTrends(
    metricType: string, 
    dateRange: { startDate: Date; endDate: Date }
  ) {
    const { performanceMetricsService } = await import('./services/performance-metrics-service');
    return performanceMetricsService.getPerformanceTrends(metricType, dateRange);
  }

  async generatePerformanceScorecard(
    entityType: string, 
    entityId: string, 
    period?: { startDate: Date; endDate: Date }
  ) {
    const { performanceMetricsService } = await import('./services/performance-metrics-service');
    return performanceMetricsService.generateScorecard(entityType, entityId, period);
  }

  async initializePerformanceKPIs() {
    const { performanceMetricsService } = await import('./services/performance-metrics-service');
    return performanceMetricsService.initializeKPIs();
  }

  async calculateResponseTimeMetrics(
    entityType: string, 
    entityId: string, 
    dateRange: { startDate: Date; endDate: Date }
  ) {
    const { performanceMetricsService } = await import('./services/performance-metrics-service');
    return performanceMetricsService.calculateResponseTimeMetrics(entityType, entityId, dateRange);
  }

  async calculateCompletionRates(
    entityType: string, 
    entityId: string, 
    dateRange: { startDate: Date; endDate: Date }
  ) {
    const { performanceMetricsService } = await import('./services/performance-metrics-service');
    return performanceMetricsService.calculateCompletionRates(entityType, entityId, dateRange);
  }

  async calculateRevenue(
    entityType: string, 
    entityId: string, 
    dateRange: { startDate: Date; endDate: Date }
  ) {
    const { performanceMetricsService } = await import('./services/performance-metrics-service');
    return performanceMetricsService.calculateRevenue(entityType, entityId, dateRange);
  }

  async calculateSatisfactionScore(
    entityType: string, 
    entityId: string, 
    dateRange: { startDate: Date; endDate: Date }
  ) {
    const { performanceMetricsService } = await import('./services/performance-metrics-service');
    return performanceMetricsService.calculateSatisfactionScore(entityType, entityId, dateRange);
  }

  async calculateFleetUtilization(
    fleetId: string, 
    dateRange: { startDate: Date; endDate: Date }
  ) {
    const { performanceMetricsService } = await import('./services/performance-metrics-service');
    return performanceMetricsService.calculateFleetUtilization(fleetId, dateRange);
  }

  async calculateOnTimeDelivery(
    entityType: string, 
    entityId: string, 
    dateRange: { startDate: Date; endDate: Date }
  ) {
    const { performanceMetricsService } = await import('./services/performance-metrics-service');
    return performanceMetricsService.calculateOnTimeDelivery(entityType, entityId, dateRange);
  }

  // ==================== WEATHER METHODS ====================
  
  async saveWeatherData(data: InsertWeatherData): Promise<WeatherData> {
    const result = await db.insert(weatherData).values(data).returning();
    return result[0];
  }
  
  async getWeatherForLocation(lat: number, lng: number, isForecast: boolean = false): Promise<WeatherData | null> {
    const result = await db.select()
      .from(weatherData)
      .where(and(
        eq(weatherData.latitude, lat.toString()),
        eq(weatherData.longitude, lng.toString()),
        eq(weatherData.isForecast, isForecast),
        gte(weatherData.expiresAt, new Date())
      ))
      .orderBy(desc(weatherData.timestamp))
      .limit(1);
    
    return result[0] || null;
  }
  
  async saveWeatherAlert(alert: InsertWeatherAlert): Promise<WeatherAlert> {
    const result = await db.insert(weatherAlerts).values(alert).returning();
    return result[0];
  }
  
  async getActiveWeatherAlerts(): Promise<WeatherAlert[]> {
    const now = new Date();
    return await db.select()
      .from(weatherAlerts)
      .where(and(
        eq(weatherAlerts.isActive, true),
        lte(weatherAlerts.startTime, now),
        gte(weatherAlerts.endTime, now)
      ))
      .orderBy(desc(weatherAlerts.severity));
  }
  
  async recordJobWeatherImpact(impact: InsertJobWeatherImpact): Promise<JobWeatherImpact> {
    const result = await db.insert(jobWeatherImpacts).values(impact).returning();
    return result[0];
  }
  
  async getJobWeatherImpact(jobId: string): Promise<JobWeatherImpact | null> {
    const result = await db.select()
      .from(jobWeatherImpacts)
      .where(eq(jobWeatherImpacts.jobId, jobId))
      .orderBy(desc(jobWeatherImpacts.createdAt))
      .limit(1);
    
    return result[0] || null;
  }
  
  async updateWeatherDataExpiration(id: string, expiresAt: Date): Promise<void> {
    await db.update(weatherData)
      .set({ expiresAt, updatedAt: new Date() })
      .where(eq(weatherData.id, id));
  }
  
  async getWeatherAlertsForLocation(lat: number, lng: number): Promise<WeatherAlert[]> {
    const now = new Date();
    const alerts = await db.select()
      .from(weatherAlerts)
      .where(and(
        eq(weatherAlerts.isActive, true),
        lte(weatherAlerts.startTime, now),
        gte(weatherAlerts.endTime, now)
      ));
    
    // Filter alerts that affect the given location
    // This is simplified - in a real system you'd check if the location
    // is within the affected areas using proper geospatial queries
    const radius = 50; // miles
    const filteredAlerts = alerts.filter(alert => {
      const areas = alert.affectedAreas as any[];
      return areas.some((area: any) => {
        const distance = this.calculateDistance(lat, lng, area.lat, area.lng);
        return distance <= (area.radius || radius);
      });
    });
    
    return filteredAlerts;
  }
  
  async getActiveJobs(): Promise<Job[]> {
    return await db.select()
      .from(jobs)
      .where(inArray(jobs.status, ['new', 'assigned', 'en_route', 'on_site']))
      .orderBy(desc(jobs.createdAt));
  }
  
  // Helper function to calculate distance between two coordinates (in miles)
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // ==================== EMERGENCY SOS METHODS ====================
  
  async createSOSAlert(
    userId: string,
    location: { lat: number; lng: number; accuracy?: number; address?: string },
    alertType: 'medical' | 'accident' | 'threat' | 'mechanical' | 'other',
    message: string,
    severity: 'critical' | 'high' | 'medium' | 'low' = 'high',
    jobId?: string
  ): Promise<EmergencySosAlert> {
    const { emergencySOSService } = await import('./services/emergency-sos-service');
    
    // Get user details for initiator type
    const user = await this.getUser(userId);
    if (!user) throw new Error('User not found');
    
    const initiatorType = user.role as 'driver' | 'contractor' | 'fleet_manager' | 'dispatcher';
    
    return emergencySOSService.createSOSAlert({
      initiatorId: userId,
      initiatorType,
      location,
      alertType,
      severity,
      message,
      jobId
    });
  }
  
  async acknowledgeSOSAlert(alertId: string, responderId: string): Promise<EmergencySosAlert> {
    const { emergencySOSService } = await import('./services/emergency-sos-service');
    return emergencySOSService.acknowledgeSOSAlert(alertId, responderId);
  }
  
  async resolveSOSAlert(
    alertId: string,
    resolution: 'resolved' | 'false_alarm' | 'cancelled',
    notes?: string,
    responderId?: string
  ): Promise<EmergencySosAlert> {
    const { emergencySOSService } = await import('./services/emergency-sos-service');
    return emergencySOSService.resolveSOSAlert(alertId, resolution, notes, responderId);
  }
  
  async getActiveSOSAlerts(): Promise<EmergencySosAlert[]> {
    const { emergencySOSService } = await import('./services/emergency-sos-service');
    return emergencySOSService.getActiveSOSAlerts();
  }
  
  async getEmergencyContacts(userId: string): Promise<EmergencyContact[]> {
    const { emergencySOSService } = await import('./services/emergency-sos-service');
    return emergencySOSService.getEmergencyContacts(userId);
  }
  
  async upsertEmergencyContact(contact: InsertEmergencyContact): Promise<EmergencyContact> {
    const { emergencySOSService } = await import('./services/emergency-sos-service');
    return emergencySOSService.upsertEmergencyContact(contact);
  }
  
  async deleteEmergencyContact(contactId: string): Promise<boolean> {
    try {
      const result = await db
        .delete(emergencyContacts)
        .where(eq(emergencyContacts.id, contactId))
        .returning();
      return result.length > 0;
    } catch (error) {
      console.error('Error deleting emergency contact:', error);
      return false;
    }
  }
  
  async findNearbyResponders(
    location: { lat: number; lng: number },
    radiusMiles: number
  ): Promise<Array<{
    id: string;
    name: string;
    distance: number;
    estimatedArrival: number;
    location: { lat: number; lng: number };
    phone?: string;
    type: 'contractor' | 'emergency_service' | 'fleet_manager';
    isAvailable: boolean;
  }>> {
    const { emergencySOSService } = await import('./services/emergency-sos-service');
    return emergencySOSService.findNearbyResponders(location, radiusMiles);
  }
  
  async logEmergencyResponse(
    alertId: string,
    action: typeof sosResponseActionEnum.enumValues[number],
    notes?: string,
    responderId?: string
  ): Promise<EmergencyResponseLog> {
    const { emergencySOSService } = await import('./services/emergency-sos-service');
    const result = await db
      .insert(emergencyResponseLog)
      .values({
        sosAlertId: alertId,
        responderId,
        action: action as any,
        notes,
        actionDetails: notes
      })
      .returning();
    return result[0];
  }
  
  async getSOSAlertHistory(userId: string, limit: number = 50): Promise<EmergencySosAlert[]> {
    const { emergencySOSService } = await import('./services/emergency-sos-service');
    return emergencySOSService.getSOSAlertHistory(userId, limit);
  }
  
  async getEmergencyResponseLogs(alertId: string): Promise<EmergencyResponseLog[]> {
    const logs = await db
      .select()
      .from(emergencyResponseLog)
      .where(eq(emergencyResponseLog.sosAlertId, alertId))
      .orderBy(desc(emergencyResponseLog.timestamp));
    return logs;
  }
  
  async updateSOSAlertLocation(
    alertId: string,
    location: { lat: number; lng: number; accuracy?: number }
  ): Promise<void> {
    const { emergencySOSService } = await import('./services/emergency-sos-service');
    await emergencySOSService.updateAlertLocation(alertId, location);
  }
  
  async getSOSAlertById(alertId: string): Promise<EmergencySosAlert | null> {
    const result = await db
      .select()
      .from(emergencySosAlerts)
      .where(eq(emergencySosAlerts.id, alertId))
      .limit(1);
    return result[0] || null;
  }
  
  async getSOSAlertsByTimeRange(startDate: Date, endDate: Date): Promise<EmergencySosAlert[]> {
    const alerts = await db
      .select()
      .from(emergencySosAlerts)
      .where(
        and(
          gte(emergencySosAlerts.createdAt, startDate),
          lt(emergencySosAlerts.createdAt, endDate)
        )
      )
      .orderBy(desc(emergencySosAlerts.createdAt));
    return alerts;
  }
  
  async testSOSSystem(userId: string): Promise<{ success: boolean; message: string }> {
    const { emergencySOSService } = await import('./services/emergency-sos-service');
    return emergencySOSService.testSOSSystem(userId);
  }

  // ==================== FUEL TRACKING METHODS ====================
  
  async saveFuelStation(station: InsertFuelStation): Promise<FuelStation> {
    const result = await db.insert(fuelStations).values(station).returning();
    return result[0];
  }
  
  async updateFuelStation(stationId: string, updates: Partial<InsertFuelStation>): Promise<FuelStation | null> {
    const result = await db
      .update(fuelStations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(fuelStations.id, stationId))
      .returning();
    return result[0] || null;
  }
  
  async getAllFuelStations(): Promise<FuelStation[]> {
    return await db.select().from(fuelStations).where(eq(fuelStations.isActive, true));
  }
  
  async getFuelStationById(stationId: string): Promise<FuelStation | null> {
    const result = await db
      .select()
      .from(fuelStations)
      .where(eq(fuelStations.id, stationId))
      .limit(1);
    return result[0] || null;
  }
  
  async getFuelStationsNearLocation(lat: number, lng: number, radius: number): Promise<FuelStation[]> {
    // Get all active stations and filter by distance in memory
    // (In production, you'd use PostGIS for efficient geographic queries)
    const allStations = await this.getAllFuelStations();
    
    const nearbyStations = allStations.filter(station => {
      const distance = this.calculateDistance(
        lat, 
        lng, 
        Number(station.latitude), 
        Number(station.longitude)
      );
      return distance <= radius;
    });
    
    // Sort by distance
    nearbyStations.sort((a, b) => {
      const distA = this.calculateDistance(lat, lng, Number(a.latitude), Number(a.longitude));
      const distB = this.calculateDistance(lat, lng, Number(b.latitude), Number(b.longitude));
      return distA - distB;
    });
    
    return nearbyStations;
  }
  
  async getFuelStationsByState(state: string): Promise<FuelStation[]> {
    return await db
      .select()
      .from(fuelStations)
      .where(and(
        eq(fuelStations.state, state),
        eq(fuelStations.isActive, true)
      ));
  }
  
  async saveFuelPrice(price: InsertFuelPrice): Promise<FuelPrice> {
    const result = await db.insert(fuelPrices).values(price).returning();
    return result[0];
  }
  
  async updateFuelPriceStatus(priceId: string, isCurrent: boolean): Promise<void> {
    await db
      .update(fuelPrices)
      .set({ isCurrent })
      .where(eq(fuelPrices.id, priceId));
  }
  
  async getCurrentFuelPrice(stationId: string, fuelType: string): Promise<FuelPrice | null> {
    const result = await db
      .select()
      .from(fuelPrices)
      .where(and(
        eq(fuelPrices.stationId, stationId),
        eq(fuelPrices.fuelType, fuelType as any),
        eq(fuelPrices.isCurrent, true)
      ))
      .limit(1);
    return result[0] || null;
  }
  
  async getStationCurrentPrices(stationId: string): Promise<FuelPrice[]> {
    return await db
      .select()
      .from(fuelPrices)
      .where(and(
        eq(fuelPrices.stationId, stationId),
        eq(fuelPrices.isCurrent, true)
      ));
  }
  
  async getRecentPriceChanges(fuelType?: string): Promise<FuelPrice[]> {
    const conditions = [
      eq(fuelPrices.isCurrent, true),
      gt(fuelPrices.priceChangePercent, '0')
    ];
    
    if (fuelType) {
      conditions.push(eq(fuelPrices.fuelType, fuelType as any));
    }
    
    return await db
      .select()
      .from(fuelPrices)
      .where(and(...conditions))
      .orderBy(desc(fuelPrices.createdAt))
      .limit(50);
  }
  
  async saveFuelPriceHistory(history: InsertFuelPriceHistory): Promise<FuelPriceHistory> {
    const result = await db.insert(fuelPriceHistory).values(history).returning();
    return result[0];
  }
  
  async getFuelPriceHistory(stationId: string, fuelType?: string, days: number = 30): Promise<FuelPriceHistory[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const conditions = [
      eq(fuelPriceHistory.stationId, stationId),
      gte(fuelPriceHistory.timestamp, startDate)
    ];
    
    if (fuelType) {
      conditions.push(eq(fuelPriceHistory.fuelType, fuelType as any));
    }
    
    return await db
      .select()
      .from(fuelPriceHistory)
      .where(and(...conditions))
      .orderBy(desc(fuelPriceHistory.timestamp));
  }
  
  async saveRouteFuelStop(stop: InsertRouteFuelStop): Promise<RouteFuelStop> {
    const result = await db.insert(routeFuelStops).values(stop).returning();
    return result[0];
  }
  
  async getRouteFuelStops(routeId?: string, jobId?: string): Promise<RouteFuelStop[]> {
    const conditions = [];
    
    if (routeId) {
      conditions.push(eq(routeFuelStops.routeId, routeId));
    }
    if (jobId) {
      conditions.push(eq(routeFuelStops.jobId, jobId));
    }
    
    if (conditions.length === 0) {
      return [];
    }
    
    return await db
      .select()
      .from(routeFuelStops)
      .where(and(...conditions))
      .orderBy(asc(routeFuelStops.sequenceNumber));
  }
  
  async updateRouteFuelStop(stopId: string, updates: Partial<InsertRouteFuelStop>): Promise<RouteFuelStop | null> {
    const result = await db
      .update(routeFuelStops)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(routeFuelStops.id, stopId))
      .returning();
    return result[0] || null;
  }
  
  async saveFuelPriceAlert(alert: InsertFuelPriceAlert): Promise<FuelPriceAlert> {
    const result = await db.insert(fuelPriceAlerts).values(alert).returning();
    return result[0];
  }
  
  async getActiveFuelAlerts(): Promise<FuelPriceAlert[]> {
    return await db
      .select()
      .from(fuelPriceAlerts)
      .where(and(
        eq(fuelPriceAlerts.isActive, true),
        or(
          isNull(fuelPriceAlerts.expiresAt),
          gt(fuelPriceAlerts.expiresAt, new Date())
        )
      ));
  }
  
  async triggerFuelAlert(alertId: string, updates: Partial<InsertFuelPriceAlert>): Promise<FuelPriceAlert | null> {
    const result = await db
      .update(fuelPriceAlerts)
      .set({ 
        ...updates,
        notificationSent: true,
        notificationSentAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(fuelPriceAlerts.id, alertId))
      .returning();
    return result[0] || null;
  }
  
  async getUserFuelAlerts(userId?: string, fleetAccountId?: string): Promise<FuelPriceAlert[]> {
    const conditions = [eq(fuelPriceAlerts.isActive, true)];
    
    if (userId) {
      conditions.push(eq(fuelPriceAlerts.userId, userId));
    }
    if (fleetAccountId) {
      conditions.push(eq(fuelPriceAlerts.fleetAccountId, fleetAccountId));
    }
    
    return await db
      .select()
      .from(fuelPriceAlerts)
      .where(and(...conditions))
      .orderBy(desc(fuelPriceAlerts.createdAt));
  }
  
  async saveFuelPriceAggregate(aggregate: InsertFuelPriceAggregate): Promise<FuelPriceAggregate> {
    const result = await db.insert(fuelPriceAggregates).values(aggregate).returning();
    return result[0];
  }
  
  async getRegionalPriceTrends(state: string, fuelType?: string): Promise<FuelPriceAggregate[]> {
    const conditions = [
      eq(fuelPriceAggregates.state, state),
      gte(fuelPriceAggregates.periodStart, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) // Last 30 days
    ];
    
    if (fuelType) {
      conditions.push(eq(fuelPriceAggregates.fuelType, fuelType as any));
    }
    
    return await db
      .select()
      .from(fuelPriceAggregates)
      .where(and(...conditions))
      .orderBy(desc(fuelPriceAggregates.periodStart));
  }
  
  async getLowestFuelPrices(
    lat: number, 
    lng: number, 
    radius: number, 
    fuelType?: string, 
    limit: number = 10
  ): Promise<Array<{
    station: FuelStation;
    price: FuelPrice;
    distance: number;
  }>> {
    // Get nearby stations
    const nearbyStations = await this.getFuelStationsNearLocation(lat, lng, radius);
    
    const results = [];
    
    for (const station of nearbyStations) {
      const prices = await this.getStationCurrentPrices(station.id);
      
      for (const price of prices) {
        if (!fuelType || price.fuelType === fuelType) {
          const distance = this.calculateDistance(
            lat,
            lng,
            Number(station.latitude),
            Number(station.longitude)
          );
          
          results.push({ station, price, distance });
        }
      }
    }
    
    // Sort by price
    results.sort((a, b) => Number(a.price.pricePerGallon) - Number(b.price.pricePerGallon));
    
    return results.slice(0, limit);
  }
  
  // ==================== PAYMENT RECONCILIATION & COMMISSIONS ====================
  
  // Commission rule management
  async saveCommissionRule(rule: InsertCommissionRule): Promise<CommissionRule> {
    const result = await db.insert(commissionRules).values(rule).returning();
    return result[0];
  }
  
  async updateCommissionRule(ruleId: string, updates: Partial<InsertCommissionRule>): Promise<CommissionRule | null> {
    const result = await db
      .update(commissionRules)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(commissionRules.id, ruleId))
      .returning();
    return result[0] || null;
  }
  
  async getCommissionRules(userType?: 'contractor' | 'fleet', isActive?: boolean): Promise<CommissionRule[]> {
    const conditions = [];
    
    if (userType) {
      conditions.push(eq(commissionRules.userType, userType));
    }
    if (isActive !== undefined) {
      conditions.push(eq(commissionRules.isActive, isActive));
    }
    
    const query = conditions.length > 0
      ? db.select().from(commissionRules).where(and(...conditions))
      : db.select().from(commissionRules);
    
    return await query.orderBy(desc(commissionRules.priority), asc(commissionRules.commissionPercentage));
  }
  
  async getCommissionRuleById(ruleId: string): Promise<CommissionRule | null> {
    const result = await db
      .select()
      .from(commissionRules)
      .where(eq(commissionRules.id, ruleId))
      .limit(1);
    return result[0] || null;
  }
  
  async deleteCommissionRule(ruleId: string): Promise<boolean> {
    const result = await db
      .update(commissionRules)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(commissionRules.id, ruleId));
    return result.rowCount > 0;
  }
  
  // Commission calculation and transactions
  async calculateCommission(jobId: string, contractorId: string, baseAmount: number, surgeMultiplier: number = 1.0): Promise<InsertCommissionTransaction> {
    // Import payment reconciliation service to avoid circular dependency
    const { default: paymentReconciliationService } = await import('./services/payment-reconciliation-service');
    return await paymentReconciliationService.calculateCommission(jobId, contractorId, baseAmount, surgeMultiplier);
  }
  
  async saveCommissionTransaction(transaction: InsertCommissionTransaction): Promise<CommissionTransaction> {
    const result = await db.insert(commissionTransactions).values(transaction).returning();
    return result[0];
  }
  
  async getCommissionTransactionByJobId(jobId: string): Promise<CommissionTransaction | null> {
    const result = await db
      .select()
      .from(commissionTransactions)
      .where(eq(commissionTransactions.jobId, jobId))
      .limit(1);
    return result[0] || null;
  }
  
  async getCommissionTransactions(contractorId?: string, status?: string, limit: number = 100): Promise<CommissionTransaction[]> {
    const conditions = [];
    
    if (contractorId) {
      conditions.push(eq(commissionTransactions.contractorId, contractorId));
    }
    if (status) {
      conditions.push(eq(commissionTransactions.status, status as any));
    }
    
    const query = conditions.length > 0
      ? db.select().from(commissionTransactions).where(and(...conditions))
      : db.select().from(commissionTransactions);
    
    return await query
      .orderBy(desc(commissionTransactions.createdAt))
      .limit(limit);
  }
  
  async updateCommissionTransaction(transactionId: string, updates: Partial<InsertCommissionTransaction>): Promise<CommissionTransaction | null> {
    const result = await db
      .update(commissionTransactions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(commissionTransactions.id, transactionId))
      .returning();
    return result[0] || null;
  }
  
  // Payment reconciliation
  async processReconciliation(
    periodType: 'daily' | 'weekly' | 'monthly' | 'quarterly',
    periodStart: Date,
    periodEnd: Date,
    createdBy?: string
  ): Promise<PaymentReconciliation> {
    const { default: paymentReconciliationService } = await import('./services/payment-reconciliation-service');
    return await paymentReconciliationService.processReconciliation(periodType, periodStart, periodEnd, createdBy);
  }
  
  async getReconciliationReport(
    periodType?: 'daily' | 'weekly' | 'monthly' | 'quarterly',
    startDate?: Date,
    endDate?: Date,
    status?: string
  ): Promise<PaymentReconciliation[]> {
    const { default: paymentReconciliationService } = await import('./services/payment-reconciliation-service');
    return await paymentReconciliationService.getReconciliationReport(periodType, startDate, endDate, status);
  }
  
  async getReconciliationById(reconciliationId: string): Promise<PaymentReconciliation | null> {
    const result = await db
      .select()
      .from(paymentReconciliation)
      .where(eq(paymentReconciliation.id, reconciliationId))
      .limit(1);
    return result[0] || null;
  }
  
  async updateReconciliationStatus(reconciliationId: string, status: string, notes?: string): Promise<PaymentReconciliation | null> {
    const updateData: any = {
      status,
      updatedAt: new Date()
    };
    
    if (notes) {
      updateData.notes = notes;
    }
    
    if (status === 'completed') {
      updateData.completedAt = new Date();
      updateData.reconciledAt = new Date();
    }
    
    const result = await db
      .update(paymentReconciliation)
      .set(updateData)
      .where(eq(paymentReconciliation.id, reconciliationId))
      .returning();
    return result[0] || null;
  }
  
  // Payout batch management
  async createPayoutBatch(
    contractorId: string,
    periodStart: Date,
    periodEnd: Date,
    reconciliationId?: string,
    createdBy?: string
  ): Promise<PayoutBatch> {
    const { default: paymentReconciliationService } = await import('./services/payment-reconciliation-service');
    return await paymentReconciliationService.createPayoutBatch(contractorId, periodStart, periodEnd, reconciliationId, createdBy);
  }
  
  async processPayoutBatch(batchId: string, paymentMethod: string, paymentReference?: string): Promise<PayoutBatch> {
    const { default: paymentReconciliationService } = await import('./services/payment-reconciliation-service');
    return await paymentReconciliationService.processPayoutBatch(batchId, paymentMethod, paymentReference);
  }
  
  async getPendingPayouts(contractorId?: string): Promise<PayoutBatch[]> {
    const { default: paymentReconciliationService } = await import('./services/payment-reconciliation-service');
    return await paymentReconciliationService.getPendingPayouts(contractorId);
  }
  
  async getPayoutBatchById(batchId: string): Promise<PayoutBatch | null> {
    const result = await db
      .select()
      .from(payoutBatches)
      .where(eq(payoutBatches.id, batchId))
      .limit(1);
    return result[0] || null;
  }
  
  async updatePayoutBatchStatus(batchId: string, status: string, failureReason?: string): Promise<PayoutBatch | null> {
    const updateData: any = {
      status,
      updatedAt: new Date()
    };
    
    if (status === 'completed') {
      updateData.paidAt = new Date();
    } else if (status === 'failed') {
      updateData.failedAt = new Date();
      updateData.failureReason = failureReason;
      updateData.retryCount = sql`${payoutBatches.retryCount} + 1`;
      updateData.lastRetryAt = new Date();
    } else if (status === 'processing') {
      updateData.processedAt = new Date();
    } else if (status === 'cancelled') {
      updateData.cancelledAt = new Date();
    }
    
    const result = await db
      .update(payoutBatches)
      .set(updateData)
      .where(eq(payoutBatches.id, batchId))
      .returning();
    return result[0] || null;
  }
  
  // Contractor earnings
  async getContractorEarnings(
    contractorId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalEarnings: number;
    totalCommissions: number;
    netPayout: number;
    pendingPayouts: number;
    completedPayouts: number;
    transactions: CommissionTransaction[];
  }> {
    const { default: paymentReconciliationService } = await import('./services/payment-reconciliation-service');
    return await paymentReconciliationService.getContractorEarnings(contractorId, startDate, endDate);
  }
  
  async getContractorMonthlyVolume(contractorId: string, month?: Date): Promise<number> {
    const targetMonth = month || new Date();
    const startOfMonth = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1);
    const endOfMonth = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0, 23, 59, 59, 999);
    
    const result = await db
      .select({
        totalVolume: sql<number>`COALESCE(SUM(CAST(${commissionTransactions.baseAmount} AS DECIMAL)), 0)`
      })
      .from(commissionTransactions)
      .where(
        and(
          eq(commissionTransactions.contractorId, contractorId),
          between(commissionTransactions.createdAt, startOfMonth, endOfMonth),
          ne(commissionTransactions.status, 'disputed')
        )
      );
    
    return result[0]?.totalVolume || 0;
  }
  
  // Commission disputes and adjustments
  async handleCommissionDispute(
    transactionId: string,
    disputeReason: string,
    adjustmentAmount?: number
  ): Promise<CommissionTransaction> {
    const { default: paymentReconciliationService } = await import('./services/payment-reconciliation-service');
    return await paymentReconciliationService.handleCommissionDispute(transactionId, disputeReason, adjustmentAmount);
  }
  
  async getDisputedCommissions(contractorId?: string): Promise<CommissionTransaction[]> {
    const conditions = [eq(commissionTransactions.isDisputed, true)];
    
    if (contractorId) {
      conditions.push(eq(commissionTransactions.contractorId, contractorId));
    }
    
    return await db
      .select()
      .from(commissionTransactions)
      .where(and(...conditions))
      .orderBy(desc(commissionTransactions.createdAt));
  }
  
  async resolveCommissionDispute(transactionId: string, resolution: string): Promise<CommissionTransaction> {
    const result = await db
      .update(commissionTransactions)
      .set({
        isDisputed: false,
        adjustmentReason: resolution,
        status: 'adjusted',
        updatedAt: new Date()
      })
      .where(eq(commissionTransactions.id, transactionId))
      .returning();
    return result[0];
  }

  // ==================== SERVICE HISTORY IMPLEMENTATION ====================

  async recordServiceHistory(data: InsertServiceHistory): Promise<ServiceHistory> {
    const [result] = await db.insert(serviceHistory).values(data).returning();
    return result;
  }

  async getVehicleServiceHistory(vehicleId: string, options?: {
    limit?: number;
    offset?: number;
    orderBy?: string;
    orderDir?: 'asc' | 'desc';
    startDate?: Date;
    endDate?: Date;
    serviceType?: string;
    hasWarranty?: boolean;
  }): Promise<ServiceHistory[]> {
    const conditions = [eq(serviceHistory.vehicleId, vehicleId)];
    
    if (options?.startDate) {
      conditions.push(gte(serviceHistory.serviceDate, options.startDate));
    }
    
    if (options?.endDate) {
      conditions.push(lte(serviceHistory.serviceDate, options.endDate));
    }
    
    if (options?.serviceType) {
      conditions.push(eq(serviceHistory.serviceType, options.serviceType as any));
    }
    
    if (options?.hasWarranty) {
      conditions.push(isNotNull(serviceHistory.warrantyExpiresAt));
      conditions.push(gte(serviceHistory.warrantyExpiresAt, new Date()));
    }
    
    let query = db.select().from(serviceHistory).where(and(...conditions));
    
    // Apply ordering
    const orderDir = options?.orderDir === 'asc' ? asc : desc;
    if (options?.orderBy === 'serviceDate') {
      query = query.orderBy(orderDir(serviceHistory.serviceDate));
    } else if (options?.orderBy === 'totalCost') {
      query = query.orderBy(orderDir(serviceHistory.totalCost));
    } else {
      query = query.orderBy(desc(serviceHistory.serviceDate));
    }
    
    // Apply pagination
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.offset(options.offset);
    }
    
    return await query;
  }

  async updateServiceSchedule(vehicleId: string, serviceType: string, data: InsertServiceSchedule): Promise<ServiceSchedule | null> {
    // Check if schedule exists
    const existing = await db
      .select()
      .from(serviceSchedules)
      .where(
        and(
          eq(serviceSchedules.vehicleId, vehicleId),
          eq(serviceSchedules.serviceType, serviceType as any)
        )
      )
      .limit(1);
    
    if (existing[0]) {
      // Update existing schedule
      const [updated] = await db
        .update(serviceSchedules)
        .set({ ...data, updatedAt: new Date() })
        .where(
          and(
            eq(serviceSchedules.vehicleId, vehicleId),
            eq(serviceSchedules.serviceType, serviceType as any)
          )
        )
        .returning();
      return updated;
    } else {
      // Create new schedule
      const [created] = await db.insert(serviceSchedules).values(data).returning();
      return created;
    }
  }

  async getUpcomingServices(vehicleId: string): Promise<ServiceSchedule[]> {
    const result = await db
      .select()
      .from(serviceSchedules)
      .where(
        and(
          eq(serviceSchedules.vehicleId, vehicleId),
          eq(serviceSchedules.isActive, true)
        )
      )
      .orderBy(asc(serviceSchedules.nextDueDate));
    
    return result;
  }

  async createServiceRecommendation(data: InsertServiceRecommendation): Promise<ServiceRecommendation> {
    const [result] = await db.insert(serviceRecommendations).values(data).returning();
    return result;
  }

  async getServiceRecommendations(vehicleId: string, filters?: {
    priority?: string;
    isCompleted?: boolean;
    isDismissed?: boolean;
  }): Promise<ServiceRecommendation[]> {
    const conditions = [eq(serviceRecommendations.vehicleId, vehicleId)];
    
    if (filters?.priority) {
      conditions.push(eq(serviceRecommendations.priority, filters.priority as any));
    }
    
    if (filters?.isCompleted !== undefined) {
      conditions.push(eq(serviceRecommendations.isCompleted, filters.isCompleted));
    }
    
    if (filters?.isDismissed !== undefined) {
      conditions.push(eq(serviceRecommendations.isDismissed, filters.isDismissed));
    }
    
    return await db
      .select()
      .from(serviceRecommendations)
      .where(and(...conditions))
      .orderBy(desc(serviceRecommendations.priority), asc(serviceRecommendations.recommendedDate));
  }

  async markRecommendationCompleted(recommendationId: string, jobId: string): Promise<ServiceRecommendation | null> {
    const [result] = await db
      .update(serviceRecommendations)
      .set({
        isCompleted: true,
        completedAt: new Date(),
        completedJobId: jobId,
        updatedAt: new Date()
      })
      .where(eq(serviceRecommendations.id, recommendationId))
      .returning();
    
    return result || null;
  }

  async dismissRecommendation(recommendationId: string, userId: string, reason?: string): Promise<ServiceRecommendation | null> {
    const [result] = await db
      .update(serviceRecommendations)
      .set({
        isDismissed: true,
        dismissedAt: new Date(),
        dismissedBy: userId,
        dismissalReason: reason || null,
        updatedAt: new Date()
      })
      .where(eq(serviceRecommendations.id, recommendationId))
      .returning();
    
    return result || null;
  }

  async getMaintenanceReport(vehicleId: string, dateRange?: { startDate: Date; endDate: Date }): Promise<{
    vehicle: FleetVehicle;
    serviceHistory: ServiceHistory[];
    upcomingServices: ServiceSchedule[];
    recommendations: ServiceRecommendation[];
    statistics: {
      totalServices: number;
      totalCost: string;
      avgCostPerService: string;
      mostFrequentService: string;
    };
  }> {
    // Get vehicle
    const vehicle = await this.getFleetVehicle(vehicleId);
    if (!vehicle) {
      throw new Error('Vehicle not found');
    }
    
    // Get service history
    const history = await this.getVehicleServiceHistory(vehicleId, {
      startDate: dateRange?.startDate,
      endDate: dateRange?.endDate,
      limit: 1000
    });
    
    // Get upcoming services
    const upcoming = await this.getUpcomingServices(vehicleId);
    
    // Get recommendations
    const recs = await this.getServiceRecommendations(vehicleId, {
      isCompleted: false,
      isDismissed: false
    });
    
    // Calculate statistics
    const totalCost = history.reduce((sum, s) => sum + parseFloat(s.totalCost || '0'), 0);
    const totalServices = history.length;
    const avgCostPerService = totalServices > 0 ? totalCost / totalServices : 0;
    
    // Find most frequent service
    const serviceTypeCounts: Record<string, number> = {};
    history.forEach(s => {
      serviceTypeCounts[s.serviceType] = (serviceTypeCounts[s.serviceType] || 0) + 1;
    });
    const mostFrequentService = Object.entries(serviceTypeCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'none';
    
    return {
      vehicle,
      serviceHistory: history,
      upcomingServices: upcoming,
      recommendations: recs,
      statistics: {
        totalServices,
        totalCost: totalCost.toFixed(2),
        avgCostPerService: avgCostPerService.toFixed(2),
        mostFrequentService
      }
    };
  }

  async getServiceSchedule(vehicleId: string, serviceType: string): Promise<ServiceSchedule | null> {
    const result = await db
      .select()
      .from(serviceSchedules)
      .where(
        and(
          eq(serviceSchedules.vehicleId, vehicleId),
          eq(serviceSchedules.serviceType, serviceType as any)
        )
      )
      .limit(1);
    
    return result[0] || null;
  }

  async updateServiceSchedulesAlertTime(vehicleId: string): Promise<void> {
    await db
      .update(serviceSchedules)
      .set({
        alertSentAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(serviceSchedules.vehicleId, vehicleId));
  }

  async createMaintenanceLog(data: InsertVehicleMaintenanceLog): Promise<VehicleMaintenanceLog> {
    const [result] = await db.insert(vehicleMaintenanceLogs).values(data).returning();
    return result;
  }

  async getVehicleMaintenanceLogs(vehicleId: string, options?: {
    limit?: number;
    offset?: number;
    startDate?: Date;
    endDate?: Date;
    logType?: string;
  }): Promise<VehicleMaintenanceLog[]> {
    const conditions = [eq(vehicleMaintenanceLogs.vehicleId, vehicleId)];
    
    if (options?.startDate) {
      conditions.push(gte(vehicleMaintenanceLogs.entryDate, options.startDate));
    }
    
    if (options?.endDate) {
      conditions.push(lte(vehicleMaintenanceLogs.entryDate, options.endDate));
    }
    
    if (options?.logType) {
      conditions.push(eq(vehicleMaintenanceLogs.logType, options.logType as any));
    }
    
    let query = db
      .select()
      .from(vehicleMaintenanceLogs)
      .where(and(...conditions))
      .orderBy(desc(vehicleMaintenanceLogs.entryDate));
    
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.offset(options.offset);
    }
    
    return await query;
  }

  async getFleetVehicle(vehicleId: string): Promise<FleetVehicle | null> {
    const result = await db
      .select()
      .from(fleetVehicles)
      .where(eq(fleetVehicles.id, vehicleId))
      .limit(1);
    
    return result[0] || null;
  }

  async getFleetContacts(fleetAccountId: string): Promise<FleetContact[]> {
    return await db
      .select()
      .from(fleetContacts)
      .where(eq(fleetContacts.fleetAccountId, fleetAccountId));
  }

  async serviceHistoryExistsForJob(jobId: string): Promise<boolean> {
    const result = await db
      .select({ id: serviceHistory.id })
      .from(serviceHistory)
      .where(eq(serviceHistory.jobId, jobId))
      .limit(1);
    
    return result.length > 0;
  }
  
  // ==================== BOOKING PREFERENCES IMPLEMENTATION ====================
  
  async saveBookingPreferences(userId: string, preferences: InsertBookingPreferences): Promise<BookingPreferences> {
    // Check if preferences already exist
    const existing = await this.getBookingPreferences(userId);
    
    if (existing) {
      // Update existing preferences
      const [updated] = await db
        .update(bookingPreferences)
        .set({
          ...preferences,
          updatedAt: new Date()
        })
        .where(eq(bookingPreferences.userId, userId))
        .returning();
      return updated;
    }
    
    // Create new preferences
    const [created] = await db
      .insert(bookingPreferences)
      .values({
        ...preferences,
        userId
      })
      .returning();
    return created;
  }
  
  async getBookingPreferences(userId: string): Promise<BookingPreferences | null> {
    const [prefs] = await db
      .select()
      .from(bookingPreferences)
      .where(eq(bookingPreferences.userId, userId))
      .limit(1);
    
    return prefs || null;
  }
  
  async addFavoriteContractor(userId: string, contractorId: string, notes?: string): Promise<FavoriteContractor> {
    // Check if already favorited
    const [existing] = await db
      .select()
      .from(favoriteContractors)
      .where(
        and(
          eq(favoriteContractors.userId, userId),
          eq(favoriteContractors.contractorId, contractorId)
        )
      )
      .limit(1);
    
    if (existing) {
      // Update existing favorite
      const [updated] = await db
        .update(favoriteContractors)
        .set({ notes })
        .where(eq(favoriteContractors.id, existing.id))
        .returning();
      return updated;
    }
    
    // Add new favorite
    const [favorite] = await db
      .insert(favoriteContractors)
      .values({
        userId,
        contractorId,
        notes
      })
      .returning();
    
    return favorite;
  }
  
  async removeFavoriteContractor(userId: string, contractorId: string): Promise<boolean> {
    const result = await db
      .delete(favoriteContractors)
      .where(
        and(
          eq(favoriteContractors.userId, userId),
          eq(favoriteContractors.contractorId, contractorId)
        )
      );
    
    return !!result.rowCount;
  }
  
  async getFavoriteContractors(userId: string): Promise<FavoriteContractor[]> {
    return await db
      .select()
      .from(favoriteContractors)
      .where(eq(favoriteContractors.userId, userId))
      .orderBy(desc(favoriteContractors.priority));
  }
  
  async blacklistContractor(userId: string, contractorId: string, reason?: string): Promise<ContractorBlacklist> {
    // Check if already blacklisted
    const [existing] = await db
      .select()
      .from(contractorBlacklist)
      .where(
        and(
          eq(contractorBlacklist.userId, userId),
          eq(contractorBlacklist.contractorId, contractorId),
          isNull(contractorBlacklist.unblockedAt)
        )
      )
      .limit(1);
    
    if (existing) {
      return existing;
    }
    
    // Add to blacklist
    const [blacklisted] = await db
      .insert(contractorBlacklist)
      .values({
        userId,
        contractorId,
        reason
      })
      .returning();
    
    // Remove from favorites if exists
    await this.removeFavoriteContractor(userId, contractorId);
    
    return blacklisted;
  }
  
  async unblacklistContractor(userId: string, contractorId: string): Promise<boolean> {
    const result = await db
      .update(contractorBlacklist)
      .set({ unblockedAt: new Date() })
      .where(
        and(
          eq(contractorBlacklist.userId, userId),
          eq(contractorBlacklist.contractorId, contractorId),
          isNull(contractorBlacklist.unblockedAt)
        )
      );
    
    return !!result.rowCount;
  }
  
  async getBlacklistedContractors(userId: string): Promise<ContractorBlacklist[]> {
    return await db
      .select()
      .from(contractorBlacklist)
      .where(
        and(
          eq(contractorBlacklist.userId, userId),
          isNull(contractorBlacklist.unblockedAt)
        )
      );
  }
  
  async isContractorBlacklisted(userId: string, contractorId: string): Promise<boolean> {
    const [blacklisted] = await db
      .select()
      .from(contractorBlacklist)
      .where(
        and(
          eq(contractorBlacklist.userId, userId),
          eq(contractorBlacklist.contractorId, contractorId),
          isNull(contractorBlacklist.unblockedAt)
        )
      )
      .limit(1);
    
    return !!blacklisted;
  }
  
  async createBookingTemplate(template: InsertBookingTemplate): Promise<BookingTemplate> {
    // If this is set as default, unset other defaults
    if (template.isDefault) {
      await db
        .update(bookingTemplates)
        .set({ isDefault: false })
        .where(eq(bookingTemplates.userId, template.userId));
    }
    
    const [created] = await db
      .insert(bookingTemplates)
      .values(template)
      .returning();
    
    return created;
  }
  
  async updateBookingTemplate(templateId: string, updates: Partial<InsertBookingTemplate>): Promise<BookingTemplate | null> {
    // Handle default flag
    if (updates.isDefault) {
      const [template] = await db
        .select()
        .from(bookingTemplates)
        .where(eq(bookingTemplates.id, templateId))
        .limit(1);
      
      if (template) {
        await db
          .update(bookingTemplates)
          .set({ isDefault: false })
          .where(
            and(
              eq(bookingTemplates.userId, template.userId),
              ne(bookingTemplates.id, templateId)
            )
          );
      }
    }
    
    const [updated] = await db
      .update(bookingTemplates)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(bookingTemplates.id, templateId))
      .returning();
    
    return updated || null;
  }
  
  async deleteBookingTemplate(templateId: string): Promise<boolean> {
    const result = await db
      .delete(bookingTemplates)
      .where(eq(bookingTemplates.id, templateId));
    
    return !!result.rowCount;
  }
  
  async getBookingTemplates(userId: string): Promise<BookingTemplate[]> {
    return await db
      .select()
      .from(bookingTemplates)
      .where(eq(bookingTemplates.userId, userId))
      .orderBy(desc(bookingTemplates.isDefault), desc(bookingTemplates.usageCount));
  }
  
  async getBookingTemplate(templateId: string): Promise<BookingTemplate | null> {
    const [template] = await db
      .select()
      .from(bookingTemplates)
      .where(eq(bookingTemplates.id, templateId))
      .limit(1);
    
    return template || null;
  }
  
  async applyBookingTemplate(templateId: string): Promise<Partial<Job>> {
    const template = await this.getBookingTemplate(templateId);
    if (!template) {
      throw new Error('Template not found');
    }
    
    // Record usage
    await this.recordTemplateUsage(templateId);
    
    // Convert template to job data
    const jobData: Partial<Job> = {
      serviceTypeId: template.serviceType || undefined,
      vehicleId: template.vehicleId || undefined,
      specialInstructions: template.specialInstructions || undefined
    };
    
    // Add location data if available
    if (template.locationPreferences && typeof template.locationPreferences === 'object') {
      const locPrefs = template.locationPreferences as any;
      if (locPrefs.lat) jobData.locationLat = String(locPrefs.lat);
      if (locPrefs.lng) jobData.locationLng = String(locPrefs.lng);
      if (locPrefs.address) jobData.locationAddress = locPrefs.address;
    }
    
    return jobData;
  }
  
  async recordTemplateUsage(templateId: string): Promise<void> {
    await db
      .update(bookingTemplates)
      .set({
        usageCount: sql`${bookingTemplates.usageCount} + 1`,
        lastUsedAt: new Date()
      })
      .where(eq(bookingTemplates.id, templateId));
  }
}

// Export the PostgreSQL storage instance
export const storage = new PostgreSQLStorage();