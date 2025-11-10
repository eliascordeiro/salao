# 🔄 Revisão do Modelo de Negócio

## 📊 Comparação: Antes vs Agora

### ❌ MODELO ANTIGO (Removido)
```
Cliente → Agendar Serviço → Pagar R$ 150 → Salão recebe
                                ↓
                          Plataforma cobra taxa
```

**Problemas do modelo antigo:**
- Cliente precisa pagar online (barreira)
- Salão recebe menos (taxas)
- Complexidade de split de pagamento

---

### ✅ MODELO NOVO (Implementar)
```
Cliente → Agendar Serviço → GRÁTIS → Pagar no Salão
                                       ↓
Salão usa plataforma ────────────────→ Receita acumulada
                                       ↓
Se Receita > R$ 1.000/mês ────────────→ Cobra R$ 39/mês da plataforma
Se Receita ≤ R$ 1.000/mês ────────────→ GRÁTIS (trial perpétuo)
```

**Benefícios:**
- ✅ Cliente não paga nada online (menos fricção)
- ✅ Salão paga valor fixo previsível
- ✅ Salão pequeno usa de graça
- ✅ Plataforma ganha apenas de salões com movimento

---

## 🎯 Novo Fluxo de Negócio

### 1️⃣ **Cadastro do Salão**
```
1. Salão se cadastra na plataforma
2. Automaticamente ganha 30 dias GRÁTIS (trial)
3. Pode usar todas as funcionalidades
4. Não precisa cadastrar cartão
```

### 2️⃣ **Durante o Trial (30 dias)**
```
✅ Todas as funcionalidades liberadas
✅ Sistema rastreia receita gerada
✅ Dashboard mostra:
   - Dias restantes do trial
   - Receita acumulada no mês
   - Projeção de cobrança
```

### 3️⃣ **Após o Trial**
```
Sistema verifica mensalmente:

SE receita do mês > R$ 1.000:
   → Cobra R$ 39,00 do salão
   → Envia fatura por email
   → Continua liberado

SE receita do mês ≤ R$ 1.000:
   → NÃO cobra nada
   → Continua liberado
   → "Plano grátis perpétuo"
```

### 4️⃣ **Cobrança Recorrente**
```
Todo dia 1º do mês:
1. Sistema calcula receita do mês anterior
2. Se > R$ 1.000 → Cria fatura de R$ 39
3. Tenta cobrar via Stripe Billing
4. Se sucesso → Salão continua ativo
5. Se falha → Envia aviso, 3 tentativas
6. Se não pagar → Bloqueia novos agendamentos
```

---

## 📁 Arquitetura de Dados

### **Models a REMOVER:**
```prisma
❌ Payment (pagamento de clientes)
❌ Transaction (transações de clientes)
```

### **Models a CRIAR:**
```prisma
✅ Plan (plano de assinatura)
   - name: "Free" | "Premium"
   - price: 0 | 39
   - features: string[]
   - revenueThreshold: 1000

✅ Subscription (assinatura do salão)
   - salonId (unique)
   - planId
   - status: "TRIAL" | "ACTIVE" | "SUSPENDED" | "CANCELLED"
   - trialEndsAt: DateTime (30 dias após criar)
   - currentPeriodStart: DateTime
   - currentPeriodEnd: DateTime
   - cancelAtPeriodEnd: boolean
   - stripeSubscriptionId: string?
   - stripeCustomerId: string?

✅ Invoice (fatura mensal)
   - subscriptionId
   - amount: 39.00
   - status: "PENDING" | "PAID" | "FAILED"
   - periodStart: DateTime
   - periodEnd: DateTime
   - revenueGenerated: Decimal (receita do salão no período)
   - shouldCharge: boolean (se passou threshold)
   - dueDate: DateTime
   - paidAt: DateTime?
   - stripeInvoiceId: string?
```

### **Model EXISTENTE (atualizar):**
```prisma
✅ Booking (manter, mas sem payment)
   - Remover relação com Payment
   - Adicionar campo "revenue" (valor do serviço para cálculo)
   - Este valor é usado para calcular se salão passa dos R$ 1.000
```

