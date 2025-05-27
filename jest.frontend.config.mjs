// @ts-check
/**
 * Frontend Jest configuration - matches backend ESM approach
 */
export default {
  displayName: 'frontend',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.test.{ts,tsx}',
    '<rootDir>/src/**/*.spec.{ts,tsx}'
  ],
  
  // Use setup file (CommonJS for reliability)
  setupFilesAfterEnv: [
    '<rootDir>/jest.frontend.setup.js',
    '<rootDir>/src/setupTests.ts'
  ],
  
  // ESM Configuration (same as backend)
  extensionsToTreatAsEsm: ['.ts', '.tsx', '.mts'],
  
  transform: {
    '^.+\\.(ts|tsx|mts)$': [
      'ts-jest',
      {
        useESM: true,
        isolatedModules: true,
        diagnostics: false,
        tsconfig: {
          jsx: "react-jsx",
          target: "ES2017",
          module: "ESNext",
          esModuleInterop: true,
          strict: false,
          skipLibCheck: true,
          allowSyntheticDefaultImports: true,
          resolveJsonModule: true
        }
      },
    ],
  },
  
  moduleNameMapper: {
    // Handle JS extensions for ESM
    '^(\\.{1,2}/.*)\\.js$': '$1',
    
    // CSS and asset mocks
    '\\.(css|scss|sass|less)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/src/__mocks__/fileMock.js',
    
    // Path aliases
    '^@/(.*)$': '<rootDir>/src/$1',
    '^~/(.*)$': '<rootDir>/src/$1',
    
    // Map MSW imports
    '^msw/node$': '<rootDir>/node_modules/msw/lib/node/index.js',
  },
  
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/*.stories.{ts,tsx}',
    '!**/node_modules/**'
  ],
  
  // Handle node_modules dependencies
  transformIgnorePatterns: [
    'node_modules/(?!(msw|@mswjs)/)'
  ],
  
  // Module resolution
  moduleDirectories: ['node_modules', 'src'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node', 'mjs'],
  
  // Use default resolver
  resolver: undefined,
  
  testTimeout: 15000,
  clearMocks: true,
  restoreMocks: true,
  
  // Globals needed for ESM compatibility (same as backend)
  globals: {
    __filename: true,
    __dirname: true
  }
}; 