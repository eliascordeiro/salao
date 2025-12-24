#!/bin/bash

echo "🚀 Configurando Evolution API no Railway via CLI"
echo ""

# Verificar se Railway CLI está instalado
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI não encontrado!"
    echo "📦 Instalando Railway CLI..."
    npm install -g @railway/cli
fi

echo "🔐 Fazendo login no Railway..."
railway login

echo ""
echo "🔗 Linkando ao projeto Evolution API..."
echo "💡 Selecione o projeto do Evolution API quando aparecer a lista"
railway link

echo ""
echo "⚙️ Configurando variáveis de ambiente..."

# Autenticação
railway variables set AUTHENTICATION_TYPE=apikey
railway variables set AUTHENTICATION_API_KEY=B6D711FCDE4D4FD5936544120E713976
railway variables set AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES=true

# Servidor
railway variables set SERVER_TYPE=http
railway variables set SERVER_PORT=8080
railway variables set CORS_ORIGIN="*"
railway variables set CORS_METHODS="POST,GET,PUT,DELETE"
railway variables set CORS_CREDENTIALS=true

# Database (CORRIGIDO)
railway variables set DATABASE_ENABLED=true
railway variables set DATABASE_CONNECTION_CLIENT_NAME=postgresql
railway variables set DATABASE_SAVE_DATA_INSTANCE=true
railway variables set DATABASE_SAVE_DATA_NEW_MESSAGE=true
railway variables set DATABASE_SAVE_MESSAGE_UPDATE=true
railway variables set DATABASE_SAVE_DATA_CONTACTS=true
railway variables set DATABASE_SAVE_DATA_CHATS=true

# Webhook
railway variables set WEBHOOK_GLOBAL_ENABLED=true
railway variables set WEBHOOK_GLOBAL_URL=https://salon-booking.com.br/api/webhooks/whatsapp
railway variables set WEBHOOK_GLOBAL_WEBHOOK_BY_EVENTS=true

# Eventos
railway variables set WEBHOOK_EVENTS_APPLICATION_STARTUP=false
railway variables set WEBHOOK_EVENTS_QRCODE_UPDATED=true
railway variables set WEBHOOK_EVENTS_MESSAGES_SET=true
railway variables set WEBHOOK_EVENTS_MESSAGES_UPSERT=true
railway variables set WEBHOOK_EVENTS_MESSAGES_UPDATE=true
railway variables set WEBHOOK_EVENTS_SEND_MESSAGE=true
railway variables set WEBHOOK_EVENTS_CONNECTION_UPDATE=true
railway variables set WEBHOOK_EVENTS_CALL=false
railway variables set WEBHOOK_EVENTS_GROUPS_UPSERT=false
railway variables set WEBHOOK_EVENTS_GROUPS_UPDATE=false
railway variables set WEBHOOK_EVENTS_GROUP_PARTICIPANTS_UPDATE=false
railway variables set WEBHOOK_EVENTS_CONTACTS_SET=false
railway variables set WEBHOOK_EVENTS_CONTACTS_UPSERT=false
railway variables set WEBHOOK_EVENTS_CONTACTS_UPDATE=false
railway variables set WEBHOOK_EVENTS_PRESENCE_UPDATE=false
railway variables set WEBHOOK_EVENTS_CHATS_SET=false
railway variables set WEBHOOK_EVENTS_CHATS_UPSERT=false
railway variables set WEBHOOK_EVENTS_CHATS_UPDATE=false
railway variables set WEBHOOK_EVENTS_CHATS_DELETE=false
railway variables set WEBHOOK_EVENTS_MESSAGES_DELETE=false
railway variables set WEBHOOK_EVENTS_NEW_JWT_TOKEN=false

# QR Code
railway variables set QRCODE_LIMIT=30
railway variables set QRCODE_COLOR="#198754"

# Logs
railway variables set LOG_LEVEL=ERROR
railway variables set LOG_COLOR=true
railway variables set LOG_BAILEYS=error

# Instâncias
railway variables set DEL_INSTANCE=false
railway variables set DEL_TEMP_INSTANCES=true

# Serviços desabilitados
railway variables set RABBITMQ_ENABLED=false
railway variables set CACHE_REDIS_ENABLED=false
railway variables set S3_ENABLED=false

echo ""
echo "✅ Variáveis configuradas com sucesso!"
echo ""
echo "📋 Verificando variáveis..."
railway variables

echo ""
echo "🌐 Obtendo URL do serviço..."
RAILWAY_URL=$(railway domain 2>/dev/null)

if [ -n "$RAILWAY_URL" ]; then
    echo "✅ URL encontrada: $RAILWAY_URL"
    echo ""
    echo "⚙️ Atualizando SERVER_URL..."
    railway variables set SERVER_URL="https://$RAILWAY_URL"
else
    echo "⚠️ URL não encontrada. Configure manualmente:"
    echo "1. Gere um domain em: Settings → Generate Domain"
    echo "2. Execute: railway variables set SERVER_URL=https://sua-url.up.railway.app"
fi

echo ""
echo "🎉 Configuração completa!"
echo ""
echo "🔍 Próximos passos:"
echo "1. Aguarde o redeploy automático (1-2 min)"
echo "2. Verifique os logs: railway logs"
echo "3. Teste a API: curl https://$RAILWAY_URL/"
echo ""
