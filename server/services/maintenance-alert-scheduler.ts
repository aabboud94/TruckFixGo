import cron from 'node-cron';
import { db } from '../db';
import { eq, and, gte, lt, sql, isNull, desc, lte } from 'drizzle-orm';
import {
  maintenanceAlerts,
  maintenancePredictions,
  fleetVehicles,
  fleetAccounts,
  users,
  notifications
} from '@shared/schema';
import { MaintenancePredictionService } from './maintenance-prediction-service';
import { pushNotificationService } from './push-notification-service';
import { emailService } from './email-service';

interface DailyDigestItem {
  vehicleId: string;
  vehicleUnit: string;
  serviceType: string;
  predictedDate: Date;
  riskLevel: string;
  estimatedCost: number;
}

export class MaintenanceAlertScheduler {
  private predictionService: MaintenancePredictionService;
  private checkHighRiskJob: cron.ScheduledTask | null = null;
  private dailyDigestJob: cron.ScheduledTask | null = null;
  private criticalEscalationJob: cron.ScheduledTask | null = null;

  constructor() {
    this.predictionService = new MaintenancePredictionService();
  }

  /**
   * Start all scheduled jobs
   */
  public start() {
    console.log('Starting Maintenance Alert Scheduler...');
    
    // Check for high-risk vehicles every hour
    this.checkHighRiskJob = cron.schedule('0 * * * *', async () => {
      console.log('Running high-risk vehicle check...');
      await this.checkHighRiskVehicles();
    });

    // Send daily digest at 7:00 AM
    this.dailyDigestJob = cron.schedule('0 7 * * *', async () => {
      console.log('Sending daily maintenance digest...');
      await this.sendDailyDigest();
    });

    // Check for critical alert escalation every 15 minutes
    this.criticalEscalationJob = cron.schedule('*/15 * * * *', async () => {
      console.log('Checking for critical alert escalations...');
      await this.escalateCriticalAlerts();
    });

    console.log('Maintenance Alert Scheduler started successfully');
  }

  /**
   * Stop all scheduled jobs
   */
  public stop() {
    if (this.checkHighRiskJob) {
      this.checkHighRiskJob.stop();
      this.checkHighRiskJob = null;
    }
    if (this.dailyDigestJob) {
      this.dailyDigestJob.stop();
      this.dailyDigestJob = null;
    }
    if (this.criticalEscalationJob) {
      this.criticalEscalationJob.stop();
      this.criticalEscalationJob = null;
    }
    console.log('Maintenance Alert Scheduler stopped');
  }

