import { storage } from "./storage";
import { type InsertSplitPaymentTemplate } from "@shared/schema";
import { randomBytes } from 'crypto';
import { reminderService } from './reminder-service';

// Generate secure payment token
function generateSecureToken(): string {
  return randomBytes(32).toString('hex');
}

// Format payment link URL
function formatPaymentLinkUrl(token: string): string {
  const baseUrl = process.env.PUBLIC_URL || `http://localhost:${process.env.PORT || 5000}`;
  return `${baseUrl}/payment/split/${token}`;
}

class SplitPaymentService {
  // Initialize default templates
  async initializeDefaultTemplates(): Promise<void> {
    const existingTemplates = await storage.getSplitPaymentTemplates();
    
    if (existingTemplates.length === 0) {
      // Create default templates
      const templates: InsertSplitPaymentTemplate[] = [
        {
          name: "Standard Callout Split",
          description: "Carrier pays callout fee, driver pays remaining balance",
          splitRules: [
            {
              payerType: "carrier",
              description: "Callout Fee",
              amount: 150,
              percentage: null,
              isRemainder: false
            },
            {
              payerType: "driver",
              description: "Labor + Parts",
              amount: null,
              percentage: null,
              isRemainder: true
            }
          ],
          serviceTypeIds: ["emergency"],
          conditions: { jobType: "emergency" },
          priority: 100,
          isActive: true,
          isDefault: true
        },
        {
          name: "Insurance Deductible Split",
          description: "Insurance pays total minus deductible, driver pays deductible",
          splitRules: [
            {
              payerType: "insurance",
              description: "Repair Cost (minus deductible)",
              amount: null,
              percentage: null,
              isRemainder: true,
              deductFrom: 500
            },
            {
              payerType: "driver",
              description: "Insurance Deductible",
              amount: 500,
              percentage: null,
              isRemainder: false
            }
          ],
          serviceTypeIds: ["emergency", "accident"],
          conditions: { hasInsurance: true },
          priority: 90,
          isActive: true,
          isDefault: false
        },
        {
          name: "50/50 Split",
          description: "Equal split between carrier and driver",
          splitRules: [
            {
              payerType: "carrier",
              description: "50% of total",
              amount: null,
              percentage: 50,
              isRemainder: false
            },
            {
              payerType: "driver",
              description: "50% of total",
              amount: null,
              percentage: 50,
              isRemainder: false
            }
          ],
          serviceTypeIds: ["scheduled"],
          conditions: { splitType: "equal" },
          priority: 80,
          isActive: true,
          isDefault: false
        },
        {
          name: "Fleet Maintenance Split",
          description: "Fleet pays labor and scheduled parts, driver pays emergency parts",
          splitRules: [
            {
              payerType: "fleet",
              description: "Labor + Scheduled Parts",
              amount: null,
              percentage: 70,
              isRemainder: false
            },
            {
              payerType: "driver",
              description: "Emergency Parts",
              amount: null,
              percentage: 30,
              isRemainder: false
            }
          ],
          serviceTypeIds: ["scheduled", "pm_service"],
          conditions: { isFleetVehicle: true },
          priority: 85,
          isActive: true,
          isDefault: false
        }
      ];

      for (const template of templates) {
        await storage.createSplitPaymentTemplate(template);
      }

      console.log('Default split payment templates initialized');
    }
  }

