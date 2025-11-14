import { storage } from "../storage";
import { emailService } from "./email-service";
import { pushNotificationService } from "./push-notification-service";
import { 
  type VacationRequest, 
  type Job, 
  type ContractorAvailability,
  type AvailabilityOverride,
  type ContractorCoverage,
  type User,
  type InsertVacationRequest
} from "@shared/schema";

interface VacationBalance {
  contractorId: string;
  totalDaysAllowed: number;
  daysUsed: number;
  daysAvailable: number;
  pendingRequests: number;
  yearStart: Date;
  yearEnd: Date;
}

interface AvailabilityReport {
  contractorId: string;
  contractorName: string;
  period: { start: Date; end: Date };
  totalDays: number;
  availableDays: number;
  unavailableDays: number;
  vacationDays: number;
  scheduledJobs: number;
  completedJobs: number;
  averageJobsPerDay: number;
  availability: number; // percentage
}

class AvailabilityService {
  // Default vacation days per year (can be customized per contractor)
  private readonly DEFAULT_VACATION_DAYS = 14;
  
  /**
   * Check for conflicts when requesting time off
   */
  async checkConflicts(contractorId: string, startDate: Date, endDate: Date): Promise<{
    hasConflicts: boolean;
    scheduledJobs: Job[];
    existingRequests: VacationRequest[];
    criticalPeriods: Date[];
  }> {
    // Check for scheduled jobs
    const scheduledJobs = await storage.checkAvailabilityConflicts(contractorId, startDate, endDate);
    
    // Check for existing vacation requests
    const existingRequests = await storage.getTimeOffRequests(contractorId);
    const overlappingRequests = existingRequests.filter(req => {
      return req.status !== 'rejected' && 
        req.startDate <= endDate && 
        req.endDate >= startDate;
    });
    
    // Check for critical periods (e.g., holidays, peak seasons)
    const criticalPeriods = await this.getCriticalPeriods(startDate, endDate);
    
    return {
      hasConflicts: scheduledJobs.length > 0 || overlappingRequests.length > 0 || criticalPeriods.length > 0,
      scheduledJobs,
      existingRequests: overlappingRequests,
      criticalPeriods
    };
  }
  
  /**
   * Auto-suggest coverage contractors based on availability and skills
   */
  async suggestCoverage(requestingContractorId: string, startDate: Date, endDate: Date): Promise<any[]> {
    return await storage.suggestCoverageContractors(requestingContractorId, startDate, endDate);
  }
  
  /**
   * Calculate vacation balance and accruals
   */
  async calculateVacationBalance(contractorId: string): Promise<VacationBalance> {
    const currentYear = new Date().getFullYear();
    const yearStart = new Date(currentYear, 0, 1);
    const yearEnd = new Date(currentYear, 11, 31);
    
    // Get contractor profile to check custom vacation allowance
    const profile = await storage.getContractorProfile(contractorId);
    const totalDaysAllowed = profile?.vacationDaysPerYear || this.DEFAULT_VACATION_DAYS;
    
    // Calculate days used (approved requests in current year)
    const approvedRequests = await storage.getTimeOffRequests(contractorId, 'approved');
    let daysUsed = 0;
    
    for (const request of approvedRequests) {
      const requestStart = new Date(request.startDate);
      const requestEnd = new Date(request.endDate);
      
      // Only count days within the current year
      const effectiveStart = requestStart < yearStart ? yearStart : requestStart;
      const effectiveEnd = requestEnd > yearEnd ? yearEnd : requestEnd;
      
      if (effectiveStart <= effectiveEnd) {
        daysUsed += this.calculateBusinessDays(effectiveStart, effectiveEnd);
      }
    }
    
    // Count pending requests
    const pendingRequests = await storage.getTimeOffRequests(contractorId, 'pending');
    let pendingDays = 0;
    
    for (const request of pendingRequests) {
      pendingDays += this.calculateBusinessDays(
        new Date(request.startDate), 
        new Date(request.endDate)
      );
    }
    
    return {
      contractorId,
      totalDaysAllowed,
      daysUsed,
      daysAvailable: totalDaysAllowed - daysUsed,
      pendingRequests: pendingDays,
      yearStart,
      yearEnd
    };
  }
  
