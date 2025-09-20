# CuraCloud - Digital Health Record System

## Overview

CuraCloud is a digital health record management system designed as an MVP that enables secure management of medical records between patients, doctors, and administrators. The system provides role-based access control where patients can upload and manage their medical records, grant access to doctors, and maintain control over their health data. Doctors can view authorized patient records and add treatment notes, while administrators handle user verification and system oversight.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React with TypeScript**: Single-page application using React 18 with TypeScript for type safety
- **Wouter**: Lightweight client-side routing library for navigation between different user dashboards
- **TanStack Query**: Data fetching and state management for server synchronization
- **shadcn/ui Components**: Pre-built UI component library with Radix UI primitives for accessibility
- **TailwindCSS**: Utility-first CSS framework for responsive design and consistent styling
- **React Hook Form**: Form handling with Zod validation for type-safe form submissions

### Backend Architecture
- **Express.js**: Node.js web framework handling API routes and middleware
- **Session-based Authentication**: Express sessions with MongoDB session store for user authentication
- **Multer**: File upload middleware for handling medical record uploads (PDF, JPG, PNG)
- **RESTful API Design**: Clean API endpoints following REST conventions for all operations

### Data Storage
- **MongoDB Atlas**: Cloud-hosted MongoDB database for all application data
- **File System Storage**: Local file storage for uploaded medical records with configurable upload directory
- **Session Storage**: MongoDB-backed session persistence using connect-pg-simple (though configured for MongoDB)

### Database Schema Design
- **Users Collection**: Stores user information with roles (patient, doctor, admin), verification status, and specialties for doctors
- **Records Collection**: Medical record metadata including file paths, descriptions, and patient associations
- **Access Collection**: Junction table managing doctor-patient access permissions with grant/revoke functionality
- **Notes Collection**: Treatment notes created by doctors for patients, including diagnosis and appointment scheduling

### Authentication & Authorization
- **Role-based Access Control**: Three distinct user roles with different permissions and dashboard views
- **Session Management**: Server-side session storage with secure cookie handling
- **Route Protection**: Middleware-based route protection ensuring users can only access authorized resources
- **Admin Verification**: Two-tier verification system where admins must approve new user registrations

### File Management
- **Secure Upload Handling**: File type validation (PDF, JPG, PNG) with size limits (10MB maximum)
- **Organized File Storage**: Systematic file naming and directory structure for uploaded medical records
- **Access-controlled Downloads**: File access restricted based on user permissions and granted access

### UI/UX Design Patterns
- **Dashboard-based Navigation**: Role-specific dashboards optimized for different user workflows
- **Responsive Design**: Mobile-first approach with adaptive layouts for various screen sizes
- **Consistent Component System**: Standardized UI components ensuring design consistency across the application
- **Toast Notifications**: User feedback system for successful operations and error handling

## External Dependencies

### Core Runtime Dependencies
- **@neondatabase/serverless**: PostgreSQL-compatible database driver (configured for future PostgreSQL migration)
- **mongodb**: Official MongoDB driver for database operations
- **express**: Web application framework
- **express-session**: Session middleware for authentication
- **multer**: File upload handling middleware

### Frontend Libraries
- **@tanstack/react-query**: Server state management and data fetching
- **wouter**: Lightweight React router
- **@hookform/resolvers**: Form validation integration
- **react-hook-form**: Form handling and validation
- **zod**: Runtime type validation and schema definition

### UI Component System
- **@radix-ui/react-***: Comprehensive set of accessible UI primitives
- **class-variance-authority**: Type-safe CSS class variant generation
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library for consistent iconography

### Development Tools
- **typescript**: Static type checking
- **vite**: Build tool and development server
- **tsx**: TypeScript execution for development
- **drizzle-orm**: Type-safe ORM (configured for future use)
- **drizzle-kit**: Database migration tools

### Database Integration
- **MongoDB Atlas Connection**: Cloud-hosted MongoDB instance with connection string authentication
- **Drizzle Configuration**: Prepared for PostgreSQL migration with schema definitions in TypeScript
- **Session Store**: MongoDB-backed session persistence for scalable authentication