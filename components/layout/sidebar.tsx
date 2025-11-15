"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  Calendar, 
  Scissors, 
  Users, 
  CreditCard, 
  Store, 
  Receipt,
  TrendingUp,
  Settings,
  ChevronLeft,
  Menu,
  X,
  Wallet,
  LucideIcon
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useEffect } from "react"
import { useSidebar } from "@/contexts/sidebar-context"

type MenuItem = {
  label: string
  icon: LucideIcon
  href: string
  separator?: never
} | {
  separator: true
  label?: never
  icon?: never
  href?: never
}

const menuItems: MenuItem[] = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    label: "Meu Salão",
    icon: Store,
    href: "/dashboard/meu-salao",
  },
  {
    label: "Agendamentos",
    icon: Calendar,
    href: "/dashboard/agendamentos",
  },
  {
    label: "Profissionais",
    icon: Users,
    href: "/dashboard/profissionais",
  },
  {
    label: "Serviços",
    icon: Scissors,
    href: "/dashboard/servicos",
  },
  {
    label: "Caixa",
    icon: Wallet,
    href: "/dashboard/caixa",
  },
  {
    label: "Contas a Pagar",
    icon: Receipt,
    href: "/dashboard/contas-a-pagar",
  },
  {
    label: "Análise Financeira",
    icon: TrendingUp,
    href: "/dashboard/financeiro",
  },
  {
    separator: true,
  },
  {
    label: "Assinatura",
    icon: CreditCard,
    href: "/dashboard/assinatura",
  },
  {
    label: "Configurações",
    icon: Settings,
    href: "/dashboard/configuracoes",
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { collapsed, setCollapsed, mobileOpen, setMobileOpen } = useSidebar()

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
          "border-r border-border/50 glass-card",
          // Desktop
          "lg:z-40",
          collapsed && "lg:w-16",
          !collapsed && "lg:w-64",
          // Mobile/Tablet
          "lg:translate-x-0",
          mobileOpen ? "translate-x-0 z-50 w-64" : "-translate-x-full z-50"
        )}
      >
        {/* Header */}
        <div className={cn(
          "flex items-center border-b border-border/50",
          collapsed ? "justify-center p-4" : "justify-between p-4"
        )}>
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-primary">
                <Scissors className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-foreground">AgendaSalão</span>
            </div>
          )}
          {collapsed && (
            <button
              onClick={() => setCollapsed(false)}
              className="group"
              title="Expandir menu"
            >
              <div className="p-2 rounded-lg bg-gradient-primary group-hover:scale-110 transition-transform">
                <Scissors className="h-6 w-6 text-white" />
              </div>
            </button>
          )}
          {/* Botão colapsar apenas no desktop */}
          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              className="hidden lg:block p-2 rounded-lg hover:bg-background-alt transition-colors"
              title="Recolher menu"
            >
              <ChevronLeft className="h-5 w-5 transition-transform" />
            </button>
          )}
        </div>

        {/* Menu Items */}
        <nav className={cn(
          "space-y-1 overflow-y-auto",
          // Mobile: altura considera botão menu + padding extra
          "h-[calc(100vh-80px)]",
          // Desktop: altura normal
          "lg:h-[calc(100vh-140px)]",
          collapsed ? "p-2" : "p-4"
        )}>
          {menuItems.map((item, index) => {
            // Renderizar separador
            if (item.separator) {
              return (
                <div 
                  key={`separator-${index}`} 
                  className={cn(
                    "border-t border-border/50",
                    collapsed ? "my-2" : "my-3"
                  )} 
                />
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
                  "flex items-center rounded-lg transition-all relative",
                  "hover:bg-background-alt group",
                  // Touch target mínimo de 44px para mobile
                  "min-h-[44px]",
                  isActive && "bg-gradient-primary text-white shadow-lg shadow-primary/20",
                  !isActive && "text-foreground-muted hover:text-primary",
                  // Espaçamento condicional
                  collapsed ? "justify-center p-3" : "gap-3 px-4 py-3"
                )}
              >
                <Icon className={cn(
                  "flex-shrink-0 transition-transform group-hover:scale-110",
                  // Ícones maiores no mobile para melhor usabilidade
                  collapsed ? "h-6 w-6 min-w-[24px] min-h-[24px]" : "h-6 w-6 min-w-[24px] min-h-[24px] lg:h-5 lg:w-5 lg:min-w-[20px] lg:min-h-[20px]",
                  isActive && "text-white"
                )} />
                {!collapsed && (
                  <span className="font-medium text-sm lg:text-base">{item.label}</span>
                )}
                
                {/* Tooltip quando collapsed (apenas desktop) */}
                {collapsed && (
                  <div className="hidden lg:block absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                    {item.label}
                  </div>
                )}

                {/* Indicador ativo */}
                {isActive && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-l-full" />
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
