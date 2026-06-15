export const NIVEL_ATENCAO_BASICA = 'Atenção Básica';
export const NIVEL_ATENCAO_ESPECIALIZADA = 'Atenção Especializada';
export const NIVEL_SECRETARIA_SAUDE = 'Secretaria de Saúde';
export const UNIDADE_SECRETARIA_SAUDE = 'Secretaria de Saúde';

export const CNES_SECRETARIA_SMS = '9146377';
export const FANTASIA_SECRETARIA_SMS = 'SECRETARIA MUNICIPAL DE SAUDE';

export const NIVEIS_LOTACAO = [
  NIVEL_ATENCAO_BASICA,
  NIVEL_ATENCAO_ESPECIALIZADA,
  NIVEL_SECRETARIA_SAUDE,
] as const;

export type NivelLotacao = (typeof NIVEIS_LOTACAO)[number];

export const UNIDADES_UBS = [
  'UBS Barra Nova',
  'UBS Barro Vermelho',
  'UBS Cabreiras',
  'UBS Denisson Amorim',
  'UBS Francês',
  'UBS José Dias',
  'UBS Malhadas',
  'UBS Massagueira',
  'UBS Mucuri',
  'UBS Pedras',
  'UBS Poeira',
  'UBS Rua da Estiva',
  'UBS Rua Nova',
  'UBS Santa Rita',
  'UBS Tuquanduba',
  'UBS Taperaguá',
  'UBS Vila Altina',
  'USB Gislene Matheus',
] as const;

export const UNIDADES_ESPECIALIZADAS = [
  'AERONAVE BARON 58',
  'AERONAVE CESSNA',
  'CAPS',
  'CAPS MARIA CELIA DE ARAUJO SARMENTO',
  'CENTRAL DE ABASTECIMENTO FARMACEUTICO CAF',
  'CENTRAL MUNICIPAL DE REDE DE FRIO DE MARECHAL DEODORO',
  'Centro de Especialidades de Saúde - Estácio',
  'Centro de Especialidades Odontológicas - CEO',
  'CENTRO DE PARTO NORMAL IMACULADA CONCEICAO',
  'CENTRO DE SAUDE PROFESSOR ESTACIO DE LIMA',
  'CENTRO MUNICIPAL DE ESPECIALIDADE ODONTOLOGICA',
  'CERTEA',
  'CERTEA CENTRO ESP DE REF EM TRANSTORNO DO ESPECTRO AUTISTA',
  'HELICOPTERO FALCAO 5',
  'LABORATORIO DE PROTESE DENTARIA MARECHAL DEODORO',
  'MELHOR EM CASA',
  'POSTO DE APOIO MUCURI',
  'POSTO DE SAUDE DO RIACHO VELHO',
  'POSTO DE SAUDE SACO',
  'UNIDADE MUNICIPAL DE FISIOTERAPIA',
  'UPA 24h Taperaguá',
  'UPA 24 HORAS TAPERAGUA MARECHAL DEODORO AL',
  'USB 10 MARECHAL DEODORO',
  'VIGILANCIA EM SAUDE',
] as const;

export const UNIDADES_POR_NIVEL: Record<NivelLotacao, readonly string[]> = {
  [NIVEL_ATENCAO_BASICA]: UNIDADES_UBS,
  [NIVEL_ATENCAO_ESPECIALIZADA]: UNIDADES_ESPECIALIZADAS,
  [NIVEL_SECRETARIA_SAUDE]: [UNIDADE_SECRETARIA_SAUDE],
};

