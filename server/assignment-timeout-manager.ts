import { type Job, type ContractorProfile } from "@shared/schema";

export interface AssignmentTimeoutOptions {
  timeoutMs?: number;
}

export interface AssignmentTimeoutDependencies {
  storage: {
    getJob: (id: string) => Promise<Job | undefined>;
    updateJob: (id: string, updates: Partial<Job>) => Promise<Job | undefined>;
    getAvailableContractorsForAssignment: (jobLat?: number, jobLon?: number) => Promise<any[]>;
    assignJobToContractor: (jobId: string, contractorId: string, method: 'round_robin' | 'manual' | 'ai_dispatch') => Promise<Job | null>;
  };
  recordStatusHistory: (params: {
    jobId: string;
    fromStatus?: Job["status"];
    toStatus: Job["status"];
    changedBy?: string;
    reason?: string;
  }) => Promise<void>;
  notifyReassignment: (params: {
    jobId: string;
    fromContractorId: string;
    toContractorId?: string;
    customerId?: string;
  }) => Promise<void>;
}

export const DEFAULT_TIMEOUT_MS = 3 * 60 * 1000;

export class AssignmentTimeoutManager {
  private timers = new Map<string, NodeJS.Timeout>();
  private attemptedContractors = new Map<string, Set<string>>();
  private readonly timeoutMs: number;

  constructor(
    private readonly deps: AssignmentTimeoutDependencies,
    options: AssignmentTimeoutOptions = {}
  ) {
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  schedule(job: Job, contractorId: string, attempted?: Set<string>) {
    if (job.status !== 'assigned') return;

    const expiresAt = new Date(Date.now() + this.timeoutMs);

    // Track attempted contractors
    const tried = attempted || this.attemptedContractors.get(job.id) || new Set<string>();

    this.cancel(job.id);
    tried.add(contractorId);
    this.attemptedContractors.set(job.id, tried);

    // Persist expiration timestamp and attempt metadata
    this.deps.storage.updateJob(job.id, {
      assignmentExpiresAt: expiresAt,
      assignmentAttempts: (job.assignmentAttempts || 0) + 1,
      lastAssignmentAttemptAt: new Date()
    }).catch((error) => console.error('[AssignmentTimeout] Failed to persist expiration', error));

    const timer = setTimeout(() => this.handleTimeout(job.id, contractorId), this.timeoutMs);
    this.timers.set(job.id, timer);
  }

  async runTimeoutNow(jobId: string, contractorId: string) {
    await this.handleTimeout(jobId, contractorId);
  }

  cancel(jobId: string) {
    const timer = this.timers.get(jobId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(jobId);
    }
    this.attemptedContractors.delete(jobId);
  }

  private async handleTimeout(jobId: string, contractorId: string) {
    const job = await this.deps.storage.getJob(jobId);
    if (!job) return;

    if (job.status !== 'assigned' || job.contractorId !== contractorId) {
      this.cancel(jobId);
      return;
    }

    const tried = this.attemptedContractors.get(jobId) || new Set<string>();

    // Clear the current assignment
    await this.deps.storage.updateJob(jobId, {
      contractorId: null,
      assignedAt: null,
      assignmentMethod: null,
      status: 'new',
      assignmentExpiresAt: null
    });

    await this.deps.recordStatusHistory({
      jobId,
      fromStatus: job.status,
      toStatus: 'new',
      changedBy: contractorId,
      reason: 'Assignment expired without acceptance'
    });

    // Attempt to assign to the next available contractor
    const nextContractor = await this.findNextContractor(job, tried);

    await this.deps.notifyReassignment({
      jobId,
      fromContractorId: contractorId,
      toContractorId: nextContractor?.id,
      customerId: job.customerId || undefined
    });

    if (!nextContractor) {
      this.cancel(jobId);
      return;
    }

    tried.add(nextContractor.id);
    this.attemptedContractors.set(jobId, tried);

    const reassignedJob = await this.deps.storage.assignJobToContractor(jobId, nextContractor.id, 'round_robin');
    if (!reassignedJob) {
      this.cancel(jobId);
      return;
    }

    this.schedule(reassignedJob, nextContractor.id, tried);
  }

  private async findNextContractor(job: Job, tried: Set<string>): Promise<ContractorProfile | null> {
    const lat = (job.location as any)?.lat ?? (job.location as any)?.latitude;
    const lng = (job.location as any)?.lng ?? (job.location as any)?.lon ?? (job.location as any)?.longitude;
    const available = await this.deps.storage.getAvailableContractorsForAssignment(lat, lng);
    const eligible = available.find((c: any) => c.id && !tried.has(c.id));
    return eligible || null;
  }
}

export function createAssignmentTimeoutManager(
  deps: AssignmentTimeoutDependencies,
  options: AssignmentTimeoutOptions = {}
) {
  return new AssignmentTimeoutManager(deps, options);
}

