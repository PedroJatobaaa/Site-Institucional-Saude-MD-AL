import catalog from '../data/cnesEstabelecimentos.json';

export function nomeEstabelecimentoPorCnes(cnes: string | null | undefined): string {
  const codigo = cnes?.trim();
  if (!codigo) return '';
  return (catalog as Record<string, string>)[codigo] || '';
}
