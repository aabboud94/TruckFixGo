#!/usr/bin/env node
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

// Admin credentials for authentication
const ADMIN_EMAIL = 'admin@truckfixgo.com';
const ADMIN_PASSWORD = 'Admin123456!';

async function loginAsAdmin() {
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    })
  });
  
  if (!response.ok) {
    throw new Error('Failed to login as admin');
  }
  
  // Get the session cookie from the response
  const cookies = response.headers.get('set-cookie');
  return cookies;
}

async function testGenerateData() {
  console.log('🧪 Testing unique email generation...\n');
  
  try {
    // Login as admin first
    console.log('Logging in as admin...');
    const sessionCookie = await loginAsAdmin();
    console.log('✓ Logged in successfully\n');
    
    const headers = {
      'Content-Type': 'application/json',
      'Cookie': sessionCookie
    };
    
    // Test 1: Generate contractors twice
    console.log('Test 1: Generating contractors (first batch)...');
    let response = await fetch(`${BASE_URL}/api/admin/test-tools/generate-contractors`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ count: 3 })
    });
    let result = await response.json();
    console.log(`✓ First batch: ${result.message || 'Success'}`);
    
    console.log('Test 1: Generating contractors (second batch)...');
    response = await fetch(`${BASE_URL}/api/admin/test-tools/generate-contractors`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ count: 3 })
    });
    result = await response.json();
    console.log(`✓ Second batch: ${result.message || 'Success'}`);
    
    // Test 2: Generate drivers twice
    console.log('\nTest 2: Generating drivers (first batch)...');
    response = await fetch(`${BASE_URL}/api/admin/test-tools/generate-drivers`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ count: 3 })
    });
    result = await response.json();
    console.log(`✓ First batch: ${result.message || 'Success'}`);
    
    console.log('Test 2: Generating drivers (second batch)...');
    response = await fetch(`${BASE_URL}/api/admin/test-tools/generate-drivers`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ count: 3 })
    });
    result = await response.json();
    console.log(`✓ Second batch: ${result.message || 'Success'}`);
    
    // Test 3: Generate jobs twice
    console.log('\nTest 3: Generating jobs (first batch)...');
    response = await fetch(`${BASE_URL}/api/admin/test-tools/generate-jobs`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ count: 5 })
    });
    result = await response.json();
    console.log(`✓ First batch: ${result.message || 'Success'}`);
    
    console.log('Test 3: Generating jobs (second batch)...');
    response = await fetch(`${BASE_URL}/api/admin/test-tools/generate-jobs`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ count: 5 })
    });
    result = await response.json();
    console.log(`✓ Second batch: ${result.message || 'Success'}`);
    
    // Get stats
    console.log('\nFetching test data statistics...');
    response = await fetch(`${BASE_URL}/api/admin/test-tools/stats`, {
      headers
    });
    const stats = await response.json();
    console.log('\n📊 Test Data Statistics:');
    console.log(`  Contractors: ${stats.contractors}`);
    console.log(`  Drivers: ${stats.drivers}`);
    console.log(`  Jobs: ${stats.jobs}`);
    console.log(`  Users: ${stats.users}`);
    
    console.log('\n✅ All tests passed! No duplicate email errors.');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.message.includes('unique constraint') || error.message.includes('duplicate')) {
      console.error('   This indicates the email duplication fix did not work properly.');
    }
    process.exit(1);
  }
}

// Wait for server to be ready
setTimeout(() => {
  testGenerateData();
}, 3000);