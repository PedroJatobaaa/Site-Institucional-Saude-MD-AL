import type { Express, Request, Response } from 'express';
import type { PrismaClient } from '@prisma/client';
import {
  listarUnidades,
  criarUnidade,
  atualizarUnidade,
  toggleUnidadeAtiva,
  listarLotacaoOpcoes,
} from '../../services/unidadesService';

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

export function registerAdminUnidadeRoutes(app: Express, { prisma, verificarToken }: Deps) {
  app.get('/api/admin/unidades', verificarToken, async (req: Request, res: Response) => {
    try {
      if (!exigirAdmin(req, res)) return;
      const apenasAtivas = req.query.ativas === 'true';
      const unidades = await listarUnidades(prisma, apenasAtivas);
      return res.json(unidades);
    } catch (error) {
      return res.status(500).json({ erro: error instanceof Error ? error.message : 'Falha ao listar unidades.' });
    }
  });

  app.post('/api/admin/unidades', verificarToken, async (req: Request, res: Response) => {
    try {
      if (!exigirAdmin(req, res)) return;
      const unidade = await criarUnidade(prisma, req.body);
      return res.status(201).json(unidade);
    } catch (error) {
      return res.status(400).json({ erro: error instanceof Error ? error.message : 'Falha ao criar unidade.' });
    }
  });

  app.put('/api/admin/unidades/:id', verificarToken, async (req: Request, res: Response) => {
    try {
      if (!exigirAdmin(req, res)) return;
      const unidade = await atualizarUnidade(prisma, req.params.id, req.body);
      return res.json(unidade);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Falha ao atualizar unidade.';
      const status = msg.includes('não encontrada') ? 404 : 400;
      return res.status(status).json({ erro: msg });
    }
  });

  app.patch('/api/admin/unidades/:id/ativar', verificarToken, async (req: Request, res: Response) => {
    try {
      if (!exigirAdmin(req, res)) return;
      const { ativo } = req.body;
      if (typeof ativo !== 'boolean') {
        return res.status(400).json({ erro: 'Campo ativo é obrigatório (boolean).' });
      }
      const unidade = await toggleUnidadeAtiva(prisma, req.params.id, ativo);
      return res.json(unidade);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Falha ao alterar status.';
      return res.status(404).json({ erro: msg });
    }
  });

  app.get('/api/unidades/lotacao', verificarToken, async (req: Request, res: Response) => {
    try {
      const opcoes = await listarLotacaoOpcoes(prisma);
      return res.json(opcoes);
    } catch {
      return res.status(500).json({ erro: 'Falha ao carregar opções de lotação.' });
    }
  });
}
