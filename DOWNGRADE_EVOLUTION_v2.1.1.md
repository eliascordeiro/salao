# Downgrade Evolution API para v2.1.1 (versão estável com QR Code funcionando)

## 🎯 Passos para aplicar:

### 1. Acesse o Railway Dashboard
```
https://railway.app/project/splendid-purpose
```

### 2. Selecione o serviço Evolution API
- Clique no card do Evolution API

### 3. Vá na aba "Variables"
- Clique em "Variables" no menu lateral

### 4. Adicione/Edite a variável DOCKER_IMAGE

**Se a variável já existe:**
- Clique em `DOCKER_IMAGE`
- Mude o valor para: `atendai/evolution-api:v2.1.1`
- Clique em "Update"

**Se não existe:**
- Clique em "+ New Variable"
- **Variable name:** `DOCKER_IMAGE`
- **Value:** `atendai/evolution-api:v2.1.1`
- Clique em "Add"

### 5.Force Redeploy
- Aba "Deployments"
- Clique nos 3 pontinhos do último deploy
- Clique em "Redeploy"

### 6. Aguarde o deploy (2-3 minutos)
- Status ficará verde quando completar

### 7. Teste a nova versão
```bash
curl https://evolution-api-production-6c1c.up.railway.app/
```

Deve retornar: `"version":"2.1.1"`

---

## 🔍 Verificação

Após deploy completo, teste:

```bash
# 1. Check versão
curl -s https://evolution-api-production-6c1c.up.railway.app/ | grep version

# 2. Criar instância
curl -X POST https://evolution-api-production-6c1c.up.railway.app/instance/create \
  -H "apikey: B6D711FCDE4D4FD5936544120E713976" \
  -H "Content-Type: application/json" \
  -d '{
    "instanceName": "salon-booking",
    "qrcode": true,
    "integration": "WHATSAPP-BAILEYS"
  }'

# 3. Obter QR Code (deve funcionar agora!)
curl -X GET https://evolution-api-production-6c1c.up.railway.app/instance/connect/salon-booking \
  -H "apikey: B6D711FCDE4D4FD5936544120E713976"
```

---

## ✅ Quando finalizar:

Acesse: `http://localhost:3000/dashboard/configuracoes/whatsapp`

E clique em "Conectar WhatsApp" - deve gerar QR Code instantaneamente! 🎉
