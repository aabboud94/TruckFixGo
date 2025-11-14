import { db } from "../db";
import { 
  performanceMetrics,
  kpiDefinitions,
  metricSnapshots,
  performanceGoals,
  jobs,
  contractorProfiles,
  fleetAccounts,
  fleetVehicles,
  reviews,
  transactions,
  vehicleAnalytics,
  type PerformanceMetric,
  type InsertPerformanceMetric,
  type KpiDefinition,
  type InsertKpiDefinition,
  type MetricSnapshot,
  type InsertMetricSnapshot,
  type PerformanceGoal,
  type InsertPerformanceGoal,
  jobStatusEnum,
  entityTypeEnum,
  metricTypeEnum,
  performanceStatusEnum,
  kpiCategoryEnum
} from "@shared/schema";
import { eq, and, between, gte, lte, sql, desc, asc, inArray, avg, count, sum, max, min } from "drizzle-orm";
import { format, subMonths, subYears, startOfMonth, endOfMonth, differenceInMinutes, differenceInDays } from "date-fns";

interface DateRange {
  startDate: Date;
  endDate: Date;
}

interface KpiValue {
  name: string;
  value: number;
  unit: string;
  trend?: number; // percentage change
  status?: 'green' | 'yellow' | 'red';
}

interface PerformanceComparison {
  entityId: string;
  entityType: string;
  periods: {
    period: string;
    metrics: Record<string, number>;
  }[];
  changes: Record<string, number>; // percentage changes
}

interface PerformanceTrend {
  metricType: string;
  data: {
    date: Date;
    value: number;
    movingAverage?: number;
  }[];
  trendLine: 'up' | 'down' | 'stable';
  projection?: number; // next period projection
}

class PerformanceMetricsService {
  // Initialize default KPIs
  async initializeKPIs() {
    const defaultKPIs: Partial<KpiDefinition>[] = [
      {
        name: 'average_response_time',
        description: 'Average time from job creation to contractor acceptance',
        formula: 'AVG(EXTRACT(EPOCH FROM (accepted_at - created_at))/60)',
        unit: 'minutes',
        category: 'operational',
        targetValue: '30',
        thresholdGreen: '25',
        thresholdYellow: '35',
        thresholdRed: '45',
        aggregationType: 'average'
      },
      {
        name: 'job_completion_rate',
        description: 'Percentage of jobs completed successfully',
        formula: 'COUNT(CASE WHEN status = "completed" THEN 1 END) * 100.0 / COUNT(*)',
        unit: 'percentage',
        category: 'operational',
        targetValue: '95',
        thresholdGreen: '95',
        thresholdYellow: '90',
        thresholdRed: '85',
        aggregationType: 'average'
      },
      {
        name: 'revenue_per_contractor',
        description: 'Average revenue generated per contractor',
        formula: 'SUM(total_amount) / COUNT(DISTINCT contractor_id)',
        unit: 'dollars',
        category: 'financial',
        targetValue: '5000',
        thresholdGreen: '5000',
        thresholdYellow: '4000',
        thresholdRed: '3000',
        aggregationType: 'average'
      },
      {
        name: 'customer_satisfaction_score',
        description: 'Average customer rating',
        formula: 'AVG(overall_rating)',
        unit: 'rating',
        category: 'quality',
        targetValue: '4.5',
        thresholdGreen: '4.5',
        thresholdYellow: '4.0',
        thresholdRed: '3.5',
        aggregationType: 'average'
      },
      {
        name: 'fleet_utilization_rate',
        description: 'Percentage of fleet vehicles in active use',
        formula: 'COUNT(CASE WHEN status = "active" THEN 1 END) * 100.0 / COUNT(*)',
        unit: 'percentage',
        category: 'operational',
        targetValue: '85',
        thresholdGreen: '85',
        thresholdYellow: '75',
        thresholdRed: '65',
        aggregationType: 'average'
      },
      {
        name: 'cost_per_mile',
        description: 'Average operational cost per mile',
        formula: 'SUM(total_cost) / SUM(mileage)',
        unit: 'dollars',
        category: 'financial',
        targetValue: '2.5',
        thresholdGreen: '2.5',
        thresholdYellow: '3.0',
        thresholdRed: '3.5',
        aggregationType: 'average'
      },
      {
        name: 'on_time_delivery_rate',
        description: 'Percentage of jobs completed on time',
        formula: 'COUNT(CASE WHEN completed_at <= estimated_completion THEN 1 END) * 100.0 / COUNT(*)',
        unit: 'percentage',
        category: 'operational',
        targetValue: '90',
        thresholdGreen: '90',
        thresholdYellow: '85',
        thresholdRed: '80',
        aggregationType: 'average'
      },
      {
        name: 'first_call_resolution_rate',
        description: 'Percentage of issues resolved on first visit',
        formula: 'COUNT(CASE WHEN revisit_count = 0 THEN 1 END) * 100.0 / COUNT(*)',
        unit: 'percentage',
        category: 'quality',
        targetValue: '85',
        thresholdGreen: '85',
        thresholdYellow: '80',
        thresholdRed: '75',
        aggregationType: 'average'
      }
    ];

    // Insert default KPIs if they don't exist
    for (const kpi of defaultKPIs) {
      await db.insert(kpiDefinitions)
        .values(kpi as InsertKpiDefinition)
        .onConflictDoNothing();
    }
  }

