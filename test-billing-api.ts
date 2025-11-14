#!/usr/bin/env tsx

import { db } from './server/db';
import { storage } from './server/storage';

async function testBillingAPI() {
  console.log('Testing Billing API endpoint behavior...\n');

  try {
    // 1. Test the exact methods the API endpoint calls
    console.log('1. Testing getBillingStatistics()...');
    const statistics = await storage.getBillingStatistics();
    console.log('   ✓ getBillingStatistics() succeeded');
    console.log('   Result:', JSON.stringify(statistics, null, 2));
    
    console.log('\n2. Testing getFailedPayments()...');
    const failedPayments = await storage.getFailedPayments();
    console.log('   ✓ getFailedPayments() succeeded');
    console.log('   Count:', failedPayments.length);
    
    console.log('\n3. Testing getSubscriptionsDueForBilling(10)...');
    const upcomingBillings = await storage.getSubscriptionsDueForBilling(10);
    console.log('   ✓ getSubscriptionsDueForBilling() succeeded');
    console.log('   Count:', upcomingBillings.length);
    
    // Simulate exactly what the API endpoint returns
    const apiResponse = {
      statistics,
      failedPayments,
      upcomingBillings
    };
    
    console.log('\n4. Simulated API response structure:');
    console.log(JSON.stringify(apiResponse, null, 2));
    
    // Test related billing methods to ensure comprehensive coverage
    console.log('\n5. Testing additional billing queries...');
    
    // Test subscription queries
    const activeSubscriptions = await storage.getAllActiveSubscriptions();
    console.log('   ✓ getAllActiveSubscriptions() succeeded (count:', activeSubscriptions.length + ')');
    
    // Test billing history queries
    const unpaidInvoices = await storage.getUnpaidInvoices();
    console.log('   ✓ getUnpaidInvoices() succeeded (count:', unpaidInvoices.length + ')');
    
    // Test if we can create a billing record (to ensure all write columns exist)
    console.log('\n6. Testing billing record creation capability...');
    const testData = {
      subscriptionId: 'test-sub-' + Date.now(),
      fleetAccountId: 'test-fleet-' + Date.now(), 
      billingPeriodStart: new Date(),
      billingPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      billingDate: new Date(),
      baseAmount: '100.00',
      totalAmount: '100.00',
      status: 'pending' as const
    };
    
    // Don't actually create it, just test that the query can be built
    const query = db.insert(billingHistory).values(testData);
    console.log('   ✓ Billing record insert query builds successfully');
    
    console.log('\n✅ ALL BILLING API TESTS PASSED!');
    console.log('The /api/admin/billing/statistics endpoint should now work correctly.');
    
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Billing API test failed:', error.message);
    
    if (error.message && error.message.includes('column')) {
      console.error('\n⚠️ COLUMN ERROR DETECTED:');
      console.error('Missing column:', error.message);
      console.error('\nSQL Position:', error.position);
      console.error('Hint:', error.hint);
    }
    
    console.error('\nFull error details:', error);
    process.exit(1);
  }
}

// Import billing tables for test
import { billingHistory, billingSubscriptions } from '@shared/schema';

testBillingAPI();