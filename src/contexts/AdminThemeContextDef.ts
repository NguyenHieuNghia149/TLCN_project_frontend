import { createContext } from 'react'

export type AdminThemeMode = 'light' | 'dark'

export interface AdminThemeContextType {
  adminTheme: AdminThemeMode
  toggleAdminTheme: () => void
  setAdminTheme: (mode: AdminThemeMode) => void
}

export const AdminThemeContext = createContext<
  AdminThemeContextType | undefined
>(undefined)
