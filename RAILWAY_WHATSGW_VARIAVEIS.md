# 🚂 Variáveis de Ambiente - Railway (Produção)

## ⚠️ IMPORTANTE: Remover Variáveis Antigas do Baileys

Antes de adicionar as novas, **DELETE** estas variáveis antigas (se existirem):

```
❌ EVOLUTION_API_URL
❌ EVOLUTION_API_KEY
❌ BAILEYS_*
```

---

## ✅ Variáveis Obrigatórias para WhatsGW

### 📱 **WhatsGW - Configuração**

#### **1. WHATSGW_URL**
```
Valor: https://app.whatsgw.com.br
```
**Descrição**: URL do serviço WhatsGW (cloud)

---

#### **2. WHATSGW_API_KEY**
```
Valor: 22541227-8ce2-4f47-8ace-7ace17f760cc
```
**Descrição**: Sua chave de API do WhatsGW

**⚠️ ATENÇÃO**: Esta é a chave de **TESTE** fornecida. Para produção:
1. Acesse https://app.whatsgw.com.br
2. Faça login na sua conta
3. Vá em "API" ou "Configurações"
4. Copie sua **API Key** real (diferente desta)
5. Substitua no Railway

---

#### **3. WHATSGW_PHONE_NUMBER**
```
Valor: 5541996123839
```
**Descrição**: Seu número WhatsApp conectado (com DDI)

**Formato**: `5541996123839` (sem espaços, sem caracteres especiais)
- `55` = Brasil (DDI)
- `41` = DDD (Curitiba)
- `996123839` = Número

**⚠️ ATENÇÃO**: Use o número que você conectou no painel WhatsGW!

---

## 🔧 Como Adicionar no Railway

### Via Dashboard (Recomendado)

1. Acesse: https://railway.app
2. Selecione seu projeto: **salao**
3. Clique no serviço (app Next.js)
4. Vá em **Variables** (aba lateral)
5. Clique em **+ New Variable**
6. Adicione cada variável:

```
Nome: WHATSGW_URL
Valor: https://app.whatsgw.com.br
```

```
Nome: WHATSGW_API_KEY
Valor: 22541227-8ce2-4f47-8ace-7ace17f760cc
```

```
Nome: WHATSGW_PHONE_NUMBER
Valor: 5541996123839
```

7. Clique em **Deploy** (ou aguarde redeploy automático)

---

### Via Railway CLI (Alternativa)

```bash
# Login
railway login

# Link ao projeto
railway link

# Adicionar variáveis
railway variables set WHATSGW_URL=https://app.whatsgw.com.br
railway variables set WHATSGW_API_KEY=22541227-8ce2-4f47-8ace-7ace17f760cc
railway variables set WHATSGW_PHONE_NUMBER=5541996123839

# Verificar
railway variables

# Redeploy
railway up
```

---

## 📋 Checklist Completo de Variáveis

Copie e cole estas variáveis no Railway:

### ✅ Banco de Dados
- ✅ `DATABASE_URL` - *(já configurado automaticamente pelo Railway)*

### ✅ Autenticação
- ✅ `NEXTAUTH_SECRET` - *(já configurado)*
- ✅ `NEXTAUTH_URL` - *(já configurado - URL do seu app)*

### ✅ WhatsApp (WhatsGW) - **ADICIONAR AGORA**
- ⬜ `WHATSGW_URL` → `https://app.whatsgw.com.br`
- ⬜ `WHATSGW_API_KEY` → `22541227-8ce2-4f47-8ace-7ace17f760cc`
- ⬜ `WHATSGW_PHONE_NUMBER` → `5541996123839`

### ✅ Email (SMTP)
- ⬜ `SMTP_HOST` → Ex: `smtp.gmail.com`
- ⬜ `SMTP_PORT` → Ex: `587`
- ⬜ `SMTP_SECURE` → `false`
- ⬜ `SMTP_USER` → Seu email
- ⬜ `SMTP_PASS` → Senha de app
- ⬜ `SMTP_FROM` → `"AgendaSalão <noreply@seudominio.com>"`

