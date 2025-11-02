# Sistema de Notificações por Email - Guia Completo

## 📧 Visão Geral

Sistema completo de notificações automáticas por email usando Nodemailer, com templates HTML responsivos, registro de histórico no banco de dados e API para lembretes automáticos.

---

## 🎯 Funcionalidades Implementadas

### 1. **Tipos de Notificações**

#### ✅ **Novo Agendamento Criado** (BOOKING_CREATED)
- **Quando:** Imediatamente após o cliente criar um agendamento
- **Para:** Cliente
- **Conteúdo:**
  - Confirmação de que o agendamento foi criado
  - Detalhes completos (serviço, profissional, data, hora, valor)
  - Status: PENDENTE (aguardando confirmação do admin)
  - Link para "Meus Agendamentos"

#### ✅ **Agendamento Confirmado** (BOOKING_CONFIRMED)
- **Quando:** Admin altera status para CONFIRMED
- **Para:** Cliente
- **Conteúdo:**
  - Notificação de confirmação
  - Detalhes do agendamento
  - Lembrete sobre chegar com antecedência
  - Aviso de que receberá lembrete 24h antes

#### ⏰ **Lembrete 24h Antes** (BOOKING_REMINDER)
- **Quando:** 24 horas antes do agendamento confirmado
- **Para:** Cliente
- **Conteúdo:**
  - Lembrete de que o agendamento é amanhã
  - Dia da semana + horário
  - Detalhes completos do agendamento
  - Recomendação de chegar 5-10 min antes

#### ❌ **Agendamento Cancelado** (BOOKING_CANCELLED)
- **Quando:** Status alterado para CANCELLED (por cliente ou admin)
- **Para:** Cliente
- **Conteúdo:**
  - Confirmação de cancelamento
  - Detalhes do agendamento cancelado
  - Link para fazer novo agendamento
  - Mensagem diferente se cancelado pelo cliente vs admin

---

## ⚙️ Configuração

### 1. **Variáveis de Ambiente**

Adicione ao arquivo `.env`:

```env
# Email Configuration (SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="seu-email@gmail.com"
SMTP_PASS="sua-senha-de-app"
EMAIL_FROM="AgendaSalão <noreply@agendasalao.com>"
```

### 2. **Opções de Provedores SMTP**

#### **Gmail (Recomendado para testes)**
```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="seu-email@gmail.com"
SMTP_PASS="sua-senha-de-app"  # Requer "Senha de App" no Google
```

**Como obter Senha de App do Gmail:**
1. Acesse https://myaccount.google.com/security
2. Ative a verificação em 2 etapas
3. Vá em "Senhas de app"
4. Gere uma senha para "Email"
5. Use essa senha no `.env`

#### **Mailtrap (Recomendado para desenvolvimento)**
```env
SMTP_HOST="smtp.mailtrap.io"
SMTP_PORT="2525"
SMTP_USER="seu-username-mailtrap"
SMTP_PASS="sua-senha-mailtrap"
```

- Cadastre-se gratuitamente em https://mailtrap.io
- Use a inbox de desenvolvimento (não envia emails reais)

#### **SendGrid (Recomendado para produção)**
```env
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT="587"
SMTP_USER="apikey"
SMTP_PASS="sua-api-key-sendgrid"
```

#### **AWS SES (Amazon)**
```env
SMTP_HOST="email-smtp.us-east-1.amazonaws.com"
SMTP_PORT="587"
SMTP_USER="suas-credenciais-iam"
SMTP_PASS="sua-senha-smtp-aws"
```

---

## 📂 Arquivos Criados/Modificados

### Novos Arquivos (3)

1. **`lib/email.ts`** (600+ linhas)
   - Configuração do Nodemailer
   - 4 funções de envio de email
   - Templates HTML responsivos
   - Função de registro no banco
   - Função auxiliar de formatação

2. **`app/api/notifications/reminders/route.ts`** (230+ linhas)
   - GET: Envia lembretes para agendamentos de amanhã
   - POST: Envia lembrete manual para um agendamento específico
   - Proteção: Apenas ADMIN

