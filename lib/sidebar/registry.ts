import { MenuModule, MenuItem, MenuGroup } from "./types"

/**
 * Registry global de módulos de menu
 * Cada módulo pode registrar seus próprios itens de menu
 */
class MenuRegistry {
  private modules: Map<string, MenuModule> = new Map()
  private groups: Map<string, MenuGroup> = new Map()

  /**
   * Registra um novo módulo de menu
   */
  registerModule(module: MenuModule): void {
    if (this.modules.has(module.id)) {
      console.warn(`Menu module "${module.id}" já está registrado. Substituindo...`)
    }
    this.modules.set(module.id, module)
  }

  /**
   * Remove um módulo de menu
   */
  unregisterModule(moduleId: string): void {
    this.modules.delete(moduleId)
  }

  /**
   * Obtém um módulo específico
   */
  getModule(moduleId: string): MenuModule | undefined {
    return this.modules.get(moduleId)
  }

  /**
   * Obtém todos os módulos registrados
   */
  getAllModules(): MenuModule[] {
    return Array.from(this.modules.values())
  }

  /**
   * Obtém todos os módulos ativos
   */
  getEnabledModules(): MenuModule[] {
    return Array.from(this.modules.values()).filter(m => m.enabled)
  }

  /**
   * Registra um grupo de menu
   */
  registerGroup(group: MenuGroup): void {
    this.groups.set(group.id, group)
  }

  /**
   * Obtém todos os grupos registrados
   */
  getAllGroups(): MenuGroup[] {
    return Array.from(this.groups.values()).sort((a, b) => a.order - b.order)
  }

  /**
   * Obtém um grupo específico
   */
  getGroup(groupId: string): MenuGroup | undefined {
    return this.groups.get(groupId)
  }

  /**
   * Obtém todos os itens de menu consolidados de todos os módulos ativos
   * Ordena por grupo e ordem
   */
  getAllMenuItems(): MenuItem[] {
    const items: MenuItem[] = []
    
    // Agrupa itens por grupo
    const itemsByGroup = new Map<string, MenuItem[]>()
    
    this.getEnabledModules().forEach(module => {
      module.items.forEach(item => {
        const group = item.group || 'main'
        if (!itemsByGroup.has(group)) {
          itemsByGroup.set(group, [])
        }
        itemsByGroup.get(group)!.push(item)
      })
    })

    // Ordena grupos
    const groups = this.getAllGroups()
    const groupOrder = new Map(groups.map((g, i) => [g.id, i]))

    // Processa cada grupo na ordem
    Array.from(itemsByGroup.entries())
      .sort((a, b) => {
        const orderA = groupOrder.get(a[0]) ?? 999
        const orderB = groupOrder.get(b[0]) ?? 999
        return orderA - orderB
      })
      .forEach(([groupId, groupItems], index) => {
        const group = this.getGroup(groupId)
        
        // Adiciona separador antes se configurado
        if (index > 0 && group?.showSeparatorBefore) {
          items.push({
            id: `separator-before-${groupId}`,
            separator: true,
            order: -1,
          })
        }

        // Ordena e adiciona itens do grupo
        groupItems
          .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
          .forEach(item => items.push(item))

        // Adiciona separador depois se configurado
        if (group?.showSeparatorAfter) {
          items.push({
            id: `separator-after-${groupId}`,
            separator: true,
            order: 999,
          })
        }
      })

    return items
  }

  /**
   * Habilita/desabilita um módulo
   */
  setModuleEnabled(moduleId: string, enabled: boolean): void {
    const module = this.modules.get(moduleId)
    if (module) {
      module.enabled = enabled
    }
  }

  /**
   * Limpa todos os registros (útil para testes)
   */
  clear(): void {
    this.modules.clear()
    this.groups.clear()
  }

  /**
   * Debug: imprime estado do registry
   */
  debug(): void {
    console.log('=== Menu Registry Debug ===')
    console.log('Módulos registrados:', this.modules.size)
    console.log('Grupos registrados:', this.groups.size)
    console.log('Módulos ativos:', this.getEnabledModules().length)
    console.log('Total de itens:', this.getAllMenuItems().length)
    
    this.getAllModules().forEach(module => {
      console.log(`\n[${module.enabled ? '✓' : '✗'}] ${module.name} (${module.id})`)
      console.log(`   Itens: ${module.items.length}`)
      if (module.version) console.log(`   Versão: ${module.version}`)
    })
  }
}

// Singleton instance
export const menuRegistry = new MenuRegistry()
