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
            colorBgContainer: adminTheme === 'dark' ? '#1f1f1f' : '#ffffff',
            colorBgElevated: adminTheme === 'dark' ? '#141414' : '#ffffff',
            colorBorder:
              adminTheme === 'dark' ? 'rgba(255,255,255,0.1)' : '#e2e8f0',
            colorText: adminTheme === 'dark' ? '#ffffff' : '#1a1a1a',
            colorTextSecondary: adminTheme === 'dark' ? '#94a3b8' : '#64748b',
          },
        }}
      >
        <App>{children}</App>
      </ConfigProvider>
    </AdminThemeContext.Provider>
  )
}
