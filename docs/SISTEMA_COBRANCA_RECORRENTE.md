# 🔔 Sistema de Cobrança Recorrente - Mercado Pago

## ✅ Implementação Completa

### 📦 O Que Foi Implementado

#### 1. API de Assinatura Recorrente
- **Endpoint**: `/api/subscriptions/create-recurring`
- **Método**: `POST`
- **Funcionalidade**: Cria assinatura recorrente mensal no Mercado Pago usando API de Preapproval
- **Features**:
  - Cobrança automática mensal
  - Trial gratuito de 14 dias
  - Primeira cobrança apenas após trial
  - Gerenciamento automático de renovações

#### 2. Webhook do Mercado Pago
- **Endpoint**: `/api/webhooks/mercadopago`
- **Métodos**: `POST`, `GET`
- **Funcionalidade**: Recebe notificações automáticas do MP sobre pagamentos
- **Eventos Processados**:
  - `payment`: Pagamento único aprovado/rejeitado
  - `subscription_preapproval`: Assinatura autorizada/cancelada
  - `subscription_authorized_payment`: Cobrança recorrente processada

#### 3. Sistema de Notificações por Email
- ✅ Email de pagamento aprovado
- ✅ Email de falha no pagamento
- ✅ Email de assinatura cancelada
- ✅ Templates HTML responsivos

#### 4. Página de Gerenciamento
- **Rota**: `/dashboard/assinatura/gerenciar`
- **Funcionalidades**:
  - Visualizar status da assinatura
  - Ver histórico de pagamentos
  - Cancelar assinatura
  - Link para alterar plano

#### 5. APIs Auxiliares
- `/api/subscriptions/payments` - Histórico de pagamentos
- `/api/subscriptions/cancel` - Cancelar assinatura
- `/api/subscriptions/status` - Status atual (já existia)

#### 6. Sistema de Controle de Acesso
- **Arquivo**: `lib/subscription-access.ts`
- **Funções**:
  - `checkSubscriptionAccess()` - Verifica se tem acesso
  - `checkFeatureAccess()` - Verifica feature específica
  - `getBlockedFeatures()` - Lista features bloqueadas

---

## 🔧 Configuração do Webhook no Mercado Pago

### Passo 1: Acessar Painel do Mercado Pago

1. Acesse: https://www.mercadopago.com.br/developers/panel
2. Faça login com sua conta
3. Selecione seu aplicativo (ou crie um novo)

### Passo 2: Configurar URL do Webhook

1. No menu lateral, clique em **"Webhooks"**
2. Clique em **"Configurar notificações"** ou **"+ Novo webhook"**
3. Configure:

```
URL de produção: https://seu-dominio.com/api/webhooks/mercadopago
URL de teste: https://seu-dominio-teste.railway.app/api/webhooks/mercadopago

Eventos a serem notificados:
✅ payment (Pagamentos)
✅ subscription_preapproval (Assinaturas)
✅ subscription_authorized_payment (Cobranças recorrentes)
```

4. Clique em **"Salvar"**

### Passo 3: Validar Webhook

O Mercado Pago fará uma requisição GET para validar:

```bash
GET https://seu-dominio.com/api/webhooks/mercadopago
# Resposta esperada: { "status": "ok" }
```

### Passo 4: Testar Webhook

1. Faça um pagamento de teste
2. Verifique os logs no Railway:
   ```bash
   railway logs
   ```
3. Procure por: `🔔 Webhook recebido:`

---

## 📋 Configuração de Ambiente

Adicione no `.env` (se ainda não tiver):

```env
# Mercado Pago (mesmo access token usado anteriormente)
MERCADOPAGO_ACCESS_TOKEN=TEST-2547...
MERCADOPAGO_PUBLIC_KEY=TEST-852e...

# Resend (para emails - já configurado)
RESEND_API_KEY=re_...

# URL do app (para webhooks)
NEXTAUTH_URL=https://seu-dominio.com
```

---

## 🔄 Fluxo da Cobrança Recorrente

### 1. Primeira Assinatura (Trial)
```
Cliente escolhe plano → Preenche dados do cartão →
API cria preapproval no MP (com 14 dias trial) →
Assinatura salva como ACTIVE →
Cliente usa o sistema gratuitamente por 14 dias
```

### 2. Primeira Cobrança (Após Trial)
```
MP cobra automaticamente após 14 dias →
Webhook recebe notificação →
Se aprovado: Mantém ACTIVE + Envia email sucesso
Se rejeitado: Muda para SUSPENDED + Envia email falha
```

### 3. Cobranças Mensais
```
A cada 30 dias, MP cobra automaticamente →
Webhook atualiza status e nextBillingDate →
Emails são enviados automaticamente
```

