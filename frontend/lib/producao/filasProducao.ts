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

export function filaPorId(id: string): FilaProducao | undefined {
  return FILAS_PRODUCAO.find((f) => f.id === id);
}
