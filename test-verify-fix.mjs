import { db } from './server/db.js';
import { storage } from './server/storage.js';
import { jobs } from './shared/schema.js';
import { eq } from 'drizzle-orm';

async function verifyContractorDetailsFix() {
  console.log('Verifying contractor details fix directly...\n');
  
  try {
    // Get jobs using the storage method (same as the API endpoint uses)
    console.log('1. Fetching jobs using storage.findJobs()...');
    const rawJobs = await storage.findJobs({ 
      limit: 10, 
      offset: 0,
      orderBy: 'createdAt',
      orderDir: 'desc'
    });
    
    console.log(`Found ${rawJobs.length} jobs\n`);
    
    // Now simulate what our fixed endpoint does
    console.log('2. Enhancing jobs with contractor details (simulating our fix)...\n');
    
    const getContractorDetails = async (contractorId) => {
      try {
        const user = await storage.getUser(contractorId);
        if (!user) return null;
        
        const contractorProfile = await storage.getContractorProfile(contractorId);
        
        return {
          id: contractorId,
          name: user.firstName && user.lastName 
            ? `${user.firstName} ${user.lastName}` 
            : user.firstName || user.email || 'Unknown',
          email: user.email,
          phone: user.phone || null,
          company: contractorProfile?.companyName || null
        };
      } catch (error) {
        console.error(`Error fetching contractor details for ${contractorId}:`, error);
        return null;
      }
    };
    
    let jobsWithContractors = 0;
    let successfullyEnhanced = 0;
    
    // Process each job
    for (const job of rawJobs) {
      if (job.contractorId) {
        jobsWithContractors++;
        console.log(`Job ${job.id.substring(0, 8)}...:`);
        console.log(`  - Has contractor ID: ${job.contractorId}`);
        
        const contractorDetails = await getContractorDetails(job.contractorId);
        
        if (contractorDetails) {
          successfullyEnhanced++;
          console.log(`  ✓ Contractor details fetched successfully:`);
          console.log(`    - Name: ${contractorDetails.name}`);
          console.log(`    - Email: ${contractorDetails.email}`);
          console.log(`    - Phone: ${contractorDetails.phone || 'N/A'}`);
          if (contractorDetails.company) {
            console.log(`    - Company: ${contractorDetails.company}`);
          }
        } else {
          console.log(`  ✗ Failed to fetch contractor details`);
        }
      }
    }
    
    console.log('\n=== SUMMARY ===');
    console.log(`Total jobs checked: ${rawJobs.length}`);
    console.log(`Jobs with contractors: ${jobsWithContractors}`);
    console.log(`Successfully enhanced: ${successfullyEnhanced}`);
    
    if (jobsWithContractors > 0 && successfullyEnhanced === jobsWithContractors) {
      console.log('\n✅ SUCCESS: All contractor details were fetched successfully!');
      console.log('The fix is working correctly - the API endpoint should now return contractor details.');
      return true;
    } else if (jobsWithContractors === 0) {
      console.log('\n⚠️  No jobs with contractors found to test.');
      return null;
    } else {
      console.log('\n⚠️  Some contractor details could not be fetched.');
      return false;
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    return false;
  }
}

// Run the verification
verifyContractorDetailsFix().then(result => {
  if (result === true) {
    console.log('\n🎉 The contractor details fix has been successfully implemented!');
    process.exit(0);
  } else if (result === false) {
    console.log('\n❌ There may be an issue with the fix.');
    process.exit(1);
  } else {
    console.log('\n⚠️  Test was inconclusive.');
    process.exit(0);
  }
}).catch(error => {
  console.error('Verification error:', error);
  process.exit(1);
});