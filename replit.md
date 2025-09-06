# Employee Management System

## Overview

This is a full-stack Employee Management System built with React, TypeScript, Express.js, and PostgreSQL. The application provides comprehensive functionality for managing employees, tracking attendance, and handling leave requests with role-based access control. It features separate dashboards for employees and administrators, real-time attendance tracking, and a modern UI built with shadcn/ui components.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **State Management**: TanStack React Query for server state and custom hooks for local state
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation schemas

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: JWT-based authentication with bcrypt for password hashing
- **API Design**: RESTful API with role-based access control middleware
- **File Structure**: Monorepo structure with shared schema definitions

### Data Storage Solutions
- **Database**: PostgreSQL with Neon serverless connection
- **Schema Management**: Drizzle migrations with declarative schema definitions
- **Connection Pooling**: Neon serverless pool for efficient database connections
- **Data Models**: 
  - Employees with role-based permissions (employee/admin)
  - Attendance tracking with check-in/check-out functionality
  - Leave requests with approval workflow

### Authentication and Authorization
- **Strategy**: JWT tokens with 24-hour expiration
- **Password Security**: bcrypt hashing with salt rounds
- **Role-based Access**: Middleware functions for protecting admin-only routes
- **Session Management**: Token-based authentication stored in localStorage
- **Route Protection**: HOCs for protecting authenticated and role-specific routes

### External Dependencies
- **Database**: Neon PostgreSQL serverless database
- **UI Components**: Radix UI primitives for accessible components
- **Validation**: Zod for runtime type checking and form validation
- **Date Handling**: date-fns for date manipulation and formatting
- **Development**: Replit-specific plugins for development environment integration

The architecture follows a clean separation of concerns with shared TypeScript schemas between client and server, ensuring type safety across the full stack. The modular component structure and custom hooks promote code reusability and maintainability.