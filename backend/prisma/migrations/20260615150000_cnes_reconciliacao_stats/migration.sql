-- AlterTable
ALTER TABLE "importacoes_cnes" ADD COLUMN "profissionais_inativados" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "importacoes_cnes" ADD COLUMN "usuarios_bloqueados" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "importacoes_cnes" ADD COLUMN "usuarios_reativados" INTEGER NOT NULL DEFAULT 0;
