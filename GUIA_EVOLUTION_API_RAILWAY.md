# 🚀 Guia: Instalar Evolution API no Railway

## Opção 1: Deploy via GitHub (RECOMENDADO)

### Passo 1: Criar novo Service
1. Acesse seu projeto Railway: https://railway.com/project/5a0746d8-8439-4897-9240-c27176bf0867
2. Clique em **"+ New"** → **"GitHub Repo"**
3. Selecione o repositório: `EvolutionAPI/evolution-api`
   - Se não aparecer, clique em **"Configure GitHub App"** e autorize o repositório

### Passo 2: Configurar Variáveis de Ambiente

Adicione as seguintes variáveis no Railway:

```bash
# Autenticação
AUTHENTICATION_API_KEY=SUA_API_KEY_AQUI_MINIMO_32_CARACTERES

# Database (PostgreSQL do Railway)
DATABASE_ENABLED=true
DATABASE_PROVIDER=postgresql
DATABASE_CONNECTION_URI=${{Postgres.DATABASE_URL}}
DATABASE_SAVE_DATA_INSTANCE=true
DATABASE_SAVE_DATA_NEW_MESSAGE=false
DATABASE_SAVE_MESSAGE_UPDATE=false
DATABASE_SAVE_DATA_CONTACTS=false
DATABASE_SAVE_DATA_CHATS=false

# Redis (opcional, mas recomendado)
REDIS_ENABLED=false

# Servidor
SERVER_TYPE=http
SERVER_PORT=8080
SERVER_URL=https://SEU_SERVICE.up.railway.app

# CORS
CORS_ORIGIN=*
CORS_METHODS=POST,GET,PUT,DELETE
CORS_CREDENTIALS=true

# Logs
LOG_LEVEL=ERROR
LOG_COLOR=true
LOG_BAILEYS=error

# QR Code
QRCODE_LIMIT=30
QRCODE_COLOR=#198754

# WhatsApp
INSTANCE_EXPIRATION_TIME=false
CONFIG_SESSION_PHONE_CLIENT=Chrome
CONFIG_SESSION_PHONE_NAME=Evolution API
```

### Passo 3: Adicionar PostgreSQL
1. No mesmo projeto, clique **"+ New"** → **"Database"** → **"Add PostgreSQL"**
2. O Railway criará automaticamente a variável `${{Postgres.DATABASE_URL}}`

### Passo 4: Deploy
1. O Railway fará deploy automaticamente
2. Aguarde o build terminar (~3-5 minutos)
3. Acesse a URL pública do service: `https://SEU_SERVICE.up.railway.app`

---

## Opção 2: Deploy via Docker Image (ALTERNATIVA)

### Passo 1: Criar Service com Docker
1. Clique **"+ New"** → **"Empty Service"**
2. Vá em **Settings** → **Source**
3. Escolha **"Docker Image"**
4. Insira: `atendai/evolution-api:latest` ou `atendai/evolution-api:v2.1.1`

### Passo 2: Configurar as mesmas variáveis acima

### Passo 3: Expor a porta
- Em **Settings** → **Networking**
- Marque **"Public Networking"**
- A porta padrão é **8080**

---

## 🔑 Gerar API Key Segura

Execute no terminal:

```bash
openssl rand -hex 32
```

Ou use este gerador online: https://www.random.org/strings/?num=1&len=32&digits=on&upperalpha=on&loweralpha=on&unique=on

---

## ✅ Verificar Instalação

### 1. Teste via cURL:
```bash
curl -X GET https://SEU_SERVICE.up.railway.app/instance/fetchInstances \
  -H "apikey: SUA_API_KEY"
```

Resposta esperada: `[]` (lista vazia de instâncias)

### 2. Criar instância de teste:
```bash
curl -X POST https://SEU_SERVICE.up.railway.app/instance/create \
  -H "Content-Type: application/json" \
  -H "apikey: SUA_API_KEY" \
  -d '{
    "instanceName": "test-instance",
    "qrcode": true,
    "integration": "WHATSAPP-BAILEYS"
  }'
```

---

## 🔗 Atualizar .env do Projeto Next.js

Após o deploy da Evolution API, atualize no Railway (service do Next.js):

```bash
EVOLUTION_API_URL=https://SEU_SERVICE.up.railway.app
EVOLUTION_API_KEY=SUA_API_KEY_AQUI
EVOLUTION_INSTANCE_NAME=salon-booking
```

**IMPORTANTE:** Remova qualquer `/` no final da `EVOLUTION_API_URL`

---

## 🐛 Troubleshooting

### Erro: "Failed to fetch instances"
- Verifique se a `AUTHENTICATION_API_KEY` está correta
- Confirme que o service está rodando (logs verdes no Railway)

### Erro: "Database connection failed"
- Verifique se o PostgreSQL foi adicionado ao projeto
- Confirme que `DATABASE_CONNECTION_URI=${{Postgres.DATABASE_URL}}`

### QR Code não é gerado
- Verifique se `QRCODE_LIMIT=30` está configurado
- Logs devem mostrar: "QR Code generated"
- Use endpoint direto: `GET /instance/qrcode/:instanceName`

---

## 📚 Documentação Oficial

- Evolution API: https://doc.evolution-api.com/
- GitHub: https://github.com/EvolutionAPI/evolution-api
- Postman Collection: https://doc.evolution-api.com/v2/pt/get-started/postman

---

## 🎯 Próximos Passos

1. ✅ Deploy Evolution API no Railway
2. ✅ Configurar variáveis de ambiente
3. ✅ Adicionar PostgreSQL
4. ✅ Atualizar .env do Next.js
5. ✅ Testar conexão via `/api/whatsapp/status`
6. 🎉 WhatsApp funcionando!
