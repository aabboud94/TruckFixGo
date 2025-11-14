import { storage } from "../storage";
import { emailService } from "./email-service";
import { pushNotificationService } from "./push-notification-service";
import {
  type ServiceHistory,
  type InsertServiceHistory,
  type ServiceSchedule,
  type InsertServiceSchedule,
  type ServiceRecommendation,
  type InsertServiceRecommendation,
  type VehicleMaintenanceLog,
  type InsertVehicleMaintenanceLog,
  type Job,
  type FleetVehicle,
  serviceHistoryTypeEnum
} from "@shared/schema";

// Manufacturer recommended service intervals (in miles and months)
const DEFAULT_SERVICE_INTERVALS = {
  oil_change: { miles: 5000, months: 6 },
  tire_rotation: { miles: 6000, months: 6 },
  brake_service: { miles: 30000, months: 24 },
  transmission_service: { miles: 60000, months: 48 },
  coolant_flush: { miles: 50000, months: 36 },
  air_filter: { miles: 15000, months: 12 },
  fuel_filter: { miles: 30000, months: 24 },
  inspection: { miles: 10000, months: 12 },
  battery_replacement: { miles: null, months: 36 },
  alignment: { miles: 20000, months: 12 },
  differential_service: { miles: 50000, months: 36 },
  power_steering_flush: { miles: 50000, months: 36 },
  spark_plug_replacement: { miles: 30000, months: 36 },
  belt_replacement: { miles: 60000, months: 48 },
  wiper_replacement: { miles: null, months: 12 }
};

class ServiceHistoryService {
  /**
   * Record service history from a completed job
   */
  async recordServiceFromJob(job: Job): Promise<ServiceHistory | null> {
    try {
      // Only record service for completed jobs
      if (job.status !== 'completed') {
        return null;
      }

      // Determine service type from job
      const serviceType = this.getServiceTypeFromJob(job);
      if (!serviceType) {
        return null;
      }

      const serviceHistory: InsertServiceHistory = {
        jobId: job.id,
        vehicleId: job.vehicleId || '',
        contractorId: job.contractorId,
        fleetAccountId: job.fleetAccountId,
        serviceType,
        serviceDate: job.completedAt || new Date(),
        description: job.description || '',
        mileage: job.vehicleMileage || null,
        partsUsed: job.partsUsed || null,
        laborHours: job.laborHours || null,
        partsCost: job.partsCost || null,
        laborCost: job.laborCost || null,
        totalCost: job.totalCost || null,
        warrantyInfo: job.warrantyInfo || null,
        warrantyExpiresAt: this.calculateWarrantyExpiration(job),
        invoiceId: job.invoiceId || null,
        notes: job.completionNotes || null,
        performedBy: job.contractorName || null,
        metadata: {
          jobNumber: job.jobNumber,
          completedBy: job.contractorId,
          rating: job.rating
        }
      };

      // Record the service
      const recorded = await storage.recordServiceHistory(serviceHistory);

      // Update service schedule if applicable
      if (recorded && job.vehicleId) {
        await this.updateServiceSchedule(job.vehicleId, serviceType, {
          lastServiceDate: recorded.serviceDate,
          lastServiceMileage: recorded.mileage
        });

        // Check for upcoming services
        await this.checkAndGenerateRecommendations(job.vehicleId);
      }

      return recorded;
    } catch (error) {
      console.error('Error recording service from job:', error);
      return null;
    }
  }

  /**
   * Calculate next service due dates based on intervals
   */
  async calculateNextServiceDue(
    vehicleId: string, 
    serviceType: string,
    lastServiceDate?: Date | null,
    lastServiceMileage?: number | null,
    currentMileage?: number
  ): Promise<{ nextDueDate: Date | null; nextDueMileage: number | null; isOverdue: boolean; overdueBy: number | null }> {
    const intervals = DEFAULT_SERVICE_INTERVALS[serviceType as keyof typeof DEFAULT_SERVICE_INTERVALS];
    if (!intervals) {
      return { nextDueDate: null, nextDueMileage: null, isOverdue: false, overdueBy: null };
    }

    // Calculate next due date
    let nextDueDate: Date | null = null;
    if (lastServiceDate && intervals.months) {
      nextDueDate = new Date(lastServiceDate);
      nextDueDate.setMonth(nextDueDate.getMonth() + intervals.months);
    }

    // Calculate next due mileage
    let nextDueMileage: number | null = null;
    if (lastServiceMileage && intervals.miles) {
      nextDueMileage = lastServiceMileage + intervals.miles;
    }

    // Check if overdue
    const now = new Date();
    let isOverdue = false;
    let overdueBy: number | null = null;

    if (nextDueDate && nextDueDate < now) {
      isOverdue = true;
      overdueBy = Math.floor((now.getTime() - nextDueDate.getTime()) / (1000 * 60 * 60 * 24)); // Days overdue
    }

    if (currentMileage && nextDueMileage && currentMileage > nextDueMileage) {
      isOverdue = true;
      if (!overdueBy || (currentMileage - nextDueMileage) > overdueBy) {
        overdueBy = currentMileage - nextDueMileage; // Miles overdue
      }
    }

    return { nextDueDate, nextDueMileage, isOverdue, overdueBy };
  }

