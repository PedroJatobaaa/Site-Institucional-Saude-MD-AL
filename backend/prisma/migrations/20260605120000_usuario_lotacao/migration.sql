-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "nivel_lotacao" TEXT;
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "unidade_lotacao" TEXT;

-- Migra registros antigos que só possuem "unidade"
UPDATE "usuarios"
SET
  "unidade_lotacao" = "unidade",
  "nivel_lotacao" = CASE
    WHEN "unidade" = 'Secretaria de Saúde' THEN 'Secretaria de Saúde'
    WHEN "unidade" IN (
      'UPA 24h Taperaguá', 'CAPS',
      'Centro de Especialidades de Saúde - Estácio',
      'Centro de Especialidades Odontológicas - CEO', 'CERTEA'
    ) THEN 'Atenção Especializada'
    WHEN "unidade" IS NOT NULL AND "unidade" <> '' THEN 'Atenção Básica'
    ELSE NULL
  END
WHERE "nivel_lotacao" IS NULL AND "unidade" IS NOT NULL;
