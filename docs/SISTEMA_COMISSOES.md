# 💰 Sistema de Comissões - Documentação Completa

## 📋 Visão Geral

O Sistema de Comissões permite configurar e gerenciar comissões para profissionais de forma flexível, com cálculo automático baseado nos serviços prestados.

## 🎯 Funcionalidades

### 1. **Tipos de Comissão**
- **Percentual**: Comissão baseada em porcentagem do valor do serviço
  - Exemplo: 40% de R$ 50,00 = R$ 20,00
- **Valor Fixo**: Comissão com valor fixo independente do preço
  - Exemplo: R$ 15,00 por serviço
- **Misto**: Combinação de valor fixo + percentual
  - Exemplo: R$ 10,00 + 20% de R$ 50,00 = R$ 20,00

### 2. **Configuração em Dois Níveis**
- **Comissão Padrão**: Aplicada a todos os serviços do profissional
- **Comissões Específicas**: Sobrescrevem a padrão para serviços específicos

### 3. **Gestão de Pagamentos**
- Status: Pendente, Pago, Cancelado
- Registro de data e método de pagamento
- Integração automática com despesas

## 🚀 Como Usar

### Configurar Comissão de um Profissional

1. Acesse **Dashboard → Profissionais**
2. Clique no botão **"Comissão"** do profissional desejado
3. Configure a **Comissão Padrão**:
   - Escolha o tipo (Percentual, Fixo ou Misto)
   - Defina os valores
   - Veja o exemplo de cálculo em tempo real

4. (Opcional) Adicione **Comissões Específicas**:
   - Clique em "+ Adicionar"
   - Selecione o serviço
   - Configure tipo e valores específicos
   - O cálculo específico sobrescreve o padrão

5. Clique em **"Salvar Configuração"**

### Visualizar e Gerenciar Comissões

1. Acesse **Dashboard → Comissões**
2. Visualize os cards de resumo:
   - **Pendentes**: Comissões aguardando pagamento
   - **Pagas**: Comissões já quitadas
   - **Total**: Soma de todas as comissões

3. Use os filtros para refinar a busca:
   - Por status (Pendente/Pago/Cancelado)
   - Por profissional
   - Por período de data

4. Para marcar como paga:
   - Clique em "Marcar como Pago"
   - Selecione o método de pagamento
   - Confirme

### Cálculo Automático

As comissões são calculadas automaticamente quando você:
- Fecha um agendamento no caixa
- O sistema busca a configuração do profissional
- Usa override específico se existir, senão usa a padrão
- Cria o registro de comissão com status PENDENTE

## 🔧 Estrutura Técnica

### Models do Banco de Dados

#### StaffCommissionConfig
```prisma
model StaffCommissionConfig {
  id              String         @id @default(cuid())
  staffId         String         @unique
  commissionType  CommissionType @default(PERCENTAGE)
  percentageValue Float?
  fixedValue      Float?
  serviceOverrides ServiceCommissionConfig[]
}
```

#### ServiceCommissionConfig
```prisma
model ServiceCommissionConfig {
  id              String         @id @default(cuid())
  staffConfigId   String
  serviceId       String
  commissionType  CommissionType
  percentageValue Float?
  fixedValue      Float?
  
  @@unique([staffConfigId, serviceId])
}
```

#### Commission
```prisma
model Commission {
  id              String           @id @default(cuid())
  bookingId       String
  staffId         String
  salonId         String
  serviceId       String
  servicePrice    Float
  commissionType  CommissionType
  percentageValue Float?
  fixedValue      Float?
  calculatedValue Float
  status          CommissionStatus @default(PENDING)
  paidAt          DateTime?
  paymentMethod   String?
}
```

### Enums

#### CommissionType
- `PERCENTAGE`: Comissão percentual
- `FIXED`: Comissão fixa
- `MIXED`: Comissão mista (fixo + percentual)

#### CommissionStatus
- `PENDING`: Aguardando pagamento
- `PAID`: Paga ao profissional
- `CANCELLED`: Cancelada

### APIs Disponíveis

#### GET /api/commissions/config
Obter configuração de comissão de um profissional
```typescript
Query params: { staffId: string }
Response: StaffCommissionConfig | null
```

#### POST /api/commissions/config
Criar/atualizar configuração de comissão
```typescript
Body: {
  staffId: string
  commissionType: "PERCENTAGE" | "FIXED" | "MIXED"
  percentageValue?: number
  fixedValue?: number
  serviceOverrides?: Array<{
    serviceId: string
    commissionType: "PERCENTAGE" | "FIXED" | "MIXED"
    percentageValue?: number
    fixedValue?: number
  }>
}
```

#### DELETE /api/commissions/config
Remover configuração de comissão
```typescript
Query params: { staffId: string }
```

#### GET /api/commissions
Listar comissões com filtros
```typescript
Query params: {
  status?: "PENDING" | "PAID" | "CANCELLED"
  staffId?: string
  startDate?: string (ISO)
  endDate?: string (ISO)
}
Response: {
  commissions: Commission[]
  totals: {
    pending: number
    paid: number
    total: number
  }
}
```

#### POST /api/commissions
Calcular comissão para um agendamento
```typescript
Body: { bookingId: string }
Response: Commission
```

#### PATCH /api/commissions/[id]
Atualizar status de comissão
```typescript
Body: {
  status: "PENDING" | "PAID" | "CANCELLED"
  paymentMethod?: string
  notes?: string
}
```

