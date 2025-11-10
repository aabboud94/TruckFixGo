#!/usr/bin/env node

/**
 * Authentication Debug Test
 * Simple test to debug authentication issues
 */

import https from 'https';
import http from 'http';

async function makeRequest(url, options) {
  const urlObj = new URL(url);
  const isHttps = urlObj.protocol === 'https:';
  const lib = isHttps ? https : http;
  
  return new Promise((resolve, reject) => {
    const req = lib.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });
    
    req.on('error', reject);
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function testAuth() {
  const baseUrl = 'http://localhost:5000';
  
  console.log('🔍 Authentication Debug Test');
  console.log('=' .repeat(50));
  
  // Test 1: Try to register a new user
  console.log('\n1. Testing Registration...');
  
  const registerData = JSON.stringify({
    email: 'test_auth_debug@example.com',
    password: 'TestPassword123!',
    firstName: 'Debug',
    lastName: 'Test',
    phone: '555-9999',
    role: 'customer'
  });
  
  try {
    const registerRes = await makeRequest(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': registerData.length
      },
      body: registerData
    });
    
    console.log(`   Status: ${registerRes.status}`);
    console.log(`   Response: ${registerRes.data}`);
    
    if (registerRes.headers['set-cookie']) {
      console.log(`   Cookie: ${registerRes.headers['set-cookie']}`);
    }
  } catch (error) {
    console.error('   Error:', error.message);
  }
  
  // Test 2: Try to login
  console.log('\n2. Testing Login...');
  
  const loginData = JSON.stringify({
    email: 'test_auth_debug@example.com',
    password: 'TestPassword123!'
  });
  
  try {
    const loginRes = await makeRequest(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': loginData.length
      },
      body: loginData
    });
    
    console.log(`   Status: ${loginRes.status}`);
    console.log(`   Response: ${loginRes.data}`);
    
    if (loginRes.headers['set-cookie']) {
      const cookie = loginRes.headers['set-cookie'][0];
      console.log(`   Cookie: ${cookie}`);
      
      // Test 3: Try to access authenticated endpoint
      console.log('\n3. Testing Authenticated Access...');
      
      try {
        const meRes = await makeRequest(`${baseUrl}/api/auth/me`, {
          method: 'GET',
          headers: {
            'Cookie': cookie
          }
        });
        
        console.log(`   Status: ${meRes.status}`);
        console.log(`   Response: ${meRes.data}`);
      } catch (error) {
        console.error('   Error:', error.message);
      }
    }
  } catch (error) {
    console.error('   Error:', error.message);
  }
  
  // Test 4: Check what fields are actually required
  console.log('\n4. Testing Minimal Registration...');
  
  const minimalData = JSON.stringify({
    email: 'minimal_test@example.com',
    password: 'Password123',
    role: 'customer'
  });
  
  try {
    const minimalRes = await makeRequest(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': minimalData.length
      },
      body: minimalData
    });
    
    console.log(`   Status: ${minimalRes.status}`);
    const responseText = minimalRes.data.substring(0, 500);
    console.log(`   Response: ${responseText}`);
  } catch (error) {
    console.error('   Error:', error.message);
  }
  
  console.log('\n' + '=' .repeat(50));
}

// Run test
testAuth().catch(console.error);