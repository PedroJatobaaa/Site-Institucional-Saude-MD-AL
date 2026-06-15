import type { Express, Request, Response } from 'express';

import type { PrismaClient } from '@prisma/client';

import {

  listarPerfis,

  obterPerfil,

  criarPerfil,

  atualizarPerfil,

  excluirPerfil,

  previewVinculoPerfil,

} from '../../services/perfisService';

import { buscarOcupacoesCbo } from '../../services/cboCatalogService';



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



export function registerAdminPerfilRoutes(app: Express, { prisma, verificarToken }: Deps) {

  app.get('/api/admin/cbos', verificarToken, async (req: Request, res: Response) => {

    try {

      if (!exigirAdmin(req, res)) return;

      const q = typeof req.query.q === 'string' ? req.query.q : undefined;

      const limite = Math.min(50, Math.max(1, parseInt(String(req.query.limite || '30'), 10) || 30));

      return res.json(buscarOcupacoesCbo(q, limite));

    } catch {

      return res.status(500).json({ erro: 'Falha ao buscar ocupações CBO.' });

    }

  });



  app.post('/api/admin/perfis/preview-vinculo', verificarToken, async (req: Request, res: Response) => {

    try {

      if (!exigirAdmin(req, res)) return;

      const preview = await previewVinculoPerfil(prisma, req.body);

      return res.json(preview);

    } catch (error) {

      return res.status(400).json({ erro: error instanceof Error ? error.message : 'Falha no preview.' });

    }

  });



  app.get('/api/admin/perfis', verificarToken, async (req: Request, res: Response) => {

    try {

      if (!exigirAdmin(req, res)) return;

      const perfis = await listarPerfis(prisma);

      return res.json(perfis);

    } catch (error) {

      return res.status(500).json({ erro: error instanceof Error ? error.message : 'Falha ao listar perfis.' });

    }

  });



  app.get('/api/admin/perfis/:id', verificarToken, async (req: Request, res: Response) => {

    try {

      if (!exigirAdmin(req, res)) return;

      const perfil = await obterPerfil(prisma, req.params.id);

      if (!perfil) return res.status(404).json({ erro: 'Perfil não encontrado.' });

      return res.json(perfil);

    } catch (error) {

      return res.status(500).json({ erro: error instanceof Error ? error.message : 'Falha ao obter perfil.' });

    }

  });



  app.post('/api/admin/perfis', verificarToken, async (req: Request, res: Response) => {

    try {

      if (!exigirAdmin(req, res)) return;

      const perfil = await criarPerfil(prisma, req.body);

      return res.status(201).json(perfil);

    } catch (error) {

      return res.status(400).json({ erro: error instanceof Error ? error.message : 'Falha ao criar perfil.' });

    }

  });



  app.put('/api/admin/perfis/:id', verificarToken, async (req: Request, res: Response) => {

    try {

      if (!exigirAdmin(req, res)) return;

      const perfil = await atualizarPerfil(prisma, req.params.id, req.body);

      return res.json(perfil);

    } catch (error) {

      const msg = error instanceof Error ? error.message : 'Falha ao atualizar perfil.';

      const status = msg.includes('não encontrado') ? 404 : 400;

      return res.status(status).json({ erro: msg });

    }

  });



  app.delete('/api/admin/perfis/:id', verificarToken, async (req: Request, res: Response) => {

    try {

      if (!exigirAdmin(req, res)) return;

      await excluirPerfil(prisma, req.params.id);

      return res.json({ mensagem: 'Perfil excluído.' });

    } catch (error) {

      const msg = error instanceof Error ? error.message : 'Falha ao excluir perfil.';

      const status = msg.includes('não encontrado') ? 404 : 400;

      return res.status(status).json({ erro: msg });

    }

  });

}


