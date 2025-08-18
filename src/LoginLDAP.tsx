import React, { useState, FormEvent } from 'react';
import { supabase } from './supabaseClient.ts';

export default function Login({ onLogin }: { onLogin: (user: string) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    // Autenticação simples no Supabase (tabela usuarios_ldap)
    const { data, error: dbError } = await supabase
      .from('usuarios_ldap')
      .select('*')
      .eq('usuario', username)
      .eq('senha', password)
      .single();
    setLoading(false);
    if (dbError) {
      setError('Erro ao conectar ao banco de dados.');
      return;
    }
    if (data) {
      onLogin(username);
    } else {
      setError('Usuário ou senha inválidos.');
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9' }}>
      <form onSubmit={handleSubmit} style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 16px #0002', padding: 36, minWidth: 320, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <h2 style={{ color: '#04506B', fontWeight: 700, fontSize: 22, marginBottom: 8 }}>Login</h2>
        <input
          type="text"
          placeholder="Usuário"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
          style={{ padding: 10, borderRadius: 6, border: '1.5px solid #cbd5e1', fontSize: 16 }}
        />
        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          style={{ padding: 10, borderRadius: 6, border: '1.5px solid #cbd5e1', fontSize: 16 }}
        />
        <button type="submit" disabled={loading} style={{ background: '#04506B', color: '#fff', border: 0, borderRadius: 6, padding: '10px 0', fontWeight: 600, fontSize: 17, cursor: 'pointer', marginTop: 8 }}>
          {loading ? 'Autenticando...' : 'Entrar'}
        </button>
        {error && <span style={{ color: '#CC7277', fontWeight: 500, fontSize: 15 }}>{error}</span>}
      </form>
    </div>
  );
}
