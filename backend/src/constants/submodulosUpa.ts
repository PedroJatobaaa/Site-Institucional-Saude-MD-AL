export const SUBMODULOS_UPA = [
  'upa_prescricao',
  'upa_controle_medicamentos',
] as const;

export type SubmoduloUpa = (typeof SUBMODULOS_UPA)[number];

export function temAcessoPortalUpa(permissoes: unknown): boolean {
  if (!Array.isArray(permissoes)) return false;
  return (
    permissoes.includes('admin') ||
    permissoes.includes('upa_acesso') ||
    SUBMODULOS_UPA.some((id) => permissoes.includes(id))
  );
}

/** Submódulo UPA; legado: só `upa_acesso` sem submódulos libera todos. */
export function temSubmoduloUpa(permissoes: unknown, submoduloId: SubmoduloUpa): boolean {
  if (!Array.isArray(permissoes)) return false;
  if (permissoes.includes('admin') || permissoes.includes(submoduloId)) return true;
  const temAlgumSub = SUBMODULOS_UPA.some((id) => permissoes.includes(id));
  return permissoes.includes('upa_acesso') && !temAlgumSub;
}
