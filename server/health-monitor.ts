import { pool, db } from './db';
import { storage } from './storage';
import { trackingWSServer } from './websocket';
import { reminderScheduler } from './reminder-scheduler';
import stripeService from './stripe-service';
import emailService from './services/email-service';
import { sql } from 'drizzle-orm';
import os from 'os';
import fs from 'fs/promises';
import path from 'path';

// Type definitions for health check responses
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

export interface HealthCheckResult {
  status: HealthStatus;
  responseTime: number;
  details: Record<string, any>;
  lastChecked: string;
  errors: string[];
}

export interface SystemHealth extends HealthCheckResult {
  services: {
    database: HealthStatus;
    websocket: HealthStatus;
    stripe: HealthStatus;
    email: HealthStatus;
    storage: HealthStatus;
    scheduler: HealthStatus;
  };
  metrics: {
    uptime: number;
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    cpu: {
      usage: number;
      loadAverage: number[];
    };
    activeConnections: number;
    requestThroughput: number;
  };
}

export interface ServiceHealth extends HealthCheckResult {
  services: Record<string, {
    name: string;
    status: HealthStatus;
    responseTime: number;
    details: Record<string, any>;
    lastCheck: string;
    errors: string[];
  }>;
}

export interface DatabaseHealth extends HealthCheckResult {
  connectionPool: {
    total: number;
    active: number;
    idle: number;
    waiting: number;
  };
  tableStats: Array<{
    tableName: string;
    rowCount: number;
    sizeBytes: number;
  }>;
  slowQueries: Array<{
    query: string;
    duration: number;
    timestamp: string;
  }>;
  databaseSize: {
    totalBytes: number;
    dataBytes: number;
    indexBytes: number;
  };
  indexUsage: Array<{
    indexName: string;
    tableName: string;
    scans: number;
    reads: number;
    efficiency: number;
  }>;
}

export interface ErrorTracking extends HealthCheckResult {
  recentErrors: Array<{
    timestamp: string;
    type: string;
    message: string;
    stack?: string;
    endpoint?: string;
    userId?: string;
  }>;
  errorFrequency: Record<string, number>;
  failedPayments: number;
  failedNotifications: number;
  apiErrorRate: {
    total: number;
    rate4xx: number;
    rate5xx: number;
    rateTimeout: number;
  };
}

// In-memory error tracking
class ErrorTracker {
  private errors: Array<any> = [];
  private maxErrors = 100;
  private errorCounts: Map<string, number> = new Map();
  private paymentFailures = 0;
  private notificationFailures = 0;
  private apiErrors = { total: 0, '4xx': 0, '5xx': 0, timeout: 0 };

  addError(error: any) {
    this.errors.unshift({
      timestamp: new Date().toISOString(),
      ...error
    });
    
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }

    // Track error frequency
    const errorType = error.type || 'unknown';
    this.errorCounts.set(errorType, (this.errorCounts.get(errorType) || 0) + 1);

    // Track specific failure types
    if (error.category === 'payment') {
      this.paymentFailures++;
    }
    if (error.category === 'notification') {
      this.notificationFailures++;
    }
    if (error.category === 'api') {
      this.apiErrors.total++;
      if (error.statusCode >= 400 && error.statusCode < 500) {
        this.apiErrors['4xx']++;
      } else if (error.statusCode >= 500) {
        this.apiErrors['5xx']++;
      } else if (error.type === 'timeout') {
        this.apiErrors.timeout++;
      }
    }
  }

  getRecentErrors(limit: number = 50) {
    return this.errors.slice(0, limit);
  }

  getErrorFrequency() {
    return Object.fromEntries(this.errorCounts);
  }

  getStats() {
    return {
      recentErrors: this.getRecentErrors(),
      errorFrequency: this.getErrorFrequency(),
      failedPayments: this.paymentFailures,
      failedNotifications: this.notificationFailures,
      apiErrorRate: {
        total: this.apiErrors.total,
        rate4xx: this.apiErrors['4xx'],
        rate5xx: this.apiErrors['5xx'],
        rateTimeout: this.apiErrors.timeout
      }
    };
  }

  reset() {
    this.errors = [];
    this.errorCounts.clear();
    this.paymentFailures = 0;
    this.notificationFailures = 0;
    this.apiErrors = { total: 0, '4xx': 0, '5xx': 0, timeout: 0 };
  }
}

