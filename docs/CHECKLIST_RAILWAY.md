# ✅ Checklist: Atualização do Banco de Dados Railway

## 📊 Status Atual do Schema

### Migrações Locais Disponíveis:

1. ✅ **20251102000000_init** - Migração inicial
2. ✅ **20251104222817_add_reason_and_created_by_to_availability** - Campos adicionais
   - `Availability.reason` (TEXT opcional)
   - `Availability.createdBy` (TEXT opcional)
   - Índices para otimização
   - Melhorias em Payment, Transaction, Notification
3. ✅ **20251106225716_add_booking_type_to_salon** - Tipo de agendamento
   - `Salon.bookingType` (TEXT, padrão: 'BOTH')

### 🔧 Principais Alterações no Schema

#### Tabela `Salon`:
```sql
ALTER TABLE "Salon" ADD COLUMN "bookingType" TEXT NOT NULL DEFAULT 'BOTH';
```
- **DYNAMIC**: Apenas agendamento dinâmico
- **SLOT_BASED**: Apenas slots pré-definidos  
- **BOTH**: Ambos os modos (padrão)

#### Tabela `Availability`:
```sql
ALTER TABLE "Availability" 
  ADD COLUMN "createdBy" TEXT,
  ADD COLUMN "reason" TEXT;
```

#### Tabela `Notification`:
```sql
ALTER TABLE "Notification" 
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "email" TEXT NOT NULL,
  ADD COLUMN "error" TEXT,
  ADD COLUMN "subject" TEXT;
```

#### Tabela `Payment`:
```sql
ALTER TABLE "Payment" 
  ADD COLUMN "cancelledAt" TIMESTAMP(3),
  ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'BRL',
  ADD COLUMN "mercadopagoId" TEXT,
  ADD COLUMN "metadata" TEXT,
  ADD COLUMN "paidAt" TIMESTAMP(3),
  ADD COLUMN "provider" TEXT NOT NULL DEFAULT 'STRIPE';
```

#### Tabela `Transaction`:
```sql
ALTER TABLE "Transaction" 
  ADD COLUMN "errorCode" TEXT,
  ADD COLUMN "errorMessage" TEXT,
  ADD COLUMN "externalId" TEXT,
  ADD COLUMN "method" TEXT,
  ADD COLUMN "processedAt" TIMESTAMP(3);
```

---

## 🚀 Como Aplicar no Railway

### Opção 1: Via Railway Dashboard (Recomendado)

1. **Acesse o Railway Dashboard**
   - https://railway.app/dashboard
   - Selecione seu projeto

2. **Abra o Terminal do Service**
   - Clique no service da aplicação
   - Vá em "Settings" → "Service" → "Deploy"
   - Ou use a aba "Deployments"

3. **Execute as migrações**
   ```bash
   npx prisma migrate deploy
   ```

4. **Verifique o status**
   ```bash
   npx prisma migrate status
   ```

### Opção 2: Via Railway CLI

```bash
# 1. Instalar Railway CLI (se ainda não tiver)
npm i -g @railway/cli

# 2. Fazer login
railway login

# 3. Vincular ao projeto
railway link

# 4. Executar migrações
railway run npx prisma migrate deploy

# 5. Verificar status
railway run npx prisma migrate status
```

### Opção 3: Deploy Automático (Mais Simples)

O Railway pode aplicar as migrações automaticamente no deploy. Para isso:

1. **Verifique se o `package.json` tem o script correto:**
   ```json
   {
     "scripts": {
       "build": "prisma generate && next build",
       "postinstall": "prisma generate"
     }
   }
   ```

2. **Adicione script de deploy (opcional):**
   ```json
   {
     "scripts": {
       "railway:deploy": "prisma migrate deploy && npm run build"
     }
   }
   ```

3. **Configure no Railway Dashboard:**
   - Settings → Deploy
   - Build Command: `npm run build`
   - Start Command: `npm start`

---

## 🔍 Verificar se Railway Está Atualizado

### Método 1: Comparar Tabelas

Execute no Railway:

```sql
-- Ver estrutura da tabela Salon
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'Salon' 
ORDER BY ordinal_position;

-- Ver estrutura da tabela Availability
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'Availability' 
ORDER BY ordinal_position;
```

### Método 2: Verificar Migrações Aplicadas

```sql
SELECT * FROM "_prisma_migrations" 
ORDER BY finished_at DESC;
```

**Resultado esperado:**
```
migration_name                                      | finished_at
----------------------------------------------------|-------------------------
20251106225716_add_booking_type_to_salon           | 2025-11-06 22:57:16
20251104222817_add_reason_and_created_by_to_avai...| 2025-11-04 22:28:17
20251102000000_init                                 | 2025-11-02 00:00:00
```

### Método 3: Verificar Coluna Específica

```sql
-- Verificar se Salon.bookingType existe
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'Salon' 
  AND column_name = 'bookingType';
```

Se retornar **vazio**, o banco **NÃO está atualizado**.  
Se retornar **bookingType**, o banco **ESTÁ atualizado**.

---

## ⚠️ Importante

### Antes de Aplicar:

1. ✅ **Backup do Banco** (Railway faz automaticamente, mas confirme)
2. ✅ **Verificar se há dados em produção** que possam ser afetados
3. ✅ **Testar localmente** antes de aplicar em produção
4. ✅ **Revisar os logs** após aplicar

### Após Aplicar:

1. ✅ Verificar se a aplicação está funcionando
2. ✅ Testar as funcionalidades novas:
   - Sistema de configuração de tipo de agendamento
   - Bloqueios de horários com motivo
   - Sistema de pagamentos completo
3. ✅ Monitorar logs por 24h

---

## 📝 Logs de Migração

Após executar `prisma migrate deploy`, você verá:

```
The following migration(s) have been applied:

migrations/
  └─ 20251104222817_add_reason_and_created_by_to_availability/
    └─ migration.sql
  └─ 20251106225716_add_booking_type_to_salon/
    └─ migration.sql
  
All migrations have been successfully applied.
```

---

## 🆘 Troubleshooting

### Erro: "Migration failed"

```bash
# Ver detalhes do erro
railway run npx prisma migrate status

# Resetar estado (CUIDADO: pode perder dados)
railway run npx prisma migrate reset --skip-seed
```

### Erro: "Column already exists"

```sql
-- Verificar se coluna já existe
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'Salon' AND column_name = 'bookingType';

-- Se já existe, marcar migração como aplicada
INSERT INTO "_prisma_migrations" 
  (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
VALUES 
  (gen_random_uuid(), 'checksum', NOW(), '20251106225716_add_booking_type_to_salon', NULL, NULL, NOW(), 1);
```

### Erro: "Connection timeout"

```bash
# Verificar conectividade
railway run psql $DATABASE_URL -c "SELECT 1;"

# Verificar variáveis de ambiente
railway variables
```

---

## 📞 Próximos Passos

1. [ ] Verificar status atual do Railway
2. [ ] Aplicar migrações pendentes
3. [ ] Testar funcionalidades em produção
4. [ ] Atualizar documentação se necessário
5. [ ] Monitorar erros nos logs

---

**Data de criação:** 07/11/2025  
**Última atualização do schema:** 06/11/2025 (migration 20251106225716)
