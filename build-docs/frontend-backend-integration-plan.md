# Frontend-Backend Integration Plan

## Overview

This document outlines the integration plan between our Next.js frontend and Fastify backend. The integration will connect the UI components in the frontend with the API endpoints provided by the backend.

## Current Architecture

### Backend
- **Framework**: Fastify
- **Database**: Prisma ORM with underlying database
- **Authentication**: Supabase Auth
- **Key Services**:
  - Tattoo Requests
  - Customer Management
  - Appointments/Bookings
  - Payments (Square integration)
  - Asset Management (Cloudinary)
  - Audit Logging

### Frontend
- **Framework**: Next.js 15
- **UI**: React 19 with Tailwind CSS
- **Components**: Gallery, Artist Showcase, Forms, etc.
- **Authentication**: Supabase Auth

## Integration Strategy

### 1. Authentication Flow

1. **Setup Auth Context:**
   - Create a shared authentication context in the frontend
   - Store JWT tokens and user data
   - Handle session persistence

2. **Login/Registration Flow:**
   - Implement login/registration forms
   - Connect to Supabase auth endpoints
   - Store tokens in secure cookies/localStorage
   - Handle role-based redirects

3. **Auth Middleware:**
   - Implement client-side route protection
   - Add token forwarding to API requests
   - Handle token refresh

### 2. API Client Setup

1. **Create API Service Layer:**
   - Implement a base API client with Axios
   - Set up request/response interceptors
   - Add token handling
   - Implement error handling

2. **Endpoint Services:**
   - Create service modules for each API domain:
     - `TattooRequestService`
     - `CustomerService`
     - `AppointmentService`
     - `BookingService`
     - `PaymentService`
     - `CloudinaryService`

3. **Response Types:**
   - Define TypeScript interfaces matching backend response structures
   - Share type definitions between frontend and backend where possible

### 3. UI Component Integration

1. **Gallery Integration:**
   - Replace static gallery data with API calls
   - Implement loading states
   - Add error handling

2. **Form Submissions:**
   - Connect tattoo request form to API
   - Implement client-side validation
   - Add success/error feedback

3. **Artist Showcase:**
   - Load artist data from API
   - Implement pagination/filtering

4. **Booking System:**
   - Implement calendar integration
   - Connect appointment booking to API
   - Add payment flow

### 4. Data Fetching Strategy

1. **Server-Side Rendering (SSR):**
   - Use Next.js data fetching for initial page loads
   - Implement getServerSideProps for authenticated routes

2. **Client-Side Fetching:**
   - Use React hooks for dynamic data
   - Implement caching strategy
   - Add optimistic updates for forms

3. **Real-time Updates:**
   - Implement WebSocket connections where needed
   - Add polling for critical data

## Implementation Tasks

### Phase 1: Authentication & Basic API Setup (Week 1)

- [ ] Implement auth context and providers
- [ ] Create API client with interceptors
- [ ] Connect login/registration forms
- [ ] Test token persistence and refresh
- [ ] Implement protected routes

### Phase 2: Core Services Integration (Week 2)

- [ ] Implement TattooRequestService
- [ ] Integrate gallery with real data
- [ ] Connect tattoo request form to API
- [ ] Add customer profile screens
- [ ] Test API error handling

### Phase 3: Booking & Payments (Week 3)

- [ ] Implement booking calendar UI
- [ ] Connect appointment creation to API
- [ ] Add Square payment flow
- [ ] Implement confirmation screens
- [ ] Test end-to-end booking flow

### Phase 4: Advanced Features & Refinement (Week 4)

- [ ] Add image uploads via Cloudinary
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
   - Ensure Supabase credentials are set
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

1. Begin with authentication implementation
2. Create and test API client
3. Integrate one component at a time, starting with the gallery
4. Regularly test on both development and staging environments 