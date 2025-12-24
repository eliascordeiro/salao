# WhatsApp Business API Oficial - Guia Completo

## 📱 O que é?

A WhatsApp Business API Oficial é a solução profissional da Meta/Facebook para empresas enviarem mensagens via WhatsApp.

### ✅ Vantagens

- **1.000 conversas GRÁTIS/mês**
- Conversas iniciadas pelo cliente são **GRÁTIS nas primeiras 24h**
- Funciona em **produção** (não precisa de navegador/QR Code)
- API **oficial** e **confiável**
- Suporte a **templates** aprovados
- **Webhooks** para status de entrega

### 💰 Custos (Brasil - 2025)

- **Tier Gratuito**: 1.000 conversas/mês
- **Após limite**: R$ 0,30 - R$ 0,80 por conversa
- **Conversas iniciadas pelo cliente**: GRÁTIS (primeiras 24h)
- **Nosso caso de uso**: Notificações de agendamento = dentro do tier gratuito

---

## 🚀 Configuração Passo a Passo

### Passo 1: Criar conta Meta for Developers

1. Acesse: https://developers.facebook.com/apps
2. Clique em **"Create App"**
3. Escolha tipo: **"Business"**
4. Preencha:
   - **App Name**: Salão Booking (ou seu nome)
   - **App Contact Email**: seu@email.com
   - **Business Account**: Crie uma se não tiver
5. Clique em **"Create App"**

### Passo 2: Adicionar produto WhatsApp

1. No painel do app, procure **"WhatsApp"**
2. Clique em **"Set Up"**
3. Escolha ou crie um **Business Portfolio**
4. Aceite os termos

### Passo 3: Configurar número de teste

Inicialmente, você terá um **número de teste** fornecido pela Meta:

1. Vá em **WhatsApp → API Setup**
2. Veja seu **Phone Number ID** (exemplo: `123456789012345`)
3. Copie o **Temporary Access Token**
4. Adicione seu **telefone pessoal** para testes:
   - Clique em **"Add phone number"**
   - Insira seu número: `+5541996123839`
   - Confirme o código SMS recebido

### Passo 4: Gerar Access Token permanente

O token temporário expira em 24h. Para produção, você precisa de um **permanente**:

1. Vá em **WhatsApp → Configuration**
2. Clique em **"System Users"** (ou crie um)
3. Gere um **Permanent Token**:
   - **App**: Seu app
   - **Permissions**: `whatsapp_business_messaging`, `whatsapp_business_management`
   - **Token Expiration**: **Never**
4. **COPIE E SALVE** o token (não será mostrado novamente!)

### Passo 5: Configurar Webhook

1. Vá em **WhatsApp → Configuration → Webhook**
2. Clique em **"Edit"**
3. Preencha:
   - **Callback URL**: `https://salon-booking.com.br/api/webhooks/whatsapp`
   - **Verify Token**: `salon-booking-verify-token` (mesmo do `.env`)
4. Clique em **"Verify and Save"**
5. **Subscribe** aos campos:
   - `messages`: Mensagens recebidas
   - `message_status`: Status de entrega

### Passo 6: Configurar variáveis de ambiente

#### Desenvolvimento (`.env`)

```env
# WhatsApp Business API Oficial
WHATSAPP_PHONE_NUMBER_ID=123456789012345
WHATSAPP_ACCESS_TOKEN=EAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
WHATSAPP_WEBHOOK_VERIFY_TOKEN=salon-booking-verify-token
WHATSAPP_API_VERSION=v21.0
```

#### Produção (Railway)

No painel do Railway, adicione as mesmas variáveis:

1. **Settings → Variables**
2. **Add Variable**:
   - `WHATSAPP_PHONE_NUMBER_ID`
   - `WHATSAPP_ACCESS_TOKEN`
   - `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
   - `WHATSAPP_API_VERSION`

---

## 🧪 Testando

### Teste 1: Verificar configuração

```bash
node -e "
const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
const token = process.env.WHATSAPP_ACCESS_TOKEN;
console.log('Phone ID:', phoneId ? '✅ Configurado' : '❌ Faltando');
console.log('Token:', token ? '✅ Configurado' : '❌ Faltando');
"
```

### Teste 2: Enviar mensagem de teste

Crie um arquivo `test-whatsapp-official.js`:

```javascript
const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
const token = process.env.WHATSAPP_ACCESS_TOKEN;

