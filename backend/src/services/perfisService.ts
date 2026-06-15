import type { PrismaClient } from '@prisma/client';

import { validarPermissoes } from '../constants/permissoes';

import { validarIdsFilas } from '../constants/filasProducao';

import { mesclarRegrasCbo } from '../constants/gruposCboPerfil';

import {

  contarUsuariosElegiveisSemPerfil,

  validarCbosUnicosEntrePerfis,

  vincularUsuariosSemPerfil,

} from './perfilCboSyncService';



type DadosCboPerfil = {

  cbos_vinculo?: string[];

  prefixos_cbo?: string[];

  grupos_cbo?: string[];

};



function resolverRegrasCbo(dados: DadosCboPerfil) {

  if (

    dados.cbos_vinculo === undefined &&

    dados.prefixos_cbo === undefined &&

    dados.grupos_cbo === undefined

  ) {

    return null;

  }



  return mesclarRegrasCbo(

    dados.cbos_vinculo ?? [],

    dados.prefixos_cbo ?? [],

    dados.grupos_cbo

  );

}



async function validarRegrasCbo(

  prisma: PrismaClient,

  perfilId: string | null,

  regras: { cbos: string[]; prefixos: string[] }

) {

  const validacao = await validarCbosUnicosEntrePerfis(

    prisma,

    perfilId,

    regras.cbos,

    regras.prefixos

  );

  if (!validacao.ok) throw new Error(validacao.erro);

  return validacao.avisos ?? [];

}



export async function listarPerfis(prisma: PrismaClient) {

  const perfis = await prisma.perfil.findMany({

    include: {

      filasProducao: { select: { filaId: true } },

      _count: { select: { usuarios: true } },

    },

    orderBy: { nome: 'asc' },

  });



  return perfis.map(({ filasProducao, ...p }) => ({

    ...p,

    filasProducao: filasProducao.map((f) => f.filaId),

  }));

}



export async function obterPerfil(prisma: PrismaClient, id: string) {

  const perfil = await prisma.perfil.findUnique({

    where: { id },

    include: {

      filasProducao: { select: { filaId: true } },

      usuarios: {

        select: {

          id: true,

          nome: true,

          email: true,

          cargo: true,

          cpf: true,

          status: true,

          permissoes: true,

          perfilId: true,

          nivelLotacao: true,

          unidadeLotacao: true,

          unidade: true,

          createdAt: true,

          permissoesProducao: { select: { filaId: true } },

        },

        orderBy: { nome: 'asc' },

      },

    },

  });



  if (!perfil) return null;



  const { filasProducao, usuarios, ...resto } = perfil;

  return {

    ...resto,

    filasProducao: filasProducao.map((f) => f.filaId),

    usuarios: usuarios.map(({ permissoesProducao, ...u }) => ({

      ...u,

      permissoesProducao: permissoesProducao.map((p) => p.filaId),

    })),

  };

}



export async function previewVinculoPerfil(

  prisma: PrismaClient,

  dados: DadosCboPerfil

) {

  const regras = resolverRegrasCbo(dados) ?? { cbos: [], prefixos: [] };

  const totalElegiveis = await contarUsuariosElegiveisSemPerfil(

    prisma,

    regras.cbos,

    regras.prefixos

  );

  return { totalElegiveis, cbosVinculo: regras.cbos, prefixosCbo: regras.prefixos };

}



