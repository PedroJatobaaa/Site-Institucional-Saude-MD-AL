import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const catalog = JSON.parse(
  fs.readFileSync(path.join(root, 'backend/src/data/cnesEstabelecimentos.json'), 'utf8')
);

const fantasiaCases = Object.entries(catalog)
  .map(([cnes, nome]) => `    WHEN '${cnes}' THEN '${nome.replace(/'/g, "''")}'`)
  .join('\n');

const sql = `-- Preenche nome fantasia e unidade a partir do catálogo CNES

UPDATE "profissionais"
SET
  "nome_fantasia_estabelecimento" = CASE "cnes"
${fantasiaCases}
    ELSE "nome_fantasia_estabelecimento"
  END,
  "unidade_lotacao" = CASE "cnes"
${fantasiaCases}
    ELSE "unidade_lotacao"
  END
WHERE "cnes" IN (${Object.keys(catalog).map((c) => `'${c}'`).join(', ')})
  AND (
    "nome_fantasia_estabelecimento" IS NULL OR TRIM("nome_fantasia_estabelecimento") = ''
    OR "unidade_lotacao" IS NULL OR TRIM("unidade_lotacao") = ''
  );
`;

const outDir = path.join(root, 'backend/prisma/migrations/20260615180000_preencher_unidades_cnes');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'migration.sql'), sql);
console.log('Migration written:', outDir);
