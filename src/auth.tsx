import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User } from './users.ts';
import { supabase } from './supabaseClient.ts';

type AuthContextType = {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({ user: null, login: async () => false, logout: () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  async function login(username: string, password: string) {
    // Busca usuário no Supabase
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .ilike('username', username)
      .eq('password', password)
      .single();
    if (data && !error) {
      setUser(data);
      return true;
    }
    return false;
  }

  function logout() {
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
