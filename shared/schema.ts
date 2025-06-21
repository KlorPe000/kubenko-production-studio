import { pgTable, text, serial, timestamp, boolean, varchar, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const contactSubmissions = pgTable("contact_submissions", {
  id: serial("id").primaryKey(),
  brideName: text("bride_name").notNull(),
  groomName: text("groom_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  weddingDate: text("wedding_date").notNull(),
  location: text("location").notNull(),
  services: text("services").array().default([]),
  additionalInfo: text("additional_info"),
  attachments: text("attachments").array().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Portfolio items table
export const portfolioItems = pgTable("portfolio_items", {
  id: serial("id").primaryKey(),
  type: varchar("type", { length: 20 }).notNull(), // 'video' | 'photo'
  category: varchar("category", { length: 100 }).notNull(),
  couple: varchar("couple", { length: 255 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  videoUrl: text("video_url"), // for video items
  thumbnail: text("thumbnail"), // thumbnail image URL
  photos: text("photos").array(), // array of photo URLs for photo items
  isPublished: boolean("is_published").default(true),
  orderIndex: integer("order_index").default(0), // for sorting
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Session table for connect-pg-simple
export const sessions = pgTable("session", {
  sid: varchar("sid", { length: 255 }).primaryKey(),
  sess: text("sess").notNull(),
  expire: timestamp("expire").notNull(),
});

// Admin users table
export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertContactSubmissionSchema = createInsertSchema(contactSubmissions).omit({
  id: true,
  createdAt: true,
}).extend({
  brideName: z.string().min(1, "Ім'я нареченої обов'язкове"),
  groomName: z.string().min(1, "Ім'я нареченого обов'язкове"),
  phone: z.string().min(1, "Телефон обов'язковий").regex(/^\d+$/, "Телефон повинен містити лише цифри"),
  email: z.string().email("Невірний формат email"),
  weddingDate: z.string().min(1, "Дата весілля обов'язкова"),
  location: z.string().min(1, "Локація весілля обов'язкова"),
  services: z.array(z.string()).min(1, "Оберіть послуги"),
  additionalInfo: z.string().optional(),
  attachments: z.array(z.string()).default([]),
});

export const insertPortfolioItemSchema = createInsertSchema(portfolioItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  type: z.enum(['video', 'photo']),
  category: z.string().min(1, "Категорія обов'язкова"),
  couple: z.string().min(1, "Імена пари обов'язкові"),
  title: z.string().min(1, "Заголовок обов'язковий"),
  description: z.string().min(1, "Опис обов'язковий"),
  videoUrl: z.string().optional().or(z.literal("")),
  thumbnail: z.string().optional().or(z.literal("")),
  photos: z.array(z.string()).optional(),
  isPublished: z.boolean().default(true),
  orderIndex: z.number().default(0),
});

export const insertAdminUserSchema = createInsertSchema(adminUsers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  username: z.string().min(3, "Ім'я користувача мінімум 3 символи"),
  email: z.string().email("Невірний формат email"),
  passwordHash: z.string().min(1, "Пароль обов'язковий"),
});

export const adminLoginSchema = z.object({
  username: z.string().min(1, "Ім'я користувача обов'язкове"),
  password: z.string().min(1, "Пароль обов'язковий"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertContactSubmission = z.infer<typeof insertContactSubmissionSchema>;
export type ContactSubmission = typeof contactSubmissions.$inferSelect;
export type InsertPortfolioItem = z.infer<typeof insertPortfolioItemSchema>;
export type PortfolioItem = typeof portfolioItems.$inferSelect;
export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;
export type AdminUser = typeof adminUsers.$inferSelect;
export type AdminLogin = z.infer<typeof adminLoginSchema>;
