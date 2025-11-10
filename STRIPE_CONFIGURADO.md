# 🎯 Stripe Configurado com Sucesso!

## ✅ Chaves Adicionadas ao .env

As seguintes chaves foram configuradas:

```bash
STRIPE_SECRET_KEY=sk_test_51SRiSSIljdKvzWA...
STRIPE_PUBLISHABLE_KEY=pk_test_51SRiSSIljdKvzWA...
STRIPE_WEBHOOK_SECRET=whsec_placeholder  # ⚠️ PRECISA CONFIGURAR
```

---

## 🚀 CONFIGURAÇÃO RÁPIDA (3 Passos)

### **Passo 1: Configurar Webhook (OBRIGATÓRIO)**

Execute este comando em um **terminal separado**:

```bash
./start-webhook.sh
```

**O que vai acontecer:**
1. ✅ Verifica/instala Stripe CLI local
2. 🔑 Pede para você fazer login no Stripe
3. 🎣 Inicia o listener de webhooks
4. 📋 Mostra o `webhook signing secret` (whsec_xxx...)

**IMPORTANTE:** Quando aparecer a linha:
```
✔ Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx
```

**COPIE** o código `whsec_xxxxxxxxxxxxx` e cole no arquivo `.env`:

```bash
# Abra o .env e atualize:
STRIPE_WEBHOOK_SECRET="whsec_xxxxxxxxxxxxx"
```

### **Passo 2: Iniciar Servidor**

Em **outro terminal**, execute:

```bash
npm run dev
```

### **Passo 3: Testar Pagamento**

1. Acesse: http://localhost:3000
2. Login: `pedro@exemplo.com` / `cliente123`
3. Crie um agendamento
4. Vá em "Meus Agendamentos"
5. Clique "💳 Pagar Agendamento"
6. Use cartão de teste:
   ```
   Número: 4242 4242 4242 4242
   CVV: 123
   Data: 12/30
   Nome: Teste Silva
   ```
7. Complete o pagamento
8. ✅ No **Terminal 1** (webhook), você verá:
   ```
   --> checkout.session.completed [evt_xxx]
   --> payment_intent.succeeded [evt_xxx]
   ```
9. ✅ Agendamento confirmado + Email enviado!

---

## 📊 Verificar Pagamentos

Acesse o Dashboard do Stripe:
- https://dashboard.stripe.com/test/payments

Você verá o pagamento de teste listado com status "Succeeded" ✅

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
