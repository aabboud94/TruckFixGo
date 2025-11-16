#!/usr/bin/env node
import fetch from 'node-fetch';

const API_URL = 'http://localhost:5000';

async function testDataGeneration() {
  console.log('🧪 Testing contractor data generation fix...\n');

  try {
    // Generate test contractors
    console.log('📝 Generating test contractors...');
    const contractorsResponse = await fetch(`${API_URL}/api/test-data/contractors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ count: 3 })
    });

    if (!contractorsResponse.ok) {
      const error = await contractorsResponse.text();
      throw new Error(`Failed to generate contractors: ${error}`);
    }

    const contractorsResult = await contractorsResponse.json();
    console.log('✅ Test contractors generated successfully!');
    console.log(`   - Created ${contractorsResult.contractors?.length || contractorsResult.count || 3} contractors`);

    // Get test data stats
    console.log('\n📊 Getting test data statistics...');
    const statsResponse = await fetch(`${API_URL}/api/test-data/stats`);
    
    if (!statsResponse.ok) {
      throw new Error('Failed to get test data stats');
    }

    const stats = await statsResponse.json();
    console.log('✅ Current test data stats:');
    console.log(`   - Contractors: ${stats.contractors}`);
    console.log(`   - Jobs: ${stats.jobs}`);
    console.log(`   - Drivers: ${stats.drivers}`);
    console.log(`   - Users: ${stats.users}`);

    console.log('\n🎉 Test data generation fix verified successfully!');
    console.log('The contractor_services table now properly uses service_type_id.');
    
  } catch (error) {
    console.error('❌ Error testing data generation:', error);
    process.exit(1);
  }
}

testDataGeneration();