  /**
   * Check for high-risk vehicles and create alerts
   */
  private async checkHighRiskVehicles() {
    try {
      // Get all active fleet vehicles
      const vehicles = await db
        .select()
        .from(fleetVehicles)
        .where(eq(fleetVehicles.isActive, true));

      for (const vehicle of vehicles) {
        // Run prediction for each vehicle
        const prediction = await this.predictionService.predictMaintenanceForVehicle(vehicle.id);
        
        if (prediction && (prediction.riskLevel === 'high' || prediction.riskLevel === 'critical')) {
          // Check if alert already exists for this vehicle and service type in last 24 hours
          const existingAlert = await db
            .select()
            .from(maintenanceAlerts)
            .where(
              and(
                eq(maintenanceAlerts.vehicleId, vehicle.id),
                eq(maintenanceAlerts.alertType, `${prediction.serviceType}_risk`),
                gte(maintenanceAlerts.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000))
              )
            )
            .limit(1);

          if (existingAlert.length === 0) {
            // Create new alert
            const alert = await db.insert(maintenanceAlerts).values({
              vehicleId: vehicle.id,
              alertType: `${prediction.serviceType}_risk`,
              severity: prediction.riskLevel === 'critical' ? 'critical' : 'high',
              message: `${prediction.riskLevel === 'critical' ? 'CRITICAL' : 'HIGH'} risk: ${prediction.serviceType} maintenance needed for ${vehicle.unitNumber}. ${prediction.reasoning}`,
              triggerValue: prediction.confidence.toString(),
              threshold: '0.7', // 70% confidence threshold
              notificationSent: false
            }).returning();

            // Send notification
            await this.sendAlertNotification(vehicle.id, alert[0]);
          }
        }
      }
    } catch (error) {
      console.error('Error checking high-risk vehicles:', error);
    }
  }

  /**
   * Send daily maintenance digest to fleet managers
   */
  private async sendDailyDigest() {
    try {
      // Get all fleet accounts
      const fleetAccountsList = await db.select().from(fleetAccounts);

      for (const fleet of fleetAccountsList) {
        // Get upcoming maintenance for next 7 days
        const upcomingMaintenance = await db
          .select({
            vehicleId: maintenancePredictions.vehicleId,
            vehicleUnit: fleetVehicles.unitNumber,
            serviceType: maintenancePredictions.serviceType,
            predictedDate: maintenancePredictions.predictedDate,
            riskLevel: maintenancePredictions.riskLevel,
            estimatedCost: maintenancePredictions.estimatedCost
          })
          .from(maintenancePredictions)
          .leftJoin(fleetVehicles, eq(maintenancePredictions.vehicleId, fleetVehicles.id))
          .where(
            and(
              eq(fleetVehicles.fleetAccountId, fleet.id),
              gte(maintenancePredictions.predictedDate, new Date()),
              lt(maintenancePredictions.predictedDate, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
            )
          )
          .orderBy(maintenancePredictions.predictedDate, maintenancePredictions.riskLevel);

        if (upcomingMaintenance.length === 0) continue;

        // Get unacknowledged alerts
        const unacknowledgedAlerts = await db
          .select({
            count: sql<number>`count(*)`
          })
          .from(maintenanceAlerts)
          .leftJoin(fleetVehicles, eq(maintenanceAlerts.vehicleId, fleetVehicles.id))
          .where(
            and(
              eq(fleetVehicles.fleetAccountId, fleet.id),
              isNull(maintenanceAlerts.acknowledgedAt)
            )
          )
          .then(rows => rows[0]?.count || 0);

        // Calculate total estimated cost
        const totalCost = upcomingMaintenance.reduce((sum, item) => sum + item.estimatedCost, 0);

        // Group by risk level
        const byRiskLevel = upcomingMaintenance.reduce((acc, item) => {
          acc[item.riskLevel] = (acc[item.riskLevel] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        // Send digest email
        await this.sendDigestEmail(fleet, {
          upcomingMaintenance: upcomingMaintenance as DailyDigestItem[],
          unacknowledgedAlerts,
          totalCost,
          byRiskLevel
        });

        // Create notification
        await db.insert(notifications).values({
          userId: fleet.primaryContactEmail,
          type: 'maintenance',
          title: 'Daily Maintenance Digest',
          message: `${upcomingMaintenance.length} maintenance items scheduled for the next 7 days. Total estimated cost: $${totalCost.toFixed(2)}`,
          relatedEntityType: 'maintenance_digest',
          relatedEntityId: fleet.id,
          priority: 'normal',
          actionUrl: '/fleet/maintenance-predictor',
          metadata: {
            itemCount: upcomingMaintenance.length,
            totalCost,
            byRiskLevel
          }
        });
      }
    } catch (error) {
      console.error('Error sending daily digest:', error);
    }
  }

  /**
   * Escalate critical alerts that haven't been acknowledged
   */
  private async escalateCriticalAlerts() {
    try {
      // Find critical alerts not acknowledged within 2 hours
      const criticalAlerts = await db
        .select({
          alert: maintenanceAlerts,
          vehicle: fleetVehicles,
          fleet: fleetAccounts
        })
        .from(maintenanceAlerts)
        .leftJoin(fleetVehicles, eq(maintenanceAlerts.vehicleId, fleetVehicles.id))
        .leftJoin(fleetAccounts, eq(fleetVehicles.fleetAccountId, fleetAccounts.id))
        .where(
          and(
            eq(maintenanceAlerts.severity, 'critical'),
            isNull(maintenanceAlerts.acknowledgedAt),
            lte(maintenanceAlerts.createdAt, new Date(Date.now() - 2 * 60 * 60 * 1000))
          )
        );

      for (const { alert, vehicle, fleet } of criticalAlerts) {
        if (!vehicle || !fleet) continue;

        // Check if escalation already sent
        const escalationKey = `escalated_${alert.id}`;
        const escalationSent = await db
          .select()
          .from(notifications)
          .where(
            and(
              eq(notifications.relatedEntityId, escalationKey),
              gte(notifications.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000))
            )
          )
          .limit(1);

        if (escalationSent.length === 0) {
          // Send escalation notification
          await this.sendEscalationNotification(alert, vehicle, fleet);

          // Mark as escalated
          await db.insert(notifications).values({
            userId: fleet.primaryContactEmail,
            type: 'maintenance',
            title: '⚠️ CRITICAL ALERT ESCALATION',
            message: `Critical maintenance alert for ${vehicle.unitNumber} has not been acknowledged for over 2 hours!`,
            relatedEntityType: 'maintenance_escalation',
            relatedEntityId: escalationKey,
            priority: 'urgent',
            actionUrl: `/fleet/maintenance-predictor?alertId=${alert.id}`,
            metadata: {
              alertId: alert.id,
              vehicleId: vehicle.id,
              vehicleUnit: vehicle.unitNumber,
              alertType: alert.alertType,
              hoursUnacknowledged: Math.floor((Date.now() - alert.createdAt.getTime()) / (60 * 60 * 1000))
            }
          });

          // Send SMS notification if configured
          if (fleet.primaryContactPhone) {
            await this.sendSMSEscalation(fleet.primaryContactPhone, vehicle.unitNumber, alert);
          }
        }
      }
    } catch (error) {
      console.error('Error escalating critical alerts:', error);
    }
  }

  /**
   * Send alert notification
   */
  private async sendAlertNotification(vehicleId: string, alert: any) {
    const vehicle = await db
      .select({
        vehicle: fleetVehicles,
        fleet: fleetAccounts
      })
      .from(fleetVehicles)
      .leftJoin(fleetAccounts, eq(fleetVehicles.fleetAccountId, fleetAccounts.id))
      .where(eq(fleetVehicles.id, vehicleId))
      .limit(1)
      .then(rows => rows[0]);

    if (!vehicle?.fleet) return;

    // Create notification
    await db.insert(notifications).values({
      userId: vehicle.fleet.primaryContactEmail,
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
    if (pushNotificationService) {
      await pushNotificationService.sendToFleet(vehicle.fleet.id, {
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
    }

    // Mark notification as sent
    await db
      .update(maintenanceAlerts)
      .set({ notificationSent: true })
      .where(eq(maintenanceAlerts.id, alert.id));
  }

  /**
   * Send digest email
   */
  private async sendDigestEmail(fleet: any, data: any) {
    if (!emailService) return;

    const emailContent = `
      <h2>Daily Maintenance Digest</h2>
      <p>Good morning! Here's your fleet maintenance summary for the next 7 days:</p>
      
      <h3>Summary</h3>
      <ul>
        <li>Total maintenance items: ${data.upcomingMaintenance.length}</li>
        <li>Unacknowledged alerts: ${data.unacknowledgedAlerts}</li>
        <li>Total estimated cost: $${data.totalCost.toFixed(2)}</li>
      </ul>
      
      <h3>Risk Breakdown</h3>
      <ul>
        ${Object.entries(data.byRiskLevel)
          .map(([level, count]) => `<li>${level.toUpperCase()}: ${count} vehicles</li>`)
          .join('')}
      </ul>
      
      <h3>Upcoming Maintenance</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <th style="border: 1px solid #ddd; padding: 8px;">Vehicle</th>
          <th style="border: 1px solid #ddd; padding: 8px;">Service</th>
          <th style="border: 1px solid #ddd; padding: 8px;">Date</th>
          <th style="border: 1px solid #ddd; padding: 8px;">Risk</th>
          <th style="border: 1px solid #ddd; padding: 8px;">Cost</th>
        </tr>
        ${data.upcomingMaintenance
          .map((item: DailyDigestItem) => `
            <tr>
              <td style="border: 1px solid #ddd; padding: 8px;">${item.vehicleUnit}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${item.serviceType}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${new Date(item.predictedDate).toLocaleDateString()}</td>
              <td style="border: 1px solid #ddd; padding: 8px; color: ${
                item.riskLevel === 'critical' ? 'red' : 
                item.riskLevel === 'high' ? 'orange' : 
                item.riskLevel === 'medium' ? 'yellow' : 'green'
              };">${item.riskLevel.toUpperCase()}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">$${item.estimatedCost.toFixed(2)}</td>
            </tr>
          `)
          .join('')}
      </table>
      
      <p style="margin-top: 20px;">
        <a href="${process.env.BASE_URL || 'http://localhost:5000'}/fleet/maintenance-predictor" 
           style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          View Full Dashboard
        </a>
      </p>
    `;

    await emailService.sendEmail({
      to: fleet.primaryContactEmail,
      subject: `Daily Maintenance Digest - ${new Date().toLocaleDateString()}`,
      html: emailContent,
      text: `Daily Maintenance Digest\n\nTotal items: ${data.upcomingMaintenance.length}\nTotal cost: $${data.totalCost.toFixed(2)}\n\nView full dashboard: ${process.env.BASE_URL || 'http://localhost:5000'}/fleet/maintenance-predictor`
    });
  }

  /**
   * Send escalation notification
   */
  private async sendEscalationNotification(alert: any, vehicle: any, fleet: any) {
    if (!emailService) return;

    const emailContent = `
      <h2 style="color: red;">⚠️ CRITICAL MAINTENANCE ALERT - ESCALATION</h2>
      
      <p><strong>This critical alert has not been acknowledged for over 2 hours!</strong></p>
      
      <h3>Alert Details</h3>
      <ul>
        <li><strong>Vehicle:</strong> ${vehicle.unitNumber} (${vehicle.make} ${vehicle.model})</li>
        <li><strong>Alert Type:</strong> ${alert.alertType}</li>
        <li><strong>Severity:</strong> CRITICAL</li>
        <li><strong>Message:</strong> ${alert.message}</li>
        <li><strong>Created:</strong> ${new Date(alert.createdAt).toLocaleString()}</li>
        <li><strong>Hours Unacknowledged:</strong> ${Math.floor((Date.now() - alert.createdAt.getTime()) / (60 * 60 * 1000))}</li>
      </ul>
      
      <p style="background-color: #ffeeee; padding: 10px; border: 1px solid red; border-radius: 5px;">
        <strong>IMMEDIATE ACTION REQUIRED:</strong> This vehicle may be at risk of imminent breakdown. 
        Please acknowledge this alert and schedule maintenance immediately.
      </p>
      
      <p style="margin-top: 20px;">
        <a href="${process.env.BASE_URL || 'http://localhost:5000'}/fleet/maintenance-predictor?alertId=${alert.id}" 
           style="background-color: red; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          ACKNOWLEDGE ALERT NOW
        </a>
      </p>
    `;

    await emailService.sendEmail({
      to: fleet.primaryContactEmail,
      cc: fleet.billingContactEmail,
      subject: `⚠️ CRITICAL ALERT ESCALATION - ${vehicle.unitNumber}`,
      html: emailContent,
      text: `CRITICAL MAINTENANCE ALERT ESCALATION\n\nVehicle: ${vehicle.unitNumber}\nAlert: ${alert.message}\nHours Unacknowledged: ${Math.floor((Date.now() - alert.createdAt.getTime()) / (60 * 60 * 1000))}\n\nIMMEDIATE ACTION REQUIRED!`,
      priority: 'high'
    });
  }

  /**
   * Send SMS escalation
   */
  private async sendSMSEscalation(phone: string, vehicleUnit: string, alert: any) {
    // This would integrate with SMS service (e.g., Twilio)
    // For now, just log the intent
    console.log(`SMS ESCALATION to ${phone}: CRITICAL ALERT for ${vehicleUnit} - ${alert.message}`);
    
    // In production, you would use something like:
    // await twilioClient.messages.create({
    //   body: `CRITICAL: ${vehicleUnit} needs immediate maintenance! ${alert.message}. Acknowledge at ${process.env.BASE_URL}/fleet/maintenance-predictor`,
    //   from: process.env.TWILIO_PHONE,
    //   to: phone
    // });
  }

  /**
   * Manually trigger prediction run for all vehicles
   */
  public async runPredictionsNow() {
    console.log('Running maintenance predictions for all vehicles...');
    await this.predictionService.runFleetPredictions();
  }
}

// Create singleton instance
export const maintenanceAlertScheduler = new MaintenanceAlertScheduler();