import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { checkDatabaseHealth } from "./db";
import { 
  insertContactSubmissionSchema, 
  insertPortfolioItemSchema,
  adminLoginSchema,
  type AdminLogin 
} from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";
import session from "express-session";

// Telegram Bot Configuration
const TELEGRAM_BOT_TOKEN = "8136389338:AAHyxZICafdZPhutPQqJmiE1s9aoY5NuTz8";
const YOUR_CHAT_ID = "1415164396"; // Your specific chat ID

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

async function sendTelegramMessage(message: string, chatId?: string) {
  try {
    const targetChatId = chatId || YOUR_CHAT_ID;
    
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: targetChatId,
        text: message,
        parse_mode: 'HTML'
      })
    });
    
    const responseData = await response.json();
    
    if (!response.ok) {
      console.error('Telegram API error:', responseData);
    } else {
      console.log('Telegram message sent successfully to chat:', targetChatId);
    }
    
    return responseData;
  } catch (error) {
    console.error('Error sending Telegram message:', error);
    throw error;
  }
}



export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint for Railway
  app.get("/health", async (req, res) => {
    try {
      const dbHealth = await checkDatabaseHealth();
      const appHealth = {
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        database: dbHealth
      };
      
      if (dbHealth.status === 'unhealthy') {
        return res.status(503).json(appHealth);
      }
      
      res.json(appHealth);
    } catch (error) {
      res.status(503).json({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Contact form submission
  app.post("/api/contact", async (req, res) => {
    try {
      // Handle FormData submission
      let submissionData;
      let uploadedFiles: Express.Multer.File[] = [];
      let totalPrice = 0;
      
      if (req.is('multipart/form-data')) {
        // Extract data from FormData
        const files = req.files as Express.Multer.File[] | undefined;
        uploadedFiles = files || [];
        totalPrice = parseInt(req.body.totalPrice || '0');
        
        submissionData = {
          brideName: req.body.brideName || '',
          groomName: req.body.groomName || '',
          phone: req.body.phone || '',
          email: req.body.email || '',
          weddingDate: req.body.weddingDate || '',
          location: req.body.location || '',
          services: req.body.services ? JSON.parse(req.body.services) : [],
          additionalInfo: req.body.additionalInfo || '',
          attachments: files ? files.map(file => file.originalname || 'unnamed-file') : []
        };
      } else {
        // Handle regular JSON submission
        submissionData = req.body;
      }
      
      const submission = insertContactSubmissionSchema.parse(submissionData);
      const created = await storage.createContactSubmission(submission);
      
      // Service pricing
      const servicePrices: Record<string, number> = {
        "Повнометражний фільм": 16000,
        "Емоційний кліп": 8000,
        "Ранок нареченої": 4000,
        "Збори нареченого": 4000,
        "Фотопослуги": 6000,
        "Love Story": 5000
      };

      // Format services with pricing
      const formatServicesWithPricing = (services: string[]) => {
        if (!services || services.length === 0) return 'Не вказано';
        
        return services.map(service => {
          const price = servicePrices[service] || 0;
          return `• ${service} - ${price.toLocaleString()} грн`;
        }).join('\n');
      };

      // Format message for Telegram
      const telegramMessage = `
🎬 <b>Нова заявка на весільну зйомку!</b>

👰 <b>Наречена:</b> ${submission.brideName}
🤵 <b>Наречений:</b> ${submission.groomName}
📞 <b>Телефон:</b> ${submission.phone}
📧 <b>Email:</b> ${submission.email}
📅 <b>Дата весілля:</b> ${submission.weddingDate}
📍 <b>Локація:</b> ${submission.location}

🎥 <b>Послуги:</b>
${formatServicesWithPricing(submission.services)}

${totalPrice > 0 ? `💰 <b>Загальна вартість:</b> ${totalPrice.toLocaleString()} грн\n` : ''}

${submission.additionalInfo ? `💬 <b>Додаткова інформація:</b>\n${submission.additionalInfo}\n` : ''}

📝 <b>ID заявки:</b> ${created.id}
⏰ <b>Час подачі:</b> ${new Date().toLocaleString('uk-UA', { timeZone: 'Europe/Kiev' })}
      `.trim();
      
      // Send to Telegram with files attached to the main message
      if (uploadedFiles.length > 0) {
        try {
          // Group files by type
          const mediaFiles = uploadedFiles.filter(file => 
            file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')
          );
          const documentFiles = uploadedFiles.filter(file => 
            !file.mimetype.startsWith('image/') && !file.mimetype.startsWith('video/')
          );

          // If we have media files, send them with the application message as caption
          if (mediaFiles.length > 0) {
            if (mediaFiles.length === 1) {
              // Single media file with full application message as caption
              const file = mediaFiles[0];
              const formData = new FormData();
              const blob = new Blob([file.buffer], { type: file.mimetype });
              formData.append('chat_id', YOUR_CHAT_ID);
              
              if (file.mimetype.startsWith('image/')) {
                formData.append('photo', blob, file.originalname || 'image');
                formData.append('caption', telegramMessage);
                formData.append('parse_mode', 'HTML');
                
                await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`, {
                  method: 'POST',
                  body: formData
                });
              } else {
                formData.append('video', blob, file.originalname || 'video');
                formData.append('caption', telegramMessage);
                formData.append('parse_mode', 'HTML');
                
                await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendVideo`, {
                  method: 'POST',
                  body: formData
                });
              }
            } else {
              // Multiple media files - send as media group with application message as caption on first item
              const media = mediaFiles.slice(0, 10).map((file, index) => ({
                type: file.mimetype.startsWith('image/') ? 'photo' : 'video',
                media: `attach://file${index}`,
                caption: index === 0 ? telegramMessage : undefined,
                parse_mode: index === 0 ? 'HTML' : undefined
              }));

              const formData = new FormData();
              formData.append('chat_id', YOUR_CHAT_ID);
              formData.append('media', JSON.stringify(media));
              
              mediaFiles.slice(0, 10).forEach((file, index) => {
                const blob = new Blob([file.buffer], { type: file.mimetype });
                formData.append(`file${index}`, blob, file.originalname || `file${index}`);
              });

              await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMediaGroup`, {
                method: 'POST',
                body: formData
              });
            }
            
            // Send document files separately since they can't be in media group
            if (documentFiles.length > 0) {
              for (const file of documentFiles) {
                const formData = new FormData();
                const blob = new Blob([file.buffer], { type: file.mimetype });
                formData.append('chat_id', YOUR_CHAT_ID);
                formData.append('document', blob, file.originalname || 'document');
                formData.append('caption', `📎 Додатковий документ до заявки #${created.id}: ${file.originalname}`);
                
                await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendDocument`, {
                  method: 'POST',
                  body: formData
                });
              }
            }
          } else if (documentFiles.length > 0) {
            // Only document files - send first one with full message, others separately
            const firstDoc = documentFiles[0];
            const formData = new FormData();
            const blob = new Blob([firstDoc.buffer], { type: firstDoc.mimetype });
            formData.append('chat_id', YOUR_CHAT_ID);
            formData.append('document', blob, firstDoc.originalname || 'document');
            formData.append('caption', telegramMessage);
            formData.append('parse_mode', 'HTML');
            
            await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendDocument`, {
              method: 'POST',
              body: formData
            });
            
            // Send remaining documents
            for (let i = 1; i < documentFiles.length; i++) {
              const file = documentFiles[i];
              const formData = new FormData();
              const blob = new Blob([file.buffer], { type: file.mimetype });
              formData.append('chat_id', YOUR_CHAT_ID);
              formData.append('document', blob, file.originalname || 'document');
              formData.append('caption', `📎 Додатковий документ: ${file.originalname}`);
              
              await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendDocument`, {
                method: 'POST',
                body: formData
              });
            }
          }

          console.log(`Files sent successfully: ${uploadedFiles.length} files`);
        } catch (error) {
          console.error('Error sending files to Telegram:', error);
          // Fallback: send text message if file sending fails
          await sendTelegramMessage(telegramMessage);
        }
      } else {
        // No files - send just the text message
        await sendTelegramMessage(telegramMessage);
      }
      
      res.json({ success: true, id: created.id });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          success: false, 
          message: "Невірні дані форми",
          errors: error.errors 
        });
      } else {
        console.error("Error creating contact submission:", error);
        res.status(500).json({ 
          success: false, 
          message: "Помилка сервера. Спробуйте пізніше." 
        });
      }
    }
  });

  // Get contact submissions (for admin purposes)
  app.get("/api/contact-submissions", async (req, res) => {
    try {
      const submissions = await storage.getContactSubmissions();
      res.json(submissions);
    } catch (error) {
      console.error("Error fetching contact submissions:", error);
      res.status(500).json({ 
        success: false, 
        message: "Помилка сервера" 
      });
    }
  });

  // Portfolio API routes
  app.get("/api/portfolio", async (req, res) => {
    try {
      const items = await storage.getPublishedPortfolioItems();
      res.json(items);
    } catch (error) {
      console.error("Error fetching portfolio items:", error);
      res.status(500).json({ message: "Помилка сервера" });
    }
  });

  // Admin portfolio routes (requires authentication)
  app.get("/api/admin/portfolio", async (req, res) => {
    try {
      const items = await storage.getPortfolioItems();
      res.json(items);
    } catch (error) {
      console.error("Error fetching admin portfolio items:", error);
      res.status(500).json({ message: "Помилка сервера" });
    }
  });

  app.post("/api/admin/portfolio", async (req, res) => {
    try {
      const portfolioData = insertPortfolioItemSchema.parse(req.body);
      const item = await storage.createPortfolioItem(portfolioData);
      res.json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Невірні дані", errors: error.errors });
      } else {
        console.error("Error creating portfolio item:", error);
        res.status(500).json({ message: "Помилка сервера" });
      }
    }
  });

  app.put("/api/admin/portfolio/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const portfolioData = insertPortfolioItemSchema.partial().parse(req.body);
      const item = await storage.updatePortfolioItem(id, portfolioData);
      res.json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Невірні дані", errors: error.errors });
      } else {
        console.error("Error updating portfolio item:", error);
        res.status(500).json({ message: "Помилка сервера" });
      }
    }
  });

  app.delete("/api/admin/portfolio/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deletePortfolioItem(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting portfolio item:", error);
      res.status(500).json({ message: "Помилка сервера" });
    }
  });

  // Admin authentication routes
  app.post("/api/admin/login", async (req, res) => {
    try {
      const loginData = adminLoginSchema.parse(req.body);
      const admin = await storage.verifyAdminPassword(loginData.username, loginData.password);
      
      if (!admin) {
        return res.status(401).json({ message: "Невірні дані для входу" });
      }

      // Store admin session (simplified - in production use proper session management)
      req.session = req.session || {};
      (req.session as any).adminId = admin.id;
      (req.session as any).adminUsername = admin.username;

      res.json({ 
        success: true, 
        admin: { 
          id: admin.id, 
          username: admin.username, 
          email: admin.email 
        } 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Невірні дані", errors: error.errors });
      } else {
        console.error("Error during admin login:", error);
        res.status(500).json({ message: "Помилка сервера" });
      }
    }
  });

  app.post("/api/admin/logout", async (req, res) => {
    try {
      if (req.session) {
        req.session.destroy((err: any) => {
          if (err) {
            console.error("Error destroying session:", err);
            return res.status(500).json({ message: "Помилка виходу" });
          }
          res.json({ success: true });
        });
      } else {
        res.json({ success: true });
      }
    } catch (error) {
      console.error("Error during admin logout:", error);
      res.status(500).json({ message: "Помилка сервера" });
    }
  });

  app.get("/api/admin/check", async (req, res) => {
    try {
      if (req.session && (req.session as any).adminId) {
        const admin = await storage.getAdminUser((req.session as any).adminUsername);
        if (admin && admin.isActive) {
          return res.json({ 
            authenticated: true, 
            admin: { 
              id: admin.id, 
              username: admin.username, 
              email: admin.email 
            } 
          });
        }
      }
      res.json({ authenticated: false });
    } catch (error) {
      console.error("Error checking admin session:", error);
      res.json({ authenticated: false });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
