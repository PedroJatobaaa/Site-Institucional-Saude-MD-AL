export const PERMISSOES_DISPONIVEIS = [
  { id: 'mural_avisos', nome: 'Gerenciar Mural de Avisos' },
  { id: 'documentos_leitura', nome: 'Acessar Repositório (Download)' },
  { id: 'documentos_gerenciar', nome: 'Gerenciar Repositório (Upload/Excluir)' },
  { id: 'sistemas_esus', nome: 'Acesso Restrito ao e-SUS / PEC' },
  { id: 'upa_acesso', nome: 'Acessar Módulo UPA' },
  { id: 'central_marcacoes', nome: 'Acesso à Central das Marcações' },
  { id: 'ROLE_UBS', nome: 'Produções — UBS (envio)' },
  { id: 'ROLE_PROCESSAMENTO', nome: 'Produções — Processamento de Dados' },
  { id: 'profissionais_gerenciar', nome: 'Profissionais (CRUD)' },
  { id: 'invig', nome: 'Acesso ao INVIG' },
  { id: 'admin', nome: 'Acesso Total (Administrador)' },
] as const;

export type PermissaoId = (typeof PERMISSOES_DISPONIVEIS)[number]['id'];
