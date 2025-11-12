# Configuração de Cron Jobs para Produção (Railway)

## 🎯 Objetivo

Automatizar tarefas periódicas do sistema de Contas a Pagar:
1. **Atualizar despesas atrasadas** (diário)
2. **Gerar despesas recorrentes** (mensal)

## 📋 Pré-requisitos

1. ✅ Sistema de Contas a Pagar deployado no Railway
2. ✅ Variável `CRON_SECRET` configurada no Railway
3. ✅ Conta em um serviço de cron jobs (recomendado: cron-job.org)

---

## 🔑 1. Configurar CRON_SECRET no Railway

### Gerar Token Secreto

```bash
# No terminal local, gere um token de 64 caracteres:
openssl rand -hex 32
```

Resultado exemplo:
```
a7f8d9e2c4b6a1f3e5d7c9b2a4f6e8d0c2b4a6f8e0d2c4b6a8f0e2d4c6b8a0f2
```

### Adicionar ao Railway

1. Acesse: https://railway.app
2. Selecione seu projeto
3. Vá em **Variables**
4. Adicione nova variável:
   - **Nome:** `CRON_SECRET`
   - **Valor:** Cole o token gerado acima
5. Clique em **Add** e depois **Deploy**

---

## ⏰ 2. Configurar Cron Jobs Online

### Opção 1: cron-job.org (Recomendado - Grátis)

1. **Cadastre-se:** https://cron-job.org/en/signup/
2. **Crie Job 1 - Despesas Atrasadas:**
   - **Title:** `Atualizar Despesas Atrasadas`
   - **URL:** `https://SEU-APP.up.railway.app/api/expenses/check-overdue`
   - **Method:** POST
   - **Schedule:** Daily at 00:00 (todo dia à meia-noite)
   - **Headers:**
     ```
     Authorization: Bearer SEU_CRON_SECRET_AQUI
     Content-Type: application/json
     ```
   - **Enabled:** ✅

3. **Crie Job 2 - Despesas Recorrentes:**
   - **Title:** `Gerar Despesas Recorrentes`
   - **URL:** `https://SEU-APP.up.railway.app/api/expenses/generate-recurring`
   - **Method:** POST
   - **Schedule:** Monthly on day 1 at 01:00 (dia 1 de cada mês às 01h)
   - **Headers:**
     ```
     Authorization: Bearer SEU_CRON_SECRET_AQUI
     Content-Type: application/json
     ```
   - **Enabled:** ✅

### Opção 2: EasyCron (Alternativa Grátis)

1. **Cadastre-se:** https://www.easycron.com/user/register
2. Siga mesmos passos do cron-job.org
3. Limite grátis: 1 job a cada 15 minutos

### Opção 3: Render Cron Jobs (Se usar Render)

Se estiver usando Render ao invés do Railway:

```yaml
# render.yaml
services:
  - type: web
    name: agendasalao
    env: node
    buildCommand: npm install && npx prisma generate
    startCommand: npm start
  
  # Cron Jobs
  - type: cron
    name: check-overdue-expenses
    env: node
    schedule: "0 0 * * *"  # Todo dia à meia-noite
    buildCommand: npm install
    startCommand: node scripts/check-overdue.js
  
  - type: cron
    name: generate-recurring-expenses
    env: node
    schedule: "0 1 1 * *"  # Dia 1 de cada mês às 01h
    buildCommand: npm install
    startCommand: node scripts/generate-recurring.js
```

---

## 🧪 3. Testar Cron Jobs Localmente

### Teste Manual (Desenvolvimento)

```bash
# 1. Certifique-se que o servidor está rodando
npm run dev

# 2. Em outro terminal, execute o script de testes
./test-cron-jobs.sh
```

### Teste com cURL

```bash
# Carregue o CRON_SECRET do .env
export CRON_SECRET=$(grep CRON_SECRET .env | cut -d '=' -f2 | tr -d '"')

# Teste 1: Atualizar despesas atrasadas
curl -X POST http://localhost:3000/api/expenses/check-overdue \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json"

# Teste 2: Gerar despesas recorrentes
curl -X POST http://localhost:3000/api/expenses/generate-recurring \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json"

# Teste 3: Preview (GET - sem auth)
curl http://localhost:3000/api/expenses/generate-recurring
```

### Respostas Esperadas

#### Check Overdue (Sucesso)
```json
{
  "success": true,
  "message": "3 despesas atualizadas para OVERDUE",
  "updated": 3,
  "expenses": [
    {
      "id": "cm...",
      "description": "Aluguel - Outubro",
      "dueDate": "2024-10-05T00:00:00.000Z",
      "amount": 2500
    }
  ]
}
```

#### Generate Recurring (Sucesso)
```json
{
  "success": true,
  "message": "5 despesas recorrentes geradas",
  "generated": 5,
  "expenses": [
    {
      "id": "cm...",
      "description": "Aluguel - Dezembro",
      "dueDate": "2024-12-05T00:00:00.000Z",
      "amount": 2500,
      "recurrence": "MONTHLY"
    }
  ]
}
```

