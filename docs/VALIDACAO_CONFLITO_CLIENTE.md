# ✅ FEATURE: Validação de Conflito de Horário do Cliente

## 📋 Funcionalidade Implementada

**Requisito:**
> "Alertar o cliente quando ele tentar marcar um horário em que ele já marcou em outro serviço"

**Solução:**
O sistema agora verifica se o cliente já possui um agendamento no mesmo horário (mesmo que seja com outro profissional ou outro serviço) e exibe um alerta detalhado impedindo a duplicação.

---

## 🎯 Como Funciona

### **Cenário de Conflito:**

```
Cliente: Pedro Silva

Agendamento Existente:
📅 Corte de Cabelo
👤 Carlos Barbeiro
⏰ 10:00 - 10:30 (30min)
✅ Status: CONFIRMADO

Tentativa de Novo Agendamento:
📅 Barba
👤 João Estilista (DIFERENTE)
⏰ 10:00 - 10:20 (20min)

Resultado:
❌ BLOQUEADO!
⚠️  "Você já possui um agendamento neste horário"
```

### **Lógica de Detecção:**

1. Cliente seleciona serviço, profissional, data e hora
2. Ao confirmar agendamento, sistema busca TODOS os agendamentos do cliente naquele dia
3. Para cada agendamento existente, verifica se há sobreposição de horários:
   - **Início dentro** do período ocupado
   - **Fim dentro** do período ocupado  
   - **Envolve** completamente o período ocupado
4. Se houver conflito:
   - ❌ Bloqueia criação
   - ⚠️ Exibe alerta detalhado
5. Se NÃO houver conflito:
   - ✅ Permite criação

---

## 💻 Código Implementado

### **1. Backend - Validação na API**
**Arquivo:** `/app/api/bookings/route.ts` (linhas ~177-248)

```typescript
// VALIDAÇÃO 2: Verificar se o CLIENTE já tem agendamento no mesmo horário
const startOfDay = new Date(date + "T00:00:00");
const endOfDay = new Date(date + "T23:59:59");

const clientBookings = await prisma.booking.findMany({
  where: {
    clientId: session.user.id,
    date: {
      gte: startOfDay,
      lte: endOfDay,
    },
    status: {
      in: ["PENDING", "CONFIRMED"],
    },
  },
  include: {
    service: {
      select: {
        name: true,
        duration: true,
      },
    },
    staff: {
      select: {
        name: true,
      },
    },
  },
});

// Verificar conflito de horário
const requestedStartMin = bookingDate.getUTCHours() * 60 + bookingDate.getUTCMinutes();
const requestedEndMin = requestedStartMin + service.duration;

for (const clientBooking of clientBookings) {
  const existingStartMin = clientBooking.date.getUTCHours() * 60 + clientBooking.date.getUTCMinutes();
  const existingEndMin = existingStartMin + clientBooking.service.duration;

  // Verificar se há sobreposição
  const hasConflict =
    (requestedStartMin >= existingStartMin && requestedStartMin < existingEndMin) || // Início dentro
    (requestedEndMin > existingStartMin && requestedEndMin <= existingEndMin) || // Fim dentro
    (requestedStartMin <= existingStartMin && requestedEndMin >= existingEndMin); // Envolve

  if (hasConflict) {
    return NextResponse.json(
      {
        error: "Conflito de horário",
        message: `Você já possui um agendamento neste horário:\n${clientBooking.service.name} com ${clientBooking.staff.name}\nHorário: ${formatTime(existingStartMin)} - ${formatTime(existingEndMin)}`,
        conflictingBooking: {
          id: clientBooking.id,
          serviceName: clientBooking.service.name,
          staffName: clientBooking.staff.name,
          time: formatTime(existingStartMin),
          duration: clientBooking.service.duration,
        },
      },
      { status: 409 }
    );
  }
}
```

### **2. Frontend - Exibição do Alerta**

#### **Agendamento Dinâmico:**
**Arquivo:** `/app/agendar-dinamico/page.tsx` (linhas ~232-242)

