/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  // No preset, we're configuring manually for ESM
  testEnvironment: 'node', // Use the Node.js environment for testing
  clearMocks: true,      // Automatically clear mock calls and instances between every test
  
  // Test file patterns
  testMatch: [
    '<rootDir>/lib/**/__tests__/**/*.test.ts',
    '<rootDir>/lib/**/*.spec.ts',
  ],
  
  // Add setup file to handle mocking of ES modules
  setupFilesAfterEnv: ['./jest.setup.mjs'],
  
  // Specify the root directory for Jest to look for files
  roots: ['<rootDir>/lib'], 

  // Test coverage configuration
  collectCoverage: process.env.COVERAGE === 'true',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'lib/**/*.{ts,tsx}',
    '!lib/**/*.d.ts',
    '!lib/**/__tests__/**',
  ],
  coverageReporters: ['text', 'lcov', 'html'],

  // --- ES Modules Configuration for Jest & ts-jest ---

  // 1. Tell Jest to treat .ts files as ES Modules
  extensionsToTreatAsEsm: ['.ts'],

  // 2. Configure ts-jest to transform TypeScript files into ESM-compatible JavaScript
  transform: {
    '^.+\\.tsx?$': [ 
      'ts-jest',
      {
        useESM: true, 
        tsconfig: 'tsconfig.json',
      },
    ],
  },

  // 3. Help Jest resolve module paths in an ESM context
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  
  // 4. Configure how to handle @prisma/client in the test environment
  transformIgnorePatterns: [
    'node_modules/(?!(@prisma/client)/)'
  ],
  
  // 5. Verbose output for better debugging
  verbose: true,
  
  // 6. Set timeout for tests
  testTimeout: 10000,
}; 