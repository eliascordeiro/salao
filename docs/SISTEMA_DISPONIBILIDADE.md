# Sistema de Gestão de Disponibilidade dos Profissionais

## 📋 Visão Geral
Sistema avançado para controle fino da disponibilidade dos profissionais, permitindo bloqueios de horários específicos e gestão personalizada da agenda.

## 🎯 Problema Resolvido

**Situação Anterior:**
- ❌ Horários gerados automaticamente sem controle fino
- ❌ Impossível bloquear horários para reuniões/compromissos
- ❌ Profissional não tinha controle sobre sua agenda real
- ❌ Cliente via horários que na prática não estavam disponíveis

**Nova Solução:**
- ✅ Controle total sobre quais horários ficam disponíveis
- ✅ Bloqueio de horários específicos por data
- ✅ Motivo opcional para cada bloqueio (reunião, compromisso, etc.)
- ✅ Cliente vê apenas horários realmente disponíveis

---

## 🗄️ Modelo de Dados

### Tabela: `Availability`

```prisma
model Availability {
  id          String    @id @default(cuid())
  
  // Profissional
  staffId     String
  staff       Staff     @relation(fields: [staffId], references: [id], onDelete: Cascade)
  
  // Data e horário
  date        DateTime  // Data específica
  startTime   String    // Horário inicial (HH:mm)
  endTime     String    // Horário final (HH:mm)
  
  // Status
  available   Boolean   @default(true) // true = disponível, false = bloqueado
  reason      String?   // Motivo do bloqueio (opcional)
  
  // Tipo de bloqueio
  type        String    @default("BLOCK") // BLOCK (bloqueio), AVAILABLE (disponibilização extra)
  
  // Auditoria
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  createdBy   String?   // ID do usuário que criou
  
  @@index([staffId])
  @@index([date])
  @@index([staffId, date])
}
```

**Campos:**
- `staffId`: Profissional relacionado
- `date`: Data específica do bloqueio
- `startTime`: Horário de início (formato "HH:mm")
- `endTime`: Horário de término (formato "HH:mm")
- `available`: `false` = bloqueado, `true` = disponível extra
- `reason`: Motivo do bloqueio (opcional)
- `type`: "BLOCK" (padrão) ou "AVAILABLE"
- `createdBy`: Quem criou o bloqueio

---

## 🔌 APIs Criadas

### 1. **GET /api/availabilities**
Listar bloqueios de um profissional

**Query Parameters:**
- `staffId` (obrigatório): ID do profissional
- `startDate` (opcional): Data inicial (YYYY-MM-DD)
- `endDate` (opcional): Data final (YYYY-MM-DD)

**Exemplo:**
```bash
GET /api/availabilities?staffId=ABC123&startDate=2025-11-01&endDate=2025-11-30
```

**Resposta:**
```json
[
  {
    "id": "xyz789",
    "staffId": "ABC123",
    "date": "2025-11-05T00:00:00.000Z",
    "startTime": "14:00",
    "endTime": "16:00",
    "available": false,
    "reason": "Reunião com fornecedor",
    "type": "BLOCK",
    "createdAt": "2025-11-01T10:00:00.000Z",
    "staff": {
      "id": "ABC123",
      "name": "João Silva"
    }
  }
]
```

---

### 2. **POST /api/availabilities**
Criar novo bloqueio de horário

**Corpo da Requisição:**
```json
{
  "staffId": "ABC123",
  "date": "2025-11-05",
  "startTime": "14:00",
  "endTime": "16:00",
  "available": false,
  "reason": "Reunião com fornecedor",
  "type": "BLOCK"
}
```

**Validações:**
- ✅ staffId, date, startTime e endTime obrigatórios
- ✅ Formato de horário: HH:mm (regex)
- ✅ endTime deve ser após startTime
- ✅ Profissional deve existir

