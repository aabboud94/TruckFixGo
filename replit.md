# TruckFixGo - Mobile Mechanics Platform

## Overview

TruckFixGo is a comprehensive mobile mechanics platform for semi-trucks and trailers, connecting drivers, fleet managers, and certified mechanics for emergency roadside repairs and scheduled maintenance. The platform is a Progressive Web Application (PWA) optimized for mobile use, integrating real-time GPS tracking, bidding systems, payment processing, and fleet management.

It supports three main user types: Drivers/Dispatchers for booking services, Mechanics/Contractors for job management and bidding, and Fleet Managers for vehicle tracking, maintenance scheduling, and cost analysis. Key capabilities include live mechanic tracking, multi-service support (e.g., tire repair, fuel delivery, diagnostics), photo uploads for documentation, service history tracking, and integrated payment processing for various methods including fleet accounts. The business vision is to streamline repair and maintenance services for the trucking industry, offering a robust, efficient, and user-friendly solution.

## Recent Updates (November 20, 2025)

### Critical Fixes Implemented:
1. **Fixed Job Disappearing Issue**: Jobs no longer disappear from contractor dashboard after acceptance. Added queue synchronization to set contractor queue entry to 'current' status when jobs are accepted.
2. **Dashboard Fallback Logic**: Added robust fallback mechanism in contractor dashboard to fetch active jobs directly when queue state is missing, ensuring jobs always display correctly.
3. **DoorDash-Style Auto-Assignment**: Implemented automatic contractor assignment for emergency jobs with 3-minute acceptance timer. System automatically finds best available contractor and reassigns on timeout or decline.

## November 2025 Enhancement - 17 New API Features Implemented

### Completed Features:
1. **Enhanced Live GPS Tracking** - Multi-stop route tracking with TSP optimization, real-time contractor location updates
2. **Real-time Chat/Messaging** - WebSocket-based chat with reactions, typing indicators, read receipts, message history
3. **Push Notifications** - Browser/mobile push with VAPID keys, service workers, multi-device support, analytics
4. **Contractor Availability** - Vacation management, time-off requests, coverage assignments, availability calendar
5. **AI-powered Dispatch** - OpenAI GPT-5 integration for intelligent job assignment, scoring algorithms, auto-dispatch
6. **Parts Inventory** - Complete inventory management with stock tracking, purchase orders, FIFO/LIFO valuation
7. **Fleet Maintenance Prediction** - AI-powered predictions using telemetry data, automated alerts, risk assessment
8. **Performance Metrics** - Comprehensive KPIs, trends analysis, scorecards, customizable dashboards
9. **Emergency SOS** - Panic button system with GPS location tracking, priority dispatch, response coordination
10. **Weather Integration** (API Stub) - Ready for OpenWeatherMap/WeatherAPI integration (requires API keys)
11. **Fuel Price Tracking** (API Stub) - Ready for GasBuddy integration (requires API keys)
12. **Payment Reconciliation** - Commission calculations, batch processing, multi-tier commission rules, reporting
13. **Service History** - Complete service tracking, timeline visualization, upcoming services, recommendations
14. **Booking Preferences** - User preferences, favorite contractors, blacklist management, booking templates
15. **Route Optimization** - TSP algorithm for multi-stop routes (integrated with GPS tracking)
16. **Document Management** - Enhanced contractor document storage and verification
17. **Feedback/Rating** - Enhanced review system with voting and moderation

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The frontend is built with React 18 and TypeScript, using Vite for development and bundling. It employs Wouter for routing and TanStack Query for server state management. Styling is handled with Tailwind CSS and shadcn/ui (New York style variant). Interactive maps for real-time GPS tracking are powered by Leaflet, and Stripe Elements is integrated for payment processing. WebSocket integration provides live updates. The design system follows a hybrid reference with Inter font, a hierarchical color system, and mobile-first responsive layouts, supporting PWA features for offline functionality. Session-based authentication uses cookies.

### Backend Architecture

The backend is developed with Node.js and Express.js, using TypeScript. Drizzle ORM manages database operations with PostgreSQL (Neon serverless). A WebSocket Server handles real-time features, and Node-cron is used for scheduled tasks. The API is RESTful with endpoints under `/api/*`, utilizing session-based authentication with PostgreSQL store, role-based access control, and Zod for request validation and error handling.

**Core Services**:

1.  **AI Service**: Integrates OpenAI (GPT-5) via Replit AI for truck diagnostics, pricing guidance, and service recommendations, including rate limiting and memoization.
2.  **Pricing Engine**: Dynamically calculates pricing based on various factors like time, urgency, location, demand, and fleet tiers, supporting surge pricing and configurable rules.
3.  **Billing Scheduler**: Manages daily subscription billing, payment retry logic, usage alerts, monthly invoice generation, and card expiration checks.
4.  **Reminder Service**: Sends automated multi-channel notifications (SMS via Twilio, Email via Nodemailer) for service reminders, invoices, and confirmations, with blacklist management.
5.  **Split Payment Service**: Facilitates payment splitting among drivers, carriers, and fleets using template-based rules and secure payment links.
6.  **EFS/Comdata Service**: Handles fleet check authorization, balance verification, authorization holds, void, and partial capture support.
7.  **Stripe Service**: Manages credit card processing, subscription management, invoice generation, refunds, and webhook handling.
8.  **PDF Service**: Generates branded invoices with QR codes, line item breakdowns, and digital signatures for email attachment.
9.  **WebSocket Service**: Provides real-time job tracking, live bidding, ETA calculations, and status updates using a room-based architecture.

### Database Schema

The database schema includes core entities for Users & Authentication (e.g., `users`, `driver_profiles`, `contractor_profiles`), Fleet Management (`fleet_accounts`, `fleet_vehicles`, `fleet_contracts` with 43 columns including SLA and contract terms), Service Catalog (`service_types`, `service_pricing`), Jobs & Bidding (`jobs`, `job_bids`, `bid_templates`, `bidding_config`), Payments & Billing (`payment_methods`, `transactions`, `invoices`, `split_payments`, `billing_subscriptions`, `billing_history` with comprehensive tracking columns), Reviews & Ratings (`reviews`), Location Tracking (`location_tracking`, `tracking_sessions`, `geofence_events`), Analytics (`vehicle_analytics`, `breakdown_patterns`, `fleet_analytics_alerts`), and Admin & Configuration (`admin_settings`, `email_templates`, `pricing_rules`, `booking_settings`). 

**Database Synchronization (November 2025)**: Performed comprehensive schema synchronization adding 24 missing tables and fixing column mismatches in critical tables (fleet_contracts, billing_subscriptions, billing_history). Database now has 78 tables total, fully synchronized with Drizzle ORM schema definitions. All billing statistics and fleet management APIs now function correctly without database errors.

## External Dependencies

**Third-Party Services**:

1.  **Replit AI Integrations**: Used for OpenAI-compatible API access for GPT-5 model.
2.  **Neon Database**: Serverless PostgreSQL hosting.
3.  **Stripe**: Payment processing and subscription management.
4.  **Twilio** (planned): SMS notifications.
5.  **Nodemailer**: Transactional email delivery.

**Frontend Libraries**:
-   **Radix UI**: Headless accessible component primitives.
-   **Leaflet**: Interactive maps.
-   **date-fns**: Date formatting and manipulation.
-   **Zod**: Runtime schema validation.
-   **Framer Motion**: Animation library.