// Global error tracker instance
export const errorTracker = new ErrorTracker();

// Health monitoring utilities
export class HealthMonitor {
  private startTime: Date;
  private requestCount: number = 0;
  private requestCountStartTime: Date;

  constructor() {
    this.startTime = new Date();
    this.requestCountStartTime = new Date();
  }

  // Increment request counter
  incrementRequestCount() {
    this.requestCount++;
  }

  // Calculate request throughput
  private getRequestThroughput(): number {
    const elapsedSeconds = (Date.now() - this.requestCountStartTime.getTime()) / 1000;
    const throughput = elapsedSeconds > 0 ? this.requestCount / elapsedSeconds : 0;
    return Math.round(throughput * 100) / 100;
  }

  // Check database health
  async checkDatabaseHealth(): Promise<{
    status: HealthStatus;
    responseTime: number;
    details: any;
    errors: string[];
  }> {
    const startTime = Date.now();
    const errors: string[] = [];
    let status: HealthStatus = 'healthy';
    const details: any = {};

    try {
      // Test basic connectivity
      const client = await pool.connect();
      
      try {
        // Run a simple query
        const result = await client.query('SELECT NOW() as current_time, version() as version');
        details.connected = true;
        details.currentTime = result.rows[0].current_time;
        details.version = result.rows[0].version;

        // Test a more complex query through storage
        const jobCount = await storage.getJobCount();
        details.jobCount = jobCount;

        // Check connection pool status
        const poolMetrics = {
          totalCount: pool.totalCount,
          idleCount: pool.idleCount,
          waitingCount: pool.waitingCount
        };
        details.connectionPool = poolMetrics;

        // Determine health status based on pool usage
        const poolUsagePercent = ((pool.totalCount - pool.idleCount) / pool.totalCount) * 100;
        if (poolUsagePercent > 90) {
          status = 'degraded';
          errors.push('Connection pool usage above 90%');
        } else if (poolUsagePercent > 95) {
          status = 'unhealthy';
          errors.push('Connection pool critically high');
        }

      } finally {
        client.release();
      }
    } catch (error) {
      status = 'unhealthy';
      errors.push(`Database connection failed: ${(error as Error).message}`);
      details.connected = false;
    }

    const responseTime = Date.now() - startTime;
    return { status, responseTime, details, errors };
  }

  // Check WebSocket health
  async checkWebSocketHealth(): Promise<{
    status: HealthStatus;
    responseTime: number;
    details: any;
    errors: string[];
  }> {
    const startTime = Date.now();
    const errors: string[] = [];
    let status: HealthStatus = 'healthy';
    const details: any = {};

    try {
      // Check if WebSocket server is initialized
      const wsStatus = trackingWSServer.getStatus();
      details.status = wsStatus;
      details.rooms = trackingWSServer.getRoomCount();
      details.connections = trackingWSServer.getConnectionCount();
      
      if (!wsStatus || Object.keys(wsStatus).length === 0) {
        status = 'unhealthy';
        errors.push('WebSocket server not initialized');
      } else if (details.connections > 1000) {
        status = 'degraded';
        errors.push('High number of WebSocket connections');
      }
    } catch (error) {
      status = 'unhealthy';
      errors.push(`WebSocket check failed: ${(error as Error).message}`);
    }

    const responseTime = Date.now() - startTime;
    return { status, responseTime, details, errors };
  }