  // Calculate real-time KPIs
  async calculateResponseTimeMetrics(entityType: string, entityId: string, dateRange: DateRange) {
    const result = await db
      .select({
        avg: avg(sql`EXTRACT(EPOCH FROM (${jobs.acceptedAt} - ${jobs.createdAt}))/60`),
        median: sql`PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (${jobs.acceptedAt} - ${jobs.createdAt}))/60)`,
        percentile95: sql`PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (${jobs.acceptedAt} - ${jobs.createdAt}))/60)`,
        count: count()
      })
      .from(jobs)
      .where(
        and(
          entityType === 'contractor' ? eq(jobs.contractorId, entityId) :
          entityType === 'fleet' ? eq(jobs.fleetId, entityId) : 
          sql`true`,
          between(jobs.createdAt, dateRange.startDate, dateRange.endDate),
          sql`${jobs.acceptedAt} IS NOT NULL`
        )
      );

    return {
      average: Number(result[0]?.avg || 0),
      median: Number(result[0]?.median || 0),
      percentile95: Number(result[0]?.percentile95 || 0),
      sampleSize: Number(result[0]?.count || 0)
    };
  }

  async calculateCompletionRates(entityType: string, entityId: string, dateRange: DateRange) {
    const result = await db
      .select({
        total: count(),
        completed: count(sql`CASE WHEN ${jobs.status} = 'completed' THEN 1 END`),
        cancelled: count(sql`CASE WHEN ${jobs.status} = 'cancelled' THEN 1 END`),
        inProgress: count(sql`CASE WHEN ${jobs.status} IN ('assigned', 'en_route', 'on_site') THEN 1 END`)
      })
      .from(jobs)
      .where(
        and(
          entityType === 'contractor' ? eq(jobs.contractorId, entityId) :
          entityType === 'fleet' ? eq(jobs.fleetId, entityId) :
          entityType === 'vehicle' ? eq(jobs.vehicleId, entityId) :
          sql`true`,
          between(jobs.createdAt, dateRange.startDate, dateRange.endDate)
        )
      );

    const total = Number(result[0]?.total || 0);
    return {
      completionRate: total > 0 ? (Number(result[0]?.completed || 0) / total) * 100 : 0,
      cancellationRate: total > 0 ? (Number(result[0]?.cancelled || 0) / total) * 100 : 0,
      successRate: total > 0 ? (Number(result[0]?.completed || 0) / (total - Number(result[0]?.inProgress || 0))) * 100 : 0,
      totalJobs: total
    };
  }

