# Atualizar Banco de Dados Railway - Portal do Profissional

## ⚠️ AÇÃO NECESSÁRIA

O Portal do Profissional requer uma nova migração no banco de dados do Railway.

## 📋 O Que Foi Alterado

Nova migração criada: `20260101155307_add_staff_user_relation`

**Mudanças no Schema:**
- Adicionado campo `userId` (TEXT, opcional, único) na tabela `Staff`
- Criada relação `Staff.user ↔ User.staffProfile`
- Permite vincular profissionais a contas de usuário

## 🚀 Como Aplicar no Railway

### Opção 1: Deploy Automático (Recomendado)

O Railway aplicará a migração automaticamente no próximo deploy:

```bash
# Fazer push (já feito)
git push origin main

# Railway detectará a migração e executará:
# npx prisma migrate deploy
```

### Opção 2: Aplicar Manualmente via Railway CLI

Se preferir aplicar antes do deploy:

```bash
# Conectar ao banco Railway
railway login
railway link

# Aplicar migrações pendentes
railway run npx prisma migrate deploy
```

### Opção 3: SQL Direto (Avançado)

Se tiver acesso ao PostgreSQL do Railway:

```sql
-- Adicionar coluna userId na tabela Staff
ALTER TABLE "Staff" ADD COLUMN "userId" TEXT;

-- Criar índice único
CREATE UNIQUE INDEX "Staff_userId_key" ON "Staff"("userId");

-- Adicionar constraint de chave estrangeira
ALTER TABLE "Staff" 
ADD CONSTRAINT "Staff_userId_fkey" 
FOREIGN KEY ("userId") 
REFERENCES "User"("id") 
ON DELETE SET NULL 
ON UPDATE CASCADE;
```

## ✅ Verificar Aplicação

Depois de aplicar, verifique se a migração foi executada:

```bash
# Via Railway CLI
railway run npx prisma migrate status

# Deve mostrar:
# "Database schema is up to date!"
```

## 📝 Recursos Que Dependem Desta Migração

- ✅ Botão "Criar Conta" para profissionais (admin)
- ✅ Login no portal staff (/staff-login)
- ✅ Dashboard do profissional (/staff/dashboard)
- ✅ Gestão de horários (/staff/horarios)
- ✅ Edição de perfil (/staff/perfil)
- ✅ Visualização de agendamentos (/staff/agenda)
- ✅ Comissões do profissional (/staff/comissoes)

## 🔧 Troubleshooting

### Erro: "Unique constraint violation"

Se já existirem valores duplicados em `userId`:

```sql
-- Verificar duplicatas
SELECT "userId", COUNT(*) 
FROM "Staff" 
WHERE "userId" IS NOT NULL
GROUP BY "userId" 
HAVING COUNT(*) > 1;

-- Limpar duplicatas (se houver)
UPDATE "Staff" SET "userId" = NULL WHERE "userId" = 'valor-duplicado';
```

### Erro: "Migration failed"

1. Verifique logs do Railway
2. Confirme que o DATABASE_URL está correto
3. Execute `railway run npx prisma migrate reset` (⚠️ CUIDADO: apaga dados)

## 📊 Estado Atual

- **Migração Local**: ✅ Aplicada (20260101155307)
- **Migração Railway**: ⏳ Pendente (será aplicada no próximo deploy)
- **Código**: ✅ Atualizado e enviado ao GitHub

## 🎯 Próximos Passos

1. ✅ Código commitado e enviado
2. ⏳ Aguardar deploy do Railway
3. ⏳ Railway aplicará migração automaticamente
4. ⏳ Testar criação de conta para profissional
5. ⏳ Testar login no portal staff

## 📌 Informações Adicionais

**Data da Migração**: 01/01/2026  
**Tipo**: Schema Change (non-breaking)  
**Reversível**: Sim (pode fazer rollback se necessário)  
**Impacto**: Nenhum dado existente será alterado (coluna nullable)

---

**Status**: 🟡 Aguardando aplicação no Railway
