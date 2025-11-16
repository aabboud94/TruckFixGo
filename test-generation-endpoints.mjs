#!/usr/bin/env node

import fetch from 'node-fetch';

const BASE_URL = process.env.TEST_URL || 'http://localhost:5000';

// Function to check login status
async function checkLoginStatus() {
  try {
    const response = await fetch(`${BASE_URL}/api/admin/session`, {
      method: 'GET',
      headers: {
        'Cookie': 'truckfixgo.sid=s%3AfUy7PLEXa0sWQFB0eMrAAKmGnKN8zbzl.aD3P0S9Q44gQKl93xo9aazgj%2Bt2%2FvHEz4Gkwjc4rRvI' // Using existing admin session
      }
    });
    
    const data = await response.json();
    
    if (response.ok && data.user && data.user.role === 'admin') {
      console.log('✅ Logged in as admin:', data.user.email);
      return true;
    } else {
      console.log('❌ Not logged in as admin');
      return false;
    }
  } catch (error) {
    console.error('Error checking login status:', error.message);
    return false;
  }
}

// Function to test the endpoints
async function testEndpoints() {
  const sessionCookie = 'truckfixgo.sid=s%3AfUy7PLEXa0sWQFB0eMrAAKmGnKN8zbzl.aD3P0S9Q44gQKl93xo9aazgj%2Bt2%2FvHEz4Gkwjc4rRvI';

  console.log('\n==========================================');
  console.log('Testing Test Data Generation Endpoints');
  console.log('==========================================\n');

  // Check login status first
  if (!await checkLoginStatus()) {
    console.log('\nPlease log in as admin first');
    return;
  }

  // 1. Test GET /api/test-mode
  console.log('\n1. Testing GET /api/test-mode...');
  try {
    const response = await fetch(`${BASE_URL}/api/test-mode`);
    const data = await response.json();
    console.log('   Test Mode Status:', data.testMode ? 'ENABLED ✅' : 'DISABLED ❌');
    if (!data.testMode) {
      console.log('   ⚠️ TEST_MODE is not enabled. Set TEST_MODE=true in environment variables.');
    }
  } catch (error) {
    console.error('   ❌ Error:', error.message);
  }

  // 2. Test GET /api/admin/test-tools/stats
  console.log('\n2. Testing GET /api/admin/test-tools/stats...');
  try {
    const response = await fetch(`${BASE_URL}/api/admin/test-tools/stats`, {
      headers: { 'Cookie': sessionCookie }
    });
    const data = await response.json();
    if (response.ok) {
      console.log('   ✅ Stats retrieved successfully:');
      console.log('   - Contractors:', data.contractors || 0);
      console.log('   - Jobs:', data.jobs || 0);
      console.log('   - Drivers:', data.drivers || 0);
      console.log('   - Fleets:', data.fleets || 0);
      console.log('   - Users:', data.users || 0);
      console.log('   - Emails:', data.emails || 0);
    } else {
      console.log('   ❌ Error:', data.message);
    }
  } catch (error) {
    console.error('   ❌ Error:', error.message);
  }

  // 3. Test POST /api/admin/test-tools/generate-contractors
  console.log('\n3. Testing POST /api/admin/test-tools/generate-contractors...');
  try {
    const response = await fetch(`${BASE_URL}/api/admin/test-tools/generate-contractors`, {
      method: 'POST',
      headers: {
        'Cookie': sessionCookie,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ count: 2 })
    });
    const data = await response.json();
    if (response.ok) {
      console.log('   ✅', data.message);
      console.log('   - Count generated:', data.count);
    } else {
      console.log('   ❌ Error:', data.message);
    }
  } catch (error) {
    console.error('   ❌ Error:', error.message);
  }

  // 4. Test POST /api/admin/test-tools/generate-drivers
  console.log('\n4. Testing POST /api/admin/test-tools/generate-drivers...');
  try {
    const response = await fetch(`${BASE_URL}/api/admin/test-tools/generate-drivers`, {
      method: 'POST',
      headers: {
        'Cookie': sessionCookie,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ count: 2 })
    });
    const data = await response.json();
    if (response.ok) {
      console.log('   ✅', data.message);
      console.log('   - Count generated:', data.count);
    } else {
      console.log('   ❌ Error:', data.message);
    }
  } catch (error) {
    console.error('   ❌ Error:', error.message);
  }

  // 5. Test POST /api/admin/test-tools/generate-jobs
  console.log('\n5. Testing POST /api/admin/test-tools/generate-jobs...');
  try {
    const response = await fetch(`${BASE_URL}/api/admin/test-tools/generate-jobs`, {
      method: 'POST',
      headers: {
        'Cookie': sessionCookie,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ count: 3 })
    });
    const data = await response.json();
    if (response.ok) {
      console.log('   ✅', data.message);
      console.log('   - Count generated:', data.count);
    } else {
      console.log('   ❌ Error:', data.message);
    }
  } catch (error) {
    console.error('   ❌ Error:', error.message);
  }

  // 6. Check stats again to verify data was created
  console.log('\n6. Checking stats again after generation...');
  try {
    const response = await fetch(`${BASE_URL}/api/admin/test-tools/stats`, {
      headers: { 'Cookie': sessionCookie }
    });
    const data = await response.json();
    if (response.ok) {
      console.log('   ✅ Updated stats:');
      console.log('   - Contractors:', data.contractors || 0);
      console.log('   - Jobs:', data.jobs || 0);
      console.log('   - Drivers:', data.drivers || 0);
      console.log('   - Fleets:', data.fleets || 0);
      console.log('   - Users:', data.users || 0);
    }
  } catch (error) {
    console.error('   ❌ Error:', error.message);
  }

  console.log('\n==========================================');
  console.log('Test Complete!');
  console.log('==========================================\n');
}

// Run the tests
testEndpoints();