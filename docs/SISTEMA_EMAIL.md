# Sistema de Email - Guia Completo

## 📧 Visão Geral

Sistema centralizado de envio de emails via SMTP usando Nodemailer. Suporta múltiplos provedores (Gmail, SendGrid, Mailtrap) e inclui:

- ✅ API REST para envio de emails
- ✅ Interface de configuração e teste
- ✅ Templates HTML responsivos
- ✅ Suporte a múltiplos destinatários
- ✅ Validação de configuração

## 🚀 Configuração

### 1. Variáveis de Ambiente

Adicione no arquivo `.env.local`:

```bash
# Configuração SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-de-app
SMTP_FROM=AgendaSalão <seu-email@gmail.com>
```

### 2. Provedores Recomendados

#### **Gmail** (Desenvolvimento)
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-de-app-16-digitos
SMTP_FROM=AgendaSalão <seu-email@gmail.com>
```

**Como obter senha de app:**
1. Acesse: https://myaccount.google.com/security
2. Ative verificação em 2 etapas
3. Gere senha de app em: https://myaccount.google.com/apppasswords

#### **Mailtrap** (Testes)
```bash
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_SECURE=false
SMTP_USER=seu-username-mailtrap
SMTP_PASS=sua-senha-mailtrap
SMTP_FROM=teste@agendasalao.com
```

Cadastre gratuitamente em: https://mailtrap.io

#### **SendGrid** (Produção)
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=SG.xxxxxxxxxxxxx
SMTP_FROM=AgendaSalão <noreply@seudominio.com>
```

Cadastre em: https://sendgrid.com (100 emails/dia grátis)

## 📡 API de Email

### **POST /api/email/send**

Envia um email via SMTP.

**Request Body:**
```json
{
  "to": "cliente@email.com",
  "subject": "Assunto do Email",
  "html": "<h1>HTML do email</h1>",
  "text": "Versão texto (opcional)",
  "from": "remetente@email.com (opcional)"
}
```

**Response (Sucesso - 200):**
```json
{
  "success": true,
  "messageId": "<abc123@gmail.com>",
  "accepted": ["cliente@email.com"],
  "rejected": []
}
```

**Response (Erro - 503):**
```json
{
  "error": "Email service not configured",
  "message": "Configure SMTP variables in environment"
}
```

### **GET /api/email/send**

Verifica status da configuração de email.

**Response:**
```json
{
  "configured": true,
  "host": "smtp.gmail.com",
  "port": "587",
  "user": "seu-email@gmail.com",
  "secure": false,
  "from": "AgendaSalão <seu-email@gmail.com>",
  "message": "Email service is configured and ready"
}
```

## 🎨 Uso no Sistema

### 1. Convites de Usuário

Quando um novo usuário é criado pelo proprietário:

```typescript
await fetch("/api/email/send", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    to: user.email,
    subject: `Convite para acessar ${salonName}`,
    html: templateConvite(user.name, tempPassword, salonName),
  }),
})
```

### 2. Notificações de Agendamento

```typescript
import { sendBookingEmail } from "@/lib/email"

// Novo agendamento
await sendBookingEmail({
  type: "BOOKING_CREATED",
  clientEmail: "cliente@email.com",
  clientName: "João Silva",
  serviceName: "Corte de Cabelo",
  staffName: "Carlos",
  salonName: "Salão BeautyStyle",
  date: new Date(),
  duration: 60,
  price: 50,
})
```

### 3. Email Customizado

```typescript
const htmlContent = `
  <!DOCTYPE html>
  <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Olá ${userName}!</h1>
        <p>Sua mensagem personalizada aqui.</p>
      </div>
    </body>
  </html>
`

await fetch("/api/email/send", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    to: "destinatario@email.com",
    subject: "Assunto",
    html: htmlContent,
  }),
})
```

## 🖥️ Interface de Teste

Acesse `/dashboard/configuracoes/email` para:

- ✅ Ver status da configuração SMTP
- ✅ Visualizar dados do servidor configurado
- ✅ Enviar email de teste
- ✅ Ver instruções de configuração

## 🔒 Segurança

### Variáveis de Ambiente

- ✅ Nunca commite o arquivo `.env.local`
- ✅ Use `.env.example` como template
- ✅ Gere senhas de app para Gmail
- ✅ Use API keys para SendGrid

### Validação

```typescript
// A API valida automaticamente:
- Configuração SMTP presente
- Campos obrigatórios (to, subject, html)
- Formato de email válido
```

## 📊 Monitoramento

### Logs de Email

Todos os envios são logados no console:

```
✅ Email enviado: {
  messageId: '<abc123@gmail.com>',
  to: ['cliente@email.com'],
  subject: 'Convite para acessar Salão'
}
```

### Erros Comuns

**"Email service not configured"**
- Solução: Configure variáveis SMTP no `.env.local`

**"Authentication failed"**
- Solução: Verifique SMTP_USER e SMTP_PASS
- Gmail: Use senha de app, não senha normal

**"Connection timeout"**
- Solução: Verifique SMTP_HOST e SMTP_PORT
- Gmail: Use porta 587, não 465

**"Invalid recipients"**
- Solução: Valide formato do email

## 🚀 Deploy (Railway)

### Variáveis no Railway

Configure no Dashboard do Railway:

```
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=SG.sua-api-key-sendgrid
SMTP_FROM=AgendaSalão <noreply@seudominio.com>
```

### Recomendações para Produção

1. **Use SendGrid ou AWS SES** (não Gmail)
2. **Configure SPF e DKIM** no seu domínio
3. **Use um domínio próprio** para o remetente
4. **Monitore taxa de entrega** e bounces
5. **Implemente rate limiting** para evitar spam

## 📝 Checklist de Implementação

- [x] API `/api/email/send` criada
- [x] Página de configuração `/dashboard/configuracoes/email`
- [x] Variáveis SMTP no `.env.example`
- [x] Integração com sistema de usuários
- [x] Templates HTML responsivos
- [x] Validação de configuração
- [x] Sistema de testes
- [ ] Logs de email no banco de dados (futuro)
- [ ] Fila de emails com retry (futuro)
- [ ] Analytics de abertura (futuro)

## 🎯 Recursos Ativos

O sistema de email agora está integrado em:

- ✅ **Convites de usuário**: Email automático com senha temporária
- ✅ **Reenvio de convite**: Gera nova senha e reenvia email
- ✅ **Notificações de agendamento**: Confirmações e lembretes
- ✅ **Recuperação de senha**: Reset por email (quando implementado)

## 📚 Referências

- Nodemailer: https://nodemailer.com/
- SendGrid: https://docs.sendgrid.com/
- Gmail SMTP: https://support.google.com/mail/answer/7126229
- Mailtrap: https://mailtrap.io/docs/

---

**Desenvolvido para:** Sistema de Agendamento para Salões & Barbearias  
**Stack:** Next.js 14 + Nodemailer + TypeScript
