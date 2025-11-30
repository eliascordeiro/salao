import { ShoppingBag, Package, TrendingUp as ChartLine } from "lucide-react"
import { MenuModule } from "../types"

/**
 * EXEMPLO: Módulo de Produtos/Estoque
 * 
 * Este é um exemplo de como criar um novo módulo.
 * 
 * Para ativar:
 * 1. Descomente a exportação em modules/index.ts
 * 2. Descomente o registro em setup.ts
 * 3. Crie as páginas correspondentes
 */
export const produtosModule: MenuModule = {
  id: "produtos",
  name: "Produtos e Estoque",
  version: "1.0.0",
  description: "Gestão de produtos e controle de estoque",
  enabled: false, // Desabilitado por padrão
  items: [
    {
      id: "produtos-catalogo",
      label: "Catálogo de Produtos",
      icon: ShoppingBag,
      href: "/dashboard/produtos",
      permission: "products.view",
      order: 1,
      group: "main",
    },
    {
      id: "produtos-estoque",
      label: "Controle de Estoque",
      icon: Package,
      href: "/dashboard/estoque",
      permission: "inventory.view",
      order: 2,
      group: "main",
    },
    {
      id: "produtos-relatorio",
      label: "Relatório de Vendas",
      icon: ChartLine,
      href: "/dashboard/produtos/relatorio",
      permission: ["products.view", "reports.view"],
      order: 3,
      group: "financial",
    },
  ],
}

/**
 * COMO ATIVAR ESTE MÓDULO:
 * 
 * 1. Em lib/sidebar/modules/index.ts:
 *    export { produtosModule } from "./exemplo-produtos.module"
 * 
 * 2. Em lib/sidebar/setup.ts:
 *    menuRegistry.registerModule(produtosModule)
 * 
 * 3. Mude enabled: true neste arquivo
 * 
 * 4. Crie as páginas:
 *    - app/(admin)/dashboard/produtos/page.tsx
 *    - app/(admin)/dashboard/estoque/page.tsx
 *    - app/(admin)/dashboard/produtos/relatorio/page.tsx
 * 
 * 5. Adicione as permissões em lib/permissions.ts:
 *    "products.view"
 *    "products.create"
 *    "inventory.view"
 */
