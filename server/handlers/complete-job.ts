import { type Request, type Response } from 'express';
import { storage } from '../storage';

export async function handleCompleteJob(req: Request, res: Response) {
  try {
    const job = await storage.getJob(req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const userId = req.session.userId;
    const isAdmin = req.session.role === 'admin';
    const isCustomer = job.customerId === userId;
    const isAssignedContractor = req.session.role === 'contractor' && job.contractorId === userId;

    if (!isAdmin && !isCustomer && !isAssignedContractor) {
      const message = req.session.role === 'contractor'
        ? 'Only the assigned contractor can complete this job'
        : 'Unauthorized to complete this job';
      return res.status(403).json({ message });
    }

    if (job.status !== 'on_site') {
      return res.status(400).json({ message: 'Job must be on site to complete' });
    }

    await storage.updateJob(req.params.id, {
      status: 'completed',
      completedAt: new Date(),
      completionNotes: req.body.completionNotes,
      finalPrice: req.body.finalPrice || job.estimatedPrice
    });

    await storage.recordJobStatusChange({
      jobId: req.params.id,
      fromStatus: job.status,
      toStatus: 'completed',
      changedBy: req.session.userId,
      reason: 'Job completed'
    });

    res.json({ message: 'Job completed successfully' });
  } catch (error) {
    console.error('Complete job error:', error);
    res.status(500).json({ message: 'Failed to complete job' });
  }
}