---

## 🛠️ Mudanças Técnicas

### 1️⃣ **Remover Sistema de Pagamento de Clientes**

**Arquivos a DELETAR:**
```bash
❌ app/(client)/agendar/checkout/[id]/page.tsx
❌ app/(client)/pagamento/sucesso/page.tsx
❌ app/(client)/pagamento/cancelado/page.tsx
❌ app/api/payments/create-checkout/route.ts
❌ app/api/payments/webhook/route.ts
❌ app/api/payments/verify-session/route.ts
❌ components/payments/* (todos)
❌ STRIPE_CONFIGURADO.md
❌ SISTEMA_PAGAMENTOS.md
❌ stripe.tar.gz
❌ ./stripe (binário CLI)
```

**Código a REMOVER:**
```typescript
// Em meus-agendamentos/page.tsx
❌ Botão "💳 Pagar Agendamento"
❌ Badge "Pendente de Pagamento"
❌ Status de pagamento

// Em prisma/schema.prisma
❌ model Payment { ... }
❌ model Transaction { ... }
```

---

### 2️⃣ **Criar Sistema de Assinatura**

**Novo schema Prisma:**
```prisma
model Plan {
  id                String         @id @default(cuid())
  name              String         @unique // "Free", "Premium"
  displayName       String         // "Plano Gratuito", "Plano Premium"
  price             Decimal        @db.Decimal(10, 2) // 0.00 ou 39.00
  revenueThreshold  Decimal        @db.Decimal(10, 2) // 1000.00
  features          String[]       // ["Agendamentos ilimitados", "Relatórios"]
  isActive          Boolean        @default(true)
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt
  
  subscriptions     Subscription[]
}

model Subscription {
  id                    String   @id @default(cuid())
  salonId               String   @unique
  planId                String
  status                String   // TRIAL, ACTIVE, SUSPENDED, CANCELLED
  
  // Trial
  trialStartedAt        DateTime @default(now())
  trialEndsAt           DateTime // 30 dias após criar
  
  // Período atual
  currentPeriodStart    DateTime
  currentPeriodEnd      DateTime
  
  // Stripe
  stripeCustomerId      String?  @unique
  stripeSubscriptionId  String?  @unique
  
  // Controle
  cancelAtPeriodEnd     Boolean  @default(false)
  cancelledAt           DateTime?
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  
  salon                 Salon    @relation(fields: [salonId], references: [id], onDelete: Cascade)
  plan                  Plan     @relation(fields: [planId], references: [id])
  invoices              Invoice[]
  
  @@index([salonId])
  @@index([status])
}

model Invoice {
  id                String   @id @default(cuid())
  subscriptionId    String
  
  // Valores
  amount            Decimal  @db.Decimal(10, 2) // 39.00 ou 0.00
  revenueGenerated  Decimal  @db.Decimal(10, 2) // Receita do salão no período
  shouldCharge      Boolean  // Se passou threshold de R$ 1.000
  
  // Período
  periodStart       DateTime
  periodEnd         DateTime
  dueDate           DateTime
  
  // Status
  status            String   // PENDING, PAID, FAILED, WAIVED
  paidAt            DateTime?
  
  // Stripe
  stripeInvoiceId   String?  @unique
  stripePaymentId   String?
  
  // Metadados
  notes             String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  subscription      Subscription @relation(fields: [subscriptionId], references: [id], onDelete: Cascade)
  
  @@index([subscriptionId])
  @@index([status])
  @@index([dueDate])
}
```

---

### 3️⃣ **Atualizar Model Booking**

```prisma
model Booking {
  id          String   @id @default(cuid())
  // ... campos existentes ...
  
  // REMOVER:
  ❌ payment     Payment?
  
  // ADICIONAR:
  ✅ serviceRevenue  Decimal  @db.Decimal(10, 2) // Valor do serviço (para cálculo)
  
  // serviceRevenue = service.price no momento do agendamento
  // Usado para calcular se salão passou dos R$ 1.000/mês
}
```

---

