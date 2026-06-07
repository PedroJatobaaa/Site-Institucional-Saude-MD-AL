#!/bin/sh
set -e

echo "Aguardando o PostgreSQL..."
i=0
while [ "$i" -lt 60 ]; do
  if npx prisma migrate deploy; then
    echo "Migrações aplicadas."
    exec "$@"
  fi
  i=$((i + 1))
  echo "Falha nas migrações, tentativa $i/60..."
  sleep 2
done

echo "ERRO: não foi possível aplicar migrações após 60 tentativas."
exit 1
