import type { PrismaClient } from '@prisma/client';
import type {
  DadosBancariosPayload,
  DocumentosPayload,
  EnderecoPayload,
  ProfissionalCompletoPayload,
  ProfissionalDetalhe,
  ProfissionalListItem,
  VinculoPayload,
} from '../types/profissionais';
import { formatarCPF, formatarCNS, limparNumeros, normalizarCPF } from '../utils/validators/documentos';
import {
  alteracaoCriacao,
  gerarDiffProfissional,
  mapHistoricoResponse,
} from '../utils/profissionaisHistorico';

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

function mapVinculoData(v: VinculoPayload) {
  return {
    registroConselhoClasse: v.registroConselhoClasse || null,
    orgaoEmissor: v.orgaoEmissor || null,
    atendimentoSus: v.atendimentoSus ?? false,
    codigoVinculacao: v.codigoVinculacao || null,
    codigoTipo: v.codigoTipo || null,
    codigoSubTipo: v.codigoSubTipo || null,
    cboCodigo: v.cboCodigo || null,
    cboDescricao: v.cboDescricao || null,
    cargaHorariaAmbulatorial: v.cargaHorariaAmbulatorial ?? null,
    cargaHorariaHospitalar: v.cargaHorariaHospitalar ?? null,
    cargaHorariaOutros: v.cargaHorariaOutros ?? null,
    dataEntrada: parseDate(v.dataEntrada),
    dataDesligamento: parseDate(v.dataDesligamento),
    motivoDesligamento: v.motivoDesligamento || null,
  };
}

function mapProfissionalData(p: ProfissionalCompletoPayload['profissional']) {
  return {
    cnes: p.cnes || null,
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
  };
}

function vinculoPrincipalLabel(vinculos: { cboDescricao: string | null; cboCodigo: string | null; dataDesligamento: Date | null; dataEntrada: Date | null }[]): string | null {
  if (!vinculos.length) return null;
  const ativos = vinculos.filter((v) => !v.dataDesligamento);
  const lista = ativos.length ? ativos : [...vinculos].sort((a, b) => {
    const da = a.dataEntrada?.getTime() ?? 0;
    const db = b.dataEntrada?.getTime() ?? 0;
    return db - da;
  });
  const v = lista[0];
  if (v.cboDescricao) return v.cboDescricao;
  if (v.cboCodigo) return `CBO ${v.cboCodigo}`;
  return null;
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

function mapProfissionalDetalhe(p: NonNullable<Awaited<ReturnType<typeof fetchProfissionalInclude>>>): ProfissionalDetalhe {
  return {
    id: p.id,
    nomeProfissional: p.nomeProfissional,
    cpf: formatarCPF(p.cpf),
    numeroCns: p.numeroCns ? formatarCNS(p.numeroCns) : null,
    vinculoPrincipal: vinculoPrincipalLabel(p.vinculos),
    cnes: p.cnes,
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
      cboDescricao: v.cboDescricao,
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

export async function listarProfissionais(prisma: PrismaClient, q?: string): Promise<ProfissionalListItem[]> {
  const busca = q?.trim();
  const cpfBusca = busca ? limparNumeros(busca) : '';

  const where = busca
    ? {
        OR: [
          { nomeProfissional: { contains: busca, mode: 'insensitive' as const } },
          ...(cpfBusca.length >= 3 ? [{ cpf: { contains: cpfBusca } }] : []),
        ],
      }
    : undefined;

  const lista = await prisma.profissional.findMany({
    where,
    include: { vinculos: true },
    orderBy: { nomeProfissional: 'asc' },
  });

  return lista.map((p) => ({
    id: p.id,
    nomeProfissional: p.nomeProfissional,
    cpf: formatarCPF(p.cpf),
    numeroCns: p.numeroCns ? formatarCNS(p.numeroCns) : null,
    vinculoPrincipal: vinculoPrincipalLabel(p.vinculos),
    ativo: p.ativo,
  }));
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

  const profData = mapProfissionalData({
    ...payload.profissional,
    ativo: payload.profissional.ativo ?? existente.ativo,
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

