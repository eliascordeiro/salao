# 🎨 Railway Theme - Guia Rápido

> Referência rápida para desenvolvimento com o Tema Railway

## 🎯 Imports Essenciais

```tsx
import { GlassCard } from "@/components/ui/glass-card";
import { GradientButton } from "@/components/ui/gradient-button";
import { AnimatedText } from "@/components/ui/animated-text";
import { GridBackground } from "@/components/ui/grid-background";
```

---

## 🎨 Cores Principais

```tsx
// Background
className="bg-background"          // #0D0D0D
className="bg-background-alt"      // #141414

// Text
className="text-foreground"        // #F2F2F2
className="text-foreground-muted"  // #999999

// Colors
className="text-primary"           // Roxo #7C3AED
className="text-accent"            // Rosa #E63A8E
className="text-success"           // Verde #33CC66
className="text-warning"           // Amarelo #FFB020
className="text-error"             // Vermelho #DD3344
```

---

## 🧩 Componentes

### GlassCard

```tsx
// Básico
<GlassCard className="p-6">
  Conteúdo
</GlassCard>

// Com hover
<GlassCard hover className="p-6">
  Conteúdo
</GlassCard>

// Com glow
<GlassCard glow="primary" className="p-6">
  Conteúdo
</GlassCard>

// Completo
<GlassCard 
  hover 
  glow="primary" 
  className="p-8 animate-fadeInUp"
  style={{ animationDelay: "200ms" }}
>
  Conteúdo
</GlassCard>
```

### GradientButton

```tsx
// Primary (Roxo → Azul)
<GradientButton variant="primary">
  Texto
</GradientButton>

// Accent (Rosa → Laranja)
<GradientButton variant="accent">
  Texto
</GradientButton>

// Success (Verde → Ciano)
<GradientButton variant="success">
  Texto
</GradientButton>

// Com ícones e animação
<GradientButton variant="primary" className="group">
  <Check className="h-5 w-5 mr-2" />
  Confirmar
  <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
</GradientButton>
```

### AnimatedText

```tsx
// Primary gradient (Roxo → Azul)
<h1 className="text-4xl font-bold">
  <AnimatedText gradient="primary">
    Título Animado
  </AnimatedText>
</h1>

// Accent gradient (Rosa → Laranja)
<AnimatedText gradient="accent">
  Texto com Gradiente
</AnimatedText>

// Sem gradiente
<AnimatedText gradient="none">
  Texto Normal
</AnimatedText>
```

### GridBackground

```tsx
<GridBackground>
  <div className="container mx-auto px-4 py-12">
    {/* Conteúdo da página */}
  </div>
</GridBackground>
```

---

## 🎬 Animações

```tsx
// Fade In Up (padrão)
<div className="animate-fadeInUp">
  Conteúdo
</div>

// Com delay
<div 
  className="animate-fadeInUp" 
  style={{ animationDelay: "200ms" }}
>
  Conteúdo
</div>

// Pulse Glow (loading)
<Sparkles className="h-12 w-12 text-primary animate-pulseGlow" />

// Float (ícones)
<div className="animate-float">
  Ícone flutuante
</div>

// Scale In
<div className="animate-scaleIn">
  Conteúdo
</div>

// Slide In Left
<div className="animate-slideInLeft">
  Conteúdo
</div>
```

---

## 🎨 Padrões Comuns

### Header de Página

```tsx
<div className="mb-8 animate-fadeInUp">
  <h1 className="text-4xl font-bold text-foreground mb-2">
    <AnimatedText gradient="primary">
      Título da Página
    </AnimatedText>
  </h1>
  <p className="text-foreground-muted text-lg">
    Descrição da página
  </p>
</div>
```

### Card com Ícone

```tsx
<GlassCard hover glow="primary" className="p-6">
  <div className="flex items-center gap-4">
    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
      <Calendar className="h-6 w-6 text-primary" />
    </div>
    <div>
      <h3 className="text-lg font-bold text-foreground">Título</h3>
      <p className="text-foreground-muted">Descrição</p>
    </div>
  </div>
</GlassCard>
```

### Loading State

```tsx
<div className="text-center py-16">
  <div className="animate-pulseGlow inline-block">
    <Sparkles className="h-12 w-12 text-primary mx-auto mb-4" />
    <p className="text-foreground-muted text-lg">Carregando...</p>
  </div>
</div>
```

### Empty State

```tsx
<GlassCard className="py-20 text-center">
  <Calendar className="h-16 w-16 text-foreground-muted mx-auto mb-6 opacity-50" />
  <h3 className="text-2xl font-bold text-foreground mb-3">
    Nenhum item encontrado
  </h3>
  <p className="text-foreground-muted mb-8">
    Descrição do estado vazio
  </p>
  <GradientButton variant="primary">
    Ação Principal
  </GradientButton>
</GlassCard>
```

### Grid de Cards

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {items.map((item, index) => (
    <GlassCard 
      key={item.id}
      hover 
      glow="primary"
      className="p-6 animate-fadeInUp"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Conteúdo do card */}
    </GlassCard>
  ))}
</div>
```

### Badge de Status

```tsx
// Success
<span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-success/20 text-success border border-success/30">
  ✓ Confirmado
</span>

// Warning
<span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-warning/20 text-warning border border-warning/30">
  ⏱ Pendente