```typescript
if (!response.ok) {
  const data = await response.json();
  
  // Verificar se é um conflito de horário do cliente
  if (response.status === 409 && data.conflictingBooking) {
    setError(
      `⚠️ Você já possui um agendamento neste horário!\n\n` +
      `📅 Serviço: ${data.conflictingBooking.serviceName}\n` +
      `👤 Profissional: ${data.conflictingBooking.staffName}\n` +
      `⏰ Horário: ${data.conflictingBooking.time} (${data.conflictingBooking.duration} min)\n\n` +
      `❌ Não é possível marcar dois serviços no mesmo horário.`
    );
  } else {
    throw new Error(data.error || data.message || "Erro ao criar agendamento");
  }
  return;
}
```

#### **Agendamento por Slots:**
**Arquivo:** `/app/agendar-slots/page.tsx` (linhas ~241-254)

```typescript
if (response.status === 409 && error.conflictingBooking) {
  alert(
    `⚠️ CONFLITO DE HORÁRIO\n\n` +
    `Você já possui um agendamento neste horário:\n\n` +
    `📅 Serviço: ${error.conflictingBooking.serviceName}\n` +
    `👤 Profissional: ${error.conflictingBooking.staffName}\n` +
    `⏰ Horário: ${error.conflictingBooking.time} (${error.conflictingBooking.duration} min)\n\n` +
    `❌ Não é possível marcar dois serviços no mesmo horário.\n\n` +
    `💡 Escolha outro horário ou cancele o agendamento existente.`
  );
}
```

---

## 🧪 Testes de Validação

### **Teste Automatizado:**
```bash
npx tsx scripts/test-client-conflict.ts
```

**Resultado:**
```
✅ TESTE 1: Criar primeiro agendamento - PASSOU
✅ TESTE 2: Bloquear horário duplicado - PASSOU
✅ TESTE 3: Permitir horário diferente - PASSOU
```

### **Teste Manual no Navegador:**

#### **Passo 1: Configurar Dados de Teste**
```bash
npx tsx scripts/test-client-conflict.ts
```

Isso criará:
- **Agendamento 1:** Corte de Cabelo às 10:00 (Carlos Barbeiro)
- **Agendamento 2:** Barba às 14:00 (João Estilista)

#### **Passo 2: Iniciar Servidor**
```bash
npm run dev
```

#### **Passo 3: Fazer Login**
1. Acesse: `http://localhost:3000/login`
2. Email: `cliente@exemplo.com`
3. Senha: `cliente123`

#### **Passo 4: Tentar Criar Agendamento Conflitante**
1. Acesse: `http://localhost:3000/agendar`
2. Escolha: **"Agendamento Dinâmico"**
3. Selecione: **Qualquer serviço** (ex: Barba)
4. Selecione: **Qualquer profissional** (ex: João Estilista)
5. Selecione: **Data: 08/11/2025**
6. Selecione: **Horário: 10:00**
7. Clique: **"Confirmar Agendamento"**

**Resultado Esperado:**
```
⚠️ Você já possui um agendamento neste horário!

📅 Serviço: Corte de Cabelo
👤 Profissional: Carlos Barbeiro
⏰ Horário: 10:00 (30 min)

❌ Não é possível marcar dois serviços no mesmo horário.
```

#### **Passo 5: Criar Agendamento em Horário Diferente**
1. Selecione: **Horário: 11:00** (diferente)
2. Clique: **"Confirmar Agendamento"**

**Resultado Esperado:**
```
✅ Agendamento realizado com sucesso!
```

---

## 📊 Exemplos de Conflito

### **Exemplo 1: Mesmo Horário Exato**
```
Existente: 10:00 - 10:30 (Corte)
Tentativa: 10:00 - 10:20 (Barba)
Resultado: ❌ BLOQUEADO (início dentro)
```

### **Exemplo 2: Sobreposição Parcial (Início)**
```
Existente: 10:00 - 10:30 (Corte)
Tentativa: 10:15 - 10:45 (Barba)
Resultado: ❌ BLOQUEADO (início dentro)
```

### **Exemplo 3: Sobreposição Parcial (Fim)**
```
Existente: 10:00 - 10:30 (Corte)
Tentativa: 09:45 - 10:15 (Barba)
Resultado: ❌ BLOQUEADO (fim dentro)
```