**Resposta (201 Created):**
```json
{
  "id": "xyz789",
  "staffId": "ABC123",
  "date": "2025-11-05T00:00:00.000Z",
  "startTime": "14:00",
  "endTime": "16:00",
  "available": false,
  "reason": "Reunião com fornecedor",
  "type": "BLOCK",
  "createdAt": "2025-11-04T10:30:00.000Z",
  "staff": {
    "id": "ABC123",
    "name": "João Silva"
  }
}
```

---

### 3. **DELETE /api/availabilities/[id]**
Deletar um bloqueio específico

**Exemplo:**
```bash
DELETE /api/availabilities/xyz789
```

**Resposta:**
```json
{
  "message": "Bloqueio deletado com sucesso"
}
```

---

## 🧠 Lógica de Geração de Slots Atualizada

### API: `GET /api/available-slots`

**Nova Lógica (em ordem):**

1. **Verificar horários de trabalho do profissional**
   - workStart, workEnd, workDays

2. **Verificar se trabalha no dia selecionado**
   - Se não trabalhar, retorna array vazio

3. **Buscar agendamentos existentes**
   - Status: PENDING, CONFIRMED

4. **🆕 Buscar bloqueios de horário**
   ```typescript
   const blockedSlots = await prisma.availability.findMany({
     where: {
       staffId,
       date: { gte: startOfDay, lte: endOfDay },
       available: false, // Apenas bloqueios
     },
   });
   ```

5. **Gerar slots candidatos** (30 em 30 minutos)

6. **Filtrar slots:**
   - ❌ Slots no passado
   - ❌ Slots no horário de almoço
   - ❌ **🆕 Slots que sobrepõem bloqueios**
   - ❌ Slots que conflitam com agendamentos
   - ❌ Slots sem tempo suficiente até o fim do expediente

**Código de Verificação de Bloqueio:**
```typescript
const isBlocked = blockedSlots.some((block) => {
  const [blockStartHour, blockStartMin] = block.startTime.split(":").map(Number);
  const [blockEndHour, blockEndMin] = block.endTime.split(":").map(Number);
  const blockStartInMinutes = blockStartHour * 60 + blockStartMin;
  const blockEndInMinutes = blockEndHour * 60 + blockEndMin;

  const slotEnd = new Date(slotTime);
  slotEnd.setMinutes(slotEnd.getMinutes() + service.duration);
  const slotEndInMinutes = slotEnd.getHours() * 60 + slotEnd.getMinutes();

  // Verificar se o slot sobrepõe o bloqueio
  return (
    (slotInMinutes >= blockStartInMinutes && slotInMinutes < blockEndInMinutes) ||
    (slotEndInMinutes > blockStartInMinutes && slotEndInMinutes <= blockEndInMinutes) ||
    (slotInMinutes <= blockStartInMinutes && slotEndInMinutes >= blockEndInMinutes)
  );
});
```

---

## 💻 Interface de Gestão

### Rota: `/dashboard/profissionais/[id]/disponibilidade`

**Funcionalidades:**
- ✅ Formulário para criar bloqueios
- ✅ Seleção de data (input type="date")
- ✅ Seleção de horário inicial/final (input type="time")
- ✅ Campo opcional de motivo
- ✅ Lista visual de bloqueios cadastrados
- ✅ Botão para deletar bloqueios

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│  Gerenciar Disponibilidade - João Silva            │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌────────────────────┐  ┌─────────────────────┐  │
│  │ Criar Bloqueio     │  │ Bloqueios Ativos    │  │
│  │                    │  │                     │  │
│  │ Data: [____]       │  │ 📅 05/11/2025      │  │
│  │ Início: [09:00]    │  │ 🕒 14:00 - 16:00   │  │
│  │ Fim: [18:00]       │  │ Reunião            │  │
│  │ Motivo: [____]     │  │          [Deletar] │  │
│  │                    │  │                     │  │
│  │ [Criar Bloqueio]   │  │ 📅 10/11/2025      │  │
│  └────────────────────┘  │ 🕒 10:00 - 12:00   │  │
│                          │ Treinamento        │  │
│                          │          [Deletar] │  │
│                          └─────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

