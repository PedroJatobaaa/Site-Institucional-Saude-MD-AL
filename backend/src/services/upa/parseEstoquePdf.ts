export type ItemEstoqueExtraido = {
  codigo: string;
  nome: string;
  unidade: string | null;
  quantidade: number | null;
};

export type ResultadoParseEstoque = {
  data_referencia: Date | null;
  itens: ItemEstoqueExtraido[];
};

/** Unidades do HÓRUS — ordem importa (mais longas primeiro). */
const UNIDADES = [
  'FR-AMP.',
  'FR-AMP',
  'SERINGA',
  'CARTELA',
  'COMP.',
  'CPS.',
  'AMP',
  'FR.',
  'PC.',
  'RL.',
  'PAR',
  'CARP',
  'BS.',
  'UN',
];

function parseQuantidadeBr(raw: string): number | null {
  const limpo = raw.replace(/\./g, '').replace(',', '.');
  const n = Number(limpo);
  return Number.isFinite(n) ? Math.round(n) : null;
}

function parseDataReferencia(texto: string): Date | null {
  const m = texto.match(/Estoque\s+(\d{2})\/(\d{2})\/(\d{4})/i);
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  const d = new Date(Date.UTC(Number(yyyy), Number(mm) - 1, Number(dd)));
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * pdf-parse cola a unidade no nome (ex.: "2 MLAMP", "COMPRIMIDOCOMP.").
 * Extrai a unidade do final e separa visualmente no nome.
 */
function extrairUnidade(nomeComUnidade: string): { nome: string; unidade: string | null } {
  const trimmed = nomeComUnidade.replace(/\s+/g, ' ').trim();
  for (const u of UNIDADES) {
    const re = new RegExp(`${u.replace('.', '\\.')}$`, 'i');
    if (re.test(trimmed)) {
      const semUnidade = trimmed.replace(re, '').trim();
      return {
        nome: semUnidade,
        unidade: u.toUpperCase(),
      };
    }
  }
  return { nome: trimmed, unidade: null };
}

function isLixo(linha: string): boolean {
  const l = linha.trim();
  if (!l) return true;
  if (/^Página\s*\d+/i.test(l)) return true;
  if (/^--\s*\d+\s+of\s+\d+/i.test(l)) return true;
  if (/^Lote/i.test(l) && /Validade/i.test(l)) return true;
  if (/^SECRETARIA MUNICIPAL/i.test(l)) return true;
  if (/^FARMÁCIA UPA/i.test(l)) return true;
  if (/^MARECHAL DEODORO/i.test(l)) return true;
  if (/^Posição de Estoque/i.test(l)) return true;
  if (/^Estoque\s+\d{2}\/\d{2}\/\d{4}/i.test(l)) return true;
  if (/Segunda-feira|Terça-feira|Quarta-feira|Quinta-feira|Sexta-feira|Sábado|Domingo/i.test(l) && /20\d{2}/.test(l)) {
    return true;
  }
  if (/SUS\s*-|Ministério da Saúde|HÓRUS/i.test(l)) return true;
  if (/Total Relatório/i.test(l)) return true;
  return false;
}

/**
 * Parser do PDF HÓRUS "Posição de Estoque - Estabelecimento".
 * O texto do pdf-parse vem sem tabs: "Produto:Unidade:" e "Total:1.408,001.760".
 */
export function parseEstoqueHorusTexto(texto: string): ResultadoParseEstoque {
  const data_referencia = parseDataReferencia(texto);
  const linhas = texto.replace(/\r/g, '').split('\n');

  const mapa = new Map<string, ItemEstoqueExtraido>();

  let acumulando: { codigo: string; partes: string[] } | null = null;
  let ultimoCodigo: string | null = null;

  const finalizarProduto = (blocoNome: string) => {
    if (!acumulando) return;
    const semMarcador = blocoNome
      .replace(/\s*Produto:\s*Unidade:\s*/i, '')
      .trim();
    const { nome, unidade } = extrairUnidade(semMarcador);
    const codigo = acumulando.codigo;
    const existente = mapa.get(codigo);
    if (existente) {
      if (nome.length > existente.nome.length) existente.nome = nome;
      if (!existente.unidade && unidade) existente.unidade = unidade;
    } else {
      mapa.set(codigo, { codigo, nome, unidade, quantidade: null });
    }
  };

  for (const linhaBruta of linhas) {
    const linha = linhaBruta.replace(/\t/g, ' ').trim();
    if (isLixo(linha)) continue;

    // Total:1.408,001.760  → valor com centavos + quantidade colada
    const totalMatch = linha.match(/^Total:\s*([\d.]+),(\d{2})([\d.]+)\s*$/i);
    if (totalMatch && ultimoCodigo) {
      const qtd = parseQuantidadeBr(totalMatch[3]);
      const item = mapa.get(ultimoCodigo);
      if (item && qtd != null) {
        item.quantidade = (item.quantidade ?? 0) + qtd;
      }
      continue;
    }

    const inicioProduto = linha.match(/^(BR[\dA-Z\-]+)\s+(.+)$/i);
    if (inicioProduto) {
      acumulando = null;
      const codigo = inicioProduto[1].toUpperCase();
      const resto = inicioProduto[2];
      if (/Produto:\s*Unidade:/i.test(resto)) {
        acumulando = { codigo, partes: [resto] };
        finalizarProduto(resto);
        ultimoCodigo = codigo;
        acumulando = null;
      } else {
        acumulando = { codigo, partes: [resto] };
        ultimoCodigo = codigo;
      }
      continue;
    }

    if (acumulando) {
      acumulando.partes.push(linha);
      const bloco = acumulando.partes.join(' ');
      if (/Produto:\s*Unidade:/i.test(bloco)) {
        finalizarProduto(bloco);
        ultimoCodigo = acumulando.codigo;
        acumulando = null;
      }
    }
  }

  const itens = Array.from(mapa.values()).sort((a, b) =>
    a.nome.localeCompare(b.nome, 'pt-BR')
  );

  return { data_referencia, itens };
}

export async function parseEstoquePdfBuffer(buffer: Buffer): Promise<ResultadoParseEstoque> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require('pdf-parse');
  const pdfParse = typeof mod === 'function' ? mod : mod.default;
  if (typeof pdfParse !== 'function') {
    throw new Error('Biblioteca pdf-parse indisponível.');
  }
  const data = await pdfParse(buffer);
  return parseEstoqueHorusTexto(data.text || '');
}
