export const SUBMODULOS_UPA = [
  { id: 'upa_prescricao', nome: 'Prescrição Médica' },
  { id: 'upa_controle_medicamentos', nome: 'Controle de Medicamentos' },
] as const;

export const IDS_SUBMODULOS_UPA: readonly string[] = SUBMODULOS_UPA.map((s) => s.id);

export const PERMISSOES_DISPONIVEIS = [
  { id: 'mural_avisos', nome: 'Gerenciar Mural de Avisos' },
  { id: 'documentos_leitura', nome: 'Acessar Repositório (Download)' },
  { id: 'documentos_gerenciar', nome: 'Gerenciar Repositório (Upload/Excluir)' },
  { id: 'sistemas_esus', nome: 'Acesso Restrito ao e-SUS / PEC' },
  { id: 'upa_acesso', nome: 'Acessar Módulo UPA' },
  { id: 'upa_prescricao', nome: 'Prescrição Médica' },
  { id: 'upa_controle_medicamentos', nome: 'Controle de Medicamentos' },
  { id: 'central_marcacoes', nome: 'Acesso à Central das Marcações' },
  { id: 'ROLE_UBS', nome: 'Produções — UBS (envio)' },
  { id: 'ROLE_PROCESSAMENTO', nome: 'Produções — Processamento de Dados' },
  { id: 'profissionais_gerenciar', nome: 'Profissionais (CRUD)' },
  { id: 'invig', nome: 'Acesso ao INVIG' },
  { id: 'admin', nome: 'Acesso Total (Administrador)' },
] as const;

export type PermissaoId = (typeof PERMISSOES_DISPONIVEIS)[number]['id'];

export function isSubmoduloUpa(id: string) {
  return IDS_SUBMODULOS_UPA.includes(id);
}

export function temAcessoPortalUpa(permissoes: string[] = []) {
  return (
    permissoes.includes('admin') ||
    permissoes.includes('upa_acesso') ||
    IDS_SUBMODULOS_UPA.some((id) => permissoes.includes(id))
  );
}

/** Submódulo UPA; legado: só `upa_acesso` sem submódulos libera todos. */
export function temSubmoduloUpa(permissoes: string[] = [], submoduloId: string) {
  if (permissoes.includes('admin') || permissoes.includes(submoduloId)) return true;
  const temAlgumSub = IDS_SUBMODULOS_UPA.some((id) => permissoes.includes(id));
  return permissoes.includes('upa_acesso') && !temAlgumSub;
}

export function contarSubmodulosUpa(permissoes: string[] = []) {
  return IDS_SUBMODULOS_UPA.filter((id) => permissoes.includes(id)).length;
}
