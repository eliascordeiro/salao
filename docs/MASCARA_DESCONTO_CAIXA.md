# Máscara de Moeda no Campo de Desconto - Caixa

## 📋 Resumo da Implementação

Implementação de máscara de entrada de moeda brasileira (BRL) no campo de desconto do modal "Fechar Conta" no módulo de Caixa.

## 🎯 Objetivo

Melhorar a experiência do usuário ao inserir valores de desconto, exibindo formatação em tempo real no padrão brasileiro: **R$ 1.234,56**

## ✅ Mudanças Realizadas

### 1. Funções de Formatação (Linhas 82-104)

```typescript
function formatCurrencyInput(value: string): string {
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, '');
  
  if (!numbers) return '';
  
  // Converte para número com 2 casas decimais
  const amount = parseInt(numbers) / 100;
  
  // Formata no padrão brasileiro
  return amount.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function parseCurrencyInput(formatted: string): number {
  if (!formatted) return 0;
  
  // Remove pontos (separador de milhar) e substitui vírgula por ponto
  const cleaned = formatted.replace(/\./g, '').replace(',', '.');
  const value = parseFloat(cleaned);
  
  return isNaN(value) ? 0 : value;
}
```

**Como funciona:**
- `formatCurrencyInput`: Recebe entrada do usuário → Remove caracteres não-numéricos → Divide por 100 para casas decimais → Formata em pt-BR
- `parseCurrencyInput`: Recebe string formatada → Remove separadores → Converte para número

### 2. Novo State para Display (Linha 121)

```typescript
const [discountDisplay, setDiscountDisplay] = useState('');
```

**Motivo:** Separar valor visual (formatado) do valor numérico (cálculos)

### 3. Reset no Modal (Linha 235)

```typescript
const handleOpenCheckout = (client: Client) => {
  setSelectedClient(client);
  setDiscount(0);
  setDiscountDisplay(''); // ← NOVO
  setPaymentMethod("");
  // ...
};
```

### 4. Input com Máscara (Linhas 890-917)

```tsx
<div className="relative">
  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
    R$
  </span>
  <Input
    id="discount"
    type="text"
    inputMode="decimal"
    value={discountDisplay}
    onChange={(e) => {
      const formatted = formatCurrencyInput(e.target.value);
      setDiscountDisplay(formatted);
      const numericValue = parseCurrencyInput(formatted);
      setDiscount(numericValue);
    }}
    placeholder="0,00"
    className="h-11 text-base pl-10"
  />
</div>
```

**Mudanças principais:**
- ✅ `type="number"` → `type="text"` (melhor controle de formatação)
- ✅ `inputMode="decimal"` (teclado numérico no mobile)
- ✅ Prefixo "R$" posicionado absolutamente
- ✅ `pl-10` para dar espaço ao prefixo
- ✅ Placeholder mudou de "0.00" para "0,00" (padrão BR)
- ✅ `onChange` agora formata e parseia o valor
- ✅ Ícone de alerta adicionado à mensagem de erro

## 🎨 Experiência do Usuário

### Antes:
```
Campo: [ 150.50 ]  ← type="number", com spinner buttons
```

### Depois:
```
Campo: [ R$ 150,50 ]  ← type="text", formatação automática
```

### Exemplos de Uso:

| Usuário Digita | Display Mostra | Valor Armazenado |
|----------------|----------------|------------------|
| `1` | `0,01` | `0.01` |
| `10` | `0,10` | `0.10` |
| `100` | `1,00` | `1.00` |
| `1000` | `10,00` | `10.00` |
| `10000` | `100,00` | `100.00` |
| `123456` | `1.234,56` | `1234.56` |

## 🔍 Validação

A validação existente foi mantida:

```tsx
{discount > getSelectedSubtotal() && (
  <p className="text-xs text-destructive flex items-center gap-1">
    <AlertCircle className="w-3 h-3" />
    Desconto não pode ser maior que o subtotal
  </p>
)}
```

## 📱 Responsividade

- ✅ Touch-friendly: `h-11` (44px - WCAG 2.1 compliant)
- ✅ Texto legível: `text-base` (16px)
- ✅ Teclado numérico mobile: `inputMode="decimal"`
- ✅ Prefixo R$ não interfere na digitação

## 🧪 Como Testar

1. Acesse `/dashboard/caixa`
2. Selecione uma data com agendamentos pendentes
3. Clique em "Fechar Conta" em um cliente
4. No campo "Desconto (R$)":
   - Digite `15000` → Deve mostrar `150,00`
   - Digite `1234567` → Deve mostrar `12.345,67`
   - Apague com backspace → Deve remover dígitos naturalmente
   - Tente digitar letras → Deve ignorar
5. Insira desconto maior que subtotal → Deve exibir erro

## 💡 Vantagens da Solução

### ✅ Sem Dependências Externas
- Não instalou bibliotecas adicionais
- Código leve e customizado
- Mantém bundle size reduzido

### ✅ Padrão Brasileiro
- Separador de milhar: **ponto** (.)
- Separador decimal: **vírgula** (,)
- Sempre 2 casas decimais

### ✅ Performance
- Funções simples e rápidas
- Conversão instantânea
- Sem re-renders desnecessários

### ✅ Acessibilidade
- `inputMode="decimal"` (teclado otimizado)
- Labels descritivos mantidos
- Mensagens de erro claras

## 🔧 Manutenção Futura

Se precisar ajustar a formatação, modifique a função `formatCurrencyInput`:

```typescript
// Para mudar formato (ex: US)
return amount.toLocaleString('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

// Para adicionar símbolo no formato
return amount.toLocaleString('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});
```

## 📝 Arquivos Modificados

```
app/(admin)/dashboard/caixa/page.tsx
├── Funções auxiliares adicionadas (linhas 82-104)
├── State discountDisplay adicionado (linha 121)
├── handleOpenCheckout atualizado (linha 235)
└── Input de desconto substituído (linhas 890-917)
```

## 🎯 Resultado Final

Campo de desconto agora exibe valores no formato brasileiro em tempo real, tornando a entrada de dados mais intuitiva e profissional, sem necessidade de bibliotecas externas.

**Exemplo visual:**
```
┌─────────────────────────────────────┐
│ Desconto (R$)                       │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ R$ 150,00                   │   │
│  └─────────────────────────────┘   │
│                                     │
│  ✓ Formatação automática            │
│  ✓ Padrão brasileiro                │
│  ✓ Teclado numérico mobile          │
└─────────────────────────────────────┘
```

---

**Status:** ✅ Implementado e testado
**Data:** Dezembro 2024
**Compatibilidade:** Todos navegadores modernos + mobile
