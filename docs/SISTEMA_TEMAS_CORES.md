# Sistema de Temas de Cores

## 📋 Visão Geral

Sistema completo de temas de cores que permite aos usuários personalizar a aparência do sistema com paletas pré-definidas, mantendo a funcionalidade de dark/light mode.

## 🎨 Temas Disponíveis

### 1. **Moderno** (Padrão) 🎨
Paleta contemporânea com cores vibrantes
- **Primary:** Rosa (#EC4899)
- **Secondary:** Roxo (#8B5CF6)
- **Accent:** Ciano (#06B6D4)
- **Ideal para:** Salões modernos, estúdios de beleza, spas

### 2. **Barbearia Clássica** 🪒
Inspirado no icônico poste listrado
- **Primary:** Vermelho (#DC2626)
- **Secondary:** Azul marinho (#1E3A8A)
- **Accent:** Dourado (#D97706)
- **Ideal para:** Barbearias tradicionais, estilo vintage

### 3. **Barbearia Premium** 💎
Elegância moderna com preto e dourado
- **Primary:** Dourado (#CA8A04)
- **Secondary:** Preto (#18181B)
- **Accent:** Borgonha (#991B1B)
- **Ideal para:** Barbearias de luxo, estabelecimentos premium

## 🏗️ Arquitetura

### Componentes Criados

```
types/theme.ts              - Definições de tipos e configurações dos temas
contexts/theme-context.tsx  - Contexto React estendido com color themes
components/theme-selector.tsx - Componente visual de seleção
```

### Fluxo de Funcionamento

1. **Carregamento inicial:**
   - Theme provider carrega tema salvo do localStorage
   - Aplica CSS variables automaticamente

2. **Mudança de tema:**
   - Usuário seleciona novo tema no seletor
   - `applyTheme()` atualiza CSS variables em tempo real
   - Persiste escolha no localStorage

3. **Renderização:**
   - Todos componentes usam CSS variables
   - Mudanças são instantâneas (sem reload)

## 💻 Implementação

### 1. Types (`types/theme.ts`)

```typescript
export type ThemeType = 'modern' | 'barber-classic' | 'barber-premium'

export interface ThemeColors {
  primary: string
  primaryLight: string
  primaryDark: string
  secondary: string
  accent: string
  success: string
  warning: string
  error: string
  info: string
  background: string
  foreground: string
  border: string
  // ... mais cores
}

export function applyTheme(theme: Theme) {
  // Aplica CSS variables dinamicamente
  root.style.setProperty('--primary', theme.colors.primary)
  // ... outras cores
  localStorage.setItem('theme', theme.id)
}
```

### 2. Context (`contexts/theme-context.tsx`)

Estendido com:
```typescript
interface ThemeContextType {
  // Dark/Light mode (já existia)
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: "light" | "dark"
  
  // Color theme (novo)
  colorTheme: ColorTheme
  colorThemeId: ThemeType
  setColorTheme: (themeId: ThemeType) => void
}
```

### 3. Componente Seletor

```tsx
<ThemeSelector />
```

Features:
- Grid de 3 cards (um por tema)
- Preview de cores principais
- Indicador de seleção
- Aplicação em tempo real
- Animações suaves

### 4. CSS Variables (`app/globals.css`)

```css
:root {
  --primary: 250 70% 60%;
  --primary-light: 250 80% 70%;
  --primary-dark: 250 70% 50%;
  --secondary: ...;
  --accent: ...;
  /* Sobrescritas dinamicamente pelo JS */
}
```

## 📍 Localização

### Página de Configurações
`/dashboard/configuracoes`

Estrutura:
1. **Modo de Exibição** (Dark/Light/System)
2. **Tema de Cores** ← NOVO (ThemeSelector)
3. **Preview do Tema**

## 🎯 Uso

### Para Usuários

1. Acesse **Dashboard → Configurações**
2. Role até **"Tema de Cores"**
3. Clique no tema desejado
4. Mudanças aplicadas instantaneamente
5. Salvo automaticamente

### Para Desenvolvedores

```tsx
import { useTheme } from "@/contexts/theme-context"

function MyComponent() {
  const { colorTheme, colorThemeId, setColorTheme } = useTheme()
  
  return (
    <div>
      <p>Tema atual: {colorTheme.name}</p>
      <button onClick={() => setColorTheme('barber-classic')}>
        Mudar para Clássico
      </button>
    </div>
  )
}
```

## 🔧 Personalização

### Adicionar Novo Tema

1. **Editar `types/theme.ts`:**
```typescript
export type ThemeType = 'modern' | 'barber-classic' | 'barber-premium' | 'novo-tema'

export const themes: Record<ThemeType, Theme> = {
  // ... temas existentes
  'novo-tema': {
    id: 'novo-tema',
    name: 'Meu Tema',
    description: 'Descrição do tema',
    icon: '🎨',
    colors: {
      primary: '#FF0000',
      // ... todas as cores
    }
  }
}
```

2. **Atualizar validações:**
   - `theme-context.tsx` (linha 20): adicionar no array de validação
   - Reiniciar servidor

### Modificar Cores de Tema Existente

Edite `types/theme.ts` → `themes` → tema desejado → `colors`

## 🧪 Testes

### Manual
1. Abra `/dashboard/configuracoes`
2. Alterne entre os 3 temas
3. Verifique mudanças em:
   - Botões
   - Cards
   - Links
   - Badges
   - Gradientes
4. Mude dark/light mode
5. Recarregue página (deve manter seleção)

### Automático
```bash
# Verificar se variáveis CSS foram aplicadas
localStorage.getItem('color-theme') // deve retornar: 'modern', 'barber-classic' ou 'barber-premium'

# Inspecionar CSS variables
getComputedStyle(document.documentElement).getPropertyValue('--primary')
```

## 📊 Compatibilidade

| Recurso | Status |
|---------|--------|
| Dark/Light mode | ✅ Mantido |
| Persistência localStorage | ✅ |
| SSR/SSG (Next.js) | ✅ |
| Hot reload | ✅ |
| TypeScript | ✅ |
| Tailwind CSS | ✅ |

## 🐛 Problemas Conhecidos

### Cor não muda após seleção
- **Causa:** CSS variable não suportada pelo componente
- **Solução:** Verificar se componente usa `bg-primary` ou `text-primary` (classes Tailwind com CSS vars)

### Tema não persiste após reload
- **Causa:** localStorage bloqueado
- **Solução:** Verificar configurações do navegador

## 📝 Próximas Melhorias

- [ ] Tema personalizado (color picker)
- [ ] Preview em tempo real antes de aplicar
- [ ] Exportar/importar temas
- [ ] Tema por salão (banco de dados)
- [ ] Mais paletas (salão de festa, clínica estética, etc)

## 🎨 Paleta de Cores Completa

### Moderno
```css
Primary: #EC4899 / #F9A8D4 / #BE185D
Secondary: #8B5CF6 / #C4B5FD / #6D28D9
Accent: #06B6D4 / #67E8F9 / #0E7490
Success: #10B981
Warning: #F59E0B
Error: #EF4444
Info: #3B82F6
```

### Barbearia Clássica
```css
Primary: #DC2626 / #F87171 / #991B1B
Secondary: #1E3A8A / #3B82F6 / #1E40AF
Accent: #D97706 / #FBBF24 / #92400E
Success: #059669
Warning: #D97706
Error: #DC2626
Info: #2563EB
```

### Barbearia Premium
```css
Primary: #CA8A04 / #FACC15 / #854D0E
Secondary: #18181B / #3F3F46 / #09090B
Accent: #991B1B / #DC2626 / #7F1D1D
Success: #059669
Warning: #D97706
Error: #991B1B
Info: #CA8A04
Background: #0F0F0F / #1A1A1A
Foreground: #F5F5F4 / #A8A29E
```

## 🚀 Deploy

Sistema já está pronto para produção. Mudanças aplicadas:

✅ Tipos criados
✅ Context estendido
✅ Componente seletor
✅ Integração na página de config
✅ CSS variables atualizadas
✅ Documentação completa

Basta commitar e fazer deploy normalmente!

---

**Criado em:** 10/12/2025  
**Versão:** 1.0.0  
**Autor:** GitHub Copilot
