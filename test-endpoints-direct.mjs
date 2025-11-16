#!/usr/bin/env node

import fetch from 'node-fetch';

const BASE_URL = process.env.TEST_URL || 'http://localhost:5000';

// Function to login as admin
async function loginAsAdmin() {
  try {
    console.log('Logging in as admin...');
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'testadmin@example.com',
        password: 'Test123456!'
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      // Extract session cookie from response headers
      const cookies = response.headers.raw()['set-cookie'];
      if (cookies) {
        const sessionCookie = cookies.find(c => c.includes('truckfixgo.sid'));
        if (sessionCookie) {
          const cookieValue = sessionCookie.split(';')[0];
          console.log('✅ Logged in successfully as admin');
          return cookieValue;
        }
      }
    }
    
    console.log('❌ Failed to login:', data.message);
    return null;
  } catch (error) {
    console.error('Error during login:', error.message);
    return null;
  }
}

// Function to test the endpoints
async function testEndpoints() {
  console.log('\n==========================================');
  console.log('Testing Test Data Generation Endpoints');
  console.log('==========================================\n');

  // First, login as admin
  const sessionCookie = await loginAsAdmin();
  
  if (!sessionCookie) {
    console.log('Failed to login as admin. Make sure test users exist.');
    console.log('Run: TEST_MODE=true npm run dev to create test users');
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
      console.log('   The endpoints will not work without TEST_MODE enabled.');
      return;
    }
  } catch (error) {
    console.error('   ❌ Error:', error.message);
  }

  // 2. Test GET /api/admin/test-tools/stats - BEFORE generation
  console.log('\n2. Testing GET /api/admin/test-tools/stats (BEFORE generation)...');
  let statsBefore = {};
  try {
    const response = await fetch(`${BASE_URL}/api/admin/test-tools/stats`, {
      headers: { 'Cookie': sessionCookie }
    });
    const data = await response.json();
    if (response.ok) {
      statsBefore = data;
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
  console.log('\n6. Checking stats again AFTER generation...');
  try {
    const response = await fetch(`${BASE_URL}/api/admin/test-tools/stats`, {
      headers: { 'Cookie': sessionCookie }
    });
    const data = await response.json();
    if (response.ok) {
      console.log('   ✅ Updated stats:');
      console.log('   - Contractors:', data.contractors || 0, `(+${(data.contractors || 0) - (statsBefore.contractors || 0)})`);
      console.log('   - Jobs:', data.jobs || 0, `(+${(data.jobs || 0) - (statsBefore.jobs || 0)})`);
      console.log('   - Drivers:', data.drivers || 0, `(+${(data.drivers || 0) - (statsBefore.drivers || 0)})`);
      console.log('   - Fleets:', data.fleets || 0, `(+${(data.fleets || 0) - (statsBefore.fleets || 0)})`);
      console.log('   - Users:', data.users || 0, `(+${(data.users || 0) - (statsBefore.users || 0)})`);
      
      // Verify that data was actually created
      const contractorsCreated = (data.contractors || 0) - (statsBefore.contractors || 0);
      const jobsCreated = (data.jobs || 0) - (statsBefore.jobs || 0);
      const driversCreated = (data.drivers || 0) - (statsBefore.drivers || 0);
      
      console.log('\n   📊 Summary:');
      console.log('   - Contractors created:', contractorsCreated === 2 ? '✅ 2 (as expected)' : `❌ ${contractorsCreated} (expected 2)`);
      console.log('   - Drivers created:', driversCreated === 2 ? '✅ 2 (as expected)' : `❌ ${driversCreated} (expected 2)`);
      console.log('   - Jobs created:', jobsCreated === 3 ? '✅ 3 (as expected)' : `❌ ${jobsCreated} (expected 3)`);
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