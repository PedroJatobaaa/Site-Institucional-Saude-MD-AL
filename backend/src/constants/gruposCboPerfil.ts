export type GrupoCboPerfil = {
  id: string;
  label: string;
  prefixos: string[];
  cbos: string[];
};

export const GRUPOS_CBO_PERFIL: GrupoCboPerfil[] = [
  {
    id: 'medico',
    label: 'Médico',
    prefixos: ['225'],
    cbos: ['2231F8', '2231F9'],
  },
  {
    id: 'dentista',
    label: 'Dentista',
    prefixos: ['2232'],
    cbos: [],
  },
  {
    id: 'enfermeiro',
    label: 'Enfermeiro',
    prefixos: ['2235'],
    cbos: [],
  },
  {
    id: 'tecnico_aux_enfermagem',
    label: 'Técnico/Aux. Enfermagem',
    prefixos: ['3222', '3224'],
    cbos: [],
  },
  {
    id: 'farmaceutico',
    label: 'Farmacêutico',
    prefixos: ['2234'],
    cbos: [],
  },
  {
    id: 'nutricionista',
    label: 'Nutricionista',
    prefixos: ['2237'],
    cbos: [],
  },
  {
    id: 'fonoaudiologo',
    label: 'Fonoaudiólogo',
    prefixos: ['2238'],
    cbos: [],
  },
  {
    id: 'assistente_social',
    label: 'Assistente Social',
    prefixos: ['2516'],
    cbos: [],
  },
  {
    id: 'agente_comunitario',
    label: 'Agente Comunitário',
    prefixos: ['5151'],
    cbos: [],
  },
];

export function expandirGruposCbo(gruposIds: string[]): { cbos: string[]; prefixos: string[] } {
  const cbos = new Set<string>();
  const prefixos = new Set<string>();

  for (const id of gruposIds) {
    const grupo = GRUPOS_CBO_PERFIL.find((g) => g.id === id);
    if (!grupo) continue;
    grupo.prefixos.forEach((p) => prefixos.add(p));
    grupo.cbos.forEach((c) => cbos.add(c.toUpperCase()));
  }

  return {
    cbos: [...cbos],
    prefixos: [...prefixos],
  };
}

export function mesclarRegrasCbo(
  cbos: string[],
  prefixos: string[],
  gruposIds?: string[]
): { cbos: string[]; prefixos: string[] } {
  const expandido = gruposIds?.length ? expandirGruposCbo(gruposIds) : { cbos: [], prefixos: [] };

  const cbosSet = new Set<string>([
    ...expandido.cbos,
    ...cbos.map((c) => c.trim().toUpperCase()).filter(Boolean),
  ]);
  const prefixosSet = new Set<string>([
    ...expandido.prefixos,
    ...prefixos.map((p) => p.trim()).filter(Boolean),
  ]);

  return {
    cbos: [...cbosSet],
    prefixos: [...prefixosSet],
  };
}
