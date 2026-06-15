-- CreateTable perfis
CREATE TABLE "perfis" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "permissoes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "perfis_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "perfis_nome_key" ON "perfis"("nome");

-- CreateTable permissoes_producao_perfil
CREATE TABLE "permissoes_producao_perfil" (
    "id" TEXT NOT NULL,
    "perfil_id" TEXT NOT NULL,
    "fila_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissoes_producao_perfil_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "permissoes_producao_perfil_perfil_id_fila_id_key" ON "permissoes_producao_perfil"("perfil_id", "fila_id");

ALTER TABLE "permissoes_producao_perfil" ADD CONSTRAINT "permissoes_producao_perfil_perfil_id_fkey" FOREIGN KEY ("perfil_id") REFERENCES "perfis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable usuarios
ALTER TABLE "usuarios" ADD COLUMN "perfil_id" TEXT;

ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_perfil_id_fkey" FOREIGN KEY ("perfil_id") REFERENCES "perfis"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable unidades_saude
CREATE TABLE "unidades_saude" (
    "id" TEXT NOT NULL,
    "cnes" TEXT,
    "nome_cnes" TEXT,
    "nome_lotacao" TEXT NOT NULL,
    "nivel_lotacao" TEXT NOT NULL,
    "tipo_unidade" TEXT,
    "cnpj" TEXT,
    "logradouro" TEXT,
    "bairro" TEXT,
    "cep" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "unidades_saude_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "unidades_saude_cnes_key" ON "unidades_saude"("cnes");
CREATE UNIQUE INDEX "unidades_saude_nome_lotacao_nivel_lotacao_key" ON "unidades_saude"("nome_lotacao", "nivel_lotacao");

-- CreateTable importacoes_cnes
CREATE TABLE "importacoes_cnes" (
    "id" TEXT NOT NULL,
    "nome_arquivo" TEXT NOT NULL,
    "data_referencia" TEXT,
    "unidades_criadas" INTEGER NOT NULL DEFAULT 0,
    "unidades_atualizadas" INTEGER NOT NULL DEFAULT 0,
    "profissionais_criados" INTEGER NOT NULL DEFAULT 0,
    "profissionais_atualizados" INTEGER NOT NULL DEFAULT 0,
    "usuarios_criados" INTEGER NOT NULL DEFAULT 0,
    "usuarios_atualizados" INTEGER NOT NULL DEFAULT 0,
    "avisos" JSONB NOT NULL DEFAULT '[]',
    "usuario_nome" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "importacoes_cnes_pkey" PRIMARY KEY ("id")
);

-- Seed unidades from existing lotacao lists
INSERT INTO "unidades_saude" ("id", "nome_lotacao", "nivel_lotacao", "updated_at") VALUES
(gen_random_uuid()::text, 'UBS Barra Nova', 'Atenção Básica', NOW()),
(gen_random_uuid()::text, 'UBS Barro Vermelho', 'Atenção Básica', NOW()),
(gen_random_uuid()::text, 'UBS Cabreiras', 'Atenção Básica', NOW()),
(gen_random_uuid()::text, 'UBS Denisson Amorim', 'Atenção Básica', NOW()),
(gen_random_uuid()::text, 'UBS Francês', 'Atenção Básica', NOW()),
(gen_random_uuid()::text, 'UBS José Dias', 'Atenção Básica', NOW()),
(gen_random_uuid()::text, 'UBS Malhadas', 'Atenção Básica', NOW()),
(gen_random_uuid()::text, 'UBS Massagueira', 'Atenção Básica', NOW()),
(gen_random_uuid()::text, 'UBS Mucuri', 'Atenção Básica', NOW()),
(gen_random_uuid()::text, 'UBS Pedras', 'Atenção Básica', NOW()),
(gen_random_uuid()::text, 'UBS Poeira', 'Atenção Básica', NOW()),
(gen_random_uuid()::text, 'UBS Rua da Estiva', 'Atenção Básica', NOW()),
(gen_random_uuid()::text, 'UBS Rua Nova', 'Atenção Básica', NOW()),
(gen_random_uuid()::text, 'UBS Santa Rita', 'Atenção Básica', NOW()),
(gen_random_uuid()::text, 'UBS Tuquanduba', 'Atenção Básica', NOW()),
(gen_random_uuid()::text, 'UBS Taperaguá', 'Atenção Básica', NOW()),
(gen_random_uuid()::text, 'UBS Vila Altina', 'Atenção Básica', NOW()),
(gen_random_uuid()::text, 'USB Gislene Matheus', 'Atenção Básica', NOW()),
(gen_random_uuid()::text, 'AERONAVE BARON 58', 'Atenção Especializada', NOW()),
(gen_random_uuid()::text, 'AERONAVE CESSNA', 'Atenção Especializada', NOW()),
(gen_random_uuid()::text, 'CAPS', 'Atenção Especializada', NOW()),
(gen_random_uuid()::text, 'CAPS MARIA CELIA DE ARAUJO SARMENTO', 'Atenção Especializada', NOW()),
(gen_random_uuid()::text, 'CENTRAL DE ABASTECIMENTO FARMACEUTICO CAF', 'Atenção Especializada', NOW()),
(gen_random_uuid()::text, 'CENTRAL MUNICIPAL DE REDE DE FRIO DE MARECHAL DEODORO', 'Atenção Especializada', NOW()),
(gen_random_uuid()::text, 'Centro de Especialidades de Saúde - Estácio', 'Atenção Especializada', NOW()),
(gen_random_uuid()::text, 'Centro de Especialidades Odontológicas - CEO', 'Atenção Especializada', NOW()),
(gen_random_uuid()::text, 'CENTRO DE PARTO NORMAL IMACULADA CONCEICAO', 'Atenção Especializada', NOW()),
(gen_random_uuid()::text, 'CENTRO DE SAUDE PROFESSOR ESTACIO DE LIMA', 'Atenção Especializada', NOW()),
(gen_random_uuid()::text, 'CENTRO MUNICIPAL DE ESPECIALIDADE ODONTOLOGICA', 'Atenção Especializada', NOW()),
(gen_random_uuid()::text, 'CERTEA', 'Atenção Especializada', NOW()),
(gen_random_uuid()::text, 'CERTEA CENTRO ESP DE REF EM TRANSTORNO DO ESPECTRO AUTISTA', 'Atenção Especializada', NOW()),
(gen_random_uuid()::text, 'HELICOPTERO FALCAO 5', 'Atenção Especializada', NOW()),
(gen_random_uuid()::text, 'LABORATORIO DE PROTESE DENTARIA MARECHAL DEODORO', 'Atenção Especializada', NOW()),
(gen_random_uuid()::text, 'MELHOR EM CASA', 'Atenção Especializada', NOW()),
(gen_random_uuid()::text, 'POSTO DE APOIO MUCURI', 'Atenção Especializada', NOW()),
(gen_random_uuid()::text, 'POSTO DE SAUDE DO RIACHO VELHO', 'Atenção Especializada', NOW()),
(gen_random_uuid()::text, 'POSTO DE SAUDE SACO', 'Atenção Especializada', NOW()),
(gen_random_uuid()::text, 'UNIDADE MUNICIPAL DE FISIOTERAPIA', 'Atenção Especializada', NOW()),
(gen_random_uuid()::text, 'UPA 24h Taperaguá', 'Atenção Especializada', NOW()),
(gen_random_uuid()::text, 'UPA 24 HORAS TAPERAGUA MARECHAL DEODORO AL', 'Atenção Especializada', NOW()),
(gen_random_uuid()::text, 'USB 10 MARECHAL DEODORO', 'Atenção Especializada', NOW()),
(gen_random_uuid()::text, 'VIGILANCIA EM SAUDE', 'Atenção Especializada', NOW()),
(gen_random_uuid()::text, 'Secretaria de Saúde', 'Secretaria de Saúde', NOW());
