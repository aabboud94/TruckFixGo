import { storage } from "./storage";
import { type InsertSplitPaymentTemplate, type InsertPaymentSplit } from "@shared/schema";
import { randomBytes } from 'crypto';
import { reminderService } from './reminder-service';
import stripeService from './stripe-service';

// Split payment types
export type SplitType = 'driver' | 'company' | 'fleet' | 'insurance';

export interface SplitRule {
  payerType: SplitType;
  payerId?: string;
  payerName?: string;
  payerEmail?: string;
  payerPhone?: string;
  amount?: number;
  percentage?: number;
  isRemainder?: boolean;
  deductFrom?: number;
  description?: string;
  minAmount?: number;
  maxAmount?: number;
  tier?: {
    ranges: Array<{ min: number; max: number; percentage: number }>;
  };
}

export interface SplitConfiguration {
  name: string;
  description?: string;
  splitRules: SplitRule[];
  conditions?: any;
  priority?: number;
  isActive?: boolean;
  isDefault?: boolean;
}

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

  // Create split payment configuration template
  async createSplitConfig(config: SplitConfiguration): Promise<any> {
    try {
      const template = await storage.createSplitPaymentTemplate({
        name: config.name,
        description: config.description,
        splitRules: config.splitRules,
        conditions: config.conditions,
        priority: config.priority || 50,
        isActive: config.isActive !== false,
        isDefault: config.isDefault || false,
        serviceTypeIds: config.conditions?.serviceTypes || [],
      });
      
      return {
        success: true,
        template
      };
    } catch (error) {
      console.error('Error creating split config:', error);
      throw error;
    }
  }

  // Apply split payment to a job
  async applySplitToJob(jobId: string, splitData: any): Promise<any> {
    try {
      const job = await storage.getJob(jobId);
      if (!job) {
        throw new Error('Job not found');
      }

      // Validate that splits add up to total
      const totalAmount = splitData.totalAmount || parseFloat(job.totalAmount || '0');
      const totalAssigned = splitData.splits.reduce((sum: number, split: any) => {
        if (split.amount) return sum + split.amount;
        if (split.percentage) return sum + (totalAmount * split.percentage / 100);
        return sum;
      }, 0);

      if (Math.abs(totalAmount - totalAssigned) > 0.01) {
        throw new Error(`Split amounts (${totalAssigned}) do not match total (${totalAmount})`);
      }

      // Create split payment record
      const splitPayment = await storage.createSplitPayment({
        jobId,
        totalAmount: totalAmount.toString(),
        splitConfiguration: splitData.splits,
        status: 'pending'
      });

      // Create individual payment splits
      const paymentSplits: InsertPaymentSplit[] = [];
      for (const split of splitData.splits) {
        const token = generateSecureToken();
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 48);

        const amount = split.amount || (totalAmount * split.percentage / 100);

        paymentSplits.push({
          splitPaymentId: splitPayment.id,
          jobId,
          payerId: split.payerId,
          payerType: split.type,
          payerName: split.payerName || split.type,
          payerEmail: split.payerEmail,
          payerPhone: split.payerPhone,
          amountAssigned: amount.toFixed(2),
          description: split.description || `${split.type} payment portion`,
          paymentToken: token,
          paymentLinkUrl: formatPaymentLinkUrl(token),
          tokenExpiresAt: expiresAt,
          status: 'pending'
        });
      }

      const createdSplits = await storage.createPaymentSplits(paymentSplits);

      // Apply split to job
      await storage.applySplitToJob(jobId, splitPayment.id);

      // Send payment links to all payers
      await this.sendPaymentLinks(splitPayment.id);

      return {
        success: true,
        splitPayment,
        paymentSplits: createdSplits,
        paymentLinks: createdSplits.map(s => ({
          payerId: s.payerId,
          payerType: s.payerType,
          amount: s.amountAssigned,
          paymentLink: s.paymentLinkUrl
        }))
      };
    } catch (error) {
      console.error('Error applying split to job:', error);
      throw error;
    }
  }

  // Process payment for a specific split
  async processSplitPaymentById(splitId: string, paymentData: any): Promise<any> {
    try {
      const splitStatus = await storage.getSplitStatus(splitId);
      if (!splitStatus) {
        throw new Error('Split payment not found');
      }

      // Find the pending split for this payment
      const pendingSplit = splitStatus.paymentSplits.find(
        (s: any) => s.status === 'pending' && s.payerId === paymentData.payerId
      );

      if (!pendingSplit) {
        throw new Error('No pending payment found for this payer');
      }

      // Process the payment through Stripe
      let paymentResult;
      if (paymentData.paymentMethodType === 'credit_card') {
        paymentResult = await stripeService.createPaymentIntent(
          parseFloat(pendingSplit.amountAssigned) * 100, // Convert to cents
          pendingSplit.jobId,
          { splitPaymentId: splitId, payerId: paymentData.payerId }
        );
      }

      // Mark the split as paid
      await storage.markPaymentSplitAsPaid(
        pendingSplit.id,
        paymentResult?.id || 'manual',
        parseFloat(pendingSplit.amountAssigned)
      );

      // Check if all splits are paid
      const updatedStatus = await storage.getSplitStatus(splitId);
      
      if (updatedStatus.allPaid) {
        // Update job payment status
        const job = await storage.getJob(splitStatus.splitPayment.jobId);
        if (job) {
          await storage.updateJob(job.id, { paymentStatus: 'completed' });
        }

        // Send full payment notification
        await this.sendFullPaymentNotification(updatedStatus.splitPayment);
      }

      return {
        success: true,
        paymentSplit: pendingSplit,
        splitPaymentStatus: updatedStatus.splitPayment.status,
        allPaid: updatedStatus.allPaid,
        remainingBalance: updatedStatus.remainingBalance
      };
    } catch (error) {
      console.error('Error processing split payment:', error);
      throw error;
    }
  }

  // Get comprehensive split payment status
  async getSplitPaymentStatus(splitId: string): Promise<any> {
    try {
      const status = await storage.getSplitStatus(splitId);
      if (!status) {
        throw new Error('Split payment not found');
      }

      // Get payment history
      const paymentHistory = await storage.getSplitPaymentHistory(splitId);

      // Get reconciliation status
      const reconciliation = await storage.reconcileSplits(splitId);

      return {
        ...status,
        paymentHistory,
        reconciliation,
        payerBreakdown: status.paymentSplits.map((s: any) => ({
          payerId: s.payerId,
          payerType: s.payerType,
          payerName: s.payerName,
          status: s.status,
          amountAssigned: parseFloat(s.amountAssigned),
          amountPaid: parseFloat(s.amountPaid || '0'),
          paidAt: s.paidAt,
          paymentLink: s.paymentLinkUrl,
          linkExpiry: s.tokenExpiresAt
        }))
      };
    } catch (error) {
      console.error('Error getting split payment status:', error);
      throw error;
    }
  }

  // Generate or retrieve payment link for a specific payer
  async getPaymentLinkForPayer(splitId: string, payerId: string): Promise<any> {
    try {
      const link = await storage.generatePaymentLink(splitId, payerId);
      if (!link) {
        throw new Error('Unable to generate payment link for this payer');
      }

      const splits = await storage.getPaymentSplitsBySplitPaymentId(splitId);
      const payerSplit = splits.find(s => s.payerId === payerId);

      if (!payerSplit) {
        throw new Error('Payer not found in this split payment');
      }

      return {
        payerId,
        payerType: payerSplit.payerType,
        payerName: payerSplit.payerName,
        amount: payerSplit.amountAssigned,
        status: payerSplit.status,
        paymentLink: link,
        expiresAt: payerSplit.tokenExpiresAt,
        description: payerSplit.description
      };
    } catch (error) {
      console.error('Error getting payment link:', error);
      throw error;
    }
  }

  // Handle webhook for payment confirmation
  async handlePaymentWebhook(webhookData: any): Promise<any> {
    try {
      const { paymentIntentId, splitPaymentId, payerId, status } = webhookData;

      if (status === 'succeeded') {
        // Find the payment split
        const splits = await storage.getPaymentSplitsBySplitPaymentId(splitPaymentId);
        const payerSplit = splits.find(s => s.payerId === payerId);

        if (payerSplit && payerSplit.status === 'pending') {
          // Mark as paid
          await storage.markPaymentSplitAsPaid(
            payerSplit.id,
            paymentIntentId,
            parseFloat(payerSplit.amountAssigned)
          );

          // Send confirmation
          await this.sendPaymentConfirmation(payerSplit);

          // Check if all splits are paid
          const status = await storage.getSplitStatus(splitPaymentId);
          if (status.allPaid) {
            // Update job status
            const job = await storage.getJob(status.splitPayment.jobId);
            if (job) {
              await storage.updateJob(job.id, { paymentStatus: 'completed' });
              await this.sendFullPaymentNotification(status.splitPayment);
            }
          }
        }
      } else if (status === 'failed') {
        // Handle failed payment
        const splits = await storage.getPaymentSplitsBySplitPaymentId(splitPaymentId);
        const payerSplit = splits.find(s => s.payerId === payerId);

        if (payerSplit) {
          await storage.updatePaymentSplit(payerSplit.id, {
            status: 'failed',
            lastAttemptAt: new Date(),
            failureReason: webhookData.failureReason
          });

          // Send failure notification
          const message = `Payment Failed
          
          Your payment of $${payerSplit.amountAssigned} could not be processed.
          Reason: ${webhookData.failureReason || 'Unknown error'}
          
          Please try again using your payment link:
          ${payerSplit.paymentLinkUrl}`;

          if (payerSplit.payerEmail) {
            await reminderService.sendEmail(
              payerSplit.payerEmail,
              'Payment Failed - TruckFixGo',
              message
            );
          }
        }
      }

      return { success: true, message: 'Webhook processed' };
    } catch (error) {
      console.error('Error handling payment webhook:', error);
      throw error;
    }
  }

  // Calculate split amounts based on rules
  calculateSplitAmounts(totalAmount: number, rules: SplitRule[]): any[] {
    const splits: any[] = [];
    let remainingAmount = totalAmount;

    for (const rule of rules) {
      let amount = 0;

      // Fixed amount
      if (rule.amount) {
        amount = Math.min(rule.amount, remainingAmount);
      } 
      // Percentage
      else if (rule.percentage) {
        amount = (totalAmount * rule.percentage) / 100;
      }
      // Tiered
      else if (rule.tier) {
        for (const range of rule.tier.ranges) {
          if (totalAmount >= range.min && totalAmount <= range.max) {
            amount = (totalAmount * range.percentage) / 100;
            break;
          }
        }
      }
      // Remainder
      else if (rule.isRemainder) {
        amount = remainingAmount;
      }

      // Apply deduction if specified
      if (rule.deductFrom) {
        amount = Math.max(0, totalAmount - rule.deductFrom);
      }

      // Apply min/max limits
      if (rule.minAmount) amount = Math.max(amount, rule.minAmount);
      if (rule.maxAmount) amount = Math.min(amount, rule.maxAmount);

      remainingAmount -= amount;

      splits.push({
        payerType: rule.payerType,
        payerId: rule.payerId,
        payerName: rule.payerName,
        payerEmail: rule.payerEmail,
        payerPhone: rule.payerPhone,
        amount: parseFloat(amount.toFixed(2)),
        description: rule.description
      });
    }

    return splits;
  }

  // Validate split configuration
  validateSplitConfiguration(config: SplitConfiguration): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.name) {
      errors.push('Configuration name is required');
    }

    if (!config.splitRules || config.splitRules.length === 0) {
      errors.push('At least one split rule is required');
    }

    let hasRemainder = false;
    let totalPercentage = 0;

    for (const rule of config.splitRules) {
      if (!rule.payerType) {
        errors.push('Payer type is required for all rules');
      }

      if (rule.percentage) {
        totalPercentage += rule.percentage;
      }

      if (rule.isRemainder) {
        if (hasRemainder) {
          errors.push('Only one rule can be marked as remainder');
        }
        hasRemainder = true;
      }
    }

    if (totalPercentage > 100) {
      errors.push(`Total percentage (${totalPercentage}%) exceeds 100%`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Handle refunds for split payments
  async refundSplitPayment(splitId: string, refundData: any): Promise<any> {
    try {
      const status = await storage.getSplitStatus(splitId);
      if (!status) {
        throw new Error('Split payment not found');
      }

      const refunds: any[] = [];

      // Process refunds for each paid split
      for (const split of status.paymentSplits) {
        if (split.status === 'paid' && split.transactionId) {
          const refundAmount = refundData.partial 
            ? (parseFloat(split.amountPaid) * refundData.percentage / 100)
            : parseFloat(split.amountPaid);

          // Create refund through Stripe
          const refund = await stripeService.createRefund(
            split.transactionId,
            refundAmount * 100 // Convert to cents
          );

          // Update split status
          await storage.updatePaymentSplit(split.id, {
            status: refundData.partial ? 'partially_refunded' : 'refunded',
            refundedAmount: refundAmount.toString(),
            refundedAt: new Date()
          });

          refunds.push({
            payerId: split.payerId,
            amount: refundAmount,
            refundId: refund.id
          });
        }
      }

      // Update split payment status
      await storage.updateSplitPayment(splitId, {
        status: refundData.partial ? 'partially_refunded' : 'refunded',
        refundDetails: refunds
      });

      return {
        success: true,
        refunds,
        message: `Refunded ${refunds.length} payment splits`
      };
    } catch (error) {
      console.error('Error refunding split payment:', error);
      throw error;
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