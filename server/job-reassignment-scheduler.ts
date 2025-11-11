import * as cron from 'node-cron';
import { storage } from './storage';
import { emailService } from './services/email-service';
import { trackingWSServer } from './websocket';

class JobReassignmentScheduler {
  private cronJob: cron.ScheduledTask | null = null;
  private isRunning = false;
  
  constructor() {
    console.log('[JobReassignment] Scheduler initialized');
  }

  // Start the scheduler
  start() {
    if (this.cronJob) {
      console.log('[JobReassignment] Scheduler already running');
      return;
    }

    // Run every 5 minutes
    this.cronJob = cron.schedule('*/5 * * * *', async () => {
      if (this.isRunning) {
        console.log('[JobReassignment] Previous check still running, skipping');
        return;
      }

      try {
        this.isRunning = true;
        console.log('[JobReassignment] Starting scheduled reassignment check');
        await this.checkAndReassignJobs();
      } catch (error) {
        console.error('[JobReassignment] Error in scheduled check:', error);
      } finally {
        this.isRunning = false;
      }
    });

    this.cronJob.start();
    console.log('[JobReassignment] Scheduler started - checking every 5 minutes');
    
    // Run an initial check after 30 seconds
    setTimeout(() => {
      this.checkAndReassignJobs();
    }, 30000);
  }

  // Stop the scheduler
  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      console.log('[JobReassignment] Scheduler stopped');
    }
  }

  // Main function to check and reassign staled jobs
  private async checkAndReassignJobs() {
    try {
      console.log('[JobReassignment] Checking for staled jobs...');
      
      // Call the storage function to check and reassign staled jobs
      const reassignments = await storage.checkAndReassignStaledJobs();
      
      if (reassignments.length === 0) {
        console.log('[JobReassignment] No staled jobs found');
        return;
      }

      console.log(`[JobReassignment] Processing ${reassignments.length} reassignments`);
      
      // Send notifications for each reassignment
      for (const reassignment of reassignments) {
        try {
          await this.sendReassignmentNotifications(reassignment);
        } catch (error) {
          console.error(`[JobReassignment] Error sending notifications for job ${reassignment.jobId}:`, error);
        }
      }
      
      console.log('[JobReassignment] Reassignment check completed');
      
    } catch (error) {
      console.error('[JobReassignment] Error in checkAndReassignJobs:', error);
    }
  }

  // Send notifications about reassignment
  private async sendReassignmentNotifications(reassignment: {
    jobId: string;
    oldContractorId: string;
    newContractorId: string;
    attemptNumber: number;
  }) {
    try {
      // Get job details
      const job = await storage.getJob(reassignment.jobId);
      if (!job) {
        console.error(`[JobReassignment] Job ${reassignment.jobId} not found for notifications`);
        return;
      }

      // Get contractor details
      const [oldContractor, newContractor] = await Promise.all([
        storage.getUser(reassignment.oldContractorId),
        storage.getUser(reassignment.newContractorId)
      ]);

      const [oldContractorProfile, newContractorProfile] = await Promise.all([
        storage.getContractorProfile(reassignment.oldContractorId),
        storage.getContractorProfile(reassignment.newContractorId)
      ]);

      // Get customer details
      let customer = null;
      if (job.customerId) {
        customer = await storage.getUser(job.customerId);
      }

      // Send email to old contractor about job being reassigned
      if (oldContractor && oldContractor.email) {
        await emailService.sendEmail({
          to: oldContractor.email,
          subject: `Job #${job.jobNumber} Reassigned`,
          text: `The job #${job.jobNumber} has been reassigned to another contractor due to non-response. 
                 This job required acceptance within 15 minutes of assignment.
                 Please ensure you respond to future job assignments promptly to maintain your assignment priority.`,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
              <h2>Job Reassigned</h2>
              <p>The job #<strong>${job.jobNumber}</strong> has been reassigned to another contractor due to non-response.</p>
              <p>This job required acceptance within 15 minutes of assignment.</p>
              <p><strong>Important:</strong> Please ensure you respond to future job assignments promptly to maintain your assignment priority.</p>
              <hr>
              <p style="color: #666; font-size: 12px;">This is an automated notification from TruckFixGo.</p>
            </div>
          `
        });
        console.log(`[JobReassignment] Sent reassignment notification to old contractor ${oldContractor.email}`);
      }

      // Send email to new contractor about the new assignment
      if (newContractor && newContractorProfile) {
        const contractorData = {
          ...newContractor,
          ...newContractorProfile
        };
        
        console.log(`[JobReassignment] Sending assignment email to new contractor ${newContractor.email}`);
        
        await emailService.sendJobAssignmentNotifications(
          {
            ...job,
            jobNumber: job.jobNumber,
            address: job.locationAddress || 'Location provided',
            issueDescription: job.description || 'Service requested',
            serviceType: 'Emergency Roadside Assistance',
            estimatedPrice: job.estimatedPrice || 0
          },
          contractorData,
          customer
        );
      }

      // Send WebSocket notification to new contractor
      try {
        await trackingWSServer.broadcastJobAssignment(reassignment.jobId, reassignment.newContractorId, {
          jobId: job.id,
          jobNumber: job.jobNumber,
          customerName: customer ? `${customer.firstName} ${customer.lastName}` : job.customerName || 'Customer',
          address: job.locationAddress || 'Location provided',
          description: job.description || 'Service requested',
          estimatedPrice: job.estimatedPrice || 0,
          status: job.status,
          attemptNumber: reassignment.attemptNumber,
          isReassignment: true
        });
        console.log(`[JobReassignment] Sent WebSocket notification to new contractor ${reassignment.newContractorId}`);
      } catch (wsError) {
        console.error('[JobReassignment] WebSocket notification failed:', wsError);
      }

      // Send WebSocket notification to old contractor about removal
      try {
        await trackingWSServer.broadcastToUser(reassignment.oldContractorId, {
          type: 'JOB_REASSIGNED',
          payload: {
            jobId: job.id,
            jobNumber: job.jobNumber,
            reason: 'Non-response within required time',
            timestamp: new Date().toISOString()
          }
        });
        console.log(`[JobReassignment] Sent removal notification to old contractor ${reassignment.oldContractorId}`);
      } catch (wsError) {
        console.error('[JobReassignment] WebSocket removal notification failed:', wsError);
      }

    } catch (error) {
      console.error(`[JobReassignment] Error sending reassignment notifications:`, error);
    }
  }

  // Manual trigger for immediate check (useful for testing)
  async triggerManualCheck() {
    console.log('[JobReassignment] Manual reassignment check triggered');
    await this.checkAndReassignJobs();
  }
}

// Export singleton instance
export const jobReassignmentScheduler = new JobReassignmentScheduler();