export function normalizarTextoLotacao(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export function ehEstabelecimentoSecretaria(nome: string | null | undefined, cnes?: string | null): boolean {
  if (cnes?.trim() === CNES_SECRETARIA_SMS) return true;
  const valor = nome?.trim();
  if (!valor) return false;
  if (valor === UNIDADE_SECRETARIA_SAUDE) return true;
  const n = normalizarTextoLotacao(valor);
  if (n === normalizarTextoLotacao(FANTASIA_SECRETARIA_SMS)) return true;
  return n.includes('SECRETARIA') && (n.includes('SAUDE') || n.includes('SMS'));
}

export function ehEstabelecimentoBasica(nome: string | null | undefined): boolean {
  const valor = nome?.trim();
  if (!valor) return false;
  if (ehUnidadeUBS(valor)) return true;
  const n = normalizarTextoLotacao(valor);
  return n.startsWith('UNIDADE DE SAUDE DA FAMILIA')
    || n.startsWith('UNIDADE BASICA DE SAUDE')
    || n.startsWith('UNIDADE BASICA');
}

export function mapearFantasiaUsfParaUbs(fantasia: string): string {
  const n = normalizarTextoLotacao(fantasia);
  if (!ehEstabelecimentoBasica(fantasia)) return '';

  for (const ubs of UNIDADES_UBS) {
    const slug = normalizarTextoLotacao(ubs).replace(/^UBS /, '').replace(/^USB /, '');
    const tokens = slug.split(' ').filter((t) => t.length > 3);
    if (tokens.length > 0 && tokens.every((t) => n.includes(t))) return ubs;
    if (tokens.some((t) => n.includes(t))) {
      const candidato = tokens.find((t) => n.includes(t));
      if (candidato && candidato.length >= 5) return ubs;
    }
  }

  for (const ubs of UNIDADES_UBS) {
    const slug = normalizarTextoLotacao(ubs).replace(/^UBS /, '').replace(/^USB /, '');
    const palavras = slug.split(' ').filter((t) => t.length > 4);
    if (palavras.some((p) => n.includes(p))) return ubs;
  }

  return '';
}

export function ehUnidadeUBS(unidade: string | null | undefined): boolean {
  const valor = unidade?.trim();
  if (!valor) return false;
  if (UNIDADES_UBS.includes(valor as (typeof UNIDADES_UBS)[number])) return true;
  const normalizada = valor.toUpperCase();
  return normalizada.startsWith('UBS ') || normalizada === 'USB GISLENE MATHEUS';
}

export function unidadesDoNivel(nivel: string): readonly string[] {
  if (!NIVEIS_LOTACAO.includes(nivel as NivelLotacao)) return [];
  return UNIDADES_POR_NIVEL[nivel as NivelLotacao];
}

export function ehSecretariaSaude(nivel: string): boolean {
  return nivel === NIVEL_SECRETARIA_SAUDE;
}

export function inferirNivelPorUnidade(unidade: string | null | undefined): NivelLotacao | '' {
  if (!unidade?.trim()) return '';
  if (ehEstabelecimentoSecretaria(unidade)) return NIVEL_SECRETARIA_SAUDE;
  if (ehEstabelecimentoBasica(unidade)) return NIVEL_ATENCAO_BASICA;
  return NIVEL_ATENCAO_ESPECIALIZADA;
}

export type LotacaoResolvida = {
  nivelLotacao: NivelLotacao | null;
  unidadeLotacao: string | null;
};

export function resolverLotacaoPorEstabelecimento(dados: {
  nomeFantasia?: string | null;
  cnes?: string | null;
  unidadeLotacao?: string | null;
  nivelLotacao?: string | null;
}): LotacaoResolvida {
  const cnes = dados.cnes?.trim() || '';
  const unidade = dados.unidadeLotacao?.trim() || '';
  const fantasia = dados.nomeFantasia?.trim() || '';
  const nivelSalvo = dados.nivelLotacao?.trim() || '';
  const texto = unidade || fantasia;

  if (ehEstabelecimentoSecretaria(texto, cnes)) {
    return { nivelLotacao: NIVEL_SECRETARIA_SAUDE, unidadeLotacao: UNIDADE_SECRETARIA_SAUDE };
  }

  if (unidade && inferirNivelPorUnidade(unidade)) {
    const nivel = inferirNivelPorUnidade(unidade) as NivelLotacao;
    return {
      nivelLotacao: nivel,
      unidadeLotacao: nivel === NIVEL_SECRETARIA_SAUDE ? UNIDADE_SECRETARIA_SAUDE : unidade,
    };
  }

  if (fantasia) {
    const ubsMapeada = mapearFantasiaUsfParaUbs(fantasia);
    if (ubsMapeada) {
      return { nivelLotacao: NIVEL_ATENCAO_BASICA, unidadeLotacao: ubsMapeada };
    }
    const nivelFantasia = inferirNivelPorUnidade(fantasia);
    if (nivelFantasia) {
      return {
        nivelLotacao: nivelFantasia,
        unidadeLotacao: nivelFantasia === NIVEL_SECRETARIA_SAUDE ? UNIDADE_SECRETARIA_SAUDE : null,
      };
    }
  }

  if (nivelSalvo && NIVEIS_LOTACAO.includes(nivelSalvo as NivelLotacao)) {
    const nivel = nivelSalvo as NivelLotacao;
    return {
      nivelLotacao: nivel,
      unidadeLotacao: nivel === NIVEL_SECRETARIA_SAUDE ? UNIDADE_SECRETARIA_SAUDE : (unidade || null),
    };
  }

  if (cnes && cnes !== CNES_SECRETARIA_SMS) {
    return { nivelLotacao: NIVEL_ATENCAO_ESPECIALIZADA, unidadeLotacao: unidade || null };
  }

  return { nivelLotacao: null, unidadeLotacao: null };
}

export type LotacaoFormState = {
  nivelLotacao: string;
  unidadeLotacao: string;
};

export function hidratarLotacao(usuario: {
  nivelLotacao?: string | null;
  nivel_lotacao?: string | null;
  unidadeLotacao?: string | null;
  unidade_lotacao?: string | null;
  unidade?: string | null;
}): LotacaoFormState {
  const nivelSalvo = usuario.nivelLotacao ?? usuario.nivel_lotacao ?? '';
  const unidadeSalva = usuario.unidadeLotacao ?? usuario.unidade_lotacao ?? usuario.unidade ?? '';

  if (nivelSalvo) {
    return {
      nivelLotacao: nivelSalvo,
      unidadeLotacao: nivelSalvo === NIVEL_SECRETARIA_SAUDE
        ? UNIDADE_SECRETARIA_SAUDE
        : unidadeSalva,
    };
  }

  const nivelInferido = inferirNivelPorUnidade(unidadeSalva);
  if (!nivelInferido) {
    return { nivelLotacao: '', unidadeLotacao: '' };
  }

  return {
    nivelLotacao: nivelInferido,
    unidadeLotacao: nivelInferido === NIVEL_SECRETARIA_SAUDE
      ? UNIDADE_SECRETARIA_SAUDE
      : unidadeSalva,
  };
}

export function aoMudarNivelLotacao(novoNivel: string): LotacaoFormState {
  if (novoNivel === NIVEL_SECRETARIA_SAUDE) {
    return { nivelLotacao: novoNivel, unidadeLotacao: UNIDADE_SECRETARIA_SAUDE };
  }
  return { nivelLotacao: novoNivel, unidadeLotacao: '' };
}

export function lotacaoCompleta(nivelLotacao: string, unidadeLotacao: string): boolean {
  if (!nivelLotacao) return false;
  if (ehSecretariaSaude(nivelLotacao)) return true;
  return Boolean(unidadeLotacao);
}

/** Agrupa nomes de unidade pela categoria correta (UBS → básica; demais → especializada). */
export function organizarUnidadesPorNivel(nomes: Iterable<string>): Record<NivelLotacao, string[]> {
  const mapa: Record<NivelLotacao, Set<string>> = {
    [NIVEL_ATENCAO_BASICA]: new Set(),
    [NIVEL_ATENCAO_ESPECIALIZADA]: new Set(),
    [NIVEL_SECRETARIA_SAUDE]: new Set(),
  };

  for (const bruto of nomes) {
    const nome = bruto.trim();
    if (!nome) continue;
    const nivel = inferirNivelPorUnidade(nome);
    if (nivel) mapa[nivel].add(nome);
  }

  const resultado = {} as Record<NivelLotacao, string[]>;
  for (const nivel of NIVEIS_LOTACAO) {
    const lista = [...mapa[nivel]].sort((a, b) => a.localeCompare(b, 'pt-BR'));
    resultado[nivel] = lista.length > 0 ? lista : [...UNIDADES_POR_NIVEL[nivel]];
  }
  return resultado;
}