### 4. Falha no Pagamento
```
MP tenta cobrar → Cartão recusado →
Webhook recebe notificação →
Status vira SUSPENDED →
Cliente recebe email com link para atualizar dados
```

### 5. Cancelamento
```
Cliente clica "Cancelar Assinatura" →
API cancela no MP e no banco →
Status vira CANCELED →
Cliente recebe email de confirmação
```

---

## 🧪 Como Testar

### Teste 1: Criar Assinatura Recorrente

**Frontend** (atualizar componente de checkout):
```typescript
// Em vez de chamar /api/subscriptions/process-payment
// Usar /api/subscriptions/create-recurring

const response = await fetch("/api/subscriptions/create-recurring", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    planSlug: "essencial",
    paymentMethodId: "credit_card",
    cardToken: token, // Token do Mercado Pago Card Form
  }),
});
```

### Teste 2: Simular Webhook Localmente

```bash
# Usar ngrok para expor localhost
ngrok http 3000

# Configurar webhook com URL do ngrok:
# https://xxxx.ngrok.io/api/webhooks/mercadopago

# Fazer pagamento de teste
# Webhook será chamado automaticamente
```

### Teste 3: Simular Falha de Pagamento

Para simular falha, o MP enviará webhook após 30 dias. Para testar antes:

```bash
# Manualmente chamar webhook com dados de teste:
curl -X POST https://seu-dominio.com/api/webhooks/mercadopago \
  -H "Content-Type: application/json" \
  -d '{
    "action": "payment.updated",
    "type": "payment",
    "data": { "id": "1234567890" }
  }'
```

---

## ⚠️ Próximas Ações Necessárias

### 1. Atualizar Frontend de Checkout
Atualmente o formulário usa `/process-payment` (pagamento único).  
Precisa trocar para `/create-recurring` (assinatura recorrente).

### 2. Adicionar Retry Logic
Se 1ª tentativa falhar, MP pode retentar automaticamente.  
Configurar no painel do MP: **Quantas tentativas? Intervalo?**

### 3. Bloquear Acesso Premium
Usar `checkSubscriptionAccess()` no middleware para bloquear features.

### 4. Dashboard de Assinaturas (Admin)
Página para admin ver:
- Total de assinaturas ativas
- Taxa de cancelamento
- MRR (Monthly Recurring Revenue)

---

## 📊 Banco de Dados

Campos importantes no modelo `Subscription`:

```prisma
model Subscription {
  // ...campos existentes...
  
  status: ACTIVE | PENDING | SUSPENDED | CANCELED
  mpSubscriptionId: ID da assinatura no MP (preapproval_id)
  nextBillingDate: Próxima data de cobrança
  lastPaymentDate: Data do último pagamento
  lastPaymentStatus: Status do último pagamento
  trialEndsAt: Fim do período de teste
}
```

---

## 🔐 Segurança

### Validar Webhooks
O MP envia header `x-signature` para validar autenticidade:

```typescript
// Em /api/webhooks/mercadopago/route.ts
const signature = request.headers.get('x-signature');
const requestId = request.headers.get('x-request-id');

// Validar usando secret key
// Implementar validação conforme docs do MP
```

### Rate Limiting
Adicionar rate limit no webhook para evitar spam:

```typescript
// Usar lib como 'express-rate-limit' ou Upstash Redis
```

---

## 📚 Referências

- [Mercado Pago - API de Assinaturas](https://www.mercadopago.com.br/developers/pt/docs/subscriptions/introduction)
- [Mercado Pago - Webhooks](https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks)
- [Mercado Pago - Testes](https://www.mercadopago.com.br/developers/pt/docs/checkout-api/testing)

---

## ✅ Checklist de Implementação

- [x] API de criação de assinatura recorrente
- [x] Webhook para receber notificações
- [x] Processamento de pagamentos aprovados
- [x] Processamento de pagamentos rejeitados
- [x] Processamento de cancelamento
- [x] Emails automáticos
- [x] Página de gerenciamento
- [x] API de histórico de pagamentos
- [x] API de cancelamento
- [x] Helper de controle de acesso
- [ ] Atualizar frontend para usar API recorrente
- [ ] Configurar webhook no painel do MP
- [ ] Adicionar retry logic
- [ ] Implementar bloqueio de features
- [ ] Dashboard admin de assinaturas
- [ ] Testes completos

---

## 🚀 Deploy

1. Fazer commit das alterações:
```bash
git add -A
git commit -m "feat: Implementa sistema de cobrança recorrente com Mercado Pago"
git push
```

2. Aguardar deploy no Railway

3. Configurar webhook no painel do MP com URL de produção

4. Testar com pagamento real

---

**Status**: ✅ Backend completo (70% → 95%)  
**Faltam**: Atualizar frontend + Configurar webhook + Testes
