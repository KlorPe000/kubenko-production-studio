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

// Portfolio items table - restructured for category-based approach
export const portfolioItems = pgTable("portfolio_items", {
  id: serial("id").primaryKey(),
  categoryName: varchar("category_name", { length: 255 }).notNull(), // e.g. "Свадьба Анны и Алексея"
  categoryPreview: text("category_preview"), // Main preview image for the entire category block
  photoThumbnail: text("photo_thumbnail"), // Photo section thumbnail
  photos: text("photos").array(), // array of photo URLs
  videoThumbnail: text("video_thumbnail"), // Video section thumbnail (optional)
  videoUrl: text("video_url"), // YouTube/video URL
  isPublished: boolean("is_published").default(true),
  orderIndex: integer("order_index").default(0), // for sorting
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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

// Booked dates table
export const bookedDates = pgTable("booked_dates", {
  id: serial("id").primaryKey(),
  date: text("date").notNull().unique(), // Format: YYYY-MM-DD
  description: text("description"), // Optional description for the booking
  createdAt: timestamp("created_at").defaultNow().notNull(),
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
  categoryName: z.string().min(1, "Назва категорії обов'язкова"),
  categoryPreview: z.string().optional().or(z.literal("")),
  photoThumbnail: z.string().optional().or(z.literal("")),
  photos: z.array(z.string()).optional(),
  videoThumbnail: z.string().optional().or(z.literal("")),
  videoUrl: z.string().optional().or(z.literal("")),
  isPublished: z.boolean().default(true),
  orderIndex: z.number().default(0),
});

export const insertAdminUserSchema = createInsertSchema(adminUsers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  passwordHash: true,
}).extend({
  username: z.string().min(3, "Ім'я користувача мінімум 3 символи"),
  email: z.string().email("Невірний формат email"),
  password: z.string().min(1, "Пароль обов'язковий"),
});

export const adminLoginSchema = z.object({
  username: z.string().min(1, "Ім'я користувача обов'язкове"),
  password: z.string().min(1, "Пароль обов'язковий"),
});

export const insertBookedDateSchema = createInsertSchema(bookedDates).omit({
  id: true,
  createdAt: true,
}).extend({
  date: z.string().min(1, "Дата обов'язкова").regex(/^\d{4}-\d{2}-\d{2}$/, "Невірний формат дати"),
  description: z.string().optional(),
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
export type InsertBookedDate = z.infer<typeof insertBookedDateSchema>;
export type BookedDate = typeof bookedDates.$inferSelect;
