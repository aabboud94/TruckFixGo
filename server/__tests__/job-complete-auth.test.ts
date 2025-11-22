import assert from 'node:assert/strict';
import test from 'node:test';
import { type Request, type Response } from 'express';

process.env.MOCK_DB = 'true';
process.env.DISABLE_REMINDER_SCHEDULER = 'true';

test('rejects completion by non-assigned contractor', async () => {
  const { handleCompleteJob } = await import('../handlers/complete-job.ts');
  const { storage } = await import('../storage');

  const mockJob = {
    id: 'job-1',
    contractorId: 'contractor-1',
    customerId: 'customer-1',
    status: 'on_site'
  } as any;

  const originalGetJob = storage.getJob;
  const originalMarkJobComplete = storage.markJobComplete;
  const originalUpdateJob = storage.updateJob;
  const originalRecordStatusChange = storage.recordJobStatusChange;

  storage.getJob = async () => mockJob;
  storage.markJobComplete = async () => mockJob;
  storage.updateJob = async () => mockJob;
  storage.recordJobStatusChange = async () => undefined;

  const req = {
    params: { id: 'job-1' },
    body: { completionNotes: 'Attempted completion' },
    session: { userId: 'contractor-2', role: 'contractor' }
  } as unknown as Request;

  let statusCode = 200;
  let jsonBody: any = null;
  const res = {
    status(code: number) {
      statusCode = code;
      return this as Response;
    },
    json(body: any) {
      jsonBody = body;
      return this as Response;
    }
  } as unknown as Response;

  try {
    await handleCompleteJob(req, res);

    assert.equal(statusCode, 403);
    assert.equal(jsonBody.message, 'Only the assigned contractor can complete this job');
  } finally {
    storage.getJob = originalGetJob;
    storage.markJobComplete = originalMarkJobComplete;
    storage.updateJob = originalUpdateJob;
    storage.recordJobStatusChange = originalRecordStatusChange;
  }
});
