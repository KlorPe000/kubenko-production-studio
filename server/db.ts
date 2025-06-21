import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Only require DATABASE_URL in production or when explicitly using database
const isDevelopment = process.env.NODE_ENV === 'development';
const forceDatabase = process.env.FORCE_DATABASE === 'true';

if (!process.env.DATABASE_URL && (!isDevelopment || forceDatabase)) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configure connection pool for production
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum number of connections in the pool
  idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
  connectionTimeoutMillis: 5000, // Wait 5 seconds for connection
});

export const db = drizzle({ client: pool, schema });

// Health check function for Railway
export async function checkDatabaseHealth() {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    return { status: 'healthy', timestamp: new Date().toISOString() };
  } catch (error) {
    console.error('Database health check failed:', error);
    return { 
      status: 'unhealthy', 
      error: error instanceof Error ? error.message : 'Unknown error', 
      timestamp: new Date().toISOString() 
    };
  }
}
