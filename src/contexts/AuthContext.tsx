import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { signUpSchema, signInSchema, profileSchema, validateOrThrow } from '@/lib/validation';

export type UserRole = 'guest' | 'user' | 'admin' | 'moderator';
export type VerificationStatus = 'none' | 'pending' | 'verified' | 'rejected';

interface Profile {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  gotra?: string;
  father_name?: string;
  native_village?: string;
  reference_person?: string;
  reference_mobile?: string;
  verification_status: VerificationStatus;
  rejection_reason?: string;
  avatar_url?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  isVerified: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  signUp: (email: string, password: string, name: string, mobile: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  submitVerification: (data: Partial<Profile>) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
      return data as Profile;
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      return null;
    }
  };

  const checkAdminRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();

      if (error) {
        console.error('Error checking admin role:', error);
        return false;
      }
      return !!data;
    } catch (error) {
      console.error('Error in checkAdminRole:', error);
      return false;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const fetchedProfile = await fetchProfile(user.id);
      setProfile(fetchedProfile);
      const adminStatus = await checkAdminRole(user.id);
      setIsAdmin(adminStatus);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer profile fetch to avoid deadlock
        if (session?.user) {
          setTimeout(async () => {
            const fetchedProfile = await fetchProfile(session.user.id);
            setProfile(fetchedProfile);
            const adminStatus = await checkAdminRole(session.user.id);
            setIsAdmin(adminStatus);
            setIsLoading(false);
          }, 0);
        } else {
          setProfile(null);
          setIsAdmin(false);
          setIsLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        const fetchedProfile = await fetchProfile(session.user.id);
        setProfile(fetchedProfile);
        const adminStatus = await checkAdminRole(session.user.id);
        setIsAdmin(adminStatus);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, name: string, mobile: string) => {
    try {
      // Validate input - throws on validation failure
      const validated = validateOrThrow(signUpSchema, { email, password, name, mobile });
      
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email: validated.email,
        password: validated.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: validated.name,
            mobile: validated.mobile,
          }
        }
      });
      
      if (error) return { error };
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // Validate input - throws on validation failure
      const validated = validateOrThrow(signInSchema, { email, password });
      
      const { error } = await supabase.auth.signInWithPassword({
        email: validated.email,
        password: validated.password,
      });
      
      if (error) return { error };
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setIsAdmin(false);
  };

  const submitVerification = async (data: Partial<Profile>) => {
    if (!user) return { error: new Error('Not authenticated') };
    
    try {
      // Validate profile data - throws on validation failure
      const validated = validateOrThrow(profileSchema, {
        name: data.name || profile?.name || '',
        mobile: data.mobile || profile?.mobile || '',
        email: data.email,
        gotra: data.gotra,
        father_name: data.father_name,
        native_village: data.native_village,
        reference_person: data.reference_person,
        reference_mobile: data.reference_mobile,
      });
      
      const { error } = await supabase
        .from('profiles')
        .update({
          ...validated,
          verification_status: 'pending',
          rejection_reason: null,
        })
        .eq('id', user.id);

      if (error) return { error };
      
      await refreshProfile();
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isAuthenticated: !!user,
        isVerified: profile?.verification_status === 'verified',
        isAdmin,
        isLoading,
        signUp,
        signIn,
        signOut,
        submitVerification,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
