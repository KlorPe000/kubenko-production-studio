import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertContactSubmissionSchema, 
  insertPortfolioItemSchema,
  adminLoginSchema,
  insertBookedDateSchema,
  type AdminLogin 
} from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import bcrypt from "bcryptjs";
import session from "express-session";



// Telegram Bot Configuration
const TELEGRAM_BOT_TOKEN = "8017632242:AAF4YRf1uMR-XDZiJonUotSdreSvJD2VK5s";
const YOUR_CHAT_ID = "831021355"; // Your specific chat ID

// Using catbox.moe for all image uploads - no additional configuration needed
interface ImageUploadResult {
  url: string;
  service: string;
  success: boolean;
  error?: string;
}

// Upload to Catbox.moe (200MB limit, permanent free hosting)
async function uploadToCatbox(buffer: Buffer, filename: string): Promise<ImageUploadResult> {
  try {
    const formData = new FormData();
    const blob = new Blob([buffer]);
    formData.append('reqtype', 'fileupload');
    formData.append('fileToUpload', blob, filename);

    const response = await fetch('https://catbox.moe/user/api.php', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const url = await response.text();
    if (url.startsWith('https://files.catbox.moe/')) {
      return { url: url.trim(), service: 'Catbox', success: true };
    } else {
      throw new Error('Invalid response from Catbox');
    }
  } catch (error) {
    return {
      url: '',
      service: 'Catbox',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}







// Upload single image to catbox.moe only
async function uploadSingleImage(buffer: Buffer, filename: string): Promise<string> {
  console.log('Uploading image to catbox.moe...');
  const result = await uploadToCatbox(buffer, filename);
  
  if (result.success && result.url) {
    console.log(`Upload successful via ${result.service}:`, result.url);
    return result.url;
  } else {
    console.log(`${result.service} upload failed:`, result.error);
    throw new Error(`Catbox upload failed: ${result.error}`);
  }
}

// Direct upload without optimization
async function uploadImageWithFallback(buffer: Buffer, filename: string, mimetype: string): Promise<{ original: string; thumbnail: string; medium: string; }> {
  const fileSizeMB = buffer.length / (1024 * 1024);
  console.log(`Uploading ${filename} (${fileSizeMB.toFixed(2)}MB, ${mimetype}) directly to catbox.moe`);

  // Upload original file without any optimization
  const imageUrl = await uploadSingleImage(buffer, filename);

  console.log(`Image uploaded successfully: ${imageUrl}`);
  
  // Return the same URL for all sizes for backward compatibility
  return {
    original: imageUrl,
    thumbnail: imageUrl,
    medium: imageUrl
  };
}

// Configure multer for memory storage (uploading to catbox.moe)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 200 * 1024 * 1024, // 200MB limit (Catbox's limit)
  },
  fileFilter: (req, file, cb) => {
    // Accept only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
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
      // Check for available chats when there's an error
      try {
        const updatesResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates`);
        const updates = await updatesResponse.json();
        if (updates.ok && updates.result.length > 0) {
          console.log('Available chat IDs from recent messages:');
          updates.result.forEach((update: any) => {
            if (update.message && update.message.chat) {
              console.log(`Chat ID: ${update.message.chat.id}, Name: ${update.message.chat.first_name || update.message.chat.username || 'Unknown'}`);
            }
          });
        } else {
          console.log('No recent messages found. Please send a message to the bot first.');
        }
      } catch (updateError) {
        console.log('Error checking for chat updates:', updateError);
      }
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
  
  // Note: No longer serving local uploads since we're using ImageKit

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
      
      // Format detailed services breakdown
      const formatDetailedServices = (services: string[]) => {
        if (!services || services.length === 0) return 'Не вказано';
        
        // Group services by category
        const packageServices = [];
        const addOnServices = [];
        const includedServices = [];
        
        let selectedPackage = '';
        
        services.forEach(service => {
          if (service.includes('Комплексний пакет') || service.includes('Пакет: Двокамерна')) {
            selectedPackage = service;
            packageServices.push(service);
          } else if (service.includes('Love Story')) {
            addOnServices.push(service);
          } else if (service.includes('Ранок') || service.includes('Прогулянка') || service.includes('Церемонія') || service.includes('Ресторан')) {
            includedServices.push(service);
          } else {
            addOnServices.push(service);
          }
        });

        let result = '';

        // Main package
        if (selectedPackage) {
          result += `📦 <b>ОБРАНИЙ ПАКЕТ:</b>\n`;
          if (selectedPackage.includes('Комплексний')) {
            result += `• Комплексний пакет: Фото + Відео - $700\n`;
            result += `  (Включає: Повнометражний фільм + Весільний кліп + Обробка фотографій)\n\n`;
          } else {
            result += `• Пакет: Двокамерна відеозйомка - $500\n`;
            result += `  (Включає: Повнометражний фільм + Весільний кліп)\n\n`;
          }
        }

        // Included services details
        if (includedServices.length > 0) {
          result += `✅ <b>ДЕТАЛІ БАЗОВИХ ПОСЛУГ (включені в пакет):</b>\n`;
          
          const ranokServices = includedServices.filter(s => s.includes('Ранок'));
          if (ranokServices.length > 0) {
            result += `🌅 Ранок:\n`;
            ranokServices.forEach(service => {
              const detail = service.replace('Ранок - ', '');
              result += `  • ${detail}\n`;
            });
          }

          const walkServices = includedServices.filter(s => s.includes('Прогулянка'));
          if (walkServices.length > 0) {
            result += `🚶 Прогулянка:\n`;
            walkServices.forEach(service => {
              const detail = service.replace('Прогулянка - ', '');
              result += `  • ${detail}\n`;
            });
          }

          const ceremonyServices = includedServices.filter(s => s.includes('Церемонія'));
          if (ceremonyServices.length > 0) {
            result += `💍 Церемонія:\n`;
            ceremonyServices.forEach(service => {
              const detail = service.replace('Церемонія - ', '');
              result += `  • ${detail}\n`;
            });
          }

          const restaurantServices = includedServices.filter(s => s.includes('Ресторан'));
          if (restaurantServices.length > 0) {
            result += `🍽️ Ресторан:\n`;
            restaurantServices.forEach(service => {
              const detail = service.replace('Ресторан - ', '');
              result += `  • ${detail}\n`;
            });
          }
          result += '\n';
        }

        // Add-on services
        if (addOnServices.length > 0) {
          result += `➕ <b>ДОДАТКОВІ ПОСЛУГИ:</b>\n`;
          addOnServices.forEach(service => {
            if (service.includes('Love Story')) {
              const type = service.replace('Love Story - ', '');
              result += `💕 Love Story (${type}) - $150\n`;
            } else {
              result += `• ${service}\n`;
            }
          });
        }

        return result;
      };

      // Format message for Telegram with improved structure
      const formatCleanServices = (services: string[]) => {
        if (!services || services.length === 0) return '';
        
        let selectedPackage = '';
        const includedServices = [];
        const addOnServices = [];
        
        services.forEach(service => {
          if (service.includes('Комплексний пакет') || service.includes('Пакет: Двокамерна')) {
            selectedPackage = service;
          } else if (service.includes('Love Story')) {
            addOnServices.push(service);
          } else if (service.includes('Ранок') || service.includes('Прогулянка') || service.includes('Церемонія') || service.includes('Ресторан')) {
            includedServices.push(service);
          }
        });

        let packageSection = '';
        let detailsSection = '';
        let addOnsSection = '';

        // Package section
        if (selectedPackage) {
          packageSection = `📦 <b>ОБРАНИЙ ПАКЕТ:</b>\n`;
          if (selectedPackage.includes('Комплексний')) {
            packageSection += `• Комплексний пакет: Фото + Відео - $700\n`;
            packageSection += `(Включає: Повнометражний фільм + Весільний кліп + Обробка фотографій)\n`;
          } else {
            packageSection += `• Пакет: Двокамерна відеозйомка - $500\n`;
            packageSection += `(Включає: Повнометражний фільм + Весільний кліп)\n`;
          }
        }

        // Service details
        if (includedServices.length > 0) {
          detailsSection = `<b>Деталі послуг:</b>\n\n`;
          let counter = 1;
          
          const ranokServices = includedServices.filter(s => s.includes('Ранок'));
          if (ranokServices.length > 0) {
            const details = ranokServices.map(s => s.replace('Ранок - ', '')).join(', ');
            detailsSection += `${counter}. Ранок: ${details}\n\n`;
            counter++;
          }

          const walkServices = includedServices.filter(s => s.includes('Прогулянка'));
          if (walkServices.length > 0) {
            const details = walkServices.map(s => s.replace('Прогулянка - ', '')).join(', ');
            detailsSection += `${counter}. Прогулянка: ${details}\n\n`;
            counter++;
          }

          const ceremonyServices = includedServices.filter(s => s.includes('Церемонія'));
          if (ceremonyServices.length > 0) {
            const details = ceremonyServices.map(s => s.replace('Церемонія - ', '')).join(', ');
            detailsSection += `${counter}. Церемонія: ${details}\n\n`;
            counter++;
          }

          const restaurantServices = includedServices.filter(s => s.includes('Ресторан'));
          if (restaurantServices.length > 0) {
            const details = restaurantServices.map(s => s.replace('Ресторан - ', '')).join(', ');
            detailsSection += `${counter}. Ресторан: ${details}\n\n`;
            counter++;
          }
        }

        // Add-on services
        if (addOnServices.length > 0) {
          addOnsSection = `<b>Додаткові послуги:</b>\n\n`;
          addOnServices.forEach(service => {
            if (service.includes('Love Story')) {
              const type = service.replace('Love Story - ', '');
              addOnsSection += `Love Story (${type.toLowerCase()}) — $150\n\n`;
            }
          });
        }

        return { packageSection, detailsSection, addOnsSection };
      };

      const { packageSection, detailsSection, addOnsSection } = formatCleanServices(submission.services);

      const telegramMessage = `
🎬 <b>Нова заявка на весільну зйомку!</b>

<b>Контактна інформація:</b>
• Наречена: ${submission.brideName}
• Наречений: ${submission.groomName}
• Телефон: ${submission.phone}
• Email: ${submission.email}
• Дата весілля: ${submission.weddingDate}
• Локація: ${submission.location}

---

${packageSection}
${packageSection ? '---\n\n' : ''}${detailsSection}${detailsSection ? '---\n\n' : ''}${addOnsSection}${addOnsSection ? '---\n\n' : ''}${totalPrice > 0 ? `<b>Загальна вартість замовлення: $${totalPrice}</b>\n\n` : ''}${submission.additionalInfo ? `<b>Додаткова інформація:</b> ${submission.additionalInfo}\n\n` : ''}<b>Час подачі:</b> ${new Date().toLocaleString('uk-UA', { timeZone: 'Europe/Kiev' })}
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

  // Upload endpoint for admin - using multiple providers with fallback
  app.post('/api/admin/upload', upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const fileSizeMB = req.file.size / (1024 * 1024);
      console.log(`Received upload: ${req.file.originalname} (${fileSizeMB.toFixed(2)}MB)`);

      // Generate unique filename
      const timestamp = Date.now();
      const filename = `${timestamp}_${req.file.originalname}`;

      try {
        // Use the optimized upload system with multiple sizes
        const uploadResult = await uploadImageWithFallback(
          req.file.buffer, 
          filename, 
          req.file.mimetype
        );

        res.json({ 
          success: true, 
          url: uploadResult.original, // Keep original URL for backward compatibility
          urls: uploadResult, // New field with all sizes
          originalName: req.file.originalname,
          size: req.file.size,
          fileSizeMB: fileSizeMB.toFixed(2)
        });

      } catch (uploadError) {
        console.error('Catbox upload service failed:', uploadError);
        res.status(500).json({ 
          error: 'Image upload to catbox.moe failed',
          details: uploadError instanceof Error ? uploadError.message : 'Unknown error'
        });
      }

    } catch (error: any) {
      console.error('Upload endpoint error:', error);
      res.status(500).json({ 
        error: 'Upload processing failed',
        details: error.message 
      });
    }
  });

  // Sequential multiple upload endpoint for admin - memory efficient for Render free tier
  app.post('/api/admin/upload-multiple', upload.array('images', 5), async (req, res) => { // Reduced from 10 to 5 files max
    try {
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
      }

      const files = req.files as Express.Multer.File[];
      const results: any[] = [];
      const errors: any[] = [];

      console.log(`Starting sequential upload of ${files.length} files`);

      // Process files one by one to save memory - optimized for Render free tier
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileSizeMB = file.size / (1024 * 1024);
        
        console.log(`Processing file ${i + 1}/${files.length}: ${file.originalname} (${fileSizeMB.toFixed(2)}MB)`);

        try {
          // Check if file is too large for free tier
          if (fileSizeMB > 20) {
            console.log(`⚠️ File ${i + 1} is very large (${fileSizeMB.toFixed(1)}MB) - applying extra compression`);
          }

          // Generate unique filename
          const timestamp = Date.now() + i; // Add index to avoid conflicts
          const filename = `${timestamp}_${file.originalname}`;

          // Upload this file with aggressive optimization
          const uploadResult = await uploadImageWithFallback(
            file.buffer, 
            filename, 
            file.mimetype
          );

          results.push({
            success: true,
            originalName: file.originalname,
            url: uploadResult.original,
            urls: uploadResult,
            size: file.size,
            fileSizeMB: fileSizeMB.toFixed(2),
            index: i
          });

          console.log(`✓ File ${i + 1}/${files.length} uploaded successfully`);

          // Aggressive memory cleanup for free tier
          if (global.gc) {
            global.gc();
          }

        } catch (uploadError) {
          console.error(`✗ File ${i + 1}/${files.length} failed:`, uploadError);
          errors.push({
            originalName: file.originalname,
            error: uploadError instanceof Error ? uploadError.message : 'Upload failed',
            index: i
          });
        }

        // Clear file buffer from memory immediately after processing
        (file as any).buffer = null;
        
        // Longer delay for free tier to allow full memory cleanup
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Force another garbage collection
        if (global.gc) {
          global.gc();
        }
      }

      console.log(`Sequential upload completed. Success: ${results.length}, Errors: ${errors.length}`);

      res.json({
        success: results.length > 0,
        results,
        errors,
        summary: {
          total: files.length,
          successful: results.length,
          failed: errors.length
        }
      });

    } catch (error: any) {
      console.error('Multiple upload endpoint error:', error);
      res.status(500).json({ 
        error: 'Multiple upload processing failed',
        details: error.message 
      });
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

  // Booked dates API routes
  app.get("/api/booked-dates", async (req, res) => {
    try {
      const bookedDates = await storage.getBookedDates();
      res.json(bookedDates);
    } catch (error) {
      console.error("Error fetching booked dates:", error);
      res.status(500).json({ message: "Помилка сервера" });
    }
  });

  app.post("/api/admin/booked-dates", async (req, res) => {
    try {
      const bookedDateData = insertBookedDateSchema.parse(req.body);
      const bookedDate = await storage.createBookedDate(bookedDateData);
      res.json(bookedDate);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Невірні дані", errors: error.errors });
      } else {
        console.error("Error creating booked date:", error);
        res.status(500).json({ message: "Помилка сервера" });
      }
    }
  });

  app.delete("/api/admin/booked-dates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteBookedDate(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting booked date:", error);
      res.status(500).json({ message: "Помилка сервера" });
    }
  });

  const server = createServer(app);

  return server;
}
