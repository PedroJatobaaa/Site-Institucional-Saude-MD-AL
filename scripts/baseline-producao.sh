#!/bin/sh
# Uso único no servidor: alinha o banco existente com o histórico de migrações do Prisma.
# Rode na pasta do projeto: sh scripts/baseline-producao.sh

set -e

MIGRACOES_BASE="
20260414142725_init_landing_page
20260415173006_add_users_table
20260423130159_adicionar_documentos
20260423171124_sistema_prescricao_upa
20260424121528_adicionar_cns_opcional
"

echo "=== Baseline: marcando migrações já existentes no banco ==="
for m in $MIGRACOES_BASE; do
  echo "Marcando como aplicada: $m"
  docker compose exec -T backend npx prisma migrate resolve --applied "$m"
done

echo "=== Aplicando migrações novas ==="
docker compose exec -T backend npx prisma migrate deploy

echo "=== Reiniciando backend ==="
docker compose restart backend

echo "Baseline concluído. Verifique: docker compose logs backend --tail 20"
