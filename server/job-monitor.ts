import { storage } from './storage';
import { emailService } from './services/email-service';

class JobMonitor {
  private monitoringInterval: NodeJS.Timeout | null = null;
  private alertedJobs = new Set<string>(); // Track jobs we've already alerted about

  public start() {
    console.log('[JobMonitor] Starting job monitoring service');
    
    // Check for unassigned jobs every minute
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.checkUnassignedJobs();
      } catch (error) {
        console.error('[JobMonitor] Error checking unassigned jobs:', error);
      }
    }, 60000); // Check every minute

    // Run initial check
    this.checkUnassignedJobs();
  }

  public stop() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('[JobMonitor] Job monitoring service stopped');
    }
  }

  private async checkUnassignedJobs() {
    console.log('[JobMonitor] Checking for unassigned jobs');
    
    try {
      // Get all new (unassigned) jobs
      const unassignedJobs = await storage.findJobs({
        status: 'new',
        orderBy: 'createdAt',
        orderDir: 'asc'
      });

      console.log(`[JobMonitor] Found ${unassignedJobs.length} unassigned jobs`);

      for (const job of unassignedJobs) {
        const createdAt = new Date(job.createdAt);
        const now = new Date();
        const minutesWaiting = Math.floor((now.getTime() - createdAt.getTime()) / 60000);

        // Get customer info first (needed for all notifications)
        let customer = null;
        if (job.customerId) {
          customer = await storage.getUser(job.customerId);
        } else if (job.customerName && job.customerPhone) {
          customer = {
            firstName: job.customerName.split(' ')[0] || 'Customer',
            lastName: job.customerName.split(' ').slice(1).join(' ') || '',
            email: null
          };
        }

        // Alert admin if job has been unassigned for more than 5 minutes
        if (minutesWaiting >= 5 && !this.alertedJobs.has(job.id)) {
          console.log(`[JobMonitor] Job ${job.jobNumber} has been unassigned for ${minutesWaiting} minutes`);

          // Send alert to admin
          await emailService.sendUnassignedJobAlert(job, customer);
          
          // Mark as alerted so we don't send duplicate alerts
          this.alertedJobs.add(job.id);
          
          console.log(`[JobMonitor] Alert sent to admin for job ${job.jobNumber}`);
        }

        // Send pending notification to customer after 3 minutes if not sent yet
        // Track notification sent status in memory for now
        const notificationKey = `${job.id}_pending_sent`;
        if (minutesWaiting >= 3 && customer?.email && !this.alertedJobs.has(notificationKey)) {
          console.log(`[JobMonitor] Sending pending notification to customer for job ${job.jobNumber}`);
          
          // Send the notification
          await emailService.sendPendingJobNotification(job, customer);
          
          // Mark notification as sent in memory
          this.alertedJobs.add(notificationKey);
          console.log(`[JobMonitor] Notification sent for job ${job.jobNumber}`);
        }
      }

      // Clean up alerted jobs that are no longer unassigned
      const unassignedJobIds = new Set(unassignedJobs.map(j => j.id));
      for (const jobId of this.alertedJobs) {
        if (!unassignedJobIds.has(jobId)) {
          this.alertedJobs.delete(jobId);
        }
      }
    } catch (error) {
      console.error('[JobMonitor] Error in checkUnassignedJobs:', error);
    }
  }

  // Auto-assign jobs that have been waiting too long
  public async autoAssignWaitingJobs() {
    console.log('[JobMonitor] Checking for jobs needing auto-assignment');
    
    try {
      const unassignedJobs = await storage.findJobs({
        status: 'new',
        orderBy: 'createdAt',
        orderDir: 'asc',
        limit: 10 // Process up to 10 jobs at a time
      });

      for (const job of unassignedJobs) {
        const createdAt = new Date(job.createdAt);
        const now = new Date();
        const minutesWaiting = Math.floor((now.getTime() - createdAt.getTime()) / 60000);

        // Auto-assign after 10 minutes
        if (minutesWaiting >= 10) {
          console.log(`[JobMonitor] Auto-assigning job ${job.jobNumber} after ${minutesWaiting} minutes`);
          
          // Extract coordinates from job location
          let jobLat, jobLon;
          if (job.location && typeof job.location === 'object') {
            const location = job.location as any;
            jobLat = location.lat || location.latitude;
            jobLon = location.lon || location.lng || location.longitude;
          }
          
          // Get available contractors using round-robin
          const availableContractors = await storage.getAvailableContractorsForAssignment(jobLat, jobLon);
          
          if (availableContractors.length > 0) {
            const selectedContractor = availableContractors[0];
            console.log(`[JobMonitor] Auto-assigning to contractor: ${selectedContractor.name}`);
            
            // Assign the contractor
            await storage.assignContractorToJob(job.id, selectedContractor.id);
            
            // Get contractor and customer details for emails
            const contractor = await storage.getUser(selectedContractor.id);
            const contractorProfile = await storage.getContractorProfile(selectedContractor.id);
            
            let customer = null;
            if (job.customerId) {
              customer = await storage.getUser(job.customerId);
            }
            
            // Send email notifications
            if (contractor && contractorProfile) {
              const contractorData = {
                ...contractor,
                ...contractorProfile
              };
              
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
            
            console.log(`[JobMonitor] Successfully auto-assigned job ${job.jobNumber}`);
          } else {
            console.log(`[JobMonitor] No contractors available for auto-assignment of job ${job.jobNumber}`);
          }
        }
      }
    } catch (error) {
      console.error('[JobMonitor] Error in autoAssignWaitingJobs:', error);
    }
  }
}

// Export singleton instance
export const jobMonitor = new JobMonitor();
export default jobMonitor;