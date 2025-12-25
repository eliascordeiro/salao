# 🔧 REINSTALAÇÃO COMPLETA - Evolution API v2.1.1

## ❌ Problema Identificado:
- QR Code não gera nem via API, nem no Manager
- Indica que o serviço Baileys não está inicializando

## ✅ Solução: Reinstalar com variáveis mínimas essenciais

### 1. Delete o serviço atual no Railway
- Acesse: https://railway.app/project/splendid-purpose
- Clique no serviço Evolution API
- Settings → Delete Service (confirme)

### 2. Crie novo serviço do ZERO

**Clique em "+ New" → "Deploy from a Docker Image"**

**Docker Image:**
```
atendai/evolution-api:v2.1.1
```

### 3. Configure APENAS estas variáveis essenciais:

```env
# Autenticação
AUTHENTICATION_TYPE=apikey
AUTHENTICATION_API_KEY=B6D711FCDE4D4FD5936544120E713976

# Banco de Dados PostgreSQL (use o mesmo que já tem)
DATABASE_ENABLED=true
DATABASE_CONNECTION_CLIENT_NAME=postgresql
DATABASE_CONNECTION_URI=postgresql://postgres:tdQuEthDiMFKfMpIxsREwAbNJoAfOTRF@crossover.proxy.rlwy.net:35499/railway

# Cache Redis (use o do Railway)
CACHE_REDIS_ENABLED=true
CACHE_REDIS_URI=redis://default:eugbdrJOFuFeHyTYmbWvVjCFwXwaWknS@redis.railway.internal:6079

# Server
SERVER_TYPE=http
SERVER_PORT=8080
SERVER_URL=https://evolution-api-production-6c1c.up.railway.app

# Logs (importante!)
LOG_LEVEL=DEBUG
LOG_COLOR=true

# Baileys (crítico para QR Code)
CONFIG_SESSION_PHONE_CLIENT=Evolution API
CONFIG_SESSION_PHONE_NAME=Chrome
```

### 4. Aguarde deploy (3-5 minutos)

### 5. Teste se está funcionando:

```bash
# Health check
curl https://evolution-api-production-6c1c.up.railway.app/

# Criar instância
curl -X POST https://evolution-api-production-6c1c.up.railway.app/instance/create \
  -H "apikey: B6D711FCDE4D4FD5936544120E713976" \
  -H "Content-Type: application/json" \
  -d '{
    "instanceName": "salon-booking",
    "qrcode": true,
    "integration": "WHATSAPP-BAILEYS"
  }'

# QR Code
curl -X GET https://evolution-api-production-6c1c.up.railway.app/instance/connect/salon-booking \
  -H "apikey: B6D711FCDE4D4FD5936544120E713976"
```

### 6. Acesse o Manager:
```
https://evolution-api-production-6c1c.up.railway.app/manager
```

---

## 🔍 Se ainda não funcionar:

O problema pode ser:
1. **Redis URL incorreto** - Verifique a porta (6079 ou 6379?)
2. **PostgreSQL latência** - Pode precisar de um mais próximo
3. **Railway limitando recursos** - Precisa upgrade do plano

## 💡 Alternativa RÁPIDA:

Usar **Render.com** (grátis) ou **Heroku** no lugar do Railway.
Quer que eu te ajude a migrar?
