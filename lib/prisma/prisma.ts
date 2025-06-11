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
  if (isProduction) {
    // Ensure connection pooling and timeout settings for production
    config.datasources = {
      db: {
        url: process.env.DATABASE_URL
      }
    };
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
      
      // Test basic connectivity
      await client.$executeRaw`SELECT 1 as connection_test`;
      
      console.log('✅ Database connection successful');
      return true;
    } catch (error) {
      retries++;
      console.error(`❌ Database connection failed (attempt ${retries}/${maxRetries}):`, error.message);
      
      if (retries >= maxRetries) {
        console.error('🔴 Max database connection retries exceeded');
        throw new Error(`Database connection failed after ${maxRetries} attempts: ${error.message}`);
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
