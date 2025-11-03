#!/bin/bash
set -e

echo "🔍 Verificando conexão com o banco de dados..."

# Tenta conectar ao banco até 30 vezes (30 segundos)
max_attempts=30
attempt=0

until npx prisma db execute --stdin <<< "SELECT 1;" 2>/dev/null || [ $attempt -eq $max_attempts ]; do
  attempt=$((attempt + 1))
  echo "⏳ Aguardando banco de dados... (tentativa $attempt/$max_attempts)"
  sleep 1
done

if [ $attempt -eq $max_attempts ]; then
  echo "❌ Erro: Não foi possível conectar ao banco de dados após $max_attempts tentativas"
  echo "📋 Verifique se:"
  echo "   1. O serviço PostgreSQL está rodando no Railway"
  echo "   2. A variável DATABASE_URL está configurada corretamente"
  echo "   3. Os serviços estão no mesmo projeto"
  exit 1
fi

echo "✅ Conexão com banco estabelecida!"
echo "🔄 Executando migrations..."

npx prisma migrate deploy

echo "✅ Migrations aplicadas com sucesso!"
echo "🚀 Iniciando aplicação..."

npm start
