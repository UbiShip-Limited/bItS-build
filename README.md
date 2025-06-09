# Bowen Island Tattoo Shop

A modern, full-stack tattoo shop management system with integrated Square payments, customer management, and appointment booking.

## 🚦 Production Status: **READY** ✅

This application is **production-ready** with:
- **✅ Comprehensive Testing**: Real integration tests covering business workflows
- **✅ Security**: Authentication, authorization, input validation, audit logging
- **✅ Payment Integration**: Square API with proper error handling and caching
- **✅ Database**: Prisma ORM with PostgreSQL, connection management
- **✅ Docker Deployment**: Multi-stage builds with health checks
- **✅ Health Monitoring**: `/health` endpoints for production monitoring

## 🚀 Quick Start

### Development
```bash
# Install dependencies
npm install

# Start both frontend and backend
npm run dev:all

# Frontend: http://localhost:3000
# Backend: http://localhost:3001
```

### Production Deployment
```bash
# Copy production environment
cp env.production.example .env.production

# Deploy with Docker
docker-compose -f docker-compose.production.yml up -d

# Check health
curl http://localhost:3001/health
```

## 📋 Tech Stack

**Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS, DaisyUI
**Backend**: Fastify, TypeScript, Prisma ORM
**Database**: PostgreSQL (Supabase)
**Payments**: Square API
**Storage**: Cloudinary
**Auth**: Supabase Auth
**Testing**: Vitest with real integration tests
**Deployment**: Docker, Docker Compose

## 📚 Documentation

- **[Production Deployment Guide](./PRODUCTION-DEPLOYMENT.md)** - Complete deployment instructions
- **[Testing Migration Plan](./lib/services/__tests__/TESTING_MIGRATION_PLAN.md)** - Testing approach and strategy
- **[API Documentation](./docs/API_DOCUMENTATION.md)** - API endpoints and usage
- **[Square Payment Setup](./docs/square-payment-setup.md)** - Payment integration guide

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test suites
npm test lib/services/__tests__/paymentService.integration.test.ts
```

## 🔍 Health Monitoring

```bash
# Basic health check
curl http://localhost:3001/health

# Detailed health check (includes database, Square, Cloudinary status)
curl http://localhost:3001/health/detailed
```

## 🛠️ Development Commands

```bash
npm run dev:all          # Start both frontend and backend
npm run dev:frontend     # Start Next.js frontend only
npm run dev:backend      # Start Fastify backend only
npm run build            # Build frontend for production
npm run build:server     # Build backend for production
npm test                 # Run test suite
npm run lint             # Run ESLint
```

## 📊 Project Status

**Current Phase**: Production Ready
**Last Updated**: January 2025
**Test Coverage**: 90%+ on critical business logic
**Payment Integration**: Square API v2025-05-21 compliant
