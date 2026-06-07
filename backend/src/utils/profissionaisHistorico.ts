import type {
  DadosBancariosPayload,
  DocumentosPayload,
  EnderecoPayload,
  ProfissionalDetalhe,
  VinculoPayload,
} from '../types/profissionais';

export type AlteracaoHistorico = {
  campo: string;
  valorAnterior: string | null;
  valorNovo: string | null;
  secao?: string;
};

type SnapshotComparavel = Omit<
  ProfissionalDetalhe,
  'id' | 'vinculoPrincipal' | 'criadoPorNome' | 'createdAt' | 'historico'
>;

const ROTULOS_PROFISSIONAL: Record<string, string> = {
  cnes: 'CNES',
  nomeFantasiaEstabelecimento: 'Nome fantasia do estabelecimento',
  nomeProfissional: 'Nome do profissional',
  pisPasep: 'PIS/PASEP',
  cpf: 'CPF',
  numeroCns: 'CNS',
  sexo: 'Sexo',
  nomeMae: 'Nome da mãe',
  nomePai: 'Nome do pai',
  dataNascimento: 'Data de nascimento',
  municipioNascimento: 'Município de nascimento',
  codigoIbgeMunicipioNascimento: 'Código IBGE município nascimento',
  ufNascimento: 'UF de nascimento',
  racaCor: 'Raça/cor',
  nacionalidade: 'Nacionalidade',
  paisOrigem: 'País de origem',
  dataEntrada: 'Data de entrada no país',
  dataNaturalizacao: 'Data de naturalização',
  numeroPortaria: 'Número da portaria',
  escolaridade: 'Escolaridade',
  situacaoFamiliarConjugal: 'Situação familiar/conjugal',
  frequentaEscola: 'Frequenta escola',
  ativo: 'Situação do cadastro',
};

const ROTULOS_DOCUMENTOS: Record<string, string> = {
  tipoCertidao: 'Tipo de certidão',
  cartorio: 'Cartório',
  livro: 'Livro',
  fls: 'Folhas',
  termo: 'Termo',
  dataEmissaoCertidao: 'Data emissão certidão',
  rgNumero: 'RG número',
  rgUf: 'RG UF',
  rgOrgaoEmissor: 'RG órgão emissor',
  rgDataEmissao: 'RG data emissão',
  tituloEleitor: 'Título de eleitor',
  zona: 'Zona eleitoral',
  secao: 'Seção eleitoral',
  ctpsNumero: 'CTPS número',
  ctpsSerie: 'CTPS série',
  ctpsUf: 'CTPS UF',
  ctpsDataEmissao: 'CTPS data emissão',
};

const ROTULOS_ENDERECO: Record<string, string> = {
  tipoLogradouro: 'Tipo de logradouro',
  logradouro: 'Logradouro',
  numero: 'Número',
  complemento: 'Complemento',
  bairroDistrito: 'Bairro/distrito',
  municipioResidencia: 'Município de residência',
  codigoIbgeMunicipio: 'Código IBGE município',
  uf: 'UF',
  cep: 'CEP',
  telefone: 'Telefone',
};

const ROTULOS_BANCARIOS: Record<string, string> = {
  bancoCodigo: 'Código do banco',
  bancoNome: 'Nome do banco',
  agencia: 'Agência',
  contaCorrente: 'Conta corrente',
};

const CAMPOS_DATA = new Set([
  'dataNascimento',
  'dataEntrada',
  'dataNaturalizacao',
  'dataEmissaoCertidao',
  'rgDataEmissao',
  'ctpsDataEmissao',
  'dataEntrada',
  'dataDesligamento',
]);

const CAMPOS_BOOLEAN = new Set(['frequentaEscola', 'ativo', 'atendimentoSus']);

function normalizarValor(chave: string, valor: unknown): string | null {
  if (valor === null || valor === undefined || valor === '') return null;
  if (chave === 'ativo') {
    return valor === true || valor === 'true' ? 'Ativo' : 'Inativo';
  }
  if (CAMPOS_BOOLEAN.has(chave)) {
    return valor === true || valor === 'true' ? 'Sim' : 'Não';
  }
  if (CAMPOS_DATA.has(chave) && typeof valor === 'string') {
    const d = new Date(valor);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString('pt-BR');
    }
  }
  if (chave === 'sexo') {
    const mapa: Record<string, string> = { M: 'Masculino', F: 'Feminino', I: 'Ignorado' };
    return mapa[String(valor)] ?? String(valor);
  }
  return String(valor).trim() || null;
}

