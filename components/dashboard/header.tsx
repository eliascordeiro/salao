"use client"

import Link from "next/link"
import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Scissors, LogOut, User, Settings, Sun, Moon } from "lucide-react"
import { useTheme } from "@/contexts/theme-context"

interface DashboardHeaderProps {
  user: {
    name?: string | null
    email?: string | null
    role?: string
  }
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const { resolvedTheme, setTheme } = useTheme()

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark")
  }

  return (
    <header className="glass-card border-b border-border/50 sticky top-0 z-30">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Título da página */}
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-foreground">
              {user?.role === "ADMIN" ? "Painel Administrativo" : "Meu Painel"}
            </h1>
          </div>

          {/* User Menu Railway Style */}
          <div className="flex items-center gap-4">
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium text-white">{user?.name}</p>
              <p className="text-xs text-foreground-muted">{user?.email}</p>
            </div>
            
            <div className="flex gap-2">
              {/* Toggle Tema */}
              <Button 
                variant="ghost" 
                size="sm"
                onClick={toggleTheme}
                className="hover:bg-background-alt hover:text-primary transition-colors"
                title={resolvedTheme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
              >
                {resolvedTheme === "dark" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                className="hover:bg-background-alt hover:text-primary transition-colors"
              >
                <User className="h-4 w-4 text-white" />
              </Button>
              <Link href="/dashboard/configuracoes">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="hover:bg-background-alt hover:text-primary transition-colors"
                  title="Configurações"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-error hover:text-error hover:bg-error/10 transition-colors"
                title="Sair"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
