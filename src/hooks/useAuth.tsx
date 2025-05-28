'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';

// Types for our auth context
export type UserRole = 'customer' | 'artist' | 'admin';

export interface UserWithRole extends User {
  role?: UserRole;
}

interface AuthContextType {
  user: UserWithRole | null;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<{
    success: boolean;
    error?: string;
  }>;
  signUp: (email: string, password: string) => Promise<{
    success: boolean;
    error?: string;
  }>;
  signOut: () => Promise<void>;
  loading: boolean;
  isAuthenticated: boolean;
  hasRole: (roles: UserRole[]) => boolean;
}

// Default context value
const defaultAuthContext: AuthContextType = {
  user: null,
  session: null,
  signIn: async () => ({ success: false }),
  signUp: async () => ({ success: false }),
  signOut: async () => {},
  loading: true,
  isAuthenticated: false,
  hasRole: () => false,
};

// Create the auth context
const AuthContext = createContext<AuthContextType>(defaultAuthContext);

// URL and key should come from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [supabase] = useState<SupabaseClient>(() => 
    createClient(supabaseUrl, supabaseAnonKey)
  );
  const [user, setUser] = useState<UserWithRole | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setLoading(false);
          return;
        }
        
        if (session) {
          setSession(session);
          
          // Get user with role information from our backend
          try {
            const userResponse = await fetch('/api/me', {
              headers: {
                Authorization: `Bearer ${session.access_token}`
              }
            });
            
            if (userResponse.ok) {
              const userData = await userResponse.json();
              setUser({ ...session.user, role: userData.role });
            } else {
              setUser(session.user as UserWithRole);
            }
          } catch (err) {
            console.error('Error fetching user data:', err);
            setUser(session.user as UserWithRole);
          }
        }
        
        setLoading(false);
        
        // Subscribe to auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (_event, session) => {
            setSession(session);
            setUser(session?.user as UserWithRole || null);
            
            // Also update token in localStorage for the API client
            if (session?.access_token) {
              localStorage.setItem('auth_token', session.access_token);
            } else {
              localStorage.removeItem('auth_token');
            }
          }
        );
        
        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Error initializing auth:', error);
        setLoading(false);
      }
    };
    
    initializeAuth();
  }, [supabase]);
  
  // Sign in function
  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      // Store token for API requests
      if (data.session) {
        localStorage.setItem('auth_token', data.session.access_token);
      }
      
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };
  
  // Sign up function
  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      // New users might require confirmation depending on Supabase config
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };
  
  // Sign out function
  const signOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('auth_token');
  };
  
  // Check if user has one of the specified roles
  const hasRole = (roles: UserRole[]) => {
    if (!user || !user.role) return false;
    return roles.includes(user.role);
  };
  
  const value = {
    user,
    session,
    signIn,
    signUp,
    signOut,
    loading,
    isAuthenticated: !!user,
    hasRole,
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

export default useAuth; 