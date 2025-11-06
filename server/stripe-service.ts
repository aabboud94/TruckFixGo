import Stripe from 'stripe';
import { 
  type BillingSubscription,
  type BillingHistory,
  type FleetAccount,
  type PaymentMethod,
  billingCycleEnum,
  subscriptionStatusEnum,
  billingHistoryStatusEnum,
  planTypeEnum
} from '@shared/schema';
import { storage } from './storage';
import { db } from './db';

// Initialize Stripe with API key - only if key is available
const stripeKey = process.env.STRIPE_SECRET_KEY || process.env.TESTING_STRIPE_SECRET_KEY;
const stripe = stripeKey ? new Stripe(stripeKey, {
  apiVersion: '2024-12-18.acacia' as any,
  typescript: true,
}) : null;

// Subscription plan configurations
export const SUBSCRIPTION_PLANS = {
  basic: {
    name: 'Basic Fleet Plan',
    description: 'Perfect for small fleets',
    monthlyPrice: 50000, // $500.00 in cents
    quarterlyPrice: 142500, // $1425.00 (5% discount)
    annualPrice: 540000, // $5400.00 (10% discount)
    features: {
      maxVehicles: 10,
      includedEmergencyRepairs: 5,
      includedScheduledServices: 10,
      prioritySupport: false,
      dedicatedAccountManager: false,
    }
  },
  standard: {
    name: 'Standard Fleet Plan',
    description: 'Ideal for medium-sized fleets',
    monthlyPrice: 150000, // $1500.00 in cents
    quarterlyPrice: 427500, // $4275.00 (5% discount)
    annualPrice: 1620000, // $16200.00 (10% discount)
    features: {
      maxVehicles: 50,
      includedEmergencyRepairs: 20,
      includedScheduledServices: 50,
      prioritySupport: true,
      dedicatedAccountManager: false,
    }
  },
  enterprise: {
    name: 'Enterprise Fleet Plan',
    description: 'Complete solution for large fleets',
    monthlyPrice: 500000, // $5000.00 in cents
    quarterlyPrice: 1425000, // $14250.00 (5% discount)
    annualPrice: 5400000, // $54000.00 (10% discount)
    features: {
      maxVehicles: 999999, // Unlimited
      includedEmergencyRepairs: 999999, // Unlimited
      includedScheduledServices: 999999, // Unlimited
      prioritySupport: true,
      dedicatedAccountManager: true,
    }
  }
};

// Add-on services pricing
export const ADDON_SERVICES = {
  priority_support: {
    name: 'Priority Support',
    monthlyPrice: 50000, // $500.00
    description: '24/7 dedicated support with <15min response'
  },
  dedicated_account_manager: {
    name: 'Dedicated Account Manager',
    monthlyPrice: 100000, // $1000.00
    description: 'Personal account manager for fleet operations'
  },
  extra_vehicles_10: {
    name: 'Extra 10 Vehicles',
    monthlyPrice: 30000, // $300.00
    description: 'Add 10 more vehicles to your plan'
  },
  extra_emergency_repairs_5: {
    name: '5 Additional Emergency Repairs',
    monthlyPrice: 25000, // $250.00
    description: 'Add 5 emergency repair credits per month'
  }
};

class StripeService {
  // Check if Stripe is available
  private checkStripeAvailable(): boolean {
    if (!stripe) {
      console.log('⚠️  Stripe Service: Running in stub mode - no STRIPE_SECRET_KEY configured');
      return false;
    }
    return true;
  }

