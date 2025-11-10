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

# Verificar se Stripe CLI está instalado
if ! command -v stripe &> /dev/null
then
    echo "❌ Stripe CLI não está instalado."
    echo ""
    echo "📦 Instalando Stripe CLI..."
    echo ""
    
    # Instalar Stripe CLI no Linux/WSL
    curl -s https://packages.stripe.com/api/security/keypair/stripe-cli-gpg/public | gpg --dearmor | sudo tee /usr/share/keyrings/stripe.gpg > /dev/null
    echo "deb [signed-by=/usr/share/keyrings/stripe.gpg] https://packages.stripe.com/stripe-cli-debian-local stable main" | sudo tee -a /etc/apt/sources.list.d/stripe.list
    sudo apt update
    sudo apt install -y stripe
    
    echo "✅ Stripe CLI instalado com sucesso!"
    echo ""
fi

# Verificar versão
echo "📌 Versão do Stripe CLI:"
stripe --version
echo ""

# Fazer login
echo "🔑 Fazendo login no Stripe..."
echo "Uma janela do navegador será aberta para você autorizar."
echo ""
stripe login

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

stripe listen --forward-to localhost:3000/api/payments/webhook
