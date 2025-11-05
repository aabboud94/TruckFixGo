import { storage } from "./storage";
import {
  type Reminder,
  type InsertReminder,
  type ReminderLog,
  type Job,
  type User,
  type CustomerPreferences,
  reminderStatusEnum,
  reminderTypeEnum,
  reminderTimingEnum,
} from "@shared/schema";
import nodemailer from "nodemailer";
import twilio from "twilio";
import { format } from "date-fns";

// Email configuration interface
interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

// SMS configuration interface
interface SmsConfig {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
}

class ReminderService {
  private emailTransporter: nodemailer.Transporter | null = null;
  private twilioClient: ReturnType<typeof twilio> | null = null;
  private emailConfig: EmailConfig | null = null;
  private smsConfig: SmsConfig | null = null;
  private testMode: boolean = false;
  private processingInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeServices();
  }

  // Initialize email and SMS services based on configuration
  private async initializeServices() {
    try {
      // Load configurations from integration settings
      const emailIntegration = await storage.getIntegrationsConfig('email');
      const smsIntegration = await storage.getIntegrationsConfig('twilio');

      // Initialize email transporter (Office 365/Outlook)
      if (emailIntegration?.config) {
        const config = emailIntegration.config as any;
        this.emailConfig = {
          host: config.host || 'smtp.office365.com',
          port: config.port || 587,
          secure: config.secure || false,
          auth: {
            user: config.username || '',
            pass: config.password || ''
          },
          from: config.from || 'noreply@truckfixgo.com'
        };

        this.emailTransporter = nodemailer.createTransport({
          host: this.emailConfig.host,
          port: this.emailConfig.port,
          secure: this.emailConfig.secure,
          auth: this.emailConfig.auth,
          tls: {
            rejectUnauthorized: false
          }
        });

        // Verify email connection
        if (this.emailTransporter && this.emailConfig.auth.user && this.emailConfig.auth.pass) {
          await this.emailTransporter.verify();
          console.log('Email service initialized successfully');
        }
      }

      // Initialize Twilio client
      if (smsIntegration?.config) {
        const config = smsIntegration.config as any;
        if (config.accountSid && config.authToken && config.phoneNumber) {
          this.smsConfig = {
            accountSid: config.accountSid,
            authToken: config.authToken,
            phoneNumber: config.phoneNumber
          };
          
          this.twilioClient = twilio(this.smsConfig.accountSid, this.smsConfig.authToken);
          console.log('SMS service initialized successfully');
        }
      }

      // Set test mode from environment
      this.testMode = process.env.REMINDER_TEST_MODE === 'true';

    } catch (error) {
      console.error('Failed to initialize reminder services:', error);
    }
  }

  // Start the reminder processing loop
  public startProcessing(intervalMs: number = 60000) {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }

    // Process immediately on start
    this.processReminders();

    // Then process at intervals
    this.processingInterval = setInterval(() => {
      this.processReminders();
    }, intervalMs);

    console.log(`Reminder processing started with ${intervalMs}ms interval`);
  }

  // Stop the reminder processing loop
  public stopProcessing() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
      console.log('Reminder processing stopped');
    }
  }

  // Process pending reminders
  private async processReminders() {
    try {
      const pendingReminders = await storage.getPendingReminders(50);
      
      for (const reminder of pendingReminders) {
        try {
          await this.sendReminder(reminder);
        } catch (error) {
          console.error(`Failed to process reminder ${reminder.id}:`, error);
          await storage.updateReminderStatus(reminder.id, 'failed', (error as Error).message);
        }
      }
    } catch (error) {
      console.error('Error processing reminders:', error);
    }
  }

  // Send a reminder based on its type
  public async sendReminder(reminder: Reminder) {
    // Check if recipient is blacklisted
    if (reminder.recipientEmail) {
      const isBlacklisted = await storage.isBlacklisted(reminder.recipientEmail, 'email');
      if (isBlacklisted && (reminder.reminderType === 'email' || reminder.reminderType === 'both')) {
        await storage.updateReminderStatus(reminder.id, 'failed', 'Recipient email is blacklisted');
        return;
      }
    }
    
    if (reminder.recipientPhone) {
      const isBlacklisted = await storage.isBlacklisted(reminder.recipientPhone, 'phone');
      if (isBlacklisted && (reminder.reminderType === 'sms' || reminder.reminderType === 'both')) {
        await storage.updateReminderStatus(reminder.id, 'failed', 'Recipient phone is blacklisted');
        return;
      }
    }

    // Check customer preferences
    const preferences = await storage.getCustomerPreferences(reminder.recipientId);
    if (preferences && !preferences.reminderOptIn) {
      await storage.updateReminderStatus(reminder.id, 'cancelled', 'User opted out of reminders');
      return;
    }

    // Check do not disturb hours
    if (preferences && this.isInDoNotDisturbHours(preferences)) {
      // Reschedule for after DND hours
      const nextSendTime = this.getNextAvailableTime(preferences);
      await storage.updateReminderStatus(reminder.id, 'queued');
      // Would need to update scheduled time here
      return;
    }

    let success = false;
    let errorMessage = '';

    // Send based on reminder type
    if (reminder.reminderType === 'email' || reminder.reminderType === 'both') {
      if (reminder.recipientEmail) {
        const emailResult = await this.sendEmail(reminder);
        if (!emailResult.success) {
          errorMessage = emailResult.error || 'Email send failed';
        } else {
          success = true;
        }
      }
    }

    if (reminder.reminderType === 'sms' || reminder.reminderType === 'both') {
      if (reminder.recipientPhone) {
        const smsResult = await this.sendSms(reminder);
        if (!smsResult.success) {
          errorMessage = smsResult.error || 'SMS send failed';
        } else {
          success = true;
        }
      }
    }

    // Update reminder status
    if (success) {
      await storage.updateReminderStatus(reminder.id, 'sent');
    } else {
      await storage.updateReminderStatus(reminder.id, 'failed', errorMessage);
    }
  }

  // Send email reminder
  private async sendEmail(reminder: Reminder): Promise<{ success: boolean; error?: string }> {
    if (!this.emailTransporter || !this.emailConfig) {
      return { success: false, error: 'Email service not configured' };
    }

    if (!reminder.recipientEmail) {
      return { success: false, error: 'No recipient email' };
    }

    try {
      const mailOptions = {
        from: this.emailConfig.from,
        to: reminder.recipientEmail,
        subject: reminder.messageSubject || 'TruckFixGo Service Reminder',
        text: reminder.messageContent || '',
        html: reminder.messageHtml || reminder.messageContent || ''
      };

      if (this.testMode) {
        console.log('TEST MODE - Would send email:', mailOptions);
        
        // Log the reminder
        await storage.createReminderLog({
          reminderId: reminder.id,
          jobId: reminder.jobId,
          recipientId: reminder.recipientId,
          channel: 'email',
          recipient: reminder.recipientEmail,
          messageType: reminder.reminderTiming,
          subject: mailOptions.subject,
          content: mailOptions.text,
          status: 'test',
          sentAt: new Date()
        });
        
        return { success: true };
      }

      const result = await this.emailTransporter.sendMail(mailOptions);

      // Log the successful send
      await storage.createReminderLog({
        reminderId: reminder.id,
        jobId: reminder.jobId,
        recipientId: reminder.recipientId,
        channel: 'email',
        recipient: reminder.recipientEmail,
        messageType: reminder.reminderTiming,
        subject: mailOptions.subject,
        content: mailOptions.text,
        status: 'sent',
        providerId: result.messageId,
        sentAt: new Date()
      });

      // Record metrics
      await storage.recordReminderMetrics(new Date(), {
        channel: 'email',
        messageType: reminder.reminderTiming,
        totalSent: 1
      });

      return { success: true };
    } catch (error) {
      console.error('Failed to send email:', error);
      
      // Log the failed send
      await storage.createReminderLog({
        reminderId: reminder.id,
        jobId: reminder.jobId,
        recipientId: reminder.recipientId,
        channel: 'email',
        recipient: reminder.recipientEmail,
        messageType: reminder.reminderTiming,
        subject: reminder.messageSubject,
        content: reminder.messageContent,
        status: 'failed',
        errorMessage: (error as Error).message,
        sentAt: new Date()
      });

      // Record metrics
      await storage.recordReminderMetrics(new Date(), {
        channel: 'email',
        messageType: reminder.reminderTiming,
        totalFailed: 1
      });

      return { success: false, error: (error as Error).message };
    }
  }

  // Send SMS reminder
  private async sendSms(reminder: Reminder): Promise<{ success: boolean; error?: string }> {
    if (!this.twilioClient || !this.smsConfig) {
      return { success: false, error: 'SMS service not configured' };
    }

    if (!reminder.recipientPhone) {
      return { success: false, error: 'No recipient phone' };
    }

    try {
      // Ensure phone number is in E.164 format
      const toPhone = this.formatPhoneNumber(reminder.recipientPhone);
      const messageBody = reminder.messageContent || 'TruckFixGo Service Reminder';

      if (this.testMode) {
        console.log('TEST MODE - Would send SMS:', {
          to: toPhone,
          from: this.smsConfig.phoneNumber,
          body: messageBody
        });
        
        // Log the reminder
        await storage.createReminderLog({
          reminderId: reminder.id,
          jobId: reminder.jobId,
          recipientId: reminder.recipientId,
          channel: 'sms',
          recipient: toPhone,
          messageType: reminder.reminderTiming,
          content: messageBody,
          status: 'test',
          sentAt: new Date()
        });
        
        return { success: true };
      }

      const message = await this.twilioClient.messages.create({
        to: toPhone,
        from: this.smsConfig.phoneNumber,
        body: messageBody
      });

      // Log the successful send
      await storage.createReminderLog({
        reminderId: reminder.id,
        jobId: reminder.jobId,
        recipientId: reminder.recipientId,
        channel: 'sms',
        recipient: toPhone,
        messageType: reminder.reminderTiming,
        content: messageBody,
        status: 'sent',
        providerId: message.sid,
        cost: parseFloat(message.price || '0'),
        providerResponse: message as any,
        sentAt: new Date()
      });

      // Record metrics
      await storage.recordReminderMetrics(new Date(), {
        channel: 'sms',
        messageType: reminder.reminderTiming,
        totalSent: 1,
        totalCost: parseFloat(message.price || '0')
      });

      return { success: true };
    } catch (error) {
      console.error('Failed to send SMS:', error);
      
      // Log the failed send
      await storage.createReminderLog({
        reminderId: reminder.id,
        jobId: reminder.jobId,
        recipientId: reminder.recipientId,
        channel: 'sms',
        recipient: reminder.recipientPhone,
        messageType: reminder.reminderTiming,
        content: reminder.messageContent,
        status: 'failed',
        errorMessage: (error as Error).message,
        sentAt: new Date()
      });

      // Record metrics
      await storage.recordReminderMetrics(new Date(), {
        channel: 'sms',
        messageType: reminder.reminderTiming,
        totalFailed: 1
      });

      return { success: false, error: (error as Error).message };
    }
  }

  // Schedule reminders for a job
  public async scheduleJobReminders(job: Job) {
    if (!job.scheduledAt) return;

    const customer = await storage.getUser(job.customerId!);
    if (!customer) return;

    const preferences = await storage.getCustomerPreferences(customer.id) || 
      await this.createDefaultPreferences(customer.id);

    if (!preferences.reminderOptIn) return;

    const scheduledTime = new Date(job.scheduledAt);
    
    // Schedule 24-hour reminder
    const twentyFourHourBefore = new Date(scheduledTime);
    twentyFourHourBefore.setHours(twentyFourHourBefore.getHours() - 24);
    
    if (twentyFourHourBefore > new Date()) {
      await this.createReminder(job, customer, preferences, '24hr_before', twentyFourHourBefore);
    }

    // Schedule 1-hour reminder
    const oneHourBefore = new Date(scheduledTime);
    oneHourBefore.setHours(oneHourBefore.getHours() - 1);
    
    if (oneHourBefore > new Date()) {
      await this.createReminder(job, customer, preferences, '1hr_before', oneHourBefore);
    }
  }

  // Create a reminder
  private async createReminder(
    job: Job,
    customer: User,
    preferences: CustomerPreferences,
    timing: typeof reminderTimingEnum.enumValues[number],
    scheduledTime: Date
  ) {
    const template = await this.getTemplate(timing);
    const { subject, content, html } = await this.populateTemplate(template, job, customer);
    
    let reminderType: typeof reminderTypeEnum.enumValues[number] = 'both';
    if (preferences.communicationChannel === 'email') reminderType = 'email';
    if (preferences.communicationChannel === 'sms') reminderType = 'sms';

    await storage.createReminder({
      jobId: job.id,
      recipientId: customer.id,
      reminderType,
      reminderTiming: timing,
      scheduledSendTime: scheduledTime,
      recipientEmail: customer.email || undefined,
      recipientPhone: customer.phone || undefined,
      messageSubject: subject,
      messageContent: content,
      messageHtml: html,
      templateCode: template.code,
      maxRetries: 3,
      metadata: {
        jobNumber: job.jobNumber,
        serviceType: job.serviceTypeId
      }
    });
  }

  // Get template based on timing
  private async getTemplate(timing: string): Promise<any> {
    let templateCode = '';
    
    switch(timing) {
      case '24hr_before':
        templateCode = 'reminder_24hr';
        break;
      case '12hr_before':
        templateCode = 'reminder_12hr';
        break;
      case '1hr_before':
        templateCode = 'reminder_1hr';
        break;
      case 'on_completion':
        templateCode = 'service_completed';
        break;
      case 'invoice_delivery':
        templateCode = 'invoice_ready';
        break;
      case 'payment_reminder':
        templateCode = 'payment_due';
        break;
      default:
        templateCode = 'reminder_default';
    }

    const emailTemplate = await storage.getEmailTemplate(templateCode);
    const smsTemplate = await storage.getSmsTemplate(templateCode);

    return {
      code: templateCode,
      email: emailTemplate,
      sms: smsTemplate
    };
  }

  // Populate template with job and customer data
  private async populateTemplate(template: any, job: Job, customer: User): Promise<{
    subject: string;
    content: string;
    html: string;
  }> {
    const serviceType = await storage.getServiceType(job.serviceTypeId);
    const scheduledDate = job.scheduledAt ? format(new Date(job.scheduledAt), 'MMM dd, yyyy') : '';
    const scheduledTime = job.scheduledAt ? format(new Date(job.scheduledAt), 'h:mm a') : '';
    
    const variables = {
      CUSTOMER_NAME: `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Customer',
      JOB_NUMBER: job.jobNumber,
      SERVICE_TYPE: serviceType?.name || 'Service',
      DATE: scheduledDate,
      TIME: scheduledTime,
      LOCATION: job.locationAddress || 'TBD',
      UNIT_NUMBER: job.unitNumber || job.vin || '',
      UNSUBSCRIBE_LINK: `${process.env.APP_URL}/unsubscribe/${customer.id}`
    };

    // Replace variables in templates
    let subject = template.email?.subject || 'TruckFixGo Service Reminder';
    let content = template.sms?.message || template.email?.bodyText || '';
    let html = template.email?.bodyHtml || '';

    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `[${key}]`;
      subject = subject.replace(new RegExp(placeholder, 'g'), value);
      content = content.replace(new RegExp(placeholder, 'g'), value);
      html = html.replace(new RegExp(placeholder, 'g'), value);
    }

    // Add opt-out instruction to SMS
    if (template.sms && !content.includes('Reply STOP')) {
      content += '\n\nReply STOP to opt out.';
    }

    return { subject, content, html };
  }

  // Create default customer preferences
  private async createDefaultPreferences(userId: string): Promise<CustomerPreferences> {
    return await storage.createCustomerPreferences({
      userId,
      communicationChannel: 'both',
      reminderOptIn: true,
      marketingOptIn: false,
      language: 'en',
      timezone: 'America/New_York',
      maxDailyMessages: 10
    });
  }

  // Check if current time is in do not disturb hours
  private isInDoNotDisturbHours(preferences: CustomerPreferences): boolean {
    if (!preferences.doNotDisturbStart || !preferences.doNotDisturbEnd) {
      return false;
    }

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;

    const [startHour, startMinute] = preferences.doNotDisturbStart.split(':').map(Number);
    const [endHour, endMinute] = preferences.doNotDisturbEnd.split(':').map(Number);
    
    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;

    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  // Get next available time after DND hours
  private getNextAvailableTime(preferences: CustomerPreferences): Date {
    if (!preferences.doNotDisturbEnd) {
      return new Date();
    }

    const [endHour, endMinute] = preferences.doNotDisturbEnd.split(':').map(Number);
    const nextTime = new Date();
    nextTime.setHours(endHour, endMinute, 0, 0);

    if (nextTime < new Date()) {
      nextTime.setDate(nextTime.getDate() + 1);
    }

    return nextTime;
  }

  // Format phone number to E.164 format
  private formatPhoneNumber(phone: string): string {
    // Remove all non-numeric characters
    let cleaned = phone.replace(/\D/g, '');
    
    // Add country code if not present
    if (cleaned.length === 10) {
      cleaned = '1' + cleaned;
    }
    
    // Add + prefix
    return '+' + cleaned;
  }

  // Send test reminder
  public async sendTestReminder(
    type: 'email' | 'sms' | 'both',
    recipient: string,
    template?: string
  ): Promise<{ success: boolean; error?: string }> {
    const testReminder: Reminder = {
      id: 'test-' + Date.now(),
      jobId: 'test-job',
      recipientId: 'test-user',
      reminderType: type,
      reminderTiming: '24hr_before',
      scheduledSendTime: new Date(),
      actualSendTime: null,
      status: 'pending',
      recipientEmail: type === 'sms' ? null : recipient,
      recipientPhone: type === 'email' ? null : recipient,
      messageSubject: 'Test Reminder - TruckFixGo Service Tomorrow',
      messageContent: template || 'This is a test reminder from TruckFixGo. Your service is scheduled for tomorrow at 2:00 PM.',
      messageHtml: `
        <html>
          <body style="font-family: Arial, sans-serif;">
            <h2>Test Service Reminder</h2>
            <p>${template || 'This is a test reminder from TruckFixGo.'}</p>
            <p>Your service is scheduled for tomorrow at 2:00 PM.</p>
            <p>If you have any questions, please contact us.</p>
          </body>
        </html>
      `,
      templateCode: null,
      retryCount: 0,
      maxRetries: 0,
      lastError: null,
      deliveryInfo: null,
      metadata: { test: true },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (type === 'email' || type === 'both') {
      const result = await this.sendEmail(testReminder);
      if (!result.success) return result;
    }

    if (type === 'sms' || type === 'both') {
      const result = await this.sendSms(testReminder);
      if (!result.success) return result;
    }

    return { success: true };
  }
}

// Export singleton instance
export const reminderService = new ReminderService();

// Export class for testing
export default ReminderService;