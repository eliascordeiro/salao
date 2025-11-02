# Sistema de Pagamentos - Documentação Completa

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Configuração Inicial](#configuração-inicial)
4. [Fluxo de Pagamento](#fluxo-de-pagamento)
5. [API Reference](#api-reference)
6. [Componentes](#componentes)
7. [Webhooks](#webhooks)
8. [Testing](#testing)
9. [Troubleshooting](#troubleshooting)
10. [Segurança](#segurança)

---

## Visão Geral

O sistema de pagamentos permite que clientes realizem pagamentos online através de checkout seguro com Stripe. Inclui:

- ✅ Checkout hospedado seguro (Stripe Checkout)
- ✅ Suporte a cartões de crédito/débito
- ✅ Confirmação automática via webhooks
- ✅ Histórico completo de transações
- ✅ Painel administrativo
- ✅ Notificações por email
- ✅ Suporte a reembolsos

### Status de Pagamento

| Status | Descrição | Ações Disponíveis |
|--------|-----------|-------------------|
| `PENDING` | Aguardando pagamento | Iniciar checkout |
| `PROCESSING` | Checkout iniciado | Aguardar confirmação |
| `COMPLETED` | Pagamento confirmado | Reembolso (admin) |
| `FAILED` | Falha no pagamento | Tentar novamente |
| `REFUNDED` | Reembolsado | - |
| `CANCELLED` | Cancelado | - |

---

## Arquitetura

### Modelos de Dados

#### Payment
```prisma
model Payment {
  id                    String    @id @default(cuid())
  amount                Float
  status                String    @default("PENDING")
  method                String?   // CREDIT_CARD, DEBIT_CARD, PIX, BOLETO
  provider              String    @default("STRIPE")
  currency              String    @default("BRL")
  stripeSessionId       String?   @unique
  stripePaymentIntentId String?
  mercadopagoId         String?
  metadata              String?   // JSON
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  paidAt                DateTime?
  cancelledAt           DateTime?
  bookingId             String    @unique
  booking               Booking   @relation(...)
  userId                String
  user                  User      @relation(...)
  transactions          Transaction[]
}
```

#### Transaction
```prisma
model Transaction {
  id           String    @id @default(cuid())
  externalId   String?   // ID do provider
  status       String    // PENDING, AUTHORIZED, CAPTURED, FAILED, REFUNDED
  amount       Float
  method       String?
  errorCode    String?
  errorMessage String?
  metadata     String?   // JSON
  createdAt    DateTime  @default(now())
  processedAt  DateTime?
  paymentId    String
  payment      Payment   @relation(...)
}
```

### Fluxo de Dados

```
Cliente                  Next.js API             Stripe
  |                          |                      |
  |-- Clica "Pagar" -------->|                      |
  |                          |-- Create Session -->|
  |                          |<-- Session URL -----|
  |<-- Redireciona -----------|                      |
  |                          |                      |
  |-- Paga no Stripe -------->---------------------->|
  |                          |                      |
  |                          |<-- Webhook Event ----|
  |                          |-- Update DB -------->|
  |<-- Email Confirmação ----|                      |
  |                          |                      |
```

---

## Configuração Inicial

### 1. Criar Conta no Stripe

1. Acesse [stripe.com](https://stripe.com) e crie uma conta
2. Ative o modo de teste
3. Acesse **Developers > API Keys**
4. Copie suas chaves

### 2. Configurar Variáveis de Ambiente

Adicione ao seu `.env`:

```bash
# Stripe Payment Gateway
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Base URL (importante para webhooks)
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Configurar Webhook no Stripe

1. Acesse **Developers > Webhooks** no dashboard do Stripe
2. Clique em "Add endpoint"
3. URL do webhook: `https://seu-dominio.com/api/payments/webhook`
4. Selecione os eventos:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
5. Copie o "Signing secret" e adicione ao `.env` como `STRIPE_WEBHOOK_SECRET`

### 4. Aplicar Schema do Banco

```bash
npx prisma db push
```

---

## Fluxo de Pagamento

### 1. Cliente Inicia Pagamento

O cliente acessa a página de checkout:

```
/agendar/checkout/[bookingId]
```

Esta página mostra:
- Resumo do agendamento
- Valor total
- Botão "Pagar"
- Informações de segurança

### 2. Criar Checkout Session

Quando o cliente clica em "Pagar", o componente `CheckoutButton` chama:

```typescript
POST /api/payments/create-checkout
Body: { bookingId: string }
```

A API:
1. Valida o booking
2. Verifica permissões
3. Cria sessão no Stripe
4. Registra Payment (status: PENDING)
5. Registra Transaction (status: PENDING)
6. Retorna URL do checkout

### 3. Redirecionamento para Stripe

O cliente é redirecionado para:
```
https://checkout.stripe.com/pay/cs_test_...
```

### 4. Cliente Paga no Stripe

O cliente:
- Preenche dados do cartão
- Confirma o pagamento
- É redirecionado de volta

### 5. Confirmação via Webhook

O Stripe envia webhook para:
```
POST /api/payments/webhook
```

A API:
1. Verifica assinatura
2. Processa evento
3. Atualiza Payment (status: COMPLETED)
4. Atualiza Booking (status: CONFIRMED)
5. Registra Transaction (status: CAPTURED)
6. Envia email de confirmação

### 6. Página de Sucesso

Cliente é redirecionado para:
```
/pagamento/sucesso?session_id=cs_test_...
```

---

## API Reference

### POST /api/payments/create-checkout

Cria uma sessão de checkout no Stripe.

**Autenticação:** Requerida

**Body:**
```json
{
  "bookingId": "clxxx..."
}
```

**Response (200):**
```json
{
  "sessionId": "cs_test_...",
  "sessionUrl": "https://checkout.stripe.com/pay/cs_test_...",
  "paymentId": "clxxx..."
}
```

**Errors:**
- `401`: Não autenticado
- `400`: bookingId inválido ou já pago
- `403`: Sem permissão (não é o dono do booking)
- `500`: Erro ao criar sessão

---

### POST /api/payments/webhook

Recebe webhooks do Stripe.

**Autenticação:** Assinatura Stripe

**Headers:**
```
stripe-signature: t=xxx,v1=xxx
```

**Body:** Raw event do Stripe

**Eventos Processados:**

#### checkout.session.completed
- Atualiza payment para PROCESSING
- Registra payment_intent ID
- Cria transaction AUTHORIZED

#### payment_intent.succeeded
- Atualiza payment para COMPLETED
- Atualiza booking para CONFIRMED
- Atualiza transaction para CAPTURED
- **Envia email de confirmação**

#### payment_intent.payment_failed
- Atualiza payment para FAILED
- Cria transaction FAILED
- Registra código e mensagem de erro

#### charge.refunded
- Atualiza payment para REFUNDED
- Atualiza booking para CANCELLED
- Cria transaction REFUNDED

**Response:**
```json
{ "received": true }
```

---

### GET /api/payments/verify-session

Verifica status de uma sessão de pagamento.

**Autenticação:** Requerida

**Query Params:**
- `session_id`: ID da sessão Stripe

**Response (200):**
```json
{
  "id": "clxxx...",
  "amount": 100.00,
  "status": "COMPLETED",
  "method": "card",
  "provider": "STRIPE",
  "paidAt": "2024-01-01T10:00:00.000Z",
  "booking": {
    "id": "clxxx...",
    "date": "2024-01-15T14:00:00.000Z",
    "service": { "name": "Corte", "duration": 60 },
    "staff": { "name": "João" },
    "client": { "name": "Pedro", "email": "pedro@exemplo.com" }
  },
  "stripeSession": {
    "paymentStatus": "paid",
    "customerEmail": "pedro@exemplo.com"
  }
}
```

---

## Componentes

### CheckoutButton

Botão para iniciar checkout.

```tsx
import CheckoutButton from "@/components/payments/CheckoutButton";

<CheckoutButton
  bookingId="clxxx..."
  amount={100.00}
  disabled={false}
  className=""
/>
```

**Props:**
- `bookingId` (string, required): ID do agendamento
- `amount` (number, required): Valor a pagar
- `disabled` (boolean): Desabilita o botão
- `className` (string): Classes CSS adicionais

**Estados:**
- Loading: Mostra spinner enquanto cria sessão
- Error: Exibe mensagem de erro se falhar

---

### PaymentStatus

Badge visual do status do pagamento.

```tsx
import PaymentStatus from "@/components/payments/PaymentStatus";

<PaymentStatus
  status="COMPLETED"
  showLabel={true}
  className=""
/>
```

**Props:**
- `status` (string, required): Status do pagamento
- `showLabel` (boolean): Mostra texto do status
- `className` (string): Classes CSS adicionais

**Cores por Status:**
- `PENDING`: Amarelo
- `PROCESSING`: Azul
- `COMPLETED`: Verde
- `FAILED`: Vermelho
- `REFUNDED`: Roxo
- `CANCELLED`: Cinza

---

## Webhooks

### Testando Localmente

1. Instale o Stripe CLI:
```bash
brew install stripe/stripe-cli/stripe
# ou
curl -s https://packages.stripe.com/api/v1/install.sh | bash
```

2. Faça login:
```bash
stripe login
```

3. Escute webhooks:
```bash
stripe listen --forward-to localhost:3000/api/payments/webhook
```

4. Copie o webhook secret exibido e adicione ao `.env`

5. Teste eventos:
```bash
stripe trigger payment_intent.succeeded
```

### Webhooks em Produção

1. Configure o endpoint no dashboard do Stripe
2. Use HTTPS (obrigatório)
3. Configure o `STRIPE_WEBHOOK_SECRET` da produção
4. Monitore logs em **Developers > Webhooks**

### Retry Logic

O Stripe tenta reenviar webhooks automaticamente:
- Imediatamente
- Após 5 minutos
- Após 30 minutos
- Após 2 horas
- Após 5 horas
- Após 10 horas
- Após 24 horas (até 3 dias)

---

## Testing

### Cartões de Teste

| Número | Resultado |
|--------|-----------|
| `4242 4242 4242 4242` | Sucesso |
| `4000 0000 0000 9995` | Falha - saldo insuficiente |
| `4000 0000 0000 0002` | Falha - cartão recusado |
| `4000 0025 0000 3155` | Requer autenticação (3D Secure) |

**Demais dados:**
- Data de validade: Qualquer data futura
- CVC: Qualquer 3 dígitos
- CEP: Qualquer valor

### Fluxo de Teste Completo

1. Faça login como cliente de teste
2. Crie um agendamento
3. Acesse "Meus Agendamentos"
4. Clique em "Realizar Pagamento"
5. Use cartão de teste `4242 4242 4242 4242`
6. Confirme o pagamento
7. Verifique redirecionamento para página de sucesso
8. Verifique email de confirmação
9. Verifique status no dashboard admin

---

## Troubleshooting

### Webhook não recebe eventos

**Problema:** Pagamento confirma no Stripe mas não atualiza no banco.

**Soluções:**
1. Verifique se o webhook está configurado no dashboard Stripe
2. Confirme que a URL está correta e acessível
3. Verifique os logs em **Developers > Webhooks > Logs**
4. Confirme que `STRIPE_WEBHOOK_SECRET` está correto no `.env`
5. Em desenvolvimento, use Stripe CLI para testar localmente

---

### Erro "Invalid signature"

**Problema:** Webhook retorna 400 com "Invalid signature".

**Soluções:**
1. Confirme que `STRIPE_WEBHOOK_SECRET` está correto
2. Não modifique o body do webhook antes de validar
3. Use o secret correto (diferente para dev/prod)
4. Em produção, regenere o secret se necessário

---

### Pagamento preso em PROCESSING

**Problema:** Payment fica em PROCESSING e nunca vai para COMPLETED.

**Soluções:**
1. Verifique se o webhook `payment_intent.succeeded` foi recebido
2. Veja logs no Stripe dashboard
3. Manualmente teste o webhook:
```bash
stripe trigger payment_intent.succeeded
```
4. Verifique se há erros no servidor ao processar o webhook

---

### Cliente não é redirecionado

**Problema:** Após pagamento, cliente não volta para o site.

**Soluções:**
1. Confirme que `NEXTAUTH_URL` está correto no `.env`
2. Verifique se as URLs de success/cancel estão corretas
3. Em produção, use HTTPS
4. Teste localmente com ngrok se necessário

---

### Email não enviado

**Problema:** Pagamento confirma mas email não chega.

**Soluções:**
1. Verifique configuração SMTP no `.env`
2. Teste função `sendBookingConfirmedEmail()` diretamente
3. Verifique spam/lixeira
4. Veja logs do servidor para erros

---

## Segurança

### Checklist de Segurança

- ✅ **Nunca exponha** `STRIPE_SECRET_KEY` no frontend
- ✅ **Sempre valide** assinatura dos webhooks
- ✅ **Verifique permissões** antes de criar checkout
- ✅ **Use HTTPS** em produção
- ✅ **Valide valores** no backend (não confie no frontend)
- ✅ **Registre logs** de todas as transações
- ✅ **Monitore webhooks** falhados
- ✅ **Implemente rate limiting** nas APIs
- ✅ **Armazene apenas IDs** do Stripe (não dados sensíveis)

### Boas Práticas

1. **Idempotência**: Use IDs únicos para evitar cobranças duplicadas
2. **Retry Logic**: Implemente retry para webhooks falhados
3. **Auditoria**: Mantenha histórico completo em Transaction
4. **Timeout**: Configure timeout adequado para chamadas ao Stripe
5. **Fallback**: Tenha plano B se Stripe estiver indisponível
6. **Compliance**: Siga PCI DSS (Stripe cuida disso)

---

## Próximos Passos

### Features Futuras

- [ ] Suporte a PIX
- [ ] Suporte a boleto bancário
- [ ] Pagamento parcelado
- [ ] Cupons de desconto
- [ ] Assinatura recorrente
- [ ] Múltiplos métodos de pagamento
- [ ] Integração com Mercado Pago
- [ ] Relatórios financeiros avançados
- [ ] Exportação de notas fiscais
- [ ] Sistema de comissões

---

## Suporte

Para dúvidas ou problemas:

1. Consulte a [documentação do Stripe](https://stripe.com/docs)
2. Veja exemplos em [stripe-samples](https://github.com/stripe-samples)
3. Entre em contato: suporte@agendasalao.com.br

---

**Última atualização:** 2 de novembro de 2025
