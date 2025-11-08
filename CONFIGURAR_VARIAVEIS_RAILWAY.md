# 🔐 Configuração de Variáveis de Ambiente - Railway

## ⚠️ ERROS ATUAIS (Esperados)
```
❌ 401 Unauthorized - Falta NEXTAUTH_SECRET
❌ 500 Internal Error - Falta configuração completa
```

---

## ✅ SOLUÇÃO: Adicionar Variáveis no Railway

### **Passo 1: Ir para Variáveis**
1. Railway Dashboard → Sua aplicação Next.js
2. Clique na aba **"Variables"**
3. Já deve ter `DATABASE_URL` (✅)

---

## 📋 **Passo 2: Adicionar Cada Variável**

Clique em **"+ New Variable"** para cada uma:

### 1️⃣ **NEXTAUTH_SECRET** (Obrigatório)
```
Nome: NEXTAUTH_SECRET
Valor: +SVcPHuRvto/Y1jb/irnG7lvcg5j9/RCNI8ud80JV1g=
```
> Esta é uma chave segura gerada aleatoriamente para sessões

### 2️⃣ **NEXTAUTH_URL** (Obrigatório)
```
Nome: NEXTAUTH_URL
Valor: [COLE SUA URL AQUI]
```
> ⚠️ **IMPORTANTE:** Use a URL que o Railway gerou
> Exemplo: `https://salao-production-abc123.up.railway.app`

### 3️⃣ **NODE_ENV** (Obrigatório)
```
Nome: NODE_ENV
Valor: production
```

### 4️⃣ **STRIPE_SECRET_KEY** (Para pagamentos)
```
Nome: STRIPE_SECRET_KEY
Valor: sk_test_51H... [sua chave do Stripe]
```
> 📝 Se não tiver Stripe ainda, use: `sk_test_placeholder`

### 5️⃣ **STRIPE_PUBLISHABLE_KEY** (Para pagamentos)
```
Nome: STRIPE_PUBLISHABLE_KEY
Valor: pk_test_51H... [sua chave do Stripe]
```
> 📝 Se não tiver Stripe ainda, use: `pk_test_placeholder`

### 6️⃣ **STRIPE_WEBHOOK_SECRET** (Para pagamentos)
```
Nome: STRIPE_WEBHOOK_SECRET
Valor: whsec_... [seu webhook do Stripe]
```
> 📝 Se não tiver Stripe ainda, use: `whsec_placeholder`

---

## 🚀 **Passo 3: Aplicar e Redeploy**

Após adicionar TODAS as variáveis:

1. ✅ Verifique que todas estão listadas
2. 🔄 O Railway vai **redeploy automaticamente** (~2 min)
3. ⏳ Aguarde o deploy completar

---

## 🎯 **Verificar se Funcionou**

Depois do redeploy, acesse a URL novamente:

### ✅ **Deve funcionar:**
- Página inicial carrega
- Botão "Entrar" funciona
- Página de registro funciona
- Sem erros 401/500

### ⚠️ **Se ainda tiver erro:**
1. Verifique se TODAS as 6 variáveis foram adicionadas
2. Verifique se NEXTAUTH_URL tem a URL correta (com https://)
3. Force um novo deploy (Deployments → ... → Redeploy)

---

## 📝 **Resumo das Variáveis OBRIGATÓRIAS**

```
✅ DATABASE_URL (já tem)
✅ NEXTAUTH_SECRET
✅ NEXTAUTH_URL (com sua URL do Railway)
✅ NODE_ENV
⚠️ STRIPE_* (pode usar placeholder por enquanto)
```

---

## 🆘 **Qual é a URL que o Railway gerou?**

Me envie para eu te dar o valor correto do NEXTAUTH_URL!

Exemplo: `https://salao-production-xyz123.up.railway.app`
