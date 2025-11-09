// Script to check user password directly in database
import { db } from '../server/db.js';
import { users } from '../shared/schema.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

async function checkUserPassword() {
  const testEmail = 'aabboud94@gmail.com';
  const testPassword = 'TFG-ZSRONO-8487';
  
  console.log('=== Direct Database Password Check ===\n');
  
  try {
    // Query the user directly from database
    console.log(`1. Querying user with email: ${testEmail}`);
    const userResults = await db.select().from(users).where(eq(users.email, testEmail));
    
    if (userResults.length === 0) {
      console.log('   ✗ User not found in database');
      return;
    }
    
    const user = userResults[0];
    console.log(`   ✓ Found user: ${user.id}`);
    console.log(`   - Email: ${user.email}`);
    console.log(`   - Has password: ${!!user.password}`);
    console.log(`   - Password length: ${user.password ? user.password.length : 0}`);
    console.log(`   - Updated at: ${user.updatedAt}`);
    
    if (user.password) {
      // Check if it's a bcrypt hash
      const isBcryptHash = user.password.startsWith('$2b$') || user.password.startsWith('$2a$');
      console.log(`   - Is bcrypt hash: ${isBcryptHash}`);
      
      if (isBcryptHash) {
        // Test password comparison
        console.log(`\n2. Testing password verification:`);
        const isValid = await bcrypt.compare(testPassword, user.password);
        console.log(`   - Password "${testPassword}" matches: ${isValid}`);
        
        // Try some common patterns
        console.log(`\n3. Testing other patterns:`);
        
        // Test if it's the phone number with Temp!
        const phonePassword = user.phone + 'Temp!';
        const phoneValid = await bcrypt.compare(phonePassword, user.password);
        console.log(`   - Phone password "${phonePassword}" matches: ${phoneValid}`);
        
        // Test a generic temp password
        const genericTemp = 'TempPassword123!';
        const genericValid = await bcrypt.compare(genericTemp, user.password);
        console.log(`   - Generic "${genericTemp}" matches: ${genericValid}`);
      } else {
        console.log(`   ⚠️ Password is not a valid bcrypt hash!`);
        console.log(`   - Raw password value: ${user.password.substring(0, 20)}...`);
      }
    } else {
      console.log('   ✗ User has no password set!');
    }
    
    // Test updating the password directly
    console.log('\n4. Testing direct password update:');
    const newTestPassword = 'DirectTest123!';
    const hashedTestPassword = await bcrypt.hash(newTestPassword, 10);
    
    console.log(`   - Updating password for user ${user.id}`);
    const updateResult = await db.update(users)
      .set({ password: hashedTestPassword, updatedAt: new Date() })
      .where(eq(users.id, user.id))
      .returning();
    
    if (updateResult.length > 0) {
      console.log(`   ✓ Password updated successfully`);
      const updatedUser = updateResult[0];
      
      // Verify the update
      const verifyResult = await bcrypt.compare(newTestPassword, updatedUser.password);
      console.log(`   - Verification of new password: ${verifyResult ? 'PASS' : 'FAIL'}`);
      
      // Re-query to double-check
      const requeriedUser = await db.select().from(users).where(eq(users.id, user.id));
      if (requeriedUser.length > 0) {
        const finalVerify = await bcrypt.compare(newTestPassword, requeriedUser[0].password);
        console.log(`   - Re-query verification: ${finalVerify ? 'PASS' : 'FAIL'}`);
      }
    } else {
      console.log(`   ✗ Password update failed`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

// Run the check
checkUserPassword();