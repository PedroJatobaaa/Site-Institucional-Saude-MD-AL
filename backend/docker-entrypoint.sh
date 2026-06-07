#!/bin/sh
set -e

echo "Aguardando o PostgreSQL..."
i=0
while [ "$i" -lt 60 ]; do
  if npx prisma migrate deploy 2>/dev/null; then
    echo "Migrações aplicadas."
    break
  fi
  i=$((i + 1))
  echo "Banco ainda indisponível, tentativa $i/60..."
  sleep 2
done

npx prisma migrate deploy

exec "$@"
