# 📱 Sistema de Notificações WhatsApp - Documentação Completa

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Feature Flags](#feature-flags)
4. [Evolution API](#evolution-api)
5. [Templates de Mensagens](#templates-de-mensagens)
6. [Notificações Híbridas](#notificações-híbridas)
7. [Dashboard UI](#dashboard-ui)
8. [Configuração](#configuração)
9. [Testes](#testes)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

Sistema completo de notificações WhatsApp integrado aos planos de assinatura, permitindo envio automático de mensagens em português para clientes do salão.

### Diferenciação por Plano
- **ESSENCIAL (R$ 49/mês)**: Apenas notificações por email
- **PROFISSIONAL (R$ 149/mês)**: Email + WhatsApp + recursos avançados

### Benefícios
- ✅ Maior engajamento (98% taxa de abertura no WhatsApp vs 20% email)
- ✅ Menos no-shows com lembretes automáticos
- ✅ Comunicação profissional em português
- ✅ Fallback automático para email
- ✅ Custo baixo (R$ 5/mês hosting Evolution API)

---

## 🏗️ Arquitetura

### Componentes Principais

```
┌─────────────────────────────────────────────────────────┐
│                   Sistema WhatsApp                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐    ┌──────────────┐                 │
│  │ Feature Flags│───▶│   Evolution  │                 │
│  │   (Prisma)   │    │   API Client │                 │
│  └──────────────┘    └──────────────┘                 │
│         │                     │                        │
│         ▼                     ▼                        │
│  ┌──────────────┐    ┌──────────────┐                 │
│  │ Subscription │    │  Templates   │                 │
│  │   Features   │    │ (Português)  │                 │
│  └──────────────┘    └──────────────┘                 │
│         │                     │                        │
│         └──────────┬──────────┘                        │
│                    ▼                                   │
│         ┌──────────────────────┐                       │
│         │ Hybrid Notifications │                       │
│         │ (WhatsApp → Email)   │                       │
│         └──────────────────────┘                       │
│                    │                                   │
│         ┌──────────┴──────────┐                        │
│         ▼                     ▼                        │
│  ┌──────────────┐    ┌──────────────┐                 │
│  │  Dashboard   │    │  Booking API │                 │
│  │   UI (QR)    │    │ Integration  │                 │
│  └──────────────┘    └──────────────┘                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Fluxo de Notificação

```
┌─────────────────┐
│ Trigger Event   │ (novo agendamento, confirmação, etc)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ hasFeature()?   │ ◀── Verifica se salão tem WhatsApp
└────────┬────────┘
         │
    ┌────┴────┐
    │ Sim     │ Não
    ▼         ▼
┌─────────┐ ┌────────┐
│WhatsApp │ │ Email  │
│  (try)  │ │  Only  │
└────┬────┘ └────────┘
     │
   Falhou?
     │
     ▼
┌─────────┐
│ Email   │ ◀── Sempre enviado como backup
│Fallback │
└─────────┘
```

---

## 🎚️ Feature Flags

### Schema Prisma

```prisma
model Plan {
  id           String   @id @default(cuid())
  name         String
  slug         String   @unique
  features     Json     // Novo campo JSON
  featuresList String[] @default([]) // Backward compat
  // ... outros campos
}
```

### Estrutura de Features

```typescript
// ESSENCIAL
{
  "email": true,
  "basicReports": true,
  "geolocation": true,
  "maxStaff": 2
}

// PROFISSIONAL
{
  "email": true,
  "whatsapp": true,
  "basicReports": true,
  "advancedReports": true,
  "geolocation": true,
  "maps": true,
  "multiUser": true,
  "aiChat": true,
  "prioritySupport": true
}
```

### API de Verificação

**lib/subscription-features.ts**

```typescript
import { FEATURES, hasFeature } from "@/lib/subscription-features";

// Verificar se salão tem acesso ao WhatsApp
const hasWhatsApp = await hasFeature(salonId, FEATURES.WHATSAPP_NOTIFICATIONS);

if (hasWhatsApp) {
  // Enviar WhatsApp
}
```

### Constantes Disponíveis

```typescript
export const FEATURES = {
  WHATSAPP_NOTIFICATIONS: "whatsapp",
  EMAIL_NOTIFICATIONS: "email",
  MAPS_NAVIGATION: "maps",
  BASIC_REPORTS: "basicReports",
  ADVANCED_REPORTS: "advancedReports",
  MULTI_USER: "multiUser",
  AI_CHAT: "aiChat",
  PRIORITY_SUPPORT: "prioritySupport",
  UNLIMITED_STAFF: "unlimitedStaff",
  GEOLOCATION: "geolocation",
  CUSTOM_BRANDING: "customBranding",
  API_ACCESS: "apiAccess",
  WHITELABEL: "whitelabel",
  ADVANCED_ANALYTICS: "advancedAnalytics",
};
```

### UI Components

**components/subscription/feature-gate.tsx**

```tsx
import { FeatureGate, PremiumBadge, LockedButton } from "@/components/subscription/feature-gate";

// Exemplo 1: Gate com blur + upgrade
<FeatureGate
  hasAccess={hasWhatsApp}
  featureName="Notificações WhatsApp"
  showUpgrade={true}
>
  <WhatsAppSettings />
</FeatureGate>

// Exemplo 2: Premium badge
<h2>
  Configurações Avançadas
  <PremiumBadge />
</h2>

// Exemplo 3: Botão bloqueado
<LockedButton
  hasAccess={hasWhatsApp}
  featureName="Enviar WhatsApp"
  onClick={handleSend}
>
  Enviar Mensagem
</LockedButton>
```

---

## 🔌 Evolution API

### O que é?

Evolution API é uma implementação **open-source** e **gratuita** da API do WhatsApp Business, permitindo envio de mensagens sem depender de soluções pagas como Twilio.

### Custo

- **Software**: R$ 0 (open-source)
- **Hosting**: R$ 5/mês (Railway)
- **Total**: R$ 5/mês

### Client Class

**lib/whatsapp/evolution-client.ts**

```typescript
import { getWhatsAppClient } from "@/lib/whatsapp/evolution-client";

const whatsapp = getWhatsAppClient();

// 1. Enviar texto
await whatsapp.sendText({
  number: "5511999999999",
  text: "Olá! Seu agendamento foi confirmado.",
  delay: 1200, // ms entre mensagens (anti-spam)
});

// 2. Enviar mídia
await whatsapp.sendMedia({
  number: "5511999999999",
  mediaUrl: "https://example.com/image.jpg",
  caption: "Confira nossa promoção!",
});

// 3. Verificar status
const status = await whatsapp.getInstanceStatus();
console.log(status.state); // "open" | "close" | "connecting"

// 4. Criar instância
await whatsapp.createInstance();

// 5. Obter QR Code
const qr = await whatsapp.getQRCode();
console.log(qr.base64); // "data:image/png;base64,..."

// 6. Desconectar
await whatsapp.logout();
```

### Métodos Disponíveis

| Método | Descrição | Retorno |
|--------|-----------|---------|
| `sendText()` | Envia mensagem de texto | `{ key: {...}, status: "pending" }` |
| `sendMedia()` | Envia imagem com legenda | `{ key: {...}, status: "pending" }` |
| `getInstanceStatus()` | Verifica conexão | `{ state: "open", ...}` |
| `createInstance()` | Cria nova instância | `{ instance: {...} }` |
| `getQRCode()` | Gera QR code | `{ code: "...", base64: "..." }` |
| `logout()` | Desconecta WhatsApp | `{ status: "success" }` |
| `formatPhoneNumber()` | Formata com DDI 55 | `"5511999999999"` |

---

## 💬 Templates de Mensagens

### Arquivo

**lib/whatsapp/templates.ts**

### Templates Disponíveis

#### 1. Novo Agendamento

```typescript
whatsappBookingCreated({
  clientName: "João Silva",
  serviceName: "Corte + Barba",
  staffName: "Carlos Barbeiro",
  date: new Date("2024-01-15T10:00:00"),
  salonName: "Barbearia Elite",
  salonPhone: "11999999999",
});
```

**Saída:**
```
🎉 Novo Agendamento Recebido!

Olá João Silva! 👋

Seu agendamento foi registrado com sucesso:

📅 Data: 15/01/2024
⏰ Horário: 10:00
💇 Serviço: Corte + Barba
👤 Profissional: Carlos Barbeiro

🏪 Barbearia Elite

📞 Dúvidas? Ligue: 11999999999

Aguardamos confirmação do estabelecimento.
```

#### 2. Confirmação

```typescript
whatsappBookingConfirmed({...});
```

**Saída:**
```
✅ Agendamento Confirmado!

Ótima notícia João Silva! 🎊

Seu agendamento foi CONFIRMADO:

📅 Data: 15/01/2024
⏰ Horário: 10:00
💇 Serviço: Corte + Barba
👤 Profissional: Carlos Barbeiro

📍 Endereço:
Rua Principal, 123
São Paulo - SP

🚗 Como chegar? Clique no link do agendamento

Até lá! ✨
```

#### 3. Lembrete 24h

```typescript
whatsappBookingReminder({...});
```

**Saída:**
```
⏰ Lembrete de Agendamento

Olá João Silva! 👋

Lembramos que você tem um agendamento AMANHÃ:

📅 Data: 15/01/2024
⏰ Horário: 10:00
💇 Serviço: Corte + Barba
👤 Profissional: Carlos Barbeiro

📍 Barbearia Elite
Rua Principal, 123

📞 Precisa reagendar? Ligue: 11999999999

Te esperamos! 😊
```

#### 4. Cancelamento

```typescript
whatsappBookingCancelled({...});
```

**Saída:**
```
❌ Agendamento Cancelado

Olá João Silva,

Seu agendamento foi cancelado:

📅 Data: 15/01/2024
⏰ Horário: 10:00
💇 Serviço: Corte + Barba

📞 Quer reagendar? Entre em contato:
11999999999

Esperamos vê-lo em breve! 🙏
```

#### 5. Conclusão + Review

```typescript
whatsappBookingCompleted({...});
```

**Saída:**
```
✨ Obrigado pela Visita!

Olá João Silva! 😊

Esperamos que tenha gostado do serviço:
💇 Corte + Barba
👤 Com Carlos Barbeiro

⭐ Sua opinião é importante!
Avalie nossa equipe e ajude outros clientes.

Até a próxima! 🙌

🏪 Barbearia Elite
📞 11999999999
```

#### 6. Promoção

```typescript
whatsappPromotion({
  clientName: "João Silva",
  promotionTitle: "Black Friday",
  promotionDetails: "50% OFF em todos os serviços",
  validUntil: new Date("2024-11-30"),
  salonName: "Barbearia Elite",
  salonPhone: "11999999999",
});
```

**Saída:**
```
🎁 Promoção Especial!

Olá João Silva! 🌟

Temos uma oferta imperdível para você:

Black Friday
50% OFF em todos os serviços

⏰ Válido até: 30/11/2024

📞 Agende agora: 11999999999

Não perca! 🔥

🏪 Barbearia Elite
```

---

## 🔄 Notificações Híbridas

### Sistema de Fallback

**lib/whatsapp/notifications.ts**

```typescript
import { notifyBookingConfirmed } from "@/lib/whatsapp/notifications";

const result = await notifyBookingConfirmed({
  salonId: "salon_123",
  clientName: "João Silva",
  clientEmail: "joao@email.com",
  clientPhone: "11999999999",
  serviceName: "Corte + Barba",
  staffName: "Carlos",
  bookingDate: new Date(),
  salonName: "Barbearia Elite",
  salonPhone: "11999999999",
  salonAddress: "Rua Principal, 123",
});

console.log(result);
// {
//   whatsapp: { sent: true, error: null },
//   email: { sent: true, error: null }
// }
```

### Lógica de Envio

```typescript
async function sendBookingNotification(data, type) {
  // 1. Verificar feature
  const hasWhatsApp = await hasFeature(data.salonId, FEATURES.WHATSAPP_NOTIFICATIONS);
  
  const results = {
    whatsapp: { sent: false, error: null },
    email: { sent: false, error: null },
  };

  // 2. Tentar WhatsApp (se disponível)
  if (hasWhatsApp && data.clientPhone) {
    try {
      const whatsapp = getWhatsAppClient();
      await whatsapp.sendText({
        number: data.clientPhone,
        text: getTemplate(type, data),
        delay: 1200,
      });
      results.whatsapp.sent = true;
    } catch (error) {
      results.whatsapp.error = error.message;
      console.error("WhatsApp failed:", error);
    }
  }

  // 3. Sempre enviar email (backup)
  try {
    await sendEmail({
      to: data.clientEmail,
      subject: getEmailSubject(type),
      html: getEmailTemplate(type, data),
    });
    results.email.sent = true;
  } catch (error) {
    results.email.error = error.message;
    console.error("Email failed:", error);
  }

  return results;
}
```

### Helper Functions

```typescript
// Novo agendamento
await notifyBookingCreated({ ... });

// Confirmação
await notifyBookingConfirmed({ ... });

// Lembrete 24h
await notifyBookingReminder({ ... });

// Cancelamento
await notifyBookingCancelled({ ... });

// Conclusão + review
await notifyBookingCompleted({ ... });
```

---

## 🖥️ Dashboard UI

### Página

**app/(admin)/dashboard/configuracoes/whatsapp/page.tsx**

### Funcionalidades

#### 1. Status Card
- ✅ Configuração (credenciais presentes?)
- ✅ Conexão (WhatsApp conectado?)
- 📊 Status da instância (open, close, connecting)

#### 2. Conectar WhatsApp
- Botão "Conectar WhatsApp"
- Gera QR Code via Evolution API
- Exibe QR Code para scan
- Atualiza status automaticamente

#### 3. Desconectar
- Botão "Desconectar" (vermelho)
- Confirmação antes de desconectar
- Limpa sessão no Evolution API

#### 4. Enviar Teste
- Input de telefone (DDD + número)
- Textarea de mensagem personalizável
- Botão "Enviar Mensagem Teste"
- Feedback de sucesso/erro

#### 5. Informações
- Lista de gatilhos automáticos
- Explicação do sistema de fallback
- Dicas de uso

### Screenshots

```
┌─────────────────────────────────────┐
│ Configuração WhatsApp [Premium⚡]   │
├─────────────────────────────────────┤
│                                     │
│ 📱 Status da Conexão                │
│ ├─ Configurado: ✅ Sim              │
│ └─ Conectado: ✅ Sim                │
│                                     │
│ [Desconectar] [Atualizar Status]    │
│                                     │
├─────────────────────────────────────┤
│                                     │
│ 📤 Enviar Mensagem de Teste         │
│                                     │
│ Telefone: [11999999999_____]        │
│                                     │
│ Mensagem:                           │
│ ┌─────────────────────────────────┐ │
│ │ Olá! Esta é uma mensagem de     │ │
│ │ teste do sistema...             │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Enviar Mensagem Teste]             │
│                                     │
└─────────────────────────────────────┘
```

### Feature Gate

```tsx
// A página inteira é protegida
<FeatureGate
  hasAccess={hasWhatsApp}
  featureName="Notificações WhatsApp"
  showUpgrade={true}
>
  {/* Conteúdo da página */}
</FeatureGate>

// Se não tem acesso, mostra:
┌─────────────────────────────────────┐
│         [Blur background]           │
│                                     │
│  🔒 Recurso Premium                 │
│                                     │
│  Notificações WhatsApp              │
│  Este recurso está disponível       │
│  no plano Profissional.             │
│                                     │
│  [Fazer Upgrade]                    │
│                                     │
└─────────────────────────────────────┘
```

---

## ⚙️ Configuração

### 1. Variáveis de Ambiente

**.env**

```bash
# Evolution API
EVOLUTION_API_URL=https://your-evolution-instance.railway.app
EVOLUTION_API_KEY=your_secure_random_key_here
EVOLUTION_INSTANCE_NAME=salon-booking

# Email (já configurado)
RESEND_API_KEY=re_fHMbMTcj_Ke98BYsLhqVLyvYBtCzQD77L
RESEND_EMAIL_FROM=agenda@salon-booking.com.br
```

### 2. Deploy Evolution API no Railway

#### Opção A: Template Pronto

1. Acesse: https://railway.app
2. Busque: "Evolution API"
3. Deploy with Template
4. Copie a URL gerada

#### Opção B: GitHub Deploy

1. Fork: https://github.com/EvolutionAPI/evolution-api
2. Railway → New Project → Deploy from GitHub
3. Selecione o fork
4. Configure env vars:
   ```
   PORT=8080
   API_KEY=generate_random_secure_key
   ```

### 3. Configurar Aplicação

1. Adicione as 3 variáveis no Railway (production)
2. Redeploy da aplicação
3. Acesse: `/dashboard/configuracoes/whatsapp`
4. Clique em "Conectar WhatsApp"
5. Escaneie o QR Code com WhatsApp Business
6. Pronto! ✅

### 4. Migração do Banco

```bash
# Já executado automaticamente durante build
npx prisma migrate deploy
```

### 5. Seed de Planos (Opcional)

```bash
npm run db:seed
```

---

## 🧪 Testes

### 1. Teste de Feature Flags

```typescript
// Test: lib/subscription-features.test.ts
import { hasFeature, FEATURES } from "@/lib/subscription-features";

// Teste 1: Plano ESSENCIAL não tem WhatsApp
const salon1 = await prisma.salon.findFirst({
  where: { subscription: { plan: { slug: "essencial" } } },
});
const hasWA1 = await hasFeature(salon1.id, FEATURES.WHATSAPP_NOTIFICATIONS);
expect(hasWA1).toBe(false);

// Teste 2: Plano PROFISSIONAL tem WhatsApp
const salon2 = await prisma.salon.findFirst({
  where: { subscription: { plan: { slug: "profissional" } } },
});
const hasWA2 = await hasFeature(salon2.id, FEATURES.WHATSAPP_NOTIFICATIONS);
expect(hasWA2).toBe(true);
```

### 2. Teste de Envio WhatsApp

```bash
# Via Dashboard
1. Acesse /dashboard/configuracoes/whatsapp
2. Digite seu telefone (com DDD): 11999999999
3. Clique em "Enviar Mensagem Teste"
4. Verifique WhatsApp no celular
```

### 3. Teste de API

```bash
# POST /api/whatsapp/test
curl -X POST http://localhost:3000/api/whatsapp/test \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "5511999999999",
    "message": "Teste de mensagem! 🎉"
  }'
```

### 4. Teste de Notificação Híbrida

```typescript
import { notifyBookingConfirmed } from "@/lib/whatsapp/notifications";

const result = await notifyBookingConfirmed({
  salonId: "salon_123",
  clientName: "João Teste",
  clientEmail: "teste@email.com",
  clientPhone: "11999999999",
  serviceName: "Corte + Barba",
  staffName: "Carlos",
  bookingDate: new Date(),
  salonName: "Barbearia Teste",
  salonPhone: "11988888888",
  salonAddress: "Rua Teste, 123",
});

console.log(result);
// {
//   whatsapp: { sent: true, error: null },
//   email: { sent: true, error: null }
// }
```

### 5. Teste de QR Code

```bash
# GET /api/whatsapp/status
curl http://localhost:3000/api/whatsapp/status

# POST /api/whatsapp/status (gerar QR)
curl -X POST http://localhost:3000/api/whatsapp/status

# Retorno:
{
  "success": true,
  "qrCode": "data:image/png;base64,iVBORw0KG...",
  "message": "QR Code gerado com sucesso"
}
```

---

## 🔧 Troubleshooting

### Problema 1: QR Code não aparece

**Sintomas:**
- Botão "Conectar WhatsApp" clicado
- Nenhum QR Code exibido

**Soluções:**
1. Verificar logs do Evolution API:
   ```bash
   railway logs --follow
   ```
2. Testar endpoint manualmente:
   ```bash
   curl $EVOLUTION_API_URL/instance/qrcode/$EVOLUTION_INSTANCE_NAME \
     -H "apikey: $EVOLUTION_API_KEY"
   ```
3. Recriar instância:
   ```bash
   curl -X DELETE $EVOLUTION_API_URL/instance/$EVOLUTION_INSTANCE_NAME \
     -H "apikey: $EVOLUTION_API_KEY"
   ```

### Problema 2: Mensagem não enviada

**Sintomas:**
- "Mensagem enviada" mas não chegou no WhatsApp

**Soluções:**
1. Verificar formato do telefone:
   ```
   ✅ Correto: 5511999999999 (DDI + DDD + número)
   ❌ Errado: 11999999999 (falta DDI 55)
   ```
2. Verificar conexão:
   ```bash
   curl $EVOLUTION_API_URL/instance/connectionState/$EVOLUTION_INSTANCE_NAME \
     -H "apikey: $EVOLUTION_API_KEY"
   ```
3. Ver logs do servidor:
   ```bash
   railway logs --tail 100
   ```

### Problema 3: "Feature WhatsApp não disponível"

**Sintomas:**
- Erro 403 ao acessar dashboard

**Soluções:**
1. Verificar plano da assinatura:
   ```sql
   SELECT s.name, p.slug, p.features
   FROM "Salon" s
   JOIN "Subscription" sub ON sub."salonId" = s.id
   JOIN "Plan" p ON p.id = sub."planId"
   WHERE s.id = 'salon_123';
   ```
2. Atualizar plano manualmente:
   ```sql
   UPDATE "Subscription"
   SET "planId" = (SELECT id FROM "Plan" WHERE slug = 'profissional')
   WHERE "salonId" = 'salon_123';
   ```
3. Rodar seed novamente:
   ```bash
   npm run db:seed
   ```

### Problema 4: Evolution API offline

**Sintomas:**
- "Erro ao conectar com Evolution API"
- Timeout nas requisições

**Soluções:**
1. Verificar se serviço está up:
   ```bash
   railway status
   ```
2. Restart do serviço:
   ```bash
   railway restart
   ```
3. Verificar env vars:
   ```bash
   railway variables
   ```

### Problema 5: Email fallback não funciona

**Sintomas:**
- WhatsApp falhou mas email também não chegou

**Soluções:**
1. Verificar Resend API:
   ```bash
   curl https://api.resend.com/emails \
     -H "Authorization: Bearer $RESEND_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "from": "agenda@salon-booking.com.br",
       "to": "teste@email.com",
       "subject": "Teste",
       "html": "<p>Teste</p>"
     }'
   ```
2. Verificar domínio verificado:
   - Acesse: https://resend.com/domains
   - Confirme DNS records configurados
3. Ver logs de erro:
   ```typescript
   // lib/whatsapp/notifications.ts
   console.error("Email failed:", error);
   ```

---

## 📊 Métricas de Sucesso

### KPIs do Sistema

| Métrica | Meta | Atual |
|---------|------|-------|
| Taxa de entrega WhatsApp | > 95% | - |
| Taxa de abertura WhatsApp | > 98% | - |
| Taxa de fallback (email) | < 5% | - |
| Tempo de envio | < 3s | - |
| Uptime Evolution API | > 99% | - |

### Logs de Auditoria

```typescript
// TODO: Adicionar tabela de logs
model NotificationLog {
  id        String   @id @default(cuid())
  salonId   String
  bookingId String?
  type      String   // "whatsapp" | "email"
  channel   String   // "created" | "confirmed" | "reminder" | etc
  to        String   // Telefone ou email
  status    String   // "sent" | "failed"
  error     String?
  createdAt DateTime @default(now())
  
  salon   Salon    @relation(fields: [salonId], references: [id])
  booking Booking? @relation(fields: [bookingId], references: [id])
}
```

---

## 🚀 Próximos Passos

### Fase 1: Integração (FEITO ✅)
- [x] Feature flags system
- [x] Evolution API client
- [x] Templates WhatsApp
- [x] Notificações híbridas
- [x] Dashboard UI
- [x] APIs de teste

### Fase 2: Produção (AGORA)
- [ ] Deploy Evolution API no Railway
- [ ] Configurar env vars
- [ ] Conectar WhatsApp via QR Code
- [ ] Testar envio real
- [ ] Integrar com booking confirmation flow

### Fase 3: Otimização
- [ ] Tabela de logs de notificação
- [ ] Dashboard de métricas (taxa entrega, abertura)
- [ ] Editor de templates no dashboard
- [ ] A/B testing de mensagens
- [ ] Agendamento de mensagens promocionais

### Fase 4: Avançado
- [ ] Webhook para receber respostas
- [ ] Chatbot simples
- [ ] Mensagens em massa (campanhas)
- [ ] Segmentação de clientes
- [ ] Integração com CRM

---

## 📞 Suporte

### Documentação
- Evolution API: https://doc.evolution-api.com
- Resend: https://resend.com/docs
- Prisma: https://prisma.io/docs

### Contato
- GitHub Issues: https://github.com/eliascordeiro/salao/issues
- Email: suporte@salon-booking.com.br

---

**Última atualização:** 16/12/2024  
**Versão:** 1.0.0  
**Status:** ✅ Produção (backend completo, aguardando deploy Evolution API)
