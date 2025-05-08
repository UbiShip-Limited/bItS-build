# Backend Tech Stack & Implementation


## **Project Description**
We are building a website for a local tattoo artist. The goal is to create a beautiful, artistically inspired UI that reflects the artist's work while serving as a comprehensive small business portal. The site will integrate with Square for payments and bookings, allowing customers to submit detailed tattoo requests, including image uploads. The backend will include a full business management system for the artist, including booking management, payment processing, accounting logs, and appointment management.
## **Tech Stack**


**Node.js with Fastify** - For a high-performance, schema-driven API server with minimal overhead, optimized for speed and scalability.

**Prisma (with PostgreSQL)** - Type-safe ORM for managing structured business data, including customer submissions, bookings, and payments.

**Supabase Auth** - For secure, admin-only authentication and role-based access control.

**Cloudinary** - For scalable image storage, transformation, and global CDN delivery, handling all customer tattoo image uploads.

**Supabase Storage** - For secure metadata storage and quick retrieval of image data, tightly integrated with the Prisma ORM.

## **Database Schema**

### **Tables Overview**
1. **Users** - Artist and staff accounts for managing the platform.
2. **Customers** - Client information and history.
3. **Appointments** - Bookings and appointments.
4. **TattooRequests** - Detailed tattoo submissions.
5. **Payments** - Tracking financial transactions.
6. **Images** - Storing image metadata for submissions.
7. **Invoices** - Linking payments to appointments.
8. **AuditLogs** - Tracking changes for accounting and record-keeping.

### **Users Table**
```sql
CREATE TABLE Users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'artist', -- artist, assistant, admin
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

### **Customers Table**
```sql
CREATE TABLE Customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

### **Appointments Table**
```sql
CREATE TABLE Appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES Customers(id) ON DELETE CASCADE,
    artist_id UUID REFERENCES Users(id) ON DELETE SET NULL,
    date TIMESTAMPTZ NOT NULL,
    duration INTERVAL NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, completed, canceled
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

### **TattooRequests Table**
```sql
CREATE TABLE TattooRequests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES Customers(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    placement VARCHAR(255),
    size VARCHAR(50),
    color_preference VARCHAR(50),
    style VARCHAR(100),
    reference_images JSONB DEFAULT '[]',
    status VARCHAR(50) DEFAULT 'new', -- new, reviewed, approved, rejected
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

## **Implementation Details**

### 1. API Design & Endpoints (Fastify & Prisma)
    - **RESTful API Structure:** Design clear and consistent RESTful endpoints for each resource (Users, Customers, Appointments, TattooRequests, Payments, Images, Invoices).
    - **Schema-Driven Development:** Utilize Fastify's schema validation for request (body, params, query) and response serialization to ensure data integrity and provide clear API contracts.
    - **CRUD Operations:** Implement standard CRUD (Create, Read, Update, Delete) operations for each relevant database table via Prisma.
        - `POST /tattoo-requests` - Submit a new tattoo request.
        - `GET /tattoo-requests` - List tattoo requests (admin only, with filtering/pagination).
        - `GET /tattoo-requests/{id}` - Get details of a specific tattoo request (admin only).
        - `PUT /tattoo-requests/{id}` - Update a tattoo request (e.g., status, notes by artist).
        - `POST /appointments` - Create a new appointment (likely linked to an approved tattoo request).
        - `GET /appointments` - List appointments (admin only, with filtering).
        - `PUT /appointments/{id}` - Update appointment status or details.
        - `GET /customers` - List customers (admin only).
        - `GET /customers/{id}` - Get customer details and history (admin only).
        - (Endpoints for Payments, Invoices, Users as needed for admin panel)
    - **Prisma Integration:** Use Prisma Client for all database interactions, leveraging its type safety and query building capabilities.

### 2. Authentication & Authorization (Supabase Auth & Fastify Hooks)
    - **Admin-Only Access:** Secure all backend routes to be accessible only by authenticated users (artist, staff).
    - **JWT Verification:** Implement a Fastify hook to verify JWTs provided by Supabase Auth on incoming requests.
    - **Role-Based Access Control (RBAC):**
        - Define roles (e.g., `artist`, `assistant`, `admin`) as per the `Users` table.
        - Implement authorization logic, possibly using Fastify hooks or decorators, to restrict access to certain endpoints or operations based on user roles. For example, an `assistant` might have read-only access to some data, while an `artist` can modify it.

### 3. Business Logic & Workflows
    - **Tattoo Request Processing:**
        - Logic for handling new tattoo requests: saving data, associating with customer, storing reference images (metadata).
        - Workflow for artist review: updating status (`new`, `reviewed`, `approved`, `rejected`), adding internal notes.
    - **Appointment Management:**
        - Creating appointments from approved tattoo requests.
        - Managing appointment statuses (`pending`, `confirmed`, `completed`, `canceled`).
        - Potential logic for notifications - could be passed to square
    - **Payment Processing & Square Integration:**
        - Securely handle payment information and integrate with Square APIs for payment processing.
        - Create `Payments` and `Invoices` records upon successful transactions.
        - Potentially reconcile Square transaction data with internal records.
    - **Accounting & Audit Logs:**
        - Implement logic to populate the `AuditLogs` table for significant actions (e.g., appointment changes, payment processing, user modifications). This is crucial for record-keeping and potential dispute resolution.

### 4. Image Handling (Cloudinary & Supabase Storage/Prisma)
    - **Image Upload Processing:** While the frontend handles direct upload to Cloudinary, the backend will receive image metadata (e.g., Cloudinary URL, public ID) from the client.
    - **Metadata Storage:** Store image metadata (URLs, transformations, tags) in the `Images` table, linked to `TattooRequests`. Supabase Storage might be used if direct file handling by the backend is needed for some reason, but given Cloudinary, the focus will be on metadata.
    - **Secure Image URLs:** Ensure that image URLs stored and served are secure and potentially time-limited if direct access needs to be controlled (though Cloudinary often handles this well).

### 5. Database Management & Migrations (Prisma)
    - **Prisma Migrate:** Use `prisma migrate dev` for schema changes during development and `prisma migrate deploy` for production deployments.
    - **Seeding:** Develop seed scripts (using Prisma) for initial data setup (e.g., default admin user, initial roles) for different environments.

### 6. Error Handling & Logging
    - **Centralized Error Handling:** Implement a global error handler in Fastify to catch and format errors consistently.
    - **Structured Logging:** Use a library like Pino (Fastify's default logger) for structured, performant logging of requests, errors, and important business events.
    - **Audit Logging:** As mentioned, utilize the `AuditLogs` table for business-critical event tracking.

### 7. API Security
    - **Input Validation:** Rely heavily on Fastify's schema validation for all inputs.
    - **HTTPS:** Ensure API is served over HTTPS in production.
    - **Rate Limiting:** Consider implementing rate limiting (e.g., using `@fastify/rate-limit`) to protect against abuse.
    - **CORS:** Configure CORS policies appropriately using `@fastify/cors` to allow requests from the Next.js frontend.
    - **Environment Variables:** Securely manage all secrets (database URLs, API keys, JWT secrets) using environment variables (e.g., `.env` files, platform-specific secret management).

### 8. Testing
    - **Unit Tests:** Write unit tests for individual functions, business logic modules, and Fastify route handlers (mocking Prisma and external services).
    - **Integration Tests:** Test the interaction between Fastify routes, Prisma, and the database.
    - **End-to-End (E2E) Tests:** (Optional, but recommended) Test complete workflows. 