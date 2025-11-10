# 🧪 Guia de Teste - Sistema de Pagamento

## ✅ Status Atual
- [x] Webhook do Stripe rodando (Terminal com `./stripe listen`)
- [x] Webhook secret configurado no .env
- [ ] Servidor Next.js rodando (`npm run dev`)
- [ ] Teste do fluxo completo

---

## 📋 Passo a Passo para Testar

### 1️⃣ Inicie o Servidor (se ainda não iniciou)
```bash
npm run dev
```

Aguarde até ver: `✓ Ready in XXXms`

---

### 2️⃣ Faça Login como Cliente

**Acesse:** http://localhost:3000

**Credenciais de teste:**
- Email: `pedro@exemplo.com`
- Senha: `cliente123`

---

### 3️⃣ Acesse Meus Agendamentos

**Acesse:** http://localhost:3000/meus-agendamentos

**O que você deve ver:**
- Lista de agendamentos do cliente
- Agendamentos com status `CONFIRMADO` que ainda não foram pagos
- Botão `💳 Pagar Agendamento` visível

---

### 4️⃣ Clique em "Pagar Agendamento"

**O que deve acontecer:**
- ✅ Redireciona para `/agendar/checkout/[id]`
- ✅ **NÃO deve dar erro 404**
- ✅ Página de checkout carrega

**O que você verá na página:**
- 📦 **Resumo do Serviço:** Nome, duração e preço
- 👤 **Profissional:** Nome e especialidade
- 📅 **Data e Horário:** Formatado em português
- 🏢 **Local:** Nome do salão e endereço
- 💰 **Valor Total:** Em destaque (ex: R$ 150,00)
- 🔒 **Segurança:** Badge "Pagamento Seguro" com 3 itens:
  - ✅ Processado pelo Stripe (PCI-DSS)
  - ✅ Dados criptografados
  - ✅ Não armazenamos dados de cartão
- 🎯 **Botão:** "Pagar R$ XX,XX" (gradiente azul-roxo)

---

### 5️⃣ Clique em "Pagar R$ XX,XX"

**O que deve acontecer:**
1. Botão mostra "Processando..." por alguns segundos
2. Sistema cria sessão no Stripe
3. Redireciona para `checkout.stripe.com`

**Se der erro:**
- Verifique o console do navegador (F12)
- Verifique os logs do terminal do Next.js
- Confirme que as chaves do Stripe estão corretas no .env

---

### 6️⃣ Complete o Pagamento no Stripe

**Página do Stripe mostrará:**
- Resumo do agendamento
- Valor a pagar
- Formulário de cartão

**Use o cartão de teste:**
```
Número: 4242 4242 4242 4242
Data: 12/30 (qualquer data futura)
CVV: 123 (qualquer 3 dígitos)
Nome: Qualquer nome
```

**Clique em "Pagar"**

---

### 7️⃣ Observe o Webhook (Terminal)

**No terminal onde está rodando `./stripe listen`, você verá:**

```
→ payment_intent.created
→ payment_intent.succeeded
→ checkout.session.completed
→ charge.succeeded
```

**Cada evento será:**
- Recebido pelo webhook
- Processado pela API
- Confirmado com status 200

**Se não aparecer nada:**
- Webhook não está rodando
- URL está errada
- Porta 3000 não está acessível

---

### 8️⃣ Redirecionamento de Sucesso

**Após pagamento bem-sucedido:**
- Redireciona para: `/payments/success?session_id=XXX`
- Mostra mensagem de sucesso
- Opções para voltar aos agendamentos

---

### 9️⃣ Valide no Banco de Dados

**Verifique no banco que:**

1. **Tabela Payment:**
   - Novo registro criado
   - `status` = "COMPLETED"
   - `amount` = valor do serviço
   - `stripePaymentId` = session_id do Stripe
   - `bookingId` = ID do agendamento

2. **Tabela Booking:**
   - `status` pode permanecer "CONFIRMED" (depende da lógica)
   - Relacionamento com Payment existe

