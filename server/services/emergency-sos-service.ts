import { db } from "../db";
import { storage } from "../storage";
import { 
  emergencySosAlerts, 
  emergencyContacts,
  emergencyResponseLog,
  contractorProfiles,
  users,
  jobs,
  type EmergencySosAlert,
  type InsertEmergencySosAlert,
  type EmergencyContact,
  type InsertEmergencyContact,
  type InsertEmergencyResponseLog,
  sosAlertTypeEnum,
  sosSeverityEnum,
  sosStatusEnum,
  sosInitiatorTypeEnum,
  sosResponseActionEnum
} from "@shared/schema";
import { eq, and, or, sql, desc, inArray, gte, lt } from "drizzle-orm";
import { emailService } from "./email-service";
import { pushNotificationService } from "./push-notification-service";
import LocationService from "./location-service";
import { format } from "date-fns";

interface Location {
  lat: number;
  lng: number;
  accuracy?: number;
  address?: string;
}

interface CreateSOSAlertParams {
  initiatorId: string;
  initiatorType: 'driver' | 'contractor' | 'fleet_manager' | 'dispatcher';
  location: Location;
  alertType: 'medical' | 'accident' | 'threat' | 'mechanical' | 'other';
  severity: 'critical' | 'high' | 'medium' | 'low';
  message?: string;
  jobId?: string;
  deviceInfo?: any;
}

interface NearbyResponder {
  id: string;
  name: string;
  distance: number;
  estimatedArrival: number; // minutes
  location: Location;
  phone?: string;
  type: 'contractor' | 'emergency_service' | 'fleet_manager';
  isAvailable: boolean;
}

class EmergencySOSService {
  private escalationTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private locationUpdateIntervals: Map<string, NodeJS.Timer> = new Map();
  private readonly ESCALATION_DELAYS = [
    60000,   // 1 minute for level 1
    180000,  // 3 minutes for level 2
    300000   // 5 minutes for level 3
  ];
  
  // Simulated emergency service endpoint
  private readonly EMERGENCY_SERVICE_API = process.env.EMERGENCY_SERVICE_API || 'https://api.911.example.com';

  /**
   * Create a new emergency SOS alert
   */
  async createSOSAlert(params: CreateSOSAlertParams): Promise<EmergencySosAlert> {
    try {
      console.log('[EmergencySOSService] Creating SOS alert:', params);
      
      // Get location address if not provided
      if (!params.location.address) {
        try {
          const addressInfo = await LocationService.reverseGeocode(
            params.location.lat, 
            params.location.lng
          );
          params.location.address = addressInfo.display_name;
        } catch (error) {
          console.error('[EmergencySOSService] Failed to get address:', error);
        }
      }

      // Create the alert
      const [alert] = await db
        .insert(emergencySosAlerts)
        .values({
          initiatorId: params.initiatorId,
          initiatorType: params.initiatorType as any,
          location: params.location,
          alertType: params.alertType as any,
          severity: params.severity as any,
          message: params.message || '',
          jobId: params.jobId,
          deviceInfo: params.deviceInfo,
          status: 'active' as any,
          escalationLevel: 0,
          autoEscalationEnabled: true,
          emergencyServicesNotified: false,
          locationHistory: [params.location],
          notificationsSent: [],
          acknowledgments: []
        })
        .returning();

      // Start auto-escalation timer for critical/high severity
      if (params.severity === 'critical' || params.severity === 'high') {
        this.startAutoEscalation(alert.id, 0);
      }

      // Send immediate notifications
      await this.sendInitialNotifications(alert);

      // Notify emergency services for critical alerts
      if (params.severity === 'critical') {
        await this.notifyEmergencyServices(alert);
      }

      // Start location tracking
      this.startLocationTracking(alert.id);

      return alert;
    } catch (error) {
      console.error('[EmergencySOSService] Error creating SOS alert:', error);
      throw error;
    }
  }

