# Sistema de Lembretes Automáticos 24h Antes

## 📋 Visão Geral

Sistema automatizado que envia lembretes por Email e WhatsApp 24 horas antes dos agendamentos confirmados.

---

## ✅ Implementação Completa

### 1. **Schema do Banco de Dados**
```prisma
model Booking {
  // ... campos existentes
  reminderSent  Boolean  @default(false)  // ← NOVO: Marca se lembrete foi enviado
}
```

**Migração aplicada:** `20251227220915_add_reminder_sent_to_booking`

---

### 2. **API de Lembretes**
**Rota:** `/api/cron/send-reminders`

**Lógica:**
1. ✅ Busca agendamentos CONFIRMED nas próximas 23-25h
2. ✅ Filtra apenas os que `reminderSent = false`
3. ✅ Envia Email + WhatsApp (se plano permitir)
4. ✅ Marca `reminderSent = true` após envio
5. ✅ Retorna resumo com sucessos e erros

**Segurança:**
- Protegida com Bearer token (`CRON_SECRET`)
- Rejeita requisições sem autenticação
- Logs detalhados de execução

---

## 🚀 Configuração no Railway

### **Passo 1: Adicionar Variável de Ambiente**

No Railway Dashboard:
```
CRON_SECRET=SEU_TOKEN_SECRETO_AQUI
```

**Gerar token seguro:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

### **Passo 2: Configurar Cron Job**

O Railway suporta duas formas de executar cron jobs:

#### **Opção A: Railway Cron (Recomendado)**

1. Vá em **Settings** → **Cron Jobs** no seu serviço
2. Clique em **Add Cron Job**
3. Configure:
   - **Schedule**: `0 * * * *` (a cada hora)
   - **Command**: 
     ```bash
     curl -X POST https://seu-dominio.railway.app/api/cron/send-reminders \
       -H "Authorization: Bearer $CRON_SECRET"
     ```

#### **Opção B: Serviço Externo (EasyCron, Cron-job.org)**

1. Cadastre em https://cron-job.org (grátis)
2. Crie novo cron job:
   - **URL**: `https://seu-dominio.railway.app/api/cron/send-reminders`
   - **Schedule**: A cada hora (`0 * * * *`)
   - **Headers**: 
     ```
     Authorization: Bearer SEU_CRON_SECRET_AQUI
     ```
   - **Method**: POST

---

## 🧪 Testar Manualmente

### **1. Criar Agendamento de Teste (24h no futuro)**

No painel admin:
1. Vá em **Agendamentos** → **Novo Agendamento**
2. Marque data/hora para **amanhã mesmo horário**
3. Status: **CONFIRMED**
4. Certifique-se que o cliente tem email e telefone

### **2. Executar Cron Manualmente**

```bash
# Em desenvolvimento (sem autenticação)
curl http://localhost:3000/api/cron/send-reminders

# Em produção (com autenticação)
curl -X POST https://seu-dominio.railway.app/api/cron/send-reminders \
  -H "Authorization: Bearer SEU_CRON_SECRET"
```

### **3. Verificar Resposta**

Exemplo de resposta bem-sucedida:
```json
{
  "totalFound": 2,
  "sent": 2,
  "errors": 0,
  "details": [
    {
      "bookingId": "clx...",
      "clientName": "João Silva",
      "date": "2025-12-28T14:00:00.000Z",
      "status": "sent"
    }
  ],
  "executedAt": "2025-12-27T22:15:00.000Z"
}
```

---

## 📊 Logs e Monitoramento

### **Ver Logs no Railway**

1. Vá em **Deployments** → **View Logs**
2. Procure por mensagens do cron:
   ```
   🔍 Buscando agendamentos entre...
   📊 Encontrados X agendamentos para lembrete
   ✅ Lembrete enviado: João Silva - Corte de Cabelo
   📧 Resumo: 2 enviados, 0 erros
   ```

### **Verificar no Banco de Dados**

```sql
-- Ver agendamentos que já receberam lembrete
SELECT id, "clientId", date, status, "reminderSent" 
FROM "Booking" 
WHERE "reminderSent" = true;

-- Ver agendamentos pendentes de lembrete (próximas 24h)
SELECT id, "clientId", date, status, "reminderSent" 
FROM "Booking" 
WHERE status = 'CONFIRMED' 
  AND "reminderSent" = false 
  AND date > NOW() 
  AND date < NOW() + INTERVAL '25 hours';
```

