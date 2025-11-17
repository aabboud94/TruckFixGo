import { emailService } from './services/email-service';
import { storage } from './storage';

/**
 * Job Reminder Scheduler
 * Monitors job assignments and sends 3-minute reminder emails to contractors
 * who haven't accepted their assigned jobs yet
 */
class JobReminderScheduler {
  private checkInterval: NodeJS.Timeout | null = null;
  private readonly CHECK_FREQUENCY = 30000; // Check every 30 seconds
  private readonly REMINDER_DELAY = 3 * 60 * 1000; // 3 minutes in milliseconds
  private readonly MAX_REMINDER_AGE = 15 * 60 * 1000; // Don't send reminders for jobs older than 15 minutes
  
  // Track sent reminders to avoid duplicates
  private sentReminders = new Map<string, Date>();
  
  constructor() {
    console.log('[JobReminderScheduler] Initializing 3-minute job reminder system');
  }
  
  // Start the reminder scheduler
  public start() {
    if (this.checkInterval) {
      console.log('[JobReminderScheduler] Already running');
      return;
    }
    
    console.log('[JobReminderScheduler] Starting reminder scheduler (checking every 30 seconds)');
    
    // Initial check
    this.checkPendingJobs();
    
    // Set up recurring checks
    this.checkInterval = setInterval(() => {
      this.checkPendingJobs();
    }, this.CHECK_FREQUENCY);
  }
  
