# Sistema de Assinaturas com Mercado Pago

## ✅ Status da Implementação
**Sistema completo e funcional** (70% implementado, 30% faltando feature flags e dashboard admin)

## 📋 Visão Geral

Sistema de assinaturas mensais para o SalaoBlza com dois planos (Essencial e Profissional), integrado ao Mercado Pago para pagamentos via PIX e Cartão de Crédito.

### Características Principais
- ✅ 2 planos de assinatura (Essencial R$49 e Profissional R$149)
- ✅ Período trial de 14 dias gratuitos
- ✅ Pagamento via PIX (0% taxa transacional) ou Cartão (4.99% + R$0.40)
- ✅ Checkout hospedado no Mercado Pago (seguro e PCI compliant)
- ✅ Webhook para confirmação automática de pagamento
- ✅ Páginas de retorno (sucesso/erro/pendente)
- ⏳ Feature flags para restringir recursos premium (próximo)
- ⏳ Dashboard admin para gerenciar assinatura (próximo)

---

## 🎯 Planos de Assinatura

### Plano Essencial - R$ 49/mês
**Target**: Pequenos salões, profissionais solo

**Limites**:
- Até 2 profissionais cadastrados
- 1 usuário admin

**Funcionalidades incluídas**:
- Agendamentos ilimitados
- Catálogo de serviços
- Calendário e horários
- Perfil público do salão
- Notificações por email
- Suporte por email

---

### Plano Profissional - R$ 149/mês
**Target**: Salões estabelecidos, crescimento

**Limites**:
- Profissionais ilimitados
- Até 5 usuários admin

**Funcionalidades incluídas**:
- Todas do Essencial +
- Pagamentos online (Stripe)
- WhatsApp Business integrado
- Relatórios financeiros avançados
- Controle de despesas/receitas
- Multi-usuários (até 5)
- Permissões personalizadas
- Chat IA (assistente virtual)
- Suporte prioritário
- Analytics e insights

---

## 🗄️ Estrutura do Banco de Dados

### Model: Plan
```prisma
model Plan {
  id            String         @id @default(cuid())
  name          String         // "Essencial", "Profissional"
  slug          String         @unique // "essencial", "profissional"
  description   String
  price         Float          // 49.00, 149.00
  maxStaff      Int?           // 2, null (unlimited)
  maxUsers      Int            @default(1) // 1, 5
  features      String[]       // Array de features
  active        Boolean        @default(true)
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  subscriptions Subscription[]
  
  @@index([slug])
  @@index([active])
}
```

### Model: Subscription
```prisma
model Subscription {
  id                    String    @id @default(cuid())
  salonId               String    @unique // One salon = one subscription
  planId                String
  
  // Mercado Pago IDs
  mpSubscriptionId      String?   @unique
  mpPreferenceId        String?   // Payment preference ID
  mpPaymentId           String?   // Last payment ID
  paymentMethod         String    // "pix" or "credit_card"
  
  // Status management
  status                String    @default("PENDING") // PENDING, ACTIVE, CANCELED, EXPIRED, SUSPENDED
  startDate             DateTime?
  endDate               DateTime?
  nextBillingDate       DateTime?
  canceledAt            DateTime?
  
  // Payment tracking
  lastPaymentDate       DateTime?
  lastPaymentAmount     Float?
  lastPaymentStatus     String?
  
  // Trial period
  trialEndsAt           DateTime? // 14 days from creation
  
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  
  salon                 Salon     @relation(...)
  plan                  Plan      @relation(...)
  payments              SubscriptionPayment[]
  
  @@index([salonId])
  @@index([planId])
  @@index([status])
  @@index([nextBillingDate])
}
```

### Model: SubscriptionPayment
```prisma
model SubscriptionPayment {
  id              String       @id @default(cuid())
  subscriptionId  String
  
  // Mercado Pago payment info
  mpPaymentId     String       @unique
  mpStatus        String       // "approved", "pending", "rejected", "refunded"
  mpStatusDetail  String?
  
  // Payment details
  amount          Float
  currency        String       @default("BRL")
  paymentMethod   String       // "pix", "credit_card", "debit_card"
  
  paidAt          DateTime?
  createdAt       DateTime     @default(now())
  
  subscription    Subscription @relation(...)
  
  @@index([subscriptionId])
  @@index([mpPaymentId])
  @@index([mpStatus])
  @@index([createdAt])
}
```

