import { db } from "./db";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { emailService } from "./services/email-service";
import { 
  users,
  contractorProfiles,
  jobs,
  fleetAccounts,
  driverProfiles,
  contractorServices,
  contractorAvailability,
  serviceAreas,
  vehicleMaintenanceLogs,
  contractorServiceAreas,
  serviceTypes,
  type InsertUser,
  type InsertContractorProfile,
  type InsertJob,
  type InsertFleetAccount,
  type InsertDriverProfile,
  type InsertContractorService,
  type InsertContractorAvailability,
  type InsertServiceType
} from "@shared/schema";
import { eq, sql, and, like, or } from "drizzle-orm";
import { randomUUID } from "crypto";

// Test mode configuration
export function isTestModeEnabled(): boolean {
  // Never enable test mode in production deployments
  if (process.env.REPLIT_DEPLOYMENT === '1') {
    return false;
  }
  
  // In development, enable if TEST_MODE is true or NODE_ENV is test
  return process.env.TEST_MODE === 'true' || process.env.NODE_ENV === 'test';
}

// Detroit metro area data for varied test data
const DETROIT_METRO_CITIES = [
  'Detroit', 'Warren', 'Sterling Heights', 'Ann Arbor', 'Dearborn',
  'Livonia', 'Troy', 'Westland', 'Farmington Hills', 'Rochester Hills',
  'Southfield', 'Taylor', 'Pontiac', 'St. Clair Shores', 'Royal Oak'
];

const SERVICE_TYPES = [
  { name: 'Tire Repair', code: 'tire', urgency: 'high' },
  { name: 'Engine Diagnostics', code: 'engine', urgency: 'medium' },
  { name: 'Electrical Issues', code: 'electrical', urgency: 'medium' },
  { name: 'Brake Service', code: 'brakes', urgency: 'high' },
  { name: 'Oil Change', code: 'oil', urgency: 'low' },
  { name: 'Coolant Leak', code: 'coolant', urgency: 'high' },
  { name: 'Transmission Issues', code: 'transmission', urgency: 'high' },
  { name: 'Battery Jump', code: 'battery', urgency: 'high' },
  { name: 'Preventive Maintenance', code: 'pm', urgency: 'low' },
  { name: 'DOT Inspection', code: 'dot', urgency: 'medium' }
];

const CONTRACTOR_SKILLS = [
  ['tire', 'brakes', 'pm'],
  ['engine', 'transmission', 'electrical'],
  ['electrical', 'battery', 'engine'],
  ['tire', 'oil', 'coolant'],
  ['brakes', 'dot', 'pm'],
  ['engine', 'transmission', 'coolant'],
  ['all'] // Some contractors can do everything
];

const TRUCK_ISSUES = [
  'Front tire flat - cannot drive',
  'Engine warning light on, losing power',
  'Brakes squealing badly, feels unsafe',
  'Coolant leak, engine overheating',
  'Dead battery, won\'t start',
  'Transmission slipping, difficult to shift',
  'Oil pressure warning, need immediate service',
  'Electrical problems, lights flickering',
  'DOT inspection due today',
  'Scheduled preventive maintenance'
];

// Store test emails for preview
interface TestEmail {
  id: string;
  to: string;
  subject: string;
  html?: string;
  text?: string;
  timestamp: string;
  status: 'sent' | 'failed' | 'queued';
  error?: string;
}

let testEmails: TestEmail[] = [];

// Override email service for test mode
export function captureTestEmail(to: string, subject: string, html: string, text?: string) {
  if (!isTestModeEnabled()) {
    return;
  }

  const email: TestEmail = {
    id: randomUUID(),
    to,
    subject,
    html,
    text,
    timestamp: new Date().toISOString(),
    status: 'sent'
  };

  testEmails.push(email);
  
  // Keep only last 100 emails
  if (testEmails.length > 100) {
    testEmails = testEmails.slice(-100);
  }

  // Log to console for debugging
  console.log('📧 [TEST EMAIL CAPTURED]');
  console.log('To:', to);
  console.log('Subject:', subject);
  console.log('---');
}

