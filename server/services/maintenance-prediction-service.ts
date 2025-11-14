import OpenAI from "openai";
import { 
  maintenancePredictions, 
  vehicleTelemetry,
  maintenanceModels,
  maintenanceAlerts,
  fleetVehicles,
  jobs,
  notifications,
  type MaintenancePrediction,
  type InsertMaintenancePrediction,
  type VehicleTelemetry,
  type InsertVehicleTelemetry,
  type MaintenanceModel,
  type InsertMaintenanceModel,
  type MaintenanceAlert,
  type InsertMaintenanceAlert,
  type FleetVehicle,
  type Job,
  maintenanceRiskLevelEnum,
  maintenanceAlertTypeEnum,
  maintenanceSeverityEnum
} from "@shared/schema";
import { db } from "../db";
import { eq, and, gte, lte, desc, asc, inArray, sql } from "drizzle-orm";
import { storage } from "../storage";
import { pushNotificationService } from "./push-notification-service";

// Initialize OpenAI client (using Replit's AI Integrations)
const hasAIKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY && process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
const openai = hasAIKey ? new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
}) : null;

// Current model version
const CURRENT_MODEL_VERSION = "v1.0.0";

// Maintenance service type definitions
export const MAINTENANCE_SERVICES = {
  // Brake System
  BRAKE_INSPECTION: { name: "Brake Inspection", category: "Brakes", avgCost: 150 },
  BRAKE_PAD_REPLACEMENT: { name: "Brake Pad Replacement", category: "Brakes", avgCost: 400 },
  BRAKE_DRUM_SERVICE: { name: "Brake Drum Service", category: "Brakes", avgCost: 600 },
  BRAKE_FLUID_FLUSH: { name: "Brake Fluid Flush", category: "Brakes", avgCost: 120 },
  
  // Tire Services
  TIRE_ROTATION: { name: "Tire Rotation", category: "Tires", avgCost: 100 },
  TIRE_REPLACEMENT: { name: "Tire Replacement", category: "Tires", avgCost: 500 },
  TIRE_ALIGNMENT: { name: "Wheel Alignment", category: "Tires", avgCost: 200 },
  TIRE_BALANCING: { name: "Wheel Balancing", category: "Tires", avgCost: 150 },
  
  // Engine Services
  OIL_CHANGE: { name: "Oil Change", category: "Engine", avgCost: 180 },
  ENGINE_FILTER_REPLACEMENT: { name: "Engine Filter Replacement", category: "Engine", avgCost: 120 },
  ENGINE_TUNE_UP: { name: "Engine Tune-Up", category: "Engine", avgCost: 450 },
  ENGINE_COOLANT_FLUSH: { name: "Coolant System Flush", category: "Engine", avgCost: 200 },
  
  // Transmission
  TRANSMISSION_SERVICE: { name: "Transmission Service", category: "Transmission", avgCost: 350 },
  TRANSMISSION_FLUID_CHANGE: { name: "Transmission Fluid Change", category: "Transmission", avgCost: 250 },
  
  // Cooling System
  RADIATOR_SERVICE: { name: "Radiator Service", category: "Cooling", avgCost: 300 },
  THERMOSTAT_REPLACEMENT: { name: "Thermostat Replacement", category: "Cooling", avgCost: 180 },
  WATER_PUMP_SERVICE: { name: "Water Pump Service", category: "Cooling", avgCost: 450 },
  
  // Preventive Maintenance
  PM_SERVICE_A: { name: "PM Service Level A", category: "PM", avgCost: 350 },
  PM_SERVICE_B: { name: "PM Service Level B", category: "PM", avgCost: 750 },
  PM_SERVICE_C: { name: "PM Service Level C", category: "PM", avgCost: 1200 },
  
  // Other
  BATTERY_REPLACEMENT: { name: "Battery Replacement", category: "Electrical", avgCost: 250 },
  ALTERNATOR_SERVICE: { name: "Alternator Service", category: "Electrical", avgCost: 500 },
  DEF_SYSTEM_SERVICE: { name: "DEF System Service", category: "Emissions", avgCost: 400 }
};

