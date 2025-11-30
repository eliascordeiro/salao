import { menuRegistry } from "./registry"
import { coreModule, financialModule, adminModule } from "./modules"

/**
 * Configuração dos grupos de menu
 */
const menuGroups = [
  {
    id: "main",
    label: "Principal",
    order: 1,
    showSeparatorAfter: false,
  },
  {
    id: "financial",
    label: "Financeiro",
    order: 2,
    showSeparatorBefore: true,
    showSeparatorAfter: false,
  },
  {
    id: "admin",
    label: "Administração",
    order: 3,
    showSeparatorBefore: true,
    showSeparatorAfter: false,
  },
]

/**
 * Inicializa o sistema de menu
 * Registra todos os módulos e grupos
 */
export function setupMenuSystem(): void {
  // Limpa registros anteriores (útil em dev com hot reload)
  menuRegistry.clear()

  // Registra grupos
  menuGroups.forEach(group => {
    menuRegistry.registerGroup(group)
  })

  // Registra módulos
  menuRegistry.registerModule(coreModule)
  menuRegistry.registerModule(financialModule)
  menuRegistry.registerModule(adminModule)

  // Debug em desenvolvimento
  if (process.env.NODE_ENV === "development") {
    console.log("📋 Menu system initialized")
    // menuRegistry.debug() // Descomente para debug detalhado
  }
}

/**
 * Retorna todos os itens de menu prontos para uso
 */
export function getMenuItems() {
  return menuRegistry.getAllMenuItems()
}

/**
 * Registra um novo módulo dinamicamente
 * Útil para plugins ou módulos carregados em runtime
 */
export function registerDynamicModule(module: any) {
  menuRegistry.registerModule(module)
}

// Auto-inicializa na primeira importação
setupMenuSystem()
