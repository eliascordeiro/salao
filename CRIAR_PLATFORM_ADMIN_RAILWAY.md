# 🚀 Como Criar PLATFORM_ADMIN no Railway

## 📋 Problema
As credenciais `platform@salaoblza.com.br` não funcionam em produção porque o usuário **não existe no banco do Railway**.

## ✅ Solução: 3 Métodos

---

## **Método 1: Railway CLI (RECOMENDADO)** ⭐

### 1. Instalar Railway CLI (se ainda não tiver)
```bash
# Linux/Mac
curl -fsSL https://railway.app/install.sh | sh

# Ou via NPM
npm install -g @railway/cli
```

### 2. Fazer login no Railway
```bash
railway login
```

### 3. Linkar seu projeto
```bash
cd /caminho/para/SalaoBlza
railway link
# Selecione seu projeto na lista
```

### 4. Executar o script
```bash
railway run node create-platform-admin-railway.js
```

**Saída esperada:**
```
🔧 Criando usuário PLATFORM_ADMIN no Railway...
➕ Criando novo usuário PLATFORM_ADMIN...
✅ Platform Admin criado com sucesso!
   📧 Email: platform@salaoblza.com.br
   🎭 Role: PLATFORM_ADMIN
```

---

## **Método 2: Railway Dashboard (Web)** 🌐

### 1. Acessar Railway Dashboard
- Vá para: https://railway.app
- Entre no seu projeto

### 2. Abrir Database
- Clique em **PostgreSQL** (seu banco de dados)
- Clique em **Data** (aba superior)

### 3. Executar SQL
Clique em **Query** e execute:

```sql
-- 1. Verificar se usuário existe
SELECT id, email, name, role FROM "User" WHERE email = 'platform@salaoblza.com.br';

-- 2. Se NÃO existir, criar:
INSERT INTO "User" (
  id, 
  email, 
  name, 
  password, 
  role, 
  phone, 
  active, 
  "createdAt", 
  "updatedAt"
) VALUES (
  gen_random_uuid()::text,
  'platform@salaoblza.com.br',
  'Platform Administrator',
  '$2a$10$YourHashedPasswordHere',  -- ⚠️ VER NOTA ABAIXO
  'PLATFORM_ADMIN',
  '(11) 00000-0000',
  true,
  NOW(),
  NOW()
);

-- 3. Se JÁ existir, atualizar role:
UPDATE "User" 
SET 
  role = 'PLATFORM_ADMIN',
  name = 'Platform Administrator'
WHERE email = 'platform@salaoblza.com.br';
```

⚠️ **NOTA sobre senha hasheada:**
O método SQL direto é complicado porque precisa de senha bcrypt. **Use Método 1 ou 3.**

---

## **Método 3: Script Local apontando para Railway** 💻

### 1. Pegar Connection String do Railway
```bash
# No Railway Dashboard:
# Projeto → PostgreSQL → Connect → Connection String
# Copie a URL completa
```

### 2. Executar localmente
```bash
# Na sua máquina local
DATABASE_URL="postgresql://postgres:senha@host:porta/railway" \
PLATFORM_ADMIN_EMAIL="platform@salaoblza.com.br" \
PLATFORM_ADMIN_PASSWORD="SuperAdmin2026!" \
node create-platform-admin-railway.js
```

**Exemplo real:**
```bash
DATABASE_URL="postgresql://postgres:bfzNahVPyVcwzIewNotORAKWJFOZiFpW@gondola.proxy.rlwy.net:20615/railway" \
node create-platform-admin-railway.js
```

---

## 🔧 **Configurar Variáveis no Railway** (Opcional)

Se quiser customizar email/senha:

1. **Railway Dashboard → Seu Projeto → Variables**
2. Adicionar:
   ```
   PLATFORM_ADMIN_EMAIL=seu-email@exemplo.com
   PLATFORM_ADMIN_PASSWORD=SuaSenhaSegura123!
   ```
3. **Redeploy** o projeto
4. Executar script novamente

---

## 🧪 **Verificar se funcionou**

### 1. Consultar banco
```bash
railway run npx prisma studio
```

### 2. Ou via SQL:
```sql
SELECT id, email, name, role, active 
FROM "User" 
WHERE role = 'PLATFORM_ADMIN';
```

**Resultado esperado:**
```
email: platform@salaoblza.com.br
role: PLATFORM_ADMIN
active: true
```

### 3. Testar login
```
URL: https://seu-app.up.railway.app/login
Email: platform@salaoblza.com.br
Senha: SuperAdmin2026!
```

Após login, você será redirecionado para `/platform-admin` ✅

---

## ❌ **Troubleshooting**

### Erro: "User already exists"
**Solução:** O usuário existe mas com role errada. Atualizar:
```bash
railway run node create-platform-admin-railway.js
# O script detecta e atualiza automaticamente
```

### Erro: "Unauthorized"
**Causa:** Middleware bloqueando porque role não é PLATFORM_ADMIN

**Verificar:**
```sql
SELECT role FROM "User" WHERE email = 'platform@salaoblza.com.br';
```

Deve retornar: `PLATFORM_ADMIN` (não `ADMIN`)

### Erro: "Connection refused"
**Causa:** DATABASE_URL incorreta

**Solução:** Pegar nova connection string do Railway

### Senha não funciona
**Solução:** Resetar senha executando o script novamente

---

## 📝 **Checklist Final**

- [ ] Railway CLI instalado
- [ ] Projeto linkado (`railway link`)
- [ ] Script executado (`railway run node create-platform-admin-railway.js`)
- [ ] Usuário criado (verificar com `SELECT`)
- [ ] Login testado em produção
- [ ] Redirecionado para `/platform-admin`
- [ ] Dashboard carregando métricas

---

## 🎯 **Resumo Rápido**

**Mais fácil (1 comando):**
```bash
railway run node create-platform-admin-railway.js
```

**Se não tiver Railway CLI:**
```bash
DATABASE_URL="sua-connection-string-aqui" node create-platform-admin-railway.js
```

**URL de acesso:**
```
https://seu-app.up.railway.app/platform-admin
platform@salaoblza.com.br / SuperAdmin2026!
```

---

## 📞 **Precisa de Ajuda?**

Se nenhum método funcionar, me envie:
1. Saída do comando `railway run node create-platform-admin-railway.js`
2. Screenshot do erro de login
3. Resultado da query SQL: `SELECT * FROM "User" WHERE email = 'platform@salaoblza.com.br'`

---

**Última atualização:** 12/01/2026  
**Script:** `create-platform-admin-railway.js`
