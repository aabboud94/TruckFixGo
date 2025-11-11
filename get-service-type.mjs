import { db } from "./server/db.js";
import { serviceTypes } from "./shared/schema.js";

try {
  const types = await db.select().from(serviceTypes).limit(1);
  if (types.length > 0) {
    console.log('Valid serviceTypeId:', types[0].id);
  } else {
    console.log('No service types found in database');
  }
  process.exit(0);
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
