import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AppUser {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'support' | 'commercial';
}

interface AuthContextType {
  user: User | null;
  appUser: AppUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('AuthProvider: Inicializando...');
    
    // Verificar sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('AuthProvider: Sessão atual:', session ? 'Encontrada' : 'Não encontrada');
      setUser(session?.user ?? null);
      if (session?.user) {
        console.log('AuthProvider: Usuário encontrado na sessão, buscando dados do app_user');
        fetchAppUser(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Escutar mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('AuthProvider: Mudança de estado de autenticação:', _event);
      setUser(session?.user ?? null);
      if (session?.user) {
        console.log('AuthProvider: Novo usuário autenticado, buscando dados do app_user');
        fetchAppUser(session.user.id);
      } else {
        console.log('AuthProvider: Usuário desconectado');
        setAppUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchAppUser(userId: string) {
    console.log('AuthProvider: Buscando dados do usuário com ID:', userId);
    
    const { data, error } = await supabase
      .from('app_users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Erro ao buscar dados do usuário:', error);
      setLoading(false);
      return;
    }

    console.log('AuthProvider: Dados do usuário encontrados:', data);
    setAppUser(data);
    setLoading(false);
  }

  async function signIn(email: string, password: string) {
    console.log('AuthProvider: Tentando fazer login com email:', email);
    
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      console.error('Erro ao fazer login:', error);
      throw error;
    }
    
    console.log('AuthProvider: Login bem-sucedido, usuário:', data.user?.id);
  }

  async function signOut() {
    console.log('AuthProvider: Iniciando logout');
    
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Erro ao fazer logout:', error);
      throw error;
    }
    
    console.log('AuthProvider: Logout concluído com sucesso');
  }

  return (
    <AuthContext.Provider value={{ user, appUser, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
} 