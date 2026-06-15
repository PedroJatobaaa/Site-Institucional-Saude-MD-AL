import type { Express, Request, Response } from 'express';
import type { Prisma, PrismaClient } from '@prisma/client';
import { validarPermissoes } from '../../constants/permissoes';
import { validarIdsFilas } from '../../constants/filasProducao';
import { validarLotacao } from '../../utils/validators/lotacao';
import { carregarUnidadesPorNivel } from '../../utils/unidadesCache';
import { limparNumeros } from '../../utils/validators/documentos';
import {
  carregarMapaDescricoesCbo,
  resolverCargoCbo,
  vinculoPrincipalAtivo,
} from '../../utils/cargoCbo';
import { dadosAoVincularPerfil, hashSenhaPadrao } from '../../utils/primeiroAcessoCnes';

const USUARIOS_POR_PAGINA = 20;

type Deps = {
  prisma: PrismaClient;
  verificarToken: (req: Request, res: Response, next: () => void) => void;
};

function exigirAdmin(req: Request, res: Response): boolean {
  const usuario = (req as Request & { usuario?: { permissoes?: string[] } }).usuario;
  if (!usuario?.permissoes?.includes('admin')) {
    res.status(403).json({ erro: 'Acesso negado.' });
    return false;
  }
  return true;
}

async function montarWhereUsuarios(
  prisma: PrismaClient,
  busca?: string
): Promise<Prisma.UsuarioWhereInput | undefined> {
  const termo = busca?.trim();
  if (!termo) return undefined;

  const cpfBusca = limparNumeros(termo);
  const condicoes: Prisma.UsuarioWhereInput[] = [
    { nome: { contains: termo, mode: 'insensitive' } },
  ];

  if (cpfBusca.length >= 3) {
    condicoes.push({ cpf: { contains: cpfBusca } });
  }

  const profissionaisMatch = await prisma.profissional.findMany({
    where: {
      OR: [
        { nomeProfissional: { contains: termo, mode: 'insensitive' } },
        ...(cpfBusca.length >= 3 ? [{ cpf: { contains: cpfBusca } }] : []),
      ],
    },
    select: { cpf: true },
  });

  const cpfsProfissionais = profissionaisMatch.map((p) => p.cpf).filter(Boolean);
  if (cpfsProfissionais.length > 0) {
    condicoes.push({ cpf: { in: cpfsProfissionais } });
  }

  return { OR: condicoes };
}

const selectUsuarioAdmin = {
  id: true,
  nome: true,
  email: true,
  cargo: true,
  cpf: true,
  unidade: true,
  nivelLotacao: true,
  unidadeLotacao: true,
  status: true,
  permissoes: true,
  perfilId: true,
  perfil: {
    select: {
      id: true,
      nome: true,
      permissoes: true,
      filasProducao: { select: { filaId: true } },
    },
  },
  permissoesProducao: { select: { filaId: true } },
  createdAt: true,
} as const;

async function formatarUsuariosAdmin(
  prisma: PrismaClient,
  usuarios: Prisma.UsuarioGetPayload<{ select: typeof selectUsuarioAdmin }>[]
) {
  const cpfs = usuarios
    .map((u) => (u.cpf ? limparNumeros(u.cpf) : null))
    .filter((cpf): cpf is string => Boolean(cpf));

  const [mapaCbo, profissionais] = await Promise.all([
    carregarMapaDescricoesCbo(prisma),
    cpfs.length > 0
      ? prisma.profissional.findMany({
          where: { cpf: { in: cpfs } },
          select: {
            id: true,
            cpf: true,
            nomeProfissional: true,
            vinculos: {
              select: {
                cboCodigo: true,
                cboDescricao: true,
                dataDesligamento: true,
              },
              orderBy: { dataEntrada: 'desc' },
            },
          },
        })
      : Promise.resolve([]),
  ]);

  const profissionalPorCpf = new Map(profissionais.map((p) => [p.cpf, p]));

  return usuarios.map(({ permissoesProducao, perfil, ...usuario }) => {
    const cpfLimpo = usuario.cpf ? limparNumeros(usuario.cpf) : null;
    const profissional = cpfLimpo ? profissionalPorCpf.get(cpfLimpo) : null;
    const vinculo = profissional ? vinculoPrincipalAtivo(profissional.vinculos) : null;
    const cargoCbo = resolverCargoCbo(vinculo?.cboCodigo, vinculo?.cboDescricao, mapaCbo);

    return {
      ...usuario,
      nomeProfissional: profissional?.nomeProfissional ?? usuario.nome,
      cargoCbo: cargoCbo ?? usuario.cargo,
      cboCodigo: vinculo?.cboCodigo ?? null,
      profissionalId: profissional?.id ?? null,
      perfil: perfil
        ? {
            ...perfil,
            filasProducao: perfil.filasProducao.map((f) => f.filaId),
          }
        : null,
      permissoesProducao: permissoesProducao.map((p) => p.filaId),
    };
  });
}

