#!/usr/bin/env node

// Direct test of the API endpoints without authentication
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function testEndpoints() {
  console.log('==========================================');
  console.log('Testing Test Data Generation Endpoints');
  console.log('==========================================\n');

  // First check if test mode is enabled
  console.log('1. Checking test mode status...');
  try {
    const { stdout: testModeResult } = await execAsync('curl -s http://localhost:5000/api/test-mode');
    const testMode = JSON.parse(testModeResult);
    console.log('   Test Mode:', testMode.testMode ? 'ENABLED ✅' : 'DISABLED ❌');
    
    if (!testMode.testMode) {
      console.log('   ⚠️ TEST_MODE is not enabled!');
      return;
    }
  } catch (error) {
    console.error('   ❌ Failed to check test mode:', error.message);
    return;
  }

  // Test the stats endpoint using admin-cookies.txt
  console.log('\n2. Testing GET /api/admin/test-tools/stats...');
  try {
    const { stdout: statsResult } = await execAsync(
      'curl -s -b admin-cookies.txt http://localhost:5000/api/admin/test-tools/stats'
    );
    
    // Check if we got JSON or HTML
    if (statsResult.includes('<!DOCTYPE')) {
      console.log('   ❌ Received HTML instead of JSON - likely authentication issue');
      console.log('   Attempting to get new admin session...');
      
      // Try logging in as admin
      const loginCmd = `curl -s -c admin-test-cookies.txt -X POST http://localhost:5000/api/auth/test-login \\
        -H "Content-Type: application/json" \\
        -d '{"email":"testadmin@example.com","password":"Test123456!","role":"admin"}'`;
      
      const { stdout: loginResult } = await execAsync(loginCmd);
      const loginData = JSON.parse(loginResult);
      
      if (loginData.user) {
        console.log('   ✅ Logged in as admin:', loginData.user.email);
        
        // Now try stats again with new cookie
        const { stdout: statsRetry } = await execAsync(
          'curl -s -b admin-test-cookies.txt http://localhost:5000/api/admin/test-tools/stats'
        );
        
        if (!statsRetry.includes('<!DOCTYPE')) {
          const stats = JSON.parse(statsRetry);
          console.log('   ✅ Stats retrieved:');
          console.log('      Contractors:', stats.contractors || 0);
          console.log('      Jobs:', stats.jobs || 0);
          console.log('      Drivers:', stats.drivers || 0);
        } else {
          console.log('   ❌ Still getting HTML - endpoint may not be registered');
        }
      } else {
        console.log('   ❌ Failed to login:', loginResult);
      }
    } else {
      const stats = JSON.parse(statsResult);
      console.log('   ✅ Stats retrieved:');
      console.log('      Contractors:', stats.contractors || 0);
      console.log('      Jobs:', stats.jobs || 0);
      console.log('      Drivers:', stats.drivers || 0);
    }
  } catch (error) {
    console.error('   ❌ Error:', error.message);
  }

  // Test generating contractors
  console.log('\n3. Testing POST /api/admin/test-tools/generate-contractors...');
  try {
    const cmd = `curl -s -b admin-test-cookies.txt -X POST http://localhost:5000/api/admin/test-tools/generate-contractors \\
      -H "Content-Type: application/json" \\
      -d '{"count": 1}'`;
    
    const { stdout: result } = await execAsync(cmd);
    
    if (!result.includes('<!DOCTYPE')) {
      const data = JSON.parse(result);
      console.log('   ✅', data.message || 'Success');
    } else {
      console.log('   ❌ Received HTML - endpoint may not be working');
    }
  } catch (error) {
    console.error('   ❌ Error:', error.message);
  }

  console.log('\n==========================================');
  console.log('Test Complete!');
  console.log('==========================================\n');
}

testEndpoints().catch(console.error);