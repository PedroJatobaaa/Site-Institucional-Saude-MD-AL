"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Megaphone, Trash2, PlusCircle, ArrowLeft, Link as LinkIcon, Building2, Filter, AlignLeft } from 'lucide-react';
import { getToken, getUsuario } from '@/lib/auth/session';

export default function PainelAvisos() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<any>(null);
  
  const [avisos, setAvisos] = useState<any[]>([]);
  const [coordenacoes, setCoordenacoes] = useState<any[]>([]);
  
  // Estados do formulário (CRIAR)
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState(''); // <-- NOVO ESTADO AQUI
  const [linkAnexo, setLinkAnexo] = useState('');
  const [coordenacaoId, setCoordenacaoId] = useState('');
  
  // Estado do Filtro
  const [filtroCoord, setFiltroCoord] = useState('todas');

  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState({ texto: '', tipo: '' });

  // 1. Verificação de Segurança
  useEffect(() => {
    const userObj = getUsuario();
    if (!userObj) {
      router.push('/login');
      return;
    }
    if (!userObj.permissoes?.includes('mural_avisos') && !userObj.permissoes?.includes('admin')) {
      alert("Você não tem permissão para acessar este módulo.");
      router.push('/painel');
      return;
    }

    setUsuario(userObj);
    carregarDados();
  }, []);

  // 2. Busca os dados
  const carregarDados = async () => {
    try {
      const resAvisos = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/avisos`);
      const dadosAvisos = await resAvisos.json();
      if (Array.isArray(dadosAvisos)) setAvisos(dadosAvisos);

      const resCoords = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/coordenacoes`);
      const dadosCoords = await resCoords.json();
      if (Array.isArray(dadosCoords)) setCoordenacoes(dadosCoords);
    } catch (error) {
      console.error("Erro ao carregar dados", error);
    }
  };

  // 3. Função para PUBLICAR (Criar)
  const handlePublicar = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMensagem({ texto: '', tipo: '' });

    const token = getToken();

    try {
      const resposta = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/avisos`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        // Enviando a descrição junto com os outros dados!
        body: JSON.stringify({ titulo, descricao, link_anexo: linkAnexo, coordenacaoId })
      });

      const dados = await resposta.json();

      if (resposta.ok) {
        setMensagem({ texto: 'Aviso publicado com sucesso no portal!', tipo: 'sucesso' });
        // Limpando o formulário após o sucesso
        setTitulo(''); setDescricao(''); setLinkAnexo(''); setCoordenacaoId('');
        
        setFiltroCoord('todas'); 
        carregarDados();
        setTimeout(() => setMensagem({ texto: '', tipo: '' }), 4000);
      } else {
        setMensagem({ texto: dados.erro, tipo: 'erro' });
      }
    } catch (error) {
      setMensagem({ texto: 'Erro de conexão com o servidor.', tipo: 'erro' });
    } finally {
      setLoading(false);
    }
  };

  // 4. Função para APAGAR (Deletar)
  const handleDeletar = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja apagar este aviso do portal?")) return;

    const token = getToken();

    try {
      const resposta = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/avisos/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (resposta.ok) {
        carregarDados(); 
      } else {
        const dadosErro = await resposta.json();
        alert(`O Servidor recusou: ${dadosErro.erro}`);
      }
    } catch (error) {
      alert("Erro de conexão com o servidor.");
    }
  };

  const avisosFiltrados = filtroCoord === 'todas' 
    ? avisos 
    : avisos.filter(aviso => 
        String(aviso.coordenacao?.id) === String(filtroCoord) || 
        String(aviso.coordenacaoId) === String(filtroCoord)
      );
      
  if (!usuario) return null;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/painel" className="text-slate-400 hover:text-blue-600 bg-white p-2 rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
                <ArrowLeft size={20} />
              </Link>
              <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
                <Megaphone className="text-blue-600" size={32} />
                Mural de Avisos
              </h1>
            </div>
            <p className="text-slate-500 ml-12">Publique e gerencie comunicados oficiais no portal.</p>
          </div>
        </div>

        {mensagem.texto && (
          <div className={`p-4 rounded-xl font-bold flex items-center gap-2 ${mensagem.tipo === 'sucesso' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
            {mensagem.texto}
          </div>
        )}

        {/* Área Principal dividida em 2 colunas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* COLUNA ESQUERDA: Formulário de Adicionar */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 sticky top-24">
              <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <PlusCircle size={20} className="text-blue-600" />
                Novo Comunicado
              </h2>

              <form onSubmit={handlePublicar} className="space-y-4">
                
                {/* O Título agora é um input normal */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Título do Aviso *</label>
                  <input 
                    required 
                    type="text"
                    value={titulo} 
                    onChange={(e) => setTitulo(e.target.value)} 
                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none text-sm" 
                    placeholder="Ex: Convocação para vacinação..." 
                  />
                </div>

                {/* NOVO CAMPO: DESCRIÇÃO */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <AlignLeft size={14} /> Descrição (Opcional)
                  </label>
                  <textarea 
                    value={descricao} 
                    onChange={(e) => setDescricao(e.target.value)} 
                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none text-sm resize-none h-24" 
                    placeholder="Detalhes adicionais do comunicado..." 
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <LinkIcon size={14} /> Link / Anexo
                  </label>
                  <input 
                    type="url" 
                    value={linkAnexo} 
                    onChange={(e) => setLinkAnexo(e.target.value)} 
                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none text-sm" 
                    placeholder="https://..." 
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Building2 size={14} /> Coordenação *
                  </label>
                  <select 
                    required 
                    value={coordenacaoId} 
                    onChange={(e) => setCoordenacaoId(e.target.value)} 
                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none text-sm font-medium bg-white"
                  >
                    <option value="" disabled>Selecione a origem...</option>
                    {coordenacoes.map((coord) => (
                      <option key={coord.id} value={coord.id}>{coord.nome}</option>
                    ))}
                  </select>
                </div>

                <button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors disabled:opacity-70 mt-4 shadow-md"
                >
                  {loading ? 'Publicando...' : 'Publicar Aviso'}
                </button>
              </form>
            </div>
          </div>

          {/* COLUNA DIREITA: Lista de Avisos com FILTRO */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              
              <div className="p-4 sm:p-6 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  Gerenciar Avisos
                  <span className="bg-blue-100 text-blue-700 text-xs py-0.5 px-2 rounded-full">{avisosFiltrados.length}</span>
                </h2>
                
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Filter size={16} className="text-slate-400" />
                  <select 
                    value={filtroCoord}
                    onChange={(e) => setFiltroCoord(e.target.value)}
                    className="w-full sm:w-auto p-2 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-600 outline-none bg-white text-slate-700"
                  >
                    <option value="todas">Todas as Coordenações</option>
                    {coordenacoes.map((coord) => (
                      <option key={coord.id} value={coord.id}>{coord.sigla} - {coord.nome}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                {avisosFiltrados.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 font-medium">
                    Nenhum aviso encontrado para este filtro.
                  </div>
                ) : (
                  avisosFiltrados.map((aviso) => (
                    <div key={aviso.id} className="p-6 flex items-start justify-between gap-4 hover:bg-slate-50/80 transition-colors group">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-blue-100 text-blue-700 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md tracking-wider">
                            {aviso.coordenacao?.sigla || 'Geral'}
                          </span>
                          <span className="text-xs font-medium text-slate-400">
                            {new Date(aviso.data_publicacao).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        
                        <h3 className="font-bold text-slate-800 leading-snug text-lg">{aviso.titulo}</h3>
                        
                        {/* A DESCRIÇÃO AGORA APARECE AQUI */}
                        {aviso.descricao && (
                          <p className="text-sm text-slate-600 mt-2 whitespace-pre-line leading-relaxed">
                            {aviso.descricao}
                          </p>
                        )}

                        {aviso.link_anexo && (
                          <a href={aviso.link_anexo} target="_blank" rel="noreferrer" className="text-sm font-semibold text-blue-600 hover:underline mt-3 inline-flex items-center gap-1">
                            <LinkIcon size={14} /> Acessar Anexo
                          </a>
                        )}
                      </div>
                      
                      <button 
                        onClick={() => handleDeletar(aviso.id)} 
                        className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all flex-shrink-0"
                        title="Apagar Aviso"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}