// Get captured test emails
export function getTestEmails(): TestEmail[] {
  return testEmails;
}

// Clear test emails
export function clearTestEmails(): void {
  testEmails = [];
}

// Ensure service types exist in the database
export async function ensureServiceTypes() {
  const serviceTypeMap = new Map<string, string>(); // code -> id
  
  for (const serviceType of SERVICE_TYPES) {
    // Check if service type exists
    const existing = await db.select()
      .from(serviceTypes)
      .where(eq(serviceTypes.code, serviceType.code))
      .limit(1);
    
    if (existing.length > 0) {
      serviceTypeMap.set(serviceType.code, existing[0].id);
    } else {
      // Create the service type
      const [created] = await db.insert(serviceTypes).values({
        code: serviceType.code,
        name: serviceType.name,
        description: `${serviceType.name} service for trucks`,
        category: 'Repair',
        estimatedDuration: 60, // Default to 60 minutes
        requiresSpecialist: serviceType.urgency === 'high',
        isActive: true
      }).returning();
      
      serviceTypeMap.set(serviceType.code, created.id);
      console.log(`✅ Created service type: ${serviceType.name}`);
    }
  }
  
  return serviceTypeMap;
}

// Generate test users
export async function createTestUsers() {
  const password = await bcrypt.hash('Test123456!', 10);
  
  const testUsers = [
    {
      email: 'testadmin@example.com',
      password,
      role: 'admin' as const,
      firstName: 'Test',
      lastName: 'Admin',
      phone: '555-0100',
      isActive: true,
      emailVerified: true,
      phoneVerified: true
    },
    {
      email: 'testcontractor@example.com',
      password,
      role: 'contractor' as const,
      firstName: 'Test',
      lastName: 'Contractor',
      phone: '555-0101',
      isActive: true,
      emailVerified: true,
      phoneVerified: true
    },
    {
      email: 'testfleet@example.com',
      password,
      role: 'fleet_manager' as const,
      firstName: 'Test',
      lastName: 'Fleet',
      phone: '555-0102',
      isActive: true,
      emailVerified: true,
      phoneVerified: true
    },
    {
      email: 'testdriver@example.com',
      password,
      role: 'driver' as const,
      firstName: 'Test',
      lastName: 'Driver',
      phone: '555-0103',
      isActive: true,
      emailVerified: true,
      phoneVerified: true
    }
  ];

  for (const userData of testUsers) {
    const existingUser = await db.select().from(users)
      .where(eq(users.email, userData.email))
      .limit(1);

    if (existingUser.length === 0) {
      await db.insert(users).values(userData);
      console.log(`✅ Created test user: ${userData.email}`);
    }
  }
}

