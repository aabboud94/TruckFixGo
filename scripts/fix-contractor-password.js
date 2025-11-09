#!/usr/bin/env node

import bcrypt from 'bcrypt';
import { db } from '../server/db.ts';
import { users, contractorProfiles, contractorApplications } from '../shared/schema.ts';
import { eq } from 'drizzle-orm';

async function fixContractorPassword() {
  try {
    console.log('🔧 Fixing contractor password for Alvis Abboud (aabboud94@gmail.com)...\n');
    
    // Find the user account
    const userList = await db
      .select()
      .from(users)
      .where(eq(users.email, 'aabboud94@gmail.com'));
    
    if (!userList || userList.length === 0) {
      console.error('❌ No user found with email aabboud94@gmail.com');
      console.log('\n📝 Looking for contractor application instead...');
      
      // Try to find the application
      const applications = await db
        .select()
        .from(contractorApplications)
        .where(eq(contractorApplications.email, 'aabboud94@gmail.com'));
      
      if (applications && applications.length > 0) {
        const app = applications[0];
        console.log(`✅ Found application: ${app.id}`);
        console.log(`   Name: ${app.firstName} ${app.lastName}`);
        console.log(`   Status: ${app.status}`);
        console.log(`   Phone: ${app.phone}`);
        
        if (app.status === 'approved') {
          console.log('\n⚠️  Application is approved but no user account exists!');
          console.log('Creating user account now...');
          
          // Generate temporary password
          const tempPassword = `TFG-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Math.floor(Math.random() * 9000) + 1000}`;
          const hashedPassword = await bcrypt.hash(tempPassword, 10);
          
          // Create user account
          const newUser = await db
            .insert(users)
            .values({
              email: app.email,
              phone: app.phone,
              password: hashedPassword,
              role: 'contractor',
              firstName: app.firstName,
              lastName: app.lastName,
              isActive: true,
              isGuest: false
            })
            .returning();
          
          if (newUser && newUser.length > 0) {
            console.log(`\n✅ Created user account with ID: ${newUser[0].id}`);
            console.log(`📧 Email: ${newUser[0].email}`);
            console.log(`🔑 Temporary Password: ${tempPassword}`);
            console.log('\n⚠️  IMPORTANT: Save this password! It won\'t be shown again.');
            
            // Create contractor profile if it doesn't exist
            const profiles = await db
              .select()
              .from(contractorProfiles)
              .where(eq(contractorProfiles.userId, newUser[0].id));
            
            if (!profiles || profiles.length === 0) {
              await db
                .insert(contractorProfiles)
                .values({
                  userId: newUser[0].id,
                  businessName: `${app.firstName} ${app.lastName} Services`,
                  insuranceProvider: app.insuranceProvider || null,
                  insurancePolicyNumber: app.insurancePolicyNumber || null,
                  insuranceExpiryDate: app.insuranceExpiryDate || null,
                  certifications: app.certifications || null,
                  specializations: app.specializations || null,
                  serviceRadius: app.serviceRadius || 50,
                  isAvailable: true,
                  performanceTier: 'silver',
                  isFleetCapable: false
                });
              console.log('✅ Created contractor profile');
            }
          }
        } else {
          console.log(`\n⚠️  Application status is '${app.status}', not 'approved'`);
          console.log('The application needs to be approved first.');
        }
      } else {
        console.log('❌ No application found for aabboud94@gmail.com');
      }
      
      process.exit(1);
    }
    
    const user = userList[0];
    console.log(`✅ Found user: ${user.id}`);
    console.log(`   Name: ${user.firstName} ${user.lastName}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Active: ${user.isActive}`);
    
    // Generate new temporary password
    const tempPassword = `TFG-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Math.floor(Math.random() * 9000) + 1000}`;
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    
    // Update the password
    const updatedUser = await db
      .update(users)
      .set({
        password: hashedPassword,
        isActive: true  // Ensure account is active
      })
      .where(eq(users.id, user.id))
      .returning();
    
    if (updatedUser && updatedUser.length > 0) {
      console.log('\n✅ Password successfully updated!');
      console.log('─'.repeat(50));
      console.log('📧 Email: aabboud94@gmail.com');
      console.log(`🔑 New Temporary Password: ${tempPassword}`);
      console.log('─'.repeat(50));
      console.log('\n📱 Login URL: https://truck-fix-go-aabboud94.replit.app/contractor/auth');
      console.log('\n⚠️  IMPORTANT: Save this password! It won\'t be shown again.');
      console.log('⚠️  The contractor should change this password after first login.');
      
      // Check if contractor profile exists
      const profiles = await db
        .select()
        .from(contractorProfiles)
        .where(eq(contractorProfiles.userId, user.id));
      
      if (!profiles || profiles.length === 0) {
        console.log('\n⚠️  Warning: No contractor profile found. Creating one...');
        
        // Get application data for profile creation
        const applications = await db
          .select()
          .from(contractorApplications)
          .where(eq(contractorApplications.email, 'aabboud94@gmail.com'));
        
        const app = applications && applications.length > 0 ? applications[0] : null;
        
        await db
          .insert(contractorProfiles)
          .values({
            userId: user.id,
            businessName: `${user.firstName} ${user.lastName} Services`,
            insuranceProvider: app?.insuranceProvider || null,
            insurancePolicyNumber: app?.insurancePolicyNumber || null,
            insuranceExpiryDate: app?.insuranceExpiryDate || null,
            certifications: app?.certifications || null,
            specializations: app?.specializations || null,
            serviceRadius: app?.serviceRadius || 50,
            isAvailable: true,
            performanceTier: 'silver',
            isFleetCapable: false
          });
        console.log('✅ Contractor profile created');
      } else {
        console.log('\n✅ Contractor profile exists');
        const profile = profiles[0];
        console.log(`   Available: ${profile.isAvailable}`);
        console.log(`   Performance Tier: ${profile.performanceTier}`);
      }
    } else {
      console.error('❌ Failed to update password');
      process.exit(1);
    }
    
    console.log('\n✅ All done! The contractor should now be able to login.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the fix
fixContractorPassword();