"use client"

import { useState, useEffect } from "react"
import { GlassCard } from "@/components/ui/glass-card"
import { THEMES, applyTheme, getCurrentThemeId } from "@/lib/themes"
import { Check, Palette } from "lucide-react"

export function ThemeSelector() {
  const [currentTheme, setCurrentTheme] = useState<string>('modern')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setCurrentTheme(getCurrentThemeId())
  }, [])

  const handleThemeChange = (themeId: string) => {
    applyTheme(themeId)
    setCurrentTheme(themeId)
  }

  if (!mounted) {
    return null
  }

  return (
    <GlassCard className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-primary rounded-lg">
          <Palette className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground">Tema de Cores</h3>
          <p className="text-sm text-foreground-muted">
            Escolha o esquema de cores do sistema
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {THEMES.map((theme) => (
          <button
            key={theme.id}
            onClick={() => handleThemeChange(theme.id)}
            className={`glass-card p-4 text-left hover:border-primary/50 transition-all group relative ${
              currentTheme === theme.id ? 'border-primary ring-2 ring-primary/20' : ''
            }`}
          >
            {/* Check icon */}
            {currentTheme === theme.id && (
              <div className="absolute top-3 right-3 bg-primary text-white rounded-full p-1">
                <Check className="h-4 w-4" />
              </div>
            )}

            {/* Theme preview gradient */}
            <div
              className="h-24 rounded-lg mb-4 relative overflow-hidden"
              style={{ background: theme.preview.gradient }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              <div className="absolute bottom-2 right-2 text-2xl">
                {theme.preview.icon}
              </div>
            </div>

            {/* Theme info */}
            <div>
              <h4 className="font-semibold text-foreground mb-1 flex items-center gap-2">
                {theme.name}
                {currentTheme === theme.id && (
                  <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded-full">
                    Ativo
                  </span>
                )}
              </h4>
              <p className="text-xs text-foreground-muted line-clamp-2">
                {theme.description}
              </p>
            </div>

            {/* Color swatches */}
            <div className="flex gap-2 mt-3">
              <div
                className="h-6 w-6 rounded-full border-2 border-white/20"
                style={{ 
                  background: `hsl(${theme.colors.primary})` 
                }}
                title="Primary"
              />
              <div
                className="h-6 w-6 rounded-full border-2 border-white/20"
                style={{ 
                  background: `hsl(${theme.colors.secondary})` 
                }}
                title="Secondary"
              />
              <div
                className="h-6 w-6 rounded-full border-2 border-white/20"
                style={{ 
                  background: `hsl(${theme.colors.accent})` 
                }}
                title="Accent"
              />
            </div>
          </button>
        ))}
      </div>

      <div className="mt-4 p-4 glass-card bg-primary/5 border-primary/20">
        <p className="text-xs text-foreground-muted">
          💡 <strong>Dica:</strong> O tema escolhido será aplicado em todo o sistema, 
          incluindo gradientes, botões e elementos destacados.
        </p>
      </div>
    </GlassCard>
  )
}

