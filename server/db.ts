import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import pRetry from 'p-retry';

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Enhanced pool configuration with connection retry logic
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum number of connections in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 5000, // Return an error after 5 seconds if connection could not be established
});

// Add connection error handling
pool.on('error', (err) => {
  console.error('[Database] Unexpected pool error:', err);
});

// Create database instance with schema
export const db = drizzle({ client: pool, schema });

// Helper function to execute queries with retry logic
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  options = {}
): Promise<T> {
  return pRetry(operation, {
    retries: 3,
    minTimeout: 1000,
    maxTimeout: 5000,
    onFailedAttempt: error => {
      const originalError = error as any;
      console.error(`[Database] Attempt ${originalError.attemptNumber} failed. ${originalError.retriesLeft} retries left.`);
      if (originalError.message) {
        console.error('[Database] Error:', originalError.message);
        
        // If it's a connection error, log more details
        if (originalError.message.includes('endpoint has been disabled')) {
          console.error('[Database] Neon endpoint is disabled. Database may be paused due to inactivity.');
        }
      }
    },
    ...options
  });
}

// Helper to check database connectivity
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    console.log('[Database] Connection check successful');
    return true;
  } catch (error) {
    console.error('[Database] Connection check failed:', error);
    return false;
  }
}

// Initialize database connection on startup
checkDatabaseConnection().then(connected => {
  if (connected) {
    console.log('[Database] Successfully connected to PostgreSQL');
  } else {
    console.error('[Database] Failed to connect to PostgreSQL - scheduled tasks may fail');
  }
});