  // Create or get a Stripe customer for a fleet account
  async createOrGetStripeCustomer(fleetAccount: FleetAccount): Promise<string> {
    // STUB MODE - Return mock customer ID
    if (!this.checkStripeAvailable()) {
      console.log('Stripe Service (Stub): Creating mock customer for fleet:', fleetAccount.id);
      return `cus_mock_${fleetAccount.id}_${Date.now()}`;
    }
    try {
      // Check if fleet already has a Stripe customer
      const existingSubscription = await storage.getFleetActiveSubscription(fleetAccount.id);
      if (existingSubscription?.stripeCustomerId) {
        return existingSubscription.stripeCustomerId;
      }

      // Search for existing customer by email
      const customers = await stripe.customers.list({
        email: fleetAccount.billingEmail || fleetAccount.primaryContactEmail || undefined,
        limit: 1,
      });

      if (customers.data.length > 0) {
        return customers.data[0].id;
      }

      // Create new customer
      const customer = await stripe.customers.create({
        name: fleetAccount.companyName,
        email: fleetAccount.billingEmail || fleetAccount.primaryContactEmail || undefined,
        phone: fleetAccount.primaryContactPhone || undefined,
        metadata: {
          fleetAccountId: fleetAccount.id,
          dotNumber: fleetAccount.dotNumber || '',
          pricingTier: fleetAccount.pricingTier,
        },
        address: fleetAccount.address ? {
          line1: fleetAccount.address,
          city: fleetAccount.city || undefined,
          state: fleetAccount.state || undefined,
          postal_code: fleetAccount.zip || undefined,
          country: 'US',
        } : undefined,
      });

      return customer.id;
    } catch (error) {
      console.error('Error creating Stripe customer:', error);
      throw new Error('Failed to create customer account');
    }
  }

  // Create a Stripe subscription for a fleet
  async createSubscription(
    fleetAccountId: string,
    planType: typeof planTypeEnum.enumValues[number],
    billingCycle: typeof billingCycleEnum.enumValues[number],
    paymentMethodId: string,
    addOns?: string[],
    customAmount?: number,
    trialDays?: number
  ): Promise<Stripe.Subscription> {
    // STUB MODE - Return mock subscription
    if (!this.checkStripeAvailable()) {
      console.log('Stripe Service (Stub): Creating mock subscription for fleet:', fleetAccountId);
      const mockSubscription: any = {
        id: `sub_mock_${Date.now()}`,
        object: 'subscription',
        customer: `cus_mock_${fleetAccountId}`,
        status: 'active',
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + 2592000, // 30 days
        created: Math.floor(Date.now() / 1000),
        items: {
          data: [{
            id: `si_mock_${Date.now()}`,
            price: {
              id: `price_mock_${Date.now()}`,
              currency: 'usd',
              unit_amount: customAmount || SUBSCRIPTION_PLANS[planType as keyof typeof SUBSCRIPTION_PLANS]?.monthlyPrice || 50000,
            }
          }]
        },
        metadata: {
          fleetAccountId,
          planType,
          billingCycle,
        },
        latest_invoice: {
          payment_intent: {
            client_secret: `pi_mock_secret_${Date.now()}`
          }
        }
      };
      return mockSubscription as Stripe.Subscription;
    }
    try {
      const fleetAccount = await storage.getFleetAccount(fleetAccountId);
      if (!fleetAccount) throw new Error('Fleet account not found');

      const customerId = await this.createOrGetStripeCustomer(fleetAccount);
      
      // Attach payment method to customer
      await stripe!.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });

      // Set as default payment method
      await stripe!.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      // Calculate price based on plan and billing cycle
      let basePrice: number;
      if (planType === 'custom' && customAmount) {
        basePrice = customAmount;
      } else {
        const plan = SUBSCRIPTION_PLANS[planType as keyof typeof SUBSCRIPTION_PLANS];
        if (!plan) throw new Error('Invalid plan type');

        if (billingCycle === 'monthly') {
          basePrice = plan.monthlyPrice;
        } else if (billingCycle === 'quarterly') {
          basePrice = plan.quarterlyPrice;
        } else {
          basePrice = plan.annualPrice;
        }
      }

