# 🚨 ERRO DE BUILD NO RAILWAY - SOLUÇÃO

## Problema Identificado
```
ERROR: failed to build: failed to solve: process "/bin/bash -ol pipefail -c npm install --legacy-peer-deps && npx prisma generate && npm run build" did not complete successfully: exit code: 1
```

O build está falando na fase de compilação. Pode ser causado por:
1. ❌ Falta de variáveis de ambiente durante o build
2. ❌ Erro no `prisma generate` (precisa de DATABASE_URL)
3. ❌ Erro no `npm run build` (Next.js)
4. ❌ Timeout ou falta de memória

---

## ✅ SOLUÇÃO COMPLETA

### 1️⃣ Configurar Variáveis de Ambiente no Railway

**CRÍTICO:** O Prisma precisa de `DATABASE_URL` durante o build!

No Railway Dashboard → Seu projeto → Aba "Variables", adicione:

```bash
# 1. DATABASE_URL (obrigatório para prisma generate)
DATABASE_URL=postgresql://postgres:SENHA@postgres.railway.internal:5432/railway

# 2. NEXTAUTH_SECRET (obrigatório)
NEXTAUTH_SECRET=sua-secret-aqui-use-openssl-rand-base64-32

# 3. NEXTAUTH_URL (obrigatório)
NEXTAUTH_URL=${{RAILWAY_PUBLIC_DOMAIN}}

# 4. NODE_ENV
NODE_ENV=production

# 5. STRIPE (se estiver usando)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# 6. EMAIL (se estiver usando)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASSWORD=sua-senha-app
SMTP_FROM=seu-email@gmail.com
```

**⚠️ IMPORTANTE:** 
- Use `${{RAILWAY_PUBLIC_DOMAIN}}` para NEXTAUTH_URL (Railway preenche automaticamente)
- Não use `http://` ou `https://` no NEXTAUTH_URL, Railway adiciona automaticamente

### 2️⃣ Verificar se o PostgreSQL está Criado

1. No Railway Dashboard, verifique se existe um **card do PostgreSQL**
2. Se NÃO existir:
   - Clique em **"+ New"** 
   - Selecione **"Database"** 
   - Escolha **"Add PostgreSQL"**
   - Aguarde ~30 segundos

3. Se já existir, copie a `DATABASE_URL`:
   - Clique no card do PostgreSQL
   - Aba "Connect"
   - Copie a URL no formato: `postgresql://...`

### 3️⃣ Atualizar package.json - Build Script

O script de build DEVE executar `prisma generate` antes do `next build`:

```json
{
  "scripts": {
    "build": "prisma generate && next build",
    "postinstall": "prisma generate"
  }
}
```

**Já está correto no seu projeto!** ✅

### 4️⃣ Verificar nixpacks.toml

Arquivo atualizado com as configurações corretas:

```toml
[phases.setup]
nixPkgs = ['nodejs_20', 'npm-10_x', 'openssl']

[phases.install]
cmds = [
  'npm ci --legacy-peer-deps || npm install --legacy-peer-deps'
]

[phases.build]
cmds = [
  'npx prisma generate',
  'npm run build'
]

[start]
cmd = 'bash start.sh'

[variables]
NODE_ENV = 'production'
```

**Já está atualizado!** ✅

### 5️⃣ Criar .railwayignore

Arquivo criado para reduzir tamanho do build:

```
node_modules
.next
.env.local
.env.development
*.log
.git
.github
docs
*.md
!README.md
test-*.js
debug-*.js
cleanup-*.js
seed-*.js
```

**Já está criado!** ✅

---

## 🔄 REDEPLOY

Após configurar as variáveis:

### Opção A - Force Redeploy via Dashboard
1. Railway Dashboard → Seu projeto
2. Aba "Deployments"
3. Clique nos 3 pontinhos do último deploy
4. Clique em **"Redeploy"**

### Opção B - Push para GitHub
```bash
git add .
git commit -m "🔧 Fix Railway build configuration"
git push origin main
```

O Railway detecta automaticamente e inicia novo deploy.

---

## 🐛 SE O ERRO PERSISTIR

### 1. Ver Logs Completos
No Railway Dashboard:
- Aba "Deployments"
- Clique no deploy que falhou
- Role até encontrar a linha exata do erro

