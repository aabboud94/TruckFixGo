import * as cron from 'node-cron';
import { PostgreSQLStorage } from './storage';
import { emailService } from './services/email-service';
import { trackingWSServer } from './websocket';
import { db, executeWithRetry } from './db';
import { contractorJobQueue, jobs, contractorProfiles, users } from '@shared/schema';
import { and, eq, gte, lte, inArray, sql } from 'drizzle-orm';

export class QueueProcessingService {
  private storage: PostgreSQLStorage;
  private processingJobs: Set<string> = new Set();
  private assignmentTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(storage: PostgreSQLStorage) {
    this.storage = storage;
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

    // Check for auto-assignment timeouts every minute
    cron.schedule('* * * * *', () => {
      this.checkAutoAssignmentTimeouts();
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
        await trackingWSServer.broadcastJobAssignment(contractorId, contractorId, {
          type: 'queue:next-job',
          data: {
            job: result.nextJob,
            queueEntry: result.queueEntry,
            message: 'Your next job is now active'
          }
        });

        // Notify customer of contractor arrival
        if (result.nextJob.customerId) {
          const customer = await this.storage.getUser(result.nextJob.customerId);
          if (customer) {
            await emailService.sendEmail(customer.email, 'JOB_ASSIGNED_CUSTOMER', {
              customerName: `${customer.firstName} ${customer.lastName}`,
              contractorName: `Contractor`,
              contractorRating: 5.0,
              contractorTotalJobs: 0,
              eta: result.nextJob.estimatedArrival,
              jobId: result.nextJob.id
            });
          }
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

      // Find queued entries older than 2 hours with retry logic
      const expiredEntries = await executeWithRetry(
        () => db.select()
          .from(contractorJobQueue)
          .where(and(
            eq(contractorJobQueue.status, 'queued'),
            lte(contractorJobQueue.queuedAt, twoHoursAgo)
          )),
        { retries: 3 }
      );

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
            const newContractor = await this.storage.getUser(result.newContractorId);
            const customer = job.customerId ? await this.storage.getUser(job.customerId) : null;
            
            if (newContractor && customer) {
              await emailService.sendJobAssignmentNotifications(job, newContractor, customer);
            }

            // Notify customer of reassignment
            if (job.customerId && customer) {
              await emailService.sendEmail(customer.email, 'JOB_PENDING_CUSTOMER', {
                customerName: `${customer.firstName} ${customer.lastName}`,
                jobNumber: job.jobNumber
              });
            }

            // WebSocket notification
            await trackingWSServer.broadcastJobAssignment(result.newContractorId, result.newContractorId, {
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
      await emailService.sendEmail(contractor.email, 'JOB_PENDING_CUSTOMER', {
        customerName: `${contractor.firstName} ${contractor.lastName}`,
        jobNumber: job.jobNumber
      });

      // Send WebSocket notification
      await trackingWSServer.broadcastJobAssignment(queueEntry.contractorId, queueEntry.contractorId, {
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
        // Note: JobFilterOptions doesn't have serviceTypeId, we need to filter separately
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
        const contractor = await this.storage.getUser(contractorId);
        const customer = job.customerId ? await this.storage.getUser(job.customerId) : null;
        
        if (contractor && customer) {
          await emailService.sendJobAssignmentNotifications(job, contractor, customer);
        }

        // WebSocket notification
        await trackingWSServer.broadcastJobAssignment(contractorId, contractorId, {
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
      await emailService.sendEmail(contractor.email, 'JOB_ASSIGNED_CONTRACTOR', {
        contractorName: `${contractor.firstName} ${contractor.lastName}`,
        jobNumber: job.jobNumber,
        customerName: job.customerName || 'Customer',
        address: job.locationAddress || 'Location provided',
        issueDescription: job.description || 'Service requested',
        serviceType: job.serviceTypeId,
        estimatedPrice: job.estimatedPrice || 0
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
        await trackingWSServer.broadcastJobAssignment(entry.contractorId, entry.contractorId, {
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

      const expiredToday = await db.select({ count: sql`count(*)` })
        .from(contractorJobQueue)
        .where(and(
          eq(contractorJobQueue.status, 'expired'),
          gte(contractorJobQueue.expiredAt, todayStart)
        ));

      const reassignedToday = await db.select({ count: sql`count(*)` })
        .from(contractorJobQueue)
        .where(and(
          eq(contractorJobQueue.status, 'reassigned'),
          gte(contractorJobQueue.updatedAt, todayStart)
        ));

      analytics.expiredToday = parseInt(expiredToday[0]?.count as string || '0');
      analytics.reassignedToday = parseInt(reassignedToday[0]?.count as string || '0');

      return analytics;
    } catch (error) {
      console.error('Error getting queue analytics:', error);
      return null;
    }
  }

  /**
   * Handle automatic job assignment with 3-minute timer
   */
  async autoAssignJob(jobId: string, isAutomatic: boolean = true): Promise<{ success: boolean; contractorId?: string }> {
    try {
      console.log(`[AutoAssign] Starting auto-assignment for job ${jobId}`);

      // Find best contractor using simplified logic
      const bestContractor = await this.storage.findBestContractorForJob(jobId);

      if (!bestContractor) {
        console.log('[AutoAssign] No available contractor found');
        return { success: false };
      }

      // Assign the job to the contractor
      const assignedJob = await db.update(jobs)
        .set({
          contractorId: bestContractor.userId,
          status: 'assigned',
          assignedAt: new Date(),
          assignmentMethod: 'ai_dispatch',
          autoAssigned: isAutomatic,
          updatedAt: new Date()
        })
        .where(eq(jobs.id, jobId))
        .returning();

      if (assignedJob.length === 0) {
        console.log('[AutoAssign] Failed to assign job');
        return { success: false };
      }

      console.log(`[AutoAssign] Job ${jobId} ${isAutomatic ? 'automatically' : 'manually'} assigned to contractor ${bestContractor.userId}`);

      // Notify contractor about the assignment
      const job = assignedJob[0];
      const contractor = await this.storage.getUser(bestContractor.userId);
      const customer = job.customerId ? await this.storage.getUser(job.customerId) : null;

      if (contractor) {
        await emailService.sendEmail(contractor.email, 'JOB_ASSIGNED_CONTRACTOR', {
          contractorName: `${contractor.firstName} ${contractor.lastName}`,
          jobNumber: job.jobNumber,
          jobId: job.id,
          serviceType: job.serviceType,
          customerName: customer ? `${customer.firstName} ${customer.lastName}` : 'Customer',
          assignedAutomatically: isAutomatic
        });

        // Send WebSocket notification
        await trackingWSServer.broadcastJobAssignment(bestContractor.userId, bestContractor.userId, {
          type: isAutomatic ? 'job:auto-assigned' : 'job:assigned',
          data: {
            job,
            assignedAutomatically: isAutomatic,
            message: isAutomatic 
              ? 'You have been automatically assigned a new job. Please accept within 3 minutes.' 
              : 'You have been assigned a new job.'
          }
        });
      }

      // Set a 3-minute timer for automatic assignments
      if (isAutomatic) {
        const timerId = setTimeout(() => {
          this.handleAssignmentTimeout(jobId, bestContractor.userId);
        }, 3 * 60 * 1000); // 3 minutes

        // Store the timer so we can cancel it if contractor accepts
        this.assignmentTimers.set(jobId, timerId);
      }

      return { success: true, contractorId: bestContractor.userId };
    } catch (error) {
      console.error('[AutoAssign] Error in auto-assignment:', error);
      return { success: false };
    }
  }

  /**
   * Handle assignment timeout after 3 minutes
   */
  async handleAssignmentTimeout(jobId: string, contractorId: string) {
    try {
      console.log(`[AutoAssign] Handling 3-minute timeout for job ${jobId}`);

      // Check if job is still assigned to same contractor and not accepted
      const job = await this.storage.getJob(jobId);
      if (!job || job.contractorId !== contractorId || job.status !== 'assigned') {
        console.log('[AutoAssign] Job already accepted or reassigned');
        return;
      }

      // Send reminder email
      const contractor = await this.storage.getUser(contractorId);
      if (contractor) {
        console.log(`[AutoAssign] Sending reminder email to contractor ${contractorId}`);
        await emailService.sendEmail(contractor.email, 'JOB_ASSIGNMENT_REMINDER', {
          contractorName: `${contractor.firstName} ${contractor.lastName}`,
          jobNumber: job.jobNumber,
          timeRemaining: '1 minute'
        });
      }

      // Wait another minute before reassigning
      setTimeout(async () => {
        // Check again if job is still not accepted
        const updatedJob = await this.storage.getJob(jobId);
        if (!updatedJob || updatedJob.contractorId !== contractorId || updatedJob.status !== 'assigned') {
          console.log('[AutoAssign] Job accepted after reminder');
          return;
        }

        // Reassign to next available ONLINE contractor
        console.log(`[AutoAssign] Reassigning job ${jobId} after timeout`);
        await this.reassignToNextOnlineContractor(jobId, contractorId);
      }, 60 * 1000); // 1 more minute

    } catch (error) {
      console.error('[AutoAssign] Error handling assignment timeout:', error);
    }
  }

  /**
   * Reassign job to next available online contractor
   */
  async reassignToNextOnlineContractor(jobId: string, currentContractorId: string) {
    try {
      const job = await this.storage.getJob(jobId);
      if (!job) return;

      let jobLat: number | undefined;
      let jobLon: number | undefined;

      if (job.location) {
        const location = job.location as any;
        jobLat = location.lat || location.latitude;
        jobLon = location.lng || location.lon || location.longitude;
      }

      // Get available contractors excluding the current one
      const contractors = await this.storage.getAvailableContractorsForAssignment(jobLat, jobLon);
      
      // Filter for ONLINE contractors only, excluding current contractor
      const onlineContractors = contractors.filter(c => 
        c.id !== currentContractorId && c.isOnline === true
      );

      if (onlineContractors.length === 0) {
        console.log('[AutoAssign] No online contractors available for reassignment');
        // Cancel the job if no online contractors available
        await db.update(jobs)
          .set({
            status: 'new',
            contractorId: null,
            assignedAt: null,
            updatedAt: new Date()
          })
          .where(eq(jobs.id, jobId));
        return;
      }

      const nextContractor = onlineContractors[0];
      console.log(`[AutoAssign] Reassigning job ${jobId} from ${currentContractorId} to ${nextContractor.id}`);

      // Update job with new contractor
      await db.update(jobs)
        .set({
          contractorId: nextContractor.id,
          assignedAt: new Date(),
          assignmentAttempts: (job.assignmentAttempts || 0) + 1,
          updatedAt: new Date()
        })
        .where(eq(jobs.id, jobId));

      // Notify old contractor about reassignment
      const oldContractor = await this.storage.getUser(currentContractorId);
      if (oldContractor) {
        await emailService.sendEmail(oldContractor.email, 'JOB_REASSIGNED_FROM', {
          contractorName: `${oldContractor.firstName} ${oldContractor.lastName}`,
          jobNumber: job.jobNumber,
          reason: 'Did not accept within 3 minutes'
        });
      }

      // Notify new contractor
      const newContractor = await this.storage.getUser(nextContractor.id);
      const customer = job.customerId ? await this.storage.getUser(job.customerId) : null;
      
      if (newContractor) {
        await emailService.sendEmail(newContractor.email, 'JOB_REASSIGNED_TO', {
          contractorName: `${newContractor.firstName} ${newContractor.lastName}`,
          jobNumber: job.jobNumber,
          jobId: job.id,
          serviceType: job.serviceType,
          customerName: customer ? `${customer.firstName} ${customer.lastName}` : 'Customer',
          assignedAutomatically: true
        });

        await trackingWSServer.broadcastJobAssignment(nextContractor.id, nextContractor.id, {
          type: 'job:reassigned',
          data: {
            job,
            assignedAutomatically: true,
            message: 'You have been reassigned a job. Please accept within 3 minutes.'
          }
        });
      }

      // Set new timer for the reassigned contractor
      const timerId = setTimeout(() => {
        this.handleAssignmentTimeout(jobId, nextContractor.id);
      }, 3 * 60 * 1000);

      this.assignmentTimers.set(jobId, timerId);

    } catch (error) {
      console.error('[AutoAssign] Error reassigning job:', error);
    }
  }

  /**
   * Cancel assignment timer when contractor accepts
   */
  cancelAssignmentTimer(jobId: string) {
    const timerId = this.assignmentTimers.get(jobId);
    if (timerId) {
      clearTimeout(timerId);
      this.assignmentTimers.delete(jobId);
      console.log(`[AutoAssign] Cancelled timer for job ${jobId}`);
    }
  }

  /**
   * Check for jobs that need auto-assignment timeout handling
   */
  async checkAutoAssignmentTimeouts() {
    try {
      // Find jobs that were auto-assigned more than 3 minutes ago and still not accepted
      const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000);
      
      const unacceptedJobs = await db.select()
        .from(jobs)
        .where(and(
          eq(jobs.status, 'assigned'),
          eq(jobs.autoAssigned, true),
          lte(jobs.assignedAt, threeMinutesAgo)
        ));

      for (const job of unacceptedJobs) {
        // Check if we're already handling this job
        if (!this.assignmentTimers.has(job.id) && job.contractorId) {
          console.log(`[AutoAssign] Found unaccepted job ${job.id}, handling timeout`);
          await this.handleAssignmentTimeout(job.id, job.contractorId);
        }
      }
    } catch (error) {
      console.error('[AutoAssign] Error checking auto-assignment timeouts:', error);
    }
  }
}