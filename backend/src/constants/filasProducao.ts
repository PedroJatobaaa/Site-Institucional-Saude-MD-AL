export type FilaProducao = {
  id: string;
  unidade: string;
  sistema: string;
  label: string;
};

export const FILAS_PRODUCAO: readonly FilaProducao[] = [
  { id: 'aps-e-sus', unidade: 'APS', sistema: 'e-SUS', label: 'APS via e-SUS' },
  { id: 'caps-raas', unidade: 'CAPS', sistema: 'RAAS', label: 'CAPS via RAAS' },
  { id: 'caps-e-sus', unidade: 'CAPS', sistema: 'e-SUS', label: 'CAPS via e-SUS' },
  { id: 'ceo-e-sus', unidade: 'CEO', sistema: 'e-SUS', label: 'CEO via e-SUS' },
  { id: 'certea-e-sus', unidade: 'CERTEA', sistema: 'e-SUS', label: 'CERTEA via e-SUS' },
  { id: 'cespel-sisreg-iii', unidade: 'CESPEL', sistema: 'SISREG III', label: 'CESPEL via SISREG III' },
  { id: 'cespel-e-sus', unidade: 'CESPEL', sistema: 'e-SUS', label: 'CESPEL via e-SUS' },
  { id: 'cpn-sisreg-iii', unidade: 'CPN', sistema: 'SISREG III', label: 'CPN via SISREG III' },
  {
    id: 'espaco-klecia-bpa-i',
    unidade: 'Espaço Klécia',
    sistema: 'BPA - I',
    label: 'Espaço Klécia via BPA - I',
  },
  {
    id: 'laboratorio-marechal-sisreg-iii',
    unidade: 'Laboratorio Marechal',
    sistema: 'SISREG III',
    label: 'Laboratorio Marechal via SISREG III',
  },
  { id: 'umf-bpa-i', unidade: 'UMF', sistema: 'BPA - I', label: 'UMF via BPA - I' },
  { id: 'umf-e-sus', unidade: 'UMF', sistema: 'e-SUS', label: 'UMF via e-SUS' },
  { id: 'upa-e-sus', unidade: 'UPA', sistema: 'e-SUS', label: 'UPA via e-SUS' },
  {
    id: 'vigilancia-sanitaria-bpa-c',
    unidade: 'Vigilancia Sanitaria',
    sistema: 'BPA - C',
    label: 'Vigilancia Sanitaria via BPA - C',
  },
] as const;

export type FilaProducaoId = (typeof FILAS_PRODUCAO)[number]['id'];

const filasPorId = new Map(FILAS_PRODUCAO.map((f) => [f.id, f]));

export function filaPorId(id: string): FilaProducao | undefined {
  return filasPorId.get(id);
}

export function filaValida(id: string): boolean {
  return filasPorId.has(id);
}

export function filtrarFilasPorIds(ids: string[]): FilaProducao[] {
  const permitidos = new Set(ids);
  return FILAS_PRODUCAO.filter((f) => permitidos.has(f.id));
}

export function validarIdsFilas(ids: string[]): { ok: true; ids: string[] } | { ok: false; erro: string } {
  if (!Array.isArray(ids)) {
    return { ok: false, erro: 'Permissões de produção devem ser uma lista.' };
  }
  const invalidos = ids.filter((id) => !filaValida(id));
  if (invalidos.length > 0) {
    return { ok: false, erro: `Filas inválidas: ${invalidos.join(', ')}` };
  }
  return { ok: true, ids: [...new Set(ids)] };
}
