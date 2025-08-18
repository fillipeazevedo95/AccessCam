import React, { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import { FaStore, FaCloud, FaIdBadge, FaGlobe, FaUser, FaKey, FaWifi, FaUnlink, FaEdit, FaTrash } from 'react-icons/fa';
import { MdWifiOff } from 'react-icons/md';
import { supabase } from './supabaseClient.ts';

export type Camera = {
  id: number;
  loja_numero: string;
  loja_nome: string;
  cloud: string;
  camera_id: string;
  ddns: string;
  porta_servico?: string;
  porta_web?: string;
  usuario: string;
  senha: string;
  tipo_conexao: 'cloud' | 'id' | 'ddns';
  status: 'online' | 'offline' | 'sem sinal';
};

const statusColors = {
  online: '#739577', // verde personalizado
  offline: '#CC7277', // vermelho personalizado
  'sem sinal': '#e5e7eb', // cinza claro
};

export default function CameraList() {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFiltro, setStatusFiltro] = useState<'all' | 'online' | 'offline' | 'sem sinal'>('all');
  const [search, setSearch] = useState<string>('');
  const [form, setForm] = useState<Partial<Camera>>({ tipo_conexao: 'cloud', status: 'offline' });
  const [editId, setEditId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);

  async function fetchCameras() {
    setLoading(true);
    const { data, error } = await supabase
      .from('cameras')
      .select('*');
    if (!error && data) setCameras(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchCameras();
  }, []);

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (editId) {
      await supabase.from('cameras').update(form).eq('id', editId);
    } else {
      await supabase.from('cameras').insert([{ ...form }]);
    }
    setForm({ tipo_conexao: 'cloud', status: 'offline' });
    setEditId(null);
    setShowModal(false);
    fetchCameras();
  }

  function handleEdit(cam: Camera) {
    setForm(cam);
    setEditId(cam.id);
    setShowModal(true);
  }

  async function handleDelete(id: number) {
    if (window.confirm('Deseja realmente excluir esta câmera?')) {
      await supabase.from('cameras').delete().eq('id', id);
      fetchCameras();
    }
  }

  return (
  <div style={{ minHeight: '100vh', background: '#f3f4f6', padding: 0, margin: 0 }}>
      {/* Header */}
  <header style={{ width: '100%', background: '#04506B', color: '#fff', padding: 0, boxShadow: '0 2px 8px #0002', position: 'sticky', top: 0, zIndex: 2000 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', padding: '12px 32px', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, background: '#fff', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              <img src="/images.png" alt="Logo" style={{ width: 36, height: 36, objectFit: 'contain' }} />
            </div>
            <span style={{ fontWeight: 700, fontSize: 24, letterSpacing: 1 }}>Câmeras Grupo Ginseng</span>
          </div>
        </div>
      </header>
  <div style={{ maxWidth: 1100, margin: '0 auto', padding: 32, paddingTop: 56 }}>
  {/* Título removido conforme solicitado */}
        {/* Busca por nome ou número da loja */}
        <div style={{ marginBottom: 28, width: '100%' }}>
          <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 12px #0001', padding: '18px 5vw', border: '1.5px solid #cbd5e1', minWidth: 260, width: '100%', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <input
              type="text"
              placeholder="Buscar por nome ou número da loja..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ padding: '12px 18px', borderRadius: 8, border: '1.5px solid #2563eb', background: '#f1f5f9', fontSize: 17, fontWeight: 500, color: '#2563eb', width: '100%', boxShadow: '0 1px 4px #0001', maxWidth: '100%', textAlign: 'center' }}
            />
          </div>
        </div>

        {/* Botão fixo de adicionar câmera */}
        <button
          onClick={() => { setShowModal(true); setForm({ tipo_conexao: 'cloud', status: 'offline' }); setEditId(null); }}
          style={{
            position: 'fixed',
            bottom: 32,
            right: 32,
            background: '#2563eb',
            color: '#fff',
            border: 0,
            borderRadius: '50%',
            width: 64,
            height: 64,
            fontWeight: 700,
            fontSize: 34,
            cursor: 'pointer',
            boxShadow: '0 4px 16px #0002',
            zIndex: 3000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s',
          }}
          title="Adicionar nova câmera"
        >
          +
        </button>
        {loading ? (
          <p style={{ textAlign: 'center', color: '#64748b', fontSize: 18 }}>Carregando...</p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'center', width: '100%' }}>
            {cameras
              .filter(cam => {
                const termo = search.toLowerCase();
                return (
                  cam.loja_nome.toLowerCase().includes(termo) ||
                  (cam.loja_numero && cam.loja_numero.toLowerCase().includes(termo))
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
                <div key={cam.id} style={{ background: statusColors[cam.status], borderRadius: 16, padding: 18, minWidth: 260, maxWidth: 280, minHeight: 320, flex: '1 1 260px', display: 'flex', flexDirection: 'column', gap: 14, position: 'relative', transition: 'background 0.3s', border: '1px solid #111' }}>
                  <div style={{ position: 'absolute', top: 18, right: 18, display: 'flex', gap: 10 }}>
                    <span
                      onClick={() => handleEdit(cam)}
                      title="Editar"
                      style={{ background: '#fbbf24', color: '#fff', border: '2px solid #eab308', borderRadius: '50%', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 15, boxShadow: '0 1px 4px #0002', transition: 'background 0.2s', padding: 0 }}
                    >
                      <FaEdit size={15} />
                    </span>
                    <span
                      onClick={() => handleDelete(cam.id)}
                      title="Excluir"
                      style={{ background: '#ef4444', color: '#fff', border: '2px solid #b91c1c', borderRadius: '50%', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 15, boxShadow: '0 1px 4px #0002', transition: 'background 0.2s', padding: 0 }}
                    >
                      <FaTrash size={15} />
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', marginBottom: 8 }}>
                    <span style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 38,
                      height: 38,
                      borderRadius: '50%',
                      background: cam.status === 'online' ? '#e0f7e9' : cam.status === 'offline' ? '#fde2e2' : '#fdf6e3',
                      border: '2px solid #e0e7ef',
                      boxShadow: '0 1px 4px #0001',
                      gap: 6,
                      marginRight: 10,
                    }}>
                      {cam.status === 'online' && <FaWifi color="#22c55e" size={22} title="Online" />}
                      {cam.status === 'offline' && <FaUnlink color="#ef4444" size={22} title="Offline" />}
                      {cam.status === 'sem sinal' && <MdWifiOff color="#eab308" size={24} title="Sem sinal" />}
                    </span>
                    <span style={{ fontWeight: 700, color: '#111', fontSize: 17, textTransform: 'capitalize' }}>{cam.status}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 2 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', borderRadius: 8, boxShadow: '0 1px 4px #0001', padding: '6px 10px', border: '1px solid #e0e7ef', color: '#334155', fontSize: 15, fontWeight: 500 }}>
                      <FaStore color="#2563eb" size={22} /> {cam.loja_nome}
                    </span>
                    {cam.loja_numero && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', borderRadius: 8, boxShadow: '0 1px 4px #0001', padding: '6px 10px', border: '1px solid #e0e7ef', color: '#334155', fontSize: 15, fontWeight: 500 }}>
                        <FaIdBadge color="#2563eb" size={22} /> Loja #{cam.loja_numero}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 15 }}>
                    {cam.cloud && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', borderRadius: 8, boxShadow: '0 1px 4px #0001', padding: '6px 10px', border: '1px solid #e0e7ef' }}><FaCloud color="#0ea5e9" size={22} /> <b>Cloud:</b> {cam.cloud}</span>
                    )}
                    {cam.camera_id && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', borderRadius: 8, boxShadow: '0 1px 4px #0001', padding: '6px 10px', border: '1px solid #e0e7ef' }}><FaIdBadge color="#6366f1" size={22} /> <b>ID:</b> {cam.camera_id}</span>
                    )}
                    {cam.ddns && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', borderRadius: 8, boxShadow: '0 1px 4px #0001', padding: '6px 10px', border: '1px solid #e0e7ef' }}><FaGlobe color="#16a34a" size={22} /> <b>DDNS:</b> {cam.ddns}</span>
                    )}
                    {cam.usuario && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', borderRadius: 8, boxShadow: '0 1px 4px #0001', padding: '6px 10px', border: '1px solid #e0e7ef' }}><FaUser color="#f59e42" size={22} /> <b>Usuário:</b> {cam.usuario}</span>
                    )}
                    {cam.senha && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', borderRadius: 8, boxShadow: '0 1px 4px #0001', padding: '6px 10px', border: '1px solid #e0e7ef' }}><FaKey color="#eab308" size={22} /> <b>Senha:</b> {cam.senha}</span>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