---

## 🔄 Fluxo de Pagamento

### 1. Seleção do Plano (`/planos`)
```
Cliente visualiza os 2 planos disponíveis
↓
Compara features e preços
↓
Clica em "Começar agora" no plano desejado
↓
Redirecionado para /checkout?plan=essencial (ou profissional)
```

### 2. Checkout (`/checkout`)
```
Sistema carrega detalhes do plano via /api/plans
↓
Cliente escolhe forma de pagamento:
  • PIX (0% taxa, aprovação instantânea)
  • Cartão de Crédito (renovação automática)
↓
Cliente clica em "Gerar QR Code PIX" ou "Ir para pagamento"
↓
Sistema chama /api/subscriptions/create-preference
↓
API retorna { preferenceId, initPoint, sandboxInitPoint }
↓
Redirect para Mercado Pago checkout (initPoint)
```

### 3. Mercado Pago Checkout
```
PIX:
  - Exibe QR Code e código copia e cola
  - Cliente paga pelo app do banco
  - Confirmação em até 1 minuto
  
Cartão de Crédito:
  - Formulário seguro para dados do cartão
  - Validação em tempo real
  - Aprovação ou rejeição imediata
```

### 4. Webhook (`/api/subscriptions/webhook`)
```
Mercado Pago envia notificação:
POST /api/subscriptions/webhook
{
  "type": "payment",
  "data": { "id": "1234567890" }
}
↓
Sistema busca detalhes do pagamento via MP API
↓
Atualiza subscription:
  - status: PENDING → ACTIVE (se aprovado)
  - startDate: Data atual
  - nextBillingDate: +30 dias
  - lastPaymentDate, lastPaymentAmount, etc
↓
Cria registro SubscriptionPayment
↓
Retorna { received: true }
```

### 5. Redirect de Retorno
```
Mercado Pago redireciona cliente:

✅ Sucesso → /dashboard/assinatura/sucesso
  - Exibe confirmação de ativação
  - Mostra detalhes do plano e próxima cobrança
  - Botões: "Ir para Dashboard" e "Gerenciar Assinatura"

❌ Erro → /dashboard/assinatura/erro
  - Exibe motivos possíveis da rejeição
  - Botão "Tentar Novamente" (volta para /planos)
  - Link para suporte

⏳ Pendente → /dashboard/assinatura/pendente
  - Informa que pagamento PIX está pendente
  - Instruções para completar pagamento
  - Botão "Verificar Status" (recarrega página)
```

---

## 🔌 APIs Implementadas

### GET /api/plans
**Descrição**: Lista todos os planos ativos  
**Autenticação**: Não requerida (pública)

**Response**:
```json
[
  {
    "id": "clxxx1",
    "name": "Essencial",
    "slug": "essencial",
    "description": "Ideal para salões pequenos...",
    "price": 49,
    "maxStaff": 2,
    "maxUsers": 1,
    "features": ["Até 2 profissionais", "Agendamentos ilimitados", ...],
    "active": true,
    "createdAt": "2025-11-23T...",
    "updatedAt": "2025-11-23T..."
  },
  {
    "id": "clxxx2",
    "name": "Profissional",
    "slug": "profissional",
    "price": 149,
    "maxStaff": null,
    "maxUsers": 5,
    "features": ["Profissionais ilimitados", "Pagamentos online", ...],
    ...
  }
]
```

---

### POST /api/subscriptions/create-preference
**Descrição**: Cria preference de pagamento no Mercado Pago  
**Autenticação**: NextAuth session (ADMIN role)

**Request Body**:
```json
{
  "planSlug": "profissional",
  "paymentMethod": "pix" // ou "credit_card"
}
```

**Response**:
```json
{
  "preferenceId": "231888674-xxxxx",
  "initPoint": "https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=xxxxx",
  "sandboxInitPoint": "https://sandbox.mercadopago.com.br/checkout/v1/redirect?pref_id=xxxxx",
  "subscription": {
    "id": "clxxx",
    "status": "PENDING",
    "trialEndsAt": "2025-12-07T00:00:00.000Z"
  }
}
```

