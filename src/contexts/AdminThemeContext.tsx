import React, { useEffect, useState } from 'react'
import { AdminThemeContext, AdminThemeMode } from './AdminThemeContextDef'
import { ConfigProvider, theme, App } from 'antd'

export const AdminThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Read from localStorage immediately to prevent flash of wrong theme
  const [adminTheme, setAdminThemeState] = useState<AdminThemeMode>(() => {
    const saved = localStorage.getItem(
      'admin-theme-preference'
    ) as AdminThemeMode | null
    return saved || 'dark'
  })

  // Apply theme on mount and when it changes
  useEffect(() => {
    applyAdminTheme(adminTheme)
  }, [adminTheme])

  const applyAdminTheme = (themeMode: AdminThemeMode) => {
    const root = document.documentElement
    // Remove both classes to ensure clean state
    root.classList.remove('dark', 'light')

    if (themeMode === 'light') {
      root.classList.add('light')
      root.setAttribute('data-theme', 'light')
      root.setAttribute('data-admin-theme', 'light')
      root.style.colorScheme = 'light'
    } else {
      root.classList.add('dark')
      root.setAttribute('data-theme', 'dark')
      root.setAttribute('data-admin-theme', 'dark')
      root.style.colorScheme = 'dark'
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
      <ConfigProvider
        theme={{
          algorithm:
            adminTheme === 'dark'
              ? theme.darkAlgorithm
              : theme.defaultAlgorithm,
          token: {
            colorBgContainer: adminTheme === 'dark' ? '#1f202a' : '#ffffff',
            colorBgElevated: adminTheme === 'dark' ? '#1f202a' : '#ffffff',
            colorBorder: adminTheme === 'dark' ? '#27272a' : '#e2e8f0',
            colorText: adminTheme === 'dark' ? '#f8fafc' : '#0f172a',
            colorTextSecondary: adminTheme === 'dark' ? '#94a3b8' : '#64748b',
          },
        }}
      >
        <App>{children}</App>
      </ConfigProvider>
    </AdminThemeContext.Provider>
  )
}
