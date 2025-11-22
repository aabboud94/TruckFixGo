import assert from 'node:assert/strict';
import { createAssignmentTimeoutManager } from './assignment-timeout-manager';
import { type Job } from '@shared/schema';

function createJob(overrides: Partial<Job>): Job {
  return {
    id: overrides.id || 'job-1',
    jobNumber: 'JOB-TEST',
    customerId: overrides.customerId || 'customer-1',
    status: overrides.status || 'assigned',
    contractorId: overrides.contractorId || 'contractor-1',
    serviceTypeId: overrides.serviceTypeId || 'service-1',
    jobType: overrides.jobType || 'emergency',
    assignmentAttempts: overrides.assignmentAttempts ?? 0,
    lastAssignmentAttemptAt: overrides.lastAssignmentAttemptAt,
    assignmentMethod: overrides.assignmentMethod || 'round_robin',
    createdAt: overrides.createdAt || new Date(),
    updatedAt: overrides.updatedAt || new Date(),
    // Optional fields
    location: overrides.location || { lat: 0, lng: 0 },
    assignmentExpiresAt: overrides.assignmentExpiresAt,
    assignedAt: overrides.assignedAt,
    enRouteAt: overrides.enRouteAt,
    arrivedAt: overrides.arrivedAt,
    completedAt: overrides.completedAt,
    cancelledAt: overrides.cancelledAt,
    estimatedArrival: overrides.estimatedArrival,
    contractorLocation: overrides.contractorLocation,
    contractorLocationUpdatedAt: overrides.contractorLocationUpdatedAt,
    description: overrides.description,
    urgencyLevel: overrides.urgencyLevel ?? 1,
    requiresWaterSource: overrides.requiresWaterSource ?? false,
    hasWaterSource: overrides.hasWaterSource,
    estimatedPrice: overrides.estimatedPrice,
    finalPrice: overrides.finalPrice,
    laborHours: overrides.laborHours,
    partsTotal: overrides.partsTotal,
    surchargeTotal: overrides.surchargeTotal,
    taxTotal: overrides.taxTotal,
    tipAmount: overrides.tipAmount,
    allowBidding: overrides.allowBidding ?? false,
    biddingDeadline: overrides.biddingDeadline,
    minimumBidCount: overrides.minimumBidCount ?? 3,
    maximumBidAmount: overrides.maximumBidAmount,
    reservePrice: overrides.reservePrice,
    winningBidId: overrides.winningBidId,
    biddingStrategy: overrides.biddingStrategy || 'manual',
    autoAcceptBids: overrides.autoAcceptBids || 'never',
    biddingDuration: overrides.biddingDuration ?? 120,
    bidCount: overrides.bidCount ?? 0,
    lowestBidAmount: overrides.lowestBidAmount,
    averageBidAmount: overrides.averageBidAmount,
    aiDamageAnalysis: overrides.aiDamageAnalysis,
    aiChatHistory: overrides.aiChatHistory,
    completionNotes: overrides.completionNotes,
    customerSignature: overrides.customerSignature,
    rating: overrides.rating,
    reviewText: overrides.reviewText,
    lastAdminAlertAt: overrides.lastAdminAlertAt,
    lastCustomerNotificationAt: overrides.lastCustomerNotificationAt,
    customerEmail: overrides.customerEmail,
    serviceAreaId: overrides.serviceAreaId,
    fleetAccountId: overrides.fleetAccountId,
    driverId: overrides.driverId,
    jobStatusReason: overrides.jobStatusReason,
    vehicleId: overrides.vehicleId,
    serviceRequestId: overrides.serviceRequestId,
    cityId: overrides.cityId,
    locationAddress: overrides.locationAddress,
    locationNotes: overrides.locationNotes,
    vin: overrides.vin,
    unitNumber: overrides.unitNumber,
    vehicleMake: overrides.vehicleMake,
    vehicleModel: overrides.vehicleModel,
    vehicleYear: overrides.vehicleYear,
    scheduledAt: overrides.scheduledAt,
    contractorPreferredArrival: overrides.contractorPreferredArrival,
    payoutStatus: overrides.payoutStatus,
    payoutAmount: overrides.payoutAmount,
    payoutMethod: overrides.payoutMethod,
    payoutInitiatedAt: overrides.payoutInitiatedAt,
    payoutCompletedAt: overrides.payoutCompletedAt,
    blacklistStatus: overrides.blacklistStatus,
    queueStatus: overrides.queueStatus,
    metadata: overrides.metadata
  } as Job;
}

