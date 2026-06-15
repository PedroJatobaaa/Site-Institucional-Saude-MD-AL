import type { Prisma, PrismaClient } from '@prisma/client';
import type {
  DadosBancariosPayload,
  DocumentosPayload,
  EnderecoPayload,
  ProfissionalCompletoPayload,
  ProfissionalDetalhe,
  ProfissionalListagemResposta,
  ProfissionalListItem,
  StatusCadastroAtualizacao,
  StatusTreinamento,
  VinculoPayload,
} from '../types/profissionais';
import { PROFISSIONAIS_POR_PAGINA } from '../types/profissionais';
import { nomeEstabelecimentoPorCnes } from './cnesCatalogService';
import { formatarCPF, formatarCNS, limparNumeros, normalizarCPF } from '../utils/validators/documentos';
import { obterDescricaoCbo } from '../utils/cargoCbo';
import {
  alteracaoCriacao,
  gerarDiffProfissional,
  mapHistoricoResponse,
} from '../utils/profissionaisHistorico';
import {
  CNES_SECRETARIA_SMS,
  FANTASIA_SECRETARIA_SMS,
  NIVEL_ATENCAO_BASICA,
  NIVEL_ATENCAO_ESPECIALIZADA,
  NIVEL_SECRETARIA_SAUDE,
  UNIDADE_SECRETARIA_SAUDE,
  UNIDADES_UBS,
} from '../utils/validators/lotacao';

const TREINAMENTO_DB: Record<StatusTreinamento, 'REALIZADO' | 'AGENDADO' | 'AGUARDANDO'> = {
  realizado: 'REALIZADO',
  agendado: 'AGENDADO',
  aguardando: 'AGUARDANDO',
};

const TREINAMENTO_API: Record<string, StatusTreinamento> = {
  REALIZADO: 'realizado',
  AGENDADO: 'agendado',
  AGUARDANDO: 'aguardando',
};

const CADASTRO_ATUALIZACAO_DB: Record<StatusCadastroAtualizacao, 'REALIZADO' | 'AGUARDANDO'> = {
  realizado: 'REALIZADO',
  aguardando: 'AGUARDANDO',
};

const CADASTRO_ATUALIZACAO_API: Record<string, StatusCadastroAtualizacao> = {
  REALIZADO: 'realizado',
  AGUARDANDO: 'aguardando',
};

function treinamentoParaApi(valor: string): StatusTreinamento {
  return TREINAMENTO_API[valor] ?? 'aguardando';
}

function cadastroAtualizacaoParaApi(valor: string): StatusCadastroAtualizacao {
  return CADASTRO_ATUALIZACAO_API[valor] ?? 'aguardando';
}

