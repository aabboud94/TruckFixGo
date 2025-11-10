#!/usr/bin/env node
// Create test contractor account and fix assignment
import bcrypt from 'bcrypt';
import pkg from 'pg';
const { Pool } = pkg;

// Get database URL from environment
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

async function setupContractor() {
  const pool = new Pool({ connectionString: DATABASE_URL });
  
  try {
    console.log('Creating test contractor account...');
    
    // Hash the password
    const hashedPassword = await bcrypt.hash('contractor123', 10);
    
    // Create user
    const userResult = await pool.query(`
      INSERT INTO users (id, email, password, first_name, last_name, phone, role, created_at, updated_at)
      VALUES (
        gen_random_uuid(),
        'contractor@test.com',
        $1,
        'Test',
        'Contractor',
        '555-111-2222',
        'contractor',
        NOW(),
        NOW()
      )
      ON CONFLICT (email) 
      DO UPDATE SET password = $1
      RETURNING id, email
    `, [hashedPassword]);
    
    const userId = userResult.rows[0]?.id;
    console.log('✅ User created:', userResult.rows[0]?.email);
    console.log('   User ID:', userId);
    
    // Create contractor profile
    await pool.query(`
      INSERT INTO contractor_profiles (
        id,
        user_id,
        performance_tier,
        service_radius,
        total_jobs_completed,
        average_rating,
        is_fleet_capable,
        has_mobile_water_source,
        has_wastewater_recovery,
        is_available,
        is_verified_contractor,
        is_featured_contractor,
        profile_completeness,
        five_star_count,
        four_star_count,
        three_star_count,
        two_star_count,
        one_star_count,
        created_at,
        updated_at
      )
      VALUES (
        gen_random_uuid(),
        $1,
        'silver',
        100,
        25,
        4.5,
        true,
        true,
        true,
        true,
        true,
        false,
        100,
        20,
        3,
        2,
        0,
        0,
        NOW(),
        NOW()
      )
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        is_available = true,
        performance_tier = 'silver',
        service_radius = 100
    `, [userId]);
    
    console.log('✅ Contractor profile created');
    console.log('\n========================================');
    console.log('📋 TEST CONTRACTOR ACCOUNT READY:');
    console.log('========================================');
    console.log('Email: contractor@test.com');
    console.log('Password: contractor123');
    console.log('Login at: http://localhost:5000/contractor/login');
    console.log('========================================\n');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

setupContractor();