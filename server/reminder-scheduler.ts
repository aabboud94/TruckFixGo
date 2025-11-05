import * as cron from 'node-cron';
import { reminderService } from './reminder-service';
import { storage } from './storage';
import { type Job } from '@shared/schema';

class ReminderScheduler {
  private cronJobs: Map<string, cron.ScheduledTask> = new Map();
  
  constructor() {
    this.initializeScheduler();
  }

  // Initialize the reminder scheduler
  private initializeScheduler() {
    // Main reminder processing job - runs every minute
    this.scheduleJob('reminder-processor', '* * * * *', async () => {
      await this.processReminders();
    });

    // Check for upcoming scheduled services - runs every 15 minutes
    this.scheduleJob('upcoming-services-checker', '*/15 * * * *', async () => {
      await this.checkUpcomingServices();
    });

    // Retry failed reminders - runs every 30 minutes
    this.scheduleJob('reminder-retry', '*/30 * * * *', async () => {
      await this.retryFailedReminders();
    });

    // Clean up old reminder logs - runs daily at 3 AM
    this.scheduleJob('reminder-cleanup', '0 3 * * *', async () => {
      await this.cleanupOldLogs();
    });

    // Generate reminder metrics - runs daily at 2 AM
    this.scheduleJob('reminder-metrics', '0 2 * * *', async () => {
      await this.generateDailyMetrics();
    });

    console.log('Reminder scheduler initialized with all cron jobs');
  }

  // Schedule a cron job
  private scheduleJob(name: string, cronExpression: string, task: () => Promise<void>) {
    if (this.cronJobs.has(name)) {
      this.cronJobs.get(name)?.stop();
    }

    const job = cron.schedule(cronExpression, async () => {
      try {
        console.log(`Running scheduled job: ${name}`);
        await task();
      } catch (error) {
        console.error(`Error in scheduled job ${name}:`, error);
      }
    });

    this.cronJobs.set(name, job);
    job.start();
    console.log(`Scheduled job '${name}' with expression: ${cronExpression}`);
  }

  // Process pending reminders
  private async processReminders() {
    try {
      const pendingReminders = await storage.getPendingReminders(50);
      
      for (const reminder of pendingReminders) {
        try {
          // Mark as queued to prevent duplicate processing
          await storage.updateReminderStatus(reminder.id, 'queued');
          
          // Process the reminder asynchronously
          setImmediate(async () => {
            try {
              await reminderService.sendReminder(reminder);
            } catch (error) {
              console.error(`Failed to send reminder ${reminder.id}:`, error);
              await storage.updateReminderStatus(
                reminder.id, 
                'failed', 
                (error as Error).message
              );
            }
          });
        } catch (error) {
          console.error(`Failed to queue reminder ${reminder.id}:`, error);
        }
      }
      
      if (pendingReminders.length > 0) {
        console.log(`Processed ${pendingReminders.length} pending reminders`);
      }
    } catch (error) {
      console.error('Error processing reminders:', error);
    }
  }

