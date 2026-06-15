-- Backfill Atenção Especializada para profissionais CNES sem lotação preenchida

UPDATE "profissionais" p
SET
  "nome_fantasia_estabelecimento" = u."nome_cnes",
  "unidade_lotacao" = COALESCE(NULLIF(p."unidade_lotacao", ''), u."nome_lotacao")
FROM "unidades_saude" u
WHERE p."cnes" = u."cnes"
  AND u."nome_cnes" IS NOT NULL
  AND TRIM(u."nome_cnes") != ''
  AND (p."nome_fantasia_estabelecimento" IS NULL OR TRIM(p."nome_fantasia_estabelecimento") = '');

UPDATE "profissionais"
SET "nivel_lotacao" = 'Atenção Especializada'
WHERE ("nivel_lotacao" IS NULL OR TRIM("nivel_lotacao") = '')
  AND "cnes" IS NOT NULL
  AND TRIM("cnes") != ''
  AND "cnes" != '9146377'
  AND "cnes" NOT IN (
    SELECT DISTINCT "cnes"
    FROM "profissionais"
    WHERE "nivel_lotacao" = 'Atenção Básica'
      AND "cnes" IS NOT NULL
      AND TRIM("cnes") != ''
  );