export async function criarPerfil(

  prisma: PrismaClient,

  dados: {

    nome: string;

    descricao?: string | null;

    permissoes?: string[];

    filas_producao?: string[];

    ativo?: boolean;

  } & DadosCboPerfil

) {

  const nome = dados.nome?.trim();

  if (!nome) throw new Error('Nome do perfil é obrigatório.');



  const validacao = validarPermissoes(dados.permissoes ?? []);

  if (!validacao.ok) throw new Error(validacao.erro);



  let filasIds: string[] = [];

  if (dados.filas_producao !== undefined) {

    const validacaoFilas = validarIdsFilas(dados.filas_producao);

    if (!validacaoFilas.ok) throw new Error(validacaoFilas.erro);

    filasIds = validacaoFilas.ids;

  }



  const regrasCbo = resolverRegrasCbo(dados) ?? { cbos: [], prefixos: [] };

  await validarRegrasCbo(prisma, null, regrasCbo);



  const perfil = await prisma.$transaction(async (tx) => {

    const criado = await tx.perfil.create({

      data: {

        nome,

        descricao: dados.descricao?.trim() || null,

        permissoes: validacao.ids,

        cbosVinculo: regrasCbo.cbos,

        prefixosCbo: regrasCbo.prefixos,

        ativo: dados.ativo ?? true,

      },

    });



    if (filasIds.length > 0) {

      await tx.permissaoProducaoPerfil.createMany({

        data: filasIds.map((filaId) => ({ perfilId: criado.id, filaId })),

      });

    }



    return criado;

  });



  const sync = await vincularUsuariosSemPerfil(prisma, perfil.id);

  const perfilCompleto = await obterPerfil(prisma, perfil.id);



  return {

    ...perfilCompleto,

    usuariosVinculados: sync.vinculados,

  };

}



export async function atualizarPerfil(

  prisma: PrismaClient,

  id: string,

  dados: {

    nome?: string;

    descricao?: string | null;

    permissoes?: string[];

    filas_producao?: string[];

    ativo?: boolean;

  } & DadosCboPerfil

) {

  const existente = await prisma.perfil.findUnique({ where: { id } });

  if (!existente) throw new Error('Perfil não encontrado.');



  const updateData: {

    nome?: string;

    descricao?: string | null;

    permissoes?: string[];

    cbosVinculo?: string[];

    prefixosCbo?: string[];

    ativo?: boolean;

  } = {};



  if (dados.nome !== undefined) {

    const nome = dados.nome.trim();

    if (!nome) throw new Error('Nome do perfil é obrigatório.');

    updateData.nome = nome;

  }

  if (dados.descricao !== undefined) updateData.descricao = dados.descricao?.trim() || null;

  if (dados.ativo !== undefined) updateData.ativo = dados.ativo;



  if (dados.permissoes !== undefined) {

    const validacao = validarPermissoes(dados.permissoes);

    if (!validacao.ok) throw new Error(validacao.erro);

    updateData.permissoes = validacao.ids;

  }



  const regrasResolvidas = resolverRegrasCbo(dados);

  if (regrasResolvidas) {

    await validarRegrasCbo(prisma, id, regrasResolvidas);

    updateData.cbosVinculo = regrasResolvidas.cbos;

    updateData.prefixosCbo = regrasResolvidas.prefixos;

  }



  await prisma.$transaction(async (tx) => {

    if (Object.keys(updateData).length > 0) {

      await tx.perfil.update({ where: { id }, data: updateData });

    }



    if (dados.filas_producao !== undefined) {

      const validacaoFilas = validarIdsFilas(dados.filas_producao);

      if (!validacaoFilas.ok) throw new Error(validacaoFilas.erro);



      await tx.permissaoProducaoPerfil.deleteMany({ where: { perfilId: id } });

      if (validacaoFilas.ids.length > 0) {

        await tx.permissaoProducaoPerfil.createMany({

          data: validacaoFilas.ids.map((filaId) => ({ perfilId: id, filaId })),

        });

      }

    }

  });



  const sync = await vincularUsuariosSemPerfil(prisma, id);

  const perfilCompleto = await obterPerfil(prisma, id);



  return {

    ...perfilCompleto,

    usuariosVinculados: sync.vinculados,

  };

}



export async function excluirPerfil(prisma: PrismaClient, id: string) {

  const existente = await prisma.perfil.findUnique({

    where: { id },

    include: { _count: { select: { usuarios: true } } },

  });

  if (!existente) throw new Error('Perfil não encontrado.');

  if (existente._count.usuarios > 0) {

    throw new Error('Não é possível excluir perfil com usuários vinculados.');

  }

  await prisma.perfil.delete({ where: { id } });

}


