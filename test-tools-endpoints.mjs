#!/usr/bin/env node
import fetch from 'node-fetch';
import fs from 'fs/promises';

const BASE_URL = 'http://localhost:5000';

// Function to login as admin
async function loginAsAdmin() {
  console.log('🔐 Logging in as admin...');
  
  const loginResponse = await fetch(`${BASE_URL}/api/admin/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'admin@truckfixgo.com',
      password: 'TruckFix2024!'
    })
  });
  
  if (!loginResponse.ok) {
    throw new Error(`Login failed: ${loginResponse.status} ${loginResponse.statusText}`);
  }
  
  const cookies = loginResponse.headers.raw()['set-cookie'];
  if (!cookies) {
    throw new Error('No session cookie received');
  }
  
  const cookieHeader = cookies.map(cookie => cookie.split(';')[0]).join('; ');
  console.log('✅ Logged in successfully');
  
  return cookieHeader;
}

// Test the endpoints
async function testEndpoints(cookies) {
  console.log('\n🧪 Testing test-tools endpoints...\n');
  
  // Test 1: Get test data statistics
  console.log('1️⃣ Getting test data statistics...');
  const statsResponse = await fetch(`${BASE_URL}/api/admin/test-tools/stats`, {
    headers: {
      'Cookie': cookies
    }
  });
  
  if (statsResponse.ok) {
    const stats = await statsResponse.json();
    console.log('✅ Stats endpoint working:', stats);
  } else {
    console.log('❌ Stats endpoint failed:', statsResponse.status);
  }
  
  // Test 2: Generate test contractors
  console.log('\n2️⃣ Generating test contractors...');
  const contractorsResponse = await fetch(`${BASE_URL}/api/admin/test-tools/generate-contractors`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookies
    },
    body: JSON.stringify({ count: 2 })
  });
  
  if (contractorsResponse.ok) {
    const result = await contractorsResponse.json();
    console.log('✅ Generate contractors working:', result);
  } else {
    const error = await contractorsResponse.text();
    console.log('❌ Generate contractors failed:', contractorsResponse.status, error);
  }
  
  // Test 3: Generate test jobs
  console.log('\n3️⃣ Generating test jobs...');
  const jobsResponse = await fetch(`${BASE_URL}/api/admin/test-tools/generate-jobs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookies
    },
    body: JSON.stringify({ count: 3 })
  });
  
  if (jobsResponse.ok) {
    const result = await jobsResponse.json();
    console.log('✅ Generate jobs working:', result);
  } else {
    const error = await jobsResponse.text();
    console.log('❌ Generate jobs failed:', jobsResponse.status, error);
  }
  
  // Test 4: Generate test drivers
  console.log('\n4️⃣ Generating test drivers...');
  const driversResponse = await fetch(`${BASE_URL}/api/admin/test-tools/generate-drivers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookies
    },
    body: JSON.stringify({ count: 2 })
  });
  
  if (driversResponse.ok) {
    const result = await driversResponse.json();
    console.log('✅ Generate drivers working:', result);
  } else {
    const error = await driversResponse.text();
    console.log('❌ Generate drivers failed:', driversResponse.status, error);
  }
  
  // Test 5: Get updated stats
  console.log('\n5️⃣ Getting updated statistics...');
  const finalStatsResponse = await fetch(`${BASE_URL}/api/admin/test-tools/stats`, {
    headers: {
      'Cookie': cookies
    }
  });
  
  if (finalStatsResponse.ok) {
    const stats = await finalStatsResponse.json();
    console.log('✅ Final stats:', stats);
  }
}

// Main function
async function main() {
  try {
    console.log('🚀 Testing test-tools endpoints...\n');
    
    // Check if test mode is enabled
    const testModeResponse = await fetch(`${BASE_URL}/api/test-mode`);
    const testModeData = await testModeResponse.json();
    
    if (!testModeData.testMode) {
      console.log('⚠️  Test mode is not enabled. Set TEST_MODE=true in environment variables.');
      process.exit(1);
    }
    
    console.log('✅ Test mode is enabled');
    
    const cookies = await loginAsAdmin();
    await testEndpoints(cookies);
    
    console.log('\n✨ All tests completed!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();