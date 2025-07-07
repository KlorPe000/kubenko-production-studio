import { db } from "./db-pg";
import { 
  users, 
  contactSubmissions, 
  portfolioItems,
  adminUsers,
  bookedDates
} from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function initializeDatabase() {
  console.log("Initializing database...");
  
  if (!process.env.DATABASE_URL || !db) {
    console.log("Database not available, skipping initialization");
    return;
  }
  
  // Version identifier - change this when you need to force updates
  const DB_VERSION = '2025-07-06-v2';
  console.log(`Database version: ${DB_VERSION}`);
  
  try {
    // First, ensure tables exist with correct structure
    console.log("Ensuring database schema exists...");
    
    try {
      // Check if tables exist and createa them if they don't
      console.log("Creating tables if they don't exist...");
      
      await db.execute(`
        CREATE TABLE IF NOT EXISTS "users" (
          "id" serial PRIMARY KEY NOT NULL,
          "username" text NOT NULL,
          "password" text NOT NULL,
          CONSTRAINT "users_username_unique" UNIQUE("username")
        );
      `);
      
      await db.execute(`
        CREATE TABLE IF NOT EXISTS "admin_users" (
          "id" serial PRIMARY KEY NOT NULL,
          "username" varchar(100) NOT NULL,
          "email" varchar(255) NOT NULL,
          "password_hash" varchar(255) NOT NULL,
          "is_active" boolean DEFAULT true,
          "created_at" timestamp DEFAULT now() NOT NULL,
          "updated_at" timestamp DEFAULT now() NOT NULL,
          CONSTRAINT "admin_users_username_unique" UNIQUE("username"),
          CONSTRAINT "admin_users_email_unique" UNIQUE("email")
        );
      `);
      
      await db.execute(`
        CREATE TABLE IF NOT EXISTS "contact_submissions" (
          "id" serial PRIMARY KEY NOT NULL,
          "bride_name" text NOT NULL,
          "groom_name" text NOT NULL,
          "phone" text NOT NULL,
          "email" text NOT NULL,
          "wedding_date" text NOT NULL,
          "location" text NOT NULL,
          "services" text[] DEFAULT '{}' NOT NULL,
          "additional_info" text,
          "attachments" text[] DEFAULT '{}' NOT NULL,
          "created_at" timestamp DEFAULT now() NOT NULL
        );
      `);
      
      await db.execute(`
        CREATE TABLE IF NOT EXISTS "portfolio_items" (
          "id" serial PRIMARY KEY NOT NULL,
          "category_name" varchar(255) NOT NULL,
          "category_preview" text,
          "photo_thumbnail" text,
          "photos" text[],
          "video_thumbnail" text,
          "video_url" text,
          "is_published" boolean DEFAULT true NOT NULL,
          "order_index" integer DEFAULT 0,
          "created_at" timestamp DEFAULT now() NOT NULL,
          "updated_at" timestamp DEFAULT now() NOT NULL
        );
      `);
      
      await db.execute(`
        CREATE TABLE IF NOT EXISTS "booked_dates" (
          "id" serial PRIMARY KEY NOT NULL,
          "date" text NOT NULL,
          "description" text,
          "created_at" timestamp DEFAULT now() NOT NULL,
          CONSTRAINT "booked_dates_date_unique" UNIQUE("date")
        );
      `);
      
      // Try to add missing columns to existing tables if needed
      console.log("Checking and updating table structure...");
      
      // Add missing columns to admin_users if they don't exist
      try {
        await db.execute(`ALTER TABLE "admin_users" ADD COLUMN IF NOT EXISTS "email" varchar(255);`);
        await db.execute(`ALTER TABLE "admin_users" ADD COLUMN IF NOT EXISTS "password_hash" varchar(255);`);
        await db.execute(`ALTER TABLE "admin_users" ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true;`);
        await db.execute(`ALTER TABLE "admin_users" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now();`);
        await db.execute(`ALTER TABLE "admin_users" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now();`);
      } catch (alterError) {
        console.log("Column additions completed (some may already exist)");
      }
      
      // Add missing columns to portfolio_items if they don't exist
      try {
        await db.execute(`ALTER TABLE "portfolio_items" ADD COLUMN IF NOT EXISTS "category_preview" text;`);
        await db.execute(`ALTER TABLE "portfolio_items" ADD COLUMN IF NOT EXISTS "order_index" integer DEFAULT 0;`);
        await db.execute(`ALTER TABLE "portfolio_items" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now();`);
      } catch (alterError) {
        console.log("Portfolio column additions completed (some may already exist)");
      }
      
      console.log("Database schema created/updated successfully");
    } catch (schemaError) {
      console.error("Schema creation error:", schemaError);
      throw schemaError;
    }
    
    // Check if admin user exists and update if needed
    console.log("Checking admin user configuration...");
    
    // Remove old admin user if exists
    const oldAdminExists = await db.select().from(adminUsers).where(eq(adminUsers.username, 'admin')).limit(1);
    if (oldAdminExists.length > 0) {
      console.log("Removing old admin user (admin)...");
      await db.delete(adminUsers).where(eq(adminUsers.username, 'admin'));
      console.log("Old admin user removed successfully");
    }
    
    // Check current admin user
    const currentAdmin = await db.select().from(adminUsers).where(eq(adminUsers.username, 'rus')).limit(1);
    
    if (currentAdmin.length === 0) {
      console.log("Creating new admin user (rus)...");
      const hashedPassword = await bcrypt.hash("rus123", 10);
      await db.insert(adminUsers).values({
        username: "rus",
        email: "rus@kubenko.com",
        passwordHash: hashedPassword,
        isActive: true
      });
      console.log("Admin user created successfully");
    } else {
      // Force update password to ensure latest code changes apply
      console.log("Updating admin password to match current code...");
      const hashedPassword = await bcrypt.hash("rus123", 10);
      await db.update(adminUsers)
        .set({ 
          passwordHash: hashedPassword,
          email: "rus@kubenko.com",
          isActive: true
        })
        .where(eq(adminUsers.username, 'rus'));
      console.log("Admin user updated successfully");
    }
    
    // Portfolio table is ready, no default items needed
    console.log("Portfolio table is ready for your content");
    
    console.log("Database initialization completed successfully");
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
}