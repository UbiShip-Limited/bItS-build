# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a production-ready tattoo shop management system for Bowen Island Tattoo Shop, featuring a Next.js 15 frontend and Fastify backend with comprehensive business management capabilities.

## Essential Commands

### Development
```bash
# Start both frontend and backend concurrently (recommended)
npm run dev:all

# Individual services
npm run dev:frontend  # Next.js on port 3000
npm run dev:backend   # Fastify on port 3001
```

### Testing
```bash
# Run all tests
npm test

# Run with coverage report
npm run test:coverage

# Run a specific test file
npm test -- lib/services/__tests__/CustomerService.test.ts

# Run tests matching a pattern
npm test -- --grep "CustomerService"
```

### Building & Deployment
```bash
# Build frontend
npm run build

# Build backend for production
npm run build:server

# Build for Railway deployment
npm run build:railway
```

### Linting
```bash
npm run lint
```

## Architecture Overview

### Tech Stack
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS + DaisyUI
- **Backend**: Fastify, TypeScript, Prisma ORM, PostgreSQL
- **Authentication**: Supabase Auth
- **Payments**: Square API
- **Images**: Cloudinary
- **Real-time**: Server-Sent Events (SSE)

### Project Structure
```
src/                # Next.js frontend
├── app/           # App router pages
├── components/    # React components
├── hooks/         # Custom React hooks
└── lib/           # Frontend utilities

lib/               # Fastify backend
├── routes/        # API endpoints
├── services/      # Business logic
├── middleware/    # Auth, rate limiting
├── square/        # Square API client
└── server.ts      # Main entry point

prisma/            # Database schema
scripts/           # Utility scripts
```

### Key Services Architecture

The backend follows a service-oriented architecture with dependency injection:

1. **CustomerService**: Customer management and CRM
2. **AppointmentService**: Scheduling and calendar management  
3. **PaymentService**: Square integration for payments/invoices
4. **TattooRequestService**: Request submission workflow
5. **CloudinaryService**: Image upload and management
6. **EmailService**: Email notifications
7. **RealtimeService**: SSE for real-time updates

Services are instantiated with their dependencies in `lib/server.ts` and passed to route handlers.

## Testing Strategy

The codebase uses **integration tests** over unit tests (see `/lib/services/__tests__/TESTING_MIGRATION_PLAN.md`):

- Tests use real database operations with test data
- External APIs (Square, Cloudinary) are mocked
- 90%+ coverage on critical business logic
- Tests run with Vitest and jsdom

## API Design

RESTful API with consistent patterns:
- Base path: `/api/v1`
- Authentication required for most endpoints
- Request validation with Zod schemas
- Comprehensive error handling
- See `/docs/API_DOCUMENTATION.md` for full reference

## Environment Configuration

Required environment variables:
- Database: `DATABASE_URL`
- Auth: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- Square: `SQUARE_ACCESS_TOKEN`, `SQUARE_LOCATION_ID`, `SQUARE_ENVIRONMENT`
- Cloudinary: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- Frontend: `NEXT_PUBLIC_BACKEND_API_URL`, `NEXT_PUBLIC_SUPABASE_URL`

## Common Development Tasks

### Database Operations
```bash
# Generate Prisma client after schema changes
npx prisma generate

# Create and apply migrations
npx prisma migrate dev --name your_migration_name

# View database in Prisma Studio
npx prisma studio
```

### Working with Square API
- Test mode uses sandbox environment
- See `/docs/square-payment-setup.md` for detailed setup
- Mock Square client available in tests

### Adding New Features
1. Create service in `/lib/services/`
2. Add route handler in `/lib/routes/`
3. Register route in `/lib/server.ts`
4. Write integration tests
5. Update frontend components

## Production Deployment

The project supports multiple deployment strategies:
- Railway (primary) - see `railway.json`
- Docker containers - production deployment guide in `/docs/`
- Health check endpoints at `/health` and `/api/health`

Backend deploys separately using `server-package.json` with Railway ignoring frontend files via `.railwayignore`.

## Code Conventions

- TypeScript with partial strict mode (strictNullChecks enabled)
- Path aliases: `@/*` for frontend imports
- ESLint configured with warnings (not errors) for most rules
- Prefer integration tests over unit tests
- Use existing DaisyUI components before creating custom ones
- Follow existing patterns in similar files