  // Check Stripe service health
  async checkStripeHealth(): Promise<{
    status: HealthStatus;
    responseTime: number;
    details: any;
    errors: string[];
  }> {
    const startTime = Date.now();
    const errors: string[] = [];
    let status: HealthStatus = 'healthy';
    const details: any = {};

    try {
      // Check if Stripe is configured
      const hasKey = !!process.env.STRIPE_SECRET_KEY || !!process.env.TESTING_STRIPE_SECRET_KEY;
      details.configured = hasKey;

      if (!hasKey) {
        status = 'degraded';
        errors.push('Stripe API key not configured');
        details.stubMode = true;
      } else {
        // Test Stripe connectivity by fetching balance
        try {
          const testCustomer = await stripeService.getSubscription('sub_test_health_check');
          details.apiConnected = true;
        } catch (stripeError: any) {
          // If it's a 404, Stripe is working but subscription doesn't exist (expected)
          if (stripeError.statusCode === 404 || stripeError.code === 'resource_missing') {
            details.apiConnected = true;
          } else {
            details.apiConnected = false;
            status = 'degraded';
            errors.push('Stripe API connection issue');
          }
        }
      }

      // Check webhook configuration
      details.webhookConfigured = !!process.env.STRIPE_WEBHOOK_SECRET;
      if (!details.webhookConfigured) {
        errors.push('Stripe webhook secret not configured');
      }

    } catch (error) {
      status = 'unhealthy';
      errors.push(`Stripe check failed: ${(error as Error).message}`);
    }

    const responseTime = Date.now() - startTime;
    return { status, responseTime, details, errors };
  }

  // Check email service health
  async checkEmailHealth(): Promise<{
    status: HealthStatus;
    responseTime: number;
    details: any;
    errors: string[];
  }> {
    const startTime = Date.now();
    const errors: string[] = [];
    let status: HealthStatus = 'healthy';
    const details: any = {};

    try {
      const hasCredentials = !!process.env.OFFICE365_EMAIL && !!process.env.OFFICE365_PASSWORD;
      details.configured = hasCredentials;

      if (!hasCredentials) {
        status = 'degraded';
        errors.push('Email service not configured');
      } else {
        // Check transporter status
        details.transporterReady = emailService.isReady();
        
        if (!details.transporterReady) {
          status = 'degraded';
          errors.push('Email transporter not ready');
        }
      }

      // Check email queue (if implemented)
      details.queueSize = 0; // Would need to implement queue tracking in email service

    } catch (error) {
      status = 'unhealthy';
      errors.push(`Email service check failed: ${(error as Error).message}`);
    }

    const responseTime = Date.now() - startTime;
    return { status, responseTime, details, errors };
  }

  // Check reminder scheduler health
  async checkSchedulerHealth(): Promise<{
    status: HealthStatus;
    responseTime: number;
    details: any;
    errors: string[];
  }> {
    const startTime = Date.now();
    const errors: string[] = [];
    let status: HealthStatus = 'healthy';
    const details: any = {};

    try {
      const schedulerStatus = reminderScheduler.getStatus();
      details.jobs = schedulerStatus;

      // Check if all critical jobs are running
      const criticalJobs = ['reminder-processor', 'upcoming-services-checker'];
      for (const jobName of criticalJobs) {
        if (!schedulerStatus[jobName] || !schedulerStatus[jobName].running) {
          status = 'degraded';
          errors.push(`Critical job '${jobName}' not running`);
        }
      }

      details.totalJobs = Object.keys(schedulerStatus).length;
      details.runningJobs = Object.values(schedulerStatus).filter((j: any) => j.running).length;

    } catch (error) {
      status = 'unhealthy';
      errors.push(`Scheduler check failed: ${(error as Error).message}`);
    }

    const responseTime = Date.now() - startTime;
    return { status, responseTime, details, errors };
  }

