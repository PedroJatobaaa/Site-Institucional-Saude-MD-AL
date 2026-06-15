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

export function mapearNomeLotacaoCanonic(nomeCnes: string): string {
  const valor = nomeCnes.trim();
  if (!valor) return '';

  const ubs = mapearFantasiaUsfParaUbs(valor);
  if (ubs) return ubs;

  if (ehEstabelecimentoSecretaria(valor)) return UNIDADE_SECRETARIA_SAUDE;

  const alvo = normalizarTextoLotacao(valor);
  for (const lista of [UNIDADES_ESPECIALIZADAS, UNIDADES_UBS]) {
    for (const unidade of lista) {
      const normalizada = normalizarTextoLotacao(unidade);
      if (normalizada === alvo || alvo.includes(normalizada) || normalizada.includes(alvo)) {
        return unidade;
      }
    }
  }

  return valor;
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
  const fantasiaEfetiva = fantasia;
  const texto = unidade || fantasiaEfetiva;

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

  if (fantasiaEfetiva) {
    const ubsMapeada = mapearFantasiaUsfParaUbs(fantasiaEfetiva);
    if (ubsMapeada) {
      return { nivelLotacao: NIVEL_ATENCAO_BASICA, unidadeLotacao: ubsMapeada };
    }
    const unidadeCanonica = mapearNomeLotacaoCanonic(fantasiaEfetiva);
    const nivelFantasia = inferirNivelPorUnidade(fantasiaEfetiva);
    if (nivelFantasia) {
      return {
        nivelLotacao: nivelFantasia,
        unidadeLotacao: nivelFantasia === NIVEL_SECRETARIA_SAUDE
          ? UNIDADE_SECRETARIA_SAUDE
          : unidadeCanonica,
      };
    }
  }

  if (nivelSalvo && NIVEIS_LOTACAO.includes(nivelSalvo as NivelLotacao)) {
    const nivel = nivelSalvo as NivelLotacao;
    return {
      nivelLotacao: nivel,
      unidadeLotacao: nivel === NIVEL_SECRETARIA_SAUDE
        ? UNIDADE_SECRETARIA_SAUDE
        : (unidade || null),
    };
  }

  if (cnes && cnes !== CNES_SECRETARIA_SMS) {
    const nomeCnes = fantasiaEfetiva;
    const unidadeCanonica = nomeCnes ? mapearNomeLotacaoCanonic(nomeCnes) : (unidade || null);
    return {
      nivelLotacao: (nomeCnes ? inferirNivelPorUnidade(nomeCnes) : null) || NIVEL_ATENCAO_ESPECIALIZADA,
      unidadeLotacao: unidadeCanonica,
    };
  }

  return { nivelLotacao: null, unidadeLotacao: null };
}

export type LotacaoPayload = {
  nivelLotacao: string;
  unidadeLotacao: string;
  unidade: string;
};

export function todasUnidadesComNivel(): { nome: string; nivelLotacao: NivelLotacao }[] {
  const resultado: { nome: string; nivelLotacao: NivelLotacao }[] = [];
  for (const nivel of NIVEIS_LOTACAO) {
    for (const nome of UNIDADES_POR_NIVEL[nivel]) {
      resultado.push({ nome, nivelLotacao: nivel });
    }
  }
  return resultado;
}

export function validarLotacao(
  nivelLotacao: string | null | undefined,
  unidadeLotacao: string | null | undefined,
  unidadesMapa?: Record<string, readonly string[]>
): { ok: true; dados: LotacaoPayload } | { ok: false; erro: string } {
  const mapa = unidadesMapa ?? UNIDADES_POR_NIVEL;
  if (!nivelLotacao || !NIVEIS_LOTACAO.includes(nivelLotacao as NivelLotacao)) {
    return { ok: false, erro: 'Selecione a categoria de lotação.' };
  }

  const nivel = nivelLotacao as NivelLotacao;

  if (nivel === NIVEL_SECRETARIA_SAUDE) {
    return {
      ok: true,
      dados: {
        nivelLotacao: nivel,
        unidadeLotacao: UNIDADE_SECRETARIA_SAUDE,
        unidade: UNIDADE_SECRETARIA_SAUDE,
      },
    };
  }

  if (!unidadeLotacao) {
    return { ok: false, erro: 'Selecione a unidade específica de lotação.' };
  }

  if (nivel === NIVEL_ATENCAO_BASICA) {
    if (!ehUnidadeUBS(unidadeLotacao)) {
      return { ok: false, erro: 'Unidade UBS inválida para a categoria Atenção Básica.' };
    }
  }

  if (nivel === NIVEL_ATENCAO_ESPECIALIZADA) {
    if (ehUnidadeUBS(unidadeLotacao)) {
      return { ok: false, erro: 'Unidades UBS devem usar a categoria Atenção Básica.' };
    }
    const permitidas = mapa[nivel] ?? UNIDADES_POR_NIVEL[nivel];
    if (!permitidas.includes(unidadeLotacao)) {
      return { ok: false, erro: 'Unidade de lotação inválida para a categoria selecionada.' };
    }
  }

  return {
    ok: true,
    dados: {
      nivelLotacao: nivel,
      unidadeLotacao,
      unidade: unidadeLotacao,
    },
  };
}
