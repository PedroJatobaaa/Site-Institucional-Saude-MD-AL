import type { PrismaClient } from '@prisma/client';
import { normalizarCodigoCbo, vinculoPrincipalAtivo } from '../utils/cargoCbo';
import { limparNumeros } from '../utils/validators/documentos';
import { dadosAoVincularPerfil } from '../utils/primeiroAcessoCnes';

export function cboCorrespondePerfil(
  codigo: string | null | undefined,
  cbosVinculo: string[],
  prefixosCbo: string[]
): boolean {
  if (!codigo?.trim()) return false;

  const normalizado = normalizarCodigoCbo(codigo);
  const cbosNorm = cbosVinculo.map(normalizarCodigoCbo);
  if (cbosNorm.includes(normalizado)) return true;

  return prefixosCbo.some((prefixo) => {
    const p = prefixo.trim();
    return p.length > 0 && normalizado.startsWith(p);
  });
}

export async function buscarCpfsElegiveis(
  prisma: PrismaClient,
  cbosVinculo: string[],
  prefixosCbo: string[]
): Promise<string[]> {
  if (cbosVinculo.length === 0 && prefixosCbo.length === 0) return [];

  const profissionais = await prisma.profissional.findMany({
    select: {
      cpf: true,
      vinculos: {
        select: {
          cboCodigo: true,
          cboDescricao: true,
          dataDesligamento: true,
        },
        orderBy: { dataEntrada: 'desc' },
      },
    },
  });

  const cpfs: string[] = [];
  for (const prof of profissionais) {
    const vinculo = vinculoPrincipalAtivo(prof.vinculos);
    if (!vinculo?.cboCodigo) continue;
    if (cboCorrespondePerfil(vinculo.cboCodigo, cbosVinculo, prefixosCbo)) {
      cpfs.push(prof.cpf);
    }
  }

  return cpfs;
}

export async function contarUsuariosElegiveisSemPerfil(
  prisma: PrismaClient,
  cbosVinculo: string[],
  prefixosCbo: string[]
): Promise<number> {
  const cpfs = await buscarCpfsElegiveis(prisma, cbosVinculo, prefixosCbo);
  if (cpfs.length === 0) return 0;

  return prisma.usuario.count({
    where: {
      perfilId: null,
      cpf: { in: cpfs },
    },
  });
}

export async function vincularUsuariosSemPerfil(
  prisma: PrismaClient,
  perfilId: string
): Promise<{ vinculados: number; cpfsElegiveis: number }> {
  const perfil = await prisma.perfil.findUnique({
    where: { id: perfilId },
    select: { cbosVinculo: true, prefixosCbo: true, ativo: true },
  });

  if (!perfil || !perfil.ativo) {
    return { vinculados: 0, cpfsElegiveis: 0 };
  }

  const cpfs = await buscarCpfsElegiveis(prisma, perfil.cbosVinculo, perfil.prefixosCbo);
  if (cpfs.length === 0) {
    return { vinculados: 0, cpfsElegiveis: 0 };
  }

  const usuarios = await prisma.usuario.findMany({
    where: {
      perfilId: null,
      cpf: { in: cpfs },
    },
    select: { id: true, email: true },
  });

  for (const usuario of usuarios) {
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: await dadosAoVincularPerfil(usuario.email, perfilId),
    });
  }

  return { vinculados: usuarios.length, cpfsElegiveis: cpfs.length };
}