  /**
   * Generate service recommendations based on vehicle data
   */
  async generateServiceRecommendations(vehicleId: string): Promise<ServiceRecommendation[]> {
    try {
      const vehicle = await storage.getFleetVehicle(vehicleId);
      if (!vehicle) return [];

      const serviceHistory = await storage.getVehicleServiceHistory(vehicleId, {
        limit: 100,
        orderBy: 'serviceDate',
        orderDir: 'desc'
      });

      const recommendations: InsertServiceRecommendation[] = [];
      const currentMileage = vehicle.currentMileage || 0;
      const vehicleAge = this.getVehicleAgeInMonths(vehicle.year);

      // Check each service type
      for (const [serviceType, intervals] of Object.entries(DEFAULT_SERVICE_INTERVALS)) {
        // Find last service of this type
        const lastService = serviceHistory.find(s => s.serviceType === serviceType);
        
        const { nextDueDate, nextDueMileage, isOverdue, overdueBy } = await this.calculateNextServiceDue(
          vehicleId,
          serviceType,
          lastService?.serviceDate,
          lastService?.mileage,
          currentMileage
        );

        // Generate recommendation if due or overdue
        if (isOverdue || this.isServiceDueSoon(nextDueDate, nextDueMileage, currentMileage)) {
          const priority = this.calculatePriority(isOverdue, overdueBy, serviceType);
          const estimatedCost = this.estimateServiceCost(serviceType, vehicle.type);

          recommendations.push({
            vehicleId,
            fleetAccountId: vehicle.fleetAccountId,
            serviceType: serviceType as any,
            priority,
            recommendedDate: nextDueDate || new Date(),
            reason: this.generateRecommendationReason(serviceType, isOverdue, overdueBy),
            estimatedCost: String(estimatedCost),
            generatedBy: 'system',
            confidence: '0.85',
            supportingData: {
              lastServiceDate: lastService?.serviceDate,
              lastServiceMileage: lastService?.mileage,
              currentMileage,
              vehicleAge,
              nextDueDate,
              nextDueMileage,
              isOverdue,
              overdueBy
            }
          });
        }
      }

      // Save recommendations to database
      const savedRecommendations = await Promise.all(
        recommendations.map(rec => storage.createServiceRecommendation(rec))
      );

      return savedRecommendations.filter(r => r !== null) as ServiceRecommendation[];
    } catch (error) {
      console.error('Error generating service recommendations:', error);
      return [];
    }
  }

  /**
   * Send service reminder notifications
   */
  async sendServiceReminders(vehicleId: string): Promise<void> {
    try {
      const vehicle = await storage.getFleetVehicle(vehicleId);
      if (!vehicle) return;

      const upcomingServices = await storage.getUpcomingServices(vehicleId);
      const overdueServices = upcomingServices.filter(s => s.isOverdue);
      const dueSoonServices = upcomingServices.filter(s => !s.isOverdue && this.isDueSoon(s.nextDueDate));

      if (overdueServices.length === 0 && dueSoonServices.length === 0) {
        return;
      }

      // Get fleet contacts
      const fleetContacts = await storage.getFleetContacts(vehicle.fleetAccountId);
      
      for (const contact of fleetContacts) {
        if (!contact.isActive) continue;

        // Prepare notification message
        const message = this.buildServiceReminderMessage(vehicle, overdueServices, dueSoonServices);

        // Send email notification
        if (contact.email && contact.notificationPreferences?.email) {
          await emailService.sendServiceReminder({
            to: contact.email,
            vehicleInfo: `${vehicle.year} ${vehicle.make} ${vehicle.model} (${vehicle.licensePlate})`,
            overdueServices: overdueServices.map(s => ({
              type: s.serviceType,
              overdueBy: s.overdueBy || 0,
              lastServiceDate: s.lastServiceDate
            })),
            upcomingServices: dueSoonServices.map(s => ({
              type: s.serviceType,
              dueDate: s.nextDueDate,
              dueMileage: s.nextDueMileage
            }))
          });
        }

        // Send push notification
        if (contact.userId) {
          await pushNotificationService.sendNotification(
            contact.userId,
            'Service Reminder',
            message,
            {
              type: 'maintenance',
              vehicleId,
              urgency: overdueServices.length > 0 ? 'high' : 'medium'
            }
          );
        }
      }

      // Update alert sent timestamp
      await storage.updateServiceSchedulesAlertTime(vehicleId);
    } catch (error) {
      console.error('Error sending service reminders:', error);
    }
  }

