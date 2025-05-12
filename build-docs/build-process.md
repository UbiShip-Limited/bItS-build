# Bowen Island Tattoo Shop - Project Build Process

This document outlines the phased build process for the Bowen Island Tattoo Shop website and business management portal, drawing from the established brand guidelines, frontend, backend, and build outline documentation.

## Guiding Principles
*   **Simplicity:** Prefer straightforward solutions.
*   **DRY (Don't Repeat Yourself):** Leverage existing code and patterns where possible.
*   **Environment-Aware:** Code with dev, test, and prod environments in mind.
*   **Clean & Organized:** Maintain a high standard of codebase organization.
*   **Iterative Development:** Build, test, and refine in cycles.

---

## Phase 1: Foundation & Setup

1.  **Project Initialization:**
    *   Set up Git repository with a clear branching strategy (e.g., main, develop, feature/\*).
    *   Create monorepo or separate frontend/backend project structures as decided.
    *   Establish initial frontend directory structure (Next.js) as per `bits-build-otline.md`.
    *   Establish initial backend directory structure (Fastify).
2.  **Environment Configuration:**
    *   Create `.env` template files (`.env.example`) for frontend and backend.
    *   Set up local development environments (`.env.local` or `.env.development`).
    *   Define configurations for `test` and `production` environments.
    *   Set up Docker Compose for local PostgreSQL development (e.g., `docker-compose.yml`).
3.  **Core Technology Setup:**
    *   **Backend:** Install Node.js, Fastify, Prisma. Configure Docker for PostgreSQL.
    *   **Frontend:** Install Next.js, React, TypeScript, Tailwind CSS, DaisyUI.
4.  **External Services Setup:**
    *   Create Supabase project:
        *   Set up Auth (configure roles: artist, assistant, admin).
        *   Initialize PostgreSQL database.
    *   Create Cloudinary account:
        *   Note API keys and cloud name.
    *   Create Square Developer account:
        *   Note API keys and sandbox credentials.
5.  **Branding & Style Foundation (Frontend):**
    *   Configure Tailwind CSS `tailwind.config.js` with the primary, accent, and neutral colors from `bowenIslandTattooStyleGuide.md`.
    *   Set up global typography (Gotham Black, Playfair Display, Montserrat/Open Sans).
    *   Integrate DaisyUI and customize its theme to align with brand aesthetics.

---

## Phase 2: Backend Development (API & Business Logic)

1.  **Database Schema & Migrations (Prisma):**
    *   Translate the table schemas from `biTs-Backend.md` (`Users`, `Customers`, `Appointments`, `TattooRequests`, `Payments`, `Images`, `Invoices`, `AuditLogs`) into Prisma schema.
    *   Run initial Prisma migrations (`prisma migrate dev`).
    *   Develop seed scripts for default data (e.g., admin user, roles).
2.  **Authentication & Authorization (Supabase Auth & Fastify):**
    *   Implement JWT verification middleware in Fastify using Supabase Auth.
    *   Develop role-based access control (RBAC) mechanisms for API endpoints.
3.  **Core API Endpoint Development (Fastify & Prisma):**
    *   Implement RESTful CRUD endpoints for:
        *   `TattooRequests`
        *   `Appointments`
        *   `Customers`
        *   `Users` (admin management)
    *   Implement endpoints for `Payments`, `Invoices`, and `Images` metadata.
    *   Utilize Fastify's schema validation for requests and responses.
4.  **Business Logic Implementation:**
    *   **Tattoo Request Workflow:** Logic for submission, artist review (status updates), and linking to customers/images.
    *   **Appointment Management:** Logic for creating, updating statuses (`pending`, `confirmed`, `completed`, `canceled`).
    *   **Image Metadata Handling:** Storing Cloudinary image URLs and metadata linked to tattoo requests.
5.  **Square Integration (Backend):**
    *   Develop services to interact with Square APIs (e.g., for booking availability if managed centrally, processing payments, creating customers).
    *   Implement secure handling of API keys and payment data.
    *   Set up webhooks if needed for Square events.
6.  **Logging & Auditing:**
    *   Configure structured logging (Pino) for requests, errors, and key events.
    *   Implement logic to populate the `AuditLogs` table for critical actions.
7.  **Testing (Backend):**
    *   Write unit tests for business logic and utility functions.
    *   Write integration tests for API endpoints (mocking external services like Square if necessary).

---

## Phase 3: Frontend Development (UI & User Experience)

1.  **Core Layout & Navigation (Next.js):**
    *   Develop main layout components (Header, Footer, Navigation bar) based on style guide.
    *   Set up file-system routing for main pages: Home, Portfolio, Artist Bio, Booking/Consultation Request, Contact, FAQ, Admin Panel (secure).
2.  **Static Pages & Content:**
    *   Build Home, Artist Bio, Contact, and FAQ pages with initial content and styling.
3.  **Portfolio/Gallery Implementation:**
    *   Develop components to display tattoo images (`next/image` with Cloudinary).
    *   Design gallery layout and filtering/sorting options if applicable.
4.  **Tattoo Request Form:**
    *   Build the comprehensive tattoo request form (description, placement, size, style, etc.).
    *   Integrate `React Dropzone` for multiple image uploads directly to Cloudinary.
    *   Implement client-side validation and feedback.
    *   Connect form submission to the backend `/tattoo-requests` API.
5.  **Booking Process & Square Integration (Frontend):**
    *   Design UI for displaying appointment availability (fetched from backend or Square).
    *   Integrate with Square's Web Payments SDK or redirect flow for payment processing and booking confirmation.
    *   Handle callbacks/redirects from Square to confirm booking status.
6.  **Admin Panel Development (Artist/Staff Portal):**
    *   Secure admin routes using authentication checks.
    *   Develop UI for:
        *   Viewing and managing tattoo requests.
        *   Managing appointments.
        *   Viewing customer data.
        *   (Potentially) Basic payment/invoice tracking.
7.  **State Management:**
    *   Utilize React Context for global state (e.g., auth status).
    *   Consider Zustand or Jotai if local component state becomes complex.
8.  **Styling & Responsiveness:**
    *   Apply brand styles (colors, typography, visual elements) consistently.
    *   Ensure all pages and components are fully responsive across devices.
    *   Implement subtle animations or transitions to enhance the artistic feel.
9.  **Accessibility (a11y):**
    *   Follow WCAG guidelines for semantic HTML, keyboard navigation, ARIA attributes, and color contrast.
10. **Testing (Frontend):**
    *   Write unit tests for components and utility functions.
    *   Consider integration tests for forms and data flow.

---

## Phase 4: Integration, E2E Testing & Refinement

1.  **Full Frontend-Backend Integration:**
    *   Ensure all API calls from frontend to backend are functioning correctly.
    *   Verify data consistency and flow between systems.
2.  **End-to-End (E2E) Testing:**
    *   Test key user flows:
        *   New customer submits a tattoo request with images.
        *   Artist reviews and approves/rejects a request.
        *   Artist creates an appointment from an approved request.
        *   Customer books an appointment and completes a (test) payment via Square.
        *   Artist manages appointments in the admin panel.
    *   Validate image upload, storage, and display pipeline (Cloudinary).
3.  **User Acceptance Testing (UAT) with Artist:**
    *   Provide the artist access to a staging environment.
    *   Gather feedback on UI/UX, functionality, and workflow.
4.  **Refinement & Bug Fixing:**
    *   Address issues identified during testing and UAT.
    *   Optimize performance (image loading, API response times).
    *   Review and refine UI based on feedback.

---

## Phase 5: Pre-Deployment & Deployment

1.  **Final Code Review & Cleanup:**
    *   Ensure code quality, remove unused code/console logs.
    *   Verify all environment variables are correctly configured for production.
2.  **Security Hardening:**
    *   HTTPS enforcement.
    *   Review CORS, rate limiting, and other security configurations.
    *   Ensure sensitive keys are not exposed.
3.  **Production Database Setup:**
    *   Set up production PostgreSQL database (e.g., via Supabase or other cloud provider).
    *   Run `prisma migrate deploy` for production schema.
    *   Seed essential production data if necessary (e.g., initial admin account).
4.  **Deployment Strategy:**
    *   **Backend (Fastify):** Deploy to a suitable platform (e.g., Fly.io, Render, AWS EC2/ECS, DigitalOcean App Platform).
    *   **Frontend (Next.js):** Deploy to a platform optimized for Next.js (e.g., Vercel, Netlify).
5.  **Domain & DNS Configuration:**
    *   Point domain name to the deployed frontend application.
    *   Configure API subdomains if necessary.
6.  **Final Production Testing:**
    *   Perform smoke tests on the live production environment.

---

## Phase 6: Post-Deployment & Ongoing Maintenance

1.  **Monitoring & Logging:**
    *   Set up application performance monitoring (APM) and error tracking tools.
    *   Regularly review server logs and application logs.
2.  **Data Backups:**
    *   Ensure regular automated backups for the PostgreSQL database.
3.  **Artist Training & Handover:**
    *   Provide documentation or training to the artist on using the admin panel.
4.  **Maintenance Plan:**
    *   Schedule regular checks for security updates and dependency vulnerabilities.
    *   Allocate time for bug fixes and minor enhancements based on artist feedback.
5.  **Future Enhancements:**
    *   Collect artist and potentially customer feedback for future feature development.

---

This build process provides a structured approach. Flexibility will be key, and tasks within phases may overlap or be re-prioritized as development progresses.
