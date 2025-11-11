#!/usr/bin/env node

/**
 * Test script to verify contractor availability endpoint is working
 */

import fetch from 'node-fetch';
import fs from 'fs/promises';

const BASE_URL = 'http://localhost:5000';

// Read admin cookies for authentication
async function getAdminCookies() {
  try {
    const cookieData = await fs.readFile('admin-cookies.txt', 'utf8');
    return cookieData.trim();
  } catch (error) {
    console.error('No admin cookies found. Please login as admin first.');
    process.exit(1);
  }
}

async function testContractorAvailability() {
  console.log('=== Testing Contractor Availability Fix ===\n');
  
  const cookies = await getAdminCookies();
  
  // First, initialize contractor profiles
  console.log('1. Initializing contractor profiles...');
  try {
    const initResponse = await fetch(`${BASE_URL}/api/admin/contractors/initialize-profiles`, {
      method: 'POST',
      headers: {
        'Cookie': cookies,
        'Content-Type': 'application/json'
      }
    });
    
    if (initResponse.ok) {
      const result = await initResponse.json();
      console.log(`✅ Profile initialization: ${result.message}`);
      console.log(`   - Created: ${result.stats.created}`);
      console.log(`   - Existing: ${result.stats.existing}`);
    } else {
      console.log(`⚠️ Profile initialization failed: ${initResponse.status}`);
    }
  } catch (error) {
    console.error('❌ Error initializing profiles:', error.message);
  }
  
  console.log('\n2. Fetching available contractors...');
  
  try {
    // Test without location coordinates
    const response = await fetch(`${BASE_URL}/api/admin/contractors/available`, {
      headers: {
        'Cookie': cookies,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error(`❌ Request failed with status: ${response.status}`);
      const text = await response.text();
      console.error('Response:', text);
      return;
    }
    
    const contractors = await response.json();
    
    console.log(`\n✅ Found ${contractors.length} contractors`);
    
    if (contractors.length > 0) {
      console.log('\nContractor Details:');
      contractors.forEach((contractor, index) => {
        console.log(`\n${index + 1}. ${contractor.name}`);
        console.log(`   ID: ${contractor.id}`);
        console.log(`   Email: ${contractor.email}`);
        console.log(`   Phone: ${contractor.phone || 'N/A'}`);
        console.log(`   Tier: ${contractor.performanceTier}`);
        console.log(`   Available: ${contractor.isAvailable}`);
        console.log(`   Queue Length: ${contractor.queueLength}`);
        console.log(`   Has Profile: ${contractor.hasProfile}`);
      });
    } else {
      console.log('⚠️ No contractors found. This might indicate the issue persists.');
    }
    
    // Test with location coordinates
    console.log('\n3. Testing with location coordinates...');
    const locationResponse = await fetch(`${BASE_URL}/api/admin/contractors/available?lat=40.7128&lon=-74.0060`, {
      headers: {
        'Cookie': cookies,
        'Content-Type': 'application/json'
      }
    });
    
    if (locationResponse.ok) {
      const contractorsWithLocation = await locationResponse.json();
      console.log(`✅ Found ${contractorsWithLocation.length} contractors with location filtering`);
      
      if (contractorsWithLocation.length > 0 && contractorsWithLocation[0].distance !== undefined) {
        console.log('   Distance calculation is working');
      }
    }
    
  } catch (error) {
    console.error('❌ Error fetching contractors:', error.message);
    console.error('Error details:', error);
  }
  
  console.log('\n=== Test Complete ===');
}

// Run the test
testContractorAvailability().catch(console.error);