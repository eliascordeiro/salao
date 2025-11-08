# Sistema de Horários dos Profissionais

## 📋 Visão Geral
Sistema completo para gerenciamento de horários de trabalho dos profissionais, permitindo que cada um tenha sua própria agenda personalizada.

## ✅ Funcionalidades Implementadas

### 1. Modelo de Dados (Prisma Schema)
```prisma
model Staff {
  // ... campos existentes
  workDays    String?   @default("1,2,3,4,5")  // 0=Dom, 1=Seg, ..., 6=Sáb
  workStart   String?   @default("09:00")       // Horário de início (HH:mm)
  workEnd     String?   @default("18:00")       // Horário de término (HH:mm)
  lunchStart  String?                            // Início do almoço (opcional)
  lunchEnd    String?                            // Término do almoço (opcional)
}
```

**Campos:**
- `workDays`: String com dias separados por vírgula (ex: "1,2,3,4,5" = Seg-Sex)
- `workStart`: Horário de início do expediente (formato 24h: "09:00")
- `workEnd`: Horário de término do expediente (formato 24h: "18:00")
- `lunchStart`: Início do intervalo de almoço (opcional)
- `lunchEnd`: Término do intervalo de almoço (opcional)

**Valores Padrão:**
- Dias de trabalho: Segunda a Sexta (1,2,3,4,5)
- Horário: 09:00 às 18:00
- Almoço: Não configurado (opcional)

---

### 2. Interface de Configuração

**Rota:** `/dashboard/profissionais/[id]/horarios`

**Recursos:**
- ✅ Seleção visual de dias da semana (checkboxes para Dom-Sáb)
- ✅ Campos de horário com validação de formato (HH:mm)
- ✅ Configuração opcional de horário de almoço
- ✅ Card de resumo visual da configuração
- ✅ Validações em tempo real

**Validações Implementadas:**
1. **Formato de Horário:** Regex `/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/`
2. **Pelo menos 1 dia selecionado**
3. **Horário de término após início:** `workEnd > workStart`
4. **Almoço dentro do expediente:** `lunchStart >= workStart && lunchEnd <= workEnd`
5. **Término do almoço após início:** `lunchEnd > lunchStart`

**Mensagens de Erro:**
- "Selecione pelo menos um dia de trabalho"
- "Formato de horário inválido. Use HH:mm"
- "O horário de término deve ser após o início"
- "O horário de almoço deve estar dentro do expediente"
- "O término do almoço deve ser após o início"

---

### 3. API de Atualização

**Endpoint:** `PATCH /api/staff/[id]`

**Corpo da Requisição:**
```json
{
  "workDays": ["1", "2", "3", "4", "5"],
  "workStart": "09:00",
  "workEnd": "18:00",
  "lunchStart": "12:00",
  "lunchEnd": "13:00"
}
```

**Validações do Servidor:**
- Formato de horário (regex)
- Array de dias não vazio
- Conversão de array para string CSV (`workDays.join(",")`)

**Resposta:**
```json
{
  "id": "...",
  "name": "João Silva",
  "workDays": "1,2,3,4,5",
  "workStart": "09:00",
  "workEnd": "18:00",
  "lunchStart": "12:00",
  "lunchEnd": "13:00",
  "salon": { ... },
  "services": [ ... ]
}
```

---

### 4. Integração com Sistema de Agendamento

**API de Slots Disponíveis:** `GET /api/available-slots`

**Melhorias Implementadas:**

#### 4.1. Verificação de Dia de Trabalho
```typescript
const dayOfWeek = selectedDate.getDay(); // 0-6
const workDays = staff.workDays.split(",").map(d => parseInt(d));

if (!workDays.includes(dayOfWeek)) {
  return { availableSlots: [] }; // Não trabalha neste dia
}
```

#### 4.2. Uso dos Horários Personalizados
```typescript
// Antes (hardcoded):
const workingHours = { start: 8, end: 20 };

// Depois (dinâmico):
const workStartParts = staff.workStart.split(":");
const workingHours = {
  start: parseInt(workStartParts[0]),
  startMinute: parseInt(workStartParts[1]),
  end: parseInt(workEndParts[0]),
  endMinute: parseInt(workEndParts[1]),
};
```