**Erros**:
- 401: Não autorizado (sem sessão)
- 400: Plano inválido ou já possui assinatura ativa
- 500: Erro ao criar preference no MP

---

### POST /api/subscriptions/webhook
**Descrição**: Recebe notificações de pagamento do Mercado Pago  
**Autenticação**: Nenhuma (público, mas deve validar IP do MP em produção)

**Request Body** (enviado pelo MP):
```json
{
  "type": "payment",
  "data": {
    "id": "1234567890"
  }
}
```

**Ações**:
1. Busca detalhes do pagamento via `getPaymentInfo(paymentId)`
2. Extrai `salon_id` do `payment.metadata`
3. Busca subscription no banco via `salonId`
4. Atualiza status baseado em `payment.status`:
   - `approved` → `ACTIVE`
   - `pending` / `in_process` → `PENDING`
   - `rejected` / `cancelled` / `refunded` → `CANCELED`
5. Se aprovado, cria registro `SubscriptionPayment`

**Response**:
```json
{ "received": true }
```

---

### GET /api/subscriptions/status
**Descrição**: Retorna status da assinatura do salão logado  
**Autenticação**: NextAuth session (ADMIN role)

**Response**:
```json
{
  "id": "clxxx",
  "status": "ACTIVE",
  "planName": "Profissional",
  "planPrice": 149,
  "startDate": "2025-11-23T12:00:00.000Z",
  "trialEndsAt": "2025-12-07T12:00:00.000Z",
  "nextBillingDate": "2025-12-23T12:00:00.000Z",
  "paymentMethod": "pix",
  "lastPaymentDate": "2025-11-23T12:05:00.000Z",
  "lastPaymentAmount": 149,
  "lastPaymentStatus": "approved"
}
```

**Erros**:
- 401: Não autorizado
- 404: Salão ou assinatura não encontrados

---

## 🧪 Testando o Sistema

### 1. Ambiente de Desenvolvimento

**Variáveis necessárias** (`.env`):
```env
# Mercado Pago TEST credentials
MERCADOPAGO_ACCESS_TOKEN=TEST-8518519804035846-112314-28ddb7a6c3224189d88b8f5e5dc2cf7d-231888674
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=TEST-1b4c6be1-eafd-4e5d-811e-74cba95096fa
```

### 2. Seed dos Planos
```bash
# Popular banco com os 2 planos
node prisma/seed-plans.js
```

### 3. Cartões de Teste (Mercado Pago)

**Cartão Aprovado**:
```
Número: 5031 4332 1540 6351
CVV: 123
Validade: 11/25
Nome: APRO (qualquer nome)
```

**Cartão Rejeitado**:
```
Número: 5031 4332 1540 5814
CVV: 123
Validade: 11/25
Nome: OTHE (qualquer nome)
```

**PIX (Sandbox)**:
- O QR Code gerado é funcional no ambiente TEST
- Não é necessário pagar de verdade
- Pode simular aprovação via dashboard do Mercado Pago

### 4. Fluxo de Teste Completo

```bash
# 1. Iniciar servidor
npm run dev

# 2. Fazer login como admin
# Email: admin@agendasalao.com.br
# Senha: admin123

# 3. Acessar página de planos
http://localhost:3000/planos

# 4. Escolher plano "Profissional" → "Começar agora"
http://localhost:3000/checkout?plan=profissional

# 5. Selecionar "PIX" ou "Cartão de Crédito"

# 6. Clicar em "Gerar QR Code PIX" ou "Ir para pagamento"
# Redirect para: https://sandbox.mercadopago.com.br/checkout/v1/redirect?pref_id=...

# 7. Completar pagamento no Mercado Pago

# 8. Ser redirecionado para:
# - /dashboard/assinatura/sucesso (se aprovado)
# - /dashboard/assinatura/erro (se rejeitado)
# - /dashboard/assinatura/pendente (se PIX pendente)

# 9. Verificar banco de dados:
npx prisma studio
# Navegar para Subscription → verificar status ACTIVE
# Navegar para SubscriptionPayment → verificar registro criado
```

