import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

type UserRole = 'user' | 'judge' | 'admin' | null;

interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, email: string, password: string, role: UserRole) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  role: UserRole;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserData = useCallback(async (supabaseUser: SupabaseUser): Promise<User | null> => {
    try {
      // Fetch user role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', supabaseUser.id)
        .single();

      // Fetch user profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('name, avatar')
        .eq('id', supabaseUser.id)
        .single();

      const role = (roleData?.role as UserRole) || 'user';
      const name = profileData?.name || supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'User';
      
      // Check if user logged in with Google (has provider in app_metadata)
      const isGoogleLogin = supabaseUser.app_metadata?.provider === 'google';
      
      // If Google login, use Google profile picture, otherwise use first letter of name
      let avatar: string;
      if (isGoogleLogin) {
        // Use Google avatar if available (from profile, metadata, or user_metadata)
        avatar = profileData?.avatar || supabaseUser.user_metadata?.avatar_url || supabaseUser.user_metadata?.picture || '';
      } else {
        // For email/password login (including old users), always use empty string
        // This ensures AvatarFallback will show the first letter of the user's name
        // We ignore any stored avatar in the database for email/password users
        
        // Clean up: Clear any stored avatar for email/password users (one-time cleanup for old users)
        if (profileData?.avatar) {
          // Update profile to clear avatar field (fire and forget, don't wait)
          // Silently cleanup invalid avatar URL
          supabase
            .from('profiles')
            .update({ avatar: null })
            .eq('id', supabaseUser.id)
            .then(() => { /* cleanup done */ });
        }
        
        avatar = '';
      }

      return {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        role,
        name,
        avatar,
      };
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener FIRST (before checking session)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        if (!mounted) return;
        
        // Update session synchronously
        setSession(newSession);
        
        if (event === 'SIGNED_OUT' || !newSession?.user) {
          setUser(null);
          setIsLoading(false);
          return;
        }

        if (newSession?.user) {
          // Defer async operations to avoid deadlock
          setTimeout(async () => {
            if (!mounted) return;
            const userData = await fetchUserData(newSession.user);
            if (mounted) {
              setUser(userData);
              setIsLoading(false);
            }
          }, 0);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      if (!mounted) return;
      
      if (existingSession?.user) {
        setSession(existingSession);
        fetchUserData(existingSession.user).then((userData) => {
          if (mounted) {
            setUser(userData);
            setIsLoading(false);
          }
        });
      } else {
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserData]);

  const login = useCallback(async (email: string, password: string, expectedRole: UserRole): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.user) {
        console.error('Login error:', error);
        return { success: false, error: 'Invalid email or password' };
      }

      // Fetch the user's actual role from the database
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id)
        .single();

      if (roleError || !roleData) {
        // User has no role assigned - sign out
        await supabase.auth.signOut();
        return { success: false, error: 'No role assigned to this account' };
      }

      const actualRole = roleData.role as UserRole;

      // Verify user has the expected role for this portal
      if (expectedRole !== 'user' && actualRole !== expectedRole) {
        await supabase.auth.signOut();
        return { success: false, error: `This account does not have ${expectedRole} access. Your role is: ${actualRole}` };
      }

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }, []);

  const signup = useCallback(async (
    name: string,
    email: string,
    password: string,
    role: UserRole
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role,
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (!data.user) {
        return { success: false, error: 'Signup failed' };
      }

      // Assign role to user
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: data.user.id,
          role: role || 'user',
        });

      if (roleError) {
        console.error('Error assigning role:', roleError);
      }

      return { success: true };
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user && !!session,
        isLoading,
        login,
        signup,
        logout,
        role: user?.role || null,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
