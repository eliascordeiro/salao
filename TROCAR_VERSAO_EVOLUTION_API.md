# Como Trocar Versão da Evolution API no Railway

## 🔧 Problema Atual
Evolution API v2.2.3 tem bug: `TypeError: Cannot read properties of undefined (reading 'state')`

Esse erro impede criação de instâncias WhatsApp.

## ✅ Solução: Downgrade para v2.1.1

### Passos no Dashboard Railway:

1. **Abrir projeto:** https://railway.app/project/5a0746d8-8439-4897-9240-c27176bf0867

2. **Selecionar serviço `evolution-api`**

3. **Aba "Settings"** (configurações)

4. **Seção "Source"** ou "Deploy"

5. **Procurar campo "Image"** ou "Docker Image"

6. **Trocar de:**
   ```
   atendai/evolution-api:v2.2.3
   ```
   **Para:**
   ```
   atendai/evolution-api:v2.1.1
   ```

7. **Salvar** e aguardar redeploy (~2 minutos)

8. **Testar criação de instância:**
   ```bash
   curl -X POST https://evolution-api-production-f200.up.railway.app/instance/create \
     -H "apikey: bedb4e0217e8c56c614744381abfe24a569c71aba568764e3035db399901e224" \
     -H "Content-Type: application/json" \
     -d '{
       "instanceName": "salon-booking",
       "qrcode": true,
       "integration": "WHATSAPP-BAILEYS"
     }'
   ```

---

## 🎯 Versões Alternativas Estáveis

Se v2.1.1 também não funcionar, tente:

- **v2.0.9** (mais estável, menos features)
- **v1.8.0** (legacy, muito estável)
- **latest** (última versão, pode ter bugs)

---

## 📋 Variáveis de Ambiente Configuradas

Todas essas já foram setadas:

```env
# Autenticação
AUTHENTICATION_API_KEY=bedb4e0217e8c56c614744381abfe24a569c71aba568764e3035db399901e224
AUTHENTICATION_TYPE=apikey
AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES=true

# Banco de Dados
DATABASE_ENABLED=true
DATABASE_PROVIDER=postgresql
DATABASE_CONNECTION_URI=postgresql://postgres:tdQuEthDiMFKfMpIxsREwAbNJoAfOTRF@crossover.proxy.rlwy.net:35499/railway
DATABASE_SAVE_DATA_INSTANCE=false
DATABASE_SAVE_DATA_NEW_MESSAGE=false
DATABASE_SAVE_MESSAGE_UPDATE=false

# Cache (Local)
CACHE_LOCAL_ENABLED=true
CACHE_REDIS_ENABLED=false
CACHE_REDIS_URI=redis://localhost:6379
CACHE_REDIS_PREFIX_KEY=evolution
CACHE_REDIS_SAVE_INSTANCES=false

# Storage
STORE_MESSAGES=true
STORE_MESSAGE_UP=true
STORE_CONTACTS=true
STORE_CHATS=true
CLEAN_STORE_CLEANING_INTERVAL=7200
CLEAN_STORE_MESSAGES=true
CLEAN_STORE_MESSAGE_UP=true
CLEAN_STORE_CONTACTS=true
CLEAN_STORE_CHATS=true

# Provider/Storage (Desabilitados)
PROVIDER_ENABLED=false
S3_ENABLED=false
MINIO_ENABLED=false

# WebSocket/Integrações (Desabilitados)
WEBSOCKET_ENABLED=false
WEBSOCKET_GLOBAL_EVENTS=false
RABBITMQ_ENABLED=false
SQS_ENABLED=false
WEBHOOK_GLOBAL_ENABLED=false

# Geral
SERVER_PORT=8080
LOG_LEVEL=ERROR
QRCODE_LIMIT=30
CONNECTION_TIMEOUT=300
QRCODE_COLOR=#198754
LANGUAGE=pt-BR
DEL_INSTANCE=false
DEL_TEMP_INSTANCES=true
CONFIG_SESSION_PHONE_NAME=Evolution API
```

---

## 🔍 Teste Após Trocar Versão

```bash
# 1. Criar instância
curl -X POST https://evolution-api-production-f200.up.railway.app/instance/create \
  -H "apikey: bedb4e0217e8c56c614744381abfe24a569c71aba568764e3035db399901e224" \
  -H "Content-Type: application/json" \
  -d '{"instanceName":"salon-booking","qrcode":true,"integration":"WHATSAPP-BAILEYS"}'

# 2. Pegar QR Code
curl https://evolution-api-production-f200.up.railway.app/instance/qrcode/salon-booking \
  -H "apikey: bedb4e0217e8c56c614744381abfe24a569c71aba568764e3035db899901e224"

# 3. Verificar status
curl https://evolution-api-production-f200.up.railway.app/instance/connectionState/salon-booking \
  -H "apikey: bedb4e0217e8c56c614744381abfe24a569c71aba568764e3035db399901e224"
```

---

## 🚨 Se Ainda Não Funcionar

### Opção 1: Usar Evolution API Externa (Render.com)
1. Criar conta grátis no Render
2. Deploy Docker: `atendai/evolution-api:v2.1.1`
3. Adicionar PostgreSQL gratuito
4. Configurar mesmas env vars
5. Usar URL do Render no Next.js

### Opção 2: Self-hosted Local (Docker)
```bash
docker run -d \
  --name evolution-api \
  -p 8080:8080 \
  -e AUTHENTICATION_API_KEY=bedb4e0217e8c56c614744381abfe24a569c71aba568764e3035db399901e224 \
  -e DATABASE_ENABLED=false \
  -e CACHE_LOCAL_ENABLED=true \
  atendai/evolution-api:v2.1.1
```

### Opção 3: Usar Twilio WhatsApp API (Pago)
- Setup mais simples
- $0.005/mensagem
- Sem necessidade de Evolution API

---

## 📞 Próximos Passos

1. Trocar imagem para v2.1.1 no Railway Dashboard
2. Aguardar redeploy
3. Testar criação de instância
4. Se funcionar, atualizar Next.js com as variáveis
5. Conectar WhatsApp pelo painel admin

**Me avise quando trocar a versão para eu testar!** 🚀