  async calculateRevenue(entityType: string, entityId: string, dateRange: DateRange) {
    const result = await db
      .select({
        totalRevenue: sum(jobs.totalAmount),
        avgRevenue: avg(jobs.totalAmount),
        jobCount: count(),
        maxRevenue: max(jobs.totalAmount),
        minRevenue: min(jobs.totalAmount)
      })
      .from(jobs)
      .where(
        and(
          entityType === 'contractor' ? eq(jobs.contractorId, entityId) :
          entityType === 'fleet' ? eq(jobs.fleetId, entityId) :
          entityType === 'vehicle' ? eq(jobs.vehicleId, entityId) :
          sql`true`,
          eq(jobs.status, 'completed'),
          between(jobs.completedAt, dateRange.startDate, dateRange.endDate)
        )
      );

    return {
      total: Number(result[0]?.totalRevenue || 0),
      average: Number(result[0]?.avgRevenue || 0),
      perJob: Number(result[0]?.avgRevenue || 0),
      max: Number(result[0]?.maxRevenue || 0),
      min: Number(result[0]?.minRevenue || 0),
      jobCount: Number(result[0]?.jobCount || 0)
    };
  }

  async calculateSatisfactionScore(entityType: string, entityId: string, dateRange: DateRange) {
    const result = await db
      .select({
        avgRating: avg(reviews.overallRating),
        avgTimeliness: avg(reviews.timelinessRating),
        avgProfessionalism: avg(reviews.professionalismRating),
        avgQuality: avg(reviews.qualityRating),
        avgValue: avg(reviews.valueRating),
        totalReviews: count()
      })
      .from(reviews)
      .innerJoin(jobs, eq(reviews.jobId, jobs.id))
      .where(
        and(
          entityType === 'contractor' ? eq(reviews.contractorId, entityId) :
          entityType === 'fleet' ? eq(jobs.fleetId, entityId) :
          sql`true`,
          between(reviews.createdAt, dateRange.startDate, dateRange.endDate)
        )
      );

    return {
      overall: Number(result[0]?.avgRating || 0),
      timeliness: Number(result[0]?.avgTimeliness || 0),
      professionalism: Number(result[0]?.avgProfessionalism || 0),
      quality: Number(result[0]?.avgQuality || 0),
      value: Number(result[0]?.avgValue || 0),
      reviewCount: Number(result[0]?.totalReviews || 0)
    };
  }

  async calculateFleetUtilization(fleetId: string, dateRange: DateRange) {
    const vehicles = await db
      .select({
        id: fleetVehicles.id,
        status: fleetVehicles.status
      })
      .from(fleetVehicles)
      .where(eq(fleetVehicles.fleetId, fleetId));

    const vehicleIds = vehicles.map(v => v.id);

    const activeJobs = await db
      .select({
        vehicleId: jobs.vehicleId,
        count: count()
      })
      .from(jobs)
      .where(
        and(
          inArray(jobs.vehicleId, vehicleIds),
          between(jobs.createdAt, dateRange.startDate, dateRange.endDate)
        )
      )
      .groupBy(jobs.vehicleId);

    const activeVehicles = new Set(activeJobs.map(j => j.vehicleId));
    const utilizationRate = vehicles.length > 0 ? (activeVehicles.size / vehicles.length) * 100 : 0;

    return {
      utilizationRate,
      totalVehicles: vehicles.length,
      activeVehicles: activeVehicles.size,
      idleVehicles: vehicles.length - activeVehicles.size
    };
  }

  async calculateOnTimeDelivery(entityType: string, entityId: string, dateRange: DateRange) {
    const result = await db
      .select({
        total: count(),
        onTime: count(sql`CASE WHEN ${jobs.completedAt} <= ${jobs.estimatedCompletionTime} THEN 1 END`),
        late: count(sql`CASE WHEN ${jobs.completedAt} > ${jobs.estimatedCompletionTime} THEN 1 END`)
      })
      .from(jobs)
      .where(
        and(
          entityType === 'contractor' ? eq(jobs.contractorId, entityId) :
          entityType === 'fleet' ? eq(jobs.fleetId, entityId) :
          sql`true`,
          eq(jobs.status, 'completed'),
          between(jobs.completedAt, dateRange.startDate, dateRange.endDate),
          sql`${jobs.estimatedCompletionTime} IS NOT NULL`
        )
      );

    const total = Number(result[0]?.total || 0);
    return {
      onTimeRate: total > 0 ? (Number(result[0]?.onTime || 0) / total) * 100 : 0,
      lateRate: total > 0 ? (Number(result[0]?.late || 0) / total) * 100 : 0,
      totalDeliveries: total
    };
  }