### ✅ Pagamentos (Stripe)
- ⬜ `STRIPE_SECRET_KEY` → `sk_test_...` ou `sk_live_...`
- ⬜ `STRIPE_PUBLISHABLE_KEY` → `pk_test_...` ou `pk_live_...`
- ⬜ `STRIPE_WEBHOOK_SECRET` → `whsec_...`

### ✅ Cron Jobs
- ⬜ `CRON_SECRET` → Token de 64 caracteres

### ✅ Ambiente
- ✅ `NODE_ENV` → `production`

---

## 🧪 Como Testar Após Deploy

1. **Aguarde o deploy finalizar** no Railway (1-2 minutos)

2. **Acesse seu app**:
   ```
   https://seu-app.up.railway.app
   ```

3. **Faça login** como admin

4. **Vá para WhatsApp**:
   ```
   https://seu-app.up.railway.app/dashboard/configuracoes/whatsapp
   ```

5. **Clique em "Atualizar Status"**:
   - ✅ Deve mostrar: "WhatsApp Conectado"
   - ✅ Número: `5541996123839`

6. **Envie mensagem de teste**:
   - Número: `5541996123839` (ou outro número teste)
   - Mensagem: `Teste Railway 🚀`
   - Clique em "Enviar Mensagem"
   - ✅ Deve exibir: "Mensagem enviada com sucesso! ID: XXXXXX"

---

## 🔍 Troubleshooting

### ❌ Erro: "Configuração incompleta"
**Causa**: Variáveis não definidas  
**Solução**: Verifique se as 3 variáveis estão no Railway

### ❌ Erro: "WhatsApp Desconectado"
**Causa**: Telefone não conectado no WhatsGW  
**Solução**:
1. Acesse https://app.whatsgw.com.br
2. Faça login
3. Verifique se o telefone está conectado
4. Reconecte se necessário

### ❌ Erro: "phone_state: Desconectado"
**Causa**: Sessão expirou  
**Solução**: Reconecte no painel WhatsGW

### ❌ Erro 401/403
**Causa**: API Key inválida  
**Solução**: Verifique se copiou a API Key correta do painel

---

## 📝 Notas Importantes

### 🔐 Segurança
- ⚠️ **NÃO** commite o `.env` no Git
- ⚠️ Use as chaves de **TESTE** do WhatsGW fornecidas
- ⚠️ Para produção real, gere suas próprias credenciais

### 🌍 URL do WhatsGW
- ✅ Use sempre: `https://app.whatsgw.com.br`
- ❌ Não use: `http://localhost:3000` (isso era pra testes locais)

### 📱 Formato do Telefone
- ✅ Correto: `5541996123839`
- ❌ Errado: `+55 (41) 99612-3839`
- ❌ Errado: `41996123839` (sem DDI)

### 🔄 Redeploy
- Ao adicionar variáveis, o Railway faz **redeploy automático**
- Aguarde 1-2 minutos
- Logs aparecem em **Deployments**

---

## 📚 Referências

- **WhatsGW Dashboard**: https://app.whatsgw.com.br
- **GitHub Oficial**: https://github.com/whatsgw/whatsgw
- **Documentação**: https://documenter.getpostman.com/view/3741041/SztBa7ku
- **Railway Docs**: https://docs.railway.app/develop/variables

---

## ✅ Resumo Rápido

**Copie e cole no Railway Variables:**

```env
WHATSGW_URL=https://app.whatsgw.com.br
WHATSGW_API_KEY=22541227-8ce2-4f47-8ace-7ace17f760cc
WHATSGW_PHONE_NUMBER=5541996123839
```

**Pronto!** 🚀 Após o deploy, teste em:
`https://seu-app.up.railway.app/dashboard/configuracoes/whatsapp`
