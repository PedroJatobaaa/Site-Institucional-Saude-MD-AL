import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { Pool } from 'pg'; // Adicionado
import { PrismaPg } from '@prisma/adapter-pg'; // Adicionado
import { PrismaClient } from '@prisma/client';

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { registerProducaoRoutes } from './routes/producoes';
import { registerProfissionalRoutes } from './routes/profissionais';
import { validarLotacao } from './utils/validators/lotacao';
import { validarIdsFilas } from './constants/filasProducao';
import { limparNumeros } from './utils/validators/documentos';

function calcularIdade(dataNascimento: string | null | undefined): number | null {
  if (!dataNascimento) return null;
  const nasc = new Date(dataNascimento);
  if (Number.isNaN(nasc.getTime())) return null;
  const hoje = new Date();
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const mes = hoje.getMonth() - nasc.getMonth();
  if (mes < 0 || (mes === 0 && hoje.getDate() < nasc.getDate())) idade--;
  return idade >= 0 ? idade : null;
}

// 1. Configurando o Driver de Conexão do Prisma 7
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const app = express();
// ... resto do seu código (rotas, middlewares, etc) continua igual

// 2. Configurações essenciais
app.use(cors());
app.use(express.json());

// ---------------------------------------------------------
// CONFIGURAÇÃO DE UPLOADS (REPOSITÓRIO)
// ---------------------------------------------------------

// Cria a pasta de uploads caso ela não exista
const uploadsPath = path.resolve(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

// Faz o Express servir os arquivos da pasta 'uploads' como links públicos
app.use('/arquivos', express.static(uploadsPath));

// Configuração do Multer: Onde salvar e com qual nome
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsPath);
  },
  filename: (req, file, cb) => {
    const tempo = Date.now();
    // Remove espaços do nome original para evitar problemas na URL
    const nomeLimpo = file.originalname.replace(/\s/g, '_');
    cb(null, `${tempo}-${nomeLimpo}`);
  }
});

const upload = multer({ storage });

const producoesPath = path.resolve(__dirname, '..', 'uploads', 'producoes');
if (!fs.existsSync(producoesPath)) {
  fs.mkdirSync(producoesPath, { recursive: true });
}

const storageProducao = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, producoesPath),
  filename: (_req, file, cb) => {
    const tempo = Date.now();
    const nomeLimpo = file.originalname.replace(/\s/g, '_');
    cb(null, `${tempo}-${nomeLimpo}`);
  },
});

const uploadProducao = multer({
  storage: storageProducao,
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.xlsx', '.xls', '.csv'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos .xlsx, .xls ou .csv são permitidos.'));
    }
  },
});

// ---------------------------------------------------------
// MIDDLEWARE DE SEGURANÇA
// ---------------------------------------------------------
const verificarToken = (req: any, res: any, next: any) => {
  const tokenHeader = req.headers.authorization;
  
  if (!tokenHeader) {
    return res.status(401).json({ erro: 'Acesso negado. Token não fornecido.' });
  }

  const token = tokenHeader.split(' ')[1];

  try {
    const decodificado = jwt.verify(token, process.env.JWT_SECRET || 'segredo_fallback');
    req.usuario = decodificado;
    next();
  } catch (error) {
    return res.status(401).json({ erro: 'Token inválido ou expirado.' });
  }
};

// ---------------------------------------------------------
// ROTAS PÚBLICAS (HOME)
// ---------------------------------------------------------

app.get('/', (req, res) => {
  res.json({ mensagem: 'API do Portal da Saúde operando 100% 🏥' });
});

app.get('/api/coordenacoes', async (req, res) => {
  try {
    const coordenacoes = await prisma.coordenacao.findMany({
      orderBy: { nome: 'asc' },
      include: {
        avisos: {
          where: { ativo: true },
          orderBy: { data_publicacao: 'desc' },
          take: 3
        }
      }
    });
    res.json(coordenacoes);
  } catch (error) {
    res.status(500).json({ erro: 'Falha ao buscar coordenações' });
  }
});