### 4️⃣ **Nova Lógica de Negócio**

**a) Ao criar Salão:**
```typescript
// app/api/salons/route.ts (criar)
async function createSalon(data) {
  const salon = await prisma.salon.create({ ... });
  
  // Criar assinatura automática com trial
  const subscription = await prisma.subscription.create({
    data: {
      salonId: salon.id,
      planId: "free-plan-id", // Plano Free
      status: "TRIAL",
      trialStartedAt: new Date(),
      trialEndsAt: addDays(new Date(), 30), // 30 dias
      currentPeriodStart: new Date(),
      currentPeriodEnd: addMonths(new Date(), 1),
    }
  });
  
  // Enviar email de boas-vindas
  await sendWelcomeEmail(salon, subscription);
}
```

**b) Job mensal (calcular cobranças):**
```typescript
// scripts/calculate-monthly-invoices.ts
// Roda todo dia 1º do mês às 00:00

async function calculateMonthlyInvoices() {
  const subscriptions = await prisma.subscription.findMany({
    where: {
      status: { in: ["TRIAL", "ACTIVE"] },
      // Trial já acabou
      trialEndsAt: { lt: new Date() }
    },
    include: { salon: true, plan: true }
  });
  
  for (const sub of subscriptions) {
    // Calcular receita do mês anterior
    const revenue = await calculateSalonRevenue(
      sub.salonId,
      sub.currentPeriodStart,
      sub.currentPeriodEnd
    );
    
    // Verificar se deve cobrar
    const shouldCharge = revenue > sub.plan.revenueThreshold;
    const amount = shouldCharge ? sub.plan.price : 0;
    
    // Criar fatura
    const invoice = await prisma.invoice.create({
      data: {
        subscriptionId: sub.id,
        amount,
        revenueGenerated: revenue,
        shouldCharge,
        periodStart: sub.currentPeriodStart,
        periodEnd: sub.currentPeriodEnd,
        dueDate: addDays(new Date(), 7), // 7 dias para pagar
        status: shouldCharge ? "PENDING" : "WAIVED"
      }
    });
    
    // Se deve cobrar, criar cobrança no Stripe
    if (shouldCharge) {
      await createStripeInvoice(sub, invoice);
    }
    
    // Atualizar período da assinatura
    await prisma.subscription.update({
      where: { id: sub.id },
      data: {
        status: "ACTIVE",
        currentPeriodStart: sub.currentPeriodEnd,
        currentPeriodEnd: addMonths(sub.currentPeriodEnd, 1)
      }
    });
  }
}

async function calculateSalonRevenue(salonId, start, end) {
  const bookings = await prisma.booking.aggregate({
    where: {
      salonId,
      date: {
        gte: start,
        lte: end
      },
      status: { in: ["CONFIRMED", "COMPLETED"] }
    },
    _sum: {
      serviceRevenue: true
    }
  });
  
  return bookings._sum.serviceRevenue || 0;
}
```

**c) Webhook Stripe (confirmar pagamento):**
```typescript
// app/api/subscriptions/webhook/route.ts
export async function POST(req: Request) {
  const event = await stripe.webhooks.constructEvent(...);
  
  switch (event.type) {
    case 'invoice.paid':
      // Fatura paga com sucesso
      const invoice = event.data.object;
      await prisma.invoice.update({
        where: { stripeInvoiceId: invoice.id },
        data: {
          status: "PAID",
          paidAt: new Date(),
          stripePaymentId: invoice.payment_intent
        }
      });
      
      // Enviar email de recibo
      await sendInvoiceReceipt(invoice);
      break;
      
    case 'invoice.payment_failed':
      // Pagamento falhou
      await prisma.invoice.update({
        where: { stripeInvoiceId: invoice.id },
        data: { status: "FAILED" }
      });
      
      // Enviar email de aviso
      await sendPaymentFailedEmail(invoice);
      break;
  }
}
```

---

### 5️⃣ **Páginas Administrativas (Salão)**

