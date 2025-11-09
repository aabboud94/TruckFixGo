/**
 * Test script for validating the location input system
 * Run with: node test-location-input.js
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

// Test cases for different location modes
const testCases = [
  {
    name: 'GPS Coordinates',
    data: {
      guestPhone: '555-0100',
      guestEmail: 'gps-test@example.com',
      jobType: 'emergency',
      serviceTypeId: 'emergency-repair',
      location: { lat: 25.7617, lng: -80.1918 },
      locationAddress: 'GPS Location: 25.761700, -80.191800',
      description: 'Testing GPS location input',
      vehicleMake: 'Test GPS',
      vehicleModel: 'Truck',
      urgencyLevel: 5
    }
  },
  {
    name: 'Highway/Mile Marker',
    data: {
      guestPhone: '555-0200',
      guestEmail: 'highway-test@example.com',
      jobType: 'emergency',
      serviceTypeId: 'emergency-repair',
      location: { lat: 26.7153, lng: -80.0534 },
      locationAddress: 'I-95 Mile 100 Northbound (near West Palm Beach, FL)',
      description: 'Testing highway/mile marker input',
      vehicleMake: 'Test Highway',
      vehicleModel: 'Semi',
      urgencyLevel: 5
    }
  },
  {
    name: 'Address Search',
    data: {
      guestPhone: '555-0300',
      guestEmail: 'address-test@example.com',
      jobType: 'emergency',
      serviceTypeId: 'emergency-repair',
      location: { lat: 28.5383, lng: -81.3792 },
      locationAddress: '789 Pine Rd, Orlando, FL 32801',
      description: 'Testing address search input',
      vehicleMake: 'Test Address',
      vehicleModel: 'Truck',
      urgencyLevel: 5
    }
  },
  {
    name: 'Highway with Enhanced Location',
    data: {
      guestPhone: '555-0400',
      guestEmail: 'highway-enhanced@example.com',
      jobType: 'emergency',
      serviceTypeId: 'emergency-repair',
      location: { 
        lat: 41.8781, 
        lng: -87.6298,
        highwayInfo: {
          highway: 'I-80',
          mileMarker: '1500',
          direction: 'east'
        }
      },
      locationAddress: 'I-80 Mile 1500 Eastbound',
      description: 'Testing enhanced highway location with metadata',
      vehicleMake: 'Test Enhanced',
      vehicleModel: 'Truck',
      urgencyLevel: 5
    }
  }
];

async function runTest(testCase) {
  console.log(`\n📍 Testing: ${testCase.name}`);
  console.log('═'.repeat(50));
  
  try {
    const response = await fetch(`${BASE_URL}/api/auth/guest-booking`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testCase.data)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Success!');
      console.log(`   Job Number: ${result.job.jobNumber}`);
      console.log(`   Location: ${testCase.data.locationAddress}`);
      console.log(`   Coordinates: ${testCase.data.location.lat}, ${testCase.data.location.lng}`);
      console.log(`   Tracking URL: ${result.trackingUrl}`);
      
      if (testCase.data.location.highwayInfo) {
        console.log(`   Highway Info: ${testCase.data.location.highwayInfo.highway} Mile ${testCase.data.location.highwayInfo.mileMarker}`);
      }
      
      return true;
    } else {
      console.log('❌ Failed!');
      console.log(`   Error: ${result.message}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Error occurred!');
    console.log(`   ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  console.log('\n🚀 TruckFixGo Location Input System Test Suite');
  console.log('='.repeat(60));
  console.log('Testing all location input modes with the guest booking API\n');
  
  let passed = 0;
  let failed = 0;
  
  for (const testCase of testCases) {
    const success = await runTest(testCase);
    if (success) {
      passed++;
    } else {
      failed++;
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Results Summary');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${passed}/${testCases.length}`);
  console.log(`❌ Failed: ${failed}/${testCases.length}`);
  console.log(`📈 Success Rate: ${((passed / testCases.length) * 100).toFixed(1)}%`);
  
  if (passed === testCases.length) {
    console.log('\n🎉 All tests passed! The location input system is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the errors above.');
  }
  
  console.log('\n💡 You can also test interactively at:');
  console.log('   http://localhost:5000/test-location');
  console.log('   http://localhost:5000/emergency');
}

// Run the tests
runAllTests().catch(console.error);