  // Create split payment for a job
  async createSplitPayment(jobId: string, templateId: string | null, customSplitRules?: any[]): Promise<any> {
    const job = await storage.getJob(jobId);
    if (!job) {
      throw new Error('Job not found');
    }

    let splitConfiguration;
    
    if (templateId) {
      const template = await storage.getSplitPaymentTemplates();
      const selectedTemplate = template.find(t => t.id === templateId);
      if (!selectedTemplate) {
        throw new Error('Template not found');
      }
      splitConfiguration = selectedTemplate.splitRules;
    } else if (customSplitRules) {
      splitConfiguration = customSplitRules;
    } else {
      // Use default template
      const defaultTemplate = await storage.getDefaultSplitPaymentTemplate();
      if (!defaultTemplate) {
        throw new Error('No default template found');
      }
      splitConfiguration = defaultTemplate.splitRules;
    }

    // Create split payment record
    const splitPayment = await storage.createSplitPayment({
      jobId,
      totalAmount: job.totalAmount || '0',
      splitConfiguration,
      templateId,
      status: 'pending'
    });

    // Calculate amounts for each payer
    const totalAmount = parseFloat(job.totalAmount || '0');
    const paymentSplits = [];
    let remainingAmount = totalAmount;

    for (const rule of splitConfiguration) {
      let amount = 0;
      
      if (rule.amount) {
        amount = rule.amount;
      } else if (rule.percentage) {
        amount = (totalAmount * rule.percentage) / 100;
      } else if (rule.isRemainder) {
        amount = remainingAmount;
      }

      if (rule.deductFrom) {
        amount = Math.max(0, totalAmount - rule.deductFrom);
      }

      remainingAmount -= amount;

      const token = generateSecureToken();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 48); // 48 hours expiration

      paymentSplits.push({
        splitPaymentId: splitPayment.id,
        jobId,
        payerType: rule.payerType,
        payerName: rule.payerName || rule.payerType,
        payerEmail: rule.payerEmail,
        payerPhone: rule.payerPhone,
        amountAssigned: amount.toFixed(2),
        description: rule.description,
        paymentToken: token,
        paymentLinkUrl: formatPaymentLinkUrl(token),
        tokenExpiresAt: expiresAt,
        status: 'pending'
      });
    }

    // Create payment split records
    const createdSplits = await storage.createPaymentSplits(paymentSplits);

