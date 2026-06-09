import type { Express, Request, Response } from 'express';
import type { PrismaClient } from '@prisma/client';
import type { ProfissionalCompletoPayload } from '../types/profissionais';
import {
  criarProfissional,
  atualizarProfissional,
  listarProfissionais,
  obterProfissional,
} from '../services/profissionaisService';
import {
  normalizarCPF,
  validarCPF,
  validarCNS,
  validarPisPasep,
} from '../utils/validators/documentos';
import {
  NIVEIS_LOTACAO,
  inferirNivelPorUnidade,
  validarLotacao,
} from '../utils/validators/lotacao';

function validarFiltrosListagem(nivelLotacao?: string, unidadeLotacao?: string): string | null {
  if (nivelLotacao && !NIVEIS_LOTACAO.includes(nivelLotacao as (typeof NIVEIS_LOTACAO)[number])) {
    return 'Categoria de lotação inválida.';
  }

  if (unidadeLotacao) {
    if (nivelLotacao) {
      const lotacao = validarLotacao(nivelLotacao, unidadeLotacao);
      if (!lotacao.ok) return lotacao.erro;
    } else if (!inferirNivelPorUnidade(unidadeLotacao)) {
      return 'Unidade de lotação inválida.';
    }
  }

  return null;
}

type UsuarioToken = {
  id: string;
  nome: string;
  permissoes: string[];
};

function temAcessoProfissionais(permissoes: string[]) {
  return permissoes.includes('profissionais_gerenciar') || permissoes.includes('admin');
}

function validarPayloadDocumentos(payload: ProfissionalCompletoPayload): string | null {
  const { profissional } = payload;

  if (!profissional?.nomeProfissional?.trim()) {
    return 'Nome do profissional é obrigatório.';
  }
  if (!profissional.cpf) {
    return 'CPF é obrigatório.';
  }
  if (!validarCPF(profissional.cpf)) {
    return 'CPF inválido.';
  }
  if (profissional.pisPasep && !validarPisPasep(profissional.pisPasep)) {
    return 'PIS/PASEP inválido.';
  }
  if (profissional.numeroCns && !validarCNS(profissional.numeroCns)) {
    return 'CNS inválido.';
  }

  const lotacao = validarLotacao(profissional.nivelLotacao, profissional.unidadeLotacao);
  if (!lotacao.ok) {
    return lotacao.erro;
  }
  profissional.nivelLotacao = lotacao.dados.nivelLotacao;
  profissional.unidadeLotacao = lotacao.dados.unidadeLotacao;

  return null;
}

export function registerProfissionalRoutes(
  app: Express,
  deps: {
    prisma: PrismaClient;
    verificarToken: (req: Request, res: Response, next: () => void) => void;
  }
) {
  const { prisma, verificarToken } = deps;

  app.get('/api/profissionais', verificarToken, async (req: any, res: Response): Promise<any> => {
    try {
      const { permissoes } = req.usuario as UsuarioToken;
      if (!temAcessoProfissionais(permissoes)) {
        return res.status(403).json({ erro: 'Sem permissão para o cadastro de profissionais.' });
      }

      const q = typeof req.query.q === 'string' ? req.query.q : undefined;
      const nivelLotacao = typeof req.query.nivel_lotacao === 'string' ? req.query.nivel_lotacao : undefined;
      const unidadeLotacao = typeof req.query.unidade_lotacao === 'string' ? req.query.unidade_lotacao : undefined;

      const erroFiltro = validarFiltrosListagem(nivelLotacao, unidadeLotacao);
      if (erroFiltro) {
        return res.status(400).json({ erro: erroFiltro });
      }

      const lista = await listarProfissionais(prisma, {
        q,
        nivelLotacao,
        unidadeLotacao,
      });
      return res.json(lista);
    } catch (error) {
      console.error('Erro ao listar profissionais:', error);
      return res.status(500).json({ erro: 'Falha ao listar profissionais.' });
    }
  });

  app.get('/api/profissionais/:id', verificarToken, async (req: any, res: Response): Promise<any> => {
    try {
      const { permissoes } = req.usuario as UsuarioToken;
      if (!temAcessoProfissionais(permissoes)) {
        return res.status(403).json({ erro: 'Sem permissão para o cadastro de profissionais.' });
      }

      const profissional = await obterProfissional(prisma, req.params.id);
      if (!profissional) {
        return res.status(404).json({ erro: 'Profissional não encontrado.' });
      }
      return res.json(profissional);
    } catch (error) {
      console.error('Erro ao obter profissional:', error);
      return res.status(500).json({ erro: 'Falha ao carregar profissional.' });
    }
  });

  app.post('/api/profissionais', verificarToken, async (req: any, res: Response): Promise<any> => {
    try {
      const { permissoes, id: usuarioId, nome } = req.usuario as UsuarioToken;
      if (!temAcessoProfissionais(permissoes)) {
        return res.status(403).json({ erro: 'Sem permissão para o cadastro de profissionais.' });
      }

      const payload = req.body as ProfissionalCompletoPayload;
      const erroValidacao = validarPayloadDocumentos(payload);
      if (erroValidacao) {
        return res.status(400).json({ erro: erroValidacao });
      }

      const cpfNorm = normalizarCPF(payload.profissional.cpf);
      const existente = await prisma.profissional.findUnique({ where: { cpf: cpfNorm } });
      if (existente) {
        return res.status(400).json({ erro: 'Já existe um profissional cadastrado com este CPF.' });
      }

      const criado = await criarProfissional(prisma, payload, { usuarioId, usuarioNome: nome });
      return res.status(201).json(criado);
    } catch (error) {
      console.error('Erro ao criar profissional:', error);
      return res.status(500).json({ erro: 'Falha ao criar profissional.' });
    }
  });

  app.put('/api/profissionais/:id', verificarToken, async (req: any, res: Response): Promise<any> => {
    try {
      const { permissoes, id: usuarioId, nome } = req.usuario as UsuarioToken;
      if (!temAcessoProfissionais(permissoes)) {
        return res.status(403).json({ erro: 'Sem permissão para o cadastro de profissionais.' });
      }

      const payload = req.body as ProfissionalCompletoPayload;
      const erroValidacao = validarPayloadDocumentos(payload);
      if (erroValidacao) {
        return res.status(400).json({ erro: erroValidacao });
      }

      const cpfNorm = normalizarCPF(payload.profissional.cpf);
      const duplicado = await prisma.profissional.findFirst({
        where: { cpf: cpfNorm, NOT: { id: req.params.id } },
      });
      if (duplicado) {
        return res.status(400).json({ erro: 'Já existe outro profissional com este CPF.' });
      }

      const atualizado = await atualizarProfissional(prisma, req.params.id, payload, {
        usuarioId,
        usuarioNome: nome,
      });
      if (!atualizado) {
        return res.status(404).json({ erro: 'Profissional não encontrado.' });
      }
      return res.json(atualizado);
    } catch (error) {
      console.error('Erro ao atualizar profissional:', error);
      return res.status(500).json({ erro: 'Falha ao atualizar profissional.' });
    }
  });

}