function parseDate(valor: string | null | undefined): Date | null {
  if (!valor) return null;
  const d = new Date(valor);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDate(valor: Date | null | undefined): string | null {
  if (!valor) return null;
  return valor.toISOString().split('T')[0];
}

function temConteudo(obj: Record<string, unknown> | null | undefined): boolean {
  if (!obj) return false;
  return Object.values(obj).some((v) => v !== null && v !== undefined && v !== '');
}

function mapDocumentosData(data: DocumentosPayload | null | undefined) {
  if (!data || !temConteudo(data as Record<string, unknown>)) return undefined;
  return {
    tipoCertidao: data.tipoCertidao || null,
    cartorio: data.cartorio || null,
    livro: data.livro || null,
    fls: data.fls || null,
    termo: data.termo || null,
    dataEmissaoCertidao: parseDate(data.dataEmissaoCertidao),
    rgNumero: data.rgNumero || null,
    rgUf: data.rgUf || null,
    rgOrgaoEmissor: data.rgOrgaoEmissor || null,
    rgDataEmissao: parseDate(data.rgDataEmissao),
    tituloEleitor: data.tituloEleitor || null,
    zona: data.zona || null,
    secao: data.secao || null,
    ctpsNumero: data.ctpsNumero || null,
    ctpsSerie: data.ctpsSerie || null,
    ctpsUf: data.ctpsUf || null,
    ctpsDataEmissao: parseDate(data.ctpsDataEmissao),
  };
}

function mapEnderecoData(data: EnderecoPayload | null | undefined) {
  if (!data || !temConteudo(data as Record<string, unknown>)) return undefined;
  return {
    tipoLogradouro: data.tipoLogradouro || null,
    logradouro: data.logradouro || null,
    numero: data.numero || null,
    complemento: data.complemento || null,
    bairroDistrito: data.bairroDistrito || null,
    municipioResidencia: data.municipioResidencia || null,
    codigoIbgeMunicipio: data.codigoIbgeMunicipio || null,
    uf: data.uf || null,
    cep: data.cep ? limparNumeros(data.cep) : null,
    telefone: data.telefone || null,
  };
}

function mapDadosBancariosData(data: DadosBancariosPayload | null | undefined) {
  if (!data || !temConteudo(data as Record<string, unknown>)) return undefined;
  return {
    bancoCodigo: data.bancoCodigo || null,
    bancoNome: data.bancoNome || null,
    agencia: data.agencia || null,
    contaCorrente: data.contaCorrente || null,
  };
}

function descricaoCboVinculo(cboCodigo: string | null, cboDescricao: string | null): string | null {
  return cboDescricao?.trim() || obterDescricaoCbo(cboCodigo) || null;
}

function mapVinculoData(v: VinculoPayload) {
  const cboCodigo = v.cboCodigo || null;
  const cboDescricao = descricaoCboVinculo(cboCodigo, v.cboDescricao || null);
  return {
    registroConselhoClasse: v.registroConselhoClasse || null,
    orgaoEmissor: v.orgaoEmissor || null,
    atendimentoSus: v.atendimentoSus ?? false,
    codigoVinculacao: v.codigoVinculacao || null,
    codigoTipo: v.codigoTipo || null,
    codigoSubTipo: v.codigoSubTipo || null,
    cboCodigo: v.cboCodigo || null,
    cboDescricao: cboDescricao,
    cargaHorariaAmbulatorial: v.cargaHorariaAmbulatorial ?? null,
    cargaHorariaHospitalar: v.cargaHorariaHospitalar ?? null,
    cargaHorariaOutros: v.cargaHorariaOutros ?? null,
    dataEntrada: parseDate(v.dataEntrada),
    dataDesligamento: parseDate(v.dataDesligamento),
    motivoDesligamento: v.motivoDesligamento || null,
  };
}

function unidadeVinculoLabel(p: {
  unidadeLotacao: string | null;
  nomeFantasiaEstabelecimento: string | null;
  cnes?: string | null;
}): string | null {
  if (p.unidadeLotacao?.trim()) return p.unidadeLotacao.trim();
  if (p.nomeFantasiaEstabelecimento?.trim()) return p.nomeFantasiaEstabelecimento.trim();
  const nomeCnes = nomeEstabelecimentoPorCnes(p.cnes);
  return nomeCnes || null;
}

function mapProfissionalData(p: ProfissionalCompletoPayload['profissional']) {
  return {
    cnes: p.cnes || null,
    nivelLotacao: p.nivelLotacao || null,
    unidadeLotacao: p.unidadeLotacao || null,
    nomeFantasiaEstabelecimento: p.nomeFantasiaEstabelecimento || null,
    nomeProfissional: p.nomeProfissional.trim(),
    pisPasep: p.pisPasep ? limparNumeros(p.pisPasep) : null,
    cpf: normalizarCPF(p.cpf),
    numeroCns: p.numeroCns ? limparNumeros(p.numeroCns) : null,
    sexo: p.sexo || null,
    nomeMae: p.nomeMae || null,
    nomePai: p.nomePai || null,
    dataNascimento: parseDate(p.dataNascimento),
    municipioNascimento: p.municipioNascimento || null,
    codigoIbgeMunicipioNascimento: p.codigoIbgeMunicipioNascimento || null,
    ufNascimento: p.ufNascimento || null,
    racaCor: p.racaCor || null,
    nacionalidade: p.nacionalidade || null,
    paisOrigem: p.paisOrigem || null,
    dataEntrada: parseDate(p.dataEntrada),
    dataNaturalizacao: parseDate(p.dataNaturalizacao),
    numeroPortaria: p.numeroPortaria || null,
    escolaridade: p.escolaridade || null,
    situacaoFamiliarConjugal: p.situacaoFamiliarConjugal || null,
    frequentaEscola: p.frequentaEscola ?? false,
    ...(p.ativo !== undefined ? { ativo: p.ativo } : {}),
    ...(p.treinamento ? { treinamento: TREINAMENTO_DB[p.treinamento] } : {}),
    ...(p.cadastroAtualizacao ? { cadastroAtualizacao: CADASTRO_ATUALIZACAO_DB[p.cadastroAtualizacao] } : {}),
  };
}

function mapDocumentosResponse(doc: NonNullable<Awaited<ReturnType<typeof fetchProfissionalInclude>>['documento']>) {
  if (!doc) return null;
  return {
    tipoCertidao: doc.tipoCertidao,
    cartorio: doc.cartorio,
    livro: doc.livro,
    fls: doc.fls,
    termo: doc.termo,
    dataEmissaoCertidao: formatDate(doc.dataEmissaoCertidao),
    rgNumero: doc.rgNumero,
    rgUf: doc.rgUf,
    rgOrgaoEmissor: doc.rgOrgaoEmissor,
    rgDataEmissao: formatDate(doc.rgDataEmissao),
    tituloEleitor: doc.tituloEleitor,
    zona: doc.zona,
    secao: doc.secao,
    ctpsNumero: doc.ctpsNumero,
    ctpsSerie: doc.ctpsSerie,
    ctpsUf: doc.ctpsUf,
    ctpsDataEmissao: formatDate(doc.ctpsDataEmissao),
  };
}

const includeCompleto = {
  documento: true,
  endereco: true,
  dadosBancarios: true,
  vinculos: { orderBy: { dataEntrada: 'desc' as const } },
  historico: { orderBy: { createdAt: 'desc' as const } },
};

async function fetchProfissionalInclude(prisma: PrismaClient, id: string) {
  return prisma.profissional.findUnique({
    where: { id },
    include: includeCompleto,
  });
}

const ROTULO_CADASTRO_ATUALIZACAO = 'Cadastro/Atualização';

function montarEstadoProposto(
  existente: NonNullable<Awaited<ReturnType<typeof fetchProfissionalInclude>>>,
  payload: ProfissionalCompletoPayload
): ProfissionalDetalhe {
  const p = payload.profissional;
  const profMapped = mapProfissionalData({
    ...p,
    ativo: p.ativo ?? existente.ativo,
    treinamento: p.treinamento ?? treinamentoParaApi(existente.treinamento),
    cadastroAtualizacao: p.cadastroAtualizacao ?? cadastroAtualizacaoParaApi(existente.cadastroAtualizacao),
  });

  const docMapped = mapDocumentosData(payload.documentos);
  const endMapped = mapEnderecoData(payload.endereco);
  const bancoMapped = mapDadosBancariosData(payload.dadosBancarios);
  const vinculosMapped = (payload.vinculos || []).map(mapVinculoData);

  return mapProfissionalDetalhe({
    ...existente,
    ...profMapped,
    documento: docMapped
      ? { id: existente.documento?.id ?? '', profissionalId: existente.id, ...docMapped }
      : null,
    endereco: endMapped
      ? { id: existente.endereco?.id ?? '', profissionalId: existente.id, ...endMapped }
      : null,
    dadosBancarios: bancoMapped
      ? { id: existente.dadosBancarios?.id ?? '', profissionalId: existente.id, ...bancoMapped }
      : null,
    vinculos: vinculosMapped.map((v, i) => ({
      id: payload.vinculos?.[i]?.id ?? `temp-${i}`,
      profissionalId: existente.id,
      ...v,
    })),
    historico: existente.historico,
  });
}

function haEdicaoDados(
  estadoAntes: ProfissionalDetalhe,
  existente: NonNullable<Awaited<ReturnType<typeof fetchProfissionalInclude>>>,
  payload: ProfissionalCompletoPayload
): boolean {
  const estadoProposto = montarEstadoProposto(existente, payload);
  const alteracoes = gerarDiffProfissional(estadoAntes, estadoProposto);
  return alteracoes.some((alteracao) => alteracao.campo !== ROTULO_CADASTRO_ATUALIZACAO);
}

function mapProfissionalDetalhe(p: NonNullable<Awaited<ReturnType<typeof fetchProfissionalInclude>>>): ProfissionalDetalhe {
  return {
    id: p.id,
    nomeProfissional: p.nomeProfissional,
    cpf: formatarCPF(p.cpf),
    cnes: p.cnes,
    vinculoPrincipal: unidadeVinculoLabel(p),
    numeroCns: p.numeroCns ? formatarCNS(p.numeroCns) : null,
    nivelLotacao: p.nivelLotacao,
    unidadeLotacao: p.unidadeLotacao,
    nomeFantasiaEstabelecimento: p.nomeFantasiaEstabelecimento,
    pisPasep: p.pisPasep,
    sexo: p.sexo,
    nomeMae: p.nomeMae,
    nomePai: p.nomePai,
    dataNascimento: formatDate(p.dataNascimento),
    municipioNascimento: p.municipioNascimento,
    codigoIbgeMunicipioNascimento: p.codigoIbgeMunicipioNascimento,
    ufNascimento: p.ufNascimento,
    racaCor: p.racaCor,
    nacionalidade: p.nacionalidade,
    paisOrigem: p.paisOrigem,
    dataEntrada: formatDate(p.dataEntrada),
    dataNaturalizacao: formatDate(p.dataNaturalizacao),
    numeroPortaria: p.numeroPortaria,
    escolaridade: p.escolaridade,
    situacaoFamiliarConjugal: p.situacaoFamiliarConjugal,
    frequentaEscola: p.frequentaEscola,
    ativo: p.ativo,
    treinamento: treinamentoParaApi(p.treinamento),
    cadastroAtualizacao: cadastroAtualizacaoParaApi(p.cadastroAtualizacao),
    criadoPorNome: p.criadoPorNome,
    createdAt: p.createdAt.toISOString(),
    documentos: mapDocumentosResponse(p.documento),
    endereco: p.endereco
      ? {
          tipoLogradouro: p.endereco.tipoLogradouro,
          logradouro: p.endereco.logradouro,
          numero: p.endereco.numero,
          complemento: p.endereco.complemento,
          bairroDistrito: p.endereco.bairroDistrito,
          municipioResidencia: p.endereco.municipioResidencia,
          codigoIbgeMunicipio: p.endereco.codigoIbgeMunicipio,
          uf: p.endereco.uf,
          cep: p.endereco.cep,
          telefone: p.endereco.telefone,
        }
      : null,
    dadosBancarios: p.dadosBancarios
      ? {
          bancoCodigo: p.dadosBancarios.bancoCodigo,
          bancoNome: p.dadosBancarios.bancoNome,
          agencia: p.dadosBancarios.agencia,
          contaCorrente: p.dadosBancarios.contaCorrente,
        }
      : null,
    vinculos: p.vinculos.map((v) => ({
      id: v.id,
      registroConselhoClasse: v.registroConselhoClasse,
      orgaoEmissor: v.orgaoEmissor,
      atendimentoSus: v.atendimentoSus,
      codigoVinculacao: v.codigoVinculacao,
      codigoTipo: v.codigoTipo,
      codigoSubTipo: v.codigoSubTipo,
      cboCodigo: v.cboCodigo,
      cboDescricao: descricaoCboVinculo(v.cboCodigo, v.cboDescricao),
      cargaHorariaAmbulatorial: v.cargaHorariaAmbulatorial,
      cargaHorariaHospitalar: v.cargaHorariaHospitalar,
      cargaHorariaOutros: v.cargaHorariaOutros,
      dataEntrada: formatDate(v.dataEntrada),
      dataDesligamento: formatDate(v.dataDesligamento),
      motivoDesligamento: v.motivoDesligamento,
    })),
    historico: mapHistoricoResponse(p.historico || []),
  };
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

function montarWhereProfissionais(filtros?: ListarProfissionaisFiltros): Prisma.ProfissionalWhereInput | undefined {
  const busca = filtros?.q?.trim();
  const cpfBusca = busca ? limparNumeros(busca) : '';
  const nivelLotacao = filtros?.nivelLotacao?.trim();
  const unidadeLotacao = filtros?.unidadeLotacao?.trim();

  const condicoes: Prisma.ProfissionalWhereInput[] = [];

  if (!filtros?.incluirInativos) {
    condicoes.push({ ativo: true });
  }

  if (busca) {
    condicoes.push({
      OR: [
        { nomeProfissional: { contains: busca, mode: 'insensitive' } },
        ...(cpfBusca.length >= 3 ? [{ cpf: { contains: cpfBusca } }] : []),
      ],
    });
  }

  if (nivelLotacao === NIVEL_ATENCAO_BASICA) {
    const listaUbs = [...UNIDADES_UBS];
    condicoes.push({
      OR: [
        { nivelLotacao: NIVEL_ATENCAO_BASICA },
        { unidadeLotacao: { in: listaUbs } },
        { nomeFantasiaEstabelecimento: { in: listaUbs } },
        { unidadeLotacao: { startsWith: 'UBS ', mode: 'insensitive' } },
        { nomeFantasiaEstabelecimento: { startsWith: 'UBS ', mode: 'insensitive' } },
        { nomeFantasiaEstabelecimento: { startsWith: 'UNIDADE DE SAUDE DA FAMILIA', mode: 'insensitive' } },
        { nomeFantasiaEstabelecimento: { startsWith: 'UNIDADE BASICA', mode: 'insensitive' } },
      ],
    });
  } else if (nivelLotacao === NIVEL_ATENCAO_ESPECIALIZADA) {
    const listaUbs = [...UNIDADES_UBS];
    condicoes.push({
      OR: [
        { nivelLotacao: NIVEL_ATENCAO_ESPECIALIZADA },
        {
          AND: [
            { cnes: { not: null } },
            { cnes: { not: '' } },
            { NOT: { cnes: CNES_SECRETARIA_SMS } },
            { NOT: { nivelLotacao: NIVEL_ATENCAO_BASICA } },
            { NOT: { nivelLotacao: NIVEL_SECRETARIA_SAUDE } },
          ],
        },
        {
          AND: [
            { unidadeLotacao: { not: null } },
            { unidadeLotacao: { not: '' } },
            { unidadeLotacao: { notIn: listaUbs } },
            { unidadeLotacao: { not: UNIDADE_SECRETARIA_SAUDE } },
            { NOT: { unidadeLotacao: { startsWith: 'UBS ', mode: 'insensitive' } } },
            { NOT: { nivelLotacao: NIVEL_ATENCAO_BASICA } },
            { NOT: { nivelLotacao: NIVEL_SECRETARIA_SAUDE } },
          ],
        },
        {
          AND: [
            { nomeFantasiaEstabelecimento: { not: null } },
            { nomeFantasiaEstabelecimento: { not: '' } },
            { nomeFantasiaEstabelecimento: { notIn: listaUbs } },
            { NOT: { nomeFantasiaEstabelecimento: { equals: FANTASIA_SECRETARIA_SMS, mode: 'insensitive' } } },
            { NOT: { nomeFantasiaEstabelecimento: { equals: UNIDADE_SECRETARIA_SAUDE, mode: 'insensitive' } } },
            { NOT: { nomeFantasiaEstabelecimento: { startsWith: 'UNIDADE DE SAUDE DA FAMILIA', mode: 'insensitive' } } },
            { NOT: { nomeFantasiaEstabelecimento: { startsWith: 'UNIDADE BASICA', mode: 'insensitive' } } },
            { NOT: { nomeFantasiaEstabelecimento: { startsWith: 'UBS ', mode: 'insensitive' } } },
            { NOT: { nivelLotacao: NIVEL_ATENCAO_BASICA } },
            { NOT: { nivelLotacao: NIVEL_SECRETARIA_SAUDE } },
          ],
        },
      ],
    });
  } else if (nivelLotacao === NIVEL_SECRETARIA_SAUDE) {
    condicoes.push({
      OR: [
        { nivelLotacao: NIVEL_SECRETARIA_SAUDE },
        { unidadeLotacao: UNIDADE_SECRETARIA_SAUDE },
        { nomeFantasiaEstabelecimento: UNIDADE_SECRETARIA_SAUDE },
        { cnes: CNES_SECRETARIA_SMS },
        { nomeFantasiaEstabelecimento: { equals: FANTASIA_SECRETARIA_SMS, mode: 'insensitive' } },
      ],
    });
  } else if (nivelLotacao) {
    condicoes.push({ nivelLotacao });
  }

  const filtroUnidadeRedundante = Boolean(
    unidadeLotacao
    && nivelLotacao === NIVEL_SECRETARIA_SAUDE
    && unidadeLotacao === UNIDADE_SECRETARIA_SAUDE
  );

  if (unidadeLotacao && !filtroUnidadeRedundante) {
    condicoes.push({
      OR: [
        { unidadeLotacao },
        { nomeFantasiaEstabelecimento: unidadeLotacao },
      ],
    });
  }

  if (filtros?.treinamento) {
    condicoes.push({ treinamento: TREINAMENTO_DB[filtros.treinamento] });
  }

  if (filtros?.cadastroAtualizacao) {
    condicoes.push({ cadastroAtualizacao: CADASTRO_ATUALIZACAO_DB[filtros.cadastroAtualizacao] });
  }

  return condicoes.length ? { AND: condicoes } : undefined;
}

function mapProfissionalListItem(p: {
  id: string;
  nomeProfissional: string;
  cpf: string;
  cnes: string | null;
  unidadeLotacao: string | null;
  nomeFantasiaEstabelecimento: string | null;
  ativo: boolean;
  treinamento: string;
  cadastroAtualizacao: string;
}): ProfissionalListItem {
  return {
    id: p.id,
    nomeProfissional: p.nomeProfissional,
    cpf: formatarCPF(p.cpf),
    cnes: p.cnes,
    vinculoPrincipal: unidadeVinculoLabel(p),
    ativo: p.ativo,
    treinamento: treinamentoParaApi(p.treinamento),
    cadastroAtualizacao: cadastroAtualizacaoParaApi(p.cadastroAtualizacao),
  };
}

export async function listarProfissionais(
  prisma: PrismaClient,
  filtros?: ListarProfissionaisFiltros
): Promise<ProfissionalListagemResposta> {
  const where = montarWhereProfissionais(filtros);
  const paginaSolicitada = Math.max(1, filtros?.pagina ?? 1);
  const porPagina = PROFISSIONAIS_POR_PAGINA;

  const total = await prisma.profissional.count({ where });
  const totalPaginas = total > 0 ? Math.ceil(total / porPagina) : 1;
  const pagina = total > 0 ? Math.min(paginaSolicitada, totalPaginas) : 1;
  const skip = (pagina - 1) * porPagina;

  const lista = await prisma.profissional.findMany({
    where,
    orderBy: { nomeProfissional: 'asc' },
    skip,
    take: porPagina,
  });

  return {
    itens: lista.map(mapProfissionalListItem),
    total,
    pagina,
    porPagina,
    totalPaginas,
  };
}

export async function obterProfissional(prisma: PrismaClient, id: string): Promise<ProfissionalDetalhe | null> {
  const p = await fetchProfissionalInclude(prisma, id);
  if (!p) return null;
  return mapProfissionalDetalhe(p);
}

type UsuarioAuditoria = {
  usuarioId: string;
  usuarioNome: string;
};

export async function criarProfissional(
  prisma: PrismaClient,
  payload: ProfissionalCompletoPayload,
  usuario: UsuarioAuditoria
): Promise<ProfissionalDetalhe> {
  const profData = mapProfissionalData(payload.profissional);
  const docData = mapDocumentosData(payload.documentos);
  const endData = mapEnderecoData(payload.endereco);
  const bancoData = mapDadosBancariosData(payload.dadosBancarios);
  const vinculos = (payload.vinculos || []).map(mapVinculoData);

  const criado = await prisma.$transaction(async (tx) => {
    const profissional = await tx.profissional.create({
      data: {
        ...profData,
        ativo: true,
        criadoPorNome: usuario.usuarioNome,
        ...(docData ? { documento: { create: docData } } : {}),
        ...(endData ? { endereco: { create: endData } } : {}),
        ...(bancoData ? { dadosBancarios: { create: bancoData } } : {}),
        ...(vinculos.length ? { vinculos: { create: vinculos } } : {}),
      },
    });

    await tx.profissionalHistorico.create({
      data: {
        profissionalId: profissional.id,
        tipo: 'CRIACAO',
        usuarioId: usuario.usuarioId,
        usuarioNome: usuario.usuarioNome,
        alteracoes: alteracaoCriacao(),
      },
    });

    return tx.profissional.findUnique({
      where: { id: profissional.id },
      include: includeCompleto,
    });
  });

  return mapProfissionalDetalhe(criado!);
}

export async function atualizarProfissional(
  prisma: PrismaClient,
  id: string,
  payload: ProfissionalCompletoPayload,
  usuario: UsuarioAuditoria
): Promise<ProfissionalDetalhe | null> {
  const antesRaw = await fetchProfissionalInclude(prisma, id);
  if (!antesRaw) return null;

  const estadoAntes = mapProfissionalDetalhe(antesRaw);
  const existente = antesRaw;
  const houveEdicaoDados = haEdicaoDados(estadoAntes, existente, payload);

  const profData = mapProfissionalData({
    ...payload.profissional,
    ativo: payload.profissional.ativo ?? existente.ativo,
    treinamento: payload.profissional.treinamento ?? treinamentoParaApi(existente.treinamento),
    cadastroAtualizacao: houveEdicaoDados
      ? 'aguardando'
      : (payload.profissional.cadastroAtualizacao ?? cadastroAtualizacaoParaApi(existente.cadastroAtualizacao)),
  });
  const docData = mapDocumentosData(payload.documentos);
  const endData = mapEnderecoData(payload.endereco);
  const bancoData = mapDadosBancariosData(payload.dadosBancarios);
  const vinculos = (payload.vinculos || []).map(mapVinculoData);

  const atualizado = await prisma.$transaction(async (tx) => {
    await tx.profissional.update({ where: { id }, data: profData });

    if (docData) {
      await tx.documentoProfissional.upsert({
        where: { profissionalId: id },
        create: { profissionalId: id, ...docData },
        update: docData,
      });
    } else {
      await tx.documentoProfissional.deleteMany({ where: { profissionalId: id } });
    }

    if (endData) {
      await tx.enderecoProfissional.upsert({
        where: { profissionalId: id },
        create: { profissionalId: id, ...endData },
        update: endData,
      });
    } else {
      await tx.enderecoProfissional.deleteMany({ where: { profissionalId: id } });
    }

    if (bancoData) {
      await tx.dadosBancariosProfissional.upsert({
        where: { profissionalId: id },
        create: { profissionalId: id, ...bancoData },
        update: bancoData,
      });
    } else {
      await tx.dadosBancariosProfissional.deleteMany({ where: { profissionalId: id } });
    }

    await tx.vinculoProfissional.deleteMany({ where: { profissionalId: id } });
    if (vinculos.length) {
      await tx.vinculoProfissional.createMany({
        data: vinculos.map((v) => ({ ...v, profissionalId: id })),
      });
    }

    return tx.profissional.findUnique({
      where: { id },
      include: includeCompleto,
    });
  });

  const estadoDepois = mapProfissionalDetalhe(atualizado!);
  const alteracoes = gerarDiffProfissional(estadoAntes, estadoDepois);

  if (alteracoes.length > 0) {
    await prisma.profissionalHistorico.create({
      data: {
        profissionalId: id,
        tipo: 'ALTERACAO',
        usuarioId: usuario.usuarioId,
        usuarioNome: usuario.usuarioNome,
        alteracoes,
      },
    });
    const comHistorico = await fetchProfissionalInclude(prisma, id);
    return mapProfissionalDetalhe(comHistorico!);
  }

  return estadoDepois;
}

