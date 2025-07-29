import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Enhanced logging for production debugging
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// Validate DATABASE_URL early
const validateDatabaseUrl = () => {
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    const errorMsg = 'DATABASE_URL environment variable is not set';
    console.error('❌', errorMsg);
    if (isProduction) {
      throw new Error(errorMsg);
    }
    return false;
  }

  // Debug: Show the DATABASE_URL format (safely masked)
  console.log('🔍 DATABASE_URL format check:');
  console.log('   Length:', dbUrl.length);
  console.log('   Starts with:', dbUrl.substring(0, 15) + '...');
  console.log('   Contains ://:', dbUrl.includes('://'));
  console.log('   Contains @:', dbUrl.includes('@'));
  
  try {
    const url = new URL(dbUrl);
    console.log('✅ DATABASE_URL validation passed');
    console.log('   Host:', url.hostname);
    console.log('   Port:', url.port || '5432');
    console.log('   Database:', url.pathname.slice(1));
    
    // Check for Supabase-specific requirements
    if (url.hostname.includes('supabase.com')) {
      console.log('🔧 Supabase database detected');
      
      // Ensure required parameters for Supabase
      if (!url.searchParams.get('sslmode')) {
        console.warn('⚠️  SSL mode not specified for Supabase connection');
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ DATABASE_URL parsing failed!');
    console.error('   Error:', error.message);
    console.error('   DATABASE_URL preview:', dbUrl.substring(0, 30) + '...[MASKED]');
    console.error('   Expected format: postgresql://user:password@host:port/database');
    
    const errorMsg = `Invalid DATABASE_URL format: ${error.message}`;
    console.error('❌', errorMsg);
    if (isProduction) {
      throw new Error(errorMsg);
    }
    return false;
  }
};

// Configuration for different environments
const getPrismaConfig = () => {
  // Validate DATABASE_URL first
  validateDatabaseUrl();
  
  const config: ConstructorParameters<typeof PrismaClient>[0] = {
    // Enable query logging in development, error logging in production
    log: isDevelopment 
      ? ['query', 'info', 'warn', 'error'] 
      : ['error', 'warn'],
    
    // Enhanced error formatting
    errorFormat: 'pretty',
  };

  // Add datasources configuration for production or Supabase
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl && (isProduction || dbUrl.includes('supabase'))) {
    try {
      // Ensure connection pooling and timeout settings for production
      const databaseUrl = new URL(dbUrl);
      
      // Add connection pool and timeout parameters for Supabase
      databaseUrl.searchParams.set('connection_limit', '10'); // Reduced for Railway
      databaseUrl.searchParams.set('pool_timeout', '20');
      databaseUrl.searchParams.set('connect_timeout', '60'); // Increased for Railway
      databaseUrl.searchParams.set('statement_timeout', '60000'); // 60 seconds
      databaseUrl.searchParams.set('idle_in_transaction_session_timeout', '60000');
      
      // For Supabase pooler, ensure proper SSL mode
      if (databaseUrl.hostname.includes('pooler.supabase.com')) {
        databaseUrl.searchParams.set('sslmode', 'require');
        databaseUrl.searchParams.set('pgbouncer', 'true');
        console.log('🔧 Supabase pooler configuration applied');
      }
      
      const finalUrl = databaseUrl.toString();
      console.log('🔧 Database URL configured with connection parameters');
      
      config.datasources = {
        db: {
          url: finalUrl
        }
      };
    } catch (error) {
      console.error('❌ Failed to configure DATABASE_URL:', error);
      throw error;
    }
  }

  return config;
};

// Create Prisma client with enhanced configuration
const createPrismaClient = () => {
  console.log('🔄 Initializing Prisma client...');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    if (isProduction) {
      throw new Error('DATABASE_URL is required in production');
    }
  }

  try {
    const client = new PrismaClient(getPrismaConfig());
    
    // Note: Event listeners removed due to TypeScript compatibility issues
    // The logging is already configured via the 'log' option above
    
    console.log('✅ Prisma client initialized successfully');
    return client;
  } catch (error) {
    console.error('❌ Failed to initialize Prisma client:', error);
    throw error;
  }
};

// Connection health check with retry logic
export const checkDatabaseConnection = async (client: PrismaClient, maxRetries = 3) => {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      console.log(`🔄 Testing database connection (attempt ${retries + 1}/${maxRetries})...`);
      
      // Test basic connectivity with timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 5000)
      );
      
      const queryPromise = client.$executeRaw`SELECT 1 as connection_test`;
      
      await Promise.race([queryPromise, timeoutPromise]);
      
      console.log('✅ Database connection successful');
      return true;
    } catch (error: any) {
      retries++;
      const errorMessage = error.message || 'Unknown error';
      console.error(`❌ Database connection failed (attempt ${retries}/${maxRetries}):`, errorMessage);
      
      // Log specific error types
      if (errorMessage.includes('P1001')) {
        console.error('🔴 Cannot reach database server - check network connectivity');
      } else if (errorMessage.includes('P1002')) {
        console.error('🔴 Database server timeout - server may be overloaded');
      } else if (errorMessage.includes('P1003')) {
        console.error('🔴 Database does not exist at specified location');
      }
      
      if (retries >= maxRetries) {
        console.error('🔴 Max database connection retries exceeded');
        throw new Error(`Database connection failed after ${maxRetries} attempts: ${errorMessage}`);
      }
      
      // Wait before retrying (exponential backoff)
      const delay = Math.pow(2, retries) * 1000;
      console.log(`⏳ Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return false;
};

// Graceful connection management
export const connectDatabase = async (client: PrismaClient) => {
  try {
    console.log('🔄 Connecting to database...');
    await client.$connect();
    
    // Verify connection with health check
    await checkDatabaseConnection(client);
    
    console.log('✅ Database connected and verified');
    return client;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
};

// For tests, Jest will automatically use the mocked version
// from the moduleNameMapper defined in jest.config.mjs
export const prisma =
  global.prisma ||
  createPrismaClient();

// Only store in global in dev mode for hot reloading without connections
if (isDevelopment) {
  global.prisma = prisma;
}

// Initialize connection in production
if (isProduction) {
  // Don't await here to avoid blocking module loading
  connectDatabase(prisma).catch((error) => {
    console.error('🔴 Failed to establish initial database connection:', error);
    // Don't exit process here - let the health checks handle it
  });
}
