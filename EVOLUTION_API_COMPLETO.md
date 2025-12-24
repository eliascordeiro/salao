# 🚀 Evolution API - Configuração Completa com Evolution Manager

## 📋 Variáveis Necessárias

### 1. Variáveis Básicas (Obrigatórias)
```env
# URL da sua instância Evolution API
EVOLUTION_API_URL=https://evolution-api-production-d187.up.railway.app

# API Key global (definida no Evolution Manager)
EVOLUTION_API_KEY=sua_api_key_aqui

# Nome da instância/conexão
EVOLUTION_INSTANCE_NAME=salon-booking
```

### 2. Variáveis do Evolution Manager (Importantes)

```env
# Configurações do Evolution Manager
AUTHENTICATION_API_KEY=sua_global_api_key

# Tipo de autenticação (apikey ou jwt)
AUTHENTICATION_TYPE=apikey

# Webhook para receber eventos
WEBHOOK_URL=https://salon-booking.com.br/api/webhooks/whatsapp

# Webhook global (opcional)
WEBHOOK_GLOBAL_ENABLED=true
WEBHOOK_GLOBAL_URL=https://salon-booking.com.br/api/webhooks/whatsapp

# Configurações de webhook por evento
WEBHOOK_EVENTS_MESSAGES_UPSERT=true
WEBHOOK_EVENTS_MESSAGES_UPDATE=true
WEBHOOK_EVENTS_CONNECTION_UPDATE=true
WEBHOOK_EVENTS_CALL=false
WEBHOOK_EVENTS_GROUPS_UPSERT=false

# Configurações adicionais
QRCODE_LIMIT=30
QRCODE_COLOR=#198754

# Provedor de armazenamento
PROVIDER_ENABLED=false
PROVIDER_HOST=127.0.0.1
PROVIDER_PORT=5656
PROVIDER_PREFIX=evolution
```

---

## 🔧 Configuração no Railway (Passo a Passo)

### Opção A: Deploy Evolution API próprio no Railway

1. **Criar novo serviço no Railway:**
   ```bash
   railway login
   railway init
   ```

2. **Deploy Evolution API oficial:**
   ```bash
   # Clonar repositório oficial
   git clone https://github.com/EvolutionAPI/evolution-api.git
   cd evolution-api
   
   # Deploy no Railway
   railway up
   ```

3. **Configurar variáveis no Railway (Evolution API):**
   ```env
   AUTHENTICATION_API_KEY=evolution_salon_2024_xK9pL2mQ7wR
   AUTHENTICATION_TYPE=apikey
   DATABASE_ENABLED=true
   DATABASE_CONNECTION_URI=seu_postgresql_url
   DATABASE_CONNECTION_DB_PREFIX_NAME=evolution
   WEBHOOK_GLOBAL_ENABLED=true
   WEBHOOK_GLOBAL_URL=https://salon-booking.com.br/api/webhooks/whatsapp
   ```

### Opção B: Usar Evolution API existente (mais rápido)

Se você já tem uma instância Evolution API rodando:

1. **Obter URL e API Key da instância Evolution:**
   - Acesse seu Evolution Manager
   - Copie a URL (ex: `https://evolution-api-production-d187.up.railway.app`)
   - Copie a Global API Key

2. **Configurar no seu projeto (salon-booking):**

   Adicione no Railway (Variables):
   ```env
   EVOLUTION_API_URL=https://evolution-api-production-d187.up.railway.app
   EVOLUTION_API_KEY=evolution_salon_2024_xK9pL2mQ7wR
   EVOLUTION_INSTANCE_NAME=salon-booking
   WEBHOOK_URL=https://salon-booking.com.br/api/webhooks/whatsapp
   ```

---

## 🧪 Testar Configuração

### 1. Verificar se Evolution API está online:

```bash
curl -X GET https://evolution-api-production-d187.up.railway.app/instance/fetchInstances \
  -H "apikey: evolution_salon_2024_xK9pL2mQ7wR"
```

**Resposta esperada:**
```json
[
  {
    "instance": {
      "instanceName": "salon-booking",
      "status": "open"
    }
  }
]
```

### 2. Criar instância (se não existir):

```bash
curl -X POST https://evolution-api-production-d187.up.railway.app/instance/create \
  -H "Content-Type: application/json" \
  -H "apikey: evolution_salon_2024_xK9pL2mQ7wR" \
  -d '{
    "instanceName": "salon-booking",
    "webhook": "https://salon-booking.com.br/api/webhooks/whatsapp",
    "webhookByEvents": true,
    "events": [
      "MESSAGES_UPSERT",
      "CONNECTION_UPDATE"
    ]
  }'
```

### 3. Gerar QR Code:

```bash
curl -X GET https://evolution-api-production-d187.up.railway.app/instance/connect/salon-booking \
  -H "apikey: evolution_salon_2024_xK9pL2mQ7wR"
```

**Resposta esperada:**
```json
{
  "code": "qr_code_base64_aqui",
  "base64": "data:image/png;base64,..."
}
```

---

## 🔐 Descobrir suas credenciais Evolution

Se você não sabe suas credenciais atuais:

### 1. Verificar logs do Evolution API:
```bash
# Se estiver no Railway
railway logs --service evolution-api
```

### 2. Verificar variáveis de ambiente:
```bash
# No painel Railway
railway variables --service evolution-api
```

### 3. Resetar API Key (se necessário):

Edite as variáveis no Railway e defina uma nova:
```env
AUTHENTICATION_API_KEY=nova_chave_segura_$(openssl rand -hex 16)
```

---

## 📝 Checklist de Configuração

### No Evolution API (serviço separado):
- [ ] Evolution API rodando no Railway
- [ ] `AUTHENTICATION_API_KEY` definida
- [ ] `WEBHOOK_GLOBAL_URL` apontando para seu app
- [ ] Banco PostgreSQL conectado (se `DATABASE_ENABLED=true`)

### No seu App (salon-booking):
- [ ] `EVOLUTION_API_URL` configurada
- [ ] `EVOLUTION_API_KEY` configurada (mesma que `AUTHENTICATION_API_KEY`)
- [ ] `EVOLUTION_INSTANCE_NAME` definido
- [ ] Webhook `/api/webhooks/whatsapp` criado

### Testes:
- [ ] `fetchInstances` retorna sua instância
- [ ] Consegue gerar QR code
- [ ] QR code aparece na interface
- [ ] Após escanear, status muda para "open"
- [ ] Mensagens de teste chegam

---

## 🆘 Troubleshooting

### Erro: "Unauthorized"
- Verifique se `EVOLUTION_API_KEY` é igual a `AUTHENTICATION_API_KEY`
- Confirme que o header é `apikey` (minúsculo)

### Erro: "Instance not found"
- Execute o curl de criação de instância (passo 2)
- Verifique se `EVOLUTION_INSTANCE_NAME` está correto

### QR Code não aparece:
- Verifique logs: `railway logs`
- Teste URL diretamente no browser
- Confirme que Evolution API está rodando (status 200)

### Mensagens não chegam:
- Verifique webhook no Evolution Manager
- Teste webhook: `curl https://salon-booking.com.br/api/webhooks/whatsapp`
- Veja logs do webhook no Railway

---

## 🎯 Próximos Passos

1. **Configure as variáveis corretas**
2. **Teste localmente primeiro** (`npm run dev`)
3. **Deploy no Railway**
4. **Conecte WhatsApp via QR code**
5. **Teste envio de mensagem**

Me diga se você precisa de ajuda em alguma etapa específica!
