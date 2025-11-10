# Guia: Stripe Billing para Assinaturas de Salões

## 📋 Visão Geral

Este projeto usa **Stripe Billing** (não Stripe Checkout) para gerenciar assinaturas recorrentes dos salões.

### Por que Stripe Billing?

✅ **Assinaturas recorrentes automatizadas**
✅ **Trial period nativo** (30 dias grátis)
✅ **Billing Portal** (salão gerencia próprio pagamento)
✅ **Webhooks confiáveis** para sincronização
✅ **Cobrança condicional** (via Stripe metering ou custom logic)

❌ **NÃO usar Stripe Checkout** (feito para pagamentos únicos)

---

## 🏗️ Arquitetura do Sistema

### Fluxo Completo

```
1. Salão se registra
   ↓
2. Sistema cria Stripe Customer
   ↓
3. Sistema cria Subscription com trial_period_days=30
   ↓
4. Salão usa plataforma gratuitamente por 30 dias
   ↓
5. Após trial, sistema calcula receita mensal
   ↓
6. Se receita > R$ 1.000:
   - Stripe cobra R$ 39,00 automaticamente
   - Webhook confirma pagamento
   - Subscription continua ativa
   ↓
7. Se receita < R$ 1.000:
   - Stripe NÃO cobra (via coupon 100% ou cancelamento preventivo)
   - Subscription continua ativa (FREE tier)
```

---

## 🔧 APIs Stripe a Usar

### 1. Criar Customer (ao registrar salão)

```typescript
const customer = await stripe.customers.create({
  email: salon.email,
  name: salon.name,
  metadata: {
    salonId: salon.id,
  },
});
```

### 2. Criar Subscription com Trial

```typescript
const subscription = await stripe.subscriptions.create({
  customer: customer.id,
  items: [
    {
      price: process.env.STRIPE_PRICE_ID, // R$ 39,00/mês
    },
  ],
  trial_period_days: 30,
  payment_behavior: 'default_incomplete', // Permite trial sem cartão
  metadata: {
    salonId: salon.id,
  },
});
```

### 3. Cobrança Condicional (2 abordagens)

#### Opção A: Coupon 100% OFF (Recomendado)

Se receita < R$ 1.000, aplicar cupom de 100% antes da cobrança:

```typescript
// No final do mês, antes da cobrança
const monthlyRevenue = await calculateSalonRevenue(salonId);

if (monthlyRevenue < 1000) {
  // Aplicar cupom de 100% OFF
  await stripe.subscriptions.update(subscriptionId, {
    coupon: process.env.STRIPE_COUPON_FREE_MONTH_ID,
  });
} else {
  // Remover cupom (cobra normalmente)
  await stripe.subscriptions.update(subscriptionId, {
    coupon: null,
  });
}
```

#### Opção B: Pausar/Retomar Subscription

```typescript
if (monthlyRevenue < 1000) {
  await stripe.subscriptions.update(subscriptionId, {
    pause_collection: {
      behavior: 'void', // Não cobra
    },
  });
} else {
  await stripe.subscriptions.update(subscriptionId, {
    pause_collection: null, // Volta a cobrar
  });
}
```

### 4. Billing Portal (Salão gerencia próprio cartão)

```typescript
const session = await stripe.billingPortal.sessions.create({
  customer: customerId,
  return_url: `${process.env.NEXT_PUBLIC_URL}/dashboard/assinatura`,
});

// Redirecionar para session.url
```

---

## 📡 Webhooks Essenciais

### Eventos a Escutar

1. **customer.subscription.created** - Subscription criada
2. **customer.subscription.updated** - Status mudou
3. **customer.subscription.trial_will_end** - Trial acabando (3 dias antes)
4. **invoice.payment_succeeded** - Pagamento confirmado
5. **invoice.payment_failed** - Pagamento falhou

### Exemplo de Handler

```typescript
// app/api/webhooks/stripe/route.ts
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return new Response('Webhook signature verification failed', { status: 400 });
  }

  switch (event.type) {
    case 'invoice.payment_succeeded':
      const invoice = event.data.object;
      await handlePaymentSucceeded(invoice);
      break;

    case 'invoice.payment_failed':
      const failedInvoice = event.data.object;
      await handlePaymentFailed(failedInvoice);
      break;

    case 'customer.subscription.trial_will_end':
      const subscription = event.data.object;
      await handleTrialEnding(subscription);
      break;
  }

  return new Response('Webhook processed', { status: 200 });
}
```

---

## 💾 Models do Banco de Dados

### Plan (Planos disponíveis)

```prisma
model Plan {
  id          String   @id @default(cuid())
  name        String   // "Free", "Premium"
  price       Float    // 0 ou 39.00
  stripePriceId String? // ID do Price no Stripe
  features    Json     // Array de features
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  subscriptions Subscription[]
}
```

### Subscription (Assinatura do Salão)

