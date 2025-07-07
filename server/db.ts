import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Configure connection settings for better reliability
neonConfig.poolQueryViaFetch = true;
neonConfig.fetchConnectionCache = true;

let pool: Pool | null = null;
let db: ReturnType<typeof drizzle> | null = null;

if (process.env.DATABASE_URL) {
  try {
    // Log URL for debugging (hide password)
    const urlForLogging = process.env.DATABASE_URL.replace(/:[^:]*@/, ':***@');
    console.log("Using DATABASE_URL:", urlForLogging);
    
    pool = new Pool({ 
      connectionString: process.env.DATABASE_URL,
      connectionTimeoutMillis: 30000,
      idleTimeoutMillis: 60000,
      max: 20
    });
    db = drizzle({ client: pool, schema });
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