#### 4.3. Exclusão do Horário de Almoço
```typescript
if (lunchBreak) {
  const isDuringLunch = 
    (slotInMinutes >= lunchStartInMinutes && slotInMinutes < lunchEndInMinutes) ||
    (slotEndInMinutes > lunchStartInMinutes && slotEndInMinutes <= lunchEndInMinutes) ||
    (slotInMinutes <= lunchStartInMinutes && slotEndInMinutes >= lunchEndInMinutes);
  
  if (isDuringLunch) continue; // Pula este slot
}
```

**Lógica de Geração de Slots:**
1. Buscar configuração do profissional no banco
2. Verificar se trabalha no dia selecionado
3. Gerar slots de 30 em 30 minutos dentro do expediente
4. Excluir slots que caem no horário de almoço
5. Excluir slots que conflitam com agendamentos existentes
6. Excluir slots no passado
7. Verificar se há tempo suficiente para o serviço

---

### 5. Interface de Navegação

**Lista de Profissionais:** `/dashboard/profissionais`

**Botões de Ação:**
- **Editar:** Dados cadastrais (nome, email, telefone, especialidade)
- **Horários:** 🕒 Configuração de dias e horários de trabalho
- **Deletar:** Remover profissional

**Layout:**
```
┌─────────────────────────────────────────┐
│ [Editar]    [🕒 Horários]              │
│                                          │
│          [Deletar]                       │
└─────────────────────────────────────────┘
```

---

## 🎯 Casos de Uso

### Caso 1: Profissional Meio Período
**Configuração:**
- Dias: Terça, Quinta, Sábado
- Horário: 14:00 - 20:00
- Almoço: Não configurado

**Resultado:**
- Slots disponíveis apenas nos dias configurados
- Horários de 14:00 até 20:00 (menos duração do serviço)

---

### Caso 2: Profissional com Pausa para Almoço
**Configuração:**
- Dias: Segunda a Sexta
- Horário: 09:00 - 18:00
- Almoço: 12:00 - 13:30

**Resultado:**
- Slots de 09:00 até 11:30
- **Sem slots entre 12:00 e 13:30**
- Slots de 13:30 até 18:00 (menos duração do serviço)

---

### Caso 3: Profissional Horário Comercial
**Configuração:**
- Dias: Segunda a Sexta
- Horário: 08:00 - 17:00
- Almoço: Não configurado

**Resultado:**
- Slots contínuos de 08:00 até 17:00
- Nenhum slot no sábado/domingo

---

## 📊 Scripts de Diagnóstico

### Listar Profissionais e Horários
```bash
node prisma/list-staff.js
```

**Saída:**
```
📊 Total de profissionais: 3

1. Carlos Silva
   ID: cmhi0feo40002of44fhu2d9hu
   Especialidade: Cortes Modernos e Barbas
   Status: ✅ Ativo
   Dias de trabalho: 1,2,3,4,5
   Horário: 09:00 - 18:00
   Almoço: Não configurado
```

---

## 🧪 Como Testar

### 1. Configurar Horário de um Profissional
```bash
# 1. Acesse o dashboard admin
http://localhost:3000/dashboard/profissionais

# 2. Clique em "🕒 Horários" de um profissional

# 3. Configure:
- Dias: Seg, Ter, Qua
- Horário: 10:00 - 16:00
- Almoço: 12:00 - 13:00

# 4. Salvar
```

### 2. Testar Agendamento
```bash
# 1. Faça logout e acesse como cliente
http://localhost:3000/servicos

# 2. Escolha um serviço

# 3. Selecione o profissional configurado

# 4. Escolha uma data:
- Segunda: Deve mostrar slots das 10:00 às 16:00 (exceto 12:00-13:00)
- Quinta: Sem slots disponíveis
- Domingo: Sem slots disponíveis
```

### 3. Verificar API Diretamente
```bash
# Slots disponíveis de um profissional em uma data específica
curl "http://localhost:3000/api/available-slots?staffId=STAFF_ID&date=2025-06-02&serviceId=SERVICE_ID"

# Resposta esperada:
{
  "availableSlots": [
    "10:00",
    "10:30",
    "11:00",
    "11:30",
    "13:00",
    "13:30",
    "14:00",
    "14:30",
    "15:00"
  ]
}
# Nota: Sem slots entre 12:00 e 13:00 (almoço)
```

