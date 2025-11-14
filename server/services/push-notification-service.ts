import webpush from 'web-push';
import { storage } from '../storage';
import { 
  type PushSubscription,
  type InsertPushSubscription,
  type PushNotification,
  type InsertPushNotification,
  type User,
  type Job
} from '@shared/schema';
import fs from 'fs/promises';
import path from 'path';
import pLimit from 'p-limit';
import pRetry from 'p-retry';

// Notification types
export enum NotificationType {
  JOB_UPDATE = 'job_update',
  NEW_MESSAGE = 'new_message',
  PAYMENT_RECEIVED = 'payment_received',
  JOB_ASSIGNED = 'job_assigned',
  JOB_COMPLETED = 'job_completed',
  REVIEW_REQUEST = 'review_request',
  MAINTENANCE_REMINDER = 'maintenance_reminder',
  BID_RECEIVED = 'bid_received',
  BID_ACCEPTED = 'bid_accepted',
  FLEET_UPDATE = 'fleet_update',
  SYSTEM_ALERT = 'system_alert'
}

// Notification action types
export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

// Configuration interface
interface VAPIDConfig {
  publicKey: string;
  privateKey: string;
  subject: string;
}

class PushNotificationService {
  private vapidConfig: VAPIDConfig | null = null;
  private initialized: boolean = false;
  private batchLimit = pLimit(10); // Limit concurrent push operations
  private readonly vapidKeyPath = path.join(process.cwd(), '.vapid-keys.json');

  constructor() {
    this.initialize();
  }

  // Initialize the service with VAPID keys
  private async initialize() {
    try {
      // Try to load existing VAPID keys
      await this.loadOrGenerateVAPIDKeys();
      
      if (this.vapidConfig) {
        // Set VAPID details for web-push
        webpush.setVapidDetails(
          this.vapidConfig.subject,
          this.vapidConfig.publicKey,
          this.vapidConfig.privateKey
        );
        
        this.initialized = true;
        console.log('Push notification service initialized successfully');
      }
    } catch (error) {
      console.error('Failed to initialize push notification service:', error);
    }
  }

  // Load existing or generate new VAPID keys
  private async loadOrGenerateVAPIDKeys(): Promise<void> {
    try {
      // First check environment variables
      const publicKey = process.env.VAPID_PUBLIC_KEY;
      const privateKey = process.env.VAPID_PRIVATE_KEY;
      const subject = process.env.VAPID_SUBJECT || 'mailto:support@truckfixgo.com';
      
      if (publicKey && privateKey) {
        this.vapidConfig = {
          publicKey,
          privateKey,
          subject
        };
        console.log('VAPID keys loaded from environment variables');
        return;
      }

      // Try to load from file
      try {
        const keyData = await fs.readFile(this.vapidKeyPath, 'utf-8');
        this.vapidConfig = JSON.parse(keyData);
        console.log('VAPID keys loaded from file');
        return;
      } catch (error) {
        // File doesn't exist or is invalid, generate new keys
      }

      // Generate new VAPID keys
      const vapidKeys = webpush.generateVAPIDKeys();
      this.vapidConfig = {
        publicKey: vapidKeys.publicKey,
        privateKey: vapidKeys.privateKey,
        subject: 'mailto:support@truckfixgo.com'
      };

      // Save to file for persistence
      try {
        await fs.writeFile(
          this.vapidKeyPath,
          JSON.stringify(this.vapidConfig, null, 2),
          'utf-8'
        );
        console.log('New VAPID keys generated and saved');
      } catch (saveError) {
        console.error('Failed to save VAPID keys to file:', saveError);
      }
    } catch (error) {
      console.error('Error loading/generating VAPID keys:', error);
    }
  }

  // Get public VAPID key for client
  public getPublicVAPIDKey(): string | null {
    return this.vapidConfig?.publicKey || null;
  }

