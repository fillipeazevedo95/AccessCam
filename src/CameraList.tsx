import { supabase } from './supabaseClient.ts';
import React, { useState, useEffect } from 'react';
import UserManager from './UserManager.tsx';
import { useAuth } from './auth.tsx';
import { useAllUsers } from './useAllUsers.ts';
import { FaStore, FaCloud, FaIdBadge, FaGlobe, FaUser, FaKey, FaWifi, FaCheckCircle, FaTimesCircle, FaExclamationCircle } from 'react-icons/fa';
import { MdWifiOff } from 'react-icons/md';

export type Camera = {
  id: number;
  loja_numero: string;
  loja_nome: string;
  cloud?: string;
  camera_id?: string;
  ddns?: string;
  porta_servico?: string;
  porta_web?: string;
  usuario?: string;
  senha?: string;
  tipo_conexao?: 'cloud' | 'id' | 'ddns';
  status: 'online' | 'offline' | 'sem sinal';
  logradouro?: string;
  cidade?: string;
  estado?: string;
  owner?: string;
};

function getBorderColor(status: string) {
  if (status === 'online') return '#22c55e';
  if (status === 'offline') return '#e11d48';
  if (status === 'sem sinal') return '#facc15';
  return '#e5e7eb';
}

export default function CameraList() {
  // Detecta se está em mobile
  const [isMobile, setIsMobile] = useState(false);
  const [headerMin, setHeaderMin] = useState(false);
  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth <= 600);
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [showSenha, setShowSenha] = React.useState<{ [id: number]: boolean }>({});
  useEffect(() => {
    if (isMobile) setHeaderMin(true);
    else setHeaderMin(false);
  }, [isMobile]);
  const { user } = useAuth();
  // Mock de usuários para o menu suspenso
  // Garante que não haja chaves duplicadas no dropdown
  const allUsers = useAllUsers();
  const [usuarioSelecionado, setUsuarioSelecionado] = useState(user?.username || '');
  const isAdmin = user?.role === 'ti' || user?.role === 'adm' || user?.username === 'ti';
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Carregar câmeras mock ao montar
  React.useEffect(() => {
    async function fetchCameras() {
      setLoading(true);
      let query = supabase.from('cameras').select('*');
      if (!isAdmin) {
        // Usuário comum só vê suas próprias câmeras
        query = query.eq('owner', user?.username);
      } else {
        // Admin sempre vê apenas as câmeras do usuário selecionado
        query = query.eq('owner', usuarioSelecionado);
      }
      const { data, error } = await query;
      if (error) {
        console.error('Erro ao buscar câmeras:', error.message);
        setCameras([]);
      } else {
        setCameras(data || []);
      }
      setLoading(false);
    }
    fetchCameras();
  }, [user, isAdmin, usuarioSelecionado]);
  const [showUserManager, setShowUserManager] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<Partial<Camera>>({ tipo_conexao: 'cloud', status: 'offline', owner: user?.username });
  const [editId, setEditId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [statusFiltro, setStatusFiltro] = useState<'all' | 'online' | 'offline' | 'sem sinal'>('all');
  const [estadoFiltro, setEstadoFiltro] = useState<string>('all');
  const [cidadeFiltro, setCidadeFiltro] = useState<string>('all');

  // Listas únicas de estados e cidades cadastrados
  const estadosCadastrados = Array.from(new Set(cameras.map(c => c.estado).filter(Boolean)));
  const cidadesCadastradas = Array.from(new Set(cameras.map(c => c.cidade).filter(Boolean)));

  function handleEdit(cam: Camera) {
    setEditId(cam.id);
    setForm({ ...cam });
    setShowModal(true);
  }
  async function handleDelete(id: number) {
    if (!window.confirm('Tem certeza que deseja excluir esta câmera?')) return;
    setLoading(true);
    const { error } = await supabase.from('cameras').delete().eq('id', id);
    if (error) {
      alert('Erro ao excluir câmera: ' + error.message);
    } else {
      // Atualiza lista
      const { data } = await supabase.from('cameras').select('*');
      setCameras(data || []);
    }
    setLoading(false);
  }
  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Validação dos campos obrigatórios
    if (!form.loja_nome || !form.loja_numero || !form.tipo_conexao || !form.status) {
      alert('Preencha todos os campos obrigatórios: Nome da loja, Número da loja, Tipo de conexão e Status.');
      return;
    }
    setLoading(true);
    // Garante que owner sempre será o usuário logado
    let cameraData;
    if (editId) {
      // Ao editar, mantém o owner original
      cameraData = {
        loja_nome: form.loja_nome,
        loja_numero: form.loja_numero,
        tipo_conexao: form.tipo_conexao,
        status: form.status,
        // Não altera owner!
        ...(form.cidade ? { cidade: form.cidade } : {}),
        ...(form.estado ? { estado: form.estado } : {}),
        ...(form.usuario ? { usuario: form.usuario } : {}),
        ...(form.senha ? { senha: form.senha } : {}),
        ...(form.cloud ? { cloud: form.cloud } : {}),
        ...(form.camera_id ? { camera_id: form.camera_id } : {}),
        ...(form.ddns ? { ddns: form.ddns } : {}),
        ...(form.porta_servico ? { porta_servico: form.porta_servico } : {}),
        ...(form.porta_web ? { porta_web: form.porta_web } : {})
      };
    } else {
      // No cadastro, define owner como usuário logado ou selecionado (admin)
      cameraData = {
        loja_nome: form.loja_nome,
        loja_numero: form.loja_numero,
        tipo_conexao: form.tipo_conexao,
        status: form.status,
        owner: isAdmin && usuarioSelecionado ? usuarioSelecionado : user?.username,
        ...(form.cidade ? { cidade: form.cidade } : {}),
        ...(form.estado ? { estado: form.estado } : {}),
        ...(form.usuario ? { usuario: form.usuario } : {}),
        ...(form.senha ? { senha: form.senha } : {}),
        ...(form.cloud ? { cloud: form.cloud } : {}),
        ...(form.camera_id ? { camera_id: form.camera_id } : {}),
        ...(form.ddns ? { ddns: form.ddns } : {}),
        ...(form.porta_servico ? { porta_servico: form.porta_servico } : {}),
        ...(form.porta_web ? { porta_web: form.porta_web } : {})
      };
    }
    if (editId) {
      // Atualizar câmera existente
      const { error } = await supabase.from('cameras').update(cameraData).eq('id', editId);
      if (error) alert('Erro ao atualizar câmera: ' + error.message);
    } else {
      // Inserir nova câmera
      const { error } = await supabase.from('cameras').insert([cameraData]);
      if (error) alert('Erro ao cadastrar câmera: ' + error.message);
    }
    // Atualiza lista
    const { data } = await supabase.from('cameras').select('*');
    setCameras(data || []);
    setShowModal(false);
    setEditId(null);
    setForm({ tipo_conexao: 'cloud', status: 'offline', owner: user?.username });
    setLoading(false);
  }

   const cameraCards = cameras
     .filter(cam => {
       if (!isAdmin) {
         // Usuário comum só vê suas próprias câmeras
         return cam.owner === user?.username;
       }
       // Se admin selecionou um usuário específico, só mostra as câmeras desse usuário
       if (usuarioSelecionado && usuarioSelecionado !== user?.username) {
         return cam.owner === usuarioSelecionado;
       }
       // Admin sem filtro vê todas
       return true;
     })
     .filter(cam => (statusFiltro === 'all' || cam.status === statusFiltro))
     .filter(cam => (estadoFiltro === 'all' || cam.estado === estadoFiltro))
     .filter(cam => (cidadeFiltro === 'all' || cam.cidade === cidadeFiltro))
     .filter(cam => {
       const termo = search.toLowerCase();
       return (
         cam.loja_nome?.toLowerCase().includes(termo) ||
         cam.loja_numero?.toLowerCase().includes(termo) ||
         cam.cidade?.toLowerCase().includes(termo) ||
         cam.estado?.toLowerCase().includes(termo)
       );
     })
     .sort((a, b) => {
       const numA = parseInt(a.loja_numero, 10);
       const numB = parseInt(b.loja_numero, 10);
       if (isNaN(numA) && isNaN(numB)) return 0;
       if (isNaN(numA)) return 1;
       if (isNaN(numB)) return -1;
       return numA - numB;
     })
    .map(cam => (
  <div key={cam.id} className="camera-card" style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 8px #0001', padding: 24, display: 'flex', flexDirection: 'column', gap: 10, border: `2px solid ${getBorderColor(cam.status)}`, marginBottom: 8 }}>
  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8, flexWrap: isMobile ? 'wrap' : undefined }}>
          <FaStore color="#2563eb" size={28} />
          <span style={{ fontWeight: 700, fontSize: 20 }}>{cam.loja_nome} {cam.loja_numero && <span style={{ fontWeight: 400, fontSize: 16, color: '#2563eb' }}>#{cam.loja_numero}</span>}</span>
          <span style={{ marginLeft: 'auto', fontWeight: 700, color: getBorderColor(cam.status), fontSize: 17, textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: 6 }}>
            {cam.status === 'online' && <FaCheckCircle color="#22c55e" title="Online" />}
            {cam.status === 'offline' && <FaTimesCircle color="#e11d48" title="Offline" />}
            {cam.status === 'sem sinal' && <FaExclamationCircle color="#facc15" title="Sem sinal" />}
            {cam.status === 'sem sinal' ? 'No Sinal' : cam.status}
          </span>
          <div style={{ display: 'flex', gap: isMobile ? 8 : 12, width: isMobile ? '100%' : 'auto', flexDirection: isMobile ? 'column' : 'row', marginLeft: 12 }}>
            <button
              onClick={() => handleEdit(cam)}
              style={{
                background: '#e0e7ef',
                color: '#334155',
                border: 0,
                borderRadius: 8,
                padding: isMobile ? '10px 0' : '6px 16px',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: isMobile ? 17 : 15,
                width: isMobile ? '100%' : 110,
                minWidth: 90,
                margin: 0
              }}
            >Editar</button>
            <button
              onClick={() => handleDelete(cam.id)}
              style={{
                background: '#e11d48',
                color: '#fff',
                border: 0,
                borderRadius: 8,
                padding: isMobile ? '10px 0' : '6px 16px',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: isMobile ? 17 : 15,
                width: isMobile ? '100%' : 110,
                minWidth: 90,
                margin: 0
              }}
            >Excluir</button>
          </div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 15 }}>
          {cam.cloud && <span style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f1f5f9', borderRadius: 8, padding: '4px 10px' }}><FaCloud color="#0ea5e9" size={18} /> Cloud: {cam.cloud}</span>}
          {cam.camera_id && <span style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f1f5f9', borderRadius: 8, padding: '4px 10px' }}><FaIdBadge color="#6366f1" size={18} /> ID: {cam.camera_id}</span>}
          {cam.ddns && <span style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f1f5f9', borderRadius: 8, padding: '4px 10px' }}><FaGlobe color="#16a34a" size={18} /> DDNS: {cam.ddns}</span>}
          {cam.usuario && <span style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f1f5f9', borderRadius: 8, padding: '4px 10px' }}><FaUser color="#f59e42" size={18} /> Usuário: {cam.usuario}</span>}
          {cam.senha && <span style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f1f5f9', borderRadius: 8, padding: '4px 10px' }}><FaKey color="#eab308" size={18} /> Senha: {cam.senha}</span>}
          {cam.porta_servico && <span style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f1f5f9', borderRadius: 8, padding: '4px 10px' }}><FaWifi color="#2563eb" size={18} /> Porta Serviço: {cam.porta_servico}</span>}
          {cam.porta_web && <span style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f1f5f9', borderRadius: 8, padding: '4px 10px' }}><MdWifiOff color="#2563eb" size={18} /> Porta Web: {cam.porta_web}</span>}
          {(cam.cidade || cam.estado) && <span style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f1f5f9', borderRadius: 8, padding: '4px 10px' }}><FaGlobe color="#2563eb" size={18} /> {cam.cidade} {cam.estado && <span style={{ fontWeight: 400 }}>|</span>} {cam.estado}</span>}
        </div>
      </div>
    ));

  return (
    <div className="main-container" style={{ minHeight: '100vh', background: '#f3f4f6', padding: 0, margin: 0 }}>
      {/* Modal de cadastro/edição de câmera */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#0008', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <form onSubmit={handleSubmit} style={{ background: '#fff', borderRadius: 14, padding: 32, minWidth: 320, boxShadow: '0 4px 24px #0003', display: 'flex', flexDirection: 'column', gap: 16, position: 'relative' }}>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>{editId ? 'Editar Câmera' : 'Cadastrar Câmera'}</h2>
            <input name="loja_nome" value={form.loja_nome || ''} onChange={handleChange} placeholder="Nome da loja" required style={{ padding: 8, borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 15 }} />
            <input name="loja_numero" value={form.loja_numero || ''} onChange={handleChange} placeholder="Número da loja" required style={{ padding: 8, borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 15 }} />
            <input name="cidade" value={form.cidade || ''} onChange={handleChange} placeholder="Cidade" style={{ padding: 8, borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 15 }} />
            <input name="estado" value={form.estado || ''} onChange={handleChange} placeholder="Estado" style={{ padding: 8, borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 15 }} />
            <select name="status" value={form.status || 'offline'} onChange={handleChange} style={{ padding: 8, borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 15 }}>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
              <option value="sem sinal">No Sinal</option>
            </select>
            <select name="tipo_conexao" value={form.tipo_conexao || 'cloud'} onChange={handleChange} style={{ padding: 8, borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 15 }}>
              <option value="cloud">Cloud</option>
              <option value="id">ID</option>
              <option value="ddns">DDNS</option>
            </select>
            {form.tipo_conexao === 'cloud' && (
              <input name="cloud" value={form.cloud || ''} onChange={handleChange} placeholder="Cloud" style={{ padding: 8, borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 15 }} />
            )}
            {form.tipo_conexao === 'id' && (
              <input name="camera_id" value={form.camera_id || ''} onChange={handleChange} placeholder="ID da Câmera" style={{ padding: 8, borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 15 }} />
            )}
            {form.tipo_conexao === 'ddns' && (
              <input name="ddns" value={form.ddns || ''} onChange={handleChange} placeholder="DDNS" style={{ padding: 8, borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 15 }} />
            )}
            <input name="porta_servico" value={form.porta_servico || ''} onChange={handleChange} placeholder="Porta Serviço" style={{ padding: 8, borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 15 }} />
            <input name="porta_web" value={form.porta_web || ''} onChange={handleChange} placeholder="Porta Web" style={{ padding: 8, borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 15 }} />
            <input name="usuario" value={form.usuario || ''} onChange={handleChange} placeholder="Usuário" style={{ padding: 8, borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 15 }} />
            <input name="senha" value={form.senha || ''} onChange={handleChange} placeholder="Senha" type="password" style={{ padding: 8, borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 15 }} />
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button type="submit" style={{ background: '#2563eb', color: '#fff', border: 0, borderRadius: 8, padding: '8px 22px', fontWeight: 700, cursor: 'pointer', fontSize: 16 }}>Salvar</button>
              <button type="button" onClick={() => { setShowModal(false); setEditId(null); setForm({ tipo_conexao: 'cloud', status: 'offline', owner: user?.username }); }} style={{ background: '#e11d48', color: '#fff', border: 0, borderRadius: 8, padding: '8px 22px', fontWeight: 700, cursor: 'pointer', fontSize: 16 }}>Cancelar</button>
            </div>
          </form>
        </div>
      )}
      {/* Header */}
      <header className={headerMin ? 'header-min' : ''} style={{ background: '#2563eb', color: '#fff', padding: headerMin ? '8px 0' : '18px 0 12px 0', marginBottom: 24, boxShadow: '0 2px 8px #0002', transition: 'padding 0.2s' }}>
        <div style={{ maxWidth: '90%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <img src="/logo.png" alt="Logo" style={{ height: headerMin ? 28 : 38, marginRight: 10, transition: 'height 0.2s' }} />
            <span style={{ fontWeight: 700, fontSize: headerMin ? 17 : 22, letterSpacing: 1, transition: 'font-size 0.2s' }}>AccessCam</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 18, flexWrap: isMobile ? 'wrap' : undefined }}>
            <span style={{ fontWeight: 500, fontSize: headerMin ? 13 : 16 }}>Usuário: {user?.username || '---'}</span>
            {/* Menu suspenso de outros usuários, só para admin */}
            {isAdmin && (
              <>
                <div style={{ position: 'relative' }}>
                  <select
                    value={usuarioSelecionado}
                    onChange={e => setUsuarioSelecionado(e.target.value)}
                    style={{ padding: '6px 18px', borderRadius: 8, border: 0, fontWeight: 700, color: '#2563eb', background: '#fff', fontSize: 15, boxShadow: '0 1px 4px #0001', cursor: 'pointer' }}
                    title="Visualizar câmeras de outro usuário"
                  >
                     {allUsers.map(u => (
                       <option key={u.username} value={u.username}>{u.username}</option>
                     ))}
                  </select>
                </div>
                <button onClick={() => setShowUserManager(true)} style={{ background: '#fff', color: '#2563eb', border: 0, borderRadius: 8, padding: isMobile ? '10px 0' : '6px 18px', fontWeight: 700, cursor: 'pointer', fontSize: isMobile ? 17 : 15, boxShadow: '0 1px 4px #0001', width: isMobile ? '100%' : undefined, marginTop: isMobile ? 8 : 0 }}>Gerenciar Usuários</button>
              </>
            )}
            <button onClick={() => {
              // Remove apenas dados de sessão, mantendo o lastUser
              Object.keys(localStorage).forEach(key => {
                if (key !== 'lastUser') localStorage.removeItem(key);
              });
              window.location.reload();
            }} style={{ background: '#e11d48', color: '#fff', border: 0, borderRadius: 8, padding: isMobile ? '10px 0' : '6px 18px', fontWeight: 700, cursor: 'pointer', fontSize: isMobile ? 17 : 15, boxShadow: '0 1px 4px #0001', width: isMobile ? '100%' : undefined, marginTop: isMobile ? 8 : 0 }}>Sair</button>
          </div>
        </div>
      </header>

      {/* Busca e filtros */}
      <div className="filters-bar" style={{ maxWidth: '90%', margin: '0 auto', marginBottom: 24, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <input
          type="text"
          placeholder="Buscar loja, número, cidade ou estado..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 180, padding: 8, borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 15 }}
        />
        <select value={statusFiltro} onChange={e => setStatusFiltro(e.target.value as any)} style={{ padding: 8, borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 15 }}>
          <option value="all">Todos status</option>
          <option value="online">Online</option>
          <option value="offline">Offline</option>
          <option value="sem sinal">No Sinal</option>
        </select>
        <select value={estadoFiltro} onChange={e => setEstadoFiltro(e.target.value)} style={{ width: 90, padding: 8, borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 15 }}>
          <option value="all">Todos os Estados</option>
          {estadosCadastrados.map(estado => (
            <option key={estado} value={estado}>{estado}</option>
          ))}
        </select>
        <select value={cidadeFiltro} onChange={e => setCidadeFiltro(e.target.value)} style={{ width: 120, padding: 8, borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 15 }}>
          <option value="all">Todas as Cidades</option>
          {cidadesCadastradas.map(cidade => (
            <option key={cidade} value={cidade}>{cidade}</option>
          ))}
        </select>
        <button onClick={() => setShowModal(true)} style={{ background: '#2563eb', color: '#fff', border: 0, borderRadius: 8, padding: isMobile ? '10px 0' : '8px 22px', fontWeight: 700, cursor: 'pointer', fontSize: isMobile ? 17 : 16, boxShadow: '0 1px 4px #0001', width: isMobile ? '100%' : undefined, marginTop: isMobile ? 8 : 0 }}>Cadastrar Câmera</button>
      </div>

      {/* Botão para TI acessar gerenciamento de usuários */}
      {showUserManager && <UserManager onClose={() => setShowUserManager(false)} />}
      {loading ? (
        <div style={{ textAlign: 'center', color: '#2563eb', fontWeight: 700, fontSize: 22, marginTop: 40 }}>Carregando...</div>
      ) : (
  <div className="camera-list-container" style={{ maxWidth: '90%', margin: '0 auto' }}>{cameraCards}</div>
      )}
    </div>
  );
}
