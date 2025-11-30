/**
 * Sistema Dinâmico de Sidebar
 * 
 * Este módulo fornece um sistema modular e escalável para gerenciar
 * itens de menu do sidebar.
 * 
 * ## Como usar:
 * 
 * ```tsx
 * import { getMenuItems } from "@/lib/sidebar"
 * 
 * const menuItems = getMenuItems()
 * ```
 * 
 * ## Como adicionar um novo módulo:
 * 
 * 1. Crie um arquivo em `lib/sidebar/modules/[nome].module.ts`:
 * 
 * ```ts
 * import { MenuModule } from "../types"
 * import { Icon } from "lucide-react"
 * 
 * export const meuModule: MenuModule = {
 *   id: "meu-modulo",
 *   name: "Meu Módulo",
 *   version: "1.0.0",
 *   enabled: true,
 *   items: [
 *     {
 *       id: "item-1",
 *       label: "Meu Item",
 *       icon: Icon,
 *       href: "/dashboard/meu-item",
 *       permission: "meu.item.view",
 *       order: 1,
 *       group: "main",
 *     },
 *   ],
 * }
 * ```
 * 
 * 2. Exporte em `lib/sidebar/modules/index.ts`:
 * 
 * ```ts
 * export { meuModule } from "./meu.module"
 * ```
 * 
 * 3. Registre em `lib/sidebar/setup.ts`:
 * 
 * ```ts
 * import { meuModule } from "./modules"
 * menuRegistry.registerModule(meuModule)
 * ```
 * 
 * Pronto! O sistema detectará e incluirá automaticamente.
 */

export { getMenuItems, registerDynamicModule, setupMenuSystem } from "./setup"
export { menuRegistry } from "./registry"
export type { MenuItem, MenuModule, MenuGroup } from "./types"
