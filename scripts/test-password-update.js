// Test script to debug password update issue
import bcrypt from 'bcrypt';
import fetch from 'node-fetch';

async function testPasswordUpdate() {
  const testEmail = 'aabboud94@gmail.com';
  const testPassword = 'TFG-ZSRONO-8487';
  const baseUrl = 'http://localhost:5000';
  
  console.log('=== Password Update Test ===\n');
  
  try {
    // Step 1: Try to login with the current password
    console.log(`1. Testing login with email: ${testEmail} and password: ${testPassword}`);
    
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword
      })
    });
    
    const loginData = await loginResponse.json();
    console.log(`   Login response status: ${loginResponse.status}`);
    console.log(`   Login response:`, loginData);
    
    if (loginResponse.ok) {
      console.log(`   ✓ Login successful!`);
    } else {
      console.log(`   ✗ Login failed: ${loginData.message}`);
    }
    
    // Step 2: Generate a test password hash
    console.log('\n2. Testing password hash generation:');
    const newTestPassword = 'TestPassword123!';
    const hashedPassword = await bcrypt.hash(newTestPassword, 10);
    console.log(`   Original password: ${newTestPassword}`);
    console.log(`   Hashed password: ${hashedPassword}`);
    
    // Verify the hash works
    const compareResult = await bcrypt.compare(newTestPassword, hashedPassword);
    console.log(`   Verification test: ${compareResult ? 'PASS' : 'FAIL'}`);
    
    // Step 3: Check database directly (if possible)
    console.log('\n3. Database check:');
    console.log('   Please check server logs for database update details');
    
  } catch (error) {
    console.error('Error during test:', error);
  }
}

// Run the test
testPasswordUpdate().then(() => {
  console.log('\n=== Test Complete ===');
  process.exit(0);
});