  /**
   * Acknowledge an SOS alert
   */
  async acknowledgeSOSAlert(alertId: string, responderId: string): Promise<EmergencySosAlert> {
    try {
      const [alert] = await db
        .update(emergencySosAlerts)
        .set({
          status: 'acknowledged' as any,
          responderId,
          responseTime: new Date(),
          acknowledgments: sql`acknowledgments || jsonb_build_array(jsonb_build_object(
            'responderId', ${responderId},
            'timestamp', ${new Date().toISOString()},
            'action', 'acknowledged'
          ))`,
          updatedAt: new Date()
        })
        .where(eq(emergencySosAlerts.id, alertId))
        .returning();

      // Stop auto-escalation
      this.stopAutoEscalation(alertId);

      // Log the response
      await this.logResponse({
        sosAlertId: alertId,
        responderId,
        action: 'acknowledged' as any,
        actionDetails: 'Alert acknowledged by responder'
      });

      // Notify initiator
      await this.notifyInitiator(alert, 'acknowledged', responderId);

      return alert;
    } catch (error) {
      console.error('[EmergencySOSService] Error acknowledging SOS alert:', error);
      throw error;
    }
  }

  /**
   * Resolve an SOS alert
   */
  async resolveSOSAlert(
    alertId: string, 
    resolution: 'resolved' | 'false_alarm' | 'cancelled',
    notes?: string,
    responderId?: string
  ): Promise<EmergencySosAlert> {
    try {
      const updateData: any = {
        status: resolution as any,
        resolvedAt: new Date(),
        resolutionNotes: notes,
        updatedAt: new Date()
      };

      if (resolution === 'false_alarm' && responderId) {
        updateData.falseAlarmMarkedBy = responderId;
        updateData.falseAlarmReason = notes;
      }

      const [alert] = await db
        .update(emergencySosAlerts)
        .set(updateData)
        .where(eq(emergencySosAlerts.id, alertId))
        .returning();

      // Stop all tracking
      this.stopAutoEscalation(alertId);
      this.stopLocationTracking(alertId);

      // Log the resolution
      if (responderId) {
        await this.logResponse({
          sosAlertId: alertId,
          responderId,
          action: 'resolved' as any,
          actionDetails: `Alert ${resolution}`,
          notes
        });
      }

      // Generate incident report
      await this.generateIncidentReport(alert);

      return alert;
    } catch (error) {
      console.error('[EmergencySOSService] Error resolving SOS alert:', error);
      throw error;
    }
  }

  /**
   * Get all active SOS alerts
   */
  async getActiveSOSAlerts(): Promise<EmergencySosAlert[]> {
    try {
      const alerts = await db
        .select()
        .from(emergencySosAlerts)
        .where(
          inArray(emergencySosAlerts.status, ['active', 'acknowledged'] as any[])
        )
        .orderBy(desc(emergencySosAlerts.severity), desc(emergencySosAlerts.createdAt));

      return alerts;
    } catch (error) {
      console.error('[EmergencySOSService] Error getting active alerts:', error);
      throw error;
    }
  }

  /**
   * Get emergency contacts for a user
   */
  async getEmergencyContacts(userId: string): Promise<EmergencyContact[]> {
    try {
      const contacts = await db
        .select()
        .from(emergencyContacts)
        .where(
          and(
            eq(emergencyContacts.userId, userId),
            eq(emergencyContacts.isActive, true)
          )
        )
        .orderBy(desc(emergencyContacts.isPrimary));

      return contacts;
    } catch (error) {
      console.error('[EmergencySOSService] Error getting emergency contacts:', error);
      throw error;
    }
  }

  /**
   * Add or update emergency contact
   */
  async upsertEmergencyContact(contact: InsertEmergencyContact): Promise<EmergencyContact> {
    try {
      // If marking as primary, unset other primary contacts
      if (contact.isPrimary) {
        await db
          .update(emergencyContacts)
          .set({ isPrimary: false })
          .where(eq(emergencyContacts.userId, contact.userId));
      }

      const [result] = await db
        .insert(emergencyContacts)
        .values(contact)
        .onConflictDoUpdate({
          target: emergencyContacts.id,
          set: contact
        })
        .returning();

      return result;
    } catch (error) {
      console.error('[EmergencySOSService] Error upserting emergency contact:', error);
      throw error;
    }
  }

