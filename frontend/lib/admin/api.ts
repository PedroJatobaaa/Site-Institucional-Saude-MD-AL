import { getToken } from '@/lib/auth/session';

function authHeaders(): HeadersInit {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleJson<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) {
    throw new Error((data as { erro?: string }).erro || 'Falha na requisição.');
  }
  return data as T;
}

export type UsuarioAdmin = {
  id: string;
  nome: string;
  nomeProfissional?: string;
  email: string;
  cargo: string;
  cargoCbo?: string | null;
  cboCodigo?: string | null;
  profissionalId?: string | null;
  cpf: string | null;
  unidade: string | null;
  nivelLotacao: string | null;
  unidadeLotacao: string | null;
  status: string;
  permissoes: string[];
  permissoesProducao: string[];
  perfilId: string | null;
  perfil?: { id: string; nome: string; permissoes: string[]; filasProducao?: string[] } | null;
  createdAt: string;
};

export type PerfilAdmin = {
  id: string;
  nome: string;
  descricao: string | null;
  permissoes: string[];
  cbosVinculo?: string[];
  prefixosCbo?: string[];
  ativo: boolean;
  filasProducao: string[];
  _count?: { usuarios: number };
  createdAt: string;
  updatedAt: string;
  usuariosVinculados?: number;
};

export type CboOcupacao = {
  code: string;
  name: string;
};

export type PreviewVinculoPerfil = {
  totalElegiveis: number;
  cbosVinculo: string[];
  prefixosCbo: string[];
};

export type UnidadeSaudeAdmin = {
  id: string;
  cnes: string | null;
  nomeCnes: string | null;
  nomeLotacao: string;
  nivelLotacao: string;
  tipoUnidade: string | null;
  cnpj: string | null;
  logradouro: string | null;
  bairro: string | null;
  cep: string | null;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CnesImportResult = {
  unidades: { criadas: number; atualizadas: number };
  profissionais: { criados: number; atualizados: number; inativados: number; ignorados: number };
  usuarios: { criados: number; atualizados: number; bloqueados: number; reativados: number };
  avisos: string[];
};

export type UsuarioAdminListagemResposta = {
  itens: UsuarioAdmin[];
  total: number;
  pagina: number;
  porPagina: number;
  totalPaginas: number;
};

export const USUARIOS_POR_PAGINA = 20;

export async function listarUsuariosAdmin(filtros?: {
  q?: string;
  pagina?: number;
}): Promise<UsuarioAdminListagemResposta> {
  const params = new URLSearchParams();
  if (filtros?.q?.trim()) params.set('q', filtros.q.trim());
  if (filtros?.pagina && filtros.pagina > 1) params.set('pagina', String(filtros.pagina));

  const qs = params.toString();
  const res = await fetch(`/api/admin/usuarios${qs ? `?${qs}` : ''}`, { headers: authHeaders() });
  const data = await res.json();

  if (Array.isArray(data)) {
    return {
      itens: data,
      total: data.length,
      pagina: 1,
      porPagina: data.length,
      totalPaginas: 1,
    };
  }

  return {
    itens: Array.isArray(data.itens) ? data.itens : [],
    total: data.total ?? 0,
    pagina: data.pagina ?? 1,
    porPagina: data.porPagina ?? USUARIOS_POR_PAGINA,
    totalPaginas: data.totalPaginas ?? 1,
  };
}

export async function atualizarUsuarioAdmin(
  id: string,
  body: Record<string, unknown>
): Promise<void> {
  const res = await fetch(`/api/admin/usuarios/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  });
  await handleJson(res);
}

export async function forcarSenhaUsuario(id: string): Promise<void> {
  const res = await fetch(`/api/admin/usuarios/${id}/forcar-senha`, {
    method: 'POST',
    headers: authHeaders(),
  });
  await handleJson(res);
}

export async function listarPerfis(): Promise<PerfilAdmin[]> {
  const res = await fetch('/api/admin/perfis', { headers: authHeaders() });
  return handleJson(res);
}

export async function obterPerfil(id: string): Promise<PerfilAdmin & { usuarios: UsuarioAdmin[] }> {
  const res = await fetch(`/api/admin/perfis/${id}`, { headers: authHeaders() });
  return handleJson(res);
}

export async function criarPerfil(body: Record<string, unknown>): Promise<PerfilAdmin> {
  const res = await fetch('/api/admin/perfis', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  });
  return handleJson(res);
}

export async function atualizarPerfil(id: string, body: Record<string, unknown>): Promise<PerfilAdmin> {
  const res = await fetch(`/api/admin/perfis/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  });
  return handleJson(res);
}

export async function buscarCbosAdmin(q?: string, limite = 20): Promise<CboOcupacao[]> {
  const params = new URLSearchParams();
  if (q?.trim()) params.set('q', q.trim());
  if (limite !== 30) params.set('limite', String(limite));
  const qs = params.toString();
  const res = await fetch(`/api/admin/cbos${qs ? `?${qs}` : ''}`, { headers: authHeaders() });
  return handleJson(res);
}

export async function previewVinculoPerfil(body: Record<string, unknown>): Promise<PreviewVinculoPerfil> {
  const res = await fetch('/api/admin/perfis/preview-vinculo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  });
  return handleJson(res);
}

export async function excluirPerfil(id: string): Promise<void> {
  const res = await fetch(`/api/admin/perfis/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  await handleJson(res);
}

export async function listarUnidadesAdmin(apenasAtivas = false): Promise<UnidadeSaudeAdmin[]> {
  const qs = apenasAtivas ? '?ativas=true' : '';
  const res = await fetch(`/api/admin/unidades${qs}`, { headers: authHeaders() });
  return handleJson(res);
}

export async function criarUnidade(body: Record<string, unknown>): Promise<UnidadeSaudeAdmin> {
  const res = await fetch('/api/admin/unidades', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  });
  return handleJson(res);
}

export async function atualizarUnidade(id: string, body: Record<string, unknown>): Promise<UnidadeSaudeAdmin> {
  const res = await fetch(`/api/admin/unidades/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  });
  return handleJson(res);
}

export async function toggleUnidadeAtiva(id: string, ativo: boolean): Promise<UnidadeSaudeAdmin> {
  const res = await fetch(`/api/admin/unidades/${id}/ativar`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ ativo }),
  });
  return handleJson(res);
}

export async function importarCnesXml(arquivo: File): Promise<CnesImportResult> {
  const form = new FormData();
  form.append('arquivo', arquivo);
  const res = await fetch('/api/admin/cnes/importar', {
    method: 'POST',
    headers: authHeaders(),
    body: form,
  });
  return handleJson(res);
}

export type LotacaoOpcao = { nivelLotacao: string; unidades: string[] };

export async function listarLotacaoOpcoes(): Promise<LotacaoOpcao[]> {
  const res = await fetch('/api/unidades/lotacao', { headers: authHeaders() });
  return handleJson(res);
}