  // Record a performance metric
  async recordMetric(metric: InsertPerformanceMetric): Promise<PerformanceMetric> {
    const [recorded] = await db.insert(performanceMetrics)
      .values(metric)
      .returning();
    
    // Check if any goals are affected
    await this.updateGoalProgress(metric.entityType, metric.entityId, metric.metricType);
    
    return recorded;
  }

  // Get performance metrics
  async getPerformanceMetrics(entityType: string, entityId: string, dateRange?: DateRange) {
    const conditions = [
      eq(performanceMetrics.entityType, entityType as any),
      eq(performanceMetrics.entityId, entityId)
    ];

    if (dateRange) {
      conditions.push(between(performanceMetrics.timestamp, dateRange.startDate, dateRange.endDate));
    }

    return await db.select()
      .from(performanceMetrics)
      .where(and(...conditions))
      .orderBy(desc(performanceMetrics.timestamp));
  }

  // Calculate specific KPI
  async calculateKPI(kpiId: string, entityId: string, period: DateRange) {
    const kpi = await db.select()
      .from(kpiDefinitions)
      .where(eq(kpiDefinitions.id, kpiId))
      .limit(1);

    if (!kpi.length) {
      throw new Error('KPI definition not found');
    }

    const definition = kpi[0];
    let value = 0;
    let metadata: any = {};

    // Calculate based on KPI name
    switch (definition.name) {
      case 'average_response_time':
        const responseMetrics = await this.calculateResponseTimeMetrics('contractor', entityId, period);
        value = responseMetrics.average;
        metadata = responseMetrics;
        break;
      
      case 'job_completion_rate':
        const completionMetrics = await this.calculateCompletionRates('contractor', entityId, period);
        value = completionMetrics.completionRate;
        metadata = completionMetrics;
        break;
      
      case 'revenue_per_contractor':
        const revenueMetrics = await this.calculateRevenue('contractor', entityId, period);
        value = revenueMetrics.average;
        metadata = revenueMetrics;
        break;
      
      case 'customer_satisfaction_score':
        const satisfactionMetrics = await this.calculateSatisfactionScore('contractor', entityId, period);
        value = satisfactionMetrics.overall;
        metadata = satisfactionMetrics;
        break;
      
      case 'fleet_utilization_rate':
        const utilizationMetrics = await this.calculateFleetUtilization(entityId, period);
        value = utilizationMetrics.utilizationRate;
        metadata = utilizationMetrics;
        break;
      
      case 'on_time_delivery_rate':
        const deliveryMetrics = await this.calculateOnTimeDelivery('contractor', entityId, period);
        value = deliveryMetrics.onTimeRate;
        metadata = deliveryMetrics;
        break;
    }

    // Determine status based on thresholds
    let status: 'green' | 'yellow' | 'red' = 'green';
    if (definition.thresholdRed && value <= Number(definition.thresholdRed)) {
      status = 'red';
    } else if (definition.thresholdYellow && value <= Number(definition.thresholdYellow)) {
      status = 'yellow';
    }

    return {
      kpiId: definition.id,
      name: definition.name,
      value,
      unit: definition.unit,
      status,
      metadata,
      calculatedAt: new Date()
    };
  }

  // Create daily performance snapshot
  async createPerformanceSnapshot() {
    const now = new Date();
    const dateRange = {
      startDate: new Date(now.setHours(0, 0, 0, 0)),
      endDate: new Date(now.setHours(23, 59, 59, 999))
    };

    // Get all active KPIs
    const kpis = await db.select()
      .from(kpiDefinitions)
      .where(eq(kpiDefinitions.isActive, true));

    // Calculate all KPIs for the system
    const systemMetrics: Record<string, any> = {};
    for (const kpi of kpis) {
      try {
        const result = await this.calculateKPI(kpi.id, 'system', dateRange);
        systemMetrics[kpi.name] = result.value;
      } catch (error) {
        console.error(`Failed to calculate KPI ${kpi.name}:`, error);
      }
    }

    // Create snapshot
    const [snapshot] = await db.insert(metricSnapshots)
      .values({
        snapshotDate: now,
        metrics: systemMetrics,
        summary: {
          totalKpis: kpis.length,
          calculatedAt: now.toISOString()
        }
      })
      .returning();

    return snapshot;
  }

