# Tattoo Artist App - Project Documentation

## **Project Description**
We are building a website for a local tattoo artist. The goal is to create a beautiful, artistically inspired UI that reflects the artist's work while serving as a comprehensive small business portal. The site will integrate with Square for payments and bookings, allowing customers to submit detailed tattoo requests, including image uploads. The backend will include a full business management system for the artist, including booking management, payment processing, accounting logs, and appointment management.

---

## **Tech Stack**


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



