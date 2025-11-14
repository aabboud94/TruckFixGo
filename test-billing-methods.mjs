#!/usr/bin/env node

import { db } from './server/db.js';
import { storage } from './server/storage.js';

async function testBillingMethods() {
  console.log('Testing billing storage methods...\n');

  try {
    // Test getBillingStatistics
    console.log('1. Testing getBillingStatistics()...');
    const statistics = await storage.getBillingStatistics();
    console.log('   ✓ getBillingStatistics() succeeded');
    console.log('   Statistics:', statistics);
    
    // Test getFailedPayments
    console.log('\n2. Testing getFailedPayments()...');
    const failedPayments = await storage.getFailedPayments();
    console.log('   ✓ getFailedPayments() succeeded');
    console.log('   Failed payments count:', failedPayments.length);
    
    // Test getSubscriptionsDueForBilling
    console.log('\n3. Testing getSubscriptionsDueForBilling()...');
    const dueBillings = await storage.getSubscriptionsDueForBilling(10);
    console.log('   ✓ getSubscriptionsDueForBilling() succeeded');
    console.log('   Due billings count:', dueBillings.length);
    
    // Test getAllActiveSubscriptions
    console.log('\n4. Testing getAllActiveSubscriptions()...');
    const activeSubscriptions = await storage.getAllActiveSubscriptions();
    console.log('   ✓ getAllActiveSubscriptions() succeeded');
    console.log('   Active subscriptions count:', activeSubscriptions.length);
    
    // Test getUnpaidInvoices
    console.log('\n5. Testing getUnpaidInvoices()...');
    const unpaidInvoices = await storage.getUnpaidInvoices();
    console.log('   ✓ getUnpaidInvoices() succeeded');
    console.log('   Unpaid invoices count:', unpaidInvoices.length);
    
    console.log('\n✅ All billing methods tested successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error testing billing methods:', error.message);
    if (error.message.includes('column')) {
      console.error('\nMISSING COLUMN ERROR:', error.message);
      console.error('This indicates a database column is still missing.');
    }
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

testBillingMethods();