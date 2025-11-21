#!/bin/bash

# Script para migrar endereços no Railway (Produção)
# Execute via Railway CLI: railway run bash scripts/migrate-addresses-railway.sh

echo "🚀 Iniciando migração de endereços no Railway..."
echo ""

# Verifica se está no Railway (via variável de ambiente)
if [ -z "$RAILWAY_ENVIRONMENT" ]; then
  echo "⚠️  AVISO: Este script deve ser executado no Railway!"
  echo "Use: railway run bash scripts/migrate-addresses-railway.sh"
  echo ""
  read -p "Continuar mesmo assim? (s/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "❌ Cancelado."
    exit 1
  fi
fi

# Executar o script Node.js de migração
node scripts/fix-salon-addresses.js

echo ""
echo "✅ Migração concluída!"