app.get('/api/carrossel', async (req, res) => {
  try {
    const banners = await prisma.comunicadoCarrossel.findMany({
      where: { ativo: true },
      orderBy: { ordem_exibicao: 'asc' }
    });
    res.json(banners);
  } catch (error) {
    res.status(500).json({ erro: 'Falha ao buscar banners' });
  }
});

// ---------------------------------------------------------
// ROTAS DE AUTENTICAÇÃO
// ---------------------------------------------------------

app.post('/api/auth/registrar', async (req, res): Promise<any> => {
  console.log("📢 RECEBI UMA TENTATIVA DE REGISTRO!");
  console.log("📦 DADOS RECEBIDOS:", req.body);
  
  try {
    const { nome, email, senha, cargo, cpf, nivel_lotacao, unidade_lotacao } = req.body;
    
    if (!nome || !email || !senha || !cargo) {
      return res.status(400).json({ erro: 'Campos principais são obrigatórios.' });
    }

    const lotacao = validarLotacao(nivel_lotacao, unidade_lotacao);
    if (!lotacao.ok) {
      return res.status(400).json({ erro: lotacao.erro });
    }

    const usuarioExistente = await prisma.usuario.findUnique({ where: { email } });
    if (usuarioExistente) return res.status(400).json({ erro: 'E-mail já em uso.' });

    // 👇 O TESTE: Comente o bcrypt e passe a senha pura só desta vez
    // const senhaCriptografada = await bcrypt.hash(senha, 10);
    const senhaCriptografada = senha; 

    console.log("⏳ Tentando salvar no banco de dados..."); // Mais um dedo-duro

    const novoUsuario = await prisma.usuario.create({
      data: { 
        nome, 
        email, 
        senha: senhaCriptografada, 
        cargo,
        cpf,
        nivelLotacao: lotacao.dados.nivelLotacao,
        unidadeLotacao: lotacao.dados.unidadeLotacao,
        unidade: lotacao.dados.unidade,
      }
    });

    console.log("✅ Usuário salvo com sucesso!");
    return res.status(201).json({ mensagem: 'Cadastro realizado! Aguarde aprovação.' });
  } catch (error) {
    console.error("🔥 ERRO NO CATCH:", error);
    return res.status(500).json({ erro: 'Falha interna no servidor.' });
  }
});

app.post('/api/auth/login', async (req, res): Promise<any> => {
  try {
    const { email, senha } = req.body;
    const usuario = await prisma.usuario.findUnique({ where: { email } });

    if (!usuario || !(await bcrypt.compare(senha, usuario.senha))) {
      return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });
    }

    if (usuario.status === 'PENDENTE') return res.status(403).json({ erro: 'Conta em análise.' });
    if (usuario.status === 'BLOQUEADO') return res.status(403).json({ erro: 'Conta bloqueada.' });

    // 👇 NOVA TRAVA: Verifica se a administração exigiu troca de senha
    if (usuario.precisa_redefinir_senha) {
      // Gera um token temporário (só vale por 10 minutos) apenas para autorizar a troca de senha
      const tokenTemporario = jwt.sign(
        { id: usuario.id, email: usuario.email },
        process.env.JWT_SECRET || 'segredo_fallback',
        { expiresIn: '10m' }
      );
      
      return res.status(200).json({ 
        precisa_redefinir_senha: true, 
        mensagem: 'Atualização de segurança obrigatória.',
        token: tokenTemporario // Manda pro front para ele usar na rota de redefinir
      });
    }

    // Se estiver tudo ok, faz o login normal
    const token = jwt.sign(
      {
        id: usuario.id,
        nome: usuario.nome,
        cargo: usuario.cargo,
        permissoes: usuario.permissoes,
        unidade: usuario.unidade,
      },
      process.env.JWT_SECRET || 'segredo_fallback',
      { expiresIn: '8h' }
    );

    return res.status(200).json({ token, usuario });
  } catch (error) {
    return res.status(500).json({ erro: 'Erro no servidor.' });
  }
});

