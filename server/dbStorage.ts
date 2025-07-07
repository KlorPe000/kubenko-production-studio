import { 
  users, 
  contactSubmissions, 
  portfolioItems,
  adminUsers,
  bookedDates,
  type User, 
  type InsertUser, 
  type ContactSubmission, 
  type InsertContactSubmission,
  type PortfolioItem,
  type InsertPortfolioItem,
  type AdminUser,
  type InsertAdminUser,
  type BookedDate,
  type InsertBookedDate
} from "@shared/schema";
import { eq } from "drizzle-orm";
import { db } from "./db-pg";
import bcrypt from "bcryptjs";
import { IStorage } from "./storage";

export class DbStorage implements IStorage {
  private checkDb() {
    if (!db) {
      throw new Error("Database connection not available");
    }
    return db;
  }

  async getUser(id: number): Promise<User | undefined> {
    const database = this.checkDb();
    const result = await database.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const [created] = await db.insert(users).values({
      ...user,
      password: hashedPassword
    }).returning();
    return created;
  }

  async createContactSubmission(submission: InsertContactSubmission): Promise<ContactSubmission> {
    const [created] = await db.insert(contactSubmissions).values(submission).returning();
    return created;
  }

  async getContactSubmissions(): Promise<ContactSubmission[]> {
    return await db.select().from(contactSubmissions);
  }

  // Portfolio methods
  async getPortfolioItems(): Promise<PortfolioItem[]> {
    return await db.select().from(portfolioItems);
  }

  async getPublishedPortfolioItems(): Promise<PortfolioItem[]> {
    return await db.select().from(portfolioItems).where(eq(portfolioItems.isPublished, true));
  }

  async getPortfolioItem(id: number): Promise<PortfolioItem | undefined> {
    const result = await db.select().from(portfolioItems).where(eq(portfolioItems.id, id));
    return result[0];
  }

  async createPortfolioItem(item: InsertPortfolioItem): Promise<PortfolioItem> {
    const [created] = await db.insert(portfolioItems).values(item).returning();
    return created;
  }

  async updatePortfolioItem(id: number, item: Partial<InsertPortfolioItem>): Promise<PortfolioItem> {
    const [updated] = await db.update(portfolioItems)
      .set(item)
      .where(eq(portfolioItems.id, id))
      .returning();
    return updated;
  }

  async deletePortfolioItem(id: number): Promise<void> {
    await db.delete(portfolioItems).where(eq(portfolioItems.id, id));
  }

  // Admin methods
  async getAdminUser(username: string): Promise<AdminUser | undefined> {
    const result = await db.select().from(adminUsers).where(eq(adminUsers.username, username));
    return result[0];
  }

  async createAdminUser(admin: InsertAdminUser): Promise<AdminUser> {
    const hashedPassword = await bcrypt.hash(admin.password, 10);
    const [created] = await db.insert(adminUsers).values({
      username: admin.username,
      email: admin.email,
      passwordHash: hashedPassword
    }).returning();
    return created;
  }

  async verifyAdminPassword(username: string, password: string): Promise<AdminUser | null> {
    const admin = await this.getAdminUser(username);
    if (!admin) return null;
    
    const isValid = await bcrypt.compare(password, admin.passwordHash);
    return isValid ? admin : null;
  }

  // Booked dates methods
  async getBookedDates(): Promise<BookedDate[]> {
    return await db.select().from(bookedDates);
  }

  async createBookedDate(date: InsertBookedDate): Promise<BookedDate> {
    const [created] = await db.insert(bookedDates).values(date).returning();
    return created;
  }

  async deleteBookedDate(id: number): Promise<void> {
    await db.delete(bookedDates).where(eq(bookedDates.id, id));
  }

  async isDateBooked(date: string): Promise<boolean> {
    const result = await db.select().from(bookedDates).where(eq(bookedDates.date, date));
    return result.length > 0;
  }
}