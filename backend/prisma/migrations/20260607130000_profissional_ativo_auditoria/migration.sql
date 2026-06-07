-- AlterTable
ALTER TABLE "profissionais" ADD COLUMN "ativo" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "profissionais" ADD COLUMN "criado_por_nome" TEXT;