// 👇 NOVA ROTA: Salvar a nova senha criada pelo próprio usuário
app.post('/api/auth/redefinir-senha', verificarToken, async (req: any, res: any): Promise<any> => {
  try {
    const { email, novaSenha } = req.body;
    
    // O verificarToken garante que só quem tem o token temporário chega aqui
    if (req.usuario.email !== email) {
      return res.status(403).json({ erro: 'Tentativa de alteração inválida.' });
    }

    const senhaCriptografada = await bcrypt.hash(novaSenha, 10);

    await prisma.usuario.update({
      where: { email },
      data: { 
        senha: senhaCriptografada,
        precisa_redefinir_senha: false // Baixa a bandeira vermelha!
      }
    });

    return res.status(200).json({ mensagem: 'Senha atualizada com sucesso!' });
  } catch (error) {
    console.error("Erro ao redefinir senha:", error);
    return res.status(500).json({ erro: 'Falha ao atualizar a senha.' });
  }
});

// ---------------------------------------------------------
// ROTAS DE ADMINISTRAÇÃO (GESTÃO DE USUÁRIOS)
// ---------------------------------------------------------

app.get('/api/admin/usuarios', verificarToken, async (req: any, res: any): Promise<any> => {
  try {
    if (!req.usuario.permissoes.includes('admin')) return res.status(403).json({ erro: 'Acesso negado.' });

    const usuarios = await prisma.usuario.findMany({
      select: { 
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
        permissoesProducao: { select: { filaId: true } },
        createdAt: true 
      },
      orderBy: { createdAt: 'desc' }
    });

    const usuariosFormatados = usuarios.map(({ permissoesProducao, ...usuario }) => ({
      ...usuario,
      permissoesProducao: permissoesProducao.map((p) => p.filaId),
    }));

    return res.status(200).json(usuariosFormatados);
  } catch (error) {
    return res.status(500).json({ erro: 'Falha ao buscar usuários.' });
  }
});

app.put('/api/admin/usuarios/:id', verificarToken, async (req: any, res: any): Promise<any> => {
  try {
    if (!req.usuario.permissoes.includes('admin')) return res.status(403).json({ erro: 'Acesso negado.' });
    const { id } = req.params;
    const { status, permissoes, nivel_lotacao, unidade_lotacao, permissoes_producao } = req.body;

    const dadosAtualizacao: {
      status?: string;
      permissoes?: string[];
      nivelLotacao?: string;
      unidadeLotacao?: string;
      unidade?: string;
    } = {};

    if (status !== undefined) dadosAtualizacao.status = status;
    if (permissoes !== undefined) dadosAtualizacao.permissoes = permissoes;

    if (nivel_lotacao !== undefined || unidade_lotacao !== undefined) {
      const lotacao = validarLotacao(nivel_lotacao, unidade_lotacao);
      if (!lotacao.ok) {
        return res.status(400).json({ erro: lotacao.erro });
      }
      dadosAtualizacao.nivelLotacao = lotacao.dados.nivelLotacao;
      dadosAtualizacao.unidadeLotacao = lotacao.dados.unidadeLotacao;
      dadosAtualizacao.unidade = lotacao.dados.unidade;
    }

    if (permissoes_producao !== undefined) {
      const validacaoFilas = validarIdsFilas(permissoes_producao);
      if (!validacaoFilas.ok) {
        return res.status(400).json({ erro: validacaoFilas.erro });
      }

      await prisma.$transaction([
        prisma.permissaoProducaoUsuario.deleteMany({ where: { usuarioId: id } }),
        ...(validacaoFilas.ids.length > 0
          ? [
              prisma.permissaoProducaoUsuario.createMany({
                data: validacaoFilas.ids.map((filaId) => ({ usuarioId: id, filaId })),
              }),
            ]
          : []),
      ]);
    }

    const usuarioAtualizado = await prisma.usuario.update({
      where: { id },
      data: dadosAtualizacao,
      select: {
        id: true,
        nome: true,
        status: true,
        permissoes: true,
        nivelLotacao: true,
        unidadeLotacao: true,
        unidade: true,
        permissoesProducao: { select: { filaId: true } },
      }
    });

    const { permissoesProducao, ...resto } = usuarioAtualizado;

    return res.status(200).json({
      mensagem: 'Acessos atualizados!',
      usuario: {
        ...resto,
        permissoesProducao: permissoesProducao.map((p) => p.filaId),
      },
    });
  } catch (error) {
    return res.status(500).json({ erro: 'Falha ao atualizar.' });
  }
});