</span>

// Error
<span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-error/20 text-error border border-error/30">
  ✗ Cancelado
</span>
```

### Info Section com Ícone

```tsx
<div className="flex items-start gap-4">
  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
    <Calendar className="h-6 w-6 text-primary" />
  </div>
  <div>
    <p className="text-sm font-medium text-foreground-muted uppercase tracking-wide mb-1">
      Label
    </p>
    <p className="text-xl font-bold text-foreground">
      Valor
    </p>
  </div>
</div>
```

### Botão Secundário (Outline)

```tsx
<button className="px-6 py-3 rounded-xl border-2 border-primary text-primary font-medium hover:bg-primary/10 transition-all">
  Ação Secundária
</button>
```

### Link de Volta

```tsx
<Link
  href="/pagina-anterior"
  className="group inline-flex items-center gap-2 text-sm text-foreground-muted hover:text-primary mb-4 transition-colors"
>
  <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
  Voltar
</Link>
```

---

## 📱 Responsividade

### Padding Responsivo
```tsx
className="px-4 sm:px-6 lg:px-8 py-8 lg:py-12"
```

### Grid Responsivo
```tsx
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
```

### Texto Responsivo
```tsx
className="text-2xl sm:text-3xl lg:text-4xl"
```

### Flex Direction
```tsx
className="flex flex-col lg:flex-row gap-6"
```

### Hidden/Visible
```tsx
className="hidden sm:block"  // Esconde em mobile
className="block sm:hidden"  // Mostra apenas em mobile
```

---

## 🎨 Backgrounds Coloridos

### Ícones com Background

```tsx
// Primary
<div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
  <Icon className="h-6 w-6 text-primary" />
</div>

// Accent
<div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
  <Icon className="h-6 w-6 text-accent" />
</div>

// Success
<div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center">
  <Icon className="h-6 w-6 text-success" />
</div>
```

### Card com Gradiente (Selecionado)

```tsx
<div className={`p-6 rounded-xl cursor-pointer transition-all ${
  selected 
    ? "bg-gradient-primary glow-primary" 
    : "bg-background-alt border border-border hover:border-primary"
}`}>
  Conteúdo
</div>
```

---

## 🎯 Classes Utility Customizadas

```css
/* Glow Effects */
.glow-primary    /* Brilho roxo */
.glow-accent     /* Brilho rosa */
.glow-success    /* Brilho verde */
.glow-error      /* Brilho vermelho */

/* Backgrounds com Gradiente */
.bg-gradient-primary   /* Roxo → Azul */
.bg-gradient-accent    /* Rosa → Laranja */
.bg-gradient-success   /* Verde → Ciano */

/* Glass Effect */
.glass-card      /* Glassmorphism completo */
```

---

## 📦 Template de Página

```tsx
import { GlassCard } from "@/components/ui/glass-card";
import { GradientButton } from "@/components/ui/gradient-button";
import { AnimatedText } from "@/components/ui/animated-text";
import { GridBackground } from "@/components/ui/grid-background";

export default function MinhaPage() {
  return (
    <div className="min-h-screen bg-background">
      <GridBackground>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          
          {/* Header */}
          <div className="mb-8 animate-fadeInUp">
            <h1 className="text-4xl font-bold text-foreground mb-2">
              <AnimatedText gradient="primary">
                Título
              </AnimatedText>
            </h1>
            <p className="text-foreground-muted text-lg">
              Descrição
            </p>
          </div>

          {/* Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GlassCard 
              hover 
              glow="primary" 
              className="p-8 animate-fadeInUp"
              style={{ animationDelay: "200ms" }}
            >
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Card 1
              </h2>
              <p className="text-foreground-muted mb-6">
                Conteúdo...
              </p>
              <GradientButton variant="primary">
                Ação
              </GradientButton>
            </GlassCard>

            <GlassCard 
              hover 
              glow="accent" 
              className="p-8 animate-fadeInUp"
              style={{ animationDelay: "300ms" }}
            >
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Card 2
              </h2>
              <p className="text-foreground-muted">
                Conteúdo...
              </p>
            </GlassCard>
          </div>

        </div>
      </GridBackground>
    </div>
  );
}
```

---

## 🚀 Dicas de Performance

1. **Animações**: Use `will-change` com moderação
2. **Delays**: Máximo de 500ms para sequências
3. **Blur**: Backdrop-blur pode impactar performance em mobile
4. **Imagens**: Use next/image para otimização automática
5. **Lazy Load**: Carregue componentes pesados sob demanda

---

## ✅ Checklist de Nova Página

- [ ] Importar componentes Railway necessários
- [ ] Adicionar `<GridBackground>` wrapper
- [ ] Usar `<AnimatedText>` em títulos principais
- [ ] Aplicar `<GlassCard>` em seções de conteúdo
- [ ] Usar `<GradientButton>` em CTAs principais
- [ ] Adicionar animações `animate-fadeInUp`
- [ ] Configurar delays sequenciais
- [ ] Testar responsividade (mobile, tablet, desktop)
- [ ] Adicionar loading states com `Sparkles`
- [ ] Criar empty states estilizados

---

**🎨 Desenvolvido com Railway Design System**
*Guia Rápido v1.0 - Novembro 2025*
