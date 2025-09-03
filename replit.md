# Area - Community Safety Reporting Platform

## Overview

Area is a modern web application that enables residents to report and share suspicious, dangerous, disruptive, or criminal activities to warn others in their community. Built with a Waze-inspired interface, the platform features an interactive map showing real-time incident reports alongside a filterable list view. Users can submit reports with location data, images, and categorized information to create a vigilant and connected community safety network.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state management and caching
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **Styling**: Tailwind CSS with CSS variables for theming
- **Form Handling**: React Hook Form with Zod validation
- **Map Integration**: React Leaflet for interactive mapping functionality

### Backend Architecture
- **Runtime**: Node.js with Express.js REST API
- **Language**: TypeScript with ES modules
- **Data Storage**: In-memory storage with interface for future database integration
- **File Uploads**: Multer middleware for image handling
- **API Design**: RESTful endpoints for CRUD operations on reports

### Data Architecture
- **Schema**: Shared TypeScript types using Drizzle ORM schema definitions
- **Database**: PostgreSQL configured via Drizzle (currently using in-memory storage)
- **Validation**: Zod schemas for runtime type checking and form validation
- **Storage Interface**: Abstract storage layer allowing easy migration from memory to database

### Component Architecture
- **Layout**: Mobile-first responsive design with map-over-list layout
- **Map**: Interactive Leaflet map with custom markers and clustering
- **Reports**: Modal-based report creation and detail viewing
- **Filtering**: Category-based filtering system with visual indicators
- **Forms**: Multi-step form with image upload and geolocation integration

### External Dependencies
- **Database**: Neon PostgreSQL (configured but not yet implemented)
- **Maps**: Leaflet with OpenStreetMap tiles
- **Fonts**: Google Fonts (Inter, DM Sans, Geist Mono)
- **Icons**: Lucide React icon library
- **Development**: Replit integration with runtime error overlay