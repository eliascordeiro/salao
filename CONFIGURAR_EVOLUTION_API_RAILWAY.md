# 🔧 Configurar Evolution API no Railway

## ❌ Erro Atual
```
Erro ao conectar WhatsApp: Error: Erro ao criar instância: Unauthorized
```

Causa: As variáveis `EVOLUTION_API_URL`, `EVOLUTION_API_KEY` e `EVOLUTION_INSTANCE_NAME` não estão configuradas no Railway.

---

## ✅ Solução: Adicionar Variáveis no Railway

### Opção 1: Via Dashboard (Recomendado)

1. **Acesse o Railway Dashboard:**
   ```
   https://railway.app/
   ```

2. **Navegue até seu projeto:**
   - Clique em: `salon-booking` (ou nome do seu projeto)
   - Clique na aba: **Variables**

3. **Adicione as 3 variáveis:**

   ```bash
   EVOLUTION_API_URL=https://evolution-api-production-d187.up.railway.app
   EVOLUTION_API_KEY=evolution_salon_2024_xK9pL2mQ7wR
   EVOLUTION_INSTANCE_NAME=salon-booking
   ```

4. **Clique em "Add" para cada variável**

5. **Deploy automático será acionado** (aguarde 2-3 minutos)

---

### Opção 2: Via Railway CLI

```bash
# Login no Railway (se ainda não fez)
railway login

# Link ao projeto
railway link

# Adicionar variáveis
railway variables set EVOLUTION_API_URL=https://evolution-api-production-d187.up.railway.app
railway variables set EVOLUTION_API_KEY=evolution_salon_2024_xK9pL2mQ7wR
railway variables set EVOLUTION_INSTANCE_NAME=salon-booking

# Verificar se foram adicionadas
railway variables
```

---

## 🧪 Testar Localmente (ANTES de testar no Railway)

```bash
# 1. Reiniciar servidor local com novas variáveis
npm run dev

# 2. Acessar página de WhatsApp
# http://localhost:3000/dashboard/configuracoes/whatsapp

# 3. Clicar em "Conectar WhatsApp"
# Deve aparecer QR code para escanear
```

---

## 🔍 Verificar se Funcionou no Railway

Após adicionar as variáveis e aguardar o deploy:

1. **Acessar sua aplicação:**
   ```
   https://salon-booking.com.br/dashboard/configuracoes/whatsapp
   ```

2. **Clicar em "Conectar WhatsApp"**
   - ✅ Sucesso: QR code aparece
   - ❌ Erro: Verificar logs no Railway

3. **Ver logs do Railway:**
   ```bash
   railway logs
   ```
   
   Ou no dashboard: Deployments → Últimos logs

---

## 📋 Checklist

- [ ] Variáveis adicionadas no Railway
- [ ] Deploy automático completado (verde ✅)
- [ ] Testado localmente primeiro (QR code aparece)
- [ ] Testado em produção (https://salon-booking.com.br)
- [ ] QR code escaneado no WhatsApp
- [ ] Status mostra "✅ Conectado"

---

## ❓ Se Continuar com Erro "Unauthorized"

### 1. Verificar se API Key está correta

```bash
# Testar diretamente a Evolution API
curl https://evolution-api-production-d187.up.railway.app/instance/fetchInstances \
  -H "apikey: evolution_salon_2024_xK9pL2mQ7wR"
```

**Resposta esperada:** JSON com lista de instâncias (pode ser vazio `[]`)

**Se retornar 401/403:** A API Key está incorreta

### 2. Criar Nova Instância Manualmente

Se a instância `salon-booking` não existe:

```bash
curl -X POST https://evolution-api-production-d187.up.railway.app/instance/create \
  -H "Content-Type: application/json" \
  -H "apikey: evolution_salon_2024_xK9pL2mQ7wR" \
  -d '{
    "instanceName": "salon-booking",
    "qrcode": true,
    "integration": "WHATSAPP-BAILEYS"
  }'
```

### 3. Verificar Status da Instância

```bash
curl https://evolution-api-production-d187.up.railway.app/instance/connectionState/salon-booking \
  -H "apikey: evolution_salon_2024_xK9pL2mQ7wR"
```

---

## 💡 Próximos Passos (Após Resolver Unauthorized)

1. ✅ Variáveis configuradas no Railway
2. ✅ QR Code aparece na tela
3. 🔄 Escanear QR Code no WhatsApp:
   - Abrir WhatsApp no celular
   - Configurações → Aparelhos conectados
   - Conectar um aparelho
   - Escanear o QR code da tela
4. ✅ Status muda para "Conectado"
5. 🧪 Enviar mensagem de teste

---

## 📞 Informações da Evolution API

- **URL:** https://evolution-api-production-d187.up.railway.app
- **API Key:** evolution_salon_2024_xK9pL2mQ7wR
- **Instance:** salon-booking
- **Custo:** ~R$5/mês (hospedagem Railway)
- **Docs:** https://doc.evolution-api.com/

---

**🚀 Após configurar, acesse:**
https://salon-booking.com.br/dashboard/configuracoes/whatsapp
