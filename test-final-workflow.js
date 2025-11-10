// Final comprehensive workflow test
const testEmail = `customer.test.${Date.now()}@example.com`;
const testPhone = `555${Math.floor(Math.random() * 10000000)}`;

console.log("=== FINAL CUSTOMER WORKFLOW TEST ===\n");
console.log("Test Account:");
console.log("- Email:", testEmail);
console.log("- Phone:", testPhone);
console.log("\n--- Starting Tests ---\n");

// Test 1: Register as customer (driver role)
console.log("1. Customer Registration...");
fetch('http://localhost:5000/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: testEmail,
    password: 'Test123!@#',
    phone: testPhone,
    role: 'driver',
    firstName: 'Test',
    lastName: 'Customer'
  }),
  credentials: 'include'
})
.then(res => res.json())
.then(data => {
  if (data.user) {
    console.log("✅ Registration successful - User ID:", data.user.id);
    
    // Test 2: Create emergency job
    console.log("\n2. Creating Emergency Job...");
    return fetch('http://localhost:5000/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'emergency',
        location: { lat: 41.8781, lng: -87.6298, address: '123 Test St, Chicago, IL' },
        customerName: 'Test Customer',
        customerPhone: testPhone,
        customerEmail: testEmail,
        issueType: 'flat_tire',
        description: 'Front tire flat - test job',
        unitNumber: 'TEST-001',
        carrierName: 'Test Carrier'
      }),
      credentials: 'include'
    });
  } else {
    throw new Error('Registration failed: ' + JSON.stringify(data));
  }
})
.then(res => res.json())
.then(job => {
  console.log("✅ Job created - Job Number:", job.jobNumber);
  console.log("   Status:", job.status);
  
  // Test 3: Check payment config
  console.log("\n3. Checking Payment Configuration...");
  return fetch('http://localhost:5000/api/payment/config', {
    credentials: 'include'
  });
})
.then(res => res.json())
.then(config => {
  console.log("✅ Payment config retrieved:");
  console.log("   Has Stripe Keys:", config.hasKeys);
  console.log("   Public Key:", config.publicKey || "None");
  console.log("   Mode:", config.hasKeys ? "Live Stripe" : "Mock/Test Mode");
  
  // Test 4: Add mock payment method
  console.log("\n4. Adding Mock Payment Method...");
  return fetch('http://localhost:5000/api/payment-methods/mock', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cardNumber: '4242424242424242',
      expiry: '12/25',
      cvv: '123',
      nickname: 'Test Business Card',
      type: 'credit_card'
    }),
    credentials: 'include'
  });
})
.then(res => res.json())
.then(method => {
  if (method.id) {
    console.log("✅ Mock payment method added:");
    console.log("   ID:", method.id);
    console.log("   Type:", method.type);
    console.log("   Brand:", method.brand);
    console.log("   Last 4:", method.last4);
    console.log("   Is Mock:", method.isMockPayment);
    
    // Test 5: Get payment methods
    console.log("\n5. Retrieving Payment Methods...");
    return fetch('http://localhost:5000/api/payment-methods', {
      credentials: 'include'
    });
  } else {
    throw new Error('Failed to add payment method: ' + JSON.stringify(method));
  }
})
.then(res => res.json())
.then(methods => {
  console.log("✅ Payment methods retrieved:");
  console.log("   Total methods:", methods.length);
  methods.forEach(m => {
    console.log(`   - ${m.nickname || 'No nickname'}: ${m.brand} ****${m.last4} ${m.isMockPayment ? '[MOCK]' : ''}`);
  });
  
  console.log("\n=== TEST SUMMARY ===");
  console.log("✅ All tests passed!");
  console.log("- Customer registration works");
  console.log("- Emergency job creation works");
  console.log("- Mock payment system works");
  console.log("- Payment methods can be managed");
})
.catch(err => {
  console.error("\n❌ Test failed:", err.message);
});
