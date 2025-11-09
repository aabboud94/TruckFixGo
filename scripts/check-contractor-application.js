// Script to check contractor application and user mapping
import { db } from '../server/db.js';
import { users, contractorApplications, contractorProfiles } from '../shared/schema.js';
import { eq } from 'drizzle-orm';

async function checkContractorApplication() {
  const testEmail = 'aabboud94@gmail.com';
  
  console.log('=== Contractor Application Check ===\n');
  
  try {
    // 1. Check contractor applications
    console.log(`1. Checking contractor applications for email: ${testEmail}`);
    const applications = await db.select().from(contractorApplications)
      .where(eq(contractorApplications.email, testEmail));
    
    if (applications.length === 0) {
      console.log('   ✗ No applications found');
    } else {
      console.log(`   ✓ Found ${applications.length} application(s):`);
      applications.forEach((app, i) => {
        console.log(`   Application ${i + 1}:`);
        console.log(`     - ID: ${app.id}`);
        console.log(`     - Email: ${app.email}`);
        console.log(`     - Phone: ${app.phone}`);
        console.log(`     - Status: ${app.status}`);
        console.log(`     - Name: ${app.firstName} ${app.lastName}`);
        console.log(`     - Created: ${app.createdAt}`);
      });
    }
    
    // 2. Check users table
    console.log(`\n2. Checking users table for email: ${testEmail}`);
    const usersByEmail = await db.select().from(users)
      .where(eq(users.email, testEmail));
    
    if (usersByEmail.length === 0) {
      console.log('   ✗ No users found by email');
    } else {
      console.log(`   ✓ Found ${usersByEmail.length} user(s) by email:`);
      usersByEmail.forEach((user, i) => {
        console.log(`   User ${i + 1}:`);
        console.log(`     - ID: ${user.id}`);
        console.log(`     - Email: ${user.email}`);
        console.log(`     - Phone: ${user.phone}`);
        console.log(`     - Role: ${user.role}`);
        console.log(`     - Has password: ${!!user.password}`);
        console.log(`     - Created: ${user.createdAt}`);
        console.log(`     - Updated: ${user.updatedAt}`);
      });
    }
    
    // 3. If we have applications, check for users by phone
    if (applications.length > 0) {
      const app = applications[0];
      console.log(`\n3. Checking users table for phone: ${app.phone}`);
      const usersByPhone = await db.select().from(users)
        .where(eq(users.phone, app.phone));
      
      if (usersByPhone.length === 0) {
        console.log('   ✗ No users found by phone');
      } else {
        console.log(`   ✓ Found ${usersByPhone.length} user(s) by phone:`);
        usersByPhone.forEach((user, i) => {
          console.log(`   User ${i + 1}:`);
          console.log(`     - ID: ${user.id}`);
          console.log(`     - Email: ${user.email}`);
          console.log(`     - Phone: ${user.phone}`);
          console.log(`     - Role: ${user.role}`);
          console.log(`     - Has password: ${!!user.password}`);
        });
      }
    }
    
    // 4. Check contractor profiles
    if (usersByEmail.length > 0) {
      const user = usersByEmail[0];
      console.log(`\n4. Checking contractor profile for user: ${user.id}`);
      const profiles = await db.select().from(contractorProfiles)
        .where(eq(contractorProfiles.userId, user.id));
      
      if (profiles.length === 0) {
        console.log('   ✗ No contractor profile found');
      } else {
        const profile = profiles[0];
        console.log('   ✓ Contractor profile found:');
        console.log(`     - Status: ${profile.status}`);
        console.log(`     - Performance tier: ${profile.performanceTier}`);
        console.log(`     - Created: ${profile.createdAt}`);
      }
    }
    
    // 5. Summary
    console.log('\n=== Summary ===');
    if (applications.length > 0 && usersByEmail.length > 0) {
      const app = applications[0];
      const user = usersByEmail[0];
      console.log('✓ Application and user records found');
      console.log(`  Application email: ${app.email}`);
      console.log(`  User email: ${user.email}`);
      console.log(`  Emails match: ${app.email === user.email}`);
      console.log(`  Application status: ${app.status}`);
      console.log(`  User has password: ${!!user.password}`);
    } else {
      console.log('✗ Missing records:');
      if (applications.length === 0) console.log('  - No contractor application');
      if (usersByEmail.length === 0) console.log('  - No user account');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

// Run the check
checkContractorApplication();