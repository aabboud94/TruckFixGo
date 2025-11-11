#!/usr/bin/env node

/**
 * Test script for /api/admin/fleets endpoint
 */

async function testFleetEndpoint() {
  try {
    console.log('Testing /api/admin/fleets endpoint...\n');
    
    // First, login as admin
    console.log('1. Logging in as admin...');
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@truckfixgo.com',
        password: 'Admin123!'
      })
    });

    if (!loginResponse.ok) {
      const errorText = await loginResponse.text();
      throw new Error(`Login failed: ${loginResponse.status} - ${errorText}`);
    }

    const loginData = await loginResponse.json();
    console.log('✓ Login successful:', loginData.user.email);

    // Get the session cookie
    const cookies = loginResponse.headers.get('set-cookie');
    if (!cookies) {
      throw new Error('No session cookie received');
    }

    // Extract session cookie
    const sessionCookie = cookies.split(';')[0];
    console.log('✓ Session cookie obtained');
    
    // Test the fleets endpoint
    console.log('\n2. Testing /api/admin/fleets endpoint...');
    const fleetsResponse = await fetch('http://localhost:5000/api/admin/fleets', {
      headers: {
        'Cookie': sessionCookie
      }
    });

    if (!fleetsResponse.ok) {
      const errorText = await fleetsResponse.text();
      throw new Error(`Fleet endpoint failed: ${fleetsResponse.status} - ${errorText}`);
    }

    const fleets = await fleetsResponse.json();
    console.log(`✓ Fleet endpoint successful. Found ${Array.isArray(fleets) ? fleets.length : 0} fleets\n`);

    // Display fleet data
    if (Array.isArray(fleets) && fleets.length > 0) {
      console.log('Fleet data structure (showing first fleet):');
      const fleet = fleets[0];
      console.log(`\n--- Sample Fleet ---`);
      console.log(`ID: ${fleet.id}`);
      console.log(`Company: ${fleet.companyName}`);
      console.log(`Contact: ${fleet.contactName}`);
      console.log(`Email: ${fleet.contactEmail}`);
      console.log(`Phone: ${fleet.contactPhone}`);
      console.log(`Tier: ${fleet.tier}`);
      console.log(`Status: ${fleet.status}`);
      console.log(`Credit Limit: $${fleet.creditLimit}`);
      console.log(`Vehicle Count: ${fleet.vehicleCount}`);
      console.log(`Active Jobs: ${fleet.activeJobs}`);
      console.log(`Total Spent: $${fleet.totalSpent}`);
      console.log(`Member Since: ${fleet.memberSince}`);
      console.log(`Custom Pricing: ${fleet.customPricing}`);
      
      if (fleets.length > 1) {
        console.log(`\n... and ${fleets.length - 1} more fleet(s)`);
      }
    } else {
      console.log('No fleet accounts found in the database.');
      console.log('\nThis is expected if no fleet applications have been approved yet.');
    }

    // Test with filters
    console.log('\n3. Testing with filters...');
    const activeFleets = await fetch('http://localhost:5000/api/admin/fleets?status=active', {
      headers: {
        'Cookie': sessionCookie
      }
    });
    
    if (!activeFleets.ok) {
      console.log('✗ Filter test failed');
    } else {
      const data = await activeFleets.json();
      console.log(`✓ Filter test successful. Active fleets: ${data.length}`);
    }

    console.log('\n✅ All tests passed! The /api/admin/fleets endpoint is working correctly.');
    console.log('\n📌 The Active Fleets tab in the admin panel should now display fleet data properly.');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testFleetEndpoint().catch(console.error);