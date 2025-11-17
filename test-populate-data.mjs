import fetch from 'node-fetch';

async function populateTestData() {
  console.log('Populating test data with assigned contractors...\n');
  
  const baseUrl = 'http://localhost:5000';
  
  try {
    // First, generate test contractors
    console.log('1. Generating test contractors...');
    const contractorsRes = await fetch(`${baseUrl}/api/admin/test-tools/generate-contractors`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': 'truckfixgo.sid=s%3A_test_admin_session.signature'  // Test mode bypass
      },
      body: JSON.stringify({ count: 3 })
    });
    
    if (contractorsRes.ok) {
      const result = await contractorsRes.json();
      console.log(`✓ ${result.message}`);
    } else {
      console.log('⚠️  Could not generate contractors:', contractorsRes.status);
    }
    
    // Generate test jobs
    console.log('\n2. Generating test jobs...');
    const jobsRes = await fetch(`${baseUrl}/api/admin/test-tools/generate-jobs`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': 'truckfixgo.sid=s%3A_test_admin_session.signature'  // Test mode bypass
      },
      body: JSON.stringify({ count: 5 })
    });
    
    if (jobsRes.ok) {
      const result = await jobsRes.json();
      console.log(`✓ ${result.message}`);
    } else {
      console.log('⚠️  Could not generate jobs:', jobsRes.status);
    }
    
    console.log('\n✅ Test data populated successfully!');
    console.log('Note: Some of these jobs should now have assigned contractors.');
    
  } catch (error) {
    console.error('\n❌ Failed to populate test data:', error.message);
  }
}

// Run the script
populateTestData();