
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Session, User } from '@supabase/supabase-js';

interface AuthContextProps {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps>({
  user: null,
  session: null,
  isLoading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Initialize React state hooks
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const setData = async () => {
      try {
        console.log('AuthProvider - Fetching session');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setIsLoading(false);
          return;
        }
        
        console.log('AuthProvider - Session data:', session);
        
        if (session?.user) {
          // Log user metadata for debugging
          console.log('AuthProvider - User metadata:', session.user.user_metadata);
          console.log('AuthProvider - Avatar URL:', 
            session.user.user_metadata?.avatar_url || 
            session.user.user_metadata?.picture || 
            'No avatar found');
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      } catch (err) {
        console.error('Unexpected error fetching session:', err);
        setIsLoading(false);
      }
    };
    
    setData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('AuthProvider - Auth state changed:', event, session?.user?.id);
      
      if (session?.user) {
        console.log('AuthProvider - Updated user metadata:', session.user.user_metadata);
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    user,
    session,
    isLoading,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
