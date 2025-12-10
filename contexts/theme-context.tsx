"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { ThemeType, Theme as ColorTheme, getTheme, applyTheme } from '@/types/theme'

type Theme = "light" | "dark" | "system"

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: "light" | "dark"
  // Color theme management
  colorTheme: ColorTheme
  colorThemeId: ThemeType
  setColorTheme: (themeId: ThemeType) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system")
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("dark")
  const [mounted, setMounted] = useState(false)
  
  // Color theme state
  const [colorThemeId, setColorThemeId] = useState<ThemeType>('modern')

  useEffect(() => {
    setMounted(true)
    // Carregar tema salvo SOMENTE no cliente
    const savedTheme = (typeof window !== 'undefined' ? localStorage.getItem("theme") : null) as Theme | null
    if (savedTheme) {
      setThemeState(savedTheme)
    }
    
    // Carregar color theme salvo
    const savedColorTheme = (typeof window !== 'undefined' ? localStorage.getItem("color-theme") : null) as ThemeType | null
    if (savedColorTheme && ['modern', 'barber-classic', 'barber-premium'].includes(savedColorTheme)) {
      setColorThemeId(savedColorTheme)
    }
    
    // Atualizar resolvedTheme inicial
    if (typeof window !== 'undefined') {
      const initial = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      setResolvedTheme(initial)
    }
  }, [])

  useEffect(() => {
    if (!mounted) return

    const root = document.documentElement
    
    // Determinar tema resolvido
    let resolved: "light" | "dark" = "dark"
    
    if (theme === "system") {
      resolved = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    } else {
      resolved = theme
    }
    
    setResolvedTheme(resolved)
    
    // Aplicar tema
    root.classList.remove("light", "dark")
    root.classList.add(resolved)
    
    // Listener para mudanças no tema do sistema
    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
      const handleChange = (e: MediaQueryListEvent) => {
        const newResolved = e.matches ? "dark" : "light"
        setResolvedTheme(newResolved)
        root.classList.remove("light", "dark")
        root.classList.add(newResolved)
      }
      
      mediaQuery.addEventListener("change", handleChange)
      return () => mediaQuery.removeEventListener("change", handleChange)
    }
  }, [theme, mounted])

  // Apply color theme whenever it changes
  useEffect(() => {
    if (mounted) {
      const colorTheme = getTheme(colorThemeId)
      applyTheme(colorTheme)
    }
  }, [colorThemeId, mounted])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem("theme", newTheme)
  }

  const setColorTheme = (newThemeId: ThemeType) => {
    setColorThemeId(newThemeId)
    localStorage.setItem("color-theme", newThemeId)
  }

  const colorTheme = getTheme(colorThemeId)

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme, colorTheme, colorThemeId, setColorTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
