import React, { useState, useEffect } from 'react';
import { User } from './users.ts';
import { useAuth } from './auth.tsx';
import { supabase } from './supabaseClient.ts';

export default function UserManager({ onClose }: { onClose?: () => void }) {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState<Partial<User>>({ role: 'prevencao' });
  const [error, setError] = useState('');
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<Partial<User>>({});
  const [showUsers, setShowUsers] = useState(false);

  // Carrega usuários do Supabase ao abrir
  useEffect(() => {
    async function fetchUsers() {
      const { data, error } = await supabase.from('users').select('*');
      if (!error && data) setUsers(data);
    }
    fetchUsers();
  }, []);

  if (!user || (user.role !== 'ti' && user.role !== 'adm')) return null;

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault();
    if (!form.username || !form.password || !form.owner) {
      setError('Preencha todos os campos');
      return;
    }
    if (users.some(u => u.username === form.username)) {
      setError('Usuário já existe');
      return;
    }
    // Define role: se checkbox de admin marcado, role = 'adm', se username for 'ti', role = 'ti', senão 'prevencao'
    let role: 'adm' | 'ti' | 'prevencao' = 'prevencao';
    if (form.username === 'ti') {
      role = 'ti';
    } else if (form.role === 'adm' || form.role === 'ti') {
      role = 'adm';
    }
    const { error } = await supabase.from('users').insert([
      {
        username: form.username,
        password: form.password,
        owner: form.owner,
        role,
        pode_criar_usuarios: role === 'adm',
        ativo: true
      }
    ]);
    if (error) {
      setError('Erro ao salvar usuário: ' + error.message);
      return;
    }
    // Atualiza lista
    const { data } = await supabase.from('users').select('*');
    setUsers(data || []);
    setForm({ role: 'prevencao' });
    setError('');
  }

  async function handleDelete(username: string) {
    if (window.confirm('Deseja remover este usuário?')) {
      await supabase.from('users').delete().eq('username', username);
      const { data } = await supabase.from('users').select('*');
      setUsers(data || []);
    }
  }



  function handleEdit(u: User) {
    setEditUser(u);
    setEditForm({ ...u });
  }

  function handleEditChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  }

  async function handleEditSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editForm.username || !editForm.password || !editForm.role) {
      setError('Preencha todos os campos');
      return;
    }
    // Atualiza no Supabase
    await supabase.from('users').update({
      username: editForm.username,
      password: editForm.password,
      role: editForm.role,
      owner: editForm.owner,
      pode_criar_usuarios: editForm.role === 'ti',
      ativo: true
    }).eq('username', editUser?.username);
    const { data } = await supabase.from('users').select('*');
    setUsers(data || []);
    setEditUser(null);
    setEditForm({});
    setError('');
  }

  // Early return após os hooks

  if (!user || (user.role !== 'ti' && user.role !== 'adm')) return null;
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0,0,0,0.7)',
      zIndex: 5000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{ 
        background: 'linear-gradient(135deg, #04506B 0%, #0369a1 100%)', 
        borderRadius: 20, 
        boxShadow: '0 25px 50px rgba(0,0,0,0.3)', 
        padding: '20px', 
        minWidth: 0, 
        maxWidth: 450, 
        width: '90%', 
        maxHeight: '85vh',
        position: 'relative', 
        boxSizing: 'border-box',
        border: '1px solid rgba(255,255,255,0.2)',
        overflow: 'hidden'
      }}>
        {onClose && (
          <button onClick={onClose} style={{ 
            position: 'absolute', 
            top: 15, 
            right: 15, 
            background: 'linear-gradient(135deg, #ff6b6b, #ee5a24)', 
            color: '#fff', 
            border: 0, 
            borderRadius: '50%', 
            width: 40, 
            height: 40, 
            fontWeight: 700, 
            fontSize: 20, 
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(238, 90, 36, 0.4)',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10
          }} title="Fechar">×</button>
        )}
        
        <div style={{
          background: 'rgba(255,255,255,0.98)',
          borderRadius: 15,
          padding: '20px 15px',
          border: '1px solid rgba(255,255,255,0.3)',
          maxHeight: '75vh',
          overflowY: 'auto',
          overflowX: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          {/* Título */}
          <h2 style={{ 
            color: '#2c3e50', 
            fontWeight: 800, 
            fontSize: 22, 
            margin: '0 0 5px 0', 
            textAlign: 'center',
            background: 'linear-gradient(135deg, #04506B, #0369a1)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>🔧 Gerenciar Usuários</h2>

          {/* Formulário de adicionar usuário */}
          <form onSubmit={handleAddUser} style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 12, 
            width: '100%',
            background: 'rgba(102, 126, 234, 0.05)',
            padding: '15px 12px',
            borderRadius: 12,
            border: '1px solid rgba(102, 126, 234, 0.2)',
            boxSizing: 'border-box'
          }}>
            <h3 style={{ 
              margin: '0 0 12px 0', 
              fontSize: 16, 
              fontWeight: 700, 
              color: '#04506B' 
            }}>➕ Adicionar Novo Usuário</h3>
            
            <input 
              name="username" 
              placeholder="Login do usuário" 
              value={form.username || ''} 
              onChange={handleChange} 
              style={{ 
                padding: '10px 14px', 
                borderRadius: 8, 
                border: '2px solid #e1e8ed',
                fontSize: 14,
                transition: 'all 0.3s ease',
                outline: 'none',
                background: '#fff'
              }} 
            />
            <input 
              name="password" 
              placeholder="Senha" 
              value={form.password || ''} 
              onChange={handleChange} 
              style={{ 
                padding: '10px 14px', 
                borderRadius: 8, 
                border: '2px solid #e1e8ed',
                fontSize: 14,
                transition: 'all 0.3s ease',
                outline: 'none',
                background: '#fff'
              }} 
            />
            <input 
              name="owner" 
              placeholder="Nome do responsável pelo acesso" 
              value={form.owner || ''} 
              onChange={handleChange} 
              style={{ 
                padding: '10px 14px', 
                borderRadius: 8, 
                border: '2px solid #e1e8ed',
                fontSize: 14,
                transition: 'all 0.3s ease',
                outline: 'none',
                background: '#fff'
              }} 
            />
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 10, 
              fontSize: 14, 
              fontWeight: 600,
              color: '#2c3e50',
              background: 'rgba(102, 126, 234, 0.1)',
              padding: '10px',
              borderRadius: 8,
              border: '1px solid rgba(102, 126, 234, 0.2)'
            }}>
              <input
                type="checkbox"
                checked={form.role === 'adm'}
                onChange={e => setForm(f => ({ ...f, role: e.target.checked ? 'adm' : 'prevencao' }))}
                style={{ 
                  width: 18, 
                  height: 18,
                  accentColor: '#04506B'
                }}
              />
              🔑 Permitir criar outros usuários (direitos de ADM)
            </label>
            {error && <span style={{ 
              color: '#e74c3c', 
              fontSize: 14, 
              fontWeight: 600,
              background: 'rgba(231, 76, 60, 0.1)',
              padding: '6px 10px',
              borderRadius: 6,
              border: '1px solid rgba(231, 76, 60, 0.2)'
            }}>{error}</span>}
            <button type="submit" style={{ 
              background: 'linear-gradient(135deg, #04506B, #0369a1)', 
              color: '#fff', 
              border: 0, 
              borderRadius: 8, 
              padding: '12px 0', 
              fontWeight: 700, 
              fontSize: 14, 
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
              transition: 'all 0.3s ease',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginTop: '8px'
            }}>✨ Adicionar Usuário</button>
          </form>
          {/* Lista de usuários */}
          <div style={{
            background: 'rgba(102, 126, 234, 0.05)',
            borderRadius: 12,
            border: '1px solid rgba(102, 126, 234, 0.2)',
            padding: '15px 12px',
            boxSizing: 'border-box'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: showUsers ? '15px' : '0'
            }}>
              <h3 style={{ 
                color: '#2c3e50', 
                fontWeight: 700, 
                fontSize: 16, 
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>👥 Usuários Cadastrados ({users.length})</h3>
              
              <button 
                onClick={() => setShowUsers(!showUsers)}
                style={{
                  background: showUsers ? 'linear-gradient(135deg, #ff6b6b, #ee5a24)' : 'linear-gradient(135deg, #04506B, #0369a1)',
                  color: '#fff',
                  border: 0,
                  borderRadius: 8,
                  padding: '6px 12px',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  textTransform: 'uppercase'
                }}
              >
                {showUsers ? '🙈 Ocultar' : '👀 Mostrar'}
              </button>
            </div>
            
            {showUsers && (
              <div style={{ 
                maxHeight: '200px',
                overflowY: 'auto',
                overflowX: 'hidden',
                paddingRight: '5px'
              }}>
                <ul style={{ 
                  listStyle: 'none', 
                  padding: 0, 
                  margin: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  minWidth: 0
                }}>
                  {users.map(u => (
                    <li key={u.username} style={{ 
                      padding: '12px 8px', 
                      background: '#fff',
                      borderRadius: 8,
                      border: '1px solid rgba(102, 126, 234, 0.1)', 
                      display: 'flex', 
                      flexDirection: window.innerWidth < 600 ? 'column' : 'row', 
                      justifyContent: 'space-between', 
                      alignItems: window.innerWidth < 600 ? 'flex-start' : 'center', 
                      gap: 8,
                      transition: 'all 0.3s ease',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                      minWidth: 0,
                      overflow: 'hidden',
                      boxSizing: 'border-box'
                    }}>
                      {editUser?.username === u.username ? (
                        <form onSubmit={handleEditSave} style={{ 
                          display: 'flex', 
                          flexDirection: window.innerWidth < 600 ? 'column' : 'row', 
                          gap: 6, 
                          alignItems: window.innerWidth < 600 ? 'stretch' : 'center', 
                          width: '100%',
                          background: 'rgba(102, 126, 234, 0.05)',
                          padding: '8px',
                          borderRadius: 6,
                          border: '1px solid rgba(102, 126, 234, 0.2)',
                          minWidth: 0,
                          overflow: 'hidden',
                          boxSizing: 'border-box'
                        }}>
                          <input name="username" value={editForm.username || ''} onChange={handleEditChange} style={{ 
                            width: window.innerWidth < 600 ? '100%' : 70, 
                            minWidth: 60,
                            padding: '6px 8px', 
                            borderRadius: 4, 
                            border: '2px solid #e1e8ed',
                            fontSize: 12,
                            outline: 'none',
                            boxSizing: 'border-box'
                          }} />
                          <input name="password" value={editForm.password || ''} onChange={handleEditChange} style={{ 
                            width: window.innerWidth < 600 ? '100%' : 70, 
                            minWidth: 60,
                            padding: '6px 8px', 
                            borderRadius: 4, 
                            border: '2px solid #e1e8ed',
                            fontSize: 12,
                            outline: 'none',
                            boxSizing: 'border-box'
                          }} />
                          <select name="role" value={editForm.role} onChange={handleEditChange} style={{ 
                            padding: '6px 8px', 
                            borderRadius: 4, 
                            border: '2px solid #e1e8ed', 
                            width: window.innerWidth < 600 ? '100%' : 60,
                            minWidth: 50,
                            fontSize: 12,
                            outline: 'none',
                            background: '#fff',
                            boxSizing: 'border-box'
                          }}>
                            <option value="ti">TI</option>
                            <option value="prevencao">Prevenção</option>
                          </select>
                          <button type="submit" style={{ 
                            background: 'linear-gradient(135deg, #10ac84, #06d6a0)', 
                            color: '#fff', 
                            border: 0, 
                            borderRadius: 4, 
                            padding: '6px 10px', 
                            fontWeight: 600, 
                            fontSize: 11, 
                            cursor: 'pointer', 
                            width: window.innerWidth < 600 ? '100%' : 32,
                            minWidth: 32,
                            boxShadow: '0 2px 8px rgba(16, 172, 132, 0.3)',
                            transition: 'all 0.3s ease',
                            boxSizing: 'border-box'
                          }}>💾</button>
                          <button type="button" onClick={() => setEditUser(null)} style={{ 
                            background: 'linear-gradient(135deg, #95a5a6, #7f8c8d)', 
                            color: '#fff', 
                            border: 0, 
                            borderRadius: 4, 
                            padding: '6px 10px', 
                            fontWeight: 600, 
                            fontSize: 11, 
                            cursor: 'pointer', 
                            width: window.innerWidth < 600 ? '100%' : 32,
                            minWidth: 32,
                            boxShadow: '0 2px 8px rgba(127, 140, 141, 0.3)',
                            transition: 'all 0.3s ease',
                            boxSizing: 'border-box'
                          }}>❌</button>
                        </form>
                      ) : (
                        <>
                          <span style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: '#2c3e50',
                            flex: 1,
                            minWidth: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            <span style={{
                              background: 'linear-gradient(135deg, #04506B, #0369a1)',
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent',
                              fontWeight: 700
                            }}>👤 {u.username}</span> 
                            <span style={{
                              background: u.role === 'ti' ? 'linear-gradient(135deg, #ff6b6b, #ee5a24)' : 'linear-gradient(135deg, #3742fa, #2f3542)',
                              color: '#fff',
                              padding: '2px 6px',
                              borderRadius: 8,
                              fontSize: 9,
                              fontWeight: 700,
                              marginLeft: 6,
                              textTransform: 'uppercase'
                            }}>
                              {u.role === 'ti' ? '🔧 TI' : '🛡️ Prev'}
                            </span>
                          </span>
                          <span style={{ 
                            display: 'flex', 
                            gap: 4,
                            flexShrink: 0
                          }}>
                            <button onClick={() => handleEdit(u)} style={{ 
                              background: 'linear-gradient(135deg, #ffa502, #ff6348)', 
                              color: '#fff', 
                              border: 0, 
                              borderRadius: 4, 
                              padding: '4px 8px', 
                              fontWeight: 600, 
                              fontSize: 10, 
                              cursor: 'pointer',
                              boxShadow: '0 2px 8px rgba(255, 165, 2, 0.3)',
                              transition: 'all 0.3s ease',
                              minWidth: 28,
                              boxSizing: 'border-box'
                            }}>✏️</button>
                            <button onClick={() => handleDelete(u.username)} style={{ 
                              background: 'linear-gradient(135deg, #ff3838, #ff4757)', 
                              color: '#fff', 
                              border: 0, 
                              borderRadius: 4, 
                              padding: '4px 8px', 
                              fontWeight: 600, 
                              fontSize: 10, 
                              cursor: 'pointer',
                              boxShadow: '0 2px 8px rgba(255, 56, 56, 0.3)',
                              transition: 'all 0.3s ease',
                              minWidth: 28,
                              boxSizing: 'border-box'
                            }}>🗑️</button>
                          </span>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