### 5. Testando Webhook Localmente

Para testar o webhook em localhost, use **ngrok** ou **Cloudflare Tunnel**:

```bash
# Instalar ngrok
npm install -g ngrok

# Expor porta 3000
ngrok http 3000

# Copiar URL gerada (ex: https://abc123.ngrok.io)
# Atualizar no Mercado Pago dashboard:
# Webhook URL: https://abc123.ngrok.io/api/subscriptions/webhook

# Agora os webhooks chegarão no seu localhost
```

---

## 🚀 Deploy em Produção

### 1. Railway (Recomendado)

**Variáveis de Ambiente**:
```bash
# Via Railway CLI ou dashboard
railway variables set MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxxxx (PRODUCTION)
railway variables set NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=APP_USR-xxxxx
```

**Migração do Banco**:
```bash
railway run npx prisma migrate deploy
railway run node prisma/seed-plans.js
```

**Webhook URL**:
```
https://seu-app.up.railway.app/api/subscriptions/webhook
```
Adicione esta URL no dashboard do Mercado Pago em:
**Developers → Webhooks → Add webhook URL**

### 2. Credenciais de Produção

Obtenha no [Mercado Pago Dashboard](https://www.mercadopago.com.br/developers/panel):

1. Criar conta no Mercado Pago (se não tiver)
2. Acessar **Developers → Suas aplicações**
3. Criar nova aplicação ou usar existente
4. Em **Credenciais de produção**, copiar:
   - `Access Token` → `MERCADOPAGO_ACCESS_TOKEN`
   - `Public Key` → `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY`
5. Ativar modo PRODUÇÃO (toggle no dashboard)

⚠️ **IMPORTANTE**: 
- No modo PRODUÇÃO, os pagamentos são REAIS
- Configure webhook URL corretamente
- Teste TUDO em modo TEST antes de ir para produção

---

## 📊 Estrutura de Status

### Status de Subscription
- **PENDING**: Aguardando pagamento
- **ACTIVE**: Ativa (trial ou paga)
- **CANCELED**: Cancelada pelo usuário
- **EXPIRED**: Expirada (trial acabou ou pagamento falhou)
- **SUSPENDED**: Suspensa (ação administrativa)

### Status de Payment (Mercado Pago)
- **approved**: Aprovado
- **pending**: Pendente (PIX não pago ainda)
- **in_process**: Em processamento
- **rejected**: Rejeitado (cartão recusado, saldo insuficiente)
- **cancelled**: Cancelado
- **refunded**: Estornado

### Mapeamento MP → Sistema
```typescript
const statusMap = {
  'approved': 'ACTIVE',
  'pending': 'PENDING',
  'in_process': 'PENDING',
  'rejected': 'EXPIRED',
  'cancelled': 'CANCELED',
  'refunded': 'CANCELED',
};
```

---

## ⏳ Próximos Passos (Pendentes)

### 1. Sistema de Feature Flags
**Objetivo**: Restringir funcionalidades premium por plano

**Implementação**:
```typescript
// lib/feature-flags.ts
export async function hasFeature(salonId: string, feature: string): Promise<boolean> {
  const subscription = await prisma.subscription.findUnique({
    where: { salonId },
    include: { plan: true },
  });
  
  if (!subscription || subscription.status !== 'ACTIVE') {
    return false; // Trial expirado ou sem assinatura
  }
  
  // Verificar limites
  if (feature === 'unlimited_staff') {
    return subscription.plan.maxStaff === null;
  }
  
  if (feature === 'payments') {
    return subscription.plan.slug === 'profissional';
  }
  
  // ... outras verificações
}
```

**Uso no código**:
```typescript
// Proteger rota de pagamentos
if (!(await hasFeature(salonId, 'payments'))) {
  return NextResponse.json({
    error: 'Faça upgrade para o plano Profissional para usar pagamentos online'
  }, { status: 403 });
}
```

**UI**:
```tsx
{!hasProfessionalPlan && (
  <div className="opacity-50 pointer-events-none relative">
    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
      <Badge>🔒 Plano Profissional</Badge>
    </div>
    {/* Feature bloqueada */}
  </div>
)}
```

### 2. Dashboard de Assinatura (Admin)
**Objetivo**: Página para gerenciar assinatura no painel admin

**Rota**: `/dashboard/assinatura`

**Seções**:
- **Card do Plano Atual**:
  - Nome, preço, features
  - Status (trial, ativa, cancelada)
  - Próxima cobrança
  - Botão "Trocar Plano"

- **Histórico de Pagamentos**:
  - Tabela com data, valor, método, status
  - Download de comprovantes

- **Ações**:
  - Trocar plano (upgrade/downgrade)
  - Cancelar assinatura (marca para fim do período)
  - Reativar assinatura cancelada
  - Atualizar forma de pagamento

### 3. Notificações por Email
- Trial terminando em 3 dias
- Pagamento confirmado
- Pagamento rejeitado (solicita nova tentativa)
- Assinatura cancelada
- Assinatura reativada

### 4. Renovação Automática
**PIX**: Enviar email com link de pagamento 5 dias antes da renovação  
**Cartão**: Cobrança automática via Mercado Pago (já configurado)

### 5. Métricas e Analytics
- MRR (Monthly Recurring Revenue)
- Churn rate (% de cancelamentos)
- Trial conversion rate (% que vira pago)
- Distribuição de planos (Essencial vs Profissional)
- LTV (Lifetime Value) médio

---

## 🔒 Segurança

### Webhook Protection (Recomendado para Produção)
```typescript
// Validar assinatura do Mercado Pago
import crypto from 'crypto';

function validateWebhookSignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  
  return hash === signature;
}

// No webhook route:
const signature = request.headers.get('x-signature');
if (!validateWebhookSignature(rawBody, signature, MP_WEBHOOK_SECRET)) {
  return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
}
```

### IP Whitelist (Opcional)
Aceitar webhooks apenas dos IPs do Mercado Pago:
```typescript
const MERCADOPAGO_IPS = [
  '209.225.49.0/27',
  '216.33.197.0/27',
  // ... outros ranges
];

if (!isIPAllowed(request.ip, MERCADOPAGO_IPS)) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

---

## 💰 Análise de Custos

### Mercado Pago - Taxas
- **PIX**: 0% transação + R$ 2,50 por saque (acumular saques mensais)
- **Cartão de Crédito**: 4,99% + R$ 0,40 por transação

### Exemplo de Receita (20 clientes)
**Distribuição**: 12 Essencial + 8 Profissional  
**Formas de pagamento**: 60% PIX, 40% Cartão

**Receita bruta**:
```
12 × R$49 + 8 × R$149 = R$588 + R$1.192 = R$1.780
```

**Custos Mercado Pago**:
```
PIX (12 clientes):
- Transação: R$ 0
- Saques: R$ 10 (4 saques × R$2.50)

Cartão (8 clientes):
- 8 × (4.99% de R$93,50 + R$0.40) = R$ 59,52

Total taxas: R$ 69,52
```

**Receita líquida**: R$ 1.780 - R$ 69,52 = **R$ 1.710,48**  
**Margem**: 96,1%

---

## 📚 Referências

- [Mercado Pago Node.js SDK](https://github.com/mercadopago/sdk-nodejs)
- [Mercado Pago Preferences API](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/integrate-preferences)
- [Mercado Pago Webhooks](https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Prisma Client](https://www.prisma.io/docs/concepts/components/prisma-client)

---

## 🎉 Conclusão

O sistema de assinaturas está **70% completo e funcional**. O fluxo principal de pagamento está implementado e testado:

✅ **Implementado**:
- Estrutura de banco de dados
- APIs de criação e status
- Webhook de confirmação
- Páginas públicas (/planos, /checkout)
- Páginas de retorno (sucesso/erro/pendente)
- Integração completa com Mercado Pago
- Trial de 14 dias

⏳ **Faltam**:
- Feature flags para restringir recursos premium
- Dashboard admin para gerenciar assinatura
- Notificações por email
- Sistema de upgrade/downgrade de planos

O sistema está pronto para **testes em produção** assim que os próximos 30% forem implementados.