// Generate test contractors with varied characteristics
export async function generateTestContractors(count: number = 5) {
  const password = await bcrypt.hash('Test123456!', 10);
  const contractors = [];

  // Ensure service types exist and get their IDs
  const serviceTypeMap = await ensureServiceTypes();

  for (let i = 0; i < count; i++) {
    const cityIndex = i % DETROIT_METRO_CITIES.length;
    const skillSetIndex = i % CONTRACTOR_SKILLS.length;
    const isOnline = true; // All contractors online as requested
    const activeJobs = Math.floor(Math.random() * 4); // 0-3 active jobs

    // Use timestamp and index to ensure unique emails even when run multiple times
    const timestamp = Date.now();
    const email = `testcontractor_${timestamp}_${i + 1}@example.com`;
    
    // Create user
    const [user] = await db.insert(users).values({
      email,
      password,
      role: 'contractor' as const,
      firstName: `Test${i + 1}`,
      lastName: 'Contractor',
      phone: `555-02${String(i).padStart(2, '0')}`,
      isActive: true,
      emailVerified: true,
      phoneVerified: true
    }).returning();

    // Create contractor profile - using only valid fields
    const [contractor] = await db.insert(contractorProfiles).values({
      userId: user.id,
      companyName: `Quick Fix ${DETROIT_METRO_CITIES[cityIndex]} #${i + 1}`,
      phoneNumber: `555-02${String(i).padStart(2, '0')}`,
      serviceArea: `${DETROIT_METRO_CITIES[cityIndex]}, MI`,
      services: CONTRACTOR_SKILLS[skillSetIndex].join(', '),
      maxDistance: 25 + Math.floor(Math.random() * 25), // 25-50 miles
      emergencyAvailable: true,
      nightTimeAvailable: i % 2 === 0, // Half available at night
      weekendAvailable: i % 3 !== 0, // Two thirds available on weekends
      isOnline,
      currentJobCount: activeJobs,
      totalJobsCompleted: Math.floor(Math.random() * 50),
      averageRating: String(4 + Math.random()), // 4.0 - 5.0
      averageResponseTime: Math.floor(Math.random() * 30) + 10, // 10-40 minutes
      fleetDiscount: i % 2 === 0 ? 10 : 0, // Half offer fleet discounts
      regularRate: 100 + Math.floor(Math.random() * 50), // $100-$150
      emergencyRate: 150 + Math.floor(Math.random() * 100), // $150-$250
      profileComplete: true
    }).returning();

    // Add services with proper serviceTypeId
    const skills = CONTRACTOR_SKILLS[skillSetIndex];
    for (const skill of skills) {
      if (skill === 'all') {
        // Add all services
        for (const service of SERVICE_TYPES) {
          const serviceTypeId = serviceTypeMap.get(service.code);
          if (serviceTypeId) {
            await db.insert(contractorServices).values({
              contractorId: user.id, // Use user.id since contractorServices references users, not contractorProfiles
              serviceTypeId: serviceTypeId,
              isAvailable: true,
              customRate: 100 + Math.random() * 200,
              experienceYears: Math.floor(Math.random() * 10) + 1,
              certificationLevel: ['basic', 'intermediate', 'expert'][Math.floor(Math.random() * 3)]
            });
          }
        }
      } else {
        const serviceTypeId = serviceTypeMap.get(skill);
        if (serviceTypeId) {
          await db.insert(contractorServices).values({
            contractorId: user.id, // Use user.id since contractorServices references users, not contractorProfiles
            serviceTypeId: serviceTypeId,
            isAvailable: true,
            customRate: 100 + Math.random() * 200,
            experienceYears: Math.floor(Math.random() * 10) + 1,
            certificationLevel: ['basic', 'intermediate', 'expert'][Math.floor(Math.random() * 3)]
          });
        }
      }
    }

    // Add availability - using user.id since contractorAvailability references users
    await db.insert(contractorAvailability).values({
      contractorId: user.id,
      dayOfWeek: 1, // Monday through Friday
      startTime: '08:00',
      endTime: '18:00',
      isOnCall: false
    });

    // Note: Skip service areas for now as they would need to reference existing serviceAreas records
    // The contractorServiceAreas table requires a serviceAreaId that references the serviceAreas table
    // To properly implement this, we would need to:
    // 1. Query or create service areas in the serviceAreas table
    // 2. Then link contractors to those areas using contractorServiceAreas
    // For now, the contractors are created without specific service area assignments

    contractors.push(contractor);
    console.log(`✅ Created test contractor: ${email} in ${DETROIT_METRO_CITIES[cityIndex]}`);
  }

  return contractors;
}

