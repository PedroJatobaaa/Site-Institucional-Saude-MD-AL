import type { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { limparNumeros } from './validators/documentos';

export const SENHA_PADRAO = 'Saude@123';
export const SUFIXO_EMAIL_CNES = '@cnes.importado';

export function ehUsuarioImportadoCnes(email: string): boolean {
  return email.toLowerCase().endsWith(SUFIXO_EMAIL_CNES);
}

export async function hashSenhaPadrao(): Promise<string> {
  return bcrypt.hash(SENHA_PADRAO, 10);
}

export type DadosVinculoPerfil = {
  perfilId: string;
  status: 'APROVADO';
  senha?: string;
  precisa_redefinir_senha?: boolean;
};

export async function dadosAoVincularPerfil(email: string, perfilId: string): Promise<DadosVinculoPerfil> {
  const dados: DadosVinculoPerfil = {
    perfilId,
    status: 'APROVADO',
  };

  if (ehUsuarioImportadoCnes(email)) {
    dados.senha = await hashSenhaPadrao();
    dados.precisa_redefinir_senha = true;
  }

  return dados;
}

export async function buscarUsuarioPorLogin(prisma: PrismaClient, login: string) {
  const termo = login.trim();
  if (!termo) return null;

  if (termo.includes('@')) {
    return prisma.usuario.findUnique({ where: { email: termo.toLowerCase() } });
  }

  const cpfLimpo = limparNumeros(termo);
  if (cpfLimpo.length !== 11) return null;

  return prisma.usuario.findFirst({ where: { cpf: cpfLimpo } });
}
