import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import { supabase, isSupabaseConfigured } from '../supabase/supabaseClient';
import { UserRole, UserWithRole } from '../types/auth';

// Test user for controlled test environment only
const TEST_USER: UserWithRole = {
  id: 'test-user-id',
  email: 'test@example.com',
  role: 'artist' as UserRole,
  aud: 'authenticated',
  app_metadata: {},
  user_metadata: {},
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

// Role hierarchy and permissions mapping
const ROLE_HIERARCHY: Record<UserRole, number> = {
  'artist': 1,
  'assistant': 2, 
  'admin': 3,
  'owner': 4  // Owner has highest privileges
};

const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  'artist': 'Artist - Can create payment requests and manage client payments',
  'assistant': 'Assistant - Can help with payment management tasks',
  'admin': 'Administrator - Full access to all payment features',
  'owner': 'Owner - Full system access with all administrative privileges'
};

// Helper function to get user-friendly permission error messages
function getPermissionErrorMessage(userRole: UserRole, requiredRoles: UserRole[]): string {
  const userLevel = ROLE_HIERARCHY[userRole];
  const requiredLevel = Math.min(...requiredRoles.map(role => ROLE_HIERARCHY[role]));
  
  if (userLevel < requiredLevel) {
    return `Your role (${userRole}) does not have sufficient permissions. Required: ${requiredRoles.join(' or ')}.`;
  }
  
  return `Access denied. Your role (${userRole}) is not authorized for this action. Required: ${requiredRoles.join(' or ')}.`;
}

// Helper function to check if user has permission (without throwing errors)
export function hasPermission(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  // Owner has access to everything
  if (userRole === 'owner') return true;
  return allowedRoles.includes(userRole);
}

