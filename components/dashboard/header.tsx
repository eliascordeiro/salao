"use client"

import Link from "next/link"
import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { LogOut, User, Sun, Moon, UserCircle, KeyRound } from "lucide-react"
import { useTheme } from "@/contexts/theme-context"
import { useState, useRef, useEffect } from "react"

interface DashboardHeaderProps {
  user: {
    name?: string | null
    email?: string | null
    role?: string
  }
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const { resolvedTheme, setTheme } = useTheme()
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark")
  }

  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <header className="glass-card border-b border-border/50 sticky top-0 z-30">
      <div className="container mx-auto px-4 py-3 md:py-4">
        <div className="flex items-center justify-between gap-3">
          {/* Título da página */}
          <div className="flex items-center gap-3 min-w-0">
            <h1 className="text-lg md:text-xl font-semibold text-foreground truncate">
              {user?.role === "ADMIN" ? "Painel Administrativo" : "Meu Painel"}
            </h1>
          </div>

          {/* User Menu Railway Style */}
          <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
            <div className="hidden lg:block text-right">
              <p className="text-sm font-medium text-foreground truncate max-w-[200px]">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate max-w-[200px]">{user?.email}</p>
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
                  <Sun className="h-4 w-4 text-foreground" />
                ) : (
                  <Moon className="h-4 w-4 text-foreground" />
                )}
              </Button>

              {/* User Menu Dropdown */}
              <div className="relative" ref={userMenuRef}>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="hover:bg-background-alt hover:text-primary transition-colors border border-border/30"
                  title="Meu perfil"
                >
                  <User className="h-4 w-4 text-primary" />
                </Button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 glass-card border border-border/50 rounded-lg shadow-lg overflow-hidden z-50">
                    <div className="p-3 border-b border-border/30">
                      <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                    </div>
                    
                    <div className="py-1">
                      <Link 
                        href="/dashboard/perfil"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-background-alt transition-colors"
                      >
                        <UserCircle className="h-4 w-4 text-primary" />
                        <span>Meu Perfil</span>
                      </Link>
                      
                      <Link 
                        href="/dashboard/perfil?tab=security"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-background-alt transition-colors"
                      >
                        <KeyRound className="h-4 w-4 text-primary" />
                        <span>Alterar Senha</span>
                      </Link>
                      
                      <div className="border-t border-border/30 my-1"></div>
                      
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false)
                          signOut({ callbackUrl: "/" })
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-error hover:bg-error/10 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Sair</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
