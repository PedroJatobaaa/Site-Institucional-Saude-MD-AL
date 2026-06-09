import { jsPDF } from 'jspdf';
import type { ProfissionalDetalhe, VinculoPayload } from './types';

const MARGEM = 20;
const LARGURA_UTIL = 170;
const ALTURA_MAX = 272;

const ROTULOS_ESTABELECIMENTO: Record<string, string> = {
  cnes: 'CNES',
  nivelLotacao: 'Categoria de lotação',
  unidadeLotacao: 'Unidade de lotação',
  nomeFantasiaEstabelecimento: 'Nome fantasia do estabelecimento',
};

const ROTULOS_PESSOAIS: Record<string, string> = {
  nomeProfissional: 'Nome do profissional',
  cpf: 'CPF',
  numeroCns: 'CNS',
  pisPasep: 'PIS/PASEP',
  sexo: 'Sexo',
  dataNascimento: 'Data de nascimento',
  nomeMae: 'Nome da mãe',
  nomePai: 'Nome do pai',
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

const ROTULOS_VINCULO: Record<string, string> = {
  registroConselhoClasse: 'Registro conselho de classe',
  orgaoEmissor: 'Órgão emissor',
  atendimentoSus: 'Atendimento SUS',
  codigoVinculacao: 'Código vinculação',
  codigoTipo: 'Código tipo',
  codigoSubTipo: 'Código subtipo',
  cboCodigo: 'CBO — código',
  cboDescricao: 'CBO — descrição',
  cargaHorariaAmbulatorial: 'CH ambulatorial (h/semana)',
  cargaHorariaHospitalar: 'CH hospitalar (h/semana)',
  cargaHorariaOutros: 'CH outros (h/semana)',
  dataEntrada: 'Data entrada',
  dataDesligamento: 'Data desligamento',
  motivoDesligamento: 'Motivo desligamento',
};

const CAMPOS_DATA = new Set([
  'dataNascimento',
  'dataEntrada',
  'dataNaturalizacao',
  'dataEmissaoCertidao',
  'rgDataEmissao',
  'ctpsDataEmissao',
  'dataDesligamento',
]);

const BOOLEANOS_SO_SE_TRUE = new Set(['frequentaEscola', 'atendimentoSus']);

type CampoPdf = { rotulo: string; valor: string };

function temValor(valor: unknown): boolean {
  if (valor === null || valor === undefined) return false;
  if (typeof valor === 'string') return valor.trim() !== '';
  if (typeof valor === 'number') return !Number.isNaN(valor);
  return true;
}

function formatarData(valor: string): string {
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return valor;
  return d.toLocaleDateString('pt-BR');
}

function formatarValorCampo(chave: string, valor: unknown): string | null {
  if (chave === 'ativo') {
    return valor === true || valor === 'true' ? 'Ativo' : 'Inativo';
  }
  if (BOOLEANOS_SO_SE_TRUE.has(chave)) {
    return valor === true ? 'Sim' : null;
  }
  if (chave === 'sexo') {
    const mapa: Record<string, string> = { M: 'Masculino', F: 'Feminino', I: 'Ignorado' };
    const texto = mapa[String(valor)];
    return texto ?? (temValor(valor) ? String(valor) : null);
  }
  if (CAMPOS_DATA.has(chave) && typeof valor === 'string' && temValor(valor)) {
    return formatarData(valor);
  }
  if (typeof valor === 'number') return String(valor);
  if (typeof valor === 'string' && temValor(valor)) return valor.trim();
  return null;
}

function extrairCampos(
  dados: Record<string, unknown> | null | undefined,
  rotulos: Record<string, string>,
  opcoes?: { sempre?: string[] }
): CampoPdf[] {
  if (!dados) return [];
  const campos: CampoPdf[] = [];
  const sempre = new Set(opcoes?.sempre ?? []);

  for (const chave of Object.keys(rotulos)) {
    const valorBruto = dados[chave];
    const incluir = sempre.has(chave) || (
      BOOLEANOS_SO_SE_TRUE.has(chave) ? valorBruto === true : temValor(valorBruto)
    );
    if (!incluir) continue;

    const valor = formatarValorCampo(chave, valorBruto);
    if (valor === null && !sempre.has(chave)) continue;

    campos.push({
      rotulo: rotulos[chave],
      valor: valor ?? String(valorBruto),
    });
  }

  return campos;
}

function vinculoTemDados(v: VinculoPayload): boolean {
  return extrairCampos(v as unknown as Record<string, unknown>, ROTULOS_VINCULO).length > 0;
}

function slugNome(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50) || 'profissional';
}

