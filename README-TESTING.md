# API Endpoint Testing Guide

This document provides instructions for testing your frontend-backend API integration using Vitest.

## Why Vitest Over Manual Scripts?

Using Vitest provides several advantages over manual test scripts:

✅ **Automated Testing**: Tests run automatically and can be integrated into CI/CD  
✅ **Mocking**: Proper mocking of dependencies and external services  
✅ **Coverage Reports**: See exactly what code is tested  
✅ **Watch Mode**: Tests re-run automatically when code changes  
✅ **Better Error Reporting**: Clear, detailed test failure messages  
✅ **IDE Integration**: Test results directly in your editor  
✅ **Parallel Execution**: Tests run faster with parallel execution  

## Test Structure

### 1. API Route Tests (`src/app/api/__tests__/routes.test.ts`)
Tests the Next.js API routes that proxy to your Fastify backend:
- Request/response handling
- Error propagation
- Authentication header forwarding
- Query parameter forwarding

### 2. API Client Integration Tests (`src/lib/api/services/__tests__/integration.test.ts`)
Tests the frontend API client services:
- Service method calls
- Data validation
- Error handling
- Type safety

### 3. Hook Tests (`src/hooks/__tests__/useTattooRequestForm.test.ts`)
Tests the complete form flow from UI to API:
- Form validation
- Submission handling
- Image uploads
- State management

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode (recommended during development)
```bash
npm run test:watch
```

### Run Tests with UI (visual test runner)
```bash
npm run test:ui
```

### Run Tests Once (for CI/CD)
```bash
npm run test:run
```

### Generate Coverage Report
```bash
npm run test:coverage
```

## Test Commands Explained

| Command | Description |
|---------|-------------|
| `npm test` | Run tests in watch mode |
| `npm run test:run` | Run tests once and exit |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:ui` | Open Vitest UI in browser |
| `npm run test:coverage` | Generate coverage report |

## What the Tests Cover

### ✅ Endpoint Functionality
- ✅ POST `/api/tattoo-requests` - Create tattoo request
- ✅ GET `/api/tattoo-requests` - List tattoo requests (auth required)
- ✅ GET `/api/tattoo-requests/:id` - Get specific request (auth required)
- ✅ PUT `/api/tattoo-requests/:id/status` - Update status (auth required)
- ✅ POST `/api/appointments` - Create appointment
- ✅ GET `/api/appointments` - List appointments (auth required)

### ✅ Data Validation
- ✅ Required field validation
- ✅ Email format validation
- ✅ Description length validation
- ✅ Date validation for appointments

### ✅ Authentication & Authorization
- ✅ Protected endpoints require auth
- ✅ Authorization headers are forwarded
- ✅ Proper error responses for unauthorized access

### ✅ Error Handling
- ✅ Network error handling
- ✅ Backend error propagation
- ✅ Validation error messages
- ✅ Graceful failure scenarios

### ✅ Frontend Integration
- ✅ Form submission flow
- ✅ Image upload handling
- ✅ State management
- ✅ UI feedback (loading, errors, success)

## Sample Test Output

When you run the tests, you'll see output like:

```
✓ src/app/api/__tests__/routes.test.ts (12)
  ✓ Next.js API Routes (12)
    ✓ Tattoo Requests API (6)
      ✓ POST /api/tattoo-requests (2)
        ✓ should create a tattoo request successfully
        ✓ should handle missing required fields
      ✓ GET /api/tattoo-requests (2)
        ✓ should require authentication
        ✓ should forward query parameters correctly
    ✓ Appointments API (4)
      ✓ should create an anonymous appointment successfully
      ✓ should validate appointment data
      ✓ should require authentication
      ✓ should forward authorization headers
    ✓ Error Handling (2)
      ✓ should handle network errors gracefully
      ✓ should preserve backend error messages

✓ src/lib/api/services/__tests__/integration.test.ts (15)
✓ src/hooks/__tests__/useTattooRequestForm.test.ts (10)

Test Files  3 passed (3)
Tests  37 passed (37)
```

## Testing Best Practices

### 1. Test in Development
Run tests in watch mode while developing:
```bash
npm run test:watch
```

### 2. Mock External Dependencies
Tests use mocks for:
- HTTP requests (axios)
- File uploads (Cloudinary)
- Backend services

### 3. Test Real User Flows
The hook tests simulate actual user interactions:
- Filling out forms
- Uploading images
- Submitting requests

### 4. Validate Both Success and Error Cases
Tests cover:
- Happy path scenarios
- Validation errors
- Network failures
- Authentication failures

## Manual Testing (Alternative)

If you prefer manual testing, you can still use the curl-based script:

```bash
# Make the script executable (Linux/Mac)
chmod +x test-endpoints.sh

# Run the script
./test-endpoints.sh
```

This script tests the same endpoints but requires both servers to be running.

## Troubleshooting

### Tests Failing?

1. **Check your Vitest configuration** in `vitest.config.ts`
2. **Verify mocks are properly set up** in test files
3. **Ensure test setup file exists** at `src/test/setup.ts`
4. **Check for import path issues** - tests use absolute imports

### Common Issues

| Error | Solution |
|-------|----------|
| "Cannot find module" | Check import paths in tests |
| "axios is not a function" | Verify axios mock setup |
| "Test timeout" | Add longer timeout for async tests |

### Getting Help

- Check the [Vitest documentation](https://vitest.dev/)
- Review existing test files for examples
- Look at the test output for specific error messages

## Next Steps

1. **Run the tests**: `npm run test:watch`
2. **Check coverage**: `npm run test:coverage`
3. **Add more tests** as you build new features
4. **Integrate with CI/CD** using `npm run test:run`

Happy testing! 🧪 