#!/usr/bin/env node

/**
 * Direct test of contractor availability logic
 */

import { db } from "./server/db.js";
import { storage } from "./server/storage.js";

async function testDirectly() {
  console.log('=== Direct Test of Contractor Availability ===\n');
  
  try {
    // Test without coordinates
    console.log('1. Testing without location coordinates:');
    const contractorsWithoutLocation = await storage.getAvailableContractorsForAssignment();
    console.log(`   Found ${contractorsWithoutLocation.length} contractors`);
    
    if (contractorsWithoutLocation.length > 0) {
      console.log('\n   First 3 contractors:');
      contractorsWithoutLocation.slice(0, 3).forEach((c, i) => {
        console.log(`   ${i + 1}. ${c.name} (${c.email})`);
        console.log(`      - Tier: ${c.performanceTier}`);
        console.log(`      - Available: ${c.isAvailable}`);
        console.log(`      - Has Profile: ${c.hasProfile}`);
      });
    }
    
    // Test with coordinates (New York)
    console.log('\n2. Testing with location coordinates (New York):');
    const contractorsWithLocation = await storage.getAvailableContractorsForAssignment(40.7128, -74.0060);
    console.log(`   Found ${contractorsWithLocation.length} contractors`);
    
    if (contractorsWithLocation.length > 0) {
      console.log('\n   First 3 contractors with distance:');
      contractorsWithLocation.slice(0, 3).forEach((c, i) => {
        console.log(`   ${i + 1}. ${c.name}`);
        console.log(`      - Distance: ${c.distance} miles`);
        console.log(`      - Within radius: ${c.withinServiceRadius}`);
      });
    }
    
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during test:', error);
  }
  
  process.exit(0);
}

testDirectly();