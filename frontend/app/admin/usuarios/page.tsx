"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Users, AlertCircle, Edit, X, CheckCircle, Search, KeyRound, ChevronLeft, ChevronRight } from 'lucide-react';
import UnidadeLotacaoSelect from '@/components/UnidadeLotacaoSelect';
import {
  aoMudarNivelLotacao,
  hidratarLotacao,
  lotacaoCompleta,
} from '@/lib/usuarios/lotacao';
import { FILAS_PRODUCAO } from '@/lib/producao/filasProducao';
import { PERMISSOES_DISPONIVEIS } from '@/lib/admin/permissoes';
import { formatarCPFExibicao } from '@/lib/profissionais/documentos';
import {
  listarUsuariosAdmin,
  listarPerfis,
  atualizarUsuarioAdmin,
  forcarSenhaUsuario,
  USUARIOS_POR_PAGINA,
  type UsuarioAdmin,
  type PerfilAdmin,
} from '@/lib/admin/api';

export default function AdminUsuariosPage() {
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
  const [perfis, setPerfis] = useState<PerfilAdmin[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [userEditando, setUserEditando] = useState<UsuarioAdmin | null>(null);
  const [mensagem, setMensagem] = useState('');
  const [loadingSenha, setLoadingSenha] = useState(false);
  const [buscaInput, setBuscaInput] = useState('');

  const inicioItem = total === 0 ? 0 : (pagina - 1) * USUARIOS_POR_PAGINA + 1;
  const fimItem = total === 0 ? 0 : Math.min(pagina * USUARIOS_POR_PAGINA, total);

  useEffect(() => {
    listarPerfis().then(setPerfis).catch(console.error);
  }, []);

  const carregarUsuarios = useCallback(async (filtros?: { q?: string; pagina?: number }) => {
    setLoading(true);
    try {
      const resposta = await listarUsuariosAdmin(filtros);
      setUsuarios(resposta.itens);
      setTotal(resposta.total);
      setPagina(resposta.pagina);
      setTotalPaginas(resposta.totalPaginas);
    } catch (error) {
      console.error(error);
      setUsuarios([]);
      setTotal(0);
      setTotalPaginas(1);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      carregarUsuarios({ q: buscaInput, pagina });
    }, 300);
    return () => clearTimeout(timer);
  }, [buscaInput, pagina, carregarUsuarios]);

  useEffect(() => {
    if (!modalAberto) return;
    const scrollAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = scrollAnterior;
    };
  }, [modalAberto]);

  const irParaPagina = (novaPagina: number) => {
    if (novaPagina < 1 || novaPagina > totalPaginas || novaPagina === pagina || loading) return;
    setPagina(novaPagina);
  };

  const recarregarLista = () => carregarUsuarios({ q: buscaInput, pagina });

  const perfilSelecionado = perfis.find((p) => p.id === userEditando?.perfilId) ?? userEditando?.perfil ?? null;
  const permissoesDoPerfil = perfilSelecionado?.permissoes ?? [];
  const filasDoPerfil = perfilSelecionado?.filasProducao ?? [];

  const permissoesEfetivasEdicao = userEditando
    ? [...new Set([...permissoesDoPerfil, ...(userEditando.permissoes || [])])]
    : [];

  const abrirEdicao = (usuario: UsuarioAdmin) => {
    const lotacao = hidratarLotacao(usuario);
    setUserEditando({
      ...usuario,
      nivelLotacao: lotacao.nivelLotacao,
      unidadeLotacao: lotacao.unidadeLotacao,
      permissoesProducao: Array.isArray(usuario.permissoesProducao) ? usuario.permissoesProducao : [],
    });
    setModalAberto(true);
  };

  const temPermissaoEnvioProducao = (permissoes: string[] = []) => permissoes.includes('ROLE_UBS');

  const togglePermissaoExtra = (idPermissao: string) => {
    if (!userEditando) return;
    if (permissoesDoPerfil.includes(idPermissao)) return;

    const temPermissao = userEditando.permissoes.includes(idPermissao);
    let novasPermissoes: string[];

    if (temPermissao) {
      novasPermissoes = userEditando.permissoes.filter((p) => p !== idPermissao);
    } else {
      novasPermissoes = [...userEditando.permissoes, idPermissao];
    }

    const atualizacao: UsuarioAdmin = { ...userEditando, permissoes: novasPermissoes };

    if (idPermissao === 'ROLE_UBS' && temPermissao) {
      atualizacao.permissoesProducao = userEditando.permissoesProducao.filter(
        (f) => !filasDoPerfil.includes(f)
      );
    }

    setUserEditando(atualizacao);
  };

  const togglePermissaoProducao = (filaId: string) => {
    if (!userEditando) return;
    if (filasDoPerfil.includes(filaId)) return;

    const atuais = userEditando.permissoesProducao || [];
    const novas = atuais.includes(filaId) ? atuais.filter((id) => id !== filaId) : [...atuais, filaId];
    setUserEditando({ ...userEditando, permissoesProducao: novas });
  };

  const salvarAlteracoes = async () => {
    if (!userEditando) return;
    if (!userEditando.nome?.trim()) {
      alert('Informe o nome do profissional.');
      return;
    }
    if (!userEditando.email?.trim()) {
      alert('Informe o e-mail de acesso.');
      return;
    }
    if (!lotacaoCompleta(userEditando.nivelLotacao || '', userEditando.unidadeLotacao || '')) {
      alert('Selecione a categoria e a unidade de lotação.');
      return;
    }

    const envioProducaoAtivo = temPermissaoEnvioProducao(permissoesEfetivasEdicao);
    const filasExtras = (userEditando.permissoesProducao || []).filter((f) => !filasDoPerfil.includes(f));

    if (envioProducaoAtivo && filasDoPerfil.length + filasExtras.length === 0) {
      alert('Selecione ao menos uma fila de envio (Unidade + Sistema) para o usuário de produções.');
      return;
    }

    try {
      await atualizarUsuarioAdmin(userEditando.id, {
        nome: userEditando.nome.trim(),
        email: userEditando.email.trim(),
        status: userEditando.status,
        permissoes: userEditando.permissoes,
        perfil_id: userEditando.perfilId || null,
        nivel_lotacao: userEditando.nivelLotacao,
        unidade_lotacao: userEditando.unidadeLotacao,
        permissoes_producao: envioProducaoAtivo ? userEditando.permissoesProducao : [],
      });
      setMensagem('Usuário atualizado com sucesso!');
      setModalAberto(false);
      recarregarLista();
      setTimeout(() => setMensagem(''), 3000);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erro ao salvar alterações.');
    }
  };

  const forcarRedefinicaoSenha = async () => {
    if (!userEditando) return;
    if (
      !window.confirm(
        `Tem certeza que deseja resetar a senha de ${userEditando.nome}? A senha será alterada para o padrão do sistema.`
      )
    ) {
      return;
    }

    setLoadingSenha(true);
    try {
      await forcarSenhaUsuario(userEditando.id);
      setMensagem('Senha resetada para: Saude@123. O usuário deve usá-la no próximo acesso.');
      setTimeout(() => setMensagem(''), 8000);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erro de conexão ao tentar redefinir senha.');
    } finally {
      setLoadingSenha(false);
    }
  };

  const badgeStatus = (status: string) => {
    switch (status) {
      case 'PENDENTE':
        return (
          <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-max">
            <AlertCircle size={14} /> Pendente
          </span>
        );
      case 'APROVADO':
        return (
          <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-max">
            <CheckCircle size={14} /> Aprovado
          </span>
        );
      case 'BLOQUEADO':
        return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold w-max">Bloqueado</span>;
      default:
        return null;
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <Users className="text-blue-600" size={28} />
          Usuários
        </h2>
        <p className="text-slate-500 mt-1">Gerenciamento de contas e permissões do painel.</p>
      </div>

      {mensagem && (
        <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl flex items-center gap-2 font-medium">
          <CheckCircle size={20} /> {mensagem}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-lg font-bold text-slate-800">Usuários Cadastrados</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Buscar por nome ou CPF..."
              value={buscaInput}
              onChange={(e) => {
                setBuscaInput(e.target.value);
                setPagina(1);
              }}
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 outline-none w-72"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-max min-w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <th className="p-4 font-semibold min-w-[180px] max-w-[240px]">Profissional</th>
                <th className="p-4 font-semibold whitespace-nowrap">CPF</th>
                <th className="p-4 font-semibold min-w-[200px] max-w-[280px]">Cargo (CBO)</th>
                <th className="p-4 font-semibold min-w-[160px] max-w-[220px]">Lotação</th>
                <th className="p-4 font-semibold whitespace-nowrap">Perfil</th>
                <th className="p-4 font-semibold whitespace-nowrap">Status</th>
                <th className="p-4 font-semibold whitespace-nowrap">Permissões</th>
                <th className="p-4 font-semibold text-right whitespace-nowrap">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    Carregando usuários...
                  </td>
                </tr>
              ) : usuarios.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              ) : (
                usuarios.map((user) => {
                  const perfilNome =
                    user.perfil?.nome || perfis.find((p) => p.id === user.perfilId)?.nome;
                  const qtdPermissoes = user.perfil
                    ? [...new Set([...(user.perfil.permissoes || []), ...user.permissoes])].length
                    : user.permissoes.length;
                  const nomeExibicao = user.nomeProfissional || user.nome;
                  const cargoExibicao = user.cargoCbo || user.cargo;

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 min-w-[180px] max-w-[240px]">
                        <div className="font-bold text-slate-800 leading-snug break-words">{nomeExibicao}</div>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        {user.cpf ? (
                          <span className="text-sm text-slate-700 font-mono">{formatarCPFExibicao(user.cpf)}</span>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic uppercase tracking-wider">
                            Não informado
                          </span>
                        )}
                      </td>
                      <td className="p-4 min-w-[200px] max-w-[280px]">
                        <div className="text-sm text-slate-700 font-medium leading-snug break-words">{cargoExibicao}</div>
                        {user.cboCodigo && (
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">CBO {user.cboCodigo}</div>
                        )}
                      </td>
                      <td className="p-4 text-sm text-slate-500 min-w-[160px] max-w-[220px]">
                        {user.nivelLotacao || user.unidadeLotacao || user.unidade ? (
                          <div className="leading-snug break-words">
                            {user.nivelLotacao && (
                              <div className="text-slate-600">{user.nivelLotacao}</div>
                            )}
                            {(user.unidadeLotacao || user.unidade) && (
                              <div
                                className={`text-slate-500 break-words ${user.nivelLotacao ? 'text-xs mt-0.5' : ''}`}
                              >
                                {user.unidadeLotacao || user.unidade}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Sem lotação</span>
                        )}
                      </td>
                      <td className="p-4 text-sm whitespace-nowrap">
                        {perfilNome ? (
                          <span className="bg-violet-50 text-violet-700 px-2 py-1 rounded font-medium">{perfilNome}</span>
                        ) : (
                          <span className="text-slate-400 italic">Sem perfil</span>
                        )}
                      </td>
                      <td className="p-4 whitespace-nowrap">{badgeStatus(user.status)}</td>
                      <td className="p-4 text-sm text-slate-500 whitespace-nowrap">
                        {qtdPermissoes > 0 ? (
                          <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded font-medium">
                            {qtdPermissoes} módulos
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Sem acesso</span>
                        )}
                      </td>
                      <td className="p-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => abrirEdicao(user)}
                          className="text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 p-2 rounded-lg transition-colors flex items-center gap-2 ml-auto text-sm font-medium"
                        >
                          <Edit size={16} /> Gerenciar
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && total > 0 && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-sm text-slate-600 font-medium">
              Mostrando <strong className="text-slate-800">{inicioItem}</strong>–<strong className="text-slate-800">{fimItem}</strong> de{' '}
              <strong className="text-slate-800">{total}</strong>
              <span className="text-slate-400 mx-2">•</span>
              Página <strong className="text-slate-800">{pagina}</strong> de <strong className="text-slate-800">{totalPaginas}</strong>
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => irParaPagina(pagina - 1)}
                disabled={pagina <= 1 || loading}
                className="h-10 px-4 inline-flex items-center gap-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 bg-white hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 transition-colors disabled:opacity-50 disabled:pointer-events-none"
              >
                <ChevronLeft size={16} />
                Anterior
              </button>

              <button
                type="button"
                onClick={() => irParaPagina(pagina + 1)}
                disabled={pagina >= totalPaginas || loading}
                className="h-10 px-4 inline-flex items-center gap-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 bg-white hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 transition-colors disabled:opacity-50 disabled:pointer-events-none"
              >
                Próxima
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

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
            className="relative z-10 flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            style={{ height: 'min(92dvh, 780px)' }}
          >
            <div className="shrink-0 border-b border-slate-100 bg-slate-50 px-4 py-3 sm:px-5 sm:py-4 flex justify-between items-start gap-3">
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-slate-800">Gerenciar Usuário</h3>
                <p className="text-sm text-slate-500 mt-0.5 truncate">
                  {userEditando.nomeProfissional || userEditando.nome}
                  {userEditando.cpf ? ` · ${formatarCPFExibicao(userEditando.cpf)}` : ''}
                </p>
              </div>
              <button
                onClick={() => setModalAberto(false)}
                className="shrink-0 text-slate-400 hover:text-slate-600 p-1 bg-white rounded-lg shadow-sm"
              >
                <X size={22} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5 space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-800 mb-2 uppercase tracking-wider">Dados Cadastrais</h4>
                <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Nome do profissional</label>
                      <input
                        type="text"
                        value={userEditando.nome}
                        onChange={(e) => setUserEditando({ ...userEditando, nome: e.target.value })}
                        className="w-full p-2.5 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-600 outline-none font-medium text-slate-700 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1">E-mail de acesso</label>
                      <input
                        type="email"
                        value={userEditando.email}
                        onChange={(e) => setUserEditando({ ...userEditando, email: e.target.value })}
                        className="w-full p-2.5 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-600 outline-none font-medium text-slate-700 text-sm"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1">CPF</label>
                      <input
                        type="text"
                        readOnly
                        value={userEditando.cpf ? formatarCPFExibicao(userEditando.cpf) : 'Não informado'}
                        className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-100 text-slate-500 font-mono text-sm cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Cargo (CBO)</label>
                      <input
                        type="text"
                        readOnly
                        value={userEditando.cargoCbo || userEditando.cargo || 'Sem CBO vinculado'}
                        className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-100 text-slate-500 text-sm cursor-not-allowed"
                      />
                      {userEditando.cboCodigo && (
                        <p className="text-[10px] text-slate-400 mt-1 font-mono">
                          CBO {userEditando.cboCodigo} — classificação oficial de ocupações
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-800 mb-2 uppercase tracking-wider">Acessos e Permissões</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 mb-2 uppercase tracking-wider">Situação da Conta</h4>
                  <select
                    value={userEditando.status}
                    onChange={(e) => setUserEditando({ ...userEditando, status: e.target.value })}
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
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-800 mb-2 uppercase tracking-wider">Perfil de Acesso</h4>
                <select
                  value={userEditando.perfilId || ''}
                  onChange={(e) => {
                    const perfilId = e.target.value || null;
                    setUserEditando({
                      ...userEditando,
                      perfilId,
                      status: perfilId ? 'APROVADO' : userEditando.status,
                    });
                  }}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-violet-600 outline-none font-medium text-slate-700 text-sm"
                >
                  <option value="">Sem perfil (apenas permissões individuais)</option>
                  {perfis
                    .filter((p) => p.ativo)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nome}
                      </option>
                    ))}
                </select>
                {perfilSelecionado && (
                  <p className="text-xs text-violet-600 mt-1">
                    Permissões do perfil &quot;{perfilSelecionado.nome}&quot; são aplicadas automaticamente.
                  </p>
                )}
              </div>

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
                  onUnidadeChange={(unidade) => setUserEditando({ ...userEditando, unidadeLotacao: unidade })}
                />
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-800 mb-2 uppercase tracking-wider">
                  Módulos Liberados {perfilSelecionado ? '(perfil + extras)' : ''}
                </h4>
                <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-2 max-h-[16rem] overflow-y-auto">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {PERMISSOES_DISPONIVEIS.map((perm) => {
                      const veioDoPerfil = permissoesDoPerfil.includes(perm.id);
                      const marcadoExtra = userEditando.permissoes.includes(perm.id);
                      const marcado = veioDoPerfil || marcadoExtra;

                      if (perm.id === 'ROLE_UBS') {
                        const envioAtivo = temPermissaoEnvioProducao(permissoesEfetivasEdicao);
                        const filasMarcadas = [
                          ...filasDoPerfil,
                          ...(userEditando.permissoesProducao || []).filter((f) => !filasDoPerfil.includes(f)),
                        ].length;

                        return (
                          <div key={perm.id} className="sm:col-span-2 space-y-2">
                            <label
                              className={`flex items-start gap-2 p-2 rounded-lg border transition-all ${
                                veioDoPerfil
                                  ? 'bg-violet-50 border-violet-200 cursor-default'
                                  : marcado
                                    ? 'bg-blue-50 border-blue-200 cursor-pointer'
                                    : 'bg-white border-slate-200 hover:border-blue-100 cursor-pointer'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={marcado}
                                disabled={veioDoPerfil}
                                onChange={() => togglePermissaoExtra(perm.id)}
                                className="mt-0.5 w-4 h-4 text-blue-600 rounded focus:ring-blue-500 shrink-0"
                              />
                              <span className="min-w-0">
                                <span className={`block text-xs font-medium leading-snug ${marcado ? 'text-blue-900' : 'text-slate-600'}`}>
                                  {perm.nome}
                                  {veioDoPerfil && (
                                    <span className="ml-1 text-[10px] text-violet-600 font-bold">(perfil)</span>
                                  )}
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
                                    const doPerfil = filasDoPerfil.includes(fila.id);
                                    const selecionada =
                                      doPerfil || (userEditando.permissoesProducao || []).includes(fila.id);
                                    return (
                                      <label
                                        key={fila.id}
                                        className={`flex items-start gap-2 p-2 rounded-lg border transition-all ${
                                          doPerfil
                                            ? 'bg-violet-50 border-violet-200 cursor-default'
                                            : selecionada
                                              ? 'bg-emerald-100 border-emerald-300 cursor-pointer'
                                              : 'bg-white border-slate-200 hover:border-emerald-200 cursor-pointer'
                                        }`}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={selecionada}
                                          disabled={doPerfil}
                                          onChange={() => togglePermissaoProducao(fila.id)}
                                          className="mt-0.5 w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 shrink-0"
                                        />
                                        <span className="min-w-0">
                                          <span className={`block text-xs font-bold leading-snug ${selecionada ? 'text-emerald-900' : 'text-slate-700'}`}>
                                            {fila.unidade}
                                          </span>
                                          <span className={`block text-[10px] font-medium ${selecionada ? 'text-emerald-700' : 'text-slate-500'}`}>
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
                          className={`flex items-start gap-2 p-2 rounded-lg border transition-all ${
                            veioDoPerfil
                              ? 'bg-violet-50 border-violet-200 cursor-default'
                              : marcado
                                ? 'bg-blue-50 border-blue-200 cursor-pointer'
                                : 'bg-white border-slate-200 hover:border-blue-100 cursor-pointer'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={marcado}
                            disabled={veioDoPerfil}
                            onChange={() => togglePermissaoExtra(perm.id)}
                            className="mt-0.5 w-4 h-4 text-blue-600 rounded focus:ring-blue-500 shrink-0"
                          />
                          <span className={`text-xs font-medium leading-snug ${marcado ? 'text-blue-900' : 'text-slate-600'}`}>
                            {perm.nome}
                            {veioDoPerfil && (
                              <span className="ml-1 text-[10px] text-violet-600 font-bold">(perfil)</span>
                            )}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="shrink-0 border-t border-slate-100 bg-slate-50 px-4 py-3 sm:px-5 flex justify-end gap-2">
              <button
                onClick={() => setModalAberto(false)}
                className="px-4 py-2 text-sm text-slate-600 font-medium hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={salvarAlteracoes}
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-sm transition-colors flex items-center gap-2"
              >
                <CheckCircle size={16} /> Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