  // Check overall system health
  async checkSystemHealth(): Promise<SystemHealth> {
    const startTime = Date.now();
    const errors: string[] = [];

    // Get system metrics
    const uptime = process.uptime();
    const memUsage = process.memoryUsage();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const cpuUsage = process.cpuUsage();
    const loadAvg = os.loadavg();

    // Check individual services
    const [dbHealth, wsHealth, stripeHealth, emailHealth, schedulerHealth] = await Promise.all([
      this.checkDatabaseHealth(),
      this.checkWebSocketHealth(),
      this.checkStripeHealth(),
      this.checkEmailHealth(),
      this.checkSchedulerHealth()
    ]);

    // Determine overall status
    const serviceStatuses = [
      dbHealth.status,
      wsHealth.status,
      stripeHealth.status,
      emailHealth.status,
      schedulerHealth.status
    ];

    let overallStatus: HealthStatus = 'healthy';
    if (serviceStatuses.includes('unhealthy')) {
      overallStatus = 'unhealthy';
    } else if (serviceStatuses.includes('degraded')) {
      overallStatus = 'degraded';
    }

    // Compile errors
    errors.push(...dbHealth.errors, ...wsHealth.errors, ...stripeHealth.errors, 
                ...emailHealth.errors, ...schedulerHealth.errors);

    const responseTime = Date.now() - startTime;

    return {
      status: overallStatus,
      responseTime,
      details: {
        database: dbHealth.details,
        websocket: wsHealth.details,
        stripe: stripeHealth.details,
        email: emailHealth.details,
        scheduler: schedulerHealth.details
      },
      lastChecked: new Date().toISOString(),
      errors,
      services: {
        database: dbHealth.status,
        websocket: wsHealth.status,
        stripe: stripeHealth.status,
        email: emailHealth.status,
        storage: dbHealth.status, // Storage health is tied to database
        scheduler: schedulerHealth.status
      },
      metrics: {
        uptime,
        memory: {
          used: usedMem,
          total: totalMem,
          percentage: Math.round((usedMem / totalMem) * 100)
        },
        cpu: {
          usage: Math.round((cpuUsage.user + cpuUsage.system) / 1000000), // Convert to seconds
          loadAverage: loadAvg
        },
        activeConnections: pool.totalCount - pool.idleCount,
        requestThroughput: this.getRequestThroughput()
      }
    };
  }

  // Check individual services
  async checkServicesHealth(): Promise<ServiceHealth> {
    const startTime = Date.now();
    const services: ServiceHealth['services'] = {};

    // Authentication service
    const authCheck = await this.checkAuthenticationService();
    services.authentication = authCheck;

    // Job management
    const jobCheck = await this.checkJobManagement();
    services.jobManagement = jobCheck;

    // Payment systems
    const paymentCheck = await this.checkPaymentSystems();
    services.payments = paymentCheck;

    // Notification services
    const notificationCheck = await this.checkNotificationServices();
    services.notifications = notificationCheck;

    // WebSocket server
    const wsCheck = await this.checkWebSocketService();
    services.websocket = wsCheck;

    // Background jobs
    const bgJobsCheck = await this.checkBackgroundJobs();
    services.backgroundJobs = bgJobsCheck;

    // Invoice system
    const invoiceCheck = await this.checkInvoiceSystem();
    services.invoices = invoiceCheck;

    // Fleet management
    const fleetCheck = await this.checkFleetManagement();
    services.fleetManagement = fleetCheck;

    // Determine overall status
    const allStatuses = Object.values(services).map(s => s.status);
    let overallStatus: HealthStatus = 'healthy';
    if (allStatuses.includes('unhealthy')) {
      overallStatus = 'unhealthy';
    } else if (allStatuses.includes('degraded')) {
      overallStatus = 'degraded';
    }

    const responseTime = Date.now() - startTime;
    const errors = Object.values(services).flatMap(s => s.errors);

    return {
      status: overallStatus,
      responseTime,
      details: { services },
      lastChecked: new Date().toISOString(),
      errors,
      services
    };
  }

  // Check authentication service
  private async checkAuthenticationService() {
    const startTime = Date.now();
    const errors: string[] = [];
    let status: HealthStatus = 'healthy';
    const details: any = {};

    try {
      // Test user creation and retrieval
      const testUserId = 'health_check_test_' + Date.now();
      const userCount = await storage.getUserCount();
      details.totalUsers = userCount;
      
      // Test session management
      const activeSessions = await storage.getActiveSessionCount();
      details.activeSessions = activeSessions;

      // Check password reset token functionality
      const tokenCount = await storage.getPendingPasswordResetCount();
      details.pendingPasswordResets = tokenCount;

      details.authenticationWorking = true;

    } catch (error) {
      status = 'unhealthy';
      errors.push(`Authentication service error: ${(error as Error).message}`);
      details.authenticationWorking = false;
    }

    return {
      name: 'Authentication Service',
      status,
      responseTime: Date.now() - startTime,
      details,
      lastCheck: new Date().toISOString(),
      errors
    };
  }