3. **`docs/SISTEMA_NOTIFICACOES.md`** (este arquivo)
   - Documentação completa do sistema

### Arquivos Modificados (5)

1. **`prisma/schema.prisma`**
   - Adicionado model `Notification`
   - Relação com `Booking`

2. **`.env` e `.env.example`**
   - Adicionadas variáveis SMTP

3. **`app/api/bookings/route.ts`**
   - POST: Envia email ao criar agendamento

4. **`app/api/bookings/[id]/route.ts`**
   - PUT: Envia email ao confirmar/cancelar

5. **`package.json`**
   - Instalado `nodemailer` e `@types/nodemailer`

---

## 🗄️ Model Notification (Banco de Dados)

```prisma
model Notification {
  id          String    @id @default(cuid())
  type        String    // BOOKING_CREATED, BOOKING_CONFIRMED, BOOKING_REMINDER, BOOKING_CANCELLED
  status      String    @default("PENDING") // PENDING, SENT, FAILED
  email       String    // Email do destinatário
  subject     String?   // Assunto do email
  error       String?   // Mensagem de erro se falhou
  sentAt      DateTime? // Quando foi enviado
  createdAt   DateTime  @default(now())
  
  bookingId   String
  booking     Booking   @relation(fields: [bookingId], references: [id], onDelete: Cascade)
  
  @@index([bookingId])
  @@index([type])
  @@index([status])
}
```

**Funcionalidade:**
- Registra todas as tentativas de envio de email
- Permite auditoria e debugging
- Status SENT/FAILED para rastreamento
- Campo `error` armazena mensagens de erro

---

## 🔄 Fluxo de Notificações

### **Cenário 1: Cliente Cria Agendamento**

```
1. Cliente preenche formulário de agendamento
2. POST /api/bookings cria o agendamento
3. Status inicial: PENDING
4. Sistema envia email "Agendamento Realizado"
5. Notification criada no banco com type=BOOKING_CREATED
```

### **Cenário 2: Admin Confirma Agendamento**

```
1. Admin acessa /dashboard/agendamentos
2. Clica em "Confirmar" no agendamento
3. PUT /api/bookings/[id] com status=CONFIRMED
4. Sistema detecta mudança de status
5. Envia email "Agendamento Confirmado"
6. Notification criada no banco com type=BOOKING_CONFIRMED
```

### **Cenário 3: Sistema Envia Lembretes Automáticos**

```
1. Cron job ou admin chama GET /api/notifications/reminders
2. Sistema busca agendamentos CONFIRMED para amanhã
3. Para cada agendamento:
   - Envia email de lembrete
   - Registra Notification com type=BOOKING_REMINDER
4. Retorna relatório de sucessos/falhas
```

### **Cenário 4: Cliente Cancela Agendamento**

```
1. Cliente acessa /meus-agendamentos
2. Clica em "Cancelar Agendamento"
3. PUT /api/bookings/[id] com status=CANCELLED
4. Sistema detecta mudança de status
5. Envia email "Agendamento Cancelado"
6. Notification criada no banco com type=BOOKING_CANCELLED
```

---

## 🚀 APIs Disponíveis

### **GET /api/notifications/reminders**

Envia lembretes para todos os agendamentos confirmados de amanhã.

**Autenticação:** Requerida (ADMIN only)

**Resposta:**
```json
{
  "message": "Lembretes processados",
  "date": "2025-11-03T00:00:00.000Z",
  "total": 5,
  "successful": 4,
  "failed": 1,
  "results": [
    {
      "bookingId": "cm5...",
      "clientEmail": "cliente@exemplo.com",
      "status": "success"
    },
    {
      "bookingId": "cm5...",
      "clientEmail": "erro@exemplo.com",
      "status": "failed",
      "error": "Invalid email"
    }
  ]
}
```

