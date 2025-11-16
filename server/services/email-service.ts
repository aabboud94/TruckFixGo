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

  // Helper function to generate a base email template with consistent styling
  private getBaseEmailTemplate(content: string, preheader?: string): string {
    const appUrl = process.env.APP_URL || 'https://truckfixgo.com';
    
    return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>TruckFixGo</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <!--[if !mso]><!-->
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" type="text/css">
  <!--<![endif]-->
  <style type="text/css">
    /* Reset styles */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    
    /* Remove link styles */
    a[x-apple-data-detectors] {
      color: inherit !important;
      text-decoration: inherit !important;
      font-size: inherit !important;
      font-family: inherit !important;
      font-weight: inherit !important;
      line-height: inherit !important;
    }
    
    /* Mobile styles */
    @media only screen and (max-width: 600px) {
      .mobile-hide { display: none !important; }
      .mobile-center { text-align: center !important; }
      .mobile-full { width: 100% !important; max-width: 100% !important; }
      .mobile-padding { padding: 20px !important; }
      .mobile-padding-sm { padding: 10px !important; }
      h1 { font-size: 28px !important; line-height: 36px !important; }
      h2 { font-size: 22px !important; line-height: 28px !important; }
      h3 { font-size: 18px !important; line-height: 24px !important; }
      p { font-size: 15px !important; line-height: 24px !important; }
      .button-td { padding: 14px 28px !important; }
      .button-text { font-size: 16px !important; }
      .footer-text { font-size: 13px !important; line-height: 20px !important; }
      .card-padding { padding: 20px !important; }
      .container-padding { padding: 20px 20px !important; }
    }
    
    /* Dark mode styles */
    @media (prefers-color-scheme: dark) {
      .dark-bg { background-color: #1a1a1a !important; }
      .dark-text { color: #ffffff !important; }
      .dark-card { background-color: #2d2d2d !important; }
      .dark-border { border-color: #404040 !important; }
      .dark-highlight { background-color: #333333 !important; }
    }
    
    /* Button hover effect for supported clients */
    .button-primary:hover {
      background-color: #357abd !important;
    }
    
    .button-success:hover {
      background-color: #218838 !important;
    }
    
    .button-danger:hover {
      background-color: #c82333 !important;
    }
  </style>
</head>
<body style="margin: 0; padding: 0; word-spacing: normal; background-color: #f7f8fa;">
  ${preheader ? `<div style="display: none; font-size: 1px; color: #f7f8fa; line-height: 1px; max-height: 0; max-width: 0; opacity: 0; overflow: hidden; mso-hide: all; font-family: sans-serif;">${preheader}&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;</div>` : ''}
  
  <div role="article" aria-roledescription="email" lang="en" style="text-size-adjust: 100%; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0; padding: 0; background-color: #f7f8fa;" class="dark-bg">
      <tr>
        <td align="center" style="padding: 0;">
          <!--[if mso]>
          <table role="presentation" align="center" style="width: 600px;">
          <tr>
          <td>
          <![endif]-->
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto;" class="mobile-full">
            ${content}
          </table>
          <!--[if mso]>
          </td>
          </tr>
          </table>
          <![endif]-->
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
  }

  // Helper function for creating responsive buttons
  private getButtonHtml(text: string, url: string, variant: 'primary' | 'success' | 'danger' | 'secondary' = 'primary'): string {
    const colors = {
      primary: { bg: '#4a90e2', text: '#ffffff', hover: '#357abd' },
      success: { bg: '#28a745', text: '#ffffff', hover: '#218838' },
      danger: { bg: '#dc3545', text: '#ffffff', hover: '#c82333' },
      secondary: { bg: '#6c757d', text: '#ffffff', hover: '#5a6268' }
    };
    
    const color = colors[variant];
    
    return `<!--[if mso]>
    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${url}" style="height:44px;v-text-anchor:middle;width:200px;" arcsize="12%" stroke="f" fillcolor="${color.bg}">
      <w:anchorlock/>
      <center style="color:${color.text};font-family:Inter, Arial, sans-serif;font-size:16px;font-weight:600;">${text}</center>
    </v:roundrect>
    <![endif]-->
    <!--[if !mso]><!-->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
      <tr>
        <td style="border-radius: 6px; background-color: ${color.bg};" class="button-${variant}">
          <a href="${url}" target="_blank" style="display: inline-block; background-color: ${color.bg}; color: ${color.text}; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 600; line-height: 44px; text-align: center; text-decoration: none; min-width: 150px; padding: 0 30px; border-radius: 6px; mso-padding-alt: 0; box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08);" class="button-text">
            ${text}
          </a>
        </td>
      </tr>
    </table>
    <!--<![endif]-->`;
  }

  // Helper function for icon display
  private getIconHtml(icon: 'truck' | 'check' | 'clock' | 'alert' | 'star' | 'dollar' | 'location' | 'phone'): string {
    const icons = {
      truck: '&#128666;',
      check: '&#10003;',
      clock: '&#128337;',
      alert: '&#9888;',
      star: '&#11088;',
      dollar: '&#128176;',
      location: '&#128205;',
      phone: '&#128222;'
    };
    
    return `<span style="font-size: 20px; vertical-align: middle; margin-right: 8px;">${icons[icon]}</span>`;
  }

  private generateTemplate(type: EmailType, data: any): EmailTemplate {
    const appUrl = process.env.APP_URL || 'https://truckfixgo.com';
    
    switch (type) {
      case 'JOB_ASSIGNED_CONTRACTOR':
        const contractorContent = `
          <!-- Header -->
          <tr>
            <td style="padding: 0;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%);">
                <tr>
                  <td style="padding: 30px 40px; text-align: center;" class="mobile-padding">
                    <h1 style="margin: 0; color: #ffffff; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 32px; font-weight: 700; line-height: 40px;">
                      ${this.getIconHtml('truck')} TruckFixGo
                    </h1>
                    <p style="margin: 10px 0 0 0; color: #e3f2fd; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 24px;">
                      New Job Assignment
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 40px 20px;" class="container-padding">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <h2 style="margin: 0 0 20px; color: #1e3a5f; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 24px; font-weight: 600; line-height: 32px;">
                      Hello ${data.contractorName},
                    </h2>
                    <p style="margin: 0 0 30px; color: #4a5568; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 24px;">
                      Great news! You've been assigned a new job. Please review the details below and accept or decline as soon as possible.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Job Details Card -->
          <tr>
            <td style="padding: 0 40px 30px;" class="container-padding">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.08); overflow: hidden;">
                <tr>
                  <td style="padding: 0;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f7fafc; border-bottom: 1px solid #e2e8f0;">
                      <tr>
                        <td style="padding: 20px 30px;" class="card-padding">
                          <h3 style="margin: 0; color: #2d3748; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 600;">
                            ${this.getIconHtml('alert')} Job #${data.jobNumber}
                          </h3>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 25px 30px;" class="card-padding">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="padding-bottom: 15px;">
                          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                            <tr>
                              <td width="40%" style="padding: 0; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 500; color: #718096;">Customer:</td>
                              <td style="padding: 0; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; color: #2d3748; font-weight: 600;">${data.customerName}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 15px;">
                          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                            <tr>
                              <td width="40%" style="padding: 0; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 500; color: #718096;">${this.getIconHtml('location')} Location:</td>
                              <td style="padding: 0; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; color: #2d3748;">${data.address}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 15px;">
                          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                            <tr>
                              <td width="40%" style="padding: 0; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 500; color: #718096;">Service Type:</td>
                              <td style="padding: 0; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; color: #2d3748;">${data.serviceType}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 15px;">
                          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                            <tr>
                              <td width="40%" style="padding: 0; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 500; color: #718096;">Issue Description:</td>
                              <td style="padding: 0; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; color: #2d3748;">${data.issueDescription}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 40px 40px;" class="container-padding">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center">
                    ${this.getButtonHtml('View in Dashboard', `${appUrl}/contractor/dashboard`, 'primary')}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 0;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #1e3a5f;">
                <tr>
                  <td style="padding: 30px 40px; text-align: center;" class="mobile-padding">
                    <p style="margin: 0 0 10px; color: #e3f2fd; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; line-height: 20px;" class="footer-text">
                      Please respond to this job assignment promptly
                    </p>
                    <p style="margin: 0; color: #cbd5e0; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 12px; line-height: 18px;" class="footer-text">
                      © ${new Date().getFullYear()} TruckFixGo • Professional Truck Repair Services
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        `;
        
        return {
          subject: `🔧 New Job Assignment - #${data.jobNumber}`,
          html: this.getBaseEmailTemplate(contractorContent, `New job assignment #${data.jobNumber}`),
          text: `New Job Assignment - ${data.jobNumber}\n\nHello ${data.contractorName},\n\nYou have been assigned a new job!\n\nJob Details:\n- Customer: ${data.customerName}\n- Location: ${data.address}\n- Issue: ${data.issueDescription}\n- Service Type: ${data.serviceType}\n\nPlease accept or decline this job in your dashboard: ${appUrl}/contractor/dashboard\n\nThank you,\nTruckFixGo Team`
        };

      case 'JOB_ASSIGNED_CUSTOMER':
        const customerContent = `
          <!-- Header with gradient -->
          <tr>
            <td style="padding: 0;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: linear-gradient(135deg, #4a90e2 0%, #63a4ff 100%);">
                <tr>
                  <td style="padding: 30px 40px; text-align: center;" class="mobile-padding">
                    <h1 style="margin: 0; color: #ffffff; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 32px; font-weight: 700; line-height: 40px;">
                      ${this.getIconHtml('truck')} Help is On The Way!
                    </h1>
                    <p style="margin: 10px 0 0 0; color: #e3f2fd; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 24px;">
                      Your mechanic has been assigned
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Welcome Message -->
          <tr>
            <td style="padding: 40px 40px 20px;" class="container-padding">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <h2 style="margin: 0 0 20px; color: #2d3748; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 24px; font-weight: 600; line-height: 32px;">
                      Hello ${data.customerName},
                    </h2>
                    <p style="margin: 0 0 30px; color: #4a5568; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 24px;">
                      Good news! We've assigned a qualified mechanic to help you. They're preparing to head your way now.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Mechanic Info Card -->
          <tr>
            <td style="padding: 0 40px 30px;" class="container-padding">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.08); overflow: hidden;">
                <tr>
                  <td style="padding: 0;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); border-bottom: 2px solid #4a90e2;">
                      <tr>
                        <td style="padding: 20px 30px;" class="card-padding">
                          <h3 style="margin: 0; color: #2d3748; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 600;">
                            Your Assigned Mechanic
                          </h3>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 25px 30px;" class="card-padding">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="padding-bottom: 20px;">
                          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                            <tr>
                              <td width="40%" style="padding: 0; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 500; color: #718096;">Mechanic Name:</td>
                              <td style="padding: 0; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; color: #2d3748; font-weight: 600;">${data.contractorName}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 20px;">
                          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                            <tr>
                              <td width="40%" style="padding: 0; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 500; color: #718096;">Rating:</td>
                              <td style="padding: 0; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; color: #f59e0b; font-weight: 600;">
                                ${this.getIconHtml('star')} ${data.contractorRating}/5.0
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 20px;">
                          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                            <tr>
                              <td width="40%" style="padding: 0; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 500; color: #718096;">Jobs Completed:</td>
                              <td style="padding: 0; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; color: #2d3748;">${data.contractorTotalJobs} jobs</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top: 10px; border-top: 2px solid #e2e8f0;">
                          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                            <tr>
                              <td width="40%" style="padding-top: 20px; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 500; color: #718096;">${this.getIconHtml('clock')} Estimated Arrival:</td>
                              <td style="padding-top: 20px; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 18px; color: #28a745; font-weight: 700;">${data.eta || 'Within 45 minutes'}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Track Button -->
          <tr>
            <td style="padding: 0 40px 30px;" class="container-padding">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center">
                    ${this.getButtonHtml('Track Your Mechanic', `${appUrl}/tracking?jobId=${data.jobId}`, 'success')}
                    <p style="margin: 20px 0 0; color: #718096; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; line-height: 20px; text-align: center;">
                      You'll receive a notification when your mechanic is nearby
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Help Section -->
          <tr>
            <td style="padding: 0 40px 40px;" class="container-padding">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #edf2f7; border-radius: 8px;">
                <tr>
                  <td style="padding: 20px; text-align: center;">
                    <p style="margin: 0 0 10px; color: #4a5568; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; line-height: 20px;">
                      Need immediate assistance?
                    </p>
                    <p style="margin: 0; color: #2d3748; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 600;">
                      ${this.getIconHtml('phone')} Call 1-800-TRUCK-FIX
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 0;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #2d3748;">
                <tr>
                  <td style="padding: 30px 40px; text-align: center;" class="mobile-padding">
                    <p style="margin: 0 0 10px; color: #e2e8f0; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; line-height: 20px;" class="footer-text">
                      Thank you for choosing TruckFixGo
                    </p>
                    <p style="margin: 0; color: #a0aec0; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 12px; line-height: 18px;" class="footer-text">
                      © ${new Date().getFullYear()} TruckFixGo • Fast & Reliable Truck Repair
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        `;
        
        return {
          subject: '🚛 Help is on the way! Your mechanic has been assigned',
          html: this.getBaseEmailTemplate(customerContent, `Your mechanic ${data.contractorName} is on the way!`),
          text: `Help is on the way!\n\nHello ${data.customerName},\n\nGood news! We've assigned a qualified mechanic to help you.\n\nYour Mechanic:\n- Name: ${data.contractorName}\n- Rating: ${data.contractorRating} stars\n- Experience: ${data.contractorTotalJobs} completed jobs\n- ETA: ${data.eta || 'Within 45 minutes'}\n\nTrack your mechanic: ${appUrl}/tracking?jobId=${data.jobId}\n\nNeed help? Call 1-800-TRUCK-FIX\n\nThank you for choosing TruckFixGo!`
        };

      case 'JOB_UNASSIGNED_ADMIN':
        const adminContent = `
          <!-- Urgent Header -->
          <tr>
            <td style="padding: 0;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: linear-gradient(135deg, #dc3545 0%, #ff6b6b 100%);">
                <tr>
                  <td style="padding: 30px 40px; text-align: center;" class="mobile-padding">
                    <h1 style="margin: 0; color: #ffffff; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 32px; font-weight: 700; line-height: 40px;">
                      ${this.getIconHtml('alert')} URGENT: Unassigned Job
                    </h1>
                    <p style="margin: 10px 0 0 0; color: #ffe0e0; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 24px;">
                      Immediate attention required
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Alert Message -->
          <tr>
            <td style="padding: 40px 40px 20px;" class="container-padding">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #fff3cd; border: 2px solid #ffc107; border-radius: 8px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0; color: #856404; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 24px; font-weight: 600;">
                      This job has been waiting for ${data.minutesWaiting} minutes without assignment!
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Job Details -->
          <tr>
            <td style="padding: 0 40px 30px;" class="container-padding">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.08); overflow: hidden;">
                <tr>
                  <td style="padding: 0;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #fee2e2; border-bottom: 2px solid #dc3545;">
                      <tr>
                        <td style="padding: 20px 30px;" class="card-padding">
                          <h3 style="margin: 0; color: #991b1b; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 600;">
                            Job #${data.jobNumber}
                          </h3>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 25px 30px;" class="card-padding">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="padding-bottom: 15px;">
                          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                            <tr>
                              <td width="35%" style="padding: 0; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 600; color: #718096;">Created:</td>
                              <td style="padding: 0; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; color: #dc3545; font-weight: 600;">${data.createdAt}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 15px;">
                          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                            <tr>
                              <td width="35%" style="padding: 0; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 600; color: #718096;">Customer:</td>
                              <td style="padding: 0; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; color: #2d3748;">${data.customerName}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 15px;">
                          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                            <tr>
                              <td width="35%" style="padding: 0; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 600; color: #718096;">Location:</td>
                              <td style="padding: 0; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; color: #2d3748;">${data.address}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 0;">
                          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                            <tr>
                              <td width="35%" style="padding: 0; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 600; color: #718096;">Issue:</td>
                              <td style="padding: 0; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; color: #2d3748;">${data.issueDescription}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Action Button -->
          <tr>
            <td style="padding: 0 40px 40px;" class="container-padding">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center">
                    ${this.getButtonHtml('Assign Contractor Now', `${appUrl}/admin/jobs`, 'danger')}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 0;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #1a202c;">
                <tr>
                  <td style="padding: 30px 40px; text-align: center;" class="mobile-padding">
                    <p style="margin: 0; color: #e2e8f0; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; line-height: 20px;" class="footer-text">
                      This is an automated urgent notification from TruckFixGo Admin System
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        `;
        
        return {
          subject: `🚨 URGENT: Job #${data.jobNumber} needs assignment (${data.minutesWaiting} min waiting)`,
          html: this.getBaseEmailTemplate(adminContent, `Urgent: Job ${data.jobNumber} has been waiting ${data.minutesWaiting} minutes`),
          text: `URGENT: Unassigned Job Alert\n\nJob #${data.jobNumber} has been waiting for ${data.minutesWaiting} minutes without assignment!\n\nDetails:\n- Created: ${data.createdAt}\n- Customer: ${data.customerName}\n- Location: ${data.address}\n- Issue: ${data.issueDescription}\n\nPlease assign a contractor immediately: ${appUrl}/admin/jobs\n\nTruckFixGo Admin System`
        };

      case 'JOB_PENDING_CUSTOMER':
        const pendingContent = `
          <!-- Header -->
          <tr>
            <td style="padding: 0;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                <tr>
                  <td style="padding: 30px 40px; text-align: center;" class="mobile-padding">
                    <h1 style="margin: 0; color: #ffffff; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 32px; font-weight: 700; line-height: 40px;">
                      ${this.getIconHtml('clock')} We're On It!
                    </h1>
                    <p style="margin: 10px 0 0 0; color: #e9d5ff; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 24px;">
                      Finding the best mechanic for you
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 40px 20px;" class="container-padding">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <h2 style="margin: 0 0 20px; color: #2d3748; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 24px; font-weight: 600; line-height: 32px;">
                      Hello ${data.customerName},
                    </h2>
                    <p style="margin: 0 0 30px; color: #4a5568; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 24px;">
                      Thank you for your patience. We're actively searching for the best available mechanic in your area to handle your request.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Status Card -->
          <tr>
            <td style="padding: 0 40px 30px;" class="container-padding">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.08); overflow: hidden;">
                <tr>
                  <td style="padding: 0;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%); border-bottom: 2px solid #667eea;">
                      <tr>
                        <td style="padding: 20px 30px;" class="card-padding">
                          <h3 style="margin: 0; color: #4338ca; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 600;">
                            Current Status
                          </h3>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 25px 30px;" class="card-padding">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="padding-bottom: 20px;">
                          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                            <tr>
                              <td width="40%" style="padding: 0; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 500; color: #718096;">Job Number:</td>
                              <td style="padding: 0; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; color: #2d3748; font-weight: 600;">#${data.jobNumber}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 20px;">
                          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                            <tr>
                              <td width="40%" style="padding: 0; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 500; color: #718096;">Status:</td>
                              <td style="padding: 0;">
                                <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                  <tr>
                                    <td style="background-color: #fbbf24; color: #78350f; padding: 4px 12px; border-radius: 4px; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 600;">
                                      Finding Mechanic
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                            <tr>
                              <td width="40%" style="padding: 0; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 500; color: #718096;">Expected Time:</td>
                              <td style="padding: 0; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; color: #059669; font-weight: 600;">Within 10 minutes</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Next Steps -->
          <tr>
            <td style="padding: 0 40px 30px;" class="container-padding">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <h3 style="margin: 0 0 15px; color: #2d3748; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 600;">
                      What happens next?
                    </h3>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="padding: 0 0 10px 0;">
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                            <tr>
                              <td style="padding: 0; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; color: #4a5568;">
                                ${this.getIconHtml('check')} We're matching you with qualified mechanics
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 0 0 10px 0;">
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                            <tr>
                              <td style="padding: 0; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; color: #4a5568;">
                                ${this.getIconHtml('check')} You'll receive an email once assigned
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 0;">
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                            <tr>
                              <td style="padding: 0; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; color: #4a5568;">
                                ${this.getIconHtml('check')} You can track your mechanic in real-time
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Help Section -->
          <tr>
            <td style="padding: 0 40px 40px;" class="container-padding">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f3f4f6; border-radius: 8px;">
                <tr>
                  <td style="padding: 20px; text-align: center;">
                    <p style="margin: 0 0 10px; color: #4a5568; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; line-height: 20px;">
                      Need immediate assistance?
                    </p>
                    <p style="margin: 0; color: #2d3748; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 600;">
                      ${this.getIconHtml('phone')} Call 1-800-TRUCK-FIX
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 0;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #4338ca;">
                <tr>
                  <td style="padding: 30px 40px; text-align: center;" class="mobile-padding">
                    <p style="margin: 0 0 10px; color: #e0e7ff; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; line-height: 20px;" class="footer-text">
                      We appreciate your patience while we find the best help
                    </p>
                    <p style="margin: 0; color: #c7d2fe; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 12px; line-height: 18px;" class="footer-text">
                      © ${new Date().getFullYear()} TruckFixGo • Your Trusted Repair Partner
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        `;
        
        return {
          subject: '🔍 We\'re finding a mechanic for you - Job #' + data.jobNumber,
          html: this.getBaseEmailTemplate(pendingContent, `We're actively searching for a mechanic for job #${data.jobNumber}`),
          text: `We're finding a mechanic for you\n\nHello ${data.customerName},\n\nThank you for your patience. We're currently finding the best available mechanic for your needs.\n\nStatus:\n- Job Number: #${data.jobNumber}\n- Current Status: Finding a mechanic\n- Expected Assignment: Within the next 10 minutes\n\nWhat happens next:\n✓ We're matching you with qualified mechanics\n✓ You'll receive an email once assigned\n✓ You can track your mechanic in real-time\n\nNeed immediate help? Call 1-800-TRUCK-FIX\n\nThank you,\nTruckFixGo Team`
        };

      case 'JOB_COMPLETED':
        const completedContent = `
          <!-- Header -->
          <tr>
            <td style="padding: 0;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: linear-gradient(135deg, #10b981 0%, #34d399 100%);">
                <tr>
                  <td style="padding: 30px 40px; text-align: center;" class="mobile-padding">
                    <h1 style="margin: 0; color: #ffffff; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 32px; font-weight: 700; line-height: 40px;">
                      ${this.getIconHtml('check')} Job Completed Successfully!
                    </h1>
                    <p style="margin: 10px 0 0 0; color: #d1fae5; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 24px;">
                      Your service has been completed
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Thank You Message -->
          <tr>
            <td style="padding: 40px 40px 20px;" class="container-padding">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <h2 style="margin: 0 0 20px; color: #2d3748; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 24px; font-weight: 600; line-height: 32px;">
                      Hello ${data.customerName},
                    </h2>
                    <p style="margin: 0 0 30px; color: #4a5568; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 24px;">
                      Thank you for choosing TruckFixGo! Your service has been completed successfully. Below is your service summary and invoice details.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Invoice Card -->
          <tr>
            <td style="padding: 0 40px 30px;" class="container-padding">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
                <tr>
                  <td style="padding: 0;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #1e3a5f;">
                      <tr>
                        <td style="padding: 20px 30px;" class="card-padding">
                          <h3 style="margin: 0; color: #ffffff; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 20px; font-weight: 600;">
                            Service Invoice
                          </h3>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 25px 30px;" class="card-padding">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="padding-bottom: 20px;">
                          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                            <tr>
                              <td style="padding: 0;">
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                  <tr>
                                    <td width="50%" style="padding: 0; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 12px; color: #718096; text-transform: uppercase; letter-spacing: 0.5px;">Job Number</td>
                                    <td width="50%" style="padding: 0; text-align: right; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 12px; color: #718096; text-transform: uppercase; letter-spacing: 0.5px;">Completion Date</td>
                                  </tr>
                                  <tr>
                                    <td style="padding: 5px 0 0 0; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; color: #2d3748; font-weight: 600;">#${data.jobNumber}</td>
                                    <td style="padding: 5px 0 0 0; text-align: right; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; color: #2d3748; font-weight: 600;">${data.completionDate}</td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 20px 0; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0;">
                          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                            <tr>
                              <td style="padding-bottom: 12px;">
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                  <tr>
                                    <td style="padding: 0; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; color: #4a5568;">Service Performed:</td>
                                    <td style="padding: 0; text-align: right; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; color: #2d3748; font-weight: 600;">${data.serviceType}</td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding-bottom: 12px;">
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                  <tr>
                                    <td style="padding: 0; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; color: #4a5568;">Labor:</td>
                                    <td style="padding: 0; text-align: right; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; color: #2d3748;">$${data.laborCost || '0.00'}</td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding-bottom: 12px;">
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                  <tr>
                                    <td style="padding: 0; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; color: #4a5568;">Parts:</td>
                                    <td style="padding: 0; text-align: right; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; color: #2d3748;">$${data.partsCost || '0.00'}</td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td>
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                  <tr>
                                    <td style="padding: 0; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; color: #4a5568;">Service Fee:</td>
                                    <td style="padding: 0; text-align: right; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; color: #2d3748;">$${data.serviceFee || '0.00'}</td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top: 20px;">
                          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f7fafc; border-radius: 6px;">
                            <tr>
                              <td style="padding: 15px 20px;">
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                  <tr>
                                    <td style="padding: 0; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 18px; color: #2d3748; font-weight: 700;">Total Paid:</td>
                                    <td style="padding: 0; text-align: right; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 24px; color: #10b981; font-weight: 700;">$${data.totalAmount}</td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Rate Your Experience -->
          <tr>
            <td style="padding: 0 40px 40px;" class="container-padding">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center">
                    <h3 style="margin: 0 0 20px; color: #2d3748; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 600; text-align: center;">
                      How was your experience?
                    </h3>
                    ${this.getButtonHtml('Rate Your Service', `${appUrl}/jobs?review=${data.jobId}`, 'primary')}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 0;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #2d3748;">
                <tr>
                  <td style="padding: 30px 40px; text-align: center;" class="mobile-padding">
                    <p style="margin: 0 0 10px; color: #e2e8f0; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; line-height: 20px;" class="footer-text">
                      Thank you for choosing TruckFixGo!
                    </p>
                    <p style="margin: 0; color: #a0aec0; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 12px; line-height: 18px;" class="footer-text">
                      © ${new Date().getFullYear()} TruckFixGo • Your Trusted Repair Partner
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        `;
        
        return {
          subject: `✅ Service Completed - Invoice #${data.jobNumber}`,
          html: this.getBaseEmailTemplate(completedContent, `Service completed successfully - Total: $${data.totalAmount}`),
          text: `Job Completed Successfully!\n\nHello ${data.customerName},\n\nYour service has been completed successfully.\n\nInvoice Details:\n- Job Number: #${data.jobNumber}\n- Completion Date: ${data.completionDate}\n- Service: ${data.serviceType}\n- Total Paid: $${data.totalAmount}\n\nPlease rate your experience: ${appUrl}/jobs?review=${data.jobId}\n\nThank you for choosing TruckFixGo!`
        };

      case 'WELCOME_CONTRACTOR':
        const welcomeContent = `
          <!-- Header -->
          <tr>
            <td style="padding: 0;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%);">
                <tr>
                  <td style="padding: 40px 40px;" class="mobile-padding">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td align="center">
                          <h1 style="margin: 0 0 10px; color: #ffffff; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 36px; font-weight: 700; line-height: 44px;">
                            Welcome to TruckFixGo!
                          </h1>
                          <p style="margin: 0; color: #e3f2fd; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 18px; line-height: 26px;">
                            Your contractor account has been approved
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Welcome Message -->
          <tr>
            <td style="padding: 40px 40px 20px;" class="container-padding">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <h2 style="margin: 0 0 20px; color: #2d3748; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 24px; font-weight: 600; line-height: 32px;">
                      Hello ${data.contractorName},
                    </h2>
                    <p style="margin: 0 0 30px; color: #4a5568; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 24px;">
                      Congratulations! You're now an approved TruckFixGo contractor. We're excited to have you join our network of professional mechanics.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Getting Started Steps -->
          <tr>
            <td style="padding: 0 40px 30px;" class="container-padding">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.08); overflow: hidden;">
                <tr>
                  <td style="padding: 0;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f7fafc; border-bottom: 1px solid #e2e8f0;">
                      <tr>
                        <td style="padding: 20px 30px;" class="card-padding">
                          <h3 style="margin: 0; color: #2d3748; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 600;">
                            🚀 Getting Started
                          </h3>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 25px 30px;" class="card-padding">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="padding-bottom: 20px;">
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                            <tr>
                              <td style="padding: 0 15px 0 0; vertical-align: top; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 20px; color: #4a90e2; font-weight: 700;">1.</td>
                              <td style="padding: 0;">
                                <h4 style="margin: 0 0 5px; color: #2d3748; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 600;">Complete Your Profile</h4>
                                <p style="margin: 0; color: #4a5568; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; line-height: 20px;">Add your service areas, specialties, and availability</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 20px;">
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                            <tr>
                              <td style="padding: 0 15px 0 0; vertical-align: top; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 20px; color: #4a90e2; font-weight: 700;">2.</td>
                              <td style="padding: 0;">
                                <h4 style="margin: 0 0 5px; color: #2d3748; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 600;">Set Your Availability</h4>
                                <p style="margin: 0; color: #4a5568; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; line-height: 20px;">Let us know when you're available to receive job requests</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 0;">
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                            <tr>
                              <td style="padding: 0 15px 0 0; vertical-align: top; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 20px; color: #4a90e2; font-weight: 700;">3.</td>
                              <td style="padding: 0;">
                                <h4 style="margin: 0 0 5px; color: #2d3748; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 600;">Start Accepting Jobs</h4>
                                <p style="margin: 0; color: #4a5568; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; line-height: 20px;">You'll receive notifications when new jobs match your criteria</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Login Credentials -->
          <tr>
            <td style="padding: 0 40px 30px;" class="container-padding">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #e0f2fe; border: 2px solid #0ea5e9; border-radius: 8px;">
                <tr>
                  <td style="padding: 20px; text-align: center;">
                    <h3 style="margin: 0 0 15px; color: #0c4a6e; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 600;">
                      Your Login Credentials
                    </h3>
                    <p style="margin: 0 0 5px; color: #0c4a6e; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px;">
                      <strong>Email:</strong> ${data.email}
                    </p>
                    <p style="margin: 0; color: #0c4a6e; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px;">
                      <strong>Password:</strong> ${data.temporaryPassword || 'Use the password you created'}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 40px 40px;" class="container-padding">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center">
                    ${this.getButtonHtml('Go to Dashboard', `${appUrl}/contractor/dashboard`, 'primary')}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 0;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #1e3a5f;">
                <tr>
                  <td style="padding: 30px 40px; text-align: center;" class="mobile-padding">
                    <p style="margin: 0 0 10px; color: #e3f2fd; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; line-height: 20px;" class="footer-text">
                      Welcome to the TruckFixGo contractor network!
                    </p>
                    <p style="margin: 0; color: #cbd5e0; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 12px; line-height: 18px;" class="footer-text">
                      © ${new Date().getFullYear()} TruckFixGo • Professional Truck Repair Services
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        `;
        
        return {
          subject: '🎉 Welcome to TruckFixGo - Your Account is Approved!',
          html: this.getBaseEmailTemplate(welcomeContent, `Welcome to TruckFixGo! Start accepting jobs today.`),
          text: `Welcome to TruckFixGo!\n\nHello ${data.contractorName},\n\nCongratulations! You're now an approved TruckFixGo contractor.\n\nGetting Started:\n1. Complete Your Profile - Add your service areas and specialties\n2. Set Your Availability - Let us know when you can receive jobs\n3. Start Accepting Jobs - You'll receive notifications for matching jobs\n\nYour Login Credentials:\nEmail: ${data.email}\nPassword: ${data.temporaryPassword || 'Use the password you created'}\n\nAccess your dashboard: ${appUrl}/contractor/dashboard\n\nWelcome to the team!\nTruckFixGo`
        };

      default:
        return {
          subject: 'TruckFixGo Notification',
          html: this.getBaseEmailTemplate('<tr><td style="padding: 40px; text-align: center;"><p>Notification from TruckFixGo</p></td></tr>', 'TruckFixGo Notification'),
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
  
  // Send custom email for bulk operations
  async sendCustomEmail(to: string, subject: string, message: string, data?: any): Promise<boolean> {
    if (!this.transporter) {
      console.error('[Email Service] Transporter not initialized, cannot send email');
      return false;
    }
    
    // Build HTML template
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1e3a5f; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
          .content { padding: 20px; background: #f9f9f9; border: 1px solid #ddd; border-top: none; }
          .footer { padding: 10px; background: #333; color: white; text-align: center; font-size: 12px; border-radius: 0 0 5px 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>TruckFixGo - Admin Notification</h2>
          </div>
          <div class="content">
            <p>Hello ${data?.userName || data?.contractorName || 'there'},</p>
            ${message.split('\n').map(line => `<p>${line}</p>`).join('')}
            ${data?.companyName ? `<p><strong>Company:</strong> ${data.companyName}</p>` : ''}
            <p style="margin-top: 20px;">Best regards,<br>TruckFixGo Team</p>
          </div>
          <div class="footer">
            This email was sent by ${data?.performedBy || 'TruckFixGo Admin'} on ${new Date().toLocaleDateString()}
          </div>
        </div>
      </body>
      </html>
    `;
    
    try {
      await this.transporter.sendMail({
        from: process.env.OFFICE365_EMAIL,
        to,
        subject: `[TruckFixGo] ${subject}`,
        html,
        text: message
      });
      
      console.log(`[Email Service] Custom email sent successfully to ${to}`);
      return true;
    } catch (error) {
      console.error('[Email Service] Failed to send custom email:', error);
      return false;
    }
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