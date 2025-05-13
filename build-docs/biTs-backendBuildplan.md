# Backend Build Plan (@bItS-backend)

This document outlines the steps to build the backend for the Bowen Island Tattoo Shop project based on the specifications in `build-docs/biTs-Backend.md`.

## Build Stages

1.  **Project Initialization & Setup:**
    *   Set up the basic Node.js project with TypeScript (`npm init`, install Fastify, Prisma, TypeScript, `ts-node-dev`, etc.).
    *   Configure `tsconfig.json`.
    *   Establish directory structure (`src/routes`, `src/controllers`, `src/services`, `prisma/`).
    *   Create initial Fastify server instance (`src/app.ts` or `src/server.ts`) with basic configuration and Pino logging.
    *   Set up environment variable handling (`dotenv`).

2.  **Database & Prisma Setup:**
    *   Define schema in `prisma/schema.prisma`.
    *   Connect Prisma to the PostgreSQL database (Supabase).
    *   Run `prisma migrate dev` for initial table creation.
    *   Generate Prisma Client (`prisma generate`).
    *   (Optional) Create `prisma/seed.ts` for initial data.

3.  **Authentication & Authorization:**
    *   Integrate Supabase Authentication.
    *   Implement Fastify pre-handler (hook) for JWT verification.
    *   Secure necessary API routes with the auth hook.
    *   Implement basic Role-Based Access Control (RBAC) checks.

4.  **Core Resource API Endpoints (CRUD):**
    *   Start with `Customers`:
        *   Define Fastify JSON schemas for validation/serialization.
        *   Create route definitions (`src/routes/customerRoutes.ts`).
        *   Implement controller functions (`src/controllers/customerController.ts`) using Prisma Client.
        *   Build standard CRUD endpoints.
    *   Repeat for `TattooRequests`, `Appointments`, and `Users`.

5.  **Image Metadata Handling:**
    *   Refine `TattooRequests` model/endpoints to accept image metadata (Cloudinary URLs/IDs).
    *   Store metadata correctly (likely in `reference_images` JSONB field).
    *   Evaluate the necessity of the separate `Images` table vs. the JSONB field.

6.  **Implement Business Logic:**
    *   **Tattoo Request Workflow:** Implement logic to update `TattooRequests` status.
    *   **Appointment Creation:** Implement logic to create `Appointment` records, potentially linking to approved `TattooRequests`.
    *   **Audit Logging:** Implement `AuditLogs` table and a service to record significant actions.

7.  **Payment & Invoicing (Square Integration - Deferred):**
    *   Define `Payments` and `Invoices` tables in `prisma/schema.prisma` and migrate.
    *   Implement basic internal CRUD operations for these if needed initially.
    *   *Defer full Square API integration.*

8.  **API Enhancements & Security:**
    *   Configure CORS (`@fastify/cors`).
    *   Implement rate limiting (`@fastify/rate-limit`).
    *   Ensure secure handling of secrets via environment variables.

9.  **Testing:**
    *   Configure Jest (`jest.config.js`).
    *   Write unit tests for services and utilities.
    *   Write integration tests for API endpoints (using a test database).

10. **Deployment Strategy:**
    *   Plan deployment process (Docker, hosting platform).
    *   Set up CI/CD pipelines (e.g., GitHub Actions).
