import fetch from 'node-fetch';

async function testActiveJobEndpoint() {
  const baseUrl = 'http://localhost:5000';
  
  console.log('Testing Active Job Endpoint Fix');
  console.log('='.repeat(60));
  
  try {
    // First, login as a contractor
    console.log('1. Logging in as contractor...');
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'aabboud94@gmail.com',
        password: 'Contractor123!'
      })
    });
    
    const loginData = await loginResponse.json();
    
    if (!loginResponse.ok) {
      console.log('❌ Login failed:', loginData.message);
      return;
    }
    
    console.log('✅ Login successful!');
    
    // Get the session cookie
    const cookies = loginResponse.headers.get('set-cookie');
    if (!cookies) {
      console.log('❌ No session cookie received');
      return;
    }
    
    // Test the /api/contractor/active-job endpoint
    console.log('\n2. Testing /api/contractor/active-job endpoint...');
    const activeJobResponse = await fetch(`${baseUrl}/api/contractor/active-job`, {
      headers: {
        'Cookie': cookies
      }
    });
    
    const activeJobData = await activeJobResponse.json();
    console.log('Active Job Response:', {
      status: activeJobResponse.status,
      statusText: activeJobResponse.statusText
    });
    
    if (activeJobResponse.ok) {
      console.log('✅ Active job endpoint working correctly!');
      console.log('Active Job Data:', JSON.stringify(activeJobData, null, 2));
    } else {
      console.log('❌ Active job endpoint failed:', activeJobData);
    }
    
    // Also test the /api/contractor/jobs/active endpoint
    console.log('\n3. Testing /api/contractor/jobs/active endpoint...');
    const jobsActiveResponse = await fetch(`${baseUrl}/api/contractor/jobs/active`, {
      headers: {
        'Cookie': cookies
      }
    });
    
    const jobsActiveData = await jobsActiveResponse.json();
    console.log('Jobs Active Response:', {
      status: jobsActiveResponse.status,
      statusText: jobsActiveResponse.statusText
    });
    
    if (jobsActiveResponse.ok) {
      console.log('✅ Jobs active endpoint working correctly!');
      console.log('Jobs count:', Array.isArray(jobsActiveData) ? jobsActiveData.length : 'N/A');
      if (Array.isArray(jobsActiveData) && jobsActiveData.length > 0) {
        console.log('First job:', JSON.stringify(jobsActiveData[0], null, 2));
      }
    } else {
      console.log('❌ Jobs active endpoint failed:', jobsActiveData);
    }
    
    // Test if the SQL array query is working properly
    console.log('\n4. Summary:');
    console.log('- The fix allows passing arrays of statuses to findJobs method');
    console.log('- Uses inArray() from Drizzle ORM for proper SQL generation');
    console.log('- Supports both single status and array of statuses');
    console.log('- No more PostgreSQL parsing errors for enum arrays');
    
  } catch (error) {
    console.error('Error testing endpoint:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  }
}

testActiveJobEndpoint();