import * as dotenv from 'dotenv';
import path from 'path';

/**
 * Loads environment variables from the .env file in the project root.
 * This should be the very first import in the application's entry point.
 * 
 * For Railway deployment, environment variables are typically set via Railway's dashboard,
 * but this loader supports local .env files for development.
 */
function loadEnvironment() {
  // Try multiple possible .env file locations
  const possiblePaths = [
    // Project root (standard location)
    path.resolve(process.cwd(), '.env'),
    // Relative to compiled dist directory
    path.resolve(__dirname, '..', '..', '.env'),
    // Fallback: relative to lib directory
    path.resolve(__dirname, '..', '.env')
  ];

  let envLoaded = false;
  let loadedFrom = '';

  for (const envPath of possiblePaths) {
    const result = dotenv.config({ path: envPath });
    
    if (!result.error) {
      console.log(`✅ Environment variables loaded from ${envPath}`);
      envLoaded = true;
      loadedFrom = envPath;
      break;
    }
  }

  if (!envLoaded) {
    console.warn(`⚠️  Could not find a .env file in any of these locations:`);
    possiblePaths.forEach(p => console.warn(`   - ${p}`));
    console.warn('   This is normal for production deployments (Railway, Heroku, etc.) where environment');
    console.warn('   variables are set via the platform. Continuing without loading from .env file...');
  }

  // Log environment check for debugging
  if (process.env.NODE_ENV !== 'production') {
    console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔧 Working directory: ${process.cwd()}`);
    if (loadedFrom) {
      console.log(`🔧 Loaded .env from: ${loadedFrom}`);
    }
  }
}

loadEnvironment(); 