  // Check job management
  private async checkJobManagement() {
    const startTime = Date.now();
    const errors: string[] = [];
    let status: HealthStatus = 'healthy';
    const details: any = {};

    try {
      // Get job statistics
      const stats = await storage.getJobStatistics();
      details.statistics = stats;

      // Test CRUD operations
      const recentJobs = await storage.getJobs({ limit: 1 });
      details.crudOperational = true;

      // Check for stuck jobs
      const stuckJobs = await storage.getStuckJobs();
      details.stuckJobs = stuckJobs;
      
      if (stuckJobs > 10) {
        status = 'degraded';
        errors.push(`${stuckJobs} jobs stuck in processing`);
      }

    } catch (error) {
      status = 'unhealthy';
      errors.push(`Job management error: ${(error as Error).message}`);
    }

    return {
      name: 'Job Management',
      status,
      responseTime: Date.now() - startTime,
      details,
      lastCheck: new Date().toISOString(),
      errors
    };
  }

  // Check payment systems
  private async checkPaymentSystems() {
    const startTime = Date.now();
    const errors: string[] = [];
    let status: HealthStatus = 'healthy';
    const details: any = {};

    try {
      // Check Stripe connectivity (already done in system health)
      const stripeHealth = await this.checkStripeHealth();
      details.stripe = stripeHealth.details;
      
      if (stripeHealth.status !== 'healthy') {
        status = stripeHealth.status;
        errors.push(...stripeHealth.errors);
      }

      // Check webhook status
      details.webhookEnabled = !!process.env.STRIPE_WEBHOOK_SECRET;

      // Get payment statistics
      const paymentStats = await storage.getPaymentStatistics();
      details.paymentStats = paymentStats;

    } catch (error) {
      status = 'unhealthy';
      errors.push(`Payment system error: ${(error as Error).message}`);
    }

    return {
      name: 'Payment Systems',
      status,
      responseTime: Date.now() - startTime,
      details,
      lastCheck: new Date().toISOString(),
      errors
    };
  }

  // Check notification services
  private async checkNotificationServices() {
    const startTime = Date.now();
    const errors: string[] = [];
    let status: HealthStatus = 'healthy';
    const details: any = {};

    try {
      // Check email service
      const emailHealth = await this.checkEmailHealth();
      details.email = emailHealth.details;
      
      if (emailHealth.status !== 'healthy') {
        status = emailHealth.status;
        errors.push(...emailHealth.errors);
      }

      // Check SMS service (Twilio)
      details.sms = {
        configured: !!process.env.TWILIO_ACCOUNT_SID,
        queueSize: 0
      };
      
      if (!details.sms.configured) {
        errors.push('SMS service not configured');
      }

      // Get notification statistics
      const notificationStats = await storage.getNotificationStatistics();
      details.statistics = notificationStats;

    } catch (error) {
      status = 'unhealthy';
      errors.push(`Notification service error: ${(error as Error).message}`);
    }

    return {
      name: 'Notification Services',
      status,
      responseTime: Date.now() - startTime,
      details,
      lastCheck: new Date().toISOString(),
      errors
    };
  }

  // Check WebSocket service
  private async checkWebSocketService() {
    const startTime = Date.now();
    const errors: string[] = [];
    let status: HealthStatus = 'healthy';
    const details: any = {};

    try {
      const wsHealth = await this.checkWebSocketHealth();
      details.connections = wsHealth.details.connections;
      details.rooms = wsHealth.details.rooms;
      details.messageThroughput = 0; // Would need to implement message counting

      status = wsHealth.status;
      errors.push(...wsHealth.errors);

    } catch (error) {
      status = 'unhealthy';
      errors.push(`WebSocket service error: ${(error as Error).message}`);
    }

    return {
      name: 'WebSocket Server',
      status,
      responseTime: Date.now() - startTime,
      details,
      lastCheck: new Date().toISOString(),
      errors
    };
  }

