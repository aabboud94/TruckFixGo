# TruckFixGo - Mobile Mechanics Platform

## Overview

TruckFixGo is a comprehensive mobile mechanics platform designed for semi-trucks and trailers, connecting drivers, fleet managers, and certified mechanics for both emergency roadside repairs and scheduled maintenance services. The platform combines real-time GPS tracking, bidding systems, payment processing, and fleet management into a Progressive Web Application (PWA) optimized for mobile use in the field.

The application serves three primary user types:
- **Drivers/Dispatchers**: Book emergency repairs or scheduled services in under 60 seconds
- **Mechanics/Contractors**: Accept jobs, manage availability, track earnings, and bid on opportunities
- **Fleet Managers**: Manage multiple vehicles, schedule preventive maintenance, track costs, and access analytics

Key features include live mechanic tracking with real-time ETA, multi-service support (tire blowouts, fuel delivery, diagnostics, PM services, mobile washing), photo uploads for damage documentation, service history tracking by VIN/unit number, and integrated payment processing with support for fleet accounts, credit cards, EFS/Comdata checks, and split payments.

## Recent Changes (November 2024)

### Contractor Edit Feature Implementation
- **Added full contractor profile editing**: Admin can now edit contractor name, company, email, and phone fields
- **Created updateContractorDetails storage method**: Handles transactional updates to both users and contractor_profiles tables
- **Implemented PUT /api/admin/contractors/:id endpoint**: Validates input and updates contractor details with proper error handling
- **Fixed UI interaction issues**: Added z-index to action buttons to fix click-blocking overlay in table rows
- **Fixed data structure mapping**: Resolved firstName/lastName to name conversion and companyName to company field mapping
- **Fixed apiRequest call signature**: Corrected mutation to use proper (method, url, data) format

### Critical Database Query Fixes  
- **Fixed SQL syntax error in search**: Changed `users.name` to search on `firstName` and `lastName` separately
- **Fixed response parsing in contractors page**: Changed from `contractors?.data` to `contractors` (API returns array directly)
- **Fixed isAvailable filter logic**: Now only applies when explicitly provided in query, not defaulting to false
- **Fixed column name mappings**: Updated all contractor queries to use correct schema column names
- **Fixed contractor status mapping**: Users table has `is_active` boolean, not `status` column - properly map between UI status values and database boolean
- **Fixed updateContractorDetails**: Now uses raw SQL to avoid Drizzle query builder issues, correctly maps status to is_active
- **Fixed findContractors query**: Added CASE statement to map is_active boolean to 'active'/'suspended' status strings