      // Build subscription items
      const items: Stripe.SubscriptionCreateParams.Item[] = [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: planType === 'custom' ? 'Custom Fleet Plan' : SUBSCRIPTION_PLANS[planType as keyof typeof SUBSCRIPTION_PLANS].name,
              metadata: {
                planType,
                fleetAccountId,
              },
            },
            recurring: {
              interval: billingCycle === 'annual' ? 'year' : billingCycle === 'quarterly' ? 'month' : 'month',
              interval_count: billingCycle === 'quarterly' ? 3 : 1,
            },
            unit_amount: basePrice,
          },
        },
      ];

      // Add add-on items
      if (addOns && addOns.length > 0) {
        for (const addon of addOns) {
          const addonConfig = ADDON_SERVICES[addon as keyof typeof ADDON_SERVICES];
          if (addonConfig) {
            items.push({
              price_data: {
                currency: 'usd',
                product_data: {
                  name: addonConfig.name,
                  description: addonConfig.description,
                },
                recurring: {
                  interval: billingCycle === 'annual' ? 'year' : billingCycle === 'quarterly' ? 'month' : 'month',
                  interval_count: billingCycle === 'quarterly' ? 3 : 1,
                },
                unit_amount: addonConfig.monthlyPrice,
              },
            });
          }
        }
      }

      // Create the subscription
      const subscription = await stripe!.subscriptions.create({
        customer: customerId,
        items,
        payment_behavior: 'default_incomplete',
        payment_settings: { 
          save_default_payment_method: 'on_subscription',
          payment_method_types: ['card'],
        },
        expand: ['latest_invoice.payment_intent'],
        trial_period_days: trialDays,
        metadata: {
          fleetAccountId,
          planType,
          billingCycle,
        },
        collection_method: 'charge_automatically',
        proration_behavior: 'create_prorations',
      });

      return subscription;
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }

  // Update an existing subscription (upgrade/downgrade)
  async updateSubscription(
    subscriptionId: string,
    updates: {
      planType?: string;
      billingCycle?: string;
      addOns?: string[];
      customAmount?: number;
    }
  ): Promise<Stripe.Subscription> {
    // STUB MODE - Return mock updated subscription
    if (!this.checkStripeAvailable()) {
      console.log('Stripe Service (Stub): Updating mock subscription:', subscriptionId);
      const mockSubscription: any = {
        id: subscriptionId,
        object: 'subscription',
        status: 'active',
        metadata: {
          ...updates,
          updated_at: Date.now()
        }
      };
      return mockSubscription as Stripe.Subscription;
    }
    try {
      // Get current subscription
      const subscription = await stripe!.subscriptions.retrieve(subscriptionId);
      
      // If changing plan or billing cycle, update the subscription items
      if (updates.planType || updates.billingCycle || updates.customAmount) {
        // Cancel current items and add new ones
        const currentItems = subscription.items.data;
        
        // Calculate new price
        let newPrice: number;
        if (updates.planType === 'custom' && updates.customAmount) {
          newPrice = updates.customAmount;
        } else {
          const planType = updates.planType || subscription.metadata.planType;
          const billingCycle = updates.billingCycle || subscription.metadata.billingCycle;
          const plan = SUBSCRIPTION_PLANS[planType as keyof typeof SUBSCRIPTION_PLANS];
          
          if (billingCycle === 'monthly') {
            newPrice = plan.monthlyPrice;
          } else if (billingCycle === 'quarterly') {
            newPrice = plan.quarterlyPrice;
          } else {
            newPrice = plan.annualPrice;
          }
        }

        // Update subscription with new price
        const updatedSubscription = await stripe!.subscriptions.update(subscriptionId, {
          items: [{
            id: currentItems[0].id,
            price_data: {
              currency: 'usd',
              product_data: {
                name: updates.planType === 'custom' ? 'Custom Fleet Plan' : SUBSCRIPTION_PLANS[updates.planType as keyof typeof SUBSCRIPTION_PLANS]?.name || 'Fleet Plan',
              },
              recurring: {
                interval: updates.billingCycle === 'annual' ? 'year' : updates.billingCycle === 'quarterly' ? 'month' : 'month',
                interval_count: updates.billingCycle === 'quarterly' ? 3 : 1,
              },
              unit_amount: newPrice,
            },
          }],
          proration_behavior: 'create_prorations',
          metadata: {
            ...subscription.metadata,
            ...updates,
          },
        });

        return updatedSubscription;
      }

      return subscription;
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw error;
    }
  }

  // Cancel a subscription
  async cancelSubscription(
    subscriptionId: string, 
    immediately: boolean = false,
    cancellationReason?: string
  ): Promise<Stripe.Subscription> {
    // STUB MODE - Return mock cancelled subscription
    if (!this.checkStripeAvailable()) {
      console.log('Stripe Service (Stub): Cancelling mock subscription:', subscriptionId, cancellationReason);
      const mockSubscription: any = {
        id: subscriptionId,
        object: 'subscription',
        status: immediately ? 'canceled' : 'active',
        cancel_at: immediately ? null : Math.floor(Date.now() / 1000) + 2592000,
        canceled_at: immediately ? Math.floor(Date.now() / 1000) : null,
        cancellation_details: {
          reason: cancellationReason || 'customer_request'
        }
      };
      return mockSubscription as Stripe.Subscription;
    }
    try {
      if (immediately) {
        // Cancel immediately
        return await stripe!.subscriptions.cancel(subscriptionId, {
          invoice_now: true,
          prorate: true,
        });
      } else {
        // Cancel at end of billing period
        return await stripe!.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true,
          metadata: {
            cancellationReason: cancellationReason || 'Customer requested',
          },
        });
      }
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  }

  // Pause a subscription
  async pauseSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    this.checkStripeAvailable();
    try {
      return await stripe!.subscriptions.update(subscriptionId, {
        pause_collection: {
          behavior: 'keep_as_draft',
        },
      });
    } catch (error) {
      console.error('Error pausing subscription:', error);
      throw error;
    }
  }

  // Resume a paused subscription
  async resumeSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    this.checkStripeAvailable();
    try {
      return await stripe!.subscriptions.update(subscriptionId, {
        pause_collection: '',
      } as any);
    } catch (error) {
      console.error('Error resuming subscription:', error);
      throw error;
    }
  }

  // Process a recurring charge manually
  async processRecurringCharge(subscriptionId: string): Promise<Stripe.Invoice> {
    this.checkStripeAvailable();
    try {
      // Create an invoice for the subscription
      const invoice = await stripe!.invoices.create({
        subscription: subscriptionId,
        auto_advance: true, // Auto-finalize the invoice
      });

      // Finalize and pay the invoice
      await stripe!.invoices.finalizeInvoice(invoice.id);
      const paidInvoice = await stripe!.invoices.pay(invoice.id);

      return paidInvoice;
    } catch (error) {
      console.error('Error processing recurring charge:', error);
      throw error;
    }
  }

  // Retry a failed payment
  async retryFailedPayment(invoiceId: string): Promise<Stripe.Invoice> {
    this.checkStripeAvailable();
    try {
      const invoice = await stripe!.invoices.pay(invoiceId);
      return invoice;
    } catch (error) {
      console.error('Error retrying failed payment:', error);
      throw error;
    }
  }

  // Create a usage record for metered billing (overage charges)
  async recordUsage(
    subscriptionItemId: string,
    quantity: number,
    timestamp?: number
  ): Promise<Stripe.UsageRecord> {
    this.checkStripeAvailable();
    try {
      return await stripe!.subscriptionItems.createUsageRecord(
        subscriptionItemId,
        {
          quantity,
          timestamp: timestamp || Math.floor(Date.now() / 1000),
          action: 'increment', // or 'set' to override
        }
      );
    } catch (error) {
      console.error('Error recording usage:', error);
      throw error;
    }
  }

  // Get subscription details
  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    // STUB MODE - Return mock subscription details
    if (!this.checkStripeAvailable()) {
      console.log('Stripe Service (Stub): Getting mock subscription:', subscriptionId);
      const mockSubscription: any = {
        id: subscriptionId,
        object: 'subscription',
        status: 'active',
        current_period_start: Math.floor(Date.now() / 1000) - 1296000, // 15 days ago
        current_period_end: Math.floor(Date.now() / 1000) + 1296000, // 15 days from now
        created: Math.floor(Date.now() / 1000) - 2592000, // 30 days ago
        customer: `cus_mock_${subscriptionId}`,
        items: {
          data: [{
            id: `si_mock_${Date.now()}`,
            price: {
              id: `price_mock_${Date.now()}`,
              currency: 'usd',
              unit_amount: 50000,
              recurring: {
                interval: 'month',
                interval_count: 1
              }
            }
          }]
        }
      };
      return mockSubscription as Stripe.Subscription;
    }
    try {
      return await stripe!.subscriptions.retrieve(subscriptionId, {
        expand: ['latest_invoice', 'customer', 'default_payment_method'],
      });
    } catch (error) {
      console.error('Error getting subscription:', error);
      throw error;
    }
  }

  // Get invoice details
  async getInvoice(invoiceId: string): Promise<Stripe.Invoice> {
    this.checkStripeAvailable();
    try {
      return await stripe!.invoices.retrieve(invoiceId, {
        expand: ['subscription', 'customer', 'payment_intent'],
      });
    } catch (error) {
      console.error('Error getting invoice:', error);
      throw error;
    }
  }

  // List invoices for a customer
  async listInvoices(customerId: string, limit: number = 10): Promise<Stripe.Invoice[]> {
    this.checkStripeAvailable();
    try {
      const invoices = await stripe!.invoices.list({
        customer: customerId,
        limit,
        expand: ['data.subscription'],
      });
      return invoices.data;
    } catch (error) {
      console.error('Error listing invoices:', error);
      throw error;
    }
  }

  // Create a refund
  async createRefund(chargeId: string, amount?: number, reason?: string): Promise<Stripe.Refund> {
    this.checkStripeAvailable();
    try {
      return await stripe!.refunds.create({
        charge: chargeId,
        amount: amount, // In cents, if not provided, full refund
        reason: reason as Stripe.RefundCreateParams.Reason || 'requested_by_customer',
      });
    } catch (error) {
      console.error('Error creating refund:', error);
      throw error;
    }
  }

  // Update payment method for subscription
  async updatePaymentMethod(subscriptionId: string, paymentMethodId: string): Promise<Stripe.Subscription> {
    this.checkStripeAvailable();
    try {
      const subscription = await stripe!.subscriptions.retrieve(subscriptionId);
      
      // Attach new payment method to customer
      await stripe!.paymentMethods.attach(paymentMethodId, {
        customer: subscription.customer as string,
      });

      // Update customer's default payment method
      await stripe!.customers.update(subscription.customer as string, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      // Update subscription's default payment method
      return await stripe!.subscriptions.update(subscriptionId, {
        default_payment_method: paymentMethodId,
      });
    } catch (error) {
      console.error('Error updating payment method:', error);
      throw error;
    }
  }

  // Handle Stripe webhooks
  async handleWebhook(event: Stripe.Event): Promise<void> {
    try {
      switch (event.type) {
        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;
        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
          break;
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
          break;
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;
        case 'invoice.upcoming':
          await this.handleUpcomingInvoice(event.data.object as Stripe.Invoice);
          break;
        default:
          console.log(`Unhandled webhook event: ${event.type}`);
      }
    } catch (error) {
      console.error('Error handling webhook:', error);
      throw error;
    }
  }

  // Private webhook handlers
  private async handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    // Update billing history record
    await storage.updateBillingHistoryByStripeInvoice(invoice.id, {
      status: 'success',
      paidAt: new Date(invoice.status_transitions.paid_at! * 1000),
      paidAmount: (invoice.amount_paid / 100).toString(),
    });

    // Update subscription's last billing date
    if (invoice.subscription) {
      await storage.updateSubscriptionBillingDates(invoice.subscription as string);
    }

    // TODO: Send payment success notification
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    // Update billing history record
    await storage.updateBillingHistoryByStripeInvoice(invoice.id, {
      status: 'failed',
      failureReason: invoice.last_finalization_error?.message || 'Payment failed',
      paymentAttempts: (invoice.attempt_count || 0) + 1,
    });

    // TODO: Send payment failure notification
    // TODO: Schedule retry based on settings
  }

  private async handleSubscriptionUpdate(subscription: Stripe.Subscription): Promise<void> {
    // Map Stripe status to our status
    let status: typeof subscriptionStatusEnum.enumValues[number] = 'active';
    if (subscription.status === 'canceled') status = 'cancelled';
    else if (subscription.status === 'past_due') status = 'paused';
    else if (subscription.status === 'unpaid') status = 'paused';
    
    // Update local subscription record
    await storage.updateSubscriptionByStripeId(subscription.id, {
      status,
      nextBillingDate: new Date(subscription.current_period_end * 1000),
    });
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    await storage.updateSubscriptionByStripeId(subscription.id, {
      status: 'cancelled',
      cancelledAt: new Date(),
    });
  }

  private async handleUpcomingInvoice(invoice: Stripe.Invoice): Promise<void> {
    // TODO: Send upcoming charge reminder (3 days before)
  }

  // Calculate proration for mid-cycle changes
  calculateProration(
    currentAmount: number,
    newAmount: number,
    daysRemaining: number,
    totalDaysInPeriod: number
  ): number {
    const dailyCurrentRate = currentAmount / totalDaysInPeriod;
    const dailyNewRate = newAmount / totalDaysInPeriod;
    const currentCredit = dailyCurrentRate * daysRemaining;
    const newCharge = dailyNewRate * daysRemaining;
    return newCharge - currentCredit; // Positive means customer owes, negative means credit
  }
}

export default new StripeService();