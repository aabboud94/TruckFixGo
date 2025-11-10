#!/usr/bin/env node

/**
 * Test Script for Split Payment Functionality
 * This script tests the complete split payment flow:
 * 1. Creates a split payment
 * 2. Generates payment links
 * 3. Verifies payment links
 * 4. Simulates payments
 * 5. Checks payment status
 */

const API_BASE = 'http://localhost:5000';
const TEST_JOB_ID = 'test-split-job-' + Date.now();

async function makeRequest(path, options = {}) {
  try {
    const url = API_BASE + path;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${data.error || data.message || 'Unknown error'}`);
    }
    
    return data;
  } catch (error) {
    console.error(`Request failed: ${path}`, error.message);
    throw error;
  }
}

async function testSplitPaymentFlow() {
  console.log('🚀 Starting Split Payment Test Suite\n');
  console.log('=' .repeat(60));
  
  try {
    // Test 1: Get Split Payment Templates
    console.log('\n📋 Test 1: Fetching Split Payment Templates');
    const templates = await makeRequest('/api/payments/split/templates');
    console.log(`✅ Found ${templates.templates.length} templates`);
    templates.templates.forEach(t => {
      console.log(`   - ${t.name}: ${t.description}`);
    });
    
    // Test 2: Create a Split Payment
    console.log('\n💳 Test 2: Creating Split Payment');
    const splitPaymentData = {
      jobId: TEST_JOB_ID,
      totalAmount: 25000, // $250.00 in cents
      splits: [
        {
          payerType: 'driver',
          payerName: 'John Doe',
          payerEmail: 'driver@test.com',
          payerPhone: '+1234567890',
          description: 'Driver deductible',
          splitType: 'fixed',
          splitValue: 5000, // $50.00
        },
        {
          payerType: 'carrier',
          payerName: 'ABC Transport Inc.',
          payerEmail: 'billing@abctransport.com',
          payerPhone: '+1234567891',
          description: 'Carrier portion',
          splitType: 'remainder',
          splitValue: 0, // Will be calculated
        }
      ]
    };
    
    const createResult = await makeRequest('/api/payments/split', {
      method: 'POST',
      body: JSON.stringify(splitPaymentData)
    });
    
    console.log(`✅ Split payment created with ID: ${createResult.splitPaymentId}`);
    console.log(`   Total Amount: $${(createResult.totalAmount / 100).toFixed(2)}`);
    console.log('   Payment Splits:');
    createResult.splits.forEach((split, index) => {
      console.log(`   ${index + 1}. ${split.payerName} (${split.payerType}): $${(split.amountAssigned / 100).toFixed(2)} - ${split.status}`);
      if (split.paymentLinkUrl) {
        console.log(`      Payment Link: ${split.paymentLinkUrl}`);
      }
    });
    
    // Test 3: Get Split Payment Details
    console.log('\n🔍 Test 3: Fetching Split Payment Details');
    const details = await makeRequest(`/api/payments/split/${TEST_JOB_ID}`);
    console.log(`✅ Retrieved split payment for job: ${details.splitPayment.jobId}`);
    console.log(`   Status: ${details.splitPayment.status}`);
    console.log(`   Progress: $${(details.splitPayment.paidAmount / 100).toFixed(2)} / $${(details.splitPayment.totalAmount / 100).toFixed(2)}`);
    
    // Test 4: Verify Payment Link
    if (createResult.splits.length > 0 && createResult.splits[0].paymentLinkToken) {
      console.log('\n🔗 Test 4: Verifying Payment Link');
      const token = createResult.splits[0].paymentLinkToken;
      const verification = await makeRequest(`/api/payments/split/verify/${token}`);
      console.log(`✅ Payment link verified for: ${verification.payerName}`);
      console.log(`   Amount Due: $${(verification.amountDue / 100).toFixed(2)}`);
      console.log(`   Job: ${verification.jobInfo.jobNumber}`);
      console.log(`   Service: ${verification.jobInfo.serviceType || 'Emergency Repair'}`);
    }
    
    // Test 5: Process Split Payment (Simulation)
    console.log('\n💰 Test 5: Processing Split Payment (Simulation)');
    if (createResult.splits.length > 0) {
      const splitId = createResult.splits[0].id;
      const processResult = await makeRequest(`/api/payments/split/${splitId}/process`, {
        method: 'POST',
        body: JSON.stringify({
          paymentMethod: 'test_card',
          stripePaymentIntentId: 'pi_test_' + Date.now()
        })
      });
      console.log(`✅ Payment processed for split ID: ${splitId}`);
      console.log(`   New Status: ${processResult.split.status}`);
      console.log(`   Overall Payment Status: ${processResult.splitPaymentStatus}`);
    }
    
    // Test 6: Check Updated Status
    console.log('\n📊 Test 6: Checking Updated Payment Status');
    const updatedDetails = await makeRequest(`/api/payments/split/${TEST_JOB_ID}`);
    console.log(`✅ Updated payment status: ${updatedDetails.splitPayment.status}`);
    console.log('   Split Status Summary:');
    updatedDetails.paymentSplits.forEach(split => {
      const paid = split.status === 'paid' ? '✅' : '⏳';
      console.log(`   ${paid} ${split.payerName}: $${(split.amountAssigned / 100).toFixed(2)} - ${split.status}`);
    });
    
    // Test Summary
    console.log('\n' + '=' .repeat(60));
    console.log('✨ Split Payment Test Suite Completed Successfully!');
    console.log('=' .repeat(60));
    
  } catch (error) {
    console.error('\n❌ Test Failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Run the test
console.log('Split Payment End-to-End Test');
console.log('Testing API at:', API_BASE);

testSplitPaymentFlow().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});