  /**
   * Send notification when time off is approved
   */
  async notifyApproval(request: VacationRequest): Promise<void> {
    const contractor = await storage.getUser(request.contractorId);
    const admin = request.approvedBy ? await storage.getUser(request.approvedBy) : null;
    
    if (!contractor?.email) return;
    
    await emailService.sendTimeOffApprovalNotification({
      to: contractor.email,
      contractorName: `${contractor.firstName} ${contractor.lastName}`,
      startDate: new Date(request.startDate),
      endDate: new Date(request.endDate),
      requestType: request.requestType,
      approvedBy: admin ? `${admin.firstName} ${admin.lastName}` : 'Admin',
      notes: request.notes
    });
    
    // Send push notification
    await pushNotificationService.sendToUser(request.contractorId, {
      title: 'Time Off Approved',
      body: `Your ${request.requestType} request from ${new Date(request.startDate).toLocaleDateString()} to ${new Date(request.endDate).toLocaleDateString()} has been approved.`,
      data: { type: 'time_off_approved', requestId: request.id }
    });
  }
  
  /**
   * Send notification when time off is rejected
   */
  async notifyRejection(request: VacationRequest): Promise<void> {
    const contractor = await storage.getUser(request.contractorId);
    const admin = request.approvedBy ? await storage.getUser(request.approvedBy) : null;
    
    if (!contractor?.email) return;
    
    await emailService.sendTimeOffRejectionNotification({
      to: contractor.email,
      contractorName: `${contractor.firstName} ${contractor.lastName}`,
      startDate: new Date(request.startDate),
      endDate: new Date(request.endDate),
      requestType: request.requestType,
      rejectedBy: admin ? `${admin.firstName} ${admin.lastName}` : 'Admin',
      reason: request.notes || 'No reason provided'
    });
    
    // Send push notification
    await pushNotificationService.sendToUser(request.contractorId, {
      title: 'Time Off Rejected',
      body: `Your ${request.requestType} request from ${new Date(request.startDate).toLocaleDateString()} to ${new Date(request.endDate).toLocaleDateString()} has been rejected.`,
      data: { type: 'time_off_rejected', requestId: request.id }
    });
  }
  
  /**
   * Generate availability report for fleet managers
   */
  async generateAvailabilityReport(
    contractorIds: string[], 
    startDate: Date, 
    endDate: Date
  ): Promise<AvailabilityReport[]> {
    const reports: AvailabilityReport[] = [];
    
    for (const contractorId of contractorIds) {
      const user = await storage.getUser(contractorId);
      const contractorName = user ? `${user.firstName} ${user.lastName}` : 'Unknown';
      
      // Get all data for the period
      const vacationRequests = await storage.getTimeOffRequests(contractorId, 'approved');
      const overrides = await storage.getAvailabilityOverrides(contractorId, startDate, endDate);
      const jobs = await storage.findJobs({
        contractorId,
        fromDate: startDate,
        toDate: endDate
      });
      
      // Calculate metrics
      const totalDays = this.calculateBusinessDays(startDate, endDate);
      let unavailableDays = 0;
      let vacationDays = 0;
      
      // Count vacation days
      for (const request of vacationRequests) {
        const requestStart = new Date(request.startDate);
        const requestEnd = new Date(request.endDate);
        
        if (requestStart <= endDate && requestEnd >= startDate) {
          const effectiveStart = requestStart < startDate ? startDate : requestStart;
          const effectiveEnd = requestEnd > endDate ? endDate : requestEnd;
          vacationDays += this.calculateBusinessDays(effectiveStart, effectiveEnd);
        }
      }
      
      // Count unavailable days from overrides
      for (const override of overrides) {
        if (!override.isAvailable) {
          unavailableDays++;
        }
      }
      
      const availableDays = totalDays - vacationDays - unavailableDays;
      const completedJobs = jobs.filter(j => j.status === 'completed').length;
      const scheduledJobs = jobs.filter(j => j.status === 'assigned' || j.status === 'new').length;
      
      reports.push({
        contractorId,
        contractorName,
        period: { start: startDate, end: endDate },
        totalDays,
        availableDays,
        unavailableDays,
        vacationDays,
        scheduledJobs,
        completedJobs,
        averageJobsPerDay: totalDays > 0 ? completedJobs / totalDays : 0,
        availability: totalDays > 0 ? (availableDays / totalDays) * 100 : 0
      });
    }
    
    return reports;
  }
  
  /**
   * Handle recurring availability patterns
   */
  async setRecurringAvailability(
    contractorId: string,
    pattern: {
      dayOfWeek?: number; // 0-6 (Sunday-Saturday)
      weekOfMonth?: number; // 1-5
      dayOfMonth?: number; // 1-31
      isAvailable: boolean;
      startTime?: string;
      endTime?: string;
      reason?: string;
    },
    startDate: Date,
    endDate: Date
  ): Promise<AvailabilityOverride[]> {
    const overrides: any[] = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      let shouldApplyPattern = false;
      
      // Check if current date matches the pattern
      if (pattern.dayOfWeek !== undefined) {
        shouldApplyPattern = currentDate.getDay() === pattern.dayOfWeek;
      } else if (pattern.dayOfMonth !== undefined) {
        shouldApplyPattern = currentDate.getDate() === pattern.dayOfMonth;
      } else if (pattern.weekOfMonth !== undefined) {
        const weekOfMonth = Math.ceil(currentDate.getDate() / 7);
        shouldApplyPattern = weekOfMonth === pattern.weekOfMonth;
      }
      
      if (shouldApplyPattern) {
        overrides.push({
          date: new Date(currentDate),
          isAvailable: pattern.isAvailable,
          startTime: pattern.startTime,
          endTime: pattern.endTime,
          reason: pattern.reason || 'Recurring availability pattern'
        });
      }
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Bulk update availability
    return await storage.bulkUpdateAvailability(contractorId, overrides);
  }
  