---

## 🔐 Segurança

### Proteção de Rotas
- ✅ Página de horários: Apenas ADMIN
- ✅ API PATCH: Apenas ADMIN
- ✅ API GET (available-slots): Pública (necessária para clientes)

### Validações
- ✅ Frontend: Validação em tempo real com feedback visual
- ✅ Backend: Validação de formato e lógica de horários
- ✅ Banco: Defaults seguros (Seg-Sex, 09:00-18:00)

---

## 📈 Impacto no Sistema

### Antes
- ❌ Todos profissionais: 8h às 20h, Seg-Sáb (hardcoded)
- ❌ Sem horário de almoço
- ❌ Sem flexibilidade de dias
- ❌ Impossível ter profissionais meio período

### Depois
- ✅ Cada profissional: horários personalizados
- ✅ Suporte a horário de almoço configurável
- ✅ Dias de trabalho flexíveis (qualquer combinação)
- ✅ Suporte a profissionais meio período
- ✅ Interface amigável para configuração
- ✅ Validação robusta em múltiplas camadas

---

## 🚀 Próximas Melhorias Sugeridas

### Curto Prazo
- [ ] Mostrar horário do profissional na lista (tooltip ou card)
- [ ] Copiar horário de um profissional para outro
- [ ] Histórico de alterações de horários
- [ ] Notificar profissional sobre mudanças de horário

### Médio Prazo
- [ ] Suporte a múltiplos intervalos por dia (ex: 2 pausas)
- [ ] Horários diferentes por dia da semana
- [ ] Bloqueio de dias específicos (férias, feriados)
- [ ] Horário de verão/inverno (ajuste sazonal)

### Longo Prazo
- [ ] Integração com calendário externo (Google Calendar)
- [ ] Relatório de produtividade por horário
- [ ] Sugestão de melhor horário baseado em histórico
- [ ] App mobile para profissional ajustar próprio horário

---

## 📝 Notas Técnicas

### Formato de Armazenamento
- **workDays:** String CSV (ex: "0,1,5" = Dom, Seg, Sáb)
  - 0 = Domingo
  - 1 = Segunda
  - 2 = Terça
  - 3 = Quarta
  - 4 = Quinta
  - 5 = Sexta
  - 6 = Sábado

- **Horários:** String no formato 24h "HH:mm" (ex: "09:00", "18:30")

### Cálculo de Slots
```typescript
// Exemplo de cálculo de minutos desde meia-noite
const timeInMinutes = hour * 60 + minute;

// Comparação de overlaps
const slotStart = slotHour * 60 + slotMinute;
const slotEnd = slotStart + serviceDuration;
const lunchStart = lunchHour * 60 + lunchMinute;
const lunchEnd = lunchEndHour * 60 + lunchEndMinute;

// Overlap se: slotStart < lunchEnd && slotEnd > lunchStart
```

### Performance
- ✅ Query única para buscar profissional
- ✅ Cálculo de slots em memória (O(n) onde n = slots possíveis)
- ✅ Índices no banco: staffId, date (para bookings existentes)

---

## 🎓 Conclusão

O sistema de horários dos profissionais está **100% funcional** e integrado ao sistema de agendamento. Permite que cada profissional tenha sua própria agenda personalizada, com dias e horários de trabalho configuráveis, incluindo suporte a horário de almoço.

**Status:** ✅ **Completo e Testado**

**Arquivos Principais:**
- `prisma/schema.prisma` - Modelo de dados
- `app/dashboard/profissionais/[id]/horarios/page.tsx` - Interface de configuração
- `app/api/staff/[id]/route.ts` - API PATCH para atualizar horários
- `app/api/available-slots/route.ts` - API integrada com horários personalizados
- `app/dashboard/profissionais/page.tsx` - Lista com botão "Horários"

**Credenciais de Teste:**
- Admin: admin@agendasalao.com.br / admin123
- Cliente: pedro@exemplo.com / cliente123
