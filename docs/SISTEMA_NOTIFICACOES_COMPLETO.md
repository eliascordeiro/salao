# 📱 Sistema de Notificações - WhatsApp + Email

## 🎯 **ARQUITETURA IMPLEMENTADA**

### **Planos e Funcionalidades**

| Recurso | Plano Essencial | Plano Profissional |
|---------|----------------|-------------------|
| Email | ✅ SIM | ✅ SIM |
| WhatsApp | ❌ NÃO | ✅ SIM |
| Preço | R$ 49/mês | R$ 149/mês |

---

## 🔧 **COMO FUNCIONA**

### **1. Instância do WhatsApp (Responsabilidade do Admin)**

**Quem cria?** 👨‍💼 **Dono/Admin do Salão**

**Onde?** 📍 `Dashboard → Configurações → WhatsApp`

**Como?**
1. Admin acessa painel administrativo
2. Vai em `Configurações → WhatsApp`
3. Clica em **"Conectar WhatsApp"**
4. Escaneia QR Code com WhatsApp Business
5. ✅ Conectado!

**Persistência:**
- ✅ Sessão salva em `tokens/salon-booking/`
- ✅ Reconecta automaticamente após reiniciar servidor
- ✅ Não precisa escanear QR Code novamente
- ✅ Uma instância por plataforma (compartilhada por todos os salões)

---

### **2. Envio de Notificações (Automático)**

**Quando cliente agenda:**

```typescript
// Sistema verifica plano do salão automaticamente
const hasWhatsApp = await hasFeature(salonId, FEATURES.WHATSAPP_NOTIFICATIONS);

if (hasWhatsApp) {
  // Plano PROFISSIONAL
  ✅ Envia WhatsApp
  ✅ Envia Email (backup)
} else {
  // Plano ESSENCIAL
  ✅ Envia apenas Email
}
```

**Fluxo Completo:**

```
Cliente faz agendamento
     ↓
Sistema verifica plano do salão
     ↓
     ├─→ PROFISSIONAL?
     │   ├─→ WhatsApp conectado?
     │   │   ├─→ SIM: Envia WhatsApp
     │   │   └─→ NÃO: Pula WhatsApp
     │   └─→ Envia Email (sempre)
     │
     └─→ ESSENCIAL?
         └─→ Envia apenas Email
```

---

## 📧 **TIPOS DE NOTIFICAÇÕES**

### **1. Agendamento Criado** (`created`)
- ✅ Email: Confirmação de pedido
- ✅ WhatsApp: Mensagem de boas-vindas
- **Quando:** Imediatamente após cliente agendar

### **2. Agendamento Confirmado** (`confirmed`)
- ✅ Email: Confirmação oficial
- ✅ WhatsApp: Agendamento confirmado
- **Quando:** Admin confirma no painel

### **3. Lembrete 24h** (`reminder`)
- ✅ Email: Lembrete amigável
- ✅ WhatsApp: Lembrete com detalhes
- **Quando:** 24 horas antes do horário (cron job)

### **4. Cancelamento** (`cancelled`)
- ✅ Email: Notificação de cancelamento
- ✅ WhatsApp: Informação sobre cancelamento
- **Quando:** Cliente ou admin cancela

### **5. Agendamento Concluído** (`completed`)
- ❌ Email: Não implementado ainda
- ✅ WhatsApp: Pedido de avaliação
- **Quando:** Após serviço finalizado

---

## 🔐 **SEGURANÇA E PERMISSÕES**

### **Feature Flags (lib/subscription-features.ts)**

```typescript
export const FEATURES = {
  WHATSAPP_NOTIFICATIONS: 'whatsapp',  // Plano Profissional
  // ... outras features
};

// Verificação automática por salão
const hasWhatsApp = await hasFeature(salonId, FEATURES.WHATSAPP_NOTIFICATIONS);
```

**Lógica:**
1. Sistema busca assinatura ativa do salão
2. Verifica se plano é "Profissional"
3. Retorna `true` ou `false`
4. Código usa isso para decidir se envia WhatsApp

---