async function testReassignsAfterTimeout() {
  const job = createJob({ id: 'job-rr', contractorId: 'c1' });
  const jobs = new Map<string, Job>([[job.id, job]]);
  const notifications: any[] = [];
  const history: any[] = [];

  const storage = {
    getJob: async (id: string) => jobs.get(id),
    updateJob: async (id: string, updates: Partial<Job>) => {
      const existing = jobs.get(id);
      if (!existing) return undefined;
      const updated = { ...existing, ...updates } as Job;
      jobs.set(id, updated);
      return updated;
    },
    getAvailableContractorsForAssignment: async () => [
      { id: 'c1' },
      { id: 'c2' }
    ],
    assignJobToContractor: async (jobId: string, contractorId: string) => {
      const existing = jobs.get(jobId);
      if (!existing) return null;
      const updated = { ...existing, contractorId, status: 'assigned', assignmentMethod: 'round_robin' } as Job;
      jobs.set(jobId, updated);
      return updated;
    }
  };

  const manager = createAssignmentTimeoutManager({
    storage: storage as any,
    recordStatusHistory: async (entry) => history.push(entry),
    notifyReassignment: async (payload) => notifications.push(payload)
  }, { timeoutMs: 20 });

  manager.schedule(job, 'c1');
  await manager.runTimeoutNow(job.id, 'c1');

  const updatedJob = jobs.get(job.id)!;
  assert.equal(updatedJob.contractorId, 'c2');
  assert.equal(updatedJob.status, 'assigned');
  assert.ok(updatedJob.assignmentExpiresAt);
  assert.equal(history.length, 1);
  assert.equal(notifications[0].fromContractorId, 'c1');
}

async function testStopsWhenPoolExhausted() {
  const job = createJob({ id: 'job-empty', contractorId: 'only' });
  const jobs = new Map<string, Job>([[job.id, job]]);
  const notifications: any[] = [];

  const storage = {
    getJob: async (id: string) => jobs.get(id),
    updateJob: async (id: string, updates: Partial<Job>) => {
      const existing = jobs.get(id);
      if (!existing) return undefined;
      const updated = { ...existing, ...updates } as Job;
      jobs.set(id, updated);
      return updated;
    },
    getAvailableContractorsForAssignment: async () => [
      { id: 'only' }
    ],
    assignJobToContractor: async (jobId: string, contractorId: string) => {
      const existing = jobs.get(jobId);
      if (!existing) return null;
      const updated = { ...existing, contractorId, status: 'assigned', assignmentMethod: 'round_robin' } as Job;
      jobs.set(jobId, updated);
      return updated;
    }
  };

  const manager = createAssignmentTimeoutManager({
    storage: storage as any,
    recordStatusHistory: async () => {},
    notifyReassignment: async (payload) => notifications.push(payload)
  }, { timeoutMs: 10 });

  manager.schedule(job, 'only');
  await manager.runTimeoutNow(job.id, 'only');

  const updatedJob = jobs.get(job.id)!;
  assert.equal(updatedJob.contractorId, null);
  assert.equal(updatedJob.status, 'new');
  assert.equal(notifications[0].fromContractorId, 'only');
}

async function run() {
  await testReassignsAfterTimeout();
  await testStopsWhenPoolExhausted();
  console.log('assignment-timeout-manager tests passed');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

