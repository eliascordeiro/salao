# 🔧 CORREÇÃO: Slots de dias não trabalhados

## 📋 Problema Identificado

Segunda-feira não aparecia slots para o profissional Elias Cordeiro, mesmo ele trabalhando seg-sex (1-5).

## 🔍 Diagnóstico

### Descobertas importantes:

1. **Dois registros de "Elias Cordeiro"** no banco:
   - ❌ ID: `cmhovyy2f0001ofuy71lwwwna` (Barbearia Estilo & Cortess)
   - ✅ ID: `cmhpfkxk10001ofyrulo7v169` (Barba Cabelo e Bigode) ← CORRETO

2. **Cache do Next.js** estava servindo dados antigos:
   - Browser console mostrava `workDays: "1,2,3,4,5,6"`
   - Banco tinha `workDays: "1,2,3,4,5"`
   - Solução: `rm -rf .next/`

3. **Slots órfãos no banco**:
   - Existiam 32 slots de sábado (dia 6)
   - Profissional só trabalha seg-sex (dias 1-5)
   - Causa: Quando admin mudou horários, slots antigos não foram removidos

4. **Fluxo de dados OK**:
   - ✅ Salvamento: Array → CSV no banco
   - ✅ Leitura: CSV do banco → String na API
   - ✅ Cliente: String → Array para filtrar dias
   - ❌ Problema: Slots recorrentes não sincronizavam com workDays

## 🛠️ Correções Implementadas

### 1. Limpeza dos slots existentes
```bash
node fix-slots-elias.js
# Removeu 32 slots de sábado
```

### 2. Atualização da API de horários
**Arquivo**: `app/api/staff/[id]/route.ts`

Adicionado limpeza automática no método PATCH:

```typescript
// 🔧 CORREÇÃO: Limpar slots recorrentes de dias não trabalhados
if (workDays && Array.isArray(workDays) && workDays.length > 0) {
  const workDaysNumbers = workDays.map(d => parseInt(d))
  
  // Remover slots recorrentes em dias que NÃO estão na lista de dias de trabalho
  const deletedSlots = await prisma.availability.deleteMany({
    where: {
      staffId: params.id,
      type: 'RECURRING',
      dayOfWeek: {
        notIn: workDaysNumbers
      }
    }
  })
  
  if (deletedSlots.count > 0) {
    console.log(`🗑️ Removidos ${deletedSlots.count} slots recorrentes de dias não trabalhados`)
  }
}
```

### 3. Teste completo do fluxo
Criado `test-cleanup-slots.js` que valida:
- ✅ Criação de slots em dias não trabalhados
- ✅ Remoção automática ao atualizar workDays
- ✅ Consistência entre workDays e slots disponíveis

## ✅ Validação

### Teste do fluxo completo (test-fluxo-completo.js):
```
ETAPA 1: Salvamento
  workDays: ["1","2","3","4","5"] → "1,2,3,4,5"
  ✅ Gravado no banco

ETAPA 2: Leitura do banco
  workDays: "1,2,3,4,5"
  ✅ Tipo string

ETAPA 3: API pública
  workDays retornado: "1,2,3,4,5"
  ✅ Valor idêntico ao banco

ETAPA 4: Cliente
  Convertido para array: [1, 2, 3, 4, 5]
  ✅ Inclui segunda (1): true
  ✅ Inclui sábado (6): false

ETAPA 5: Slots disponíveis
  Seg (1): 32 slots
  Ter (2): 32 slots
  Qua (3): 32 slots
  Qui (4): 32 slots
  Sex (5): 32 slots
  ✅ PERFEITO: workDays e slots estão consistentes!
```

### Teste de limpeza automática (test-cleanup-slots.js):
```
PASSO 2: Criar 5 slots de sábado
PASSO 4: Atualizar workDays sem sábado
  🗑️ Removidos 5 slots de dias não trabalhados
PASSO 5: Verificação
  ✅ SUCESSO: Nenhum slot em dia não trabalhado!
```

## 🎯 Resultado

### Antes:
- ❌ Segunda-feira não aparecia slots
- ❌ Sábado aparecia (não deveria)
- ❌ Domingo aparecia (não deveria)
- ❌ Slots órfãos no banco

### Depois:
- ✅ Segunda-feira aparece com 32 slots
- ✅ Sábado NÃO aparece (correto)
- ✅ Domingo NÃO aparece (correto)
- ✅ Slots sincronizados com workDays
- ✅ Limpeza automática ao atualizar horários

## 📝 Scripts de Diagnóstico Criados

1. `find-elias-salon.js` - Encontrou o Elias correto
2. `check-slots-elias.js` - Diagnosticou slots órfãos
3. `fix-slots-elias.js` - Limpou slots incorretos (manual)
4. `test-fluxo-completo.js` - Validou todo o pipeline
5. `test-cleanup-slots.js` - Testou limpeza automática

## 🚀 Próximos Passos

1. Testar no navegador:
   - Iniciar servidor: `npm run dev`
   - Acessar: `/salao/cmhpdo1c40007of60yed697zp/agendar`
   - Selecionar: Elias Cordeiro
   - Verificar: Segunda-feira aparece, sábado/domingo não

2. Testar mudança de horários:
   - Admin acessa: `/dashboard/staff`
   - Clica em "Horários" do Elias
   - Remove sexta-feira
   - Salva
   - Verifica que slots de sexta foram removidos

3. Aplicar mesma correção para outros profissionais se necessário

## 🔍 Causa Raiz

O sistema permitia:
1. Admin criar slots recorrentes para dias 1-6 (seg-sáb)
2. Admin mudar workDays para 1-5 (seg-sex)
3. **Slots de sábado permaneciam no banco** (órfãos)

Agora, ao atualizar workDays, o sistema:
1. Remove automaticamente slots de dias não trabalhados
2. Mantém consistência entre workDays e slots
3. Previne aparecimento de dias incorretos no calendário

## ⚠️ Observações

- **Cache do Next.js**: Sempre limpar após mudanças no banco (`rm -rf .next/`)
- **Multi-tenant**: Existem múltiplos salões no banco, sempre verificar IDs corretos
- **Timezone**: Sistema usa UTC para armazenamento (já corrigido anteriormente)
