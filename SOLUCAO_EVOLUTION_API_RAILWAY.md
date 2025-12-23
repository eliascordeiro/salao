# Solução: Evolution API no Railway

## ❌ Problema Identificado
A Evolution API **sempre executa migrações Prisma** ao iniciar (`npm run db:deploy`), mesmo com `DATABASE_ENABLED=false`. Isso causa conflito porque o PostgreSQL do projeto já tem o schema do Next.js.

## ⚠️ Erro Atual
```
Error: P3005
The database schema is not empty. Read more about how to baseline an existing production database
```

A Evolution API não consegue criar suas 49 migrações porque o banco já contém tabelas do Next.js.

---

## ✅ Soluções Possíveis

### Solução 1: Criar PostgreSQL Separado (RECOMENDADO)
Criar um banco PostgreSQL exclusivo para a Evolution API no Railway.

#### Passos:
1. No dashboard do Railway: **New > Database > Add PostgreSQL**
2. Após criar, copie a `DATABASE_URL` do novo banco
3. Atualize as variáveis da Evolution API:
   ```bash
   railway service
   # Selecionar: evolution-api
   
   railway variables --set DATABASE_CONNECTION_URI="postgresql://..."
   railway variables --set DATABASE_ENABLED=true
   railway variables --set DATABASE_PROVIDER=postgresql
   ```
4. A Evolution API vai rodar migrações no banco vazio ✅
5. Serviço deve iniciar sem erros

**Vantagens:**
- ✅ Isolamento total entre Evolution API e Next.js
- ✅ Migrações rodando sem conflitos
- ✅ Persistência de dados (instâncias, mensagens)
- ✅ Solução profissional e escalável

**Desvantagens:**
- 💰 Custo de um segundo PostgreSQL no Railway (~$5/mês)

---

### Solução 2: Usar Evolution API Externa
Usar um provedor externo para hospedar a Evolution API.

#### Opções:
- **Render.com**: Deploy gratuito + PostgreSQL grátis (750h/mês)
- **Fly.io**: 3 VMs grátis + PostgreSQL 3GB grátis
- **Evolution API Cloud**: Serviço oficial pago

#### Passos (exemplo Render):
1. Criar conta no Render.com
2. New > Web Service > Docker Image: `atendai/evolution-api:v2.2.3`
3. Criar PostgreSQL grátis e linkar
4. Configurar environment variables (mesmas do Railway)
5. Copiar URL pública do serviço
6. Atualizar `.env` do Next.js no Railway:
   ```
   EVOLUTION_API_URL=https://seu-app.onrender.com
   EVOLUTION_API_KEY=sua-key
   ```

**Vantagens:**
- ✅ Gratuito (tier free do Render/Fly)
- ✅ Sem conflitos com PostgreSQL do Railway
- ✅ Fácil deploy com Docker

**Desvantagens:**
- ⏱️ Cold start em tier gratuito (15-30s)
- 🌐 Mais um serviço para gerenciar

---

### Solução 3: MongoDB para Evolution API
Usar MongoDB ao invés de PostgreSQL (Evolution API suporta ambos).

#### Passos:
1. Criar MongoDB Atlas (grátis 512MB)
2. Copiar connection string
3. Atualizar Evolution API:
   ```bash
   railway variables --set DATABASE_PROVIDER=mongodb
   railway variables --set DATABASE_CONNECTION_URI="mongodb+srv://..."
   railway variables --set DATABASE_ENABLED=true
   ```

**Vantagens:**
- ✅ MongoDB grátis no Atlas
- ✅ Sem conflito com PostgreSQL do Next.js
- ✅ Boa performance para mensageria

**Desvantagens:**
- 🔄 Mais um banco de dados para gerenciar

---

### Solução 4: Desabilitar Persistência (NÃO RECOMENDADO)
Teoricamente poderia rodar sem banco, mas a Evolution API **exige** `DATABASE_PROVIDER` válido e sempre roda migrações no startup. Não é possível desabilitar totalmente.

---

## 🎯 Recomendação Final

**Para produção:** Solução 1 (PostgreSQL separado no Railway)
- Pague os ~$5/mês por um banco dedicado
- Máxima estabilidade e performance
- Dados persistentes e backup automático

**Para teste/desenvolvimento:** Solução 2 (Render.com)
- Grátis para validar a integração
- Depois migre para Railway quando escalar
- Fácil de configurar

---

## 📋 Próximos Passos

### Se escolher Solução 1 (PostgreSQL separado):
```bash
# 1. Criar PostgreSQL no dashboard Railway
# 2. Copiar DATABASE_URL do novo banco
# 3. Configurar Evolution API
railway service
# Selecionar: evolution-api
railway variables --set DATABASE_CONNECTION_URI="sua-database-url-aqui"
railway variables --set DATABASE_ENABLED=true
railway variables --set DATABASE_PROVIDER=postgresql

# 4. Aguardar deploy e verificar logs
sleep 30
railway logs --tail 50

# 5. Testar API
curl https://evolution-api-production-f200.up.railway.app/instance/fetchInstances \
  -H "apikey: bedb4e0217e8c56c614744381abfe24a569c71aba568764e3035db399901e224"
```

### Se escolher Solução 2 (Render.com):
1. Acessar https://dashboard.render.com/
2. Sign Up com GitHub
3. New > Web Service
4. Deploy from Docker Image: `atendai/evolution-api:v2.2.3`
5. Add PostgreSQL (grátis)
6. Environment Variables (copiar do Railway)
7. Create Web Service
8. Aguardar deploy (~5min)
9. Copiar URL pública
10. Atualizar `.env` do Next.js no Railway

---

## 🔧 Credenciais Atuais

```bash
EVOLUTION_API_KEY=bedb4e0217e8c56c614744381abfe24a569c71aba568764e3035db399901e224
EVOLUTION_INSTANCE_NAME=salon-booking
```

**URL atual (Railway):** https://evolution-api-production-f200.up.railway.app  
**Status:** ❌ Crashando por erro de migração

---

## 📚 Referências
- Evolution API Docs: https://doc.evolution-api.com/
- Railway PostgreSQL: https://docs.railway.app/databases/postgresql
- Render Free Tier: https://render.com/docs/free
- Fly.io Postgres: https://fly.io/docs/postgres/
