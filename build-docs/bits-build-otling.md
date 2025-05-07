# Tattoo Artist App - Project Documentation

## **Project Description**
This project involves building a website for a local tattoo artist. The goal is to create a beautiful, artistically inspired UI that reflects the artist's work while serving as a comprehensive small business portal. The site will integrate with Square for payments and bookings, allowing customers to submit detailed tattoo requests, including image uploads. The backend will include a full business management system for the artist, including booking management, payment processing, accounting logs, and appointment management.

---

## **Tech Stack**

### **Frontend**
- **Next.js (React + TypeScript)** - For fast, SEO-friendly, and scalable front-end development.
- **Tailwind CSS** (with **DaisyUI** or **Framer Motion** for animations) - To create a unique, visually rich UI that matches the tattoo artist's style.
- **React Dropzone** - For image uploads in the submission form, allowing users to drag and drop reference images.
- **Next/Image** - For optimized image handling, especially for portfolio pages.

### **Backend**
- **Node.js with Express** - For a lightweight, high-performance backend.
- **Prisma (with PostgreSQL or MongoDB)** - For a strongly typed ORM, making it easier to manage the tattoo artist’s business data.
- **Square SDK** - For handling payments, booking, and invoicing directly through the artist's existing Square account.
- **AWS S3 or Supabase Storage** - For secure image storage and quick retrieval.
- **Supabase or Firebase Auth** - For user authentication if needed.

---

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

### **File Structure**

#### **Frontend Directory Structure (Next.js + TypeScript)**
```
/tattoo-artist-website
├── /public
│   ├── /images          # Static images (e.g., tattoo examples, logos)
│   ├── /fonts           # Custom fonts
│   └── favicon.ico      # Site favicon
│
├── /src
│   ├── /components
│   │   ├── /forms       # Tattoo request forms, booking forms
│   │   ├── /ui          # Reusable UI components (buttons, modals, inputs)
│   │   ├── /layout      # Main layout components (headers, footers, sidebars)
│   │   └── /gallery     # Tattoo galleries, portfolio components
│   │
│   ├── /hooks           # Custom React hooks (e.g., useAuth, useForm, useFetch)
│   ├── /pages
│   │   ├── index.tsx    # Home page
│   │   ├── about.tsx    # About the artist
│   │   ├── gallery.tsx  # Tattoo portfolio
│   │   ├── booking.tsx  # Booking page
│   │   ├── contact.tsx  # Contact form
│   │   └── api          # API routes for SSR and backend integration
│   │       └── /auth    # Authentication endpoints
│   │
│   ├── /styles          # Global and component-specific styles
│   ├── /context         # Context providers
│   ├── /utils           # Utility functions
│   └── /lib             # Square SDK and external integrations
│
├── .env                 # Environment variables
├── tailwind.config.js   # Tailwind CSS configuration
├── next.config.js       # Next.js configuration
├── tsconfig.json        # TypeScript configuration
└── README.md            # Project documentation
```

---

Let me know if this structure captures everything you need for the initial project setup!


https://github.com/Maximilian93B/bItS-build.git