## 💡 Exemplos de Uso

### Exemplo 1: Barbeiro com 40% de comissão

**Configuração:**
- Tipo: Percentual
- Valor: 40%

**Cálculo:**
- Corte de cabelo: R$ 50,00
- Comissão: R$ 50,00 × 40% = **R$ 20,00**

### Exemplo 2: Manicure com valor fixo

**Configuração:**
- Tipo: Valor Fixo
- Valor: R$ 15,00

**Cálculo:**
- Manicure simples: R$ 30,00 → Comissão: **R$ 15,00**
- Manicure completa: R$ 60,00 → Comissão: **R$ 15,00**

### Exemplo 3: Profissional com comissão mista

**Configuração:**
- Tipo: Misto
- Fixo: R$ 10,00
- Percentual: 20%

**Cálculo:**
- Serviço: R$ 100,00
- Comissão: R$ 10,00 + (R$ 100,00 × 20%) = R$ 10,00 + R$ 20,00 = **R$ 30,00**

### Exemplo 4: Configuração específica por serviço

**Comissão Padrão:**
- Tipo: Percentual 30%

**Override para "Coloração":**
- Tipo: Percentual 50%

**Cálculo:**
- Corte: R$ 50,00 → 30% = **R$ 15,00** (usa padrão)
- Coloração: R$ 200,00 → 50% = **R$ 100,00** (usa override)

## 📊 Integração com Despesas

Quando uma comissão é marcada como **PAID**:
1. Sistema cria automaticamente uma despesa
2. Categoria: **SALARIES** (Salários)
3. Valor: Valor da comissão calculada
4. Status: **PAID**
5. Descrição: "Comissão - [Nome do Profissional] - [Nome do Serviço]"

Isso mantém o controle financeiro completo e permite análise de custos.

## ⚙️ Fluxo Completo

```
1. CONFIGURAÇÃO
   └─> Admin configura comissão do profissional
       └─> Salva configuração padrão
       └─> (Opcional) Salva overrides por serviço

2. ATENDIMENTO
   └─> Cliente agenda serviço
       └─> Profissional realiza atendimento
       └─> Status muda para COMPLETED

3. CÁLCULO (Automático)
   └─> Sistema detecta agendamento completo
       └─> Busca configuração do profissional
       └─> Verifica se há override para o serviço
       └─> Calcula comissão
       └─> Cria registro com status PENDING

4. PAGAMENTO
   └─> Admin acessa Dashboard → Comissões
       └─> Visualiza comissões pendentes
       └─> Seleciona comissão
       └─> Clica "Marcar como Pago"
       └─> Escolhe método de pagamento
       └─> Sistema:
           ├─> Atualiza status para PAID
           ├─> Registra data e método
           └─> Cria despesa automática
```

## 🎨 Interface

### Tela de Configuração
- **Localização**: Dashboard → Profissionais → [Nome] → Botão "Comissão"
- **Componentes**:
  - Seletor de tipo (3 botões visuais)
  - Campos de entrada para valores
  - Calculadora de exemplo em tempo real
  - Seção de overrides específicos
  - Botões de ação (Salvar/Remover)

### Tela de Gestão
- **Localização**: Dashboard → Comissões (menu lateral)
- **Componentes**:
  - Cards de resumo (Pendentes/Pagas/Total)
  - Filtros (Status, Profissional, Período)
  - Lista de comissões com detalhes
  - Botões de ação por comissão

## 🔐 Permissões

- **Visualizar Comissões**: Requer permissão `financial.view`
- **Configurar Comissões**: Requer permissão `financial.view`
- **Marcar como Pago**: Requer permissão `financial.view`

## 📈 Relatórios

O sistema de comissões se integra com:
- **Análise Financeira**: Comissões pagas aparecem como despesas
- **Despesas por Categoria**: Categoria "SALARIES"
- **Dashboard Principal**: Métricas de comissões pendentes

## 🛠️ Manutenção

### Recalcular Comissões
Se necessário recalcular uma comissão:
1. Cancele a comissão existente
2. Use a API POST /api/commissions com o bookingId

### Corrigir Configuração
Para corrigir erro na configuração:
1. Acesse a tela de configuração
2. Ajuste os valores
3. Salve
4. As novas comissões usarão a configuração atualizada
5. Comissões antigas mantêm valores originais

## 📝 Notas Importantes

1. **Comissões são calculadas com base no valor do agendamento**, não do serviço base
2. **Overrides específicos têm prioridade** sobre a configuração padrão
3. **Comissões pagas não podem ser deletadas**, apenas canceladas
4. **Cancelamento de agendamento** não cancela a comissão automaticamente
5. **Despesas criadas automaticamente** facilitam controle financeiro

## 🎯 Próximas Melhorias Sugeridas

- [ ] Relatório detalhado de comissões por profissional
- [ ] Exportação de comissões para Excel/PDF
- [ ] Notificações automáticas de comissões pendentes
- [ ] Dashboard do profissional para visualizar suas comissões
- [ ] Integração com folha de pagamento
- [ ] Histórico de alterações de configuração
- [ ] Comissões por faixa de valor (ex: até R$ 100 = 30%, acima = 40%)

---

**Versão**: 1.0.0  
**Data**: Dezembro 2024  
**Autor**: Sistema AgendaSalão
