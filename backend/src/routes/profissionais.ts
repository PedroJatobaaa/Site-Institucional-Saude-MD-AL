import type { Express, Request, Response } from 'express';
import type { PrismaClient } from '@prisma/client';
import type {
  ProfissionalCompletoPayload,
  StatusCadastroAtualizacao,
  StatusTreinamento,
} from '../types/profissionais';
import {
  CADASTRO_ATUALIZACAO_OPCOES,
  TREINAMENTO_OPCOES,
} from '../types/profissionais';
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
import { carregarUnidadesPorNivel } from '../utils/unidadesCache';

function validarFiltrosListagem(
  nivelLotacao?: string,
  unidadeLotacao?: string,
  treinamento?: string,
  cadastroAtualizacao?: string,
  unidadesMapa?: Record<string, readonly string[]>,
): string | null {
  if (nivelLotacao && !NIVEIS_LOTACAO.includes(nivelLotacao as (typeof NIVEIS_LOTACAO)[number])) {
    return 'Categoria de lotação inválida.';
  }

  if (unidadeLotacao) {
    if (nivelLotacao) {
      const lotacao = validarLotacao(nivelLotacao, unidadeLotacao, unidadesMapa);
      if (!lotacao.ok) return lotacao.erro;
    } else if (!inferirNivelPorUnidade(unidadeLotacao)) {
      return 'Unidade de lotação inválida.';
    }
  }

  if (treinamento && !TREINAMENTO_OPCOES.includes(treinamento as StatusTreinamento)) {
    return 'Status de treinamento inválido.';
  }

  if (cadastroAtualizacao && !CADASTRO_ATUALIZACAO_OPCOES.includes(cadastroAtualizacao as StatusCadastroAtualizacao)) {
    return 'Status de cadastro/atualização inválido.';
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

function validarPayloadDocumentos(
  payload: ProfissionalCompletoPayload,
  unidadesMapa?: Record<string, readonly string[]>,
): string | null {
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

  const lotacao = validarLotacao(profissional.nivelLotacao, profissional.unidadeLotacao, unidadesMapa);
  if (!lotacao.ok) {
    return lotacao.erro;
  }
  profissional.nivelLotacao = lotacao.dados.nivelLotacao;
  profissional.unidadeLotacao = lotacao.dados.unidadeLotacao;

  if (profissional.treinamento && !TREINAMENTO_OPCOES.includes(profissional.treinamento)) {
    return 'Status de treinamento inválido.';
  }
  if (profissional.cadastroAtualizacao && !CADASTRO_ATUALIZACAO_OPCOES.includes(profissional.cadastroAtualizacao)) {
    return 'Status de cadastro/atualização inválido.';
  }

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
        return res.status(403).json({ erro: 'Sem permissão para acessar o módulo Profissionais.' });
      }

      const q = typeof req.query.q === 'string' ? req.query.q : undefined;
      const nivelLotacao = typeof req.query.nivel_lotacao === 'string' ? req.query.nivel_lotacao : undefined;
      const unidadeLotacao = typeof req.query.unidade_lotacao === 'string' ? req.query.unidade_lotacao : undefined;
      const treinamento = typeof req.query.treinamento === 'string' ? req.query.treinamento : undefined;
      const cadastroAtualizacao = typeof req.query.cadastro_atualizacao === 'string'
        ? req.query.cadastro_atualizacao
        : undefined;
      const paginaRaw = typeof req.query.pagina === 'string' ? Number.parseInt(req.query.pagina, 10) : 1;
      const pagina = Number.isFinite(paginaRaw) && paginaRaw > 0 ? paginaRaw : 1;
      const incluirInativos = req.query.incluir_inativos === '1';

      const mapaUnidades = await carregarUnidadesPorNivel(prisma);
      const erroFiltro = validarFiltrosListagem(
        nivelLotacao,
        unidadeLotacao,
        treinamento,
        cadastroAtualizacao,
        mapaUnidades,
      );
      if (erroFiltro) {
        return res.status(400).json({ erro: erroFiltro });
      }

      const lista = await listarProfissionais(prisma, {
        q,
        nivelLotacao,
        unidadeLotacao,
        treinamento: treinamento as StatusTreinamento | undefined,
        cadastroAtualizacao: cadastroAtualizacao as StatusCadastroAtualizacao | undefined,
        pagina,
        incluirInativos,
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
        return res.status(403).json({ erro: 'Sem permissão para acessar o módulo Profissionais.' });
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
        return res.status(403).json({ erro: 'Sem permissão para acessar o módulo Profissionais.' });
      }

      const payload = req.body as ProfissionalCompletoPayload;
      const mapaUnidades = await carregarUnidadesPorNivel(prisma);
      const erroValidacao = validarPayloadDocumentos(payload, mapaUnidades);
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
        return res.status(403).json({ erro: 'Sem permissão para acessar o módulo Profissionais.' });
      }

      const payload = req.body as ProfissionalCompletoPayload;
      const mapaUnidades = await carregarUnidadesPorNivel(prisma);
      const erroValidacao = validarPayloadDocumentos(payload, mapaUnidades);
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