  // Set performance goal
  async setPerformanceGoal(goal: InsertPerformanceGoal): Promise<PerformanceGoal> {
    const [created] = await db.insert(performanceGoals)
      .values(goal)
      .returning();
    
    return created;
  }

  // Update goal progress
  async updateGoalProgress(entityType: string, entityId: string, metricType: string) {
    const goals = await db.select()
      .from(performanceGoals)
      .where(
        and(
          eq(performanceGoals.entityType, entityType as any),
          eq(performanceGoals.entityId, entityId),
          eq(performanceGoals.status, 'in_progress')
        )
      );

    for (const goal of goals) {
      const kpi = await db.select()
        .from(kpiDefinitions)
        .where(eq(kpiDefinitions.id, goal.kpiId))
        .limit(1);

      if (kpi.length && kpi[0].name.includes(metricType)) {
        const currentValue = await this.calculateKPI(goal.kpiId, entityId, {
          startDate: goal.startDate,
          endDate: new Date()
        });

        const updates: any = {
          currentValue: String(currentValue.value)
        };

        // Check if goal is achieved
        if (currentValue.value >= Number(goal.targetValue)) {
          updates.status = 'achieved';
          updates.achievedAt = new Date();
        }

        await db.update(performanceGoals)
          .set(updates)
          .where(eq(performanceGoals.id, goal.id));
      }
    }
  }

  // Get performance comparison
  async getPerformanceComparison(entityId: string, periods: DateRange[]): Promise<PerformanceComparison> {
    const comparison: PerformanceComparison = {
      entityId,
      entityType: 'contractor', // Can be dynamic based on entity
      periods: [],
      changes: {}
    };

    for (const period of periods) {
      const metrics = await db.select({
        metricType: performanceMetrics.metricType,
        avgValue: avg(performanceMetrics.value)
      })
      .from(performanceMetrics)
      .where(
        and(
          eq(performanceMetrics.entityId, entityId),
          between(performanceMetrics.timestamp, period.startDate, period.endDate)
        )
      )
      .groupBy(performanceMetrics.metricType);

      const periodMetrics: Record<string, number> = {};
      for (const metric of metrics) {
        periodMetrics[metric.metricType] = Number(metric.avgValue || 0);
      }

      comparison.periods.push({
        period: format(period.startDate, 'MMM yyyy'),
        metrics: periodMetrics
      });
    }

    // Calculate percentage changes between first and last period
    if (comparison.periods.length >= 2) {
      const first = comparison.periods[0].metrics;
      const last = comparison.periods[comparison.periods.length - 1].metrics;
      
      for (const key in last) {
        if (first[key] && first[key] !== 0) {
          comparison.changes[key] = ((last[key] - first[key]) / first[key]) * 100;
        }
      }
    }

    return comparison;
  }

  // Get top performers
  async getTopPerformers(metricType: string, limit: number = 10) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await db
      .select({
        entityId: performanceMetrics.entityId,
        entityType: performanceMetrics.entityType,
        avgValue: avg(performanceMetrics.value),
        count: count()
      })
      .from(performanceMetrics)
      .where(
        and(
          eq(performanceMetrics.metricType, metricType as any),
          gte(performanceMetrics.timestamp, thirtyDaysAgo)
        )
      )
      .groupBy(performanceMetrics.entityId, performanceMetrics.entityType)
      .orderBy(desc(avg(performanceMetrics.value)))
      .limit(limit);

