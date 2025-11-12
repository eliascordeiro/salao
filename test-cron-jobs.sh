#!/bin/bash

# Script de Teste para Cron Jobs do Sistema de Contas a Pagar
# Execute: ./test-cron-jobs.sh

echo "🔍 Testando Cron Jobs do Sistema de Contas a Pagar..."
echo ""

# Carregar variáveis do .env
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
else
  echo "❌ Arquivo .env não encontrado!"
  exit 1
fi

# Verificar se CRON_SECRET está configurado
if [ -z "$CRON_SECRET" ]; then
  echo "❌ CRON_SECRET não está configurado no .env"
  exit 1
fi

echo "✅ CRON_SECRET encontrado: ${CRON_SECRET:0:10}..."
echo ""

BASE_URL="http://localhost:3000"

# ==========================================
# 1. Testar API de Despesas Atrasadas (GET)
# ==========================================
echo "📋 1. Consultando despesas atrasadas (GET)..."
curl -s "${BASE_URL}/api/expenses/check-overdue" | jq '.'
echo ""
echo ""

# ==========================================
# 2. Atualizar Despesas Atrasadas (POST)
# ==========================================
echo "🔄 2. Atualizando status de despesas atrasadas (POST)..."
curl -s -X POST "${BASE_URL}/api/expenses/check-overdue" \
  -H "Authorization: Bearer ${CRON_SECRET}" \
  -H "Content-Type: application/json" | jq '.'
echo ""
echo ""

# ==========================================
# 3. Preview de Despesas Recorrentes (GET)
# ==========================================
echo "📋 3. Preview de despesas recorrentes a serem geradas (GET)..."
curl -s "${BASE_URL}/api/expenses/generate-recurring" | jq '.'
echo ""
echo ""

# ==========================================
# 4. Gerar Despesas Recorrentes (POST)
# ==========================================
echo "✨ 4. Gerando despesas recorrentes (POST)..."
curl -s -X POST "${BASE_URL}/api/expenses/generate-recurring" \
  -H "Authorization: Bearer ${CRON_SECRET}" \
  -H "Content-Type: application/json" | jq '.'
echo ""
echo ""

echo "✅ Testes concluídos!"
echo ""
echo "💡 Dicas:"
echo "  - Se não tiver 'jq' instalado: sudo apt install jq"
echo "  - Para ver saída sem formatação, remova '| jq .'"
echo "  - Certifique-se que o servidor está rodando em ${BASE_URL}"
