"use client"

import Link from "next/link"
import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Scissors, LogOut, User, Settings } from "lucide-react"

interface DashboardHeaderProps {
  user: {
    name?: string | null
    email?: string | null
    role?: string
  }
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  return (
    <header className="glass-card border-b border-border/50 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo Railway Style */}
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="p-2 rounded-lg bg-gradient-primary transition-transform group-hover:scale-110">
              <Scissors className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-foreground">AgendaSalão</span>
          </Link>

          {/* Menu Railway Style */}
          <nav className="hidden md:flex gap-8 items-center">
            {user.role === "ADMIN" ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-foreground-muted hover:text-primary transition-colors font-medium relative group"
                >
                  Dashboard
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-primary transition-all group-hover:w-full"></span>
                </Link>
                <Link
                  href="/dashboard/agendamentos"
                  className="text-foreground-muted hover:text-primary transition-colors font-medium relative group"
                >
                  Agendamentos
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-primary transition-all group-hover:w-full"></span>
                </Link>
                <Link
                  href="/dashboard/servicos"
                  className="text-foreground-muted hover:text-primary transition-colors font-medium relative group"
                >
                  Serviços
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-primary transition-all group-hover:w-full"></span>
                </Link>
                <Link
                  href="/dashboard/profissionais"
                  className="text-foreground-muted hover:text-primary transition-colors font-medium relative group"
                >
                  Profissionais
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-primary transition-all group-hover:w-full"></span>
                </Link>
                <Link
                  href="/dashboard/meu-salao"
                  className="text-foreground-muted hover:text-primary transition-colors font-medium relative group"
                >
                  Meu Salão
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-primary transition-all group-hover:w-full"></span>
                </Link>
                <Link
                  href="/dashboard/configuracoes"
                  className="text-foreground-muted hover:text-primary transition-colors font-medium relative group"
                >
                  Configurações
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-primary transition-all group-hover:w-full"></span>
                </Link>
              </>
            ) : null}
          </nav>

          {/* User Menu Railway Style */}
          <div className="flex items-center gap-4">
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium text-foreground">{user.name}</p>
              <p className="text-xs text-foreground-muted">{user.email}</p>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="sm"
                className="hover:bg-background-alt hover:text-primary transition-colors"
              >
                <User className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                className="hover:bg-background-alt hover:text-primary transition-colors"
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-error hover:text-error hover:bg-error/10 transition-colors"
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
