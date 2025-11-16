import { storage } from './storage';
import { emailService } from './services/email-service';
import { executeWithRetry } from './db';

class JobMonitor {
  private monitoringInterval: NodeJS.Timeout | null = null;
  
  // Cooldown periods in milliseconds
  private readonly ADMIN_ALERT_COOLDOWN = 60 * 60 * 1000; // 1 hour
  private readonly CUSTOMER_NOTIFICATION_COOLDOWN = 30 * 60 * 1000; // 30 minutes

  // Enhanced contractor availability check
  private async isContractorAvailable(contractorId: string, profile: any): Promise<boolean> {
    if (!profile) {
      console.log(`[JobMonitor] No profile found for contractor ${contractorId}`);
      return false;
    }

    // Check 1: Online status
    if (!profile.isOnline) {
      console.log(`[JobMonitor] Contractor ${contractorId} is offline`);
      return false;
    }

    // Check 2: Basic availability flag
    if (!profile.isAvailable) {
      console.log(`[JobMonitor] Contractor ${contractorId} is not available`);
      return false;
    }

    // Check 3: Working hours
    if (profile.workingHours) {
      const now = new Date();
      const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];
      const dayHours = profile.workingHours[dayOfWeek];
      
      if (dayHours && dayHours.enabled) {
        const currentTime = now.getHours() * 60 + now.getMinutes(); // Convert to minutes
        const [startHour, startMin] = dayHours.start.split(':').map(Number);
        const [endHour, endMin] = dayHours.end.split(':').map(Number);
        const startTime = startHour * 60 + startMin;
        const endTime = endHour * 60 + endMin;
        
        if (currentTime < startTime || currentTime > endTime) {
          console.log(`[JobMonitor] Contractor ${contractorId} is outside working hours`);
          return false;
        }
      } else if (dayHours && !dayHours.enabled) {
        console.log(`[JobMonitor] Contractor ${contractorId} doesn't work on ${dayOfWeek}`);
        return false;
      }
    }

    // Check 4: Scheduled time off/vacation
    try {
      const vacations = await storage.findVacationRequests({
        contractorId,
        status: ['approved'],
        startDate: new Date().toISOString()
      });
      
      const now = new Date();
      const isOnVacation = vacations.some((vacation: any) => {
        const start = new Date(vacation.startDate);
        const end = new Date(vacation.endDate);
        return now >= start && now <= end;
      });
      
      if (isOnVacation) {
        console.log(`[JobMonitor] Contractor ${contractorId} is on vacation`);
        return false;
      }
    } catch (error) {
      console.error(`[JobMonitor] Error checking vacation for contractor ${contractorId}:`, error);
    }

