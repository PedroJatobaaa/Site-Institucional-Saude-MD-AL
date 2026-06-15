type UsuarioComPerfil = {
  permissoes?: string[];
  perfil?: { permissoes: string[] } | null;
  perfilId?: string | null;
};

export function permissoesEfetivas(usuario: UsuarioComPerfil): string[] {
  const doPerfil = usuario.perfil?.permissoes ?? [];
  const extras = usuario.permissoes ?? [];
  if (!usuario.perfilId && doPerfil.length === 0) {
    return [...new Set(extras)];
  }
  return [...new Set([...doPerfil, ...extras])];
}

export function filasProducaoEfetivas(
  filasPerfil: string[],
  filasUsuario: string[]
): string[] {
  return [...new Set([...filasPerfil, ...filasUsuario])];
}

export function temPermissao(usuario: UsuarioComPerfil & { permissoes?: string[] }, chave: string): boolean {
  const efetivas = usuario.permissoes?.includes('admin')
    ? usuario.permissoes
    : permissoesEfetivas(usuario);
  if (efetivas.includes('admin')) return true;
  return efetivas.includes(chave);
}
