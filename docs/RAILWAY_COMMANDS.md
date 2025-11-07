# 🚂 Comandos Rápidos para Railway

## 📦 Instalação do Railway CLI

```bash
# Instalar globalmente
npm install -g @railway/cli

# Ou usar com npx (sem instalar)
npx @railway/cli
```

---

## 🔐 Login e Configuração

```bash
# Fazer login no Railway
railway login

# Vincular ao projeto existente
railway link

# Ver informações do projeto
railway status

# Listar variáveis de ambiente
railway variables
```

---

## 🗄️ Verificar Banco de Dados

### Método 1: Script Automatizado (Recomendado)

```bash
# Via Railway CLI
railway run npx tsx scripts/check-railway-db.ts

# Localmente (para comparar)
npx tsx scripts/check-railway-db.ts
```

### Método 2: Verificar Migrações

```bash
# Ver status das migrações
railway run npx prisma migrate status

# Listar migrações aplicadas
railway run npx prisma migrate resolve --applied
```

### Método 3: Acesso Direto ao Banco

```bash
# Conectar ao PostgreSQL
railway run psql $DATABASE_URL

# Dentro do psql:
# Ver todas as tabelas
\dt

# Ver estrutura da tabela Salon
\d "Salon"

# Ver estrutura da tabela Availability
\d "Availability"

# Sair
\q
```

---

## 🔄 Aplicar Migrações

### Deploy Simples

```bash
# Aplicar todas as migrações pendentes
railway run npx prisma migrate deploy

# Ver resultado
railway run npx prisma migrate status
```

### Deploy com Seed (Popular Banco)

```bash
# Aplicar migrações + seed
railway run npm run prisma:seed

# Ou manualmente
railway run npx prisma db seed
```

### Gerar Prisma Client

```bash
# Regenerar Prisma Client no Railway
railway run npx prisma generate
```

---

## 📊 Queries de Verificação

### Ver Migrações Aplicadas

```bash
railway run psql $DATABASE_URL -c "
  SELECT migration_name, finished_at 
  FROM \"_prisma_migrations\" 
  ORDER BY finished_at DESC;
"
```

### Verificar Coluna bookingType

```bash
railway run psql $DATABASE_URL -c "
  SELECT column_name, data_type, column_default 
  FROM information_schema.columns 
  WHERE table_name = 'Salon' 
    AND column_name = 'bookingType';
"
```

Se retornar **linha vazia**: banco NÃO atualizado  
Se retornar **bookingType | text | 'BOTH'**: banco OK ✅

### Verificar Colunas de Availability

```bash
railway run psql $DATABASE_URL -c "
  SELECT column_name 
  FROM information_schema.columns 
  WHERE table_name = 'Availability' 
    AND column_name IN ('reason', 'createdBy');
"
```

Deve retornar **2 linhas** (reason e createdBy) ✅

---

## 🚀 Deploy da Aplicação

### Deploy Completo

```bash
# Fazer push para GitHub (aciona deploy automático)
git add .
git commit -m "feat: Atualização do schema"
git push origin main

# Ou deploy manual via CLI
railway up
```

### Apenas Build

```bash
# Rodar build no Railway
railway run npm run build
```

### Ver Logs em Tempo Real

```bash
# Logs do deploy
railway logs

# Logs de um service específico
railway logs -s <service-name>

# Seguir logs (tail -f)
railway logs --follow
```

---

## 🛠️ Troubleshooting

### Reset de Migrações (CUIDADO!)

```bash
# ⚠️ APAGA TODOS OS DADOS!
railway run npx prisma migrate reset --skip-seed

# Depois reaplica as migrações
railway run npx prisma migrate deploy
```

### Forçar Recriação do Schema

```bash
# ⚠️ Também apaga dados!
railway run npx prisma db push --force-reset
```

### Marcar Migração como Aplicada (sem executar)

```bash
# Útil se você aplicou manualmente
railway run npx prisma migrate resolve --applied "20251106225716_add_booking_type_to_salon"
```

### Verificar Conexão

```bash
# Teste simples
railway run psql $DATABASE_URL -c "SELECT 1;"

# Deve retornar:
# ?column? 
# ----------
#        1
# (1 row)
```

---

## 📋 Checklist de Deploy

Antes de aplicar migrações em produção:

```bash
# 1. Verificar status local
npx prisma migrate status

# 2. Testar localmente
npm run dev

# 3. Fazer backup (Railway faz automático, mas confirme)
railway run pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# 4. Verificar status no Railway
railway run npx tsx scripts/check-railway-db.ts

# 5. Aplicar migrações
railway run npx prisma migrate deploy

# 6. Verificar novamente
railway run npx tsx scripts/check-railway-db.ts

# 7. Testar aplicação
curl https://seu-app.up.railway.app/api/health

# 8. Monitorar logs
railway logs --follow
```

---

## 🔍 Verificações Rápidas

### Tudo OK?

```bash
# Um comando que responde tudo
railway run npx tsx scripts/check-railway-db.ts && echo "✅ TUDO OK!"
```

### Apenas ver migrações

```bash
railway run npx prisma migrate status | grep -E "applied|pending"
```

### Ver última migração aplicada

```bash
railway run psql $DATABASE_URL -c "
  SELECT migration_name, finished_at 
  FROM \"_prisma_migrations\" 
  ORDER BY finished_at DESC 
  LIMIT 1;
"
```

---

## 📝 Variáveis de Ambiente Importantes

```bash
# Ver DATABASE_URL (sem mostrar senha completa)
railway variables | grep DATABASE_URL

# Adicionar/editar variável
railway variables set NEXTAUTH_SECRET="seu-secret"

# Remover variável
railway variables delete VARIAVEL_ANTIGA
```

---

## 🆘 Se Algo Der Errado

### Rollback de Migração

```bash
# ⚠️ Cuidado: pode causar perda de dados!

# 1. Identificar migração problemática
railway run npx prisma migrate status

# 2. Marcar como não aplicada
railway run npx prisma migrate resolve --rolled-back "20251106225716_add_booking_type_to_salon"

# 3. Reverter mudanças no código
git revert HEAD

# 4. Aplicar estado anterior
railway run npx prisma migrate deploy
```

### Erro: "Migration already applied"

```bash
# Resolver manualmente
railway run npx prisma migrate resolve --applied "nome-da-migracao"
```

### Erro: "Connection timeout"

```bash
# 1. Verificar status do service
railway status

# 2. Verificar DATABASE_URL
railway variables | grep DATABASE

# 3. Reiniciar service
railway restart

# 4. Tentar novamente
railway run npx prisma migrate deploy
```

---

## 📚 Documentação

- Railway CLI: https://docs.railway.app/develop/cli
- Prisma Migrations: https://www.prisma.io/docs/concepts/components/prisma-migrate
- Checklist completo: `docs/CHECKLIST_RAILWAY.md`

---

**Atualizado em:** 07/11/2025  
**Versão do script:** check-railway-db.ts v1.0
