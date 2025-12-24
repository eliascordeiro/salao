# 🐋 Deploy Evolution API no Railway via Docker

## 📦 Imagem Docker Oficial

```
atendai/evolution-api:latest
```

Ou versão específica:
```
atendai/evolution-api:v2.1.1
```

---

## 🚀 Deploy no Railway (Docker)

### Passo 1: Criar Novo Projeto

1. Acesse: https://railway.app/
2. Clique em "New Project"
3. Selecione "Deploy from Docker Image"
4. Digite: `atendai/evolution-api:latest`

### Passo 2: Adicionar PostgreSQL

1. Clique em "+ New"
2. Selecione "Database" → "PostgreSQL"
3. Aguarde provisionar

### Passo 3: Configurar Variáveis de Ambiente

Clique em "Variables" e adicione:

```env
# ========================================
# AUTENTICAÇÃO
# ========================================
AUTHENTICATION_TYPE=apikey
AUTHENTICATION_API_KEY=B6D711FCDE4D4FD5936544120E713976
AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES=true

# ========================================
# SERVIDOR
# ========================================
SERVER_TYPE=http
SERVER_PORT=8080
SERVER_URL=https://sua-url-railway.up.railway.app
CORS_ORIGIN=*
CORS_METHODS=POST,GET,PUT,DELETE
CORS_CREDENTIALS=true

# ========================================
# DATABASE (PostgreSQL do Railway)
# ========================================
DATABASE_ENABLED=true
DATABASE_PROVIDER=postgresql
DATABASE_CONNECTION_URI=${DATABASE_URL}
DATABASE_CONNECTION_CLIENT_NAME=evolution_instances
DATABASE_SAVE_DATA_INSTANCE=true
DATABASE_SAVE_DATA_NEW_MESSAGE=true
DATABASE_SAVE_MESSAGE_UPDATE=true
DATABASE_SAVE_DATA_CONTACTS=true
DATABASE_SAVE_DATA_CHATS=true

# ========================================
# WEBHOOK GLOBAL
# ========================================
WEBHOOK_GLOBAL_ENABLED=true
WEBHOOK_GLOBAL_URL=https://salon-booking.com.br/api/webhooks/whatsapp
WEBHOOK_GLOBAL_WEBHOOK_BY_EVENTS=true

# ========================================
# EVENTOS DO WEBHOOK
# ========================================
WEBHOOK_EVENTS_APPLICATION_STARTUP=false
WEBHOOK_EVENTS_QRCODE_UPDATED=true
WEBHOOK_EVENTS_MESSAGES_SET=true
WEBHOOK_EVENTS_MESSAGES_UPSERT=true
WEBHOOK_EVENTS_MESSAGES_UPDATE=true
WEBHOOK_EVENTS_SEND_MESSAGE=true
WEBHOOK_EVENTS_CONNECTION_UPDATE=true
WEBHOOK_EVENTS_CALL=false

# ========================================
# QRCODE
# ========================================
QRCODE_LIMIT=30
QRCODE_COLOR=#198754

# ========================================
# LOGS
# ========================================
LOG_LEVEL=ERROR
LOG_COLOR=true
LOG_BAILEYS=error

# ========================================
# INSTÂNCIAS
# ========================================
DEL_INSTANCE=false
DEL_TEMP_INSTANCES=true

# ========================================
# RABBITMQ (Desabilitado)
# ========================================
RABBITMQ_ENABLED=false

# ========================================
# CACHE (Desabilitado)
# ========================================
CACHE_REDIS_ENABLED=false

# ========================================
# S3 (Desabilitado)
# ========================================
S3_ENABLED=false
```

### Passo 4: Configurar Porta

1. Clique em "Settings"
2. Em "Networking" → "Public Networking"
3. Porta: `8080` (mesma do SERVER_PORT)

### Passo 5: Generate Domain

