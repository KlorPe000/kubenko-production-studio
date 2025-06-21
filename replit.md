# Kubenko Production Studio - Wedding Videography Website

## Overview

This is a full-stack web application for Kubenko Production Studio, a professional wedding videography business serving the Kyiv region of Ukraine. The application features a modern, elegant website with a contact form for potential clients to submit wedding photography and videography requests.

## System Architecture

The application follows a full-stack architecture with clear separation between client and server:

- **Frontend**: React-based SPA using Vite for build tooling
- **Backend**: Express.js REST API server
- **Database**: PostgreSQL with Drizzle ORM
- **Deployment**: Configured for Replit's autoscale deployment

## Key Components

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with custom configuration for multi-directory structure
- **UI Framework**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom wedding theme color palette
- **State Management**: TanStack Query for server state management
- **Form Handling**: React Hook Form with Zod validation
- **Routing**: Wouter for lightweight client-side routing

### Backend Architecture
- **Runtime**: Node.js with TypeScript (tsx for development)
- **Framework**: Express.js with RESTful API design
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Validation**: Zod schemas shared between client and server
- **Storage**: Dual implementation (memory for development, database for production)

### Database Schema
The application uses two main tables:
- **users**: Basic user authentication (id, username, password)
- **contact_submissions**: Wedding inquiry forms with fields for bride/groom names, contact info, wedding details, services, and file attachments

## Data Flow

1. **Contact Form Submission**: Clients fill out wedding inquiry form on homepage
2. **Client-side Validation**: Zod schema validates form data before submission
3. **API Request**: Form data sent to `/api/contact` endpoint
4. **Server-side Validation**: Same Zod schema validates on backend
5. **Database Storage**: Valid submissions stored in PostgreSQL via Drizzle ORM
6. **Response**: Success/error feedback sent back to client
7. **Admin Access**: GET endpoint at `/api/contact-submissions` for retrieving submissions

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL driver for Neon
- **drizzle-orm**: Type-safe SQL query builder and ORM
- **@tanstack/react-query**: Server state management for React
- **@hookform/resolvers**: Form validation resolvers for React Hook Form
- **zod**: TypeScript-first schema validation

### UI Dependencies
- **@radix-ui/react-***: Comprehensive set of unstyled, accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Utility for creating variant-based component APIs
- **lucide-react**: Icon library
- **embla-carousel-react**: Carousel/slider component

## Deployment Strategy

The application is configured for Replit's deployment platform:

- **Development**: `npm run dev` starts both frontend and backend in parallel
- **Build Process**: Vite builds frontend to `dist/public`, esbuild bundles backend to `dist/index.js`
- **Production**: `npm run start` serves the built application
- **Database**: Uses Neon serverless PostgreSQL with connection string from environment
- **Port Configuration**: Backend serves on port 5000, exposed as port 80 externally

The deployment uses Replit's autoscale target with PostgreSQL 16 module enabled. The application structure separates client and server code while sharing TypeScript schemas for type safety.

## Deployment

The application is now fully prepared for deployment on Railway with the following enhancements:

### Railway Deployment Features
- **Production-ready session management**: Uses PostgreSQL for sessions in production
- **Health check endpoint**: `/health` route for monitoring application status
- **Environment-aware configuration**: Automatically adapts to Railway's environment
- **Optimized database connections**: Connection pooling with proper timeouts
- **Port flexibility**: Uses Railway's PORT environment variable

### Railway Configuration Files
- `railway.json`: Railway-specific deployment configuration
- `Dockerfile`: Alternative containerized deployment option
- `RAILWAY_DEPLOY.md`: Complete deployment instructions

### Environment Variables Required for Railway
- `DATABASE_URL`: Automatically provided by Railway PostgreSQL service
- `SESSION_SECRET`: Required for secure session management
- `NODE_ENV=production`: Enables production optimizations
- `TELEGRAM_BOT_TOKEN` & `TELEGRAM_CHAT_ID`: Optional for Telegram notifications

## Changelog

- June 21, 2025: Prepared project for Railway deployment
  - Added PostgreSQL session storage for production
  - Implemented health check endpoint
  - Configured environment-aware database connections
  - Created Railway deployment documentation
  - Added Docker support as alternative deployment method
- June 14, 2025: Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.