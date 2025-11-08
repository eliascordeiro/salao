# Sistema de Cadastro Manual de Horários Disponíveis

## 📋 Visão Geral
Sistema que permite ao administrador **cadastrar manualmente** quais horários estarão disponíveis para agendamento, dando controle total sobre a agenda de cada profissional.

## 🎯 Conceito

### Antes (Sistema Automático)
```
❌ Sistema gera slots automaticamente (09:00, 09:30, 10:00, ...)
❌ Admin só pode BLOQUEAR horários
❌ Todos os horários dentro do expediente ficam disponíveis por padrão
```

### Agora (Sistema Manual)
```
✅ Admin CADASTRA cada horário que quer disponibilizar
✅ Só aparecem horários que foram cadastrados
✅ Controle total: adiciona um por um ou em lote
✅ Cliente vê APENAS os horários cadastrados
```

---

## 🎮 Como Funciona

### Fluxo Completo:

#### 1. **Admin Cadastra Horários**

**Passo 1:** Seleciona a data
```
Data: 05/11/2025
```

**Passo 2:** Adiciona múltiplos horários
```
Hora Inicial: 09:00
Hora Final: 09:30
[Adicionar à Lista] ← Clica aqui

Hora Inicial: 09:30
Hora Final: 10:00
[Adicionar à Lista] ← Clica aqui

Hora Inicial: 10:00
Hora Final: 10:30
[Adicionar à Lista] ← Clica aqui

... e assim por diante
```

**Passo 3:** Salva todos de uma vez
```
Lista:
✅ 09:00 - 09:30
✅ 09:30 - 10:00
✅ 10:00 - 10:30
✅ 10:30 - 11:00
✅ 11:00 - 11:30

[Salvar Todos (5)] ← Clica aqui
```

#### 2. **Sistema Registra no Banco**

```sql
INSERT INTO Availability (staffId, date, startTime, endTime, available, type) VALUES
  ('ABC123', '2025-11-05', '09:00', '09:30', true, 'AVAILABLE'),
  ('ABC123', '2025-11-05', '09:30', '10:00', true, 'AVAILABLE'),
  ('ABC123', '2025-11-05', '10:00', '10:30', true, 'AVAILABLE'),
  ('ABC123', '2025-11-05', '10:30', '11:00', true, 'AVAILABLE'),
  ('ABC123', '2025-11-05', '11:00', '11:30', true, 'AVAILABLE');
```

#### 3. **Cliente Agenda**

```
Cliente acessa: /servicos
Seleciona: Corte Masculino
Escolhe: João Silva
Data: 05/11/2025

Horários disponíveis:
✅ 09:00 - 09:30
✅ 09:30 - 10:00
✅ 10:00 - 10:30
✅ 10:30 - 11:00
✅ 11:00 - 11:30

(APENAS OS 5 CADASTRADOS)
```

---

## 💻 Interface de Cadastro

### Rota: `/dashboard/profissionais/[id]/slots`

**Layout da Tela:**

```
┌─────────────────────────────────────────────────────────┐
│  Cadastrar Horários Disponíveis - João Silva           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌───────────────────┐  ┌──────────────────────────┐   │
│  │ ADICIONAR         │  │ HORÁRIOS CADASTRADOS     │   │
│  │                   │  │                          │   │
│  │ 📅 Data:          │  │ 📅 05/11/2025 (5)        │   │
│  │ [05/11/2025]      │  │ 🕒 09:00 - 09:30  [❌]  │   │
│  │                   │  │ 🕒 09:30 - 10:00  [❌]  │   │
│  │ 🕒 Hora Inicial:  │  │ 🕒 10:00 - 10:30  [❌]  │   │
│  │ [09:00]           │  │ 🕒 10:30 - 11:00  [❌]  │   │
│  │                   │  │ 🕒 11:00 - 11:30  [❌]  │   │
│  │ 🕒 Hora Final:    │  │                          │   │
│  │ [09:30]           │  │ 📅 06/11/2025 (3)        │   │
│  │                   │  │ 🕒 14:00 - 14:30  [❌]  │   │
│  │ [Adicionar]       │  │ 🕒 14:30 - 15:00  [❌]  │   │
│  │                   │  │ 🕒 15:00 - 15:30  [❌]  │   │
│  │ Lista (3):        │  └──────────────────────────┘   │
│  │ ✅ 09:00-09:30 ❌│                                   │
│  │ ✅ 09:30-10:00 ❌│                                   │
│  │ ✅ 10:00-10:30 ❌│                                   │
│  │                   │                                   │
│  │ [Salvar Todos(3)] │                                   │
│  └───────────────────┘                                   │
└─────────────────────────────────────────────────────────┘
```

