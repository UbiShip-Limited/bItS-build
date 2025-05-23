// @ts-check
/**
 * ESM-compatible Jest configuration
 * 
 * 
 * @type {import('ts-jest').JestConfigWithTsJest}
 */
export default {
  // Use projects configuration to run both backend and frontend tests
  projects: ['./jest.backend.config.mjs', './jest.frontend.config.mjs'],
  
  // Global settings
  clearMocks: true,
  verbose: true,
  
  // Coverage configuration for all projects
  collectCoverage: process.env.COVERAGE === 'true',
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
}; 