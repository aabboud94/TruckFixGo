import fetch from 'node-fetch';
import fs from 'fs';

// Read the admin cookies for authentication
const cookies = fs.readFileSync('admin-cookies.txt', 'utf8').trim();

async function testEndpoints() {
  console.log('Testing billing endpoints...\n');
  
  // Test /api/admin/billing/subscriptions
  try {
    console.log('Testing /api/admin/billing/subscriptions...');
    const subscriptionsResponse = await fetch('http://localhost:5000/api/admin/billing/subscriptions', {
      headers: {
        'Cookie': cookies
      }
    });
    
    const status = subscriptionsResponse.status;
    const data = await subscriptionsResponse.json();
    
    console.log(`Status: ${status}`);
    if (status === 200) {
      console.log('✅ Success! Response:', JSON.stringify(data, null, 2));
    } else {
      console.log('❌ Error! Response:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.log('❌ Failed to test subscriptions endpoint:', error.message);
  }
  
  console.log('\n---\n');
  
  // Test /api/admin/billing/statistics
  try {
    console.log('Testing /api/admin/billing/statistics...');
    const statsResponse = await fetch('http://localhost:5000/api/admin/billing/statistics', {
      headers: {
        'Cookie': cookies
      }
    });
    
    const status = statsResponse.status;
    const data = await statsResponse.json();
    
    console.log(`Status: ${status}`);
    if (status === 200) {
      console.log('✅ Success! Response:', JSON.stringify(data, null, 2));
    } else {
      console.log('❌ Error! Response:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.log('❌ Failed to test statistics endpoint:', error.message);
  }
}

testEndpoints().catch(console.error);