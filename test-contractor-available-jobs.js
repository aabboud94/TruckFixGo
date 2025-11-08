import fetch from 'node-fetch';

// Test credentials for contractor
const contractorEmail = 'aabboud94@gmail.com';
const contractorPassword = 'Contractor123!'; // Using correct test password

async function testContractorJobs() {
  const baseUrl = 'http://localhost:5000';
  
  try {
    // Step 1: Login as contractor
    console.log('1. Logging in as contractor...');
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: contractorEmail,
        password: contractorPassword
      }),
      credentials: 'include'
    });

    if (!loginResponse.ok) {
      console.error('Login failed:', loginResponse.status, await loginResponse.text());
      return;
    }

    const cookies = loginResponse.headers.raw()['set-cookie'];
    if (!cookies) {
      console.error('No cookies received from login');
      return;
    }

    const sessionCookie = cookies.join('; ');
    console.log('✓ Login successful');

    // Step 2: Test available jobs endpoint
    console.log('\n2. Fetching available jobs...');
    const availableJobsResponse = await fetch(`${baseUrl}/api/contractor/jobs/available`, {
      method: 'GET',
      headers: {
        'Cookie': sessionCookie,
        'Accept': 'application/json'
      }
    });

    if (!availableJobsResponse.ok) {
      console.error('Failed to fetch available jobs:', availableJobsResponse.status);
      const errorText = await availableJobsResponse.text();
      console.error('Error:', errorText);
      return;
    }

    const responseText = await availableJobsResponse.text();
    console.log('Raw response:', responseText);
    
    let availableJobs;
    try {
      availableJobs = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse response as JSON. Response was:', responseText);
      return;
    }
    console.log(`✓ Found ${Array.isArray(availableJobs) ? availableJobs.length : 0} available jobs`);
    
    if (availableJobs && availableJobs.length > 0) {
      console.log('\nAvailable jobs:');
      availableJobs.forEach((job, index) => {
        console.log(`\nJob ${index + 1}:`);
        console.log(`  Job Number: ${job.jobNumber}`);
        console.log(`  Status: ${job.status}`);
        console.log(`  Service Type: ${job.serviceType}`);
        console.log(`  Customer: ${job.customerName}`);
        console.log(`  Location: ${job.location.address}`);
        console.log(`  Description: ${job.issueDescription}`);
        console.log(`  Estimated Payout: $${job.estimatedPayout}`);
      });

      // Check if JOB-044306-QXHH is in the list
      const targetJob = availableJobs.find(j => j.jobNumber === 'JOB-044306-QXHH');
      if (targetJob) {
        console.log('\n✅ SUCCESS: Guest job JOB-044306-QXHH is now visible to contractor!');
      } else {
        console.log('\n⚠️ Warning: Guest job JOB-044306-QXHH is not in the available jobs list');
      }
    } else {
      console.log('\n❌ No available jobs found');
    }

    // Step 3: Test active jobs endpoint
    console.log('\n3. Testing active jobs endpoint...');
    const activeJobsResponse = await fetch(`${baseUrl}/api/contractor/jobs/active`, {
      method: 'GET',
      headers: {
        'Cookie': sessionCookie,
        'Accept': 'application/json'
      }
    });

    if (activeJobsResponse.ok) {
      const activeJobs = await activeJobsResponse.json();
      console.log(`✓ Active jobs endpoint working (${Array.isArray(activeJobs) ? activeJobs.length : 0} jobs)`);
    }

    // Step 4: Test completed jobs endpoint
    console.log('\n4. Testing completed jobs endpoint...');
    const completedJobsResponse = await fetch(`${baseUrl}/api/contractor/jobs/completed`, {
      method: 'GET',
      headers: {
        'Cookie': sessionCookie,
        'Accept': 'application/json'
      }
    });

    if (completedJobsResponse.ok) {
      const completedJobs = await completedJobsResponse.json();
      console.log(`✓ Completed jobs endpoint working (${Array.isArray(completedJobs) ? completedJobs.length : 0} jobs)`);
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the test
testContractorJobs();