# ⚡ Configuração Rápida - Lembretes Automáticos no Railway

## 📝 Checklist de Deploy

### ✅ Passo 1: Adicionar Variável de Ambiente

1. Acesse: https://railway.app → Seu Projeto → **Variables**
2. Clique em **+ New Variable**
3. Adicione:
   ```
   Nome: CRON_SECRET
   Valor: [gerar token seguro]
   ```

**Gerar token seguro (copie o resultado):**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Exemplo de token gerado:**
```
a7f3c8e9d2b1f4a6c8e7d3b9a1f5c2e8d4b6a9c7f1e3d8b2a5c6f9e1d4b7a3c8
```

4. Clique em **Add** → **Deploy** (Railway fará redeploy automático)

---

### ✅ Passo 2: Migração do Banco de Dados

**IMPORTANTE:** A migração já foi criada localmente. Ela será aplicada automaticamente no Railway no próximo deploy.

**Migração criada:**
```
prisma/migrations/20251227220915_add_reminder_sent_to_booking/migration.sql
```

**O que ela faz:**
- Adiciona coluna `reminderSent` (BOOLEAN, default false) na tabela `Booking`

**Verificar no Railway (após deploy):**
1. Vá em **Deployments** → **View Logs**
2. Procure por: `Applying migration 20251227220915_add_reminder_sent_to_booking`
3. Deve aparecer: `Your database is now in sync with your schema`

---

### ✅ Passo 3: Configurar Cron Job

**Opção A: EasyCron (Grátis e Simples)**

1. Acesse: https://www.easycron.com (cadastro grátis)
2. Clique em **Create Cron Job**
3. Configure:
   - **Name**: `Lembretes 24h - Salão`
   - **URL**: `https://salon-booking.com.br/api/cron/send-reminders`
   - **Cron Expression**: `0 * * * *` (a cada hora)
   - **Request Method**: `POST`
   - **HTTP Headers**: 
     ```
     Authorization: Bearer SEU_CRON_SECRET_AQUI
     ```
     *(substitua pelo token gerado no Passo 1)*
   - **Time Zone**: `America/Sao_Paulo`
   - **Status**: `Enabled`

4. Clique em **Create**

**Opção B: Cron-job.org (Alternativa)**

1. Acesse: https://cron-job.org (cadastro grátis)
2. Vá em **Cronjobs** → **Create cronjob**
3. Configure:
   - **Title**: `Lembretes 24h`
   - **Address**: `https://salon-booking.com.br/api/cron/send-reminders`
   - **Schedule**: Selecione "Every hour" (ou `0 * * * *`)
   - **Advanced** → **Request Method**: `POST`
   - **Advanced** → **Headers**: 
     ```
     Authorization: Bearer SEU_CRON_SECRET_AQUI
     ```
   - **Enabled**: ✅

4. Clique em **Create**

---

## 🧪 Testar Agora (Sem Esperar 1 Hora)

### 1. Criar Agendamento de Teste

No painel admin (https://salon-booking.com.br/dashboard/agendamentos):

1. Clique em **+ Novo Agendamento**
2. Preencha:
   - Cliente: (escolha um com email e telefone)
   - Serviço: Qualquer um
   - Profissional: Qualquer um
   - Data: **AMANHÃ MESMO HORÁRIO** (ex: se agora são 19h, marque amanhã às 19h)
   - Marque "Notificar cliente" ✅
3. Clique em **Criar Agendamento**
4. **IMPORTANTE**: Depois de criar, vá em **Ações** → **Confirmar** (status CONFIRMED é necessário)

### 2. Executar Cron Manualmente

**Via Terminal:**
```bash
curl -X POST https://salon-booking.com.br/api/cron/send-reminders \
  -H "Authorization: Bearer SEU_CRON_SECRET_AQUI"
```

**Via Postman/Insomnia:**
- Method: `POST`
- URL: `https://salon-booking.com.br/api/cron/send-reminders`
- Headers:
  ```
  Authorization: Bearer SEU_CRON_SECRET_AQUI
  ```

### 3. Verificar Resultado

**Resposta esperada:**
```json
{
  "totalFound": 1,
  "sent": 1,
  "errors": 0,
  "details": [
    {
      "bookingId": "clx...",
      "clientName": "João Silva",
      "date": "2025-12-28T19:00:00.000Z",
      "status": "sent"
    }
  ],
  "executedAt": "2025-12-27T22:30:00.000Z"
}
```

**Verificar Email:**
- Cliente deve receber email com assunto: "Lembrete: Seu agendamento amanhã - [Nome do Salão]"

**Verificar WhatsApp (se plano PROFISSIONAL):**
- Cliente deve receber mensagem no WhatsApp

---

## 📊 Monitoramento

### Ver Logs no Railway

1. Railway Dashboard → **Deployments** → **View Logs**
2. Quando o cron executar, você verá:
   ```
   🔍 Buscando agendamentos entre 2025-12-28T18:00:00.000Z e 2025-12-28T20:00:00.000Z
   📊 Encontrados 2 agendamentos para lembrete
   ✅ Lembrete enviado: João Silva - Corte de Cabelo
   ✅ Lembrete enviado: Maria Santos - Manicure
   📧 Resumo: 2 enviados, 0 erros
   ```

### Ver no EasyCron/Cron-job.org

1. Acesse o painel do serviço escolhido
2. Vá em **Execution History** / **Logs**
3. Deve mostrar:
   - ✅ Status: `200 OK`
   - Response: JSON com resumo dos lembretes enviados

---

## ❓ Troubleshooting

### Problema: "401 Unauthorized"

**Causa:** Token inválido ou faltando

**Solução:**
1. Verificar se `CRON_SECRET` foi adicionado no Railway
2. Verificar se o header no cron job está correto:
   ```
   Authorization: Bearer SEU_TOKEN_AQUI
   ```
   ⚠️ **Não esquecer o "Bearer " antes do token!**

### Problema: "totalFound: 0"

**Causa:** Nenhum agendamento nas próximas 24h

**Soluções:**
1. ✅ Criar agendamento para amanhã mesmo horário
2. ✅ Confirmar o agendamento (status CONFIRMED)
3. ✅ Verificar se `reminderSent` está `false` no banco

### Problema: Lembrete não chegou

**Verificar:**
1. ✅ Resposta da API mostra `"sent": 1`?
2. ✅ Cliente tem email/telefone cadastrado?
3. ✅ Email caiu no SPAM? (verificar pasta de spam)
4. ✅ WhatsApp: Salão tem plano PROFISSIONAL?

---

## 🎯 Próximos Passos

Após configurar e testar:

1. ✅ Desmarcar "Notificar cliente" ao criar agendamentos (para não duplicar)
2. ✅ Deixar o cron executar automaticamente a cada hora
3. ✅ Monitorar logs na primeira semana
4. ✅ Ajustar horário do cron se necessário (ex: apenas durante horário comercial)

---

## 📞 Configuração Personalizada (Opcional)

### Executar apenas em horário comercial (8h-20h)

No EasyCron/Cron-job.org, use esta expressão:
```
0 8-20 * * *
```
(A cada hora entre 8h e 20h)

### Executar 3x por dia (9h, 14h, 19h)

```
0 9,14,19 * * *
```

---

**Última atualização:** 27/12/2025  
**Status:** ✅ Pronto para configurar
