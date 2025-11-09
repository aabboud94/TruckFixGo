// Script to verify password after resend-credentials was called
import { db } from '../server/db.js';
import { users } from '../shared/schema.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

async function verifyPasswordAfterResend() {
  const testEmail = 'aabboud94@gmail.com';
  
  console.log('=== Password Verification After Resend ===\n');
  
  try {
    // Query the user
    console.log(`1. Querying user with email: ${testEmail}`);
    const userResults = await db.select().from(users).where(eq(users.email, testEmail));
    
    if (userResults.length === 0) {
      console.log('   ✗ User not found');
      return;
    }
    
    const user = userResults[0];
    console.log(`   ✓ Found user: ${user.id}`);
    console.log(`   - Updated at: ${user.updatedAt}`);
    console.log(`   - Has password: ${!!user.password}`);
    
    if (user.password) {
      console.log(`   - Password hash: ${user.password.substring(0, 20)}...`);
      
      // The resend-credentials generates passwords like: TFG-XXXXXX-####
      // Let's test a few patterns to see if any match
      console.log('\n2. Testing password patterns:');
      
      // Test patterns that the resend-credentials might generate
      const patterns = [
        'DirectTest123!', // This was set by our earlier test
        'TestPassword123!',
        'TempPassword123!'
      ];
      
      // Also test some recently generated patterns (we don't know the exact one)
      // But we can check if the hash has changed
      for (const testPassword of patterns) {
        const matches = await bcrypt.compare(testPassword, user.password);
        console.log(`   - "${testPassword}": ${matches ? '✓ MATCHES!' : '✗ no match'}`);
      }
      
      // Let's also check the timestamp to see when it was last updated
      const now = new Date();
      const updatedAt = new Date(user.updatedAt);
      const minutesAgo = Math.round((now.getTime() - updatedAt.getTime()) / 60000);
      console.log(`\n3. Password was last updated: ${minutesAgo} minutes ago`);
      
      // If it was updated very recently (within 2 minutes), it was probably from our resend-credentials call
      if (minutesAgo <= 2) {
        console.log('   ✓ Password was recently updated (likely from resend-credentials)');
      } else {
        console.log('   ⚠️ Password update was not recent');
      }
    }
    
    // Let's also check if 'DirectTest123!' still works (from our earlier test)
    console.log('\n4. Checking if our test password still works:');
    const testPassword = 'DirectTest123!';
    const isValid = await bcrypt.compare(testPassword, user.password);
    console.log(`   DirectTest123! matches: ${isValid ? '✓ YES' : '✗ NO'}`);
    
    if (!isValid) {
      console.log('   → This confirms the password WAS changed by resend-credentials');
      console.log('   → But we cannot login because we don\'t know the new password');
      console.log('   → Check the email sent to aabboud94@gmail.com for the new password');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

// Run verification
verifyPasswordAfterResend();