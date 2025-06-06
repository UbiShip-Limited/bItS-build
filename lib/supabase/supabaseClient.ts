import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Check that environment variables are set
if (!supabaseUrl || !supabaseServiceRoleKey) {
  const errorMessage = 'Supabase environment variables are missing. Please add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to your backend .env file.';
  console.error('🔑❌ ' + errorMessage);
  throw new Error(errorMessage);
} else {
  console.log('🔑✅ Supabase client configured for server-side authentication.');
}

// Create a single Supabase client for use in the application
export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    // This is a server-side client, so we don't need to persist sessions
    // on the client side.
    autoRefreshToken: false,
    persistSession: false,
  },
});

