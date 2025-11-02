# 🔐 Variáveis de Ambiente - Railway

## ✅ Configure estas variáveis no Railway

Vá em: **Railway Dashboard** → **Seu Projeto "Salão"** → **Variables**

---

## 📋 Variáveis Obrigatórias

### 1. Database (PostgreSQL)
```env
DATABASE_URL=postgresql://postgres:SUA_SENHA_AQUI@HOST:PORT/DATABASE_NAME
```

**IMPORTANTE:** O Railway já deve ter criado automaticamente a variável `DATABASE_URL` quando você adicionou o PostgreSQL. 

**Como obter:**
1. No Railway, clique no serviço **"PostgreSQL"**
2. Vá na aba **"Variables"** ou **"Connect"**
3. Copie o valor completo de `DATABASE_URL`

**Formato:**
```
postgresql://postgres:sua_senha@postgres.railway.internal:5432/railway
```

---

### 2. NextAuth (Autenticação)
```env
NEXTAUTH_SECRET=+SVcPHuRvto/Y1jb/irnG7lvcg5j9/RCNI8ud80JV1g=
```

```env
NEXTAUTH_URL=https://seu-app.up.railway.app
```
**⚠️ IMPORTANTE:** Após o primeiro deploy, pegue a URL real do Railway e atualize esta variável!

---

### 3. Node Environment
```env
NODE_ENV=production
```

---

### 4. Stripe (Pagamentos)
```env
STRIPE_SECRET_KEY=sua_chave_secreta_stripe
STRIPE_PUBLISHABLE_KEY=sua_chave_publica_stripe
STRIPE_WEBHOOK_SECRET=seu_webhook_secret_stripe
```

**Como obter as chaves Stripe:**
1. Crie conta em https://stripe.com
2. Mode de teste: Use as chaves de teste do dashboard
3. Pegue as chaves em https://dashboard.stripe.com/apikeys
4. Configure webhook em https://dashboard.stripe.com/webhooks apontando para `https://seu-app.railway.app/api/webhooks/stripe`

---

## 📧 Variáveis Opcionais (Email)

### Gmail SMTP (Se quiser notificações por email)
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-de-app-do-gmail
EMAIL_FROM=Seu Salão <noreply@seusalao.com>
```

**Como gerar senha de app do Gmail:**
1. Acesse: https://myaccount.google.com/security
2. Ative "Verificação em duas etapas"
3. Vá em "Senhas de app"
4. Crie senha para "Outro (Railway)"

---

## 🎯 Resumo - Variáveis Mínimas para Funcionar

```env
DATABASE_URL=<copie_do_painel_postgresql_railway>
NEXTAUTH_SECRET=<gere_com_openssl_rand_base64_32>
NEXTAUTH_URL=https://seu-app.up.railway.app
NODE_ENV=production
STRIPE_SECRET_KEY=sk_test_sua_chave_stripe_aqui
STRIPE_PUBLISHABLE_KEY=pk_test_sua_chave_publica_stripe_aqui
STRIPE_WEBHOOK_SECRET=whsec_seu_webhook_secret_aqui
```

**📝 Nota:** Substitua todos os placeholders pelos valores reais!

---

## 📝 Passo a Passo no Railway

### 1. Adicionar PostgreSQL (se ainda não adicionou)
- No projeto Railway, clique em **"+ New"**
- Selecione **"Database"** → **"Add PostgreSQL"**
- Aguarde provisionar (~30 segundos)

### 2. Pegar DATABASE_URL
- Clique no serviço **"PostgreSQL"** (novo card criado)
- Vá na aba **"Variables"**
- Copie o valor de `DATABASE_URL`
- **OU** vá em **"Connect"** e copie a Connection String

### 3. Adicionar Variáveis no Serviço Web
- Clique no serviço **"Salão"** (seu app Next.js)
- Vá na aba **"Variables"**
- Clique em **"+ New Variable"** para cada uma
- Cole os valores acima

### 4. Aguardar Redeploy
- Railway fará redeploy automático após adicionar variáveis
- Aguarde ~3-5 minutos

### 5. Pegar URL Final
- Vá na aba **"Settings"** do serviço "Salão"
- Copie a URL em **"Domains"**
- Volte em **"Variables"** e atualize `NEXTAUTH_URL` com a URL correta

---

## ✅ Checklist

- [ ] PostgreSQL adicionado ao projeto
- [ ] `DATABASE_URL` copiada do PostgreSQL
- [ ] `NEXTAUTH_SECRET` configurado
- [ ] `NEXTAUTH_URL` configurado (atualizar depois)
- [ ] `NODE_ENV=production` configurado
- [ ] Variáveis Stripe configuradas
- [ ] Deploy iniciado automaticamente
- [ ] URL final obtida
- [ ] `NEXTAUTH_URL` atualizado com URL real

---

## 🚀 Após Variáveis Configuradas

O Railway fará redeploy e:
1. ✅ Instalará dependências
2. ✅ Gerará Prisma Client
3. ✅ Fará build do Next.js
4. ✅ Rodará migrations (`prisma migrate deploy`)
5. ✅ Iniciará o servidor

**Tempo estimado:** 3-5 minutos

---

## 🔍 Popular Banco de Dados

Após deploy bem-sucedido:

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Linkar ao projeto
railway link

# Popular banco
railway run npm run db:seed
```

---

**Configure agora e seu sistema estará no ar em minutos! 🎉**
