#!/usr/bin/env node
// Test script for phone validation in emergency booking endpoint

const testPhoneNumbers = [
  // Test numbers (7 digits)
  { number: "555-1234", shouldPass: true, description: "Test number with dash" },
  { number: "5551234", shouldPass: true, description: "Test number without formatting" },
  { number: "555 1234", shouldPass: true, description: "Test number with space" },
  
  // Standard US formats (10 digits)
  { number: "555-123-4567", shouldPass: true, description: "US format with dashes" },
  { number: "(555) 123-4567", shouldPass: true, description: "US format with parentheses" },
  { number: "5551234567", shouldPass: true, description: "US format no formatting" },
  { number: "555.123.4567", shouldPass: true, description: "US format with dots" },
  { number: "555 123 4567", shouldPass: true, description: "US format with spaces" },
  
  // International formats
  { number: "+1 555 123 4567", shouldPass: true, description: "International format with country code" },
  { number: "+1-555-123-4567", shouldPass: true, description: "International format with dashes" },
  { number: "+1 (555) 123-4567", shouldPass: true, description: "International format with parentheses" },
  
  // Edge cases that should fail
  { number: "123", shouldPass: false, description: "Too few digits (3)" },
  { number: "12345", shouldPass: false, description: "Too few digits (5)" },
  { number: "555-12", shouldPass: false, description: "Too few digits (5)" },
  { number: "abc-def-ghij", shouldPass: false, description: "Letters instead of numbers" },
  { number: "555#123#4567", shouldPass: false, description: "Invalid characters (#)" },
  { number: "", shouldPass: false, description: "Empty string" },
];

// Helper function to validate phone numbers (matching server implementation)
function validatePhoneNumber(phone) {
  // Check if phone contains only allowed characters
  if (!/^[\d\s\-\+\(\)\.]+$/.test(phone)) {
    return { 
      isValid: false, 
      message: 'Phone number can only contain digits, spaces, dashes, plus signs, parentheses, and periods' 
    };
  }
  
  // Strip all non-numeric characters to count digits
  const digitsOnly = phone.replace(/\D/g, '');
  
  // Check minimum digit count (7 for testing, 10 recommended for production)
  if (digitsOnly.length < 7) {
    return { 
      isValid: false, 
      message: 'Phone number must contain at least 7 digits (10 recommended for production). Valid formats: "555-1234", "(555) 123-4567", "+1 555 123 4567"' 
    };
  }
  
  // Check maximum length for formatted phone numbers
  if (phone.length > 30) {
    return { 
      isValid: false, 
      message: 'Phone number is too long' 
    };
  }
  
  return { isValid: true, digitsOnly };
}

console.log('Testing phone validation logic:\n');
console.log('=' .repeat(80));

let passedTests = 0;
let failedTests = 0;

testPhoneNumbers.forEach(test => {
  const result = validatePhoneNumber(test.number);
  const passed = result.isValid === test.shouldPass;
  
  if (passed) {
    console.log(`✅ PASS: ${test.description}`);
    console.log(`   Input: "${test.number}"`);
    if (result.digitsOnly) {
      console.log(`   Digits: ${result.digitsOnly} (${result.digitsOnly.length} digits)`);
    }
    passedTests++;
  } else {
    console.log(`❌ FAIL: ${test.description}`);
    console.log(`   Input: "${test.number}"`);
    console.log(`   Expected: ${test.shouldPass ? 'VALID' : 'INVALID'}`);
    console.log(`   Got: ${result.isValid ? 'VALID' : 'INVALID'}`);
    if (!result.isValid) {
      console.log(`   Error: ${result.message}`);
    }
    failedTests++;
  }
  console.log('');
});

console.log('=' .repeat(80));
console.log(`\nTest Results: ${passedTests} passed, ${failedTests} failed`);

if (failedTests === 0) {
  console.log('✅ All phone validation tests passed!');
  process.exit(0);
} else {
  console.log('❌ Some tests failed. Please review the validation logic.');
  process.exit(1);
}