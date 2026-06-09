export type PerfilProducao = 'UBS' | 'PROCESSAMENTO';

export function isRoleUBS(permissoes: string[] = []) {
  return permissoes.includes('ROLE_UBS');
}

export function isRoleProcessamento(permissoes: string[] = []) {
  return permissoes.includes('ROLE_PROCESSAMENTO') || permissoes.includes('admin');
}

export function temAcessoProducoes(permissoes: string[] = []) {
  return isRoleUBS(permissoes) || isRoleProcessamento(permissoes);
}

export function obterPerfilProducao(permissoes: string[] = []): PerfilProducao | null {
  if (isRoleProcessamento(permissoes)) return 'PROCESSAMENTO';
  if (isRoleUBS(permissoes)) return 'UBS';
  return null;
}

export function isAdminProducaoDashboard(permissoes: string[] = []) {
  return permissoes.includes('admin');
}