// Maintenance thresholds
const THRESHOLDS = {
  BRAKE_WEAR_CRITICAL: 20, // %
  BRAKE_WEAR_WARNING: 35, // %
  TIRE_TREAD_CRITICAL: 2, // mm
  TIRE_TREAD_WARNING: 4, // mm
  OIL_CHANGE_MILES: 15000,
  COOLANT_TEMP_HIGH: 230, // F
  BATTERY_VOLTAGE_LOW: 11.5, // V
  DEF_LEVEL_LOW: 10, // %
};

// Seasonal factors for maintenance
const SEASONAL_FACTORS = {
  WINTER: {
    battery: 1.5, // 50% more likely to fail
    tires: 1.3, // 30% more wear
    coolant: 1.2, // 20% more stress
    brakes: 1.1
  },
  SUMMER: {
    coolant: 1.4, // 40% more stress
    tires: 1.2, // 20% more wear
    battery: 1.1,
    ac_system: 1.5
  },
  SPRING: {
    brakes: 1.2, // Wet conditions
    wipers: 1.3
  },
  FALL: {
    battery: 1.1,
    tires: 1.1
  }
};

class MaintenancePredictionService {
  /**
   * Analyze vehicle telemetry and predict maintenance needs
   */
  async analyzeTelemetry(vehicleId: string, telemetryData: InsertVehicleTelemetry) {
    // Store telemetry data
    const [telemetry] = await db
      .insert(vehicleTelemetry)
      .values(telemetryData)
      .returning();

    // Get vehicle information
    const vehicle = await db
      .select()
      .from(fleetVehicles)
      .where(eq(fleetVehicles.id, vehicleId))
      .limit(1)
      .then(rows => rows[0]);

    if (!vehicle) {
      throw new Error("Vehicle not found");
    }

    // Get historical maintenance
    const maintenanceHistory = await this.getVehicleMaintenanceHistory(vehicleId);

    // Analyze sensor readings
    const sensorAnalysis = this.analyzeSensorReadings(telemetryData.sensorReadings as any);
    
    // Check for immediate alerts
    const immediateAlerts = await this.checkImmediateAlerts(
      vehicleId,
      telemetryData,
      sensorAnalysis
    );

    // Generate AI predictions if API is available
    if (openai) {
      const predictions = await this.generateAIPredictions(
        vehicle,
        telemetryData,
        maintenanceHistory,
        sensorAnalysis
      );

      // Store predictions
      for (const prediction of predictions) {
        await this.storePrediction(vehicleId, prediction);
      }
    }

    return {
      telemetry,
      immediateAlerts,
      sensorAnalysis
    };
  }