**Uso em Cron Job:**
```bash
# Executar diariamente às 10:00
0 10 * * * curl -X GET http://localhost:3000/api/notifications/reminders \
  -H "Cookie: next-auth.session-token=TOKEN"
```

---

### **POST /api/notifications/reminders**

Envia lembrete manual para um agendamento específico.

**Autenticação:** Requerida (ADMIN only)

**Body:**
```json
{
  "bookingId": "cm5hpmrcr0001xwrlj0rk8u7z"
}
```

**Resposta:**
```json
{
  "message": "Lembrete enviado com sucesso",
  "bookingId": "cm5...",
  "clientEmail": "cliente@exemplo.com"
}
```

---

## 🎨 Templates de Email

Todos os emails usam templates HTML responsivos com:

- ✅ Design moderno e profissional
- ✅ Logo e cores da marca (azul #2563eb)
- ✅ Layout responsivo (mobile-friendly)
- ✅ Botões de call-to-action
- ✅ Informações bem organizadas
- ✅ Footer com copyright

**Componentes visuais:**
- Cabeçalho com logo
- Caixas de informação (background cinza claro)
- Preço destacado em verde
- Alertas com bordas coloridas
- Botões azuis com hover
- Footer discreto

---

## 🧪 Como Testar

### **1. Teste de Criação de Agendamento**

```bash
# 1. Configure SMTP no .env (use Mailtrap para testes)
# 2. Acesse http://localhost:3000/servicos
# 3. Faça login como cliente (pedro@exemplo.com / cliente123)
# 4. Crie um novo agendamento
# 5. Verifique sua inbox do Mailtrap
```

### **2. Teste de Confirmação**

```bash
# 1. Faça login como admin (admin@agendasalao.com.br / admin123)
# 2. Acesse http://localhost:3000/dashboard/agendamentos
# 3. Clique em "Confirmar" em um agendamento PENDING
# 4. Verifique o email de confirmação no Mailtrap
```

### **3. Teste de Lembretes**

```bash
# 1. Certifique-se de ter um agendamento CONFIRMED para amanhã
# 2. Faça requisição GET (como admin):
curl -X GET http://localhost:3000/api/notifications/reminders \
  -H "Cookie: next-auth.session-token=SEU_TOKEN"

# 3. Ou teste manual:
curl -X POST http://localhost:3000/api/notifications/reminders \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=SEU_TOKEN" \
  -d '{"bookingId":"ID_DO_AGENDAMENTO"}'
```

### **4. Verificar Histórico no Banco**

```bash
# Acessar Prisma Studio
npx prisma studio

# Abra a tabela Notification
# Veja todos os emails enviados/falhados
```

---

## 🔧 Troubleshooting

### **Emails não estão sendo enviados**

1. Verifique as variáveis de ambiente no `.env`
2. Teste a conexão SMTP:
   ```javascript
   import { verifyEmailConnection } from "@/lib/email";
   await verifyEmailConnection();
   ```
3. Verifique os logs do console
4. Confira a tabela `Notification` para ver erros

### **Gmail retorna erro de autenticação**

- Certifique-se de usar "Senha de App", não a senha normal
- Ative verificação em 2 etapas
- Desabilite "Acesso a apps menos seguros" (não é necessário com senha de app)

### **Emails vão para spam**

- Configure SPF/DKIM no seu domínio (para produção)
- Use um serviço profissional como SendGrid
- Evite palavras como "grátis", "promoção" excessivamente
- Inclua link de "descadastrar" (obrigatório em produção)

### **Lembretes não funcionam**

- Certifique-se de ter agendamentos CONFIRMED para amanhã
- Verifique se a data do agendamento está correta (timezone)
- Execute manualmente via POST para debug

---

## 📅 Automatizando Lembretes (Cron Job)

### **Opção 1: Vercel Cron Jobs** (Recomendado para Next.js)

Crie `app/api/cron/reminders/route.ts`:

```typescript
import { NextResponse } from "next/server";

export async function GET() {
  // Verificar token de segurança
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Chamar API de lembretes
  const response = await fetch(
    `${process.env.NEXTAUTH_URL}/api/notifications/reminders`,
    {
      headers: {
        Cookie: `next-auth.session-token=${process.env.ADMIN_SESSION_TOKEN}`,
      },
    }
  );

  return NextResponse.json(await response.json());
}
```

Configure no `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/reminders",
      "schedule": "0 10 * * *"
    }
  ]
}
```

### **Opção 2: Node-Cron (Self-hosted)**

```typescript
// server.ts ou similar
import cron from "node-cron";

// Executar diariamente às 10:00
cron.schedule("0 10 * * *", async () => {
  console.log("Executando lembretes automáticos...");
  
  // Chamar API de lembretes
  await fetch("http://localhost:3000/api/notifications/reminders", {
    headers: {
      Cookie: `next-auth.session-token=${adminToken}`,
    },
  });
});
```

### **Opção 3: GitHub Actions** (Para ambientes simples)

`.github/workflows/reminders.yml`:

```yaml
name: Send Booking Reminders

on:
  schedule:
    - cron: "0 10 * * *"  # 10:00 UTC diariamente

jobs:
  send-reminders:
    runs-on: ubuntu-latest
    steps:
      - name: Send reminders
        run: |
          curl -X GET https://seu-dominio.com/api/notifications/reminders \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

---

## 📊 Métricas e Monitoramento

### **Queries Úteis**

```sql
-- Total de notificações por tipo
SELECT type, COUNT(*) as total
FROM Notification
GROUP BY type;

-- Taxa de sucesso/falha
SELECT 
  status,
  COUNT(*) as total,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM Notification), 2) as percentage