export async function validarCbosUnicosEntrePerfis(
  prisma: PrismaClient,
  perfilId: string | null,
  cbosVinculo: string[],
  prefixosCbo: string[]
): Promise<{ ok: true } | { ok: false; erro: string; avisos?: string[] }> {
  const cbosNorm = cbosVinculo.map(normalizarCodigoCbo).filter(Boolean);
  const prefixosNorm = prefixosCbo.map((p) => p.trim()).filter(Boolean);

  if (cbosNorm.length === 0 && prefixosNorm.length === 0) {
    return { ok: true };
  }

  const outros = await prisma.perfil.findMany({
    where: perfilId ? { NOT: { id: perfilId } } : undefined,
    select: { id: true, nome: true, cbosVinculo: true, prefixosCbo: true },
  });

  const avisos: string[] = [];

  for (const cbo of cbosNorm) {
    for (const outro of outros) {
      const cbosOutro = outro.cbosVinculo.map(normalizarCodigoCbo);
      if (cbosOutro.includes(cbo)) {
        return {
          ok: false,
          erro: `O CBO ${cbo} já está vinculado ao perfil "${outro.nome}".`,
        };
      }
      for (const prefixo of outro.prefixosCbo) {
        if (cbo.startsWith(prefixo.trim())) {
          return {
            ok: false,
            erro: `O CBO ${cbo} já é coberto pelo prefixo "${prefixo}*" do perfil "${outro.nome}".`,
          };
        }
      }
    }
  }

  for (const prefixo of prefixosNorm) {
    for (const outro of outros) {
      if (outro.prefixosCbo.some((p) => p.trim() === prefixo)) {
        avisos.push(`O prefixo "${prefixo}*" também está no perfil "${outro.nome}".`);
      }
      for (const cboOutro of outro.cbosVinculo.map(normalizarCodigoCbo)) {
        if (cboOutro.startsWith(prefixo)) {
          avisos.push(
            `O CBO ${cboOutro} do perfil "${outro.nome}" já é coberto pelo prefixo "${prefixo}*".`
          );
        }
      }
    }
  }

  return avisos.length > 0 ? { ok: true, avisos } : { ok: true };
}

export async function atribuirPerfilAutomaticoPorCbo(
  prisma: PrismaClient,
  cpf: string
): Promise<string | null> {
  const cpfLimpo = limparNumeros(cpf);
  if (!cpfLimpo) return null;

  const usuario = await prisma.usuario.findFirst({
    where: { cpf: cpfLimpo },
    select: { id: true, perfilId: true, email: true },
  });

  if (!usuario || usuario.perfilId) return null;

  const profissional = await prisma.profissional.findUnique({
    where: { cpf: cpfLimpo },
    select: {
      vinculos: {
        select: {
          cboCodigo: true,
          cboDescricao: true,
          dataDesligamento: true,
        },
        orderBy: { dataEntrada: 'desc' },
      },
    },
  });

  const vinculo = profissional ? vinculoPrincipalAtivo(profissional.vinculos) : null;
  if (!vinculo?.cboCodigo) return null;

  const perfis = await prisma.perfil.findMany({
    where: { ativo: true },
    select: { id: true, cbosVinculo: true, prefixosCbo: true },
    orderBy: { nome: 'asc' },
  });

  for (const perfil of perfis) {
    if (
      perfil.cbosVinculo.length === 0 &&
      perfil.prefixosCbo.length === 0
    ) {
      continue;
    }

    if (cboCorrespondePerfil(vinculo.cboCodigo, perfil.cbosVinculo, perfil.prefixosCbo)) {
      await prisma.usuario.update({
        where: { id: usuario.id },
        data: await dadosAoVincularPerfil(usuario.email, perfil.id),
      });
      return perfil.id;
    }
  }

  return null;
}

export async function obterCboProfissionalPorCpf(
  prisma: PrismaClient,
  cpf: string
): Promise<string | null> {
  const cpfLimpo = limparNumeros(cpf);
  if (!cpfLimpo) return null;

  const profissional = await prisma.profissional.findUnique({
    where: { cpf: cpfLimpo },
    select: {
      vinculos: {
        select: {
          cboCodigo: true,
          cboDescricao: true,
          dataDesligamento: true,
        },
        orderBy: { dataEntrada: 'desc' },
      },
    },
  });

  const vinculo = profissional ? vinculoPrincipalAtivo(profissional.vinculos) : null;
  return vinculo?.cboCodigo ?? null;
}
