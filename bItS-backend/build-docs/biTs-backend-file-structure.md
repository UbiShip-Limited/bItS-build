# bItS-backend File Structure

```
/bItS-backend
├── /src
│   ├── /api                       # API layer
│   │   ├── /routes                # Route definitions grouped by resource
│   │   │   ├── customers.ts       # Customer endpoints
│   │   │   ├── tattooRequests.ts  # Tattoo request endpoints
│   │   │   ├── appointments.ts    # Appointment endpoints
│   │   │   ├── users.ts           # User management endpoints
│   │   │   ├── auth.ts            # Authentication endpoints
│   │   │   ├── payments.ts        # Payment endpoints (for Square integration)
│   │   │   └── index.ts           # Main router that consolidates all routes
│   │   │
│   │   ├── /schemas               # JSON schemas for request/response validation
│   │   │   ├── /customers
│   │   │   ├── /tattooRequests
│   │   │   ├── /appointments
│   │   │   └── /payments
│   │   │
│   │   └── /controllers           # Request handlers
│   │       ├── customerController.ts
│   │       ├── tattooRequestController.ts
│   │       ├── appointmentController.ts
│   │       ├── userController.ts
│   │       ├── authController.ts
│   │       └── paymentController.ts
│   │
│   ├── /services                  # Business logic layer
│   │   ├── customerService.ts     # Customer-related business logic
│   │   ├── tattooService.ts       # Tattoo request workflow logic
│   │   ├── appointmentService.ts  # Appointment management logic
│   │   ├── authService.ts         # Authentication and authorization logic
│   │   ├── paymentService.ts      # Payment processing logic
│   │   ├── imageService.ts        # Image metadata handling
│   │   └── auditService.ts        # Audit logging functionality
│   │
│   ├── /db                        # Database layer
│   │   ├── prismaClient.ts        # Prisma client singleton
│   │   └── /repositories          # Repository pattern implementation
│   │       ├── customerRepo.ts    # Customer data access
│   │       ├── tattooRequestRepo.ts
│   │       ├── appointmentRepo.ts
│   │       └── userRepo.ts
│   │
│   ├── /integrations              # External service integrations
│   │   ├── /supabase              # Supabase authentication
│   │   │   └── auth.ts
│   │   ├── /cloudinary            # Image storage
│   │   │   └── imageStorage.ts
│   │   └── /square                # Payment processing (future)
│   │       └── paymentClient.ts
│   │
│   ├── /utils                     # Utility functions and helpers
│   │   ├── logger.ts              # Logging utility
│   │   ├── errors.ts              # Custom error classes
│   │   ├── validators.ts          # Common validation helpers
│   │   └── dateTime.ts            # Date/time manipulation helpers
│   │
│   ├── /middleware                # Custom middleware
│   │   ├── auth.ts                # Authentication middleware
│   │   ├── rbac.ts                # Role-based access control
│   │   ├── errorHandler.ts        # Global error handling
│   │   └── requestLogger.ts       # Request logging
│   │
│   ├── /types                     # TypeScript type definitions
│   │   ├── customer.ts
│   │   ├── tattooRequest.ts
│   │   ├── appointment.ts
│   │   ├── user.ts
│   │   ├── payment.ts
│   │   └── audit.ts
│   │
│   ├── /config                    # Application configuration
│   │   ├── environment.ts         # Environment-specific configs
│   │   ├── constants.ts           # Application constants
│   │   └── server.ts              # Server configuration
│   │
│   ├── app.ts                     # Fastify app setup
│   └── server.ts                  # Server entry point
│
├── /prisma
│   ├── schema.prisma              # Prisma schema definitions
│   ├── migrations/                # Database migrations
│   └── seed.ts                    # Database seeding
│
├── /tests
│   ├── /unit                      # Unit tests
│   │   ├── /services
│   │   └── /utils
│   ├── /integration               # Integration tests
│   │   ├── /api
│   │   └── /db
│   ├── /mocks                     # Test mocks
│   └── setup.ts                   # Test setup
│
├── /scripts                       # Utility scripts
│   ├── generateTypes.ts           # Generate TypeScript types from Prisma
│   └── seedDev.ts                 # Development data seeding
│
├── /.github                       # CI/CD configuration
│   └── /workflows
│       └── ci.yml                 # GitHub Actions CI workflow
│
├── /dist                          # Compiled output
├── .env.example                   # Example environment variables
├── .env.development               # Development environment variables
├── .env.test                      # Test environment variables
├── .env.production                # Production environment variables
├── .gitignore
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md
```

## Key Organizational Principles

1. **Layered Architecture**:
   - API Layer: Routes, schemas, controllers
   - Business Logic Layer: Services
   - Data Access Layer: Repositories, Prisma client

2. **Resource-Based Organization**: File structure matches business entities (customers, tattoo requests, appointments).

3. **Separation of Concerns**: Clear boundaries between different layers of the application.

4. **Environment Awareness**: Configuration for dev, test, and production environments.

5. **Testing Support**: Comprehensive structure for unit, integration, and e2e tests.

## Implementation Priority

Based on the build plan, implementation should follow these phases:

1. Set up core infrastructure (app.ts, server.ts, config)
2. Database and Prisma setup
3. Authentication integration (Supabase)
4. Core resource implementations in this order:
   - Customers
   - TattooRequests (including image handling)
   - Appointments
   - Users
5. Business logic implementation
6. Payment integration (deferred) 