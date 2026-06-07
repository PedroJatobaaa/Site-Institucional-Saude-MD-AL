export const NIVEL_ATENCAO_BASICA = 'Atenção Básica';
export const NIVEL_ATENCAO_ESPECIALIZADA = 'Atenção Especializada';
export const NIVEL_SECRETARIA_SAUDE = 'Secretaria de Saúde';
export const UNIDADE_SECRETARIA_SAUDE = 'Secretaria de Saúde';

export const NIVEIS_LOTACAO = [
  NIVEL_ATENCAO_BASICA,
  NIVEL_ATENCAO_ESPECIALIZADA,
  NIVEL_SECRETARIA_SAUDE,
] as const;

export type NivelLotacao = (typeof NIVEIS_LOTACAO)[number];

export const UNIDADES_POR_NIVEL: Record<NivelLotacao, readonly string[]> = {
  [NIVEL_ATENCAO_BASICA]: [
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
  ],
  [NIVEL_ATENCAO_ESPECIALIZADA]: [
    'UPA 24h Taperaguá',
    'CAPS',
    'Centro de Especialidades de Saúde - Estácio',
    'Centro de Especialidades Odontológicas - CEO',
    'CERTEA',
  ],
  [NIVEL_SECRETARIA_SAUDE]: [UNIDADE_SECRETARIA_SAUDE],
};

export function unidadesDoNivel(nivel: string): readonly string[] {
  if (!NIVEIS_LOTACAO.includes(nivel as NivelLotacao)) return [];
  return UNIDADES_POR_NIVEL[nivel as NivelLotacao];
}

export function inferirNivelPorUnidade(unidade: string | null | undefined): NivelLotacao | '' {
  if (!unidade) return '';
  if (unidade === UNIDADE_SECRETARIA_SAUDE) return NIVEL_SECRETARIA_SAUDE;
  if (UNIDADES_POR_NIVEL[NIVEL_ATENCAO_ESPECIALIZADA].includes(unidade)) {
    return NIVEL_ATENCAO_ESPECIALIZADA;
  }
  if (UNIDADES_POR_NIVEL[NIVEL_ATENCAO_BASICA].includes(unidade)) {
    return NIVEL_ATENCAO_BASICA;
  }
  return '';
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
  unidadeLotacao: string | null | undefined
): { ok: true; dados: LotacaoPayload } | { ok: false; erro: string } {
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

  const permitidas = UNIDADES_POR_NIVEL[nivel];
  if (!permitidas.includes(unidadeLotacao)) {
    return { ok: false, erro: 'Unidade de lotação inválida para a categoria selecionada.' };
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
