import React, { useEffect, useState } from 'react'
import { AdminThemeContext, AdminThemeMode } from './AdminThemeContextDef'

export const AdminThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [adminTheme, setAdminThemeState] = useState<AdminThemeMode>('dark')

  // Load admin theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem(
      'admin-theme-preference'
    ) as AdminThemeMode | null
    if (savedTheme) {
      setAdminThemeState(savedTheme)
      applyAdminTheme(savedTheme)
    } else {
      applyAdminTheme('dark')
    }
  }, [])

  const applyAdminTheme = (theme: AdminThemeMode) => {
    const root = document.documentElement
    if (theme === 'light') {
      root.setAttribute('data-admin-theme', 'light')
    } else {
      root.setAttribute('data-admin-theme', 'dark')
    }
  }

  const setAdminTheme = (newMode: AdminThemeMode) => {
    setAdminThemeState(newMode)
    localStorage.setItem('admin-theme-preference', newMode)
    applyAdminTheme(newMode)
  }

  const toggleAdminTheme = () => {
    setAdminThemeState(prevTheme => {
      const newMode = prevTheme === 'dark' ? 'light' : 'dark'
      localStorage.setItem('admin-theme-preference', newMode)
      applyAdminTheme(newMode)
      return newMode
    })
  }

  return (
    <AdminThemeContext.Provider
      value={{ adminTheme, toggleAdminTheme, setAdminTheme }}
    >
      {children}
    </AdminThemeContext.Provider>
  )
}
