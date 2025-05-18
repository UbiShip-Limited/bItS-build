import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Only validate in non-test environments
let supabase;
if (process.env.NODE_ENV === 'test') {
  // Use a dummy client for tests
  supabase = {
    auth: {
      signIn: () => {},
      signOut: () => {},
      onAuthStateChange: () => {},
      getSession: () => ({ data: { session: null }, error: null }),
    },
    from: () => ({ select: () => {} }),
    // Add other methods as needed
  };
} else {
  // Regular validation for non-test environments
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL or Anon Key is missing from environment variables.');
  }
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export { supabase };