function compararSecao(
  secao: string,
  rotulos: Record<string, string>,
  antes: Record<string, unknown> | null,
  depois: Record<string, unknown> | null
): AlteracaoHistorico[] {
  const alteracoes: AlteracaoHistorico[] = [];
  const chaves = new Set([...Object.keys(rotulos), ...Object.keys(antes || {}), ...Object.keys(depois || {})]);

  for (const chave of chaves) {
    const valorAntes = normalizarValor(chave, antes?.[chave]);
    const valorDepois = normalizarValor(chave, depois?.[chave]);
    if (valorAntes !== valorDepois) {
      alteracoes.push({
        campo: rotulos[chave] || chave,
        valorAnterior: valorAntes,
        valorNovo: valorDepois,
        secao,
      });
    }
  }
  return alteracoes;
}

function resumoVinculos(vinculos: VinculoPayload[] | null | undefined): string {
  if (!vinculos?.length) return 'Nenhum vínculo';
  return vinculos
    .map((v, i) => {
      const cbo = v.cboDescricao || v.cboCodigo || 'Sem CBO';
      const sus = v.atendimentoSus ? 'SUS' : 'Não SUS';
      const entrada = v.dataEntrada ? normalizarValor('dataEntrada', v.dataEntrada) : '—';
      const deslig = v.dataDesligamento ? normalizarValor('dataDesligamento', v.dataDesligamento) : null;
      return `${i + 1}. ${cbo} (${sus}, entrada: ${entrada}${deslig ? `, desligamento: ${deslig}` : ''})`;
    })
    .join('; ');
}

function compararVinculos(antes: VinculoPayload[] | null, depois: VinculoPayload[] | null): AlteracaoHistorico[] {
  const resumoAntes = resumoVinculos(antes);
  const resumoDepois = resumoVinculos(depois);
  if (resumoAntes === resumoDepois) return [];
  return [{
    campo: 'Vínculos (CBO)',
    valorAnterior: resumoAntes,
    valorNovo: resumoDepois,
    secao: 'Vínculos',
  }];
}

export function gerarDiffProfissional(antes: SnapshotComparavel, depois: SnapshotComparavel): AlteracaoHistorico[] {
  const alteracoes: AlteracaoHistorico[] = [];

  const profAntes = { ...antes };
  const profDepois = { ...depois };
  const docAntes = profAntes.documentos;
  const docDepois = profDepois.documentos;
  const endAntes = profAntes.endereco;
  const endDepois = profDepois.endereco;
  const bancoAntes = profAntes.dadosBancarios;
  const bancoDepois = profDepois.dadosBancarios;
  const vincAntes = profAntes.vinculos;
  const vincDepois = profDepois.vinculos;

  const camposProf = Object.keys(ROTULOS_PROFISSIONAL);
  for (const chave of camposProf) {
    const valorAntes = normalizarValor(chave, (profAntes as Record<string, unknown>)[chave]);
    const valorDepois = normalizarValor(chave, (profDepois as Record<string, unknown>)[chave]);
    if (valorAntes !== valorDepois) {
      alteracoes.push({
        campo: ROTULOS_PROFISSIONAL[chave],
        valorAnterior: valorAntes,
        valorNovo: valorDepois,
        secao: 'Identificação',
      });
    }
  }

  alteracoes.push(
    ...compararSecao('Documentos', ROTULOS_DOCUMENTOS, docAntes as Record<string, unknown> | null, docDepois as Record<string, unknown> | null),
    ...compararSecao('Endereço', ROTULOS_ENDERECO, endAntes as Record<string, unknown> | null, endDepois as Record<string, unknown> | null),
    ...compararSecao('Dados bancários', ROTULOS_BANCARIOS, bancoAntes as Record<string, unknown> | null, bancoDepois as Record<string, unknown> | null),
    ...compararVinculos(vincAntes, vincDepois)
  );

  return alteracoes;
}

export function alteracaoCriacao(): AlteracaoHistorico[] {
  return [{
    campo: 'Cadastro',
    valorAnterior: null,
    valorNovo: 'Cadastro criado',
    secao: 'Sistema',
  }];
}

export type HistoricoRegistro = {
  id: string;
  tipo: 'CRIACAO' | 'ALTERACAO';
  usuarioNome: string;
  alteracoes: AlteracaoHistorico[];
  createdAt: string;
};

export function mapHistoricoResponse(
  registros: {
    id: string;
    tipo: 'CRIACAO' | 'ALTERACAO';
    usuarioNome: string;
    alteracoes: unknown;
    createdAt: Date;
  }[]
): HistoricoRegistro[] {
  return registros.map((r) => ({
    id: r.id,
    tipo: r.tipo,
    usuarioNome: r.usuarioNome,
    alteracoes: r.alteracoes as AlteracaoHistorico[],
    createdAt: r.createdAt.toISOString(),
  }));
}