    // Check 5: Current job load vs maximum
    if (profile.maxJobsPerDay) {
      try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        
        const todayJobs = await storage.findJobs({
          contractorId,
          status: ['assigned', 'en_route', 'on_site', 'completed'],
          createdAt: todayStart.toISOString()
        });
        
        if (todayJobs.length >= profile.maxJobsPerDay) {
          console.log(`[JobMonitor] Contractor ${contractorId} has reached max jobs per day (${todayJobs.length}/${profile.maxJobsPerDay})`);
          return false;
        }
      } catch (error) {
        console.error(`[JobMonitor] Error checking job load for contractor ${contractorId}:`, error);
      }
    }

    console.log(`[JobMonitor] Contractor ${contractorId} is available for assignment`);
    return true;
  }

  public start() {
    console.log('[JobMonitor] Starting job monitoring service');
    console.log('[JobMonitor] Cooldown periods: Admin alerts = 1 hour, Customer notifications = 30 minutes');
    
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
      // Get all new (unassigned) jobs with retry logic
      const unassignedJobs = await executeWithRetry(
        () => storage.findJobs({
          status: 'new',
          orderBy: 'createdAt',
          orderDir: 'asc'
        }),
        { retries: 3 }
      );

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
            email: job.customerEmail || null // Use job.customerEmail from database
          };
        }

        // Alert admin if job has been unassigned for more than 5 minutes
        // Check database cooldown instead of in-memory tracking
        if (minutesWaiting >= 5) {
          const shouldSendAdminAlert = !job.lastAdminAlertAt || 
            (now.getTime() - new Date(job.lastAdminAlertAt).getTime() >= this.ADMIN_ALERT_COOLDOWN);
          
          if (shouldSendAdminAlert) {
            console.log(`[JobMonitor] Job ${job.jobNumber} has been unassigned for ${minutesWaiting} minutes - sending admin alert`);
            
            try {
              // Send alert to admin
              await emailService.sendUnassignedJobAlert(job, customer);
              
              // Update database with alert timestamp
              await storage.updateJob(job.id, { lastAdminAlertAt: new Date() });
              
              console.log(`[JobMonitor] Admin alert sent and database updated for job ${job.jobNumber}`);
            } catch (error) {
              console.error(`[JobMonitor] Failed to send admin alert for job ${job.jobNumber}:`, error);
            }
          } else {
            const timeSinceLastAlert = Math.floor((now.getTime() - new Date(job.lastAdminAlertAt!).getTime()) / 60000);
            console.log(`[JobMonitor] Skipping admin alert for job ${job.jobNumber} - last alert was ${timeSinceLastAlert} minutes ago (cooldown: 60 min)`);
          }
        }

        // Send pending notification to customer after 3 minutes if customer email exists
        const customerEmail = customer?.email || job.customerEmail;
        if (minutesWaiting >= 3 && customerEmail) {
          const shouldSendCustomerNotification = !job.lastCustomerNotificationAt || 
            (now.getTime() - new Date(job.lastCustomerNotificationAt).getTime() >= this.CUSTOMER_NOTIFICATION_COOLDOWN);
          
          if (shouldSendCustomerNotification) {
            console.log(`[JobMonitor] Sending pending notification to customer for job ${job.jobNumber} (email: ${customerEmail})`);
            
            try {
              // Ensure customer object has the email
              const customerWithEmail = customer || {
                firstName: job.customerName?.split(' ')[0] || 'Customer',
                lastName: job.customerName?.split(' ').slice(1).join(' ') || '',
                email: customerEmail
              };
              
              // Send the notification
              await emailService.sendPendingJobNotification(job, customerWithEmail);
              
              // Update database with notification timestamp
              await storage.updateJob(job.id, { lastCustomerNotificationAt: new Date() });
              
              console.log(`[JobMonitor] Customer notification sent and database updated for job ${job.jobNumber}`);
            } catch (error) {
              console.error(`[JobMonitor] Failed to send customer notification for job ${job.jobNumber}:`, error);
            }
          } else {
            const timeSinceLastNotification = Math.floor((now.getTime() - new Date(job.lastCustomerNotificationAt!).getTime()) / 60000);
            console.log(`[JobMonitor] Skipping customer notification for job ${job.jobNumber} - last notification was ${timeSinceLastNotification} minutes ago (cooldown: 30 min)`);
          }
        } else if (minutesWaiting >= 3 && !customerEmail) {
          // Log that we can't send notification due to missing email
          console.log(`[JobMonitor] Cannot send customer notification for job ${job.jobNumber} - no customer email available`);
        }
      }
    } catch (error) {
      console.error('[JobMonitor] Error in checkUnassignedJobs:', error);
    }
  }

  // Auto-assign jobs that have been waiting too long using AI-based assignment
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
          
          let selectedContractorId: string | null = null;
          let assignmentMethod: 'AI' | 'round-robin' = 'AI';
          
          // Try AI-based assignment first
          try {
            console.log(`[JobMonitor] Attempting AI-based assignment for job ${job.jobNumber}`);
            
            // Get AI recommendation for best contractor
            const optimalContractor = await storage.getOptimalContractor(job.id);
            
            if (optimalContractor && optimalContractor.score >= 60) {
              selectedContractorId = optimalContractor.contractorId;
              console.log(`[JobMonitor] AI selected contractor: ${selectedContractorId} with score ${optimalContractor.score}`);
              console.log(`[JobMonitor] AI recommendation: ${optimalContractor.recommendation}`);
              
              // Try next best contractors if first one doesn't accept
              if (!selectedContractorId) {
                const allScores = await storage.getAiAssignmentScores(job.id);
                
                // Progressive assignment - try top 3 contractors with good scores
                const topContractors = allScores
                  .filter(s => s.score >= 60)
                  .slice(0, 3);
                
                for (const candidateScore of topContractors) {
                  console.log(`[JobMonitor] Trying contractor ${candidateScore.contractorId} with score ${candidateScore.score}`);
                  
                  // Check if contractor is still available
                  const profile = await storage.getContractorProfile(candidateScore.contractorId);
                  
                  // Enhanced availability check
                  if (await this.isContractorAvailable(candidateScore.contractorId, profile)) {
                    selectedContractorId = candidateScore.contractorId;
                    console.log(`[JobMonitor] Selected available contractor: ${selectedContractorId}`);
                    break;
                  }
                }
              }
            } else {
              console.log(`[JobMonitor] AI scoring insufficient or no suitable contractor found`);
            }
          } catch (aiError) {
            console.error(`[JobMonitor] AI assignment failed, falling back to round-robin:`, aiError);
            assignmentMethod = 'round-robin';
          }
          
          // Fallback to round-robin if AI assignment failed or didn't find anyone
          if (!selectedContractorId) {
            assignmentMethod = 'round-robin';
            console.log(`[JobMonitor] Using round-robin fallback for job ${job.jobNumber}`);
            
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
              selectedContractorId = availableContractors[0].id;
              console.log(`[JobMonitor] Round-robin selected contractor: ${availableContractors[0].name}`);
            }
          }
          
          if (selectedContractorId) {
            console.log(`[JobMonitor] Auto-assigning job ${job.jobNumber} to contractor ${selectedContractorId} via ${assignmentMethod}`);
            
            // Assign the contractor
            await storage.assignContractorToJob(job.id, selectedContractorId);
            
            // Update AI assignment score if AI was used
            if (assignmentMethod === 'AI') {
              const scores = await storage.getAiAssignmentScores(job.id);
              const assignedScore = scores.find(s => s.contractorId === selectedContractorId);
              if (assignedScore) {
                await storage.updateAiAssignmentScore(assignedScore.id, {
                  wasAssigned: true,
                  assignmentMethod: 'auto-AI'
                });
              }
            }
            
            // Get contractor and customer details for emails
            const contractor = await storage.getUser(selectedContractorId);
            const contractorProfile = await storage.getContractorProfile(selectedContractorId);
            
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
            
            console.log(`[JobMonitor] Successfully auto-assigned job ${job.jobNumber} using ${assignmentMethod}`);
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