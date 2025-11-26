import React, { useEffect, useState } from 'react'
import { ThemeContext } from './ThemeContextValue'

type ThemeMode = 'light' | 'dark'

const getInitialTheme = (): ThemeMode => {
  if (typeof window === 'undefined') return 'dark'
  const stored = window.localStorage.getItem(
    'theme-preference'
  ) as ThemeMode | null
  if (stored === 'light' || stored === 'dark') return stored
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  return prefersDark ? 'dark' : 'light'
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setThemeState] = useState<ThemeMode>(getInitialTheme)

  useEffect(() => {
    const root = document.documentElement
    // Remove both classes to ensure clean state
    root.classList.remove('dark', 'light')
    // Add appropriate class
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.add('light')
    }
    // Also set data attribute for CSS selector support
    root.setAttribute('data-theme', theme)
    root.style.colorScheme = theme
    window.localStorage.setItem('theme-preference', theme)
  }, [theme])

  const setTheme = (mode: ThemeMode) => setThemeState(mode)
  const toggleTheme = () =>
    setThemeState(prev => (prev === 'dark' ? 'light' : 'dark'))

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
