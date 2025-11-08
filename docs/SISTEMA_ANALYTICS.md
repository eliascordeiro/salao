# Sistema de Relatórios e Analytics

## 📊 Visão Geral

Sistema completo de Business Intelligence para o AgendaSalão, permitindo análise de métricas, tendências e desempenho do negócio através de dashboards interativos e relatórios detalhados.

---

## 🎯 Funcionalidades

### 1. **Métricas Principais**
- Total de agendamentos
- Receita total
- Taxa de conclusão
- Taxa de cancelamento
- Crescimento vs período anterior

### 2. **Análises Temporais**
- Agendamentos ao longo do tempo (linha)
- Receita por período (área)
- Comparação entre períodos
- Tendências e projeções

### 3. **Análise de Serviços**
- Ranking de serviços mais populares
- Receita por serviço
- Percentual de participação
- Performance relativa

### 4. **Análise de Status**
- Distribuição de status (pizza)
- Taxa de conversão
- Taxa de abandono
- Agendamentos pendentes

### 5. **Períodos de Análise**
- 7 dias
- 30 dias
- 3 meses
- 1 ano

---

## 🔌 APIs Implementadas

### 1. GET /api/analytics/stats

**Descrição:** Retorna métricas gerais e estatísticas do período selecionado.

**Query Parameters:**
```
?period=7d|30d|3m|1y
```

**Response:**
```json
{
  "period": "30 dias",
  "dateRange": {
    "start": "01/01/2024",
    "end": "30/01/2024"
  },
  "summary": {
    "totalBookings": 150,
    "totalRevenue": 7500.00,
    "completionRate": 85.5,
    "cancellationRate": 8.2,
    "averageBookingValue": 50.00
  },
  "growth": {
    "bookingsGrowth": 15.5,
    "revenueGrowth": 22.3
  },
  "bookingsByStatus": {
    "PENDING": 10,
    "CONFIRMED": 20,
    "COMPLETED": 100,
    "CANCELLED": 15,
    "NO_SHOW": 5
  },
  "bookingsPerDay": [
    { "date": "2024-01-01", "count": 5 },
    ...
  ],
  "comparison": {
    "current": { "bookings": 150, "revenue": 7500 },
    "previous": { "bookings": 130, "revenue": 6150 }
  }
}
```

**Proteção:** ADMIN only

---

### 2. GET /api/analytics/bookings-over-time

**Descrição:** Série temporal de agendamentos com breakdown por status e receita.

**Query Parameters:**
```
?days=30
```

**Response:**
```json
{
  "period": "30 dias",
  "startDate": "01/01/2024",
  "endDate": "30/01/2024",
  "data": [
    {
      "date": "2024-01-01",
      "label": "01/01",
      "fullDate": "01 de janeiro",
      "total": 5,
      "completed": 4,
      "cancelled": 1,
      "pending": 0,
      "confirmed": 0,
      "revenue": 250.00
    },
    ...
  ],
  "totals": {
    "total": 150,
    "completed": 125,
    "cancelled": 15,
    "pending": 5,
    "confirmed": 5,
    "revenue": 7500.00
  }
}
```

**Proteção:** ADMIN only

**Características:**
- Usa `eachDayOfInterval` para garantir todos os dias (sem gaps)
- Formatação PT-BR
- Agregação diária

---

### 3. GET /api/analytics/popular-services

**Descrição:** Ranking de serviços mais populares por número de agendamentos.

**Query Parameters:**
```
?days=30&limit=10
```

**Response:**
```json
{
  "period": "30 dias",
  "data": [
    {
      "serviceId": "abc123",
      "name": "Corte Masculino",
      "category": "Cortes",
      "price": 50.00,
      "duration": 30,
      "bookings": 45,
      "revenue": 2250.00,
      "percentage": 30.0,
      "revenuePercentage": 30.0
    },
    ...
  ],
  "totals": {
    "services": 10,
    "bookings": 150,
    "revenue": 7500.00
  }
}
```

**Proteção:** ADMIN only

**Características:**
- Usa `groupBy` do Prisma
- Calcula percentuais automaticamente
- Ordenação por número de agendamentos

---

### 4. GET /api/analytics/revenue-by-period

**Descrição:** Análise detalhada de receita com agrupamento configurável.

**Query Parameters:**
```
?days=30&groupBy=day|week|month
```

**Response:**
```json
{
  "period": "30 dias",
  "groupBy": "day",
  "startDate": "01/01/2024",
  "endDate": "30/01/2024",
  "data": [
    {
      "date": "2024-01-01",
      "label": "01/01",
      "fullLabel": "01 de janeiro",
      "totalBookings": 5,
      "completedBookings": 4,
      "cancelledBookings": 1,
      "totalRevenue": 250.00,
      "completedRevenue": 200.00,
      "pendingRevenue": 50.00,
      "averageTicket": 50.00
    },
    ...
  ],
  "totals": {
    "bookings": 150,
    "completed": 125,
    "cancelled": 15,
    "totalRevenue": 7500.00,
    "completedRevenue": 6250.00,
    "pendingRevenue": 1250.00,
    "averageTicket": 50.00
  }
}
```

