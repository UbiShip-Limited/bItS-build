import * as dotenv from 'dotenv';
import path from 'path';

/**
 * Loads environment variables from the .env file located within the `lib` directory.
 * This should be the very first import in the application's entry point.
 */
function loadEnvironment() {
  // Since this file is in lib/config, we go up two levels to get to the `lib` root.
  const libDir = path.dirname(__dirname);
  const envPath = path.resolve(libDir, '..', '.env');
  
  const result = dotenv.config({ path: envPath });

  if (result.error) {
    console.warn(`⚠️  Could not find a .env file at ${envPath}.`);
    console.warn('   Please ensure a .env file exists in the /lib directory.');
    console.warn('   Continuing without loading from .env file...');
  } else {
    console.log(`✅ Environment variables loaded from ${envPath}`);
  }
}

loadEnvironment(); 