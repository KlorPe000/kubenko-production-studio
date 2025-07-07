import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from "@shared/schema";

let pool: Pool | null = null;
let db: ReturnType<typeof drizzle> | null = null;

if (process.env.DATABASE_URL) {
  try {
    // Log URL for debugging (hide password)
    const urlForLogging = process.env.DATABASE_URL.replace(/:[^:]*@/, ':***@');
    console.log("Using DATABASE_URL:", urlForLogging);
    
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    
    db = drizzle(pool, { schema });
    console.log("Database connection initialized successfully");
  } catch (error) {
    console.error("Failed to initialize database connection:", error);
    pool = null;
    db = null;
  }
} else {
  console.log("No DATABASE_URL found - will use memory storage");
}

export { pool, db };