    // Enrich with entity names
    const enriched = [];
    for (const performer of result) {
      let name = 'Unknown';
      
      if (performer.entityType === 'contractor') {
        const contractor = await db.select()
          .from(contractorProfiles)
          .where(eq(contractorProfiles.userId, performer.entityId))
          .limit(1);
        name = contractor[0]?.companyName || 'Unknown Contractor';
      } else if (performer.entityType === 'fleet') {
        const fleet = await db.select()
          .from(fleetAccounts)
          .where(eq(fleetAccounts.id, performer.entityId))
          .limit(1);
        name = fleet[0]?.companyName || 'Unknown Fleet';
      }

      enriched.push({
        ...performer,
        name,
        value: Number(performer.avgValue || 0),
        metricCount: Number(performer.count || 0)
      });
    }

    return enriched;
  }

  // Get performance trends
  async getPerformanceTrends(metricType: string, dateRange: DateRange): Promise<PerformanceTrend> {
    const metrics = await db
      .select({
        date: sql`DATE(${performanceMetrics.timestamp})`.as('date'),
        avgValue: avg(performanceMetrics.value)
      })
      .from(performanceMetrics)
      .where(
        and(
          eq(performanceMetrics.metricType, metricType as any),
          between(performanceMetrics.timestamp, dateRange.startDate, dateRange.endDate)
        )
      )
      .groupBy(sql`DATE(${performanceMetrics.timestamp})`)
      .orderBy(asc(sql`DATE(${performanceMetrics.timestamp})`));

    // Calculate moving average
    const data = metrics.map((m, index) => {
      const lookback = Math.max(0, index - 6); // 7-day moving average
      const subset = metrics.slice(lookback, index + 1);
      const movingAverage = subset.reduce((sum, item) => sum + Number(item.avgValue || 0), 0) / subset.length;
      
      return {
        date: m.date as Date,
        value: Number(m.avgValue || 0),
        movingAverage
      };
    });

    // Determine trend
    let trendLine: 'up' | 'down' | 'stable' = 'stable';
    if (data.length >= 2) {
      const firstHalf = data.slice(0, Math.floor(data.length / 2));
      const secondHalf = data.slice(Math.floor(data.length / 2));
      
      const firstAvg = firstHalf.reduce((sum, item) => sum + item.value, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, item) => sum + item.value, 0) / secondHalf.length;
      
      if (secondAvg > firstAvg * 1.05) trendLine = 'up';
      else if (secondAvg < firstAvg * 0.95) trendLine = 'down';
    }

    // Simple linear projection for next period
    const projection = data.length >= 2 ? 
      data[data.length - 1].value + (data[data.length - 1].value - data[data.length - 2].value) : 
      undefined;

    return {
      metricType,
      data,
      trendLine,
      projection
    };
  }

  // Generate comprehensive performance scorecard
  async generateScorecard(entityType: string, entityId: string, period?: DateRange) {
    const dateRange = period || {
      startDate: subMonths(new Date(), 1),
      endDate: new Date()
    };

    const kpis = await db.select()
      .from(kpiDefinitions)
      .where(eq(kpiDefinitions.isActive, true));

    const scorecard: KpiValue[] = [];
    let compositeScore = 0;
    let kpiCount = 0;

    for (const kpi of kpis) {
      try {
        const result = await this.calculateKPI(kpi.id, entityId, dateRange);
        
        // Calculate trend (compare with previous period)
        const previousPeriod = {
          startDate: subMonths(dateRange.startDate, 1),
          endDate: subMonths(dateRange.endDate, 1)
        };
        const previousResult = await this.calculateKPI(kpi.id, entityId, previousPeriod);
        
        const trend = previousResult.value !== 0 ? 
          ((result.value - previousResult.value) / previousResult.value) * 100 : 0;

        scorecard.push({
          name: kpi.name,
          value: result.value,
          unit: kpi.unit,
          trend,
          status: result.status
        });

        // Add to composite score (normalize to 0-100 scale)
        if (kpi.targetValue) {
          const score = Math.min(100, (result.value / Number(kpi.targetValue)) * 100);
          compositeScore += score;
          kpiCount++;
        }
      } catch (error) {
        console.error(`Failed to calculate KPI ${kpi.name}:`, error);
      }
    }

    return {
      scorecard,
      compositeScore: kpiCount > 0 ? compositeScore / kpiCount : 0,
      period: dateRange,
      generatedAt: new Date()
    };
  }
}

export const performanceMetricsService = new PerformanceMetricsService();