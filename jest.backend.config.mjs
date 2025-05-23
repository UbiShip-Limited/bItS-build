// @ts-check
/**
 * Backend Jest configuration
 */
export default {
  displayName: 'backend',
  testEnvironment: 'node',
  
  // Test file patterns
  testMatch: [
    '<rootDir>/lib/**/__tests__/**/*.test.{ts,tsx}',
    '<rootDir>/lib/**/*.spec.{ts,tsx}',
  ],   
  
  // Use a single setup file in ESM format
  setupFilesAfterEnv: ['./jest.setup.mjs'],
  
  // Specify the root directory for tests
  roots: ['<rootDir>/lib'],

  // Test coverage configuration
  collectCoverageFrom: [
    'lib/**/*.{ts,tsx}',
    '!lib/**/*.d.ts',
    '!lib/**/__tests__/**',
  ],

  // ESM Configuration
  extensionsToTreatAsEsm: ['.ts', '.mts', '.tsx'],
  
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        isolatedModules: true,
        diagnostics: false,
        tsconfig: {
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
    // Pattern for .js extension handling
    '^(\\.{1,2}/.*)\\.js$': '$1',
    
    // Square mappings
    '^../../square$': '<rootDir>/lib/square/index.ts',
    '^../square/index.js$': '<rootDir>/lib/square/index.ts',
    '^../../square/index.js$': '<rootDir>/lib/square/index.ts',
    
    // Cloudinary mappings
    '^../../cloudinary$': '<rootDir>/lib/cloudinary/index.ts',
    '^../../cloudinary/index$': '<rootDir>/lib/cloudinary/index.ts',
    '^../../cloudinary/index.js$': '<rootDir>/lib/cloudinary/index.ts',
    
    // BookingService mappings
    '^../services/bookingService$': '<rootDir>/lib/services/bookingService.ts',
    '^../services/bookingService.js$': '<rootDir>/lib/services/bookingService.ts',
    '^../../services/bookingService$': '<rootDir>/lib/services/bookingService.ts',
    '^../../services/bookingService.js$': '<rootDir>/lib/services/bookingService.ts',
    
    // Auth middleware mappings
    '^./lib/middleware/auth$': '<rootDir>/lib/middleware/auth.ts',
    '^../middleware/auth$': '<rootDir>/lib/middleware/auth.ts',
    '^../middleware/auth.js$': '<rootDir>/lib/middleware/auth.ts',
    
    // Prisma client mappings
    '@prisma/client': '<rootDir>/lib/__tests__/__mocks__/@prisma/client.mjs',
    
    // Root imports fix
    '^<rootDir>/(.*)$': '<rootDir>/$1'
  },
  
  // Handle node_modules dependencies
  transformIgnorePatterns: [
    'node_modules/(?!(@prisma/client|square)/)'
  ],
  
  // Logging and timeout settings
  testTimeout: 30000,
  
  // Globals needed for ESM compatibility
  globals: {
    __filename: true,
    __dirname: true
  }
}; 