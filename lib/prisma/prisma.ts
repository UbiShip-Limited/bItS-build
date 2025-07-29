import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Enhanced logging for production debugging
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// Configuration for different environments
const getPrismaConfig = () => {
  const config: ConstructorParameters<typeof PrismaClient>[0] = {
    // Enable query logging in development, error logging in production
    log: isDevelopment 
      ? ['query', 'info', 'warn', 'error'] 
      : ['error', 'warn'],
    
    // Enhanced error formatting
    errorFormat: 'pretty',
  };

  // Add datasources configuration for production
  if (isProduction || process.env.DATABASE_URL?.includes('supabase')) {
    try {
      // Ensure connection pooling and timeout settings for production
      const databaseUrl = new URL(process.env.DATABASE_URL || '');
      
      // Add connection pool and timeout parameters for Supabase
      databaseUrl.searchParams.set('connection_limit', '25'); // Increased for Supabase
      databaseUrl.searchParams.set('pool_timeout', '20'); // Increased timeout
      databaseUrl.searchParams.set('connect_timeout', '30'); // Increased connection timeout
      databaseUrl.searchParams.set('statement_timeout', '30000'); // 30 seconds
      databaseUrl.searchParams.set('idle_in_transaction_session_timeout', '30000');
      
      // For Supabase pooler, ensure proper SSL mode
      if (databaseUrl.hostname.includes('pooler.supabase.com')) {
        databaseUrl.searchParams.set('sslmode', 'require');
        databaseUrl.searchParams.set('pgbouncer', 'true');
      }
      
      config.datasources = {
        db: {
          url: databaseUrl.toString()
        }
      };
    } catch (error) {
      console.error('❌ Failed to parse DATABASE_URL:', error);
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
