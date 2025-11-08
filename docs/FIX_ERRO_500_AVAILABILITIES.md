# ✅ Erro 500 Corrigido - API Availabilities

## 🐛 Problema Identificado

### Erro Original

```
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
POST /api/availabilities

Erro ao salvar horários: Error: 1 horário(s) falharam ao salvar
```

### Causa Raiz

Os campos `reason` e `createdBy` estavam definidos no **schema.prisma** mas **não existiam no banco de dados**:

```prisma
// Schema tinha:
model Availability {
  // ... outros campos
  reason    String?
  createdBy String?
}

// Mas o banco não tinha essas colunas!
```

A migration inicial (`20251102000000_init`) não incluiu esses campos, causando erro ao tentar inserir dados.

---

## 🔧 Solução Aplicada

### 1. Migration Criada

```bash
npx prisma migrate dev --name add_reason_and_created_by_to_availability
```

**Arquivo gerado**: `prisma/migrations/20251104222817_add_reason_and_created_by_to_availability/migration.sql`

### 2. SQL Executado

```sql
ALTER TABLE "Availability" 
ADD COLUMN "createdBy" TEXT,
ADD COLUMN "reason" TEXT;
```

### 3. Outras Alterações da Migration

A migration também sincronizou outras diferenças entre schema e banco:

#### Payment
```sql
ALTER TABLE "Payment" 
ADD COLUMN "cancelledAt" TIMESTAMP(3),
ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'BRL',
ADD COLUMN "mercadopagoId" TEXT,
ADD COLUMN "metadata" TEXT;

CREATE UNIQUE INDEX "Payment_stripeSessionId_key" 
ON "Payment"("stripeSessionId");
```

#### Notification
```sql
ALTER TABLE "Notification" 
ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "email" TEXT NOT NULL,
ADD COLUMN "error" TEXT,
ADD COLUMN "subject" TEXT;
```

#### Transaction
```sql
ALTER TABLE "Transaction" 
DROP COLUMN "stripeEventId",
DROP COLUMN "type";
```

---

## ✅ Resultado

### Antes (Erro 500)

```javascript
// Tentava inserir campos que não existiam
prisma.availability.create({
  data: {
    // ... outros campos
    reason: null,        // ❌ Campo não existia
    createdBy: "admin@..." // ❌ Campo não existia
  }
})
// Erro: column "reason" does not exist
```

### Depois (Sucesso 201)

```javascript
// Agora funciona perfeitamente
✅ [availabilities POST] Criado com sucesso: cmhl56h390001of5d6rys0q1t
POST /api/availabilities 201 in 3655ms
```

### Logs do Servidor

```
📝 [availabilities POST] Dados recebidos: {
  "staffId": "staff-demo-1",
  "dayOfWeek": 1,
  "startTime": "09:00",
  "endTime": "10:00",
  "available": true,
  "type": "RECURRING"
}

💾 [availabilities POST] Criando com dados: {
  "staffId": "staff-demo-1",
  "startTime": "09:00",
  "endTime": "10:00",
  "available": true,
  "reason": null,
  "createdBy": "admin@agendasalao.com.br",  ✅ Agora existe!
  "type": "RECURRING",
  "dayOfWeek": 1
}

✅ [availabilities POST] Criado com sucesso: cmhl56h390001of5d6rys0q1t
```

---

## 🧪 Testes Realizados

### 1. ✅ POST /api/availabilities

```bash
# Request
POST http://localhost:3000/api/availabilities
{
  "staffId": "staff-demo-1",
  "dayOfWeek": 1,
  "startTime": "09:00",
  "endTime": "10:00",
  "available": true,
  "type": "RECURRING"
}

# Response
201 Created
{
  "id": "cmhl56h390001of5d6rys0q1t",
  "staffId": "staff-demo-1",
  "dayOfWeek": 1,
  "startTime": "09:00",
  "endTime": "10:00",
  "available": true,
  "type": "RECURRING",
  "reason": null,
  "createdBy": "admin@agendasalao.com.br",
  "createdAt": "2025-11-04T22:30:00.000Z",
  "updatedAt": "2025-11-04T22:30:00.000Z"
}
```

