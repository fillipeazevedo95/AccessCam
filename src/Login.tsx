import React, { useState, useEffect } from 'react';
import { useAuth } from './auth.tsx';

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);

  // Carregar último usuário salvo
  useEffect(() => {
    const lastUser = localStorage.getItem('lastUser');
    if (lastUser) setUsername(lastUser);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validações básicas
      if (!username.trim()) {
        setError('Por favor, digite seu usuário');
        setLoading(false);
        return;
      }

      if (!password.trim()) {
        setError('Por favor, digite sua senha');
        setLoading(false);
        return;
      }

      if (remember) localStorage.setItem('lastUser', username);
      else localStorage.removeItem('lastUser');
      
      const success = await login(username.trim(), password);
      if (!success) {
        setError('Usuário ou senha inválidos');
      }
    } catch (err) {
      console.error('Erro no login:', err);
      setError('Erro ao conectar com o servidor. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(120deg, #2563eb 0%, #04506B 100%)' }}>
      <form onSubmit={handleSubmit} style={{ background: '#fff', padding: 36, borderRadius: 16, boxShadow: '0 4px 32px #04506b22', minWidth: 340, display: 'flex', flexDirection: 'column', gap: 18, alignItems: 'center', position: 'relative' }}>
        <img src="/logo.png" alt="Logo Câmeras" style={{ width: 72, height: 72, objectFit: 'contain', marginBottom: 10, filter: 'drop-shadow(0 2px 8px #2563eb33)' }} />
        <h2 style={{ 
          color: '#04506B', 
          fontWeight: 900, 
          fontSize: 32, 
          marginBottom: 0, 
          letterSpacing: 1.5, 
          textShadow: '0 2px 12px #2563eb55, 0 1px 0 #fff',
          filter: 'drop-shadow(0 2px 8px #2563eb33)'
        }}>AccessCam</h2>
        <div style={{
          fontSize: 19,
          color: '#2563eb',
          fontWeight: 900,
          marginBottom: 12,
          marginTop: 2,
          letterSpacing: 1.5,
          textShadow: '0 1px 8px #2563eb22, 0 1px 0 #fff',
          filter: 'drop-shadow(0 2px 8px #2563eb33)',
          fontFamily: 'inherit',
        }}>
          Grupo Ginseng
        </div>
        <input placeholder="Usuário" value={username} onChange={e => setUsername(e.target.value)} style={{ padding: 12, borderRadius: 7, border: '1.5px solid #cbd5e1', width: '100%', fontSize: 16 }} autoFocus />
        <input placeholder="Senha" type="password" value={password} onChange={e => setPassword(e.target.value)} style={{ padding: 12, borderRadius: 7, border: '1.5px solid #cbd5e1', width: '100%', fontSize: 16 }} />
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', margin: '2px 0 0 0' }}>
          <input id="remember" type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} style={{ marginRight: 8, accentColor: '#2563eb' }} />
          <label htmlFor="remember" style={{ fontSize: 15, color: '#04506B', userSelect: 'none', cursor: 'pointer' }}>Lembrar usuário</label>
        </div>
        {error && <span style={{ color: '#e74c3c', fontSize: 14, alignSelf: 'flex-start', background: 'rgba(231, 76, 60, 0.1)', padding: '8px 12px', borderRadius: 6, fontWeight: 600 }}>{error}</span>}
        <button type="submit" disabled={loading} style={{ 
          background: loading ? '#94a3b8' : 'linear-gradient(90deg, #2563eb 60%, #04506B 100%)', 
          color: '#fff', 
          border: 0, 
          borderRadius: 7, 
          padding: '12px 0', 
          fontWeight: 700, 
          fontSize: 17, 
          cursor: loading ? 'not-allowed' : 'pointer', 
          width: '100%', 
          marginTop: 8, 
          boxShadow: loading ? 'none' : '0 2px 8px #2563eb22', 
          letterSpacing: 0.5,
          transition: 'all 0.3s ease'
        }}>
          {loading ? 'Autenticando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
