import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User } from './users.ts';
import { supabase } from './supabaseClient.ts';
import { useInactivityTimeout } from './useInactivityTimeout.ts';

type AuthContextType = {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({ user: null, login: async () => false, logout: () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Função de logout
  const logout = () => {
    setUser(null);
    localStorage.removeItem('accesscam_session');
  };

  // Timeout de inatividade (2 horas = 120 minutos)
  useInactivityTimeout(() => {
    if (user) {
      logout();
      alert('Sessão expirada por inatividade. Faça login novamente.');
    }
  }, 120);

  // Verificar sessão existente ao carregar
  useEffect(() => {
    const checkExistingSession = () => {
      try {
        const sessionData = localStorage.getItem('accesscam_session');
        if (sessionData) {
          const { user: savedUser, timestamp } = JSON.parse(sessionData);
          const now = Date.now();
          const sessionDuration = 8 * 60 * 60 * 1000; // 8 horas em millisegundos
          
          // Se a sessão ainda é válida (menos de 8 horas)
          if (now - timestamp < sessionDuration) {
            setUser(savedUser);
          } else {
            // Sessão expirada, remover
            localStorage.removeItem('accesscam_session');
          }
        }
      } catch (error) {
        // Em caso de erro, limpar dados corrompidos
        localStorage.removeItem('accesscam_session');
      }
      setIsLoading(false);
    };

    checkExistingSession();
  }, []);

  async function login(username: string, password: string) {
    try {
      // Verifica se username e password não estão vazios
      if (!username.trim() || !password.trim()) {
        return false;
      }

      // Busca usuário no Supabase
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .ilike('username', username.trim())
        .eq('password', password)
        .single();
      
      if (data && !error) {
        setUser(data);
        
        // Salvar sessão no localStorage com timestamp
        const sessionData = {
          user: data,
          timestamp: Date.now()
        };
        localStorage.setItem('accesscam_session', JSON.stringify(sessionData));
        
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Erro no login:', err);
      return false;
    }
  }

  // Mostrar loading enquanto verifica sessão
  if (isLoading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(120deg, #2563eb 0%, #04506B 100%)'
      }}>
        <div style={{
          background: '#fff',
          padding: '20px 30px',
          borderRadius: 12,
          boxShadow: '0 4px 32px #04506b22',
          color: '#04506B',
          fontWeight: 600,
          fontSize: 16
        }}>
          Verificando sessão...
        </div>
      </div>
    );
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