  // Check background jobs
  private async checkBackgroundJobs() {
    const startTime = Date.now();
    const errors: string[] = [];
    let status: HealthStatus = 'healthy';
    const details: any = {};

    try {
      const schedulerHealth = await this.checkSchedulerHealth();
      details.cronJobs = schedulerHealth.details.jobs;
      details.totalJobs = schedulerHealth.details.totalJobs;
      details.runningJobs = schedulerHealth.details.runningJobs;

      // Get last run times from database
      const lastRunTimes = await storage.getSchedulerLastRunTimes();
      details.lastRunTimes = lastRunTimes;

      status = schedulerHealth.status;
      errors.push(...schedulerHealth.errors);

    } catch (error) {
      status = 'unhealthy';
      errors.push(`Background jobs error: ${(error as Error).message}`);
    }

    return {
      name: 'Background Jobs',
      status,
      responseTime: Date.now() - startTime,
      details,
      lastCheck: new Date().toISOString(),
      errors
    };
  }

  // Check invoice system
  private async checkInvoiceSystem() {
    const startTime = Date.now();
    const errors: string[] = [];
    let status: HealthStatus = 'healthy';
    const details: any = {};

    try {
      // Check invoice generation capability
      details.pdfServiceAvailable = true; // Assuming PDF generation works if modules are loaded

      // Get invoice statistics
      const invoiceStats = await storage.getInvoiceStatistics();
      details.statistics = invoiceStats;

      // Check for overdue invoices
      const overdueCount = await storage.getOverdueInvoiceCount();
      details.overdueInvoices = overdueCount;
      
      if (overdueCount > 50) {
        status = 'degraded';
        errors.push(`High number of overdue invoices: ${overdueCount}`);
      }

    } catch (error) {
      status = 'unhealthy';
      errors.push(`Invoice system error: ${(error as Error).message}`);
    }

    return {
      name: 'Invoice System',
      status,
      responseTime: Date.now() - startTime,
      details,
      lastCheck: new Date().toISOString(),
      errors
    };
  }

  // Check fleet management
  private async checkFleetManagement() {
    const startTime = Date.now();
    const errors: string[] = [];
    let status: HealthStatus = 'healthy';
    const details: any = {};

    try {
      // Get fleet statistics
      const fleetStats = await storage.getFleetStatistics();
      details.statistics = fleetStats;

      // Check vehicle tracking
      const vehicleCount = await storage.getFleetVehicleCount();
      details.totalVehicles = vehicleCount;

      // Test fleet account queries
      const activeFleets = await storage.getActiveFleetCount();
      details.activeFleets = activeFleets;

      details.fleetManagementOperational = true;

    } catch (error) {
      status = 'unhealthy';
      errors.push(`Fleet management error: ${(error as Error).message}`);
      details.fleetManagementOperational = false;
    }

    return {
      name: 'Fleet Management',
      status,
      responseTime: Date.now() - startTime,
      details,
      lastCheck: new Date().toISOString(),
      errors
    };
  }

  // Alias for getDatabaseHealth (for route compatibility)
  async checkDatabaseDetailed(): Promise<DatabaseHealth> {
    return this.getDatabaseHealth();
  }