// 👇 NOVA ROTA ADMIN: Levantar a bandeira vermelha
// 👇 NOVA ROTA ADMIN: Levantar a bandeira vermelha E definir Senha Padrão
app.post('/api/admin/usuarios/:id/forcar-senha', verificarToken, async (req: any, res: any): Promise<any> => {
  try {
    if (!req.usuario.permissoes.includes('admin')) return res.status(403).json({ erro: 'Acesso negado.' });
    const { id } = req.params;

    // 1. Define a senha padrão do sistema
    const senhaPadrao = "Saude@123";
    const senhaCriptografada = await bcrypt.hash(senhaPadrao, 10);

    // 2. Atualiza o banco substituindo a senha antiga pela padrão e levantando a bandeira
    await prisma.usuario.update({
      where: { id },
      data: { 
        senha: senhaCriptografada,
        precisa_redefinir_senha: true 
      }
    });

    return res.status(200).json({ mensagem: 'Senha resetada para o padrão.' });
  } catch (error) {
    console.error("Erro ao forçar redefinição:", error);
    return res.status(500).json({ erro: 'Falha ao processar solicitação.' });
  }
});
/// ---------------------------------------------------------
// ROTAS DO MURAL DE AVISOS
// ---------------------------------------------------------

// 1. CRIAR AVISO (Agora com Descrição)
app.post('/api/avisos', verificarToken, async (req: any, res: any): Promise<any> => {
  try {
    const { titulo, descricao, link_anexo, coordenacaoId } = req.body;
    const { permissoes } = req.usuario;

    if (!permissoes.includes('mural_avisos') && !permissoes.includes('admin')) {
      return res.status(403).json({ erro: 'Sem permissão.' });
    }

    const novoAviso = await prisma.aviso.create({
      data: {
        titulo,
        descricao, // Salvando a descrição no banco
        link_anexo: link_anexo || null,
        coordenacao: { connect: { id: coordenacaoId } }
      }
    });

    return res.status(201).json({ mensagem: 'Aviso publicado!', aviso: novoAviso });
  } catch (error) {
    console.error("Erro ao criar aviso:", error);
    return res.status(500).json({ erro: 'Erro ao criar aviso.' });
  }
});

// 2. APAGAR AVISO
app.delete('/api/avisos/:id', verificarToken, async (req: any, res: any): Promise<any> => {
  try {
    const { id } = req.params;
    const { permissoes } = req.usuario;

    if (!permissoes.includes('mural_avisos') && !permissoes.includes('admin')) {
      return res.status(403).json({ erro: 'Sem permissão.' });
    }

    await prisma.aviso.delete({ where: { id } });
    return res.status(200).json({ mensagem: 'Aviso apagado!' });
  } catch (error) {
    return res.status(500).json({ erro: 'Erro ao deletar.' });
  }
});

// 3. BUSCAR AVISOS (Provavelmente esta rota havia sumido)
app.get('/api/avisos', async (req: any, res: any): Promise<any> => {
  try {
    const avisos = await prisma.aviso.findMany({
      include: { coordenacao: true },
      orderBy: { data_publicacao: 'desc' } 
    });
    return res.status(200).json(avisos);
  } catch (error) {
    return res.status(500).json({ erro: 'Erro ao buscar avisos.' });
  }
});

// ---------------------------------------------------------
// ROTAS DO REPOSITÓRIO DE DOCUMENTOS
// ---------------------------------------------------------

