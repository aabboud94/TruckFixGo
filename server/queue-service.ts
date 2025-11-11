import * as cron from 'node-cron';
import { PostgreSQLStorage } from './storage';
import { EmailService } from './email-service';
import { WebSocketService } from './websocket';
import { db } from './db';
import { contractorJobQueue, jobs, contractorProfiles, users } from '@shared/schema';
import { and, eq, gte, lte, inArray } from 'drizzle-orm';

export class QueueProcessingService {
  private storage: PostgreSQLStorage;
  private emailService: EmailService;
  private wsService: WebSocketService;
  private processingJobs: Set<string> = new Set();

  constructor(
    storage: PostgreSQLStorage, 
    emailService: EmailService,
    wsService: WebSocketService
  ) {
    this.storage = storage;
    this.emailService = emailService;
    this.wsService = wsService;
  }

  /**
   * Initialize the queue processing service with scheduled tasks
   */
  initialize() {
    // Process expired queue entries every 5 minutes
    cron.schedule('*/5 * * * *', () => {
      this.processExpiredQueueEntries();
    });

    // Update queue estimates every 10 minutes
    cron.schedule('*/10 * * * *', () => {
      this.updateAllQueueEstimates();
    });

    // Send queue position updates every 15 minutes
    cron.schedule('*/15 * * * *', () => {
      this.sendQueuePositionNotifications();
    });

    // Check for idle contractors every 30 minutes
    cron.schedule('*/30 * * * *', () => {
      this.checkIdleContractors();
    });

    console.log('Queue processing service initialized');
  }

  /**
   * Process queue when a job is completed
   */
  async onJobCompleted(jobId: string, contractorId: string) {
    if (this.processingJobs.has(jobId)) {
      return; // Already processing
    }

    this.processingJobs.add(jobId);

    try {
      // Mark the current queue entry as completed
      const queueEntry = await db.select()
        .from(contractorJobQueue)
        .where(and(
          eq(contractorJobQueue.jobId, jobId),
          eq(contractorJobQueue.contractorId, contractorId)
        ))
        .limit(1);

      if (queueEntry.length > 0) {
        await this.storage.updateQueueStatus(queueEntry[0].id, 'completed');
      }

      // Process next job in queue
      const result = await this.storage.processNextInQueue(contractorId);

      if (result.success && result.nextJob) {
        // Send notifications
        await this.notifyNextJobStarting(contractorId, result.nextJob);
        
        // Send WebSocket update
        this.wsService.sendToContractor(contractorId, {
          type: 'queue:next-job',
          data: {
            job: result.nextJob,
            queueEntry: result.queueEntry,
            message: 'Your next job is now active'
          }
        });

        // Notify customer of contractor arrival
        if (result.nextJob.customerId) {
          await this.emailService.sendContractorEnRouteNotification(
            result.nextJob.customerId,
            result.nextJob
          );
        }
      }

      // Update queue estimates for this contractor
      await this.storage.updateQueueEstimates(contractorId);

    } catch (error) {
      console.error('Error processing job completion:', error);
    } finally {
      this.processingJobs.delete(jobId);
    }
  }

  /**
   * Handle queue timeout - reassign jobs that have been queued too long
   */
  async processExpiredQueueEntries() {
    try {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

      // Find queued entries older than 2 hours
      const expiredEntries = await db.select()
        .from(contractorJobQueue)
        .where(and(
          eq(contractorJobQueue.status, 'queued'),
          lte(contractorJobQueue.queuedAt, twoHoursAgo)
        ));

      for (const entry of expiredEntries) {
        await this.handleQueueTimeout(entry.id);
      }
    } catch (error) {
      console.error('Error processing expired queue entries:', error);
    }
  }

  /**
   * Handle a single queue timeout
   */
  async handleQueueTimeout(queueId: string) {
    try {
      const result = await this.storage.handleQueueTimeout(queueId);

      if (result.reassigned && result.newContractorId) {
        // Get the queue entry and job details
        const [queueEntry] = await db.select()
          .from(contractorJobQueue)
          .where(eq(contractorJobQueue.id, queueId));

        if (queueEntry) {
          const job = await this.storage.getJob(queueEntry.jobId);
          if (job) {
            // Notify new contractor
            await this.emailService.sendJobAssignmentNotification(
              result.newContractorId,
              job
            );

            // Notify customer of reassignment
            if (job.customerId) {
              await this.emailService.sendJobReassignedNotification(
                job.customerId,
                job
              );
            }

            // WebSocket notification
            this.wsService.sendToContractor(result.newContractorId, {
              type: 'queue:job-assigned',
              data: {
                job,
                reason: 'timeout_reassignment',
                message: 'A job has been reassigned to you due to timeout'
              }
            });
          }
        }
      }
    } catch (error) {
      console.error('Error handling queue timeout:', error);
    }
  }

