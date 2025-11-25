#!/bin/bash

echo "🚀 Starting production server..."

# Mostrar variáveis de ambiente (sem valores sensíveis)
echo "📋 Checking environment..."
echo "DATABASE_URL: ${DATABASE_URL:0:20}... (${#DATABASE_URL} chars)"
echo "NEXTAUTH_URL: $NEXTAUTH_URL"

# Função para aguardar o banco de dados
wait_for_db() {
  echo "⏳ Waiting for database to be ready..."
  max_attempts=60  # Aumentado de 30 para 60 (2 minutos total)
  attempt=1
  
  while [ $attempt -le $max_attempts ]; do
    echo "Attempt $attempt/$max_attempts..."
    
    # Tentar conectar com Prisma
    if npx prisma db push --skip-generate 2>&1 | tee /tmp/db-check.log; then
      echo "✅ Database is ready!"
      return 0
    fi
    
    # Mostrar erro se for crítico
    if grep -q "P1001\|P1002\|P1003" /tmp/db-check.log; then
      echo "⚠️  Database connection error detected"
      cat /tmp/db-check.log | grep "Error:"
    fi
    
    echo "Database not ready yet, waiting 2 seconds..."
    sleep 2
    attempt=$((attempt + 1))
  done
  
  echo "❌ Could not connect to database after $max_attempts attempts"
  echo "Last error:"
  cat /tmp/db-check.log
  return 1
}

# Aguardar banco estar pronto
if wait_for_db; then
  echo "🔄 Running migrations..."
  npx prisma migrate deploy
  
  echo "🌱 Seeding database (if needed)..."
  npm run db:seed || echo "⚠️  Seed failed or already populated"
  
  echo "✅ Starting Next.js server..."
  exec next start
else
  echo "❌ Failed to start: Database connection timeout"
  exit 1
fi