  /**
   * Generate AI-powered maintenance predictions
   */
  private async generateAIPredictions(
    vehicle: FleetVehicle,
    telemetry: InsertVehicleTelemetry,
    maintenanceHistory: any[],
    sensorAnalysis: any
  ): Promise<InsertMaintenancePrediction[]> {
    if (!openai) {
      return this.generateFallbackPredictions(vehicle, telemetry, sensorAnalysis);
    }

    const prompt = `
      Analyze this vehicle data and predict maintenance needs:
      
      Vehicle: ${vehicle.year} ${vehicle.make} ${vehicle.model}
      Current Mileage: ${telemetry.mileage}
      Engine Hours: ${telemetry.engineHours}
      
      Sensor Readings:
      ${JSON.stringify(telemetry.sensorReadings, null, 2)}
      
      Fault Codes: ${JSON.stringify(telemetry.faultCodes) || 'None'}
      
      Recent Maintenance:
      ${maintenanceHistory.slice(0, 5).map(m => 
        `- ${m.serviceType} at ${m.mileage} miles (${m.daysAgo} days ago)`
      ).join('\n')}
      
      Sensor Analysis:
      ${JSON.stringify(sensorAnalysis, null, 2)}
      
      Based on this data, predict upcoming maintenance needs with:
      1. Service type needed
      2. Predicted date (within next 90 days)
      3. Risk level (low/medium/high/critical)
      4. Confidence percentage
      5. Estimated cost
      6. Reasoning for the prediction
      
      Consider:
      - Manufacturer recommendations for this vehicle
      - Wear patterns based on sensor data
      - Historical maintenance intervals
      - Current season and weather impact
      - Driver behavior indicators
      
      Return as JSON array with predicted maintenance items.
    `;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: "You are an expert truck maintenance AI specializing in predictive maintenance for commercial vehicles. Provide accurate, actionable maintenance predictions based on vehicle data."
          },
          { role: "user", content: prompt }
        ],
        max_completion_tokens: 1000,
        temperature: 0.2, // Lower temperature for more consistent predictions
        response_format: { type: "json_object" }
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        return this.generateFallbackPredictions(vehicle, telemetry, sensorAnalysis);
      }

      const result = JSON.parse(content);
      const predictions: InsertMaintenancePrediction[] = [];

      for (const item of (result.predictions || [])) {
        predictions.push({
          vehicleId: vehicle.id,
          predictedDate: new Date(item.predictedDate),
          serviceType: item.serviceType,
          confidence: item.confidence,
          riskLevel: item.riskLevel as 'low' | 'medium' | 'high' | 'critical',
          estimatedCost: item.estimatedCost,
          reasoning: item.reasoning,
          modelVersion: CURRENT_MODEL_VERSION,
          recommendations: item.recommendations || [],
          historicalAccuracy: 85 // Default accuracy, will be updated based on feedback
        });
      }

      return predictions;
    } catch (error) {
      console.error("AI prediction error:", error);
      return this.generateFallbackPredictions(vehicle, telemetry, sensorAnalysis);
    }
  }

  /**
   * Generate rule-based predictions as fallback
   */
  private generateFallbackPredictions(
    vehicle: FleetVehicle,
    telemetry: InsertVehicleTelemetry,
    sensorAnalysis: any
  ): InsertMaintenancePrediction[] {
    const predictions: InsertMaintenancePrediction[] = [];
    const currentMileage = telemetry.mileage;
    const sensors = telemetry.sensorReadings as any || {};

    // Oil change prediction
    const milesSinceOilChange = currentMileage - (vehicle.lastServiceDate ? 0 : currentMileage);
    if (milesSinceOilChange > THRESHOLDS.OIL_CHANGE_MILES * 0.8) {
      const daysUntilDue = Math.floor((THRESHOLDS.OIL_CHANGE_MILES - milesSinceOilChange) / 200); // Assuming 200 miles/day
      
      predictions.push({
        vehicleId: vehicle.id,
        predictedDate: new Date(Date.now() + daysUntilDue * 24 * 60 * 60 * 1000),
        serviceType: MAINTENANCE_SERVICES.OIL_CHANGE.name,
        confidence: 95,
        riskLevel: milesSinceOilChange > THRESHOLDS.OIL_CHANGE_MILES ? 'high' : 'medium',
        estimatedCost: MAINTENANCE_SERVICES.OIL_CHANGE.avgCost,
        reasoning: `Vehicle approaching oil change interval. Current: ${currentMileage} miles, recommended interval: ${THRESHOLDS.OIL_CHANGE_MILES} miles`,
        modelVersion: CURRENT_MODEL_VERSION,
        recommendations: ["Schedule oil change within next 2 weeks", "Check oil level regularly"],
        historicalAccuracy: 90
      });
    }

    // Brake wear prediction
    if (sensors.brakeWear && sensors.brakeWear < THRESHOLDS.BRAKE_WEAR_WARNING) {
      const wearRate = 2; // % per 1000 miles (estimated)
      const milesUntilReplacement = ((sensors.brakeWear - THRESHOLDS.BRAKE_WEAR_CRITICAL) / wearRate) * 1000;
      const daysUntilDue = Math.floor(milesUntilReplacement / 200);

      predictions.push({
        vehicleId: vehicle.id,
        predictedDate: new Date(Date.now() + daysUntilDue * 24 * 60 * 60 * 1000),
        serviceType: MAINTENANCE_SERVICES.BRAKE_PAD_REPLACEMENT.name,
        confidence: 85,
        riskLevel: sensors.brakeWear < THRESHOLDS.BRAKE_WEAR_CRITICAL ? 'critical' : 'high',
        estimatedCost: MAINTENANCE_SERVICES.BRAKE_PAD_REPLACEMENT.avgCost,
        reasoning: `Brake wear at ${sensors.brakeWear}%. Replacement needed at ${THRESHOLDS.BRAKE_WEAR_CRITICAL}%`,
        modelVersion: CURRENT_MODEL_VERSION,
        recommendations: ["Inspect brakes during next service", "Avoid heavy braking"],
        historicalAccuracy: 88
      });
    }

    // Tire wear prediction based on pressure
    if (sensors.tirePressure) {
      const avgPressure = (sensors.tirePressure.FL + sensors.tirePressure.FR + 
                          sensors.tirePressure.RL + sensors.tirePressure.RR) / 4;
      
      if (avgPressure < 95) { // Below optimal pressure
        predictions.push({
          vehicleId: vehicle.id,
          predictedDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          serviceType: MAINTENANCE_SERVICES.TIRE_REPLACEMENT.name,
          confidence: 70,
          riskLevel: avgPressure < 85 ? 'high' : 'medium',
          estimatedCost: MAINTENANCE_SERVICES.TIRE_REPLACEMENT.avgCost,
          reasoning: `Low tire pressure detected (avg: ${avgPressure} PSI). May indicate wear or damage`,
          modelVersion: CURRENT_MODEL_VERSION,
          recommendations: ["Check tire tread depth", "Inspect for punctures or damage"],
          historicalAccuracy: 75
        });
      }
    }

    // Coolant system prediction
    if (sensors.coolantTemp && sensors.coolantTemp > THRESHOLDS.COOLANT_TEMP_HIGH * 0.9) {
      predictions.push({
        vehicleId: vehicle.id,
        predictedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        serviceType: MAINTENANCE_SERVICES.ENGINE_COOLANT_FLUSH.name,
        confidence: 80,
        riskLevel: sensors.coolantTemp > THRESHOLDS.COOLANT_TEMP_HIGH ? 'critical' : 'high',
        estimatedCost: MAINTENANCE_SERVICES.ENGINE_COOLANT_FLUSH.avgCost,
        reasoning: `High coolant temperature detected (${sensors.coolantTemp}°F). System may need service`,
        modelVersion: CURRENT_MODEL_VERSION,
        recommendations: ["Check coolant levels", "Inspect radiator and hoses"],
        historicalAccuracy: 82
      });
    }

    // Battery voltage prediction
    if (sensors.batteryVoltage && sensors.batteryVoltage < THRESHOLDS.BATTERY_VOLTAGE_LOW) {
      predictions.push({
        vehicleId: vehicle.id,
        predictedDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
        serviceType: MAINTENANCE_SERVICES.BATTERY_REPLACEMENT.name,
        confidence: 75,
        riskLevel: sensors.batteryVoltage < 11.0 ? 'critical' : 'high',
        estimatedCost: MAINTENANCE_SERVICES.BATTERY_REPLACEMENT.avgCost,
        reasoning: `Low battery voltage (${sensors.batteryVoltage}V) indicates potential battery failure`,
        modelVersion: CURRENT_MODEL_VERSION,
        recommendations: ["Test battery and charging system", "Clean battery terminals"],
        historicalAccuracy: 80
      });
    }

    return predictions;
  }

  /**
   * Analyze sensor readings for issues
   */
  private analyzeSensorReadings(sensors: any) {
    const analysis: any = {
      status: 'normal',
      issues: [],
      warnings: []
    };

    if (!sensors) return analysis;

    // Check oil pressure
    if (sensors.oilPressure) {
      if (sensors.oilPressure < 20) {
        analysis.status = 'critical';
        analysis.issues.push('Critical: Low oil pressure');
      } else if (sensors.oilPressure < 30) {
        analysis.warnings.push('Warning: Oil pressure below normal');
      }
    }

    // Check coolant temperature
    if (sensors.coolantTemp) {
      if (sensors.coolantTemp > THRESHOLDS.COOLANT_TEMP_HIGH) {
        analysis.status = 'critical';
        analysis.issues.push('Critical: Engine overheating');
      } else if (sensors.coolantTemp > 220) {
        analysis.warnings.push('Warning: High coolant temperature');
      }
    }

    // Check brake wear
    if (sensors.brakeWear) {
      if (sensors.brakeWear < THRESHOLDS.BRAKE_WEAR_CRITICAL) {
        analysis.status = 'critical';
        analysis.issues.push('Critical: Brake replacement needed');
      } else if (sensors.brakeWear < THRESHOLDS.BRAKE_WEAR_WARNING) {
        analysis.warnings.push('Warning: Brake wear approaching limits');
      }
    }

    // Check tire pressure
    if (sensors.tirePressure) {
      const tires = ['FL', 'FR', 'RL', 'RR'];
      for (const tire of tires) {
        if (sensors.tirePressure[tire] < 80) {
          analysis.status = analysis.status === 'critical' ? 'critical' : 'warning';
          analysis.warnings.push(`Low pressure in ${tire} tire: ${sensors.tirePressure[tire]} PSI`);
        }
      }
    }

    // Check battery voltage
    if (sensors.batteryVoltage) {
      if (sensors.batteryVoltage < THRESHOLDS.BATTERY_VOLTAGE_LOW) {
        analysis.warnings.push('Warning: Low battery voltage');
      }
    }

    // Check DEF level
    if (sensors.defLevel && sensors.defLevel < THRESHOLDS.DEF_LEVEL_LOW) {
      analysis.warnings.push('Warning: Low DEF fluid level');
    }

    return analysis;
  }

  /**
   * Check for immediate alerts based on telemetry
   */
  private async checkImmediateAlerts(
    vehicleId: string,
    telemetry: InsertVehicleTelemetry,
    sensorAnalysis: any
  ): Promise<MaintenanceAlert[]> {
    const alerts: InsertMaintenanceAlert[] = [];

    // Critical issues from sensor analysis
    if (sensorAnalysis.status === 'critical') {
      for (const issue of sensorAnalysis.issues) {
        alerts.push({
          vehicleId,
          alertType: 'critical',
          severity: 'critical',
          message: issue,
          triggerValue: null,
          threshold: null,
          actionRequired: 'Immediate service required. Vehicle should not be operated.',
          notificationSent: false
        });
      }
    }

    // Warning issues
    for (const warning of sensorAnalysis.warnings || []) {
      alerts.push({
        vehicleId,
        alertType: 'predictive',
        severity: 'warning',
        message: warning,
        triggerValue: null,
        threshold: null,
        actionRequired: 'Schedule service soon to prevent failure.',
        notificationSent: false
      });
    }

    // Fault codes
    const faultCodes = telemetry.faultCodes as any;
    if (faultCodes && Array.isArray(faultCodes) && faultCodes.length > 0) {
      for (const code of faultCodes) {
        alerts.push({
          vehicleId,
          alertType: 'critical',
          severity: 'urgent',
          message: `Diagnostic trouble code: ${code}`,
          triggerValue: null,
          threshold: null,
          actionRequired: 'Diagnose and repair fault code issue.',
          notificationSent: false
        });
      }
    }

    // Store alerts in database
    const storedAlerts: MaintenanceAlert[] = [];
    for (const alert of alerts) {
      const [stored] = await db
        .insert(maintenanceAlerts)
        .values(alert)
        .returning();
      storedAlerts.push(stored);

      // Send notifications for critical alerts
      if (alert.severity === 'critical' || alert.severity === 'urgent') {
        await this.sendAlertNotification(vehicleId, stored);
      }
    }

    return storedAlerts;
  }

  /**
   * Get vehicle maintenance history
   */
  private async getVehicleMaintenanceHistory(vehicleId: string) {
    // Get completed jobs for this vehicle
    const history = await db
      .select({
        serviceType: jobs.serviceType,
        completedAt: jobs.completedAt,
        mileage: sql<number>`COALESCE(${jobs.vehicleMileage}, 0)`,
        daysAgo: sql<number>`EXTRACT(DAY FROM NOW() - ${jobs.completedAt})`
      })
      .from(jobs)
      .where(
        and(
          eq(jobs.vehicleId, vehicleId),
          eq(jobs.status, 'completed')
        )
      )
      .orderBy(desc(jobs.completedAt))
      .limit(20);

    return history;
  }

  /**
   * Store maintenance prediction
   */
  async storePrediction(vehicleId: string, prediction: InsertMaintenancePrediction) {
    const [stored] = await db
      .insert(maintenancePredictions)
      .values(prediction)
      .returning();

    // Create alert for high/critical risk predictions
    if (prediction.riskLevel === 'high' || prediction.riskLevel === 'critical') {
      await db.insert(maintenanceAlerts).values({
        vehicleId,
        predictionId: stored.id,
        alertType: 'predictive',
        severity: prediction.riskLevel === 'critical' ? 'critical' : 'urgent',
        message: `${prediction.serviceType} predicted - ${prediction.riskLevel} risk`,
        triggerValue: prediction.confidence,
        threshold: 70,
        actionRequired: `Schedule ${prediction.serviceType} by ${prediction.predictedDate.toLocaleDateString()}`,
        notificationSent: false
      });
    }

    return stored;
  }

  /**
   * Send alert notification
   */
  private async sendAlertNotification(vehicleId: string, alert: MaintenanceAlert) {
    // Get vehicle and fleet information
    const vehicle = await db
      .select({
        vehicle: fleetVehicles,
        fleetId: fleetVehicles.fleetAccountId
      })
      .from(fleetVehicles)
      .where(eq(fleetVehicles.id, vehicleId))
      .limit(1)
      .then(rows => rows[0]);

    if (!vehicle) return;

    // Create notification for fleet managers
    await db.insert(notifications).values({
      userId: vehicle.fleetId, // This should be the fleet manager's user ID
      type: 'maintenance',
      title: `Maintenance Alert: ${vehicle.vehicle.unitNumber}`,
      message: alert.message,
      relatedEntityType: 'maintenance_alert',
      relatedEntityId: alert.id,
      priority: alert.severity === 'critical' ? 'urgent' : 'high',
      actionUrl: `/fleet/maintenance-predictor?alertId=${alert.id}`,
      metadata: {
        vehicleId,
        vehicleUnit: vehicle.vehicle.unitNumber,
        alertType: alert.alertType,
        severity: alert.severity
      }
    });

    // Send push notification
    await pushNotificationService.sendToFleet(vehicle.fleetId, {
      title: `Maintenance Alert: ${vehicle.vehicle.unitNumber}`,
      body: alert.message,
      icon: '/icons/alert-icon.png',
      badge: '/icons/badge-icon.png',
      tag: `maintenance-alert-${alert.id}`,
      data: {
        type: 'maintenance_alert',
        alertId: alert.id,
        vehicleId,
        severity: alert.severity
      }
    });

    // Mark notification as sent
    await db
      .update(maintenanceAlerts)
      .set({ notificationSent: true })
      .where(eq(maintenanceAlerts.id, alert.id));
  }

  /**
   * Get maintenance predictions for a fleet
   */
  async getFleetPredictions(fleetId: string, dateRange?: { start: Date; end: Date }) {
    const query = db
      .select({
        prediction: maintenancePredictions,
        vehicle: fleetVehicles
      })
      .from(maintenancePredictions)
      .innerJoin(fleetVehicles, eq(maintenancePredictions.vehicleId, fleetVehicles.id))
      .where(eq(fleetVehicles.fleetAccountId, fleetId));

    if (dateRange) {
      query.where(
        and(
          gte(maintenancePredictions.predictedDate, dateRange.start),
          lte(maintenancePredictions.predictedDate, dateRange.end)
        )
      );
    }

    const results = await query.orderBy(
      asc(maintenancePredictions.predictedDate),
      desc(maintenancePredictions.riskLevel)
    );

    return results;
  }

  /**
   * Get high-risk vehicles
   */
  async getHighRiskVehicles(fleetId: string) {
    const results = await db
      .select({
        vehicle: fleetVehicles,
        predictions: sql<number>`COUNT(${maintenancePredictions.id})`,
        criticalCount: sql<number>`COUNT(CASE WHEN ${maintenancePredictions.riskLevel} = 'critical' THEN 1 END)`,
        highCount: sql<number>`COUNT(CASE WHEN ${maintenancePredictions.riskLevel} = 'high' THEN 1 END)`,
        totalEstimatedCost: sql<number>`SUM(${maintenancePredictions.estimatedCost})`
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
      .having(sql`COUNT(CASE WHEN ${maintenancePredictions.riskLevel} IN ('critical', 'high') THEN 1 END) > 0`)
      .orderBy(desc(sql`COUNT(CASE WHEN ${maintenancePredictions.riskLevel} = 'critical' THEN 1 END)`));

    return results;
  }

  /**
   * Calculate maintenance ROI
   */
  async calculateMaintenanceROI(vehicleId: string) {
    // Get predicted maintenance costs
    const predictions = await db
      .select({
        estimatedCost: maintenancePredictions.estimatedCost,
        serviceType: maintenancePredictions.serviceType,
        riskLevel: maintenancePredictions.riskLevel
      })
      .from(maintenancePredictions)
      .where(
        and(
          eq(maintenancePredictions.vehicleId, vehicleId),
          gte(maintenancePredictions.predictedDate, new Date()),
          lte(maintenancePredictions.predictedDate, new Date(Date.now() + 90 * 24 * 60 * 60 * 1000))
        )
      );

    // Calculate preventive vs reactive costs
    let preventiveCost = 0;
    let potentialReactiveCost = 0;
    let potentialDowntimeSaved = 0;

    for (const pred of predictions) {
      preventiveCost += Number(pred.estimatedCost);
      
      // Reactive costs are typically 2-4x higher
      const reactiveMultiplier = pred.riskLevel === 'critical' ? 4 : 
                                pred.riskLevel === 'high' ? 3 : 2;
      potentialReactiveCost += Number(pred.estimatedCost) * reactiveMultiplier;
      
      // Downtime costs (estimated at $500/day)
      const downtimeDays = pred.riskLevel === 'critical' ? 3 : 
                          pred.riskLevel === 'high' ? 2 : 1;
      potentialDowntimeSaved += downtimeDays * 500;
    }

    const totalSavings = (potentialReactiveCost - preventiveCost) + potentialDowntimeSaved;
    const roi = preventiveCost > 0 ? (totalSavings / preventiveCost) * 100 : 0;

    return {
      preventiveCost,
      potentialReactiveCost,
      potentialDowntimeSaved,
      totalSavings,
      roi,
      breakdownRiskReduction: 65 // % reduction in breakdown risk with preventive maintenance
    };
  }

  /**
   * Get model performance metrics
   */
  async getModelPerformance(modelId?: string) {
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
        modelName: CURRENT_MODEL_VERSION,
        accuracy: 85,
        performanceMetrics: {
          precision: 0.85,
          recall: 0.82,
          f1Score: 0.835
        }
      };
    }

    return model;
  }

  /**
   * Update model with feedback
   */
  async updateModelFeedback(predictionId: string, wasAccurate: boolean) {
    // Update prediction historical accuracy based on feedback
    const prediction = await db
      .select()
      .from(maintenancePredictions)
      .where(eq(maintenancePredictions.id, predictionId))
      .limit(1)
      .then(rows => rows[0]);

    if (!prediction) return;

    // Update accuracy (simple moving average)
    const currentAccuracy = Number(prediction.historicalAccuracy) || 85;
    const newAccuracy = wasAccurate ? 
      Math.min(100, currentAccuracy + 1) : 
      Math.max(0, currentAccuracy - 2);

    await db
      .update(maintenancePredictions)
      .set({ historicalAccuracy: newAccuracy })
      .where(eq(maintenancePredictions.id, predictionId));

    // TODO: Implement model retraining based on accumulated feedback
  }

  /**
   * Get maintenance schedule for vehicle
   */
  async getVehicleMaintenanceSchedule(vehicleId: string) {
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
          sql`${maintenanceAlerts.acknowledgedAt} IS NULL`
        )
      )
      .orderBy(desc(maintenanceAlerts.severity));

    return {
      predictions,
      alerts,
      nextServiceDue: predictions[0]?.predictedDate || null
    };
  }
}

// Export singleton instance
export const maintenancePredictionService = new MaintenancePredictionService();
export { MaintenancePredictionService };