  /**
   * Update queue estimates for all contractors
   */
  async updateAllQueueEstimates() {
    try {
      // Get all contractors with active queues
      const activeQueues = await db.selectDistinct({ 
        contractorId: contractorJobQueue.contractorId 
      })
      .from(contractorJobQueue)
      .where(inArray(contractorJobQueue.status, ['current', 'queued', 'assigned']));

      for (const { contractorId } of activeQueues) {
        await this.storage.updateQueueEstimates(contractorId);
      }
    } catch (error) {
      console.error('Error updating queue estimates:', error);
    }
  }

  /**
   * Send notifications about queue positions
   */
  async sendQueuePositionNotifications() {
    try {
      // Get all queued entries
      const queuedEntries = await db.select()
        .from(contractorJobQueue)
        .where(eq(contractorJobQueue.status, 'queued'));

      for (const entry of queuedEntries) {
        // Check if notification was recently sent
        const notifications = (entry.notificationsSent as any[]) || [];
        const recentNotification = notifications.find(
          n => n.type === 'position_update' && 
          new Date(n.sentAt) > new Date(Date.now() - 60 * 60 * 1000) // Within last hour
        );

        if (!recentNotification) {
          await this.sendQueuePositionUpdate(entry);
        }
      }
    } catch (error) {
      console.error('Error sending queue position notifications:', error);
    }
  }

  /**
   * Send a queue position update notification
   */
  async sendQueuePositionUpdate(queueEntry: any) {
    try {
      const job = await this.storage.getJob(queueEntry.jobId);
      if (!job) return;

      const contractor = await this.storage.getUser(queueEntry.contractorId);
      if (!contractor) return;

      // Send email notification
      await this.emailService.sendQueuePositionUpdate(
        contractor.email,
        {
          contractorName: `${contractor.firstName} ${contractor.lastName}`,
          jobNumber: job.jobNumber,
          position: queueEntry.queuePosition,
          estimatedStartTime: queueEntry.estimatedStartTime
        }
      );

      // Send WebSocket notification
      this.wsService.sendToContractor(queueEntry.contractorId, {
        type: 'queue:position-update',
        data: {
          jobId: job.id,
          jobNumber: job.jobNumber,
          position: queueEntry.queuePosition,
          estimatedStartTime: queueEntry.estimatedStartTime
        }
      });

      // Mark notification as sent
      await this.storage.sendQueueNotification(queueEntry.id, 'position_update');
    } catch (error) {
      console.error('Error sending queue position update:', error);
    }
  }

  /**
   * Check for idle contractors and assign queued jobs
   */
  async checkIdleContractors() {
    try {
      // Find available contractors with no current job
      const contractors = await db.select()
        .from(contractorProfiles)
        .where(eq(contractorProfiles.isAvailable, true));

      for (const contractor of contractors) {
        const currentJob = await this.storage.getContractorCurrentJob(contractor.userId);
        
        if (!currentJob.job) {
          // Contractor is idle, check for unassigned jobs
          await this.assignJobToIdleContractor(contractor.userId);
        }
      }
    } catch (error) {
      console.error('Error checking idle contractors:', error);
    }
  }

  /**
   * Try to assign a job to an idle contractor
   */
  async assignJobToIdleContractor(contractorId: string) {
    try {
      // Get contractor's service types
      const services = await this.storage.getContractorServices(contractorId);
      const serviceTypeIds = services.map(s => s.serviceTypeId);

      if (serviceTypeIds.length === 0) return;

      // Find unassigned jobs matching contractor's services
      const unassignedJobs = await this.storage.findJobs({
        status: 'new',
        serviceTypeId: serviceTypeIds[0], // TODO: Check all service types
        limit: 1,
        orderBy: 'urgencyLevel',
        orderDir: 'desc'
      });

      if (unassignedJobs.length > 0) {
        const job = unassignedJobs[0];
        
        // Add to contractor's queue
        await this.storage.addToContractorQueue(contractorId, job.id, undefined, {
          autoAssigned: true,
          reason: 'idle_contractor'
        });

        // Notify contractor
        await this.emailService.sendJobAssignmentNotification(contractorId, job);

        // WebSocket notification
        this.wsService.sendToContractor(contractorId, {
          type: 'queue:auto-assigned',
          data: {
            job,
            message: 'A new job has been automatically assigned to you'
          }
        });

        console.log(`Auto-assigned job ${job.jobNumber} to idle contractor ${contractorId}`);
      }
    } catch (error) {
      console.error('Error assigning job to idle contractor:', error);
    }
  }

