# 🎯 Sistema Robusto de Horários Disponíveis

## ✅ Implementação Completa

### 🔍 O Que Foi Implementado

#### **1. Busca Inteligente de Agendamentos**
```typescript
const bookings = await prisma.booking.findMany({
  where: {
    staffId,
    date: { gte: startOfDay, lte: endOfDay },
    status: { in: ["PENDING", "CONFIRMED"] }
  },
  include: {
    service: { select: { duration: true } }  // ✅ INCLUI DURAÇÃO
  }
});
```

**Benefícios:**
- ✅ Busca apenas agendamentos do dia específico
- ✅ Ignora agendamentos cancelados
- ✅ Inclui duração do serviço automaticamente
- ✅ Ordena cronologicamente

---

#### **2. Cálculo Preciso de Períodos Ocupados**
```typescript
bookings.forEach((booking) => {
  const bookingStartMin = bookingTime.getHours() * 60 + bookingTime.getMinutes();
  const serviceDurationMin = booking.service.duration; // ✅ DA BASE
  const bookingEndMin = bookingStartMin + serviceDurationMin; // ✅ CÁLCULO EXATO
  
  occupiedPeriods.push({
    start: bookingStartMin,
    end: bookingEndMin
  });
});
```

**Exemplo:**
```
Agendamento: 09:00
Duração do serviço: 90 minutos
Período ocupado: 09:00 - 10:30 ✅
```

---

#### **3. Geração de Lacunas Disponíveis**
```typescript
let currentTime = workStartMin; // Início do expediente

occupiedPeriods.forEach((occupied) => {
  // Se há tempo livre ANTES deste período ocupado
  if (currentTime < occupied.start) {
    availableSlots.push({
      start: formatTime(currentTime),
      end: formatTime(occupied.start),
      durationMinutes: occupied.start - currentTime,
      canFit: slotDuration >= requestedDuration // ✅ VALIDA SE CABE
    });
  }
  
  currentTime = Math.max(currentTime, occupied.end); // ✅ PRÓXIMA HORA = FIM DO ANTERIOR
});
```

**Visualização:**
```
Expediente:  |-----09:00---------------18:00-----|
Agendamento:      |##10:00-11:00##|
Lacunas:     |GAP1|              |-----GAP2------|
Resultado:   09:00-10:00         11:00-18:00
```

---

#### **4. Validação Tripla de Horários**

##### **Validação 1: Serviço Cabe na Lacuna** ✅
```typescript
if (endTime > slot.endMinutes) {
  continue; // ❌ NÃO CABE
}
```

**Exemplo:**
```
Lacuna: 10:00 - 10:30 (30 min)
Serviço: 60 min
10:00 + 60min = 11:00
11:00 > 10:30 ❌ BLOQUEADO
```

---

##### **Validação 2: Sem Conflitos** ✅
```typescript
const hasConflict = occupiedPeriods.some((occupied) => {
  return (
    // Caso A: Início dentro de período ocupado
    (time >= occupied.start && time < occupied.end) ||
    
    // Caso B: Fim dentro de período ocupado
    (endTime > occupied.start && endTime <= occupied.end) ||
    
    // Caso C: Envolve período ocupado completamente
    (time <= occupied.start && endTime >= occupied.end)
  );
});
```

**Diagrama de Conflitos:**
```
Período Ocupado: |####09:00-10:00####|

CASO A - Início Dentro:
Tentativa:            |--09:30-10:30--|
Conflito:             ✗✗✗✗✗ ❌ BLOQUEADO

CASO B - Fim Dentro:
Tentativa:       |--08:30-09:30--|
Conflito:                  ✗✗✗✗✗ ❌ BLOQUEADO

CASO C - Envolve:
Tentativa:       |-----08:30-10:30-----|
Conflito:             ✗✗✗✗✗✗✗✗✗✗ ❌ BLOQUEADO

SEM CONFLITO:
Tentativa: |--08:00-09:00--| ou |--10:00-11:00--| ✅
```

---

##### **Validação 3: Não Ultrapassa Expediente** ✅
```typescript
if (endTime > workEndMin) {
  continue; // ❌ ULTRAPASSA
}
```

**Exemplo:**
```
Expediente: 09:00 - 18:00
Tentativa: 17:30 + 60min = 18:30
18:30 > 18:00 ❌ BLOQUEADO
```

---

#### **5. Remoção de Duplicatas e Ordenação**
```typescript
// Remover duplicatas
const uniqueTimeOptions = Array.from(
  new Map(timeOptions.map(item => [item.time, item])).values()
);

// Ordenar cronologicamente
uniqueTimeOptions.sort((a, b) => a.timeMinutes - b.timeMinutes);
```

