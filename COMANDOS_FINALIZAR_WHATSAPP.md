# ✅ Evolution API Funcionando!

## 🎉 Status Atual
- ✅ PostgreSQL separado criado no Railway
- ✅ Evolution API v2.2.3 rodando sem erros
- ✅ Migrações Prisma aplicadas com sucesso
- ✅ Endpoint testado e respondendo: `[]`
- ✅ URL: https://evolution-api-production-f200.up.railway.app
- ✅ API Key: `bedb4e0217e8c56c614744381abfe24a569c71aba568764e3035db399901e224`

---

## 📋 Próximo Passo: Atualizar Next.js

### Opção 1: Via Dashboard Railway (RECOMENDADO)
1. Acesse: https://railway.app/project/5a0746d8-8439-4897-9240-c27176bf0867
2. Clique no serviço **"salao"** (Next.js)
3. Aba **"Variables"**
4. Clique **"+ New Variable"** e adicione:

```
EVOLUTION_API_URL=https://evolution-api-production-f200.up.railway.app
EVOLUTION_API_KEY=bedb4e0217e8c56c614744381abfe24a569c71aba568764e3035db399901e224
EVOLUTION_INSTANCE_NAME=salon-booking
```

5. Railway vai fazer redeploy automático do Next.js (~2 minutos)

---

### Opção 2: Via Railway CLI

```bash
# 1. Religar ao projeto e selecionar serviço 'salao'
railway link --environment production
# Escolher:
# - Workspace: Elias Cordeiro's Projects
# - Project: splendid-purpose
# - Environment: production
# - Service: salao (ou o nome do serviço Next.js)

# 2. Configurar variáveis
railway variables --set EVOLUTION_API_URL="https://evolution-api-production-f200.up.railway.app"
railway variables --set EVOLUTION_API_KEY="bedb4e0217e8c56c614744381abfe24a569c71aba568764e3035db399901e224"
railway variables --set EVOLUTION_INSTANCE_NAME="salon-booking"

# 3. Aguardar redeploy
sleep 120

# 4. Testar
curl https://salao-blza.up.railway.app/api/whatsapp/status
```

---

## ✅ Testar Integração WhatsApp

Depois que o Next.js redeploy:

1. Acesse: https://salao-blza.up.railway.app/dashboard/configuracoes/whatsapp
2. Clique em **"Conectar WhatsApp"**
3. Aguarde QR Code aparecer
4. Escaneie com WhatsApp (celular)
5. Pronto! ✅

---

## 🔧 Credenciais Finais

```env
# Evolution API
EVOLUTION_API_URL=https://evolution-api-production-f200.up.railway.app
EVOLUTION_API_KEY=bedb4e0217e8c56c614744381abfe24a569c71aba568764e3035db399901e224
EVOLUTION_INSTANCE_NAME=salon-booking

# PostgreSQL Evolution API (separado)
DATABASE_URL=postgresql://postgres:tdQuEthDiMFKfMpIxsREwAbNJoAfOTRF@crossover.proxy.rlwy.net:35499/railway
```

---

## 🎯 Resumo da Solução

### Problema:
- Evolution API não iniciava porque tentava rodar migrações no PostgreSQL do Next.js
- MongoDB não é suportado pela Evolution API v2.2.3

### Solução:
- ✅ Criado PostgreSQL **separado** exclusivo para Evolution API
- ✅ Configurado DATABASE_CONNECTION_URI com novo banco
- ✅ Desabilitado Redis (usar cache local)
- ✅ Migrações rodaram sem conflitos
- ✅ API rodando na porta 8080

### Custo:
- PostgreSQL extra: ~$5/mês no Railway
- Worth it para estabilidade em produção

---

## 📞 Teste de Endpoint

```bash
# Listar instâncias (deve retornar [])
curl https://evolution-api-production-f200.up.railway.app/instance/fetchInstances \
  -H "apikey: bedb4e0217e8c56c614744381abfe24a569c71aba568764e3035db399901e224"

# Criar instância
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

## 🚀 Próximas Etapas

1. ✅ Evolution API funcionando
2. ⏳ Atualizar variáveis do Next.js (via dashboard)
3. ⏳ Testar conexão WhatsApp pelo painel admin
4. ✅ Sistema completo!