---

## 🔧 Ajustes e Customização

### **Alterar Janela de Tempo**

Edite `app/api/cron/send-reminders/route.ts`:
```typescript
// Padrão: 23h a 25h (margem de 1h para cada lado)
const minTime = new Date(now.getTime() + 23 * 60 * 60 * 1000);
const maxTime = new Date(now.getTime() + 25 * 60 * 60 * 1000);

// Alterar para 6h antes (exemplo):
const minTime = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
const maxTime = new Date(now.getTime() + 6.5 * 60 * 60 * 1000);
```

### **Alterar Frequência do Cron**

Exemplos de cron schedules:
```bash
0 * * * *     # A cada hora
0 */2 * * *   # A cada 2 horas
0 8,12,16 * * * # Às 8h, 12h e 16h
0 9 * * *     # Todo dia às 9h
```

---

## 🎯 Checklist de Implementação

- [x] ✅ Adicionar campo `reminderSent` ao schema
- [x] ✅ Criar migração do banco
- [x] ✅ Criar API `/api/cron/send-reminders`
- [x] ✅ Implementar lógica de busca 24h antes
- [x] ✅ Integrar com sistema de notificações existente
- [x] ✅ Adicionar autenticação via Bearer token
- [x] ✅ Implementar logs detalhados
- [ ] ⏳ Adicionar `CRON_SECRET` no Railway
- [ ] ⏳ Configurar cron job no Railway
- [ ] ⏳ Testar com agendamento real

---

## 📧 Exemplo de Lembrete Enviado

### **Email:**
```
Assunto: Lembrete: Seu agendamento amanhã - Salão Beleza

Olá João Silva!

Este é um lembrete amigável sobre seu agendamento:

📅 Data: 28/12/2025 (Sábado)
🕐 Horário: 14:00
✂️ Serviço: Corte de Cabelo
👨‍🦰 Profissional: Elias Santos
💰 Valor: R$ 50,00

📍 Local: Rua das Flores, 123
📞 Contato: (41) 99999-9999

Estamos ansiosos para atendê-lo!
```

### **WhatsApp (se plano PROFISSIONAL):**
```
🔔 *Lembrete de Agendamento*

Olá João Silva! 👋

Este é um lembrete sobre seu agendamento:

📅 *Data:* 28/12/2025 (Sábado)
🕐 *Horário:* 14:00
✂️ *Serviço:* Corte de Cabelo
👨‍🦰 *Profissional:* Elias Santos
💰 *Valor:* R$ 50,00

📍 *Local:* Rua das Flores, 123
📞 *Contato:* (41) 99999-9999

Nos vemos em breve! ✨
```

---

## 🆘 Troubleshooting

### **Problema: Nenhum lembrete sendo enviado**

**Verificar:**
1. ✅ Cron job está executando? (ver logs do Railway)
2. ✅ Existe agendamento CONFIRMED nas próximas 24h?
3. ✅ Campo `reminderSent` está `false`?
4. ✅ Cliente tem email/telefone cadastrado?

### **Problema: Erro 401 Unauthorized**

**Solução:**
- Verificar se `CRON_SECRET` está configurado no Railway
- Verificar se o header `Authorization: Bearer XXX` está correto

### **Problema: Lembretes duplicados**

**Causa:** Cron executando múltiplas vezes na mesma janela de tempo

**Solução:** Campo `reminderSent` previne duplicatas. Se ocorrer, verificar:
```sql
-- Ver se foi marcado corretamente
SELECT id, "reminderSent" FROM "Booking" WHERE id = 'ID_DO_AGENDAMENTO';
```

---

## 📈 Próximas Melhorias (Opcional)

- [ ] Dashboard admin com histórico de lembretes enviados
- [ ] Configurar hora preferida de envio por salão
- [ ] Lembretes personalizáveis (2h, 6h, 12h antes)
- [ ] Retry automático em caso de falha
- [ ] Estatísticas de taxa de abertura de emails

---

**Implementado em:** 27/12/2025  
**Autor:** GitHub Copilot  
**Status:** ✅ Pronto para produção
