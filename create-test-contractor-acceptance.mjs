#!/usr/bin/env node
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

async function createTestContractor() {
  console.log('Creating test contractor...');
  
  // Register new contractor
  const response = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'test.contractor.acceptance@example.com',
      password: 'Test123!',
      firstName: 'Test',
      lastName: 'Contractor',
      phone: '555-9999',
      role: 'contractor'
    })
  });

  const data = await response.json();
  console.log('Contractor registration response:', data);
  
  if (!response.ok) {
    console.error('Failed to create contractor:', data.message);
    process.exit(1);
  }
  
  console.log('Contractor created successfully!');
  console.log('Email: test.contractor.acceptance@example.com');
  console.log('Password: Test123!');
  process.exit(0);
}

createTestContractor();