  /**
   * Check if contractor is available on a specific date/time
   */
  async isContractorAvailable(
    contractorId: string,
    date: Date,
    startTime?: string,
    endTime?: string
  ): Promise<boolean> {
    // Check vacation requests
    const vacationRequests = await storage.getTimeOffRequests(contractorId, 'approved');
    for (const request of vacationRequests) {
      if (date >= new Date(request.startDate) && date <= new Date(request.endDate)) {
        return false;
      }
    }
    
    // Check availability overrides
    const overrides = await storage.getAvailabilityOverrides(contractorId, date, date);
    for (const override of overrides) {
      if (!override.isAvailable) {
        // If override covers the entire day
        if (!override.startTime || !override.endTime) {
          return false;
        }
        
        // Check if time ranges overlap
        if (startTime && endTime && override.startTime && override.endTime) {
          if (this.timeRangesOverlap(startTime, endTime, override.startTime, override.endTime)) {
            return false;
          }
        }
      }
    }
    
    // Check regular availability
    const dayOfWeek = date.getDay();
    const regularAvailability = await storage.getContractorAvailability(contractorId);
    const dayAvailability = regularAvailability.find(a => a.dayOfWeek === dayOfWeek);
    
    if (!dayAvailability) {
      return false; // Not available on this day of week
    }
    
    // Check if requested time is within regular hours
    if (startTime && endTime) {
      return this.isTimeWithinRange(startTime, endTime, dayAvailability.startTime, dayAvailability.endTime);
    }
    
    return true;
  }
  
  /**
   * Get critical periods (holidays, peak seasons, etc.)
   */
  private async getCriticalPeriods(startDate: Date, endDate: Date): Promise<Date[]> {
    const criticalDates: Date[] = [];
    const year = startDate.getFullYear();
    
    // Major holidays (US)
    const holidays = [
      new Date(year, 0, 1), // New Year's Day
      new Date(year, 6, 4), // Independence Day
      new Date(year, 11, 25), // Christmas
      // Add Thanksgiving (4th Thursday of November)
      this.getNthWeekdayOfMonth(year, 10, 4, 4), // November, 4th Thursday
    ];
    
    // Filter holidays within the date range
    return holidays.filter(holiday => 
      holiday >= startDate && holiday <= endDate
    );
  }
  
  /**
   * Calculate business days between two dates
   */
  private calculateBusinessDays(startDate: Date, endDate: Date): number {
    let count = 0;
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Skip weekends
        count++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return count;
  }
  
  /**
   * Check if two time ranges overlap
   */
  private timeRangesOverlap(
    start1: string, end1: string, 
    start2: string, end2: string
  ): boolean {
    const s1 = this.timeToMinutes(start1);
    const e1 = this.timeToMinutes(end1);
    const s2 = this.timeToMinutes(start2);
    const e2 = this.timeToMinutes(end2);
    
    return s1 < e2 && s2 < e1;
  }
  
  /**
   * Check if a time range is within another time range
   */
  private isTimeWithinRange(
    startTime: string, endTime: string,
    rangeStart: string, rangeEnd: string
  ): boolean {
    const start = this.timeToMinutes(startTime);
    const end = this.timeToMinutes(endTime);
    const rStart = this.timeToMinutes(rangeStart);
    const rEnd = this.timeToMinutes(rangeEnd);
    
    return start >= rStart && end <= rEnd;
  }
  
  /**
   * Convert time string (HH:MM) to minutes since midnight
   */
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }
  
  /**
   * Get the Nth weekday of a month
   */
  private getNthWeekdayOfMonth(year: number, month: number, n: number, weekday: number): Date {
    const firstDay = new Date(year, month, 1);
    let dayOfWeek = firstDay.getDay();
    let date = 1;
    
    // Find the first occurrence of the weekday
    while (dayOfWeek !== weekday) {
      date++;
      dayOfWeek = (dayOfWeek + 1) % 7;
    }
    
    // Move to the nth occurrence
    date += (n - 1) * 7;
    
    return new Date(year, month, date);
  }
}

export const availabilityService = new AvailabilityService();