#!/usr/bin/env node
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

// Test contractor credentials
const CONTRACTOR_EMAIL = 'test.contractor.acceptance@example.com';
const CONTRACTOR_PASSWORD = 'Test123!';

// Admin credentials for creating test job
const ADMIN_EMAIL = 'admin@truckfixgo.com';
const ADMIN_PASSWORD = 'Admin123!';

let adminCookies = '';
let contractorCookies = '';
let testJobId = '';

async function loginAsAdmin() {
  console.log('Logging in as admin...');
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    })
  });

  const cookies = response.headers.raw()['set-cookie'];
  adminCookies = cookies ? cookies.map(cookie => cookie.split(';')[0]).join('; ') : '';
  
  const data = await response.json();
  console.log('Admin login response:', data);
  
  if (!response.ok) {
    throw new Error(`Admin login failed: ${data.message}`);
  }
  
  return data;
}

async function loginAsContractor() {
  console.log('Logging in as contractor...');
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: CONTRACTOR_EMAIL,
      password: CONTRACTOR_PASSWORD
    })
  });

  const cookies = response.headers.raw()['set-cookie'];
  contractorCookies = cookies ? cookies.map(cookie => cookie.split(';')[0]).join('; ') : '';
  
  const data = await response.json();
  console.log('Contractor login response:', data);
  
  if (!response.ok) {
    throw new Error(`Contractor login failed: ${data.message}`);
  }
  
  return data;
}

async function createTestJob() {
  console.log('\nCreating test job...');
  const response = await fetch(`${BASE_URL}/api/jobs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': adminCookies
    },
    body: JSON.stringify({
      jobType: 'emergency',
      serviceTypeId: 'emergency-repair', // Using actual service type ID
      location: { lat: 40.7128, lng: -74.0060 },
      locationAddress: '123 Test Street, New York, NY 10001',
      vehicleMake: 'Test',
      vehicleModel: 'Truck',
      vehicleYear: 2020,
      description: 'Test job for acceptance flow',
      urgencyLevel: 5,
      estimatedPrice: '100.00'
    })
  });

  const data = await response.json();
  console.log('Create job response:', data);
  
  if (!response.ok) {
    throw new Error(`Failed to create job: ${data.message}`);
  }
  
  testJobId = data.job.id;
  console.log('Test job created with ID:', testJobId);
  return data;
}

async function acceptJob() {
  console.log(`\nAccepting job ${testJobId} as contractor...`);
  const response = await fetch(`${BASE_URL}/api/jobs/${testJobId}/accept`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': contractorCookies
    }
  });

  const data = await response.json();
  
  if (!response.ok) {
    console.error('Job acceptance failed:', data);
    console.error('Response status:', response.status);
    console.error('Error details:', data.error || 'No error details');
    throw new Error(`Failed to accept job: ${data.message}`);
  }
  
  console.log('Job acceptance response:', data);
  console.log('Job status updated to:', data.statusUpdated || data.job?.status);
  return data;
}

async function getJobDetails() {
  console.log(`\nFetching job details for job ${testJobId}...`);
  const response = await fetch(`${BASE_URL}/api/jobs/${testJobId}`, {
    method: 'GET',
    headers: {
      'Cookie': adminCookies
    }
  });

  const data = await response.json();
  console.log('Job details:', {
    id: data.id,
    status: data.status,
    contractorId: data.contractorId,
    assignedAt: data.assignedAt,
    enRouteAt: data.enRouteAt
  });
  
  return data;
}

async function runTest() {
  try {
    console.log('=== Testing Job Acceptance Flow ===\n');
    
    // Login as admin and create a test job
    await loginAsAdmin();
    await createTestJob();
    
    // Login as contractor and accept the job
    await loginAsContractor();
    await acceptJob();
    
    // Verify job status
    const jobDetails = await getJobDetails();
    
    if (jobDetails.status === 'en_route') {
      console.log('\n✅ SUCCESS: Job acceptance flow is working correctly!');
      console.log('Job successfully transitioned from "new" to "assigned" to "en_route"');
    } else if (jobDetails.status === 'assigned') {
      console.log('\n⚠️  WARNING: Job was accepted but status is still "assigned" instead of "en_route"');
    } else {
      console.log(`\n❌ ERROR: Unexpected job status: ${jobDetails.status}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the test
runTest();