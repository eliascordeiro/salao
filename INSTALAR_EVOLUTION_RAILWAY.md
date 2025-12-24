# 🚀 Instalar Evolution API no Railway - Guia Completo

## 📋 Pré-requisitos
- Conta no Railway (https://railway.app)
- Conta no GitHub (para fork do repositório)

---

## 🎯 Método 1: Deploy com 1 Clique (RECOMENDADO)

### Passo 1: Deploy Automático

Clique no botão abaixo para fazer deploy automático no Railway:

**Template Oficial Evolution API:**
```
https://railway.app/template/QXWbolZ
```

OU use este link direto:
```
https://railway.app/new/template/evolution-api
```

### Passo 2: Configurar Variáveis

O Railway vai pedir algumas variáveis. Use estas:

```env
# API Key Global (crie uma senha forte)
AUTHENTICATION_API_KEY=salon_evolution_$(openssl rand -hex 16)

# Tipo de autenticação
AUTHENTICATION_TYPE=apikey

# Configurações de Database (PostgreSQL do Railway)
DATABASE_ENABLED=true
DATABASE_CONNECTION_CLIENT_NAME=evolution_db
DATABASE_SAVE_DATA_INSTANCE=true
DATABASE_SAVE_DATA_NEW_MESSAGE=true
DATABASE_SAVE_MESSAGE_UPDATE=true
DATABASE_SAVE_DATA_CONTACTS=true
DATABASE_SAVE_DATA_CHATS=true

# Webhook Global
WEBHOOK_GLOBAL_ENABLED=true
WEBHOOK_GLOBAL_URL=https://salon-booking.com.br/api/webhooks/whatsapp
WEBHOOK_GLOBAL_WEBHOOK_BY_EVENTS=true

# Eventos do Webhook
WEBHOOK_EVENTS_APPLICATION_STARTUP=false
WEBHOOK_EVENTS_QRCODE_UPDATED=true
WEBHOOK_EVENTS_MESSAGES_SET=true
WEBHOOK_EVENTS_MESSAGES_UPSERT=true
WEBHOOK_EVENTS_MESSAGES_UPDATE=true
WEBHOOK_EVENTS_MESSAGES_DELETE=false
WEBHOOK_EVENTS_SEND_MESSAGE=true
WEBHOOK_EVENTS_CONTACTS_SET=false
WEBHOOK_EVENTS_CONTACTS_UPSERT=false
WEBHOOK_EVENTS_CONTACTS_UPDATE=false
WEBHOOK_EVENTS_PRESENCE_UPDATE=false
WEBHOOK_EVENTS_CHATS_SET=false
WEBHOOK_EVENTS_CHATS_UPSERT=false
WEBHOOK_EVENTS_CHATS_UPDATE=false
WEBHOOK_EVENTS_CHATS_DELETE=false
WEBHOOK_EVENTS_GROUPS_UPSERT=false
WEBHOOK_EVENTS_GROUPS_UPDATE=false
WEBHOOK_EVENTS_GROUP_PARTICIPANTS_UPDATE=false
WEBHOOK_EVENTS_CONNECTION_UPDATE=true
WEBHOOK_EVENTS_CALL=false
WEBHOOK_EVENTS_NEW_JWT_TOKEN=false

# QR Code
QRCODE_LIMIT=30
QRCODE_COLOR=#198754

# Logs
LOG_LEVEL=ERROR
LOG_COLOR=true
LOG_BAILEYS=error

# Configurações adicionais
DEL_INSTANCE=false
```

### Passo 3: Aguardar Deploy

- O Railway vai provisionar PostgreSQL automaticamente
- Aguarde 2-3 minutos para o deploy completar
- Quando ficar verde ✅, está pronto!

### Passo 4: Obter URL e API Key

Após o deploy:

1. **Copie a URL do serviço:**
   - No Railway, clique no serviço Evolution API
   - Clique em "Settings" → "Generate Domain"
   - Copie a URL (ex: `https://evolution-api-production.up.railway.app`)

2. **Copie a API Key:**
   - Vá em "Variables"
   - Copie o valor de `AUTHENTICATION_API_KEY`

---

## 🎯 Método 2: Deploy Manual via GitHub

### Passo 1: Fork do Repositório

```bash
# No seu terminal
git clone https://github.com/EvolutionAPI/evolution-api.git
cd evolution-api
```

### Passo 2: Criar Novo Projeto no Railway

```bash
# Instalar Railway CLI
npm i -g @railway/cli

# Login
railway login

# Criar projeto
railway init

# Link ao repositório
railway link
```

### Passo 3: Adicionar PostgreSQL

No Railway Dashboard:
1. Clique em "+ New"
2. Selecione "Database" → "PostgreSQL"
3. Aguarde provisionar

### Passo 4: Configurar Variáveis

```bash
# Gerar API Key segura
openssl rand -hex 32

# Adicionar variáveis (substitua YOUR_API_KEY pela gerada acima)
railway variables set AUTHENTICATION_API_KEY=YOUR_API_KEY
railway variables set AUTHENTICATION_TYPE=apikey
railway variables set DATABASE_ENABLED=true
railway variables set WEBHOOK_GLOBAL_ENABLED=true
railway variables set WEBHOOK_GLOBAL_URL=https://salon-booking.com.br/api/webhooks/whatsapp
railway variables set LOG_LEVEL=ERROR
railway variables set QRCODE_LIMIT=30
```

### Passo 5: Deploy

```bash
railway up
```

---

## 🧪 Testar Instalação

### 1. Verificar se está online

```bash
# Substitua pela sua URL do Railway
curl https://sua-evolution-api.up.railway.app/
```

**Resposta esperada:**
```json
{
  "status": 200,
  "message": "Welcome to the Evolution API, it is working!",
  "version": "2.1.1"
}
```

### 2. Testar API Key

```bash
# Substitua YOUR_API_KEY e YOUR_URL
curl -X GET https://sua-evolution-api.up.railway.app/instance/fetchInstances \
  -H "apikey: YOUR_API_KEY"
```

**Resposta esperada:**
```json
[]
```
(Lista vazia é OK - significa que não há instâncias ainda)

### 3. Criar Primeira Instância

```bash
curl -X POST https://sua-evolution-api.up.railway.app/instance/create \
  -H "Content-Type: application/json" \
  -H "apikey: YOUR_API_KEY" \
  -d '{
    "instanceName": "salon-booking",
    "webhook": "https://salon-booking.com.br/api/webhooks/whatsapp",
    "webhookByEvents": true,
    "events": ["MESSAGES_UPSERT", "CONNECTION_UPDATE"]
  }'
```

### 4. Gerar QR Code

```bash
curl -X GET https://sua-evolution-api.up.railway.app/instance/connect/salon-booking \
  -H "apikey: YOUR_API_KEY"
```

---

## 📝 Configurar no Seu App (salon-booking)

Depois do Evolution API instalado, configure as variáveis no seu app:

### No Railway (salon-booking):

```env
EVOLUTION_API_URL=https://sua-evolution-api.up.railway.app
EVOLUTION_API_KEY=sua_api_key_aqui
EVOLUTION_INSTANCE_NAME=salon-booking
```

### No .env local:

```bash
# Adicione ao .env
echo "EVOLUTION_API_URL=https://sua-evolution-api.up.railway.app" >> .env
echo "EVOLUTION_API_KEY=sua_api_key_aqui" >> .env
echo "EVOLUTION_INSTANCE_NAME=salon-booking" >> .env
```

---

## 🔧 Configurações Importantes

### Webhook do Seu App

Certifique-se de que a rota de webhook está funcionando:

```typescript
// app/api/webhooks/whatsapp/route.ts deve existir
// Teste local:
curl -X POST http://localhost:3000/api/webhooks/whatsapp \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

### PostgreSQL Connection String

O Railway auto-conecta o PostgreSQL. Mas se precisar manual:

```env
DATABASE_CONNECTION_URI=postgresql://user:password@host:port/database
```

---

## 🆘 Troubleshooting

### Erro: "Unauthorized"
- Verifique se `AUTHENTICATION_API_KEY` está igual nos dois lugares
- Header deve ser `apikey` (minúsculo)

### Erro: "Instance not found"
- Execute o curl de criar instância (passo 3 do teste)
- Aguarde alguns segundos

### QR Code não aparece
- Verifique logs: `railway logs --service evolution-api`
- Confirme que `QRCODE_LIMIT=30` está configurado

### Webhook não recebe mensagens
- Teste a rota: `curl https://salon-booking.com.br/api/webhooks/whatsapp`
- Verifique se `WEBHOOK_GLOBAL_URL` está correto
- Veja logs do Railway

---

## ✅ Checklist Final

- [ ] Evolution API deployado no Railway
- [ ] PostgreSQL conectado
- [ ] API Key configurada
- [ ] URL pública gerada (Generate Domain)
- [ ] Testado com curl (responde 200)
- [ ] Instância "salon-booking" criada
- [ ] Variáveis no app salon-booking configuradas
- [ ] Webhook testado e funcionando
- [ ] QR Code gerado com sucesso

---

## 🎯 Próximos Passos

1. ✅ Deploy Evolution API no Railway
2. ✅ Copiar URL e API Key
3. ✅ Configurar variáveis no app salon-booking
4. ✅ Testar localmente (`npm run dev`)
5. ✅ Deploy do salon-booking no Railway
6. ✅ Escanear QR Code
7. ✅ Enviar mensagem de teste

---

## 📞 Me avise quando:

1. ❓ Evolution API estiver deployado (me passe a URL)
2. ❓ Tiver a API Key
3. ❓ Quiser testar a integração

Então eu atualizo o código do seu app! 🚀