```prisma
model Subscription {
  id                    String   @id @default(cuid())
  salonId               String   @unique
  salon                 Salon    @relation(fields: [salonId], references: [id], onDelete: Cascade)
  
  planId                String
  plan                  Plan     @relation(fields: [planId], references: [id])
  
  status                String   // "trialing", "active", "past_due", "canceled"
  
  // Stripe IDs
  stripeCustomerId      String   @unique
  stripeSubscriptionId  String   @unique
  
  // Trial
  trialStartedAt        DateTime?
  trialEndsAt           DateTime?
  
  // Billing
  currentPeriodStart    DateTime
  currentPeriodEnd      DateTime
  cancelAtPeriodEnd     Boolean  @default(false)
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  invoices Invoice[]

  @@index([salonId])
  @@index([status])
}
```

### Invoice (Cobranças Mensais)

```prisma
model Invoice {
  id                String   @id @default(cuid())
  subscriptionId    String
  subscription      Subscription @relation(fields: [subscriptionId], references: [id], onDelete: Cascade)
  
  amount            Float
  status            String   // "draft", "open", "paid", "void", "uncollectible"
  
  stripeInvoiceId   String   @unique
  
  monthlyRevenue    Float    // Receita do salão naquele mês
  wasCharged        Boolean  // true se foi cobrado, false se não (< R$ 1.000)
  
  paidAt            DateTime?
  dueDate           DateTime
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([subscriptionId])
  @@index([status])
}
```

---

## 🔄 Fluxo de Implementação

### Fase 1: ✅ Limpar sistema antigo
- Remover Payment, Transaction models
- Deletar APIs de checkout
- Limpar UI de pagamento do cliente

### Fase 2: 🔄 Criar models de assinatura
- Adicionar Plan, Subscription, Invoice ao schema
- Rodar migração
- Seed: criar planos Free e Premium

### Fase 3: Implementar trial
- Hook ao criar Salon → criar Customer e Subscription no Stripe
- Setar trial_period_days=30
- Dashboard mostra dias restantes

### Fase 4: Lógica de cobrança condicional
- Cron job mensal (ou webhook before invoice)
- Calcular receita do mês
- Aplicar coupon 100% se < R$ 1.000

### Fase 5: Integração Stripe Billing
- API para criar Subscription
- API para Billing Portal
- Webhooks para sincronizar status

### Fase 6: Dashboard de assinatura
- Página /dashboard/assinatura
- Mostra: status, trial, receita, próxima cobrança
- Botão "Gerenciar Pagamento" → Billing Portal

---

## 📊 Exemplo de Cálculo de Receita

```typescript
// lib/revenue.ts
export async function calculateMonthlyRevenue(salonId: string): Promise<number> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const bookings = await prisma.booking.findMany({
    where: {
      salonId,
      status: 'COMPLETED',
      date: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
    select: {
      totalPrice: true,
    },
  });

  const total = bookings.reduce((sum, b) => sum + b.totalPrice, 0);
  return total;
}
```

---

## 🔐 Variáveis de Ambiente Necessárias

```bash
# Stripe Keys
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Products/Prices
STRIPE_PRICE_ID=price_...           # R$ 39,00/mês
STRIPE_COUPON_FREE_MONTH_ID=coupon_... # 100% OFF coupon

# URLs
NEXT_PUBLIC_URL=http://localhost:3000
```

---

## ✅ Checklist de Implementação

### Setup Stripe
- [ ] Criar Product "Assinatura Salão" no Stripe Dashboard
- [ ] Criar Price R$ 39,00/mês (recurring)
- [ ] Criar Coupon 100% OFF (duration: once)
- [ ] Configurar webhook endpoint

### Backend
- [ ] Adicionar models ao schema.prisma
- [ ] Criar migration
- [ ] Seed: planos Free e Premium
- [ ] API: criar Subscription
- [ ] API: Billing Portal
- [ ] Webhook handler
- [ ] Cron job: cálculo de receita mensal

### Frontend
- [ ] Página /dashboard/assinatura
- [ ] Componente: status do plano
- [ ] Componente: contador de trial
- [ ] Componente: histórico de invoices
- [ ] Botão: Gerenciar Pagamento

### Testes
- [ ] Criar salão → Subscription criada
- [ ] Trial 30 dias funciona
- [ ] Receita > R$ 1.000 → cobra R$ 39
- [ ] Receita < R$ 1.000 → não cobra
- [ ] Billing Portal funciona
- [ ] Webhooks sincronizam corretamente

---

## 📚 Recursos

- [Stripe Billing Docs](https://stripe.com/docs/billing)
- [Stripe Subscriptions Guide](https://stripe.com/docs/billing/subscriptions/overview)
- [Stripe Trial Periods](https://stripe.com/docs/billing/subscriptions/trials)
- [Stripe Customer Portal](https://stripe.com/docs/billing/subscriptions/customer-portal)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)

---

## ⚠️ Importante

1. **NUNCA use Stripe Checkout para assinaturas** - use Billing API
2. **Sempre valide webhooks** - use `stripe.webhooks.constructEvent()`
3. **Idempotência** - webhooks podem ser enviados múltiplas vezes
4. **Logs** - registre todos os eventos do Stripe no banco
5. **Testes** - use Stripe CLI para testar webhooks localmente

```bash
# Testar webhooks localmente
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

---

**Próximo Passo:** Implementar models no schema.prisma (Fase 2)