  // Send push notification to a user
  public async sendPushNotification(
    userId: string,
    notification: {
      title: string;
      body: string;
      icon?: string;
      badge?: string;
      tag?: string;
      data?: any;
      requireInteraction?: boolean;
      actions?: NotificationAction[];
      type?: NotificationType;
    }
  ): Promise<{ success: boolean; sent: number; failed: number; errors: string[] }> {
    if (!this.initialized) {
      return { 
        success: false, 
        sent: 0, 
        failed: 0, 
        errors: ['Push notification service not initialized'] 
      };
    }

    const errors: string[] = [];
    let sent = 0;
    let failed = 0;

    try {
      // Check user preferences
      const preferences = await storage.getCustomerPreferences(userId);
      if (preferences && !preferences.pushNotifications) {
        return { 
          success: false, 
          sent: 0, 
          failed: 0, 
          errors: ['User has disabled push notifications'] 
        };
      }

      // Check notification category preferences
      if (preferences?.notificationCategories && notification.type) {
        const categories = preferences.notificationCategories as any;
        const categoryMap: Record<NotificationType, string> = {
          [NotificationType.JOB_UPDATE]: 'job_updates',
          [NotificationType.NEW_MESSAGE]: 'messages',
          [NotificationType.PAYMENT_RECEIVED]: 'payments',
          [NotificationType.JOB_ASSIGNED]: 'job_updates',
          [NotificationType.JOB_COMPLETED]: 'job_updates',
          [NotificationType.REVIEW_REQUEST]: 'job_updates',
          [NotificationType.MAINTENANCE_REMINDER]: 'job_updates',
          [NotificationType.BID_RECEIVED]: 'job_updates',
          [NotificationType.BID_ACCEPTED]: 'job_updates',
          [NotificationType.FLEET_UPDATE]: 'job_updates',
          [NotificationType.SYSTEM_ALERT]: 'job_updates'
        };

        const category = categoryMap[notification.type];
        if (category && categories[category] === false) {
          return {
            success: false,
            sent: 0,
            failed: 0,
            errors: [`User has disabled ${category} notifications`]
          };
        }
      }

      // Get active push subscriptions for the user
      const subscriptions = await storage.getPushSubscriptions(userId);

      if (!subscriptions || subscriptions.length === 0) {
        return { 
          success: false, 
          sent: 0, 
          failed: 0, 
          errors: ['No active push subscriptions found for user'] 
        };
      }

      // Prepare the notification payload
      const payload = JSON.stringify({
        title: notification.title,
        body: notification.body,
        icon: notification.icon || '/icons/icon-192x192.png',
        badge: notification.badge || '/icons/icon-96x96.png',
        tag: notification.tag || `notification-${Date.now()}`,
        data: {
          ...notification.data,
          type: notification.type,
          userId,
          timestamp: new Date().toISOString()
        },
        requireInteraction: notification.requireInteraction || false,
        actions: notification.actions || []
      });

      // Log the notification
      const notificationLog = await storage.logPushNotification({
        userId,
        title: notification.title,
        body: notification.body,
        icon: notification.icon,
        badge: notification.badge,
        tag: notification.tag,
        data: notification.data,
        requireInteraction: notification.requireInteraction || false,
        actions: notification.actions
      });

      // Send to all subscriptions in parallel with retry logic
      const sendPromises = subscriptions.map(subscription =>
        this.batchLimit(async () => {
          try {
            await pRetry(
              async () => {
                const pushSubscription = {
                  endpoint: subscription.endpoint,
                  keys: {
                    p256dh: subscription.p256dhKey,
                    auth: subscription.authKey
                  }
                };

                await webpush.sendNotification(pushSubscription, payload, {
                  urgency: 'high',
                  TTL: 86400 // 24 hours
                });

                // Update last used timestamp
                await storage.updatePushSubscriptionLastUsed(subscription.id);
                sent++;
              },
              {
                retries: 3,
                onFailedAttempt: error => {
                  console.warn(
                    `Attempt ${error.attemptNumber} failed for subscription ${subscription.id}:`,
                    error.message
                  );
                }
              }
            );
          } catch (error: any) {
            failed++;
            const errorMessage = error.message || 'Unknown error';
            errors.push(`Subscription ${subscription.id}: ${errorMessage}`);

            // Handle subscription errors
            if (error.statusCode === 410) {
              // Subscription expired, remove it
              await storage.removePushSubscription(subscription.id);
              console.log(`Removed expired subscription: ${subscription.id}`);
            } else if (error.statusCode >= 400 && error.statusCode < 500) {
              // Client error, mark subscription as inactive
              await storage.deactivatePushSubscription(subscription.id);
              console.log(`Deactivated invalid subscription: ${subscription.id}`);
            }
          }
        })
      );

      // Wait for all send operations to complete
      await Promise.all(sendPromises);

      // Update notification status
      if (notificationLog) {
        if (sent > 0) {
          await storage.markNotificationSent(notificationLog.id);
        } else {
          await storage.markNotificationFailed(
            notificationLog.id,
            errors.join('; ')
          );
        }
      }

      return { 
        success: sent > 0, 
        sent, 
        failed, 
        errors 
      };
    } catch (error: any) {
      console.error('Error sending push notification:', error);
      return { 
        success: false, 
        sent, 
        failed, 
        errors: [error.message || 'Failed to send push notification'] 
      };
    }
  }

  // Send batch notifications to multiple users
  public async sendBatchNotifications(
    userIds: string[],
    notification: {
      title: string;
      body: string;
      icon?: string;
      badge?: string;
      tag?: string;
      data?: any;
      requireInteraction?: boolean;
      actions?: NotificationAction[];
      type?: NotificationType;
    }
  ): Promise<{
    totalSent: number;
    totalFailed: number;
    results: Array<{ userId: string; success: boolean; error?: string }>;
  }> {
    const results: Array<{ userId: string; success: boolean; error?: string }> = [];
    let totalSent = 0;
    let totalFailed = 0;

    // Process notifications in batches with concurrency limit
    const sendPromises = userIds.map(userId =>
      this.batchLimit(async () => {
        const result = await this.sendPushNotification(userId, notification);
        
        if (result.success) {
          totalSent += result.sent;
          results.push({ userId, success: true });
        } else {
          totalFailed += result.failed || 1;
          results.push({ 
            userId, 
            success: false, 
            error: result.errors.join('; ') 
          });
        }
      })
    );

    await Promise.all(sendPromises);

    return { totalSent, totalFailed, results };
  }

