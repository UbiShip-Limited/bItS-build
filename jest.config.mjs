// @ts-check
/**
 * ESM-compatible Jest configuration
 * @type {import('ts-jest').JestConfigWithTsJest}
 */
export default {
  testEnvironment: 'node',
  clearMocks: true,
  
  // Test file patterns
  testMatch: [
    '<rootDir>/lib/**/__tests__/**/*.test.ts',
    '<rootDir>/lib/**/*.spec.ts',
  ],
  
  // Use a single setup file in ESM format
  setupFilesAfterEnv: ['./jest.setup.mjs'],
  
  // Specify the root directory for tests
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

  // ESM Configuration
  extensionsToTreatAsEsm: ['.ts'],
  
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        // Completely disable type checking for tests
        isolatedModules: true,
        // Skip all type checking in tests
        diagnostics: false,
        tsconfig: {
          // Override tsconfig settings for tests
          target: "ES2017",
          module: "ESNext",
          esModuleInterop: true,
          strict: false,
          skipLibCheck: true
        }
      },
    ],
  },
  
  // Simplify module resolution with ESM
  moduleNameMapper: {
    '(\\.\\.?/.*)\\.js$': '$1',
    '^../../square$': '<rootDir>/lib/square/index.ts',
    '^../square/index.js$': '<rootDir>/lib/square/index.ts',
    '^../../square/index.js$': '<rootDir>/lib/square/index.ts',
  },
  
  // Handle node_modules dependencies
  transformIgnorePatterns: [
    'node_modules/(?!(@prisma/client|square)/)'
  ],
  
  // Logging and timeout settings
  verbose: true,
  testTimeout: 10000,
  
  // Globals needed for ESM compatibility
  globals: {
    __filename: true,
    __dirname: true
  }
}; 