## 🧪 **EXEMPLO DE USO NO CÓDIGO**

### **Criar Agendamento (API Route)**

```typescript
// app/api/bookings/route.ts

import { notifyBookingCreated } from "@/lib/whatsapp/notifications";

// Após criar agendamento no banco
const booking = await prisma.booking.create({ ... });

// Enviar notificações (automático)
await notifyBookingCreated({
  salonId: booking.salonId,         // ← Sistema verifica plano
  clientName: user.name,
  clientEmail: user.email,
  clientPhone: user.phone,          // ← Pode ser null
  serviceName: service.name,
  staffName: staff.name,
  date: booking.date,
  time: booking.time,
  salonName: salon.name,
  salonAddress: salon.address,
  salonPhone: salon.phone,
  price: service.price,
  bookingId: booking.id,
});
```

**O que acontece internamente:**

```
1. notifyBookingCreated() chamada
2. sendBookingNotification() verifica plano
3. hasFeature(salonId, 'whatsapp') → true ou false
4. Se true + telefone existe:
   → Tenta enviar WhatsApp
   → Se falhar, continua
5. SEMPRE envia Email
6. Retorna resultado { whatsapp: {...}, email: {...} }
```

---

## 📊 **LOGS DO TERMINAL**

### **Plano Profissional (com WhatsApp):**

```bash
📊 Enviando notificação de created para João Silva
📱 Plano tem WhatsApp: SIM (Profissional)
📤 Enviando mensagem para 5541996123839@c.us...
✅ Mensagem enviada!
📱 Status de entrega (ack): 2
✅ Status: RECEBIDA pelo servidor (2 checks ✓✓)
✅ WhatsApp enviado para 5541996123839
✅ Email enviado para joao@email.com
📊 Resultado do envio: {
  whatsapp: '✅ Enviado',
  email: '✅ Enviado'
}
```

### **Plano Essencial (sem WhatsApp):**

```bash
📊 Enviando notificação de created para Maria Santos
📱 Plano tem WhatsApp: NÃO (Essencial)
📧 Plano Essencial: Enviando apenas email (sem WhatsApp)
✅ Email enviado para maria@email.com
📊 Resultado do envio: {
  whatsapp: '❌ Não enviado',
  email: '✅ Enviado'
}
```

### **Profissional MAS WhatsApp não conectado:**

```bash
📊 Enviando notificação de created para Carlos Oliveira
📱 Plano tem WhatsApp: SIM (Profissional)
⚠️ WhatsApp não está conectado. Admin precisa conectar via Dashboard.
📧 Continuando com envio de email (backup)...
✅ Email enviado para carlos@email.com
📊 Resultado do envio: {
  whatsapp: 'WhatsApp não conectado. Configure em Dashboard → WhatsApp.',
  email: '✅ Enviado'
}
```

---

## 🚀 **SETUP INICIAL (Uma Única Vez)**

### **Para o Admin da Plataforma:**

**Passo 1: Conectar WhatsApp**
```
1. Acesse: http://localhost:3000/dashboard/configuracoes/whatsapp
2. Faça login com conta admin
3. Clique "Conectar WhatsApp"
4. Escaneie QR Code com WhatsApp Business
5. ✅ Pronto! Salões com plano Profissional já podem usar
```

**Passo 2: Testar Envio**
```
1. Na mesma página, preencha:
   - Telefone: seu número
   - Mensagem: "Teste"
2. Clique "Enviar Mensagem Teste"
3. Verifique se recebeu no WhatsApp
```

**Passo 3: Deixar Rodando**
```
✅ Servidor Next.js rodando (npm run dev)
✅ WhatsApp conectado
✅ Sessão salva em tokens/salon-booking/
✅ Reconexão automática funciona
```

---

## 🔄 **MANUTENÇÃO**

### **Se WhatsApp desconectar:**

1. **Reconectar:**
   - Vá em `Dashboard → Configurações → WhatsApp`
   - Clique "Conectar WhatsApp" novamente
   - Escaneie QR Code

