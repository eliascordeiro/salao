#!/bin/bash

# ============================================
# CONFIGURAÇÃO MANUAL DO STRIPE WEBHOOK
# ============================================

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  🎯 CONFIGURAÇÃO DO STRIPE WEBHOOK (Desenvolvimento Local)    ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Diretório do script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
STRIPE_CLI="$SCRIPT_DIR/stripe"

# Verificar se o binário existe
if [ ! -f "$STRIPE_CLI" ]; then
    echo "❌ Stripe CLI não encontrado em: $STRIPE_CLI"
    echo ""
    echo "📦 Baixando Stripe CLI..."
    cd "$SCRIPT_DIR"
    curl -L https://github.com/stripe/stripe-cli/releases/download/v1.19.4/stripe_1.19.4_linux_x86_64.tar.gz | tar xz
    chmod +x stripe
    echo "✅ Download concluído!"
    echo ""
fi

echo "📌 Versão instalada:"
"$STRIPE_CLI" version
echo ""

echo "┌────────────────────────────────────────────────────────────────┐"
echo "│  PASSO 1: FAZER LOGIN NO STRIPE                               │"
echo "└────────────────────────────────────────────────────────────────┘"
echo ""
echo "Vou gerar um código de pareamento para você."
echo "COPIE o código e COLE no navegador quando solicitado."
echo ""
read -p "Pressione ENTER para continuar..."
echo ""

"$STRIPE_CLI" login

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Erro ao fazer login."
    echo ""
    echo "💡 Tente fazer login manualmente:"
    echo "   1. Abra: https://dashboard.stripe.com/stripecli/confirm_auth"
    echo "   2. Execute: ./stripe login"
    echo "   3. Cole o código de pareamento"
    echo ""
    exit 1
fi

echo ""
echo "✅ Login realizado com sucesso!"
echo ""

echo "┌────────────────────────────────────────────────────────────────┐"
echo "│  PASSO 2: INICIAR LISTENER DE WEBHOOKS                        │"
echo "└────────────────────────────────────────────────────────────────┘"
echo ""
echo "⚠️  ATENÇÃO - IMPORTANTE!"
echo ""
echo "Quando o listener iniciar, você verá uma linha como:"
echo "  ✔ Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx"
echo ""
echo "👉 COPIE o código que começa com 'whsec_'"
echo "👉 COLE no arquivo .env:"
echo "   STRIPE_WEBHOOK_SECRET=\"whsec_xxxxxxxxxxxxx\""
echo ""
echo "👉 REINICIE o servidor (npm run dev) para aplicar"
echo ""
read -p "Pressione ENTER para iniciar o listener..."
echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  🚀 WEBHOOK LISTENER ATIVO                                     ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

"$STRIPE_CLI" listen --forward-to localhost:3000/api/payments/webhook
