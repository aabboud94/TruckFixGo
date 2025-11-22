# Application Workflows

## Authentication and Session Handling
- **Login/Logout**: Users authenticate via `/api/auth/login`, which validates either email or phone plus password, establishes a session with role metadata, and fetches role-specific profiles. Logout destroys the session at `/api/auth/logout` to end access.【F:server/routes.ts†L716-L777】【F:server/routes.ts†L939-L945】
- **Session Introspection**: `/api/auth/me` returns the current user and any driver/contractor profile, gating privileged UI queries on the client.【F:server/routes.ts†L948-L960】

## Booking and Job Creation
- **Emergency Guest Booking**: `/api/jobs/emergency` accepts unauthenticated emergency requests with rate limiting, normalizes customer contact fields, defaults service type, validates coordinates, and seeds job metadata like job number and ETA before persisting.【F:server/routes.ts†L1836-L1903】
- **Authenticated Job Requests**: `/api/jobs` requires a session, applies the authenticated user as the customer when none is provided, creates the job, and attempts round‑robin contractor auto-assignment (generating demo contractors when none exist) before returning the new record.【F:server/routes.ts†L2005-L2046】

## Job Lifecycle Management
- **Status Transitions**: Authenticated users update a job via `/api/jobs/:id/status`, which enforces ownership/role checks, stamps status-specific timestamps, records status history, and emits tailored job-update notifications (e.g., assigned, en_route, on_site).【F:server/routes.ts†L5239-L5270】
- **Invoicing**: `/api/jobs/:id/invoice` generates or retrieves an invoice tied to the job and related parties, computing totals and due dates, then returns invoice, job, and associated user context for billing flows.【F:server/routes.ts†L12884-L12924】

## Role-Specific Dashboards
- **Admin Dashboard**: `client/src/pages/admin/index.tsx` gates queries until an admin session is present, then polls metrics (revenue, job breakdowns, alerts) while showing login or access-denied screens otherwise.【F:client/src/pages/admin/index.tsx†L43-L156】
- **Contractor Dashboard**: `client/src/pages/contractor/dashboard.tsx` drives the contractor experience with authenticated data fetching, messaging, availability controls, and invoicing tools once the session matches a contractor account.【F:client/src/pages/contractor/dashboard.tsx†L213-L246】
- **Fleet Dashboard**: `client/src/pages/fleet/dashboard.tsx` restricts access to fleet managers, loads their fleet account, vehicles, scheduled services, and optional analytics, and redirects to fleet login when unauthenticated or mismatched.【F:client/src/pages/fleet/dashboard.tsx†L40-L140】

