-- AlterTable
ALTER TABLE "perfis" ADD COLUMN "cbos_vinculo" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "perfis" ADD COLUMN "prefixos_cbo" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
