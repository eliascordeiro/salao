# 🎯 Stripe Configurado com Sucesso!

## ✅ Chaves Adicionadas ao .env

As seguintes chaves foram configuradas:

```bash
STRIPE_SECRET_KEY=sk_test_51SRiSSIljdKvzWA...
STRIPE_PUBLISHABLE_KEY=pk_test_51SRiSSIljdKvzWA...
STRIPE_WEBHOOK_SECRET=whsec_placeholder  # ⚠️ PRECISA CONFIGURAR
```

---

## 🚀 Próximos Passos

### **1. Configurar Webhook Local (OBRIGATÓRIO)**

Para que os pagamentos sejam confirmados automaticamente, você precisa configurar o webhook:

**Terminal 1 - Execute o script:**
```bash
./setup-stripe-webhook.sh
```

**O que vai acontecer:**
1. Verifica se Stripe CLI está instalado (instala se necessário)
2. Abre navegador para você fazer login no Stripe
3. Inicia o listener de webhooks
4. **Mostra o `webhook signing secret`** (whsec_xxx...)

**Terminal 1 - OU execute manualmente:**
```bash
# Se o script não funcionar, execute passo a passo:

# 1. Instalar Stripe CLI (se não tiver)
curl -s https://packages.stripe.com/api/security/keypair/stripe-cli-gpg/public | gpg --dearmor | sudo tee /usr/share/keyrings/stripe.gpg
echo "deb [signed-by=/usr/share/keyrings/stripe.gpg] https://packages.stripe.com/stripe-cli-debian-local stable main" | sudo tee -a /etc/apt/sources.list.d/stripe.list
sudo apt update
sudo apt install stripe

# 2. Fazer login
stripe login

# 3. Iniciar webhook listener
stripe listen --forward-to localhost:3000/api/payments/webhook
```

**⚠️ IMPORTANTE:** Copie o `webhook signing secret` que aparecer e cole no `.env`:

```bash
# No arquivo .env, substitua:
STRIPE_WEBHOOK_SECRET="whsec_xxxxxxxxxxxxxxxxxxxxxxxx"
```

### **2. Iniciar o Servidor**

**Terminal 2:**
```bash
npm run dev
```

### **3. Testar Pagamento**

1. Acesse: http://localhost:3000
2. Faça login como cliente
3. Crie um agendamento
4. Vá em "Meus Agendamentos"
5. Clique "Pagar Agendamento"
6. Use cartão de teste:
   ```
   Número: 4242 4242 4242 4242
   CVV: 123
   Data: 12/30
   Nome: Qualquer Nome
   ```
7. Complete o pagamento
8. ✅ Verifique o webhook no Terminal 1
9. ✅ Receba email de confirmação

---

## 🧪 Cartões de Teste

| Cenário | Número do Cartão |
|---------|------------------|
| ✅ **Sucesso** | `4242 4242 4242 4242` |
| ❌ **Recusado** | `4000 0000 0000 0002` |
| ⏳ **Requer 3DS** | `4000 0027 6000 3184` |
| 💳 **Cartão BR** | `4000 0007 6000 0002` |

**Dados adicionais:**
- CVV: Qualquer 3 dígitos (ex: 123)
- Data: Qualquer data futura (ex: 12/30)
- Nome: Qualquer nome
- CEP: Qualquer CEP válido

---

## 📊 Dashboard do Stripe

Acesse para ver pagamentos, webhooks, etc:
- **Modo Teste:** https://dashboard.stripe.com/test/dashboard
- **API Keys:** https://dashboard.stripe.com/test/apikeys
- **Webhooks:** https://dashboard.stripe.com/test/webhooks
- **Pagamentos:** https://dashboard.stripe.com/test/payments

---

## 🔍 Verificar se Está Funcionando

### **Checklist:**

- [x] ✅ Chaves adicionadas ao `.env`
- [ ] ⚠️ Webhook secret configurado (precisa rodar `setup-stripe-webhook.sh`)
- [ ] 🎣 Stripe CLI rodando no Terminal 1
- [ ] 🚀 Servidor rodando no Terminal 2 (npm run dev)
- [ ] 💳 Teste de pagamento realizado

### **Logs Esperados:**

**Terminal 1 (Stripe CLI):**
```
✔ Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxxxxxxxxxx
2024-11-09 18:30:00   --> checkout.session.completed [evt_xxx]
2024-11-09 18:30:01   --> payment_intent.succeeded [evt_xxx]
```

**Terminal 2 (Servidor):**
```
Webhook recebido: checkout.session.completed
Checkout session completed: cs_test_xxx
Webhook recebido: payment_intent.succeeded
Payment intent succeeded: pi_xxx
✅ Pagamento confirmado! Email enviado.
```

---

## 🆘 Problemas Comuns

### **1. "Invalid API Key provided"**

**Causa:** Chave secreta incorreta ou com espaços

**Solução:**
```bash
# Verifique se a chave começa com sk_test_
grep STRIPE_SECRET_KEY .env

# Deve retornar:
# STRIPE_SECRET_KEY="sk_test_51SRiSSIljdKvzWA..."
```

### **2. "Webhook signature verification failed"**

**Causa:** STRIPE_WEBHOOK_SECRET não configurado ou incorreto

**Solução:**
```bash
# 1. Certifique-se que o Stripe CLI está rodando
stripe listen --forward-to localhost:3000/api/payments/webhook

# 2. Copie o "webhook signing secret" que aparece (whsec_xxx)
# 3. Cole no .env:
STRIPE_WEBHOOK_SECRET="whsec_xxxxxxxxxxxxxxxxxxxxxxxx"

# 4. Reinicie o servidor (npm run dev)
```

### **3. Pagamento não confirma automaticamente**

**Causa:** Webhook listener não está rodando

**Solução:**
```bash
# Abra um terminal separado e execute:
stripe listen --forward-to localhost:3000/api/payments/webhook

# Deve aparecer:
# ✔ Ready! Your webhook signing secret is whsec_xxx...
```

### **4. "Error: Stripe has not been initialized"**

**Causa:** Chaves não configuradas no `.env`

**Solução:**
```bash
# Verifique se todas as chaves estão no .env:
cat .env | grep STRIPE

# Deve mostrar:
# STRIPE_SECRET_KEY="sk_test_..."
# STRIPE_PUBLISHABLE_KEY="pk_test_..."
# STRIPE_WEBHOOK_SECRET="whsec_..."
```

---

## 📝 Resumo Rápido

```bash
# Terminal 1: Webhook Listener (deixar rodando)
./setup-stripe-webhook.sh
# OU
stripe listen --forward-to localhost:3000/api/payments/webhook

# Terminal 2: Servidor Next.js
npm run dev

# Navegador: Testar
http://localhost:3000
Login → Criar Agendamento → Pagar → Cartão 4242 4242 4242 4242
```

---

## 🎉 Pronto!

Seu sistema de pagamentos Stripe está configurado e pronto para uso!

**Próximos passos:**
1. ⚠️ Configure o webhook local (obrigatório)
2. 🧪 Teste um pagamento
3. 📊 Veja o resultado no Dashboard do Stripe
4. 🚀 Quando estiver pronto para produção, substitua as chaves de teste (pk_test/sk_test) por chaves de produção (pk_live/sk_live)

**Dúvidas?** Consulte a documentação completa em: `docs/SISTEMA_PAGAMENTOS.md`
