# Sistema Dinâmico de Sidebar

## 📋 Visão Geral

Sistema modular e escalável para gerenciar itens de menu do sidebar. Permite adicionar, remover e organizar módulos de forma dinâmica sem modificar o componente Sidebar diretamente.

## 🏗️ Arquitetura

```
lib/sidebar/
├── index.ts              # Exportações públicas
├── types.ts              # Tipos TypeScript
├── registry.ts           # Registry de módulos (Singleton)
├── setup.ts              # Configuração e inicialização
└── modules/              # Módulos de menu
    ├── index.ts          # Exportações de módulos
    ├── core.module.ts    # Módulo principal
    ├── financial.module.ts
    └── admin.module.ts
```

## 🎯 Características

✅ **Modular**: Cada funcionalidade em seu próprio módulo  
✅ **Dinâmico**: Adicione novos itens sem modificar o Sidebar  
✅ **Organizado**: Grupos e ordem configuráveis  
✅ **Tipado**: Full TypeScript support  
✅ **Permissões**: Integração com sistema de permissões  
✅ **Escalável**: Registry pattern para runtime registration  

## 🚀 Como Usar

### 1. Usando no Sidebar

```tsx
import { getMenuItems } from "@/lib/sidebar"

export function Sidebar() {
  const menuItems = getMenuItems()
  
  return (
    <nav>
      {menuItems.map(item => (
        // Renderizar item
      ))}
    </nav>
  )
}
```

### 2. Criando um Novo Módulo

**Passo 1:** Criar arquivo `lib/sidebar/modules/meu-modulo.module.ts`

```typescript
import { MenuModule } from "../types"
import { Icon } from "lucide-react"

export const meuModule: MenuModule = {
  id: "meu-modulo",
  name: "Meu Módulo",
  version: "1.0.0",
  description: "Descrição do módulo",
  enabled: true,
  items: [
    {
      id: "item-1",
      label: "Meu Item",
      icon: Icon,
      href: "/dashboard/meu-item",
      permission: "meu.item.view", // Opcional
      order: 1,
      group: "main", // ou "financial", "admin"
    },
    {
      id: "item-2",
      label: "Outro Item",
      icon: Icon,
      href: "/dashboard/outro",
      ownerOnly: true, // Apenas para donos
      order: 2,
      group: "main",
    },
  ],
}
```

**Passo 2:** Exportar em `lib/sidebar/modules/index.ts`

```typescript
export { meuModule } from "./meu-modulo.module"
```

**Passo 3:** Registrar em `lib/sidebar/setup.ts`

```typescript
import { meuModule } from "./modules"

export function setupMenuSystem(): void {
  // ... código existente
  
  menuRegistry.registerModule(meuModule)
}
```

**Pronto!** O sistema detectará e incluirá automaticamente.

### 3. Criando um Novo Grupo

Em `lib/sidebar/setup.ts`:

```typescript
const menuGroups = [
  // ... grupos existentes
  {
    id: "novo-grupo",
    label: "Novo Grupo",
    order: 4, // Ordem de exibição
    showSeparatorBefore: true, // Separador antes
    showSeparatorAfter: false,
  },
]
```

### 4. Registrando Módulos Dinamicamente (Runtime)

```typescript
import { registerDynamicModule } from "@/lib/sidebar"

// Em um plugin ou módulo carregado dinamicamente
registerDynamicModule({
  id: "plugin-modulo",
  name: "Plugin",
  enabled: true,
  items: [
    // ... seus itens
  ],
})
```

## 📝 Tipos Principais

### MenuItem

```typescript
type MenuItemBase = {
  id: string                    // ID único
  label: string                 // Label exibida
  icon: LucideIcon             // Ícone Lucide
  href: string                 // URL
  permission?: Permission      // Permissão(ões) necessária(s)
  requireAll?: boolean         // Requer todas permissões (AND)
  badge?: string | number      // Badge opcional
  ownerOnly?: boolean          // Apenas para donos
  order?: number               // Ordem de exibição
  group?: string               // Grupo/categoria
}

type MenuSeparator = {
  id: string
  separator: true
  order?: number
  group?: string
}
```

### MenuModule

```typescript
type MenuModule = {
  id: string                   // ID único do módulo
  name: string                 // Nome do módulo
  items: MenuItem[]            // Itens do menu
  enabled: boolean             // Se está ativo
  version?: string             // Versão
  description?: string         // Descrição
}
```

