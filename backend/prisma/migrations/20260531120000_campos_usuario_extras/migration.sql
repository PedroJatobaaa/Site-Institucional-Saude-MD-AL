-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "cpf" TEXT;
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "unidade" TEXT;
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "precisa_redefinir_senha" BOOLEAN NOT NULL DEFAULT false;
