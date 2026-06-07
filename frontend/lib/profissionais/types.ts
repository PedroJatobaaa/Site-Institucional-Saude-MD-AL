export type ProfissionalPayload = {
  cnes?: string;
  nomeFantasiaEstabelecimento?: string;
  nomeProfissional: string;
  pisPasep?: string;
  cpf: string;
  numeroCns?: string;
  sexo?: string;
  nomeMae?: string;
  nomePai?: string;
  dataNascimento?: string;
  municipioNascimento?: string;
  codigoIbgeMunicipioNascimento?: string;
  ufNascimento?: string;
  racaCor?: string;
  nacionalidade?: string;
  paisOrigem?: string;
  dataEntrada?: string;
  dataNaturalizacao?: string;
  numeroPortaria?: string;
  escolaridade?: string;
  situacaoFamiliarConjugal?: string;
  frequentaEscola?: boolean;
  ativo?: boolean;
};

export type DocumentosPayload = {
  tipoCertidao?: string;
  cartorio?: string;
  livro?: string;
  fls?: string;
  termo?: string;
  dataEmissaoCertidao?: string;
  rgNumero?: string;
  rgUf?: string;
  rgOrgaoEmissor?: string;
  rgDataEmissao?: string;
  tituloEleitor?: string;
  zona?: string;
  secao?: string;
  ctpsNumero?: string;
  ctpsSerie?: string;
  ctpsUf?: string;
  ctpsDataEmissao?: string;
};

export type EnderecoPayload = {
  tipoLogradouro?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairroDistrito?: string;
  municipioResidencia?: string;
  codigoIbgeMunicipio?: string;
  uf?: string;
  cep?: string;
  telefone?: string;
};

export type DadosBancariosPayload = {
  bancoCodigo?: string;
  bancoNome?: string;
  agencia?: string;
  contaCorrente?: string;
};

export type VinculoPayload = {
  id?: string;
  registroConselhoClasse?: string;
  orgaoEmissor?: string;
  atendimentoSus?: boolean;
  codigoVinculacao?: string;
  codigoTipo?: string;
  codigoSubTipo?: string;
  cboCodigo?: string;
  cboDescricao?: string;
  cargaHorariaAmbulatorial?: number | '' | null;
  cargaHorariaHospitalar?: number | '' | null;
  cargaHorariaOutros?: number | '' | null;
  dataEntrada?: string;
  dataDesligamento?: string;
  motivoDesligamento?: string;
};

export type ProfissionalCompletoPayload = {
  profissional: ProfissionalPayload;
  documentos?: DocumentosPayload | null;
  endereco?: EnderecoPayload | null;
  dadosBancarios?: DadosBancariosPayload | null;
  vinculos?: VinculoPayload[];
};

export type AlteracaoHistorico = {
  campo: string;
  valorAnterior: string | null;
  valorNovo: string | null;
  secao?: string;
};

export type ProfissionalHistoricoItem = {
  id: string;
  tipo: 'CRIACAO' | 'ALTERACAO';
  usuarioNome: string;
  alteracoes: AlteracaoHistorico[];
  createdAt: string;
};

export type ProfissionalListItem = {
  id: string;
  nomeProfissional: string;
  cpf: string;
  numeroCns: string | null;
  vinculoPrincipal: string | null;
  ativo: boolean;
};

export type ProfissionalDetalhe = ProfissionalListItem & {
  cnes: string | null;
  nomeFantasiaEstabelecimento: string | null;
  pisPasep: string | null;
  sexo: string | null;
  nomeMae: string | null;
  nomePai: string | null;
  dataNascimento: string | null;
  municipioNascimento: string | null;
  codigoIbgeMunicipioNascimento: string | null;
  ufNascimento: string | null;
  racaCor: string | null;
  nacionalidade: string | null;
  paisOrigem: string | null;
  dataEntrada: string | null;
  dataNaturalizacao: string | null;
  numeroPortaria: string | null;
  escolaridade: string | null;
  situacaoFamiliarConjugal: string | null;
  frequentaEscola: boolean;
  ativo: boolean;
  criadoPorNome: string | null;
  createdAt: string;
  documentos: DocumentosPayload | null;
  endereco: EnderecoPayload | null;
  dadosBancarios: DadosBancariosPayload | null;
  vinculos: VinculoPayload[];
  historico: ProfissionalHistoricoItem[];
};

export const profissionalVazio = (): ProfissionalCompletoPayload => ({
  profissional: {
    nomeProfissional: '',
    cpf: '',
    nacionalidade: 'Brasileira',
    frequentaEscola: false,
    ativo: true,
  },
  documentos: {},
  endereco: {},
  dadosBancarios: {},
  vinculos: [],
});

export const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

export const SEXO_OPCOES = [
  { value: 'M', label: 'Masculino' },
  { value: 'F', label: 'Feminino' },
  { value: 'I', label: 'Ignorado' },
];

export const RACA_COR_OPCOES = [
  'Branca', 'Preta', 'Parda', 'Amarela', 'Indígena', 'Ignorado',
];

export const ESCOLARIDADE_OPCOES = [
  'Analfabeto',
  'Fundamental incompleto',
  'Fundamental completo',
  'Médio incompleto',
  'Médio completo',
  'Superior incompleto',
  'Superior completo',
  'Pós-graduação',
  'Ignorado',
];

export const SITUACAO_FAMILIAR_OPCOES = [
  'Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União estável', 'Ignorado',
];

export const TIPO_CERTIDAO_OPCOES = [
  'Nascimento', 'Casamento', 'Divórcio', 'Separação', 'Óbito',
];

export const TIPO_LOGRADOURO_OPCOES = [
  'Rua', 'Avenida', 'Travessa', 'Alameda', 'Rodovia', 'Estrada', 'Loteamento', 'Outro',
];