// 1. UPLOAD de novo documento
app.post('/api/documentos', verificarToken, upload.single('arquivo'), async (req: any, res: any): Promise<any> => {
  try {
    const { titulo, descricao } = req.body;
    const { permissoes, nome } = req.usuario;

    if (!permissoes.includes('documentos_gerenciar') && !permissoes.includes('admin')) {
      return res.status(403).json({ erro: 'Sem permissão para subir arquivos.' });
    }

    if (!req.file) return res.status(400).json({ erro: 'Nenhum arquivo enviado.' });

    const novoDoc = await prisma.documento.create({
      data: {
        titulo,
        descricao,
        nome_arquivo: req.file.filename,
        tipo_extensao: path.extname(req.file.originalname).replace('.', '').toLowerCase(),
        tamanho: req.file.size,
        url_caminho: `/arquivos/${req.file.filename}`,
        criado_por_nome: nome
      }
    });

    return res.status(201).json(novoDoc);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: 'Falha no upload.' });
  }
});

// 2. LISTAR documentos
app.get('/api/documentos', verificarToken, async (req: any, res: any): Promise<any> => {
  try {
    const { permissoes } = req.usuario;
    
    if (!permissoes.includes('documentos_leitura') && !permissoes.includes('admin')) {
      return res.status(403).json({ erro: 'Você não tem permissão para acessar o repositório.' });
    }

    const docs = await prisma.documento.findMany({
      orderBy: { data_cadastro: 'desc' }
    });
    return res.status(200).json(docs);
  } catch (error) {
    return res.status(500).json({ erro: 'Erro ao buscar documentos.' });
  }
});

