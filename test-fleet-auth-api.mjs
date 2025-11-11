#!/usr/bin/env node

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

// Colors for output
const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';

function log(message, color = RESET) {
  console.log(`${color}${message}${RESET}`);
}

async function testFleetAuthPage() {
  log('\n=== Testing Fleet Auth Page ===', BLUE);
  
  try {
    // Test 1: Check if /fleet/auth page exists
    log('Testing GET /fleet/auth...', YELLOW);
    const response = await fetch(`${BASE_URL}/fleet/auth`);
    
    if (response.ok) {
      const html = await response.text();
      
      // Check if it's the React app (should contain root div)
      if (html.includes('id="root"')) {
        log('✓ Fleet auth page is accessible', GREEN);
        
        // Check if it includes necessary scripts
        if (html.includes('src="/src/main.tsx"') || html.includes('/@vite/client')) {
          log('✓ Fleet auth page loads React app correctly', GREEN);
        }
      } else {
        log('✗ Fleet auth page exists but doesn\'t seem to be the React app', RED);
      }
    } else {
      log(`✗ Fleet auth page returned status ${response.status}`, RED);
    }
  } catch (error) {
    log(`✗ Error accessing fleet auth page: ${error.message}`, RED);
  }
}

async function testUsersApi() {
  log('\n=== Testing GET /api/users Endpoint ===', BLUE);
  
  try {
    // First, we need to login as admin
    log('Attempting admin login...', YELLOW);
    
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@truckfixgo.com',
        password: 'admin123'
      })
    });
    
    if (!loginResponse.ok) {
      log('✗ Admin login failed. Cannot test /api/users endpoint', RED);
      log('  Make sure admin user exists with email: admin@truckfixgo.com', YELLOW);
      return;
    }
    
    // Get session cookie
    const cookies = loginResponse.headers.get('set-cookie');
    if (!cookies) {
      log('✗ No session cookie received after login', RED);
      return;
    }
    
    log('✓ Admin login successful', GREEN);
    
    // Test 2: Test /api/users without email parameter
    log('Testing GET /api/users (all users)...', YELLOW);
    const allUsersResponse = await fetch(`${BASE_URL}/api/users`, {
      headers: {
        'Cookie': cookies
      }
    });
    
    if (allUsersResponse.ok) {
      const data = await allUsersResponse.json();
      log(`✓ GET /api/users successful - Found ${data.users?.length || 0} users`, GREEN);
      
      // Check that password is not included
      if (data.users && data.users.length > 0) {
        const hasPassword = data.users.some(user => user.password !== undefined);
        if (!hasPassword) {
          log('✓ Password hashes are properly excluded from response', GREEN);
        } else {
          log('✗ Warning: Password hashes found in response', RED);
        }
      }
    } else if (allUsersResponse.status === 401) {
      log('✗ Authentication required for /api/users', RED);
    } else if (allUsersResponse.status === 403) {
      log('✗ Admin role required for /api/users', RED);
    } else {
      log(`✗ GET /api/users failed with status ${allUsersResponse.status}`, RED);
    }
    
    // Test 3: Test /api/users with email parameter
    log('Testing GET /api/users?email=admin@truckfixgo.com...', YELLOW);
    const emailFilterResponse = await fetch(`${BASE_URL}/api/users?email=admin@truckfixgo.com`, {
      headers: {
        'Cookie': cookies
      }
    });
    
    if (emailFilterResponse.ok) {
      const data = await emailFilterResponse.json();
      if (data.users && data.users.length === 1) {
        log('✓ GET /api/users with email filter successful', GREEN);
        log(`  Found user: ${data.users[0].email} (${data.users[0].role})`, BLUE);
      } else if (data.users && data.users.length === 0) {
        log('✓ GET /api/users with email filter returned empty (user not found)', YELLOW);
      } else {
        log('✗ Unexpected response format', RED);
      }
    } else {
      log(`✗ GET /api/users with email filter failed with status ${emailFilterResponse.status}`, RED);
    }
    
  } catch (error) {
    log(`✗ Error testing API: ${error.message}`, RED);
  }
}

async function testFleetLoginFlow() {
  log('\n=== Testing Fleet Login Flow ===', BLUE);
  
  // This would typically require a real fleet user account
  log('Note: To fully test fleet login, you need:', YELLOW);
  log('  1. Admin to approve a fleet application', YELLOW);
  log('  2. Fleet manager receives credentials via email', YELLOW);
  log('  3. Fleet manager uses /fleet/auth to login', YELLOW);
  log('  4. Successful login redirects to /fleet/dashboard', YELLOW);
}

async function runTests() {
  log('Starting Fleet Auth and API Tests...', BLUE);
  log('=' .repeat(50), BLUE);
  
  await testFleetAuthPage();
  await testUsersApi();
  await testFleetLoginFlow();
  
  log('\n' + '='.repeat(50), BLUE);
  log('Tests completed!', GREEN);
}

// Run tests
runTests().catch(error => {
  log(`Test suite failed: ${error.message}`, RED);
  process.exit(1);
});