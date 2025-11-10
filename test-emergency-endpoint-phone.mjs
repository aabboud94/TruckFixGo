#!/usr/bin/env node
// Test script for phone validation in the /api/jobs/emergency endpoint

import fetch from 'node-fetch';

const API_URL = 'http://localhost:5000/api/jobs/emergency';

// Test cases with different phone formats
const testCases = [
  {
    description: 'Test number with dashes (7 digits)',
    phone: '555-1234',
    shouldPass: true,
    requestData: {
      jobType: 'emergency', // Add jobType field
      customerName: 'Test User',
      customerPhone: '555-1234',
      location: { lat: 40.7128, lng: -74.0060 },
      locationAddress: '123 Test St, New York, NY',
      serviceTypeId: 'emergency-repair',
      description: 'Test with 7-digit phone'
    }
  },
  {
    description: 'US format with parentheses (10 digits)',
    phone: '(555) 123-4567',
    shouldPass: true,
    requestData: {
      jobType: 'emergency', // Add jobType field
      customerName: 'Test User',
      customerPhone: '(555) 123-4567',
      location: { lat: 40.7128, lng: -74.0060 },
      locationAddress: '123 Test St, New York, NY',
      serviceTypeId: 'emergency-repair',
      description: 'Test with parentheses format'
    }
  },
  {
    description: 'International format with + (11 digits)',
    phone: '+1 555 123 4567',
    shouldPass: true,
    requestData: {
      jobType: 'emergency', // Add jobType field
      customerName: 'Test User',
      customerPhone: '+1 555 123 4567',
      location: { lat: 40.7128, lng: -74.0060 },
      locationAddress: '123 Test St, New York, NY',
      serviceTypeId: 'emergency-repair',
      description: 'Test with international format'
    }
  },
  {
    description: 'Too few digits (5 digits)',
    phone: '555-12',
    shouldPass: false,
    requestData: {
      jobType: 'emergency', // Add jobType field
      customerName: 'Test User',
      customerPhone: '555-12',
      location: { lat: 40.7128, lng: -74.0060 },
      locationAddress: '123 Test St, New York, NY',
      serviceTypeId: 'emergency-repair',
      description: 'Test with too few digits'
    }
  },
  {
    description: 'Invalid characters (#)',
    phone: '555#123#4567',
    shouldPass: false,
    requestData: {
      jobType: 'emergency', // Add jobType field
      customerName: 'Test User',
      customerPhone: '555#123#4567',
      location: { lat: 40.7128, lng: -74.0060 },
      locationAddress: '123 Test St, New York, NY',
      serviceTypeId: 'emergency-repair',
      description: 'Test with invalid characters'
    }
  }
];

console.log('Testing /api/jobs/emergency endpoint phone validation:\n');
console.log('=' .repeat(80));

let passedTests = 0;
let failedTests = 0;

for (const test of testCases) {
  console.log(`\n📞 Testing: ${test.description}`);
  console.log(`   Phone: "${test.phone}"`);
  console.log(`   Expected: ${test.shouldPass ? 'PASS' : 'FAIL'}`);
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(test.requestData)
    });
    
    const result = await response.json();
    
    if (test.shouldPass) {
      if (response.ok) {
        console.log(`   ✅ PASSED: Request accepted`);
        console.log(`   Job Number: ${result.jobNumber || result.job?.jobNumber || 'N/A'}`);
        passedTests++;
      } else {
        console.log(`   ❌ FAILED: Request rejected when it should have passed`);
        console.log(`   Error: ${result.message || JSON.stringify(result.errors)}`);
        // Log full validation errors for debugging
        if (result.errors && Array.isArray(result.errors)) {
          result.errors.forEach(err => {
            console.log(`     Field: ${err.field}, Message: ${err.message}`);
          });
        }
        failedTests++;
      }
    } else {
      if (!response.ok) {
        // Check if any error is about phone validation
        let phoneError = false;
        if (result.message?.toLowerCase().includes('phone')) {
          phoneError = true;
        } else if (result.errors && Array.isArray(result.errors)) {
          phoneError = result.errors.some(err => 
            err.field?.includes('Phone') || 
            err.message?.toLowerCase().includes('phone')
          );
          // Log full validation errors for debugging
          console.log(`   Validation errors:`);
          result.errors.forEach(err => {
            console.log(`     Field: ${err.field}, Message: ${err.message}`);
          });
        }
        
        if (phoneError) {
          console.log(`   ✅ PASSED: Request correctly rejected for phone validation`);
          console.log(`   Validation message: ${result.message || 'See errors above'}`);
          passedTests++;
        } else {
          console.log(`   ❌ FAILED: Request rejected but not for phone validation`);
          console.log(`   Message: ${result.message}`);
          failedTests++;
        }
      } else {
        console.log(`   ❌ FAILED: Request accepted when it should have been rejected`);
        failedTests++;
      }
    }
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
    failedTests++;
  }
}

console.log('\n' + '=' .repeat(80));
console.log(`\n📊 Test Results: ${passedTests} passed, ${failedTests} failed`);

if (failedTests === 0) {
  console.log('✅ All phone validation endpoint tests passed!');
  process.exit(0);
} else {
  console.log('❌ Some tests failed. Please review the validation logic.');
  process.exit(1);
}