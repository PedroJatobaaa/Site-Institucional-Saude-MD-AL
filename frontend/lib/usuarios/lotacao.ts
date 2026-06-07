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

export function ehSecretariaSaude(nivel: string): boolean {
  return nivel === NIVEL_SECRETARIA_SAUDE;
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
