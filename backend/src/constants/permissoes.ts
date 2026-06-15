export const PERMISSOES_VALIDAS = [
  'mural_avisos',
  'documentos_leitura',
  'documentos_gerenciar',
  'sistemas_esus',
  'upa_acesso',
  'central_marcacoes',
  'ROLE_UBS',
  'ROLE_PROCESSAMENTO',
  'profissionais_gerenciar',
  'invig',
  'admin',
] as const;

export type PermissaoValida = (typeof PERMISSOES_VALIDAS)[number];

export function validarPermissoes(permissoes: unknown): { ok: true; ids: string[] } | { ok: false; erro: string } {
  if (!Array.isArray(permissoes)) {
    return { ok: false, erro: 'Permissões inválidas.' };
  }
  const ids = permissoes.filter((p): p is string => typeof p === 'string');
  const invalidas = ids.filter((p) => !PERMISSOES_VALIDAS.includes(p as PermissaoValida));
  if (invalidas.length > 0) {
    return { ok: false, erro: `Permissões desconhecidas: ${invalidas.join(', ')}` };
  }
  return { ok: true, ids: [...new Set(ids)] };
}
