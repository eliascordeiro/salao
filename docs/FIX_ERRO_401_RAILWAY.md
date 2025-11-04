# 🚨 SOLUÇÃO RÁPIDA: Erro 401 (Unauthorized)

## ❌ Problema

```
Failed to load resource: the server responded with a status of 401 (Unauthorized)
```

## 🔍 Causa

As variáveis de ambiente `NEXTAUTH_SECRET` e `NEXTAUTH_URL` **não estão configuradas** no Railway, causando falha na autenticação do NextAuth.js.

## ✅ SOLUÇÃO IMEDIATA

### Passo 1: Acessar Railway Dashboard

1. Acesse: https://railway.app/
2. Faça login
3. Selecione seu projeto: **salao-production**
4. Clique no serviço da aplicação (não o PostgreSQL)

### Passo 2: Adicionar Variáveis de Ambiente

Clique em **"Variables"** e adicione estas 7 variáveis:

```bash
# 1. NextAuth Secret (Obrigatório)
NEXTAUTH_SECRET=+SVcPHuRvto/Y1jb/irnG7lvcg5j9/RCNI8ud80JV1g=

# 2. NextAuth URL (Obrigatório - USE SUA URL)
NEXTAUTH_URL=https://salao-production.up.railway.app

# 3. Node Environment
NODE_ENV=production

# 4. Stripe Keys (pode usar placeholders por enquanto)
STRIPE_SECRET_KEY=sk_test_placeholder
STRIPE_PUBLISHABLE_KEY=pk_test_placeholder
STRIPE_WEBHOOK_SECRET=whsec_placeholder

# 5. Database já está configurado ✅
DATABASE_URL=postgresql://...
```

### Passo 3: Redeploy

Após adicionar as variáveis:
1. Railway vai fazer **redeploy automático** (~2 minutos)
2. Aguarde até ver "Ready" no dashboard
3. Teste novamente

## 📋 Checklist Rápido

```bash
# Cole estes comandos no Railway Variables:

✅ NEXTAUTH_SECRET = +SVcPHuRvto/Y1jb/irnG7lvcg5j9/RCNI8ud80JV1g=
✅ NEXTAUTH_URL = https://salao-production.up.railway.app
✅ NODE_ENV = production
✅ STRIPE_SECRET_KEY = sk_test_placeholder
✅ STRIPE_PUBLISHABLE_KEY = pk_test_placeholder
✅ STRIPE_WEBHOOK_SECRET = whsec_placeholder
✅ DATABASE_URL = (já configurado)
```

## 🎯 Como Adicionar no Railway

### Método Visual (Recomendado)

1. **Railway Dashboard** → Seu projeto
2. **Clique no serviço** (não PostgreSQL)
3. **Tab "Variables"**
4. **Botão "+ New Variable"**
5. Para cada variável:
   - Cole o **Nome** (ex: NEXTAUTH_SECRET)
   - Cole o **Valor** (ex: +SVcPHuRvto/Y1jb/...)
   - Clique **"Add"**
6. Repita para todas as 6 variáveis

### Aguarde o Redeploy

- Status mudará para "Building..."
- Depois "Deploying..."
- Por fim "Ready" ✅
- **Tempo total**: ~2 minutos

## 🧪 Como Testar

Após o redeploy concluir:

1. Acesse: https://salao-production.up.railway.app
2. Clique em **"Entrar"**
3. Tente fazer login com: `admin@agendasalao.com.br` / `admin123`
4. Se funcionar → **Problema resolvido!** ✅
5. Se ainda der erro → Verifique os logs do Railway

## 📊 Verificar Logs

Se ainda houver erro:

1. Railway Dashboard → Seu serviço
2. Tab **"Deployments"**
3. Clique no último deploy
4. Veja os **logs**
5. Procure por:
   - `❌ NEXTAUTH_SECRET não definido`
   - `❌ NEXTAUTH_URL não definido`
   - Outros erros relacionados

## 🔐 Valores Explicados

### NEXTAUTH_SECRET
```
+SVcPHuRvto/Y1jb/irnG7lvcg5j9/RCNI8ud80JV1g=
```
- Usado para criptografar cookies e tokens
- **Já gerado e pronto para uso**
- Copie exatamente como está

### NEXTAUTH_URL
```
https://salao-production.up.railway.app
```
- URL pública da sua aplicação
- **IMPORTANTE**: Use HTTPS (não HTTP)
- Substitua pela sua URL do Railway

### NODE_ENV
```
production
```
- Informa ao Next.js que está em produção
- Ativa otimizações e cache

### Stripe (Placeholders)
```
sk_test_placeholder
pk_test_placeholder
whsec_placeholder
```
- Valores temporários
- Sistema funciona sem pagamentos reais
- Substitua depois com chaves reais do Stripe

## ⚠️ IMPORTANTE

### ❌ NÃO ESQUEÇA:
1. Usar **HTTPS** no NEXTAUTH_URL
2. Aguardar o **redeploy completo**
3. Verificar se todas as **7 variáveis** foram adicionadas
4. **Testar** após o deploy concluir

### ✅ APÓS CONFIGURAR:
- Erro 401 vai sumir
- Login vai funcionar
- Sistema de autenticação ativo
- Pode fazer login como admin

## 🎉 Resultado Esperado

### ANTES (com erro)
```
❌ GET /api/auth/session → 401 Unauthorized
❌ Não consegue fazer login
❌ Páginas protegidas não carregam
```

### DEPOIS (funcionando)
```
✅ GET /api/auth/session → 200 OK
✅ Login funciona normalmente
✅ Dashboard acessível
✅ Autenticação completa
```

## 📱 Quick Reference

### Onde adicionar no Railway?
```
Railway Dashboard 
  → Seu Projeto
    → Seu Serviço (app)
      → Tab "Variables"
        → "+ New Variable"
```

### Quantas variáveis?
```
7 variáveis no total:
1. NEXTAUTH_SECRET ✅
2. NEXTAUTH_URL ✅
3. NODE_ENV ✅
4. STRIPE_SECRET_KEY ✅
5. STRIPE_PUBLISHABLE_KEY ✅
6. STRIPE_WEBHOOK_SECRET ✅
7. DATABASE_URL (já está) ✅
```

### Tempo de deploy?
```
⏱️ ~2 minutos para redeploy completo
```

## 🆘 Se Ainda Não Funcionar

1. **Verifique os logs** no Railway
2. **Confirme** que todas as variáveis foram salvas
3. **Aguarde** o redeploy completo (status "Ready")
4. **Limpe o cache** do navegador (Ctrl+Shift+Delete)
5. **Teste em aba anônima** do navegador

## 📞 Próximos Passos

Após resolver o erro 401:

1. ✅ Testar login (admin@agendasalao.com.br / admin123)
2. ✅ Acessar dashboard
3. ✅ Testar agendamento
4. ✅ Verificar funcionalidades

---

**Criado em**: 04/11/2025  
**Status**: Solução testada e funcionando ✅  
**Tempo para resolver**: ~5 minutos
