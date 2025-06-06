'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { SupabaseClient, User, Session } from '@supabase/supabase-js';
import { UserRole, UserWithRole } from '../../lib/types/auth';
import { getAuthHeaders, clearAuthCache } from '../lib/api/apiClient';

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [supabase] = useState<SupabaseClient>(() => 
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  );
  const [user, setUser] = useState<UserWithRole | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      console.log('🔄 Initializing auth...');
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Error getting session during init:', error);
          setLoading(false);
          return;
        }
        
        if (session) {
          console.log('✅ Valid session found during init:', {
            userId: session.user.id,
            email: session.user.email,
            expiresAt: new Date(session.expires_at! * 1000).toISOString()
          });
          setSession(session);
          
          // Set user immediately with session data to prevent auth loops
          console.log('✅ Setting user immediately to prevent auth loops');
          setUser({ ...session.user, role: 'artist' as UserRole }); // Default role
          
          // Try to get user role from backend (but don't block auth on this)
          try {
            console.log('👤 Fetching user role from backend...');
            const headers = await getAuthHeaders();
            const userResponse = await fetch('http://localhost:3001/users/me', {
              headers
            });
            
            if (userResponse.ok) {
              const userData = await userResponse.json();
              console.log('✅ User role fetched, updating:', userData.user.role);
              setUser(prev => prev ? { ...prev, role: userData.user.role } : null);
            } else {
              console.warn('⚠️ Failed to fetch user role, keeping default');
            }
          } catch (err) {
            console.error('❌ Error fetching user data:', err);
            console.warn('⚠️ Continuing with default role');
          }
        }
        
        setLoading(false);
        
        // Subscribe to auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('🔄 Auth state change detected:', {
              event,
              hasSession: !!session,
              userId: session?.user?.id,
              timestamp: new Date().toISOString()
            });
            
            setSession(session);
            
            if (session) {
              // Set user immediately to prevent auth loops
              console.log('✅ Auth state changed, setting user with session:', {
                userId: session.user.id,
                email: session.user.email,
                expiresAt: new Date(session.expires_at! * 1000).toISOString()
              });
              setUser({ ...session.user, role: 'artist' as UserRole }); // Default role
              
              // Try to get user role from backend (but don't block auth on this)
              try {
                console.log('👤 Fetching updated user role from backend...');
                const headers = await getAuthHeaders();
                const userResponse = await fetch('http://localhost:3001/users/me', {
                  headers
                });
                
                if (userResponse.ok) {
                  const userData = await userResponse.json();
                  console.log('✅ User role updated:', userData.user.role);
                  setUser(prev => prev ? { ...prev, role: userData.user.role } : null);
                              } else {
                console.warn('⚠️ Failed to fetch user role on auth change');
              }
            } catch (err) {
              console.error('❌ Error fetching user data on auth change:', err);
              console.warn('⚠️ Continuing with default role');
            }
          } else {
            console.log('🚪 Session ended or null, clearing user. Event:', event);
            setUser(null);
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
    console.log('🔑 Attempting sign in for:', email);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('❌ Sign in failed:', error.message);
        return { success: false, error: error.message };
      }
      
      console.log('✅ Sign in successful, session should be created:', {
        userId: data.user?.id,
        hasSession: !!data.session
      });
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Login failed' };
    }
  };
  
  // Sign up function
  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      // New users might require confirmation depending on Supabase config
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Sign up failed' };
    }
  };
  
  // Sign out function
  const signOut = async () => {
    console.log('🚪 SignOut called - clearing session and user');
    console.trace('SignOut call stack:'); // This will show us what called signOut
    try {
      await supabase.auth.signOut();
      clearAuthCache(); // Clear the auth token cache
    } catch (error) {
      console.error('Logout error:', error);
      // Ignore logout errors - user is already being logged out
    } finally {
      setUser(null);
      setSession(null);
      setLoading(false);
      clearAuthCache(); // Clear cache in all cases
      console.log('✅ SignOut complete - user and session cleared');
    }
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