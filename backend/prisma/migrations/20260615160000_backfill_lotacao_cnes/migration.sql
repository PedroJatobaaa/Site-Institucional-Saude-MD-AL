-- Backfill lotação a partir de dados CNES já importados

UPDATE "unidades_saude"
SET
  "cnes" = '9146377',
  "nome_cnes" = 'SECRETARIA MUNICIPAL DE SAUDE',
  "nivel_lotacao" = 'Secretaria de Saúde'
WHERE "nome_lotacao" = 'Secretaria de Saúde'
  AND ("cnes" IS NULL OR "cnes" = '');

UPDATE "profissionais"
SET
  "nivel_lotacao" = 'Secretaria de Saúde',
  "unidade_lotacao" = 'Secretaria de Saúde'
WHERE "cnes" = '9146377'
   OR UPPER(TRIM("nome_fantasia_estabelecimento")) = 'SECRETARIA MUNICIPAL DE SAUDE';

UPDATE "profissionais"
SET "nivel_lotacao" = 'Atenção Básica'
WHERE ("nivel_lotacao" IS NULL OR "nivel_lotacao" = '')
  AND (
    UPPER("nome_fantasia_estabelecimento") LIKE 'UNIDADE DE SAUDE DA FAMILIA%'
    OR UPPER("nome_fantasia_estabelecimento") LIKE 'UNIDADE BASICA%'
    OR UPPER("nome_fantasia_estabelecimento") LIKE 'UBS %'
  );

UPDATE "profissionais" SET "unidade_lotacao" = 'UBS Rua da Estiva'
WHERE ("unidade_lotacao" IS NULL OR "unidade_lotacao" = '')
  AND UPPER("nome_fantasia_estabelecimento") LIKE '%RUA DA ESTIV%';

UPDATE "profissionais" SET "unidade_lotacao" = 'UBS José Dias'
WHERE ("unidade_lotacao" IS NULL OR "unidade_lotacao" = '')
  AND UPPER("nome_fantasia_estabelecimento") LIKE '%JOSE DIAS%';

UPDATE "profissionais" SET "unidade_lotacao" = 'UBS Barra Nova'
WHERE ("unidade_lotacao" IS NULL OR "unidade_lotacao" = '')
  AND UPPER("nome_fantasia_estabelecimento") LIKE '%BARRA NOVA%';

UPDATE "profissionais" SET "unidade_lotacao" = 'UBS Barro Vermelho'
WHERE ("unidade_lotacao" IS NULL OR "unidade_lotacao" = '')
  AND UPPER("nome_fantasia_estabelecimento") LIKE '%BARRO VERMEL%';

UPDATE "profissionais" SET "unidade_lotacao" = 'UBS Denisson Amorim'
WHERE ("unidade_lotacao" IS NULL OR "unidade_lotacao" = '')
  AND UPPER("nome_fantasia_estabelecimento") LIKE '%DENISSON%';

UPDATE "profissionais" SET "unidade_lotacao" = 'UBS Santa Rita'
WHERE ("unidade_lotacao" IS NULL OR "unidade_lotacao" = '')
  AND UPPER("nome_fantasia_estabelecimento") LIKE '%SANTA RITA%';

UPDATE "profissionais" SET "unidade_lotacao" = 'UBS Rua Nova'
WHERE ("unidade_lotacao" IS NULL OR "unidade_lotacao" = '')
  AND UPPER("nome_fantasia_estabelecimento") LIKE '%RUA NOVA%';

UPDATE "profissionais" SET "unidade_lotacao" = 'USB Gislene Matheus'
WHERE ("unidade_lotacao" IS NULL OR "unidade_lotacao" = '')
  AND UPPER("nome_fantasia_estabelecimento") LIKE '%GISLENE%';

UPDATE "profissionais"
SET "nivel_lotacao" = 'Atenção Especializada'
WHERE ("nivel_lotacao" IS NULL OR "nivel_lotacao" = '')
  AND "nome_fantasia_estabelecimento" IS NOT NULL
  AND TRIM("nome_fantasia_estabelecimento") != ''
  AND UPPER("nome_fantasia_estabelecimento") NOT LIKE 'UNIDADE DE SAUDE DA FAMILIA%'
  AND UPPER("nome_fantasia_estabelecimento") NOT LIKE 'UNIDADE BASICA%'
  AND UPPER("nome_fantasia_estabelecimento") NOT LIKE 'UBS %'
  AND UPPER(TRIM("nome_fantasia_estabelecimento")) != 'SECRETARIA MUNICIPAL DE SAUDE';
