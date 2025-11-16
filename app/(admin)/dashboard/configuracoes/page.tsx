"use client"

import { useSession } from "next-auth/react"
import { useTheme } from "@/contexts/theme-context"
import { GlassCard } from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import { Sun, Moon, Monitor, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { DashboardHeader } from "@/components/dashboard/header"

export default function ConfiguracoesPage() {
  const { data: session } = useSession()
  const { theme, setTheme, resolvedTheme } = useTheme()

  const themes = [
    {
      value: "light" as const,
      label: "Modo Claro",
      icon: Sun,
      description: "Tema claro para ambientes bem iluminados",
    },
    {
      value: "dark" as const,
      label: "Modo Escuro",
      icon: Moon,
      description: "Tema escuro para reduzir cansaço visual",
    },
    {
      value: "system" as const,
      label: "Sistema",
      icon: Monitor,
      description: "Usar preferência do sistema operacional",
    },
  ]

  return (
    <>
      {/* Dashboard Header */}
      {session?.user && (
        <DashboardHeader
          user={{
            name: session.user.name,
            email: session.user.email,
            role: session.user.role,
          }}
        />
      )}

      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
          <p className="text-foreground-muted mt-2">
            Personalize a aparência e preferências do sistema
          </p>
        </div>

      {/* Tema Section */}
      <GlassCard className="p-6">
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              {resolvedTheme === "dark" ? (
                <Moon className="h-5 w-5 text-primary" />
              ) : (
                <Sun className="h-5 w-5 text-primary" />
              )}
              Aparência
            </h2>
            <p className="text-sm text-foreground-muted mt-1">
              Escolha o tema de cores da interface
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            {themes.map((themeOption) => {
              const Icon = themeOption.icon
              const isActive = theme === themeOption.value

              return (
                <button
                  key={themeOption.value}
                  onClick={() => setTheme(themeOption.value)}
                  className={cn(
                    "relative p-6 rounded-lg border-2 transition-all",
                    "hover:border-primary/50 hover:bg-background-alt/50",
                    "text-left group",
                    isActive
                      ? "border-primary bg-primary/10"
                      : "border-border/50"
                  )}
                >
                  {/* Check Badge */}
                  {isActive && (
                    <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-gradient-primary flex items-center justify-center">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  )}

                  {/* Icon */}
                  <div
                    className={cn(
                      "w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-transform group-hover:scale-110",
                      isActive
                        ? "bg-gradient-primary"
                        : "bg-background-alt"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-6 w-6",
                        isActive ? "text-white" : "text-foreground-muted"
                      )}
                    />
                  </div>

                  {/* Label */}
                  <h3
                    className={cn(
                      "font-semibold mb-1",
                      isActive ? "text-primary" : "text-foreground"
                    )}
                  >
                    {themeOption.label}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-foreground-muted">
                    {themeOption.description}
                  </p>
                </button>
              )
            })}
          </div>
        </div>
      </GlassCard>

      {/* Preview Section */}
      <GlassCard className="p-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">
            Preview do Tema
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card Example */}
            <div className="p-4 rounded-lg border border-border/50 bg-background-alt/50 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-primary" />
                <div className="flex-1">
                  <div className="h-3 bg-foreground/20 rounded w-24 mb-2" />
                  <div className="h-2 bg-foreground/10 rounded w-32" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-2 bg-foreground/10 rounded" />
                <div className="h-2 bg-foreground/10 rounded w-5/6" />
              </div>
            </div>

            {/* Buttons Example */}
            <div className="p-4 rounded-lg border border-border/50 bg-background-alt/50 space-y-3">
              <Button className="w-full">Botão Principal</Button>
              <Button variant="outline" className="w-full">
                Botão Secundário
              </Button>
              <Button variant="ghost" className="w-full">
                Botão Ghost
              </Button>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Info */}
      <div className="text-sm text-foreground-muted bg-background-alt/30 border border-border/30 rounded-lg p-4">
        <p>
          💡 <strong>Dica:</strong> O tema será salvo automaticamente e aplicado em todas as suas sessões.
        </p>
      </div>
      </div>
    </>
  )
}
