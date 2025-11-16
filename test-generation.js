// Test script for verifying test data generation endpoints

const API_BASE = 'http://localhost:5000';

// Helper function to make authenticated requests
async function makeAuthRequest(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include'
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  const response = await fetch(`${API_BASE}${endpoint}`, options);
  const data = await response.json();
  return { status: response.status, data };
}

async function runTests() {
  console.log('=== Testing Test Data Generation Endpoints ===\n');
  
  try {
    // 1. Login as admin
    console.log('1. Logging in as admin...');
    const loginRes = await makeAuthRequest('/api/auth/test-login', 'POST', {
      email: 'testadmin@example.com',
      password: 'Test123456!',
      role: 'admin'
    });
    
    if (loginRes.status === 200) {
      console.log('✅ Admin login successful\n');
    } else {
      console.log('❌ Admin login failed:', loginRes.data);
      return;
    }
    
    // 2. Get initial stats
    console.log('2. Getting initial stats...');
    const initialStats = await makeAuthRequest('/api/admin/test-tools/stats');
    console.log('Initial stats:', initialStats.data);
    console.log('');
    
    // 3. Generate contractors
    console.log('3. Generating 5 contractors...');
    const contractorsRes = await makeAuthRequest('/api/admin/test-tools/generate-contractors', 'POST', { count: 5 });
    
    if (contractorsRes.status === 200) {
      console.log('✅ Contractors generated:', contractorsRes.data.message);
    } else {
      console.log('❌ Contractor generation failed:', contractorsRes.data);
    }
    console.log('');
    
    // 4. Generate jobs
    console.log('4. Generating 10 jobs...');
    const jobsRes = await makeAuthRequest('/api/admin/test-tools/generate-jobs', 'POST', { count: 10 });
    
    if (jobsRes.status === 200) {
      console.log('✅ Jobs generated:', jobsRes.data.message);
    } else {
      console.log('❌ Job generation failed:', jobsRes.data);
    }
    console.log('');
    
    // 5. Get updated stats
    console.log('5. Getting updated stats...');
    const updatedStats = await makeAuthRequest('/api/admin/test-tools/stats');
    console.log('Updated stats:', updatedStats.data);
    console.log('');
    
    // 6. Verify changes
    console.log('6. Verifying changes...');
    const contractorsDiff = updatedStats.data.contractors - initialStats.data.contractors;
    const jobsDiff = updatedStats.data.jobs - initialStats.data.jobs;
    
    console.log(`Contractors created: ${contractorsDiff} (expected: 5)`);
    console.log(`Jobs created: ${jobsDiff} (expected: 10)`);
    
    if (contractorsDiff === 5 && jobsDiff === 10) {
      console.log('\n🎉 ALL TESTS PASSED! Test data generation is working correctly.');
    } else {
      console.log('\n⚠️ Some tests failed. Check the numbers above.');
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the tests
console.log('Starting test data generation verification...\n');
runTests();