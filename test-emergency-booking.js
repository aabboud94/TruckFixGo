#!/usr/bin/env node

// Test script to verify emergency booking fixes
const testEmergencyBooking = async () => {
  const baseUrl = 'http://localhost:5000';
  
  // Test cases for different service types
  const testCases = [
    {
      name: 'Flat Tire Emergency',
      data: {
        guestPhone: '555-0101',
        guestEmail: 'test1@example.com',
        jobType: 'emergency',
        serviceTypeId: 'flat-tire',
        location: { lat: 40.7128, lng: -74.0060 },
        locationAddress: 'Times Square, New York, NY',
        description: 'Flat tire on I-95',
        unitNumber: 'TRUCK-001',
        carrierName: 'Test Carrier',
        vehicleMake: 'Freightliner',
        vehicleModel: 'Cascadia',
        urgencyLevel: 5
      }
    },
    {
      name: 'Fuel Delivery Emergency',
      data: {
        guestPhone: '555-0102',
        guestEmail: 'test2@example.com',
        jobType: 'emergency',
        serviceTypeId: 'fuel-delivery',
        location: { lat: 34.0522, lng: -118.2437 },
        locationAddress: 'Downtown LA, California',
        description: 'Out of fuel on highway',
        unitNumber: 'TRUCK-002',
        carrierName: 'Test Carrier',
        vehicleMake: 'Kenworth',
        vehicleModel: 'T680',
        urgencyLevel: 5
      }
    },
    {
      name: 'Jump Start Emergency',
      data: {
        guestPhone: '555-0103',
        guestEmail: 'test3@example.com',
        jobType: 'emergency',
        serviceTypeId: 'jump-start',
        location: { lat: 41.8781, lng: -87.6298 },
        locationAddress: 'Chicago, IL',
        description: 'Battery dead, need jump start',
        unitNumber: 'TRUCK-003',
        carrierName: 'Test Carrier',
        vehicleMake: 'Peterbilt',
        vehicleModel: '579',
        urgencyLevel: 5
      }
    },
    {
      name: 'Towing Service Emergency',
      data: {
        guestPhone: '555-0104',
        guestEmail: 'test4@example.com',
        jobType: 'emergency',
        serviceTypeId: 'towing',
        location: { lat: 29.7604, lng: -95.3698 },
        locationAddress: 'Houston, TX',
        description: 'Engine failure, need towing',
        unitNumber: 'TRUCK-004',
        carrierName: 'Test Carrier',
        vehicleMake: 'Volvo',
        vehicleModel: 'VNL',
        urgencyLevel: 5
      }
    },
    {
      name: 'General Emergency Repair',
      data: {
        guestPhone: '555-0105',
        guestEmail: 'test5@example.com',
        jobType: 'emergency',
        serviceTypeId: 'emergency-repair',
        location: { lat: 33.4484, lng: -112.0740 },
        locationAddress: 'Phoenix, AZ',
        description: 'Brake issues, need emergency repair',
        unitNumber: 'TRUCK-005',
        carrierName: 'Test Carrier',
        vehicleMake: 'Mack',
        vehicleModel: 'Anthem',
        urgencyLevel: 5
      }
    }
  ];

  console.log('🧪 Testing Emergency Booking Endpoint Fixes');
  console.log('==========================================\n');
  
  let successCount = 0;
  let failureCount = 0;
  const results = [];

  // Test rate limiting by sending multiple requests
  console.log('📊 Testing Rate Limiting (20 requests per minute allowed)...');
  const rateLimitPromises = [];
  
  for (let i = 0; i < 5; i++) {
    for (const testCase of testCases) {
      rateLimitPromises.push(
        fetch(`${baseUrl}/api/auth/guest-booking`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...testCase.data,
            guestPhone: testCase.data.guestPhone + '-' + i
          })
        })
        .then(res => ({ 
          status: res.status, 
          testName: `${testCase.name} (Request ${i+1})`,
          serviceTypeId: testCase.data.serviceTypeId
        }))
        .catch(err => ({ 
          status: 'error', 
          testName: `${testCase.name} (Request ${i+1})`, 
          error: err.message 
        }))
      );
      
      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  const rateLimitResults = await Promise.all(rateLimitPromises);
  
  // Analyze results
  console.log('\n📋 Test Results:');
  console.log('----------------');
  
  const statusCounts = {};
  const serviceTypeCounts = {};
  
  for (const result of rateLimitResults) {
    statusCounts[result.status] = (statusCounts[result.status] || 0) + 1;
    if (result.serviceTypeId) {
      serviceTypeCounts[result.serviceTypeId] = (serviceTypeCounts[result.serviceTypeId] || 0) + 1;
    }
  }
  
  console.log('\n✅ Status Code Distribution:');
  for (const [status, count] of Object.entries(statusCounts)) {
    const emoji = status === 201 ? '✅' : status === 429 ? '🚫' : '⚠️';
    console.log(`   ${emoji} ${status}: ${count} requests`);
    if (status === 201) successCount += count;
    else failureCount += count;
  }
  
  console.log('\n🔧 Service Type Distribution:');
  for (const [serviceType, count] of Object.entries(serviceTypeCounts)) {
    console.log(`   - ${serviceType}: ${count} requests`);
  }
  
  // Summary
  console.log('\n📊 Summary:');
  console.log('===========');
  console.log(`Total Requests: ${rateLimitResults.length}`);
  console.log(`Successful: ${successCount} (${(successCount/rateLimitResults.length*100).toFixed(1)}%)`);
  console.log(`Failed: ${failureCount} (${(failureCount/rateLimitResults.length*100).toFixed(1)}%)`);
  
  if (statusCounts[429]) {
    console.log('\n⚠️ Rate Limiting Issue Detected:');
    console.log(`   ${statusCounts[429]} requests were rate limited (429 status)`);
    console.log('   This should not happen with the new 20 req/min limit');
  } else {
    console.log('\n✅ Rate Limiting: Working correctly (no 429 errors)');
  }
  
  if (successCount === rateLimitResults.length) {
    console.log('\n🎉 All Tests Passed! Emergency booking is working reliably.');
  } else {
    console.log('\n⚠️ Some tests failed. Check the details above.');
  }
};

// Run the tests
testEmergencyBooking().catch(console.error);