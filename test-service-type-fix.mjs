#!/usr/bin/env node

import { db } from "./server/db.js";
import { generateTestJobs, clearTestData } from "./server/test-mode-service.js";
import { jobs } from "./shared/schema.js";
import { eq } from "drizzle-orm";

console.log("Testing serviceTypeId fix in job generation...\n");

try {
  // First clear any existing test data
  console.log("Clearing existing test data...");
  await clearTestData();
  
  // Generate new test jobs
  console.log("Generating 3 test jobs...");
  const generatedJobs = await generateTestJobs(3);
  
  // Verify that all jobs have serviceTypeId
  console.log("\n✅ Verification Results:");
  console.log("─".repeat(50));
  
  for (const job of generatedJobs) {
    console.log(`\n📋 Job: ${job.jobNumber}`);
    console.log(`   Service Type: ${job.serviceType}`);
    console.log(`   Service Type ID: ${job.serviceTypeId || '❌ MISSING!'}`);
    console.log(`   Status: ${job.status}`);
    
    if (!job.serviceTypeId) {
      throw new Error(`Job ${job.jobNumber} is missing serviceTypeId!`);
    }
  }
  
  console.log("\n" + "─".repeat(50));
  console.log("✅ SUCCESS: All test jobs have serviceTypeId field!");
  console.log("─".repeat(50));
  
  // Query from database to double-check
  const dbJobs = await db.select()
    .from(jobs)
    .where(eq(jobs.isTestData, true))
    .limit(3);
  
  console.log(`\n📊 Database verification: ${dbJobs.length} jobs found`);
  for (const dbJob of dbJobs) {
    console.log(`   ${dbJob.jobNumber}: serviceTypeId = ${dbJob.serviceTypeId || 'NULL'}`);
  }
  
} catch (error) {
  console.error("❌ Test failed:", error.message);
  process.exit(1);
}

console.log("\n✅ Test completed successfully!");
process.exit(0);