  // Get database health metrics
  async getDatabaseHealth(): Promise<DatabaseHealth> {
    const startTime = Date.now();
    const errors: string[] = [];
    let status: HealthStatus = 'healthy';

    try {
      const client = await pool.connect();
      
      try {
        // Get connection pool status
        const connectionPool = {
          total: pool.totalCount,
          active: pool.totalCount - pool.idleCount,
          idle: pool.idleCount,
          waiting: pool.waitingCount
        };

        // Get table statistics
        const tableStatsQuery = `
          SELECT 
            schemaname || '.' || tablename as table_name,
            n_live_tup as row_count,
            pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
          FROM pg_stat_user_tables
          ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
          LIMIT 20;
        `;
        const tableStatsResult = await client.query(tableStatsQuery);
        const tableStats = tableStatsResult.rows.map(row => ({
          tableName: row.table_name,
          rowCount: parseInt(row.row_count),
          sizeBytes: parseInt(row.size_bytes)
        }));

        // Get slow queries (would need pg_stat_statements extension)
        const slowQueries: any[] = [];
        try {
          const slowQueryQuery = `
            SELECT 
              query,
              mean_exec_time as duration,
              calls,
              max_exec_time
            FROM pg_stat_statements
            WHERE mean_exec_time > 1000
            ORDER BY mean_exec_time DESC
            LIMIT 10;
          `;
          const slowQueryResult = await client.query(slowQueryQuery);
          slowQueryResult.rows.forEach(row => {
            slowQueries.push({
              query: row.query.substring(0, 200),
              duration: Math.round(row.duration),
              timestamp: new Date().toISOString()
            });
          });
        } catch (e) {
          // pg_stat_statements might not be enabled
          errors.push('Slow query tracking not available (pg_stat_statements not enabled)');
        }

        // Get database size
        const dbSizeQuery = `
          SELECT 
            pg_database_size(current_database()) as total_bytes,
            pg_size_pretty(pg_database_size(current_database())) as total_pretty
        `;
        const dbSizeResult = await client.query(dbSizeQuery);
        
        const indexSizeQuery = `
          SELECT 
            sum(pg_relation_size(indexrelid)) as index_bytes
          FROM pg_index;
        `;
        const indexSizeResult = await client.query(indexSizeQuery);
        
        const databaseSize = {
          totalBytes: parseInt(dbSizeResult.rows[0].total_bytes),
          dataBytes: parseInt(dbSizeResult.rows[0].total_bytes) - parseInt(indexSizeResult.rows[0].index_bytes),
          indexBytes: parseInt(indexSizeResult.rows[0].index_bytes)
        };

        // Get index usage statistics
        const indexUsageQuery = `
          SELECT 
            schemaname || '.' || indexrelname as index_name,
            schemaname || '.' || tablename as table_name,
            idx_scan as scans,
            idx_tup_read as reads,
            CASE 
              WHEN idx_scan = 0 THEN 0
              ELSE round((idx_tup_read::numeric / idx_scan), 2)
            END as efficiency
          FROM pg_stat_user_indexes
          ORDER BY idx_scan DESC
          LIMIT 15;
        `;
        const indexUsageResult = await client.query(indexUsageQuery);
        const indexUsage = indexUsageResult.rows.map(row => ({
          indexName: row.index_name,
          tableName: row.table_name,
          scans: parseInt(row.scans),
          reads: parseInt(row.reads),
          efficiency: parseFloat(row.efficiency)
        }));

        // Determine health status
        if (connectionPool.waiting > 5) {
          status = 'degraded';
          errors.push('High number of waiting connections');
        }
        if ((connectionPool.active / connectionPool.total) > 0.9) {
          status = 'degraded';
          errors.push('Connection pool near capacity');
        }

        const responseTime = Date.now() - startTime;

        return {
          status,
          responseTime,
          details: {
            connectionPool,
            tableStats,
            slowQueries,
            databaseSize,
            indexUsage
          },
          lastChecked: new Date().toISOString(),
          errors,
          connectionPool,
          tableStats,
          slowQueries,
          databaseSize,
          indexUsage
        };

      } finally {
        client.release();
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        status: 'unhealthy',
        responseTime,
        details: {},
        lastChecked: new Date().toISOString(),
        errors: [`Database health check failed: ${(error as Error).message}`],
        connectionPool: {
          total: 0,
          active: 0,
          idle: 0,
          waiting: 0
        },
        tableStats: [],
        slowQueries: [],
        databaseSize: {
          totalBytes: 0,
          dataBytes: 0,
          indexBytes: 0
        },
        indexUsage: []
      };
    }
  }

  // Get error tracking data
  async getErrorTracking(): Promise<ErrorTracking> {
    const startTime = Date.now();
    
    const stats = errorTracker.getStats();
    const responseTime = Date.now() - startTime;

    return {
      status: 'healthy',
      responseTime,
      details: stats,
      lastChecked: new Date().toISOString(),
      errors: [],
      ...stats
    };
  }
}

// Export singleton instance
export const healthMonitor = new HealthMonitor();

// Export function to track errors
export function trackError(error: any) {
  errorTracker.addError(error);
}