1. Ainda em "Settings"
2. Clique em "Generate Domain"
3. Copie a URL gerada (ex: `https://evolution-api-production.up.railway.app`)
4. **IMPORTANTE:** Volte nas variáveis e atualize `SERVER_URL` com essa URL

---

## 🧪 Testar Instalação

### 1. Verificar se está online

```bash
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

### 2. Listar instâncias

```bash
curl -X GET https://sua-evolution-api.up.railway.app/instance/fetchInstances \
  -H "apikey: B6D711FCDE4D4FD5936544120E713976"
```

### 3. Criar instância

```bash
curl -X POST https://sua-evolution-api.up.railway.app/instance/create \
  -H "Content-Type: application/json" \
  -H "apikey: B6D711FCDE4D4FD5936544120E713976" \
  -d '{
    "instanceName": "salon-booking",
    "qrcode": true,
    "integration": "WHATSAPP-BAILEYS",
    "webhook": "https://salon-booking.com.br/api/webhooks/whatsapp",
    "webhookByEvents": true,
    "events": [
      "MESSAGES_UPSERT",
      "CONNECTION_UPDATE",
      "QRCODE_UPDATED"
    ]
  }'
```

### 4. Gerar QR Code

```bash
curl -X GET https://sua-evolution-api.up.railway.app/instance/connect/salon-booking \
  -H "apikey: B6D711FCDE4D4FD5936544120E713976"
```

---

## 📝 Atualizar .env do Projeto

Depois do Evolution API rodando, adicione no seu `.env`:

```env
# Evolution API
EVOLUTION_API_URL=https://sua-evolution-api.up.railway.app
EVOLUTION_API_KEY=B6D711FCDE4D4FD5936544120E713976
EVOLUTION_INSTANCE_NAME=salon-booking
```

---

## 🔧 Docker Compose (Alternativa Local)

Se quiser rodar localmente com Docker Compose:

```yaml
version: '3.8'

services:
  evolution-api:
    image: atendai/evolution-api:latest
    container_name: evolution-api
    ports:
      - "8080:8080"
    environment:
      - AUTHENTICATION_TYPE=apikey
      - AUTHENTICATION_API_KEY=B6D711FCDE4D4FD5936544120E713976
      - SERVER_PORT=8080
      - DATABASE_ENABLED=true
      - DATABASE_PROVIDER=postgresql
      - DATABASE_CONNECTION_URI=postgresql://postgres:password@postgres:5432/evolution
      - WEBHOOK_GLOBAL_ENABLED=true
      - WEBHOOK_GLOBAL_URL=http://host.docker.internal:3000/api/webhooks/whatsapp
      - LOG_LEVEL=ERROR
    depends_on:
      - postgres

  postgres:
    image: postgres:15-alpine
    container_name: evolution-postgres
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=evolution
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

Executar:
```bash
docker-compose up -d
```

---

## 🎯 Checklist

- [ ] Railway projeto criado
- [ ] Docker image `atendai/evolution-api:latest` deployada
- [ ] PostgreSQL adicionado e conectado
- [ ] Variáveis de ambiente configuradas
- [ ] Porta 8080 exposta
- [ ] Domain gerado
- [ ] `SERVER_URL` atualizado com domain
- [ ] Testado com curl (responde 200)
- [ ] Instância criada com sucesso
- [ ] QR Code gerado
- [ ] `.env` do projeto atualizado

---

## 🆘 Troubleshooting

### Erro: "Cannot connect to database"
- Verifique se `DATABASE_URL` está disponível (Railway auto-injeta)
- Confirme que PostgreSQL está rodando

### Erro: "Port already in use"
- Certifique-se de que `SERVER_PORT=8080`
- No Railway, a porta é mapeada automaticamente

### Logs não aparecem
- Acesse: Railway → Evolution API → Deployments → View Logs
- Ou use Railway CLI: `railway logs`

---

## 📞 Próximos Passos

1. Deploy no Railway
2. Me passe a URL gerada
3. Vou atualizar o diagnóstico para testar
4. Conectamos o WhatsApp!

🚀