2. **Limpar sessão corrompida:**
   ```bash
   rm -rf tokens/salon-booking/
   npm run dev  # Reiniciar
   ```

3. **Verificar status:**
   - Botão "Atualizar Status" na UI
   - Logs do terminal mostram conexão

---

## 🎯 **VANTAGENS DESTA ARQUITETURA**

### ✅ **Escalável**
- Uma instância WhatsApp para toda plataforma
- Múltiplos salões compartilham mesma conexão
- Não precisa criar instância por salão

### ✅ **Confiável**
- Email sempre funciona (backup)
- WhatsApp é "bonus" quando disponível
- Não depende de terceiros (Evolution API)

### ✅ **Econômica**
- WPPConnect é gratuito
- Sem custo por mensagem
- Plano Profissional justifica valor (R$ 149)

### ✅ **Simples**
- Admin conecta uma vez
- Sistema usa automaticamente
- Desenvolvedores não precisam configurar nada

---

## 🧩 **INTEGRAÇÃO COM OUTROS MÓDULOS**

### **Cron Job (Lembretes Automáticos)**

```typescript
// app/api/cron/send-reminders/route.ts

import { notifyBookingReminder } from "@/lib/whatsapp/notifications";

// A cada hora, buscar agendamentos nas próximas 24h
const bookings = await prisma.booking.findMany({
  where: {
    date: tomorrow,
    status: 'CONFIRMED',
  },
});

// Enviar lembrete para cada um
for (const booking of bookings) {
  await notifyBookingReminder({
    salonId: booking.salonId,  // ← Verifica plano automaticamente
    // ... outros dados
  });
}
```

### **Webhook de Pagamentos**

```typescript
// Após pagamento confirmado
await notifyBookingConfirmed({
  salonId: booking.salonId,
  // ... dados do agendamento
});
```

---

## 📱 **MENSAGENS DOS TEMPLATES**

### **Exemplo: Agendamento Criado**

**WhatsApp:**
```
🎉 Olá João Silva!

Seu agendamento foi recebido com sucesso!

📅 Data: 25/12/2024
🕐 Horário: 14:00
💈 Serviço: Corte + Barba
✂️ Profissional: Pedro Barbeiro
💰 Valor: R$ 80,00

📍 Salão Premium
Rua das Flores, 123

Aguardamos você! 😊

ID: #ABC123
```

**Email:**
```html
<!DOCTYPE html>
<html>
  <body>
    <h1>Agendamento Recebido!</h1>
    <p>Olá João Silva,</p>
    <p>Seu agendamento foi confirmado:</p>
    <ul>
      <li>Serviço: Corte + Barba</li>
      <li>Data: 25/12/2024 às 14:00</li>
      <li>Profissional: Pedro Barbeiro</li>
    </ul>
    ...
  </body>
</html>
```

---

## 🎓 **RESUMO PARA DESENVOLVEDORES**

### **Preciso fazer algo para ativar WhatsApp?**
❌ NÃO! Sistema já está pronto.

### **Como sei se salão tem WhatsApp?**
```typescript
const hasWhatsApp = await hasFeature(salonId, FEATURES.WHATSAPP_NOTIFICATIONS);
```

### **Preciso tratar erro de WhatsApp?**
❌ NÃO! Sistema trata automaticamente e usa email como backup.

### **Como enviar notificação?**
```typescript
import { notifyBookingCreated } from "@/lib/whatsapp/notifications";

await notifyBookingCreated({
  salonId: "...",
  clientName: "...",
  clientEmail: "...",
  clientPhone: "...",  // Opcional
  // ... outros dados
});
```

### **E se WhatsApp não conectado?**
✅ Email é enviado normalmente.
⚠️ Admin recebe aviso para conectar.

---

## 🎯 **CONCLUSÃO**

**Sistema totalmente automático e inteligente!**

✅ Admin conecta WhatsApp UMA vez
✅ Sistema detecta plano do salão
✅ Envia WhatsApp se Profissional + conectado
✅ SEMPRE envia email (garantia)
✅ Desenvolvedores só chamam `notify...()` functions
✅ Tudo funciona automaticamente! 🎉