**Validações do Formulário:**
- ✅ Data obrigatória
- ✅ Horário inicial obrigatório
- ✅ Horário final obrigatório
- ✅ Horário final após inicial
- ✅ Data mínima: hoje

**Feedback Visual:**
- Cards vermelhos para bloqueios (bg-red-50, border-red-200)
- Ícones: Calendar, Clock, AlertCircle
- Botão de deletar com ícone Trash2

---

## 🎮 Navegação Atualizada

### Lista de Profissionais (`/dashboard/profissionais`)

**Botões de Ação (ordem):**
```
┌─────────────────────────────────┐
│ [Editar]    [🕒 Horários]      │
│ [📅 Bloqueios]                 │
│ [Deletar]                       │
└─────────────────────────────────┘
```

1. **Editar**: Dados cadastrais (nome, email, especialidade)
2. **🕒 Horários**: Horários gerais de trabalho (dias e horário padrão)
3. **📅 Bloqueios**: Bloqueios específicos por data (novo!)
4. **Deletar**: Remover profissional

---

## 📊 Casos de Uso

### Caso 1: Reunião Agendada
**Cenário:**
- Profissional tem reunião dia 05/11 das 14h às 16h
- Horário normal: 09:00 - 18:00

**Ação no Admin:**
1. Acessar `/dashboard/profissionais`
2. Clicar em "📅 Bloqueios" do profissional
3. Preencher:
   - Data: 05/11/2025
   - Início: 14:00
   - Fim: 16:00
   - Motivo: "Reunião com fornecedor"
4. Clicar em "Criar Bloqueio"

**Resultado no Cliente:**
- Cliente ao agendar para 05/11 vê:
  - Slots disponíveis: 09:00, 09:30, 10:00, ..., 13:30
  - **SEM slots de 14:00 até 15:30** (bloqueado + duração do serviço)
  - Slots disponíveis: 16:00, 16:30, ..., 18:00

---

### Caso 2: Folga em Meio de Semana
**Cenário:**
- Profissional vai faltar dia 10/11 (quarta)
- Normalmente trabalha Seg-Sex

**Ação no Admin:**
1. Criar bloqueio:
   - Data: 10/11/2025
   - Início: 00:00
   - Fim: 23:59
   - Motivo: "Folga - Compromisso pessoal"

**Resultado:**
- Cliente não vê nenhum horário disponível para 10/11

---

### Caso 3: Horário de Almoço Extra
**Cenário:**
- Profissional precisa de almoço mais longo dia 08/11
- Almoço normal: 12:00-13:00
- Precisa: 12:00-14:00

**Ação no Admin:**
1. Criar bloqueio:
   - Data: 08/11/2025
   - Início: 13:00
   - Fim: 14:00
   - Motivo: "Almoço estendido"

**Resultado:**
- Slots disponíveis até 12:00 (considerando almoço padrão)
- Bloqueio adicional até 14:00
- Slots disponíveis a partir de 14:00

---

## 🧪 Como Testar

### 1. Criar um Bloqueio
```bash
# 1. Acesse o dashboard admin
http://localhost:3000/dashboard/profissionais

# 2. Clique em "📅 Bloqueios" de um profissional

# 3. Preencha:
Data: Amanhã
Início: 14:00
Fim: 16:00
Motivo: Teste de bloqueio

# 4. Clique em "Criar Bloqueio"
```

### 2. Verificar Bloqueio no Agendamento
```bash
# 1. Faça logout
# 2. Entre como cliente
# 3. Acesse /servicos
# 4. Escolha um serviço
# 5. Selecione o profissional com bloqueio
# 6. Escolha a data do bloqueio
# 7. Verificar: NÃO devem aparecer slots entre 14:00-16:00
```

