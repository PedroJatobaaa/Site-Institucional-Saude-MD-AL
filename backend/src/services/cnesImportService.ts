import type { PrismaClient } from '@prisma/client';
import { XMLParser } from 'fast-xml-parser';
import {
  NIVEL_ATENCAO_BASICA,
  NIVEL_ATENCAO_ESPECIALIZADA,
  NIVEL_SECRETARIA_SAUDE,
  UNIDADE_SECRETARIA_SAUDE,
  ehEstabelecimentoSecretaria,
  inferirNivelPorUnidade,
  mapearFantasiaUsfParaUbs,
  mapearNomeLotacaoCanonic,
  resolverLotacaoPorEstabelecimento,
} from '../utils/validators/lotacao';
import { nomeEstabelecimentoPorCnes } from './cnesCatalogService';
import { limparNumeros, normalizarCPF } from '../utils/validators/documentos';
import { invalidarCacheUnidades } from '../utils/unidadesCache';
import { alteracaoCriacao } from '../utils/profissionaisHistorico';
import { obterDescricaoCbo } from '../utils/cargoCbo';
import { atribuirPerfilAutomaticoPorCbo } from './perfilCboSyncService';
import { hashSenhaPadrao } from '../utils/primeiroAcessoCnes';

type EstabelecimentoXml = {
  '@_NM_FANTA'?: string;
  '@_CNES'?: string;
  '@_CNPJ'?: string;
  '@_DS_TP_UNID'?: string;
  ENDERECO?: {
    DADOS_ENDERECO?: {
      '@_LOGRADOURO'?: string;
      '@_BAIRRO'?: string;
      '@_CO_CEP'?: string;
    };
  };
};

type LotacaoXml = {
  '@_CNES'?: string;
  '@_CO_CBO'?: string;
  '@_CO_INE'?: string;
};

type ProfissionalXml = {
  '@_CO_CNS'?: string;
  '@_NM_PROF'?: string;
  '@_CPF_PROF'?: string;
  '@_CONSELHO_ID'?: string;
  '@_SG_UF_EMIS'?: string;
  '@_NU_REGISTRO'?: string;
  '@_DT_NASC'?: string;
  '@_SEXO'?: string;
  LOTACOES?: { DADOS_LOTACOES?: LotacaoXml | LotacaoXml[] };
};

export type CnesImportResult = {
  unidades: { criadas: number; atualizadas: number };
  profissionais: { criados: number; atualizados: number; inativados: number; ignorados: number };
  usuarios: { criados: number; atualizados: number; bloqueados: number; reativados: number };
  avisos: string[];
};