    return {
      splitPayment,
      paymentSplits: createdSplits
    };
  }

  // Process payment for a split
  async processPaymentForSplit(token: string, paymentMethodId: string, paymentIntentId?: string): Promise<any> {
    const paymentSplit = await storage.getPaymentSplitByToken(token);
    
    if (!paymentSplit) {
      throw new Error('Invalid payment token');
    }

    if (paymentSplit.status !== 'pending') {
      throw new Error(`Payment already ${paymentSplit.status}`);
    }

    // Check token expiration
    if (paymentSplit.tokenExpiresAt && new Date() > paymentSplit.tokenExpiresAt) {
      throw new Error('Payment link has expired');
    }

    // Create transaction record
    const transaction = await storage.createTransaction({
      jobId: paymentSplit.jobId,
      userId: paymentSplit.payerId || 'guest',
      paymentMethodId,
      amount: paymentSplit.amountAssigned,
      status: 'completed',
      stripePaymentIntentId: paymentIntentId,
      processedAt: new Date(),
      metadata: {
        splitPaymentId: paymentSplit.splitPaymentId,
        paymentSplitId: paymentSplit.id,
        payerType: paymentSplit.payerType
      }
    });

    // Mark payment split as paid
    await storage.markPaymentSplitAsPaid(
      paymentSplit.id,
      transaction.id,
      parseFloat(paymentSplit.amountAssigned)
    );

    // Send confirmation notification
    if (paymentSplit.payerEmail || paymentSplit.payerPhone) {
      await this.sendPaymentConfirmation(paymentSplit);
    }

    // Check if all splits are paid
    const splitPayment = await storage.getSplitPayment(paymentSplit.splitPaymentId);
    if (splitPayment?.status === 'completed') {
      await this.sendFullPaymentNotification(splitPayment);
    }

    return {
      success: true,
      transaction,
      paymentSplit: await storage.getPaymentSplit(paymentSplit.id),
      splitPaymentStatus: splitPayment?.status
    };
  }

  // Send payment links to all payers
  async sendPaymentLinks(splitPaymentId: string): Promise<void> {
    const paymentSplits = await storage.getPaymentSplitsBySplitPaymentId(splitPaymentId);
    
    for (const split of paymentSplits) {
      if (split.status === 'pending' && (split.payerEmail || split.payerPhone)) {
        await this.sendPaymentLink(split);
      }
    }
  }

  // Send individual payment link
  async sendPaymentLink(paymentSplit: any): Promise<void> {
    const message = `TruckFixGo Payment Request

    Amount Due: $${paymentSplit.amountAssigned}
    Description: ${paymentSplit.description}
    
    Please complete your payment using this secure link:
    ${paymentSplit.paymentLinkUrl}
    
    This link will expire in 48 hours.`;

    if (paymentSplit.payerEmail) {
      await reminderService.sendEmail(
        paymentSplit.payerEmail,
        'Payment Required - TruckFixGo',
        message
      );
    }

    if (paymentSplit.payerPhone) {
      await reminderService.sendSMS(
        paymentSplit.payerPhone,
        message
      );
    }
  }

  // Send payment confirmation
  async sendPaymentConfirmation(paymentSplit: any): Promise<void> {
    const message = `Payment Confirmed

    Thank you for your payment of $${paymentSplit.amountPaid}.
    
    Description: ${paymentSplit.description}
    Payment Date: ${new Date().toLocaleString()}
    
    A receipt has been sent to your email.`;

    if (paymentSplit.payerEmail) {
      await reminderService.sendEmail(
        paymentSplit.payerEmail,
        'Payment Confirmation - TruckFixGo',
        message
      );
    }

    if (paymentSplit.payerPhone) {
      await reminderService.sendSMS(paymentSplit.payerPhone, message);
    }
  }

  // Send full payment notification
  async sendFullPaymentNotification(splitPayment: any): Promise<void> {
    const job = await storage.getJob(splitPayment.jobId);
    if (!job) return;

    const contractor = await storage.getContractorProfile(job.contractorId || '');
    if (!contractor) return;

    const user = await storage.getUser(contractor.userId);
    if (!user) return;

    const message = `Full Payment Received

    All payment portions for job #${job.jobNumber} have been collected.
    Total Amount: $${splitPayment.totalAmount}
    
    Payment is being processed and will be available in your account soon.`;

    if (user.email) {
      await reminderService.sendEmail(
        user.email,
        'Full Payment Received - TruckFixGo',
        message
      );
    }

    if (user.phone) {
      await reminderService.sendSMS(user.phone, message);
    }
  }

  // Send payment reminders for pending splits
  async sendPaymentReminders(): Promise<void> {
    const pendingSplits = await storage.getPendingPaymentSplits(100);
    const now = new Date();
    
    for (const split of pendingSplits) {
      // Send reminder if:
      // - Created more than 24 hours ago and no reminders sent
      // - Last reminder was more than 24 hours ago
      const createdHoursAgo = (now.getTime() - split.createdAt.getTime()) / (1000 * 60 * 60);
      const lastReminderHoursAgo = split.lastReminderAt ? 
        (now.getTime() - split.lastReminderAt.getTime()) / (1000 * 60 * 60) : 999;

      if ((createdHoursAgo > 24 && split.remindersSent === 0) || 
          (lastReminderHoursAgo > 24 && split.remindersSent < 3)) {
        
        await this.sendPaymentLink(split);
        
        // Update reminder tracking
        await storage.updatePaymentSplit(split.id, {
          remindersSent: split.remindersSent + 1,
          lastReminderAt: now,
          nextReminderAt: new Date(now.getTime() + 24 * 60 * 60 * 1000) // 24 hours later
        });
      }
    }
  }

  // Handle expired payment links
  async handleExpiredPaymentLinks(): Promise<void> {
    const expiredSplits = await storage.getExpiredPaymentSplits();
    
    for (const split of expiredSplits) {
      // Generate new token and extend expiration
      const newToken = generateSecureToken();
      const newExpiration = new Date();
      newExpiration.setHours(newExpiration.getHours() + 48);
      
      await storage.updatePaymentSplit(split.id, {
        paymentToken: newToken,
        paymentLinkUrl: formatPaymentLinkUrl(newToken),
        tokenExpiresAt: newExpiration
      });
      
      // Send new payment link
      const updatedSplit = await storage.getPaymentSplit(split.id);
      if (updatedSplit) {
        await this.sendPaymentLink(updatedSplit);
      }
    }
  }
}

// Export singleton instance
export const splitPaymentService = new SplitPaymentService();

// Initialize templates on startup
splitPaymentService.initializeDefaultTemplates().catch(console.error);

// Schedule reminder tasks
setInterval(() => {
  splitPaymentService.sendPaymentReminders().catch(console.error);
}, 60 * 60 * 1000); // Every hour

setInterval(() => {
  splitPaymentService.handleExpiredPaymentLinks().catch(console.error);
}, 2 * 60 * 60 * 1000); // Every 2 hours