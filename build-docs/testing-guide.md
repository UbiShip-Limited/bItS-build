# Bowen Island Tattoo Shop - Testing Guide

This guide explains the testing setup for the Bowen Island Tattoo Shop project and provides instructions for writing effective tests.

## Testing Framework

We use Jest as our testing framework with the following configuration:

- **Test Files**: Located in `lib/__tests__/` with `.test.ts` or `.spec.ts` extensions
- **Configuration**: Defined in `jest.config.cjs`
- **Setup**: Global test setup is in `jest.setup.mjs`
- **Helpers**: Common testing utilities are in `lib/__tests__/test-helpers.ts`

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (rerun on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Structure

Tests follow this structure:

1. **Imports**: Import the necessary testing utilities and modules to test
2. **Test Data**: Define mock data needed for tests
3. **Test Suite**: Create a describe block for the module/component being tested
4. **Test Setup**: Use beforeEach/afterEach hooks for setup and teardown
5. **Test Cases**: Individual it blocks for specific test scenarios

Example:

```typescript
import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { mockPrismaClient } from '../../jest.setup.mjs';
import { createMockUsers, dateToISOStrings, setupTestApp } from './test-helpers';

describe('Feature Name', () => {
  // Setup test app
  const testApp = setupTestApp();
  let request;
  
  beforeEach(async () => {
    // Initialize for each test
    const setup = await testApp.setup();
    request = setup.request;
  });

  afterEach(async () => {
    await testApp.teardown();
  });

  describe('Specific behavior', () => {
    it('should do something expected', async () => {
      // Arrange - Setup test conditions
      
      // Act - Perform the action 
      
      // Assert - Verify the results
    });
  });
});
```

## Mocking Prisma

The database is mocked to avoid hitting real databases in tests:

```typescript
// Access the mock client
import { mockPrismaClient } from '../../jest.setup.mjs';

// Mock a response
const findMany = mockPrismaClient.user.findMany;
if (findMany && typeof findMany === 'function' && 'mockResolvedValue' in findMany) {
  (findMany as any).mockResolvedValue(mockData);
}
```

## Test Helpers

The `test-helpers.ts` file provides utility functions:

1. **createMockUsers()**: Creates test user data
2. **setupTestApp()**: Sets up and tears down the Fastify app for testing
3. **dateToISOStrings()**: Converts Date objects to ISO strings for API comparisons
4. **createAuthRequest()**: Creates authenticated request helpers

## Creating New Tests

1. Copy `template.test.ts` as a starting point
2. Rename it to match your feature (e.g., `users.test.ts`)
3. Remove the `.skip` from the main describe block
4. Update the imports and test cases

## Best Practices

1. **Isolation**: Each test should be independent and not rely on other tests
2. **Mock External Dependencies**: Always mock external services and databases
3. **Arrange-Act-Assert**: Structure tests with clear setup, action, and verification phases
4. **Descriptive Names**: Use clear describe and it blocks that explain what's being tested
5. **Coverage**: Aim for high test coverage of critical code paths

## Troubleshooting

If you encounter this error:
```
Argument of type 'Error' is not assignable to parameter of type 'never'.
```

Use a type assertion when mocking:
```typescript
(mockFunction as any).mockRejectedValue(new Error('Test error'));
``` 