export type StatusTreinamento = 'realizado' | 'agendado' | 'aguardando';
export type StatusCadastroAtualizacao = 'realizado' | 'aguardando';

export const TREINAMENTO_OPCOES: StatusTreinamento[] = ['realizado', 'agendado', 'aguardando'];
export const CADASTRO_ATUALIZACAO_OPCOES: StatusCadastroAtualizacao[] = ['realizado', 'aguardando'];

export type ProfissionalPayload = {
  cnes?: string | null;
  nivelLotacao?: string | null;
  unidadeLotacao?: string | null;
  nomeFantasiaEstabelecimento?: string | null;
  nomeProfissional: string;
  pisPasep?: string | null;
  cpf: string;
  numeroCns?: string | null;
  sexo?: string | null;
  nomeMae?: string | null;
  nomePai?: string | null;
  dataNascimento?: string | null;
  municipioNascimento?: string | null;
  codigoIbgeMunicipioNascimento?: string | null;
  ufNascimento?: string | null;
  racaCor?: string | null;
  nacionalidade?: string | null;
  paisOrigem?: string | null;
  dataEntrada?: string | null;
  dataNaturalizacao?: string | null;
  numeroPortaria?: string | null;
  escolaridade?: string | null;
  situacaoFamiliarConjugal?: string | null;
  frequentaEscola?: boolean;
  ativo?: boolean;
  treinamento?: StatusTreinamento;
  cadastroAtualizacao?: StatusCadastroAtualizacao;
};

export type DocumentosPayload = {
  tipoCertidao?: string | null;
  cartorio?: string | null;
  livro?: string | null;
  fls?: string | null;
  termo?: string | null;
  dataEmissaoCertidao?: string | null;
  rgNumero?: string | null;
  rgUf?: string | null;
  rgOrgaoEmissor?: string | null;
  rgDataEmissao?: string | null;
  tituloEleitor?: string | null;
  zona?: string | null;
  secao?: string | null;
  ctpsNumero?: string | null;
  ctpsSerie?: string | null;
  ctpsUf?: string | null;
  ctpsDataEmissao?: string | null;
};

export type EnderecoPayload = {
  tipoLogradouro?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairroDistrito?: string | null;
  municipioResidencia?: string | null;
  codigoIbgeMunicipio?: string | null;
  uf?: string | null;
  cep?: string | null;
  telefone?: string | null;
};

export type DadosBancariosPayload = {
  bancoCodigo?: string | null;
  bancoNome?: string | null;
  agencia?: string | null;
  contaCorrente?: string | null;
};

export type VinculoPayload = {
  id?: string;
  registroConselhoClasse?: string | null;
  orgaoEmissor?: string | null;
  atendimentoSus?: boolean;
  codigoVinculacao?: string | null;
  codigoTipo?: string | null;
  codigoSubTipo?: string | null;
  cboCodigo?: string | null;
  cboDescricao?: string | null;
  cargaHorariaAmbulatorial?: number | null;
  cargaHorariaHospitalar?: number | null;
  cargaHorariaOutros?: number | null;
  dataEntrada?: string | null;
  dataDesligamento?: string | null;
  motivoDesligamento?: string | null;
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

export const PROFISSIONAIS_POR_PAGINA = 20;

export type ProfissionalListItem = {
  id: string;
  nomeProfissional: string;
  cpf: string;
  cnes: string | null;
  vinculoPrincipal: string | null;
  ativo: boolean;
  treinamento: StatusTreinamento;
  cadastroAtualizacao: StatusCadastroAtualizacao;
};

export type ProfissionalListagemResposta = {
  itens: ProfissionalListItem[];
  total: number;
  pagina: number;
  porPagina: number;
  totalPaginas: number;
};

export type ProfissionalDetalhe = ProfissionalListItem & {
  numeroCns: string | null;
  nivelLotacao: string | null;
  unidadeLotacao: string | null;
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
