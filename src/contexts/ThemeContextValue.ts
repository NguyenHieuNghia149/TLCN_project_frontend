import { createContext } from 'react'

type ThemeMode = 'light' | 'dark'

export interface ThemeContextValue {
  theme: ThemeMode
  toggleTheme: () => void
  setTheme: (mode: ThemeMode) => void
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(
  undefined
)
