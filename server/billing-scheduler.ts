import cron from 'node-cron';
import { storage } from './storage';
import stripeService from './stripe-service';
import type { BillingSubscription, BillingHistory } from '@shared/schema';

class BillingScheduler {
  private jobs: Map<string, cron.ScheduledTask> = new Map();

  /**
   * Initialize all billing-related cron jobs
   */
  public initialize() {
    console.log('Initializing billing scheduler...');

    // Daily billing processing at 2:00 AM
    this.scheduleDailyBillingProcessing();

    // Failed payment retry job - runs every 6 hours
    this.scheduleFailedPaymentRetries();

    // Usage alert check - runs every day at 10:00 AM
    this.scheduleUsageAlertCheck();

    // Invoice generation - runs on the 1st of each month
    this.scheduleMonthlyInvoiceGeneration();

    // Card expiration check - runs weekly on Mondays
    this.scheduleCardExpirationCheck();

    // Trial expiration reminders - runs daily at 9:00 AM
    this.scheduleTrialExpirationReminders();

    console.log('Billing scheduler initialized successfully');
  }

  /**
   * Daily billing processing - Process due subscriptions
   */
  private scheduleDailyBillingProcessing() {
    const job = cron.schedule('0 2 * * *', async () => {
      console.log('Running daily billing processing...');
      
      try {
        // Get all subscriptions due for billing today
        const dueSubscriptions = await storage.getSubscriptionsDueForBilling();
        
        for (const subscription of dueSubscriptions) {
          await this.processSubscriptionBilling(subscription);
        }
        
        console.log(`Processed ${dueSubscriptions.length} subscriptions`);
      } catch (error) {
        console.error('Error in daily billing processing:', error);
      }
    });

    this.jobs.set('daily-billing', job);
    job.start();
  }

