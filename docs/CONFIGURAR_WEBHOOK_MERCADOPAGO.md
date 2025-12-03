# 🔧 Guia Rápido: Configurar Webhook do Mercado Pago

## ✅ Pré-requisitos
- Deploy no Railway concluído
- URL de produção: `https://salao-production.up.railway.app`
- Conta no Mercado Pago

---

## 📋 Passo a Passo

### 1. Acessar Painel do Mercado Pago

1. Acesse: **https://www.mercadopago.com.br/developers/panel**
2. Faça login com sua conta
3. Selecione seu aplicativo (ou crie um novo se necessário)

---

### 2. Configurar Webhook

1. No menu lateral esquerdo, clique em **"Webhooks"** ou **"Notificações"**
2. Clique em **"+ Novo webhook"** ou **"Configurar notificações"**
3. Preencha os campos:

```
📍 URL de Notificações (IMPORTANTE):
https://salao-production.up.railway.app/api/webhooks/mercadopago

🔔 Eventos a serem notificados:
✅ payment (Pagamentos)
✅ subscription_preapproval (Assinaturas)
✅ subscription_authorized_payment (Cobranças recorrentes)

⚙️ Modo:
- Use "Produção" para ambiente real
- Use "Teste" se ainda estiver testando
```

4. Clique em **"Salvar"** ou **"Criar webhook"**

---

### 3. Validação Automática

O Mercado Pago fará uma requisição GET para validar a URL:

```bash
GET https://salao-production.up.railway.app/api/webhooks/mercadopago
# Resposta esperada: { "status": "ok" }
```

✅ Se aparecer "Webhook configurado com sucesso", está pronto!

---

### 4. Verificar Variável de Ambiente no Railway

Certifique-se de que a variável `NEXTAUTH_URL` está configurada no Railway:

1. Acesse o projeto no Railway
2. Clique na aba **"Variables"**
3. Adicione (se não existir):

```env
NEXTAUTH_URL=https://salao-production.up.railway.app
```

4. Salve e aguarde o redeploy automático (se necessário)

---

## 🧪 Testar o Webhook

### Opção 1: Fazer Pagamento de Teste

1. Acesse: `https://salao-production.up.railway.app/planos`
2. Escolha um plano (Essencial ou Profissional)
3. Preencha com dados de teste do Mercado Pago:
   - **Nome**: APRO
   - **CPF**: 12345678909
   - **Cartão**: 5031 4332 1540 6351
   - **CVV**: 123
   - **Validade**: 11/25

4. Confirme o pagamento

5. Verifique os logs no Railway:
```bash
railway logs --service web
```

6. Procure por:
```
🔔 Webhook recebido: {...}
💳 Processando pagamento: 1234567890
✅ Pagamento processado: { subscriptionId: '...', status: 'ACTIVE' }
```

---

### Opção 2: Simular Webhook Manualmente (Desenvolvimento)

Se quiser testar localmente:

```bash
# 1. Instale ngrok (se não tiver)
npm install -g ngrok

# 2. Inicie seu servidor local
npm run dev

# 3. Exponha localhost com ngrok
ngrok http 3000

# 4. Configure webhook com URL do ngrok:
# https://xxxx.ngrok.io/api/webhooks/mercadopago

# 5. Faça um pagamento de teste
# O webhook será chamado automaticamente
```

---

## 📊 Monitorar Webhooks

### Ver Logs no Railway

```bash
# Instale Railway CLI (se não tiver)
npm install -g @railway/cli

# Faça login
railway login

# Acesse o projeto
railway link

# Veja logs em tempo real
railway logs --follow
```

### Ver no Painel do MP

1. Acesse: https://www.mercadopago.com.br/developers/panel
2. Vá em **"Webhooks"**
3. Clique no webhook configurado
4. Veja o histórico de notificações enviadas

---

## ⚠️ Problemas Comuns

### ❌ Erro 404 - Webhook não encontrado
**Causa**: URL incorreta ou deploy não concluído  
**Solução**: Verifique se a URL está correta e se o deploy terminou

### ❌ Erro 500 - Erro interno
**Causa**: Erro no código do webhook  
**Solução**: Verifique os logs do Railway para ver o erro específico

### ❌ Webhook não está sendo chamado
**Causa**: Eventos não configurados corretamente  
**Solução**: Verifique se marcou os 3 eventos (payment, subscription_preapproval, subscription_authorized_payment)

### ❌ NEXTAUTH_URL não definido
**Causa**: Variável de ambiente faltando  
**Solução**: Adicione no Railway: `NEXTAUTH_URL=https://salao-production.up.railway.app`

---

## ✅ Checklist Final

Antes de considerar completo:

- [ ] Webhook configurado no painel do Mercado Pago
- [ ] URL correta: `https://salao-production.up.railway.app/api/webhooks/mercadopago`
- [ ] 3 eventos marcados (payment, subscription_preapproval, subscription_authorized_payment)
- [ ] Validação GET bem-sucedida
- [ ] `NEXTAUTH_URL` configurado no Railway
- [ ] Pagamento de teste realizado
- [ ] Webhook recebido (verificado nos logs)
- [ ] Status da assinatura atualizado no banco
- [ ] Email de confirmação enviado

---

## 🎉 Pronto!

Seu sistema de cobrança recorrente está funcionando! Agora:

1. **Clientes podem assinar** → Trial de 14 dias grátis
2. **Mercado Pago cobra automaticamente** → Após trial e mensalmente
3. **Webhooks atualizam status** → Automaticamente
4. **Emails são enviados** → Confirmação, falha, cancelamento
5. **Clientes podem gerenciar** → Em `/dashboard/assinatura/gerenciar`

---

## 📚 Referências

- [Mercado Pago - Webhooks](https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks)
- [Mercado Pago - Assinaturas](https://www.mercadopago.com.br/developers/pt/docs/subscriptions/introduction)
- [Railway - Variáveis de Ambiente](https://docs.railway.app/develop/variables)

---

**Última atualização**: 3 de dezembro de 2025