**Funcionalidades:**

1. **Selecionar Data** ✅
   - Input type="date"
   - Data mínima: hoje

2. **Adicionar Horários à Lista** ✅
   - Hora inicial (input type="time")
   - Hora final (input type="time")
   - Botão "Adicionar à Lista"
   - Validação: hora final > hora inicial

3. **Lista Temporária** ✅
   - Mostra horários antes de salvar
   - Permite remover da lista
   - Contador: (3 horários)

4. **Salvar em Lote** ✅
   - Botão "Salvar Todos (N)"
   - Salva todos de uma vez
   - Limpa lista após sucesso

5. **Horários Cadastrados** ✅
   - Agrupados por data
   - Ordenados por horário
   - Botão para deletar individual

---

## 🔌 API Utilizada

### Reutilizando `/api/availabilities`

**Criar Slot Disponível:**
```typescript
POST /api/availabilities
{
  "staffId": "ABC123",
  "date": "2025-11-05",
  "startTime": "09:00",
  "endTime": "09:30",
  "available": true,  // ← true = horário disponível
  "type": "AVAILABLE" // ← tipo AVAILABLE (não BLOCK)
}
```

**Listar Slots Cadastrados:**
```typescript
GET /api/availabilities?staffId=ABC123

// Filtrar apenas available: true no frontend
const slots = data.filter(s => s.available === true);
```

**Deletar Slot:**
```typescript
DELETE /api/availabilities/[id]
```

---

## 📊 Casos de Uso

### Caso 1: Profissional com Agenda Flexível

**Cenário:**
- Profissional trabalha sob demanda
- Não tem horário fixo
- Admin quer controlar exatamente quais horários disponibilizar

**Ação:**
```
Dia 05/11:
- Cadastra: 09:00-09:30, 10:00-10:30, 14:00-14:30

Dia 06/11:
- Cadastra: 15:00-15:30, 16:00-16:30
```

**Resultado:**
```
Cliente vê apenas:
05/11: 09:00, 10:00, 14:00
06/11: 15:00, 16:00
```

---

### Caso 2: Profissional com Horários Específicos

**Cenário:**
- Profissional atende apenas de manhã
- Horários: 08:00, 08:30, 09:00, 09:30

**Ação:**
```
Para toda semana:
Segunda: 08:00-08:30, 08:30-09:00, 09:00-09:30, 09:30-10:00
Terça: 08:00-08:30, 08:30-09:00, 09:00-09:30, 09:30-10:00
... (repetir para cada dia)
```

**Resultado:**
```
Cliente sempre vê esses 4 horários
Nenhum outro horário aparece
```

---

### Caso 3: Cadastro em Lote para Semana Inteira

**Cenário:**
- Admin quer configurar semana toda de uma vez
- Mesmos horários para todos os dias

**Ação:**
```
Dia 04/11 (Seg):
1. Seleciona data: 04/11
2. Adiciona: 09:00-09:30 [Adicionar]
3. Adiciona: 09:30-10:00 [Adicionar]
4. Adiciona: 10:00-10:30 [Adicionar]
5. Adiciona: 10:30-11:00 [Adicionar]
6. [Salvar Todos (4)]

Dia 05/11 (Ter):
7. Seleciona data: 05/11
8. Repete passos 2-6

... continua para outros dias
```

---

## 🔄 Integração com Sistema de Agendamento

### Opção 1: Modo Manual (Recomendado)

**Modificar `/api/available-slots` para usar apenas slots cadastrados:**

```typescript
// Buscar apenas slots cadastrados manualmente
const availableSlots = await prisma.availability.findMany({
  where: {
    staffId,
    date: { gte: startOfDay, lte: endOfDay },
    available: true, // Apenas slots disponíveis cadastrados
    type: "AVAILABLE"
  },
  orderBy: { startTime: "asc" }
});

// Verificar quais ainda não foram agendados
const freeSlots = availableSlots.filter(slot => {
  return !existingBookings.some(booking => {
    // Verificar se slot conflita com booking
    return (/*lógica de conflito*/);
  });
});

// Retornar apenas slots livres
return freeSlots.map(s => s.startTime);
```

### Opção 2: Modo Híbrido

**Combinar slots automáticos + cadastrados:**

