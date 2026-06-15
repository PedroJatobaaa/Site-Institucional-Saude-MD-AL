import type { PrismaClient } from '@prisma/client';
import { NIVEIS_LOTACAO, inferirNivelPorUnidade } from '../utils/validators/lotacao';
import { invalidarCacheUnidades } from '../utils/unidadesCache';

export async function listarUnidades(prisma: PrismaClient, apenasAtivas = false) {
  return prisma.unidadeSaude.findMany({
    where: apenasAtivas ? { ativo: true } : undefined,
    orderBy: [{ nivelLotacao: 'asc' }, { nomeLotacao: 'asc' }],
  });
}

export async function criarUnidade(
  prisma: PrismaClient,
  dados: {
    cnes?: string | null;
    nome_cnes?: string | null;
    nome_lotacao: string;
    nivel_lotacao: string;
    tipo_unidade?: string | null;
    cnpj?: string | null;
    logradouro?: string | null;
    bairro?: string | null;
    cep?: string | null;
    ativo?: boolean;
  }
) {
  const nomeLotacao = dados.nome_lotacao?.trim();
  if (!nomeLotacao) throw new Error('Nome de lotação é obrigatório.');
  if (!NIVEIS_LOTACAO.includes(dados.nivel_lotacao as (typeof NIVEIS_LOTACAO)[number])) {
    throw new Error('Nível de lotação inválido.');
  }

  const unidade = await prisma.unidadeSaude.create({
    data: {
      cnes: dados.cnes?.trim() || null,
      nomeCnes: dados.nome_cnes?.trim() || null,
      nomeLotacao,
      nivelLotacao: dados.nivel_lotacao,
      tipoUnidade: dados.tipo_unidade?.trim() || null,
      cnpj: dados.cnpj?.trim() || null,
      logradouro: dados.logradouro?.trim() || null,
      bairro: dados.bairro?.trim() || null,
      cep: dados.cep?.trim() || null,
      ativo: dados.ativo ?? true,
    },
  });

  invalidarCacheUnidades();
  return unidade;
}

export async function atualizarUnidade(
  prisma: PrismaClient,
  id: string,
  dados: {
    cnes?: string | null;
    nome_cnes?: string | null;
    nome_lotacao?: string;
    nivel_lotacao?: string;
    tipo_unidade?: string | null;
    cnpj?: string | null;
    logradouro?: string | null;
    bairro?: string | null;
    cep?: string | null;
    ativo?: boolean;
  }
) {
  const existente = await prisma.unidadeSaude.findUnique({ where: { id } });
  if (!existente) throw new Error('Unidade não encontrada.');

  const updateData: Record<string, unknown> = {};

  if (dados.nome_lotacao !== undefined) {
    const nome = dados.nome_lotacao.trim();
    if (!nome) throw new Error('Nome de lotação é obrigatório.');
    updateData.nomeLotacao = nome;
  }
  if (dados.nivel_lotacao !== undefined) {
    if (!NIVEIS_LOTACAO.includes(dados.nivel_lotacao as (typeof NIVEIS_LOTACAO)[number])) {
      throw new Error('Nível de lotação inválido.');
    }
    updateData.nivelLotacao = dados.nivel_lotacao;
  }
  if (dados.cnes !== undefined) updateData.cnes = dados.cnes?.trim() || null;
  if (dados.nome_cnes !== undefined) updateData.nomeCnes = dados.nome_cnes?.trim() || null;
  if (dados.tipo_unidade !== undefined) updateData.tipoUnidade = dados.tipo_unidade?.trim() || null;
  if (dados.cnpj !== undefined) updateData.cnpj = dados.cnpj?.trim() || null;
  if (dados.logradouro !== undefined) updateData.logradouro = dados.logradouro?.trim() || null;
  if (dados.bairro !== undefined) updateData.bairro = dados.bairro?.trim() || null;
  if (dados.cep !== undefined) updateData.cep = dados.cep?.trim() || null;
  if (dados.ativo !== undefined) updateData.ativo = dados.ativo;

  const unidade = await prisma.unidadeSaude.update({
    where: { id },
    data: updateData,
  });

  invalidarCacheUnidades();
  return unidade;
}

export async function toggleUnidadeAtiva(prisma: PrismaClient, id: string, ativo: boolean) {
  const unidade = await prisma.unidadeSaude.update({
    where: { id },
    data: { ativo },
  });
  invalidarCacheUnidades();
  return unidade;
}

export async function listarLotacaoOpcoes(prisma: PrismaClient) {
  const unidades = await listarUnidades(prisma, true);
  const mapa: Record<string, Set<string>> = {};
  for (const nivel of NIVEIS_LOTACAO) {
    mapa[nivel] = new Set();
  }

  for (const unidade of unidades) {
    const nome = unidade.nomeLotacao?.trim();
    if (!nome) continue;
    const nivel = inferirNivelPorUnidade(nome);
    if (nivel) mapa[nivel].add(nome);
  }

  return NIVEIS_LOTACAO.map((nivel) => ({
    nivelLotacao: nivel,
    unidades: [...mapa[nivel]].sort((a, b) => a.localeCompare(b, 'pt-BR')),
  }));
}
