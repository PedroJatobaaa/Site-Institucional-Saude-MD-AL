"use client";

import React, { useState, useEffect } from 'react';
import { Users, Shield, AlertCircle, Edit, X, CheckCircle, Search, KeyRound } from 'lucide-react';
import Link from 'next/link';
import UnidadeLotacaoSelect from '@/components/UnidadeLotacaoSelect';
import {
  aoMudarNivelLotacao,
  hidratarLotacao,
  lotacaoCompleta,
} from '@/lib/usuarios/lotacao';
import { getToken } from '@/lib/auth/session';
import { FILAS_PRODUCAO } from '@/lib/producao/filasProducao';

// Definimos as caixinhas (módulos) que você poderá liberar no sistema
const permissoesDisponiveis = [
  { id: 'mural_avisos', nome: 'Gerenciar Mural de Avisos' },
  { id: 'documentos_leitura', nome: 'Acessar Repositório (Download)' },
  { id: 'documentos_gerenciar', nome: 'Gerenciar Repositório (Upload/Excluir)' },
  { id: 'sistemas_esus', nome: 'Acesso Restrito ao e-SUS / PEC' },
  { id: 'upa_acesso', nome: 'Acessar Módulo UPA' },
  { id: 'central_marcacoes', nome: 'Acesso à Central das Marcações'},
  { id: 'ROLE_UBS', nome: 'Produções — UBS (envio)' },
  { id: 'ROLE_PROCESSAMENTO', nome: 'Produções — Processamento de Dados' },
  { id: 'profissionais_gerenciar', nome: 'Cadastro de Profissionais (CRUD)' },
  { id: 'invig', nome: 'Acesso ao INVIG'},
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
  const [loadingSenha, setLoadingSenha] = useState(false); // Para o botão de redefinir senha

  // 1. Busca os usuários quando a página carrega
  useEffect(() => {
    carregarUsuarios();
  }, []);

  useEffect(() => {
    if (!modalAberto) return;
    const scrollAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = scrollAnterior;
    };
  }, [modalAberto]);

  const carregarUsuarios = async () => {
    try {
      const token = getToken();

      const res = await fetch('/api/admin/usuarios', {
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
    const lotacao = hidratarLotacao(usuario);
    setUserEditando({
      ...usuario,
      nivelLotacao: lotacao.nivelLotacao,
      unidadeLotacao: lotacao.unidadeLotacao,
      permissoesProducao: Array.isArray(usuario.permissoesProducao)
        ? usuario.permissoesProducao
        : [],
    });
    setModalAberto(true);
  };

  const temPermissaoEnvioProducao = (permissoes: string[] = []) =>
    permissoes.includes('ROLE_UBS');

  // 3. Marca/Desmarca a caixinha de permissão no estado local
  const togglePermissao = (idPermissao: string) => {
    const temPermissao = userEditando.permissoes.includes(idPermissao);
    let novasPermissoes;

    if (temPermissao) {
      novasPermissoes = userEditando.permissoes.filter((p: string) => p !== idPermissao);
    } else {
      novasPermissoes = [...userEditando.permissoes, idPermissao];
    }

    const atualizacao: Record<string, unknown> = { ...userEditando, permissoes: novasPermissoes };

    if (idPermissao === 'ROLE_UBS' && temPermissao) {
      atualizacao.permissoesProducao = [];
    }

    setUserEditando(atualizacao);
  };

  const togglePermissaoProducao = (filaId: string) => {
    const atuais: string[] = userEditando.permissoesProducao || [];
    const novas = atuais.includes(filaId)
      ? atuais.filter((id) => id !== filaId)
      : [...atuais, filaId];
    setUserEditando({ ...userEditando, permissoesProducao: novas });
  };

  // 4. Salva as alterações no Backend
  const salvarAlteracoes = async () => {
    if (!lotacaoCompleta(userEditando.nivelLotacao, userEditando.unidadeLotacao)) {
      alert('Selecione a categoria e a unidade de lotação.');
      return;
    }

    const envioProducaoAtivo = temPermissaoEnvioProducao(userEditando.permissoes);
    const filasSelecionadas: string[] = userEditando.permissoesProducao || [];

    if (envioProducaoAtivo && filasSelecionadas.length === 0) {
      alert('Selecione ao menos uma fila de envio (Unidade + Sistema) para o usuário de produções.');
      return;
    }

    try {
      const token = getToken();

      const res = await fetch(`/api/admin/usuarios/${userEditando.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: userEditando.status,
          permissoes: userEditando.permissoes,
          nivel_lotacao: userEditando.nivelLotacao,
          unidade_lotacao: userEditando.unidadeLotacao,
          permissoes_producao: envioProducaoAtivo ? filasSelecionadas : [],
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

  // 5. NOVA FUNÇÃO: Forçar redefinição de senha
  const forcarRedefinicaoSenha = async () => {
    if(!window.confirm(`Tem certeza que deseja resetar a senha de ${userEditando.nome}? A senha será apagada e alterada para o padrão do sistema.`)) {
      return;
    }

    setLoadingSenha(true);
    try {
      const token = getToken();
      const res = await fetch(`/api/admin/usuarios/${userEditando.id}/forcar-senha`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        // Exibe a senha padrão na tela para o administrador saber qual informar ao usuário
        setMensagem('✅ Senha resetada para: Saude@123. O usuário deve usá-la no próximo acesso.');
        setTimeout(() => setMensagem(''), 8000); // Deixei 8 segundos na tela para dar tempo de ler
      } else {
        const erro = await res.json();
        alert(`Erro: ${erro.erro || 'Falha na requisição'}`);
      }
    } catch (error) {
      alert("Erro de conexão ao tentar redefinir senha.");
    } finally {
      setLoadingSenha(false);
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
                          {user.nivelLotacao || user.unidadeLotacao || user.unidade ? (
                            <span className="text-slate-400 font-medium">
                              {' '}&bull; {user.nivelLotacao || '—'}
                              {(user.unidadeLotacao || user.unidade) && (
                                <> &mdash; {user.unidadeLotacao || user.unidade}</>
                              )}
                            </span>
                          ) : ''}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
          <button
            type="button"
            aria-label="Fechar"
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setModalAberto(false)}
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-gerenciar-titulo"
            className="relative z-10 flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            style={{ height: 'min(92dvh, 780px)' }}
          >
            
            {/* Header do Modal */}
            <div className="shrink-0 border-b border-slate-100 bg-slate-50 px-4 py-3 sm:px-5 sm:py-4 flex justify-between items-start gap-3">
              <div className="min-w-0">
                <h3 id="modal-gerenciar-titulo" className="text-lg font-bold text-slate-800">Gerenciar Acessos</h3>
                <p className="text-sm text-slate-500 mt-0.5 truncate">
                  Editando: <span className="font-semibold text-slate-700">{userEditando.nome}</span>
                  {userEditando.unidadeLotacao && (
                    <span className="text-slate-400"> ({userEditando.unidadeLotacao})</span>
                  )}
                </p>
              </div>
              <button onClick={() => setModalAberto(false)} className="shrink-0 text-slate-400 hover:text-slate-600 p-1 bg-white rounded-lg shadow-sm">
                <X size={22} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5 space-y-4">
              
              {/* Seção 1: Segurança e Status (Lado a Lado) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 mb-2 uppercase tracking-wider">Situação da Conta</h4>
                  <select 
                    value={userEditando.status}
                    onChange={(e) => setUserEditando({...userEditando, status: e.target.value})}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-blue-600 outline-none font-medium text-slate-700 text-sm"
                  >
                    <option value="PENDENTE">Em Análise (Pendente)</option>
                    <option value="APROVADO">Acesso Liberado (Aprovado)</option>
                    <option value="BLOQUEADO">Acesso Revogado (Bloqueado)</option>
                  </select>
                </div>

                <div>
                   <h4 className="text-xs font-bold text-slate-800 mb-2 uppercase tracking-wider">Segurança</h4>
                   <button
                    type="button"
                    onClick={forcarRedefinicaoSenha}
                    disabled={loadingSenha}
                    className="w-full flex items-center justify-center gap-2 p-2.5 border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl font-bold text-sm transition-colors disabled:opacity-70"
                   >
                     <KeyRound size={16} />
                     {loadingSenha ? 'Processando...' : 'Exigir Nova Senha'}
                   </button>
                   <p className="text-[10px] text-slate-400 mt-1 text-center">
                     O usuário será forçado a trocar a senha no próximo login.
                   </p>
                </div>
              </div>

              {/* Seção 2: Unidade de Lotação */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 mb-2 uppercase tracking-wider">Unidade de Lotação</h4>
                <UnidadeLotacaoSelect
                  required
                  compact
                  showIcon={false}
                  nivelLotacao={userEditando.nivelLotacao || ''}
                  unidadeLotacao={userEditando.unidadeLotacao || ''}
                  selectClassName="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-blue-600 outline-none font-medium text-slate-700 appearance-none text-sm"
                  labelClassName="block text-xs font-bold text-slate-600 uppercase mb-1"
                  onNivelChange={(nivel) => {
                    const lotacao = aoMudarNivelLotacao(nivel);
                    setUserEditando({
                      ...userEditando,
                      nivelLotacao: lotacao.nivelLotacao,
                      unidadeLotacao: lotacao.unidadeLotacao,
                    });
                  }}
                  onUnidadeChange={(unidade) =>
                    setUserEditando({ ...userEditando, unidadeLotacao: unidade })
                  }
                />
              </div>

              {/* Seção 3: Permissões de Módulos */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 mb-2 uppercase tracking-wider">Módulos Liberados</h4>
                <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-2 max-h-[16rem] overflow-y-auto">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {permissoesDisponiveis.map((perm) => {
                      if (perm.id === 'ROLE_UBS') {
                        const envioAtivo = temPermissaoEnvioProducao(userEditando.permissoes);
                        const filasMarcadas = (userEditando.permissoesProducao || []).length;

                        return (
                          <div key={perm.id} className="sm:col-span-2 space-y-2">
                            <label
                              className={`flex items-start gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                                envioAtivo
                                  ? 'bg-blue-50 border-blue-200'
                                  : 'bg-white border-slate-200 hover:border-blue-100'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={envioAtivo}
                                onChange={() => togglePermissao(perm.id)}
                                className="mt-0.5 w-4 h-4 text-blue-600 rounded focus:ring-blue-500 shrink-0"
                              />
                              <span className="min-w-0">
                                <span
                                  className={`block text-xs font-medium leading-snug ${
                                    envioAtivo ? 'text-blue-900' : 'text-slate-600'
                                  }`}
                                >
                                  {perm.nome}
                                </span>
                                {envioAtivo && (
                                  <span className="block text-[10px] text-blue-600 mt-0.5">
                                    {filasMarcadas > 0
                                      ? `${filasMarcadas} fila(s) selecionada(s)`
                                      : 'Selecione abaixo por qual fila enviar'}
                                  </span>
                                )}
                              </span>
                            </label>

                            {envioAtivo && (
                              <div className="ml-4 sm:ml-6 pl-3 border-l-2 border-emerald-300 space-y-2">
                                <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                                  Filas de envio permitidas
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50/60 p-2 max-h-[9rem] overflow-y-auto">
                                  {FILAS_PRODUCAO.map((fila) => {
                                    const selecionada = (userEditando.permissoesProducao || []).includes(
                                      fila.id
                                    );
                                    return (
                                      <label
                                        key={fila.id}
                                        className={`flex items-start gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                                          selecionada
                                            ? 'bg-emerald-100 border-emerald-300'
                                            : 'bg-white border-slate-200 hover:border-emerald-200'
                                        }`}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={selecionada}
                                          onChange={() => togglePermissaoProducao(fila.id)}
                                          className="mt-0.5 w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 shrink-0"
                                        />
                                        <span className="min-w-0">
                                          <span
                                            className={`block text-xs font-bold leading-snug ${
                                              selecionada ? 'text-emerald-900' : 'text-slate-700'
                                            }`}
                                          >
                                            {fila.unidade}
                                          </span>
                                          <span
                                            className={`block text-[10px] font-medium ${
                                              selecionada ? 'text-emerald-700' : 'text-slate-500'
                                            }`}
                                          >
                                            via {fila.sistema}
                                          </span>
                                        </span>
                                      </label>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      }

                      return (
                        <label
                          key={perm.id}
                          className={`flex items-start gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                            userEditando.permissoes.includes(perm.id)
                              ? 'bg-blue-50 border-blue-200'
                              : 'bg-white border-slate-200 hover:border-blue-100'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={userEditando.permissoes.includes(perm.id)}
                            onChange={() => togglePermissao(perm.id)}
                            className="mt-0.5 w-4 h-4 text-blue-600 rounded focus:ring-blue-500 shrink-0"
                          />
                          <span
                            className={`text-xs font-medium leading-snug ${
                              userEditando.permissoes.includes(perm.id)
                                ? 'text-blue-900'
                                : 'text-slate-600'
                            }`}
                          >
                            {perm.nome}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer do Modal */}
            <div className="shrink-0 border-t border-slate-100 bg-slate-50 px-4 py-3 sm:px-5 flex justify-end gap-2">
              <button onClick={() => setModalAberto(false)} className="px-4 py-2 text-sm text-slate-600 font-medium hover:bg-slate-200 rounded-xl transition-colors">
                Cancelar
              </button>
              <button onClick={salvarAlteracoes} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-sm transition-colors flex items-center gap-2">
                <CheckCircle size={16} /> Salvar Alterações
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}