  /**
   * Find nearby responders
   */
  async findNearbyResponders(
    location: Location, 
    radiusMiles: number = 50
  ): Promise<NearbyResponder[]> {
    try {
      // Get all available contractors within radius
      const contractors = await db
        .select({
          id: contractorProfiles.id,
          userId: contractorProfiles.userId,
          companyName: contractorProfiles.companyName,
          phone: contractorProfiles.phone,
          currentLocation: contractorProfiles.currentLocation,
          isAvailable: contractorProfiles.isAvailable
        })
        .from(contractorProfiles)
        .where(
          and(
            eq(contractorProfiles.isAvailable, true),
            sql`ST_DWithin(
              ST_MakePoint(
                (${contractorProfiles.currentLocation}->>'lng')::float,
                (${contractorProfiles.currentLocation}->>'lat')::float
              )::geography,
              ST_MakePoint(${location.lng}, ${location.lat})::geography,
              ${radiusMiles * 1609.34}
            )`
          )
        );

      // Calculate distances and estimated arrival times
      const responders: NearbyResponder[] = [];
      
      for (const contractor of contractors) {
        if (contractor.currentLocation) {
          const distance = LocationService.calculateDistance(
            location,
            contractor.currentLocation as Location
          );
          
          // Estimate arrival time based on average speed (30 mph in emergency)
          const estimatedArrival = Math.ceil((distance / 30) * 60);
          
          responders.push({
            id: contractor.userId,
            name: contractor.companyName,
            distance,
            estimatedArrival,
            location: contractor.currentLocation as Location,
            phone: contractor.phone || undefined,
            type: 'contractor',
            isAvailable: contractor.isAvailable
          });
        }
      }

      // Sort by distance
      responders.sort((a, b) => a.distance - b.distance);

      // Add simulated emergency services
      if (radiusMiles >= 10) {
        responders.unshift({
          id: 'emergency-911',
          name: '911 Emergency Services',
          distance: 0,
          estimatedArrival: 8, // Average emergency response time
          location,
          type: 'emergency_service',
          isAvailable: true
        });
      }

      return responders.slice(0, 10); // Return top 10 nearest
    } catch (error) {
      console.error('[EmergencySOSService] Error finding nearby responders:', error);
      return [];
    }
  }

  /**
   * Log emergency response action
   */
  async logResponse(params: InsertEmergencyResponseLog): Promise<void> {
    try {
      await db.insert(emergencyResponseLog).values(params);
    } catch (error) {
      console.error('[EmergencySOSService] Error logging response:', error);
    }
  }

  /**
   * Get SOS alert history for a user
   */
  async getSOSAlertHistory(userId: string, limit: number = 50): Promise<EmergencySosAlert[]> {
    try {
      const alerts = await db
        .select()
        .from(emergencySosAlerts)
        .where(eq(emergencySosAlerts.initiatorId, userId))
        .orderBy(desc(emergencySosAlerts.createdAt))
        .limit(limit);

      return alerts;
    } catch (error) {
      console.error('[EmergencySOSService] Error getting alert history:', error);
      throw error;
    }
  }

  /**
   * Update alert location
   */
  async updateAlertLocation(alertId: string, location: Location): Promise<void> {
    try {
      await db
        .update(emergencySosAlerts)
        .set({
          location,
          locationHistory: sql`locationHistory || jsonb_build_array(${JSON.stringify({
            ...location,
            timestamp: new Date().toISOString()
          })})`,
          updatedAt: new Date()
        })
        .where(eq(emergencySosAlerts.id, alertId));
    } catch (error) {
      console.error('[EmergencySOSService] Error updating alert location:', error);
    }
  }

