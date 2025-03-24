import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AppUser {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'support' | 'commercial' | 'essay_director' | 'cs';
}

interface AuthContextType {
  appUser: AppUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  appUser: null,
  loading: true,
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Busca a sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchAppUser(session.user);
      } else {
        setLoading(false);
      }
    });

    // Escuta mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchAppUser(session.user);
      } else {
        setAppUser(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function fetchAppUser(authUser: User) {
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error) throw error;

      setAppUser(data);
    } catch (error) {
      console.error('Error fetching app user:', error);
      setAppUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  const value = {
    appUser,
    loading,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 