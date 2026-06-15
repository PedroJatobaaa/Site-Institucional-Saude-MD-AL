export type GrupoCboPerfil = {
  id: string;
  label: string;
  prefixos: string[];
  cbos: string[];
};

export const GRUPOS_CBO_PERFIL: GrupoCboPerfil[] = [
  { id: 'medico', label: 'Médico', prefixos: ['225'], cbos: ['2231F8', '2231F9'] },
  { id: 'dentista', label: 'Dentista', prefixos: ['2232'], cbos: [] },
  { id: 'enfermeiro', label: 'Enfermeiro', prefixos: ['2235'], cbos: [] },
  { id: 'tecnico_aux_enfermagem', label: 'Técnico/Aux. Enfermagem', prefixos: ['3222', '3224'], cbos: [] },
  { id: 'farmaceutico', label: 'Farmacêutico', prefixos: ['2234'], cbos: [] },
  { id: 'nutricionista', label: 'Nutricionista', prefixos: ['2237'], cbos: [] },
  { id: 'fonoaudiologo', label: 'Fonoaudiólogo', prefixos: ['2238'], cbos: [] },
  { id: 'assistente_social', label: 'Assistente Social', prefixos: ['2516'], cbos: [] },
  { id: 'agente_comunitario', label: 'Agente Comunitário', prefixos: ['5151'], cbos: [] },
];

export function grupoEstaAtivo(
  grupo: GrupoCboPerfil,
  prefixosCbo: string[],
  cbosVinculo: string[]
): boolean {
  const prefixosOk = grupo.prefixos.every((p) => prefixosCbo.includes(p));
  const cbosOk = grupo.cbos.every((c) => cbosVinculo.includes(c.toUpperCase()));
  return prefixosOk && cbosOk;
}

export function aplicarGrupoCbo(
  grupo: GrupoCboPerfil,
  ativar: boolean,
  prefixosCbo: string[],
  cbosVinculo: string[]
): { prefixosCbo: string[]; cbosVinculo: string[] } {
  const prefixos = new Set(prefixosCbo);
  const cbos = new Set(cbosVinculo.map((c) => c.toUpperCase()));

  if (ativar) {
    grupo.prefixos.forEach((p) => prefixos.add(p));
    grupo.cbos.forEach((c) => cbos.add(c.toUpperCase()));
  } else {
    grupo.prefixos.forEach((p) => prefixos.delete(p));
    grupo.cbos.forEach((c) => cbos.delete(c.toUpperCase()));
  }

  return {
    prefixosCbo: [...prefixos],
    cbosVinculo: [...cbos],
  };
}

export function detectarGruposAtivos(prefixosCbo: string[], cbosVinculo: string[]): string[] {
  return GRUPOS_CBO_PERFIL.filter((g) => grupoEstaAtivo(g, prefixosCbo, cbosVinculo)).map((g) => g.id);
}
