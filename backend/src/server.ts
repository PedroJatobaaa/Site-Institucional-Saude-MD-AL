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
    // 1. Agora o backend também pega o CPF e a Unidade do corpo da requisição
    const { nome, email, senha, cargo, cpf, unidade } = req.body;
    
    if (!nome || !email || !senha || !cargo) {
      return res.status(400).json({ erro: 'Campos principais são obrigatórios.' });
    }

    const usuarioExistente = await prisma.usuario.findUnique({ where: { email } });
    if (usuarioExistente) return res.status(400).json({ erro: 'E-mail já em uso.' });

    const senhaCriptografada = await bcrypt.hash(senha, 10);

    const novoUsuario = await prisma.usuario.create({
      data: { 
        nome, 
        email, 
        senha: senhaCriptografada, 
        cargo,
        cpf,       // Salvando no banco!
        unidade    // Salvando no banco!
      }
    });

    return res.status(201).json({ mensagem: 'Cadastro realizado! Aguarde aprovação.' });
  } catch (error) {
    console.error(error);
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
      // 2. Liberando o CPF e a Unidade para aparecerem na lista do frontend!
      select: { 
        id: true, 
        nome: true, 
        email: true, 
        cargo: true, 
        cpf: true,       // Agora vai!
        unidade: true,   // Agora vai!
        status: true, 
        permissoes: true, 
        createdAt: true 
      },
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

// ---------------------------------------------------------
// ROTAS DO MÓDULO UPA (URGÊNCIA E EMERGÊNCIA)
// ---------------------------------------------------------

// 1. BUSCAR PACIENTE (Motor da barra de pesquisa inteligente)
app.get('/api/upa/pacientes', verificarToken, async (req: any, res: any): Promise<any> => {
  console.log(`\n🔍 [UPA] Requisição recebida. Buscando por: "${req.query.q}"`);
  
  try {
    // 1. Verifica se o usuário chegou da catraca (verificarToken)
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
    
    const pacientes = await prisma.paciente.findMany({
      where: {
        OR: [
          { nome: { contains: termoBusca, mode: 'insensitive' } },
          { cpf: { contains: termoBusca } },
          { cns: { contains: termoBusca } }
        ]
      },
      take: 15
    });

    console.log(`✅ Sucesso! O banco encontrou ${pacientes.length} pacientes.`);
    return res.status(200).json(pacientes);

  } catch (error) {
    console.error("❌ ERRO GRAVE NA ROTA DE BUSCA:", error);
    return res.status(500).json({ erro: 'Falha interna na busca.' });
  }
});

// 2. CADASTRAR NOVO PACIENTE (Caso não exista nos 60 mil da planilha)
app.post('/api/upa/pacientes', verificarToken, async (req: any, res: any): Promise<any> => {
  try {
    const { permissoes } = req.usuario;
    if (!permissoes.includes('upa_acesso') && !permissoes.includes('admin')) {
      return res.status(403).json({ erro: 'Sem permissão para cadastrar pacientes.' });
    }

    // <- NOVO: Adicionado o cns na desestruturação
    const { cpf, cns, nome, data_nascimento, idade, sexo, registro_hc } = req.body;

    // Como o CPF agora pode ser nulo na planilha, exigimos pelo menos o Nome.
    if (!nome) {
      return res.status(400).json({ erro: 'O nome do paciente é obrigatório.' });
    }

    // Trava de segurança: Evitar CPFs duplicados (só checa se o médico tiver digitado um)
    if (cpf) {
      const pacienteExistente = await prisma.paciente.findUnique({ where: { cpf } });
      if (pacienteExistente) {
        return res.status(400).json({ erro: 'Este CPF já está cadastrado no sistema.' });
      }
    }

    // Trava de segurança: Evitar CNS duplicados
    if (cns) {
      const cnsExistente = await prisma.paciente.findUnique({ where: { cns } });
      if (cnsExistente) {
        return res.status(400).json({ erro: 'Este CNS já está cadastrado no sistema.' });
      }
    }

    const novoPaciente = await prisma.paciente.create({
      data: { 
        cpf: cpf || null, // Se vier vazio do front, salva como null no banco
        cns: cns || null,
        nome, 
        data_nascimento: data_nascimento || null, 
        idade: idade ? Number(idade) : null, 
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

// 3. SALVAR PRESCRIÇÃO MÉDICA (Guardar o histórico do que foi receitado)
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
        pacienteId: Number(pacienteId),
        setor: setor || '',
        leito: leito || '',
        custo: custo || '',
        itens, // O Prisma já lida com o formato JSON automaticamente
        medico_nome
      }
    });

    return res.status(201).json({ mensagem: 'Receituário registrado no banco de dados!', prescricao: novaPrescricao });
  } catch (error) {
    console.error("❌ ERRO AO SALVAR PRESCRIÇÃO:", error);
    return res.status(500).json({ erro: 'Falha ao arquivar a prescrição.' });
  }
});

// 3. EDITAR PACIENTE EXISTENTE (Para completar CPF/CNS faltantes)
app.patch('/api/upa/pacientes/:id', verificarToken, async (req: any, res: any): Promise<any> => {
  try {
    const { id } = req.params;
    const { cpf, cns, nome, data_nascimento } = req.body;

    // Limpeza básica dos dados
    const cpfLimpo = cpf ? cpf.replace(/\D/g, '') : null;
    const cnsLimpo = cns ? cns.replace(/\D/g, '') : null;

    // Validação de duplicidade: Se o médico estiver adicionando um CPF, 
    // checamos se esse CPF já não pertence a OUTRA pessoa no banco.
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
        data_nascimento
      }
    });

    return res.status(200).json(pacienteAtualizado);
  } catch (error) {
    console.error("❌ ERRO AO ATUALIZAR PACIENTE:", error);
    return res.status(500).json({ erro: 'Falha ao atualizar dados do paciente.' });
  }
});

// 6. Ligando o Servidor
const PORT = 3333;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});