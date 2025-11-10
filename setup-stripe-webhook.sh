#!/bin/bash

# Script para configurar Stripe Webhook Local
# Execute este script em um terminal separado enquanto desenvolve

echo "🔐 Configurando Stripe Webhook Local..."
echo ""
echo "Este script vai:"
echo "1. Verificar se o Stripe CLI está instalado"
echo "2. Fazer login no Stripe"
echo "3. Encaminhar webhooks para http://localhost:3000/api/payments/webhook"
echo ""

# Diretório do script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
STRIPE_CLI="$SCRIPT_DIR/stripe"

# Verificar se Stripe CLI está instalado localmente
if [ ! -f "$STRIPE_CLI" ]; then
    echo "❌ Stripe CLI não encontrado."
    echo ""
    echo "📦 Baixando Stripe CLI..."
    echo ""
    
    cd "$SCRIPT_DIR"
    curl -L https://github.com/stripe/stripe-cli/releases/download/v1.19.4/stripe_1.19.4_linux_x86_64.tar.gz | tar xz
    chmod +x stripe
    
    echo ""
    echo "✅ Stripe CLI instalado com sucesso!"
    echo ""
fi

# Verificar versão
echo "📌 Versão do Stripe CLI:"
"$STRIPE_CLI" version
echo ""

# Fazer login
echo "🔑 Fazendo login no Stripe..."
echo "Uma janela do navegador será aberta para você autorizar."
echo ""
"$STRIPE_CLI" login

echo ""
echo "✅ Login realizado com sucesso!"
echo ""

# Iniciar encaminhamento de webhooks
echo "🎣 Iniciando encaminhamento de webhooks..."
echo ""
echo "⚠️  IMPORTANTE:"
echo "   1. COPIE o 'webhook signing secret' que aparecerá abaixo (começa com whsec_)"
echo "   2. Cole no arquivo .env como: STRIPE_WEBHOOK_SECRET=\"whsec_xxx...\""
echo "   3. Reinicie o servidor (npm run dev)"
echo ""
echo "🚀 Iniciando listener..."
echo ""

"$STRIPE_CLI" listen --forward-to localhost:3000/api/payments/webhook