// Get detailed permission info for a user
export function getUserPermissions(userRole: UserRole) {
  const isOwner = userRole === 'owner';
  return {
    role: userRole,
    description: ROLE_DESCRIPTIONS[userRole],
    level: ROLE_HIERARCHY[userRole],
    canAccess: {
      viewPayments: isOwner || hasPermission(userRole, ['artist', 'assistant', 'admin']),
      createPaymentLinks: isOwner || hasPermission(userRole, ['artist', 'admin']),
      processPayments: isOwner || hasPermission(userRole, ['artist', 'admin']),
      manageAllPayments: isOwner || hasPermission(userRole, ['admin']),
      viewAdminFeatures: isOwner || hasPermission(userRole, ['admin']),
      manageRefunds: isOwner || hasPermission(userRole, ['admin']),
      viewSquareSettings: isOwner || hasPermission(userRole, ['artist', 'assistant', 'admin'])
    }
  };
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  // Only use test mode in actual test environment with explicit flag
  if (process.env.NODE_ENV === 'test' && process.env.BYPASS_AUTH === 'true') {
    request.log.warn('⚠️  Using test authentication bypass - should only be used in tests');
    request.user = TEST_USER;
    return;
  }
  
  // Check if Supabase is configured
  if (!isSupabaseConfigured()) {
    request.log.warn('🔑 Authentication failed: Supabase is not configured');
    return reply.status(503).send({
      error: 'Authentication service unavailable',
      message: 'Database authentication is not configured. Please contact administrator.',
      code: 'AUTH_SERVICE_UNAVAILABLE',
      details: 'The authentication system is not properly configured. Please ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are set.'
    });
  }
  
  const authHeader = request.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    request.log.warn('🔑 Auth failed: No Bearer token in request headers');
    return reply.status(401).send({ 
      error: 'Authentication required',
      message: 'Valid Bearer token is required',
      code: 'MISSING_AUTH_TOKEN',
      details: 'Please log in and include your authentication token in the Authorization header.'
    });
  }
  
  const token = authHeader.split(' ')[1];
  
  // Validate token format (basic check)
  if (!token || token.length < 10) {
    request.log.warn(`🔑 Auth failed: Invalid token format (length: ${token?.length || 0})`);
    return reply.status(401).send({ 
      error: 'Invalid token format',
      message: 'Token appears to be malformed',
      code: 'INVALID_TOKEN_FORMAT',
      details: 'Your authentication token is not in the correct format. Please log in again.'
    });
  }
  
  try {
    // Production debugging for auth issues
    if (process.env.NODE_ENV === 'production') {
      request.log.info('🔑 Production auth attempt:', {
        hasToken: !!token,
        tokenLength: token?.length,
        supabaseUrl: process.env.SUPABASE_URL ? 'configured' : 'missing',
        requestOrigin: request.headers.origin,
        userAgent: request.headers['user-agent']
      });
    }
    
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error || !data.user) {
      request.log.warn(`🔑 Auth failed: Supabase validation failed - ${error?.message || 'No user returned'}`);
      
      // Enhanced error logging for production
      if (process.env.NODE_ENV === 'production') {
        request.log.error('🔑 Production auth failure details:', {
          supabaseError: error?.message,
          errorCode: error?.status,
          hasUser: !!data?.user,
          tokenPreview: token ? `${token.substring(0, 10)}...` : 'none'
        });
      }
      
      return reply.status(401).send({ 
        error: 'Invalid or expired token',
        message: error?.message || 'Authentication failed',
        code: 'AUTH_TOKEN_INVALID',
        details: 'Your authentication token is invalid or has expired. Please log in again.'
      });
    }
    
    request.log.info(`🔑 Supabase auth successful for user: ${data.user.id}`);
    
    // Enhanced database connection handling with retry logic
    let userWithRole;
    const maxRetries = 3;
    let retryCount = 0;
    
    while (retryCount < maxRetries) {
      try {
        // Enhanced database connection test with timeout (increased for production)
        try {
          const connectionTest = request.server.prisma.$queryRaw`SELECT 1 as test`;
          // Increase timeout for production/Railway (15 seconds)
          const timeoutMs = process.env.NODE_ENV === 'production' ? 15000 : 10000;
          const timeout = new Promise((_, reject) => 
            setTimeout(() => reject(new Error(`Database connection timeout after ${timeoutMs}ms`)), timeoutMs)
          );
          
          await Promise.race([connectionTest, timeout]);
          request.log.info('✅ Database connection test passed');
        } catch (connError) {
          request.log.warn('❌ Database connection test failed:', connError);
          
          // Log additional details for production debugging
          if (process.env.NODE_ENV === 'production') {
            request.log.error('🔍 Database connection failure details:', {
              error: connError instanceof Error ? connError.message : connError,
              dbUrl: process.env.DATABASE_URL ? 'configured' : 'missing',
              retry: retryCount + 1,
              maxRetries
            });
          }
          
          // Try to reconnect
          try {
            await request.server.prisma.$connect();
            request.log.info('Database reconnection successful');
          } catch (reconnectError) {
            request.log.error('Database reconnection failed:', reconnectError);
            
            // If this is a critical connection error, fail fast
            if ((reconnectError as any).name === 'PrismaClientInitializationError') {
              throw new Error(`Database unavailable: ${reconnectError.message}`);
            }
          }
        }
        
        // Query user with timeout protection
        const userQuery = request.server.prisma.user.findUnique({
          where: { id: data.user.id },
          select: { role: true, email: true }
        });
        
        // Add timeout for the user query (15 seconds in production)
        const userQueryTimeout = process.env.NODE_ENV === 'production' ? 15000 : 10000;
        const queryTimeout = new Promise<null>((_, reject) => 
          setTimeout(() => reject(new Error(`User query timeout after ${userQueryTimeout}ms`)), userQueryTimeout)
        );
        
        userWithRole = await Promise.race([userQuery, queryTimeout]);
        
        // Log successful user retrieval for production debugging
        if (process.env.NODE_ENV === 'production') {
          request.log.info('✅ User role retrieved successfully:', {
            userId: data.user.id,
            hasRole: !!userWithRole?.role,
            role: userWithRole?.role,
            attempt: retryCount + 1
          });
        }
        
        break; // Success, exit retry loop
        
      } catch (dbError) {
        retryCount++;
        request.log.error(dbError, `Database query failed (attempt ${retryCount}/${maxRetries})`);
        
        // Enhanced error classification
        const isConnectionError = (dbError as any).name === 'PrismaClientInitializationError' || 
                                  (dbError as any).name === 'PrismaClientKnownRequestError' ||
                                  (dbError as Error).message.includes('database server') ||
                                  (dbError as Error).message.includes('connection') ||
                                  (dbError as Error).message.includes('timeout') ||
                                  (dbError as Error).message.includes('pooler.supabase.com');
        
        if (!isConnectionError || retryCount >= maxRetries) {
          request.log.error('Giving up on database connection', { 
            error: dbError,
            retryCount,
            isConnectionError 
          });
          
          // Enhanced error response for production debugging
          const errorResponse: any = {
            error: 'Database service temporarily unavailable',
            message: 'Authentication system cannot connect to database',
            code: 'DATABASE_UNAVAILABLE',
            retryAfter: 30 // seconds
          };
          
          // Add debug info in production (but not sensitive details)
          if (process.env.NODE_ENV === 'production') {
            errorResponse.debugInfo = {
              attemptsMade: retryCount,
              maxRetries,
              isConnectionError,
              timestamp: new Date().toISOString()
            };
          } else {
            errorResponse.details = (dbError as Error).message;
          }
          
          return reply.status(503).send(errorResponse);
        }
        
        // Exponential backoff for retries
        const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 5000);
        request.log.info(`Retrying database connection in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    // If user doesn't exist in local database but exists in Supabase, create them with default role
    if (!userWithRole) {
      request.log.info(`🔑 Creating missing user record for ${data.user.id} (${data.user.email})`);
      
      try {
        userWithRole = await request.server.prisma.user.create({
          data: {
            id: data.user.id,
            email: data.user.email || '',
            role: 'artist' // Default role for auto-created users
          },
          select: { role: true, email: true }
        });
        
        request.log.info(`🔑 Auto-created user record with role: ${userWithRole.role}`);
      } catch (createError) {
        request.log.error(createError, `Failed to auto-create user record for ${data.user.id}`);
        
        // Check if it's a database connection error
        if ((createError as any).name === 'PrismaClientInitializationError') {
          return reply.status(503).send({ 
            error: 'Database service unavailable',
            message: 'Unable to connect to the database. Please try again later.',
            code: 'DATABASE_CONNECTION_FAILED',
            details: 'The authentication system cannot connect to the database. This is likely a temporary issue. Please try again in a few moments or contact support if the problem persists.'
          });
        }
        
        return reply.status(500).send({ 
          error: 'Failed to initialize user account',
          message: 'Please contact an administrator',
          code: 'USER_CREATION_FAILED',
          details: 'There was an error setting up your user account. Please contact support.'
        });
      }
    }
    
    request.log.info(`🔑 Auth complete: User ${data.user.id} with role ${userWithRole.role}`);
    
    // Attach the user to the request for use in route handlers
    request.user = {
      ...data.user,
      role: userWithRole.role as UserRole
    };
  } catch (err) {
    request.log.error(err, 'Authentication error');
    
    // Enhanced error handling for different types of database errors
    if ((err as any).name === 'PrismaClientInitializationError') {
      return reply.status(503).send({ 
        error: 'Database service unavailable',
        message: 'Unable to connect to the database. Please try again later.',
        code: 'DATABASE_CONNECTION_FAILED',
        details: 'The authentication system cannot connect to the database. This is likely a temporary issue. Please try again in a few moments or contact support if the problem persists.'
      });
    }
    
    if ((err as any).name === 'PrismaClientKnownRequestError' || (err as any).name === 'PrismaClientUnknownRequestError') {
      return reply.status(503).send({ 
        error: 'Database query failed',
        message: 'There was an issue with the database query. Please try again.',
        code: 'DATABASE_QUERY_FAILED',
        details: 'The authentication system encountered a database error. Please try again or contact support if the problem persists.'
      });
    }
    
    return reply.status(500).send({ 
      error: 'Authentication failed',
      message: 'An internal server error occurred during authentication',
      code: 'AUTH_SYSTEM_ERROR',
      details: 'There was a problem with the authentication system. Please try again or contact support.'
    });
  }
}

// Enhanced role-based access control middleware
export function authorize(allowedRoles: UserRole[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    // Only use test mode in actual test environment with explicit flag
    if (process.env.NODE_ENV === 'test' && process.env.BYPASS_AUTH === 'true') {
      request.log.warn('⚠️  Using test authorization bypass - should only be used in tests');
      return;
    }

    if (!request.user) {
      return reply.status(401).send({ 
        error: 'Authentication required',
        message: 'You must be logged in to access this resource',
        code: 'AUTHENTICATION_REQUIRED',
        details: 'This endpoint requires authentication. Please log in first.'
      });
    }
    
    try {
      // Owner role has access to everything
      const userRole = request.user.role as UserRole;
      if (userRole === 'owner') {
        request.log.info(`Owner access granted for user ${request.user.id}`);
        return; // Owner has full access
      }

      if (!request.user.role || !allowedRoles.includes(request.user.role)) {
        const errorMessage = getPermissionErrorMessage(request.user.role as UserRole, allowedRoles);
        const userPermissions = getUserPermissions(request.user.role as UserRole);
        
        request.log.warn(`Access denied for user ${request.user.id} with role ${request.user.role}. Required: ${allowedRoles.join(' or ')}`);
        
        return reply.status(403).send({ 
          error: 'Insufficient permissions',
          message: errorMessage,
          code: 'INSUFFICIENT_PERMISSIONS',
          details: {
            yourRole: request.user.role,
            yourPermissions: userPermissions,
            requiredRoles: allowedRoles,
            suggestions: getSuggestions(request.user.role as UserRole, allowedRoles)
          }
        });
      }
    } catch (err) {
      request.log.error(err, 'Authorization error');
      return reply.status(500).send({ 
        error: 'Authorization failed',
        message: 'An internal server error occurred during authorization',
        code: 'AUTHORIZATION_SYSTEM_ERROR',
        details: 'There was a problem checking your permissions. Please try again or contact support.'
      });
    }
  };
}

// Helper function to provide suggestions based on role mismatch
function getSuggestions(userRole: UserRole, requiredRoles: UserRole[]): string[] {
  const suggestions: string[] = [];
  
  if (userRole === 'artist' && requiredRoles.includes('admin')) {
    suggestions.push('This is an admin-only feature. Contact your administrator for access.');
  }
  
  if (userRole === 'assistant' && requiredRoles.includes('admin')) {
    suggestions.push('This is an admin-only feature. Contact your administrator for access.');
  }
  
  if (suggestions.length === 0) {
    suggestions.push('Contact your administrator if you believe you should have access to this feature.');
  }
  
  return suggestions;
}

// Mock authentication for test environment only
export function mockAuthenticate(userId: string = 'test-user-id', role: UserRole = 'artist') {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return (request: FastifyRequest, _reply: FastifyReply) => {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('Mock authentication can only be used in test environment');
    }
    
    request.user = {
      ...TEST_USER,
      id: userId,
      role
    };
  };
}

// Utility hook to apply authentication to all routes in a plugin
export function requireAuth(instance: FastifyInstance, options: Record<string, unknown>, done: () => void) {
  instance.addHook('preHandler', authenticate);
  done();
}
