# 📋 Guia Completo: Configuração de Variáveis de Ambiente

## 🎯 Visão Geral

Este projeto usa diferentes configurações para **desenvolvimento local** e **produção (Railway)**:

```
┌─────────────────┬──────────────────┬────────────────────┐
│ Ambiente        │ Arquivo          │ Banco de Dados     │
├─────────────────┼──────────────────┼────────────────────┤
│ Dev Local       │ .env             │ SQLite (dev.db)    │
│ Produção        │ Railway Vars     │ PostgreSQL         │
└─────────────────┴──────────────────┴────────────────────┘
```

---

## 🖥️ DESENVOLVIMENTO LOCAL

### 1️⃣ Configuração Inicial

```bash
# Copiar template
cp .env.example .env

# Editar com seus valores
nano .env  # ou code .env
```

### 2️⃣ Arquivo .env (Desenvolvimento)

```bash
# DATABASE - SQLite (sem precisar instalar PostgreSQL)
DATABASE_URL="file:./prisma/dev.db"

# NEXTAUTH - Já configurado
NEXTAUTH_SECRET="+SVcPHuRvto/Y1jb/irnG7lvcg5j9/RCNI8ud80JV1g="
NEXTAUTH_URL="http://localhost:3000"

# NODE_ENV
NODE_ENV="development"

# EMAIL - Configure um dos três:
# Opção 1: Mailtrap (recomendado)
SMTP_HOST="sandbox.smtp.mailtrap.io"
SMTP_PORT="2525"
SMTP_USER="seu-username-mailtrap"
SMTP_PASS="sua-senha-mailtrap"
EMAIL_FROM="AgendaSalão <noreply@agendasalao.com>"

# STRIPE - Use chaves de teste
STRIPE_SECRET_KEY="sk_test_placeholder"
STRIPE_PUBLISHABLE_KEY="pk_test_placeholder"
STRIPE_WEBHOOK_SECRET="whsec_placeholder"
```

### 3️⃣ Configurar Email (Escolha uma opção)

#### Opção A: Mailtrap (Recomendado - Emails não saem de verdade)

1. Cadastre-se: https://mailtrap.io (gratuito)
2. Crie uma inbox
3. Copie as credenciais SMTP
4. Cole no `.env`

**Vantagens:**
- ✅ Gratuito
- ✅ Emails ficam no Mailtrap (não vão para email real)
- ✅ Perfeito para testes

#### Opção B: Gmail (Emails reais)

1. Ative autenticação em 2 fatores na sua conta Google
2. Gere uma senha de app: https://myaccount.google.com/apppasswords
3. Use no `.env`:

```bash
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="seu-email@gmail.com"
SMTP_PASS="senha-de-16-digitos-gerada"
```

**Vantagens:**
- ✅ Emails reais
- ✅ Teste com contas reais

**Desvantagens:**
- ⚠️ Limite de envios (500/dia)
- ⚠️ Precisa configurar senha de app

#### Opção C: Ethereal (Emails temporários)

1. Acesse: https://ethereal.email
2. Clique em "Create Ethereal Account"
3. Copie as credenciais exibidas

**Vantagens:**
- ✅ Instantâneo (sem cadastro)
- ✅ Ver emails em tempo real

### 4️⃣ Inicializar Banco de Dados

```bash
# Gerar Prisma Client
npx prisma generate

# Criar banco SQLite e aplicar migrations
npx prisma migrate dev

# Popular com dados iniciais
npm run seed
# ou
node scripts/seed-local.js
```

### 5️⃣ Executar em Desenvolvimento

```bash
npm run dev
```

Acesse: http://localhost:3000

---

## ☁️ PRODUÇÃO (RAILWAY)

### 1️⃣ Acessar Railway Dashboard

1. Acesse: https://railway.app
2. Login
3. Selecione o projeto: **salao-production**
4. Clique no serviço da aplicação (não PostgreSQL)

### 2️⃣ Adicionar Variáveis

Clique em **"Variables"** → **"+ New Variable"**

#### Variáveis Obrigatórias (7 no total)

```bash
# 1. DATABASE_URL (já configurado automaticamente)
DATABASE_URL = postgresql://postgres:senha@host:port/railway

# 2. NEXTAUTH_SECRET (use este valor gerado)
NEXTAUTH_SECRET = +SVcPHuRvto/Y1jb/irnG7lvcg5j9/RCNI8ud80JV1g=

# 3. NEXTAUTH_URL (substitua pela sua URL do Railway)
NEXTAUTH_URL = https://salao-production.up.railway.app

# 4. NODE_ENV
NODE_ENV = production

# 5. STRIPE_SECRET_KEY (use placeholder ou chave real)
STRIPE_SECRET_KEY = sk_test_placeholder

# 6. STRIPE_PUBLISHABLE_KEY
STRIPE_PUBLISHABLE_KEY = pk_test_placeholder

# 7. STRIPE_WEBHOOK_SECRET
STRIPE_WEBHOOK_SECRET = whsec_placeholder
```

### 3️⃣ Variáveis de Email (Opcional)

Se quiser emails em produção:

```bash
# Gmail
SMTP_HOST = smtp.gmail.com
SMTP_PORT = 587
SMTP_USER = seu-email@gmail.com
SMTP_PASS = sua-senha-de-app
EMAIL_FROM = AgendaSalão <noreply@agendasalao.com>
```

### 4️⃣ Aguardar Redeploy