  /**
   * Process billing for a single subscription
   */
  private async processSubscriptionBilling(subscription: BillingSubscription) {
    try {
      console.log(`Processing billing for subscription ${subscription.id}`);

      // Skip if subscription is not active
      if (subscription.status !== 'active') {
        console.log(`Skipping inactive subscription ${subscription.id}`);
        return;
      }

      // Get current usage for the billing period
      const usage = await storage.getCurrentBillingUsage(subscription.id);
      
      // Calculate total amount including overages
      let totalAmount = parseFloat(subscription.baseAmount);
      
      if (usage) {
        // Calculate overage charges
        const vehicleOverage = Math.max(0, usage.vehiclesUsed - subscription.maxVehicles);
        const repairOverage = Math.max(0, usage.emergencyRepairsUsed - subscription.includedEmergencyRepairs);
        const serviceOverage = Math.max(0, usage.scheduledServicesUsed - subscription.includedScheduledServices);
        
        // Add overage charges ($50 per vehicle, $75 per service)
        totalAmount += vehicleOverage * 50;
        totalAmount += (repairOverage + serviceOverage) * 75;
      }

      // Process payment via Stripe
      if (subscription.stripeSubscriptionId) {
        const invoice = await stripeService.processRecurringCharge(subscription.stripeSubscriptionId);
        
        // Create billing history record
        const billingHistory = await storage.createBillingHistory({
          subscriptionId: subscription.id,
          fleetAccountId: subscription.fleetAccountId,
          billingPeriodStart: subscription.currentPeriodStart || new Date(),
          billingPeriodEnd: subscription.nextBillingDate,
          billingDate: new Date(),
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          baseAmount: subscription.baseAmount,
          overageCharges: (totalAmount - parseFloat(subscription.baseAmount)).toString(),
          totalAmount: totalAmount.toString(),
          stripeInvoiceId: invoice.id,
          stripeChargeId: invoice.charge as string,
          status: invoice.paid ? 'success' : 'pending',
          paymentAttempts: 1,
          lastPaymentAttempt: new Date(),
        });

        // Update subscription next billing date
        const nextBillingDate = new Date(subscription.nextBillingDate);
        if (subscription.billingCycle === 'monthly') {
          nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
        } else if (subscription.billingCycle === 'quarterly') {
          nextBillingDate.setMonth(nextBillingDate.getMonth() + 3);
        } else if (subscription.billingCycle === 'annual') {
          nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
        }

        await storage.updateBillingSubscription(subscription.id, {
          nextBillingDate,
          currentPeriodStart: subscription.nextBillingDate,
          currentPeriodEnd: nextBillingDate,
        });

        // Reset usage tracking for new period
        await storage.createBillingUsageTracking({
          subscriptionId: subscription.id,
          fleetAccountId: subscription.fleetAccountId,
          periodStart: subscription.nextBillingDate,
          periodEnd: nextBillingDate,
        });

        // Send payment confirmation email
        await this.sendPaymentConfirmation(subscription, billingHistory, invoice.paid);
      }
    } catch (error) {
      console.error(`Error processing billing for subscription ${subscription.id}:`, error);
      
      // Create failed billing history record
      await storage.createBillingHistory({
        subscriptionId: subscription.id,
        fleetAccountId: subscription.fleetAccountId,
        billingPeriodStart: subscription.currentPeriodStart || new Date(),
        billingPeriodEnd: subscription.nextBillingDate,
        billingDate: new Date(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        baseAmount: subscription.baseAmount,
        totalAmount: subscription.baseAmount,
        status: 'failed',
        failureReason: error instanceof Error ? error.message : 'Unknown error',
        paymentAttempts: 1,
        lastPaymentAttempt: new Date(),
      });
    }
  }

  /**
   * Retry failed payments
   */
  private scheduleFailedPaymentRetries() {
    const job = cron.schedule('0 */6 * * *', async () => {
      console.log('Running failed payment retry job...');
      
      try {
        const failedPayments = await storage.getFailedPayments();
        
        for (const payment of failedPayments) {
          // Skip if already retried 3 times
          if (payment.paymentAttempts >= 3) {
            continue;
          }

          // Skip if last attempt was less than 24 hours ago
          const hoursSinceLastAttempt = 
            (Date.now() - new Date(payment.lastPaymentAttempt!).getTime()) / (1000 * 60 * 60);
          if (hoursSinceLastAttempt < 24) {
            continue;
          }

          await this.retryFailedPayment(payment);
        }
      } catch (error) {
        console.error('Error in failed payment retry job:', error);
      }
    });

    this.jobs.set('failed-payment-retry', job);
    job.start();
  }

  /**
   * Retry a failed payment
   */
  private async retryFailedPayment(billingHistory: BillingHistory) {
    try {
      if (!billingHistory.stripeInvoiceId) return;

      const invoice = await stripeService.retryFailedPayment(billingHistory.stripeInvoiceId);
      
      await storage.updateBillingHistory(billingHistory.id, {
        status: invoice.paid ? 'success' : 'failed',
        paymentAttempts: billingHistory.paymentAttempts + 1,
        lastPaymentAttempt: new Date(),
        paidAt: invoice.paid ? new Date() : undefined,
        failureReason: invoice.last_finalization_error?.message,
      });

      // Send notification based on result
      if (invoice.paid) {
        await this.sendPaymentSuccessNotification(billingHistory);
      } else if (billingHistory.paymentAttempts + 1 >= 3) {
        await this.sendFinalPaymentFailureNotification(billingHistory);
      }
    } catch (error) {
      console.error(`Error retrying payment for billing history ${billingHistory.id}:`, error);
    }
  }

  /**
   * Check usage alerts
   */
  private scheduleUsageAlertCheck() {
    const job = cron.schedule('0 10 * * *', async () => {
      console.log('Running usage alert check...');
      
      try {
        const activeSubscriptions = await storage.getAllActiveSubscriptions();
        
        for (const subscription of activeSubscriptions) {
          const usage = await storage.getCurrentBillingUsage(subscription.id);
          if (!usage) continue;

          const alerts: string[] = [];

          // Check vehicle usage
          if (subscription.maxVehicles !== 999999) {
            const vehicleUsagePercent = (usage.vehiclesUsed / subscription.maxVehicles) * 100;
            if (vehicleUsagePercent >= 100) {
              alerts.push(`Vehicle limit exceeded: ${usage.vehiclesUsed}/${subscription.maxVehicles}`);
            } else if (vehicleUsagePercent >= 90) {
              alerts.push(`90% of vehicle limit used: ${usage.vehiclesUsed}/${subscription.maxVehicles}`);
            } else if (vehicleUsagePercent >= 80) {
              alerts.push(`80% of vehicle limit used: ${usage.vehiclesUsed}/${subscription.maxVehicles}`);
            }
          }

          // Check emergency repairs usage
          if (subscription.includedEmergencyRepairs !== 999999) {
            const repairUsagePercent = (usage.emergencyRepairsUsed / subscription.includedEmergencyRepairs) * 100;
            if (repairUsagePercent >= 100) {
              alerts.push(`Emergency repair limit exceeded: ${usage.emergencyRepairsUsed}/${subscription.includedEmergencyRepairs}`);
            } else if (repairUsagePercent >= 90) {
              alerts.push(`90% of emergency repairs used: ${usage.emergencyRepairsUsed}/${subscription.includedEmergencyRepairs}`);
            }
          }

          // Check scheduled services usage
          if (subscription.includedScheduledServices !== 999999) {
            const serviceUsagePercent = (usage.scheduledServicesUsed / subscription.includedScheduledServices) * 100;
            if (serviceUsagePercent >= 100) {
              alerts.push(`Scheduled service limit exceeded: ${usage.scheduledServicesUsed}/${subscription.includedScheduledServices}`);
            } else if (serviceUsagePercent >= 90) {
              alerts.push(`90% of scheduled services used: ${usage.scheduledServicesUsed}/${subscription.includedScheduledServices}`);
            }
          }

          // Send alerts if any
          if (alerts.length > 0) {
            await this.sendUsageAlerts(subscription, alerts);
          }
        }
      } catch (error) {
        console.error('Error in usage alert check:', error);
      }
    });

    this.jobs.set('usage-alert-check', job);
    job.start();
  }

  /**
   * Generate monthly invoices
   */
  private scheduleMonthlyInvoiceGeneration() {
    const job = cron.schedule('0 0 1 * *', async () => {
      console.log('Running monthly invoice generation...');
      
      try {
        // Get all billing history for the previous month
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);

        const billingHistories = await storage.getBillingHistoryByDateRange(startDate, endDate);
        
        for (const history of billingHistories) {
          if (history.status === 'success' && !history.invoiceUrl) {
            // Generate invoice PDF
            const invoiceUrl = await this.generateInvoicePDF(history);
            
            // Update billing history with invoice URL
            await storage.updateBillingHistory(history.id, {
              invoiceUrl,
              invoiceGeneratedAt: new Date(),
            });

            // Send invoice email
            await this.sendInvoiceEmail(history, invoiceUrl);
          }
        }
      } catch (error) {
        console.error('Error in monthly invoice generation:', error);
      }
    });

    this.jobs.set('monthly-invoice-generation', job);
    job.start();
  }

