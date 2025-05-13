# Bowen Island Tattoo Shop - Test Coverage

This document outlines the current test coverage and identifies areas for improvement.

## Current Coverage (As of Last Run)

| File                | % Stmts | % Branch | % Funcs | % Lines | Uncovered Lines       |
|---------------------|---------|----------|---------|---------|------------------------|
| All files           | 51.28   | 40       | 50      | 51.28   |                        |
| lib/server.ts       | 48.14   | 25       | 33.33   | 48.14   | 31-37, 47-68, 73       |
| lib/plugins/prisma.ts | 100   | 100      | 100     | 100     |                        |
| lib/prisma/prisma.ts | 100    | 100      | 100     | 100     |                        |
| lib/supabase/supabaseClient.ts | 0 | 0    | 100     | 0       | 3-10                   |

## Coverage Target

For this project, we aim to achieve:
- **80%** statement coverage
- **70%** branch coverage
- **80%** function coverage
- **80%** line coverage

## Priority Areas for Improvement

Based on the latest coverage report, these are the priority areas for adding tests:

### High Priority
1. **lib/supabase/supabaseClient.ts** - Currently 0% coverage
   - Add tests for Supabase client initialization
   - Test authentication methods if applicable

2. **lib/server.ts** - Only 48% line coverage
   - Missing coverage for lines 31-37 (likely route handlers)
   - Missing coverage for lines 47-68 (likely server configuration or middleware)
   - Missing coverage for line 73

### Medium Priority
- Test route handlers more comprehensively
- Add edge case tests for error handling 
- Test authentication and authorization flows

## Implementation Plan

1. **Phase 1: Essential API Tests**
   - Complete tests for all RESTful endpoints
   - Test both success and error paths for each endpoint

2. **Phase 2: Authentication & Authorization**
   - Test authentication flows
   - Test role-based access control

3. **Phase 3: Edge Cases & Error Handling**
   - Test validation failures
   - Test rate limiting
   - Test error scenarios

## Test Writing Guidelines

When adding new tests to improve coverage:

1. Use the testing template in `lib/__tests__/template.test.ts`
2. Focus on testing behavior, not implementation
3. Mock external dependencies
4. Follow the Arrange-Act-Assert pattern
5. Add comments explaining complex test scenarios

## Running Coverage Report

To run the coverage report:

```bash
npm run test:coverage
```

The detailed HTML report is generated in the `/coverage` directory and can be viewed by opening `/coverage/lcov-report/index.html` in a browser. 