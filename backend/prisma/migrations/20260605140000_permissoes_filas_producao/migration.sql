-- Tabela N:N: permissões de fila de produção por usuário
CREATE TABLE "permissoes_producao_usuario" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "fila_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissoes_producao_usuario_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "permissoes_producao_usuario_usuario_id_fila_id_key"
    ON "permissoes_producao_usuario"("usuario_id", "fila_id");

ALTER TABLE "permissoes_producao_usuario"
    ADD CONSTRAINT "permissoes_producao_usuario_usuario_id_fkey"
    FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Fila de envio na entrega de produção (Unidade + Sistema)
ALTER TABLE "producao_entregas" ADD COLUMN "fila_id" TEXT;

-- Backfill: associa entregas antigas à primeira fila da mesma unidade
UPDATE "producao_entregas" pe
SET "fila_id" = sub.fila_id
FROM (
    SELECT pe2.id AS entrega_id,
        CASE ub.nome
            WHEN 'APS' THEN 'aps-e-sus'
            WHEN 'CAPS' THEN 'caps-e-sus'
            WHEN 'CEO' THEN 'ceo-e-sus'
            WHEN 'CERTEA' THEN 'certea-e-sus'
            WHEN 'CESPEL' THEN 'cespel-e-sus'
            WHEN 'CPN' THEN 'cpn-sisreg-iii'
            WHEN 'Espaço Klécia' THEN 'espaco-klecia-bpa-i'
            WHEN 'Laboratorio Marechal' THEN 'laboratorio-marechal-sisreg-iii'
            WHEN 'UMF' THEN 'umf-e-sus'
            WHEN 'UPA' THEN 'upa-e-sus'
            WHEN 'Vigilancia Sanitaria' THEN 'vigilancia-sanitaria-bpa-c'
            ELSE 'aps-e-sus'
        END AS fila_id
    FROM "producao_entregas" pe2
    JOIN "unidades_basicas" ub ON ub.id = pe2.unidade_id
) sub
WHERE pe.id = sub.entrega_id AND pe.fila_id IS NULL;

ALTER TABLE "producao_entregas" ALTER COLUMN "fila_id" SET NOT NULL;

-- Remove entregas legadas duplicadas na mesma fila/competência (mantém a mais antiga)
DELETE FROM "producao_entregas" pe
WHERE pe.id NOT IN (
    SELECT DISTINCT ON (sub.fila_id, sub.competencia_mes, sub.competencia_ano) sub.id
    FROM "producao_entregas" sub
    ORDER BY sub.fila_id, sub.competencia_mes, sub.competencia_ano, sub.created_at ASC
);

-- Troca unicidade: competência por fila (não mais só por unidade)
DROP INDEX IF EXISTS "producao_entregas_unidade_id_competencia_mes_competencia_ano_key";

CREATE UNIQUE INDEX "producao_entregas_fila_id_competencia_mes_competencia_ano_key"
    ON "producao_entregas"("fila_id", "competencia_mes", "competencia_ano");