  /**
   * Check for expiring payment methods
   */
  private scheduleCardExpirationCheck() {
    const job = cron.schedule('0 9 * * 1', async () => {
      console.log('Running card expiration check...');
      
      try {
        const activeSubscriptions = await storage.getAllActiveSubscriptions();
        
        for (const subscription of activeSubscriptions) {
          if (subscription.stripeCustomerId) {
            // Check payment method expiration via Stripe
            const paymentMethods = await stripeService.getCustomerPaymentMethods(subscription.stripeCustomerId);
            
            for (const pm of paymentMethods) {
              if (pm.card) {
                const expiryDate = new Date(pm.card.exp_year, pm.card.exp_month - 1);
                const daysUntilExpiry = Math.floor((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                
                if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
                  await this.sendCardExpirationWarning(subscription, daysUntilExpiry);
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Error in card expiration check:', error);
      }
    });

    this.jobs.set('card-expiration-check', job);
    job.start();
  }

  /**
   * Send trial expiration reminders
   */
  private scheduleTrialExpirationReminders() {
    const job = cron.schedule('0 9 * * *', async () => {
      console.log('Running trial expiration reminders...');
      
      try {
        const trialingSubscriptions = await storage.getTrialingSubscriptions();
        
        for (const subscription of trialingSubscriptions) {
          if (subscription.trialEndDate) {
            const daysUntilEnd = Math.floor(
              (new Date(subscription.trialEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            );
            
            // Send reminders at 7, 3, and 1 day before trial ends
            if (daysUntilEnd === 7 || daysUntilEnd === 3 || daysUntilEnd === 1) {
              await this.sendTrialExpirationReminder(subscription, daysUntilEnd);
            }
          }
        }
      } catch (error) {
        console.error('Error in trial expiration reminders:', error);
      }
    });

    this.jobs.set('trial-expiration-reminders', job);
    job.start();
  }

  /**
   * Send upcoming charge reminder (3 days before)
   */
  public async sendUpcomingChargeReminder(subscription: BillingSubscription) {
    // This would integrate with your email/notification service
    console.log(`Sending upcoming charge reminder for subscription ${subscription.id}`);
  }

  /**
   * Send payment confirmation
   */
  private async sendPaymentConfirmation(subscription: BillingSubscription, billingHistory: BillingHistory, success: boolean) {
    console.log(`Sending payment ${success ? 'confirmation' : 'failure'} for subscription ${subscription.id}`);
  }

  /**
   * Send payment success notification
   */
  private async sendPaymentSuccessNotification(billingHistory: BillingHistory) {
    console.log(`Sending payment success notification for billing history ${billingHistory.id}`);
  }

  /**
   * Send final payment failure notification
   */
  private async sendFinalPaymentFailureNotification(billingHistory: BillingHistory) {
    console.log(`Sending final payment failure notification for billing history ${billingHistory.id}`);
  }

  /**
   * Send usage alerts
   */
  private async sendUsageAlerts(subscription: BillingSubscription, alerts: string[]) {
    console.log(`Sending usage alerts for subscription ${subscription.id}:`, alerts);
  }

  /**
   * Send card expiration warning
   */
  private async sendCardExpirationWarning(subscription: BillingSubscription, daysUntilExpiry: number) {
    console.log(`Sending card expiration warning for subscription ${subscription.id} (${daysUntilExpiry} days)`);
  }

  /**
   * Send trial expiration reminder
   */
  private async sendTrialExpirationReminder(subscription: BillingSubscription, daysUntilEnd: number) {
    console.log(`Sending trial expiration reminder for subscription ${subscription.id} (${daysUntilEnd} days)`);
  }

  /**
   * Generate invoice PDF
   */
  private async generateInvoicePDF(billingHistory: BillingHistory): Promise<string> {
    // This would integrate with a PDF generation service
    // For now, return a placeholder URL
    console.log(`Generating invoice PDF for billing history ${billingHistory.id}`);
    return `/invoices/${billingHistory.id}.pdf`;
  }

  /**
   * Send invoice email
   */
  private async sendInvoiceEmail(billingHistory: BillingHistory, invoiceUrl: string) {
    console.log(`Sending invoice email for billing history ${billingHistory.id} with URL: ${invoiceUrl}`);
  }

  /**
   * Stop all scheduled jobs
   */
  public stop() {
    this.jobs.forEach((job, name) => {
      console.log(`Stopping job: ${name}`);
      job.stop();
    });
    this.jobs.clear();
  }

  /**
   * Restart all jobs
   */
  public restart() {
    this.stop();
    this.initialize();
  }

  /**
   * Manually trigger daily billing processing
   */
  public async triggerBillingProcessing() {
    console.log('Manually triggering billing processing...');
    const dueSubscriptions = await storage.getSubscriptionsDueForBilling();
    
    for (const subscription of dueSubscriptions) {
      await this.processSubscriptionBilling(subscription);
    }
    
    return { processed: dueSubscriptions.length };
  }
}

// Create and export singleton instance
const billingScheduler = new BillingScheduler();
export default billingScheduler;