  // Check for upcoming scheduled services and create reminders
  private async checkUpcomingServices() {
    try {
      const now = new Date();
      const twentyFourHoursLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const twelveHoursLater = new Date(now.getTime() + 12 * 60 * 60 * 1000);
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

      // Get scheduled jobs that need reminders
      const upcomingJobs = await storage.getJobsScheduledBetween(now, twentyFourHoursLater);

      for (const job of upcomingJobs) {
        const scheduledTime = new Date(job.scheduledAt!);
        const timeDiff = scheduledTime.getTime() - now.getTime();
        const hoursUntilService = timeDiff / (60 * 60 * 1000);

        // Check if we need to create reminders
        const existingReminders = await storage.getUpcomingReminders(job.id);
        
        // 24-hour reminder
        if (hoursUntilService <= 24 && hoursUntilService > 23) {
          const has24HrReminder = existingReminders.some(
            r => r.reminderTiming === '24hr_before'
          );
          
          if (!has24HrReminder) {
            await this.createServiceReminder(job, '24hr_before');
          }
        }

        // 12-hour reminder
        if (hoursUntilService <= 12 && hoursUntilService > 11) {
          const has12HrReminder = existingReminders.some(
            r => r.reminderTiming === '12hr_before'
          );
          
          if (!has12HrReminder) {
            await this.createServiceReminder(job, '12hr_before');
          }
        }

        // 1-hour reminder
        if (hoursUntilService <= 1 && hoursUntilService > 0.5) {
          const has1HrReminder = existingReminders.some(
            r => r.reminderTiming === '1hr_before'
          );
          
          if (!has1HrReminder) {
            await this.createServiceReminder(job, '1hr_before');
          }
        }
      }

      if (upcomingJobs.length > 0) {
        console.log(`Checked ${upcomingJobs.length} upcoming services for reminders`);
      }
    } catch (error) {
      console.error('Error checking upcoming services:', error);
    }
  }

  // Create a service reminder
  private async createServiceReminder(job: Job, timing: '24hr_before' | '12hr_before' | '1hr_before') {
    try {
      const customer = await storage.getUser(job.customerId!);
      if (!customer) return;

      const preferences = await storage.getCustomerPreferences(customer.id);
      if (!preferences || !preferences.reminderOptIn) return;

      // Determine reminder type based on preferences
      let reminderType: 'email' | 'sms' | 'both' = 'both';
      if (preferences.communicationChannel === 'email') reminderType = 'email';
      if (preferences.communicationChannel === 'sms') reminderType = 'sms';
      if (preferences.communicationChannel === 'none') return;

      // Get the appropriate template
      const templateCode = `reminder_${timing.replace('_before', '')}`;
      const emailTemplate = await storage.getEmailTemplate(templateCode);
      const smsTemplate = await storage.getSmsTemplate(templateCode);

      if (!emailTemplate && !smsTemplate) {
        console.warn(`No templates found for ${templateCode}`);
        return;
      }

      // Prepare message content
      const serviceType = await storage.getServiceType(job.serviceTypeId);
      const messageData = await this.prepareMessageContent(
        job,
        customer,
        serviceType?.name || 'Service',
        emailTemplate,
        smsTemplate
      );

      // Create the reminder
      await storage.createReminder({
        jobId: job.id,
        recipientId: customer.id,
        reminderType,
        reminderTiming: timing,
        scheduledSendTime: new Date(), // Send immediately
        recipientEmail: customer.email || undefined,
        recipientPhone: customer.phone || undefined,
        messageSubject: messageData.subject,
        messageContent: messageData.smsContent,
        messageHtml: messageData.htmlContent,
        templateCode,
        maxRetries: 3,
        metadata: {
          jobNumber: job.jobNumber,
          serviceType: serviceType?.name
        }
      });

      console.log(`Created ${timing} reminder for job ${job.jobNumber}`);
    } catch (error) {
      console.error(`Error creating service reminder for job ${job.id}:`, error);
    }
  }

