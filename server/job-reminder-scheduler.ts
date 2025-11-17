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
      if (job.serviceTypeId) {
        const serviceType = await storage.getServiceType(job.serviceTypeId);
        if (serviceType) {
          serviceTypeName = serviceType.name;
        }
      }
      
      // Prepare job data for email
      const jobData = {
        id: job.id,
        customerName: job.customerName || job.fleetAccountId || 'Customer',
        location: job.locationAddress || 'Location provided in app',
        serviceType: serviceTypeName,
        urgency: job.urgency || 'normal',
        estimatedDuration: job.estimatedDuration || 60,
        description: job.description || 'Please check the app for full details'
      };
      
      console.log(`[JobReminderScheduler] Sending 3-minute reminder for job ${job.jobNumber} to ${contractor.email}`);
      
      // Send reminder email using the new mobile-optimized template
      const success = await emailService.sendJobAssignmentEmail(
        contractor.email,
        `${contractor.firstName} ${contractor.lastName}`,
        jobData,
        true // isReminder = true
      );
      
      if (success) {
        console.log(`[JobReminderScheduler] Reminder sent successfully for job ${job.jobNumber}`);
        
        // Note: addJobEvent method doesn't exist on storage
        // Commenting out for now - would need to be implemented if job event tracking is needed
        // await storage.addJobEvent(job.id, 'reminder_sent', {
        //   contractorId: job.contractorId,
        //   reminderType: '3_minute',
        //   timestamp: new Date().toISOString()
        // });
      } else {
        console.error(`[JobReminderScheduler] Failed to send reminder for job ${job.jobNumber}`);
      }
      
    } catch (error) {
      console.error(`[JobReminderScheduler] Error sending reminder for job ${job.id}:`, error);
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