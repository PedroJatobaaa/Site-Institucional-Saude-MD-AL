"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  FileText, Download, Trash2, UploadCloud, 
  ArrowLeft, Search, File, FileCode, FileSpreadsheet 
} from 'lucide-react';

export default function RepositorioDocumentos() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<any>(null);
  const [documentos, setDocumentos] = useState<any[]>([]);
  const [busca, setBusca] = useState('');
  
  // Controle do Modal de Upload
  const [modalAberto, setModalAberto] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Estados do Formulário
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [arquivo, setArquivo] = useState<File | null>(null);

  useEffect(() => {
    const userSalvo = localStorage.getItem('saude_usuario');
    if (!userSalvo) {
      router.push('/acesso');
      return;
    }

    const userObj = JSON.parse(userSalvo);
    // Verifica se tem permissão básica de leitura
    if (!userObj.permissoes?.includes('documentos_leitura') && !userObj.permissoes?.includes('admin')) {
      alert("Você não tem permissão para acessar o repositório.");
      router.push('/painel');
      return;
    }

    setUsuario(userObj);
    carregarDocumentos(localStorage.getItem('saude_token') || '');
  }, []);

  const carregarDocumentos = async (token: string) => {
    try {
      const res = await fetch('/api/documentos', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dados = await res.json();
      if (Array.isArray(dados)) setDocumentos(dados);
    } catch (error) {
      console.error("Erro ao carregar documentos", error);
    }
  };

  // ==========================================
  // FUNÇÃO DE UPLOAD (Usando FormData)
  // ==========================================
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!arquivo) return alert("Selecione um arquivo primeiro!");

    setLoading(true);
    const token = localStorage.getItem('saude_token');

    // Aqui está a mágica: FormData em vez de JSON!
    const formData = new FormData();
    formData.append('titulo', titulo);
    formData.append('descricao', descricao);
    formData.append('arquivo', arquivo); // Anexa o arquivo físico

    try {
      const res = await fetch('/api/documentos', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }, // ATENÇÃO: Não colocamos 'Content-Type' aqui. O navegador faz isso automático com FormData.
        body: formData
      });

      if (res.ok) {
        alert("Arquivo enviado com sucesso!");
        setModalAberto(false);
        setTitulo(''); setDescricao(''); setArquivo(null);
        carregarDocumentos(token || '');
      } else {
        const erro = await res.json();
        alert(erro.erro || "Falha ao enviar arquivo.");
      }
    } catch (error) {
      alert("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletar = async (id: number) => {
    if (!window.confirm("Deseja realmente excluir este arquivo do servidor?")) return;
    const token = localStorage.getItem('saude_token');

    try {
      const res = await fetch(`/api/documentos/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        carregarDocumentos(token || '');
      } else {
        alert("Erro ao tentar apagar.");
      }
    } catch (error) {
      alert("Erro de conexão.");
    }
  };

  // Funções Utilitárias para o Visual
  const formatarTamanho = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const tamanhos = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + tamanhos[i];
  };

  const iconePorExtensao = (extensao: string) => {
    if (extensao.includes('pdf')) return <FileText className="text-red-500" size={24} />;
    if (extensao.includes('xls') || extensao.includes('csv')) return <FileSpreadsheet className="text-emerald-500" size={24} />;
    if (extensao.includes('doc')) return <FileCode className="text-blue-500" size={24} />;
    return <File className="text-slate-500" size={24} />;
  };

  if (!usuario) return null;

  // Lógica de Permissão Dupla
  const podeGerenciar = usuario.permissoes?.includes('documentos_gerenciar') || usuario.permissoes?.includes('admin');
  
  // Filtro de Busca
  const documentosFiltrados = documentos.filter(doc => 
    doc.titulo.toLowerCase().includes(busca.toLowerCase()) || 
    (doc.descricao && doc.descricao.toLowerCase().includes(busca.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* CABEÇALHO */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link href="/painel" className="text-slate-400 hover:text-blue-600 bg-white p-2 rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
                <UploadCloud className="text-blue-600" size={32} />
                Repositório Digital
              </h1>
              <p className="text-slate-500 mt-1">Documentos, ofícios e manuais da Secretaria de Saúde.</p>
            </div>
          </div>
          
          {podeGerenciar && (
            <button 
              onClick={() => setModalAberto(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-md flex items-center gap-2"
            >
              <UploadCloud size={20} /> Novo Documento
            </button>
          )}
        </div>

        {/* BARRA DE BUSCA E LISTAGEM */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50">
            <h2 className="text-lg font-bold text-slate-800">Arquivos Disponíveis ({documentosFiltrados.length})</h2>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Buscar arquivo..." 
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 outline-none" 
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="p-4 font-semibold w-12"></th>
                  <th className="p-4 font-semibold">Nome do Arquivo</th>
                  <th className="p-4 font-semibold">Tamanho / Tipo</th>
                  <th className="p-4 font-semibold">Enviado em</th>
                  <th className="p-4 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {documentosFiltrados.length === 0 ? (
                  <tr><td colSpan={5} className="p-12 text-center text-slate-400">Nenhum arquivo encontrado.</td></tr>
                ) : (
                  documentosFiltrados.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="p-4 text-center">{iconePorExtensao(doc.tipo_extensao)}</td>
                      <td className="p-4">
                        <div className="font-bold text-slate-800">{doc.titulo}</div>
                        <div className="text-sm text-slate-500 truncate max-w-md">{doc.descricao}</div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded-md uppercase tracking-wider text-[10px]">
                          {doc.tipo_extensao}
                        </span>
                        <div className="text-xs text-slate-400 mt-1">{formatarTamanho(doc.tamanho)}</div>
                      </td>
                      <td className="p-4 text-sm text-slate-500">
                        {new Date(doc.data_cadastro).toLocaleDateString('pt-BR')}
                        <div className="text-xs mt-1">por {doc.criado_por_nome || 'Admin'}</div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <a 
                            href={doc.url_caminho} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            download
                            className="p-2 text-blue-600 hover:bg-blue-50 bg-slate-50 rounded-lg transition-colors font-medium text-sm flex items-center gap-2"
                          >
                            <Download size={16} /> Baixar
                          </a>
                          
                          {podeGerenciar && (
                            <button 
                              onClick={() => handleDeletar(doc.id)} 
                              className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL DE UPLOAD */}
      {modalAberto && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <UploadCloud size={24} className="text-blue-600" />
                Enviar Novo Arquivo
              </h3>
            </div>

            <form onSubmit={handleUpload} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Título do Documento *</label>
                <input 
                  required type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none" 
                  placeholder="Ex: Formulário de Férias 2026" 
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Breve Descrição</label>
                <textarea 
                  value={descricao} onChange={(e) => setDescricao(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none resize-none h-20" 
                  placeholder="Do que se trata este documento?" 
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Anexar Arquivo *</label>
                <input 
                  required type="file" 
                  onChange={(e) => setArquivo(e.target.files ? e.target.files[0] : null)}
                  className="w-full p-2 border border-slate-200 text-slate-600 rounded-xl file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button type="button" onClick={() => setModalAberto(false)} className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={loading} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-colors disabled:opacity-70 flex items-center gap-2">
                  {loading ? 'Enviando...' : <><UploadCloud size={18} /> Salvar Arquivo</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}