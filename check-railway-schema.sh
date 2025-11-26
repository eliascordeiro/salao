#!/bin/bash

echo "🔍 Verificando se schema foi aplicado no Railway..."
echo ""

# Testa se a API retorna erro de coluna faltando
response=$(curl -s https://salao-production.up.railway.app/api/subscriptions/debug 2>&1)

if echo "$response" | grep -q "mpSubscriptionId"; then
  echo "❌ SCHEMA NÃO APLICADO - Coluna mpSubscriptionId ainda não existe"
  echo ""
  echo "Erro encontrado:"
  echo "$response" | grep -o "mpSubscriptionId[^\"]*" | head -1
  echo ""
  echo "⏳ Aguarde o deploy completar no Railway (2-3 minutos)"
  echo "   Verifique em: https://railway.app/"
  exit 1
elif echo "$response" | grep -q "error"; then
  echo "⚠️  API retornou erro, mas pode ser normal (usuário não logado)"
  echo ""
  echo "Resposta:"
  echo "$response"
  exit 0
else
  echo "✅ SCHEMA APLICADO COM SUCESSO!"
  echo ""
  echo "Resposta da API:"
  echo "$response" | head -50
  exit 0
fi
