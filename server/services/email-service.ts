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

  constructor() {
    this.initializeTransporter();
  }

  // Check if email service is ready
  public isReady(): boolean {
    return this.transporter !== null;
  }

  private initializeTransporter() {
    const email = process.env.OFFICE365_EMAIL;
    const password = process.env.OFFICE365_PASSWORD;

    if (!email || !password) {
      console.error('[Email Service] Office365 credentials not configured');
      return;
    }

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
      }
    });

    console.log('[Email Service] Office365 email service initialized');
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

    let attempt = 0;
    while (attempt < this.retryAttempts) {
      try {
        console.log(`[Email Service] Sending ${type} email to: ${recipients} (attempt ${attempt + 1}/${this.retryAttempts})`);
        
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
        return true;
      } catch (error) {
        attempt++;
        console.error(`[Email Service] Failed to send email (attempt ${attempt}/${this.retryAttempts}):`, error);
        
        if (attempt < this.retryAttempts) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
        }
      }
    }

    console.error(`[Email Service] Failed to send ${type} email after ${this.retryAttempts} attempts`);
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
}

// Export singleton instance
export const emailService = new EmailService();
export default emailService;