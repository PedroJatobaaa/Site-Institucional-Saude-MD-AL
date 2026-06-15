import type { Express, Request, Response } from 'express';

import type { PrismaClient } from '@prisma/client';

import type multer from 'multer';

import {

  FILAS_PRODUCAO,

  filaPorId,

  filaValida,

  filtrarFilasPorIds,

} from '../constants/filasProducao';

import { calculateDeadline, isPrazoExpirado } from '../utils/producaoDeadline';
import { filasProducaoEfetivas } from '../utils/permissoesUsuario';

import {
  calcularSituacaoPrazo,
  dataPrimeiroEnvio,
  entregaFoiEnviada,
  type SituacaoPrazo,
} from '../utils/producaoSituacao';



type UsuarioToken = {

  id: string;

  nome: string;

  permissoes: string[];

  unidade?: string | null;

};



function isRoleUBS(permissoes: string[]) {

  return permissoes.includes('ROLE_UBS');

}



function isRoleProcessamento(permissoes: string[]) {

  return permissoes.includes('ROLE_PROCESSAMENTO') || permissoes.includes('admin');

}



function temAcessoProducoes(permissoes: string[]) {

  return isRoleUBS(permissoes) || isRoleProcessamento(permissoes);

}



function isAdmin(permissoes: string[]) {

  return permissoes.includes('admin');

}



async function obterIdsFilasUsuario(prisma: PrismaClient, usuarioId: string): Promise<string[]> {

  const usuario = await prisma.usuario.findUnique({

    where: { id: usuarioId },

    include: {

      permissoesProducao: { select: { filaId: true } },

      perfil: { include: { filasProducao: { select: { filaId: true } } } },

    },

  });

  if (!usuario) return [];

  const doPerfil = usuario.perfil?.filasProducao.map((f) => f.filaId) ?? [];

  const doUsuario = usuario.permissoesProducao.map((p) => p.filaId);

  return filasProducaoEfetivas(doPerfil, doUsuario);

}



async function obterFilasPermitidasUsuario(

  prisma: PrismaClient,

  usuarioId: string,

  permissoes: string[]

) {

  if (isRoleProcessamento(permissoes)) {

    return [...FILAS_PRODUCAO];

  }



  const ids = await obterIdsFilasUsuario(prisma, usuarioId);

  return filtrarFilasPorIds(ids);

}



async function usuarioTemPermissaoFila(

  prisma: PrismaClient,

  usuarioId: string,

  permissoes: string[],

  filaId: string

): Promise<boolean> {

  if (isRoleProcessamento(permissoes)) return true;

  if (!filaValida(filaId)) return false;



  const ids = await obterIdsFilasUsuario(prisma, usuarioId);

  return ids.includes(filaId);

}



function descricaoEventoPorStatus(status: string): string {

  const mapa: Record<string, string> = {

    RECEBIDO: 'Arquivo recebido pelo setor de processamento',

    PROCESSANDO: 'Produção em processamento',

    DEVOLVIDO_PARA_AJUSTE: 'Devolvido para ajuste na unidade',

    TRANSMITIDO: 'Produção transmitida com sucesso',

  };

  return mapa[status] || `Status alterado para ${status}`;

}



function tipoEventoPorStatus(status: string): 'PROCESSAMENTO' | 'DEVOLUCAO' | 'TRANSMISSAO' | 'ALTERACAO_STATUS' {

  if (status === 'PROCESSANDO') return 'PROCESSAMENTO';

  if (status === 'DEVOLVIDO_PARA_AJUSTE') return 'DEVOLUCAO';

  if (status === 'TRANSMITIDO') return 'TRANSMISSAO';

  return 'ALTERACAO_STATUS';

}



async function garantirUnidadeNoBanco(prisma: PrismaClient, nome: string) {

  let unidadeDb = await prisma.unidadeBasica.findFirst({

    where: { nome: { equals: nome, mode: 'insensitive' } },

  });



  if (!unidadeDb) {

    unidadeDb = await prisma.unidadeBasica.create({

      data: { nome, codigo: null, ativo: true },

    });

  } else if (!unidadeDb.ativo) {

    unidadeDb = await prisma.unidadeBasica.update({

      where: { id: unidadeDb.id },

      data: { ativo: true },

    });

  }



  return unidadeDb;

}



