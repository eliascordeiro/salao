# 🔍 Verificar se Migration Foi Aplicada em Produção (Railway)

## Método 1: Verificar Logs do Railway

1. Acesse: https://railway.app
2. Seu projeto → Service (aplicação)
3. Tab **"Deployments"**
4. Clique no último deploy
5. Ver logs de build

**Procure por**:
```
Applying migration `20251104222817_add_reason_and_created_by_to_availability`
✔ Migration applied successfully
```

---

## Método 2: Testar a API Diretamente

```bash
# Tentar criar um slot em produção
curl -X POST https://salao-production.up.railway.app/api/availabilities \
  -H "Content-Type: application/json" \
  -d '{
    "staffId": "staff-1",
    "dayOfWeek": 1,
    "startTime": "09:00",
    "endTime": "10:00",
    "available": true,
    "type": "RECURRING"
  }'
```

**Se retornar**:
- ✅ **201 Created**: Migration aplicada!
- ❌ **500 Internal Server Error**: Migration NÃO aplicada
- ❌ **401 Unauthorized**: Variáveis de ambiente faltando

---

## Método 3: Forçar Redeploy no Railway

### Opção A: Trigger Manual

1. Railway Dashboard → Seu Projeto
2. Service → Tab "Settings"
3. Scroll até "Danger Zone"
4. Clicar em **"Redeploy"**
5. Aguardar (~2-3 minutos)

### Opção B: Git Push (Qualquer Alteração)

```bash
# Fazer qualquer commit
git commit --allow-empty -m "chore: Trigger redeploy"
git push
```

Railway detecta o push e faz redeploy automático.

---

## Método 4: Conectar no Banco Railway e Verificar

```bash
# 1. Pegar DATABASE_URL do Railway
# Railway Dashboard → PostgreSQL → Variables → DATABASE_URL

# 2. Conectar via psql
psql "postgresql://postgres:..."

# 3. Verificar estrutura da tabela
\d+ "Availability"

# 4. Verificar se campos existem
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'Availability' 
AND column_name IN ('reason', 'createdBy');
```

**Se mostrar os 2 campos**: ✅ Migration aplicada!
**Se não mostrar**: ❌ Migration NÃO aplicada

---

## ⚠️ IMPORTANTE: Ordem de Configuração

Para a produção funcionar 100%, você precisa:

### 1️⃣ Adicionar Variáveis de Ambiente (PRIMEIRO!)

**Railway Dashboard → Service → Variables**

```bash
NEXTAUTH_SECRET = +SVcPHuRvto/Y1jb/irnG7lvcg5j9/RCNI8ud80JV1g=
NEXTAUTH_URL = https://salao-production.up.railway.app
NODE_ENV = production
STRIPE_SECRET_KEY = sk_test_placeholder
STRIPE_PUBLISHABLE_KEY = pk_test_placeholder
STRIPE_WEBHOOK_SECRET = whsec_placeholder
```

✅ Isso vai **automaticamente** triggerar um redeploy

### 2️⃣ Aguardar Redeploy (~2-3 min)

Durante o redeploy, Railway vai:
- ✅ Baixar código mais recente do GitHub
- ✅ Instalar dependências (npm install)
- ✅ **Aplicar migrations** (`npx prisma migrate deploy`)
- ✅ Buildar aplicação (npm run build)
- ✅ Iniciar servidor

### 3️⃣ Popular Banco de Produção

```bash
# Pegar DATABASE_URL do Railway
DATABASE_URL_PRODUCTION="postgresql://postgres:..." npm run db:seed:prod
```

### 4️⃣ Testar Aplicação

- https://salao-production.up.railway.app
- Login: admin@agendasalao.com.br / admin123
- Testar criar horários

---

## 📊 Status Provável Atual

| Item | Status |
|------|--------|
| Migration commitada no Git | ✅ |
| Migration enviada para GitHub | ✅ |
| **Migration aplicada em PRODUÇÃO** | ❌ **Provavelmente NÃO** |
| Variáveis de ambiente no Railway | ❌ **Faltando** |
| Redeploy recente | ❌ **Não** |
| Banco populado em produção | ❌ **Não** |

---

## 🎯 Próximos Passos (Em Ordem)

1. ⏳ **Adicionar variáveis no Railway** (isso vai triggerar redeploy)
2. ⏳ Aguardar redeploy terminar (~2-3 min)
3. ⏳ Verificar logs para confirmar migration aplicada
4. ⏳ Popular banco de produção
5. ⏳ Testar aplicação

---

## 🆘 Se a Migration NÃO Foi Aplicada

### Opção 1: Aguardar Próximo Deploy

Quando você adicionar as variáveis de ambiente, o Railway vai automaticamente:
1. Fazer redeploy
2. Aplicar todas as migrations pendentes
3. Buildar e iniciar a aplicação

### Opção 2: Aplicar Manualmente

```bash
# 1. Pegar DATABASE_URL do Railway
DATABASE_URL="postgresql://..." npx prisma migrate deploy
```

Isso aplica todas as migrations pendentes diretamente no banco de produção.

---

## ✅ Como Confirmar que Deu Certo

### 1. Logs do Deploy Mostram

```
Applying migration `20251104222817_add_reason_and_created_by_to_availability`
✔ Applied migration successfully
```

### 2. API Retorna 201

```bash
POST /api/availabilities
Response: 201 Created ✅
```

### 3. Dashboard Funciona

- Profissionais → Horários
- Salvar horários
- **SEM erro 500** ✅

---

**Conclusão**: A migration foi enviada para o GitHub, mas **ainda não foi aplicada em produção**. Será aplicada automaticamente quando você adicionar as variáveis de ambiente no Railway (isso vai triggerar o redeploy).
