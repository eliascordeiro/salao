export type ThemeConfig = {
  id: string
  name: string
  description: string
  colors: {
    primary: string
    primaryLight: string
    primaryDark: string
    secondary: string
    secondaryLight: string
    secondaryDark: string
    accent: string
    accentLight: string
    accentDark: string
  }
  preview: {
    gradient: string
    icon: string
  }
}

export const THEMES: ThemeConfig[] = [
  {
    id: 'modern',
    name: 'Moderno',
    description: 'Cores vibrantes com gradientes roxo e rosa',
    colors: {
      primary: '250 70% 60%',      // #6366f1 - Indigo
      primaryLight: '250 80% 70%',
      primaryDark: '250 70% 50%',
      secondary: '280 70% 65%',    // #a855f7 - Purple
      secondaryLight: '280 80% 75%',
      secondaryDark: '280 70% 55%',
      accent: '330 81% 60%',       // #ec4899 - Pink
      accentLight: '330 81% 70%',
      accentDark: '330 81% 50%',
    },
    preview: {
      gradient: 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)',
      icon: '🎨'
    }
  },
  {
    id: 'barber-classic',
    name: 'Barbearia Clássica',
    description: 'Inspirado no poste listrado tradicional',
    colors: {
      primary: '0 73% 41%',        // #b91c1c - Vermelho intenso
      primaryLight: '0 84% 60%',   // #ef4444
      primaryDark: '0 73% 31%',    // #991b1b
      secondary: '221 83% 53%',    // #3b82f6 - Azul royal
      secondaryLight: '221 91% 60%',
      secondaryDark: '221 83% 43%', // #1e3a8a
      accent: '43 96% 56%',        // #facc15 - Dourado
      accentLight: '43 96% 66%',
      accentDark: '43 96% 46%',    // #ca8a04
    },
    preview: {
      gradient: 'linear-gradient(135deg, #b91c1c 0%, #3b82f6 50%, #facc15 100%)',
      icon: '🪒'
    }
  },
  {
    id: 'barber-premium',
    name: 'Barbearia Premium',
    description: 'Elegância com preto, dourado e borgonha',
    colors: {
      primary: '43 96% 39%',       // #ca8a04 - Dourado vintage
      primaryLight: '43 96% 56%',  // #facc15
      primaryDark: '43 96% 29%',   // #a16207
      secondary: '0 84% 30%',      // #7f1d1d - Borgonha escuro
      secondaryLight: '0 73% 41%', // #991b1b
      secondaryDark: '0 84% 20%',  // #450a0a
      accent: '24 95% 53%',        // #f97316 - Laranja bronze
      accentLight: '24 95% 63%',
      accentDark: '24 95% 43%',    // #ea580c
    },
    preview: {
      gradient: 'linear-gradient(135deg, #ca8a04 0%, #7f1d1d 50%, #f97316 100%)',
      icon: '💎'
    }
  }
]

export function getTheme(themeId: string): ThemeConfig | undefined {
  return THEMES.find(theme => theme.id === themeId)
}

export function applyTheme(themeId: string) {
  const theme = getTheme(themeId)
  if (!theme) return

  const root = document.documentElement
  
  // Apply colors to CSS variables
  root.style.setProperty('--primary', theme.colors.primary)
  root.style.setProperty('--primary-light', theme.colors.primaryLight)
  root.style.setProperty('--primary-dark', theme.colors.primaryDark)
  
  root.style.setProperty('--secondary', theme.colors.secondary)
  root.style.setProperty('--secondary-light', theme.colors.secondaryLight)
  root.style.setProperty('--secondary-dark', theme.colors.secondaryDark)
  
  root.style.setProperty('--accent', theme.colors.accent)
  root.style.setProperty('--accent-light', theme.colors.accentLight)
  root.style.setProperty('--accent-dark', theme.colors.accentDark)
  
  // Save to localStorage
  localStorage.setItem('theme-id', themeId)
}

export function loadTheme() {
  if (typeof window === 'undefined') return
  
  const savedThemeId = localStorage.getItem('theme-id')
  if (savedThemeId) {
    applyTheme(savedThemeId)
  }
}

export function getCurrentThemeId(): string {
  if (typeof window === 'undefined') return 'modern'
  return localStorage.getItem('theme-id') || 'modern'
}
