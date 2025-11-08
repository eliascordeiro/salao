# 🚀 Guia de Deploy - Railway

## ✅ Status do Deploy

**Commit atual**: `317fda6` - feat: modernizar formulários e corrigir bugs de edição  
**Branch**: `main`  
**Push**: ✅ Concluído  
**Data**: 5 de novembro de 2025

---

## 📋 Pré-requisitos

- [x] Código commitado e enviado para GitHub
- [ ] Conta no Railway (https://railway.app)
- [ ] PostgreSQL provisionado no Railway
- [ ] Variáveis de ambiente configuradas

---

## 🎯 Passo a Passo - Deploy no Railway

### **1. Criar Projeto no Railway**

1. Acesse https://railway.app
2. Faça login com GitHub
3. Clique em **"New Project"**
4. Selecione **"Deploy from GitHub repo"**
5. Escolha o repositório: `eliascordeiro/salao`
6. Clique em **"Deploy Now"**

### **2. Adicionar PostgreSQL**

1. No projeto Railway, clique em **"+ New"**
2. Selecione **"Database" → "PostgreSQL"**
3. Aguarde o provisionamento (1-2 minutos)
4. O Railway irá gerar automaticamente a variável `DATABASE_URL`

### **3. Configurar Variáveis de Ambiente**

No Railway Dashboard, vá em:
- **Projeto → Serviço (seu app) → Variables**

Adicione as seguintes variáveis:

```bash
# ===== OBRIGATÓRIAS =====
NEXTAUTH_SECRET=+SVcPHuRvto/Y1jb/irnG7lvcg5j9/RCNI8ud80JV1g=
NEXTAUTH_URL=https://seu-app.up.railway.app
NODE_ENV=production

# ===== EMAIL (Configure um provedor) =====
# Opção 1: Gmail
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-de-app-16-digitos
EMAIL_FROM=AgendaSalão <noreply@agendasalao.com>

# Opção 2: Mailtrap (para testes)
# SMTP_HOST=sandbox.smtp.mailtrap.io
# SMTP_PORT=2525
# SMTP_USER=seu-username
# SMTP_PASS=sua-senha

# ===== STRIPE (Pagamentos) =====
# Use chaves de TESTE primeiro
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# DATABASE_URL é gerado automaticamente pelo Railway!
```

### **4. Configurar Domínio (Opcional)**

1. No Railway, vá em **Settings → Domains**
2. Clique em **"Generate Domain"**
3. Railway irá gerar um domínio: `salao-production.up.railway.app`
4. Atualize a variável `NEXTAUTH_URL` com o domínio gerado
5. **IMPORTANTE**: Não esqueça o `https://` no início!

### **5. Deploy Automático**

O Railway detectará as mudanças automaticamente:
- ✅ Instala dependências (`npm install --legacy-peer-deps`)
- ✅ Gera Prisma Client (`npx prisma generate`)
- ✅ Build do Next.js (`npm run build`)
- ✅ Migra banco de dados (`npx prisma migrate deploy`)
- ✅ Inicia aplicação (`npm start`)

### **6. Verificar Logs**

1. No Railway, clique no serviço (seu app)
2. Vá na aba **"Deployments"**
3. Clique no deploy ativo
4. Monitore os logs em tempo real
5. Procure por erros (em vermelho)

### **7. Seed do Banco de Dados (Opcional)**

Se quiser popular o banco com dados de exemplo:

```bash
# No Railway, vá em Settings → Service
# Adicione uma variável temporária:
RUN_SEED=true

# Depois do primeiro deploy, REMOVA a variável
```

Ou execute manualmente via Railway CLI:
```bash
railway run npm run db:seed:prod
```

---

## 🔍 Checklist Pós-Deploy

- [ ] App acessível no domínio Railway
- [ ] Login funcionando (admin@agendasalao.com.br / admin123)
- [ ] Dashboard carregando corretamente
- [ ] Banco de dados conectado (PostgreSQL)
- [ ] Emails sendo enviados (teste criar agendamento)
- [ ] Stripe funcionando (teste fazer pagamento)
- [ ] Sem erros nos logs do Railway

---

## 🛠️ Comandos Úteis - Railway CLI

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Conectar ao projeto
railway link

# Ver logs em tempo real
railway logs

# Abrir dashboard
railway open

# Rodar comando no servidor
railway run npm run db:studio
```

---

## 📊 Estrutura do Projeto

```
✅ app/                      - Next.js 14 App Router
✅ prisma/                   - Schema e migrações
✅ components/               - Componentes React
✅ lib/                      - Utilitários e configs
✅ public/                   - Arquivos estáticos
✅ railway.json             - Config de deploy
✅ package.json             - Scripts e dependências
✅ next.config.mjs          - Config Next.js
✅ tailwind.config.ts       - Config Tailwind
```

---

## 🐛 Troubleshooting

### **Erro: "Module not found"**
```bash
# Solução: Reinstale dependências
railway run npm install --legacy-peer-deps
```

### **Erro: "Prisma Client not generated"**
```bash
# Solução: Gere o Prisma Client
railway run npx prisma generate
```

### **Erro: "Database connection failed"**
```bash
# Verifique se a variável DATABASE_URL existe
railway variables

# Se não existir, adicione o PostgreSQL no projeto
```

### **Erro: "NEXTAUTH_SECRET missing"**
```bash
# Gere um novo secret
openssl rand -base64 32

# Adicione nas variáveis do Railway
```

### **App não abre (502 Bad Gateway)**
```bash
# Verifique se o build terminou com sucesso
railway logs --deployment <id>

# Verifique se todas as variáveis estão configuradas
railway variables
```

---

## 📝 Próximas Atualizações

Após fazer mudanças no código:

```bash
# 1. Commit e push
git add .
git commit -m "feat: sua mensagem"
git push origin main

# 2. Railway faz deploy automático!
# 3. Monitore os logs para verificar sucesso
```

---

## 🎉 Deploy Concluído!

Seu app está rodando em: **https://seu-dominio.up.railway.app**

### **Credenciais Padrão:**
- **Admin**: admin@agendasalao.com.br / admin123
- **Cliente**: pedro@exemplo.com / cliente123

### **Teste de Pagamento (Stripe):**
- **Cartão**: 4242 4242 4242 4242
- **Data**: Qualquer data futura
- **CVC**: Qualquer 3 dígitos

---

## 📞 Suporte

- Railway Docs: https://docs.railway.app
- Railway Community: https://discord.gg/railway
- Next.js Docs: https://nextjs.org/docs
- Prisma Docs: https://www.prisma.io/docs

---

**🚀 Bom deploy!**