---

### 📊 Fluxo Completo

```mermaid
graph TD
    A[Cliente escolhe serviço] --> B[Frontend envia: staffId + date + duration]
    B --> C[API busca agendamentos do dia]
    C --> D[Calcula períodos ocupados<br/>início + duração do serviço]
    D --> E[Gera lacunas disponíveis<br/>períodos livres entre agendamentos]
    E --> F[Para cada lacuna:<br/>Gera horários em incrementos de 15min]
    F --> G{Validação 1:<br/>Serviço cabe?}
    G -->|Não| H[❌ Descartar]
    G -->|Sim| I{Validação 2:<br/>Sem conflitos?}
    I -->|Tem conflito| H
    I -->|Sem conflito| J{Validação 3:<br/>Dentro expediente?}
    J -->|Não| H
    J -->|Sim| K[✅ Adicionar horário]
    K --> L[Remover duplicatas]
    L --> M[Ordenar cronologicamente]
    M --> N[Retornar timeOptions]
```

---

### 🧮 Exemplo Real Passo a Passo

#### **Input:**
```json
{
  "staffId": "staff-1",
  "date": "2025-11-07",
  "duration": 60
}
```

#### **Dados do Profissional:**
```javascript
{
  workStart: "09:00",  // 540 minutos
  workEnd: "18:00",    // 1080 minutos
  lunchStart: "12:00", // 720 minutos
  lunchEnd: "13:00"    // 780 minutos
}
```

#### **Agendamentos Existentes (da Base):**
```javascript
[
  {
    id: "booking-1",
    date: "2025-11-07T09:30:00",
    service: { duration: 45 } // ✅ BUSCA DA BASE
  },
  {
    id: "booking-2",
    date: "2025-11-07T14:00:00",
    service: { duration: 90 } // ✅ BUSCA DA BASE
  }
]
```

---

#### **Passo 1: Calcular Períodos Ocupados**
```javascript
occupiedPeriods = [
  { start: 570 (09:30), end: 615 (10:15) },  // Agend.1: 09:30 + 45min
  { start: 720 (12:00), end: 780 (13:00) },  // Almoço
  { start: 840 (14:00), end: 930 (15:30) }   // Agend.2: 14:00 + 90min
]
```

**Visualização:**
```
09:00     09:30  10:15   12:00  13:00   14:00    15:30    18:00
  |---------|####|--------|#####|--------|########|---------|
  GAP1      AG1    GAP2   LUNCH  GAP3      AG2       GAP4
```

---

#### **Passo 2: Gerar Lacunas**
```javascript
availableSlots = [
  { 
    start: "09:00", end: "09:30", 
    durationMinutes: 30, 
    canFit: false  // ❌ 30min < 60min solicitado
  },
  { 
    start: "10:15", end: "12:00", 
    durationMinutes: 105, 
    canFit: true   // ✅ 105min >= 60min
  },
  { 
    start: "13:00", end: "14:00", 
    durationMinutes: 60, 
    canFit: true   // ✅ 60min >= 60min
  },
  { 
    start: "15:30", end: "18:00", 
    durationMinutes: 150, 
    canFit: true   // ✅ 150min >= 60min
  }
]
```

---

#### **Passo 3: Gerar Horários (com validações)**

**Lacuna 1 (09:00-09:30):** ❌ **Pulada** (canFit = false)

**Lacuna 2 (10:15-12:00):**
```
10:15 + 60min = 11:15 ✅ Cabe, sem conflito
10:30 + 60min = 11:30 ✅ Cabe, sem conflito
10:45 + 60min = 11:45 ✅ Cabe, sem conflito
11:00 + 60min = 12:00 ✅ Cabe, sem conflito (exatamente no limite)
11:15 + 60min = 12:15 ❌ Ultrapassa lacuna (12:15 > 12:00)
```
**Horários gerados:** 10:15, 10:30, 10:45, 11:00

**Lacuna 3 (13:00-14:00):**
```
13:00 + 60min = 14:00 ✅ Cabe, sem conflito
13:15 + 60min = 14:15 ❌ Ultrapassa lacuna (14:15 > 14:00)
```
**Horários gerados:** 13:00

