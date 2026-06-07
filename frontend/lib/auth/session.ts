export type UsuarioSessao = {
  id?: string;
  nome?: string;
  cargo?: string;
  permissoes?: string[];
  unidade?: string;
};

const TOKEN_KEY = 'saude_token';
const USER_KEY = 'saude_usuario';
const LEGACY_TOKEN_KEY = 'token';

function limparPersistenciaAntiga() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(LEGACY_TOKEN_KEY);
  document.cookie = 'token=; path=/; max-age=0; SameSite=Strict';
}

let migracaoFeita = false;

function migrarSessaoLegada() {
  if (migracaoFeita || typeof window === 'undefined') return;
  migracaoFeita = true;

  const tokenLegado = localStorage.getItem(TOKEN_KEY) ?? localStorage.getItem(LEGACY_TOKEN_KEY);
  const userLegado = localStorage.getItem(USER_KEY);

  if (!sessionStorage.getItem(TOKEN_KEY) && tokenLegado) {
    sessionStorage.setItem(TOKEN_KEY, tokenLegado);
  }
  if (!sessionStorage.getItem(USER_KEY) && userLegado) {
    sessionStorage.setItem(USER_KEY, userLegado);
  }

  limparPersistenciaAntiga();
}

export function salvarSessao(token: string, usuario: object) {
  limparPersistenciaAntiga();
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(USER_KEY, JSON.stringify(usuario));
}

export function getToken(): string | null {
  migrarSessaoLegada();
  return sessionStorage.getItem(TOKEN_KEY);
}

export function getUsuario<T = UsuarioSessao>(): T | null {
  migrarSessaoLegada();
  const raw = sessionStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function encerrarSessao() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  limparPersistenciaAntiga();
}

export function sessaoAtiva(): boolean {
  return !!getToken() && !!getUsuario();
}