export function registerProducaoRoutes(

  app: Express,

  deps: {

    prisma: PrismaClient;

    verificarToken: (req: Request, res: Response, next: () => void) => void;

    uploadProducao: multer.Multer;

  }

) {

  const { prisma, verificarToken, uploadProducao } = deps;



  app.get('/api/producoes/filas', verificarToken, async (req: any, res: Response): Promise<any> => {

    try {

      const { id: usuarioId, permissoes } = req.usuario as UsuarioToken;

      if (!temAcessoProducoes(permissoes)) {

        return res.status(403).json({ erro: 'Sem permissão para o módulo de produções.' });

      }



      const filas = await obterFilasPermitidasUsuario(prisma, usuarioId, permissoes);

      return res.json(filas.sort((a, b) => a.label.localeCompare(b.label, 'pt-BR')));

    } catch (error) {

      console.error(error);

      return res.status(500).json({ erro: 'Falha ao listar filas de envio.' });

    }

  });



  app.get('/api/producoes/dashboard', verificarToken, async (req: any, res: Response): Promise<any> => {

    try {

      const { permissoes } = req.usuario as UsuarioToken;

      if (!isAdmin(permissoes)) {

        return res.status(403).json({ erro: 'Apenas administradores podem acessar o dashboard.' });

      }



      const { mes, ano, unidade, sistema } = req.query;

      if (!mes || !ano) {

        return res.status(400).json({ erro: 'Informe mes e ano.' });

      }



      const competenciaMes = Number(mes);

      const competenciaAno = Number(ano);

      if (

        !Number.isInteger(competenciaMes) ||

        competenciaMes < 1 ||

        competenciaMes > 12 ||

        !Number.isInteger(competenciaAno)

      ) {

        return res.status(400).json({ erro: 'Competência inválida.' });

      }



      let filasFiltradas = [...FILAS_PRODUCAO];

      if (unidade) {

        const unidadeStr = String(unidade);

        filasFiltradas = filasFiltradas.filter(

          (f) => f.unidade.toLowerCase() === unidadeStr.toLowerCase()

        );

      }

      if (sistema) {

        const sistemaStr = String(sistema);

        filasFiltradas = filasFiltradas.filter(

          (f) => f.sistema.toLowerCase() === sistemaStr.toLowerCase()

        );

      }



      const filaIds = filasFiltradas.map((f) => f.id);

      const entregas = await prisma.producaoEntrega.findMany({

        where: {

          competenciaMes,

          competenciaAno,

          filaId: { in: filaIds },

        },

        include: {

          eventos: { orderBy: { createdAt: 'asc' } },

        },

      });



      const entregaPorFila = new Map(entregas.map((e) => [e.filaId, e]));



      type StatusProducao = 'RECEBIDO' | 'PROCESSANDO' | 'DEVOLVIDO_PARA_AJUSTE' | 'TRANSMITIDO';

      const porStatus: Record<StatusProducao, number> = {

        RECEBIDO: 0,

        PROCESSANDO: 0,

        DEVOLVIDO_PARA_AJUSTE: 0,

        TRANSMITIDO: 0,

      };



      let enviadas = 0;

      let noPrazo = 0;

      let foraDoPrazo = 0;

      let atrasadas = 0;

      let emAberto = 0;



      const filasDetalhe = filasFiltradas.map((fila) => {

        const entrega = entregaPorFila.get(fila.id);

        const prazoFinal = entrega

          ? entrega.prazoFinal

          : calculateDeadline(competenciaMes, competenciaAno);

        const prazoExpirado = isPrazoExpirado(prazoFinal);

        const eventos = entrega?.eventos ?? [];

        const enviado = entregaFoiEnviada(eventos);

        const situacaoPrazo: SituacaoPrazo = entrega

          ? calcularSituacaoPrazo(entrega, prazoExpirado)

          : prazoExpirado

            ? 'ATRASADO'

            : 'EM_ABERTO';

        const primeiroEnvioData = dataPrimeiroEnvio(eventos);



        if (enviado) enviadas += 1;

        if (situacaoPrazo === 'NO_PRAZO') noPrazo += 1;

        if (situacaoPrazo === 'FORA_DO_PRAZO') foraDoPrazo += 1;

        if (situacaoPrazo === 'ATRASADO') atrasadas += 1;

        if (situacaoPrazo === 'EM_ABERTO') emAberto += 1;



        if (entrega) {

          porStatus[entrega.status as StatusProducao] += 1;

        }



        return {

          filaId: fila.id,

          label: fila.label,

          unidade: fila.unidade,

          sistema: fila.sistema,

          enviado,

          situacaoPrazo,

          status: entrega?.status ?? null,

          dataPrimeiroEnvio: primeiroEnvioData?.toISOString() ?? null,

          prazoFinal: prazoFinal.toISOString(),

          prazoExpirado,

        };

      });



      const totalFilas = filasFiltradas.length;

      const naoEnviadas = totalFilas - enviadas;

      const pct = (n: number) => (totalFilas > 0 ? Math.round((n / totalFilas) * 1000) / 10 : 0);



      return res.json({

        competencia: { mes: competenciaMes, ano: competenciaAno },

        resumo: {

          totalFilas,

          enviadas,

          naoEnviadas,

          pctEnviadas: pct(enviadas),

          pctNaoEnviadas: pct(naoEnviadas),

          noPrazo,

          foraDoPrazo,

          atrasadas,

          emAberto,

          porStatus,

        },

        filas: filasDetalhe.sort((a, b) => a.label.localeCompare(b.label, 'pt-BR')),

      });

    } catch (error) {

      console.error(error);

      return res.status(500).json({ erro: 'Falha ao carregar dashboard.' });

    }

  });



  app.get('/api/producoes/competencia', verificarToken, async (req: any, res: Response): Promise<any> => {

    try {

      const { id: usuarioId, permissoes } = req.usuario as UsuarioToken;

      if (!temAcessoProducoes(permissoes)) {

        return res.status(403).json({ erro: 'Sem permissão.' });

      }



      const { filaId, mes, ano } = req.query;

      if (!filaId || !mes || !ano) {

        return res.status(400).json({ erro: 'Informe filaId, mes e ano.' });

      }



      const filaIdStr = String(filaId);

      const fila = filaPorId(filaIdStr);

      if (!fila) {

        return res.status(400).json({ erro: 'Fila de envio inválida.' });

      }



      const temPermissao = await usuarioTemPermissaoFila(prisma, usuarioId, permissoes, filaIdStr);

      if (!temPermissao) {

        return res.status(403).json({

          erro: `Você não possui permissão para a fila "${fila.label}".`,

        });

      }



      const competenciaMes = Number(mes);

      const competenciaAno = Number(ano);

      const unidadeDb = await garantirUnidadeNoBanco(prisma, fila.unidade);



      const prazoFinal = calculateDeadline(competenciaMes, competenciaAno);

      const prazoExpirado = isPrazoExpirado(prazoFinal);



      let entrega = await prisma.producaoEntrega.findUnique({

        where: {

          filaId_competenciaMes_competenciaAno: {

            filaId: filaIdStr,

            competenciaMes,

            competenciaAno,

          },

        },

        include: {

          unidade: true,

          eventos: { orderBy: { createdAt: 'asc' } },

          mensagens: { orderBy: { createdAt: 'asc' } },

        },

      });



      if (!entrega) {

        entrega = await prisma.producaoEntrega.create({

          data: {

            filaId: filaIdStr,

            unidadeId: unidadeDb.id,

            competenciaMes,

            competenciaAno,

            status: 'RECEBIDO',

            prazoFinal,

          },

          include: {

            unidade: true,

            eventos: { orderBy: { createdAt: 'asc' } },

            mensagens: { orderBy: { createdAt: 'asc' } },

          },

        });

      }



      const situacaoPrazo = calcularSituacaoPrazo(entrega, prazoExpirado);



      return res.json({

        entrega,

        fila,

        prazoFinal,

        prazoExpirado,

        situacaoPrazo,

        podeEnviar: isRoleProcessamento(permissoes) || (!prazoExpirado && isRoleUBS(permissoes)),

        perfil: isRoleProcessamento(permissoes) ? 'PROCESSAMENTO' : 'UBS',

      });

    } catch (error) {

      console.error(error);

      return res.status(500).json({ erro: 'Falha ao carregar competência.' });

    }

  });



  app.patch('/api/producoes/entregas/:id/status', verificarToken, async (req: any, res: Response): Promise<any> => {

    try {

      const { permissoes, id: usuarioId, nome: usuarioNome } = req.usuario as UsuarioToken;

      if (!isRoleProcessamento(permissoes)) {

        return res.status(403).json({ erro: 'Apenas processamento pode alterar o status.' });

      }



      const { status, motivo } = req.body;

      const statusValidos = ['RECEBIDO', 'PROCESSANDO', 'DEVOLVIDO_PARA_AJUSTE', 'TRANSMITIDO'];

      if (!statusValidos.includes(status)) {

        return res.status(400).json({ erro: 'Status inválido.' });

      }

      const entregaAtual = await prisma.producaoEntrega.findUnique({

        where: { id: req.params.id },

      });

      if (!entregaAtual) {

        return res.status(404).json({ erro: 'Entrega não encontrada.' });

      }

      const devolvendoParaAjuste =

        status === 'DEVOLVIDO_PARA_AJUSTE' &&

        entregaAtual.status !== 'DEVOLVIDO_PARA_AJUSTE';

      const motivoTexto = typeof motivo === 'string' ? motivo.trim() : '';

      if (devolvendoParaAjuste && !motivoTexto) {

        return res.status(400).json({

          erro: 'Informe o motivo da devolução para ajuste.',

        });

      }

      const entrega = await prisma.producaoEntrega.update({

        where: { id: req.params.id },

        data: { status },

      });

      if (devolvendoParaAjuste) {

        await prisma.producaoMensagem.create({

          data: {

            entregaId: entrega.id,

            texto: motivoTexto,

            usuarioId,

            usuarioNome,

          },

        });

      }

      await prisma.producaoEvento.create({

        data: {

          entregaId: entrega.id,

          tipo: tipoEventoPorStatus(status),

          status,

          descricao: devolvendoParaAjuste

            ? `Devolvido para ajuste: ${motivoTexto}`

            : descricaoEventoPorStatus(status),

          usuarioId,

          usuarioNome,

        },

      });



      const atualizada = await prisma.producaoEntrega.findUnique({

        where: { id: entrega.id },

        include: {

          unidade: true,

          eventos: { orderBy: { createdAt: 'asc' } },

          mensagens: { orderBy: { createdAt: 'asc' } },

        },

      });



      return res.json(atualizada);

    } catch (error) {

      console.error(error);

      return res.status(500).json({ erro: 'Falha ao atualizar status.' });

    }

  });



  app.post(

    '/api/producoes/entregas/:id/mensagens',

    verificarToken,

    (req: any, res: Response, next: () => void) => {

      uploadProducao.single('arquivo')(req, res, (err: unknown) => {

        if (err) {

          const mensagem =

            err instanceof Error

              ? err.message

              : 'Arquivo inválido. Use .xlsx, .xls ou .csv.';

          return res.status(400).json({ erro: mensagem });

        }

        next();

      });

    },

    async (req: any, res: Response): Promise<any> => {

      try {

        const { permissoes, id: usuarioId, nome: usuarioNome } = req.usuario as UsuarioToken;

        if (!temAcessoProducoes(permissoes)) {

          return res.status(403).json({ erro: 'Sem permissão.' });

        }



        const entrega = await prisma.producaoEntrega.findUnique({

          where: { id: req.params.id },

          include: { unidade: true },

        });



        if (!entrega) return res.status(404).json({ erro: 'Entrega não encontrada.' });



        const fila = filaPorId(entrega.filaId);

        if (!fila) {

          return res.status(400).json({ erro: 'Fila de envio da entrega é inválida.' });

        }



        const temPermissao = await usuarioTemPermissaoFila(

          prisma,

          usuarioId,

          permissoes,

          entrega.filaId

        );

        if (!temPermissao) {

          return res.status(403).json({

            erro: `Você não possui permissão para enviar produção na fila "${fila.label}".`,

          });

        }



        if (isRoleUBS(permissoes) && !isRoleProcessamento(permissoes)) {

          if (isPrazoExpirado(entrega.prazoFinal)) {

            return res.status(403).json({ erro: 'Prazo expirado. Envio bloqueado.' });

          }

        }



        const { texto } = req.body;

        if (!texto && !req.file) {

          return res.status(400).json({ erro: 'Informe uma mensagem ou anexe um arquivo.' });

        }



        const arquivoUrl = req.file ? `/arquivos/producoes/${req.file.filename}` : null;

        const arquivoNome = req.file ? req.file.originalname.replace(/\s/g, '_') : null;



        const mensagem = await prisma.producaoMensagem.create({

          data: {

            entregaId: entrega.id,

            texto: texto || null,

            usuarioId,

            usuarioNome,

            arquivoNome,

            arquivoUrl,

          },

        });



        if (req.file && isRoleUBS(permissoes) && !isRoleProcessamento(permissoes)) {

          await prisma.producaoEntrega.update({

            where: { id: entrega.id },

            data: { status: 'RECEBIDO' },

          });



          await prisma.producaoEvento.create({

            data: {

              entregaId: entrega.id,

              tipo: 'ENVIO_ARQUIVO',

              status: 'RECEBIDO',

              descricao: `Envio de produção — ${fila.label}`,

              usuarioId,

              usuarioNome,

              arquivoNome,

              arquivoUrl,

            },

          });

        }



        if (req.file && isRoleProcessamento(permissoes)) {

          await prisma.producaoEvento.create({

            data: {

              entregaId: entrega.id,

              tipo: 'MENSAGEM',

              descricao: texto || 'Arquivo enviado pelo processamento',

              usuarioId,

              usuarioNome,

              arquivoNome,

              arquivoUrl,

            },

          });

        }



        return res.status(201).json(mensagem);

      } catch (error) {

        console.error(error);

        return res.status(500).json({ erro: 'Falha ao enviar mensagem.' });

      }

    }

  );

}

