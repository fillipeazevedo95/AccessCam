import React, { useState } from 'react';

// Configurações padrão para conexão LDAP
const LDAP_CONFIG = {
  url: 'ldap://seu-servidor-ldap:389', // Exemplo: ldap://ldap.exemplo.com:389
  baseDN: 'dc=exemplo,dc=com',
  domain: 'EXEMPLO', // Opcional, se necessário
};

export default function LoginLDAP({ onLogin }: { onLogin: (user: string) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // Campos para customização das configurações LDAP (opcional)
  const [ldapUrl, setLdapUrl] = useState(LDAP_CONFIG.url);
  const [baseDN, setBaseDN] = useState(LDAP_CONFIG.baseDN);
  const [domain, setDomain] = useState(LDAP_CONFIG.domain);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    // Exemplo de payload para autenticação real
    /*
    const response = await fetch('/api/auth/ldap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        password,
        ldapUrl,
        baseDN,
        domain,
      }),
    });
    const data = await response.json();
    setLoading(false);
    if (data.success) {
      onLogin(username);
    } else {
      setError(data.message || 'Falha na autenticação LDAP.');
    }
    return;
    */
    // Simulação de chamada para API de autenticação LDAP
    // Substitua por chamada real ao backend quando disponível
    setTimeout(() => {
      setLoading(false);
      if (username === 'admin' && password === 'senha123') {
        onLogin(username);
      } else {
        setError('Usuário ou senha inválidos (simulação).');
      }
    }, 1200);
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9' }}>
      <form onSubmit={handleSubmit} style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 16px #0002', padding: 36, minWidth: 320, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <h2 style={{ color: '#04506B', fontWeight: 700, fontSize: 22, marginBottom: 8 }}>Login LDAP</h2>
        {/* Campos de configuração LDAP (opcional, pode remover se não quiser exibir para o usuário) */}
        <input
          type="text"
          placeholder="URL do Servidor LDAP"
          value={ldapUrl}
          onChange={e => setLdapUrl(e.target.value)}
          style={{ padding: 8, borderRadius: 6, border: '1px solid #e0e7ef', fontSize: 15 }}
        />
        <input
          type="text"
          placeholder="Base DN (ex: dc=exemplo,dc=com)"
          value={baseDN}
          onChange={e => setBaseDN(e.target.value)}
          style={{ padding: 8, borderRadius: 6, border: '1px solid #e0e7ef', fontSize: 15 }}
        />
        <input
          type="text"
          placeholder="Domínio (opcional)"
          value={domain}
          onChange={e => setDomain(e.target.value)}
          style={{ padding: 8, borderRadius: 6, border: '1px solid #e0e7ef', fontSize: 15 }}
        />
        <input
          type="text"
          placeholder="Usuário LDAP"
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
