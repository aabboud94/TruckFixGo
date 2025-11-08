import fetch from 'node-fetch';

async function testContractorLogin() {
  const baseUrl = 'http://localhost:5000';
  
  console.log('Testing contractor login with aabboud94@gmail.com / Contractor123!');
  console.log('='.repeat(60));
  
  try {
    // Test login
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
    console.log('Login Response:', {
      status: loginResponse.status,
      data: loginData
    });
    
    if (loginResponse.ok) {
      console.log('✅ Login successful!');
      
      // Get the session cookie
      const cookies = loginResponse.headers.get('set-cookie');
      console.log('Session established:', cookies ? 'Yes' : 'No');
      
      // Test getting contractor profile
      if (cookies) {
        const profileResponse = await fetch(`${baseUrl}/api/contractor/profile`, {
          headers: {
            'Cookie': cookies
          }
        });
        
        const profileData = await profileResponse.json();
        console.log('\nContractor Profile:', {
          status: profileResponse.status,
          data: profileData
        });
        
        // Test getting available jobs
        const jobsResponse = await fetch(`${baseUrl}/api/contractor/available-jobs`, {
          headers: {
            'Cookie': cookies
          }
        });
        
        const jobsData = await jobsResponse.json();
        console.log('\nAvailable Jobs:', {
          status: jobsResponse.status,
          count: Array.isArray(jobsData) ? jobsData.length : 'N/A',
          data: jobsData
        });
      }
    } else {
      console.log('❌ Login failed:', loginData.message);
    }
    
  } catch (error) {
    console.error('Error testing login:', error);
  }
}

testContractorLogin();