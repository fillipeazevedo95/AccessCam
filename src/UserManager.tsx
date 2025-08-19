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

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0,0,0,0.25)',
      zIndex: 5000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 16px #0003', padding: 32, minWidth: 320, maxWidth: 400, width: '90%', position: 'relative' }}>
        {onClose && (
          <button onClick={onClose} style={{ position: 'absolute', top: 12, right: 12, background: '#e0e7ef', color: '#334155', border: 0, borderRadius: '50%', width: 32, height: 32, fontWeight: 700, fontSize: 18, cursor: 'pointer' }} title="Fechar">×</button>
        )}
        <h2 style={{ color: '#04506B', fontWeight: 700, fontSize: 22, marginBottom: 18 }}>Gerenciar Usuários</h2>
        <form onSubmit={handleAddUser} style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
          <input name="username" placeholder="Login do usuário" value={form.username || ''} onChange={handleChange} style={{ padding: 8, borderRadius: 6, border: '1px solid #cbd5e1' }} />
          <input name="password" placeholder="Senha" value={form.password || ''} onChange={handleChange} style={{ padding: 8, borderRadius: 6, border: '1px solid #cbd5e1' }} />
          <input name="owner" placeholder="Nome do responsável pelo acesso" value={form.owner || ''} onChange={handleChange} style={{ padding: 8, borderRadius: 6, border: '1px solid #cbd5e1' }} />
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 500 }}>
            <input
              type="checkbox"
              checked={form.role === 'adm'}
              onChange={e => setForm(f => ({ ...f, role: e.target.checked ? 'adm' : 'prevencao' }))}
              style={{ width: 18, height: 18 }}
            />
            Permitir criar outros usuários (direitos de ADM)
          </label>
          {error && <span style={{ color: 'red', fontSize: 14 }}>{error}</span>}
          <button type="submit" style={{ background: '#2563eb', color: '#fff', border: 0, borderRadius: 6, padding: '8px 0', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}>Adicionar Usuário</button>
        </form>
        <h3 style={{ color: '#04506B', fontWeight: 600, fontSize: 18, marginBottom: 10 }}>Usuários cadastrados</h3>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {users.map(u => (
            <li key={u.username} style={{ padding: 8, borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {editUser?.username === u.username ? (
                <form onSubmit={handleEditSave} style={{ display: 'flex', gap: 6, alignItems: 'center', width: '100%' }}>
                  <input name="username" value={editForm.username || ''} onChange={handleEditChange} style={{ width: 80, padding: 4, borderRadius: 4, border: '1px solid #cbd5e1' }} />
                  <input name="password" value={editForm.password || ''} onChange={handleEditChange} style={{ width: 80, padding: 4, borderRadius: 4, border: '1px solid #cbd5e1' }} />
                  <select name="role" value={editForm.role} onChange={handleEditChange} style={{ padding: 4, borderRadius: 4, border: '1px solid #cbd5e1' }}>
                    <option value="ti">TI</option>
                    <option value="prevencao">Prevenção</option>
                  </select>
                  <button type="submit" style={{ background: '#2563eb', color: '#fff', border: 0, borderRadius: 4, padding: '4px 10px', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Salvar</button>
                  <button type="button" onClick={() => setEditUser(null)} style={{ background: '#e0e7ef', color: '#334155', border: 0, borderRadius: 4, padding: '4px 10px', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Cancelar</button>
                </form>
              ) : (
                <>
                  <span><b>{u.username}</b> ({u.role === 'ti' ? 'TI' : 'Prevenção'})</span>
                  <span>
                    <button onClick={() => handleEdit(u)} style={{ background: '#fbbf24', color: '#fff', border: '1px solid #eab308', borderRadius: 4, padding: '2px 8px', fontWeight: 600, fontSize: 13, marginRight: 6, cursor: 'pointer' }}>Editar</button>
                    <button onClick={() => handleDelete(u.username)} style={{ background: '#ef4444', color: '#fff', border: '1px solid #b91c1c', borderRadius: 4, padding: '2px 8px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Remover</button>
                  </span>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
