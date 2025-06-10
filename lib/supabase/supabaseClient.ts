import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment variables (backend server-side variables)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Check if Supabase is configured
export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseServiceRoleKey);
}

// Create Supabase client with graceful error handling
let _supabaseClient: ReturnType<typeof createClient> | null = null;

export function initializeSupabaseClient() {
  if (_supabaseClient) {
    return _supabaseClient;
  }

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.warn('🔑⚠️  Supabase environment variables are missing:');
    if (!supabaseUrl) console.warn('   - SUPABASE_URL is not set');
    if (!supabaseServiceRoleKey) console.warn('   - SUPABASE_SERVICE_ROLE_KEY is not set');
    console.warn('   Database and authentication features will be disabled until Supabase is properly configured');
    console.warn('   For Railway deployment, set these as environment variables in your Railway dashboard');
    return null;
  }

  console.log('🔑✅ Supabase client configured for server-side authentication.');
  
  _supabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      // This is a server-side client, so we don't need to persist sessions
      // on the client side.
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return _supabaseClient;
}

// Export a function to get the Supabase client (throws if not configured)
export function getSupabaseClient() {
  const client = initializeSupabaseClient();
  if (!client) {
    throw new Error('Supabase is not configured. Please add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
  }
  return client;
}

// Create a safe default export that won't crash on import
// Initialize the client immediately and handle errors gracefully
const supabaseClient = initializeSupabaseClient();

// Export the client, but if it's null, create a mock that throws helpful errors
export const supabase = supabaseClient || {
  auth: {
    getUser: () => {
      throw new Error('Supabase is not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
    }
  },
  from: () => {
    throw new Error('Supabase is not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
  }
} as any;