## 🎨 Grupos Disponíveis

| Grupo | Ordem | Descrição |
|-------|-------|-----------|
| `main` | 1 | Funcionalidades principais |
| `financial` | 2 | Módulos financeiros |
| `admin` | 3 | Administração e config |

## 🔐 Sistema de Permissões

O sistema integra perfeitamente com `@/lib/permissions`:

```typescript
{
  id: "item",
  permission: "module.action", // Permissão única
}

{
  id: "item",
  permission: ["perm1", "perm2"], // Múltiplas (OR)
}

{
  id: "item",
  permission: ["perm1", "perm2"],
  requireAll: true, // Múltiplas (AND)
}

{
  id: "item",
  ownerOnly: true, // Apenas donos
}
```

## 🛠️ API do Registry

```typescript
import { menuRegistry } from "@/lib/sidebar"

// Registrar módulo
menuRegistry.registerModule(module)

// Remover módulo
menuRegistry.unregisterModule("module-id")

// Obter módulo
const module = menuRegistry.getModule("module-id")

// Obter todos módulos
const all = menuRegistry.getAllModules()

// Obter apenas ativos
const enabled = menuRegistry.getEnabledModules()

// Obter todos itens consolidados
const items = menuRegistry.getAllMenuItems()

// Habilitar/desabilitar módulo
menuRegistry.setModuleEnabled("module-id", false)

// Debug
menuRegistry.debug()
```

## 📊 Exemplo Completo

```typescript
// lib/sidebar/modules/relatorios.module.ts
import { BarChart, FileText, TrendingUp } from "lucide-react"
import { MenuModule } from "../types"

export const relatoriosModule: MenuModule = {
  id: "relatorios",
  name: "Relatórios",
  version: "1.0.0",
  description: "Módulo de relatórios e análises",
  enabled: true,
  items: [
    {
      id: "relatorios-vendas",
      label: "Vendas",
      icon: BarChart,
      href: "/dashboard/relatorios/vendas",
      permission: "reports.sales.view",
      order: 1,
      group: "financial",
      badge: "Novo", // Badge opcional
    },
    {
      id: "relatorios-customizados",
      label: "Relatórios Personalizados",
      icon: FileText,
      href: "/dashboard/relatorios/custom",
      permission: ["reports.view", "reports.create"],
      requireAll: true,
      order: 2,
      group: "financial",
    },
  ],
}
```

## 🔄 Fluxo de Inicialização

1. **Import** do `getMenuItems()` no Sidebar
2. **Auto-inicialização** via `setupMenuSystem()`
3. **Registro** de grupos e módulos
4. **Consolidação** de itens por grupo e ordem
5. **Retorno** de array pronto para uso

## 🐛 Debug

```typescript
import { menuRegistry } from "@/lib/sidebar"

// No console do navegador
menuRegistry.debug()

// Output:
// === Menu Registry Debug ===
// Módulos registrados: 3
// Grupos registrados: 3
// Módulos ativos: 3
// Total de itens: 12
//
// [✓] Core (core)
//    Itens: 6
//    Versão: 1.0.0
// ...
```

## 🎯 Benefícios

1. **Manutenibilidade**: Cada módulo em seu arquivo
2. **Escalabilidade**: Adicione quantos módulos quiser
3. **Organização**: Grupos e ordem configuráveis
4. **Reusabilidade**: Registry pattern para plugins
5. **Tipagem**: Full TypeScript, auto-complete IDE
6. **Separação de Concerns**: Lógica vs Apresentação

## 📦 Migrando Menu Antigo

Antes (hardcoded):

```tsx
const menuItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  // ... mais 10 itens
]
```

Depois (dinâmico):

```tsx
import { getMenuItems } from "@/lib/sidebar"
const menuItems = getMenuItems()
```

## 🚀 Próximas Melhorias Possíveis

- [ ] Suporte a sub-menus (nested)
- [ ] Persistência de estado (collapsed items)
- [ ] Favoritos/pins do usuário
- [ ] Drag & drop para reordenar (admin)
- [ ] Themes/skins por módulo
- [ ] Analytics de uso dos menus
- [ ] Lazy loading de módulos pesados
- [ ] Internacionalização (i18n)

## 📚 Referências

- **Registry Pattern**: [Refactoring Guru](https://refactoring.guru/design-patterns/registry)
- **Modular Architecture**: [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
