# ETT - Digital Health Record System

## Overview

ETT is a comprehensive digital health record management system that facilitates secure medical record management between patients, doctors, and administrators. The system provides role-based access control with three distinct user types, each having their own specialized dashboard and functionalities. Patients can upload and manage their medical records while controlling doctor access, doctors can view authorized patient records and add treatment notes, and administrators can manage user verification and system oversight.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React with TypeScript**: Modern single-page application built with React 19 and TypeScript for type safety and better development experience
- **Wouter Router**: Lightweight client-side routing library for navigation between different dashboards and sections
- **TanStack Query**: Powerful data fetching and synchronization library for managing server state and API interactions
- **shadcn/ui Component System**: Comprehensive UI component library built on Radix UI primitives, providing accessible and customizable components
- **TailwindCSS**: Utility-first CSS framework for responsive design with custom design tokens and theming
- **React Hook Form with Zod**: Form management solution with schema validation for type-safe form handling

### Backend Architecture
- **Express.js Server**: Node.js web application framework handling RESTful API endpoints and middleware
- **Session-based Authentication**: Express sessions with secure cookie handling for user authentication and authorization
- **Multer File Upload**: Middleware for handling multipart/form-data file uploads with validation and storage
- **RESTful API Design**: Clean, consistent API endpoints following REST conventions for all CRUD operations
- **Middleware Pipeline**: Comprehensive request logging, error handling, and authentication middleware

### Data Storage Solutions
- **MongoDB Atlas**: Cloud-hosted NoSQL database for storing all application data with connection pooling
- **File System Storage**: Local file storage system for uploaded medical records with organized directory structure
- **Session Persistence**: Server-side session storage using MongoDB for maintaining user authentication state

### Database Schema Design
- **Users Collection**: User profiles with role-based fields (patient/doctor/admin), verification status, and doctor specialties
- **Records Collection**: Medical record metadata including file paths, descriptions, patient associations, and upload timestamps
- **Access Collection**: Permission management system controlling doctor-patient access relationships with grant/revoke functionality
- **Notes Collection**: Treatment notes and consultation records created by doctors for patients, including diagnosis and appointment scheduling

### Authentication & Authorization
- **Role-based Access Control**: Three-tier user system with distinct permissions and dashboard experiences
- **Session Management**: Secure server-side sessions with configurable timeouts and automatic cleanup
- **Route Protection**: Middleware-based route guards ensuring users can only access authorized resources
- **Admin Verification System**: Two-step verification process where administrators must approve new user registrations before account activation

### File Management System
- **Secure Upload Handling**: File type validation (PDF, JPG, PNG) with configurable size limits (10MB maximum)
- **Organized Storage**: Systematic file naming convention and directory structure for uploaded medical records
- **Access-controlled Downloads**: File access restricted based on user permissions and granted doctor-patient relationships
- **File Metadata Tracking**: Comprehensive tracking of file information including size, type, and upload timestamps

### UI/UX Architecture
- **Role-specific Dashboards**: Tailored user interfaces optimized for different user workflows and responsibilities
- **Responsive Design**: Mobile-first approach with adaptive layouts for various screen sizes
- **Component-based Architecture**: Reusable UI components with consistent styling and behavior patterns
- **Toast Notification System**: Real-time user feedback for actions and system events
- **Loading States**: Comprehensive loading and error states for better user experience

## External Dependencies

### Database Services
- **MongoDB Atlas**: Primary database service for application data storage with built-in security and scaling
- **@neondatabase/serverless**: PostgreSQL adapter (configured via Drizzle but may be extended for additional database needs)

### Authentication & Session Management
- **express-session**: Session middleware for Express applications
- **connect-pg-simple**: Session store adapter for PostgreSQL (configured for potential database migration)

### File Upload & Processing
- **multer**: Node.js middleware for handling multipart/form-data file uploads
- **File system storage**: Local file storage with configurable upload directories

### UI Component Libraries
- **@radix-ui/***: Collection of low-level UI primitives for building accessible design systems
- **shadcn/ui**: Pre-built component library providing consistent design patterns
- **lucide-react**: Icon library for consistent iconography across the application

### Development & Build Tools
- **Vite**: Fast build tool and development server with hot module replacement
- **TypeScript**: Static type checking for better code quality and developer experience
- **ESBuild**: Fast JavaScript bundler for production builds
- **TailwindCSS**: Utility-first CSS framework with PostCSS integration

### Validation & Schema Management
- **Zod**: TypeScript-first schema validation library for API and form validation
- **@hookform/resolvers**: Integration layer between React Hook Form and validation libraries
- **drizzle-orm**: SQL ORM with TypeScript support for database operations
- **drizzle-zod**: Integration between Drizzle ORM and Zod for schema validation

### State Management & API
- **@tanstack/react-query**: Data fetching and synchronization library for server state management
- **axios**: HTTP client for API requests (available in package dependencies)
- **date-fns**: Date utility library for timestamp formatting and manipulation