### 2. Erros Comuns

#### Erro: "Environment variable not found: DATABASE_URL"
**Solução:** Adicionar `DATABASE_URL` nas variáveis (Passo 1️⃣)

#### Erro: "NEXTAUTH_SECRET must be provided"
**Solução:** Adicionar `NEXTAUTH_SECRET` nas variáveis (Passo 1️⃣)

#### Erro: "Cannot find module 'next'"
**Solução:** 
```bash
# Deletar package-lock.json do repo
git rm package-lock.json
git commit -m "Remove package-lock.json"
git push

# Railway vai gerar um novo no próximo build
```

#### Erro: "FATAL ERROR: Reached heap limit Allocation failed"
**Solução:** Aumentar memória do Node.js

Adicione nas variáveis do Railway:
```
NODE_OPTIONS=--max-old-space-size=4096
```

#### Erro: "Prisma schema not found"
**Solução:** Verificar se `prisma/schema.prisma` existe no repo

```bash
# Verificar localmente
ls -la prisma/schema.prisma

# Se não existir, algo está errado com o .gitignore
```

### 3. Limpar Cache do Railway

Se nada funcionar:
1. Railway Dashboard → Settings
2. Role até **"Danger Zone"**
3. Clique em **"Clear Build Cache"**
4. Force novo deploy

---

## ✅ CHECKLIST DE VERIFICAÇÃO

Antes de fazer redeploy, confirme:

- [ ] ✅ PostgreSQL criado no Railway
- [ ] ✅ `DATABASE_URL` configurada nas variáveis
- [ ] ✅ `NEXTAUTH_SECRET` configurada nas variáveis
- [ ] ✅ `NEXTAUTH_URL=${{RAILWAY_PUBLIC_DOMAIN}}` configurada
- [ ] ✅ `package.json` tem `"build": "prisma generate && next build"`
- [ ] ✅ `nixpacks.toml` atualizado
- [ ] ✅ `.railwayignore` criado
- [ ] ✅ Código commitado e pushed para GitHub

---

## 📊 LOGS ESPERADOS (Sucesso)

Quando funcionar, você verá nos logs:

```
✓ Prisma schema loaded from prisma/schema.prisma
✓ Generated Prisma Client
✓ Creating an optimized production build
✓ Compiled successfully
✓ Collecting page data
✓ Generating static pages (42/42)
✓ Finalizing page optimization

Build completed successfully!
```

---

## 🆘 AINDA COM PROBLEMAS?

1. **Copie os logs completos** do deploy que falhou
2. **Procure pela linha** que começa com `Error:` ou `FATAL:`
3. **Me envie** essa linha específica para análise detalhada

Geralmente o erro real está algumas linhas acima da mensagem `exit code: 1`.

---

## 📝 NOTAS IMPORTANTES

### DATABASE_URL Durante Build
O Prisma **PRECISA** da `DATABASE_URL` durante `prisma generate`, mesmo que não vá conectar no banco ainda. Isso é porque ele gera código TypeScript baseado no schema.

### NEXTAUTH_URL com Railway
Use `${{RAILWAY_PUBLIC_DOMAIN}}` para que o Railway preencha automaticamente com a URL do seu deploy (ex: `https://seu-app.up.railway.app`).

### NODE_ENV
Mantenha como `production` no Railway para otimizações de performance.

### Stripe Webhook
Se usar Stripe, após primeiro deploy bem-sucedido:
1. Copie a URL do seu app
2. Configure webhook no Stripe Dashboard
3. Atualize `STRIPE_WEBHOOK_SECRET` no Railway

---

## 🎯 RESUMO RÁPIDO

```bash
# 1. Configure variáveis no Railway (mínimo):
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=${{RAILWAY_PUBLIC_DOMAIN}}
NODE_ENV=production

# 2. Commit e push
git add .
git commit -m "🔧 Fix Railway build"
git push origin main

# 3. Aguarde deploy automático (~3-5 minutos)

# 4. Verifique logs no Railway Dashboard
```

**Primeira vez no Railway?** O primeiro deploy demora mais (~5-10 minutos). Deploys seguintes são mais rápidos (~2-3 minutos).