// Generate test jobs with varied characteristics
export async function generateTestJobs(count: number = 10) {
  const jobsList = [];
  
  // Ensure service types exist and get their IDs
  const serviceTypeMap = await ensureServiceTypes();
  
  // Get some test users to be customers
  const testDrivers = await db.select().from(users)
    .where(eq(users.role, 'driver'))
    .limit(5);

  const testContractors = await db.select().from(contractorProfiles)
    .limit(5);

  // Use timestamp for unique job generation
  const timestamp = Date.now();
  
  for (let i = 0; i < count; i++) {
    const cityIndex = i % DETROIT_METRO_CITIES.length;
    const serviceIndex = i % SERVICE_TYPES.length;
    const issueIndex = i % TRUCK_ISSUES.length;
    const service = SERVICE_TYPES[serviceIndex];
    
    // Determine status based on index for variety
    let status: 'new' | 'assigned' | 'en_route' | 'on_site' | 'completed' | 'cancelled';
    let assignedTo = null;
    
    if (i < 3) {
      status = 'new';
    } else if (i < 6) {
      status = 'assigned';
      assignedTo = testContractors[i % testContractors.length]?.id || null;
    } else if (i < 8) {
      status = 'on_site';
      assignedTo = testContractors[i % testContractors.length]?.id || null;
    } else {
      status = 'completed';
      assignedTo = testContractors[i % testContractors.length]?.id || null;
    }

    const customer = testDrivers[i % testDrivers.length];
    const isEmergency = service.urgency === 'high';

    const [job] = await db.insert(jobs).values({
      jobNumber: `JOB-${timestamp}-${i}`, // Add unique job number
      customerId: customer?.id || randomUUID(),
      customerName: customer ? `${customer.firstName} ${customer.lastName}` : `Test Customer ${i + 1}`,
      customerPhone: customer?.phone || `555-10${String(i).padStart(2, '0')}`,
      customerEmail: customer?.email || `testcustomer_${timestamp}_${i + 1}@example.com`,
      vehicleInfo: {
        make: ['Freightliner', 'Peterbilt', 'Volvo', 'Kenworth'][i % 4],
        model: ['Cascadia', '579', 'VNL', 'T680'][i % 4],
        year: 2018 + (i % 6),
        licensePlate: `TEST${String(i).padStart(3, '0')}`,
        vin: `VIN${String(i).padStart(14, '0')}`,
        unitNumber: `UNIT-${String(i).padStart(3, '0')}`
      },
      serviceType: service.name,
      serviceTypeId: serviceTypeMap.get(service.code),
      description: TRUCK_ISSUES[issueIndex],
      location: {
        address: `${1000 + i * 100} Highway ${i + 1}`,
        city: DETROIT_METRO_CITIES[cityIndex],
        state: 'MI',
        zipCode: `4820${i}`,
        lat: 42.3314 + (Math.random() - 0.5) * 0.5, // Around Detroit
        lng: -83.0458 + (Math.random() - 0.5) * 0.5
      },
      status,
      priority: service.urgency as 'low' | 'medium' | 'high',
      scheduledFor: isEmergency ? null : new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000),
      assignedTo,
      jobType: isEmergency ? 'emergency' : 'scheduled',
      estimatedCost: 200 + Math.random() * 800,
      estimatedDuration: 30 + Math.floor(Math.random() * 120),
      photos: [],
      notes: `Test job ${i + 1} - ${service.name}`,
      weatherConditions: {
        temperature: 60 + Math.floor(Math.random() * 30),
        condition: ['clear', 'cloudy', 'rain', 'snow'][i % 4],
        visibility: 'good'
      },
      trafficConditions: ['light', 'moderate', 'heavy'][i % 3],
      isTestData: true
    }).returning();

    jobsList.push(job);
    console.log(`✅ Created test job: ${service.name} in ${DETROIT_METRO_CITIES[cityIndex]} (${status})`);
  }

  return jobsList;
}