  // Send notification for job updates
  public async sendJobNotification(
    job: Job,
    type: 'assigned' | 'en_route' | 'arrived' | 'completed' | 'cancelled',
    additionalData?: any
  ): Promise<void> {
    const notifications: Array<{
      userId: string;
      title: string;
      body: string;
      type: NotificationType;
      data: any;
      actions?: NotificationAction[];
    }> = [];

    // Prepare notification based on type
    switch (type) {
      case 'assigned':
        if (job.customerId) {
          notifications.push({
            userId: job.customerId,
            title: 'Contractor Assigned',
            body: 'A contractor has been assigned to your service request',
            type: NotificationType.JOB_ASSIGNED,
            data: { jobId: job.id, ...additionalData },
            actions: [
              { action: 'track', title: 'Track Progress' },
              { action: 'message', title: 'Message Contractor' }
            ]
          });
        }
        if (job.contractorId) {
          notifications.push({
            userId: job.contractorId,
            title: 'New Job Assignment',
            body: `You have been assigned to job #${job.id}`,
            type: NotificationType.JOB_ASSIGNED,
            data: { jobId: job.id, ...additionalData },
            actions: [
              { action: 'view', title: 'View Details' },
              { action: 'navigate', title: 'Get Directions' }
            ]
          });
        }
        break;

      case 'en_route':
        if (job.customerId) {
          notifications.push({
            userId: job.customerId,
            title: 'Contractor En Route',
            body: 'Your contractor is on the way',
            type: NotificationType.JOB_UPDATE,
            data: { jobId: job.id, ...additionalData },
            actions: [
              { action: 'track', title: 'Track Live' },
              { action: 'call', title: 'Call Contractor' }
            ]
          });
        }
        break;

      case 'arrived':
        if (job.customerId) {
          notifications.push({
            userId: job.customerId,
            title: 'Contractor Arrived',
            body: 'Your contractor has arrived at the location',
            type: NotificationType.JOB_UPDATE,
            data: { jobId: job.id, ...additionalData }
          });
        }
        break;

      case 'completed':
        if (job.customerId) {
          notifications.push({
            userId: job.customerId,
            title: 'Service Completed',
            body: 'Your service has been completed successfully',
            type: NotificationType.JOB_COMPLETED,
            data: { jobId: job.id, ...additionalData },
            actions: [
              { action: 'review', title: 'Leave Review' },
              { action: 'invoice', title: 'View Invoice' }
            ]
          });
        }
        break;

      case 'cancelled':
        if (job.customerId) {
          notifications.push({
            userId: job.customerId,
            title: 'Service Cancelled',
            body: 'Your service request has been cancelled',
            type: NotificationType.JOB_UPDATE,
            data: { jobId: job.id, ...additionalData },
            actions: [
              { action: 'rebook', title: 'Book Again' }
            ]
          });
        }
        if (job.contractorId) {
          notifications.push({
            userId: job.contractorId,
            title: 'Job Cancelled',
            body: `Job #${job.id} has been cancelled`,
            type: NotificationType.JOB_UPDATE,
            data: { jobId: job.id, ...additionalData }
          });
        }
        break;
    }

    // Send all notifications
    for (const notification of notifications) {
      await this.sendPushNotification(notification.userId, notification);
    }
  }

  // Test push notification
  public async sendTestNotification(userId: string): Promise<any> {
    return this.sendPushNotification(userId, {
      title: '🔧 TruckFixGo Test Notification',
      body: 'Push notifications are working! You\'ll receive updates about your service requests here.',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-96x96.png',
      tag: 'test-notification',
      data: { test: true },
      requireInteraction: true,
      actions: [
        { action: 'close', title: 'Dismiss' }
      ]
    });
  }

  // Get notification statistics
  public async getNotificationStats(userId: string, days: number = 30): Promise<{
    total: number;
    sent: number;
    delivered: number;
    clicked: number;
    failed: number;
    categories: Record<string, number>;
  }> {
    const notifications = await storage.getUserNotificationHistory(userId, days);
    
    const stats = {
      total: notifications.length,
      sent: 0,
      delivered: 0,
      clicked: 0,
      failed: 0,
      categories: {} as Record<string, number>
    };

    for (const notification of notifications) {
      if (notification.sentAt) stats.sent++;
      if (notification.deliveredAt) stats.delivered++;
      if (notification.clickedAt) stats.clicked++;
      if (notification.failedAt) stats.failed++;

      // Count by category/type
      const data = notification.data as any;
      if (data?.type) {
        stats.categories[data.type] = (stats.categories[data.type] || 0) + 1;
      }
    }

    return stats;
  }

  // Clean up old notifications
  public async cleanupOldNotifications(daysToKeep: number = 30): Promise<number> {
    return storage.deleteOldPushNotifications(daysToKeep);
  }
}

// Export singleton instance
export const pushNotificationService = new PushNotificationService();
export default pushNotificationService;