**Proteção:** ADMIN only

**Características:**
- Agrupamento flexível (dia/semana/mês)
- Separa receita completada de pendente
- Calcula ticket médio
- Usa `eachDayOfInterval`, `eachWeekOfInterval`, `eachMonthOfInterval`

---

## 🎨 Componentes React

### 1. BookingsLineChart

**Localização:** `/components/analytics/BookingsLineChart.tsx`

**Props:**
```typescript
interface BookingsLineChartProps {
  days?: number; // Padrão: 30
}
```

**Características:**
- Gráfico de linha com múltiplas séries
- Tooltip personalizado com detalhes
- Loading state com spinner
- Error handling
- 3 linhas: Total, Concluídos, Cancelados

**Uso:**
```tsx
<BookingsLineChart days={30} />
```

---

### 2. ServicesBarChart

**Localização:** `/components/analytics/ServicesBarChart.tsx`

**Props:**
```typescript
interface ServicesBarChartProps {
  days?: number;  // Padrão: 30
  limit?: number; // Padrão: 10
}
```

**Características:**
- Gráfico de barras horizontal
- Labels rotacionados 45°
- Tooltip com detalhes do serviço
- Mostra percentuais
- Height ajustável para labels

**Uso:**
```tsx
<ServicesBarChart days={30} limit={10} />
```

---

### 3. StatusPieChart

**Localização:** `/components/analytics/StatusPieChart.tsx`

**Props:**
```typescript
interface StatusPieChartProps {
  period?: string; // Padrão: "30d"
}
```

