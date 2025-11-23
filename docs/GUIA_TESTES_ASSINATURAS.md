# 🧪 Guia de Testes - Sistema de Assinaturas

## Checklist de Testes

### ✅ Testes Básicos

#### 1. Página de Planos (`/planos`)
- [ ] Página carrega sem erros
- [ ] 2 planos são exibidos (Essencial e Profissional)
- [ ] Badge "Mais Popular" aparece no Profissional
- [ ] Preços corretos: R$ 49 e R$ 149
- [ ] Features listadas corretamente
- [ ] FAQ exibida com 4 perguntas
- [ ] Botão "Começar agora" redireciona para `/checkout?plan=<slug>`
- [ ] Responsivo em mobile

#### 2. Página de Checkout (`/checkout`)
- [ ] Redireciona para `/planos` se `?plan=` inválido
- [ ] Carrega plano correto baseado em query param
- [ ] Exibe resumo do pedido (nome, preço, features)
- [ ] Total hoje mostra "R$ 0,00" (trial)
- [ ] Texto "Primeira cobrança em 14 dias" aparece
- [ ] Seleção de PIX/Cartão funciona
- [ ] Visual muda ao selecionar método de pagamento
- [ ] Botão muda texto: "Gerar QR Code PIX" vs "Ir para pagamento"
- [ ] Garantias exibidas no rodapé
- [ ] Links para termos/privacidade funcionam
- [ ] Responsivo em mobile

#### 3. API: Create Preference
**Request**:
```bash
curl -X POST http://localhost:3000/api/subscriptions/create-preference \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=<seu-token>" \
  -d '{"planSlug":"profissional","paymentMethod":"pix"}'
```

**Verificações**:
- [ ] Retorna 401 se não autenticado
- [ ] Retorna 400 se planSlug inválido
- [ ] Retorna 400 se já tem assinatura ativa
- [ ] Retorna 200 com `{ preferenceId, initPoint, sandboxInitPoint, subscription }`
- [ ] Subscription criada no banco com status PENDING
- [ ] `trialEndsAt` é +14 dias da data atual

#### 4. Mercado Pago Checkout
- [ ] Redirect para sandbox.mercadopago.com.br funciona
- [ ] PIX: QR Code é exibido
- [ ] PIX: Código copia e cola funciona
- [ ] Cartão: Formulário de cartão aparece
- [ ] Cartão aprovado (5031 4332 1540 6351) → sucesso
- [ ] Cartão rejeitado (5031 4332 1540 5814) → erro

#### 5. Webhook
**Simulação manual**:
```bash
curl -X POST http://localhost:3000/api/subscriptions/webhook \
  -H "Content-Type: application/json" \
  -d '{"type":"payment","data":{"id":"<payment-id-do-mp>"}}'
```

**Verificações**:
- [ ] Recebe POST do Mercado Pago
- [ ] Busca detalhes do pagamento via MP API
- [ ] Atualiza subscription para ACTIVE (se approved)
- [ ] Cria registro SubscriptionPayment
- [ ] Define startDate e nextBillingDate
- [ ] Retorna { received: true }
- [ ] Logs aparecem no terminal

#### 6. Páginas de Retorno

**Sucesso (`/dashboard/assinatura/sucesso`)**:
- [ ] Loading inicial de 3 segundos
- [ ] Chama /api/subscriptions/status
- [ ] Exibe dados da assinatura ativa
- [ ] Badge "Ativa" verde aparece
- [ ] Botões "Ir para Dashboard" e "Gerenciar Assinatura" funcionam
- [ ] Trial info box aparece
- [ ] Link de suporte funciona

**Erro (`/dashboard/assinatura/erro`)**:
- [ ] Ícone vermelho de erro aparece
- [ ] Lista motivos possíveis
- [ ] Botão "Tentar Novamente" → `/planos`
- [ ] Botão "Voltar ao Dashboard" → `/dashboard`
- [ ] Link de suporte funciona

**Pendente (`/dashboard/assinatura/pendente`)**:
- [ ] Ícone amarelo de relógio aparece
- [ ] Instruções PIX são exibidas
- [ ] Tempo de expiração (30 min) mencionado
- [ ] Botão "Verificar Status" recarrega página
- [ ] Botão "Voltar ao Dashboard" funciona

#### 7. API: Subscription Status
**Request**:
```bash
curl http://localhost:3000/api/subscriptions/status \
  -H "Cookie: next-auth.session-token=<seu-token>"
```

**Verificações**:
- [ ] Retorna 401 se não autenticado
- [ ] Retorna 404 se salão não tem assinatura
- [ ] Retorna 200 com dados completos da assinatura
- [ ] Todos os campos estão presentes (status, planName, etc)
- [ ] Datas em formato ISO 8601

---

## 🎯 Fluxo Completo (E2E Test)

### Teste 1: PIX Aprovado
1. Login como admin (`admin@agendasalao.com.br` / `admin123`)
2. Acessar `/planos`
3. Clicar "Começar agora" no Profissional
4. Selecionar "PIX"
5. Clicar "Gerar QR Code PIX"
6. Pagar PIX no sandbox do MP (ou simular aprovação)
7. Aguardar redirect para `/dashboard/assinatura/sucesso`
8. Verificar dados da assinatura
9. Ir para Prisma Studio → Subscription → status = ACTIVE
10. Verificar SubscriptionPayment criado

