#!/usr/bin/env node
import { generateTestContractors, generateTestDrivers, generateTestJobs, getTestDataStats, clearTestData } from './server/test-mode-service.ts';

async function testDirectGeneration() {
  console.log('🧪 Testing unique email generation directly...\n');
  
  try {
    // Set TEST_MODE environment variable
    process.env.TEST_MODE = 'true';
    
    // Clear existing test data first
    console.log('Clearing existing test data...');
    await clearTestData();
    console.log('✓ Test data cleared\n');
    
    // Test 1: Generate contractors twice
    console.log('Test 1: Generating contractors (first batch)...');
    let contractors1 = await generateTestContractors(3);
    console.log(`✓ First batch: Generated ${contractors1.length} contractors`);
    
    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));
    
    console.log('Test 1: Generating contractors (second batch)...');
    let contractors2 = await generateTestContractors(3);
    console.log(`✓ Second batch: Generated ${contractors2.length} contractors\n`);
    
    // Test 2: Generate drivers twice
    console.log('Test 2: Generating drivers (first batch)...');
    let drivers1 = await generateTestDrivers(3);
    console.log(`✓ First batch: Generated ${drivers1.length} drivers`);
    
    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));
    
    console.log('Test 2: Generating drivers (second batch)...');
    let drivers2 = await generateTestDrivers(3);
    console.log(`✓ Second batch: Generated ${drivers2.length} drivers\n`);
    
    // Test 3: Generate jobs twice
    console.log('Test 3: Generating jobs (first batch)...');
    let jobs1 = await generateTestJobs(5);
    console.log(`✓ First batch: Generated ${jobs1.length} jobs`);
    
    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));
    
    console.log('Test 3: Generating jobs (second batch)...');
    let jobs2 = await generateTestJobs(5);
    console.log(`✓ Second batch: Generated ${jobs2.length} jobs\n`);
    
    // Get final stats
    console.log('Fetching test data statistics...');
    const stats = await getTestDataStats();
    console.log('\n📊 Test Data Statistics:');
    console.log(`  Contractors: ${stats.contractors}`);
    console.log(`  Drivers: ${stats.drivers}`);
    console.log(`  Jobs: ${stats.jobs}`);
    console.log(`  Users: ${stats.users}`);
    
    console.log('\n✅ All tests passed! No duplicate email errors.');
    console.log('   The functions can be called multiple times without unique constraint violations.');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.message.includes('duplicate key') || error.message.includes('unique constraint')) {
      console.error('   This indicates the email duplication fix did not work properly.');
      console.error('   Error details:', error);
    }
    process.exit(1);
  }
}

// Run the test
testDirectGeneration();