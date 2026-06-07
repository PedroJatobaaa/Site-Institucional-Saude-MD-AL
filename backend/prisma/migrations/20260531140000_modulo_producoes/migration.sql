-- CreateEnum
CREATE TYPE "StatusProducao" AS ENUM ('RECEBIDO', 'PROCESSANDO', 'DEVOLVIDO_PARA_AJUSTE', 'TRANSMITIDO');

-- CreateEnum
CREATE TYPE "TipoEventoProducao" AS ENUM ('ENVIO_ARQUIVO', 'PROCESSAMENTO', 'DEVOLUCAO', 'TRANSMISSAO', 'MENSAGEM', 'ALTERACAO_STATUS');

-- CreateTable
CREATE TABLE "unidades_basicas" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "codigo" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "unidades_basicas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "producao_entregas" (
    "id" TEXT NOT NULL,
    "unidade_id" TEXT NOT NULL,
    "competencia_mes" INTEGER NOT NULL,
    "competencia_ano" INTEGER NOT NULL,
    "status" "StatusProducao" NOT NULL DEFAULT 'RECEBIDO',
    "prazo_final" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "producao_entregas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "producao_eventos" (
    "id" TEXT NOT NULL,
    "entrega_id" TEXT NOT NULL,
    "tipo" "TipoEventoProducao" NOT NULL,
    "status" "StatusProducao",
    "descricao" TEXT NOT NULL,
    "usuario_id" TEXT,
    "usuario_nome" TEXT NOT NULL,
    "arquivo_nome" TEXT,
    "arquivo_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "producao_eventos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "producao_mensagens" (
    "id" TEXT NOT NULL,
    "entrega_id" TEXT NOT NULL,
    "texto" TEXT,
    "usuario_id" TEXT NOT NULL,
    "usuario_nome" TEXT NOT NULL,
    "arquivo_nome" TEXT,
    "arquivo_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "producao_mensagens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "unidades_basicas_nome_key" ON "unidades_basicas"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "unidades_basicas_codigo_key" ON "unidades_basicas"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "producao_entregas_unidade_id_competencia_mes_competencia_ano_key" ON "producao_entregas"("unidade_id", "competencia_mes", "competencia_ano");

-- AddForeignKey
ALTER TABLE "producao_entregas" ADD CONSTRAINT "producao_entregas_unidade_id_fkey" FOREIGN KEY ("unidade_id") REFERENCES "unidades_basicas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "producao_eventos" ADD CONSTRAINT "producao_eventos_entrega_id_fkey" FOREIGN KEY ("entrega_id") REFERENCES "producao_entregas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "producao_mensagens" ADD CONSTRAINT "producao_mensagens_entrega_id_fkey" FOREIGN KEY ("entrega_id") REFERENCES "producao_entregas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed UBS exemplo
INSERT INTO "unidades_basicas" ("id", "nome", "codigo", "ativo") VALUES
  ('00000000-0000-4000-8000-000000000001', 'UBS Centro', 'UBS-01', true),
  ('00000000-0000-4000-8000-000000000002', 'UBS Farol', 'UBS-02', true),
  ('00000000-0000-4000-8000-000000000003', 'UBS Mutange', 'UBS-03', true),
  ('00000000-0000-4000-8000-000000000004', 'UBS Pontal da Barra', 'UBS-04', true),
  ('00000000-0000-4000-8000-000000000005', 'UBS Riacho Doce', 'UBS-05', true);