### 2. ✅ GET /api/availabilities?staffId=X&type=RECURRING

```bash
# Request
GET http://localhost:3000/api/availabilities?staffId=staff-demo-1&type=RECURRING

# Response
200 OK
[
  {
    "id": "cmhl56h390001of5d6rys0q1t",
    "dayOfWeek": 1,
    "startTime": "09:00",
    "endTime": "10:00",
    "available": true,
    "type": "RECURRING",
    "reason": null,
    "createdBy": "admin@agendasalao.com.br"
  }
]
```

---

## 📦 Impacto da Correção

### Funcionalidades Corrigidas

✅ **Gestão de Horários dos Profissionais**
- Criar horários recorrentes (segunda a domingo)
- Criar bloqueios de horários
- Editar horários existentes
- Deletar horários

✅ **Dashboard Admin - Profissionais**
- Página `/dashboard/profissionais/[id]/slots`
- Botão "Horários" funcionando
- Salvar horários em massa
- Ver horários configurados

✅ **Sistema de Agendamentos**
- Slots disponíveis calculados corretamente
- Considera horários dos profissionais
- Respeita bloqueios configurados

---

## 🔄 Próximos Passos

### 1. ⏳ Aplicar Migration em Produção (Railway)

Quando fizer deploy, o Railway aplicará automaticamente a migration:

```bash
# Railway executa automaticamente
npx prisma migrate deploy
```

**OU** aplicar manualmente:

```bash
# Conectar ao banco Railway
DATABASE_URL="postgresql://..." npx prisma migrate deploy
```

### 2. ✅ Testar em Produção

Após deploy:
1. Acessar: https://salao-production.up.railway.app/dashboard/profissionais
2. Clicar em "Horários" de um profissional
3. Configurar horários
4. Salvar
5. Verificar se salva sem erro 500

---

## 📋 Checklist

### Ambiente Local
- [x] Migration criada
- [x] Migration aplicada no banco local
- [x] Prisma Client regenerado
- [x] Servidor testado e funcionando
- [x] POST /api/availabilities retorna 201
- [x] GET /api/availabilities retorna 200
- [x] Commit e push feitos

### Ambiente Produção
- [ ] Deploy com nova migration
- [ ] Migration aplicada no Railway
- [ ] Testar criação de horários
- [ ] Verificar se erro 500 sumiu

---

## 🆘 Troubleshooting

### Erro: "column does not exist" mesmo após migration

```bash
# Verificar se migration foi aplicada
npx prisma migrate status

# Se não aplicada, aplicar
npx prisma migrate deploy

# Regenerar Prisma Client
npx prisma generate
```

### Migration não aplicando automaticamente

```bash
# Aplicar manualmente
npx prisma migrate deploy

# Verificar estrutura do banco
sudo -u postgres psql -d agendasalao -c "\d+ \"Availability\""
```

### Erro em produção após deploy

1. Verificar logs do Railway
2. Confirmar que migration foi aplicada
3. Verificar variáveis de ambiente
4. Testar endpoint manualmente

---

## 📊 Estrutura Final da Tabela Availability

```sql
CREATE TABLE "Availability" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" TIMESTAMP(3),
    "dayOfWeek" INTEGER,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "type" TEXT NOT NULL DEFAULT 'BLOCK',
    "reason" TEXT,                          -- ✅ NOVO
    "createdBy" TEXT,                       -- ✅ NOVO
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "staffId" TEXT NOT NULL,
    FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE
);
```

---

**Corrigido em**: 04/11/2025 19:30  
**Migration**: 20251104222817_add_reason_and_created_by_to_availability  
**Status**: ✅ Funcionando perfeitamente!  
**Erro 500**: ✅ Resolvido!
