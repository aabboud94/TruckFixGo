import { storage } from '../server/storage.js';

async function testContractorQueue() {
  console.log('Testing Contractor Job Queue Methods...\n');

  try {
    // Test data
    const testContractorId = 'test-contractor-' + Date.now();
    const testJobIds = [
      'test-job-1-' + Date.now(),
      'test-job-2-' + Date.now(),
      'test-job-3-' + Date.now()
    ];

    console.log('1. Testing enqueueJob - Adding first job (should become current)');
    const queue1 = await storage.enqueueJob(testContractorId, testJobIds[0]);
    console.log('   Result:', {
      jobId: queue1.jobId,
      position: queue1.position,
      status: queue1.status
    });
    console.log('   ✓ First job queued as current\n');

    console.log('2. Testing enqueueJob - Adding second job (should be queued)');
    const queue2 = await storage.enqueueJob(testContractorId, testJobIds[1]);
    console.log('   Result:', {
      jobId: queue2.jobId,
      position: queue2.position,
      status: queue2.status
    });
    console.log('   ✓ Second job queued\n');

    console.log('3. Testing enqueueJob - Adding third job with priority');
    const queue3 = await storage.enqueueJob(testContractorId, testJobIds[2], 2);
    console.log('   Result:', {
      jobId: queue3.jobId,
      position: queue3.position,
      status: queue3.status
    });
    console.log('   ✓ Third job queued with priority\n');

    console.log('4. Testing getContractorQueue');
    const fullQueue = await storage.getContractorQueue(testContractorId);
    console.log('   Queue entries:', fullQueue.map(q => ({
      jobId: q.jobId,
      position: q.position,
      status: q.status
    })));
    console.log('   ✓ Retrieved contractor queue\n');

    console.log('5. Testing getContractorCurrentJob');
    const currentJob = await storage.getContractorCurrentJob(testContractorId);
    console.log('   Current job:', {
      hasJob: !!currentJob.job,
      queueStatus: currentJob.queueEntry?.status,
      jobId: currentJob.queueEntry?.jobId
    });
    console.log('   ✓ Retrieved current job\n');

    console.log('6. Testing getQueuePositionForJob');
    const position1 = await storage.getQueuePositionForJob(testJobIds[0]);
    const position2 = await storage.getQueuePositionForJob(testJobIds[1]);
    console.log('   Job 1 position:', position1);
    console.log('   Job 2 position:', position2);
    console.log('   ✓ Retrieved queue positions\n');

    console.log('7. Testing updateQueueStatus');
    if (queue2.id) {
      const updated = await storage.updateQueueStatus(queue2.id, 'cancelled');
      console.log('   Updated status:', updated?.status);
      console.log('   ✓ Updated queue status\n');
    }

    console.log('8. Testing advanceContractorQueue');
    const nextJob = await storage.advanceContractorQueue(testContractorId);
    console.log('   Advanced to:', {
      hasNextJob: !!nextJob.nextJob,
      nextJobId: nextJob.queueEntry?.jobId,
      status: nextJob.queueEntry?.status
    });
    console.log('   ✓ Advanced queue\n');

    console.log('9. Testing removeFromQueue');
    const removed = await storage.removeFromQueue(testJobIds[2]);
    console.log('   Removed:', removed);
    console.log('   ✓ Removed job from queue\n');

    console.log('10. Final queue state');
    const finalQueue = await storage.getContractorQueue(testContractorId);
    console.log('    Remaining entries:', finalQueue.map(q => ({
      jobId: q.jobId,
      position: q.position,
      status: q.status
    })));

    console.log('\n✅ All tests completed successfully!');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }

  process.exit(0);
}

testContractorQueue();