3. **Tabela Transaction:**
   - Novo registro criado
   - `type` = "PAYMENT"
   - `status` = "SUCCESS"
   - Timestamps corretos

---

### 🔟 Verifique Email (se SMTP configurado)

**Se SMTP estiver configurado, cliente receberá:**
- 📧 Email de confirmação de pagamento
- Detalhes do agendamento
- Comprovante com valor pago

---

## 🐛 Problemas Comuns e Soluções

### ❌ Erro 404 ao clicar em "Pagar"
**Causa:** Página de checkout não existe  
**Solução:** ✅ JÁ CORRIGIDO! Página foi criada no commit anterior

### ❌ Botão "Pagar" não faz nada
**Causas possíveis:**
1. Chaves do Stripe inválidas → Verifique .env
2. API não está respondendo → Verifique logs do Next.js
3. JavaScript com erro → Abra console do navegador (F12)

### ❌ Webhook não recebe eventos
**Causas possíveis:**
1. `./stripe listen` não está rodando → Reinicie
2. Porta errada → Confirme que é `localhost:3000`
3. Webhook secret errado no .env → Copie do terminal

### ❌ Redireciona mas nada acontece
**Causas possíveis:**
1. Session ID inválido → Verifique resposta da API create-checkout
2. Stripe rejeitou → Verifique dashboard do Stripe
3. Credenciais de teste expiradas → Obtenha novas chaves

---

## ✅ Checklist de Teste Completo

Marque conforme testa:

- [ ] Webhook está rodando (terminal mostra "Ready!")
- [ ] Servidor Next.js está rodando (localhost:3000)
- [ ] Login como cliente funciona
- [ ] Página /meus-agendamentos carrega
- [ ] Botão "Pagar Agendamento" está visível
- [ ] Clique redireciona para /agendar/checkout/[id]
- [ ] **Página de checkout carrega SEM erro 404** ✨
- [ ] Resumo do agendamento aparece corretamente
- [ ] Valor total está correto
- [ ] Seção de segurança está visível
- [ ] Botão "Pagar R$ XX,XX" está visível
- [ ] Clique no botão mostra "Processando..."
- [ ] Redireciona para checkout.stripe.com
- [ ] Formulário de pagamento carrega
- [ ] Cartão de teste é aceito
- [ ] Pagamento é processado
- [ ] Webhook recebe 4 eventos (payment_intent, charge, etc)
- [ ] Redireciona para página de sucesso
- [ ] Payment foi criado no banco (status COMPLETED)
- [ ] Transaction foi criada no banco
- [ ] Email foi enviado (se SMTP configurado)

---

## 🎯 Resultado Esperado

**Se tudo funcionar:**
1. ✅ Cliente consegue pagar agendamento
2. ✅ Página de checkout carrega perfeitamente
3. ✅ Stripe processa pagamento
4. ✅ Webhook confirma automaticamente
5. ✅ Banco de dados é atualizado
6. ✅ Email é enviado
7. ✅ Cliente vê mensagem de sucesso

---

## 📊 Monitoramento

### Terminal 1 (Webhook):
```
→ payment_intent.created [200]
→ checkout.session.completed [200]
→ payment_intent.succeeded [200]
→ charge.succeeded [200]
```

### Terminal 2 (Next.js):
```
POST /api/payments/create-checkout 200
POST /api/payments/webhook 200
```

### Console do Navegador (F12):
- Sem erros vermelhos
- Apenas logs informativos

---

## 🚀 Próximos Passos Após Teste

Se tudo funcionar:
1. ✅ Sistema de pagamento está completo
2. Pode fazer deploy para produção
3. Trocar chaves de teste por chaves de produção
4. Configurar webhook em produção no dashboard do Stripe

Se houver problemas:
1. Anote os erros exatos
2. Verifique os logs de ambos os terminais
3. Me informe para ajudar a resolver
