import fetch from 'node-fetch';

async function testAdminJobsContractorDetails() {
  console.log('Testing /api/admin/jobs endpoint for contractor details...\n');
  
  const baseUrl = 'http://localhost:5000';
  
  try {
    // First, try to login as admin
    console.log('1. Logging in as admin...');
    const loginResponse = await fetch(`${baseUrl}/api/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@truckfixgo.com',
        password: 'Admin123!@#'
      })
    });
    
    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status} ${loginResponse.statusText}`);
    }
    
    const cookies = loginResponse.headers.get('set-cookie');
    console.log('✓ Admin login successful\n');
    
    // Now fetch jobs
    console.log('2. Fetching jobs from /api/admin/jobs...');
    const jobsResponse = await fetch(`${baseUrl}/api/admin/jobs`, {
      headers: {
        'Cookie': cookies
      }
    });
    
    if (!jobsResponse.ok) {
      throw new Error(`Failed to fetch jobs: ${jobsResponse.status} ${jobsResponse.statusText}`);
    }
    
    const data = await jobsResponse.json();
    console.log(`✓ Fetched ${data.jobs?.length || 0} jobs\n`);
    
    // Check if jobs have contractor details
    console.log('3. Checking contractor details in jobs...');
    let jobsWithContractor = 0;
    let jobsWithoutContractor = 0;
    
    if (data.jobs && Array.isArray(data.jobs)) {
      data.jobs.forEach((job, index) => {
        if (job.contractorId) {
          jobsWithContractor++;
          console.log(`\nJob ${index + 1} (ID: ${job.id}):`);
          console.log(`  - Has contractor ID: ${job.contractorId}`);
          
          if (job.contractor) {
            console.log(`  ✓ Contractor details populated:`);
            console.log(`    - Name: ${job.contractor.name || 'Not available'}`);
            console.log(`    - Email: ${job.contractor.email || 'Not available'}`);
            console.log(`    - Phone: ${job.contractor.phone || 'Not available'}`);
            if (job.contractor.company) {
              console.log(`    - Company: ${job.contractor.company}`);
            }
          } else {
            console.log(`  ✗ Contractor details NOT populated (this is the issue!)`);
          }
        } else {
          jobsWithoutContractor++;
          if (index < 3) { // Show first 3 unassigned jobs
            console.log(`\nJob ${index + 1} (ID: ${job.id}):`);
            console.log(`  - No contractor assigned (contractor field: ${job.contractor})`);
          }
        }
      });
      
      console.log('\n=== SUMMARY ===');
      console.log(`Total jobs: ${data.jobs.length}`);
      console.log(`Jobs with contractors: ${jobsWithContractor}`);
      console.log(`Jobs without contractors: ${jobsWithoutContractor}`);
      
      // Check if all jobs with contractorId have contractor details populated
      const jobsWithMissingDetails = data.jobs.filter(job => 
        job.contractorId && !job.contractor
      );
      
      if (jobsWithMissingDetails.length > 0) {
        console.log(`\n⚠️  ISSUE FOUND: ${jobsWithMissingDetails.length} jobs have contractorId but missing contractor details!`);
        console.log('These jobs should have contractor details but don\'t:', 
          jobsWithMissingDetails.map(j => j.id));
        return false;
      } else if (jobsWithContractor > 0) {
        console.log('\n✅ SUCCESS: All jobs with contractors have their details properly populated!');
        return true;
      } else {
        console.log('\n⚠️  No jobs with contractors found to test. Try assigning a contractor to a job first.');
        return null;
      }
    } else {
      console.log('No jobs found in the response');
      return null;
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Error details:', error);
    return false;
  }
}

// Run the test
testAdminJobsContractorDetails().then(result => {
  if (result === true) {
    console.log('\n✅ Test PASSED: Contractor details are being properly populated!');
    process.exit(0);
  } else if (result === false) {
    console.log('\n❌ Test FAILED: Contractor details are NOT being populated correctly.');
    process.exit(1);
  } else {
    console.log('\n⚠️  Test INCONCLUSIVE: No jobs with contractors to test.');
    process.exit(0);
  }
}).catch(error => {
  console.error('Test error:', error);
  process.exit(1);
});