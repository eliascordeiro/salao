# 🚨 ERRO: Banco de Dados Não Encontrado

## Problema Identificado
O container da aplicação não consegue se conectar ao PostgreSQL porque:
- O serviço PostgreSQL não está configurado OU
- A variável `DATABASE_URL` não está definida OU
- Os serviços não estão linkados corretamente

---

## ✅ SOLUÇÃO: Passo a Passo

### 1️⃣ Adicionar PostgreSQL ao Projeto Railway

1. Acesse: https://railway.app/dashboard
2. Abra seu projeto (onde está a aplicação Next.js)
3. Clique no botão **"+ New"** (canto superior direito)
4. Selecione **"Database"**
5. Escolha **"Add PostgreSQL"**
6. Aguarde ~30 segundos para o PostgreSQL ser provisionado

### 2️⃣ Verificar a Variável DATABASE_URL

Após adicionar o PostgreSQL:

1. Clique no **serviço PostgreSQL** (card azul com ícone de banco)
2. Vá na aba **"Variables"**
3. Copie o valor de `DATABASE_URL`
   - Formato: `postgresql://postgres:[PASSWORD]@postgres.railway.internal:5432/railway`

### 3️⃣ Configurar DATABASE_URL na Aplicação

1. Clique no **serviço da aplicação Next.js** (card com seu código)
2. Vá na aba **"Variables"**
3. Clique em **"+ New Variable"**
4. Adicione:
   ```
   Nome: DATABASE_URL
   Valor: [Cole a URL copiada do PostgreSQL]
   ```
5. Clique em **"Add"**

**IMPORTANTE:** A URL deve ter o formato:
```
postgresql://postgres:SENHA@postgres.railway.internal:5432/railway
```

### 4️⃣ Redeployar a Aplicação

Opção A - Via GitHub (automático):
```bash
git commit --allow-empty -m "🔄 Trigger redeploy com DATABASE_URL"
git push
```

Opção B - Via Railway Dashboard:
1. Na aplicação Next.js, vá em **"Deployments"**
2. Clique nos 3 pontinhos do último deploy
3. Selecione **"Redeploy"**

---

## 🔍 Verificar Se Funcionou

Após o redeploy, os logs devem mostrar:

```
✅ Conexão com banco estabelecida!
🔄 Executando migrations...
✅ Migrations aplicadas com sucesso!
🚀 Iniciando aplicação...
```

---

## ⚠️ Problemas Comuns

### Erro: "Can't reach database server"
**Causa:** DATABASE_URL não está definida ou está incorreta
**Solução:** Verifique se copiou a URL correta do serviço PostgreSQL

### Erro: "password authentication failed"
**Causa:** Senha incorreta na URL
**Solução:** Copie novamente a DATABASE_URL do PostgreSQL (aba Variables)

### Erro: "database 'railway' does not exist"
**Causa:** O PostgreSQL ainda não foi totalmente inicializado
**Solução:** Aguarde 1 minuto e tente novamente

---

## 📋 Checklist Final

- [ ] Serviço PostgreSQL criado no Railway
- [ ] Serviço PostgreSQL está no mesmo projeto da aplicação
- [ ] DATABASE_URL copiada do PostgreSQL
- [ ] DATABASE_URL adicionada nas variáveis da aplicação
- [ ] Redeploy realizado
- [ ] Logs mostram "✅ Conexão com banco estabelecida!"

---

## 🆘 Ainda com problemas?

Se após seguir todos os passos o erro persistir:

1. **Capture os logs completos:**
   - Railway Dashboard → Aplicação → "View Logs"
   - Copie as últimas 50 linhas

2. **Verifique as variáveis:**
   - Aplicação → "Variables" → Confirme que DATABASE_URL existe
   - PostgreSQL → "Variables" → Copie novamente a URL

3. **Force um novo deploy:**
   ```bash
   git commit --allow-empty -m "🔄 Force redeploy"
   git push
   ```

---

## 📚 Próximos Passos (Após Resolver)

Depois que a aplicação subir com sucesso:

1. ✅ Acessar a URL da aplicação
2. ✅ Configurar outras variáveis de ambiente (Stripe, NextAuth)
3. ✅ Popular banco com dados iniciais (`npm run db:seed`)
4. ✅ Testar fluxo de agendamento
