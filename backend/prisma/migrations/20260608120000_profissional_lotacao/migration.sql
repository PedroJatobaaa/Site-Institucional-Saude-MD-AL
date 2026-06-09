-- AlterTable
ALTER TABLE "profissionais" ADD COLUMN IF NOT EXISTS "nivel_lotacao" TEXT;
ALTER TABLE "profissionais" ADD COLUMN IF NOT EXISTS "unidade_lotacao" TEXT;

-- Migra registros antigos que possuem nome fantasia como unidade
UPDATE "profissionais"
SET
  "unidade_lotacao" = "nome_fantasia_estabelecimento",
  "nivel_lotacao" = CASE
    WHEN "nome_fantasia_estabelecimento" = 'Secretaria de Saúde' THEN 'Secretaria de Saúde'
    WHEN "nome_fantasia_estabelecimento" IN (
      'UPA 24h Taperaguá', 'CAPS',
      'Centro de Especialidades de Saúde - Estácio',
      'Centro de Especialidades Odontológicas - CEO', 'CERTEA'
    ) THEN 'Atenção Especializada'
    WHEN "nome_fantasia_estabelecimento" IS NOT NULL AND "nome_fantasia_estabelecimento" <> '' THEN 'Atenção Básica'
    ELSE NULL
  END
WHERE "nivel_lotacao" IS NULL
  AND "nome_fantasia_estabelecimento" IS NOT NULL
  AND "nome_fantasia_estabelecimento" <> '';