  // Prepare message content from templates
  private async prepareMessageContent(
    job: Job,
    customer: any,
    serviceType: string,
    emailTemplate: any,
    smsTemplate: any
  ) {
    const scheduledDate = job.scheduledAt 
      ? new Date(job.scheduledAt).toLocaleDateString() 
      : 'TBD';
    const scheduledTime = job.scheduledAt 
      ? new Date(job.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : 'TBD';

    const variables: Record<string, string> = {
      CUSTOMER_NAME: `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Valued Customer',
      JOB_NUMBER: job.jobNumber,
      SERVICE_TYPE: serviceType,
      DATE: scheduledDate,
      TIME: scheduledTime,
      LOCATION: job.locationAddress || 'TBD',
      UNIT_NUMBER: job.unitNumber || job.vin || 'N/A',
      UNSUBSCRIBE_LINK: `${process.env.APP_URL || 'https://truckfixgo.com'}/unsubscribe/${customer.id}`
    };

    // Process email template
    let subject = emailTemplate?.subject || 'TruckFixGo Service Reminder';
    let htmlContent = emailTemplate?.bodyHtml || '';
    
    // Process SMS template
    let smsContent = smsTemplate?.message || 
      `Reminder: Your TruckFixGo ${serviceType} is scheduled for ${scheduledDate} at ${scheduledTime}. Location: ${variables.LOCATION}. Reply STOP to opt out.`;

    // Replace variables in templates
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `[${key}]`;
      subject = subject.replace(new RegExp(placeholder, 'g'), value);
      htmlContent = htmlContent.replace(new RegExp(placeholder, 'g'), value);
      smsContent = smsContent.replace(new RegExp(placeholder, 'g'), value);
    }

    // Add opt-out to SMS if not present
    if (!smsContent.includes('Reply STOP')) {
      smsContent += '\nReply STOP to opt out.';
    }

    return { subject, htmlContent, smsContent };
  }

  // Retry failed reminders
  private async retryFailedReminders() {
    try {
      const failedReminders = await storage.getFailedReminders(20);
      
      for (const reminder of failedReminders) {
        if (reminder.retryCount < reminder.maxRetries) {
          await storage.updateReminderStatus(reminder.id, 'pending');
          console.log(`Retrying reminder ${reminder.id} (attempt ${reminder.retryCount + 1}/${reminder.maxRetries})`);
        }
      }
      
      if (failedReminders.length > 0) {
        console.log(`Retried ${failedReminders.length} failed reminders`);
      }
    } catch (error) {
      console.error('Error retrying failed reminders:', error);
    }
  }

  // Clean up old reminder logs
  private async cleanupOldLogs() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const deleted = await storage.deleteOldReminderLogs(thirtyDaysAgo);
      console.log(`Cleaned up ${deleted} old reminder logs`);
    } catch (error) {
      console.error('Error cleaning up old logs:', error);
    }
  }

  // Generate daily metrics
  private async generateDailyMetrics() {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get yesterday's reminder logs
      const logs = await storage.getReminderLogsByDate(yesterday, today);
      
      // Calculate metrics by channel and type
      const metrics = new Map<string, any>();
      
      for (const log of logs) {
        const key = `${log.channel}-${log.messageType}`;
        
        if (!metrics.has(key)) {
          metrics.set(key, {
            channel: log.channel,
            messageType: log.messageType,
            totalSent: 0,
            totalDelivered: 0,
            totalFailed: 0,
            totalOpened: 0,
            totalClicked: 0,
            totalUnsubscribed: 0,
            totalBounced: 0,
            totalCost: 0
          });
        }
        
        const metric = metrics.get(key);
        
        if (log.status === 'sent' || log.status === 'delivered') {
          metric.totalSent++;
          if (log.status === 'delivered') metric.totalDelivered++;
        } else if (log.status === 'failed') {
          metric.totalFailed++;
        }
        
        if (log.opened) metric.totalOpened++;
        if (log.clicked) metric.totalClicked++;
        if (log.unsubscribed) metric.totalUnsubscribed++;
        if (log.bounced) metric.totalBounced++;
        if (log.cost) metric.totalCost += parseFloat(log.cost.toString());
      }

      // Save metrics to database
      for (const metric of metrics.values()) {
        await storage.recordReminderMetrics(yesterday, metric);
      }

      console.log(`Generated daily metrics for ${metrics.size} channel/type combinations`);
    } catch (error) {
      console.error('Error generating daily metrics:', error);
    }
  }

  // Send completion confirmation
  public async sendCompletionConfirmation(jobId: string) {
    try {
      const job = await storage.getJob(jobId);
      if (!job || !job.customerId) return;

      const customer = await storage.getUser(job.customerId);
      if (!customer) return;

      const preferences = await storage.getCustomerPreferences(customer.id);
      if (!preferences || !preferences.reminderOptIn) return;

      // Get completion template
      const emailTemplate = await storage.getEmailTemplate('service_completed');
      const smsTemplate = await storage.getSmsTemplate('service_completed');

      if (!emailTemplate && !smsTemplate) return;

      const serviceType = await storage.getServiceType(job.serviceTypeId);
      const messageData = await this.prepareMessageContent(
        job,
        customer,
        serviceType?.name || 'Service',
        emailTemplate,
        smsTemplate
      );

      // Determine reminder type
      let reminderType: 'email' | 'sms' | 'both' = 'both';
      if (preferences.communicationChannel === 'email') reminderType = 'email';
      if (preferences.communicationChannel === 'sms') reminderType = 'sms';
      if (preferences.communicationChannel === 'none') return;

      // Create immediate reminder for completion
      await storage.createReminder({
        jobId: job.id,
        recipientId: customer.id,
        reminderType,
        reminderTiming: 'on_completion',
        scheduledSendTime: new Date(),
        recipientEmail: customer.email || undefined,
        recipientPhone: customer.phone || undefined,
        messageSubject: messageData.subject,
        messageContent: messageData.smsContent,
        messageHtml: messageData.htmlContent,
        templateCode: 'service_completed',
        maxRetries: 3,
        metadata: {
          jobNumber: job.jobNumber,
          serviceType: serviceType?.name
        }
      });

      console.log(`Created completion confirmation for job ${job.jobNumber}`);
    } catch (error) {
      console.error(`Error sending completion confirmation for job ${jobId}:`, error);
    }
  }

  // Cancel job reminders
  public async cancelJobReminders(jobId: string) {
    try {
      await storage.cancelJobReminders(jobId);
      console.log(`Cancelled all pending reminders for job ${jobId}`);
    } catch (error) {
      console.error(`Error cancelling reminders for job ${jobId}:`, error);
    }
  }

  // Update job reminders when rescheduled
  public async updateJobReminders(jobId: string, newScheduledTime: Date) {
    try {
      // Cancel existing reminders
      await this.cancelJobReminders(jobId);
      
      // Create new reminders with updated time
      const job = await storage.getJob(jobId);
      if (job && job.customerId) {
        // Update job scheduled time
        job.scheduledAt = newScheduledTime;
        
        // Check and create appropriate reminders based on new time
        const now = new Date();
        const timeDiff = newScheduledTime.getTime() - now.getTime();
        const hoursUntilService = timeDiff / (60 * 60 * 1000);
        
        if (hoursUntilService > 24) {
          await this.createServiceReminder(job, '24hr_before');
        }
        if (hoursUntilService > 12) {
          await this.createServiceReminder(job, '12hr_before');
        }
        if (hoursUntilService > 1) {
          await this.createServiceReminder(job, '1hr_before');
        }
      }
      
      console.log(`Updated reminders for rescheduled job ${jobId}`);
    } catch (error) {
      console.error(`Error updating reminders for job ${jobId}:`, error);
    }
  }

  // Start the scheduler
  public start() {
    console.log('Starting reminder scheduler...');
    this.cronJobs.forEach(job => job.start());
    console.log('Reminder scheduler started');
  }

  // Stop the scheduler
  public stop() {
    console.log('Stopping reminder scheduler...');
    this.cronJobs.forEach(job => job.stop());
    console.log('Reminder scheduler stopped');
  }

  // Get scheduler status
  public getStatus() {
    const status: Record<string, any> = {};
    
    this.cronJobs.forEach((job, name) => {
      status[name] = {
        running: job.running !== undefined ? job.running : 'unknown',
        name
      };
    });
    
    return status;
  }
}

// Export singleton instance
export const reminderScheduler = new ReminderScheduler();

// Export class for testing
export default ReminderScheduler;