### Database Column Mappings (Critical Reference)
Correct column names to use in queries:
- `contractorProfiles.averageRating` (NOT rating)
- `contractorProfiles.totalJobsCompleted` (NOT totalJobs)  
- `contractorProfiles.averageResponseTime` (NOT avgResponseTime)
- `contractorProfiles.isVerifiedContractor` (NOT documentsVerified)
- `users.firstName/lastName` (NOT users.name - doesn't exist)

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack**:
- React 18 with TypeScript for type safety
- Vite as the build tool and development server
- Wouter for lightweight client-side routing
- TanStack Query (React Query) for server state management
- Tailwind CSS + shadcn/ui component library (New York style variant)
- Leaflet for interactive maps with real-time GPS tracking
- Stripe Elements for payment processing
- WebSocket integration for live updates

**Design System**:
- Follows hybrid reference-based design combining DoorDash urgency, Stripe professionalism, and Linear typography
- Inter font family (400-700 weights) for consistency
- Color system using emergency (orange) vs routine (blue) hierarchy
- Mobile-first responsive layouts with large touch targets for field use
- PWA support with service worker for offline functionality and app installation

**State Management**:
- TanStack Query handles all API calls with caching and background refetching
- WebSocket connections for real-time job tracking, bidding updates, and location sharing
- Local state with React hooks for UI interactions
- Session-based authentication with cookies

### Backend Architecture

**Technology Stack**:
- Node.js with Express.js framework
- TypeScript throughout for type safety
- Drizzle ORM for database operations
- PostgreSQL (via Neon serverless) for data persistence
- WebSocket Server (ws library) for real-time features
- Node-cron for scheduled tasks (billing, reminders, alerts)

**API Design**:
- RESTful API endpoints under `/api/*` namespace
- Session-based authentication using express-session with PostgreSQL store
- Role-based access control (driver, contractor, admin, dispatcher, fleet_manager)
- Request validation using Zod schemas
- Comprehensive error handling with structured responses

**Core Services**:

1. **AI Service** (`ai-service.ts`):
   - OpenAI integration (GPT-5) via Replit AI Integrations
   - Rate limiting (2 concurrent requests) and retry logic with exponential backoff
   - Truck expert assistant for diagnostics, pricing guidance, and service recommendations
   - Memoization for repeated queries to reduce API calls

2. **Pricing Engine** (`pricing-engine.ts`):
   - Dynamic pricing based on time of day, urgency, location, demand, and customer type
   - Fleet pricing tiers (standard, silver, gold, platinum) with volume discounts
   - Surge pricing during high demand periods
   - Configurable pricing rules with conditions and multipliers
   - Distance-based fees and service area surcharges

3. **Billing Scheduler** (`billing-scheduler.ts`):
   - Daily subscription billing processing (runs at 2:00 AM)
   - Failed payment retry logic (every 6 hours with exponential backoff)
   - Usage alert monitoring (daily at 10:00 AM)
   - Monthly invoice generation (1st of each month)
   - Card expiration checks (weekly) and trial expiration reminders

4. **Reminder Service** (`reminder-service.ts`):
   - Multi-channel notifications (SMS via Twilio, Email via Nodemailer)
   - Automated reminders for scheduled services (24hr, 12hr, 1hr before)
   - Invoice delivery and payment reminders
   - Service completion confirmations
   - Blacklist management to prevent spam
   - Delivery tracking and retry logic for failed notifications

5. **Split Payment Service** (`split-payment-service.ts`):
   - Enables payment splitting between drivers, carriers, and fleets
   - Template-based rules (e.g., carrier pays callout fee, driver pays labor/parts)
   - Secure payment link generation for each payer
   - Automated reminder system for unpaid portions
   - Partial payment tracking and reconciliation

6. **EFS/Comdata Service** (`efs-comdata-service.ts`):
   - Fleet check authorization and capture
   - Real-time balance verification
   - Test mode with configurable mock checks
   - Authorization hold with expiration tracking
   - Void and partial capture support

7. **Stripe Service** (`stripe-service.ts`):
   - Payment processing for credit cards
   - Subscription management (basic, standard, enterprise plans)
   - Invoice generation with line items
   - Refund processing
   - Webhook handling for payment events

8. **PDF Service** (`pdf-service.ts`):
   - Invoice generation with QR codes for tracking
   - Professional branding with company logo and details
   - Line item breakdowns (service, parts, labor, fees, taxes)
   - Digital signatures and timestamps
   - Email attachment support

9. **WebSocket Service** (`websocket.ts`):
   - Real-time job tracking with contractor location updates
   - Live bidding system with instant notifications
   - ETA calculations and status updates
   - Room-based architecture (one room per job)
   - Heartbeat monitoring for connection health

### Database Schema

**Core Entities**:

1. **Users & Authentication**:
   - `users`: Base user table with role (driver, contractor, admin, dispatcher, fleet_manager)
   - `sessions`: PostgreSQL-backed session store
   - `driver_profiles`: Driver-specific details (CDL, home base, preferences)
   - `contractor_profiles`: Mechanic details (certifications, service radius, performance tier)
   - `contractor_applications`: Multi-step application process with document verification
   - `background_checks`: Criminal, driving record, business verification

2. **Fleet Management**:
   - `fleet_accounts`: Fleet company profiles with pricing tier
   - `fleet_vehicles`: Individual trucks with VIN, unit number, service history
   - `fleet_contacts`: Authorized personnel for fleet operations
   - `fleet_pricing_overrides`: Custom pricing for specific fleets
   - `fleet_checks`: EFS/Comdata check authorization tracking

3. **Service Catalog**:
   - `service_types`: Emergency repair, PM, tire service, diagnostics, washing, etc.
   - `service_pricing`: Base pricing per service type
   - `service_areas`: Geographic coverage zones with surcharges
   - `contractor_services`: Services each mechanic can perform
   - `contractor_availability`: Schedule and blackout dates

4. **Jobs & Bidding**:
   - `jobs`: Core job entity (emergency or scheduled, status workflow)
   - `job_photos`: Damage documentation and completion photos
   - `job_messages`: Real-time chat thread between customer and contractor
   - `job_status_history`: Audit trail of status changes
   - `job_bids`: Contractor bids on jobs with pricing and ETA
   - `bid_templates`: Saved bid configurations
   - `bidding_config`: Auto-accept rules and bidding strategy

5. **Payments & Billing**:
   - `payment_methods`: Credit cards, EFS/Comdata, fleet accounts
   - `transactions`: Payment records with status tracking
   - `invoices`: Generated invoices with line items
   - `refunds`: Refund requests and processing
   - `split_payments`: Multi-payer payment orchestration
   - `payment_splits`: Individual payer portions
   - `split_payment_templates`: Reusable split rules
   - `billing_subscriptions`: Fleet subscription plans
   - `billing_history`: Subscription charge history
   - `billing_usage_tracking`: Usage-based billing metrics

6. **Reviews & Ratings**:
   - `reviews`: Multi-dimensional ratings (overall, timeliness, professionalism, quality)
   - `review_votes`: Helpful/unhelpful voting
   - `contractor_earnings`: Performance tracking and payout history

7. **Admin & Configuration**:
   - `admin_settings`: Global platform configuration
   - `email_templates`: Transactional email templates
   - `sms_templates`: SMS notification templates
   - `integrations_config`: Third-party API credentials
   - `pricing_rules`: Dynamic pricing rule engine
   - `customer_preferences`: Communication preferences per user
   - `reminders`: Scheduled reminder queue
   - `reminder_log`: Delivery tracking
   - `reminder_blacklist`: Opt-out management

**Enums & Status Workflows**:
- Job status: `new → assigned → en_route → on_site → completed/cancelled`
- Payment status: `pending → processing → completed/failed/refunded`
- Bid status: `pending → accepted/rejected/expired/withdrawn/countered`
- Check status: `pending → authorized → captured/declined/voided`
- Subscription status: `active → paused → cancelled/expired`

### External Dependencies

**Third-Party Services**:

1. **Replit AI Integrations**:
   - OpenAI-compatible API for GPT-5 model access
   - Used for truck diagnostics, pricing suggestions, and customer support chatbot
   - Configuration via `AI_INTEGRATIONS_OPENAI_BASE_URL` and `AI_INTEGRATIONS_OPENAI_API_KEY`

2. **Neon Database** (`@neondatabase/serverless`):
   - Serverless PostgreSQL hosting with connection pooling
   - WebSocket support for long-running connections
   - Configuration via `DATABASE_URL` environment variable

3. **Stripe**:
   - Payment processing for credit/debit cards
   - Subscription billing management
   - Webhook integration for payment events
   - Configuration via `STRIPE_SECRET_KEY` and `STRIPE_PUBLISHABLE_KEY`

4. **Twilio** (planned):
   - SMS notifications for reminders and alerts
   - Configuration via `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`

5. **Nodemailer** (configured):
   - Transactional email delivery
   - Configuration via SMTP settings in `reminder-service.ts`

**Frontend Libraries**:
- **Radix UI**: Headless accessible component primitives (dialogs, dropdowns, tooltips, etc.)
- **Leaflet**: Interactive maps with marker clustering and route visualization
- **html2canvas + jsPDF**: Client-side PDF generation for invoices
- **QRCode**: QR code generation for tracking links
- **date-fns**: Date formatting and manipulation
- **bcrypt**: Password hashing for authentication
- **Zod**: Runtime schema validation and type inference
- **Framer Motion**: Animation library for UI transitions (used in chatbot)

**Development Tools**:
- **Drizzle Kit**: Database migration tool
- **esbuild**: Fast TypeScript bundling for production server
- **tsx**: TypeScript execution for development server
- **p-limit & p-retry**: Rate limiting and retry logic for API calls
- **memoizee**: Function memoization for expensive operations

**Build & Deployment**:
- Development: `npm run dev` (tsx server + Vite HMR)
- Production: `npm run build` (Vite frontend + esbuild backend) → `npm start`
- Database: `npm run db:push` (Drizzle schema sync)