#### Erro de Autenticação
```json
{
  "success": false,
  "error": "Não autorizado"
}
```

---

## 🔍 4. Monitoramento

### Logs no Railway

1. Acesse o dashboard do Railway
2. Vá em **Deployments** → Selecione o deployment ativo
3. Clique em **View Logs**
4. Filtre por:
   - `✅ despesas marcadas como atrasadas`
   - `✅ Despesa recorrente criada`

### Verificação Manual

#### Consultar Despesas Atrasadas
```bash
curl https://SEU-APP.up.railway.app/api/expenses/check-overdue
```

#### Preview de Despesas Recorrentes
```bash
curl https://SEU-APP.up.railway.app/api/expenses/generate-recurring
```

### Dashboard do Cron Job

No cron-job.org:
- Status de execução (sucesso/falha)
- Histórico de execuções
- Response time
- Alertas por email

---

## 📊 5. Cronogramas Recomendados

### Atualizar Despesas Atrasadas
- **Frequência:** Diária
- **Horário:** 00:00 (meia-noite)
- **Cron:** `0 0 * * *`
- **Motivo:** Verificar todos os dias se há despesas vencidas

### Gerar Despesas Recorrentes
- **Frequência:** Mensal
- **Horário:** Dia 1 às 01:00
- **Cron:** `0 1 1 * *`
- **Motivo:** Criar despesas do próximo mês automaticamente

### Opcional: Backup de Dados
- **Frequência:** Diária
- **Horário:** 03:00
- **Cron:** `0 3 * * *`

---

## 🛡️ 6. Segurança

### Boas Práticas

1. ✅ **Nunca exponha CRON_SECRET publicamente**
2. ✅ **Use HTTPS em produção (Railway já fornece)**
3. ✅ **Monitore logs regularmente**
4. ✅ **Configure alertas de falha**
5. ✅ **Mantenha backup dos dados**

### Validação de Requisições

As APIs verificam:
1. Header `Authorization: Bearer TOKEN`
2. Token deve corresponder ao `CRON_SECRET`
3. Se falhar → retorna 401 Unauthorized

### Rate Limiting (Opcional)

Para proteger contra abuso, adicione rate limiting:

```typescript
// lib/rate-limit.ts
import { NextRequest } from "next/server";

const rateLimitMap = new Map();

export function rateLimit(ip: string, limit = 10, window = 60000) {
  const now = Date.now();
  const record = rateLimitMap.get(ip) || { count: 0, resetAt: now + window };

  if (now > record.resetAt) {
    record.count = 0;
    record.resetAt = now + window;
  }

  record.count++;
  rateLimitMap.set(ip, record);

  return record.count <= limit;
}
```

---

## 🐛 7. Troubleshooting

### Erro: 401 Unauthorized

**Causa:** CRON_SECRET incorreto ou ausente

**Solução:**
1. Verifique se `CRON_SECRET` está configurado no Railway
2. Confirme que o header está correto: `Authorization: Bearer TOKEN`
3. Regenere o token se necessário

### Erro: 500 Internal Server Error

**Causa:** Erro no código ou banco de dados

**Solução:**
1. Verifique logs do Railway
2. Teste localmente com `./test-cron-jobs.sh`
3. Verifique se a migration foi aplicada

### Cron não está executando

**Causa:** Configuração incorreta no serviço de cron

**Solução:**
1. Verifique se a URL está correta (com HTTPS)
2. Confirme que o job está **Enabled**
3. Teste manualmente com cURL
4. Verifique histórico de execuções no dashboard

### Despesas duplicadas

**Causa:** Cron executando múltiplas vezes

**Solução:**
- A API já possui proteção contra duplicatas
- Verifica se despesa já existe antes de criar
- Se persistir, ajuste frequência do cron

---

## 📝 8. Checklist de Deploy

Antes de ativar os cron jobs em produção:

- [ ] `CRON_SECRET` configurado no Railway
- [ ] Aplicação deployada com sucesso
- [ ] Migration de `Expense` aplicada
- [ ] Testado localmente com `./test-cron-jobs.sh`
- [ ] URLs dos endpoints conferidas
- [ ] Cron jobs configurados no cron-job.org
- [ ] Headers de autenticação corretos
- [ ] Cronogramas (schedules) validados
- [ ] Primeiro teste manual executado
- [ ] Monitoramento configurado
- [ ] Alertas de email ativados (opcional)

---

## 🎯 Resultado Final

Com tudo configurado, o sistema irá:

1. ✅ **Automaticamente** marcar despesas como atrasadas todo dia
2. ✅ **Automaticamente** criar despesas recorrentes no início de cada mês
3. ✅ **Notificar** via email sobre execuções (se configurado)
4. ✅ **Manter histórico** de execuções para auditoria

**Sistema de Contas a Pagar 100% automatizado!** 🚀