**Características:**
- Gráfico de pizza com cores por status
- Labels com percentuais
- Tooltip customizado
- Cores consistentes:
  - PENDING: Amarelo (#fbbf24)
  - CONFIRMED: Azul (#3b82f6)
  - COMPLETED: Verde (#10b981)
  - CANCELLED: Vermelho (#ef4444)
  - NO_SHOW: Cinza (#6b7280)

**Uso:**
```tsx
<StatusPieChart period="30d" />
```

---

### 4. RevenueAreaChart

**Localização:** `/components/analytics/RevenueAreaChart.tsx`

**Props:**
```typescript
interface RevenueAreaChartProps {
  days?: number;                      // Padrão: 30
  groupBy?: "day" | "week" | "month"; // Padrão: "day"
}
```

**Características:**
- Gráfico de área stacked
- 2 áreas: Receita Concluída (verde) + Pendente (amarelo)
- Eixo Y formatado como moeda BRL
- Tooltip com breakdown detalhado
- Ticket médio

**Uso:**
```tsx
<RevenueAreaChart days={90} groupBy="week" />
```

---

## 📄 Página de Relatórios

**Localização:** `/app/dashboard/relatorios/page.tsx`

### Layout

```
┌─────────────────────────────────────────────┐
│ Header + Seletor de Período                 │
├─────────────────────────────────────────────┤
│ [Card 1] [Card 2] [Card 3] [Card 4]        │
│ Agendamentos  Receita  Conclusão  Cancel.   │
├─────────────────────────────────────────────┤
│ [Gráfico Linha]    │ [Gráfico Área]         │
│ Agendamentos       │ Receita                │
├────────────────────┼────────────────────────┤
│ [Gráfico Barras]   │ [Gráfico Pizza]        │
│ Serviços Populares │ Status                 │
├─────────────────────────────────────────────┤
│                [Botão Exportar CSV]         │
└─────────────────────────────────────────────┘
```

### Funcionalidades

1. **Seletor de Período**
   - Botões: 7 dias, 30 dias, 3 meses, 1 ano
   - Estado ativo visual
   - Atualização automática de todos os gráficos

2. **Cards de Métricas**
   - Valor principal em destaque
   - Ícone temático
   - Indicador de crescimento (↑ verde / ↓ vermelho)
   - Percentual vs período anterior

3. **Grid Responsivo**
   - Desktop: 2 colunas
   - Tablet: 1 coluna
   - Mobile: 1 coluna
   - Height fixo de 300px por gráfico

4. **Botão de Exportação**
   - Placeholder para funcionalidade futura
   - Posicionamento à direita
   - Estilo consistente

---

## 🔄 Fluxo de Dados

```
1. Usuário seleciona período
   ↓
2. Estado do React atualizado (setPeriod)
   ↓
3. useEffect dispara em todos os componentes
   ↓
4. Cada componente faz fetch para sua API
   ↓
5. APIs consultam Prisma com filtros de data
   ↓
6. Dados agregados e calculados
   ↓
7. Response retornado em JSON
   ↓
8. Componente processa e renderiza gráfico
   ↓
9. Recharts renderiza visualização
```

---

## 🎯 Padrões de Implementação

### 1. Loading States

Todos os componentes implementam:
```tsx
if (loading) {
  return (
    <div className="h-[300px] flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>
  );
}
```

### 2. Error Handling

```tsx
if (error) {
  return (
    <div className="h-[300px] flex items-center justify-center">
      <p className="text-red-500">{error}</p>
    </div>
  );
}
```

### 3. Empty State

```tsx
if (data.length === 0) {
  return (
    <div className="h-[300px] flex items-center justify-center">
      <p className="text-gray-500">Nenhum dado disponível</p>
    </div>
  );
}
```

### 4. API Protection

Todas as APIs verificam:
```typescript
const session = await getServerSession(authOptions);
if (!session || session.user.role !== "ADMIN") {
  return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
}
```

### 5. Data Fetching

Todos os componentes usam:
```tsx
useEffect(() => {
  async function fetchData() {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/...`);
      if (!response.ok) throw new Error("Erro ao carregar");
      const result = await response.json();
      setData(result.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  fetchData();
}, [dependencies]);
```

---

## 📊 Cálculos Importantes

### Taxa de Conclusão
```typescript
completionRate = (completed / total) * 100
```

### Taxa de Cancelamento
```typescript
cancellationRate = (cancelled / total) * 100
```

### Crescimento Percentual
```typescript
growth = ((current - previous) / previous) * 100
```

### Ticket Médio
```typescript
averageTicket = completedRevenue / completedBookings
```

### Percentual de Participação
```typescript
percentage = (itemCount / totalCount) * 100
```

---

## 🔧 Configurações do Recharts

### ResponsiveContainer
Usado em todos os gráficos:
```tsx
<ResponsiveContainer width="100%" height={300}>
  {/* Chart */}
</ResponsiveContainer>
```

### Margins Padrão
```typescript
margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
```

### Cores do Tema
```typescript
const COLORS = {
  primary: "#8884d8",   // Azul
  success: "#10b981",   // Verde
  warning: "#fbbf24",   // Amarelo
  danger: "#ef4444",    // Vermelho
  info: "#3b82f6",      // Azul claro
  secondary: "#6b7280", // Cinza
};
```

---

## 🧪 Testando o Sistema

### 1. Verificar APIs

```bash
# Stats gerais
curl http://localhost:3000/api/analytics/stats?period=30d

# Série temporal
curl http://localhost:3000/api/analytics/bookings-over-time?days=30

# Serviços populares
curl http://localhost:3000/api/analytics/popular-services?days=30&limit=10

# Receita por período
curl http://localhost:3000/api/analytics/revenue-by-period?days=30&groupBy=day
```

### 2. Acessar Página

```
http://localhost:3000/dashboard/relatorios
```

### 3. Testar Períodos

- Clicar em cada botão de período (7d, 30d, 3m, 1y)
- Verificar se todos os gráficos atualizam
- Conferir indicadores de crescimento

### 4. Verificar Responsividade

- Desktop: 2 colunas de gráficos
- Tablet: 1 coluna
- Mobile: 1 coluna + scroll suave

---

## 📈 Melhorias Futuras

### Fase 1 - Exportação
- [ ] CSV de agendamentos
- [ ] CSV de receita
- [ ] PDF com gráficos
- [ ] Excel com múltiplas abas

### Fase 2 - Dashboard Enhancements
- [ ] Mini sparklines nos cards
- [ ] Lista de agendamentos recentes
- [ ] Top profissional do mês
- [ ] Comparação de performance

### Fase 3 - Análises Avançadas
- [ ] Heatmap de horários populares
- [ ] Análise de profissionais
- [ ] Taxa de retenção de clientes
- [ ] LTV (Lifetime Value)
- [ ] Churn rate

### Fase 4 - Filtros Avançados
- [ ] Filtro por profissional
- [ ] Filtro por serviço
- [ ] Filtro por cliente
- [ ] Comparação entre períodos customizados

### Fase 5 - Alertas
- [ ] Notificar queda de receita
- [ ] Alertar alta taxa de cancelamento
- [ ] Avisar sobre horários ociosos
- [ ] Sugerir otimizações

---

## 🔗 Arquivos Criados

```
app/
├── api/
│   └── analytics/
│       ├── stats/route.ts
│       ├── bookings-over-time/route.ts
│       ├── popular-services/route.ts
│       └── revenue-by-period/route.ts
└── dashboard/
    └── relatorios/
        └── page.tsx

components/
└── analytics/
    ├── BookingsLineChart.tsx
    ├── ServicesBarChart.tsx
    ├── StatusPieChart.tsx
    └── RevenueAreaChart.tsx

docs/
└── SISTEMA_ANALYTICS.md (este arquivo)
```

---

## 💡 Dicas de Uso

1. **Performance**: Cache de 5-15 minutos recomendado para APIs em produção
2. **Mobile**: Gráficos responsivos, mas melhor visualização em desktop/tablet
3. **Períodos Longos**: Use agrupamento por semana/mês para 3m+ dados
4. **Empty States**: Sistema mostra mensagens quando não há dados
5. **Crescimento**: Indicadores verdes (↑) para positivo, vermelhos (↓) para negativo

---

## 📚 Documentação Relacionada

- [Sistema de Notificações](./SISTEMA_NOTIFICACOES.md)
- [Resumo de Notificações](./RESUMO_NOTIFICACOES.md)
- [Instruções do Copilot](../.github/copilot-instructions.md)

---

**Última atualização:** Janeiro 2024  
**Versão:** 1.0.0  
**Status:** ✅ Implementado (APIs + Componentes + Página)
