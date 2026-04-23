import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import path from 'path';
import fs from 'fs';
import multer from 'multer';

// 1. Inicializando o Prisma
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL as string });
const prisma = new PrismaClient({ adapter });

const app = express();

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
  try {
    const { nome, email, senha, cargo } = req.body;
    if (!nome || !email || !senha || !cargo) {
      return res.status(400).json({ erro: 'Todos os campos são obrigatórios.' });
    }

    const usuarioExistente = await prisma.usuario.findUnique({ where: { email } });
    if (usuarioExistente) return res.status(400).json({ erro: 'E-mail já em uso.' });

    const senhaCriptografada = await bcrypt.hash(senha, 10);

    const novoUsuario = await prisma.usuario.create({
      data: { nome, email, senha: senhaCriptografada, cargo }
    });

    return res.status(201).json({ mensagem: 'Cadastro realizado! Aguarde aprovação.' });
  } catch (error) {
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

    const token = jwt.sign(
      { id: usuario.id, nome: usuario.nome, cargo: usuario.cargo, permissoes: usuario.permissoes },
      process.env.JWT_SECRET || 'segredo_fallback',
      { expiresIn: '8h' }
    );

    return res.status(200).json({ token, usuario });
  } catch (error) {
    return res.status(500).json({ erro: 'Erro no servidor.' });
  }
});

// ---------------------------------------------------------
// ROTAS DE ADMINISTRAÇÃO (GESTÃO DE USUÁRIOS)
// ---------------------------------------------------------

app.get('/api/admin/usuarios', verificarToken, async (req: any, res: any): Promise<any> => {
  try {
    if (!req.usuario.permissoes.includes('admin')) return res.status(403).json({ erro: 'Acesso negado.' });

    const usuarios = await prisma.usuario.findMany({
      select: { id: true, nome: true, email: true, cargo: true, status: true, permissoes: true, createdAt: true },
      orderBy: { createdAt: 'desc' }
    });
    return res.status(200).json(usuarios);
  } catch (error) {
    return res.status(500).json({ erro: 'Falha ao buscar usuários.' });
  }
});

app.put('/api/admin/usuarios/:id', verificarToken, async (req: any, res: any): Promise<any> => {
  try {
    if (!req.usuario.permissoes.includes('admin')) return res.status(403).json({ erro: 'Acesso negado.' });
    const { id } = req.params;
    const { status, permissoes } = req.body;

    const usuarioAtualizado = await prisma.usuario.update({
      where: { id },
      data: { status, permissoes },
      select: { id: true, nome: true, status: true, permissoes: true }
    });

    return res.status(200).json({ mensagem: 'Acessos atualizados!', usuario: usuarioAtualizado });
  } catch (error) {
    return res.status(500).json({ erro: 'Falha ao atualizar.' });
  }
});

// ---------------------------------------------------------
// ROTAS DO MURAL DE AVISOS
// ---------------------------------------------------------

app.post('/api/avisos', verificarToken, async (req: any, res: any): Promise<any> => {
  try {
    const { titulo, link_anexo, coordenacaoId } = req.body;
    const { permissoes } = req.usuario;

    if (!permissoes.includes('mural_avisos') && !permissoes.includes('admin')) {
      return res.status(403).json({ erro: 'Sem permissão.' });
    }

    const novoAviso = await prisma.aviso.create({
      data: {
        titulo,
        link_anexo: link_anexo || null,
        coordenacao: { connect: { id: coordenacaoId } }
      }
    });

    return res.status(201).json({ mensagem: 'Aviso publicado!', aviso: novoAviso });
  } catch (error) {
    return res.status(500).json({ erro: 'Erro ao criar aviso.' });
  }
});

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
        url_caminho: `http://localhost:3333/arquivos/${req.file.filename}`,
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

// 6. Ligando o Servidor
const PORT = 3333;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});