  /**
   * Create a comprehensive maintenance report for a vehicle
   */
  async generateMaintenanceReport(vehicleId: string, dateRange?: { startDate: Date; endDate: Date }) {
    try {
      const vehicle = await storage.getFleetVehicle(vehicleId);
      if (!vehicle) {
        throw new Error('Vehicle not found');
      }

      // Get service history
      const serviceHistory = await storage.getVehicleServiceHistory(vehicleId, {
        startDate: dateRange?.startDate,
        endDate: dateRange?.endDate,
        limit: 1000
      });

      // Get upcoming services
      const upcomingServices = await storage.getUpcomingServices(vehicleId);

      // Get service recommendations
      const recommendations = await storage.getServiceRecommendations(vehicleId, { isCompleted: false });

      // Get maintenance logs
      const maintenanceLogs = await storage.getVehicleMaintenanceLogs(vehicleId, {
        startDate: dateRange?.startDate,
        endDate: dateRange?.endDate
      });

      // Calculate statistics
      const stats = this.calculateMaintenanceStats(serviceHistory);

      // Generate report
      const report = {
        vehicle: {
          id: vehicle.id,
          year: vehicle.year,
          make: vehicle.make,
          model: vehicle.model,
          vin: vehicle.vin,
          licensePlate: vehicle.licensePlate,
          currentMileage: vehicle.currentMileage,
          status: vehicle.status
        },
        statistics: stats,
        serviceHistory: serviceHistory.map(s => ({
          id: s.id,
          serviceType: s.serviceType,
          serviceDate: s.serviceDate,
          mileage: s.mileage,
          description: s.description,
          totalCost: s.totalCost,
          performedBy: s.performedBy,
          warrantyExpiresAt: s.warrantyExpiresAt
        })),
        upcomingServices: upcomingServices.map(s => ({
          serviceType: s.serviceType,
          nextDueDate: s.nextDueDate,
          nextDueMileage: s.nextDueMileage,
          isOverdue: s.isOverdue,
          overdueBy: s.overdueBy
        })),
        recommendations: recommendations.map(r => ({
          id: r.id,
          serviceType: r.serviceType,
          priority: r.priority,
          recommendedDate: r.recommendedDate,
          reason: r.reason,
          estimatedCost: r.estimatedCost
        })),
        maintenanceLogs: maintenanceLogs.map(l => ({
          id: l.id,
          logType: l.logType,
          entryDate: l.entryDate,
          notes: l.notes,
          mileageAtEntry: l.mileageAtEntry
        })),
        generatedAt: new Date()
      };

      return report;
    } catch (error) {
      console.error('Error generating maintenance report:', error);
      throw error;
    }
  }

  /**
   * Track warranty information and check expiration
   */
  async checkWarrantyExpiration(vehicleId: string): Promise<Array<{ service: ServiceHistory; daysUntilExpiration: number; isExpired: boolean }>> {
    const serviceHistory = await storage.getVehicleServiceHistory(vehicleId, {
      hasWarranty: true
    });

    const now = new Date();
    const warrantyStatus = [];

    for (const service of serviceHistory) {
      if (service.warrantyExpiresAt) {
        const expiresAt = new Date(service.warrantyExpiresAt);
        const daysUntilExpiration = Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        warrantyStatus.push({
          service,
          daysUntilExpiration,
          isExpired: daysUntilExpiration < 0
        });
      }
    }

    return warrantyStatus;
  }

