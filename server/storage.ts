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
import bcrypt from "bcryptjs";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createContactSubmission(submission: InsertContactSubmission): Promise<ContactSubmission>;
  getContactSubmissions(): Promise<ContactSubmission[]>;

  // Portfolio methods
  getPortfolioItems(): Promise<PortfolioItem[]>;
  getPublishedPortfolioItems(): Promise<PortfolioItem[]>;
  getPortfolioItem(id: number): Promise<PortfolioItem | undefined>;
  createPortfolioItem(item: InsertPortfolioItem): Promise<PortfolioItem>;
  updatePortfolioItem(id: number, item: Partial<InsertPortfolioItem>): Promise<PortfolioItem>;
  deletePortfolioItem(id: number): Promise<void>;

  // Admin methods
  getAdminUser(username: string): Promise<AdminUser | undefined>;
  createAdminUser(admin: InsertAdminUser): Promise<AdminUser>;
  verifyAdminPassword(username: string, password: string): Promise<AdminUser | null>;

  // Booked dates methods
  getBookedDates(): Promise<BookedDate[]>;
  createBookedDate(date: InsertBookedDate): Promise<BookedDate>;
  deleteBookedDate(id: number): Promise<void>;
  isDateBooked(date: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private contactSubmissions: Map<number, ContactSubmission>;
  private portfolioItems: Map<number, PortfolioItem>;
  private adminUsers: Map<string, AdminUser>;
  private bookedDates: Map<number, BookedDate>;
  private currentUserId: number;
  private currentSubmissionId: number;
  private currentPortfolioId: number;
  private currentBookedDateId: number;

  constructor() {
    this.users = new Map();
    this.contactSubmissions = new Map();
    this.portfolioItems = new Map();
    this.adminUsers = new Map();
    this.bookedDates = new Map();
    this.currentUserId = 1;
    this.currentSubmissionId = 1;
    this.currentPortfolioId = 1;
    this.currentBookedDateId = 1;

    // Initialize with sample portfolio data
    this.initializePortfolio();
    this.initializeAdmin();
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createContactSubmission(submission: InsertContactSubmission): Promise<ContactSubmission> {
    const id = this.currentSubmissionId++;
    const contactSubmission: ContactSubmission = { 
      brideName: submission.brideName,
      groomName: submission.groomName,
      phone: submission.phone,
      email: submission.email,
      weddingDate: submission.weddingDate,
      location: submission.location,
      services: submission.services || [],
      additionalInfo: submission.additionalInfo || null,
      attachments: submission.attachments || [],
      id, 
      createdAt: new Date()
    };
    this.contactSubmissions.set(id, contactSubmission);
    return contactSubmission;
  }

  async getContactSubmissions(): Promise<ContactSubmission[]> {
    return Array.from(this.contactSubmissions.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  // Portfolio methods
  async getPortfolioItems(): Promise<PortfolioItem[]> {
    return Array.from(this.portfolioItems.values()).sort(
      (a, b) => (a.orderIndex || 0) - (b.orderIndex || 0)
    );
  }

  async getPublishedPortfolioItems(): Promise<PortfolioItem[]> {
    return Array.from(this.portfolioItems.values())
      .filter(item => item.isPublished)
      .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
  }

  async getPortfolioItem(id: number): Promise<PortfolioItem | undefined> {
    return this.portfolioItems.get(id);
  }

  async createPortfolioItem(item: InsertPortfolioItem): Promise<PortfolioItem> {
    const id = this.currentPortfolioId++;
    const portfolioItem: PortfolioItem = {
      id,
      categoryName: item.categoryName,
      categoryPreview: item.categoryPreview || null,
      photoThumbnail: item.photoThumbnail || null,
      photos: item.photos || null,
      videoThumbnail: item.videoThumbnail || null,
      videoUrl: item.videoUrl || null,
      isPublished: item.isPublished ?? true,
      orderIndex: item.orderIndex ?? 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.portfolioItems.set(id, portfolioItem);
    return portfolioItem;
  }

  async updatePortfolioItem(id: number, item: Partial<InsertPortfolioItem>): Promise<PortfolioItem> {
    const existing = this.portfolioItems.get(id);
    if (!existing) {
      throw new Error(`Portfolio item with id ${id} not found`);
    }

    const updated: PortfolioItem = {
      ...existing,
      ...item,
      updatedAt: new Date(),
    };
    this.portfolioItems.set(id, updated);
    return updated;
  }

  async deletePortfolioItem(id: number): Promise<void> {
    this.portfolioItems.delete(id);
  }

  // Admin methods
  async getAdminUser(username: string): Promise<AdminUser | undefined> {
    return this.adminUsers.get(username);
  }

  async createAdminUser(admin: InsertAdminUser): Promise<AdminUser> {
    const passwordHash = await bcrypt.hash(admin.password, 10);
    const adminUser: AdminUser = {
      id: Date.now(), // Simple ID generation for memory storage
      username: admin.username,
      email: admin.email,
      passwordHash: passwordHash,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.adminUsers.set(admin.username, adminUser);
    return adminUser;
  }

  async verifyAdminPassword(username: string, password: string): Promise<AdminUser | null> {
    const admin = this.adminUsers.get(username);
    if (!admin || !admin.isActive) {
      return null;
    }

    const isValid = await bcrypt.compare(password, admin.passwordHash);
    return isValid ? admin : null;
  }

  // Initialize sample data
  private async initializePortfolio() {
    // Portfolio is now empty - ready for new content
  }

  private async initializeAdmin() {
    // Create default admin user
    await this.createAdminUser({
      username: "rus",
      email: "admin@kubenko.com",
      password: "rus123",
    });
  }

  // Booked dates methods implementation
  async getBookedDates(): Promise<BookedDate[]> {
    return Array.from(this.bookedDates.values());
  }

  async createBookedDate(insertBookedDate: InsertBookedDate): Promise<BookedDate> {
    const id = this.currentBookedDateId++;
    const bookedDate: BookedDate = {
      ...insertBookedDate,
      id,
      description: insertBookedDate.description || null,
      createdAt: new Date()
    };
    this.bookedDates.set(id, bookedDate);
    return bookedDate;
  }

  async deleteBookedDate(id: number): Promise<void> {
    this.bookedDates.delete(id);
  }

  async isDateBooked(date: string): Promise<boolean> {
    return Array.from(this.bookedDates.values()).some(bookedDate => bookedDate.date === date);
  }
}

import { DbStorage } from "./dbStorage";

// Use database storage if DATABASE_URL is available, otherwise use memory storage
// This ensures the app works even if database connection fails
let storage: IStorage;

try {
  // Try to use database storage if DATABASE_URL is set
  if (process.env.DATABASE_URL) {
    storage = new DbStorage();
    console.log("Using database storage");
  } else {
    storage = new MemStorage();
    console.log("Using memory storage - no DATABASE_URL found");
  }
} catch (error) {
  console.error("Failed to initialize database storage, falling back to memory storage:", error);
  storage = new MemStorage();
}

export { storage };
