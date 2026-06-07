-- CreateEnum
CREATE TYPE "TipoHistoricoProfissional" AS ENUM ('CRIACAO', 'ALTERACAO');

-- CreateTable
CREATE TABLE "profissional_historico" (
    "id" TEXT NOT NULL,
    "profissional_id" TEXT NOT NULL,
    "tipo" "TipoHistoricoProfissional" NOT NULL,
    "usuario_id" TEXT,
    "usuario_nome" TEXT NOT NULL,
    "alteracoes" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profissional_historico_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "profissional_historico" ADD CONSTRAINT "profissional_historico_profissional_id_fkey" FOREIGN KEY ("profissional_id") REFERENCES "profissionais"("id") ON DELETE CASCADE ON UPDATE CASCADE;