  /**
   * Update service schedule for a vehicle
   */
  private async updateServiceSchedule(
    vehicleId: string,
    serviceType: string,
    updates: Partial<InsertServiceSchedule>
  ): Promise<ServiceSchedule | null> {
    try {
      const existing = await storage.getServiceSchedule(vehicleId, serviceType);
      
      const intervals = DEFAULT_SERVICE_INTERVALS[serviceType as keyof typeof DEFAULT_SERVICE_INTERVALS];
      if (!intervals) return null;

      // Calculate next due dates
      const { nextDueDate, nextDueMileage, isOverdue, overdueBy } = await this.calculateNextServiceDue(
        vehicleId,
        serviceType,
        updates.lastServiceDate || existing?.lastServiceDate,
        updates.lastServiceMileage || existing?.lastServiceMileage
      );

      const scheduleData: InsertServiceSchedule = {
        vehicleId,
        serviceType: serviceType as any,
        intervalMiles: intervals.miles,
        intervalMonths: intervals.months,
        lastServiceDate: updates.lastServiceDate || existing?.lastServiceDate || null,
        lastServiceMileage: updates.lastServiceMileage || existing?.lastServiceMileage || null,
        nextDueDate,
        nextDueMileage,
        isOverdue,
        overdueBy,
        isActive: updates.isActive !== undefined ? updates.isActive : (existing?.isActive ?? true),
        customNotes: updates.customNotes || existing?.customNotes || null,
        metadata: updates.metadata || existing?.metadata || null
      };

      return await storage.updateServiceSchedule(vehicleId, serviceType, scheduleData);
    } catch (error) {
      console.error('Error updating service schedule:', error);
      return null;
    }
  }

  /**
   * Helper: Check and generate recommendations for a vehicle
   */
  private async checkAndGenerateRecommendations(vehicleId: string): Promise<void> {
    const recommendations = await this.generateServiceRecommendations(vehicleId);
    
    // Send notifications for high priority recommendations
    const highPriorityRecs = recommendations.filter(r => r.priority === 'high' || r.priority === 'critical');
    if (highPriorityRecs.length > 0) {
      await this.sendServiceReminders(vehicleId);
    }
  }

  /**
   * Helper: Get service type from job description
   */
  private getServiceTypeFromJob(job: Job): string | null {
    const description = (job.description || '').toLowerCase();
    const serviceType = (job.serviceType || '').toLowerCase();
    
    // Check explicit service type first
    if (serviceType && Object.keys(DEFAULT_SERVICE_INTERVALS).includes(serviceType)) {
      return serviceType;
    }
    
    // Try to infer from description
    for (const type of Object.keys(DEFAULT_SERVICE_INTERVALS)) {
      const typeWords = type.replace(/_/g, ' ');
      if (description.includes(typeWords)) {
        return type;
      }
    }
    
    // Check for common keywords
    if (description.includes('oil')) return 'oil_change';
    if (description.includes('tire')) return 'tire_rotation';
    if (description.includes('brake')) return 'brake_service';
    if (description.includes('transmission')) return 'transmission_service';
    if (description.includes('battery')) return 'battery_replacement';
    if (description.includes('inspection') || description.includes('check')) return 'inspection';
    
    return 'major_repair'; // Default for unspecified services
  }

  /**
   * Helper: Calculate warranty expiration date
   */
  private calculateWarrantyExpiration(job: Job): Date | null {
    if (!job.warrantyInfo) return null;
    
    const warrantyInfo = typeof job.warrantyInfo === 'string' 
      ? JSON.parse(job.warrantyInfo) 
      : job.warrantyInfo;
    
    if (warrantyInfo.expirationDate) {
      return new Date(warrantyInfo.expirationDate);
    }
    
    if (warrantyInfo.duration && job.completedAt) {
      const completedDate = new Date(job.completedAt);
      const durationMonths = parseInt(warrantyInfo.duration);
      if (!isNaN(durationMonths)) {
        completedDate.setMonth(completedDate.getMonth() + durationMonths);
        return completedDate;
      }
    }
    
    return null;
  }

  /**
   * Helper: Calculate vehicle age in months
   */
  private getVehicleAgeInMonths(year: number): number {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    return (currentYear - year) * 12 + currentMonth;
  }