  // Stop the reminder scheduler
  public stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('[JobReminderScheduler] Stopped');
    }
  }
  
  // Check for jobs that need reminder emails
  private async checkPendingJobs() {
    try {
      // Get all assigned jobs that aren't accepted yet
      const pendingJobs = await storage.findJobs({
        status: 'assigned',
        orderBy: 'assignedAt',
        orderDir: 'asc'
      });
      
      if (!pendingJobs || pendingJobs.length === 0) {
        return;
      }
      
      const now = new Date();
      
      for (const job of pendingJobs) {
        // Skip if no contractor assigned or no assignment time
        if (!job.contractorId || !job.assignedAt) {
          continue;
        }
        
        const assignedAt = new Date(job.assignedAt);
        const timeSinceAssignment = now.getTime() - assignedAt.getTime();
        
        // Skip if too new (< 3 minutes) or too old (> 15 minutes)
        if (timeSinceAssignment < this.REMINDER_DELAY || timeSinceAssignment > this.MAX_REMINDER_AGE) {
          continue;
        }
        
        // Check if we already sent a reminder for this job
        const reminderKey = `${job.id}-${job.contractorId}`;
        const lastReminder = this.sentReminders.get(reminderKey);
        
        if (lastReminder) {
          // Don't send another reminder within 10 minutes
          const timeSinceLastReminder = now.getTime() - lastReminder.getTime();
          if (timeSinceLastReminder < 10 * 60 * 1000) {
            continue;
          }
        }
        
        // Send reminder email
        await this.sendReminderEmail(job);
        
        // Mark reminder as sent
        this.sentReminders.set(reminderKey, now);
        
        // Clean up old reminder records (older than 1 hour)
        this.cleanupOldReminders();
      }
    } catch (error) {
      console.error('[JobReminderScheduler] Error checking pending jobs:', error);
    }
  }
  
  // Send reminder email to contractor
  private async sendReminderEmail(job: any) {
    try {
      // Get contractor details
      const contractor = await storage.getUser(job.contractorId);
      if (!contractor || !contractor.email) {
        console.log(`[JobReminderScheduler] No email for contractor ${job.contractorId}`);
        return;
      }
      
      // Get service type details
      let serviceTypeName = 'Service';
      let estimatedDuration = 60; // Default estimated duration
      if (job.serviceTypeId) {
        const serviceType = await storage.getServiceType(job.serviceTypeId);
        if (serviceType) {
          serviceTypeName = serviceType.name;
          // Use base price as a rough estimate for duration (30 min per $100)
          if (serviceType.basePrice) {
            estimatedDuration = Math.max(30, Math.round(Number(serviceType.basePrice) / 100 * 30));
          }
        }
      }
      
      // Map urgency level to urgency string
      const urgencyMapping: { [key: number]: string } = {
        1: 'low',
        2: 'normal',
        3: 'medium',
        4: 'high',
        5: 'urgent'
      };
      const urgency = urgencyMapping[job.urgencyLevel] || 'normal';
      
      // Get customer name with proper fallback
      let customerName = 'Customer';
      if (job.customerName) {
        customerName = job.customerName;
      } else if (job.customerId) {
        const customer = await storage.getUser(job.customerId);
        if (customer) {
          customerName = `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || customer.email || 'Customer';
        }
      } else if (job.fleetAccountId) {
        const fleet = await storage.getFleetAccount(job.fleetAccountId);
        if (fleet) {
          customerName = fleet.companyName || 'Fleet Customer';
        }
      }
      
      // Build vehicle info string if available
      let vehicleInfo = '';
      if (job.vehicleMake || job.vehicleModel || job.vehicleYear) {
        const parts = [];
        if (job.vehicleYear) parts.push(job.vehicleYear);
        if (job.vehicleMake) parts.push(job.vehicleMake);
        if (job.vehicleModel) parts.push(job.vehicleModel);
        vehicleInfo = parts.join(' ');
      }
      if (job.unitNumber) {
        vehicleInfo = vehicleInfo ? `${vehicleInfo} (Unit: ${job.unitNumber})` : `Unit: ${job.unitNumber}`;
      }
      
      // Build comprehensive description
      let fullDescription = job.description || 'No additional details provided';
      if (vehicleInfo) {
        fullDescription = `Vehicle: ${vehicleInfo}\n${fullDescription}`;
      }
      if (job.locationNotes) {
        fullDescription = `${fullDescription}\nLocation Notes: ${job.locationNotes}`;
      }
      
      // Prepare job data for email with all required fields
      const jobData = {
        id: job.id,
        customerName: customerName,
        location: job.locationAddress || 'Location provided in app',
        serviceType: serviceTypeName,
        urgency: urgency,
        estimatedDuration: estimatedDuration,
        description: fullDescription
      };
      
      // Enhanced logging to verify data
      console.log(`[JobReminderScheduler] Preparing reminder for job ${job.jobNumber}:`);
      console.log(`[JobReminderScheduler] - Contractor: ${contractor.firstName} ${contractor.lastName} (${contractor.email})`);
      console.log(`[JobReminderScheduler] - Customer: ${jobData.customerName}`);
      console.log(`[JobReminderScheduler] - Service: ${jobData.serviceType}`);
      console.log(`[JobReminderScheduler] - Location: ${jobData.location}`);
      console.log(`[JobReminderScheduler] - Urgency: ${jobData.urgency} (level ${job.urgencyLevel})`);
      console.log(`[JobReminderScheduler] - Est. Duration: ${jobData.estimatedDuration} minutes`);
      console.log(`[JobReminderScheduler] - Description length: ${jobData.description.length} chars`);
      
      // Send reminder email using the mobile-optimized template
      const success = await emailService.sendJobAssignmentEmail(
        contractor.email,
        `${contractor.firstName} ${contractor.lastName}`,
        jobData,
        true // isReminder = true
      );
      
      if (success) {
        console.log(`[JobReminderScheduler] ✅ Reminder sent successfully for job ${job.jobNumber} to ${contractor.email}`);
        
        // Track reminder sent in job status history
        try {
          await storage.addJobStatusHistory({
            jobId: job.id,
            status: job.status,
            changedBy: 'system',
            notes: `3-minute reminder email sent to contractor ${contractor.email}`,
            metadata: {
              reminderType: '3_minute',
              contractorId: job.contractorId,
              sentAt: new Date().toISOString()
            }
          });
        } catch (historyError) {
          console.error(`[JobReminderScheduler] Error adding status history:`, historyError);
        }
      } else {
        console.error(`[JobReminderScheduler] ❌ Failed to send reminder for job ${job.jobNumber} to ${contractor.email}`);
      }
      
    } catch (error) {
      console.error(`[JobReminderScheduler] Error sending reminder for job ${job.id}:`, error);
      console.error(`[JobReminderScheduler] Error details:`, error);
    }
  }
  
  // Clean up old reminder records to prevent memory bloat
  private cleanupOldReminders() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    // Use Array.from to properly iterate over Map entries
    for (const [key, date] of Array.from(this.sentReminders.entries())) {
      if (date < oneHourAgo) {
        this.sentReminders.delete(key);
      }
    }
  }
  
  // Get scheduler status
  public getStatus() {
    return {
      running: this.checkInterval !== null,
      remindersTracked: this.sentReminders.size,
      checkFrequency: `${this.CHECK_FREQUENCY / 1000} seconds`,
      reminderDelay: `${this.REMINDER_DELAY / 60000} minutes`
    };
  }
}

// Export singleton instance
export const jobReminderScheduler = new JobReminderScheduler();