  /**
   * Test the SOS system (for drills and testing)
   */
  async testSOSSystem(userId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Create a test alert
      const testAlert = await this.createSOSAlert({
        initiatorId: userId,
        initiatorType: 'driver',
        location: {
          lat: 40.7128,
          lng: -74.0060,
          address: 'Test Location - New York, NY'
        },
        alertType: 'other',
        severity: 'low',
        message: 'TEST ALERT - This is a test of the emergency SOS system. No action required.',
        deviceInfo: { test: true }
      });

      // Immediately mark as false alarm
      await this.resolveSOSAlert(
        testAlert.id,
        'false_alarm',
        'System test - automatically resolved',
        userId
      );

      return {
        success: true,
        message: 'SOS system test completed successfully'
      };
    } catch (error) {
      console.error('[EmergencySOSService] Error testing SOS system:', error);
      return {
        success: false,
        message: 'SOS system test failed'
      };
    }
  }

  // Private helper methods

  private async sendInitialNotifications(alert: EmergencySosAlert): Promise<void> {
    try {
      // Get emergency contacts
      const contacts = await this.getEmergencyContacts(alert.initiatorId);
      
      // Get nearby responders
      const responders = await this.findNearbyResponders(
        alert.location as Location,
        alert.severity === 'critical' ? 100 : 50
      );

      // Send notifications to emergency contacts
      for (const contact of contacts) {
        if (contact.autoNotifyOnSos) {
          await this.notifyEmergencyContact(contact, alert);
        }
      }

      // Send notifications to nearby responders
      for (const responder of responders.slice(0, 5)) {
        await this.notifyResponder(responder, alert);
      }

      // Update notification tracking
      await db
        .update(emergencySosAlerts)
        .set({
          notificationsSent: [
            ...contacts.map(c => ({ 
              type: 'emergency_contact',
              id: c.id,
              timestamp: new Date().toISOString()
            })),
            ...responders.slice(0, 5).map(r => ({
              type: 'responder',
              id: r.id,
              timestamp: new Date().toISOString()
            }))
          ]
        })
        .where(eq(emergencySosAlerts.id, alert.id));
    } catch (error) {
      console.error('[EmergencySOSService] Error sending notifications:', error);
    }
  }

  private async notifyEmergencyContact(contact: EmergencyContact, alert: EmergencySosAlert): Promise<void> {
    const message = `🚨 EMERGENCY ALERT 🚨\n` +
      `Your contact has triggered an emergency SOS.\n` +
      `Type: ${alert.alertType}\n` +
      `Severity: ${alert.severity}\n` +
      `Location: ${(alert.location as any).address || 'Unknown'}\n` +
      `Message: ${alert.message || 'No message'}\n` +
      `Time: ${format(new Date(alert.createdAt), 'PPpp')}`;

    // Send based on preference
    if (contact.notificationPreference === 'all' || contact.notificationPreference === 'email') {
      if (contact.contactEmail) {
        await emailService.sendEmergencyAlert(contact.contactEmail, message, alert);
      }
    }
    
    if (contact.notificationPreference === 'all' || contact.notificationPreference === 'sms') {
      if (contact.contactPhone) {
        // TODO: Integrate with SMS service (Twilio)
        console.log(`[EmergencySOSService] Would send SMS to ${contact.contactPhone}: ${message}`);
      }
    }
  }

  private async notifyResponder(responder: NearbyResponder, alert: EmergencySosAlert): Promise<void> {
    // Send push notification
    await pushNotificationService.sendToUser(responder.id, {
      title: '🚨 Emergency SOS Alert',
      body: `${alert.severity.toUpperCase()} priority emergency ${responder.distance.toFixed(1)} miles away`,
      data: {
        type: 'emergency_sos',
        alertId: alert.id,
        severity: alert.severity,
        location: alert.location
      }
    });
  }

  private async notifyInitiator(alert: EmergencySosAlert, action: string, responderId: string): Promise<void> {
    await pushNotificationService.sendToUser(alert.initiatorId, {
      title: '✅ Help is on the way',
      body: `Your emergency alert has been ${action}. A responder is coming to help.`,
      data: {
        type: 'sos_update',
        alertId: alert.id,
        action,
        responderId
      }
    });
  }

  private async notifyEmergencyServices(alert: EmergencySosAlert): Promise<void> {
    try {
      // Simulate 911 integration
      console.log('[EmergencySOSService] Notifying emergency services:', {
        alertId: alert.id,
        severity: alert.severity,
        location: alert.location,
        type: alert.alertType
      });

      // In production, this would integrate with actual emergency services API
      const referenceId = `SIM-${Date.now()}`;
      
      await db
        .update(emergencySosAlerts)
        .set({
          emergencyServicesNotified: true,
          emergencyServicesNotifiedAt: new Date(),
          emergencyServiceReferenceId: referenceId
        })
        .where(eq(emergencySosAlerts.id, alert.id));
    } catch (error) {
      console.error('[EmergencySOSService] Error notifying emergency services:', error);
    }
  }

  private startAutoEscalation(alertId: string, level: number): void {
    if (level >= this.ESCALATION_DELAYS.length) {
      return; // Max escalation reached
    }

    const timeout = setTimeout(async () => {
      try {
        // Check if alert is still active
        const [alert] = await db
          .select()
          .from(emergencySosAlerts)
          .where(eq(emergencySosAlerts.id, alertId));

        if (alert && alert.status === 'active') {
          // Escalate
          await db
            .update(emergencySosAlerts)
            .set({
              escalationLevel: level + 1,
              escalatedAt: new Date()
            })
            .where(eq(emergencySosAlerts.id, alertId));

          // Notify emergency services if not already done
          if (!alert.emergencyServicesNotified && level >= 1) {
            await this.notifyEmergencyServices(alert);
          }

          // Send escalation notifications
          await this.sendEscalationNotifications(alert, level + 1);

          // Continue escalation
          this.startAutoEscalation(alertId, level + 1);
        }
      } catch (error) {
        console.error('[EmergencySOSService] Error during auto-escalation:', error);
      }
    }, this.ESCALATION_DELAYS[level]);

    this.escalationTimeouts.set(alertId, timeout);
  }

  private stopAutoEscalation(alertId: string): void {
    const timeout = this.escalationTimeouts.get(alertId);
    if (timeout) {
      clearTimeout(timeout);
      this.escalationTimeouts.delete(alertId);
    }
  }

  private async sendEscalationNotifications(alert: EmergencySosAlert, level: number): Promise<void> {
    console.log(`[EmergencySOSService] Escalating alert ${alert.id} to level ${level}`);
    
    // Expand search radius with each escalation
    const radius = 50 * (level + 1);
    const responders = await this.findNearbyResponders(alert.location as Location, radius);
    
    // Notify additional responders
    for (const responder of responders.slice(level * 5, (level + 1) * 5)) {
      await this.notifyResponder(responder, alert);
    }
  }

  private startLocationTracking(alertId: string): void {
    // Update location every 30 seconds during emergency
    const interval = setInterval(async () => {
      // This would be triggered by actual location updates from the client
      // For now, just log that tracking is active
      console.log(`[EmergencySOSService] Location tracking active for alert ${alertId}`);
    }, 30000);

    this.locationUpdateIntervals.set(alertId, interval);
  }

  private stopLocationTracking(alertId: string): void {
    const interval = this.locationUpdateIntervals.get(alertId);
    if (interval) {
      clearInterval(interval);
      this.locationUpdateIntervals.delete(alertId);
    }
  }

  private async generateIncidentReport(alert: EmergencySosAlert): Promise<void> {
    try {
      console.log('[EmergencySOSService] Generating incident report for alert:', alert.id);
      
      // Get all response logs
      const responseLogs = await db
        .select()
        .from(emergencyResponseLog)
        .where(eq(emergencyResponseLog.sosAlertId, alert.id))
        .orderBy(emergencyResponseLog.timestamp);

      // Generate report data
      const report = {
        alertId: alert.id,
        initiatorId: alert.initiatorId,
        alertType: alert.alertType,
        severity: alert.severity,
        location: alert.location,
        createdAt: alert.createdAt,
        resolvedAt: alert.resolvedAt,
        responseTime: alert.responseTime,
        escalationLevel: alert.escalationLevel,
        emergencyServicesNotified: alert.emergencyServicesNotified,
        status: alert.status,
        resolutionNotes: alert.resolutionNotes,
        responseLogs,
        generatedAt: new Date()
      };

      // Store report in metadata
      await db
        .update(emergencySosAlerts)
        .set({
          metadata: { 
            ...((alert.metadata as any) || {}),
            incidentReport: report 
          }
        })
        .where(eq(emergencySosAlerts.id, alert.id));

      console.log('[EmergencySOSService] Incident report generated successfully');
    } catch (error) {
      console.error('[EmergencySOSService] Error generating incident report:', error);
    }
  }
}

// Export singleton instance
export const emergencySOSService = new EmergencySOSService();