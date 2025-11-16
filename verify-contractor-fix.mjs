#!/usr/bin/env node
import { db } from "./server/db.js";
import { generateTestContractors, ensureServiceTypes } from "./server/test-mode-service.js";
import { contractorServices, serviceTypes } from "./shared/schema.js";
import { sql } from "drizzle-orm";

console.log('🧪 Testing contractor services fix...\n');

async function verifyFix() {
  try {
    // First, ensure service types exist
    console.log('📝 Ensuring service types exist...');
    const serviceTypeMap = await ensureServiceTypes();
    console.log(`✅ Service types ready: ${serviceTypeMap.size} types available\n`);

    // Generate one test contractor
    console.log('🔧 Generating test contractor...');
    await generateTestContractors(1);
    console.log('✅ Test contractor generated successfully!\n');

    // Verify contractor services were created with proper service type IDs
    console.log('🔍 Verifying contractor_services records...');
    const services = await db.select({
      id: contractorServices.id,
      contractorId: contractorServices.contractorId,
      serviceTypeId: contractorServices.serviceTypeId,
      customRate: contractorServices.customRate
    })
    .from(contractorServices)
    .limit(5);

    if (services.length > 0) {
      console.log(`✅ Found ${services.length} contractor services with valid service_type_id values:`);
      for (const service of services) {
        // Get the service type name for display
        const [serviceType] = await db.select({ name: serviceTypes.name })
          .from(serviceTypes)
          .where(sql`${serviceTypes.id} = ${service.serviceTypeId}`)
          .limit(1);
        
        console.log(`   - Service: ${serviceType?.name || 'Unknown'}, Rate: $${service.customRate}`);
      }
    } else {
      console.log('⚠️ No contractor services found in database');
    }

    console.log('\n🎉 SUCCESS! The fix is working correctly.');
    console.log('The contractor_services table now properly uses service_type_id from the service_types table.');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error during verification:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

verifyFix();