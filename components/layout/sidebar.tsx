"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  ChevronLeft,
  Menu,
  X,
  Scissors,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useEffect } from "react"
import { useSidebar } from "@/contexts/sidebar-context"
import { usePermissions } from "@/hooks/use-permissions"
import { getMenuItems } from "@/lib/sidebar"
import type { MenuItem } from "@/lib/sidebar"

export function Sidebar() {
  const pathname = usePathname()
  const { collapsed, setCollapsed, mobileOpen, setMobileOpen } = useSidebar()
  const { hasPermission, hasAllPermissions, hasAnyPermission, isOwner } = usePermissions()

  // Obtém itens de menu do sistema dinâmico
  const menuItems = getMenuItems()

  // Filter menu items based on permissions
  const visibleMenuItems = menuItems.filter((item: MenuItem) => {
    // Always show separators
    if (item.separator) return true
    
    // Owner-only items
    if (item.ownerOnly) {
      return isOwner
    }
    
    // If no permission required, show item
    if (!item.permission) return true
    
    // Owner has access to everything
    if (isOwner) return true
    
    // Check permissions
    if (Array.isArray(item.permission)) {
      return item.requireAll
        ? hasAllPermissions(item.permission)
        : hasAnyPermission(item.permission)
    } else {
      return hasPermission(item.permission)
    }
  })

  // Fecha o menu mobile quando a rota muda
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // Fecha o menu mobile quando clicar fora (ESC)
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false)
    }
    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [])

  return (
    <>
      {/* Botão Menu Mobile - Fixo no topo */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg glass-card border border-border/50 hover:bg-background-alt transition-colors"
        aria-label="Menu"
      >
        {mobileOpen ? (
          <X className="h-6 w-6 text-foreground" />
        ) : (
          <Menu className="h-6 w-6 text-foreground" />
        )}
      </button>

      {/* Overlay Mobile */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen transition-all duration-300 ease-in-out",
          "border-r border-border/50 glass-card backdrop-blur-xl",
          "bg-gradient-to-b from-background/95 via-background/90 to-background/95",
          // Desktop
          "lg:z-40",
          collapsed && "lg:w-20",
          !collapsed && "lg:w-72",
          // Mobile/Tablet
          "lg:translate-x-0",
          mobileOpen ? "translate-x-0 z-50 w-72" : "-translate-x-full z-50"
        )}
      >
        {/* Header */}
        <div className={cn(
          "flex items-center border-b border-border/30 backdrop-blur-sm",
          "bg-gradient-to-r from-primary/5 via-transparent to-primary/5",
          collapsed ? "justify-center p-5" : "justify-between p-5"
        )}>
          {!collapsed && (
            <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left duration-300">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-primary blur-md opacity-50 group-hover:opacity-75 transition-opacity" />
                <div className="relative p-2.5 rounded-xl bg-gradient-primary shadow-lg">
                  <Scissors className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-foreground">
                  AgendaSalão
                </span>
                <span className="text-xs text-muted-foreground">Gestão Profissional</span>
              </div>
            </div>
          )}
          {collapsed && (
            <button
              onClick={() => setCollapsed(false)}
              className="group relative"
              title="Expandir menu"
            >
              <div className="absolute inset-0 bg-gradient-primary blur-md opacity-50 group-hover:opacity-75 transition-opacity" />
              <div className="relative p-3 rounded-xl bg-gradient-primary group-hover:scale-110 transition-transform shadow-lg">
                <Scissors className="h-7 w-7 text-white" />
              </div>
            </button>
          )}
          {/* Botão colapsar apenas no desktop */}
          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              className="hidden lg:flex items-center justify-center p-2.5 rounded-lg hover:bg-background-alt/50 transition-all hover:scale-110 group"
              title="Recolher menu"
            >
              <ChevronLeft className="h-5 w-5 transition-transform group-hover:-translate-x-0.5" />
            </button>
          )}
        </div>

        {/* Menu Items */}
        <nav className={cn(
          "space-y-1.5 overflow-y-auto overflow-x-hidden",
          // Scrollbar personalizada moderna
          "scrollbar-thin scrollbar-track-transparent scrollbar-thumb-primary/20 hover:scrollbar-thumb-primary/40",
          "scrollbar-thumb-rounded-full",
          // Mobile: altura considera botão menu + padding extra
          "h-[calc(100vh-100px)]",
          // Desktop: altura normal
          "lg:h-[calc(100vh-120px)]",
          collapsed ? "p-2" : "px-3 py-4"
        )}>
          {visibleMenuItems.map((item, index) => {
            // Renderizar separador
            if (item.separator) {
              return (
                <div 
                  key={`separator-${index}`} 
                  className={cn(
                    "relative my-4",
                    collapsed ? "mx-1" : "mx-2"
                  )} 
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
                  <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                </div>
              )
            }

            // Garantir que temos href e icon
            if (!item.href || !item.icon) return null

            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center rounded-xl transition-all relative group overflow-hidden",
                  "hover:bg-background-alt/50",
                  // Touch target mínimo de 44px para mobile
                  "min-h-[48px]",
                  isActive && [
                    "bg-gradient-to-r from-primary/10 via-primary/5 to-transparent",
                    "border border-primary/20",
                    "shadow-lg shadow-primary/5"
                  ],
                  !isActive && "text-foreground/70 hover:text-primary border border-transparent",
                  // Espaçamento condicional - aumentar padding horizontal
                  collapsed ? "justify-center p-3" : "gap-3 px-3 py-3.5"
                )}
              >
                {/* Efeito de brilho ao hover */}
                <div className={cn(
                  "absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent",
                  "translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"
                )} />
                
                {/* Barra lateral de destaque quando ativo */}
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-primary/80 to-primary/60 rounded-r-full" />
                )}

                <Icon className={cn(
                  "flex-shrink-0 transition-all duration-300 relative z-10",
                  "group-hover:scale-110 group-hover:rotate-3",
                  // Ícones maiores no mobile para melhor usabilidade
                  collapsed ? "h-6 w-6 min-w-[24px] min-h-[24px]" : "h-6 w-6 min-w-[24px] min-h-[24px] lg:h-5 lg:w-5 lg:min-w-[20px] lg:min-h-[20px]",
                  isActive ? "text-primary drop-shadow-lg" : "text-foreground/70 group-hover:text-primary"
                )} />
                
                {!collapsed && (
                  <span className={cn(
                    "font-medium text-sm lg:text-base transition-all relative z-10",
                    isActive && "text-primary font-semibold"
                  )}>
                    {item.label}
                  </span>
                )}
                
                {/* Tooltip quando collapsed (apenas desktop) */}
                {collapsed && (
                  <div className={cn(
                    "hidden lg:block absolute left-full ml-4 px-3 py-2",
                    "bg-gray-900/95 backdrop-blur-sm text-white text-sm rounded-lg",
                    "opacity-0 group-hover:opacity-100 transition-all duration-200",
                    "pointer-events-none whitespace-nowrap z-50",
                    "shadow-xl border border-white/10",
                    "before:content-[''] before:absolute before:right-full before:top-1/2 before:-translate-y-1/2",
                    "before:border-4 before:border-transparent before:border-r-gray-900/95"
                  )}>
                    {item.label}
                  </div>
                )}

                {/* Badge de notificação (exemplo - pode ser usado no futuro) */}
                {!collapsed && isActive && (
                  <div className="ml-auto">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  </div>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Footer (apenas no desktop - removido para evitar duplicação) */}
        {/* Configurações já está no menu principal */}
      </aside>
    </>
  )
}