**a) Dashboard de Assinatura:**
```
app/dashboard/assinatura/page.tsx

┌─────────────────────────────────────┐
│ 📊 Status da Assinatura             │
├─────────────────────────────────────┤
│ Plano: Premium                      │
│ Status: ✅ Ativo                     │
│ Próxima cobrança: 01/12/2025        │
│                                     │
│ ⏰ Trial: Encerrado em 15/11/2025   │
│                                     │
│ 💰 Receita Novembro:                │
│    R$ 1.850,00 (acima do limite)    │
│    Cobrança: R$ 39,00               │
│                                     │
│ 📈 Receita Outubro:                 │
│    R$ 850,00 (abaixo do limite)     │
│    Cobrança: R$ 0,00 (Grátis!)      │
└─────────────────────────────────────┘

[Ver Faturas] [Atualizar Cartão]
```

**b) Histórico de Faturas:**
```
app/dashboard/assinatura/faturas/page.tsx

Mês          | Receita    | Cobrado | Status
─────────────┼────────────┼─────────┼────────
Nov/2025     | R$ 1.850   | R$ 39   | Pago ✅
Out/2025     | R$ 850     | R$ 0    | Isento
Set/2025     | R$ 1.200   | R$ 39   | Pago ✅
```

---

### 6️⃣ **Interface do Cliente (Simplificar)**

**Mudanças:**
```typescript
// meus-agendamentos/page.tsx

// REMOVER:
❌ {booking.payment?.status === 'PENDING' && (
     <Button>Pagar Agendamento</Button>
   )}

// MANTER:
✅ Status: Confirmado | Concluído | Cancelado
✅ Botão: Cancelar (se permitido)

// Obs: Cliente vê apenas status do agendamento
// Não vê preços, não paga online
```

---

## 🎨 Novas Páginas

### 1️⃣ **Dashboard do Salão**
```
/dashboard/assinatura
- Status do plano (Trial/Ativo/Suspenso)
- Dias restantes do trial
- Receita do mês atual
- Histórico de cobranças
- Método de pagamento
```

### 2️⃣ **Página de Planos** (para upgrade futuro)
```
/dashboard/planos
┌──────────────┐  ┌──────────────┐
│ Plano Free   │  │ Plano Premium│
│              │  │              │
│ R$ 0/mês     │  │ R$ 39/mês*   │
│              │  │              │
│ *Se receita  │  │ *Cobrado só  │
│  < R$ 1.000  │  │  se > R$ 1k  │
└──────────────┘  └──────────────┘
```

---

## 📧 Emails

### 1️⃣ **Boas-vindas (ao criar salão):**
```
Assunto: Bem-vindo! 30 dias grátis para testar

Olá {nome_salao}!

Sua conta foi criada com sucesso! 🎉

✅ 30 dias de trial GRÁTIS
✅ Todas as funcionalidades liberadas
✅ Sem cobrança no cartão

Como funciona após o trial:
- Se sua receita mensal for > R$ 1.000: R$ 39/mês
- Se sua receita mensal for ≤ R$ 1.000: GRÁTIS!

[Começar a usar]
```

### 2️⃣ **Trial acabando (3 dias antes):**
```
Assunto: Seu trial acaba em 3 dias

Olá {nome_salao}!

Seu período de teste acaba em 3 dias.

Sua receita este mês: R$ {receita}

O que acontece depois:
- Se passar de R$ 1.000: Cobramos R$ 39/mês
- Se não passar: Continua GRÁTIS!

[Cadastrar método de pagamento]
```

### 3️⃣ **Fatura gerada (receita > R$ 1.000):**
```
Assunto: Fatura de R$ 39,00 - {mes/ano}

Olá {nome_salao}!

Sua fatura de {mes} foi gerada:

Período: 01/11 a 30/11
Receita gerada: R$ 1.850,00
Valor da assinatura: R$ 39,00
Vencimento: 07/12/2025

[Ver fatura] [Pagar agora]
```

### 4️⃣ **Mês grátis (receita < R$ 1.000):**
```
Assunto: Parabéns! Este mês é por nossa conta 🎉

Olá {nome_salao}!

Boa notícia! Sua receita de {mes} foi de R$ {receita}.

Como ficou abaixo de R$ 1.000, você não paga nada!

Continue usando nossa plataforma totalmente grátis.

[Ver dashboard]
```

