# Portal Institucional — Secretaria de Saúde (MD-AL)

## Desenvolvimento (seu PC)

Pré-requisitos: [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado e em execução.

Na pasta do projeto:

```powershell
docker compose -f docker-compose.yml -f docker-compose.local.yml up --build
```

Na primeira subida o build pode levar alguns minutos.

### Acessos locais

| Serviço    | URL                   |
|------------|-----------------------|
| Site       | http://localhost      |
| Frontend   | http://localhost:3000 |
| API        | http://localhost:3333 |
| PostgreSQL | `localhost:5434`      |

### Banco de dados inicial (primeira vez)

Popular coordenações, avisos e carrossel:

```powershell
docker compose -f docker-compose.yml -f docker-compose.local.yml exec backend npx prisma db seed
```

Criar usuário administrador (login do painel):

```powershell
docker compose -f docker-compose.yml -f docker-compose.local.yml exec backend node criar-admin.js
```

Credenciais padrão do script: `smsti@gmail.com` / `smsti321`

### Parar os containers locais

```powershell
docker compose -f docker-compose.yml -f docker-compose.local.yml down
```

---

## Publicar alterações (PC → GitHub)

Depois de desenvolver e testar localmente:

```powershell
git add .
git commit -m "sua mensagem descrevendo a alteração"
git push origin main
```

---

## Produção (servidor)

O servidor usa **apenas** o `docker-compose.yml` (sem o arquivo `.local`). O túnel Cloudflare sobe automaticamente.

### Atualizar o servidor

No VS Code conectado à máquina do servidor, na pasta do projeto:

```bash
git pull origin main
docker compose up -d --build
```

Ou, após o primeiro pull com o script:

```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

As migrações do banco rodam automaticamente quando o backend sobe.

### Verificar após o deploy

```bash
docker compose ps
docker compose logs backend --tail 20
```

Todos os containers devem estar `Up`, incluindo `tunnel_saude`.

### Site em produção

| Serviço | URL                              |
|---------|----------------------------------|
| Site    | https://smsregulacao.com.br      |
| API     | https://api.smsregulacao.com.br  |

---

## Módulos do painel

### Produções

No painel admin (`/admin`), libere as permissões:

- `ROLE_UBS` — profissional da unidade (vincule o campo **Unidade** ao nome da UBS)
- `ROLE_PROCESSAMENTO` — setor de processamento (vê todas as unidades e altera status)

Rota: `/painel/producoes`

### Cadastro de Profissionais

No painel admin, libere a permissão `profissionais_gerenciar`.

Rota: `/painel/profissionais`