### **Exemplo 4: Engloba Completamente**
```
Existente: 10:15 - 10:30 (Barba - 15min)
Tentativa: 10:00 - 11:00 (Corte - 60min)
Resultado: ❌ BLOQUEADO (envolve)
```

### **Exemplo 5: Horário Diferente (Permitido)**
```
Existente: 10:00 - 10:30 (Corte)
Tentativa: 14:00 - 14:20 (Barba)
Resultado: ✅ PERMITIDO (sem sobreposição)
```

---

## 🎨 Interface do Usuário

### **Alerta de Conflito (Dinâmico):**
- Exibido em **card vermelho** com ícone de alerta
- Mostra detalhes do agendamento conflitante:
  - Nome do serviço
  - Nome do profissional
  - Horário e duração
- Mensagem clara: "Não é possível marcar dois serviços no mesmo horário"

### **Alerta de Conflito (Slots):**
- Exibido em **popup (alert)**
- Formatação clara com emojis
- Sugestão: "Escolha outro horário ou cancele o agendamento existente"

---

## 🔒 Validações Implementadas

### **Validação 1: Horário do Profissional**
- Verifica se o profissional já tem agendamento no horário
- Impede double-booking do profissional

### **Validação 2: Horário do Cliente (NOVA)**
- Verifica se o cliente já tem agendamento no horário
- Funciona mesmo com profissionais diferentes
- Funciona mesmo com serviços diferentes
- Detecta sobreposições parciais

---

## 📁 Arquivos Modificados

### **Backend:**
1. ✅ `/app/api/bookings/route.ts` - Validação de conflito

### **Frontend:**
2. ✅ `/app/agendar-dinamico/page.tsx` - Exibição de alerta
3. ✅ `/app/agendar-slots/page.tsx` - Exibição de alerta

### **Testes:**
4. ✅ `/scripts/test-client-conflict.ts` - Teste automatizado

### **Documentação:**
5. ✅ `/docs/VALIDACAO_CONFLITO_CLIENTE.md` - Este arquivo

---

## ✅ Benefícios

### **Para o Cliente:**
- ✅ Não agenda dois serviços no mesmo horário
- ✅ Vê claramente qual agendamento está conflitando
- ✅ Recebe sugestão de escolher outro horário
- ✅ Evita frustração ao chegar no salão

### **Para o Salão:**
- ✅ Evita confusão na agenda
- ✅ Cliente não precisa ir ao salão duas vezes seguidas
- ✅ Reduz cancelamentos de última hora
- ✅ Melhora experiência do cliente

### **Para o Sistema:**
- ✅ Dados consistentes no banco
- ✅ Agenda organizada
- ✅ Menos conflitos operacionais

---

## 🚀 Status

**✅ FEATURE COMPLETA E TESTADA!**

- [x] Validação implementada no backend
- [x] Alerta implementado no frontend (dinâmico)
- [x] Alerta implementado no frontend (slots)
- [x] Teste automatizado criado
- [x] Documentação completa
- [x] Testes passando 100%

---

## 💡 Possíveis Melhorias Futuras

### **1. Sugestão de Horários Alternativos**
```
⚠️ Conflito detectado!

💡 Horários disponíveis próximos:
   • 10:30 - Disponível
   • 11:00 - Disponível
   • 14:00 - Disponível
```

### **2. Reagendar Automaticamente**
```
⚠️ Conflito detectado!

🔄 Deseja reagendar o agendamento anterior?
   [Sim] [Não] [Escolher Outro Horário]
```

### **3. Visualizar Todos os Agendamentos**
```
⚠️ Conflito detectado!

📅 Seus agendamentos para 08/11/2025:
   • 10:00 - Corte (Carlos)
   • 14:00 - Barba (João)
   
[Ver Meus Agendamentos]
```

---

## 🎉 Conclusão

A feature de **validação de conflito de horário do cliente** foi implementada com sucesso!

O sistema agora:
- ✅ Detecta quando cliente tenta agendar dois serviços no mesmo horário
- ✅ Exibe alerta claro e detalhado
- ✅ Impede criação do agendamento duplicado
- ✅ Sugere escolher outro horário

**Cliente protegido contra agendamentos conflitantes! 🛡️**
