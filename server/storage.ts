import { 
  users, 
  contactSubmissions, 
  portfolioItems,
  adminUsers,
  type User, 
  type InsertUser, 
  type ContactSubmission, 
  type InsertContactSubmission,
  type PortfolioItem,
  type InsertPortfolioItem,
  type AdminUser,
  type InsertAdminUser
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
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private contactSubmissions: Map<number, ContactSubmission>;
  private portfolioItems: Map<number, PortfolioItem>;
  private adminUsers: Map<string, AdminUser>;
  private currentUserId: number;
  private currentSubmissionId: number;
  private currentPortfolioId: number;

  constructor() {
    this.users = new Map();
    this.contactSubmissions = new Map();
    this.portfolioItems = new Map();
    this.adminUsers = new Map();
    this.currentUserId = 1;
    this.currentSubmissionId = 1;
    this.currentPortfolioId = 1;

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
      type: item.type,
      category: item.category,
      couple: item.couple,
      title: item.title,
      description: item.description,
      videoUrl: item.videoUrl || null,
      thumbnail: item.thumbnail || null,
      photos: item.photos || null,
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
    const adminUser: AdminUser = {
      ...admin,
      id: Date.now(), // Simple ID generation for memory storage
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
    const sampleItems: InsertPortfolioItem[] = [
      {
        type: "video",
        category: "Весільний кліп",
        couple: "Анна та Олексій",
        title: "Романтична історія кохання",
        description: "Емоційний кліп з найяскравішими моментами весільного дня",
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        thumbnail: undefined,
        photos: undefined,
        isPublished: true,
        orderIndex: 1,
      },
      {
        type: "video",
        category: "Весільний фільм",
        couple: "Марія та Дмитро",
        title: "Повна історія весільного дня",
        description: "Детальний фільм з усіма важливими моментами церемонії та банкету",
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        thumbnail: undefined,
        photos: undefined,
        isPublished: true,
        orderIndex: 2,
      },
      {
        type: "photo",
        category: "Весільна фотосесія",
        couple: "Катерина та Ігор",
        title: "Підготовка до свята",
        description: "Фотозйомка ранкових зборів нареченої та підготовки нареченого",
        videoUrl: undefined,
        thumbnail: undefined,
        photos: [
          "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&h=600&fit=crop",
          "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=800&h=600&fit=crop",
          "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=600&fit=crop",
        ],
        isPublished: true,
        orderIndex: 3,
      },
    ];

    for (const item of sampleItems) {
      await this.createPortfolioItem(item);
    }
  }

  private async initializeAdmin() {
    // Create default admin user (admin/admin123)
    const passwordHash = await bcrypt.hash("admin123", 10);
    await this.createAdminUser({
      username: "admin",
      email: "admin@kubenko.com",
      passwordHash,
    });
  }
}

export const storage = new MemStorage();