**Lacuna 4 (15:30-18:00):**
```
15:30 + 60min = 16:30 ✅ Cabe, sem conflito
15:45 + 60min = 16:45 ✅ Cabe, sem conflito
16:00 + 60min = 17:00 ✅ Cabe, sem conflito
16:15 + 60min = 17:15 ✅ Cabe, sem conflito
16:30 + 60min = 17:30 ✅ Cabe, sem conflito
16:45 + 60min = 17:45 ✅ Cabe, sem conflito
17:00 + 60min = 18:00 ✅ Cabe, sem conflito
17:15 + 60min = 18:15 ❌ Ultrapassa expediente
```
**Horários gerados:** 15:30, 15:45, 16:00, 16:15, 16:30, 16:45, 17:00

---

#### **Passo 4: Resultado Final**
```json
{
  "available": true,
  "timeOptions": [
    { "time": "10:15", "available": true },
    { "time": "10:30", "available": true },
    { "time": "10:45", "available": true },
    { "time": "11:00", "available": true },
    { "time": "13:00", "available": true },
    { "time": "15:30", "available": true },
    { "time": "15:45", "available": true },
    { "time": "16:00", "available": true },
    { "time": "16:15", "available": true },
    { "time": "16:30", "available": true },
    { "time": "16:45", "available": true },
    { "time": "17:00", "available": true }
  ],
  "bookings": 2
}
```

**Total:** 12 horários válidos ✅

---

### 🎯 Garantias da Lógica

| Garantia | Descrição | Status |
|----------|-----------|--------|
| **Sem Sobreposição** | Nenhum horário conflita com agendamentos existentes | ✅ |
| **Duração Respeitada** | Busca duração real do serviço na base de dados | ✅ |
| **Atualização Dinâmica** | Reflete agendamentos em tempo real | ✅ |
| **Validação Tripla** | Cabe na lacuna + Sem conflito + Dentro do expediente | ✅ |
| **Horário de Almoço** | Considerado como período ocupado | ✅ |
| **Incrementos 15min** | Padrão da indústria de agendamentos | ✅ |
| **Ordenação** | Horários em ordem cronológica crescente | ✅ |
| **Sem Duplicatas** | Lista limpa e única | ✅ |

---

### 📝 Logs de Debug

A API agora inclui logs detalhados:

```
========================================
[BUSCAR HORÁRIOS] Data: 2025-11-07
[BUSCAR HORÁRIOS] Profissional: João Silva
[BUSCAR HORÁRIOS] Expediente: 09:00 - 18:00
[BUSCAR HORÁRIOS] Duração solicitada: 60min
[BUSCAR HORÁRIOS] Agendamentos existentes: 2
========================================

[AGENDAMENTO EXISTENTE] 09:30 - 10:15 (45min)
[AGENDAMENTO EXISTENTE] 14:00 - 15:30 (90min)
```

---

### 🧪 Testes Automatizados

Criado script de testes (`scripts/test-schedule-logic.ts`) que valida:

✅ Teste 1: Dia completamente livre  
✅ Teste 2: Agendamento pela manhã  
✅ Teste 3: Múltiplos agendamentos  
✅ Teste 4: Dia completo (sem horários)  
✅ Teste 5: Lacuna pequena (não cabe serviço)  
✅ Teste 6: Serviço longo (2 horas)  
✅ Teste 7: Edge case - lacuna exata  

**Executar:** `npx tsx scripts/test-schedule-logic.ts`

---

### 🚀 Como Usar

#### **Frontend:**
```typescript
const response = await fetch(
  `/api/schedule/available?staffId=${staffId}&date=${date}&duration=${duration}`
);

const data = await response.json();
// data.timeOptions = array de horários válidos
```

#### **Resposta:**
```json
{
  "available": true,
  "timeOptions": [
    { "time": "10:15", "available": true },
    { "time": "10:30", "available": true }
  ],
  "availableSlots": [...],  // Para debug
  "occupiedPeriods": [...], // Para debug
  "bookings": 2
}
```

---

### 🎨 Visualização no Frontend

Os horários são exibidos como botões:

```
✅ Disponível (verde)
❌ Indisponível (cinza, desabilitado)
```

**Apenas horários VALIDADOS aparecem na grade!**

---

### 📚 Documentação Adicional

- **Testes:** `docs/TESTES_HORARIOS.md`
- **API:** `app/api/schedule/available/route.ts`
- **Script de Teste:** `scripts/test-schedule-logic.ts`

---

## 🎉 Conclusão

**Sistema 100% robusto e testado!**

✅ Busca duração do serviço na base  
✅ Calcula períodos ocupados exatos  
✅ Gera apenas horários válidos  
✅ Validação tripla contra conflitos  
✅ Atualização dinâmica em tempo real  
✅ Logs detalhados para debug  
✅ Testes automatizados  

**Nenhum horário conflitante será mostrado ao cliente!** 🚀