---

## ⚙️ Configurações Stripe

### Stripe Billing (não Checkout)
```javascript
// Criar customer
const customer = await stripe.customers.create({
  email: salon.email,
  name: salon.name,
  metadata: {
    salonId: salon.id
  }
});

// Criar subscription (com trial)
const subscription = await stripe.subscriptions.create({
  customer: customer.id,
  items: [{ price: 'price_premium_39' }],
  trial_period_days: 30,
  collection_method: 'charge_automatically',
  metadata: {
    subscriptionId: dbSubscription.id
  }
});
```

---

## 🚀 Plano de Implementação

### **Fase 1: Limpeza** (1-2 dias)
- [ ] Remover todas as páginas de pagamento de clientes
- [ ] Remover APIs de pagamento
- [ ] Remover models Payment e Transaction
- [ ] Limpar referências no código

### **Fase 2: Novos Models** (1 dia)
- [ ] Criar models: Plan, Subscription, Invoice
- [ ] Migrar banco de dados
- [ ] Seed com plano Free e Premium

### **Fase 3: Lógica de Assinatura** (2-3 dias)
- [ ] Auto-criar subscription ao criar salão
- [ ] Calcular receita mensal do salão
- [ ] Job para gerar faturas (todo dia 1º)
- [ ] Integração com Stripe Billing

### **Fase 4: Dashboard** (2 dias)
- [ ] Página de status da assinatura
- [ ] Página de histórico de faturas
- [ ] Alertas de trial acabando
- [ ] Formulário de pagamento

### **Fase 5: Emails** (1 dia)
- [ ] Template de boas-vindas
- [ ] Alerta de trial acabando
- [ ] Fatura gerada
- [ ] Mês grátis

### **Fase 6: Testes** (1-2 dias)
- [ ] Testar fluxo completo
- [ ] Testar cálculo de receita
- [ ] Testar cobranças condicionais
- [ ] Testar webhooks

---

## 💰 Estimativa de Receita (Plataforma)

### Cenário Conservador:
```
100 salões cadastrados
- 20 salões > R$ 1.000/mês (pagam R$ 39)
- 80 salões < R$ 1.000/mês (grátis)

Receita mensal: 20 × R$ 39 = R$ 780/mês
Receita anual: R$ 9.360/ano
```

### Cenário Otimista:
```
1.000 salões cadastrados
- 300 salões > R$ 1.000/mês (pagam R$ 39)
- 700 salões < R$ 1.000/mês (grátis)

Receita mensal: 300 × R$ 39 = R$ 11.700/mês
Receita anual: R$ 140.400/ano
```

---

## ✅ Benefícios do Novo Modelo

### Para Salões:
- ✅ 30 dias grátis para testar
- ✅ Se faturar pouco, nunca paga
- ✅ Preço fixo previsível (R$ 39)
- ✅ Não perde % das vendas
- ✅ Clientes não precisam pagar online

### Para Plataforma:
- ✅ Receita recorrente previsível
- ✅ Mais salões podem usar (barreira baixa)
- ✅ Alinhado ao sucesso do cliente
- ✅ Mais simples de implementar
- ✅ Menos riscos legais/tributários

### Para Clientes:
- ✅ Não precisa pagar online
- ✅ Mais seguro (paga no salão)
- ✅ Menos fricção no agendamento
- ✅ Experiência mais simples

---

## 🎯 Próximos Passos

Quer que eu comece implementando qual fase?

**Sugestão de ordem:**
1. **Fase 1** (Limpeza) - Remove código antigo
2. **Fase 2** (Models) - Cria estrutura nova
3. **Fase 3** (Lógica) - Implementa regras de negócio
4. **Fase 4** (Dashboard) - Interface para salão
5. **Fase 5** (Emails) - Comunicação automática
6. **Fase 6** (Testes) - Validação completa

Qual fase começamos? 🚀