FROM Notification
GROUP BY status;

-- Notificações das últimas 24h
SELECT *
FROM Notification
WHERE createdAt >= datetime('now', '-1 day')
ORDER BY createdAt DESC;

-- Emails que falharam (para reenvio)
SELECT *
FROM Notification
WHERE status = 'FAILED'
ORDER BY createdAt DESC;
```

---

## 🎯 Próximas Melhorias Sugeridas

1. **Notificações SMS** - Integrar com Twilio/AWS SNS
2. **Notificações Push** - Para app mobile
3. **Preferências de Notificação** - Cliente escolhe quais quer receber
4. **Templates Customizáveis** - Admin edita templates via dashboard
5. **Múltiplos Lembretes** - 24h, 2h antes, etc.
6. **Notificações para Staff** - Avisar profissional sobre novos agendamentos
7. **Retry Automático** - Reenviar emails falhados automaticamente
8. **Rate Limiting** - Evitar envio excessivo
9. **A/B Testing** - Testar diferentes templates
10. **Analytics** - Dashboard com métricas de abertura/clique

---

## 📝 Checklist de Configuração

- [ ] Instalar nodemailer (`npm install nodemailer @types/nodemailer`)
- [ ] Adicionar variáveis SMTP no `.env`
- [ ] Atualizar schema do Prisma (`npx prisma db push`)
- [ ] Configurar provedor SMTP (Gmail/Mailtrap/SendGrid)
- [ ] Testar envio de email de criação
- [ ] Testar envio de email de confirmação
- [ ] Testar envio de email de cancelamento
- [ ] Testar API de lembretes manuais
- [ ] Configurar cron job para lembretes automáticos
- [ ] Verificar histórico na tabela Notification
- [ ] Configurar SPF/DKIM para produção
- [ ] Adicionar link de "descadastrar" (obrigatório em produção)

---

## 🔐 Segurança

1. **Variáveis de Ambiente:** Nunca commite o `.env` com credenciais reais
2. **Rate Limiting:** Implemente limite de emails por hora
3. **Validação de Email:** Valide formato antes de enviar
4. **Proteção de API:** Apenas ADMIN pode executar lembretes
5. **HTTPS:** Use sempre em produção
6. **DKIM/SPF:** Configure para evitar spoofing

---

**Desenvolvido com:** Nodemailer + Next.js 14 + Prisma + TypeScript  
**Data:** Novembro 2025
