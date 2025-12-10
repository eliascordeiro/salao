"use client"

import { useEffect, useState } from "react"
import { applyTheme, getCurrentThemeId } from "@/lib/themes"

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    // Load saved theme on mount
    const themeId = getCurrentThemeId()
    applyTheme(themeId)
  }, [])

  if (!mounted) {
    return <>{children}</>
  }

  return <>{children}</>
}