// Generate test drivers
export async function generateTestDrivers(count: number = 5) {
  const password = await bcrypt.hash('Test123456!', 10);
  const drivers = [];

  for (let i = 0; i < count; i++) {
    // Use timestamp and index to ensure unique emails even when run multiple times
    const timestamp = Date.now();
    const email = `testdriver_${timestamp}_${i + 1}@example.com`;
    const cityIndex = i % DETROIT_METRO_CITIES.length;

    // Create user
    const [user] = await db.insert(users).values({
      email,
      password,
      role: 'driver' as const,
      firstName: `Test${i + 1}`,
      lastName: 'Driver',
      phone: `555-04${String(i).padStart(2, '0')}`,
      isActive: true,
      emailVerified: true,
      phoneVerified: true
    }).returning();

    // Create driver profile
    const [driver] = await db.insert(driverProfiles).values({
      userId: user.id,
      licenseNumber: `DL${String(i).padStart(6, '0')}`,
      licenseState: 'MI',
      licenseExpiry: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000),
      cdlClass: ['A', 'B'][i % 2],
      vehicleType: ['Semi Truck', 'Box Truck', 'Flatbed'][i % 3],
      vehicleMake: ['Freightliner', 'Peterbilt', 'Volvo'][i % 3],
      vehicleModel: ['Cascadia', '579', 'VNL'][i % 3],
      vehicleYear: String(2018 + (i % 6)),
      vehiclePlate: `PLATE${String(i).padStart(3, '0')}`,
      insuranceProvider: 'Test Insurance',
      insurancePolicyNumber: `INS${String(i).padStart(6, '0')}`,
      insuranceExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      yearsExperience: Math.floor(Math.random() * 15) + 1,
      currentLocation: {
        lat: 42.3314 + (Math.random() - 0.5) * 0.5,
        lng: -83.0458 + (Math.random() - 0.5) * 0.5,
        city: DETROIT_METRO_CITIES[cityIndex],
        state: 'MI'
      },
      homeBase: `${DETROIT_METRO_CITIES[cityIndex]}, MI`,
      isOwnerOperator: i % 3 === 0,
      fleetId: null
    }).returning();

    drivers.push(driver);
    console.log(`✅ Created test driver: ${email} in ${DETROIT_METRO_CITIES[cityIndex]}`);
  }

  return drivers;
}

// Clear all test data
export async function clearTestData() {
  try {
    // Delete test users and related data
    await db.delete(users)
      .where(like(users.email, '%@example.com'));

    // Delete test jobs
    await db.delete(jobs)
      .where(eq(jobs.isTestData, true));

    // Clear test emails
    clearTestEmails();

    console.log('✅ All test data cleared');
    return { success: true, message: 'Test data cleared successfully' };
  } catch (error) {
    console.error('Error clearing test data:', error);
    return { success: false, error: 'Failed to clear test data' };
  }
}

// Get test data statistics
export async function getTestDataStats() {
  try {
    const contractorCount = await db.select({ count: sql`count(*)` })
      .from(contractorProfiles)
      .innerJoin(users, eq(contractorProfiles.userId, users.id))
      .where(like(users.email, '%@example.com'));

    const jobCount = await db.select({ count: sql`count(*)` })
      .from(jobs)
      .where(eq(jobs.isTestData, true));

    const driverCount = await db.select({ count: sql`count(*)` })
      .from(driverProfiles)
      .innerJoin(users, eq(driverProfiles.userId, users.id))
      .where(like(users.email, '%@example.com'));

    const fleetCount = await db.select({ count: sql`count(*)` })
      .from(fleetAccounts)
      .where(like(fleetAccounts.companyName, 'Test%'));

    const userCount = await db.select({ count: sql`count(*)` })
      .from(users)
      .where(like(users.email, '%@example.com'));

    return {
      contractors: Number(contractorCount[0]?.count || 0),
      jobs: Number(jobCount[0]?.count || 0),
      drivers: Number(driverCount[0]?.count || 0),
      fleets: Number(fleetCount[0]?.count || 0),
      users: Number(userCount[0]?.count || 0),
      emails: testEmails.length
    };
  } catch (error) {
    console.error('Error getting test data stats:', error);
    return {
      contractors: 0,
      jobs: 0,
      drivers: 0,
      fleets: 0,
      users: 0,
      emails: 0
    };
  }
}

// Initialize test mode (create default test users if needed)
export async function initializeTestMode() {
  if (!isTestModeEnabled()) {
    return;
  }

  console.log('🧪 Test mode enabled - initializing test users...');
  await createTestUsers();
  console.log('✅ Test mode initialization complete');
}