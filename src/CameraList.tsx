import { supabase } from './supabaseClient.ts';
import React, { useState, useEffect } from 'react';
import UserManager from './UserManager.tsx';
import { useAuth } from './auth.tsx';
import { useAllUsers } from './useAllUsers.ts';
import { FaStore, FaCloud, FaIdBadge, FaGlobe, FaUser, FaKey, FaWifi, FaExclamationCircle, FaEye, FaEyeSlash, FaEdit, FaTrash, FaChevronLeft, FaChevronRight, FaBars, FaTimes } from 'react-icons/fa';
import { MdWifiOff } from 'react-icons/md';

type Camera = {
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

export default function CameraList() {
  // Detecta se está em mobile
  const [isMobile, setIsMobile] = useState(false);
  const [headerMin, setHeaderMin] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth <= 600);
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [showSenha, setShowSenha] = React.useState<{ [id: number]: boolean }>({});
  const [showUsuario, setShowUsuario] = React.useState<{ [id: number]: boolean }>({});
  const [showCameraDetails, setShowCameraDetails] = React.useState<{ [id: number]: boolean }>({});
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
  
  // Estados para paginação
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [alturaJanela, setAlturaJanela] = useState(window.innerHeight);
  
  // Calcula itens por página baseado na altura da tela
  const calcularItensPorPagina = () => {
    const alturaHeader = 80; // Altura aproximada do header (reduzida)
    const alturaFiltros = 80; // Altura aproximada da barra de filtros
    const alturaRodape = 80; // Altura aproximada do rodapé e controles de paginação (reduzida)
    const alturaCameraCard = isMobile ? 350 : 220; // Altura mais realista de cada card de câmera
    const espacamentoExtra = 20; // Margem de segurança menor
    
    const alturaDisponivel = alturaJanela - alturaHeader - alturaFiltros - alturaRodape - espacamentoExtra;
    const itensPorPagina = Math.max(1, Math.floor(alturaDisponivel / alturaCameraCard));
    
    console.log('Cálculo de itens por página:', {
      alturaJanela,
      alturaDisponivel,
      alturaCameraCard,
      itensPorPagina,
      isMobile
    });
    
    // Mínimo de 4, máximo de 20 itens por página
    return Math.min(20, Math.max(4, itensPorPagina));
  };
  
  const itensPorPagina = calcularItensPorPagina();
  
  // Effect para redimensionamento da janela
  useEffect(() => {
    const handleResize = () => {
      setAlturaJanela(window.innerHeight);
      // Reset para primeira página quando redimensionar para evitar páginas vazias
      setPaginaAtual(1);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Funções de navegação da paginação
  const irParaPagina = (pagina: number) => {
    setPaginaAtual(pagina);
  };

  const paginaAnterior = () => {
    if (paginaAtual > 1) {
      setPaginaAtual(paginaAtual - 1);
    }
  };

  const proximaPagina = (totalPaginas: number) => {
    if (paginaAtual < totalPaginas) {
      setPaginaAtual(paginaAtual + 1);
    }
  };

  // Resetar para primeira página quando filtros mudarem
  useEffect(() => {
    setPaginaAtual(1);
  }, [search, statusFiltro, estadoFiltro, cidadeFiltro, usuarioSelecionado]);

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

   const camerasFiltradas = cameras
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
     });

  // Cálculos da paginação
  const totalPaginas = Math.ceil(camerasFiltradas.length / itensPorPagina);
  const indiceInicio = (paginaAtual - 1) * itensPorPagina;
  const indiceFim = indiceInicio + itensPorPagina;
  const camerasPaginadas = camerasFiltradas.slice(indiceInicio, indiceFim);

   const cameraCards = camerasPaginadas.map(cam => (
  <div key={cam.id} className="camera-card" style={{ 
    background: '#fff', 
    borderRadius: isMobile ? 8 : 12, 
    boxShadow: '0 4px 12px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.08)', 
    padding: isMobile ? 12 : 14, 
    display: 'flex', 
    flexDirection: 'column', 
    gap: isMobile ? 6 : 8, 
    border: '1px solid #f1f5f9', 
    marginBottom: 0,
    marginLeft: 0,
    marginRight: 0,
    width: '100%',
    boxSizing: 'border-box',
    minHeight: 'auto',
    flex: 'none'
  }}>
  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8, flexWrap: isMobile ? 'wrap' : undefined }}>
          <FaStore color="#2563eb" size={28} />
          <span style={{ fontWeight: 700, fontSize: 20 }}>{cam.loja_nome} {cam.loja_numero && <span style={{ fontWeight: 400, fontSize: 16, color: '#2563eb' }}>#{cam.loja_numero}</span>}</span>
          <span style={{ 
            marginLeft: 'auto', 
            fontWeight: 600, 
            fontSize: 14, 
            textTransform: 'capitalize', 
            display: 'flex', 
            alignItems: 'center', 
            gap: 6,
            background: cam.status === 'online' ? '#dcfce7' : cam.status === 'offline' ? '#fee2e2' : '#fef3c7',
            color: cam.status === 'online' ? '#166534' : cam.status === 'offline' ? '#991b1b' : '#92400e',
            padding: '6px 12px',
            borderRadius: 20,
            border: `1px solid ${cam.status === 'online' ? '#bbf7d0' : cam.status === 'offline' ? '#fecaca' : '#fed7aa'}`
          }}>
            {cam.status === 'online' && <FaWifi size={12} />}
            {cam.status === 'offline' && <MdWifiOff size={12} />}
            {cam.status === 'sem sinal' && <FaExclamationCircle size={12} />}
            {cam.status === 'sem sinal' ? 'No Sinal' : cam.status}
          </span>
          <div style={{ display: 'flex', gap: isMobile ? 8 : 12, width: isMobile ? '100%' : 'auto', flexDirection: isMobile ? 'column' : 'row', marginLeft: 12 }}>
            <button
              onClick={() => handleEdit(cam)}
              style={{
                background: 'linear-gradient(135deg, #04506B, #0369a1)',
                color: '#fff',
                border: 0,
                borderRadius: 8,
                padding: isMobile ? '10px 0' : '6px 16px',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: isMobile ? 17 : 15,
                width: isMobile ? '100%' : 110,
                minWidth: 90,
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                boxShadow: '0 2px 8px rgba(4, 80, 107, 0.3)'
              }}
            ><FaEdit size={14} /> Editar</button>
            <button
              onClick={() => handleDelete(cam.id)}
              style={{
                background: 'linear-gradient(135deg, #e74c3c, #c0392b)',
                color: '#fff',
                border: 0,
                borderRadius: 8,
                padding: isMobile ? '10px 0' : '6px 16px',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: isMobile ? 17 : 15,
                width: isMobile ? '100%' : 110,
                minWidth: 90,
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                boxShadow: '0 2px 8px rgba(231, 76, 60, 0.3)'
              }}
            ><FaTrash size={14} /> Excluir</button>
            <button 
              onClick={() => setShowCameraDetails(prev => ({ ...prev, [cam.id]: !prev[cam.id] }))}
              style={{
                background: showCameraDetails[cam.id] 
                  ? 'linear-gradient(135deg, #0ea5e9, #0284c7)' 
                  : 'linear-gradient(135deg, #04506B, #0369a1)',
                color: '#fff',
                border: 0,
                borderRadius: 8,
                padding: isMobile ? '10px 0' : '6px 16px',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: isMobile ? 17 : 15,
                width: isMobile ? '100%' : 110,
                minWidth: 90,
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                boxShadow: showCameraDetails[cam.id] 
                  ? '0 2px 8px rgba(14, 165, 233, 0.3)'
                  : '0 2px 8px rgba(4, 80, 107, 0.3)'
              }}
            >
              {showCameraDetails[cam.id] ? <FaEyeSlash size={14} /> : <FaEye size={14} />} 
              {showCameraDetails[cam.id] ? 'Esconder' : 'Mostrar'}
            </button>
          </div>
        </div>
        {showCameraDetails[cam.id] && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 15 }}>
            {cam.cloud && <span style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f1f5f9', borderRadius: 8, padding: '4px 10px' }}><FaCloud color="#0ea5e9" size={18} /> Cloud: {cam.cloud}</span>}
            {cam.camera_id && <span style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f1f5f9', borderRadius: 8, padding: '4px 10px' }}><FaIdBadge color="#6366f1" size={18} /> ID: {cam.camera_id}</span>}
            {cam.ddns && <span style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f1f5f9', borderRadius: 8, padding: '4px 10px' }}><FaGlobe color="#16a34a" size={18} /> DDNS: {cam.ddns}</span>}
            {cam.usuario && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f1f5f9', borderRadius: 8, padding: '4px 10px' }}>
                <FaUser color="#f59e42" size={18} /> 
                Usuário: {showUsuario[cam.id] ? cam.usuario : '••••••••'}
                <button 
                  onClick={() => setShowUsuario(prev => ({ ...prev, [cam.id]: !prev[cam.id] }))}
                  style={{
                    background: 'linear-gradient(135deg, #04506B, #0369a1)',
                    color: '#fff',
                    border: 0,
                    borderRadius: 4,
                    padding: '2px 6px',
                    cursor: 'pointer',
                    fontSize: 10,
                    marginLeft: 4
                  }}
                >
                  {showUsuario[cam.id] ? <FaEyeSlash size={10} /> : <FaEye size={10} />}
                </button>
              </span>
            )}
            {cam.senha && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f1f5f9', borderRadius: 8, padding: '4px 10px' }}>
                <FaKey color="#eab308" size={18} /> 
                Senha: {showSenha[cam.id] ? cam.senha : '••••••••'}
                <button 
                  onClick={() => setShowSenha(prev => ({ ...prev, [cam.id]: !prev[cam.id] }))}
                  style={{
                    background: 'linear-gradient(135deg, #04506B, #0369a1)',
                    color: '#fff',
                    border: 0,
                    borderRadius: 4,
                    padding: '2px 6px',
                    cursor: 'pointer',
                    fontSize: 10,
                    marginLeft: 4
                  }}
                >
                  {showSenha[cam.id] ? <FaEyeSlash size={10} /> : <FaEye size={10} />}
                </button>
              </span>
            )}
            {cam.porta_servico && <span style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f1f5f9', borderRadius: 8, padding: '4px 10px' }}><FaWifi color="#2563eb" size={18} /> Porta Serviço: {cam.porta_servico}</span>}
            {cam.porta_web && <span style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f1f5f9', borderRadius: 8, padding: '4px 10px' }}><MdWifiOff color="#2563eb" size={18} /> Porta Web: {cam.porta_web}</span>}
            {(cam.cidade || cam.estado) && <span style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f1f5f9', borderRadius: 8, padding: '4px 10px' }}><FaGlobe color="#2563eb" size={18} /> {cam.cidade} {cam.estado && <span style={{ fontWeight: 400 }}>|</span>} {cam.estado}</span>}
          </div>
        )}
      </div>
    ));

  return (
    <div 
      className="main-container" 
      style={{ 
        minHeight: '100vh', 
        height: isMobile ? 'auto' : '100vh',
        background: '#ffffff', 
        padding: 0, 
        margin: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: isMobile ? 'visible' : 'hidden',
        boxSizing: 'border-box'
      }}
      onClick={() => {
        // Fechar menu mobile se clicar fora
        if (mobileMenuOpen) {
          setMobileMenuOpen(false);
        }
      }}
    >
      {/* Modal de cadastro/edição de câmera */}
      {showModal && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          width: '100vw', 
          height: '100vh', 
          background: 'rgba(0,0,0,0.7)', 
          zIndex: 1000, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backdropFilter: 'blur(5px)'
        }}>
          <form onSubmit={handleSubmit} style={{ 
            background: '#fff', 
            borderRadius: 20, 
            padding: 32, 
            minWidth: 320, 
            maxWidth: 500,
            width: '90%',
            boxShadow: '0 25px 50px rgba(0,0,0,0.3)', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 16, 
            position: 'relative',
            border: '1px solid rgba(255,255,255,0.2)'
          }}>
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
      <header className={headerMin ? 'header-min' : ''} style={{ 
        background: '#ffffff',
        color: '#04506B', 
        padding: headerMin ? '12px 20px' : '20px 20px', 
        marginBottom: 0, 
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)', 
        transition: 'padding 0.3s ease',
        backdropFilter: 'blur(10px)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        borderBottom: '1px solid rgba(4, 80, 107, 0.2)'
      }}>
        <div style={{ maxWidth: '100%', margin: '0 auto', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <img 
              src="https://api.grupoginseng.com.br/img/logo-ginseng-marcas.png" 
              alt="Ginseng Logo" 
              style={{ 
                height: headerMin ? 35 : 45, 
                width: 'auto',
                marginLeft: 50,
                transition: 'height 0.2s',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
              }} 
            />
          </div>
          
          {isMobile ? (
            // Menu mobile com toggle
            <>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#04506B',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: '8px',
                  transition: 'background 0.2s ease'
                }}
              >
                {mobileMenuOpen ? <FaTimes /> : <FaBars />}
              </button>
              
              {mobileMenuOpen && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: '20px',
                  background: '#fff',
                  borderRadius: '12px',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                  padding: '15px',
                  minWidth: '250px',
                  zIndex: 200,
                  border: '1px solid rgba(102, 126, 234, 0.2)'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <span style={{ 
                      fontWeight: 600, 
                      fontSize: 14,
                      color: '#2c3e50',
                      background: 'rgba(102, 126, 234, 0.1)',
                      padding: '8px 12px',
                      borderRadius: 20,
                      border: '1px solid rgba(102, 126, 234, 0.2)',
                      textAlign: 'center'
                    }}>👤 {user?.username || '---'}</span>
                    
                    {isAdmin && (
                      <>
                        <select
                          value={usuarioSelecionado}
                          onChange={e => setUsuarioSelecionado(e.target.value)}
                          style={{ 
                            padding: '8px 12px', 
                            borderRadius: 8, 
                            border: '2px solid #04506B', 
                            fontWeight: 600, 
                            color: '#04506B', 
                            background: '#ffffff', 
                            fontSize: 14,
                            width: '100%',
                            boxShadow: '0 2px 8px rgba(4, 80, 107, 0.3)',
                            cursor: 'pointer'
                          }}
                          title="Visualizar câmeras de outro usuário"
                        >
                           {allUsers.map(u => (
                             <option key={u.username} value={u.username}>{u.username}</option>
                           ))}
                        </select>
                        
                        <button 
                          onClick={() => { setShowUserManager(true); setMobileMenuOpen(false); }}
                          style={{ 
                            background: 'linear-gradient(135deg, #04506B, #0369a1)', 
                            color: '#fff', 
                            border: 0, 
                            borderRadius: 8, 
                            padding: '10px', 
                            fontWeight: 600, 
                            cursor: 'pointer', 
                            fontSize: 14,
                            width: '100%',
                            textAlign: 'center'
                          }}
                        >
                          🔧 Gerenciar Usuários
                        </button>
                      </>
                    )}
                    
                    <button 
                      onClick={() => {
                        Object.keys(localStorage).forEach(key => {
                          if (key !== 'lastUser') localStorage.removeItem(key);
                        });
                        window.location.reload();
                      }}
                      style={{ 
                        background: 'linear-gradient(135deg, #e74c3c, #c0392b)', 
                        color: '#fff', 
                        border: 0, 
                        borderRadius: 8, 
                        padding: '10px', 
                        fontWeight: 600, 
                        cursor: 'pointer', 
                        fontSize: 14,
                        width: '100%',
                        textAlign: 'center'
                      }}
                    >
                      🚪 Sair
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            // Menu desktop
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              <span style={{ 
                fontWeight: 600, 
                fontSize: headerMin ? 14 : 16,
                color: '#2c3e50',
                background: 'rgba(102, 126, 234, 0.1)',
                padding: '6px 12px',
                borderRadius: 20,
                border: '1px solid rgba(102, 126, 234, 0.2)'
              }}>👤 {user?.username || '---'}</span>
              
              {isAdmin && (
                <>
                  <div style={{ position: 'relative' }}>
                    <select
                      value={usuarioSelecionado}
                      onChange={e => setUsuarioSelecionado(e.target.value)}
                      style={{ 
                        padding: '6px 18px', 
                        borderRadius: 8, 
                        border: '2px solid #04506B', 
                        fontWeight: 700, 
                        color: '#04506B', 
                        background: '#ffffff', 
                        fontSize: 15, 
                        boxShadow: '0 2px 8px rgba(4, 80, 107, 0.3)', 
                        cursor: 'pointer' 
                      }}
                      title="Visualizar câmeras de outro usuário"
                    >
                       {allUsers.map(u => (
                         <option key={u.username} value={u.username}>{u.username}</option>
                       ))}
                    </select>
                  </div>
                  <button onClick={() => setShowUserManager(true)} style={{ 
                    background: 'linear-gradient(135deg, #04506B, #0369a1)', 
                    color: '#fff', 
                    border: 0, 
                    borderRadius: 12, 
                    padding: '8px 20px', 
                    fontWeight: 700, 
                    cursor: 'pointer', 
                    fontSize: 15, 
                    boxShadow: '0 4px 15px rgba(4, 80, 107, 0.4)', 
                    transition: 'all 0.3s ease',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>🔧 Gerenciar Usuários</button>
                </>
              )}
              <button onClick={() => {
                Object.keys(localStorage).forEach(key => {
                  if (key !== 'lastUser') localStorage.removeItem(key);
                });
                window.location.reload();
              }} style={{ 
                background: 'linear-gradient(135deg, #e74c3c, #c0392b)', 
                color: '#fff', 
                border: 0, 
                borderRadius: 12, 
                padding: '8px 20px', 
                fontWeight: 700, 
                cursor: 'pointer', 
                fontSize: 15, 
                boxShadow: '0 4px 15px rgba(231, 76, 60, 0.4)', 
                transition: 'all 0.3s ease',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>🚪 Sair</button>
            </div>
          )}
        </div>
      </header>

      {/* Busca e filtros */}
      <div className="filters-bar" style={{ 
        width: '100%',
        maxWidth: '100%', 
        margin: '0', 
        display: 'flex', 
        gap: isMobile ? 10 : 15, 
        flexDirection: isMobile ? 'column' : 'row',
        flexWrap: isMobile ? 'nowrap' : 'wrap', 
        alignItems: isMobile ? 'stretch' : 'center', 
        justifyContent: 'center',
        background: 'rgba(255,255,255,0.9)',
        padding: isMobile ? '15px 20px' : '20px 20px',
        borderRadius: 0,
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
        borderTop: '1px solid rgba(0,0,0,0.1)',
        borderBottom: '1px solid rgba(0,0,0,0.1)',
        boxSizing: 'border-box'
      }}>
        <input
          type="text"
          placeholder="🔍 Buscar loja, número, cidade..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ 
            width: isMobile ? '100%' : 'auto',
            flex: isMobile ? 'none' : '1 1 200px', 
            minWidth: isMobile ? '100%' : 200, 
            maxWidth: isMobile ? '100%' : 300,
            padding: isMobile ? '12px 16px' : '12px 16px', 
            borderRadius: 8, 
            border: '1px solid #e1e8ed', 
            fontSize: isMobile ? 16 : 15,
            outline: 'none',
            transition: 'all 0.3s ease',
            background: '#fff',
            boxSizing: 'border-box'
          }}
        />
        
        {/* Container para os filtros - em linha no mobile */}
        <div style={{
          display: 'flex',
          gap: isMobile ? 8 : 15,
          width: isMobile ? '100%' : 'auto',
          flexWrap: isMobile ? 'wrap' : 'nowrap'
        }}>
          <select 
            value={statusFiltro} 
            onChange={e => setStatusFiltro(e.target.value as any)} 
            style={{ 
              padding: isMobile ? '10px 8px' : '8px 10px', 
              borderRadius: 8, 
              border: '1px solid #cbd5e1', 
              fontSize: isMobile ? 14 : 14,
              flex: isMobile ? '1' : 'none',
              minWidth: isMobile ? 0 : 100,
              background: '#fff'
            }}
          >
            <option value="all">Status</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
            <option value="sem sinal">Sem Sinal</option>
          </select>
          <select 
            value={estadoFiltro} 
            onChange={e => setEstadoFiltro(e.target.value)} 
            style={{ 
              padding: isMobile ? '10px 8px' : '8px 10px', 
              borderRadius: 8, 
              border: '1px solid #cbd5e1', 
              fontSize: isMobile ? 14 : 14,
              flex: isMobile ? '1' : 'none',
              minWidth: isMobile ? 0 : 90,
              background: '#fff'
            }}
          >
            <option value="all">Estados</option>
            {estadosCadastrados.map(estado => (
              <option key={estado} value={estado}>{estado}</option>
            ))}
          </select>
          <select 
            value={cidadeFiltro} 
            onChange={e => setCidadeFiltro(e.target.value)} 
            style={{ 
              padding: isMobile ? '10px 8px' : '8px 10px', 
              borderRadius: 8, 
              border: '1px solid #cbd5e1', 
              fontSize: isMobile ? 14 : 14,
              flex: isMobile ? '1' : 'none',
              minWidth: isMobile ? 0 : 100,
              background: '#fff'
            }}
          >
            <option value="all">Cidades</option>
            {cidadesCadastradas.map(cidade => (
              <option key={cidade} value={cidade}>{cidade}</option>
            ))}
          </select>
        </div>
        
        <button 
          onClick={() => setShowModal(true)} 
          style={{ 
            background: 'linear-gradient(135deg, #04506B, #0369a1)', 
            color: '#fff', 
            border: 0, 
            borderRadius: 8, 
            padding: isMobile ? '12px 20px' : '10px 20px', 
            fontWeight: 600, 
            cursor: 'pointer', 
            fontSize: isMobile ? 14 : 14, 
            boxShadow: '0 2px 8px rgba(4, 80, 107, 0.3)', 
            whiteSpace: 'nowrap',
            transition: 'all 0.3s ease',
            width: isMobile ? '100%' : 'auto'
        }}>🎥 Cadastrar Câmera</button>
      </div>

      {/* Botão para TI acessar gerenciamento de usuários */}
      {showUserManager && <UserManager onClose={() => setShowUserManager(false)} />}
      
      {/* Área de conteúdo com scroll no mobile */}
      <div style={{
        flex: 1,
        overflow: isMobile ? 'visible' : 'hidden',
        display: 'flex',
        flexDirection: 'column',
        minHeight: isMobile ? 'auto' : 0 // Permite que o flex funcione corretamente
      }}>
        {loading ? (
          <div style={{ 
            textAlign: 'center', 
            fontWeight: 700, 
            fontSize: 24, 
            marginTop: 60,
            background: 'rgba(255,255,255,0.9)',
            color: '#2c3e50',
            padding: '30px',
            borderRadius: 20,
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
            maxWidth: '400px',
            margin: '60px auto'
          }}>⏳ Carregando...</div>
        ) : (
          <>
            <div className="camera-list-container" style={{ 
              width: '100%', 
              maxWidth: '100%',
              margin: '0',
              padding: isMobile ? '10px 20px' : '15px 20px',
              boxSizing: 'border-box',
              flex: isMobile ? 'none' : 1,
              overflow: isMobile ? 'visible' : 'hidden',
              display: 'flex',
              flexDirection: 'column',
              gap: isMobile ? '8px' : '8px',
              paddingBottom: isMobile ? '80px' : '0' // Espaço extra no mobile para não sobrepor elementos
            }}>{cameraCards}</div>

            {/* Componente de Paginação - Fixo na parte inferior */}
            {totalPaginas > 1 && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: isMobile ? '4px' : '8px',
                margin: '0',
                padding: isMobile ? '8px 20px' : '12px 20px',
                width: '100%',
                boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.95)',
                borderTop: '1px solid rgba(0,0,0,0.1)',
                flexShrink: 0 // Impede que seja comprimido
              }}>
                <button
                  onClick={paginaAnterior}
                  disabled={paginaAtual === 1}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '8px 12px',
                    border: 'none',
                    borderRadius: '8px',
                    background: paginaAtual === 1 ? '#e5e7eb' : '#04506B',
                    color: paginaAtual === 1 ? '#9ca3af' : '#fff',
                    cursor: paginaAtual === 1 ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: 500,
                    transition: 'all 0.2s ease'
                  }}
                >
                  <FaChevronLeft size={12} />
                  {!isMobile && 'Anterior'}
                </button>

                <div style={{
                  display: 'flex',
                  gap: '5px',
                  alignItems: 'center'
                }}>
                  {Array.from({ length: Math.min(totalPaginas, isMobile ? 3 : 5) }, (_, i) => {
                    let pageNum;
                    if (totalPaginas <= (isMobile ? 3 : 5)) {
                      pageNum = i + 1;
                    } else if (paginaAtual <= (isMobile ? 2 : 3)) {
                      pageNum = i + 1;
                    } else if (paginaAtual >= totalPaginas - (isMobile ? 1 : 2)) {
                      pageNum = totalPaginas - (isMobile ? 2 : 4) + i;
                    } else {
                      pageNum = paginaAtual - (isMobile ? 1 : 2) + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => irParaPagina(pageNum)}
                        style={{
                          width: '35px',
                          height: '35px',
                          border: 'none',
                          borderRadius: '8px',
                          background: paginaAtual === pageNum ? '#04506B' : '#f3f4f6',
                          color: paginaAtual === pageNum ? '#fff' : '#374151',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: paginaAtual === pageNum ? 600 : 500,
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => proximaPagina(totalPaginas)}
                  disabled={paginaAtual === totalPaginas}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '8px 12px',
                    border: 'none',
                    borderRadius: '8px',
                    background: paginaAtual === totalPaginas ? '#e5e7eb' : '#04506B',
                    color: paginaAtual === totalPaginas ? '#9ca3af' : '#fff',
                    cursor: paginaAtual === totalPaginas ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: 500,
                    transition: 'all 0.2s ease'
                  }}
                >
                  {!isMobile && 'Próxima'}
                  <FaChevronRight size={12} />
                </button>
              </div>
            )}

            {/* Informações da paginação - Compacta */}
            <div style={{
              textAlign: 'center',
              color: '#6b7280',
              fontSize: isMobile ? '12px' : '13px',
              padding: isMobile ? '6px 20px 8px 20px' : '8px 20px 10px 20px',
              background: '#f8fafc',
              width: '100%',
              boxSizing: 'border-box',
              margin: '0',
              flexShrink: 0, // Impede que seja comprimido
              borderTop: '1px solid #e2e8f0'
            }}>
              Mostrando {Math.min((paginaAtual - 1) * itensPorPagina + 1, camerasFiltradas.length)} - {Math.min(paginaAtual * itensPorPagina, camerasFiltradas.length)} de {camerasFiltradas.length} câmeras
              <br />
              <span style={{ fontSize: '11px', opacity: 0.7 }}>
                📱 {itensPorPagina} itens por página (auto-ajustado para sua tela)
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