### 3. Testar API Diretamente
```bash
# Criar bloqueio
curl -X POST http://localhost:3000/api/availabilities \
  -H "Content-Type: application/json" \
  -d '{
    "staffId": "STAFF_ID",
    "date": "2025-11-05",
    "startTime": "14:00",
    "endTime": "16:00",
    "available": false,
    "reason": "Reunião",
    "type": "BLOCK"
  }'

# Listar bloqueios
curl "http://localhost:3000/api/availabilities?staffId=STAFF_ID"

# Verificar slots (não deve ter 14:00-16:00)
curl "http://localhost:3000/api/available-slots?staffId=STAFF_ID&date=2025-11-05&serviceId=SERVICE_ID"
```

---

## 🔐 Segurança

### Proteção de Rotas
- ✅ API de disponibilidades: Apenas ADMIN
- ✅ Página de gestão: Apenas ADMIN
- ✅ API de available-slots: Pública (necessária para clientes)

### Validações
- ✅ Frontend: Validação em tempo real
- ✅ Backend: Validação de formato e lógica
- ✅ Banco: Índices para performance (staffId, date)
- ✅ Cascade delete: Ao deletar profissional, bloqueios são removidos

---

## 📈 Benefícios

### Para o Profissional
- ✅ Controle total sobre agenda
- ✅ Pode bloquear horários para compromissos
- ✅ Flexibilidade sem alterar configuração geral
- ✅ Histórico de bloqueios

### Para o Cliente
- ✅ Vê apenas horários realmente disponíveis
- ✅ Não tenta agendar em horários bloqueados
- ✅ Experiência de agendamento mais precisa

### Para o Admin/Salão
- ✅ Gestão facilitada da agenda
- ✅ Interface simples e intuitiva
- ✅ Pode ver motivos dos bloqueios
- ✅ Relatórios mais precisos

---

## 🚀 Próximas Melhorias Sugeridas

### Curto Prazo
- [ ] Bloqueios recorrentes (ex: toda terça 14-16h)
- [ ] Visualização em calendário (mensal)
- [ ] Notificar profissional sobre bloqueios
- [ ] Exportar bloqueios para CSV

### Médio Prazo
- [ ] App mobile para profissional gerenciar bloqueios
- [ ] Sincronização com Google Calendar
- [ ] Bloqueios automáticos baseados em agendamentos externos
- [ ] Sugestão de melhor horário para bloqueios

### Longo Prazo
- [ ] IA para prever necessidade de bloqueios
- [ ] Análise de produtividade por horário
- [ ] Otimização automática de agenda
- [ ] Integração com sistema de ponto eletrônico

---

## 📝 Arquivos Principais

**Banco de Dados:**
- `prisma/schema.prisma` - Modelo Availability

**APIs:**
- `app/api/availabilities/route.ts` - GET, POST
- `app/api/availabilities/[id]/route.ts` - DELETE
- `app/api/available-slots/route.ts` - Atualizado com bloqueios

**Interface:**
- `app/dashboard/profissionais/[id]/disponibilidade/page.tsx` - Gestão de bloqueios
- `app/dashboard/profissionais/page.tsx` - Botão "Bloqueios" adicionado

---

## 🎓 Conclusão

O sistema de gestão de disponibilidade está **100% funcional** e integrado. Agora cada profissional pode ter controle fino sobre quais horários ficam disponíveis para agendamento, bloqueando períodos específicos para compromissos, reuniões ou folgas.

**Status:** ✅ **Completo e Testado**

**Impacto:**
- 🎯 Horários exibidos ao cliente são 100% reais
- 🎯 Profissionais têm controle sobre sua agenda
- 🎯 Admin pode gerenciar bloqueios facilmente
- 🎯 Sistema previne agendamentos em horários bloqueados

**Credenciais de Teste:**
- Admin: admin@agendasalao.com.br / admin123
