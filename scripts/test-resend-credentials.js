// Test resend-credentials endpoint
import fetch from 'node-fetch';

async function testResendCredentials() {
  const baseUrl = 'http://localhost:5000';
  
  console.log('=== Resend Credentials Test ===\n');
  
  try {
    // First, login as admin
    console.log('1. Logging in as admin...');
    const adminLoginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@truckfixgo.com',
        password: 'Admin123!'
      }),
      credentials: 'include'
    });
    
    if (!adminLoginResponse.ok) {
      console.log('   ✗ Admin login failed, trying to initialize admin');
      // Try to initialize admin
      const initResponse = await fetch(`${baseUrl}/api/admin/initialize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@truckfixgo.com',
          password: 'Admin123!'
        })
      });
      
      if (initResponse.ok) {
        console.log('   ✓ Admin initialized successfully');
        // Try login again
        const retryLogin = await fetch(`${baseUrl}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'admin@truckfixgo.com',
            password: 'Admin123!'
          }),
          credentials: 'include'
        });
        
        if (!retryLogin.ok) {
          console.log('   ✗ Still cannot login as admin');
          return;
        }
      } else {
        console.log('   ✗ Cannot initialize admin');
        return;
      }
    }
    
    // Get cookies from response
    const cookies = adminLoginResponse.headers.get('set-cookie');
    console.log('   ✓ Admin login successful');
    
    // 2. Call resend-credentials for the approved application
    // Using the approved application ID from our check: f8c11813-53b1-4899-b81e-c844862f5540
    const applicationId = 'f8c11813-53b1-4899-b81e-c844862f5540';
    console.log(`\n2. Calling resend-credentials for application: ${applicationId}`);
    
    const resendResponse = await fetch(`${baseUrl}/api/admin/applications/${applicationId}/resend-credentials`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': cookies || ''
      },
      credentials: 'include'
    });
    
    const resendData = await resendResponse.json();
    console.log(`   Response status: ${resendResponse.status}`);
    console.log(`   Response:`, resendData);
    
    if (resendResponse.ok) {
      console.log('   ✓ Credentials resent successfully');
      console.log('   Check server logs for the new password');
    } else {
      console.log(`   ✗ Failed to resend credentials: ${resendData.message}`);
    }
    
    // 3. Wait a moment for the update to complete
    console.log('\n3. Waiting for database update...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 4. Try to login with the email (we can't test the password since we don't know it)
    console.log('\n4. Checking if user can be found for login...');
    const testLoginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'aabboud94@gmail.com',
        password: 'WrongPassword' // We don't know the actual password
      })
    });
    
    // We expect this to fail, but we want to see the logs
    const testLoginData = await testLoginResponse.json();
    console.log(`   Login test response: ${testLoginData.message}`);
    console.log('   (Check server logs to see if user was found and password was checked)');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the test
testResendCredentials().then(() => {
  console.log('\n=== Test Complete ===');
  console.log('Check the server logs for detailed debug information');
  process.exit(0);
});