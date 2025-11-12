#!/bin/bash

echo "🚀 Starting production server..."

# Função para aguardar o banco de dados
wait_for_db() {
  echo "⏳ Waiting for database to be ready..."
  max_attempts=30
  attempt=1
  
  while [ $attempt -le $max_attempts ]; do
    echo "Attempt $attempt/$max_attempts..."
    
    if npx prisma db push --skip-generate 2>/dev/null; then
      echo "✅ Database is ready!"
      return 0
    fi
    
    echo "Database not ready yet, waiting 2 seconds..."
    sleep 2
    attempt=$((attempt + 1))
  done
  
  echo "❌ Could not connect to database after $max_attempts attempts"
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
