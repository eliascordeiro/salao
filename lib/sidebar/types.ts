import { LucideIcon } from "lucide-react"
import { Permission } from "@/lib/permissions"

/**
 * Tipo base para item de menu
 */
export type MenuItemBase = {
  id: string // Identificador único
  label: string
  icon: LucideIcon
  href: string
  permission?: Permission | Permission[]
  requireAll?: boolean // Se true e múltiplas permissões, requer todas (AND). Padrão: false (OR)
  badge?: string | number // Badge opcional (ex: contador)
  ownerOnly?: boolean // Se true, apenas donos podem ver
  order?: number // Ordem de exibição (menor = primeiro)
  group?: string // Grupo/categoria (ex: "main", "admin", "settings")
  separator?: never
}

/**
 * Tipo para separador
 */
export type MenuSeparator = {
  id: string
  separator: true
  order?: number
  group?: string
  label?: never
  icon?: never
  href?: never
  permission?: never
  requireAll?: never
  badge?: never
  ownerOnly?: never
}

/**
 * União de tipos de menu
 */
export type MenuItem = MenuItemBase | MenuSeparator

/**
 * Módulo de menu que pode ser registrado
 */
export type MenuModule = {
  id: string // ID único do módulo
  name: string // Nome do módulo (ex: "Agendamentos", "Financeiro")
  items: MenuItem[] // Itens do menu deste módulo
  enabled: boolean // Se o módulo está ativo
  version?: string // Versão do módulo
  description?: string // Descrição do módulo
}

/**
 * Configuração de um grupo de menu
 */
export type MenuGroup = {
  id: string
  label?: string // Label opcional para o grupo
  order: number // Ordem de exibição
  showSeparatorBefore?: boolean // Mostrar separador antes do grupo
  showSeparatorAfter?: boolean // Mostrar separador depois do grupo
}