  /**
   * Helper: Check if service is due soon
   */
  private isServiceDueSoon(nextDueDate: Date | null, nextDueMileage: number | null, currentMileage: number): boolean {
    if (!nextDueDate && !nextDueMileage) return false;
    
    // Check date (within 30 days)
    if (nextDueDate) {
      const daysUntilDue = Math.floor((nextDueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysUntilDue <= 30) return true;
    }
    
    // Check mileage (within 500 miles)
    if (nextDueMileage && currentMileage) {
      const milesUntilDue = nextDueMileage - currentMileage;
      if (milesUntilDue <= 500) return true;
    }
    
    return false;
  }

  /**
   * Helper: Check if date is due soon
   */
  private isDueSoon(date: Date | null): boolean {
    if (!date) return false;
    const daysUntilDue = Math.floor((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysUntilDue <= 30 && daysUntilDue >= 0;
  }

  /**
   * Helper: Calculate service priority
   */
  private calculatePriority(isOverdue: boolean, overdueBy: number | null, serviceType: string): 'low' | 'medium' | 'high' | 'critical' {
    // Critical services
    const criticalServices = ['brake_service', 'transmission_service', 'inspection'];
    
    if (isOverdue) {
      if (criticalServices.includes(serviceType)) return 'critical';
      if (overdueBy && overdueBy > 90) return 'high'; // 90 days or 90 miles
      return 'medium';
    }
    
    if (criticalServices.includes(serviceType)) return 'medium';
    return 'low';
  }

  /**
   * Helper: Estimate service cost
   */
  private estimateServiceCost(serviceType: string, vehicleType?: string): number {
    const baseCosts: Record<string, number> = {
      oil_change: 75,
      tire_rotation: 50,
      brake_service: 350,
      transmission_service: 450,
      coolant_flush: 150,
      air_filter: 45,
      fuel_filter: 85,
      inspection: 100,
      battery_replacement: 250,
      alignment: 125,
      differential_service: 175,
      power_steering_flush: 125,
      spark_plug_replacement: 250,
      belt_replacement: 350,
      wiper_replacement: 35,
      major_repair: 500,
      other: 200
    };
    
    let cost = baseCosts[serviceType] || 200;
    
    // Adjust for vehicle type
    if (vehicleType === 'Semi Truck' || vehicleType === 'Heavy Duty') {
      cost *= 2.5;
    } else if (vehicleType === 'Box Truck' || vehicleType === 'Commercial') {
      cost *= 1.5;
    }
    
    return Math.round(cost);
  }

  /**
   * Helper: Generate recommendation reason
   */
  private generateRecommendationReason(serviceType: string, isOverdue: boolean, overdueBy: number | null): string {
    const serviceLabel = serviceType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    if (isOverdue) {
      if (overdueBy) {
        return `${serviceLabel} is overdue by ${overdueBy} ${overdueBy > 1000 ? 'miles' : 'days'}. Immediate service recommended to prevent potential issues.`;
      }
      return `${serviceLabel} is overdue. Schedule service as soon as possible.`;
    }
    
    return `${serviceLabel} is due soon based on manufacturer recommendations. Schedule service to maintain vehicle reliability.`;
  }

  /**
   * Helper: Build service reminder message
   */
  private buildServiceReminderMessage(
    vehicle: FleetVehicle,
    overdueServices: any[],
    dueSoonServices: any[]
  ): string {
    let message = `Service reminder for ${vehicle.year} ${vehicle.make} ${vehicle.model} (${vehicle.licensePlate})\n\n`;
    
    if (overdueServices.length > 0) {
      message += `⚠️ OVERDUE SERVICES:\n`;
      overdueServices.forEach(s => {
        message += `• ${s.serviceType.replace(/_/g, ' ')}: ${s.overdueBy} ${s.overdueBy > 1000 ? 'miles' : 'days'} overdue\n`;
      });
      message += '\n';
    }
    
    if (dueSoonServices.length > 0) {
      message += `📅 UPCOMING SERVICES:\n`;
      dueSoonServices.forEach(s => {
        const dueDate = s.nextDueDate ? new Date(s.nextDueDate).toLocaleDateString() : 'N/A';
        message += `• ${s.serviceType.replace(/_/g, ' ')}: Due ${dueDate}`;
        if (s.nextDueMileage) {
          message += ` or ${s.nextDueMileage} miles`;
        }
        message += '\n';
      });
    }
    
    return message;
  }

  /**
   * Helper: Calculate maintenance statistics
   */
  private calculateMaintenanceStats(serviceHistory: ServiceHistory[]) {
    const totalCost = serviceHistory.reduce((sum, s) => sum + parseFloat(s.totalCost || '0'), 0);
    const totalServices = serviceHistory.length;
    const avgCostPerService = totalServices > 0 ? totalCost / totalServices : 0;
    
    // Group by service type
    const serviceTypeCounts: Record<string, number> = {};
    const serviceTypeCosts: Record<string, number> = {};
    
    serviceHistory.forEach(s => {
      serviceTypeCounts[s.serviceType] = (serviceTypeCounts[s.serviceType] || 0) + 1;
      serviceTypeCosts[s.serviceType] = (serviceTypeCosts[s.serviceType] || 0) + parseFloat(s.totalCost || '0');
    });
    
    // Find most frequent service
    const mostFrequentService = Object.entries(serviceTypeCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'none';
    
    // Find most expensive service type
    const mostExpensiveServiceType = Object.entries(serviceTypeCosts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'none';
    
    return {
      totalServices,
      totalCost,
      avgCostPerService,
      serviceTypeCounts,
      serviceTypeCosts,
      mostFrequentService,
      mostExpensiveServiceType
    };
  }
}

export const serviceHistoryService = new ServiceHistoryService();