export function registerAdminUsuarioRoutes(app: Express, { prisma, verificarToken }: Deps) {
  app.get('/api/admin/usuarios', verificarToken, async (req: Request, res: Response) => {
    try {
      if (!exigirAdmin(req, res)) return;

      const busca = typeof req.query.q === 'string' ? req.query.q : undefined;
      const paginaSolicitada = Math.max(1, parseInt(String(req.query.pagina || '1'), 10) || 1);
      const where = await montarWhereUsuarios(prisma, busca);

      const total = await prisma.usuario.count({ where });
      const totalPaginas = Math.max(1, Math.ceil(total / USUARIOS_POR_PAGINA));
      const pagina = Math.min(paginaSolicitada, totalPaginas);

      const usuarios = await prisma.usuario.findMany({
        where,
        select: selectUsuarioAdmin,
        orderBy: { createdAt: 'desc' },
        skip: (pagina - 1) * USUARIOS_POR_PAGINA,
        take: USUARIOS_POR_PAGINA,
      });

      const itens = await formatarUsuariosAdmin(prisma, usuarios);

      return res.status(200).json({
        itens,
        total,
        pagina,
        porPagina: USUARIOS_POR_PAGINA,
        totalPaginas,
      });
    } catch {
      return res.status(500).json({ erro: 'Falha ao buscar usuários.' });
    }
  });

  app.put('/api/admin/usuarios/:id', verificarToken, async (req: Request, res: Response) => {
    try {
      if (!exigirAdmin(req, res)) return;
      const { id } = req.params;
      const { nome, email, status, permissoes, perfil_id, nivel_lotacao, unidade_lotacao, permissoes_producao } =
        req.body;

      const dadosAtualizacao: {
        nome?: string;
        email?: string;
        status?: string;
        permissoes?: string[];
        perfilId?: string | null;
        nivelLotacao?: string;
        unidadeLotacao?: string;
        unidade?: string;
        senha?: string;
        precisa_redefinir_senha?: boolean;
      } = {};

      if (nome !== undefined) {
        const nomeLimpo = String(nome).trim();
        if (!nomeLimpo) return res.status(400).json({ erro: 'Nome é obrigatório.' });
        dadosAtualizacao.nome = nomeLimpo;
      }

      if (email !== undefined) {
        const emailLimpo = String(email).trim().toLowerCase();
        if (!emailLimpo) return res.status(400).json({ erro: 'E-mail é obrigatório.' });
        const emailEmUso = await prisma.usuario.findFirst({
          where: { email: emailLimpo, NOT: { id } },
        });
        if (emailEmUso) return res.status(400).json({ erro: 'E-mail já em uso por outro usuário.' });
        dadosAtualizacao.email = emailLimpo;
      }

      if (status !== undefined) dadosAtualizacao.status = status;

      if (permissoes !== undefined) {
        const validacao = validarPermissoes(permissoes);
        if (!validacao.ok) return res.status(400).json({ erro: validacao.erro });
        dadosAtualizacao.permissoes = validacao.ids;
      }

      if (perfil_id !== undefined) {
        if (perfil_id === null || perfil_id === '') {
          dadosAtualizacao.perfilId = null;
        } else {
          const perfil = await prisma.perfil.findUnique({ where: { id: perfil_id } });
          if (!perfil) return res.status(400).json({ erro: 'Perfil não encontrado.' });

          const usuarioAtualPerfil = await prisma.usuario.findUnique({
            where: { id },
            select: { email: true },
          });
          if (!usuarioAtualPerfil) return res.status(404).json({ erro: 'Usuário não encontrado.' });

          Object.assign(dadosAtualizacao, await dadosAoVincularPerfil(usuarioAtualPerfil.email, perfil_id));
        }
      }

      if (nivel_lotacao !== undefined || unidade_lotacao !== undefined) {
        const mapa = await carregarUnidadesPorNivel(prisma);
        const lotacao = validarLotacao(nivel_lotacao, unidade_lotacao, mapa);
        if (!lotacao.ok) return res.status(400).json({ erro: lotacao.erro });
        dadosAtualizacao.nivelLotacao = lotacao.dados.nivelLotacao;
        dadosAtualizacao.unidadeLotacao = lotacao.dados.unidadeLotacao;
        dadosAtualizacao.unidade = lotacao.dados.unidade;
      }

      if (permissoes_producao !== undefined) {
        const validacaoFilas = validarIdsFilas(permissoes_producao);
        if (!validacaoFilas.ok) return res.status(400).json({ erro: validacaoFilas.erro });

        const perfilIdAtual =
          dadosAtualizacao.perfilId !== undefined
            ? dadosAtualizacao.perfilId
            : (await prisma.usuario.findUnique({ where: { id }, select: { perfilId: true } }))?.perfilId;

        let filasPerfil: string[] = [];
        if (perfilIdAtual) {
          const filas = await prisma.permissaoProducaoPerfil.findMany({
            where: { perfilId: perfilIdAtual },
            select: { filaId: true },
          });
          filasPerfil = filas.map((f) => f.filaId);
        }

        const filasExtras = validacaoFilas.ids.filter((filaId) => !filasPerfil.includes(filaId));

        await prisma.$transaction([
          prisma.permissaoProducaoUsuario.deleteMany({ where: { usuarioId: id } }),
          ...(filasExtras.length > 0
            ? [
                prisma.permissaoProducaoUsuario.createMany({
                  data: filasExtras.map((filaId) => ({ usuarioId: id, filaId })),
                }),
              ]
            : []),
        ]);
      }

      const usuarioAtual = await prisma.usuario.findUnique({
        where: { id },
        select: { cpf: true },
      });

      if (dadosAtualizacao.nome && usuarioAtual?.cpf) {
        const cpfLimpo = limparNumeros(usuarioAtual.cpf);
        if (cpfLimpo) {
          await prisma.profissional.updateMany({
            where: { cpf: cpfLimpo },
            data: { nomeProfissional: dadosAtualizacao.nome },
          });
        }
      }

      const usuarioAtualizado = await prisma.usuario.update({
        where: { id },
        data: dadosAtualizacao,
        select: {
          id: true,
          nome: true,
          email: true,
          cpf: true,
          cargo: true,
          status: true,
          permissoes: true,
          perfilId: true,
          perfil: {
            select: {
              id: true,
              nome: true,
              permissoes: true,
              filasProducao: { select: { filaId: true } },
            },
          },
          nivelLotacao: true,
          unidadeLotacao: true,
          unidade: true,
          permissoesProducao: { select: { filaId: true } },
        },
      });

      const { permissoesProducao, perfil, ...resto } = usuarioAtualizado;

      return res.status(200).json({
        mensagem: 'Acessos atualizados!',
        usuario: {
          ...resto,
          perfil: perfil
            ? { ...perfil, filasProducao: perfil.filasProducao.map((f) => f.filaId) }
            : null,
          permissoesProducao: permissoesProducao.map((p) => p.filaId),
        },
      });
    } catch {
      return res.status(500).json({ erro: 'Falha ao atualizar.' });
    }
  });

  app.post('/api/admin/usuarios/:id/forcar-senha', verificarToken, async (req: Request, res: Response) => {
    try {
      if (!exigirAdmin(req, res)) return;
      const { id } = req.params;

      const senhaCriptografada = await hashSenhaPadrao();

      await prisma.usuario.update({
        where: { id },
        data: {
          senha: senhaCriptografada,
          precisa_redefinir_senha: true,
        },
      });

      return res.status(200).json({ mensagem: 'Senha resetada para o padrão.' });
    } catch {
      return res.status(500).json({ erro: 'Falha ao processar solicitação.' });
    }
  });
}
