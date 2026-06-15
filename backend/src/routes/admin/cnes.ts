import type { Express, Request, Response } from 'express';
import type { PrismaClient } from '@prisma/client';
import type { Multer } from 'multer';
import { importarXmlCnes, listarImportacoesCnes } from '../../services/cnesImportService';

type Deps = {
  prisma: PrismaClient;
  verificarToken: (req: Request, res: Response, next: () => void) => void;
  uploadXml: Multer;
};

function exigirAdmin(req: Request, res: Response): boolean {
  const usuario = (req as Request & { usuario?: { permissoes?: string[]; nome?: string } }).usuario;
  if (!usuario?.permissoes?.includes('admin')) {
    res.status(403).json({ erro: 'Acesso negado.' });
    return false;
  }
  return true;
}

export function registerAdminCnesRoutes(app: Express, { prisma, verificarToken, uploadXml }: Deps) {
  app.post(
    '/api/admin/cnes/importar',
    verificarToken,
    uploadXml.single('arquivo'),
    async (req: Request, res: Response) => {
      try {
        if (!exigirAdmin(req, res)) return;

        const file = req.file;
        if (!file) {
          return res.status(400).json({ erro: 'Arquivo XML não enviado.' });
        }

        const ext = file.originalname.toLowerCase();
        if (!ext.endsWith('.xml')) {
          return res.status(400).json({ erro: 'Apenas arquivos .xml são permitidos.' });
        }

        const usuario = (req as Request & { usuario?: { nome?: string } }).usuario;
        const xmlContent = file.buffer.toString('utf-8');

        const resultado = await importarXmlCnes(
          prisma,
          xmlContent,
          file.originalname,
          usuario?.nome || 'Administrador'
        );

        return res.json(resultado);
      } catch (error) {
        console.error('Erro importação CNES:', error);
        return res.status(500).json({
          erro: error instanceof Error ? error.message : 'Falha ao importar XML CNES.',
        });
      }
    }
  );

  app.get('/api/admin/cnes/importacoes', verificarToken, async (req: Request, res: Response) => {
    try {
      if (!exigirAdmin(req, res)) return;
      const historico = await listarImportacoesCnes(prisma);
      return res.json(historico);
    } catch {
      return res.status(500).json({ erro: 'Falha ao carregar histórico de importações.' });
    }
  });
}
