#!/bin/bash

echo "🚀 Starting production server..."

# Mostrar variáveis de ambiente (sem valores sensíveis)
echo "📋 Checking environment..."
echo "DATABASE_URL: ${DATABASE_URL:0:20}... (${#DATABASE_URL} chars)"
echo "NEXTAUTH_URL: $NEXTAUTH_URL"

# Função para aguardar o banco de dados
wait_for_db() {
  echo "⏳ Waiting for database to be ready..."
  max_attempts=30  # Reduzido para 30 (1 minuto) para falhar mais rápido
  attempt=1
  
  while [ $attempt -le $max_attempts ]; do
    echo "Attempt $attempt/$max_attempts..."
    
    # Tentar conectar com Prisma (timeout de 5s)
    if timeout 5 npx prisma db push --skip-generate 2>&1 | tee /tmp/db-check.log; then
      echo "✅ Database is ready!"
      return 0
    fi
    
    # Mostrar erro se for crítico
    if grep -q "P1001\|P1002\|P1003\|Can't reach" /tmp/db-check.log; then
      echo "⚠️  DATABASE CONNECTION FAILED!"
      echo "📋 Error details:"
      cat /tmp/db-check.log | tail -10
      echo ""
      echo "💡 Verifique se DATABASE_URL está correta no Railway!"
    fi
    
    echo "Waiting 2 seconds before retry..."
    sleep 2
    attempt=$((attempt + 1))
  done
  
  echo ""
  echo "❌ FAILED: Could not connect to database after $max_attempts attempts (1 minute)"
  echo "📋 Last error:"
  cat /tmp/db-check.log | tail -20
  echo ""
  echo "🔍 TROUBLESHOOTING:"
  echo "  1. Check if DATABASE_URL is set correctly in Railway Variables"
  echo "  2. Use: \${{Postgres.DATABASE_PRIVATE_URL}} or \${{Postgres.DATABASE_URL}}"
  echo "  3. Make sure PostgreSQL service is running"
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
