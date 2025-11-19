# 🚀 Deploy Railway - Atualização 19/11/2025

## ✅ Status do GitHub
- **Commit:** `feat: auto-create cashier session when booking completed + address fields separation`
- **Branch:** `main`
- **Status:** ✅ Enviado com sucesso

## 🗄️ Mudanças no Banco de Dados

### Nova Migration: `add_salon_address_fields`

```sql
ALTER TABLE "Salon" ADD COLUMN "street" TEXT;
ALTER TABLE "Salon" ADD COLUMN "number" TEXT;
ALTER TABLE "Salon" ADD COLUMN "complement" TEXT;
ALTER TABLE "Salon" ADD COLUMN "neighborhood" TEXT;
```

**Impacto:** Adiciona 4 colunas opcionais (nullable) ao modelo Salon.

## 🔧 Ações Necessárias no Railway

### 1. Aplicar Migrations (OBRIGATÓRIO)

```bash
railway run npx prisma migrate deploy
```

Ou via Dashboard:
1. Vá em **Deployments** → **New Deployment**
2. Selecione **Run Custom Command**
3. Digite: `npx prisma migrate deploy`

### 2. Verificar Variáveis de Ambiente

✅ As seguintes variáveis já devem estar configuradas:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Secret para autenticação
- `NEXTAUTH_URL` - URL do app (https://seu-app.up.railway.app)
- `NODE_ENV=production`
- `SMTP_*` - Configurações de email (opcional)

❌ **Não há novas variáveis necessárias neste deploy**

### 3. Migrar Dados Existentes (OPCIONAL)

Se você tem agendamentos COMPLETED sem sessão de caixa:

```bash
railway run node migrate-completed-to-cashier.js
```

Isso criará sessões de caixa para agendamentos já concluídos.

## 📝 Novas Funcionalidades

### 1. Sessão de Caixa Automática
- Quando um agendamento é marcado como **COMPLETED**
- O sistema cria automaticamente uma sessão de caixa (status: OPEN)
- Aparece em `/dashboard/caixa` para receber pagamento

### 2. Campos de Endereço Separados
- CEP, Rua, Número, Complemento, Bairro agora são campos individuais
- Melhor organização e busca de dados
- Auto-complete via CEP continua funcionando

### 3. Correções
- ✅ Bug de desfoco no campo CEP corrigido
- ✅ Opção "Suporte" removida do Sidebar

## 🧪 Testes Recomendados

Após o deploy:

1. **Login** no dashboard de produção
2. **Meu Salão** → Verificar se campos de endereço aparecem corretamente
3. **Agendamentos** → Marcar um como "Concluído"
4. **Caixa** → Verificar se sessão aberta aparece para pagamento

## 📊 Impacto

- ✅ **Baixo risco** - Apenas adiciona colunas nullable
- ✅ **Sem breaking changes** - Sistema continua funcionando
- ✅ **Dados preservados** - Nenhum dado será perdido
- ✅ **Compatibilidade** - Funciona com dados antigos e novos

## 🔗 Links Úteis

- [Railway Dashboard](https://railway.app/dashboard)
- [Prisma Migrations Docs](https://www.prisma.io/docs/guides/migrate/production-migrations)
- [Repositório GitHub](https://github.com/eliascordeiro/salao)

## ⚡ Comando Rápido

Para fazer tudo de uma vez:

```bash
railway run npx prisma migrate deploy && railway up
```

---

**Última atualização:** 19 de novembro de 2025