  /**
   * Notify contractor that their next job is starting
   */
  async notifyNextJobStarting(contractorId: string, job: any) {
    try {
      const contractor = await this.storage.getUser(contractorId);
      if (!contractor) return;

      // Send email
      await this.emailService.sendJobStartingNotification(contractor.email, {
        contractorName: `${contractor.firstName} ${contractor.lastName}`,
        jobNumber: job.jobNumber,
        customerName: job.customerName,
        locationAddress: job.locationAddress,
        serviceType: job.serviceTypeId
      });

      // Send push notification if available
      // TODO: Implement push notifications
    } catch (error) {
      console.error('Error notifying next job starting:', error);
    }
  }

  /**
   * Handle contractor going offline
   */
  async onContractorOffline(contractorId: string) {
    try {
      // Get contractor's current queue
      const queue = await this.storage.getContractorQueue(contractorId);
      const queuedJobs = queue.filter(q => q.status === 'queued');

      if (queuedJobs.length > 0) {
        // Reassign queued jobs to other contractors
        for (const entry of queuedJobs) {
          const job = await this.storage.getJob(entry.jobId);
          if (job) {
            // Find another contractor
            const shortestQueue = await this.storage.findShortestQueue(
              job.serviceTypeId,
              job.location as { lat: number; lng: number }
            );

            if (shortestQueue && shortestQueue.contractorId !== contractorId) {
              // Remove from current contractor's queue
              await this.storage.removeFromQueue(entry.jobId);
              
              // Add to new contractor's queue
              await this.storage.addToContractorQueue(
                shortestQueue.contractorId,
                entry.jobId,
                undefined,
                {
                  reassignedFrom: contractorId,
                  reason: 'contractor_offline'
                }
              );

              console.log(`Reassigned job ${job.jobNumber} from offline contractor ${contractorId} to ${shortestQueue.contractorId}`);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error handling contractor offline:', error);
    }
  }

  /**
   * Handle job cancellation
   */
  async onJobCancelled(jobId: string) {
    try {
      // Find and remove from queue
      const queueEntry = await db.select()
        .from(contractorJobQueue)
        .where(eq(contractorJobQueue.jobId, jobId))
        .limit(1);

      if (queueEntry.length > 0) {
        const entry = queueEntry[0];
        
        // Remove from queue
        await this.storage.removeFromQueue(jobId);

        // If it was current job, process next
        if (entry.status === 'assigned' || entry.status === 'current') {
          await this.storage.processNextInQueue(entry.contractorId);
        }

        // Notify contractor
        this.wsService.sendToContractor(entry.contractorId, {
          type: 'queue:job-cancelled',
          data: {
            jobId,
            message: 'A job in your queue has been cancelled'
          }
        });
      }
    } catch (error) {
      console.error('Error handling job cancellation:', error);
    }
  }

  /**
   * Get queue analytics
   */
  async getQueueAnalytics() {
    try {
      const analytics = {
        totalQueued: 0,
        averageQueueDepth: 0,
        averageWaitTime: 0,
        longestQueue: { contractorId: '', length: 0 },
        shortestQueue: { contractorId: '', length: 0 },
        expiredToday: 0,
        reassignedToday: 0
      };

      // Get all active queues
      const allQueues = await this.storage.getAllActiveQueues();
      
      if (allQueues.length > 0) {
        const queueLengths = allQueues.map(q => q.queueLength);
        analytics.totalQueued = queueLengths.reduce((sum, len) => sum + len, 0);
        analytics.averageQueueDepth = analytics.totalQueued / allQueues.length;
        
        // Find longest and shortest queues
        let maxLength = 0, minLength = Infinity;
        for (const queue of allQueues) {
          if (queue.queueLength > maxLength) {
            maxLength = queue.queueLength;
            analytics.longestQueue = {
              contractorId: queue.contractorId,
              length: queue.queueLength
            };
          }
          if (queue.queueLength < minLength && queue.queueLength > 0) {
            minLength = queue.queueLength;
            analytics.shortestQueue = {
              contractorId: queue.contractorId,
              length: queue.queueLength
            };
          }
        }
      }

      // Count expired and reassigned today
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const expiredToday = await db.select({ count: contractorJobQueue.id })
        .from(contractorJobQueue)
        .where(and(
          eq(contractorJobQueue.status, 'expired'),
          gte(contractorJobQueue.expiredAt, todayStart)
        ));

      const reassignedToday = await db.select({ count: contractorJobQueue.id })
        .from(contractorJobQueue)
        .where(and(
          eq(contractorJobQueue.status, 'reassigned'),
          gte(contractorJobQueue.updatedAt, todayStart)
        ));

      analytics.expiredToday = expiredToday[0]?.count || 0;
      analytics.reassignedToday = reassignedToday[0]?.count || 0;

      return analytics;
    } catch (error) {
      console.error('Error getting queue analytics:', error);
      return null;
    }
  }
}