function normalizarTexto(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function asArray<T>(valor: T | T[] | undefined): T[] {
  if (!valor) return [];
  return Array.isArray(valor) ? valor : [valor];
}

function parseDataBr(valor: string | undefined): Date | null {
  if (!valor || valor === '01/01/1900') return null;
  const partes = valor.split('/');
  if (partes.length !== 3) return null;
  const [dia, mes, ano] = partes.map(Number);
  if (!dia || !mes || !ano) return null;
  const d = new Date(ano, mes - 1, dia);
  return Number.isNaN(d.getTime()) ? null : d;
}

function inferirNivelPorTipo(tipoUnidade: string | undefined, nomeCnes?: string, cnes?: string): string {
  if (ehEstabelecimentoSecretaria(nomeCnes, cnes)) {
    return NIVEL_SECRETARIA_SAUDE;
  }
  if (nomeCnes && inferirNivelPorUnidade(nomeCnes) === NIVEL_ATENCAO_BASICA) {
    return NIVEL_ATENCAO_BASICA;
  }
  const t = (tipoUnidade || '').toUpperCase();
  if (t.includes('CENTRAL DE GESTAO') || t.includes('SECRETARIA MUNICIPAL')) {
    return NIVEL_SECRETARIA_SAUDE;
  }
  if (t.includes('UNIDADE BASICA') || t.includes('UNIDADE DE SAUDE DA FAMILIA')) {
    return NIVEL_ATENCAO_BASICA;
  }
  return NIVEL_ATENCAO_ESPECIALIZADA;
}

function mapearNomeLotacao(
  nomeCnes: string,
  unidadesExistentes: { nomeLotacao: string; nomeCnes: string | null }[],
  cnes?: string
): string {
  if (ehEstabelecimentoSecretaria(nomeCnes, cnes)) {
    return UNIDADE_SECRETARIA_SAUDE;
  }

  const ubsMapeada = mapearFantasiaUsfParaUbs(nomeCnes);
  if (ubsMapeada) return ubsMapeada;

  const alvo = normalizarTexto(nomeCnes);
  for (const u of unidadesExistentes) {
    if (u.nomeCnes && normalizarTexto(u.nomeCnes) === alvo) return u.nomeLotacao;
    if (normalizarTexto(u.nomeLotacao) === alvo) return u.nomeLotacao;
  }
  for (const u of unidadesExistentes) {
    const nome = normalizarTexto(u.nomeLotacao);
    const cnes = u.nomeCnes ? normalizarTexto(u.nomeCnes) : '';
    if (nome.includes(alvo) || alvo.includes(nome) || (cnes && (cnes.includes(alvo) || alvo.includes(cnes)))) {
      return u.nomeLotacao;
    }
  }
  if (alvo.includes('UBS') || alvo.includes('UNIDADE DE SAUDE DA FAMILIA')) {
    const partes = nomeCnes.split(/\s+/);
    const ultima = partes[partes.length - 1];
    if (ultima) {
      const candidato = `UBS ${ultima.charAt(0)}${ultima.slice(1).toLowerCase()}`;
      for (const u of unidadesExistentes) {
        if (normalizarTexto(u.nomeLotacao) === normalizarTexto(candidato)) return u.nomeLotacao;
      }
    }
  }
  return '';
}

async function sincronizarUsuarioPainelDoCnes(
  prisma: PrismaClient,
  opts: {
    cpf: string;
    nomeProf: string;
    unidadeLotacao: string | null;
    nivelLotacao: string | null;
    cboCodigo: string | null | undefined;
    senhaPadraoHash: string;
    resultado: CnesImportResult;
  }
): Promise<void> {
  const { cpf, nomeProf, unidadeLotacao, nivelLotacao, cboCodigo, senhaPadraoHash, resultado } = opts;

  const usuarioExistente = await prisma.usuario.findFirst({
    where: { cpf },
    select: { id: true, status: true, perfilId: true },
  });

  if (usuarioExistente) {
    const reativando = usuarioExistente.status === 'BLOQUEADO';
    await prisma.usuario.update({
      where: { id: usuarioExistente.id },
      data: {
        nome: nomeProf,
        ...(reativando
          ? { status: usuarioExistente.perfilId ? 'APROVADO' : 'PENDENTE' }
          : {}),
        ...(unidadeLotacao
          ? {
              nivelLotacao,
              unidadeLotacao,
              unidade: unidadeLotacao,
            }
          : {}),
      },
    });
    await atribuirPerfilAutomaticoPorCbo(prisma, cpf, cboCodigo);
    if (reativando) {
      resultado.usuarios.reativados++;
    } else {
      resultado.usuarios.atualizados++;
    }
    return;
  }

  const email = `${cpf}@cnes.importado`;
  const emailEmUso = await prisma.usuario.findUnique({ where: { email } });
  if (emailEmUso) {
    resultado.avisos.push(`Usuário para CPF ${cpf} não criado — e-mail ${email} já existe.`);
    return;
  }

  await prisma.usuario.create({
    data: {
      nome: nomeProf,
      email,
      senha: senhaPadraoHash,
      cargo: 'Profissional de Saúde',
      cpf,
      status: 'PENDENTE',
      precisa_redefinir_senha: true,
      ...(unidadeLotacao
        ? {
            nivelLotacao,
            unidadeLotacao,
            unidade: unidadeLotacao,
          }
        : {}),
    },
  });
  await atribuirPerfilAutomaticoPorCbo(prisma, cpf, cboCodigo);
  resultado.usuarios.criados++;
}

export async function importarXmlCnes(
  prisma: PrismaClient,
  xmlContent: string,
  nomeArquivo: string,
  usuarioNome: string
): Promise<CnesImportResult> {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    isArray: (name) => ['DADOS_GERAIS_ESTABELECIMENTOS', 'DADOS_PROFISSIONAIS', 'DADOS_LOTACOES'].includes(name),
  });

  const parsed = parser.parse(xmlContent);
  const identificacao = parsed?.ImportarXMLCNES?.IDENTIFICACAO;
  const dataReferencia = identificacao?.['@_DATA'] ?? null;

  const estabelecimentos = asArray<EstabelecimentoXml>(
    identificacao?.ESTABELECIMENTOS?.DADOS_GERAIS_ESTABELECIMENTOS
  );
  const profissionais = asArray<ProfissionalXml>(identificacao?.PROFISSIONAIS?.DADOS_PROFISSIONAIS);

  const resultado: CnesImportResult = {
    unidades: { criadas: 0, atualizadas: 0 },
    profissionais: { criados: 0, atualizados: 0, inativados: 0, ignorados: 0 },
    usuarios: { criados: 0, atualizados: 0, bloqueados: 0, reativados: 0 },
    avisos: [],
  };

  const mapaCnesUnidade = new Map<string, { nomeLotacao: string; nivelLotacao: string; nomeCnes: string }>();

  // Fase 1: Estabelecimentos
  let unidadesDb = await prisma.unidadeSaude.findMany({
    select: { id: true, cnes: true, nomeLotacao: true, nomeCnes: true, nivelLotacao: true },
  });

  for (const est of estabelecimentos) {
    const cnes = est['@_CNES']?.trim();
    const nomeCnes = est['@_NM_FANTA']?.trim();
    if (!cnes || !nomeCnes) continue;

    const endereco = est.ENDERECO?.DADOS_ENDERECO;
    const nivel = inferirNivelPorTipo(est['@_DS_TP_UNID'], nomeCnes, cnes);
    const nomeLotacao =
      mapearNomeLotacao(nomeCnes, unidadesDb, cnes) ||
      (nivel === NIVEL_ATENCAO_BASICA && nomeCnes.toUpperCase().includes('UBS') ? nomeCnes : '');

    const existente = unidadesDb.find((u) => u.cnes === cnes)
      || (ehEstabelecimentoSecretaria(nomeCnes, cnes)
        ? unidadesDb.find((u) => u.nomeLotacao === UNIDADE_SECRETARIA_SAUDE)
        : undefined);
    if (existente) {
      await prisma.unidadeSaude.update({
        where: { id: existente.id },
        data: {
          cnes: existente.cnes ? undefined : cnes,
          nomeCnes,
          nivelLotacao: ehEstabelecimentoSecretaria(nomeCnes, cnes) ? NIVEL_SECRETARIA_SAUDE : existente.nivelLotacao,
          tipoUnidade: est['@_DS_TP_UNID'] || null,
          cnpj: est['@_CNPJ'] || null,
          logradouro: endereco?.['@_LOGRADOURO'] || null,
          bairro: endereco?.['@_BAIRRO'] || null,
          cep: endereco?.['@_CO_CEP'] || null,
          ...(nomeLotacao ? { nomeLotacao } : {}),
        },
      });
      resultado.unidades.atualizadas++;
      mapaCnesUnidade.set(cnes, {
        nomeLotacao: nomeLotacao || existente.nomeLotacao,
        nivelLotacao: ehEstabelecimentoSecretaria(nomeCnes, cnes) ? NIVEL_SECRETARIA_SAUDE : existente.nivelLotacao,
        nomeCnes,
      });
    } else if (nomeLotacao) {
      try {
        const criada = await prisma.unidadeSaude.create({
          data: {
            cnes,
            nomeCnes,
            nomeLotacao,
            nivelLotacao: nivel,
            tipoUnidade: est['@_DS_TP_UNID'] || null,
            cnpj: est['@_CNPJ'] || null,
            logradouro: endereco?.['@_LOGRADOURO'] || null,
            bairro: endereco?.['@_BAIRRO'] || null,
            cep: endereco?.['@_CO_CEP'] || null,
          },
        });
        unidadesDb.push(criada);
        resultado.unidades.criadas++;
        mapaCnesUnidade.set(cnes, { nomeLotacao, nivelLotacao: nivel, nomeCnes });
      } catch {
        resultado.avisos.push(`Não foi possível criar unidade CNES ${cnes} (${nomeCnes}).`);
      }
    } else {
      resultado.avisos.push(`Unidade CNES ${cnes} (${nomeCnes}) sem mapeamento — revise em Unidades.`);
      mapaCnesUnidade.set(cnes, {
        nomeLotacao: mapearNomeLotacaoCanonic(nomeCnes) || '',
        nivelLotacao: nivel,
        nomeCnes,
      });
    }
  }

  invalidarCacheUnidades();
  unidadesDb = await prisma.unidadeSaude.findMany({
    select: { id: true, cnes: true, nomeLotacao: true, nomeCnes: true, nivelLotacao: true },
  });
  for (const u of unidadesDb) {
    if (u.cnes) {
      mapaCnesUnidade.set(u.cnes, {
        nomeLotacao: u.nomeLotacao,
        nivelLotacao: u.nivelLotacao,
        nomeCnes: u.nomeCnes || u.nomeLotacao,
      });
    }
  }

  const senhaPadraoHash = await hashSenhaPadrao();

  // Fase 2 e 3: Profissionais + Usuários
  for (const prof of profissionais) {
    const cpfRaw = prof['@_CPF_PROF'];
    if (!cpfRaw) continue;

    let cpf: string;
    try {
      cpf = normalizarCPF(cpfRaw);
    } catch {
      resultado.avisos.push(`CPF inválido ignorado: ${cpfRaw}`);
      continue;
    }

    const lotacoes = asArray(prof.LOTACOES?.DADOS_LOTACOES);
    const lotacaoPrincipal = lotacoes[0];
    const cnesLotacao = lotacaoPrincipal?.['@_CNES']?.trim();
    const unidadeInfo = cnesLotacao ? mapaCnesUnidade.get(cnesLotacao) : undefined;
    const nomeFantasiaCnes = unidadeInfo?.nomeCnes || nomeEstabelecimentoPorCnes(cnesLotacao);
    const lotacaoResolvida = resolverLotacaoPorEstabelecimento({
      cnes: cnesLotacao,
      nomeFantasia: nomeFantasiaCnes,
      unidadeLotacao: unidadeInfo?.nomeLotacao,
      nivelLotacao: unidadeInfo?.nivelLotacao,
    });

    const nomeProf = prof['@_NM_PROF']?.trim() || 'Profissional CNES';
    const cns = limparNumeros(prof['@_CO_CNS'] || '') || null;
    const dataNasc = parseDataBr(prof['@_DT_NASC']);

    const dadosProf = {
      nomeProfissional: nomeProf,
      numeroCns: cns,
      sexo: prof['@_SEXO'] || null,
      dataNascimento: dataNasc,
      cnes: cnesLotacao || null,
      nivelLotacao: lotacaoResolvida.nivelLotacao,
      unidadeLotacao: lotacaoResolvida.unidadeLotacao,
      nomeFantasiaEstabelecimento: nomeFantasiaCnes || null,
      cadastroAtualizacao: 'REALIZADO' as const,
      ativo: true,
    };

    const existenteProf = await prisma.profissional.findUnique({ where: { cpf } });
    const cboCodigo = lotacaoPrincipal?.['@_CO_CBO'] ?? null;
    const { unidadeLotacao, nivelLotacao } = lotacaoResolvida;

    if (existenteProf) {
      // Cadastro em /painel/profissionais permanece; usuários/perfil seguem o CNES
      resultado.profissionais.ignorados++;
    } else {
      const criado = await prisma.profissional.create({
        data: {
          cpf,
          ...dadosProf,
          criadoPorNome: 'Importação CNES',
        },
      });

      if (cboCodigo) {
        await prisma.vinculoProfissional.create({
          data: {
            profissionalId: criado.id,
            cboCodigo,
            cboDescricao: obterDescricaoCbo(cboCodigo),
            registroConselhoClasse: prof['@_NU_REGISTRO'] || null,
            orgaoEmissor: prof['@_SG_UF_EMIS'] || null,
          },
        });
      }

      await prisma.profissionalHistorico.create({
        data: {
          profissionalId: criado.id,
          tipo: 'CRIACAO',
          usuarioNome: 'Importação CNES',
          alteracoes: alteracaoCriacao(),
        },
      });

      resultado.profissionais.criados++;
    }

    await sincronizarUsuarioPainelDoCnes(prisma, {
      cpf,
      nomeProf,
      unidadeLotacao,
      nivelLotacao,
      cboCodigo,
      senhaPadraoHash,
      resultado,
    });
  }

  await prisma.importacaoCnes.create({
    data: {
      nomeArquivo,
      dataReferencia,
      unidadesCriadas: resultado.unidades.criadas,
      unidadesAtualizadas: resultado.unidades.atualizadas,
      profissionaisCriados: resultado.profissionais.criados,
      profissionaisAtualizados: resultado.profissionais.atualizados,
      profissionaisInativados: resultado.profissionais.inativados,
      usuariosCriados: resultado.usuarios.criados,
      usuariosAtualizados: resultado.usuarios.atualizados,
      usuariosBloqueados: resultado.usuarios.bloqueados,
      usuariosReativados: resultado.usuarios.reativados,
      avisos: resultado.avisos,
      usuarioNome,
    },
  });

  return resultado;
}

export async function listarImportacoesCnes(prisma: PrismaClient, limite = 10) {
  return prisma.importacaoCnes.findMany({
    orderBy: { createdAt: 'desc' },
    take: limite,
  });
}