- Railway faz redeploy automático (~2 min)
- Status: Building → Deploying → Ready ✅

### 5️⃣ Popular Banco de Produção

```bash
# Executar seed em produção
DATABASE_URL_PRODUCTION="sua-url-postgresql-railway" node scripts/seed-production.js
```

---

## 🔐 SEGURANÇA

### ⚠️ O QUE NUNCA FAZER

❌ **NÃO** commite o arquivo `.env` no Git
❌ **NÃO** exponha chaves de API em código
❌ **NÃO** use chaves de produção em desenvolvimento
❌ **NÃO** compartilhe senhas reais

### ✅ BOAS PRÁTICAS

✅ Use `.env` apenas localmente
✅ Configure variáveis no Railway Dashboard
✅ Use chaves de teste em desenvolvimento
✅ Gere `NEXTAUTH_SECRET` forte
✅ Mantenha `.env.example` atualizado (sem dados sensíveis)

---

## 📊 COMPARAÇÃO: Local vs Produção

| Aspecto           | Desenvolvimento Local          | Produção (Railway)           |
|-------------------|-------------------------------|------------------------------|
| **Arquivo Config**| `.env`                        | Railway Variables            |
| **Banco de Dados**| SQLite (`dev.db`)             | PostgreSQL (Railway)         |
| **URL**           | `http://localhost:3000`       | `https://...railway.app`     |
| **Email**         | Mailtrap/Ethereal             | Gmail ou SMTP real           |
| **Stripe**        | Chaves de teste (`sk_test_`)  | Chaves de produção (`sk_live_`)|
| **NODE_ENV**      | `development`                 | `production`                 |
| **Logs**          | Console local                 | Railway Logs                 |

---

## 🧪 TESTANDO CONFIGURAÇÃO

### Verificar Variáveis Locais

```bash
# Ver se .env existe
ls -la .env

# Ver conteúdo (sem mostrar senhas)
cat .env | grep -v "PASS\|SECRET\|KEY"
```

### Testar Conexão com Banco

```bash
# SQLite local
npx prisma studio

# PostgreSQL produção
DATABASE_URL="postgresql://..." npx prisma studio
```

### Testar Aplicação Local

```bash
# Iniciar servidor
npm run dev

# Acessar
http://localhost:3000

# Testar login
Email: admin@agendasalao.com.br
Senha: admin123
```

### Verificar Variáveis no Railway

1. Railway Dashboard → Variables
2. Confirme que todas as 7 estão presentes
3. Verifique `NEXTAUTH_URL` (deve ser HTTPS)

---

## 🆘 TROUBLESHOOTING

### Erro: "Failed to connect to database"

**Local:**
```bash
# Verificar se dev.db existe
ls -la prisma/dev.db

# Recriar banco
rm prisma/dev.db
npx prisma migrate dev
```

**Produção:**
- Verifique `DATABASE_URL` no Railway
- Confirme que PostgreSQL está rodando

### Erro: "NEXTAUTH_SECRET is not defined"

**Local:**
```bash
# Verificar .env
cat .env | grep NEXTAUTH_SECRET

# Se vazio, adicione:
NEXTAUTH_SECRET="+SVcPHuRvto/Y1jb/irnG7lvcg5j9/RCNI8ud80JV1g="
```

**Produção:**
- Adicione no Railway Variables
- Aguarde redeploy

### Erro: "Cannot send email"

**Verifique:**
1. Credenciais SMTP corretas
2. Gmail: precisa senha de app (não senha normal)
3. Mailtrap: username/password copiados certos

---

## 📚 REFERÊNCIAS

### Documentação Oficial

- Next.js Env Variables: https://nextjs.org/docs/basic-features/environment-variables
- Prisma: https://www.prisma.io/docs/guides/development-environment
- NextAuth: https://next-auth.js.org/configuration/options
- Stripe: https://stripe.com/docs/keys
- Railway: https://docs.railway.app/develop/variables

### Ferramentas Úteis

- Mailtrap: https://mailtrap.io
- Ethereal Email: https://ethereal.email
- Stripe Test Cards: https://stripe.com/docs/testing
- Gerar Secret: `openssl rand -base64 32`

---

## ✅ CHECKLIST DE CONFIGURAÇÃO

### Desenvolvimento Local

- [ ] Arquivo `.env` criado
- [ ] `DATABASE_URL` com SQLite
- [ ] `NEXTAUTH_SECRET` configurado
- [ ] `NEXTAUTH_URL` = http://localhost:3000
- [ ] Email configurado (Mailtrap/Gmail)
- [ ] Stripe com chaves de teste
- [ ] `npx prisma generate` executado
- [ ] `npx prisma migrate dev` executado
- [ ] Seed executado (dados de teste)
- [ ] `npm run dev` funcionando

### Produção (Railway)

- [ ] PostgreSQL adicionado ao projeto
- [ ] `DATABASE_URL` configurado automaticamente
- [ ] `NEXTAUTH_SECRET` adicionado
- [ ] `NEXTAUTH_URL` com URL do Railway (HTTPS)
- [ ] `NODE_ENV` = production
- [ ] Stripe configurado (test ou live)
- [ ] Migrations aplicadas em produção
- [ ] Seed de produção executado
- [ ] Aplicação acessível via HTTPS
- [ ] Login funcionando

---

**Criado em**: 04/11/2025  
**Autor**: GitHub Copilot  
**Status**: Guia completo e testado ✅
