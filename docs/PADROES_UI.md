# 🎨 Padrões de UI/UX do Sistema

## 📋 Visão Geral

Este documento define os padrões visuais e de interação para todos os componentes do sistema de agendamento.

---

## 🎯 Filosofia de Design

### Railway-Inspired Glassmorphism
- **Inspiração**: Interface do Railway.app
- **Estilo**: Glassmorphism suave com profundidade
- **Tema**: Suporte completo a dark/light mode
- **Cores**: CSS variables para máxima flexibilidade

---

## 🎨 Sistema de Cores

### CSS Variables (Tema)
```css
--foreground          /* Texto principal */
--background          /* Fundo principal */
--background-alt      /* Fundo alternativo */
--primary             /* Cor primária/accent */
--border              /* Bordas */
--muted-foreground    /* Texto secundário */
--foreground-muted    /* Texto desativado */
--destructive         /* Erros/delete */
--success             /* Sucesso */
```

### Aplicação
- **SEMPRE** use variáveis de tema
- **NUNCA** use cores fixas (white, gray-300, etc)
- Exceção: gradientes especiais no hero

---

## 📝 Componentes de Input

### Padrão Base (Input Component)
```tsx
<Input
  className="glass-card bg-background-alt/50 border-primary/20 focus:border-primary text-foreground"
/>
```

**Classes Explicadas:**
- `glass-card`: Efeito glassmorphism
- `bg-background-alt/50`: Fundo semi-transparente
- `border-primary/20`: Borda sutil na cor primária
- `focus:border-primary`: Borda destacada no foco
- `text-foreground`: Texto visível no tema

### Input Nativo (textarea, select customizado)
```tsx
<textarea
  className="w-full px-4 py-3 rounded-xl border glass-card bg-background-alt/50 border-primary/20 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-foreground-muted/50"
/>
```

### Input com Erro
```tsx
<Input
  className={`glass-card bg-background-alt/50 border-primary/20 focus:border-primary text-foreground ${
    errors.field ? "border-destructive" : ""
  }`}
/>
```

---

## 🔘 Botões

### Botão Primário
```tsx
<Button className="bg-primary text-white hover:bg-primary/90">
  Ação Principal
</Button>
```

### Botão Secundário
```tsx
<Button variant="outline" className="border-border text-foreground">
  Ação Secundária
</Button>
```

### Botão Destrutivo
```tsx
<Button variant="destructive">
  Excluir
</Button>
```

---

## 📦 Cards

### Card Base
```tsx
<div className="glass-card border-primary/20 rounded-lg p-6 bg-background-alt/30">
  {/* Conteúdo */}
</div>
```

### Card com Hover
```tsx
<div className="glass-card border-primary/20 rounded-lg p-6 bg-background-alt/30 hover:border-primary/50 transition-all">
  {/* Conteúdo */}
</div>
```

---

## 🏷️ Labels & Typography

### Label de Input
```tsx
<Label htmlFor="field" className="text-foreground">
  Nome do Campo
</Label>
```

### Título de Seção
```tsx
<h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
  <Icon className="h-5 w-5 text-primary" />
  Título da Seção
</h2>
```

### Texto Secundário
```tsx
<p className="text-sm text-foreground-muted">
  Descrição ou hint
</p>
```

---

## 🎭 Estados Visuais

### Loading State
```tsx
{loading && <Loader className="h-5 w-5 animate-spin" />}
```

### Empty State
```tsx
<div className="text-center py-12">
  <Icon className="h-12 w-12 mx-auto text-foreground-muted mb-4" />
  <p className="text-foreground-muted">Nenhum item encontrado</p>
</div>
```

### Error State
```tsx
<div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
  <p className="text-destructive text-sm">{error}</p>
</div>
```

### Success State
```tsx
<div className="bg-success/10 border border-success/30 rounded-lg p-4">
  <p className="text-success text-sm">{message}</p>
</div>
```

---

## 🎯 Badges & Tags

### Badge de Status (Ativo)
```tsx
<span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-success/10 text-success">
  Ativo
</span>
```

### Badge de Status (Inativo)
```tsx
<span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-destructive/10 text-destructive">
  Inativo
</span>
```

### Tag Informativa
```tsx
<span className="text-xs glass-card bg-background-alt/50 px-2 py-1 rounded-md text-foreground-muted">
  Info
</span>
```

---

## 🎨 Gradientes Especiais

### Hero Gradient (Landing Page)
```tsx
<div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600">
  {/* Conteúdo */}
</div>
```

**Nota**: Único lugar permitido usar cores fixas

---

## ♿ Acessibilidade

### Contraste
- Texto principal: mínimo 4.5:1
- Texto grande: mínimo 3:1
- Bordas interativas: 3:1

### Foco
- Todos os elementos interativos devem ter estado de foco visível
- Usar `focus:ring-2 focus:ring-primary`

### Labels
- Sempre associar label ao input com `htmlFor`
- Usar `aria-label` quando label visual não for possível

---

## 📱 Responsividade

### Breakpoints
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

### Grid Responsivo
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Cards */}
</div>
```

---

## 🚫 Práticas Proibidas

### ❌ Cores Fixas em Inputs
```tsx
/* ERRADO */
<Input className="bg-white border-gray-300 text-black" />

/* CERTO */
<Input className="glass-card bg-background-alt/50 border-primary/20 text-foreground" />
```

### ❌ Bordas Sem Tema
```tsx
/* ERRADO */
<div className="border-gray-200">

/* CERTO */
<div className="border-border">
```

### ❌ Texto Sem Tema
```tsx
/* ERRADO */
<p className="text-gray-600">

/* CERTO */
<p className="text-foreground-muted">
```

---

## ✅ Checklist de Componente

Antes de criar/modificar um componente, verifique:

- [ ] Usa CSS variables do tema
- [ ] Funciona em dark mode
- [ ] Funciona em light mode
- [ ] Estados de hover/focus definidos
- [ ] Acessível (foco, contraste, labels)
- [ ] Responsivo (mobile, tablet, desktop)
- [ ] Consistente com padrão glass-card
- [ ] Loading/error/empty states implementados

---

## 🔄 Atualizações

**Última atualização**: 7 de novembro de 2025

**Mantido por**: Equipe de Desenvolvimento

**Revisar**: A cada nova funcionalidade major

---

## 📚 Referências

- [Tailwind CSS](https://tailwindcss.com/)
- [Railway Design System](https://railway.app/)
- [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/)
