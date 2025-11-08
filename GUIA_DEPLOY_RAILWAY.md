# 🚀 Guia Completo de Deploy no Railway

## ✅ Preparações Concluídas

- ✅ Schema migrado para PostgreSQL
- ✅ `.gitignore` configurado
- ✅ `.env.example` atualizado
- ✅ `railway.json` criado
- ✅ `package.json` com scripts de produção
- ✅ `next.config.mjs` otimizado
- ✅ `.eslintrc.json` configurado
- ✅ README.md com documentação completa
- ✅ Git inicializado
- ⏳ Build em andamento (`npm run build`)

## 📋 Próximos Passos

### 1️⃣ Finalizar Git (AGUARDANDO BUILD)

```bash
# Após o build concluir com sucesso:
git add .
git commit -m "🎉 Initial commit: Sistema completo de agendamento para salões"

# Configurar git user (se necessário):
git config user.email "seu-email@gmail.com"
git config user.name "Seu Nome"
```

### 2️⃣ Criar Repositório no GitHub

1. Acesse: https://github.com/new
2. Nome sugerido: `sistema-agendamento-salao`
3. Descrição: `Sistema completo de gestão e agendamento online para salões de beleza e barbearias`
4. **NÃO marque** "Initialize with README" (já temos um)
5. Clique em "Create repository"

### 3️⃣ Conectar ao GitHub

```bash
# Substituir <SEU-USUARIO> pelo seu usuário do GitHub
git remote add origin https://github.com/<SEU-USUARIO>/sistema-agendamento-salao.git
git branch -M main
git push -u origin main
```

### 4️⃣ Criar Projeto no Railway

1. **Acesse**: https://railway.app
2. **Faça login** com GitHub
3. Clique em **"New Project"**
4. Selecione **"Deploy from GitHub repo"**
5. Escolha o repositório `sistema-agendamento-salao`
6. Railway iniciará o deploy automaticamente

### 5️⃣ Adicionar PostgreSQL no Railway

1. No projeto Railway, clique em **"+ New"**
2. Selecione **"Database"**
3. Escolha **"Add PostgreSQL"**
4. Railway criará o banco e a variável `DATABASE_URL` automaticamente

### 6️⃣ Configurar Variáveis de Ambiente

No painel do Railway, vá em **"Variables"** e adicione:

#### Obrigatórias:

```env
# NextAuth (gere o secret com: openssl rand -base64 32)
NEXTAUTH_SECRET=cole-aqui-o-secret-gerado
NEXTAUTH_URL=https://seu-app.up.railway.app

# Node
NODE_ENV=production
```

#### Opcionais (Email):

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-de-app
EMAIL_FROM=Seu Salão <noreply@seusalao.com>
```

**Como gerar senha de app do Gmail:**
1. Acesse: https://myaccount.google.com/security
2. Ative "Verificação em duas etapas"
3. Vá em "Senhas de app"
4. Crie uma senha para "Outro (nome personalizado)"
5. Use essa senha de 16 dígitos no `SMTP_PASS`

#### Opcionais (Stripe):

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Como configurar Stripe:**
1. Crie conta em: https://stripe.com
2. Pegue as chaves em: https://dashboard.stripe.com/apikeys
3. Configure webhook em: https://dashboard.stripe.com/webhooks
   - URL: `https://seu-app.up.railway.app/api/webhooks/stripe`
   - Eventos: `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`

### 7️⃣ Aguardar Deploy

Railway detecta automaticamente o `railway.json` e executa:
1. `npm install` - Instala dependências
2. `prisma generate` - Gera cliente Prisma
3. `npm run build` - Build do Next.js
4. `prisma migrate deploy` - Roda migrations
5. `npm start` - Inicia servidor

**Tempo estimado:** 3-5 minutos

### 8️⃣ Popular Banco de Dados

Após o primeiro deploy bem-sucedido:

**Opção A: Via Railway CLI**
```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Fazer login
railway login

# Linkar ao projeto
railway link

# Rodar seed
railway run npm run db:seed
```

**Opção B: Via Console do Railway**
1. Vá em "PostgreSQL" → "Data"
2. Use o Prisma Studio ou execute SQL diretamente

### 9️⃣ Acessar Aplicação

URL: `https://seu-app.up.railway.app`

**Credenciais Padrão (após seed):**
- **Admin:** admin@agendasalao.com.br / admin123
- **Cliente:** pedro@exemplo.com / cliente123

⚠️ **IMPORTANTE:** Altere estas senhas após o primeiro acesso!

## 🔧 Comandos Úteis

### Gerar NEXTAUTH_SECRET
```bash
openssl rand -base64 32
```

### Ver logs do Railway
```bash
railway logs
```

### Rodar comando no Railway
```bash
railway run <comando>
```

### Conectar ao banco PostgreSQL
```bash
railway connect postgres
```

### Fazer deploy manual
```bash
git push origin main
# Railway detecta automaticamente e faz redeploy
```

## 🐛 Troubleshooting

### Deploy falha no build
- Verifique se `NODE_ENV=production` está definido
- Verifique logs: `railway logs`
- Teste local: `npm run build`

### Erro de migrations
```bash
# Resetar migrations (cuidado em produção!)
railway run npx prisma migrate reset

# Forçar migrations
railway run npx prisma migrate deploy
```

### Erro de conexão com banco
- Verifique se PostgreSQL está rodando
- Verifique se `DATABASE_URL` está correta
- Teste conexão: `railway run npx prisma db push`

### Emails não estão sendo enviados
- Verifique variáveis SMTP_*
- Use senha de app, não senha normal
- Verifique logs do Railway

### Erro 500 no login
- Verifique se `NEXTAUTH_SECRET` está definido
- Verifique se `NEXTAUTH_URL` está correto (https://)

## 📊 Monitoramento

### Ver métricas
Railway Dashboard → Metrics:
- CPU
- RAM
- Network
- Disk

### Ver logs em tempo real
```bash
railway logs --follow
```

### Ver logs específicos
```bash
railway logs --service=web
railway logs --service=postgres
```

## 💰 Custos

**Plano Gratuito Railway:**
- $5 de crédito por mês
- 500 horas de execução
- PostgreSQL incluído
- Suficiente para desenvolvimento e testes

**Plano Pago:**
- $5/mês por serviço
- Recursos ilimitados
- Necessário para produção com tráfego

## 🔐 Segurança em Produção

✅ **Checklist:**
- [ ] Alterar senhas padrão
- [ ] Usar HTTPS (Railway faz automaticamente)
- [ ] Configurar CORS se necessário
- [ ] Usar variáveis de ambiente para secrets
- [ ] Ativar 2FA no GitHub e Railway
- [ ] Fazer backup regular do banco
- [ ] Monitorar logs de erro
- [ ] Configurar alertas no Railway

## 📝 Notas Finais

- **Railway.json** já está configurado para deploy automático
- **Migrations** rodam automaticamente no deploy
- **Prisma Client** é gerado automaticamente
- **Build** é otimizado para produção
- **Logs** são mantidos por 7 dias no plano gratuito

## 🎉 Pronto!

Seu sistema estará no ar em poucos minutos! 🚀

Qualquer dúvida, consulte:
- Railway Docs: https://docs.railway.app
- Next.js Docs: https://nextjs.org/docs
- Prisma Docs: https://www.prisma.io/docs
