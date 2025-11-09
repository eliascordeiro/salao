# 🧪 GUIA DE TESTE: Slots Segunda-feira - Elias Cordeiro

## 📋 Situação
- **Profissional**: Elias Cordeiro
- **Salão**: elias@ig.com.br (Barbearia Estilo & Cortess)
- **Serviço**: Barba Cabelo e Bigote
- **Problema**: Segunda-feira não aparece slots

## ✅ Verificações no Banco
Executei `node debug-slots-segunda.js` e confirmei:
- ✅ Elias tem `workDays: "1,2,3,4,5"` (Segunda a Sexta)
- ✅ Existem 36 slots para segunda-feira (dayOfWeek = 1)
- ✅ Slots começam em 09:00 e vão até 17:45
- ✅ Nenhum agendamento conflitante na data

## 🔧 Correções Implementadas

### 1. API atualizada para retornar workDays
**Arquivo**: `app/api/public/salons/[id]/route.ts`
- Adicionado `workDays`, `workStart`, `workEnd` no select de staff

### 2. Interface atualizada
**Arquivo**: `app/(client)/salao/[id]/agendar/page.tsx`
- Interface `Staff` agora inclui `workDays`, `workStart`, `workEnd`

### 3. Filtragem de dias implementada
- Calendário agora filtra dias pelos `workDays` do profissional
- Logs de debug adicionados para rastrear o problema

## 🧪 Como Testar

### Teste 1: Verificar API
```bash
# 1. Iniciar servidor
npm run dev

# 2. Em outro terminal, testar API
node test-api-workdays.js
```

**Resultado esperado**:
```
✅ Elias Cordeiro encontrado!
   WorkDays: 1,2,3,4,5
   Dias de trabalho: Seg, Ter, Qua, Qui, Sex
```

**Se falhar**: workDays não está sendo retornado pela API

### Teste 2: Testar Interface

1. Abra o navegador: `http://localhost:3000`

2. Faça login como cliente:
   - Email: `pedro@exemplo.com`
   - Senha: `cliente123`

3. Acesse: `/salao/cmhpdo1c40007of60yed697zp/agendar`

4. **Passo 1**: Selecione o serviço "Barba"

5. **Passo 2**: Selecione "Elias Cordeiro"

6. **Passo 3**: Verifique o calendário
   - ✅ **Deve mostrar APENAS Segunda a Sexta**
   - ❌ **NÃO deve mostrar Sábado/Domingo**

7. Clique em uma **Segunda-feira**

8. Verifique o console do navegador (F12 → Console):
   ```
   🔍 DEBUG next14Days:
     - Profissional: Elias Cordeiro
     - StaffMember encontrado: true
     - WorkDays: 1,2,3,4,5
     - WorkDays array: [1, 2, 3, 4, 5]
     ✅ Dias gerados: 14
   
   📅 Buscando slots: {staffId: "...", date: "2025-11-10", ...}
   ```

9. **Deve aparecer** a grade de horários:
   ```
   09:00  09:15  09:30  09:45  ...
   ```

## 🐛 Se NÃO Funcionar

### Problema 1: workDays não aparece no console
**Causa**: API não retorna workDays
**Solução**: Verificar se arquivo `app/api/public/salons/[id]/route.ts` foi salvo corretamente

### Problema 2: Calendário mostra Sábado/Domingo
**Causa**: Filtragem não está funcionando
**Verifique**:
- Console mostra "WorkDays: undefined"?
- StaffMember encontrado: false?

**Solução**: 
```typescript
// Verificar se dados estão chegando
console.log('Staff completo:', staff);
console.log('SelectedStaff:', selectedStaff);
```

### Problema 3: Segunda aparece mas sem slots
**Causa**: API não retorna slots ou há problema na chamada

**Verificar**:
1. Abrir Network tab (F12 → Network)
2. Filtrar por "available-slots"
3. Ver request:
   ```
   /api/available-slots?staffId=...&date=2025-11-10&serviceId=...
   ```
4. Ver response:
   ```json
   {
     "availableSlots": ["09:00", "09:15", ...]
   }
   ```

**Se response vazia**: Problema na API
**Se response com slots**: Problema no render

## 🔬 Teste Direto da API

```bash
# Com servidor rodando (npm run dev)
curl "http://localhost:3000/api/available-slots?staffId=cmhovyy2f0001ofuy71lwwwna&date=2025-11-10&serviceId=service-demo-2"
```

**Resposta esperada**:
```json
{
  "availableSlots": [
    "09:00",
    "09:15",
    "09:30",
    ...
  ]
}
```

## 📊 Dados de Referência

```javascript
// IDs importantes
const SALON_ID = 'cmhpdo1c40007of60yed697zp';
const ELIAS_ID = 'cmhovyy2f0001ofuy71lwwwna';
const SERVICE_BARBA_ID = 'service-demo-2';

// Próxima segunda-feira
const proximaSegunda = '2025-11-10'; // 10/11/2025

// WorkDays do Elias
const workDays = '1,2,3,4,5'; // Seg-Sex
```

## 🎯 Checklist Final

- [ ] API retorna workDays para Elias
- [ ] Console mostra "WorkDays: 1,2,3,4,5"
- [ ] Calendário mostra apenas Seg-Sex
- [ ] Sábado/Domingo NÃO aparecem
- [ ] Clicando em Segunda mostra slots
- [ ] Slots começam em 09:00
- [ ] Total de ~36 slots por dia

---

**Se todos os checks passarem**: ✅ Sistema funcionando!
**Se algum falhar**: Envie print do console e da Network tab
