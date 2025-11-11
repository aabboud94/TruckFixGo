// Test script to reproduce the contractor API error
const fetch = require('node-fetch');

async function testContractorAPI() {
  const baseUrl = 'http://localhost:5000';
  
  // First, login as admin
  console.log('Logging in as admin...');
  const loginResponse = await fetch(`${baseUrl}/api/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'admin@truckfixgo.com',
      password: 'Admin123!',
    }),
  });
  
  if (!loginResponse.ok) {
    console.error('Login failed:', loginResponse.status);
    const error = await loginResponse.text();
    console.error('Error:', error);
    return;
  }
  
  const loginData = await loginResponse.json();
  console.log('Login successful:', loginData.user.email);
  
  // Extract cookies from the login response
  const cookies = loginResponse.headers.raw()['set-cookie'];
  const cookieHeader = cookies ? cookies.join('; ') : '';
  
  // Now test the contractors/available endpoint
  console.log('\nTesting /api/admin/contractors/available endpoint...');
  const contractorsResponse = await fetch(`${baseUrl}/api/admin/contractors/available`, {
    method: 'GET',
    headers: {
      'Cookie': cookieHeader,
    },
  });
  
  console.log('Response status:', contractorsResponse.status);
  
  if (!contractorsResponse.ok) {
    const errorText = await contractorsResponse.text();
    console.error('Error response:', errorText);
    
    // Try to parse as JSON if possible
    try {
      const errorJson = JSON.parse(errorText);
      console.error('Error details:', JSON.stringify(errorJson, null, 2));
    } catch (e) {
      // Not JSON, just show the text
    }
  } else {
    const data = await contractorsResponse.json();
    console.log('Success! Found', data.length, 'contractors');
    console.log('First contractor:', JSON.stringify(data[0], null, 2));
  }
}

// Run the test
testContractorAPI().catch(console.error);