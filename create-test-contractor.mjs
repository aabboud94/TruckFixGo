#!/usr/bin/env node
// Create test contractor account
import bcrypt from 'bcrypt';

async function createTestContractor() {
  const BASE_URL = 'http://localhost:5000';
  
  console.log('Creating test contractor account...');
  
  try {
    // First, try to register the contractor
    const registerRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'contractor@test.com',
        password: 'contractor123',
        firstName: 'Test',
        lastName: 'Contractor',
        phone: '555-111-2222',
        role: 'contractor'
      })
    });
    
    if (registerRes.ok) {
      const data = await registerRes.json();
      console.log('✅ Contractor account created successfully!');
      console.log('   Email: contractor@test.com');
      console.log('   Password: contractor123');
      console.log('   User ID:', data.user?.id);
      
      // Create contractor profile
      const profileRes = await fetch(`${BASE_URL}/api/contractor/profile`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cookie': registerRes.headers.get('set-cookie') || ''
        },
        body: JSON.stringify({
          userId: data.user?.id,
          isAvailable: true,
          serviceRadius: 100,
          performanceTier: 'silver',
          baseLocationLat: 40.7128,
          baseLocationLon: -74.0060,
          services: ['emergency-repair', 'flat-tire', 'fuel-delivery', 'jump-start', 'lockout-service']
        })
      });
      
      if (profileRes.ok) {
        console.log('✅ Contractor profile created');
      }
      
    } else {
      const error = await registerRes.text();
      if (error.includes('already exists')) {
        console.log('ℹ️ Contractor account already exists');
        console.log('   Email: contractor@test.com');
        console.log('   Password: contractor123');
      } else {
        console.error('Error:', error);
      }
    }
    
  } catch (error) {
    console.error('Failed to create contractor:', error);
  }
}

createTestContractor();