```typescript
// Gerar slots automáticos
const autoSlots = generateSlots(workStart, workEnd);

// Buscar slots cadastrados
const manualSlots = await prisma.availability.findMany({
  where: { staffId, date, available: true, type: "AVAILABLE" }
});

// Combinar: autoSlots + manualSlots (únicos)
const allSlots = [...new Set([...autoSlots, ...manualSlots.map(s => s.startTime)])];

// Filtrar conflitos
return allSlots.filter(/*sem conflitos*/);
```

---

## 🎯 Vantagens

### Para o Admin
- ✅ **Controle Total**: Define exatamente quais horários ficam disponíveis
- ✅ **Flexibilidade**: Diferentes horários para diferentes dias
- ✅ **Simplicidade**: Interface intuitiva para adicionar em lote
- ✅ **Visualização**: Vê todos horários cadastrados agrupados por data

### Para o Profissional
- ✅ Trabalha apenas nos horários que cadastrou
- ✅ Não precisa bloquear, apenas não cadastra
- ✅ Agenda sob medida para cada dia

### Para o Cliente
- ✅ Vê apenas horários realmente disponíveis
- ✅ Não perde tempo com horários que não existem
- ✅ Experiência mais precisa

---

## 🧪 Como Testar

### 1. Cadastrar Slots
```bash
# 1. Acesse
http://localhost:3000/dashboard/profissionais

# 2. Clique em "✅ Cadastrar Slots"

# 3. Selecione data: Amanhã

# 4. Adicione horários:
Início: 09:00, Fim: 09:30 [Adicionar]
Início: 09:30, Fim: 10:00 [Adicionar]
Início: 10:00, Fim: 10:30 [Adicionar]

# 5. Clique em "Salvar Todos (3)"
```

### 2. Verificar no Agendamento
```bash
# 1. Faça logout
# 2. Entre como cliente
# 3. Acesse /servicos
# 4. Selecione serviço e profissional
# 5. Escolha data cadastrada
# 6. Verificar: DEVEM aparecer apenas os 3 slots cadastrados
```

### 3. Testar API
```bash
# Listar slots cadastrados
curl "http://localhost:3000/api/availabilities?staffId=STAFF_ID"

# Filtrar apenas available: true
jq '[.[] | select(.available == true)]' result.json
```

---

## 📝 Próximos Passos

### 1. Atualizar API available-slots (Obrigatório)

**Modificar `/app/api/available-slots/route.ts`:**

```typescript
// ANTES: Gera slots automaticamente
const slots = generateAutomaticSlots(workStart, workEnd);

// DEPOIS: Busca slots cadastrados
const slots = await prisma.availability.findMany({
  where: {
    staffId,
    date: { gte: startOfDay, lte: endOfDay },
    available: true,
    type: "AVAILABLE"
  }
});

// Filtrar apenas não agendados
const freeSlots = slots.filter(slot => !isBooked(slot));
```

### 2. Adicionar Funcionalidades Extras

- [ ] **Copiar horários de um dia para outro**
- [ ] **Template semanal** (cadastra semana inteira de uma vez)
- [ ] **Importar de CSV** (lista de horários)
- [ ] **Duplicar semana** (copia para próxima semana)

### 3. Melhorias de UX

- [ ] **Preview antes de salvar** (mostra como ficará no calendário)
- [ ] **Sugestão de horários** (baseado em padrão)
- [ ] **Contador de slots** (por dia, por semana, por mês)
- [ ] **Estatísticas** (% de slots preenchidos)

---

## 📁 Arquivos Criados

**Interface:**
- `app/dashboard/profissionais/[id]/slots/page.tsx` (450+ linhas)

**Navegação:**
- `app/dashboard/profissionais/page.tsx` (botão "✅ Cadastrar Slots")

**APIs:**
- Reutiliza `/api/availabilities` existente

---

## 🎓 Conclusão

O sistema de **cadastro manual de horários** está implementado e funcional! 

Agora o admin tem **controle total** sobre quais horários aparecem para os clientes:

- ✅ Adiciona horários um por um
- ✅ Adiciona múltiplos horários em sequência
- ✅ Salva todos de uma vez
- ✅ Visualiza horários cadastrados agrupados por data
- ✅ Remove horários individualmente

**Próximo Passo CRÍTICO:**
Modificar `/api/available-slots` para retornar APENAS os slots cadastrados manualmente, em vez de gerar automaticamente.

**Status:** ✅ **Interface Completa - API Precisa ser Adaptada**

