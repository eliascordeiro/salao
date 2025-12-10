export type ThemeType = 'modern' | 'barber-classic' | 'barber-premium'

export interface ThemeColors {
  primary: string
  primaryLight: string
  primaryDark: string
  secondary: string
  secondaryLight: string
  secondaryDark: string
  accent: string
  accentLight: string
  accentDark: string
  success: string
  warning: string
  error: string
  info: string
  background: string
  backgroundAlt: string
  foreground: string
  foregroundMuted: string
  border: string
  borderHover: string
}

export interface Theme {
  id: ThemeType
  name: string
  description: string
  colors: ThemeColors
  icon: string
}

export const themes: Record<ThemeType, Theme> = {
  'modern': {
    id: 'modern',
    name: 'Moderno',
    description: 'Design contemporâneo com cores vibrantes (padrão)',
    icon: '🎨',
    colors: {
      primary: '#EC4899', // Pink
      primaryLight: '#F9A8D4',
      primaryDark: '#BE185D',
      secondary: '#8B5CF6', // Purple
      secondaryLight: '#C4B5FD',
      secondaryDark: '#6D28D9',
      accent: '#06B6D4', // Cyan
      accentLight: '#67E8F9',
      accentDark: '#0E7490',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#3B82F6',
      background: '#FFFFFF',
      backgroundAlt: '#F9FAFB',
      foreground: '#111827',
      foregroundMuted: '#6B7280',
      border: '#E5E7EB',
      borderHover: '#D1D5DB',
    }
  },
  'barber-classic': {
    id: 'barber-classic',
    name: 'Barbearia Clássica',
    description: 'Inspirado no icônico poste listrado vermelho, branco e azul',
    icon: '🪒',
    colors: {
      primary: '#DC2626', // Vermelho
      primaryLight: '#F87171',
      primaryDark: '#991B1B',
      secondary: '#1E3A8A', // Azul marinho
      secondaryLight: '#3B82F6',
      secondaryDark: '#1E40AF',
      accent: '#D97706', // Dourado
      accentLight: '#FBBF24',
      accentDark: '#92400E',
      success: '#059669',
      warning: '#D97706',
      error: '#DC2626',
      info: '#2563EB',
      background: '#FFFFFF',
      backgroundAlt: '#F9FAFB',
      foreground: '#0F172A',
      foregroundMuted: '#475569',
      border: '#E2E8F0',
      borderHover: '#CBD5E1',
    }
  },
  'barber-premium': {
    id: 'barber-premium',
    name: 'Barbearia Premium',
    description: 'Elegância moderna com preto, dourado e borgonha',
    icon: '💎',
    colors: {
      primary: '#CA8A04', // Dourado
      primaryLight: '#FACC15',
      primaryDark: '#854D0E',
      secondary: '#18181B', // Preto
      secondaryLight: '#3F3F46',
      secondaryDark: '#09090B',
      accent: '#991B1B', // Borgonha
      accentLight: '#DC2626',
      accentDark: '#7F1D1D',
      success: '#059669',
      warning: '#D97706',
      error: '#991B1B',
      info: '#CA8A04',
      background: '#0F0F0F',
      backgroundAlt: '#1A1A1A',
      foreground: '#F5F5F4',
      foregroundMuted: '#A8A29E',
      border: '#27272A',
      borderHover: '#3F3F46',
    }
  }
}

export function getTheme(themeId: ThemeType): Theme {
  return themes[themeId]
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement
  
  // Apply colors as CSS variables
  root.style.setProperty('--primary', theme.colors.primary)
  root.style.setProperty('--primary-light', theme.colors.primaryLight)
  root.style.setProperty('--primary-dark', theme.colors.primaryDark)
  
  root.style.setProperty('--secondary', theme.colors.secondary)
  root.style.setProperty('--secondary-light', theme.colors.secondaryLight)
  root.style.setProperty('--secondary-dark', theme.colors.secondaryDark)
  
  root.style.setProperty('--accent', theme.colors.accent)
  root.style.setProperty('--accent-light', theme.colors.accentLight)
  root.style.setProperty('--accent-dark', theme.colors.accentDark)
  
  root.style.setProperty('--success', theme.colors.success)
  root.style.setProperty('--warning', theme.colors.warning)
  root.style.setProperty('--error', theme.colors.error)
  root.style.setProperty('--info', theme.colors.info)
  
  root.style.setProperty('--background', theme.colors.background)
  root.style.setProperty('--background-alt', theme.colors.backgroundAlt)
  root.style.setProperty('--foreground', theme.colors.foreground)
  root.style.setProperty('--foreground-muted', theme.colors.foregroundMuted)
  
  root.style.setProperty('--border', theme.colors.border)
  root.style.setProperty('--border-hover', theme.colors.borderHover)
  
  // Store in localStorage
  localStorage.setItem('theme', theme.id)
}
