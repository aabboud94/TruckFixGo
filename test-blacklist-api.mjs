import fs from 'fs';

// Read cookies for authentication
const cookies = fs.readFileSync('admin-cookies.txt', 'utf8').trim();

async function testBlacklistAPI() {
  const baseUrl = 'http://localhost:5000';
  
  console.log('Testing Blacklist API...\n');
  
  // Test 1: Add email to blacklist
  console.log('Test 1: Adding email to blacklist...');
  try {
    const emailResponse = await fetch(`${baseUrl}/api/notifications/blacklist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies
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
      console.log('❌ Failed to add email:', emailData.message || emailData);
    }
  } catch (error) {
    console.log('❌ Error adding email to blacklist:', error.message);
  }
  
  console.log('');
  
  // Test 2: Add phone number to blacklist
  console.log('Test 2: Adding phone number to blacklist...');
  try {
    const phoneResponse = await fetch(`${baseUrl}/api/notifications/blacklist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies
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
      console.log('❌ Failed to add phone:', phoneData.message || phoneData);
    }
  } catch (error) {
    console.log('❌ Error adding phone to blacklist:', error.message);
  }
  
  console.log('');
  
  // Test 3: Try to add duplicate (should fail)
  console.log('Test 3: Attempting to add duplicate email...');
  try {
    const duplicateResponse = await fetch(`${baseUrl}/api/notifications/blacklist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies
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
      console.log('❌ Unexpected response for duplicate:', duplicateData);
    }
  } catch (error) {
    console.log('❌ Error testing duplicate:', error.message);
  }
  
  console.log('');
  
  // Test 4: Get blacklist entries
  console.log('Test 4: Fetching blacklist entries...');
  try {
    const getResponse = await fetch(`${baseUrl}/api/notifications/blacklist`, {
      headers: {
        'Cookie': cookies
      }
    });
    
    const listData = await getResponse.json();
    
    if (getResponse.ok) {
      console.log('✅ Fetched blacklist successfully:');
      console.log('   Total entries:', listData.total);
      if (listData.blacklist && listData.blacklist.length > 0) {
        console.log('   Recent entries:');
        listData.blacklist.slice(0, 3).forEach(entry => {
          console.log(`     - ${entry.value} (${entry.type})`);
        });
      }
    } else {
      console.log('❌ Failed to fetch blacklist:', listData.message);
    }
  } catch (error) {
    console.log('❌ Error fetching blacklist:', error.message);
  }
  
  console.log('');
  
  // Test 5: Remove from blacklist (clean up)
  console.log('Test 5: Removing test entries from blacklist...');
  try {
    const getResponse = await fetch(`${baseUrl}/api/notifications/blacklist`, {
      headers: {
        'Cookie': cookies
      }
    });
    
    const listData = await getResponse.json();
    
    if (getResponse.ok && listData.blacklist) {
      const testEntries = listData.blacklist.filter(entry => 
        entry.value === 'test@example.com' || entry.value === '+12125551234'
      );
      
      for (const entry of testEntries) {
        const deleteResponse = await fetch(`${baseUrl}/api/notifications/blacklist/${entry.id}`, {
          method: 'DELETE',
          headers: {
            'Cookie': cookies
          }
        });
        
        const deleteData = await deleteResponse.json();
        
        if (deleteResponse.ok) {
          console.log(`   ✅ Removed ${entry.value}: ${deleteData.message}`);
        } else {
          console.log(`   ❌ Failed to remove ${entry.value}: ${deleteData.message}`);
        }
      }
    }
  } catch (error) {
    console.log('❌ Error removing test entries:', error.message);
  }
  
  console.log('\n✅ Blacklist API tests completed!');
}

// Run the tests
testBlacklistAPI().catch(console.error);