// 3. DELETAR documento
app.delete('/api/documentos/:id', verificarToken, async (req: any, res: any): Promise<any> => {
  try {
    const { id } = req.params;
    const { permissoes } = req.usuario;

    if (!permissoes.includes('documentos_gerenciar') && !permissoes.includes('admin')) {
      return res.status(403).json({ erro: 'Sem permissão para excluir.' });
    }

    // Busca o arquivo para deletar do HD também
    const doc = await prisma.documento.findUnique({ where: { id: Number(id) } });
    if (doc) {
      const filePath = path.resolve(uploadsPath, doc.nome_arquivo);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await prisma.documento.delete({ where: { id: Number(id) } });
    return res.status(200).json({ mensagem: 'Arquivo excluído!' });
  } catch (error) {
    return res.status(500).json({ erro: 'Erro ao deletar arquivo.' });
  }
});

// ---------------------------------------------------------
// ROTAS DO MÓDULO UPA (URGÊNCIA E EMERGÊNCIA)
// ---------------------------------------------------------

// 1. BUSCAR PACIENTE (Motor da barra de pesquisa inteligente)
app.get('/api/upa/pacientes', verificarToken, async (req: any, res: any): Promise<any> => {
  console.log(`\n🔍 [UPA] Requisição recebida. Buscando por: "${req.query.q}"`);
  
  try {
    if (!req.usuario) {
      console.log("❌ ERRO: req.usuario está indefinido. O verificarToken falhou silenciosamente.");
      return res.status(403).json({ erro: 'Usuário não autenticado.' });
    }

    const { permissoes } = req.usuario;
    if (!permissoes || (!permissoes.includes('upa_acesso') && !permissoes.includes('admin'))) {
      console.log("❌ ERRO: Usuário sem permissão 'upa_acesso'.");
      return res.status(403).json({ erro: 'Sem permissão.' });
    }

    const termoBusca = req.query.q as string;
    if (!termoBusca || termoBusca.length < 3) {
      console.log("⚠️ Termo muito curto, cancelando busca.");
      return res.status(200).json([]); 
    }

    console.log("⏳ Consultando o banco de dados Prisma...");

    const termoLimpo = limparNumeros(termoBusca);
    const condicoesBusca: Record<string, unknown>[] = [
      { nome: { contains: termoBusca, mode: 'insensitive' } },
      { cpf: { contains: termoBusca } },
      { cns: { contains: termoBusca } },
    ];
    if (termoLimpo.length >= 3 && termoLimpo !== termoBusca) {
      condicoesBusca.push({ cpf: { contains: termoLimpo } });
      condicoesBusca.push({ cns: { contains: termoLimpo } });
    }

    const pacientes = await prisma.paciente.findMany({
      where: { OR: condicoesBusca },
      take: 15
    });

    console.log(`✅ Sucesso! O banco encontrou ${pacientes.length} pacientes.`);
    return res.status(200).json(pacientes);

  } catch (error) {
    console.error("❌ ERRO GRAVE NA ROTA DE BUSCA:", error);
    return res.status(500).json({ erro: 'Falha interna na busca.' });
  }
});

// 2. CADASTRAR NOVO PACIENTE
app.post('/api/upa/pacientes', verificarToken, async (req: any, res: any): Promise<any> => {
  try {
    const { permissoes } = req.usuario;
    if (!permissoes.includes('upa_acesso') && !permissoes.includes('admin')) {
      return res.status(403).json({ erro: 'Sem permissão para cadastrar pacientes.' });
    }

    const { cpf, cns, nome, data_nascimento, idade, sexo, registro_hc } = req.body;

    if (!nome) {
      return res.status(400).json({ erro: 'O nome do paciente é obrigatório.' });
    }

    const cpfNorm = cpf ? limparNumeros(cpf) || null : null;
    const cnsNorm = cns ? limparNumeros(cns) || null : null;
    const idadeFinal = idade != null && idade !== '' ? Number(idade) : calcularIdade(data_nascimento);

    if (cpfNorm) {
      const pacienteExistente = await prisma.paciente.findUnique({ where: { cpf: cpfNorm } });
      if (pacienteExistente) {
        return res.status(400).json({ erro: 'Este CPF já está cadastrado no sistema.' });
      }
    }

    if (cnsNorm) {
      const cnsExistente = await prisma.paciente.findUnique({ where: { cns: cnsNorm } });
      if (cnsExistente) {
        return res.status(400).json({ erro: 'Este CNS já está cadastrado no sistema.' });
      }
    }

    const novoPaciente = await prisma.paciente.create({
      data: { 
        cpf: cpfNorm, 
        cns: cnsNorm,
        nome: nome.toUpperCase().trim(), 
        data_nascimento: data_nascimento || null, 
        idade: idadeFinal, 
        sexo: sexo || null, 
        registro_hc: registro_hc || null 
      }
    });

    return res.status(201).json(novoPaciente);
  } catch (error) {
    console.error("❌ ERRO AO CADASTRAR PACIENTE:", error);
    return res.status(500).json({ erro: 'Falha ao salvar o cadastro.' });
  }
});

// 3. EDITAR PACIENTE EXISTENTE (Com suporte ao campo registro_hc)
app.patch('/api/upa/pacientes/:id', verificarToken, async (req: any, res: any): Promise<any> => {
  try {
    const { id } = req.params;
    const { cpf, cns, nome, data_nascimento, registro_hc } = req.body;

    const cpfLimpo = cpf ? limparNumeros(cpf) || null : null;
    const cnsLimpo = cns ? limparNumeros(cns) || null : null;

    if (cpfLimpo) {
      const conflito = await prisma.paciente.findFirst({
        where: { cpf: cpfLimpo, NOT: { id: Number(id) } }
      });
      if (conflito) return res.status(400).json({ erro: 'Este CPF já pertence a outro paciente.' });
    }

    const pacienteAtualizado = await prisma.paciente.update({
      where: { id: Number(id) },
      data: {
        cpf: cpfLimpo,
        cns: cnsLimpo,
        nome: nome?.toUpperCase().trim(),
        data_nascimento,
        registro_hc // Adicionado para permitir editar o prontuário
      }
    });

    return res.status(200).json(pacienteAtualizado);
  } catch (error) {
    console.error("❌ ERRO AO ATUALIZAR PACIENTE:", error);
    return res.status(500).json({ erro: 'Falha ao atualizar dados do paciente.' });
  }
});

// ========================================================
// NOVO BLOCO: PRESCRIÇÕES (HISTÓRICO / LINHA DO TEMPO)
// ========================================================

// 4. SALVAR PRESCRIÇÃO MÉDICA NO BANCO
app.post('/api/upa/prescricoes', verificarToken, async (req: any, res: any): Promise<any> => {
  try {
    const { nome: medico_nome, permissoes } = req.usuario;
    if (!permissoes.includes('upa_acesso') && !permissoes.includes('admin')) {
      return res.status(403).json({ erro: 'Sem permissão para emitir prescrições.' });
    }

    const { pacienteId, setor, leito, custo, itens } = req.body;

    if (!pacienteId || !itens) {
      return res.status(400).json({ erro: 'Paciente e itens da prescrição são obrigatórios.' });
    }

    const novaPrescricao = await prisma.prescricao.create({
      data: {
        pacienteId: Number(pacienteId), // Transformando em Int pq o banco exige
        setor: setor || '',
        leito: leito || '',
        custo: custo || '',
        itens, // Prisma salva o Array/JSON
        medico_nome
      }
    });

    // Como o front espera uma data legível (10/10/2026 14:00:00), formatamos antes de devolver
    const prescricaoFormatada = {
      ...novaPrescricao,
      data_hora: new Date(novaPrescricao.data_prescricao).toLocaleString('pt-BR')
    };

    return res.status(201).json(prescricaoFormatada);
  } catch (error) {
    console.error("❌ ERRO AO SALVAR PRESCRIÇÃO:", error);
    return res.status(500).json({ erro: 'Falha ao arquivar a prescrição.' });
  }
});

// 5. BUSCAR O HISTÓRICO DE PRESCRIÇÕES DO PACIENTE (Para a Linha do Tempo)
app.get('/api/upa/pacientes/:id/prescricoes', verificarToken, async (req: any, res: any): Promise<any> => {
  try {
    const { id } = req.params;

    const prescricoes = await prisma.prescricao.findMany({
      where: { pacienteId: Number(id) },
      orderBy: { data_prescricao: 'desc' } // Traz a mais recente primeiro
    });

    // Formata a data para a Linha do Tempo no frontend
    const historicoFormatado = prescricoes.map(p => ({
      ...p,
      data_hora: new Date(p.data_prescricao).toLocaleString('pt-BR')
    }));

    return res.status(200).json(historicoFormatado);
  } catch (error) {
    console.error("❌ ERRO AO BUSCAR HISTÓRICO DE PRESCRIÇÕES:", error);
    return res.status(500).json({ erro: 'Falha ao carregar o histórico.' });
  }
});

// ---------------------------------------------------------
// MÓDULO DE PRODUÇÕES (UBS x PROCESSAMENTO)
// ---------------------------------------------------------
registerProducaoRoutes(app, { prisma, verificarToken, uploadProducao });

// ---------------------------------------------------------
// MÓDULO CADASTRO DE PROFISSIONAIS
// ---------------------------------------------------------
registerProfissionalRoutes(app, { prisma, verificarToken });

// 1. Log de Auditoria (Coloque logo após o 'const app = express()')
app.use((req, res, next) => {
  console.log(`🌐 Nova requisição: ${req.method} ${req.url}`);
  next();
});

// Garanta que o body-parser esteja aqui
app.use(express.json());
// Middleware global para capturar erros que o try/catch não pegou
app.use((err: any, req: any, res: any, next: any) => {
  console.error("🚨 ERRO CAPTURADO NO MIDDLEWARE:", err);
  res.status(500).json({ erro: err.message || 'Erro interno' });
});

app.use((err: any, req: any, res: any, next: any) => {
  console.error("🚨 ERRO OCULTO DESCOBERTO:", err);
  
  // Isso força o Express a sempre devolver JSON, nunca texto puro
  res.status(500).json({ 
    erro: "O servidor interceptou uma falha grave.", 
    detalhe: err.message || "Erro desconhecido" 
  });
});

// 6. Ligando o Servidor
const PORT = 3333;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});