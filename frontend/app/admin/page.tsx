"use client";

import React, { useState, useEffect } from 'react';
import { Users, Shield, AlertCircle, Edit, X, CheckCircle, Search } from 'lucide-react';
import Link from 'next/link';

// Definimos as caixinhas (módulos) que você poderá liberar no sistema
const permissoesDisponiveis = [
  { id: 'mural_avisos', nome: 'Gerenciar Mural de Avisos' },
  { id: 'documentos_leitura', nome: 'Acessar Repositório (Download)' },
  { id: 'documentos_gerenciar', nome: 'Gerenciar Repositório (Upload/Excluir)' },
  { id: 'indicadores', nome: 'Visualizar Indicadores de Saúde' },
  { id: 'sistemas_esus', nome: 'Acesso Restrito ao e-SUS / PEC' },
  { id: 'rh', nome: 'Módulo de Recursos Humanos' },
  { id: 'upa_acesso', nome: 'Acessar Módulo UPA' },
  { id: 'admin', nome: 'Acesso Total (Administrador)' }
];

export default function PainelAdmin() {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Controle da Janela Modal de Edição
  const [modalAberto, setModalAberto] = useState(false);
  const [userEditando, setUserEditando] = useState<any>(null);
  
  // Feedback visual
  const [mensagem, setMensagem] = useState('');

  // 1. Busca os usuários quando a página carrega
  useEffect(() => {
    carregarUsuarios();
  }, []);

  const carregarUsuarios = async () => {
    try {
      const token = localStorage.getItem('saude_token');

      const res = await fetch('http://localhost:3333/api/admin/usuarios', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const dados = await res.json();

      if (Array.isArray(dados)) {
        setUsuarios(dados);
      } else {
        console.error("O backend retornou algo inesperado:", dados);
        setUsuarios([]); 
      }
    } catch (error) {
      console.error("Erro de conexão com o backend", error);
      setUsuarios([]);
    } finally {
      setLoading(false);
    }
  };

  // 2. Abre a janela para editar um usuário específico
  const abrirEdicao = (usuario: any) => {
    setUserEditando({ ...usuario });
    setModalAberto(true);
  };

  // 3. Marca/Desmarca a caixinha de permissão no estado local
  const togglePermissao = (idPermissao: string) => {
    const temPermissao = userEditando.permissoes.includes(idPermissao);
    let novasPermissoes;

    if (temPermissao) {
      novasPermissoes = userEditando.permissoes.filter((p: string) => p !== idPermissao);
    } else {
      novasPermissoes = [...userEditando.permissoes, idPermissao];
    }
    setUserEditando({ ...userEditando, permissoes: novasPermissoes });
  };

  // 4. Salva as alterações no Backend
  const salvarAlteracoes = async () => {
    try {
      const token = localStorage.getItem('saude_token');

      const res = await fetch(`http://localhost:3333/api/admin/usuarios/${userEditando.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: userEditando.status,
          permissoes: userEditando.permissoes
        })
      });

      if (res.ok) {
        setMensagem('Acessos atualizados com sucesso!');
        setModalAberto(false);
        carregarUsuarios(); 
        setTimeout(() => setMensagem(''), 3000); 
      } else {
        const dadosErro = await res.json();
        alert(`Erro: ${dadosErro.erro}`);
      }
    } catch (error) {
      alert("Erro ao salvar alterações.");
    }
  };

  // Função para renderizar as "etiquetas" coloridas de status
  const badgeStatus = (status: string) => {
    switch (status) {
      case 'PENDENTE': return <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-max"><AlertCircle size={14}/> Pendente</span>;
      case 'APROVADO': return <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-max"><CheckCircle size={14}/> Aprovado</span>;
      case 'BLOQUEADO': return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold w-max">Bloqueado</span>;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      
      <div className="max-w-7xl mx-auto">
        {/* Cabeçalho do Painel */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
              <Shield className="text-blue-600" size={32} />
              Painel de Controle
            </h1>
            <p className="text-slate-500 mt-1">Gerenciamento de acessos e permissões do sistema.</p>
          </div>
          <Link href="/painel" className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors font-medium text-sm">
            Voltar ao Site
          </Link>
        </div>

        {mensagem && (
          <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl flex items-center gap-2 font-medium animate-pulse">
            <CheckCircle size={20} /> {mensagem}
          </div>
        )}

        {/* Tabela de Usuários */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Users size={20} className="text-blue-500" /> Usuários Cadastrados
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input type="text" placeholder="Buscar usuário..." className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 outline-none w-64" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="p-4 font-semibold">Nome / Lotação</th>
                  <th className="p-4 font-semibold">Contato / CPF</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">Permissões</th>
                  <th className="p-4 font-semibold text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={5} className="p-8 text-center text-slate-400">Carregando usuários...</td></tr>
                ) : usuarios.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-slate-400">Nenhum usuário encontrado.</td></tr>
                ) : (
                  usuarios.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* COLUNA 1: NOME, CARGO E UNIDADE */}
                      <td className="p-4">
                        <div className="font-bold text-slate-800">{user.nome}</div>
                        <div className="text-sm text-slate-500 mt-0.5">
                          {user.cargo} 
                          {user.unidade ? <span className="text-slate-400 font-medium"> &bull; {user.unidade}</span> : ''}
                        </div>
                      </td>
                      
                      {/* COLUNA 2: E-MAIL E CPF */}
                      <td className="p-4">
                        <div className="text-sm text-slate-700 font-medium">{user.email}</div>
                        {user.cpf ? (
                          <div className="text-xs text-slate-400 mt-0.5 font-mono">CPF: {user.cpf}</div>
                        ) : (
                          <div className="text-[10px] text-slate-400 mt-0.5 italic uppercase tracking-wider">CPF não informado</div>
                        )}
                      </td>

                      <td className="p-4">{badgeStatus(user.status)}</td>
                      <td className="p-4 text-sm text-slate-500">
                        {user.permissoes.length > 0 
                          ? <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded font-medium">{user.permissoes.length} módulos</span>
                          : <span className="text-slate-400 italic">Sem acesso</span>}
                      </td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => abrirEdicao(user)}
                          className="text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 p-2 rounded-lg transition-colors flex items-center gap-2 ml-auto text-sm font-medium"
                        >
                          <Edit size={16} /> Gerenciar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL DE EDIÇÃO */}
      {modalAberto && userEditando && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header do Modal */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Gerenciar Acessos</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Editando: <span className="font-semibold text-slate-700">{userEditando.nome}</span>
                  {userEditando.unidade && <span className="text-slate-400"> ({userEditando.unidade})</span>}
                </p>
              </div>
              <button onClick={() => setModalAberto(false)} className="text-slate-400 hover:text-slate-600 p-1 bg-white rounded-lg shadow-sm">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-8">
              {/* Seção 1: Status */}
              <div>
                <h4 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider">Situação da Conta</h4>
                <select 
                  value={userEditando.status}
                  onChange={(e) => setUserEditando({...userEditando, status: e.target.value})}
                  className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-blue-600 outline-none font-medium text-slate-700"
                >
                  <option value="PENDENTE">Em Análise (Pendente)</option>
                  <option value="APROVADO">Acesso Liberado (Aprovado)</option>
                  <option value="BLOQUEADO">Acesso Revogado (Bloqueado)</option>
                </select>
              </div>

              {/* Seção 2: Permissões */}
              <div>
                <h4 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider">Módulos Liberados</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {permissoesDisponiveis.map((perm) => (
                    <label 
                      key={perm.id} 
                      className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${userEditando.permissoes.includes(perm.id) ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-white border-slate-200 hover:border-blue-100'}`}
                    >
                      <input 
                        type="checkbox" 
                        checked={userEditando.permissoes.includes(perm.id)}
                        onChange={() => togglePermissao(perm.id)}
                        className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className={`text-sm font-medium ${userEditando.permissoes.includes(perm.id) ? 'text-blue-900' : 'text-slate-600'}`}>
                        {perm.nome}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer do Modal */}
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button onClick={() => setModalAberto(false)} className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-200 rounded-xl transition-colors">
                Cancelar
              </button>
              <button onClick={salvarAlteracoes} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-sm transition-colors flex items-center gap-2">
                <CheckCircle size={18} /> Salvar Alterações
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}