async function testMessage() {
  const response = await fetch(
    `https://graph.facebook.com/v21.0/${phoneId}/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: '5541996123839', // SEU NÚMERO (com DDI)
        type: 'text',
        text: {
          body: '🎉 WhatsApp Business API funcionando!'
        }
      })
    }
  );

  const data = await response.json();
  console.log('Resultado:', data);
}

testMessage();
```

Execute:

```bash
node test-whatsapp-official.js
```

---

## 📋 Templates de Mensagem

### Por que usar templates?

A Meta **exige templates aprovados** para:
- Mensagens iniciadas pela empresa (fora da janela de 24h)
- Notificações automáticas

### Como criar templates

1. Vá em **WhatsApp → Message Templates**
2. Clique em **"Create Template"**
3. Preencha:
   - **Name**: `agendamento_confirmado`
   - **Category**: `UTILITY` (para notificações)
   - **Language**: `Portuguese (BR)`
   - **Body**: 
     ```
     Olá {{1}}! Seu agendamento foi confirmado:
     
     📅 Serviço: {{2}}
     👤 Profissional: {{3}}
     🕐 Data/Hora: {{4}}
     
     Nos vemos em breve! 💈
     ```
4. Clique em **"Submit"**
5. **Aguarde aprovação** (geralmente 15min - 24h)

### Usando templates no código

```typescript
import { sendWhatsAppTemplate } from '@/lib/whatsapp/whatsapp-official-client';

await sendWhatsAppTemplate(
  '5541996123839',
  'agendamento_confirmado',
  [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: 'João Silva' },
        { type: 'text', text: 'Corte de Cabelo' },
        { type: 'text', text: 'Pedro Santos' },
        { type: 'text', text: '25/12/2025 às 14:00' }
      ]
    }
  ]
);
```

---

## 🔄 Migração do WPPConnect

### Diferenças principais

| Aspecto | WPPConnect | WhatsApp Business API |
|---------|------------|----------------------|
| **QR Code** | ✅ Sim (precisa escanear) | ❌ Não precisa |
| **Navegador** | ✅ Chromium (local) | ❌ Não precisa |
| **Produção** | ❌ Difícil (Railway sem Chromium) | ✅ Funciona perfeitamente |
| **Custo** | ✅ Grátis | ✅ 1.000 conversas grátis |
| **Templates** | ❌ Não precisa | ✅ Precisa aprovar |
| **Oficial** | ❌ Não oficial | ✅ Oficial Meta |

### Arquivos alterados

1. **`lib/whatsapp/whatsapp-official-client.ts`** (novo)
2. **`lib/whatsapp/notifications.ts`** (atualizado)
3. **`app/api/webhooks/whatsapp/route.ts`** (atualizado)
4. **`.env`** (novas variáveis)

---

## 📊 Monitoramento

### Logs de desenvolvimento

```bash
npm run dev
```

Você verá logs como:

```
📱 [WhatsApp Official] Enviando mensagem para: 5541996123839
✅ [WhatsApp Official] Mensagem enviada: wamid.xxxxx
```

### Logs de produção (Railway)

No Railway, vá em **Deployments → Logs** e filtre por `[WhatsApp Official]`.

### Webhook

Quando mensagens forem entregues/lidas, você verá:

```
📩 [WhatsApp Webhook] Evento recebido: { ... }
✅ Mensagem entregue ao destinatário
👀 Mensagem lida pelo destinatário
```

---

## ⚠️ Limitações

### Número de teste

- **Apenas 5 números** podem receber mensagens
- Para **produção**, você precisa de um **número verificado próprio**

### Número de produção

Para usar seu próprio número:

1. Vá em **WhatsApp → Phone Numbers**
2. Clique em **"Add Phone Number"**
3. Escolha:
   - **Novo número** (comprar via Meta)
   - **Migrar número existente** (WhatsApp Business)
4. **Verificação** (24-72h)
5. Atualizar `WHATSAPP_PHONE_NUMBER_ID`

### Templates

- **Aprovação pode demorar 24h**
- Templates **rejeitados** precisam ser resubmetidos
- **Mensagens de texto livre** só dentro de 24h após mensagem do cliente

---

## 🆘 Troubleshooting

### Erro: "Invalid phone number"

- Certifique-se de usar **DDI + DDD + número**: `5541996123839`
- Número precisa estar **cadastrado** (teste) ou ser **verificado** (produção)

### Erro: "Insufficient permissions"

- Access Token precisa ter permissões:
  - `whatsapp_business_messaging`
  - `whatsapp_business_management`

### Webhook não recebe eventos

1. Verifique se `WHATSAPP_WEBHOOK_VERIFY_TOKEN` está correto
2. URL precisa ser **HTTPS** (Railway já fornece)
3. Webhook precisa retornar **200 OK** rápido (<5s)

### Mensagens não chegam

1. **Número de teste**: Adicione em **API Setup → To**
2. **Número de produção**: Verifique se está ativo
3. **Templates**: Aguarde aprovação

---

## 📚 Recursos

- **Documentação oficial**: https://developers.facebook.com/docs/whatsapp/cloud-api
- **Webhooks**: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks
- **Templates**: https://developers.facebook.com/docs/whatsapp/message-templates
- **Preços**: https://developers.facebook.com/docs/whatsapp/pricing

---

## ✅ Checklist de implantação

- [ ] Criar app no Meta for Developers
- [ ] Adicionar produto WhatsApp
- [ ] Gerar Access Token permanente
- [ ] Configurar webhook
- [ ] Adicionar variáveis no Railway
- [ ] Testar envio de mensagem
- [ ] Criar templates de notificação
- [ ] Aguardar aprovação dos templates
- [ ] (Opcional) Migrar número próprio para produção

---

**Pronto!** Agora você tem notificações por WhatsApp profissionais, escaláveis e dentro do tier gratuito! 🚀