export function gerarPdfProfissional(detalhe: ProfissionalDetalhe): void {
  const pdf = new jsPDF('p', 'mm', 'a4');
  let y = MARGEM;

  const novaPaginaSePreciso = (alturaNecessaria: number) => {
    if (y + alturaNecessaria > ALTURA_MAX) {
      pdf.addPage();
      y = MARGEM;
    }
  };

  const escreverLinhas = (texto: string, tamanho: number, negrito = false) => {
    pdf.setFontSize(tamanho);
    pdf.setFont('helvetica', negrito ? 'bold' : 'normal');
    const linhas = pdf.splitTextToSize(texto, LARGURA_UTIL) as string[];
    const alturaLinha = tamanho * 0.45;
    novaPaginaSePreciso(linhas.length * alturaLinha + 2);
    pdf.text(linhas, MARGEM, y);
    y += linhas.length * alturaLinha + 2;
  };

  const escreverSecao = (titulo: string, campos: CampoPdf[]) => {
    if (!campos.length) return;
    y += 4;
    novaPaginaSePreciso(12);
    escreverLinhas(titulo, 11, true);
    y += 1;
    for (const campo of campos) {
      escreverLinhas(`${campo.rotulo}: ${campo.valor}`, 10);
    }
  };

  const agora = new Date();
  const dataGeracao = agora.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  escreverLinhas('Ficha Cadastral do Profissional — SUS', 14, true);
  escreverLinhas(detalhe.nomeProfissional, 12, true);
  escreverLinhas(`Gerado em ${dataGeracao}`, 9);
  y += 2;

  const estabelecimento = extrairCampos(
    {
      cnes: detalhe.cnes,
      nivelLotacao: detalhe.nivelLotacao,
      unidadeLotacao: detalhe.unidadeLotacao,
      nomeFantasiaEstabelecimento: detalhe.nomeFantasiaEstabelecimento,
    },
    ROTULOS_ESTABELECIMENTO
  );
  escreverSecao('Estabelecimento', estabelecimento);

  const pessoais = extrairCampos(
    detalhe as unknown as Record<string, unknown>,
    ROTULOS_PESSOAIS,
    { sempre: ['nomeProfissional', 'cpf', 'ativo'] }
  );
  escreverSecao('Dados pessoais', pessoais);

  const documentos = extrairCampos(
    detalhe.documentos as unknown as Record<string, unknown>,
    ROTULOS_DOCUMENTOS
  );
  escreverSecao('Documentos', documentos);

  const endereco = extrairCampos(
    detalhe.endereco as unknown as Record<string, unknown>,
    ROTULOS_ENDERECO
  );
  escreverSecao('Endereço e contato', endereco);

  const bancarios = extrairCampos(
    detalhe.dadosBancarios as unknown as Record<string, unknown>,
    ROTULOS_BANCARIOS
  );
  escreverSecao('Dados bancários', bancarios);

  const vinculosComDados = (detalhe.vinculos || []).filter(vinculoTemDados);
  if (vinculosComDados.length > 0) {
    y += 4;
    novaPaginaSePreciso(12);
    escreverLinhas('Vínculos CBO', 11, true);
    vinculosComDados.forEach((vinculo, index) => {
      const campos = extrairCampos(
        vinculo as unknown as Record<string, unknown>,
        ROTULOS_VINCULO
      );
      if (!campos.length) return;
      y += 2;
      escreverLinhas(`Vínculo ${index + 1}`, 10, true);
      for (const campo of campos) {
        escreverLinhas(`${campo.rotulo}: ${campo.valor}`, 10);
      }
    });
  }

  pdf.save(`profissional_${slugNome(detalhe.nomeProfissional)}.pdf`);
}
