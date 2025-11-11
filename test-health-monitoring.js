#!/usr/bin/env node

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:5000';

async function testHealthEndpoints() {
  console.log('=== Testing Health Monitoring System ===\n');
  
  try {
    // Test system health
    console.log('1. Testing System Health...');
    const systemHealth = await fetch(`${BASE_URL}/api/health/system`);
    const systemData = await systemHealth.json();
    
    console.log('   Status:', systemData.status);
    console.log('   Services:');
    console.log('     - Database:', systemData.services.database);
    console.log('     - WebSocket:', systemData.services.websocket);
    console.log('     - Stripe:', systemData.services.stripe);
    console.log('     - Email:', systemData.services.email);
    console.log('     - Storage:', systemData.services.storage);
    console.log('     - Scheduler:', systemData.services.scheduler);
    
    if (systemData.errors && systemData.errors.length > 0) {
      console.log('   Errors:');
      systemData.errors.forEach(error => console.log('     -', error));
    }
    
    // Check email details
    if (systemData.details && systemData.details.email) {
      console.log('\n2. Email Service Details:');
      const emailDetails = systemData.details.email;
      console.log('   Configured:', emailDetails.configured);
      console.log('   Transporter Ready:', emailDetails.transporterReady);
      console.log('   Can Send Emails:', emailDetails.canSendEmails);
      
      if (emailDetails.stats) {
        console.log('   Email Statistics:');
        console.log('     - Verified:', emailDetails.stats.verified);
        console.log('     - Failures:', emailDetails.stats.failures);
        console.log('     - Successes:', emailDetails.stats.successes);
        console.log('     - Success Rate:', emailDetails.stats.successRate + '%');
        if (emailDetails.stats.lastError) {
          console.log('     - Last Error:', emailDetails.stats.lastError);
        }
      }
      
      if (emailDetails.testDelivery) {
        console.log('   Test Delivery Result:');
        if (emailDetails.testDelivery.cached) {
          console.log('     - Using cached result from:', emailDetails.testDelivery.lastTestTime);
        } else {
          console.log('     - Success:', emailDetails.testDelivery.success);
          if (emailDetails.testDelivery.error) {
            console.log('     - Error:', emailDetails.testDelivery.error);
          }
          if (emailDetails.testDelivery.messageId) {
            console.log('     - Message ID:', emailDetails.testDelivery.messageId);
          }
        }
      }
    }
    
    // Check Stripe details
    if (systemData.details && systemData.details.stripe) {
      console.log('\n3. Stripe Service Details:');
      const stripeDetails = systemData.details.stripe;
      console.log('   Configured:', stripeDetails.configured);
      console.log('   API Connected:', stripeDetails.apiConnected);
      console.log('   Webhook Configured:', stripeDetails.webhookConfigured);
      console.log('   Stub Mode:', stripeDetails.stubMode || false);
    }
    
    // Test error tracking
    console.log('\n4. Testing Error Tracking...');
    const errorTracking = await fetch(`${BASE_URL}/api/health/errors`);
    const errorData = await errorTracking.json();
    
    console.log('   Recent Errors:', errorData.recentErrors.length);
    console.log('   Failed Payments:', errorData.failedPayments);
    console.log('   Failed Notifications:', errorData.failedNotifications);
    
    if (errorData.apiErrorRate) {
      console.log('   API Error Rates:');
      console.log('     - Total:', errorData.apiErrorRate.total);
      console.log('     - 4xx:', errorData.apiErrorRate.rate4xx);
      console.log('     - 5xx:', errorData.apiErrorRate.rate5xx);
      console.log('     - Timeouts:', errorData.apiErrorRate.rateTimeout);
    }
    
    console.log('\n=== Health Monitoring Test Complete ===');
    
    // Summary
    console.log('\n📊 Summary:');
    if (systemData.status === 'healthy') {
      console.log('✅ All systems operational');
    } else if (systemData.status === 'degraded') {
      console.log('⚠️  Some services degraded but functional');
    } else {
      console.log('❌ System experiencing issues');
    }
    
  } catch (error) {
    console.error('Error testing health endpoints:', error.message);
  }
}

// Run the test
testHealthEndpoints();