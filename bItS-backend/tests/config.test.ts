import path from 'path';
import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import type { SpyInstance } from 'jest-mock';


// Helper to set environment variables for a test
const setEnvVars = (vars: Record<string, string | undefined>) => {
  for (const key in vars) {
    if (vars[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = vars[key];
    }
  }
};

describe('Configuration Loading (src/config/index.ts)', () => {
  let originalEnv: NodeJS.ProcessEnv;
  let consoleErrorSpy: SpyInstance;

  beforeEach(() => {
    // Save original environment variables
    originalEnv = { ...process.env };
    // Suppress console.error for expected envalid errors during tests
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    // Reset modules to ensure config is re-evaluated with new env vars for each test
    jest.resetModules();
  });

  afterEach(() => {
    // Restore original environment variables
    process.env = originalEnv;
    consoleErrorSpy.mockRestore();
  });

  it('should load variables from .env.test when NODE_ENV is test', () => {

  
    // Add any other required environment variables for testing
    setEnvVars({
      DATABASE_URL: 'postgresql://test_user:test_password@localhost:5432/test_db',
      SUPABASE_URL: 'https://test.supabase.co',
      SUPABASE_ANON_KEY: 'test_anon_key',
      SUPABASE_SERVICE_ROLE_KEY: 'test_service_key',
      CLOUDINARY_CLOUD_NAME: 'test_cloud',
      CLOUDINARY_API_KEY: 'test_key',
      CLOUDINARY_API_SECRET: 'test_secret',
      SQUARE_APPLICATION_ID: 'test_app_id',
      SQUARE_ACCESS_TOKEN: 'test_token',
      SQUARE_LOCATION_ID: 'test_loc_id'
    });
    
    const config = require('../src/config').default;

    expect(config.NODE_ENV).toBe('test');
    expect(config.PORT).toBe(3002); // Value from .env.test
    expect(config.LOG_LEVEL).toBe('silent'); // Value from .env.test
    expect(config.DATABASE_URL).toBe('postgresql://test_user:test_password@localhost:5432/test_db');
    expect(config.SUPABASE_URL).toBe('https://test.supabase.co');
    // ... add more checks for other vars from .env.test
  });

  it('should use default values if optional variables are not set', () => {
    setEnvVars({
      // Required vars
      DATABASE_URL: 'postgresql://required:secret@host:5432/db',
      SUPABASE_URL: 'https://required.supabase.co',
      SUPABASE_ANON_KEY: 'required_anon',
      SUPABASE_SERVICE_ROLE_KEY: 'required_service',
      CLOUDINARY_CLOUD_NAME: 'required_cloud',
      CLOUDINARY_API_KEY: 'required_key',
      CLOUDINARY_API_SECRET: 'required_secret',
      SQUARE_APPLICATION_ID: 'required_app_id',
      SQUARE_ACCESS_TOKEN: 'required_token',
      SQUARE_LOCATION_ID: 'required_loc_id',
      // Optional vars that have defaults are not set here
      NODE_ENV: undefined, // Will default to 'development'
      PORT: undefined, // Will default
      HOST: undefined, // Will default
      LOG_LEVEL: undefined, // Will default
      SQUARE_ENVIRONMENT: undefined, // Will default
      CORS_ORIGIN: undefined, // Will default
    });

    const config = require('../src/config').default;
    expect(config.NODE_ENV).toBe('development'); // Default
    expect(config.PORT).toBe(3001); // Default
    expect(config.HOST).toBe('0.0.0.0'); // Default
    expect(config.LOG_LEVEL).toBe('info'); // Default
    expect(config.SQUARE_ENVIRONMENT).toBe('sandbox'); // Default
    expect(config.CORS_ORIGIN).toBe('http://localhost:3000'); // Default
  });

  it('should throw an error if a required variable is missing', () => {
    setEnvVars({
      // Missing DATABASE_URL which is required
      SUPABASE_URL: 'https://required.supabase.co',
      SUPABASE_ANON_KEY: 'required_anon',
      // ... other required vars ...
    });
    expect(() => {
      require('../src/config').default;
    }).toThrow(); // envalid should throw
  });

   it('should throw an error for invalid variable format (e.g., bad PORT)', () => {
    setEnvVars({
      PORT: 'not-a-port',
      // Add all other required vars to avoid throwing for missing vars
      DATABASE_URL: 'postgresql://required:secret@host:5432/db',
      SUPABASE_URL: 'https://required.supabase.co',
      SUPABASE_ANON_KEY: 'required_anon',
      SUPABASE_SERVICE_ROLE_KEY: 'required_service',
      CLOUDINARY_CLOUD_NAME: 'required_cloud',
      CLOUDINARY_API_KEY: 'required_key',
      CLOUDINARY_API_SECRET: 'required_secret',
      SQUARE_APPLICATION_ID: 'required_app_id',
      SQUARE_ACCESS_TOKEN: 'required_token',
      SQUARE_LOCATION_ID: 'required_loc_id',
    });
    expect(() => {
      require('../src/config').default;
    }).toThrow(); // envalid should throw for invalid port
  });
});
