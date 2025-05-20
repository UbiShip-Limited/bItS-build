# Frontend-Backend Integration Plan

## Overview

This document outlines the integration plan between our Next.js frontend and Fastify backend, following the structure defined in our project outline. The integration will connect the UI components in the frontend with the API endpoints provided by the backend.

## Current Architecture

### Backend
- **Framework**: Fastify
- **Database**: Prisma ORM with underlying database
- **Authentication**: JWT-based authentication
- **Key Services**:
  - Tattoo Requests
  - Customer Management
  - Appointments/Bookings
  - Payments (Square integration)
  - Asset Management (image uploads)
  - Audit Logging

### Frontend
- **Framework**: Next.js 15
- **UI**: React 19 with Tailwind CSS
- **Directory Structure**: Follows the project outline with `/components`, `/hooks`, `/context`, `/lib`, etc.

## Integration Strategy

### 1. Authentication Flow

1. **Setup Auth Context (`/src/context`):**
   - Create AuthContext and AuthProvider in `/src/context/AuthContext.tsx`
   - Implement useAuth hook in `/src/hooks/useAuth.tsx`
   - Handle session persistence using localStorage/cookies

2. **Login/Registration Flow:**
   - Implement login/registration forms in `/src/components/forms/AuthForms.tsx`
   - Connect to authentication endpoints in `/src/pages/api/auth/`
   - Store tokens securely
   - Handle role-based redirects

3. **Auth Middleware:**
   - Implement client-side route protection
   - Add token forwarding to API requests via `/src/lib/api/apiClient.ts`
   - Handle token refresh

### 2. API Client Setup

1. **Create API Service Layer (`/src/lib/api`):**
   - Implement a base API client with Axios in `/src/lib/api/apiClient.ts`
   - Set up request/response interceptors
   - Add token handling
   - Implement error handling

2. **Endpoint Services:**
   - Create service modules for each API domain in `/src/lib/api/services/`:
     - `TattooRequestService.ts`
     - `CustomerService.ts`
     - `AppointmentService.ts`
     - `BookingService.ts`
     - `PaymentService.ts` (using Square SDK from `/src/lib`)
     - `AssetService.ts` (for image uploads)

3. **Response Types:**
   - Define TypeScript interfaces in `/src/types/`
   - Share type definitions between frontend and backend where possible

### 3. UI Component Integration

1. **Gallery Integration (`/src/components/gallery`):**
   - Replace static gallery data with API calls
   - Implement loading states using custom hooks
   - Add error handling

2. **Form Submissions (`/src/components/forms`):**
   - Connect tattoo request form to API
   - Implement client-side validation with custom hooks in `/src/hooks/useForm.tsx`
   - Add success/error feedback using UI components from `/src/components/ui`

3. **Layout Components (`/src/components/layout`):**
   - Implement responsive layouts
   - Create reusable headers, footers, and navigation

4. **Booking System:**
   - Implement calendar integration in `/src/components/forms/BookingForm.tsx`
   - Connect appointment booking to API
   - Add payment flow using Square SDK from `/src/lib`

### 4. Data Fetching Strategy

1. **Custom Hooks (`/src/hooks`):**
   - Create `useFetch.tsx` for data fetching
   - Implement `useAuth.tsx` for authentication
   - Create `useForm.tsx` for form handling

2. **Server-Side Rendering (SSR):**
   - Use Next.js data fetching for initial page loads
   - Implement getServerSideProps for authenticated routes

3. **Client-Side Fetching:**
   - Use custom React hooks for dynamic data
   - Implement caching strategy
   - Add optimistic updates for forms

4. **Real-time Updates:**
   - Implement WebSocket connections where needed
   - Add polling for critical data

### 5. Naming Convention and Data Flow

1. **Naming Consistency:**
   - Match frontend service names with their backend counterparts (e.g., backend `lib/services/TattooService.ts` to frontend `src/lib/api/services/TattooService.ts`)
   - Keep method names identical between frontend and backend services (e.g., `createTattooRequest()`, `getTattooById()`)
   - Use consistent endpoint naming patterns across the application

2. **Data Flow Architecture:**
   ```
   Frontend (Next.js)                   Backend (Fastify)
   ----------------                     ----------------
   UI Component                         Route Handler
       ↓                                    ↓
   Frontend Service                     Controller/Handler
       ↓                                    ↓
   API Client                           Service
       ↓                                    ↓
   HTTP Request → → → → → → → → → →      Middleware
                                            ↓
                                        Database (Prisma)
   ```

3. **Type Consistency:**
   - Maintain identical interface definitions between frontend and backend where applicable
   - Ensure request/response objects have consistent shapes
   - Document any discrepancies between frontend and backend types

4. **API Pattern Consistency:**
   - Use RESTful conventions (GET for retrieval, POST for creation, etc.)
   - Structure endpoints logically (e.g., `/api/tattoos`, `/api/bookings`)
   - Keep query parameter naming consistent across endpoints

## Implementation Tasks

### Phase 1: Authentication & Basic API Setup (Week 1)

- [ ] Implement AuthContext and AuthProvider in `/src/context`
- [ ] Create useAuth hook in `/src/hooks`
- [ ] Create API client with interceptors in `/src/lib/api`
- [ ] Connect login/registration forms
- [ ] Test token persistence and refresh
- [ ] Implement protected routes

### Phase 2: Core Services Integration (Week 2)

- [ ] Implement service classes in `/src/lib/api/services`
- [ ] Integrate gallery components with real data
- [ ] Connect tattoo request form to API
- [ ] Add customer profile screens
- [ ] Test API error handling

### Phase 3: Booking & Square Payments (Week 3)

- [ ] Implement booking calendar UI
- [ ] Connect appointment creation to API
- [ ] Integrate Square SDK from `/src/lib`
- [ ] Implement confirmation screens
- [ ] Test end-to-end booking flow

### Phase 4: Advanced Features & Refinement (Week 4)

- [ ] Add image uploads functionality
- [ ] Implement admin dashboard
- [ ] Add notifications system
- [ ] Optimize loading states
- [ ] Final testing and bug fixes

## Testing Strategy

### Unit Tests

- [ ] Test authentication hooks
- [ ] Test API service methods
- [ ] Mock API responses

### Integration Tests

- [ ] Test form submissions
- [ ] Test authentication flow
- [ ] Test booking process

### End-to-End Tests

- [ ] Complete user journeys
- [ ] Test all major flows:
  - Account creation
  - Tattoo request submission
  - Booking appointment
  - Payment processing

## Development Environment Setup

1. **Local Development:**
   - Start frontend: `npm run dev`
   - Start backend: `npm run dev:server`
   - Combined: `npm run dev:all`

2. **Environment Configuration:**
   - Create .env.local with required variables
   - Configure API URL based on environment

3. **Test Data:**
   - Create seeds for test database
   - Implement fixtures for frontend tests

## Deployment Considerations

1. **API URL Configuration:**
   - Use environment variables for API URLs
   - Configure CORS for production domains

2. **Authentication in Production:**
   - Set proper token expiration
   - Implement secure cookie handling
   - Enable HTTPS for all communications

3. **Error Logging:**
   - Implement client-side error tracking
   - Add server logging for API errors
   - Set up monitoring alerts

## Next Steps

1. Begin with authentication implementation in `/src/context` and `/src/hooks`
2. Create and test API client in `/src/lib/api`
3. Integrate one component at a time, starting with the gallery
4. Regularly test on both development and staging environments 