**Resultado esperado**: ✅ Assinatura ativa, trial de 14 dias, próxima cobrança em 30 dias

---

### Teste 2: Cartão Rejeitado
1. Login como admin
2. Acessar `/planos`
3. Clicar "Começar agora" no Essencial
4. Selecionar "Cartão de Crédito"
5. Clicar "Ir para pagamento"
6. Inserir cartão rejeitado (5031 4332 1540 5814)
7. Aguardar redirect para `/dashboard/assinatura/erro`
8. Verificar mensagem de erro
9. Clicar "Tentar Novamente"

**Resultado esperado**: ❌ Pagamento rejeitado, volta para `/planos`

---

### Teste 3: PIX Pendente (Timeout)
1. Login como admin
2. Acessar `/planos`
3. Clicar "Começar agora" no Profissional
4. Selecionar "PIX"
5. Clicar "Gerar QR Code PIX"
6. **NÃO pagar** (deixar expirar)
7. Aguardar redirect para `/dashboard/assinatura/pendente`
8. Verificar instruções PIX
9. Clicar "Verificar Status" (ainda pendente)

**Resultado esperado**: ⏳ Status PENDING, orientações para completar pagamento

---

## 🔍 Debugging

### Verificar Logs no Terminal
```bash
# Ao criar preference
🎯 Criando preference de pagamento...
✅ Preference criada: <preference-id>

# Ao receber webhook
🔔 Webhook recebido do Mercado Pago
💰 Detalhes do pagamento: <payment-id>
✅ Assinatura ativada com sucesso!
```

### Verificar Banco de Dados
```bash
npx prisma studio

# Verificar:
# 1. Plan → 2 registros (Essencial, Profissional)
# 2. Subscription → 1 registro por salão
# 3. SubscriptionPayment → 1 registro por pagamento aprovado
```

### Verificar Variáveis de Ambiente
```bash
# .env deve ter:
MERCADOPAGO_ACCESS_TOKEN=TEST-...
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=TEST-...
```

### Testar Webhook Localmente com ngrok
```bash
# 1. Instalar ngrok
npm install -g ngrok

# 2. Expor porta 3000
ngrok http 3000

# 3. Copiar URL (ex: https://abc123.ngrok.io)

# 4. Atualizar webhook no MP:
# https://abc123.ngrok.io/api/subscriptions/webhook

# 5. Fazer pagamento de teste
# 6. Ver webhook chegando no terminal do ngrok
```

---

## 🐛 Problemas Comuns

### 1. Webhook não recebe notificação
**Causa**: URL do webhook não configurada no MP  
**Solução**: Adicionar URL no [MP Dashboard](https://www.mercadopago.com.br/developers/panel) → Webhooks

### 2. Preference creation falha com 401
**Causa**: MERCADOPAGO_ACCESS_TOKEN inválido ou expirado  
**Solução**: Gerar novo token TEST no dashboard do MP

### 3. Subscription não muda para ACTIVE
**Causa**: Webhook não processou pagamento  
**Solução**: 
- Verificar logs do webhook
- Chamar webhook manualmente com payment_id
- Verificar se payment.metadata.salon_id está correto

### 4. Redirect após pagamento não funciona
**Causa**: back_urls incorretas na preference  
**Solução**: Verificar `NEXTAUTH_URL` no .env

### 5. "Plano não encontrado" no checkout
**Causa**: Seed de planos não executado  
**Solução**: `node prisma/seed-plans.js`

---

## ✅ Checklist Pré-Deploy

Antes de fazer deploy em produção:

- [ ] Todos os testes E2E passando
- [ ] Webhook testado com ngrok
- [ ] Credenciais de PRODUÇÃO configuradas
- [ ] Webhook URL de PRODUÇÃO cadastrada no MP
- [ ] Feature flags implementadas (bloquear premium)
- [ ] Dashboard de assinatura implementado
- [ ] Emails de notificação configurados
- [ ] Testes com PIX e Cartão reais
- [ ] Verificar taxas do MP na conta de produção
- [ ] Documentação atualizada

---

## 📊 Métricas para Monitorar

Após deploy em produção:

1. **Taxa de conversão trial → pago**
   - Meta: >70% (14 dias é tempo bom)

2. **Churn rate mensal**
   - Meta: <5% ao mês

3. **Distribuição de planos**
   - Observar se Profissional atrai clientes

4. **Método de pagamento preferido**
   - PIX vs Cartão (provavelmente 70-80% PIX no Brasil)

5. **MRR (Monthly Recurring Revenue)**
   - Acompanhar crescimento mês a mês

6. **Rejeições de pagamento**
   - Se >10%, investigar causas

---

## 🎉 Próximo Milestone

Quando todos os testes passarem, implementar:

1. **Feature Flags** (prioridade alta)
2. **Dashboard Admin** (prioridade alta)
3. **Emails de Notificação** (prioridade média)
4. **Upgrade/Downgrade de Planos** (prioridade média)
5. **Métricas e Analytics** (prioridade baixa)

Sistema está **70% completo** e pronto para testes extensivos! 🚀
