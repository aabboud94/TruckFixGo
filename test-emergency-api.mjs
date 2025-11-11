#!/usr/bin/env node

import fetch from 'node-fetch';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

console.log('Testing Emergency Booking API Endpoints...\n');

// Test data
const testBookingData = {
  customerName: 'John Smith',
  customerPhone: '555-123-4567',
  customerEmail: 'test@example.com',
  location: {
    lat: 40.7128,
    lng: -74.0060
  },
  locationAddress: '123 Main Street, New York, NY 10001',
  serviceTypeId: 'a1b2c3d4-8d55-4c72-b3d5-4d3e5f6a7b8c', // Tire Service ID
  vehicleInfo: {
    make: 'Volvo',
    model: 'VNL 760',
    year: '2020',
    licensePlate: 'ABC-1234'
  },
  description: 'Flat tire on highway, need immediate assistance. Unable to continue driving.',
  photos: []
};

let createdJobId = null;

async function testCreateEmergencyBooking() {
  console.log('1. Testing POST /api/emergency/book-guest');
  console.log('   Request body:', JSON.stringify(testBookingData, null, 2));
  
  try {
    const response = await fetch(`${BASE_URL}/api/emergency/book-guest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testBookingData)
    });

    const data = await response.json();
    console.log('   Response status:', response.status);
    console.log('   Response body:', JSON.stringify(data, null, 2));
    
    if (response.ok && data.job) {
      createdJobId = data.job.id;
      console.log('   ✅ Emergency booking created successfully!');
      console.log('   Job ID:', createdJobId);
      console.log('   Job Number:', data.job.jobNumber);
      console.log('   Tracking Link:', data.job.trackingLink);
      return true;
    } else {
      console.log('   ❌ Failed to create emergency booking');
      return false;
    }
  } catch (error) {
    console.error('   ❌ Error:', error.message);
    return false;
  }
}

async function testTrackJob(jobId) {
  console.log('\n2. Testing GET /api/emergency/track/:jobId');
  console.log('   Job ID:', jobId);
  
  try {
    const response = await fetch(`${BASE_URL}/api/emergency/track/${jobId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    console.log('   Response status:', response.status);
    console.log('   Response body:', JSON.stringify(data, null, 2));
    
    if (response.ok && data.job) {
      console.log('   ✅ Job tracking retrieved successfully!');
      console.log('   Job Status:', data.job.status);
      console.log('   Job Type:', data.job.jobType);
      console.log('   Created At:', data.job.createdAt);
      return true;
    } else {
      console.log('   ❌ Failed to track job');
      return false;
    }
  } catch (error) {
    console.error('   ❌ Error:', error.message);
    return false;
  }
}

async function testCancelJob(jobId) {
  console.log('\n3. Testing POST /api/emergency/cancel/:jobId');
  console.log('   Job ID:', jobId);
  
  const cancelData = {
    phone: testBookingData.customerPhone,
    reason: 'Testing cancellation functionality'
  };
  
  console.log('   Request body:', JSON.stringify(cancelData, null, 2));
  
  try {
    const response = await fetch(`${BASE_URL}/api/emergency/cancel/${jobId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(cancelData)
    });

    const data = await response.json();
    console.log('   Response status:', response.status);
    console.log('   Response body:', JSON.stringify(data, null, 2));
    
    if (response.ok && data.success) {
      console.log('   ✅ Job cancelled successfully!');
      console.log('   Cancelled At:', data.job.cancelledAt);
      return true;
    } else {
      console.log('   ❌ Failed to cancel job');
      return false;
    }
  } catch (error) {
    console.error('   ❌ Error:', error.message);
    return false;
  }
}

async function testRateLimiting() {
  console.log('\n4. Testing Rate Limiting (3 bookings per phone per hour)');
  
  const results = [];
  
  for (let i = 1; i <= 5; i++) {
    console.log(`\n   Attempt ${i}/5:`);
    
    try {
      const response = await fetch(`${BASE_URL}/api/emergency/book-guest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...testBookingData,
          customerPhone: '555-999-8888', // Different phone for rate limit test
          description: `Rate limit test booking ${i}`
        })
      });

      const data = await response.json();
      
      if (response.status === 429) {
        console.log('   ⚠️  Rate limited (expected after 3 attempts)');
        console.log('   Message:', data.message);
        console.log('   Retry After:', data.retryAfter, 'seconds');
        results.push('rate_limited');
      } else if (response.ok) {
        console.log('   ✅ Booking created (attempt', i, 'of 3 allowed)');
        results.push('success');
        // Clean up - cancel the test job
        if (data.job && data.job.id) {
          await fetch(`${BASE_URL}/api/emergency/cancel/${data.job.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: '555-999-8888', reason: 'Rate limit test cleanup' })
          });
        }
      } else {
        console.log('   ❌ Unexpected response:', response.status, data.message);
        results.push('error');
      }
    } catch (error) {
      console.error('   ❌ Error:', error.message);
      results.push('error');
    }
  }
  
  const successCount = results.filter(r => r === 'success').length;
  const rateLimitedCount = results.filter(r => r === 'rate_limited').length;
  
  if (successCount === 3 && rateLimitedCount === 2) {
    console.log('\n   ✅ Rate limiting working correctly!');
    return true;
  } else {
    console.log('\n   ❌ Rate limiting not working as expected');
    console.log('   Expected: 3 successes, 2 rate limited');
    console.log('   Got:', successCount, 'successes,', rateLimitedCount, 'rate limited');
    return false;
  }
}

async function testValidation() {
  console.log('\n5. Testing Input Validation');
  
  const invalidData = {
    customerName: 'A', // Too short
    customerPhone: '123', // Too short
    customerEmail: 'not-an-email', // Invalid email
    location: {
      lat: 200, // Out of range
      lng: -200 // Out of range
    },
    locationAddress: '123', // Too short
    serviceTypeId: 'not-a-uuid', // Invalid UUID
    description: 'Too short' // Less than 10 characters
  };
  
  console.log('   Testing with invalid data...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/emergency/book-guest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(invalidData)
    });

    const data = await response.json();
    console.log('   Response status:', response.status);
    
    if (response.status === 400) {
      console.log('   ✅ Validation working correctly!');
      console.log('   Validation errors:', JSON.stringify(data, null, 2));
      return true;
    } else {
      console.log('   ❌ Expected validation to fail but got:', response.status);
      return false;
    }
  } catch (error) {
    console.error('   ❌ Error:', error.message);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('Starting Emergency Booking API Tests');
  console.log('=====================================\n');
  
  let allTestsPassed = true;
  
  // Test 1: Create emergency booking
  const createSuccess = await testCreateEmergencyBooking();
  allTestsPassed = allTestsPassed && createSuccess;
  
  // Test 2: Track job (only if creation succeeded)
  if (createdJobId) {
    const trackSuccess = await testTrackJob(createdJobId);
    allTestsPassed = allTestsPassed && trackSuccess;
  }
  
  // Test 3: Cancel job (only if creation succeeded)
  if (createdJobId) {
    const cancelSuccess = await testCancelJob(createdJobId);
    allTestsPassed = allTestsPassed && cancelSuccess;
  }
  
  // Test 4: Rate limiting
  const rateLimitSuccess = await testRateLimiting();
  allTestsPassed = allTestsPassed && rateLimitSuccess;
  
  // Test 5: Validation
  const validationSuccess = await testValidation();
  allTestsPassed = allTestsPassed && validationSuccess;
  
  console.log('\n=====================================');
  console.log('Test Results Summary');
  console.log('=====================================');
  
  if (allTestsPassed) {
    console.log('✅ All tests passed! Emergency Booking API is working correctly.');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed. Please review the output above.');
    process.exit(1);
  }
}

// Run the tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});