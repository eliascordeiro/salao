# 📅 Sistema de Navegação por Datas no Caixa

## 🎯 Implementação

Adicionado sistema completo de navegação por datas na **Frente de Caixa**, permitindo visualizar pendentes e histórico de **qualquer dia**.

## ✨ Funcionalidades

### 1. **Navegação por Datas**
```
┌─────────────────────────────────────────────────────────┐
│  [◄ Anterior]   📅 Segunda, 20 de novembro   [Próximo ►] │
│                        2025                               │
│                                    [📅 Hoje]              │
└─────────────────────────────────────────────────────────┘
```

**Recursos:**
- ◄ **Anterior**: Retrocede 1 dia
- **Próximo** ►: Avança 1 dia (desabilitado se for hoje)
- 📅 **Hoje**: Volta para o dia atual (aparece só se não estiver hoje)
- **Data Central**: Exibe data formatada em português

### 2. **Tabs Dinâmicos por Data**
- **Pendentes**: Sessões OPEN da data selecionada
- **Histórico**: Sessões CLOSED (pagas) da data selecionada

### 3. **Recarregamento Automático**
- Ao navegar para outra data, recarrega automaticamente
- Ambas as tabs atualizam com dados da nova data

## 🔧 Mudanças Técnicas

### Frontend (`app/(admin)/dashboard/caixa/page.tsx`)

#### Estado Adicionado
```typescript
const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
```

#### Funções de Navegação
```typescript
const goToPreviousDay = () => {
  setSelectedDate((prev) => subDays(prev, 1));
};

const goToNextDay = () => {
  setSelectedDate((prev) => addDays(prev, 1));
};

const goToToday = () => {
  setSelectedDate(startOfDay(new Date()));
};
```

#### Hook de Atualização
```typescript
useEffect(() => {
  loadAllData(selectedDate);
}, [selectedDate]); // Recarrega quando data muda
```

#### APIs Atualizadas
```typescript
// Agora passam a data como parâmetro
const loadPendingData = async (date: Date) => {
  const dateParam = format(date, "yyyy-MM-dd");
  const response = await fetch(`/api/cashier/daily-bookings?date=${dateParam}`);
  // ...
};

const loadHistoryData = async (date: Date) => {
  const dateParam = format(date, "yyyy-MM-dd");
  const response = await fetch(`/api/cashier/history?date=${dateParam}`);
  // ...
};
```

### Backend

#### API: `/api/cashier/daily-bookings`

**Antes:**
```typescript
export async function GET() {
  const today = new Date();
  const startDate = startOfDay(today);
  // ...
}
```

**Depois:**
```typescript
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get("date");
  
  let targetDate: Date;
  if (dateParam) {
    targetDate = new Date(dateParam); // Usa data passada
  } else {
    targetDate = new Date(); // Default: hoje
  }
  
  const startDate = startOfDay(targetDate);
  const endDate = endOfDay(targetDate);
  // ...
}
```

**Uso:**
- `GET /api/cashier/daily-bookings` → Retorna hoje
- `GET /api/cashier/daily-bookings?date=2025-11-19` → Retorna dia 19

#### API: `/api/cashier/history`

Mesma lógica aplicada:
```typescript
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get("date");
  
  let targetDate: Date = dateParam ? new Date(dateParam) : new Date();
  // ...
}
```

## 🎨 Interface

### Card de Navegação
```tsx
<GlassCard className="p-4">
  <div className="flex items-center justify-between gap-4">
    {/* Botão Anterior */}
    <Button onClick={goToPreviousDay}>
      <ChevronLeft /> Anterior
    </Button>

    {/* Data Central */}
    <div className="text-center">
      <Calendar className="text-primary" />
      <p className="font-bold">
        {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
      </p>
      <p className="text-xs">{format(selectedDate, "yyyy")}</p>
    </div>

    {/* Botão Próximo (desabilitado se for hoje) */}
    <Button onClick={goToNextDay} disabled={isToday(selectedDate)}>
      Próximo <ChevronRight />
    </Button>

    {/* Botão Hoje (só aparece se não for hoje) */}
    {!isToday(selectedDate) && (
      <Button onClick={goToToday}>
        <Calendar /> Hoje
      </Button>
    )}
  </div>
</GlassCard>
```

## 📊 Fluxo de Uso

### Cenário 1: Visualizar Ontem
```
1. Usuário clica "◄ Anterior"
2. selectedDate = hoje - 1 dia
3. useEffect detecta mudança
4. Chama loadAllData(selectedDate)
5. APIs recebem date=2025-11-19
6. Retornam dados de 19/11
7. Tabs atualizam com dados corretos
```

### Cenário 2: Voltar para Hoje
```
1. Usuário navegou para dias passados
2. Clica botão "📅 Hoje"
3. selectedDate = startOfDay(new Date())
4. useEffect recarrega
5. APIs sem parâmetro date (usa hoje)
6. Mostra dados de hoje
7. Botão "Hoje" desaparece
8. Botão "Próximo" fica disabled
```

### Cenário 3: Navegar Semana Passada
```
1. Clicar "◄ Anterior" 7 vezes
2. Chega em 13/11/2025
3. Ver pendentes e histórico de 13/11
4. Clicar "📅 Hoje" para voltar
```

## 🔍 Casos de Uso

### 1. **Auditar Pagamentos Passados**
- Ir para data específica
- Ver aba "Histórico"
- Verificar todos os pagamentos recebidos naquele dia

### 2. **Pendências Antigas**
- Navegar para dias anteriores
- Ver aba "Pendentes"
- Identificar sessões que ficaram abertas

### 3. **Comparar Movimento**
- Navegar entre dias
- Comparar quantidade de atendimentos
- Analisar receita por dia

### 4. **Conferência de Caixa**
- Selecionar data do fechamento
- Ver histórico completo
- Validar valores recebidos

## 🎯 Melhorias Futuras

### Curto Prazo
- [ ] Input de data (date picker) para pular direto para data específica
- [ ] Atalhos: "Ontem", "Semana Passada"
- [ ] Indicador visual de dias com movimento vs sem movimento

### Médio Prazo
- [ ] Visualização de calendário mensal
- [ ] Marcar dias com pendências não pagas
- [ ] Exportar relatório por período (data inicial → data final)

### Longo Prazo
- [ ] Comparação entre duas datas
- [ ] Gráfico de evolução semanal/mensal
- [ ] Filtros avançados (por profissional, serviço)

## 📝 Notas Técnicas

### Timezone
Usando `startOfDay()` e `endOfDay()` do `date-fns` para garantir consistência:
```typescript
startOfDay(new Date("2025-11-20")) // 2025-11-20 00:00:00
endOfDay(new Date("2025-11-20"))   // 2025-11-20 23:59:59.999
```

### Formato de Data
- **Frontend → Backend**: `yyyy-MM-dd` (ISO)
- **Display**: `EEEE, dd 'de' MMMM` (português)
- **Ano**: Exibido separado em texto menor

### Performance
- Cada mudança de data faz 2 requests (pending + history)
- Usar `Promise.all()` para paralelizar
- Cache poderia ser implementado futuramente

### Acessibilidade
- Botões com texto descritivo
- Desabilitar "Próximo" quando for hoje (evita navegar para futuro)
- Mostrar "Hoje" apenas quando necessário (reduz clutter)

## ✅ Status

**Implementação:** ✅ Completa  
**APIs Atualizadas:** ✅ Sim  
**Interface:** ✅ Funcional  
**Documentação:** ✅ Completa  

---

**Data:** 20/11/2025  
**Versão:** 1.0.0
