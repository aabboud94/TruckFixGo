// Simple test for test data generation endpoints
const http = require('http');

function makeRequest(path, method = 'GET', data = null, cookie = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (cookie) {
      options.headers['Cookie'] = cookie;
    }
    
    const req = http.request(options, (res) => {
      let body = '';
      let setCookie = res.headers['set-cookie'];
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ 
            status: res.statusCode, 
            data: parsed,
            cookie: setCookie ? setCookie[0] : cookie 
          });
        } catch (e) {
          resolve({ 
            status: res.statusCode, 
            data: body,
            cookie: setCookie ? setCookie[0] : cookie 
          });
        }
      });
    });
    
    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function runTest() {
  console.log('Testing Test Data Generation\n');
  
  try {
    // 1. Login
    console.log('1. Logging in as admin...');
    const loginRes = await makeRequest('/api/auth/test-login', 'POST', {
      email: 'testadmin@example.com',
      password: 'Test123456!',
      role: 'admin'
    });
    
    if (loginRes.status !== 200) {
      console.log('❌ Login failed:', loginRes.data);
      return;
    }
    
    const sessionCookie = loginRes.cookie;
    console.log('✅ Login successful\n');
    
    // 2. Get initial stats
    console.log('2. Getting initial stats...');
    const statsRes1 = await makeRequest('/api/admin/test-tools/stats', 'GET', null, sessionCookie);
    
    if (statsRes1.status !== 200) {
      console.log('❌ Failed to get stats:', statsRes1.data);
      return;
    }
    
    console.log('Initial counts:');
    console.log(`  Contractors: ${statsRes1.data.contractors}`);
    console.log(`  Jobs: ${statsRes1.data.jobs}\n`);
    
    // 3. Generate contractors
    console.log('3. Generating 5 contractors...');
    const genContractorsRes = await makeRequest(
      '/api/admin/test-tools/generate-contractors', 
      'POST', 
      { count: 5 },
      sessionCookie
    );
    
    if (genContractorsRes.status === 200) {
      console.log('✅', genContractorsRes.data.message);
    } else {
      console.log('❌ Failed:', genContractorsRes.data.message || genContractorsRes.data);
    }
    console.log('');
    
    // 4. Generate jobs
    console.log('4. Generating 10 jobs...');
    const genJobsRes = await makeRequest(
      '/api/admin/test-tools/generate-jobs', 
      'POST', 
      { count: 10 },
      sessionCookie
    );
    
    if (genJobsRes.status === 200) {
      console.log('✅', genJobsRes.data.message);
    } else {
      console.log('❌ Failed:', genJobsRes.data.message || genJobsRes.data);
    }
    console.log('');
    
    // 5. Get updated stats
    console.log('5. Getting updated stats...');
    const statsRes2 = await makeRequest('/api/admin/test-tools/stats', 'GET', null, sessionCookie);
    
    if (statsRes2.status === 200) {
      console.log('Final counts:');
      console.log(`  Contractors: ${statsRes2.data.contractors} (+${statsRes2.data.contractors - statsRes1.data.contractors})`);
      console.log(`  Jobs: ${statsRes2.data.jobs} (+${statsRes2.data.jobs - statsRes1.data.jobs})\n`);
      
      const contractorsDiff = statsRes2.data.contractors - statsRes1.data.contractors;
      const jobsDiff = statsRes2.data.jobs - statsRes1.data.jobs;
      
      if (contractorsDiff === 5 && jobsDiff === 10) {
        console.log('🎉 SUCCESS! All test data generation is working correctly!');
      } else {
        console.log('⚠️ Warning: Generated counts don\'t match expected values');
        console.log(`   Expected: 5 contractors, 10 jobs`);
        console.log(`   Got: ${contractorsDiff} contractors, ${jobsDiff} jobs`);
      }
    } else {
      console.log('❌ Failed to get final stats');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

runTest();