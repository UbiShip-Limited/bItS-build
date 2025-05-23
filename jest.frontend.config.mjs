// @ts-check
/**
 * Frontend Jest configuration
 */
export default {
  displayName: 'frontend',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.test.{ts,tsx}',
    '<rootDir>/src/**/*.spec.{ts,tsx}'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        useESM: true,
        isolatedModules: true,
        diagnostics: false,
        tsconfig: {
          jsx: "react-jsx",
          target: "ES2017",
          module: "ESNext",
          esModuleInterop: true
        }
      }
    ]
  },
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  moduleNameMapper: {
    '\\.(css|scss)$': 'identity-obj-proxy',
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^.+\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/src/__mocks__/fileMock.js'
  },
  setupFilesAfterEnv: [
    './jest.frontend.setup.mjs'
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!**/node_modules/**'
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(@next|next)/)'
  ],
  testTimeout: 15000
}; 