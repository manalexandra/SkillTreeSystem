import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../services/supabase';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  error: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  error: null,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Try to restore user from sessionStorage
  const storedUser = typeof window !== 'undefined' ? sessionStorage.getItem('user') : null;
  const [user, setUser] = useState<User | null>(storedUser ? JSON.parse(storedUser) : null);
  const [error, setError] = useState<string | null>(null);

  // Persist user to sessionStorage whenever it changes
  useEffect(() => {
    if (user) {
      sessionStorage.setItem('user', JSON.stringify(user));
    } else {
      sessionStorage.removeItem('user');
    }
  }, [user]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Use Supabase session directly
        const { data } = await supabase.auth.getSession();
        if (data?.session?.user) {
          const user = {
            id: data.session.user.id,
            email: data.session.user.email || '',
            role: (data.session.user.user_metadata?.role as 'manager' | 'user') || 'user',
          };
          setUser(user);
        } else {
          setUser(null);
        }
      } catch (err) {
        setError('Failed to fetch user');
        console.error(err);
      }
    };

    fetchUser();

    // Set up auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
          const user = {
            id: session.user.id,
            email: session.user.email || '',
            role: (session.user.user_metadata?.role as 'manager' | 'user') || 'user',
          };
          setUser(user);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, error }}>
      {children}
    </AuthContext.Provider>
  );
};