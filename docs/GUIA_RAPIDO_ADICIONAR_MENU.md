# 🚀 Guia Rápido: Adicionar Nova Opção no Sidebar

## Cenário: Adicionar módulo "Relatórios"

### Passo 1: Criar o Módulo (2 minutos)

Crie o arquivo `lib/sidebar/modules/relatorios.module.ts`:

```typescript
import { BarChart, FileText } from "lucide-react"
import { MenuModule } from "../types"

export const relatoriosModule: MenuModule = {
  id: "relatorios",
  name: "Relatórios",
  version: "1.0.0",
  enabled: true,
  items: [
    {
      id: "relatorios-vendas",
      label: "Relatório de Vendas",
      icon: BarChart,
      href: "/dashboard/relatorios/vendas",
      permission: "reports.view",
      order: 1,
      group: "financial", // ou "main" ou "admin"
    },
    {
      id: "relatorios-custom",
      label: "Relatórios Personalizados",
      icon: FileText,
      href: "/dashboard/relatorios/custom",
      permission: "reports.create",
      ownerOnly: true, // Apenas donos
      order: 2,
      group: "financial",
    },
  ],
}
```

### Passo 2: Exportar (30 segundos)

Em `lib/sidebar/modules/index.ts`, adicione:

```typescript
export { relatoriosModule } from "./relatorios.module"
```

### Passo 3: Registrar (30 segundos)

Em `lib/sidebar/setup.ts`, adicione:

```typescript
import { relatoriosModule } from "./modules"

export function setupMenuSystem(): void {
  // ... código existente
  
  menuRegistry.registerModule(relatoriosModule) // ← ADICIONE AQUI
}
```

### Passo 4: Criar Páginas (depende da funcionalidade)

```bash
# Criar estrutura de pastas
mkdir -p app/\(admin\)/dashboard/relatorios/{vendas,custom}

# Criar páginas
touch app/\(admin\)/dashboard/relatorios/vendas/page.tsx
touch app/\(admin\)/dashboard/relatorios/custom/page.tsx
```

### Passo 5: Adicionar Permissões (1 minuto)

Em `lib/permissions.ts`, adicione no grupo apropriado:

```typescript
export const PERMISSIONS = {
  // ... existentes
  
  // Relatórios
  "reports.view": "Ver relatórios",
  "reports.create": "Criar relatórios personalizados",
}

export const PERMISSION_GROUPS = {
  // ... existentes
  
  reports: {
    name: "Relatórios",
    permissions: [
      "reports.view",
      "reports.create",
    ],
  },
}
```

### ✅ Pronto!

O sistema detectará automaticamente e o menu aparecerá no sidebar!

---

## 🎨 Opções de Configuração

### Grupos Disponíveis

```typescript
group: "main"      // Menu principal (topo)
group: "financial" // Seção financeira (meio)
group: "admin"     // Administração (final)
```

### Controle de Acesso

```typescript
// Sem permissão = todos veem
{ label: "Item Público" }

// Permissão simples
{ permission: "module.view" }

// Múltiplas permissões (OR) - requer qualquer uma
{ permission: ["perm1", "perm2"] }

// Múltiplas permissões (AND) - requer todas
{ 
  permission: ["perm1", "perm2"],
  requireAll: true 
}

// Apenas donos
{ ownerOnly: true }
```

### Ordem de Exibição

```typescript
order: 1  // Primeiro
order: 2  // Segundo
order: 10 // Décimo
// Se não especificar, usa 999 (vai pro final)
```

### Badge Opcional

```typescript
badge: "Novo"     // Badge de texto
badge: 5          // Badge numérico
badge: "Beta"     // Badge customizado
```

---

## 📝 Template Rápido

Copie e cole este template:

```typescript
import { Icon } from "lucide-react"
import { MenuModule } from "../types"

export const meuModule: MenuModule = {
  id: "meu-modulo",
  name: "Meu Módulo",
  version: "1.0.0",
  enabled: true,
  items: [
    {
      id: "item-1",
      label: "Meu Item",
      icon: Icon,
      href: "/dashboard/meu-item",
      permission: "meu.item.view",
      order: 1,
      group: "main",
    },
  ],
}
```

---

## 🐛 Troubleshooting

### Menu não aparece?

1. ✅ Módulo exportado em `modules/index.ts`?
2. ✅ Módulo registrado em `setup.ts`?
3. ✅ `enabled: true`?
4. ✅ Permissões corretas no usuário?
5. ✅ Rebuild da aplicação? (`npm run build`)

### Debug

No console do navegador:

```javascript
import { menuRegistry } from "@/lib/sidebar"
menuRegistry.debug()
```

---

## 🎯 Exemplo Real: Módulo de Marketing

```typescript
import { Mail, Users, TrendingUp } from "lucide-react"
import { MenuModule } from "../types"

export const marketingModule: MenuModule = {
  id: "marketing",
  name: "Marketing",
  version: "1.0.0",
  enabled: true,
  items: [
    {
      id: "email-campaigns",
      label: "Campanhas de Email",
      icon: Mail,
      href: "/dashboard/marketing/email",
      permission: "marketing.email.view",
      order: 1,
      group: "main",
      badge: "Novo",
    },
    {
      id: "customer-segments",
      label: "Segmentos de Clientes",
      icon: Users,
      href: "/dashboard/marketing/segmentos",
      permission: "marketing.segments.view",
      order: 2,
      group: "main",
    },
    {
      id: "marketing-analytics",
      label: "Analytics de Marketing",
      icon: TrendingUp,
      href: "/dashboard/marketing/analytics",
      permission: ["marketing.view", "analytics.view"],
      ownerOnly: true,
      order: 3,
      group: "financial",
    },
  ],
}
```

**Tempo total:** ~5 minutos + tempo de desenvolvimento das páginas

---

## 📚 Ver Mais

- Documentação completa: `docs/SISTEMA_SIDEBAR_DINAMICO.md`
- Exemplo de módulo: `lib/sidebar/modules/exemplo-produtos.module.ts`
- Tipos: `lib/sidebar/types.ts`
- Registry API: `lib/sidebar/registry.ts`
