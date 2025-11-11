import nodemailer from 'nodemailer';
import { z } from 'zod';

// Email template types
const EmailTypeEnum = z.enum([
  'JOB_ASSIGNED_CONTRACTOR',
  'JOB_ASSIGNED_CUSTOMER',
  'JOB_UNASSIGNED_ADMIN',
  'JOB_PENDING_CUSTOMER',
  'JOB_COMPLETED',
  'WELCOME_CONTRACTOR',
  'PASSWORD_RESET',
  'INVOICE_SENT'
]);

type EmailType = z.infer<typeof EmailTypeEnum>;

interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private retryAttempts = 3;
  private retryDelay = 1000;
  private isVerified = false;
  private lastVerificationError: string | null = null;
  private failureCount = 0;
  private successCount = 0;
  private queuedEmails: Array<{ to: string; subject: string; timestamp: Date; error?: string }> = [];
  private maxQueueSize = 100;

  constructor() {
    this.initializeTransporter();
  }

  // Check if email service is ready
  public isReady(): boolean {
    return this.transporter !== null && this.isVerified;
  }

  // Get email service statistics
  public getStats() {
    return {
      verified: this.isVerified,
      failures: this.failureCount,
      successes: this.successCount,
      queueSize: this.queuedEmails.length,
      lastError: this.lastVerificationError,
      successRate: this.successCount > 0 ? (this.successCount / (this.successCount + this.failureCount)) * 100 : 0
    };
  }

  // Get queued email failures
  public getQueuedFailures() {
    return this.queuedEmails.filter(e => e.error);
  }

  private async initializeTransporter() {
    const email = process.env.OFFICE365_EMAIL;
    const password = process.env.OFFICE365_PASSWORD;

    if (!email || !password) {
      console.error('[Email Service] Office365 credentials not configured');
      this.lastVerificationError = 'Missing Office365 credentials';
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: 'smtp.office365.com',
        port: 587,
        secure: false,
        auth: {
          user: email,
          pass: password
        },
        tls: {
          ciphers: 'SSLv3',
          rejectUnauthorized: false
        },
        logger: process.env.NODE_ENV === 'development' ? true : false,
        debug: process.env.NODE_ENV === 'development' ? true : false
      });

      // Verify the transporter configuration
      console.log('[Email Service] Verifying SMTP connection...');
      await this.verifyConnection();
      
    } catch (error) {
      console.error('[Email Service] Failed to initialize transporter:', error);
      this.lastVerificationError = `Initialization failed: ${(error as Error).message}`;
      this.transporter = null;
    }
  }

  // Verify SMTP connection
  private async verifyConnection(): Promise<boolean> {
    if (!this.transporter) {
      this.isVerified = false;
      this.lastVerificationError = 'Transporter not initialized';
      return false;
    }

    try {
      await this.transporter.verify();
      this.isVerified = true;
      this.lastVerificationError = null;
      console.log('[Email Service] SMTP connection verified successfully');
      return true;
    } catch (error) {
      this.isVerified = false;
      this.lastVerificationError = `SMTP verification failed: ${(error as Error).message}`;
      console.error('[Email Service] SMTP verification failed:', error);
      
      // Log detailed error information
      if (error instanceof Error) {
        console.error('[Email Service] Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
      }
      return false;
    }
  }

  // Test email delivery
  public async testEmailDelivery(): Promise<{ success: boolean; error?: string; messageId?: string }> {
    if (!this.transporter) {
      return { 
        success: false, 
        error: 'Email transporter not initialized' 
      };
    }

    const testEmail = process.env.OFFICE365_EMAIL || 'admin@truckfixgo.com';
    
    try {
      // First verify connection
      const verified = await this.verifyConnection();
      if (!verified) {
        return {
          success: false,
          error: this.lastVerificationError || 'SMTP verification failed'
        };
      }

      // Send a test email
      const info = await this.transporter.sendMail({
        from: testEmail,
        to: testEmail,
        subject: `[TruckFixGo] Email Service Test - ${new Date().toISOString()}`,
        text: 'This is a test email to verify SMTP connectivity.',
        html: '<p>This is a test email to verify SMTP connectivity.</p>'
      });

      console.log('[Email Service] Test email sent successfully:', info.messageId);
      return {
        success: true,
        messageId: info.messageId
      };
    } catch (error) {
      const errorMessage = `Test email failed: ${(error as Error).message}`;
      console.error('[Email Service]', errorMessage);
      
      // Track the failure
      this.failureCount++;
      this.lastVerificationError = errorMessage;
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  private generateTemplate(type: EmailType, data: any): EmailTemplate {
    switch (type) {
      case 'JOB_ASSIGNED_CONTRACTOR':
        return {
          subject: `New Job Assignment - ${data.jobNumber}`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; color: #333; }
                .header { background: #1e3a5f; color: white; padding: 20px; }
                .content { padding: 20px; }
                .job-details { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0; }
                .button { background: #4a90e2; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block; }
              </style>
            </head>
            <body>
              <div class="header">
                <h2>New Job Assignment</h2>
              </div>
              <div class="content">
                <p>Hello ${data.contractorName},</p>
                <p>You have been assigned a new job!</p>
                
                <div class="job-details">
                  <h3>Job Details:</h3>
                  <p><strong>Job Number:</strong> ${data.jobNumber}</p>
                  <p><strong>Customer:</strong> ${data.customerName}</p>
                  <p><strong>Location:</strong> ${data.address}</p>
                  <p><strong>Issue:</strong> ${data.issueDescription}</p>
                  <p><strong>Service Type:</strong> ${data.serviceType}</p>
                  <p><strong>Estimated Payout:</strong> $${data.estimatedPrice}</p>
                </div>
                
                <p>Please accept or decline this job in your dashboard as soon as possible.</p>
                <a href="${process.env.APP_URL || 'https://truckfixgo.com'}/contractor/dashboard" class="button">View in Dashboard</a>
                
                <p style="margin-top: 20px;">Thank you,<br>TruckFixGo Team</p>
              </div>
            </body>
            </html>
          `,
          text: `New Job Assignment - ${data.jobNumber}\n\nCustomer: ${data.customerName}\nLocation: ${data.address}\nIssue: ${data.issueDescription}`
        };

      case 'JOB_ASSIGNED_CUSTOMER':
        return {
          subject: 'Help is on the way!',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; color: #333; }
                .header { background: #1e3a5f; color: white; padding: 20px; }
                .content { padding: 20px; }
                .contractor-info { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0; }
                .button { background: #4a90e2; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block; }
              </style>
            </head>
            <body>
              <div class="header">
                <h2>Your Mechanic is On The Way!</h2>
              </div>
              <div class="content">
                <p>Hello ${data.customerName},</p>
                <p>Good news! We've assigned a qualified mechanic to help you.</p>
                
                <div class="contractor-info">
                  <h3>Your Mechanic:</h3>
                  <p><strong>Name:</strong> ${data.contractorName}</p>
                  <p><strong>Rating:</strong> ${data.contractorRating} ⭐</p>
                  <p><strong>Total Jobs:</strong> ${data.contractorTotalJobs}</p>
                  <p><strong>ETA:</strong> ${data.eta || 'Approximately 45 minutes'}</p>
                </div>
                
                <p>You can track your mechanic's location in real-time:</p>
                <a href="${process.env.APP_URL || 'https://truckfixgo.com'}/tracking?jobId=${data.jobId}" class="button">Track Mechanic</a>
                
                <p>Your mechanic will contact you when they're close to arrival.</p>
                
                <p style="margin-top: 20px;">Thank you for choosing TruckFixGo!</p>
              </div>
            </body>
            </html>
          `,
          text: `Your mechanic ${data.contractorName} is on the way! ETA: ${data.eta || 'Approximately 45 minutes'}`
        };

      case 'JOB_UNASSIGNED_ADMIN':
        return {
          subject: `URGENT: Job ${data.jobNumber} needs assignment`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; color: #333; }
                .urgent { background: #ff4444; color: white; padding: 20px; }
                .content { padding: 20px; }
                .job-info { background: #fff3cd; padding: 15px; border-left: 4px solid #ff9800; margin: 15px 0; }
              </style>
            </head>
            <body>
              <div class="urgent">
                <h2>⚠️ URGENT: Unassigned Job</h2>
              </div>
              <div class="content">
                <div class="job-info">
                  <p><strong>Job Number:</strong> ${data.jobNumber}</p>
                  <p><strong>Created:</strong> ${data.createdAt}</p>
                  <p><strong>Minutes Waiting:</strong> ${data.minutesWaiting}</p>
                  <p><strong>Customer:</strong> ${data.customerName}</p>
                  <p><strong>Location:</strong> ${data.address}</p>
                  <p><strong>Issue:</strong> ${data.issueDescription}</p>
                </div>
                
                <p>This job has been unassigned for over ${data.minutesWaiting} minutes and needs immediate attention.</p>
                
                <a href="${process.env.APP_URL || 'https://truckfixgo.com'}/admin/jobs" style="background: #ff4444; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block;">Assign Contractor</a>
              </div>
            </body>
            </html>
          `,
          text: `URGENT: Job ${data.jobNumber} has been unassigned for ${data.minutesWaiting} minutes`
        };

      case 'JOB_PENDING_CUSTOMER':
        return {
          subject: 'We\'re finding a mechanic for you',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; color: #333; }
                .header { background: #1e3a5f; color: white; padding: 20px; }
                .content { padding: 20px; }
                .info-box { background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 15px 0; }
              </style>
            </head>
            <body>
              <div class="header">
                <h2>We're Working on Your Request</h2>
              </div>
              <div class="content">
                <p>Hello ${data.customerName},</p>
                <p>Thank you for your patience. We're currently finding the best available mechanic for your needs.</p>
                
                <div class="info-box">
                  <p><strong>Job Number:</strong> ${data.jobNumber}</p>
                  <p><strong>Status:</strong> Finding a mechanic</p>
                  <p><strong>Expected Assignment:</strong> Within the next 10 minutes</p>
                </div>
                
                <p>You'll receive another notification as soon as a mechanic is assigned and on their way to help you.</p>
                
                <p>If you need immediate assistance, please call us at 1-800-TRUCK-FIX.</p>
                
                <p style="margin-top: 20px;">Thank you for your patience,<br>TruckFixGo Team</p>
              </div>
            </body>
            </html>
          `,
          text: `We're finding a mechanic for your job ${data.jobNumber}. You'll be notified once assigned.`
        };

      default:
        return {
          subject: 'TruckFixGo Notification',
          html: '<p>Notification from TruckFixGo</p>',
          text: 'Notification from TruckFixGo'
        };
    }
  }

  async sendEmail(
    to: string | string[],
    type: EmailType,
    data: any,
    options?: { cc?: string[]; bcc?: string[] }
  ): Promise<boolean> {
    if (!this.transporter) {
      console.error('[Email Service] Transporter not initialized, cannot send email');
      this.failureCount++;
      this.lastVerificationError = 'Transporter not initialized';
      return false;
    }

    // Skip emails to invalid test domains
    const INVALID_DOMAINS = ['example.com', 'test.com', 'localhost'];
    const recipients = Array.isArray(to) ? to.join(', ') : to;
    
    // Check if any recipient has an invalid domain
    const recipientEmails = Array.isArray(to) ? to : [to];
    for (const email of recipientEmails) {
      const emailDomain = email.split('@')[1];
      if (INVALID_DOMAINS.includes(emailDomain)) {
        console.log(`[Email Service] Skipping email to ${email} - invalid test domain`);
        return false; // Return false but don't retry
      }
    }

    const template = this.generateTemplate(type, data);
    const emailRecord = {
      to: recipients,
      subject: template.subject,
      timestamp: new Date()
    };

    let attempt = 0;
    let lastError: Error | null = null;
    
    while (attempt < this.retryAttempts) {
      try {
        console.log(`[Email Service] Sending ${type} email to: ${recipients} (attempt ${attempt + 1}/${this.retryAttempts})`);
        
        // Verify connection before sending
        if (!this.isVerified) {
          await this.verifyConnection();
          if (!this.isVerified) {
            throw new Error(this.lastVerificationError || 'SMTP verification failed');
          }
        }
        
        const info = await this.transporter.sendMail({
          from: process.env.OFFICE365_EMAIL,
          to: recipients,
          cc: options?.cc?.join(', '),
          bcc: options?.bcc?.join(', '),
          subject: template.subject,
          html: template.html,
          text: template.text
        });

        console.log(`[Email Service] Email sent successfully: ${info.messageId}`);
        this.successCount++;
        return true;
      } catch (error) {
        attempt++;
        lastError = error as Error;
        console.error(`[Email Service] Failed to send email (attempt ${attempt}/${this.retryAttempts}):`, {
          error: error instanceof Error ? error.message : error,
          stack: error instanceof Error ? error.stack : undefined,
          type,
          recipients
        });
        
        // If it's an authentication error, don't retry
        if (error instanceof Error && (
          error.message.includes('Invalid login') ||
          error.message.includes('Authentication') ||
          error.message.includes('535')
        )) {
          console.error('[Email Service] Authentication error detected, stopping retries');
          this.isVerified = false;
          this.lastVerificationError = `Authentication failed: ${error.message}`;
          break;
        }
        
        if (attempt < this.retryAttempts) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
        }
      }
    }

    // Track the failure
    this.failureCount++;
    const errorMessage = lastError ? lastError.message : 'Unknown error';
    this.lastVerificationError = errorMessage;
    
    // Add to queue if not too large
    if (this.queuedEmails.length < this.maxQueueSize) {
      this.queuedEmails.push({
        ...emailRecord,
        error: errorMessage
      });
    }

    console.error(`[Email Service] Failed to send ${type} email after ${attempt} attempts. Error: ${errorMessage}`);
    return false;
  }

  async sendJobAssignmentNotifications(job: any, contractor: any, customer: any) {
    console.log('[Email Service] Sending job assignment notifications');
    
    // Send to contractor
    if (contractor.email) {
      await this.sendEmail(contractor.email, 'JOB_ASSIGNED_CONTRACTOR', {
        contractorName: `${contractor.firstName} ${contractor.lastName}`,
        jobNumber: job.jobNumber,
        customerName: customer ? `${customer.firstName} ${customer.lastName}` : 'Customer',
        address: job.address,
        issueDescription: job.issueDescription,
        serviceType: job.serviceType,
        estimatedPrice: job.estimatedPrice
      });
    }

    // Send to customer
    if (customer?.email) {
      await this.sendEmail(customer.email, 'JOB_ASSIGNED_CUSTOMER', {
        customerName: `${customer.firstName} ${customer.lastName}`,
        contractorName: `${contractor.firstName} ${contractor.lastName}`,
        contractorRating: contractor.averageRating || 5.0,
        contractorTotalJobs: contractor.totalJobsCompleted || 0,
        eta: job.estimatedArrival,
        jobId: job.id
      });
    }
  }

  async sendUnassignedJobAlert(job: any, customer: any) {
    const minutesWaiting = Math.floor((Date.now() - new Date(job.createdAt).getTime()) / 60000);
    
    console.log(`[Email Service] Sending unassigned job alert for job ${job.jobNumber} (${minutesWaiting} minutes waiting)`);
    
    await this.sendEmail('admin@truckfixgo.com', 'JOB_UNASSIGNED_ADMIN', {
      jobNumber: job.jobNumber,
      createdAt: new Date(job.createdAt).toLocaleString(),
      minutesWaiting,
      customerName: customer ? `${customer.firstName} ${customer.lastName}` : 'Customer',
      address: job.address,
      issueDescription: job.issueDescription
    });
  }

  async sendPendingJobNotification(job: any, customer: any) {
    if (!customer?.email) return;

    console.log(`[Email Service] Sending pending job notification to customer for job ${job.jobNumber}`);
    
    await this.sendEmail(customer.email, 'JOB_PENDING_CUSTOMER', {
      customerName: `${customer.firstName} ${customer.lastName}`,
      jobNumber: job.jobNumber
    });
  }

  // Send new fleet application notification to all admins
  async sendNewFleetApplicationNotification(application: any): Promise<void> {
    try {
      // Import storage dynamically to avoid circular dependencies
      const { storage } = await import('../storage');
      
      // Get all admin users
      const adminUsers = await storage.getAdminUsers();
      
      if (adminUsers.length === 0) {
        console.log('[Email Service] No admin users found to notify about fleet application');
        return;
      }
      
      const appUrl = process.env.APP_URL || 'https://truckfixgo.com';
      
      // Generate email content
      const subject = `New Fleet Application - ${application.companyName}`;
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #333; background: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; }
            .header { background: #1e3a5f; color: white; padding: 20px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { padding: 30px; }
            .alert-banner { background: #4a90e2; color: white; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
            .details-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .details-table th { background: #f8f9fa; padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6; }
            .details-table td { padding: 12px; border-bottom: 1px solid #dee2e6; }
            .button { background: #4a90e2; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; }
            .button:hover { background: #357abd; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚚 TruckFixGo - New Fleet Application</h1>
            </div>
            <div class="content">
              <div class="alert-banner">
                📋 A new fleet application has been submitted and requires review
              </div>
              
              <p>Hello Admin,</p>
              <p>A new fleet has submitted an application to join the TruckFixGo platform:</p>
              
              <table class="details-table">
                <tr>
                  <th>Company Name</th>
                  <td>${application.companyName}</td>
                </tr>
                <tr>
                  <th>Fleet Size</th>
                  <td>${application.fleetSize} vehicles</td>
                </tr>
                <tr>
                  <th>Requested Tier</th>
                  <td>${application.requestedTier || 'Standard'}</td>
                </tr>
                <tr>
                  <th>DOT Number</th>
                  <td>${application.dotNumber || 'Not provided'}</td>
                </tr>
                <tr>
                  <th>MC Number</th>
                  <td>${application.mcNumber || 'Not provided'}</td>
                </tr>
                <tr>
                  <th>Primary Contact</th>
                  <td>${application.primaryContactName}</td>
                </tr>
                <tr>
                  <th>Contact Email</th>
                  <td>${application.primaryContactEmail}</td>
                </tr>
                <tr>
                  <th>Contact Phone</th>
                  <td>${application.primaryContactPhone}</td>
                </tr>
                <tr>
                  <th>Address</th>
                  <td>${application.address}</td>
                </tr>
                <tr>
                  <th>Submitted At</th>
                  <td>${new Date(application.submittedAt || application.createdAt).toLocaleString()}</td>
                </tr>
              </table>
              
              <p>Please review this application and take appropriate action:</p>
              
              <center>
                <a href="${appUrl}/admin/applications#fleet" class="button">Review Application</a>
              </center>
              
              <p style="margin-top: 30px; font-size: 14px; color: #666;">
                This is an automated notification. Please review the application promptly to ensure a smooth onboarding process.
              </p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} TruckFixGo - Fleet Management Platform</p>
              <p style="font-size: 12px;">This email was sent to admins of TruckFixGo</p>
            </div>
          </div>
        </body>
        </html>
      `;
      
      // Send email to each admin
      for (const admin of adminUsers) {
        if (admin.email) {
          try {
            if (this.transporter && this.isVerified) {
              await this.transporter.sendMail({
                from: process.env.OFFICE365_EMAIL || 'admin@truckfixgo.com',
                to: admin.email,
                subject: subject,
                html: html
              });
              console.log(`[Email Service] Notified admin ${admin.email} about fleet application`);
            }
          } catch (err) {
            console.error(`[Email Service] Failed to notify admin ${admin.email} about fleet application:`, err);
          }
        }
      }
      
      console.log(`[Email Service] Sent fleet application notifications to ${adminUsers.length} admin(s)`);
    } catch (error) {
      console.error('[Email Service] Error sending fleet application notifications:', error);
    }
  }

  // Send new contractor application notification to all admins
  async sendNewContractorApplicationNotification(application: any): Promise<void> {
    try {
      // Import storage dynamically to avoid circular dependencies
      const { storage } = await import('../storage');
      
      // Get all admin users
      const adminUsers = await storage.getAdminUsers();
      
      if (adminUsers.length === 0) {
        console.log('[Email Service] No admin users found to notify about contractor application');
        return;
      }
      
      const appUrl = process.env.APP_URL || 'https://truckfixgo.com';
      
      // Generate email content
      const subject = `New Contractor Application - ${application.companyName || `${application.firstName} ${application.lastName}`}`;
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #333; background: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; }
            .header { background: #1e3a5f; color: white; padding: 20px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { padding: 30px; }
            .alert-banner { background: #28a745; color: white; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
            .details-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .details-table th { background: #f8f9fa; padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6; }
            .details-table td { padding: 12px; border-bottom: 1px solid #dee2e6; }
            .button { background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; }
            .button:hover { background: #218838; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔧 TruckFixGo - New Contractor Application</h1>
            </div>
            <div class="content">
              <div class="alert-banner">
                👷 A new contractor application has been submitted and requires review
              </div>
              
              <p>Hello Admin,</p>
              <p>A new contractor has submitted an application to join the TruckFixGo platform:</p>
              
              <table class="details-table">
                <tr>
                  <th>Name</th>
                  <td>${application.firstName} ${application.lastName}</td>
                </tr>
                <tr>
                  <th>Company Name</th>
                  <td>${application.companyName || 'Individual Contractor'}</td>
                </tr>
                <tr>
                  <th>Email</th>
                  <td>${application.email}</td>
                </tr>
                <tr>
                  <th>Phone</th>
                  <td>${application.phone}</td>
                </tr>
                <tr>
                  <th>Service Area</th>
                  <td>${application.serviceArea || 'Not specified'}</td>
                </tr>
                <tr>
                  <th>Service Radius</th>
                  <td>${application.serviceRadius ? `${application.serviceRadius} miles` : 'Not specified'}</td>
                </tr>
                <tr>
                  <th>Years of Experience</th>
                  <td>${application.yearsExperience || 'Not specified'}</td>
                </tr>
                <tr>
                  <th>Certifications</th>
                  <td>${application.certifications || 'Not specified'}</td>
                </tr>
                <tr>
                  <th>Insurance Provider</th>
                  <td>${application.insuranceProvider || 'Not provided'}</td>
                </tr>
                <tr>
                  <th>Application Status</th>
                  <td>${application.status}</td>
                </tr>
                <tr>
                  <th>Submitted At</th>
                  <td>${new Date(application.createdAt).toLocaleString()}</td>
                </tr>
              </table>
              
              <p>Please review this application and verify the contractor's credentials:</p>
              
              <center>
                <a href="${appUrl}/admin/applications#contractor" class="button">Review Application</a>
              </center>
              
              <p style="margin-top: 30px; font-size: 14px; color: #666;">
                This is an automated notification. Please review the application and verify all documentation before approval.
              </p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} TruckFixGo - Contractor Management Platform</p>
              <p style="font-size: 12px;">This email was sent to admins of TruckFixGo</p>
            </div>
          </div>
        </body>
        </html>
      `;
      
      // Send email to each admin
      for (const admin of adminUsers) {
        if (admin.email) {
          try {
            if (this.transporter && this.isVerified) {
              await this.transporter.sendMail({
                from: process.env.OFFICE365_EMAIL || 'admin@truckfixgo.com',
                to: admin.email,
                subject: subject,
                html: html
              });
              console.log(`[Email Service] Notified admin ${admin.email} about contractor application`);
            }
          } catch (err) {
            console.error(`[Email Service] Failed to notify admin ${admin.email} about contractor application:`, err);
          }
        }
      }
      
      console.log(`[Email Service] Sent contractor application notifications to ${adminUsers.length} admin(s)`);
    } catch (error) {
      console.error('[Email Service] Error sending contractor application notifications:', error);
    }
  }
}

// Export singleton instance
export const emailService = new EmailService();
export default emailService;