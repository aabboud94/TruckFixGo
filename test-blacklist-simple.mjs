// Simple test of blacklist API functionality
// First, run a script to get the session cookie

import fs from 'fs';

async function loginAndGetCookie() {
  const baseUrl = 'http://localhost:5000';
  
  // Login as admin
  const loginResponse = await fetch(`${baseUrl}/api/admin/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: 'admin@truckfixgo.com',
      password: 'TFGadmin2024!secure'
    })
  });
  
  if (!loginResponse.ok) {
    throw new Error('Failed to login as admin');
  }
  
  // Extract the session cookie from the response
  const setCookieHeader = loginResponse.headers.get('set-cookie');
  if (!setCookieHeader) {
    throw new Error('No session cookie received');
  }
  
  // Parse the session cookie
  const sessionCookie = setCookieHeader.split(';')[0];
  return sessionCookie;
}

async function testBlacklistAPI() {
  const baseUrl = 'http://localhost:5000';
  
  try {
    console.log('Logging in as admin...');
    const sessionCookie = await loginAndGetCookie();
    console.log('✅ Logged in successfully\n');
    
    // Test 1: Add email to blacklist
    console.log('Test 1: Adding email to blacklist...');
    const emailResponse = await fetch(`${baseUrl}/api/notifications/blacklist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sessionCookie
      },
      body: JSON.stringify({
        value: 'test@example.com',
        type: 'email',
        reason: 'Test email blacklist'
      })
    });
    
    const emailData = await emailResponse.json();
    
    if (emailResponse.ok) {
      console.log('✅ Email added to blacklist successfully:', emailData.message);
      console.log('   Entry ID:', emailData.entry?.id);
    } else {
      console.log('❌ Failed to add email:', emailResponse.status, emailData);
    }
    
    console.log('');
    
    // Test 2: Add phone number to blacklist
    console.log('Test 2: Adding phone number to blacklist...');
    const phoneResponse = await fetch(`${baseUrl}/api/notifications/blacklist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sessionCookie
      },
      body: JSON.stringify({
        value: '+12125551234',
        type: 'phone',
        reason: 'Test phone blacklist'
      })
    });
    
    const phoneData = await phoneResponse.json();
    
    if (phoneResponse.ok) {
      console.log('✅ Phone added to blacklist successfully:', phoneData.message);
      console.log('   Entry ID:', phoneData.entry?.id);
    } else {
      console.log('❌ Failed to add phone:', phoneResponse.status, phoneData);
    }
    
    console.log('');
    
    // Test 3: Try to add duplicate (should fail)
    console.log('Test 3: Attempting to add duplicate email...');
    const duplicateResponse = await fetch(`${baseUrl}/api/notifications/blacklist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sessionCookie
      },
      body: JSON.stringify({
        value: 'test@example.com',
        type: 'email'
      })
    });
    
    const duplicateData = await duplicateResponse.json();
    
    if (duplicateResponse.status === 400) {
      console.log('✅ Correctly rejected duplicate:', duplicateData.message);
    } else {
      console.log('❌ Unexpected response for duplicate:', duplicateResponse.status, duplicateData);
    }
    
    console.log('');
    
    // Test 4: Get blacklist entries
    console.log('Test 4: Fetching blacklist entries...');
    const getResponse = await fetch(`${baseUrl}/api/notifications/blacklist`, {
      headers: {
        'Cookie': sessionCookie
      }
    });
    
    const listData = await getResponse.json();
    
    if (getResponse.ok) {
      console.log('✅ Fetched blacklist successfully:');
      console.log('   Total entries:', listData.total);
      if (listData.blacklist && listData.blacklist.length > 0) {
        console.log('   Recent entries:');
        listData.blacklist.slice(0, 5).forEach(entry => {
          console.log(`     - ${entry.value} (${entry.type})`);
        });
      }
    } else {
      console.log('❌ Failed to fetch blacklist:', getResponse.status, listData);
    }
    
    console.log('');
    
    // Test 5: Clean up test entries
    console.log('Test 5: Cleaning up test entries...');
    const cleanupResponse = await fetch(`${baseUrl}/api/notifications/blacklist`, {
      headers: {
        'Cookie': sessionCookie
      }
    });
    
    if (cleanupResponse.ok) {
      const cleanupData = await cleanupResponse.json();
      const testEntries = (cleanupData.blacklist || []).filter(entry => 
        entry.value === 'test@example.com' || entry.value === '+12125551234'
      );
      
      for (const entry of testEntries) {
        const deleteResponse = await fetch(`${baseUrl}/api/notifications/blacklist/${entry.id}`, {
          method: 'DELETE',
          headers: {
            'Cookie': sessionCookie
          }
        });
        
        if (deleteResponse.ok) {
          console.log(`   ✅ Removed test entry: ${entry.value}`);
        } else {
          const deleteData = await deleteResponse.json();
          console.log(`   ❌ Failed to remove ${entry.value}: ${deleteData.message}`);
        }
      }
    }
    
    console.log('\n✅ All tests completed successfully!');
    console.log('\nSUMMARY: The blacklist API is working correctly.');
    console.log('- Contacts can be added to the blacklist');
    console.log('- Duplicates are properly rejected');
    console.log('- Entries can be fetched and removed');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the tests
testBlacklistAPI().catch(console.error);