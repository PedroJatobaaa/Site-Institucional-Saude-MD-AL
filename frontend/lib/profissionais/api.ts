import type {
  ProfissionalCompletoPayload,
  ProfissionalDetalhe,
  ProfissionalListagemResposta,
  StatusCadastroAtualizacao,
  StatusTreinamento,
} from './types';
import { mascaraCPF, mascaraCNS, mascaraPIS } from './documentos';
import { hidratarLotacao } from '@/lib/usuarios/lotacao';
import { getToken } from '@/lib/auth/session';

function authHeaders(): HeadersInit {
  const token = getToken();
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

export async function lerErroApi(res: Response): Promise<string> {
  try {
    const data = await res.json();
    return data.erro || 'Erro na requisição.';
  } catch {
    return 'Erro na requisição.';
  }
}

export type ListarProfissionaisFiltros = {
  q?: string;
  nivelLotacao?: string;
  unidadeLotacao?: string;
  treinamento?: StatusTreinamento;
  cadastroAtualizacao?: StatusCadastroAtualizacao;
  pagina?: number;
  incluirInativos?: boolean;
};

export async function listarProfissionais(filtros?: ListarProfissionaisFiltros): Promise<ProfissionalListagemResposta> {
  const params = new URLSearchParams();
  if (filtros?.q?.trim()) params.set('q', filtros.q.trim());
  if (filtros?.nivelLotacao) params.set('nivel_lotacao', filtros.nivelLotacao);
  if (filtros?.unidadeLotacao) params.set('unidade_lotacao', filtros.unidadeLotacao);
  if (filtros?.treinamento) params.set('treinamento', filtros.treinamento);
  if (filtros?.cadastroAtualizacao) params.set('cadastro_atualizacao', filtros.cadastroAtualizacao);
  if (filtros?.pagina && filtros.pagina > 1) params.set('pagina', String(filtros.pagina));
  if (filtros?.incluirInativos) params.set('incluir_inativos', '1');

  const query = params.toString();
  const url = query ? `/api/profissionais?${query}` : '/api/profissionais';
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) throw new Error(await lerErroApi(res));
  return res.json();
}

export async function obterProfissional(id: string): Promise<ProfissionalDetalhe> {
  const res = await fetch(`/api/profissionais/${id}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(await lerErroApi(res));
  return res.json();
}

export async function criarProfissional(payload: ProfissionalCompletoPayload): Promise<ProfissionalDetalhe> {
  const res = await fetch('/api/profissionais', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await lerErroApi(res));
  return res.json();
}

export async function atualizarProfissional(id: string, payload: ProfissionalCompletoPayload): Promise<ProfissionalDetalhe> {
  const res = await fetch(`/api/profissionais/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await lerErroApi(res));
  return res.json();
}

export function detalheParaPayload(d: ProfissionalDetalhe): ProfissionalCompletoPayload {
  const lotacao = hidratarLotacao({
    nivelLotacao: d.nivelLotacao,
    unidadeLotacao: d.unidadeLotacao ?? d.nomeFantasiaEstabelecimento,
  });

  return {
    profissional: {
      cnes: d.cnes || '',
      nivelLotacao: lotacao.nivelLotacao,
      unidadeLotacao: lotacao.unidadeLotacao,
      nomeFantasiaEstabelecimento: d.nomeFantasiaEstabelecimento || '',
      nomeProfissional: d.nomeProfissional,
      pisPasep: d.pisPasep ? mascaraPIS(d.pisPasep) : '',
      cpf: d.cpf,
      numeroCns: d.numeroCns || '',
      sexo: d.sexo || '',
      nomeMae: d.nomeMae || '',
      nomePai: d.nomePai || '',
      dataNascimento: d.dataNascimento || '',
      municipioNascimento: d.municipioNascimento || '',
      codigoIbgeMunicipioNascimento: d.codigoIbgeMunicipioNascimento || '',
      ufNascimento: d.ufNascimento || '',
      racaCor: d.racaCor || '',
      nacionalidade: d.nacionalidade || 'Brasileira',
      paisOrigem: d.paisOrigem || '',
      dataEntrada: d.dataEntrada || '',
      dataNaturalizacao: d.dataNaturalizacao || '',
      numeroPortaria: d.numeroPortaria || '',
      escolaridade: d.escolaridade || '',
      situacaoFamiliarConjugal: d.situacaoFamiliarConjugal || '',
      frequentaEscola: d.frequentaEscola,
      ativo: d.ativo,
      treinamento: d.treinamento,
      cadastroAtualizacao: d.cadastroAtualizacao,
    },
    documentos: d.documentos || {},
    endereco: d.endereco || {},
    dadosBancarios: d.dadosBancarios || {},
    vinculos: d.vinculos || [],
  };
}

export function prepararPayloadEnvio(data: ProfissionalCompletoPayload): ProfissionalCompletoPayload {
  const vinculos = (data.vinculos || []).map((v) => ({
    ...v,
    cargaHorariaAmbulatorial: v.cargaHorariaAmbulatorial === '' ? null : Number(v.cargaHorariaAmbulatorial),
    cargaHorariaHospitalar: v.cargaHorariaHospitalar === '' ? null : Number(v.cargaHorariaHospitalar),
    cargaHorariaOutros: v.cargaHorariaOutros === '' ? null : Number(v.cargaHorariaOutros),
  }));

  return { ...data, vinculos };
}
