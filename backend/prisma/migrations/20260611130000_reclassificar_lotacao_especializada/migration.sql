-- Reclassifica lotação: apenas UBS em Atenção Básica; demais unidades em Atenção Especializada

UPDATE "profissionais"
SET "nivel_lotacao" = CASE
  WHEN COALESCE(NULLIF("unidade_lotacao", ''), NULLIF("nome_fantasia_estabelecimento", '')) = 'Secretaria de Saúde'
    THEN 'Secretaria de Saúde'
  WHEN COALESCE(NULLIF("unidade_lotacao", ''), NULLIF("nome_fantasia_estabelecimento", '')) IN (
    'UBS Barra Nova', 'UBS Barro Vermelho', 'UBS Cabreiras', 'UBS Denisson Amorim',
    'UBS Francês', 'UBS José Dias', 'UBS Malhadas', 'UBS Massagueira', 'UBS Mucuri',
    'UBS Pedras', 'UBS Poeira', 'UBS Rua da Estiva', 'UBS Rua Nova', 'UBS Santa Rita',
    'UBS Tuquanduba', 'UBS Taperaguá', 'UBS Vila Altina', 'USB Gislene Matheus'
  ) THEN 'Atenção Básica'
  WHEN UPPER(COALESCE(NULLIF("unidade_lotacao", ''), NULLIF("nome_fantasia_estabelecimento", ''))) LIKE 'UBS %'
    THEN 'Atenção Básica'
  WHEN UPPER(COALESCE(NULLIF("unidade_lotacao", ''), NULLIF("nome_fantasia_estabelecimento", ''))) = 'USB GISLENE MATHEUS'
    THEN 'Atenção Básica'
  WHEN COALESCE(NULLIF("unidade_lotacao", ''), NULLIF("nome_fantasia_estabelecimento", '')) IS NOT NULL
    THEN 'Atenção Especializada'
  ELSE "nivel_lotacao"
END
WHERE COALESCE(NULLIF("unidade_lotacao", ''), NULLIF("nome_fantasia_estabelecimento", '')) IS NOT NULL;

UPDATE "usuarios"
SET "nivel_lotacao" = CASE
  WHEN COALESCE(NULLIF("unidade_lotacao", ''), NULLIF("unidade", '')) = 'Secretaria de Saúde'
    THEN 'Secretaria de Saúde'
  WHEN COALESCE(NULLIF("unidade_lotacao", ''), NULLIF("unidade", '')) IN (
    'UBS Barra Nova', 'UBS Barro Vermelho', 'UBS Cabreiras', 'UBS Denisson Amorim',
    'UBS Francês', 'UBS José Dias', 'UBS Malhadas', 'UBS Massagueira', 'UBS Mucuri',
    'UBS Pedras', 'UBS Poeira', 'UBS Rua da Estiva', 'UBS Rua Nova', 'UBS Santa Rita',
    'UBS Tuquanduba', 'UBS Taperaguá', 'UBS Vila Altina', 'USB Gislene Matheus'
  ) THEN 'Atenção Básica'
  WHEN UPPER(COALESCE(NULLIF("unidade_lotacao", ''), NULLIF("unidade", ''))) LIKE 'UBS %'
    THEN 'Atenção Básica'
  WHEN UPPER(COALESCE(NULLIF("unidade_lotacao", ''), NULLIF("unidade", ''))) = 'USB GISLENE MATHEUS'
    THEN 'Atenção Básica'
  WHEN COALESCE(NULLIF("unidade_lotacao", ''), NULLIF("unidade", '')) IS NOT NULL
    THEN 'Atenção Especializada'
  ELSE "nivel_lotacao"
END
WHERE COALESCE(NULLIF("unidade_lotacao", ''), NULLIF("unidade", '')) IS NOT NULL;
